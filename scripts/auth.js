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
                await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                this.initialized = true;
            } catch (error) {
                console.error("Firebase init error:", error);
            }
        })();
        
        return this.initPromise;
    },

    async getCurrentUser() {
        await this.init();
        return firebase.auth().currentUser;
    },

    async onAuthStateChanged(callback) {
        await this.init();
        return firebase.auth().onAuthStateChanged(callback);
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
        const user = firebase.auth().currentUser;
        if (user && !user.emailVerified) {
            await user.sendEmailVerification();
            return true;
        }
        return false;
    },

    async isEmailVerified() {
        await this.init();
        const user = firebase.auth().currentUser;
        if (user) {
            await user.reload();
            return user.emailVerified;
        }
        return false;
    },

    async logout() {
        await this.init();
        await firebase.auth().signOut();
    },

    async resetPassword(email) {
        await this.init();
        if (!firebase.apps || !firebase.apps.length) {
            throw new Error('Firebase is not initialized. Please reload the page.');
        }
        await firebase.auth().sendPasswordResetEmail(email);
    }
};

const CloudStorage = {
    async syncToCloud(data, encryptionKey, salt) {
        if (!navigator.onLine) return { success: false, offline: true };
        try {
            await CloudAuth.init();
            const user = firebase.auth().currentUser;
            if (!user) return { success: false, error: "Not logged in" };

            const encryptedData = await CryptoUtils.encryptData(data, encryptionKey);
            const db = firebase.firestore();
            await db.collection("users").doc(user.uid).collection("data").doc("bookmarks").set({
                encrypted: encryptedData.encrypted,
                iv: encryptedData.iv,
                salt: salt || "",
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
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
            const user = firebase.auth().currentUser;
            if (!user) return { data: null, hasCloudData: false, error: "Not logged in" };

            const db = firebase.firestore();
            const doc = await db.collection("users").doc(user.uid).collection("data").doc("bookmarks").get();

            if (!doc.exists) return { data: null, hasCloudData: false };

            const docData = doc.data();
            let decryptedData = await CryptoUtils.decryptData(docData.encrypted, docData.iv, encryptionKey);

            // Fallback to legacy decryption if current key fails
            if (decryptedData === null && password) {
                decryptedData = await CryptoUtils.decryptDataLegacy(docData.encrypted, docData.iv, password);
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
CloudAuth.init();
