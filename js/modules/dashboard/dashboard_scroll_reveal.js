/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — SCROLL REVEAL BIDIRECIONAL & MICROINTERAÇÕES
 * Arquivo: js/modules/dashboard/dashboard_scroll_reveal.js
 * Descrição: Sistema bidirecional (aparece ao descer, retira-se ao subir)
 *            e elevação em destaque ao passar o mouse em cada caixinha.
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
            #dashboard .dash-scroll-block { opacity: 0; transform: translateY(28px); transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1); will-change: opacity, transform; }
            #dashboard .dash-scroll-block.dash-visible { opacity: 1 !important; transform: translateY(0) !important; }
            #dashboard .dash-top-card { animation: dashFadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            @keyframes dashFadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
            #dashboard .progress-ring-fill { transition: stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1); }
            #dashboard .metric-card, #dashboard .dashboard-row .card, #dashboard #dashboard-pde-progress-container,
            #dashboard .dashboard-welcome-banner, #dashboard .pedagogy-action-card, #dashboard .highlight-item, #dashboard .priority-desc-card {
                transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease !important;
                cursor: pointer;
            }
            #dashboard .metric-card:hover, #dashboard .dashboard-row .card:hover, #dashboard #dashboard-pde-progress-container:hover {
                transform: translateY(-6px) scale(1.008) !important;
                box-shadow: 0 18px 36px -4px rgba(10, 25, 49, 0.18), 0 0 0 1.5px rgba(99, 102, 241, 0.35) !important;
                z-index: 10; position: relative;
            }
            #dashboard .dashboard-welcome-banner:hover {
                transform: translateY(-4px) !important;
                box-shadow: 0 16px 36px -4px rgba(10, 25, 49, 0.24), 0 0 0 1.5px rgba(255, 255, 255, 0.3) !important;
            }
            #dashboard .escala-cards-deck { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-top: 14px; perspective: 1200px; position: relative; padding: 16px 6px; }
            #dashboard .escala-card {
                transition: transform 0.36s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.36s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.36s ease, border-color 0.36s ease !important;
                transform-origin: center 85%; will-change: transform, box-shadow, opacity; position: relative; z-index: 1; cursor: pointer; user-select: none;
            }
            #dashboard .escala-card.card-selected {
                transform: translateY(-16px) scale(1.08) rotate(0deg) !important; z-index: 35 !important; opacity: 1 !important;
                box-shadow: 0 24px 50px -8px rgba(10, 25, 49, 0.32), 0 0 0 2px var(--card-color, #2563eb) !important;
            }
            #dashboard .escala-card.card-shuffled-left {
                transform: translate(var(--shuffle-tx, -6px), var(--shuffle-ty, 8px)) scale(0.94) rotate(var(--shuffle-rot, -4.5deg)) !important;
                z-index: 2 !important; opacity: 0.72 !important; box-shadow: 0 4px 12px rgba(10, 25, 49, 0.08) !important;
            }
            #dashboard .escala-card.card-shuffled-right {
                transform: translate(var(--shuffle-tx, 6px), var(--shuffle-ty, 8px)) scale(0.94) rotate(var(--shuffle-rot, 4.5deg)) !important;
                z-index: 2 !important; opacity: 0.72 !important; box-shadow: 0 4px 12px rgba(10, 25, 49, 0.08) !important;
            }
            @media (prefers-reduced-motion: reduce) {
                #dashboard .dash-scroll-block, #dashboard .dash-top-card, #dashboard .metric-card:hover, #dashboard .dashboard-row .card:hover {
                    opacity: 1 !important; transform: none !important; transition: none !important; animation: none !important; box-shadow: none !important;
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
        element.setAttribute('data-original-html', originalHtml);
        duration = duration || 900;

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
            animateCountUp(valEl, 900);
        }
    }

    /**
     * Anima números e anéis presentes em um container
     */
    function triggerSectionNumbers(container) {
        if (!container) return;

        var metricValues = container.querySelectorAll('.metric-value');
        metricValues.forEach(function(el) { animateCountUp(el, 900); });

        var rings = container.querySelectorAll('.progress-ring-container');
        rings.forEach(function(rg) { animateProgressRing(rg); });

        var networkBadge = container.querySelector('#simulados-network-avg-badge');
        if (networkBadge) animateCountUp(networkBadge, 900);

        var gapVal = container.querySelector('.ideb-trajectory-gap-val');
        if (gapVal) animateCountUp(gapVal, 900);
    }

    // Mapa de loops ativos de gráficos para gerenciamento de ciclo de vida
    var activeChartLoops = {};

    function stopChartLoop(key) {
        if (activeChartLoops[key]) {
            if (activeChartLoops[key].rafId) cancelAnimationFrame(activeChartLoops[key].rafId);
            if (activeChartLoops[key].timeoutId) clearTimeout(activeChartLoops[key].timeoutId);
            delete activeChartLoops[key];
        }
    }

    /**
     * Anima a subida da linha de um gráfico em loop contínuo enquanto em destaque na tela
     */
    function startLineChartRiseLoop(chartInstance, minY, riseDuration, holdDuration) {
        if (!chartInstance || !chartInstance.canvas || !chartInstance.data) return;
        var canvasId = chartInstance.canvas.id || ('chart_' + Math.random().toString(36).substr(2, 5));
        stopChartLoop(canvasId);

        if (!chartInstance._originalData) {
            chartInstance._originalData = chartInstance.data.datasets.map(function(ds) {
                return ds.data.slice();
            });
        }
        var origData = chartInstance._originalData;
        var duration = riseDuration || 1500;
        var hold = holdDuration || 2600;

        function runCycle() {
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var elapsed = timestamp - startTime;
                var t = Math.min(elapsed / duration, 1);
                var progress = 1 - Math.pow(1 - t, 3.5);

                chartInstance.data.datasets.forEach(function(ds, dIdx) {
                    var targetArr = origData[dIdx];
                    if (!targetArr) return;
                    ds.data = targetArr.map(function(v) {
                        if (v === null || v === undefined) return null;
                        return +(minY + (v - minY) * progress).toFixed(2);
                    });
                });

                try {
                    chartInstance.update('none');
                } catch(e) {}

                if (t < 1) {
                    if (activeChartLoops[canvasId]) {
                        activeChartLoops[canvasId].rafId = requestAnimationFrame(step);
                    }
                } else {
                    if (activeChartLoops[canvasId]) {
                        activeChartLoops[canvasId].timeoutId = setTimeout(function() {
                            if (activeChartLoops[canvasId]) runCycle();
                        }, hold);
                    }
                }
            }

            activeChartLoops[canvasId] = {
                rafId: requestAnimationFrame(step),
                timeoutId: null
            };
        }

        runCycle();
    }

    /**
     * Anima a linha vetorial SVG da Trajetória PDE subindo verticalmente ao topo em loop
     */
    function startTrajectoryLineLoop(section) {
        var key = 'trajectory-line';
        stopChartLoop(key);

        var duration = 1500;
        var hold = 2600;

        function runSvgCycle() {
            var startTime = null;

            function step(timestamp) {
                if (!startTime) startTime = timestamp;
                var elapsed = timestamp - startTime;
                var t = Math.min(elapsed / duration, 1);
                var progress = 1 - Math.pow(1 - t, 3.5);

                if (typeof global.updatePdeTrajectoryProgress === 'function') {
                    global.updatePdeTrajectoryProgress(progress);
                }

                if (t < 1) {
                    if (activeChartLoops[key]) {
                        activeChartLoops[key].rafId = requestAnimationFrame(step);
                    }
                } else {
                    if (activeChartLoops[key]) {
                        activeChartLoops[key].timeoutId = setTimeout(function() {
                            if (activeChartLoops[key] && section.getAttribute('data-revealed') === 'true') {
                                runSvgCycle();
                            }
                        }, hold);
                    }
                }
            }

            activeChartLoops[key] = {
                rafId: requestAnimationFrame(step),
                timeoutId: null
            };
        }

        runSvgCycle();
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
            setTimeout(function() {
                var inst = (global.dashChartInstances && global.dashChartInstances.getGoncalvesDias) ?
                    global.dashChartInstances.getGoncalvesDias() : null;
                if (inst) startLineChartRiseLoop(inst, 2.0, 1600, 2600);
            }, 60);
        }

        // 2. Gráficos Maranhão Anos Iniciais / Finais
        if (section.querySelector('#dashChartIniciais') || section.querySelector('#dashChartFinais')) {
            if (typeof global.renderDashboardEtapasCharts === 'function') {
                global.renderDashboardEtapasCharts();
            }
            setTimeout(function() {
                if (global.dashChartInstances) {
                    var inc = global.dashChartInstances.getIniciais ? global.dashChartInstances.getIniciais() : null;
                    var fin = global.dashChartInstances.getFinais ? global.dashChartInstances.getFinais() : null;
                    if (inc) startLineChartRiseLoop(inc, 0, 1600, 2600);
                    if (fin) startLineChartRiseLoop(fin, 0, 1600, 2600);
                }
            }, 60);
        }

        // 3. Gráfico Comparativo Hiato
        if (section.querySelector('#dashChartComparativo')) {
            if (typeof global.renderDashboardComparativoChart === 'function') {
                global.renderDashboardComparativoChart();
            }
            setTimeout(function() {
                var comp = (global.dashChartInstances && global.dashChartInstances.getComparativo) ?
                    global.dashChartInstances.getComparativo() : null;
                if (comp) startLineChartRiseLoop(comp, 2.0, 1600, 2600);
            }, 60);
        }

        // 4. Gráfico Evolução Histórica SAEB
        if (section.querySelector('#dashChartSaebEvolucaoGoncalves')) {
            if (typeof global.renderDashboardSaebEvolucaoGoncalvesChart === 'function') {
                global.renderDashboardSaebEvolucaoGoncalvesChart();
            }
            setTimeout(function() {
                var saeb = global.dashSaebEvolucaoChartInstance;
                if (saeb) startLineChartRiseLoop(saeb, 150, 1600, 2600);
            }, 60);
        }

        // 5. Linha Vetorial do IDEB Trajetória PDE
        if (section.querySelector('.trajectory-observed-line')) {
            startTrajectoryLineLoop(section);
        }
    }

    /**
     * Revela uma seção conforme a rolagem desce e alcança sua posição
     */
    function revealSection(section) {
        if (!section || section.getAttribute('data-revealed') === 'true') return;
        section.setAttribute('data-revealed', 'true');
        section.classList.add('dash-visible');

        triggerSectionNumbers(section);
        triggerSectionCharts(section);
    }

    /**
     * Retira uma seção conforme a rolagem sobe e o elemento sai por baixo
     */
    function unrevealSection(section) {
        if (!section || section.getAttribute('data-revealed') !== 'true') return;
        section.setAttribute('data-revealed', 'false');
        section.classList.remove('dash-visible');

        // Resetar marcadores numéricos para re-animar no próximo scroll
        var counted = section.querySelectorAll('[data-counted="true"]');
        counted.forEach(function(el) {
            el.removeAttribute('data-counted');
            var orig = el.getAttribute('data-original-html');
            if (orig) el.innerHTML = orig;
        });

        // Parar animações em loop dos gráficos desta seção
        var canvases = section.querySelectorAll('canvas');
        canvases.forEach(function(cv) {
            if (cv.id) stopChartLoop(cv.id);
        });

        // Resetar Trajetória PDE SVG
        if (section.querySelector('.trajectory-observed-line')) {
            stopChartLoop('trajectory-line');
            if (typeof global.updatePdeTrajectoryProgress === 'function') {
                global.updatePdeTrajectoryProgress(0);
            }
        }
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

        // Revela com margem suave de 50px antes da borda inferior
        return r.top < (cBottom + 50) && r.bottom > (cTop - 40);
    }

    /**
     * Monitor de Scroll Contínuo Bidirecional
     */
    function handleScrollCheck() {
        var container = activeScrollContainer || getScrollContainer();
        var blocks = document.querySelectorAll('#dashboard-main-content .dash-scroll-block');
        if (!blocks.length) return;

        var cBottom = window.innerHeight;
        if (container && container !== window && typeof container.getBoundingClientRect === 'function') {
            cBottom = container.getBoundingClientRect().bottom;
        }

        blocks.forEach(function(block) {
            var r = block.getBoundingClientRect();
            if (isElementInView(block, container)) {
                // Rola para baixo: aparece
                revealSection(block);
            } else if (r.top > cBottom + 30 && block.getAttribute('data-revealed') === 'true') {
                // Rola para cima (volta): retira-se suavemente
                unrevealSection(block);
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

        // 1. Elementos do Topo (Banner e Métricas): revelação inicial e destaque
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

        // 2. Seções seguintes: apenas revela as que JÁ estiverem visíveis no topo
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
                sec.setAttribute('data-revealed', 'false');
            }
        });

        // 3. IntersectionObserver bidirecional ancorado no .content-body
        if (typeof IntersectionObserver !== 'undefined') {
            if (observerInstance) {
                try { observerInstance.disconnect(); } catch(e) {}
            }

            var obsRoot = (activeScrollContainer && activeScrollContainer !== window) ? activeScrollContainer : null;

            observerInstance = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        revealSection(entry.target);
                    } else {
                        var cr = entry.rootBounds || (activeScrollContainer && activeScrollContainer.getBoundingClientRect ? activeScrollContainer.getBoundingClientRect() : null);
                        if (cr && entry.boundingClientRect.top > cr.bottom + 10) {
                            unrevealSection(entry.target);
                        }
                    }
                });
            }, {
                root: obsRoot,
                rootMargin: '50px 0px 50px 0px',
                threshold: [0, 0.1]
            });

            allSections.forEach(function(sec) {
                observerInstance.observe(sec);
            });
        }

        // 4. Listeners contínuos de rolagem bidirecional
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
