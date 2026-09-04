/**
 * ============================================================================
 * AUDITORIA DETALHADA: ETAPA 5 — COMPARATIVO REGIONAL (INEP) (#ideb-comparativo)
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
console.log('AUDITORIA DE ITENS E SUBITENS: ETAPA 5 — COMPARATIVO REGIONAL (#ideb-comparativo)');
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
            if (sel.includes('.ideb-regional-tab-btn')) {
                return [
                    mockDocument.getElementById('btn-tab-principal'),
                    mockDocument.getElementById('btn-tab-ures'),
                    mockDocument.getElementById('btn-tab-ranking-geral'),
                    mockDocument.getElementById('btn-tab-ranking-escolas')
                ];
            }
            if (sel.includes('.ideb-regional-tab-content')) {
                return [
                    mockDocument.getElementById('tab-ideb-painel-principal'),
                    mockDocument.getElementById('tab-ideb-painel-ures'),
                    mockDocument.getElementById('tab-ideb-ranking-geral-ma'),
                    mockDocument.getElementById('tab-ideb-ranking-escolas-ma')
                ];
            }
            if (sel.includes('.ideb-year-pill-btn')) {
                return [2015, 2017, 2019, 2021, 2023, 2025].map(y => {
                    const b = createElement('button');
                    b.setAttribute('data-year', String(y));
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
            if (id === 'ideb-city-selector') domElements[id].value = 'Gonçalves Dias';
            if (id === 'ranking-escolas-city-select') domElements[id].value = 'Gonçalves Dias';
            if (id === 'ranking-escolas-rede-select') domElements[id].value = 'all';
            if (id === 'ranking-ma-ure-filter') domElements[id].value = 'all';
            if (id === 'ure-search-input' || id === 'ranking-ma-search-input' || id === 'ranking-escolas-search-input') {
                domElements[id].value = '';
            }
            if (id === 'modal-school-ideb-detail') domElements[id].classList.add('hidden');
        }
        return domElements[id];
    },
    querySelectorAll: function(sel) {
        if (sel.includes('.ideb-regional-tab-btn')) {
            const tabs = ['painel-principal', 'painel-ures', 'ranking-geral-ma', 'ranking-escolas-ma'];
            return tabs.map(t => {
                const b = createElement('button');
                b.setAttribute('data-tab', t);
                return b;
            });
        }
        if (sel.includes('.ideb-regional-tab-content')) {
            return [
                mockDocument.getElementById('tab-ideb-painel-principal'),
                mockDocument.getElementById('tab-ideb-painel-ures'),
                mockDocument.getElementById('tab-ideb-ranking-geral-ma'),
                mockDocument.getElementById('tab-ideb-ranking-escolas-ma')
            ];
        }
        if (sel.includes('.ideb-year-pill-btn')) {
            return [2015, 2017, 2019, 2021, 2023, 2025].map(y => {
                const b = createElement('button');
                b.setAttribute('data-year', String(y));
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
    alert: function() {},
    print: function() { mockWindow.__printed = true; },
    closeModal: function(id) {
        const m = mockDocument.getElementById(id);
        if (m) {
            m.classList.add('hidden');
            m.style.display = 'none';
        }
    }
};

mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

const context = vm.createContext(mockWindow);

// Carregar Dados Oficiais INEP (Municípios e Escolas do Maranhão)
const idebMunCode = fs.readFileSync(path.join(__dirname, '../ideb_maranhao_oficial_2015_2025.js'), 'utf8');
vm.runInContext(idebMunCode, context);

const idebEscolasCode = fs.readFileSync(path.join(__dirname, '../escolas_maranhao_oficial_2015_2025.js'), 'utf8');
vm.runInContext(idebEscolasCode, context);

// Carregar Módulos de Metas e Comparativo Regional
const metasRegionalCode = fs.readFileSync(path.join(__dirname, '../js/modules/metas/metas_regional.js'), 'utf8');
vm.runInContext(metasRegionalCode, context);

const metasEscolasCode = fs.readFileSync(path.join(__dirname, '../js/modules/metas/metas_escolas_ranking.js'), 'utf8');
vm.runInContext(metasEscolasCode, context);

const metasIdebCode = fs.readFileSync(path.join(__dirname, '../js/modules/metas/metas_ideb.js'), 'utf8');
vm.runInContext(metasIdebCode, context);

const results = [];

function audit(id, name, status, details, subitems = []) {
    results.push({ id, name, status, details, subitems });
}

// =========================================================================
// TESTES E AVALIAÇÃO DOS 10 ITENS DA ETAPA 5
// =========================================================================

// ITEM 1: Header Oficial & Exportação Regional
const hasPeriodBadge = checkHtmlContains('id="ideb-period-badge"');
const hasBadgeText = checkHtmlContains('Dados Oficiais INEP • Ciclos 2015 a 2025');
const hasBtnExportPdf = checkHtmlContains('id="btn-export-ideb-regional-pdf"');
const item1Ok = hasPeriodBadge && hasBadgeText && hasBtnExportPdf;

audit(
    '1',
    'Header Oficial & Exportação Regional',
    item1Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Banner executivo oficial de Gonçalves Dias com chancela INEP (2015-2025) e botão de exportação para PDF.',
    [
        { name: 'Badge oficial de ciclo (#ideb-period-badge)', status: hasPeriodBadge ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Texto explicativo com ciclo 2015 a 2025', status: hasBadgeText ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Botão de exportação regional PDF (#btn-export-ideb-regional-pdf)', status: hasBtnExportPdf ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 2: Subtabs de Navegação Regional (4 abas)
const hasTabBtnPrincipal = checkHtmlContains('data-tab="painel-principal"');
const hasTabBtnUres = checkHtmlContains('data-tab="painel-ures"');
const hasTabBtnRankingMun = checkHtmlContains('data-tab="ranking-geral-ma"');
const hasTabBtnRankingEsc = checkHtmlContains('data-tab="ranking-escolas-ma"');
const hasSubtabFn = typeof mockWindow.switchIdebSubtab === 'function';

let subtabSwitchWorks = false;
try {
    mockWindow.switchIdebSubtab('painel-ures');
    const uresTabEl = mockDocument.getElementById('tab-ideb-painel-ures');
    subtabSwitchWorks = !uresTabEl.classList.contains('hidden') && uresTabEl.style.display === 'block';
    // Retornar para principal
    mockWindow.switchIdebSubtab('painel-principal');
} catch(e) {
    subtabSwitchWorks = false;
}

const item2Ok = hasTabBtnPrincipal && hasTabBtnUres && hasTabBtnRankingMun && hasTabBtnRankingEsc && hasSubtabFn && subtabSwitchWorks;

audit(
    '2',
    'Subtabs de Navegação Regional (4 Painéis Estratégicos)',
    item2Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Controle de navegação suave entre as 4 subtabs: Painel Geral, 19 UREs, Ranking 217 Municípios e Ranking de Escolas.',
    [
        { name: 'Aba 1: Painel Geral do Município', status: hasTabBtnPrincipal ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Aba 2: Painel das 19 UREs do Maranhão', status: hasTabBtnUres ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Aba 3: Ranking Geral dos 217 Municípios', status: hasTabBtnRankingMun ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Aba 4: Ranking por Escolas do Maranhão', status: hasTabBtnRankingEsc ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Execução de switchIdebSubtab() e alternância de visibilidade', status: subtabSwitchWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 3: Controle Global de Ciclo Temporal (Pills 2015 a 2025)
const hasPill2015 = checkHtmlContains('data-year="2015"');
const hasPill2023 = checkHtmlContains('data-year="2023"');
const hasPill2025 = checkHtmlContains('data-year="2025"');
const hasYearFn = typeof mockWindow.switchGlobalIdebYear === 'function';

let yearSwitchWorks = false;
try {
    mockWindow.switchGlobalIdebYear(2023);
    const thCurr = mockDocument.getElementById('th-ranking-curr');
    const thPrev = mockDocument.getElementById('th-ranking-prev');
    yearSwitchWorks = (mockWindow.currentGlobalIdebYear === 2023) &&
                      thCurr && thCurr.textContent.includes('2023') &&
                      thPrev && thPrev.textContent.includes('2021');
    // Restaurar para 2025
    mockWindow.switchGlobalIdebYear(2025);
} catch(e) {
    yearSwitchWorks = false;
}

const item3Ok = hasPill2015 && hasPill2023 && hasPill2025 && hasYearFn && yearSwitchWorks;

audit(
    '3',
    'Controle Global de Ciclo Temporal (Pills 2015 a 2025)',
    item3Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Seletor temporal multi-ciclo atualizando o ano ativo em todas as subtabs e recalculando cabeçalhos de tabela.',
    [
        { name: 'Pills de ciclo presentes no HTML (2015 a 2025)', status: hasPill2015 && hasPill2025 ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Função switchGlobalIdebYear() executável', status: hasYearFn ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Sincronização de ciclo anterior e ciclo ativo', status: yearSwitchWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 4: Controle Global de Etapa Avaliada (AI / AF)
const hasBtnStageAi = checkHtmlContains('id="btn-painel-city-stage-ai"');
const hasBtnStageAf = checkHtmlContains('id="btn-painel-city-stage-af"');
const hasStageFn = typeof mockWindow.switchGlobalIdebStage === 'function';

let stageSwitchWorks = false;
try {
    mockWindow.switchGlobalIdebStage('Anos Finais');
    const isAf = mockWindow.currentGlobalIdebStage === 'Anos Finais';
    mockWindow.switchGlobalIdebStage('Anos Iniciais');
    const isAi = mockWindow.currentGlobalIdebStage === 'Anos Iniciais';
    stageSwitchWorks = isAf && isAi;
} catch(e) {
    stageSwitchWorks = false;
}

const item4Ok = hasBtnStageAi && hasBtnStageAf && hasStageFn && stageSwitchWorks;

audit(
    '4',
    'Controle Global de Etapa Avaliada (Anos Iniciais / Finais)',
    item4Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Alternância de etapa de ensino sincronizada entre todas as subtabs com atualização imediata de dados.',
    [
        { name: 'Botões 5º Ano (Iniciais) e 9º Ano (Finais)', status: hasBtnStageAi && hasBtnStageAf ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Função switchGlobalIdebStage() executável', status: hasStageFn ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Sincronização global de estado de etapa', status: stageSwitchWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 5: Subtab 1 — Painel Geral do Município
let citySelectorPopulated = false;
let cityDataLoaded = false;
let timelineGridFilled = false;
let compBarsFilled = false;

try {
    mockWindow.initIdebCitySelector();
    const selCity = mockDocument.getElementById('ideb-city-selector');
    citySelectorPopulated = selCity && selCity.innerHTML.includes('Gonçalves Dias');

    mockWindow.handleSelectIdebCity('Gonçalves Dias');
    const currEl = mockDocument.getElementById('city-ideb-current');
    const prevEl = mockDocument.getElementById('city-ideb-prev');
    const targetEl = mockDocument.getElementById('city-ideb-target');
    const rankEl = mockDocument.getElementById('city-ranking-pos');
    cityDataLoaded = currEl && currEl.textContent !== '—' && prevEl && targetEl && rankEl;

    const timelineEl = mockDocument.getElementById('city-timeline-cycles-grid');
    timelineGridFilled = timelineEl && timelineEl.innerHTML.includes('Ciclo 2025');

    const compEl = mockDocument.getElementById('city-comparison-bars');
    compBarsFilled = compEl && compEl.innerHTML.includes('Média Estadual');
} catch(e) {
    console.error('Erro na Subtab 1:', e);
}

const item5Ok = citySelectorPopulated && cityDataLoaded && timelineGridFilled && compBarsFilled;

audit(
    '5',
    'Subtab 1: Painel Geral do Município',
    item5Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Painel analítico do município com seletor de 217 cidades, KPIs de IDEB, evolução histórica de 6 ciclos e barras comparativas.',
    [
        { name: 'Seletor de municípios populado dinamicamente (#ideb-city-selector)', status: citySelectorPopulated ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Cards de IDEB Observado, Ciclo Anterior, Meta e Posição Estadual', status: cityDataLoaded ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Série histórica dos 6 ciclos INEP (#city-timeline-cycles-grid)', status: timelineGridFilled ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Barras comparativas Município x URE x Estado x País', status: compBarsFilled ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 6: Subtab 2 — Painel das 19 UREs do Maranhão
let uresListOk = false;
let uresCardsRendered = false;
let uresKpisUpdated = false;
let uresSearchWorks = false;

try {
    const list = mockWindow.getOfficial19UresList();
    uresListOk = Array.isArray(list) && list.length === 19;

    mockWindow.render19UresPanel();
    const uresContainer = mockDocument.getElementById('ures-cards-container');
    uresCardsRendered = uresContainer && uresContainer.innerHTML.includes('URE');

    const kpiAvg = mockDocument.getElementById('ures-kpi-state-avg');
    const kpiTop = mockDocument.getElementById('ures-kpi-top-ure');
    uresKpisUpdated = kpiAvg && kpiAvg.textContent !== '' && kpiTop && kpiTop.textContent !== '';

    // Teste de busca na URE
    mockDocument.getElementById('ure-search-input').value = 'Presidente Dutra';
    mockWindow.render19UresPanel();
    uresSearchWorks = uresContainer.innerHTML.includes('Presidente Dutra');
    // Reset busca
    mockDocument.getElementById('ure-search-input').value = '';
    mockWindow.render19UresPanel();
} catch(e) {
    console.error('Erro na Subtab 2:', e);
}

const item6Ok = uresListOk && uresCardsRendered && uresKpisUpdated && uresSearchWorks;

audit(
    '6',
    'Subtab 2: Painel das 19 UREs do Maranhão',
    item6Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Agrupamento oficial das 19 Regionais de Educação, distribuição dos 217 municípios, KPIs de liderança e busca instantânea.',
    [
        { name: 'Mapeamento de todas as 19 UREs oficiais do Maranhão', status: uresListOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Renderização dos cards com chips de cidades (#ures-cards-container)', status: uresCardsRendered ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'KPIs de Média Estadual e URE Líder atualizados', status: uresKpisUpdated ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Filtro de busca rápida (#ure-search-input)', status: uresSearchWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 7: Subtab 3 — Ranking Geral dos 217 Municípios
let rankingUreFilterPopulated = false;
let rankingMunRendered = false;
let rankingSearchWorks = false;

try {
    mockWindow.populateRankingMaUreFilter();
    const ureFilter = mockDocument.getElementById('ranking-ma-ure-filter');
    rankingUreFilterPopulated = ureFilter && ureFilter.innerHTML.includes('URE');

    mockWindow.renderRankingGeralMaTable();
    const tbodyMun = mockDocument.getElementById('ranking-geral-ma-table-body');
    const rowCount = (tbodyMun.innerHTML.match(/<tr[\s\S]*?<\/tr>/gi) || []).length;
    rankingMunRendered = rowCount >= 200;

    // Teste de busca
    mockDocument.getElementById('ranking-ma-search-input').value = 'Gonçalves Dias';
    mockWindow.renderRankingGeralMaTable();
    rankingSearchWorks = tbodyMun.innerHTML.includes('Gonçalves Dias');
    // Reset busca
    mockDocument.getElementById('ranking-ma-search-input').value = '';
    mockWindow.renderRankingGeralMaTable();
} catch(e) {
    console.error('Erro na Subtab 3:', e);
}

const item7Ok = rankingUreFilterPopulated && rankingMunRendered && rankingSearchWorks;

audit(
    '7',
    'Subtab 3: Ranking Geral dos 217 Municípios',
    item7Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Tabela oficial de classificação com cálculo de evolução, filtro por URE, pesquisa em tempo real e série temporal.',
    [
        { name: 'Dropdown de filtragem por URE populado (#ranking-ma-ure-filter)', status: rankingUreFilterPopulated ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Tabela renderizando os 217 municípios maranhenses', status: rankingMunRendered ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Busca textual em tempo real (#ranking-ma-search-input)', status: rankingSearchWorks ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 8: Subtab 4 — Ranking Geral de Escolas do Maranhão
let schoolCityFilterPopulated = false;
let schoolTableRendered = false;
let schoolSummaryRendered = false;

try {
    mockWindow.populateSchoolCitySelectDropdown();
    const citySelect = mockDocument.getElementById('ranking-escolas-city-select');
    schoolCityFilterPopulated = citySelect && citySelect.innerHTML.includes('Gonçalves Dias');

    mockWindow.filterSchoolRankingTable();
    const tbodyEscolas = mockDocument.getElementById('ranking-escolas-table-body');
    schoolTableRendered = tbodyEscolas && tbodyEscolas.innerHTML.includes('UNIDADE');

    const summaryEscolas = mockDocument.getElementById('school-ranking-city-summary');
    schoolSummaryRendered = summaryEscolas && summaryEscolas.innerHTML.includes('Total de Escolas');
} catch(e) {
    console.error('Erro na Subtab 4:', e);
}

const item8Ok = schoolCityFilterPopulated && schoolTableRendered && schoolSummaryRendered;

audit(
    '8',
    'Subtab 4: Ranking por Escolas do Maranhão',
    item8Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Classificação oficial das unidades escolares por município e rede, mini-síntese municipal e cálculo comparativo de posições.',
    [
        { name: 'Dropdown seletor de municípios de escolas (#ranking-escolas-city-select)', status: schoolCityFilterPopulated ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Tabela de classificação das escolas (#ranking-escolas-table-body)', status: schoolTableRendered ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Mini-resumo analítico da cidade (#school-ranking-city-summary)', status: schoolSummaryRendered ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 9: Modal de Detalhes da Escola (#modal-school-ideb-detail)
let modalDetailOpens = false;
let modalDetailGridFilled = false;
let modalDetailExportWorks = false;
let modalDetailCloses = false;

try {
    const rawSchools = mockWindow.ESCOLAS_MARANHAO_OFICIAL || [];
    const sampleId = (rawSchools.length > 0) ? (rawSchools[0].inep || rawSchools[0].id || '21128723') : '21128723';

    mockWindow.openSchoolIdebDetailModalById(sampleId);
    const modalEl = mockDocument.getElementById('modal-school-ideb-detail');
    modalDetailOpens = !modalEl.classList.contains('hidden') && modalEl.style.display === 'flex';

    const historyGrid = mockDocument.getElementById('school-detail-history-grid');
    modalDetailGridFilled = historyGrid && historyGrid.innerHTML.includes('2025');

    mockWindow.handleExportSchoolReport();
    modalDetailExportWorks = mockWindow.__printed === true;

    mockWindow.closeModal('modal-school-ideb-detail');
    modalDetailCloses = modalEl.classList.contains('hidden') && modalEl.style.display === 'none';
} catch(e) {
    console.error('Erro no Modal de Detalhes:', e);
}

const item9Ok = modalDetailOpens && modalDetailGridFilled && modalDetailExportWorks && modalDetailCloses;

audit(
    '9',
    'Modal Analítico de Detalhes da Escola (#modal-school-ideb-detail)',
    item9Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Drilldown completo com série histórica da escola de 2015 a 2025, barras comparativas e comando de exportação PDF.',
    [
        { name: 'Abertura de detalhes via openSchoolIdebDetailModalById()', status: modalDetailOpens ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Grid de série histórica (2015 a 2025) renderizado', status: modalDetailGridFilled ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Exportação de relatório em PDF via handleExportSchoolReport()', status: modalDetailExportWorks ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Fechamento de modal acessível', status: modalDetailCloses ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 10: Conformidade Arquitetural (< 700 Linhas)
const filesToVerify = [
    { file: 'js/modules/metas/metas_ideb.js', max: 700 },
    { file: 'js/modules/metas/metas_regional.js', max: 700 },
    { file: 'js/modules/metas/metas_escolas_ranking.js', max: 700 },
    { file: 'js/modules/metas/metas_pactuacao.js', max: 700 }
];

let allUnderLimit = true;
const fileSubitems = [];

filesToVerify.forEach(f => {
    const filePath = path.join(__dirname, '..', f.file);
    const lineCount = fs.readFileSync(filePath, 'utf8').split('\n').length;
    const ok = lineCount < f.max;
    if (!ok) allUnderLimit = false;
    fileSubitems.push({
        name: `${path.basename(f.file)} (${lineCount} linhas < ${f.max})`,
        status: ok ? '🟢 Funciona' : '🔴 Não funciona'
    });
});

audit(
    '10',
    'Conformidade Modular e Limite de Linhas (< 700 Linhas)',
    allUnderLimit ? '🟢 Funciona' : '🔴 Não funciona',
    'Todos os 4 módulos do subsistema de Metas e Comparativo mantêm alta coesão e cumprem a restrição estrita de linhas.',
    fileSubitems
);

// =========================================================================
// SÍNTESE FINAL DA ETAPA 5
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
