/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — SCROLL REVEAL PROGRESSIVO DO DASHBOARD
 * Arquivo: js/modules/dashboard/dashboard_scroll_reveal.js
 * Descrição: Revela e monta os painéis, contadores e gráficos continuamente
 *            conforme o usuário rola a página no navegador.
 *            Suporte universal: viewport global (window) e container .main-content.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var observerInstance = null;
    var scrollAttached = false;

    /**
     * Verifica preferência por movimento reduzido (Acessibilidade)
     */
    function isReducedMotion() {
        try {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch(e) {
            return false;
        }
    }

    /**
     * Curva de aceleração Ease Out Cubic
     */
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    /**
     * Injeta regras de estilo CSS estritamente escopadas no #dashboard
     */
    function injectScrollStyles() {
        if (document.getElementById('dash-scroll-reveal-styles')) return;

        var style = document.createElement('style');
        style.id = 'dash-scroll-reveal-styles';
        style.textContent = `
            /* =========================================================================
               ESTILOS DE SCROLL REVEAL PROGRESSIVO (#dashboard)
               ========================================================================= */

            /* Elementos em espera abaixo da dobra */
            #dashboard .dash-scroll-block {
                opacity: 0;
                transform: translateY(24px);
                transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
                will-change: opacity, transform;
            }

            /* Elemento revelado conforme a tela rola */
            #dashboard .dash-scroll-block.dash-visible {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }

            /* Entrada suave dos cards do topo */
            #dashboard .dash-top-card {
                animation: dashFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes dashFadeUp {
                from {
                    opacity: 0;
                    transform: translateY(16px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            /* Trajetória Vetorial IDEB SVG */
            #dashboard .trajectory-observed-line {
                transition: stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Anel circular de aprovação */
            #dashboard .progress-ring-fill {
                transition: stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1);
            }

            /* Microinterações nos cards */
            #dashboard .metric-card {
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            #dashboard .metric-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(10, 25, 49, 0.08);
            }

            /* Acessibilidade: prefers-reduced-motion */
            @media (prefers-reduced-motion: reduce) {
                #dashboard .dash-scroll-block,
                #dashboard .dash-top-card {
                    opacity: 1 !important;
                    transform: none !important;
                    transition: none !important;
                    animation: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Anima números de 0 até o valor real com easing suave
     */
    function animateCountUp(element, duration) {
        if (!element || isReducedMotion()) return;
        if (element.getAttribute('data-counted') === 'true') return;

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

        // Detectar se havia tags HTML (ex: <span>pts</span>)
        var spanMatch = originalHtml.match(/(<span[^>]*>.*?<\/span>)/i);
        var htmlSuffix = spanMatch ? (' ' + spanMatch[1]) : '';

        element.setAttribute('data-counted', 'true');
        duration = duration || 1000;

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
     * Anima o anel de progresso SVG
     */
    function animateProgressRing(container) {
        if (!container || isReducedMotion()) return;
        var fill = container.querySelector('.progress-ring-fill');
        var valEl = container.querySelector('.progress-ring-value');
        if (!fill) return;

        var targetOffset = fill.getAttribute('stroke-dashoffset');
        if (targetOffset === null) return;

        fill.style.strokeDashoffset = '188.4';
        void fill.getBoundingClientRect(); // reflow

        setTimeout(function() {
            fill.style.strokeDashoffset = targetOffset;
        }, 50);

        if (valEl) {
            animateCountUp(valEl, 1000);
        }
    }

    /**
     * Anima números e anéis presentes em um container
     */
    function triggerSectionNumbers(container) {
        if (!container) return;

        var metricValues = container.querySelectorAll('.metric-value');
        metricValues.forEach(function(el) { animateCountUp(el, 1000); });

        var rings = container.querySelectorAll('.progress-ring-container');
        rings.forEach(function(rg) { animateProgressRing(rg); });

        var networkBadge = container.querySelector('#simulados-network-avg-badge');
        if (networkBadge) animateCountUp(networkBadge, 1000);

        var gapVal = container.querySelector('.ideb-trajectory-gap-val');
        if (gapVal) animateCountUp(gapVal, 1000);
    }

    /**
     * Dispara animação nativa Chart.js para gráficos dentro da seção que entrou na tela
     */
    function triggerSectionCharts(section) {
        if (!section || isReducedMotion()) return;

        // 1. Gráfico Histórico Gonçalves Dias
        if (section.querySelector('#dashChartGoncalvesDias')) {
            if (typeof global.renderDashboardGoncalvesDiasChart === 'function') {
                global.renderDashboardGoncalvesDiasChart();
            }
        }

        // 2. Gráficos Maranhão Anos Iniciais / Finais
        if (section.querySelector('#dashChartIniciais') || section.querySelector('#dashChartFinais')) {
            if (typeof global.renderDashboardEtapasCharts === 'function') {
                global.renderDashboardEtapasCharts();
            }
        }

        // 3. Gráfico Comparativo Hiato
        if (section.querySelector('#dashChartComparativo')) {
            if (typeof global.renderDashboardComparativoChart === 'function') {
                global.renderDashboardComparativoChart();
            }
        }

        // 4. Gráfico Evolução Histórica SAEB
        if (section.querySelector('#dashChartSaebEvolucaoGoncalves')) {
            if (typeof global.renderDashboardSaebEvolucaoGoncalvesChart === 'function') {
                global.renderDashboardSaebEvolucaoGoncalvesChart();
            }
        }

        // 5. Linha Vetorial do IDEB Trajetória PDE
        var trajectoryLine = section.querySelector('.trajectory-observed-line');
        if (trajectoryLine) {
            try {
                var len = trajectoryLine.getTotalLength ? trajectoryLine.getTotalLength() : 800;
                trajectoryLine.style.strokeDasharray = len;
                trajectoryLine.style.strokeDashoffset = len;
                void trajectoryLine.getBoundingClientRect();
                setTimeout(function() {
                    trajectoryLine.style.strokeDashoffset = '0';
                }, 60);
            } catch(e) {}
        }
    }

    /**
     * Revela uma seção conforme o scroll alcança sua posição
     */
    function revealSection(section) {
        if (!section || section.getAttribute('data-revealed') === 'true') return;
        section.setAttribute('data-revealed', 'true');
        section.classList.add('dash-visible');

        triggerSectionNumbers(section);
        triggerSectionCharts(section);
    }

    /**
     * Verifica se o elemento está visível no viewport do navegador
     */
    function isElementInView(el) {
        if (!el) return false;
        var r = el.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) return false;

        var vHeight = window.innerHeight || document.documentElement.clientHeight || 800;
        // Revela com antecedência de 50px antes do elemento passar do fundo da tela
        return r.top < (vHeight - 40) && r.bottom > 20;
    }

    /**
     * Monitor de Scroll Contínuo sobre a janela e containers
     */
    function handleScrollCheck() {
        var blocks = document.querySelectorAll('#dashboard-main-content .dash-scroll-block:not([data-revealed="true"])');
        if (!blocks.length) return;

        blocks.forEach(function(block) {
            if (isElementInView(block)) {
                revealSection(block);
            }
        });
    }

    /**
     * Inicializa a orquestração do scroll reveal contínuo
     */
    function initDashboardScrollReveal() {
        var dashTab = document.getElementById('dashboard');
        if (!dashTab || dashTab.classList.contains('hidden')) return;

        injectScrollStyles();

        var mainContent = document.getElementById('dashboard-main-content');
        if (!mainContent) return;

        var banner = document.getElementById('dashboard-welcome-banner');
        var metricGrid = document.getElementById('dashboard-metric-cards-container');
        var pdeContainer = document.getElementById('dashboard-pde-progress-container');
        var rows = mainContent.querySelectorAll('.dashboard-row');

        var allSections = [];
        if (pdeContainer) allSections.push(pdeContainer);
        rows.forEach(function(r) { allSections.push(r); });

        // 1. Elementos do Topo (Banner e Métricas): revelação imediata e contagem inicial
        if (banner) {
            banner.classList.add('dash-top-card');
        }

        if (metricGrid) {
            var cards = metricGrid.querySelectorAll('.metric-card');
            cards.forEach(function(c, i) {
                c.classList.add('dash-top-card');
                c.style.animationDelay = (i * 100) + 'ms';
            });
            setTimeout(function() {
                triggerSectionNumbers(metricGrid);
            }, 100);
        }

        // 2. Seções seguintes: se já estiverem na tela, revela; se estiverem abaixo da dobra, aguarda scroll
        allSections.forEach(function(sec) {
            if (isReducedMotion()) {
                sec.classList.add('dash-scroll-block', 'dash-visible');
                sec.setAttribute('data-revealed', 'true');
                return;
            }

            if (isElementInView(sec)) {
                // Já visível na tela inicial
                sec.classList.add('dash-scroll-block', 'dash-visible');
                sec.setAttribute('data-revealed', 'true');
                triggerSectionNumbers(sec);
            } else {
                // Abaixo da dobra: aguarda a rolagem do usuário
                sec.classList.add('dash-scroll-block');
            }
        });

        // 3. IntersectionObserver no viewport global (root: null = window)
        if (typeof IntersectionObserver !== 'undefined') {
            if (observerInstance) {
                try { observerInstance.disconnect(); } catch(e) {}
            }

            observerInstance = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        revealSection(entry.target);
                        observerInstance.unobserve(entry.target);
                    }
                });
            }, {
                root: null, // Viewport real do navegador
                rootMargin: '0px 0px -40px 0px',
                threshold: 0.08
            });

            allSections.forEach(function(sec) {
                if (sec.getAttribute('data-revealed') !== 'true') {
                    observerInstance.observe(sec);
                }
            });
        }

        // 4. Listeners universais de scroll (window, document e .main-content)
        if (!scrollAttached) {
            var ticking = false;
            var onScroll = function() {
                if (!ticking) {
                    window.requestAnimationFrame(function() {
                        handleScrollCheck();
                        ticking = false;
                    });
                    ticking = true;
                }
            };

            window.addEventListener('scroll', onScroll, { passive: true });
            document.addEventListener('scroll', onScroll, { passive: true });

            var scrollBox = document.querySelector('.main-content');
            if (scrollBox) {
                scrollBox.addEventListener('scroll', onScroll, { passive: true });
            }

            scrollAttached = true;
        }

        // 5. Garantia de segurança contra telas em branco:
        // Se após 3.5 segundos algum elemento ainda estiver oculto (ex: sem scroll), revela tudo
        setTimeout(function() {
            var unrevealed = document.querySelectorAll('#dashboard-main-content .dash-scroll-block:not([data-revealed="true"])');
            unrevealed.forEach(function(sec) {
                revealSection(sec);
            });
        }, 3500);
    }

    // Exposição Global
    global.initDashboardScrollReveal = function() {
        setTimeout(initDashboardScrollReveal, 80);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initDashboardScrollReveal, 120);
        });
    } else {
        setTimeout(initDashboardScrollReveal, 120);
    }

})(typeof window !== 'undefined' ? window : this);
