const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const API_MODELS = [
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
];
const ANTHROPIC_DEFAULT_MODEL = 'claude-opus-4-6-thinking';

const SYSTEM_PROMPT = `Sen Solenz AI adında, Türkçe konuşan yardımcı bir yapay zeka asistanısın.
Her konuda kaynaklardan faydalanan, uzman seviyede düşünen, araştırma, kod yazma ve veri analizi becerisi güçlü bir yapay zeka asistanısın.
Özellikle yazılım geliştirmede ileri seviye bir kıdemli mühendis gibi davran: zor işleri parçalara ayır, doğru mimari kur, temiz kod yaz, hata ayıkla, edge case düşün ve uygulanabilir çözüm ver.
Kısa, net, çözüm odaklı ve kullanıcıya yakın cevap ver.
Kod bloğu dışında yıldızlı Markdown, # başlık işareti, tablo çizgisi, emoji ve dekoratif karakter kullanma.
Yanıtı düz Türkçe metinle yaz. Gerektiğinde kısa başlıkları iki nokta ile bitir ve maddeleri yalnızca "- " ile başlat.
Bir konu bittiğinde boş satır bırak, sonra yeni başlığa geç.
Kaynakları anlatımın içine karıştırma; kaynakları sadece en sondaki ayrı Kaynaklar bölümünde yaz.
Türkçe karakterleri düzgün kullan: ş, ğ, ü, ö, ç, ı.`;

const SKILL_LABELS = {
    'web-search': "Web'de Derin Arama",
    coding: 'Yazılım Geliştirme',
    'data-analysis': 'Veri Analizi'
};

