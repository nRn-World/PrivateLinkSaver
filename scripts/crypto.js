// Crypto utilities for password hashing and encryption
const CryptoUtils = {
    // Hash password using SHA-256 with salt
    async hashPassword(password, salt = null) {
        if (!salt) {
            salt = this.generateSalt();
        }
        
        const encoder = new TextEncoder();
        const passwordData = encoder.encode(password + salt);
        const hashBuffer = await crypto.subtle.digest('SHA-256', passwordData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        return {
            hash: hashHex,
            salt: salt
        };
    },

    // Verify password against hash
    async verifyPassword(password, hash, salt) {
        const result = await this.hashPassword(password, salt);
        return result.hash === hash;
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
                iterations: 100000,
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

    // Simple encryption for export (Base64 encoding)
    async encryptExport(data, password) {
        try {
            const jsonString = JSON.stringify(data);
            const encoded = btoa(unescape(encodeURIComponent(jsonString)));
            return encoded;
        } catch (error) {
            console.error('Export encryption error:', error);
            return null;
        }
    },

    // Simple decryption for import
    async decryptImport(encryptedData, password) {
        try {
            const decoded = decodeURIComponent(escape(atob(encryptedData)));
            return JSON.parse(decoded);
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
                code += chars.charAt(Math.floor(Math.random() * chars.length));
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

    // Generate UUID
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};
