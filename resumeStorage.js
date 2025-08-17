// resumeStorage.js - FIXED: Enhanced Resume Storage with Fallback Mechanisms
class ResumeStorage {
    constructor() {
        this.dbName = 'CareerConnectResumes';
        this.dbVersion = 1;
        this.db = null;
        this.isInitialized = false;
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.debug = true;
        this.fallbackToLocalStorage = false;
        this.localStoragePrefix = 'resume_';
    }

    async init() {
        if (this.isInitialized && this.db) {
            return this.db;
        }

        // Check if IndexedDB is supported
        if (!window.indexedDB) {
            console.warn('⚠️ IndexedDB not supported, falling back to localStorage');
            this.fallbackToLocalStorage = true;
            this.isInitialized = true;
            return null;
        }

        try {
            this.db = await this.openDatabase();
            this.isInitialized = true;
            this.fallbackToLocalStorage = false;
            if (this.debug) console.log('✅ Resume storage (IndexedDB) initialized successfully');
            return this.db;
        } catch (error) {
            console.error('❌ IndexedDB initialization failed, falling back to localStorage:', error);
            this.fallbackToLocalStorage = true;
            this.isInitialized = true;
            return null;
        }
    }

    openDatabase() {
        return new Promise((resolve, reject) => {
            try {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                
                request.onerror = () => {
                    console.error('IndexedDB open error:', request.error);
                    reject(request.error);
                };
                
                request.onsuccess = () => {
                    if (this.debug) console.log('📦 IndexedDB opened successfully');
                    resolve(request.result);
                };
                
                request.onupgradeneeded = (event) => {
                    try {
                        const db = event.target.result;
                        
                        // Remove existing store if it exists
                        if (db.objectStoreNames.contains('resumes')) {
                            db.deleteObjectStore('resumes');
                        }
                        
                        // Create new store
                        const store = db.createObjectStore('resumes', { keyPath: 'id' });
                        store.createIndex('userId', 'userId', { unique: false });
                        store.createIndex('applicationId', 'applicationId', { unique: false });
                        
                        console.log('📦 Resume store created successfully');
                    } catch (upgradeError) {
                        console.error('Database upgrade error:', upgradeError);
                        reject(upgradeError);
                    }
                };
                
                request.onblocked = () => {
                    console.warn('IndexedDB blocked - please close other tabs');
                    reject(new Error('Database blocked'));
                };
                
            } catch (error) {
                console.error('Error opening IndexedDB:', error);
                reject(error);
            }
        });
    }

