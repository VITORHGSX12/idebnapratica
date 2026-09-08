// =========================================================================
// AUTHENTICATION & SESSION MANAGEMENT COORDINATOR
// Responsabilidade: Sessão, inicialização, logout e coordenação
// Submódulos: auth/auth_password.js, auth/auth_login.js
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Encerra a sessão atual com confirmação e limpa estados temporários
     */
    function handleSystemLogout() {
        var shouldLogout = typeof global.confirm === 'function' 
            ? global.confirm('Deseja realmente encerrar sua sessão no sistema?') 
            : true;

        if (shouldLogout) {
            try {
                localStorage.removeItem('isLoggedIn');
                sessionStorage.clear();
            } catch(e) {}

            if (typeof document !== 'undefined') {
                var loginScreen = document.getElementById('login-screen');
                var appContainer = document.querySelector('.app-container');

                if (loginScreen) {
                    loginScreen.classList.remove('fade-out');
                    loginScreen.style.display = 'block';
                    loginScreen.style.pointerEvents = 'auto';
                    loginScreen.classList.remove('hidden');
                }
                if (appContainer) {
                    appContainer.style.display = 'none';
                }
            }

            if (typeof global.showToast === 'function') {
                global.showToast('Sessão encerrada com sucesso!', 'log-out');
            }

            if (typeof window !== 'undefined' && window.location && typeof window.location.reload === 'function') {
                setTimeout(function() {
                    window.location.reload();
                }, 300);
            }
        }
    }

    /**
     * Verifica e restaura a sessão ativa ao carregar/atualizar a página
     */
    function checkAuthSession() {
        if (typeof document === 'undefined') return;
        var isLogged = (localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true');
        var loginScreen = document.getElementById('login-screen');
        var appContainer = document.querySelector('.app-container');

        // Preenche e-mail lembrado se existir
        var remembered = localStorage.getItem('rememberedUserEmail');
        var emailInput = document.getElementById('login-email');
        if (remembered && emailInput && !emailInput.value) {
            emailInput.value = remembered;
        }

        if (isLogged) {
            if (loginScreen) {
                loginScreen.style.display = 'none';
                loginScreen.style.pointerEvents = 'none';
            }
            if (appContainer) {
                appContainer.style.display = 'flex';
            }
            var savedEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || 'semed@goncalvesdias.ma.gov.br';
            var userEmailDisplay = document.getElementById('user-display-email');
            if (userEmailDisplay) userEmailDisplay.textContent = savedEmail;

            if (typeof global.updateUserHeaderUI === 'function') global.updateUserHeaderUI();
            if (typeof global.renderDashboardWelcomeBanner === 'function') global.renderDashboardWelcomeBanner();
        }
    }

    /**
     * Vincula ouvintes de eventos do formulário de login e rotação de títulos
     */
    function initAuthEventListeners() {
        if (typeof document === 'undefined') return;

        var execLogin = (global.AuthLogin && global.AuthLogin.executeSystemLogin) || global.executeSystemLogin;

        var loginForm = document.getElementById('login-form');
        if (loginForm && execLogin) {
            loginForm.onsubmit = function(e) {
                e.preventDefault();
                execLogin();
            };
        }

        var btnLoginSubmit = document.getElementById('btn-login-submit');
        if (btnLoginSubmit && execLogin) {
            btnLoginSubmit.onclick = function(e) {
                e.preventDefault();
                execLogin();
            };
        }

        var initRotation = (global.AuthLogin && global.AuthLogin.initHeroPhrasesRotation) || global.initHeroPhrasesRotation;
        if (typeof initRotation === 'function') {
            initRotation();
        }
    }

    // Inicialização do Ciclo de Vida
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                initAuthEventListeners();
                checkAuthSession();
            });
        } else {
            initAuthEventListeners();
            checkAuthSession();
        }
    }

    // Exposição Global
    global.handleSystemLogout = handleSystemLogout;
    global.checkAuthSession = checkAuthSession;
    global.initAuthEventListeners = initAuthEventListeners;

})(typeof window !== 'undefined' ? window : this);
