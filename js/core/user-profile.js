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

        // 2. Sidebar Footer (Novo Card de Navegação de Perfil)
        var sidebarName = document.getElementById('sidebar-user-name') || document.querySelector('.sidebar-footer .user-name-label') || document.querySelector('.sidebar-footer .user-name');
        var sidebarRole = document.getElementById('sidebar-user-role') || document.querySelector('.sidebar-footer .user-role-label') || document.querySelector('.sidebar-footer .user-role');
        var sidebarAvatar = document.getElementById('sidebar-user-avatar') || document.querySelector('.sidebar-footer .user-avatar-circle') || document.querySelector('.sidebar-footer .avatar');
        
        if (sidebarName) sidebarName.textContent = profile.name || 'Gestor da Rede';
        if (sidebarRole) {
            var displayRole = profile.role || 'Secretaria Exec.';
            sidebarRole.textContent = displayRole + ' · Ver perfil';
        }
        if (sidebarAvatar) {
            if (profile.avatarPhoto) {
                sidebarAvatar.innerHTML = '<img src="' + profile.avatarPhoto + '" alt="' + profile.name + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
            } else {
                var initials = (profile.name || 'GD').trim().split(/\s+/).map(function(w){ return w[0]; }).slice(0,2).join('').toUpperCase();
                sidebarAvatar.textContent = initials || 'GD';
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
        var userRole = (sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'Gestor da Rede').toLowerCase();
        var userEscola = sessionStorage.getItem('userEscola') || localStorage.getItem('userEscola') || '';
        var userTurma = sessionStorage.getItem('userTurma') || localStorage.getItem('userTurma') || '';
        var isTeacher = userRole.includes('professor');
        var isDirector = userRole.includes('diretor');

        // Verificar se há avaliações ou respostas registradas
        var hasEvaluations = false;
        try {
            var savedRespostas = localStorage.getItem('gd_simulado_respostas_db');
            if (savedRespostas && savedRespostas !== '{}' && savedRespostas !== '[]') {
                hasEvaluations = true;
            }
        } catch(e) {}

        // Saudação dinâmica por horário
        var hour = new Date().getHours();
        var greeting = 'Olá';
        if (hour >= 5 && hour < 12) {
            greeting = 'Bom dia';
        } else if (hour >= 12 && hour < 18) {
            greeting = 'Boa tarde';
        } else {
            greeting = 'Boa noite';
        }

        // Data atual formatada em português
        var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        var todayStr = new Date().toLocaleDateString('pt-BR', options);
        var capitalizedToday = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

        var cleanName = profile.name || 'Gestor(a)';
        if (cleanName.includes('Secretaria') || cleanName.includes('SEMED')) {
            cleanName = 'Gestor(a)';
        }

        var avatarContent = profile.avatarPhoto 
            ? '<img src="' + profile.avatarPhoto + '" alt="' + cleanName + '" style="width:100%; height:100%; object-fit:cover;">' 
            : '<div style="width: 100%; height: 100%; background: rgba(255, 255, 255, 0.2); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.05rem;">' + (cleanName ? cleanName.slice(0,2).toUpperCase() : 'SE') + '</div>';

        var teacherAlertHtml = '';
        if (isTeacher && !hasEvaluations) {
            teacherAlertHtml = `
                <div style="margin-top: 16px; padding: 14px 18px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: var(--radius-md); display: flex; align-items: flex-start; gap: 12px; width: 100%; backdrop-filter: blur(6px);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #FFFFFF; color: #1A3D63; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        ⏳
                    </div>
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 3px;">
                            <strong style="font-size: 0.88rem; color: #FFFFFF;">Aguardando Dados da 1ª Avaliação</strong>
                            <span class="badge" style="background: rgba(255, 255, 255, 0.2); color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.3); font-size: 0.65rem; text-transform: uppercase;">Sem dados fictícios</span>
                        </div>
                        <p style="margin: 0; font-size: 0.8rem; color: #E2EEF7; line-height: 1.45;">
                            Seja bem-vindo(a), <strong>${cleanName}</strong>! Os gráficos de proficiência, taxa de acerto por descritores SAEB e mapa de recomposição da sua turma (<strong>${userTurma || '5º Ano A'} — ${userEscola || 'UI JOSE CORREA LIMA'}</strong>) aparecerão aqui automaticamente após o lançamento da <strong>1ª Avaliação</strong>.
                        </p>
                    </div>
                </div>
            `;
        }

        var illustrationSvg = `
            <div class="welcome-banner-illustration" aria-hidden="true">
                <svg width="190" height="100" viewBox="0 0 190 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="ill-board" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" />
                            <stop offset="100%" stop-color="#E2EEF7" stop-opacity="0.88" />
                        </linearGradient>
                        <linearGradient id="ill-bar1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#4A7FA7" />
                            <stop offset="100%" stop-color="#1A3D63" />
                        </linearGradient>
                        <linearGradient id="ill-bar2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#5DE4BD" />
                            <stop offset="100%" stop-color="#059669" />
                        </linearGradient>
                        <linearGradient id="ill-bar3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="#B3CFE5" />
                            <stop offset="100%" stop-color="#4A7FA7" />
                        </linearGradient>
                        <linearGradient id="ill-cap" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stop-color="#0A1931" />
                            <stop offset="100%" stop-color="#1A3D63" />
                        </linearGradient>
                        <filter id="ill-shadow" x="20" y="2" width="130" height="100" filterUnits="userSpaceOnUse">
                            <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0A1931" flood-opacity="0.22" />
                        </filter>
                    </defs>
                    
                    <!-- Prancheta / Painel de Análise de Dados -->
                    <g filter="url(#ill-shadow)">
                        <rect x="35" y="12" width="100" height="80" rx="8" fill="url(#ill-board)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" />
                        <!-- Clipe superior -->
                        <rect x="68" y="7" width="34" height="10" rx="3" fill="#1A3D63" />
                        <circle cx="85" cy="12" r="2" fill="#FFFFFF" />
                        <!-- Linhas de cabeçalho da prancheta -->
                        <rect x="46" y="24" width="40" height="4" rx="2" fill="#1A3D63" fill-opacity="0.8" />
                        <rect x="46" y="31" width="24" height="3" rx="1.5" fill="#4A7FA7" fill-opacity="0.6" />
                        <!-- Linhas de grade -->
                        <line x1="46" y1="72" x2="124" y2="72" stroke="#B3CFE5" stroke-width="1" stroke-dasharray="2 2" />
                        <line x1="46" y1="56" x2="124" y2="56" stroke="#B3CFE5" stroke-width="1" stroke-dasharray="2 2" />
                        <!-- Colunas do Gráfico de Barras -->
                        <rect x="50" y="52" width="11" height="20" rx="2" fill="url(#ill-bar3)" />
                        <rect x="67" y="40" width="11" height="32" rx="2" fill="url(#ill-bar1)" />
                        <rect x="84" y="46" width="11" height="26" rx="2" fill="url(#ill-bar3)" />
                        <rect x="101" y="32" width="11" height="40" rx="2" fill="url(#ill-bar2)" />
                        <!-- Linha de tendência SAEB -->
                        <path d="M 55 48 Q 72 32 90 42 T 107 26" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" />
                        <circle cx="107" cy="26" r="3" fill="#FFFFFF" stroke="#059669" stroke-width="2" />
                    </g>
                    
                    <!-- Capelo / Chapéu de Formatura Flutuante -->
                    <g transform="translate(132, 8)">
                        <polygon points="24,4 44,13 24,22 4,13" fill="url(#ill-cap)" />
                        <polygon points="24,18 40,12 40,18 24,24 8,18 8,12" fill="#0A1931" opacity="0.85" />
                        <circle cx="24, 13" r="1.8" fill="#B3CFE5" />
                        <path d="M 24 13 Q 34 16 38 27" fill="none" stroke="#F6FAFD" stroke-width="1.3" />
                        <circle cx="38" cy="28" r="1.8" fill="#5DE4BD" />
                    </g>
                    
                    <!-- Livro Didático Flutuante -->
                    <g transform="translate(8, 48)">
                        <path d="M 4 18 C 12 15 18 18 18 18 L 18 32 C 18 32 12 29 4 32 Z" fill="#1A3D63" />
                        <path d="M 32 18 C 24 15 18 18 18 18 L 18 32 C 18 32 24 29 32 32 Z" fill="#4A7FA7" />
                        <path d="M 5 16 C 12 13 17 16 17 16 L 17 30 C 17 30 12 27 5 30 Z" fill="#FFFFFF" />
                        <path d="M 31 16 C 24 13 19 16 19 16 L 19 30 C 19 30 24 27 31 30 Z" fill="#F6FAFD" />
                        <path d="M 18 16 L 18 34 L 20 32 L 22 34 L 22 16 Z" fill="#5DE4BD" />
                    </g>
                    
                    <!-- Selo Circular de Aprovação / Meta Batida -->
                    <g transform="translate(138, 52)">
                        <circle cx="16" cy="16" r="14" fill="#FFFFFF" fill-opacity="0.95" stroke="#4A7FA7" stroke-width="1.5" />
                        <circle cx="16" cy="16" r="11" fill="url(#ill-bar2)" />
                        <path d="M 11 16 L 14 19 L 21 12" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    
                    <!-- Elementos de Brilho e Indicadores de Dados -->
                    <g fill="#FFFFFF" opacity="0.85">
                        <polygon points="22,14 23.5,9 25,14 30,15.5 25,17 23.5,22 22,17 17,15.5" />
                        <polygon points="124,5 125,2 126,5 129,6 126,7 125,10 124,7 121,6" />
                        <polygon points="174,45 175,42 176,45 179,46 176,47 175,50 174,47 171,46" />
                    </g>
                </svg>
            </div>
        `;

        banner.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                <div class="welcome-banner-content">
                    <div class="welcome-banner-left">
                        <div class="welcome-user-avatar" onclick="openUserProfileModal();" style="cursor: pointer;" title="Clique para editar dados do perfil">
                            ${avatarContent}
                        </div>
                        <div>
                            <h2 class="welcome-user-title">
                                <span>${greeting}, <span id="welcome-user-display-name">${cleanName}</span> 👋</span>
                            </h2>
                            <p class="welcome-user-description">Acompanhe o desempenho da rede em tempo real</p>
                            <p class="welcome-user-subtitle">
                                <span class="welcome-role-badge">
                                    ${profile.role || 'Master Admin • Administração TI/DPO'}
                                </span>
                                <span style="color: rgba(255, 255, 255, 0.5); font-size: 0.75rem;">•</span>
                                <span style="color: #E2EEF7; font-size: 0.78rem; font-weight: 500;">${capitalizedToday}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                        <div class="welcome-banner-actions">
                            <button type="button" onclick="openUserProfileModal();" class="btn btn-outline" style="font-size: var(--text-sm); height: 38px; display: inline-flex; align-items: center; gap: 6px;">
                                <i data-lucide="user" style="width: 15px; height: 15px;"></i>
                                <span>Meu Perfil</span>
                            </button>
                            ${isTeacher ? `
                                <button type="button" onclick="switchTab('cronograma-habilidades');" class="btn btn-primary" style="font-size: var(--text-sm); height: 38px; display: inline-flex; align-items: center; gap: 6px;">
                                    <i data-lucide="calendar" style="width: 15px; height: 15px;"></i>
                                    <span>Meu Cronograma</span>
                                </button>
                            ` : `
                                <button type="button" onclick="switchTab('sec-criar-avaliacoes');" class="btn btn-primary" style="font-size: var(--text-sm); height: 38px; display: inline-flex; align-items: center; gap: 6px;">
                                    <i data-lucide="plus" style="width: 15px; height: 15px;"></i>
                                    <span>Nova Avaliação</span>
                                </button>
                            `}
                        </div>
                        ${illustrationSvg}
                    </div>
                </div>
                ${teacherAlertHtml}
            </div>
        `;

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
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
