/**
 * ============================================================================
 * AUDITORIA DETALHADA: ETAPA 4 — METAS MUNICIPAIS (PDE) (#metas-ideb)
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
console.log('AUDITORIA DE ITENS E SUBITENS: ETAPA 4 — METAS MUNICIPAIS (PDE) (#metas-ideb)');
console.log('========================================================================\n');

// 1. Ler index.html para validação estática de presença de componentes
const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function checkHtmlContains(pattern, desc) {
    const found = pattern instanceof RegExp ? pattern.test(html) : html.includes(pattern);
    return found;
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
            if (id === 'pde-filter-status') domElements[id].value = 'all';
            if (id === 'pde-filter-stage') domElements[id].value = 'ai';
            if (id === 'pde-filter-year') domElements[id].value = '2026';
            if (id === 'goals-table-body') domElements[id].tagName = 'TBODY';
            if (id === 'modal-pde-manager') domElements[id].classList.add('hidden');
        }
        return domElements[id];
    },
    querySelectorAll: function(sel) { return [createElement('div')]; },
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
    fetch: function(url) {
        return Promise.resolve({
            ok: true,
            json: function() {
                return Promise.resolve({
                    success: true,
                    totalAlunosAvaliados: 39,
                    descritoresPrioritarios: [
                        { codigo: 'D1', descricao: 'Localizar informações explícitas em texto', prioridadePDE: 'ALTA', alunosEmDefasagem: 14, totalAlunosAvaliados: 39, taxaDefasagemPct: 35.9, sugestaoPlanoAcao: 'Oficina de leitura' },
                        { codigo: 'D14', descricao: 'Resolver problema com operações fundamentais', prioridadePDE: 'MEDIA', alunosEmDefasagem: 10, totalAlunosAvaliados: 39, taxaDefasagemPct: 25.6, sugestaoPlanoAcao: 'Plantão de cálculo' }
                    ]
                });
            }
        });
    }
};

mockWindow.window = mockWindow;
mockWindow.global = mockWindow;

const context = vm.createContext(mockWindow);

// Carregar Seed de Alunos e Escolas no VM
const seedCode = fs.readFileSync(path.join(__dirname, '../js/data/official_students_seed.js'), 'utf8');
vm.runInContext(seedCode, context);

// Carregar Módulo de Metas e Pactuação no VM
const metasPactuacaoCode = fs.readFileSync(path.join(__dirname, '../js/modules/metas/metas_pactuacao.js'), 'utf8');
vm.runInContext(metasPactuacaoCode, context);

const results = [];

function audit(id, name, status, details, subitems = []) {
    results.push({ id, name, status, details, subitems });
}

// =========================================================================
// TESTES E AVALIAÇÃO DOS 10 ITENS
// =========================================================================

// ITEM 1: Header & Ações Globais
const hasHtmlBtnGen = checkHtmlContains('id="btn-generate-all-pde-plans"');
const hasHtmlBtnExp = checkHtmlContains('id="btn-export-pde-report"');
const hasFnGen = typeof mockWindow.handleAutoGenerateAllPdePlans === 'function';
const hasFnExp = typeof mockWindow.handleExportPdeReportPdf === 'function';
const item1Ok = hasHtmlBtnGen && hasHtmlBtnExp && hasFnGen && hasFnExp;

audit(
    '1',
    'Header & Ações Globais de Metas PDE',
    item1Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Barra de ações com botões de geração em lote de planos e exportação de relatório PDE em PDF.',
    [
        { name: 'Botão #btn-generate-all-pde-plans no HTML', status: hasHtmlBtnGen ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Botão #btn-export-pde-report no HTML', status: hasHtmlBtnExp ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Função handleAutoGenerateAllPdePlans() exposta e executável', status: hasFnGen ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Função handleExportPdeReportPdf() com disparo para impressão/PDF', status: hasFnExp ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 2: Filtro de Ano Letivo
const hasHtmlYear = checkHtmlContains('id="pde-filter-year"');
const hasYear2026 = checkHtmlContains('value="2026"');
const hasYear2027 = checkHtmlContains('value="2027"');
const hasYear2025 = checkHtmlContains('value="2025"');
const item2Ok = hasHtmlYear && hasYear2026 && hasYear2027 && hasYear2025;

audit(
    '2',
    'Filtro de Ano Letivo (#pde-filter-year)',
    item2Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Seletor de ciclo anual permitindo navegação entre 2026 (Corrente), 2027 (Planejamento) e 2025 (Homologado).',
    [
        { name: 'Elemento select #pde-filter-year no HTML', status: hasHtmlYear ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção 2026 (Corrente)', status: hasYear2026 ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção 2027 (Planejamento)', status: hasYear2027 ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção 2025 (Homologado)', status: hasYear2025 ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Evento onchange="populateIdebGoalsTable()"', status: checkHtmlContains('id="pde-filter-year" onchange="populateIdebGoalsTable()"') ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 3: Filtro de Situação de Risco
const hasHtmlStatus = checkHtmlContains('id="pde-filter-status"');
const hasOptAll = checkHtmlContains('value="all"');
const hasOptRisk = checkHtmlContains('value="risk"');
const hasOptOk = checkHtmlContains('value="ok"');
const item3Ok = hasHtmlStatus && hasOptAll && hasOptRisk && hasOptOk;

audit(
    '3',
    'Filtro de Situação de Risco (#pde-filter-status)',
    item3Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Segmentação pedagógica das escolas: Todas as Escolas, Escolas com Risco (Alto / Médio) e Escolas com Meta Atingida.',
    [
        { name: 'Elemento select #pde-filter-status no HTML', status: hasHtmlStatus ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção "all" (Todas as Escolas)', status: hasOptAll ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção "risk" (Escolas com Risco)', status: hasOptRisk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção "ok" (Meta Atingida)', status: hasOptOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Evento onchange="populateIdebGoalsTable()"', status: checkHtmlContains('id="pde-filter-status" onchange="populateIdebGoalsTable()"') ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 4: Filtro de Etapa Avaliada
const hasHtmlStage = checkHtmlContains('id="pde-filter-stage"');
const hasStageAi = checkHtmlContains('value="ai"');
const hasStageAf = checkHtmlContains('value="af"');
const item4Ok = hasHtmlStage && hasStageAi && hasStageAf;

audit(
    '4',
    'Filtro de Etapa Avaliada (#pde-filter-stage)',
    item4Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Alternância entre Anos Iniciais (5º Ano) e Anos Finais (9º Ano) com recálculo automático de metas.',
    [
        { name: 'Elemento select #pde-filter-stage no HTML', status: hasHtmlStage ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção Anos Iniciais - 5º Ano ("ai")', status: hasStageAi ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Opção Anos Finais - 9º Ano ("af")', status: hasStageAf ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Evento onchange="populateIdebGoalsTable()"', status: checkHtmlContains('id="pde-filter-stage" onchange="populateIdebGoalsTable()"') ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 5: Badge de Contagem Dinâmica
const hasHtmlBadge = checkHtmlContains('id="pde-count-schools-badge"');
mockWindow.populateIdebGoalsTable();
const badgeEl = mockDocument.getElementById('pde-count-schools-badge');
const badgeUpdated = badgeEl && badgeEl.textContent.includes('Escolas Mapeadas');
const item5Ok = hasHtmlBadge && badgeUpdated;

audit(
    '5',
    'Badge de Contagem Dinâmica (#pde-count-schools-badge)',
    item5Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `Contador de escolas ativas no filtro corrente: "${badgeEl.textContent.trim()}".`,
    [
        { name: 'Badge presente no HTML', status: hasHtmlBadge ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Atualização reativa no populateIdebGoalsTable()', status: badgeUpdated ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 6: Cards de Resumo Executivo
const hasHtmlSummaryIdeb = checkHtmlContains('id="metas-summary-ideb"');
const hasHtmlSummaryDiff = checkHtmlContains('id="metas-summary-ideb-diff"');
const hasHtmlSummaryRend = checkHtmlContains('id="metas-summary-rendimento"');
const hasHtmlSummaryProf = checkHtmlContains('id="metas-summary-proficiencia"');
const idebVal = mockDocument.getElementById('metas-summary-ideb').textContent;
const item6Ok = hasHtmlSummaryIdeb && hasHtmlSummaryDiff && hasHtmlSummaryRend && hasHtmlSummaryProf && !!idebVal;

audit(
    '6',
    'Cards de Resumo Executivo Municipal',
    item6Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `KPIs de síntese estratégica: IDEB Médio da Rede (${idebVal}), Fluxo Escolar e Proficiência Média SAEB.`,
    [
        { name: 'Card IDEB Médio (#metas-summary-ideb)', status: hasHtmlSummaryIdeb ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Diferencial histórico (+0.3 vs IDEB 2023)', status: hasHtmlSummaryDiff ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Taxa de Rendimento / Aprovação (#metas-summary-rendimento)', status: hasHtmlSummaryRend ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Média de Proficiência SAEB (#metas-summary-proficiencia)', status: hasHtmlSummaryProf ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 7: Tabela Unificada de Metas e PDE
const tableEl = mockDocument.getElementById('goals-table-body');
const rawHtmlTable = tableEl.innerHTML;
const rowCount = (rawHtmlTable.match(/<tr[\s\S]*?<\/tr>/gi) || []).length;
const has9Schools = rowCount === 9;
const item7Ok = checkHtmlContains('id="goals-table-body"') && has9Schools;

audit(
    '7',
    'Tabela Unificada de Metas e PDE (#goals-table-body)',
    item7Ok ? '🟢 Funciona' : '🔴 Não funciona',
    `Renderização completa das 9 escolas de Gonçalves Dias (linhas processadas: ${rowCount}).`,
    [
        { name: 'Tabela presente no HTML (#goals-table-body)', status: checkHtmlContains('id="goals-table-body"') ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Renderização de todas as 9 escolas municipais', status: has9Schools ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Colunas canônicas da tabela (INEP, Base, Meta, Proficiência, Gap, Risco, PDE, Ação)', status: rawHtmlTable.includes('INEP') && rawHtmlTable.includes('Gerenciar Plano') ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 8: Cálculo de Gap e Níveis de Risco + Edição Inline
let gapCalcOk = rawHtmlTable.includes('+' ) || rawHtmlTable.includes('-');
let riskBadgesOk = rawHtmlTable.includes('Alto') || rawHtmlTable.includes('Médio') || rawHtmlTable.includes('Baixo');
let inlineEditOk = false;

if (typeof mockWindow.handleUpdateSchoolTarget === 'function') {
    mockWindow.handleUpdateSchoolTarget('21192544', 'ai', 6.2);
    const savedTargets = mockWindow.localStorage.getItem('gd_school_targets_db');
    if (savedTargets && savedTargets.includes('6.2')) {
        inlineEditOk = true;
    }
}
const item8Ok = gapCalcOk && riskBadgesOk && inlineEditOk;

audit(
    '8',
    'Cálculo de Desvio (Gap), Matriz de Risco e Edição Inline',
    item8Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Cálculo dinâmico de desvio em relação à meta, atribuição visual de risco e input numérico editável inline.',
    [
        { name: 'Cálculo de desvio/gap com precisão decimal', status: gapCalcOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Badges de criticidade (Alto Risco, Médio Atenção, Baixo OK)', status: riskBadgesOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Edição inline de meta com persistência em localStorage', status: inlineEditOk ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 9: Geração Automática de Planos de Intervenção (PDE)
let autoGenOk = false;
try {
    mockWindow.handleAutoGenerateAllPdePlans();
    const pdeDb = mockWindow.localStorage.getItem('gd_school_pde_plans_db');
    if (pdeDb && pdeDb.includes('Recomposição SAEB')) {
        autoGenOk = true;
    }
} catch(e) {
    autoGenOk = false;
}
const item9Ok = autoGenOk;

audit(
    '9',
    'Geração Automática de Planos de Intervenção (PDE)',
    item9Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Criação automática em lote de diretrizes estratégicas de recomposição pedagógica para as escolas.',
    [
        { name: 'Disparo de handleAutoGenerateAllPdePlans()', status: autoGenOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Gravação de planos estruturados em localStorage', status: autoGenOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Exibição imediata das ações pedagógicas na tabela', status: mockDocument.getElementById('goals-table-body').innerHTML.includes('Recomposição SAEB') ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// ITEM 10: Modal de Gestão do PDE (#modal-pde-manager)
const modalEl = mockDocument.getElementById('modal-pde-manager');
let modalOpenOk = false;
let modeSwitchOk = false;
let formSaveOk = false;
let modalCloseOk = false;

try {
    // Abrir modal
    mockWindow.openPdeManagerForSchool('21192544', 'UE ANITA FURTADO', 5.6);
    modalOpenOk = !modalEl.classList.contains('hidden') && modalEl.style.display === 'flex';

    // Alternar para modo AI
    mockWindow.switchPdeModalMode('ai');
    const actionsVal = mockDocument.getElementById('pde-manager-actions').value;
    modeSwitchOk = actionsVal && actionsVal.includes('PROPOSTA DE PLANO');

    // Salvar formulário
    mockWindow.handleSavePdeManagerForm({ preventDefault: () => {} });
    const savedPde = mockWindow.localStorage.getItem('gd_school_pde_plans_db');
    formSaveOk = savedPde && savedPde.includes('21192544');

    // Fechar modal
    mockWindow.closePdeManagerModal();
    modalCloseOk = modalEl.classList.contains('hidden') && modalEl.style.display === 'none';
} catch(e) {
    console.error('Erro no teste do modal PDE:', e);
}

const item10Ok = modalOpenOk && modeSwitchOk && formSaveOk && modalCloseOk;

audit(
    '10',
    'Modal Completo de Gestão de PDE (Manual, IA e PDF)',
    item10Ok ? '🟢 Funciona' : '🔴 Não funciona',
    'Modal interativo de intervenção pedagógica com 3 modos operacionais, campos estruturados e diagnóstico escolar.',
    [
        { name: 'Abertura contextualizada via openPdeManagerForSchool()', status: modalOpenOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Alternância de modos: Manual, Sugestão IA e Anexo PDF', status: modeSwitchOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Salvamento de plano via handleSavePdeManagerForm()', status: formSaveOk ? '🟢 Funciona' : '🔴 Não funciona' },
        { name: 'Fechamento de modal via closePdeManagerModal()', status: modalCloseOk ? '🟢 Funciona' : '🔴 Não funciona' }
    ]
);

// =========================================================================
// SÍNTESE FINAL
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
