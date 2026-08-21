// =========================================================================
// USER PROFILE MANAGEMENT MODULE
// Responsabilidade: Gestão de perfil, avatar, dados de sessão e boas-vindas
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY_USER_PROFILE = 'gd_current_user_profile';
    var selectedProfileIcon = '🧑‍💼';

    /**
     * Obtém o perfil atual do usuário logado com fallbacks inteligentes por e-mail
     * @returns {Object} { name, email, role, avatarIcon, avatarPhoto }
     */
    function getCurrentUserProfile() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY_USER_PROFILE);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch(e) {}

        var userEmail = (typeof localStorage !== 'undefined' ? localStorage.getItem('userEmail') : null) || 'semed@goncalvesdias.ma.gov.br';
        var defaultName = 'Gestor da Rede';
        var defaultRole = 'Gestor(a) da Rede';
        var defaultAvatar = '🧑‍💼';

        if (userEmail.includes('prof')) {
            defaultName = 'Prof. Carlos Eduardo';
            defaultRole = 'Professor(a)';
            defaultAvatar = '👨‍🏫';
        } else if (userEmail.includes('diretor')) {
            defaultName = 'Profa. Antonia Silva';
            defaultRole = 'Diretor(a) Escolar';
            defaultAvatar = '👩‍💼';
        } else if (userEmail.includes('admin')) {
            defaultName = 'Administrador do Sistema';
            defaultRole = 'Administrador(a) do Sistema';
            defaultAvatar = '👨‍💻';
        }

        return {
            name: defaultName,
            email: userEmail,
            role: defaultRole,
            avatarIcon: defaultAvatar,
            avatarPhoto: ''
        };
    }

    /**
     * Persiste as alterações do perfil do usuário e reage na interface
     * @param {Object} profileData 
     */
    function saveCurrentUserProfile(profileData) {
        try {
            localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profileData));
            sessionStorage.setItem('userName', profileData.name);
            sessionStorage.setItem('userEmail', profileData.email);
            sessionStorage.setItem('userRole', profileData.role);
        } catch(e) {}

        // Atualizar todos os elementos reativos na interface
        updateUserHeaderUI();
        renderDashboardWelcomeBanner();
    }

    /**
     * Atualiza as informações visuais no Header e no rodapé da Sidebar
     */
    function updateUserHeaderUI() {
        var profile = getCurrentUserProfile();
        
        // 1. Header do Topo (Navbar)
        var headerName = document.getElementById('header-user-name');
        var headerAvatar = document.getElementById('header-user-avatar');
        if (headerName) headerName.textContent = profile.name;
        if (headerAvatar) {
            if (profile.avatarPhoto) {
                headerAvatar.innerHTML = '<img src="' + profile.avatarPhoto + '" alt="' + profile.name + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
            } else {
                headerAvatar.innerHTML = profile.avatarIcon || '🧑‍💼';
            }
        }

        // 2. Sidebar Footer
        var sidebarName = document.querySelector('.sidebar-footer .user-name');
        var sidebarRole = document.querySelector('.sidebar-footer .user-role');
        var sidebarAvatar = document.querySelector('.sidebar-footer .avatar');
        if (sidebarName) sidebarName.textContent = profile.name;
        if (sidebarRole) sidebarRole.textContent = profile.role;
        if (sidebarAvatar) {
            if (profile.avatarPhoto) {
                sidebarAvatar.innerHTML = '<img src="' + profile.avatarPhoto + '" alt="' + profile.name + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
            } else {
                sidebarAvatar.textContent = profile.avatarIcon || (profile.name.substring(0, 2).toUpperCase());
            }
        }
    }

    /**
     * Renderiza o Banner de Boas-vindas personalizado no Dashboard
     */
    function renderDashboardWelcomeBanner() {
        var banner = document.getElementById('dashboard-welcome-banner');
        if (!banner) return;

        var profile = getCurrentUserProfile();

        // Saudação dinâmica por horário
        var hour = new Date().getHours();
        var greeting = 'Olá';
        var emojiGreeting = '👋';
        if (hour >= 5 && hour < 12) {
            greeting = 'Bom dia';
            emojiGreeting = '☀️';
        } else if (hour >= 12 && hour < 18) {
            greeting = 'Boa tarde';
            emojiGreeting = '🌤️';
        } else {
            greeting = 'Boa noite';
            emojiGreeting = '🌙';
        }

        // Data atual formatada em português
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var todayStr = new Date().toLocaleDateString('pt-BR', options);
        var capitalizedToday = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

        var avatarContent = profile.avatarPhoto 
            ? '<img src="' + profile.avatarPhoto + '" alt="' + profile.name + '">' 
            : '<span>' + (profile.avatarIcon || '🧑‍💼') + '</span>';

        banner.innerHTML = `
            <div class="welcome-banner-left">
                <div class="welcome-user-avatar" onclick="openUserProfileModal();" style="cursor: pointer;" title="Clique para editar seu avatar e dados">
                    ${avatarContent}
                </div>
                <div>
                    <h2 class="welcome-user-title">
                        <span>${greeting}, <span id="welcome-user-display-name" style="color: #6366f1;">${profile.name}</span>!</span>
                        <span>${emojiGreeting}</span>
                    </h2>
                    <p class="welcome-user-subtitle">
                        <span style="font-weight: 700; color: #6366f1; background: rgba(99, 102, 241, 0.1); padding: 2px 8px; border-radius: 10px; font-size: 0.74rem;">
                            ● ${profile.role}
                        </span>
                        <span>•</span>
                        <span>${capitalizedToday}</span>
                        <span>•</span>
                        <span style="color: var(--text-muted);">SEMED Gonçalves Dias - MA</span>
                    </p>
                </div>
            </div>
            <div class="welcome-banner-actions">
                <button type="button" onclick="openUserProfileModal();" class="btn btn-outline btn-sm" style="font-size: 0.8rem; font-weight: 700; background: var(--bg-secondary); border-color: var(--border-color); color: var(--text-primary); display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; cursor: pointer; box-shadow: 0 2px 6px rgba(0,0,0,0.04);">
                    <span>👤 Meu Perfil</span>
                </button>
                <button type="button" onclick="switchTab('sec-criar-avaliacoes');" class="btn btn-primary btn-sm" style="font-size: 0.8rem; font-weight: 700; background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);">
                    <span>+ Nova Avaliação</span>
                </button>
            </div>
        `;
    }

    /**
     * Abre o Modal de Edição do Perfil do Usuário
     */
    function openUserProfileModal() {
        var modal = document.getElementById('modal-user-profile');
        if (!modal) return;

        var profile = getCurrentUserProfile();
        selectedProfileIcon = profile.avatarIcon || '🧑‍💼';

        var elName = document.getElementById('profile-input-name');
        var elEmail = document.getElementById('profile-input-email');
        var elRole = document.getElementById('profile-input-role');
        var elPhoto = document.getElementById('profile-input-photo-url');
        var preview = document.getElementById('profile-avatar-preview');

        if (elName) elName.value = profile.name || '';
        if (elEmail) elEmail.value = profile.email || '';
        if (elRole) elRole.value = profile.role || 'Gestor(a) da Rede';
        if (elPhoto) elPhoto.value = profile.avatarPhoto || '';

        if (preview) {
            if (profile.avatarPhoto) {
                preview.innerHTML = '<img src="' + profile.avatarPhoto + '" alt="' + profile.name + '" style="width:100%; height:100%; object-fit:cover;">';
            } else {
                preview.innerHTML = selectedProfileIcon;
            }
        }

        // Marcar botão de emoji ativo
        document.querySelectorAll('.avatar-option-btn').forEach(function(btn) {
            if (btn.getAttribute('data-icon') === selectedProfileIcon) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    /**
     * Fecha o Modal de Edição de Perfil
     */
    function closeUserProfileModal() {
        var modal = document.getElementById('modal-user-profile');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    /**
     * Seleciona um ícone/emoji para o avatar do usuário
     * @param {string} icon 
     * @param {HTMLElement} btnEl 
     */
    function selectProfileAvatar(icon, btnEl) {
        selectedProfileIcon = icon;
        document.querySelectorAll('.avatar-option-btn').forEach(function(btn) {
            btn.classList.remove('active');
        });
        if (btnEl) btnEl.classList.add('active');

        var elPhoto = document.getElementById('profile-input-photo-url');
        if (elPhoto) elPhoto.value = '';

        var preview = document.getElementById('profile-avatar-preview');
        if (preview) preview.innerHTML = icon;
    }

    /**
     * Pré-visualiza uma foto a partir de URL informada
     * @param {string} url 
     */
    function previewProfilePhotoUrl(url) {
        var preview = document.getElementById('profile-avatar-preview');
        if (!preview) return;
        var trimmed = (url || '').trim();
        if (trimmed) {
            preview.innerHTML = '<img src="' + trimmed + '" alt="Preview" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.parentElement.innerHTML=\'' + selectedProfileIcon + '\';">';
        } else {
            preview.innerHTML = selectedProfileIcon;
        }
    }

    /**
     * Trata o submit do formulário de perfil do usuário
     * @param {Event} event 
     */
    function handleSaveUserProfile(event) {
        if (event) event.preventDefault();

        var elName = document.getElementById('profile-input-name');
        var elEmail = document.getElementById('profile-input-email');
        var elRole = document.getElementById('profile-input-role');
        var elPhoto = document.getElementById('profile-input-photo-url');

        var nameVal = elName ? elName.value.trim() : '';
        var emailVal = elEmail ? elEmail.value.trim() : '';
        var roleVal = elRole ? elRole.value : '';
        var photoVal = elPhoto ? elPhoto.value.trim() : '';

        if (!nameVal) {
            var err = document.getElementById('err-profile-name');
            if (err) err.style.display = 'block';
            return;
        }

        var profileData = {
            name: nameVal,
            email: emailVal || 'semed@goncalvesdias.ma.gov.br',
            role: roleVal || 'Gestor(a) da Rede',
            avatarIcon: selectedProfileIcon || '🧑‍💼',
            avatarPhoto: photoVal || ''
        };

        saveCurrentUserProfile(profileData);
        closeUserProfileModal();

        if (typeof global.showToast === 'function') {
            global.showToast('Perfil de "' + nameVal + '" salvo com sucesso!', 'check');
        }
    }

    // Exposição global
    global.STORAGE_KEY_USER_PROFILE = STORAGE_KEY_USER_PROFILE;
    global.getCurrentUserProfile = getCurrentUserProfile;
    global.saveCurrentUserProfile = saveCurrentUserProfile;
    global.updateUserHeaderUI = updateUserHeaderUI;
    global.renderDashboardWelcomeBanner = renderDashboardWelcomeBanner;
    global.openUserProfileModal = openUserProfileModal;
    global.closeUserProfileModal = closeUserProfileModal;
    global.selectProfileAvatar = selectProfileAvatar;
    global.previewProfilePhotoUrl = previewProfilePhotoUrl;
    global.handleSaveUserProfile = handleSaveUserProfile;

})(typeof window !== 'undefined' ? window : this);
