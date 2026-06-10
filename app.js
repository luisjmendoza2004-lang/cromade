// ============================================
// CROMADE APP - LÓGICA COMPLETA
// ============================================

const app = {
    firebaseConfig: {
        apiKey: "TU_API_KEY",
        authDomain: "TU_PROYECTO.firebaseapp.com",
        projectId: "TU_PROYECTO",
        storageBucket: "TU_PROYECTO.appspot.com",
        messagingSenderId: "TU_SENDER_ID",
        appId: "TU_APP_ID"
    },

    user: null,
    currentChapter: null,
    currentSection: 0,
    isReading: false,
    isPlaying: false,
    audioSpeed: 1,
    speech: null,
    progress: {},

    init() {
        this.initFirebase();
        this.initEventListeners();
        this.renderChapters();
        this.checkAuthState();
        this.loadProgress();

        const urlParams = new URLSearchParams(window.location.search);
        const chapterId = parseInt(urlParams.get('chapter'));
        if (chapterId) {
            setTimeout(() => this.loadChapter(chapterId), 100);
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
        document.getElementById('btnMenu').addEventListener('click', () => this.toggleMenu());
        document.getElementById('btnUser').addEventListener('click', () => this.showAuth());
        document.getElementById('btnBack').addEventListener('click', () => this.showChapters());
        document.getElementById('btnPrev').addEventListener('click', () => this.prevSection());
        document.getElementById('btnNext').addEventListener('click', () => this.nextSection());
        document.getElementById('btnQuiz').addEventListener('click', () => this.showQuiz());
        document.getElementById('btnAudio').addEventListener('click', () => this.toggleAudio());
        document.getElementById('btnBackVisual').addEventListener('click', () => this.showReader());
        document.getElementById('btnBackQuiz').addEventListener('click', () => this.showReader());
        document.getElementById('btnCloseMenu').addEventListener('click', () => this.toggleMenu());
        document.getElementById('btnPlayPause').addEventListener('click', () => this.toggleAudio());
        document.getElementById('btnSpeed').addEventListener('click', () => this.changeSpeed());
        document.getElementById('menuOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.toggleMenu();
        });
    },

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

    renderChapters() {
        const grid = document.getElementById('chaptersGrid');
        if (!grid) return;
        grid.innerHTML = '';

        CROMADE_DATA.chapters.forEach(chapter => {
            const card = document.createElement('div');
            card.className = 'chapter-card';

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

    loadChapter(id) {
        const chapter = CROMADE_DATA.getChapter(id);
        if (!chapter) return;

        this.currentChapter = chapter;
        this.currentSection = 0;

        // Ocultar selector
        const selector = document.getElementById('chapterSelector');
        if (selector) selector.classList.add('hidden');

        // Mostrar reader
        const reader = document.getElementById('reader');
        if (reader) {
            reader.classList.remove('hidden');
            reader.style.display = 'block';
        }

        // Ocultar otros modos
        const visualMode = document.getElementById('visualMode');
        const quizMode = document.getElementById('quizMode');
        const audioPlayer = document.getElementById('audioPlayer');
        if (visualMode) visualMode.classList.add('hidden');
        if (quizMode) quizMode.classList.add('hidden');
        if (audioPlayer) audioPlayer.classList.add('hidden');

        // Renderizar contenido
        const readerContent = document.getElementById('readerContent');
        if (readerContent) {
            readerContent.innerHTML = chapter.content;
        }

        // Actualizar progreso
        this.updateProgressBar();
        this.updateNavButtons();

        // Scroll al inicio
        const appMain = document.querySelector('.app-main');
        if (appMain) appMain.scrollTop = 0;

        // Guardar progreso inicial
        this.updateChapterProgress(chapter.id, 0);

        // Inicializar tracking de lectura
        this.trackReadingProgress();
    },

    trackReadingProgress() {
        const appMain = document.querySelector('.app-main');
        const readerContent = document.getElementById('readerContent');
        if (!appMain || !readerContent) return;

        const scrollHandler = () => {
            if (!this.currentChapter) return;
            const scrollPercent = (appMain.scrollTop + appMain.clientHeight) / readerContent.scrollHeight;
            const percent = Math.min(100, Math.round(scrollPercent * 100));
            this.updateChapterProgress(this.currentChapter.id, percent);
            this.updateProgressBar();
        };

        // Remover listener anterior si existe
        appMain.removeEventListener('scroll', scrollHandler);
        appMain.addEventListener('scroll', scrollHandler);
    },

    updateProgressBar() {
        if (!this.currentChapter) return;
        const progress = this.getChapterProgress(this.currentChapter.id);
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = progress.percent + '%';
        if (progressText) progressText.textContent = progress.percent + '%';
    },

    updateNavButtons() {
        const btnPrev = document.getElementById('btnPrev');
        const btnNext = document.getElementById('btnNext');
        if (btnPrev) btnPrev.disabled = this.currentSection === 0;
    },

    prevSection() {
        const appMain = document.querySelector('.app-main');
        if (appMain) appMain.scrollBy({ top: -500, behavior: 'smooth' });
    },

    nextSection() {
        const appMain = document.querySelector('.app-main');
        if (appMain) appMain.scrollBy({ top: 500, behavior: 'smooth' });
    },

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

        const content = document.getElementById('readerContent');
        if (!content) return;
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
        const audioPlayer = document.getElementById('audioPlayer');
        if (audioPlayer) audioPlayer.classList.remove('hidden');
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
        const btnSpeed = document.getElementById('btnSpeed');
        if (btnSpeed) btnSpeed.textContent = this.audioSpeed + 'x';

        if (this.isPlaying) {
            this.stopAudio();
            setTimeout(() => this.startAudio(), 100);
        }
    },

    updateAudioUI() {
        const btn = document.getElementById('btnPlayPause');
        const player = document.getElementById('audioPlayer');
        if (btn) btn.textContent = this.isPlaying ? '⏸' : '▶';
        if (player) {
            if (!this.isPlaying) {
                player.classList.add('paused');
            } else {
                player.classList.remove('paused');
            }
        }
    },

    showQuiz() {
        if (!this.currentChapter || !this.currentChapter.quiz) return;

        const reader = document.getElementById('reader');
        const quizMode = document.getElementById('quizMode');
        if (reader) reader.classList.add('hidden');
        if (quizMode) {
            quizMode.classList.remove('hidden');
            quizMode.style.display = 'block';
        }

        const container = document.getElementById('quizContent');
        if (!container) return;
        container.innerHTML = '';

        let currentQuestion = 0;
        let score = 0;
        const quiz = this.currentChapter.quiz;

        const renderQuestion = () => {
            if (currentQuestion >= quiz.length) {
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

    showVisual() {
        if (!this.currentChapter || !this.currentChapter.visualScenes) return;

        const reader = document.getElementById('reader');
        const visualMode = document.getElementById('visualMode');
        if (reader) reader.classList.add('hidden');
        if (visualMode) {
            visualMode.classList.remove('hidden');
            visualMode.style.display = 'block';
        }

        this.currentVisualScene = 0;
        this.renderVisualScene();
    },

    renderVisualScene() {
        const scene = this.currentChapter.visualScenes[this.currentVisualScene];
        if (!scene) {
            this.showReader();
            return;
        }

        const visualTitle = document.getElementById('visualTitle');
        const visualScene = document.getElementById('visualScene');
        const visualDialogue = document.getElementById('visualDialogue');
        const visualChoices = document.getElementById('visualChoices');

        if (visualTitle) visualTitle.textContent = this.currentChapter.title;
        if (visualScene) {
            visualScene.innerHTML = `
                <div class="visual-scene-placeholder">
                    <span class="scene-icon">🎬</span>
                    <span class="scene-desc">${scene.scene}</span>
                </div>
            `;
        }
        if (visualDialogue) {
            visualDialogue.innerHTML = `
                <div class="dialogue-speaker">${scene.dialogue.speaker}</div>
                <div class="dialogue-text">${scene.dialogue.text}</div>
            `;
        }
        if (visualChoices) {
            visualChoices.innerHTML = scene.choices.map((choice, i) => `
                <button class="choice-btn" onclick="app.chooseVisual(${i})">${choice.text}</button>
            `).join('');
        }
    },

    chooseVisual(choiceIndex) {
        const scene = this.currentChapter.visualScenes[this.currentVisualScene];
        const next = scene.choices[choiceIndex].next;

        const buttons = document.querySelectorAll('.choice-btn');
        buttons.forEach((btn, i) => {
            if (i === choiceIndex) btn.classList.add('selected');
        });

        setTimeout(() => {
            this.currentVisualScene = next;
            this.renderVisualScene();
        }, 1000);
    },

    showChapters() {
        this.stopAudio();
        this.currentChapter = null;

        const reader = document.getElementById('reader');
        const visualMode = document.getElementById('visualMode');
        const quizMode = document.getElementById('quizMode');
        const audioPlayer = document.getElementById('audioPlayer');
        const selector = document.getElementById('chapterSelector');

        if (reader) {
            reader.classList.add('hidden');
            reader.style.display = 'none';
        }
        if (visualMode) visualMode.classList.add('hidden');
        if (quizMode) quizMode.classList.add('hidden');
        if (audioPlayer) audioPlayer.classList.add('hidden');
        if (selector) {
            selector.classList.remove('hidden');
            selector.style.display = 'block';
        }

        this.renderChapters();
    },

    showReader() {
        const reader = document.getElementById('reader');
        const quizMode = document.getElementById('quizMode');
        const visualMode = document.getElementById('visualMode');

        if (reader) {
            reader.classList.remove('hidden');
            reader.style.display = 'block';
        }
        if (quizMode) quizMode.classList.add('hidden');
        if (visualMode) visualMode.classList.add('hidden');
    },

    toggleMenu() {
        const overlay = document.getElementById('menuOverlay');
        if (overlay) overlay.classList.toggle('hidden');
    },

    showBookmarks() {
        const bookmarks = Object.keys(this.progress).filter(k => this.progress[k].percent > 0);
        alert('Marcadores: ' + (bookmarks.length ? bookmarks.join(', ') : 'Ninguno aún'));
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