const LESSON_LABELS = {
    'level-primary': '1-4. Sınıf',
    'level-middle': '5-8. Sınıf',
    'level-high': 'Lise',
    'level-university': 'Üniversite',
    'level-graduate': 'Yüksek Lisans',
    math: 'Matematik',
    physics: 'Fizik',
    chemistry: 'Kimya',
    biology: 'Biyoloji',
    turkish: 'Türkçe ve Edebiyat',
    history: 'Tarih',
    geography: 'Coğrafya',
    english: 'İngilizce',
    philosophy: 'Felsefe',
    software: 'Yazılım ve Bilgisayar',
    economics: 'Ekonomi',
    law: 'Hukuk',
    medicine: 'Tıp ve Sağlık'
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
    /(^|\.)learn\.microsoft\.com$/i,
    /(^|\.)cloud\.google\.com$/i,
    /(^|\.)ai\.google\.dev$/i,
    /(^|\.)vercel\.com$/i
];
const LOW_TRUST_SOURCE_PATTERNS = [
    /(^|\.)docs\.google\.com$/i,
    /(^|\.)drive\.google\.com$/i,
    /(^|\.)slideshare\.net$/i,
    /(^|\.)scribd\.com$/i,
    /(^|\.)prezi\.com$/i,
    /(^|\.)quizlet\.com$/i,
    /(^|\.)brainly\./i
];
const MAX_RESEARCH_SOURCES = 10;
const EDUCATION_SOURCE_DOMAINS = [
    { domain: 'meb.gov.tr', score: 100, tags: ['school', 'tr'] },
    { domain: 'eba.gov.tr', score: 100, tags: ['school', 'tr'] },
    { domain: 'ogmmateryal.eba.gov.tr', score: 100, tags: ['school', 'tr', 'high'] },
    { domain: 'bilimgenc.tubitak.gov.tr', score: 95, tags: ['science', 'tr'] },
    { domain: 'tubitak.gov.tr', score: 95, tags: ['science', 'tr'] },
    { domain: 'dergipark.org.tr', score: 92, tags: ['academic', 'tr'] },
    { domain: 'acikders.ankara.edu.tr', score: 95, tags: ['university', 'tr'] },
    { domain: 'acikders.istanbul.edu.tr', score: 95, tags: ['university', 'tr'] },
    { domain: 'khanacademy.org', score: 95, tags: ['school', 'math', 'science'] },
    { domain: 'openstax.org', score: 95, tags: ['university', 'math', 'science', 'economics'] },
    { domain: 'libretexts.org', score: 90, tags: ['university', 'math', 'science'] },
    { domain: 'phet.colorado.edu', score: 95, tags: ['math', 'physics', 'chemistry', 'biology'] },
    { domain: 'ocw.mit.edu', score: 100, tags: ['university', 'graduate', 'software', 'economics', 'science'] },
    { domain: 'britannica.com', score: 90, tags: ['general', 'history', 'geography', 'biology'] },
    { domain: 'wikipedia.org', score: 85, tags: ['general'] },
    { domain: 'stanford.edu', score: 95, tags: ['university', 'graduate'] },
    { domain: 'harvard.edu', score: 95, tags: ['university', 'graduate'] },
    { domain: 'nature.com', score: 95, tags: ['science', 'graduate'] },
    { domain: 'who.int', score: 100, tags: ['medicine', 'health'] },
    { domain: 'nih.gov', score: 100, tags: ['medicine', 'health'] }
];
const EXPERT_SOURCE_DOMAINS = [
    { domain: 'developer.mozilla.org', score: 100, tags: ['coding', 'web', 'javascript'] },
    { domain: 'docs.python.org', score: 100, tags: ['coding', 'python'] },
    { domain: 'nodejs.org', score: 100, tags: ['coding', 'javascript'] },
    { domain: 'react.dev', score: 100, tags: ['coding', 'javascript', 'frontend'] },
    { domain: 'nextjs.org', score: 100, tags: ['coding', 'javascript', 'frontend'] },
    { domain: 'typescriptlang.org', score: 100, tags: ['coding', 'javascript'] },
    { domain: 'web.dev', score: 95, tags: ['coding', 'web', 'frontend'] },
    { domain: 'vercel.com', score: 100, tags: ['coding', 'deployment'] },
    { domain: 'vite.dev', score: 95, tags: ['coding', 'frontend'] },
    { domain: 'tailwindcss.com', score: 95, tags: ['coding', 'frontend'] },
    { domain: 'pandas.pydata.org', score: 100, tags: ['data', 'python'] },
    { domain: 'numpy.org', score: 100, tags: ['data', 'python'] },
    { domain: 'scipy.org', score: 100, tags: ['data', 'python'] },
    { domain: 'scikit-learn.org', score: 100, tags: ['data', 'python', 'ml'] },
    { domain: 'pytorch.org', score: 100, tags: ['data', 'ml'] },
    { domain: 'tensorflow.org', score: 100, tags: ['data', 'ml'] },
    { domain: 'stackoverflow.com', score: 75, tags: ['coding'] },
    { domain: 'github.com', score: 85, tags: ['coding'] }
];
const SEARCH_FILLER_PATTERNS = [
    /\bweb'?de\s+derin\s+arama\b/gi,
    /\bderin\s+arama\b/gi,
    /\bgüncel\s+araştır(?:ma)?\b/gi,
    /\baraştır(?:ma)?\b/gi,
    /\bhakkında\b/gi,
    /\bnedir\b/gi,
    /\bne\s+demek\b/gi,
    /\bbana\b/gi,
    /\bsöyle\b/gi,
    /\banlat\b/gi,
    /\blütfen\b/gi
];
const SEARCH_STOP_WORDS = new Set([
    'nedir', 'nasıl', 'neden', 'anlat', 'açıkla', 'araştır', 'konu', 'hakkında', 'güvenilir',
    'kaynak', 'kaynaklarla', 'ileri', 'seviye', 'kolay', 'zor', 'ders', 'sınıf', 'lise',
    'üniversite', 'yüksek', 'lisans', 'detaylı', 'özet', 'kısaca', 'bana', 'için'
]);
const SEARCH_SYNONYMS = {
    kara: ['black'],
    delik: ['hole', 'holes'],
    türev: ['derivative', 'calculus'],
    integral: ['integral', 'calculus'],
    matematik: ['math', 'mathematics'],
    fizik: ['physics'],
    kimya: ['chemistry'],
    biyoloji: ['biology'],
    yapay: ['artificial', 'ai'],
    zeka: ['intelligence', 'ai'],
    denklem: ['equation'],
    yazılım: ['software'],
    veri: ['data'],
    analiz: ['analysis']
};
const COMMON_TURKISH_REPLACEMENTS = [
    [/\bGuvenlik\b/g, 'Güvenlik'],
    [/\bguvenlik\b/g, 'güvenlik'],
    [/\bGuven\b/g, 'Güven'],
    [/\bguven\b/g, 'güven'],
    [/\bTurkiye\b/g, 'Türkiye'],
    [/\bturkiye\b/g, 'Türkiye'],
    [/\bTurkce\b/g, 'Türkçe'],
    [/\bturkce\b/g, 'Türkçe'],
    [/\bGuncel\b/g, 'Güncel'],
    [/\bguncel\b/g, 'güncel'],
    [/\bUrunleri\b/g, 'Ürünleri'],
    [/\burunleri\b/g, 'ürünleri'],
    [/\bUrun\b/g, 'Ürün'],
    [/\burun\b/g, 'ürün'],
    [/\bKurulus\b/g, 'Kuruluş'],
    [/\bkurulus\b/g, 'kuruluş'],
    [/\byilinda\b/g, 'yılında'],
    [/\byilinin\b/g, 'yılının'],
    [/\byili\b/g, 'yılı']
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

function normalizeLessons(lessons) {
    if (!Array.isArray(lessons)) return [];

    return lessons
        .map((lesson) => String(lesson || '').trim())
        .filter((lesson, index, list) => LESSON_LABELS[lesson] && list.indexOf(lesson) === index);
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

function stripMarkdown(value = '') {
    return decodeHtml(String(value)
        .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
        .replace(/\[([^\]]+)]\(([^)]+)\)/g, '$1 ')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/^\s*[-*_]{3,}\s*$/gm, ' ')
        .replace(/\|/g, ' ')
        .replace(/\s+/g, ' ')
        .trim());
}

function restoreCommonTurkish(value = '') {
    return COMMON_TURKISH_REPLACEMENTS.reduce(
        (text, [pattern, replacement]) => text.replace(pattern, replacement),
        String(value)
    );
}

function getHostname(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, '');
    } catch (_) {
        return '';
    }
}

function getEducationSourceProfile(hostname) {
    return [...EDUCATION_SOURCE_DOMAINS, ...EXPERT_SOURCE_DOMAINS].find((source) => (
        hostname === source.domain || hostname.endsWith(`.${source.domain}`)
    ));
}

