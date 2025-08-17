// Authentication System
class AuthSystem {
    constructor() {
        this.users = this.loadUsers();
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupTabs();
        this.setupForms();
        this.setupPasswordToggle();
        this.setupUserTypeChange();
        this.setupDemoButtons();
        this.createDemoUsers();
        this.checkExistingSession();
    }

    // Tab Navigation
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const forms = document.querySelectorAll('.auth-form');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Update tab buttons
                tabBtns.forEach(tb => tb.classList.remove('active'));
                btn.classList.add('active');
                
                // Update forms
                forms.forEach(form => form.classList.remove('active'));
                document.getElementById(`${targetTab}-form`).classList.add('active');
            });
        });
    }

    // Form Setup
    setupForms() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(loginForm);
        });

        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister(registerForm);
        });
    }

    // Password Toggle
    setupPasswordToggle() {
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = btn.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
    }

    // User Type Change
    setupUserTypeChange() {
        const userTypeSelect = document.getElementById('user-type');
        const companyField = document.getElementById('company-field');

        userTypeSelect.addEventListener('change', () => {
            if (userTypeSelect.value === 'employer') {
                companyField.style.display = 'block';
                document.getElementById('company-name').required = true;
            } else {
                companyField.style.display = 'none';
                document.getElementById('company-name').required = false;
            }
        });
    }

    // Demo Buttons
    setupDemoButtons() {
        document.querySelectorAll('.demo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                this.loginDemo(type);
            });
        });
    }

    // Handle Login
    async handleLogin(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        if (!email || !password) {
            this.showAlert('Please fill in all fields', 'error');
            return;
        }

        this.setLoadingState(submitBtn, true);

        // Simulate API delay
        await this.delay(1000);

        const user = this.users.find(u => u.email === email && u.password === password);

        if (user) {
            this.loginUser(user, rememberMe);
        } else {
            this.showAlert('Invalid email or password', 'error');
        }

        this.setLoadingState(submitBtn, false);
    }

    // Handle Registration
    async handleRegister(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const userType = document.getElementById('user-type').value;
        const companyName = document.getElementById('company-name').value;

        // Validation
        if (!name || !email || !password || !confirmPassword || !userType) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters long', 'error');
            return;
        }

        if (userType === 'employer' && !companyName) {
            this.showAlert('Company name is required for employers', 'error');
            return;
        }

        // Check if email already exists
        if (this.users.find(u => u.email === email)) {
            this.showAlert('Email already exists', 'error');
            return;
        }

        this.setLoadingState(submitBtn, true);

        // Simulate API delay
        await this.delay(1500);

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            userType,
            companyName: userType === 'employer' ? companyName : null,
            createdAt: new Date().toISOString(),
            avatar: this.generateAvatar(name),
            isOnline: false,
            lastSeen: null
        };

        this.users.push(newUser);
        this.saveUsers();

        this.showAlert('Account created successfully! Please log in.', 'success');
        
        // Switch to login tab
        setTimeout(() => {
            document.querySelector('.tab-btn[data-tab="login"]').click();
            document.getElementById('login-email').value = email;
        }, 2000);

        this.setLoadingState(submitBtn, false);
        form.reset();
        document.getElementById('company-field').style.display = 'none';
    }

    // Demo Login
    async loginDemo(type) {
        const demoUser = this.users.find(u => u.email === `demo.${type}@careerconnect.com`);
        if (demoUser) {
            this.loginUser(demoUser, false);
        }
    }

    // Login User
    loginUser(user, rememberMe = false) {
        user.isOnline = true;
        user.lastSeen = new Date().toISOString();
        
        this.currentUser = user;
        this.saveUsers();

        // Store session
        if (rememberMe) {
            localStorage.setItem('careerConnect_rememberedUser', JSON.stringify(user));
        }
        sessionStorage.setItem('careerConnect_currentUser', JSON.stringify(user));

        this.showAlert('Login successful!', 'success');

        // Redirect based on user type
        setTimeout(() => {
            if (user.userType === 'employer') {
                window.location.href = 'employer.html';
            } else {
                window.location.href = 'worker.html';
            }
        }, 1500);
    }

    // Check Existing Session
    checkExistingSession() {
        const rememberedUser = localStorage.getItem('careerConnect_rememberedUser');
        const sessionUser = sessionStorage.getItem('careerConnect_currentUser');

        if (sessionUser) {
            const user = JSON.parse(sessionUser);
            this.loginUser(user, false);
        } else if (rememberedUser) {
            const user = JSON.parse(rememberedUser);
            // Verify user still exists
            const existingUser = this.users.find(u => u.id === user.id);
            if (existingUser) {
                this.loginUser(existingUser, true);
            } else {
                localStorage.removeItem('careerConnect_rememberedUser');
            }
        }
    }

    // Create Demo Users
    createDemoUsers() {
        const demoEmployer = {
            id: 'demo-employer',
            name: 'Demo Employer',
            email: 'demo.employer@careerconnect.com',
            password: 'demo123',
            userType: 'employer',
            companyName: 'Tech Innovations Inc.',
            createdAt: new Date().toISOString(),
            avatar: this.generateAvatar('Demo Employer'),
            isOnline: false,
            lastSeen: null
        };

        const demoWorker = {
            id: 'demo-worker',
            name: 'Demo Worker',
            email: 'demo.worker@careerconnect.com',
            password: 'demo123',
            userType: 'worker',
            companyName: null,
            createdAt: new Date().toISOString(),
            avatar: this.generateAvatar('Demo Worker'),
            isOnline: false,
            lastSeen: null
        };

        // Add demo users if they don't exist
        if (!this.users.find(u => u.id === 'demo-employer')) {
            this.users.push(demoEmployer);
        }
        if (!this.users.find(u => u.id === 'demo-worker')) {
            this.users.push(demoWorker);
        }

        this.saveUsers();
    }

    // Utility Methods
    generateAvatar(name) {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        return {
            initials,
            color,
            image: null
        };
    }

    setLoadingState(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showAlert(message, type = 'info') {
        const modal = document.getElementById('alert-modal');
        const icon = document.getElementById('alert-icon');
        const title = document.getElementById('alert-title');
        const messageEl = document.getElementById('alert-message');

        // Set icon and title based on type
        switch(type) {
            case 'success':
                icon.className = 'fas fa-check-circle';
                title.textContent = 'Success';
                break;
            case 'error':
                icon.className = 'fas fa-times-circle';
                title.textContent = 'Error';
                break;
            case 'warning':
                icon.className = 'fas fa-exclamation-circle';
                title.textContent = 'Warning';
                break;
            default:
                icon.className = 'fas fa-info-circle';
                title.textContent = 'Information';
        }

        messageEl.textContent = message;
        modal.classList.add('show');

        // Setup close button
        document.getElementById('close-alert').onclick = () => {
            modal.classList.remove('show');
        };

        // Auto close after 5 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                modal.classList.remove('show');
            }, 5000);
        }
    }

    // Data Persistence
    saveUsers() {
        localStorage.setItem('careerConnect_users', JSON.stringify(this.users));
    }

    loadUsers() {
        const stored = localStorage.getItem('careerConnect_users');
        return stored ? JSON.parse(stored) : [];
    }
}