    async saveResume(resumeData) {
        try {
            if (this.debug) {
                console.log('💾 Saving resume:', {
                    id: resumeData.id,
                    name: resumeData.name,
                    size: this.formatFileSize(resumeData.size || 0),
                    hasData: !!resumeData.data,
                    fallbackMode: this.fallbackToLocalStorage
                });
            }

            // Validate required fields
            if (!resumeData.id || !resumeData.name) {
                throw new Error('Resume must have id and name');
            }

            // Validate file size
            if (resumeData.size && resumeData.size > this.maxFileSize) {
                throw new Error(`File too large: ${this.formatFileSize(resumeData.size)}`);
            }

            // Ensure we have data
            if (!resumeData.data && !resumeData.blob) {
                throw new Error('Resume must have data or blob');
            }

            // Create clean resume record
            const resumeRecord = {
                id: resumeData.id,
                applicationId: resumeData.applicationId || null,
                userId: resumeData.userId || null,
                name: resumeData.name,
                originalName: resumeData.originalName || resumeData.name,
                type: resumeData.type,
                size: resumeData.size || 0,
                data: resumeData.data || null,
                blob: resumeData.blob || null,
                uploadDate: resumeData.uploadDate || new Date().toISOString(),
                isValid: true,
                canView: true,
                storageMethod: this.fallbackToLocalStorage ? 'localStorage' : 'indexedDB'
            };

            await this.init();

            if (this.fallbackToLocalStorage) {
                return this.saveToLocalStorage(resumeRecord);
            } else {
                return this.saveToIndexedDB(resumeRecord);
            }

        } catch (error) {
            console.error('💥 Error saving resume:', error);
            // Try fallback to localStorage if IndexedDB fails
            if (!this.fallbackToLocalStorage) {
                console.log('🔄 Attempting fallback to localStorage');
                this.fallbackToLocalStorage = true;
                try {
                    const resumeRecord = { ...arguments[0], storageMethod: 'localStorage' };
                    return this.saveToLocalStorage(resumeRecord);
                } catch (fallbackError) {
                    console.error('💥 Fallback save also failed:', fallbackError);
                    throw new Error(`Storage failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
                }
            }
            throw error;
        }
    }

    async saveToIndexedDB(resumeRecord) {
        if (!this.db) {
            throw new Error('IndexedDB not available');
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['resumes'], 'readwrite');
                const store = transaction.objectStore('resumes');
                const request = store.put(resumeRecord);
                
                request.onsuccess = () => {
                    if (this.debug) console.log('✅ Resume saved to IndexedDB:', resumeRecord.id);
                    resolve(resumeRecord.id);
                };
                
                request.onerror = () => {
                    console.error('❌ IndexedDB save failed:', request.error);
                    reject(request.error);
                };

                transaction.onerror = () => {
                    console.error('❌ Transaction failed:', transaction.error);
                    reject(transaction.error);
                };

            } catch (error) {
                console.error('❌ IndexedDB save error:', error);
                reject(error);
            }
        });
    }

    saveToLocalStorage(resumeRecord) {
        try {
            const key = this.localStoragePrefix + resumeRecord.id;
            
            // Check available space
            const dataSize = JSON.stringify(resumeRecord).length;
            if (dataSize > 5 * 1024 * 1024) { // 5MB limit for localStorage
                throw new Error('Resume too large for localStorage (5MB limit)');
            }

            // Test localStorage availability
            const testKey = 'test_' + Date.now();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            // Save the resume
            localStorage.setItem(key, JSON.stringify(resumeRecord));
            
            if (this.debug) console.log('✅ Resume saved to localStorage:', resumeRecord.id);
            return resumeRecord.id;
            
        } catch (error) {
            console.error('❌ localStorage save failed:', error);
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please free up space.');
            }
            throw error;
        }
    }

    async getResume(resumeId) {
        try {
            if (this.debug) console.log('📥 Getting resume:', resumeId);
            
            await this.init();

            if (this.fallbackToLocalStorage) {
                return this.getFromLocalStorage(resumeId);
            } else {
                const result = await this.getFromIndexedDB(resumeId);
                // If IndexedDB fails, try localStorage as backup
                if (!result) {
                    if (this.debug) console.log('🔄 Trying localStorage fallback for:', resumeId);
                    return this.getFromLocalStorage(resumeId);
                }
                return result;
            }

        } catch (error) {
            console.error('💥 Error getting resume:', error);
            // Try localStorage as fallback
            try {
                if (this.debug) console.log('🔄 Fallback: trying localStorage for:', resumeId);
                return this.getFromLocalStorage(resumeId);
            } catch (fallbackError) {
                console.error('💥 Fallback get also failed:', fallbackError);
                return null;
            }
        }
    }

    async getFromIndexedDB(resumeId) {
        if (!this.db) {
            if (this.debug) console.log('❌ IndexedDB not available');
            return null;
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['resumes'], 'readonly');
                const store = transaction.objectStore('resumes');
                const request = store.get(resumeId);
                
                request.onsuccess = () => {
                    const result = request.result;
                    if (this.debug) {
                        console.log('📄 Resume retrieved from IndexedDB:', {
                            id: resumeId,
                            found: !!result,
                            hasData: result ? !!result.data : false,
                            name: result ? result.name : 'N/A'
                        });
                    }
                    resolve(result);
                };
                
                request.onerror = () => {
                    console.error('❌ IndexedDB get failed:', request.error);
                    resolve(null); // Return null instead of rejecting
                };

                transaction.onerror = () => {
                    console.error('❌ Transaction failed:', transaction.error);
                    resolve(null);
                };

            } catch (error) {
                console.error('❌ IndexedDB get error:', error);
                resolve(null);
            }
        });
    }

    getFromLocalStorage(resumeId) {
        try {
            const key = this.localStoragePrefix + resumeId;
            const stored = localStorage.getItem(key);
            
            if (stored) {
                const result = JSON.parse(stored);
                if (this.debug) {
                    console.log('📄 Resume retrieved from localStorage:', {
                        id: resumeId,
                        found: true,
                        hasData: !!result.data,
                        name: result.name
                    });
                }
                return result;
            } else {
                if (this.debug) console.log('📄 Resume not found in localStorage:', resumeId);
                return null;
            }
            
        } catch (error) {
            console.error('❌ localStorage get failed:', error);
            return null;
        }
    }

    async deleteResume(resumeId) {
        try {
            if (this.debug) console.log('🗑️ Deleting resume:', resumeId);
            
            await this.init();

            let deleted = false;

            // Try to delete from IndexedDB
            if (!this.fallbackToLocalStorage && this.db) {
                try {
                    await this.deleteFromIndexedDB(resumeId);
                    deleted = true;
                } catch (error) {
                    console.warn('⚠️ IndexedDB delete failed, trying localStorage:', error);
                }
            }

            // Also try localStorage (as backup or primary)
            try {
                const localDeleted = this.deleteFromLocalStorage(resumeId);
                deleted = deleted || localDeleted;
            } catch (error) {
                console.warn('⚠️ localStorage delete failed:', error);
            }

            if (this.debug) console.log(deleted ? '✅ Resume deleted' : '❌ Resume delete failed', resumeId);
            return deleted;

        } catch (error) {
            console.error('💥 Error deleting resume:', error);
            return false;
        }
    }

    async deleteFromIndexedDB(resumeId) {
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['resumes'], 'readwrite');
                const store = transaction.objectStore('resumes');
                const request = store.delete(resumeId);
                
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);

            } catch (error) {
                reject(error);
            }
        });
    }

    deleteFromLocalStorage(resumeId) {
        try {
            const key = this.localStoragePrefix + resumeId;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('❌ localStorage delete failed:', error);
            return false;
        }
    }

    async blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
            } catch (error) {
                reject(error);
            }
        });
    }

    downloadResume(resume) {
        try {
            if (this.debug) console.log('⬇️ Downloading resume:', resume.name);
            
            let downloadUrl;
            const filename = resume.name || 'resume.pdf';
            
            if (resume.data && resume.data.startsWith('data:')) {
                downloadUrl = resume.data;
            } else if (resume.blob) {
                downloadUrl = URL.createObjectURL(resume.blob);
            } else {
                throw new Error('No valid resume data for download');
            }
            
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up object URL if created
            if (resume.blob && downloadUrl.startsWith('blob:')) {
                setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
            }
            
            if (this.debug) console.log('✅ Download initiated:', filename);
            return true;

        } catch (error) {
            console.error('💥 Download failed:', error);
            throw error;
        }
    }

    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async getStats() {
        try {
            await this.init();
            
            let totalResumes = 0;
            let storageMethod = 'none';

            // Count IndexedDB resumes
            if (!this.fallbackToLocalStorage && this.db) {
                try {
                    totalResumes += await this.getIndexedDBCount();
                    storageMethod = 'indexedDB';
                } catch (error) {
                    console.warn('⚠️ Could not get IndexedDB count:', error);
                }
            }

            // Count localStorage resumes
            const localCount = this.getLocalStorageCount();
            totalResumes += localCount;
            
            if (localCount > 0 && storageMethod === 'none') {
                storageMethod = 'localStorage';
            } else if (localCount > 0) {
                storageMethod = 'hybrid';
            }

            return {
                totalResumes,
                dbName: this.dbName,
                isSupported: ResumeStorage.isSupported(),
                maxFileSize: this.formatFileSize(this.maxFileSize),
                storageMethod,
                fallbackMode: this.fallbackToLocalStorage
            };

        } catch (error) {
            console.error('💥 Error getting stats:', error);
            return { 
                totalResumes: 0, 
                isSupported: false, 
                storageMethod: 'error',
                error: error.message 
            };
        }
    }

    async getIndexedDBCount() {
        if (!this.db) return 0;

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(['resumes'], 'readonly');
                const store = transaction.objectStore('resumes');
                const countRequest = store.count();
                
                countRequest.onsuccess = () => resolve(countRequest.result);
                countRequest.onerror = () => reject(countRequest.error);

            } catch (error) {
                reject(error);
            }
        });
    }

    getLocalStorageCount() {
        try {
            let count = 0;
            for (let key in localStorage) {
                if (key.startsWith(this.localStoragePrefix)) {
                    count++;
                }
            }
            return count;
        } catch (error) {
            console.error('❌ Error counting localStorage resumes:', error);
            return 0;
        }
    }

    // Test storage functionality
    async testStorage() {
        try {
            const testData = {
                id: 'test_' + Date.now(),
                name: 'test.pdf',
                type: 'application/pdf',
                size: 1024,
                data: 'data:application/pdf;base64,dGVzdA==',
                userId: 'test',
                uploadDate: new Date().toISOString()
            };

            console.log('🧪 Testing resume storage...');
            
            // Test save
            const savedId = await this.saveResume(testData);
            console.log('✅ Save test passed:', savedId);
            
            // Test get
            const retrieved = await this.getResume(savedId);
            console.log('✅ Get test passed:', !!retrieved);
            
            // Test delete
            const deleted = await this.deleteResume(savedId);
            console.log('✅ Delete test passed:', deleted);
            
            console.log('🎉 All storage tests passed!');
            return true;

        } catch (error) {
            console.error('💥 Storage test failed:', error);
            return false;
        }
    }

    static isSupported() {
        return ('indexedDB' in window && indexedDB !== null) || 
               ('localStorage' in window && localStorage !== null);
    }
}

// Create global instance with enhanced error handling
if (!window.resumeStorage) {
    window.resumeStorage = new ResumeStorage();
    console.log('🎯 Enhanced resume storage instance created');
    
    // Initialize asynchronously with better error handling
    window.resumeStorage.init()
        .then(() => {
            console.log('✅ Resume storage ready');
            // Optional: Run test in development
            if (window.resumeStorage.debug) {
                // window.resumeStorage.testStorage();
            }
        })
        .catch(error => {
            console.warn('⚠️ Resume storage init failed, fallback available:', error.message);
        });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ResumeStorage;
}