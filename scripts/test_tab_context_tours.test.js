/**
 * ============================================================================
 * SUÍTE DE TESTES AUTOMATIZADOS: TOUR GUIADO CONTEXTUAL POR ABA
 * Arquivo: scripts/test_tab_context_tours.test.js
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('================================================================');
console.log('SUÍTE DE TESTES: TOUR GUIADO CONTEXTUAL (DENTRO DE CADA ABA)');
console.log('================================================================\n');

// 1. Montagem do Mock DOM
const domStorage = {};
const mockLocalStorage = {
    getItem: (k) => domStorage[k] || null,
    setItem: (k, v) => { domStorage[k] = String(v); },
    removeItem: (k) => { delete domStorage[k]; },
    clear: () => { Object.keys(domStorage).forEach(k => delete domStorage[k]); }
};

const mockElements = {};
function createMockElement(tag, initialId, className) {
    let currentId = initialId || '';
    const el = {
        tagName: tag.toUpperCase(),
        get id() { return currentId; },
        set id(val) {
            if (currentId && mockElements[currentId] === el) delete mockElements[currentId];
            currentId = val;
            if (val) mockElements[val] = el;
        },
        className: className || '',
        classList: {
            classes: new Set(className ? className.split(' ') : []),
            add: function(...c) { c.forEach(x => this.classes.add(x)); el.className = Array.from(this.classes).join(' '); },
            remove: function(...c) { c.forEach(x => this.classes.delete(x)); el.className = Array.from(this.classes).join(' '); },
            contains: function(c) { return this.classes.has(c); },
            toggle: function(c) { if (this.classes.has(c)) this.remove(c); else this.add(c); }
        },
        style: {},
        innerHTML: '',
        innerText: '',
        textContent: '',
        children: [],
        parentElement: null,
        parentNode: null,
        appendChild: function(child) {
            child.parentElement = el;
            child.parentNode = el;
            el.children.push(child);
            return child;
        },
        removeChild: function(child) {
            el.children = el.children.filter(c => c !== child);
            child.parentElement = null;
            child.parentNode = null;
            if (child.id && mockElements[child.id] === child) delete mockElements[child.id];
            return child;
        },
        remove: function() {
            if (el.parentNode) el.parentNode.removeChild(el);
            if (el.parentElement) el.parentElement.removeChild(el);
            if (currentId && mockElements[currentId] === el) delete mockElements[currentId];
        },
        contains: function(other) {
            if (other === el) return true;
            return el.children.some(c => c.contains ? c.contains(other) : c === other);
        },
        getBoundingClientRect: function() {
            return { top: 100, bottom: 250, left: 50, right: 350, width: 300, height: 150 };
        },
        scrollIntoView: function() {},
        offsetParent: {}
    };
    if (initialId) mockElements[initialId] = el;
    return el;
}

const mockDocument = {
    body: createMockElement('body', 'body', ''),
    getElementById: (id) => mockElements[id] || null,
    querySelector: (sel) => {
        if (sel.startsWith('#')) return mockElements[sel.slice(1)] || null;
        if (sel.includes('.tab-content.active')) return createMockElement('section', 'dashboard', 'tab-content active');
        if (sel.includes('.tab-content')) return createMockElement('section', 'dashboard', 'tab-content active');
        return createMockElement('div', 'mock-target', 'mock-class');
    },
    querySelectorAll: (sel) => [createMockElement('div', 'el1', 'tab-content')],
    createElement: (tag) => createMockElement(tag, '', ''),
    addEventListener: () => {},
    removeEventListener: () => {}
};

const mockWindow = {
    document: mockDocument,
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage,
    innerWidth: 1440,
    innerHeight: 900,
    addEventListener: () => {},
    removeEventListener: () => {},
    setTimeout: (fn, ms) => setTimeout(fn, ms),
    clearTimeout: (id) => clearTimeout(id),
    switchTab: (tabId) => { mockWindow.currentActiveTab = tabId; },
    showToast: (msg, type) => { mockWindow.lastToast = { msg, type }; }
};

mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

// Carregar script tab_context_tours.js no contexto seguro
const scriptPath = path.resolve(__dirname, '../js/modules/onboarding/tab_context_tours.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

const ctx = vm.createContext(mockWindow);
vm.runInContext(scriptCode, ctx);

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  [✓ PASS] ${name}`);
        passed++;
    } catch (e) {
        console.error(`  [✗ FAIL] ${name}`);
        console.error(`          ${e.message}\n`);
        failed++;
    }
}

// ============================================================================
// TESTES DO CATÁLOGO DE PASSOS
// ============================================================================
console.log('--- TESTE 1: Catálogo Contextual de Tours por Aba ---');

test('TAB_CONTEXTUAL_TOURS contém todas as principais abas cadastradas', () => {
    assert(mockWindow.TAB_CONTEXTUAL_TOURS, 'TAB_CONTEXTUAL_TOURS deve estar exposto globalmente');
    const requiredTabs = [
        'dashboard',
        'calculo-ideb',
        'escolas-panel',
        'alunos-panel',
        'metas-ideb',
        'ideb-comparativo',
        'matriz-descritores',
        'cronograma-habilidades',
        'criar-avaliacoes',
        'aplicacao-provas',
        'gestao-pedagogica',
        'biblioteca-recursos',
        'doc-tecnica',
        'admin-panel'
    ];

    requiredTabs.forEach(tab => {
        assert(mockWindow.TAB_CONTEXTUAL_TOURS[tab], `Aba '${tab}' deve possuir tour contextual`);
        assert(mockWindow.TAB_CONTEXTUAL_TOURS[tab].length > 0, `Aba '${tab}' deve possuir pelo menos 1 passo`);
    });
});

test('Cada passo contextual possui targetSelector, title e text válidos', () => {
    Object.keys(mockWindow.TAB_CONTEXTUAL_TOURS).forEach(tab => {
        const steps = mockWindow.TAB_CONTEXTUAL_TOURS[tab];
        steps.forEach((step, idx) => {
            assert(step.targetSelector, `Passo ${idx} da aba '${tab}' deve ter targetSelector`);
            assert(step.title && step.title.trim().length > 0, `Passo ${idx} da aba '${tab}' deve ter título`);
            assert(step.text && step.text.trim().length > 0, `Passo ${idx} da aba '${tab}' deve ter texto`);
        });
    });
});

// ============================================================================
// TESTES DE NAVEGAÇÃO E EXECUÇÃO DO TOUR
// ============================================================================
console.log('\n--- TESTE 2: Execução do Tour Contextual da Aba ---');

test('startTabContextTour inicia na etapa 0 e comuta a aba ativa', (done) => {
    mockWindow.startTabContextTour('calculo-ideb');
    assert.strictEqual(mockWindow.currentActiveTab, 'calculo-ideb', 'Deve ter trocado para a aba calculo-ideb');
    
    setTimeout(() => {
        const card = mockDocument.getElementById('tab-tour-tooltip-card');
        assert(card, 'Card do tour da aba deve existir no DOM');
        assert(!card.classList.contains('hidden'), 'Card do tour deve estar visível');
        assert(card.innerHTML.includes('Guia da Aba'), 'Card deve exibir indicador do guia');
        assert(card.innerHTML.includes('Passo 1 de'), 'Card deve indicar Passo 1');
    }, 150);
});

test('nextTabTourStep e prevTabTourStep avançam e retrocedem passos', (done) => {
    mockWindow.startTabContextTour('dashboard');
    setTimeout(() => {
        mockWindow.nextTabTourStep();
        setTimeout(() => {
            const card = mockDocument.getElementById('tab-tour-tooltip-card');
            assert(card.innerHTML.includes('Passo 2 de'), 'Deve avançar para o Passo 2');
            
            mockWindow.prevTabTourStep();
            setTimeout(() => {
                assert(card.innerHTML.includes('Passo 1 de'), 'Deve retroceder para o Passo 1');
                mockWindow.closeTabContextTour();
                assert(card.classList.contains('hidden'), 'Card deve ficar oculto após fechar');
            }, 150);
        }, 150);
    }, 150);
});

test('toggleHelpTourMenu abre e fecha menu popover de ajuda', () => {
    const helpBtn = createMockElement('button', 'header-help-tour-btn', 'btn');
    const parent = createMockElement('div', 'nav-right', '');
    parent.appendChild(helpBtn);
    mockDocument.body.appendChild(parent);

    mockWindow.toggleHelpTourMenu();
    let popover = mockDocument.getElementById('help-tour-popover-menu');
    assert(popover, 'Popover de ajuda deve ser renderizado');
    assert(popover.innerHTML.includes('Tour Desta Tela'), 'Deve conter opção do Tour Desta Tela');
    assert(popover.innerHTML.includes('Tour Geral do Sistema'), 'Deve conter opção do Tour Geral');

    mockWindow.toggleHelpTourMenu();
    popover = mockDocument.getElementById('help-tour-popover-menu');
    assert(!popover, 'Popover de ajuda deve fechar no toggle');
});

// ============================================================================
// RELATÓRIO FINAL
// ============================================================================
setTimeout(() => {
    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================\n');
    if (failed > 0) process.exit(1);
}, 800);
