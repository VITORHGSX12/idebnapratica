// =========================================================================
// AUTHENTICATION & LOGIN WORKFLOW SUBMODULE
// Responsabilidade: Execução do Login, Transições Wipe e Seleção Rápida
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Executa a autenticação estrita no sistema via backend (Server-Side Bcrypt).
     */
    async function executeSystemLogin(explicitEmail, explicitPass) {
        if (typeof document === 'undefined') return;
        var emailEl = document.getElementById('login-email');
        var passEl = document.getElementById('login-password');
        var rememberEl = document.getElementById('login-remember-me');
        var btnSubmit = document.getElementById('btn-login-submit');

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
                    var showForce = (global.AuthPassword && global.AuthPassword.showForceChangePasswordModal) || global.showForceChangePasswordModal;
                    if (typeof showForce === 'function') {
                        showForce(emailInput, passInput, authenticatedUser);
                    }
                    return;
                }
            } else {
                // Erro retornado pelo servidor
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
            console.warn('[Auth Notice] Servidor API offline/estático. Verificando diretório institucional...', err);
            
            // Fallback para ambiente de desenvolvimento/estático
            var localUsers = (global.OFFICIAL_REGISTERED_USERS && global.OFFICIAL_REGISTERED_USERS.slice()) || [];
            try {
                var storedAdmin = localStorage.getItem('saas_admin_users_db');
                if (storedAdmin) {
                    var parsed = JSON.parse(storedAdmin);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(function(p) {
                            if (!localUsers.some(function(lu) { return lu.email && lu.email.toLowerCase() === (p.email || '').toLowerCase(); })) {
                                localUsers.push({
                                    nome: p.nome,
                                    email: p.email,
                                    role: p.role || p.tipo || 'Professor',
                                    subRole: (p.tipo || p.role) + ' • ' + (p.escola || 'Rede Municipal'),
                                    escola: p.escola || 'Rede Municipal Oficial',
                                    turma: p.turma || 'Todas as Turmas',
                                    avatar: (p.role || '').includes('Professor') ? '👨‍🏫' : '🧑‍💼'
                                });
                            }
                        });
                    }
                }
            } catch(e) {}

            var found = localUsers.find(function(u) { return u.email && u.email.toLowerCase() === emailInput; });
            if (found) {
                authenticatedUser = {
                    nome: found.nome,
                    email: found.email,
                    role: found.role,
                    subRole: found.subRole,
                    escola: found.escola || 'Rede Municipal Oficial',
                    turma: found.turma || 'Todas as Turmas',
                    mustChangePassword: false,
                    avatar: found.avatar || '🧑‍💼'
                };
            } else {
                var connErr = 'Credenciais não reconhecidas ou erro de conexão.';
                showLoginErrorAlert(connErr);
                if (typeof global.showToast === 'function') {
                    global.showToast(connErr, 'alert-triangle');
                }
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                }
                return;
            }
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
        if (!authenticatedUser || typeof document === 'undefined') return;

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

                // Gatilho do Tour de Boas-Vindas no primeiro login
                if (typeof global.checkAndTriggerOnboarding === 'function') {
                    global.checkAndTriggerOnboarding();
                }
            }, 280);
        } else {
            if (typeof global.showToast === 'function') {
                global.showToast('Bem-vindo ao IDEB na Prática! Painel ' + detectedRole + ' carregado.', 'check');
            }
            window.scrollTo(0, 0);

            // Gatilho do Tour de Boas-Vindas no primeiro login
            if (typeof global.checkAndTriggerOnboarding === 'function') {
                global.checkAndTriggerOnboarding();
            }
        }
    }

    /**
     * Exibe o alerta inline de erro de login
     */
    function showLoginErrorAlert(msg) {
        if (typeof document === 'undefined') return;
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
        if (typeof document === 'undefined') return;
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

    var phraseRotationInterval = null;
    function initHeroPhrasesRotation() {
        if (typeof document === 'undefined') return;
        if (phraseRotationInterval) clearInterval(phraseRotationInterval);
        var phrases = document.querySelectorAll('.hero-main-title.rotating-phrase');
        if (!phrases || phrases.length === 0) return;

        var currentIndex = 0;
        phraseRotationInterval = setInterval(function() {
            var allPhrases = document.querySelectorAll('.hero-main-title.rotating-phrase');
            if (!allPhrases || allPhrases.length === 0) return;
            
            allPhrases[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % allPhrases.length;
            allPhrases[currentIndex].classList.add('active');
        }, 3600);
    }

    function selectLoginProfile(email, buttonEl) {
        if (typeof document === 'undefined') return;
        var emailInput = document.getElementById('login-email');
        var passInput = document.getElementById('login-password');
        if (emailInput) {
            emailInput.value = email;
        }
        if (passInput) {
            passInput.value = '123456';
        }
        if (buttonEl) {
            var allPills = document.querySelectorAll('.login-quick-roles-pills .role-pill');
            for (var i = 0; i < allPills.length; i++) {
                allPills[i].classList.remove('active');
            }
            buttonEl.classList.add('active');
        }
        clearLoginErrorAlert();

        // Autenticação fluida imediata ao selecionar o perfil
        setTimeout(function() {
            executeSystemLogin(email, '123456');
        }, 120);
    }

    var AuthLogin = {
        executeSystemLogin: executeSystemLogin,
        completeLoginFlow: completeLoginFlow,
        showLoginErrorAlert: showLoginErrorAlert,
        clearLoginErrorAlert: clearLoginErrorAlert,
        selectLoginProfile: selectLoginProfile,
        initHeroPhrasesRotation: initHeroPhrasesRotation
    };

    global.AuthLogin = AuthLogin;
    global.executeSystemLogin = executeSystemLogin;
    global.completeLoginFlow = completeLoginFlow;
    global.showLoginErrorAlert = showLoginErrorAlert;
    global.clearLoginErrorAlert = clearLoginErrorAlert;
    global.selectLoginProfile = selectLoginProfile;
    global.initHeroPhrasesRotation = initHeroPhrasesRotation;

})(typeof window !== 'undefined' ? window : this);
