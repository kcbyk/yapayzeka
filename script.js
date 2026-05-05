document.addEventListener('DOMContentLoaded', () => {
    // 1. ELEMENT TANIMLAMALARI (Hata payını azaltmak için kontrol ekliyoruz)
    const getEl = (id) => document.getElementById(id);

    const sidebar = getEl('sidebar');
    const menuBtn = getEl('menuBtn');
    const closeSidebar = getEl('closeSidebar');
    const overlay = getEl('overlay');
    const chatForm = getEl('chatForm');
    const messageInput = getEl('messageInput');
    const chatHistory = getEl('chatHistory');
    const thinkingIndicator = getEl('thinkingIndicator');
    const thinkingText = getEl('thinkingText');
    const thinkingSteps = getEl('thinkingSteps');
    const chatList = getEl('chatList');
    const pinnedChatList = getEl('pinnedChatList');
    const newChatBtn = getEl('newChatBtn');
    
    const plusMenuBtn = getEl('plusMenuBtn');
    const plusMenu = getEl('plusMenu');
    const inputModelBtn = getEl('inputModelBtn');
    const inputModelMenu = getEl('inputModelMenu');
    const skillsBtn = getEl('skillsBtn');
    const skillsMenu = getEl('skillsMenu');
    const lessonsBtn = getEl('lessonsBtn');
    const lessonsMenu = getEl('lessonsMenu');
    const menuAttachBtn = getEl('menuAttachBtn');
    const menuGalleryBtn = getEl('menuGalleryBtn');
    const menuCameraBtn = getEl('menuCameraBtn');
    const fileInput = getEl('fileInput');
    const voiceBtn = getEl('voiceBtn');

    const modalContainer = getEl('modalContainer');
    const modalTitle = getEl('modalTitle');
    const modalBody = getEl('modalBody');
    const modalClose = getEl('modalClose');
    const extensionsBtn = getEl('extensionsBtn');
    const settingsBtn = getEl('settingsBtn');
    const userBtn = getEl('userBtn');

    // --- YAPILANDIRMA VE ÇOKLU API YÖNETİMİ ---
    const API_MANAGER = {
        keyCount: 7,
        currentIndex: 0,
        quotaPerKey: 100, // Örnek kota değeri
        usedQuota: 0,

        getCurrentKey() {
            return this.currentIndex;
        },

        switchToNextKey() {
            if (this.currentIndex < this.keyCount - 1) {
                this.currentIndex++;
                this.usedQuota = 0;
                updateQuotaUI();
                return true;
            }
            return false;
        },

        trackUsage() {
            this.usedQuota += 5; // Her istekte kota düşüşü simülasyonu
            updateQuotaUI();
        }
    };

    const CONFIG = {
        useRealAPI: true, // Artık gerçek API'leri kullanabiliriz
        apiEndpoint: '/api/chat'
    };

    function updateQuotaUI() {
        const fill = document.getElementById('quotaFill');
        const text = document.getElementById('quotaText');
        const percentage = Math.max(0, 100 - (API_MANAGER.usedQuota));
        
        if (fill && text) {
            fill.setAttribute('stroke-dasharray', `${percentage}, 100`);
            text.textContent = `${percentage}%`;
        }
    }

    let chats = JSON.parse(localStorage.getItem('ai_chats')) || [];

    // 2. SİDEBAR KONTROLÜ
    const toggleSidebar = () => {
        if (sidebar && overlay) {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        }
    };

    if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
    if (closeSidebar) closeSidebar.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', toggleSidebar);

    // 3. MODAL FONKSİYONLARI
    const openModal = (title, content) => {
        if (modalTitle && modalBody && modalContainer) {
            modalTitle.textContent = title;
            modalBody.innerHTML = content;
            modalContainer.classList.remove('hidden');
        }
    };

    if (modalClose) modalClose.addEventListener('click', () => modalContainer.classList.add('hidden'));
    if (modalContainer) modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) modalContainer.classList.add('hidden');
    });

    if (extensionsBtn) extensionsBtn.addEventListener('click', () => {
        openModal('Uzantılar', `
            <div class="setting-row">
                <div class="setting-info"><h4>Google Workspace</h4><p>Drive ve Gmail erişimi.</p></div>
                <input type="checkbox" checked>
            </div>
            <div class="setting-row">
                <div class="setting-info"><h4>YouTube</h4><p>Video bilgileri.</p></div>
                <input type="checkbox">
            </div>
        `);
    });

    if (settingsBtn) settingsBtn.addEventListener('click', () => {
        openModal('Ayarlar', `
            <div class="setting-row">
                <div class="setting-info"><h4>Koyu Tema</h4><p>Arayüz modu.</p></div>
                <input type="checkbox" checked disabled>
            </div>
            <div class="setting-row">
                <div class="setting-info"><h4>Yanıt Hızı</h4><p>AI hızı.</p></div>
                <select style="background:#333;color:white;border:none;padding:5px;border-radius:4px;"><option>Hızlı</option><option>Dengeli</option></select>
            </div>
        `);
    });

    if (userBtn) userBtn.addEventListener('click', () => {
        openModal('Profil', `
            <div style="text-align:center;padding:20px;">
                <div style="width:60px;height:60px;background:#4a4a4a;border-radius:50%;margin:0 auto 10px;display:flex;align-items:center;justify-content:center;color:white;">S</div>
                <h3>Kullanıcı</h3>
                <button style="margin-top:15px;padding:8px 15px;background:rgba(255,255,255,0.1);border:none;color:white;border-radius:5px;cursor:pointer;">Çıkış Yap</button>
            </div>
        `);
    });

    // 4. ARTI (+) VE MODEL MENÜLERİ
    if (plusMenuBtn) plusMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (inputModelMenu) inputModelMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.add('hidden');
        if (lessonsMenu) lessonsMenu.classList.add('hidden');
        if (plusMenu) plusMenu.classList.toggle('hidden');
    });

    if (inputModelBtn) inputModelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (plusMenu) plusMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.add('hidden');
        if (lessonsMenu) lessonsMenu.classList.add('hidden');
        if (inputModelMenu) inputModelMenu.classList.toggle('hidden');
    });

    if (skillsBtn) skillsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (plusMenu) plusMenu.classList.add('hidden');
        if (inputModelMenu) inputModelMenu.classList.add('hidden');
        if (lessonsMenu) lessonsMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.toggle('hidden');
    });

    if (lessonsBtn) lessonsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (plusMenu) plusMenu.classList.add('hidden');
        if (inputModelMenu) inputModelMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.add('hidden');
        if (lessonsMenu) lessonsMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        if (plusMenu) plusMenu.classList.add('hidden');
        if (inputModelMenu) inputModelMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.add('hidden');
        if (lessonsMenu) lessonsMenu.classList.add('hidden');
    });

    if (menuAttachBtn) menuAttachBtn.addEventListener('click', () => fileInput && fileInput.click());
    if (menuGalleryBtn) menuGalleryBtn.addEventListener('click', () => {
        if (fileInput) {
            fileInput.setAttribute('accept', 'image/*');
            fileInput.click();
        }
    });
    if (menuCameraBtn) menuCameraBtn.addEventListener('click', () => {
        if (fileInput) {
            fileInput.setAttribute('accept', 'image/*');
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
        }
    });

    // Model Seçimi Kontrolü (Sadece Chat içindeki menü için)
    const modelOpts = document.querySelectorAll('.model-opt');
    
    // Varsayılan olarak modeli seçili yap
    const defaultModel = "Gemini 2.5 Flash";
    modelOpts.forEach(opt => {
        if (opt.getAttribute('data-model') === defaultModel) {
            opt.classList.add('selected');
        }
    });
    modelOpts.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            modelOpts.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            setTimeout(() => inputModelMenu && inputModelMenu.classList.add('hidden'), 300);
        });
    });

    // Yetenek Seçimi
    const skillOpts = document.querySelectorAll('.skill-opt');
    skillOpts.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            opt.classList.toggle('active');
            const skillName = opt.querySelector('span').textContent;
            console.log(`Yetenek ${opt.classList.contains('active') ? 'Aktif' : 'Pasif'}: ${skillName}`);
        });
    });

    const lessonOpts = document.querySelectorAll('.lesson-opt');
    lessonOpts.forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            opt.classList.toggle('active');
            const lessonName = opt.querySelector('span').textContent;
            console.log(`Ders ${opt.classList.contains('active') ? 'Aktif' : 'Pasif'}: ${lessonName}`);
        });
    });

    const getActiveSkills = () => Array.from(document.querySelectorAll('.skill-opt.active'))
        .map(opt => opt.getAttribute('data-skill'))
        .filter(Boolean);

    const getActiveLessons = () => Array.from(document.querySelectorAll('.lesson-opt.active'))
        .map(opt => opt.getAttribute('data-lesson'))
        .filter(Boolean);

    // 5. MESAJLAŞMA MANTIĞI
    if (chatForm) chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (text) {
            addMessageCard(text, 'user');
            messageInput.value = '';
            messageInput.style.height = 'auto';
            await handleAIResponse(text);
        }
    });

    async function handleAIResponse(userText) {
        showThinking(userText);
        if (thinkingSteps) thinkingSteps.innerHTML = '';
        const activeSkills = getActiveSkills();
        const activeLessons = getActiveLessons();
        const activeModeCount = activeSkills.length + activeLessons.length;

        try {
            addThinkingStep("İşlem başlatılıyor...");
            await wait(600);
            
            addThinkingStep("Mesaj okundu ve istek hazırlanıyor.", userText.length > 90 ? `${userText.slice(0, 90)}...` : userText);
            addThinkingStep(
                activeModeCount ? "Aktif yetenekler ve ders modu kontrol edildi." : "Standart uzman asistan modu seçildi.",
                activeModeCount ? `${activeModeCount} aktif seçim var.` : "Ek mod seçilmedi."
            );

            let aiResponsePayload = { text: "", sources: [] };
            
            // API ÇAĞRISI (Failover Destekli)
            const callAPI = async (text) => {
                let lastError = null;

                for (let retryCount = 0; retryCount < 3; retryCount++) {
                    try {
                        addThinkingStep(
                            retryCount === 0 ? "Solenz beyniyle bağlantı kuruluyor." : "Bağlantı yeniden deneniyor.",
                            `${CONFIG.apiEndpoint} isteği gönderiliyor.`
                        );
                        const response = await fetch(CONFIG.apiEndpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: text,
                                skills: activeSkills,
                                lessons: activeLessons
                            })
                        });

                        const data = await response.json().catch(() => ({}));
                        const textPart = data?.text || data?.message || data?.reply;
                        const sources = Array.isArray(data?.sources) ? data.sources : [];

                        if (textPart) {
                            if (typeof data.keyIndex === 'number') {
                                API_MANAGER.currentIndex = data.keyIndex;
                                updateQuotaUI();
                            }
                            API_MANAGER.trackUsage();
                            addThinkingStep(
                                "Yanıt alındı ve kaynaklar ayrılıyor.",
                                sources.length ? `${sources.length} kaynak ikon olarak hazırlanıyor.` : "Bu yanıtta kaynak listesi yok."
                            );
                            if (data?.provider || data?.model) {
                                addThinkingStep("Model bilgisi doğrulandı.", [data.provider, data.model].filter(Boolean).join(' / '));
                            }
                            return { text: textPart, sources };
                        }

                        lastError = new Error(data?.error || `API ${response.status} döndü`);
                    } catch (networkError) {
                        lastError = networkError;
                    }

                    addThinkingStep(retryCount < 2 ? "Bağlantı tekrar deneniyor." : "Yedek yanıt hazırlanıyor.", lastError?.message || "");
                    await wait(1000 * (retryCount + 1));
                }

                throw lastError || new Error('AI servisi yanıt vermedi');
            };

            if (activeSkills.includes('web-search')) {
                addThinkingStep("Web'de derin arama hazırlanıyor...");
            }
            if (activeSkills.includes('coding')) {
                addThinkingStep("Yazılım geliştirme modu aktif...");
            }
            if (activeSkills.includes('data-analysis')) {
                addThinkingStep("Veri analizi modu aktif...");
            }
            if (activeLessons.length > 0) {
                addThinkingStep("Ders kaynakları ve seviye ayarı hazırlanıyor...");
            }

            aiResponsePayload = await callAPI(userText);
            addThinkingStep("Cevap arayüz için düzenleniyor.", "Başlıklar, boşluklar, kod blokları ve kaynak ikonları hazırlanıyor.");
            await wait(350);

            hideThinking();
            addMessageWithCodeSupport(aiResponsePayload.text, aiResponsePayload.sources);
        } catch (error) {
            hideThinking();
            console.error("API Hatası:", error);
            addMessageWithCodeSupport(createFallbackAnswer(userText, activeSkills, activeLessons), []);
        }
    }

    function createFallbackAnswer(userText, activeSkills = [], activeLessons = []) {
        const cleanText = userText.trim();
        const skillNames = {
            'web-search': "Web'de Derin Arama",
            coding: 'Yazılım Geliştirme',
            'data-analysis': 'Veri Analizi'
        };
        const lessonNames = {
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
        const activeSkillText = [
            ...activeSkills.map(skill => skillNames[skill]).filter(Boolean),
            ...activeLessons.map(lesson => lessonNames[lesson]).filter(Boolean)
        ].join(', ');
        const skillSuffix = activeSkillText ? `\n\nAktif modlar: ${activeSkillText}.` : '';

        if (/^(merhaba|selam|sa|slm|hello|hi)\b/i.test(cleanText)) {
            return `Merhaba! Buradayım. Ne yapmak istediğini yaz, birlikte çözelim.${skillSuffix}`;
        }

        if (/kod|hata|bug|site|api|yazılım|script|html|css|javascript/i.test(cleanText)) {
            return `İsteğini aldım: "${cleanText}"${skillSuffix}\n\nŞu an dış AI servisi yoğun olsa bile sana yardımcı olmaya devam edebilirim. Kod veya hata için dosya adını, ekrandaki mesajı ve ne olmasını istediğini yaz; adım adım çözüm çıkarayım.`;
        }

        return `İsteğini aldım: "${cleanText}"${skillSuffix}\n\nŞu an bağlantı yoğun olduğu için kısa modda yanıtlıyorum. Konuyu biraz daha detaylandırırsan sana net bir cevap hazırlayayım.`;
    }

    function cleanAssistantText(rawText = '') {
        return String(rawText || '')
            .replace(/\r\n/g, '\n')
            .replace(/^\s{0,3}#{1,6}\s+/gm, '')
            .replace(/\*\*/g, '')
            .replace(/__([^_]+)__/g, '$1')
            .replace(/[•●]/g, '-')
            .replace(/[ \t]+\n/g, '\n')
            .trim();
    }

    function getSourceHost(url = '') {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch (error) {
            return String(url).replace(/^https?:\/\//, '').split('/')[0];
        }
    }

    function normalizeSource(source) {
        if (!source) return null;
        const url = source.url || source.href || source.link || '';
        if (!/^https?:\/\//i.test(url)) return null;
        const site = source.site || source.domain || getSourceHost(url);
        return {
            url,
            site,
            title: source.title || source.name || site || 'Kaynak',
            trust: source.trust || source.confidence || source.scoreLabel || source.score || ''
        };
    }

    function splitAnswerAndSources(rawText = '') {
        const text = cleanAssistantText(rawText);
        const match = text.match(/\n\s*kaynaklar\s*:?\s*(?:\n|$)/i);
        if (!match) return { body: text, sources: [] };

        const body = text.slice(0, match.index).trim();
        const sourceText = text.slice(match.index + match[0].length).trim();
        const sources = [];
        let current = {};

        sourceText.split('\n').forEach((line) => {
            const cleaned = line.trim();
            if (!cleaned) return;

            const titleMatch = cleaned.match(/başlık\s*:\s*(.+)$/i);
            const urlMatch = cleaned.match(/(?:adres|url|kaynak)\s*:\s*(https?:\/\/\S+)/i);
            const trustMatch = cleaned.match(/güven\s*:\s*(.+)$/i);
            const looseUrl = cleaned.match(/https?:\/\/\S+/i);

            if (/^kaynak\s+\d+/i.test(cleaned)) {
                current = {};
                return;
            }

            if (titleMatch) {
                current.title = titleMatch[1].trim();
                return;
            }

            if (trustMatch) {
                current.trust = trustMatch[1].trim();
                return;
            }

            if (urlMatch || looseUrl) {
                const url = (urlMatch ? urlMatch[1] : looseUrl[0]).replace(/[.,;]+$/, '');
                sources.push({
                    ...current,
                    url,
                    site: getSourceHost(url)
                });
                current = {};
            }
        });

        return { body, sources };
    }

    function mergeSources(...sourceGroups) {
        const seen = new Set();
        const merged = [];

        sourceGroups.flat().map(normalizeSource).filter(Boolean).forEach((source) => {
            const key = source.url.replace(/\/$/, '');
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(source);
        });

        return merged;
    }

    function isHeadingLine(line = '') {
        const trimmed = line.trim();
        if (!trimmed || trimmed.length > 90) return false;
        return /[:：]$/.test(trimmed) || /^[A-ZÇĞİÖŞÜ0-9][^.!?]{2,70}$/.test(trimmed);
    }

    function appendFormattedText(container, rawText = '') {
        const blocks = cleanAssistantText(rawText).split(/\n{2,}/).map(block => block.trim()).filter(Boolean);

        blocks.forEach((block, index) => {
            const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
            if (!lines.length) return;

            if (lines.every(line => /^[-*]\s+/.test(line) || /^\d+[.)]\s+/.test(line))) {
                const list = document.createElement('ul');
                list.className = 'ai-premium-list';
                lines.forEach((line) => {
                    const item = document.createElement('li');
                    item.textContent = line.replace(/^[-*]\s+/, '').replace(/^\d+[.)]\s+/, '');
                    list.appendChild(item);
                });
                list.style.setProperty('--stagger', `${Math.min(index * 70, 700)}ms`);
                container.appendChild(list);
                return;
            }

            if (lines.length === 1 && isHeadingLine(lines[0])) {
                const heading = document.createElement('div');
                heading.className = 'ai-premium-heading';
                heading.textContent = lines[0].replace(/[:：]$/, '');
                heading.style.setProperty('--stagger', `${Math.min(index * 70, 700)}ms`);
                container.appendChild(heading);
                return;
            }

            const paragraph = document.createElement('p');
            paragraph.className = 'ai-premium-paragraph';
            paragraph.innerHTML = lines.map(escapeHTML).join('<br>');
            paragraph.style.setProperty('--stagger', `${Math.min(index * 70, 700)}ms`);
            container.appendChild(paragraph);
        });
    }

    function appendSourceIcons(container, sources = []) {
        const normalizedSources = mergeSources(sources);
        if (!normalizedSources.length) return;

        const rail = document.createElement('div');
        rail.className = 'source-icon-rail';

        const label = document.createElement('div');
        label.className = 'source-rail-title';
        label.innerHTML = '<span>Kaynaklar</span><small>İkona tıklayınca site açılır</small>';
        rail.appendChild(label);

        const list = document.createElement('div');
        list.className = 'source-icon-list';

        normalizedSources.forEach((source, index) => {
            const link = document.createElement('a');
            link.className = 'source-icon-link';
            link.href = source.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.title = `${source.title}${source.trust ? ` - ${source.trust}` : ''}`;
            link.style.setProperty('--source-index', index);

            const glow = document.createElement('span');
            glow.className = 'source-icon-glow';

            const img = document.createElement('img');
            img.src = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(source.url)}&sz=64`;
            img.alt = source.site;
            img.loading = 'lazy';

            const fallback = document.createElement('span');
            fallback.className = 'source-icon-fallback';
            fallback.textContent = (source.site || '?').charAt(0).toUpperCase();
            fallback.style.display = 'none';

            img.onerror = () => {
                img.style.display = 'none';
                fallback.style.display = 'inline-flex';
            };

            const site = document.createElement('span');
            site.className = 'source-site';
            site.textContent = source.site;

            link.appendChild(glow);
            link.appendChild(img);
            link.appendChild(fallback);
            link.appendChild(site);
            list.appendChild(link);
        });

        rail.appendChild(list);
        container.appendChild(rail);
    }

    function addMessageWithCodeSupport(text, sources = []) {
        if (!chatHistory) return;

        const card = document.createElement('div');
        card.className = 'message-card ai-card';
        const content = document.createElement('div');
        content.className = 'card-content ai-premium-content';
        const { body, sources: inlineSources } = splitAnswerAndSources(text);
        const mergedSources = mergeSources(sources, inlineSources);

        // Kod bloklarını tespit et (```kod```)
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeRegex.exec(body)) !== null) {
            // Kod öncesindeki metni ekle
            if (match.index > lastIndex) {
                appendFormattedText(content, body.substring(lastIndex, match.index));
            }

            const lang = match[1] || 'code';
            const code = match[2];

            // Kod bloğu UI'ı oluştur
            const codeContainer = document.createElement('div');
            codeContainer.className = 'code-container';
            codeContainer.innerHTML = `
                <div class="code-header">
                    <span class="code-lang">${lang}</span>
                    <div class="code-actions">
                        <button class="code-btn copy-btn" title="Kopyala">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                        <button class="code-btn play-btn" title="Oynat/Çalıştır">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </button>
                    </div>
                </div>
                <pre><code>${escapeHTML(code)}</code></pre>
            `;

            // Kopyalama Butonu Mantığı
            codeContainer.querySelector('.copy-btn').onclick = () => {
                navigator.clipboard.writeText(code);
                alert('Kod kopyalandı!');
            };

            // Oynatma Butonu (Simülasyon veya Index.html ise önizleme)
            codeContainer.querySelector('.play-btn').onclick = () => {
                if (lang.toLowerCase() === 'html' || code.includes('<!DOCTYPE html>')) {
                    const win = window.open();
                    win.document.write(code);
                    win.document.close();
                } else {
                    alert('Bu kod bloğu için önizleme desteklenmiyor.');
                }
            };

            content.appendChild(codeContainer);
            lastIndex = codeRegex.lastIndex;
        }

        // Kalan metni ekle
        if (lastIndex < body.length) {
            appendFormattedText(content, body.substring(lastIndex));
        }

        appendSourceIcons(content, mergedSources);

        card.appendChild(content);
        chatHistory.appendChild(card);
        scrollToBottom();
    }

    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    function addThinkingStep(stepText, detailText = '') {
        if (thinkingSteps) {
            const step = document.createElement('div');
            step.className = 'step-item';
            const main = document.createElement('span');
            main.className = 'step-main';
            main.textContent = stepText;
            step.appendChild(main);

            if (detailText) {
                const detail = document.createElement('small');
                detail.className = 'step-detail';
                detail.textContent = detailText;
                step.appendChild(detail);
            }

            thinkingSteps.appendChild(step);
            scrollToBottom();
        }
    }

    function addMessageCard(text, sender) {
        if (chatHistory) {
            const card = document.createElement('div');
            card.className = `message-card ${sender}-card`;
            const content = document.createElement('div');
            content.className = 'card-content';
            content.textContent = text;
            card.appendChild(content);
            chatHistory.appendChild(card);
            scrollToBottom();
            if (sender === 'user' && chatHistory.children.length === 1) saveToHistory(text);
        }
    }

    // 6. SOHBET GEÇMİŞİ (LOCAL STORAGE)
    function saveToHistory(title) {
        const newChat = { id: Date.now(), title: title.substring(0, 20) + '...', pinned: false };
        chats.unshift(newChat);
        updateStorageAndUI();
    }

    function updateStorageAndUI() {
        localStorage.setItem('ai_chats', JSON.stringify(chats));
        renderChatList();
    }

    function renderChatList() {
        if (!chatList || !pinnedChatList) return;
        chatList.innerHTML = '';
        pinnedChatList.innerHTML = '';
        
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-item';
            const pinIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v2a10 10 0 0 0 5 8.66l3 1.72a2 2 0 0 0 2 0l3-1.72A10 10 0 0 0 21 10z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
            const deleteIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

            item.innerHTML = `
                <span>${chat.title}</span>
                <div class="chat-item-actions">
                    <button class="action-btn ${chat.pinned ? 'pinned' : ''}" onclick="event.stopPropagation(); togglePin(${chat.id})">${pinIcon}</button>
                    <button class="action-btn" onclick="event.stopPropagation(); deleteChat(${chat.id})">${deleteIcon}</button>
                </div>
            `;
            if (chat.pinned) pinnedChatList.appendChild(item);
            else chatList.appendChild(item);
        });
    }

    window.togglePin = (id) => {
        const chat = chats.find(c => c.id === id);
        if (chat) { chat.pinned = !chat.pinned; updateStorageAndUI(); }
    };

    window.deleteChat = (id) => {
        chats = chats.filter(c => c.id !== id);
        updateStorageAndUI();
    };

    if (newChatBtn) newChatBtn.addEventListener('click', () => {
        if (chatHistory) chatHistory.innerHTML = '';
        toggleSidebar();
    });

    // 7. YARDIMCI FONKSİYONLAR
    function showThinking(userText = '') {
        if (thinkingText) {
            thinkingText.textContent = 'Yapay zeka düşünüyor...';
            thinkingText.setAttribute('title', userText);
        }
        if (thinkingIndicator) thinkingIndicator.classList.remove('hidden');
    }

    function hideThinking() {
        if (thinkingIndicator) thinkingIndicator.classList.add('hidden');
        if (thinkingSteps) thinkingSteps.innerHTML = '';
    }
    function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    function scrollToBottom() {
        if (chatHistory) chatHistory.parentElement.scrollTop = chatHistory.parentElement.scrollHeight;
    }

    if (messageInput) {
        messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        messageInput.addEventListener('focus', () => setTimeout(scrollToBottom, 300));
    }

    if (window.visualViewport && messageInput) {
        window.visualViewport.addEventListener('resize', () => {
            if (document.activeElement === messageInput) {
                scrollToBottom();
                window.scrollTo(0, 0);
            }
        });
    }

    renderChatList();
});
