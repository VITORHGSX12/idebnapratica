/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — HISTÓRICO DE NAVEGAÇÃO & CONTROLE GLOBAL (SIDEBAR)
 * Arquivo: js/core/navigation/navigation_history.js
 * Descrição: Gerenciamento da pilha de histórico de navegação, botão "Voltar"
 *            global do cabeçalho, toggle de recolhimento da sidebar e
 *            persistência de estado entre sessões.
 * ============================================================================
 */

(function(window, document) {
    'use strict';

    var navigationHistory = ['dashboard'];

    /**
     * Registra nova navegação na pilha
     */
    function pushNavigationHistory(tabId) {
        if (!tabId) return;
        var cleanTab = tabId.toString().trim().replace(/^#/, '');
        if (navigationHistory[navigationHistory.length - 1] !== cleanTab) {
            navigationHistory.push(cleanTab);
        }
        try {
            localStorage.setItem('lastActiveTab', cleanTab);
        } catch(e) {}
    }

    /**
     * Retorna a aba anterior da pilha
     */
    function popNavigationHistory() {
        if (navigationHistory.length > 1) {
            navigationHistory.pop(); // Remove a aba atual
            return navigationHistory.pop(); // Retorna a anterior
        }
        return 'dashboard';
    }

    /**
     * Trata o clique no botão "Voltar" global do cabeçalho
     */
    function handleGlobalBackNavigation() {
        // 1. Hierarquia da Visão da Escola / Diário de Turma
        var schoolClassesView = document.getElementById('school-classes-table-view');
        var diaryView = document.getElementById('class-diary-view');
        var userProfileView = document.getElementById('user-profile-view');
        var schoolsOverview = document.getElementById('schools-overview-container');
        var usersList = document.getElementById('users-list-view');

        if (diaryView && !diaryView.classList.contains('hidden') && diaryView.style.display !== 'none') {
            diaryView.classList.add('hidden');
            diaryView.style.display = 'none';
            if (schoolClassesView) {
                schoolClassesView.classList.remove('hidden');
                schoolClassesView.style.display = 'block';
            }
            return;
        }

        if (schoolClassesView && !schoolClassesView.classList.contains('hidden') && schoolClassesView.style.display !== 'none') {
            schoolClassesView.classList.add('hidden');
            schoolClassesView.style.display = 'none';
            if (schoolsOverview) {
                schoolsOverview.classList.remove('hidden');
                schoolsOverview.style.display = 'block';
            }
            return;
        }

        if (userProfileView && !userProfileView.classList.contains('hidden') && userProfileView.style.display !== 'none') {
            userProfileView.classList.add('hidden');
            userProfileView.style.display = 'none';
            if (usersList) {
                usersList.classList.remove('hidden');
                usersList.style.display = 'block';
            }
            return;
        }

        // 2. Navegação entre abas via histórico
        var prevTab = popNavigationHistory() || 'dashboard';
        if (typeof window.switchTab === 'function') {
            window.switchTab(prevTab);
        } else if (typeof window.navigateToTab === 'function') {
            window.navigateToTab(prevTab);
        }
    }

    /**
     * Inicializa os listeners da sidebar e botão de retorno
     */
    function setupSidebarAndNavigation() {
        var btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
        var appContainer = document.querySelector('.app-container') || document.body;

        if (btnToggleSidebar) {
            btnToggleSidebar.addEventListener('click', function() {
                appContainer.classList.toggle('sidebar-collapsed');
                var isCollapsed = appContainer.classList.contains('sidebar-collapsed');
                try {
                    localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
                } catch(e) {}
            });

            try {
                if (localStorage.getItem('sidebar_collapsed') === 'true') {
                    appContainer.classList.add('sidebar-collapsed');
                }
            } catch(e) {}
        }

        var btnGlobalBack = document.getElementById('btn-global-header-back');
        if (btnGlobalBack) {
            btnGlobalBack.addEventListener('click', function(e) {
                e.preventDefault();
                handleGlobalBackNavigation();
            });
        }
    }

    // Exportação Global
    window.pushNavigationHistory = pushNavigationHistory;
    window.popNavigationHistory = popNavigationHistory;
    window.handleGlobalBackNavigation = handleGlobalBackNavigation;
    window.setupSidebarAndNavigation = setupSidebarAndNavigation;

    // Auto-inicialização quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupSidebarAndNavigation);
    } else {
        setupSidebarAndNavigation();
    }

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
