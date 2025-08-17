// Profile Management System - Enhanced Version with Fixes
class ProfileManager {
    constructor() {
        // Check if we're in view mode (viewing someone else's profile)
        this.isViewMode = sessionStorage.getItem('profileViewMode') === 'view';
        const viewingProfileId = sessionStorage.getItem('viewingProfileId');
        
        if (this.isViewMode && viewingProfileId) {
            // Load the profile of the user we're viewing
            this.profileUser = window.AuthUtils.getAllUsers().find(u => u.id === viewingProfileId);
            this.currentUser = window.AuthUtils.requireAuth(); // Still need current user for navigation
            
            if (!this.profileUser) {
                // Profile not found, redirect back
                this.clearViewMode();
                this.goBackToDashboard();
                return;
            }
        } else {
            // Normal mode - editing own profile
            this.currentUser = window.AuthUtils.requireAuth();
            if (!this.currentUser) {
                window.location.href = 'login.html';
                return;
            }
            this.profileUser = this.currentUser;
        }

        this.profileData = this.loadProfileData();
        this.currentEditingSection = null;
        
        this.init();
    }

    init() {
        this.setupAuth();
        this.setupNavigation();
        this.setupModals();
        if (!this.isViewMode) {
            this.setupFormHandlers();
        }
        this.renderProfile();
        this.showCorrectProfileSections();
        this.setupViewMode();
    }

    clearViewMode() {
        sessionStorage.removeItem('viewingProfileId');
        sessionStorage.removeItem('profileViewMode');
    }

