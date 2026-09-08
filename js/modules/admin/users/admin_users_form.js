// =========================================================================
// GESTÃO DE USUÁRIOS & CONTROLE RBAC - FORMULÁRIO & MODAL
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

        var errCpf = document.getElementById('err-new-user-cpf');
        var errBirth = document.getElementById('err-new-user-birth');
        var errEmail = document.getElementById('err-new-user-email');
        if (errCpf) { errCpf.style.display = 'none'; errCpf.textContent = ''; }
        if (errBirth) { errBirth.style.display = 'none'; errBirth.textContent = ''; }
        if (errEmail) { errEmail.style.display = 'none'; errEmail.textContent = ''; }

        if (editingUserId) {
            if (titleEl) titleEl.textContent = 'Editar Usuário da Equipe';
            var users = (typeof global.getStoredUsers === 'function') ? global.getStoredUsers() : [];
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
                if (passInput) passInput.value = target.senha || target.password || 'Gondias@2026';
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
        var roleSelect = document.getElementById('new-user-role');
        var schoolSelect = document.getElementById('new-user-school');
        var turmaSelect = document.getElementById('new-user-turma');
        var emailInput = document.getElementById('new-user-email');
        var passInput = document.getElementById('new-user-password');

        var errCpf = document.getElementById('err-new-user-cpf');
        var errBirth = document.getElementById('err-new-user-birth');
        var errEmail = document.getElementById('err-new-user-email');
        if (errCpf) { errCpf.style.display = 'none'; errCpf.textContent = ''; }
        if (errBirth) { errBirth.style.display = 'none'; errBirth.textContent = ''; }
        if (errEmail) { errEmail.style.display = 'none'; errEmail.textContent = ''; }

        var nome = nameInput ? nameInput.value.trim() : '';
        var rawCpf = cpfInput ? cpfInput.value.trim() : '';
        var birth = birthInput ? birthInput.value.trim() : '';
        var telefone = phoneInput ? phoneInput.value.trim() : '';
        var role = roleSelect ? roleSelect.value : 'Professor(a)';
        var escola = schoolSelect ? schoolSelect.value : 'UI JOSE CORREA LIMA';
        var turma = (role === 'Professor(a)' && turmaSelect) ? turmaSelect.value : '';
        var email = emailInput ? emailInput.value.trim().toLowerCase() : '';
        var senha = passInput ? passInput.value.trim() : 'Gondias@2026';

        if (!nome) {
            if (typeof global.showToast === 'function') global.showToast('Por favor, informe o nome completo do profissional.', 'alert-triangle');
            if (nameInput) nameInput.focus();
            return;
        }

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

        if (role === 'Professor(a)' && !turma) {
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
            tipo: role,
            role: role,
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
                        (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) ||
                        'preview_token';
            if (typeof fetch === 'function') {
                var apiRes = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(newUserObj)
                });
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
        handleUserRoleChange: handleUserRoleChange,
        handleUserSchoolChange: handleUserSchoolChange,
        openCreateUserModal: openCreateUserModal,
        closeCreateUserModal: closeCreateUserModal,
        handleSaveNewUser: handleSaveNewUser
    };

    global.AdminUsersForm = AdminUsersForm;
    global.generateAutoCredentials = generateAutoCredentials;
    global.handleUserRoleChange = handleUserRoleChange;
    global.handleUserSchoolChange = handleUserSchoolChange;
    global.openCreateUserModal = openCreateUserModal;
    global.closeCreateUserModal = closeCreateUserModal;
    global.handleSaveNewUser = handleSaveNewUser;

})(typeof window !== 'undefined' ? window : this);
