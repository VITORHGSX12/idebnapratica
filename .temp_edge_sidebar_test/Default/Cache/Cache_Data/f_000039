/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO DOCUMENTAÇÃO TÉCNICA & ARQUITETURA DE DADOS
 * Arquivo: js/modules/doc_tecnica/doc_tecnica.js
 * Descrição: Orquestrador de visualizações técnicas: Módulos do Sistema,
 *            Diagrama ERD Interativo (Mermaid), Script DDL SQL Postgres,
 *            API RESTful Explorer e Especificação de IA.
 * ============================================================================
 */

(function (global) {
    'use strict';

    var DDL_POSTGRES_SQL = `-- ============================================================================
-- BANCO DE DADOS: GESTÃO EDUCACIONAL SAAS (POSTGRESQL 15+)
-- Arquitetura Relacional com Extensão pgvector para IA e Calibração SAEB
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. ESCOLAS DA REDE MUNICIPAL
CREATE TABLE IF NOT EXISTS escolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_inep VARCHAR(8) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    sigla VARCHAR(50),
    zona VARCHAR(20) CHECK (zona IN ('Urbana', 'Sede Urbana', 'Rural', 'Zona Rural')),
    endereco TEXT,
    diretor_nome VARCHAR(255),
    email_contato VARCHAR(255),
    telefone VARCHAR(50),
    inse_nivel VARCHAR(20) DEFAULT 'Nível III',
    formacao_docente_pct NUMERIC(5,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TURMAS DA REDE
CREATE TABLE IF NOT EXISTS turmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    serie VARCHAR(50) NOT NULL,
    etapa VARCHAR(50) NOT NULL, -- '2º Ano', '5º Ano', '9º Ano', etc.
    turno VARCHAR(20) CHECK (turno IN ('Matutino', 'Vespertino', 'Noturno', 'Integral')),
    ano_letivo INT NOT NULL DEFAULT 2026,
    docente_regente VARCHAR(255),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ESTUDANTES
CREATE TABLE IF NOT EXISTS alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    data_nascimento DATE,
    escola_id UUID NOT NULL REFERENCES escolas(id),
    turma_id UUID NOT NULL REFERENCES turmas(id),
    genero VARCHAR(20),
    necessidade_especial BOOLEAN DEFAULT FALSE,
    tipo_necessidade VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Transferido', 'Evadido')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MATRIZ DE REFERÊNCIA & HABILIDADES (BNCC / SAEB / SEAMA)
CREATE TABLE IF NOT EXISTS matriz_habilidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matriz VARCHAR(20) NOT NULL, -- 'SAEB', 'BNCC', 'SEAMA'
    etapa VARCHAR(50) NOT NULL,
    disciplina VARCHAR(50) NOT NULL,
    codigo VARCHAR(30) UNIQUE NOT NULL, -- Ex: 'D03', 'EF05LP01'
    descricao TEXT NOT NULL,
    eixo_cognitivo VARCHAR(100),
    complexidade VARCHAR(20) CHECK (complexidade IN ('Baixa', 'Média', 'Alta')),
    embedding vector(768) -- Representação vetorial semântica da habilidade
);

-- 5. BANCO DE QUESTÕES (ITENS AVALIATIVOS)
CREATE TABLE IF NOT EXISTS questoes_banco (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    habilidade_id UUID NOT NULL REFERENCES matriz_habilidades(id),
    enunciado TEXT NOT NULL,
    texto_base TEXT,
    alternativa_a TEXT NOT NULL,
    alternativa_b TEXT NOT NULL,
    alternativa_c TEXT NOT NULL,
    alternativa_d TEXT NOT NULL,
    gabarito_correto CHAR(1) CHECK (gabarito_correto IN ('A', 'B', 'C', 'D')),
    justificativa_didatica TEXT,
    dificuldade VARCHAR(20) DEFAULT 'Media',
    criado_por VARCHAR(100),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EVENTOS DE AVALIAÇÃO & SIMULADOS
CREATE TABLE IF NOT EXISTS eventos_avaliacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'Diagnóstica', 'Simulado SAEB', 'Formativa'
    etapa VARCHAR(50) NOT NULL,
    disciplina VARCHAR(50) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    gabarito_oficial JSONB NOT NULL,
    pesos_questoes JSONB,
    status VARCHAR(20) DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Encerrado', 'Homologado')),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RESPOSTAS E NOTAS DOS ALUNOS
CREATE TABLE IF NOT EXISTS respostas_alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id UUID NOT NULL REFERENCES eventos_avaliacao(id) ON DELETE CASCADE,
    escola_id UUID NOT NULL REFERENCES escolas(id),
    turma_id UUID NOT NULL REFERENCES turmas(id),
    aluno_id UUID NOT NULL REFERENCES alunos(id),
    status_presenca VARCHAR(20) DEFAULT 'PRESENTE' CHECK (status_presenca IN ('PRESENTE', 'AUSENTE')),
    respostas_marcadas JSONB,
    total_acertos INT DEFAULT 0,
    percentual_acerto NUMERIC(5,2) DEFAULT 0.00,
    nivel_saeb INT CHECK (nivel_saeb BETWEEN 0 AND 5),
    data_lancamento TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uk_aluno_evento UNIQUE (evento_id, aluno_id)
);

-- ÍNDICES ESTRATÉGICOS PARA OTIMIZAÇÃO
CREATE INDEX IF NOT EXISTS idx_alunos_escola_turma ON alunos(escola_id, turma_id);
CREATE INDEX IF NOT EXISTS idx_respostas_evento_aluno ON respostas_alunos(evento_id, aluno_id);
CREATE INDEX IF NOT EXISTS idx_respostas_nivel ON respostas_alunos(nivel_saeb);
CREATE INDEX IF NOT EXISTS idx_matriz_cod ON matriz_habilidades(codigo);`;

    var MERMAID_ERD_DEFINITION = `erDiagram
    ESCOLAS ||--o{ TURMAS : possui
    ESCOLAS ||--o{ ALUNOS : matricula
    TURMAS ||--o{ ALUNOS : enturma
    MATRIZ_HABILIDADES ||--o{ QUESTOES_BANCO : alinha
    EVENTOS_AVALIACAO ||--o{ RESPOSTAS_ALUNOS : avalia
    ALUNOS ||--o{ RESPOSTAS_ALUNOS : realiza

    ESCOLAS {
        uuid id PK
        varchar inep UK
        varchar nome
        varchar zona
        varchar inse_nivel
    }

    TURMAS {
        uuid id PK
        uuid escola_id FK
        varchar nome
        varchar etapa
        varchar turno
    }

    ALUNOS {
        uuid id PK
        varchar matricula UK
        varchar nome
        uuid escola_id FK
        uuid turma_id FK
        varchar status
    }

    MATRIZ_HABILIDADES {
        uuid id PK
        varchar codigo UK
        varchar matriz
        varchar disciplina
        text descricao
    }

    QUESTOES_BANCO {
        uuid id PK
        uuid habilidade_id FK
        text enunciado
        char gabarito
        varchar dificuldade
    }

    EVENTOS_AVALIACAO {
        uuid id PK
        varchar titulo
        varchar tipo
        date data_inicio
        jsonb gabarito_oficial
    }

    RESPOSTAS_ALUNOS {
        uuid id PK
        uuid evento_id FK
        uuid aluno_id FK
        int acertos
        numeric percentual
        int nivel_saeb
    }`;

    // =========================================================================
    // CONTROLE DE SUB-ABAS TÉCNICAS E MÓDULOS
    // =========================================================================

    function initDocTecnicaModule() {
        bindTechTabs();
        bindModuleTabs();
        bindApiExplorerTabs();
        renderPostgresSqlDdl();
        renderMermaidDiagram();
        bindCopySqlButton();
    }

    function bindTechTabs() {
        var tabBtns = document.querySelectorAll('.db-tab-btn');
        var panels = document.querySelectorAll('.db-panel');

        tabBtns.forEach(function (btn) {
            btn.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                var targetTab = btn.getAttribute('data-tech-tab') || btn.getAttribute('data-tab');

                tabBtns.forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                panels.forEach(function (p) {
                    if (p.id === 'tech-panel-' + targetTab) {
                        p.classList.add('active');
                        p.style.display = 'block';
                    } else {
                        p.classList.remove('active');
                        p.style.display = 'none';
                    }
                });

                if (targetTab === 'erd') {
                    renderMermaidDiagram();
                } else if (targetTab === 'sql') {
                    renderPostgresSqlDdl();
                }

                if (typeof global.safeCreateIcons === 'function') {
                    global.safeCreateIcons();
                }
            };
        });
    }

    function bindModuleTabs() {
        var moduleBtns = document.querySelectorAll('.module-tab-btn');
        var modulePanels = document.querySelectorAll('.module-panel');

        moduleBtns.forEach(function (btn) {
            btn.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                var modId = btn.getAttribute('data-module');

                moduleBtns.forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                modulePanels.forEach(function (p) {
                    if (p.id === 'module-panel-' + modId) {
                        p.classList.add('active');
                        p.style.display = 'block';
                    } else {
                        p.classList.remove('active');
                        p.style.display = 'none';
                    }
                });
            };
        });
    }

    function bindApiExplorerTabs() {
        var apiBtns = document.querySelectorAll('.api-nav-btn');
        var apiBlocks = document.querySelectorAll('.endpoint-info-block');

        apiBtns.forEach(function (btn) {
            btn.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                var epKey = btn.getAttribute('data-endpoint');

                apiBtns.forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                apiBlocks.forEach(function (blk) {
                    if (blk.id === 'endpoint-' + epKey) {
                        blk.classList.add('active');
                        blk.style.display = 'block';
                    } else {
                        blk.classList.remove('active');
                        blk.style.display = 'none';
                    }
                });
            };
        });

        populateApiSnippets();
    }

    function populateApiSnippets() {
        var reqAgendamento = document.getElementById('req-agendamento-code');
        var resAgendamento = document.getElementById('res-agendamento-code');
        var resBusca = document.getElementById('res-busca-questoes-code');
        var reqDiag = document.getElementById('req-diagnostico-code');
        var resDiag = document.getElementById('res-diagnostico-code');

        if (reqAgendamento) {
            reqAgendamento.textContent = JSON.stringify({
                titulo: "1º Simulado SAEB 2026",
                etapa: "5º Ano EF",
                disciplina: "Matemática",
                data_inicio: "2026-08-10",
                data_fim: "2026-08-14",
                escola_ids: ["esc_1", "esc_2"],
                gabarito: ["A", "B", "C", "D", "A", "B", "C", "D", "A", "B"]
            }, null, 2);
        }

        if (resAgendamento) {
            resAgendamento.textContent = JSON.stringify({
                status: "success",
                evento_id: "evt_7f833929_2026",
                total_alunos_alocados: 245,
                criado_em: "2026-08-01T10:00:00.000Z"
            }, null, 2);
        }

        if (resBusca) {
            resBusca.textContent = JSON.stringify({
                total_itens: 1,
                itens: [{
                    id: "q_d03_01",
                    codigo_bncc: "D03",
                    matriz: "SAEB",
                    enunciado: "Inferir o sentido de uma palavra ou expressão no texto...",
                    dificuldade: "Media",
                    gabarito_correto: "B"
                }]
            }, null, 2);
        }

        if (reqDiag) {
            reqDiag.textContent = JSON.stringify({
                aluno_id: "aluno_4534",
                turma_id: "turma_2a",
                avaliacoes: ["sim_1", "sim_2"],
                incluir_plano_intervencao: true
            }, null, 2);
        }

        if (resDiag) {
            resDiag.textContent = JSON.stringify({
                nivel_saeb_calculado: 4,
                proficiencia_media: 78.5,
                pontos_fortes: ["Localização de informações explícitas", "Inferência de humor"],
                lacunas_criticas: ["Cálculo de frações equivalentes"],
                recomendacao_ia: "Intensificar resolução de problemas com material concreto durante 3 semanas."
            }, null, 2);
        }
    }

    // =========================================================================
    // DDL POSTGRESQL & EXPORTAÇÃO
    // =========================================================================

    function renderPostgresSqlDdl() {
        var display = document.getElementById('sql-code-display');
        if (display) {
            display.textContent = DDL_POSTGRES_SQL;
        }
    }

    function bindCopySqlButton() {
        var copyBtn = document.getElementById('copy-sql-btn');
        if (!copyBtn) return;

        copyBtn.onclick = function (e) {
            if (e && e.preventDefault) e.preventDefault();

            if (navigator && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                navigator.clipboard.writeText(DDL_POSTGRES_SQL).then(function () {
                    notifyCopied(copyBtn);
                }).catch(function () {
                    fallbackCopy(copyBtn);
                });
            } else {
                fallbackCopy(copyBtn);
            }
        };
    }

    function notifyCopied(btn) {
        var originalText = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="check"></i> Copiado!';
        if (typeof global.showToast === 'function') {
            global.showToast('✅ Script SQL DDL copiado para a área de transferência!', 'success');
        }
        setTimeout(function () {
            btn.innerHTML = originalText;
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
        }, 2500);
    }

    function fallbackCopy(btn) {
        var area = document.createElement('textarea');
        area.value = DDL_POSTGRES_SQL;
        document.body.appendChild(area);
        area.select();
        try {
            document.execCommand('copy');
            notifyCopied(btn);
        } catch (e) {}
        document.body.removeChild(area);
    }

    // =========================================================================
    // DIAGRAMA MERMAID ERD & SVG FALLBACK
    // =========================================================================

    function renderMermaidDiagram(theme) {
        var container = document.getElementById('mermaid-container');
        if (!container) return;

        var activeTheme = theme || (document.body.classList.contains('theme-dark') ? 'dark' : 'default');

        if (global.mermaid && typeof global.mermaid.render === 'function') {
            try {
                global.mermaid.initialize({
                    startOnLoad: false,
                    theme: activeTheme,
                    securityLevel: 'loose'
                });
                var renderId = 'mermaid_erd_' + Date.now();
                global.mermaid.render(renderId, MERMAID_ERD_DEFINITION).then(function (res) {
                    container.innerHTML = res.svg;
                }).catch(function () {
                    renderErdSvgFallback(container);
                });
                return;
            } catch (err) {
                renderErdSvgFallback(container);
                return;
            }
        }

        renderErdSvgFallback(container);
    }

    function renderErdSvgFallback(container) {
        container.innerHTML = `
            <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; text-align: center;">
                <div style="font-size: 0.9rem; font-weight: 700; color: var(--purple-light); margin-bottom: 8px;">
                    DIAGRAMA DE RELACIONAMENTOS ENTIDADE-RELACIONAMENTO (ERD)
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-top: 16px;">
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: left;">
                        <strong style="color: #6366f1; font-size: 0.85rem;">ESCOLAS (1)</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">• id (PK)<br>• inep (UK)<br>• nome<br>• zona<br>• inse</div>
                    </div>
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: left;">
                        <strong style="color: #6366f1; font-size: 0.85rem;">TURMAS (N)</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">• id (PK)<br>• escola_id (FK)<br>• nome<br>• etapa<br>• turno</div>
                    </div>
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: left;">
                        <strong style="color: #10b981; font-size: 0.85rem;">ALUNOS (N)</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">• id (PK)<br>• matricula (UK)<br>• nome<br>• escola_id (FK)<br>• turma_id (FK)</div>
                    </div>
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: left;">
                        <strong style="color: #f59e0b; font-size: 0.85rem;">AVALIAÇÕES</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">• id (PK)<br>• titulo<br>• tipo<br>• gabarito_oficial<br>• pesos</div>
                    </div>
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; text-align: left;">
                        <strong style="color: #ec4899; font-size: 0.85rem;">RESPOSTAS</strong>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">• id (PK)<br>• evento_id (FK)<br>• aluno_id (FK)<br>• percentual<br>• nivel_saeb</div>
                    </div>
                </div>
                <div style="margin-top: 16px; font-size: 0.75rem; color: var(--text-secondary);">
                    Integridade referencial estrita garantida com Foreign Keys e índices compostos.
                </div>
            </div>
        `;
    }

    // Exposição Global
    global.initDocTecnicaModule = initDocTecnicaModule;
    global.renderMermaidDiagram = renderMermaidDiagram;
    global.renderPostgresSqlDdl = renderPostgresSqlDdl;
    global.bindTechTabs = bindTechTabs;
    global.bindModuleTabs = bindModuleTabs;
    global.bindApiExplorerTabs = bindApiExplorerTabs;
    global.DDL_POSTGRES_SQL = DDL_POSTGRES_SQL;
    global.MERMAID_ERD_DEFINITION = MERMAID_ERD_DEFINITION;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDocTecnicaModule);
    } else {
        setTimeout(initDocTecnicaModule, 100);
    }

})(typeof window !== 'undefined' ? window : this);
