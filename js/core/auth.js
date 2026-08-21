// =========================================================================
// AUTHENTICATION & SESSION MANAGEMENT MODULE
// Responsabilidade: Autenticação, perfis de acesso, sessão e logout
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Executa a autenticação no sistema, identificando o papel do usuário por e-mail/perfil
     * @param {string} [explicitEmail]
     * @param {string} [explicitPass]
     */
    async function executeSystemLogin(explicitEmail, explicitPass) {
        var emailEl = document.getElementById('login-email');
        var passEl = document.getElementById('login-password');
        var btnSubmit = document.getElementById('btn-login-submit');
        var loginScreen = document.getElementById('login-screen');
        var appContainer = document.querySelector('.app-container');

        var emailInput = (explicitEmail || (emailEl ? emailEl.value : '') || 'semed@goncalvesdias.ma.gov.br').trim().toLowerCase();
        var passInput = explicitPass || (passEl ? passEl.value : '') || '123';

        var detectedRole = 'Gestor da Rede';
        var targetTab = 'dashboard';
        var assignedSchool = 'Rede Municipal Oficial';
        var assignedTurma = 'Todas as Turmas';
        var profileName = 'Secretaria de Educação';
        var profileRole = 'Gestão Executiva SEMED';
        var profileAvatar = '🧑‍💼';

        if (emailInput.startsWith('prof') || emailInput.includes('professor')) {
            detectedRole = 'Professor';
            targetTab = 'dashboard';
            assignedSchool = 'UI JOSE CORREA LIMA';
            assignedTurma = '5º Ano A';
            profileName = 'Prof. Carlos Eduardo';
            profileRole = 'Professor(a) • UI JOSE CORREA LIMA';
            profileAvatar = '👨‍🏫';
        } else if (emailInput.startsWith('diret') || emailInput.includes('diretor') || emailInput.includes('escola') || emailInput.includes('cora')) {
            detectedRole = 'Diretor Escola';
            targetTab = 'dashboard';
            assignedSchool = 'UI JOSE CORREA LIMA';
            assignedTurma = 'Todas as Turmas';
            profileName = 'Profa. Antonia Silva';
            profileRole = 'Diretora Escolar • UI JOSE CORREA LIMA';
            profileAvatar = '👩‍💼';
        } else if (emailInput.startsWith('admin') || emailInput.startsWith('dpo')) {
            detectedRole = 'Master Admin';
            targetTab = 'dashboard';
            assignedSchool = 'Administração TI / DPO';
            assignedTurma = 'Todas as Redes';
            profileName = 'Administrador TI';
            profileRole = 'Administrador(a) do Sistema & TI';
            profileAvatar = '👨‍💻';
        } else {
            detectedRole = 'Gestor da Rede';
            targetTab = 'dashboard';
            assignedSchool = 'Rede Municipal Oficial';
            assignedTurma = 'Todas as Turmas';
            profileName = 'Secretaria de Educação';
            profileRole = 'Gestão Executiva SEMED';
            profileAvatar = '🧑‍💼';
        }

        // Salvar Perfil Isolado do Usuário Atual
        var userProfileData = {
            name: profileName,
            email: emailInput,
            role: profileRole,
            avatarIcon: profileAvatar,
            avatarPhoto: ''
        };

        try {
            localStorage.setItem('gd_current_user_profile', JSON.stringify(userProfileData));
        } catch(e) {}

        if (btnSubmit) {
            btnSubmit.disabled = true;
            var btnSpan = btnSubmit.querySelector('span');
            if (btnSpan) btnSpan.textContent = 'Autenticando...';
        }

        sessionStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('activeTenant', 'default');
        sessionStorage.setItem('userEmail', emailInput);
        localStorage.setItem('userEmail', emailInput);
        sessionStorage.setItem('userName', profileName);
        sessionStorage.setItem('userRole', detectedRole);
        sessionStorage.setItem('userEscola', assignedSchool);
        sessionStorage.setItem('userTurma', assignedTurma);

        try {
            if (typeof global.loadDatabaseState === 'function') {
                await global.loadDatabaseState();
            }
        } catch (err) {
            console.warn('[IDEB Engine] Warning in loadDatabaseState:', err);
        }

        // Atualizar UIs dependentes do perfil
        try {
            if (typeof global.updateMenuVisibilityByRole === 'function') global.updateMenuVisibilityByRole();
            if (typeof global.updateUserHeaderUI === 'function') global.updateUserHeaderUI();
            if (typeof global.renderDashboardWelcomeBanner === 'function') global.renderDashboardWelcomeBanner();
            if (typeof global.renderDashboardComplete === 'function') global.renderDashboardComplete();
            if (typeof global.renderDbSchools === 'function') global.renderDbSchools();
            if (typeof global.renderDbStudents === 'function') global.renderDbStudents();
        } catch (err) {
            console.warn('[IDEB Engine] Warning in UI updates:', err);
        }

        // Exibição Imediata da Aplicação Principal
        if (appContainer) {
            appContainer.style.display = 'flex';
        }

        // Navegação direta para a aba do perfil
        try {
            if (typeof global.switchTab === 'function') {
                global.switchTab(targetTab);
            } else if (typeof global.navigateToTab === 'function') {
                global.navigateToTab(targetTab);
            }
        } catch (err) {
            console.warn('[IDEB Engine] Warning in switchTab:', err);
        }

        // Ocultação fluida da tela de login
        if (loginScreen) {
            loginScreen.classList.add('fade-out');
            loginScreen.style.display = 'none';
            loginScreen.style.pointerEvents = 'none';
            if (btnSubmit) {
                btnSubmit.disabled = false;
                var btnSpanReset = btnSubmit.querySelector('span');
                if (btnSpanReset) btnSpanReset.textContent = 'Entrar no Sistema';
            }
        }

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Bem-vindo ao IDEB na Prática! Painel ' + detectedRole + ' carregado.', 'check');
        }

        window.scrollTo(0, 0);
    }

    /**
     * Encerra a sessão atual com confirmação e limpa estados temporários
     */
    function handleSystemLogout() {
        if (confirm('Deseja realmente encerrar sua sessão no sistema?')) {
            try {
                localStorage.removeItem('isLoggedIn');
                sessionStorage.clear();
            } catch(e) {}

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
        var isLogged = (localStorage.getItem('isLoggedIn') === 'true' || sessionStorage.getItem('isLoggedIn') === 'true');
        var loginScreen = document.getElementById('login-screen');
        var appContainer = document.querySelector('.app-container');

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
     * Vincula ouvintes de eventos do formulário de login e contas de demonstração rápida
     */
    function initAuthEventListeners() {
        var loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.onsubmit = function(e) {
                e.preventDefault();
                executeSystemLogin();
            };
        }

        var btnLoginSubmit = document.getElementById('btn-login-submit');
        if (btnLoginSubmit) {
            btnLoginSubmit.onclick = function(e) {
                e.preventDefault();
                executeSystemLogin();
            };
        }

        // Cards de Contas de Teste / Demonstração
        var testCards = document.querySelectorAll('.test-account-card');
        var loginEmailInput = document.getElementById('login-email');
        var loginPasswordInput = document.getElementById('login-password');

        if (testCards && loginEmailInput) {
            testCards.forEach(function(card) {
                card.onclick = function() {
                    testCards.forEach(function(c) { c.classList.remove('active'); });
                    card.classList.add('active');

                    var email = card.getAttribute('data-email') || '';
                    var pass = card.getAttribute('data-pass') || '123';
                    var role = card.getAttribute('data-role') || 'Gestor da Rede';

                    loginEmailInput.value = email;
                    if (loginPasswordInput) loginPasswordInput.value = pass;

                    var roleTitle = card.querySelector('.test-role-title');
                    var roleLabel = roleTitle ? roleTitle.textContent : role;

                    if (typeof global.showToast === 'function') {
                        global.showToast('Perfil ' + roleLabel + ' preenchido. Clique em "Entrar no Sistema".', 'check');
                    }
                };
            });
        }

        // Link esqueci minha senha
        var linkForgotPassword = document.getElementById('link-forgot-password');
        if (linkForgotPassword) {
            linkForgotPassword.onclick = function(e) {
                e.preventDefault();
                alert('Para redefinir sua senha institucional, entre em contato com a equipe de TI da SEMED Gonçalves Dias - MA (admin@goncalvesdias.ma.gov.br).');
            };
        }
    }

    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initAuthEventListeners();
            checkAuthSession();
        });
    } else {
        initAuthEventListeners();
        checkAuthSession();
    }

    // Exposição global
    global.executeSystemLogin = executeSystemLogin;
    global.handleSystemLogout = handleSystemLogout;
    global.checkAuthSession = checkAuthSession;
    global.initAuthEventListeners = initAuthEventListeners;

})(typeof window !== 'undefined' ? window : this);
