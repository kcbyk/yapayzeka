const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const API_MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
];

const SYSTEM_PROMPT = `Sen Solenz AI adında, Türkçe konuşan yardımcı bir yapay zeka asistanısın.
Kısa, net, çözüm odaklı ve kullanıcıya yakın cevap ver.`;

function getApiKeys() {
    return (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
        .split(/[,\n]+/)
        .map((key) => key.trim())
        .filter(Boolean);
}

function createFallbackAnswer(userText) {
    const cleanText = String(userText || '').trim();

    if (/^(merhaba|selam|sa|slm|hello|hi)\b/i.test(cleanText)) {
        return 'Merhaba! Buradayım. Ne yapmak istediğini yaz, birlikte çözelim.';
    }

    if (/kod|hata|bug|site|api|yazılım|script|html|css|javascript/i.test(cleanText)) {
        return `İsteğini aldım: "${cleanText}"\n\nŞu an dış AI servisi yanıt vermese bile yardımcı olmaya devam edebilirim. Dosya adını, ekrandaki mesajı ve beklediğin sonucu yaz; adım adım çözüm çıkarayım.`;
    }

    return `İsteğini aldım: "${cleanText}"\n\nŞu an dış AI servisi yanıt vermediği için kısa modda cevaplıyorum. Konuyu biraz daha detaylandırırsan sana net bir yanıt hazırlayayım.`;
}

async function readBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;

    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch (_) {
            return {};
        }
    }

    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (chunk) => {
            raw += chunk;
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(raw || '{}'));
            } catch (_) {
                resolve({});
            }
        });
        req.on('error', () => resolve({}));
    });
}

async function callGemini({ apiKey, modelName, message }) {
    const response = await fetch(`${API_BASE_URL}/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: message }]
                }
            ]
        })
    });

    const data = await response.json().catch(() => ({}));
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (response.ok && text) {
        return { ok: true, text };
    }

    const errorStatus = data?.error?.status || '';
    const errorMessage = data?.error?.message || '';

    return {
        ok: false,
        status: response.status,
        errorStatus,
        errorMessage
    };
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(200).json({ text: 'Mesaj yazınca cevap verebilirim.' });
    }

    const body = await readBody(req);
    const message = String(body.message || '').trim();

    if (!message) {
        return res.status(200).json({ text: 'Mesajını yaz, hemen cevaplayayım.' });
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
        return res.status(200).json({
            text: createFallbackAnswer(message),
            offline: true
        });
    }

    let lastError = '';

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        let moveToNextKey = false;

        for (const modelName of API_MODELS) {
            for (let retryCount = 0; retryCount < 3; retryCount++) {
                try {
                    const result = await callGemini({
                        apiKey: apiKeys[keyIndex],
                        modelName,
                        message
                    });

                    if (result.ok) {
                        return res.status(200).json({
                            text: result.text,
                            keyIndex,
                            model: modelName
                        });
                    }

                    lastError = result.errorMessage || result.errorStatus || `HTTP ${result.status}`;

                    const keyProblem =
                        result.status === 429 ||
                        result.status === 403 ||
                        result.errorStatus === 'RESOURCE_EXHAUSTED' ||
                        /quota|rate limit|api key|permission|leaked/i.test(result.errorMessage);

                    if (result.status >= 500 && retryCount < 2) {
                        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
                        continue;
                    }

                    if (keyProblem) {
                        moveToNextKey = true;
                    }

                    break;
                } catch (error) {
                    lastError = error.message || 'Bağlantı kurulamadı';
                    if (retryCount < 2) {
                        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
                        continue;
                    }
                    break;
                }
            }

            if (moveToNextKey) break;
        }
    }

    console.warn('Gemini cevap vermedi, yedek yanıt kullanılıyor:', lastError);
    return res.status(200).json({
        text: createFallbackAnswer(message),
        offline: true
    });
};
