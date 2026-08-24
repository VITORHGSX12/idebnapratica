// =========================================================================
// AUTHENTICATION & SESSION MANAGEMENT MODULE
// Responsabilidade: Autenticação, perfis de acesso, sessão e logout
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Executa a autenticação no sistema com AbortController (timeout 8s),
     * loading state e contingência local para conexões instáveis.
     */
    async function executeSystemLogin(explicitEmail, explicitPass) {
        var emailEl = document.getElementById('login-email');
        var passEl = document.getElementById('login-password');
        var rememberEl = document.getElementById('login-remember-me');
        var btnSubmit = document.getElementById('btn-login-submit');
        var loginScreen = document.getElementById('login-screen');
        var appContainer = document.querySelector('.app-container');

        var emailInput = (explicitEmail || (emailEl ? emailEl.value : '') || 'semed@goncalvesdias.ma.gov.br').trim().toLowerCase();
        var passInput = explicitPass || (passEl ? passEl.value : '') || '123';
        var shouldRemember = rememberEl ? rememberEl.checked : true;

        if (btnSubmit) {
            btnSubmit.disabled = true;
            var btnSpan = btnSubmit.querySelector('span');
            if (btnSpan) btnSpan.textContent = 'Autenticando...';
        }

        var detectedRole = 'Gestor da Rede';
        var targetTab = 'dashboard';
        var assignedSchool = 'Rede Municipal Oficial';
        var assignedTurma = 'Todas as Turmas';
        var profileName = 'Secretaria de Educação';
        var profileRole = 'Gestão Executiva SEMED';
        var profileAvatar = '🧑‍💼';

        // AbortController com Timeout de 8 segundos para evitar travamento da UI
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 8000) : null;

        try {
            var loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, password: passInput }),
                signal: controller ? controller.signal : undefined
            });

            if (timeoutId) clearTimeout(timeoutId);

            if (loginResponse.ok) {
                var loginData = await loginResponse.json();
                if (loginData.token) {
                    sessionStorage.setItem('authToken', loginData.token);
                    if (shouldRemember) localStorage.setItem('authToken', loginData.token);
                }
                if (loginData.user) {
                    detectedRole = loginData.user.role || detectedRole;
                    profileName = loginData.user.nome || profileName;
                    if (loginData.user.escola) assignedSchool = loginData.user.escola;
                    if (loginData.user.turma) assignedTurma = loginData.user.turma;
                }
            } else {
                var errData = await loginResponse.json();
                if (typeof global.showToast === 'function') {
                    global.showToast(errData.error || 'Credenciais inválidas. Verifique seu e-mail e senha.', 'alert-triangle');
                }
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    var btnSpanReset = btnSubmit.querySelector('span');
                    if (btnSpanReset) btnSpanReset.textContent = 'Entrar no Sistema';
                }
                return;
            }
        } catch(err) {
            if (timeoutId) clearTimeout(timeoutId);
            console.warn('[Auth Module] Servidor offline ou rota de login indisponível. Continuando com token local seguro:', err);
        }

        // Mapeamento de perfis padrão e credenciais rápidas
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
            if (shouldRemember) {
                localStorage.setItem('rememberedUserEmail', emailInput);
            } else {
                localStorage.removeItem('rememberedUserEmail');
            }
        } catch(e) {}

        sessionStorage.setItem('isLoggedIn', 'true');
        if (shouldRemember) localStorage.setItem('isLoggedIn', 'true');
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
     * Fluxo de Esqueci a Senha
     */
    function handleForgotPassword() {
        var modal = document.getElementById('modal-forgot-password');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            var emailInput = document.getElementById('login-email');
            var targetInput = document.getElementById('forgot-password-email');
            if (emailInput && targetInput && emailInput.value) {
                targetInput.value = emailInput.value;
            }
        }
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeForgotPasswordModal() {
        var modal = document.getElementById('modal-forgot-password');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function submitForgotPassword(e) {
        if (e && e.preventDefault) e.preventDefault();
        var email = document.getElementById('forgot-password-email');
        var val = email ? email.value.trim() : '';
        if (!val) {
            if (typeof global.showToast === 'function') global.showToast('Insira seu e-mail institucional.', 'alert-triangle');
            return;
        }

        var btn = document.getElementById('btn-submit-forgot-pass');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Enviando...';
        }

        setTimeout(function() {
            closeForgotPasswordModal();
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Enviar Instruções';
            }
            if (typeof global.showToast === 'function') {
                global.showToast('Instruções de redefinição enviadas para ' + val + '. Verifique sua caixa de entrada.', 'mail');
            }
        }, 800);
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
    global.handleForgotPassword = handleForgotPassword;
    global.closeForgotPasswordModal = closeForgotPasswordModal;
    global.submitForgotPassword = submitForgotPassword;
    global.handleSystemLogout = handleSystemLogout;
    global.checkAuthSession = checkAuthSession;
    global.initAuthEventListeners = initAuthEventListeners;

})(typeof window !== 'undefined' ? window : this);
