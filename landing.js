// ============================================
// CROMADE LANDING - JAVASCRIPT COMPLETO
// ============================================

const landingApp = {
    firebaseConfig: {
        apiKey: "TU_API_KEY",
        authDomain: "TU_PROYECTO.firebaseapp.com",
        projectId: "TU_PROYECTO",
        storageBucket: "TU_PROYECTO.appspot.com",
        messagingSenderId: "TU_SENDER_ID",
        appId: "TU_APP_ID"
    },

    user: null,
    selectedPayment: null,
    currentPlan: null,

    init() {
        this.initFirebase();
        this.initScrollEffects();
        this.initCounters();
        this.initMobileMenu();
        this.checkAuthState();
    },

    initFirebase() {
        if (this.firebaseConfig.apiKey !== "TU_API_KEY" && typeof firebase !== 'undefined') {
            firebase.initializeApp(this.firebaseConfig);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
        }
    },

    initScrollEffects() {
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        });
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    },

    initCounters() {
        const counters = document.querySelectorAll('.hero-stat-num[data-count]');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.dataset.count);
                    this.animateCounter(entry.target, target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(counter => observer.observe(counter));
    },

    animateCounter(element, target) {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target + (target >= 50 ? '+' : '');
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 30);
    },

    initMobileMenu() {
        // Toggle ya en HTML
    },

    toggleMobileMenu() {
        document.getElementById('navLinks').classList.toggle('active');
    },

    scrollToApp() {
        document.getElementById('experiencia').scrollIntoView({ behavior: 'smooth' });
    },

    goToApp() {
        window.location.href = 'index.html';
    },

    goToChapter(num) {
        if (num === 1) {
            window.location.href = 'index.html?chapter=1';
        } else if (num === 2) {
            if (this.user) {
                window.location.href = 'index.html?chapter=2';
            } else {
                this.showToast('info', 'Registrate gratis para acceder al Capítulo 2');
                this.showLoginModal();
            }
        } else {
            this.showToast('info', 'Desbloqueá todos los capítulos con una suscripción');
            this.startSubscription('monthly');
        }
    },

    goToFreeChapter() {
        window.location.href = 'index.html?chapter=1';
    },

    showLockMessage(chapter) {
        this.showToast('info', `Capítulo ${chapter} disponible con suscripción Viajero`);
        setTimeout(() => this.startSubscription('monthly'), 1500);
    },

    checkAuthState() {
        if (this.auth) {
            this.auth.onAuthStateChanged(user => {
                this.user = user;
                this.updateUIForUser();
            });
        }
    },

    updateUIForUser() {
        const loginBtn = document.querySelector('.btn-nav-login');
        const ctaBtn = document.querySelector('.btn-nav-cta');
        if (this.user) {
            if (loginBtn) loginBtn.textContent = this.user.displayName || 'Mi Cuenta';
            if (ctaBtn) ctaBtn.textContent = 'Continuar Leyendo';
        }
    },

    showLoginModal() {
        document.getElementById('loginModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
        document.body.style.overflow = '';
    },

    switchAuthTab(tab) {
        document.querySelectorAll('.auth-tab-landing').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-panel-landing').forEach(p => p.classList.remove('active'));
        if (tab === 'login') {
            document.getElementById('tabLogin').classList.add('active');
            document.getElementById('loginPanel').classList.add('active');
        } else {
            document.getElementById('tabRegister').classList.add('active');
            document.getElementById('registerPanel').classList.add('active');
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        if (!this.auth) {
            this.showToast('error', 'Firebase no configurado. Revisá las credenciales.');
            return;
        }
        try {
            await this.auth.signInWithEmailAndPassword(email, password);
            this.showToast('success', '¡Bienvenido de vuelta, Arquitecto!');
            this.closeLoginModal();
            this.updateUIForUser();
        } catch (error) {
            this.showToast('error', this.getAuthErrorMessage(error.code));
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        if (!this.auth) {
            this.showToast('error', 'Firebase no configurado. Revisá las credenciales.');
            return;
        }
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName: name });
            if (this.db) {
                await this.db.collection('users').doc(result.user.uid).set({
                    name, email, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscription: 'free', chaptersRead: [], progress: {}
                });
            }
            this.showToast('success', '¡Bienvenido a los Arquitectos del Silencio!');
            this.closeLoginModal();
            this.updateUIForUser();
            setTimeout(() => { window.location.href = 'index.html?chapter=2'; }, 1500);
        } catch (error) {
            this.showToast('error', this.getAuthErrorMessage(error.code));
        }
    },

    async loginWithGoogle() {
        if (!this.auth) {
            this.showToast('error', 'Firebase no configurado');
            return;
        }
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await this.auth.signInWithPopup(provider);
            this.showToast('success', '¡Inicio de sesión exitoso!');
            this.closeLoginModal();
            this.updateUIForUser();
        } catch (error) {
            this.showToast('error', this.getAuthErrorMessage(error.code));
        }
    },

    showForgotPassword() {
        const email = prompt('Ingresá tu email para recuperar la contraseña:');
        if (email && this.auth) {
            this.auth.sendPasswordResetEmail(email)
                .then(() => this.showToast('success', 'Email de recuperación enviado'))
                .catch(err => this.showToast('error', err.message));
        }
    },

    getAuthErrorMessage(code) {
        const errors = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuario deshabilitado',
            'auth/user-not-found': 'Usuario no encontrado',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/email-already-in-use': 'Email ya registrado',
            'auth/weak-password': 'Contraseña débil (mínimo 6 caracteres)',
            'auth/invalid-credential': 'Credenciales inválidas',
            'auth/popup-closed-by-user': 'Ventana cerrada por el usuario',
            'auth/cancelled-popup-request': 'Operación cancelada'
        };
        return errors[code] || 'Error de autenticación. Intentá de nuevo.';
    },
      startSubscription(plan) {
        this.currentPlan = plan;
        const planNames = { 'monthly': 'Viajero Mensual', 'yearly': 'Viajero Anual' };
        const planPrices = { 'monthly': '$4.99/mes', 'yearly': '$49.99/año' };
        document.getElementById('planName').textContent = planNames[plan] || 'Viajero';
        document.getElementById('planPrice').textContent = planPrices[plan] || '$4.99/mes';
        document.getElementById('paymentTitle').textContent = 'Suscribirse';
        this.showPaymentModal();
    },

    donate(amount) {
        this.currentPlan = 'donation';
        document.getElementById('planName').textContent = 'Donación Mecenas';
        document.getElementById('planPrice').textContent = `$${amount}`;
        document.getElementById('paymentTitle').textContent = 'Apoyar como Mecenas';
        this.showPaymentModal();
    },

    donateCustom() {
        const amount = prompt('¿Cuánto querés donar? (USD)');
        if (amount && !isNaN(amount) && amount > 0) {
            this.donate(parseFloat(amount));
        }
    },

    showPaymentModal() {
        document.getElementById('paymentModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        this.selectedPayment = null;
        document.getElementById('btnConfirmPayment').disabled = true;
        document.querySelectorAll('.payment-method-landing').forEach(m => {
            m.classList.remove('selected');
            m.querySelector('.payment-method-check').textContent = '○';
        });
    },

    closePaymentModal() {
        document.getElementById('paymentModal').classList.remove('active');
        document.body.style.overflow = '';
    },

    selectPayment(method) {
        this.selectedPayment = method;
        document.querySelectorAll('.payment-method-landing').forEach(m => {
            m.classList.remove('selected');
            m.querySelector('.payment-method-check').textContent = '○';
        });
        const methods = ['mercadopago', 'stripe', 'crypto'];
        const index = methods.indexOf(method);
        const selected = document.querySelectorAll('.payment-method-landing')[index];
        if (selected) {
            selected.classList.add('selected');
            selected.querySelector('.payment-method-check').textContent = '●';
        }
        document.getElementById('btnConfirmPayment').disabled = false;
    },

    processPayment() {
        if (!this.selectedPayment) {
            this.showToast('error', 'Seleccioná un método de pago');
            return;
        }
        const btn = document.getElementById('btnConfirmPayment');
        btn.textContent = 'Procesando...';
        btn.disabled = true;

        setTimeout(() => {
            this.showToast('success', '¡Pago exitoso! Bienvenido a bordo, Viajero.');
            this.closePaymentModal();
            btn.textContent = 'Confirmar pago';
            if (this.db && this.user) {
                this.db.collection('users').doc(this.user.uid).update({
                    subscription: this.currentPlan === 'yearly' ? 'yearly' : 'monthly',
                    subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        }, 2000);
    },

    openTrailerModal() {
        document.getElementById('trailerModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    closeTrailerModal() {
        document.getElementById('trailerModal').classList.remove('active');
        document.body.style.overflow = '';
    },

    toggleFaq(button) {
        const item = button.parentElement;
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(faq => faq.classList.remove('active'));
        if (!isActive) item.classList.add('active');
    },

    showTerms() {
        alert('TÉRMINOS DE USO\n\n1. Aceptación: Al usar CROMADE, aceptás estos términos.\n2. Contenido: Todo el contenido es propiedad intelectual protegida.\n3. Pagos: Las suscripciones se renuevan automáticamente. Podés cancelar en cualquier momento.\n4. Cuenta: Sos responsable de mantener tu contraseña segura.\n5. Terminación: Podemos suspender cuentas que violen estas reglas.');
    },

    showPrivacy() {
        alert('POLÍTICA DE PRIVACIDAD\n\n- Tu email y progreso se guardan en Firebase (Google).\n- No vendemos ni compartimos datos con terceros.\n- Podés pedir la eliminación completa de tus datos en cualquier momento.\n- Usamos cookies solo para guardar tu progreso de lectura.');
    },

    showCookies() {
        alert('COOKIES\n\nUsamos cookies mínimas y esenciales para:\n- Guardar tu progreso de lectura\n- Mantener tu sesión iniciada\n- Recordar tus preferencias\n\nNo usamos cookies de rastreo ni publicidad.');
    },

    showToast(type, message) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        container.appendChild(toast);
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'toastIn 0.3s ease reverse';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    },

    handleEscape(e) {
        if (e.key === 'Escape') {
            this.closeLoginModal();
            this.closePaymentModal();
            this.closeTrailerModal();
        }
    }
};

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    landingApp.init();
});

document.addEventListener('keydown', (e) => {
    landingApp.handleEscape(e);
});

document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
});