// Utility Functions for other pages
window.AuthUtils = {
    getCurrentUser() {
        const sessionUser = sessionStorage.getItem('careerConnect_currentUser');
        const rememberedUser = localStorage.getItem('careerConnect_rememberedUser');
        
        if (sessionUser) {
            return JSON.parse(sessionUser);
        } else if (rememberedUser) {
            return JSON.parse(rememberedUser);
        }
        return null;
    },

    requireAuth() {
        const user = this.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        return user;
    },

    logout() {
        // Update user status
        const user = this.getCurrentUser();
        if (user) {
            const users = JSON.parse(localStorage.getItem('careerConnect_users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex > -1) {
                users[userIndex].isOnline = false;
                users[userIndex].lastSeen = new Date().toISOString();
                localStorage.setItem('careerConnect_users', JSON.stringify(users));
            }
        }

        // Clear session data
        sessionStorage.clear();
        localStorage.removeItem('careerConnect_rememberedUser');
        
        // Clear all other app data for security
        const keysToKeep = ['careerConnect_users'];
        for (let key in localStorage) {
            if (key.startsWith('careerConnect_') && !keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        }

        window.location.href = 'login.html';
    },

    getAllUsers() {
        return JSON.parse(localStorage.getItem('careerConnect_users') || '[]');
    },

    updateUser(updatedUser) {
        const users = this.getAllUsers();
        const userIndex = users.findIndex(u => u.id === updatedUser.id);
        if (userIndex > -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('careerConnect_users', JSON.stringify(users));
            
            // Update session if it's the current user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === updatedUser.id) {
                sessionStorage.setItem('careerConnect_currentUser', JSON.stringify(updatedUser));
            }
        }
    }
};

// Initialize authentication system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthSystem();
});