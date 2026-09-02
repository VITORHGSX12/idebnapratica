// =========================================================================
// AUTHENTICATION & SESSION MANAGEMENT MODULE
// Responsabilidade: Autenticação, perfis de acesso, sessão e logout
// =========================================================================

(function(global) {
    'use strict';

    // Diretório Oficial de Usuários Autorizados (carregado via js/data/official_users_directory.js)
    var OFFICIAL_REGISTERED_USERS = global.OFFICIAL_REGISTERED_USERS || [];

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
            btnSubmit.innerHTML = '<span class="login-spinner"></span> <span>Autenticando...</span>';
        }

        var authenticatedUser = null;

        // 1. Autenticação estrita exclusivamente via API do Servidor (/api/auth/login)
        var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 30000) : null;

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
                        btnSubmit.innerHTML = '<span>Entrar no Sistema</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
                    }
                    showForceChangePasswordModal(emailInput, passInput, authenticatedUser);
                    return;
                }
            } else {
                // Erro retornado pelo servidor (ex: 401 Credenciais Inválidas, 429 Rate Limit)
                var errorMessage = (loginData && loginData.error) ? loginData.error : 'Credenciais inválidas. E-mail ou senha incorreta.';
                showLoginErrorAlert(errorMessage);

                if (typeof global.showToast === 'function') {
                    global.showToast(errorMessage, 'alert-triangle');
                }
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<span>Entrar no Sistema</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
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
            var connErr = 'Erro de conexão com o servidor. Verifique sua rede ou contate o suporte.';
            showLoginErrorAlert(connErr);
            if (typeof global.showToast === 'function') {
                global.showToast(connErr, 'alert-triangle');
            }
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<span>Entrar no Sistema</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
            }
            return;
        }

        if (!authenticatedUser) {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<span>Entrar no Sistema</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
            }
            return;
        }

        // Conclui o carregamento do painel principal
        await completeLoginFlow(authenticatedUser, shouldRemember);
    }

    /**
     * Finaliza a inicialização de sessão e exibe o dashboard principal com transição Wipe
     */
    async function completeLoginFlow(authenticatedUser, shouldRemember) {
        if (!authenticatedUser) return;

        var loginScreen = document.getElementById('login-screen');
        var appContainer = document.querySelector('.app-container');
        var btnSubmit = document.getElementById('btn-login-submit');
        var transitionScreen = document.getElementById('login-transition-screen');
        var videoEl = document.getElementById('login-transition-video');
        var progressBar = document.getElementById('login-transition-progress-bar');
        var statusText = document.getElementById('login-transition-status-text');
        var percentText = document.getElementById('login-transition-status-percent');

        // 1. Ativa imediatamente a Tela de Transição / Carregamento
        if (transitionScreen) {
            transitionScreen.classList.remove('hidden', 'wipe-animating', 'wipe-fade-out');
            transitionScreen.style.display = 'flex';
            transitionScreen.style.opacity = '1';
            if (progressBar) progressBar.style.width = '25%';
            if (percentText) percentText.textContent = '25%';
            if (statusText) statusText.textContent = 'Autenticando credenciais institucionais...';

            if (videoEl) {
                try {
                    videoEl.currentTime = 0;
                    var p = videoEl.play();
                    if (p && p.catch) p.catch(function() {});
                } catch(e) {}
            }
        }

        // 2. Oculta o formulário de login por trás e desliga o motor narrativo
        if (loginScreen) {
            loginScreen.style.display = 'none';
            loginScreen.style.pointerEvents = 'none';
            if (typeof global.LoginNarrativeEngine !== 'undefined' && global.LoginNarrativeEngine.stop) {
                global.LoginNarrativeEngine.stop();
            }
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<span>Entrar no Sistema</span> <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';
            }
        }

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

        // Atualização de progresso
        if (progressBar) progressBar.style.width = '60%';
        if (percentText) percentText.textContent = '60%';
        if (statusText) statusText.textContent = 'Sincronizando turmas, matrizes e dados pedagógicos...';

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

        // Renderiza appContainer em background
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

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }

        if (typeof global.initDashboardScrollReveal === 'function') {
            global.initDashboardScrollReveal();
        }

        // Progresso concluído
        if (progressBar) progressBar.style.width = '100%';
        if (percentText) percentText.textContent = '100%';
        if (statusText) statusText.textContent = 'Ambiente pronto! Entrando no sistema...';

        // 3. Intervalo suave para leitura visual + Disparo da Varredura Wipe (280ms)
        await new Promise(function(resolve) { setTimeout(resolve, 850); });

        if (transitionScreen) {
            // Dispara animação de Varredura / Cortina Wipe (280ms)
            transitionScreen.classList.add('wipe-animating', 'wipe-fade-out');

            setTimeout(function() {
                transitionScreen.classList.add('hidden');
                transitionScreen.style.display = 'none';
                transitionScreen.classList.remove('wipe-animating', 'wipe-fade-out');

                if (videoEl) {
                    try { videoEl.pause(); } catch(e) {}
                }

                if (typeof global.showToast === 'function') {
                    global.showToast('Bem-vindo ao IDEB na Prática! Painel ' + detectedRole + ' carregado.', 'check');
                }
                window.scrollTo(0, 0);
            }, 280);
        } else {
            if (typeof global.showToast === 'function') {
                global.showToast('Bem-vindo ao IDEB na Prática! Painel ' + detectedRole + ' carregado.', 'check');
            }
            window.scrollTo(0, 0);
        }
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
     * Exibe o alerta inline de erro de login
     */
    function showLoginErrorAlert(msg) {
        var alertEl = document.getElementById('login-error-alert');
        var textEl = document.getElementById('login-error-text');
        var emailEl = document.getElementById('login-email');
        var passEl = document.getElementById('login-password');

        if (textEl && msg) textEl.textContent = msg;
        if (alertEl) {
            alertEl.classList.remove('hidden');
            alertEl.style.display = 'flex';
        }
        if (passEl) passEl.classList.add('input-error');
        if (emailEl) emailEl.classList.add('input-error');
    }

    /**
     * Limpa o alerta inline de erro e remove bordas de erro
     */
    function clearLoginErrorAlert() {
        var alertEl = document.getElementById('login-error-alert');
        var emailEl = document.getElementById('login-email');
        var passEl = document.getElementById('login-password');

        if (alertEl) {
            alertEl.classList.add('hidden');
            alertEl.style.display = 'none';
        }
        if (passEl) passEl.classList.remove('input-error');
        if (emailEl) emailEl.classList.remove('input-error');
    }

    /**
     * Fluxo de Esqueci a Senha / Suporte Técnico
     */
    function handleForgotPassword() {
        var modal = document.getElementById('modal-forgot-password');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
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

    /**
     * Copia o número de suporte para a área de transferência
     */
    function copySupportPhoneNumber() {
        var phone = '(99) 98528-0205';
        var cleanPhone = '99985280205';
        var btn = document.getElementById('btn-copy-support-phone');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(phone).then(function() {
                if (btn) {
                    var originalHtml = btn.innerHTML;
                    btn.innerHTML = '<span>✓ Copiado!</span>';
                    btn.style.background = '#dcfce7';
                    setTimeout(function() {
                        btn.innerHTML = originalHtml;
                        btn.style.background = 'white';
                    }, 2000);
                }
                if (typeof global.showToast === 'function') {
                    global.showToast('Número do suporte (' + phone + ') copiado com sucesso!', 'check');
                }
            }).catch(function() {
                fallbackCopyText(phone);
            });
        } else {
            fallbackCopyText(phone);
        }
    }

    function fallbackCopyText(text) {
        var textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            if (typeof global.showToast === 'function') {
                global.showToast('Número do suporte (' + text + ') copiado!', 'check');
            }
        } catch (err) {}
        document.body.removeChild(textArea);
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
    global.showLoginErrorAlert = showLoginErrorAlert;
    global.clearLoginErrorAlert = clearLoginErrorAlert;
    global.copySupportPhoneNumber = copySupportPhoneNumber;
    global.handleForgotPassword = handleForgotPassword;
    global.closeForgotPasswordModal = closeForgotPasswordModal;
    global.showForceChangePasswordModal = showForceChangePasswordModal;
    global.closeForceChangePasswordModal = closeForceChangePasswordModal;
    global.cancelForceChangePassword = cancelForceChangePassword;
    global.submitForceChangePassword = submitForceChangePassword;
    global.handleSystemLogout = handleSystemLogout;
    global.checkAuthSession = checkAuthSession;
    global.initAuthEventListeners = initAuthEventListeners;

})(typeof window !== 'undefined' ? window : this);
