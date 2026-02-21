// Storage utilities for Chrome Extension API
const StorageUtils = {
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
        return new Promise((resolve) => {
            chrome.storage.local.set(data, () => {
                resolve();
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

    // Get all bookmarks
    async getBookmarks() {
        const result = await this.get('bookmarks');
        return result.bookmarks || [];
    },

    // Save bookmarks
    async saveBookmarks(bookmarks) {
        await this.set({ bookmarks });
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
        await this.set({ isLoggedIn: status });
    },

    // Get user preferences
    async getPreferences() {
        const result = await this.get(['language', 'darkMode', 'firstTime', 'autoBackup']);
        return {
            language: result.language || 'en',
            darkMode: result.darkMode !== undefined ? result.darkMode : true,
            firstTime: result.firstTime !== false,
            autoBackup: result.autoBackup || false
        };
    },

    // Save user preferences
    async savePreferences(prefs) {
        await this.set(prefs);
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
            version: '2.0.0',
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
        
        if (merge) {
            // Merge with existing data
            const existingBookmarks = await this.getBookmarks();
            const existingFolders = await this.getFolders();
            const existingTags = await this.getTags();
            
            // Merge bookmarks (avoid duplicates)
            const bookmarkUrls = new Set(existingBookmarks.map(b => b.url));
            const newBookmarks = data.bookmarks?.filter(b => !bookmarkUrls.has(b.url)) || [];
            await this.saveBookmarks([...existingBookmarks, ...newBookmarks]);
            
            // Merge folders (avoid duplicates)
            const folderNames = new Set(existingFolders.map(f => f.name));
            const newFolders = data.folders?.filter(f => !folderNames.has(f.name)) || [];
            await this.saveFolders([...existingFolders, ...newFolders]);
            
            // Merge tags (avoid duplicates)
            const tagNames = new Set(existingTags.map(t => t.name));
            const newTags = data.tags?.filter(t => !tagNames.has(t.name)) || [];
            await this.saveTags([...existingTags, ...newTags]);
        } else {
            // Replace all data
            if (data.bookmarks) await this.saveBookmarks(data.bookmarks);
            if (data.folders) await this.saveFolders(data.folders);
            if (data.tags) await this.saveTags(data.tags);
        }
        
        return {
            bookmarksImported: data.bookmarks?.length || 0,
            foldersImported: data.folders?.length || 0,
            tagsImported: data.tags?.length || 0
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
    }
};