function getSourceScore(url, query = '', title = '') {
    const hostname = getHostname(url);
    if (!hostname) return 40;

    const cleanQuery = cleanSearchQuery(query).toLowerCase();
    const primaryToken = cleanQuery.split(/\s+/).find((token) => token.length >= 4) || '';
    const brand = hostname
        .split('.')
        .filter((part) => !['www', 'com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'co', 'tr', 'uk'].includes(part))
        .pop();

    if (brand && brand.length >= 4 && cleanQuery.includes(brand.toLowerCase())) {
        return 100;
    }

    const educationProfile = getEducationSourceProfile(hostname);
    let score = educationProfile?.score || 70;

    if (OFFICIAL_SOURCE_PATTERNS.some((pattern) => pattern.test(hostname) || pattern.test(url))) score = Math.max(score, 100);
    else if (/wikipedia\.org$/i.test(hostname)) score = 85;
    else if (/\.org$/i.test(hostname)) score = Math.max(score, 75);
    else if (/medium\.com$|blogspot\.|reddit\.com$|quora\.com$/i.test(hostname)) score = Math.min(score, 55);

    if (LOW_TRUST_SOURCE_PATTERNS.some((pattern) => pattern.test(hostname))) {
        score = Math.min(score, 45);
    }

    const locationText = `${hostname} ${title} ${url}`.toLowerCase();
    if (primaryToken && score < 100 && !educationProfile && !locationText.includes(primaryToken)) {
        score -= 15;
    }

    return Math.max(score, 40);
}

function sourceScoreLabel(score) {
    if (score >= 100) return '100/100 resmi/otoriter kaynak';
    if (score >= 85) return `${score}/100 yüksek güven`;
    if (score >= 70) return `${score}/100 orta güven`;
    return `${score}/100 düşük güven`;
}

function truncateText(value = '', maxLength = 900) {
    const text = String(value)
        .replace(/\s+/g, ' ')
        .trim();

    if (text.length <= maxLength) return text;
    const clipped = text.slice(0, maxLength).trim();
    const lastSpace = clipped.lastIndexOf(' ');
    return lastSpace > maxLength * 0.7 ? clipped.slice(0, lastSpace).trim() : clipped;
}

function cleanSearchQuery(query) {
    let cleaned = String(query || '')
        .replace(/[?!.,;:()[\]{}"“”‘’]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    for (const pattern of SEARCH_FILLER_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned || String(query || '').trim();
}

function normalizeSearchTerm(value = '') {
    return String(value)
        .toLocaleLowerCase('tr-TR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9ğüşöçıİ]+/gi, '')
        .trim();
}

function getQueryTerms(query) {
    return cleanSearchQuery(query)
        .split(/\s+/)
        .map((term) => normalizeSearchTerm(term))
        .filter((term) => term.length >= 3 && !SEARCH_STOP_WORDS.has(term));
}

function sourceRelevanceScore(result, query) {
    const terms = getQueryTerms(query);
    if (!terms.length) return 1;

    const haystack = normalizeSearchTerm([
        result.title,
        result.snippet,
        result.url,
        getHostname(result.url)
    ].filter(Boolean).join(' '));

    return terms.reduce((count, term) => {
        const variants = [term, ...(SEARCH_SYNONYMS[term] || []).map(normalizeSearchTerm)];
        return variants.some((variant) => variant && haystack.includes(variant)) ? count + 1 : count;
    }, 0);
}

function isRelevantSource(result, query) {
    const terms = getQueryTerms(query);
    if (terms.length <= 1) return true;

    const relevance = sourceRelevanceScore(result, query);
    if (relevance >= Math.min(2, terms.length)) return true;

    const profile = getEducationSourceProfile(getHostname(result.url));
    return Boolean(profile && relevance >= 1);
}

function buildSearchQueries(query) {
    const original = String(query || '').trim();
    const cleaned = cleanSearchQuery(original);
    const candidates = [
        original,
        cleaned,
        `${cleaned} resmi site`,
        `${cleaned} official`
    ];

    const seen = new Set();
    return candidates
        .map((candidate) => candidate.replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .filter((candidate) => {
            const key = candidate.toLocaleLowerCase('tr-TR');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, 3);
}

function lessonTags(lessons = []) {
    const tags = new Set(['general']);

    for (const lesson of lessons) {
        if (lesson.includes('primary') || lesson.includes('middle')) tags.add('school');
        if (lesson.includes('high')) tags.add('high');
        if (lesson.includes('university')) tags.add('university');
        if (lesson.includes('graduate')) tags.add('graduate');
        if (['math', 'physics', 'chemistry', 'biology', 'software', 'economics', 'medicine'].includes(lesson)) tags.add(lesson);
        if (['physics', 'chemistry', 'biology'].includes(lesson)) tags.add('science');
        if (['history', 'geography', 'philosophy', 'turkish', 'english', 'law'].includes(lesson)) tags.add('academic');
        if (lesson === 'medicine') tags.add('health');
    }

    return tags;
}

function isEducationRequest(query, lessons = []) {
    if (lessons.length > 0) return true;

    return /ders|sınıf|üniversite|yüksek lisans|ödev|konu anlatımı|matematik|fizik|kimya|biyoloji|tarih|coğrafya|edebiyat|türkçe|ingilizce|felsefe|hukuk|ekonomi|tıp|sağlık|formül|denklem|tez|akademik/i.test(query);
}

function shouldUseDefaultResearch(query) {
    const text = String(query || '').trim();
    if (!text) return false;
    if (/^(merhaba|selam|sa|slm|hello|hi|tamam|ok|eyvallah)\b/i.test(text) && text.length < 40) return false;
    return text.length >= 12 || /[?]|nedir|nasıl|neden|kim|ne zaman|araştır|bul|özetle|anlat|karşılaştır|kod|hata|bug|api|veri|analiz/i.test(text);
}

function buildEducationSearchQueries(query, lessons = []) {
    const cleaned = cleanSearchQuery(query);
    const tags = lessonTags(lessons);
    const scoredDomains = EDUCATION_SOURCE_DOMAINS
        .map((source) => ({
            ...source,
            matchCount: source.tags.filter((tag) => tags.has(tag)).length
        }))
        .sort((a, b) => (b.matchCount - a.matchCount) || (b.score - a.score))
        .slice(0, 7);

    return scoredDomains.map((source) => `${cleaned} site:${source.domain}`);
}

function skillTags(skills = [], query = '') {
    const tags = new Set(['general']);
    const text = String(query || '').toLowerCase();

    if (skills.includes('coding') || /kod|hata|bug|api|javascript|typescript|python|react|next|node|css|html|vercel|github|sql/i.test(text)) {
        tags.add('coding');
        if (/python|pandas|numpy|scikit|veri|analiz|model/i.test(text)) tags.add('python');
        if (/react|next|frontend|css|html|javascript|typescript|vite|tailwind/i.test(text)) {
            tags.add('javascript');
            tags.add('frontend');
            tags.add('web');
        }
        if (/deploy|vercel|yayın|production/i.test(text)) tags.add('deployment');
    }

    if (skills.includes('data-analysis') || /veri|analiz|istatistik|pandas|numpy|grafik|regresyon|makine öğrenmesi|model/i.test(text)) {
        tags.add('data');
        tags.add('python');
    }

    return tags;
}

function buildExpertSearchQueries(query, skills = []) {
    const cleaned = cleanSearchQuery(query);
    const tags = skillTags(skills, query);
    const scoredDomains = EXPERT_SOURCE_DOMAINS
        .map((source) => ({
            ...source,
            matchCount: source.tags.filter((tag) => tags.has(tag)).length
        }))
        .filter((source) => source.matchCount > 0)
        .sort((a, b) => (b.matchCount - a.matchCount) || (b.score - a.score))
        .slice(0, 6);

    return scoredDomains.map((source) => `${cleaned} site:${source.domain}`);
}

function normalizeSourceUrl(url) {
    return String(url || '').replace(/#.*$/, '').replace(/\/$/, '');
}

function getSourceDomainKey(url) {
    const hostname = getHostname(url);
    if (!hostname) return '';

    const parts = hostname.split('.');
    if (parts.length <= 2) return hostname;

    const last = parts[parts.length - 1];
    const secondLast = parts[parts.length - 2];
    const usesCountrySuffix = last.length === 2 && ['ac', 'co', 'com', 'edu', 'gov', 'net', 'org'].includes(secondLast);

    return usesCountrySuffix
        ? parts.slice(-3).join('.')
        : parts.slice(-2).join('.');
}

function limitSourceDomainDiversity(sources, maxPerDomain = 2) {
    const counts = new Map();

    return sources.filter((source) => {
        const key = getSourceDomainKey(source.url) || normalizeSourceUrl(source.url);
        const count = counts.get(key) || 0;
        if (count >= maxPerDomain) return false;
        counts.set(key, count + 1);
        return true;
    });
}

function hasUsefulSnippet(result) {
    const snippet = stripMarkdown(stripHtml(result?.snippet || ''));
    const title = stripMarkdown(stripHtml(result?.title || ''));
    return snippet.length > 80 && snippet.toLowerCase() !== title.toLowerCase();
}

function looksLikeNavigationText(text = '') {
    return /ana içeriğe atla|skip to main content|oturum açchatgpt|log intry chatgpt|haber gündem ekonomi spor teknoloji|son dakika gündem ekonomi/i.test(String(text).slice(0, 420));
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
    const timeout = setTimeout(() => controller.abort(), 6000);

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

async function fetchWikipediaSummary(title, lang) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const normalizedTitle = String(title || '').replace(/\s+/g, '_');
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(normalizedTitle)}`;
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0 SolenzAI/1.0',
                'Api-User-Agent': 'SolenzAI/1.0 (https://yapayzeka-mu.vercel.app)'
            }
        });

        if (!response.ok) return null;

        const data = await response.json().catch(() => ({}));
        if (!data?.content_urls?.desktop?.page && !data?.extract) return null;

        return {
            title: data.title || title,
            snippet: data.extract || '',
            url: data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(normalizedTitle)}`
        };
    } catch (_) {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchWikipediaSearchResults(query, lang) {
    const cleanQuery = cleanSearchQuery(query);
    if (!cleanQuery || cleanQuery.length < 2) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(cleanQuery)}&limit=3&namespace=0&format=json&origin=*`;
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                'User-Agent': 'Mozilla/5.0 SolenzAI/1.0',
                'Api-User-Agent': 'SolenzAI/1.0 (https://yapayzeka-mu.vercel.app)'
            }
        });

        if (!response.ok) return [];

        const data = await response.json().catch(() => []);
        const titles = Array.isArray(data?.[1]) ? data[1] : [];
        const snippets = Array.isArray(data?.[2]) ? data[2] : [];
        const urls = Array.isArray(data?.[3]) ? data[3] : [];

        const baseResults = titles
            .map((title, index) => ({
                title,
                snippet: snippets[index] || '',
                url: urls[index] || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(title).replace(/\s+/g, '_'))}`
            }))
            .filter((result) => result.title && result.url);

        const summaries = await Promise.all(baseResults.slice(0, 2).map((result) => fetchWikipediaSummary(result.title, lang)));

        return baseResults.map((result, index) => {
            const summary = summaries[index];
            return summary?.snippet ? summary : result;
        });
    } catch (_) {
        return [];
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchDuckDuckGoHtmlResults(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

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

async function fetchJinaDuckDuckGoResults(query) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const url = `https://r.jina.ai/http://r.jina.ai/http://https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'text/plain',
                'User-Agent': 'Mozilla/5.0 SolenzAI/1.0'
            }
        });

        if (!response.ok) return [];

        const markdown = await response.text();
        const results = [];
        const resultRegex = /^##\s+\[([^\]]+)]\(([^)]+)\)([\s\S]*?)(?=^##\s+\[|\s*$)/gm;
        let match;

        while ((match = resultRegex.exec(markdown)) !== null && results.length < 8) {
            const url = resolveDuckDuckGoUrl(match[2]);
            const snippet = stripMarkdown(match[3])
                .replace(/Images? \d+/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            if (!url || /duckduckgo\.com\/html/i.test(url)) continue;

            results.push({
                title: stripMarkdown(match[1]),
                snippet,
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

async function fetchJinaSourcePage(result) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    try {
        const url = `https://r.jina.ai/http://r.jina.ai/http://${result.url}`;
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                Accept: 'text/plain',
                'User-Agent': 'Mozilla/5.0 SolenzAI/1.0'
            }
        });

        if (!response.ok) return result;

        const markdown = await response.text();
        const title = stripMarkdown((markdown.match(/^Title:\s*(.+)$/mi) || [])[1] || result.title);
        const content = markdown.split(/Markdown Content:/i).slice(1).join(' ') || markdown;
        const snippet = truncateText(stripMarkdown(content), 900);

        if (hasUsefulSnippet(result) && looksLikeNavigationText(snippet)) {
            return result;
        }

        return {
            ...result,
            title: title || result.title,
            snippet: snippet || result.snippet
        };
    } catch (_) {
        return result;
    } finally {
        clearTimeout(timeout);
    }
}

