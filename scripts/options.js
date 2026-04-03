// Options page script
document.addEventListener('DOMContentLoaded', async () => {
    const darkModeToggle = document.getElementById('dark-mode');
    const languageSelect = document.getElementById('language');
    const autoBackupToggle = document.getElementById('auto-backup');
    const storageText = document.getElementById('storage-text');
    const storageBar = document.getElementById('storage-bar');
    const storagePercent = document.getElementById('storage-percent');
    const clearDataBtn = document.getElementById('clear-data');

    // Cloud elements
    const cloudLoginForm = document.getElementById('cloud-login-form');
    const cloudLoggedIn = document.getElementById('cloud-logged-in');
    const cloudEmailInput = document.getElementById('options-cloud-email');
    const cloudPasswordInput = document.getElementById('options-cloud-password');
    const toggleCloudPassword = document.getElementById('toggle-options-cloud-password');
    const cloudLoginBtn = document.getElementById('options-cloud-login-btn');
    const cloudRegisterBtn = document.getElementById('options-cloud-register-btn');
    const cloudForgotBtn = document.getElementById('options-cloud-forgot-btn');
    const cloudSyncBtn = document.getElementById('options-cloud-sync-btn');
    const cloudLogoutBtn = document.getElementById('options-cloud-logout-btn');
    const cloudEmailDisplay = document.getElementById('options-cloud-email-display');
    const syncStatus = document.getElementById('options-sync-status');

    // Cloud encryption key (derived, not stored)
    let cloudEncryptionKey = null;

    // Helper to derive encryption key from password
    async function getCloudEncryptionKey(password) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(hashHex),
            { name: 'PBKDF2', length: 256 },
            false,
            ['deriveKey']
        );
        
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode('cloud-sync-salt'),
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
    }

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

        // Load cloud state
        await loadCloudState();
    }

    async function loadCloudState() {
        const user = CloudAuth.getCurrentUser();
        if (user) {
            cloudLoginForm.style.display = 'none';
            cloudLoggedIn.style.display = 'block';
            cloudEmailDisplay.textContent = user.email;
            
            // Derive encryption key from stored password hash
            const cloudKeyData = await StorageUtils.get(['cloudEncryptionSalt']);
            if (cloudKeyData.cloudEncryptionSalt) {
                const password = prompt('Enter your cloud password to decrypt data:');
                if (password) {
                    cloudEncryptionKey = await getCloudEncryptionKey(password);
                }
            }
        } else {
            cloudLoginForm.style.display = 'block';
            cloudLoggedIn.style.display = 'none';
        }
    }

    function showSyncStatus(message, type = '') {
        syncStatus.textContent = message;
        syncStatus.className = type;
        setTimeout(() => {
            syncStatus.textContent = '';
            syncStatus.className = '';
        }, 5000);
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

    // Toggle cloud password visibility
    toggleCloudPassword.addEventListener('click', () => {
        const type = cloudPasswordInput.type === 'password' ? 'text' : 'password';
        cloudPasswordInput.type = type;
        toggleCloudPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Cloud login
    cloudLoginBtn.addEventListener('click', async () => {
        const email = cloudEmailInput.value.trim();
        const password = cloudPasswordInput.value;
        
        if (!email || !password) {
            showSyncStatus('Please enter email and password', 'error');
            return;
        }

        cloudLoginBtn.disabled = true;
        cloudLoginBtn.textContent = 'Logging in...';

        try {
            await CloudAuth.login(email, password);
            cloudEncryptionKey = await getCloudEncryptionKey(password);
            await StorageUtils.set({ cloudEncryptionSalt: 'derived' });
            showSyncStatus('Logged in successfully!', 'success');
            await loadCloudState();
        } catch (error) {
            showSyncStatus(error.message, 'error');
        } finally {
            cloudLoginBtn.disabled = false;
            cloudLoginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span data-translate="cloud_login">Login</span>';
        }
    });

    // Cloud register
    cloudRegisterBtn.addEventListener('click', async () => {
        const email = cloudEmailInput.value.trim();
        const password = cloudPasswordInput.value;
        
        if (!email || !password) {
            showSyncStatus('Please enter email and password', 'error');
            return;
        }

        if (password.length < 6) {
            showSyncStatus('Password must be at least 6 characters', 'error');
            return;
        }

        cloudRegisterBtn.disabled = true;
        cloudRegisterBtn.textContent = 'Creating account...';

        try {
            await CloudAuth.register(email, password);
            cloudEncryptionKey = await getCloudEncryptionKey(password);
            await StorageUtils.set({ cloudEncryptionSalt: 'derived' });
            showSyncStatus('Account created successfully!', 'success');
            await loadCloudState();
        } catch (error) {
            showSyncStatus(error.message, 'error');
        } finally {
            cloudRegisterBtn.disabled = false;
            cloudRegisterBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span data-translate="cloud_register">Create Account</span>';
        }
    });

    // Cloud forgot password
    cloudForgotBtn.addEventListener('click', async () => {
        const email = cloudEmailInput.value.trim();
        if (!email) {
            showSyncStatus('Please enter your email address', 'error');
            return;
        }

        try {
            await CloudAuth.resetPassword(email);
            showSyncStatus('Password reset email sent!', 'success');
        } catch (error) {
            showSyncStatus(error.message, 'error');
        }
    });

    // Cloud sync
    cloudSyncBtn.addEventListener('click', async () => {
        if (!cloudEncryptionKey) {
            showSyncStatus('Please login first to sync', 'error');
            return;
        }

        cloudSyncBtn.disabled = true;
        cloudSyncBtn.textContent = 'Syncing...';
        showSyncStatus('Syncing with cloud...', '');

        try {
            // Export local data
            const localData = await StorageUtils.exportAllData();
            
            // Sync to cloud
            const uploadResult = await CloudStorage.syncToCloud(localData, cloudEncryptionKey);
            if (!uploadResult.success) {
                if (uploadResult.offline) {
                    showSyncStatus('No internet connection', 'error');
                } else {
                    showSyncStatus('Upload failed: ' + uploadResult.error, 'error');
                }
                return;
            }

            // Sync from cloud
            const downloadResult = await CloudStorage.syncFromCloud(cloudEncryptionKey);
            if (downloadResult.hasCloudData && !downloadResult.decryptError && downloadResult.data) {
                // Merge cloud data with local
                await StorageUtils.importData(downloadResult.data, true);
                showSyncStatus('Sync completed successfully!', 'success');
            } else if (downloadResult.decryptError) {
                showSyncStatus('Decryption error. Wrong password?', 'error');
            } else {
                showSyncStatus('Upload completed. No cloud data to download.', 'success');
            }
        } catch (error) {
            showSyncStatus('Sync failed: ' + error.message, 'error');
        } finally {
            cloudSyncBtn.disabled = false;
            cloudSyncBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><use href="#icon-sync"></use></svg> <span data-translate="sync_now">Sync Now</span>';
        }
    });

    // Cloud logout
    cloudLogoutBtn.addEventListener('click', async () => {
        try {
            await CloudAuth.logout();
            cloudEncryptionKey = null;
            await StorageUtils.set({ cloudEncryptionSalt: null });
            showSyncStatus('Logged out successfully', 'success');
            await loadCloudState();
        } catch (error) {
            showSyncStatus(error.message, 'error');
        }
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
