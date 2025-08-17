// FIXED: Enhanced Career Platform - Worker Dashboard with Complete Resume Upload
class WorkerDashboard {
    constructor() {
        // Check authentication first
        this.currentUser = window.AuthUtils.requireAuth();
        if (!this.currentUser || this.currentUser.userType !== 'worker') {
            window.location.href = 'login.html';
            return;
        }

        // Initialize data
        this.jobs = this.loadJobs();
        this.savedJobs = this.loadSavedJobs();
        this.appliedJobs = this.loadAppliedJobs();
        this.conversations = this.loadConversations();
        this.notifications = this.loadNotifications();
        this.chatRequests = this.loadChatRequests();
        this.interviews = this.loadInterviews();
        
        // Current state
        this.filteredJobs = this.jobs;
        this.currentPage = 1;
        this.jobsPerPage = 6;
        this.currentJobId = null;
        this.currentChatId = null;
        this.currentEmployerId = null;
        this.currentRequestId = null;
        this.currentInterviewId = null;
        this.activeTab = 'sent';
        this.uploadedResumeData = null; // Store uploaded resume data
        this.isUploading = false; // Track upload state
        
        // FIXED: Initialize with promise handling
        this.initResumeStorage().then(() => {
            console.log('✅ Resume storage initialized successfully');
        }).catch(error => {
            console.warn('⚠️ Resume storage initialization failed:', error);
        });
        
        this.init();
    }

    // FIXED: Improved Resume Storage initialization
    async initResumeStorage() {
        try {
            console.log('🚀 Initializing resume storage...');
            if (window.resumeStorage) {
                await window.resumeStorage.init();
                console.log('✅ Resume storage initialized successfully');
                
                // Test the connection
                const stats = await window.resumeStorage.getStats();
                console.log('📊 Resume storage stats:', stats);
                return true;
            } else {
                console.error('❌ Resume storage not available');
                return false;
            }
        } catch (error) {
            console.error('💥 Failed to initialize resume storage:', error);
            // Don't throw - allow app to continue with limited functionality
            return false;
        }
    }

    init() {
        this.setupAuth();
        this.setupNavigation();
        this.setupSearch();
        this.setupFilters();
        this.setupModals();
        this.setupChat();
        this.setupChatRequests();
        this.setupInterviews();
        this.setupNotifications();
        this.setupResumeUpload(); // Setup resume upload functionality
        this.renderJobs();
        this.renderChatRequests();
        this.renderInterviews();
        this.updateCounts();
        this.updateNotifications();
        this.startRealTimeUpdates();
        this.simulateJobViews();
    }