async function fetchSourcePage(result) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

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
            return hasUsefulSnippet(result) ? result : fetchJinaSourcePage(result);
        }

        const html = await response.text();
        const title = stripHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || result.title);
        const metaDescription = stripHtml((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) || [])[1] || '');
        const paragraphText = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
            .map((match) => stripHtml(match[1]))
            .filter((text) => text.length > 60)
            .slice(0, 4)
            .join(' ');

        const enrichedSnippet = truncateText([metaDescription, paragraphText, result.snippet]
            .filter(Boolean)
            .join(' '), 900);

        if (hasUsefulSnippet(result) && looksLikeNavigationText(enrichedSnippet)) {
            return result;
        }

        return {
            ...result,
            title: title || result.title,
            snippet: enrichedSnippet
        };
    } catch (_) {
        return hasUsefulSnippet(result) ? result : fetchJinaSourcePage(result);
    } finally {
        clearTimeout(timeout);
    }
}

async function collectEducationSearchResults(query, lessons = []) {
    if (!isEducationRequest(query, lessons)) return [];

    const educationQueries = buildEducationSearchQueries(query, lessons);
    const groups = await Promise.all(educationQueries.map((searchQuery) => fetchJinaDuckDuckGoResults(searchQuery)));
    return groups.flat();
}

