// Options page script
document.addEventListener('DOMContentLoaded', async () => {
    const darkModeToggle = document.getElementById('dark-mode');
    const languageSelect = document.getElementById('language');
    const autoBackupToggle = document.getElementById('auto-backup');
    const autoLogoutSelect = document.getElementById('auto-logout');
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
    const cloudSyncUpBtn = document.getElementById('options-cloud-sync-up-btn');
    const cloudSyncDownBtn = document.getElementById('options-cloud-sync-down-btn');
    const localDownloadBtn = document.getElementById('options-local-download-btn');
    const localUploadBtn = document.getElementById('options-local-upload-btn');
    const localUploadInput = document.getElementById('local-upload-input');
    const cloudLogoutBtn = document.getElementById('options-cloud-logout-btn');
    const cloudEmailDisplay = document.getElementById('options-cloud-email-display');
    const syncStatus = document.getElementById('options-sync-status');
    const loginStatus = document.getElementById('options-login-status');

    // Cloud encryption key (derived, not stored)
    let cloudEncryptionKey = null;
    let cloudPassword = null;
    let cloudSalt = null;

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
        
        // Populate auto-logout dropdown
        const autoLogoutOptions = [
            { value: 5, label: chrome.i18n.getMessage('auto_logout_5') || '5 minutes' },
            { value: 15, label: chrome.i18n.getMessage('auto_logout_15') || '15 minutes' },
            { value: 30, label: chrome.i18n.getMessage('auto_logout_30') || '30 minutes' },
            { value: 60, label: chrome.i18n.getMessage('auto_logout_60') || '60 minutes' },
            { value: 0, label: chrome.i18n.getMessage('auto_logout_never') || 'Never' }
        ];
        
        autoLogoutSelect.innerHTML = '';
        autoLogoutOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            autoLogoutSelect.appendChild(opt);
        });
        
        // Set current value
        const currentAutoLogout = prefs.autoLogoutMinutes === 0 ? 0 : (prefs.autoLogoutMinutes || 15);
        autoLogoutSelect.value = currentAutoLogout;
        
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
        const user = await CloudAuth.getCurrentUser();
        if (user) {
            cloudLoginForm.style.display = 'none';
            cloudLoggedIn.style.display = 'block';
            cloudEmailDisplay.textContent = user.email;

            // Check email verification
            if (!user.emailVerified) {
                cloudEmailDisplay.innerHTML = `${user.email}`;
            }

            cloudSyncUpBtn.disabled = !cloudEncryptionKey;
            cloudSyncDownBtn.disabled = !cloudEncryptionKey;
            localDownloadBtn.disabled = false;
            localUploadBtn.disabled = false;
            
            if (!cloudEncryptionKey) {
                showSyncStatus('Ange ditt lösenord ovan för att aktivera molnsynkronisering', 'info');
            }
            
            // Load stored salt for later use
            const cloudKeyData = await StorageUtils.get(['cloudEncryptionSalt']);
            if (cloudKeyData.cloudEncryptionSalt && cloudKeyData.cloudEncryptionSalt !== 'derived') {
                cloudSalt = cloudKeyData.cloudEncryptionSalt;
            }
        } else {
            cloudLoginForm.style.display = 'block';
            cloudLoggedIn.style.display = 'none';
            cloudEncryptionKey = null;
            cloudPassword = null;
            cloudSalt = null;
        }
    }

    function showLoginStatus(message, type = '') {
        loginStatus.textContent = message;
        loginStatus.style.color = type === 'error' ? 'var(--danger-color)' : type === 'success' ? 'var(--success-color)' : 'var(--text-secondary)';
        if (type) {
            setTimeout(() => {
                loginStatus.textContent = '';
            }, 5000);
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

    // Auto logout change
    autoLogoutSelect.addEventListener('change', async () => {
        const minutes = parseInt(autoLogoutSelect.value);
        await StorageUtils.savePreferences({ autoLogoutMinutes: minutes });
        chrome.runtime.sendMessage({ action: 'updateSessionSettings' });
    });

    // Toggle cloud password visibility
    toggleCloudPassword.addEventListener('click', () => {
        const type = cloudPasswordInput.type === 'password' ? 'text' : 'password';
        cloudPasswordInput.type = type;
        toggleCloudPassword.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Cloud login
    cloudLoginBtn.addEventListener('click', async () => {
        console.log("Login button clicked");
        const email = cloudEmailInput.value.trim();
        const password = cloudPasswordInput.value;
        
        if (!email || !password) {
            showLoginStatus('Please enter email and password', 'error');
            return;
        }

        cloudLoginBtn.disabled = true;
        cloudLoginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Logging in...</span>';
        console.log("Starting login process for:", email);

        try {
            await CloudAuth.login(email, password);
            console.log("CloudAuth.login successful");

            let salt = generateSalt();
            const cloudKeyData = await StorageUtils.get(['cloudEncryptionSalt']);
            if (cloudKeyData.cloudEncryptionSalt && cloudKeyData.cloudEncryptionSalt !== 'derived') {
                salt = cloudKeyData.cloudEncryptionSalt;
            }
            cloudEncryptionKey = await getCloudEncryptionKey(password, salt);
            cloudPassword = password;
            cloudSalt = salt;
            await StorageUtils.set({ cloudEncryptionSalt: salt });
            showLoginStatus('Logged in successfully!', 'success');
            await loadCloudState();
        } catch (error) {
            console.error("Login failed with error:", error);
            showLoginStatus(error.message, 'error');
            alert("Login Error: " + error.message);
        } finally {
            cloudLoginBtn.disabled = false;
            cloudLoginBtn.innerHTML = '<i class="fas fa-sign-in-alt btn-icon"></i> <span data-translate="cloud_login">Login</span>';
        }
    });

    // Cloud register
    cloudRegisterBtn.addEventListener('click', async () => {
        const email = cloudEmailInput.value.trim();
        const password = cloudPasswordInput.value;
        
        if (!email || !password) {
            showLoginStatus('Please enter email and password', 'error');
            return;
        }

        if (password.length < 6) {
            showLoginStatus('Password must be at least 6 characters', 'error');
            return;
        }

        cloudRegisterBtn.disabled = true;
        cloudRegisterBtn.textContent = 'Creating account...';

        try {
            await CloudAuth.register(email, password);
            const salt = generateSalt();
            cloudEncryptionKey = await getCloudEncryptionKey(password, salt);
            cloudPassword = password;
            cloudSalt = salt;
            await StorageUtils.set({ cloudEncryptionSalt: salt });
            showLoginStatus('Account created! Please check your email for the verification link.', 'success');

            // Show verification dialog
            await showEmailVerificationDialog(email, password, salt);
        } catch (error) {
            showLoginStatus(error.message, 'error');
        } finally {
            cloudRegisterBtn.disabled = false;
            cloudRegisterBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span data-translate="cloud_register">Create Account</span>';
        }
    });

    // Email verification dialog
    async function showEmailVerificationDialog(email, password, salt) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';

        const dialog = document.createElement('div');
        dialog.style.cssText = 'background:var(--surface-color,#fff);border-radius:16px;padding:32px;max-width:420px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.3);text-align:center;color:var(--text-primary,#1e293b);font-family:Inter,sans-serif;';
        dialog.innerHTML = `
            <div style="font-size:48px;margin-bottom:16px;">📧</div>
            <h3 style="margin:0 0 8px;font-size:20px;">Verify Your Email</h3>
            <p style="margin:0 0 8px;font-size:14px;color:var(--text-secondary,#64748b);line-height:1.5;">A verification email has been sent to<br><strong>${email}</strong></p>
            <p style="margin:0 0 24px;font-size:13px;color:var(--text-secondary,#64748b);">Click the link in the email, then confirm below.</p>
            <div id="verify-status" style="margin-bottom:16px;font-size:13px;min-height:20px;"></div>
            <div style="display:flex;gap:12px;">
                <button id="verify-cancel-btn" style="flex:1;padding:12px;border:1px solid var(--border-color,#e2e8f0);border-radius:8px;background:transparent;color:var(--text-secondary,#64748b);font-size:14px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;">Cancel</button>
                <button id="verify-confirm-btn" style="flex:1;padding:12px;border:none;border-radius:8px;background:linear-gradient(135deg,#0ea5e9,#38bdf8);color:white;font-size:14px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;">I've Verified</button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const statusEl = dialog.querySelector('#verify-status');
        const cancelBtn = dialog.querySelector('#verify-cancel-btn');
        const confirmBtn = dialog.querySelector('#verify-confirm-btn');

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
                        statusEl.textContent = 'Email verified! Logging in...';
                        statusEl.style.color = 'var(--success-color,#10b981)';
                        setTimeout(() => {
                            document.body.removeChild(overlay);
                            loadCloudState();
                            resolve(true);
                        }, 1000);
                    } else {
                        statusEl.textContent = 'Email not verified yet. Please check your inbox and click the verification link.';
                        statusEl.style.color = 'var(--danger-color,#ef4444)';
                        confirmBtn.disabled = false;
                        confirmBtn.textContent = "I've Verified";
                    }
                } catch (error) {
                    statusEl.textContent = 'Check failed: ' + error.message;
                    statusEl.style.color = 'var(--danger-color,#ef4444)';
                    confirmBtn.disabled = false;
                    confirmBtn.textContent = "I've Verified";
                }
            });
        });
    }

    // Cloud forgot password
    cloudForgotBtn.addEventListener('click', async () => {
        const email = cloudEmailInput.value.trim();
        if (!email) {
            showLoginStatus('Please enter your email address', 'error');
            return;
        }

        try {
            await CloudAuth.resetPassword(email);
            showLoginStatus('Password reset email sent!', 'success');
        } catch (error) {
            showLoginStatus(error.message, 'error');
        }
    });



    // Cloud Sync Up (Local to Cloud)
    cloudSyncUpBtn.addEventListener('click', async () => {
        const currentUser = await CloudAuth.getCurrentUser();
        if (!currentUser || !cloudEncryptionKey) {
            showSyncStatus('Please login first to sync', 'error');
            await loadCloudState();
            return;
        }

        cloudSyncUpBtn.disabled = true;
        cloudSyncUpBtn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i> <span>Syncing Up...</span>';
        showSyncStatus('Uploading to cloud...', '');

        try {
            const localData = await StorageUtils.exportAllData();
            const uploadResult = await CloudStorage.syncToCloud(localData, cloudEncryptionKey, cloudSalt);
            if (uploadResult.success) {
                showSyncStatus('Successfully uploaded to cloud!', 'success');
            } else if (uploadResult.offline) {
                showSyncStatus('No internet connection', 'error');
            } else {
                showSyncStatus('Upload failed: ' + uploadResult.error, 'error');
            }
        } catch (error) {
            showSyncStatus('Sync failed: ' + error.message, 'error');
        } finally {
            cloudSyncUpBtn.disabled = false;
            cloudSyncUpBtn.innerHTML = '<i class="fas fa-cloud-upload-alt btn-icon"></i> <span data-translate="sync_up">Synkronisera Upp till moln</span>';
        }
    });

    // Cloud Sync Down (Cloud to Local)
    cloudSyncDownBtn.addEventListener('click', async () => {
        const currentUser = await CloudAuth.getCurrentUser();
        if (!currentUser || !cloudEncryptionKey) {
            showSyncStatus('Please login first to sync', 'error');
            await loadCloudState();
            return;
        }

        cloudSyncDownBtn.disabled = true;
        cloudSyncDownBtn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i> <span>Syncing Down...</span>';
        showSyncStatus('Downloading from cloud...', '');

        try {
            const downloadResult = await CloudStorage.syncFromCloud(cloudEncryptionKey, cloudPassword);
            if (downloadResult.hasCloudData && !downloadResult.decryptError && downloadResult.data) {
                // Overwrite local data with cloud data
                await StorageUtils.importData(downloadResult.data, false);
                showSyncStatus('Successfully downloaded from cloud!', 'success');
                // Refresh storage info
                const stats = await StorageUtils.getStorageStats();
                const usedMB = (stats.bytesUsed / 1024 / 1024).toFixed(2);
                storageText.textContent = `${usedMB} MB / ${(stats.bytesAvailable / 1024 / 1024).toFixed(0)} MB`;
                storageBar.style.width = `${Math.min(stats.percentUsed, 100)}%`;
            } else if (downloadResult.decryptError) {
                showSyncStatus('Decryption error. Wrong password?', 'error');
            } else {
                showSyncStatus('No cloud data found.', 'error');
            }
        } catch (error) {
            showSyncStatus('Sync failed: ' + error.message, 'error');
        } finally {
            cloudSyncDownBtn.disabled = false;
            cloudSyncDownBtn.innerHTML = '<i class="fas fa-cloud-download-alt btn-icon"></i> <span data-translate="sync_down">Synkronisera Ner från moln</span>';
        }
    });

    // Local Download (Export to file)
    localDownloadBtn.addEventListener('click', async () => {
        try {
            const data = await StorageUtils.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            a.href = url;
            a.download = `PrivateLinkSaver_Backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showSyncStatus('Data downloaded successfully!', 'success');
        } catch (error) {
            showSyncStatus('Download failed: ' + error.message, 'error');
        }
    });

    // Local Upload (Import from file)
    localUploadBtn.addEventListener('click', () => {
        localUploadInput.click();
    });

    localUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                const data = JSON.parse(content);
                
                const confirmed = confirm('Do you want to merge with existing data? Click "Cancel" to overwrite all existing data.');
                
                await StorageUtils.importData(data, confirmed);
                showSyncStatus('Data imported successfully!', 'success');
                
                // Reset input
                localUploadInput.value = '';
                
                // Refresh storage info
                const stats = await StorageUtils.getStorageStats();
                const usedMB = (stats.bytesUsed / 1024 / 1024).toFixed(2);
                storageText.textContent = `${usedMB} MB / ${(stats.bytesAvailable / 1024 / 1024).toFixed(0)} MB`;
                storageBar.style.width = `${Math.min(stats.percentUsed, 100)}%`;
            } catch (error) {
                showSyncStatus('Import failed: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    });

    // Cloud logout
    cloudLogoutBtn.addEventListener('click', async () => {
        cloudLogoutBtn.disabled = true;
        cloudLogoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin btn-icon"></i> <span>Logging out...</span>';
        try {
            // Sign out from Firebase
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
                await firebase.auth().signOut();
            }
            await CloudAuth.logout();
            cloudEncryptionKey = null;
            cloudPassword = null;
            cloudSalt = null;
            await StorageUtils.set({ cloudEncryptionSalt: null });
            showSyncStatus('Logged out successfully', 'success');
            await loadCloudState();
        } catch (error) {
            showSyncStatus('Logout failed: ' + error.message, 'error');
        } finally {
            cloudLogoutBtn.disabled = false;
            cloudLogoutBtn.innerHTML = '<svg class="icon btn-icon" viewBox="0 0 24 24"><use href="#icon-sign-out"></use></svg> <span data-translate="cloud_logout">Logout</span>';
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

    // Footer email copy
    const footerEmailDisplay = document.getElementById('footer-email-display');
    const footerCopyIcon = document.getElementById('footer-copy-icon');
    const footerCopiedMsg = document.getElementById('footer-copied-msg');
    if (footerEmailDisplay) {
        footerEmailDisplay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var text = 'bynrnworld@gmail.com';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function() {
                    showFooterCopied();
                }).catch(function() {
                    fallbackFooterCopy(text);
                });
            } else {
                fallbackFooterCopy(text);
            }
        });
    }

    function showFooterCopied() {
        if (footerCopyIcon) {
            footerCopyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
            footerCopyIcon.style.opacity = '1';
            footerCopyIcon.style.stroke = '#10b981';
        }
        if (footerCopiedMsg) footerCopiedMsg.style.display = 'inline';
        setTimeout(function() {
            if (footerCopyIcon) {
                footerCopyIcon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
                footerCopyIcon.style.opacity = '0.6';
                footerCopyIcon.style.stroke = 'currentColor';
            }
            if (footerCopiedMsg) footerCopiedMsg.style.display = 'none';
        }, 2000);
    }

    function fallbackFooterCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showFooterCopied();
    }
});
