/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — EVENTOS E INTERAÇÕES DE NAVEGAÇÃO (MENUS & SUBMENUS)
 * Arquivo: js/core/navigation/navigation_events.js
 * Descrição: Centraliza os listeners de clique em itens de menu, sub-abas,
 *            filtros de barra lateral e orquestração de eventos DOM.
 * ============================================================================
 */

(function(window, document) {
    'use strict';

    /**
     * Vincula listeners para todos os itens de menu (.menu-item)
     */
    function bindSidebarMenuEvents() {
        var menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(function(item) {
            // Evitar binding duplicado
            if (item.getAttribute('data-nav-bound') === 'true') return;
            item.setAttribute('data-nav-bound', 'true');

            item.addEventListener('click', function(e) {
                e.preventDefault();
                var targetTab = item.getAttribute('data-target') || item.getAttribute('href');
                if (targetTab) {
                    targetTab = targetTab.replace(/^#/, '');
                    if (typeof window.switchTab === 'function') {
                        window.switchTab(targetTab);
                    } else if (typeof window.navigateToTab === 'function') {
                        window.navigateToTab(targetTab);
                    }
                }
            });
        });

        // Sub-abas de módulos funcionais
        var moduleBtns = document.querySelectorAll('.module-tab-btn');
        var modulePanels = document.querySelectorAll('.module-panel');
        moduleBtns.forEach(function(btn) {
            if (btn.getAttribute('data-nav-bound') === 'true') return;
            btn.setAttribute('data-nav-bound', 'true');

            btn.addEventListener('click', function() {
                var moduleNum = btn.getAttribute('data-module');
                moduleBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');

                modulePanels.forEach(function(panel) {
                    if (panel.getAttribute('data-panel') === moduleNum) {
                        panel.classList.add('active');
                        panel.style.display = 'block';
                    } else {
                        panel.classList.remove('active');
                        panel.style.display = 'none';
                    }
                });
            });
        });
    }

    /**
     * Filtra os itens da sidebar através da caixa de busca
     */
    function filterSidebarMenuItems(query) {
        var q = (query || '').toString().toLowerCase().trim();
        var menuItems = document.querySelectorAll('.sidebar .menu-item');
        var menuGroups = document.querySelectorAll('.sidebar .menu-group');

        menuItems.forEach(function(item) {
            var text = item.textContent.toLowerCase();
            var tooltip = (item.getAttribute('data-tooltip') || '').toLowerCase();
            if (!q || text.includes(q) || tooltip.includes(q)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });

        // Esconde grupos vazios
        menuGroups.forEach(function(grp) {
            var visibleItems = grp.querySelectorAll('.menu-item:not([style*="display: none"])');
            grp.style.display = visibleItems.length > 0 ? 'block' : (q ? 'none' : 'block');
        });
    }

    // Exportação Global
    window.bindSidebarMenuEvents = bindSidebarMenuEvents;
    window.filterSidebarMenuItems = filterSidebarMenuItems;

    // Inicializar quando o DOM estiver carregado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSidebarMenuEvents);
    } else {
        bindSidebarMenuEvents();
    }

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