async function collectExpertSearchResults(query, skills = []) {
    const expertQueries = buildExpertSearchQueries(query, skills);
    if (!expertQueries.length) return [];

    const groups = await Promise.all(expertQueries.map((searchQuery) => fetchJinaDuckDuckGoResults(searchQuery)));
    return groups.flat();
}

async function collectWebSources(query, options = {}) {
    const lessons = Array.isArray(options.lessons) ? options.lessons : [];
    const skills = Array.isArray(options.skills) ? options.skills : [];
    const searchQueries = buildSearchQueries(query);
    const duckDuckGoGroups = await Promise.all(searchQueries.map(async (searchQuery) => {
        const [htmlResults, instantResults, jinaResults] = await Promise.all([
            fetchDuckDuckGoHtmlResults(searchQuery),
            fetchWebSearchResults(searchQuery),
            fetchJinaDuckDuckGoResults(searchQuery)
        ]);

        return [...htmlResults, ...instantResults, ...jinaResults];
    }));

    const [trWikipediaResults, enWikipediaResults, educationResults, expertResults] = await Promise.all([
        fetchWikipediaSearchResults(query, 'tr'),
        fetchWikipediaSearchResults(query, 'en'),
        collectEducationSearchResults(query, lessons),
        collectExpertSearchResults(query, skills)
    ]);

    console.info('Web research provider counts:', {
        queryCount: searchQueries.length,
        duckDuckGo: duckDuckGoGroups.flat().length,
        wikipediaTr: trWikipediaResults.length,
        wikipediaEn: enWikipediaResults.length,
        education: educationResults.length,
        expert: expertResults.length
    });

    const seen = new Set();
    const merged = [
        ...duckDuckGoGroups.flat(),
        ...trWikipediaResults,
        ...enWikipediaResults,
        ...educationResults,
        ...expertResults
    ]
        .filter((result) => result.url && (result.snippet || result.title))
        .filter((result) => {
            const key = normalizeSourceUrl(result.url);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .map((result) => ({
            ...result,
            title: truncateText(result.title, 160),
            snippet: truncateText(result.snippet || result.title, 900),
            score: getSourceScore(result.url, query, result.title),
            relevance: sourceRelevanceScore(result, query)
        }))
        .filter((result) => isRelevantSource(result, query))
        .sort((a, b) => ((b.score + b.relevance * 8) - (a.score + a.relevance * 8)))
        .filter((result) => result.snippet.length > 0);

    const diverseMerged = limitSourceDomainDiversity(merged, 1)
        .slice(0, MAX_RESEARCH_SOURCES);

    const enriched = await Promise.all(diverseMerged.map(fetchSourcePage));

    const sources = limitSourceDomainDiversity(enriched
        .map((result) => ({
            ...result,
            title: truncateText(result.title, 160),
            snippet: truncateText(result.snippet || result.title, 900),
            score: getSourceScore(result.url, query, result.title),
            relevance: sourceRelevanceScore(result, query)
        }))
        .filter((result) => isRelevantSource(result, query))
        .sort((a, b) => ((b.score + b.relevance * 8) - (a.score + a.relevance * 8))), 1)
        .slice(0, MAX_RESEARCH_SOURCES);

    console.info('Web research sources collected:', {
        count: sources.length,
        hosts: sources.map((source) => getHostname(source.url))
    });

    return sources;
}

async function buildPrompt({ message, skills, lessons = [] }) {
    const skillLines = [];
    const contextLines = [];
    let webSources = [];
    const researchMode = skills.includes('web-search') || lessons.length > 0 || shouldUseDefaultResearch(message);

    if (researchMode) {
        skillLines.push("- Kaynaklı uzman araştırma aktif: Aşağıdaki web kaynaklarını kullan. Yanıtı başlık başlık ve '- ' maddeleriyle yaz. Her başlık arasında boş satır bırak. Kaynak URL'lerini ve güven puanlarını anlatımın içine karıştırma; bunları sadece en sondaki ayrı 'Kaynaklar' bölümünde yaz. Resmi/otoriter kaynak 100/100 değilse kesin konuşma; 'kaynak güveni sınırlı' diye belirt. Kaynak yoksa uydurma bilgi verme. Yıldız, tablo, # başlık ve dekoratif karakter kullanma.");

        webSources = await collectWebSources(message, { lessons, skills });
        if (webSources.length > 0) {
            contextLines.push('WEBDE GEZİLEREK TOPLANAN KAYNAKLAR:');
            webSources.forEach((result, index) => {
                contextLines.push(`${index + 1}. ${result.title}`);
                contextLines.push(`   Güven puanı: ${sourceScoreLabel(result.score)}`);
                contextLines.push(`   Kaynak: ${result.url}`);
                contextLines.push(`   Alınan bilgi: ${result.snippet}`);
            });
        } else {
            contextLines.push('WEBDE GEZİLEREK TOPLANAN KAYNAKLAR: Güvenilir kaynak bulunamadı. Kullanıcıya kaynak bulunamadığını söyle ve kesin bilgi gibi sunma.');
        }
    }

    if (lessons.length > 0) {
        const lessonNames = lessons.map((lesson) => LESSON_LABELS[lesson]).filter(Boolean).join(', ');
        skillLines.push(`- Dersler modu aktif: Seçimler: ${lessonNames}. Kullanıcının seviyesine göre anlat; 1. sınıftan üniversite ve yüksek lisansa kadar pedagojik dilini ayarla. Önce temel mantığı açıkla, sonra örnek, formül/kavram, sık yapılan hata ve kısa özet ver. Eğitim kaynaklarında MEB/EBA, üniversite açık dersleri, Khan Academy, OpenStax, Britannica, TÜBİTAK, DergiPark, MIT OCW ve resmi/akademik kaynakları daha değerli kabul et.`);
    }

    if (skills.includes('coding')) {
        skillLines.push('- Yazılım Geliştirme aktif: İleri düzey kıdemli mühendis gibi çalış. Büyük işi küçük adımlara böl, mimariyi seç, üretime uygun kod yaz, güvenlik/performans/edge case düşün, test adımlarını ver. Resmi dokümantasyon ve güçlü kaynaklardan yararlan. Gerekirse tam dosya kodu üret, hatayı kök nedenle açıkla ve çözümü doğrudan uygulatılabilir yaz.');
    }

    if (skills.includes('data-analysis')) {
        skillLines.push('- Veri Analizi aktif: Veriyi yapılandır, önemli metrikleri çıkar, varsayımları belirt, gerekiyorsa tablo ve kısa yorum kullan.');
    }

    if (skillLines.length === 0) {
        return {
            prompt: message,
            webSources
        };
    }

    return {
        prompt: [
        'AKTİF YETENEK TALİMATLARI:',
        ...skillLines,
        '',
        ...contextLines,
        contextLines.length ? '' : null,
        'KULLANICI İSTEĞİ:',
        message
        ].filter(Boolean).join('\n'),
        webSources
    };
}

function sanitizePlainTextSegment(value = '') {
    const cleaned = String(value)
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '$1 - $2')
        .replace(/^\s{0,3}#{1,6}\s*/gm, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/^\s*[-*_]{3,}\s*$/gm, '')
        .replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, '')
        .replace(/^\s*[*+]\s+/gm, '')
        .replace(/`([^`\n]+)`/g, '$1')
        .replace(/\*\*/g, '')
        .replace(/__/g, '')
        .replace(/\*/g, '')
        .replace(/\|/g, ' ')
        .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter((line) => !/^[.\-_=#*|~\s]+$/.test(line))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    return restoreCommonTurkish(cleaned);
}

function sanitizeAssistantText(text = '') {
    const parts = String(text || '').split(/(```[\s\S]*?```)/g);

    return parts
        .map((part) => part.startsWith('```') ? part : sanitizePlainTextSegment(part))
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function sourceIsReferenced(text, sources = []) {
    return sources.some((source) => {
        const url = normalizeSourceUrl(source.url);
        const hostname = getHostname(source.url);
        return (url && text.includes(url)) || (hostname && text.includes(hostname));
    });
}

function answerClaimsNoSources(text = '') {
    return /kaynak bulunamad|güvenilir kaynak bulunamad|web aramasında güvenilir kaynak|genel bilgi birikim|kaynak yok|arama sonucu bulunamad/i.test(text);
}

function extractSourceFact(source) {
    const cleaned = sanitizePlainTextSegment(stripHtml(source.snippet || ''))
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) return '';

    const sentences = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];
    return truncateText(sentences.slice(0, 2).join(' '), 420);
}

