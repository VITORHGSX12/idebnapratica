const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runBibliotecaTestSuite() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: BIBLIOTECA PEDAGÓGICA & ZERO MOCKS');
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
            removeChild(child) {
                const idx = this.children.indexOf(child);
                if (idx !== -1) this.children.splice(idx, 1);
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
        querySelector: () => createMockElement('sel-mock'),
        querySelectorAll: () => []
    };

    const mockWindow = {
        localStorage: localStorageMock,
        sessionStorage: localStorageMock,
        document: mockDocument,
        location: { hostname: 'localhost', search: '' },
        showToast: () => {},
        alert: () => {},
        fetch: async () => ({ ok: true, json: async () => [] }),
        URL: { createObjectURL: () => 'blob://test', revokeObjectURL: () => {} }
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
    loadScript('js/modules/biblioteca/biblioteca_reader.js');
    loadScript('js/modules/biblioteca/biblioteca_upload.js');
    loadScript('js/modules/biblioteca/biblioteca.js');

    // -------------------------------------------------------------------------
    // TESTE 1: Invalidação de Cache Legado & Estado Vazio Honesto (Zero Mocks)
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Estado Vazio com Zero Materiais (Zero Mocks) ---');

    test('Invalida cache antigo e renderiza Estado Vazio convidativo', async () => {
        // Simula cache poluído antigo
        localStorageMock.setItem('gd_pedagogic_library_db', JSON.stringify([{ id: 'FAKE_BOOK', titulo: 'Mock Antigo' }]));

        await mockWindow.loadLibraryDatabase();

        assert.strictEqual(localStorageMock.getItem('gd_pedagogic_library_db'), null, 'Chave legada gd_pedagogic_library_db deve ser purgada');

        const grid = mockDocument.getElementById('bib-materials-grid');
        const counterText = mockDocument.getElementById('bib-results-counter-text');

        assert(grid.innerHTML.includes('Nenhum material cadastrado ainda'), 'Grid deve exibir mensagem de estado vazio');
        assert(grid.innerHTML.includes('Adicionar Material ao Acervo'), 'Deve orientar a adicionar primeiro material');
        assert(!grid.innerHTML.includes('512 acessos'), 'Nenhum número de acesso fictício deve aparecer');
        assert(counterText.innerHTML.includes('0 de 0'), 'Contador deve indicar 0 de 0 materiais');
    });

    // -------------------------------------------------------------------------
    // TESTE 2: Contadores das Sub-Abas Calculados Dinamicamente
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Contadores de Categoria Dinâmicos ---');

    test('Contadores das pílulas de categoria refletem 0 quando vazio', () => {
        mockWindow.updateCategoryPillCounters();
        const countAll = mockDocument.getElementById('count-bib-all');
        const countSim = mockDocument.getElementById('count-bib-simulados');
        const countRef = mockDocument.getElementById('count-bib-reforco');
        const countMat = mockDocument.getElementById('count-bib-matrizes');
        const countGui = mockDocument.getElementById('count-bib-guias');

        assert.strictEqual(countAll.textContent, '0', 'Total deve ser 0');
        assert.strictEqual(countSim.textContent, '0', 'Simulados deve ser 0');
        assert.strictEqual(countRef.textContent, '0', 'Reforço deve ser 0');
        assert.strictEqual(countMat.textContent, '0', 'Matrizes deve ser 0');
        assert.strictEqual(countGui.textContent, '0', 'Guias deve ser 0');
    });

    // -------------------------------------------------------------------------
    // TESTE 3: Cadastro Real de Material e Atualização Imediata
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Cadastro e Renderização Real ---');

    test('Material adicionado ao acervo aparece na vitrine e atualiza contadores', () => {
        const novoMaterial = {
            id: 'BOOK_REAL_101',
            titulo: 'Simulado Diagnóstico 2026 - Anos Iniciais',
            subtitulo: 'Língua Portuguesa e Matemática',
            etapa: '5º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Simulados',
            tipo: 'Simulado',
            formatoArquivo: 'PDF',
            fileSize: '1.8 MB',
            paginas: 14,
            viewsCount: 0,
            downloadsCount: 0,
            fileName: 'Simulado_2026_Real.pdf'
        };

        mockWindow.PEDAGOGIC_LIBRARY_DATABASE = [novoMaterial];
        localStorageMock.setItem('gd_pedagogic_library_db_v2', JSON.stringify([novoMaterial]));

        mockWindow.renderPedagogicLibrary();

        const grid = mockDocument.getElementById('bib-materials-grid');
        const countAll = mockDocument.getElementById('count-bib-all');
        const countSim = mockDocument.getElementById('count-bib-simulados');

        assert(grid.innerHTML.includes('Simulado Diagnóstico 2026 - Anos Iniciais'), 'Deve renderizar o material cadastrado');
        assert(grid.innerHTML.includes('0 acessos'), 'Contador de acesso do novo material deve iniciar em zero');
    });

    // -------------------------------------------------------------------------
    // TESTE 4: Incremento Real de Visualizações e Downloads
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 4: Contador Real de Acessos ---');

    test('trackAndDownloadBookPdf incrementa contagem real partindo de zero', async () => {
        const book = mockWindow.PEDAGOGIC_LIBRARY_DATABASE[0];
        assert.strictEqual(book.viewsCount, 0, 'Inicia em 0');

        mockWindow.fetch = async () => ({
            ok: true,
            blob: async () => ({ size: 1024 })
        });

        await mockWindow.trackAndDownloadBookPdf(book.id);

        assert.strictEqual(book.viewsCount, 1, 'Deve incrementar para 1 após download/acesso');
        assert.strictEqual(book.downloadsCount, 1, 'Downloads deve incrementar para 1');
    });

    // -------------------------------------------------------------------------
    // TESTE 5: Modal "Gerar Caderno A4 Completo" no Estado Vazio
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 5: Tratamento de Estado Vazio no Gerador A4 ---');

    test('openCombinedCadernoModal desabilita ação quando não há simulados', () => {
        mockWindow.PEDAGOGIC_LIBRARY_DATABASE = [];

        const listContainer = mockDocument.getElementById('modal-combine-simulados-list');
        const btnConfirm = mockDocument.getElementById('btn-confirm-combine-caderno');

        mockWindow.openCombinedCadernoModal();

        assert(listContainer.innerHTML.includes('Nenhum simulado disponível'), 'Deve exibir aviso de acervo vazio');
        assert.strictEqual(btnConfirm.disabled, true, 'Botão de gerar caderno deve ser desabilitado');
    });

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runBibliotecaTestSuite().catch(e => {
    console.error(e);
    process.exit(1);
});
