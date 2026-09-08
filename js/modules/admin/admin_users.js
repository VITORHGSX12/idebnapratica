// =========================================================================
// GESTÃO DE USUÁRIOS & CONTROLE RBAC (MODULAR ENGINE)
// SEMED Gonçalves Dias - MA • IDEB na Prática
// Validação de CPF, Data de Nascimento, RBAC por Escola, Reset de Senha
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY_ADMIN_USERS = 'saas_admin_users_db';
    var editingUserId = null;

    var ESCOLAS_TURMAS_MAP = {
        'UI JOSE CORREA LIMA': ['2º Ano A', '5º Ano A', '9º Ano A'],
        'UI EMILIO MURAD': ['2º Ano A', '5º Ano A', '9º Ano A'],
        'UE VEREADOR LEONARDO FERREIRA LIMA': ['2º Ano A', '5º Ano A', '9º Ano A'],
        'U I BASILIO ALVES': ['2º Ano A', '5º Ano A', '9º Ano A'],
        'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ': ['1º Ano A', '2º Ano A', '3º Ano A', '4º Ano A', '5º Ano A', '6º Ano A', '7º Ano A', '8º Ano A', '9º Ano A', '9º Ano B'],
        'UE RAIMUNDO DOS REIS DA SILVA': ['2º Ano A', '5º Ano A'],
        'UNIDADE INTEGRADA JOSE GONCALVES DIAS': ['2º Ano A', '5º Ano A', '9º Ano A'],
        'UNIDADE ESCOLAR ANISIO GOMES': ['2º Ano A', '5º Ano A', '9º Ano A'],
        'UE ANITA FURTADO': ['2º Ano A', '5º Ano A']
    };

    function isValidCPF(cpf) {
        if (!cpf) return false;
        var clean = String(cpf).replace(/\D/g, '');
        if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

        var soma = 0;
        for (var i = 0; i < 9; i++) soma += parseInt(clean.charAt(i), 10) * (10 - i);
        var resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(clean.charAt(9), 10)) return false;

        soma = 0;
        for (var j = 0; j < 10; j++) soma += parseInt(clean.charAt(j), 10) * (11 - j);
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== parseInt(clean.charAt(10), 10)) return false;

        return true;
    }

    function isDuplicateCPF(cpf, currentId, usersList) {
        if (!cpf) return false;
        var clean = String(cpf).replace(/\D/g, '');
        if (!clean) return false;
        var users = usersList || getStoredUsers();
        return users.some(function(u) {
            if (currentId && u.id === currentId) return false;
            var uClean = String(u.cpf || '').replace(/\D/g, '');
            return uClean && uClean === clean;
        });
    }

    function isDuplicateEmail(email, currentId, usersList) {
        if (!email) return false;
        var norm = String(email).trim().toLowerCase();
        var users = usersList || getStoredUsers();
        return users.some(function(u) {
            if (currentId && u.id === currentId) return false;
            return String(u.email || '').trim().toLowerCase() === norm;
        });
    }

    function validateBirthDate(dateStr) {
        if (!dateStr || !dateStr.trim()) {
            return { valid: false, error: 'A data de nascimento é obrigatória.' };
        }
        var parts = dateStr.trim().split('/');
        if (parts.length !== 3) {
            parts = dateStr.trim().split('-');
            if (parts.length === 3 && parts[0].length === 4) parts = [parts[2], parts[1], parts[0]];
            else return { valid: false, error: 'Data de nascimento deve estar no formato DD/MM/AAAA.' };
        }
        var dia = parseInt(parts[0], 10), mes = parseInt(parts[1], 10), ano = parseInt(parts[2], 10);
        if (isNaN(dia) || isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 1920) {
            return { valid: false, error: 'Data de nascimento informada é inválida.' };
        }
        var dateObj = new Date(ano, mes - 1, dia);
        if (dateObj.getFullYear() !== ano || dateObj.getMonth() !== mes - 1 || dateObj.getDate() !== dia) {
            return { valid: false, error: 'Data de calendário inexistente.' };
        }
        var hoje = new Date();
        if (dateObj > hoje) return { valid: false, error: 'Data de nascimento inválida (data futura não permitida).' };
        var idade = hoje.getFullYear() - ano;
        var m = hoje.getMonth() - (mes - 1);
        if (m < 0 || (m === 0 && hoje.getDate() < dia)) idade--;

        if (idade < 18) {
            return { valid: false, error: 'O profissional deve ter idade mínima de 18 anos para cadastro (idade calculada: ' + idade + ' anos).' };
        }
        if (idade >= 90 || idade > 85) {
            return { valid: false, error: 'Data de nascimento irregular: profissionais com ' + idade + ' anos não podem ser cadastrados no sistema.' };
        }
        return { valid: true, idade: idade, formatted: String(dia).padStart(2, '0') + '/' + String(mes).padStart(2, '0') + '/' + ano };
    }

    function getStoredUsers() {
        try {
            if (typeof localStorage !== 'undefined') {
                var raw = localStorage.getItem(STORAGE_KEY_ADMIN_USERS);
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                }
            }
        } catch(e) {}
        var initial = (global.DEFAULT_STAFF_USERS && global.DEFAULT_STAFF_USERS.slice()) || [];
        saveStoredUsers(initial);
        return initial;
    }

    function saveStoredUsers(users) {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(users));
            }
            if (Array.isArray(users) && global.OFFICIAL_REGISTERED_USERS) {
                users.forEach(function(u) {
                    var exists = global.OFFICIAL_REGISTERED_USERS.some(function(ofU) {
                        return ofU.email && ofU.email.toLowerCase() === (u.email || '').toLowerCase();
                    });
                    if (!exists) {
                        global.OFFICIAL_REGISTERED_USERS.push({
                            email: u.email,
                            nome: u.nome,
                            role: u.role || u.tipo || 'Professor',
                            subRole: (u.tipo || u.role) + ' • ' + (u.escola || 'Rede Municipal'),
                            escola: u.escola || '',
                            turma: u.turma || ''
                        });
                    }
                });
            }
        } catch(e) {}
    }

    function isConfigGroup() {
        try {
            var role = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userRole')) ||
                       (typeof localStorage !== 'undefined' && localStorage.getItem('userRole')) || '';
            var r = role.toLowerCase();
            return r.includes('admin') || r.includes('gestor') || r.includes('semed') || r.includes('master');
        } catch(e) { return true; }
    }

    function getLoggedUserSchool() {
        try {
            return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userSchool')) ||
                   (typeof localStorage !== 'undefined' && localStorage.getItem('userSchool')) || '';
        } catch(e) { return ''; }
    }

    function generateAutoCredentials() {
        if (typeof document === 'undefined') return;
        var nameInput = document.getElementById('new-user-name');
        var emailInput = document.getElementById('new-user-email');
        var passInput = document.getElementById('new-user-password');
        if (!nameInput || !emailInput || !passInput) return;

        var nameVal = nameInput.value.trim();
        if (!nameVal) return;
        var parts = nameVal.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
        var login = parts.length === 1 ? parts[0] : (parts[0] + '.' + parts[parts.length - 1]);
        if (!emailInput.value || emailInput.value.includes('@goncalvesdias.ma.gov.br')) {
            emailInput.value = login + '@goncalvesdias.ma.gov.br';
        }
        if (!passInput.value) passInput.value = 'Gondias@2026';
    }

    function handleUserRoleChange() {
        if (typeof document === 'undefined') return;
        var roleSelect = document.getElementById('new-user-role');
        var schoolSelect = document.getElementById('new-user-school');
        var turmaContainer = document.getElementById('new-user-turma-container');
        if (!roleSelect) return;
        var role = roleSelect.value;
        var isDocente = role === 'Professor(a)';

        if (turmaContainer) {
            turmaContainer.style.display = isDocente ? 'block' : 'none';
            if (isDocente) handleUserSchoolChange();
        }
        if (schoolSelect) {
            var semedOption = schoolSelect.querySelector('option[value="Todas as Escolas (SEMED)"]');
            if (semedOption) {
                if (isDocente || role === 'Diretor(a) Escolar' || role === 'Coordenador(a)') {
                    semedOption.disabled = true;
                    if (schoolSelect.value === 'Todas as Escolas (SEMED)') schoolSelect.value = 'UI JOSE CORREA LIMA';
                } else {
                    semedOption.disabled = false;
                }
            }
        }
    }

    function handleUserSchoolChange() {
        if (typeof document === 'undefined') return;
        var schoolSelect = document.getElementById('new-user-school');
        var turmaSelect = document.getElementById('new-user-turma');
        if (!schoolSelect || !turmaSelect) return;

        var escola = schoolSelect.value;
        var turmas = ESCOLAS_TURMAS_MAP[escola] || ['2º Ano A', '5º Ano A', '9º Ano A'];
        turmaSelect.innerHTML = turmas.map(function(t) {
            return '<option value="' + t + '">' + t + '</option>';
        }).join('');
    }

    function openCreateUserModal(userId) {
        if (typeof document === 'undefined') return;
        var modal = document.getElementById('create-user-modal');
        var form = document.getElementById('create-user-form');
        var titleEl = document.getElementById('modal-user-title');
        if (!modal) return;

        editingUserId = userId || null;
        if (form && typeof form.reset === 'function') form.reset();

        var nameInput = document.getElementById('new-user-name');
        var cpfInput = document.getElementById('new-user-cpf');
        var birthInput = document.getElementById('new-user-birth');
        var phoneInput = document.getElementById('new-user-phone');
        var roleSelect = document.getElementById('new-user-role');
        var schoolSelect = document.getElementById('new-user-school');
        var turmaSelect = document.getElementById('new-user-turma');
        var emailInput = document.getElementById('new-user-email');
        var passInput = document.getElementById('new-user-password');

        if (editingUserId) {
            if (titleEl) titleEl.textContent = 'Editar Usuário da Equipe';
            var users = getStoredUsers();
            var target = users.find(function(u) { return u.id === editingUserId; });
            if (target) {
                if (nameInput) nameInput.value = target.nome || '';
                if (cpfInput) cpfInput.value = target.cpf || '';
                if (birthInput) birthInput.value = target.nascimento || target.dataNascimento || '';
                if (phoneInput) phoneInput.value = target.telefone || '';
                if (roleSelect) roleSelect.value = target.tipo || target.role || 'Professor(a)';
                if (schoolSelect) schoolSelect.value = target.escola || 'UI JOSE CORREA LIMA';
                handleUserRoleChange();
                if (turmaSelect && target.turma) turmaSelect.value = target.turma;
                if (emailInput) emailInput.value = target.email || '';
                if (passInput) passInput.value = target.senha || 'Gondias@2026';
            }
        } else {
            if (titleEl) titleEl.textContent = 'Cadastrar Novo Usuário';
            if (roleSelect) roleSelect.value = 'Professor(a)';
            if (schoolSelect) schoolSelect.value = 'UI JOSE CORREA LIMA';
            handleUserRoleChange();
            if (nameInput) {
                nameInput.oninput = function() {
                    generateAutoCredentials();
                };
            }
        }

        if (roleSelect) roleSelect.onchange = handleUserRoleChange;
        if (schoolSelect) schoolSelect.onchange = handleUserSchoolChange;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeCreateUserModal() {
        if (typeof document === 'undefined') return;
        var modal = document.getElementById('create-user-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        editingUserId = null;
    }

    async function handleSaveNewUser(e) {
        if (e && typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof document === 'undefined') return;

        var nameInput = document.getElementById('new-user-name');
        var cpfInput = document.getElementById('new-user-cpf');
        var birthInput = document.getElementById('new-user-birth');
        var phoneInput = document.getElementById('new-user-phone');
        var roleSelect = document.getElementById('new-user-role');
        var schoolSelect = document.getElementById('new-user-school');
        var turmaSelect = document.getElementById('new-user-turma');
        var emailInput = document.getElementById('new-user-email');
        var passInput = document.getElementById('new-user-password');

        var nome = nameInput ? nameInput.value.trim() : '';
        var cpf = cpfInput ? cpfInput.value.trim() : '';
        var birth = birthInput ? birthInput.value.trim() : '';
        var telefone = phoneInput ? phoneInput.value.trim() : '';
        var role = roleSelect ? roleSelect.value : 'Professor(a)';
        var escola = schoolSelect ? schoolSelect.value : 'UI JOSE CORREA LIMA';
        var turma = (role === 'Professor(a)' && turmaSelect) ? turmaSelect.value : '';
        var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        var senha = passInput ? passInput.value.trim() : 'Gondias@2026';

        if (!nome) {
            if (typeof global.showToast === 'function') global.showToast('Por favor, informe o nome completo do profissional.', 'alert-triangle');
            return;
        }

        if (!isValidCPF(cpf)) {
            if (typeof global.showToast === 'function') global.showToast('CPF inválido! Verifique os dígitos verificadores informados.', 'alert-triangle');
            if (cpfInput) cpfInput.focus();
            return;
        }

        var users = getStoredUsers();
        if (isDuplicateCPF(cpf, editingUserId, users)) {
            if (typeof global.showToast === 'function') global.showToast('Atenção: Este CPF já está cadastrado para outro profissional da rede!', 'alert-circle');
            if (cpfInput) cpfInput.focus();
            return;
        }

        var birthResult = validateBirthDate(birth);
        if (!birthResult.valid) {
            if (typeof global.showToast === 'function') global.showToast(birthResult.error, 'alert-triangle');
            if (birthInput) birthInput.focus();
            return;
        }

        if (isDuplicateEmail(email, editingUserId, users)) {
            if (typeof global.showToast === 'function') global.showToast('Este email institucional já está em uso por outro usuário.', 'alert-circle');
            if (emailInput) emailInput.focus();
            return;
        }

        if (role === 'Professor(a)' && !turma) {
            if (typeof global.showToast === 'function') global.showToast('Selecione a turma vinculada ao professor.', 'alert-triangle');
            return;
        }

        var newUserObj = {
            id: editingUserId || ('USR-' + String(Date.now()).slice(-4)),
            nome: nome,
            cpf: cpf,
            nascimento: birthResult.formatted,
            idade: birthResult.idade,
            telefone: telefone || '(99) 98800-0000',
            tipo: role,
            role: role,
            escola: escola,
            turma: turma,
            email: email,
            senha: senha,
            status: 'Ativo',
            dataCriacao: new Date().toISOString()
        };

        if (editingUserId) {
            var idx = users.findIndex(function(u) { return u.id === editingUserId; });
            if (idx >= 0) users[idx] = Object.assign(users[idx], newUserObj);
            else users.push(newUserObj);
        } else {
            users.push(newUserObj);
        }

        saveStoredUsers(users);

        try {
            var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                        (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));
            if (token && typeof fetch === 'function') {
                await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(newUserObj)
                });
            }
        } catch(err) {
            console.warn('[Sync API Server Warning]', err);
        }

        closeCreateUserModal();
        renderUsersList();

        var msg = editingUserId ? ('Dados de ' + nome + ' atualizados com sucesso!') : ('Profissional ' + nome + ' cadastrado com sucesso!');
        if (typeof global.showToast === 'function') global.showToast(msg, 'check-circle');
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
                var uRole = (u.tipo || u.role || '').toLowerCase();
                if (!uRole.includes(typeVal.toLowerCase())) return false;
            }
            if (statusVal && statusVal !== 'all') {
                if ((u.status || 'Ativo').toLowerCase() !== statusVal.toLowerCase()) return false;
            }
            if (searchVal) {
                var matchName = (u.nome || '').toLowerCase().includes(searchVal);
                var matchEmail = (u.email || '').toLowerCase().includes(searchVal);
                var matchCpf = (u.cpf || '').replace(/\D/g, '').includes(searchVal.replace(/\D/g, ''));
                var matchEscola = (u.escola || '').toLowerCase().includes(searchVal);
                if (!matchName && !matchEmail && !matchCpf && !matchEscola) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center py-6 text-gray-500">Nenhum profissional encontrado com os filtros selecionados.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(u) {
            var roleBadge = u.tipo === 'Master Admin' ? 'badge-purple' : (u.tipo === 'Diretor(a) Escolar' ? 'badge-blue' : 'badge-green');
            var statusBadge = (u.status || 'Ativo') === 'Ativo' ? 'badge-success' : 'badge-warning';
            var safeSenha = (u.senha || 'Gondias@2026').replace(/'/g, "\\'");
            var safeEmail = (u.email || '').replace(/'/g, "\\'");

            return [
                '<tr>',
                '  <td class="font-mono text-xs font-semibold text-gray-700">' + (u.id || '-') + '</td>',
                '  <td>',
                '    <div class="font-bold text-gray-900">' + (u.nome || '-') + '</div>',
                '    <div class="text-xs text-gray-500">' + (u.email || '-') + (u.cpf ? ' • CPF: ' + u.cpf : '') + '</div>',
                '  </td>',
                '  <td><span class="badge ' + roleBadge + '">' + (u.tipo || u.role || 'Usuário') + '</span></td>',
                '  <td>',
                '    <div class="text-xs font-medium text-gray-800">' + (u.escola || 'Todas as Escolas (SEMED)') + '</div>',
                '    ' + (u.turma ? '<span class="text-xs text-blue-600 font-semibold">' + u.turma + '</span>' : ''),
                '  </td>',
                '  <td><span class="badge ' + statusBadge + '">' + (u.status || 'Ativo') + '</span></td>',
                '  <td><span class="text-xs text-gray-500">' + (u.ultimoAcesso || 'Hoje, 08:30') + '</span></td>',
                '  <td class="text-right whitespace-nowrap">',
                '    <button class="btn btn-sm btn-ghost" title="Visualizar Perfil" onclick="handleViewUserProfile(\'' + u.id + '\')"><i data-lucide="eye" class="w-4 h-4"></i></button>',
                '    <button class="btn btn-sm btn-ghost" title="Copiar Credenciais" onclick="handleCopyUserCredentials(\'' + safeEmail + '\', \'' + safeSenha + '\')"><i data-lucide="copy" class="w-4 h-4"></i></button>',
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
            btnEdit.onclick = function() { openCreateUserModal(user.id); };
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

    function handleCopyUserCredentials(email, senha) {
        var text = 'Sistema IDEB na Prática (SEMED Gonçalves Dias)\nLogin: ' + email + '\nSenha: ' + senha;
        var nav = (typeof window !== 'undefined' && window.navigator) ? window.navigator : (typeof navigator !== 'undefined' ? navigator : ((typeof global !== 'undefined' && global.navigator) ? global.navigator : null));
        if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
            nav.clipboard.writeText(text).then(function() {
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

    function initAdminUsersModule() {
        if (typeof document === 'undefined') return;
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
            btnOpenModal.onclick = function() { openCreateUserModal(); };
        }

        var formCreate = document.getElementById('create-user-form');
        if (formCreate) {
            formCreate.onsubmit = handleSaveNewUser;
            formCreate.addEventListener('submit', handleSaveNewUser);
        }

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

        var birthInput = document.getElementById('new-user-birth');
        if (birthInput) {
            birthInput.oninput = function(e) {
                var v = e.target.value.replace(/\D/g, '').substring(0, 8);
                if (v.length > 4) v = v.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
                else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,2})/, '$1/$2');
                e.target.value = v;
            };
        }

        renderUsersList();
    }

    // Exposição Global
    global.isValidCPF = isValidCPF;
    global.isDuplicateCPF = isDuplicateCPF;
    global.validateBirthDate = validateBirthDate;
    global.getStoredUsers = getStoredUsers;
    global.saveStoredUsers = saveStoredUsers;
    global.isConfigGroup = isConfigGroup;
    global.getLoggedUserSchool = getLoggedUserSchool;
    global.generateAutoCredentials = generateAutoCredentials;
    global.handleUserRoleChange = handleUserRoleChange;
    global.handleUserSchoolChange = handleUserSchoolChange;
    global.openCreateUserModal = openCreateUserModal;
    global.closeCreateUserModal = closeCreateUserModal;
    global.handleSaveNewUser = handleSaveNewUser;
    global.renderUsersList = renderUsersList;
    global.loadUsersList = renderUsersList;
    global.handleResetUserPassword = handleResetUserPassword;
    global.handleViewUserProfile = handleViewUserProfile;
    global.openUserProfileDetail = openUserProfileDetail;
    global.handleCopyUserCredentials = handleCopyUserCredentials;
    global.handleDeleteUser = handleDeleteUser;
    global.initAdminUsersModule = initAdminUsersModule;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAdminUsersModule);
        } else {
            setTimeout(initAdminUsersModule, 100);
        }
    }

})(typeof window !== 'undefined' ? window : this);
