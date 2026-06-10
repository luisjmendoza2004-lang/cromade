// ============================================
// CROMADE APP - LÓGICA COMPLETA
// ============================================

const app = {
    // Firebase config (REEMPLAZAR CON TUS CREDENCIALES)
    firebaseConfig: {
        apiKey: "TU_API_KEY",
        authDomain: "TU_PROYECTO.firebaseapp.com",
        projectId: "TU_PROYECTO",
        storageBucket: "TU_PROYECTO.appspot.com",
        messagingSenderId: "TU_SENDER_ID",
        appId: "TU_APP_ID"
    },

    // Estado
    user: null,
    currentChapter: null,
    currentSection: 0,
    isReading: false,
    isPlaying: false,
    audioSpeed: 1,
    speech: null,
    progress: {},

    // ============================================
    // INICIALIZACIÓN
    // ============================================
    init() {
        this.initFirebase();
        this.initEventListeners();
        this.renderChapters();
        this.checkAuthState();
        this.loadProgress();

        // Verificar si hay capítulo en URL
        const urlParams = new URLSearchParams(window.location.search);
        const chapterId = parseInt(urlParams.get('chapter'));
        if (chapterId) {
            this.loadChapter(chapterId);
        }
    },

    initFirebase() {
        if (this.firebaseConfig.apiKey !== "TU_API_KEY" && typeof firebase !== 'undefined') {
            firebase.initializeApp(this.firebaseConfig);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
        }
    },

    initEventListeners() {
        // Header
        document.getElementById('btnMenu').addEventListener('click', () => this.toggleMenu());
        document.getElementById('btnUser').addEventListener('click', () => this.showAuth());

        // Reader
        document.getElementById('btnBack').addEventListener('click', () => this.showChapters());
        document.getElementById('btnPrev').addEventListener('click', () => this.prevSection());
        document.getElementById('btnNext').addEventListener('click', () => this.nextSection());
        document.getElementById('btnQuiz').addEventListener('click', () => this.showQuiz());
        document.getElementById('btnAudio').addEventListener('click', () => this.toggleAudio());

        // Visual
        document.getElementById('btnBackVisual').addEventListener('click', () => this.showReader());

        // Quiz
        document.getElementById('btnBackQuiz').addEventListener('click', () => this.showReader());

        // Menu
        document.getElementById('btnCloseMenu').addEventListener('click', () => this.toggleMenu());

        // Audio
        document.getElementById('btnPlayPause').addEventListener('click', () => this.toggleAudio());
        document.getElementById('btnSpeed').addEventListener('click', () => this.changeSpeed());

        // Cerrar menú al hacer click fuera
        document.getElementById('menuOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.toggleMenu();
        });
    },

    // ============================================
    // AUTENTICACIÓN
    // ============================================
    checkAuthState() {
        if (this.auth) {
            this.auth.onAuthStateChanged(user => {
                this.user = user;
                this.updateUI();
            });
        }
    },

    updateUI() {
        const btnUser = document.getElementById('btnUser');
        if (this.user) {
            btnUser.textContent = '✓';
            btnUser.title = this.user.displayName || 'Usuario';
        } else {
            btnUser.textContent = '👤';
            btnUser.title = 'Iniciar sesión';
        }
        this.renderChapters();
    },

    showAuth() {
        if (this.user) {
            this.toggleMenu();
        } else {
            // Redirigir a landing para login
            window.location.href = 'landing.html';
        }
    },

    logout() {
        if (this.auth) {
            this.auth.signOut().then(() => {
                this.user = null;
                this.updateUI();
                this.toggleMenu();
            });
        }
    },

    // ============================================
    // PROGRESO
    // ============================================
    loadProgress() {
        const saved = localStorage.getItem('cromade_progress');
        if (saved) {
            this.progress = JSON.parse(saved);
        }
    },

    saveProgress() {
        localStorage.setItem('cromade_progress', JSON.stringify(this.progress));
        if (this.db && this.user) {
            this.db.collection('users').doc(this.user.uid).set({
                progress: this.progress,
                lastRead: new Date()
            }, { merge: true });
        }
    },

    getChapterProgress(chapterId) {
        return this.progress[chapterId] || { completed: false, percent: 0, quizScore: null };
    },

    updateChapterProgress(chapterId, percent) {
        if (!this.progress[chapterId]) {
            this.progress[chapterId] = { completed: false, percent: 0, quizScore: null };
        }
        this.progress[chapterId].percent = Math.max(this.progress[chapterId].percent, percent);
        if (percent >= 100) {
            this.progress[chapterId].completed = true;
        }
        this.saveProgress();
    },

    // ============================================
    // RENDERIZADO DE CAPÍTULOS
    // ============================================
    renderChapters() {
        const grid = document.getElementById('chaptersGrid');
        grid.innerHTML = '';

        CROMADE_DATA.chapters.forEach(chapter => {
            const card = document.createElement('div');
            card.className = 'chapter-card';

            // Determinar estado
            const isFree = chapter.status === 'free';
            const isFreeReg = chapter.status === 'free-reg';
            const isLocked = chapter.status === 'locked';
            const canAccess = isFree || (isFreeReg && this.user) || (isLocked && this.user && this.user.premium);

            const progress = this.getChapterProgress(chapter.id);
            const isReading = progress.percent > 0 && progress.percent < 100;
            const isCompleted = progress.completed;

            if (isFree) card.classList.add('free');
            if (isLocked) card.classList.add('locked');
            if (isReading) card.classList.add('reading');

            let badgeClass = 'badge-locked';
            let badgeText = '🔒 PREMIUM';
            if (isFree) { badgeClass = 'badge-free'; badgeText = 'GRATIS'; }
            else if (isFreeReg) { badgeClass = 'badge-free-reg'; badgeText = this.user ? 'GRATIS' : 'REGISTRO'; }

            card.innerHTML = `
                <div class="chapter-number">${chapter.number}</div>
                <h3 class="chapter-title">${chapter.title}</h3>
                <p class="chapter-desc">${chapter.subtitle}</p>
                <div class="chapter-meta">
                    <span class="chapter-badge ${badgeClass}">${badgeText}</span>
                    <span class="chapter-badge badge-time">${chapter.readTime}</span>
                    ${chapter.hasVisual ? '<span class="chapter-badge">🎬</span>' : ''}
                    ${chapter.hasAudio ? '<span class="chapter-badge">🔊</span>' : ''}
                </div>
                ${progress.percent > 0 ? `
                <div class="chapter-progress">
                    <div class="chapter-progress-fill" style="width: ${progress.percent}%"></div>
                </div>
                ` : ''}
            `;

            card.addEventListener('click', () => {
                if (!canAccess) {
                    if (isFreeReg && !this.user) {
                        alert('Registrate gratis para acceder a este capítulo');
                        window.location.href = 'landing.html';
                    } else {
                        alert('Este capítulo requiere suscripción premium');
                        window.location.href = 'landing.html#precios';
                    }
                    return;
                }
                this.loadChapter(chapter.id);
            });

            grid.appendChild(card);
        });
    },
      // ============================================
    // CARGAR CAPÍTULO
    // ============================================
    loadChapter(id) {
        const chapter = CROMADE_DATA.getChapter(id);
        if (!chapter) return;

        this.currentChapter = chapter;
        this.currentSection = 0;

        // Ocultar selector, mostrar reader
        document.getElementById('chapterSelector').classList.add('hidden');
        document.getElementById('reader').classList.remove('hidden');
        document.getElementById('visualMode').classList.add('hidden');
        document.getElementById('quizMode').classList.add('hidden');

        // Renderizar contenido
        document.getElementById('readerContent').innerHTML = chapter.content;

        // Actualizar progreso
        this.updateProgressBar();
        this.updateNavButtons();

        // Scroll al inicio
        document.querySelector('.app-main').scrollTop = 0;

        // Auto-guardar progreso al leer
        this.trackReadingProgress();
    },

    trackReadingProgress() {
        const reader = document.querySelector('.app-main');
        const content = document.getElementById('readerContent');

        reader.addEventListener('scroll', () => {
            if (!this.currentChapter) return;
            const scrollPercent = (reader.scrollTop + reader.clientHeight) / content.scrollHeight;
            const percent = Math.min(100, Math.round(scrollPercent * 100));
            this.updateChapterProgress(this.currentChapter.id, percent);
            this.updateProgressBar();
        });
    },

    updateProgressBar() {
        if (!this.currentChapter) return;
        const progress = this.getChapterProgress(this.currentChapter.id);
        document.getElementById('progressFill').style.width = progress.percent + '%';
        document.getElementById('progressText').textContent = progress.percent + '%';
    },

    updateNavButtons() {
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        btnPrev.disabled = this.currentSection === 0;
        // Simplified: no sections, just scroll
    },

    prevSection() {
        document.querySelector('.app-main').scrollBy({ top: -500, behavior: 'smooth' });
    },

    nextSection() {
        document.querySelector('.app-main').scrollBy({ top: 500, behavior: 'smooth' });
    },

    // ============================================
    // AUDIO / TTS
    // ============================================
    toggleAudio() {
        if (this.isPlaying) {
            this.stopAudio();
        } else {
            this.startAudio();
        }
    },

    startAudio() {
        if (!this.currentChapter) return;
        if (!window.speechSynthesis) {
            alert('Tu navegador no soporta audio');
            return;
        }

        // Obtener texto limpio
        const content = document.getElementById('readerContent');
        const text = content.innerText;

        this.speech = new SpeechSynthesisUtterance(text);
        this.speech.lang = 'es-ES';
        this.speech.rate = this.audioSpeed;
        this.speech.pitch = 1;

        this.speech.onend = () => {
            this.isPlaying = false;
            this.updateAudioUI();
        };

        window.speechSynthesis.speak(this.speech);
        this.isPlaying = true;
        this.updateAudioUI();
        document.getElementById('audioPlayer').classList.remove('hidden');
    },

    stopAudio() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.isPlaying = false;
        this.updateAudioUI();
    },

    changeSpeed() {
        const speeds = [0.8, 1, 1.2, 1.5, 2];
        const currentIndex = speeds.indexOf(this.audioSpeed);
        this.audioSpeed = speeds[(currentIndex + 1) % speeds.length];
        document.getElementById('btnSpeed').textContent = this.audioSpeed + 'x';

        // Reiniciar con nueva velocidad
        if (this.isPlaying) {
            this.stopAudio();
            setTimeout(() => this.startAudio(), 100);
        }
    },

    updateAudioUI() {
        const btn = document.getElementById('btnPlayPause');
        const player = document.getElementById('audioPlayer');
        btn.textContent = this.isPlaying ? '⏸' : '▶';
        if (!this.isPlaying) {
            player.classList.add('paused');
        } else {
            player.classList.remove('paused');
        }
    },

    // ============================================
    // QUIZ
    // ============================================
    showQuiz() {
        if (!this.currentChapter || !this.currentChapter.quiz) return;

        document.getElementById('reader').classList.add('hidden');
        document.getElementById('quizMode').classList.remove('hidden');

        const container = document.getElementById('quizContent');
        container.innerHTML = '';

        let currentQuestion = 0;
        let score = 0;
        const quiz = this.currentChapter.quiz;

        const renderQuestion = () => {
            if (currentQuestion >= quiz.length) {
                // Mostrar resultado
                const percent = Math.round((score / quiz.length) * 100);
                this.progress[this.currentChapter.id].quizScore = percent;
                this.saveProgress();

                container.innerHTML = `
                    <div class="quiz-result">
                        <div class="quiz-result-score">${percent}%</div>
                        <p class="quiz-result-text">
                            ${percent >= 80 ? '🎉 ¡Excelente! Dominás el capítulo.' :
                              percent >= 60 ? '👍 Bien. Seguí profundizando.' :
                              '📚 Repasá el capítulo y volvé a intentar.'}
                        </p>
                        <button class="btn-quiz" onclick="app.showReader()">Volver al capítulo</button>
                    </div>
                `;
                return;
            }

            const q = quiz[currentQuestion];
            container.innerHTML = `
                <div class="quiz-question">Pregunta ${currentQuestion + 1} de ${quiz.length}</div>
                <h3>${q.question}</h3>
                <div class="quiz-options">
                    ${q.options.map((opt, i) => `
                        <button class="quiz-option" onclick="app.answerQuiz(${i})">${opt}</button>
                    `).join('')}
                </div>
            `;
        };

        this.answerQuiz = (answerIndex) => {
            const q = quiz[currentQuestion];
            const buttons = container.querySelectorAll('.quiz-option');

            buttons.forEach((btn, i) => {
                btn.disabled = true;
                if (i === q.correct) btn.classList.add('correct');
                if (i === answerIndex && i !== q.correct) btn.classList.add('incorrect');
            });

            if (answerIndex === q.correct) score++;

            setTimeout(() => {
                currentQuestion++;
                renderQuestion();
            }, 1500);
        };

        renderQuestion();
    },

    // ============================================
    // VISUAL MODE
    // ============================================
    showVisual() {
        if (!this.currentChapter || !this.currentChapter.visualScenes) return;

        document.getElementById('reader').classList.add('hidden');
        document.getElementById('visualMode').classList.remove('hidden');

        this.currentVisualScene = 0;
        this.renderVisualScene();
    },

    renderVisualScene() {
        const scene = this.currentChapter.visualScenes[this.currentVisualScene];
        if (!scene) {
            this.showReader();
            return;
        }

        document.getElementById('visualTitle').textContent = this.currentChapter.title;
        document.getElementById('visualScene').innerHTML = `
            <div class="visual-scene-placeholder">
                <span class="scene-icon">🎬</span>
                <span class="scene-desc">${scene.scene}</span>
            </div>
        `;
        document.getElementById('visualDialogue').innerHTML = `
            <div class="dialogue-speaker">${scene.dialogue.speaker}</div>
            <div class="dialogue-text">${scene.dialogue.text}</div>
        `;
        document.getElementById('visualChoices').innerHTML = scene.choices.map((choice, i) => `
            <button class="choice-btn" onclick="app.chooseVisual(${i})">${choice.text}</button>
        `).join('');
    },

    chooseVisual(choiceIndex) {
        const scene = this.currentChapter.visualScenes[this.currentVisualScene];
        const next = scene.choices[choiceIndex].next;

        // Marcar seleccionado
        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach((btn, i) => {
            if (i === choiceIndex) btn.classList.add('selected');
        });

        setTimeout(() => {
            this.currentVisualScene = next;
            this.renderVisualScene();
        }, 1000);
    },

    // ============================================
    // NAVEGACIÓN
    // ============================================
    showChapters() {
        this.stopAudio();
        this.currentChapter = null;

        document.getElementById('chapterSelector').classList.remove('hidden');
        document.getElementById('reader').classList.add('hidden');
        document.getElementById('visualMode').classList.add('hidden');
        document.getElementById('quizMode').classList.add('hidden');
        document.getElementById('audioPlayer').classList.add('hidden');

        this.renderChapters();
    },

    showReader() {
        document.getElementById('reader').classList.remove('hidden');
        document.getElementById('quizMode').classList.add('hidden');
        document.getElementById('visualMode').classList.add('hidden');
    },

    toggleMenu() {
        const overlay = document.getElementById('menuOverlay');
        overlay.classList.toggle('hidden');
    },

    showBookmarks() {
        alert('Marcadores: ' + Object.keys(this.progress).filter(k => this.progress[k].percent > 0).join(', '));
    },

    showSettings() {
        alert('Configuración:\n- Tamaño de fuente: Mediano\n- Modo nocturno: Activado\n- Audio: ' + (this.audioSpeed * 100) + '%');
    },

    showHelp() {
        alert('CROMADE - Ayuda\n\n📖 Capítulos: Seleccioná el que querés leer\n🔊 Audio: Escuchá el capítulo en voz alta\n🎯 Quiz: Respondé preguntas del capítulo\n🎬 Visuales: Modo historia interactiva\n\nProgreso guardado automáticamente.');
    }
};

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
