/**
 * ============================================================================
 * TESTES DE VALIDAÇÃO: GESTÃO PEDAGÓGICA, METAS EDITÁVEIS & COMPARATIVO SAEB
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('========================================================================');
console.log('🔍 TESTES DE VALIDAÇÃO: GESTÃO PEDAGÓGICA, METAS & COMPARATIVO SAEB');
console.log('========================================================================\n');

// 1. Setup do Mock DOM
const mockStorage = {};
const toastMessages = [];

const domElements = {};
function createMockElement(tag, id = '') {
    const el = {
        tagName: tag.toUpperCase(),
        id: id,
        children: [],
        style: {},
        value: '',
        _innerHTML: '',
        textContent: '',
        options: [],
        selectedIndex: 0,
        appendChild: function (c) { this.children.push(c); return c; },
        setAttribute: function (k, v) { this[k] = v; },
        getAttribute: function (k) { return this[k]; }
    };
    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._innerHTML; },
        set: function (v) {
            this._innerHTML = v;
            this.textContent = String(v).replace(/<[^>]*>?/gm, '');
            // se tiver options no html
            if (this.tagName === 'SELECT') {
                const matches = v.match(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g);
                if (matches) {
                    this.options = matches.map(m => {
                        const val = m.match(/value="([^"]*)"/)[1];
                        const txt = m.match(/>([^<]*)</)[1];
                        return { value: val, text: txt };
                    });
                    this.selectedIndex = 0;
                }
            }
        }
    });
    if (id) domElements[id] = el;
    return el;
}

const tableComparativoBody = createMockElement('tbody', 'table-saeb-comparativo-body');
const pedagogicPlansContainer = createMockElement('div', 'pedagogic-plans-container');
const planSchoolSelect = createMockElement('select', 'plan-school-select');
const planClassSelect = createMockElement('select', 'plan-class-select');
const btnGenerateAiPlan = createMockElement('button', 'btn-generate-ai-plan');

const mockDocument = {
    getElementById: (id) => domElements[id] || null,
    querySelectorAll: () => [],
    querySelector: () => null,
    readyState: 'complete'
};

const mockWindow = {
    document: mockDocument,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    localStorage: {
        getItem: (k) => mockStorage[k] || null,
        setItem: (k, v) => { mockStorage[k] = String(v); },
        removeItem: (k) => { delete mockStorage[k]; }
    },
    showToast: (msg, type) => {
        toastMessages.push({ msg, type });
    },
    safeCreateIcons: () => {},
    navigateToTab: (tab) => { mockWindow.lastNavigatedTab = tab; }
};

const scriptPath = path.join(__dirname, '../js/modules/saeb/saeb_intervencoes_comparativo.js');
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

// =========================================================================
// TESTE 1: METAS EDITÁVEIS E PERSISTÊNCIA NO BANCO DA SEMED
// =========================================================================
console.log('--- TESTE 1: METAS 2026 EDITÁVEIS & BANCO DA SEMED ---');

// 1.1 Lê meta padrão quando não há customização
const defaultMeta = mockWindow.getSchoolTarget('21286973', 5.5);
assert(defaultMeta === 5.5, '1.1 getSchoolTarget retorna a meta padrão quando não há edição prévia');

// 1.2 Atualiza meta da escola e verifica persistência
mockWindow.handleUpdateComparativoMeta('21286973', '6.0');
const updatedMeta = mockWindow.getSchoolTarget('21286973', 5.5);
assert(updatedMeta === 6.0, '1.2 handleUpdateComparativoMeta persiste nova meta editada (6.0) em gd_school_targets_db');

// 1.3 Rejeita meta fora dos limites (ex: 15.0 ou -2)
mockWindow.handleUpdateComparativoMeta('21286973', '15.0');
assert(mockWindow.getSchoolTarget('21286973', 5.5) === 6.0, '1.3 Bloqueia valores inválidos de meta (> 10.0)');

// =========================================================================
// TESTE 2: QUADRO COMPARATIVO SEM DADOS FALSOS (ESTADO INICIAL)
// =========================================================================
console.log('\n--- TESTE 2: QUADRO COMPARATIVO SEM DADOS FALSOS ---');

// 2.1 Sem simulados no banco -> hasData = false e score = null
const emptyPerf = mockWindow.getSchoolSimuladoPerformance('UI JOSE CORREA LIMA');
assert(emptyPerf.hasData === false && emptyPerf.score === null, '2.1 getSchoolSimuladoPerformance retorna hasData: false quando não há simulados lançados');

// 2.2 Renderiza tabela do comparativo sem notas falsas
mockWindow.renderSaebOficialComparativoTable();
const tableHtml = tableComparativoBody.innerHTML;
assert(tableHtml.includes('--') && tableHtml.includes('Aguardando Simulado'), '2.2 Tabela exibe status "-- (Aguardando Simulado)" para escolas sem avaliações');
assert(tableHtml.includes('input type="number"'), '2.3 Tabela renderiza campo input type="number" para edição da Meta 2026');

// =========================================================================
// TESTE 3: CÁLCULO REATIVO APÓS LANÇAMENTO DE SIMULADO REAL
// =========================================================================
console.log('\n--- TESTE 3: CÁLCULO REATIVO DE SIMULADOS LANÇADOS ---');

// Inserir respostas de simulado no mockStorage para a escola Aldenora
mockStorage['gd_simulado_respostas_db'] = JSON.stringify({
    'sim_2026_01': {
        escola: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ',
        alunos: [
            { id: 'ALU-01', nome: 'Aluno 1', acertos: 6.0 },
            { id: 'ALU-02', nome: 'Aluno 2', acertos: 7.0 },
            { id: 'ALU-03', nome: 'Aluno 3', acertos: 5.0 }
        ]
    }
});

const calculatedPerf = mockWindow.getSchoolSimuladoPerformance('UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ');
assert(calculatedPerf.hasData === true && calculatedPerf.score === 6.0, '3.1 Calcula a média real do simulado (6.0) a partir dos alunos avaliados');

mockWindow.renderSaebOficialComparativoTable();
const updatedTableHtml = tableComparativoBody.innerHTML;
assert(updatedTableHtml.includes('6.0') && updatedTableHtml.includes('Na Meta'), '3.2 Atualiza dinamicamente a linha da escola com a nota real e badge de meta');

// =========================================================================
// TESTE 4: PLANOS DE INTERVENÇÃO PEDAGÓGICA (ZERO STATE & PLANOS DINÂMICOS)
// =========================================================================
console.log('\n--- TESTE 4: MODELOS DE INTERVENÇÃO PEDAGÓGICA ---');

// 4.1 Zero State para escola sem simulado
planSchoolSelect.innerHTML = '<option value="esc_2">UI JOSE CORREA LIMA</option>';
planSchoolSelect.selectedIndex = 0;
mockWindow.generatePedagogicPlansFromCurrentData();
const zeroStateHtml = pedagogicPlansContainer.innerHTML;
assert(zeroStateHtml.includes('Nenhum Simulado Corrigido') && zeroStateHtml.includes('Lançar Respostas do Simulado'),
    '4.1 Exibe Zero State educativo convidando ao lançamento quando a escola não tem simulados');

// 4.2 Planos dinâmicos para escola com simulado
planSchoolSelect.innerHTML = '<option value="esc_1">UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ</option>';
planSchoolSelect.selectedIndex = 0;
mockWindow.generatePedagogicPlansFromCurrentData();
const plansHtml = pedagogicPlansContainer.innerHTML;
assert(plansHtml.includes('Matemática • D13') && plansHtml.includes('Língua Portuguesa • D03') && plansHtml.includes('PDF Pedagógico'),
    '4.2 Gera planos de intervenção direcionados para descritores com botões de PDF Pedagógico');

// =========================================================================
// RELATÓRIO FINAL
// =========================================================================
console.log('\n========================================================================');
console.log(`RELATÓRIO: ${passCount} PASSOU | ${failCount} FALHAS`);
console.log('========================================================================\n');

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
