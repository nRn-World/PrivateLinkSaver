// PrivateLinkSaver - Background Service Worker

const TRACKING_PARAM_PREFIXES = ['utm_', 'ga_', 'mc_', 'pk_', 'sc_'];
const TRACKING_PARAM_EXACT = new Set([
    'fbclid', 'gclid', 'dclid', 'msclkid', 'yclid', '_hsenc', '_hsmi',
    'igshid', 'ref', 'ref_src', 'source', 'campaign', 'si'
]);
const AUTO_LOGOUT_OPTIONS = new Set([5, 15, 30, 60]);
const DEFAULT_AUTO_LOGOUT_MINUTES = 15;
const AUTO_LOGOUT_ALARM = 'session-auto-logout-check';
const SESSION_ACTIVITY_THROTTLE_MS = 15000;

let lastSessionTouchAt = 0;

function normalizeAutoLogoutMinutes(value) {
    if (value === 'never' || value === 0 || value === '0') {
        return 0;
    }

    const parsed = Number(value);
    if (AUTO_LOGOUT_OPTIONS.has(parsed)) {
        return parsed;
    }

    return DEFAULT_AUTO_LOGOUT_MINUTES;
}

async function setupSessionAlarm() {
    const result = await chrome.storage.local.get('autoLogoutMinutes');
    const autoLogoutMinutes = normalizeAutoLogoutMinutes(result.autoLogoutMinutes);

    if (autoLogoutMinutes > 0) {
        chrome.alarms.create(AUTO_LOGOUT_ALARM, { periodInMinutes: 1 });
    } else {
        chrome.alarms.clear(AUTO_LOGOUT_ALARM);
    }
}

async function recordSessionActivity(force = false) {
    const result = await chrome.storage.local.get('isLoggedIn');
    if (!result.isLoggedIn) {
        return;
    }

    const now = Date.now();
    if (!force && now - lastSessionTouchAt < SESSION_ACTIVITY_THROTTLE_MS) {
        return;
    }

    lastSessionTouchAt = now;
    await chrome.storage.local.set({ sessionLastActiveAt: now });
}

async function handleAutoLogout(showNotification = false) {
    const result = await chrome.storage.local.get(['isLoggedIn', 'sessionLastActiveAt', 'autoLogoutMinutes']);
    const autoLogoutMinutes = normalizeAutoLogoutMinutes(result.autoLogoutMinutes);
    const lastActiveAt = Number(result.sessionLastActiveAt) || 0;

    if (!result.isLoggedIn || autoLogoutMinutes === 0 || !lastActiveAt) {
        return false;
    }

    if (Date.now() - lastActiveAt < autoLogoutMinutes * 60 * 1000) {
        return false;
    }

    lastSessionTouchAt = 0;
    await chrome.storage.local.set({
        isLoggedIn: false,
        autoLogoutNoticeMinutes: autoLogoutMinutes,
        autoLogoutNoticeAt: Date.now()
    });

    if (showNotification) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PrivateLinkSaver',
            message: `Signed out after ${autoLogoutMinutes} minutes of inactivity.`,
            priority: 1
        });
    }

    return true;
}

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
    // Set default badge color
    chrome.action.setBadgeBackgroundColor({ color: '#0ea5e9' });

    // Set default auto-logout to 15 minutes if not already set
    chrome.storage.local.get('autoLogoutMinutes', (result) => {
        if (result.autoLogoutMinutes === undefined) {
            chrome.storage.local.set({ autoLogoutMinutes: 15 });
        }
    });

    // Always start with English language on first install
    chrome.storage.local.get('language', (result) => {
        if (result.language === undefined) {
            chrome.storage.local.set({ language: 'en' });
        }
    });
    
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
    setupSessionAlarm();
    handleAutoLogout();
    
    // Update badge with current bookmark count
    updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
    setupAutoBackup();
    setupSessionAlarm();
    handleAutoLogout();
    updateBadge();
});

