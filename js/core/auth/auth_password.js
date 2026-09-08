// =========================================================================
// AUTHENTICATION & PASSWORD RECOVERY SUBMODULE
// Responsabilidade: Troca obrigatória de senha e suporte / esqueci a senha
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Exibe o modal de troca obrigatória de senha
     */
    function showForceChangePasswordModal(email, currentPass, user) {
        if (typeof document === 'undefined') return;
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
        if (typeof document === 'undefined') return;
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
        if (typeof document === 'undefined') return;

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
                var completeFlow = (global.AuthLogin && global.AuthLogin.completeLoginFlow) || global.completeLoginFlow;
                if (typeof completeFlow === 'function') {
                    await completeFlow(userData, true);
                }

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
     * Fluxo de Esqueci a Senha / Suporte Técnico
     */
    function handleForgotPassword() {
        if (typeof document === 'undefined') return;
        var modal = document.getElementById('modal-forgot-password');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
        }
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeForgotPasswordModal() {
        if (typeof document === 'undefined') return;
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
        var btn = typeof document !== 'undefined' ? document.getElementById('btn-copy-support-phone') : null;

        var nav = (typeof window !== 'undefined' && window.navigator) ? window.navigator : (typeof navigator !== 'undefined' ? navigator : null);
        if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
            nav.clipboard.writeText(phone).then(function() {
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
        if (typeof document === 'undefined') return;
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

    var AuthPassword = {
        showForceChangePasswordModal: showForceChangePasswordModal,
        closeForceChangePasswordModal: closeForceChangePasswordModal,
        cancelForceChangePassword: cancelForceChangePassword,
        submitForceChangePassword: submitForceChangePassword,
        handleForgotPassword: handleForgotPassword,
        closeForgotPasswordModal: closeForgotPasswordModal,
        copySupportPhoneNumber: copySupportPhoneNumber,
        fallbackCopyText: fallbackCopyText
    };

    global.AuthPassword = AuthPassword;
    global.showForceChangePasswordModal = showForceChangePasswordModal;
    global.closeForceChangePasswordModal = closeForceChangePasswordModal;
    global.cancelForceChangePassword = cancelForceChangePassword;
    global.submitForceChangePassword = submitForceChangePassword;
    global.handleForgotPassword = handleForgotPassword;
    global.closeForgotPasswordModal = closeForgotPasswordModal;
    global.copySupportPhoneNumber = copySupportPhoneNumber;

})(typeof window !== 'undefined' ? window : this);
