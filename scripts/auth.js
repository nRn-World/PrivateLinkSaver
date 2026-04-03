// Auth utilities for cloud sync with Firebase
const CloudAuth = {
    firebaseConfig: {
        apiKey: "AIzaSyB-placeholder-replace-with-your-key",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "000000000000",
        appId: "1:000000000000:web:0000000000000000"
    },

    initialized: false,

    async init() {
        if (this.initialized) return;
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(this.firebaseConfig);
            }
            firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            this.initialized = true;
        } catch (error) {
            console.error("Firebase init error:", error);
        }
    },

    getCurrentUser() {
        return firebase.auth().currentUser;
    },

    onAuthStateChanged(callback) {
        return firebase.auth().onAuthStateChanged(callback);
    },

    async register(email, password) {
        await this.init();
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        return userCredential.user;
    },

    async login(email, password) {
        await this.init();
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        return userCredential.user;
    },

    async logout() {
        await this.init();
        await firebase.auth().signOut();
    },

    async resetPassword(email) {
        await this.init();
        await firebase.auth().sendPasswordResetEmail(email);
    }
};

const CloudStorage = {
    async syncToCloud(data, encryptionKey) {
        if (!navigator.onLine) return { success: false, offline: true };
        try {
            const user = CloudAuth.getCurrentUser();
            if (!user) return { success: false, error: "Not logged in" };

            const encryptedData = await CryptoUtils.encryptData(data, encryptionKey);
            const db = firebase.firestore();
            await db.collection("users").doc(user.uid).collection("data").doc("bookmarks").set({
                encrypted: encryptedData.encrypted,
                iv: encryptedData.iv,
                salt: encryptionKey.salt,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error("Sync to cloud error:", error);
            return { success: false, error: error.message };
        }
    },

    async syncFromCloud(encryptionKey) {
        if (!navigator.onLine) return { data: null, hasCloudData: false, offline: true };
        try {
            const user = CloudAuth.getCurrentUser();
            if (!user) return { data: null, hasCloudData: false, error: "Not logged in" };

            const db = firebase.firestore();
            const doc = await db.collection("users").doc(user.uid).collection("data").doc("bookmarks").get();

            if (!doc.exists) return { data: null, hasCloudData: false };

            const docData = doc.data();
            const decryptedData = await CryptoUtils.decryptData(docData.encrypted, docData.iv, encryptionKey);

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
