const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runLaudoDiagnosticoTestSuite() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: LAUDO TÉCNICO & DIAGNÓSTICO PEDAGÓGICO (ZERO MOCKS)');
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
            disabled: false,
            title: '',
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
        querySelector: (sel) => {
            if (sel && sel.includes('button')) {
                if (!elements['btn-export-top']) elements['btn-export-top'] = createMockElement('btn-export-top', 'button');
                return elements['btn-export-top'];
            }
            return createMockElement('sel-mock');
        },
        querySelectorAll: () => []
    };

    const mockWindow = {
        localStorage: localStorageMock,
        sessionStorage: localStorageMock,
        document: mockDocument,
        location: { hostname: 'localhost', search: '' },
        showToast: () => {},
        print: () => {}
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
    loadScript('js/modules/avaliacoes/avaliacoes_state.js');
    loadScript('js/modules/diagnostico/diagnostico.js');

    // -------------------------------------------------------------------------
    // TESTE 1: Estado Vazio Real quando NÃO há lançamentos
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Estado Vazio com Zero Lançamentos (Zero Mocks) ---');

    test('Com zero lançamentos de notas, a tela exibe Estado Vazio e nenhum número fictício', () => {
        mockWindow.saveRespostasState({}); // Base 100% vazia
        mockWindow.saveEventosState([]);

        const container = mockDocument.getElementById('diagnostico-results-container');
        mockWindow.runDiagnosticoCalculation();

        assert(container.innerHTML.includes('Nenhum dado disponível para o filtro selecionado'), 'Deve exibir mensagem honesta');
        assert(!container.innerHTML.includes('61.5%'), 'Não pode conter média mockada de 61.5%');
        assert(!container.innerHTML.includes('+3.4% vs 1º Simulado'), 'Não pode conter variação inventada');
        assert(!container.innerHTML.includes('526'), 'Não pode conter total hardcoded de 526 estudantes');
        assert(!container.innerHTML.includes('5.45'), 'Não pode conter projeção inventada de IDEB 5.45');
    });

    test('Botões de exportação ficam bloqueados quando não há lançamentos reais', () => {
        mockWindow.saveRespostasState({});
        const btnExport = mockDocument.querySelector('button[onclick="handlePrintDiagnosticoReport();"]');
        mockWindow.runDiagnosticoCalculation();

        assert.strictEqual(btnExport.disabled, true, 'Botão de exportação deve ser desabilitado no estado vazio');
    });

    // -------------------------------------------------------------------------
    // TESTE 2: Cálculo Exato a partir de Respostas Reais
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Cálculo Exato de Taxas a partir de Dados Reais ---');

    test('Com dados reais inseridos, médias e acertos batem 100% com o cálculo real', () => {
        const eventoTeste = {
            id: 'ev_real_1',
            titulo: '1º Simulado Diagnóstico Real',
            disciplina: 'Matemática',
            gabarito: ['A', 'B', 'C', 'D'],
            matrizDescritores: [
                { codigo: 'D13', disciplina: 'Matemática', desc: 'Operações' },
                { codigo: 'D14', disciplina: 'Matemática', desc: 'Grandezas' },
                { codigo: 'D15', disciplina: 'Matemática', desc: 'Espaço e Forma' },
                { codigo: 'D16', disciplina: 'Matemática', desc: 'Frações' }
            ]
        };

        // 6 alunos reais com respostas controladas
        const loteRespostas = {
            'ev_real_1_esc1_turma1': {
                'aluno_1': { statusPresenca: 'PRESENTE', respostas: ['A', 'B', 'C', 'D'] }, // 4/4 = 100%
                'aluno_2': { statusPresenca: 'PRESENTE', respostas: ['A', 'B', 'C', 'D'] }, // 4/4 = 100%
                'aluno_3': { statusPresenca: 'PRESENTE', respostas: ['A', 'B', 'C', 'A'] }, // 3/4 = 75%
                'aluno_4': { statusPresenca: 'PRESENTE', respostas: ['A', 'B', 'A', 'A'] }, // 2/4 = 50%
                'aluno_5': { statusPresenca: 'PRESENTE', respostas: ['A', 'A', 'A', 'A'] }, // 1/4 = 25% (D13 acerta, D14/D15/D16 erram)
                'aluno_6': { statusPresenca: 'PRESENTE', respostas: ['A', 'A', 'A', 'A'] }  // 1/4 = 25%
            }
        };

        mockWindow.saveEventosState([eventoTeste]);
        mockWindow.saveRespostasState(loteRespostas);

        mockDocument.getElementById('diag-filter-simulado').value = 'ev_real_1';
        mockDocument.getElementById('diag-filter-school').value = 'all';
        mockDocument.getElementById('diag-filter-turma').value = 'all';
        mockDocument.getElementById('diag-filter-subject').value = 'all';

        const container = mockDocument.getElementById('diagnostico-results-container');
        mockWindow.runDiagnosticoCalculation();

        // Total de itens: 6 alunos x 4 = 24 questões
        // Acertos totais: 4 + 4 + 3 + 2 + 1 + 1 = 15 acertos
        // Média geral esperada: 15 / 24 = 62.5%
        assert(container.innerHTML.includes('62.5%'), 'Média apurada deve ser exatamente 62.5%');
        assert(container.innerHTML.includes('15 acertos de 24 itens'), 'Contagem de acertos deve ser exata');
        assert(container.innerHTML.includes('6</strong>'), 'Total de estudantes avaliados deve ser 6');
    });

    // -------------------------------------------------------------------------
    // TESTE 3: Geração Dinâmica do Parecer Pedagógico
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Parecer Pedagógico Dinâmico Vinculado aos Descritores Críticos ---');

    test('O parecer cita exclusivamente os descritores reais calculados em situação crítica (<60%)', () => {
        const container = mockDocument.getElementById('diagnostico-results-container');
        // No teste acima:
        // D13: 6/6 = 100% (Adequado)
        // D14: 4/6 = 66.7% (Atenção)
        // D15: 3/6 = 50.0% (Crítico < 60%)
        // D16: 2/6 = 33.3% (Crítico < 60%)

        assert(container.innerHTML.includes('D15'), 'Parecer deve citar D15');
        assert(container.innerHTML.includes('D16'), 'Parecer deve citar D16');
        assert(!container.innerHTML.includes('D13 ('), 'D13 não pode ser citado como crítico pois teve 100%');
    });

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runLaudoDiagnosticoTestSuite().catch(e => {
    console.error(e);
    process.exit(1);
});
