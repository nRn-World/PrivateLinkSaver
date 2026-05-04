// Auth utilities for cloud sync with Firebase
// Security note: Firebase API keys are public by design in client-side apps.
// Protect data using Firebase Security Rules.
const CloudAuth = {
    firebaseConfig: {
        apiKey: "AIzaSyCeu9QJB5jrrBlQMdJXaPULT-kVKtq9Kh0",
        authDomain: "privatelinksaver.firebaseapp.com",
        projectId: "privatelinksaver",
        storageBucket: "privatelinksaver.firebasestorage.app",
        messagingSenderId: "360854078458",
        appId: "1:360854078458:web:66783ae7043ef28ef69a43",
        measurementId: "G-GPE2DXXFPF"
    },

    initialized: false,
    initPromise: null,

    async init() {
        if (this.initialized) return;
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            try {
                if (typeof firebase === 'undefined') {
                    console.error('Firebase SDK not loaded');
                    return;
                }
                if (!firebase.apps || !firebase.apps.length) {
                    firebase.initializeApp(this.firebaseConfig);
                }
                const auth = firebase.auth();
                if (auth && auth.setPersistence) {
                    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                }
                // Restore session from persistent storage
                if (auth && auth._restoreAuthState) {
                    await auth._restoreAuthState();
                }
                this.initialized = true;
            } catch (error) {
                console.error("Firebase init error:", error);
            }
        })();
        
        return this.initPromise;
    },

    async getCurrentUser() {
        await this.init();
        const auth = firebase.auth();
        if (!auth) return null;
        return auth.currentUser;
    },

    async onAuthStateChanged(callback) {
        await this.init();
        const auth = firebase.auth();
        if (!auth) { callback(null); return () => {}; }
        return auth.onAuthStateChanged(callback);
    },

    async register(email, password) {
        await this.init();
        if (!firebase.apps || !firebase.apps.length) {
            throw new Error('Firebase is not initialized. Please reload the page.');
        }
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        // Send email verification
        await userCredential.user.sendEmailVerification();
        return userCredential.user;
    },

    async login(email, password) {
        await this.init();
        if (!firebase.apps || !firebase.apps.length) {
            throw new Error('Firebase is not initialized. Please reload the page.');
        }
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return userCredential.user;
    },

    async resendVerificationEmail() {
        await this.init();
        const auth = firebase.auth();
        if (!auth) return false;
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
            await user.sendEmailVerification();
            return true;
        }
        return false;
    },

    async isEmailVerified() {
        await this.init();
        const auth = firebase.auth();
        if (!auth) return false;
        const user = auth.currentUser;
        if (user) {
            await user.reload();
            return user.emailVerified;
        }
        return false;
    },

    async logout() {
        await this.init();
        const auth = firebase.auth();
        if (auth) {
            await auth.signOut();
        }
    },

    async resetPassword(email) {
        await this.init();
        if (!firebase.apps || !firebase.apps.length) {
            throw new Error('Firebase is not initialized. Please reload the page.');
        }
        const apiKey = this.firebaseConfig.apiKey;
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestType: 'PASSWORD_RESET',
                email: email
            })
        });
        if (!response.ok) {
            const error = await response.json();
            const errMsg = error.error?.message || 'Failed to send reset email';
            if (errMsg === 'EMAIL_NOT_FOUND') throw new Error('No account found with this email address.');
            throw new Error(errMsg);
        }
    }
};

const CloudStorage = {
    async syncToCloud(data, encryptionKey, salt) {
        if (!navigator.onLine) return { success: false, offline: true };
        try {
            await CloudAuth.init();
            const auth = firebase.auth();
            if (!auth) return { success: false, error: "Firebase not initialized" };
            const user = auth.currentUser;
            if (!user) return { success: false, error: "Not logged in" };

            const encryptedData = await CryptoUtils.encryptData(data, encryptionKey);
            
            // Use REST API instead of Firestore SDK
            const idToken = await user.getIdToken();
            const projectId = CloudAuth.firebaseConfig.projectId;
            const docPath = `users/${user.uid}/data/bookmarks`;
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;
            
            const firestoreData = {
                fields: {
                    encrypted: { stringValue: encryptedData.encrypted },
                    iv: { stringValue: encryptedData.iv },
                    salt: { stringValue: salt || "" },
                    updatedAt: { timestampValue: new Date().toISOString() }
                }
            };

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(firestoreData)
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to save to cloud');
            }

            return { success: true };
        } catch (error) {
            console.error("Sync to cloud error:", error);
            return { success: false, error: error.message };
        }
    },

    async syncFromCloud(encryptionKey, password) {
        if (!navigator.onLine) return { data: null, hasCloudData: false, offline: true };
        try {
            await CloudAuth.init();
            const auth = firebase.auth();
            if (!auth) return { data: null, hasCloudData: false, error: "Firebase not initialized" };
            const user = auth.currentUser;
            if (!user) return { data: null, hasCloudData: false, error: "Not logged in" };

            const idToken = await user.getIdToken();
            const projectId = CloudAuth.firebaseConfig.projectId;
            const docPath = `users/${user.uid}/data/bookmarks`;
            const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${docPath}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });

            if (response.status === 404) {
                return { data: null, hasCloudData: false };
            }

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Failed to read from cloud');
            }

            const docData = await response.json();
            const fields = docData.fields;
            if (!fields || !fields.encrypted) {
                return { data: null, hasCloudData: false };
            }

            const encrypted = fields.encrypted.stringValue;
            const iv = fields.iv.stringValue;

            let decryptedData = await CryptoUtils.decryptData(encrypted, iv, encryptionKey);

            // Fallback to legacy decryption if current key fails
            if (decryptedData === null && password) {
                decryptedData = await CryptoUtils.decryptDataLegacy(encrypted, iv, password);
            }

            if (decryptedData === null) {
                return { data: null, hasCloudData: true, decryptError: true };
            }

            return { data: decryptedData, hasCloudData: true, decryptError: false };
        } catch (error) {
            console.error("Sync from cloud error:", error);
            return { data: null, hasCloudData: false, error: error.message };
        }
    }
};

// Start initialization as soon as the script is loaded
CloudAuth.init().catch(console.error);
