const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const API_MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
];

const SYSTEM_PROMPT = `Sen Solenz AI adında, Türkçe konuşan yardımcı bir yapay zeka asistanısın.
Kısa, net, çözüm odaklı ve kullanıcıya yakın cevap ver.`;

const SKILL_LABELS = {
    'web-search': "Web'de Derin Arama",
    coding: 'Yazılım Geliştirme',
    'data-analysis': 'Veri Analizi'
};

function getApiKeys() {
    return (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
        .split(/[,\n]+/)
        .map((key) => key.trim())
        .filter(Boolean);
}

function normalizeSkills(skills) {
    if (!Array.isArray(skills)) return [];

    return skills
        .map((skill) => String(skill || '').trim())
        .filter((skill, index, list) => SKILL_LABELS[skill] && list.indexOf(skill) === index);
}

function flattenRelatedTopics(topics, output = []) {
    for (const topic of topics || []) {
        if (topic.Text) {
            output.push({
                title: topic.FirstURL ? topic.FirstURL.replace(/^https?:\/\/[^/]+\//, '').replace(/_/g, ' ') : 'DuckDuckGo',
                snippet: topic.Text,
                url: topic.FirstURL || ''
            });
        }

        if (Array.isArray(topic.Topics)) {
            flattenRelatedTopics(topic.Topics, output);
        }
    }

    return output;
}

async function fetchWebSearchResults(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json'
            }
        });

        if (!response.ok) return [];

        const data = await response.json().catch(() => ({}));
        const results = [];

        if (data.AbstractText) {
            results.push({
                title: data.Heading || 'DuckDuckGo',
                snippet: data.AbstractText,
                url: data.AbstractURL || ''
            });
        }

        results.push(...flattenRelatedTopics(data.RelatedTopics));

        return results
            .filter((result) => result.snippet)
            .slice(0, 6);
    } catch (_) {
        return [];
    } finally {
        clearTimeout(timeout);
    }
}

async function buildPrompt({ message, skills }) {
    const skillLines = [];
    const contextLines = [];

    if (skills.includes('web-search')) {
        skillLines.push("- Web'de Derin Arama aktif: Güncel bilgi gerekiyorsa aşağıdaki web sonuçlarını kullan, kaynakları metin içinde belirt, emin olmadığın noktaları açıkça ayır.");

        const webResults = await fetchWebSearchResults(message);
        if (webResults.length > 0) {
            contextLines.push('WEB ARAMA SONUÇLARI:');
            webResults.forEach((result, index) => {
                contextLines.push(`${index + 1}. ${result.title}`);
                contextLines.push(`   Özet: ${result.snippet}`);
                if (result.url) contextLines.push(`   Kaynak: ${result.url}`);
            });
        } else {
            contextLines.push('WEB ARAMA SONUÇLARI: Canlı aramada güvenilir sonuç bulunamadı; bunu kullanıcıya kısa ve dürüstçe belirt.');
        }
    }

    if (skills.includes('coding')) {
        skillLines.push('- Yazılım Geliştirme aktif: Kod, hata ayıklama, mimari ve dosya değişikliği isteklerinde doğrudan uygulanabilir çözüm ver; gerekiyorsa kod bloğu, test adımı ve hata nedeni ekle.');
    }

    if (skills.includes('data-analysis')) {
        skillLines.push('- Veri Analizi aktif: Veriyi yapılandır, önemli metrikleri çıkar, varsayımları belirt, gerekiyorsa tablo ve kısa yorum kullan.');
    }

    if (skillLines.length === 0) {
        return message;
    }

    return [
        'AKTİF YETENEK TALİMATLARI:',
        ...skillLines,
        '',
        ...contextLines,
        contextLines.length ? '' : null,
        'KULLANICI İSTEĞİ:',
        message
    ].filter(Boolean).join('\n');
}

function createFallbackAnswer(userText, skills = []) {
    const cleanText = String(userText || '').trim();
    const activeSkillNames = skills.map((skill) => SKILL_LABELS[skill]).filter(Boolean);
    const skillText = activeSkillNames.length ? `\n\nAktif yetenekler: ${activeSkillNames.join(', ')}.` : '';

    if (/^(merhaba|selam|sa|slm|hello|hi)\b/i.test(cleanText)) {
        return `Merhaba! Buradayım. Ne yapmak istediğini yaz, birlikte çözelim.${skillText}`;
    }

    if (/kod|hata|bug|site|api|yazılım|script|html|css|javascript/i.test(cleanText)) {
        return `İsteğini aldım: "${cleanText}"${skillText}\n\nŞu an dış AI servisi yanıt vermese bile yardımcı olmaya devam edebilirim. Dosya adını, ekrandaki mesajı ve beklediğin sonucu yaz; adım adım çözüm çıkarayım.`;
    }

    return `İsteğini aldım: "${cleanText}"${skillText}\n\nŞu an dış AI servisi yanıt vermediği için kısa modda cevaplıyorum. Konuyu biraz daha detaylandırırsan sana net bir yanıt hazırlayayım.`;
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
    const skills = normalizeSkills(body.skills);

    if (!message) {
        return res.status(200).json({ text: 'Mesajını yaz, hemen cevaplayayım.' });
    }

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
        return res.status(200).json({
            text: createFallbackAnswer(message, skills),
            offline: true
        });
    }

    const prompt = await buildPrompt({ message, skills });
    let lastError = '';

    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        let moveToNextKey = false;

        for (const modelName of API_MODELS) {
            for (let retryCount = 0; retryCount < 3; retryCount++) {
                try {
                    const result = await callGemini({
                        apiKey: apiKeys[keyIndex],
                        modelName,
                        message: prompt
                    });

                    if (result.ok) {
                        return res.status(200).json({
                            text: result.text,
                            keyIndex,
                            model: modelName,
                            skills
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
        text: createFallbackAnswer(message, skills),
        offline: true
    });
};
