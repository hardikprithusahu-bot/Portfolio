/* ============================================
   HARDIK SAHU - PORTFOLIO SCRIPTS
   Modern Interactive Features
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initCursorGlow();
    initNavbar();
    initMobileMenu();
    initScrollAnimations();
    initCounters();
    initSmoothScroll();
});

/* ============================================
   CURSOR GLOW EFFECT
   ============================================ */
function initCursorGlow() {
    const cursorGlow = document.querySelector('.cursor-glow');
    
    if (!cursorGlow) return;
    
    // Only enable on desktop
    if (window.innerWidth > 768) {
        document.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                cursorGlow.style.left = e.clientX + 'px';
                cursorGlow.style.top = e.clientY + 'px';
            });
        });
    }
}

/* ============================================
   NAVBAR SCROLL EFFECT
   ============================================ */
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    
    if (!navbar) return;
    
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        // Add/remove scrolled class
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
    });
}

/* ============================================
   MOBILE MENU
   ============================================ */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuBtn || !navLinks) return;
    
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });
    
    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

/* ============================================
   SCROLL ANIMATIONS
   ============================================ */
function initScrollAnimations() {
    // Elements to reveal
    const revealElements = document.querySelectorAll(
        '.section-header, .about-content, .skill-category, .timeline-item, ' +
        '.project-card, .education-card, .certs-column, .contact-content'
    );
    
    // Create observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing after revealed
                // observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Add reveal class and observe
    revealElements.forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });
}

/* ============================================
   ANIMATED COUNTERS
   ============================================ */
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    
    if (!counters.length) return;
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => counterObserver.observe(counter));
}

function animateCounter(element) {
    const target = parseFloat(element.dataset.count);
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();
    const isDecimal = target % 1 !== 0;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const current = start + (target - start) * easeOut;
        
        if (isDecimal) {
            element.textContent = current.toFixed(2);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            if (isDecimal) {
                element.textContent = target.toFixed(2);
            } else {
                element.textContent = target.toLocaleString();
            }
        }
    }
    
    requestAnimationFrame(update);
}

/* ============================================
   SMOOTH SCROLL
   ============================================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = targetElement.offsetTop - navbarHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ============================================
   TYPING EFFECT (Optional Enhancement)
   ============================================ */
function initTypingEffect() {
    const typingElement = document.querySelector('.typing-text');
    
    if (!typingElement) return;
    
    const texts = ['Data Analytics Specialist', 'Python Developer', 'ML Enthusiast'];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typingElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
        }
        
        let typeSpeed = isDeleting ? 50 : 100;
        
        if (!isDeleting && charIndex === currentText.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeSpeed = 500;
        }
        
        setTimeout(type, typeSpeed);
    }
    
    // Uncomment to enable typing effect
    // type();
}

/* ============================================
   PARALLAX EFFECT (Optional Enhancement)
   ============================================ */
function initParallax() {
    const shapes = document.querySelectorAll('.shape');
    
    if (!shapes.length || window.innerWidth < 768) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        shapes.forEach((shape, index) => {
            const speed = 0.1 * (index + 1);
            shape.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });
}

/* ============================================
   ACTIVE NAV LINK HIGHLIGHTING
   ============================================ */
function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    window.addEventListener('scroll', () => {
        let current = '';
        const navbarHeight = document.querySelector('.navbar').offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - navbarHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && 
                window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', () => {
    initActiveNavHighlight();
    // initTypingEffect(); // Uncomment to enable
    // initParallax(); // Uncomment to enable
});

/* ============================================
   FORM VALIDATION (If contact form is added)
   ============================================ */
function validateForm(form) {
    const email = form.querySelector('input[type="email"]');
    const message = form.querySelector('textarea');
    let isValid = true;
    
    if (email && !isValidEmail(email.value)) {
        showError(email, 'Please enter a valid email');
        isValid = false;
    }
    
    if (message && message.value.trim().length < 10) {
        showError(message, 'Message must be at least 10 characters');
        isValid = false;
    }
    
    return isValid;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(input, message) {
    const formGroup = input.parentElement;
    const error = formGroup.querySelector('.error-message') || document.createElement('span');
    error.className = 'error-message';
    error.textContent = message;
    
    if (!formGroup.querySelector('.error-message')) {
        formGroup.appendChild(error);
    }
    
    input.classList.add('error');
    
    setTimeout(() => {
        error.remove();
        input.classList.remove('error');
    }, 3000);
}

/* ============================================
   PERFORMANCE OPTIMIZATION
   ============================================ */
// Debounce function for scroll events
function debounce(func, wait = 10) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Throttle function for high-frequency events
function throttle(func, limit = 100) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
