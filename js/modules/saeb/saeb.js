/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO SAEB (BOOTSTRAP & SUB-ABAS)
 * Arquivo: js/modules/saeb/saeb.js
 * Descrição: Orquestrador principal da aba Gestão Pedagógica / SAEB (0 a 5)
 *            e controle de alternância de sub-abas.
 * ============================================================================
 */

(function (global) {
    'use strict';

    function initSaebModule() {
        if (typeof global.initSaebSelectors === 'function') {
            global.initSaebSelectors();
        }
        if (typeof global.bindBoletimEvents === 'function') {
            global.bindBoletimEvents();
        }
        bindPedagogicSubtabs();
        if (typeof global.renderSaebProficiencyDashboard === 'function') {
            global.renderSaebProficiencyDashboard();
        }
        if (typeof global.initPedagogicPlansSubtab === 'function') {
            global.initPedagogicPlansSubtab();
        }
        if (typeof global.renderSaebOficialComparativoTable === 'function') {
            global.renderSaebOficialComparativoTable();
        }
    }

    function switchPedagogicSubtab(targetId) {
        if (!targetId) targetId = 'niveis-saeb-sub';
        var subtabBtns = document.querySelectorAll('.pedagogic-subtab-btn');
        var subtabContents = document.querySelectorAll('.pedagogic-subtab-content');

        subtabBtns.forEach(function (b) {
            if (b.getAttribute('data-subtab') === targetId) {
                b.classList.add('active');
                b.style.color = 'var(--purple-light)';
                b.style.fontWeight = '600';
                b.style.borderBottom = '2px solid var(--purple)';
            } else {
                b.classList.remove('active');
                b.style.color = 'var(--text-secondary)';
                b.style.fontWeight = '500';
                b.style.borderBottom = 'none';
            }
        });

        subtabContents.forEach(function (content) {
            if (content.id === targetId) {
                content.classList.remove('hidden');
                content.style.display = 'block';
            } else {
                content.classList.add('hidden');
                content.style.display = 'none';
            }
        });

        if (targetId === 'niveis-saeb-sub') {
            if (typeof global.renderSaebProficiencyDashboard === 'function') {
                global.renderSaebProficiencyDashboard();
            }
        } else if (targetId === 'laudo-diagnostico-sub') {
            if (typeof global.initDiagnosticoSelectors === 'function') {
                global.initDiagnosticoSelectors();
            }
            if (typeof global.runDiagnosticoCalculation === 'function') {
                global.runDiagnosticoCalculation();
            }
        } else if (targetId === 'planos-intervencao-sub') {
            if (typeof global.initPedagogicPlansSubtab === 'function') {
                global.initPedagogicPlansSubtab();
            }
        } else if (targetId === 'comparativo-saeb-sub') {
            if (typeof global.renderSaebOficialComparativoTable === 'function') {
                global.renderSaebOficialComparativoTable();
            }
        }
    }

    function bindPedagogicSubtabs() {
        var subtabBtns = document.querySelectorAll('.pedagogic-subtab-btn');

        subtabBtns.forEach(function (btn) {
            btn.onclick = function (e) {
                e.preventDefault();
                var targetId = btn.getAttribute('data-subtab');
                switchPedagogicSubtab(targetId);
            };
        });
    }

    // Exposição Global
    global.initSaebModule = initSaebModule;
    global.switchPedagogicSubtab = switchPedagogicSubtab;

    // Inicialização automática
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSaebModule);
    } else {
        setTimeout(initSaebModule, 100);
    }

})(typeof window !== 'undefined' ? window : this);
