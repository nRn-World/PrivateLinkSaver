// Crypto utilities for password hashing and encryption
const CryptoUtils = {
    PASSWORD_HASH_ITERATIONS: 210000,

    // Hash password using PBKDF2-SHA256 with salt
    async hashPassword(password, salt = null) {
        if (!salt) {
            salt = this.generateSalt();
        }

        const hashHex = await this.derivePasswordHash(password, salt);
        
        return {
            hash: hashHex,
            salt: salt
        };
    },

    // Verify password against hash
    async verifyPassword(password, hash, salt) {
        const result = await this.hashPassword(password, salt);
        if (result.hash === hash) {
            return true;
        }

        // Backward-compatible fallback for legacy SHA-256(password + salt)
        const legacyHash = await this.hashPasswordLegacy(password, salt);
        return legacyHash === hash;
    },

    async derivePasswordHash(password, salt) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);

        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordData,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const derivedBits = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: this.hexToArrayBuffer(salt),
                iterations: this.PASSWORD_HASH_ITERATIONS,
                hash: 'SHA-256'
            },
            baseKey,
            256
        );

        return this.arrayBufferToHex(derivedBits);
    },

    async hashPasswordLegacy(password, salt) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
        return this.arrayBufferToHex(hashBuffer);
    },

    // Generate a random salt
    generateSalt() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    // Generate a secure random key for encryption
    async generateEncryptionKey() {
        return await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: 256
            },
            true,
            ['encrypt', 'decrypt']
        );
    },

    // Derive encryption key from password
    async deriveKeyFromPassword(password, salt) {
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password);
        
        const baseKey = await crypto.subtle.importKey(
            'raw',
            passwordData,
            'PBKDF2',
            false,
            ['deriveKey']
        );
        
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: this.hexToArrayBuffer(salt),
                iterations: this.PASSWORD_HASH_ITERATIONS, // consistent with hashPassword
                hash: 'SHA-256'
            },
            baseKey,
            {
                name: 'AES-GCM',
                length: 256
            },
            false,
            ['encrypt', 'decrypt']
        );
    },

    // Encrypt data using AES-256-GCM
    async encryptData(data, key) {
        try {
            const encoder = new TextEncoder();
            const jsonString = JSON.stringify(data);
            const dataBuffer = encoder.encode(jsonString);
            
            // Generate IV
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Encrypt
            const encryptedBuffer = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                dataBuffer
            );
            
            return {
                encrypted: this.arrayBufferToBase64(encryptedBuffer),
                iv: this.arrayBufferToBase64(iv)
            };
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    },

    // Decrypt data
    async decryptData(encryptedData, iv, key) {
        try {
            const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
            const ivBuffer = this.base64ToArrayBuffer(iv);
            
            const decryptedBuffer = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: ivBuffer
                },
                key,
                encryptedBuffer
            );
            
            const decoder = new TextDecoder();
            const jsonString = decoder.decode(decryptedBuffer);
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    },

    // Try to decrypt with legacy key derivation (for backward compatibility)
    async decryptDataLegacy(encryptedData, iv, password) {
        try {
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
            
            const legacyKey = await crypto.subtle.deriveKey(
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
            
            return await this.decryptData(encryptedData, iv, legacyKey);
        } catch (error) {
            console.error('Legacy decryption error:', error);
            return null;
        }
    },

    // Robust encryption for export using password
    async encryptExport(data, password) {
        try {
            const salt = this.generateSalt();
            const key = await this.deriveKeyFromPassword(password, salt);
            const encrypted = await this.encryptData(data, key);
            
            if (!encrypted) return null;
            
            // Format as a single JSON object for easy sharing
            return JSON.stringify({
                version: '3.0.0',
                encrypted: encrypted.encrypted,
                iv: encrypted.iv,
                salt: salt,
                type: 'encrypted_backup'
            });
        } catch (error) {
            console.error('Export encryption error:', error);
            return null;
        }
    },

    // Decryption for import
    async decryptImport(backupData, password) {
        try {
            // Check if it's already a JSON object
            let backup;
            if (typeof backupData === 'string') {
                try {
                    backup = JSON.parse(backupData);
                } catch {
                    // Fallback to legacy plain-text Base64 (from old versions)
                    const decoded = decodeURIComponent(escape(atob(backupData)));
                    return JSON.parse(decoded);
                }
            } else {
                backup = backupData;
            }

            // If it's the new encrypted format
            if (backup.type === 'encrypted_backup' && backup.encrypted && backup.iv && backup.salt) {
                const key = await this.deriveKeyFromPassword(password, backup.salt);
                return await this.decryptData(backup.encrypted, backup.iv, key);
            }

            // Fallback for older JSON format (plain text)
            if (backup.bookmarks || backup.folders || backup.tags) {
                return backup;
            }

            return null;
        } catch (error) {
            console.error('Import decryption error:', error);
            return null;
        }
    },

    // Generate backup codes
    generateBackupCodes(count = 10) {
        const codes = [];
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        
        for (let i = 0; i < count; i++) {
            let code = '';
            for (let j = 0; j < 8; j++) {
                if (j === 4) code += '-';
                const randomValues = new Uint8Array(1);
                crypto.getRandomValues(randomValues);
                code += chars.charAt(randomValues[0] % chars.length);
            }
            codes.push(code);
        }
        
        return codes;
    },

    // Check password strength
    checkPasswordStrength(password) {
        let score = 0;
        const checks = {
            length: password.length >= 8,
            lowercase: /[a-z]/.test(password),
            uppercase: /[A-Z]/.test(password),
            numbers: /\d/.test(password),
            special: /[^a-zA-Z0-9]/.test(password)
        };
        
        score = Object.values(checks).filter(Boolean).length;
        
        let strength = 'weak';
        if (score >= 4 && password.length >= 10) strength = 'strong';
        else if (score >= 3 && password.length >= 8) strength = 'medium';
        
        return {
            strength,
            score,
            checks
        };
    },

    // Utility functions
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    },

    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    hexToArrayBuffer(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes.buffer;
    },

    // Generate UUID (cryptographically secure)
    generateUUID() {
        return crypto.randomUUID();
    }
};
