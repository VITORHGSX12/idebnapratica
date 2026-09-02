const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runSaebProficienciaTestSuite() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: NÍVEIS DE PROFICIÊNCIA SAEB (0 A 5) & RBAC');
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
        const el = {
            id,
            tagName: tagName.toUpperCase(),
            style: {},
            textContent: '',
            _innerHTML: '',
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
            getAttribute(attr) { return this[attr] || null; },
            setAttribute(attr, val) { this[attr] = val; },
            closest: () => createMockElement('parent-mock'),
            addEventListener: () => {},
            querySelectorAll: () => [],
            querySelector: () => null
        };

        Object.defineProperty(el, 'innerHTML', {
            get() { return this._innerHTML; },
            set(html) {
                this._innerHTML = html;
                if (this.tagName === 'SELECT') {
                    this.options = [];
                    const matches = String(html).matchAll(/<option[^>]*value=["']([^"']*)["'][^>]*>([^<]*)<\/option>/gi);
                    for (const m of matches) {
                        this.options.push({ value: m[1], textContent: m[2] });
                    }
                }
            }
        });

        return el;
    }

    const mockDocument = {
        readyState: 'complete',
        addEventListener: () => {},
        getElementById: (id) => {
            if (!elements[id]) {
                const tag = id.includes('select') ? 'SELECT' : (id.includes('input') ? 'INPUT' : (id.includes('btn') ? 'BUTTON' : 'DIV'));
                elements[id] = createMockElement(id, tag);
            }
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
    loadScript('js/modules/saeb/saeb_state.js');
    loadScript('js/modules/saeb/saeb_distribution_view.js');
    loadScript('js/modules/saeb/saeb_comparativo_turmas.js');
    loadScript('js/modules/saeb/saeb_ficha_individual.js');
    loadScript('js/modules/saeb/saeb_boletim.js');
    loadScript('js/modules/saeb/saeb.js');

    // -------------------------------------------------------------------------
    // TESTE 1: Motor Canônico de Cálculo de Níveis SAEB (0 a 5)
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Cálculo Determinístico de Níveis SAEB (0 a 5) ---');

    test('calcularNivelSaeb classifica corretamente as faixas de corte', () => {
        assert.strictEqual(mockWindow.calcularNivelSaeb(35.0), 0, '<40% deve ser Nível 0 (Alerta)');
        assert.strictEqual(mockWindow.calcularNivelSaeb(45.0), 1, '40-49.9% deve ser Nível 1 (Inicial)');
        assert.strictEqual(mockWindow.calcularNivelSaeb(55.0), 2, '50-64.9% deve ser Nível 2 (Em Desenvolvimento)');
        assert.strictEqual(mockWindow.calcularNivelSaeb(70.0), 3, '65-74.9% deve ser Nível 3 (Adequado)');
        assert.strictEqual(mockWindow.calcularNivelSaeb(80.0), 4, '75-84.9% deve ser Nível 4 (Consolidado)');
        assert.strictEqual(mockWindow.calcularNivelSaeb(95.0), 5, '>=85% deve ser Nível 5 (Avançado)');
    });

    // -------------------------------------------------------------------------
    // TESTE 2: Estado Vazio com Zero Lançamentos (Zero Mocks)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Estado Vazio com Zero Lançamentos ---');

    test('Com zero lançamentos de notas, a barra de distribuição e selects exibem estado vazio', () => {
        mockWindow.saveRespostasState({});
        mockWindow.saveEventosState([]);

        mockWindow.renderSaebProficiencyDashboard();

        const distBar = mockDocument.getElementById('saeb-dist-bar-element');
        const metaEl = mockDocument.getElementById('saeb-participation-meta');

        assert(distBar.innerHTML.includes('Aguardando lançamento de notas'), 'Barra de distribuição deve indicar ausência de notas');
        assert(metaEl.innerHTML.includes('0.0%'), 'Taxa de participação deve ser 0%');
    });

    // -------------------------------------------------------------------------
    // TESTE 3: Distribuição e Médias Reais a partir de Gabarito
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Distribuição e Médias Reais com Amostra Controlada ---');

    test('Distribuição por níveis e médias de turmas batem 100% com o cálculo real', () => {
        const eventoSimulado = {
            id: 'sim_saeb_2026',
            titulo: '1º Simulado Diagnóstico SAEB',
            disciplina: 'Matemática',
            gabarito: ['A', 'B', 'C', 'D', 'A', 'B', 'C', 'D', 'A', 'B'] // 10 questões
        };

        const loteRespostas = {
            'sim_saeb_2026_esc_jcl_turma_2a': {
                'aluno_n5': { nome: 'Aluno Avançado', statusPresenca: 'PRESENTE', respostas: ['A','B','C','D','A','B','C','D','A','B'] }, // 10/10 = 100% -> Nível 5
                'aluno_n4': { nome: 'Aluno Consolidado', statusPresenca: 'PRESENTE', respostas: ['A','B','C','D','A','B','C','D','A','C'] }, // 8/10 = 80% -> Nível 4
                'aluno_n3': { nome: 'Aluno Adequado', statusPresenca: 'PRESENTE', respostas: ['A','B','C','D','A','B','C','C','C','C'] }, // 7/10 = 70% -> Nível 3
                'aluno_n2': { nome: 'Aluno Em Desenv', statusPresenca: 'PRESENTE', respostas: ['A','B','C','D','A','C','C','C','C','C'] }, // 5/10 = 50% -> Nível 2
                'aluno_n1': { nome: 'Aluno Inicial', statusPresenca: 'PRESENTE', respostas: ['A','B','C','D','C','C','C','C','C','C'] }, // 4/10 = 40% -> Nível 1
                'aluno_n0': { nome: 'Aluno Alerta', statusPresenca: 'PRESENTE', respostas: ['A','C','C','C','C','C','C','C','C','C'] }   // 1/10 = 10% -> Nível 0
            }
        };

        mockWindow.saveEventosState([eventoSimulado]);
        mockWindow.saveRespostasState(loteRespostas);

        mockDocument.getElementById('saeb-eval-select').value = 'sim_saeb_2026';
        mockDocument.getElementById('saeb-school-select').value = 'all';
        mockDocument.getElementById('saeb-class-select').value = 'all';
        mockDocument.getElementById('saeb-threshold-input').value = '65';

        mockWindow.renderSaebProficiencyDashboard();

        const distBar = mockDocument.getElementById('saeb-dist-bar-element');
        const metaEl = mockDocument.getElementById('saeb-participation-meta');

        // Total 6 alunos com 100%, 90%, 70%, 60%, 50%, 30%
        // Média geral calculada: (100 + 90 + 70 + 60 + 50 + 30) / 6 = 400 / 6 = 66.7%
        assert(distBar.innerHTML.includes('seg-5'), 'Deve conter segmento Nível 5');
        assert(distBar.innerHTML.includes('seg-0'), 'Deve conter segmento Nível 0');
        assert(metaEl.innerHTML.includes('66.7%'), 'Proficiência média geral deve ser 66.7%');
        assert(metaEl.innerHTML.includes('6 de 6 alunos avaliados'), 'Participação deve indicar 6 avaliados');
    });

    // -------------------------------------------------------------------------
    // TESTE 4: RBAC & Privacidade na Ficha Individual do Estudante
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 4: Ficha Individual do Estudante & Restrições RBAC ---');

    test('Professor só tem acesso a estudantes da sua respectiva escola e turmas', () => {
        const studentSelect = mockDocument.getElementById('saeb-individual-student-select');

        // 1. Simula login de Professor da escola "UI JOSE CORREA LIMA"
        mockWindow.sessionStorage.setItem('userRole', 'Professor');
        mockWindow.sessionStorage.setItem('userEscola', 'UI JOSE CORREA LIMA');

        const avaliadosAmostra = [
            { alunoId: 'a1', alunoNome: 'Estudante da Escola do Professor', escolaNome: 'UI JOSE CORREA LIMA', turmaNome: '2º Ano A', percentual: 80, acertos: 8, totalQuestoes: 10, respostas: ['A'] },
            { alunoId: 'a2', alunoNome: 'Estudante de Outra Escola', escolaNome: 'UE ANITA FURTADO', turmaNome: '5º Ano A', percentual: 50, acertos: 5, totalQuestoes: 10, respostas: ['A'] }
        ];

        mockWindow.initSaebIndividualSheet(avaliadosAmostra, null);

        assert.strictEqual(studentSelect.options.length, 2, 'Opção padrão + 1 estudante permitido');
        assert(studentSelect.options[1].textContent.includes('Estudante da Escola do Professor'));
        assert(!studentSelect.options.some(o => o.textContent.includes('Estudante de Outra Escola')), 'Estudante de outra escola não pode ser listado para o professor');
    });

    test('Ficha individual renderiza nível, habilidades e plano personalizado sob demanda', () => {
        const reportContent = mockDocument.getElementById('student-saeb-report-content');

        mockWindow.renderStudentDiagnosticReport('a1');

        assert(reportContent.innerHTML.includes('Estudante da Escola do Professor'));
        assert(reportContent.innerHTML.includes('Nível 4'));
        assert(reportContent.innerHTML.includes('Plano de Intervenção Pedagógica Individual'));
    });

    // -------------------------------------------------------------------------
    // TESTE 5: Bloqueio Seguro do Boletim SAEB sem Dados
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 5: Exportação Segura do Boletim SAEB ---');

    test('desabilitarBoletimSaebBtn desativa botão quando não há dados', () => {
        const btnBoletim = mockDocument.getElementById('btn-export-saeb-report');

        mockWindow.desabilitarBoletimSaebBtn(true);
        assert.strictEqual(btnBoletim.disabled, true, 'Botão deve ficar desabilitado');

        mockWindow.desabilitarBoletimSaebBtn(false);
        assert.strictEqual(btnBoletim.disabled, false, 'Botão deve ser habilitado quando há dados');
    });

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runSaebProficienciaTestSuite().catch(e => {
    console.error(e);
    process.exit(1);
});
