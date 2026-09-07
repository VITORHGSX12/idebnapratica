// =========================================================================
// GESTÃO DE USUÁRIOS & CONTROLE RBAC (MODULAR ENGINE)
// Responsabilidade: Listagem da equipe municipal, RBAC por escola e função,
// cadastro com geração automática de credenciais, cópia de login e perfil.
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY_ADMIN_USERS = 'saas_admin_users_db';
    var editingUserId = null;

    /**
     * Recupera a lista de usuários armazenada ou inicializa com dados padrão
     */
    function getStoredUsers() {
        try {
            if (typeof localStorage !== 'undefined') {
                var raw = localStorage.getItem(STORAGE_KEY_ADMIN_USERS);
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        return parsed;
                    }
                }
            }
        } catch(e) {}

        var initial = (global.DEFAULT_STAFF_USERS && global.DEFAULT_STAFF_USERS.slice()) || [];
        saveStoredUsers(initial);
        return initial;
    }

    /**
     * Persiste a lista de usuários no armazenamento local
     */
    function saveStoredUsers(users) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(users));
            }
        } catch(e) {}
    }

    /**
     * Determina se o usuário atual pertence ao grupo com permissão de configuração (Admin/SEMED)
     */
    function isConfigGroup() {
        var role = '';
        try {
            role = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userRole')) ||
                   (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) ||
                   'Master Admin';
        } catch(e) {
            role = 'Master Admin';
        }

        var r = (role || '').toLowerCase();
        return r.includes('admin') || r.includes('gestor') || r.includes('semed') || r === 'master admin';
    }

    /**
     * Retorna a unidade escolar vinculada ao usuário ativo
     */
    function getLoggedUserSchool() {
        try {
            return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userSchool')) ||
                   (typeof localStorage !== 'undefined' && localStorage.getItem('userSchool')) ||
                   '';
        } catch(e) {
            return '';
        }
    }

    /**
     * Gera e-mail e senha sugeridos automaticamente com base no nome do usuário
     */
    function generateAutoCredentials() {
        var nameInput = document.getElementById('new-user-name');
        var emailInput = document.getElementById('new-user-email');
        var passInput = document.getElementById('new-user-password');

        var name = nameInput ? nameInput.value.trim() : '';
        var slug = 'usuario.' + Math.floor(1000 + Math.random() * 9000);

        if (name) {
            var parts = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, '').split(' ').filter(Boolean);
            if (parts.length >= 2) {
                slug = parts[0] + '.' + parts[parts.length - 1];
            } else if (parts.length === 1) {
                slug = parts[0];
            }
        }

        if (emailInput && (!emailInput.value || emailInput.getAttribute('data-auto') === 'true')) {
            emailInput.value = slug + '@goncalvesdias.ma.gov.br';
            emailInput.setAttribute('data-auto', 'true');
        }
        if (passInput && !passInput.value) {
            passInput.value = 'Gondias@2026';
        }
    }

    /**
     * Trata a alteração de cargo/perfil no formulário de cadastro
     */
    function handleUserRoleChange(role) {
        generateAutoCredentials();
    }

    /**
     * Abre o modal de cadastro/edição de usuário
     */
    function openCreateUserModal(idToEdit) {
        var modal = document.getElementById('create-user-modal');
        var form = document.getElementById('create-user-form');
        var title = modal ? modal.querySelector('.modal-header h3') : null;
        if (!modal) return;

        editingUserId = idToEdit || null;

        if (editingUserId) {
            var users = getStoredUsers();
            var target = users.find(function(u) { return u.id === editingUserId; });
            if (target) {
                if (title) title.textContent = 'Editar Membro da Equipe (' + target.id + ')';
                setInputValue('new-user-name', target.nome);
                setInputValue('new-user-cpf', target.cpf || '');
                setInputValue('new-user-phone', target.telefone || '');
                setInputValue('new-user-role', target.tipo || target.role || 'Professor(a)');
                setInputValue('new-user-school', target.escola || 'Todas as Escolas (SEMED)');
                setInputValue('new-user-email', target.email);
                setInputValue('new-user-password', target.senha || 'Gondias@2026');
            }
        } else {
            if (title) title.textContent = 'Cadastrar Membro da Equipe';
            if (form) form.reset();
            var emailInput = document.getElementById('new-user-email');
            if (emailInput) emailInput.setAttribute('data-auto', 'true');
            generateAutoCredentials();
        }

        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
    }

    function setInputValue(id, val) {
        var el = document.getElementById(id);
        if (el) el.value = val;
    }

    /**
     * Trata o envio do formulário de salvar novo usuário ou atualizar existente
     */
    async function handleSaveNewUser(e) {
        if (e && e.preventDefault) e.preventDefault();

        var nameEl = document.getElementById('new-user-name');
        var cpfEl = document.getElementById('new-user-cpf');
        var phoneEl = document.getElementById('new-user-phone');
        var roleEl = document.getElementById('new-user-role');
        var schoolEl = document.getElementById('new-user-school');
        var emailEl = document.getElementById('new-user-email');
        var passEl = document.getElementById('new-user-password');

        var name = (nameEl && nameEl.value) || '';
        var cpf = (cpfEl && cpfEl.value) || '';
        var phone = (phoneEl && phoneEl.value) || '';
        var role = (roleEl && roleEl.value) || 'Professor(a)';
        var school = (schoolEl && schoolEl.value) || 'Todas as Escolas (SEMED)';
        var email = (emailEl && emailEl.value) || '';
        var password = (passEl && passEl.value) || 'Gondias@2026';

        if (!name.trim() || !email.trim()) {
            if (typeof global.showToast === 'function') {
                global.showToast('Preencha os campos obrigatórios (Nome e E-mail Institucional).', 'alert-triangle');
            }
            if (nameEl && !name.trim()) nameEl.focus();
            else if (emailEl && !email.trim()) emailEl.focus();
            return;
        }

        var users = getStoredUsers();
        var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                    (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));

        if (editingUserId) {
            var idx = users.findIndex(function(u) { return u.id === editingUserId; });
            if (idx >= 0) {
                users[idx].nome = name.trim();
                users[idx].cpf = cpf.trim() || '-';
                users[idx].telefone = phone.trim() || '-';
                users[idx].tipo = role;
                users[idx].role = role;
                users[idx].escola = school;
                users[idx].email = email.trim();
                users[idx].senha = password.trim();
            }

            // Sincronizar atualização com o backend via PUT /api/users/:id
            if (token && typeof fetch === 'function') {
                try {
                    fetch('/api/users/' + editingUserId, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({
                            nome: name.trim(),
                            cpf: cpf.trim() || '-',
                            telefone: phone.trim() || '-',
                            role: role,
                            escola: school,
                            email: email.trim(),
                            password: password.trim()
                        })
                    }).catch(function(err) { console.warn('[Backend Put Sync Warning]:', err); });
                } catch(e) {}
            }

            if (typeof global.showToast === 'function') {
                global.showToast('Dados do profissional atualizados com sucesso!', 'success');
            }
        } else {
            var newId = 'USR-' + String(users.length + 1).padStart(3, '0');
            var newUser = {
                id: newId,
                nome: name.trim(),
                cpf: cpf.trim() || '-',
                telefone: phone.trim() || '-',
                tipo: role,
                role: role,
                escola: school,
                turma: role.includes('Professor') ? 'Turma a Atribuir' : 'Gestão da Unidade Escolar',
                email: email.trim(),
                senha: password.trim(),
                status: 'Ativo'
            };
            users.unshift(newUser);

            // Sincronizar novo cadastro com o backend via POST /api/users
            if (token && typeof fetch === 'function') {
                try {
                    fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({
                            nome: newUser.nome,
                            email: newUser.email,
                            password: newUser.senha,
                            role: newUser.role,
                            tipo: newUser.tipo,
                            escola: newUser.escola,
                            turma: newUser.turma,
                            telefone: newUser.telefone,
                            cpf: newUser.cpf
                        })
                    }).catch(function(err) { console.warn('[Backend Post Sync Warning]:', err); });
                } catch(e) {}
            }

            if (typeof global.showToast === 'function') {
                global.showToast('✅ Novo profissional cadastrado com sucesso!', 'success');
            }
        }

        saveStoredUsers(users);
        editingUserId = null;

        if (typeof global.closeModal === 'function') {
            global.closeModal('create-user-modal');
        } else {
            var modal = document.getElementById('create-user-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('active');
                modal.style.display = 'none';
            }
        }

        renderUsersList();
    }

    /**
     * Renderiza a tabela da equipe com isolamento por RBAC e filtros
     */
    function renderUsersList() {
        var tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        var canConfigure = isConfigGroup();
        var btnCreateUser = document.getElementById('btn-open-create-user-modal');
        if (btnCreateUser) {
            btnCreateUser.style.display = canConfigure ? 'inline-flex' : 'none';
        }

        var typeFilter = (document.getElementById('filter-user-type') && document.getElementById('filter-user-type').value) || 'all';
        var statusFilter = (document.getElementById('filter-user-status') && document.getElementById('filter-user-status').value) || 'all';
        var searchInput = document.getElementById('filter-user-search');
        var query = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';
        var userSchool = getLoggedUserSchool().toLowerCase().trim();

        var users = getStoredUsers();

        // RBAC: Diretores e Professores visualizam apenas sua própria unidade escolar
        if (!canConfigure && userSchool) {
            users = users.filter(function(u) {
                var sch = (u.escola || '').toLowerCase().trim();
                return sch === userSchool || sch.includes(userSchool) || userSchool.includes(sch) || sch.includes('todas as escolas');
            });
        }

        users = users.filter(function(u) {
            if (typeFilter !== 'all' && u.tipo !== typeFilter && u.role !== typeFilter) return false;
            if (statusFilter !== 'all' && u.status !== statusFilter) return false;
            if (query) {
                var full = (u.nome + ' ' + (u.cpf || '') + ' ' + (u.email || '') + ' ' + (u.escola || '')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                if (!full.includes(query)) return false;
            }
            return true;
        });

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 40px; text-align: center; color: var(--text-secondary);">Nenhum profissional da equipe encontrado com os filtros aplicados.</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(function(u) {
            var actionsHtml = '';
            if (canConfigure) {
                actionsHtml = [
                    '<div style="display: flex; align-items: center; justify-content: center; gap: 6px;">',
                    '    <button onclick="handleViewUserProfile(\'' + u.id + '\')" class="btn btn-sm btn-outline" style="font-size: 0.72rem; padding: 4px 8px;" title="Ver Detalhes do Perfil">👤 Ver</button>',
                    '    <button onclick="handleCopyUserCredentials(\'' + u.email + '\', \'' + (u.senha || 'Gondias@2026') + '\')" class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 4px 8px; color: #6366f1;" title="Copiar Login e Senha">🔑</button>',
                    '    <button onclick="openCreateUserModal(\'' + u.id + '\')" class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 4px 8px; color: #f59e0b;" title="Editar Usuário">✏️</button>',
                    '    <button onclick="handleDeleteUser(\'' + u.id + '\')" class="btn btn-icon btn-sm" style="color: #ef4444; border: 1px solid var(--border-color);" title="Excluir Usuário">🗑️</button>',
                    '</div>'
                ].join('\n');
            } else {
                actionsHtml = [
                    '<div style="display: flex; align-items: center; justify-content: center; gap: 6px;">',
                    '    <button onclick="handleViewUserProfile(\'' + u.id + '\')" class="btn btn-sm btn-outline" style="font-size: 0.72rem; padding: 4px 8px;" title="Ver Detalhes do Perfil">👁️ Ver</button>',
                    '</div>'
                ].join('\n');
            }

            return [
                '<tr style="border-bottom: 1px solid var(--border-color); height: 56px; transition: background-color 0.15s ease;">',
                '    <td style="padding: 10px 14px; font-family: var(--font-mono); font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">' + u.id + '</td>',
                '    <td style="padding: 10px 14px;">',
                '        <div style="display: flex; flex-direction: column; gap: 2px;">',
                '            <span class="badge badge-purple" style="font-size: 0.7rem; font-weight: 700; width: fit-content;">' + (u.tipo || u.role || 'Usuário') + '</span>',
                '            <span style="font-size: 0.72rem; color: ' + (u.status === 'Ativo' ? '#16a34a' : '#ef4444') + '; font-weight: 700;">● ' + (u.status || 'Ativo') + '</span>',
                '        </div>',
                '    </td>',
                '    <td style="padding: 10px 14px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">' + (u.cpf || '-') + '</td>',
                '    <td style="padding: 10px 14px;">',
                '        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.88rem;">' + u.nome + '</div>',
                '        <div style="font-size: 0.74rem; color: #6366f1; margin-top: 2px;">✉️ ' + u.email + '</div>',
                '    </td>',
                '    <td style="padding: 10px 14px; font-size: 0.8rem; color: var(--text-secondary);">',
                '        <strong style="color: var(--text-primary);">' + (u.escola || 'Rede Municipal') + '</strong>',
                (u.turma ? '        <div style="font-size: 0.72rem; color: var(--purple-light);">' + u.turma + '</div>' : ''),
                '    </td>',
                '    <td style="padding: 10px 14px; font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-mono);">' + (u.telefone || '-') + '</td>',
                '    <td style="padding: 10px 14px; text-align: center;">' + actionsHtml + '</td>',
                '</tr>'
            ].join('\n');
        }).join('');
    }

    /**
     * Exibe o perfil completo do profissional selecionado
     */
    function handleViewUserProfile(id) {
        var users = getStoredUsers();
        var u = users.find(function(user) { return user.id === id; });
        if (u) openUserProfileDetail(u);
    }

    function openUserProfileDetail(user) {
        var listView = document.getElementById('users-list-view-container');
        var detailView = document.getElementById('user-profile-detail-view');
        if (!listView || !detailView) return;

        listView.classList.add('hidden');
        detailView.classList.remove('hidden');

        var canConfigure = isConfigGroup();
        var btnEdit = document.getElementById('btn-profile-edit-user');
        if (btnEdit) {
            btnEdit.style.display = canConfigure ? 'inline-flex' : 'none';
            btnEdit.onclick = function() {
                openCreateUserModal(user.id);
            };
        }

        var isConfigRole = (user.tipo || user.role || '').toLowerCase().includes('admin') || (user.tipo || user.role || '').toLowerCase().includes('gestor') || (user.tipo || user.role || '').toLowerCase().includes('semed');

        var nameEl = document.getElementById('profile-user-display-name');
        var badgeEl = document.getElementById('profile-user-type-badge');
        var idEl = document.getElementById('profile-user-id');
        var cpfEl = document.getElementById('profile-user-cpf');
        var statusEl = document.getElementById('profile-user-status-badge');
        var phoneEl = document.getElementById('profile-user-phone');
        var emailEl = document.getElementById('profile-user-email-text');
        var schoolEl = document.getElementById('profile-user-school');
        var funcEscolaEl = document.getElementById('profile-func-escola');
        var funcTurmaEl = document.getElementById('profile-func-turma');
        var rbacBadge = document.getElementById('profile-rbac-group-badge');
        var rbacDesc = document.getElementById('profile-rbac-group-desc');

        if (nameEl) nameEl.textContent = user.nome;
        if (badgeEl) badgeEl.textContent = user.tipo || user.role || 'Usuário';
        if (idEl) idEl.textContent = user.id;
        if (cpfEl) cpfEl.textContent = user.cpf || '-';
        if (statusEl) statusEl.textContent = user.status || 'Ativo';
        if (phoneEl) phoneEl.textContent = user.telefone || '-';
        if (emailEl) emailEl.textContent = user.email;
        if (schoolEl) schoolEl.textContent = user.escola || 'Rede Municipal';
        if (funcEscolaEl) funcEscolaEl.textContent = user.escola || 'Rede Municipal';
        if (funcTurmaEl) funcTurmaEl.textContent = user.turma || 'Gestão da Unidade Escolar';

        if (rbacBadge) {
            rbacBadge.textContent = isConfigRole ? 'CONFIGURAÇÃO' : 'VISUALIZAÇÃO';
            rbacBadge.className = isConfigRole ? 'badge badge-purple' : 'badge badge-blue';
        }
        if (rbacDesc) {
            rbacDesc.textContent = isConfigRole 
                ? 'Grupo CONFIGURAÇÃO: Permissão para criar, editar, excluir usuários e gerenciar configurações municipais.'
                : 'Grupo VISUALIZAÇÃO: Permissão somente-leitura escopada exclusivamente à sua escola/turma.';
        }

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Copia as credenciais de acesso do usuário para a área de transferência
     */
    function handleCopyUserCredentials(email, senha) {
        var text = 'Sistema IDEB na Prática (SEMED Gonçalves Dias)\nLogin: ' + email + '\nSenha: ' + senha;
        if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(function() {
                if (typeof global.showToast === 'function') global.showToast('Credenciais copiadas com sucesso!', 'check-circle');
            }).catch(function() {
                fallbackCopyText(text);
            });
        } else {
            fallbackCopyText(text);
        }
    }

    function fallbackCopyText(text) {
        try {
            var area = document.createElement('textarea');
            area.value = text;
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            document.body.removeChild(area);
            if (typeof global.showToast === 'function') global.showToast('Credenciais copiadas com sucesso!', 'check-circle');
        } catch(e) {
            prompt('Copie as credenciais de acesso:', text);
        }
    }

    /**
     * Exclui usuário com validação de perfil RBAC
     */
    async function handleDeleteUser(id) {
        var canConfigure = isConfigGroup();
        if (!canConfigure) {
            if (typeof global.showToast === 'function') global.showToast('Operação bloqueada: Apenas administradores podem excluir usuários.', 'alert-triangle');
            return;
        }

        var users = getStoredUsers();
        var target = users.find(function(u) { return u.id === id; });
        var targetName = target ? target.nome : id;

        var confirmed = typeof global.confirm === 'function' ? global.confirm('Deseja realmente revogar o acesso e excluir ' + targetName + '?') : true;
        if (confirmed) {
            var current = users.filter(function(u) { return u.id !== id; });
            saveStoredUsers(current);

            try {
                var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                            (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));
                if (token && typeof fetch === 'function') {
                    await fetch('/api/users/' + id, {
                        method: 'DELETE',
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                }
            } catch(err) {
                console.warn('[Sync Delete Backend Warning]', err);
            }

            renderUsersList();
            if (typeof global.showToast === 'function') global.showToast('Usuário removido da equipe com sucesso.', 'check-circle');
        }
    }

    /**
     * Inicializa os ouvintes de eventos da Gestão de Usuários
     */
    function initAdminUsersModule() {
        var btnSearchUsers = document.getElementById('btn-search-users');
        if (btnSearchUsers) btnSearchUsers.onclick = renderUsersList;

        var inputSearchUsers = document.getElementById('filter-user-search');
        if (inputSearchUsers) {
            inputSearchUsers.oninput = renderUsersList;
            inputSearchUsers.onkeydown = function(e) { if (e.key === 'Enter') renderUsersList(); };
        }

        var selectFilterType = document.getElementById('filter-user-type');
        if (selectFilterType) selectFilterType.onchange = renderUsersList;

        var selectFilterStatus = document.getElementById('filter-user-status');
        if (selectFilterStatus) selectFilterStatus.onchange = renderUsersList;

        var btnBackToUsers = document.getElementById('btn-back-to-users-list');
        if (btnBackToUsers) {
            btnBackToUsers.onclick = function() {
                var detailView = document.getElementById('user-profile-detail-view');
                var listView = document.getElementById('users-list-view-container');
                if (detailView) detailView.classList.add('hidden');
                if (listView) listView.classList.remove('hidden');
                renderUsersList();
            };
        }

        var btnOpenModal = document.getElementById('btn-open-create-user-modal');
        if (btnOpenModal) {
            btnOpenModal.onclick = function() {
                openCreateUserModal();
            };
        }

        // Vinculação programática direta no formulário de cadastro/edição
        var formCreate = document.getElementById('create-user-form');
        if (formCreate) {
            formCreate.onsubmit = handleSaveNewUser;
            formCreate.addEventListener('submit', handleSaveNewUser);
        }

        // Máscara dinâmica de CPF
        var cpfInput = document.getElementById('new-user-cpf');
        if (cpfInput) {
            cpfInput.oninput = function(e) {
                var v = e.target.value.replace(/\D/g, '').substring(0, 11);
                if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                e.target.value = v;
            };
        }

        renderUsersList();
    }

    // Exposição Global
    global.getStoredUsers = getStoredUsers;
    global.saveStoredUsers = saveStoredUsers;
    global.isConfigGroup = isConfigGroup;
    global.getLoggedUserSchool = getLoggedUserSchool;
    global.generateAutoCredentials = generateAutoCredentials;
    global.handleUserRoleChange = handleUserRoleChange;
    global.openCreateUserModal = openCreateUserModal;
    global.handleSaveNewUser = handleSaveNewUser;
    global.renderUsersList = renderUsersList;
    global.loadUsersList = renderUsersList;
    global.handleViewUserProfile = handleViewUserProfile;
    global.openUserProfileDetail = openUserProfileDetail;
    global.handleCopyUserCredentials = handleCopyUserCredentials;
    global.handleDeleteUser = handleDeleteUser;
    global.initAdminUsersModule = initAdminUsersModule;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminUsersModule);
    } else {
        setTimeout(initAdminUsersModule, 100);
    }

})(typeof window !== 'undefined' ? window : this);
