// PrivateLinkSaver - Popup Script
document.addEventListener('DOMContentLoaded', async function () {
    // Element references
    const elements = {
        loader: document.getElementById('loader'),
        toastContainer: document.getElementById('toast-container'),
        welcomeScreen: document.getElementById('welcome-screen'),
        loginSection: document.getElementById('login-section'),
        registerSection: document.getElementById('register-section'),
        bookmarksSection: document.getElementById('bookmarks-section'),
        bookmarksContainer: document.getElementById('bookmarks-container'),
        emptyState: document.getElementById('empty-state'),
        password: document.getElementById('password'),
        newPassword: document.getElementById('new-password'),
        confirmPassword: document.getElementById('confirm-password'),
        passwordStrength: document.getElementById('password-strength'),
        strengthBar: document.querySelector('.strength-bar'),
        strengthText: document.querySelector('.strength-text'),
        loginBtn: document.getElementById('login-btn'),
        logoutBtn: document.getElementById('logout-btn'),
        showRegisterBtn: document.getElementById('show-register-btn'),
        registerBtn: document.getElementById('register-btn'),
        cancelRegisterBtn: document.getElementById('cancel-register-btn'),
        getStartedBtn: document.getElementById('get-started-btn'),
        addBookmarkBtn: document.getElementById('add-bookmark'),
        showAllBtn: document.getElementById('show-all-btn'),
        hideAllBtn: document.getElementById('hide-all-btn'),
        refreshBtn: document.getElementById('refresh-btn'),
        statsBtn: document.getElementById('stats-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        themeToggle: document.getElementById('theme-toggle'),
        searchBox: document.getElementById('search-box'),
        exportBtn: document.getElementById('export-btn'),
        importBtn: document.getElementById('import-btn'),
        backupBtn: document.getElementById('backup-btn'),
        fileInput: document.getElementById('file-input'),
        folderSelect: document.getElementById('folder-select'),
        folderSelectAdd: document.getElementById('folder-select-add'),
        newFolderBtn: document.getElementById('new-folder-btn'),
        deleteFolderBtn: document.getElementById('delete-folder-btn'),
        folderModal: document.getElementById('folder-modal'),
        backupModal: document.getElementById('backup-modal'),
        statsModal: document.getElementById('stats-modal'),
        folderName: document.getElementById('folder-name'),
        saveFolderBtn: document.getElementById('save-folder-btn'),
        editBookmarkModal: document.getElementById('edit-bookmark-modal'),
        editBookmarkTitle: document.getElementById('edit-bookmark-title'),
        editBookmarkUrl: document.getElementById('edit-bookmark-url'),
        saveBookmarkEditBtn: document.getElementById('save-bookmark-edit-btn'),
        createBackupBtn: document.getElementById('create-backup-btn'),
        autoBackupToggle: document.getElementById('auto-backup-toggle'),
        backupsContainer: document.getElementById('backups-container'),
        sortDateBtn: document.getElementById('sort-date'),
        sortNameBtn: document.getElementById('sort-name'),
        sortVisitsBtn: document.getElementById('sort-visits'),
        tagInput: document.getElementById('tag-input'),
        tagList: document.getElementById('tag-list'),
        smartTagSuggestions: document.getElementById('smart-tag-suggestions'),
        commandPaletteBtn: document.getElementById('command-palette-btn'),
        commandPaletteModal: document.getElementById('command-palette-modal'),
        commandInput: document.getElementById('command-input'),
        commandResults: document.getElementById('command-results'),
        totalBookmarks: document.getElementById('total-bookmarks'),
        totalFolders: document.getElementById('total-folders'),
        totalTags: document.getElementById('total-tags'),
        quickBookmarkCount: document.getElementById('quick-bookmark-count'),
        quickFolderCount: document.getElementById('quick-folder-count'),
        quickTagCount: document.getElementById('quick-tag-count'),
        togglePassword: document.getElementById('toggle-password'),
        cloudSyncStatus: document.getElementById('cloud-sync-status'),
        cloudAccountSection: document.getElementById('cloud-account-section'),
        cloudEmail: document.getElementById('cloud-email'),
        cloudPassword: document.getElementById('cloud-password'),
        toggleCloudPassword: document.getElementById('toggle-cloud-password'),
        cloudLoginBtn: document.getElementById('cloud-login-btn'),
        cloudRegisterBtn: document.getElementById('cloud-register-btn'),
        cloudForgotBtn: document.getElementById('cloud-forgot-btn'),
        backToLoginBtn: document.getElementById('back-to-login-btn'),
        folderColorPicker: document.getElementById('folder-color-picker'),
        folderColorHex: document.getElementById('folder-color-hex')
    };

    // State variables
    let state = {
        currentLang: 'en',
        darkMode: false,
        allBookmarksHidden: false,
        currentFolder: 'all',
        currentTag: null,
        folders: [],
        tags: [],
        bookmarks: [],
        sortBy: 'date',
        selectedFolderColor: '#8e44ad',
        editingBookmarkId: null,
        activeSuggestedTags: [],
        currentTabMeta: null,
        commandIndex: 0,
        activeCommands: [],
        cloudEncryptionKey: null,
        cloudPassword: null,
        cloudSalt: null,
        cloudLoggedIn: false
    };

    function t(key, fallback = '') {
        return translations[state.currentLang]?.[key] || translations.en?.[key] || fallback;
    }

    const TRACKING_PARAM_PREFIXES = ['utm_', 'ga_', 'mc_', 'pk_', 'sc_'];
    const TRACKING_PARAM_EXACT = new Set([
        'fbclid',
        'gclid',
        'dclid',
        'msclkid',
        'yclid',
        '_hsenc',
        '_hsmi',
        'igshid',
        'ref',
        'ref_src',
        'source',
        'campaign',
        'si'
    ]);

    // Show loader
    function showLoader() {
        elements.loader.classList.add('active');
    }

    // Hide loader
    function hideLoader() {
        elements.loader.classList.remove('active');
    }

    // Show toast notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${icons[type] || 'info-circle'}`;
        const text = document.createElement('span');
        text.textContent = message;
        toast.appendChild(icon);
        toast.appendChild(text);
        
        elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOutTop 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }

    // Apply translation
    function applyTranslation(lang) {
        state.currentLang = lang;
        const langData = translations[lang];
        
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (langData[key]) {
                el.textContent = langData[key];
            }
        });
        
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            if (langData[key]) {
                el.setAttribute('placeholder', langData[key]);
            }
        });
        
        // Update active language button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });

        updateSmartTagSuggestions();
        if (elements.commandPaletteModal.classList.contains('active')) {
            renderCommandResults(elements.commandInput.value);
        }
    }

    // Toggle dark/light theme
    function toggleTheme() {
        state.darkMode = !state.darkMode;
        document.body.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
        elements.themeToggle.innerHTML = state.darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        StorageUtils.savePreferences({ darkMode: state.darkMode });
    }

    // Initialize theme
    async function initTheme() {
        const prefs = await StorageUtils.getPreferences();
        state.darkMode = prefs.darkMode;
        state.currentLang = prefs.language;
        
        if (state.darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // Set auto-backup toggle
        elements.autoBackupToggle.checked = prefs.autoBackup;
    }

    // Load folders
    async function loadFolders() {
        const storedFolders = await StorageUtils.getFolders();
        
        if (storedFolders.length === 0) {
            // Create default folders
            const defaultFolderData = defaultFolders.map(key => ({
                id: CryptoUtils.generateUUID(),
                name: translations[state.currentLang][key],
                color: folderColors[key] || '#0ea5e9',
                isDefault: true,
                key: key
            }));
            
            await StorageUtils.saveFolders(defaultFolderData);
            state.folders = defaultFolderData;
        } else {
            // Translate default folder names
            state.folders = storedFolders.map(folder => {
                if (folder.isDefault && folder.key) {
                    return {
                        ...folder,
                        name: translations[state.currentLang][folder.key] || folder.name
                    };
                }
                return folder;
            });
            
            await StorageUtils.saveFolders(state.folders);
        }
        
        updateFolderDropdowns();
    }

    // Load tags
    async function loadTags() {
        state.tags = await StorageUtils.getTags();
        updateTagList();
    }

    async function refreshCurrentTabMeta() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs && tabs[0] ? tabs[0] : null;
                if (!tab || !isSafeHttpUrl(tab.url)) {
                    state.currentTabMeta = null;
                    state.activeSuggestedTags = [];
                    updateSmartTagSuggestions();
                    resolve(null);
                    return;
                }

                state.currentTabMeta = {
                    title: String(tab.title || tab.url || 'Untitled').trim(),
                    url: normalizeHttpUrl(tab.url),
                    favIconUrl: tab.favIconUrl || null
                };
                state.activeSuggestedTags = inferTagsFromMeta(state.currentTabMeta.url, state.currentTabMeta.title);
                updateSmartTagSuggestions();
                resolve(state.currentTabMeta);
            });
        });
    }

    function updateSmartTagSuggestions() {
        if (!elements.smartTagSuggestions) return;

        elements.smartTagSuggestions.innerHTML = '';
        if (!state.activeSuggestedTags.length) return;

        const enteredTags = elements.tagInput.value
            .split(',')
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean);

        state.activeSuggestedTags.forEach((tag) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'smart-tag-chip';
            chip.textContent = `+${tag}`;
            if (enteredTags.includes(tag.toLowerCase())) {
                chip.classList.add('active');
            }

            chip.addEventListener('click', () => {
                const existing = elements.tagInput.value
                    .split(',')
                    .map((entry) => entry.trim())
                    .filter(Boolean);
                const merged = mergeTags(existing, [tag]);
                elements.tagInput.value = merged.join(', ');
                updateSmartTagSuggestions();
            });

            elements.smartTagSuggestions.appendChild(chip);
        });
    }

    // Update folder dropdowns
    function updateFolderDropdowns() {
        elements.folderSelect.innerHTML = '';
        elements.folderSelectAdd.innerHTML = '';
        
        // All folders option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = translations[state.currentLang]['all_folders'];
        elements.folderSelect.appendChild(allOption);
        
        // Add each folder
        state.folders.forEach(folder => {
            const option = document.createElement('option');
            option.value = folder.name;
            option.textContent = folder.name;
            option.style.color = folder.color;
            elements.folderSelect.appendChild(option.cloneNode(true));
            elements.folderSelectAdd.appendChild(option);
        });
        
        // Initialize color
        const updateSelectColor = (select) => {
            const selectedOption = select.options[select.selectedIndex];
            if (selectedOption && selectedOption.style.color) {
                select.style.color = selectedOption.style.color;
            } else {
                select.style.color = 'inherit';
            }
        };

        updateSelectColor(elements.folderSelect);
        updateSelectColor(elements.folderSelectAdd);
        
        // Update stats
        if (elements.totalFolders) elements.totalFolders.textContent = state.folders.length;
        if (elements.quickFolderCount) elements.quickFolderCount.textContent = state.folders.length;
    }

    // Update tag list
    function updateTagList() {
        if (elements.tagList) {
            elements.tagList.innerHTML = '';
            
            state.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'tag-item';
                tagEl.textContent = tag.name;
                tagEl.style.backgroundColor = `${tag.color}20`;
                tagEl.style.color = tag.color;
                tagEl.style.borderColor = tag.color;
                
                if (state.currentTag === tag.name) {
                    tagEl.classList.add('active');
                }
                
                tagEl.addEventListener('click', () => {
                    state.currentTag = state.currentTag === tag.name ? null : tag.name;
                    updateTagList();
                    filterBookmarks();
                });
                
                elements.tagList.appendChild(tagEl);
            });
        }
        
        if (elements.totalTags) elements.totalTags.textContent = state.tags.length;
        if (elements.quickTagCount) elements.quickTagCount.textContent = state.tags.length;
    }

    // Update stats display
    async function updateStats() {
        const stats = await StorageUtils.getStatistics();
        
        if (elements.totalBookmarks) elements.totalBookmarks.textContent = stats.totalBookmarks;
        if (elements.totalFolders) elements.totalFolders.textContent = stats.totalFolders;
        if (elements.totalTags) elements.totalTags.textContent = stats.totalTags;
        if (elements.quickBookmarkCount) elements.quickBookmarkCount.textContent = stats.totalBookmarks;
        if (elements.quickFolderCount) elements.quickFolderCount.textContent = stats.totalFolders;
        if (elements.quickTagCount) elements.quickTagCount.textContent = stats.totalTags;
        
        // Update stats modal
        document.getElementById('stat-bookmarks').textContent = stats.totalBookmarks;
        document.getElementById('stat-folders').textContent = stats.totalFolders;
        document.getElementById('stat-tags').textContent = stats.totalTags;
        document.getElementById('stat-visits').textContent = stats.totalVisits;
        
        // Update top domains
        const domainList = document.getElementById('domain-list');
        domainList.innerHTML = '';
        
        stats.topDomains.forEach(({ domain, count }) => {
            const item = document.createElement('div');
            item.className = 'domain-item';

            const domainName = document.createElement('span');
            domainName.className = 'domain-name';

            const icon = document.createElement('img');
            icon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`;
            icon.alt = '';

            const domainText = document.createElement('span');
            domainText.textContent = domain;

            const domainCount = document.createElement('span');
            domainCount.className = 'domain-count';
            domainCount.textContent = String(count);

            domainName.appendChild(icon);
            domainName.appendChild(domainText);
            item.appendChild(domainName);
            item.appendChild(domainCount);
            domainList.appendChild(item);
        });
    }

    // Show welcome screen
    async function showWelcomeScreen() {
        elements.welcomeScreen.style.display = 'block';
        elements.loginSection.style.display = 'none';
        elements.registerSection.style.display = 'none';
        elements.bookmarksSection.style.display = 'none';
        
        await updateStats();
    }

    // Show bookmarks
    async function showBookmarks() {
        state.bookmarks = await StorageUtils.getBookmarks();
        refreshBookmarkView();
        
        elements.loginSection.style.display = 'none';
        elements.registerSection.style.display = 'none';
        elements.welcomeScreen.style.display = 'none';
        elements.bookmarksSection.style.display = 'block';
        
        await updateStats();
        await refreshCurrentTabMeta();
    await updateCloudUI();
    }

    // Display bookmarks
    function displayBookmarks(bookmarks, options = {}) {
        elements.bookmarksContainer.innerHTML = '';

        const list = options.preSorted ? bookmarks : sortBookmarks(bookmarks);

        if (list.length === 0) {
            elements.bookmarksContainer.appendChild(elements.emptyState);
            const hasFilters = Boolean(elements.searchBox.value.trim()) || elements.folderSelect.value !== 'all' || Boolean(state.currentTag);
            const titleNode = elements.emptyState.querySelector('p');
            const subtitleNode = elements.emptyState.querySelector('span');
            if (hasFilters) {
                if (titleNode) titleNode.textContent = t('no_results_title', 'No matches found');
                if (subtitleNode) subtitleNode.textContent = t('no_results_subtitle', 'Try another keyword or filter');
            } else {
                if (titleNode) titleNode.textContent = t('no_bookmarks_yet', 'No bookmarks yet');
                if (subtitleNode) subtitleNode.textContent = t('start_saving', 'Start saving your favorite pages!');
            }
            elements.emptyState.style.display = 'flex';
            return;
        }

        list.forEach((bookmark) => {
            const item = createBookmarkElement(bookmark);
            elements.bookmarksContainer.appendChild(item);
        });

        chrome.action.setBadgeText({ text: state.bookmarks.length.toString() });
    }

    // Event delegation for bookmark actions
    elements.bookmarksContainer.addEventListener('click', async (e) => {
        const actionBtn = e.target.closest('.bookmark-action-btn');
        if (!actionBtn) return;

        const action = actionBtn.dataset.action;
        const bookmarkId = actionBtn.dataset.id;
        const bookmark = state.bookmarks.find(b => b.id === bookmarkId);
        if (!bookmark) return;

        switch (action) {
            case 'edit':
                openEditBookmarkModal(bookmark);
                break;
            case 'copy':
                navigator.clipboard.writeText(bookmark.url);
                showToast(t('link_copied'));
                break;
            case 'delete':
                await deleteBookmark(bookmarkId);
                break;
        }
    });

    // Create bookmark element
    function createBookmarkElement(bookmark) {
        const el = document.createElement('div');
        el.className = 'bookmark-item';
        el.dataset.bookmarkId = bookmark.id;
        el.dataset.folder = bookmark.folder;
        el.dataset.tags = JSON.stringify(bookmark.tags || []);
        
        if (state.allBookmarksHidden) {
            el.classList.add('hidden');
        }
        
        const safeUrl = normalizeHttpUrl(bookmark.url);
        const safeHref = safeUrl || '#';
        const safeUrlText = safeUrl || String(bookmark.url || '');
        const safeFavicon = normalizeHttpUrl(bookmark.favicon) || getFavicon(bookmark.url);
        const visitCount = Number(bookmark.visitCount) || 0;

        el.innerHTML = `
            <div class="bookmark-header">
                <img class="bookmark-favicon" src="${escapeHtml(safeFavicon)}" alt="">
                <span class="bookmark-title">${escapeHtml(bookmark.title)}</span>
                <div class="bookmark-actions">
                <button class="bookmark-action-btn edit" data-action="edit" data-id="${bookmark.id}" title="${translations[state.currentLang]['edit']}">
                    <svg class="icon" viewBox="0 0 24 24"><use href="#icon-edit"></use></svg>
                </button>
                <button class="bookmark-action-btn copy" data-action="copy" data-id="${bookmark.id}" title="${t('copy')}">
                    <svg class="icon" viewBox="0 0 24 24"><use href="#icon-copy"></use></svg>
                </button>
                <button class="bookmark-action-btn delete" data-action="delete" data-id="${bookmark.id}" title="${translations[state.currentLang]['delete']}">
                    <svg class="icon" viewBox="0 0 24 24"><use href="#icon-trash"></use></svg>
                </button>
            </div>
            </div>
            <div class="bookmark-url">
                <a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(safeUrlText)}</a>
            </div>
            <div class="bookmark-meta">
                <span class="bookmark-date">${escapeHtml(bookmark.date)}</span>
                ${visitCount > 0 ? `<span><i class="fas fa-eye"></i> ${visitCount}</span>` : ''}
                <select class="bookmark-folder-select" style="color: ${state.folders.find(f => f.name === bookmark.folder)?.color || 'inherit'}">
                    ${state.folders.map(f => `
                        <option value="${escapeHtml(f.name)}" ${f.name === bookmark.folder ? 'selected' : ''} style="color: ${f.color}">${escapeHtml(f.name)}</option>
                    `).join('')}
                </select>
            </div>
            ${(bookmark.tags || []).length > 0 ? `
                <div class="bookmark-tags">
                    ${bookmark.tags.map(tag => `<span class="bookmark-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
        `;
        
        // Event listeners - using event delegation
        // Track visit
        el.querySelector('a').addEventListener('click', async () => {
            await trackVisit(bookmark.id);
        });
        
        el.querySelector('.bookmark-folder-select').addEventListener('change', async (e) => {
            const newFolder = e.target.value;
            const folderData = state.folders.find(f => f.name === newFolder);
            if (folderData) {
                e.target.style.color = folderData.color;
            } else {
                e.target.style.color = 'inherit';
            }
            await updateBookmarkFolder(bookmark.id, newFolder);
        });
        
        return el;
    }

    // Sort bookmarks
    function sortBookmarks(bookmarks) {
        const sorted = [...bookmarks];
        
        switch (state.sortBy) {
            case 'date':
                sorted.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
                break;
            case 'name':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'visits':
                sorted.sort((a, b) => (b.visitCount || 0) - (a.visitCount || 0));
                break;
        }
        
        return sorted;
    }

    // Filter bookmarks
    function filterBookmarks() {
        const searchTerm = elements.searchBox.value.toLowerCase();
        const selectedFolder = elements.folderSelect.value;

        const filtered = state.bookmarks
            .map((bookmark) => {
                const matchesFolder = selectedFolder === 'all' || bookmark.folder === selectedFolder;
                const matchesTag = !state.currentTag || (bookmark.tags || []).includes(state.currentTag);
                const score = getSearchScore(bookmark, searchTerm);
                const matchesSearch = !searchTerm || score > 0;

                return {
                    bookmark,
                    score,
                    matches: matchesFolder && matchesTag && matchesSearch
                };
            })
            .filter((entry) => entry.matches);

        if (searchTerm) {
            filtered.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return (b.bookmark.timestamp || 0) - (a.bookmark.timestamp || 0);
            });
            displayBookmarks(filtered.map((entry) => entry.bookmark), { preSorted: true });
        } else {
            displayBookmarks(filtered.map((entry) => entry.bookmark));
        }

        if (state.allBookmarksHidden) {
            elements.bookmarksContainer.querySelectorAll('.bookmark-item').forEach((item) => {
                item.classList.add('hidden');
            });
        }
    }

    function refreshBookmarkView() {
        filterBookmarks();
    }

    function getSearchScore(bookmark, searchTerm) {
        if (!searchTerm) return 1;

        const title = String(bookmark.title || '').toLowerCase();
        const url = String(bookmark.url || '').toLowerCase();
        const tags = (bookmark.tags || []).join(' ').toLowerCase();
        const folder = String(bookmark.folder || '').toLowerCase();

        let score = 0;
        if (title.startsWith(searchTerm)) score += 150;
        if (title.includes(searchTerm)) score += 100;
        if (url.includes(searchTerm)) score += 60;
        if (tags.includes(searchTerm)) score += 75;
        if (folder.includes(searchTerm)) score += 30;
        if ((bookmark.tags || []).some((tag) => String(tag).toLowerCase() === searchTerm)) score += 90;

        return score;
    }

    // Delete bookmark
    async function deleteBookmark(bookmarkId) {
        const index = getBookmarkIndexById(bookmarkId);
        if (index === -1) return;

        state.bookmarks.splice(index, 1);
        await StorageUtils.saveBookmarks(state.bookmarks);
        refreshBookmarkView();
        showToast(translations[state.currentLang]['delete'] + '!');
        await updateStats();
    }

    // Update bookmark folder
    async function updateBookmarkFolder(bookmarkId, newFolder) {
        const index = getBookmarkIndexById(bookmarkId);
        if (index === -1) return;

        state.bookmarks[index].folder = newFolder;
        await StorageUtils.saveBookmarks(state.bookmarks);
        refreshBookmarkView();
    }

    // Track visit
    async function trackVisit(bookmarkId) {
        const index = getBookmarkIndexById(bookmarkId);
        if (index === -1) return;

        state.bookmarks[index].visitCount = (state.bookmarks[index].visitCount || 0) + 1;
        state.bookmarks[index].lastVisited = Date.now();
        await StorageUtils.saveBookmarks(state.bookmarks);
    }

    function getBookmarkIndexById(bookmarkId) {
        return state.bookmarks.findIndex((bookmark) => bookmark.id === bookmarkId);
    }

    // Get favicon URL
    function getFavicon(url) {
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname;

            // Add robust validation for the domain name
            if (domain && domain.includes('.') && domain !== 'localhost' && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
                return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            } else {
                // Fallback for invalid or malformed domains
                return 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
            }
        } catch {
            // Fallback for completely unparseable URLs
            return 'https://www.google.com/s2/favicons?domain=example.com&sz=64';
        }
    }

    function normalizeHttpUrl(url) {
        try {
            const parsed = new URL(String(url || '').trim());
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return null;
            }

            Array.from(parsed.searchParams.keys()).forEach((paramName) => {
                const key = paramName.toLowerCase();
                if (TRACKING_PARAM_EXACT.has(key) || TRACKING_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix))) {
                    parsed.searchParams.delete(paramName);
                }
            });

            parsed.hash = '';
            parsed.hostname = parsed.hostname.toLowerCase();

            if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
                parsed.pathname = parsed.pathname.replace(/\/+$/, '');
            }

            if ((parsed.protocol === 'https:' && parsed.port === '443') || (parsed.protocol === 'http:' && parsed.port === '80')) {
                parsed.port = '';
            }

            return parsed.href;
        } catch {
            return null;
        }
    }

    function isSafeHttpUrl(url) {
        return normalizeHttpUrl(url) !== null;
    }

    function canonicalUrl(url) {
        const normalized = normalizeHttpUrl(url);
        return normalized ? normalized.toLowerCase() : null;
    }

    function getDomainTag(url) {
        try {
            const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
            if (!hostname) return null;
            const domainRoot = hostname.split('.')[0];
            return domainRoot && domainRoot.length > 2 ? domainRoot : null;
        } catch {
            return null;
        }
    }

    function inferTagsFromMeta(url, title) {
        const suggested = [];
        const domainTag = getDomainTag(url);
        if (domainTag) {
            suggested.push(domainTag);
        }

        const stopWords = new Set([
            'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'you', 'are', 'was', 'how',
            'what', 'when', 'where', 'will', 'can', 'about', 'into', 'out', 'why', 'new', 'best',
            'guide', 'tips', 'www', 'com', 'org', 'net', 'se', 'en', 'sv', 'tr', 'fr', 'es'
        ]);

        String(title || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length >= 4 && !stopWords.has(word))
            .slice(0, 8)
            .forEach((word) => {
                if (!suggested.includes(word)) {
                    suggested.push(word);
                }
            });

        return suggested.slice(0, 4);
    }

    function colorFromTagName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i += 1) {
            hash = (hash << 5) - hash + name.charCodeAt(i);
            hash |= 0;
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 68%, 48%)`;
    }

    function mergeTags(...tagLists) {
        const seen = new Set();
        const merged = [];
        tagLists.flat().forEach((tag) => {
            const value = String(tag || '').trim();
            if (!value) return;
            const key = value.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(value);
        });
        return merged.slice(0, 10);
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text ?? '');
        return div.innerHTML;
    }

    // Check password strength
    function checkPasswordStrength(password) {
        const result = CryptoUtils.checkPasswordStrength(password);
        
        elements.passwordStrength.classList.add('active');
        elements.strengthBar.className = 'strength-bar ' + result.strength;
        
        const strengthTexts = {
            weak: t('password_strength_weak', 'Weak password'),
            medium: t('password_strength_medium', 'Medium password'),
            strong: t('password_strength_strong', 'Strong password')
        };
        
        elements.strengthText.textContent = strengthTexts[result.strength];
    }

    // Modal functions
    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    function getCommandPaletteActions() {
        return [
            {
                id: 'save-page',
                label: t('cmd_save_page', 'Save current page'),
                icon: 'fa-plus-circle',
                shortcut: 'Ctrl+D',
                run: () => elements.addBookmarkBtn.click()
            },
            {
                id: 'focus-search',
                label: t('cmd_focus_search', 'Focus search'),
                icon: 'fa-search',
                shortcut: 'Ctrl+K',
                run: () => elements.searchBox.focus()
            },
            {
                id: 'new-folder',
                label: t('cmd_new_folder', 'Create new folder'),
                icon: 'fa-folder-plus',
                shortcut: 'Ctrl+N',
                run: () => elements.newFolderBtn.click()
            },
            {
                id: 'stats',
                label: t('statistics', 'Statistics'),
                icon: 'fa-chart-bar',
                shortcut: '-',
                run: () => elements.statsBtn.click()
            },
            {
                id: 'backup',
                label: t('backup_restore', 'Backup & Restore'),
                icon: 'fa-hdd',
                shortcut: '-',
                run: () => elements.backupBtn.click()
            },
            {
                id: 'export',
                label: t('export', 'Export'),
                icon: 'fa-file-export',
                shortcut: '-',
                run: () => elements.exportBtn.click()
            },
            {
                id: 'import',
                label: t('import', 'Import'),
                icon: 'fa-file-import',
                shortcut: '-',
                run: () => elements.importBtn.click()
            },
            {
                id: 'theme',
                label: t('cmd_toggle_theme', 'Toggle theme'),
                icon: 'fa-circle-half-stroke',
                shortcut: '-',
                run: () => elements.themeToggle.click()
            },
            {
                id: 'settings',
                label: t('settings_title', 'Settings'),
                icon: 'fa-cog',
                shortcut: '-',
                run: () => elements.settingsBtn.click()
            },
            {
                id: 'logout',
                label: t('logout', 'Logout'),
                icon: 'fa-right-from-bracket',
                shortcut: '-',
                run: () => elements.logoutBtn.click()
            }
        ];
    }

    function renderCommandResults(filterText = '') {
        const text = String(filterText || '').toLowerCase().trim();
        const allCommands = getCommandPaletteActions();
        const filtered = allCommands.filter((command) => {
            return !text || command.label.toLowerCase().includes(text) || command.id.includes(text);
        });

        state.activeCommands = filtered;
        state.commandIndex = Math.max(0, Math.min(state.commandIndex, Math.max(filtered.length - 1, 0)));
        elements.commandResults.innerHTML = '';

        filtered.forEach((command, index) => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = `command-item ${index === state.commandIndex ? 'active' : ''}`;

            const main = document.createElement('span');
            main.className = 'command-item-main';

            const icon = document.createElement('i');
            icon.className = `fas ${command.icon}`;
            const label = document.createElement('span');
            label.textContent = command.label;
            main.appendChild(icon);
            main.appendChild(label);

            const shortcut = document.createElement('span');
            shortcut.className = 'command-shortcut';
            shortcut.textContent = command.shortcut;

            item.appendChild(main);
            item.appendChild(shortcut);
            item.addEventListener('click', () => executeCommand(command));
            elements.commandResults.appendChild(item);
        });
    }

    function executeCommand(command) {
        if (!command) return;
        closeModal(elements.commandPaletteModal);
        command.run();
    }

    function openCommandPalette() {
        state.commandIndex = 0;
        openModal(elements.commandPaletteModal);
        renderCommandResults('');
        setTimeout(() => {
            elements.commandInput.value = '';
            elements.commandInput.focus();
        }, 40);
    }

    function moveCommandSelection(step) {
        if (!state.activeCommands.length) return;
        const lastIndex = state.activeCommands.length - 1;
        state.commandIndex = Math.max(0, Math.min(lastIndex, state.commandIndex + step));
        renderCommandResults(elements.commandInput.value);
    }

    // Load backups
    async function loadBackups() {
        const backups = await StorageUtils.getBackups();
        elements.backupsContainer.innerHTML = '';
        
        if (backups.length === 0) {
            const emptyText = document.createElement('p');
            emptyText.style.textAlign = 'center';
            emptyText.style.color = 'var(--text-muted)';
            emptyText.textContent = t('no_backups_yet', 'No backups yet');
            elements.backupsContainer.appendChild(emptyText);
            return;
        }
        
        backups.reverse().forEach(backup => {
            const item = document.createElement('div');
            item.className = 'backup-item';

            const backupDate = document.createElement('span');
            backupDate.className = 'backup-date';
            backupDate.textContent = new Date(backup.date).toLocaleString();

            const backupActions = document.createElement('div');
            backupActions.className = 'backup-actions';

            const restoreBtn = document.createElement('button');
            restoreBtn.className = 'backup-btn restore';
            restoreBtn.textContent = t('restore', 'Restore');

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'backup-btn delete';
            deleteBtn.textContent = t('delete', 'Delete');

            backupActions.appendChild(restoreBtn);
            backupActions.appendChild(deleteBtn);
            item.appendChild(backupDate);
            item.appendChild(backupActions);
            
            restoreBtn.addEventListener('click', async () => {
                if (confirm(t('restore_backup_confirm', 'Are you sure you want to restore this backup? Current data will be replaced.'))) {
                    showLoader();
                    await StorageUtils.restoreFromBackup(backup.id);
                    state.bookmarks = await StorageUtils.getBookmarks();
                    refreshBookmarkView();
                    hideLoader();
                    showToast(t('backup_restored', 'Backup restored!'));
                    closeModal(elements.backupModal);
                }
            });
            
            deleteBtn.addEventListener('click', async () => {
                await StorageUtils.deleteBackup(backup.id);
                loadBackups();
            });
            
            elements.backupsContainer.appendChild(item);
        });
    }

    // Event Listeners
    
    // Language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const lang = this.dataset.lang;
            applyTranslation(lang);
            StorageUtils.savePreferences({ language: lang });
            loadFolders().then(() => refreshBookmarkView());
        });
    });

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    elements.commandPaletteBtn.addEventListener('click', openCommandPalette);
    elements.commandInput.addEventListener('input', (event) => {
        state.commandIndex = 0;
        renderCommandResults(event.target.value);
    });
    elements.commandInput.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            moveCommandSelection(1);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            moveCommandSelection(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            executeCommand(state.activeCommands[state.commandIndex]);
        }
    });

    // Get started
    elements.getStartedBtn.addEventListener('click', async () => {
        elements.welcomeScreen.style.display = 'none';
        const { hash } = await StorageUtils.getPasswordData();
        if (hash) {
            showBookmarks();
        } else {
            elements.registerSection.style.display = 'block';
        }
    });

    // Show register
    elements.showRegisterBtn.addEventListener('click', () => {
        elements.loginSection.style.display = 'none';
        elements.welcomeScreen.style.display = 'none';
        elements.registerSection.style.display = 'block';
    });

    // Cancel register
    elements.cancelRegisterBtn.addEventListener('click', () => {
        elements.registerSection.style.display = 'none';
        elements.loginSection.style.display = 'block';
        elements.newPassword.value = '';
        elements.confirmPassword.value = '';
        elements.passwordStrength.classList.remove('active');
    });

    // Password strength check
    elements.newPassword.addEventListener('input', (e) => {
        checkPasswordStrength(e.target.value);
    });

    // Toggle password visibility
    elements.togglePassword.addEventListener('click', () => {
        const type = elements.password.type === 'password' ? 'text' : 'password';
        elements.password.type = type;
        elements.togglePassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Register
    elements.registerBtn.addEventListener('click', async () => {
        const password = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        
        if (password !== confirmPassword) {
            showToast(translations[state.currentLang]['password_mismatch'], 'error');
            return;
        }
        
        if (password.length < 6) {
            showToast(translations[state.currentLang]['password_length'], 'error');
            return;
        }
        
        showLoader();
        
        const { hash, salt } = await CryptoUtils.hashPassword(password);
        await StorageUtils.savePasswordData(hash, salt);
        await StorageUtils.saveLoginStatus(true);
        
        hideLoader();
        showToast(translations[state.currentLang]['password_registered']);
        elements.newPassword.value = '';
        elements.confirmPassword.value = '';
        elements.registerSection.style.display = 'none';
        showBookmarks(); // Show bookmarks directly after successful registration
    });

    // Login
    elements.loginBtn.addEventListener('click', async () => {
        const password = elements.password.value;
        
        showLoader();
        
        const { hash, salt } = await StorageUtils.getPasswordData();
        
        if (!hash) {
            hideLoader();
            showToast(translations[state.currentLang]['no_password'], 'error');
            elements.showRegisterBtn.click();
            return;
        }
        
        const isValid = await CryptoUtils.verifyPassword(password, hash, salt);
        
        hideLoader();
        
        if (isValid) {
            await StorageUtils.saveLoginStatus(true);
            elements.password.value = '';
            showBookmarks();
        } else {
            showToast(translations[state.currentLang]['wrong_password'], 'error');
        }
    });

    // Logout
    elements.logoutBtn.addEventListener('click', async () => {
        await StorageUtils.saveLoginStatus(false);
        elements.password.value = '';
        elements.loginSection.style.display = 'block';
        elements.registerSection.style.display = 'none';
        elements.bookmarksSection.style.display = 'none';
        elements.welcomeScreen.style.display = 'none';
    });

    // Add bookmark
    elements.addBookmarkBtn.addEventListener('click', async () => {
        const tabMeta = await refreshCurrentTabMeta();
        if (!tabMeta || !isSafeHttpUrl(tabMeta.url)) {
            showToast(t('invalid_url', 'Unsupported URL. Only HTTP/HTTPS pages can be saved.'), 'error');
            return;
        }

        const normalizedUrl = normalizeHttpUrl(tabMeta.url);
        const normalizedCanonical = canonicalUrl(normalizedUrl);
        if (!normalizedUrl || !normalizedCanonical) {
            showToast(t('invalid_url', 'Unsupported URL. Only HTTP/HTTPS pages can be saved.'), 'error');
            return;
        }

        const selectedFolder = elements.folderSelectAdd.value || state.folders[0]?.name;
        const userTagNames = elements.tagInput.value.split(',').map((tag) => tag.trim()).filter(Boolean);
        const suggestedTagNames = inferTagsFromMeta(normalizedUrl, tabMeta.title);
        const tagNames = mergeTags(userTagNames, suggestedTagNames);

        const bookmarkTags = [];
        for (const tagName of tagNames) {
            let tag = state.tags.find((entry) => entry.name.toLowerCase() === tagName.toLowerCase());
            if (!tag) {
                tag = {
                    id: CryptoUtils.generateUUID(),
                    name: tagName,
                    color: colorFromTagName(tagName)
                };
                state.tags.push(tag);
            }
            bookmarkTags.push(tag.name);
        }
        await StorageUtils.saveTags(state.tags);

        let favicon = tabMeta.favIconUrl;
        if (!favicon) {
            favicon = getFavicon(normalizedUrl);
        }

        const newBookmark = {
            id: CryptoUtils.generateUUID(),
            title: tabMeta.title,
            url: normalizedUrl,
            folder: selectedFolder,
            tags: bookmarkTags,
            favicon,
            date: new Date().toLocaleDateString(state.currentLang, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            timestamp: Date.now(),
            visitCount: 0,
            lastVisited: null
        };

        const alreadyExists = state.bookmarks.some((bookmark) => canonicalUrl(bookmark.url) === normalizedCanonical);
        if (alreadyExists) {
            showToast(translations[state.currentLang]['already_saved'], 'error');
            return;
        }

        state.bookmarks.push(newBookmark);
        await StorageUtils.saveBookmarks(state.bookmarks);

        elements.tagInput.value = '';
        state.activeSuggestedTags = inferTagsFromMeta(normalizedUrl, tabMeta.title);
        updateSmartTagSuggestions();

        refreshBookmarkView();
        showToast(t('saved_clean_link', 'Saved with smart cleanup and tags!'));
        await updateStats();
        loadTags();
    });

    // Show/hide all
    elements.showAllBtn.addEventListener('click', () => {
        state.allBookmarksHidden = false;
        filterBookmarks();
        elements.showAllBtn.classList.add('active');
        elements.hideAllBtn.classList.remove('active');
    });

    elements.hideAllBtn.addEventListener('click', () => {
        state.allBookmarksHidden = true;
        filterBookmarks();
        elements.hideAllBtn.classList.add('active');
        elements.showAllBtn.classList.remove('active');
    });

    // Refresh
    elements.refreshBtn.addEventListener('click', async () => {
        elements.refreshBtn.style.transform = 'rotate(360deg)';
        elements.refreshBtn.style.transition = 'transform 0.5s ease';
        
        state.bookmarks = await StorageUtils.getBookmarks();
        refreshBookmarkView();
        await updateStats();
        await refreshCurrentTabMeta();
        
        setTimeout(() => {
            elements.refreshBtn.style.transform = 'rotate(0deg)';
        }, 500);
    });

    // Stats modal
    elements.statsBtn.addEventListener('click', () => {
        updateStats();
        openModal(elements.statsModal);
    });

    // Backup modal
    elements.backupBtn.addEventListener('click', () => {
        loadBackups();
        openModal(elements.backupModal);
    });

    // Create backup
    elements.createBackupBtn.addEventListener('click', async () => {
        showLoader();
        await StorageUtils.createBackup();
        hideLoader();
        showToast(t('backup_created', 'Backup created!'));
        loadBackups();
    });

    // Auto backup toggle
    elements.autoBackupToggle.addEventListener('change', async () => {
        await StorageUtils.savePreferences({ autoBackup: elements.autoBackupToggle.checked });
        chrome.runtime.sendMessage({ action: 'setupAutoBackup' });
        showToast(elements.autoBackupToggle.checked
            ? t('auto_backup_enabled', 'Automatic backup enabled!')
            : t('auto_backup_disabled', 'Automatic backup disabled!')
        );
    });

    // Settings - open options page
    elements.settingsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Search
    let searchTimeout;
    elements.searchBox.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterBookmarks, 300);
    });

    elements.tagInput.addEventListener('input', () => {
        updateSmartTagSuggestions();
    });

    // Folder selection color updates
    elements.folderSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        e.target.style.color = selectedOption.style.color || 'inherit';
        filterBookmarks();
    });

    elements.folderSelectAdd.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        e.target.style.color = selectedOption.style.color || 'inherit';
    });

    // Sort buttons
    elements.sortDateBtn.addEventListener('click', () => {
        state.sortBy = 'date';
        updateSortButtons();
        refreshBookmarkView();
    });

    elements.sortNameBtn.addEventListener('click', () => {
        state.sortBy = 'name';
        updateSortButtons();
        refreshBookmarkView();
    });
    elements.sortVisitsBtn.addEventListener('click', () => {
        state.sortBy = 'visits';
        updateSortButtons();
        refreshBookmarkView();
    });

    function updateSortButtons() {
        [elements.sortDateBtn, elements.sortNameBtn, elements.sortVisitsBtn].forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (state.sortBy === 'date') elements.sortDateBtn.classList.add('active');
        if (state.sortBy === 'name') elements.sortNameBtn.classList.add('active');
        if (state.sortBy === 'visits') elements.sortVisitsBtn.classList.add('active');
    }

    // New folder modal
    elements.newFolderBtn.addEventListener('click', () => {
        elements.folderName.value = '';
        openModal(elements.folderModal);
        elements.folderName.focus();
    });

    // Color selection
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedFolderColor = btn.dataset.color;
            
            // Sync custom inputs
            if (elements.folderColorPicker) elements.folderColorPicker.value = btn.dataset.color;
            if (elements.folderColorHex) elements.folderColorHex.value = btn.dataset.color.replace('#', '');
        });
    });

    // Custom color picker logic
    if (elements.folderColorPicker) {
        elements.folderColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            state.selectedFolderColor = color;
            if (elements.folderColorHex) elements.folderColorHex.value = color.replace('#', '');
            
            // Remove active state from predefined options
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
        });
    }

    if (elements.folderColorHex) {
        elements.folderColorHex.addEventListener('input', (e) => {
            let hex = e.target.value.trim();
            if (!hex.startsWith('#')) hex = '#' + hex;
            
            if (/^#[0-9A-F]{6}$/i.test(hex)) {
                state.selectedFolderColor = hex;
                if (elements.folderColorPicker) elements.folderColorPicker.value = hex;
                
                // Remove active state from predefined options
                document.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
            }
        });
    }

    // Save folder
    elements.saveFolderBtn.addEventListener('click', async () => {
        const name = elements.folderName.value.trim();
        
        if (!name) return;
        
        if (state.folders.some(f => f.name.toLowerCase() === name.toLowerCase())) {
            showToast(translations[state.currentLang]['folder_exists'], 'error');
            return;
        }
        
        const newFolder = {
            id: CryptoUtils.generateUUID(),
            name: name,
            color: state.selectedFolderColor,
            isDefault: false
        };
        
        state.folders.push(newFolder);
        await StorageUtils.saveFolders(state.folders);
        
        updateFolderDropdowns();
        closeModal(elements.folderModal);
        showToast(translations[state.currentLang]['folder_add_success']);
    });

    // Delete folder
    elements.deleteFolderBtn.addEventListener('click', async () => {
        const selectedFolder = elements.folderSelect.value;
        
        if (selectedFolder === 'all') return;
        
        if (!confirm(translations[state.currentLang]['folder_delete_confirm'])) return;
        
        // Move bookmarks to first folder
        const firstFolder = state.folders[0]?.name;
        state.bookmarks.forEach(b => {
            if (b.folder === selectedFolder) {
                b.folder = firstFolder;
            }
        });
        
        // Remove folder
        state.folders = state.folders.filter(f => f.name !== selectedFolder);
        
        await StorageUtils.saveBookmarks(state.bookmarks);
        await StorageUtils.saveFolders(state.folders);
        
        updateFolderDropdowns();
        refreshBookmarkView();
        showToast(translations[state.currentLang]['folder_delete_success']);
    });

    // Export
    elements.exportBtn.addEventListener('click', async () => {
        const data = await StorageUtils.exportAllData();
        
        if (data.bookmarks.length === 0) {
            showToast(translations[state.currentLang]['no_bookmarks'], 'error');
            return;
        }
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportName = `PrivateLinkSaver_backup_${new Date().toISOString().slice(0, 10)}.json`;
        
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = exportName;
        link.click();
        
        showToast(translations[state.currentLang]['export_success']);
    });

    // Toggle cloud password visibility
    if (elements.toggleCloudPassword) {
        elements.toggleCloudPassword.addEventListener('click', () => {
            const type = elements.cloudPassword.type === 'password' ? 'text' : 'password';
            elements.cloudPassword.type = type;
            elements.toggleCloudPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
    }

    // Cloud login
    if (elements.cloudLoginBtn) {
        elements.cloudLoginBtn.addEventListener('click', async () => {
            const email = elements.cloudEmail.value.trim();
            const password = elements.cloudPassword.value;
            
            if (!email || !password) {
                showToast('Please enter email and password', 'error');
                return;
            }

            showLoader();
            try {
                await CloudAuth.login(email, password);

                const verified = await CloudAuth.isEmailVerified();
                if (!verified) {
                    await firebase.auth().signOut();
                    hideLoader();
                    showToast('Please verify your email address before logging in.', 'error');
                    return;
                }

                let salt = generateSalt();
                const cloudKeyData = await StorageUtils.get(['cloudEncryptionSalt']);
                if (cloudKeyData.cloudEncryptionSalt && cloudKeyData.cloudEncryptionSalt !== 'derived') {
                    salt = cloudKeyData.cloudEncryptionSalt;
                }
                state.cloudEncryptionKey = await getCloudEncryptionKey(password, salt);
                state.cloudPassword = password;
                state.cloudSalt = salt;
                state.cloudLoggedIn = true;
                await StorageUtils.set({ cloudEncryptionSalt: salt });
                hideLoader();
                showToast('Logged in successfully!');
                await updateCloudUI();
                await showBookmarks();
            } catch (error) {
                hideLoader();
                showToast(error.message, 'error');
            }
        });
    }

    // Cloud register
    if (elements.cloudRegisterBtn) {
        elements.cloudRegisterBtn.addEventListener('click', async () => {
            const email = elements.cloudEmail.value.trim();
            const password = elements.cloudPassword.value;
            
            if (!email || !password) {
                showToast('Please enter email and password', 'error');
                return;
            }

            if (password.length < 6) {
                showToast('Password must be at least 6 characters', 'error');
                return;
            }

            showLoader();
            try {
                await CloudAuth.register(email, password);
                const salt = generateSalt();
                state.cloudEncryptionKey = await getCloudEncryptionKey(password, salt);
                state.cloudPassword = password;
                state.cloudSalt = salt;
                state.cloudLoggedIn = true;
                await StorageUtils.set({ cloudEncryptionSalt: salt });
                hideLoader();
                showToast('Account created! Please check your email for the verification link.');

                // Show verification dialog
                await showEmailVerificationDialogPopup(email, password, salt);
            } catch (error) {
                hideLoader();
                showToast(error.message, 'error');
            }
        });
    }

    // Email verification dialog for popup
    async function showEmailVerificationDialogPopup(email, password, salt) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:#fff;border-radius:16px;padding:32px;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.3);text-align:center;color:#1e293b;font-family:Inter,sans-serif;';
        dialog.innerHTML = `
            <div style="font-size:48px;margin-bottom:16px;">📧</div>
            <h3 style="margin:0 0 8px;font-size:20px;">Verify Your Email</h3>
            <p style="margin:0 0 8px;font-size:14px;color:#64748b;line-height:1.5;">A verification email has been sent to<br><strong>${email}</strong></p>
            <p style="margin:0 0 24px;font-size:13px;color:#64748b;">Click the link in the email, then confirm below.</p>
            <div id="popup-verify-status" style="margin-bottom:16px;font-size:13px;min-height:20px;"></div>
            <div style="display:flex;gap:12px;">
                <button id="popup-verify-cancel-btn" style="flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:8px;background:transparent;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;">Cancel</button>
                <button id="popup-verify-confirm-btn" style="flex:1;padding:12px;border:none;border-radius:8px;background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:white;font-size:14px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;">I've Verified</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const statusEl = dialog.querySelector('#popup-verify-status');
        const cancelBtn = dialog.querySelector('#popup-verify-cancel-btn');
        const confirmBtn = dialog.querySelector('#popup-verify-confirm-btn');

        return new Promise((resolve) => {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(overlay);
                resolve(false);
            });

            confirmBtn.addEventListener('click', async () => {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'Checking...';
                statusEl.textContent = '';
                statusEl.style.color = '';

                try {
                    const verified = await CloudAuth.isEmailVerified();
                    if (verified) {
                        statusEl.textContent = 'Email verified! You can now use cloud sync.';
                        statusEl.style.color = '#10b981';
                        setTimeout(async () => {
                            document.body.removeChild(overlay);
                            await updateCloudUI();
                            resolve(true);
                        }, 1000);
                    } else {
                        statusEl.textContent = 'Email not verified yet. Please check your inbox and click the verification link.';
                        statusEl.style.color = '#ef4444';
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = "I've Verified";
                    }
                } catch (error) {
                    statusEl.textContent = 'Check failed: ' + error.message;
                    statusEl.style.color = '#ef4444';
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = "I've Verified";
                }
            });
        });
    }

    // Cloud forgot password
    if (elements.cloudForgotBtn) {
        elements.cloudForgotBtn.addEventListener('click', async () => {
            const email = elements.cloudEmail.value.trim();
            if (!email) {
                showToast('Please enter your email address', 'error');
                return;
            }

            try {
                await CloudAuth.resetPassword(email);
                showToast('Password reset email sent!');
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    // Back to login button
    if (elements.backToLoginBtn) {
        elements.backToLoginBtn.addEventListener('click', () => {
            elements.cloudAccountSection.querySelector('.cloud-form').style.display = 'block';
            elements.cloudAccountSection.querySelector('.auth-footer').style.display = 'none';
        });
    }

    // Helper to derive encryption key from password
    async function getCloudEncryptionKey(password, salt) {
        const encoder = new TextEncoder();
        
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: 100000,
                hash: 'SHA-256'
            },
            await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                { name: 'PBKDF2', length: 256 },
                false,
                ['deriveKey']
            ),
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

    function generateSalt() {
        const array = crypto.getRandomValues(new Uint8Array(16));
        return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function updateCloudUI() {
        const user = await CloudAuth.getCurrentUser();
        if (user && elements.cloudSyncStatus) {
            const emailVerified = user.emailVerified;
            elements.cloudSyncStatus.style.display = 'block';
            elements.cloudSyncStatus.innerHTML = `
                <div class="cloud-status">
                    <div class="cloud-status-info">
                        <svg class="icon" viewBox="0 0 24 24"><use href="#icon-cloud"></use></svg>
                        <div>
                            <div style="font-weight: 600;">${user.email}${!emailVerified ? ' <span style="color:#f59e0b;font-size:11px;">(not verified)</span>' : ''}</div>
                            <div class="cloud-email-display">${emailVerified ? 'Cloud sync enabled' : 'Please verify your email first'}</div>
                        </div>
                    </div>
                    <div class="cloud-status-actions">
                        <button id="cloud-sync-btn" class="btn btn-sm btn-outline" ${!emailVerified ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                            <svg class="icon" viewBox="0 0 24 24"><use href="#icon-sync"></use></svg>
                        </button>
                        <button id="cloud-logout-btn" class="btn btn-sm btn-danger">
                            <svg class="icon" viewBox="0 0 24 24"><use href="#icon-sign-out"></use></svg>
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('cloud-sync-btn')?.addEventListener('click', async () => {
                if (!state.cloudEncryptionKey) return;
                const verified = await CloudAuth.isEmailVerified();
                if (!verified) {
                    showToast('Please verify your email before syncing.', 'error');
                    return;
                }
                showToast('Syncing...', 'info');
                try {
                    const localData = await StorageUtils.exportAllData();
                    await CloudStorage.syncToCloud(localData, state.cloudEncryptionKey, state.cloudSalt);
                    const result = await CloudStorage.syncFromCloud(state.cloudEncryptionKey, state.cloudPassword);
                    if (result.hasCloudData && !result.decryptError && result.data) {
                        await StorageUtils.importData(result.data, true);
                        state.bookmarks = await StorageUtils.getBookmarks();
                        refreshBookmarkView();
                        showToast('Sync completed!');
                    } else if (result.decryptError) {
                        showToast(t('cloud_decrypt_error'), 'error');
                    } else {
                        showToast('Upload complete');
                    }
                } catch (error) {
                    if (error.offline) {
                        showToast(t('cloud_offline'), 'warning');
                    } else {
                        showToast('Sync failed: ' + error.message, 'error');
                    }
                }
            });

            document.getElementById('cloud-logout-btn')?.addEventListener('click', async () => {
                await CloudAuth.logout();
                state.cloudEncryptionKey = null;
                state.cloudLoggedIn = false;
                elements.cloudSyncStatus.style.display = 'none';
                showToast('Logged out');
            });
        } else if (elements.cloudSyncStatus) {
            elements.cloudSyncStatus.style.display = 'none';
        }
    }

    // Open edit bookmark modal
    function openEditBookmarkModal(bookmark) {
        // Ensure bookmark has an ID for reliable tracking
        if (!bookmark.id) {
            bookmark.id = CryptoUtils.generateUUID();
        }
        state.editingBookmarkId = bookmark.id;
        
        elements.editBookmarkTitle.value = bookmark.title;
        elements.editBookmarkUrl.value = bookmark.url;
        openModal(elements.editBookmarkModal);
        setTimeout(() => elements.editBookmarkTitle.focus(), 100);
    }

    // Save edited bookmark
    elements.saveBookmarkEditBtn.addEventListener('click', async () => {
        const newTitle = elements.editBookmarkTitle.value.trim();
        const newUrl = elements.editBookmarkUrl.value.trim();
        
        if (!newTitle || !newUrl) return;

        if (!isSafeHttpUrl(newUrl)) {
            showToast(t('invalid_url', 'Unsupported URL. Only HTTP/HTTPS links are allowed.'), 'error');
            return;
        }

        const normalizedUrl = normalizeHttpUrl(newUrl);
        const normalizedCanonical = canonicalUrl(newUrl);
        if (!normalizedUrl || !normalizedCanonical) {
            showToast(t('invalid_url', 'Unsupported URL. Only HTTP/HTTPS links are allowed.'), 'error');
            return;
        }

        const duplicate = state.bookmarks.some((bookmark) => {
            if (bookmark.id === state.editingBookmarkId) return false;
            return canonicalUrl(bookmark.url) === normalizedCanonical;
        });
        if (duplicate) {
            showToast(translations[state.currentLang]['already_saved'], 'error');
            return;
        }
        
        // Find bookmark
        const bookmarkIndex = state.bookmarks.findIndex(b => b.id === state.editingBookmarkId);
        
        if (bookmarkIndex !== -1) {
            state.bookmarks[bookmarkIndex].title = newTitle;
            state.bookmarks[bookmarkIndex].url = normalizedUrl;
            
            await StorageUtils.saveBookmarks(state.bookmarks);
            refreshBookmarkView();
            closeModal(elements.editBookmarkModal);
            showToast(translations[state.currentLang]['save'] + '!');
        } else {
            // Fallback: if ID lookup fails (shouldn't happen if we set it), try to find by other means or just close
             closeModal(elements.editBookmarkModal);
        }
    });
    
    // Allow Enter key to save
    elements.editBookmarkTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.saveBookmarkEditBtn.click();
    });
    
    elements.editBookmarkUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.saveBookmarkEditBtn.click();
    });

    // Import
    elements.importBtn.addEventListener('click', () => {
        elements.fileInput.click();
    });

    elements.fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (!importedData.bookmarks || !Array.isArray(importedData.bookmarks)) {
                    throw new Error('Invalid format');
                }
                
                const merge = confirm(t('merge_import_confirm', 'Do you want to merge with existing bookmarks? Click Cancel to replace all.'));
                
                showLoader();
                await StorageUtils.importData(importedData, merge);
                
                state.bookmarks = await StorageUtils.getBookmarks();
                state.folders = await StorageUtils.getFolders();
                state.tags = await StorageUtils.getTags();
                
                updateFolderDropdowns();
                updateTagList();
                refreshBookmarkView();
                await updateStats();
                
                hideLoader();
                showToast(translations[state.currentLang]['import_success']);
            } catch (error) {
                hideLoader();
                showToast(translations[state.currentLang]['import_error'], 'error');
            }
        };
        reader.readAsText(file);
        elements.fileInput.value = '';
    });

    // Close modals
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
            e.preventDefault();
            openCommandPalette();
            return;
        }

        // Ctrl/Cmd + K - focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            e.stopPropagation();
            elements.searchBox.focus();
        }
        
        // Escape - clear search or close command palette
        if (e.key === 'Escape' && elements.commandPaletteModal.classList.contains('active')) {
            closeModal(elements.commandPaletteModal);
            return;
        }

        if (e.key === 'Escape' && document.activeElement === elements.searchBox) {
            elements.searchBox.value = '';
            filterBookmarks();
            elements.searchBox.blur();
        }
        
        // Ctrl/Cmd + N - new folder
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            e.stopPropagation();
            elements.newFolderBtn.click();
        }
        
        // Ctrl/Cmd + D - add bookmark
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            e.stopPropagation();
            elements.addBookmarkBtn.click();
        }
    });

    // Enter key handlers
    elements.password.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.loginBtn.click();
    });

    elements.newPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.confirmPassword.focus();
    });

    elements.confirmPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.registerBtn.click();
    });

    elements.folderName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') elements.saveFolderBtn.click();
    });

    // Initialize
    await initTheme();
    applyTranslation(state.currentLang);
    await loadFolders();
    await loadTags();
    await refreshCurrentTabMeta();
    await updateCloudUI();
    
    // Listen for messages from other parts of the extension (e.g., options page)
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.action === 'languageChanged') {
            applyTranslation(request.language);
            await loadFolders(); // Reload folders to update translated names
            refreshBookmarkView();
        } else if (request.action === 'focusSearch') {
            setTimeout(() => elements.searchBox.focus(), 100);
        }
    });

    // Check login status
    const isLoggedIn = await StorageUtils.getLoginStatus();
    const { hash } = await StorageUtils.getPasswordData();
    const prefs = await StorageUtils.getPreferences();
    
    // If a password hash exists, we should either show bookmarks or the login screen
    if (hash) {
        if (isLoggedIn) {
            if (prefs.firstTime) {
                showWelcomeScreen();
                await StorageUtils.savePreferences({ firstTime: false });
            } else {
                showBookmarks();
            }
        } else {
            // Not logged in but password exists -> Show login section
            elements.loginSection.style.display = 'block';
            elements.welcomeScreen.style.display = 'none';
            elements.registerSection.style.display = 'none';
            elements.bookmarksSection.style.display = 'none';
            await updateStats();
        }
    } else {
        // No password yet -> New installation flow
        await StorageUtils.savePreferences({ firstTime: true });
        showWelcomeScreen();
    }

    // ===== Chrome Bookmarks Import =====

    async function checkAndRequestBookmarksPermission() {
        return new Promise((resolve) => {
            chrome.permissions.contains({ permissions: ['bookmarks'] }, (granted) => {
                if (granted) { resolve(true); return; }
                chrome.permissions.request({ permissions: ['bookmarks'] }, (approved) => {
                    if (!approved) {
                        showToast(t('bookmarks_permission_required', 'Permission required to access Chrome bookmarks'), 'error');
                    }
                    resolve(approved);
                });
            });
        });
    }

    async function openChromeBookmarksModal() {
        const granted = await checkAndRequestBookmarksPermission();
        if (!granted) return;

        const treeContainer = document.getElementById('chrome-bookmarks-tree');
        treeContainer.innerHTML = '';

        try {
            chrome.bookmarks.getTree((tree) => {
                renderBookmarkTree(tree, treeContainer);
                document.getElementById('chrome-bookmarks-modal').classList.add('active');
            });
        } catch (err) {
            showToast(t('save_error', 'Could not load Chrome bookmarks'), 'error');
        }
    }

    function closeChromeBookmarksModal() {
        document.getElementById('chrome-bookmarks-modal').classList.remove('active');
        document.getElementById('chrome-bookmarks-tree').innerHTML = '';
    }

    document.getElementById('chrome-import-btn').addEventListener('click', openChromeBookmarksModal);
    document.getElementById('chrome-bookmarks-close-btn').addEventListener('click', closeChromeBookmarksModal);

    function folderHasValidLinks(node) {
        if (node.url) return StorageUtils.isSafeHttpUrl(node.url);
        return (node.children || []).some(folderHasValidLinks);
    }

    function collectValidLinks(node) {
        if (node.url) {
            return StorageUtils.isSafeHttpUrl(node.url) ? [node] : [];
        }
        return (node.children || []).flatMap(collectValidLinks);
    }

    function renderBookmarkTree(nodes, container) {
        nodes.forEach((node) => {
            const el = renderBookmarkNode(node);
            if (el) container.appendChild(el);
        });
    }

    function renderBookmarkNode(node) {
        const wrapper = document.createElement('div');
        wrapper.className = 'chrome-tree-node';

        if (!node.url) {
            // Folder node
            const row = document.createElement('div');
            row.className = 'chrome-tree-folder';

            const toggle = document.createElement('button');
            toggle.className = 'chrome-tree-toggle';
            toggle.textContent = '▶';

            const icon = document.createElement('i');
            icon.className = 'chrome-tree-icon fas fa-folder';

            const title = document.createElement('span');
            title.className = 'chrome-tree-title';
            title.textContent = node.title || 'Folder';

            const actions = document.createElement('div');
            actions.className = 'chrome-node-actions';

            if (folderHasValidLinks(node)) {
                const importBtn = document.createElement('button');
                importBtn.className = 'chrome-import-btn-sm';
                importBtn.textContent = t('import_folder', 'Import Folder');
                importBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    importFolder(node);
                });
                actions.appendChild(importBtn);
            }

            row.appendChild(toggle);
            row.appendChild(icon);
            row.appendChild(title);
            row.appendChild(actions);

            const children = document.createElement('div');
            children.className = 'chrome-tree-children';
            renderBookmarkTree(node.children || [], children);

            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = children.classList.toggle('open');
                toggle.classList.toggle('open', isOpen);
                icon.className = `chrome-tree-icon fas fa-folder${isOpen ? '-open' : ''}`;
            });

            wrapper.appendChild(row);
            wrapper.appendChild(children);
        } else {
            // Link node
            if (!StorageUtils.isSafeHttpUrl(node.url)) return null;

            const row = document.createElement('div');
            row.className = 'chrome-tree-link';

            const spacer = document.createElement('span');
            spacer.style.width = '16px';
            spacer.style.flexShrink = '0';

            const favicon = document.createElement('img');
            favicon.className = 'chrome-tree-favicon';
            try {
                const domain = new URL(node.url).hostname;
                favicon.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`;
            } catch (_) {
                favicon.style.display = 'none';
            }
            favicon.alt = '';

            const title = document.createElement('span');
            title.className = 'chrome-tree-title';
            title.textContent = node.title || node.url;

            const actions = document.createElement('div');
            actions.className = 'chrome-node-actions';

            const importBtn = document.createElement('button');
            importBtn.className = 'chrome-import-btn-sm';
            importBtn.textContent = t('import_link', 'Import Link');
            importBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                importSingleLink(node);
            });
            actions.appendChild(importBtn);

            row.appendChild(spacer);
            row.appendChild(favicon);
            row.appendChild(title);
            row.appendChild(actions);
            wrapper.appendChild(row);
        }

        return wrapper;
    }

    async function importSingleLink(node) {
        const normalizedUrl = StorageUtils.normalizeBookmarkUrl(node.url);
        if (!normalizedUrl) return;

        const existing = await StorageUtils.getBookmarks();
        const canonical = StorageUtils.canonicalUrl(normalizedUrl);
        const isDuplicate = existing.some((b) => StorageUtils.canonicalUrl(b.url) === canonical);

        if (isDuplicate) {
            showToast(t('link_already_exists', 'Link already exists'), 'warning');
            return;
        }

        const folderName = elements.folderSelectAdd.value || state.folders[0]?.name || 'General';
        const newBookmark = {
            id: CryptoUtils.generateUUID(),
            title: String(node.title || normalizedUrl).trim(),
            url: normalizedUrl,
            folder: folderName,
            tags: [],
            favicon: null,
            date: new Date().toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
            timestamp: Date.now(),
            visitCount: 0,
            lastVisited: null
        };

        await StorageUtils.saveBookmarks([...existing, newBookmark]);
        await refreshAfterImport();
        showToast(t('import_success', 'Imported!'), 'success');
    }

    async function importFolder(node) {
        const validLinks = collectValidLinks(node);
        if (validLinks.length === 0) {
            showToast(t('folder_empty', 'Folder has no importable links'), 'info');
            return;
        }

        // Ensure folder exists
        const existingFolders = await StorageUtils.getFolders();
        const folderName = String(node.title || 'Imported').trim();
        const folderExists = existingFolders.some((f) => f.name.toLowerCase() === folderName.toLowerCase());

        if (!folderExists) {
            const newFolder = {
                id: CryptoUtils.generateUUID(),
                name: folderName,
                color: '#3498db',
                isDefault: false,
                key: undefined
            };
            await StorageUtils.saveFolders([...existingFolders, newFolder]);
        }

        // Import links
        const existing = await StorageUtils.getBookmarks();
        const existingCanonicals = new Set(existing.map((b) => StorageUtils.canonicalUrl(b.url)));
        let imported = 0;
        let skipped = 0;
        const toAdd = [];

        for (const linkNode of validLinks) {
            const normalizedUrl = StorageUtils.normalizeBookmarkUrl(linkNode.url);
            if (!normalizedUrl) { skipped++; continue; }
            const canonical = StorageUtils.canonicalUrl(normalizedUrl);
            if (existingCanonicals.has(canonical)) { skipped++; continue; }
            existingCanonicals.add(canonical);
            toAdd.push({
                id: CryptoUtils.generateUUID(),
                title: String(linkNode.title || normalizedUrl).trim(),
                url: normalizedUrl,
                folder: folderName,
                tags: [],
                favicon: null,
                date: new Date().toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' }),
                timestamp: Date.now(),
                visitCount: 0,
                lastVisited: null
            });
            imported++;
        }

        await StorageUtils.saveBookmarks([...existing, ...toAdd]);
        await refreshAfterImport();
        showToast(`${t('import_success', 'Imported')}: ${imported} | ${t('skipped', 'Skipped')}: ${skipped}`, imported > 0 ? 'success' : 'info');
    }

    async function refreshAfterImport() {
        state.bookmarks = await StorageUtils.getBookmarks();
        state.folders = await StorageUtils.getFolders();
        updateFolderDropdowns();
        refreshBookmarkView();
        await updateStats();
    }

});
