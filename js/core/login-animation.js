/**
 * =========================================================================
 * IDEB NA PRÁTICA — REFINAMENTO VISUAL & COREOGRAFIA DO LOGIN
 * Responsabilidade:
 * - Carrossel sincronizado de 3 frases institucionais (4.5s de permanência)
 * - Atualização dos 3 dots indicadores de frase ativa
 * - Crescimento do gráfico com stagger de 80–100ms e count-up via RAF
 * - Glow suave na Meta 6.5 e pausa de 2.5s no ápice
 * - Reset suave com fade-out/fade-in (sem piscar valores em zero)
 * - Suporte a prefers-reduced-motion e visibilitychange
 * =========================================================================
 */

(function(global) {
    'use strict';

    // 1. Três Frases Institucionais Oficiais
    var NARRATIVE_MESSAGES = [
        {
            line1: 'Cada décimo do IDEB',
            line2: 'planejado e conquistado.'
        },
        {
            line1: 'Dados oficiais,',
            line2: 'decisões pedagógicas melhores.'
        },
        {
            line1: 'Gestão da educação municipal,',
            line2: 'em um só lugar.'
        }
    ];

    // 2. Metadados e Valores Reais Oficiais do Gráfico IDEB (Preservação Absoluta)
    var BARS_CONFIG = [
        { barId: 'ideb-bar-1', valId: 'ideb-bar-val-1', target: 4.2, suffix: '', heightPct: '38%' },
        { barId: 'ideb-bar-2', valId: 'ideb-bar-val-2', target: 4.6, suffix: '', heightPct: '47%' },
        { barId: 'ideb-bar-3', valId: 'ideb-bar-val-3', target: 5.1, suffix: '', heightPct: '58%' },
        { barId: 'ideb-bar-4', valId: 'ideb-bar-val-4', target: 5.6, suffix: '', heightPct: '66%' },
        { barId: 'ideb-bar-5', valId: 'ideb-bar-val-5', target: 6.5, suffix: '*', heightPct: '78%' }
    ];

    // Estado da Máquina de Animação
    var narrativeState = {
        currentIndex: 0,
        timerId: null,
        activeRafIds: [],
        isRunning: false,
        isPaused: false
    };

    /**
     * Atualiza os 3 dots indicadores
     */
    function updateHeadlineDots(activeIndex) {
        var dotsContainer = document.getElementById('login-headline-dots');
        if (!dotsContainer) return;

        var dots = dotsContainer.querySelectorAll('.headline-dot');
        dots.forEach(function(dot, idx) {
            if (idx === activeIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    /**
     * Renderiza a mensagem no DOM
     */
    function renderHeadlineMessage(msg, index) {
        var headlineEl = document.getElementById('rotating-headline');
        if (!headlineEl || !msg) return;

        headlineEl.innerHTML = '<span class="headline-line-1">' + msg.line1 + '</span>' +
                               '<span class="headline-line-2">' + msg.line2 + '</span>';

        updateHeadlineDots(index);
    }

    /**
     * Executa a subida escalonada (stagger 90ms) e count-up sincronizado via RAF
     */
    function animateChartGrowth() {
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var badgeMeta = document.getElementById('login-card-target-badge');

        BARS_CONFIG.forEach(function(item, index) {
            var barEl = document.getElementById(item.barId);
            var valEl = document.getElementById(item.valId);

            if (prefersReducedMotion) {
                if (barEl) barEl.style.height = item.heightPct;
                if (valEl) valEl.textContent = item.target.toFixed(1) + item.suffix;
                return;
            }

            var delay = index * 90; // Stagger de 90ms

            setTimeout(function() {
                if (!narrativeState.isRunning || narrativeState.isPaused) return;

                if (barEl) {
                    barEl.classList.add('grown');
                    barEl.style.height = item.heightPct;
                }

                if (valEl) {
                    var startVal = 0.0;
                    var targetVal = item.target;
                    var duration = 650; // ms
                    var startTime = null;

                    function countStep(timestamp) {
                        if (!startTime) startTime = timestamp;
                        var progress = Math.min(1, (timestamp - startTime) / duration);
                        // Easing cúbico premium
                        var ease = 1 - Math.pow(1 - progress, 3);
                        var current = startVal + (targetVal - startVal) * ease;

                        valEl.textContent = current.toFixed(1) + (progress >= 0.98 ? item.suffix : '');

                        if (progress < 1 && narrativeState.isRunning && !narrativeState.isPaused) {
                            var rafId = requestAnimationFrame(countStep);
                            narrativeState.activeRafIds.push(rafId);
                        } else {
                            valEl.textContent = targetVal.toFixed(1) + item.suffix;
                            if (index === BARS_CONFIG.length - 1 && badgeMeta) {
                                badgeMeta.style.transform = 'scale(1.03)';
                                badgeMeta.style.boxShadow = '0 0 10px rgba(34, 197, 94, 0.4)';
                            }
                        }
                    }

                    var rafId = requestAnimationFrame(countStep);
                    narrativeState.activeRafIds.push(rafId);
                }
            }, delay);
        });
    }

    /**
     * Executa o reset suave do gráfico com fade-out -> reset -> fade-in
     */
    function animateChartReset() {
        var chartCard = document.querySelector('.login-chart-card');
        var badgeMeta = document.getElementById('login-card-target-badge');

        if (badgeMeta) {
            badgeMeta.style.transform = 'scale(1)';
            badgeMeta.style.boxShadow = '0 2px 6px rgba(34, 197, 94, 0.15)';
        }

        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        // Fade out suave do gráfico antes de resetar (sem piscar números em zero)
        if (chartCard) {
            chartCard.style.opacity = '0.35';
        }

        setTimeout(function() {
            BARS_CONFIG.forEach(function(item) {
                var barEl = document.getElementById(item.barId);
                var valEl = document.getElementById(item.valId);

                if (barEl) {
                    barEl.classList.remove('grown');
                    barEl.style.height = '6%';
                }

                if (valEl) {
                    valEl.textContent = '0.0';
                }
            });

            if (chartCard) {
                chartCard.style.opacity = '1';
            }
        }, 220);
    }

    /**
     * Executa um ciclo completo de 3 frases com permanência de 4.5s
     */
    function runNarrativeCycle(isInitial) {
        if (!narrativeState.isRunning || narrativeState.isPaused) return;

        var headlineEl = document.getElementById('rotating-headline');
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // 1. Entrada da frase atual
        var currentMsg = NARRATIVE_MESSAGES[narrativeState.currentIndex];
        renderHeadlineMessage(currentMsg, narrativeState.currentIndex);

        if (headlineEl && !prefersReducedMotion) {
            headlineEl.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
            headlineEl.style.opacity = '1';
            headlineEl.style.transform = 'translateY(0)';
        }

        // 2. Crescimento do Gráfico
        setTimeout(function() {
            if (!narrativeState.isRunning || narrativeState.isPaused) return;
            animateChartGrowth();
        }, isInitial ? 300 : 200);

        // 3. Se usuário prefere redução de movimento, troca estática lenta
        if (prefersReducedMotion) {
            narrativeState.timerId = setTimeout(function() {
                narrativeState.currentIndex = (narrativeState.currentIndex + 1) % NARRATIVE_MESSAGES.length;
                runNarrativeCycle(false);
            }, 6000);
            return;
        }

        // 4. Pausa de 2.5s no ápice (com tudo estático) -> Saída suave da frase aos 4.5s
        setTimeout(function() {
            if (!narrativeState.isRunning || narrativeState.isPaused) return;
            if (headlineEl) {
                headlineEl.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
                headlineEl.style.opacity = '0';
                headlineEl.style.transform = 'translateY(-6px)';
            }
        }, 4500);

        // 5. Reset suave do gráfico
        setTimeout(function() {
            if (!narrativeState.isRunning || narrativeState.isPaused) return;
            animateChartReset();
        }, 4750);

        // 6. Preparação e Entrada da Nova Frase
        setTimeout(function() {
            if (!narrativeState.isRunning || narrativeState.isPaused) return;

            narrativeState.currentIndex = (narrativeState.currentIndex + 1) % NARRATIVE_MESSAGES.length;
            var nextMsg = NARRATIVE_MESSAGES[narrativeState.currentIndex];
            renderHeadlineMessage(nextMsg, narrativeState.currentIndex);

            if (headlineEl) {
                headlineEl.style.transition = 'none';
                headlineEl.style.opacity = '0';
                headlineEl.style.transform = 'translateY(8px)';

                void headlineEl.offsetWidth; // Força reflow

                headlineEl.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                headlineEl.style.opacity = '1';
                headlineEl.style.transform = 'translateY(0)';
            }
        }, 5100);

        // 7. Disparo do próximo ciclo
        narrativeState.timerId = setTimeout(function() {
            runNarrativeCycle(false);
        }, 5500);
    }

    /**
     * Inicia o motor
     */
    function startNarrativeEngine() {
        var loginScreen = document.getElementById('login-screen');
        if (loginScreen && (loginScreen.style.display === 'none' || loginScreen.classList.contains('hidden'))) {
            return;
        }

        stopNarrativeEngine();

        narrativeState.isRunning = true;
        narrativeState.isPaused = false;
        narrativeState.activeRafIds = [];

        runNarrativeCycle(true);
    }

    /**
     * Interrompe o motor e limpa timers e RAFs
     */
    function stopNarrativeEngine() {
        narrativeState.isRunning = false;

        if (narrativeState.timerId) {
            clearTimeout(narrativeState.timerId);
            narrativeState.timerId = null;
        }

        if (narrativeState.activeRafIds && narrativeState.activeRafIds.length) {
            narrativeState.activeRafIds.forEach(function(id) {
                cancelAnimationFrame(id);
            });
            narrativeState.activeRafIds = [];
        }
    }

    /**
     * Listener de Visibilidade de Aba (Performance)
     */
    function initVisibilityListener() {
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                narrativeState.isPaused = true;
                if (narrativeState.timerId) {
                    clearTimeout(narrativeState.timerId);
                    narrativeState.timerId = null;
                }
            } else {
                var loginScreen = document.getElementById('login-screen');
                if (loginScreen && loginScreen.style.display !== 'none' && !loginScreen.classList.contains('hidden')) {
                    narrativeState.isPaused = false;
                    startNarrativeEngine();
                }
            }
        });
    }

    /**
     * Toggle de Senha com microanimação de scale
     */
    function initPasswordToggle() {
        var btnToggle = document.getElementById('btn-toggle-login-password');
        var passInput = document.getElementById('login-password');

        if (!btnToggle || !passInput) return;

        btnToggle.setAttribute('aria-label', 'Mostrar senha');
        btnToggle.setAttribute('role', 'button');

        btnToggle.addEventListener('click', function(e) {
            e.preventDefault();
            var isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            btnToggle.setAttribute('aria-label', isPass ? 'Ocultar senha' : 'Mostrar senha');

            if (isPass) {
                btnToggle.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>';
            } else {
                btnToggle.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });
    }

    /**
     * Inicialização Principal
     */
    function initLoginNarrativeSystem() {
        initPasswordToggle();
        initVisibilityListener();
        startNarrativeEngine();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginNarrativeSystem);
    } else {
        initLoginNarrativeSystem();
    }

    // Exposição Global Limpa e Segura
    global.LoginNarrativeEngine = {
        start: startNarrativeEngine,
        stop: stopNarrativeEngine,
        getState: function() { return narrativeState; }
    };

})(typeof window !== 'undefined' ? window : this);
