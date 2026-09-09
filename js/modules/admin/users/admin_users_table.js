// =========================================================================
// GESTÃO DE USUÁRIOS & CONTROLE RBAC - LISTAGEM & TABELA (MULTI-PERFIL)
// SEMED Gonçalves Dias - MA • IDEB na Prática
// =========================================================================

(function(global) {
    'use strict';

    function isConfigGroup() {
        if (typeof global.isConfigGroup === 'function') return global.isConfigGroup();
        try {
            var role = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userRole')) ||
                       (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) || '';
            var r = role.toLowerCase();
            return r.includes('admin') || r.includes('gestor') || r.includes('semed') || r.includes('master');
        } catch(e) { return true; }
    }

    function getLoggedUserSchool() {
        if (typeof global.getLoggedUserSchool === 'function') return global.getLoggedUserSchool();
        try {
            return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userSchool')) ||
                   (typeof localStorage !== 'undefined' && localStorage.getItem('userSchool')) || '';
        } catch(e) { return ''; }
    }

    function getStoredUsers() {
        if (typeof global.getStoredUsers === 'function') return global.getStoredUsers();
        return [];
    }

    function saveStoredUsers(users) {
        if (typeof global.saveStoredUsers === 'function') global.saveStoredUsers(users);
    }

    function getRoleBadgeClass(role) {
        var r = String(role || '').toLowerCase();
        if (r.includes('admin') || r.includes('dpo') || r.includes('ti')) return 'badge-purple';
        if (r.includes('gestor') || r.includes('semed')) return 'badge-purple';
        if (r.includes('diretor')) return 'badge-blue';
        if (r.includes('coordenador')) return 'badge-blue';
        if (r.includes('aee')) return 'badge-indigo';
        return 'badge-green';
    }

    function renderUserRoleBadges(u) {
        var rolesList = (Array.isArray(u.perfis) && u.perfis.length > 0) ? u.perfis : [u.tipo || u.role || 'Professor(a)'];
        return '<div style="display:flex; flex-wrap:wrap; gap:4px;">' + rolesList.map(function(r) {
            var bClass = getRoleBadgeClass(r);
            return '<span class="badge ' + bClass + '" style="font-size:0.7rem; font-weight:600; padding:2px 8px;">' + r + '</span>';
        }).join('') + '</div>';
    }

    function renderUsersList() {
        if (typeof document === 'undefined') return;
        var tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        var allUsers = getStoredUsers();
        var userSchool = getLoggedUserSchool();
        var canConfigure = isConfigGroup();

        var filterType = document.getElementById('filter-user-type');
        var filterSearch = document.getElementById('filter-user-search');
        var filterStatus = document.getElementById('filter-user-status');

        var typeVal = filterType ? filterType.value : 'all';
        var searchVal = filterSearch ? filterSearch.value.toLowerCase().trim() : '';
        var statusVal = filterStatus ? filterStatus.value : 'all';

        var filtered = allUsers.filter(function(u) {
            if (!canConfigure && userSchool && userSchool !== 'Todas as Escolas (SEMED)') {
                if (u.escola && u.escola !== 'Todas as Escolas (SEMED)' && u.escola !== userSchool) return false;
            }
            if (typeVal && typeVal !== 'all') {
                var uRoles = (Array.isArray(u.perfis) && u.perfis.length > 0) ? u.perfis.join(' ').toLowerCase() : (u.tipo || u.role || '').toLowerCase();
                if (!uRoles.includes(typeVal.toLowerCase())) return false;
            }
            if (statusVal && statusVal !== 'all') {
                if ((u.status || 'Ativo').toLowerCase() !== statusVal.toLowerCase()) return false;
            }
            if (searchVal) {
                var matchName = (u.nome || '').toLowerCase().includes(searchVal);
                var matchEmail = (u.email || '').toLowerCase().includes(searchVal);
                var cleanQueryDigits = searchVal.replace(/\D/g, '');
                var matchCpf = cleanQueryDigits.length >= 3 && (u.cpf || '').replace(/\D/g, '').includes(cleanQueryDigits);
                var matchEscola = (u.escola || '').toLowerCase().includes(searchVal);
                var matchId = (u.id || '').toLowerCase().includes(searchVal);
                if (!matchName && !matchEmail && !matchCpf && !matchEscola && !matchId) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-gray-500">Nenhum profissional encontrado com os filtros selecionados.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(u) {
            var statusBadge = (u.status || 'Ativo') === 'Ativo' ? 'badge-success' : 'badge-warning';
            var safeSenha = (u.senha || 'Gondias@2026').replace(/'/g, "\\'");
            var safeEmail = (u.email || '').replace(/'/g, "\\'");
            var safeNome = (u.nome || '').replace(/'/g, "\\'");
            var badgesHtml = renderUserRoleBadges(u);

            return [
                '<tr>',
                '  <td class="font-mono text-xs font-semibold text-gray-700">' + (u.id || '-') + '</td>',
                '  <td>',
                '    <div class="font-bold text-gray-900">' + (u.nome || '-') + '</div>',
                '    <div class="text-xs text-gray-500">' + (u.email || '-') + (u.cpf ? ' • CPF: ' + u.cpf : '') + '</div>',
                '  </td>',
                '  <td>' + badgesHtml + '</td>',
                '  <td>',
                '    <div class="text-xs font-medium text-gray-800">' + (u.escola || 'Todas as Escolas (SEMED)') + '</div>',
                '    ' + (u.turma ? '<span class="text-xs text-blue-600 font-semibold">' + u.turma + '</span>' : ''),
                '  </td>',
                '  <td><span class="badge ' + statusBadge + '">' + (u.status || 'Ativo') + '</span></td>',
                '  <td><span class="text-xs text-gray-500">' + (u.ultimoAcesso || 'Hoje, 08:30') + '</span></td>',
                '  <td class="text-right whitespace-nowrap">',
                '    <button class="btn btn-sm btn-ghost" title="Visualizar Perfil" onclick="handleViewUserProfile(\'' + u.id + '\')"><i data-lucide="eye" class="w-4 h-4"></i></button>',
                '    <button class="btn btn-sm btn-ghost" title="Copiar Credenciais de Acesso" onclick="handleCopyUserCredentials(\'' + safeEmail + '\', \'' + safeSenha + '\', \'' + safeNome + '\')"><i data-lucide="copy" class="w-4 h-4"></i></button>',
                '    <button class="btn btn-sm btn-ghost" title="Resetar Senha" onclick="handleResetUserPassword(\'' + u.id + '\')"><i data-lucide="key" class="w-4 h-4"></i></button>',
                (canConfigure ? '    <button class="btn btn-sm btn-ghost text-red-600" title="Excluir Usuário" onclick="handleDeleteUser(\'' + u.id + '\')"><i data-lucide="trash-2" class="w-4 h-4"></i></button>' : ''),
                '  </td>',
                '</tr>'
            ].join('\n');
        }).join('');

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function handleResetUserPassword(id) {
        var users = getStoredUsers();
        var target = users.find(function(u) { return u.id === id; });
        if (!target) return;
        var confirmed = typeof global.confirm === 'function' 
            ? global.confirm('Deseja resetar a senha de acesso de ' + target.nome + ' para a senha padrão institucional (Gondias@2026)?') 
            : true;
        if (confirmed) {
            target.senha = 'Gondias@2026';
            target.password = 'Gondias@2026';
            saveStoredUsers(users);
            renderUsersList();
            if (typeof global.showToast === 'function') {
                global.showToast('Senha de ' + target.nome + ' redefinida para: Gondias@2026', 'check-circle');
            }
        }
    }

    function handleViewUserProfile(id) {
        var users = getStoredUsers();
        var u = users.find(function(user) { return user.id === id; });
        if (u) openUserProfileDetail(u);
    }

    function openUserProfileDetail(user) {
        if (typeof document === 'undefined') return;
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
                if (typeof global.openCreateUserModal === 'function') {
                    global.openCreateUserModal(user.id);
                }
            };
        }

        var rolesList = (Array.isArray(user.perfis) && user.perfis.length > 0) ? user.perfis : [user.tipo || user.role || 'Usuário'];
        var isConfigRole = rolesList.some(function(r) {
            var rl = r.toLowerCase();
            return rl.includes('admin') || rl.includes('gestor') || rl.includes('semed');
        });

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
        if (badgeEl) {
            badgeEl.innerHTML = renderUserRoleBadges(user);
        }
        if (idEl) idEl.textContent = user.id;
        if (cpfEl) cpfEl.textContent = user.cpf || '-';
        if (statusEl) statusEl.textContent = user.status || 'Ativo';
        if (phoneEl) phoneEl.textContent = user.telefone || '-';
        if (emailEl) emailEl.textContent = user.email || '-';
        if (schoolEl) schoolEl.textContent = user.escola || 'Todas as Escolas (SEMED)';
        if (funcEscolaEl) funcEscolaEl.textContent = user.escola || 'Todas as Escolas (SEMED)';
        if (funcTurmaEl) funcTurmaEl.textContent = user.turma || 'Todas as Turmas / Não aplicável';

        if (rbacBadge) {
            rbacBadge.textContent = isConfigRole ? 'Acesso Total (SEMED / Master TI)' : 'Acesso Setorial (Escola / Turma)';
            rbacBadge.className = isConfigRole ? 'badge badge-purple' : 'badge badge-blue';
        }
        if (rbacDesc) {
            if (isConfigRole) {
                rbacDesc.textContent = 'Este usuário possui permissão plena para visualização global da rede, importação/exportação de dados do IDEB, cálculo de metas municipais e gerenciamento de permissões.';
            } else {
                rbacDesc.textContent = 'Este usuário possui acesso direcionado à sua unidade escolar (' + (user.escola || 'Escola Lotação') + ') e aos estudantes matriculados em suas respectivas turmas.';
            }
        }

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function handleCopyUserCredentials(email, senha, nome) {
        var text = [
            '🏛️ *IDEB na Prática — SEMED Gonçalves Dias - MA*',
            'Olá ' + (nome || '') + ', segue seu acesso institucional:',
            '',
            '👤 *Usuário:* ' + email,
            '🔑 *Senha Inicial:* ' + senha,
            '🌐 *Acesse em:* ' + (typeof window !== 'undefined' ? window.location.origin : 'https://idebnapratica.goncalvesdias.ma.gov.br')
        ].join('\n');

        var nav = (typeof window !== 'undefined' && window.navigator) ? window.navigator : (typeof navigator !== 'undefined' ? navigator : ((typeof global !== 'undefined' && global.navigator) ? global.navigator : null));
        if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
            nav.clipboard.writeText(text).then(function() {
                if (typeof global.showToast === 'function') global.showToast('Credenciais formatadas copiadas para a área de transferência!', 'check-circle');
            }).catch(function() {
                fallbackCopyText(text);
            });
        } else {
            fallbackCopyText(text);
        }
    }

    function fallbackCopyText(text) {
        try {
            if (typeof document === 'undefined') return;
            var area = document.createElement('textarea');
            area.value = text;
            document.body.appendChild(area);
            area.select();
            document.execCommand('copy');
            document.body.removeChild(area);
            if (typeof global.showToast === 'function') global.showToast('Credenciais copiadas com sucesso!', 'check-circle');
        } catch(e) {
            if (typeof prompt === 'function') prompt('Copie as credenciais de acesso:', text);
        }
    }

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

    var AdminUsersTable = {
        renderUsersList: renderUsersList,
        renderUserRoleBadges: renderUserRoleBadges,
        getRoleBadgeClass: getRoleBadgeClass,
        handleResetUserPassword: handleResetUserPassword,
        handleViewUserProfile: handleViewUserProfile,
        openUserProfileDetail: openUserProfileDetail,
        handleCopyUserCredentials: handleCopyUserCredentials,
        fallbackCopyText: fallbackCopyText,
        handleDeleteUser: handleDeleteUser
    };

    global.AdminUsersTable = AdminUsersTable;
    global.renderUsersList = renderUsersList;
    global.loadUsersList = renderUsersList;
    global.renderUserRoleBadges = renderUserRoleBadges;
    global.handleResetUserPassword = handleResetUserPassword;
    global.handleViewUserProfile = handleViewUserProfile;
    global.openUserProfileDetail = openUserProfileDetail;
    global.handleCopyUserCredentials = handleCopyUserCredentials;
    global.handleDeleteUser = handleDeleteUser;

})(typeof window !== 'undefined' ? window : this);
