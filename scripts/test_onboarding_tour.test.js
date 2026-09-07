const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runOnboardingTourTestSuite() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: TOUR GUIADO DE ONBOARDING (12 ETAPAS SPOTLIGHT)');
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

    // Criar ambiente mock de DOM e Storage
    const store = {};
    const localStorageMock = {
        getItem: (k) => store[k] || null,
        setItem: (k, v) => { store[k] = v.toString(); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); }
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
            offsetParent: {}, // simula visível
            getBoundingClientRect: () => ({ top: 100, bottom: 200, left: 50, right: 300, width: 250, height: 100 }),
            scrollIntoView: () => {},
            parentNode: {
                removeChild: (child) => {}
            }
        };
    }

    const mockDocument = {
        readyState: 'complete',
        body: {
            appendChild: (el) => {}
        },
        addEventListener: () => {},
        getElementById: (id) => {
            if (!elements[id]) elements[id] = createMockElement(id);
            return elements[id];
        },
        querySelector: (sel) => createMockElement('sel-' + sel.replace(/[^a-zA-Z0-9]/g, '_')),
        querySelectorAll: (sel) => [createMockElement('item-1'), createMockElement('item-2')],
        createElement: (tag) => createMockElement('elem-' + Math.random(), tag)
    };

    let activeTabSwitched = null;
    const mockWindow = {
        innerWidth: 1280,
        innerHeight: 800,
        localStorage: localStorageMock,
        sessionStorage: localStorageMock,
        document: mockDocument,
        switchTab: (tabId) => { activeTabSwitched = tabId; },
        showToast: (msg, type) => {}
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

    loadScript('js/modules/onboarding/onboarding_tour.js');

    // -------------------------------------------------------------------------
    // TESTE 1: Catálogo Oficial das 12 Etapas
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Catálogo Oficial das 12 Etapas ---');
    test('ONBOARDING_STEPS contém exatamente 12 etapas cadastradas', () => {
        assert(Array.isArray(mockWindow.ONBOARDING_STEPS), 'ONBOARDING_STEPS deve ser um array');
        assert.strictEqual(mockWindow.ONBOARDING_STEPS.length, 12, 'Devem existir exatamente 12 etapas');
    });

    test('Cada etapa possui id, tabId, targetSelector, title e text definidos', () => {
        mockWindow.ONBOARDING_STEPS.forEach((step, idx) => {
            assert(typeof step.id === 'string', `Etapa ${idx} deve ter id`);
            assert(typeof step.tabId === 'string', `Etapa ${idx} deve ter tabId`);
            assert(typeof step.targetSelector === 'string', `Etapa ${idx} deve ter targetSelector`);
            assert(typeof step.title === 'string' && step.title.length > 0, `Etapa ${idx} deve ter title`);
            assert(typeof step.text === 'string' && step.text.length > 0, `Etapa ${idx} deve ter text`);
        });
    });

    // -------------------------------------------------------------------------
    // TESTE 2: Persistência de Status do Usuário
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Persistência de Status do Usuário ---');
    test('isTourCompleted retorna false para usuário novo e true após markTourCompleted', () => {
        localStorageMock.clear();
        const email = 'gestor@goncalvesdias.ma.gov.br';
        assert.strictEqual(mockWindow.isTourCompleted(email), false, 'Inicialmente não deve estar completo');
        
        mockWindow.markTourCompleted(email);
        assert.strictEqual(mockWindow.isTourCompleted(email), true, 'Deve constar como completo após markTourCompleted');
    });

    // -------------------------------------------------------------------------
    // TESTE 3: Card Inicial de Boas-Vindas
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Card Inicial de Boas-Vindas ---');
    test('showWelcomeOnboardingCard e closeWelcomeOnboardingCard operam sem erros', () => {
        assert(typeof mockWindow.showWelcomeOnboardingCard === 'function');
        assert(typeof mockWindow.closeWelcomeOnboardingCard === 'function');
        mockWindow.showWelcomeOnboardingCard();
        mockWindow.closeWelcomeOnboardingCard(true);
    });

    // -------------------------------------------------------------------------
    // TESTE 4: Navegação do Tour e Troca Contextual de Abas
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 4: Navegação do Tour e Troca de Abas ---');
    test('startOnboardingTour inicia na etapa 0 e troca para a aba dashboard', (done) => {
        mockWindow.startOnboardingTour(0);
        assert.strictEqual(activeTabSwitched, 'dashboard');
    });

    test('startOnboardingTour com tabId abre diretamente na etapa correta (ex: calculo-ideb -> Etapa 2)', () => {
        mockWindow.startOnboardingTour('calculo-ideb');
        assert.strictEqual(activeTabSwitched, 'calculo-ideb');
    });

    test('nextOnboardingStep, prevOnboardingStep e closeOnboardingTour operam com sucesso', () => {
        mockWindow.startOnboardingTour(0);
        mockWindow.nextOnboardingStep();
        mockWindow.prevOnboardingStep();
        mockWindow.closeOnboardingTour(true);
        assert.strictEqual(mockWindow.isTourCompleted(), true);
    });

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runOnboardingTourTestSuite().catch(e => {
    console.error(e);
    process.exit(1);
});
