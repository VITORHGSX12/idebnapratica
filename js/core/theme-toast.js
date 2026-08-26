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
     * Função para alternar o tema diretamente
     */
    function toggleThemeMode() {
        document.body.classList.toggle('dark-mode');
        var isDark = document.body.classList.contains('dark-mode');
        
        var themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        }
        
        var sidebarSwitch = document.getElementById('sidebar-theme-switch');
        if (sidebarSwitch) {
            sidebarSwitch.checked = isDark;
        }

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }

        try {
            localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
            localStorage.setItem('gd_theme', isDark ? 'dark' : 'light');
        } catch(e) {}
        
        showToast('Tema alternado para modo ' + (isDark ? 'Escuro' : 'Claro'), isDark ? 'moon' : 'sun');

        var activeTabEl = document.querySelector('.menu-item.active');
        var activeTab = activeTabEl ? activeTabEl.getAttribute('data-target') : '';
        if (activeTab === 'doc-tecnica' && typeof global.renderMermaidDiagram === 'function') {
            global.renderMermaidDiagram(isDark ? 'dark' : 'default');
        }
    }

    /**
     * Inicializa e vincula o alternador de tema (Dark / Light)
     */
    function initThemeToggler() {
        var themeToggleBtn = document.getElementById('theme-toggle');
        if (!themeToggleBtn) return;

        // Atualiza ícone inicial baseado no estado atual do body
        var isDarkInitial = document.body.classList.contains('dark-mode');
        themeToggleBtn.innerHTML = isDarkInitial ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }

        themeToggleBtn.onclick = function(e) {
            if (e) e.preventDefault();
            toggleThemeMode();
        };
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
    global.toggleThemeMode = toggleThemeMode;

})(typeof window !== 'undefined' ? window : this);