    // FIXED: Enhanced Resume Upload Setup
    setupResumeUpload() {
        console.log('🎯 Setting up enhanced resume upload...');
        
        const fileInput = document.getElementById('resume-upload');
        const fileUploadArea = document.getElementById('file-upload-area');
        const filePreview = document.getElementById('file-preview');
        const removeFileBtn = document.getElementById('remove-file-btn');
        const retryBtn = document.getElementById('retry-upload');

        if (!fileInput || !fileUploadArea || !filePreview) {
            console.error('❌ Resume upload elements not found');
            return;
        }

        // FIXED: Enhanced file input change handler
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // FIXED: Improved click handler
        fileUploadArea.addEventListener('click', (e) => {
            if (e.target !== fileInput && !this.isUploading) {
                fileInput.click();
            }
        });

        // FIXED: Enhanced drag and drop handlers
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!this.isUploading) {
                fileUploadArea.classList.add('drag-over');
            }
        });

        fileUploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.remove('drag-over');
        });

        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileUploadArea.classList.remove('drag-over');
            
            if (!this.isUploading) {
                const files = e.dataTransfer.files;
                if (files && files[0]) {
                    // FIXED: Set the files to the input for form validation
                    fileInput.files = files;
                    this.handleFileUpload(files[0]);
                }
            }
        });

        // FIXED: Remove file handler
        if (removeFileBtn) {
            removeFileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.removeUploadedFile();
            });
        }

        // FIXED: Retry upload handler
        if (retryBtn) {
            retryBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.retryFileUpload();
            });
        }

        console.log('✅ Resume upload setup completed');
    }

    // FIXED: Complete file upload handling with progress and error states
    async handleFileUpload(file) {
        if (this.isUploading) {
            console.log('⏳ Upload already in progress, ignoring new upload');
            return;
        }

        console.log('=== STARTING ENHANCED FILE UPLOAD ===');
        console.log('📄 File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            sizeFormatted: this.formatFileSize(file.size)
        });

        if (!file) {
            this.showUploadError('No file selected');
            return;
        }

        // FIXED: Strict validation with better error messages
        const validationResult = this.validateFile(file);
        if (!validationResult.isValid) {
            this.showUploadError(validationResult.message);
            return;
        }

        try {
            this.isUploading = true;
            this.showUploadProgress(0, 'Starting upload...');
            
            // Step 1: Convert file to data URL
            this.showUploadProgress(25, 'Reading file...');
            const dataUrl = await this.fileToDataUrl(file);
            
            // Step 2: Validate data URL
            this.showUploadProgress(50, 'Validating file...');
            if (!dataUrl || !dataUrl.startsWith('data:')) {
                throw new Error('Failed to process file data');
            }
            
            // Step 3: Create structured resume data
            this.showUploadProgress(75, 'Preparing upload...');
            const resumeData = this.createResumeData(file, dataUrl);
            
            // Step 4: Save to IndexedDB (optional, non-blocking)
            this.showUploadProgress(90, 'Saving backup...');
            await this.saveResumeToIndexedDB(resumeData);
            
            // Step 5: Complete upload
            this.showUploadProgress(100, 'Upload complete!');
            this.uploadedResumeData = resumeData;
            
            setTimeout(() => {
                this.showUploadSuccess();
                this.isUploading = false;
            }, 500);
            
            console.log('🎉 === ENHANCED FILE UPLOAD COMPLETED ===');

        } catch (error) {
            console.error('💥 === FILE UPLOAD FAILED ===');
            console.error('Error details:', error);
            this.isUploading = false;
            this.showUploadError(`Upload failed: ${error.message}`);
        }
    }

    // FIXED: Comprehensive file validation
    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB (consistent with HTML)
        const minSize = 1024; // 1KB minimum
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
        const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];

        // Check file type by MIME type
        if (!allowedTypes.includes(file.type)) {
            return {
                isValid: false,
                message: `Invalid file type: ${file.type}. Please upload PDF, PNG, or JPG files only.`
            };
        }

        // Double-check by file extension
        const extension = file.name.toLowerCase().split('.').pop();
        if (!allowedExtensions.includes(extension)) {
            return {
                isValid: false,
                message: `Invalid file extension: .${extension}. Please upload PDF, PNG, or JPG files only.`
            };
        }

        // Check file size
        if (file.size > maxSize) {
            return {
                isValid: false,
                message: `File too large: ${this.formatFileSize(file.size)}. Maximum allowed: ${this.formatFileSize(maxSize)}`
            };
        }

        if (file.size < minSize) {
            return {
                isValid: false,
                message: 'File appears to be corrupted or too small'
            };
        }

        // Check if file name is reasonable
        if (!file.name || file.name.length > 255) {
            return {
                isValid: false,
                message: 'Invalid file name'
            };
        }

        return { isValid: true, message: 'File is valid' };
    }

    // FIXED: Enhanced file to data URL conversion with timeout
    async fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            // Set timeout for large files
            const timeout = setTimeout(() => {
                reader.abort();
                reject(new Error('File processing timeout'));
            }, 30000); // 30 second timeout
            
            reader.onload = () => {
                clearTimeout(timeout);
                console.log('✅ File read successfully');
                resolve(reader.result);
            };
            
            reader.onerror = () => {
                clearTimeout(timeout);
                console.error('❌ Error reading file:', reader.error);
                reject(new Error('Failed to read file'));
            };
            
            reader.onabort = () => {
                clearTimeout(timeout);
                reject(new Error('File reading was aborted'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    // FIXED: Create comprehensive resume data structure WITHOUT blob property
    createResumeData(file, dataUrl) {
        const timestamp = Date.now();
        const userName = this.currentUser.name.replace(/[^a-zA-Z0-9]/g, '_');
        const extension = file.name.toLowerCase().split('.').pop();
        const structuredFileName = `Resume_${userName}_${new Date().toISOString().split('T')[0]}.${extension}`;
        
        return {
            id: `resume_${timestamp}_${this.currentUser.id}`,
            name: file.name,
            originalName: file.name,
            type: file.type,
            size: file.size,
            // ✅ FIXED: Remove blob property to prevent JSON serialization issues
            // blob: file,  // REMOVED - This was causing the serialization error
            data: dataUrl,  // This contains all the file data needed
            savedFileName: structuredFileName,
            uploadDate: new Date().toISOString(),
            userId: this.currentUser.id,
            // Enhanced metadata for employer compatibility
            isValid: true,
            canView: true,
            hasData: true,
            fileExtension: extension,
            sizeFormatted: this.formatFileSize(file.size),
            mimeType: file.type,
            browserSupported: true,
            uploadMethod: 'enhanced_file_upload',
            checksum: this.generateSimpleChecksum(dataUrl),
            // Additional display info
            uploadTimestamp: timestamp,
            userAgent: navigator.userAgent.substring(0, 100)
        };
    }

    // FIXED: Simple checksum for data integrity
    generateSimpleChecksum(data) {
        let hash = 0;
        if (data.length === 0) return hash;
        for (let i = 0; i < Math.min(data.length, 1000); i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
    }

    // FIXED: Save to IndexedDB with error handling
    async saveResumeToIndexedDB(resumeData) {
        try {
            if (window.resumeStorage) {
                await window.resumeStorage.init();
                await window.resumeStorage.saveResume(resumeData);
                console.log('✅ Resume saved to IndexedDB');
                return true;
            }
        } catch (error) {
            console.warn('⚠️ IndexedDB save failed (non-critical):', error);
        }
        return false;
    }

    // FIXED: Show upload progress
    showUploadProgress(percentage, message) {
        const uploadArea = document.getElementById('file-upload-area');
        const progressContainer = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const errorContainer = document.getElementById('upload-error');
        const previewContainer = document.getElementById('file-preview');

        if (uploadArea) uploadArea.style.display = 'none';
        if (errorContainer) errorContainer.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'none';
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
            if (progressFill) progressFill.style.width = `${percentage}%`;
            if (progressText) progressText.textContent = message;
        }
    }

    // FIXED: Show upload success
    showUploadSuccess() {
        const uploadArea = document.getElementById('file-upload-area');
        const progressContainer = document.getElementById('upload-progress');
        const errorContainer = document.getElementById('upload-error');
        const previewContainer = document.getElementById('file-preview');
        const fileName = document.getElementById('file-name');
        const fileSize = document.getElementById('file-size');
        const fileStatus = document.getElementById('file-status');
        const fileIcon = document.getElementById('file-icon');

        if (uploadArea) uploadArea.style.display = 'none';
        if (progressContainer) progressContainer.style.display = 'none';
        if (errorContainer) errorContainer.style.display = 'none';

        if (this.uploadedResumeData) {
            if (fileName) fileName.textContent = this.uploadedResumeData.name;
            if (fileSize) fileSize.textContent = this.formatFileSize(this.uploadedResumeData.size);
            if (fileStatus) {
                fileStatus.innerHTML = '<i class="fas fa-check-circle"></i> Ready to submit';
                fileStatus.className = 'file-status success';
            }
            
            // Set appropriate icon
            if (fileIcon) {
                if (this.uploadedResumeData.type === 'application/pdf') {
                    fileIcon.className = 'fas fa-file-pdf file-icon';
                    fileIcon.style.color = '#dc3545';
                } else if (this.uploadedResumeData.type.startsWith('image/')) {
                    fileIcon.className = 'fas fa-file-image file-icon';
                    fileIcon.style.color = '#28a745';
                }
            }
        }

        if (previewContainer) previewContainer.style.display = 'block';
        this.showAlert('✅ Resume uploaded successfully!', 'success');
    }

    // FIXED: Show upload error
    showUploadError(message) {
        const uploadArea = document.getElementById('file-upload-area');
        const progressContainer = document.getElementById('upload-progress');
        const errorContainer = document.getElementById('upload-error');
        const previewContainer = document.getElementById('file-preview');
        const errorMessage = document.getElementById('error-message');

        if (uploadArea) uploadArea.style.display = 'block';
        if (progressContainer) progressContainer.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'none';

        if (errorContainer) {
            errorContainer.style.display = 'block';
            if (errorMessage) errorMessage.textContent = message;
        }

        this.showAlert(message, 'error');
        this.removeUploadedFile();
    }

    // FIXED: Retry file upload
    retryFileUpload() {
        const fileInput = document.getElementById('resume-upload');
        if (fileInput && fileInput.files && fileInput.files[0]) {
            this.handleFileUpload(fileInput.files[0]);
        } else {
            this.showAlert('Please select a file to upload', 'warning');
        }
    }

    // FIXED: Remove uploaded file
    removeUploadedFile() {
        console.log('🗑️ Removing uploaded file...');
        this.uploadedResumeData = null;
        this.isUploading = false;
        
        const fileInput = document.getElementById('resume-upload');
        const uploadArea = document.getElementById('file-upload-area');
        const progressContainer = document.getElementById('upload-progress');
        const errorContainer = document.getElementById('upload-error');
        const previewContainer = document.getElementById('file-preview');

        if (fileInput) fileInput.value = '';
        if (uploadArea) uploadArea.style.display = 'block';
        if (progressContainer) progressContainer.style.display = 'none';
        if (errorContainer) errorContainer.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'none';
    }

    // FIXED: Format file size
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // FIXED: Enhanced application submission
    async submitApplication() {
        console.log('🚀 === STARTING ENHANCED APPLICATION SUBMISSION ===');
        
        const applicantName = document.getElementById('applicant-name').value.trim();
        const applicantEmail = document.getElementById('applicant-email').value.trim();
        const applicantPhone = document.getElementById('applicant-phone').value.trim();
        const coverLetter = document.getElementById('cover-letter').value.trim();
        const submitButton = document.getElementById('submit-application');

        // FIXED: Comprehensive validation
        const validationResult = this.validateApplicationForm(applicantName, applicantEmail);
        if (!validationResult.isValid) {
            this.showAlert(validationResult.message, 'error');
            return;
        }

        // FIXED: Resume validation
        if (!this.uploadedResumeData) {
            this.showAlert('Please upload your resume before submitting', 'error');
            return;
        }

        if (!this.uploadedResumeData.data || !this.uploadedResumeData.data.startsWith('data:')) {
            this.showAlert('Resume data is corrupted. Please re-upload your resume.', 'error');
            return;
        }

        // FIXED: Check storage capacity with better testing
        const estimatedSize = this.calculateApplicationSize();
        console.log('📊 Estimated application size:', this.formatFileSize(estimatedSize));
        
        if (!this.checkStorageCapacity(estimatedSize)) {
            this.showAlert('Browser storage is full. Please free up space and try again.', 'error');
            return;
        }

        try {
            // Disable submit button
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
            }

            const applicationId = `app_${Date.now()}_${this.currentUser.id}`;
            const resumeId = this.uploadedResumeData.id;
            
            console.log('📝 Creating application:', applicationId);
            console.log('📄 Resume ID:', resumeId);

            // FIXED: Create comprehensive application with resume
            const application = this.createApplicationData(
                applicationId, 
                applicantName, 
                applicantEmail, 
                applicantPhone, 
                coverLetter
            );

            console.log('📋 Application created successfully:', {
                applicationId: application.id,
                resumeId: resumeId,
                resumeName: application.resume.name,
                resumeSize: application.resume.sizeFormatted,
                hasResumeData: !!application.resume.data
            });

            // FIXED: Save with proper error handling
            const saveResult = await this.saveApplication(application);
            if (!saveResult.success) {
                throw new Error(saveResult.error);
            }

            // Send notification to employer
            this.notifyEmployer(application);
            
            // Success cleanup
            this.handleSubmissionSuccess();

            console.log('🎉 === ENHANCED APPLICATION SUBMISSION COMPLETED ===');

        } catch (error) {
            console.error('💥 === APPLICATION SUBMISSION FAILED ===');
            console.error('Error details:', error);
            this.showAlert(`❌ Error submitting application: ${error.message}`, 'error');
        } finally {
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
            }
        }
    }

    // FIXED: Calculate application size more accurately
    calculateApplicationSize() {
        if (!this.uploadedResumeData) return 0;
        
        const applicationData = {
            // Basic application data
            basic: 1024, // Estimated 1KB for form data
            resume: this.uploadedResumeData.data ? this.uploadedResumeData.data.length : 0,
            metadata: JSON.stringify(this.uploadedResumeData).length
        };
        
        return applicationData.basic + applicationData.resume + applicationData.metadata;
    }

    // FIXED: Validate application form
    validateApplicationForm(name, email) {
        if (!name) {
            return { isValid: false, message: 'Please enter your full name' };
        }

        if (name.length < 2) {
            return { isValid: false, message: 'Name must be at least 2 characters long' };
        }

        if (!email) {
            return { isValid: false, message: 'Please enter your email address' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'Please enter a valid email address' };
        }

        return { isValid: true, message: 'Form is valid' };
    }

    // FIXED: Better storage capacity check
    checkStorageCapacity(estimatedSize) {
        try {
            // Create a more realistic test
            const testKey = `test_storage_${Date.now()}`;
            const testSize = Math.min(estimatedSize, 1024 * 1024); // Test up to 1MB
            const testData = JSON.stringify({
                test: 'x'.repeat(testSize / 2),
                metadata: { size: testSize, timestamp: Date.now() }
            });
            
            localStorage.setItem(testKey, testData);
            localStorage.removeItem(testKey);
            
            console.log('✅ Storage capacity test passed');
            return true;
            
        } catch (storageError) {
            console.error('❌ Storage capacity test failed:', storageError);
            if (storageError.name === 'QuotaExceededError') {
                console.error('💾 Storage quota exceeded');
            }
            return false;
        }
    }

    // FIXED: Create comprehensive application data
    createApplicationData(applicationId, name, email, phone, coverLetter) {
        return {
            id: applicationId,
            jobId: this.currentJobId,
            userId: this.currentUser.id,
            applicantName: name,
            applicantEmail: email,
            applicantPhone: phone,
            coverLetter: coverLetter,
            applicationDate: new Date().toISOString(),
            status: 'submitted',
            // FIXED: Enhanced resume data for employer compatibility
            resume: {
                id: this.uploadedResumeData.id,
                name: this.uploadedResumeData.name,
                originalName: this.uploadedResumeData.originalName,
                type: this.uploadedResumeData.type,
                size: this.uploadedResumeData.size,
                data: this.uploadedResumeData.data, // Critical for employer viewing
                savedFileName: this.uploadedResumeData.savedFileName,
                uploadDate: this.uploadedResumeData.uploadDate,
                userId: this.currentUser.id,
                applicationId: applicationId,
                // Enhanced metadata
                hasData: true,
                canView: true,
                isValid: true,
                fileExtension: this.uploadedResumeData.fileExtension,
                mimeType: this.uploadedResumeData.type,
                sizeFormatted: this.uploadedResumeData.sizeFormatted,
                browserSupported: true,
                uploadMethod: 'enhanced_file_upload',
                checksum: this.uploadedResumeData.checksum,
                // Additional compatibility fields
                inIndexedDB: true,
                dataIntegrity: 'verified'
            }
        };
    }

    // FIXED: Save application with proper error handling and resume storage
    async saveApplication(application) {
        try {
            console.log('💾 Saving application with resume...');
            
            // FIXED: First save to resume storage system
            if (application.resume && window.resumeStorage) {
                try {
                    await window.resumeStorage.init();
                    await window.resumeStorage.saveResume(application.resume);
                    console.log('✅ Resume saved to resume storage');
                } catch (resumeError) {
                    console.warn('⚠️ Resume storage failed (non-critical):', resumeError);
                    // Continue with localStorage save
                }
            }
            
            // Save to user's applied jobs
            this.appliedJobs.push(application);
            const userSaveSuccess = this.saveAppliedJobs();
            
            if (!userSaveSuccess) {
                throw new Error('Failed to save to user applications');
            }

            // Save to global applicants
            const globalSaveSuccess = this.saveToGlobalApplicants(application);
            
            if (!globalSaveSuccess) {
                throw new Error('Failed to save to global applications');
            }

            return { success: true, error: null };
            
        } catch (error) {
            console.error('❌ Save application error:', error);
            return { success: false, error: error.message };
        }
    }

    // FIXED: Notify employer
    notifyEmployer(application) {
        const job = this.jobs.find(j => j.id === this.currentJobId);
        if (job) {
            this.sendNotificationToUser(job.employerId, {
                type: 'application',
                title: 'New Job Application',
                message: `${application.applicantName} applied for ${job.title} with resume attached`,
                data: { 
                    jobId: job.id, 
                    applicationId: application.id,
                    hasResume: true,
                    resumeName: application.resume.name,
                    resumeSize: application.resume.sizeFormatted
                }
            });
        }
    }

    // FIXED: Handle submission success
    handleSubmissionSuccess() {
        document.getElementById('application-modal').classList.remove('show');
        this.showSuccessMessage('✅ Application submitted successfully with resume attached!');
        
        // Clear form and reset state
        const form = document.getElementById('application-form');
        if (form) form.reset();
        
        this.uploadedResumeData = null;
        this.removeUploadedFile();
        this.updateCounts();
        
        // Refresh current view
        const currentSection = document.querySelector('.section.active').id;
        if (currentSection === 'jobs') {
            this.renderJobs();
        } else if (currentSection === 'applied') {
            this.renderAppliedJobs();
        }
    }

    // FIXED: Enhanced save methods
    saveAppliedJobs() {
        try {
            const data = JSON.stringify(this.appliedJobs);
            localStorage.setItem(`careerPlatformAppliedJobs_${this.currentUser.id}`, data);
            console.log('✅ Applied jobs saved successfully');
            return true;
        } catch (error) {
            console.error('❌ Error saving applied jobs:', error);
            if (error.name === 'QuotaExceededError') {
                console.error('💾 Storage quota exceeded for applied jobs');
            }
            return false;
        }
    }

    // FIXED: Save to global applicants with better error handling
    saveToGlobalApplicants(application) {
        try {
            const applicants = this.loadApplicants();
            applicants.push(application);
            
            // FIXED: Test storage before saving
            const applicantsData = JSON.stringify(applicants);
            
            // Test if we can store this data
            const testKey = 'test_global_applicants';
            localStorage.setItem(testKey, applicantsData);
            localStorage.removeItem(testKey);
            
            // If test passed, do the actual save
            localStorage.setItem('careerPlatformApplicants', applicantsData);
            console.log(`✅ Application saved to global list. Total: ${applicants.length}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error saving to global applicants:', error);
            if (error.name === 'QuotaExceededError') {
                console.error('💾 Storage quota exceeded for global applicants');
                // Try to free up space by removing old data
                try {
                    this.cleanupOldApplications();
                    // Retry save after cleanup
                    const applicants = this.loadApplicants();
                    applicants.push(application);
                    localStorage.setItem('careerPlatformApplicants', JSON.stringify(applicants));
                    console.log('✅ Application saved after cleanup');
                    return true;
                } catch (retryError) {
                    console.error('❌ Retry save also failed:', retryError);
                }
            }
            return false;
        }
    }

    // FIXED: Cleanup old applications to free space
    cleanupOldApplications() {
        try {
            const applicants = this.loadApplicants();
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 6); // Keep only last 6 months
            
            const filteredApplicants = applicants.filter(app => 
                new Date(app.applicationDate) > cutoffDate
            );
            
            if (filteredApplicants.length < applicants.length) {
                localStorage.setItem('careerPlatformApplicants', JSON.stringify(filteredApplicants));
                console.log(`🧹 Cleaned up ${applicants.length - filteredApplicants.length} old applications`);
            }
        } catch (error) {
            console.error('❌ Error cleaning up applications:', error);
        }
    }

    // Authentication & User Management
    setupAuth() {
        const userName = document.getElementById('user-name');
        const userInitials = document.getElementById('user-initials');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName) userName.textContent = this.currentUser.name;
        if (userInitials) userInitials.textContent = this.currentUser.avatar.initials;
        if (userAvatar) userAvatar.style.background = this.currentUser.avatar.color;

        const userProfile = document.getElementById('user-profile');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        
        if (userProfile && userMenuDropdown) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('show');
            });
        }

        // Profile link navigation
        const profileLink = document.querySelector('a.menu-item[href="profile.html"]');
        if (profileLink) {
            profileLink.addEventListener('click', (e) => {
                e.preventDefault();
                sessionStorage.removeItem('viewingProfileId');
                sessionStorage.removeItem('profileViewMode');
                window.location.href = 'profile.html';
            });
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        document.addEventListener('click', () => {
            if (userMenuDropdown) {
                userMenuDropdown.classList.remove('show');
            }
        });
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            window.AuthUtils.logout();
        }
    }

    // View company profile method
    viewCompanyProfile(employerId) {
        console.log(`Viewing company profile for employer ID: ${employerId}`);
        
        const employer = window.AuthUtils.getAllUsers().find(u => u.id === employerId && u.userType === 'employer');
        if (!employer) {
            this.showAlert('Company profile not found', 'error');
            console.error(`Employer not found or not an employer type for ID: ${employerId}`);
            return;
        }
        
        console.log(`Found employer: ${employer.name} (${employer.userType})`);
        
        sessionStorage.removeItem('viewingProfileId');
        sessionStorage.removeItem('profileViewMode');
        
        sessionStorage.setItem('viewingProfileId', employerId);
        sessionStorage.setItem('profileViewMode', 'view');
        
        console.log(`Stored viewing profile ID: ${employerId} for employer: ${employer.name}`);
        
        window.location.href = 'profile.html';
    }

    // Navigation
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        const actionButtons = document.querySelectorAll('button[data-section]');
        
        [...navLinks, ...actionButtons].forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-section');
                this.showSection(targetSection);
                
                navLinks.forEach(nl => nl.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-link[data-section="${targetSection}"]`);
                if (activeLink) activeLink.classList.add('active');
            });
        });
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        switch(sectionId) {
            case 'jobs':
                this.renderJobs();
                break;
            case 'saved':
                this.renderSavedJobs();
                break;
            case 'applied':
                this.renderAppliedJobs();
                break;
            case 'messages':
                this.renderConversations();
                break;
            case 'chat-requests':
                this.renderChatRequests();
                break;
            case 'interviews':
                this.renderInterviews();
                break;
        }
    }

    // Search and Filters
    setupSearch() {
        const searchInput = document.getElementById('job-search');
        const locationInput = document.getElementById('location-search');
        const searchBtn = document.getElementById('search-btn');

        const performSearch = () => {
            this.filterJobs();
        };

        if (searchBtn) searchBtn.addEventListener('click', performSearch);
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }
        if (locationInput) {
            locationInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') performSearch();
            });
        }
    }

    setupFilters() {
        const jobTypeFilter = document.getElementById('job-type-filter');
        const experienceFilter = document.getElementById('experience-filter');
        const sortFilter = document.getElementById('sort-filter');
        const clearFiltersBtn = document.getElementById('clear-filters');

        [jobTypeFilter, experienceFilter, sortFilter].forEach(filter => {
            if (filter) {
                filter.addEventListener('change', () => this.filterJobs());
            }
        });

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                if (document.getElementById('job-search')) document.getElementById('job-search').value = '';
                if (document.getElementById('location-search')) document.getElementById('location-search').value = '';
                if (jobTypeFilter) jobTypeFilter.value = '';
                if (experienceFilter) experienceFilter.value = '';
                if (sortFilter) sortFilter.value = 'newest';
                this.filterJobs();
            });
        }
    }

    filterJobs() {
        const searchInput = document.getElementById('job-search');
        const locationInput = document.getElementById('location-search');
        const jobTypeFilter = document.getElementById('job-type-filter');
        const experienceFilter = document.getElementById('experience-filter');
        const sortFilter = document.getElementById('sort-filter');

        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const locationTerm = locationInput ? locationInput.value.toLowerCase() : '';
        const jobTypeValue = jobTypeFilter ? jobTypeFilter.value : '';
        const experienceValue = experienceFilter ? experienceFilter.value : '';
        const sortValue = sortFilter ? sortFilter.value : 'newest';

        let filtered = this.jobs.filter(job => {
            const matchesSearch = !searchTerm || 
                job.title.toLowerCase().includes(searchTerm) ||
                job.company.toLowerCase().includes(searchTerm) ||
                job.description.toLowerCase().includes(searchTerm);
            
            const matchesLocation = !locationTerm || 
                job.location.toLowerCase().includes(locationTerm);
            
            const matchesJobType = !jobTypeValue || job.jobType === jobTypeValue;
            const matchesExperience = !experienceValue || job.experienceLevel === experienceValue;
            const isActive = job.isActive !== false;

            return matchesSearch && matchesLocation && matchesJobType && matchesExperience && isActive;
        });

        // Sort results
        switch(sortValue) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.datePosted) - new Date(b.datePosted));
                break;
            case 'company':
                filtered.sort((a, b) => a.company.localeCompare(b.company));
                break;
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        this.filteredJobs = filtered;
        this.currentPage = 1;
        this.renderJobs();
    }

    // Job Rendering
    renderJobs() {
        const container = document.getElementById('jobs-container');
        const jobCount = document.getElementById('job-count');
        const loadMoreContainer = document.getElementById('load-more-container');
        const noJobsMessage = document.getElementById('no-jobs-message');

        if (jobCount) jobCount.textContent = this.filteredJobs.length;

        if (this.filteredJobs.length === 0) {
            container.innerHTML = '';
            if (noJobsMessage) container.appendChild(noJobsMessage);
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
            return;
        }

        const startIndex = 0;
        const endIndex = this.currentPage * this.jobsPerPage;
        const jobsToShow = this.filteredJobs.slice(startIndex, endIndex);

        const jobsHTML = jobsToShow.map(job => this.createJobCardHTML(job)).join('');
        container.innerHTML = jobsHTML;

        // Show/hide load more button
        if (loadMoreContainer) {
            if (endIndex < this.filteredJobs.length) {
                loadMoreContainer.style.display = 'block';
                this.setupLoadMore();
            } else {
                loadMoreContainer.style.display = 'none';
            }
        }

        this.setupJobCardInteractions();
    }

    createJobCardHTML(job) {
        const formattedDate = new Date(job.datePosted).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const isSaved = this.savedJobs.some(saved => saved.id === job.id);
        const isApplied = this.appliedJobs.some(applied => applied.jobId === job.id);

        const employer = window.AuthUtils.getAllUsers().find(u => u.id === job.employerId);
        const employerName = employer ? employer.name : job.company;
        const employerInitials = employer ? employer.avatar.initials : job.company.charAt(0);
        const employerColor = employer ? employer.avatar.color : '#667eea';

        return `
            <div class="job-card" data-job-id="${job.id}">
                <div class="job-header">
                    <div class="job-info">
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                        <div class="job-employer-info">
                             <div class="employer-avatar" style="background: ${employerColor}">
                                  <span>${employerInitials}</span>
                             </div>
                                <span>Posted by ${employerName}</span>
                                     <button class="company-profile-btn" data-employer-id="${job.employerId}" title="View Company Profile">
                                  <i class="fas fa-building"></i>
                                 </button>
                            </div>
                    </div>
                    <div class="job-actions">
                        <button class="job-action-btn save-job ${isSaved ? 'saved' : ''}" 
                                data-job-id="${job.id}" title="${isSaved ? 'Remove from saved' : 'Save job'}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="job-action-btn apply-job ${isApplied ? 'applied' : ''}" 
                                data-job-id="${job.id}" title="${isApplied ? 'Already applied' : 'Quick apply'}"
                                ${isApplied ? 'disabled' : ''}>
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>

                <div class="job-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-briefcase"></i> ${this.formatJobType(job.jobType)}</span>
                    <span><i class="fas fa-chart-line"></i> ${this.formatExperience(job.experienceLevel)}</span>
                    <span class="job-salary"><i class="fas fa-dollar-sign"></i> ${job.salary}</span>
                </div>

                <div class="job-description">
                    ${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}
                </div>

                <div class="job-footer">
                    <span class="job-date">Posted ${formattedDate}</span>
                    <div class="job-cta">
                        <button class="btn btn-outline view-job" data-job-id="${job.id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                        <button class="btn btn-primary apply-job-btn" data-job-id="${job.id}"
                                ${isApplied ? 'disabled' : ''}>
                            <i class="fas fa-paper-plane"></i> ${isApplied ? 'Applied' : 'Apply Now'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    setupJobCardInteractions() {
        // View job details
        document.querySelectorAll('.view-job, .job-card').forEach(element => {
            element.addEventListener('click', (e) => {
                if (e.target.closest('.job-actions') || e.target.closest('.job-cta') || e.target.closest('.company-profile-btn')) return;
                
                const jobId = element.getAttribute('data-job-id') || 
                             element.closest('.job-card').getAttribute('data-job-id');
                this.showJobDetails(jobId);
            });
        });

        // Save/unsave job
        document.querySelectorAll('.save-job').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const jobId = btn.getAttribute('data-job-id');
                this.toggleSaveJob(jobId);
            });
        });

        // Apply to job
        document.querySelectorAll('.apply-job-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.disabled) return;
                const jobId = btn.getAttribute('data-job-id');
                this.showApplicationModal(jobId);
            });
        });

        // Quick apply
        document.querySelectorAll('.apply-job').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (btn.disabled) return;
                const jobId = btn.getAttribute('data-job-id');
                this.showApplicationModal(jobId);
            });
        });

        // Company profile button
        document.querySelectorAll('.company-profile-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const employerId = btn.getAttribute('data-employer-id');
                
                if (!employerId) {
                    const jobCard = btn.closest('.job-card');
                    const jobId = jobCard.getAttribute('data-job-id');
                    const job = this.jobs.find(j => j.id === jobId);
                    if (job) {
                        this.viewCompanyProfile(job.employerId);
                    } else {
                        this.showAlert('Unable to find company information', 'error');
                    }
                    return;
                }
                
                this.currentEmployerId = employerId;
                this.viewCompanyProfile(employerId);
            });
        });
    }

    // Job Actions
    toggleSaveJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        const existingIndex = this.savedJobs.findIndex(saved => saved.id === jobId);
        
        if (existingIndex > -1) {
            this.savedJobs.splice(existingIndex, 1);
            this.showSuccessMessage('Job removed from saved jobs');
        } else {
            this.savedJobs.push({...job, savedDate: new Date().toISOString()});
            this.showSuccessMessage('Job saved successfully!');
        }

        this.saveSavedJobs();
        this.updateCounts();
        
        const currentSection = document.querySelector('.section.active').id;
        if (currentSection === 'jobs') {
            this.renderJobs();
        } else if (currentSection === 'saved') {
            this.renderSavedJobs();
        }
    }

    showJobDetails(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        job.views = (job.views || 0) + 1;
        this.saveJobs();

        this.currentJobId = jobId;
        this.currentEmployerId = job.employerId;
        
        document.getElementById('modal-job-title').textContent = job.title;
        document.getElementById('modal-company').textContent = job.company;
        
        const metaContainer = document.getElementById('modal-job-meta');
        metaContainer.innerHTML = `
            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
            <span><i class="fas fa-briefcase"></i> ${this.formatJobType(job.jobType)}</span>
            <span><i class="fas fa-chart-line"></i> ${this.formatExperience(job.experienceLevel)}</span>
            <span class="job-salary"><i class="fas fa-dollar-sign"></i> ${job.salary}</span>
        `;

        document.getElementById('modal-description').textContent = job.description;
        
        const requirementsSection = document.getElementById('modal-requirements-section');
        if (job.requirements) {
            requirementsSection.style.display = 'block';
            document.getElementById('modal-requirements').textContent = job.requirements;
        } else {
            requirementsSection.style.display = 'none';
        }

        document.getElementById('modal-contact').innerHTML = `
            <p><i class="fas fa-envelope"></i> ${job.email}</p>
        `;

        const isSaved = this.savedJobs.some(saved => saved.id === jobId);
        const isApplied = this.appliedJobs.some(applied => applied.jobId === jobId);
        
        const saveBtn = document.getElementById('modal-save-btn');
        const applyBtn = document.getElementById('modal-apply-btn');
        const chatBtn = document.getElementById('modal-chat-btn');
        
        if (saveBtn) {
            saveBtn.innerHTML = `<i class="fas fa-heart"></i> ${isSaved ? 'Remove from Saved' : 'Save Job'}`;
            saveBtn.className = `btn ${isSaved ? 'btn-secondary' : 'btn-secondary'}`;
        }
        
        if (applyBtn) {
            if (isApplied) {
                applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied';
                applyBtn.disabled = true;
                applyBtn.className = 'btn btn-secondary';
            } else {
                applyBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Apply Now';
                applyBtn.disabled = false;
                applyBtn.className = 'btn btn-primary';
            }
        }

        if (chatBtn) {
            const existingConversation = this.conversations.find(conv => 
                conv.participants.includes(this.currentUser.id) && 
                conv.participants.includes(job.employerId)
            );

            if (existingConversation) {
                chatBtn.innerHTML = '<i class="fas fa-comments"></i> Continue Chat';
            } else {
                chatBtn.innerHTML = '<i class="fas fa-comments"></i> Request Chat';
            }
        }

        document.getElementById('job-modal').classList.add('show');
    }

    // Show Application Modal with Resume Upload
    showApplicationModal(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        this.currentJobId = jobId;
        
        // Clear any previous resume data
        this.removeUploadedFile();
        
        document.getElementById('application-modal').classList.add('show');
        
        // Reset form
        const form = document.getElementById('application-form');
        if (form) form.reset();
        
        // Pre-fill user data
        const nameField = document.getElementById('applicant-name');
        const emailField = document.getElementById('applicant-email');
        
        if (nameField) nameField.value = this.currentUser.name;
        if (emailField) emailField.value = this.currentUser.email || '';
    }

    // Modals Setup
    setupModals() {
        // Job detail modal
        const jobModal = document.getElementById('job-modal');
        const closeJobModal = document.getElementById('close-modal');
        const saveJobBtn = document.getElementById('modal-save-btn');
        const applyJobBtn = document.getElementById('modal-apply-btn');
        const chatJobBtn = document.getElementById('modal-chat-btn');

        if (closeJobModal) {
            closeJobModal.addEventListener('click', () => {
                jobModal.classList.remove('show');
            });
        }

        if (saveJobBtn) {
            saveJobBtn.addEventListener('click', () => {
                this.toggleSaveJob(this.currentJobId);
                setTimeout(() => this.showJobDetails(this.currentJobId), 100);
            });
        }

        if (applyJobBtn) {
            applyJobBtn.addEventListener('click', () => {
                if (!applyJobBtn.disabled) {
                    jobModal.classList.remove('show');
                    this.showApplicationModal(this.currentJobId);
                }
            });
        }

        if (chatJobBtn) {
            chatJobBtn.addEventListener('click', () => {
                this.requestChatWithEmployer();
            });
        }

        // Application modal
        const applicationModal = document.getElementById('application-modal');
        const closeApplicationModal = document.getElementById('close-application-modal');
        const cancelApplication = document.getElementById('cancel-application');
        const applicationForm = document.getElementById('application-form');

        if (closeApplicationModal) {
            closeApplicationModal.addEventListener('click', () => {
                applicationModal.classList.remove('show');
                this.removeUploadedFile(); // Clean up on close
            });
        }

        if (cancelApplication) {
            cancelApplication.addEventListener('click', () => {
                applicationModal.classList.remove('show');
                this.removeUploadedFile(); // Clean up on cancel
            });
        }

        if (applicationForm) {
            applicationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitApplication();
            });
        }

        // Success modal
        const successModal = document.getElementById('success-modal');
        const closeSuccessModal = document.getElementById('close-success-modal');

        if (closeSuccessModal) {
            closeSuccessModal.addEventListener('click', () => {
                successModal.classList.remove('show');
            });
        }

        [jobModal, applicationModal, successModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('show');
                        if (modal === applicationModal) {
                            this.removeUploadedFile(); // Clean up on outside click
                        }
                    }
                });
            }
        });
    }

    // Chat System
    setupChat() {
        this.setupChatRequestModal();
    }

    setupChatRequestModal() {
        const modal = document.getElementById('chat-request-modal');
        const closeBtn = document.getElementById('close-chat-request');
        const cancelBtn = document.getElementById('cancel-chat-request');
        const form = document.getElementById('chat-request-form');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendChatRequest();
            });
        }
    }

    requestChatWithEmployer() {
        const job = this.jobs.find(j => j.id === this.currentJobId);
        if (!job) return;

        const existingConversation = this.conversations.find(conv => 
            conv.participants.includes(this.currentUser.id) && 
            conv.participants.includes(job.employerId)
        );

        if (existingConversation) {
            this.showSection('messages');
            this.openConversation(existingConversation.id);
            document.getElementById('job-modal').classList.remove('show');
            return;
        }

        document.getElementById('job-modal').classList.remove('show');
        document.getElementById('chat-request-modal').classList.add('show');
        
        const defaultMessage = `Hi, I'm interested in the ${job.title} position at ${job.company} and would like to discuss it further with you.`;
        const messageField = document.getElementById('chat-message');
        if (messageField) {
            messageField.value = defaultMessage;
        }
    }

    sendChatRequest() {
        const chatMessage = document.getElementById('chat-message');
        const message = chatMessage ? chatMessage.value.trim() : '';
        const job = this.jobs.find(j => j.id === this.currentJobId);
        
        if (!message || !job) return;

        const chatRequest = {
            id: Date.now().toString(),
            fromUserId: this.currentUser.id,
            toUserId: job.employerId,
            jobId: job.id,
            message: message,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.chatRequests.push(chatRequest);
        this.saveChatRequests();

        this.sendNotificationToUser(job.employerId, {
            type: 'chat_request',
            title: 'New Chat Request',
            message: `${this.currentUser.name} wants to chat about ${job.title}`,
            data: { requestId: chatRequest.id, jobId: job.id }
        });

        document.getElementById('chat-request-modal').classList.remove('show');
        this.showSuccessMessage('Chat request sent! You will be notified when the employer responds.');
        this.renderChatRequests();
    }

    // Chat Requests Management
    setupChatRequests() {
        const tabBtns = document.querySelectorAll('.chat-requests-tabs .tab-btn');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchChatRequestsTab(tab);
            });
        });

        this.setupEmployerChatRequestModal();
    }

    switchChatRequestsTab(tab) {
        this.activeTab = tab;
        
        document.querySelectorAll('.chat-requests-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        
        document.querySelectorAll('.requests-tab').forEach(tabContent => {
            tabContent.classList.remove('active');
        });
        document.getElementById(`${tab}-requests`).classList.add('active');
        
        this.renderChatRequests();
    }

    renderChatRequests() {
        const sentList = document.getElementById('sent-requests-list');
        const receivedList = document.getElementById('received-requests-list');
        
        const sentRequests = this.chatRequests.filter(req => 
            req.fromUserId === this.currentUser.id
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const receivedRequests = this.chatRequests.filter(req => 
            req.toUserId === this.currentUser.id
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        document.getElementById('sent-count').textContent = sentRequests.length;
        document.getElementById('received-count').textContent = receivedRequests.length;
        
        const pendingReceived = receivedRequests.filter(req => req.status === 'pending').length;
        const chatRequestsBadge = document.getElementById('chat-requests-badge');
        if (pendingReceived > 0) {
            chatRequestsBadge.textContent = pendingReceived;
            chatRequestsBadge.style.display = 'block';
        } else {
            chatRequestsBadge.style.display = 'none';
        }
        
        this.renderRequestsList(sentList, sentRequests, 'sent');
        this.renderRequestsList(receivedList, receivedRequests, 'received');
    }

    renderRequestsList(container, requests, type) {
        if (requests.length === 0) {
            container.innerHTML = `
                <div class="no-requests">
                    <i class="fas fa-${type === 'sent' ? 'paper-plane' : 'inbox'}"></i>
                    <h3>No ${type} chat requests</h3>
                    <p>${type === 'sent' ? 'Start browsing jobs and request to chat with employers' : 'Employers interested in your profile will send chat requests here'}</p>
                </div>
            `;
            return;
        }

        const requestsHTML = requests.map(request => this.createRequestHTML(request, type)).join('');
        container.innerHTML = requestsHTML;

        this.setupRequestInteractions();
    }

    createRequestHTML(request, type) {
        const isReceived = type === 'received';
        const otherUserId = isReceived ? request.fromUserId : request.toUserId;
        const otherUser = window.AuthUtils.getAllUsers().find(u => u.id === otherUserId);
        const job = this.jobs.find(j => j.id === request.jobId);
        
        if (!otherUser || !job) return '';

        const timeAgo = this.timeAgo(request.createdAt);
        const statusClass = `status-${request.status}`;
        
        return `
            <div class="request-item ${statusClass}" data-request-id="${request.id}">
                <div class="request-header">
                    <div class="request-user">
                        <div class="request-avatar" style="background: ${otherUser.avatar.color}">
                            <span>${otherUser.avatar.initials}</span>
                        </div>
                        <div class="request-info">
                            <h4>${otherUser.name}</h4>
                            <p class="request-job">Re: ${job.title}</p>
                            <p class="request-time">${timeAgo}</p>
                        </div>
                    </div>
                    <div class="request-status">
                        <span class="status-badge ${statusClass}">
                            ${this.formatRequestStatus(request.status)}
                        </span>
                    </div>
                </div>
                
                <div class="request-message">
                    <p>${request.message}</p>
                </div>
                
                ${request.status === 'pending' && isReceived ? `
                    <div class="request-actions">
                        <button class="btn btn-primary accept-request" data-request-id="${request.id}">
                            <i class="fas fa-check"></i> Accept
                        </button>
                        <button class="btn btn-secondary decline-request" data-request-id="${request.id}">
                            <i class="fas fa-times"></i> Decline
                        </button>
                    </div>
                ` : ''}
                
                ${request.status === 'accepted' ? `
                    <div class="request-actions">
                        <button class="btn btn-outline open-chat" data-request-id="${request.id}">
                            <i class="fas fa-comments"></i> Open Chat
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupRequestInteractions() {
        document.querySelectorAll('.accept-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const requestId = btn.getAttribute('data-request-id');
                this.acceptChatRequest(requestId);
            });
        });

        document.querySelectorAll('.decline-request').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const requestId = btn.getAttribute('data-request-id');
                this.declineChatRequest(requestId);
            });
        });

        document.querySelectorAll('.open-chat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const requestId = btn.getAttribute('data-request-id');
                this.openChatFromRequest(requestId);
            });
        });
    }

    formatRequestStatus(status) {
        const statuses = {
            'pending': 'Pending',
            'accepted': 'Accepted',
            'declined': 'Declined'
        };
        return statuses[status] || status;
    }

    acceptChatRequest(requestId) {
        const request = this.chatRequests.find(r => r.id === requestId);
        if (!request) return;

        request.status = 'accepted';
        this.saveChatRequests();

        const conversation = {
            id: Date.now().toString(),
            participants: [request.fromUserId, request.toUserId],
            jobId: request.jobId,
            createdAt: new Date().toISOString(),
            lastMessageAt: new Date().toISOString(),
            isActive: true,
            messages: [{
                id: Date.now().toString(),
                senderId: 'system',
                content: 'Chat started! Feel free to discuss the job opportunity.',
                timestamp: new Date().toISOString(),
                read: false
            }]
        };

        this.conversations.push(conversation);
        this.saveConversations();

        this.sendNotificationToUser(request.fromUserId, {
            type: 'chat_accepted',
            title: 'Chat Request Accepted',
            message: `${this.currentUser.name} accepted your chat request`,
            data: { conversationId: conversation.id, jobId: request.jobId }
        });

        this.showAlert('Chat request accepted! You can now start messaging.', 'success');
        this.renderChatRequests();
    }

    declineChatRequest(requestId) {
        const request = this.chatRequests.find(r => r.id === requestId);
        if (!request) return;

        request.status = 'declined';
        this.saveChatRequests();

        this.sendNotificationToUser(request.fromUserId, {
            type: 'chat_declined',
            title: 'Chat Request Declined',
            message: `${this.currentUser.name} declined your chat request`,
            data: { jobId: request.jobId }
        });

        this.showAlert('Chat request declined.', 'info');
        this.renderChatRequests();
    }

    openChatFromRequest(requestId) {
        const request = this.chatRequests.find(r => r.id === requestId);
        if (!request) return;

        const conversation = this.conversations.find(conv => 
            conv.participants.includes(request.fromUserId) && 
            conv.participants.includes(request.toUserId) &&
            conv.jobId === request.jobId
        );

        if (conversation) {
            this.showSection('messages');
            this.openConversation(conversation.id);
        }
    }

    setupEmployerChatRequestModal() {
        const modal = document.getElementById('employer-chat-request-modal');
        const closeBtn = document.getElementById('close-employer-chat-request');
        const acceptBtn = document.getElementById('accept-employer-chat-request');
        const declineBtn = document.getElementById('decline-employer-chat-request');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.acceptEmployerChatRequest();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                this.declineEmployerChatRequest();
            });
        }
    }

    showEmployerChatRequestModal(request) {
        const modal = document.getElementById('employer-chat-request-modal');
        const employerName = document.getElementById('employer-name');
        const employerInitials = document.getElementById('employer-initials');
        const employerAvatar = document.getElementById('employer-avatar');
        const jobTitle = document.getElementById('employer-job-title');
        const messageText = document.getElementById('employer-message-text');

        const employer = window.AuthUtils.getAllUsers().find(u => u.id === request.fromUserId);
        const job = this.jobs.find(j => j.id === request.jobId);

        if (employer && job) {
            this.currentRequestId = request.id;
            
            if (employerName) employerName.textContent = employer.name;
            if (employerInitials) employerInitials.textContent = employer.avatar.initials;
            if (employerAvatar) employerAvatar.style.background = employer.avatar.color;
            if (jobTitle) jobTitle.textContent = job.title;
            if (messageText) messageText.textContent = request.message;

            modal.classList.add('show');
        }
    }

    acceptEmployerChatRequest() {
        if (!this.currentRequestId) return;
        this.acceptChatRequest(this.currentRequestId);
        document.getElementById('employer-chat-request-modal').classList.remove('show');
        this.currentRequestId = null;
    }

    declineEmployerChatRequest() {
        if (!this.currentRequestId) return;
        this.declineChatRequest(this.currentRequestId);
        document.getElementById('employer-chat-request-modal').classList.remove('show');
        this.currentRequestId = null;
    }

    checkPendingChatRequests() {
        const pendingRequests = this.chatRequests.filter(req => 
            req.toUserId === this.currentUser.id && req.status === 'pending'
        );

        if (pendingRequests.length > 0) {
            this.showEmployerChatRequestModal(pendingRequests[0]);
        }
    }

    // Interview Management
    setupInterviews() {
        const interviewModal = document.getElementById('interview-details-modal');
        const closeBtn = document.getElementById('close-interview-details');
        const confirmBtn = document.getElementById('confirm-interview');
        const rescheduleBtn = document.getElementById('request-reschedule');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                interviewModal.classList.remove('show');
            });
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmInterview();
            });
        }

        if (rescheduleBtn) {
            rescheduleBtn.addEventListener('click', () => {
                this.requestReschedule();
            });
        }

        const statusFilter = document.getElementById('interview-status-filter');
        const dateFilter = document.getElementById('interview-date-filter');

        if (statusFilter) statusFilter.addEventListener('change', () => this.filterInterviews());
        if (dateFilter) dateFilter.addEventListener('change', () => this.filterInterviews());
    }

    renderInterviews() {
        const container = document.getElementById('interviews-container');
        
        const myInterviews = this.interviews.filter(interview => 
            interview.applicantUserId === this.currentUser.id
        );

        if (myInterviews.length === 0) {
            container.innerHTML = `
                <div class="no-interviews">
                    <i class="fas fa-calendar-check"></i>
                    <h3>No interviews scheduled</h3>
                    <p>Interviews scheduled by employers will appear here</p>
                </div>
            `;
            return;
        }

        this.filterInterviews();
    }

    filterInterviews() {
        const container = document.getElementById('interviews-container');
        const statusFilter = document.getElementById('interview-status-filter');
        const dateFilter = document.getElementById('interview-date-filter');
        
        if (!container) return;

        const statusFilterValue = statusFilter ? statusFilter.value : '';
        const dateFilterValue = dateFilter ? dateFilter.value : '';

        let filteredInterviews = this.interviews.filter(interview => 
            interview.applicantUserId === this.currentUser.id
        );

        if (statusFilterValue) {
            filteredInterviews = filteredInterviews.filter(interview => 
                interview.status === statusFilterValue
            );
        }

        if (dateFilterValue) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            
            filteredInterviews = filteredInterviews.filter(interview => {
                const interviewDate = new Date(interview.date);
                
                switch(dateFilterValue) {
                    case 'today':
                        return interviewDate.toDateString() === today.toDateString();
                    case 'tomorrow':
                        return interviewDate.toDateString() === tomorrow.toDateString();
                    case 'this-week':
                        const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
                        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return interviewDate >= weekStart && interviewDate < weekEnd;
                    case 'next-week':
                        const nextWeekStart = new Date(today.getTime() + (7 - today.getDay()) * 24 * 60 * 60 * 1000);
                        const nextWeekEnd = new Date(nextWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return interviewDate >= nextWeekStart && interviewDate < nextWeekEnd;
                    default:
                        return true;
                }
            });
        }

        if (filteredInterviews.length === 0) {
            container.innerHTML = `
                <div class="no-interviews">
                    <i class="fas fa-calendar-check"></i>
                    <h3>No interviews match your filters</h3>
                    <p>Try adjusting your filter criteria</p>
                </div>
            `;
            return;
        }

        filteredInterviews.sort((a, b) => {
            const dateA = new Date(`${a.date} ${a.time}`);
            const dateB = new Date(`${b.date} ${b.time}`);
            return dateA - dateB;
        });

        const interviewsHTML = filteredInterviews.map(interview => this.createInterviewHTML(interview)).join('');
        container.innerHTML = interviewsHTML;

        this.setupInterviewInteractions();
    }

    createInterviewHTML(interview) {
        const job = this.jobs.find(j => j.id === interview.jobId);
        const employer = window.AuthUtils.getAllUsers().find(u => u.id === interview.employerId);
        
        if (!job || !employer) return '';

        const interviewDate = new Date(interview.date);
        const formattedDate = interviewDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const formattedTime = new Date(`1970-01-01 ${interview.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const statusClass = `status-${interview.status}`;

        return `
            <div class="interview-card ${statusClass}" data-interview-id="${interview.id}">
                <div class="interview-header">
                    <div class="interview-info">
                        <h3>${interview.title}</h3>
                        <p class="interview-company">
                            <i class="fas fa-building"></i> ${employer.companyName || employer.name}
                        </p>
                        <p class="interview-job">
                            <i class="fas fa-briefcase"></i> ${job.title}
                        </p>
                    </div>
                    <div class="interview-status">
                        <span class="status-badge ${statusClass}">
                            ${this.formatInterviewStatus(interview.status)}
                        </span>
                    </div>
                </div>

                <div class="interview-details">
                    <div class="interview-datetime">
                        <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                        <p><i class="fas fa-clock"></i> ${formattedTime} (${interview.duration} minutes)</p>
                    </div>
                    
                    <div class="interview-type">
                        <p><i class="fas fa-${this.getInterviewTypeIcon(interview.type)}"></i> ${this.formatInterviewType(interview.type)}</p>
                        ${interview.location ? `<p class="interview-location">${interview.location}</p>` : ''}
                    </div>
                </div>

                ${interview.notes ? `
                    <div class="interview-notes">
                        <p><strong>Notes:</strong> ${interview.notes}</p>
                    </div>
                ` : ''}

                <div class="interview-actions">
                    <button class="btn btn-outline view-details" data-interview-id="${interview.id}">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    ${interview.status === 'scheduled' ? `
                        <button class="btn btn-primary confirm-attendance" data-interview-id="${interview.id}">
                            <i class="fas fa-check"></i> Confirm
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupInterviewInteractions() {
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const interviewId = btn.getAttribute('data-interview-id');
                this.showInterviewDetails(interviewId);
            });
        });

        document.querySelectorAll('.confirm-attendance').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const interviewId = btn.getAttribute('data-interview-id');
                this.quickConfirmInterview(interviewId);
            });
        });
    }

    showInterviewDetails(interviewId) {
        const interview = this.interviews.find(i => i.id === interviewId);
        if (!interview) return;

        const job = this.jobs.find(j => j.id === interview.jobId);
        const employer = window.AuthUtils.getAllUsers().find(u => u.id === interview.employerId);
        
        if (!job || !employer) return;

        this.currentInterviewId = interviewId;

        const interviewDate = new Date(interview.date);
        const formattedDate = interviewDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const formattedTime = new Date(`1970-01-01 ${interview.time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        document.getElementById('detail-title').textContent = interview.title;
        document.getElementById('detail-company').textContent = employer.companyName || employer.name;
        document.getElementById('detail-position').textContent = job.title;
        document.getElementById('detail-datetime').textContent = `${formattedDate} at ${formattedTime}`;
        document.getElementById('detail-duration').textContent = `${interview.duration} minutes`;
        document.getElementById('detail-type').textContent = this.formatInterviewType(interview.type);

        const locationRow = document.getElementById('detail-location-row');
        if (interview.location) {
            locationRow.style.display = 'flex';
            document.getElementById('detail-location').textContent = interview.location;
        } else {
            locationRow.style.display = 'none';
        }

        const notesRow = document.getElementById('detail-notes-row');
        if (interview.notes) {
            notesRow.style.display = 'flex';
            document.getElementById('detail-notes').textContent = interview.notes;
        } else {
            notesRow.style.display = 'none';
        }

        document.getElementById('interview-details-modal').classList.add('show');
    }

    confirmInterview() {
        if (!this.currentInterviewId) return;

        const interview = this.interviews.find(i => i.id === this.currentInterviewId);
        if (!interview) return;

        interview.confirmed = true;
        this.saveInterviews();

        this.sendNotificationToUser(interview.employerId, {
            type: 'interview_confirmed',
            title: 'Interview Confirmed',
            message: `${this.currentUser.name} confirmed their interview attendance`,
            data: { interviewId: interview.id, jobId: interview.jobId }
        });

        document.getElementById('interview-details-modal').classList.remove('show');
        this.showAlert('Interview attendance confirmed!', 'success');
        this.renderInterviews();
    }

    quickConfirmInterview(interviewId) {
        this.currentInterviewId = interviewId;
        this.confirmInterview();
    }

    requestReschedule() {
        if (!this.currentInterviewId) return;

        const interview = this.interviews.find(i => i.id === this.currentInterviewId);
        if (!interview) return;

        this.sendNotificationToUser(interview.employerId, {
            type: 'reschedule_request',
            title: 'Reschedule Request',
            message: `${this.currentUser.name} requested to reschedule the interview`,
            data: { interviewId: interview.id, jobId: interview.jobId }
        });

        document.getElementById('interview-details-modal').classList.remove('show');
        this.showAlert('Reschedule request sent to employer', 'info');
    }

    formatInterviewStatus(status) {
        const statuses = {
            'scheduled': 'Scheduled',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return statuses[status] || status;
    }

    formatInterviewType(type) {
        const types = {
            'video': 'Video Call',
            'phone': 'Phone Call',
            'in-person': 'In-Person'
        };
        return types[type] || type;
    }

    getInterviewTypeIcon(type) {
        const icons = {
            'video': 'video',
            'phone': 'phone',
            'in-person': 'map-marker-alt'
        };
        return icons[type] || 'calendar';
    }

    // Notifications System
    setupNotifications() {
        const notificationBtn = document.getElementById('notification-btn');
        const notificationPanel = document.getElementById('notification-panel');
        const clearBtn = document.getElementById('clear-notifications');

        if (notificationBtn && notificationPanel) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationPanel.classList.toggle('show');
                
                this.markNotificationsAsRead();
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearAllNotifications();
            });
        }

        document.addEventListener('click', () => {
            if (notificationPanel) {
                notificationPanel.classList.remove('show');
            }
        });
    }

    updateNotifications() {
        const userNotifications = this.notifications
            .filter(n => n.userId === this.currentUser.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const unreadCount = userNotifications.filter(n => !n.read).length;
        
        const notificationCount = document.getElementById('notification-count');
        if (notificationCount) {
            if (unreadCount > 0) {
                notificationCount.textContent = unreadCount;
                notificationCount.style.display = 'block';
            } else {
                notificationCount.style.display = 'none';
            }
        }

        const notificationList = document.getElementById('notification-list');
        if (!notificationList) return;
        
        if (userNotifications.length === 0) {
            notificationList.innerHTML = `
                <div class="no-notifications">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }

        const notificationsHTML = userNotifications.map(notification => this.createNotificationHTML(notification)).join('');
        notificationList.innerHTML = notificationsHTML;

        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const notificationId = item.getAttribute('data-notification-id');
                this.handleNotificationClick(notificationId);
            });
        });
    }

    createNotificationHTML(notification) {
        const timeAgo = this.timeAgo(notification.timestamp);
        
        return `
            <div class="notification-item ${!notification.read ? 'unread' : ''}" 
                 data-notification-id="${notification.id}">
                <div class="notification-content">
                    <div class="notification-icon ${notification.type}">
                        <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-text">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                </div>
            </div>
        `;
    }

    getNotificationIcon(type) {
        const icons = {
            'message': 'comment',
            'chat_started': 'comment-dots',
            'chat_accepted': 'check-circle',
            'chat_declined': 'times-circle',
            'application_status': 'info-circle',
            'interview_scheduled': 'calendar-plus',
            'interview_cancelled': 'calendar-times',
            'chat_request': 'comment-dots'
        };
        return icons[type] || 'bell';
    }

    handleNotificationClick(notificationId) {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (!notification) return;

        notification.read = true;
        this.saveNotifications();
        this.updateNotifications();

        switch (notification.type) {
            case 'message':
            case 'chat_started':
                this.showSection('messages');
                if (notification.data?.conversationId) {
                    this.openConversation(notification.data.conversationId);
                }
                break;
            case 'chat_accepted':
                this.showSection('messages');
                if (notification.data?.conversationId) {
                    this.openConversation(notification.data.conversationId);
                }
                break;
            case 'chat_declined':
                break;
            case 'chat_request':
                const request = this.chatRequests.find(r => r.id === notification.data?.requestId);
                if (request && request.status === 'pending') {
                    this.showEmployerChatRequestModal(request);
                }
                break;
            case 'interview_scheduled':
            case 'interview_cancelled':
                this.showSection('interviews');
                break;
            case 'application_status':
                this.showSection('applied');
                break;
        }

        document.getElementById('notification-panel').classList.remove('show');
    }

    markNotificationsAsRead() {
        this.notifications
            .filter(n => n.userId === this.currentUser.id && !n.read)
            .forEach(n => n.read = true);
        
        this.saveNotifications();
        this.updateNotifications();
    }

    clearAllNotifications() {
        this.notifications = this.notifications.filter(n => n.userId !== this.currentUser.id);
        this.saveNotifications();
        this.updateNotifications();
    }

    sendNotificationToUser(userId, notificationData) {
        const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: userId,
            ...notificationData,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.notifications.push(notification);
        this.saveNotifications();
    }

    // Real-time Updates
    startRealTimeUpdates() {
        setInterval(() => {
            this.checkForUpdates();
        }, 5000);
    }

    checkForUpdates() {
        const newJobs = this.loadJobs();
        const newConversations = this.loadConversations();
        const newNotifications = this.loadNotifications();
        const newChatRequests = this.loadChatRequests();
        const newInterviews = this.loadInterviews();

        if (newJobs.length !== this.jobs.length) {
            this.jobs = newJobs;
            this.filterJobs();
        }

        if (newInterviews.length !== this.interviews.length) {
            this.interviews = newInterviews;
            const currentSection = document.querySelector('.section.active').id;
            if (currentSection === 'interviews') {
                this.renderInterviews();
            }
            this.updateCounts();
        }

        const newPendingRequests = newChatRequests.filter(req => 
            req.toUserId === this.currentUser.id && 
            req.status === 'pending' &&
            !this.chatRequests.find(existing => existing.id === req.id)
        );

        if (newPendingRequests.length > 0) {
            this.chatRequests = newChatRequests;
            this.showEmployerChatRequestModal(newPendingRequests[0]);
            this.renderChatRequests();
        } else {
            this.chatRequests = newChatRequests;
            this.renderChatRequests();
        }

        this.conversations = newConversations;
        if (this.currentChatId) {
            const currentConversation = this.conversations.find(c => c.id === this.currentChatId);
            if (currentConversation) {
                this.renderChatInterface(currentConversation);
            }
        }
        this.renderConversations();

        this.notifications = newNotifications;
        this.updateNotifications();

        this.updateMessageBadge();
    }

    updateMessageBadge() {
        const userConversations = this.conversations.filter(conv => 
            conv.participants.includes(this.currentUser.id) && conv.isActive
        );
        
        const unreadMessages = userConversations.reduce((total, conv) => {
            return total + conv.messages.filter(m => 
                m.senderId !== this.currentUser.id && !m.read
            ).length;
        }, 0);

        const messagesBadge = document.getElementById('messages-badge');
        if (messagesBadge) {
            if (unreadMessages > 0) {
                messagesBadge.textContent = unreadMessages;
                messagesBadge.style.display = 'block';
            } else {
                messagesBadge.style.display = 'none';
            }
        }
    }

    renderConversations() {
        const chatList = document.getElementById('chat-list');
        if (!chatList) return;

        const userConversations = this.conversations
            .filter(conv => conv.participants.includes(this.currentUser.id) && conv.isActive)
            .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        if (userConversations.length === 0) {
            chatList.innerHTML = `
                <div class="no-chats">
                    <i class="fas fa-comments"></i>
                    <h4>No conversations</h4>
                    <p>Start chatting with employers</p>
                </div>
            `;
            return;
        }

        const chatsHTML = userConversations.map(conv => this.createChatItemHTML(conv)).join('');
        chatList.innerHTML = chatsHTML;

        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', () => {
                const chatId = item.getAttribute('data-chat-id');
                this.openConversation(chatId);
            });
        });
    }

    createChatItemHTML(conversation) {
        const otherUserId = conversation.participants.find(p => p !== this.currentUser.id);
        const otherUser = window.AuthUtils.getAllUsers().find(u => u.id === otherUserId);
        const job = this.jobs.find(j => j.id === conversation.jobId);
        
        if (!otherUser) return '';

        const lastMessage = conversation.messages[conversation.messages.length - 1];
        const unreadCount = conversation.messages.filter(m => 
            m.senderId !== this.currentUser.id && !m.read
        ).length;

        const lastMessageTime = lastMessage ? 
            this.formatTime(lastMessage.timestamp) : 
            this.formatTime(conversation.createdAt);

        const preview = lastMessage ? 
            (lastMessage.senderId === this.currentUser.id ? 'You: ' : '') + lastMessage.content :
            'No messages yet';

        return `
            <div class="chat-item ${conversation.id === this.currentChatId ? 'active' : ''}" 
                 data-chat-id="${conversation.id}">
                <div class="chat-avatar" style="background: ${otherUser.avatar.color}">
                    <span>${otherUser.avatar.initials}</span>
                </div>
                <div class="chat-info">
                    <div class="chat-name">${otherUser.name}</div>
                    <div class="chat-preview">${preview}</div>
                    ${job ? `<div class="chat-job">Re: ${job.title}</div>` : ''}
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${lastMessageTime}</div>
                    ${unreadCount > 0 ? `<div class="chat-unread">${unreadCount}</div>` : ''}
                </div>
            </div>
        `;
    }

    openConversation(conversationId) {
        const conversation = this.conversations.find(c => c.id === conversationId);
        if (!conversation) return;

        this.currentChatId = conversationId;
        
        conversation.messages.forEach(message => {
            if (message.senderId !== this.currentUser.id) {
                message.read = true;
            }
        });
        this.saveConversations();

        this.renderConversations();
        
        this.renderChatInterface(conversation);
    }

    renderChatInterface(conversation) {
        const chatMain = document.getElementById('chat-main');
        const otherUserId = conversation.participants.find(p => p !== this.currentUser.id);
        const otherUser = window.AuthUtils.getAllUsers().find(u => u.id === otherUserId);
        const job = this.jobs.find(j => j.id === conversation.jobId);

        if (!otherUser) return;

        chatMain.innerHTML = `
            <div class="chat-header">
                <div class="chat-avatar" style="background: ${otherUser.avatar.color}">
                    <span>${otherUser.avatar.initials}</span>
                </div>
                <div class="chat-header-info">
                    <h3>${otherUser.name}</h3>
                    <p>Discussing: ${job ? job.title : 'General chat'}</p>
                </div>
            </div>
            <div class="chat-messages" id="chat-messages">
                ${conversation.messages.map(message => this.createMessageHTML(message)).join('')}
            </div>
            <div class="chat-input">
                <div class="chat-input-group">
                    <input type="text" id="chat-input" placeholder="Type a message..." maxlength="500">
                    <button class="send-btn" id="send-btn">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        this.setupChatInput();
        
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    setupChatInput() {
        const chatInput = document.getElementById('chat-input');
        const sendBtn = document.getElementById('send-btn');

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            chatInput.focus();
        }
    }

    createMessageHTML(message) {
        const isOwnMessage = message.senderId === this.currentUser.id;
        
        if (message.senderId === 'system') {
            return `
                <div class="system-message">
                    <span>${message.content}</span>
                </div>
            `;
        }

        const sender = window.AuthUtils.getAllUsers().find(u => u.id === message.senderId);
        
        if (!sender) return '';

        return `
            <div class="message ${isOwnMessage ? 'sent' : 'received'}">
                <div class="message-avatar" style="background: ${sender.avatar.color}">
                    <span>${sender.avatar.initials}</span>
                </div>
                <div class="message-content">
                    <div class="message-text">${this.escapeHtml(message.content)}</div>
                    <div class="message-time">${this.formatTime(message.timestamp)}</div>
                </div>
            </div>
        `;
    }

    sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const content = chatInput ? chatInput.value.trim() : '';
        
        if (!content || !this.currentChatId) return;

        const conversation = this.conversations.find(c => c.id === this.currentChatId);
        if (!conversation) return;

        const message = {
            id: Date.now().toString(),
            senderId: this.currentUser.id,
            content: content,
            timestamp: new Date().toISOString(),
            read: false
        };

        conversation.messages.push(message);
        conversation.lastMessageAt = message.timestamp;
        this.saveConversations();

        const otherUserId = conversation.participants.find(p => p !== this.currentUser.id);
        this.sendNotificationToUser(otherUserId, {
            type: 'new_message',
            title: 'New Message',
            message: `${this.currentUser.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            data: { conversationId: this.currentChatId }
        });

        chatInput.value = '';
        this.renderChatInterface(conversation);
        this.renderConversations();
    }

    setupLoadMore() {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.replaceWith(loadMoreBtn.cloneNode(true));
            
            document.getElementById('load-more-btn').addEventListener('click', () => {
                this.currentPage++;
                this.renderJobs();
            });
        }
    }

    // Saved Jobs
    renderSavedJobs() {
        const container = document.getElementById('saved-jobs-container');
        
        if (this.savedJobs.length === 0) {
            container.innerHTML = `
                <div class="no-jobs">
                    <i class="fas fa-heart"></i>
                    <h3>No saved jobs yet</h3>
                    <p>Start browsing jobs and save the ones you're interested in</p>
                    <button class="btn btn-primary" data-section="jobs">
                        <i class="fas fa-search"></i> Browse Jobs
                    </button>
                </div>
            `;
            this.setupNavigation();
            return;
        }

        const jobsHTML = this.savedJobs.map(job => this.createJobCardHTML(job)).join('');
        container.innerHTML = jobsHTML;
        this.setupJobCardInteractions();
    }

    // Applied Jobs
    renderAppliedJobs() {
        const container = document.getElementById('applied-jobs-container');
        
        if (this.appliedJobs.length === 0) {
            container.innerHTML = `
                <div class="no-jobs">
                    <i class="fas fa-paper-plane"></i>
                    <h3>No applications yet</h3>
                    <p>Start applying to jobs and track your progress here</p>
                    <button class="btn btn-primary" data-section="jobs">
                        <i class="fas fa-search"></i> Browse Jobs
                    </button>
                </div>
            `;
            this.setupNavigation();
            return;
        }

        const applicationsHTML = this.appliedJobs.map(application => {
            const job = this.jobs.find(j => j.id === application.jobId);
            if (!job) return '';
            
            const applicationDate = new Date(application.applicationDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="job-card">
                    <div class="job-header">
                        <div class="job-info">
                            <h3 class="job-title">${job.title}</h3>
                            <p class="job-company">${job.company}</p>
                        </div>
                        <div class="application-status">
                            <span style="background: #28a745; color: white; padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.9rem;">
                                <i class="fas fa-check"></i> Applied
                            </span>
                        </div>
                    </div>

                    <div class="job-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        <span><i class="fas fa-briefcase"></i> ${this.formatJobType(job.jobType)}</span>
                        <span><i class="fas fa-chart-line"></i> ${this.formatExperience(job.experienceLevel)}</span>
                        <span class="job-salary"><i class="fas fa-dollar-sign"></i> ${job.salary}</span>
                    </div>

                    <div class="job-description">
                        ${job.description.substring(0, 200)}${job.description.length > 200 ? '...' : ''}
                    </div>

                    <div class="application-details">
                        <p><strong>Applied on:</strong> ${applicationDate}</p>
                        <p><strong>Status:</strong> ${this.formatApplicationStatus(application.status)}</p>
                        ${application.coverLetter ? `<p><strong>Cover Letter:</strong> ${application.coverLetter.substring(0, 100)}...</p>` : ''}
                        ${application.resume ? `<p><strong>Resume:</strong> <i class="fas fa-paperclip"></i> ${application.resume.name} (${this.formatFileSize(application.resume.size)})</p>` : ''}
                    </div>

                    <div class="job-footer">
                        <span class="job-date">Application Status: ${application.status}</span>
                        <div class="job-cta">
                            <button class="btn btn-outline view-job" data-job-id="${job.id}">
                                <i class="fas fa-eye"></i> View Job
                            </button>
                            <button class="btn btn-secondary chat-employer-btn" data-job-id="${job.id}">
                                <i class="fas fa-comments"></i> Chat with Employer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = applicationsHTML;
        this.setupJobCardInteractions();

        document.querySelectorAll('.chat-employer-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const jobId = btn.getAttribute('data-job-id');
                this.currentJobId = jobId;
                this.requestChatWithEmployer();
            });
        });
    }

    formatApplicationStatus(status) {
        const statuses = {
            'submitted': 'Under Review',
            'reviewed': 'Reviewed',
            'shortlisted': 'Shortlisted',
            'rejected': 'Not Selected'
        };
        return statuses[status] || status;
    }

    // Utility Methods
    formatJobType(jobType) {
        const types = {
            'full-time': 'Full Time',
            'part-time': 'Part Time',
            'contract': 'Contract',
            'freelance': 'Freelance',
            'internship': 'Internship'
        };
        return types[jobType] || jobType;
    }

    formatExperience(experience) {
        const levels = {
            'entry': 'Entry Level',
            'mid': 'Mid Level',
            'senior': 'Senior Level',
            'lead': 'Lead/Manager',
            'executive': 'Executive'
        };
        return levels[experience] || experience;
    }

    updateCounts() {
        const savedCount = document.getElementById('saved-count');
        const appliedCount = document.getElementById('applied-count');
        const interviewsCountEl = document.getElementById('interviews-count');

        if (savedCount) savedCount.textContent = this.savedJobs.length;
        if (appliedCount) appliedCount.textContent = this.appliedJobs.length;
        
        const myInterviews = this.interviews.filter(interview => 
            interview.applicantUserId === this.currentUser.id && interview.status === 'scheduled'
        );
        if (interviewsCountEl) interviewsCountEl.textContent = myInterviews.length;
    }

    showSuccessMessage(message) {
        const titleEl = document.getElementById('success-title');
        const messageEl = document.getElementById('success-message');
        const modal = document.getElementById('success-modal');
        
        if (titleEl) titleEl.textContent = 'Success!';
        if (messageEl) messageEl.textContent = message;
        if (modal) modal.classList.add('show');
    }

    showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlerts = document.querySelectorAll('.dynamic-alert');
        existingAlerts.forEach(alert => alert.remove());

        const alert = document.createElement('div');
        alert.className = `dynamic-alert alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        alert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(alert)) {
                    document.body.removeChild(alert);
                }
            }, 300);
        }, 4000);
    }

    // Utility functions
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    timeAgo(timestamp) {
        return this.formatTime(timestamp);
    }

    simulateJobViews() {
        this.jobs.forEach(job => {
            if (!job.views) {
                job.views = Math.floor(Math.random() * 50) + 1;
            }
        });
        this.saveJobs();
    }

    // Data Persistence
    loadJobs() {
        const stored = localStorage.getItem('careerPlatformJobs');
        return stored ? JSON.parse(stored) : [];
    }

    saveJobs() {
        localStorage.setItem('careerPlatformJobs', JSON.stringify(this.jobs));
    }

    loadSavedJobs() {
        const stored = localStorage.getItem(`careerPlatformSavedJobs_${this.currentUser.id}`);
        return stored ? JSON.parse(stored) : [];
    }

    saveSavedJobs() {
        try {
            localStorage.setItem(`careerPlatformSavedJobs_${this.currentUser.id}`, JSON.stringify(this.savedJobs));
            return true;
        } catch (error) {
            console.error('Error saving saved jobs:', error);
            return false;
        }
    }

    loadAppliedJobs() {
        const stored = localStorage.getItem(`careerPlatformAppliedJobs_${this.currentUser.id}`);
        return stored ? JSON.parse(stored) : [];
    }

    loadApplicants() {
        const stored = localStorage.getItem('careerPlatformApplicants');
        return stored ? JSON.parse(stored) : [];
    }

    loadConversations() {
        const stored = localStorage.getItem('careerPlatformConversations');
        return stored ? JSON.parse(stored) : [];
    }

    saveConversations() {
        localStorage.setItem('careerPlatformConversations', JSON.stringify(this.conversations));
    }

    loadNotifications() {
        const stored = localStorage.getItem('careerPlatformNotifications');
        return stored ? JSON.parse(stored) : [];
    }

    saveNotifications() {
        localStorage.setItem('careerPlatformNotifications', JSON.stringify(this.notifications));
    }

    loadChatRequests() {
        const stored = localStorage.getItem('careerPlatformChatRequests');
        return stored ? JSON.parse(stored) : [];
    }

    saveChatRequests() {
        localStorage.setItem('careerPlatformChatRequests', JSON.stringify(this.chatRequests));
    }

    loadInterviews() {
        const stored = localStorage.getItem('careerPlatformInterviews');
        return stored ? JSON.parse(stored) : [];
    }

    saveInterviews() {
        localStorage.setItem('careerPlatformInterviews', JSON.stringify(this.interviews));
    }
}