    setupViewMode() {
        if (this.isViewMode) {
            // Hide all edit buttons
            document.querySelectorAll('.edit-section-btn, #edit-profile-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Update the profile actions
            const profileActions = document.querySelector('.profile-actions');
            if (profileActions) {
                const backUrl = this.currentUser.userType === 'worker' ? 'worker.html' : 'employer.html';
                const backText = this.currentUser.userType === 'worker' ? 'Back to Jobs' : 'Back to Dashboard';
                
                profileActions.innerHTML = `
                    <button class="btn btn-secondary" id="back-to-jobs-btn">
                        <i class="fas fa-arrow-left"></i> ${backText}
                    </button>
                `;
                
                document.getElementById('back-to-jobs-btn').addEventListener('click', () => {
                    this.clearViewMode();
                    window.location.href = backUrl;
                });
            }

            this.addViewModeIndicator();
        }
    }

    addViewModeIndicator() {
        const profileHeader = document.querySelector('.profile-header');
        if (profileHeader && this.isViewMode) {
            const viewIndicator = document.createElement('div');
            viewIndicator.className = 'view-mode-indicator';
            const profileType = this.profileUser.userType === 'employer' ? 'Company' : 'User';
            viewIndicator.innerHTML = `
                <div class="view-mode-badge">
                    <i class="fas fa-eye"></i>
                    <span>Viewing ${profileType} Profile</span>
                </div>
            `;
            profileHeader.insertBefore(viewIndicator, profileHeader.firstChild);
        }
    }

    // Authentication & User Setup
    setupAuth() {
        const userName = document.getElementById('user-name');
        const userInitials = document.getElementById('user-initials');
        const userAvatar = document.getElementById('user-avatar');
        const userRole = document.getElementById('user-role');
        
        if (userName) userName.textContent = this.currentUser.name;
        if (userInitials) userInitials.textContent = this.currentUser.avatar.initials;
        if (userAvatar) userAvatar.style.background = this.currentUser.avatar.color;
        if (userRole) userRole.textContent = this.currentUser.userType === 'employer' ? 'Employer' : 'Job Seeker';

        const userProfile = document.getElementById('user-profile');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');
        
        if (userProfile && userMenuDropdown) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenuDropdown.classList.toggle('show');
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

    // Navigation
    setupNavigation() {
        const backBtn = document.getElementById('back-to-dashboard');
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearViewMode();
                this.goBackToDashboard();
            });
        }
    }

    goBackToDashboard() {
        if (this.currentUser.userType === 'employer') {
            window.location.href = 'employer.html';
        } else {
            window.location.href = 'worker.html';
        }
    }

    // Show correct profile sections based on user type
    showCorrectProfileSections() {
        const workerProfile = document.getElementById('worker-profile');
        const employerProfile = document.getElementById('employer-profile');

        if (this.profileUser.userType === 'employer') {
            if (workerProfile) workerProfile.style.display = 'none';
            if (employerProfile) employerProfile.style.display = 'block';
        } else {
            if (employerProfile) employerProfile.style.display = 'none';
            if (workerProfile) workerProfile.style.display = 'block';
        }
    }

    // Modal Setup
    setupModals() {
        const editModal = document.getElementById('edit-modal');
        const previewModal = document.getElementById('preview-modal');
        const closeModal = document.getElementById('close-modal');
        const closePreview = document.getElementById('close-preview');
        const cancelEdit = document.getElementById('cancel-edit');

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                editModal.classList.remove('show');
            });
        }

        if (closePreview) {
            closePreview.addEventListener('click', () => {
                previewModal.classList.remove('show');
            });
        }

        if (cancelEdit) {
            cancelEdit.addEventListener('click', () => {
                editModal.classList.remove('show');
            });
        }

        // Close modals when clicking outside
        [editModal, previewModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.classList.remove('show');
                    }
                });
            }
        });
    }

    // Form Handlers
    setupFormHandlers() {
        // Edit section buttons
        document.querySelectorAll('.edit-section-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                this.openEditModal(section);
            });
        });

        // Edit profile button
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.openEditModal('basic-info');
            });
        }

        // Preview button
        const previewBtn = document.getElementById('preview-profile-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                this.showPreview();
            });
        }

        // Edit form submission
        const editForm = document.getElementById('edit-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSection();
            });
        }
    }

    // Load Profile Data
    loadProfileData() {
        const stored = localStorage.getItem(`careerConnect_profile_${this.profileUser.id}`);
        const defaultProfile = {
            // Basic info
            displayName: this.profileUser.name,
            email: this.profileUser.email || '',
            phone: '',
            location: '',
            website: '',
            bio: '',
            
            // Worker specific
            skills: [],
            experience: [],
            education: [],
            portfolio: [],
            
            // Employer specific
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
            
            // Settings
            profileVisibility: 'public',
            memberSince: this.profileUser.createdAt || new Date().toISOString()
        };

        const profileData = stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
        
        // Debug logging to help troubleshoot
        console.log(`Loading profile for user ID: ${this.profileUser.id}`);
        console.log(`Profile data loaded:`, profileData);
        
        return profileData;
    }

    // Save Profile Data (FIXED - now uses profileUser.id consistently)
    saveProfileData() {
        if (!this.isViewMode) {
            localStorage.setItem(`careerConnect_profile_${this.profileUser.id}`, JSON.stringify(this.profileData));
        }
    }

    // Force refresh profile data from storage
    refreshProfileData() {
        this.profileData = this.loadProfileData();
        this.renderProfile();
        console.log(`Profile data refreshed for user ${this.profileUser.id}`);
    }

    // Render Profile
    renderProfile() {
        this.renderBasicInfo();
        this.renderContactInfo();
        
        if (this.profileUser.userType === 'worker') {
            this.renderWorkerSections();
        } else {
            this.renderEmployerSections();
        }
    }

    renderBasicInfo() {
        const displayName = document.getElementById('profile-display-name');
        const roleDisplay = document.getElementById('profile-role-display');
        const locationDisplay = document.getElementById('profile-location');
        const memberSince = document.getElementById('profile-member-since');
        const profileAvatar = document.getElementById('profile-avatar');
        const profileInitials = document.getElementById('profile-initials');

        if (displayName) displayName.textContent = this.profileData.displayName;
        if (roleDisplay) {
            roleDisplay.textContent = this.profileUser.userType === 'employer' ? 
                this.profileUser.companyName || 'Employer' : 'Job Seeker';
        }
        if (locationDisplay) {
            locationDisplay.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.profileData.location || 'Location not specified'}`;
        }
        if (memberSince) {
            const date = new Date(this.profileData.memberSince).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
            });
            memberSince.innerHTML = `<i class="fas fa-calendar"></i> Member since ${date}`;
        }
        if (profileAvatar) {
            profileAvatar.style.background = this.profileUser.avatar.color;
        }
        if (profileInitials) {
            profileInitials.textContent = this.profileUser.avatar.initials;
        }
    }

    renderContactInfo() {
        const emailDisplay = document.getElementById('email-display');
        const phoneDisplay = document.getElementById('phone-display');
        const locationDisplay = document.getElementById('location-display');
        const websiteDisplay = document.getElementById('website-display');

        if (emailDisplay) emailDisplay.textContent = this.profileData.email || 'No email provided';
        if (phoneDisplay) phoneDisplay.textContent = this.profileData.phone || 'No phone provided';
        if (locationDisplay) locationDisplay.textContent = this.profileData.location || 'No location provided';
        if (websiteDisplay) {
            if (this.profileData.website) {
                websiteDisplay.innerHTML = `<a href="${this.profileData.website}" target="_blank" rel="noopener noreferrer">${this.profileData.website}</a>`;
            } else {
                websiteDisplay.textContent = 'No website provided';
            }
        }
    }

    renderWorkerSections() {
        this.renderBio();
        this.renderSkills();
        this.renderExperience();
        this.renderEducation();
        this.renderPortfolio();
    }

    renderBio() {
        const bioDisplay = document.getElementById('bio-display');
        if (bioDisplay) {
            bioDisplay.textContent = this.profileData.bio || 'Add a professional summary to showcase your experience and goals...';
        }
    }

    renderSkills() {
        const skillsDisplay = document.getElementById('skills-display');
        if (skillsDisplay) {
            if (this.profileData.skills.length === 0) {
                skillsDisplay.innerHTML = '<p class="empty-state">Add your skills to showcase your expertise</p>';
            } else {
                const skillsHTML = this.profileData.skills.map(skill => 
                    `<span class="skill-tag">${skill}</span>`
                ).join('');
                skillsDisplay.innerHTML = skillsHTML;
            }
        }
    }

    renderExperience() {
        const experienceDisplay = document.getElementById('experience-display');
        if (experienceDisplay) {
            if (this.profileData.experience.length === 0) {
                experienceDisplay.innerHTML = '<p class="empty-state">Add your work experience to build credibility</p>';
            } else {
                const experienceHTML = this.profileData.experience.map(exp => `
                    <div class="experience-item">
                        <div class="experience-header">
                            <div class="experience-title">${exp.title}</div>
                            <div class="experience-company">${exp.company}</div>
                            <div class="experience-duration">${exp.startDate} - ${exp.endDate || 'Present'}</div>
                        </div>
                        ${exp.description ? `<div class="experience-description">${exp.description}</div>` : ''}
                    </div>
                `).join('');
                experienceDisplay.innerHTML = experienceHTML;
            }
        }
    }

    renderEducation() {
        const educationDisplay = document.getElementById('education-display');
        if (educationDisplay) {
            if (this.profileData.education.length === 0) {
                educationDisplay.innerHTML = '<p class="empty-state">Add your educational background</p>';
            } else {
                const educationHTML = this.profileData.education.map(edu => `
                    <div class="education-item">
                        <div class="education-degree">${edu.degree}</div>
                        <div class="education-school">${edu.school}</div>
                        <div class="education-year">${edu.year}</div>
                    </div>
                `).join('');
                educationDisplay.innerHTML = educationHTML;
            }
        }
    }

    renderPortfolio() {
        const portfolioDisplay = document.getElementById('portfolio-display');
        if (portfolioDisplay) {
            if (this.profileData.portfolio.length === 0) {
                portfolioDisplay.innerHTML = '<p class="empty-state">Add links to your work and social profiles</p>';
            } else {
                const portfolioHTML = this.profileData.portfolio.map(item => `
                    <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="portfolio-link">
                        <div class="portfolio-link-info">
                            <i class="${this.getPortfolioIcon(item.type)}"></i>
                            <div class="portfolio-link-text">
                                <h4>${item.title}</h4>
                                <p>${item.description}</p>
                            </div>
                        </div>
                        <i class="fas fa-external-link-alt portfolio-link-arrow"></i>
                    </a>
                `).join('');
                portfolioDisplay.innerHTML = portfolioHTML;
            }
        }
    }

    renderEmployerSections() {
        this.renderCompanyOverview();
        this.renderCompanyInfo();
        this.renderCompanyContact();
        this.renderCulture();
    }

    renderCompanyOverview() {
        const companyDescriptionDisplay = document.getElementById('company-description-display');
        if (companyDescriptionDisplay) {
            companyDescriptionDisplay.textContent = this.profileData.companyDescription || 
                'Add a compelling company description to attract top talent...';
        }
    }

    renderCompanyInfo() {
        const industryDisplay = document.getElementById('industry-display');
        const companySizeDisplay = document.getElementById('company-size-display');
        const foundedDisplay = document.getElementById('founded-display');
        const headquartersDisplay = document.getElementById('headquarters-display');

        if (industryDisplay) industryDisplay.textContent = this.profileData.industry || 'Not specified';
        if (companySizeDisplay) companySizeDisplay.textContent = this.profileData.companySize || 'Not specified';
        if (foundedDisplay) foundedDisplay.textContent = this.profileData.founded || 'Not specified';
        if (headquartersDisplay) headquartersDisplay.textContent = this.profileData.headquarters || 'Not specified';
    }

    renderCompanyContact() {
        const companyEmailDisplay = document.getElementById('company-email-display');
        const companyPhoneDisplay = document.getElementById('company-phone-display');
        const companyWebsiteDisplay = document.getElementById('company-website-display');
        const companyLinkedInDisplay = document.getElementById('company-linkedin-display');

        if (companyEmailDisplay) companyEmailDisplay.textContent = this.profileData.companyEmail || 'No email provided';
        if (companyPhoneDisplay) companyPhoneDisplay.textContent = this.profileData.companyPhone || 'No phone provided';
        if (companyWebsiteDisplay) {
            if (this.profileData.companyWebsite) {
                companyWebsiteDisplay.innerHTML = `<a href="${this.profileData.companyWebsite}" target="_blank" rel="noopener noreferrer">${this.profileData.companyWebsite}</a>`;
            } else {
                companyWebsiteDisplay.textContent = 'No website provided';
            }
        }
        if (companyLinkedInDisplay) {
            if (this.profileData.companyLinkedIn) {
                companyLinkedInDisplay.innerHTML = `<a href="${this.profileData.companyLinkedIn}" target="_blank" rel="noopener noreferrer">${this.profileData.companyLinkedIn}</a>`;
            } else {
                companyLinkedInDisplay.textContent = 'No LinkedIn provided';
            }
        }
    }

    renderCulture() {
        const cultureDisplay = document.getElementById('culture-display');
        if (cultureDisplay) {
            cultureDisplay.textContent = this.profileData.culture || 
                'Share your company culture and values to attract like-minded candidates...';
        }
    }

    // Edit Modal Functions (only available in edit mode)
    openEditModal(section) {
        if (this.isViewMode) return;
        
        this.currentEditingSection = section;
        const modal = document.getElementById('edit-modal');
        const modalTitle = document.getElementById('modal-title');
        const editForm = document.getElementById('edit-form');

        modalTitle.textContent = this.getSectionTitle(section);
        editForm.innerHTML = this.generateEditForm(section);
        
        this.setupFormSpecificHandlers();
        modal.classList.add('show');
    }

    getSectionTitle(section) {
        const titles = {
            'basic-info': 'Edit Basic Information',
            'about': 'Edit About Me',
            'contact': 'Edit Contact Information',
            'skills': 'Edit Skills',
            'experience': 'Edit Work Experience',
            'education': 'Edit Education',
            'portfolio': 'Edit Portfolio & Links',
            'company-overview': 'Edit Company Overview',
            'company-info': 'Edit Company Information',
            'company-contact': 'Edit Contact & Social Media',
            'culture': 'Edit Company Culture & Values'
        };
        return titles[section] || 'Edit Section';
    }

    generateEditForm(section) {
        switch (section) {
            case 'basic-info':
                return this.generateBasicInfoForm();
            case 'about':
                return this.generateAboutForm();
            case 'contact':
                return this.generateContactForm();
            case 'skills':
                return this.generateSkillsForm();
            case 'experience':
                return this.generateExperienceForm();
            case 'education':
                return this.generateEducationForm();
            case 'portfolio':
                return this.generatePortfolioForm();
            case 'company-overview':
                return this.generateCompanyOverviewForm();
            case 'company-info':
                return this.generateCompanyInfoForm();
            case 'company-contact':
                return this.generateCompanyContactForm();
            case 'culture':
                return this.generateCultureForm();
            default:
                return '<p>Form not available</p>';
        }
    }

    generateBasicInfoForm() {
        return `
            <div class="form-group">
                <label for="display-name">Display Name</label>
                <input type="text" id="display-name" value="${this.profileData.displayName}" required>
            </div>
            <div class="form-group">
                <label for="location">Location</label>
                <input type="text" id="location" value="${this.profileData.location}" placeholder="City, State/Country">
            </div>
        `;
    }

    generateAboutForm() {
        return `
            <div class="form-group">
                <label for="bio">Professional Summary</label>
                <textarea id="bio" rows="6" placeholder="Write a compelling summary of your professional background, skills, and career goals...">${this.profileData.bio}</textarea>
            </div>
        `;
    }

    generateContactForm() {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" value="${this.profileData.email}">
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" value="${this.profileData.phone}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" value="${this.profileData.location}">
                </div>
                <div class="form-group">
                    <label for="website">Personal Website</label>
                    <input type="url" id="website" value="${this.profileData.website}" placeholder="https://">
                </div>
            </div>
        `;
    }

    generateSkillsForm() {
        return `
            <div class="form-group">
                <label for="skill-input">Add Skills</label>
                <div class="skills-input-container">
                    <input type="text" id="skill-input" class="skill-input" placeholder="Enter a skill and press Enter">
                    <button type="button" class="add-skill-btn" id="add-skill-btn">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <div class="skills-list" id="skills-list">
                    ${this.profileData.skills.map(skill => `
                        <div class="skill-item">
                            <span>${skill}</span>
                            <button type="button" class="remove-skill" data-skill="${skill}">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    generateExperienceForm() {
        return `
            <div id="experience-entries">
                ${this.profileData.experience.map((exp, index) => this.generateExperienceEntry(exp, index)).join('')}
            </div>
            <button type="button" class="btn btn-secondary" id="add-experience-btn">
                <i class="fas fa-plus"></i> Add Experience
            </button>
        `;
    }

    generateExperienceEntry(exp = {}, index = 0) {
        return `
            <div class="experience-entry" data-index="${index}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Job Title</label>
                        <input type="text" name="title" value="${exp.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Company</label>
                        <input type="text" name="company" value="${exp.company || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="month" name="startDate" value="${exp.startDate || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>End Date</label>
                        <input type="month" name="endDate" value="${exp.endDate || ''}" placeholder="Leave blank if current">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="3" placeholder="Describe your role and achievements...">${exp.description || ''}</textarea>
                </div>
                <button type="button" class="btn btn-secondary remove-experience" data-index="${index}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
    }

    generateEducationForm() {
        return `
            <div id="education-entries">
                ${this.profileData.education.map((edu, index) => this.generateEducationEntry(edu, index)).join('')}
            </div>
            <button type="button" class="btn btn-secondary" id="add-education-btn">
                <i class="fas fa-plus"></i> Add Education
            </button>
        `;
    }

    generateEducationEntry(edu = {}, index = 0) {
        return `
            <div class="education-entry" data-index="${index}">
                <div class="form-group">
                    <label>Degree/Certification</label>
                    <input type="text" name="degree" value="${edu.degree || ''}" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>School/Institution</label>
                        <input type="text" name="school" value="${edu.school || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Year</label>
                        <input type="text" name="year" value="${edu.year || ''}" placeholder="e.g., 2020">
                    </div>
                </div>
                <button type="button" class="btn btn-secondary remove-education" data-index="${index}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
    }

    generatePortfolioForm() {
        return `
            <div id="portfolio-entries">
                ${this.profileData.portfolio.map((item, index) => this.generatePortfolioEntry(item, index)).join('')}
            </div>
            <button type="button" class="btn btn-secondary" id="add-portfolio-btn">
                <i class="fas fa-plus"></i> Add Link
            </button>
        `;
    }

    generatePortfolioEntry(item = {}, index = 0) {
        return `
            <div class="portfolio-entry" data-index="${index}">
                <div class="form-row">
                    <div class="form-group">
                        <label>Title</label>
                        <input type="text" name="title" value="${item.title || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>Type</label>
                        <select name="type" required>
                            <option value="">Select type</option>
                            <option value="portfolio" ${item.type === 'portfolio' ? 'selected' : ''}>Portfolio</option>
                            <option value="github" ${item.type === 'github' ? 'selected' : ''}>GitHub</option>
                            <option value="linkedin" ${item.type === 'linkedin' ? 'selected' : ''}>LinkedIn</option>
                            <option value="twitter" ${item.type === 'twitter' ? 'selected' : ''}>Twitter</option>
                            <option value="behance" ${item.type === 'behance' ? 'selected' : ''}>Behance</option>
                            <option value="dribbble" ${item.type === 'dribbble' ? 'selected' : ''}>Dribbble</option>
                            <option value="website" ${item.type === 'website' ? 'selected' : ''}>Website</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>URL</label>
                    <input type="url" name="url" value="${item.url || ''}" required placeholder="https://">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" name="description" value="${item.description || ''}" placeholder="Brief description">
                </div>
                <button type="button" class="btn btn-secondary remove-portfolio" data-index="${index}">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
        `;
    }

    generateCompanyOverviewForm() {
        return `
            <div class="form-group">
                <label for="company-description">Company Description</label>
                <textarea id="company-description" rows="6" placeholder="Describe your company, mission, and what makes it special...">${this.profileData.companyDescription}</textarea>
            </div>
        `;
    }

    generateCompanyInfoForm() {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label for="industry">Industry</label>
                    <input type="text" id="industry" value="${this.profileData.industry}" placeholder="e.g., Technology, Healthcare">
                </div>
                <div class="form-group">
                    <label for="company-size">Company Size</label>
                    <select id="company-size">
                        <option value="">Select size</option>
                        <option value="1-10" ${this.profileData.companySize === '1-10' ? 'selected' : ''}>1-10 employees</option>
                        <option value="11-50" ${this.profileData.companySize === '11-50' ? 'selected' : ''}>11-50 employees</option>
                        <option value="51-200" ${this.profileData.companySize === '51-200' ? 'selected' : ''}>51-200 employees</option>
                        <option value="201-500" ${this.profileData.companySize === '201-500' ? 'selected' : ''}>201-500 employees</option>
                        <option value="501-1000" ${this.profileData.companySize === '501-1000' ? 'selected' : ''}>501-1000 employees</option>
                        <option value="1000+" ${this.profileData.companySize === '1000+' ? 'selected' : ''}>1000+ employees</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="founded">Founded Year</label>
                    <input type="number" id="founded" value="${this.profileData.founded}" min="1800" max="${new Date().getFullYear()}" placeholder="e.g., 2010">
                </div>
                <div class="form-group">
                    <label for="headquarters">Headquarters</label>
                    <input type="text" id="headquarters" value="${this.profileData.headquarters}" placeholder="City, State/Country">
                </div>
            </div>
        `;
    }

    generateCompanyContactForm() {
        return `
            <div class="form-row">
                <div class="form-group">
                    <label for="company-email">Company Email</label>
                    <input type="email" id="company-email" value="${this.profileData.companyEmail}">
                </div>
                <div class="form-group">
                    <label for="company-phone">Company Phone</label>
                    <input type="tel" id="company-phone" value="${this.profileData.companyPhone}">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="company-website">Company Website</label>
                    <input type="url" id="company-website" value="${this.profileData.companyWebsite}" placeholder="https://">
                </div>
                <div class="form-group">
                    <label for="company-linkedin">LinkedIn Page</label>
                    <input type="url" id="company-linkedin" value="${this.profileData.companyLinkedIn}" placeholder="https://linkedin.com/company/">
                </div>
            </div>
        `;
    }

    generateCultureForm() {
        return `
            <div class="form-group">
                <label for="culture">Company Culture & Values</label>
                <textarea id="culture" rows="6" placeholder="Describe your company culture, values, and work environment...">${this.profileData.culture}</textarea>
            </div>
        `;
    }

    // Form Specific Handlers
    setupFormSpecificHandlers() {
        // Skills form handlers
        this.setupSkillsHandlers();
        
        // Experience form handlers
        this.setupExperienceHandlers();
        
        // Education form handlers
        this.setupEducationHandlers();
        
        // Portfolio form handlers
        this.setupPortfolioHandlers();
    }

    setupSkillsHandlers() {
        const skillInput = document.getElementById('skill-input');
        const addSkillBtn = document.getElementById('add-skill-btn');

        if (skillInput && addSkillBtn) {
            const addSkill = () => {
                const skill = skillInput.value.trim();
                if (skill && !this.profileData.skills.includes(skill)) {
                    this.profileData.skills.push(skill);
                    this.updateSkillsList();
                    skillInput.value = '';
                }
            };

            addSkillBtn.addEventListener('click', addSkill);
            skillInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill();
                }
            });
        }

        this.updateSkillsList();
    }

    updateSkillsList() {
        const skillsList = document.getElementById('skills-list');
        if (skillsList) {
            skillsList.innerHTML = this.profileData.skills.map(skill => `
                <div class="skill-item">
                    <span>${skill}</span>
                    <button type="button" class="remove-skill" data-skill="${skill}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

            // Setup remove handlers
            document.querySelectorAll('.remove-skill').forEach(btn => {
                btn.addEventListener('click', () => {
                    const skill = btn.getAttribute('data-skill');
                    this.profileData.skills = this.profileData.skills.filter(s => s !== skill);
                    this.updateSkillsList();
                });
            });
        }
    }

    setupExperienceHandlers() {
        const addBtn = document.getElementById('add-experience-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const container = document.getElementById('experience-entries');
                const index = this.profileData.experience.length;
                container.insertAdjacentHTML('beforeend', this.generateExperienceEntry({}, index));
                this.setupRemoveHandlers();
            });
        }
        this.setupRemoveHandlers();
    }

    setupEducationHandlers() {
        const addBtn = document.getElementById('add-education-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const container = document.getElementById('education-entries');
                const index = this.profileData.education.length;
                container.insertAdjacentHTML('beforeend', this.generateEducationEntry({}, index));
                this.setupRemoveHandlers();
            });
        }
        this.setupRemoveHandlers();
    }

    setupPortfolioHandlers() {
        const addBtn = document.getElementById('add-portfolio-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const container = document.getElementById('portfolio-entries');
                const index = this.profileData.portfolio.length;
                container.insertAdjacentHTML('beforeend', this.generatePortfolioEntry({}, index));
                this.setupRemoveHandlers();
            });
        }
        this.setupRemoveHandlers();
    }

    setupRemoveHandlers() {
        document.querySelectorAll('.remove-experience').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.experience-entry').remove();
            });
        });

        document.querySelectorAll('.remove-education').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.education-entry').remove();
            });
        });

        document.querySelectorAll('.remove-portfolio').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.portfolio-entry').remove();
            });
        });
    }

    // Save Section (ENHANCED with debugging)
    saveSection() {
        const formData = new FormData(document.getElementById('edit-form'));
        
        switch (this.currentEditingSection) {
            case 'basic-info':
                this.saveBasicInfo(formData);
                break;
            case 'about':
                this.saveAbout(formData);
                break;
            case 'contact':
                this.saveContact(formData);
                break;
            case 'skills':
                // Skills are handled differently
                break;
            case 'experience':
                this.saveExperience();
                break;
            case 'education':
                this.saveEducation();
                break;
            case 'portfolio':
                this.savePortfolio();
                break;
            case 'company-overview':
                this.saveCompanyOverview(formData);
                break;
            case 'company-info':
                this.saveCompanyInfo(formData);
                break;
            case 'company-contact':
                this.saveCompanyContact(formData);
                break;
            case 'culture':
                this.saveCulture(formData);
                break;
        }

        this.saveProfileData();
        this.renderProfile();
        this.showSuccessAlert();
        document.getElementById('edit-modal').classList.remove('show');
        
        // Debug: Confirm data was saved
        console.log(`Profile data saved for user ${this.profileUser.id}:`, this.profileData);
    }

    saveBasicInfo(formData) {
        this.profileData.displayName = formData.get('display-name') || document.getElementById('display-name').value;
        this.profileData.location = formData.get('location') || document.getElementById('location').value;
    }

    saveAbout(formData) {
        this.profileData.bio = formData.get('bio') || document.getElementById('bio').value;
    }

    saveContact(formData) {
        this.profileData.email = formData.get('email') || document.getElementById('email').value;
        this.profileData.phone = formData.get('phone') || document.getElementById('phone').value;
        this.profileData.location = formData.get('location') || document.getElementById('location').value;
        this.profileData.website = formData.get('website') || document.getElementById('website').value;
    }

    saveExperience() {
        const entries = document.querySelectorAll('.experience-entry');
        this.profileData.experience = Array.from(entries).map(entry => ({
            title: entry.querySelector('[name="title"]').value,
            company: entry.querySelector('[name="company"]').value,
            startDate: entry.querySelector('[name="startDate"]').value,
            endDate: entry.querySelector('[name="endDate"]').value,
            description: entry.querySelector('[name="description"]').value
        })).filter(exp => exp.title && exp.company);
    }

    saveEducation() {
        const entries = document.querySelectorAll('.education-entry');
        this.profileData.education = Array.from(entries).map(entry => ({
            degree: entry.querySelector('[name="degree"]').value,
            school: entry.querySelector('[name="school"]').value,
            year: entry.querySelector('[name="year"]').value
        })).filter(edu => edu.degree && edu.school);
    }

    savePortfolio() {
        const entries = document.querySelectorAll('.portfolio-entry');
        this.profileData.portfolio = Array.from(entries).map(entry => ({
            title: entry.querySelector('[name="title"]').value,
            type: entry.querySelector('[name="type"]').value,
            url: entry.querySelector('[name="url"]').value,
            description: entry.querySelector('[name="description"]').value
        })).filter(item => item.title && item.type && item.url);
    }

    saveCompanyOverview(formData) {
        this.profileData.companyDescription = formData.get('company-description') || document.getElementById('company-description').value;
    }

    saveCompanyInfo(formData) {
        this.profileData.industry = formData.get('industry') || document.getElementById('industry').value;
        this.profileData.companySize = formData.get('company-size') || document.getElementById('company-size').value;
        this.profileData.founded = formData.get('founded') || document.getElementById('founded').value;
        this.profileData.headquarters = formData.get('headquarters') || document.getElementById('headquarters').value;
    }

    saveCompanyContact(formData) {
        this.profileData.companyEmail = formData.get('company-email') || document.getElementById('company-email').value;
        this.profileData.companyPhone = formData.get('company-phone') || document.getElementById('company-phone').value;
        this.profileData.companyWebsite = formData.get('company-website') || document.getElementById('company-website').value;
        this.profileData.companyLinkedIn = formData.get('company-linkedin') || document.getElementById('company-linkedin').value;
    }

    saveCulture(formData) {
        this.profileData.culture = formData.get('culture') || document.getElementById('culture').value;
    }

    // Preview
    showPreview() {
        const previewModal = document.getElementById('preview-modal');
        const previewContent = document.getElementById('preview-content');
        
        previewContent.innerHTML = this.generatePreviewHTML();
        previewModal.classList.add('show');
    }

    generatePreviewHTML() {
        if (this.profileUser.userType === 'worker') {
            return this.generateWorkerPreview();
        } else {
            return this.generateEmployerPreview();
        }
    }

    generateWorkerPreview() {
        return `
            <div class="preview-profile">
                <div class="preview-header">
                    <div class="preview-avatar" style="background: ${this.profileUser.avatar.color}">
                        <span>${this.profileUser.avatar.initials}</span>
                    </div>
                    <div class="preview-info">
                        <h2>${this.profileData.displayName}</h2>
                        <p>Job Seeker</p>
                        <div class="preview-meta">
                            <span><i class="fas fa-map-marker-alt"></i> ${this.profileData.location || 'Location not specified'}</span>
                            <span><i class="fas fa-envelope"></i> ${this.profileData.email || 'No email'}</span>
                        </div>
                    </div>
                </div>
                
                ${this.profileData.bio ? `
                    <div class="preview-section">
                        <h3>About</h3>
                        <p>${this.profileData.bio}</p>
                    </div>
                ` : ''}
                
                ${this.profileData.skills.length > 0 ? `
                    <div class="preview-section">
                        <h3>Skills</h3>
                        <div class="skills-grid">
                            ${this.profileData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${this.profileData.experience.length > 0 ? `
                    <div class="preview-section">
                        <h3>Experience</h3>
                        ${this.profileData.experience.map(exp => `
                            <div class="experience-item">
                                <h4>${exp.title} at ${exp.company}</h4>
                                <p>${exp.startDate} - ${exp.endDate || 'Present'}</p>
                                ${exp.description ? `<p>${exp.description}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    generateEmployerPreview() {
        return `
            <div class="preview-profile">
                <div class="preview-header">
                    <div class="preview-avatar" style="background: ${this.profileUser.avatar.color}">
                        <span>${this.profileUser.avatar.initials}</span>
                    </div>
                    <div class="preview-info">
                        <h2>${this.profileUser.companyName || this.profileData.displayName}</h2>
                        <p>Employer</p>
                        <div class="preview-meta">
                            <span><i class="fas fa-industry"></i> ${this.profileData.industry || 'Industry not specified'}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${this.profileData.headquarters || 'Location not specified'}</span>
                        </div>
                    </div>
                </div>
                
                ${this.profileData.companyDescription ? `
                    <div class="preview-section">
                        <h3>About Our Company</h3>
                        <p>${this.profileData.companyDescription}</p>
                    </div>
                ` : ''}
                
                <div class="preview-section">
                    <h3>Company Information</h3>
                    <div class="info-grid">
                        ${this.profileData.industry ? `<p><strong>Industry:</strong> ${this.profileData.industry}</p>` : ''}
                        ${this.profileData.companySize ? `<p><strong>Size:</strong> ${this.profileData.companySize}</p>` : ''}
                        ${this.profileData.founded ? `<p><strong>Founded:</strong> ${this.profileData.founded}</p>` : ''}
                        ${this.profileData.headquarters ? `<p><strong>Headquarters:</strong> ${this.profileData.headquarters}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Utility Methods
    getPortfolioIcon(type) {
        const icons = {
            portfolio: 'fas fa-folder',
            github: 'fab fa-github',
            linkedin: 'fab fa-linkedin',
            twitter: 'fab fa-twitter',
            behance: 'fab fa-behance',
            dribbble: 'fab fa-dribbble',
            website: 'fas fa-globe'
        };
        return icons[type] || 'fas fa-link';
    }

    showSuccessAlert() {
        const alert = document.getElementById('success-alert');
        const message = document.getElementById('alert-message');
        
        message.textContent = 'Profile updated successfully!';
        alert.classList.add('show');
        
        setTimeout(() => {
            alert.classList.remove('show');
        }, 3000);
    }
}

// Initialize profile manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing ProfileManager...');
    try {
        new ProfileManager();
    } catch (error) {
        console.error('Error initializing ProfileManager:', error);
    }
});