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
    
    auth(appRef) {
        if (!appRef) {
            appRef = this.apps[0];
        }
        if (!appRef) return null;
        return appRef._auth;
    },
    
    firestore(appRef) {
        if (!appRef) {
            appRef = this.apps[0];
        }
        if (!appRef) return null;
        return appRef._firestore;
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
                const apiKey = this.app.config.apiKey;
                const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
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
                
                // Persist user data
                if (data.idToken) {
                    await this._persistUserData(user);
                }
                
                this._notifyAuthListeners(user);
                return { user: user };
            },
            
            async signInWithEmailAndPassword(email, password) {
                const apiKey = this.app.config.apiKey;
                const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
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
                    const errMsg = error.error?.message || 'Sign in failed';
                    // Make error messages user-friendly
                    if (errMsg === 'EMAIL_NOT_FOUND' || errMsg === 'INVALID_EMAIL') throw new Error('No account found with this email address.');
                    if (errMsg === 'INVALID_PASSWORD' || errMsg === 'INVALID_LOGIN_CREDENTIALS') throw new Error('Incorrect password. Please try again.');
                    if (errMsg === 'TOO_MANY_ATTEMPTS_TRY_LATER') throw new Error('Too many failed attempts. Please try again later.');
                    if (errMsg === 'USER_DISABLED') throw new Error('This account has been disabled.');
                    throw new Error(errMsg);
                }
                
                const data = await response.json();
                const user = this._createUserObject(data);
                this.currentUser = user;
                
                // Persist user data
                if (data.idToken) {
                    await this._persistUserData(user);
                }
                
                this._notifyAuthListeners(user);
                return { user: user };
            },
            
            async signOut() {
                this.currentUser = null;
                // Use chrome.storage.local for token persistence (no localStorage in MV3 service workers)
                try {
                    await new Promise(resolve => chrome.storage.local.remove(['firebase_token', 'firebase_refresh_token', 'firebase_user_info'], resolve));
                } catch(e) {
                    try { localStorage.removeItem('firebase_token'); } catch(_){}
                    try { localStorage.removeItem('firebase_refresh_token'); } catch(_){}
                    try { localStorage.removeItem('firebase_user_info'); } catch(_){}
                }
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
                const apiKey = this.app && this.app.config ? this.app.config.apiKey : '';
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
                    _apiKey: apiKey, // Firebase API key for REST calls
                    async getIdToken(forceRefresh = false) {
                        const apiKey = this._apiKey || '';
                        // Auto-refresh if token is expired or about to expire (within 5 min)
                        const isExpiringSoon = this.stsTokenManager.expirationTime && 
                            (this.stsTokenManager.expirationTime - Date.now() < 5 * 60 * 1000);

                        if ((forceRefresh || isExpiringSoon) && this.stsTokenManager.refreshToken) {
                            const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
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
                                this.stsTokenManager.refreshToken = data.refresh_token;
                                this.stsTokenManager.expirationTime = Date.now() + (parseInt(data.expires_in) * 1000);
                            }
                        }
                        return this.stsTokenManager.accessToken;
                    },
                    
                    async reload() {
                        // Reload user data from server
                        const apiKey = this._apiKey || '';
                        const idToken = await this.getIdToken();
                        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
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
                        const apiKey = this._apiKey || '';
                        const idToken = await this.getIdToken();
                        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                requestType: 'VERIFY_EMAIL',
                                idToken: idToken
                            })
                        });
                        if (!response.ok) {
                            const err = await response.json();
                            throw new Error(err.error?.message || 'Failed to send verification email');
                        }
                    },
                    
                    async delete() {
                        const apiKey = this._apiKey || '';
                        const idToken = await this.getIdToken();
                        await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
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
            },

            // Restore auth state from persistent storage
            async _restoreAuthState() {
                try {
                    // Try chrome.storage.local first (works in MV3 extension pages)
                    const stored = await new Promise(resolve => {
                        chrome.storage.local.get(['firebase_token', 'firebase_refresh_token', 'firebase_user_info'], result => resolve(result));
                    });
                    let idToken = stored.firebase_token;
                    let refreshToken = stored.firebase_refresh_token;
                    let userInfo = stored.firebase_user_info;

                    // Fallback to localStorage for popup/options pages
                    if (!idToken) {
                        try {
                            idToken = localStorage.getItem('firebase_token');
                            refreshToken = localStorage.getItem('firebase_refresh_token');
                            const ui = localStorage.getItem('firebase_user_info');
                            if (ui) userInfo = JSON.parse(ui);
                        } catch(_) {}
                    }

                    if (!idToken || !userInfo) {
                        this._notifyAuthListeners(null);
                        return;
                    }

                    // Reconstruct user object from stored info
                    const user = this._createUserObject({
                        ...userInfo,
                        idToken: idToken,
                        refreshToken: refreshToken || ''
                    });

                    // Verify token is still valid by trying to refresh
                    if (refreshToken) {
                        try {
                            const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${this.app.config.apiKey}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({
                                    grant_type: 'refresh_token',
                                    refresh_token: refreshToken
                                })
                            });
                            if (response.ok) {
                                const data = await response.json();
                                user.stsTokenManager.accessToken = data.id_token;
                                user.stsTokenManager.refreshToken = data.refresh_token;
                                user.stsTokenManager.expirationTime = Date.now() + (parseInt(data.expires_in) * 1000);
                                // Update stored tokens
                                await this._persistUserData(user);
                                this.currentUser = user;
                                this._notifyAuthListeners(user);
                            } else {
                                // Token invalid - clear storage
                                await new Promise(resolve => chrome.storage.local.remove(['firebase_token', 'firebase_refresh_token', 'firebase_user_info'], resolve));
                                try { localStorage.removeItem('firebase_token'); localStorage.removeItem('firebase_refresh_token'); localStorage.removeItem('firebase_user_info'); } catch(_) {}
                                this._notifyAuthListeners(null);
                            }
                        } catch(e) {
                            // Network error - use cached user
                            this.currentUser = user;
                            this._notifyAuthListeners(user);
                        }
                    } else {
                        this.currentUser = user;
                        this._notifyAuthListeners(user);
                    }
                } catch(e) {
                    console.error('Error restoring auth state:', e);
                    this._notifyAuthListeners(null);
                }
            },

            async _persistUserData(user) {
                const userInfo = {
                    localId: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    displayName: user.displayName,
                    photoUrl: user.photoURL,
                    phoneNumber: user.phoneNumber
                };
                try {
                    await new Promise(resolve => chrome.storage.local.set({
                        firebase_token: user.stsTokenManager.accessToken,
                        firebase_refresh_token: user.stsTokenManager.refreshToken,
                        firebase_user_info: userInfo
                    }, resolve));
                } catch(e) {
                    try {
                        localStorage.setItem('firebase_token', user.stsTokenManager.accessToken);
                        localStorage.setItem('firebase_refresh_token', user.stsTokenManager.refreshToken);
                        localStorage.setItem('firebase_user_info', JSON.stringify(userInfo));
                    } catch(_) {}
                }
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
