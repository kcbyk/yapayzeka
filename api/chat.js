const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const API_MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
];
const ANTHROPIC_DEFAULT_MODEL = 'claude-opus-4-6-thinking';

const SYSTEM_PROMPT = `Sen Solenz AI adında, Türkçe konuşan yardımcı bir yapay zeka asistanısın.
Kısa, net, çözüm odaklı ve kullanıcıya yakın cevap ver.`;

const SKILL_LABELS = {
    'web-search': "Web'de Derin Arama",
    coding: 'Yazılım Geliştirme',
    'data-analysis': 'Veri Analizi'
};

const OFFICIAL_SOURCE_PATTERNS = [
    /\.gov(\.|\/|$)/i,
    /\.edu(\.|\/|$)/i,
    /\.ac\./i,
    /\.mil(\.|\/|$)/i,
    /\.int(\.|\/|$)/i,
    /(^|\.)who\.int$/i,
    /(^|\.)un\.org$/i,
    /(^|\.)europa\.eu$/i,
    /(^|\.)nasa\.gov$/i,
    /(^|\.)nih\.gov$/i,
    /(^|\.)cdc\.gov$/i,
    /(^|\.)developer\.mozilla\.org$/i,
    /(^|\.)docs\./i,
    /(^|\.)learn\.microsoft\.com$/i,
    /(^|\.)cloud\.google\.com$/i,
    /(^|\.)ai\.google\.dev$/i,
    /(^|\.)vercel\.com$/i,
    /(^|\.)github\.com$/i
];

function getApiKeys() {
    return (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '')
        .split(/[,\n]+/)
        .map((key) => key.trim())
        .filter(Boolean);
}

function getAnthropicConfig() {
    const baseUrl = (process.env.ANTHROPIC_BASE_URL || '').trim().replace(/\/+$/, '');
    const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    const model = (process.env.ANTHROPIC_MODEL || ANTHROPIC_DEFAULT_MODEL).trim();
    const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS || 4096);

    if (!baseUrl || !apiKey || !model) return null;

    const isLocalOnlyUrl = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(baseUrl);
    if (process.env.VERCEL && isLocalOnlyUrl) {
        console.warn('ANTHROPIC_BASE_URL localhost olarak ayarlı; Vercel bu adrese erişemez, Anthropic brain atlanıyor.');
        return null;
    }

    return {
        baseUrl,
        apiKey,
        model,
        maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 4096
    };
}

function normalizeSkills(skills) {
    if (!Array.isArray(skills)) return [];

    return skills
        .map((skill) => String(skill || '').trim())
        .filter((skill, index, list) => SKILL_LABELS[skill] && list.indexOf(skill) === index);
}

function decodeHtml(value = '') {
    return String(value)
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

function stripHtml(value = '') {
    return decodeHtml(String(value)
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim());
}

function getHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch (_) {
        return '';
    }
}

function getSourceScore(url) {
    const hostname = getHostname(url);
    if (!hostname) return 40;
    if (OFFICIAL_SOURCE_PATTERNS.some((pattern) => pattern.test(hostname) || pattern.test(url))) return 100;
    if (/\.org$/i.test(hostname)) return 85;
    if (/wikipedia\.org$/i.test(hostname)) return 80;
    if (/medium\.com$|blogspot\.|reddit\.com$|quora\.com$/i.test(hostname)) return 55;
    return 70;
}

function sourceScoreLabel(score) {
    if (score >= 100) return '100/100 resmi/otoriter kaynak';
    if (score >= 85) return `${score}/100 yüksek güven`;
    if (score >= 70) return `${score}/100 orta güven`;
    return `${score}/100 düşük güven`;
}

function resolveDuckDuckGoUrl(url) {
    try {
        const parsed = new URL(decodeHtml(url), 'https://duckduckgo.com');
        const uddg = parsed.searchParams.get('uddg');
        return uddg ? decodeURIComponent(uddg) : parsed.href;
    } catch (_) {
        return url;
    }
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

async function fetchDuckDuckGoHtmlResults(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
        const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'text/html',
                'User-Agent': 'Mozilla/5.0 SolenzAI/1.0'
            }
        });

        if (!response.ok) return [];

        const html = await response.text();
        const results = [];
        const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;

        while ((match = resultRegex.exec(html)) !== null && results.length < 8) {
            const url = resolveDuckDuckGoUrl(match[1]);
            results.push({
                title: stripHtml(match[2]),
                snippet: stripHtml(match[3]),
                url
            });
        }

        return results;
    } catch (_) {
        return [];
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchSourcePage(result) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(result.url, {
            signal: controller.signal,
            headers: {
                Accept: 'text/html,application/xhtml+xml',
                'User-Agent': 'Mozilla/5.0 SolenzAI/1.0'
            }
        });

        const contentType = response.headers.get('content-type') || '';
        if (!response.ok || !contentType.includes('text/html')) {
            return result;
        }

        const html = await response.text();
        const title = stripHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || result.title);
        const metaDescription = stripHtml((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '');
        const paragraphText = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
            .map((match) => stripHtml(match[1]))
            .filter((text) => text.length > 60)
            .slice(0, 4)
            .join(' ');

        return {
            ...result,
            title: title || result.title,
            snippet: [metaDescription, paragraphText, result.snippet]
                .filter(Boolean)
                .join(' ')
                .slice(0, 900)
        };
    } catch (_) {
        return result;
    } finally {
        clearTimeout(timeout);
    }
}

