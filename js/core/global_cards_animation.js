/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MOTOR GLOBAL DE ANIMAÇÃO DE CARDS (12 ETAPAS)
 * Arquivo: js/core/global_cards_animation.js
 * Descrição: Aplica animação escalonada (Fade-Up com Stagger), elevação Hover 3D
 *            e contagem dinâmica (CountUp) em todos os cards informativos de
 *            todas as 12 abas do sistema.
 * ============================================================================
 */

(function (global) {
    'use strict';

    /**
     * Mapeamento dos 12 Módulos / Painéis do Sistema
     */
    var PANELS_MAP = {
        'onboarding': 'onboarding-panel',
        'dashboard': 'dashboard',
        'escolas': 'escolas-panel',
        'turmas': 'turmas-panel',
        'alunos': 'alunos-panel',
        'matrizes': 'matrizes-panel',
        'questoes': 'questoes-panel',
        'avaliacoes': 'avaliacoes-panel',
        'cronograma': 'cronograma-panel',
        'saeb': 'gestao-pedagogica',
        'metas': 'metas-panel',
        'admin': 'admin-panel'
    };

    function isReducedMotion() {
        try {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (e) {
            return false;
        }
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Anima contadores numéricos presentes dentro dos cards
     */
    function animateCardNumber(element, duration) {
        if (!element || isReducedMotion()) return;
        if (element.getAttribute('data-card-counted') === 'true') return;

        var originalHtml = element.innerHTML.trim();
        var rawText = element.textContent.trim();
        var match = rawText.match(/^([^\d\.-]*)([-+]?\d+(?:[\.,]\d+)?)(.*)$/);

        if (!match) return;

        var prefix = match[1] || '';
        var numStr = match[2] || '';
        var suffix = match[3] || '';
        var usesComma = numStr.includes(',');
        var cleanNumStr = numStr.replace(',', '.');
        var targetNum = parseFloat(cleanNumStr);

        if (isNaN(targetNum)) return;

        var decimalPart = cleanNumStr.split('.')[1];
        var decimals = decimalPart ? decimalPart.length : 0;

        var spanMatch = originalHtml.match(/(<span[^>]*>.*?<\/span>)/i);
        var htmlSuffix = spanMatch ? (' ' + spanMatch[1]) : '';

        element.setAttribute('data-card-counted', 'true');
        element.setAttribute('data-original-html', originalHtml);
        duration = duration || 850;

        var startTime = null;
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var currentNum = targetNum * easeOutCubic(progress);

            var formatted = currentNum.toFixed(decimals);
            if (usesComma) formatted = formatted.replace('.', ',');

            if (htmlSuffix) {
                element.innerHTML = prefix + formatted + htmlSuffix;
            } else {
                element.textContent = prefix + formatted + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.innerHTML = originalHtml;
            }
        }

        requestAnimationFrame(step);
    }

    /**
     * Aplica o efeito de Fade-Up escalonado e animação aos cards de uma seção
     */
    function animatePanelCards(panelElement) {
        if (!panelElement || isReducedMotion()) return;

        // Seletores amplos de cards informativos e caixas estatísticas
        var selectors = [
            '.metric-card',
            '.kpi-card',
            '.stat-card',
            '.card-outline',
            '.info-box',
            '.summary-card',
            '.grid-2 > .card',
            '.grid-3 > .card',
            '.grid-4 > .card',
            '.grid-3-lg > .card-outline',
            '.card-header',
            '.dashboard-row .card'
        ].join(', ');

        var cards = panelElement.querySelectorAll(selectors);
        if (!cards || cards.length === 0) {
            // Fallback para cards diretos
            cards = panelElement.querySelectorAll('.card');
        }

        var staggerDelay = 65; // ms entre cada card

        cards.forEach(function (card, index) {
            // Remove animação anterior para reiniciar suavemente
            card.classList.remove('global-card-animate');
            void card.offsetWidth; // Reflow forçado para reiniciar CSS animation

            card.style.animationDelay = (index * staggerDelay) + 'ms';
            card.classList.add('global-card-animate', 'stat-card-elevate');

            // Animar números dentro do card
            var numbers = card.querySelectorAll('.metric-value, .stat-value, .card-value, h3, h2, .badge-count, strong');
            numbers.forEach(function (numEl) {
                // Animar apenas elementos com texto curto contendo dígitos
                var txt = numEl.textContent.trim();
                if (txt.length <= 12 && /\d/.test(txt) && !txt.includes('/') && !txt.includes('@')) {
                    setTimeout(function () {
                        animateCardNumber(numEl, 800);
                    }, index * staggerDelay + 80);
                }
            });
        });
    }

    /**
     * Dispara a animação na aba ativa atual
     */
    function triggerActiveTabAnimation(tabId) {
        setTimeout(function () {
            var targetPanel = null;
            if (tabId) {
                targetPanel = document.getElementById(tabId) || document.getElementById(PANELS_MAP[tabId]);
            }

            if (!targetPanel) {
                // Encontrar aba atualmente sem a classe 'hidden'
                targetPanel = document.querySelector('.tab-content:not(.hidden)') ||
                              document.querySelector('section:not(.hidden)');
            }

            if (targetPanel) {
                animatePanelCards(targetPanel);
            }
        }, 50);
    }

    /**
     * Intercepta trocas de abas e navegação
     */
    function initGlobalCardsAnimation() {
        if (typeof document === 'undefined') return;

        // 1. Interceptar navegação global navigateToTab se existir
        var originalNavigate = global.navigateToTab;
        if (typeof originalNavigate === 'function' && !global.__cardsAnimationHooked) {
            global.navigateToTab = function (tabId) {
                originalNavigate.apply(this, arguments);
                triggerActiveTabAnimation(tabId);
            };
            global.__cardsAnimationHooked = true;
        }

        // 2. Ouvintes de clique nos itens do menu lateral (.nav-item)
        var navItems = document.querySelectorAll('.nav-item, [data-tab]');
        navItems.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var targetTab = btn.getAttribute('data-tab') || btn.getAttribute('href');
                if (targetTab) {
                    targetTab = targetTab.replace('#', '');
                    triggerActiveTabAnimation(targetTab);
                }
            });
        });

        // 3. Ouvintes de clique nas sub-abas (.pedagogic-subtab-btn, tabs secundárias)
        var subtabBtns = document.querySelectorAll('.pedagogic-subtab-btn, .subtab-btn, [data-subtab]');
        subtabBtns.forEach(function (sBtn) {
            sBtn.addEventListener('click', function () {
                setTimeout(function () {
                    var activeSubtab = document.querySelector('.pedagogic-subtab-content:not(.hidden)') ||
                                      document.querySelector('.subtab-content:not(.hidden)');
                    if (activeSubtab) {
                        animatePanelCards(activeSubtab);
                    }
                }, 80);
            });
        });

        // 4. Executar animação inicial na aba aberta
        triggerActiveTabAnimation();
    }

    // Exposição Global
    global.animatePanelCards = animatePanelCards;
    global.triggerActiveTabAnimation = triggerActiveTabAnimation;
    global.initGlobalCardsAnimation = initGlobalCardsAnimation;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initGlobalCardsAnimation);
        } else {
            setTimeout(initGlobalCardsAnimation, 120);
        }
    }

})(typeof window !== 'undefined' ? window : this);
