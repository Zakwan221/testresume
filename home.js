// CareerConnect Landing Page JavaScript
class LandingPage {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.navToggle = document.getElementById('nav-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.scrollTopBtn = document.getElementById('scroll-top');
        this.contactForm = document.getElementById('contact-form');
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupScrollEffects();
        this.setupMobileMenu();
        this.setupStepsSwitcher();
        this.setupContactForm();
        this.setupScrollToTop();
        this.setupAnimations();
        this.animateCounters();
        
        // Initialize page
        this.updateActiveNavLink();
    }

    // Navigation Setup
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = link.getAttribute('data-section');
                this.scrollToSection(targetSection);
                
                // Close mobile menu if open
                this.closeMobileMenu();
            });
        });

        // Handle scroll to update active nav link
        window.addEventListener('scroll', () => {
            this.updateActiveNavLink();
        });
    }

    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const offsetTop = section.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }

    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.nav-link[data-section="${sectionId}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    // Scroll Effects
    setupScrollEffects() {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            
            // Navbar scroll effect
            if (scrollY > 100) {
                this.navbar.classList.add('scrolled');
            } else {
                this.navbar.classList.remove('scrolled');
            }

            // Scroll to top button
            if (scrollY > 500) {
                this.scrollTopBtn.classList.add('show');
            } else {
                this.scrollTopBtn.classList.remove('show');
            }

            // Parallax effect for hero graphics
            this.updateParallax(scrollY);
        });
    }

    updateParallax(scrollY) {
        const heroGraphic = document.querySelector('.hero-graphic');
        const floatingCards = document.querySelectorAll('.floating-card');
        
        if (heroGraphic) {
            const speed = scrollY * 0.5;
            heroGraphic.style.transform = `translate(-50%, calc(-50% + ${speed}px))`;
        }

        floatingCards.forEach((card, index) => {
            const speed = scrollY * (0.1 + index * 0.05);
            card.style.transform = `translateY(${speed}px)`;
        });
    }

    // Mobile Menu
    setupMobileMenu() {
        this.navToggle.addEventListener('click', () => {
            this.toggleMobileMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Close menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.closeMobileMenu();
            }
        });
    }

    toggleMobileMenu() {
        this.navMenu.classList.toggle('active');
        this.navToggle.classList.toggle('active');
    }

    closeMobileMenu() {
        this.navMenu.classList.remove('active');
        this.navToggle.classList.remove('active');
    }

    // Steps Switcher (How it Works section)
    setupStepsSwitcher() {
        const stepTabs = document.querySelectorAll('.step-tab');
        const stepsGroups = document.querySelectorAll('.steps-group');

        stepTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.getAttribute('data-target');
                
                // Update active tab
                stepTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update active steps group
                stepsGroups.forEach(group => group.classList.remove('active'));
                const targetGroup = document.getElementById(target);
                if (targetGroup) {
                    targetGroup.classList.add('active');
                    
                    // Trigger animations for steps
                    this.animateSteps(targetGroup);
                }
            });
        });
    }

    animateSteps(container) {
        const steps = container.querySelectorAll('.step');
        steps.forEach((step, index) => {
            step.style.opacity = '0';
            step.style.transform = 'translateX(-30px)';
            
            setTimeout(() => {
                step.style.transition = 'all 0.6s ease';
                step.style.opacity = '1';
                step.style.transform = 'translateX(0)';
            }, index * 200);
        });
    }

    // Contact Form
    setupContactForm() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleContactSubmit();
            });

            // Setup floating labels
            this.setupFloatingLabels();
        }
    }

    setupFloatingLabels() {
        const formInputs = this.contactForm.querySelectorAll('input, textarea, select');
        
        formInputs.forEach(input => {
            // Check initial state
            this.updateLabelState(input);
            
            input.addEventListener('focus', () => this.updateLabelState(input));
            input.addEventListener('blur', () => this.updateLabelState(input));
            input.addEventListener('input', () => this.updateLabelState(input));
        });
    }

    updateLabelState(input) {
        const label = input.nextElementSibling;
        if (label && label.tagName === 'LABEL') {
            if (input.value || input === document.activeElement) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        }
    }

    async handleContactSubmit() {
        const formData = new FormData(this.contactForm);
        const submitBtn = this.contactForm.querySelector('button[type="submit"]');
        
        // Get form data
        const contactData = {
            name: formData.get('name') || document.getElementById('name').value,
            email: formData.get('email') || document.getElementById('email').value,
            subject: formData.get('subject') || document.getElementById('subject').value,
            message: formData.get('message') || document.getElementById('message').value
        };

        // Validate form
        if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
            this.showAlert('Please fill in all required fields', 'error');
            return;
        }

        if (!this.isValidEmail(contactData.email)) {
            this.showAlert('Please enter a valid email address', 'error');
            return;
        }

        // Show loading state
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await this.delay(2000);
            
            // Success
            this.showAlert('Thank you for your message! We\'ll get back to you soon.', 'success');
            this.contactForm.reset();
            
            // Reset floating labels
            const formInputs = this.contactForm.querySelectorAll('input, textarea, select');
            formInputs.forEach(input => this.updateLabelState(input));
            
        } catch (error) {
            this.showAlert('Sorry, there was an error sending your message. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Scroll to Top
    setupScrollToTop() {
        this.scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Counter Animations
    animateCounters() {
        const counters = document.querySelectorAll('.stat-number');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current >= target) {
                element.textContent = target;
                if (target === 98) element.textContent = target + '%'; // For success rate
                return;
            }
            
            element.textContent = Math.floor(current);
            if (target === 98) element.textContent = Math.floor(current) + '%';
            requestAnimationFrame(updateCounter);
        };

        updateCounter();
    }

    // Scroll Animations (Simple AOS alternative)
    setupAnimations() {
        const animatedElements = document.querySelectorAll('[data-aos]');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                }
            });
        }, { 
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    }

    // Utility Functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showAlert(message, type = 'info') {
        // Remove any existing alerts
        const existingAlerts = document.querySelectorAll('.landing-alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create alert element
        const alert = document.createElement('div');
        alert.className = `landing-alert alert-${type}`;
        alert.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 3000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        alert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(alert);
        
        // Remove after 5 seconds
        setTimeout(() => {
            alert.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(alert)) {
                    document.body.removeChild(alert);
                }
            }, 300);
        }, 5000);
    }

    // Smooth reveal animations for elements
    revealOnScroll() {
        const reveals = document.querySelectorAll('.feature-card, .step, .about-feature');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        reveals.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'all 0.6s ease';
            observer.observe(element);
        });
    }

    // Initialize enhanced interactions
    setupEnhancedInteractions() {
        // Floating cards hover effect
        const floatingCards = document.querySelectorAll('.floating-card');
        floatingCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.05)';
                card.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
            });
        });

        // Feature cards hover effect
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                const icon = card.querySelector('.feature-icon');
                if (icon) {
                    icon.style.transform = 'scale(1.1) rotate(5deg)';
                }
            });
            
            card.addEventListener('mouseleave', () => {
                const icon = card.querySelector('.feature-icon');
                if (icon) {
                    icon.style.transform = 'scale(1) rotate(0deg)';
                }
            });
        });
    }

    // Header typing effect
    setupTypingEffect() {
        const titleElement = document.querySelector('.hero-title');
        if (titleElement) {
            const originalText = titleElement.innerHTML;
            titleElement.innerHTML = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < originalText.length) {
                    titleElement.innerHTML += originalText.charAt(i);
                    i++;
                    setTimeout(typeWriter, 50);
                }
            };
            
            setTimeout(typeWriter, 500);
        }
    }
}

