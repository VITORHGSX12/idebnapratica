const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runCascadeTestSuite() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: SELEÇÃO EM CASCATA ESCOLA -> TURMAS (LANÇAMENTO)');
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

    // Mock do DOM e Storage
    const store = {};
    const localStorageMock = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v.toString(); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { for (const k in store) delete store[k]; }
    };

    const elements = {};
    function createMockElement(id, tagName = 'div') {
        return {
            id,
            tagName: tagName.toUpperCase(),
            style: {},
            textContent: '',
            innerHTML: '',
            value: '',
            selectedIndex: 0,
            options: [],
            children: [],
            classList: {
                _classes: new Set(),
                add(c) { this._classes.add(c); },
                remove(c) { this._classes.delete(c); },
                contains(c) { return this._classes.has(c); },
                toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
            },
            appendChild(child) {
                this.children.push(child);
                if (child.tagName === 'OPTION') {
                    this.options.push(child);
                }
                return child;
            },
            remove() {},
            closest: () => createMockElement('parent-mock'),
            addEventListener: () => {},
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
        createElement: (tagName) => createMockElement('el-' + Math.random(), tagName),
        querySelector: () => createMockElement('sel-mock'),
        querySelectorAll: () => []
    };

    const mockWindow = {
        localStorage: localStorageMock,
        sessionStorage: localStorageMock,
        document: mockDocument,
        location: { hostname: 'localhost', search: '' },
        showToast: () => {}
    };
    mockWindow.window = mockWindow;
    global.window = mockWindow;
    global.document = mockDocument;

    function loadScript(relPath) {
        const fullPath = path.join(__dirname, '..', relPath);
        const code = fs.readFileSync(fullPath, 'utf8');
        const fn = new Function('window', 'document', 'global', code);
        fn(mockWindow, mockDocument, mockWindow);
    }

    loadScript('js/core/helpers.js');
    loadScript('js/modules/turmas/turmas_crud.js');
    loadScript('js/modules/avaliacoes/avaliacoes_state.js');
    loadScript('js/modules/avaliacoes/avaliacoes_espelho.js');

    // -------------------------------------------------------------------------
    // TESTE 1: Filtragem Estrita com getTurmasPorEscola
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Filtragem Estrita com getTurmasPorEscola (Zero Vazamento) ---');

    const sampleClasses = [
        { id: 't_jcl_2a', escola: 'UI JOSE CORREA LIMA', escola_id: 'esc_jcl', nome: '2º Ano A', serie: '2º Ano', turno: 'Matutino' },
        { id: 't_jcl_2b', escola: 'UI JOSE CORREA LIMA', escola_id: 'esc_jcl', nome: '2º Ano B', serie: '2º Ano', turno: 'Vespertino' },
        { id: 't_ba_2a', escola: 'U I BASILIO ALVES', escola_id: 'esc_ba', nome: '2º Ano A', serie: '2º Ano', turno: 'Matutino' },
        { id: 't_af_5a', escola: 'UE ANITA FURTADO', escola_id: 'esc_af', nome: '5º Ano A', serie: '5º Ano', turno: 'Matutino' },
        { id: 't_sem_escola', escola: '', escola_id: null, nome: 'Turma Órfã', serie: '1º Ano' }
    ];

    test('Busca por ID de escola retorna exclusivamente as turmas correspondentes', () => {
        const res = mockWindow.getTurmasPorEscola('esc_jcl', sampleClasses);
        assert.strictEqual(res.length, 2, 'Deve retornar exatamente 2 turmas');
        assert(res.every(t => t.escola_id === 'esc_jcl'), 'Todas as turmas devem ser da esc_jcl');
    });

    test('Busca por Nome da escola retorna exclusivamente as turmas correspondentes', () => {
        const res = mockWindow.getTurmasPorEscola('U I BASILIO ALVES', sampleClasses);
        assert.strictEqual(res.length, 1, 'Deve retornar exatamente 1 turma');
        assert.strictEqual(res[0].id, 't_ba_2a');
    });

    test('Turmas órfãs ou sem escola_id nunca aparecem na busca de uma escola', () => {
        const res = mockWindow.getTurmasPorEscola('esc_af', sampleClasses);
        assert.strictEqual(res.length, 1);
        assert.strictEqual(res[0].id, 't_af_5a');
        assert(!res.some(t => t.id === 't_sem_escola'), 'Turma órfã não pode vazar');
    });

    // -------------------------------------------------------------------------
    // TESTE 2: Comportamento do Dropdown em Cascata (populateTurmasSelect)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Povoamento do Dropdown e Tratamento de Estado Vazio ---');

    test('populateTurmasSelect popula opções formatadas e seleciona a primeira por padrão', () => {
        const sel = createMockElement('test-turma-select', 'select');
        mockWindow.dbTurmas = sampleClasses;

        const populated = mockWindow.populateTurmasSelect('UI JOSE CORREA LIMA', sel);
        assert.strictEqual(populated.length, 2);
        assert.strictEqual(sel.options.length, 2);
        assert.strictEqual(sel.options[0].value, 't_jcl_2a');
        assert.strictEqual(sel.options[1].value, 't_jcl_2b');
        assert.strictEqual(sel.selectedIndex, 0);
    });

    test('populateTurmasSelect em escola sem turmas renderiza opção informativa desabilitada', () => {
        const sel = createMockElement('test-empty-select', 'select');
        mockWindow.dbTurmas = sampleClasses;

        const populated = mockWindow.populateTurmasSelect('ESCOLA INEXISTENTE OU VAZIA', sel);
        assert.strictEqual(populated.length, 0);
        assert.strictEqual(sel.options.length, 1);
        assert.strictEqual(sel.options[0].disabled, true);
        assert(sel.options[0].textContent.includes('Nenhuma turma cadastrada'));
    });

    // -------------------------------------------------------------------------
    // TESTE 3: Integração no Módulo "Lançar Notas (Simulado)"
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Tela "Lançar Notas" (avaliacoes_espelho.js) ---');

    test('Troca de escola no seletor do espelho recalcula imediatamente as turmas sem vazamento', async () => {
        const schoolSelect = mockDocument.getElementById('score-school-select');
        const classSelect = mockDocument.getElementById('score-class-select');
        const evalSelect = mockDocument.getElementById('score-eval-select');

        mockWindow.saveOfficialClassesState(sampleClasses);
        mockWindow.saveEventosState([{ id: 'ev_1', titulo: 'Simulado SAEB 1', status: 'ABERTO' }]);

        mockWindow.initEspelhoSelectors();

        // 1. Simula seleção da escola UI JOSE CORREA LIMA
        schoolSelect.value = 'esc_jcl';
        schoolSelect.options = [{ text: 'UI JOSE CORREA LIMA', value: 'esc_jcl' }];
        schoolSelect.selectedIndex = 0;

        await mockWindow.carregarTurmasParaEspelho();

        assert.strictEqual(classSelect.options.length, 2);
        assert.strictEqual(classSelect.options[0].value, 't_jcl_2a');
        assert.strictEqual(classSelect.options[1].value, 't_jcl_2b');

        // 2. Simula troca para a escola UE ANITA FURTADO
        schoolSelect.value = 'esc_af';
        schoolSelect.options = [{ text: 'UE ANITA FURTADO', value: 'esc_af' }];
        schoolSelect.selectedIndex = 0;

        await mockWindow.carregarTurmasParaEspelho();

        assert.strictEqual(classSelect.options.length, 1);
        assert.strictEqual(classSelect.options[0].value, 't_af_5a');
        assert(!classSelect.options.some(o => o.value === 't_jcl_2a'), 'Turma da escola anterior foi desmarcada e removida');
    });

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runCascadeTestSuite().catch(e => {
    console.error(e);
    process.exit(1);
});
