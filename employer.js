// Enhanced Career Platform - Employer Dashboard with SIMPLIFIED Resume Handling
class EmployerDashboard {
    constructor() {
        // Check authentication first
        if (typeof window.AuthUtils === 'undefined') {
            console.error('AuthUtils not found. Make sure login.js is loaded first.');
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = window.AuthUtils.requireAuth();
        if (!this.currentUser || this.currentUser.userType !== 'employer') {
            window.location.href = 'login.html';
            return;
        }

        // Initialize data
        this.jobs = this.loadJobs();
        this.applicants = this.loadApplicants();
        this.conversations = this.loadConversations();
        this.notifications = this.loadNotifications();
        this.chatRequests = this.loadChatRequests();
        this.interviews = this.loadInterviews();
        this.profileData = this.loadProfileData();
        
        // Current state
        this.currentChatId = null;
        this.currentApplicantId = null;
        this.currentRequestId = null;
        this.currentInterviewId = null;
        this.filteredApplicants = [];
        this.activeTab = 'incoming';
        this.currentResumeData = null;
        
        this.init();
    }

    init() {
        this.setupAuth();
        this.setupNavigation();
        this.setupJobForm();
        this.setupModals();
        this.setupChat();
        this.setupNotifications();
        this.setupApplicants();
        this.setupChatRequests();
        this.setupInterviews();
        this.setupCompanyProfile();
        this.setupResumeViewer();
        this.renderJobs();
        this.renderApplicants();
        this.renderConversations();
        this.renderChatRequests();
        this.renderInterviews();
        this.renderCompanyProfile();
        this.updateStats();
        this.updateNotifications();
        this.startRealTimeUpdates();
        
        // Save profile data when page is about to close
        window.addEventListener('beforeunload', () => {
            this.saveEmployerProfile();
        });
        
        // Initial profile save to ensure data exists
        setTimeout(() => this.saveEmployerProfile(), 500);
    }

    // SIMPLIFIED: Setup Resume Viewer
    setupResumeViewer() {
        const resumeViewerModal = document.getElementById('resume-viewer-modal');
        const closeResumeViewer = document.getElementById('close-resume-viewer');
        const downloadFromViewer = document.getElementById('download-resume-from-viewer');

        if (closeResumeViewer) {
            closeResumeViewer.addEventListener('click', () => {
                resumeViewerModal.classList.remove('show');
                this.currentResumeData = null;
            });
        }

        if (downloadFromViewer) {
            downloadFromViewer.addEventListener('click', () => {
                this.downloadCurrentResume();
            });
        }

        if (resumeViewerModal) {
            resumeViewerModal.addEventListener('click', (e) => {
                if (e.target === resumeViewerModal) {
                    resumeViewerModal.classList.remove('show');
                    this.currentResumeData = null;
                }
            });
        }
    }

    // SIMPLIFIED: View Resume with better error handling
    async viewResume(resumeData) {
        console.log('📄 === SIMPLIFIED RESUME VIEWING ===');
        console.log('Resume data:', {
            hasData: !!resumeData,
            name: resumeData?.name,
            size: resumeData?.size,
            type: resumeData?.type,
            hasDataUrl: !!(resumeData?.data),
            hasId: !!(resumeData?.id)
        });
        
        if (!resumeData) {
            console.error('❌ No resume data provided');
            this.showAlert('Resume data not available', 'error');
            return;
        }

        this.currentResumeData = resumeData;

        // Check if we have a valid data URL
        if (resumeData.data && typeof resumeData.data === 'string' && resumeData.data.startsWith('data:')) {
            console.log('✅ Found valid data URL, displaying resume');
            this.showResumeViewer(resumeData);
            return;
        }

        // Try to get from IndexedDB if we have an ID
        if (resumeData.id && window.resumeStorage) {
            console.log('🔍 Trying to load from IndexedDB:', resumeData.id);
            try {
                await window.resumeStorage.init();
                const storedResume = await window.resumeStorage.getResume(resumeData.id);
                
                if (storedResume && storedResume.data && storedResume.data.startsWith('data:')) {
                    console.log('✅ Found resume in IndexedDB with data URL');
                    const completeResumeData = { ...resumeData, ...storedResume };
                    this.currentResumeData = completeResumeData;
                    this.showResumeViewer(completeResumeData);
                    return;
                }
                
                if (storedResume && storedResume.blob) {
                    console.log('🔄 Converting blob to data URL');
                    const dataUrl = await window.resumeStorage.blobToDataUrl(storedResume.blob);
                    const completeResumeData = { ...resumeData, ...storedResume, data: dataUrl };
                    this.currentResumeData = completeResumeData;
                    this.showResumeViewer(completeResumeData);
                    return;
                }
                
                console.warn('⚠️ Resume found in IndexedDB but no usable data');
            } catch (error) {
                console.error('❌ Error loading from IndexedDB:', error);
            }
        }

        // Fallback: Show file info
        console.log('ℹ️ Using file info fallback');
        this.showResumeFileInfo(resumeData);
    }

    // SIMPLIFIED: Show resume viewer
    showResumeViewer(resumeData) {
        console.log('🖥️ Showing resume viewer for:', resumeData.name);
        
        const modal = document.getElementById('resume-viewer-modal');
        const container = document.getElementById('resume-viewer-container');

        if (!modal || !container) {
            console.error('❌ Resume viewer elements not found');
            this.showAlert('Resume viewer not available', 'error');
            return;
        }

        // Show loading
        container.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading resume...</p>
            </div>
        `;

        modal.classList.add('show');

        // Load resume based on type
        setTimeout(() => {
            try {
                if (resumeData.type === 'application/pdf') {
                    this.loadPDFResume(resumeData, container);
                } else if (resumeData.type && resumeData.type.startsWith('image/')) {
                    this.loadImageResume(resumeData, container);
                } else {
                    this.showResumeError(container, `Unsupported file type: ${resumeData.type || 'Unknown'}`);
                }
            } catch (error) {
                console.error('💥 Error loading resume:', error);
                this.showResumeError(container, 'Error loading resume: ' + error.message);
            }
        }, 300);
    }

    // SIMPLIFIED: Load PDF Resume
    loadPDFResume(resumeData, container) {
        try {
            console.log('Loading PDF resume:', resumeData.name);
            
            if (!resumeData.data || !resumeData.data.startsWith('data:application/pdf')) {
                throw new Error('Invalid PDF data format');
            }

            const iframe = document.createElement('iframe');
            iframe.src = resumeData.data;
            iframe.style.cssText = `
                width: 100%;
                height: 80vh;
                border: none;
                border-radius: 8px;
            `;

            iframe.onload = () => {
                console.log('PDF loaded successfully');
            };

            iframe.onerror = () => {
                console.warn('PDF inline viewing failed');
                this.showPDFError(container, resumeData);
            };

            container.innerHTML = '';
            container.appendChild(iframe);

        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showPDFError(container, resumeData, error.message);
        }
    }

    // SIMPLIFIED: Load Image Resume
    loadImageResume(resumeData, container) {
        try {
            console.log('Loading image resume:', resumeData.name);
            
            if (!resumeData.data || !resumeData.data.startsWith('data:image/')) {
                throw new Error('Invalid image data format');
            }

            const img = document.createElement('img');
            img.src = resumeData.data;
            img.style.cssText = `
                max-width: 100%;
                max-height: 80vh;
                object-fit: contain;
                border-radius: 8px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            `;

            img.onload = () => {
                container.innerHTML = '';
                container.appendChild(img);
                console.log('Image resume loaded successfully');
            };

            img.onerror = () => {
                console.error('Image loading failed');
                this.showResumeError(container, 'Error loading image resume');
            };

        } catch (error) {
            console.error('Error loading image:', error);
            this.showResumeError(container, 'Error loading image resume: ' + error.message);
        }
    }

    // Show PDF error with fallback options
    showPDFError(container, resumeData, errorMessage = null) {
        container.innerHTML = `
            <div class="pdf-error-container">
                <div class="pdf-fallback">
                    <div class="pdf-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <h3>PDF Resume</h3>
                    <div class="pdf-details">
                        <p><strong>Filename:</strong> ${resumeData.name}</p>
                        <p><strong>Size:</strong> ${this.formatFileSize(resumeData.size || 0)}</p>
                        <p><strong>Type:</strong> PDF Document</p>
                    </div>
                    <div class="pdf-error-message">
                        <p><i class="fas fa-info-circle"></i> 
                        ${errorMessage || 'Your browser cannot display this PDF inline. You can download it to view.'}</p>
                    </div>
                    <div class="pdf-actions">
                        <button class="btn btn-primary" onclick="employer.downloadCurrentResume()">
                            <i class="fas fa-download"></i> Download PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Show file information when resume can't be viewed
    showResumeFileInfo(resumeData) {
        const modal = document.getElementById('resume-viewer-modal');
        const container = document.getElementById('resume-viewer-container');

        if (!modal || !container) {
            this.showAlert('Resume viewer not available', 'error');
            return;
        }

        container.innerHTML = `
            <div class="resume-file-info">
                <div class="file-icon-large">
                    <i class="fas fa-file-${resumeData.type === 'application/pdf' ? 'pdf' : 'image'}"></i>
                </div>
                <h3>Resume File Information</h3>
                <div class="file-details-grid">
                    <div class="detail-item">
                        <strong>Filename:</strong>
                        <span>${resumeData.name || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <strong>File Size:</strong>
                        <span>${this.formatFileSize(resumeData.size || 0)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>File Type:</strong>
                        <span>${resumeData.type || 'Unknown'}</span>
                    </div>
                    ${resumeData.uploadDate ? `
                        <div class="detail-item">
                            <strong>Upload Date:</strong>
                            <span>${new Date(resumeData.uploadDate).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="file-status-message">
                    <div class="status-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="status-text">
                        <p><strong>Resume File Available</strong></p>
                        <p>This resume was uploaded by the applicant. Contact them directly if you need access to the file.</p>
                    </div>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="this.closest('.modal').classList.remove('show')">
                        <i class="fas fa-check"></i> Understood
                    </button>
                    <button class="btn btn-outline" onclick="employer.contactApplicantAboutResume()">
                        <i class="fas fa-envelope"></i> Contact Applicant
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('show');
    }

    // Show resume error
    showResumeError(container, errorMessage) {
        container.innerHTML = `
            <div class="resume-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3>Unable to Load Resume</h3>
                <p>${errorMessage}</p>
                <div class="error-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').classList.remove('show')">
                        <i class="fas fa-times"></i> Close
                    </button>
                    ${this.currentResumeData ? `
                        <button class="btn btn-primary" onclick="employer.downloadCurrentResume()">
                            <i class="fas fa-download"></i> Try Download
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Contact applicant about resume
    contactApplicantAboutResume() {
        const modal = document.getElementById('resume-viewer-modal');
        modal.classList.remove('show');
        
        const application = this.applicants.find(app => app.id === this.currentApplicantId);
        if (application) {
            this.showAlert(`Contact ${application.applicantName} at ${application.applicantEmail} to request the resume file.`, 'info');
        }
    }

    // SIMPLIFIED: Download current resume
    async downloadCurrentResume() {
        if (!this.currentResumeData) {
            this.showAlert('No resume available for download', 'error');
            return;
        }

        try {
            console.log('Downloading resume:', this.currentResumeData.name);
            
            if (this.currentResumeData.data) {
                const link = document.createElement('a');
                link.href = this.currentResumeData.data;
                link.download = this.currentResumeData.name;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (this.currentResumeData.id && window.resumeStorage) {
                await window.resumeStorage.init();
                const resumeRecord = await window.resumeStorage.getResume(this.currentResumeData.id);
                if (resumeRecord) {
                    window.resumeStorage.downloadResume(resumeRecord);
                } else {
                    throw new Error('Resume not found in storage');
                }
            } else {
                throw new Error('No resume data available');
            }
            
            this.showAlert('Resume download started', 'success');
            
        } catch (error) {
            console.error('Error downloading resume:', error);
            this.showAlert('Error downloading resume: ' + error.message, 'error');
        }
    }

    // Format File Size
    formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // View Candidate Profile
    viewCandidateProfile(applicantUserId) {
        console.log(`Viewing candidate profile for user ID: ${applicantUserId}`);
        
        const candidate = window.AuthUtils.getAllUsers().find(u => u.id === applicantUserId && u.userType === 'worker');
        if (!candidate) {
            this.showAlert('Candidate profile not found', 'error');
            console.error(`Candidate not found or not a worker type for ID: ${applicantUserId}`);
            return;
        }
        
        console.log(`Found candidate: ${candidate.name} (${candidate.userType})`);
        
        sessionStorage.removeItem('viewingProfileId');
        sessionStorage.removeItem('profileViewMode');
        
        sessionStorage.setItem('viewingProfileId', applicantUserId);
        sessionStorage.setItem('profileViewMode', 'view');
        
        console.log(`Stored viewing profile ID: ${applicantUserId} for candidate: ${candidate.name}`);
        
        window.location.href = 'profile.html';
    }

    // Authentication & User Management
    setupAuth() {
        const userName = document.getElementById('user-name');
        const userInitials = document.getElementById('user-initials');
        const userAvatar = document.getElementById('user-avatar');
        
        if (userName && this.currentUser.name) userName.textContent = this.currentUser.name;
        if (userInitials && this.currentUser.avatar) userInitials.textContent = this.currentUser.avatar.initials;
        if (userAvatar && this.currentUser.avatar) userAvatar.style.background = this.currentUser.avatar.color;

        const userProfile = document.getElementById('user-profile');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        
        if (userProfile && userMenuDropdown) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('show');
            });
        }

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

    // Company Profile Management
    setupCompanyProfile() {
        const editProfileBtn = document.getElementById('edit-company-profile-btn');
        const previewProfileBtn = document.getElementById('preview-company-profile-btn');

        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.saveEmployerProfile();
                
                sessionStorage.removeItem('viewingProfileId');
                sessionStorage.removeItem('profileViewMode');
                window.location.href = 'profile.html';
            });
        }

        if (previewProfileBtn) {
            previewProfileBtn.addEventListener('click', () => {
                this.previewCompanyProfile();
            });
        }
    }

