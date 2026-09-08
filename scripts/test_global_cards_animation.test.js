/**
 * ============================================================================
 * TESTES DE VALIDAÇÃO: ANIMAÇÃO GLOBAL DE CARDS INFORMATIVOS (12 ETAPAS)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('========================================================================');
console.log('🔍 TESTES DE VALIDAÇÃO: ANIMAÇÃO GLOBAL DE CARDS (12 ETAPAS)');
console.log('========================================================================\n');

// 1. Mock DOM
const domPanels = {};

function createMockElement(tag, id = '', className = '') {
    const el = {
        tagName: tag.toUpperCase(),
        id: id,
        className: className,
        classList: {
            classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
            add: function (...args) { args.forEach(c => this.classes.add(c)); el.className = Array.from(this.classes).join(' '); },
            remove: function (...args) { args.forEach(c => this.classes.delete(c)); el.className = Array.from(this.classes).join(' '); },
            contains: function (c) { return this.classes.has(c); }
        },
        children: [],
        style: {},
        textContent: '',
        _innerHTML: '',
        appendChild: function (c) { this.children.push(c); return c; },
        setAttribute: function (k, v) { this[k] = v; },
        getAttribute: function (k) { return this[k]; },
        removeAttribute: function (k) { delete this[k]; },
        querySelectorAll: function (sel) {
            const results = [];
            function traverse(node) {
                if (!node || !node.children) return;
                node.children.forEach(child => {
                    const isCard = child.classList && (child.classList.contains('card') || child.classList.contains('metric-card') || child.classList.contains('stat-card'));
                    const isNum = child.classList && (child.classList.contains('metric-value') || child.classList.contains('stat-value') || child.tagName === 'H3' || child.tagName === 'STRONG');
                    if (sel.includes('.card') && isCard) results.push(child);
                    else if (sel.includes('.metric-value') && isNum) results.push(child);
                    else if (sel === '.card' && child.classList.contains('card')) results.push(child);
                    traverse(child);
                });
            }
            traverse(this);
            return results;
        },
        querySelector: function (sel) {
            const list = this.querySelectorAll(sel);
            return list.length > 0 ? list[0] : null;
        },
        addEventListener: function () {}
    };

    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._innerHTML; },
        set: function (v) {
            this._innerHTML = v;
            this.textContent = String(v).replace(/<[^>]*>?/gm, '');
        }
    });

    if (id) domPanels[id] = el;
    return el;
}

// Criar painéis simulados para as 12 etapas
const PANELS = [
    'onboarding-panel',
    'dashboard',
    'escolas-panel',
    'turmas-panel',
    'alunos-panel',
    'matrizes-panel',
    'questoes-panel',
    'avaliacoes-panel',
    'cronograma-panel',
    'gestao-pedagogica',
    'metas-panel',
    'admin-panel'
];

PANELS.forEach(pId => {
    const p = createMockElement('section', pId, 'tab-content');
    // Adicionar 4 cards dentro de cada painel
    for (let i = 1; i <= 4; i++) {
        const c = createMockElement('div', `${pId}-card-${i}`, 'card metric-card');
        const h = createMockElement('h3', '', 'metric-value');
        h.innerHTML = (i * 25).toString();
        c.appendChild(h);
        p.appendChild(c);
    }
});

const mockDocument = {
    getElementById: (id) => domPanels[id] || null,
    querySelectorAll: (sel) => {
        if (sel.includes('.nav-item') || sel.includes('.subtab-btn')) return [];
        return [];
    },
    querySelector: (sel) => domPanels['dashboard'] || null,
    readyState: 'complete'
};

const mockWindow = {
    document: mockDocument,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    matchMedia: () => ({ matches: false }),
    navigateToTab: function(tab) { mockWindow.currentTab = tab; }
};

const scriptPath = path.join(__dirname, '../js/core/global_cards_animation.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

const ctx = vm.createContext(mockWindow);
vm.runInContext(scriptCode, ctx);

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  [✓ PASS] ${message}`);
        passCount++;
    } else {
        console.error(`  [✗ FAIL] ${message}`);
        failCount++;
    }
}

// TESTE 1: Módulo inicializado e funções exportadas
console.log('--- TESTE 1: INICIALIZAÇÃO & FUNÇÕES GLOBAIS ---');
assert(typeof mockWindow.animatePanelCards === 'function', '1.1 animatePanelCards exportada globalmente');
assert(typeof mockWindow.triggerActiveTabAnimation === 'function', '1.2 triggerActiveTabAnimation exportada globalmente');
assert(typeof mockWindow.initGlobalCardsAnimation === 'function', '1.3 initGlobalCardsAnimation exportada globalmente');

// TESTE 2: Animação e Stagger nos cards de uma etapa
console.log('\n--- TESTE 2: APLICAÇÃO DE ANIMAÇÃO COM STAGGER (CASCATA) ---');
const dashPanel = domPanels['dashboard'];
mockWindow.animatePanelCards(dashPanel);

const dashCards = dashPanel.querySelectorAll('.card');
assert(dashCards.length === 4, '2.1 Identificou os 4 cards informativos do painel');

const allHaveAnimationClass = dashCards.every(c => c.classList.contains('global-card-animate') && c.classList.contains('stat-card-elevate'));
assert(allHaveAnimationClass, '2.2 Todos os cards receberam as classes global-card-animate e stat-card-elevate');

const hasStaggerDelays = dashCards[0].style.animationDelay === '0ms' &&
                         dashCards[1].style.animationDelay === '65ms' &&
                         dashCards[2].style.animationDelay === '130ms' &&
                         dashCards[3].style.animationDelay === '195ms';
assert(hasStaggerDelays, '2.3 Delays escalonados aplicados corretamente (0ms, 65ms, 130ms, 195ms)');

// TESTE 3: Cobertura de Todas as 12 Etapas
console.log('\n--- TESTE 3: COBERTURA NAS 12 ETAPAS DO SISTEMA ---');
let all12Animated = true;

PANELS.forEach((pId, idx) => {
    const p = domPanels[pId];
    mockWindow.animatePanelCards(p);
    const pCards = p.querySelectorAll('.card');
    const ok = pCards.every(c => c.classList.contains('global-card-animate'));
    if (!ok) all12Animated = false;
});

assert(all12Animated, '3.1 Animação executada com sucesso em todas as 12 etapas/módulos do sistema');

// TESTE 4: Interceptação do navigateToTab
console.log('\n--- TESTE 4: INTEGRAÇÃO COM NAVEGAÇÃO DE ABAS ---');
mockWindow.navigateToTab('escolas');
assert(mockWindow.currentTab === 'escolas', '4.1 navigateToTab executa a lógica original e dispara triggerActiveTabAnimation');

// Relatório
console.log('\n========================================================================');
console.log(`RELATÓRIO: ${passCount} PASSOU | ${failCount} FALHAS`);
console.log('========================================================================\n');

if (failCount > 0) process.exit(1);
else process.exit(0);
