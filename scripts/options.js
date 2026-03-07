// Options page script
document.addEventListener('DOMContentLoaded', async () => {
    const darkModeToggle = document.getElementById('dark-mode');
    const languageSelect = document.getElementById('language');
    const autoBackupToggle = document.getElementById('auto-backup');
    const storageText = document.getElementById('storage-text');
    const storageBar = document.getElementById('storage-bar');
    const storagePercent = document.getElementById('storage-percent');
    const clearDataBtn = document.getElementById('clear-data');

    // Apply translation
    function applyTranslation(lang) {
        const langData = translations[lang];
        if (!langData) return;
        
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (langData[key]) {
                el.textContent = langData[key];
            }
        });
    }

    // Load current settings
    async function loadSettings() {
        const prefs = await StorageUtils.getPreferences();
        const stats = await StorageUtils.getStorageStats();
        
        darkModeToggle.checked = prefs.darkMode;
        languageSelect.value = prefs.language;
        applyTranslation(prefs.language);
        autoBackupToggle.checked = prefs.autoBackup;
        
        // Apply dark mode
        if (prefs.darkMode) {
            document.body.setAttribute('data-theme', 'dark');
        }
        
        // Update storage info
        const usedMB = (stats.bytesUsed / 1024 / 1024).toFixed(2);
        const totalMB = (stats.bytesAvailable / 1024 / 1024).toFixed(0);
        const percent = stats.percentUsed;
        
        storageText.textContent = `${usedMB} MB / ${totalMB} MB`;
        storageBar.style.width = `${Math.min(percent, 100)}%`;
        storagePercent.textContent = `${percent}% used`;
        
        // Color code storage bar
        if (percent > 80) {
            storageBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
        } else if (percent > 50) {
            storageBar.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
        }
    }

    // Dark mode toggle
    darkModeToggle.addEventListener('change', async () => {
        await StorageUtils.savePreferences({ darkMode: darkModeToggle.checked });
        document.body.setAttribute('data-theme', darkModeToggle.checked ? 'dark' : 'light');
    });

    // Language change
    languageSelect.addEventListener('change', async () => {
        const newLang = languageSelect.value;
        await StorageUtils.savePreferences({ language: newLang });
        applyTranslation(newLang);
        
        // Notify background script and popup to update language
        chrome.runtime.sendMessage({ action: 'languageChanged', language: newLang });
    });

    // Auto backup toggle
    autoBackupToggle.addEventListener('change', async () => {
        await StorageUtils.savePreferences({ autoBackup: autoBackupToggle.checked });
        chrome.runtime.sendMessage({ action: 'setupAutoBackup' });
    });

    // Clear all data
    clearDataBtn.addEventListener('click', async () => {
        const confirmed = confirm(
            'ARE YOU SURE?\n\n' +
            'This will PERMANENTLY delete:\n' +
            '- All your bookmarks\n' +
            '- All your folders\n' +
            '- All your tags\n' +
            '- Your password\n' +
            '- All settings\n\n' +
            'This action CANNOT be undone!\n\n' +
            'Click OK to proceed and delete all data.'
        );
        
        if (confirmed) {
            const doubleConfirmed = confirm(
                'Final Warning!\n\n' +
                'Are you absolutely sure you want to delete ALL data?\n\n' +
                'This is your last chance to cancel.'
            );
            
            if (doubleConfirmed) {
                await StorageUtils.clear();
                alert('All data has been deleted. The extension will now reset.');
                window.location.reload();
            }
        }
    });

    // Initialize
    await loadSettings();
});
