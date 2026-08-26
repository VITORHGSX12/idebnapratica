// =========================================================================
// GESTÃO DE USUÁRIOS & CONTROLE RBAC (MODULAR ENGINE)
// Responsabilidade: Listagem da equipe municipal, RBAC por escola e função,
// cadastro com geração automática de credenciais, cópia de login e perfil.
// =========================================================================

(function(global) {
    'use strict';

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

        if (emailInput) emailInput.value = slug + '@goncalvesdias.ma.gov.br';
        if (passInput && !passInput.value) passInput.value = 'Gondias@2026';
    }

    /**
     * Trata a alteração de cargo/perfil no formulário de cadastro
     */
    function handleUserRoleChange(role) {
        generateAutoCredentials();
    }

    /**
     * Renderiza a tabela da equipe com isolamento por RBAC e filtros
     */
    function renderUsersList() {
        var tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        var canConfigure = typeof global.isConfigGroup === 'function' ? global.isConfigGroup() : true;
        var btnCreateUser = document.getElementById('btn-open-create-user-modal');
        if (btnCreateUser) {
            btnCreateUser.style.display = canConfigure ? 'inline-flex' : 'none';
        }

        var typeFilter = (document.getElementById('filter-user-type') && document.getElementById('filter-user-type').value) || 'all';
        var statusFilter = (document.getElementById('filter-user-status') && document.getElementById('filter-user-status').value) || 'all';
        var searchInput = document.getElementById('filter-user-search');
        var query = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';
        var userSchool = typeof global.getLoggedUserSchool === 'function' ? global.getLoggedUserSchool().toLowerCase().trim() : '';

        var users = typeof global.getStoredUsers === 'function' ? global.getStoredUsers() : [];

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
        var users = typeof global.getStoredUsers === 'function' ? global.getStoredUsers() : [];
        var u = users.find(function(user) { return user.id === id; });
        if (u) openUserProfileDetail(u);
    }

    function openUserProfileDetail(user) {
        var listView = document.getElementById('users-list-view-container');
        var detailView = document.getElementById('user-profile-detail-view');
        if (!listView || !detailView) return;

        listView.classList.add('hidden');
        detailView.classList.remove('hidden');

        var canConfigure = typeof global.isConfigGroup === 'function' ? global.isConfigGroup() : true;
        var btnEdit = document.getElementById('btn-profile-edit-user');
        if (btnEdit) {
            btnEdit.style.display = canConfigure ? 'inline-flex' : 'none';
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
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                if (typeof global.showToast === 'function') global.showToast('Credenciais copiadas com sucesso!', 'check-circle');
            }).catch(function() {
                prompt('Copie as credenciais de acesso:', text);
            });
        } else {
            prompt('Copie as credenciais de acesso:', text);
        }
    }

    /**
     * Exclui usuário com validação de perfil RBAC
     */
    async function handleDeleteUser(id) {
        var canConfigure = typeof global.isConfigGroup === 'function' ? global.isConfigGroup() : true;
        if (!canConfigure) {
            if (typeof global.showToast === 'function') global.showToast('Operação bloqueada: Apenas administradores podem excluir usuários.', 'alert-triangle');
            return;
        }

        if (confirm('Deseja realmente revogar o acesso e excluir este usuário?')) {
            var current = typeof global.getStoredUsers === 'function' ? global.getStoredUsers().filter(function(u) { return u.id !== id; }) : [];
            if (typeof global.saveStoredUsers === 'function') global.saveStoredUsers(current);

            try {
                var token = sessionStorage.getItem('authToken') || localStorage.getItem('authToken');
                if (token) {
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
        var modalCreate = document.getElementById('create-user-modal');
        if (btnOpenModal && modalCreate) {
            btnOpenModal.onclick = function() {
                modalCreate.classList.remove('hidden');
                modalCreate.style.display = 'flex';
                generateAutoCredentials();
            };
        }

        renderUsersList();
    }

    // Exposição Global
    global.generateAutoCredentials = generateAutoCredentials;
    global.handleUserRoleChange = handleUserRoleChange;
    global.renderUsersList = renderUsersList;
    global.handleViewUserProfile = handleViewUserProfile;
    global.openUserProfileDetail = openUserProfileDetail;
    global.handleCopyUserCredentials = handleCopyUserCredentials;
    global.handleDeleteUser = handleDeleteUser;
    global.initAdminUsersModule = initAdminUsersModule;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminUsersModule);
    } else {
        setTimeout(initAdminUsersModule, 220);
    }

})(typeof window !== 'undefined' ? window : this);