    loadProfileData() {
        const stored = localStorage.getItem(`careerConnect_profile_${this.currentUser.id}`);
        const defaultProfile = {
            displayName: this.currentUser.companyName || this.currentUser.name,
            email: this.currentUser.email || '',
            companyDescription: '',
            industry: '',
            companySize: '',
            founded: '',
            headquarters: '',
            companyEmail: '',
            companyPhone: '',
            companyWebsite: '',
            companyLinkedIn: '',
            culture: '',
            memberSince: this.currentUser.createdAt || new Date().toISOString()
        };

        const profileData = stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
        
        if (!stored) {
            setTimeout(() => this.saveEmployerProfile(), 100);
        }
        
        return profileData;
    }

    saveEmployerProfile() {
        const profileData = {
            displayName: this.currentUser.companyName || this.currentUser.name,
            email: this.currentUser.email || '',
            companyDescription: this.profileData.companyDescription || '',
            industry: this.profileData.industry || '',
            companySize: this.profileData.companySize || '',
            founded: this.profileData.founded || '',
            headquarters: this.profileData.headquarters || '',
            companyEmail: this.profileData.companyEmail || '',
            companyPhone: this.profileData.companyPhone || '',
            companyWebsite: this.profileData.companyWebsite || '',
            companyLinkedIn: this.profileData.companyLinkedIn || '',
            culture: this.profileData.culture || '',
            memberSince: this.currentUser.createdAt || new Date().toISOString()
        };
        
        localStorage.setItem(`careerConnect_profile_${this.currentUser.id}`, JSON.stringify(profileData));
        console.log(`Employer profile saved for user ${this.currentUser.id}:`, profileData);
    }

    renderCompanyProfile() {
        const companyAvatar = document.getElementById('company-avatar-display');
        const companyInitials = document.getElementById('company-initials-display');
        const companyName = document.getElementById('company-name-display');
        const companyRole = document.getElementById('company-role-display');
        const companyIndustry = document.getElementById('company-industry-display');

        if (companyAvatar) companyAvatar.style.background = this.currentUser.avatar.color;
        if (companyInitials) companyInitials.textContent = this.currentUser.avatar.initials;
        if (companyName) companyName.textContent = this.currentUser.companyName || this.currentUser.name;
        if (companyRole) companyRole.textContent = 'Employer';
        if (companyIndustry) companyIndustry.textContent = this.profileData.industry || 'Industry not specified';

        this.updateProfileSectionPreviews();
        this.updateProfileCompletion();
        
        this.saveEmployerProfile();
    }

    updateProfileSectionPreviews() {
        const overviewPreview = document.getElementById('company-overview-preview');
        if (overviewPreview) {
            overviewPreview.textContent = this.profileData.companyDescription 
                ? this.profileData.companyDescription.substring(0, 80) + '...'
                : 'Add a compelling company description...';
        }

        const detailsPreview = document.getElementById('company-details-preview');
        if (detailsPreview) {
            const details = [
                this.profileData.industry,
                this.profileData.companySize,
                this.profileData.headquarters
            ].filter(Boolean);
            
            detailsPreview.textContent = details.length > 0 
                ? details.join(', ')
                : 'Industry, size, location...';
        }

        const contactPreview = document.getElementById('company-contact-preview');
        if (contactPreview) {
            const contacts = [
                this.profileData.companyWebsite,
                this.profileData.companyEmail,
                this.profileData.companyLinkedIn
            ].filter(Boolean);
            
            contactPreview.textContent = contacts.length > 0 
                ? contacts.length + ' contact method(s) added'
                : 'Website, email, social media...';
        }

        const culturePreview = document.getElementById('company-culture-preview');
        if (culturePreview) {
            culturePreview.textContent = this.profileData.culture 
                ? this.profileData.culture.substring(0, 80) + '...'
                : 'Share your company culture...';
        }
    }

    updateCompanyProfileData(field, value) {
        this.profileData[field] = value;
        this.saveEmployerProfile();
        this.updateProfileSectionPreviews();
        this.updateProfileCompletion();
    }

    updateProfileCompletion() {
        const sections = [
            { key: 'companyDescription', element: 'overview-status' },
            { key: 'industry', element: 'details-status' },
            { key: 'companyEmail', element: 'contact-status' },
            { key: 'culture', element: 'culture-status' }
        ];

        let completedSections = 0;
        
        sections.forEach(section => {
            const isComplete = this.profileData[section.key] && this.profileData[section.key].trim();
            const statusElement = document.getElementById(section.element);
            
            if (statusElement) {
                if (isComplete) {
                    statusElement.textContent = 'Complete';
                    statusElement.className = 'status-badge complete';
                    completedSections++;
                } else {
                    statusElement.textContent = 'Incomplete';
                    statusElement.className = 'status-badge incomplete';
                }
            }
        });

        const percentage = Math.round((completedSections / sections.length) * 100);
        const percentageElement = document.getElementById('profile-completion-percentage');
        const fillElement = document.getElementById('profile-completion-fill');
        
        if (percentageElement) percentageElement.textContent = percentage + '%';
        if (fillElement) fillElement.style.width = percentage + '%';

        this.updateProfileTips(completedSections, sections.length);
    }

    updateProfileTips(completed, total) {
        const tipsElement = document.getElementById('profile-tips-list');
        if (!tipsElement) return;

        const tips = [];
        if (!this.profileData.companyDescription) tips.push('Add company description');
        if (!this.profileData.industry) tips.push('Specify industry and company size');
        if (!this.profileData.companyEmail) tips.push('Add contact information');
        if (!this.profileData.culture) tips.push('Share company culture and values');

        if (tips.length === 0) {
            tipsElement.innerHTML = '<li>✓ Profile complete! You\'re ready to attract top talent.</li>';
        } else {
            tipsElement.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');
        }
    }

    previewCompanyProfile() {
        const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
        if (previewWindow) {
            previewWindow.document.write(this.generateCompanyProfilePreviewHTML());
            previewWindow.document.close();
            previewWindow.focus();
        } else {
            this.showAlert('Please allow popups to view the profile preview', 'warning');
        }
    }

