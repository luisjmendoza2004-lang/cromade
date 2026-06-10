// ============================================
// CROMADE APP - VERSIÓN ULTRA SIMPLE
// ============================================

const app = {
    currentChapter: null,

    init() {
        console.log('App iniciando...');
        this.renderChapters();
        this.setupButtons();

        // Verificar si hay capítulo en URL
        const urlParams = new URLSearchParams(window.location.search);
        const chapterId = parseInt(urlParams.get('chapter'));
        console.log('Chapter ID en URL:', chapterId);

        if (chapterId) {
            setTimeout(() => {
                console.log('Cargando capítulo desde URL...');
                this.loadChapter(chapterId);
            }, 500);
        }
    },

    setupButtons() {
        // Botón volver
        const btnBack = document.getElementById('btnBack');
        if (btnBack) {
            btnBack.onclick = () => {
                console.log('Click: Volver');
                this.showChapters();
            };
        }

        // Botón menú
        const btnMenu = document.getElementById('btnMenu');
        if (btnMenu) {
            btnMenu.onclick = () => {
                const menu = document.getElementById('menuOverlay');
                if (menu) menu.classList.toggle('hidden');
            };
        }

        // Botón cerrar menú
        const btnCloseMenu = document.getElementById('btnCloseMenu');
        if (btnCloseMenu) {
            btnCloseMenu.onclick = () => {
                const menu = document.getElementById('menuOverlay');
                if (menu) menu.classList.add('hidden');
            };
        }

        // Botón usuario (sin alerta)
        const btnUser = document.getElementById('btnUser');
        if (btnUser) {
            btnUser.onclick = () => {
                console.log('Click: Usuario');
                window.location.href = 'landing.html';
            };
        }
    },

    renderChapters() {
        console.log('Renderizando capítulos...');
        const grid = document.getElementById('chaptersGrid');
        if (!grid) {
            console.error('ERROR: No se encontró chaptersGrid');
            return;
        }

        grid.innerHTML = '';

        if (typeof CROMADE_DATA === 'undefined') {
            console.error('ERROR: CROMADE_DATA no está definido');
            grid.innerHTML = '<p style="color:red; text-align:center;">Error: No se cargaron los datos</p>';
            return;
        }

        console.log('Capítulos disponibles:', CROMADE_DATA.chapters.length);

        CROMADE_DATA.chapters.forEach(chapter => {
            const card = document.createElement('div');
            card.className = 'chapter-card';

            const isFree = chapter.status === 'free';
            const isLocked = chapter.status === 'locked';

            if (isFree) card.classList.add('free');
            if (isLocked) card.classList.add('locked');

            let badgeClass = 'badge-locked';
            let badgeText = '🔒 PREMIUM';
            if (isFree) { badgeClass = 'badge-free'; badgeText = 'GRATIS'; }
            else if (chapter.status === 'free-reg') { badgeClass = 'badge-free-reg'; badgeText = 'REGISTRO'; }

            card.innerHTML = `
                <div class="chapter-number">${chapter.number}</div>
                <h3 class="chapter-title">${chapter.title}</h3>
                <p class="chapter-desc">${chapter.subtitle}</p>
                <div class="chapter-meta">
                    <span class="chapter-badge ${badgeClass}">${badgeText}</span>
                    <span class="chapter-badge badge-time">${chapter.readTime}</span>
                </div>
            `;

            card.onclick = () => {
                console.log('Click en capítulo:', chapter.id, chapter.title);
                if (isLocked) {
                    alert('Este capítulo requiere suscripción');
                    return;
                }
                this.loadChapter(chapter.id);
            };

            grid.appendChild(card);
        });

        console.log('Capítulos renderizados correctamente');
    },

    loadChapter(id) {
        console.log('=== CARGANDO CAPÍTULO', id, '===');

        if (typeof CROMADE_DATA === 'undefined') {
            console.error('ERROR: CROMADE_DATA no está definido');
            alert('Error: No se pudieron cargar los datos del capítulo');
            return;
        }

        const chapter = CROMADE_DATA.getChapter(id);
        if (!chapter) {
            console.error('ERROR: Capítulo no encontrado:', id);
            alert('Capítulo no encontrado');
            return;
        }

        console.log('Capítulo encontrado:', chapter.title);
        console.log('Contenido length:', chapter.content.length);

        this.currentChapter = chapter;

        // 1. OCULTAR SELECTOR
        const selector = document.getElementById('chapterSelector');
        if (selector) {
            selector.classList.add('hidden');
            selector.style.display = 'none';
            console.log('Selector ocultado');
        }

        // 2. MOSTRAR READER
        const reader = document.getElementById('reader');
        if (reader) {
            reader.classList.remove('hidden');
            reader.style.display = 'block';
            console.log('Reader mostrado');
        } else {
            console.error('ERROR: No se encontró el reader');
        }

        // 3. OCULTAR OTROS
        const visualMode = document.getElementById('visualMode');
        const quizMode = document.getElementById('quizMode');
        if (visualMode) visualMode.style.display = 'none';
        if (quizMode) quizMode.style.display = 'none';

        // 4. PONER CONTENIDO
        const readerContent = document.getElementById('readerContent');
        if (readerContent) {
            readerContent.innerHTML = chapter.content;
            readerContent.style.display = 'block';
            console.log('Contenido insertado');
        } else {
            console.error('ERROR: No se encontró readerContent');
        }

        // 5. ACTUALIZAR PROGRESO
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';

        // 6. SCROLL ARRIBA
        const appMain = document.querySelector('.app-main');
        if (appMain) appMain.scrollTop = 0;

        console.log('=== CAPÍTULO CARGADO ===');
    },

    showChapters() {
        console.log('Volviendo a selector...');

        const selector = document.getElementById('chapterSelector');
        const reader = document.getElementById('reader');

        if (selector) {
            selector.classList.remove('hidden');
            selector.style.display = 'block';
        }
        if (reader) {
            reader.classList.add('hidden');
            reader.style.display = 'none';
        }

        this.currentChapter = null;
    }
};

// ============================================
// INICIALIZAR CUANDO EL DOM ESTÉ LISTO
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => app.init());
} else {
    app.init();
}