// Set up auto-backup alarm
async function setupAutoBackup() {
    const result = await chrome.storage.local.get('autoBackup');
    if (result.autoBackup) {
        chrome.alarms.create('auto-backup', {
            periodInMinutes: 24 * 60 // Daily
        });
    } else {
        chrome.alarms.clear('auto-backup');
    }
}

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'auto-backup') {
        createAutoBackup();
    } else if (alarm.name === AUTO_LOGOUT_ALARM) {
        handleAutoLogout(true);
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
                 version: '2.4.2',
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
        
        try {
            await chrome.storage.local.set({ backups });
        } catch (error) {
            console.error('Auto-backup storage error:', error);
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-utanbakgrund.png',
                title: 'PrivateLinkSaver',
                message: 'Storage full. Auto-backup failed.',
                priority: 2
            });
        }
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
    const sessionExpired = await handleAutoLogout();
    if (sessionExpired) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'PrivateLinkSaver',
            message: 'Please unlock PrivateLinkSaver again to save bookmarks.',
            priority: 1
        });
        return;
    }

    const normalizedUrl = normalizeBookmarkUrl(url);
    if (!normalizedUrl) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-utanbakgrund.png',
            title: 'PrivateLinkSaver',
            message: 'Unsupported link type. Only HTTP/HTTPS URLs can be saved.',
            priority: 1
        });
        return;
    }

    // Check if user is logged in
    const result = await chrome.storage.local.get(['isLoggedIn', 'passwordHash']);
    
    if (!result.isLoggedIn || !result.passwordHash) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-utanbakgrund.png',
            title: 'PrivateLinkSaver',
            message: chrome.i18n.getMessage('notificationLoginRequired') || 'Please log in to save bookmarks',
            priority: 2
        });
        return;
    }
    
    // Get current bookmarks and preferences
    const data = await chrome.storage.local.get(['bookmarks', 'language', 'folders']);
    const bookmarks = data.bookmarks || [];
    const currentLang = data.language || 'en';
    const folders = data.folders || [];
    const safeTitle = String(title || normalizedUrl || 'Untitled').trim();
    const normalizedCanonical = canonicalUrl(normalizedUrl);
    
    // Check if bookmark already exists
    const exists = bookmarks.some((bookmark) => canonicalUrl(bookmark.url) === normalizedCanonical);
    if (exists) {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-utanbakgrund.png',
            title: 'PrivateLinkSaver',
            message: chrome.i18n.getMessage('notificationExists') || 'This page is already saved!',
            priority: 1
        });
        return;
    }
    
    // Get favicon
    let favicon = null;
    
    // Use tab favicon if saving the current page
    if (tab && tab.favIconUrl) {
        favicon = tab.favIconUrl;
    }
    
    if (!favicon) {
        try {
            const urlObj = new URL(normalizedUrl);
            let domain = urlObj.hostname;
            if (domain && domain.includes('.') && domain !== 'localhost' && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
                favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
            }
        } catch (e) {
            // Invalid URL, skip favicon
        }
    }
    
    // Get default folder
    const defaultFolder = folders.length > 0 ? folders[0].name : 'General';
    
    // Create new bookmark
    const newBookmark = {
        id: generateUUID(),
        title: safeTitle,
        url: normalizedUrl,
        folder: defaultFolder,
        tags: inferSmartTags(normalizedUrl, safeTitle),
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
    try {
        await chrome.storage.local.set({ bookmarks });
    } catch (error) {
        console.error('Failed to save bookmark:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-utanbakgrund.png',
            title: 'PrivateLinkSaver',
            message: chrome.i18n.getMessage('storage_full') || 'Storage is full. Please free up some space.',
            priority: 2
        });
        return;
    }

    // Show success notification
    const truncatedTitle = safeTitle.length > 50 ? safeTitle.substring(0, 50) + '...' : safeTitle;
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-utanbakgrund.png',
        title: 'PrivateLinkSaver Pro',
        message: `Saved: ${truncatedTitle}`,
        priority: 1
    });
    
    // Update badge
    updateBadge();
    recordSessionActivity(true);
}

// Update badge with bookmark count
async function updateBadge() {
    const result = await chrome.storage.local.get('bookmarks');
    const bookmarks = result.bookmarks || [];
    const count = bookmarks.length;
    
    if (bookmarks.length > 0) {
        chrome.action.setBadgeText({ text: '' });
        chrome.action.setBadgeBackgroundColor({ color: '#0ea5e9' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Listen for storage changes to update badge
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
        if (changes.bookmarks) {
            updateBadge();
        }

        if (changes.autoLogoutMinutes) {
            setupSessionAlarm();
            handleAutoLogout();
        }
    }
});

// Handle messages from popup or other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateBadge') {
        updateBadge().then(() => sendResponse({ success: true }));
        return true;
    } else if (request.action === 'updateSessionSettings') {
        setupSessionAlarm()
            .then(() => handleAutoLogout())
            .then(() => sendResponse({ success: true }));
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

// Generate UUID (cryptographically secure)
function generateUUID() {
    return crypto.randomUUID();
}

function isSafeHttpUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_error) {
        return false;
    }
}

function normalizeBookmarkUrl(url) {
    try {
        const parsed = new URL(String(url || '').trim());
        if (!isSafeHttpUrl(parsed.href)) {
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
    } catch (_error) {
        return null;
    }
}

function canonicalUrl(url) {
    const normalized = normalizeBookmarkUrl(url);
    return normalized ? normalized.toLowerCase() : null;
}

function inferSmartTags(url, title) {
    const tags = [];
    try {
        const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
        const domainTag = hostname.split('.')[0];
        if (domainTag && domainTag.length > 2) {
            tags.push(domainTag);
        }
    } catch (_error) {
        // ignore invalid URL
    }

    const stopWords = new Set([
        'the', 'and', 'for', 'with', 'this', 'that', 'from', 'your', 'you',
        'guide', 'tips', 'what', 'when', 'where', 'about', 'www', 'com'
    ]);

    String(title || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !stopWords.has(word))
        .slice(0, 5)
        .forEach((word) => {
            if (!tags.includes(word)) {
                tags.push(word);
            }
        });

    return tags.slice(0, 4);
}
