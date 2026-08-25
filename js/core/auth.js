// =========================================================================
// AUTHENTICATION & SESSION MANAGEMENT MODULE
// Responsabilidade: Autenticação, perfis de acesso, sessão e logout
// =========================================================================

(function(global) {
    'use strict';

    // Diretório Oficial de Usuários Autorizados (Metadados Institucionais - Sem Senhas no Cliente)
    var OFFICIAL_REGISTERED_USERS = [
        {
            email: 'semed@goncalvesdias.ma.gov.br',
            nome: 'Secretaria Municipal de Educação',
            role: 'Gestor da Rede',
            subRole: 'Gestão Executiva SEMED',
            escola: 'Rede Municipal Oficial',
            turma: 'Todas as Turmas',
            avatar: '🧑‍💼'
        },
        {
            email: 'admin@goncalvesdias.ma.gov.br',
            nome: 'Administrador TI / DPO',
            role: 'Master Admin',
            subRole: 'Administrador(a) do Sistema & TI',
            escola: 'Administração TI / DPO',
            turma: 'Todas as Redes',
            avatar: '👨‍💻'
        },
        {
            email: 'diretor@goncalvesdias.ma.gov.br',
            nome: 'Profa. Antonia Silva (Diretora)',
            role: 'Diretor Escola',
            subRole: 'Diretora Escolar • UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.correa@goncalvesdias.ma.gov.br',
            nome: 'Direção UI José Corrêa Lima',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.benta@goncalvesdias.ma.gov.br',
            nome: 'Direção UE Benta Vilanova',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UNIDADE ESCOLAR BENTA VILANOVA',
            escola: 'UNIDADE ESCOLAR BENTA VILANOVA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.veloso@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Raimundo Veloso Barros',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI RAIMUNDO VELOSO BARROS',
            escola: 'UI RAIMUNDO VELOSO BARROS',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.afonso@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Afonso Pena',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UNIDADE INTEGRADA AFONSO PENA',
            escola: 'UNIDADE INTEGRADA AFONSO PENA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.diogo@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Gov Diogo Nogueira',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI GOV DIOGO NOGUEIRA',
            escola: 'UI GOV DIOGO NOGUEIRA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.deocleciano@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Deocleciano F. Braga',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI DEOCLECIANO FERREIRA BRAGA',
            escola: 'UI DEOCLECIANO FERREIRA BRAGA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.nonato@goncalvesdias.ma.gov.br',
            nome: 'Direção UI Nonato Araújo',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • UI NONATO ARAUJO',
            escola: 'UI NONATO ARAUJO',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.saovicente@goncalvesdias.ma.gov.br',
            nome: 'Direção EM São Vicente de Paula',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • EM SAO VICENTE DE PAULA',
            escola: 'EM SAO VICENTE DE PAULA',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'diretor.santoantonio@goncalvesdias.ma.gov.br',
            nome: 'Direção EM Santo Antônio',
            role: 'Diretor Escola',
            subRole: 'Direção Escolar • EM SANTO ANTONIO',
            escola: 'EM SANTO ANTONIO',
            turma: 'Todas as Turmas',
            avatar: '👩‍💼'
        },
        {
            email: 'professor@goncalvesdias.ma.gov.br',
            nome: 'Prof. Carlos Eduardo (Docente)',
            role: 'Professor',
            subRole: 'Professor(a) • 5º Ano A',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            avatar: '👨‍🏫'
        },
        {
            email: 'prof.2ano@goncalvesdias.ma.gov.br',
            nome: 'Profª. Ana Lúcia (Alfabetização)',
            role: 'Professor',
            subRole: 'Professor(a) • 2º Ano Alfabetização',
            escola: 'UI JOSE CORREA LIMA',
            turma: '2º Ano A',
            avatar: '👩‍🏫'
        },
        {
            email: 'prof.5ano@goncalvesdias.ma.gov.br',
            nome: 'Prof. Carlos Eduardo (5º Ano)',
            role: 'Professor',
            subRole: 'Professor(a) • 5º Ano Fundamental I',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            avatar: '👨‍🏫'
        },
        {
            email: 'prof.9ano@goncalvesdias.ma.gov.br',
            nome: 'Profª. Juliana Silva (9º Ano)',
            role: 'Professor',
            subRole: 'Professor(a) • 9º Ano Fundamental II',
            escola: 'UI JOSE CORREA LIMA',
            turma: '9º Ano A',
            avatar: '👩‍🏫'
        }
    ];

    global.OFFICIAL_REGISTERED_USERS = OFFICIAL_REGISTERED_USERS;

    /**
     * Executa a autenticação estrita no sistema via backend (Server-Side Bcrypt).
     */
    async function executeSystemLogin(explicitEmail, explicitPass) {
        var emailEl = document.getElementById('login-email');
        var passEl = document.getElementById('login-password');
        var rememberEl = document.getElementById('login-remember-me');
        var btnSubmit = document.getElementById('btn-login-submit');
        var loginScreen = document.getElementById('login-screen');
        var appContainer = document.querySelector('.app-container');

        var emailInput = (explicitEmail || (emailEl ? emailEl.value : '')).trim().toLowerCase();
        var passInput = (explicitPass !== undefined && explicitPass !== null ? explicitPass : (passEl ? passEl.value : '')).trim();
        var shouldRemember = rememberEl ? rememberEl.checked : true;

        if (!emailInput || !passInput) {
            if (typeof global.showToast === 'function') {
                global.showToast('Por favor, informe seu e-mail institucional e senha.', 'alert-triangle');
            }
            if (emailEl && !emailInput) emailEl.focus();
            else if (passEl) passEl.focus();
            return;
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            var btnSpan = btnSubmit.querySelector('span');
            if (btnSpan) btnSpan.textContent = 'Autenticando...';
        }

        var authenticatedUser = null;

        // 1. Autenticação estrita exclusivamente via API do Servidor (/api/auth/login)
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 6000) : null;

        try {
            var loginResponse = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, password: passInput }),
                signal: controller ? controller.signal : undefined
            });

            if (timeoutId) clearTimeout(timeoutId);

            var loginData = null;
            try {
                loginData = await loginResponse.json();
            } catch(e) {}

            if (loginResponse.ok && loginData && loginData.success) {
                if (loginData.token) {
                    sessionStorage.setItem('authToken', loginData.token);
                    if (shouldRemember) localStorage.setItem('authToken', loginData.token);
                }

                if (loginData.user) {
                    authenticatedUser = {
                        nome: loginData.user.nome,
                        email: loginData.user.email,
                        role: loginData.user.role,
                        subRole: loginData.user.role + (loginData.user.escola ? ' • ' + loginData.user.escola : ''),
                        escola: loginData.user.escola || 'Rede Municipal Oficial',
                        turma: loginData.user.turma || 'Todas as Turmas',
                        mustChangePassword: !!loginData.user.mustChangePassword,
                        avatar: loginData.user.role === 'Professor' ? '👨‍🏫' : (loginData.user.role === 'Master Admin' ? '👨‍💻' : '🧑‍💼')
                    };
                }

                // 2. Se exigir troca obrigatória de senha (primeiro acesso / senha temporária)
                if (loginData.requirePasswordChange || (loginData.user && loginData.user.mustChangePassword)) {
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        var btnSpanOk = btnSubmit.querySelector('span');
                        if (btnSpanOk) btnSpanOk.textContent = 'Entrar no Sistema';
                    }
                    showForceChangePasswordModal(emailInput, passInput, authenticatedUser);
                    return;
                }
            } else {
                // Erro retornado pelo servidor (ex: 401 Credenciais Inválidas, 429 Rate Limit)
                var errorMessage = (loginData && loginData.error) ? loginData.error : 'Credenciais inválidas. Verifique seu e-mail e senha.';
                if (typeof global.showToast === 'function') {
                    global.showToast(errorMessage, 'alert-triangle');
                }
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    var btnSpanReset = btnSubmit.querySelector('span');
                    if (btnSpanReset) btnSpanReset.textContent = 'Entrar no Sistema';
                }
                if (passEl) {
                    passEl.value = '';
                    passEl.focus();
                }
                return;
            }
        } catch(err) {
            if (timeoutId) clearTimeout(timeoutId);
            console.error('[Auth Error]', err);
            if (typeof global.showToast === 'function') {
                global.showToast('Erro de conexão com o servidor. Verifique sua rede e tente novamente.', 'alert-triangle');
            }
            if (btnSubmit) {
                btnSubmit.disabled = false;
                var btnSpanErr = btnSubmit.querySelector('span');
                if (btnSpanErr) btnSpanErr.textContent = 'Entrar no Sistema';
            }
            return;
        }

        if (!authenticatedUser) {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                var btnSpanReset2 = btnSubmit.querySelector('span');
                if (btnSpanReset2) btnSpanReset2.textContent = 'Entrar no Sistema';
            }
            return;
        }

        // Conclui o carregamento do painel principal
        await completeLoginFlow(authenticatedUser, shouldRemember);
    }

    /**
     * Finaliza a inicialização de sessão e exibe o dashboard principal
     */
    async function completeLoginFlow(authenticatedUser, shouldRemember) {
        if (!authenticatedUser) return;

        var loginScreen = document.getElementById('login-screen');
        var appContainer = document.querySelector('.app-container');
        var btnSubmit = document.getElementById('btn-login-submit');

        var emailInput = authenticatedUser.email || '';
        var detectedRole = authenticatedUser.role || 'Gestor da Rede';
        var targetTab = 'dashboard';
        var assignedSchool = authenticatedUser.escola || 'Rede Municipal Oficial';
        var assignedTurma = authenticatedUser.turma || 'Todas as Turmas';
        var profileName = authenticatedUser.nome || 'Usuário SEMED';
        var profileRole = authenticatedUser.subRole || detectedRole;
        var profileAvatar = authenticatedUser.avatar || '🧑‍💼';

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
     * Exibe o modal de troca obrigatória de senha
     */
    function showForceChangePasswordModal(email, currentPass, user) {
        var modal = document.getElementById('modal-force-change-password');
        var emailInput = document.getElementById('force-change-email');
        var currentPassInput = document.getElementById('force-change-current-pass');
        var newPassInput = document.getElementById('force-change-new-pass');
        var confirmPassInput = document.getElementById('force-change-confirm-pass');

        if (emailInput) emailInput.value = email || '';
        if (currentPassInput) currentPassInput.value = currentPass || '';
        if (newPassInput) newPassInput.value = '';
        if (confirmPassInput) confirmPassInput.value = '';

        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }

        if (newPassInput) newPassInput.focus();

        if (typeof global.showToast === 'function') {
            global.showToast('Primeiro acesso: É obrigatório cadastrar uma nova senha pessoal.', 'alert-triangle');
        }
    }

    function closeForceChangePasswordModal() {
        var modal = document.getElementById('modal-force-change-password');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function cancelForceChangePassword() {
        closeForceChangePasswordModal();
        try {
            sessionStorage.clear();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('authToken');
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
            global.showToast('Troca de senha cancelada. Efetue o login novamente quando desejar.', 'info');
        }
    }

    async function submitForceChangePassword(e) {
        if (e && e.preventDefault) e.preventDefault();

        var emailEl = document.getElementById('force-change-email');
        var currentPassEl = document.getElementById('force-change-current-pass');
        var newPassEl = document.getElementById('force-change-new-pass');
        var confirmPassEl = document.getElementById('force-change-confirm-pass');
        var btnSubmit = document.getElementById('btn-submit-force-change');

        var email = (emailEl ? emailEl.value : '').trim().toLowerCase();
        var currentPassword = (currentPassEl ? currentPassEl.value : '').trim();
        var newPassword = (newPassEl ? newPassEl.value : '').trim();
        var confirmPassword = (confirmPassEl ? confirmPassEl.value : '').trim();

        if (!currentPassword || !newPassword || !confirmPassword) {
            if (typeof global.showToast === 'function') global.showToast('Preencha todos os campos da troca de senha.', 'alert-triangle');
            return;
        }

        if (newPassword !== confirmPassword) {
            if (typeof global.showToast === 'function') global.showToast('A nova senha e a confirmação não conferem.', 'alert-triangle');
            if (confirmPassEl) confirmPassEl.focus();
            return;
        }

        if (newPassword === currentPassword) {
            if (typeof global.showToast === 'function') global.showToast('A nova senha deve ser diferente da senha temporária.', 'alert-triangle');
            if (newPassEl) newPassEl.focus();
            return;
        }

        if (newPassword.length < 10) {
            if (typeof global.showToast === 'function') global.showToast('A nova senha deve ter no mínimo 10 caracteres.', 'alert-triangle');
            if (newPassEl) newPassEl.focus();
            return;
        }

        if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            if (typeof global.showToast === 'function') global.showToast('A senha precisa conter maiúsculas, minúsculas e números.', 'alert-triangle');
            if (newPassEl) newPassEl.focus();
            return;
        }

        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<span>Salvando nova senha...</span>';
        }

        try {
            var authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
            var res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authToken ? 'Bearer ' + authToken : ''
                },
                body: JSON.stringify({ email: email, currentPassword: currentPassword, newPassword: newPassword })
            });

            var data = await res.json();

            if (res.ok && data.success) {
                if (data.token) {
                    sessionStorage.setItem('authToken', data.token);
                    localStorage.setItem('authToken', data.token);
                }

                closeForceChangePasswordModal();

                if (typeof global.showToast === 'function') {
                    global.showToast('Senha atualizada com sucesso! Acessando o sistema...', 'check');
                }

                var userData = data.user || { email: email };
                await completeLoginFlow(userData, true);

            } else {
                var msg = data.error || 'Erro ao alterar a senha.';
                if (typeof global.showToast === 'function') global.showToast(msg, 'alert-triangle');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<span>Salvar Nova Senha e Acessar</span>';
                }
            }
        } catch(err) {
            console.error('[Change Password Error]', err);
            if (typeof global.showToast === 'function') global.showToast('Erro de conexão ao salvar nova senha.', 'alert-triangle');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<span>Salvar Nova Senha e Acessar</span>';
            }
        }
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
    global.showForceChangePasswordModal = showForceChangePasswordModal;
    global.closeForceChangePasswordModal = closeForceChangePasswordModal;
    global.cancelForceChangePassword = cancelForceChangePassword;
    global.submitForceChangePassword = submitForceChangePassword;
    global.handleSystemLogout = handleSystemLogout;
    global.checkAuthSession = checkAuthSession;
    global.initAuthEventListeners = initAuthEventListeners;

})(typeof window !== 'undefined' ? window : this);