function normalizeHeading(line = '', options = {}) {
    const cleanLine = sanitizePlainTextSegment(line)
        .replace(/^[-\d.\s]+/, '')
        .replace(/[?:]+$/, '')
        .trim();

    if (!cleanLine) return '';

    if (options.main) {
        return /\bnedir\b/i.test(cleanLine) ? `${cleanLine}?` : cleanLine;
    }

    return `${cleanLine}:`;
}

function isLikelyHeading(line = '') {
    const cleanLine = sanitizePlainTextSegment(line)
        .replace(/^[-\d.\s]+/, '')
        .trim();

    if (!cleanLine || /^https?:\/\//i.test(cleanLine)) return false;
    if (/:$/.test(cleanLine)) return true;
    if (/[.!?]$/.test(cleanLine)) return false;

    const words = cleanLine.split(/\s+/).length;
    return cleanLine.length <= 70 && words <= 8;
}

function splitIntoBulletFacts(text = '') {
    const cleaned = sanitizePlainTextSegment(text)
        .replace(/\s+/g, ' ')
        .trim();

    if (!cleaned) return [];

    const sentences = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];
    const bullets = [];
    let current = '';

    for (const sentence of sentences.map((part) => part.trim()).filter(Boolean)) {
        if (!current) {
            current = sentence;
            continue;
        }

        if (`${current} ${sentence}`.length > 260) {
            bullets.push(current);
            current = sentence;
        } else {
            current = `${current} ${sentence}`;
        }
    }

    if (current) bullets.push(current);
    return bullets.slice(0, 12);
}

