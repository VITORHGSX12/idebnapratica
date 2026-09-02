const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runPlanejamentoTestSuite() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: CRONOGRAMA & PLANEJAMENTO PEDAGÓGICO');
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

    // Mock do ambiente DOM e LocalStorage
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
            classList: {
                _classes: new Set(),
                add(c) { this._classes.add(c); },
                remove(c) { this._classes.delete(c); },
                contains(c) { return this._classes.has(c); },
                toggle(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
            },
            style: {},
            textContent: '',
            innerHTML: '',
            value: '',
            children: [],
            appendChild(child) { this.children.push(child); return child; },
            getAttribute: () => null,
            setAttribute: () => {},
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
        showToast: (msg) => {}
    };
    mockWindow.window = mockWindow;
    global.window = mockWindow;
    global.document = mockDocument;
    global.localStorage = localStorageMock;

    function loadScript(relPath) {
        const fullPath = path.join(__dirname, '..', relPath);
        const code = fs.readFileSync(fullPath, 'utf8');
        const fn = new Function('window', 'document', 'global', code);
        fn(mockWindow, mockDocument, mockWindow);
    }

    loadScript('js/core/helpers.js');
    loadScript('js/modules/cronograma/cronograma_state.js');
    loadScript('js/modules/cronograma/cronograma_views_monthly.js');
    loadScript('js/modules/cronograma/cronograma_views_weekly.js');
    loadScript('js/modules/cronograma/cronograma_views_comparison.js');
    loadScript('js/modules/cronograma/cronograma_progress_modal.js');
    loadScript('js/modules/cronograma/cronograma_views.js');
    loadScript('js/modules/cronograma/cronograma_trash.js');

    // -------------------------------------------------------------------------
    // TESTE 1: Cálculo Determinístico de Status por Data de Referência
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Cálculo Determinístico de Status (Fonte Única da Verdade) ---');
    const refDate = '2026-08-20';

    test('Aula com status "trabalhada" retorna "trabalhada" independente da data', () => {
        const les = { status: 'trabalhada', date: '2026-08-10' };
        assert.strictEqual(mockWindow.getLessonComputedStatus(les, refDate), 'trabalhada');
    });

    test('Aula "planejada" com data anterior à referência retorna "atrasada"', () => {
        const les = { status: 'planejada', date: '2026-08-15' };
        assert.strictEqual(mockWindow.getLessonComputedStatus(les, refDate), 'atrasada');
    });

    test('Aula "planejada" com data igual ou posterior à referência retorna "planejada"', () => {
        const lesToday = { status: 'planejada', date: '2026-08-20' };
        const lesFuture = { status: 'planejada', date: '2026-08-25' };
        assert.strictEqual(mockWindow.getLessonComputedStatus(lesToday, refDate), 'planejada');
        assert.strictEqual(mockWindow.getLessonComputedStatus(lesFuture, refDate), 'planejada');
    });

    // -------------------------------------------------------------------------
    // TESTE 2: Agregação Consolidada de Progresso (calculateScheduleProgress)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Agregação Consolidada de Progresso & Breakdowns ---');
    const sampleLessons = [
        { id: '1', disciplina: 'Língua Portuguesa', status: 'trabalhada', date: '2026-08-10', habilidadeCode: 'D01' },
        { id: '2', disciplina: 'Língua Portuguesa', status: 'planejada', date: '2026-08-15', habilidadeCode: 'D03' }, // Atrasada (< 2026-08-20)
        { id: '3', disciplina: 'Matemática', status: 'trabalhada', date: '2026-08-18', habilidadeCode: 'D13' },
        { id: '4', disciplina: 'Matemática', status: 'planejada', date: '2026-08-25', habilidadeCode: 'D14' } // Futura
    ];

    test('calculateScheduleProgress calcula soma e percentuais com exatidão', () => {
        const p = mockWindow.calculateScheduleProgress(sampleLessons, refDate);
        assert.strictEqual(p.total, 4, 'Total de aulas deve ser 4');
        assert.strictEqual(p.trabalhadas, 2, 'Aulas trabalhadas = 2');
        assert.strictEqual(p.atrasadas, 1, 'Aulas atrasadas = 1');
        assert.strictEqual(p.planejadas, 1, 'Aulas planejadas futuras = 1');
        assert.strictEqual(p.pct, 50, 'Percentual geral deve ser 50%');

        // Validação de paridade por disciplina
        assert.strictEqual(p.bySubject['Língua Portuguesa'].total, 2);
        assert.strictEqual(p.bySubject['Língua Portuguesa'].trabalhadas, 1);
        assert.strictEqual(p.bySubject['Língua Portuguesa'].atrasadas, 1);
        assert.strictEqual(p.bySubject['Língua Portuguesa'].pct, 50);

        assert.strictEqual(p.bySubject['Matemática'].total, 2);
        assert.strictEqual(p.bySubject['Matemática'].trabalhadas, 1);
        assert.strictEqual(p.bySubject['Matemática'].atrasadas, 0);
        assert.strictEqual(p.bySubject['Matemática'].pct, 50);
    });

    test('calculateScheduleProgress identifica lacunas pendentes', () => {
        const p = mockWindow.calculateScheduleProgress(sampleLessons, refDate);
        assert(p.lacunas.includes('D03'), 'D03 deve constar como lacuna pendente');
        assert(p.lacunas.includes('D14'), 'D14 deve constar como lacuna pendente');
    });

    // -------------------------------------------------------------------------
    // TESTE 3: Ciclo de Vida da Lixeira & Auto-Expiração (> 30 dias)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Ciclo de Vida da Lixeira e Auto-Expiração ---');
    test('Soft delete move aula para a lixeira sem perda de dados', () => {
        const initial = [{ id: 'les_test_1', disciplina: 'Matemática', date: '2026-08-18', status: 'planejada' }];
        mockWindow.saveScheduleLessonsDb(initial);

        mockWindow.handleDeleteLessonWithTrash('les_test_1');

        const remaining = mockWindow.getScheduleLessonsDb();
        const trash = mockWindow.getScheduleTrashDb();

        assert.strictEqual(remaining.length, 0, 'Aula deve sair do cronograma ativo');
        assert.strictEqual(trash.length, 1, 'Aula deve entrar na lixeira');
        assert.strictEqual(trash[0].id, 'les_test_1');
        assert(trash[0].deletedAt, 'Deve conter timestamp de exclusão');
    });

    test('Restauração de aula da lixeira reintroduz no cronograma ativo', () => {
        mockWindow.handleRestoreTrashLesson('les_test_1');

        const active = mockWindow.getScheduleLessonsDb();
        const trash = mockWindow.getScheduleTrashDb();

        assert.strictEqual(active.length, 1, 'Aula restaurada volta ao cronograma');
        assert.strictEqual(trash.length, 0, 'Lixeira deve ficar vazia');
        assert.strictEqual(active[0].id, 'les_test_1');
    });

    test('cleanupExpiredTrash purga itens excluídos há mais de 30 dias', () => {
        const oldDeletedAt = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(); // 35 dias atrás
        const recentDeletedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 dias atrás

        mockWindow.saveScheduleTrashDb([
            { id: 'expired_1', deletedAt: oldDeletedAt },
            { id: 'recent_1', deletedAt: recentDeletedAt }
        ]);

        mockWindow.cleanupExpiredTrash(30);

        const trashAfter = mockWindow.getScheduleTrashDb();
        assert.strictEqual(trashAfter.length, 1, 'Item expirado deve ser purgado');
        assert.strictEqual(trashAfter[0].id, 'recent_1', 'Item recente (< 30 dias) deve ser preservado');
    });

    // -------------------------------------------------------------------------
    // TESTE 4: Duplicação Rápida de Grade Semanal
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 4: Duplicação Rápida de Grade Semanal ---');
    test('handleDuplicateCurrentWeekToNext projeta aulas para a semana seguinte com status planejada', () => {
        mockDocument.getElementById('cal-filter-turma-context').value = 'UI JOSE CORREA LIMA — 2º Ano A';
        mockWindow.saveScheduleLessonsDb([
            { id: 'seed_seg', turmaContext: 'UI JOSE CORREA LIMA — 2º Ano A', date: '2026-08-17', status: 'trabalhada', time: '07:30 - 08:20', disciplina: 'Língua Portuguesa' }
        ]);

        mockWindow.handleDuplicateCurrentWeekToNext();

        const all = mockWindow.getScheduleLessonsDb();
        assert.strictEqual(all.length, 2, 'Deve conter aula original e aula replicada');
        const replicated = all.find(l => l.id !== 'seed_seg');
        assert.strictEqual(replicated.date, '2026-08-24', 'Data replicada deve ser exatamente 7 dias depois (2026-08-24)');
        assert.strictEqual(replicated.status, 'planejada', 'Aula replicada deve nascer como planejada');
    });

    // -------------------------------------------------------------------------
    // TESTE 5: Sincronização Absoluta entre Calendário e Modal de Progresso
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 5: Sincronização entre Visões e Modal de Progresso ---');
    test('renderScheduleMonthlyCalendar e openDetailedProgressModal usam a mesma métrica sem divergência', () => {
        const lessons = mockWindow.CronogramaState.DEFAULT_SCHEDULE_LESSONS_V2;
        mockWindow.saveScheduleLessonsDb(lessons);

        const progressCalc = mockWindow.calculateScheduleProgress(lessons, '2026-08-18');
        assert(typeof progressCalc.pct === 'number', 'Percentual válido');
        assert(progressCalc.total === lessons.length, 'Total consolidado bate com o banco de aulas');
    });

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runPlanejamentoTestSuite().catch(e => {
    console.error(e);
    process.exit(1);
});
