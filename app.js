// ============================================
// CROMADE APP - VERSIÓN MÍNIMA FUNCIONAL
// ============================================

const app = {
    init() {
        this.initEventListeners();
        this.renderChapters();

        // Cargar capítulo desde URL si existe
        const urlParams = new URLSearchParams(window.location.search);
        const chapterId = parseInt(urlParams.get('chapter'));
        if (chapterId) {
            setTimeout(() => this.loadChapter(chapterId), 200);
        }
    },

    initEventListeners() {
        document.getElementById('btnMenu').addEventListener('click', () => this.toggleMenu());
        document.getElementById('btnUser').addEventListener('click', () => alert('Login en landing.html'));
        document.getElementById('btnBack').addEventListener('click', () => this.showChapters());
        document.getElementById('btnPrev').addEventListener('click', () => this.scrollReader(-500));
        document.getElementById('btnNext').addEventListener('click', () => this.scrollReader(500));
        document.getElementById('btnQuiz').addEventListener('click', () => this.showQuiz());
        document.getElementById('btnAudio').addEventListener('click', () => alert('Audio: usa el botón del reproductor abajo'));
        document.getElementById('btnBackVisual').addEventListener('click', () => this.showReader());
        document.getElementById('btnBackQuiz').addEventListener('click', () => this.showReader());
        document.getElementById('btnCloseMenu').addEventListener('click', () => this.toggleMenu());
    },

    scrollReader(amount) {
        document.querySelector('.app-main').scrollBy({ top: amount, behavior: 'smooth' });
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

            if (isFree) card.classList.add('free');
            if (isLocked) card.classList.add('locked');

            let badgeClass = 'badge-locked';
            let badgeText = '🔒 PREMIUM';
            if (isFree) { badgeClass = 'badge-free'; badgeText = 'GRATIS'; }
            else if (isFreeReg) { badgeClass = 'badge-free-reg'; badgeText = 'REGISTRO'; }

            card.innerHTML = `
                <div class="chapter-number">${chapter.number}</div>
                <h3 class="chapter-title">${chapter.title}</h3>
                <p class="chapter-desc">${chapter.subtitle}</p>
                <div class="chapter-meta">
                    <span class="chapter-badge ${badgeClass}">${badgeText}</span>
                    <span class="chapter-badge badge-time">${chapter.readTime}</span>
                </div>
            `;

            card.addEventListener('click', () => {
                if (isLocked) {
                    alert('Este capítulo requiere suscripción');
                    return;
                }
                this.loadChapter(chapter.id);
            });

            grid.appendChild(card);
        });
    },

    loadChapter(id) {
        const chapter = CROMADE_DATA.getChapter(id);
        if (!chapter) {
            alert('Capítulo no encontrado');
            return;
        }

        this.currentChapter = chapter;

        // OCULTAR SELECTOR
        const selector = document.getElementById('chapterSelector');
        if (selector) {
            selector.classList.add('hidden');
            selector.style.display = 'none';
        }

        // MOSTRAR READER
        const reader = document.getElementById('reader');
        if (reader) {
            reader.classList.remove('hidden');
            reader.style.display = 'block';
            reader.style.visibility = 'visible';
            reader.style.opacity = '1';
        }

        // OCULTAR OTROS
        const visualMode = document.getElementById('visualMode');
        const quizMode = document.getElementById('quizMode');
        if (visualMode) {
            visualMode.classList.add('hidden');
            visualMode.style.display = 'none';
        }
        if (quizMode) {
            quizMode.classList.add('hidden');
            quizMode.style.display = 'none';
        }

        // PONER CONTENIDO
        const readerContent = document.getElementById('readerContent');
        if (readerContent) {
            readerContent.innerHTML = chapter.content;
            readerContent.style.display = 'block';
            readerContent.style.visibility = 'visible';
        }

        // Actualizar barra de progreso
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';

        // Scroll arriba
        const appMain = document.querySelector('.app-main');
        if (appMain) appMain.scrollTop = 0;

        console.log('Capítulo cargado:', chapter.title);
        console.log('Contenido HTML:', chapter.content.substring(0, 100) + '...');
    },

    showChapters() {
        const selector = document.getElementById('chapterSelector');
        const reader = document.getElementById('reader');
        const visualMode = document.getElementById('visualMode');
        const quizMode = document.getElementById('quizMode');

        if (selector) {
            selector.classList.remove('hidden');
            selector.style.display = 'block';
        }
        if (reader) {
            reader.classList.add('hidden');
            reader.style.display = 'none';
        }
        if (visualMode) {
            visualMode.classList.add('hidden');
            visualMode.style.display = 'none';
        }
        if (quizMode) {
            quizMode.classList.add('hidden');
            quizMode.style.display = 'none';
        }

        this.currentChapter = null;
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
        if (quizMode) {
            quizMode.classList.add('hidden');
            quizMode.style.display = 'none';
        }
        if (visualMode) {
            visualMode.classList.add('hidden');
            visualMode.style.display = 'none';
        }
    },

    showQuiz() {
        if (!this.currentChapter || !this.currentChapter.quiz) {
            alert('Este capítulo no tiene quiz');
            return;
        }

        const reader = document.getElementById('reader');
        const quizMode = document.getElementById('quizMode');

        if (reader) {
            reader.classList.add('hidden');
            reader.style.display = 'none';
        }
        if (quizMode) {
            quizMode.classList.remove('hidden');
            quizMode.style.display = 'block';
        }

        const container = document.getElementById('quizContent');
        if (!container) return;

        let currentQuestion = 0;
        let score = 0;
        const quiz = this.currentChapter.quiz;

        const renderQuestion = () => {
            if (currentQuestion >= quiz.length) {
                const percent = Math.round((score / quiz.length) * 100);
                container.innerHTML = `
                    <div class="quiz-result">
                        <div class="quiz-result-score">${percent}%</div>
                        <p class="quiz-result-text">${percent >= 60 ? '¡Bien hecho!' : 'Seguí practicando'}</p>
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

    toggleMenu() {
        const overlay = document.getElementById('menuOverlay');
        if (overlay) overlay.classList.toggle('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
