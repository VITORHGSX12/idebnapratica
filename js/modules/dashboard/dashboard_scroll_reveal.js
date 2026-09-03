/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — SCROLL REVEAL PROGRESSIVO DO DASHBOARD
 * Arquivo: js/modules/dashboard/dashboard_scroll_reveal.js
 * Descrição: Montagem contínua e progressiva das seções, contadores numéricos
 *            e gráficos conforme o usuário rola o container .content-body.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var observerInstance = null;
    var scrollAttached = false;
    var activeScrollContainer = null;

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
                transform: translateY(28px);
                transition: opacity 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1);
                will-change: opacity, transform;
            }

            /* Elemento revelado conforme o container rola */
            #dashboard .dash-scroll-block.dash-visible {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }

            /* Entrada suave dos cards do topo */
            #dashboard .dash-top-card {
                animation: dashFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            @keyframes dashFadeUp {
                from {
                    opacity: 0;
                    transform: translateY(18px);
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
     * Revela uma seção conforme a rolagem do container alcança sua posição
     */
    function revealSection(section) {
        if (!section || section.getAttribute('data-revealed') === 'true') return;
        section.setAttribute('data-revealed', 'true');
        section.classList.add('dash-visible');

        triggerSectionNumbers(section);
        triggerSectionCharts(section);
    }

    /**
     * Identifica o container ativo de rolagem (.content-body é a raiz real)
     */
    function getScrollContainer() {
        var cb = document.querySelector('.content-body');
        if (cb && cb.scrollHeight > cb.clientHeight) return cb;
        var mc = document.querySelector('.main-content');
        if (mc && mc.scrollHeight > mc.clientHeight) return mc;
        return cb || mc || window;
    }

    /**
     * Verifica se o elemento está visível dentro do container de rolagem
     */
    function isElementInView(el, container) {
        if (!el) return false;
        var r = el.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) return false;

        var cTop = 0;
        var cBottom = window.innerHeight;

        if (container && container !== window && typeof container.getBoundingClientRect === 'function') {
            var cr = container.getBoundingClientRect();
            cTop = cr.top;
            cBottom = cr.bottom;
        }

        // Revela com margem suave de 60px antes da borda inferior
        return r.top < (cBottom + 60) && r.bottom > (cTop - 40);
    }

    /**
     * Monitor de Scroll Contínuo sobre o container de rolagem real
     */
    function handleScrollCheck() {
        var container = activeScrollContainer || getScrollContainer();
        var blocks = document.querySelectorAll('#dashboard-main-content .dash-scroll-block:not([data-revealed="true"])');
        if (!blocks.length) return;

        blocks.forEach(function(block) {
            if (isElementInView(block, container)) {
                revealSection(block);
            }
        });
    }

    /**
     * Inicializa a orquestração do scroll reveal progressivo
     */
    function initDashboardScrollReveal() {
        var dashTab = document.getElementById('dashboard');
        if (!dashTab || dashTab.classList.contains('hidden')) return;

        injectScrollStyles();

        var mainContent = document.getElementById('dashboard-main-content');
        if (!mainContent) return;

        activeScrollContainer = getScrollContainer();

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
                c.style.animationDelay = (i * 90) + 'ms';
            });
            setTimeout(function() {
                triggerSectionNumbers(metricGrid);
            }, 80);
        }

        // 2. Seções seguintes: apenas revela as que JÁ estiverem visíveis no topo da tela inicial
        // As demais (abaixo da dobra) permanecem ocultas aguardando a rolagem real do usuário
        allSections.forEach(function(sec) {
            if (isReducedMotion()) {
                sec.classList.add('dash-scroll-block', 'dash-visible');
                sec.setAttribute('data-revealed', 'true');
                return;
            }

            if (isElementInView(sec, activeScrollContainer)) {
                sec.classList.add('dash-scroll-block', 'dash-visible');
                sec.setAttribute('data-revealed', 'true');
                triggerSectionNumbers(sec);
            } else {
                sec.classList.add('dash-scroll-block');
            }
        });

        // 3. IntersectionObserver ancorado no container de rolagem real (.content-body)
        if (typeof IntersectionObserver !== 'undefined') {
            if (observerInstance) {
                try { observerInstance.disconnect(); } catch(e) {}
            }

            var obsRoot = (activeScrollContainer && activeScrollContainer !== window) ? activeScrollContainer : null;

            observerInstance = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        revealSection(entry.target);
                        observerInstance.unobserve(entry.target);
                    }
                });
            }, {
                root: obsRoot,
                rootMargin: '60px 0px 60px 0px',
                threshold: 0
            });

            allSections.forEach(function(sec) {
                if (sec.getAttribute('data-revealed') !== 'true') {
                    observerInstance.observe(sec);
                }
            });
        }

        // 4. Listeners universais de rolagem sobre .content-body, .main-content e window
        if (!scrollAttached) {
            var ticking = false;
            var onScroll = function() {
                handleScrollCheck();
                if (!ticking) {
                    window.requestAnimationFrame(function() {
                        handleScrollCheck();
                        ticking = false;
                    });
                    ticking = true;
                }
            };

            var cb = document.querySelector('.content-body');
            if (cb) cb.addEventListener('scroll', onScroll, { passive: true });

            var mc = document.querySelector('.main-content');
            if (mc) mc.addEventListener('scroll', onScroll, { passive: true });

            window.addEventListener('scroll', onScroll, { passive: true });

            scrollAttached = true;
        }
    }

    // Exposição Global
    global.initDashboardScrollReveal = function() {
        setTimeout(initDashboardScrollReveal, 60);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initDashboardScrollReveal, 100);
        });
    } else {
        setTimeout(initDashboardScrollReveal, 100);
    }

})(typeof window !== 'undefined' ? window : this);
