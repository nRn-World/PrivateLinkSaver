// PrivateLinkSaver Pro - Background Service Worker
console.log('PrivateLinkSaver Pro background script loaded');

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);
    
    // Set default badge color
    chrome.action.setBadgeBackgroundColor({ color: '#0ea5e9' });
    
    // Create context menus
    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: 'save-link',
            title: chrome.i18n.getMessage('contextSaveLink') || 'Save link to PrivateLinkSaver',
            contexts: ['link']
        });
        
        chrome.contextMenus.create({
            id: 'save-page',
            title: chrome.i18n.getMessage('contextSavePage') || 'Save page to PrivateLinkSaver',
            contexts: ['page']
        });
    });
    
    // Set up auto-backup alarm if enabled
    setupAutoBackup();
    
    // Update badge with current bookmark count
    updateBadge();
});

// Set up auto-backup alarm
async function setupAutoBackup() {
    const result = await chrome.storage.local.get('autoBackup');
    if (result.autoBackup) {
        chrome.alarms.create('auto-backup', {
            periodInMinutes: 24 * 60 // Daily
        });
    }
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'auto-backup') {
        createAutoBackup();
    }
});

// Create automatic backup
async function createAutoBackup() {
    try {
        const result = await chrome.storage.local.get(['bookmarks', 'folders', 'tags']);
        const backup = {
            id: generateUUID(),
            date: new Date().toISOString(),
            auto: true,
            data: {
                version: '2.0.0',
                exportDate: new Date().toISOString(),
                bookmarks: result.bookmarks || [],
                folders: result.folders || [],
                tags: result.tags || []
            }
        };
        
        const backupsResult = await chrome.storage.local.get('backups');
        const backups = backupsResult.backups || [];
        backups.push(backup);
        
        // Keep only last 10 backups
        if (backups.length > 10) {
            backups.shift();
        }
        
        await chrome.storage.local.set({ backups });
        console.log('Auto-backup created');
    } catch (error) {
        console.error('Auto-backup failed:', error);
    }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'save-link') {
        saveBookmark(info.linkUrl, info.selectionText || 'Saved Link', tab);
    } else if (info.menuItemId === 'save-page') {
        saveBookmark(tab.url, tab.title, tab);
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'save-current-page') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                saveBookmark(tabs[0].url, tabs[0].title, tabs[0]);
            }
        });
    } else if (command === 'quick-search') {
        // Try to focus search if popup is open
        chrome.runtime.sendMessage({ action: 'focusSearch' });
    }
});

// Handle omnibox input
chrome.omnibox.onInputChanged.addListener((text, suggest) => {
    chrome.storage.local.get(['bookmarks', 'isLoggedIn'], (result) => {
        if (!result.isLoggedIn || !result.bookmarks) {
            return;
        }
        
        const matches = result.bookmarks
            .filter(b => 
                b.title.toLowerCase().includes(text.toLowerCase()) ||
                b.url.toLowerCase().includes(text.toLowerCase())
            )
            .slice(0, 5)
            .map(b => ({
                content: b.url,
                description: `<match>${escapeXml(b.title)}</match> - <url>${escapeXml(b.url)}</url>`
            }));
        
        suggest(matches);
    });
});

chrome.omnibox.onInputEntered.addListener((url) => {
    chrome.tabs.create({ url });
});

// Escape XML for omnibox
function escapeXml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Save a bookmark
async function saveBookmark(url, title, tab) {
    // Check if user is logged in
    const result = await chrome.storage.local.get(['isLoggedIn', 'passwordHash']);
    
    if (!result.isLoggedIn || !result.passwordHash) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PrivateLinkSaver Pro',
            message: chrome.i18n.getMessage('notificationLoginRequired') || 'Please log in to save bookmarks',
            priority: 2
        });
        return;
    }
    
    // Get current bookmarks and preferences
    const data = await chrome.storage.local.get(['bookmarks', 'language', 'folders']);
    const bookmarks = data.bookmarks || [];
    const currentLang = data.language || 'sv';
    const folders = data.folders || [];
    
    // Check if bookmark already exists
    const exists = bookmarks.some(bookmark => bookmark.url === url);
    if (exists) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PrivateLinkSaver Pro',
            message: chrome.i18n.getMessage('notificationExists') || 'This page is already saved!',
            priority: 1
        });
        return;
    }
    
    // Get favicon
    let favicon = null;
    
    // Use tab favicon if saving the current page
    if (tab && tab.url === url && tab.favIconUrl) {
        favicon = tab.favIconUrl;
    }
    
    if (!favicon) {
        try {
            const urlObj = new URL(url);
            let domain = urlObj.hostname;
            if (domain && domain.includes('.') && domain !== 'localhost' && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
                favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            }
        } catch (e) {
            // Invalid URL, skip favicon
        }
    }
    
    // Get default folder
    const defaultFolder = folders.length > 0 ? folders[0].name : 'Allmänt';
    
    // Create new bookmark
    const newBookmark = {
        id: generateUUID(),
        title: title,
        url: url,
        folder: defaultFolder,
        tags: [],
        favicon: favicon,
        date: new Date().toLocaleDateString(currentLang, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }),
        timestamp: Date.now(),
        visitCount: 0,
        lastVisited: null
    };
    
    // Save bookmark
    bookmarks.push(newBookmark);
    await chrome.storage.local.set({ bookmarks });
    
    // Show success notification
    const truncatedTitle = title.length > 50 ? title.substring(0, 50) + '...' : title;
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'PrivateLinkSaver Pro',
        message: `Saved: ${truncatedTitle}`,
        priority: 1
    });
    
    // Update badge
    updateBadge();
}

// Update badge with bookmark count
async function updateBadge() {
    const result = await chrome.storage.local.get('bookmarks');
    const bookmarks = result.bookmarks || [];
    const count = bookmarks.length;
    
    if (bookmarks.length > 0) {
        chrome.action.setBadgeText({ text: bookmarks.length.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#0ea5e9' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.bookmarks) {
        updateBadge();
    }
});

// Handle messages from popup or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        updateBadge().then(() => sendResponse({ success: true }));
        return true;
    } else if (request.action === 'saveCurrentPage') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                saveBookmark(tabs[0].url, tabs[0].title, tabs[0]);
                sendResponse({ success: true });
            } else {
                sendResponse({ success: false, error: 'No active tab' });
            }
        });
        return true;
    } else if (request.action === 'createBackup') {
        createAutoBackup().then(() => sendResponse({ success: true }));
        return true;
    } else if (request.action === 'setupAutoBackup') {
        setupAutoBackup().then(() => sendResponse({ success: true }));
        return true;
    }
    
    return false;
});

// Generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
