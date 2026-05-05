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
        if (plusMenu) plusMenu.classList.toggle('hidden');
    });

    if (inputModelBtn) inputModelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (plusMenu) plusMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.add('hidden');
        if (inputModelMenu) inputModelMenu.classList.toggle('hidden');
    });

    if (skillsBtn) skillsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (plusMenu) plusMenu.classList.add('hidden');
        if (inputModelMenu) inputModelMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        if (plusMenu) plusMenu.classList.add('hidden');
        if (inputModelMenu) inputModelMenu.classList.add('hidden');
        if (skillsMenu) skillsMenu.classList.add('hidden');
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
        showThinking();
        if (thinkingSteps) thinkingSteps.innerHTML = '';
        try {
            addThinkingStep("İşlem başlatılıyor...");
            await wait(600);
            
            let aiResponseText = "";
            
            // API ÇAĞRISI (Failover Destekli)
            const callAPI = async (text) => {
                let lastError = null;

                for (let retryCount = 0; retryCount < 3; retryCount++) {
                    try {
                        const response = await fetch(CONFIG.apiEndpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ message: text })
                        });

                        const data = await response.json().catch(() => ({}));
                        const textPart = data?.text || data?.message || data?.reply;

                        if (textPart) {
                            if (typeof data.keyIndex === 'number') {
                                API_MANAGER.currentIndex = data.keyIndex;
                                updateQuotaUI();
                            }
                            API_MANAGER.trackUsage();
                            return textPart;
                        }

                        lastError = new Error(data?.error || `API ${response.status} döndü`);
                    } catch (networkError) {
                        lastError = networkError;
                    }

                    addThinkingStep(retryCount < 2 ? "Bağlantı tekrar deneniyor..." : "Yedek yanıt hazırlanıyor...");
                    await wait(1000 * (retryCount + 1));
                }

                throw lastError || new Error('AI servisi yanıt vermedi');
            };

            // Yazılım Yeteneği Aktifse Kod Kontrolü Yap
            const isCodingActive = document.querySelector('.skill-opt[data-skill="coding"]')?.classList.contains('active');
            
            if (isCodingActive) {
                addThinkingStep("Yazılım geliştirme yeteneği aktif. Kod analizi yapılıyor...");
                aiResponseText = await callAPI(`Aşağıdaki isteği yerine getir ve yazdığın kodda hata varsa düzeltip en stabil halini ver: ${userText}`);
            } else {
                aiResponseText = await callAPI(userText);
            }

            hideThinking();
            addMessageWithCodeSupport(aiResponseText);
        } catch (error) {
            hideThinking();
            console.error("API Hatası:", error);
            addMessageCard(createFallbackAnswer(userText), 'ai');
        }
    }

    function createFallbackAnswer(userText) {
        const cleanText = userText.trim();
        if (/^(merhaba|selam|sa|slm|hello|hi)\b/i.test(cleanText)) {
            return "Merhaba! Buradayım. Ne yapmak istediğini yaz, birlikte çözelim.";
        }

        if (/kod|hata|bug|site|api|yazılım|script|html|css|javascript/i.test(cleanText)) {
            return `İsteğini aldım: "${cleanText}"\n\nŞu an dış AI servisi yoğun olsa bile sana yardımcı olmaya devam edebilirim. Kod veya hata için dosya adını, ekrandaki mesajı ve ne olmasını istediğini yaz; adım adım çözüm çıkarayım.`;
        }

        return `İsteğini aldım: "${cleanText}"\n\nŞu an bağlantı yoğun olduğu için kısa modda yanıtlıyorum. Konuyu biraz daha detaylandırırsan sana net bir cevap hazırlayayım.`;
    }

    function addMessageWithCodeSupport(text) {
        if (!chatHistory) return;

        const card = document.createElement('div');
        card.className = 'message-card ai-card';
        const content = document.createElement('div');
        content.className = 'card-content';

        // Kod bloklarını tespit et (```kod```)
        const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let match;

        while ((match = codeRegex.exec(text)) !== null) {
            // Kod öncesindeki metni ekle
            if (match.index > lastIndex) {
                const textNode = document.createTextNode(text.substring(lastIndex, match.index));
                content.appendChild(textNode);
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
        if (lastIndex < text.length) {
            const textNode = document.createTextNode(text.substring(lastIndex));
            content.appendChild(textNode);
        }

        card.appendChild(content);
        chatHistory.appendChild(card);
        scrollToBottom();
    }

    function escapeHTML(str) {
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    function addThinkingStep(stepText) {
        if (thinkingSteps) {
            const step = document.createElement('div');
            step.className = 'step-item';
            step.textContent = `> ${stepText}`;
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
    function showThinking() { if (thinkingIndicator) thinkingIndicator.classList.remove('hidden'); }
    function hideThinking() { if (thinkingIndicator) thinkingIndicator.classList.add('hidden'); }
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
