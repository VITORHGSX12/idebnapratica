// =========================================================================
// THEME & TOAST NOTIFICATION MODULE
// Responsabilidade: Alternância Dark/Light mode e Toasts do sistema
// =========================================================================

(function(global) {
    'use strict';

    var toastTimeout = null;

    /**
     * Exibe notificação Toast flutuante
     * @param {string} message Texto da mensagem
     * @param {string} iconName Nome do ícone Lucide (padrão: 'info')
     */
    function showToast(message, iconName) {
        iconName = iconName || 'info';
        var toast = document.getElementById('toast-notification');
        var toastMessage = document.getElementById('toast-message');
        var toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        if (toastIcon) {
            toastIcon.setAttribute('data-lucide', iconName);
        }

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }

        toast.classList.remove('hidden');
        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }
        toastTimeout = setTimeout(function() {
            toast.classList.add('hidden');
        }, 3000);
    }

    /**
     * Sincroniza o estado visual de todos os controles de tema
     * @param {boolean} isDark 
     */
    function syncThemeControls(isDark) {
        var btnLight = document.getElementById('theme-btn-light');
        var btnDark = document.getElementById('theme-btn-dark');
        var collapsedIcon = document.getElementById('theme-collapsed-icon');
        var collapsedBtn = document.getElementById('sidebar-theme-collapsed-btn');

        if (btnLight && btnDark) {
            if (isDark) {
                btnLight.classList.remove('active');
                btnDark.classList.add('active');
            } else {
                btnLight.classList.add('active');
                btnDark.classList.remove('active');
            }
        }

        if (collapsedIcon) {
            if (isDark) {
                collapsedIcon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
            } else {
                collapsedIcon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
            }
        }

        if (collapsedBtn) {
            collapsedBtn.setAttribute('title', isDark ? 'Modo Escuro Ativo (Clique para Claro)' : 'Modo Claro Ativo (Clique para Escuro)');
        }
    }

    /**
     * Define o modo de tema explicitamente ('light' ou 'dark')
     * @param {string} mode 
     */
    function setThemeMode(mode) {
        var isDark = mode === 'dark';
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        syncThemeControls(isDark);

        try {
            localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
            localStorage.setItem('gd_theme', isDark ? 'dark' : 'light');
        } catch(e) {}

        showToast('Tema alterado para modo ' + (isDark ? 'Escuro' : 'Claro'), isDark ? 'moon' : 'sun');

        // Notificar sistema e atualizar todos os gráficos de forma reativa
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            try {
                window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isDark: isDark } }));
            } catch(e) {}
        }
        if (global.ChartTheme && typeof global.ChartTheme.refreshAll === 'function') {
            global.ChartTheme.refreshAll();
        }

        var activeTabEl = document.querySelector('.menu-item.active');
        var activeTab = activeTabEl ? activeTabEl.getAttribute('data-target') : '';
        if (activeTab === 'doc-tecnica' && typeof global.renderMermaidDiagram === 'function') {
            global.renderMermaidDiagram(isDark ? 'dark' : 'default');
        }
    }

    /**
     * Alterna o tema entre Dark e Light
     */
    function toggleThemeMode() {
        var isCurrentlyDark = document.body.classList.contains('dark-mode');
        setThemeMode(isCurrentlyDark ? 'light' : 'dark');
    }

    /**
     * Inicializa o estado de tema a partir do localStorage ou preferência do sistema
     */
    function initThemeToggler() {
        var savedMode = localStorage.getItem('theme_mode') || localStorage.getItem('gd_theme');
        var isDark = false;

        if (savedMode) {
            isDark = savedMode === 'dark';
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            isDark = true;
        }

        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }

        syncThemeControls(isDark);
    }

    // Auto-inicialização quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeToggler);
    } else {
        initThemeToggler();
    }

    // Exposição global
    global.showToast = showToast;
    global.initThemeToggler = initThemeToggler;
    global.setThemeMode = setThemeMode;
    global.toggleThemeMode = toggleThemeMode;

})(typeof window !== 'undefined' ? window : this);
