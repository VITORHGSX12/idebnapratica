// =========================================================================
// GESTÃO DE USUÁRIOS & CONTROLE RBAC (MODULAR COORDINATOR)
// SEMED Gonçalves Dias - MA • IDEB na Prática
// Validação de CPF, Data de Nascimento, RBAC por Escola, Reset de Senha
// Submódulos: users/admin_users_validation.js, users/admin_users_form.js, users/admin_users_table.js
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY_ADMIN_USERS = 'saas_admin_users_db';

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
                            password: u.password || u.senha || 'Gondias@2026',
                            senha: u.senha || u.password || 'Gondias@2026',
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

    function initAdminUsersModule() {
        if (typeof document === 'undefined') return;

        var Table = global.AdminUsersTable || {};
        var Form = global.AdminUsersForm || {};
        var renderList = Table.renderUsersList || global.renderUsersList;
        var openModal = Form.openCreateUserModal || global.openCreateUserModal;
        var saveUser = Form.handleSaveNewUser || global.handleSaveNewUser;

        var btnSearchUsers = document.getElementById('btn-search-users');
        if (btnSearchUsers && renderList) btnSearchUsers.onclick = renderList;

        var inputSearchUsers = document.getElementById('filter-user-search');
        if (inputSearchUsers && renderList) {
            inputSearchUsers.oninput = renderList;
            inputSearchUsers.onkeydown = function(e) { if (e.key === 'Enter') renderList(); };
        }

        var selectFilterType = document.getElementById('filter-user-type');
        if (selectFilterType && renderList) selectFilterType.onchange = renderList;

        var selectFilterStatus = document.getElementById('filter-user-status');
        if (selectFilterStatus && renderList) selectFilterStatus.onchange = renderList;

        var btnBackToUsers = document.getElementById('btn-back-to-users-list');
        if (btnBackToUsers) {
            btnBackToUsers.onclick = function() {
                var detailView = document.getElementById('user-profile-detail-view');
                var listView = document.getElementById('users-list-view-container');
                if (detailView) detailView.classList.add('hidden');
                if (listView) listView.classList.remove('hidden');
                if (renderList) renderList();
            };
        }

        var btnOpenModal = document.getElementById('btn-open-create-user-modal');
        if (btnOpenModal && openModal) {
            btnOpenModal.onclick = function() { openModal(); };
        }

        var formCreate = document.getElementById('create-user-form');
        if (formCreate && saveUser) {
            formCreate.onsubmit = saveUser;
            formCreate.addEventListener('submit', saveUser);
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

        if (renderList) renderList();
    }

    // Exposição Global
    global.getStoredUsers = getStoredUsers;
    global.saveStoredUsers = saveStoredUsers;
    global.isConfigGroup = isConfigGroup;
    global.getLoggedUserSchool = getLoggedUserSchool;
    global.initAdminUsersModule = initAdminUsersModule;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAdminUsersModule);
        } else {
            setTimeout(initAdminUsersModule, 100);
        }
    }

})(typeof window !== 'undefined' ? window : this);
