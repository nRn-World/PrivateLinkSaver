// Storage utilities for Chrome Extension API
const StorageUtils = {
    TRACKING_PARAM_PREFIXES: ['utm_', 'ga_', 'mc_', 'pk_', 'sc_'],
    TRACKING_PARAM_EXACT: new Set([
        'fbclid', 'gclid', 'dclid', 'msclkid', 'yclid', '_hsenc', '_hsmi',
        'igshid', 'ref', 'ref_src', 'source', 'campaign', 'si'
    ]),
    AUTO_LOGOUT_OPTIONS: Object.freeze([5, 15, 30, 60]),
    DEFAULT_AUTO_LOGOUT_MINUTES: 15,
    SESSION_ACTIVITY_THROTTLE_MS: 15000,
    _lastSessionTouchAt: 0,

    // Get data from chrome.storage.local
    async get(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (result) => {
                resolve(result);
            });
        });
    },

    // Set data to chrome.storage.local
    async set(data) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set(data, () => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve();
                }
            });
        });
    },

    // Remove data from chrome.storage.local
    async remove(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.remove(keys, () => {
                resolve();
            });
        });
    },

    // Clear all data from chrome.storage.local
    async clear() {
        return new Promise((resolve) => {
            chrome.storage.local.clear(() => {
                resolve();
            });
        });
    },

    normalizeAutoLogoutMinutes(value) {
        if (value === 'never' || value === 0 || value === '0') {
            return 0;
        }

        const parsed = Number(value);
        if (this.AUTO_LOGOUT_OPTIONS.includes(parsed)) {
            return parsed;
        }

        return this.DEFAULT_AUTO_LOGOUT_MINUTES;
    },

    isSafeHttpUrl(url) {
        try {
            const parsed = new URL(String(url || '').trim());
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch (_error) {
            return false;
        }
    },

    shouldStripQueryParam(paramName) {
        const key = String(paramName || '').toLowerCase();
        return this.TRACKING_PARAM_EXACT.has(key)
            || this.TRACKING_PARAM_PREFIXES.some((prefix) => key.startsWith(prefix));
    },

    normalizeBookmarkUrl(url) {
        try {
            const parsed = new URL(String(url || '').trim());
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return null;
            }

            Array.from(parsed.searchParams.keys()).forEach((key) => {
                if (this.shouldStripQueryParam(key)) {
                    parsed.searchParams.delete(key);
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
        } catch (_error) {
            return null;
        }
    },

    canonicalUrl(url) {
        const normalized = this.normalizeBookmarkUrl(url);
        return normalized ? normalized.toLowerCase() : null;
    },

    normalizeBookmark(bookmark) {
        if (!bookmark || typeof bookmark !== 'object') {
            return null;
        }

        const title = String(bookmark.title || '').trim();
        const url = this.normalizeBookmarkUrl(bookmark.url);
        if (!title || !url) {
            return null;
        }

        return {
            id: String(bookmark.id || CryptoUtils.generateUUID()),
            title,
            url,
            folder: String(bookmark.folder || 'General'),
            tags: Array.isArray(bookmark.tags) ? bookmark.tags.map((tag) => String(tag)).filter(Boolean) : [],
            favicon: bookmark.favicon ? String(bookmark.favicon) : null,
            date: String(bookmark.date || new Date().toLocaleDateString('en', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })),
            timestamp: Number(bookmark.timestamp) || Date.now(),
            visitCount: Number(bookmark.visitCount) || 0,
            lastVisited: bookmark.lastVisited || null
        };
    },

    normalizeFolders(folders) {
        if (!Array.isArray(folders)) {
            return [];
        }

        const seen = new Set();
        const normalized = [];

        folders.forEach((folder) => {
            if (!folder || typeof folder !== 'object') return;
            const name = String(folder.name || '').trim();
            if (!name) return;
            const key = name.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            normalized.push({
                id: String(folder.id || CryptoUtils.generateUUID()),
                name,
                color: String(folder.color || '#0ea5e9'),
                isDefault: Boolean(folder.isDefault),
                key: folder.key ? String(folder.key) : undefined
            });
        });

        return normalized;
    },

    normalizeTags(tags) {
        if (!Array.isArray(tags)) {
            return [];
        }

        const seen = new Set();
        const normalized = [];

        tags.forEach((tag) => {
            if (!tag || typeof tag !== 'object') return;
            const name = String(tag.name || '').trim();
            if (!name) return;
            const key = name.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            normalized.push({
                id: String(tag.id || CryptoUtils.generateUUID()),
                name,
                color: String(tag.color || '#0ea5e9')
            });
        });

        return normalized;
    },

    // Get all bookmarks
    async getBookmarks() {
        const result = await this.get('bookmarks');
        const bookmarks = Array.isArray(result.bookmarks) ? result.bookmarks : [];
        const cleaned = [];
        const seen = new Set();

        bookmarks.forEach((bookmark) => {
            const normalized = this.normalizeBookmark(bookmark);
            if (!normalized) return;
            const canonical = this.canonicalUrl(normalized.url);
            if (!canonical || seen.has(canonical)) return;
            seen.add(canonical);
            cleaned.push(normalized);
        });

        if (cleaned.length !== bookmarks.length) {
            await this.set({ bookmarks: cleaned });
        }

        return cleaned;
    },

    // Save bookmarks
    async saveBookmarks(bookmarks) {
        const seen = new Set();
        const normalized = [];
        (Array.isArray(bookmarks) ? bookmarks : []).forEach((bookmark) => {
            const clean = this.normalizeBookmark(bookmark);
            if (!clean) return;
            const canonical = this.canonicalUrl(clean.url);
            if (!canonical || seen.has(canonical)) return;
            seen.add(canonical);
            normalized.push(clean);
        });

        await this.set({ bookmarks: normalized });
    },

    // Get all folders
    async getFolders() {
        const result = await this.get('folders');
        return result.folders || [];
    },

    // Save folders
    async saveFolders(folders) {
        await this.set({ folders });
    },

    // Get all tags
    async getTags() {
        const result = await this.get('tags');
        return result.tags || [];
    },

    // Save tags
    async saveTags(tags) {
        await this.set({ tags });
    },

    // Get password hash and salt
    async getPasswordData() {
        const result = await this.get(['passwordHash', 'passwordSalt']);
        return {
            hash: result.passwordHash || null,
            salt: result.passwordSalt || null
        };
    },

    // Save password hash and salt
    async savePasswordData(hash, salt) {
        await this.set({ 
            passwordHash: hash,
            passwordSalt: salt 
        });
    },

    // Get login status
    async getLoginStatus() {
        const result = await this.get('isLoggedIn');
        return result.isLoggedIn || false;
    },

    // Save login status
    async saveLoginStatus(status) {
        if (status) {
            const now = Date.now();
            this._lastSessionTouchAt = now;
            await this.set({
                isLoggedIn: true,
                sessionLastActiveAt: now
            });
            return;
        }

        this._lastSessionTouchAt = 0;
        await this.set({ isLoggedIn: false });
    },

    async recordSessionActivity(force = false) {
        const loginState = await this.get('isLoggedIn');
        if (!loginState.isLoggedIn) {
            return;
        }

        const now = Date.now();
        if (!force && now - this._lastSessionTouchAt < this.SESSION_ACTIVITY_THROTTLE_MS) {
            return;
        }

        this._lastSessionTouchAt = now;
        await this.set({ sessionLastActiveAt: now });
    },

    async getSessionInfo() {
        const result = await this.get(['isLoggedIn', 'sessionLastActiveAt', 'autoLogoutMinutes']);
        return {
            isLoggedIn: Boolean(result.isLoggedIn),
            lastActiveAt: Number(result.sessionLastActiveAt) || 0,
            autoLogoutMinutes: this.normalizeAutoLogoutMinutes(result.autoLogoutMinutes)
        };
    },

    async enforceAutoLogout() {
        const session = await this.getSessionInfo();
        if (!session.isLoggedIn || session.autoLogoutMinutes === 0 || !session.lastActiveAt) {
            return { expired: false, minutes: session.autoLogoutMinutes };
        }

        const expiresAfterMs = session.autoLogoutMinutes * 60 * 1000;
        if (Date.now() - session.lastActiveAt < expiresAfterMs) {
            return { expired: false, minutes: session.autoLogoutMinutes };
        }

        this._lastSessionTouchAt = 0;
        await this.set({
            isLoggedIn: false,
            autoLogoutNoticeMinutes: session.autoLogoutMinutes,
            autoLogoutNoticeAt: Date.now()
        });

        return { expired: true, minutes: session.autoLogoutMinutes };
    },

    async consumeAutoLogoutNotice() {
        const result = await this.get(['autoLogoutNoticeMinutes', 'autoLogoutNoticeAt']);
        const minutes = Number(result.autoLogoutNoticeMinutes) || 0;
        const noticedAt = Number(result.autoLogoutNoticeAt) || 0;

        if (!minutes || !noticedAt) {
            return null;
        }

        await this.remove(['autoLogoutNoticeMinutes', 'autoLogoutNoticeAt']);
        return { minutes, noticedAt };
    },

    initializeSessionActivityTracking() {
        if (typeof document === 'undefined') {
            return () => {};
        }

        const trackActivity = () => {
            this.recordSessionActivity().catch(() => {});
        };

        const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'focus'];
        activityEvents.forEach((eventName) => {
            window.addEventListener(eventName, trackActivity, true);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                trackActivity();
            }
        });

        return () => {
            activityEvents.forEach((eventName) => {
                window.removeEventListener(eventName, trackActivity, true);
            });
        };
    },

    // Get user preferences
    async getPreferences() {
        const result = await this.get(['language', 'darkMode', 'firstTime', 'autoBackup', 'autoLogoutMinutes']);
        return {
            language: result.language || 'en',
            darkMode: result.darkMode !== undefined ? result.darkMode : true,
            firstTime: result.firstTime !== false,
            autoBackup: result.autoBackup || false,
            autoLogoutMinutes: this.normalizeAutoLogoutMinutes(result.autoLogoutMinutes)
        };
    },

    // Save user preferences
    async savePreferences(prefs) {
        const nextPrefs = { ...prefs };
        if (Object.prototype.hasOwnProperty.call(nextPrefs, 'autoLogoutMinutes')) {
            nextPrefs.autoLogoutMinutes = this.normalizeAutoLogoutMinutes(nextPrefs.autoLogoutMinutes);
        }

        await this.set(nextPrefs);
    },

    // Get statistics
    async getStatistics() {
        const bookmarks = await this.getBookmarks();
        const folders = await this.getFolders();
        const tags = await this.getTags();
        
        const totalVisits = bookmarks.reduce((sum, b) => sum + (b.visitCount || 0), 0);
        
        // Calculate top domains
        const domainCounts = {};
        bookmarks.forEach(bookmark => {
            try {
                const urlObj = new URL(bookmark.url);
                let domain = urlObj.hostname.replace('www.', '');

                // Add more robust validation for the domain name
                // Check if the domain contains at least one dot, is not an IP address (simple check),
                // and is not an empty string or localhost.
                // This filters out malformed hostnames that new URL() might not throw an error for.
                if (domain && domain.includes('.') && domain !== 'localhost' && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
                    domainCounts[domain] = (domainCounts[domain] || 0) + 1;
                }
            } catch (e) {
                // Invalid URL, skip
            }
        });
        
        const topDomains = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([domain, count]) => ({ domain, count }));
        
        return {
            totalBookmarks: bookmarks.length,
            totalFolders: folders.length,
            totalTags: tags.length,
            totalVisits,
            topDomains
        };
    },

     // Export all data
     async exportAllData() {
         const bookmarks = await this.getBookmarks();
         const folders = await this.getFolders();
         const tags = await this.getTags();
         
         return {
             version: '2.4.3',
             exportDate: new Date().toISOString(),
            bookmarks,
            folders,
            tags
        };
    },

    // Import data
    async importData(data, merge = true) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }

        const importedBookmarks = Array.isArray(data.bookmarks)
            ? data.bookmarks.map((bookmark) => this.normalizeBookmark(bookmark)).filter(Boolean)
            : [];
        const importedFolders = this.normalizeFolders(data.folders);
        const importedTags = this.normalizeTags(data.tags);
        
        if (merge) {
            // Merge with existing data
            const existingBookmarks = await this.getBookmarks();
            const existingFolders = await this.getFolders();
            const existingTags = await this.getTags();

            const normalizedExistingBookmarks = existingBookmarks
                .map((bookmark) => this.normalizeBookmark(bookmark))
                .filter(Boolean);
            const normalizedExistingFolders = this.normalizeFolders(existingFolders);
            const normalizedExistingTags = this.normalizeTags(existingTags);
            
            // Merge bookmarks (avoid duplicates)
            const bookmarkUrls = new Set(normalizedExistingBookmarks.map((bookmark) => this.canonicalUrl(bookmark.url)));
            const newBookmarks = importedBookmarks.filter((bookmark) => {
                const canonical = this.canonicalUrl(bookmark.url);
                return canonical && !bookmarkUrls.has(canonical);
            });
            await this.saveBookmarks([...normalizedExistingBookmarks, ...newBookmarks]);
            
            // Merge folders (avoid duplicates)
            const folderNames = new Set(normalizedExistingFolders.map((folder) => folder.name.toLowerCase()));
            const newFolders = importedFolders.filter((folder) => !folderNames.has(folder.name.toLowerCase()));
            await this.saveFolders([...normalizedExistingFolders, ...newFolders]);
            
            // Merge tags (avoid duplicates)
            const tagNames = new Set(normalizedExistingTags.map((tag) => tag.name.toLowerCase()));
            const newTags = importedTags.filter((tag) => !tagNames.has(tag.name.toLowerCase()));
            await this.saveTags([...normalizedExistingTags, ...newTags]);
        } else {
            // Replace all data
            await this.saveBookmarks(importedBookmarks);
            await this.saveFolders(importedFolders);
            await this.saveTags(importedTags);
        }
        
        return {
            bookmarksImported: importedBookmarks.length,
            foldersImported: importedFolders.length,
            tagsImported: importedTags.length
        };
    },

    // Create backup
    async createBackup() {
        const data = await this.exportAllData();
        const backups = await this.getBackups();
        
        const backup = {
            id: CryptoUtils.generateUUID(),
            date: new Date().toISOString(),
            data
        };
        
        backups.push(backup);
        
        // Keep only last 10 backups
        if (backups.length > 10) {
            backups.shift();
        }
        
        await this.set({ backups });
        return backup;
    },

    // Get all backups
    async getBackups() {
        const result = await this.get('backups');
        return result.backups || [];
    },

    // Restore from backup
    async restoreFromBackup(backupId) {
        const backups = await this.getBackups();
        const backup = backups.find(b => b.id === backupId);
        
        if (!backup) {
            throw new Error('Backup not found');
        }
        
        await this.importData(backup.data, false);
        return true;
    },

    // Delete backup
    async deleteBackup(backupId) {
        const backups = await this.getBackups();
        const filtered = backups.filter(b => b.id !== backupId);
        await this.set({ backups: filtered });
    },

    // Get storage stats
    async getStorageStats() {
        return new Promise((resolve) => {
            chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
                resolve({
                    bytesUsed: bytesInUse,
                    bytesAvailable: chrome.storage.local.QUOTA_BYTES,
                    percentUsed: (bytesInUse / chrome.storage.local.QUOTA_BYTES * 100).toFixed(2)
                });
            });
        });
    },

    async isStorageFull() {
        const stats = await this.getStorageStats();
        return stats.percentUsed > 90;
    }
};
