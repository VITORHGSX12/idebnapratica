// =========================================================================
// GESTÃO DE USUÁRIOS & CONTROLE RBAC - FORMULÁRIO & MODAL (MULTI-PERFIL)
// SEMED Gonçalves Dias - MA • IDEB na Prática
// =========================================================================

(function(global) {
    'use strict';

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

    var editingUserId = null;

    function getValidation() {
        return global.AdminUsersValidation || {};
    }

    function generateSecureInitialPassword() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
        var rand = '';
        for (var i = 0; i < 4; i++) {
            rand += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return 'Edu@' + rand + '26';
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
        if (!emailInput.value || emailInput.value.includes('@goncalvesdias.ma.gov')) {
            emailInput.value = login + '@goncalvesdias.ma.gov.br';
        }
        if (!passInput.value) {
            passInput.value = generateSecureInitialPassword();
        }
    }

    /**
     * Retorna a lista de perfis selecionados nos checkboxes do formulário
     */
    function getSelectedUserRoles() {
        if (typeof document === 'undefined') return ['Professor(a)'];
        var checkboxes = document.querySelectorAll('input[name="user-roles"]:checked');
        if (checkboxes && checkboxes.length > 0) {
            var list = [];
            checkboxes.forEach(function(cb) { list.push(cb.value); });
            return list;
        }
        var singleRole = document.getElementById('new-user-role');
        return singleRole && singleRole.value ? [singleRole.value] : ['Professor(a)'];
    }

    /**
     * Define os perfis marcados nos checkboxes do formulário
     */
    function setSelectedUserRoles(rolesList) {
        if (typeof document === 'undefined') return;
        var normalized = (Array.isArray(rolesList) ? rolesList : [rolesList]).map(function(r) { return String(r).trim(); });
        var checkboxes = document.querySelectorAll('input[name="user-roles"]');
        if (checkboxes && checkboxes.length > 0) {
            checkboxes.forEach(function(cb) {
                cb.checked = normalized.some(function(n) {
                    return n.toLowerCase() === cb.value.toLowerCase() ||
                           (cb.value.includes('Admin') && n.toLowerCase().includes('admin')) ||
                           (cb.value.includes('Diretor') && n.toLowerCase().includes('diretor')) ||
                           (cb.value.includes('Coordenador') && n.toLowerCase().includes('coordenador')) ||
                           (cb.value.includes('Gestor') && n.toLowerCase().includes('gestor')) ||
                           (cb.value.includes('SEMED') && n.toLowerCase().includes('semed')) ||
                           (cb.value.includes('AEE') && n.toLowerCase().includes('aee')) ||
                           (cb.value.includes('Professor') && n.toLowerCase().includes('professor'));
                });
            });
        }
        var singleRole = document.getElementById('new-user-role');
        if (singleRole && normalized.length > 0) {
            singleRole.value = normalized[0];
        }
        handleUserRoleChange();
    }

    function handleUserRoleChange() {
        if (typeof document === 'undefined') return;
        var selectedRoles = getSelectedUserRoles();
        var schoolSelect = document.getElementById('new-user-school');
        var turmaContainer = document.getElementById('new-user-turma-container');
        var countBadge = document.getElementById('new-user-roles-count');
        var errRoles = document.getElementById('err-new-user-roles');
        var singleRole = document.getElementById('new-user-role');

        if (countBadge) {
            countBadge.textContent = selectedRoles.length + (selectedRoles.length === 1 ? ' selecionado' : ' selecionados');
            countBadge.className = selectedRoles.length > 0 ? 'badge badge-blue' : 'badge badge-warning';
        }

        if (errRoles) {
            if (selectedRoles.length > 0) {
                errRoles.style.display = 'none';
            }
        }

        if (singleRole && selectedRoles.length > 0) {
            singleRole.value = selectedRoles[0];
        }

        var isDocente = selectedRoles.some(function(r) { return r.includes('Professor'); });
        var isExclusivelyAdministrative = selectedRoles.every(function(r) {
            var rl = r.toLowerCase();
            return rl.includes('admin') || rl.includes('gestor') || rl.includes('semed');
        });

        if (turmaContainer) {
            turmaContainer.style.display = isDocente ? 'block' : 'none';
            if (isDocente) handleUserSchoolChange();
        }

        if (schoolSelect) {
            var semedOption = schoolSelect.querySelector('option[value="Todas as Escolas (SEMED)"]');
            if (semedOption) {
                if (isDocente && !isExclusivelyAdministrative) {
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
        var schoolSelect = document.getElementById('new-user-school');
        var turmaSelect = document.getElementById('new-user-turma');
        var emailInput = document.getElementById('new-user-email');
        var passInput = document.getElementById('new-user-password');

        var errCpf = document.getElementById('err-new-user-cpf');
        var errBirth = document.getElementById('err-new-user-birth');
        var errEmail = document.getElementById('err-new-user-email');
        var errRoles = document.getElementById('err-new-user-roles');
        if (errCpf) { errCpf.style.display = 'none'; errCpf.textContent = ''; }
        if (errBirth) { errBirth.style.display = 'none'; errBirth.textContent = ''; }
        if (errEmail) { errEmail.style.display = 'none'; errEmail.textContent = ''; }
        if (errRoles) { errRoles.style.display = 'none'; }

        if (editingUserId) {
            if (titleEl) titleEl.textContent = 'Editar Usuário da Equipe';
            var users = (typeof global.getStoredUsers === 'function') ? global.getStoredUsers() : [];
            var target = users.find(function(u) { return u.id === editingUserId; });
            if (target) {
                if (nameInput) nameInput.value = target.nome || '';
                if (cpfInput) cpfInput.value = target.cpf || '';
                if (birthInput) birthInput.value = target.nascimento || target.dataNascimento || '';
                if (phoneInput) phoneInput.value = target.telefone || '';
                if (schoolSelect) schoolSelect.value = target.escola || 'UI JOSE CORREA LIMA';
                
                var rolesToSet = target.perfis || [target.tipo || target.role || 'Professor(a)'];
                setSelectedUserRoles(rolesToSet);

                if (turmaSelect && target.turma) turmaSelect.value = target.turma;
                if (emailInput) emailInput.value = target.email || '';
                if (passInput) passInput.value = target.senha || target.password || 'Gondias@2026';
            }
        } else {
            if (titleEl) titleEl.textContent = 'Cadastrar Novo Usuário';
            setSelectedUserRoles(['Professor(a)']);
            if (schoolSelect) schoolSelect.value = 'UI JOSE CORREA LIMA';
            if (passInput) passInput.value = generateSecureInitialPassword();
            handleUserRoleChange();
            if (nameInput) {
                nameInput.oninput = function() {
                    generateAutoCredentials();
                };
            }
        }

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

        var V = getValidation();
        var isValidCPF = V.isValidCPF || global.isValidCPF || function() { return true; };
        var calculateValidCPF = V.calculateValidCPF || global.calculateValidCPF || function(r) { return r; };
        var isDuplicateCPF = V.isDuplicateCPF || global.isDuplicateCPF || function() { return false; };
        var isDuplicateEmail = V.isDuplicateEmail || global.isDuplicateEmail || function() { return false; };
        var validateBirthDate = V.validateBirthDate || global.validateBirthDate || function(d) { return { valid: true, idade: 25, formatted: d }; };

        var nameInput = document.getElementById('new-user-name');
        var cpfInput = document.getElementById('new-user-cpf');
        var birthInput = document.getElementById('new-user-birth');
        var phoneInput = document.getElementById('new-user-phone');
        var schoolSelect = document.getElementById('new-user-school');
        var turmaSelect = document.getElementById('new-user-turma');
        var emailInput = document.getElementById('new-user-email');
        var passInput = document.getElementById('new-user-password');

        var errCpf = document.getElementById('err-new-user-cpf');
        var errBirth = document.getElementById('err-new-user-birth');
        var errEmail = document.getElementById('err-new-user-email');
        var errRoles = document.getElementById('err-new-user-roles');
        if (errCpf) { errCpf.style.display = 'none'; errCpf.textContent = ''; }
        if (errBirth) { errBirth.style.display = 'none'; errBirth.textContent = ''; }
        if (errEmail) { errEmail.style.display = 'none'; errEmail.textContent = ''; }
        if (errRoles) { errRoles.style.display = 'none'; }

        var nome = nameInput ? nameInput.value.trim() : '';
        var rawCpf = cpfInput ? cpfInput.value.trim() : '';
        var birth = birthInput ? birthInput.value.trim() : '';
        var telefone = phoneInput ? phoneInput.value.trim() : '';
        var selectedRoles = getSelectedUserRoles();
        var escola = schoolSelect ? schoolSelect.value : 'UI JOSE CORREA LIMA';
        var hasDocenteRole = selectedRoles.some(function(r) { return r.includes('Professor'); });
        var turma = (hasDocenteRole && turmaSelect) ? turmaSelect.value : '';
        var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        var senha = passInput ? passInput.value.trim() : 'Gondias@2026';

        if (!nome) {
            if (typeof global.showToast === 'function') global.showToast('Por favor, informe o nome completo do profissional.', 'alert-triangle');
            if (nameInput) nameInput.focus();
            return;
        }

        // Validação de grupos de acesso: Ao menos 1 grupo deve estar selecionado
        if (!selectedRoles || selectedRoles.length === 0) {
            if (errRoles) { errRoles.style.display = 'block'; }
            if (typeof global.showToast === 'function') global.showToast('Selecione ao menos um perfil de acesso para o profissional.', 'alert-triangle');
            return;
        }

        var primaryRole = selectedRoles[0];

        // Sanitização e validação de CPF
        var cleanCpf = rawCpf.replace(/\D/g, '');
        if (cleanCpf.length !== 11) {
            var cpfMsg = 'O CPF deve conter exatamente 11 dígitos numéricos.';
            if (errCpf) { errCpf.style.display = 'block'; errCpf.textContent = cpfMsg; }
            if (typeof global.showToast === 'function') global.showToast(cpfMsg, 'alert-triangle');
            if (cpfInput) cpfInput.focus();
            return;
        }

        if (!isValidCPF(cleanCpf)) {
            cleanCpf = calculateValidCPF(cleanCpf);
            if (cpfInput) {
                cpfInput.value = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            }
        }
        var formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

        var users = (typeof global.getStoredUsers === 'function') ? global.getStoredUsers() : [];
        if (isDuplicateCPF(cleanCpf, editingUserId, users)) {
            var dupCpfMsg = 'Atenção: Este CPF já está cadastrado para outro profissional da rede!';
            if (errCpf) { errCpf.style.display = 'block'; errCpf.textContent = dupCpfMsg; }
            if (typeof global.showToast === 'function') global.showToast(dupCpfMsg, 'alert-circle');
            if (cpfInput) cpfInput.focus();
            return;
        }

        var birthResult = validateBirthDate(birth);
        if (!birthResult.valid) {
            if (errBirth) { errBirth.style.display = 'block'; errBirth.textContent = birthResult.error; }
            if (typeof global.showToast === 'function') global.showToast(birthResult.error, 'alert-triangle');
            if (birthInput) birthInput.focus();
            return;
        }

        // Normalização automática de e-mail institucional
        if (email.endsWith('@goncalvesdias.ma.gov')) {
            email = email + '.br';
            if (emailInput) emailInput.value = email;
        } else if (!email.includes('@')) {
            email = email + '@goncalvesdias.ma.gov.br';
            if (emailInput) emailInput.value = email;
        }

        if (isDuplicateEmail(email, editingUserId, users)) {
            var dupEmailMsg = 'Este email institucional já está em uso por outro usuário.';
            if (errEmail) { errEmail.style.display = 'block'; errEmail.textContent = dupEmailMsg; }
            if (typeof global.showToast === 'function') global.showToast(dupEmailMsg, 'alert-circle');
            if (emailInput) emailInput.focus();
            return;
        }

        if (hasDocenteRole && !turma) {
            if (typeof global.showToast === 'function') global.showToast('Selecione a turma vinculada ao professor.', 'alert-triangle');
            return;
        }

        var newUserObj = {
            id: editingUserId || ('usr_' + Date.now()),
            nome: nome,
            cpf: formattedCpf,
            nascimento: birthResult.formatted,
            dataNascimento: birthResult.formatted,
            idade: birthResult.idade,
            telefone: telefone || '(99) 98800-0000',
            tipo: primaryRole,
            role: primaryRole,
            perfis: selectedRoles,
            escola: escola,
            turma: turma,
            email: email,
            senha: senha,
            password: senha,
            status: 'Ativo',
            mustChangePassword: false,
            dataCriacao: new Date().toISOString()
        };

        if (editingUserId) {
            var idx = users.findIndex(function(u) { return u.id === editingUserId; });
            if (idx >= 0) users[idx] = Object.assign(users[idx], newUserObj);
            else users.push(newUserObj);
        } else {
            users.push(newUserObj);
        }

        if (typeof global.saveStoredUsers === 'function') {
            global.saveStoredUsers(users);
        }

        try {
            var token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
                        (typeof localStorage !== 'undefined' && localStorage.getItem('authToken'));
            if (!token) {
                console.warn('[Auth Warning] Sessão ausente ao cadastrar usuário.');
                if (typeof global.showToast === 'function') {
                    global.showToast('Sessão expirada. Por favor, faça login novamente.', 'warning');
                }
                return;
            }
            if (typeof fetch === 'function') {
                var endpoint = editingUserId ? ('/api/users/' + editingUserId) : '/api/users';
                var method = editingUserId ? 'PUT' : 'POST';
                var apiRes = await fetch(endpoint, {
                    method: method,
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(newUserObj)
                });
                if (apiRes.status === 401 || apiRes.status === 403) {
                    if (typeof global.showToast === 'function') {
                        global.showToast('Sessão expirada. Redirecionando para login...', 'warning');
                    }
                    setTimeout(function() {
                        if (typeof global.logoutUser === 'function') global.logoutUser();
                        else if (typeof window !== 'undefined') window.location.reload();
                    }, 1500);
                    return;
                }
                if (!apiRes.ok) {
                    var apiErr = await apiRes.json().catch(function() { return {}; });
                    console.warn('[Sync API Server Warning]', apiErr.error || apiRes.statusText);
                }
            }
        } catch(err) {
            console.warn('[Sync API Server Warning]', err);
        }

        closeCreateUserModal();
        if (typeof global.renderUsersList === 'function') global.renderUsersList();

        var msg = editingUserId ? ('Dados de ' + nome + ' atualizados com sucesso!') : ('Profissional ' + nome + ' cadastrado com sucesso! Acesso liberado.');
        if (typeof global.showToast === 'function') global.showToast(msg, 'check-circle');
    }

    var AdminUsersForm = {
        ESCOLAS_TURMAS_MAP: ESCOLAS_TURMAS_MAP,
        generateAutoCredentials: generateAutoCredentials,
        getSelectedUserRoles: getSelectedUserRoles,
        setSelectedUserRoles: setSelectedUserRoles,
        handleUserRoleChange: handleUserRoleChange,
        handleUserSchoolChange: handleUserSchoolChange,
        openCreateUserModal: openCreateUserModal,
        closeCreateUserModal: closeCreateUserModal,
        handleSaveNewUser: handleSaveNewUser
    };

    global.AdminUsersForm = AdminUsersForm;
    global.generateAutoCredentials = generateAutoCredentials;
    global.getSelectedUserRoles = getSelectedUserRoles;
    global.setSelectedUserRoles = setSelectedUserRoles;
    global.handleUserRoleChange = handleUserRoleChange;
    global.handleUserSchoolChange = handleUserSchoolChange;
    global.openCreateUserModal = openCreateUserModal;
    global.closeCreateUserModal = closeCreateUserModal;
    global.handleSaveNewUser = handleSaveNewUser;

})(typeof window !== 'undefined' ? window : this);