    generateCompanyProfilePreviewHTML() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Company Profile Preview - ${this.currentUser.companyName || this.currentUser.name}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        max-width: 800px; 
                        margin: 20px auto; 
                        padding: 20px; 
                        line-height: 1.6;
                        color: #333;
                        background: #f8f9fa;
                    }
                    .profile-card { 
                        background: white;
                        border: 1px solid #ddd; 
                        border-radius: 15px; 
                        padding: 30px; 
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                        margin-bottom: 20px;
                    }
                    .profile-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #f0f0f0;
                    }
                    .company-avatar {
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: ${this.currentUser.avatar.color};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 2em;
                        font-weight: bold;
                        margin-right: 20px;
                    }
                    .company-info h1 {
                        margin: 0;
                        color: #333;
                        font-size: 2.5em;
                    }
                    .company-info .subtitle {
                        color: #667eea;
                        font-size: 1.2em;
                        margin: 5px 0;
                    }
                    .company-meta {
                        color: #666;
                        margin: 10px 0;
                    }
                    .section { 
                        margin-bottom: 30px; 
                    }
                    .section-title { 
                        font-weight: bold; 
                        margin-bottom: 15px; 
                        font-size: 1.3em;
                        color: #333;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #f0f0f0;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                    .section-content {
                        line-height: 1.7;
                        color: #555;
                    }
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 15px;
                        margin-top: 15px;
                    }
                    .info-item {
                        padding: 15px;
                        background: #f8f9fa;
                        border-radius: 8px;
                        border-left: 4px solid #667eea;
                    }
                    .info-item strong {
                        display: block;
                        color: #333;
                        margin-bottom: 5px;
                    }
                    .header-note {
                        background: #e3f2fd;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        border-left: 4px solid #2196f3;
                        font-style: italic;
                        color: #1976d2;
                    }
                </style>
            </head>
            <body>
                <div class="header-note">
                    👀 This is a preview of how your company profile appears to job seekers
                </div>
                
                <div class="profile-card">
                    <div class="profile-header">
                        <div class="company-avatar">
                            <span>${this.currentUser.avatar.initials}</span>
                        </div>
                        <div class="company-info">
                            <h1>${this.currentUser.companyName || this.currentUser.name}</h1>
                            <p class="subtitle">Employer</p>
                            <div class="company-meta">
                                ${this.profileData.industry ? `<span>🏭 ${this.profileData.industry}</span>` : ''}
                                ${this.profileData.headquarters ? ` • <span>📍 ${this.profileData.headquarters}</span>` : ''}
                                ${this.profileData.companySize ? ` • <span>👥 ${this.profileData.companySize}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    ${this.profileData.companyDescription ? `
                        <div class="section">
                            <div class="section-title">
                                <i class="fas fa-building"></i>
                                About Our Company
                            </div>
                            <div class="section-content">${this.profileData.companyDescription}</div>
                        </div>
                    ` : ''}
                    
                    <div class="section">
                        <div class="section-title">
                            <i class="fas fa-info-circle"></i>
                            Company Information
                        </div>
                        <div class="info-grid">
                            ${this.profileData.industry ? `
                                <div class="info-item">
                                    <strong>Industry</strong>
                                    ${this.profileData.industry}
                                </div>
                            ` : ''}
                            ${this.profileData.companySize ? `
                                <div class="info-item">
                                    <strong>Company Size</strong>
                                    ${this.profileData.companySize}
                                </div>
                            ` : ''}
                            ${this.profileData.founded ? `
                                <div class="info-item">
                                    <strong>Founded</strong>
                                    ${this.profileData.founded}
                                </div>
                            ` : ''}
                            ${this.profileData.headquarters ? `
                                <div class="info-item">
                                    <strong>Headquarters</strong>
                                    ${this.profileData.headquarters}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${(this.profileData.companyEmail || this.profileData.companyWebsite || this.profileData.companyLinkedIn) ? `
                        <div class="section">
                            <div class="section-title">
                                <i class="fas fa-link"></i>
                                Contact & Social Media
                            </div>
                            <div class="info-grid">
                                ${this.profileData.companyEmail ? `
                                    <div class="info-item">
                                        <strong>Email</strong>
                                        ${this.profileData.companyEmail}
                                    </div>
                                ` : ''}
                                ${this.profileData.companyWebsite ? `
                                    <div class="info-item">
                                        <strong>Website</strong>
                                        <a href="${this.profileData.companyWebsite}" target="_blank">${this.profileData.companyWebsite}</a>
                                    </div>
                                ` : ''}
                                ${this.profileData.companyLinkedIn ? `
                                    <div class="info-item">
                                        <strong>LinkedIn</strong>
                                        <a href="${this.profileData.companyLinkedIn}" target="_blank">${this.profileData.companyLinkedIn}</a>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${this.profileData.culture ? `
                        <div class="section">
                            <div class="section-title">
                                <i class="fas fa-heart"></i>
                                Company Culture & Values
                            </div>
                            <div class="section-content">${this.profileData.culture}</div>
                        </div>
                    ` : ''}
                </div>
            </body>
            </html>
        `;
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
            case 'applicants':
                this.renderApplicants();
                this.updateJobFilter();
                break;
            case 'messages':
                this.renderConversations();
                break;
            case 'my-jobs':
                this.renderJobs();
                break;
            case 'chat-requests':
                this.renderChatRequests();
                break;
            case 'interviews':
                this.renderInterviews();
                break;
            case 'company-profile':
                this.renderCompanyProfile();
                break;
        }
    }

    // Job Form Setup
    setupJobForm() {
        const form = document.getElementById('job-form');
        const previewBtn = document.getElementById('preview-btn');
        
        if (!form) {
            console.error('Job form not found');
            return;
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitJob(form);
        });

        if (previewBtn) {
            previewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.previewJob(form);
            });
        }

        const companyField = document.getElementById('company-name');
        if (companyField && this.currentUser.companyName) {
            companyField.value = this.currentUser.companyName;
        }

        this.setupFormValidation(form);
    }

    setupFormValidation(form) {
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => {
                this.validateField(field);
            });

            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.validateField(field);
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldGroup = field.closest('.form-group');
        
        if (!fieldGroup) return true;

        let isValid = true;
        let errorMessage = '';

        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        fieldGroup.classList.remove('error');
        const existingError = fieldGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        if (!isValid) {
            fieldGroup.classList.add('error');
            const errorEl = document.createElement('div');
            errorEl.className = 'error-message';
            errorEl.textContent = errorMessage;
            fieldGroup.appendChild(errorEl);
        }

        return isValid;
    }

    // Submit Job Function
    submitJob(form) {
        console.log('Submitting job...');
        
        const requiredFields = form.querySelectorAll('[required]');
        let isFormValid = true;
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            this.showAlert('Please fix the errors in the form before submitting', 'error');
            return;
        }

        const jobData = {
            id: Date.now().toString(),
            employerId: this.currentUser.id,
            title: document.getElementById('job-title').value.trim(),
            company: document.getElementById('company-name').value.trim(),
            location: document.getElementById('job-location').value.trim(),
            jobType: document.getElementById('job-type').value,
            experienceLevel: document.getElementById('experience-level').value,
            salary: document.getElementById('salary-range').value.trim() || 'Competitive',
            description: document.getElementById('job-description').value.trim(),
            requirements: document.getElementById('job-requirements').value.trim() || '',
            email: document.getElementById('contact-email').value.trim(),
            datePosted: new Date().toISOString(),
            views: 0,
            isActive: true
        };

        if (!jobData.title || !jobData.company || !jobData.location || 
            !jobData.jobType || !jobData.experienceLevel || !jobData.description || !jobData.email) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        try {
            const editingId = form.getAttribute('data-editing');
            if (editingId) {
                const jobIndex = this.jobs.findIndex(j => j.id === editingId);
                if (jobIndex > -1) {
                    this.jobs[jobIndex] = { ...this.jobs[jobIndex], ...jobData, id: editingId };
                    this.showAlert('Job updated successfully!', 'success');
                }
                form.removeAttribute('data-editing');
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post Job';
                }
            } else {
                this.jobs.push(jobData);
                this.showAlert('Job posted successfully!', 'success');
            }

            this.saveJobs();
            form.reset();
            
            form.querySelectorAll('.form-group.error').forEach(group => {
                group.classList.remove('error');
                const errorMsg = group.querySelector('.error-message');
                if (errorMsg) errorMsg.remove();
            });
            
            this.renderJobs();
            this.updateStats();
            this.updateJobFilter();
            
            setTimeout(() => {
                this.showSection('my-jobs');
            }, 1500);

        } catch (error) {
            console.error('Error submitting job:', error);
            this.showAlert('An error occurred while posting the job. Please try again.', 'error');
        }
    }

    // Preview Job Function
    previewJob(form) {
        const jobData = {
            title: document.getElementById('job-title').value.trim() || 'Job Title',
            company: document.getElementById('company-name').value.trim() || 'Company Name',
            location: document.getElementById('job-location').value.trim() || 'Location',
            jobType: document.getElementById('job-type').value || 'Job Type',
            experienceLevel: document.getElementById('experience-level').value || 'Experience Level',
            salary: document.getElementById('salary-range').value.trim() || 'Competitive',
            description: document.getElementById('job-description').value.trim() || 'Job description...',
            requirements: document.getElementById('job-requirements').value.trim() || 'Requirements...',
            email: document.getElementById('contact-email').value.trim() || 'contact@company.com'
        };

        try {
            const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
            if (previewWindow) {
                previewWindow.document.write(this.generateJobPreviewHTML(jobData));
                previewWindow.document.close();
                previewWindow.focus();
            } else {
                this.showAlert('Please allow popups to view the job preview', 'warning');
            }
        } catch (error) {
            console.error('Error opening preview:', error);
            this.showAlert('Error opening preview. Please check your browser settings.', 'error');
        }
    }

    generateJobPreviewHTML(job) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Job Preview - ${job.title}</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        max-width: 800px; 
                        margin: 20px auto; 
                        padding: 20px; 
                        line-height: 1.6;
                        color: #333;
                        background: #f8f9fa;
                    }
                    .job-card { 
                        background: white;
                        border: 1px solid #ddd; 
                        border-radius: 12px; 
                        padding: 30px; 
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    }
                    .job-title { 
                        font-size: 2em; 
                        color: #333; 
                        margin-bottom: 10px; 
                        font-weight: bold;
                    }
                    .job-company { 
                        color: #667eea; 
                        font-weight: bold; 
                        margin-bottom: 20px; 
                        font-size: 1.2em;
                    }
                    .job-meta { 
                        display: flex; 
                        gap: 15px; 
                        margin-bottom: 25px; 
                        flex-wrap: wrap;
                    }
                    .job-meta span { 
                        background: #f0f0f0; 
                        padding: 8px 15px; 
                        border-radius: 20px; 
                        font-size: 0.9em; 
                        color: #666;
                        display: flex;
                        align-items: center;
                        gap: 5px;
                    }
                    .salary-badge {
                        background: linear-gradient(135deg, #667eea, #764ba2) !important;
                        color: white !important;
                        font-weight: bold;
                    }
                    .section { 
                        margin-bottom: 25px; 
                    }
                    .section-title { 
                        font-weight: bold; 
                        margin-bottom: 10px; 
                        font-size: 1.1em;
                        color: #333;
                        padding-bottom: 5px;
                        border-bottom: 2px solid #f0f0f0;
                    }
                    .content {
                        white-space: pre-wrap;
                        line-height: 1.7;
                    }
                    .header-note {
                        background: #e3f2fd;
                        padding: 15px;
                        border-radius: 8px;
                        margin-bottom: 20px;
                        border-left: 4px solid #2196f3;
                        font-style: italic;
                        color: #1976d2;
                    }
                </style>
            </head>
            <body>
                <div class="header-note">
                    👁️ This is a preview of how your job posting will appear to candidates
                </div>
                <div class="job-card">
                    <h1 class="job-title">${job.title}</h1>
                    <p class="job-company">${job.company}</p>
                    <div class="job-meta">
                        <span>📍 ${job.location}</span>
                        <span>💼 ${this.formatJobType(job.jobType)}</span>
                        <span>📊 ${this.formatExperience(job.experienceLevel)}</span>
                        <span class="salary-badge">💰 ${job.salary}</span>
                    </div>
                    <div class="section">
                        <div class="section-title">Job Description</div>
                        <div class="content">${job.description}</div>
                    </div>
                    ${job.requirements && job.requirements !== 'Requirements...' ? `
                        <div class="section">
                            <div class="section-title">Requirements</div>
                            <div class="content">${job.requirements}</div>
                        </div>
                    ` : ''}
                    <div class="section">
                        <div class="section-title">Contact Information</div>
                        <div class="content">📧 ${job.email}</div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

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

    // SIMPLIFIED: Applicants System
    setupApplicants() {
        console.log('Setting up applicants system...');
        
        const jobFilter = document.getElementById('job-filter');
        const statusFilter = document.getElementById('status-filter');

        if (jobFilter) {
            jobFilter.addEventListener('change', () => this.filterApplicants());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterApplicants());
        }

        this.setupApplicantModal();
    }

    setupApplicantModal() {
        const modal = document.getElementById('applicant-modal');
        const closeBtn = document.getElementById('close-applicant-modal');
        const updateStatusBtn = document.getElementById('update-status-btn');
        const startChatBtn = document.getElementById('start-chat-btn');
        const scheduleInterviewBtn = document.getElementById('schedule-interview-btn');
        const viewProfileBtn = document.getElementById('view-profile-btn');
        const viewResumeBtn = document.getElementById('view-resume-btn');
        const downloadResumeBtn = document.getElementById('download-resume-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (updateStatusBtn) {
            updateStatusBtn.addEventListener('click', () => {
                this.updateApplicationStatus();
            });
        }

        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => {
                this.startChatWithApplicant();
            });
        }

        if (scheduleInterviewBtn) {
            scheduleInterviewBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                this.showScheduleInterviewModal(this.currentApplicantId);
            });
        }

        if (viewProfileBtn) {
            viewProfileBtn.addEventListener('click', () => {
                const application = this.applicants.find(app => app.id === this.currentApplicantId);
                if (application && application.userId) {
                    this.viewCandidateProfile(application.userId);
                } else {
                    this.showAlert('Unable to view profile - user information not available', 'error');
                }
            });
        }

        // SIMPLIFIED: View Resume Button
        if (viewResumeBtn) {
            viewResumeBtn.addEventListener('click', () => {
                const application = this.applicants.find(app => app.id === this.currentApplicantId);
                console.log('View resume clicked for application:', application?.id);
                
                if (application?.resume) {
                    console.log('Resume found, attempting to view:', application.resume.name);
                    this.viewResume(application.resume);
                } else {
                    console.error('Resume not available for application:', application?.id);
                    this.showAlert('Resume not available', 'error');
                }
            });
        }

        // SIMPLIFIED: Download Resume Button
        if (downloadResumeBtn) {
            downloadResumeBtn.addEventListener('click', () => {
                const application = this.applicants.find(app => app.id === this.currentApplicantId);
                console.log('Download resume clicked for application:', application?.id);
                
                if (application?.resume) {
                    this.currentResumeData = application.resume;
                    this.downloadCurrentResume();
                } else {
                    console.error('Resume not available for download:', application?.id);
                    this.showAlert('Resume not available for download', 'error');
                }
            });
        }
    }

    renderApplicants() {
        console.log('Rendering applicants...');
        
        const employerJobIds = this.jobs
            .filter(job => job.employerId === this.currentUser.id)
            .map(job => job.id);

        const employerApplicants = this.applicants.filter(app => 
            employerJobIds.includes(app.jobId)
        );

        console.log(`Found ${employerApplicants.length} applicants for ${employerJobIds.length} jobs`);
        
        // SIMPLIFIED: Log resume info for debugging
        employerApplicants.forEach(app => {
            console.log(`Applicant ${app.applicantName}:`, {
                hasResume: !!app.resume,
                resumeName: app.resume?.name,
                resumeSize: app.resume?.size,
                hasData: !!app.resume?.data
            });
        });

        this.filteredApplicants = employerApplicants;
        
        const container = document.getElementById('applicants-container');
        if (!container) return;

        if (employerApplicants.length === 0) {
            container.innerHTML = `
                <div class="no-applicants">
                    <i class="fas fa-users"></i>
                    <h3>No applications yet</h3>
                    <p>Applications will appear here when candidates apply to your jobs</p>
                </div>
            `;
            return;
        }

        this.filterApplicants();
    }

    filterApplicants() {
        const jobFilter = document.getElementById('job-filter');
        const statusFilter = document.getElementById('status-filter');
        const container = document.getElementById('applicants-container');

        if (!container) return;

        const jobFilterValue = jobFilter ? jobFilter.value : '';
        const statusFilterValue = statusFilter ? statusFilter.value : '';

        const employerJobIds = this.jobs
            .filter(job => job.employerId === this.currentUser.id)
            .map(job => job.id);

        let filteredApplicants = this.applicants.filter(app => 
            employerJobIds.includes(app.jobId)
        );

        if (jobFilterValue) {
            filteredApplicants = filteredApplicants.filter(app => app.jobId === jobFilterValue);
        }

        if (statusFilterValue) {
            filteredApplicants = filteredApplicants.filter(app => app.status === statusFilterValue);
        }

        if (filteredApplicants.length === 0) {
            container.innerHTML = `
                <div class="no-applicants">
                    <i class="fas fa-users"></i>
                    <h3>No applications match your filters</h3>
                    <p>Try adjusting your filter criteria</p>
                </div>
            `;
            return;
        }

        filteredApplicants.sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));

        const applicantsHTML = filteredApplicants.map(app => this.createApplicantCardHTML(app)).join('');
        container.innerHTML = applicantsHTML;

        this.setupApplicantCardInteractions();
    }

    // SIMPLIFIED: Create Applicant Card HTML
    createApplicantCardHTML(application) {
        const job = this.jobs.find(j => j.id === application.jobId);
        if (!job) return '';

        const applicationDate = new Date(application.applicationDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const statusClass = `status-${application.status}`;
        const statusText = this.formatApplicationStatus(application.status);

        const initials = application.applicantName.split(' ').map(n => n[0]).join('').toUpperCase();
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        const avatarColor = colors[Math.abs(application.applicantName.length) % colors.length];

        // SIMPLIFIED: Resume detection
        const hasResume = !!(application.resume && application.resume.name);
        
        console.log(`Resume check for ${application.applicantName}:`, {
            hasResumeProperty: !!application.resume,
            hasName: !!(application.resume?.name),
            hasData: !!(application.resume?.data),
            finalHasResume: hasResume
        });

        // SIMPLIFIED: Resume display
        let resumeDisplay = '';
        if (hasResume) {
            const resumeSize = application.resume.size ? 
                          this.formatFileSize(application.resume.size) : 'Unknown size';
            const resumeType = application.resume.type?.includes('pdf') ? 'PDF' : 'IMAGE';
            
            resumeDisplay = `
                <p><i class="fas fa-paperclip" style="color: #28a745;"></i> 
                   Resume: ${application.resume.name} (${resumeSize}, ${resumeType})</p>
            `;
        } else {
            resumeDisplay = `
                <p><i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i> 
                   No resume attached</p>
            `;
        }

        return `
            <div class="applicant-card" data-application-id="${application.id}">
                <div class="applicant-header">
                    <div class="applicant-avatar" style="background: ${avatarColor}">
                        <span>${initials}</span>
                    </div>
                    <div class="applicant-info">
                        <h3>${application.applicantName}</h3>
                        <p><i class="fas fa-envelope"></i> ${application.applicantEmail}</p>
                        ${application.applicantPhone ? `<p><i class="fas fa-phone"></i> ${application.applicantPhone}</p>` : ''}
                        ${resumeDisplay}
                    </div>
                    <div class="application-status ${statusClass}">
                        ${statusText}
                    </div>
                </div>
                
                <div class="application-meta">
                    <span><i class="fas fa-briefcase"></i> ${job.title}</span>
                    <span><i class="fas fa-calendar"></i> Applied ${applicationDate}</span>
                    <span><i class="fas fa-building"></i> ${job.company}</span>
                </div>
                
                ${application.coverLetter ? `
                    <div class="application-preview">
                        <strong>Cover Letter:</strong>
                        ${application.coverLetter.substring(0, 150)}${application.coverLetter.length > 150 ? '...' : ''}
                    </div>
                ` : ''}

                <div class="applicant-quick-actions">
                    ${hasResume ? `
                        <button class="btn btn-outline quick-view-resume" data-application-id="${application.id}">
                            <i class="fas fa-file-alt"></i> View Resume
                        </button>
                    ` : ''}
                    <button class="btn btn-outline quick-view-profile" data-application-id="${application.id}">
                        <i class="fas fa-user"></i> View Profile
                    </button>
                    ${application.status === 'shortlisted' ? `
                        <button class="btn btn-primary quick-chat" data-application-id="${application.id}">
                            <i class="fas fa-comments"></i> Chat
                        </button>
                        <button class="btn btn-secondary quick-interview" data-application-id="${application.id}">
                            <i class="fas fa-calendar-plus"></i> Interview
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupApplicantCardInteractions() {
        document.querySelectorAll('.applicant-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.applicant-quick-actions')) return;
                
                const applicationId = card.getAttribute('data-application-id');
                this.showApplicantDetails(applicationId);
            });
        });

        document.querySelectorAll('.quick-chat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const applicationId = btn.getAttribute('data-application-id');
                this.showSendChatRequestModal(applicationId);
            });
        });

        document.querySelectorAll('.quick-interview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const applicationId = btn.getAttribute('data-application-id');
                this.showScheduleInterviewModal(applicationId);
            });
        });

        // SIMPLIFIED: Quick view resume button
        document.querySelectorAll('.quick-view-resume').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const applicationId = btn.getAttribute('data-application-id');
                const application = this.applicants.find(app => app.id === applicationId);
                
                console.log('Quick view resume clicked:', {
                    applicationId,
                    hasApplication: !!application,
                    hasResume: !!(application?.resume)
                });
                
                if (application?.resume) {
                    this.viewResume(application.resume);
                } else {
                    this.showAlert('Resume not available', 'error');
                }
            });
        });

        document.querySelectorAll('.quick-view-profile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const applicationId = btn.getAttribute('data-application-id');
                const application = this.applicants.find(app => app.id === applicationId);
                if (application && application.userId) {
                    this.viewCandidateProfile(application.userId);
                }
            });
        });
    }

    // SIMPLIFIED: Show Applicant Details
    showApplicantDetails(applicationId) {
        const application = this.applicants.find(app => app.id === applicationId);
        if (!application) {
            console.error('❌ Application not found:', applicationId);
            return;
        }

        const job = this.jobs.find(j => j.id === application.jobId);
        if (!job) {
            console.error('❌ Job not found for application:', application.jobId);
            return;
        }

        this.currentApplicantId = applicationId;

        const modal = document.getElementById('applicant-modal');
        
        // Populate modal fields
        const modalApplicantName = document.getElementById('modal-applicant-name');
        const modalApplicantEmail = document.getElementById('modal-applicant-email');
        const modalApplicantPhone = document.getElementById('modal-applicant-phone');
        const modalJobTitle = document.getElementById('modal-job-title');
        const modalApplicationDate = document.getElementById('modal-application-date');
        const modalCoverLetter = document.getElementById('modal-cover-letter');
        const applicationStatus = document.getElementById('application-status');

        if (modalApplicantName) modalApplicantName.textContent = application.applicantName;
        if (modalApplicantEmail) modalApplicantEmail.textContent = application.applicantEmail;
        if (modalApplicantPhone) modalApplicantPhone.textContent = application.applicantPhone || 'Not provided';
        if (modalJobTitle) modalJobTitle.textContent = job.title;
        if (modalApplicationDate) {
            modalApplicationDate.textContent = new Date(application.applicationDate).toLocaleDateString();
        }
        if (modalCoverLetter) {
            modalCoverLetter.textContent = application.coverLetter || 'No cover letter provided';
        }
        if (applicationStatus) applicationStatus.value = application.status;

        // Set applicant avatar
        const modalApplicantAvatar = document.getElementById('modal-applicant-avatar');
        const modalApplicantInitials = document.getElementById('modal-applicant-initials');
        if (modalApplicantAvatar && modalApplicantInitials) {
            const initials = application.applicantName.split(' ').map(n => n[0]).join('').toUpperCase();
            const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
            const avatarColor = colors[Math.abs(application.applicantName.length) % colors.length];
            
            modalApplicantInitials.textContent = initials;
            modalApplicantAvatar.style.background = avatarColor;
        }

        // SIMPLIFIED: Resume section handling
        const resumeSection = document.getElementById('resume-section');
        if (resumeSection) {
            console.log('Processing resume section for application:', application.id);
            
            // SIMPLIFIED: Check if resume exists
            const hasValidResume = !!(application.resume && application.resume.name);
            
            if (hasValidResume) {
                console.log('✅ Valid resume found, showing resume section');
                resumeSection.style.display = 'block';
                
                const resumeName = document.getElementById('resume-name');
                const resumeSize = document.getElementById('resume-size');
                const resumeIcon = resumeSection.querySelector('.resume-icon');
                
                if (resumeName) {
                    resumeName.textContent = application.resume.name;
                }
                
                if (resumeSize) {
                    const sizeText = application.resume.size ? 
                                   this.formatFileSize(application.resume.size) : 'Unknown size';
                    resumeSize.textContent = sizeText;
                }
                
                // Set appropriate icon
                if (resumeIcon) {
                    if (application.resume.type === 'application/pdf') {
                        resumeIcon.className = 'fas fa-file-pdf resume-icon';
                        resumeIcon.style.color = '#dc3545';
                    } else if (application.resume.type?.startsWith('image/')) {
                        resumeIcon.className = 'fas fa-file-image resume-icon';
                        resumeIcon.style.color = '#28a745';
                    } else {
                        resumeIcon.className = 'fas fa-file resume-icon';
                        resumeIcon.style.color = '#6c757d';
                    }
                }
                
            } else {
                console.log('❌ No valid resume found, hiding resume section');
                resumeSection.style.display = 'none';
            }
        }

        modal.classList.add('show');
    }

    updateApplicationStatus() {
        if (!this.currentApplicantId) return;

        const application = this.applicants.find(app => app.id === this.currentApplicantId);
        if (!application) return;

        const statusSelect = document.getElementById('application-status');
        const newStatus = statusSelect ? statusSelect.value : application.status;

        if (newStatus === application.status) {
            this.showAlert('Status is already set to this value', 'info');
            return;
        }

        application.status = newStatus;
        this.saveApplicants();

        const job = this.jobs.find(j => j.id === application.jobId);
        if (job) {
            this.sendNotificationToUser(application.userId, {
                type: 'application_status',
                title: 'Application Status Updated',
                message: `Your application for ${job.title} has been ${this.formatApplicationStatus(newStatus).toLowerCase()}`,
                data: { jobId: job.id, applicationId: application.id, status: newStatus }
            });
        }

        this.showAlert('Application status updated successfully!', 'success');
        this.renderApplicants();
        
        setTimeout(() => {
            document.getElementById('applicant-modal').classList.remove('show');
        }, 1500);
    }

    startChatWithApplicant() {
        if (!this.currentApplicantId) return;

        const application = this.applicants.find(app => app.id === this.currentApplicantId);
        if (!application) return;

        const existingConversation = this.conversations.find(conv => 
            conv.participants.includes(this.currentUser.id) && 
            conv.participants.includes(application.userId) &&
            conv.jobId === application.jobId
        );

        if (existingConversation) {
            document.getElementById('applicant-modal').classList.remove('show');
            this.showSection('messages');
            this.openConversation(existingConversation.id);
            return;
        }

        document.getElementById('applicant-modal').classList.remove('show');
        this.showSendChatRequestModal(this.currentApplicantId);
    }

    formatApplicationStatus(status) {
        const statuses = {
            'submitted': 'New Application',
            'reviewed': 'Reviewed',
            'shortlisted': 'Shortlisted',
            'rejected': 'Not Selected'
        };
        return statuses[status] || status;
    }

    updateJobFilter() {
        const jobFilter = document.getElementById('job-filter');
        if (!jobFilter) return;

        const employerJobs = this.jobs.filter(job => job.employerId === this.currentUser.id);
        
        while (jobFilter.children.length > 1) {
            jobFilter.removeChild(jobFilter.lastChild);
        }

        employerJobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.id;
            option.textContent = job.title;
            jobFilter.appendChild(option);
        });
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
        const incomingList = document.getElementById('incoming-requests-list');
        const outgoingList = document.getElementById('outgoing-requests-list');
        
        const incomingRequests = this.chatRequests.filter(req => 
            req.toUserId === this.currentUser.id
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const outgoingRequests = this.chatRequests.filter(req => 
            req.fromUserId === this.currentUser.id
        ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        document.getElementById('incoming-count').textContent = incomingRequests.length;
        document.getElementById('outgoing-count').textContent = outgoingRequests.length;
        
        const pendingIncoming = incomingRequests.filter(req => req.status === 'pending').length;
        const chatRequestsBadge = document.getElementById('chat-requests-badge');
        if (pendingIncoming > 0) {
            chatRequestsBadge.textContent = pendingIncoming;
            chatRequestsBadge.style.display = 'block';
        } else {
            chatRequestsBadge.style.display = 'none';
        }
        
        this.renderRequestsList(incomingList, incomingRequests, 'incoming');
        this.renderRequestsList(outgoingList, outgoingRequests, 'outgoing');
    }

    renderRequestsList(container, requests, type) {
        if (requests.length === 0) {
            container.innerHTML = `
                <div class="no-requests">
                    <i class="fas fa-${type === 'incoming' ? 'inbox' : 'paper-plane'}"></i>
                    <h3>No ${type} chat requests</h3>
                    <p>${type === 'incoming' ? 'Chat requests from job seekers will appear here' : 'Chat requests you send to candidates will appear here'}</p>
                </div>
            `;
            return;
        }

        const requestsHTML = requests.map(request => this.createRequestHTML(request, type)).join('');
        container.innerHTML = requestsHTML;

        this.setupRequestInteractions();
    }

    createRequestHTML(request, type) {
        const isIncoming = type === 'incoming';
        const otherUserId = isIncoming ? request.fromUserId : request.toUserId;
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
                
                ${request.status === 'pending' && isIncoming ? `
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

    sendChatRequestToWorker(workerId, jobId, message) {
        const chatRequest = {
            id: Date.now().toString(),
            fromUserId: this.currentUser.id,
            toUserId: workerId,
            jobId: jobId,
            message: message,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.chatRequests.push(chatRequest);
        this.saveChatRequests();

        const job = this.jobs.find(j => j.id === jobId);
        this.sendNotificationToUser(workerId, {
            type: 'chat_request',
            title: 'New Chat Request',
            message: `${this.currentUser.name} wants to chat about ${job ? job.title : 'a position'}`,
            data: { requestId: chatRequest.id, jobId: jobId }
        });

        this.showAlert('Chat request sent successfully!', 'success');
        this.renderChatRequests();
    }

    // Interview Management
    setupInterviews() {
        const interviewModal = document.getElementById('interview-modal');
        const closeBtn = document.getElementById('close-interview-modal');
        const cancelBtn = document.getElementById('cancel-interview');
        const form = document.getElementById('interview-form');
        const typeSelect = document.getElementById('interview-type');
        const locationGroup = document.getElementById('interview-location-group');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                interviewModal.classList.remove('show');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                interviewModal.classList.remove('show');
            });
        }

        if (typeSelect) {
            typeSelect.addEventListener('change', () => {
                if (typeSelect.value === 'in-person') {
                    locationGroup.style.display = 'block';
                    document.getElementById('interview-location').placeholder = 'Enter office address';
                    document.getElementById('interview-location').required = true;
                } else if (typeSelect.value === 'video') {
                    locationGroup.style.display = 'block';
                    document.getElementById('interview-location').placeholder = 'Enter meeting link (Zoom, Teams, etc.)';
                    document.getElementById('interview-location').required = true;
                } else if (typeSelect.value === 'phone') {
                    locationGroup.style.display = 'block';
                    document.getElementById('interview-location').placeholder = 'Enter phone number';
                    document.getElementById('interview-location').required = true;
                } else {
                    locationGroup.style.display = 'none';
                    document.getElementById('interview-location').required = false;
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.scheduleInterview();
            });
        }

        const dateInput = document.getElementById('interview-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
        }

        const statusFilter = document.getElementById('interview-status-filter');
        const dateFilter = document.getElementById('interview-date-filter');

        if (statusFilter) statusFilter.addEventListener('change', () => this.filterInterviews());
        if (dateFilter) dateFilter.addEventListener('change', () => this.filterInterviews());
    }

    showScheduleInterviewModal(applicantId) {
        const application = this.applicants.find(app => app.id === applicantId);
        if (!application) return;

        this.currentApplicantId = applicantId;
        document.getElementById('interview-modal').classList.add('show');
        
        document.getElementById('interview-form').reset();
        
        const job = this.jobs.find(j => j.id === application.jobId);
        if (job) {
            document.getElementById('interview-title').value = `Interview for ${job.title}`;
        }
    }

    scheduleInterview() {
        const application = this.applicants.find(app => app.id === this.currentApplicantId);
        if (!application) return;

        const interviewData = {
            id: Date.now().toString(),
            employerId: this.currentUser.id,
            applicantId: this.currentApplicantId,
            applicantUserId: application.userId,
            jobId: application.jobId,
            title: document.getElementById('interview-title').value,
            date: document.getElementById('interview-date').value,
            time: document.getElementById('interview-time').value,
            duration: parseInt(document.getElementById('interview-duration').value),
            type: document.getElementById('interview-type').value,
            location: document.getElementById('interview-location').value || null,
            notes: document.getElementById('interview-notes').value || null,
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };

        if (!interviewData.title || !interviewData.date || !interviewData.time || 
            !interviewData.duration || !interviewData.type) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        if ((interviewData.type === 'video' || interviewData.type === 'phone' || interviewData.type === 'in-person') 
            && !interviewData.location) {
            this.showAlert('Please provide location/meeting details', 'error');
            return;
        }

        this.interviews.push(interviewData);
        this.saveInterviews();

        const job = this.jobs.find(j => j.id === application.jobId);
        this.sendNotificationToUser(application.userId, {
            type: 'interview_scheduled',
            title: 'Interview Scheduled',
            message: `You have been scheduled for an interview for ${job ? job.title : 'a position'}`,
            data: { interviewId: interviewData.id, jobId: application.jobId }
        });

        document.getElementById('interview-modal').classList.remove('show');
        this.showAlert('Interview scheduled successfully!', 'success');
        
        this.renderInterviews();
        this.updateStats();
    }

    renderInterviews() {
        const container = document.getElementById('interviews-container');
        
        if (this.interviews.length === 0) {
            container.innerHTML = `
                <div class="no-interviews">
                    <i class="fas fa-calendar-check"></i>
                    <h3>No interviews scheduled</h3>
                    <p>Schedule interviews with your shortlisted candidates</p>
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
            interview.employerId === this.currentUser.id
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
        const application = this.applicants.find(app => app.id === interview.applicantId);
        const job = this.jobs.find(j => j.id === interview.jobId);
        
        if (!application || !job) return '';

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
                        <p class="interview-candidate">
                            <i class="fas fa-user"></i> ${application.applicantName}
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
                    <button class="btn btn-outline edit-interview" data-interview-id="${interview.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    ${interview.status === 'scheduled' ? `
                        <button class="btn btn-secondary complete-interview" data-interview-id="${interview.id}">
                            <i class="fas fa-check"></i> Mark Complete
                        </button>
                        <button class="btn btn-danger cancel-interview" data-interview-id="${interview.id}">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    setupInterviewInteractions() {
        document.querySelectorAll('.edit-interview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const interviewId = btn.getAttribute('data-interview-id');
                this.editInterview(interviewId);
            });
        });

        document.querySelectorAll('.complete-interview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const interviewId = btn.getAttribute('data-interview-id');
                this.completeInterview(interviewId);
            });
        });

        document.querySelectorAll('.cancel-interview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const interviewId = btn.getAttribute('data-interview-id');
                this.cancelInterview(interviewId);
            });
        });
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

    completeInterview(interviewId) {
        const interview = this.interviews.find(i => i.id === interviewId);
        if (!interview) return;

        interview.status = 'completed';
        this.saveInterviews();

        this.showAlert('Interview marked as completed', 'success');
        this.renderInterviews();
    }

    cancelInterview(interviewId) {
        if (!confirm('Are you sure you want to cancel this interview?')) return;

        const interview = this.interviews.find(i => i.id === interviewId);
        if (!interview) return;

        interview.status = 'cancelled';
        this.saveInterviews();

        this.sendNotificationToUser(interview.applicantUserId, {
            type: 'interview_cancelled',
            title: 'Interview Cancelled',
            message: `Your interview has been cancelled by the employer`,
            data: { interviewId: interview.id, jobId: interview.jobId }
        });

        this.showAlert('Interview cancelled', 'info');
        this.renderInterviews();
    }

    // Complete Chat System
    setupChat() {
        console.log('Setting up chat system...');
        this.setupChatRequestModal();
        this.setupSendChatRequestModal();
        this.checkPendingChatRequests();
    }

    setupChatRequestModal() {
        const modal = document.getElementById('chat-request-modal');
        const closeBtn = document.getElementById('close-chat-request');
        const acceptBtn = document.getElementById('accept-chat-request');
        const declineBtn = document.getElementById('decline-chat-request');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.acceptChatRequestFromModal();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                this.declineChatRequestFromModal();
            });
        }
    }

    setupSendChatRequestModal() {
        const modal = document.getElementById('send-chat-request-modal');
        const closeBtn = document.getElementById('close-send-chat-request');
        const cancelBtn = document.getElementById('cancel-send-chat-request');
        const form = document.getElementById('send-chat-request-form');

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
                this.submitSendChatRequest();
            });
        }
    }

    checkPendingChatRequests() {
       const pendingRequests = this.chatRequests.filter(req => 
           req.toUserId === this.currentUser.id && req.status === 'pending'
       );

       if (pendingRequests.length > 0) {
           this.showChatRequestModal(pendingRequests[0]);
       }
   }

   showChatRequestModal(request) {
       const modal = document.getElementById('chat-request-modal');
       const requesterName = document.getElementById('requester-name');
       const requesterInitials = document.getElementById('requester-initials');
       const requesterAvatar = document.getElementById('requester-avatar');
       const jobTitleRequest = document.getElementById('job-title-request');
       const requestMessageText = document.getElementById('request-message-text');

       const requester = window.AuthUtils.getAllUsers().find(u => u.id === request.fromUserId);
       const job = this.jobs.find(j => j.id === request.jobId);

       if (requester && job) {
           this.currentRequestId = request.id;
           
           if (requesterName) requesterName.textContent = requester.name;
           if (requesterInitials) requesterInitials.textContent = requester.avatar.initials;
           if (requesterAvatar) requesterAvatar.style.background = requester.avatar.color;
           if (jobTitleRequest) jobTitleRequest.textContent = job.title;
           if (requestMessageText) requestMessageText.textContent = request.message;

           modal.classList.add('show');
       }
   }

   acceptChatRequestFromModal() {
       if (!this.currentRequestId) return;
       this.acceptChatRequest(this.currentRequestId);
       document.getElementById('chat-request-modal').classList.remove('show');
       this.currentRequestId = null;
   }

   declineChatRequestFromModal() {
       if (!this.currentRequestId) return;
       this.declineChatRequest(this.currentRequestId);
       document.getElementById('chat-request-modal').classList.remove('show');
       this.currentRequestId = null;
   }

   showSendChatRequestModal(applicantId) {
       const application = this.applicants.find(app => app.id === applicantId);
       if (!application) return;

       this.currentApplicantId = applicantId;
       const job = this.jobs.find(j => j.id === application.jobId);
       
       const defaultMessage = `Hi ${application.applicantName}, I reviewed your application for the ${job ? job.title : 'position'} and would like to discuss it further with you.`;
       const messageField = document.getElementById('chat-request-message');
       if (messageField) {
           messageField.value = defaultMessage;
       }
       
       document.getElementById('send-chat-request-modal').classList.add('show');
   }

   submitSendChatRequest() {
       const messageField = document.getElementById('chat-request-message');
       const message = messageField ? messageField.value.trim() : '';
       const application = this.applicants.find(app => app.id === this.currentApplicantId);
       
       if (!message || !application) return;

       this.sendChatRequestToWorker(application.userId, application.jobId, message);
       document.getElementById('send-chat-request-modal').classList.remove('show');
   }

   // Render Conversations
   renderConversations() {
       console.log('Rendering conversations...');
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
                   <p>Accept chat requests to start conversations</p>
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

    // Notifications System
    setupNotifications() {
        console.log('Setup notifications...');
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
            'chat_request': 'comment-dots',
            'new_message': 'comment',
            'application': 'file-alt',
            'chat_started': 'comments',
            'chat_accepted': 'check-circle',
            'chat_declined': 'times-circle'
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
            case 'chat_request':
                const request = this.chatRequests.find(r => r.id === notification.data?.requestId);
                if (request && request.status === 'pending') {
                    this.showChatRequestModal(request);
                }
                break;
            case 'new_message':
            case 'chat_started':
                this.showSection('messages');
                if (notification.data?.conversationId) {
                    this.openConversation(notification.data.conversationId);
                }
                break;
            case 'application':
                this.showSection('applicants');
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
        const newApplicants = this.loadApplicants();
        const newConversations = this.loadConversations();
        const newNotifications = this.loadNotifications();
        const newChatRequests = this.loadChatRequests();

        if (newApplicants.length !== this.applicants.length) {
            this.applicants = newApplicants;
            const currentSection = document.querySelector('.section.active').id;
            if (currentSection === 'applicants') {
                this.renderApplicants();
            }
            this.updateStats();
        }

        const newPendingRequests = newChatRequests.filter(req => 
            req.toUserId === this.currentUser.id && 
            req.status === 'pending' &&
            !this.chatRequests.find(existing => existing.id === req.id)
        );

        if (newPendingRequests.length > 0) {
            this.chatRequests = newChatRequests;
            this.showChatRequestModal(newPendingRequests[0]);
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
    }

    // Enhanced Alert System
    showAlert(message, type = 'info') {
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

    // Utility Methods
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

    // Setup Modals
    setupModals() {
        console.log('Setup modals...');
        
        const successModal = document.getElementById('success-modal');
        const closeModalBtn = document.getElementById('close-modal');

        if (closeModalBtn && successModal) {
            closeModalBtn.addEventListener('click', () => {
                successModal.classList.remove('show');
            });
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    // Render Jobs
    renderJobs() {
        console.log('Rendering jobs...');
        const container = document.getElementById('employer-jobs');
        if (!container) return;

        const userJobs = this.jobs.filter(job => job.employerId === this.currentUser.id);
        
        if (userJobs.length === 0) {
            container.innerHTML = `
                <div class="no-jobs">
                    <i class="fas fa-briefcase"></i>
                    <h3>No jobs posted yet</h3>
                    <p>Start by creating your first job posting</p>
                    <button class="btn btn-primary" data-section="create-job">
                        <i class="fas fa-plus"></i> Post Your First Job
                    </button>
                </div>
            `;
            this.setupNavigation();
            return;
        }

        const jobsHTML = userJobs.map(job => this.createJobCardHTML(job)).join('');
        container.innerHTML = jobsHTML;
        this.setupJobActions();
    }

    createJobCardHTML(job) {
        const formattedDate = new Date(job.datePosted).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        return `
            <div class="job-card" data-job-id="${job.id}">
                <div class="job-header">
                    <div>
                        <h3 class="job-title">${job.title}</h3>
                        <p class="job-company">${job.company}</p>
                    </div>
                    <div class="job-status">
                        <span style="color: ${job.isActive ? '#28a745' : '#dc3545'}">
                            <i class="fas fa-circle" style="font-size: 0.8em;"></i>
                            ${job.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
                
                <div class="job-meta">
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-briefcase"></i> ${this.formatJobType(job.jobType)}</span>
                    <span><i class="fas fa-chart-line"></i> ${this.formatExperience(job.experienceLevel)}</span>
                    <span><i class="fas fa-dollar-sign"></i> ${job.salary}</span>
                </div>
                
                <div class="job-description">
                    ${job.description.substring(0, 150)}${job.description.length > 150 ? '...' : ''}
                </div>
                
                <div class="job-actions">
                    <button class="btn btn-secondary edit-job" data-job-id="${job.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-secondary toggle-job" data-job-id="${job.id}">
                        <i class="fas fa-${job.isActive ? 'pause' : 'play'}"></i> 
                        ${job.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-danger delete-job" data-job-id="${job.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                
                <div class="job-stats">
                    <span class="job-date">Posted on ${formattedDate}</span>
                    <span class="job-views"><i class="fas fa-eye"></i> ${job.views || 0} views</span>
                </div>
            </div>
        `;
    }

    setupJobActions() {
        document.querySelectorAll('.edit-job').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const jobId = e.target.closest('button').getAttribute('data-job-id');
                this.editJob(jobId);
            });
        });

        document.querySelectorAll('.toggle-job').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const jobId = e.target.closest('button').getAttribute('data-job-id');
                this.toggleJobStatus(jobId);
            });
        });

        document.querySelectorAll('.delete-job').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const jobId = e.target.closest('button').getAttribute('data-job-id');
                this.deleteJob(jobId);
            });
        });
    }

    editJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId && j.employerId === this.currentUser.id);
        if (!job) return;

        document.getElementById('job-title').value = job.title;
        document.getElementById('company-name').value = job.company;
        document.getElementById('job-location').value = job.location;
        document.getElementById('job-type').value = job.jobType;
        document.getElementById('experience-level').value = job.experienceLevel;
        document.getElementById('salary-range').value = job.salary;
        document.getElementById('job-description').value = job.description;
        document.getElementById('job-requirements').value = job.requirements;
        document.getElementById('contact-email').value = job.email;

        this.showSection('create-job');
        
        const form = document.getElementById('job-form');
        form.setAttribute('data-editing', jobId);
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Job';
        }
    }

    toggleJobStatus(jobId) {
        const job = this.jobs.find(j => j.id === jobId && j.employerId === this.currentUser.id);
        if (!job) return;

        job.isActive = !job.isActive;
        this.saveJobs();
        this.renderJobs();
        this.updateStats();
        
        this.showAlert(`Job ${job.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    }

    deleteJob(jobId) {
        if (!confirm('Are you sure you want to delete this job posting?')) return;

        this.jobs = this.jobs.filter(j => !(j.id === jobId && j.employerId === this.currentUser.id));
        this.saveJobs();
        this.renderJobs();
        this.updateStats();
        
        this.showAlert('Job deleted successfully', 'success');
    }

    updateStats() {
        const userJobs = this.jobs.filter(job => job.employerId === this.currentUser.id);
        const activeJobs = userJobs.filter(job => job.isActive).length;
        const totalViews = userJobs.reduce((sum, job) => sum + (job.views || 0), 0);
        
        const employerJobIds = userJobs.map(job => job.id);
        const totalApplicants = this.applicants.filter(app => 
            employerJobIds.includes(app.jobId)
        ).length;
        
        const totalInterviews = this.interviews.filter(interview => 
            interview.employerId === this.currentUser.id && interview.status === 'scheduled'
        ).length;

        const totalJobsEl = document.getElementById('total-jobs');
        const totalViewsEl = document.getElementById('total-views');
        const totalApplicantsEl = document.getElementById('total-applicants');
        const totalInterviewsEl = document.getElementById('total-interviews');
        const interviewsCountEl = document.getElementById('interviews-count');

        if (totalJobsEl) totalJobsEl.textContent = activeJobs;
        if (totalViewsEl) totalViewsEl.textContent = totalViews;
        if (totalApplicantsEl) totalApplicantsEl.textContent = totalApplicants;
        if (totalInterviewsEl) totalInterviewsEl.textContent = totalInterviews;
        if (interviewsCountEl) interviewsCountEl.textContent = totalInterviews;
    }

    // Data persistence methods
    loadJobs() {
        try {
            const stored = localStorage.getItem('careerPlatformJobs');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading jobs:', error);
            return [];
        }
    }

    saveJobs() {
        try {
            localStorage.setItem('careerPlatformJobs', JSON.stringify(this.jobs));
        } catch (error) {
            console.error('Error saving jobs:', error);
        }
    }

    loadApplicants() {
        try {
            const stored = localStorage.getItem('careerPlatformApplicants');
            const applicants = stored ? JSON.parse(stored) : [];
            
            // SIMPLIFIED: Log applicants data for debugging
            console.log(`Loaded ${applicants.length} applicants from storage`);
            applicants.forEach((app, index) => {
                if (app.resume) {
                    console.log(`Applicant ${index + 1}: ${app.applicantName}`, {
                        hasResume: true,
                        resumeName: app.resume.name,
                        resumeSize: app.resume.size,
                        resumeType: app.resume.type,
                        hasResumeData: !!(app.resume.data),
                        resumeDataLength: app.resume.data ? app.resume.data.length : 0
                    });
                } else {
                    console.log(`Applicant ${index + 1}: ${app.applicantName} - NO RESUME ATTACHED`);
                }
            });
            
            return applicants;
        } catch (error) {
            console.error('Error loading applicants:', error);
            return [];
        }
    }

    saveApplicants() {
        try {
            localStorage.setItem('careerPlatformApplicants', JSON.stringify(this.applicants));
        } catch (error) {
            console.error('Error saving applicants:', error);
        }
    }

    loadConversations() {
        try {
            const stored = localStorage.getItem('careerPlatformConversations');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading conversations:', error);
            return [];
        }
    }

    saveConversations() {
        try {
            localStorage.setItem('careerPlatformConversations', JSON.stringify(this.conversations));
        } catch (error) {
            console.error('Error saving conversations:', error);
        }
    }

    loadNotifications() {
        try {
            const stored = localStorage.getItem('careerPlatformNotifications');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading notifications:', error);
            return [];
        }
    }

    saveNotifications() {
        try {
            localStorage.setItem('careerPlatformNotifications', JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    loadChatRequests() {
        try {
            const stored = localStorage.getItem('careerPlatformChatRequests');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading chat requests:', error);
            return [];
        }
    }

    saveChatRequests() {
        try {
            localStorage.setItem('careerPlatformChatRequests', JSON.stringify(this.chatRequests));
        } catch (error) {
            console.error('Error saving chat requests:', error);
        }
    }

    loadInterviews() {
        try {
            const stored = localStorage.getItem('careerPlatformInterviews');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading interviews:', error);
            return [];
        }
    }

    saveInterviews() {
        try {
            localStorage.setItem('careerPlatformInterviews', JSON.stringify(this.interviews));
        } catch (error) {
            console.error('Error saving interviews:', error);
        }
    }
}

// Store employer instance globally for easy access from HTML onclick events
let employer;

// CSS animations for alerts and enhanced styles
const style = document.createElement('style');
style.textContent = `
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

   .form-group.error input,
   .form-group.error select,
   .form-group.error textarea {
       border-color: #dc3545 !important;
       box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
   }

   .error-message {
       color: #dc3545;
       font-size: 0.8rem;
       margin-top: 0.25rem;
       display: block;
   }

   .system-message {
       text-align: center;
       padding: 0.5rem;
       margin: 1rem 0;
       background: rgba(102, 126, 234, 0.1);
       border-radius: 20px;
       font-size: 0.9rem;
       color: #667eea;
       font-style: italic;
   }

   /* Company Profile Styles */
   .profile-overview-card {
       background: white;
       border-radius: 15px;
       padding: 2rem;
       margin-bottom: 2rem;
       box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
       border: 1px solid #f0f0f0;
   }

   .profile-card-header {
       display: flex;
       align-items: center;
       justify-content: space-between;
       margin-bottom: 2rem;
       flex-wrap: wrap;
       gap: 1rem;
   }

   .company-avatar {
       width: 80px;
       height: 80px;
       border-radius: 50%;
       background: linear-gradient(135deg, #667eea, #764ba2);
       display: flex;
       align-items: center;
       justify-content: center;
       color: white;
       font-size: 2em;
       font-weight: bold;
       margin-right: 1rem;
   }

   .company-basic-info h3 {
       margin: 0;
       color: #333;
       font-size: 1.8em;
   }

   .company-basic-info p {
       margin: 0.5rem 0;
       color: #666;
   }

   .profile-completion {
       background: #f8f9fa;
       padding: 1.5rem;
       border-radius: 12px;
       margin-top: 1.5rem;
   }

   .completion-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
       margin-bottom: 1rem;
   }

   .completion-percentage {
       font-weight: bold;
       color: #667eea;
       font-size: 1.1em;
   }

   .completion-bar {
       width: 100%;
       height: 8px;
       background: #e0e0e0;
       border-radius: 4px;
       overflow: hidden;
       margin-bottom: 1rem;
   }

   .completion-fill {
       height: 100%;
       background: linear-gradient(135deg, #667eea, #764ba2);
       transition: width 0.3s ease;
   }

   .completion-tips {
       margin-top: 1rem;
   }

   .profile-sections-grid {
       display: grid;
       grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
       gap: 1.5rem;
   }

   .profile-section-card {
       background: white;
       border-radius: 12px;
       padding: 1.5rem;
       box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
       border: 1px solid #f0f0f0;
       transition: all 0.3s ease;
       display: flex;
       align-items: flex-start;
       gap: 1rem;
   }

   .profile-section-card:hover {
       transform: translateY(-2px);
       box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
   }

   .section-icon {
       width: 50px;
       height: 50px;
       border-radius: 12px;
       background: linear-gradient(135deg, #667eea, #764ba2);
       display: flex;
       align-items: center;
       justify-content: center;
       color: white;
       font-size: 1.2em;
       flex-shrink: 0;
   }

   .section-info {
       flex: 1;
   }

   .section-info h4 {
       margin: 0 0 0.5rem 0;
       color: #333;
       font-size: 1.1em;
   }

   .section-info p {
       margin: 0;
       color: #666;
       font-size: 0.9em;
       line-height: 1.4;
   }

   .section-status {
       margin-left: auto;
       flex-shrink: 0;
   }

   .status-badge {
       padding: 0.25rem 0.75rem;
       border-radius: 15px;
       font-size: 0.8rem;
       font-weight: 600;
       text-transform: uppercase;
   }

   .status-badge.complete {
       background: rgba(40, 167, 69, 0.1);
       color: #28a745;
   }

   .status-badge.incomplete {
       background: rgba(255, 193, 7, 0.1);
       color: #ffc107;
   }

   /* Chat Requests Styles */
   .chat-requests-tabs {
       display: flex;
       margin-bottom: 2rem;
       background: #f8f9fa;
       border-radius: 12px;
       padding: 0.25rem;
   }

   .chat-requests-tabs .tab-btn {
       flex: 1;
       padding: 0.75rem 1rem;
       border: none;
       background: transparent;
       border-radius: 10px;
       font-weight: 600;
       cursor: pointer;
       transition: all 0.3s ease;
       color: #666;
       display: flex;
       align-items: center;
       gap: 0.5rem;
       justify-content: center;
   }

   .chat-requests-tabs .tab-btn.active {
       background: white;
       color: #667eea;
       box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
   }

   .tab-count {
       background: #667eea;
       color: white;
       font-size: 0.7rem;
       padding: 0.2rem 0.5rem;
       border-radius: 10px;
       min-width: 20px;
       text-align: center;
       font-weight: bold;
   }

   .requests-tab {
       display: none;
   }

   .requests-tab.active {
       display: block;
   }

   .request-item {
       background: white;
       border-radius: 15px;
       padding: 1.5rem;
       margin-bottom: 1rem;
       box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
       border: 1px solid #f0f0f0;
       transition: all 0.3s ease;
   }

   .request-item:hover {
       transform: translateY(-2px);
       box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
   }

   .request-header {
       display: flex;
       justify-content: space-between;
       align-items: flex-start;
       margin-bottom: 1rem;
   }

   .request-user {
       display: flex;
       gap: 1rem;
   }

   .request-avatar {
       width: 50px;
       height: 50px;
       border-radius: 50%;
       background: linear-gradient(135deg, #667eea, #764ba2);
       display: flex;
       align-items: center;
       justify-content: center;
       color: white;
       font-weight: bold;
       font-size: 1.1rem;
   }

   .request-info h4 {
       margin: 0;
       color: #333;
       font-size: 1.1rem;
   }

   .request-job {
       color: #667eea;
       font-size: 0.9rem;
       margin: 0.25rem 0;
       font-weight: 600;
   }

   .request-time {
       color: #999;
       font-size: 0.8rem;
       margin: 0;
   }

   .status-pending {
       background: rgba(255, 193, 7, 0.1);
       color: #ffc107;
   }

   .status-accepted {
       background: rgba(40, 167, 69, 0.1);
       color: #28a745;
   }

   .status-declined {
       background: rgba(220, 53, 69, 0.1);
       color: #dc3545;
   }

   .request-message {
       background: #f8f9fa;
       padding: 1rem;
       border-radius: 8px;
       margin-bottom: 1rem;
       border-left: 4px solid #667eea;
   }

   .request-message p {
       margin: 0;
       color: #666;
       line-height: 1.5;
   }

   .request-actions {
       display: flex;
       gap: 1rem;
       justify-content: flex-end;
   }

   .no-requests {
       text-align: center;
       padding: 4rem 2rem;
       color: #666;
   }

   .no-requests i {
       font-size: 4rem;
       color: #ddd;
       margin-bottom: 1rem;
   }

   .no-requests h3 {
       margin-bottom: 0.5rem;
       color: #333;
       font-size: 1.5rem;
   }

   /* Interview Styles */
   .interviews-filters {
       display: flex;
       gap: 1.5rem;
       margin-bottom: 2rem;
       padding: 1.5rem;
       background: #f8f9fa;
       border-radius: 15px;
       flex-wrap: wrap;
   }

   .interview-card {
       background: white;
       border-radius: 15px;
       padding: 2rem;
       margin-bottom: 1.5rem;
       box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
       border: 1px solid #f0f0f0;
       transition: all 0.3s ease;
       border-left: 4px solid #667eea;
   }

   .interview-card:hover {
       transform: translateY(-2px);
       box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
   }

   .interview-card.status-completed {
       border-left-color: #28a745;
   }

   .interview-card.status-cancelled {
       border-left-color: #dc3545;
       opacity: 0.7;
   }

   .interview-header {
       display: flex;
       justify-content: space-between;
       align-items: flex-start;
       margin-bottom: 1.5rem;
   }

   .interview-info h3 {
       margin: 0;
       color: #333;
       font-size: 1.3rem;
   }

   .interview-candidate {
       margin: 0.5rem 0;
       color: #667eea;
       font-weight: 600;
   }

   .interview-job {
       margin: 0;
       color: #666;
       font-size: 0.9rem;
   }

   .interview-details {
       display: grid;
       grid-template-columns: 1fr 1fr;
       gap: 2rem;
       margin-bottom: 1.5rem;
   }

   .interview-datetime p,
   .interview-type p {
       margin: 0.5rem 0;
       color: #666;
       display: flex;
       align-items: center;
       gap: 0.5rem;
   }

   .interview-location {
       font-style: italic;
       color: #999;
   }

   .interview-notes {
       background: #f8f9fa;
       padding: 1rem;
       border-radius: 8px;
       margin-bottom: 1.5rem;
   }

   .interview-actions {
       display: flex;
       gap: 1rem;
       justify-content: flex-end;
       flex-wrap: wrap;
   }

   .applicant-quick-actions {
       margin-top: 1rem;
       padding-top: 1rem;
       border-top: 1px solid #f0f0f0;
       display: flex;
       gap: 0.5rem;
       justify-content: center;
       flex-wrap: wrap;
   }

   .applicant-quick-actions .btn {
       font-size: 0.9rem;
       padding: 0.5rem 1rem;
   }

   .no-interviews {
       text-align: center;
       padding: 4rem 2rem;
       color: #666;
   }

   .no-interviews i {
       font-size: 4rem;
       color: #ddd;
       margin-bottom: 1rem;
   }

   /* Resume Viewer Styles */
   .resume-viewer-modal {
       position: fixed;
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
       background: rgba(0, 0, 0, 0.8);
       display: flex;
       align-items: center;
       justify-content: center;
       z-index: 10000;
       opacity: 0;
       visibility: hidden;
       transition: all 0.3s ease;
   }

   .resume-viewer-modal.show {
       opacity: 1;
       visibility: visible;
   }

   .resume-viewer-content {
       width: 90vw;
       height: 90vh;
       max-width: 1200px;
       background: white;
       border-radius: 15px;
       overflow: hidden;
       display: flex;
       flex-direction: column;
   }

   .resume-viewer-content .modal-header {
       display: flex;
       justify-content: space-between;
       align-items: center;
       padding: 1.5rem 2rem;
       border-bottom: 1px solid #e9ecef;
       background: #f8f9fa;
   }

   .resume-viewer-actions {
       display: flex;
       gap: 1rem;
       align-items: center;
   }

   .resume-viewer-container {
       flex: 1;
       padding: 2rem;
       overflow: auto;
       display: flex;
       align-items: center;
       justify-content: center;
       background: #f8f9fa;
   }

   .pdf-fallback {
       text-align: center;
       padding: 3rem;
       background: white;
       border-radius: 12px;
       box-shadow: 0 4px 15px rgba(0,0,0,0.1);
   }

   .pdf-icon {
       font-size: 4rem;
       color: #dc3545;
       margin-bottom: 1.5rem;
   }

   .pdf-fallback h3 {
       margin-bottom: 1rem;
       color: #333;
   }

   .loading-message,
   .resume-error {
       text-align: center;
       padding: 3rem;
       color: #666;
   }

   .loading-message i {
       font-size: 3rem;
       color: #667eea;
       margin-bottom: 1rem;
   }

   .resume-error i {
       font-size: 3rem;
       color: #dc3545;
       margin-bottom: 1rem;
   }

   /* Enhanced Resume Section in Application Modal */
   #resume-section {
       margin-top: 1rem;
       padding-top: 1rem;
       border-top: 1px solid #f0f0f0;
   }

   .resume-container {
       background: #f8f9fa;
       border-radius: 12px;
       padding: 1.5rem;
       border: 2px dashed #e9ecef;
       transition: all 0.3s ease;
   }

   .resume-info {
       display: flex;
       align-items: center;
       justify-content: space-between;
       gap: 1rem;
   }

   .resume-file-info {
       display: flex;
       align-items: center;
       gap: 1rem;
       flex: 1;
   }

   .resume-icon {
       font-size: 2rem;
       color: #dc3545;
   }

   .resume-details {
       display: flex;
       flex-direction: column;
   }

   .resume-name {
       font-weight: 600;
       color: #333;
       margin-bottom: 0.25rem;
   }

   .resume-size {
       font-size: 0.9rem;
       color: #666;
   }

   .resume-actions {
       display: flex;
       gap: 0.75rem;
   }

   .resume-actions .btn {
       font-size: 0.9rem;
       padding: 0.5rem 1rem;
   }

   /* Enhanced applicant card styles for resume indication */
   .applicant-card {
       position: relative;
   }

   .applicant-card .applicant-info p:has(.fa-paperclip) {
       color: #28a745;
       font-weight: 600;
   }

   .applicant-card .applicant-info p:has(.fa-exclamation-triangle) {
       color: #dc3545;
       font-weight: 600;
   }

   .resume-file-info {
       text-align: center;
       padding: 3rem;
       background: white;
       border-radius: 12px;
       box-shadow: 0 4px 15px rgba(0,0,0,0.1);
   }

   .file-icon-large {
       font-size: 4rem;
       color: #667eea;
       margin-bottom: 1.5rem;
   }

   .file-details-grid {
       display: grid;
       gap: 1rem;
       margin: 2rem 0;
       text-align: left;
   }

   .detail-item {
       display: flex;
       justify-content: space-between;
       padding: 0.75rem;
       background: #f8f9fa;
       border-radius: 8px;
   }

   .file-status-message {
       display: flex;
       gap: 1rem;
       margin: 2rem 0;
       padding: 1.5rem;
       background: #e3f2fd;
       border-radius: 8px;
       border-left: 4px solid #2196f3;
   }

   .status-icon {
       font-size: 2rem;
       color: #2196f3;
   }

   .status-text {
       flex: 1;
   }

   .action-buttons {
       display: flex;
       gap: 1rem;
       justify-content: center;
       margin-top: 2rem;
   }

   /* Responsive design for resume viewer */
   @media (max-width: 768px) {
       .resume-viewer-content {
           width: 95vw;
           height: 95vh;
       }
       
       .resume-viewer-content .modal-header {
           padding: 1rem;
       }
       
       .resume-viewer-container {
           padding: 1rem;
       }
       
       .resume-actions {
           flex-direction: column;
           gap: 0.5rem;
       }
       
       .resume-info {
           flex-direction: column;
           align-items: flex-start;
           gap: 1rem;
       }
   }
`;
document.head.appendChild(style);

// Initialize the enhanced dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
   console.log('DOM loaded, initializing EmployerDashboard...');
   try {
       employer = new EmployerDashboard();
   } catch (error) {
       console.error('Error initializing EmployerDashboard:', error);
   }
});