// CSS animations for alerts
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

    .feature-icon {
        transition: transform 0.3s ease !important;
    }

    .floating-card {
        transition: all 0.3s ease !important;
    }

    .contact-form label.active {
        top: -0.5rem !important;
        left: 0.75rem !important;
        font-size: 0.8rem !important;
        color: #667eea !important;
        background: white !important;
        padding: 0 0.5rem !important;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const landingPage = new LandingPage();
    
    // Setup enhanced interactions after a short delay
    setTimeout(() => {
        landingPage.setupEnhancedInteractions();
        landingPage.revealOnScroll();
    }, 1000);
});

// Performance optimization: Throttle scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Add smooth scroll polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothScrollPolyfill = function(target) {
        const startPosition = window.pageYOffset;
        const targetPosition = target.offsetTop - 80;
        const distance = targetPosition - startPosition;
        const duration = 1000;
        let start = null;

        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            const ease = percentage * (2 - percentage); // easeOutQuad
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (progress < duration) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    };

    // Override scrollTo for smooth behavior
    window.scrollTo = function(x, y) {
        if (typeof x === 'object' && x.behavior === 'smooth') {
            const target = document.elementFromPoint(0, y) || document.body;
            smoothScrollPolyfill(target);
        } else {
            window.scroll(x, y);
        }
    };
}