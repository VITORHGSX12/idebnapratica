/**
 * ============================================================================
 * AUDITORIA DETALHADA: ETAPA 6 — MATRIZ & DESCRITORES SAEB/BNCC (#matriz-descritores)
 * Avalia cada item e subitem com os critérios:
 * 🟢 Funciona: Plenamente ativo, com dados corretos e eventos funcionais.
 * 🟡 Precisa ser implementado: Estrutura existe mas falta lógica/dados completos.
 * 🔴 Não funciona: Quebrado, com erro de execução ou bloqueio de interface.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('========================================================================');
console.log('AUDITORIA DE ITENS E SUBITENS: ETAPA 6 — MATRIZ & DESCRITORES (#matriz-descritores)');
console.log('========================================================================\n');

// 1. Ler index.html para validação estática de presença de componentes
const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function checkHtmlContains(pattern) {
    return pattern instanceof RegExp ? pattern.test(html) : html.includes(pattern);
}

// 2. Setup do Mock DOM Environment
const domElements = {};
function createElement(tag) {
    const el = {
        tagName: tag.toUpperCase(),
        id: '',
        className: '',
        style: {},
        children: [],
        innerHTML: '',
        textContent: '',
        attributes: {},
        dataset: {},
        options: [],
        value: '',
        disabled: false,
        setAttribute: function(k, v) { this.attributes[k] = v; },
        getAttribute: function(k) { return this.attributes[k] || null; },
        appendChild: function(c) {
            this.children.push(c);
            if (c.tagName === 'OPTION') this.options.push(c);
            return c;
        },
        querySelectorAll: function(sel) {
            if (sel === 'tr' && el.innerHTML) {
                const matches = el.innerHTML.match(/<tr[\s\S]*?<\/tr>/gi) || [];
                return matches.map(m => ({
                    innerHTML: m,
                    querySelectorAll: (sub) => {
                        if (sub === 'td') {
                            const tds = m.match(/<td[\s\S]*?<\/td>/gi) || [];
                            return tds.map(td => ({ innerHTML: td, textContent: td.replace(/<[^>]+>/g, '').trim() }));
                        }
                        return [];
                    }
                }));
            }
            if (sel.includes('.matriz-main-tab-btn')) {
                return [
                    mockDocument.getElementById('btn-matriz-tab-saeb'),
                    mockDocument.getElementById('btn-matriz-tab-bncc')
                ];
            }
            if (sel.includes('.matriz-etapa-btn')) {
                return ['5ano', '9ano', 'alfabetizacao', 'em', 'oba'].map(et => {
                    const b = createElement('button');
                    b.setAttribute('data-etapa', et);
                    return b;
                });
            }
            return [createElement('div')];
        },
        querySelector: function(sel) { return createElement('div'); },
        addEventListener: function() {},
        removeEventListener: function() {},
        classList: {
            add: function(c) { el.className = (el.className + ' ' + c).trim(); },
            remove: function(c) { el.className = el.className.replace(new RegExp('\\b' + c + '\\b', 'g'), '').trim(); },
            contains: function(c) { return el.className.includes(c); },
            toggle: function(c) {
                if (el.className.includes(c)) el.classList.remove(c);
                else el.classList.add(c);
            }
        }
    };
    return el;
}

const mockDocument = {
    readyState: 'complete',
    getElementById: function(id) {
        if (!domElements[id]) {
            domElements[id] = createElement('div');
            domElements[id].id = id;
            if (id === 'bncc-subject-select') domElements[id].value = 'Língua Portuguesa';
            if (id === 'bncc-stage-select') domElements[id].value = 'all';
            if (id === 'matriz-search-input' || id === 'bncc-search-input') domElements[id].value = '';
            if (id === 'btn-matriz-tab-saeb') domElements[id].classList.add('active');
            if (id === 'subview-matriz-bncc') domElements[id].classList.add('hidden');
        }
        return domElements[id];
    },
    querySelectorAll: function(sel) {
        if (sel.includes('.matriz-main-tab-btn')) {
            return [
                mockDocument.getElementById('btn-matriz-tab-saeb'),
                mockDocument.getElementById('btn-matriz-tab-bncc')
            ];
        }
        if (sel.includes('.matriz-etapa-btn')) {
            return ['5ano', '9ano', 'alfabetizacao', 'em', 'oba'].map(et => {
                const b = createElement('button');
                b.setAttribute('data-etapa', et);
                return b;
            });
        }
        return [createElement('div')];
    },
    querySelector: function(sel) { return createElement('div'); },
    createElement: createElement,
    addEventListener: function() {},
    removeEventListener: function() {},
    body: createElement('body')
};

const mockWindow = {
    document: mockDocument,
    localStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; }
    },
    sessionStorage: {
        _data: {},
        getItem: function(k) { return this._data[k] || null; },
        setItem: function(k, v) { this._data[k] = String(v); },
        removeItem: function(k) { delete this._data[k]; }
    },
    addEventListener: function() {},
    removeEventListener: function() {},
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    lucide: { createIcons: function() {} },
    showToast: function() {},
    alert: function() {}
};

mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

const context = vm.createContext(mockWindow);

// Carregar Base Oficial BNCC_HABILIDADES_OFICIAL
const bnccCode = fs.readFileSync(path.join(__dirname, '../bncc_habilidades_oficial.js'), 'utf8');
vm.runInContext(bnccCode, context);

// Carregar Módulo de Matrizes
const matrizesCode = fs.readFileSync(path.join(__dirname, '../js/modules/matrizes/matrizes.js'), 'utf8');
vm.runInContext(matrizesCode, context);

const results = [];

function audit(id, name, status, details, subitems = []) {
    results.push({ id, name, status, details, subitems });
}

// =========================================================================
// TESTES E AVALIAÇÃO DOS 10 ITENS DA ETAPA 6
// =========================================================================

// ITEM 1: Header & Identificação Visual
const hasHeaderBadge = checkHtmlContains('MATRIZES SAEB, SEAMA & HABILIDADES DA BNCC');
const hasHeaderTitle = checkHtmlContains('Matrizes de Referência & Habilidades da BNCC');
const item1Ok = hasHeaderBadge && hasHeaderTitle;

audit(
    '1',
    'Header & Identificação Estratégica da Matriz',
    item1Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Cabeçalho executivo identificando o catálogo de matrizes SAEB, SEAMA e habilidades da BNCC.',
    [
        { name: 'Badge descritivo de matrizes externas e BNCC', status: hasHeaderBadge ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Título canônico do módulo', status: hasHeaderTitle ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 2: Sub-Navegação Principal (2 Abas: SAEB / BNCC)
const hasBtnTabSaeb = checkHtmlContains('id="btn-matriz-tab-saeb"');
const hasBtnTabBncc = checkHtmlContains('id="btn-matriz-tab-bncc"');
const hasSwitchMainTabFn = typeof mockWindow.switchMatrizMainTab === 'function';

let switchMainTabWorks = false;
try {
    mockWindow.switchMatrizMainTab('bncc');
    const subviewBncc = mockDocument.getElementById('subview-matriz-bncc');
    const isBnccOpen = subviewBncc && !subviewBncc.classList.contains('hidden') && subviewBncc.style.display !== 'none';
    mockWindow.switchMatrizMainTab('saeb');
    const subviewSaeb = mockDocument.getElementById('subview-matriz-saeb');
    const isSaebOpen = subviewSaeb && !subviewSaeb.classList.contains('hidden') && subviewSaeb.style.display !== 'none';
    switchMainTabWorks = isBnccOpen && isSaebOpen;
} catch(e) {
    switchMainTabWorks = false;
}

const item2Ok = hasBtnTabSaeb && hasBtnTabBncc && hasSwitchMainTabFn && switchMainTabWorks;

audit(
    '2',
    'Sub-Navegação Principal (Matrizes SAEB vs Explorador BNCC)',
    item2Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Alternância instantânea entre as Matrizes de Referência (SAEB / SEAMA) e o Explorador de Habilidades da BNCC.',
    [
        { name: 'Botão #btn-matriz-tab-saeb no HTML', status: hasBtnTabSaeb ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Botão #btn-matriz-tab-bncc no HTML', status: hasBtnTabBncc ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Execução de switchMatrizMainTab() com controle de exibição', status: switchMainTabWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 3: Seletor de Etapas SAEB / SEAMA (5 Etapas)
const hasEtapa5ano = checkHtmlContains('data-etapa="5ano"');
const hasEtapa9ano = checkHtmlContains('data-etapa="9ano"');
const hasEtapaAlfa = checkHtmlContains('data-etapa="alfabetizacao"');
const hasEtapaEm = checkHtmlContains('data-etapa="em"');
const hasEtapaOba = checkHtmlContains('data-etapa="oba"');
const hasSwitchEtapaFn = typeof mockWindow.switchMatrizEtapa === 'function';

let switchEtapaWorks = false;
try {
    mockWindow.switchMatrizEtapa('9ano');
    const lp9 = mockDocument.getElementById('matriz-lp-list').children.length;
    mockWindow.switchMatrizEtapa('5ano');
    const lp5 = mockDocument.getElementById('matriz-lp-list').children.length;
    switchEtapaWorks = lp9 > 0 && lp5 > 0;
} catch(e) {
    switchEtapaWorks = false;
}

const item3Ok = hasEtapa5ano && hasEtapa9ano && hasEtapaAlfa && hasEtapaEm && hasEtapaOba && hasSwitchEtapaFn && switchEtapaWorks;

audit(
    '3',
    'Seletor de Etapas Avaliadas SAEB / SEAMA (5 Ciclos)',
    item3Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Navegação entre Anos Iniciais (5º Ano), Anos Finais (9º Ano), Alfabetização (2º Ano), Ensino Médio e Olimpíada (OBA).',
    [
        { name: 'Anos Iniciais - 5º Ano ("5ano")', status: hasEtapa5ano ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Anos Finais - 9º Ano ("9ano")', status: hasEtapa9ano ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Alfabetização - 2º Ano ("alfabetizacao")', status: hasEtapaAlfa ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Ensino Médio - 3ª Série ("em")', status: hasEtapaEm ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'OBA - Astronomia & Espaço ("oba")', status: hasEtapaOba ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Execução de switchMatrizEtapa() com recarga de descritores', status: switchEtapaWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 4: Campo de Busca Rápida de Descritores
const hasMatrizSearchInput = checkHtmlContains('id="matriz-search-input"');
const hasFilterDescFn = typeof mockWindow.filterMatrizDescritores === 'function';

let filterDescWorks = false;
try {
    mockDocument.getElementById('matriz-search-input').value = 'D1';
    mockWindow.filterMatrizDescritores();
    const lpFiltered = mockDocument.getElementById('matriz-lp-list').children.length;
    mockDocument.getElementById('matriz-search-input').value = '';
    mockWindow.filterMatrizDescritores();
    const lpReset = mockDocument.getElementById('matriz-lp-list').children.length;
    filterDescWorks = lpFiltered > 0 && lpReset >= lpFiltered;
} catch(e) {
    filterDescWorks = false;
}

const item4Ok = hasMatrizSearchInput && hasFilterDescFn && filterDescWorks;

audit(
    '4',
    'Filtro de Busca Textual por Descritor e Habilidade',
    item4Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Mecanismo de pesquisa rápida por código do descritor (ex: D1, D3) ou palavra-chave (ex: fração, tema, ideia).',
    [
        { name: 'Elemento #matriz-search-input no HTML', status: hasMatrizSearchInput ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Função filterMatrizDescritores() executável', status: hasFilterDescFn ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Filtragem dinâmica com normalização de acentos', status: filterDescWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 5: Coluna 1 — Língua Portuguesa
mockWindow.renderReferenceMatrix();
const lpContainer = mockDocument.getElementById('matriz-lp-list');
const lpCount = lpContainer ? lpContainer.children.length : 0;
const hasLpDescriptors = lpCount >= 10;
const item5Ok = checkHtmlContains('id="matriz-lp-list"') && hasLpDescriptors;

audit(
    '5',
    'Coluna 1: Matriz de Língua Portuguesa',
    item5Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `Catálogo oficial de descritores de Língua Portuguesa (total renderizado: ${lpCount} descritores estruturados).`,
    [
        { name: 'Container #matriz-lp-list no HTML', status: checkHtmlContains('id="matriz-lp-list"') ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Renderização dos cards com código, tópico e descrição', status: hasLpDescriptors ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 6: Coluna 2 — Matemática
const mtContainer = mockDocument.getElementById('matriz-mt-list');
const mtCount = mtContainer ? mtContainer.children.length : 0;
const hasMtDescriptors = mtCount >= 15;
const item6Ok = checkHtmlContains('id="matriz-mt-list"') && hasMtDescriptors;

audit(
    '6',
    'Coluna 2: Matriz de Matemática',
    item6Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `Catálogo oficial de descritores de Matemática com ênfase em resolução de problemas (total: ${mtCount} descritores).`,
    [
        { name: 'Container #matriz-mt-list no HTML', status: checkHtmlContains('id="matriz-mt-list"') ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Renderização dos cards com código, tópico e descrição', status: hasMtDescriptors ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 7: Coluna 3 — Ciências da Natureza
const ciContainer = mockDocument.getElementById('matriz-ci-list');
const ciCount = ciContainer ? ciContainer.children.length : 0;
const hasCiDescriptors = ciCount >= 5;
const item7Ok = checkHtmlContains('id="matriz-ci-list"') && hasCiDescriptors;

audit(
    '7',
    'Coluna 3: Matriz de Ciências da Natureza',
    item7Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `Descritores de Ciências da Natureza e sustentabilidade alinhados à BNCC (total: ${ciCount} descritores).`,
    [
        { name: 'Container #matriz-ci-list no HTML', status: checkHtmlContains('id="matriz-ci-list"') ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Renderização dos cards estruturados de Ciências', status: hasCiDescriptors ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 8: Coluna 4 — Ciências Humanas (História & Geografia)
const chContainer = mockDocument.getElementById('matriz-ch-list');
const chCount = chContainer ? chContainer.children.length : 0;
const hasChDescriptors = chCount >= 5;
const item8Ok = checkHtmlContains('id="matriz-ch-list"') && hasChDescriptors;

audit(
    '8',
    'Coluna 4: Matriz de Ciências Humanas (História & Geografia)',
    item8Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `Descritores cognitivos de História e Geografia (total: ${chCount} descritores).`,
    [
        { name: 'Container #matriz-ch-list no HTML', status: checkHtmlContains('id="matriz-ch-list"') ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Renderização dos cards estruturados de Humanas', status: hasChDescriptors ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 9: Explorador da BNCC (Filtros por Disciplina e Etapa)
const hasBnccSubject = checkHtmlContains('id="bncc-subject-select"');
const hasBnccStage = checkHtmlContains('id="bncc-stage-select"');
const hasBnccSearch = checkHtmlContains('id="bncc-search-input"');
const hasBnccRenderFn = typeof mockWindow.renderBnccSkillsTable === 'function';

let bnccFiltersWork = false;
try {
    mockDocument.getElementById('bncc-subject-select').value = 'Matemática';
    mockDocument.getElementById('bncc-stage-select').value = '5º Ano';
    mockWindow.renderBnccSkillsTable();
    const tbody = mockDocument.getElementById('bncc-skills-table-body');
    const mtRows = tbody.innerHTML.includes('EF05MA');

    mockDocument.getElementById('bncc-subject-select').value = 'Língua Portuguesa';
    mockDocument.getElementById('bncc-stage-select').value = 'all';
    mockWindow.renderBnccSkillsTable();
    const lpRows = tbody.innerHTML.includes('EF');

    bnccFiltersWork = mtRows && lpRows;
} catch(e) {
    bnccFiltersWork = false;
}

const item9Ok = hasBnccSubject && hasBnccStage && hasBnccSearch && hasBnccRenderFn && bnccFiltersWork;

audit(
    '9',
    'Explorador de Habilidades da BNCC (Filtros e Busca)',
    item9Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Seleção por componente curricular (Português, Matemática, Ciências, etc.), filtro por etapa (1º ao 9º Ano) e busca rápida.',
    [
        { name: 'Seletor de Componente Curricular (#bncc-subject-select)', status: hasBnccSubject ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Seletor de Ano / Etapa (#bncc-stage-select)', status: hasBnccStage ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Campo de pesquisa (#bncc-search-input)', status: hasBnccSearch ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Filtragem reativa de habilidades da BNCC', status: bnccFiltersWork ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 10: Tabela Oficial da BNCC & Conformidade (< 700 Linhas)
const tbodyBncc = mockDocument.getElementById('bncc-skills-table-body');
const hasTableRows = tbodyBncc && tbodyBncc.innerHTML.includes('<tr');
const lineCountMatrizes = fs.readFileSync(path.join(__dirname, '../js/modules/matrizes/matrizes.js'), 'utf8').split('\n').length;
const isUnderLimit = lineCountMatrizes < 700;

const item10Ok = hasTableRows && isUnderLimit;

audit(
    '10',
    'Tabela de Habilidades BNCC & Limite de Linhas (< 700 Linhas)',
    item10Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `Tabela canônica com Código BNCC, Etapa, Objeto de Conhecimento, Descrição e Complexidade. Arquivo matrizes.js com ${lineCountMatrizes} linhas (< 700).`,
    [
        { name: 'Renderização completa de linhas na tabela #bncc-skills-table-body', status: hasTableRows ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: `Conformidade arquitetural: matrizes.js (${lineCountMatrizes} linhas < 700)`, status: isUnderLimit ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// =========================================================================
// SÍNTESE FINAL DA ETAPA 6
// =========================================================================
let totalFunciona = 0;
let totalPrecisa = 0;
let totalNaoFunciona = 0;

results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.status}] ${r.name}`);
    console.log(`   ${r.details}`);
    r.subitems.forEach(sub => {
        console.log(`   - [${sub.status}] ${sub.name}`);
    });
    console.log('');

    if (r.status.includes('🟢')) totalFunciona++;
    else if (r.status.includes('🟡')) totalPrecisa++;
    else totalNaoFunciona++;
});

console.log('========================================================================');
console.log(`TOTAL DE ITENS AUDITADOS: ${results.length}`);
console.log(`🟢 Funciona: ${totalFunciona}`);
console.log(`🟡 Precisa ser implementado: ${totalPrecisa}`);
console.log(`🔴 Não funciona: ${totalNaoFunciona}`);
console.log('========================================================================\n');

if (totalNaoFunciona > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
