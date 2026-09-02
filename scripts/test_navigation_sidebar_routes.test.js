const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runNavigationAndSidebarTestSuite() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: NAVEGAÇÃO, SIDEBAR, SUBMENUS & WIZARD DE AVALIAÇÕES');
    console.log('================================================================\n');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  [✓ PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [✗ FAIL] ${name}`);
            console.error(`    Erro: ${err.message}`);
            failed++;
        }
    }

    // Criar ambiente global com mocks de DOM
    const store = {};
    const localStorageMock = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v.toString(); },
        removeItem: (k) => { delete store[k]; }
    };

    const elements = {};
    function createMockElement(id, tagName = 'div', classes = []) {
        return {
            id,
            tagName: tagName.toUpperCase(),
            classList: {
                _classes: new Set(classes),
                add(c) { this._classes.add(c); },
                remove(c) { this._classes.delete(c); },
                contains(c) { return this._classes.has(c); },
                toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
            },
            style: {},
            textContent: '',
            innerHTML: '',
            value: '',
            getAttribute: (attr) => null,
            setAttribute: (attr, val) => {},
            addEventListener: (evt, cb) => {},
            querySelectorAll: () => [],
            querySelector: () => null
        };
    }

    const mockDocument = {
        readyState: 'complete',
        addEventListener: () => {},
        getElementById: (id) => {
            if (!elements[id]) elements[id] = createMockElement(id);
            return elements[id];
        },
        querySelector: (sel) => createMockElement('sel-mock'),
        querySelectorAll: (sel) => [createMockElement('item-1'), createMockElement('item-2')]
    };

    const mockWindow = {
        localStorage: localStorageMock,
        sessionStorage: localStorageMock,
        document: mockDocument,
        location: { hostname: 'localhost', search: '' },
        scrollTo: () => {}
    };
    mockWindow.window = mockWindow;
    global.window = mockWindow;
    global.document = mockDocument;
    global.localStorage = localStorageMock;
    global.sessionStorage = localStorageMock;

    function loadScript(relPath) {
        const fullPath = path.join(__dirname, '..', relPath);
        const code = fs.readFileSync(fullPath, 'utf8');
        const fn = new Function('window', 'document', 'global', code);
        fn(mockWindow, mockDocument, mockWindow);
    }

    loadScript('js/core/helpers.js');
    loadScript('js/core/navigation/navigation_meta.js');
    loadScript('js/core/navigation/navigation_history.js');
    loadScript('js/core/navigation/navigation_events.js');
    loadScript('js/core/navigation.js');
    loadScript('js/modules/avaliacoes/avaliacoes_state.js');
    loadScript('js/modules/avaliacoes/avaliacoes_wizard.js');
    loadScript('js/modules/avaliacoes/avaliacoes_events.js');
    loadScript('js/data/official_users_directory.js');
    loadScript('js/core/auth.js');
    loadScript('app.js');

    // -------------------------------------------------------------------------
    // TESTE 1: Catálogo de Metadados de Navegação (navigation_meta.js)
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Catálogo Centralizado de Metadados (navigation_meta.js) ---');
    const expectedTabs = [
        'dashboard',
        'escolas-panel',
        'alunos-panel',
        'metas-ideb',
        'ideb-comparativo',
        'matriz-descritores',
        'cronograma-habilidades',
        'criar-avaliacoes',
        'aplicacao-provas',
        'ai-playground',
        'questions',
        'gestao-pedagogica',
        'doc-tecnica',
        'biblioteca-recursos',
        'admin-panel'
    ];

    test('getTabMeta retorna metadados completos para todas as 15 rotas canônicas', () => {
        assert(typeof mockWindow.getTabMeta === 'function', 'getTabMeta deve existir');
        expectedTabs.forEach(tabId => {
            const meta = mockWindow.getTabMeta(tabId);
            assert(meta, `Metadados devem existir para aba [${tabId}]`);
            assert(typeof meta.title === 'string' && meta.title.length > 0, `Título válido para [${tabId}]`);
            assert(typeof meta.subtitle === 'string' && meta.subtitle.length > 0, `Subtítulo válido para [${tabId}]`);
            assert(typeof meta.icon === 'string' && meta.icon.length > 0, `Ícone válido para [${tabId}]`);
        });
    });

    test('getTabMeta possui fallback seguro para IDs não cadastrados', () => {
        const unknown = mockWindow.getTabMeta('rota-inexistente-xyz');
        assert.strictEqual(unknown.id, 'rota-inexistente-xyz');
        assert(unknown.title.toLowerCase().includes('rota inexistente xyz'));
    });

    // -------------------------------------------------------------------------
    // TESTE 2: Roteamento & Navegação entre Abas (switchTab / navigateToTab)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Roteador SPA e Troca de Abas (switchTab) ---');
    expectedTabs.forEach(tabId => {
        test(`Navegação para [${tabId}]: atualiza estado ativo e localStorage`, () => {
            mockWindow.switchTab(tabId);
            assert(localStorageMock.getItem('lastActiveTab') !== null, 'lastActiveTab deve ser gravado');
        });
    });

    // -------------------------------------------------------------------------
    // TESTE 3: Pilha de Histórico & Botão "Voltar" Global (navigation_history.js)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Pilha de Histórico e Botão Voltar (navigation_history.js) ---');
    test('Pilha de navegação empilha rotas em sequência e desempilha corretamente', () => {
        mockWindow.pushNavigationHistory('dashboard');
        mockWindow.pushNavigationHistory('escolas-panel');
        mockWindow.pushNavigationHistory('alunos-panel');

        const prev1 = mockWindow.popNavigationHistory();
        assert.strictEqual(prev1, 'escolas-panel', 'Voltar deve retornar escolas-panel');
    });

    // -------------------------------------------------------------------------
    // TESTE 4: Controle de Barra Lateral e Busca (navigation_events.js)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 4: Interações da Sidebar e Filtro de Busca (navigation_events.js) ---');
    test('filterSidebarMenuItems e bindSidebarMenuEvents estão devidamente exportadas', () => {
        assert(typeof mockWindow.filterSidebarMenuItems === 'function');
        assert(typeof mockWindow.bindSidebarMenuEvents === 'function');
    });

    // -------------------------------------------------------------------------
    // TESTE 5: Assistente de 3 Passos de Avaliações (avaliacoes_wizard.js)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 5: Assistente de Criação de Simulados (avaliacoes_wizard.js) ---');
    test('abrirNovoEventoWizard, renderWizardStep e fecharWizardEventos estão exportadas', () => {
        assert(typeof mockWindow.abrirNovoEventoWizard === 'function');
        assert(typeof mockWindow.renderWizardStep === 'function');
        assert(typeof mockWindow.fecharWizardEventos === 'function');
    });

    // -------------------------------------------------------------------------
    // TESTE 6: Diretório Oficial de Usuários (official_users_directory.js)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 6: Diretório Institucional de Usuários (official_users_directory.js) ---');
    test('Diretório oficial possui 16 perfis institucionais cadastrados', () => {
        assert(Array.isArray(mockWindow.OFFICIAL_REGISTERED_USERS), 'Diretório deve ser um array');
        assert.strictEqual(mockWindow.OFFICIAL_REGISTERED_USERS.length, 16, 'Devem existir 16 perfis oficiais');
        const semed = mockWindow.OFFICIAL_REGISTERED_USERS.find(u => u.email === 'semed@goncalvesdias.ma.gov.br');
        assert(semed, 'Perfil da SEMED deve existir');
        assert.strictEqual(semed.role, 'Gestor da Rede');
    });

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runNavigationAndSidebarTestSuite().catch(e => {
    console.error(e);
    process.exit(1);
});
