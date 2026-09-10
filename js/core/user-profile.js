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

    var AVAILABLE_SYSTEM_VISIONS = [
        {
            role: 'Master Admin',
            title: 'Gestor da Rede (Master Admin)',
            desc: 'Visão executiva da SEMED. Acesso irrestrito a todas as escolas, turmas, matrizes e painel administrativo.',
            icon: '👑',
            badgeClass: 'badge-blue',
            scope: 'Rede Municipal SEMED',
            escola: '',
            turma: ''
        },
        {
            role: 'Diretor Escola',
            title: 'Direção & Coordenação Escolar',
            desc: 'Gestão integrada da Unidade Escolar UI José Corrêa Lima. Acompanhamento de metas do PDE, matrizes pedagógicas, simulados e turmas.',
            icon: '🏫',
            badgeClass: 'badge-purple',
            scope: 'UI José Corrêa Lima',
            escola: 'UI JOSE CORREA LIMA',
            turma: ''
        },
        {
            role: 'Professor',
            title: 'Professor(a) Regente',
            desc: 'Diário de classe, planejamento semanal, banco de questões e lançamento de notas da turma.',
            icon: '👨‍🏫',
            badgeClass: 'badge-amber',
            scope: '2º Ano A - Matutino',
            escola: 'UI JOSE CORREA LIMA',
            turma: '2º Ano A'
        }
    ];

    /**
     * Retorna todos os perfis vinculados ao usuário na sessão
     * @returns {Array<string>}
     */
    function getUserPerfis() {
        try {
            var raw = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userPerfis')) ||
                      (typeof localStorage !== 'undefined' && localStorage.getItem('userPerfis'));
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}
        return ['Master Admin', 'Diretor Escola', 'Professor'];
    }

    /**
     * Renderiza dinamicamente o botão de visão ativa na sidebar e o dropdown compacto
     */
    function renderSidebarProfileSwitcher() {
        if (typeof document === 'undefined') return;
        var activeRole = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userRole')) ||
                         (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) || 'Master Admin';

        var currentVision = AVAILABLE_SYSTEM_VISIONS.find(function(v) {
            var isCoordOrDirector = (v.role === 'Diretor Escola' && (activeRole.toLowerCase().includes('diretor') || activeRole.toLowerCase().includes('coordenador')));
            return isCoordOrDirector || v.role.toLowerCase() === activeRole.toLowerCase() || activeRole.toLowerCase().includes(v.role.toLowerCase());
        }) || AVAILABLE_SYSTEM_VISIONS[0];

        // Atualiza botão da visão atual na sidebar
        var iconEl = document.getElementById('sidebar-vision-current-icon');
        var titleEl = document.getElementById('sidebar-vision-current-title');
        var scopeEl = document.getElementById('sidebar-vision-current-scope');

        if (iconEl) iconEl.textContent = currentVision.icon;
        if (titleEl) titleEl.textContent = currentVision.title;
        if (scopeEl) scopeEl.textContent = currentVision.scope;

        renderVisionDropdownMenu();
    }

    /**
     * Renderiza os itens compactos do dropdown popover
     */
    function renderVisionDropdownMenu() {
        var menuEl = document.getElementById('vision-dropdown-menu');
        if (!menuEl) return;

        var activeRole = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userRole')) ||
                         (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) || 'Master Admin';

        menuEl.innerHTML = AVAILABLE_SYSTEM_VISIONS.map(function(v) {
            var isCoordOrDirector = (v.role === 'Diretor Escola' && (activeRole.toLowerCase().includes('diretor') || activeRole.toLowerCase().includes('coordenador')));
            var isActive = (v.role.toLowerCase() === activeRole.toLowerCase() || isCoordOrDirector || activeRole.toLowerCase().includes(v.role.toLowerCase()));

            return '<button type="button" class="vision-dropdown-item ' + (isActive ? 'active' : '') + '" onclick="selectVisionRole(\'' + v.role + '\');" role="menuitem">' +
                '<span class="vision-item-icon">' + v.icon + '</span>' +
                '<span class="vision-item-info">' +
                    '<span class="vision-item-title">' + v.title + '</span>' +
                    '<span class="vision-item-scope">' + v.scope + '</span>' +
                '</span>' +
                (isActive ? '<span class="vision-item-check" title="Visão em uso">✓</span>' : '') +
            '</button>';
        }).join('');
    }

    /**
     * Alterna a abertura / fechamento do dropdown popover compacto
     */
    function toggleVisionDropdown(event) {
        if (event && typeof event.stopPropagation === 'function') {
            event.stopPropagation();
        }
        var menuEl = document.getElementById('vision-dropdown-menu');
        var btnEl = document.getElementById('btn-toggle-vision-dropdown');
        if (!menuEl) return;

        var isHidden = menuEl.classList.contains('hidden');
        if (isHidden) {
            renderVisionDropdownMenu();
            menuEl.classList.remove('hidden');
            if (btnEl) btnEl.setAttribute('aria-expanded', 'true');
        } else {
            closeVisionDropdown();
        }
    }

    /**
     * Fecha o dropdown popover compacto
     */
    function closeVisionDropdown() {
        var menuEl = document.getElementById('vision-dropdown-menu');
        var btnEl = document.getElementById('btn-toggle-vision-dropdown');
        if (menuEl) {
            menuEl.classList.add('hidden');
        }
        if (btnEl) {
            btnEl.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Seleciona um papel de visão diretamente do menu popover compacto
     */
    function selectVisionRole(newRole) {
        closeVisionDropdown();
        triggerVisionTransition(newRole);
    }

    // Aliases para compatibilidade retroativa
    function openVisionSwitcherModal() { toggleVisionDropdown(); }
    function closeVisionSwitcherModal() { closeVisionDropdown(); }

    // Fechamento automático ao clicar fora ou pressionar ESC
    if (typeof document !== 'undefined') {
        document.addEventListener('click', function(e) {
            var wrapper = document.getElementById('sidebar-profile-switcher-wrapper');
            var collapsedBtn = document.getElementById('sidebar-vision-collapsed-btn');
            if (wrapper && !wrapper.contains(e.target) && (!collapsedBtn || !collapsedBtn.contains(e.target))) {
                closeVisionDropdown();
            }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' || e.keyCode === 27) {
                closeVisionDropdown();
            }
        });
    }

    /**
     * Dispara a transição futurista / laser ao alternar a visão do usuário
     * @param {string} newRole 
     */
    async function triggerVisionTransition(newRole) {
        if (!newRole) return;

        closeVisionDropdown();

        var sweepEl = document.getElementById('vision-laser-sweep');
        var appEl = document.querySelector('.main-content') || document.querySelector('.app-container');
        
        if (sweepEl) {
            sweepEl.classList.remove('animating');
            void sweepEl.offsetWidth; // trigger reflow
            sweepEl.classList.add('animating');
        }
        if (appEl) {
            appEl.classList.add('vision-transitioning-content');
        }

        var targetVision = AVAILABLE_SYSTEM_VISIONS.find(function(v) {
            return v.role.toLowerCase() === newRole.toLowerCase() || v.title.toLowerCase().includes(newRole.toLowerCase());
        });

        if (targetVision) {
            if (targetVision.escola !== undefined) {
                sessionStorage.setItem('userEscola', targetVision.escola);
                localStorage.setItem('userEscola', targetVision.escola);
            }
            if (targetVision.turma !== undefined) {
                sessionStorage.setItem('userTurma', targetVision.turma);
                localStorage.setItem('userTurma', targetVision.turma);
            }
        }

        await switchActiveSessionProfile(newRole);

        setTimeout(function() {
            if (appEl) {
                appEl.classList.remove('vision-transitioning-content');
            }
            if (sweepEl) {
                sweepEl.classList.remove('animating');
            }
        }, 650);
    }

    /**
     * Alterna o perfil ativo da sessão sem necessidade de deslogar
     * @param {string} newRole 
     */
    async function switchActiveSessionProfile(newRole) {
        if (!newRole) return;
        try {
            var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                        (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));

            if (token && typeof fetch === 'function') {
                try {
                    var res = await fetch('/api/sessao/perfil-ativo', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        },
                        body: JSON.stringify({ role: newRole })
                    });

                    if (res.ok) {
                        var data = await res.json();
                        if (data.token) {
                            sessionStorage.setItem('authToken', data.token);
                            localStorage.setItem('authToken', data.token);
                        }
                        if (data.perfisDisponiveis) {
                            sessionStorage.setItem('userPerfis', JSON.stringify(data.perfisDisponiveis));
                            localStorage.setItem('userPerfis', JSON.stringify(data.perfisDisponiveis));
                        }
                    } else {
                        var errData = await res.json().catch(function() { return {}; });
                        console.warn('[Profile Switch API Warning]', errData.error || res.statusText);
                    }
                } catch(fetchErr) {
                    console.warn('[Profile Switch Offline/Fallback]', fetchErr);
                }
            }

            // Atualiza armazenamento local e de sessão
            sessionStorage.setItem('userRole', newRole);
            localStorage.setItem('userRole', newRole);

            // Atualiza perfil corrente
            var profile = getCurrentUserProfile();
            profile.role = newRole;
            try {
                localStorage.setItem(STORAGE_KEY_USER_PROFILE, JSON.stringify(profile));
            } catch(e) {}

            // Atualiza UI de forma reativa e instantânea
            updateUserHeaderUI();
            if (typeof global.updateMenuVisibilityByRole === 'function') {
                global.updateMenuVisibilityByRole();
            }
            renderDashboardWelcomeBanner();

            // Dispara evento customizado para outros módulos ouvintes
            try {
                if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                    window.dispatchEvent(new CustomEvent('activeProfileChanged', { detail: { role: newRole } }));
                }
            } catch(e) {}

            if (typeof global.showToast === 'function') {
                global.showToast('Função ativa alternada para: ' + newRole, 'check-circle');
            }
        } catch(err) {
            console.error('[switchActiveSessionProfile Error]:', err);
            if (typeof global.showToast === 'function') {
                global.showToast('Erro ao alternar função de acesso.', 'alert-triangle');
            }
        }
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

        // 2. Sidebar Footer (Card de Perfil e Seletor Ativo)
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
                sidebarAvatar.innerHTML = '<img src="assets/icons/profile.svg" alt="' + (profile.name || 'Perfil') + '" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">';
            }
        }

        // Renderiza o seletor de perfis na sidebar
        renderSidebarProfileSwitcher();
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
            ? '<img src="' + profile.avatarPhoto + '" alt="' + cleanName + '" style="width:100%; height:100%; border-radius: 50%; object-fit:cover;">' 
            : '<img src="assets/icons/profile.svg" alt="' + cleanName + '" style="width:100%; height:100%; border-radius: 50%; object-fit:cover;">';

        var teacherAlertHtml = '';
        if (isTeacher && !hasEvaluations) {
            teacherAlertHtml = `
                <div style="margin-top: 16px; padding: 14px 18px; background: rgba(255, 255, 255, 0.12); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: var(--radius-md); display: flex; align-items: flex-start; gap: 12px; width: 100%; backdrop-filter: blur(6px);">
                    <div style="width: 32px; height: 32px; border-radius: 50%; background: #FFFFFF; color: #1A3D63; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        <i data-lucide="clock" style="width: 16px; height: 16px;"></i>
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

        var illustrationSvg = '<div class="welcome-banner-illustration" aria-hidden="true"><svg width="190" height="100" viewBox="0 0 190 100" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ill-board" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95" /><stop offset="100%" stop-color="#E2EEF7" stop-opacity="0.88" /></linearGradient><linearGradient id="ill-bar1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4A7FA7" /><stop offset="100%" stop-color="#1A3D63" /></linearGradient><linearGradient id="ill-bar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5DE4BD" /><stop offset="100%" stop-color="#059669" /></linearGradient><linearGradient id="ill-bar3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#B3CFE5" /><stop offset="100%" stop-color="#4A7FA7" /></linearGradient><linearGradient id="ill-cap" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0A1931" /><stop offset="100%" stop-color="#1A3D63" /></linearGradient><filter id="ill-shadow" x="20" y="2" width="130" height="100" filterUnits="userSpaceOnUse"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0A1931" flood-opacity="0.22" /></filter></defs><g filter="url(#ill-shadow)"><rect x="35" y="12" width="100" height="80" rx="8" fill="url(#ill-board)" stroke="rgba(255,255,255,0.7)" stroke-width="1.5" /><rect x="68" y="7" width="34" height="10" rx="3" fill="#1A3D63" /><circle cx="85" cy="12" r="2" fill="#FFFFFF" /><rect x="46" y="24" width="40" height="4" rx="2" fill="#1A3D63" fill-opacity="0.8" /><rect x="46" y="31" width="24" height="3" rx="1.5" fill="#4A7FA7" fill-opacity="0.6" /><line x1="46" y1="72" x2="124" y2="72" stroke="#B3CFE5" stroke-width="1" stroke-dasharray="2 2" /><line x1="46" y1="56" x2="124" y2="56" stroke="#B3CFE5" stroke-width="1" stroke-dasharray="2 2" /><rect x="50" y="52" width="11" height="20" rx="2" fill="url(#ill-bar3)" /><rect x="67" y="40" width="11" height="32" rx="2" fill="url(#ill-bar1)" /><rect x="84" y="46" width="11" height="26" rx="2" fill="url(#ill-bar3)" /><rect x="101" y="32" width="11" height="40" rx="2" fill="url(#ill-bar2)" /><path d="M 55 48 Q 72 32 90 42 T 107 26" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" /><circle cx="107" cy="26" r="3" fill="#FFFFFF" stroke="#059669" stroke-width="2" /></g><g transform="translate(132, 8)"><polygon points="24,4 44,13 24,22 4,13" fill="url(#ill-cap)" /><polygon points="24,18 40,12 40,18 24,24 8,18 8,12" fill="#0A1931" opacity="0.85" /><circle cx="24" cy="13" r="1.8" fill="#B3CFE5" /><path d="M 24 13 Q 34 16 38 27" fill="none" stroke="#F6FAFD" stroke-width="1.3" /><circle cx="38" cy="28" r="1.8" fill="#5DE4BD" /></g><g transform="translate(8, 48)"><path d="M 4 18 C 12 15 18 18 18 18 L 18 32 C 18 32 12 29 4 32 Z" fill="#1A3D63" /><path d="M 32 18 C 24 15 18 18 18 18 L 18 32 C 18 32 24 29 32 32 Z" fill="#4A7FA7" /><path d="M 5 16 C 12 13 17 16 17 16 L 17 30 C 17 30 12 27 5 30 Z" fill="#FFFFFF" /><path d="M 31 16 C 24 13 19 16 19 16 L 19 30 C 19 30 24 27 31 30 Z" fill="#F6FAFD" /><path d="M 18 16 L 18 34 L 20 32 L 22 34 L 22 16 Z" fill="#5DE4BD" /></g><g transform="translate(138, 52)"><circle cx="16" cy="16" r="14" fill="#FFFFFF" fill-opacity="0.95" stroke="#4A7FA7" stroke-width="1.5" /><circle cx="16" cy="16" r="11" fill="url(#ill-bar2)" /><path d="M 11 16 L 14 19 L 21 12" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></g><g fill="#FFFFFF" opacity="0.85"><polygon points="22,14 23.5,9 25,14 30,15.5 25,17 23.5,22 22,17 17,15.5" /><polygon points="124,5 125,2 126,5 129,6 126,7 125,10 124,7 121,6" /><polygon points="174,45 175,42 176,45 179,46 176,47 175,50 174,47 171,46" /></g></svg></div>';

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
     * Abre o Modal "Meu Perfil" (Somente Leitura de Vínculos + Troca de Foto de Perfil)
     */
    async function openUserProfileModal() {
        var modal = document.getElementById('modal-user-profile');
        if (!modal) return;

        var profile = getCurrentUserProfile();

        var elName = document.getElementById('profile-view-name') || document.getElementById('profile-input-name');
        var elEmail = document.getElementById('profile-view-email') || document.getElementById('profile-input-email');
        var elRole = document.getElementById('profile-view-role') || document.getElementById('profile-input-role');
        var badgesContainer = document.getElementById('profile-view-perfis-badges');
        var preview = document.getElementById('profile-avatar-preview');
        var btnRemovePhoto = document.getElementById('btn-remove-avatar-photo');

        if (elName) {
            if (elName.tagName === 'INPUT') elName.value = profile.name || '';
            else elName.textContent = profile.name || 'Gestor da Rede';
        }
        if (elEmail) {
            if (elEmail.tagName === 'INPUT') elEmail.value = profile.email || '';
            else elEmail.textContent = profile.email || 'semed@goncalvesdias.ma.gov.br';
        }
        if (elRole && elRole.tagName !== 'INPUT') {
            elRole.textContent = profile.role || 'Gestor(a) da Rede';
        }

        // Renderiza lista informativa de perfis vinculados (somente leitura)
        if (badgesContainer) {
            var perfis = getUserPerfis();
            var activeRole = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userRole')) ||
                             (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) || profile.role;

            badgesContainer.innerHTML = perfis.map(function(r) {
                var isActive = (r.toLowerCase() === (activeRole || '').toLowerCase());
                if (isActive) {
                    return '<span class="badge badge-primary" style="display:inline-flex; align-items:center; gap:5px; padding:6px 12px; font-size:0.8rem; font-weight:700; border-radius:20px; background:#1A3D63; color:#FFFFFF; border:1px solid #4A7FA7;"><i data-lucide="check-circle-2" style="width:13px; height:13px;"></i> ' + r + ' <span style="font-size:0.65rem; background:#5DE4BD; color:#0A1931; padding:1px 6px; border-radius:10px; font-weight:800; margin-left:2px;">ATIVO</span></span>';
                } else {
                    return '<span class="badge badge-neutral" style="display:inline-flex; align-items:center; gap:5px; padding:6px 12px; font-size:0.8rem; font-weight:600; border-radius:20px; background:rgba(255,255,255,0.08); color:var(--text-secondary); border:1px solid var(--border-color);"><i data-lucide="shield" style="width:13px; height:13px;"></i> ' + r + '</span>';
                }
            }).join('');
        }

        // Renderiza preview do avatar
        renderModalAvatarPreview(profile.avatarPhoto, profile.name);

        if (btnRemovePhoto) {
            btnRemovePhoto.style.display = profile.avatarPhoto ? 'inline-flex' : 'none';
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }

        // Tenta sincronizar com o backend em segundo plano para refletir dados mais recentes
        try {
            var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                        (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));
            if (token && typeof fetch === 'function') {
                var res = await fetch('/api/usuarios/me', {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (res.ok) {
                    var userData = await res.json();
                    if (userData && userData.user) {
                        var u = userData.user;
                        if (u.nome && elName) {
                            if (elName.tagName === 'INPUT') elName.value = u.nome;
                            else elName.textContent = u.nome;
                        }
                        if (u.email && elEmail) {
                            if (elEmail.tagName === 'INPUT') elEmail.value = u.email;
                            else elEmail.textContent = u.email;
                        }
                        if (u.avatar_url !== undefined && u.avatar_url !== profile.avatarPhoto) {
                            profile.avatarPhoto = u.avatar_url || '';
                            saveCurrentUserProfile(profile);
                            renderModalAvatarPreview(profile.avatarPhoto, u.nome || profile.name);
                            if (btnRemovePhoto) {
                                btnRemovePhoto.style.display = profile.avatarPhoto ? 'inline-flex' : 'none';
                            }
                        }
                    }
                }
            }
        } catch(syncErr) {
            console.warn('[openUserProfileModal] Sync offline:', syncErr);
        }
    }

    /**
     * Renderiza o container de preview do avatar no modal
     */
    function renderModalAvatarPreview(avatarPhoto, name) {
        var preview = document.getElementById('profile-avatar-preview');
        if (!preview) return;
        if (avatarPhoto) {
            preview.innerHTML = '<img src="' + avatarPhoto + '" alt="' + (name || 'Avatar') + '" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">';
        } else {
            preview.innerHTML = '<img src="assets/icons/profile.svg" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">';
        }
    }

    /**
     * Fecha o Modal de Perfil
     */
    function closeUserProfileModal() {
        var modal = document.getElementById('modal-user-profile');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
        var fileInput = document.getElementById('profile-avatar-file-input');
        if (fileInput) fileInput.value = '';
    }

    /**
     * Dispara o seletor de arquivos de imagem do dispositivo
     */
    function triggerProfileAvatarFileInput() {
        var input = document.getElementById('profile-avatar-file-input');
        if (input) input.click();
    }

    /**
     * Trata a seleção de arquivo de imagem do usuário (validação tipo + tamanho máximo 5MB)
     * @param {HTMLInputElement} input 
     */
    async function handleProfileAvatarFileSelect(input) {
        if (!input || !input.files || input.files.length === 0) return;
        var file = input.files[0];

        // 1. Validação de Tipo de Arquivo
        var allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type.toLowerCase())) {
            if (typeof global.showToast === 'function') {
                global.showToast('Formato inválido! Envie uma imagem JPG, PNG ou WEBP.', 'alert-triangle');
            } else {
                alert('Formato de arquivo inválido. Por favor, selecione uma imagem JPG, PNG ou WEBP.');
            }
            input.value = '';
            return;
        }

        // 2. Validação de Tamanho Máximo (5MB = 5 * 1024 * 1024 bytes)
        var maxSizeBytes = 5 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            if (typeof global.showToast === 'function') {
                global.showToast('Tamanho excedido! A imagem deve ter no máximo 5MB.', 'alert-triangle');
            } else {
                alert('A imagem selecionada é muito grande. O tamanho máximo permitido é 5MB.');
            }
            input.value = '';
            return;
        }

        // 3. Preview imediato no modal
        var reader = new FileReader();
        reader.onload = function(e) {
            renderModalAvatarPreview(e.target.result, 'Preview');
        };
        reader.readAsDataURL(file);

        // 4. Upload para o backend
        await uploadAvatarFile(file);
    }

    /**
     * Envia a imagem para o backend via endpoint POST /usuarios/:id/avatar
     * @param {File} file 
     */
    async function uploadAvatarFile(file) {
        var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                    (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));

        var formData = new FormData();
        formData.append('avatar', file);

        try {
            if (typeof global.showToast === 'function') {
                global.showToast('Enviando nova foto de perfil...', 'info');
            }

            var res = await fetch('/api/usuarios/me/avatar', {
                method: 'POST',
                headers: token ? { 'Authorization': 'Bearer ' + token } : {},
                body: formData
            });

            if (!res.ok) {
                var errData = await res.json().catch(function() { return {}; });
                throw new Error(errData.error || 'Falha no upload do avatar');
            }

            var data = await res.json();
            var newAvatarUrl = data.avatar_url || '';

            // Atualiza perfil localmente
            var profile = getCurrentUserProfile();
            profile.avatarPhoto = newAvatarUrl;
            saveCurrentUserProfile(profile);

            // Atualiza UI em tempo real
            updateUserHeaderUI();
            renderModalAvatarPreview(newAvatarUrl, profile.name);

            var btnRemovePhoto = document.getElementById('btn-remove-avatar-photo');
            if (btnRemovePhoto) btnRemovePhoto.style.display = 'inline-flex';

            if (typeof global.showToast === 'function') {
                global.showToast('Foto de perfil atualizada com sucesso!', 'check-circle');
            }
        } catch(err) {
            console.error('[uploadAvatarFile Error]:', err);
            // Reverte preview para o avatar persistido
            var current = getCurrentUserProfile();
            renderModalAvatarPreview(current.avatarPhoto, current.name);

            if (typeof global.showToast === 'function') {
                global.showToast('Erro ao atualizar foto: ' + (err.message || 'Tente novamente'), 'alert-triangle');
            }
        }
    }

    /**
     * Remove a foto de perfil atual voltando ao avatar padrão
     */
    async function removeProfileAvatar() {
        var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                    (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));

        try {
            var res = await fetch('/api/usuarios/me/avatar', {
                method: 'DELETE',
                headers: token ? { 'Authorization': 'Bearer ' + token } : {}
            });

            var profile = getCurrentUserProfile();
            profile.avatarPhoto = '';
            saveCurrentUserProfile(profile);

            updateUserHeaderUI();
            renderModalAvatarPreview('', profile.name);

            var btnRemovePhoto = document.getElementById('btn-remove-avatar-photo');
            if (btnRemovePhoto) btnRemovePhoto.style.display = 'none';

            var fileInput = document.getElementById('profile-avatar-file-input');
            if (fileInput) fileInput.value = '';

            if (typeof global.showToast === 'function') {
                global.showToast('Foto de perfil removida com sucesso.', 'check');
            }
        } catch(err) {
            console.error('[removeProfileAvatar Error]:', err);
            if (typeof global.showToast === 'function') {
                global.showToast('Erro ao remover foto de perfil.', 'alert-triangle');
            }
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
    global.triggerProfileAvatarFileInput = triggerProfileAvatarFileInput;
    global.handleProfileAvatarFileSelect = handleProfileAvatarFileSelect;
    global.uploadAvatarFile = uploadAvatarFile;
    global.removeProfileAvatar = removeProfileAvatar;
    global.getUserPerfis = getUserPerfis;
    global.renderSidebarProfileSwitcher = renderSidebarProfileSwitcher;
    global.switchActiveSessionProfile = switchActiveSessionProfile;
    global.AVAILABLE_SYSTEM_VISIONS = AVAILABLE_SYSTEM_VISIONS;
    global.toggleVisionDropdown = toggleVisionDropdown;
    global.closeVisionDropdown = closeVisionDropdown;
    global.selectVisionRole = selectVisionRole;
    global.renderVisionDropdownMenu = renderVisionDropdownMenu;
    global.openVisionSwitcherModal = openVisionSwitcherModal;
    global.closeVisionSwitcherModal = closeVisionSwitcherModal;
    global.triggerVisionTransition = triggerVisionTransition;

    if (typeof window !== 'undefined') {
        window.toggleVisionDropdown = toggleVisionDropdown;
        window.closeVisionDropdown = closeVisionDropdown;
        window.selectVisionRole = selectVisionRole;
        window.renderVisionDropdownMenu = renderVisionDropdownMenu;
        window.openVisionSwitcherModal = openVisionSwitcherModal;
        window.closeVisionSwitcherModal = closeVisionSwitcherModal;
        window.triggerVisionTransition = triggerVisionTransition;
    }

})(typeof window !== 'undefined' ? window : this);