async function collectWebSources(query) {
    const [htmlResults, instantResults] = await Promise.all([
        fetchDuckDuckGoHtmlResults(query),
        fetchWebSearchResults(query)
    ]);

    const seen = new Set();
    const merged = [...htmlResults, ...instantResults]
        .filter((result) => result.url && result.snippet)
        .filter((result) => {
            const key = result.url.replace(/#.*$/, '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 8);

    const enriched = await Promise.all(merged.slice(0, 5).map(fetchSourcePage));

    return enriched
        .map((result) => ({
            ...result,
            score: getSourceScore(result.url)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

async function buildPrompt({ message, skills }) {
    const skillLines = [];
    const contextLines = [];

    if (skills.includes('web-search')) {
        skillLines.push("- Web'de Derin Arama aktif: Aşağıdaki web kaynaklarını kullan. Cevabın sonunda mutlaka 'Kaynaklar' bölümü yaz; her kaynak için URL ve güven puanını belirt. Resmi/otoriter kaynak 100/100 değilse kesin konuşma; 'kaynak güveni sınırlı' diye belirt. Kaynak yoksa uydurma bilgi verme.");

        const webResults = await collectWebSources(message);
        if (webResults.length > 0) {
            contextLines.push('WEBDE GEZİLEREK TOPLANAN KAYNAKLAR:');
            webResults.forEach((result, index) => {
                contextLines.push(`${index + 1}. ${result.title}`);
                contextLines.push(`   Güven puanı: ${sourceScoreLabel(result.score)}`);
                contextLines.push(`   Kaynak: ${result.url}`);
                contextLines.push(`   Alınan bilgi: ${result.snippet}`);
            });
        } else {
            contextLines.push('WEBDE GEZİLEREK TOPLANAN KAYNAKLAR: Güvenilir kaynak bulunamadı. Kullanıcıya kaynak bulunamadığını söyle ve kesin bilgi gibi sunma.');
        }
    }

    if (skills.includes('coding')) {
        skillLines.push('- Yazılım Geliştirme aktif: Claude benzeri ama birebir taklit olmayan bir mühendislik tarzı kullan: önce problemi doğru anladığını göster, sonra sade ve güvenilir çözüm ver; kodu temiz, küçük fonksiyonlara ayrılmış, okunabilir ve test edilebilir yaz; açıklamayı kısa başlıklar, net gerekçe, edge case ve test adımlarıyla yap; gereksiz uzun konuşma ve özgüvenli tahminden kaçın.');
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

async function callAnthropicBrain({ config, message }) {
    const messagesUrl = config.baseUrl.endsWith('/v1')
        ? `${config.baseUrl}/messages`
        : `${config.baseUrl}/v1/messages`;

    const response = await fetch(messagesUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
            Authorization: `Bearer ${config.apiKey}`,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: config.model,
            max_tokens: config.maxTokens,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: 'user',
                    content: message
                }
            ]
        })
    });

    const data = await response.json().catch(() => ({}));
    const text = Array.isArray(data.content)
        ? data.content
            .map((part) => part?.text || '')
            .filter(Boolean)
            .join('\n')
            .trim()
        : data.completion || data.text || '';

    if (response.ok && text) {
        return { ok: true, text };
    }

    return {
        ok: false,
        status: response.status,
        errorMessage: data?.error?.message || data?.message || `Anthropic brain HTTP ${response.status}`
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

    const anthropicConfig = getAnthropicConfig();
    const apiKeys = getApiKeys();
    if (!anthropicConfig && apiKeys.length === 0) {
        return res.status(200).json({
            text: createFallbackAnswer(message, skills),
            offline: true
        });
    }

    const prompt = await buildPrompt({ message, skills });
    let lastError = '';

    if (anthropicConfig) {
        for (let retryCount = 0; retryCount < 2; retryCount++) {
            try {
                const result = await callAnthropicBrain({
                    config: anthropicConfig,
                    message: prompt
                });

                if (result.ok) {
                    return res.status(200).json({
                        text: result.text,
                        provider: 'anthropic-compatible',
                        model: anthropicConfig.model,
                        skills
                    });
                }

                lastError = result.errorMessage;
                if (result.status >= 500 && retryCount === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                }
                break;
            } catch (error) {
                lastError = error.message || 'Anthropic brain bağlantısı kurulamadı';
                if (retryCount === 0) {
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                }
            }
        }

        console.warn('Anthropic brain yanıt vermedi, Gemini fallback deneniyor:', lastError);
    }

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
