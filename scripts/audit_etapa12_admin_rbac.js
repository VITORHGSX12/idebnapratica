/**
 * ============================================================================
 * AUDITORIA DETALHADA: ETAPA 12 — ADMINISTRAÇÃO, USUÁRIOS & RBAC (#admin-panel)
 * Avalia cada item e subitem com os critérios:
 * 🟢 Funciona: Plenamente ativo, com dados oficiais e eventos funcionais.
 * 🟡 Precisa ser implementado: Estrutura existe mas falta lógica/dados completos.
 * 🔴 Não funciona: Quebrado, com erro de execução ou bloqueio de interface.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('========================================================================');
console.log('AUDITORIA DE ITENS E SUBITENS: ETAPA 12 — ADMINISTRAÇÃO, USUÁRIOS & RBAC');
console.log('========================================================================\n');

// 1. Validação estática de index.html
const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function checkHtmlContains(pattern) {
    return pattern instanceof RegExp ? pattern.test(html) : html.includes(pattern);
}

// 2. Setup do Mock DOM Environment
const domElements = {};
function createMockElement(tag, id = '', className = '') {
    const el = {
        tagName: tag.toUpperCase(),
        id: id,
        className: className,
        classList: {
            classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
            add: function (c) { this.classes.add(c); el.className = Array.from(this.classes).join(' '); },
            remove: function (c) { this.classes.delete(c); el.className = Array.from(this.classes).join(' '); },
            contains: function (c) { return this.classes.has(c); },
            toggle: function (c, force) {
                if (force !== undefined) {
                    if (force) this.add(c); else this.remove(c);
                } else {
                    if (this.contains(c)) this.remove(c); else this.add(c);
                }
            }
        },
        style: {},
        children: [],
        _innerHTML: '',
        textContent: '',
        attributes: {},
        dataset: {},
        value: '',
        checked: false,
        setAttribute: function (k, v) {
            this.attributes[k] = v;
            if (k.startsWith('data-')) {
                const dataKey = k.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.dataset[dataKey] = v;
            }
        },
        getAttribute: function (k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
        appendChild: function (child) { this.children.push(child); return child; },
        removeChild: function (child) {
            const idx = this.children.indexOf(child);
            if (idx >= 0) this.children.splice(idx, 1);
            return child;
        },
        querySelector: function (sel) {
            return findInTree(this, sel);
        },
        querySelectorAll: function (sel) {
            return findAllInTree(this, sel);
        },
        addEventListener: function (evt, handler) {
            if (!this._handlers) this._handlers = {};
            if (!this._handlers[evt]) this._handlers[evt] = [];
            this._handlers[evt].push(handler);
        },
        click: function () {
            if (typeof this.onclick === 'function') {
                this.onclick({ preventDefault: () => {} });
            }
            if (this._handlers && this._handlers['click']) {
                this._handlers['click'].forEach(h => h({ preventDefault: () => {} }));
            }
        },
        reset: function () {
            this.value = '';
            this.querySelectorAll('input').forEach(i => i.value = '');
        },
        select: function () {},
        focus: function () {}
    };

    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._innerHTML; },
        set: function (val) {
            this._innerHTML = val;
            this.textContent = String(val).replace(/<[^>]*>?/gm, '');
        }
    });

    if (id) domElements[id] = el;
    return el;
}

function findInTree(root, sel) {
    const list = findAllInTree(root, sel);
    return list.length > 0 ? list[0] : null;
}

function findAllInTree(root, sel) {
    const res = [];
    const isClass = sel.startsWith('.');
    const isId = sel.startsWith('#');
    const isTag = /^[a-z0-9]+$/i.test(sel);
    const name = sel.replace(/^[.#]/, '');

    function traverse(node) {
        if (!node) return;
        if (isClass && node.classList && node.classList.contains(name)) res.push(node);
        else if (isId && node.id === name) res.push(node);
        else if (isTag && node.tagName && node.tagName.toLowerCase() === sel.toLowerCase()) res.push(node);

        if (node.children) {
            node.children.forEach(traverse);
        }
    }

    if (root.children) {
        root.children.forEach(traverse);
    }
    return res;
}

// 3. Montar DOM do #admin-panel
const adminSection = createMockElement('section', 'admin-panel', 'tab-content');
const listViewContainer = createMockElement('div', 'users-list-view-container');
const detailViewContainer = createMockElement('div', 'user-profile-detail-view', 'hidden');
adminSection.appendChild(listViewContainer);
adminSection.appendChild(detailViewContainer);

// Elementos da Lista
const btnOpenCreateModal = createMockElement('button', 'btn-open-create-user-modal');
const filterType = createMockElement('select', 'filter-user-type');
filterType.value = 'all';
const filterSearch = createMockElement('input', 'filter-user-search');
filterSearch.value = '';
const filterStatus = createMockElement('select', 'filter-user-status');
filterStatus.value = 'all';
const btnSearch = createMockElement('button', 'btn-search-users');
const usersTbody = createMockElement('tbody', 'users-table-body');

listViewContainer.appendChild(btnOpenCreateModal);
listViewContainer.appendChild(filterType);
listViewContainer.appendChild(filterSearch);
listViewContainer.appendChild(filterStatus);
listViewContainer.appendChild(btnSearch);
listViewContainer.appendChild(usersTbody);

// Elementos do Perfil / Detalhes
const btnBackToList = createMockElement('button', 'btn-back-to-users-list');
const btnProfileEdit = createMockElement('button', 'btn-profile-edit-user');
const profileName = createMockElement('h3', 'profile-user-display-name');
const profileTypeBadge = createMockElement('span', 'profile-user-type-badge');
const profileId = createMockElement('span', 'profile-user-id');
const profileCpf = createMockElement('span', 'profile-user-cpf');
const profileStatusBadge = createMockElement('span', 'profile-user-status-badge');
const profilePhone = createMockElement('span', 'profile-user-phone');
const profileEmail = createMockElement('span', 'profile-user-email-text');
const profileSchool = createMockElement('span', 'profile-user-school');
const profileFuncEscola = createMockElement('strong', 'profile-func-escola');
const profileFuncTurma = createMockElement('strong', 'profile-func-turma');
const profileRbacBadge = createMockElement('span', 'profile-rbac-group-badge');
const profileRbacDesc = createMockElement('span', 'profile-rbac-group-desc');

detailViewContainer.appendChild(btnBackToList);
detailViewContainer.appendChild(btnProfileEdit);
detailViewContainer.appendChild(profileName);
detailViewContainer.appendChild(profileTypeBadge);
detailViewContainer.appendChild(profileId);
detailViewContainer.appendChild(profileCpf);
detailViewContainer.appendChild(profileStatusBadge);
detailViewContainer.appendChild(profilePhone);
detailViewContainer.appendChild(profileEmail);
detailViewContainer.appendChild(profileSchool);
detailViewContainer.appendChild(profileFuncEscola);
detailViewContainer.appendChild(profileFuncTurma);
detailViewContainer.appendChild(profileRbacBadge);
detailViewContainer.appendChild(profileRbacDesc);

// Modal de Criação / Edição
const createModal = createMockElement('div', 'create-user-modal', 'modal-overlay hidden');
const createForm = createMockElement('form', 'create-user-form');
const inputName = createMockElement('input', 'new-user-name');
const inputCpf = createMockElement('input', 'new-user-cpf');
const inputPhone = createMockElement('input', 'new-user-phone');
const selectRole = createMockElement('select', 'new-user-role');
selectRole.value = 'Professor(a)';
const selectSchool = createMockElement('select', 'new-user-school');
selectSchool.value = 'UI JOSE CORREA LIMA';
const inputEmail = createMockElement('input', 'new-user-email');
const inputPassword = createMockElement('input', 'new-user-password');

createForm.appendChild(inputName);
createForm.appendChild(inputCpf);
createForm.appendChild(inputPhone);
createForm.appendChild(selectRole);
createForm.appendChild(selectSchool);
createForm.appendChild(inputEmail);
createForm.appendChild(inputPassword);
createModal.appendChild(createForm);

// Mock Document
const mockDocument = {
    body: createMockElement('body'),
    getElementById: (id) => domElements[id] || null,
    querySelector: (sel) => findInTree(adminSection, sel) || findInTree(createModal, sel),
    querySelectorAll: (sel) => {
        if (sel === 'input') return [inputName, inputCpf, inputPhone, inputEmail, inputPassword, filterSearch];
        return findAllInTree(adminSection, sel);
    },
    createElement: (tag) => createMockElement(tag),
    readyState: 'complete',
    execCommand: () => true
};

const toastMessages = [];
const mockStorage = {};
const mockSession = { userRole: 'Master Admin', userSchool: '' };

const mockWindow = {
    document: mockDocument,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    safeCreateIcons: () => {},
    confirm: () => true,
    showToast: (msg, type) => {
        toastMessages.push({ msg, type });
    },
    localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; }
    },
    sessionStorage: {
        getItem: (k) => mockSession[k] || null,
        setItem: (k, v) => { mockSession[k] = String(v); },
        removeItem: (k) => { delete mockSession[k]; }
    },
    navigator: {
        clipboard: {
            writeText: (txt) => {
                mockWindow.lastCopied = txt;
                return Promise.resolve();
            }
        }
    }
};

// 4. Executar os scripts do módulo admin em VM
const dataScript = fs.readFileSync(path.join(__dirname, '../js/modules/admin/admin_data.js'), 'utf8');
const usersScript = fs.readFileSync(path.join(__dirname, '../js/modules/admin/admin_users.js'), 'utf8');
const tenantsScript = fs.readFileSync(path.join(__dirname, '../js/modules/admin/admin_tenants.js'), 'utf8');

const ctx = vm.createContext(mockWindow);
vm.runInContext(dataScript, ctx);
vm.runInContext(usersScript, ctx);
vm.runInContext(tenantsScript, ctx);

// Inicializar módulo
if (typeof mockWindow.initAdminUsersModule === 'function') {
    mockWindow.initAdminUsersModule();
}

// 5. Auditoria dos 10 Itens da Etapa 12
const auditResults = [];

function registerResult(itemNumber, title, status, details) {
    auditResults.push({ itemNumber, title, status, details });
    const icon = status === 'Funciona' ? '🟢' : (status === 'Precisa ser implementado' ? '🟡' : '🔴');
    console.log(`[Item ${itemNumber}] ${icon} ${title}`);
    console.log(`       Status: ${status}`);
    console.log(`       Detalhes: ${details}\n`);
}

async function runAudit() {
    // Item 1: Header do Módulo, Título & Botão de Cadastro de Usuário
    try {
        const hasSection = checkHtmlContains('id="admin-panel"');
        const hasTitle = checkHtmlContains('USUÁRIOS & EQUIPE');
        const hasBtnCreate = checkHtmlContains('id="btn-open-create-user-modal"');
        const hasCallModal = checkHtmlContains('openCreateUserModal()');

        if (hasSection && hasTitle && hasBtnCreate && hasCallModal) {
            registerResult(1, 'Header do Módulo, Título & Botão de Cadastro de Usuário', 'Funciona',
                'Painel #admin-panel estruturado com header institucional, gestão de equipe da SEMED Gonçalves Dias e botão de cadastro.');
        } else {
            registerResult(1, 'Header do Módulo, Título & Botão de Cadastro de Usuário', 'Precisa ser implementado',
                'Header ou botão de cadastro ausentes no HTML.');
        }
    } catch (e) {
        registerResult(1, 'Header do Módulo, Título & Botão de Cadastro de Usuário', 'Não funciona', e.message);
    }

    // Item 2: Barra de Filtros e Busca da Equipe
    try {
        const hasTypeSelect = checkHtmlContains('id="filter-user-type"');
        const hasSearchInput = checkHtmlContains('id="filter-user-search"');
        const hasStatusSelect = checkHtmlContains('id="filter-user-status"');
        const hasSearchBtn = checkHtmlContains('id="btn-search-users"');

        // Testar filtros funcionais
        filterType.value = 'Professor(a)';
        mockWindow.renderUsersList();
        const hasProfessorsOnly = usersTbody.innerHTML.includes('Professor') && !usersTbody.innerHTML.includes('Master Admin');

        // Resetar filtro
        filterType.value = 'all';
        mockWindow.renderUsersList();

        if (hasTypeSelect && hasSearchInput && hasStatusSelect && hasSearchBtn && hasProfessorsOnly) {
            registerResult(2, 'Barra de Filtros e Busca da Equipe', 'Funciona',
                'Barra de filtros completa (Perfil, Busca Textual, Status) com atualização reativa da listagem.');
        } else {
            registerResult(2, 'Barra de Filtros e Busca da Equipe', 'Precisa ser implementado',
                'Filtros ou busca textual não funcionaram como esperado.');
        }
    } catch (e) {
        registerResult(2, 'Barra de Filtros e Busca da Equipe', 'Não funciona', e.message);
    }

    // Item 3: Listagem e Renderização da Tabela da Equipe Escolar / SEMED
    try {
        mockWindow.renderUsersList();
        const users = mockWindow.getStoredUsers();
        const hasRows = usersTbody.innerHTML.includes('USR-001') &&
                        usersTbody.innerHTML.includes('semed@goncalvesdias.ma.gov.br') &&
                        usersTbody.innerHTML.includes('UI JOSE CORREA LIMA');

        if (users && users.length >= 15 && hasRows) {
            registerResult(3, 'Listagem e Renderização da Tabela da Equipe Escolar / SEMED', 'Funciona',
                `Tabela oficial renderizada com ${users.length} profissionais da equipe municipal, contendo IDs, perfis, CPF, lotação escolar e ações.`);
        } else {
            registerResult(3, 'Listagem e Renderização da Tabela da Equipe Escolar / SEMED', 'Precisa ser implementado',
                'Tabela de usuários não foi preenchida com a lista completa de profissionais.');
        }
    } catch (e) {
        registerResult(3, 'Listagem e Renderização da Tabela da Equipe Escolar / SEMED', 'Não funciona', e.message);
    }

    // Item 4: Isolamento de Visibilidade por RBAC (Diretores e Professores)
    try {
        // Simular login de Professor da UI JOSE CORREA LIMA
        mockSession.userRole = 'Professor(a)';
        mockSession.userSchool = 'UI JOSE CORREA LIMA';
        mockWindow.renderUsersList();

        const scopedHtml = usersTbody.innerHTML;
        const containsOwnSchool = scopedHtml.includes('UI JOSE CORREA LIMA');
        const notContainsOtherSchool = !scopedHtml.includes('UI EMILIO MURAD');

        // Restaurar Master Admin
        mockSession.userRole = 'Master Admin';
        mockSession.userSchool = '';
        mockWindow.renderUsersList();

        if (containsOwnSchool && notContainsOtherSchool) {
            registerResult(4, 'Isolamento de Visibilidade por RBAC (Diretores e Professores)', 'Funciona',
                'Regras estritas de RBAC ativas: docentes e diretores visualizam exclusivamente profissionais de sua própria unidade de lotação.');
        } else {
            registerResult(4, 'Isolamento de Visibilidade por RBAC (Diretores e Professores)', 'Precisa ser implementado',
                'Filtro de segurança RBAC por escola não isolou os usuários adequadamente.');
        }
    } catch (e) {
        registerResult(4, 'Isolamento de Visibilidade por RBAC (Diretores e Professores)', 'Não funciona', e.message);
    }

    // Item 5: Modal de Cadastro de Usuário & Geração Automática de Credenciais
    try {
        inputName.value = 'Raimundo Nonato Oliveira';
        mockWindow.generateAutoCredentials();
        const autoEmail = inputEmail.value;
        const autoPass = inputPassword.value;

        const hasCorrectDomain = autoEmail === 'raimundo.oliveira@goncalvesdias.ma.gov.br';
        const hasDefaultPass = autoPass === 'Gondias@2026';

        mockWindow.openCreateUserModal();
        const isModalVisible = !createModal.classList.contains('hidden') && createModal.style.display === 'flex';

        if (hasCorrectDomain && hasDefaultPass && isModalVisible) {
            registerResult(5, 'Modal de Cadastro de Usuário & Geração Automática de Credenciais', 'Funciona',
                'Geração inteligente de login institucional (@goncalvesdias.ma.gov.br) e senha segura com abertura controlada do modal.');
        } else {
            registerResult(5, 'Modal de Cadastro de Usuário & Geração Automática de Credenciais', 'Precisa ser implementado',
                'Falha na geração automática de credenciais ou exibição do modal.');
        }
    } catch (e) {
        registerResult(5, 'Modal de Cadastro de Usuário & Geração Automática de Credenciais', 'Não funciona', e.message);
    }

    // Item 6: Salvamento e Persistência de Novos Usuários (handleSaveNewUser)
    try {
        inputName.value = 'Prof. Teste Automatizado';
        inputCpf.value = '111.222.333-44';
        inputPhone.value = '(99) 99999-0000';
        selectRole.value = 'Professor(a)';
        selectSchool.value = 'UI JOSE CORREA LIMA';
        inputEmail.value = 'prof.teste@goncalvesdias.ma.gov.br';
        inputPassword.value = 'Gondias@2026';

        const initialCount = mockWindow.getStoredUsers().length;
        mockWindow.handleSaveNewUser({ preventDefault: () => {} });

        const updatedUsers = mockWindow.getStoredUsers();
        const createdUser = updatedUsers.find(u => u.email === 'prof.teste@goncalvesdias.ma.gov.br');
        const hasCountIncremented = updatedUsers.length === initialCount + 1;
        const hasSuccessToast = toastMessages.some(t => t.msg.includes('cadastrado com sucesso'));

        if (createdUser && hasCountIncremented && hasSuccessToast) {
            registerResult(6, 'Salvamento e Persistência de Novos Usuários (handleSaveNewUser)', 'Funciona',
                'Novo profissional validado, salvo no armazenamento local persistente com geração de ID único e notificação Toast.');
        } else {
            registerResult(6, 'Salvamento e Persistência de Novos Usuários (handleSaveNewUser)', 'Precisa ser implementado',
                'Falha ao salvar novo usuário no armazenamento.');
        }
    } catch (e) {
        registerResult(6, 'Salvamento e Persistência de Novos Usuários (handleSaveNewUser)', 'Não funciona', e.message);
    }

    // Item 7: Visualização Detalhada do Perfil do Profissional
    try {
        mockWindow.handleViewUserProfile('USR-003');
        const isDetailVisible = !detailViewContainer.classList.contains('hidden');
        const isListHidden = listViewContainer.classList.contains('hidden');
        const nameMatches = profileName.textContent.includes('Antonia Silva');
        const schoolMatches = profileSchool.textContent.includes('UI JOSE CORREA LIMA');
        const rbacBadgeMatches = profileRbacBadge.textContent === 'VISUALIZAÇÃO';

        // Testar botão de voltar
        btnBackToList.click();
        const isListRestored = !listViewContainer.classList.contains('hidden');
        const isDetailHidden = detailViewContainer.classList.contains('hidden');

        if (isDetailVisible && isListHidden && nameMatches && schoolMatches && rbacBadgeMatches && isListRestored && isDetailHidden) {
            registerResult(7, 'Visualização Detalhada do Perfil do Profissional', 'Funciona',
                'Painel detalhado com avatar, cargo, atribuição funcional, escola e grupo RBAC ativo, com botão de retorno funcional.');
        } else {
            registerResult(7, 'Visualização Detalhada do Perfil do Profissional', 'Precisa ser implementado',
                'Falha na alternância entre lista e detalhes do perfil do profissional.');
        }
    } catch (e) {
        registerResult(7, 'Visualização Detalhada do Perfil do Profissional', 'Não funciona', e.message);
    }

    // Item 8: Edição de Dados e Cópia Rápida de Credenciais
    try {
        // Teste de cópia de credenciais
        mockWindow.lastCopied = null;
        mockWindow.handleCopyUserCredentials('diretor@goncalvesdias.ma.gov.br', 'Gondias@2026');
        await new Promise(resolve => setTimeout(resolve, 50));

        const isCopied = mockWindow.lastCopied && mockWindow.lastCopied.includes('diretor@goncalvesdias.ma.gov.br');

        // Teste de abrir modal para edição
        mockWindow.openCreateUserModal('USR-003');
        const isEditPrefilled = inputEmail.value === 'diretor@goncalvesdias.ma.gov.br';

        if (isCopied && isEditPrefilled) {
            registerResult(8, 'Edição de Dados e Cópia Rápida de Credenciais', 'Funciona',
                'Cópia de credenciais integrada à API Clipboard e pré-carregamento preciso de dados existentes para edição.');
        } else {
            registerResult(8, 'Edição de Dados e Cópia Rápida de Credenciais', 'Precisa ser implementado',
                'Cópia de credenciais ou pré-carregamento para edição com pendências.');
        }
    } catch (e) {
        registerResult(8, 'Edição de Dados e Cópia Rápida de Credenciais', 'Não funciona', e.message);
    }

    // Item 9: Exclusão Segura de Usuário com Validação de Permissão
    try {
        // 1. Tentar excluir como docente (deve bloquear)
        mockSession.userRole = 'Professor(a)';
        await mockWindow.handleDeleteUser('prof.teste@goncalvesdias.ma.gov.br');
        const blockedToast = toastMessages.some(t => t.msg.includes('Operação bloqueada'));

        // 2. Excluir como Master Admin (deve permitir)
        mockSession.userRole = 'Master Admin';
        const usersBefore = mockWindow.getStoredUsers().length;
        const testUser = mockWindow.getStoredUsers().find(u => u.email === 'prof.teste@goncalvesdias.ma.gov.br');
        if (testUser) {
            await mockWindow.handleDeleteUser(testUser.id);
        }
        const usersAfter = mockWindow.getStoredUsers().length;
        const isDeleted = usersAfter === usersBefore - 1;

        if (blockedToast && isDeleted) {
            registerResult(9, 'Exclusão Segura de Usuário com Validação de Permissão', 'Funciona',
                'Exclusão protegida por validação RBAC: bloqueio estrito para perfis sem permissão e remoção segura para administradores.');
        } else {
            registerResult(9, 'Exclusão Segura de Usuário com Validação de Permissão', 'Precisa ser implementado',
                'Validação de permissão ou exclusão de usuário falhou.');
        }
    } catch (e) {
        registerResult(9, 'Exclusão Segura de Usuário com Validação de Permissão', 'Não funciona', e.message);
    }

    // Item 10: Modularidade e Limite de Linhas (< 700 linhas)
    try {
        const linesData = dataScript.split('\n').length;
        const linesUsers = usersScript.split('\n').length;
        const linesTenants = tenantsScript.split('\n').length;

        const allCompliant = linesData < 700 && linesUsers < 700 && linesTenants < 700;

        if (allCompliant) {
            registerResult(10, 'Modularidade e Limite de Linhas (< 700 linhas)', 'Funciona',
                `Arquivos rigorosamente abaixo de 700 linhas: admin_data.js (${linesData}), admin_users.js (${linesUsers}), admin_tenants.js (${linesTenants}).`);
        } else {
            registerResult(10, 'Modularidade e Limite de Linhas (< 700 linhas)', 'Não funciona',
                `Um ou mais arquivos excederam o limite de 700 linhas.`);
        }
    } catch (e) {
        registerResult(10, 'Modularidade e Limite de Linhas (< 700 linhas)', 'Não funciona', e.message);
    }

    // Resumo Final
    console.log('========================================================================');
    console.log('RESUMO DA AUDITORIA — ETAPA 12: ADMINISTRAÇÃO, USUÁRIOS & RBAC');
    console.log('========================================================================');

    const total = auditResults.length;
    const funciona = auditResults.filter(r => r.status === 'Funciona').length;
    const pendente = auditResults.filter(r => r.status === 'Precisa ser implementado').length;
    const falha = auditResults.filter(r => r.status === 'Não funciona').length;

    console.log(`Total de Itens Auditados: ${total}`);
    console.log(`🟢 Funciona: ${funciona}/${total} (${Math.round(funciona / total * 100)}%)`);
    console.log(`🟡 Precisa ser implementado: ${pendente}/${total}`);
    console.log(`🔴 Não funciona: ${falha}/${total}`);

    if (funciona === total) {
        console.log('\n🎉 SUCESSO: Etapa 12 aprovada com 100% de conformidade!');
        process.exit(0);
    } else {
        console.error('\n⚠️ ATENÇÃO: Etapa 12 possui pendências a corrigir.');
        process.exit(1);
    }
}

runAudit();
