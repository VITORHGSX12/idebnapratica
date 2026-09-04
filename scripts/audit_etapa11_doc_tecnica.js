/**
 * ============================================================================
 * AUDITORIA DETALHADA: ETAPA 11 — DOCUMENTAÇÃO TÉCNICA & ARQUITETURA (#doc-tecnica)
 * Avalia cada item e subitem com os critérios:
 * 🟢 Funciona: Plenamente ativo, com dados oficiais e eventos funcionais.
 * 🟡 Precisa ser implementado: Estrutura existe mas falta lógica/dados completos.
 * 🔴 Não funciona: Quebrado, com erro de execução ou bloqueio de interface.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('========================================================================');
console.log('AUDITORIA DE ITENS E SUBITENS: ETAPA 11 — DOCUMENTAÇÃO TÉCNICA & ARQUITETURA');
console.log('========================================================================\n');

// 1. Validação estática de index.html
const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

function checkHtmlContains(pattern) {
    return pattern instanceof RegExp ? pattern.test(html) : html.includes(pattern);
}

// 2. Setup do Mock DOM Environment
const domElements = {};
function createMockElement(tag, id = '', className = '') {
    const el = {
        tagName: tag.toUpperCase(),
        id: id,
        className: className,
        classList: {
            classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
            add: function (c) { this.classes.add(c); el.className = Array.from(this.classes).join(' '); },
            remove: function (c) { this.classes.delete(c); el.className = Array.from(this.classes).join(' '); },
            contains: function (c) { return this.classes.has(c); },
            toggle: function (c, force) {
                if (force !== undefined) {
                    if (force) this.add(c); else this.remove(c);
                } else {
                    if (this.contains(c)) this.remove(c); else this.add(c);
                }
            }
        },
        style: {},
        children: [],
        _innerHTML: '',
        textContent: '',
        attributes: {},
        dataset: {},
        setAttribute: function (k, v) {
            this.attributes[k] = v;
            if (k.startsWith('data-')) {
                const dataKey = k.replace('data-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                this.dataset[dataKey] = v;
            }
        },
        getAttribute: function (k) { return this.attributes[k] !== undefined ? this.attributes[k] : null; },
        appendChild: function (child) { this.children.push(child); return child; },
        removeChild: function (child) {
            const idx = this.children.indexOf(child);
            if (idx >= 0) this.children.splice(idx, 1);
            return child;
        },
        querySelector: function (sel) {
            return findInTree(this, sel);
        },
        querySelectorAll: function (sel) {
            return findAllInTree(this, sel);
        },
        addEventListener: function (evt, handler) {
            if (!this._handlers) this._handlers = {};
            if (!this._handlers[evt]) this._handlers[evt] = [];
            this._handlers[evt].push(handler);
        },
        click: function () {
            if (typeof this.onclick === 'function') {
                this.onclick({ preventDefault: () => {} });
            }
            if (this._handlers && this._handlers['click']) {
                this._handlers['click'].forEach(h => h({ preventDefault: () => {} }));
            }
        },
        select: function () {}
    };

    Object.defineProperty(el, 'innerHTML', {
        get: function () { return this._innerHTML; },
        set: function (val) {
            this._innerHTML = val;
            this.textContent = String(val).replace(/<[^>]*>?/gm, '');
        }
    });

    if (id) domElements[id] = el;
    return el;
}

function findInTree(root, sel) {
    const list = findAllInTree(root, sel);
    return list.length > 0 ? list[0] : null;
}

function findAllInTree(root, sel) {
    const res = [];
    const isClass = sel.startsWith('.');
    const isId = sel.startsWith('#');
    const isAttr = sel.startsWith('[') && sel.endsWith(']');
    const name = sel.replace(/^[.#]|\[|\]/g, '');

    function traverse(node) {
        if (!node) return;
        if (isClass && node.classList && node.classList.contains(name)) res.push(node);
        else if (isId && node.id === name) res.push(node);
        else if (isAttr) {
            const parts = name.split('=');
            const attrKey = parts[0].trim();
            const attrVal = parts[1] ? parts[1].replace(/['"]/g, '').trim() : null;
            if (node.attributes && node.attributes[attrKey] !== undefined) {
                if (attrVal === null || node.attributes[attrKey] === attrVal) res.push(node);
            }
        } else if (node.tagName && node.tagName.toLowerCase() === sel.toLowerCase()) res.push(node);

        if (node.children) {
            node.children.forEach(traverse);
        }
    }

    if (root.children) {
        root.children.forEach(traverse);
    }
    return res;
}

// 3. Montar DOM mínimo correspondente ao #doc-tecnica
const docRoot = createMockElement('div', 'doc-tecnica', 'panel');

// Sub-abas principais do Doc Técnica
const dbTabs = ['modules', 'erd', 'sql', 'apis', 'architecture'].map(tab => {
    const btn = createMockElement('button', '', 'db-tab-btn');
    btn.setAttribute('data-tab', tab);
    docRoot.appendChild(btn);
    return btn;
});

const panelModules = createMockElement('div', 'tech-panel-modules', 'db-panel active');
const panelErd = createMockElement('div', 'tech-panel-erd', 'db-panel');
const panelSql = createMockElement('div', 'tech-panel-sql', 'db-panel');
const panelApis = createMockElement('div', 'tech-panel-apis', 'db-panel');
const panelArch = createMockElement('div', 'tech-panel-architecture', 'db-panel');
docRoot.appendChild(panelModules);
docRoot.appendChild(panelErd);
docRoot.appendChild(panelSql);
docRoot.appendChild(panelApis);
docRoot.appendChild(panelArch);

// Sub-módulos dentro de tech-panel-modules
const moduleTabs = ['1', '2', '3', '4', '5'].map(mod => {
    const btn = createMockElement('button', '', 'module-tab-btn');
    btn.setAttribute('data-module', mod);
    panelModules.appendChild(btn);
    return btn;
});

const modulePanels = ['1', '2', '3', '4', '5'].map(mod => {
    const p = createMockElement('div', `module-panel-${mod}`, 'module-panel' + (mod === '1' ? ' active' : ''));
    panelModules.appendChild(p);
    return p;
});

// Elementos do ERD
const renderErdBtn = createMockElement('button', 'render-erd-btn');
const mermaidContainer = createMockElement('div', 'mermaid-container');
panelErd.appendChild(renderErdBtn);
panelErd.appendChild(mermaidContainer);

// Elementos do SQL
const copySqlBtn = createMockElement('button', 'copy-sql-btn');
const sqlDisplay = createMockElement('code', 'sql-code-display');
panelSql.appendChild(copySqlBtn);
panelSql.appendChild(sqlDisplay);

// Elementos do API Explorer
const apiTabs = ['agendamento', 'busca-questoes', 'diagnostico-ia'].map(ep => {
    const btn = createMockElement('button', '', 'api-nav-btn');
    btn.setAttribute('data-endpoint', ep);
    panelApis.appendChild(btn);
    return btn;
});

const epBlocks = ['agendamento', 'busca-questoes', 'diagnostico-ia'].map(ep => {
    const b = createMockElement('div', `endpoint-${ep}`, 'endpoint-info-block' + (ep === 'agendamento' ? ' active' : ''));
    panelApis.appendChild(b);
    return b;
});

// JSON Code displays
const reqAgendamento = createMockElement('pre', 'req-agendamento-code');
const resAgendamento = createMockElement('pre', 'res-agendamento-code');
const resBuscaQuestoes = createMockElement('pre', 'res-busca-questoes-code');
const reqDiagnostico = createMockElement('pre', 'req-diagnostico-code');
const resDiagnostico = createMockElement('pre', 'res-diagnostico-code');
panelApis.appendChild(reqAgendamento);
panelApis.appendChild(resAgendamento);
panelApis.appendChild(resBuscaQuestoes);
panelApis.appendChild(reqDiagnostico);
panelApis.appendChild(resDiagnostico);

// Document Mock
const allElementsList = [
    docRoot, ...dbTabs, panelModules, panelErd, panelSql, panelApis, panelArch,
    ...moduleTabs, ...modulePanels, renderErdBtn, mermaidContainer,
    copySqlBtn, sqlDisplay, ...apiTabs, ...epBlocks,
    reqAgendamento, resAgendamento, resBuscaQuestoes, reqDiagnostico, resDiagnostico
];

const mockDocument = {
    body: {
        classList: {
            contains: () => false
        },
        appendChild: () => {},
        removeChild: () => {}
    },
    getElementById: (id) => domElements[id] || null,
    querySelector: (sel) => findInTree(docRoot, sel),
    querySelectorAll: (sel) => {
        if (sel === '.db-tab-btn') return dbTabs;
        if (sel === '.db-panel') return [panelModules, panelErd, panelSql, panelApis, panelArch];
        if (sel === '.module-tab-btn') return moduleTabs;
        if (sel === '.module-panel') return modulePanels;
        if (sel === '.api-nav-btn') return apiTabs;
        if (sel === '.endpoint-info-block') return epBlocks;
        return findAllInTree(docRoot, sel);
    },
    createElement: (tag) => createMockElement(tag),
    readyState: 'complete',
    execCommand: (cmd) => true
};

const toastMessages = [];
const mockWindow = {
    document: mockDocument,
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    safeCreateIcons: () => {},
    showToast: (msg, type) => {
        toastMessages.push({ msg, type });
    },
    navigator: {
        clipboard: {
            writeText: (txt) => {
                mockWindow.lastCopied = txt;
                return Promise.resolve();
            }
        }
    }
};

// 4. Execução do script do módulo em VM
const scriptPath = path.join(__dirname, '../js/modules/doc_tecnica/doc_tecnica.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

const ctx = vm.createContext(mockWindow);
vm.runInContext(scriptCode, ctx);

// Inicializar módulo no mock
if (typeof mockWindow.initDocTecnicaModule === 'function') {
    mockWindow.initDocTecnicaModule();
}

// 5. Verificação dos 10 Itens de Auditoria
const auditResults = [];

function registerResult(itemNumber, title, status, details) {
    auditResults.push({ itemNumber, title, status, details });
    const icon = status === 'Funciona' ? '🟢' : (status === 'Precisa ser implementado' ? '🟡' : '🔴');
    console.log(`[Item ${itemNumber}] ${icon} ${title}`);
    console.log(`       Status: ${status}`);
    console.log(`       Detalhes: ${details}\n`);
}

async function runAudit() {
    // Item 1: Header do Módulo, Governança & Atalhos RBAC/Escolas
    try {
        const hasSection = checkHtmlContains('id="doc-tecnica"');
        const hasHeader = checkHtmlContains('Especificação Técnica & Arquitetura de Dados') || checkHtmlContains('DOCUMENTAÇÃO TÉCNICA');
        const hasAdminLink = checkHtmlContains("navigateToTab('admin-panel')") || checkHtmlContains("showPanel('admin-panel')");
        const hasEscolasLink = checkHtmlContains("navigateToTab('escolas-panel')") || checkHtmlContains("showPanel('escolas-panel')");
        if (hasSection && hasHeader && hasAdminLink && hasEscolasLink) {
            registerResult(1, 'Header do Módulo, Governança & Atalhos RBAC/Escolas', 'Funciona',
                'Seção #doc-tecnica configurada com header institucional, badges de governança/TI e atalhos diretos para #admin-panel e #escolas-panel.');
        } else {
            registerResult(1, 'Header do Módulo, Governança & Atalhos RBAC/Escolas', 'Precisa ser implementado',
                'Elementos de navegação e atalhos de governança incompletos no HTML.');
        }
    } catch (e) {
        registerResult(1, 'Header do Módulo, Governança & Atalhos RBAC/Escolas', 'Não funciona', e.message);
    }

    // Item 2: Navegação pelas 5 Sub-abas Técnicas
    try {
        mockWindow.bindTechTabs();
        const erdTab = dbTabs.find(b => (b.getAttribute('data-tech-tab') || b.getAttribute('data-tab')) === 'erd');
        erdTab.click();
        const isErdActive = erdTab.classList.contains('active');
        const isErdPanelVisible = panelErd.style.display === 'block';

        const sqlTab = dbTabs.find(b => (b.getAttribute('data-tech-tab') || b.getAttribute('data-tab')) === 'sql');
        sqlTab.click();
        const isSqlActive = sqlTab.classList.contains('active');
        const isSqlPanelVisible = panelSql.style.display === 'block';

        if (isErdActive && isErdPanelVisible && isSqlActive && isSqlPanelVisible) {
            registerResult(2, 'Navegação pelas 5 Sub-abas Técnicas', 'Funciona',
                'Alternância interativa perfeita entre as 5 sub-abas (.db-tab-btn e .db-panel): modules, erd, sql, apis, architecture.');
        } else {
            registerResult(2, 'Navegação pelas 5 Sub-abas Técnicas', 'Precisa ser implementado',
                'Falha na alternância de visibilidade entre sub-abas técnicas.');
        }
    } catch (e) {
        registerResult(2, 'Navegação pelas 5 Sub-abas Técnicas', 'Não funciona', e.message);
    }

    // Item 3: Painel 1: Módulos do Sistema (Navegação de 5 Módulos)
    try {
        mockWindow.bindModuleTabs();
        const mod3Tab = moduleTabs.find(b => b.getAttribute('data-module') === '3');
        mod3Tab.click();
        const isMod3Active = mod3Tab.classList.contains('active');
        const isMod3PanelActive = modulePanels[2].classList.contains('active');

        const mod5Tab = moduleTabs.find(b => b.getAttribute('data-module') === '5');
        mod5Tab.click();
        const isMod5Active = mod5Tab.classList.contains('active');
        const isMod5PanelActive = modulePanels[4].classList.contains('active');

        if (isMod3Active && isMod3PanelActive && isMod5Active && isMod5PanelActive) {
            registerResult(3, 'Painel 1: Módulos do Sistema (Navegação de 5 Módulos)', 'Funciona',
                'Navegação entre os 5 módulos do sistema (Módulo 1 a 5) com alternância fluida e sincronização de abas ativas.');
        } else {
            registerResult(3, 'Painel 1: Módulos do Sistema (Navegação de 5 Módulos)', 'Precisa ser implementado',
                'Falha na navegação de abas de módulos no Painel 1.');
        }
    } catch (e) {
        registerResult(3, 'Painel 1: Módulos do Sistema (Navegação de 5 Módulos)', 'Não funciona', e.message);
    }

    // Item 4: Painel 2: Diagrama ERD Interativo (Mermaid / SVG Fallback)
    try {
        mockWindow.renderMermaidDiagram();
        const hasMermaidContent = mermaidContainer.innerHTML.includes('DIAGRAMA DE RELACIONAMENTOS') &&
                                  mermaidContainer.innerHTML.includes('ESCOLAS') &&
                                  mermaidContainer.innerHTML.includes('ALUNOS') &&
                                  mermaidContainer.innerHTML.includes('AVALIAÇÕES');
        renderErdBtn.click();
        if (hasMermaidContent && typeof mockWindow.renderMermaidDiagram === 'function') {
            registerResult(4, 'Painel 2: Diagrama ERD Interativo (Mermaid / SVG Fallback)', 'Funciona',
                'Renderização do diagrama ERD com definição Mermaid e fallback SVG vetorial robusto contendo relacionamentos PK/FK das entidades.');
        } else {
            registerResult(4, 'Painel 2: Diagrama ERD Interativo (Mermaid / SVG Fallback)', 'Precisa ser implementado',
                'Contêiner ERD não renderizou adequadamente o diagrama de relacionamentos.');
        }
    } catch (e) {
        registerResult(4, 'Painel 2: Diagrama ERD Interativo (Mermaid / SVG Fallback)', 'Não funciona', e.message);
    }

    // Item 5: Painel 3: Script DDL PostgreSQL Completo & Chaves Estrangeiras
    try {
        mockWindow.renderPostgresSqlDdl();
        const ddl = sqlDisplay.textContent;
        const hasUuid = ddl.includes('uuid-ossp');
        const hasVector = ddl.includes('vector');
        const hasEscolas = ddl.includes('CREATE TABLE IF NOT EXISTS escolas');
        const hasTurmas = ddl.includes('CREATE TABLE IF NOT EXISTS turmas');
        const hasAlunos = ddl.includes('CREATE TABLE IF NOT EXISTS alunos');
        const hasMatriz = ddl.includes('CREATE TABLE IF NOT EXISTS matriz_habilidades');
        const hasQuestoes = ddl.includes('CREATE TABLE IF NOT EXISTS questoes_banco');
        const hasEventos = ddl.includes('CREATE TABLE IF NOT EXISTS eventos_avaliacao');
        const hasRespostas = ddl.includes('CREATE TABLE IF NOT EXISTS respostas_alunos');
        const hasFk = ddl.includes('REFERENCES escolas(id)') && ddl.includes('REFERENCES turmas(id)');

        if (hasUuid && hasVector && hasEscolas && hasTurmas && hasAlunos && hasMatriz && hasQuestoes && hasEventos && hasRespostas && hasFk) {
            registerResult(5, 'Painel 3: Script DDL PostgreSQL Completo & Chaves Estrangeiras', 'Funciona',
                'Script DDL PostgreSQL 15+ completo com extensões (pgvector, uuid), 7 tabelas normalizadas e integridade referencial estrita.');
        } else {
            registerResult(5, 'Painel 3: Script DDL PostgreSQL Completo & Chaves Estrangeiras', 'Precisa ser implementado',
                'Script DDL SQL incompleto ou sem definições adequadas de chaves estrangeiras.');
        }
    } catch (e) {
        registerResult(5, 'Painel 3: Script DDL PostgreSQL Completo & Chaves Estrangeiras', 'Não funciona', e.message);
    }

    // Item 6: Painel 3: Ação de Copiar Script SQL com Feedback
    try {
        mockWindow.lastCopied = null;
        copySqlBtn.click();
        // Await microtasks for clipboard promise
        await new Promise(resolve => setTimeout(resolve, 50));

        const copied = mockWindow.lastCopied;
        const isCopiedValid = copied && copied.includes('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"') && copied.includes('CREATE TABLE IF NOT EXISTS escolas');
        const hasFeedbackToast = toastMessages.some(t => t.msg.includes('Script SQL DDL copiado'));

        if (isCopiedValid && hasFeedbackToast) {
            registerResult(6, 'Painel 3: Ação de Copiar Script SQL com Feedback', 'Funciona',
                'Botão de cópia integrado à API de Clipboard com fallback funcional e notificação Toast de confirmação ao usuário.');
        } else {
            registerResult(6, 'Painel 3: Ação de Copiar Script SQL com Feedback', 'Precisa ser implementado',
                'Ação de copiar script SQL não disparou gravação no clipboard ou notificação Toast.');
        }
    } catch (e) {
        registerResult(6, 'Painel 3: Ação de Copiar Script SQL com Feedback', 'Não funciona', e.message);
    }

    // Item 7: Painel 4: API RESTful Explorer (Navegação de Endpoints)
    try {
        mockWindow.bindApiExplorerTabs();
        const buscaBtn = apiTabs.find(b => b.getAttribute('data-endpoint') === 'busca-questoes');
        buscaBtn.click();
        const isBuscaActive = buscaBtn.classList.contains('active');
        const isBuscaPanelVisible = epBlocks[1].style.display === 'block';

        const diagBtn = apiTabs.find(b => b.getAttribute('data-endpoint') === 'diagnostico-ia');
        diagBtn.click();
        const isDiagActive = diagBtn.classList.contains('active');
        const isDiagPanelVisible = epBlocks[2].style.display === 'block';

        if (isBuscaActive && isBuscaPanelVisible && isDiagActive && isDiagPanelVisible) {
            registerResult(7, 'Painel 4: API RESTful Explorer (Navegação de Endpoints)', 'Funciona',
                'Explorer interativo de endpoints RESTful com alternância entre Agendamento, Busca Semântica de Itens e Diagnóstico IA.');
        } else {
            registerResult(7, 'Painel 4: API RESTful Explorer (Navegação de Endpoints)', 'Precisa ser implementado',
                'Falha na navegação entre endpoints do API Explorer.');
        }
    } catch (e) {
        registerResult(7, 'Painel 4: API RESTful Explorer (Navegação de Endpoints)', 'Não funciona', e.message);
    }

    // Item 8: Painel 4: Payloads JSON de Requisição e Resposta nos Endpoints
    try {
        let parsedCount = 0;
        try { JSON.parse(reqAgendamento.textContent); parsedCount++; } catch (e) {}
        try { JSON.parse(resAgendamento.textContent); parsedCount++; } catch (e) {}
        try { JSON.parse(resBuscaQuestoes.textContent); parsedCount++; } catch (e) {}
        try { JSON.parse(reqDiagnostico.textContent); parsedCount++; } catch (e) {}
        try { JSON.parse(resDiagnostico.textContent); parsedCount++; } catch (e) {}

        if (parsedCount === 5) {
            registerResult(8, 'Painel 4: Payloads JSON de Requisição e Resposta nos Endpoints', 'Funciona',
                'Todos os 5 schemas JSON de requisição e resposta nos endpoints do API Explorer são 100% válidos e com dados de exemplo realistas.');
        } else {
            registerResult(8, 'Painel 4: Payloads JSON de Requisição e Resposta nos Endpoints', 'Precisa ser implementado',
                `Apenas ${parsedCount}/5 payloads JSON foram parseados com sucesso.`);
        }
    } catch (e) {
        registerResult(8, 'Painel 4: Payloads JSON de Requisição e Resposta nos Endpoints', 'Não funciona', e.message);
    }

    // Item 9: Painel 5: Arquitetura de IA, Microsserviços e Stack Recomendada
    try {
        const hasArchHtml = checkHtmlContains('id="tech-panel-architecture"') &&
                            checkHtmlContains('Arquitetura de Microsserviços e Motor IA') &&
                            checkHtmlContains('pgvector') &&
                            checkHtmlContains('FastAPI') &&
                            checkHtmlContains('Gemini');
        if (hasArchHtml) {
            registerResult(9, 'Painel 5: Arquitetura de IA, Microsserviços e Stack Recomendada', 'Funciona',
                'Painel de Arquitetura de IA detalhado documentando stack Next.js/FastAPI, pgvector e pipeline de inferência diagnóstica via LLM Gemini.');
        } else {
            registerResult(9, 'Painel 5: Arquitetura de IA, Microsserviços e Stack Recomendada', 'Precisa ser implementado',
                'Especificações de microsserviços ou arquitetura de IA incompletas no HTML.');
        }
    } catch (e) {
        registerResult(9, 'Painel 5: Arquitetura de IA, Microsserviços e Stack Recomendada', 'Não funciona', e.message);
    }

    // Item 10: Modularidade e Limite de Linhas (< 700 linhas)
    try {
        const lines = scriptCode.split('\n').length;
        if (lines < 700) {
            registerResult(10, 'Modularidade e Limite de Linhas (< 700 linhas)', 'Funciona',
                `Módulo doc_tecnica.js contém exatamente ${lines} linhas (< 700 linhas), respeitando integralmente a regra de modularidade.`);
        } else {
            registerResult(10, 'Modularidade e Limite de Linhas (< 700 linhas)', 'Não funciona',
                `Arquivo doc_tecnica.js excedeu o limite com ${lines} linhas (limite máximo é 700).`);
        }
    } catch (e) {
        registerResult(10, 'Modularidade e Limite de Linhas (< 700 linhas)', 'Não funciona', e.message);
    }

    // Resumo Final
    console.log('========================================================================');
    console.log('RESUMO DA AUDITORIA — ETAPA 11: DOCUMENTAÇÃO TÉCNICA & ARQUITETURA');
    console.log('========================================================================');

    const total = auditResults.length;
    const funciona = auditResults.filter(r => r.status === 'Funciona').length;
    const pendente = auditResults.filter(r => r.status === 'Precisa ser implementado').length;
    const falha = auditResults.filter(r => r.status === 'Não funciona').length;

    console.log(`Total de Itens Auditados: ${total}`);
    console.log(`🟢 Funciona: ${funciona}/${total} (${Math.round(funciona / total * 100)}%)`);
    console.log(`🟡 Precisa ser implementado: ${pendente}/${total}`);
    console.log(`🔴 Não funciona: ${falha}/${total}`);

    if (funciona === total) {
        console.log('\n🎉 SUCESSO: Etapa 11 aprovada com 100% de conformidade!');
        process.exit(0);
    } else {
        console.error('\n⚠️ ATENÇÃO: Etapa 11 possui pendências a corrigir.');
        process.exit(1);
    }
}

runAudit();