// FIXED: Enhanced CSS for resume upload functionality
const style = document.createElement('style');
style.textContent = `
    /* FIXED: Enhanced File Upload Styles */
    .file-upload-container {
        position: relative;
        margin-top: 0.5rem;
    }

    .required-note {
        font-size: 0.85rem;
        color: #666;
        font-weight: normal;
    }

    .file-upload-area {
        border: 2px dashed #e9ecef;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: #f8f9fa;
        position: relative;
        min-height: 120px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .file-upload-area:hover,
    .file-upload-area.drag-over {
        border-color: #667eea;
        background: rgba(102, 126, 234, 0.05);
        transform: translateY(-2px);
    }

    .file-upload-area.drag-over {
        border-color: #667eea !important;
        background: rgba(102, 126, 234, 0.1) !important;
        transform: scale(1.02);
    }

    .file-upload-area.uploading {
        pointer-events: none;
        opacity: 0.7;
    }

    .file-upload-content i {
        font-size: 2rem;
        color: #667eea;
        margin-bottom: 1rem;
        transition: all 0.3s ease;
    }

    .file-upload-area:hover .file-upload-content i {
        transform: scale(1.1);
    }

    .file-upload-content p {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 1rem;
        font-weight: 500;
    }

    .browse-text {
        color: #667eea;
        font-weight: 600;
        text-decoration: underline;
        cursor: pointer;
    }

    .file-upload-content small {
        color: #666;
        font-size: 0.85rem;
        display: block;
        margin-top: 0.5rem;
        line-height: 1.4;
    }

    #resume-upload {
        position: absolute;
        opacity: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        top: 0;
        left: 0;
    }

    /* FIXED: Enhanced File Preview */
    .file-preview {
        background: white;
        border: 2px solid #28a745;
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 0.5rem;
        box-shadow: 0 4px 15px rgba(40, 167, 69, 0.1);
        animation: slideInUp 0.3s ease;
    }

    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .file-info {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .file-icon-container {
        flex-shrink: 0;
    }

    .file-icon {
        font-size: 2.5rem;
        color: #dc3545;
    }

    .file-icon.fa-file-image {
        color: #28a745;
    }

    .file-details {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .file-name {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.25rem;
        word-break: break-word;
        font-size: 1rem;
    }

    .file-size {
        font-size: 0.85rem;
        color: #666;
        margin-bottom: 0.25rem;
    }

    .file-status {
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }

    .file-status.success {
        color: #28a745;
        font-weight: 600;
    }

    .file-status.error {
        color: #dc3545;
        font-weight: 600;
    }

    .remove-file-btn {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        width: 35px;
        height: 35px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        flex-shrink: 0;
    }

    .remove-file-btn:hover {
        background: #c82333;
        transform: scale(1.1);
    }

    /* FIXED: Upload Progress */
    .upload-progress {
        background: #f8f9fa;
        border: 2px solid #667eea;
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 0.5rem;
        text-align: center;
    }

    .progress-bar {
        width: 100%;
        height: 8px;
        background: #e9ecef;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 0.75rem;
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        transition: width 0.3s ease;
        width: 0%;
    }

    .progress-text {
        color: #667eea;
        font-weight: 600;
        font-size: 0.9rem;
    }

    /* FIXED: Upload Error */
    .upload-error {
        background: #f8d7da;
        border: 2px solid #dc3545;
        border-radius: 12px;
        padding: 1.5rem;
        margin-top: 0.5rem;
        color: #721c24;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .upload-error i {
        font-size: 2rem;
        color: #dc3545;
    }

    .retry-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .retry-btn:hover {
        background: #c82333;
    }

    /* Loading state */
    .file-upload-area .fa-spinner {
        color: #667eea;
        animation: spin 1s linear infinite;
    }

    /* Alert animations */
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }

    /* Dynamic alert styles */
    .dynamic-alert {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 3000;
        max-width: 300px;
    }

    /* Submit button loading state */
    #submit-application:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    /* Responsive design */
    @media (max-width: 768px) {
        .file-upload-area {
            padding: 1.5rem 1rem;
        }
        
        .file-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .remove-file-btn {
            width: 30px;
            height: 30px;
            align-self: flex-end;
        }
        
        .upload-progress,
        .upload-error {
            padding: 1rem;
        }
    }
`;
document.head.appendChild(style);

// Initialize the enhanced worker dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing WorkerDashboard...');
    try {
        new WorkerDashboard();
    } catch (error) {
        console.error('Error initializing WorkerDashboard:', error);
    }
});