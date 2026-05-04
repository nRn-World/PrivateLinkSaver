// Firebase Modular SDK initialization for Manifest V3
// This replaces the compat versions and avoids external script loading

// Minimal Firebase implementation for Chrome Extension
const firebase = {
    apps: [],
    
    initializeApp(config, name = '[DEFAULT]') {
        const app = {
            name: name,
            config: config,
            _messaging: null,
            _auth: null,
            _database: null,
            _firestore: null
        };
        
        // Create auth object
        app._auth = FirebaseAuth.createAuth(app);
        
        // Create firestore object
        app._firestore = FirebaseFirestore.createFirestore(app);
        
        this.apps.push(app);
        return app;
    },
    
    app(name = '[DEFAULT]') {
        return this.apps.find(app => app.name === name);
    },
    
    auth(app) {
        if (!app) {
            app = this.apps[0];
        }
        return app._auth;
    },
    
    firestore(app) {
        if (!app) {
            app = this.apps[0];
        }
        return app._firestore;
    }
};

// Firebase Auth implementation
const FirebaseAuth = {
    createAuth(app) {
        return {
            app: app,
            currentUser: null,
            _authListeners: [],
            _idTokenListeners: [],
            
            async createUserWithEmailAndPassword(email, password) {
                const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signUp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        returnSecureToken: true
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Signup failed');
                }
                
                const data = await response.json();
                const user = this._createUserObject(data);
                this.currentUser = user;
                this._notifyAuthListeners(user);
                
                // Store tokens
                if (data.idToken) {
                    localStorage.setItem('firebase_token', data.idToken);
                    localStorage.setItem('firebase_refresh_token', data.refreshToken);
                }
                
                return { user: user };
            },
            
            async signInWithEmailAndPassword(email, password) {
                const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password,
                        returnSecureToken: true
                    })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Sign in failed');
                }
                
                const data = await response.json();
                const user = this._createUserObject(data);
                this.currentUser = user;
                this._notifyAuthListeners(user);
                
                // Store tokens
                if (data.idToken) {
                    localStorage.setItem('firebase_token', data.idToken);
                    localStorage.setItem('firebase_refresh_token', data.refreshToken);
                }
                
                return { user: user };
            },
            
            async signOut() {
                this.currentUser = null;
                localStorage.removeItem('firebase_token');
                localStorage.removeItem('firebase_refresh_token');
                this._notifyAuthListeners(null);
            },
            
            onAuthStateChanged(callback) {
                this._authListeners.push(callback);
                // Call immediately with current user
                callback(this.currentUser);
                
                // Return unsubscribe function
                return () => {
                    const index = this._authListeners.indexOf(callback);
                    if (index > -1) {
                        this._authListeners.splice(index, 1);
                    }
                };
            },
            
            onIdTokenChanged(callback) {
                this._idTokenListeners.push(callback);
                callback(this.currentUser);
                
                return () => {
                    const index = this._idTokenListeners.indexOf(callback);
                    if (index > -1) {
                        this._idTokenListeners.splice(index, 1);
                    }
                };
            },
            
            async setPersistence(type) {
                // LocalPersistence by default
                return;
            },
            
            _createUserObject(data) {
                return {
                    uid: data.localId,
                    email: data.email,
                    emailVerified: data.emailVerified || false,
                    displayName: data.displayName || null,
                    photoURL: data.photoUrl || null,
                    phoneNumber: data.phoneNumber || null,
                    isAnonymous: false,
                    metadata: {
                        createdAt: null,
                        lastSignInTime: null
                    },
                    stsTokenManager: {
                        accessToken: data.idToken,
                        refreshToken: data.refreshToken,
                        expirationTime: data.expiresIn ? Date.now() + (parseInt(data.expiresIn) * 1000) : null
                    },
                    
                    // User methods
                    async getIdToken(forceRefresh = false) {
                        if (forceRefresh && this.stsTokenManager.refreshToken) {
                            const response = await fetch('https://securetoken.googleapis.com/v1/token', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                },
                                body: new URLSearchParams({
                                    grant_type: 'refresh_token',
                                    refresh_token: this.stsTokenManager.refreshToken
                                })
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                this.stsTokenManager.accessToken = data.id_token;
                                this.stsTokenManager.expirationTime = Date.now() + (parseInt(data.expires_in) * 1000);
                                localStorage.setItem('firebase_token', data.id_token);
                            }
                        }
                        return this.stsTokenManager.accessToken;
                    },
                    
                    async reload() {
                        // Reload user data from server
                        const idToken = await this.getIdToken();
                        const response = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ idToken: idToken })
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.users && data.users[0]) {
                                const userInfo = data.users[0];
                                this.email = userInfo.email;
                                this.displayName = userInfo.displayName || null;
                                this.photoURL = userInfo.photoUrl || null;
                                this.emailVerified = userInfo.emailVerified || false;
                                this.phoneNumber = userInfo.phoneNumber || null;
                            }
                        }
                    },
                    
                    async sendEmailVerification() {
                        const idToken = await this.getIdToken();
                        await fetch('https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                requestType: 'VERIFY_EMAIL',
                                idToken: idToken
                            })
                        });
                    },
                    
                    async delete() {
                        const idToken = await this.getIdToken();
                        await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ idToken: idToken })
                        });
                    }
                };
            },
            
            _notifyAuthListeners(user) {
                this._authListeners.forEach(listener => listener(user));
            },
            
            _notifyIdTokenListeners(user) {
                this._idTokenListeners.forEach(listener => listener(user));
            }
        };
    }
};

// Firebase Auth Persistence types
firebase.auth.Auth = {
    Persistence: {
        LOCAL: 'LOCAL',
        SESSION: 'SESSION',
        NONE: 'NONE'
    }
};

// Firebase Firestore implementation (minimal)
const FirebaseFirestore = {
    createFirestore(app) {
        return {
            app: app,
            _listeners: {},
            
            collection(name) {
                return {
                    firestore: this,
                    collectionName: name,
                    
                    doc(docId) {
                        return {
                            firestore: this.firestore,
                            collectionName: this.collectionName,
                            docId: docId,
                            
                            async set(data) {
                                // Save to Chrome Storage API or IndexedDB
                                const key = `fs_${this.collectionName}_${this.docId}`;
                                return new Promise((resolve) => {
                                    chrome.storage.local.set({ [key]: data }, () => {
                                        resolve();
                                    });
                                });
                            },
                            
                            async get() {
                                const key = `fs_${this.collectionName}_${this.docId}`;
                                return new Promise((resolve) => {
                                    chrome.storage.local.get([key], (result) => {
                                        resolve({
                                            exists: !!result[key],
                                            data: () => result[key] || null
                                        });
                                    });
                                });
                            },
                            
                            async delete() {
                                const key = `fs_${this.collectionName}_${this.docId}`;
                                return new Promise((resolve) => {
                                    chrome.storage.local.remove([key], () => {
                                        resolve();
                                    });
                                });
                            },
                            
                            async update(data) {
                                const doc = await this.get();
                                const merged = { ...doc.data(), ...data };
                                return this.set(merged);
                            }
                        };
                    },
                    
                    async add(data) {
                        const docId = Date.now().toString();
                        await this.doc(docId).set(data);
                        return { id: docId };
                    },
                    
                    onSnapshot(callback) {
                        // Simplified - just call with empty data
                        callback({
                            docs: [],
                            forEach: (fn) => {}
                        });
                        
                        return () => {};
                    }
                };
            }
        };
    }
};