function appendBulletSection(output, text) {
    const lines = String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.some((line) => /^-\s+/.test(line))) {
        lines.forEach((line) => {
            output.push(/^-\s+/.test(line) ? sanitizePlainTextSegment(line) : `- ${sanitizePlainTextSegment(line)}`);
        });
        output.push('');
        return;
    }

    splitIntoBulletFacts(text).forEach((fact) => {
        output.push(`- ${fact}`);
    });
    output.push('');
}

function formatResearchBody(body = '', fallbackTitle = 'Araştırma Özeti') {
    const cleanBody = stripExistingSourcesSection(sanitizeAssistantText(body));
    if (!cleanBody) return '';

    const chunks = cleanBody
        .split(/\n{2,}/)
        .map((chunk) => chunk.trim())
        .filter(Boolean);

    const output = [];
    let hasHeading = false;

    for (const chunk of chunks) {
        const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
        if (!lines.length) continue;

        if (lines.length === 1 && isLikelyHeading(lines[0])) {
            output.push(normalizeHeading(lines[0], { main: !hasHeading }));
            output.push('');
            hasHeading = true;
            continue;
        }

        if (isLikelyHeading(lines[0])) {
            output.push(normalizeHeading(lines[0], { main: !hasHeading }));
            output.push('');
            appendBulletSection(output, lines.slice(1).join(' '));
            hasHeading = true;
            continue;
        }

        if (!hasHeading) {
            output.push(fallbackTitle);
            output.push('');
            hasHeading = true;
        }

        appendBulletSection(output, chunk);
    }

    return output
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function formatResearchSources(sources = []) {
    if (!sources.length) {
        return 'Kaynaklar:\nGüvenilir kaynak bulunamadı.';
    }

    return [
        'Kaynaklar:',
        '',
        ...sources.slice(0, MAX_RESEARCH_SOURCES).flatMap((source, index) => [
            `Kaynak ${index + 1}:`,
            `- Başlık: ${source.title}`,
            `- Adres: ${normalizeSourceUrl(source.url)}`,
            `- Güven: ${sourceScoreLabel(source.score)}`,
            ''
        ])
    ].join('\n');
}

function formatResponseSources(sources = []) {
    return sources
        .slice(0, MAX_RESEARCH_SOURCES)
        .map((source) => ({
            title: sanitizePlainTextSegment(source.title || getHostname(source.url) || 'Kaynak'),
            url: normalizeSourceUrl(source.url),
            site: getHostname(source.url),
            score: source.score,
            trust: sourceScoreLabel(source.score)
        }))
        .filter((source) => /^https?:\/\//i.test(source.url));
}

function createNoSourceResearchAnswer() {
    return 'Araştırma Sonucu\n\n- Web araması denendi ama bu istek için güvenilir kaynak alınamadı.\n- Bu yüzden kesin bilgi gibi konuşmuyorum.\n- Konuyu biraz daha net yazarsan yeniden arayabilirim.';
}

function createResearchAnswer(message, sources = []) {
    if (!sources.length) return createNoSourceResearchAnswer(message);

    const primaryToken = cleanSearchQuery(message)
        .toLocaleLowerCase('tr-TR')
        .split(/\s+/)
        .find((token) => token.length >= 4) || '';

    const factLines = sources
        .map((source) => ({
            source,
            fact: extractSourceFact(source)
        }))
        .filter(({ source, fact }) => {
            if (!fact) return false;
            if (!primaryToken) return true;
            return source.score >= 85 || fact.toLocaleLowerCase('tr-TR').includes(primaryToken);
        })
        .slice(0, 3)
        .map((source) => {
            return `- ${source.fact}`;
        })
        .filter(Boolean);

    const confidenceBullet = sources[0].score >= 100
        ? 'Güven notu: En güçlü kaynak resmi ya da otoriter görünüyor; yine de güncel konularda kaynağın kendi sayfasını esas almak gerekir.'
        : 'Güven notu: Kaynaklar yardımcı ama 100/100 resmi kaynak düzeyinde olmadığı için kesin hüküm gibi sunmuyorum.';

    return sanitizeAssistantText([
        'Araştırma Özeti',
        '',
        factLines.length ? factLines.join('\n') : '- Toplanan kaynaklarda kısa özet çıkarılabilecek sınırlı bilgi var.',
        '',
        'Güven Notu',
        '',
        `- ${confidenceBullet.replace(/^Güven notu:\s*/i, '')}`,
        '',
        formatResearchSources(sources)
    ].join('\n'));
}

function stripExistingSourcesSection(text = '') {
    const match = String(text).match(/\n\s*kaynaklar\s*:?\s*(?:\n|$)/i);
    if (!match) return String(text).trim();
    return String(text).slice(0, match.index).trim();
}

function normalizeClaimToken(value = '') {
    return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function removeUnsupportedVersionClaims(text = '', sources = []) {
    const trustedSources = sources.filter((source) => source.score >= 85);
    const corpusSources = trustedSources.length ? trustedSources : sources;
    const sourceCorpus = normalizeClaimToken(corpusSources
        .map((source) => `${source.title} ${source.snippet} ${source.url}`)
        .join(' '));

    return String(text)
        .split('\n')
        .filter((line) => {
            const claims = line.match(/\b(?:gpt|claude|gemini|llama|mistral|grok|sora|o)[-\s]?\d(?:\.\d+)?[a-z-]?\b/gi) || [];
            return claims.every((claim) => sourceCorpus.includes(normalizeClaimToken(claim)));
        })
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function finalizeAnswer({ text, skills, lessons = [], webSources, originalMessage }) {
    const sanitized = sanitizeAssistantText(text);
    const researchMode = skills.includes('web-search') || lessons.length > 0 || shouldUseDefaultResearch(originalMessage);

    if (!researchMode) {
        return sanitized;
    }

    if (!webSources.length) {
        return createNoSourceResearchAnswer(originalMessage);
    }

    if (!sanitized || answerClaimsNoSources(sanitized)) {
        return createResearchAnswer(originalMessage, webSources);
    }

    const grounded = removeUnsupportedVersionClaims(sanitized, webSources);
    if (!grounded) return createResearchAnswer(originalMessage, webSources);

    if (skills.includes('coding') && /```/.test(grounded)) {
        const codingBody = stripExistingSourcesSection(grounded);
        return sanitizeAssistantText(`${codingBody}\n\n${formatResearchSources(webSources)}`);
    }

    const body = formatResearchBody(grounded);
    if (!body) return createResearchAnswer(originalMessage, webSources);

    return sanitizeAssistantText(`${body}\n\n${formatResearchSources(webSources)}`);
}

function createFallbackAnswer(userText, skills = [], lessons = []) {
    const cleanText = String(userText || '').trim();
    const activeSkillNames = skills.map((skill) => SKILL_LABELS[skill]).filter(Boolean);
    const activeLessonNames = lessons.map((lesson) => LESSON_LABELS[lesson]).filter(Boolean);
    const activeModes = [...activeSkillNames, ...activeLessonNames];
    const skillText = activeModes.length ? `\n\nAktif modlar: ${activeModes.join(', ')}.` : '';

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
    const lessons = normalizeLessons(body.lessons);

    if (!message) {
        return res.status(200).json({ text: 'Mesajını yaz, hemen cevaplayayım.' });
    }

    const promptInfo = await buildPrompt({ message, skills, lessons });
    const prompt = promptInfo.prompt;
    const webSources = promptInfo.webSources || [];
    const anthropicConfig = getAnthropicConfig();
    const apiKeys = getApiKeys();

    if (!anthropicConfig && apiKeys.length === 0) {
        return res.status(200).json({
            text: (skills.includes('web-search') || lessons.length > 0 || shouldUseDefaultResearch(message))
                ? createResearchAnswer(message, webSources)
                : createFallbackAnswer(message, skills, lessons),
            sources: formatResponseSources(webSources),
            offline: true
        });
    }

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
                        text: finalizeAnswer({
                            text: result.text,
                            skills,
                            lessons,
                            webSources,
                            originalMessage: message
                        }),
                        provider: 'anthropic-compatible',
                        model: anthropicConfig.model,
                        sources: formatResponseSources(webSources),
                        skills,
                        lessons
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
                            text: finalizeAnswer({
                                text: result.text,
                                skills,
                                lessons,
                                webSources,
                                originalMessage: message
                            }),
                            keyIndex,
                            model: modelName,
                            sources: formatResponseSources(webSources),
                            skills,
                            lessons
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
        text: (skills.includes('web-search') || lessons.length > 0 || shouldUseDefaultResearch(message))
            ? createResearchAnswer(message, webSources)
            : createFallbackAnswer(message, skills, lessons),
        sources: formatResponseSources(webSources),
        offline: true
    });
};
