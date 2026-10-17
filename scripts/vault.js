// Optional encryption of the local vault (bookmarks, folders, tags, backups).
// Off by default: until a user turns it on, everything stays in plain chrome.storage.local
// exactly as before. When on, those four keys live only inside one AES-256-GCM blob
// (`vaultBlob`); the key is derived from the master password and kept in chrome.storage.session
// (memory only), so it is gone after logout, auto-logout or a browser restart.
const Vault = {
    KEYS: ['bookmarks', 'folders', 'tags', 'backups'],
    PBKDF2_ITERATIONS: 210000,
    _chain: Promise.resolve(),

    _local(op, arg) {
        return new Promise((resolve, reject) => {
            chrome.storage.local[op](arg, (result) => {
                if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
                else resolve(result);
            });
        });
    },

    _b64(bytes) {
        let s = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
            s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(s);
    },

    _unb64(str) {
        return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    },

    _lockedError() {
        const err = new Error('Vault is locked');
        err.name = 'VaultLockedError';
        return err;
    },

    async isEnabled() {
        const r = await this._local('get', 'vaultBlob');
        return !!r.vaultBlob;
    },

    async _importKey(rawB64) {
        return crypto.subtle.importKey('raw', this._unb64(rawB64), 'AES-GCM', false, ['encrypt', 'decrypt']);
    },

    async _deriveRaw(password, saltB64) {
        const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt: this._unb64(saltB64), iterations: this.PBKDF2_ITERATIONS, hash: 'SHA-256' },
            base,
            256
        );
        return this._b64(new Uint8Array(bits));
    },

    async _encrypt(obj, rawB64) {
        const key = await this._importKey(rawB64);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(obj)));
        return { iv: this._b64(iv), data: this._b64(new Uint8Array(data)) };
    },

    async _decrypt(blob, rawB64) {
        const key = await this._importKey(rawB64);
        const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: this._unb64(blob.iv) }, key, this._unb64(blob.data));
        return JSON.parse(new TextDecoder().decode(plain));
    },

    async _sessionKey() {
        const r = await chrome.storage.session.get('vaultKey');
        return r.vaultKey || null;
    },

    // True when the vault is on but its key is not available (needs the master password).
    async isLocked() {
        return (await this.isEnabled()) && !(await this._sessionKey());
    },

    async lock() {
        try { await chrome.storage.session.remove('vaultKey'); } catch (_e) { /* no session storage: nothing to lock */ }
    },

    // Derive the key from the password and keep it in memory. False = wrong password.
    async unlock(password) {
        const r = await this._local('get', ['vaultBlob', 'vaultSalt']);
        if (!r.vaultBlob) return true;
        try {
            const raw = await this._deriveRaw(password, r.vaultSalt);
            await this._decrypt(r.vaultBlob, raw);
            await chrome.storage.session.set({ vaultKey: raw });
            return true;
        } catch (_e) {
            return false;
        }
    },

    async _readAll() {
        const [r, raw] = await Promise.all([this._local('get', 'vaultBlob'), this._sessionKey()]);
        if (!r.vaultBlob) return null;
        if (!raw) throw this._lockedError();
        return this._decrypt(r.vaultBlob, raw);
    },

    // chrome.storage.local.get that transparently reads the four vault keys from the blob.
    async localGet(keys) {
        const result = await this._local('get', keys);
        const wanted = (Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : []).filter((k) => this.KEYS.includes(k));
        if (!wanted.length) return result;
        const all = await this._readAll();
        if (!all) return result;
        wanted.forEach((k) => { if (all[k] !== undefined) result[k] = all[k]; });
        return result;
    },

    // chrome.storage.local.set that transparently writes the four vault keys into the blob.
    // Serialized so two writes in one context cannot interleave their read-modify-write.
    localSet(data) {
        const run = this._chain.then(() => this._localSet(data), () => this._localSet(data));
        this._chain = run.catch(() => {});
        return run;
    },

    async _localSet(data) {
        const vaultPart = {};
        const plainPart = {};
        Object.keys(data).forEach((k) => { (this.KEYS.includes(k) ? vaultPart : plainPart)[k] = data[k]; });

        if (Object.keys(vaultPart).length && await this.isEnabled()) {
            const raw = await this._sessionKey();
            if (!raw) throw this._lockedError();
            const next = { ...(await this._readAll()), ...vaultPart };
            await this._local('set', { vaultBlob: await this._encrypt(next, raw) });
        } else {
            Object.assign(plainPart, vaultPart);
        }
        if (Object.keys(plainPart).length) await this._local('set', plainPart);
    },

    // Turn encryption on. The caller has already verified the master password.
    // Plain data is removed only after the encrypted copy has been read back and compared.
    async enable(password) {
        if (await this.isEnabled()) return;
        const plain = await this._local('get', this.KEYS);
        const data = {};
        this.KEYS.forEach((k) => { data[k] = plain[k]; });

        // Safety copy that lives inside the encrypted blob too.
        const backups = Array.isArray(data.backups) ? data.backups.slice() : [];
        backups.push({
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            note: 'before-encryption',
            data: { version: '2.5.0', bookmarks: data.bookmarks || [], folders: data.folders || [], tags: data.tags || [] }
        });
        while (backups.length > 10) backups.shift();
        data.backups = backups;

        const saltB64 = this._b64(crypto.getRandomValues(new Uint8Array(16)));
        const raw = await this._deriveRaw(password, saltB64);
        const blob = await this._encrypt(data, raw);

        if (JSON.stringify(await this._decrypt(blob, raw)) !== JSON.stringify(data)) {
            throw new Error('Encryption self-check failed; nothing was changed');
        }

        await this._local('set', { vaultBlob: blob, vaultSalt: saltB64 });
        const stored = await this._local('get', ['vaultBlob', 'vaultSalt']);
        if (JSON.stringify(await this._decrypt(stored.vaultBlob, raw)) !== JSON.stringify(data)) {
            await this._local('remove', ['vaultBlob', 'vaultSalt']);
            throw new Error('Encrypted copy could not be verified; nothing was changed');
        }

        await chrome.storage.session.set({ vaultKey: raw });
        await this._local('remove', this.KEYS);
    },

    // Turn encryption off again (vault must be unlocked). Plain copy is written before the blob is removed.
    async disable() {
        if (!(await this.isEnabled())) return;
        const all = await this._readAll();
        const plain = {};
        this.KEYS.forEach((k) => { if (all[k] !== undefined) plain[k] = all[k]; });
        await this._local('set', plain);
        await this._local('remove', ['vaultBlob', 'vaultSalt']);
        await this.lock();
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Vault;
}
