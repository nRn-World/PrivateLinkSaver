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
        totalBookmarks: document.getElementById('total-bookmarks'),
        totalFolders: document.getElementById('total-folders'),
        totalTags: document.getElementById('total-tags'),
        quickBookmarkCount: document.getElementById('quick-bookmark-count'),
        quickFolderCount: document.getElementById('quick-folder-count'),
        quickTagCount: document.getElementById('quick-tag-count'),
        togglePassword: document.getElementById('toggle-password')
    };

    // State variables
    let state = {
        currentLang: 'sv',
        darkMode: false,
        allBookmarksHidden: false,
        currentFolder: 'all',
        currentTag: null,
        folders: [],
        tags: [],
        bookmarks: [],
        sortBy: 'date',
        selectedFolderColor: '#8e44ad',
        editingBookmarkId: null
    };

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
        
        toast.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
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
            item.innerHTML = `
                <span class="domain-name">
                    <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=16" alt="">
                    ${domain}
                </span>
                <span class="domain-count">${count}</span>
            `;
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
        displayBookmarks(state.bookmarks);
        
        elements.loginSection.style.display = 'none';
        elements.registerSection.style.display = 'none';
        elements.welcomeScreen.style.display = 'none';
        elements.bookmarksSection.style.display = 'block';
        
        await updateStats();
    }

    // Display bookmarks
    function displayBookmarks(bookmarks) {
        elements.bookmarksContainer.innerHTML = '';
        
        if (bookmarks.length === 0) {
            elements.bookmarksContainer.appendChild(elements.emptyState);
            elements.emptyState.style.display = 'flex';
            return;
        }
        
        // Sort bookmarks
        const sortedBookmarks = sortBookmarks(bookmarks);
        
        sortedBookmarks.forEach((bookmark, index) => {
            const item = createBookmarkElement(bookmark, index);
            elements.bookmarksContainer.appendChild(item);
        });
        
        // Update badge
        chrome.action.setBadgeText({ text: bookmarks.length.toString() });
    }

    // Create bookmark element
    function createBookmarkElement(bookmark, index) {
        const el = document.createElement('div');
        console.log("Value of el after createElement:", el);
        el.className = 'bookmark-item';
        el.dataset.folder = bookmark.folder;
        el.dataset.tags = JSON.stringify(bookmark.tags || []);
        
        if (state.allBookmarksHidden) {
            el.classList.add('hidden');
        }
        
        const folder = state.folders.find(f => f.name === bookmark.folder);
        const folderColor = folder?.color || '#0ea5e9';
        
        el.innerHTML = `
            <div class="bookmark-header">
                <img class="bookmark-favicon" src="${bookmark.favicon || getFavicon(bookmark.url)}" alt="">
                <span class="bookmark-title">${escapeHtml(bookmark.title)}</span>
                <div class="bookmark-actions">
                <button class="bookmark-action-btn edit" title="${translations[state.currentLang]['edit']}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="bookmark-action-btn copy" title="${translations[state.currentLang]['link_copied']}">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="bookmark-action-btn delete" title="${translations[state.currentLang]['delete']}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            </div>
            <div class="bookmark-url">
                <a href="${bookmark.url}" target="_blank">${bookmark.url}</a>
            </div>
            <div class="bookmark-meta">
                <span class="bookmark-date">${bookmark.date}</span>
                ${bookmark.visitCount ? `<span><i class="fas fa-eye"></i> ${bookmark.visitCount}</span>` : ''}
                <select class="bookmark-folder-select">
                    ${state.folders.map(f => `
                        <option value="${f.name}" ${f.name === bookmark.folder ? 'selected' : ''}>${f.name}</option>
                    `).join('')}
                </select>
            </div>
            ${(bookmark.tags || []).length > 0 ? `
                <div class="bookmark-tags">
                    ${bookmark.tags.map(tag => `<span class="bookmark-tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
        `;
        
        // Event listeners
        el.querySelector('.edit').addEventListener('click', () => {
            openEditBookmarkModal(bookmark);
        });

        el.querySelector('.copy').addEventListener('click', () => {
            navigator.clipboard.writeText(bookmark.url);
            showToast(translations[state.currentLang]['link_copied']);
        });
        
        el.querySelector('.delete').addEventListener('click', async () => {
            await deleteBookmark(index);
        });
        
        el.querySelector('.bookmark-folder-select').addEventListener('change', async (e) => {
            await updateBookmarkFolder(index, e.target.value);
        });
        
        // Track visit
        el.querySelector('a').addEventListener('click', async () => {
            await trackVisit(index);
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
        
        const items = elements.bookmarksContainer.querySelectorAll('.bookmark-item');
        
        items.forEach(item => {
            if (state.allBookmarksHidden) {
                item.classList.add('hidden');
                return;
            }
            
            const text = item.textContent.toLowerCase();
            const folder = item.dataset.folder;
            const tags = JSON.parse(item.dataset.tags || '[]');
            
            const matchesSearch = text.includes(searchTerm);
            const matchesFolder = selectedFolder === 'all' || folder === selectedFolder;
            const matchesTag = !state.currentTag || tags.includes(state.currentTag);
            
            if (matchesSearch && matchesFolder && matchesTag) {
                item.classList.remove('hidden');
            } else {
                item.classList.add('hidden');
            }
        });
    }

    // Delete bookmark
    async function deleteBookmark(index) {
        state.bookmarks.splice(index, 1);
        await StorageUtils.saveBookmarks(state.bookmarks);
        displayBookmarks(state.bookmarks);
        showToast(translations[state.currentLang]['delete'] + '!');
        await updateStats();
    }

    // Update bookmark folder
    async function updateBookmarkFolder(index, newFolder) {
        state.bookmarks[index].folder = newFolder;
        await StorageUtils.saveBookmarks(state.bookmarks);
        displayBookmarks(state.bookmarks);
    }

    // Track visit
    async function trackVisit(index) {
        state.bookmarks[index].visitCount = (state.bookmarks[index].visitCount || 0) + 1;
        state.bookmarks[index].lastVisited = Date.now();
        await StorageUtils.saveBookmarks(state.bookmarks);
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

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Check password strength
    function checkPasswordStrength(password) {
        const result = CryptoUtils.checkPasswordStrength(password);
        
        elements.passwordStrength.classList.add('active');
        elements.strengthBar.className = 'strength-bar ' + result.strength;
        
        const strengthTexts = {
            weak: 'Svagt lösenord',
            medium: 'Medelstarkt lösenord',
            strong: 'Starkt lösenord'
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

    // Load backups
    async function loadBackups() {
        const backups = await StorageUtils.getBackups();
        elements.backupsContainer.innerHTML = '';
        
        if (backups.length === 0) {
            elements.backupsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Inga backuper ännu</p>';
            return;
        }
        
        backups.reverse().forEach(backup => {
            const item = document.createElement('div');
            item.className = 'backup-item';
            item.innerHTML = `
                <span class="backup-date">${new Date(backup.date).toLocaleString()}</span>
                <div class="backup-actions">
                    <button class="backup-btn restore" data-id="${backup.id}">Återställ</button>
                    <button class="backup-btn delete" data-id="${backup.id}">Ta bort</button>
                </div>
            `;
            
            item.querySelector('.restore').addEventListener('click', async () => {
                if (confirm('Är du säker på att du vill återställa från denna backup? Nuvarande data kommer att ersättas.')) {
                    showLoader();
                    await StorageUtils.restoreFromBackup(backup.id);
                    state.bookmarks = await StorageUtils.getBookmarks();
                    displayBookmarks(state.bookmarks);
                    hideLoader();
                    showToast('Backup återställd!');
                    closeModal(elements.backupModal);
                }
            });
            
            item.querySelector('.delete').addEventListener('click', async () => {
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
            loadFolders();
        });
    });

    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);

    // Get started
    elements.getStartedBtn.addEventListener('click', () => {
        elements.welcomeScreen.style.display = 'none';
        elements.registerSection.style.display = 'block';
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
        elements.loginSection.style.display = 'block'; // Show login section after successful registration
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
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const currentTab = tabs[0];
            const selectedFolder = elements.folderSelectAdd.value || state.folders[0]?.name;
            
            // Parse tags
            const tagNames = elements.tagInput.value.split(',').map(t => t.trim()).filter(Boolean);
            
            // Create/update tags
            const bookmarkTags = [];
            for (const tagName of tagNames) {
                let tag = state.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
                if (!tag) {
                    tag = {
                        id: CryptoUtils.generateUUID(),
                        name: tagName,
                        color: `hsl(${Math.random() * 360}, 70%, 50%)`
                    };
                    state.tags.push(tag);
                }
                bookmarkTags.push(tag.name);
            }
            await StorageUtils.saveTags(state.tags);
            
            // Get favicon
            let favicon = currentTab.favIconUrl;
            
            // Fallback if no favicon found
            if (!favicon) {
                try {
                    const urlObj = new URL(currentTab.url);
                    let domain = urlObj.hostname;
                    if (domain && domain.includes('.') && domain !== 'localhost' && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
                        favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                    }
                } catch (e) {}
            }
            
            const newBookmark = {
                id: CryptoUtils.generateUUID(),
                title: currentTab.title,
                url: currentTab.url,
                folder: selectedFolder,
                tags: bookmarkTags,
                favicon: favicon,
                date: new Date().toLocaleDateString(state.currentLang, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                timestamp: Date.now(),
                visitCount: 0,
                lastVisited: null
            };
            
            const alreadyExists = state.bookmarks.some(b => b.url === newBookmark.url);
            
            if (alreadyExists) {
                showToast(translations[state.currentLang]['already_saved'], 'error');
                return;
            }
            
            state.bookmarks.push(newBookmark);
            await StorageUtils.saveBookmarks(state.bookmarks);
            
            elements.tagInput.value = '';
            displayBookmarks(state.bookmarks);
            showToast(translations[state.currentLang]['save'] + '!');
            await updateStats();
            loadTags();
        });
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
        displayBookmarks(state.bookmarks);
        await updateStats();
        
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
        showToast('Backup skapad!');
        loadBackups();
    });

    // Auto backup toggle
    elements.autoBackupToggle.addEventListener('change', async () => {
        await StorageUtils.savePreferences({ autoBackup: elements.autoBackupToggle.checked });
        chrome.runtime.sendMessage({ action: 'setupAutoBackup' });
        showToast(elements.autoBackupToggle.checked ? 'Automatisk backup aktiverad!' : 'Automatisk backup avaktiverad!');
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

    // Folder filter
    elements.folderSelect.addEventListener('change', filterBookmarks);

    // Sort buttons
    elements.sortDateBtn.addEventListener('click', () => {
        state.sortBy = 'date';
        updateSortButtons();
        displayBookmarks(state.bookmarks);
    });

    elements.sortNameBtn.addEventListener('click', () => {
        state.sortBy = 'name';
        updateSortButtons();
        displayBookmarks(state.bookmarks);
    });

    elements.sortVisitsBtn.addEventListener('click', () => {
        state.sortBy = 'visits';
        updateSortButtons();
        displayBookmarks(state.bookmarks);
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
        });
    });

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
        displayBookmarks(state.bookmarks);
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

    // Open edit bookmark modal
    function openEditBookmarkModal(bookmark) {
        // Ensure bookmark has an ID for reliable tracking
        if (!bookmark.id) {
            bookmark.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
        
        // Find bookmark
        const bookmarkIndex = state.bookmarks.findIndex(b => b.id === state.editingBookmarkId);
        
        if (bookmarkIndex !== -1) {
            state.bookmarks[bookmarkIndex].title = newTitle;
            state.bookmarks[bookmarkIndex].url = newUrl;
            
            await StorageUtils.saveBookmarks(state.bookmarks);
            displayBookmarks(state.bookmarks);
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
                
                const merge = confirm('Vill du slå samman med befintliga bokmärken? Klicka Avbryt för att ersätta alla.');
                
                showLoader();
                await StorageUtils.importData(importedData, merge);
                
                state.bookmarks = await StorageUtils.getBookmarks();
                state.folders = await StorageUtils.getFolders();
                state.tags = await StorageUtils.getTags();
                
                updateFolderDropdowns();
                updateTagList();
                displayBookmarks(state.bookmarks);
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
        // Ctrl/Cmd + K - focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            e.stopPropagation();
            elements.searchBox.focus();
        }
        
        // Escape - clear search
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
    
    // Listen for messages from other parts of the extension (e.g., options page)
    chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
        if (request.action === 'languageChanged') {
            applyTranslation(request.language);
            await loadFolders(); // Reload folders to update translated names
            await showBookmarks(); // Re-display bookmarks to update folder names in dropdowns
        } else if (request.action === 'focusSearch') {
            setTimeout(() => elements.searchBox.focus(), 100);
        }
    });

    // Check login status
    const isLoggedIn = await StorageUtils.getLoginStatus();
    const { hash } = await StorageUtils.getPasswordData();
    const prefs = await StorageUtils.getPreferences();
    
    if (isLoggedIn && hash) {
        if (prefs.firstTime) {
            showWelcomeScreen();
            await StorageUtils.savePreferences({ firstTime: false });
        } else {
            showBookmarks();
        }
    } else {
        await StorageUtils.savePreferences({ firstTime: true });
        showWelcomeScreen();
    }
});
