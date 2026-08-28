/**
 * =========================================================================
 * IDEB NA PRÁTICA — PREMIUM LOGIN MOTION & COUNT-UP CONTROLLER
 * Responsabilidade: Animações de entrada, contadores do gráfico IDEB,
 * microinterações visuais de foco/senha e orquestração não-destrutiva.
 * =========================================================================
 */

(function(global) {
    'use strict';

    /**
     * Executa animação fluida de count-up numérico nas barras do gráfico IDEB
     */
    function animateIdebChartCountUp() {
        var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var barValues = [
            { id: 'ideb-bar-val-1', target: 4.2, suffix: '' },
            { id: 'ideb-bar-val-2', target: 4.6, suffix: '' },
            { id: 'ideb-bar-val-3', target: 5.1, suffix: '' },
            { id: 'ideb-bar-val-4', target: 5.6, suffix: '' },
            { id: 'ideb-bar-val-5', target: 6.5, suffix: '*' }
        ];

        barValues.forEach(function(item, index) {
            var el = document.getElementById(item.id);
            if (!el) return;

            if (prefersReducedMotion) {
                el.textContent = item.target.toFixed(1) + item.suffix;
                return;
            }

            var startVal = 0.0;
            var targetVal = item.target;
            var duration = 900; // ms
            var delay = 450 + (index * 100);
            var startTime = null;

            setTimeout(function() {
                function step(timestamp) {
                    if (!startTime) startTime = timestamp;
                    var progress = Math.min(1, (timestamp - startTime) / duration);
                    // Easing cubic easeOut
                    var ease = 1 - Math.pow(1 - progress, 3);
                    var current = startVal + (targetVal - startVal) * ease;

                    el.textContent = current.toFixed(1) + (progress >= 0.98 ? item.suffix : '');

                    if (progress < 1) {
                        requestAnimationFrame(step);
                    } else {
                        el.textContent = targetVal.toFixed(1) + item.suffix;
                    }
                }
                requestAnimationFrame(step);
            }, delay);
        });
    }

    /**
     * Inicializa microinterações refinadas de senha (mostrar/ocultar)
     */
    function initPasswordToggleMotion() {
        var btnToggle = document.getElementById('btn-toggle-login-password');
        var passInput = document.getElementById('login-password');

        if (!btnToggle || !passInput) return;

        // Adiciona acessibilidade
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
     * Inicializa a orquestração da tela de login
     */
    function initLoginExperience() {
        // 1. Inicia contadores
        animateIdebChartCountUp();

        // 2. Vincula toggle de senha
        initPasswordToggleMotion();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLoginExperience);
    } else {
        initLoginExperience();
    }

    // Exposição global segura
    global.initLoginExperience = initLoginExperience;
    global.animateIdebChartCountUp = animateIdebChartCountUp;

})(typeof window !== 'undefined' ? window : this);
