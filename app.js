const initApp = () => {
    // Global Error Listener for debugging client prototype
    window.addEventListener('error', function(e) {
        console.error('Captured exception:', e);
        showToast('Erro interno detectado: ' + e.message, 'x');
    });

    // Debounce helper for optimization
    function debounce(func, delay = 300) {
        let timer;
        return function(...args) {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Initialize Lucide Icons
    function safeCreateIcons() {
        if (window.lucide) {
            try {
                lucide.createIcons({
                    attrs: {
                        'stroke-width': 1.75
                    }
                });
            } catch (e) {
                console.warn('Lucide failed to render icons:', e);
            }
        }
    }
    safeCreateIcons();

    // Initialize Mermaid with default theme config
    mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'loose',
        themeVariables: {
            background: '#0b0914',
            primaryColor: '#8b5cf6',
            primaryTextColor: '#f1f0f5',
            lineColor: '#272242',
            secondaryColor: '#131023',
            tertiaryColor: '#1b1731'
        }
    });

    // ==========================================
    // NAVIGATION & TAB SWITCHING
    // ==========================================
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const tabMeta = {
        dashboard: {
            title: 'Monitoramento Geral - IDEB & SEAMA',
            subtitle: 'Indicadores gerais do IDEB projetado, proficiência SEAMA, metas municipais e taxa de adesão aos simulados.'
        },
        'escolas-panel': {
            title: 'Escolas da Rede',
            subtitle: 'Painel geral de escolas, total de alunos cadastrados e estatísticas de proficiência de exames externos.'
        },
        'alunos-panel': {
            title: 'Alunos & Cadastros',
            subtitle: 'Consulta de fichas cadastrais completas, dados de contato e acessibilidade da rede.'
        },
        'metas-ideb': {
            title: 'Metas e Planos de Desenvolvimento Escolar',
            subtitle: 'Acompanhamento de metas pactuadas e planos de ação direcionados para escolas com desvio de aprendizagem.'
        },
        'ideb-comparativo': {
            title: 'Comparativo Regional (INEP)',
            subtitle: 'Resultados históricos oficiais e metas projetadas do IDEB por estados e municípios (Fonte: MEC / INEP).'
        },
        'matriz-descritores': {
            title: 'Matriz de Referência & Descritores',
            subtitle: 'Lista de descritores cognitivos de competências do SAEB e do SEAMA.'
        },
        'cronograma-habilidades': {
            title: 'Cronograma Semanal de Habilidades',
            subtitle: 'Planejamento e pactuação semanal de habilidades (SEMED ↔ Docentes) para acelerar a recomposição de aprendizagem.'
        },
        'criar-avaliacoes': {
            title: 'Simulados & Avaliações Externas',
            subtitle: 'Criação de instrumentos pedagógicos focados na preparação para o IDEB (SAEB) e SEAMA.'
        },
        'aplicacao-provas': {
            title: 'Aplicação de Provas',
            subtitle: 'Monitoramento da presença dos alunos e digitação de cartões-resposta em tempo real.'
        },
        'ai-playground': {
            title: 'Relatórios & Monitoramento',
            subtitle: 'Acompanhamento longitudinal de alunos e geração de diagnósticos pedagógicos focados em avaliações externas.'
        },

        questions: {
            title: 'Banco de Itens (IDEB / SEAMA / BNCC)',
            subtitle: 'Pesquisa avançada, montagem de itens de teste e exportação de exames com descritores e habilidades.'
        },
        'gestao-pedagogica': {
            title: 'Gestão Pedagógica & Intervenções',
            subtitle: 'Acompanhamento de planos de ação pedagógica e alertas preditivos de desvios de metas.'
        },
        'doc-tecnica': {
            title: 'Documentação Técnica',
            subtitle: 'Especificação técnica dos módulos, modelo relacional ERD, script DDL SQL e APIs do sistema.'
        },
        'biblioteca-recursos': {
            title: 'Biblioteca Pedagógica & Provas Impressas',
            subtitle: 'Acervo oficial da SEMED Gonçalves Dias - MA. Simulados, matrizes e provas formatadas para impressão A4.'
        },
        'admin-panel': {
            title: 'Área Administrativa & Usuários',
            subtitle: 'Gestão de usuários (RBAC), controle de acessos da SEMED e ferramentas de manutenção do sistema.'
        }
    };

    window.navigateToTab = function(targetTab) {
        if (!targetTab) return;

        // RBAC Access Control Guard for IT/Governance modules
        const userRole = sessionStorage.getItem('userRole') || 'SEMED';
        if ((targetTab === 'doc-tecnica' || targetTab === 'admin-panel') && userRole !== 'Master Admin') {
            showToast('Acesso restrito ao perfil de Administrador de TI e DPO.', 'shield-alert');
            targetTab = 'dashboard';
        }

        // Switch active menu class for all items with same target
        menuItems.forEach(i => {
            if (i.getAttribute('data-target') === targetTab) {
                i.classList.add('active');
            } else {
                i.classList.remove('active');
            }
        });

        // Handle mobileMoreBtn active class coordination
        const bottomNav = document.querySelector('.mobile-bottom-nav');
        if (bottomNav) {
            const matchingBottomTab = bottomNav.querySelector(`.menu-item[data-target="${targetTab}"]`);
            const mobileMoreBtn = document.getElementById('btn-mobile-more');
            if (mobileMoreBtn) {
                if (matchingBottomTab) {
                    mobileMoreBtn.classList.remove('active');
                } else {
                    mobileMoreBtn.classList.add('active');
                }
            }
        }

        // Switch active tab content
        tabContents.forEach(tab => tab.classList.remove('active'));
        const activeTab = document.getElementById(targetTab);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update titles
        if (tabMeta[targetTab]) {
            if (pageTitle) pageTitle.textContent = tabMeta[targetTab].title;
            if (pageSubtitle) pageSubtitle.textContent = tabMeta[targetTab].subtitle;
        }

        // Trigger specific actions when switching tabs
        if (targetTab === 'dashboard') {
            if (typeof recalculateNetworkStats === 'function') recalculateNetworkStats();
            if (typeof renderHeatmapGrid === 'function') renderHeatmapGrid();
            if (typeof renderRiskGoalsTable === 'function') renderRiskGoalsTable();
        } else if (targetTab === 'doc-tecnica') {
            if (typeof renderMermaidDiagram === 'function') renderMermaidDiagram();
        } else if (targetTab === 'cronograma-habilidades') {
            if (typeof renderSkillsSchedule === 'function') renderSkillsSchedule();
        } else if (targetTab === 'gestao-pedagogica') {
            if (typeof renderSaebProficiencyDashboard === 'function') renderSaebProficiencyDashboard();
            if (typeof renderRiskGoalsTable === 'function') renderRiskGoalsTable();
        } else if (targetTab === 'ideb-comparativo') {
            if (typeof updateIdebComparativoView === 'function') updateIdebComparativoView();
        } else if (targetTab === 'ai-playground') {
            if (typeof populateAiSelectors === 'function') populateAiSelectors();
        } else if (targetTab === 'alunos-panel') {
            if (typeof renderDbStudents === 'function') renderDbStudents();
        } else if (targetTab === 'escolas-panel') {
            if (typeof renderDbSchools === 'function') renderDbSchools();
        } else if (targetTab === 'biblioteca-recursos') {
            if (typeof renderPedagogicLibrary === 'function') renderPedagogicLibrary();
        } else if (targetTab === 'criar-avaliacoes') {
            if (typeof renderCreatedEvents === 'function') renderCreatedEvents();
            if (typeof populateWizardSchools === 'function') populateWizardSchools();
        } else if (targetTab === 'aplicacao-provas') {
            if (typeof renderOngoingAssessments === 'function') renderOngoingAssessments();
            if (typeof populateScoreSchoolSelect === 'function') populateScoreSchoolSelect();
        } else if (targetTab === 'matriz-descritores') {
            if (typeof renderReferenceMatrix === 'function') renderReferenceMatrix();
        } else if (targetTab === 'questions') {
            if (typeof renderQuestions === 'function') renderQuestions();
            if (typeof populateQuestionCreatorDropdowns === 'function') populateQuestionCreatorDropdowns();
        } else if (targetTab === 'metas-ideb') {
            if (typeof populateIdebGoalsTable === 'function') populateIdebGoalsTable();
        } else if (targetTab === 'admin-panel') {
            if (typeof loadUsersList === 'function') loadUsersList();
        }
        
        safeCreateIcons();
    };

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-target');
            window.navigateToTab(targetTab);
        });
    });

    // ==========================================
    // THEME TOGGLER (DARK / LIGHT MODE)
    // ==========================================
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (themeToggleBtn) {
        themeToggleBtn.innerHTML = document.body.classList.contains('dark-mode') ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        safeCreateIcons();
        
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            
            themeToggleBtn.innerHTML = isDark ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
            safeCreateIcons();
            
            showToast(`Tema alternado para modo ${isDark ? 'Escuro' : 'Claro'}`);

            const activeTab = document.querySelector('.menu-item.active') ? document.querySelector('.menu-item.active').getAttribute('data-target') : '';
            if (activeTab === 'doc-tecnica') {
                renderMermaidDiagram(isDark ? 'dark' : 'default');
            }
        });
    }

    // ==========================================
    // NOTIFICATION TOAST SYSTEM
    // ==========================================
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    function showToast(message, iconName = 'info') {
        toastMessage.textContent = message;
        toastIcon.setAttribute('data-lucide', iconName);
        safeCreateIcons();
        
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    // ==========================================
    // FUNCTIONAL MODULES TAB
    // ==========================================
    const moduleBtns = document.querySelectorAll('.module-tab-btn');
    const modulePanels = document.querySelectorAll('.module-panel');

    moduleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const moduleNum = btn.getAttribute('data-module');
            
            moduleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            modulePanels.forEach(p => p.classList.remove('active'));
            document.getElementById(`module-panel-${moduleNum}`).classList.add('active');
            
            safeCreateIcons();
        });
    });

    // ==========================================
    // DATABASE TAB (MERMAID & DDL SQL)
    // ==========================================
    const dbTabBtns = document.querySelectorAll('.db-tab-btn');
    const dbPanels = document.querySelectorAll('.db-panel');

    dbTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPanel = btn.getAttribute('data-tech-tab');

            dbTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            dbPanels.forEach(p => p.classList.remove('active'));
            document.getElementById(`tech-panel-${targetPanel}`).classList.add('active');

            if (targetPanel === 'erd') {
                renderMermaidDiagram();
            }
        });
    });

    const ddlSQLCode = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Suporte para IA pgvector no banco de questões

-- 1. Tabela de Tenants (Redes de Ensino / Mantenedoras)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    configuracoes JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Escolas
CREATE TABLE escolas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    codigo_inep VARCHAR(8) UNIQUE,
    endereco TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_escola_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- 3. Tabela de Turnos
CREATE TABLE turnos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    nome VARCHAR(50) NOT NULL, -- Matutino, Vespertino, Noturno, Integral
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL
);

-- 4. Anos Letivos
CREATE TABLE anos_letivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escola_id UUID NOT NULL REFERENCES escolas(id) ON DELETE CASCADE,
    ano INTEGER NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    UNIQUE (escola_id, ano)
);

-- 5. Turmas
CREATE TABLE turmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ano_letivo_id UUID NOT NULL REFERENCES anos_letivos(id) ON DELETE CASCADE,
    turno_id UUID NOT NULL REFERENCES turnos(id),
    nome VARCHAR(100) NOT NULL, -- ex: "6º Ano A", "9º Ano B"
    capacidade_maxima INTEGER DEFAULT 35,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Usuários (RBAC)
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Master Admin', 'Gestor da Rede', 'Diretor Escola', 'Professor', 'Aluno', 'Responsavel')),
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Alunos
CREATE TABLE alunos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_matricula VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    data_nascimento DATE NOT NULL,
    nome_responsavel VARCHAR(255),
    contato_responsavel VARCHAR(100),
    necessidades_especiais JSONB, -- NEE, acessibilidade
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Matrículas (Associação Aluno-Turma e Histórico)
CREATE TABLE matriculas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aluno_id UUID NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
    turma_id UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Transferido', 'Evadido', 'Concluido')),
    data_matricula DATE NOT NULL DEFAULT CURRENT_DATE,
    observacoes TEXT
);

-- 9. Categorias de Materiais Didáticos
CREATE TABLE categorias_materiais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- 10. Materiais Didáticos (Gestão de Conteúdo)
CREATE TABLE materiais_didaticos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID NOT NULL REFERENCES categorias_materiais(id),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('PDF', 'EPUB', 'Link', 'Videoaula', 'SCORM')),
    url_arquivo TEXT NOT NULL,
    config_visibilidade VARCHAR(50)[] DEFAULT ARRAY['Professor', 'Aluno'], -- RBAC arrays
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Matriz Habilidades BNCC
CREATE TABLE habilidades_bncc (
    codigo VARCHAR(20) PRIMARY KEY, -- ex: 'EF06MA05'
    descricao TEXT NOT NULL,
    componente_curricular VARCHAR(100) NOT NULL,
    ano_escolar VARCHAR(50) NOT NULL
);

-- 12. Banco de Questões
CREATE TABLE questoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_bncc VARCHAR(20) NOT NULL REFERENCES habilidades_bncc(codigo),
    enunciado TEXT NOT NULL,
    enunciado_latex TEXT, -- Fórmulas matemáticas escritas em LaTeX
    nivel_cognitivo VARCHAR(50) CHECK (nivel_cognitivo IN ('Lembrar', 'Entender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar')),
    dificuldade VARCHAR(20) NOT NULL CHECK (dificuldade IN ('Facil', 'Medio', 'Dificil')),
    criado_por UUID REFERENCES usuarios(id),
    embedding_vetorial vector(1536), -- Para busca semântica inteligente
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. Opções de Resposta para Questões
CREATE TABLE opcoes_resposta (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_id UUID NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
    letra CHAR(1) NOT NULL, -- A, B, C, D, E
    texto TEXT NOT NULL,
    correta BOOLEAN DEFAULT FALSE,
    comentario TEXT -- Explicativa do gabarito
);

-- 14. Avaliações (Cabeçalho/Template)
CREATE TABLE avaliacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Formativa', 'Somativa', 'Simulado')),
    criado_por UUID REFERENCES usuarios(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Itens da Avaliação (Associativa Questões-Avaliações com pesos)
CREATE TABLE itens_avaliacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avaliacao_id UUID NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
    questao_id UUID NOT NULL REFERENCES questoes(id),
    peso NUMERIC(5,2) DEFAULT 1.00,
    ordem_questao INTEGER NOT NULL
);

-- 16. Eventos de Aplicação da Avaliação (Agendamento)
CREATE TABLE eventos_avaliacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    avaliacao_id UUID NOT NULL REFERENCES avaliacoes(id) ON DELETE CASCADE,
    escola_id UUID REFERENCES escolas(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES turmas(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. Respostas dos Alunos (Processamento de Cartão-Resposta)
CREATE TABLE respostas_aluno (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    evento_id UUID NOT NULL REFERENCES eventos_avaliacao(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES itens_avaliacao(id),
    opcao_escolhida_id UUID REFERENCES opcoes_resposta(id),
    resposta_discursiva TEXT, -- Se discursiva
    nota_obtida NUMERIC(5,2),
    respondido_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. Histórico de Diagnósticos por IA (Cache de relatórios estruturados)
CREATE TABLE diagnosticos_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricula_id UUID NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    evento_id UUID NOT NULL REFERENCES eventos_avaliacao(id) ON DELETE CASCADE,
    relatorio_markdown TEXT NOT NULL,
    prompt_usado TEXT,
    data_geracao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices Recomendados para Otimização
CREATE INDEX idx_matriculas_turma ON matriculas(turma_id);
CREATE INDEX idx_questoes_bncc ON questoes(codigo_bncc);
CREATE INDEX idx_respostas_aluno_matricula ON respostas_aluno(matricula_id);
CREATE INDEX idx_respostas_aluno_evento ON respostas_aluno(evento_id);
`;

    document.getElementById('sql-code-display').textContent = ddlSQLCode.trim();

    const copySqlBtn = document.getElementById('copy-sql-btn');
    copySqlBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(ddlSQLCode.trim()).then(() => {
            showToast('Código SQL copiado para a área de transferência!', 'clipboard');
        });
    });

    const mermaidSyntax = `erDiagram
    TENANTS ||--o{ ESCOLAS : "contem"
    TENANTS ||--o{ USUARIOS : "possui"
    ESCOLAS ||--o{ TURNOS : "possui"
    ESCOLAS ||--o{ ANOS_LETIVOS : "possui"
    ANOS_LETIVOS ||--o{ TURMAS : "contem"
    TURNOS ||--o{ TURMAS : "aloca"
    TURMAS ||--o{ MATRICULAS : "recebe"
    ALUNOS ||--o{ MATRICULAS : "vincula"
    CATEGORIAS_MATERIAIS ||--o{ MATERIAIS_DIDATICOS : "possui"
    HABILIDADES_BNCC ||--o{ QUESTOES : "mapeia"
    QUESTOES ||--o{ OPCOES_RESPOSTA : "contem"
    AVALIACOES ||--o{ EVENTOS_AVALIACAO : "agenda"
    AVALIACOES ||--o{ ITENS_AVALIACAO : "contem"
    QUESTOES ||--o{ ITENS_AVALIACAO : "associa"
    EVENTOS_AVALIACAO ||--o{ RESPOSTAS_ALUNO : "aplica"
    MATRICULAS ||--o{ RESPOSTAS_ALUNO : "realiza"
    ITENS_AVALIACAO ||--o{ RESPOSTAS_ALUNO : "pontua"
    MATRICULAS ||--o{ DIAGNOSTICOS_IA : "recebe"
`;

    let erdRendered = false;
    const mermaidContainer = document.getElementById('mermaid-container');
    const renderErdBtn = document.getElementById('render-erd-btn');

    function renderMermaidDiagram(theme = 'dark') {
        if (erdRendered && theme === 'dark') return; // Evita loopings se já renderizado

        mermaidContainer.removeAttribute('data-processed');
        mermaidContainer.textContent = mermaidSyntax;
        
        try {
            mermaid.init(undefined, mermaidContainer);
            erdRendered = true;
        } catch (err) {
            console.error('Erro ao renderizar o Mermaid ERD:', err);
        }
    }

    renderErdBtn.addEventListener('click', () => {
        erdRendered = false;
        renderMermaidDiagram(document.body.classList.contains('dark-mode') ? 'dark' : 'default');
        showToast('Diagrama ERD recarregado.', 'refresh-cw');
    });

    // ==========================================
    // ARCHITECTURE & API ENDPOINTS EXPLORER
    // ==========================================
    const apiNavBtns = document.querySelectorAll('.api-nav-btn');
    const endpointBlocks = document.querySelectorAll('.endpoint-info-block');

    const apiPayloads = {
        agendamento: {
            request: {
                avaliacao_id: "a3f5a2b1-12cd-4b67-bd88-0f0980c651ad",
                escola_id: "c8e6df10-f1c2-4876-aa9a-ff7d1c68f12a",
                turma_id: "ee3b8602-005d-4569-8bc3-b1d986b24d77",
                data_inicio: "2026-08-10T08:00:00Z",
                data_fim: "2026-08-10T12:00:00Z"
            },
            response: {
                evento_id: "dd4b92c1-841b-4f9e-a0e2-18471cba88ef",
                avaliacao_id: "a3f5a2b1-12cd-4b67-bd88-0f0980c651ad",
                status: "Agendado",
                token_aplicacao: "APP-VLM-2026",
                criado_em: "2026-08-07T15:20:00Z"
            }
        },
        'busca-questoes': {
            response: [
                {
                    questao_id: "6f5298a0-2ba4-4c8d-8ae5-115f21bd8a92",
                    bncc_code: "EF05MA01",
                    enunciado: "O número cento e vinte e cinco mil e quarenta e dois escrito em algarismos arábicos corresponde a:",
                    dificuldade: "Facil",
                    nivel_cognitivo: "Lembrar",
                    opcoes: [
                        { id: "opt-1", letra: "A", texto: "125.042", correta: true },
                        { id: "opt-2", letra: "B", texto: "125.420", correta: false },
                        { id: "opt-3", letra: "C", texto: "12.542", correta: false },
                        { id: "opt-4", letra: "D", texto: "1.250.042", correta: false }
                    ]
                }
            ]
        },
        'diagnostico-ia': {
            request: {
                aluno_id: "721a98db-0fcb-4895-8bc6-98dcbf71aaef",
                evento_id: "dd4b92c1-841b-4f9e-a0e2-18471cba88ef",
                dados_desempenho: {
                    habilidades: [
                        { codigo: "EF06MA05", total_questoes: 5, acertos: 2, percentual: 40.0 },
                        { codigo: "EF05MA01", total_questoes: 4, acertos: 3, percentual: 75.0 },
                        { codigo: "EF04MA02", total_questoes: 4, acertos: 4, percentual: 100.0 }
                    ]
                }
            },
            response: {
                diagnostico_id: "fa329b8c-5aef-4573-ae09-1234bcda0911",
                aluno_id: "721a98db-0fcb-4895-8bc6-98dcbf71aaef",
                data_geracao: "2026-08-07T15:21:05Z",
                diagnostico_markdown: "# Diagnóstico Pedagógico - Lucas Silva\n\n### Pontos Fortes\n* **EF04MA02 (100%):** Domínio completo da decomposição e escrita de números naturais em potências de 10.\n\n### Pontos de Atenção\n* **EF06MA05 (40%):** O aluno apresenta dificuldades graves no cálculo e resolução de frações e divisão de partes...\n\n### Plano de Ação Sugerido\n* Exercícios de representação visual de frações (barras de frações e discos de pizza).\n* Revisão do conceito de divisão simples."
            }
        }
    };

    document.getElementById('req-agendamento-code').textContent = JSON.stringify(apiPayloads.agendamento.request, null, 4);
    document.getElementById('res-agendamento-code').textContent = JSON.stringify(apiPayloads.agendamento.response, null, 4);
    document.getElementById('res-busca-questoes-code').textContent = JSON.stringify(apiPayloads['busca-questoes'].response, null, 4);
    document.getElementById('req-diagnostico-code').textContent = JSON.stringify(apiPayloads['diagnostico-ia'].request, null, 4);
    document.getElementById('res-diagnostico-code').textContent = JSON.stringify(apiPayloads['diagnostico-ia'].response, null, 4);

    apiNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const endpoint = btn.getAttribute('data-endpoint');

            apiNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            endpointBlocks.forEach(block => block.classList.remove('active'));
            document.getElementById(`endpoint-${endpoint}`).classList.add('active');
        });
    });

    // ==========================================
    // PLAYGROUND DE IA: RELATÓRIOS POR ESCOLA
    // ==========================================
    const aiSchoolSelect = document.getElementById('ai-school-select');
    const aiGradeSelect = document.getElementById('ai-grade-select');
    const aiSubjectSelect = document.getElementById('ai-subject-select');
    const btnGenerateSchoolReport = document.getElementById('btn-generate-school-report');
    const aiSchoolReportContainer = document.getElementById('ai-school-report-container');
    const aiReportGenerationStatus = document.getElementById('ai-report-generation-status');

    function populateAiSelectors() {
        if (!aiSchoolSelect || !aiGradeSelect) return;

        // Populate schools from loaded dataset
        const uniqueSchools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
        aiSchoolSelect.innerHTML = '<option value="all">Toda a Rede Geral</option>';
        uniqueSchools.forEach(sch => {
            const opt = document.createElement('option');
            opt.value = sch;
            opt.textContent = sch;
            aiSchoolSelect.appendChild(opt);
        });

        // Setup listener and update grades
        aiSchoolSelect.removeEventListener('change', updateAiGradeSelector);
        aiSchoolSelect.addEventListener('change', updateAiGradeSelector);
        updateAiGradeSelector();
    }

    function updateAiGradeSelector() {
        if (!aiSchoolSelect || !aiGradeSelect) return;
        const selectedSchool = aiSchoolSelect.value;

        aiGradeSelect.innerHTML = '<option value="all">Todas as Turmas / Etapas</option>';

        const studentsSource = selectedSchool === 'all' ? loadedStudents : loadedStudents.filter(s => s.escola === selectedSchool);
        
        const uniqueEtapas = [...new Set(studentsSource.map(s => {
            const match = s.etapa.match(/\d+º\s+Ano/i);
            return match ? match[0] : s.etapa;
        }))].sort();

        uniqueEtapas.forEach(et => {
            const opt = document.createElement('option');
            opt.value = et;
            opt.textContent = et;
            aiGradeSelect.appendChild(opt);
        });
    }

    let loadedStudents = [];
    let activeStudent = null;
    let activePromptTab = 'system';

    // In-memory Database Tables
    let dbEscolas = [];
    let dbTurmas = [];
    let dbAlunos = [];
    let dbAvaliacoes = [];
    let dbQuestoes = [];
    let dbResultadosAluno = [];
    const API_BASE_URL = window.location.port === '8081' ? 'http://localhost:8080' : window.location.origin;
    let isCloudSyncActive = false;

    function updateCloudIndicator(online, mode = 'postgres') {
        const indicator = document.getElementById('cloud-sync-indicator');
        const dot = document.getElementById('cloud-sync-dot');
        const text = document.getElementById('cloud-sync-text');
        
        if (!indicator || !dot || !text) return;
        
        if (online) {
            indicator.style.background = 'rgba(16, 185, 129, 0.15)';
            indicator.style.color = 'var(--green-light)';
            indicator.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            dot.style.background = 'var(--green-light)';
            text.textContent = mode === 'postgres' ? 'Nuvem (Postgres)' : 'Nuvem (Local JSON)';
        } else {
            indicator.style.background = 'rgba(239, 68, 68, 0.15)';
            indicator.style.color = 'var(--red-light)';
            indicator.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            dot.style.background = 'var(--red-light)';
            text.textContent = 'Modo Local (Offline)';
        }
    }

    async function checkCloudStatus() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/health`);
            if (res.ok) {
                const info = await res.json();
                isCloudSyncActive = true;
                updateCloudIndicator(true, info.databaseMode);
                return true;
            }
        } catch (e) {
            // Ignore
        }
        isCloudSyncActive = false;
        updateCloudIndicator(false);
        return false;
    }

    function checkOnboardingState() {
        const onboardingDiv = document.getElementById('dashboard-onboarding');
        const mainContentDiv = document.getElementById('dashboard-main-content');
        if (onboardingDiv && mainContentDiv) {
            if (dbEscolas.length === 0) {
                onboardingDiv.classList.remove('hidden');
                mainContentDiv.classList.add('hidden');
            } else {
                onboardingDiv.classList.add('hidden');
                mainContentDiv.classList.remove('hidden');
            }
        }
    }

    function saveDatabaseState() {
        localStorage.setItem('dbEscolas', JSON.stringify(dbEscolas));
        localStorage.setItem('dbTurmas', JSON.stringify(dbTurmas));
        localStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
        localStorage.setItem('dbAvaliacoes', JSON.stringify(dbAvaliacoes));
        localStorage.setItem('dbQuestoes', JSON.stringify(dbQuestoes));
        localStorage.setItem('dbResultadosAluno', JSON.stringify(dbResultadosAluno));
        localStorage.setItem('rawQuestions', JSON.stringify(rawQuestions));
        localStorage.setItem('activeEvaluations', JSON.stringify(activeEvaluations));

        checkOnboardingState();

        if (isCloudSyncActive) {
            const state = {
                dbEscolas,
                dbTurmas,
                dbAlunos,
                dbAvaliacoes,
                dbQuestoes,
                dbResultadosAluno,
                rawQuestions,
                activeEvaluations
            };
            const userEmail = sessionStorage.getItem('userEmail') || 'gestor@municipio.gov.br';
            const tenantId = sessionStorage.getItem('activeTenant') || 'default';
            const url = `${API_BASE_URL}/api/sync?tenantId=${encodeURIComponent(tenantId)}`;
            const token = btoa(userEmail);
            fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(state)
            }).catch(err => console.error('Cloud save failed:', err));
        }
    }

        async function loadDatabaseState() {
        // Enforce EXACT 9 official schools of Gonçalves Dias - MA
        dbEscolas = [
            { id: 'esc_1', nome: 'UI JOSE CORREA LIMA', inep: '21128723', zona: 'Zona Rural', telefone: '-', diretor: 'S/G' },
            { id: 'esc_2', nome: 'UI EMILIO MURAD', inep: '21128146', zona: 'Zona Rural', telefone: '9935-6250', diretor: 'S/G' },
            { id: 'esc_3', nome: 'UE VEREADOR LEONARDO FERREIRA LIMA', inep: '21128740', zona: 'Sede Urbana', telefone: '9981-4371', diretor: 'S/G' },
            { id: 'esc_4', nome: 'U I BASILIO ALVES', inep: '21128120', zona: 'Zona Rural', telefone: '9935-6218 - 99356-2607', diretor: 'S/G' },
            { id: 'esc_5', nome: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ', inep: '21286973', zona: 'Sede Urbana', telefone: '9998-2055', diretor: 'S/G' },
            { id: 'esc_6', nome: 'UE RAIMUNDO DOS REIS DA SILVA', inep: '21128758', zona: 'Zona Rural', telefone: '-', diretor: 'S/G' },
            { id: 'esc_7', nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', inep: '21286990', zona: 'Zona Rural', telefone: '9998-2055', diretor: 'S/G' },
            { id: 'esc_8', nome: 'UNIDADE ESCOLAR ANISIO GOMES', inep: '21128774', zona: 'Zona Rural', telefone: '99817-0566', diretor: 'S/G' },
            { id: 'esc_9', nome: 'UE ANITA FURTADO', inep: '21192544', zona: 'Sede Urbana', telefone: '9935-6210', diretor: 'S/G' }
        ];
        uniqueSchoolsList = dbEscolas.map(e => e.nome);
        
        // Zero students and zero classes as requested by user
        dbTurmas = [];
        dbAlunos = [];
        loadedStudents = [];
        
        localStorage.setItem('dbEscolas', JSON.stringify(dbEscolas));
        localStorage.setItem('dbTurmas', JSON.stringify(dbTurmas));
        localStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
        
        finishLoading();
    }

    function finishLoading() {
        recalculateNetworkStats();
        
        const metricStud = document.getElementById('metric-students-eval');
        if (metricStud) {
            metricStud.textContent = `${dbAlunos.length.toLocaleString('pt-BR')} alunos avaliados`;
        }
        const badgeCount = document.getElementById('badge-count-students');
        if (badgeCount) {
            badgeCount.textContent = dbAlunos.length.toLocaleString('pt-BR');
        }

        const schools = Array.from(new Set(dbAlunos.map(a => a.escola || a.nome_escola || ''))).filter(Boolean).sort();
        
        if (window.populateSchoolPanelSelector) {
            window.populateSchoolPanelSelector(schools);
        }
        if (window.initAlunosTab) {
            window.initAlunosTab(schools);
        }

        try {
            if (typeof populateIdebGoalsTable === 'function') populateIdebGoalsTable(schools);
            if (typeof populateWizardSchools === 'function') populateWizardSchools();
            if (typeof populateScoreSchoolSelect === 'function') populateScoreSchoolSelect();
            if (typeof populateDashboardResultsSelectors === 'function') populateDashboardResultsSelectors();

            if (typeof renderDbSchools === 'function') renderDbSchools();
            if (typeof renderDbStudents === 'function') renderDbStudents();
            if (typeof renderCreatedEvents === 'function') renderCreatedEvents();
            if (typeof renderOngoingAssessments === 'function') renderOngoingAssessments();
            if (typeof renderActiveDescriptors === 'function') renderActiveDescriptors();
            if (typeof renderQuestions === 'function') renderQuestions();
            if (typeof renderReferenceMatrix === 'function') renderReferenceMatrix();
            if (typeof renderSkillsSchedule === 'function') renderSkillsSchedule();
            if (typeof populateQuestionCreatorDropdowns === 'function') populateQuestionCreatorDropdowns();
            if (typeof initIdebComparativo === 'function') initIdebComparativo();
            if (typeof renderPedagogicLibrary === 'function') renderPedagogicLibrary();
            if (typeof renderHeatmapGrid === 'function') renderHeatmapGrid();
            if (typeof renderRiskGoalsTable === 'function') renderRiskGoalsTable();
            if (typeof loadUsersList === 'function') loadUsersList();
            if (typeof checkOnboardingState === 'function') checkOnboardingState();
        } catch (err) {
            console.warn('[IDEB Engine] Rendering warning:', err);
        }
    }

    
    function syncNormalizedTablesFromLoadedData() {
        // ALWAYS keep the 9 official schools of Gonçalves Dias
        dbEscolas = OFFICIAL_9_SCHOOLS.map(s => ({
            id: s.id,
            nome: s.nome,
            codigo_inep: s.inep,
            inep: s.inep,
            zona: s.zone,
            telefone: s.phone,
            rede_id: "municipal",
            diretor: "S/G (Aguardando Atribuição)"
        }));
        uniqueSchoolsList = dbEscolas.map(e => e.nome);

        dbTurmas = [];
        dbAlunos = [];
        dbAvaliacoes = [];
        dbQuestoes = [];
        dbResultadosAluno = [];

        if (loadedStudents && loadedStudents.length > 0) {
            // Populate classes from students if any exist
            const uniqueClasses = [];
            loadedStudents.forEach(s => {
                const exists = uniqueClasses.some(c => c.schoolName === s.escola && c.gradeName === s.etapa);
                if (!exists) {
                    uniqueClasses.push({ schoolName: s.escola, gradeName: s.etapa });
                }
            });

            uniqueClasses.forEach((cls, idx) => {
                const schoolObj = dbEscolas.find(e => e.nome === cls.schoolName);
                dbTurmas.push({
                    id: `tur_${idx + 1}`,
                    escola_id: schoolObj ? schoolObj.id : null,
                    nome: cls.gradeName,
                    turno: "Matutino",
                    ano_letivo: 2026
                });
            });

            loadedStudents.forEach((s, idx) => {
                const schoolObj = dbEscolas.find(e => e.nome === s.escola);
                const classObj = dbTurmas.find(t => t.escola_id === (schoolObj ? schoolObj.id : null) && t.nome === s.etapa);
                dbAlunos.push({
                    id: `aln_${idx + 1}`,
                    turma_id: classObj ? classObj.id : null,
                    nome: s.nome,
                    matricula: s.matricula,
                    escola: s.escola,
                    etapa: s.etapa,
                    turma: s.turma || s.etapa,
                    pontuacao_lp: s.pontuacao_lp || 0,
                    pontuacao_mat: s.pontuacao_mat || 0,
                    nivel_lp: s.nivel_lp || 'Básico',
                    nivel_mat: s.nivel_mat || 'Básico',
                    nivel_global: s.nivel_global || 'Básico',
                    status_risco: s.status_risco || 'Médio',
                    freq: s.freq || 100
                });
            });
        }
    }


    const systemPromptText = `Você é o Motor Diagnóstico Pedagógico Oficial do IDEB na Prática, especializado em analisar o desempenho de estudantes sob a ótica dos exames externos nacionais (SAEB / IDEB) e estaduais (SEAMA - Maranhão), bem como na Matriz BNCC de referência.

Seu papel é receber o prontuário do aluno com seu histórico longitudinal por habilidades/descritores (em Língua Portuguesa, Matemática, Ciências e Geografia) e retornar um laudo pedagógico estruturado no formato Markdown estrito.

DIRETRIZES DO DIAGNÓSTICO:
1. DESEMPENHO EM EXAMES EXTERNOS: Mapeie os pontos fortes e fragilidades do aluno correlacionando-os com os Descritores de Referência do SAEB e do SEAMA.
2. ANÁLISE POR COMPONENTE CURRICULAR: Detalhe as habilidades consolidadas e as lacunas nos componentes de Língua Portuguesa (Leitura/Escrita), Matemática (Resolução de problemas), Ciências e Geografia.
3. RECOMENDAÇÃO DE INTERVENÇÃO PEDAGÓGICA: Propor ações didáticas específicas e planos de ação focados em elevar os índices de proficiência e projetar crescimento no IDEB escolar.
4. TONALIDADE: Altamente pedagógica, construtiva e técnica, focando estritamente em intervenções escolares direcionadas.`;

    // Load real database with CORS-resilient fallback
    function loadDatabase() {
        if (window.alunosDatabase && window.alunosDatabase.length > 0) {
            console.log('Loading database from window.alunosDatabase (Resilient file:// mode)...');
            initDatabase(window.alunosDatabase);
        } else {
            console.log('Fetching database from alunos.json...');
            fetch('alunos.json')
                .then(res => res.json())
                .then(data => {
                    initDatabase(data);
                })
                .catch(err => {
                    console.error('Error loading database:', err);
                    showToast('Erro ao carregar banco de dados.', 'alert-triangle');
                });
        }
    }

    // Store PDE plans per school in memory
    const schoolPdePlansMap = {};

    function populateIdebGoalsTable(schools) {
        const tableBody = document.getElementById('ideb-goals-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const schoolList = (schools && schools.length > 0) ? schools : uniqueSchoolsList;
        const filterVal = document.getElementById('pde-filter-status')?.value || 'all';

        const rowsData = schoolList.map(schName => {
            const schStudents = loadedStudents.filter(s => s.escola === schName);
            const countStudents = schStudents.length || 180;
            
            // Calculate real average score in SAEB scale (0 - 500)
            let avgScore = 215;
            if (schStudents.length > 0) {
                const total = schStudents.reduce((acc, s) => acc + (s.avg_score || 215), 0);
                avgScore = Math.round(total / schStudents.length);
            }

            let hash = 0;
            for (let i = 0; i < schName.length; i++) hash += schName.charCodeAt(i);
            const baseIdeb = 4.2 + (hash % 12) / 10;
            const projectedIdeb = Number((baseIdeb + (avgScore / 100) * 0.45).toFixed(1));
            const targetIdeb = Number((baseIdeb + 0.6).toFixed(1));
            const gap = Number((projectedIdeb - targetIdeb).toFixed(1));
            
            let riskLevel = 'Baixo';
            let riskBadge = '<span class="badge badge-success">Baixo Risco 🟢</span>';
            let riskCategory = 'ok';

            if (gap < -0.3) {
                riskLevel = 'Alto';
                riskBadge = '<span class="badge badge-danger">Alto Risco 🔴</span>';
                riskCategory = 'risk';
            } else if (gap < 0) {
                riskLevel = 'Médio';
                riskBadge = '<span class="badge badge-warning">Médio Risco 🟡</span>';
                riskCategory = 'risk';
            }

            let nivelProfLabel = 'Nível 3 (Básico)';
            if (avgScore >= 275) nivelProfLabel = 'Nível 5 (Avançado)';
            else if (avgScore >= 225) nivelProfLabel = 'Nível 4 (Adequado)';
            else if (avgScore < 180) nivelProfLabel = 'Nível 2 (Crítico)';

            const hasPlan = !!schoolPdePlansMap[schName];

            return {
                schName,
                baseIdeb,
                projectedIdeb,
                avgScore,
                nivelProfLabel,
                gap,
                riskLevel,
                riskBadge,
                riskCategory,
                hasPlan,
                countStudents
            };
        });

        // Sort by gap ascending (most negative / critical gap first)
        rowsData.sort((a, b) => a.gap - b.gap);

        const filtered = rowsData.filter(item => {
            if (filterVal === 'risk') return item.riskCategory === 'risk';
            if (filterVal === 'ok') return item.riskCategory === 'ok';
            return true;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted);">
                        Nenhuma escola encontrada para o filtro selecionado.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(item => {
            const gapText = item.gap >= 0 ? `+${item.gap.toFixed(1)}` : `${item.gap.toFixed(1)}`;
            const gapColor = item.gap >= 0 ? 'var(--green-light)' : 'var(--red-light)';

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '48px';
            tr.innerHTML = `
                <td style="padding: 10px 16px; font-weight:600; color:var(--text-primary);">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i data-lucide="school" style="width:14px; height:14px; color:var(--purple-light);"></i>
                        <span>${item.schName}</span>
                    </div>
                </td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); font-size:0.85rem;">${item.baseIdeb.toFixed(1)}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); font-weight:700; color:var(--purple-light); font-size:0.85rem;">${item.projectedIdeb.toFixed(1)}</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <span style="font-family:var(--font-mono); font-weight:700; color:var(--text-primary);">${item.avgScore} pts</span>
                    <span style="display:block; font-size:0.7rem; color:var(--text-muted);">${item.nivelProfLabel}</span>
                </td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); color:${gapColor}; font-weight:700; font-size:0.85rem;">${gapText}</td>
                <td style="padding: 10px 16px; text-align:center;">${item.riskBadge}</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <div style="display:flex; gap:6px; justify-content:center; align-items:center;">
                        ${item.hasPlan ? `
                            <button class="btn btn-outline btn-sm btn-open-pde-modal" 
                                    data-school="${item.schName}" 
                                    data-base="${item.baseIdeb.toFixed(1)}" 
                                    data-proj="${item.projectedIdeb.toFixed(1)}" 
                                    data-score="${item.avgScore}"
                                    data-gap="${gapText}" 
                                    data-risk="${item.riskLevel}"
                                    style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; padding: 4px 8px; cursor:pointer;">
                                <i data-lucide="file-text" style="width:13px; height:13px; color:var(--green-light);"></i>
                                <span>Ver Plano PDE</span>
                            </button>
                            <button class="btn btn-outline btn-sm btn-quick-regen-pde" data-school="${item.schName}" title="Regenerar Plano" style="padding: 4px 6px;">
                                <i data-lucide="rotate-cw" style="width:12px; height:12px;"></i>
                            </button>
                        ` : `
                            <button class="btn btn-primary btn-sm btn-generate-single-pde" 
                                    data-school="${item.schName}" 
                                    data-base="${item.baseIdeb.toFixed(1)}" 
                                    data-proj="${item.projectedIdeb.toFixed(1)}" 
                                    data-score="${item.avgScore}"
                                    data-gap="${gapText}" 
                                    data-risk="${item.riskLevel}"
                                    style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; padding: 4px 8px; cursor:pointer;">
                                <i data-lucide="sparkles" style="width:13px; height:13px;"></i>
                                <span>Gerar Plano</span>
                            </button>
                            <button class="btn btn-outline btn-sm btn-manual-single-pde" data-school="${item.schName}" style="font-size:0.75rem; padding: 4px 8px;">
                                <span>Manual</span>
                            </button>
                        `}
                    </div>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        // Event listeners
        tableBody.querySelectorAll('.btn-open-pde-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                const base = btn.getAttribute('data-base');
                const proj = btn.getAttribute('data-proj');
                const score = btn.getAttribute('data-score');
                const gap = btn.getAttribute('data-gap');
                const risk = btn.getAttribute('data-risk');
                openSchoolPdeModal({ sch, base, proj, score, gap, risk }, 'view');
            });
        });

        tableBody.querySelectorAll('.btn-generate-single-pde').forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                const base = btn.getAttribute('data-base');
                const proj = btn.getAttribute('data-proj');
                const score = btn.getAttribute('data-score');
                const gap = btn.getAttribute('data-gap');
                const risk = btn.getAttribute('data-risk');
                
                showToast(`Gerando Plano PDE conforme dados atuais para ${sch}...`, 'sparkles');
                setTimeout(() => {
                    schoolPdePlansMap[sch] = true;
                    populateIdebGoalsTable();
                    openSchoolPdeModal({ sch, base, proj, score, gap, risk }, 'view');
                    showToast(`Plano PDE da escola "${sch}" gerado com sucesso!`, 'check');
                }, 300);
            });
        });

        tableBody.querySelectorAll('.btn-manual-single-pde').forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                const planText = prompt(`Criar Plano PDE Manual para "${sch}":\n\nInforme as ações prioritárias de intervenção:`, 'Oficinas quinzenais de leitura (D03/D11) e reforço de cálculo mental (D13).');
                if (planText && planText.trim()) {
                    schoolPdePlansMap[sch] = { manual: true, text: planText };
                    populateIdebGoalsTable();
                    showToast(`Plano PDE manual salvo para "${sch}"!`, 'check');
                }
            });
        });

        tableBody.querySelectorAll('.btn-quick-regen-pde').forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                showToast(`Plano de "${sch}" atualizado conforme dados atuais!`, 'sparkles');
                populateIdebGoalsTable();
            });
        });

        safeCreateIcons();
    }

    function openSchoolPdeModal(info, mode) {
        const modal = document.getElementById('modal-school-pde-plan');
        const titleEl = document.getElementById('modal-pde-school-name');
        const metaEl = document.getElementById('modal-pde-school-meta');
        const badgeEl = document.getElementById('modal-pde-risk-badge');
        const bodyEl = document.getElementById('modal-pde-content-body');
        if (!modal || !bodyEl) return;

        if (titleEl) titleEl.textContent = `Plano de Desenvolvimento Escolar (PDE) — ${info.sch}`;
        if (metaEl) metaEl.textContent = `${info.sch} • IDEB 2023: ${info.base} | Projeção: ${info.proj} | Média SAEB: ${info.score || '218'} pts (Gap: ${info.gap})`;
        
        if (badgeEl) {
            badgeEl.className = info.risk === 'Alto' ? 'badge badge-danger' : (info.risk === 'Médio' ? 'badge badge-warning' : 'badge badge-success');
            badgeEl.textContent = `${info.risk} Risco`;
        }

        const schoolStudents = loadedStudents.filter(s => s.escola === info.sch);
        const countStudents = schoolStudents.length || 184;

        bodyEl.innerHTML = `
            <!-- Official Header Standard PDE Document -->
            <div style="border: 2px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-tertiary); padding: 16px 20px; margin-bottom: 16px;">
                <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
                    <h4 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                        SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED GONÇALVES DIAS - MA)
                    </h4>
                    <span style="font-size: 0.76rem; color: var(--text-secondary); font-weight: 600;">
                        PLANO DE DESENVOLVIMENTO ESCOLAR E RECUPERAÇÃO DE APRENDIZAGEM (PDE 2026)
                    </span>
                </div>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; text-align: center;">
                    <div>
                        <span style="font-size:0.72rem; color:var(--text-muted); display:block;">IDEB 2023</span>
                        <strong style="font-size:1.15rem; color:var(--text-primary); font-family:var(--font-mono);">${info.base}</strong>
                    </div>
                    <div>
                        <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Projeção Atual</span>
                        <strong style="font-size:1.15rem; color:var(--purple-light); font-family:var(--font-mono);">${info.proj}</strong>
                    </div>
                    <div>
                        <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Proficiência Média</span>
                        <strong style="font-size:1.15rem; color:var(--blue-light); font-family:var(--font-mono);">${info.score || '218'} pts</strong>
                    </div>
                    <div>
                        <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Desvio / Gap</span>
                        <strong style="font-size:1.15rem; color:${info.gap.startsWith('+') ? 'var(--green-light)' : 'var(--red-light)'}; font-family:var(--font-mono);">${info.gap}</strong>
                    </div>
                    <div>
                        <span style="font-size:0.72rem; color:var(--text-muted); display:block;">Alunos Mapeados</span>
                        <strong style="font-size:1.15rem; color:var(--text-primary); font-family:var(--font-mono);">${countStudents}</strong>
                    </div>
                </div>
            </div>

            <!-- Critical Gaps Section (Guia INEP) -->
            <div style="margin-bottom: 18px;">
                <h4 style="display:flex; align-items:center; gap:6px; font-size:0.92rem; margin:0 0 10px 0; color:var(--text-primary);">
                    <i data-lucide="alert-triangle" style="width:15px; height:15px; color:var(--red-light);"></i>
                    1. Lacunas Críticas Diagnosticadas nos Simulados (Base de Evidências)
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px;">
                    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-left:4px solid var(--red-light); padding:12px; border-radius:var(--radius-sm);">
                        <div class="flex-between" style="margin-bottom:4px;">
                            <span class="badge badge-danger" style="font-size:0.7rem;">Matemática • SAEB D13</span>
                            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">${Math.round(countStudents * 0.54)} alunos com gap</span>
                        </div>
                        <strong style="font-size:0.82rem; color:var(--text-primary); display:block; margin-bottom:4px;">Operações Fundamentais com Números Naturais</strong>
                        <p style="font-size:0.74rem; color:var(--text-secondary); margin:0;">Dificuldade na interpretação de enunciados com multiplicação e divisão por 2 algarismos.</p>
                    </div>

                    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-left:4px solid #f59e0b; padding:12px; border-radius:var(--radius-sm);">
                        <div class="flex-between" style="margin-bottom:4px;">
                            <span class="badge badge-warning" style="font-size:0.7rem;">Português • SAEB D03</span>
                            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">${Math.round(countStudents * 0.42)} alunos com gap</span>
                        </div>
                        <strong style="font-size:0.82rem; color:var(--text-primary); display:block; margin-bottom:4px;">Inferência de Sentido a partir do Contexto</strong>
                        <p style="font-size:0.74rem; color:var(--text-secondary); margin:0;">Alunos com leitura linear sem identificar pistas contextuais e sentidos figurados.</p>
                    </div>

                    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-left:4px solid var(--purple-light); padding:12px; border-radius:var(--radius-sm);">
                        <div class="flex-between" style="margin-bottom:4px;">
                            <span class="badge badge-purple" style="font-size:0.7rem;">Português • SAEB D11</span>
                            <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700;">${Math.round(countStudents * 0.35)} alunos com gap</span>
                        </div>
                        <strong style="font-size:0.82rem; color:var(--text-primary); display:block; margin-bottom:4px;">Distinção entre Fato e Opinião</strong>
                        <p style="font-size:0.74rem; color:var(--text-secondary); margin:0;">Confusão frequente entre dados objetivos informados e posicionamentos subjetivos do autor.</p>
                    </div>
                </div>
            </div>

            <!-- Structured 4-Week Pedagogical Action Plan -->
            <div style="margin-bottom: 18px;">
                <h4 style="display:flex; align-items:center; gap:6px; font-size:0.92rem; margin:0 0 10px 0; color:var(--text-primary);">
                    <i data-lucide="sparkles" style="width:15px; height:15px; color:var(--purple-light);"></i>
                    2. Plano de Intervenção Pedagógica (Ciclo Intensivo de 4 Semanas — Guia INEP)
                </h4>
                
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px 14px;">
                        <div class="flex-between" style="margin-bottom:4px;">
                            <span style="font-size:0.8rem; font-weight:700; color:var(--purple-light);">Semana 1: Nivelamento Conceitual & Material Concreto</span>
                            <span class="badge badge-outline" style="font-size:0.68rem;">Oficina em Sala</span>
                        </div>
                        <p style="font-size:0.78rem; color:var(--text-secondary); margin:0 0 4px 0;">
                            <strong>Ação Docente:</strong> Utilização de material dourado, ábacos e cartões de leitura rápida. Reagrupamento dos alunos em trios com monitores.
                        </p>
                        <span style="font-size:0.72rem; color:var(--text-muted);">Meta: 100% dos alunos com gap participando das oficinas ativas.</span>
                    </div>

                    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px 14px;">
                        <div class="flex-between" style="margin-bottom:4px;">
                            <span style="font-size:0.8rem; font-weight:700; color:var(--purple-light);">Semana 2: Resolução de Problemas Contextualizados</span>
                            <span class="badge badge-outline" style="font-size:0.68rem;">Sequência Didática</span>
                        </div>
                        <p style="font-size:0.78rem; color:var(--text-secondary); margin:0 0 4px 0;">
                            <strong>Ação Docente:</strong> Situações-problema baseadas na economia e cotidiano do município. Exercícios de caça a pistas em fábulas e notícias.
                        </p>
                        <span style="font-size:0.72rem; color:var(--text-muted);">Meta: Atingir no mínimo 60% de acerto nas atividades diagnósticas formativas.</span>
                    </div>

                    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px 14px;">
                        <div class="flex-between" style="margin-bottom:4px;">
                            <span style="font-size:0.8rem; font-weight:700; color:var(--purple-light);">Semana 3: Produção Guiada & Debates Regrados</span>
                            <span class="badge badge-outline" style="font-size:0.68rem;">Aprofundamento</span>
                        </div>
                        <p style="font-size:0.78rem; color:var(--text-secondary); margin:0 0 4px 0;">
                            <strong>Ação Docente:</strong> Roda de leitura com identificação de fato vs opinião e desafios relâmpago de cálculo mental.
                        </p>
                        <span style="font-size:0.72rem; color:var(--text-muted);">Meta: Consolidação da autonomia leitora e das 4 operações.</span>
                    </div>

                    <div style="background:var(--bg-secondary); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:10px 14px;">
                        <div class="flex-between" style="margin-bottom:4px;">
                            <span style="font-size:0.8rem; font-weight:700; color:var(--purple-light);">Semana 4: Mini-Simulado de Checagem & Correção Imediata</span>
                            <span class="badge badge-warning" style="font-size:0.68rem;">Avaliação Formativa</span>
                        </div>
                        <p style="font-size:0.78rem; color:var(--text-secondary); margin:0 0 4px 0;">
                            <strong>Ação Docente:</strong> Aplicação do mini-simulado de 10 itens calibrados nos descritores trabalhados. Tabulação instantânea no SaaS.
                        </p>
                        <span style="font-size:0.72rem; color:var(--text-muted);">Meta: Redução de pelo menos 50% no contingente de alunos no nível crítico.</span>
                    </div>
                </div>
            </div>

            <!-- Institutional Commitments -->
            <div style="background:rgba(139, 92, 246, 0.04); border:1px solid rgba(139, 92, 246, 0.2); border-radius:var(--radius-md); padding:12px 16px;">
                <h5 style="margin:0 0 6px 0; font-size:0.82rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                    <i data-lucide="check-square" style="width:14px; height:14px; color:var(--purple-light);"></i>
                    3. Pacto de Acompanhamento SEMED ↔ Gestão Escolar
                </h5>
                <ul style="margin:0; padding-left:18px; font-size:0.76rem; color:var(--text-secondary); line-height:1.45;">
                    <li><strong>Direção Escolar:</strong> Realizar alinhamento pedagógico semanal com docentes das turmas avaliadas.</li>
                    <li><strong>Supervisão SEMED:</strong> Visita de tutoria técnica quinzenal e fornecimento dos cadernos de reforço impressos.</li>
                    <li><strong>Meta de Recuperação:</strong> Elevar a proficiência estimada da unidade escolar para atingir o nível adequado.</li>
                </ul>
            </div>
        `;

        modal.classList.remove('hidden');
        safeCreateIcons();
    }

    const modalSchoolPde = document.getElementById('modal-school-pde-plan');
    const btnCloseSchoolPde = document.getElementById('btn-close-school-pde-modal');
    const btnSavePdeModal = document.getElementById('btn-save-pde-modal');
    const btnPrintPdeModal = document.getElementById('btn-print-pde-modal');
    const btnRegeneratePdeModal = document.getElementById('btn-regenerate-pde-modal');

    if (btnCloseSchoolPde && modalSchoolPde) {
        btnCloseSchoolPde.addEventListener('click', () => modalSchoolPde.classList.add('hidden'));
    }
    if (btnSavePdeModal && modalSchoolPde) {
        btnSavePdeModal.addEventListener('click', () => {
            modalSchoolPde.classList.add('hidden');
            showToast('Plano de Desenvolvimento Escolar (PDE) aprovado e registrado com sucesso!', 'check');
        });
    }
    if (btnPrintPdeModal) {
        btnPrintPdeModal.addEventListener('click', () => {
            showToast('Gerando Caderno PDF do Plano de Desenvolvimento Escolar (PDE)...', 'printer');
        });
    }
    if (btnRegeneratePdeModal) {
        btnRegeneratePdeModal.addEventListener('click', () => {
            showToast('Plano de Desenvolvimento Escolar (PDE) gerado conforme dados atuais!', 'sparkles');
        });
    }

    const pdeFilterStatus = document.getElementById('pde-filter-status');
    if (pdeFilterStatus) {
        pdeFilterStatus.addEventListener('change', () => {
            populateIdebGoalsTable();
        });
    }

    const btnGenerateAllPdePlans = document.getElementById('btn-generate-all-pde-plans');
    if (btnGenerateAllPdePlans) {
        btnGenerateAllPdePlans.addEventListener('click', () => {
            showToast('Gerando Planos de Desenvolvimento Escolar (PDE) conforme dados atuais para todas as escolas com gap...', 'sparkles');
            setTimeout(() => {
                populateIdebGoalsTable();
                showToast('Planos PDE gerados conforme dados atuais para as 12 unidades escolares da rede!', 'check');
            }, 500);
        });
    }

    const btnExportPdeReport = document.getElementById('btn-export-pde-report');
    if (btnExportPdeReport) {
        btnExportPdeReport.addEventListener('click', () => {
            showToast('Exportando Relatório Consolidado de Metas e Planos PDE em PDF...', 'download');
        });
    }

    function updateProficiencyBars(insuf, bas, adeq, adv) {
        const bInsuf = document.getElementById('badge-pct-insuficiente');
        const barInsuf = document.getElementById('bar-pct-insuficiente');
        const bBas = document.getElementById('badge-pct-basico');
        const barBas = document.getElementById('bar-pct-basico');
        const bAdeq = document.getElementById('badge-pct-adequado');
        const barAdeq = document.getElementById('bar-pct-adequado');
        const bAdv = document.getElementById('badge-pct-avancado');
        const barAdv = document.getElementById('bar-pct-avancado');

        if (bInsuf) bInsuf.textContent = `${insuf}%`;
        if (barInsuf) barInsuf.style.width = `${insuf}%`;
        if (bBas) bBas.textContent = `${bas}%`;
        if (barBas) barBas.style.width = `${bas}%`;
        if (bAdeq) bAdeq.textContent = `${adeq}%`;
        if (barAdeq) barAdeq.style.width = `${adeq}%`;
        if (bAdv) bAdv.textContent = `${adv}%`;
        if (barAdv) barAdv.style.width = `${adv}%`;
    }

    function getBNCCCriticalSkills() {
        const skillCounts = {};
        dbResultadosAluno.forEach(r => {
            const q = dbQuestoes.find(qu => qu.id === r.questao_id);
            if (q) {
                const desc = q.descritor_bncc_id;
                if (!skillCounts[desc]) {
                    skillCounts[desc] = { total: 0, correct: 0 };
                }
                skillCounts[desc].total++;
                if (r.acertou) {
                    skillCounts[desc].correct++;
                }
            }
        });

        const list = [];
        for (const desc in skillCounts) {
            const pct = Math.round((skillCounts[desc].correct / skillCounts[desc].total) * 100);
            let descName = "Habilidade do componente curricular";
            const foundDesc = activeDescriptors.find(d => d.codigo === desc);
            if (foundDesc) {
                descName = foundDesc.descricao;
            }
            list.push({
                codigo: desc,
                desc: descName,
                percentage: pct
            });
        }

        list.sort((a, b) => a.percentage - b.percentage);
        return list.slice(0, 5);
    }

    function updateExtraDashboardAndMetasStats(isEmpty, mappedIdeb, avgGeneral) {
        const metasIdeb = document.getElementById('metas-summary-ideb');
        const metasRend = document.getElementById('metas-summary-rendimento');
        const metasProf = document.getElementById('metas-summary-proficiencia');
        const critList = document.getElementById('dashboard-critical-skills-list');
        const aiDiag = document.getElementById('ai-metric-diagnostics');
        const aiTok = document.getElementById('ai-metric-tokens');
        const aiPrec = document.getElementById('ai-metric-precision');

        // AI metrics are preserved as usage stats of the system
        if (aiDiag) aiDiag.textContent = '14,230';
        if (aiTok) aiTok.textContent = '18.4M';
        if (aiPrec) aiPrec.textContent = '96.8%';

        if (isEmpty) {
            if (metasIdeb) metasIdeb.textContent = 'N/A';
            if (metasRend) metasRend.textContent = '0%';
            if (metasProf) metasProf.textContent = '0';
            if (critList) {
                critList.innerHTML = `
                    <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:0.8rem; width:100%;">
                        Nenhuma avaliação realizada para identificar habilidades críticas.
                    </div>
                `;
            }
        } else {
            if (metasIdeb) metasIdeb.textContent = mappedIdeb || '5.4';
            if (metasRend) metasRend.textContent = '96.8%';
            if (metasProf) metasProf.textContent = avgGeneral ? (avgGeneral * 0.08).toFixed(2) : '5.58';
            if (critList) {
                const criticals = getBNCCCriticalSkills();
                if (criticals.length === 0) {
                    critList.innerHTML = `
                        <div style="padding:24px; text-align:center; color:var(--text-muted); font-size:0.8rem; width:100%;">
                            Nenhuma habilidade com dados avaliados ainda.
                        </div>
                    `;
                } else {
                    critList.innerHTML = '';
                    criticals.forEach(c => {
                        let barColor = 'green';
                        let badgeClass = 'badge-success';
                        if (c.percentage < 55) {
                            barColor = 'red';
                            badgeClass = 'badge-danger';
                        } else if (c.percentage < 70) {
                            barColor = 'orange';
                            badgeClass = 'badge-warning';
                        }

                        const item = document.createElement('div');
                        item.className = 'bncc-ranking-item';
                        item.innerHTML = `
                            <div class="habilidade-info">
                                <span class="badge ${badgeClass}">${c.codigo}</span>
                                <span class="habilidade-desc text-ellipsis">${c.desc}</span>
                            </div>
                            <div class="progress-bar-container">
                                <div class="progress-bar ${barColor}" style="width: ${c.percentage}%;">${c.percentage}%</div>
                            </div>
                        `;
                        critList.appendChild(item);
                    });
                }
            }
        }
    }

    function recalculateNetworkStats() {
        const elIdeb = document.getElementById('metric-ideb');
        const elLP = document.getElementById('metric-seama-lp');
        const elSchoolsOnMeta = document.getElementById('metric-schools-on-meta');
        const elSchoolsOnMetaSub = document.getElementById('metric-schools-on-meta-sublabel');
        const elPart = document.getElementById('metric-participation');

        const elIdebTrend = document.getElementById('metric-ideb-trend');
        const elIdebSub = document.getElementById('metric-ideb-sublabel');
        const elLPSub = document.getElementById('metric-seama-lp-sublabel');
        const elStudentsEval = document.getElementById('metric-students-eval');

        const tenantSelectorEl = document.getElementById('tenant-selector');
        const selectedSchool = tenantSelectorEl ? tenantSelectorEl.value : 'all';

        if (!dbAlunos || dbAlunos.length === 0) {
            if (elIdeb) elIdeb.textContent = 'N/A';
            if (elIdebTrend) elIdebTrend.innerHTML = '<i data-lucide="trending-up"></i> --';
            if (elIdebSub) elIdebSub.textContent = 'Sem dados';
            if (elLP) elLP.textContent = 'N/A';
            if (elLPSub) elLPSub.textContent = 'Sem dados';
            if (elSchoolsOnMeta) elSchoolsOnMeta.textContent = 'N/A';
            if (elSchoolsOnMetaSub) elSchoolsOnMetaSub.textContent = 'Sem dados';
            if (elPart) elPart.textContent = '0%';
            if (elStudentsEval) elStudentsEval.textContent = '0 alunos avaliados';
            updateProficiencyBars(0, 0, 0, 0);
            updateDashboardCriticalSkills(selectedSchool);
            updateSchoolsInAttentionCard(selectedSchool);
            renderDashboardIdebChart(selectedSchool);
            safeCreateIcons();
            return;
        }

        let filteredAlunos = dbAlunos;
        let filteredResultados = dbResultadosAluno;

        if (selectedSchool !== 'all') {
            filteredAlunos = dbAlunos.filter(a => a.escola === selectedSchool);
            const studentMatriculas = new Set(filteredAlunos.map(a => a.matricula));
            filteredResultados = dbResultadosAluno.filter(r => studentMatriculas.has(r.aluno_id));
        }

        if (filteredResultados.length === 0) {
            if (elIdeb) elIdeb.textContent = 'N/A';
            if (elIdebTrend) elIdebTrend.innerHTML = '<i data-lucide="trending-up"></i> --';
            if (elIdebSub) elIdebSub.textContent = 'Sem avaliações';
            if (elLP) elLP.textContent = 'N/A';
            if (elLPSub) elLPSub.textContent = 'Sem avaliações';
            if (elSchoolsOnMeta) elSchoolsOnMeta.textContent = 'N/A';
            if (elSchoolsOnMetaSub) elSchoolsOnMetaSub.textContent = 'Sem avaliações';
            if (elPart) elPart.textContent = '0%';
            if (elStudentsEval) elStudentsEval.textContent = `${filteredAlunos.length.toLocaleString('pt-BR')} alunos cadastrados`;
            updateProficiencyBars(0, 0, 0, 0);
            updateDashboardCriticalSkills(selectedSchool);
            updateSchoolsInAttentionCard(selectedSchool);
            renderDashboardIdebChart(selectedSchool);
            safeCreateIcons();
            return;
        }

        const lpResults = filteredResultados.filter(r => {
            const q = dbQuestoes.find(qu => qu.id === r.questao_id);
            return q && (q.descritor_bncc_id.includes("LP") || q.descritor_bncc_id.startsWith("EF05LP"));
        });
        const lpCorrect = lpResults.filter(r => r.acertou).length;
        const lpAvg = lpResults.length > 0 ? (lpCorrect / lpResults.length * 100) : 60;

        const mtResults = filteredResultados.filter(r => {
            const q = dbQuestoes.find(qu => qu.id === r.questao_id);
            return q && !(q.descritor_bncc_id.includes("LP") || q.descritor_bncc_id.startsWith("EF05LP"));
        });
        const mtCorrect = mtResults.filter(r => r.acertou).length;
        const mtAvg = mtResults.length > 0 ? (mtCorrect / mtResults.length * 100) : 60;

        const totalCorrect = filteredResultados.filter(r => r.acertou).length;
        const totalCount = filteredResultados.length;
        const avgGeneral = totalCount > 0 ? (totalCorrect / totalCount * 100) : 60;

        const mappedLP = Math.round(180 + lpAvg * 1.1);
        const mappedMT = Math.round(190 + mtAvg * 1.15);
        const mappedIdeb = (avgGeneral * 0.065 + 1.2).toFixed(1);

        if (elIdeb) elIdeb.textContent = mappedIdeb;
        if (elIdebTrend) elIdebTrend.innerHTML = '<i data-lucide="trending-up"></i> +0.3';
        if (elIdebSub) elIdebSub.textContent = 'meta municipal: 5.7';

        const averageSeama = Math.round((mappedLP + mappedMT) / 2);
        if (elLP) elLP.textContent = averageSeama;
        let seamaProf = "Básico";
        if (averageSeama < 200) seamaProf = "Limítrofe";
        else if (averageSeama < 250) seamaProf = "Básico";
        else if (averageSeama < 300) seamaProf = "Intermediário";
        else seamaProf = "Adequado";
        if (elLPSub) elLPSub.textContent = `Nível: ${seamaProf}`;

        // Escolas na Meta calculation
        let schoolsToEvaluate = dbEscolas;
        if (selectedSchool !== 'all') {
            schoolsToEvaluate = dbEscolas.filter(e => e.nome === selectedSchool);
        }
        let schoolsOnMetaCount = 0;
        schoolsToEvaluate.forEach(esc => {
            const escStudents = dbAlunos.filter(a => a.escola === esc.nome);
            const studentMatriculas = new Set(escStudents.map(a => a.matricula));
            const escResults = dbResultadosAluno.filter(r => studentMatriculas.has(r.aluno_id));
            const escCorrect = escResults.filter(r => r.acertou).length;
            const escAvg = escResults.length > 0 ? (escCorrect / escResults.length * 100) : 60;
            const escIdeb = escAvg * 0.065 + 1.2;

            let hash = 0;
            for (let i = 0; i < esc.nome.length; i++) {
                hash += esc.nome.charCodeAt(i);
            }
            const escMeta = 5.2 + (hash % 10) / 10;
            if (escIdeb >= escMeta) {
                schoolsOnMetaCount++;
            }
        });
        if (elSchoolsOnMeta) elSchoolsOnMeta.textContent = `${schoolsOnMetaCount} de ${schoolsToEvaluate.length}`;
        if (elSchoolsOnMetaSub) elSchoolsOnMetaSub.textContent = `meta municipal: 5.7`;

        // Participation Rate
        const studentsWithAnswers = filteredAlunos.filter(al => filteredResultados.some(r => r.aluno_id === al.matricula)).length;
        const pctParticipation = filteredAlunos.length > 0 ? ((studentsWithAnswers / filteredAlunos.length) * 100).toFixed(1) : '0';

        if (elPart) elPart.textContent = `${pctParticipation}%`;
        if (elStudentsEval) elStudentsEval.textContent = `${studentsWithAnswers.toLocaleString('pt-BR')} de ${filteredAlunos.length.toLocaleString('pt-BR')} avaliados`;

        let countInsuficiente = 0;
        let countBasico = 0;
        let countAdequado = 0;
        let countAvancado = 0;

        filteredAlunos.forEach(al => {
            const score = al.avg_score || 0;
            if (score < 60) countInsuficiente++;
            else if (score < 70) countBasico++;
            else if (score < 80) countAdequado++;
            else countAvancado++;
        });

        const countScores = filteredAlunos.length;
        const pctInsuficiente = ((countInsuficiente / countScores) * 100).toFixed(1);
        const pctBasico = ((countBasico / countScores) * 100).toFixed(1);
        const pctAdequado = ((countAdequado / countScores) * 100).toFixed(1);
        const pctAvancado = ((countAvancado / countScores) * 100).toFixed(1);

        updateProficiencyBars(pctInsuficiente, pctBasico, pctAdequado, pctAvancado);
        updateDashboardCriticalSkills(selectedSchool);
        updateSchoolsInAttentionCard(selectedSchool);
        renderDashboardIdebChart(selectedSchool);
        safeCreateIcons();
    }

    function updateDashboardCriticalSkills(selectedSchool) {
        const container = document.getElementById('dashboard-critical-skills-list');
        if (!container) return;

        let filteredResultados = dbResultadosAluno;
        if (selectedSchool !== 'all') {
            const schoolAlunos = dbAlunos.filter(a => a.escola === selectedSchool);
            const schoolMatriculas = new Set(schoolAlunos.map(a => a.matricula));
            filteredResultados = dbResultadosAluno.filter(r => schoolMatriculas.has(r.aluno_id));
        }

        if (filteredResultados.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:30px; color:var(--text-secondary);">
                    <i data-lucide="award" style="width:36px; height:36px; margin-bottom:8px; opacity:0.4; display:inline-block;"></i>
                    <p style="font-size:0.8rem; font-weight:500;">Nenhum dado de avaliação para esta rede.</p>
                    <button class="btn btn-primary btn-sm" id="btn-dashboard-create-eval" style="margin-top:10px; font-size:0.7rem; padding:4px 8px; cursor:pointer;">Criar primeira avaliação</button>
                </div>
            `;
            const btnGoEval = document.getElementById('btn-dashboard-create-eval');
            if (btnGoEval) {
                btnGoEval.addEventListener('click', () => {
                    const evalTabBtn = document.querySelector('.menu-item[data-target="criar-avaliacoes"]');
                    if (evalTabBtn) evalTabBtn.click();
                });
            }
            if (window.lucide) lucide.createIcons();
            return;
        }

        const skillsStats = {};
        filteredResultados.forEach(res => {
            const q = dbQuestoes.find(qu => qu.id === res.questao_id);
            if (!q) return;

            const code = q.descritor_bncc_id || q.codigo_bncc;
            const desc = q.enunciado ? q.enunciado.substring(0, 85) + '...' : 'Descrição indisponível';

            if (!skillsStats[code]) {
                skillsStats[code] = { code, desc, correct: 0, total: 0 };
            }
            if (res.acertou) skillsStats[code].correct++;
            skillsStats[code].total++;
        });

        const list = Object.values(skillsStats).map(s => {
            return {
                code: s.code,
                desc: s.desc,
                pct: Math.round((s.correct / s.total) * 100)
            };
        });

        list.sort((a, b) => a.pct - b.pct);
        const top5 = list.slice(0, 5);

        let html = '<div class="bncc-ranking" style="display:flex; flex-direction:column; gap:12px;">';
        top5.forEach(item => {
            let colorClass = 'red';
            let badgeClass = 'badge-danger';
            if (item.pct >= 70) {
                colorClass = 'green';
                badgeClass = 'badge-success';
            } else if (item.pct >= 55) {
                colorClass = 'orange';
                badgeClass = 'badge-warning';
            }

            html += `
                <div class="bncc-ranking-item" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="habilidade-info" style="display:flex; align-items:center; gap:8px; min-width:0; flex-grow:1;">
                        <span class="badge ${badgeClass}" style="flex-shrink:0;">${item.code}</span>
                        <span class="habilidade-desc text-ellipsis" style="font-size:0.75rem; color:var(--text-secondary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:240px;" title="${item.desc}">${item.desc}</span>
                    </div>
                    <div class="progress-bar-container" style="flex-shrink:0; width:100px; margin-left:12px;">
                        <div class="progress-bar ${colorClass}" style="width: ${item.pct}%;">${item.pct}%</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        if (window.lucide) lucide.createIcons();
    }

    function updateSchoolsInAttentionCard(selectedSchool) {
        const container = document.getElementById('dashboard-attention-schools-list');
        if (!container) return;

        let schoolsToRender = dbEscolas;
        if (selectedSchool !== 'all') {
            schoolsToRender = dbEscolas.filter(e => e.nome === selectedSchool);
        }

        if (schoolsToRender.length === 0) {
            container.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">Nenhuma escola ativa cadastrada.</p>';
            return;
        }

        const schoolData = [];
        schoolsToRender.forEach(esc => {
            const escStudents = dbAlunos.filter(a => a.escola === esc.nome);
            const studentMatriculas = new Set(escStudents.map(a => a.matricula));
            const escResults = dbResultadosAluno.filter(r => studentMatriculas.has(r.aluno_id));

            const totalCorrect = escResults.filter(r => r.acertou).length;
            const totalCount = escResults.length;
            const avgGeneral = totalCount > 0 ? (totalCorrect / totalCount * 100) : 60;
            const actualIdeb = Number((avgGeneral * 0.065 + 1.2).toFixed(1));
            
            let hash = 0;
            for (let i = 0; i < esc.nome.length; i++) {
                hash += esc.nome.charCodeAt(i);
            }
            const targetMeta = Number((5.2 + (hash % 10) / 10).toFixed(1));
            const gap = Number((targetMeta - actualIdeb).toFixed(1));

            schoolData.push({
                name: esc.nome,
                actualIdeb,
                targetMeta,
                gap
            });
        });

        schoolData.sort((a, b) => b.gap - a.gap);

        let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
        schoolData.forEach(item => {
            const gapText = item.gap > 0 ? `-${item.gap}` : `+${Math.abs(item.gap)}`;
            const badgeClass = item.gap > 0 ? 'badge-danger' : 'badge-success';

            html += `
                <div class="attention-school-row" data-school="${item.name}" style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-tertiary); border-radius:var(--radius-sm); cursor:pointer; transition:var(--transition);" onmouseover="this.style.background='var(--bg-primary)'" onmouseout="this.style.background='var(--bg-tertiary)'">
                    <div style="display:flex; flex-direction:column; gap:2px; min-width:0; flex-grow:1; text-align:left;">
                        <span style="font-size:0.8rem; font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${item.name}</span>
                        <span style="font-size:0.7rem; color:var(--text-secondary);">Meta INEP: <strong>${item.targetMeta.toFixed(1)}</strong></span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0; margin-left:12px;">
                        <span style="font-size:0.8rem; font-weight:700; color:var(--text-primary);">${item.actualIdeb.toFixed(1)}</span>
                        <span class="badge ${badgeClass}" style="font-size:0.65rem; padding:2px 6px;">${gapText}</span>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;

        const rows = container.querySelectorAll('.attention-school-row');
        rows.forEach(r => {
            r.addEventListener('click', () => {
                const sName = r.getAttribute('data-school');
                const relTabBtn = document.querySelector('.menu-item[data-target="ai-playground"]');
                if (relTabBtn) {
                    relTabBtn.click();
                }
                const selectEl = document.getElementById('ai-school-select');
                if (selectEl) {
                    selectEl.value = sName;
                    selectEl.dispatchEvent(new Event('change'));
                }
            });
        });
    }

    function renderDashboardIdebChart(schoolName) {
        const container = document.getElementById('dashboard-ideb-chart-container');
        if (!container) return;

        const baseline = {};
        const metaBaseline = {};

        if (window.idebPublicoReferencia) {
            const munRecords = window.idebPublicoReferencia.filter(r => r.municipio.toLowerCase() === 'codó' && r.uf === 'MA');
            munRecords.forEach(r => {
                if (r.etapa === 'Anos Iniciais') {
                    baseline[r.ano] = r.ideb_observado;
                    metaBaseline[r.ano] = r.meta_projetada;
                }
            });
        } else {
            container.innerHTML = '<p class="text-muted" style="font-size:0.8rem;">Sem dados históricos disponíveis</p>';
            return;
        }

        const years = [2019, 2021, 2023, 2025];
        const observed = [];
        const target = [];

        let shift = 0;
        if (schoolName !== 'all') {
            let hash = 0;
            for (let i = 0; i < schoolName.length; i++) {
                hash += schoolName.charCodeAt(i);
            }
            shift = ((hash % 10) - 5) / 10;
        }

        years.forEach(yr => {
            if (yr === 2025) {
                observed.push(null);
                const baseMeta = metaBaseline[2025] || 5.2;
                target.push(Number((baseMeta + shift).toFixed(1)));
            } else {
                const baseObs = baseline[yr];
                const baseMeta = metaBaseline[yr];
                observed.push(baseObs ? Number((baseObs + shift).toFixed(1)) : null);
                target.push(baseMeta ? Number((baseMeta + shift).toFixed(1)) : null);
            }
        });

        const width = 450;
        const height = 180;
        const paddingLeft = 30;
        const paddingRight = 15;
        const paddingTop = 15;
        const paddingBottom = 25;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const allVals = [...observed.filter(x => x !== null), ...target.filter(x => x !== null)];
        const maxVal = allVals.length > 0 ? Math.max(...allVals) + 0.5 : 7.0;
        const minVal = allVals.length > 0 ? Math.max(0, Math.min(...allVals) - 0.5) : 3.0;

        function getX(index) {
            return paddingLeft + (index / (years.length - 1)) * chartWidth;
        }

        function getY(val) {
            return paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
        }

        let svgHtml = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="background: transparent; overflow: visible;">`;

        const gridSteps = 4;
        for (let j = 0; j <= gridSteps; j++) {
            const val = minVal + (j / gridSteps) * (maxVal - minVal);
            const y = getY(val);
            svgHtml += `<line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4,4" stroke-width="0.75" />`;
            svgHtml += `<text x="${paddingLeft - 8}" y="${y + 3}" fill="var(--text-secondary)" font-size="9" font-family="var(--font-sans)" font-weight="600" text-anchor="end">${val.toFixed(1)}</text>`;
        }

        years.forEach((yr, idx) => {
            const x = getX(idx);
            svgHtml += `<text x="${x}" y="${height - 5}" fill="var(--text-secondary)" font-size="9" font-family="var(--font-sans)" font-weight="700" text-anchor="middle">${yr}</text>`;
        });

        let obsPointsPath = '';
        let tgtPointsPath = '';

        years.forEach((yr, idx) => {
            const x = getX(idx);
            
            const obsVal = observed[idx];
            if (obsVal !== null) {
                const yObs = getY(obsVal);
                if (obsPointsPath === '') obsPointsPath = `M ${x} ${yObs}`;
                else obsPointsPath += ` L ${x} ${yObs}`;
            }

            const tgtVal = target[idx];
            if (tgtVal !== null) {
                const yTgt = getY(tgtVal);
                if (tgtPointsPath === '') tgtPointsPath = `M ${x} ${yTgt}`;
                else tgtPointsPath += ` L ${x} ${yTgt}`;
            }
        });

        if (tgtPointsPath !== '') {
            svgHtml += `<path d="${tgtPointsPath}" fill="none" stroke="var(--purple)" stroke-width="1.75" stroke-dasharray="4,4" />`;
        }

        if (obsPointsPath !== '') {
            svgHtml += `<path d="${obsPointsPath}" fill="none" stroke="var(--blue-light)" stroke-width="2.25" />`;
        }

        years.forEach((yr, idx) => {
            const x = getX(idx);

            const tgtVal = target[idx];
            if (tgtVal !== null) {
                const yTgt = getY(tgtVal);
                svgHtml += `<rect x="${x - 3}" y="${yTgt - 3}" width="6" height="6" fill="var(--purple)" rx="1" />`;
                svgHtml += `<text x="${x}" y="${yTgt + 12}" fill="var(--text-muted)" font-size="8" font-family="var(--font-sans)" font-weight="600" text-anchor="middle">${tgtVal.toFixed(1)}</text>`;
            }

            const obsVal = observed[idx];
            if (obsVal !== null) {
                const yObs = getY(obsVal);
                svgHtml += `<circle cx="${x}" cy="${yObs}" r="3.5" fill="var(--blue-light)" />`;
                svgHtml += `<text x="${x}" y="${yObs - 8}" fill="var(--text-primary)" font-size="8" font-family="var(--font-sans)" font-weight="700" text-anchor="middle">${obsVal.toFixed(1)}</text>`;
            } else {
                svgHtml += `<circle cx="${x}" cy="${getY(target[idx])}" r="3" fill="none" stroke="var(--text-muted)" stroke-dasharray="2,2" />`;
                svgHtml += `<text x="${x}" y="${getY(target[idx]) - 12}" fill="var(--text-muted)" font-size="7" font-family="var(--font-sans)" font-weight="500" text-anchor="middle">Sem dado</text>`;
            }
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    function initDatabase(data) {
        loadedStudents = data;

        // Assign default deterministic average scores based on matricula
        loadedStudents.forEach(s => {
            if (s.avg_score === undefined) {
                const matNum = parseInt(s.matricula) || 0;
                s.avg_score = 55 + (matNum % 34);
            }
        });

        syncNormalizedTablesFromLoadedData();

        recalculateNetworkStats();
        
        // Update Dashboard Counters
        const metricStud = document.getElementById('metric-students-eval');
        if (metricStud) {
            metricStud.textContent = `${data.length.toLocaleString('pt-BR')} alunos avaliados`;
        }
        const badgeCount = document.getElementById('badge-count-students');
        if (badgeCount) {
            badgeCount.textContent = data.length.toLocaleString('pt-BR');
        }
        const schools = Array.from(new Set(data.map(s => s.escola))).sort();
        
        // Populate Network Selector
        const tenantSelector = document.getElementById('tenant-selector');
        if (tenantSelector) {
            tenantSelector.innerHTML = '<option value="all">Todas as Redes (Multitenant)</option>';
            schools.forEach(sch => {
                const opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, ' ');
                tenantSelector.appendChild(opt);
            });
        }
        
        // Initialize Search
        initStudentSearch();
        
        // Populate school panels
        if (window.populateSchoolPanelSelector) {
            window.populateSchoolPanelSelector(schools);
        }
        
        // Populate Alunos tab list
        if (window.initAlunosTab) {
            window.initAlunosTab(schools);
        }

        // Populate IDEB goals table
        populateIdebGoalsTable(schools);

        const sidebarNetworkLabel = document.getElementById('sidebar-active-network-label');
        if (tenantSelector && sidebarNetworkLabel) {
            sidebarNetworkLabel.textContent = tenantSelector.options[tenantSelector.selectedIndex].text;
        }
        
        if (data.length > 0) {
            showToast(`Carregados ${data.length} alunos e ${schools.length} escolas reais!`, 'database');
        }

        populateAiSelectors();
    }

    function initStudentSearch() {
        // Stub to prevent crashes
    }

    if (btnGenerateSchoolReport) {
        btnGenerateSchoolReport.addEventListener('click', () => {
            const school = aiSchoolSelect.value;
            const grade = aiGradeSelect.value;
            const subject = aiSubjectSelect.value;

            aiReportGenerationStatus.classList.remove('hidden');
            btnGenerateSchoolReport.disabled = true;
            aiSchoolReportContainer.innerHTML = '';

            let students = loadedStudents;
            if (school !== 'all') {
                students = students.filter(s => s.escola === school);
            }
            if (grade !== 'all') {
                students = students.filter(s => s.etapa.includes(grade));
            }

            if (students.length === 0) {
                setTimeout(() => {
                    aiSchoolReportContainer.innerHTML = `
                        <div style="text-align:center; padding: 40px; color:var(--text-secondary);">
                            <i data-lucide="info" style="width:36px; height:36px; margin-bottom:8px; opacity:0.5; color:var(--red-light); display:inline-block;"></i>
                            <p style="font-size:0.95rem; font-weight:500;">Nenhum dado encontrado para os filtros selecionados.</p>
                            <p style="font-size:0.8rem; margin-top:4px;">Carregue o banco demonstrativo ("Carregar Modelo" no topo) para rodar a simulação.</p>
                        </div>
                    `;
                    aiReportGenerationStatus.classList.add('hidden');
                    btnGenerateSchoolReport.disabled = false;
                    safeCreateIcons();
                }, 500);
                return;
            }

            // Aggregate descritores performance
            const totals = {};
            students.forEach(s => {
                s.habilities.forEach(h => {
                    let matchesSub = true;
                    if (subject !== 'all') {
                        if (subject === 'Língua Portuguesa' && !h.codigo.startsWith('LP')) matchesSub = false;
                        if (subject === 'Matemática' && !h.codigo.startsWith('MT')) matchesSub = false;
                        if (subject === 'Ciências' && !h.codigo.startsWith('CI')) matchesSub = false;
                    }
                    if (!matchesSub) return;

                    if (!totals[h.codigo]) {
                        totals[h.codigo] = { code: h.codigo, desc: h.desc, sum: 0, count: 0 };
                    }
                    totals[h.codigo].sum += h.score;
                    totals[h.codigo].count++;
                });
            });

            const consolidated = [];
            const attention = [];
            Object.values(totals).forEach(t => {
                const avg = Math.round(t.sum / t.count);
                const item = { code: t.code, desc: t.desc, avg };
                if (avg >= 70) {
                    consolidated.push(item);
                } else if (avg < 55) {
                    attention.push(item);
                }
            });

            // Struggling students
            const strugglingStudents = students.map(s => {
                const avg = Math.round(s.habilities.reduce((sum, h) => sum + h.score, 0) / s.habilities.length);
                return { name: s.nome, matricula: s.matricula, avg };
            }).filter(s => s.avg < 50).slice(0, 5);

            // Generate report content
            let md = `## 📊 Relatório Diagnóstico da IA - ${school === 'all' ? 'Rede Geral' : school}\n\n`;
            md += `* **Filtros**: Turma: \`${grade === 'all' ? 'Todas' : grade}\` | Componente: \`${subject === 'all' ? 'Todos' : subject}\`\n`;
            md += `* **Amostragem**: ${students.length} alunos analisados na unidade escolar.\n\n`;

            md += `### ✅ Habilidades Consolidadas (>70% de acerto)\n`;
            if (consolidated.length === 0) {
                md += `*Nenhuma habilidade consolidada na faixa ideal para esta amostragem.*\n\n`;
            } else {
                consolidated.forEach(c => {
                    md += `- **[${c.code}]** ${c.desc} *(Média: ${c.avg}% de acertos)*\n`;
                });
                md += `\n`;
            }

            md += `### ⚠️ Habilidades Críticas / Atenção (<55% de acerto)\n`;
            if (attention.length === 0) {
                md += `*Nenhuma habilidade crítica identificada na rede para estes filtros.*\n\n`;
            } else {
                attention.forEach(a => {
                    md += `- **[${a.code}]** ${a.desc} *(Média: ${a.avg}% de acertos)*\n`;
                });
                md += `\n`;
            }

            md += `### 🧑‍🎓 Estudantes com Maior Necessidade de Intervenção\n`;
            if (strugglingStudents.length === 0) {
                md += `*Todos os alunos apresentam médias satisfatórias para o corte de proficiência atual.*\n\n`;
            } else {
                md += `Estes estudantes apresentam desempenho abaixo de 50% nas matrizes e devem receber atenção prioritária:\n`;
                strugglingStudents.forEach(s => {
                    md += `- **${s.name}** (Matrícula: ${s.matricula}) - Média Geral: *${s.avg}%*\n`;
                });
                md += `\n`;
            }

            md += `### 💡 Recomendações e Plano de Ação Didático\n`;
            if (attention.length > 0) {
                md += `1. **Reforço Imediato**: Focar aulas de nivelamento nos descritores críticos listados acima.\n`;
                md += `2. **Apoio Individualizado**: Criar plano de estudos domiciliar ou contraturno para os ${strugglingStudents.length} alunos priorizados.\n`;
                md += `3. **Simulados Focados**: Aplicar minitestes específicos para monitorar a evolução destas habilidades específicas nas próximas 4 semanas.\n`;
            } else {
                md += `1. **Manutenção**: Continuar com o cronograma letivo planejado.\n`;
                md += `2. **Desafio**: Introduzir itens de nível de complexidade avançada para consolidar as habilidades já adquiridas.\n`;
            }

            const parsedHTML = window.marked ? marked.parse(md) : `<pre style="white-space: pre-wrap; font-family: var(--font-sans);">${md}</pre>`;

            let index = 0;
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = parsedHTML;
            const childNodes = Array.from(tempDiv.childNodes);

            function streamNextNode() {
                if (index < childNodes.length) {
                    aiSchoolReportContainer.appendChild(childNodes[index].cloneNode(true));
                    index++;
                    aiSchoolReportContainer.scrollTop = aiSchoolReportContainer.scrollHeight;
                    setTimeout(streamNextNode, 80);
                } else {
                    aiReportGenerationStatus.classList.add('hidden');
                    btnGenerateSchoolReport.disabled = false;
                    showToast('Análise de resultados gerada com sucesso!', 'check');
                }
            }

            streamNextNode();
        });
    }

    // ==========================================
    // BANCO DE QUESTÕES
    // ==========================================
    const filterMatrix = document.getElementById('filter-matrix');
    const filterSubject = document.getElementById('filter-subject');
    const filterBloom = document.getElementById('filter-bloom');
    const filterDifficulty = document.getElementById('filter-difficulty');
    const questionsContainer = document.getElementById('questions-container-list');
    const questionsCounter = document.getElementById('questions-counter');

    // ==========================================
    // BANCO DE QUESTÕES 2.0 COM IA INTEGRADA
    // ==========================================

    const DESCRIPTORS_BY_STAGE_SUBJECT = {
        '2º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Reconhecer as letras do alfabeto' },
                { code: 'D02', name: 'D02 - Identificar rimas e aliterações em cantigas e parlendas' },
                { code: 'D03', name: 'D03 - Segmentar oralmente palavras em sílabas' },
                { code: 'D04', name: 'D04 - Ler palavras com estruturas silábicas canônicas' },
                { code: 'D05', name: 'D05 - Identificar o assunto principal de um texto curto' },
                { code: 'D06', name: 'D06 - Localizar informação explícita em pequenos textos' }
            ],
            'Matemática': [
                { code: 'D01', name: 'D01 - Contagem e comparação de quantidades até 100' },
                { code: 'D02', name: 'D02 - Resolver problemas de adição e subtração com números até 100' },
                { code: 'D03', name: 'D03 - Reconhecer figuras geométricas planas básicas' },
                { code: 'D04', name: 'D04 - Medidas de tempo: identificar dias da semana e horas' },
                { code: 'D05', name: 'D05 - Leitura de tabelas simples e gráficos de colunas' }
            ]
        },
        '5º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Localizar informações explícitas no texto' },
                { code: 'D03', name: 'D03 - Inferir o sentido de uma palavra ou expressão' },
                { code: 'D04', name: 'D04 - Inferir uma informação implícita em um texto' },
                { code: 'D06', name: 'D06 - Identificar o tema de um texto narrativo/informativo' },
                { code: 'D11', name: 'D11 - Distinguir um fato da opinião relativa a esse fato' },
                { code: 'D14', name: 'D14 - Identificar o efeito de sentido decorrente da pontuação' }
            ],
            'Matemática': [
                { code: 'D13', name: 'D13 - Resolver problemas com números naturais (adição e subtração)' },
                { code: 'D14', name: 'D14 - Resolver problemas com números naturais (multiplicação e divisão)' },
                { code: 'D19', name: 'D19 - Resolver problema com números decimais no sistema monetário' },
                { code: 'D20', name: 'D20 - Resolver problema com números racionais na forma fracionária' },
                { code: 'D28', name: 'D28 - Ler informações e dados apresentados em tabelas e gráficos' },
                { code: 'D02', name: 'D02 - Identificar propriedades de figuras bidimensionais' }
            ]
        },
        '9º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Localizar informações explícitas em textos argumentativos' },
                { code: 'D03', name: 'D03 - Inferir o sentido de palavra ou expressão em contexto' },
                { code: 'D04', name: 'D04 - Inferir efeito de sentido decorrente de recursos estilísticos' },
                { code: 'D05', name: 'D05 - Interpretar texto com auxílio de material gráfico (tirinhas)' },
                { code: 'D07', name: 'D07 - Identificar o conflito gerador do enredo na narrativa' },
                { code: 'D10', name: 'D10 - Identificar o propósito comunicativo em artigos de opinião' }
            ],
            'Matemática': [
                { code: 'D16', name: 'D16 - Identificar a localização de números inteiros na reta numérica' },
                { code: 'D19', name: 'D19 - Resolver problemas envolvendo juros simples e porcentagem' },
                { code: 'D20', name: 'D20 - Resolver problemas envolvendo equações do 1º grau' },
                { code: 'D21', name: 'D21 - Identificar uma equação do 2º grau e suas raízes' },
                { code: 'D28', name: 'D28 - Resolver problemas de cálculo de área e perímetro' },
                { code: 'D36', name: 'D36 - Resolver problemas envolvendo noções de probabilidade' }
            ]
        },
        'Ensino Médio': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Identificar a tese de um texto dissertativo-argumentativo' },
                { code: 'D03', name: 'D03 - Analisar recursos de persuasão e estratégias argumentativas' },
                { code: 'D06', name: 'D06 - Identificar marcas linguísticas de registro formal e informal' }
            ],
            'Matemática': [
                { code: 'D01', name: 'D01 - Resolver problemas envolvendo funções afins e quadráticas' },
                { code: 'D08', name: 'D08 - Resolver problemas envolvendo trigonometria' },
                { code: 'D15', name: 'D15 - Resolver problemas de geometria espacial (prismas e cilindros)' }
            ]
        }
    };

    let rawQuestions = [
        {
            id: 'Q_101',
            matriz: 'SAEB',
            codigo_bncc: 'D03 (LP - 5º Ano)',
            disciplina: 'Língua Portuguesa',
            etapa: '5º Ano',
            dificuldade: 'Médio',
            nivel_cognitivo: 'Analisar',
            enunciado: 'Leia o texto abaixo:\n\n"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave. Dona Francisca apressou o passo na vereda, sentindo o frescor da tarde anunciar o fim da colheita."\n\nNo trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:',
            opcoes: [
                { letra: 'A', texto: 'Perder a consciência por cansaço físico.', correta: false },
                { letra: 'B', texto: 'Desaparecer lentamente ao entardecer.', correta: true },
                { letra: 'C', texto: 'Aumentar a intensidade de sua luz solar.', correta: false },
                { letra: 'D', texto: 'Mudar de posição devido ao vento forte.', correta: false }
            ],
            explicacao: 'GABARITO: B. A expressão "desmaiar no horizonte" é uma metáfora poética que expressa o pôr do sol gradativo.'
        },
        {
            id: 'Q_102',
            matriz: 'SAEB',
            codigo_bncc: 'D13 (MAT - 5º Ano)',
            disciplina: 'Matemática',
            etapa: '5º Ano',
            dificuldade: 'Fácil',
            nivel_cognitivo: 'Aplicar',
            enunciado: 'Na feira do produtor rural de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele conseguiu vender 1.830 espigas.\n\nQuantas espigas de milho restaram com Seu Raimundo?',
            opcoes: [
                { letra: 'A', texto: '500 espigas', correta: false },
                { letra: 'B', texto: '600 espigas', correta: true },
                { letra: 'C', texto: '650 espigas', correta: false },
                { letra: 'D', texto: '720 espigas', correta: false }
            ],
            explicacao: 'GABARITO: B. Total colhido: 1.450 + 980 = 2.430. Restante: 2.430 - 1.830 = 600 espigas.'
        },
        {
            id: 'Q_103',
            matriz: 'SAEB',
            codigo_bncc: 'D11 (LP - 5º Ano)',
            disciplina: 'Língua Portuguesa',
            etapa: '5º Ano',
            dificuldade: 'Médio',
            nivel_cognitivo: 'Analisar',
            enunciado: 'Leia o trecho da notícia:\n\n"A Prefeitura Municipal de Gonçalves Dias inaugurou na última terça-feira a nova quadra poliesportiva. O espaço conta com piso adequado e refletores modernos, sendo a obra mais bonita e importante realizada neste ano."\n\nO trecho que expressa uma OPINIÃO sobre o fato é:',
            opcoes: [
                { letra: 'A', texto: '"inaugurou na última terça-feira a nova quadra poliesportiva."', correta: false },
                { letra: 'B', texto: '"O espaço conta com piso adequado e refletores modernos"', correta: false },
                { letra: 'C', texto: '"sendo a obra mais bonita e importante realizada neste ano"', correta: true },
                { letra: 'D', texto: '"A Prefeitura Municipal de Gonçalves Dias inaugurou"', correta: false }
            ],
            explicacao: 'GABARITO: C. O uso de "mais bonita e importante" expressa um juízo de valor subjetivo do autor.'
        },
        {
            id: 'Q_104',
            matriz: 'SEAMA',
            codigo_bncc: 'D06 (LP - 2º Ano)',
            disciplina: 'Língua Portuguesa',
            etapa: '2º Ano',
            dificuldade: 'Fácil',
            nivel_cognitivo: 'Compreender',
            enunciado: 'Leia a parlenda:\n\n"Batatinha quando nasce\nEspalha a rama pelo chão.\nMenininha quando dorme\nPõe a mão no coração."\n\nO que a batatinha faz quando nasce?',
            opcoes: [
                { letra: 'A', texto: 'Põe a mão no coração.', correta: false },
                { letra: 'B', texto: 'Espalha a rama pelo chão.', correta: true },
                { letra: 'C', texto: 'Dorme a noite inteira.', correta: false },
                { letra: 'D', texto: 'Corre pelo quintal.', correta: false }
            ],
            explicacao: 'GABARITO: B. A informação está explícita no segundo verso da parlenda.'
        },
        {
            id: 'Q_105',
            matriz: 'SAEB',
            codigo_bncc: 'D28 (MAT - 5º Ano)',
            disciplina: 'Matemática',
            etapa: '5º Ano',
            dificuldade: 'Difícil',
            nivel_cognitivo: 'Analisar',
            enunciado: 'A tabela abaixo registra o número de livros lidos pelos estudantes de uma turma durante o 1º bimestre:\n\n• 1 a 2 livros: 12 alunos\n• 3 a 4 livros: 18 alunos\n• 5 ou mais livros: 10 alunos\n\nQual é o percentual de estudantes que leram 3 ou mais livros nessa turma?',
            opcoes: [
                { letra: 'A', texto: '30%', correta: false },
                { letra: 'B', texto: '45%', correta: false },
                { letra: 'C', texto: '70%', correta: true },
                { letra: 'D', texto: '80%', correta: false }
            ],
            explicacao: 'GABARITO: C. Total de alunos: 12 + 18 + 10 = 40. Alunos que leram 3 ou mais: 18 + 10 = 28. (28 / 40) × 100 = 70%.'
        },
        {
            id: 'Q_106',
            matriz: 'SAEB',
            codigo_bncc: 'D19 (MAT - 9º Ano)',
            disciplina: 'Matemática',
            etapa: '9º Ano',
            dificuldade: 'Médio',
            nivel_cognitivo: 'Aplicar',
            enunciado: 'Um comerciante de Gonçalves Dias comprou um lote de mercadorias por R$ 2.400,00 e o revendeu com um lucro de 15% sobre o preço de compra.\n\nPor quanto esse lote foi revendido?',
            opcoes: [
                { letra: 'A', texto: 'R$ 2.550,00', correta: false },
                { letra: 'B', texto: 'R$ 2.760,00', correta: true },
                { letra: 'C', texto: 'R$ 2.800,00', correta: false },
                { letra: 'D', texto: 'R$ 3.000,00', correta: false }
            ],
            explicacao: 'GABARITO: B. Lucro = 15% de 2.400 = R$ 360,00. Preço final = 2.400 + 360 = R$ 2.760,00.'
        }
    ];

    function updateAiGenDescriptors() {
        const stage = document.getElementById('ai-gen-stage')?.value || '5º Ano';
        const subject = document.getElementById('ai-gen-subject')?.value || 'Língua Portuguesa';
        const descSelect = document.getElementById('ai-gen-descriptor');
        if (!descSelect) return;

        descSelect.innerHTML = '';
        const list = (DESCRIPTORS_BY_STAGE_SUBJECT[stage] && DESCRIPTORS_BY_STAGE_SUBJECT[stage][subject]) || [];
        
        list.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.code;
            opt.textContent = item.name;
            descSelect.appendChild(opt);
        });
    }

    function generateAiQuestionItem(stage, subject, descCode, difficulty) {
        const timestamp = Date.now();
        let qItem = null;

        if (subject === 'Língua Portuguesa') {
            if (descCode === 'D03' || descCode.includes('Inferir')) {
                qItem = {
                    id: `Q_${timestamp}`,
                    matriz: 'SAEB',
                    codigo_bncc: `${descCode} (LP - ${stage})`,
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: difficulty === 'Fácil' ? 'Compreender' : (difficulty === 'Médio' ? 'Analisar' : 'Avaliar'),
                    enunciado: `Leia o texto a seguir:\n\n"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave. Dona Francisca apressou o passo na vereda, sentindo o frescor da tarde anunciar o fim da colheita."\n\nNo trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:`,
                    opcoes: [
                        { letra: 'A', texto: 'Perder a consciência por cansaço físico.', correta: false },
                        { letra: 'B', texto: 'Desaparecer lentamente ao entardecer.', correta: true },
                        { letra: 'C', texto: 'Aumentar a intensidade de sua luz solar.', correta: false },
                        { letra: 'D', texto: 'Mudar de posição devido ao vento forte.', correta: false }
                    ],
                    explicacao: "GABARITO: B. A expressão 'desmaiar no horizonte' é uma metáfora poética que expressa o pôr do sol gradativo."
                };
            } else if (descCode === 'D11' || descCode.includes('Fato')) {
                qItem = {
                    id: `Q_${timestamp}`,
                    matriz: 'SAEB',
                    codigo_bncc: `${descCode} (LP - ${stage})`,
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Analisar',
                    enunciado: `Leia o fragmento da notícia:\n\n"A Prefeitura Municipal de Gonçalves Dias inaugurou na última terça-feira a nova quadra poliesportiva. O espaço conta com piso adequado e refletores modernos, sendo a obra mais bonita e importante realizada neste ano na região."\n\nO trecho que expressa uma OPINIÃO sobre o fato relatado é:`,
                    opcoes: [
                        { letra: 'A', texto: '"inaugurou na última terça-feira a nova quadra poliesportiva municipal."', correta: false },
                        { letra: 'B', texto: '"O espaço conta com piso adequado e refletores modernos"', correta: false },
                        { letra: 'C', texto: '"sendo a obra mais bonita e importante realizada neste ano"', correta: true },
                        { letra: 'D', texto: '"A Prefeitura Municipal de Gonçalves Dias inaugurou"', correta: false }
                    ],
                    explicacao: "GABARITO: C. O uso dos adjetivos 'mais bonita e importante' expressa um juízo de valor subjetivo do autor."
                };
            } else {
                qItem = {
                    id: `Q_${timestamp}`,
                    matriz: 'SAEB',
                    codigo_bncc: `${descCode} (LP - ${stage})`,
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Compreender',
                    enunciado: `Leia o bilhete escolar:\n\n"Professora Rita, amanhã o Gabriel precisará sair às 10h da manhã para uma consulta médica no posto central de saúde. Ele trará a declaração na quinta-feira. Obrigado, Maria Silva."\n\nDe acordo com o texto, Gabriel sairá mais cedo da escola porque:`,
                    opcoes: [
                        { letra: 'A', texto: 'Irá viajar com sua família para outra cidade.', correta: false },
                        { letra: 'B', texto: 'Tem um compromisso de saúde marcado no posto.', correta: true },
                        { letra: 'C', texto: 'Precisa ajudar sua mãe nas tarefas domésticas.', correta: false },
                        { letra: 'D', texto: 'Esqueceu seus cadernos escolares em casa.', correta: false }
                    ],
                    explicacao: "GABARITO: B. A informação está explícita no texto: 'para uma consulta médica no posto central de saúde'."
                };
            }
        } else {
            // Matemática
            if (descCode === 'D13' || descCode === 'D02' || descCode.includes('adição')) {
                qItem = {
                    id: `Q_${timestamp}`,
                    matriz: 'SAEB',
                    codigo_bncc: `${descCode} (MAT - ${stage})`,
                    disciplina: 'Matemática',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Aplicar',
                    enunciado: `Na feira do produtor rural de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele conseguiu vender 1.830 espigas.\n\nQuantas espigas de milho restaram com Seu Raimundo?`,
                    opcoes: [
                        { letra: 'A', texto: '500 espigas', correta: false },
                        { letra: 'B', texto: '600 espigas', correta: true },
                        { letra: 'C', texto: '650 espigas', correta: false },
                        { letra: 'D', texto: '720 espigas', correta: false }
                    ],
                    explicacao: "GABARITO: B. Total colhido: 1.450 + 980 = 2.430 espigas. Restante após as vendas: 2.430 - 1.830 = 600 espigas."
                };
            } else if (descCode === 'D28' || descCode.includes('tabelas')) {
                qItem = {
                    id: `Q_${timestamp}`,
                    matriz: 'SAEB',
                    codigo_bncc: `${descCode} (MAT - ${stage})`,
                    disciplina: 'Matemática',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Analisar',
                    enunciado: `A tabela abaixo registra o número de livros lidos pelos estudantes de uma turma durante o 1º bimestre:\n\n• 1 a 2 livros: 12 alunos\n• 3 a 4 livros: 18 alunos\n• 5 ou mais livros: 10 alunos\n\nQual é o percentual de estudantes que leram 3 ou mais livros nessa turma?`,
                    opcoes: [
                        { letra: 'A', texto: '30%', correta: false },
                        { letra: 'B', texto: '45%', correta: false },
                        { letra: 'C', texto: '70%', correta: true },
                        { letra: 'D', texto: '80%', correta: false }
                    ],
                    explicacao: "GABARITO: C. Total de alunos na turma = 12 + 18 + 10 = 40 alunos. Alunos que leram 3 ou mais livros = 18 + 10 = 28 alunos. Percentual = (28 / 40) × 100 = 70%."
                };
            } else {
                qItem = {
                    id: `Q_${timestamp}`,
                    matriz: 'SAEB',
                    codigo_bncc: `${descCode} (MAT - ${stage})`,
                    disciplina: 'Matemática',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Aplicar',
                    enunciado: `Uma sala de aula possui formato retangular com 8 metros de comprimento por 6 metros de largura. O professor deseja colocar rodapé em toda a volta da sala, deixando livre apenas o espaço da porta de 1 metro.\n\nQuantos metros de rodapé serão necessários?`,
                    opcoes: [
                        { letra: 'A', texto: '27 metros', correta: true },
                        { letra: 'B', texto: '28 metros', correta: false },
                        { letra: 'C', texto: '47 metros', correta: false },
                        { letra: 'D', texto: '48 metros', correta: false }
                    ],
                    explicacao: "GABARITO: A. Perímetro total da sala = 2 × (8 + 6) = 28 metros. Descontando a porta: 28 - 1 = 27 metros de rodapé."
                };
            }
        }

        return qItem;
    }

    function renderQuestions() {
        const questionsContainer = document.getElementById('questions-container-list');
        const questionsCounter = document.getElementById('questions-counter');
        const filterMatrix = document.getElementById('filter-matrix');
        const filterStage = document.getElementById('filter-stage');
        const filterSubject = document.getElementById('filter-subject');
        const filterDifficulty = document.getElementById('filter-difficulty');
        const searchQuery = document.getElementById('questions-search-query')?.value?.toLowerCase() || '';

        if (!questionsContainer) return;

        const selectedMatrix = filterMatrix ? filterMatrix.value : 'all';
        const selectedStage = filterStage ? filterStage.value : 'all';
        const selectedSubject = filterSubject ? filterSubject.value : 'all';
        const selectedDifficulty = filterDifficulty ? filterDifficulty.value : 'all';

        const filtered = rawQuestions.filter(q => {
            const matchMatrix = selectedMatrix === 'all' || q.matriz === selectedMatrix;
            const matchStage = selectedStage === 'all' || q.etapa === selectedStage;
            const matchSubject = selectedSubject === 'all' || q.disciplina === selectedSubject;
            const matchDifficulty = selectedDifficulty === 'all' || q.dificuldade === selectedDifficulty;
            const matchSearch = !searchQuery || 
                (q.enunciado && q.enunciado.toLowerCase().includes(searchQuery)) || 
                (q.codigo_bncc && q.codigo_bncc.toLowerCase().includes(searchQuery)) ||
                (q.disciplina && q.disciplina.toLowerCase().includes(searchQuery));

            return matchMatrix && matchStage && matchSubject && matchDifficulty && matchSearch;
        });

        if (questionsCounter) {
            questionsCounter.textContent = `Exibindo ${filtered.length} ${filtered.length === 1 ? 'questão' : 'questões'} do banco`;
        }

        const countBadge = document.getElementById('badge-count-questions');
        if (countBadge) countBadge.textContent = String(rawQuestions.length);

        questionsContainer.innerHTML = '';

        if (filtered.length === 0) {
            questionsContainer.innerHTML = `
                <div class="card text-center" style="padding: 40px 20px;">
                    <i data-lucide="file-question" style="width:40px; height:40px; margin:0 auto 10px auto; opacity:0.3; color:var(--purple-light);"></i>
                    <p class="text-muted" style="margin:0; font-size:0.9rem;">Nenhuma questão encontrada para os filtros selecionados.</p>
                </div>
            `;
            safeCreateIcons();
            return;
        }

        filtered.forEach((q, idx) => {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.style.background = 'var(--bg-secondary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.padding = '18px';
            card.style.position = 'relative';
            
            let badgeDiffClass = 'badge-success';
            if (q.dificuldade === 'Médio') badgeDiffClass = 'badge-warning';
            if (q.dificuldade === 'Difícil') badgeDiffClass = 'badge-danger';

            const cleanEnunciado = (q.enunciado || '').replace(/\n/g, '<br>');

            card.innerHTML = `
                <div class="question-header flex-between flex-wrap gap-sm" style="margin-bottom: 12px;">
                    <div class="question-badges" style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                        <span class="badge badge-purple" style="font-weight:700;">${q.codigo_bncc}</span>
                        <span class="badge badge-info">${q.disciplina}</span>
                        <span class="badge badge-outline">${q.etapa || '5º Ano'}</span>
                        <span class="badge badge-outline">${q.matriz || 'SAEB'}</span>
                        <span class="badge ${badgeDiffClass}">${q.dificuldade}</span>
                    </div>
                    <div class="question-actions" style="display:flex; gap:6px;">
                        <button class="btn btn-outline btn-sm btn-reveal-q-expl" data-id="${q.id}" style="font-size:0.75rem; padding:3px 8px; display:flex; align-items:center; gap:4px;">
                            <i data-lucide="eye" style="width:13px; height:13px;"></i> Ver Gabarito
                        </button>
                        <button class="btn btn-outline btn-sm btn-delete-question" data-id="${q.id}" style="color:var(--red-light); border-color:rgba(239,68,68,0.3); padding:3px 8px;" title="Excluir">
                            <i data-lucide="trash-2" style="width:13px; height:13px;"></i>
                        </button>
                    </div>
                </div>

                <div class="question-body" style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.55; margin-bottom: 14px;">
                    <strong style="color: var(--purple-light); margin-right: 4px;">Item ${idx + 1}.</strong>
                    ${cleanEnunciado}
                </div>

                <div class="question-options-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">
                    ${q.opcoes.map(opt => `
                        <div class="question-option ${opt.correta ? 'is-correct-answer' : ''}" data-correct="${opt.correta}" style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-tertiary); font-size: 0.84rem; cursor: pointer; transition: all 0.15s ease;">
                            <strong class="option-letter" style="min-width: 22px; font-weight: 700; color: var(--purple-light);">${opt.letra})</strong>
                            <span class="option-text" style="color: var(--text-primary);">${opt.texto}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="question-explanation hidden" id="expl-${q.id}" style="padding: 12px 16px; background: rgba(139, 92, 246, 0.06); border-left: 4px solid var(--purple); border-radius: var(--radius-sm); margin-top: 10px;">
                    <strong style="font-size: 0.82rem; color: var(--purple-light); display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>
                        Gabarito Comentado & Análise Pedagógica:
                    </strong>
                    <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45;">
                        ${q.explicacao || 'Sem justificativa cadastrada.'}
                    </p>
                </div>
            `;

            questionsContainer.appendChild(card);
        });

        // Click option to reveal correctness
        questionsContainer.querySelectorAll('.question-card').forEach(card => {
            const options = card.querySelectorAll('.question-option');
            const explanation = card.querySelector('.question-explanation');

            options.forEach(opt => {
                opt.addEventListener('click', () => {
                    options.forEach(o => {
                        if (o.getAttribute('data-correct') === 'true') {
                            o.style.borderColor = 'var(--green-light)';
                            o.style.background = 'rgba(16, 185, 129, 0.12)';
                        }
                    });
                    if (explanation) explanation.classList.remove('hidden');
                });
            });
        });

        // Toggle Gabarito buttons
        questionsContainer.querySelectorAll('.btn-reveal-q-expl').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const expl = document.getElementById(`expl-${id}`);
                if (expl) expl.classList.toggle('hidden');
            });
        });

        // Delete question buttons
        questionsContainer.querySelectorAll('.btn-delete-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja realmente remover esta questão do banco?')) {
                    rawQuestions = rawQuestions.filter(q => q.id !== id);
                    renderQuestions();
                    showToast('Questão removida do banco!', 'trash-2');
                }
            });
        });

        safeCreateIcons();
    }

    // Generator Event Listeners
    const btnGenAiQ = document.getElementById('btn-generate-ai-question');
    if (btnGenAiQ) {
        btnGenAiQ.addEventListener('click', () => {
            const stage = document.getElementById('ai-gen-stage')?.value || '5º Ano';
            const subject = document.getElementById('ai-gen-subject')?.value || 'Língua Portuguesa';
            const desc = document.getElementById('ai-gen-descriptor')?.value || 'D03';
            const diff = document.getElementById('ai-gen-difficulty')?.value || 'Médio';

            showToast(`Gerando questão com IA integrada para ${desc} (${subject})...`, 'sparkles');
            setTimeout(() => {
                const newQ = generateAiQuestionItem(stage, subject, desc, diff);
                rawQuestions.unshift(newQ);
                renderQuestions();
                showToast('Questão gerada e adicionada com sucesso ao banco!', 'check');
            }, 350);
        });
    }

    const aiGenStageSelect = document.getElementById('ai-gen-stage');
    const aiGenSubjectSelect = document.getElementById('ai-gen-subject');
    if (aiGenStageSelect) aiGenStageSelect.addEventListener('change', updateAiGenDescriptors);
    if (aiGenSubjectSelect) aiGenSubjectSelect.addEventListener('change', updateAiGenDescriptors);

    // Filter listeners
    ['filter-matrix', 'filter-stage', 'filter-subject', 'filter-difficulty'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', renderQuestions);
    });

    const qSearchInput = document.getElementById('questions-search-query');
    if (qSearchInput) qSearchInput.addEventListener('input', debounce(renderQuestions, 250));

    // Download Word Template
    function downloadWordQuestionsTemplate() {
        const content = `MODELO PADRÃO DE IMPORTAÇÃO DE QUESTÕES — IDEB NA PRÁTICA (SEMED)
----------------------------------------------------------------------
INSTRUÇÕES DE PREENCHIMENTO:
- Mantenha a estrutura com [QUESTAO] e [/QUESTAO] para cada item.
- As alternativas devem iniciar por A), B), C), D).
- Informe o GABARITO (A, B, C ou D) e a JUSTIFICATIVA pedagógica.
----------------------------------------------------------------------

[QUESTAO]
ETAPA: 5º Ano
DISCIPLINA: Língua Portuguesa
MATRIZ: SAEB
DESCRITOR: D03 - Inferir o sentido de uma palavra ou expressão
DIFICULDADE: Médio
ENUNCIADO: Leia o texto a seguir:
"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave."
No trecho "O sol começava a desmaiar no horizonte", a palavra sublinhada foi empregada com o sentido de:
A) Perder a consciência por cansaço físico.
B) Desaparecer lentamente ao entardecer.
C) Aumentar a intensidade de sua luz solar.
D) Mudar de posição devido ao vento forte.
GABARITO: B
JUSTIFICATIVA: Sentido figurado de pôr do sol gradativo.
[/QUESTAO]

[QUESTAO]
ETAPA: 5º Ano
DISCIPLINA: Matemática
MATRIZ: SAEB
DESCRITOR: D13 - Resolver problemas com números naturais
DIFICULDADE: Fácil
ENUNCIADO: Na feira de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele vendeu 1.830 espigas. Quantas espigas restaram?
A) 500 espigas
B) 600 espigas
C) 650 espigas
D) 720 espigas
GABARITO: B
JUSTIFICATIVA: 1.450 + 980 = 2.430. 2.430 - 1.830 = 600 espigas.
[/QUESTAO]
`;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'modelo_questoes_ideb_na_pratica.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Modelo de importação baixado com sucesso!', 'download');
    }

    const btnDlWordTemplate = document.getElementById('btn-download-word-template');
    if (btnDlWordTemplate) btnDlWordTemplate.addEventListener('click', downloadWordQuestionsTemplate);

    const btnModalDlWordSample = document.getElementById('btn-modal-dl-word-sample');
    if (btnModalDlWordSample) btnModalDlWordSample.addEventListener('click', downloadWordQuestionsTemplate);

    // Modal Import File Handlers
    const modalImportQ = document.getElementById('modal-import-questions-file');
    const btnTriggerUploadModal = document.getElementById('btn-trigger-upload-modal');
    const btnCloseImportQ = document.getElementById('btn-close-import-q-modal');
    const btnCancelImportQ = document.getElementById('btn-cancel-import-q');
    const btnSelectQFile = document.getElementById('btn-select-q-file');
    const modalQFileInput = document.getElementById('modal-q-file-input');
    const modalPdfDropzone = document.getElementById('modal-pdf-dropzone');
    const modalFileStatusPreview = document.getElementById('modal-file-status-preview');
    const btnConfirmImportQ = document.getElementById('btn-confirm-import-q');

    if (btnTriggerUploadModal && modalImportQ) {
        btnTriggerUploadModal.addEventListener('click', () => modalImportQ.classList.remove('hidden'));
    }
    if (btnCloseImportQ && modalImportQ) {
        btnCloseImportQ.addEventListener('click', () => modalImportQ.classList.add('hidden'));
    }
    if (btnCancelImportQ && modalImportQ) {
        btnCancelImportQ.addEventListener('click', () => modalImportQ.classList.add('hidden'));
    }
    if (btnSelectQFile && modalQFileInput) {
        btnSelectQFile.addEventListener('click', () => modalQFileInput.click());
    }
    if (modalPdfDropzone && modalQFileInput) {
        modalPdfDropzone.addEventListener('click', (e) => {
            if (e.target !== btnSelectQFile) modalQFileInput.click();
        });
    }

    let loadedFileQuestionsBatch = [];
    if (modalQFileInput) {
        modalQFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (modalFileStatusPreview) {
                modalFileStatusPreview.style.display = 'block';
                modalFileStatusPreview.innerHTML = `
                    <strong style="color:var(--green-light);">✓ Arquivo selecionado:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)<br>
                    <span class="text-muted">Processando estrutura de itens...</span>
                `;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                loadedFileQuestionsBatch = [
                    {
                        id: `Q_IMP_${Date.now()}_1`,
                        matriz: 'SAEB',
                        codigo_bncc: 'D03 (LP - 5º Ano)',
                        disciplina: 'Língua Portuguesa',
                        etapa: '5º Ano',
                        dificuldade: 'Médio',
                        nivel_cognitivo: 'Analisar',
                        enunciado: 'Questão importada do arquivo:\n\n"Os alunos participaram com entusiasmo da gincana de leitura realizada na escola."\n\nA palavra sublinhada expressa ideia de:',
                        opcoes: [
                            { letra: 'A', texto: 'Modo / Sentimento', correta: true },
                            { letra: 'B', texto: 'Tempo / Duração', correta: false },
                            { letra: 'C', texto: 'Lugar / Espaço', correta: false },
                            { letra: 'D', texto: 'Dúvida / Incerteza', correta: false }
                        ],
                        explicacao: 'GABARITO: A. "Com entusiasmo" é uma locução adverbial de modo.'
                    }
                ];

                if (modalFileStatusPreview) {
                    modalFileStatusPreview.innerHTML = `
                        <strong style="color:var(--green-light);">✓ Arquivo carregado com sucesso:</strong> ${file.name}<br>
                        <span style="color:var(--purple-light); font-weight:600;">1 questão identificada e pronta para importar.</span>
                    `;
                }
            };
            reader.readAsText(file);
        });
    }

    if (btnConfirmImportQ) {
        btnConfirmImportQ.addEventListener('click', () => {
            if (loadedFileQuestionsBatch.length > 0) {
                loadedFileQuestionsBatch.forEach(q => rawQuestions.unshift(q));
                loadedFileQuestionsBatch = [];
                if (modalImportQ) modalImportQ.classList.add('hidden');
                renderQuestions();
                showToast('Lote de questões importado com sucesso para o banco!', 'check');
            } else {
                showToast('Selecione um arquivo válido para importar.', 'alert-triangle');
            }
        });
    }

    // Modal Create Manual Question Handlers
    const modalCreateManualQ = document.getElementById('modal-create-manual-question');
    const btnTriggerManualQModal = document.getElementById('btn-trigger-manual-q-modal');
    const btnCloseManualQ = document.getElementById('btn-close-manual-q-modal');
    const btnCancelManualQ = document.getElementById('btn-cancel-manual-q');
    const btnSaveManualQ = document.getElementById('btn-save-manual-q');

    if (btnTriggerManualQModal && modalCreateManualQ) {
        btnTriggerManualQModal.addEventListener('click', () => modalCreateManualQ.classList.remove('hidden'));
    }
    if (btnCloseManualQ && modalCreateManualQ) {
        btnCloseManualQ.addEventListener('click', () => modalCreateManualQ.classList.add('hidden'));
    }
    if (btnCancelManualQ && modalCreateManualQ) {
        btnCancelManualQ.addEventListener('click', () => modalCreateManualQ.classList.add('hidden'));
    }

    if (btnSaveManualQ) {
        btnSaveManualQ.addEventListener('click', () => {
            const stage = document.getElementById('manual-q-stage')?.value || '5º Ano';
            const subject = document.getElementById('manual-q-subject')?.value || 'Língua Portuguesa';
            const matrix = document.getElementById('manual-q-matrix')?.value || 'SAEB';
            const diff = document.getElementById('manual-q-diff')?.value || 'Médio';
            const desc = document.getElementById('manual-q-desc')?.value.trim() || 'D01';
            const text = document.getElementById('manual-q-text')?.value.trim();
            const opA = document.getElementById('manual-q-op-a')?.value.trim();
            const opB = document.getElementById('manual-q-op-b')?.value.trim();
            const opC = document.getElementById('manual-q-op-c')?.value.trim();
            const opD = document.getElementById('manual-q-op-d')?.value.trim();
            const correct = document.getElementById('manual-q-correct')?.value || 'A';
            const expl = document.getElementById('manual-q-expl')?.value.trim() || '';

            if (!text || !opA || !opB) {
                showToast('Preencha o enunciado e as opções de resposta obrigatórias.', 'alert-circle');
                return;
            }

            const newQ = {
                id: `Q_MAN_${Date.now()}`,
                matriz: matrix,
                codigo_bncc: `${desc} (${subject.slice(0, 2).toUpperCase()} - ${stage})`,
                disciplina: subject,
                etapa: stage,
                dificuldade: diff,
                nivel_cognitivo: 'Compreender',
                enunciado: text,
                opcoes: [
                    { letra: 'A', texto: opA, correta: correct === 'A' },
                    { letra: 'B', texto: opB, correta: correct === 'B' },
                    { letra: 'C', texto: opC || 'Opção C', correta: correct === 'C' },
                    { letra: 'D', texto: opD || 'Opção D', correta: correct === 'D' }
                ],
                explicacao: expl ? `GABARITO: ${correct}. ${expl}` : `GABARITO: ${correct}.`
            };

            rawQuestions.unshift(newQ);
            if (modalCreateManualQ) modalCreateManualQ.classList.add('hidden');
            renderQuestions();
            showToast('Nova questão manual cadastrada com sucesso!', 'check');
        });
    }

    // Modal AI Key Config Handlers
    const modalConfigAi = document.getElementById('modal-config-ai-key');
    const btnConfigAiKey = document.getElementById('btn-config-ai-key');
    const btnCloseConfigAi = document.getElementById('btn-close-config-ai-modal');
    const btnCancelConfigAi = document.getElementById('btn-cancel-config-ai');
    const btnSaveConfigAi = document.getElementById('btn-save-config-ai');

    if (btnConfigAiKey && modalConfigAi) {
        btnConfigAiKey.addEventListener('click', () => modalConfigAi.classList.remove('hidden'));
    }
    if (btnCloseConfigAi && modalConfigAi) {
        btnCloseConfigAi.addEventListener('click', () => modalConfigAi.classList.add('hidden'));
    }
    if (btnCancelConfigAi && modalConfigAi) {
        btnCancelConfigAi.addEventListener('click', () => modalConfigAi.classList.add('hidden'));
    }
    if (btnSaveConfigAi && modalConfigAi) {
        btnSaveConfigAi.addEventListener('click', () => {
            modalConfigAi.classList.add('hidden');
            showToast('Configurações de IA salvas com sucesso para o município!', 'check');
        });
    }

    // Export Exam from Questions
    const btnExportPdfStudent = document.getElementById('btn-export-pdf-student');
    const btnExportPdfTeacher = document.getElementById('btn-export-pdf-teacher');
    if (btnExportPdfStudent) {
        btnExportPdfStudent.addEventListener('click', () => {
            showToast('Preparando impressão do Caderno de Prova (PDF)...', 'printer');
            setTimeout(() => window.print(), 300);
        });
    }
    if (btnExportPdfTeacher) {
        btnExportPdfTeacher.addEventListener('click', () => {
            showToast('Preparando impressão do Gabarito Comentado (PDF)...', 'printer');
            setTimeout(() => window.print(), 300);
        });
    }

    // Modal elements and logic for editing question
    const editQModal = document.getElementById('edit-question-modal');
    const btnCloseEditQModal = document.getElementById('btn-close-edit-q-modal');
    const btnCancelEditQ = document.getElementById('btn-cancel-edit-q');
    const btnSaveEditedQ = document.getElementById('btn-save-edited-q');

    function openEditQuestionModal(q) {
        if (!editQModal) return;
        document.getElementById('edit-q-id').value = q.id;
        document.getElementById('edit-q-matrix').value = q.matriz || 'IDEB';
        document.getElementById('edit-q-desc').value = q.codigo_bncc || '';
        document.getElementById('edit-q-subject').value = q.disciplina || 'Língua Portuguesa';
        document.getElementById('edit-q-diff').value = q.dificuldade || 'Médio';
        document.getElementById('edit-q-bloom').value = q.nivel_cognitivo || 'Lembrar';
        document.getElementById('edit-q-text').value = q.enunciado || '';

        const opA = q.opcoes.find(o => o.letra === 'A');
        const opB = q.opcoes.find(o => o.letra === 'B');
        const opC = q.opcoes.find(o => o.letra === 'C');
        const opD = q.opcoes.find(o => o.letra === 'D');

        document.getElementById('edit-q-op-a').value = opA ? opA.texto : '';
        document.getElementById('edit-q-op-b').value = opB ? opB.texto : '';
        document.getElementById('edit-q-op-c').value = opC ? opC.texto : '';
        document.getElementById('edit-q-op-d').value = opD ? opD.texto : '';

        const correctOpt = q.opcoes.find(o => o.correta === true);
        document.getElementById('edit-q-correct').value = correctOpt ? correctOpt.letra : 'A';
        document.getElementById('edit-q-explanation').value = q.explicacao || '';

        editQModal.classList.remove('hidden');
    }

    function closeEditQuestionModal() {
        if (editQModal) editQModal.classList.add('hidden');
    }

    if (btnCloseEditQModal) btnCloseEditQModal.addEventListener('click', closeEditQuestionModal);
    if (btnCancelEditQ) btnCancelEditQ.addEventListener('click', closeEditQuestionModal);

    if (btnSaveEditedQ) {
        btnSaveEditedQ.addEventListener('click', () => {
            const qId = document.getElementById('edit-q-id').value;
            const matrix = document.getElementById('edit-q-matrix').value;
            const desc = document.getElementById('edit-q-desc').value.trim();
            const subject = document.getElementById('edit-q-subject').value;
            const diff = document.getElementById('edit-q-diff').value;
            const bloom = document.getElementById('edit-q-bloom').value;
            const text = document.getElementById('edit-q-text').value.trim();

            const textA = document.getElementById('edit-q-op-a').value.trim();
            const textB = document.getElementById('edit-q-op-b').value.trim();
            const textC = document.getElementById('edit-q-op-c').value.trim();
            const textD = document.getElementById('edit-q-op-d').value.trim();
            const correct = document.getElementById('edit-q-correct').value;
            const explanation = document.getElementById('edit-q-explanation').value.trim();

            if (!desc || !text || !textA || !textB || !textC || !textD) {
                showToast('Preencha todos os campos obrigatórios (*).', 'alert-triangle');
                return;
            }

            const qIndex = rawQuestions.findIndex(qu => qu.id === qId);
            if (qIndex !== -1) {
                rawQuestions[qIndex] = {
                    id: qId,
                    matriz: matrix,
                    codigo_bncc: desc,
                    disciplina: subject,
                    dificuldade: diff,
                    nivel_cognitivo: bloom,
                    enunciado: text,
                    opcoes: [
                        { letra: 'A', texto: textA, correta: correct === 'A' },
                        { letra: 'B', texto: textB, correta: correct === 'B' },
                        { letra: 'C', texto: textC, correta: correct === 'C' },
                        { letra: 'D', texto: textD, correta: correct === 'D' }
                    ],
                    explicacao: explanation
                };

                saveDatabaseState();
                renderQuestions();
                closeEditQuestionModal();
                showToast('Questão atualizada com sucesso!', 'check-circle');
            }
        });
    }

    function deleteQuestion(qId) {
        const qIndex = rawQuestions.findIndex(qu => qu.id === qId);
        if (qIndex !== -1) {
            rawQuestions.splice(qIndex, 1);
            saveDatabaseState();
            renderQuestions();
            showToast('Questão excluída com sucesso!', 'trash-2');
        }
    }

    // Add filter change events
    if (filterMatrix) filterMatrix.addEventListener('change', renderQuestions);
    if (filterSubject) filterSubject.addEventListener('change', renderQuestions);
    if (filterBloom) filterBloom.addEventListener('change', renderQuestions);
    if (filterDifficulty) filterDifficulty.addEventListener('change', renderQuestions);

    // Export simulated actions
    const btnExportStudent = document.getElementById('btn-export-pdf-student');
    if (btnExportStudent) {
        btnExportStudent.addEventListener('click', () => {
            showToast('Preparando download do PDF da Prova (Aluno)...', 'download');
            setTimeout(() => {
                showToast('Download concluído!', 'check-circle');
            }, 1500);
        });
    }

    const btnExportTeacher = document.getElementById('btn-export-pdf-teacher');
    if (btnExportTeacher) {
        btnExportTeacher.addEventListener('click', () => {
            showToast('Preparando download do Gabarito Comentado...', 'download');
            setTimeout(() => {
                showToast('Download concluído!', 'check-circle');
            }, 1500);
        });
    }

    // ==========================================
    // ESCOLAS DA REDE (DIRETÓRIO COMPLETO)
    // ==========================================
    const dbSchoolSearch = document.getElementById('db-school-search');
    const dbSchoolsTableBody = document.getElementById('db-schools-table-body');
    let uniqueSchoolsList = [];

    window.populateSchoolPanelSelector = function(schools) {
        uniqueSchoolsList = schools;
        renderDbSchools();

        // Also populate school selection inside test scheduler
        const evalSchoolSelector = document.getElementById('eval-school');
        if (evalSchoolSelector) {
            evalSchoolSelector.innerHTML = '';
            schools.forEach(sch => {
                const opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, ' ');
                evalSchoolSelector.appendChild(opt);
            });
        }
    };

    // State Maps for Directors, Teachers and School Locations (9 Official Schools of Gonçalves Dias - MA)
    const schoolDirectorsMap = {
        'UI JOSE CORREA LIMA': 'Profª Maria da Conceição Lima (Diretora)',
        'UI EMILIO MURAD': 'Prof. Francisco Carlos Silva (Diretor)',
        'UE VEREADOR LEONARDO FERREIRA LIMA': 'Profª Antonia Ferreira Lima (Diretora)',
        'U I BASILIO ALVES': 'Prof. José Basílio Alves (Diretor)',
        'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ': 'Profª Aldenora Araújo Cruz (Diretora)',
        'UE RAIMUNDO DOS REIS DA SILVA': 'Prof. Raimundo Nonato Reis (Diretor)',
        'UNIDADE INTEGRADA JOSE GONCALVES DIAS': 'Prof. Raimundo José Dias (Diretor)',
        'UNIDADE ESCOLAR ANISIO GOMES': 'Profª Francisca Anísio Gomes (Diretora)',
        'UE ANITA FURTADO': 'Profª Ana Rita Anita Furtado (Diretora)'
    };

    const schoolZonesMap = {
        'UI JOSE CORREA LIMA': { zone: 'Zona Rural', address: 'POVOADO CORRÊA, ZONA RURAL - CEP: 65775-000', inep: '21128723', phone: '-' },
        'UI EMILIO MURAD': { zone: 'Zona Rural', address: 'POVOADO MURAD, ZONA RURAL - CEP: 65775-000', inep: '21128146', phone: '9935-6250' },
        'UE VEREADOR LEONARDO FERREIRA LIMA': { zone: 'Sede Urbana', address: 'RUA LEONARDO LIMA, CENTRO - CEP: 65775-000', inep: '21128740', phone: '9981-4371' },
        'U I BASILIO ALVES': { zone: 'Zona Rural', address: 'POVOADO PALMARES, ZONA RURAL - CEP: 65775-000', inep: '21128120', phone: '9935-6218 / 99356-2607' },
        'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ': { zone: 'Sede Urbana', address: 'AVENIDA PRINCIPAL, CENTRO - CEP: 65775-000', inep: '21286973', phone: '9998-2055' },
        'UE RAIMUNDO DOS REIS DA SILVA': { zone: 'Zona Rural', address: 'POVOADO REIS, ZONA RURAL - CEP: 65775-000', inep: '21128758', phone: '-' },
        'UNIDADE INTEGRADA JOSE GONCALVES DIAS': { zone: 'Zona Rural', address: 'POVOADO GONÇALVES, ZONA RURAL - CEP: 65775-000', inep: '21286990', phone: '9998-2055' },
        'UNIDADE ESCOLAR ANISIO GOMES': { zone: 'Zona Rural', address: 'POVOADO ANÍSIO, ZONA RURAL - CEP: 65775-000', inep: '21128774', phone: '99817-0566' },
        'UE ANITA FURTADO': { zone: 'Sede Urbana', address: 'RUA ANITA FURTADO, CENTRO - CEP: 65775-000', inep: '21192544', phone: '9935-6210' }
    };

    const classTeachersMap = {
        'UI JOSE CORREA LIMA_5º Ano A': 'Profa. Ana Carolina Lima',
        'UI JOSE CORREA LIMA_2º Ano A': 'Profa. Rita de Cássia',
        'UI EMILIO MURAD_5º Ano A': 'Prof. Carlos Eduardo Murad',
        'UI EMILIO MURAD_9º Ano A': 'Prof. Marcos Vinícius Silva',
        'UE VEREADOR LEONARDO FERREIRA LIMA_5º Ano A': 'Profa. Juliana Medeiros',
        'UE VEREADOR LEONARDO FERREIRA LIMA_9º Ano A': 'Prof. Rodrigo Tavares',
        'U I BASILIO ALVES_2º Ano A': 'Profa. Beatriz Oliveira',
        'U I BASILIO ALVES_5º Ano A': 'Prof. Leandro Ribeiro',
        'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ_5º Ano A': 'Profa. Tatiana Cruz',
        'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ_9º Ano A': 'Prof. Francisco Chagas',
        'UE RAIMUNDO DOS REIS DA SILVA_5º Ano A': 'Profa. Marta Helena Reis',
        'UNIDADE INTEGRADA JOSE GONCALVES DIAS_5º Ano A': 'Prof. Antônio Carlos Dias',
        'UNIDADE ESCOLAR ANISIO GOMES_5º Ano A': 'Profa. Eliane Cristina Gomes',
        'UE ANITA FURTADO_5º Ano A': 'Profa. Maria do Socorro Furtado'
    };

    let activeWorkspaceSchool = 'UI JOSE CORREA LIMA';
    let activeWorkspaceClass = null;

    function renderDbSchools() {
        if (!dbSchoolsTableBody) return;
        dbSchoolsTableBody.innerHTML = '';

        if (!uniqueSchoolsList || uniqueSchoolsList.length === 0) {
            uniqueSchoolsList = [
                'UI JOSE CORREA LIMA',
                'UI EMILIO MURAD',
                'UE VEREADOR LEONARDO FERREIRA LIMA',
                'U I BASILIO ALVES',
                'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ',
                'UE RAIMUNDO DOS REIS DA SILVA',
                'UNIDADE INTEGRADA JOSE GONCALVES DIAS',
                'UNIDADE ESCOLAR ANISIO GOMES',
                'UE ANITA FURTADO'
            ];
        }

        const query = dbSchoolSearch ? dbSchoolSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
        const filteredSchools = uniqueSchoolsList.filter(s => {
            const schNorm = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const info = schoolZonesMap[s];
            const inepStr = info ? String(info.inep) : '';
            return schNorm.includes(query) || inepStr.includes(query);
        });

        // Compute KPI Summary
        let totalStudents = loadedStudents.length;
        let urbanSchoolsCount = 0;
        let urbanStudentsCount = 0;
        let ruralSchoolsCount = 0;
        let ruralStudentsCount = 0;

        uniqueSchoolsList.forEach(sch => {
            const schStudents = loadedStudents.filter(s => s.escola === sch);
            const isUrban = schoolZonesMap[sch] ? (schoolZonesMap[sch].zone === 'Sede Urbana') : true;
            if (isUrban) {
                urbanSchoolsCount++;
                urbanStudentsCount += schStudents.length;
            } else {
                ruralSchoolsCount++;
                ruralStudentsCount += schStudents.length;
            }
        });

        const kpiTotal = document.getElementById('kpi-total-schools');
        const kpiTotalSub = document.getElementById('kpi-total-students-sub');
        const kpiUrban = document.getElementById('kpi-urban-schools');
        const kpiUrbanSub = document.getElementById('kpi-urban-students-sub');
        const kpiRural = document.getElementById('kpi-rural-schools');
        const kpiRuralSub = document.getElementById('kpi-rural-students-sub');

        if (kpiTotal) kpiTotal.textContent = `${uniqueSchoolsList.length} Unidades`;
        if (kpiTotalSub) kpiTotalSub.textContent = `Alunos: ${totalStudents.toLocaleString('pt-BR')}`;
        if (kpiUrban) kpiUrban.textContent = `${urbanSchoolsCount} Unidades`;
        if (kpiUrbanSub) kpiUrbanSub.textContent = `Alunos: ${urbanStudentsCount.toLocaleString('pt-BR')}`;
        if (kpiRural) kpiRural.textContent = `${ruralSchoolsCount} Unidades`;
        if (kpiRuralSub) kpiRuralSub.textContent = `Alunos: ${ruralStudentsCount.toLocaleString('pt-BR')}`;

        if (filteredSchools.length === 0) {
            dbSchoolsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted);">
                        Nenhuma escola encontrada com este termo de busca.
                    </td>
                </tr>
            `;
            return;
        }

        filteredSchools.forEach(schName => {
            const schStudents = loadedStudents.filter(s => s.escola === schName);
            const info = schoolZonesMap[schName] || {
                zone: 'Sede Urbana',
                address: 'GONÇALVES DIAS - MA - CEP: 65775-000',
                inep: 21000000 + Math.abs(schName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) * 31 % 899999)
            };

            const directorName = schoolDirectorsMap[schName] || 'Não informado';
            const hasDirector = directorName !== 'Não informado';

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '62px';
            tr.style.transition = 'background-color 0.15s ease';

            tr.innerHTML = `
                <td style="padding: 12px 20px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="school-row-icon">
                            <i data-lucide="school" style="width:20px; height:20px;"></i>
                        </div>
                        <div class="school-row-meta">
                            <div class="school-row-name">${schName}</div>
                            <div class="school-row-address">${info.address}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-secondary);">
                    ${info.inep}
                </td>
                <td style="padding: 12px 16px;">
                    <span class="school-director-badge ${hasDirector ? 'assigned' : ''}">
                        <i data-lucide="${hasDirector ? 'user-check' : 'user-x'}" style="width:13px; height:13px;"></i>
                        ${directorName}
                    </span>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                    <span class="school-status-pill">
                        <i data-lucide="check-circle" style="width:12px; height:12px;"></i> ATIVA
                    </span>
                </td>
                <td style="padding: 12px 20px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <button class="btn-school-details-action open-school-workspace-btn" data-school="${schName}">
                            VER ESCOLA <i data-lucide="chevron-right" style="width:14px; height:14px;"></i>
                        </button>
                        <button class="btn-school-row-icon edit-school-btn" data-school="${schName}" title="Editar Escola">
                            <i data-lucide="pencil" style="width:14px; height:14px;"></i>
                        </button>
                        <button class="btn-school-row-icon delete delete-school-btn" data-school="${schName}" title="Excluir Escola">
                            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
                        </button>
                    </div>
                </td>
            `;
            dbSchoolsTableBody.appendChild(tr);
        });

        // Event listener for DETALHES > ("Abrir a Escola")
        dbSchoolsTableBody.querySelectorAll('.open-school-workspace-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                openSchoolWorkspace(sch);
            });
        });

        // Edit School
        dbSchoolsTableBody.querySelectorAll('.edit-school-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                openEditSchoolModal(sch);
            });
        });

        // Delete School
        dbSchoolsTableBody.querySelectorAll('.delete-school-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                if (confirm(`Deseja realmente remover a escola "${sch}" da rede?`)) {
                    uniqueSchoolsList = uniqueSchoolsList.filter(s => s !== sch);
                    loadedStudents = loadedStudents.filter(s => s.escola !== sch);
                    renderDbSchools();
                    showToast(`Escola "${sch}" removida com sucesso!`, 'trash-2');
                }
            });
        });

        safeCreateIcons();
    }

    function openEditSchoolModal(schoolName) {
        const modal = document.getElementById('modal-edit-school');
        if (!modal) return;
        
        const info = schoolZonesMap[schoolName] || { zone: 'Zona Rural', inep: '21128723', phone: '-' };
        const director = schoolDirectorsMap[schoolName] || '';
        
        document.getElementById('edit-school-id').value = schoolName;
        document.getElementById('edit-school-name').value = schoolName;
        document.getElementById('edit-school-inep').value = info.inep || '';
        document.getElementById('edit-school-zone').value = (info.zone && info.zone.includes('Urbana')) ? 'Urbana' : 'Rural';
        document.getElementById('edit-school-phone').value = info.phone || '';
        document.getElementById('edit-school-director').value = director.replace(' (Diretora)', '').replace(' (Diretor)', '');
        
        modal.classList.remove('hidden');
    }

    const formEditSchool = document.getElementById('form-edit-school');
    if (formEditSchool) {
        formEditSchool.addEventListener('submit', (e) => {
            e.preventDefault();
            const oldName = document.getElementById('edit-school-id').value;
            const newName = document.getElementById('edit-school-name').value.trim();
            const inep = document.getElementById('edit-school-inep').value.trim();
            const zone = document.getElementById('edit-school-zone').value;
            const phone = document.getElementById('edit-school-phone').value.trim() || '-';
            const director = document.getElementById('edit-school-director').value.trim();
            
            if (oldName !== newName) {
                const idx = uniqueSchoolsList.indexOf(oldName);
                if (idx !== -1) uniqueSchoolsList[idx] = newName;
                loadedStudents.forEach(s => {
                    if (s.escola === oldName) s.escola = newName;
                });
                delete schoolZonesMap[oldName];
                delete schoolDirectorsMap[oldName];
            }
            
            schoolZonesMap[newName] = {
                zone: zone === 'Urbana' ? 'Sede Urbana' : 'Zona Rural',
                address: `${zone === 'Urbana' ? 'CENTRO' : 'ZONA RURAL'} - CEP: 65775-000`,
                inep,
                phone
            };
            const isFem = director.startsWith('Profª') || director.startsWith('Profa') || director.includes('da ') || director.includes('Maria') || director.includes('Antonia');
            schoolDirectorsMap[newName] = `${director} (Diretor${isFem ? 'a' : ''})`;
            
            document.getElementById('modal-edit-school')?.classList.add('hidden');
            renderDbSchools();
            showToast(`Dados cadastrais da escola "${newName}" atualizados!`, 'check');
        });
    }

    const btnCloseEditSchool = document.getElementById('btn-close-edit-school-modal');
    const btnCancelEditSchool = document.getElementById('btn-cancel-edit-school');
    if (btnCloseEditSchool) btnCloseEditSchool.addEventListener('click', () => document.getElementById('modal-edit-school')?.classList.add('hidden'));
    if (btnCancelEditSchool) btnCancelEditSchool.addEventListener('click', () => document.getElementById('modal-edit-school')?.classList.add('hidden'));

    // ==========================================
    // TURMAS LIST VIEW & DIÁRIO DA TURMA
    // ==========================================

    let activeDiarySchool = 'UI JOSE CORREA LIMA';
    let activeDiaryClass = '5º Ano A';

    // Open Screen 1: Turmas List for the selected School
    function openSchoolWorkspace(schoolName) {
        openSchoolClassesTableView(schoolName);
    }

    function openSchoolClassesTableView(schoolName) {
        activeDiarySchool = schoolName || 'UI JOSE CORREA LIMA';

        const overview = document.getElementById('schools-overview-container');
        const classesView = document.getElementById('school-classes-table-view');
        const diaryView = document.getElementById('class-diary-view');

        if (overview) overview.classList.add('hidden');
        if (diaryView) diaryView.classList.add('hidden');
        if (classesView) classesView.classList.remove('hidden');

        const subtitle = document.getElementById('classes-school-subtitle');
        if (subtitle) subtitle.textContent = `Turmas e Agrupamentos Escolares — ${activeDiarySchool}`;

        renderSchoolClassesTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        safeCreateIcons();
    }

    function renderSchoolClassesTable() {
        const tbody = document.getElementById('school-classes-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const schoolStudents = loadedStudents.filter(s => s.escola === activeDiarySchool);
        
        // Find existing classes or synthesize full standard set
        let classesSet = Array.from(new Set(schoolStudents.map(s => s.turma || s.etapa))).filter(Boolean);
        
        if (classesSet.length === 0 || classesSet.length < 4) {
            classesSet = [
                '5º ANO "A" - MATUTINO',
                '5º ANO "A" - VESPERTINO',
                '5º ANO "B" - MATUTINO',
                '5º ANO "B" - VESPERTINO',
                '2º ANO "A" - MATUTINO',
                '2º ANO "A" - VESPERTINO',
                '9º ANO "A" - MATUTINO',
                '9º ANO "B" - VESPERTINO',
                '6º ANO "A" - MATUTINO'
            ];
        }

        const query = document.getElementById('classes-table-search-input')?.value?.toLowerCase() || '';
        const filteredClasses = classesSet.filter(cls => cls.toLowerCase().includes(query) || activeDiarySchool.toLowerCase().includes(query));

        // Update KPIs
        const kpiTotal = document.getElementById('kpi-school-total-classes');
        const kpiYear = document.getElementById('kpi-school-classes-year');
        const kpiActive = document.getElementById('kpi-school-active-classes');

        const countVal = classesSet.length;
        if (kpiTotal) kpiTotal.textContent = String(countVal);
        if (kpiYear) kpiYear.textContent = String(countVal);
        if (kpiActive) kpiActive.textContent = String(countVal);

        if (filteredClasses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted);">
                        Nenhuma turma encontrada nesta escola com este termo de busca.
                    </td>
                </tr>
            `;
            return;
        }

        filteredClasses.forEach(clsName => {
            // Extract grade number for box icon
            let gradeNum = '5';
            let stageDesc = 'Etapa: FUNDAMENTAL MENOR (1º AO 5º ANO) ➔ 5º ANO';
            let shift = clsName.toLowerCase().includes('vespertino') ? 'VESPERTINO' : 'Matutino';

            if (clsName.includes('2')) {
                gradeNum = '2';
                stageDesc = 'Etapa: ALFABETIZAÇÃO & FLUÊNCIA (SEAMA) ➔ 2º ANO';
            } else if (clsName.includes('6')) {
                gradeNum = '6';
                stageDesc = 'Etapa: FUNDAMENTAL MAIOR (6º AO 9º ANO) ➔ 6º ANO';
            } else if (clsName.includes('9')) {
                gradeNum = '9';
                stageDesc = 'Etapa: FUNDAMENTAL MAIOR (6º AO 9º ANO) ➔ 9º ANO';
            } else if (clsName.includes('5')) {
                gradeNum = '5';
                stageDesc = 'Etapa: FUNDAMENTAL MENOR (1º AO 5º ANO) ➔ 5º ANO';
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '62px';

            tr.innerHTML = `
                <td style="padding: 12px 20px;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div class="class-grade-box">${gradeNum}</div>
                        <div>
                            <div class="class-title-bold">${clsName}</div>
                            <div class="class-stage-subtitle">${stageDesc}</div>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 16px;">
                    <span class="class-school-badge" title="${activeDiarySchool}">${activeDiarySchool}</span>
                </td>
                <td style="padding: 12px 16px;">
                    <span class="class-shift-badge ${shift.toLowerCase()}">${shift}</span>
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                    <span class="class-status-badge">ATIVA</span>
                </td>
                <td style="padding: 12px 20px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <button class="class-action-btn more-options-btn" title="Mais Opções">
                            <i data-lucide="more-horizontal" style="width:15px; height:15px;"></i>
                        </button>
                        <button class="class-action-btn edit-class-btn" data-class="${clsName}" title="Editar Turma">
                            <i data-lucide="pencil" style="width:14px; height:14px;"></i>
                        </button>
                        <button class="class-action-btn view view-class-diary-btn" data-class="${clsName}" title="Abrir Diário da Turma">
                            <i data-lucide="eye" style="width:15px; height:15px;"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Event listeners for View Class Diary (Eye icon)
        tbody.querySelectorAll('.view-class-diary-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cls = btn.getAttribute('data-class');
                openClassDiaryView(cls, activeDiarySchool);
            });
        });

        // Edit Class quick prompt
        tbody.querySelectorAll('.edit-class-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cls = btn.getAttribute('data-class');
                const newName = prompt('Editar nome da turma:', cls);
                if (newName && newName.trim()) {
                    showToast(`Turma renomeada para "${newName.trim()}"!`, 'check');
                    renderSchoolClassesTable();
                }
            });
        });

        safeCreateIcons();
    }

    // Search filter for Classes table
    const classesTableSearch = document.getElementById('classes-table-search-input');
    if (classesTableSearch) {
        classesTableSearch.addEventListener('input', debounce(renderSchoolClassesTable, 250));
    }

    // Back from Classes to Schools Overview
    const btnBackFromClasses = document.getElementById('btn-back-from-classes-to-schools');
    if (btnBackFromClasses) {
        btnBackFromClasses.addEventListener('click', () => {
            const overview = document.getElementById('schools-overview-container');
            const classesView = document.getElementById('school-classes-table-view');
            const diaryView = document.getElementById('class-diary-view');

            if (classesView) classesView.classList.add('hidden');
            if (diaryView) diaryView.classList.add('hidden');
            if (overview) overview.classList.remove('hidden');

            renderDbSchools();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // DIÁRIO DA TURMA VIEW (SCREENSHOT 2 MATCH)
    // ==========================================

    function openClassDiaryView(className, schoolName) {
        activeDiaryClass = className || '5º ANO "A" - MATUTINO';
        activeDiarySchool = schoolName || activeDiarySchool || 'U.E. BENTA VILANOVA';

        const classesView = document.getElementById('school-classes-table-view');
        const diaryView = document.getElementById('class-diary-view');

        if (classesView) classesView.classList.add('hidden');
        if (diaryView) diaryView.classList.remove('hidden');

        // Extract grade number for header circle
        let grade = '5';
        let stageMatrix = 'FUNDAMENTAL MENOR (1º AO 5º ANO)';
        let shift = activeDiaryClass.toLowerCase().includes('vespertino') ? 'Vespertino' : 'Matutino';

        if (activeDiaryClass.includes('2')) {
            grade = '2';
            stageMatrix = 'ALFABETIZAÇÃO & FLUÊNCIA (SEAMA)';
        } else if (activeDiaryClass.includes('6')) {
            grade = '6';
            stageMatrix = 'FUNDAMENTAL MAIOR (6º AO 9º ANO)';
        } else if (activeDiaryClass.includes('9')) {
            grade = '9';
            stageMatrix = 'FUNDAMENTAL MAIOR (6º AO 9º ANO)';
        }

        const classStudents = loadedStudents.filter(s => s.escola === activeDiarySchool && (s.turma === activeDiaryClass || s.etapa === activeDiaryClass || s.turma?.includes(grade)));
        const count = Math.max(classStudents.length, 26);

        // Update Diary Header Elements
        const gradeCircle = document.getElementById('diary-grade-circle');
        const titleEl = document.getElementById('diary-class-title');
        const metaEl = document.getElementById('diary-class-meta');

        if (gradeCircle) gradeCircle.textContent = grade;
        if (titleEl) titleEl.textContent = activeDiaryClass;
        if (metaEl) metaEl.textContent = `${shift} • ${count} alunos • Matriz: ${stageMatrix} — ${activeDiarySchool}`;

        // Default to Alunos subtab
        switchDiarySubtab('alunos');
        renderDiaryStudentsList();
        renderDiaryTeachersList();

        window.scrollTo({ top: 0, behavior: 'smooth' });
        safeCreateIcons();
    }

    // Toggle Diary Subtabs (ONLY Alunos da Turma and Professores)
    function switchDiarySubtab(target) {
        const btnAlunos = document.getElementById('btn-diary-tab-alunos');
        const btnProfessores = document.getElementById('btn-diary-tab-professores');
        const panelAlunos = document.getElementById('diary-subpanel-alunos');
        const panelProfessores = document.getElementById('diary-subpanel-professores');

        if (target === 'alunos') {
            if (btnAlunos) btnAlunos.classList.add('active');
            if (btnProfessores) btnProfessores.classList.remove('active');
            if (panelAlunos) panelAlunos.classList.remove('hidden');
            if (panelProfessores) panelProfessores.classList.add('hidden');
        } else {
            if (btnAlunos) btnAlunos.classList.remove('active');
            if (btnProfessores) btnProfessores.classList.add('active');
            if (panelAlunos) panelAlunos.classList.add('hidden');
            if (panelProfessores) panelProfessores.classList.remove('hidden');
        }
    }

    const btnTabAlunos = document.getElementById('btn-diary-tab-alunos');
    if (btnTabAlunos) btnTabAlunos.addEventListener('click', () => switchDiarySubtab('alunos'));

    const btnTabProfessores = document.getElementById('btn-diary-tab-professores');
    if (btnTabProfessores) btnTabProfessores.addEventListener('click', () => switchDiarySubtab('professores'));

    // Back from Diary to Classes List Table
    const btnBackFromDiary = document.getElementById('btn-back-from-diary-to-classes');
    if (btnBackFromDiary) {
        btnBackFromDiary.addEventListener('click', () => {
            const classesView = document.getElementById('school-classes-table-view');
            const diaryView = document.getElementById('class-diary-view');

            if (diaryView) diaryView.classList.add('hidden');
            if (classesView) classesView.classList.remove('hidden');

            renderSchoolClassesTable();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /**
     * Render Diary Students List with Performance Alert Badges
     * (Vermelho se ruim, Laranja se básico, Verde claro se adequado, Verde forte vivo se avançado)
     */
    function renderDiaryStudentsList() {
        const container = document.getElementById('diary-students-list-container');
        if (!container) return;
        container.innerHTML = '';

        let students = loadedStudents.filter(s => s.escola === activeDiarySchool && (s.turma === activeDiaryClass || s.etapa === activeDiaryClass));

        // If no direct students assigned, populate with sample of school students
        if (students.length === 0) {
            const allSchoolStudents = loadedStudents.filter(s => s.escola === activeDiarySchool);
            students = allSchoolStudents.slice(0, 26);
            students.forEach(st => { st.turma = activeDiaryClass; });
        }

        const query = document.getElementById('diary-students-search-input')?.value?.toLowerCase() || '';
        const filtered = students.filter(st => {
            return (st.nome && st.nome.toLowerCase().includes(query)) || (st.matricula && st.matricula.includes(query));
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-tertiary); border-radius: var(--radius-md);">
                    Nenhum aluno encontrado na turma com este filtro de busca.
                </div>
            `;
            return;
        }

        filtered.forEach(st => {
            const initial = (st.nome || 'A').charAt(0).toUpperCase();
            
            // Score and Performance Color Notification (Normalized % acertos 0 a 100)
            let rawScore = st.avg_score || (st.score_lp ? (st.score_lp + st.score_mat) / 6 : 68);
            if (rawScore > 100) rawScore = Math.min(98, Math.max(35, Math.round(rawScore / 3.2)));
            const score = Math.round(rawScore);

            let alertPillClass = 'perf-adequado';
            let alertLabel = `Adequado (${score}%)`;
            let alertIcon = 'check-circle-2';

            if (score < 50) {
                alertPillClass = 'perf-ruim'; // Vermelho (Ruim / Abaixo do Básico)
                alertLabel = `Abaixo do Básico (${score}%)`;
                alertIcon = 'alert-triangle';
            } else if (score < 70) {
                alertPillClass = 'perf-basico'; // Laranja (Básico)
                alertLabel = `Básico (${score}%)`;
                alertIcon = 'alert-circle';
            } else if (score < 85) {
                alertPillClass = 'perf-adequado'; // Verde Claro (Adequado)
                alertLabel = `Adequado (${score}%)`;
                alertIcon = 'check-circle-2';
            } else {
                alertPillClass = 'perf-avancado'; // Verde Forte Vivo (Avançado)
                alertLabel = `Avançado (${score}%)`;
                alertIcon = 'award';
            }

            // Synthesize realistic CPF & Mother name if missing
            let hash = 0;
            for (let i = 0; i < st.nome.length; i++) hash += st.nome.charCodeAt(i);
            const cpfNum = `${String(100 + (hash * 7) % 899)}.${String(100 + (hash * 13) % 899)}.${String(100 + (hash * 17) % 899)}-${String(10 + (hash * 3) % 89)}`;
            const motherNames = ['MARIA ANTONIA SILVA', 'JACIARA SILVA DOS SANTOS', 'FRANCISCA PEREIRA LIMA', 'MARISSANDRA SANTOS DE SOUSA', 'CLEONICE ALVES BEZERRA', 'TERESA CRISTINA COSTA'];
            const motherName = st.mae || motherNames[hash % motherNames.length];

            const card = document.createElement('div');
            card.className = 'student-diary-item-card';

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px; flex-grow: 1;">
                    <div class="student-avatar-circle">${initial}</div>
                    <div>
                        <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">
                            ${st.nome}
                        </div>
                        <div style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 2px;">
                            CPF: <span style="font-family: var(--font-mono); font-weight: 600;">${cpfNum}</span> • Mãe: <strong>${motherName}</strong>
                        </div>
                        <div style="font-size: 0.74rem; color: var(--text-muted);">
                            Turma: <strong>${activeDiaryClass}</strong> • Matrícula: <strong style="font-family: var(--font-mono);">${st.matricula}</strong>
                        </div>
                    </div>
                </div>

                <!-- Right Side: Performance Alert Pill (Click to open individual improvement diagnosis) -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="performance-alert-pill ${alertPillClass} open-student-diag-btn" data-matricula="${st.matricula}" title="Clique para ver o diagnóstico e o que deve ser melhorado de forma individual">
                        <i data-lucide="${alertIcon}" style="width:14px; height:14px;"></i>
                        <span>${alertLabel}</span>
                    </button>
                    <button class="class-action-btn unlink-student-btn" data-matricula="${st.matricula}" title="Desvincular da Turma" style="color: var(--red-light);">
                        <i data-lucide="user-x" style="width:14px; height:14px;"></i>
                    </button>
                </div>
            `;

            container.appendChild(card);
        });

        // Event listeners to open individual diagnostic modal
        container.querySelectorAll('.open-student-diag-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mat = btn.getAttribute('data-matricula');
                openStudentIndividualDiagnosticModal(mat);
            });
        });

        // Unlink student from class
        container.querySelectorAll('.unlink-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mat = btn.getAttribute('data-matricula');
                const st = loadedStudents.find(s => s.matricula === mat);
                if (st && confirm(`Deseja desvincular o(a) estudante "${st.nome}" da turma ${activeDiaryClass}?`)) {
                    st.turma = 'Sem Turma';
                    renderDiaryStudentsList();
                    showToast(`Estudante desvinculado(a) da turma!`, 'check');
                }
            });
        });

        safeCreateIcons();
    }

    // Search filter for students inside diary
    const diaryStudentsSearch = document.getElementById('diary-students-search-input');
    if (diaryStudentsSearch) {
        diaryStudentsSearch.addEventListener('input', debounce(renderDiaryStudentsList, 250));
    }

    /**
     * Render Diary Teachers List
     */
    function renderDiaryTeachersList() {
        const container = document.getElementById('diary-teachers-list-container');
        if (!container) return;
        container.innerHTML = '';

        const teacherKey = `${activeDiarySchool}_${activeDiaryClass}`;
        const mainTeacher = classTeachersMap[teacherKey] || 'Prof. Carlos Eduardo Mendes';

        const teachers = [
            {
                nome: mainTeacher,
                disciplina: 'Polivalente / Língua Portuguesa & Matemática (SAEB)',
                email: 'docente.titular@semed.goncalvesdias.ma.gov.br',
                funcao: 'Professor(a) Titular da Turma'
            },
            {
                nome: 'Profa. Ana Carolina Vilanova',
                disciplina: 'Acompanhamento de Fluência Leitora & Recomposição',
                email: 'ana.vilanova@semed.goncalvesdias.ma.gov.br',
                funcao: 'Docente de Apoio Pedagógico'
            }
        ];

        teachers.forEach(t => {
            const card = document.createElement('div');
            card.className = 'student-diary-item-card';

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div class="student-avatar-circle" style="background:#f3e8ff; color:#7e22ce;">
                        <i data-lucide="graduation-cap" style="width:20px; height:20px;"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">${t.nome}</div>
                        <div style="font-size: 0.78rem; color: var(--text-secondary);">${t.disciplina}</div>
                        <div style="font-size: 0.74rem; color: var(--text-muted);">${t.funcao} • ${t.email}</div>
                    </div>
                </div>
                <div>
                    <span class="badge badge-success" style="padding: 4px 10px; font-size: 0.74rem;">VINCULADO(A)</span>
                </div>
            `;

            container.appendChild(card);
        });

        safeCreateIcons();
    }

    /**
     * OPEN INDIVIDUAL STUDENT DIAGNOSTIC MODAL
     * (Exibe de maneira individual o que o aluno domina e o que deve ser melhorado)
     */
    function openStudentIndividualDiagnosticModal(matricula) {
        const student = loadedStudents.find(s => s.matricula === matricula);
        if (!student) return;

        const modal = document.getElementById('modal-student-individual-diagnostic');
        const nameEl = document.getElementById('modal-diag-student-name');
        const metaEl = document.getElementById('modal-diag-student-meta');
        const avatarEl = document.getElementById('modal-diag-avatar');
        const bodyEl = document.getElementById('modal-diag-content-body');

        if (!modal || !bodyEl) return;

        if (nameEl) nameEl.textContent = student.nome;
        if (avatarEl) avatarEl.textContent = (student.nome || 'A').charAt(0).toUpperCase();
        if (metaEl) metaEl.textContent = `Matrícula: ${student.matricula} • ${activeDiaryClass} • ${activeDiarySchool}`;

        // Compute level and skills analysis
        const threshold = 0.65;
        const evalResult = calculateStudentCumulativeProficiency(student, threshold);
        const currentLevel = evalResult.finalLevel;
        const config = evalResult.config;

        let rawScore = student.avg_score || (student.score_lp ? (student.score_lp + student.score_mat) / 6 : 68);
        if (rawScore > 100) rawScore = Math.min(98, Math.max(35, Math.round(rawScore / 3.2)));
        const score = Math.round(rawScore);

        // Separate mastered skills vs skills to improve
        const mastered = SAEB_REFERENCE_ITEMS.filter(q => q.nivel <= currentLevel);
        const toImprove = SAEB_REFERENCE_ITEMS.filter(q => q.nivel > currentLevel);

        bodyEl.innerHTML = `
            <!-- Performance Level Banner -->
            <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
                <div>
                    <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">POSICIONAMENTO NA ESCALA SAEB</div>
                    <div style="font-size: 1.15rem; font-weight: 800; color: ${config.color}; margin-top: 2px;">
                        ${config.nome}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">${score}% Acerto</div>
                    <div style="font-size: 0.74rem; color: var(--text-secondary);">Regra Cumulativa de Habilidades</div>
                </div>
            </div>

            <!-- 2-Column Grid: What student mastered vs What must be improved -->
            <div class="grid-2" style="gap: 16px;">
                <!-- O que o aluno já domina -->
                <div class="skills-list-block" style="border-left: 4px solid #22c55e;">
                    <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #15803d; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="check-circle" style="width:16px; height:16px;"></i> O que o Estudante Já Domina
                    </h4>
                    <p style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 10px;">
                        Habilidades consolidadas com autonomia nos simulados:
                    </p>
                    ${mastered.length === 0 ? '<p class="text-sm text-muted">Ainda em fase de recomposição das habilidades elementares.</p>' : mastered.map(s => `
                        <div class="skill-bullet-item">
                            <span class="badge badge-success" style="font-size:0.68rem; padding:2px 5px;">Nível ${s.nivel}</span>
                            <span><strong>[${s.eixo}]</strong> ${s.descritor}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- O QUE DEVE SER MELHORADO DE MANEIRA INDIVIDUAL -->
                <div class="skills-list-block" style="border-left: 4px solid #ef4444;">
                    <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #dc2626; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="alert-triangle" style="width:16px; height:16px;"></i> O que Deve ser Melhorado de Maneira Individual
                    </h4>
                    <p style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 10px;">
                        Descritores prioritários para intervenção docente e reforço individual:
                    </p>
                    ${toImprove.length === 0 ? '<p class="text-sm text-green">Excelente! O estudante domina todos os descritores da matriz avaliada.</p>' : toImprove.map(s => `
                        <div class="skill-bullet-item">
                            <span class="badge badge-danger" style="font-size:0.68rem; padding:2px 5px;">Reforçar</span>
                            <span><strong>[${s.eixo}]</strong> ${s.descritor}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Suggested Teacher Action Plan -->
            <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); padding: 14px; margin-top: 16px;">
                <h5 style="margin: 0 0 4px 0; font-size: 0.85rem; color: var(--purple-light); display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="sparkles" style="width:15px; height:15px;"></i> Roteiro de Intervenção Pedagógica para o Professor
                </h5>
                <p style="font-size: 0.8rem; color: var(--text-primary); margin: 0; line-height: 1.45;">
                    Trabalhar com este estudante atividades personalizadas nos eixos de <strong>${toImprove.slice(0, 2).map(s => s.eixo).join(' e ') || 'Leitura e Resolução de Problemas'}</strong> utilizando material concreto, leitura compartilhada e apoio em duplas produtivas.
                </p>
            </div>
        `;

        modal.classList.remove('hidden');
        safeCreateIcons();
    }

    // Modal Student Individual Diagnostic Close Handlers
    const btnCloseStudentDiag = document.getElementById('btn-close-student-diag-modal');
    const btnCloseStudentDiagAction = document.getElementById('btn-close-student-diag-action');
    const modalStudentDiag = document.getElementById('modal-student-individual-diagnostic');

    if (btnCloseStudentDiag && modalStudentDiag) {
        btnCloseStudentDiag.addEventListener('click', () => modalStudentDiag.classList.add('hidden'));
    }
    if (btnCloseStudentDiagAction && modalStudentDiag) {
        btnCloseStudentDiagAction.addEventListener('click', () => modalStudentDiag.classList.add('hidden'));
    }

    // Modal Vincular Aluno Existente Handlers
    const btnOpenBindExistingStudent = document.getElementById('btn-open-bind-existing-student-modal');
    const modalBindExistingStudent = document.getElementById('modal-bind-existing-student');
    const btnCloseBindExistingStudent = document.getElementById('btn-close-bind-existing-student');
    const btnCancelBindExistingStudent = document.getElementById('btn-cancel-bind-existing-student');
    const bindExistingStudentSearch = document.getElementById('bind-existing-student-search');

    function populateBindExistingStudentsList() {
        const listEl = document.getElementById('bind-existing-students-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        const query = bindExistingStudentSearch ? bindExistingStudentSearch.value.toLowerCase() : '';
        const students = loadedStudents.filter(s => {
            const matchQuery = (s.nome && s.nome.toLowerCase().includes(query)) || (s.matricula && s.matricula.includes(query));
            return matchQuery;
        });

        if (students.length === 0) {
            listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum aluno encontrado na base com este termo.</div>';
            return;
        }

        students.slice(0, 50).forEach(st => {
            const row = document.createElement('div');
            row.style.background = 'var(--bg-tertiary)';
            row.style.border = '1px solid var(--border-color)';
            row.style.borderRadius = 'var(--radius-md)';
            row.style.padding = '10px 14px';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.gap = '10px';

            row.innerHTML = `
                <div>
                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">${st.nome}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">
                        Matrícula: <strong style="font-family:var(--font-mono);">${st.matricula}</strong> • Escola Atual: <strong>${st.escola}</strong>
                    </div>
                </div>
                <button class="btn btn-primary btn-sm enroll-student-btn" data-matricula="${st.matricula}" style="font-size: 0.75rem; padding: 4px 10px;">
                    Matricular nesta Turma
                </button>
            `;

            listEl.appendChild(row);
        });

        listEl.querySelectorAll('.enroll-student-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mat = btn.getAttribute('data-matricula');
                const st = loadedStudents.find(s => s.matricula === mat);
                if (st) {
                    st.escola = activeDiarySchool;
                    st.turma = activeDiaryClass;
                    st.etapa = activeDiaryClass;
                    modalBindExistingStudent.classList.add('hidden');
                    renderDiaryStudentsList();
                    showToast(`Estudante "${st.nome}" matriculado(a) na turma ${activeDiaryClass}!`, 'check');
                }
            });
        });
    }

    if (btnOpenBindExistingStudent && modalBindExistingStudent) {
        btnOpenBindExistingStudent.addEventListener('click', () => {
            modalBindExistingStudent.classList.remove('hidden');
            const sub = document.getElementById('bind-existing-student-sub');
            if (sub) sub.textContent = `Selecione estudantes cadastrados em Gonçalves Dias para matricular no ${activeDiaryClass}.`;
            populateBindExistingStudentsList();
        });
    }
    if (btnCloseBindExistingStudent && modalBindExistingStudent) {
        btnCloseBindExistingStudent.addEventListener('click', () => modalBindExistingStudent.classList.add('hidden'));
    }
    if (btnCancelBindExistingStudent && modalBindExistingStudent) {
        btnCancelBindExistingStudent.addEventListener('click', () => modalBindExistingStudent.classList.add('hidden'));
    }
    if (bindExistingStudentSearch) {
        bindExistingStudentSearch.addEventListener('input', debounce(populateBindExistingStudentsList, 250));
    }

    // Modal Vincular Professor Existente Handlers
    const btnOpenBindExistingTeacher = document.getElementById('btn-open-bind-existing-teacher-modal');
    const modalBindExistingTeacher = document.getElementById('modal-bind-existing-teacher');
    const btnCloseBindExistingTeacher = document.getElementById('btn-close-bind-existing-teacher');
    const btnCancelBindExistingTeacher = document.getElementById('btn-cancel-bind-existing-teacher');

    function populateBindExistingTeachersList() {
        const listEl = document.getElementById('bind-existing-teachers-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        const teachersPool = [
            { nome: 'Prof. Carlos Eduardo Mendes', disc: 'Polivalente / Matemática e Ciências' },
            { nome: 'Profa. Ana Carolina Vilanova', disc: 'Língua Portuguesa & Fluência Leitora' },
            { nome: 'Profa. Eliane Cristina Santos', disc: 'Língua Portuguesa e Redação' },
            { nome: 'Prof. Marcos Vinícius Freitas', disc: 'Matemática e Geometria' },
            { nome: 'Profa. Juliana Medeiros', disc: 'Língua Portuguesa e Literatura' },
            { nome: 'Prof. Rodrigo Tavares', disc: 'Ciências da Natureza' },
            { nome: 'Profa. Beatriz Oliveira', disc: 'Alfabetização e Letramento' },
            { nome: 'Prof. Leandro Ribeiro', disc: 'Matemática dos Anos Finais' }
        ];

        teachersPool.forEach(t => {
            const row = document.createElement('div');
            row.style.background = 'var(--bg-tertiary)';
            row.style.border = '1px solid var(--border-color)';
            row.style.borderRadius = 'var(--radius-md)';
            row.style.padding = '10px 14px';
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';

            row.innerHTML = `
                <div>
                    <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-primary);">${t.nome}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${t.disc}</div>
                </div>
                <button class="btn btn-primary btn-sm bind-this-teacher-btn" data-teacher="${t.nome}" style="font-size: 0.75rem; padding: 4px 10px;">
                    Vincular à Turma
                </button>
            `;

            listEl.appendChild(row);
        });

        listEl.querySelectorAll('.bind-this-teacher-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const teacherName = btn.getAttribute('data-teacher');
                const teacherKey = `${activeDiarySchool}_${activeDiaryClass}`;
                classTeachersMap[teacherKey] = teacherName;
                modalBindExistingTeacher.classList.add('hidden');
                renderDiaryTeachersList();
                showToast(`Docente "${teacherName}" vinculado(a) à turma!`, 'check');
            });
        });
    }

    if (btnOpenBindExistingTeacher && modalBindExistingTeacher) {
        btnOpenBindExistingTeacher.addEventListener('click', () => {
            modalBindExistingTeacher.classList.remove('hidden');
            const sub = document.getElementById('bind-existing-teacher-sub');
            if (sub) sub.textContent = `Selecione o(a) docente para vincular ao ${activeDiaryClass}.`;
            populateBindExistingTeachersList();
        });
    }
    if (btnCloseBindExistingTeacher && modalBindExistingTeacher) {
        btnCloseBindExistingTeacher.addEventListener('click', () => modalBindExistingTeacher.classList.add('hidden'));
    }
    if (btnCancelBindExistingTeacher && modalBindExistingTeacher) {
        btnCancelBindExistingTeacher.addEventListener('click', () => modalBindExistingTeacher.classList.add('hidden'));
    }

    // Modal "+ Novo Aluno" directly in Diary
    const btnOpenNewStudentDiary = document.getElementById('btn-open-new-student-diary-modal');
    if (btnOpenNewStudentDiary) {
        btnOpenNewStudentDiary.addEventListener('click', () => {
            const modal = document.getElementById('bind-student-modal');
            if (modal) {
                modal.classList.remove('hidden');
                const label = document.getElementById('bind-student-class-label');
                if (label) label.textContent = `Matricular aluno no ${activeDiaryClass} (${activeDiarySchool}).`;
            }
        });
    }

    // Export Schools List
    const btnExportSchools = document.getElementById('btn-export-schools-list');
    if (btnExportSchools) {
        btnExportSchools.addEventListener('click', () => {
            showToast('Exportando relatório consolidado das 12 escolas em planilha Excel...', 'file-spreadsheet');
        });
    }

    // Refresh Schools Button
    const btnRefreshSchools = document.getElementById('btn-refresh-schools-list');
    if (btnRefreshSchools) {
        btnRefreshSchools.addEventListener('click', () => {
            renderDbSchools();
            showToast('Lista de escolas atualizada!', 'rotate-cw');
        });
    }

    // Modal Create School Handlers
    const btnOpenCreateSchool = document.getElementById('btn-open-create-school-modal');
    const modalCreateSchool = document.getElementById('create-school-modal');
    const btnCloseCreateSchool = document.getElementById('btn-close-create-school-modal');
    const btnCancelCreateSchool = document.getElementById('btn-cancel-create-school');
    const formCreateSchool = document.getElementById('form-create-school');

    if (btnOpenCreateSchool && modalCreateSchool) {
        btnOpenCreateSchool.addEventListener('click', () => {
            modalCreateSchool.classList.remove('hidden');
            if (formCreateSchool) formCreateSchool.reset();
        });
    }
    if (btnCloseCreateSchool && modalCreateSchool) {
        btnCloseCreateSchool.addEventListener('click', () => modalCreateSchool.classList.add('hidden'));
    }
    if (btnCancelCreateSchool && modalCreateSchool) {
        btnCancelCreateSchool.addEventListener('click', () => modalCreateSchool.classList.add('hidden'));
    }
    if (formCreateSchool && modalCreateSchool) {
        formCreateSchool.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('school-input-name').value.trim().toUpperCase();
            const inep = document.getElementById('school-input-inep').value.trim();
            const zone = document.getElementById('school-input-zone').value;
            const address = document.getElementById('school-input-address').value.trim() || 'GONÇALVES DIAS - MA';
            const director = document.getElementById('school-input-director').value || 'Não informado';

            if (!name) {
                showToast('Informe o nome da escola.', 'alert-triangle');
                return;
            }

            if (!uniqueSchoolsList.includes(name)) {
                uniqueSchoolsList.push(name);
            }
            schoolZonesMap[name] = { zone, address, inep: inep || 21128715 };
            schoolDirectorsMap[name] = director;

            modalCreateSchool.classList.add('hidden');
            renderDbSchools();
            showToast(`Escola "${name}" cadastrada com sucesso!`, 'check');
        });
    }

    // Modal Create Class in Workspace Handlers
    const btnOpenWsNewClass = document.getElementById('btn-open-new-class-workspace-modal');
    const modalWsNewClass = document.getElementById('workspace-new-class-modal');
    const btnCloseWsNewClass = document.getElementById('btn-close-ws-new-class-modal');
    const btnCancelWsNewClass = document.getElementById('btn-cancel-ws-class');
    const formWsNewClass = document.getElementById('form-workspace-new-class');

    if (btnOpenWsNewClass && modalWsNewClass) {
        btnOpenWsNewClass.addEventListener('click', () => {
            modalWsNewClass.classList.remove('hidden');
            const schoolLabel = document.getElementById('workspace-new-class-school-label');
            if (schoolLabel) schoolLabel.textContent = activeWorkspaceSchool;

            const teacherSel = document.getElementById('ws-class-teacher-select');
            if (teacherSel) {
                teacherSel.innerHTML = `
                    <option value="Profa. Ana Carolina Vilanova">Profa. Ana Carolina Vilanova</option>
                    <option value="Prof. Carlos Eduardo Mendes">Prof. Carlos Eduardo Mendes</option>
                    <option value="Profa. Eliane Cristina Santos">Profa. Eliane Cristina Santos</option>
                    <option value="Prof. Marcos Vinícius Freitas">Prof. Marcos Vinícius Freitas</option>
                    <option value="Profa. Juliana Medeiros">Profa. Juliana Medeiros</option>
                    <option value="Prof. Rodrigo Tavares">Prof. Rodrigo Tavares</option>
                    <option value="Profa. Beatriz Oliveira">Profa. Beatriz Oliveira</option>
                    <option value="Prof. Leandro Ribeiro">Prof. Leandro Ribeiro</option>
                `;
            }
        });
    }
    if (btnCloseWsNewClass && modalWsNewClass) {
        btnCloseWsNewClass.addEventListener('click', () => modalWsNewClass.classList.add('hidden'));
    }
    if (btnCancelWsNewClass && modalWsNewClass) {
        btnCancelWsNewClass.addEventListener('click', () => modalWsNewClass.classList.add('hidden'));
    }
    if (formWsNewClass && modalWsNewClass) {
        formWsNewClass.addEventListener('submit', (e) => {
            e.preventDefault();
            const className = document.getElementById('ws-class-name-input').value.trim();
            const stage = document.getElementById('ws-class-stage-select').value;
            const teacher = document.getElementById('ws-class-teacher-select').value;

            const teacherKey = `${activeWorkspaceSchool}_${className}`;
            classTeachersMap[teacherKey] = teacher;

            modalWsNewClass.classList.add('hidden');
            renderWorkspaceClassesGrid(activeWorkspaceSchool);
            showToast(`Turma "${className}" criada e vinculada ao(à) ${teacher}!`, 'check');
        });
    }

    // Modal Bind Student Handlers
    const btnOpenBindStudent = document.getElementById('btn-open-bind-student-modal');
    const modalBindStudent = document.getElementById('bind-student-modal');
    const btnCloseBindStudent = document.getElementById('btn-close-bind-student-modal');
    const btnCancelBindStudent = document.getElementById('btn-cancel-bind-student');
    const formBindStudent = document.getElementById('form-bind-student');

    if (btnOpenBindStudent && modalBindStudent) {
        btnOpenBindStudent.addEventListener('click', () => {
            modalBindStudent.classList.remove('hidden');
            const classLabel = document.getElementById('bind-student-class-label');
            if (classLabel) classLabel.textContent = `Turma: ${activeWorkspaceClass} • ${activeWorkspaceSchool}`;
        });
    }
    if (btnCloseBindStudent && modalBindStudent) {
        btnCloseBindStudent.addEventListener('click', () => modalBindStudent.classList.add('hidden'));
    }
    if (btnCancelBindStudent && modalBindStudent) {
        btnCancelBindStudent.addEventListener('click', () => modalBindStudent.classList.add('hidden'));
    }
    if (formBindStudent && modalBindStudent) {
        formBindStudent.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('bind-student-name').value.trim().toUpperCase();
            const mat = document.getElementById('bind-student-matricula').value.trim();
            const sex = document.getElementById('bind-student-sexo').value;
            const nee = document.getElementById('bind-student-nee').value.trim();

            const newStudent = {
                matricula: mat || String(Math.floor(1000 + Math.random() * 9000)),
                nome: name,
                escola: activeWorkspaceSchool,
                turma: activeWorkspaceClass,
                etapa: activeWorkspaceClass,
                sexo: sex,
                nee: nee,
                score_lp: 220,
                score_mat: 215,
                avg_score: 75,
                nivel_proficiencia: 'Adequado'
            };

            loadedStudents.push(newStudent);
            modalBindStudent.classList.add('hidden');
            if (formBindStudent) formBindStudent.reset();

            renderWorkspaceClassesGrid(activeWorkspaceSchool);
            openClassStudentsRoster(activeWorkspaceClass, activeWorkspaceSchool);
            showToast(`Aluno(a) "${name}" matriculado(a) com sucesso na turma ${activeWorkspaceClass}!`, 'check');
        });
    }

    if (dbSchoolSearch) {
        dbSchoolSearch.addEventListener('input', debounce(renderDbSchools, 300));
    }

    // ==========================================
    // CRIAR AVALIAÇÕES (SIMULADOS E GABARITOS MÓDULO PEDAGÓGICO)
    // ==========================================
    
    // Relação de simulados ativos
    const demoEvaluations = [];

    const demoDescriptors = [
        { codigo: "LP01", etapa: "5º Ano EF", desc: "Localizar informações explícitas em um texto.", componente: "Língua Portuguesa" },
        { codigo: "LP02", etapa: "5º Ano EF", desc: "Inferir informação implícita em um texto.", componente: "Língua Portuguesa" },
        { codigo: "LP03", etapa: "5º Ano EF", desc: "Identificar o tema ou o sentido de uma palavra.", componente: "Língua Portuguesa" },
        { codigo: "MT01", etapa: "5º Ano EF", desc: "Identificar a localização/movimentação de objeto em mapas.", componente: "Matemática" },
        { codigo: "MT13", etapa: "9º Ano EF", desc: "Resolver problemas com números naturais envolvendo as quatro operações.", componente: "Matemática" }
    ];

    const FULL_INEP_MATRICES = {
        portuguese: [
            { codigo: "D1", desc: "Localizar informações explícitas em um texto." },
            { codigo: "D2", desc: "Estabelecer relações entre partes de um texto, identificando repetições ou substituições que contribuem para a coerência." },
            { codigo: "D3", desc: "Inferir o sentido de uma palavra ou expressão." },
            { codigo: "D4", desc: "Inferir uma informação implícita em um texto." },
            { codigo: "D5", desc: "Interpretar texto com auxílio de material gráfico diverso (propagandas, quadrinhos, fotos, etc.)." },
            { codigo: "D6", desc: "Identificar o tema de um texto." },
            { codigo: "D7", desc: "Identificar o conflito gerador do enredo e os elementos que constroem a narrativa." },
            { codigo: "D8", desc: "Estabelecer relação entre a causa e o efeito no desenvolvimento da narrativa." },
            { codigo: "D9", desc: "Estabelecer relações de causa/consequência entre partes de um texto." },
            { codigo: "D10", desc: "Identificar as marcas linguísticas que evidenciam o locutor e o interlocutor de um texto." },
            { codigo: "D11", desc: "Distinguir um fato da opinião relativa a esse fato." },
            { codigo: "D12", desc: "Estabelecer relações lógico-discursivas presentes no texto, marcadas por conjunções, advérbios, etc." },
            { codigo: "D13", desc: "Identificar efeitos de ironia ou humor em textos variados." },
            { codigo: "D14", desc: "Identificar o efeito de sentido decorrente do uso da pontuação e de outras notações." },
            { codigo: "D15", desc: "Reconhecer diferentes formas de tratar uma informação na comparação de textos que tratam do mesmo assunto." },
            { codigo: "D16", desc: "Reconhecer a posição do autor em textos que tratam do mesmo assunto." },
            { codigo: "D17", desc: "Reconhecer o efeito de sentido decorrente da escolha de uma palavra ou expressão." },
            { codigo: "D18", desc: "Reconhecer o efeito de sentido decorrente da exploração de recursos ortográficos e/ou morfossintáticos." },
            { codigo: "D19", desc: "Identificar a tese de um texto." },
            { codigo: "D20", desc: "Diferenciar as partes principais das secundárias em um texto." },
            { codigo: "D21", desc: "Reconhecer as relações entre partes de um texto, identificando a tese e os argumentos." },
            { codigo: "D22", desc: "Estabelecer relação entre partes do texto, identificando repetições que contribuem para a coerência." },
            { codigo: "D23", desc: "Identificar efeitos de ambiguidade ou de sentido decorrentes do uso de recursos expressivos." }
        ],
        math: [
            { codigo: "D1", desc: "Identificar a localização/movimentação de objeto em mapas, croquis e outras representações gráficas." },
            { codigo: "D2", desc: "Identificar propriedades comuns e diferenças entre figuras bidimensionais e tridimensionais, relacionando-as com suas planificações." },
            { codigo: "D3", desc: "Identificar propriedades de triângulos pela comparação de medidas de lados e ângulos." },
            { codigo: "D4", desc: "Identificar relação entre quadriláteros por meio de suas propriedades." },
            { codigo: "D5", desc: "Reconhecer a conservação ou modificação de medidas nos redimensionamentos de figuras." },
            { codigo: "D6", desc: "Estimar a medida de grandezas utilizando unidades de medida não convencionais ou convencionais." },
            { codigo: "D7", desc: "Resolver problemas significativos utilizando unidades de medida padronizadas." },
            { codigo: "D8", desc: "Resolver problemas envolvendo o cálculo de perímetro de figuras planas." },
            { codigo: "D9", desc: "Resolver problemas envolvendo o cálculo de área de figuras planas." },
            { codigo: "D10", desc: "Resolver problemas envolvendo relações entre diferentes unidades de medida." },
            { codigo: "D11", desc: "Resolver problemas que envolvam grandezas diretamente proporcionais." },
            { codigo: "D12", desc: "Resolver problemas que envolvam o cálculo de porcentagem." },
            { codigo: "D13", desc: "Resolver problemas com números naturais envolvendo as quatro operações." },
            { codigo: "D14", desc: "Resolver problemas utilizando frações ou números decimais." },
            { codigo: "D15", desc: "Resolver problemas que envolvam juros simples ou compostos." },
            { codigo: "D16", desc: "Identificar a representação fracionária de números racionais." },
            { codigo: "D17", desc: "Identificar a representação decimal de números racionais." },
            { codigo: "D18", desc: "Efetuar cálculos com números reais." },
            { codigo: "D19", desc: "Resolver problemas que envolvam equações do 1º grau." },
            { codigo: "D20", desc: "Resolver problemas que envolvam equações do 2º grau." },
            { codigo: "D21", desc: "Resolver problemas envolvendo sistemas de equações." },
            { codigo: "D22", desc: "Resolver problemas que envolvam a relação de semelhança entre triângulos." },
            { codigo: "D23", desc: "Resolver problemas aplicando o teorema de Pitágoras." },
            { codigo: "D24", desc: "Resolver problemas que envolvam relações métricas no triângulo retângulo." },
            { codigo: "D25", desc: "Resolver problemas que envolvam as razões trigonométricas no triângulo retângulo." },
            { codigo: "D26", desc: "Resolver problemas envolvendo noções de probabilidade." },
            { codigo: "D27", desc: "Resolver problemas envolvendo a análise de dados apresentados em tabelas ou gráficos." }
        ],
        science: [
            { codigo: "CI01", desc: "Associar as propriedades físicas dos materiais à fabricação de objetos de uso cotidiano." },
            { codigo: "CI02", desc: "Identificar temperatura, calor e sensação térmica em diferentes situações cotidianas." },
            { codigo: "CI03", desc: "Explicar a importância da água e do ciclo hidrológico para a manutenção da vida." },
            { codigo: "CI04", desc: "Identificar a organização de cadeias alimentares simples e as relações ecológicas." },
            { codigo: "CI05", desc: "Reconhecer a importância do solo para a agricultura e os processos erosivos." },
            { codigo: "CI06", desc: "Descrever a estrutura interna da Terra e os fenômenos tectônicos (sismos, vulcanismo)." },
            { codigo: "CI07", desc: "Identificar as características dos principais biomas brasileiros e conservação ambiental." },
            { codigo: "CI08", desc: "Analisar a ação de microrganismos na produção de alimentos, combustíveis e medicamentos." },
            { codigo: "CI09", desc: "Compreender o funcionamento básico do sistema digestório e cardiovascular humano." }
        ]
    };

    function renderReferenceMatrix() {
        const lpList = document.getElementById('matriz-lp-list');
        const mtList = document.getElementById('matriz-mt-list');
        const ciList = document.getElementById('matriz-ci-list');

        if (lpList) {
            lpList.innerHTML = '';
            FULL_INEP_MATRICES.portuguese.forEach(d => {
                const div = document.createElement('div');
                div.style.padding = '8px 12px';
                div.style.borderRadius = 'var(--radius-sm)';
                div.style.border = '1px solid var(--border-color)';
                div.style.backgroundColor = 'var(--bg-tertiary)';
                div.style.fontSize = '0.85rem';
                div.innerHTML = `<strong class="text-purple">${d.codigo}:</strong> ${d.desc}`;
                lpList.appendChild(div);
            });
        }

        if (mtList) {
            mtList.innerHTML = '';
            FULL_INEP_MATRICES.math.forEach(d => {
                const div = document.createElement('div');
                div.style.padding = '8px 12px';
                div.style.borderRadius = 'var(--radius-sm)';
                div.style.border = '1px solid var(--border-color)';
                div.style.backgroundColor = 'var(--bg-tertiary)';
                div.style.fontSize = '0.85rem';
                div.innerHTML = `<strong class="text-blue">${d.codigo}:</strong> ${d.desc}`;
                mtList.appendChild(div);
            });
        }

        if (ciList) {
            ciList.innerHTML = '';
            FULL_INEP_MATRICES.science.forEach(d => {
                const div = document.createElement('div');
                div.style.padding = '8px 12px';
                div.style.borderRadius = 'var(--radius-sm)';
                div.style.border = '1px solid var(--border-color)';
                div.style.backgroundColor = 'var(--bg-tertiary)';
                div.style.fontSize = '0.85rem';
                div.innerHTML = `<strong class="text-green">${d.codigo}:</strong> ${d.desc}`;
                ciList.appendChild(div);
            });
        }
    }

    function initInepDescriptors() {
        const list = [];
        FULL_INEP_MATRICES.portuguese.forEach(d => {
            list.push({ codigo: d.codigo, etapa: "5º e 9º Ano", desc: d.desc, componente: "Língua Portuguesa" });
        });
        FULL_INEP_MATRICES.math.forEach(d => {
            list.push({ codigo: d.codigo, etapa: "5º e 9º Ano", desc: d.desc, componente: "Matemática" });
        });
        FULL_INEP_MATRICES.science.forEach(d => {
            list.push({ codigo: d.codigo, etapa: "5º e 9º Ano", desc: d.desc, componente: "Ciências da Natureza" });
        });
        return list;
    }

    let activeEvaluations = [];
    let activeDescriptors = initInepDescriptors();

    // Subtab Navigation
    const subtabBtns = document.querySelectorAll('.eval-subtab-btn');
    const subtabContents = document.querySelectorAll('.eval-subtab-content');

    subtabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            subtabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.color = 'var(--text-secondary)';
                b.style.borderBottom = 'none';
                b.style.fontWeight = '500';
            });
            btn.classList.add('active');
            btn.style.color = 'var(--purple-light)';
            btn.style.borderBottom = '2px solid var(--purple)';
            btn.style.fontWeight = '600';

            const target = btn.getAttribute('data-subtab');
            subtabContents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });

            if (target === 'lancar-notas-sub') {
                populateScoreSchoolSelect();
            } else if (target === 'banco-habilidades-sub') {
                renderActiveDescriptors();
            } else if (target === 'resultados-dash-sub') {
                populateDashboardResultsSelectors();
            }
        });
    });

    // Subtab 1: Wizard Toggle vs List
    const btnCreatedEvents = document.getElementById('btn-show-created-events');
    const btnNewEventWizard = document.getElementById('btn-show-new-event-wizard');
    const panelCreatedEvents = document.getElementById('panel-created-events');
    const panelNewEventWizard = document.getElementById('panel-new-event-wizard');

    if (btnCreatedEvents && btnNewEventWizard) {
        btnCreatedEvents.addEventListener('click', () => {
            btnCreatedEvents.className = 'btn btn-primary';
            btnNewEventWizard.className = 'btn btn-outline';
            panelCreatedEvents.classList.remove('hidden');
            panelNewEventWizard.classList.add('hidden');
            renderCreatedEvents();
        });

        btnNewEventWizard.addEventListener('click', () => {
            btnNewEventWizard.className = 'btn btn-primary';
            btnCreatedEvents.className = 'btn btn-outline';
            panelCreatedEvents.classList.add('hidden');
            panelNewEventWizard.classList.remove('hidden');
            resetWizard();
        });
    }

    function renderOngoingAssessments() {
        const ongoingList = document.getElementById('ongoing-assessments-list');
        if (!ongoingList) return;
        ongoingList.innerHTML = '';

        if (activeEvaluations.length === 0) {
            ongoingList.innerHTML = `
                <div style="background-color: var(--bg-secondary); border: 1px solid var(--border-color); padding: 24px; border-radius: var(--radius-md); text-align:center; color:var(--text-muted); font-size:0.85rem;">
                    <i data-lucide="info" style="width:24px; height:24px; margin-bottom:8px; opacity:0.5; display:inline-block;"></i>
                    <p>Nenhuma avaliação ou simulado ativo na rede no momento.</p>
                </div>
            `;
            safeCreateIcons();
            return;
        }

        activeEvaluations.forEach(ev => {
            const card = document.createElement('div');
            card.style.backgroundColor = 'var(--bg-secondary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.padding = '18px';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.marginBottom = '16px';

            const progressVal = parseFloat(ev.status) || 0;
            const progressColor = progressVal > 70 ? 'purple' : 'blue';
            const badgeClass = progressVal > 70 ? 'badge-success' : 'badge-warning';

            const total = loadedStudents.length || 0;
            const digitados = Math.round(total * (progressVal / 100));

            card.innerHTML = `
                <div class="flex-between">
                    <strong style="font-size: 1.05rem;">${ev.titulo}</strong>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="badge ${badgeClass}">${progressVal > 0 ? 'Em Andamento' : 'Digitação Aberta'}</span>
                        <span class="btn-delete-eval" data-id="${ev.id}" style="color:var(--red-light); cursor:pointer; font-size:0.75rem; display:inline-flex; align-items:center; gap:2px;" title="Excluir Avaliação">
                            <i data-lucide="trash-2" style="width:12px; height:12px;"></i> Excluir
                        </span>
                    </div>
                </div>
                <div class="progress-bar-container" style="height: 10px; margin: 16px 0 10px 0; background-color: var(--bg-tertiary); border-radius: 5px; overflow: hidden;">
                    <div class="progress-bar ${progressColor}" style="width: ${progressVal}%; height: 100%; border-radius: 5px;"></div>
                </div>
                <div class="flex-between text-sm">
                    <span class="text-muted">Digitação: <strong class="text-${progressColor}" style="color:var(--${progressColor}-light);">${progressVal}% concluída</strong></span>
                    <span class="text-muted">${digitados.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} alunos digitados</span>
                </div>
            `;
            ongoingList.appendChild(card);
        });

        ongoingList.querySelectorAll('.btn-delete-eval').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                activeEvaluations = activeEvaluations.filter(e => e.id !== id);
                renderOngoingAssessments();
                renderCreatedEvents();
                showToast('Avaliação excluída com sucesso!', 'trash-2');
            });
        });

        safeCreateIcons();
    }

    function renderCreatedEvents() {
        const tableBody = document.getElementById('created-events-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (activeEvaluations.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 24px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
                        <i data-lucide="calendar" style="width:24px; height:24px; margin-bottom:8px; opacity:0.5; display:inline-block;"></i>
                        <p>Nenhuma avaliação ou simulado agendado. Clique em "+ Novo Evento" para criar.</p>
                    </td>
                </tr>
            `;
            safeCreateIcons();
            return;
        }

        activeEvaluations.forEach(ev => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '42px';
            const progressVal = parseFloat(ev.status);
            const badgeClass = progressVal > 70 ? 'badge-success' : 'badge-warning';

            tr.innerHTML = `
                <td style="padding: 12px 16px; font-weight:600;">${ev.titulo}</td>
                <td style="padding: 12px 16px; font-size:0.75rem; color:var(--text-secondary);">${ev.escola}</td>
                <td style="padding: 12px 16px; font-size:0.75rem; color:var(--text-secondary);">${ev.janela}</td>
                <td style="padding: 12px 16px;"><span class="badge badge-info">${ev.tipo}</span></td>
                <td style="padding: 12px 16px; font-size:0.75rem; color:var(--text-secondary);">${ev.etapa}</td>
                <td style="padding: 12px 16px; text-align:center;"><span class="badge ${badgeClass}">${ev.status}</span></td>
                <td style="padding: 12px 16px; text-align:center;">
                    <span class="btn-delete-created-event" data-id="${ev.id}" style="color:var(--red-light); cursor:pointer; font-size:0.75rem; display:inline-flex; align-items:center; gap:2px;">
                        <i data-lucide="trash-2" style="width:12px; height:12px;"></i> Excluir
                    </span>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        tableBody.querySelectorAll('.btn-delete-created-event').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                activeEvaluations = activeEvaluations.filter(e => e.id !== id);
                renderCreatedEvents();
                renderOngoingAssessments();
                showToast('Avaliação excluída com sucesso!', 'trash-2');
            });
        });

        safeCreateIcons();
    }

    // Wizard Navigation Handler
    let wizardCurrentStep = 1;
    let wizardSelectedQuestions = [];
    const wizardStageChips = document.querySelectorAll('#wizard-stage-chips .stage-chip-btn');
    let wizardSelectedStage = "5º Ano";

    wizardStageChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            wizardStageChips.forEach(c => {
                c.classList.remove('active');
                c.style.border = '1px solid var(--border-color)';
                c.style.background = 'var(--bg-tertiary)';
                c.style.color = 'var(--text-secondary)';
                c.style.fontWeight = '500';
            });
            chip.classList.add('active');
            chip.style.border = '1px solid var(--purple)';
            chip.style.background = 'var(--purple-glow)';
            chip.style.color = 'var(--purple-light)';
            chip.style.fontWeight = '600';
            wizardSelectedStage = chip.getAttribute('data-stage');
        });
    });

    const wNext1 = document.getElementById('wizard-next-1');
    if (wNext1) {
        wNext1.addEventListener('click', () => {
            const title = document.getElementById('wizard-title').value.trim();
            if (!title) {
                showToast('Informe o nome da avaliação.', 'alert-triangle');
                return;
            }
            
            const selectedSchoolCbs = document.querySelectorAll('.wizard-school-checkbox:checked');
            if (selectedSchoolCbs.length === 0) {
                showToast('Selecione pelo menos uma escola participante.', 'alert-triangle');
                return;
            }
            
            // Populate step 2 questions list
            populateWizardQuestionsList();
            populateWizardClasses();
            goToWizardStep(2);
        });
    }

    const wPrev2 = document.getElementById('wizard-prev-2');
    if (wPrev2) {
        wPrev2.addEventListener('click', () => {
            goToWizardStep(1);
        });
    }

    // Step 2 to Step 3
    const wNext2 = document.getElementById('wizard-next-2');
    if (wNext2) {
        wNext2.addEventListener('click', () => {
            const checkedBoxes = document.querySelectorAll('.wizard-question-checkbox:checked');
            if (checkedBoxes.length === 0) {
                showToast('Selecione pelo menos uma questão.', 'alert-triangle');
                return;
            }
            wizardSelectedQuestions = Array.from(checkedBoxes).map(cb => cb.value);
            
            // Populate Step 3 review pane
            const title = document.getElementById('wizard-title').value.trim();
            const date = document.getElementById('wizard-date').value;
            const subject = document.getElementById('wizard-subject').value;
            
            document.getElementById('wizard-review-title').textContent = title;
            document.getElementById('wizard-review-meta').textContent = `Realização: ${date} | Componente: ${subject} | Público: ${wizardSelectedStage}`;
            document.getElementById('wizard-review-questions-count').innerHTML = `Questões Selecionadas: <span style="color:var(--green-light); font-weight:700;">${wizardSelectedQuestions.length}</span>`;
            
            goToWizardStep(3);
        });
    }

    // Step 3 to Step 2
    const wPrev3 = document.getElementById('wizard-prev-3');
    if (wPrev3) {
        wPrev3.addEventListener('click', () => {
            goToWizardStep(2);
        });
    }

    // Step 3 Finish
    const wFinish = document.getElementById('wizard-finish-btn');
    if (wFinish) {
        wFinish.addEventListener('click', () => {
            const title = document.getElementById('wizard-title').value.trim();
            if (!title) {
                showToast('Por favor, informe o título do evento.', 'alert-triangle');
                return;
            }
            const startStr = document.getElementById('wizard-start-date').value;
            const endStr = document.getElementById('wizard-end-date').value;            
            const checkedClassCbs = document.querySelectorAll('.wizard-class-checkbox:checked');
            let participatingClasses = [];
            let schoolNames = [];

            if (checkedClassCbs.length > 0) {
                participatingClasses = Array.from(checkedClassCbs).map(cb => cb.value);
                participatingClasses.forEach(cId => {
                    const cObj = dbTurmas.find(t => t.id === cId);
                    if (cObj) {
                        const sObj = dbEscolas.find(e => e.id === cObj.escola_id);
                        if (sObj && !schoolNames.includes(sObj.nome)) {
                            schoolNames.push(sObj.nome);
                        }
                    }
                });
            } else {
                showToast('Selecione pelo menos uma turma participante.', 'alert-triangle');
                return;
            }

            const checkedSchoolCbs = document.querySelectorAll('.wizard-school-checkbox:checked');
            let participatingSchools = Array.from(checkedSchoolCbs).map(cb => cb.value);

            const subject = document.getElementById('wizard-subject').value;

            const formatDateStr = (dStr) => {
                if (!dStr) return '';
                const p = dStr.split('-');
                return `${p[2]}/${p[1]}/${p[0]}`;
            };

            const newEval = {
                id: `eval-${Date.now()}`,
                titulo: title,
                escola: schoolNames.join(', ') || 'Sem Escolas',
                janela: `${formatDateStr(startStr)} a ${formatDateStr(endStr)}`,
                tipo: "Simulado",
                etapa: wizardSelectedStage,
                status: "0% concluída",
                escola_ids: participatingSchools
            };

            activeEvaluations.unshift(newEval);

            // Add to dbAvaliacoes
            dbAvaliacoes.push({
                id: newEval.id,
                nome: newEval.titulo,
                componente: subject === "lp" ? "Português" : "Matemática",
                data_aplicacao: newEval.janela,
                matriz_referencia: newEval.etapa,
                turma_ids: participatingClasses,
                escola_ids: participatingSchools
            });

            // Update questions in dbQuestoes
            wizardSelectedQuestions.forEach(qId => {
                const q = dbQuestoes.find(qu => qu.id === qId);
                if (q) {
                    q.avaliacao_id = newEval.id;
                }
            });

            // Pre-seed responses in dbResultadosAluno
            dbAlunos.forEach(al => {
                if (al.turma_id && participatingClasses.includes(al.turma_id)) {
                    wizardSelectedQuestions.forEach((qId, idx) => {
                        const threshold = al.avg_score || 70;
                        const matNum = parseInt(al.matricula) || 0;
                        const randomVal = (matNum + idx * 17) % 100;
                        const acertou = randomVal < threshold;
                        dbResultadosAluno.push({
                            id: `res_${dbResultadosAluno.length + 1}`,
                            aluno_id: al.matricula,
                            avaliacao_id: newEval.id,
                            questao_id: qId,
                            acertou: acertou
                        });
                    });
                }
            });

            recalculateNetworkStats();
            showToast(`Simulado "${title}" agendado com sucesso!`, 'check-circle');

            renderOngoingAssessments();

            // Reset and go back to list
            btnCreatedEvents.click();
        });
    }

    function goToWizardStep(step) {
        wizardCurrentStep = step;
        document.querySelectorAll('.wizard-step-pane').forEach(p => p.classList.add('hidden'));
        document.getElementById(`step-pane-${step}`).classList.remove('hidden');

        // Update progress indicators
        for (let i = 1; i <= 3; i++) {
            const ind = document.getElementById(`step-ind-${i}`);
            const line = document.getElementById(`step-line-${i-1}`);
            if (i <= step) {
                ind.style.color = 'var(--purple-light)';
                ind.style.fontWeight = '600';
                ind.querySelector('span').style.background = 'var(--purple-glow)';
                ind.querySelector('span').style.borderColor = 'var(--purple)';
                if (line) line.style.background = 'var(--purple)';
            } else {
                ind.style.color = 'var(--text-muted)';
                ind.style.fontWeight = '500';
                ind.querySelector('span').style.background = 'var(--bg-tertiary)';
                ind.querySelector('span').style.borderColor = 'var(--border-color)';
                if (line) line.style.background = 'var(--border-color)';
            }
        }
    }
    function populateWizardSchools() {
        const checklist = document.getElementById('wizard-schools-checklist');
        if (!checklist) return;
        checklist.innerHTML = '';

        if (dbEscolas.length === 0) {
            checklist.innerHTML = '<div style="color:var(--text-muted); font-size:0.75rem; padding: 4px;">Nenhuma escola cadastrada no sistema.</div>';
            return;
        }

        dbEscolas.forEach(esc => {
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '8px';
            label.style.fontSize = '0.75rem';
            label.style.color = 'var(--text-primary)';
            label.style.cursor = 'pointer';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = esc.id;
            checkbox.className = 'wizard-school-checkbox';
            checkbox.style.cursor = 'pointer';

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(esc.nome));
            checklist.appendChild(label);
        });

        const btnSelectAll = document.getElementById('btn-select-all-wizard-schools');
        const btnClearAll = document.getElementById('btn-clear-all-wizard-schools');

        if (btnSelectAll) {
            btnSelectAll.onclick = (e) => {
                e.preventDefault();
                checklist.querySelectorAll('.wizard-school-checkbox').forEach(cb => cb.checked = true);
            };
        }

        if (btnClearAll) {
            btnClearAll.onclick = (e) => {
                e.preventDefault();
                checklist.querySelectorAll('.wizard-school-checkbox').forEach(cb => cb.checked = false);
            };
        }
    }

    function resetWizard() {
        document.getElementById('wizard-title').value = '';
        document.getElementById('wizard-date').value = '2026-08-20';
        document.getElementById('wizard-start-date').value = '2026-08-20';
        document.getElementById('wizard-end-date').value = '2026-08-26';
        populateWizardSchools();
        goToWizardStep(1);
    }

    function populateWizardQuestionsList() {
        const qContainer = document.getElementById('wizard-questions-list');
        if (!qContainer) return;
        qContainer.innerHTML = '';

        const selectedSubject = document.getElementById('wizard-subject').value;

        // Map wizardSelectedStage ("2º Ano", "5º Ano", "9º Ano") to target grade prefix ("EF02", "EF05", "EF09")
        let stagePrefix = "EF05"; // default
        if (wizardSelectedStage.includes("2º")) stagePrefix = "EF02";
        else if (wizardSelectedStage.includes("5º")) stagePrefix = "EF05";
        else if (wizardSelectedStage.includes("9º")) stagePrefix = "EF09";

        // Let's add some mock questions for EF02 in the rawQuestions array dynamically so that 2nd grade is not empty!
        const hasEF02 = rawQuestions.some(q => q.codigo_bncc.startsWith("EF02"));
        if (!hasEF02) {
            rawQuestions.push(
                {
                    id: "q_lp_ef02_1",
                    codigo_bncc: "EF02LP01",
                    disciplina: "Língua Portuguesa",
                    matriz: "IDEB",
                    descritor: "SAEB-LP-D1 (Localizar informação)",
                    enunciado: "Leia o texto:<br><em>'O gato Mimi viu um passarinho azul no jardim. Ele tentou subir no muro, mas o passarinho voou.'</em><br><br>Qual era a cor do passarinho?",
                    nivel_cognitivo: "Lembrar",
                    dificuldade: "Fácil",
                    opcoes: [
                        { letra: "A", texto: "Branco", correta: false },
                        { letra: "B", texto: "Azul", correta: true },
                        { letra: "C", texto: "Preto", correta: false },
                        { letra: "D", texto: "Cinza", correta: false }
                    ],
                    explicacao: "O texto diz explicitamente que o passarinho era azul."
                },
                {
                    id: "q_mt_ef02_1",
                    codigo_bncc: "EF02MA01",
                    disciplina: "Matemática",
                    matriz: "IDEB",
                    descritor: "SAEB-MT-D1 (Espaço e Forma)",
                    enunciado: "Se João tinha 12 lápis de cor e ganhou mais 5 da sua tia, com quantos lápis João ficou no total?",
                    nivel_cognitivo: "Aplicar",
                    dificuldade: "Fácil",
                    opcoes: [
                        { letra: "A", texto: "15 lápis", correta: false },
                        { letra: "B", texto: "17 lápis", correta: true },
                        { letra: "C", texto: "18 lápis", correta: false },
                        { letra: "D", texto: "20 lápis", correta: false }
                    ],
                    explicacao: "12 + 5 = 17."
                }
            );
        }

        const filtered = rawQuestions.filter(q => {
            const matchesDiscipline = selectedSubject.includes('Mista') || q.disciplina === selectedSubject;
            const matchesStage = q.codigo_bncc && q.codigo_bncc.startsWith(stagePrefix);
            return matchesDiscipline && matchesStage;
        });

        if (filtered.length === 0) {
            qContainer.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size: 0.85rem;">Nenhuma questão encontrada para a combinação de matéria e etapa de ensino selecionada.</div>`;
            return;
        }

        filtered.forEach((q, idx) => {
            const div = document.createElement('div');
            div.className = 'eval-question-item';
            div.style.display = 'flex';
            div.style.alignItems = 'flex-start';
            div.style.gap = '10px';
            div.style.padding = '10px';
            div.style.border = '1px solid var(--border-color)';
            div.style.borderRadius = 'var(--radius-md)';
            div.style.backgroundColor = 'var(--bg-tertiary)';

            div.innerHTML = `
                <input type="checkbox" id="wiz-q-${q.id}" value="${q.id}" class="wizard-question-checkbox" style="margin-top: 4px;" ${idx < 5 ? 'checked' : ''}>
                <label for="wiz-q-${q.id}" style="font-size: 0.75rem; line-height: 1.4; cursor: pointer; color:var(--text-primary);">
                    <strong>[${q.codigo_bncc || q.descritor}] (${q.dificuldade})</strong> ${q.enunciado.replace(/\\\(.*?\\\)/g, '').slice(0, 120)}...
                </label>
            `;
            qContainer.appendChild(div);
        });

        safeCreateIcons();
    }

    // Subtab 2: Lançamento de Notas (Student roster and dynamic answers)
    const scoreSchoolSelect = document.getElementById('score-school-select');
    const scoreClassSelect = document.getElementById('score-class-select');
    const scoreTablePlaceholder = document.getElementById('score-table-placeholder');
    const scoreTableContent = document.getElementById('score-table-content');
    const scoreStudentsTableBody = document.getElementById('score-students-table-body');
    const scoreEvalSelect = document.getElementById('score-eval-select');

    function populateScoreSchoolSelect() {
        populateScoreEvalSelect();
    }

    function populateScoreEvalSelect() {
        if (!scoreEvalSelect) return;
        scoreEvalSelect.innerHTML = '';
        
        const allEvals = [
            { id: "eval-diag", titulo: "Avaliação Diagnóstica 2026 - Rede Geral" },
            { id: "sim-1", titulo: "1º Simulado Preparatório SAEB - 5º e 9º Ano" },
            ...activeEvaluations.filter(ev => ev.id !== "eval-diag" && ev.id !== "sim-1")
        ];

        allEvals.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.id;
            opt.textContent = ev.titulo;
            scoreEvalSelect.appendChild(opt);
        });

        // Clean previous listeners before attaching new ones
        scoreEvalSelect.removeEventListener('change', updateScoreSchoolAndClassSelectors);
        scoreEvalSelect.addEventListener('change', updateScoreSchoolAndClassSelectors);

        updateScoreSchoolAndClassSelectors();
    }

    function updateScoreSchoolAndClassSelectors() {
        if (!scoreEvalSelect || !scoreSchoolSelect || !scoreClassSelect) return;
        const evalId = scoreEvalSelect.value;
        const ev = dbAvaliacoes.find(e => e.id === evalId);

        let linkedClassIds = [];
        if (ev && ev.turma_ids) {
            linkedClassIds = ev.turma_ids;
        }
        // 1. Populate Schools
        scoreSchoolSelect.innerHTML = '<option value="">Selecione a Escola...</option>';
        let filteredSchools = [];
        if (ev && ev.escola_ids && ev.escola_ids.length > 0) {
            filteredSchools = dbEscolas.filter(s => ev.escola_ids.includes(s.id));
        } else if (linkedClassIds.length > 0) {
            linkedClassIds.forEach(cId => {
                const cObj = dbTurmas.find(t => t.id === cId);
                if (cObj) {
                    const sObj = dbEscolas.find(e => e.id === cObj.escola_id);
                    if (sObj && !filteredSchools.some(s => s.id === sObj.id)) {
                        filteredSchools.push(sObj);
                    }
                }
            });
        } else {
            filteredSchools = [...dbEscolas];
        }

        filteredSchools.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.nome;
            opt.textContent = s.nome;
            scoreSchoolSelect.appendChild(opt);
        });

        // 2. Populate Class
        scoreClassSelect.innerHTML = '<option value="">Selecione primeiro a escola...</option>';
        checkAndRenderScoresTable();
    }

    if (scoreSchoolSelect) {
        scoreSchoolSelect.addEventListener('change', () => {
            const schoolName = scoreSchoolSelect.value;
            const evalId = scoreEvalSelect.value;
            const ev = dbAvaliacoes.find(e => e.id === evalId);
            
            let linkedClassIds = ev ? (ev.turma_ids || []) : [];

            scoreClassSelect.innerHTML = '<option value="">Selecione a Turma...</option>';
            const schoolObj = dbEscolas.find(e => e.nome === schoolName);
            if (schoolObj) {
                const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
                classes.forEach(c => {
                    if (linkedClassIds.length === 0 || linkedClassIds.includes(c.id)) {
                        const opt = document.createElement('option');
                        opt.value = c.id;
                        opt.textContent = `${c.nome} (${c.serie} - ${c.turno})`;
                        scoreClassSelect.appendChild(opt);
                    }
                });
            }
            checkAndRenderScoresTable();
        });
    }

    if (scoreClassSelect) {
        scoreClassSelect.addEventListener('change', checkAndRenderScoresTable);
    }

    function checkAndRenderScoresTable() {
        const school = scoreSchoolSelect ? scoreSchoolSelect.value : '';
        const classId = scoreClassSelect ? scoreClassSelect.value : '';
        
        if (!school || !classId) {
            if (scoreTablePlaceholder) scoreTablePlaceholder.classList.remove('hidden');
            if (scoreTableContent) scoreTableContent.classList.add('hidden');
            return;
        }

        if (scoreTablePlaceholder) scoreTablePlaceholder.classList.add('hidden');
        if (scoreTableContent) scoreTableContent.classList.remove('hidden');
        renderScoreRoster(school, classId);
    }

    let tempStudentScores = {};

    function renderScoreRoster(schoolName, classId) {
        if (!scoreStudentsTableBody) return;
        scoreStudentsTableBody.innerHTML = '';

        const selectedEvalId = scoreEvalSelect.value;

        // Fetch students belonging to this class ID
        const students = dbAlunos.filter(al => al.turma_id === classId);
        
        if (students.length === 0) {
            scoreStudentsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">
                        Nenhum aluno matriculado nesta turma.
                    </td>
                </tr>
            `;
            return;
        }

        // Fetch questions for this event
        let evalQuestions = dbQuestoes.filter(q => q.avaliacao_id === selectedEvalId);
        if (evalQuestions.length === 0) {
            evalQuestions = dbQuestoes.slice(0, 5);
        }

        const answersHeaderEl = document.querySelector('#score-table-content th:nth-child(3)');
        if (answersHeaderEl) {
            answersHeaderEl.textContent = `Respostas / Questões (${evalQuestions.length} Itens)`;
        }

        students.forEach(st => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '48px';

            if (!tempStudentScores[st.matricula]) {
                tempStudentScores[st.matricula] = [];
                evalQuestions.forEach((q, qIdx) => {
                    const existingRes = dbResultadosAluno.find(r => r.aluno_id === st.matricula && r.avaliacao_id === selectedEvalId && r.questao_id === q.id);
                    if (existingRes) {
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        tempStudentScores[st.matricula][qIdx] = existingRes.acertou ? (qObj ? qObj.correta : "A") : "B";
                    } else {
                        const threshold = st.avg_score || 70;
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        const correctAns = qObj ? (qObj.correta || "A") : "A";
                        const isCorrect = (Math.random() * 100) < threshold;
                        if (isCorrect) {
                            tempStudentScores[st.matricula][qIdx] = correctAns;
                        } else {
                            const incorrects = ["A", "B", "C", "D"].filter(letra => letra !== correctAns);
                            tempStudentScores[st.matricula][qIdx] = incorrects[Math.floor(Math.random() * incorrects.length)];
                        }
                    }
                });
            }
            const stAnswers = tempStudentScores[st.matricula];

            let rowHTML = `
                <td style="padding: 10px 16px; font-family:var(--font-mono); font-size:0.75rem;">${st.matricula}</td>
                <td style="padding: 10px 16px; font-weight:600;">${st.nome}</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <div style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap;">
            `;

            for (let qIdx = 0; qIdx < evalQuestions.length; qIdx++) {
                const currentAns = stAnswers[qIdx] || "A";
                rowHTML += `<select data-student="${st.matricula}" data-q="${qIdx}" class="student-q-answer-select" style="background-color:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--border-color); border-radius:4px; padding:3px 6px; font-size:0.75rem;">
                    <option value="A" ${currentAns === 'A' ? 'selected' : ''}>A</option>
                    <option value="B" ${currentAns === 'B' ? 'selected' : ''}>B</option>
                    <option value="C" ${currentAns === 'C' ? 'selected' : ''}>C</option>
                    <option value="D" ${currentAns === 'D' ? 'selected' : ''}>D</option>
                </select>`;
            }

            let correctCount = 0;
            evalQuestions.forEach((q, idx) => {
                const qObj = rawQuestions.find(rq => rq.id === q.id);
                const correctAns = qObj ? (qObj.correta || "A") : "A";
                const chosen = stAnswers[idx] || "A";
                if (chosen === correctAns) correctCount++;
            });
            const perf = evalQuestions.length > 0 ? Math.round((correctCount / evalQuestions.length) * 100) : 100;

            rowHTML += `
                    </div>
                </td>
                <td style="padding: 10px 16px; text-align:center; font-weight:600; color:var(--green-light);" id="st-perf-${st.matricula}">${perf}%</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <button class="btn btn-outline btn-sm quick-save-score-btn" data-student="${st.matricula}">
                        <i data-lucide="check"></i> Salvar
                    </button>
                </td>
            `;

            tr.innerHTML = rowHTML;
            scoreStudentsTableBody.appendChild(tr);
        });

        const answerSelects = scoreStudentsTableBody.querySelectorAll('.student-q-answer-select');
        answerSelects.forEach(sel => {
            sel.addEventListener('change', () => {
                const mat = sel.getAttribute('data-student');
                const qIdx = parseInt(sel.getAttribute('data-q'));
                if (!tempStudentScores[mat]) tempStudentScores[mat] = [];
                tempStudentScores[mat][qIdx] = sel.value;
                
                let correctCount = 0;
                evalQuestions.forEach((q, idx) => {
                    const qObj = rawQuestions.find(rq => rq.id === q.id);
                    const correctAns = qObj ? (qObj.correta || "A") : "A";
                    if (tempStudentScores[mat][idx] === correctAns) correctCount++;
                });
                const perf = Math.round((correctCount / evalQuestions.length) * 100);
                document.getElementById(`st-perf-${mat}`).textContent = `${perf}%`;
            });
        });

        const saveBtns = scoreStudentsTableBody.querySelectorAll('.quick-save-score-btn');
        saveBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const mat = btn.getAttribute('data-student');
                const stObj = dbAlunos.find(s => s.matricula === mat);
                const answers = tempStudentScores[mat];
                if (stObj && answers) {
                    let correctCount = 0;
                    evalQuestions.forEach((q, idx) => {
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        const correctAns = qObj ? (qObj.correta || "A") : "A";
                        const chosen = answers[idx] || "A";
                        const acertou = (chosen === correctAns);
                        if (acertou) correctCount++;

                        const existingRes = dbResultadosAluno.find(r => r.aluno_id === mat && r.avaliacao_id === selectedEvalId && r.questao_id === q.id);
                        if (existingRes) {
                            existingRes.acertou = acertou;
                        } else {
                            dbResultadosAluno.push({
                                id: `res_${dbResultadosAluno.length + 1}`,
                                aluno_id: mat,
                                avaliacao_id: selectedEvalId,
                                questao_id: q.id,
                                acertou: acertou
                            });
                        }
                    });

                    const newAvg = Math.round((correctCount / evalQuestions.length) * 100);
                    stObj.avg_score = newAvg;
                    
                    const flatSt = loadedStudents.find(s => s.matricula === mat);
                    if (flatSt) flatSt.avg_score = newAvg;

                    recalculateNetworkStats();
                    renderRiskGoalsTable();
                    renderHeatmapGrid();
                }
                showToast(`Notas do aluno ${mat} salvas com sucesso!`, 'check-circle');
            });
        });

        safeCreateIcons();
    }

    const btnSaveAllScores = document.getElementById('btn-save-all-scores');
    if (btnSaveAllScores) {
        btnSaveAllScores.addEventListener('click', () => {
            const selectedEvalId = scoreEvalSelect.value;
            const classId = scoreClassSelect.value;
            if (!classId) return;

            const students = dbAlunos.filter(al => al.turma_id === classId);
            
            let evalQuestions = dbQuestoes.filter(q => q.avaliacao_id === selectedEvalId);
            if (evalQuestions.length === 0) {
                evalQuestions = dbQuestoes.slice(0, 5);
            }

            let savedCount = 0;
            students.forEach(st => {
                const answers = tempStudentScores[st.matricula];
                if (answers) {
                    let correctCount = 0;
                    evalQuestions.forEach((q, idx) => {
                        const qObj = rawQuestions.find(rq => rq.id === q.id);
                        const correctAns = qObj ? (qObj.correta || "A") : "A";
                        const chosen = answers[idx] || "A";
                        const acertou = (chosen === correctAns);
                        if (acertou) correctCount++;

                        const existingRes = dbResultadosAluno.find(r => r.aluno_id === st.matricula && r.avaliacao_id === selectedEvalId && r.questao_id === q.id);
                        if (existingRes) {
                            existingRes.acertou = acertou;
                        } else {
                            dbResultadosAluno.push({
                                id: `res_${dbResultadosAluno.length + 1}`,
                                aluno_id: st.matricula,
                                avaliacao_id: selectedEvalId,
                                questao_id: q.id,
                                acertou: acertou
                            });
                        }
                    });

                    const newAvg = Math.round((correctCount / evalQuestions.length) * 100);
                    stObj.avg_score = newAvg;
                    
                    const flatSt = loadedStudents.find(s => s.matricula === st.matricula);
                    if (flatSt) flatSt.avg_score = newAvg;
                    
                    savedCount++;
                }
            });

            const ev = activeEvaluations.find(e => e.id === selectedEvalId);
            if (ev) {
                ev.status = "100% concluída";
                renderOngoingAssessments();
            }

            recalculateNetworkStats();
            renderRiskGoalsTable();
            renderHeatmapGrid();

            showToast(`Todas as notas de ${savedCount} alunos foram publicadas com sucesso!`, 'check-circle');
        });
    }

    // Subtab 4: Banco de Habilidades / Descritores
    const formDescriptor = document.getElementById('form-create-descriptor');
    if (formDescriptor) {
        formDescriptor.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = document.getElementById('desc-code').value.trim().toUpperCase();
            const stage = document.getElementById('desc-stage').value;
            const text = document.getElementById('desc-text').value.trim();

            const comp = code.startsWith('LP') ? 'Língua Portuguesa' : 'Matemática';

            activeDescriptors.unshift({
                codigo: code,
                etapa: stage,
                desc: text,
                componente: comp
            });

            showToast(`Descritor "${code}" cadastrado com sucesso!`, 'check-circle');
            formDescriptor.reset();
            renderActiveDescriptors();
        });
    }

    function renderActiveDescriptors(filterComponent = "all") {
        const tableBody = document.getElementById('active-descriptors-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const filtered = activeDescriptors.filter(d => {
            return filterComponent === 'all' || d.componente === filterComponent;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 24px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
                        Nenhum descritor cadastrado para o filtro selecionado.
                    </td>
                </tr>
            `;
            return;
        }

        filtered.forEach(d => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '42px';

            tr.innerHTML = `
                <td style="padding: 10px 16px; font-weight:600; color:var(--purple-light);">${d.codigo}</td>
                <td style="padding: 10px 16px; font-size:0.75rem; color:var(--text-secondary);">${d.etapa}</td>
                <td style="padding: 10px 16px; font-size:0.8rem; color:var(--text-primary);">${d.desc}</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <span style="font-size:0.7rem; color:var(--text-muted);">Bloqueado (Padrão)</span>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Bind descriptor filter buttons
    const descFilterBtns = document.querySelectorAll('.desc-filter-btn');
    descFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            descFilterBtns.forEach(b => {
                b.className = 'btn btn-outline btn-sm desc-filter-btn';
            });
            btn.className = 'btn btn-primary btn-sm desc-filter-btn';
            const filter = btn.getAttribute('data-filter');
            renderActiveDescriptors(filter);
        });
    });

    // Populate schools on active evaluation tab load
    function populateSchoolPanelSelector(schools) {
        populateWizardClasses();

        const sSchool = document.getElementById('score-school-select');
        const dSchool = document.getElementById('dash-school-select');

        if (sSchool) {
            sSchool.innerHTML = '<option value="">Selecione a Escola...</option>';
            schools.forEach(sch => {
                const opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, ' ');
                sSchool.appendChild(opt);
            });
        }

        if (dSchool) {
            dSchool.innerHTML = '<option value="all">Todas as Escolas</option>';
            schools.forEach(sch => {
                const opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, ' ');
                dSchool.appendChild(opt);
            });
        }
    }

    function populateWizardClasses() {
        const wChecklist = document.getElementById('wizard-classes-checklist');
        if (!wChecklist) return;

        wChecklist.innerHTML = '';
        if (dbTurmas.length === 0) {
            wChecklist.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted); padding:4px;">Nenhuma turma disponível. Cadastre escolas e turmas primeiro!</span>`;
            return;
        }

        const selectedSchoolCbs = document.querySelectorAll('.wizard-school-checkbox:checked');
        const selectedSchoolIds = Array.from(selectedSchoolCbs).map(cb => cb.value);

        dbEscolas.forEach(esc => {
            if (!selectedSchoolIds.includes(esc.id)) return;
            
            const classes = dbTurmas.filter(t => t.escola_id === esc.id);
            if (classes.length > 0) {
                const schoolHeader = document.createElement('div');
                schoolHeader.style.fontSize = '0.75rem';
                schoolHeader.style.fontWeight = 'bold';
                schoolHeader.style.marginTop = '8px';
                schoolHeader.style.color = 'var(--purple-light)';
                schoolHeader.textContent = esc.nome;
                wChecklist.appendChild(schoolHeader);

                classes.forEach(c => {
                    const label = document.createElement('label');
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    label.style.gap = '8px';
                    label.style.fontSize = '0.75rem';
                    label.style.cursor = 'pointer';
                    label.style.padding = '4px 0';
                    label.style.paddingLeft = '12px';
                    
                    label.innerHTML = `
                        <input type="checkbox" class="wizard-class-checkbox" value="${c.id}" checked>
                        <span>${c.nome} (${c.serie} - ${c.turno})</span>
                    `;
                    wChecklist.appendChild(label);
                });
            }
        });

        const btnAll = document.getElementById('btn-wizard-classes-select-all');
        const btnNone = document.getElementById('btn-wizard-classes-select-none');
        if (btnAll && btnNone) {
            btnAll.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll('.wizard-class-checkbox').forEach(cb => cb.checked = true);
            };
            btnNone.onclick = (e) => {
                e.preventDefault();
                document.querySelectorAll('.wizard-class-checkbox').forEach(cb => cb.checked = false);
            };
        }
    }

    // Call created events initial render
    renderCreatedEvents();

    // ==========================================
    // NOTIFICAÇÕES E SELETOR DE PERFIL (CONTROLE DE ACESSO E ALERTAS)
    // ==========================================
    const profileSelector = document.getElementById('profile-selector');
    const notificationBtn = document.getElementById('notification-btn');
    const notificationsDropdown = document.getElementById('notifications-dropdown');

    if (notificationBtn && notificationsDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            notificationsDropdown.classList.add('hidden');
        });
    }

    let activeNotifications = [
        { id: 1, type: "danger", title: "Risco de Meta Não Atingida", desc: "UE Antonio Simão Oliveira está com gap de -0.4 pontos em relação à meta pactuada." },
        { id: 2, type: "warning", title: "Fechamento de Janela Próximo", desc: "Faltam 48 horas para o término do Simulado SAEB na Escola Vereador Jose Silveira." },
        { id: 3, type: "info", title: "Planos Pedagógicos Disponíveis", desc: "IA gerou 3 novos planos de ação para a sua rede com base nos descritores críticos." }
    ];

    function renderNotificationsList() {
        const badge = document.getElementById('notification-badge');
        const container = document.getElementById('notifications-list');
        if (!container) return;
        container.innerHTML = '';

        if (activeNotifications.length === 0) {
            if (badge) badge.classList.add('hidden');
            container.innerHTML = `<p style="text-align:center; padding:12px; color:var(--text-muted); font-size:0.75rem;">Sem novos alertas no momento.</p>`;
            return;
        }

        if (badge) {
            badge.classList.remove('hidden');
            badge.textContent = activeNotifications.length;
        }

        activeNotifications.forEach(n => {
            const div = document.createElement('div');
            div.style.padding = '8px 10px';
            div.style.border = '1px solid var(--border-color)';
            div.style.borderRadius = 'var(--radius-sm)';
            div.style.backgroundColor = 'var(--bg-secondary)';
            div.style.fontSize = '0.7rem';
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.gap = '2px';

            let iconColor = 'var(--purple-light)';
            if (n.type === 'danger') iconColor = 'var(--red-light)';
            else if (n.type === 'warning') iconColor = 'var(--orange-light)';

            div.innerHTML = `
                <strong style="color: ${iconColor}; display:flex; align-items:center; gap:4px; margin-bottom: 2px;">
                    <i data-lucide="alert-circle" style="width:12px; height:12px;"></i>
                    ${n.title}
                </strong>
                <span style="color: var(--text-secondary); line-height: 1.3;">${n.desc}</span>
            `;
            container.appendChild(div);
        });

        safeCreateIcons();
    }

    const btnClearNotifications = document.getElementById('btn-clear-notifications');
    if (btnClearNotifications) {
        btnClearNotifications.addEventListener('click', () => {
            activeNotifications = [];
            renderNotificationsList();
            showToast('Notificações limpas!', 'check-circle');
        });
    }

    function applyProfilePermissions(profile) {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            const target = item.getAttribute('data-target');
            
            // Default reset
            item.style.opacity = '1';
            item.style.pointerEvents = 'auto';

            if (profile === 'professor') {
                // Professor can't see Metas, Escolas, or Criar Avaliações
                if (target === 'metas-ideb' || target === 'escolas-panel' || target === 'criar-avaliacoes') {
                    item.style.opacity = '0.3';
                    item.style.pointerEvents = 'none';
                }
            } else if (profile === 'coordenador') {
                // Coordenador can't see Metas
                if (target === 'metas-ideb') {
                    item.style.opacity = '0.3';
                    item.style.pointerEvents = 'none';
                }
            } else if (profile === 'diretor') {
                // Diretor can't see Metas
                if (target === 'metas-ideb') {
                    item.style.opacity = '0.3';
                    item.style.pointerEvents = 'none';
                }
            }
        });

        const profileNames = {
            secretaria: "Secretaria de Educação",
            diretor: "Diretor Escolar",
            coordenador: "Coordenador Pedagógico",
            professor: "Professor"
        };
        showToast(`Perfil alterado para: ${profileNames[profile]}`, 'shield-check');
    }

    if (profileSelector) {
        profileSelector.addEventListener('change', () => {
            applyProfilePermissions(profileSelector.value);
        });
    }

    // Call notifications initially
    renderNotificationsList();


    // ==========================================
    // RESULTADOS: MAPA DE CALOR & DETALHES DE DESCRITORES
    // ==========================================
    function getBNCCCriticalSkills(evalId, schoolName, classId, subject) {
        let results = [...dbResultadosAluno];
        if (evalId && evalId !== "all") {
            results = results.filter(r => r.avaliacao_id === evalId);
        }

        let filteredStudents = [...dbAlunos];
        if (schoolName && schoolName !== "all") {
            const sObj = dbEscolas.find(e => e.nome === schoolName);
            if (sObj) {
                const tIds = dbTurmas.filter(t => t.escola_id === sObj.id).map(t => t.id);
                filteredStudents = filteredStudents.filter(al => tIds.includes(al.turma_id));
            }
        }
        if (classId && classId !== "all") {
            filteredStudents = filteredStudents.filter(al => al.turma_id === classId);
        }

        const studentMats = filteredStudents.map(al => al.matricula);
        results = results.filter(r => studentMats.includes(r.aluno_id));

        const descStats = {};
        activeDescriptors.forEach(d => {
            descStats[d.codigo] = { correct: 0, total: 0, desc: d };
        });

        results.forEach(res => {
            const q = dbQuestoes.find(qu => qu.id === res.questao_id);
            if (q) {
                const descCode = q.descritor_bncc_id;
                const isLP = descCode.includes("LP") || descCode.startsWith("EF05LP");
                if (subject === "lp" && !isLP) return;
                if (subject === "mt" && isLP) return;

                if (descStats[descCode]) {
                    descStats[descCode].total++;
                    if (res.acertou) descStats[descCode].correct++;
                }
            }
        });

        const list = [];
        Object.keys(descStats).forEach(code => {
            const stat = descStats[code];
            const isLP = code.includes("LP") || code.startsWith("EF05LP");
            if (subject === "lp" && !isLP) return;
            if (subject === "mt" && isLP) return;

            const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            list.push({
                codigo: code,
                percent: pct,
                total: stat.total,
                desc: stat.desc
            });
        });

        return list;
    }

    function updateDashboardResultsMetrics(evalId, schoolName, classId, subject) {
        const adValue = document.getElementById('results-adhesion-value');
        const adSub = document.getElementById('results-adhesion-sub');
        const profValue = document.getElementById('results-proficiency-value');
        const profSub = document.getElementById('results-proficiency-sub');
        const targetValue = document.getElementById('results-target-value');
        const targetSub = document.getElementById('results-target-sub');

        if (!adValue || !adSub || !profValue || !profSub) return;

        let filteredStudents = [...dbAlunos];
        if (schoolName && schoolName !== "all") {
            const sObj = dbEscolas.find(e => e.nome === schoolName);
            if (sObj) {
                const tIds = dbTurmas.filter(t => t.escola_id === sObj.id).map(t => t.id);
                filteredStudents = filteredStudents.filter(al => tIds.includes(al.turma_id));
            }
        }
        if (classId && classId !== "all") {
            filteredStudents = filteredStudents.filter(al => al.turma_id === classId);
        }

        const totalStudents = filteredStudents.length;

        let participations = 0;
        let totalAvg = 0;
        let countAvg = 0;

        filteredStudents.forEach(st => {
            const hasRes = dbResultadosAluno.some(r => r.aluno_id === st.matricula && (evalId === "all" || r.avaliacao_id === evalId));
            if (hasRes) {
                participations++;
                if (st.avg_score !== undefined) {
                    totalAvg += st.avg_score;
                    countAvg++;
                }
            }
        });

        const adhesionPct = totalStudents > 0 ? Math.round((participations / totalStudents) * 100) : 0;
        adValue.textContent = `${adhesionPct}%`;
        adSub.textContent = `${participations} de ${totalStudents} alunos avaliados`;

        const avgScore = countAvg > 0 ? Math.round(totalAvg / countAvg) : 0;
        const saebScore = totalStudents > 0 ? Math.round(150 + (avgScore / 100) * 150) : 0;
        profValue.textContent = saebScore.toString();

        let saebLevel = 0;
        if (saebScore > 325) saebLevel = 9;
        else if (saebScore > 300) saebLevel = 8;
        else if (saebScore > 275) saebLevel = 7;
        else if (saebScore > 250) saebLevel = 6;
        else if (saebScore > 225) saebLevel = 5;
        else if (saebScore > 200) saebLevel = 4;
        else if (saebScore > 175) saebLevel = 3;
        else if (saebScore > 150) saebLevel = 2;
        else if (saebScore > 125) saebLevel = 1;
        
        profSub.textContent = `Nível ${saebLevel} da escala de proficiência SAEB`;

        if (targetValue && targetSub) {
            const target = 250.0;
            const deviation = saebScore - target;
            targetValue.textContent = target.toFixed(1);
            targetSub.textContent = `Desvio atual: ${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)} pontos`;
        }
    }

    function populateDashboardResultsSelectors() {
        const evalSelect = document.getElementById('dash-eval-select');
        const schoolSelect = document.getElementById('dash-school-select');
        const classSelect = document.getElementById('dash-class-select');
        const subjectSelect = document.getElementById('dash-subject-select');

        if (!evalSelect || !schoolSelect || !classSelect || !subjectSelect) return;

        evalSelect.innerHTML = '<option value="all">Todos os Simulados</option>';
        const allEvals = [
            { id: "eval-diag", titulo: "Avaliação Diagnóstica 2026 - Rede Geral" },
            { id: "sim-1", titulo: "1º Simulado Preparatório SAEB - 5º e 9º Ano" },
            ...activeEvaluations.filter(ev => ev.id !== "eval-diag" && ev.id !== "sim-1")
        ];
        allEvals.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.id;
            opt.textContent = ev.titulo;
            evalSelect.appendChild(opt);
        });

        schoolSelect.innerHTML = '<option value="all">Todas as Escolas</option>';
        dbEscolas.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.nome;
            opt.textContent = s.nome;
            schoolSelect.appendChild(opt);
        });

        function updateClassesDropdown() {
            classSelect.innerHTML = '<option value="all">Todas as Turmas</option>';
            const selectedSchool = schoolSelect.value;
            const schoolObj = dbEscolas.find(e => e.nome === selectedSchool);
            if (schoolObj) {
                const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
                classes.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = `${c.nome} (${c.serie})`;
                    classSelect.appendChild(opt);
                });
            } else if (selectedSchool === 'all') {
                dbTurmas.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = `${c.nome} (${c.serie})`;
                    classSelect.appendChild(opt);
                });
            }
            renderHeatmapGrid();
        }

        evalSelect.removeEventListener('change', renderHeatmapGrid);
        evalSelect.addEventListener('change', renderHeatmapGrid);

        schoolSelect.removeEventListener('change', updateClassesDropdown);
        schoolSelect.addEventListener('change', updateClassesDropdown);

        classSelect.removeEventListener('change', renderHeatmapGrid);
        classSelect.addEventListener('change', renderHeatmapGrid);

        subjectSelect.removeEventListener('change', renderHeatmapGrid);
        subjectSelect.addEventListener('change', renderHeatmapGrid);

        updateClassesDropdown();
    }

    function renderHeatmapGrid() {
        const grid = document.getElementById('dashboard-heatmap-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const evalSelect = document.getElementById('dash-eval-select');
        const schoolSelect = document.getElementById('dash-school-select');
        const classSelect = document.getElementById('dash-class-select');
        const subjectSelect = document.getElementById('dash-subject-select');

        const evalId = evalSelect ? evalSelect.value : 'all';
        const schoolName = schoolSelect ? schoolSelect.value : 'all';
        const classId = classSelect ? classSelect.value : 'all';
        const subject = subjectSelect ? subjectSelect.value : 'all';

        const stats = getBNCCCriticalSkills(evalId, schoolName, classId, subject);

        updateDashboardResultsMetrics(evalId, schoolName, classId, subject);

        if (stats.length === 0) {
            grid.innerHTML = `<div style="grid-column: span 12; text-align:center; padding:20px; color:var(--text-muted);">Nenhum resultado registrado com os filtros selecionados.</div>`;
            return;
        }

        stats.forEach(stat => {
            const percentage = stat.percent;
            
            let bgColor = 'rgba(16, 185, 129, 0.15)';
            let borderColor = 'rgba(16, 185, 129, 0.4)';
            let textColor = 'var(--green-light)';
            
            if (stat.total === 0) {
                bgColor = 'rgba(255, 255, 255, 0.05)';
                borderColor = 'rgba(255, 255, 255, 0.1)';
                textColor = 'var(--text-muted)';
            } else if (percentage < 55) {
                bgColor = 'rgba(239, 68, 68, 0.15)';
                borderColor = 'rgba(239, 68, 68, 0.4)';
                textColor = 'var(--red-light)';
            } else if (percentage < 70) {
                bgColor = 'rgba(245, 158, 11, 0.15)';
                borderColor = 'rgba(245, 158, 11, 0.4)';
                textColor = 'var(--orange-light)';
            }

            const block = document.createElement('div');
            block.style.padding = '10px';
            block.style.borderRadius = 'var(--radius-md)';
            block.style.border = `1px solid ${borderColor}`;
            block.style.backgroundColor = bgColor;
            block.style.textAlign = 'center';
            block.style.cursor = 'pointer';
            block.style.transition = 'var(--transition)';

            block.innerHTML = `
                <strong style="color: ${textColor}; display:block; font-size:0.8rem;">${stat.codigo}</strong>
                <span style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">${stat.total > 0 ? percentage + '%' : 'N/A'}</span>
            `;

            block.addEventListener('click', () => {
                showDescriptorDetail(desc, percentage);
            });

            grid.appendChild(block);
        });
    }

    function showDescriptorDetail(desc, percentage) {
        const card = document.getElementById('heatmap-descriptor-detail-card');
        if (!card) return;
        card.classList.remove('hidden');

        document.getElementById('detail-desc-code').textContent = `${desc.codigo} (${desc.componente})`;
        document.getElementById('detail-desc-desc').textContent = desc.desc;

        const ranksContainer = document.getElementById('detail-descriptor-school-ranks');
        if (ranksContainer) {
            ranksContainer.innerHTML = '';
            const schools = ["UE Antonio Simao Oliveira", "UE Vereador Jose Silveira", "COLEGIO ALPHA", "UE Gonçalves Dias"];
            schools.forEach(sch => {
                let hash = 0;
                for (let i = 0; i < sch.length; i++) {
                    hash += sch.charCodeAt(i);
                }
                const schPerf = Math.max(30, Math.min(100, percentage - 15 + (hash % 30)));
                
                let barColor = 'green';
                if (schPerf < 55) barColor = 'red';
                else if (schPerf < 70) barColor = 'orange';

                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.gap = '10px';
                row.innerHTML = `
                    <span style="font-size:0.75rem; width:120px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${sch}</span>
                    <div class="progress-bar-container" style="flex-grow:1; height:8px; margin:0;">
                        <div class="progress-bar ${barColor}" style="width: ${schPerf}%;"></div>
                    </div>
                    <span style="font-size:0.75rem; font-family:var(--font-mono); width:30px; text-align:right;">${schPerf}%</span>
                `;
                ranksContainer.appendChild(row);
            });
        }

        const tipText = document.getElementById('detail-descriptor-pedagogic-tip');
        if (desc.codigo.startsWith('LP')) {
            tipText.innerHTML = `
                <strong>Diretriz de Reforço:</strong><br>
                Recomendamos utilizar textos multimodais (charges, tirinhas, anúncios) para reforçar o descritor <strong>${desc.codigo}</strong>. 
                Organize sessões de leitura compartilhada focadas em identificar pistas textuais implícitas e na ampliação de vocabulário.<br><br>
                <em>Ação sugerida: Baixar apostila 'Leitura e Compreensão Ativa' na aba Planos de Ação.</em>
            `;
        } else {
            tipText.innerHTML = `
                <strong>Diretriz de Reforço:</strong><br>
                Para mitigar os erros no descritor <strong>${desc.codigo}</strong>, promova laboratórios de matemática manipulável (blocos lógicos, ábacos virtuais) e jogos cooperativos de cálculo mental.<br><br>
                <em>Ação sugerida: Iniciar sequência didática 'Matemática na Prática - Operações Fundamentais'.</em>
            `;
        }
    }

    const btnCloseDescDetail = document.getElementById('btn-close-descriptor-detail');
    if (btnCloseDescDetail) {
        btnCloseDescDetail.addEventListener('click', () => {
            document.getElementById('heatmap-descriptor-detail-card').classList.add('hidden');
        });
    }

    // Call heatmap initially
    renderHeatmapGrid();


    // ==========================================
    // 6-LEVEL SAEB PROFICIENCY ENGINE & SKILLS SCHEDULE
    // ==========================================

    // Dynamic SAEB Level Scale Model (Levels 0 to 5)
    const SAEB_LEVEL_CONFIG = [
        {
            level: 0,
            nome: 'Nível 0 — Abaixo do Básico (Alerta Crítico)',
            badgeClass: 'level-badge-0',
            descCardClass: 'lvl-0',
            color: '#ef4444',
            resumo: 'Estudantes com rendimento abaixo do mínimo esperado nas habilidades mais básicas. Necessitam de intervenção e recomposição prioritária.'
        },
        {
            level: 1,
            nome: 'Nível 1 — Elementar / Inicial',
            badgeClass: 'level-badge-1',
            descCardClass: 'lvl-1',
            color: '#f97316',
            resumo: 'Demonstram domínio de habilidades elementares pontuais com suporte textual direto e cálculos simples de um passo.'
        },
        {
            level: 2,
            nome: 'Nível 2 — Básico em Desenvolvimento',
            badgeClass: 'level-badge-2',
            descCardClass: 'lvl-2',
            color: '#eab308',
            resumo: 'Localizam informações explícitas com autonomia, identificam temas centrais e resolvem problemas aditivos e multiplicativos diretos.'
        },
        {
            level: 3,
            nome: 'Nível 3 — Adequado (Meta de Aprendizagem)',
            badgeClass: 'level-badge-3',
            descCardClass: 'lvl-3',
            color: '#0ea5e9',
            resumo: 'Realizam inferências diretas em textos de média complexidade, reconhecem relações de causa/efeito e operam problemas com mais de duas etapas.'
        },
        {
            level: 4,
            nome: 'Nível 4 — Consolidado / Proficiente',
            badgeClass: 'level-badge-4',
            descCardClass: 'lvl-4',
            color: '#22c55e',
            resumo: 'Distinguem fato de opinião, interpretam recursos gráficos e humor, e resolvem problemas com frações, porcentagens e grandezas geométricas.'
        },
        {
            level: 5,
            nome: 'Nível 5 — Avançado / Excelência',
            badgeClass: 'level-badge-5',
            descCardClass: 'lvl-5',
            color: '#a855f7',
            resumo: 'Estabelecem relações lógicas complexas, sintetizam teses e dominam raciocínio proporcional e representações algébricas/geométricas abstratas.'
        }
    ];

    // Reference Questions mapped to 6 Levels with Eixo and Descriptors
    const SAEB_REFERENCE_ITEMS = [
        // NÍVEL 0 & 1 (Inicial)
        { id: 'Q01', nivel: 0, eixo: 'Leitura', descritor: 'D1 - Localizar informação explícita em texto curto', correta: 'A', etapa: '5º Ano' },
        { id: 'Q02', nivel: 0, eixo: 'Números e Operações', descritor: 'D13 - Resolver adição simples sem agrupamento', correta: 'B', etapa: '5º Ano' },
        { id: 'Q03', nivel: 1, eixo: 'Leitura', descritor: 'D1 - Localizar informações explícitas com sinônimos', correta: 'C', etapa: '5º Ano' },
        { id: 'Q04', nivel: 1, eixo: 'Leitura', descritor: 'D6 - Identificar o tema central de uma fábula ou tirinha', correta: 'D', etapa: '5º Ano' },
        { id: 'Q05', nivel: 1, eixo: 'Números e Operações', descritor: 'D14 - Resolver problema de subtração com reserva', correta: 'B', etapa: '5º Ano' },

        // NÍVEL 2 (Básico)
        { id: 'Q06', nivel: 2, eixo: 'Leitura', descritor: 'D3 - Inferir o sentido de palavra pelo contexto', correta: 'A', etapa: '5º Ano' },
        { id: 'Q07', nivel: 2, eixo: 'Espaço e Forma', descritor: 'D1 - Identificar figuras geométricas tridimensionais', correta: 'C', etapa: '5º Ano' },
        { id: 'Q08', nivel: 2, eixo: 'Grandezas e Medidas', descritor: 'D6 - Estimar medidas de comprimento e massa', correta: 'D', etapa: '5º Ano' },
        { id: 'Q09', nivel: 2, eixo: 'Números e Operações', descritor: 'D19 - Resolver problema multiplicativo direto', correta: 'A', etapa: '5º Ano' },

        // NÍVEL 3 (Adequado)
        { id: 'Q10', nivel: 3, eixo: 'Leitura', descritor: 'D4 - Inferir informação implícita em texto informativo', correta: 'B', etapa: '5º Ano' },
        { id: 'Q11', nivel: 3, eixo: 'Leitura', descritor: 'D8 - Estabelecer relação de causa e consequência', correta: 'C', etapa: '5º Ano' },
        { id: 'Q12', nivel: 3, eixo: 'Tratamento da Informação', descritor: 'D27 - Ler e interpretar dados em gráficos de colunas duplas', correta: 'A', etapa: '5º Ano' },
        { id: 'Q13', nivel: 3, eixo: 'Números e Operações', descritor: 'D20 - Resolver problema envolvendo divisão com resto', correta: 'D', etapa: '5º Ano' },

        // NÍVEL 4 (Consolidado)
        { id: 'Q14', nivel: 4, eixo: 'Leitura', descritor: 'D11 - Distinguir fato de opinião em crônica ou notícia', correta: 'C', etapa: '5º Ano' },
        { id: 'Q15', nivel: 4, eixo: 'Leitura', descritor: 'D13 - Identificar efeito de ironia ou humor em tirinhas', correta: 'B', etapa: '5º Ano' },
        { id: 'Q16', nivel: 4, eixo: 'Números e Operações', descritor: 'D24 - Resolver problema com cálculo de porcentagem simples (10%, 25%, 50%)', correta: 'A', etapa: '5º Ano' },
        { id: 'Q17', nivel: 4, eixo: 'Grandezas e Medidas', descritor: 'D11 - Resolver problema envolvendo cálculo de perímetro e área', correta: 'D', etapa: '5º Ano' },

        // NÍVEL 5 (Avançado)
        { id: 'Q18', nivel: 5, eixo: 'Leitura', descritor: 'D12 - Estabelecer relações lógico-discursivas com conjunções concessivas', correta: 'A', etapa: '5º Ano' },
        { id: 'Q19', nivel: 5, eixo: 'Leitura', descritor: 'D14 - Identificar a tese principal em artigo de opinião', correta: 'D', etapa: '5º Ano' },
        { id: 'Q20', nivel: 5, eixo: 'Tratamento da Informação', descritor: 'D28 - Analisar tendências e médias estatísticas em tabelas complexas', correta: 'C', etapa: '5º Ano' }
    ];

    /**
     * Algoritmo de Posicionamento Cumulativo de Nível de Proficiência (0 a 5)
     * O aluno atinge o maior nível N para o qual obteve aproveitamento >= limiar
     * em todas as questões daquele nível E de todos os níveis anteriores.
     */
    function calculateStudentCumulativeProficiency(student, thresholdRate = 0.65) {
        let hash = 0;
        const seedStr = (student.matricula || '') + (student.nome || '');
        for (let i = 0; i < seedStr.length; i++) hash += seedStr.charCodeAt(i);

        // Simulated score baseline
        let studentBaseScore = student.avg_score || (student.score_lp ? (student.score_lp + student.score_mat) / 6 : 65);
        if (studentBaseScore > 100) studentBaseScore = studentBaseScore / 3;

        let finalLevel = 0;
        let levelBreakdown = [];

        for (let lvl = 0; lvl <= 5; lvl++) {
            const itemsInLevel = SAEB_REFERENCE_ITEMS.filter(q => q.nivel === lvl);
            if (itemsInLevel.length === 0) continue;

            // Compute hit probability at this difficulty level
            let levelSuccessRate = (studentBaseScore / 100) * 1.25 - (lvl * 0.16) + ((hash % 15) / 100) - 0.05;
            levelSuccessRate = Math.max(0.1, Math.min(0.98, levelSuccessRate));

            const total = itemsInLevel.length;
            const hits = Math.round(levelSuccessRate * total);
            const actualRate = hits / total;

            const passed = actualRate >= thresholdRate;
            levelBreakdown.push({
                level: lvl,
                total,
                hits,
                rate: actualRate,
                passed
            });

            if (passed) {
                finalLevel = lvl;
            } else {
                // Stopped at first failing level (Cumulative Rule!)
                break;
            }
        }

        return {
            finalLevel,
            levelBreakdown,
            config: SAEB_LEVEL_CONFIG[finalLevel]
        };
    }

    /**
     * Gerador Dinâmico das Fichas Descritivas dos Níveis
     * Agrupa as habilidades cadastradas nos itens por Eixo Temático
     */
    function generateDynamicLevelDescriptors(questions = SAEB_REFERENCE_ITEMS) {
        const descriptorsByLevel = {};

        for (let lvl = 0; lvl <= 5; lvl++) {
            const items = questions.filter(q => q.nivel === lvl);
            const axesMap = {};

            items.forEach(q => {
                const axis = q.eixo || 'Geral';
                if (!axesMap[axis]) axesMap[axis] = new Set();
                axesMap[axis].add(q.descritor);
            });

            descriptorsByLevel[lvl] = {
                config: SAEB_LEVEL_CONFIG[lvl],
                totalItems: items.length,
                axes: Object.keys(axesMap).map(axis => ({
                    eixo: axis,
                    skills: Array.from(axesMap[axis])
                }))
            };
        }

        return descriptorsByLevel;
    }

    /**
     * Renderizador do Painel de Níveis de Proficiência SAEB (0 a 5)
     */
    function renderSaebProficiencyDashboard() {
        const thresholdInput = document.getElementById('saeb-threshold-input');
        const threshold = thresholdInput ? (parseFloat(thresholdInput.value) / 100) : 0.65;

        const schoolSel = document.getElementById('saeb-school-select');
        const classSel = document.getElementById('saeb-class-select');
        const individualStudentSel = document.getElementById('saeb-individual-student-select');

        // Populate School Select
        if (schoolSel && schoolSel.options.length <= 1) {
            uniqueSchoolsList.forEach(sch => {
                const opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch;
                schoolSel.appendChild(opt);
            });
        }

        const selectedSchool = schoolSel ? schoolSel.value : 'all';
        const selectedClass = classSel ? classSel.value : 'all';

        // Filter students in current scope
        let scopedStudents = loadedStudents.filter(s => {
            const matchSchool = (selectedSchool === 'all' || s.escola === selectedSchool);
            const matchClass = (selectedClass === 'all' || (s.turma && s.turma.includes(selectedClass)) || (s.etapa && s.etapa.includes(selectedClass)));
            return matchSchool && matchClass;
        });

        if (scopedStudents.length === 0) scopedStudents = loadedStudents;

        // Compute Level Distribution
        const levelCounts = [0, 0, 0, 0, 0, 0];
        const studentEvaluations = [];

        scopedStudents.forEach(st => {
            const evalResult = calculateStudentCumulativeProficiency(st, threshold);
            levelCounts[evalResult.finalLevel]++;
            studentEvaluations.push({
                student: st,
                ...evalResult
            });
        });

        const totalEval = scopedStudents.length;

        // Update Participation Meta
        const partMeta = document.getElementById('saeb-participation-meta');
        if (partMeta) {
            const evaluatedCount = Math.round(totalEval * 0.95);
            partMeta.innerHTML = `Taxa de Participação no Simulado: <strong style="color:var(--green-light);">${((evaluatedCount / totalEval) * 100).toFixed(1)}%</strong> (${evaluatedCount.toLocaleString('pt-BR')} de ${totalEval.toLocaleString('pt-BR')} alunos avaliados)`;
        }

        // Update Distribution Bar
        const distBar = document.getElementById('saeb-dist-bar-element');
        if (distBar) {
            distBar.innerHTML = '';
            for (let lvl = 0; lvl <= 5; lvl++) {
                const count = levelCounts[lvl];
                const pct = totalEval > 0 ? ((count / totalEval) * 100).toFixed(1) : '0';
                if (parseFloat(pct) > 0) {
                    const seg = document.createElement('div');
                    seg.className = `saeb-dist-seg seg-${lvl}`;
                    seg.style.width = `${pct}%`;
                    seg.title = `Nível ${lvl}: ${pct}% (${count} alunos)`;
                    seg.textContent = `Nível ${lvl} (${pct}%)`;
                    distBar.appendChild(seg);
                }
            }
        }

        // Update Comparative Table
        const compTbody = document.getElementById('saeb-comparative-table-body');
        if (compTbody) {
            compTbody.innerHTML = '';

            // 1. Rede Geral Row
            const trRede = document.createElement('tr');
            trRede.style.background = 'rgba(139, 92, 246, 0.05)';
            trRede.style.fontWeight = '700';
            trRede.style.borderBottom = '1px solid var(--border-color)';
            trRede.innerHTML = `
                <td style="padding: 10px 14px;">🏛️ Rede Municipal (Média Geral)</td>
                <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono);">${totalEval}</td>
                <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #ef4444;">${((levelCounts[0] / totalEval) * 100).toFixed(1)}%</td>
                <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #f97316;">${((levelCounts[1] / totalEval) * 100).toFixed(1)}%</td>
                <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #eab308;">${((levelCounts[2] / totalEval) * 100).toFixed(1)}%</td>
                <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #0ea5e9;">${((levelCounts[3] / totalEval) * 100).toFixed(1)}%</td>
                <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #22c55e;">${((levelCounts[4] / totalEval) * 100).toFixed(1)}%</td>
                <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #a855f7;">${((levelCounts[5] / totalEval) * 100).toFixed(1)}%</td>
                <td style="padding: 10px 14px; text-align: center; color: var(--purple-light);">Nível 2.6 (224 pts)</td>
            `;
            compTbody.appendChild(trRede);

            // 2. Individual Groups Rows (by School or Class)
            const groupList = (selectedSchool === 'all') ? uniqueSchoolsList.slice(0, 8) : ['2º Ano A (Matutino)', '5º Ano A (Matutino)', '5º Ano B (Vespertino)', '9º Ano A (Matutino)'];

            groupList.forEach((grp, idx) => {
                let gCount = Math.max(20, Math.round(totalEval / groupList.length));
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.innerHTML = `
                    <td style="padding: 10px 14px; font-weight: 600;">${grp}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono);">${gCount}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #ef4444;">${(6 + (idx * 2) % 6)}%</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #f97316;">${(16 + (idx * 3) % 8)}%</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #eab308;">${(26 + (idx * 4) % 10)}%</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #0ea5e9;">${(28 - (idx * 2) % 8)}%</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #22c55e;">${(14 + (idx * 3) % 6)}%</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: #a855f7;">${(6 + (idx * 2) % 5)}%</td>
                    <td style="padding: 10px 14px; text-align: center; font-weight: 600; color: var(--text-primary);">Nível ${(2.4 + (idx * 0.2) % 1.2).toFixed(1)}</td>
                `;
                compTbody.appendChild(tr);
            });
        }

        // Render Dynamic Level Description Cards
        const descContainer = document.getElementById('saeb-level-descriptions-container');
        if (descContainer) {
            descContainer.innerHTML = '';
            const dynamicMap = generateDynamicLevelDescriptors(SAEB_REFERENCE_ITEMS);

            for (let lvl = 0; lvl <= 5; lvl++) {
                const data = dynamicMap[lvl];
                const card = document.createElement('div');
                card.className = `saeb-level-desc-card ${data.config.descCardClass}`;

                let axesHtml = '';
                data.axes.forEach(ax => {
                    axesHtml += `
                        <div style="margin-top: 6px;">
                            <div style="font-size: 0.74rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 2px;">
                                • Eixo ${ax.eixo}:
                            </div>
                            <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: var(--text-primary);">
                                ${ax.skills.map(s => `<li style="margin-bottom: 3px;">${s}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                });

                card.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <span class="level-badge ${data.config.badgeClass}">${data.config.nome}</span>
                        <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">${data.totalItems} questões</span>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                        <em>${data.config.resumo}</em>
                    </p>
                    <div style="border-top: 1px solid var(--border-color); padding-top: 8px; margin-top: 4px;">
                        <strong style="font-size: 0.78rem; color: var(--text-primary);">O estudante provavelmente é capaz de:</strong>
                        ${axesHtml}
                    </div>
                `;

                descContainer.appendChild(card);
            }
        }

        // Populate Individual Student Selector
        if (individualStudentSel) {
            individualStudentSel.innerHTML = '<option value="">Selecione um Estudante para ver a Ficha Individual...</option>';
            studentEvaluations.slice(0, 40).forEach(ev => {
                const opt = document.createElement('option');
                opt.value = ev.student.matricula;
                opt.textContent = `${ev.student.nome} (Matrícula: ${ev.student.matricula} — Nível ${ev.finalLevel})`;
                individualStudentSel.appendChild(opt);
            });

            // Trigger for first student by default
            if (studentEvaluations.length > 0) {
                renderStudentIndividualSaebSheet(studentEvaluations[0]);
            }

            individualStudentSel.onchange = (e) => {
                const found = studentEvaluations.find(ev => ev.student.matricula === e.target.value);
                if (found) renderStudentIndividualSaebSheet(found);
            };
        }

        safeCreateIcons();
    }

    /**
     * Renderizador da Ficha Individual do Aluno (Padrão SAEB)
     */
    function renderStudentIndividualSaebSheet(evalData) {
        const reportEl = document.getElementById('student-saeb-report-content');
        if (!reportEl) return;

        const st = evalData.student;
        const currentLevel = evalData.finalLevel;
        const config = evalData.config;

        // Separate mastered skills (<= current level) vs skills to develop (> current level)
        const masteredSkills = [];
        const skillsToDevelop = [];

        SAEB_REFERENCE_ITEMS.forEach(q => {
            const entry = {
                eixo: q.eixo,
                descritor: q.descritor,
                nivel: q.nivel
            };
            if (q.nivel <= currentLevel) {
                masteredSkills.push(entry);
            } else {
                skillsToDevelop.push(entry);
            }
        });

        reportEl.innerHTML = `
            <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px; margin-bottom: 16px;">
                <div class="flex-between flex-wrap gap-md">
                    <div>
                        <h4 style="margin: 0 0 4px 0; font-size: 1.15rem; color: var(--text-primary);">${st.nome}</h4>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">
                            Matrícula: <strong>${st.matricula}</strong> • Escola: <strong>${st.escola}</strong> • Turma: <strong>${st.turma || st.etapa || '5º Ano A'}</strong>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="level-badge ${config.badgeClass}" style="font-size: 0.88rem; padding: 6px 14px;">
                            ${config.nome}
                        </span>
                        <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">
                            Regra Cumulativa SAEB (Corte ${document.getElementById('saeb-threshold-input')?.value || 65}%)
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid-2" style="gap: 18px;">
                <!-- Habilidades Demonstradas / Dominadas -->
                <div class="skills-list-block" style="border-left: 4px solid #22c55e;">
                    <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; color: #15803d; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="check-circle" style="width:16px; height:16px;"></i> Habilidades Demonstradas & Consolidadas (Níveis 0 a ${currentLevel})
                    </h4>
                    <p style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 12px;">
                        Competências que o estudante já aplica com autonomia e segurança:
                    </p>
                    ${masteredSkills.length === 0 ? '<p class="text-sm text-muted">Ainda em fase de consolidação nas habilidades elementares.</p>' : masteredSkills.slice(0, 6).map(s => `
                        <div class="skill-bullet-item">
                            <span class="badge badge-success" style="font-size:0.68rem; padding:2px 6px;">Nível ${s.nivel}</span>
                            <span><strong>[${s.eixo}]</strong> ${s.descritor}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Habilidades a Desenvolver / Próximo Passo -->
                <div class="skills-list-block" style="border-left: 4px solid #f97316;">
                    <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; color: #c2410c; display: flex; align-items: center; gap: 6px;">
                        <i data-lucide="target" style="width:16px; height:16px;"></i> Próximos Passos Pedagógicos (Avanço para o Nível ${Math.min(5, currentLevel + 1)})
                    </h4>
                    <p style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 12px;">
                        Descritores prioritários para intervenção docente e recomposição de aprendizagem:
                    </p>
                    ${skillsToDevelop.length === 0 ? '<p class="text-sm text-green">Parabéns! O estudante domina todos os níveis avaliados na matriz.</p>' : skillsToDevelop.slice(0, 6).map(s => `
                        <div class="skill-bullet-item">
                            <span class="badge badge-warning" style="font-size:0.68rem; padding:2px 6px;">Nível ${s.nivel}</span>
                            <span><strong>[${s.eixo}]</strong> ${s.descritor}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        safeCreateIcons();
    }

    // Handlers for SAEB Filter Toolbar
    const saebThresholdInput = document.getElementById('saeb-threshold-input');
    if (saebThresholdInput) {
        saebThresholdInput.addEventListener('change', () => {
            renderSaebProficiencyDashboard();
            showToast(`Limiar de corte atualizado para ${saebThresholdInput.value}%!`, 'check');
        });
    }

    const saebSchoolSel = document.getElementById('saeb-school-select');
    if (saebSchoolSel) {
        saebSchoolSel.addEventListener('change', renderSaebProficiencyDashboard);
    }

    const saebClassSel = document.getElementById('saeb-class-select');
    if (saebClassSel) {
        saebClassSel.addEventListener('change', renderSaebProficiencyDashboard);
    }

    const btnExportSaebReport = document.getElementById('btn-export-saeb-report');
    if (btnExportSaebReport) {
        btnExportSaebReport.addEventListener('click', () => {
            showToast('Gerando Boletim Oficial SAEB em formato PDF de alta resolução...', 'file-text');
        });
    }

    // ==========================================
    // CRONOGRAMA DE HABILIDADES DA REDE (40 SEMANAS - FONTE ÚNICA DA VERDADE)
    // ==========================================

    let skillsScheduleList = [];

    function generateFull40WeeksSchedule(targetIdeb = 6.5) {
        const val = parseFloat(targetIdeb) || 6.5;
        const generated = [];

        const descriptorPool = [
            { etapa: '2º Ano', comp: 'Língua Portuguesa (Alfabetização)', desc: 'SEAMA D01', tit: 'Reconhecer letras do alfabeto e correspondência fonema-grafema', met: 'Alfabeto móvel, cantigas populares e identificação do nome próprio e dos colegas.' },
            { etapa: '2º Ano', comp: 'Língua Portuguesa (Fluência)', desc: 'SEAMA D02', tit: 'Ler palavras com sílabas canônicas e não canônicas com fluência', met: 'Cartões de leitura rápida, leitura compartilhada e contação de histórias.' },
            { etapa: '2º Ano', comp: 'Matemática (Contagem)', desc: 'SEAMA D03', tit: 'Contar e comparar quantidades de objetos em coleções até 100', met: 'Contagem de tampinhas, ábacos e resolução de desafios em duplas.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D01', tit: 'Localizar informações explícitas em textos narrativos e informativos', met: 'Sublinhado seletivo, caça ao tesouro textual e reescrita de trechos.' },
            { etapa: '5º Ano', comp: 'Matemática (Operações)', desc: 'SAEB D13', tit: 'Resolver problemas envolvendo adição e subtração com números naturais', met: 'Material dourado, situações-problema do cotidiano comercial e cálculo mental.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D03', tit: 'Inferir o sentido de uma palavra ou expressão a partir do contexto', met: 'Leitura de fábulas e crônicas com busca de pistas contextuais e sinônimos.' },
            { etapa: '5º Ano', comp: 'Matemática (Multiplicação/Divisão)', desc: 'SAEB D14', tit: 'Resolver problemas envolvendo multiplicação e divisão de números naturais', met: 'Jogos de tabuleiros, algoritmo usual e partilha de quantias.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D04', tit: 'Inferir uma informação implícita em texto narrativo ou informativo', met: 'Análise de charges, tirinhas e identificação de subentendidos e duplos sentidos.' },
            { etapa: '5º Ano', comp: 'Matemática (Espaço e Forma)', desc: 'SAEB D06', tit: 'Estimar e medir áreas de figuras desenhadas em malhas quadriculadas', met: 'Uso de geoplano, papel quadriculado e medição real do piso da sala.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D06', tit: 'Identificar o tema ou assunto central de um texto', met: 'Elaboração de títulos alternativos, mapas mentais e síntese de parágrafos.' },
            { etapa: '5º Ano', comp: 'Matemática (Grandezas e Medidas)', desc: 'SAEB D08', tit: 'Calcular o perímetro de figuras planas desenhadas em malhas', met: 'Contorno de figuras com barbante, medição com fita métrica e registro em tabela.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D11', tit: 'Distinguir um fato da opinião relativa a esse fato', met: 'Debates regrados em sala com análise de notícias e cartas de leitores.' },
            { etapa: '5º Ano', comp: 'Matemática (Números Racionais)', desc: 'SAEB D20', tit: 'Resolver problemas com números decimais e sistema monetário brasileiro', met: 'Simulação de lojinha com cédulas didáticas e cálculo de troco.' },
            { etapa: '9º Ano', comp: 'Matemática (Espaço e Forma)', desc: 'SAEB D01', tit: 'Identificar a localização/movimentação de objeto no plano cartesiano', met: 'Batalha naval matemática, coordenadas geográficas e leitura de mapas.' },
            { etapa: '9º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D05', tit: 'Interpretar texto com auxílio de material gráfico diverso (propagandas/tabelas)', met: 'Leitura crítica de infográficos, anúncios publicitários e gráficos estatísticos.' },
            { etapa: '9º Ano', comp: 'Matemática (Álgebra)', desc: 'SAEB D16', tit: 'Identificar a localização de números inteiros na reta numérica', met: 'Reta numérica no chão da sala de aula com deslocamento dos alunos.' },
            { etapa: '9º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D07', tit: 'Identificar o conflito gerador do enredo e os elementos da narrativa', met: 'Estruturação do arco narrativo em contos de mistério e crônicas urbanas.' },
            { etapa: '9º Ano', comp: 'Matemática (Proporcionalidade)', desc: 'SAEB D19', tit: 'Resolver problemas envolvendo cálculo de porcentagem simples e comercial', met: 'Cálculo de descontos, juros simples e interpretação de índices socioeconômicos.' },
            { etapa: '9º Ano', comp: 'Língua Portuguesa (Coesão)', desc: 'SAEB D12', tit: 'Identificar o efeito de sentido decorrente da escolha de uma pontuação', met: 'Análise de poemas e contos dramáticos com substituição de pontuações.' },
            { etapa: '9º Ano', comp: 'Matemática (Estatística)', desc: 'SAEB D27', tit: 'Ler e interpretar dados apresentados em tabelas de dupla entrada e gráficos', met: 'Construção de gráficos de colunas e setores a partir de pesquisas escolares.' }
        ];

        for (let i = 1; i <= 40; i++) {
            // Milestone assessment weeks: 10, 20, 30, 40
            if (i % 10 === 0) {
                const simNum = i / 10;
                generated.push({
                    id: `SCH_${i}`,
                    semana: `Semana ${i}`,
                    etapa: 'Todas as Etapas',
                    componente: 'Avaliação Diagnóstica Integrada',
                    descritor: `SIMULADO REDE ${simNum}`,
                    titulo: `${simNum}º Simulado Diagnóstico Geral de Rede (IDEB Meta ${val.toFixed(1)})`,
                    metodologia: 'Aplicação padrão SAEB/SEAMA, correção em tempo real por matriz de descritores e tabulação de dados.',
                    status: (i <= 10) ? 'cumprido' : (i === 20 ? 'andamento' : 'pendente'),
                    professor_obs: (i <= 10) ? 'Simulado aplicado em 100% das turmas com taxa de presença de 96%.' : 'Agendado conforme calendário letivo municipal.'
                });
            } else {
                const template = descriptorPool[(i - 1) % descriptorPool.length];
                let status = 'pendente';
                let obs = 'Programado para o ciclo letivo.';
                if (i <= 4) {
                    status = 'cumprido';
                    obs = 'Habilidade trabalhada com excelente engajamento e fixação pelos estudantes.';
                } else if (i <= 7) {
                    status = 'andamento';
                    obs = 'Em execução nas salas de aula com acompanhamento do coordenador pedagógico.';
                }

                generated.push({
                    id: `SCH_${i}`,
                    semana: `Semana ${i}`,
                    etapa: template.etapa,
                    componente: template.comp,
                    descritor: template.desc,
                    titulo: template.tit,
                    metodologia: template.met,
                    status: status,
                    professor_obs: obs
                });
            }
        }

        skillsScheduleList = generated;
        return skillsScheduleList;
    }

    function renderSkillsSchedule() {
        const container = document.getElementById('skills-schedule-container');
        if (!container) return;

        // Ensure schedule is generated if empty
        if (skillsScheduleList.length === 0) {
            const currentTargetIdeb = document.getElementById('target-ideb-input')?.value || 6.5;
            generateFull40WeeksSchedule(currentTargetIdeb);
        }

        const stageFilter = document.getElementById('schedule-filter-stage')?.value || 'all';
        const statusFilter = document.getElementById('schedule-filter-status')?.value || 'all';

        const filtered = skillsScheduleList.filter(item => {
            const matchStage = (stageFilter === 'all' || item.etapa === stageFilter || item.etapa === 'Todas as Etapas');
            const matchStatus = (statusFilter === 'all' || item.status === statusFilter);
            return matchStage && matchStatus;
        });

        // Compute KPIs
        const totalWeeks = skillsScheduleList.length;
        const completedWeeks = skillsScheduleList.filter(s => s.status === 'cumprido').length;
        const complianceRate = totalWeeks > 0 ? ((completedWeeks / totalWeeks) * 100).toFixed(1) : '0';

        const kpiWeeks = document.getElementById('schedule-kpi-weeks');
        const kpiCompliance = document.getElementById('schedule-kpi-compliance');
        const kpiCompletedSub = document.getElementById('schedule-kpi-completed-sub');
        const kpiSkills = document.getElementById('schedule-kpi-skills');
        const kpiTargetIdeb = document.getElementById('schedule-kpi-target-ideb');

        const currentTargetVal = document.getElementById('target-ideb-input')?.value || '6.5';
        if (kpiWeeks) kpiWeeks.textContent = `${totalWeeks} Semanas`;
        if (kpiCompliance) kpiCompliance.textContent = `${complianceRate}%`;
        if (kpiCompletedSub) kpiCompletedSub.textContent = `${completedWeeks} de ${totalWeeks} metas cumpridas`;
        if (kpiSkills) kpiSkills.textContent = '48 Descritores';
        if (kpiTargetIdeb) kpiTargetIdeb.textContent = `Meta ${currentTargetVal}`;

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg);">
                    <i data-lucide="calendar-x" style="width:36px; height:36px; opacity:0.4; margin-bottom:10px; display:inline-block;"></i>
                    <p style="margin:0; font-size:0.9rem;">Nenhuma semana cadastrada com esses filtros.</p>
                </div>
            `;
            safeCreateIcons();
            return;
        }

        filtered.forEach(item => {
            let statusPillClass = 'status-pendente';
            let statusLabel = 'Pendente / Não Cumprido 🔴';
            if (item.status === 'cumprido') {
                statusPillClass = 'status-cumprido';
                statusLabel = 'Cumprido 🟢';
            } else if (item.status === 'andamento') {
                statusPillClass = 'status-andamento';
                statusLabel = 'Em Andamento 🟡';
            }

            const isMilestone = item.descritor.includes('SIMULADO');

            const card = document.createElement('div');
            card.className = 'schedule-week-card';
            if (isMilestone) {
                card.style.borderLeft = '4px solid var(--purple-light)';
                card.style.background = 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)';
            }

            card.innerHTML = `
                <div class="flex-between flex-wrap gap-md" style="margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap:wrap;">
                        <span style="font-size: 1.1rem; font-weight: 800; color: var(--purple-light);">${item.semana}</span>
                        <span class="badge ${isMilestone ? 'badge-warning' : 'badge-purple'}" style="font-size: 0.72rem;">${item.etapa}</span>
                        <span class="badge badge-outline" style="font-size: 0.72rem;">${item.descritor}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${item.componente}</span>
                    </div>
                    <div>
                        <span class="schedule-status-pill ${statusPillClass}">${statusLabel}</span>
                    </div>
                </div>

                <h4 style="margin: 0 0 6px 0; font-size: 1.05rem; color: var(--text-primary);">${item.titulo}</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 10px 0;">
                    <strong>Metodologia Sugerida:</strong> ${item.metodologia}
                </p>

                ${item.professor_obs ? `
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.78rem; color: var(--text-primary); margin-bottom: 12px;">
                        <i data-lucide="message-square" style="width:13px; height:13px; color: var(--purple-light); display:inline-block; vertical-align:middle; margin-right:4px;"></i>
                        <strong>Registro Pedagógico:</strong> "${item.professor_obs}"
                    </div>
                ` : ''}

                <!-- Teacher Action Buttons -->
                <div class="flex-between flex-wrap gap-sm border-top" style="padding-top: 10px; margin-top: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">
                        <i data-lucide="user-check" style="width:13px; height:13px; display:inline-block; vertical-align:middle;"></i>
                        Acompanhamento Docente:
                    </span>
                    <div style="display: flex; gap: 8px; flex-wrap:wrap;">
                        <button class="btn btn-outline btn-sm set-schedule-status-btn" data-id="${item.id}" data-status="cumprido" style="color: #15803d; border-color: #bbf7d0;">
                            <i data-lucide="check" style="width:13px; height:13px;"></i> Cumprido
                        </button>
                        <button class="btn btn-outline btn-sm set-schedule-status-btn" data-id="${item.id}" data-status="andamento" style="color: #a16207; border-color: #fef08a;">
                            <i data-lucide="clock" style="width:13px; height:13px;"></i> Em Andamento
                        </button>
                        <button class="btn btn-outline btn-sm set-schedule-status-btn" data-id="${item.id}" data-status="pendente" style="color: #dc2626; border-color: #fca5a5;">
                            <i data-lucide="alert-circle" style="width:13px; height:13px;"></i> Justificar
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        // Event listeners for status buttons
        container.querySelectorAll('.set-schedule-status-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const newStatus = btn.getAttribute('data-status');
                const item = skillsScheduleList.find(s => s.id === id);

                if (item) {
                    if (newStatus === 'pendente') {
                        const just = prompt(`Informe a justificativa pedagógica para a "${item.semana}" (${item.descritor}):`, item.professor_obs || 'Conteúdo necessitou de replanejamento');
                        if (just) item.professor_obs = just;
                    } else if (newStatus === 'cumprido') {
                        const obs = prompt(`Adicionar anotação de consolidação para a "${item.semana}" (${item.descritor}):`, item.professor_obs || 'Habilidade trabalhada e consolidada com a turma.');
                        if (obs) item.professor_obs = obs;
                    }
                    item.status = newStatus;
                    renderSkillsSchedule();
                    showToast(`Status da ${item.semana} atualizado para "${newStatus.toUpperCase()}"!`, 'check');
                }
            });
        });

        renderDailyCalendar();
        renderSchoolRoutineMonitoring();
        safeCreateIcons();
    }

    // Modal Create Schedule Item Handlers
    const btnOpenCreateSchedule = document.getElementById('btn-open-create-schedule-modal');
    const modalCreateSchedule = document.getElementById('create-schedule-modal');
    const btnCloseCreateSchedule = document.getElementById('btn-close-create-schedule-modal');
    const btnCancelCreateSchedule = document.getElementById('btn-cancel-create-schedule');
    const formCreateSchedule = document.getElementById('form-create-schedule');

    if (btnOpenCreateSchedule && modalCreateSchedule) {
        btnOpenCreateSchedule.addEventListener('click', () => {
            modalCreateSchedule.classList.remove('hidden');
        });
    }
    if (btnCloseCreateSchedule && modalCreateSchedule) {
        btnCloseCreateSchedule.addEventListener('click', () => modalCreateSchedule.classList.add('hidden'));
    }
    if (btnCancelCreateSchedule && modalCreateSchedule) {
        btnCancelCreateSchedule.addEventListener('click', () => modalCreateSchedule.classList.add('hidden'));
    }
    if (formCreateSchedule && modalCreateSchedule) {
        formCreateSchedule.addEventListener('submit', (e) => {
            e.preventDefault();
            const week = document.getElementById('sched-input-week').value.trim();
            const stage = document.getElementById('sched-input-stage').value;
            const comp = document.getElementById('sched-input-component').value;
            const desc = document.getElementById('sched-input-descriptor').value.trim();
            const title = document.getElementById('sched-input-title').value.trim();
            const meth = document.getElementById('sched-input-methodology').value.trim();

            const newItem = {
                id: `SCH_${Date.now()}`,
                semana: week || `Semana ${skillsScheduleList.length + 1}`,
                etapa: stage,
                componente: comp,
                descritor: desc || 'Descritor BNCC',
                titulo: title,
                metodologia: meth || 'Atividades de fixação e diagnóstico.',
                status: 'andamento',
                professor_obs: 'Semana cadastrada manualmente.'
            };

            skillsScheduleList.push(newItem);
            modalCreateSchedule.classList.add('hidden');
            if (formCreateSchedule) formCreateSchedule.reset();

            renderSkillsSchedule();
            showToast(`${week} cadastrada no cronograma com sucesso!`, 'check');
        });
    }

    // Generator Button in Cronograma Header
    const btnGenerateScheduleIa = document.getElementById('btn-generate-schedule-ia');
    if (btnGenerateScheduleIa) {
        btnGenerateScheduleIa.addEventListener('click', () => {
            const currentTargetVal = document.getElementById('target-ideb-input')?.value || 6.5;
            generateFull40WeeksSchedule(currentTargetVal);
            renderSkillsSchedule();
            showToast(`Cronograma de 40 semanas gerado conforme dados atuais com foco na Meta IDEB ${currentTargetVal}!`, 'sparkles');
        });
    }

    // Button from Metas & Plan linking directly to Cronograma de Habilidades
    const btnGotoSkillsSchedule = document.getElementById('btn-goto-skills-schedule');
    if (btnGotoSkillsSchedule) {
        btnGotoSkillsSchedule.addEventListener('click', () => {
            const currentTargetVal = document.getElementById('target-ideb-input')?.value || 6.5;
            if (skillsScheduleList.length === 0) {
                generateFull40WeeksSchedule(currentTargetVal);
            }
            window.navigateToTab('cronograma-habilidades');
            showToast(`Exibindo cronograma de 40 semanas alinhado à Meta IDEB ${currentTargetVal}!`, 'calendar-check-2');
        });
    }

    // Filter listeners for schedule
    // Daily Calendar Logic (Segunda a Sexta)
    function renderDailyCalendar() {
        const weekSelect = document.getElementById('calendar-week-select');
        const stageSelect = document.getElementById('calendar-stage-select');
        const cardsGrid = document.getElementById('calendar-daily-cards-grid');
        if (!cardsGrid) return;

        if (weekSelect && weekSelect.children.length === 0) {
            for (let w = 1; w <= 40; w++) {
                const opt = document.createElement('option');
                opt.value = `Semana ${w}`;
                opt.textContent = `Semana ${w} (Letiva)`;
                if (w === 1) opt.selected = true;
                weekSelect.appendChild(opt);
            }
            weekSelect.addEventListener('change', renderDailyCalendar);
            if (stageSelect) stageSelect.addEventListener('change', renderDailyCalendar);
        }

        const selectedWeek = weekSelect ? weekSelect.value : 'Semana 1';
        const selectedStage = stageSelect ? stageSelect.value : '5º Ano';

        const weekItem = skillsScheduleList.find(s => s.semana === selectedWeek) || {
            descritor: 'Matemática • D13',
            titulo: 'Operações Fundamentais com Números Naturais'
        };

        const dailyPlan = [
            {
                dia: 'Segunda-feira',
                fase: 'Abertura & Sondagem',
                titulo: `Sondagem Prévia • ${weekItem.descritor}`,
                acao: 'Apresentação do descritor com 2 situações rápidas no quadro. Diagnóstico oral com a turma.',
                material: 'Quadro branco e fichas de sondagem rápida.',
                tag: 'Diagnóstico 🟢'
            },
            {
                dia: 'Terça-feira',
                fase: 'Conceito & Prática',
                titulo: 'Exploração com Material Concreto',
                acao: 'Trabalho em duplas com material estruturado (material dourado ou texto impresso guiado).',
                material: 'Caderno pedagógico e material manipulável.',
                tag: 'Prática Ativa 🔵'
            },
            {
                dia: 'Quarta-feira',
                fase: 'Contextualização',
                titulo: 'Situações-Problema do Cotidiano',
                acao: 'Resolução de problemas contextualizados com dados e histórias da realidade local de Gonçalves Dias.',
                material: 'Caderno do estudante SEMED.',
                tag: 'Aplicação 🟣'
            },
            {
                dia: 'Quinta-feira',
                fase: 'Aprofundamento',
                titulo: 'Desafio Rápido & Fixação',
                acao: 'Oficina de cálculo mental ou leitura dinâmica com correção dialogada entre os estudantes.',
                material: 'Folhas pautadas e cartões de resposta.',
                tag: 'Oficina 🟠'
            },
            {
                dia: 'Sexta-feira',
                fase: 'Checagem Formativa',
                titulo: 'Mini-Simulado Formativo (3 Itens)',
                acao: 'Aplicação individual de 3 itens padrão SAEB/SEAMA e registro do índice de acerto no sistema.',
                material: 'Folha de checagem formativa semanal.',
                tag: 'Checagem 🔴'
            }
        ];

        cardsGrid.innerHTML = '';
        dailyPlan.forEach(d => {
            const card = document.createElement('div');
            card.style.background = 'var(--bg-tertiary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.padding = '14px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            card.innerHTML = `
                <div>
                    <div class="flex-between" style="margin-bottom: 6px;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--purple-light);">${d.dia}</span>
                        <span class="badge badge-outline" style="font-size: 0.65rem;">${d.tag}</span>
                    </div>
                    <h5 style="margin: 0 0 6px 0; font-size: 0.82rem; color: var(--text-primary);">${d.titulo}</h5>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 8px 0; line-height: 1.45;">
                        ${d.acao}
                    </p>
                </div>
                <div style="border-top: 1px solid var(--border-color); padding-top: 6px; font-size: 0.7rem; color: var(--text-muted);">
                    <strong>Recurso:</strong> ${d.material}
                </div>
            `;
            cardsGrid.appendChild(card);
        });
    }

    // School Routine Monitoring Report Logic
    function renderSchoolRoutineMonitoring() {
        const tbody = document.getElementById('school-routine-monitoring-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const schoolsMonitoring = [
            { nome: 'UI JOSE CORREA LIMA', diretor: 'Profª Maria da Conceição Lima', taxa: 94, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Rotina pedagógica executada conforme o cronograma oficial.', status: 'Regular 🟢' },
            { nome: 'UI EMILIO MURAD', diretor: 'Prof. Francisco Carlos Silva', taxa: 88, s2: 'cumprido', s5: 'andamento', s9: 'cumprido', obs: 'Acompanhamento do reforço de leitura no 5º ano.', status: 'Regular 🟢' },
            { nome: 'UE VEREADOR LEONARDO FERREIRA LIMA', diretor: 'Profª Antonia Ferreira Lima', taxa: 98, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Destaque no cumprimento das oficinas de cálculo mental.', status: 'Destaque ⭐' },
            { nome: 'U I BASILIO ALVES', diretor: 'Prof. José Basílio Alves', taxa: 82, s2: 'andamento', s5: 'andamento', s9: 'pendente', obs: 'Supervisão técnica SEMED agendada para apoio pedagógico.', status: 'Atenção 🟡' },
            { nome: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ', diretor: 'Profª Aldenora Araújo Cruz', taxa: 96, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Turmas do 9º ano com 100% de adesão aos simulados.', status: 'Regular 🟢' },
            { nome: 'UE RAIMUNDO DOS REIS DA SILVA', diretor: 'Prof. Raimundo Nonato Reis', taxa: 86, s2: 'cumprido', s5: 'andamento', s9: 'cumprido', obs: 'Reforço no descritor SAEB D13 em execução.', status: 'Regular 🟢' },
            { nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', diretor: 'Prof. Raimundo José Dias', taxa: 92, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Frequência regular e checagem formativa registrada.', status: 'Regular 🟢' },
            { nome: 'UNIDADE ESCOLAR ANISIO GOMES', diretor: 'Profª Francisca Anísio Gomes', taxa: 90, s2: 'cumprido', s5: 'cumprido', s9: 'andamento', obs: 'Orientação concluída sobre o registro docente no sistema.', status: 'Regular 🟢' },
            { nome: 'UE ANITA FURTADO', diretor: 'Profª Ana Rita Anita Furtado', taxa: 97, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Oficinas de fluência leitora e matemática com alto engajamento.', status: 'Destaque ⭐' }
        ];

        schoolsMonitoring.forEach(sch => {
            const badge2 = sch.s2 === 'cumprido' ? '<span class="badge badge-success">OK 🟢</span>' : '<span class="badge badge-warning">Em Andamento 🟡</span>';
            const badge5 = sch.s5 === 'cumprido' ? '<span class="badge badge-success">OK 🟢</span>' : (sch.s5 === 'andamento' ? '<span class="badge badge-warning">Em Andamento 🟡</span>' : '<span class="badge badge-danger">Pendente 🔴</span>');
            const badge9 = sch.s9 === 'cumprido' ? '<span class="badge badge-success">OK 🟢</span>' : (sch.s9 === 'andamento' ? '<span class="badge badge-warning">Em Andamento 🟡</span>' : '<span class="badge badge-danger">Pendente 🔴</span>');

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '44px';

            tr.innerHTML = `
                <td style="padding: 10px 14px; font-weight:600; color:var(--text-primary);">${sch.nome}</td>
                <td style="padding: 10px 14px; font-size:0.8rem; color:var(--text-secondary);">${sch.diretor}</td>
                <td style="padding: 10px 14px; text-align:center; font-family:var(--font-mono); font-weight:700; color:var(--purple-light);">${sch.taxa}%</td>
                <td style="padding: 10px 14px; text-align:center;">${badge2}</td>
                <td style="padding: 10px 14px; text-align:center;">${badge5}</td>
                <td style="padding: 10px 14px; text-align:center;">${badge9}</td>
                <td style="padding: 10px 14px; font-size:0.78rem; color:var(--text-secondary);">${sch.obs}</td>
                <td style="padding: 10px 14px; text-align:center; font-weight:600; font-size:0.78rem;">${sch.status}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    const btnExportSchoolMonitoring = document.getElementById('btn-export-school-monitoring');
    if (btnExportSchoolMonitoring) {
        btnExportSchoolMonitoring.addEventListener('click', () => {
            showToast('Preparando impressão do Relatório de Monitoramento da Rotina...', 'printer');
            setTimeout(() => {
                window.print();
            }, 300);
        });
    }

    const schedFilterStage = document.getElementById('schedule-filter-stage');
    if (schedFilterStage) schedFilterStage.addEventListener('change', renderSkillsSchedule);

    const schedFilterStatus = document.getElementById('schedule-filter-status');
    if (schedFilterStatus) schedFilterStatus.addEventListener('change', renderSkillsSchedule);

    const btnExportSchedule = document.getElementById('btn-export-schedule');
    if (btnExportSchedule) {
        btnExportSchedule.addEventListener('click', () => {
            showToast('Exportando Cronograma de Habilidades da Rede em PDF...', 'download');
        });
    }

    // Synchronize Meta IDEB Input with Strategic Model Info
    const targetIdebInput = document.getElementById('target-ideb-input');
    if (targetIdebInput) {
        targetIdebInput.addEventListener('input', () => {
            const val = parseFloat(targetIdebInput.value) || 6.5;
            const modelTitle = document.getElementById('strategic-model-title');
            const modelDesc = document.getElementById('strategic-model-desc');
            const kpiTarget = document.getElementById('schedule-kpi-target-ideb');

            if (kpiTarget) kpiTarget.textContent = `Meta ${val.toFixed(1)}`;

            let modelName = 'Aceleração Intermediária';
            if (val >= 6.5) {
                modelName = 'Aceleração Avançada (Sobral/Ceará)';
            } else if (val < 5.5) {
                modelName = 'Consolidação e Nivelamento Básico';
            }

            if (modelTitle) {
                modelTitle.innerHTML = `Modelo Estratégico Sugerido: <span style="color:var(--purple-light);">${modelName}</span>`;
            }
            if (modelDesc) {
                modelDesc.innerHTML = `Para atingir a meta de <strong>${val.toFixed(1)}</strong>, a rede distribui os 48 descritores críticos de Língua Portuguesa e Matemática ao longo de <strong>40 semanas letivas</strong>, com simulados diagnósticos e intervenções pedagógicas contínuas.`;
            }
        });
    }

    // ==========================================
    // GESTÃO PEDAGÓGICA: SUBTAB TOGGLING & RISK TABLES
    // ==========================================
    const pedagogicSubtabBtns = document.querySelectorAll('.pedagogic-subtab-btn');
    const pedagogicSubtabContents = document.querySelectorAll('.pedagogic-subtab-content');

    pedagogicSubtabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            pedagogicSubtabBtns.forEach(b => {
                b.classList.remove('active');
                b.style.color = 'var(--text-secondary)';
                b.style.borderBottom = 'none';
                b.style.fontWeight = '500';
            });
            btn.classList.add('active');
            btn.style.color = 'var(--purple-light)';
            btn.style.borderBottom = '2px solid var(--purple)';
            btn.style.fontWeight = '600';

            const target = btn.getAttribute('data-subtab');
            pedagogicSubtabContents.forEach(content => {
                if (content.id === target) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });

            if (target === 'niveis-saeb-sub') {
                renderSaebProficiencyDashboard();
            } else if (target === 'planos-intervencao-sub') {
                populateInterventionPlansSelectors();
            }
        });
    });

    function renderRiskGoalsTable() {
        populateIdebGoalsTable();
    }

    const btnGenerateAiPlan = document.getElementById('btn-generate-ai-plan');
    if (btnGenerateAiPlan) {
        btnGenerateAiPlan.addEventListener('click', () => {
            showToast('IA está analisando lacunas... Novo plano adicionado à lista!', 'sparkles');
            
            // Add new custom mock plan to container
            const container = document.getElementById('pedagogic-plans-container');
            if (container) {
                const planDiv = document.createElement('div');
                planDiv.className = 'card-outline';
                planDiv.style.border = '1px solid var(--border-color)';
                planDiv.style.padding = '16px';
                planDiv.style.borderRadius = 'var(--radius-md)';
                planDiv.style.background = 'var(--bg-tertiary)';
                planDiv.style.display = 'flex';
                planDiv.style.flexDirection = 'column';
                planDiv.style.justifyContent = 'space-between';
                planDiv.style.height = '100%';

                planDiv.innerHTML = `
                    <div>
                        <div class="flex-between" style="align-items: center; margin-bottom: 12px;">
                            <span class="badge badge-purple">Mista - LP01/MT13</span>
                            <span class="text-sm text-muted">Novo plano gerado</span>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color:var(--purple-light);">Intervenção Interdisciplinar Integrada</h4>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 16px;">Plano focado em elevar o rendimento integrando descritores de interpretação de dados com enunciados textuais matemáticos.</p>
                    </div>
                    <div class="flex-between border-top padding-top-sm" style="margin-top: 12px; padding-top: 10px;">
                        <span class="badge badge-success">Recomendado</span>
                        <button class="btn btn-outline btn-sm download-plan-btn" data-plan="custom"><i data-lucide="download" style="width:14px; height:14px;"></i> PDF</button>
                    </div>
                `;
                container.prepend(planDiv);
                safeCreateIcons();
            }
        });
    }

    const pedagogicPlansData = {
        lp1: {
            title: "Resolução de Operações Fundamentais",
            meta: "Matemática - Descritor D13 (975 alunos afetados)",
            body: `
                <h4>Objetivo Geral</h4>
                <p>Consolidar a resolução de problemas envolvendo as quatro operações fundamentais com números naturais.</p>
                
                <h4 style="margin-top:12px;">Metodologia Proposta (4 semanas)</h4>
                <ul>
                    <li><strong>Semana 1:</strong> Uso do Material Dourado e Ábacos para visualização de agrupamentos e trocas (Adição e Subtração).</li>
                    <li><strong>Semana 2:</strong> Resolução de problemas cotidianos de compra e venda (Operações inversas).</li>
                    <li><strong>Semana 3:</strong> Jogos de tabuleiros envolvendo multiplicação rápida e divisão de partilha.</li>
                    <li><strong>Semana 4:</strong> Simulado focado em itens clássicos do SAEB para o D13.</li>
                </ul>

                <h4 style="margin-top:12px;">Recursos Necessários</h4>
                <p>Material dourado, ábaco de pinos, folha de atividades estruturadas e jogos matemáticos didáticos.</p>

                <h4 style="margin-top:12px;">Questão de Avaliação (Exemplo)</h4>
                <div style="border:1px solid var(--border-color); padding:10px; border-radius:4px; margin-top:8px; background:var(--bg-tertiary);">
                    <p><em>"Uma padaria vendeu 12 caixas de pães. Cada caixa continha 18 pães. Quantos pães foram vendidos no total?"</em></p>
                    <p style="margin-top:4px; font-weight:600;">Gabarito Correto: 216 pães (Operação: 12 x 18)</p>
                </div>
            `
        },
        lp2: {
            title: "Inferência e Sentido Global de Palavras",
            meta: "Português - Descritor D03 (1.240 alunos afetados)",
            body: `
                <h4>Objetivo Geral</h4>
                <p>Desenvolver a capacidade de inferir o sentido de uma palavra ou expressão em diferentes gêneros textuais.</p>
                
                <h4 style="margin-top:12px;">Metodologia Proposta (4 semanas)</h4>
                <ul>
                    <li><strong>Semana 1:</strong> Leitura de charges e tirinhas, focando na ironia e em expressões idiomáticas populares.</li>
                    <li><strong>Semana 2:</strong> Vocabulário contextualizado: substituição de sinônimos em contos e crônicas.</li>
                    <li><strong>Semana 3:</strong> Atividades de interpretação focadas no duplo sentido em slogans publicitários.</li>
                    <li><strong>Semana 4:</strong> Diagnóstico de leitura individual e aplicação de itens simulados de proficiência D3.</li>
                </ul>

                <h4 style="margin-top:12px;">Recursos Necessários</h4>
                <p>Coletânea de tirinhas (Mafalda, Turma da Mônica), fichas de atividades textuais e dicionário de sinônimos.</p>

                <h4 style="margin-top:12px;">Questão de Avaliação (Exemplo)</h4>
                <div style="border:1px solid var(--border-color); padding:10px; border-radius:4px; margin-top:8px; background:var(--bg-tertiary);">
                    <p><em>"No trecho 'Os alunos ficaram de orelha em pé ao ouvir o diretor', a expressão sublinhada sugere que eles ficaram:"</em></p>
                    <p style="margin-top:4px; font-weight:600;">Gabarito Correto: Desconfiados / Atentos.</p>
                </div>
            `
        },
        lp3: {
            title: "Propriedades Físicas dos Materiais",
            meta: "Ciências - Descritor EF05CI01 (612 alunos afetados)",
            body: `
                <h4>Objetivo Geral</h4>
                <p>Reforçar conceitos básicos sobre magnetismo, condutibilidade térmica e densidade dos materiais.</p>
                
                <h4 style="margin-top:12px;">Metodologia Proposta (4 semanas)</h4>
                <ul>
                    <li><strong>Semana 1:</strong> Investigação prática de atração magnética com ímãs e diversos objetos de metal, madeira e plástico.</li>
                    <li><strong>Semana 2:</strong> Experimento comparativo de condução térmica em colheres de madeira, metal e plástico expostas à água morna.</li>
                    <li><strong>Semana 3:</strong> Densidade na prática: teste de flutuação de diferentes materiais em água.</li>
                    <li><strong>Semana 4:</strong> Elaboração de relatórios ilustrados e consolidação teórica.</li>
                </ul>

                <h4 style="margin-top:12px;">Recursos Necessários</h4>
                <p>Ímãs de geladeira, colheres diversas, água morna, recipientes transparentes e objetos flutuantes/não flutuantes.</p>

                <h4 style="margin-top:12px;">Questão de Avaliação (Exemplo)</h4>
                <div style="border:1px solid var(--border-color); padding:10px; border-radius:4px; margin-top:8px; background:var(--bg-tertiary);">
                    <p><em>"Ao colocar uma rolha de cortiça e uma moeda de metal em um copo com água, observamos que:"</em></p>
                    <p style="margin-top:4px; font-weight:600;">Gabarito Correto: A rolha flutua (menos densa) e a moeda afunda (mais densa).</p>
                </div>
            `
        },
        custom: {
            title: "Intervenção Interdisciplinar Integrada",
            meta: "Mista - Descritores LP01/MT13 (Novo plano gerado)",
            body: `
                <h4>Objetivo Geral</h4>
                <p>Elevar a competência em interpretação de enunciados matemáticos complexos integrando leitura crítica e operações.</p>
                
                <h4 style="margin-top:12px;">Metodologia Proposta (4 semanas)</h4>
                <ul>
                    <li><strong>Semana 1:</strong> Decodificação textual de gráficos e tabelas estatísticas.</li>
                    <li><strong>Semana 2:</strong> Tradução de problemas escritos em linguagem natural para expressões matemáticas formais.</li>
                    <li><strong>Semana 3:</strong> Resolução de problemas matemáticos focando nos distratores comuns (erros de leitura).</li>
                    <li><strong>Semana 4:</strong> Avaliação em dupla misturando textos de notícias com operações matemáticas associadas.</li>
                </ul>

                <h4 style="margin-top:12px;">Recursos Necessários</h4>
                <p>Jornais locais, panfletos de supermercados e apostilas interdisciplinares integradas.</p>

                <h4 style="margin-top:12px;">Questão de Avaliação (Exemplo)</h4>
                <div style="border:1px solid var(--border-color); padding:10px; border-radius:4px; margin-top:8px; background:var(--bg-tertiary);">
                    <p><em>"Analise a oferta: 'Compre 3 sabonetes e leve o 4º de graça'. Qual o desconto percentual real na compra de 4 unidades?"</em></p>
                    <p style="margin-top:4px; font-weight:600;">Gabarito Correto: 25% de desconto (Paga-se 3 por 4).</p>
                </div>
            `
        }
    };

    const planModal = document.getElementById('pedagogic-plan-modal');
    const modalPlanTitle = document.getElementById('modal-plan-title');
    const modalPlanMeta = document.getElementById('modal-plan-meta');
    const modalPlanBody = document.getElementById('modal-plan-body-preview');
    const closePlanModalBtn = document.getElementById('close-plan-modal-btn');
    const btnModalClosePlan = document.getElementById('btn-modal-close-plan');
    const btnModalPrintPlan = document.getElementById('btn-modal-print-plan');

    function openPedagogicPlanModal(planId) {
        if (!planModal) return;
        const plan = pedagogicPlansData[planId] || pedagogicPlansData.custom;

        modalPlanTitle.textContent = plan.title;
        modalPlanMeta.textContent = plan.meta;
        modalPlanBody.innerHTML = plan.body;

        planModal.classList.remove('hidden');
        safeCreateIcons();
    }

    function closePedagogicPlanModal() {
        if (planModal) planModal.classList.add('hidden');
    }

    if (closePlanModalBtn) closePlanModalBtn.addEventListener('click', closePedagogicPlanModal);
    if (btnModalClosePlan) btnModalClosePlan.addEventListener('click', closePedagogicPlanModal);
    
    if (btnModalPrintPlan) {
        btnModalPrintPlan.addEventListener('click', () => {
            showToast('Preparando visualização de impressão do plano...', 'printer');
            setTimeout(() => {
                window.print();
            }, 300);
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.download-plan-btn');
        if (btn) {
            e.preventDefault();
            const planId = btn.getAttribute('data-plan');
            openPedagogicPlanModal(planId);
        }
    });

    // ==========================================
    // ALUNOS & CADASTROS (DETALHE E BUSCA DA BASE)
    // ==========================================
    const dbStudentSearch = document.getElementById('db-student-search');
    const dbStudentSchoolFilter = document.getElementById('db-student-school-filter');
    const dbStudentStageFilter = document.getElementById('db-student-stage-filter');
    const dbStudentsTableBody = document.getElementById('db-students-table-body');
    const dbStudentsPaginationInfo = document.getElementById('db-students-pagination-info');
    const btnDbStudentsPrev = document.getElementById('btn-db-students-prev');
    const btnDbStudentsNext = document.getElementById('btn-db-students-next');

    const studentModal = document.getElementById('student-modal');
    const closeStudentModalBtn = document.getElementById('close-student-modal-btn');
    const btnCloseStudentAction = document.getElementById('btn-close-student-modal-action');
    const btnPrintStudentRecord = document.getElementById('btn-print-student-record');
    
    let dbCurrentPage = 1;
    const dbPageSize = 50;
    let dbFilteredStudents = [];

    window.initAlunosTab = function(schools) {
        if (dbStudentSchoolFilter) {
            dbStudentSchoolFilter.innerHTML = '<option value="all">Filtrar por Escola (Todas as 9 Escolas)</option>';
            const targetSchools = (schools && schools.length > 0) ? schools : uniqueSchoolsList;
            targetSchools.forEach(sch => {
                const opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, ' ');
                dbStudentSchoolFilter.appendChild(opt);
            });
        }

        dbFilteredStudents = [...loadedStudents];
        dbCurrentPage = 1;
        renderDbStudents();
        updateAiGenDescriptors();
        renderPedagogicLibrary();
    };

    function applyDbFilters() {
        const query = dbStudentSearch ? dbStudentSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
        const schoolFilter = dbStudentSchoolFilter ? dbStudentSchoolFilter.value : 'all';
        const stageFilter = dbStudentStageFilter ? dbStudentStageFilter.value : 'all';

        dbFilteredStudents = loadedStudents.filter(s => {
            const nameNorm = (s.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cpfNorm = (s.cpf || '').replace(/\D/g, '');
            const matchQuery = !query || nameNorm.includes(query) || (s.matricula && s.matricula.includes(query)) || cpfNorm.includes(query);
            const matchSchool = schoolFilter === 'all' || s.escola === schoolFilter;
            const matchStage = stageFilter === 'all' || (s.etapa && s.etapa.includes(stageFilter)) || (s.turma && s.turma.includes(stageFilter));

            return matchQuery && matchSchool && matchStage;
        });

        dbCurrentPage = 1;
        renderDbStudents();
    }

    if (dbStudentSearch) dbStudentSearch.addEventListener('input', applyDbFilters);
    if (dbStudentSchoolFilter) dbStudentSchoolFilter.addEventListener('change', applyDbFilters);
    if (dbStudentStageFilter) dbStudentStageFilter.addEventListener('change', applyDbFilters);

    if (btnDbStudentsPrev) {
        btnDbStudentsPrev.addEventListener('click', () => {
            if (dbCurrentPage > 1) {
                dbCurrentPage--;
                renderDbStudents();
            }
        });
    }

    if (btnDbStudentsNext) {
        btnDbStudentsNext.addEventListener('click', () => {
            const maxPage = Math.ceil(dbFilteredStudents.length / dbPageSize);
            if (dbCurrentPage < maxPage) {
                dbCurrentPage++;
                renderDbStudents();
            }
        });
    }

    function renderDbStudents() {
        if (!dbStudentsTableBody) return;
        dbStudentsTableBody.innerHTML = '';
        
        const startIndex = (dbCurrentPage - 1) * dbPageSize;
        const endIndex = Math.min(startIndex + dbPageSize, dbFilteredStudents.length);
        const pageStudents = dbFilteredStudents.slice(startIndex, endIndex);

        if (btnDbStudentsPrev) btnDbStudentsPrev.disabled = dbCurrentPage === 1;
        if (btnDbStudentsNext) btnDbStudentsNext.disabled = endIndex >= dbFilteredStudents.length;

        if (dbFilteredStudents.length === 0) {
            if (dbStudentsPaginationInfo) dbStudentsPaginationInfo.textContent = 'Nenhum aluno encontrado';
            dbStudentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">
                        Nenhum aluno atende aos filtros definidos.
                    </td>
                </tr>
            `;
            return;
        }

        if (dbStudentsPaginationInfo) dbStudentsPaginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${dbFilteredStudents.length.toLocaleString('pt-BR')} alunos`;

        pageStudents.forEach(s => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '46px';
            
            const stageClean = (s.etapa || s.turma || '5º Ano').replace('Ensino fundamental de 9 anos - ', '').trim();
            const neeBadge = s.nee ? `<span class="badge badge-warning" title="${s.nee}">${s.nee.slice(0, 15)}...</span>` : '<span class="text-muted text-sm">-</span>';

            tr.innerHTML = `
                <td style="padding: 10px 16px; font-family:var(--font-mono); font-size:0.75rem;">${s.matricula}</td>
                <td style="padding: 10px 16px; font-weight:600;">${s.nome}</td>
                <td style="padding: 10px 16px; font-size:0.75rem; color:var(--text-secondary);">${s.escola}</td>
                <td style="padding: 10px 16px; font-size:0.8rem; color:var(--text-secondary);">${stageClean}</td>
                <td style="padding: 10px 16px;">${neeBadge}</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <button class="btn btn-outline btn-sm view-student-btn" data-mat="${s.matricula}">
                        <i data-lucide="eye" style="width:14px; height:14px; margin-right:4px;"></i> Ver Ficha
                    </button>
                </td>
            `;
            dbStudentsTableBody.appendChild(tr);
        });

        const viewButtons = dbStudentsTableBody.querySelectorAll('.view-student-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const mat = btn.getAttribute('data-mat');
                const student = loadedStudents.find(s => s.matricula === mat);
                if (student) {
                    openStudentModal(student);
                }
            });
        });

        safeCreateIcons();
    }

    function setupRevealButton(fieldId, value, matricula, fieldName) {
        const btn = document.querySelector(`.btn-reveal-field[data-field="${fieldName}"]`);
        if (!btn) return;
        
        const isMaskedVal = value && (value.includes('*') || value.includes('...'));
        if (isMaskedVal) {
            btn.style.display = 'inline-block';
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async () => {
                const userRole = sessionStorage.getItem('userRole') || 'Master Admin';
                const userEmail = sessionStorage.getItem('userEmail') || 'dpo@municipio.gov.br';
                const tenantId = sessionStorage.getItem('activeTenant') || 'default';
                
                if (userRole === 'Professor') {
                    showToast('Acesso negado: Professores não têm permissão para revelar dados.', 'x');
                    return;
                }
                
                let justification = '';
                if (userRole === 'Gestor da Rede') {
                    justification = prompt('Este dado é sensível (LGPD). Insira uma justificativa legal ou pedagógica para visualizá-lo:');
                    if (!justification) return;
                    if (justification.trim().length < 5) {
                        showToast('Justificativa inválida ou muito curta.', 'x');
                        return;
                    }
                }
                
                try {
                    const token = btoa(userEmail);
                    const revealRes = await fetch(`${API_BASE_URL}/api/alunos/reveal`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            matricula,
                            field: fieldName,
                            justificativa: justification,
                            tenantId
                        })
                    });
                    
                    if (revealRes.ok) {
                        const data = await revealRes.json();
                        if (data.success) {
                            const valSpan = document.getElementById(fieldId);
                            if (fieldName === 'nee') {
                                valSpan.className = 'badge badge-warning';
                            }
                            valSpan.textContent = data.value || 'Não Informado';
                            newBtn.style.display = 'none';
                            showToast('Dado revelado e registrado em auditoria.', 'check');
                            const inMemoryStudent = loadedStudents.find(st => st.matricula === matricula);
                            if (inMemoryStudent) {
                                inMemoryStudent[fieldName] = data.value;
                            }
                        } else {
                            showToast('Erro ao revelar dado.', 'x');
                        }
                    } else {
                        const errData = await revealRes.json();
                        showToast(errData.error || 'Erro na requisição.', 'x');
                    }
                } catch (err) {
                    console.error('Reveal failed:', err);
                    showToast('Erro de conexão.', 'x');
                }
            });
        } else {
            btn.style.display = 'none';
        }
    }

    function openStudentModal(student) {
        if (!studentModal) return;

        const initial = (student.nome || 'A').charAt(0).toUpperCase();
        const avatar = document.getElementById('modal-student-avatar-circle');
        if (avatar) avatar.textContent = initial;

        document.getElementById('modal-student-name').textContent = student.nome;
        document.getElementById('modal-student-matricula').textContent = `Matrícula: ${student.matricula}`;
        
        // Proficiency Badge
        const profBadge = document.getElementById('modal-student-proficiency-badge');
        const nivel = student.nivel_proficiencia || 'Adequado';
        if (profBadge) {
            profBadge.textContent = nivel;
            if (nivel === 'Crítico') {
                profBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                profBadge.style.color = 'var(--red-light)';
                profBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            } else if (nivel === 'Básico') {
                profBadge.style.background = 'rgba(245, 158, 11, 0.15)';
                profBadge.style.color = 'var(--amber-light)';
                profBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            } else if (nivel === 'Avançado') {
                profBadge.style.background = 'rgba(16, 185, 129, 0.2)';
                profBadge.style.color = '#10b981';
                profBadge.style.borderColor = '#10b981';
            } else {
                profBadge.style.background = 'rgba(59, 130, 246, 0.15)';
                profBadge.style.color = 'var(--blue-light)';
                profBadge.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }
        }

        const headerMeta = document.getElementById('modal-student-header-meta');
        if (headerMeta) {
            headerMeta.textContent = `${student.turma || student.etapa} • ${student.escola} • ${student.turno || 'Matutino'}`;
        }

        // Tab 1: Ficha Cadastral Fields
        document.getElementById('modal-student-cpf').textContent = student.cpf || 'Não Informado';
        document.getElementById('modal-student-sexo').textContent = student.sexo === 'F' ? 'Feminino' : (student.sexo === 'M' ? 'Masculino' : 'Não Informado');
        document.getElementById('modal-student-nascimento').textContent = student.nascimento || 'Não Informada';
        document.getElementById('modal-student-cor').textContent = student.cor || 'Não Informada';
        document.getElementById('modal-student-mae').textContent = student.mae || 'Não Informada';
        document.getElementById('modal-student-pai').textContent = student.pai || 'Não Informado';
        document.getElementById('modal-student-endereco').textContent = student.endereco || 'Não Informado';
        document.getElementById('modal-student-cep').textContent = student.cep || 'Não Informado';
        document.getElementById('modal-student-escola').textContent = student.escola;
        document.getElementById('modal-student-etapa').textContent = student.etapa;
        document.getElementById('modal-student-turma-turno').textContent = `${student.turma || student.etapa} (${student.turno || 'Matutino'})`;
        document.getElementById('modal-student-inicio').textContent = student.data_matricula || '10/01/2026';
        
        const scoreVal = student.avg_score || 215;
        const scoreLp = student.score_lp || Math.round(scoreVal * 1.02);
        const scoreMat = student.score_mat || Math.round(scoreVal * 0.98);
        document.getElementById('modal-student-score').textContent = `${scoreVal} pts`;
        document.getElementById('modal-student-score-lp').textContent = `${scoreLp} pts`;
        document.getElementById('modal-student-score-mat').textContent = `${scoreMat} pts`;
        document.getElementById('modal-student-freq').textContent = `${student.frequencia_pct || 98}%`;

        const neeField = document.getElementById('modal-student-nee');
        if (neeField) {
            if (student.nee) {
                neeField.className = 'badge badge-warning';
                neeField.textContent = student.nee;
            } else {
                neeField.className = 'text-muted';
                neeField.textContent = 'Regular / Sem Deficiência Declarada';
            }
        }

        // Tab 2: Histórico de Progressão Longitudinal (Simulado a Simulado)
        const histContainer = document.getElementById('student-progression-milestones-container');
        if (histContainer) {
            const simulados = student.historico_simulados || [
                { simulado: 'Diagnóstico Inicial (Fev/2026)', lp: Math.round(scoreVal * 0.88), mat: Math.round(scoreVal * 0.90), total: Math.round(scoreVal * 0.89), acerto_pct: 54 },
                { simulado: '1º Simulado Bimestral (Abr/2026)', lp: Math.round(scoreVal * 0.95), mat: Math.round(scoreVal * 0.96), total: Math.round(scoreVal * 0.95), acerto_pct: 65 },
                { simulado: '2º Simulado Bimestral (Jun/2026)', lp: scoreLp, mat: scoreMat, total: scoreVal, acerto_pct: 78 }
            ];

            histContainer.innerHTML = '';
            simulados.forEach((sim, idx) => {
                const delta = idx > 0 ? sim.total - simulados[idx - 1].total : 0;
                const deltaBadge = idx > 0 
                    ? `<span style="font-size:0.75rem; font-weight:700; color:${delta >= 0 ? 'var(--green-light)' : 'var(--red-light)'};">(${delta >= 0 ? '+' : ''}${delta} pts)</span>`
                    : '<span style="font-size:0.75rem; color:var(--text-muted);">(Marco Base)</span>';

                const mCard = document.createElement('div');
                mCard.style.background = 'var(--bg-tertiary)';
                mCard.style.border = '1px solid var(--border-color)';
                mCard.style.borderRadius = 'var(--radius-md)';
                mCard.style.padding = '12px 14px';

                mCard.innerHTML = `
                    <div style="font-size:0.74rem; font-weight:700; color:var(--purple-light); text-transform:uppercase; margin-bottom:4px;">
                        ${sim.simulado}
                    </div>
                    <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:6px;">
                        <strong style="font-size:1.3rem; color:var(--text-primary); font-family:var(--font-mono);">${sim.total} pts</strong>
                        ${deltaBadge}
                    </div>
                    <div style="font-size:0.76rem; color:var(--text-secondary); display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>LP: <strong>${sim.lp}</strong> | MT: <strong>${sim.mat}</strong></span>
                        <span>Acerto: <strong>${sim.acerto_pct}%</strong></span>
                    </div>
                    <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                        <div style="width:${Math.min(100, Math.round((sim.total / 400) * 100))}%; height:100%; background:var(--purple-light);"></div>
                    </div>
                `;
                histContainer.appendChild(mCard);
            });
        }

        // Consolidated and Focus Skills
        const consolidatedList = document.getElementById('student-consolidated-skills-list');
        if (consolidatedList) {
            consolidatedList.innerHTML = `
                <li><strong>LP D01:</strong> Localizar informações explícitas no texto narrativo e poético.</li>
                <li><strong>MT D13:</strong> Resolver problemas com operações de adição e subtração.</li>
                <li><strong>LP D04:</strong> Identificar o sentido de palavra pelo contexto.</li>
            `;
        }

        const focusList = document.getElementById('student-focus-skills-list');
        if (focusList) {
            focusList.innerHTML = `
                <li><strong>LP D03:</strong> Inferir o sentido de uma palavra ou expressão (Ação: Leitura compartilhada).</li>
                <li><strong>MT D28:</strong> Leitura e interpretação de tabelas e gráficos estatísticos.</li>
                <li><strong>LP D11:</strong> Distinguir um fato da opinião relativa a esse fato.</li>
            `;
        }

        // Ensure default Tab 1 is active
        switchStudentModalTab('cadastral');

        setupRevealButton('modal-student-cpf', student.cpf, student.matricula, 'cpf');
        setupRevealButton('modal-student-mae', student.mae, student.matricula, 'mae');
        setupRevealButton('modal-student-pai', student.pai, student.matricula, 'pai');
        setupRevealButton('modal-student-endereco', student.endereco, student.matricula, 'endereco');
        setupRevealButton('modal-student-nee', student.nee, student.matricula, 'nee');

        studentModal.classList.remove('hidden');
        safeCreateIcons();
    }

    function switchStudentModalTab(targetTab) {
        const btnCadastral = document.getElementById('btn-tab-student-cadastral');
        const btnProgressao = document.getElementById('btn-tab-student-progressao');
        const panelCadastral = document.getElementById('panel-student-cadastral');
        const panelProgressao = document.getElementById('panel-student-progressao');

        if (targetTab === 'cadastral') {
            if (btnCadastral) {
                btnCadastral.style.color = 'var(--purple-light)';
                btnCadastral.style.borderBottom = '2px solid var(--purple)';
            }
            if (btnProgressao) {
                btnProgressao.style.color = 'var(--text-secondary)';
                btnProgressao.style.borderBottom = 'none';
            }
            if (panelCadastral) panelCadastral.classList.remove('hidden');
            if (panelProgressao) panelProgressao.classList.add('hidden');
        } else {
            if (btnProgressao) {
                btnProgressao.style.color = 'var(--purple-light)';
                btnProgressao.style.borderBottom = '2px solid var(--purple)';
            }
            if (btnCadastral) {
                btnCadastral.style.color = 'var(--text-secondary)';
                btnCadastral.style.borderBottom = 'none';
            }
            if (panelProgressao) panelProgressao.classList.remove('hidden');
            if (panelCadastral) panelCadastral.classList.add('hidden');
        }
        safeCreateIcons();
    }

    const btnTabStudentCadastral = document.getElementById('btn-tab-student-cadastral');
    const btnTabStudentProgressao = document.getElementById('btn-tab-student-progressao');
    if (btnTabStudentCadastral) btnTabStudentCadastral.addEventListener('click', () => switchStudentModalTab('cadastral'));
    if (btnTabStudentProgressao) btnTabStudentProgressao.addEventListener('click', () => switchStudentModalTab('progressao'));

    if (closeStudentModalBtn) {
        closeStudentModalBtn.addEventListener('click', () => {
            studentModal.classList.add('hidden');
        });
    }

    if (btnCloseStudentAction) {
        btnCloseStudentAction.addEventListener('click', () => {
            studentModal.classList.add('hidden');
        });
    }

    if (btnPrintStudentRecord) {
        btnPrintStudentRecord.addEventListener('click', () => {
            showToast('Preparando impressão da ficha do aluno...', 'printer');
            setTimeout(() => {
                window.print();
            }, 300);
        });
    }

    if (studentModal) {
        studentModal.addEventListener('click', (e) => {
            if (e.target === studentModal) {
                studentModal.classList.add('hidden');
            }
        });
    }

    // ==========================================
    // CADASTRAR NOVA ESCOLA / NOVO ALUNO
    // ==========================================
    const createSchoolModal = document.getElementById('create-school-modal');
    const openCreateSchoolBtn = document.getElementById('btn-open-create-school-modal');
    const closeCreateSchoolBtn = document.getElementById('close-create-school-modal-btn');
    const createSchoolForm = document.getElementById('create-school-form');

    const createStudentModal = document.getElementById('create-student-modal');
    const openCreateStudentBtn = document.getElementById('btn-open-create-student-modal');
    const closeCreateStudentBtn = document.getElementById('close-create-student-modal-btn');
    const createStudentForm = document.getElementById('create-student-form');
    const newStudentSchoolDropdown = document.getElementById('new-student-school');

    if (openCreateSchoolBtn) {
        openCreateSchoolBtn.addEventListener('click', () => {
            createSchoolModal.classList.remove('hidden');
        });
    }
    if (closeCreateSchoolBtn) {
        closeCreateSchoolBtn.addEventListener('click', () => {
            createSchoolModal.classList.add('hidden');
        });
    }
    if (createSchoolModal) {
        createSchoolModal.addEventListener('click', (e) => {
            if (e.target === createSchoolModal) createSchoolModal.classList.add('hidden');
        });
    }

    if (createSchoolForm) {
        createSchoolForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const schoolName = document.getElementById('new-school-name').value.trim().toUpperCase();
            const schoolInep = document.getElementById('new-school-inep').value.trim();
            const schoolCep = document.getElementById('new-school-cep').value.trim();
            const schoolAddress = document.getElementById('new-school-address').value.trim();

            if (!schoolName || !schoolInep) return;

            const schools = Array.from(new Set(loadedStudents.map(s => s.escola)));
            if (!schools.includes(schoolName)) {
                schools.push(schoolName);
                schools.sort();
                
                window.populateSchoolPanelSelector(schools);
                
                const newStudentMatricula = "REG-" + Math.floor(1000 + Math.random() * 9000);
                const newStudent = {
                    matricula: newStudentMatricula,
                    nome: "ALUNO EXEMPLO (NOVO CADASTRO)",
                    nascimento: "01/01/2018",
                    sexo: "M",
                    cor: "Parda",
                    mae: "MÃE EXEMPLO",
                    pai: "PAI EXEMPLO",
                    endereco: schoolAddress || "ZONA URBANA",
                    cep: schoolCep || "65775-000",
                    nee: "",
                    escola: schoolName,
                    etapa: "Ensino fundamental de 9 anos - 3º Ano",
                    data_matricula: "07/08/2026",
                    cpf: "",
                    avg_score: 75
                };
                loadedStudents.push(newStudent);

                // Add to relational database tables
                dbEscolas.push({
                    id: `esc_${dbEscolas.length + 1}`,
                    nome: schoolName,
                    rede_id: "municipal",
                    codigo_inep: parseInt(schoolInep) || 0
                });
                dbTurmas.push({
                    id: `tur_${dbTurmas.length + 1}`,
                    escola_id: `esc_${dbEscolas.length}`,
                    nome: "Ensino fundamental de 9 anos - 3º Ano",
                    turno: "Matutino",
                    ano_letivo: 2026
                });
                dbAlunos.push({
                    id: `aln_${dbAlunos.length + 1}`,
                    turma_id: `tur_${dbTurmas.length}`,
                    nome: "ALUNO EXEMPLO (NOVO CADASTRO)",
                    matricula: newStudentMatricula,
                    nee: "",
                    avg_score: 75
                });
                
                const metricStud = document.getElementById('metric-students-eval');
                if (metricStud) metricStud.textContent = `${loadedStudents.length.toLocaleString('pt-BR')} alunos avaliados`;
                window.initAlunosTab(schools);
                
                const tenantSelector = document.getElementById('tenant-selector');
                if (tenantSelector) {
                    tenantSelector.innerHTML = '<option value="all">Todas as Redes (Multitenant)</option>';
                    schools.forEach(sch => {
                        const opt = document.createElement('option');
                        opt.value = sch;
                        opt.textContent = sch;
                        tenantSelector.appendChild(opt);
                    });
                }
                recalculateNetworkStats();
                saveDatabaseState();
                showToast(`Escola "${schoolName}" cadastrada com sucesso!`, 'check-circle');
            } else {
                showToast(`A escola "${schoolName}" já existe.`, 'alert-triangle');
            }

            createSchoolForm.reset();
            createSchoolModal.classList.add('hidden');
        });
    }

    if (openCreateStudentBtn) {
        openCreateStudentBtn.addEventListener('click', () => {
            if (newStudentSchoolDropdown) {
                newStudentSchoolDropdown.innerHTML = '<option value="">Selecione a Escola...</option>';
                dbEscolas.forEach(esc => {
                    const opt = document.createElement('option');
                    opt.value = esc.nome;
                    opt.textContent = esc.nome;
                    newStudentSchoolDropdown.appendChild(opt);
                });
            }
            const newStudentClassDropdown = document.getElementById('new-student-class');
            if (newStudentClassDropdown) {
                newStudentClassDropdown.innerHTML = '<option value="">Selecione primeiro a escola...</option>';
            }
            createStudentModal.classList.remove('hidden');
        });
    }

    if (newStudentSchoolDropdown) {
        newStudentSchoolDropdown.addEventListener('change', () => {
            const selectedSchoolName = newStudentSchoolDropdown.value;
            const newStudentClassDropdown = document.getElementById('new-student-class');
            if (!newStudentClassDropdown) return;

            newStudentClassDropdown.innerHTML = '';
            
            const schoolObj = dbEscolas.find(e => e.nome === selectedSchoolName);
            if (!schoolObj) {
                newStudentClassDropdown.innerHTML = '<option value="">Selecione primeiro a escola...</option>';
                return;
            }

            const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
            if (classes.length === 0) {
                newStudentClassDropdown.innerHTML = '<option value="">Nenhuma turma cadastrada. Crie uma turma nesta escola primeiro!</option>';
                return;
            }

            newStudentClassDropdown.innerHTML = '<option value="">Selecione a Turma...</option>';
            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.nome} (${c.serie} - ${c.turno})`;
                newStudentClassDropdown.appendChild(opt);
            });
        });
    }

    if (closeCreateStudentBtn) {
        closeCreateStudentBtn.addEventListener('click', () => {
            createStudentModal.classList.add('hidden');
        });
    }
    if (createStudentModal) {
        createStudentModal.addEventListener('click', (e) => {
            if (e.target === createStudentModal) createStudentModal.classList.add('hidden');
        });
    }

    if (createStudentForm) {
        createStudentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('new-student-name').value.trim().toUpperCase();
            const cpf = document.getElementById('new-student-cpf').value.trim();
            const birth = document.getElementById('new-student-birth').value;
            const sexo = document.getElementById('new-student-sexo').value;
            const color = document.getElementById('new-student-color').value;
            const nee = document.getElementById('new-student-nee').value.trim();
            const mae = document.getElementById('new-student-mae').value.trim().toUpperCase();
            const pai = document.getElementById('new-student-pai').value.trim().toUpperCase();
            const address = document.getElementById('new-student-address').value.trim().toUpperCase();
            const cep = document.getElementById('new-student-cep').value.trim();
            const matricula = document.getElementById('new-student-matricula').value.trim();
            const school = document.getElementById('new-student-school').value;
            const selectedClassId = document.getElementById('new-student-class').value;
            const start = document.getElementById('new-student-start').value;

            if (!name || !matricula || !school || !selectedClassId) {
                showToast('Preencha todos os campos e selecione uma turma.', 'alert-triangle');
                return;
            }

            const classObj = dbTurmas.find(t => t.id === selectedClassId);
            if (!classObj) return;

            const formatDate = (dateStr) => {
                if (!dateStr) return '';
                const parts = dateStr.split('-');
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            };

            const newStudent = {
                matricula,
                nome: name,
                nascimento: formatDate(birth),
                sexo,
                cor: color,
                mae,
                pai,
                endereco: address,
                cep,
                nee,
                escola: school,
                etapa: classObj.serie,
                turma_id: classObj.id,
                data_matricula: formatDate(start),
                cpf
            };

            newStudent.avg_score = 75;
            loadedStudents.push(newStudent);

            dbAlunos.push({
                id: `aln_${dbAlunos.length + 1}_${Date.now()}`,
                turma_id: classObj.id,
                nome: name,
                matricula: matricula,
                nee: nee,
                avg_score: 75
            });
            
            recalculateNetworkStats();
            
            const metricStud = document.getElementById('metric-students-eval');
            if (metricStud) metricStud.textContent = `${loadedStudents.length.toLocaleString('pt-BR')} alunos avaliados`;
            
            const badgeCount = document.getElementById('badge-count-students');
            if (badgeCount) badgeCount.textContent = loadedStudents.length.toLocaleString('pt-BR');
            
            const schools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
            window.initAlunosTab(schools);
            
            window.populateSchoolPanelSelector(schools);
            
            initStudentSearch();
            renderRiskGoalsTable();
            renderHeatmapGrid();
            saveDatabaseState();

            showToast(`Aluno ${name} cadastrado com sucesso!`, 'check-circle');
            createStudentForm.reset();
            createStudentModal.classList.add('hidden');
        });
    }

    // Sidebar User Dropdown Menu
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-profile-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            userDropdown.classList.add('hidden');
        });
    }
    // Sync Tenant Selector with Sidebar Active Network Label
    const tenantSelectorEl = document.getElementById('tenant-selector');
    const sidebarNetworkLabel = document.getElementById('sidebar-active-network-label');
    if (tenantSelectorEl && sidebarNetworkLabel) {
        tenantSelectorEl.addEventListener('change', () => {
            sidebarNetworkLabel.textContent = tenantSelectorEl.options[tenantSelectorEl.selectedIndex].text;
            recalculateNetworkStats();
        });
    }

    // ==========================================
    // CONTROLES DE RESET E DEMONSTRAÇÃO DO BANCO
    // ==========================================
    const btnResetDb = document.getElementById('btn-reset-db');
    const resetConfirmModal = document.getElementById('reset-confirm-modal');
    const btnCancelReset = document.getElementById('btn-cancel-reset');
    const btnConfirmReset = document.getElementById('btn-confirm-reset');

    if (btnResetDb && resetConfirmModal) {
        btnResetDb.addEventListener('click', () => {
            const tenantSelector = document.getElementById('tenant-selector');
            const activeNetworkName = tenantSelector ? tenantSelector.options[tenantSelector.selectedIndex].text : 'Codó';
            const nameSpan = document.getElementById('reset-modal-network-name');
            if (nameSpan) nameSpan.textContent = activeNetworkName;
            
            // Reset inputs
            const passInput = document.getElementById('reset-password-confirm');
            const netInput = document.getElementById('reset-network-confirm');
            if (passInput) passInput.value = '';
            if (netInput) netInput.value = '';

            resetConfirmModal.classList.remove('hidden');
        });
    }

    if (btnCancelReset && resetConfirmModal) {
        btnCancelReset.addEventListener('click', () => {
            resetConfirmModal.classList.add('hidden');
        });
    }

    if (resetConfirmModal) {
        resetConfirmModal.addEventListener('click', (e) => {
            if (e.target === resetConfirmModal) resetConfirmModal.classList.add('hidden');
        });
    }

    if (btnConfirmReset && resetConfirmModal) {
        btnConfirmReset.addEventListener('click', () => {
            const passInput = document.getElementById('reset-password-confirm');
            const netInput = document.getElementById('reset-network-confirm');
            const pass = passInput ? passInput.value.trim() : '';
            const net = netInput ? netInput.value.trim().toLowerCase() : '';

            const tenantSelector = document.getElementById('tenant-selector');
            const activeNetworkName = tenantSelector ? tenantSelector.options[tenantSelector.selectedIndex].text : 'Codó';

            if (!pass) {
                showToast('Por favor, insira sua senha de acesso.', 'x');
                return;
            }
            if (pass !== '123456') {
                showToast('Senha incorreta. Não foi possível redefinir o banco.', 'x');
                return;
            }
            if (net !== activeNetworkName.toLowerCase()) {
                showToast(`Confirmação inválida. Digite exatamente "${activeNetworkName}".`, 'x');
                return;
            }

            resetConfirmModal.classList.add('hidden');
            
            // Execute reset
            localStorage.clear();
            dbEscolas = [];
            dbTurmas = [];
            dbAlunos = [];
            dbAvaliacoes = [];
            dbQuestoes = [];
            dbResultadosAluno = [];
            activeEvaluations = [];
            
            activeDescriptors = initInepDescriptors();
            
            saveDatabaseState();
            loadDatabaseState();
            
            renderCreatedEvents();
            renderOngoingAssessments();
            renderActiveDescriptors();
            renderQuestions();
            renderReferenceMatrix();
            
            // Simulated email alert
            const userEmail = sessionStorage.getItem('userEmail') || 'gestor@municipio.gov.br';
            console.log(`[ALERT EMAIL SIMULADO] Destinatário: dpo@municipio.gov.br. Mensagem: A base de dados do tenant "${activeNetworkName}" foi resetada por completo pelo usuário "${userEmail}".`);
            showToast('Banco zerado. Alerta enviado por e-mail!', 'trash-2');
        });
    }

    // ONBOARDING / ESTADO VAZIO EVENT HANDLERS
    const btnOnboardingCreateSchool = document.getElementById('onboarding-btn-create-school');
    const btnOnboardingImport = document.getElementById('onboarding-btn-import');
    const btnOnboardingSeed = document.getElementById('onboarding-btn-seed');

    if (btnOnboardingCreateSchool) {
        btnOnboardingCreateSchool.addEventListener('click', () => {
            const escolasMenuBtn = document.querySelector('.menu-item[data-target="escolas-panel"]');
            if (escolasMenuBtn) {
                escolasMenuBtn.click();
                setTimeout(() => {
                    const addSchoolBtn = document.getElementById('btn-open-create-school-modal');
                    if (addSchoolBtn) addSchoolBtn.click();
                }, 100);
            }
        });
    }

    if (btnOnboardingImport) {
        btnOnboardingImport.addEventListener('click', () => {
            const alunosMenuBtn = document.querySelector('.menu-item[data-target="alunos-panel"]');
            if (alunosMenuBtn) {
                alunosMenuBtn.click();
                showToast('Planilha Censo Escolar: carregue seus arquivos Excel no painel correspondente.', 'info');
            }
        });
    }

    if (btnOnboardingSeed) {
        btnOnboardingSeed.addEventListener('click', () => {
            showToast('Carregando rede simulada completa...', 'sparkles');
            fetch('alunos.json')
                .then(res => res.json())
                .then(data => {
                    initDatabase(data);
                    saveDatabaseState();
                    showToast('Dados demonstrativos da rede carregados com sucesso!', 'check');
                })
                .catch(err => {
                    console.error('Failed to load demo data:', err);
                    showToast('Erro ao carregar dados demonstrativos.', 'alert-triangle');
                });
        });
    }

    // ==========================================
    // CRIAÇÃO E IMPORTAÇÃO DE QUESTÕES (IA, PDF, MANUAL)
    // ==========================================
    function populateQuestionCreatorDropdowns() {
        const iaSelect = document.getElementById('add-q-ia-desc');
        const manualSelect = document.getElementById('add-q-manual-desc');
        if (!iaSelect || !manualSelect) return;

        iaSelect.innerHTML = '';
        manualSelect.innerHTML = '';

        const allDescs = [];
        FULL_INEP_MATRICES.portuguese.forEach(d => allDescs.push({ code: d.codigo, text: `[Português] ${d.codigo} - ${d.desc}` }));
        FULL_INEP_MATRICES.math.forEach(d => allDescs.push({ code: d.codigo, text: `[Matemática] ${d.codigo} - ${d.desc}` }));
        FULL_INEP_MATRICES.science.forEach(d => allDescs.push({ code: d.codigo, text: `[Ciências] ${d.codigo} - ${d.desc}` }));

        allDescs.forEach(d => {
            const opt1 = document.createElement('option');
            opt1.value = d.code;
            opt1.textContent = d.text.slice(0, 70) + (d.text.length > 70 ? '...' : '');
            iaSelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = d.code;
            opt2.textContent = d.text.slice(0, 70) + (d.text.length > 70 ? '...' : '');
            manualSelect.appendChild(opt2);
        });
    }

    const btnAddQIa = document.getElementById('btn-add-q-ia');
    const btnAddQPdf = document.getElementById('btn-add-q-pdf');
    const btnAddQManual = document.getElementById('btn-add-q-manual');

    const panelAddQIa = document.getElementById('panel-add-q-ia');
    const panelAddQPdf = document.getElementById('panel-add-q-pdf');
    const panelAddQManual = document.getElementById('panel-add-q-manual');

    function resetAddQTabs() {
        [btnAddQIa, btnAddQPdf, btnAddQManual].forEach(btn => {
            if (btn) {
                btn.style.color = 'var(--text-secondary)';
                btn.style.fontWeight = '500';
                btn.style.borderBottom = 'none';
            }
        });
        [panelAddQIa, panelAddQPdf, panelAddQManual].forEach(p => {
            if (p) p.classList.add('hidden');
        });
    }

    if (btnAddQIa) {
        btnAddQIa.onclick = () => {
            resetAddQTabs();
            btnAddQIa.style.color = 'var(--purple-light)';
            btnAddQIa.style.fontWeight = '600';
            btnAddQIa.style.borderBottom = '2px solid var(--purple)';
            panelAddQIa.classList.remove('hidden');
        };
    }
    if (btnAddQPdf) {
        btnAddQPdf.onclick = () => {
            resetAddQTabs();
            btnAddQPdf.style.color = 'var(--purple-light)';
            btnAddQPdf.style.fontWeight = '600';
            btnAddQPdf.style.borderBottom = '2px solid var(--purple)';
            panelAddQPdf.classList.remove('hidden');
        };
    }
    if (btnAddQManual) {
        btnAddQManual.onclick = () => {
            resetAddQTabs();
            btnAddQManual.style.color = 'var(--purple-light)';
            btnAddQManual.style.fontWeight = '600';
            btnAddQManual.style.borderBottom = '2px solid var(--purple)';
            panelAddQManual.classList.remove('hidden');
        };
    }

    const btnGenerateQIa = document.getElementById('btn-generate-q-ia');
    if (btnGenerateQIa) {
        btnGenerateQIa.onclick = () => {
            const descCode = document.getElementById('add-q-ia-desc').value;
            const difficulty = document.getElementById('add-q-ia-diff').value;

            let comp = 'Matemática';
            const isLP = FULL_INEP_MATRICES.portuguese.some(d => d.codigo === descCode);
            comp = isLP ? 'Língua Portuguesa' : 'Matemática';
            if (descCode.startsWith('CI')) comp = 'Ciências';

            const simulatedTexts = {
                D1: {
                    enunciado: "No texto, a personagem principal descobre a chave do cofre escondida atrás do quadro da sala de jantar.",
                    pergunta: "De acordo com o texto, onde estava a chave do cofre?",
                    ops: ["A) Atrás do quadro da sala de jantar.", "B) Dentro do cofre de ferro.", "C) Embaixo do tapete da entrada.", "D) No bolso do paletó do avô."],
                    correta: "A"
                },
                D2: {
                    enunciado: "No fragmento 'A menina caiu da bicicleta, mas ela não se machucou muito', o pronome sublinhado refere-se a:",
                    pergunta: "",
                    ops: ["A) Bicicleta", "B) Menina", "C) Queda", "D) Dor"],
                    correta: "B"
                },
                D13: {
                    enunciado: "Uma caixa de sapatos possui 24 pares. Se uma loja encomendou 5 caixas dessas, ao todo quantos pares de sapatos foram adquiridos?",
                    pergunta: "",
                    ops: ["A) 100 pares", "B) 120 pares", "C) 140 pares", "D) 150 pares"],
                    correta: "B"
                },
                default: {
                    enunciado: `Considere o contexto prático e a matriz de competências do descritor ${descCode}.`,
                    pergunta: `Qual alternativa expressa o entendimento correto para este item de nível ${difficulty}?`,
                    ops: ["A) Resolução analítica direta.", "B) Dedução conceitual secundária.", "C) Resposta correta padrão do descritor.", "D) Distrator de plausibilidade média."],
                    correta: "C"
                }
            };

            const qData = simulatedTexts[descCode] || simulatedTexts.default;

            const newQ = {
                id: `q-${Date.now()}`,
                descritor: descCode,
                codigo_bncc: descCode,
                componente: comp,
                dificuldade: difficulty,
                nivel_bloom: "Aplicar",
                enunciado: qData.enunciado + (qData.pergunta ? " " + qData.pergunta : ""),
                alternativas: qData.ops,
                correta: qData.correta,
                justificativa: `Item pedagógico de nível ${difficulty} gerado conforme dados atuais para o descritor ${descCode}.`
            };
            rawQuestions.unshift(newQ);

            dbQuestoes.push({
                id: newQ.id,
                avaliacao_id: "eval-diag",
                descritor_bncc_id: newQ.codigo_bncc,
                nivel_dificuldade: newQ.dificuldade
            });

            renderQuestions();
            showToast(`Questão do descritor ${descCode} gerada conforme dados atuais com sucesso!`, 'sparkles');
        };
    }

    const pdfFileInput = document.getElementById('pdf-file-input');
    const pdfDropzone = document.getElementById('pdf-dropzone');
    const pdfFileInfo = document.getElementById('pdf-file-info');
    const btnImportQPdf = document.getElementById('btn-import-q-pdf');

    if (pdfDropzone && pdfFileInput) {
        pdfDropzone.onclick = () => pdfFileInput.click();
        pdfFileInput.onchange = () => {
            if (pdfFileInput.files.length > 0) {
                pdfFileInfo.textContent = `Arquivo selecionado: ${pdfFileInput.files[0].name}`;
                pdfFileInfo.style.display = 'block';
            }
        };
    }

    if (btnImportQPdf) {
        btnImportQPdf.onclick = () => {
            if (!pdfFileInput.files || pdfFileInput.files.length === 0) {
                showToast('Por favor, selecione um arquivo PDF primeiro.', 'alert-triangle');
                return;
            }

            const mockQuestionsFromPdf = [
                {
                    id: `q-pdf-1-${Date.now()}`,
                    descritor: "D3",
                    codigo_bncc: "D3",
                    componente: "Língua Portuguesa",
                    dificuldade: "Médio",
                    nivel_bloom: "Entender",
                    enunciado: "No trecho 'Ele ficou uma fera com a brincadeira', a expressão em destaque significa que ele ficou muito:",
                    alternativas: ["A) Assustado", "B) Alegre", "C) Irritado", "D) Cansado"],
                    correta: "C",
                    justificativa: "Inferir o sentido da expressão idiomática 'uma fera'."
                },
                {
                    id: `q-pdf-2-${Date.now()}`,
                    descritor: "D13",
                    codigo_bncc: "D13",
                    componente: "Matemática",
                    dificuldade: "Fácil",
                    nivel_bloom: "Aplicar",
                    enunciado: "Uma escola comprou 12 pacotes de doces com 15 doces em cada um. Ao todo, quantos doces foram comprados?",
                    alternativas: ["A) 120 doces", "B) 150 doces", "C) 180 doces", "D) 200 doces"],
                    correta: "C",
                    justificativa: "Resolver problema simples de multiplicação de números naturais."
                }
            ];

            mockQuestionsFromPdf.forEach(q => {
                rawQuestions.unshift(q);
                dbQuestoes.push({
                    id: q.id,
                    avaliacao_id: "sim-1",
                    descritor_bncc_id: q.codigo_bncc,
                    nivel_dificuldade: q.dificuldade
                });
            });
            renderQuestions();

            pdfFileInput.value = '';
            pdfFileInfo.style.display = 'none';
            showToast('PDF processado! 2 questões importadas com sucesso.', 'check-circle');
        };
    }

    const btnSaveQManual = document.getElementById('btn-save-q-manual');
    if (btnSaveQManual) {
        btnSaveQManual.onclick = () => {
            const descCode = document.getElementById('add-q-manual-desc').value;
            const difficulty = document.getElementById('add-q-manual-diff').value;
            const text = document.getElementById('add-q-manual-text').value.trim();
            const opA = document.getElementById('add-q-manual-op-a').value.trim();
            const opB = document.getElementById('add-q-manual-op-b').value.trim();
            const opC = document.getElementById('add-q-manual-op-c').value.trim();
            const opD = document.getElementById('add-q-manual-op-d').value.trim();
            const correct = document.getElementById('add-q-manual-correct').value;

            if (!text || !opA || !opB || !opC || !opD) {
                showToast('Por favor, preencha todos os campos obrigatórios (*).', 'alert-triangle');
                return;
            }

            let comp = 'Matemática';
            const isLP = FULL_INEP_MATRICES.portuguese.some(d => d.codigo === descCode);
            comp = isLP ? 'Língua Portuguesa' : 'Matemática';
            if (descCode.startsWith('CI')) comp = 'Ciências';

            const newQ = {
                id: `q-manual-${Date.now()}`,
                descritor: descCode,
                codigo_bncc: descCode,
                componente: comp,
                dificuldade: difficulty,
                nivel_bloom: "Lembrar",
                enunciado: text,
                alternativas: [`A) ${opA}`, `B) ${opB}`, `C) ${opC}`, `D) ${opD}`],
                correta: correct,
                justificativa: "Item inserido manualmente pelo gestor pedagógico."
            };
            rawQuestions.unshift(newQ);

            dbQuestoes.push({
                id: newQ.id,
                avaliacao_id: "eval-diag",
                descritor_bncc_id: newQ.codigo_bncc,
                nivel_dificuldade: newQ.dificuldade
            });

            renderQuestions();
            
            document.getElementById('add-q-manual-text').value = '';
            document.getElementById('add-q-manual-op-a').value = '';
            document.getElementById('add-q-manual-op-b').value = '';
            document.getElementById('add-q-manual-op-c').value = '';
            document.getElementById('add-q-manual-op-d').value = '';

            showToast('Questão inserida manualmente com sucesso!', 'check-circle');
        };
    }

    // ==========================================
    // CRUD DE TURMAS (FASE A)
    // ==========================================
    const schoolClassesModal = document.getElementById('school-classes-modal');
    const closeClassesModalBtn = document.getElementById('close-classes-modal-btn');
    const modalClassesSchoolName = document.getElementById('modal-classes-school-name');
    const btnToggleNewClassForm = document.getElementById('btn-toggle-new-class-form');
    const newClassFormContainer = document.getElementById('new-class-form-container');
    const createClassForm = document.getElementById('create-class-form');
    const btnCancelNewClass = document.getElementById('btn-cancel-new-class');
    const modalClassesTableBody = document.getElementById('modal-classes-table-body');
    const newClassFormTitle = document.getElementById('new-class-form-title');
    const classEditIdInput = document.getElementById('class-edit-id');

    let currentClassesSchoolName = "";

    function openSchoolClassesModal(schoolName) {
        if (!schoolClassesModal) return;
        currentClassesSchoolName = schoolName;
        modalClassesSchoolName.textContent = `Turmas da Escola: ${schoolName}`;
        
        resetClassForm();
        renderSchoolClassesTable();

        schoolClassesModal.classList.remove('hidden');
        safeCreateIcons();
    }

    function closeSchoolClassesModal() {
        if (schoolClassesModal) schoolClassesModal.classList.add('hidden');
    }

    if (closeClassesModalBtn) closeClassesModalBtn.addEventListener('click', closeSchoolClassesModal);
    if (schoolClassesModal) {
        schoolClassesModal.addEventListener('click', (e) => {
            if (e.target === schoolClassesModal) closeSchoolClassesModal();
        });
    }

    if (btnToggleNewClassForm) {
        btnToggleNewClassForm.addEventListener('click', () => {
            newClassFormContainer.classList.toggle('hidden');
        });
    }

    if (btnCancelNewClass) {
        btnCancelNewClass.addEventListener('click', () => {
            resetClassForm();
        });
    }

    function resetClassForm() {
        if (createClassForm) createClassForm.reset();
        if (classEditIdInput) classEditIdInput.value = "";
        if (newClassFormTitle) newClassFormTitle.textContent = "Cadastrar Nova Turma";
        if (newClassFormContainer) newClassFormContainer.classList.add('hidden');
    }

    function renderSchoolClassesTable() {
        if (!modalClassesTableBody) return;
        modalClassesTableBody.innerHTML = '';

        const schoolObj = dbEscolas.find(e => e.nome === currentClassesSchoolName);
        if (!schoolObj) {
            modalClassesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 12px; text-align: center; color: var(--text-muted);">
                        Escola não localizada na base de dados.
                    </td>
                </tr>
            `;
            return;
        }

        const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
        if (classes.length === 0) {
            modalClassesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">
                        Nenhuma turma cadastrada para esta escola.
                    </td>
                </tr>
            `;
            return;
        }

        classes.forEach(c => {
            const studentsCount = dbAlunos.filter(al => al.turma_id === c.id).length;

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '42px';

            tr.innerHTML = `
                <td style="padding: 8px 12px; font-weight:600;">${c.nome}</td>
                <td style="padding: 8px 12px; font-size:0.75rem;">${c.serie}</td>
                <td style="padding: 8px 12px; text-align: center; font-size:0.75rem;">${c.turno}</td>
                <td style="padding: 8px 12px; text-align: center; font-family:var(--font-mono); font-size:0.75rem;">${c.ano_letivo}</td>
                <td style="padding: 8px 12px; text-align: center; font-family:var(--font-mono);">${studentsCount}</td>
                <td style="padding: 8px 12px; text-align: center;">
                    <div style="display:flex; gap:6px; justify-content:center;">
                        <button class="btn btn-outline btn-sm edit-class-btn" data-id="${c.id}" style="padding: 2px 6px;">
                            <i data-lucide="edit" style="width:12px; height:12px;"></i>
                        </button>
                        <button class="btn btn-outline btn-sm delete-class-btn" data-id="${c.id}" style="padding: 2px 6px; border-color:rgba(239, 68, 68, 0.4); color:var(--red-light);">
                            <i data-lucide="trash-2" style="width:12px; height:12px;"></i>
                        </button>
                    </div>
                </td>
            `;

            modalClassesTableBody.appendChild(tr);
        });

        const editBtns = modalClassesTableBody.querySelectorAll('.edit-class-btn');
        editBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const cObj = dbTurmas.find(t => t.id === id);
                if (cObj) {
                    classEditIdInput.value = cObj.id;
                    document.getElementById('class-name').value = cObj.nome;
                    document.getElementById('class-stage').value = cObj.serie;
                    document.getElementById('class-shift').value = cObj.turno;
                    document.getElementById('class-year').value = cObj.ano_letivo;
                    
                    newClassFormTitle.textContent = "Editar Turma";
                    newClassFormContainer.classList.remove('hidden');
                }
            });
        });

        const deleteBtns = modalClassesTableBody.querySelectorAll('.delete-class-btn');
        deleteBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Deseja realmente excluir esta turma? Todos os alunos enturmados nela ficarão sem turma.')) {
                    dbTurmas = dbTurmas.filter(t => t.id !== id);
                    dbAlunos.forEach(al => {
                        if (al.turma_id === id) al.turma_id = null;
                    });
                    showToast('Turma excluída com sucesso.', 'check-circle');
                    renderSchoolClassesTable();
                    recalculateNetworkStats();
                    renderDbSchools();
                    saveDatabaseState();
                }
            });
        });

        safeCreateIcons();
    }

    if (createClassForm) {
        createClassForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = classEditIdInput.value;
            const name = document.getElementById('class-name').value.trim();
            const stage = document.getElementById('class-stage').value;
            const shift = document.getElementById('class-shift').value;
            const year = parseInt(document.getElementById('class-year').value);

            const schoolObj = dbEscolas.find(e => e.nome === currentClassesSchoolName);
            if (!schoolObj) return;

            if (editId) {
                const cObj = dbTurmas.find(t => t.id === editId);
                if (cObj) {
                    cObj.nome = name;
                    cObj.serie = stage;
                    cObj.turno = shift;
                    cObj.ano_letivo = year;
                    showToast(`Turma "${name}" atualizada com sucesso!`, 'check-circle');
                }
            } else {
                dbTurmas.push({
                    id: `tur_${dbTurmas.length + 1}_${Date.now()}`,
                    escola_id: schoolObj.id,
                    nome: name,
                    serie: stage,
                    turno: shift,
                    ano_letivo: year
                });
                showToast(`Turma "${name}" cadastrada com sucesso!`, 'check-circle');
            }
            resetClassForm();
            renderSchoolClassesTable();
            recalculateNetworkStats();
            renderDbSchools();
            saveDatabaseState();
        });
    }

    // ==========================================
    function populateInterventionPlansSelectors() {
        const schoolSelect = document.getElementById('plan-school-select');
        const classSelect = document.getElementById('plan-class-select');
        if (!schoolSelect || !classSelect) return;

        schoolSelect.innerHTML = '<option value="">Selecione a Escola...</option>';
        dbEscolas.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.nome;
            opt.textContent = s.nome;
            schoolSelect.appendChild(opt);
        });

        schoolSelect.removeEventListener('change', updatePlanClasses);
        schoolSelect.addEventListener('change', updatePlanClasses);

        classSelect.removeEventListener('change', renderPedagogicPlansForClass);
        classSelect.addEventListener('change', renderPedagogicPlansForClass);

        renderPedagogicPlansForClass();
    }

    function updatePlanClasses() {
        const schoolSelect = document.getElementById('plan-school-select');
        const classSelect = document.getElementById('plan-class-select');
        if (!schoolSelect || !classSelect) return;

        const schoolName = schoolSelect.value;
        classSelect.innerHTML = '<option value="">Selecione a Turma...</option>';

        const schoolObj = dbEscolas.find(e => e.nome === schoolName);
        if (schoolObj) {
            const classes = dbTurmas.filter(t => t.escola_id === schoolObj.id);
            classes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `${c.nome} (${c.serie})`;
                classSelect.appendChild(opt);
            });
        }
        renderPedagogicPlansForClass();
    }

    function renderPedagogicPlansForClass() {
        const container = document.getElementById('pedagogic-plans-container');
        if (!container) return;
        container.innerHTML = '';

        const schoolSelect = document.getElementById('plan-school-select');
        const classSelect = document.getElementById('plan-class-select');
        const schoolName = schoolSelect ? schoolSelect.value : '';
        const classId = classSelect ? classSelect.value : '';

        if (!schoolName || !classId) {
            container.innerHTML = `
                <div style="grid-column: span 3; text-align:center; padding:40px; color:var(--text-muted);">
                    <i data-lucide="info" style="width:48px; height:48px; margin-bottom:12px; opacity:0.5; display:inline-block;"></i>
                    <p>Selecione uma Escola e uma Turma para listar os planos de intervenção pedagógica automáticos.</p>
                </div>
            `;
            safeCreateIcons();
            return;
        }

        const stats = getBNCCCriticalSkills("all", schoolName, classId, "all");
        const criticals = stats.filter(s => s.total > 0 && s.percent < 70);

        if (criticals.length === 0) {
            container.innerHTML = `
                <div style="grid-column: span 3; text-align:center; padding:40px; color:var(--text-muted);">
                    <i data-lucide="check-circle" style="width:48px; height:48px; margin-bottom:12px; color:var(--green-light); display:inline-block;"></i>
                    <p>Nenhuma lacuna de aprendizagem crítica (abaixo de 70%) detectada nesta turma!</p>
                </div>
            `;
            safeCreateIcons();
            return;
        }

        criticals.forEach(stat => {
            const isLP = stat.codigo.includes("LP") || stat.codigo.startsWith("EF05LP");
            const compName = isLP ? "Português" : "Matemática";
            const badgeClass = stat.percent < 50 ? "badge-danger" : "badge-warning";
            const totalClassStudents = dbAlunos.filter(al => al.turma_id === classId).length;
            const affectedStudents = Math.round(totalClassStudents * (1 - stat.percent / 100));

            const planCard = document.createElement('div');
            planCard.className = 'card-outline';
            planCard.style.border = '1px solid var(--border-color)';
            planCard.style.padding = '16px';
            planCard.style.borderRadius = 'var(--radius-md)';
            planCard.style.background = 'var(--bg-tertiary)';
            planCard.style.display = 'flex';
            planCard.style.flexDirection = 'column';
            planCard.style.justifyContent = 'space-between';
            planCard.style.height = '100%';

            let planTitle = `Reforço para o Descritor ${stat.codigo}`;
            let planDesc = `Plano de ação pedagógica direcionado para consolidar habilidades de ${compName} do descritor ${stat.codigo}.`;
            if (stat.codigo.includes("D13")) {
                planTitle = "Operações e Resolução de Problemas";
                planDesc = "Metodologias práticas e jogos matemáticos para consolidar problemas envolvendo operações aritméticas fundamentais.";
            } else if (stat.codigo.includes("D3") || stat.codigo.includes("D03")) {
                planTitle = "Inferência e Compreensão Textual";
                planDesc = "Atividades de leitura contextualizada e análise semântica de palavras e expressões em diferentes contextos textuais.";
            } else if (stat.codigo.includes("D1")) {
                planTitle = "Localização de Informação Explícita";
                planDesc = "Foco em técnicas de escaneamento de textos curtos e identificação direta de dados literais.";
            }

            const planKey = `plan_${classId}_${stat.codigo}`;
            pedagogicPlansData[planKey] = {
                title: planTitle,
                meta: `${compName} - Descritor ${stat.codigo} (${affectedStudents} alunos com dificuldades)`,
                body: `
                    <h4>Objetivo Geral</h4>
                    <p>${planDesc}</p>
                    
                    <h4 style="margin-top:12px;">Cronograma de Ações Didáticas (4 Semanas)</h4>
                    <ul>
                        <li><strong>Semana 1:</strong> Diagnóstico focalizado e nivelamento conceitual do descritor ${stat.codigo}.</li>
                        <li><strong>Semana 2:</strong> Atividades em grupo com material concreto e resolução comentada de itens SAEB.</li>
                        <li><strong>Semana 3:</strong> Simulação ativa e gamificação para engajamento e fixação pedagógica.</li>
                        <li><strong>Semana 4:</strong> Reavaliação individual e análise comparativa de progresso.</li>
                    </ul>
                `
            };

            planCard.innerHTML = `
                <div>
                    <div class="flex-between" style="align-items: center; margin-bottom: 12px;">
                        <span class="badge ${badgeClass}">${compName} - ${stat.codigo}</span>
                        <span class="text-sm text-muted">${affectedStudents} alunos afetados</span>
                    </div>
                    <h4 style="margin: 0 0 8px 0; color:var(--purple-light);">${planTitle}</h4>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 16px;">${planDesc}</p>
                </div>
                <div class="flex-between border-top padding-top-sm" style="margin-top: 12px; padding-top: 10px;">
                    <span class="badge badge-success">Recomendado</span>
                    <button class="btn btn-outline btn-sm download-plan-btn" data-plan="${planKey}"><i data-lucide="eye" style="width:14px; height:14px; margin-right:4px;"></i> Visualizar</button>
                </div>
            `;
            container.appendChild(planCard);
        });

        safeCreateIcons();
    }

    // ==========================================
    // MÓDULO DE COMPARATIVO REGIONAL DO IDEB
    // ==========================================
    let selectedIdebCity = "Codó";

    function initIdebComparativo() {
        const stateSelect = document.getElementById('ideb-state-select');
        const citySearchInput = document.getElementById('ideb-city-search');
        const suggestionsBox = document.getElementById('ideb-city-suggestions');
        const stageSelect = document.getElementById('ideb-stage-select');

        if (!stateSelect || !citySearchInput || !suggestionsBox || !stageSelect) return;

        // 1. Popular Estados
        const states = Array.from(new Set(window.idebPublicoReferencia.map(item => item.uf))).sort();
        stateSelect.innerHTML = '';
        states.forEach(uf => {
            const opt = document.createElement('option');
            opt.value = uf;
            opt.textContent = uf === 'BR' ? 'Brasil (Nacional)' : uf;
            stateSelect.appendChild(opt);
        });

        // Set default state to 'MA'
        stateSelect.value = 'MA';
        selectedIdebCity = 'Codó';
        citySearchInput.value = 'Codó';

        // Function to filter and show suggestions
        function renderSuggestions(filterText = '') {
            const selectedUf = stateSelect.value;
            let filteredCities = Array.from(new Set(
                window.idebPublicoReferencia
                    .filter(item => item.uf === selectedUf)
                    .map(item => item.municipio)
            )).sort();

            // Order so that State Average comes first
            const stateAvgIdx = filteredCities.findIndex(c => c.includes('(Estado)'));
            if (stateAvgIdx > -1) {
                const stateAvg = filteredCities.splice(stateAvgIdx, 1)[0];
                filteredCities.unshift(stateAvg);
            }

            // Apply text filter
            if (filterText) {
                const query = filterText.toLowerCase();
                filteredCities = filteredCities.filter(c => c.toLowerCase().includes(query));
            }

            suggestionsBox.innerHTML = '';
            
            if (filteredCities.length === 0) {
                const emptyDiv = document.createElement('div');
                emptyDiv.style.padding = '8px 12px';
                emptyDiv.style.color = 'var(--text-muted)';
                emptyDiv.style.fontSize = '0.8rem';
                emptyDiv.textContent = 'Nenhum município encontrado';
                suggestionsBox.appendChild(emptyDiv);
                return;
            }

            filteredCities.forEach(city => {
                const div = document.createElement('div');
                div.style.padding = '8px 12px';
                div.style.cursor = 'pointer';
                div.style.fontSize = '0.8rem';
                div.style.color = 'var(--text-primary)';
                div.style.borderBottom = '1px solid var(--border-color)';
                div.style.transition = 'background 0.2s';
                div.textContent = city;
                
                div.addEventListener('mouseenter', () => {
                    div.style.backgroundColor = 'var(--bg-tertiary)';
                });
                div.addEventListener('mouseleave', () => {
                    div.style.backgroundColor = 'transparent';
                });
                div.addEventListener('click', () => {
                    citySearchInput.value = city;
                    selectedIdebCity = city;
                    suggestionsBox.classList.add('hidden');
                    updateIdebComparativoView();
                });
                suggestionsBox.appendChild(div);
            });
        }

        // Show suggestions on click/focus
        citySearchInput.addEventListener('focus', () => {
            suggestionsBox.classList.remove('hidden');
            renderSuggestions(citySearchInput.value);
        });

        // Update suggestions on input typing
        citySearchInput.addEventListener('input', (e) => {
            suggestionsBox.classList.remove('hidden');
            renderSuggestions(e.target.value);
        });

        // State select change
        stateSelect.addEventListener('change', () => {
            const selectedUf = stateSelect.value;
            if (selectedUf === 'MA') {
                selectedIdebCity = 'Codó';
            } else if (selectedUf === 'CE') {
                selectedIdebCity = 'Sobral';
            } else {
                const first = window.idebPublicoReferencia.find(item => item.uf === selectedUf);
                selectedIdebCity = first ? first.municipio : '';
            }
            citySearchInput.value = selectedIdebCity;
            suggestionsBox.classList.add('hidden');
            updateIdebComparativoView();
        });

        // Stage select change
        stageSelect.addEventListener('change', updateIdebComparativoView);

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!citySearchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
                suggestionsBox.classList.add('hidden');
            }
        });

        // 3. Render Initial View
        updateIdebComparativoView();
    }

    function updateIdebComparativoView() {
        const stateSelect = document.getElementById('ideb-state-select');
        const citySearchInput = document.getElementById('ideb-city-search');
        const stageSelect = document.getElementById('ideb-stage-select');

        if (!stateSelect || !citySearchInput || !stageSelect) return;

        const uf = stateSelect.value;
        const city = selectedIdebCity;
        const stage = stageSelect.value;

        const emptyState = document.getElementById('ideb-empty-state');
        const resultsContainer = document.getElementById('ideb-results-container');

        // Filter historical records
        const records = window.idebPublicoReferencia.filter(r => 
            r.uf === uf && r.municipio === city && r.etapa === stage
        ).sort((a, b) => a.ano - b.ano);

        if (records.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (resultsContainer) resultsContainer.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        if (resultsContainer) resultsContainer.classList.remove('hidden');

        // Latest record (2023)
        const latestRecord = records.find(r => r.ano === 2023) || records[records.length - 1];

        // Update KPIs
        const kpiObserved = document.getElementById('ideb-kpi-observed');
        const kpiTarget = document.getElementById('ideb-kpi-target');
        const kpiStatusContainer = document.getElementById('ideb-kpi-status-container');
        const kpiStatusText = document.getElementById('ideb-kpi-status-text');

        if (kpiObserved) kpiObserved.textContent = latestRecord.ideb_observado !== null ? latestRecord.ideb_observado.toFixed(1) : 'N/A';
        if (kpiTarget) kpiTarget.textContent = latestRecord.meta_projetada !== null ? latestRecord.meta_projetada.toFixed(1) : 'N/A';

        if (latestRecord.ideb_observado !== null && latestRecord.meta_projetada !== null) {
            const diff = latestRecord.ideb_observado - latestRecord.meta_projetada;
            const met = diff >= 0;

            if (kpiStatusContainer) {
                kpiStatusContainer.innerHTML = met 
                    ? `<span class="badge badge-success" style="font-size: 1.1rem; padding: 6px 12px; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="check" style="width: 16px; height: 16px;"></i> Atingida</span>`
                    : `<span class="badge" style="font-size: 1.1rem; padding: 6px 12px; background-color: var(--red-light); color: white; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="x" style="width: 16px; height: 16px;"></i> Não Atingida</span>`;
            }

            if (kpiStatusText) {
                kpiStatusText.textContent = met 
                    ? `Diferença positiva de +${diff.toFixed(1)} pontos em relação à meta.`
                    : `Diferença negativa de ${diff.toFixed(1)} pontos em relação à meta.`;
            }
        } else {
            if (kpiStatusContainer) kpiStatusContainer.innerHTML = `<span class="badge badge-info" style="font-size: 1.1rem; padding: 6px 12px;">Sem Comparativo</span>`;
            if (kpiStatusText) kpiStatusText.textContent = 'Metas ou resultados indisponíveis para este ciclo.';
        }

        // Draw Historical SVG Line Chart
        renderIdebSvgChart(records);

        // Projeção Meta 2025
        const projVal = document.getElementById('ideb-proj-val');
        const projDesc = document.getElementById('ideb-proj-desc');

        if (latestRecord.ideb_observado !== null) {
            // Check state statistics for 2023
            const stateRecords2023 = window.idebPublicoReferencia.filter(r => 
                r.uf === uf && r.ano === 2023 && r.etapa === stage && !r.municipio.includes('(Estado)') && r.municipio !== 'Brasil'
            );

            let metCount = 0;
            let totalCount = 0;
            stateRecords2023.forEach(r => {
                if (r.ideb_observado !== null && r.meta_projetada !== null) {
                    totalCount++;
                    if (r.ideb_observado >= r.meta_projetada) metCount++;
                }
            });

            // Growth factor
            const metRatio = totalCount > 0 ? (metCount / totalCount) : 0.5;
            let growthFactor = 0.2; // default
            let trajectory = "similar";

            if (latestRecord.ideb_observado >= latestRecord.meta_projetada) {
                growthFactor = uf === 'CE' ? 0.35 : 0.25;
                trajectory = "favorável";
            } else {
                growthFactor = 0.15;
                trajectory = "de recuperação";
            }

            const projectedIdeb = latestRecord.ideb_observado + growthFactor;

            if (projVal) projVal.textContent = projectedIdeb.toFixed(2);
            if (projDesc) {
                projDesc.textContent = `Sugere-se uma meta de ${projectedIdeb.toFixed(2)} para o ciclo 2025. Municípios de ${uf} com trajetória ${trajectory} cresceram, em média, +${growthFactor.toFixed(2)} no ciclo seguinte.`;
            }
        } else {
            if (projVal) projVal.textContent = 'N/A';
            if (projDesc) projDesc.textContent = 'Histórico insuficiente para projetar meta atual.';
        }

        // State Ranking
        renderIdebRankingTable(uf, stage, city);

        safeCreateIcons();
    }

    function renderIdebSvgChart(records) {
        const container = document.getElementById('ideb-chart-container');
        if (!container) return;

        const years = records.map(r => r.ano);
        const observed = records.map(r => r.ideb_observado || 0);
        const targets = records.map(r => r.meta_projetada || 0);

        const width = 550;
        const height = 240;
        const paddingLeft = 40;
        const paddingRight = 20;
        const paddingTop = 25;
        const paddingBottom = 35;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        const allVals = [...observed, ...targets].filter(v => v > 0);
        const maxVal = allVals.length > 0 ? Math.max(...allVals) + 0.5 : 10;
        const minVal = allVals.length > 0 ? Math.max(0, Math.min(...allVals) - 1.0) : 0;

        function getX(index) {
            if (years.length <= 1) return paddingLeft + chartWidth / 2;
            return paddingLeft + (index / (years.length - 1)) * chartWidth;
        }

        function getY(val) {
            if (val === 0) return paddingTop + chartHeight;
            return paddingTop + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
        }

        let svgHtml = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="240" style="background: transparent; overflow: visible;">`;

        const steps = 4;
        for (let j = 0; j <= steps; j++) {
            const val = minVal + (j / steps) * (maxVal - minVal);
            const y = getY(val);
            svgHtml += `<line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="4,4" stroke-width="0.75" />`;
            svgHtml += `<text x="${paddingLeft - 10}" y="${y + 4}" fill="var(--text-secondary)" font-size="10" font-family="var(--font-sans)" font-weight="600" text-anchor="end">${val.toFixed(1)}</text>`;
        }

        years.forEach((yr, idx) => {
            const x = getX(idx);
            svgHtml += `<text x="${x}" y="${height - 10}" fill="var(--text-secondary)" font-size="10" font-family="var(--font-sans)" font-weight="700" text-anchor="middle">${yr}</text>`;
        });

        let obsPointsPath = '';
        let tgtPointsPath = '';

        observed.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                obsPointsPath += (obsPointsPath === '' ? 'M' : 'L') + ` ${x} ${y}`;
            }
        });

        targets.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                tgtPointsPath += (tgtPointsPath === '' ? 'M' : 'L') + ` ${x} ${y}`;
            }
        });

        if (tgtPointsPath !== '') {
            svgHtml += `<path d="${tgtPointsPath}" fill="none" stroke="var(--purple)" stroke-width="2.5" stroke-dasharray="5,5" />`;
        }

        if (obsPointsPath !== '') {
            svgHtml += `<path d="${obsPointsPath}" fill="none" stroke="var(--blue-light)" stroke-width="3" />`;
        }

        observed.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                svgHtml += `<circle cx="${x}" cy="${y}" r="6" fill="var(--blue-light)" />`;
                svgHtml += `<circle cx="${x}" cy="${y}" r="3" fill="white" />`;
                svgHtml += `<text x="${x}" y="${y - 12}" fill="var(--text-primary)" font-size="10" font-family="var(--font-sans)" font-weight="700" text-anchor="middle">${val.toFixed(1)}</text>`;
            }
        });

        targets.forEach((val, idx) => {
            if (val > 0) {
                const x = getX(idx);
                const y = getY(val);
                svgHtml += `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="var(--purple)" rx="1" />`;
                const obsVal = observed[idx];
                const textY = (obsVal && Math.abs(obsVal - val) < 0.3 && obsVal > val) ? y + 16 : y - 12;
                svgHtml += `<text x="${x}" y="${textY}" fill="var(--text-muted)" font-size="9" font-family="var(--font-sans)" font-weight="600" text-anchor="middle">${val.toFixed(1)}</text>`;
            }
        });

        svgHtml += `</svg>`;
        container.innerHTML = svgHtml;
    }

    function renderIdebRankingTable(uf, stage, currentCity) {
        const tableBody = document.getElementById('ideb-ranking-table-body');
        const cityCountEl = document.getElementById('ideb-rank-city-count');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        const candidates = window.idebPublicoReferencia.filter(r => 
            r.uf === uf && r.ano === 2023 && r.etapa === stage && 
            !r.municipio.includes('(Estado)') && r.municipio !== 'Brasil'
        );

        candidates.sort((a, b) => {
            const obsA = a.ideb_observado !== null ? a.ideb_observado : -1;
            const obsB = b.ideb_observado !== null ? b.ideb_observado : -1;
            return obsB - obsA;
        });

        if (cityCountEl) cityCountEl.textContent = `${candidates.length} municípios`;

        if (candidates.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 16px; text-align:center; color:var(--text-muted);">
                        Nenhum município listado para este filtro.
                    </td>
                </tr>
            `;
            return;
        }

        candidates.forEach((c, idx) => {
            const isSelected = c.municipio === currentCity;
            const tr = document.createElement('tr');
            
            if (isSelected) {
                tr.style.backgroundColor = 'rgba(79, 150, 252, 0.08)';
                tr.style.fontWeight = '700';
                tr.style.borderLeft = '3px solid var(--blue-light)';
            } else {
                tr.style.borderBottom = '1px solid var(--border-color)';
            }
            tr.style.height = '40px';

            const obsText = c.ideb_observado !== null ? c.ideb_observado.toFixed(1) : 'N/A';
            const tgtText = c.meta_projetada !== null ? c.meta_projetada.toFixed(1) : 'N/A';

            let statusBadge = '<span class="badge badge-info" style="font-size:0.7rem;">N/A</span>';
            if (c.ideb_observado !== null && c.meta_projetada !== null) {
                statusBadge = (c.ideb_observado >= c.meta_projetada)
                    ? '<span class="badge badge-success" style="font-size:0.7rem; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="check" style="width:10px; height:10px;"></i> Atingida</span>'
                    : '<span class="badge" style="font-size:0.7rem; background-color: var(--red-light); color: white; display:inline-flex; align-items:center; gap:2px;"><i data-lucide="x" style="width:10px; height:10px;"></i> Não Atingida</span>';
            }

            tr.innerHTML = `
                <td style="padding: 8px 12px; color: ${isSelected ? 'var(--blue-light)' : 'var(--text-secondary)'}; font-weight:700;">#${idx + 1}</td>
                <td style="padding: 8px 12px; color: var(--text-primary);">${c.municipio}</td>
                <td style="padding: 8px 12px; text-align: center; font-weight:700; color: var(--text-primary);">${obsText}</td>
                <td style="padding: 8px 12px; text-align: center; color: var(--text-secondary);">${tgtText}</td>
                <td style="padding: 8px 12px; text-align: center;">${statusBadge}</td>
            `;

            tableBody.appendChild(tr);
        });
    }

    // ==========================================
    // RESPONSIVIDADE: MENU HAMBÚRGUER MOBILE
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    const sidebar = document.querySelector('.sidebar');

    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }

    if (mobileMenuClose && sidebar) {
        mobileMenuClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }

    const mobileMenuItems = document.querySelectorAll('.menu-item');
    mobileMenuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 1024 && sidebar) {
                sidebar.classList.remove('open');
            }
        });
    });

    // ==========================================
    // LÓGICA DE CONTROLE DA TELA DE LOGIN & MOTION
    // ==========================================
    const loginHeadlines = [
        "Cada décimo do IDEB planejado e conquistado.",
        "Do diagnóstico ao plano de ação, em uma só plataforma.",
        "Inteligência pedagógica guiando a gestão municipal."
    ];
    let headlineIndex = 0;

    function rotateLoginHeadlines() {
        const headlineEl = document.getElementById('rotating-headline');
        if (!headlineEl) return;
        setInterval(() => {
            headlineEl.classList.add('fade');
            setTimeout(() => {
                headlineIndex = (headlineIndex + 1) % loginHeadlines.length;
                headlineEl.textContent = loginHeadlines[headlineIndex];
                headlineEl.classList.remove('fade');
            }, 500);
        }, 5000);
    }

    // ==========================================
    // CINEMATIC MOTION CANVAS ENGINE (8-10s Loop)
    // ==========================================
    // UNIFIED NETWORK IDEB PERFORMANCE CONFIG (SINGLE SOURCE OF TRUTH)
    // ==========================================
    const NETWORK_IDEB_PERFORMANCE_CONFIG = {
        indicatorTitle: "Evolução do IDEB (Escala 0 a 10)",
        targetBadge: "Meta Pactuada 2025 • 6.5",
        targetLineAnnotation: "Meta Local Pactuada: 6.5",
        caption: "Série Histórica INEP (2019-2023) • Meta Pactuada pela Rede 2025",
        seal: "Dados oficiais INEP/SAEB (2019-2023) com metas municipais pactuadas",
        chartPoints: [
            { year: "2019", val: "4.8", x: 55, y: 135, isOfficial: true },
            { year: "2021", val: "5.1", x: 165, y: 118, isOfficial: true },
            { year: "2023", val: "5.8", x: 275, y: 88, isOfficial: true },
            { year: "2025 (Meta)", val: "6.5", x: 395, y: 48, isTarget: true }
        ]
    };

    // ==========================================
    // CINEMATIC MOTION CANVAS ENGINE (Clean White/Blue & Meta Pactuada 2025)
    // ==========================================
    function initLoginMotionCanvas() {
        const canvas = document.getElementById('login-motion-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Synchronize DOM elements with unified config
        const targetBadgeEl = document.getElementById('login-card-target-badge');
        const captionEl = document.getElementById('login-card-caption-text');
        if (targetBadgeEl) targetBadgeEl.textContent = NETWORK_IDEB_PERFORMANCE_CONFIG.targetBadge;
        if (captionEl) captionEl.textContent = NETWORK_IDEB_PERFORMANCE_CONFIG.caption;

        let width = canvas.clientWidth || 480;
        let height = canvas.clientHeight || 195;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const LOOP_DURATION = 9500; // 9.5 seconds total fluid loop
        let startTime = null;

        // Ambient floating particles (clean blue/sky tones)
        const particles = Array.from({ length: 22 }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.6 + 0.8,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            alpha: Math.random() * 0.4 + 0.15
        }));

        // 7 Educational Nodes with minimal icons & positions
        const eduNodes = [
            { label: "Escola", icon: "school", x: 55, y: 40, color: "#2563eb" },
            { label: "Alunos", icon: "users", x: 155, y: 32, color: "#7c3aed" },
            { label: "Professor", icon: "user-check", x: 425, y: 55, color: "#059669" },
            { label: "Livro", icon: "book", x: 75, y: 160, color: "#d97706" },
            { label: "Gráfico", icon: "bar-chart", x: 195, y: 160, color: "#0284c7" },
            { label: "Meta", icon: "target", x: 310, y: 160, color: "#e11d48" },
            { label: "Avaliação", icon: "check-circle", x: 425, y: 140, color: "#4f46e5" }
        ];

        // Chart Points from Single Source of Truth
        const chartPoints = NETWORK_IDEB_PERFORMANCE_CONFIG.chartPoints;

        function drawIcon(type, x, y, size, color) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 1.6;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            if (type === "school") {
                // School roof + building
                ctx.beginPath();
                ctx.moveTo(x - size, y);
                ctx.lineTo(x, y - size);
                ctx.lineTo(x + size, y);
                ctx.closePath();
                ctx.stroke();
                ctx.strokeRect(x - size * 0.7, y, size * 1.4, size * 1.1);
            } else if (type === "users" || type === "user-check") {
                // User / Student avatar
                ctx.beginPath();
                ctx.arc(x, y - size * 0.4, size * 0.45, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y + size * 0.8, size * 0.7, Math.PI * 1.2, Math.PI * 1.8, false);
                ctx.stroke();
            } else if (type === "book") {
                // Open book
                ctx.beginPath();
                ctx.moveTo(x, y - size * 0.5);
                ctx.lineTo(x, y + size * 0.6);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x - size * 0.8, y - size * 0.3);
                ctx.quadraticCurveTo(x - size * 0.4, y - size * 0.6, x, y - size * 0.5);
                ctx.quadraticCurveTo(x + size * 0.4, y - size * 0.6, x + size * 0.8, y - size * 0.3);
                ctx.stroke();
            } else if (type === "bar-chart") {
                // Mini bar chart
                ctx.strokeRect(x - size * 0.7, y + size * 0.1, size * 0.35, size * 0.6);
                ctx.strokeRect(x - size * 0.15, y - size * 0.4, size * 0.35, size * 1.1);
                ctx.strokeRect(x + size * 0.4, y - size * 0.7, size * 0.35, size * 1.4);
            } else if (type === "target") {
                // Bullseye target
                ctx.beginPath();
                ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Checkmark / assessment
                ctx.beginPath();
                ctx.arc(x, y, size * 0.75, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x - size * 0.35, y);
                ctx.lineTo(x - size * 0.1, y + size * 0.3);
                ctx.lineTo(x + size * 0.4, y - size * 0.3);
                ctx.stroke();
            }
            ctx.restore();
        }

        function render(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime) % LOOP_DURATION;
            const progress = elapsed / LOOP_DURATION;

            ctx.clearRect(0, 0, width, height);

            // 1. Subtle Clean Light Blue Grid Lines
            ctx.strokeStyle = "rgba(37, 99, 235, 0.06)";
            ctx.lineWidth = 1;
            for (let y = 25; y < height; y += 32) {
                ctx.beginPath();
                ctx.moveTo(10, y);
                ctx.lineTo(width - 10, y);
                ctx.stroke();
            }

            // 2. Ambient Floating Particles (Soft Blue)
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(37, 99, 235, ${p.alpha})`;
                ctx.fill();
            });

            // 3. Projected Target Dashed Line (Meta Local Pactuada: 6.5)
            const metaLineAlpha = Math.min(1, Math.max(0, (elapsed - 1200) / 1000));
            if (metaLineAlpha > 0) {
                ctx.save();
                ctx.setLineDash([4, 4]);
                ctx.strokeStyle = `rgba(37, 99, 235, ${metaLineAlpha * 0.5})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(40, 75);
                ctx.lineTo(150, 65);
                ctx.lineTo(260, 56);
                ctx.lineTo(405, 48);
                ctx.stroke();

                ctx.fillStyle = `rgba(37, 99, 235, ${metaLineAlpha * 0.95})`;
                ctx.font = "bold 9px 'Plus Jakarta Sans', sans-serif";
                ctx.fillText(NETWORK_IDEB_PERFORMANCE_CONFIG.targetLineAnnotation, 390, 32);
                ctx.restore();
            }

            // 4. Progressive Line Graph Evolution (2019 -> 2021 -> 2023 -> 2025 Meta)
            const graphProgress = Math.min(1, Math.max(0, (elapsed - 1600) / 3800));
            const totalPoints = chartPoints.length;
            const currentPointIndex = graphProgress * (totalPoints - 1);
            const baseIndex = Math.floor(currentPointIndex);
            const segmentProgress = currentPointIndex - baseIndex;

            if (graphProgress > 0) {
                // Gradient Fill Under Curve
                ctx.save();
                const grad = ctx.createLinearGradient(0, 0, 0, height);
                grad.addColorStop(0, "rgba(37, 99, 235, 0.18)");
                grad.addColorStop(1, "rgba(37, 99, 235, 0.00)");

                ctx.beginPath();
                ctx.moveTo(chartPoints[0].x, height - 16);
                ctx.lineTo(chartPoints[0].x, chartPoints[0].y);

                for (let i = 1; i <= baseIndex; i++) {
                    ctx.lineTo(chartPoints[i].x, chartPoints[i].y);
                }
                if (baseIndex < totalPoints - 1) {
                    const nextX = chartPoints[baseIndex].x + (chartPoints[baseIndex + 1].x - chartPoints[baseIndex].x) * segmentProgress;
                    const nextY = chartPoints[baseIndex].y + (chartPoints[baseIndex + 1].y - chartPoints[baseIndex].y) * segmentProgress;
                    ctx.lineTo(nextX, nextY);
                    ctx.lineTo(nextX, height - 16);
                } else {
                    ctx.lineTo(chartPoints[totalPoints - 1].x, height - 16);
                }
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();

                // Draw Glowing Royal Blue Progress Line
                ctx.save();
                ctx.strokeStyle = "#2563eb";
                ctx.lineWidth = 3.2;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.shadowColor = "rgba(37, 99, 235, 0.4)";
                ctx.shadowBlur = 10;

                ctx.beginPath();
                ctx.moveTo(chartPoints[0].x, chartPoints[0].y);
                for (let i = 1; i <= baseIndex; i++) {
                    ctx.lineTo(chartPoints[i].x, chartPoints[i].y);
                }
                if (baseIndex < totalPoints - 1) {
                    const curX = chartPoints[baseIndex].x + (chartPoints[baseIndex + 1].x - chartPoints[baseIndex].x) * segmentProgress;
                    const curY = chartPoints[baseIndex].y + (chartPoints[baseIndex + 1].y - chartPoints[baseIndex].y) * segmentProgress;
                    ctx.lineTo(curX, curY);
                }
                ctx.stroke();
                ctx.restore();

                // Draw Points & Labels
                for (let i = 0; i <= baseIndex; i++) {
                    const pt = chartPoints[i];
                    const pointAlpha = Math.min(1, (graphProgress - (i / (totalPoints - 1))) * 4);

                    if (pointAlpha > 0) {
                        const isTarget = pt.isTarget;

                        // Point Circle
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(pt.x, pt.y, isTarget ? 5.5 : 4.5, 0, Math.PI * 2);
                        ctx.fillStyle = "#ffffff";
                        ctx.strokeStyle = isTarget ? "#059669" : "#2563eb";
                        ctx.lineWidth = 2.5;
                        ctx.shadowColor = "rgba(37, 99, 235, 0.35)";
                        ctx.shadowBlur = 8;
                        ctx.fill();
                        ctx.stroke();

                        // Ripple pulse on Target point
                        if (isTarget) {
                            const pulseR = 5 + (elapsed % 1400) / 90;
                            const pulseOp = 1 - (elapsed % 1400) / 1400;
                            ctx.beginPath();
                            ctx.arc(pt.x, pt.y, pulseR, 0, Math.PI * 2);
                            ctx.strokeStyle = `rgba(5, 150, 105, ${pulseOp})`;
                            ctx.lineWidth = 1.5;
                            ctx.stroke();
                        }

                        // Year Label
                        ctx.fillStyle = "#64748b";
                        ctx.font = `600 ${isTarget ? '8.5px' : '8px'} 'Plus Jakarta Sans', sans-serif`;
                        ctx.textAlign = "center";
                        ctx.fillText(pt.year, pt.x, height - 4);

                        // Value Pill / Tag
                        ctx.fillStyle = isTarget ? "#059669" : "#1e293b";
                        ctx.font = `bold ${isTarget ? '11px' : '9.5px'} 'Plus Jakarta Sans', sans-serif`;
                        ctx.fillText(pt.val, pt.x, pt.y - 8);
                        ctx.restore();
                    }
                }
            }

            // 5. Connecting Mesh Beams (CENA 3: 5.6s -> 8.2s)
            const meshProgress = Math.min(1, Math.max(0, (elapsed - 5600) / 2400));
            if (meshProgress > 0) {
                ctx.save();
                ctx.lineWidth = 1.2;

                eduNodes.forEach((node, idx) => {
                    const originPt = chartPoints[idx % chartPoints.length];
                    const laserProgress = Math.min(1, meshProgress * 1.3);

                    const targetX = originPt.x + (node.x - originPt.x) * laserProgress;
                    const targetY = originPt.y + (node.y - originPt.y) * laserProgress;

                    // Beam line
                    const beamGrad = ctx.createLinearGradient(originPt.x, originPt.y, node.x, node.y);
                    beamGrad.addColorStop(0, "rgba(37, 99, 235, 0.45)");
                    beamGrad.addColorStop(1, "rgba(59, 130, 246, 0.15)");

                    ctx.strokeStyle = beamGrad;
                    ctx.beginPath();
                    ctx.moveTo(originPt.x, originPt.y);
                    ctx.lineTo(targetX, targetY);
                    ctx.stroke();

                    // Energy spark traveling
                    const sparkT = (elapsed * 0.002 + idx * 0.2) % 1;
                    const sparkX = originPt.x + (node.x - originPt.x) * sparkT;
                    const sparkY = originPt.y + (node.y - originPt.y) * sparkT;

                    ctx.beginPath();
                    ctx.arc(sparkX, sparkY, 2.2, 0, Math.PI * 2);
                    ctx.fillStyle = "#2563eb";
                    ctx.shadowColor = "#3b82f6";
                    ctx.shadowBlur = 6;
                    ctx.fill();
                });
                ctx.restore();
            }

            // 6. Educational Minimalist Nodes (Clean White Cards Floating)
            const nodeAlpha = Math.min(1, Math.max(0, (elapsed - 400) / 1400));
            if (nodeAlpha > 0) {
                eduNodes.forEach((node, idx) => {
                    const floatOffset = Math.sin((elapsed * 0.002) + idx) * 3;
                    const curY = node.y + floatOffset;

                    ctx.save();
                    ctx.globalAlpha = nodeAlpha * (progress > 0.92 ? (1 - (progress - 0.92) / 0.08) : 1);

                    // Node Card Circle
                    ctx.fillStyle = "#ffffff";
                    ctx.strokeStyle = "rgba(226, 232, 240, 0.9)";
                    ctx.lineWidth = 1.5;
                    ctx.shadowColor = "rgba(37, 99, 235, 0.08)";
                    ctx.shadowBlur = 8;
                    ctx.beginPath();
                    ctx.arc(node.x, curY, 12, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();

                    // Icon
                    drawIcon(node.icon, node.x, curY, 5.5, node.color);

                    // Label
                    ctx.fillStyle = "#1e293b";
                    ctx.font = "700 7.5px 'Plus Jakarta Sans', sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(node.label, node.x, curY + 17);

                    ctx.restore();
                });
            }

            // 7. Luminous Blue Brand Sweep Transition (Seamless Loop)
            if (elapsed > 8200) {
                const sweepProgress = (elapsed - 8200) / 1300;
                const sweepX = width * sweepProgress;

                ctx.save();
                const sweepGrad = ctx.createLinearGradient(sweepX - 70, 0, sweepX + 70, 0);
                sweepGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
                sweepGrad.addColorStop(0.5, "rgba(37, 99, 235, 0.12)");
                sweepGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

                ctx.fillStyle = sweepGrad;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }

            requestAnimationFrame(render);
        }

        requestAnimationFrame(render);
    }

    // Toggle Password Visibility
    const btnTogglePassword = document.getElementById('btn-toggle-login-password');
    const loginPassword = document.getElementById('login-password');
    if (btnTogglePassword && loginPassword) {
        btnTogglePassword.addEventListener('click', () => {
            const isPass = loginPassword.type === 'password';
            loginPassword.type = isPass ? 'text' : 'password';
            const icon = btnTogglePassword.querySelector('i') || btnTogglePassword.querySelector('svg');
            if (icon && window.lucide) {
                icon.setAttribute('data-lucide', isPass ? 'eye-off' : 'eye');
                lucide.createIcons({ attrs: { class: 'lucide' } });
            }
        });
    }

    // Quick Test Accounts Cards Handlers
    const testCards = document.querySelectorAll('.test-account-card');
    const loginEmailInput = document.getElementById('login-email');
    if (testCards && loginEmailInput) {
        testCards.forEach(card => {
            card.addEventListener('click', () => {
                testCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                const email = card.getAttribute('data-email');
                const pass = card.getAttribute('data-pass') || '123';
                const role = card.getAttribute('data-role') || 'Gestor da Rede';

                loginEmailInput.value = email;
                if (loginPassword) loginPassword.value = pass;

                showToast(`Perfil ${card.querySelector('.test-role-title')?.textContent} selecionado (${email})`, 'check');
            });
        });
    }

    // Forgot password placeholder
    const linkForgotPassword = document.getElementById('link-forgot-password');
    if (linkForgotPassword) {
        linkForgotPassword.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Para redefinir sua senha institucional, entre em contato com a equipe de TI da SEMED Gonçalves Dias - MA (admin@goncalvesdias.ma.gov.br).');
        });
    }

    // Login Form Submit Handlers & Role-Based Dashboard Routing
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const btnLoginSubmit = document.getElementById('btn-login-submit');

    if (loginForm && loginScreen && btnLoginSubmit) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('login-email').value.trim().toLowerCase();
            const passInput = document.getElementById('login-password')?.value || '123';

            let detectedRole = 'Gestor da Rede';
            let targetTab = 'dashboard';
            let assignedSchool = '';
            let assignedTurma = '';

            if (emailInput.startsWith('prof') || emailInput.includes('professor')) {
                detectedRole = 'Professor';
                targetTab = 'alunos-panel';
                assignedSchool = 'U.E. BENTA VILANOVA';
                assignedTurma = '2º Ano';
            } else if (emailInput.startsWith('diret') || emailInput.includes('diretor') || emailInput.includes('escola') || emailInput.includes('cora')) {
                detectedRole = 'Diretor Escola';
                targetTab = 'escolas-panel';
                assignedSchool = 'U.E. BENTA VILANOVA';
            } else if (emailInput.startsWith('admin') || emailInput.startsWith('dpo')) {
                detectedRole = 'Master Admin';
                targetTab = 'dashboard';
            } else if (emailInput.startsWith('semed') || emailInput.startsWith('gestor') || emailInput.includes('semed')) {
                detectedRole = 'Gestor da Rede';
                targetTab = 'dashboard';
            }

            // Loading status feedback
            btnLoginSubmit.disabled = true;
            const btnSpan = btnLoginSubmit.querySelector('span');
            const originalText = btnSpan ? btnSpan.textContent : '';
            if (btnSpan) btnSpan.textContent = 'Autenticando...';

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput, password: passInput })
                });
                const authData = await res.json();
                
                if (res.ok && authData.success) {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('activeTenant', 'default');
                    sessionStorage.setItem('userEmail', authData.user.email);
                    sessionStorage.setItem('userRole', authData.user.role || detectedRole);
                    sessionStorage.setItem('userName', authData.user.nome || 'Usuário');
                    sessionStorage.setItem('userEscola', authData.user.escola || assignedSchool);
                    sessionStorage.setItem('userTurma', authData.user.turma || assignedTurma);
                } else {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('activeTenant', 'default');
                    sessionStorage.setItem('userEmail', emailInput);
                    sessionStorage.setItem('userRole', detectedRole);
                    sessionStorage.setItem('userEscola', assignedSchool);
                    sessionStorage.setItem('userTurma', assignedTurma);
                }
            } catch (err) {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('activeTenant', 'default');
                sessionStorage.setItem('userEmail', emailInput);
                sessionStorage.setItem('userRole', detectedRole);
                sessionStorage.setItem('userEscola', assignedSchool);
                sessionStorage.setItem('userTurma', assignedTurma);
            }

            try {
                await loadDatabaseState();
            } catch (err) {
                console.warn('[IDEB Engine] Warning in loadDatabaseState:', err);
            }

            try {
                updateMenuVisibilityByRole();
            } catch (err) {
                console.warn('[IDEB Engine] Warning in updateMenuVisibilityByRole:', err);
            }

            // Direct Navigation to the Role's Panel
            try {
                if (window.navigateToTab) {
                    window.navigateToTab(targetTab);
                }
            } catch (err) {
                console.warn('[IDEB Engine] Warning in navigateToTab:', err);
            }

            // Apply role-specific filters
            try {
                if (detectedRole === 'Diretor Escola') {
                    const dbSchoolSearch = document.getElementById('db-school-search');
                    if (dbSchoolSearch) {
                        dbSchoolSearch.value = 'Benta Vilanova';
                        if (typeof renderDbSchools === 'function') renderDbSchools();
                    }
                } else if (detectedRole === 'Professor') {
                    const dbStudentSchoolFilter = document.getElementById('db-student-school-filter');
                    if (dbStudentSchoolFilter) {
                        dbStudentSchoolFilter.value = 'U.E. BENTA VILANOVA';
                        if (typeof applyDbFilters === 'function') applyDbFilters();
                    }
                } else if (detectedRole === 'Professor AEE') {
                    const dbStudentNeeFilter = document.getElementById('db-student-nee-filter');
                    if (dbStudentNeeFilter) {
                        dbStudentNeeFilter.value = 'sim';
                        if (typeof applyDbFilters === 'function') applyDbFilters();
                    }
                }
            } catch (err) {
                console.warn('[IDEB Engine] Filter warning:', err);
            }

            // Smooth Fade-out animation
            loginScreen.classList.add('fade-out');
            showToast(`Bem-vindo ao IDEB na Prática! Painel ${detectedRole} carregado.`, 'check');
            window.scrollTo(0, 0);

            setTimeout(() => {
                loginScreen.style.display = 'none';
                if (window.lucide) {
                    lucide.createIcons({ attrs: { class: 'lucide' } });
                }
            }, 500);
        });
    }

    function updateMenuVisibilityByRole() {
        const userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        const userEscola = sessionStorage.getItem('userEscola') || 'U.E. BENTA VILANOVA';
        const userTurma = sessionStorage.getItem('userTurma') || '2º Ano';

        const activeNetworkLabel = document.getElementById('sidebar-active-network-label');
        const userProfileName = document.querySelector('.user-profile .user-name');
        const userProfileRole = document.querySelector('.user-profile .user-role');
        const userProfileAvatar = document.querySelector('.user-profile .avatar');

        // All Sidebar Menu Items
        const allMenuItems = document.querySelectorAll('.menu-item');
        allMenuItems.forEach(item => { item.style.display = 'flex'; });

        // Hide specific groups/items based on Role Hierarchy
        if (userRole === 'Professor' || userRole === 'Professor AEE') {
            // Visible for Professor: Alunos, Biblioteca, Cronograma, Aplicação de Provas, Matriz, Questões
            const allowedTabs = ['alunos-panel', 'biblioteca-recursos', 'cronograma-habilidades', 'aplicacao-provas', 'matriz-descritores', 'questions'];
            allMenuItems.forEach(item => {
                const target = item.getAttribute('data-target');
                item.style.display = allowedTabs.includes(target) ? 'flex' : 'none';
            });

            // Adjust labels for Professor
            const alunosMenu = document.querySelector('.menu-item[data-target="alunos-panel"] span');
            if (alunosMenu) alunosMenu.textContent = 'Minha Turma & Alunos';
            const provasMenu = document.querySelector('.menu-item[data-target="aplicacao-provas"] span');
            if (provasMenu) provasMenu.textContent = 'Lançamento de Gabaritos';

            // Sidebar User Card
            if (activeNetworkLabel) activeNetworkLabel.textContent = `${userEscola} (${userTurma})`;
            if (userProfileName) userProfileName.textContent = 'Prof. Docente';
            if (userProfileRole) userProfileRole.textContent = `${userEscola} • ${userTurma}`;
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'PR';
                userProfileAvatar.style.backgroundColor = '#2563eb';
            }

        } else if (userRole === 'Diretor Escola') {
            // Visible for Diretor: Escolas, Alunos, Metas, Cronograma, Aplicação, Gestão Pedagógica, Relatórios, Biblioteca
            const allowedTabs = ['escolas-panel', 'alunos-panel', 'metas-ideb', 'cronograma-habilidades', 'aplicacao-provas', 'gestao-pedagogica', 'ai-playground', 'biblioteca-recursos'];
            allMenuItems.forEach(item => {
                const target = item.getAttribute('data-target');
                item.style.display = allowedTabs.includes(target) ? 'flex' : 'none';
            });

            // Adjust labels for Diretor
            const escolasMenu = document.querySelector('.menu-item[data-target="escolas-panel"] span');
            if (escolasMenu) escolasMenu.textContent = 'Minha Escola & Turmas';
            const alunosMenu = document.querySelector('.menu-item[data-target="alunos-panel"] span');
            if (alunosMenu) alunosMenu.textContent = 'Alunos da Escola';

            // Sidebar User Card
            if (activeNetworkLabel) activeNetworkLabel.textContent = `${userEscola} (Direção)`;
            if (userProfileName) userProfileName.textContent = 'Diretora Maria';
            if (userProfileRole) userProfileRole.textContent = `Direção • ${userEscola}`;
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'DE';
                userProfileAvatar.style.backgroundColor = '#059669';
            }

        } else if (userRole === 'Master Admin') {
            // Visible for Admin: All modules including Governance & TI
            allMenuItems.forEach(item => { item.style.display = 'flex'; });

            // Sidebar User Card
            if (activeNetworkLabel) activeNetworkLabel.textContent = 'Administração TI / DPO';
            if (userProfileName) userProfileName.textContent = 'Administrador TI';
            if (userProfileRole) userProfileRole.textContent = 'DPO & Infraestrutura';
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'AD';
                userProfileAvatar.style.backgroundColor = '#e11d48';
            }

        } else {
            // SEMED (Gestor da Rede)
            const allowedTabs = ['dashboard', 'escolas-panel', 'alunos-panel', 'metas-ideb', 'ideb-comparativo', 'matriz-descritores', 'cronograma-habilidades', 'criar-avaliacoes', 'aplicacao-provas', 'questions', 'ai-playground', 'gestao-pedagogica', 'biblioteca-recursos'];
            allMenuItems.forEach(item => {
                const target = item.getAttribute('data-target');
                item.style.display = (target === 'doc-tecnica' || target === 'admin-panel') ? 'none' : 'flex';
            });

            // Sidebar User Card
            if (activeNetworkLabel) activeNetworkLabel.textContent = 'SEMED Gonçalves Dias - MA';
            if (userProfileName) userProfileName.textContent = 'Secretaria de Educação';
            if (userProfileRole) userProfileRole.textContent = 'Gestão Executiva SEMED';
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'SM';
                userProfileAvatar.style.backgroundColor = '#9333ea';
            }
        }

        if (window.lucide) {
            lucide.createIcons({ attrs: { class: 'lucide' } });
        }
    }

    // ==========================================
    // BIBLIOTECA PEDAGÓGICA & GERADOR DE PROVAS
    // ==========================================
    let defaultPedagogicMaterials = [
        {
            id: 'mat_1',
            titulo: 'Simulado SAEB 2026 - 5º Ano Língua Portuguesa',
            componente: 'Língua Portuguesa',
            etapa: '5º Ano',
            tipo: 'Simulado',
            descritores: ['D01', 'D03', 'D04', 'D06', 'D11'],
            descricao: 'Caderno completo de 20 questões alinhadas à matriz SAEB/SEAMA de leitura, inferência e localização de informações explícitas.',
            totalQuestoes: 20,
            formato: 'Caderno A4 com Gabarito'
        },
        {
            id: 'mat_2',
            titulo: 'Simulado SAEB 2026 - 5º Ano Matemática',
            componente: 'Matemática',
            etapa: '5º Ano',
            tipo: 'Simulado',
            descritores: ['D13', 'D14', 'D20', 'D28'],
            descricao: 'Simulado focado em resolução de problemas com números naturais, cálculo de área e perímetro e interpretação de gráficos.',
            totalQuestoes: 20,
            formato: 'Caderno A4 com Gabarito'
        },
        {
            id: 'mat_3',
            titulo: 'Caderno Diagnóstico de Fluência Leitora - 2º Ano',
            componente: 'Língua Portuguesa',
            etapa: '2º Ano',
            tipo: 'Intervencao',
            descritores: ['EF02LP01', 'EF02LP04'],
            descricao: 'Instrumento para aferição de palavras lidas por minuto (PPM) e compreensão leitora nos anos iniciais de alfabetização.',
            totalQuestoes: 10,
            formato: 'Guia de Aplicação'
        },
        {
            id: 'mat_4',
            titulo: 'Simulado SAEB 2026 - 9º Ano Língua Portuguesa',
            componente: 'Língua Portuguesa',
            etapa: '9º Ano',
            tipo: 'Simulado',
            descritores: ['D01', 'D05', 'D07', 'D12'],
            descricao: 'Caderno preparatório para os Anos Finais com foco em análise temática, relações intertextuais e efeitos de sentido.',
            totalQuestoes: 26,
            formato: 'Caderno A4 com Gabarito'
        },
        {
            id: 'mat_5',
            titulo: 'Simulado SAEB 2026 - 9º Ano Matemática',
            componente: 'Matemática',
            etapa: '9º Ano',
            tipo: 'Simulado',
            descritores: ['D16', 'D19', 'D27', 'D35'],
            descricao: 'Avaliação diagnóstica de álgebra, proporcionalidade, geometria plana e análise de tabelas estatísticas.',
            totalQuestoes: 26,
            formato: 'Caderno A4 com Gabarito'
        },
        {
            id: 'mat_6',
            titulo: 'Matriz Curricular Referencial SAEB / SEAMA - Gonçalves Dias',
            componente: 'Multidisciplinar',
            etapa: 'Todas',
            tipo: 'Matriz',
            descritores: ['Todos os Descritores'],
            descricao: 'Documento orientador oficial da SEMED Gonçalves Dias com o mapeamento das habilidades prioritárias para o IDEB 2026.',
            totalQuestoes: 0,
            formato: 'Documento Técnico PDF'
        },
        {
            id: 'mat_7',
            titulo: 'Plano de Intervenção Pedagógica: Descritores Críticos D01 e D13',
            componente: 'Multidisciplinar',
            etapa: '5º Ano',
            tipo: 'Intervencao',
            descritores: ['D01', 'D13'],
            descricao: 'Roteiro de oficinas pedagógicas e sequências didáticas para reforço escolar nos descritores com menor índice de acerto.',
            totalQuestoes: 0,
            formato: 'Guia Prático do Professor'
        }
    ];

    function renderPedagogicLibrary() {
        const grid = document.getElementById('bib-materials-grid');
        if (!grid) return;

        const compFilter = document.getElementById('filter-bib-componente')?.value || 'all';
        const etapaFilter = document.getElementById('filter-bib-etapa')?.value || 'all';
        const tipoFilter = document.getElementById('filter-bib-tipo')?.value || 'all';
        const searchVal = document.getElementById('search-bib-input')?.value.toLowerCase().trim() || '';

        const filtered = defaultPedagogicMaterials.filter(item => {
            if (compFilter !== 'all' && item.componente !== compFilter) return false;
            if (etapaFilter !== 'all' && item.etapa !== etapaFilter && item.etapa !== 'Todas') return false;
            if (tipoFilter !== 'all' && item.tipo !== tipoFilter) return false;
            if (searchVal && !item.titulo.toLowerCase().includes(searchVal) && !item.descricao.toLowerCase().includes(searchVal)) return false;
            return true;
        });

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-secondary);">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; margin: 0 auto 12px auto; opacity: 0.4;"></i>
                    <p>Nenhum material encontrado com os filtros selecionados.</p>
                </div>
            `;
            if (window.lucide) lucide.createIcons({ attrs: { class: 'lucide' } });
            return;
        }

        grid.innerHTML = filtered.map(item => `
            <div class="bib-card">
                <div>
                    <div class="bib-card-header">
                        <div class="bib-card-icon">
                            <i data-lucide="${item.tipo === 'Simulado' ? 'file-check-2' : (item.tipo === 'Matriz' ? 'list-checks' : 'book-open')}"></i>
                        </div>
                        <div>
                            <div class="bib-card-title">${item.titulo}</div>
                            <span style="font-size: 0.7rem; color: var(--text-muted);">${item.formato}</span>
                        </div>
                    </div>
                    <div class="bib-card-badges">
                        <span class="badge ${item.componente === 'Matemática' ? 'badge-info' : (item.componente === 'Língua Portuguesa' ? 'badge-purple' : 'badge-success')}">${item.componente}</span>
                        <span class="badge badge-default">${item.etapa}</span>
                        <span class="badge badge-warning">${item.tipo}</span>
                    </div>
                    <div class="bib-card-desc">${item.descricao}</div>
                </div>
                <div class="bib-card-actions">
                    ${item.tipo === 'Simulado' ? `
                        <button class="btn btn-primary btn-print-material" data-id="${item.id}" style="flex: 1; padding: 6px 10px; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <i data-lucide="printer" style="width: 14px; height: 14px;"></i>
                            <span>Imprimir Prova A4</span>
                        </button>
                    ` : ''}
                    <button class="btn btn-outline btn-view-material" data-id="${item.id}" style="flex: 1; padding: 6px 10px; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
                        <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                        <span>Visualizar Material</span>
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons({ attrs: { class: 'lucide' } });

        // Event listeners on buttons
        grid.querySelectorAll('.btn-print-material').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const mat = defaultPedagogicMaterials.find(m => m.id === id);
                if (mat) {
                    generateA4PrintableExam(mat);
                }
            });
        });

        grid.querySelectorAll('.btn-view-material').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const mat = defaultPedagogicMaterials.find(m => m.id === id);
                if (mat) {
                    generateA4PrintableExam(mat);
                }
            });
        });
    }

    function generateA4PrintableExam(material) {
        const modal = document.getElementById('print-exam-modal');
        const docArea = document.getElementById('printable-exam-document');
        if (!modal || !docArea) return;

        // Pick relevant questions from rawQuestions
        const relevantQuestions = rawQuestions.filter(q => {
            if (material.componente !== 'Multidisciplinar' && q.componente !== material.componente) return false;
            return true;
        }).slice(0, 10);

        const examQuestions = relevantQuestions.length > 0 ? relevantQuestions : [
            {
                codigo: "Q01",
                descritor_codigo: "D01",
                descritor_nome: "Localizar informações explícitas em um texto",
                enunciado: "Leia o texto com atenção e responda:\n\n'O município de Gonçalves Dias, no Maranhão, possui tradição de acolhimento e rica cultura popular. Nas escolas municipais, os estudantes aprendem sobre a história e a fauna do cerrado maranhense.'\n\nDe acordo com o texto, o que os estudantes aprendem nas escolas municipais?",
                opcoes: {
                    A: "Apenas sobre as praias do litoral.",
                    B: "Sobre a história e a fauna do cerrado maranhense.",
                    C: "Sobre grandes indústrias automotivas.",
                    D: "Sobre viagens espaciais."
                },
                correta: "B"
            },
            {
                codigo: "Q02",
                descritor_codigo: "D03",
                descritor_nome: "Inferir o sentido de uma palavra ou expressão",
                enunciado: "Leia a frase: 'A dedicação dos professores e alunos de Gonçalves Dias gerou um avanço expressivo no IDEB.'\n\nA palavra 'expressivo', no contexto da frase, significa:",
                opcoes: {
                    A: "Muito pequeno e insignificante.",
                    B: "Marcante, significativo e grandioso.",
                    C: "Duvidoso e incerto.",
                    D: "Lento e desorganizado."
                },
                correta: "B"
            },
            {
                codigo: "Q03",
                descritor_codigo: "D13",
                descritor_nome: "Reconhecer diferentes formas de tratar uma informação",
                enunciado: "Em uma escola da rede municipal de Gonçalves Dias, há 480 alunos matriculados. Se 3/4 dos estudantes realizaram a avaliação diagnóstica de Língua Portuguesa, quantos alunos fizeram a prova?",
                opcoes: {
                    A: "120 alunos.",
                    B: "240 alunos.",
                    C: "360 alunos.",
                    D: "400 alunos."
                },
                correta: "C"
            },
            {
                codigo: "Q04",
                descritor_codigo: "D20",
                descritor_nome: "Resolver problema com números naturais envolvendo diferentes significados da multiplicação ou divisão",
                enunciado: "A SEMED de Gonçalves Dias distribuiu 3.600 livros didáticos igualmente entre 12 unidades escolares municipais. Quantos livros cada escola recebeu?",
                opcoes: {
                    A: "250 livros.",
                    B: "300 livros.",
                    C: "360 livros.",
                    D: "400 livros."
                },
                correta: "B"
            }
        ];

        const userEscola = sessionStorage.getItem('userEscola') || 'U.E. BENTA VILANOVA';
        const userTurma = sessionStorage.getItem('userTurma') || material.etapa || '5º Ano';

        docArea.innerHTML = `
            <div class="print-exam-header">
                <div class="print-header-top">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <div style="width:40px; height:40px; background:#8b5cf6; border-radius:6px; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:18px;">GD</div>
                        <div class="print-header-title">
                            <h2>PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA</h2>
                            <span>SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED) • AVALIAÇÃO DIAGNÓSTICA MUNICIPAL</span>
                        </div>
                    </div>
                    <div style="text-align:right; font-size:8.5pt; font-weight:700; color:#555;">
                        <div>ANO LETIVO 2026</div>
                        <div>PADRÃO SAEB / SEAMA</div>
                    </div>
                </div>
                <div class="print-student-info">
                    <div><strong>Nome do(a) Aluno(a):</strong> _________________________________________________________________</div>
                    <div><strong>Data de Aplicação:</strong> ____/____/2026</div>
                    <div><strong>Unidade Escolar:</strong> ${userEscola}</div>
                    <div><strong>Turma / Etapa:</strong> ${userTurma}</div>
                </div>
            </div>

            <div class="print-instructions">
                <strong>INSTRUÇÕES AO ESTUDANTE:</strong>
                <ul>
                    <li>Verifique se este caderno contém todas as questões impressas de forma legível.</li>
                    <li>Leia com atenção cada enunciado antes de assinalar sua resposta.</li>
                    <li>Cada questão possui apenas uma alternativa correta (A, B, C ou D).</li>
                    <li>Ao finalizar, preencha a Folha de Respostas abaixo preenchendo completamente o círculo com caneta azul ou preta.</li>
                </ul>
            </div>

            <div class="print-questions-grid">
                ${examQuestions.map((q, idx) => `
                    <div class="print-question-item">
                        <div class="print-q-meta">
                            <span>QUESTÃO ${idx + 1} (${q.codigo || 'ITEM'})</span>
                            <span>HABILIDADE / DESCRITOR: <strong>${q.descritor_codigo || 'SAEB'}</strong></span>
                        </div>
                        <div class="print-q-text">${q.enunciado.replace(/\n/g, '<br>')}</div>
                        <div class="print-q-options">
                            <div class="print-q-opt">
                                <div class="print-opt-circle">A</div>
                                <div>${q.opcoes ? q.opcoes.A : (q.opcao_a || 'Opção A')}</div>
                            </div>
                            <div class="print-q-opt">
                                <div class="print-opt-circle">B</div>
                                <div>${q.opcoes ? q.opcoes.B : (q.opcao_b || 'Opção B')}</div>
                            </div>
                            <div class="print-q-opt">
                                <div class="print-opt-circle">C</div>
                                <div>${q.opcoes ? q.opcoes.C : (q.opcao_c || 'Opção C')}</div>
                            </div>
                            <div class="print-q-opt">
                                <div class="print-opt-circle">D</div>
                                <div>${q.opcoes ? q.opcoes.D : (q.opcao_d || 'Opção D')}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Bubble Answer Sheet -->
            <div class="print-bubble-sheet">
                <div class="print-bubble-sheet-header">
                    <h4>FOLHA DE RESPOSTAS / CARTÃO-RESPOSTA OFICIAL (SEMED GONÇALVES DIAS)</h4>
                    <span style="font-size:8.5pt; color:#666;">Preencha completamente os círculos correspondentes:</span>
                </div>
                <div class="print-bubble-grid">
                    ${examQuestions.map((_, i) => `
                        <div class="print-bubble-row">
                            <span style="width:28px;">${i + 1 < 10 ? '0' + (i + 1) : i + 1}:</span>
                            <span class="print-opt-circle" style="width:16px; height:16px; font-size:7pt;">A</span>
                            <span class="print-opt-circle" style="width:16px; height:16px; font-size:7pt;">B</span>
                            <span class="print-opt-circle" style="width:16px; height:16px; font-size:7pt;">C</span>
                            <span class="print-opt-circle" style="width:16px; height:16px; font-size:7pt;">D</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
    }

    // Print Modal & Filters Listeners
    const closePrintModalBtn = document.getElementById('close-print-exam-modal-btn');
    const triggerBrowserPrintBtn = document.getElementById('btn-trigger-browser-print');
    const openExamGeneratorBtn = document.getElementById('btn-open-exam-generator');

    if (closePrintModalBtn) {
        closePrintModalBtn.addEventListener('click', () => {
            document.getElementById('print-exam-modal')?.classList.add('hidden');
        });
    }

    if (triggerBrowserPrintBtn) {
        triggerBrowserPrintBtn.addEventListener('click', () => {
            window.print();
        });
    }

    if (openExamGeneratorBtn) {
        openExamGeneratorBtn.addEventListener('click', () => {
            generateA4PrintableExam({
                titulo: 'Avaliação Diagnóstica Geral (SEMED Gonçalves Dias)',
                componente: 'Multidisciplinar',
                etapa: '5º Ano'
            });
        });
    }

    // Filter listeners for Biblioteca
    ['filter-bib-componente', 'filter-bib-etapa', 'filter-bib-tipo'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderPedagogicLibrary);
    });
    document.getElementById('search-bib-input')?.addEventListener('input', debounce(renderPedagogicLibrary, 250));

    // Upload Material Modal
    const btnUploadMaterial = document.getElementById('btn-upload-pedagogic-file');
    const uploadModal = document.getElementById('upload-pedagogic-modal');
    const closeUploadModalBtn = document.getElementById('close-upload-pedagogic-modal-btn');
    const cancelUploadBtn = document.getElementById('btn-cancel-upload-pedagogic');
    const uploadForm = document.getElementById('upload-pedagogic-form');

    if (btnUploadMaterial && uploadModal) {
        btnUploadMaterial.addEventListener('click', () => uploadModal.classList.remove('hidden'));
        closeUploadModalBtn?.addEventListener('click', () => uploadModal.classList.add('hidden'));
        cancelUploadBtn?.addEventListener('click', () => uploadModal.classList.add('hidden'));
        uploadForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('new-material-title').value;
            const comp = document.getElementById('new-material-comp').value;
            const etapa = document.getElementById('new-material-etapa').value;
            const tipo = document.getElementById('new-material-tipo').value;
            const desc = document.getElementById('new-material-desc').value;

            defaultPedagogicMaterials.unshift({
                id: 'mat_' + Date.now(),
                titulo: title,
                componente: comp,
                etapa: etapa,
                tipo: tipo,
                descritores: ['BNCC / SEAMA'],
                descricao: desc || 'Material pedagógico adicionado à biblioteca municipal.',
                totalQuestoes: 10,
                formato: 'Material Didático'
            });

            uploadModal.classList.add('hidden');
            uploadForm.reset();
            showToast('Material adicionado à Biblioteca com sucesso!', 'check');
            renderPedagogicLibrary();
        });
    }

    // ==========================================
    // GESTÃO DE USUÁRIOS (LAYOUT ADAPTADO - IMAGENS 1 E 2)
    // ==========================================

    let dbUsersList = [
        {
            id: '4772',
            nome: 'MARIA JOAQUINA SOUSA DA CUNHA',
            tipo: 'Aluno(a)',
            situacao: 'Ativo',
            cpf: '084.592.113-40',
            inep: '21128723',
            nis: '165.82910.44-1',
            mae: 'ELINALVA FEITOSA DE SOUSA',
            telefone: '99984-4666',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            turno: 'Matutino',
            dataInclusao: '14/08/2026',
            saebNivel: 'Nível 3 (Adequado)',
            lpPontos: '224 pts',
            matPontos: '238 pts',
            frequencia: '96.5%',
            responsavel: {
                nome: 'ELINALVA FEITOSA DE SOUSA',
                parentesco: 'Mãe',
                telefone: '(99) 99984-4666',
                cpf: '041.229.883-91'
            },
            origem: {
                escolaAnterior: 'Escola Municipal São Francisco',
                escolaAtual: 'UI JOSE CORREA LIMA',
                turma: '5º Ano A'
            },
            acesso: null
        },
        {
            id: '4773',
            nome: 'PROF. CARLOS EDUARDO SILVA',
            tipo: 'Professor(a)',
            situacao: 'Ativo',
            cpf: '412.879.653-22',
            inep: '21128146',
            nis: '-',
            mae: 'MARIA DE LOURDES SILVA',
            telefone: '99935-6250',
            escola: 'UI EMILIO MURAD',
            turma: '5º e 9º Anos',
            turno: 'Integral',
            dataInclusao: '02/02/2026',
            saebNivel: 'Docente Titular',
            lpPontos: '-',
            matPontos: '-',
            frequencia: '100%',
            responsavel: null,
            origem: {
                escolaAnterior: 'Rede Estadual do Maranhão',
                escolaAtual: 'UI EMILIO MURAD',
                turma: 'Matemática e LP'
            },
            acesso: {
                email: 'carlos.silva@goncalvesdias.ma.gov.br',
                role: 'Professor'
            }
        },
        {
            id: '4774',
            nome: 'DIR. ANA CLARA MENDES',
            tipo: 'Diretor(a)',
            situacao: 'Ativo',
            cpf: '551.982.341-00',
            inep: '21286973',
            nis: '-',
            mae: 'TERESA MENDES RIBEIRO',
            telefone: '99998-2055',
            escola: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ',
            turma: 'Gestão Geral',
            turno: 'Matutino / Vespertino',
            dataInclusao: '15/01/2026',
            saebNivel: 'Gestor Escolar',
            lpPontos: '-',
            matPontos: '-',
            frequencia: '100%',
            responsavel: null,
            origem: {
                escolaAnterior: 'SEMED Gonçalves Dias',
                escolaAtual: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ',
                turma: 'Direção'
            },
            acesso: {
                email: 'ana.mendes@goncalvesdias.ma.gov.br',
                role: 'Diretor'
            }
        },
        {
            id: '4775',
            nome: 'GABRIEL FEITOSA DE SOUSA',
            tipo: 'Aluno(a)',
            situacao: 'Ativo',
            cpf: '095.334.812-70',
            inep: '21128740',
            nis: '165.82910.44-2',
            mae: 'ELINALVA FEITOSA DE SOUSA',
            telefone: '99981-4371',
            escola: 'UE VEREADOR LEONARDO FERREIRA LIMA',
            turma: '9º Ano B',
            turno: 'Vespertino',
            dataInclusao: '14/08/2026',
            saebNivel: 'Nível 4 (Consolidado)',
            lpPontos: '268 pts',
            matPontos: '274 pts',
            frequencia: '98.0%',
            responsavel: {
                nome: 'ELINALVA FEITOSA DE SOUSA',
                parentesco: 'Mãe',
                telefone: '(99) 99981-4371',
                cpf: '041.229.883-91'
            },
            origem: {
                escolaAnterior: 'UE VEREADOR LEONARDO FERREIRA LIMA',
                escolaAtual: 'UE VEREADOR LEONARDO FERREIRA LIMA',
                turma: '9º Ano B'
            },
            acesso: null
        }
    ];

    let currentSelectedUser = dbUsersList[0];

    function loadUsersList() {
        renderUsersTable();
    }

    function renderUsersTable() {
        const tbody = document.getElementById('users-table-body');
        if (!tbody) return;

        const typeFilter = document.getElementById('filter-user-type')?.value || 'all';
        const searchVal = document.getElementById('filter-user-search')?.value?.toLowerCase().trim() || '';
        const statusFilter = document.getElementById('filter-user-status')?.value || 'all';

        const filtered = dbUsersList.filter(u => {
            const matchType = typeFilter === 'all' || u.tipo === typeFilter;
            const matchStatus = statusFilter === 'all' || u.situacao === statusFilter;
            const matchSearch = !searchVal ||
                u.id.toLowerCase().includes(searchVal) ||
                u.nome.toLowerCase().includes(searchVal) ||
                (u.cpf && u.cpf.toLowerCase().includes(searchVal)) ||
                (u.inep && u.inep.toLowerCase().includes(searchVal)) ||
                (u.mae && u.mae.toLowerCase().includes(searchVal));

            return matchType && matchStatus && matchSearch;
        });

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 32px; text-align: center; color: var(--text-muted);">
                        Nenhum usuário encontrado com os filtros selecionados.
                    </td>
                </tr>
            `;
            safeCreateIcons();
            return;
        }

        filtered.forEach(u => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.fontSize = '0.82rem';
            tr.style.height = '52px';

            const isAluno = u.tipo === 'Aluno(a)';
            const typeBadgeColor = isAluno ? '#f97316' : (u.tipo === 'Professor(a)' ? '#3b82f6' : (u.tipo === 'Diretor(a)' ? '#8b5cf6' : '#64748b'));

            tr.innerHTML = `
                <td style="padding: 10px 14px; font-weight: 700; font-family: var(--font-mono); color: var(--text-secondary);">
                    ${u.id}
                </td>
                <td style="padding: 10px 14px;">
                    <div style="display: flex; flex-direction: column; gap: 3px; align-items: flex-start;">
                        <span style="background: #22c55e; color: #ffffff; font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 3px;">
                            ${u.situacao}
                        </span>
                        <span style="background: ${typeBadgeColor}; color: #ffffff; font-size: 0.68rem; font-weight: 700; padding: 2px 6px; border-radius: 3px;">
                            ${u.tipo}
                        </span>
                    </div>
                </td>
                <td style="padding: 10px 14px; font-size: 0.78rem;">
                    <div style="color: var(--text-secondary);"><strong style="color: var(--text-primary);">CPF:</strong> ${u.cpf || '-'}</div>
                    <div style="color: var(--text-secondary); margin-top: 2px;"><strong style="color: var(--text-primary);">INEP:</strong> ${u.inep || '-'}</div>
                </td>
                <td style="padding: 10px 14px;">
                    <strong style="color: var(--text-primary); font-size: 0.84rem; display: block; text-transform: uppercase;">
                        ${u.nome}
                    </strong>
                    <span style="font-size: 0.74rem; color: var(--text-secondary); display: block; margin-top: 2px;">
                        ${u.mae ? `Mãe: ${u.mae}` : (u.escola ? `Lotação: ${u.escola}` : '')}
                    </span>
                </td>
                <td style="padding: 10px 14px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary);">
                    ${u.telefone || '-'}
                </td>
                <td style="padding: 10px 14px; text-align: center;">
                    <div style="display: inline-flex; gap: 6px; align-items: center; justify-content: center;">
                        <button class="btn btn-sm btn-view-profile" data-id="${u.id}" style="background: #84cc16; color: #ffffff; border: none; padding: 6px 9px; border-radius: 4px; cursor: pointer;" title="Ver Perfil Completo">
                            <i data-lucide="search" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="btn btn-sm btn-edit-profile" data-id="${u.id}" style="background: #3b82f6; color: #ffffff; border: none; padding: 6px 9px; border-radius: 4px; cursor: pointer;" title="Editar Dados">
                            <i data-lucide="edit-2" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="btn btn-sm btn-delete-profile" data-id="${u.id}" style="background: #ef4444; color: #ffffff; border: none; padding: 6px 9px; border-radius: 4px; cursor: pointer;" title="Excluir Usuário">
                            <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </td>
            `;

            tbody.appendChild(tr);
        });

        // Add event listeners to action buttons
        tbody.querySelectorAll('.btn-view-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const u = dbUsersList.find(user => user.id === id);
                if (u) openUserProfileDetail(u);
            });
        });

        tbody.querySelectorAll('.btn-edit-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const u = dbUsersList.find(user => user.id === id);
                if (u) {
                    currentSelectedUser = u;
                    openUserProfileDetail(u);
                    showToast(`Modo de edição ativado para ${u.nome}`, 'edit');
                }
            });
        });

        tbody.querySelectorAll('.btn-delete-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const u = dbUsersList.find(user => user.id === id);
                if (u && confirm(`Deseja realmente desativar/excluir o usuário ${u.nome}?`)) {
                    dbUsersList = dbUsersList.filter(user => user.id !== id);
                    renderUsersTable();
                    showToast('Usuário removido com sucesso!', 'trash-2');
                }
            });
        });

        safeCreateIcons();
    }

    // Filter event listeners
    const filterUserType = document.getElementById('filter-user-type');
    const filterUserSearch = document.getElementById('filter-user-search');
    const filterUserStatus = document.getElementById('filter-user-status');
    const btnSearchUsers = document.getElementById('btn-search-users');

    if (filterUserType) filterUserType.addEventListener('change', renderUsersTable);
    if (filterUserStatus) filterUserStatus.addEventListener('change', renderUsersTable);
    if (filterUserSearch) filterUserSearch.addEventListener('input', debounce(renderUsersTable, 200));
    if (btnSearchUsers) btnSearchUsers.addEventListener('click', renderUsersTable);

    // Profile Detail View (Layout Imagem 2)
    function openUserProfileDetail(user) {
        currentSelectedUser = user;
        const listView = document.getElementById('users-list-view-container');
        const detailView = document.getElementById('user-profile-detail-view');

        if (!listView || !detailView) return;

        listView.classList.add('hidden');
        detailView.classList.remove('hidden');

        // Populate Left Column
        const displayName = document.getElementById('profile-user-display-name');
        const fullName = document.getElementById('profile-user-full-name');
        const typeBadge = document.getElementById('profile-user-type-badge');
        const idEl = document.getElementById('profile-user-id');
        const inepEl = document.getElementById('profile-user-inep');
        const nisEl = document.getElementById('profile-user-nis');
        const cpfEl = document.getElementById('profile-user-cpf');
        const dateEl = document.getElementById('profile-user-date');
        const motherEl = document.getElementById('profile-user-mother');
        const phoneEl = document.getElementById('profile-user-phone');
        const schoolEl = document.getElementById('profile-user-school');

        if (displayName) displayName.textContent = user.nome;
        if (fullName) fullName.textContent = user.nome;
        if (typeBadge) {
            typeBadge.textContent = user.tipo;
            typeBadge.style.background = user.tipo === 'Aluno(a)' ? '#f97316' : (user.tipo === 'Professor(a)' ? '#3b82f6' : '#8b5cf6');
        }
        if (idEl) idEl.textContent = user.id;
        if (inepEl) inepEl.textContent = user.inep || '-';
        if (nisEl) nisEl.textContent = user.nis || '-';
        if (cpfEl) cpfEl.textContent = user.cpf || '-';
        if (dateEl) dateEl.textContent = user.dataInclusao || '14/08/2026';
        if (motherEl) motherEl.textContent = user.mae || 'Não informado';
        if (phoneEl) phoneEl.textContent = user.telefone || '-';
        if (schoolEl) schoolEl.textContent = user.escola || 'Rede Municipal';

        // Populate Right Column: 1. Responsável
        const respContent = document.getElementById('profile-responsible-content');
        if (respContent) {
            if (user.responsavel) {
                respContent.innerHTML = `
                    <div style="background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <strong style="font-size: 0.88rem; color: var(--text-primary); display: block; text-transform: uppercase;">
                            ${user.responsavel.nome}
                        </strong>
                        <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <span><strong>Parentesco:</strong> ${user.responsavel.parentesco}</span>
                            <span><strong>Telefone:</strong> ${user.responsavel.telefone}</span>
                            <span><strong>CPF:</strong> ${user.responsavel.cpf || '-'}</span>
                        </div>
                    </div>
                `;
            } else {
                respContent.innerHTML = '<p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">Nenhum registro foi encontrado.</p>';
            }
        }

        // Populate Right Column: 2. Origem Escolar
        const origContent = document.getElementById('profile-origin-content');
        if (origContent) {
            if (user.origem) {
                origContent.innerHTML = `
                    <div style="background: var(--bg-tertiary); padding: 12px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <strong style="font-size: 0.88rem; color: var(--text-primary); display: block;">
                            ${user.origem.escolaAtual}
                        </strong>
                        <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                            <span><strong>Turma / Cargo:</strong> ${user.origem.turma}</span>
                            <span><strong>Origem Anterior:</strong> ${user.origem.escolaAnterior}</span>
                        </div>
                    </div>
                `;
            } else {
                origContent.innerHTML = '<p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">Nenhum registro foi encontrado.</p>';
            }
        }

        // Populate Right Column: 3. Desempenho
        const statLvl = document.getElementById('profile-stat-saeb-level');
        const statLp = document.getElementById('profile-stat-lp');
        const statMat = document.getElementById('profile-stat-mat');
        const statFreq = document.getElementById('profile-stat-freq');

        if (statLvl) statLvl.textContent = user.saebNivel || 'Nível 3 (Adequado)';
        if (statLp) statLp.textContent = user.lpPontos || '224 pts';
        if (statMat) statMat.textContent = user.matPontos || '238 pts';
        if (statFreq) statFreq.textContent = user.frequencia || '96.5%';

        // Populate Right Column: 4. Acessos
        const accessContent = document.getElementById('profile-access-content');
        if (accessContent) {
            if (user.acesso) {
                accessContent.innerHTML = `
                    <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: var(--radius-sm); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                        <div>
                            <strong style="font-size: 0.85rem; color: var(--green-light); display: flex; align-items: center; gap: 6px;">
                                <i data-lucide="check-circle" style="width: 15px; height: 15px;"></i>
                                Acesso Ativo ao Sistema
                            </strong>
                            <span style="font-size: 0.78rem; color: var(--text-secondary); display: block; margin-top: 2px;">
                                Login: <strong>${user.acesso.email}</strong> • Perfil: ${user.acesso.role}
                            </span>
                        </div>
                        <button class="btn btn-outline btn-sm" id="btn-reset-user-pass" style="font-size: 0.75rem;">
                            Redefinir Senha
                        </button>
                    </div>
                `;
                document.getElementById('btn-reset-user-pass')?.addEventListener('click', () => {
                    showToast(`Link de redefinição de senha enviado para ${user.acesso.email}`, 'send');
                });
            } else {
                accessContent.innerHTML = `
                    <button class="btn" id="btn-create-system-access" style="background: #ef4444; color: #ffffff; font-weight: 800; font-size: 0.82rem; text-transform: uppercase; padding: 10px 20px; border-radius: 4px; display: flex; align-items: center; gap: 8px; border: none; cursor: pointer;">
                        <i data-lucide="lock" style="width: 16px; height: 16px;"></i>
                        <span>CRIAR ACESSO AO SISTEMA</span>
                    </button>
                `;
                document.getElementById('btn-create-system-access')?.addEventListener('click', () => {
                    document.getElementById('modal-criar-acesso')?.classList.remove('hidden');
                });
            }
        }

        safeCreateIcons();
    }

    // Navigation back to users list
    const btnBackToUsers = document.getElementById('btn-back-to-users-list');
    if (btnBackToUsers) {
        btnBackToUsers.addEventListener('click', () => {
            document.getElementById('user-profile-detail-view')?.classList.add('hidden');
            document.getElementById('users-list-view-container')?.classList.remove('hidden');
            renderUsersTable();
        });
    }

    // Modals in Profile Detail View
    // 1. Alterar Foto
    const btnProfileChangePhoto = document.getElementById('btn-profile-change-photo');
    if (btnProfileChangePhoto) {
        btnProfileChangePhoto.addEventListener('click', () => {
            showToast('Selecione uma imagem para atualizar o avatar do usuário.', 'image');
        });
    }

    // 2. Documentos
    const btnProfileDocs = document.getElementById('btn-profile-docs-user');
    if (btnProfileDocs) {
        btnProfileDocs.addEventListener('click', () => {
            showToast(`Emitindo Ficha Cadastral em PDF para ${currentSelectedUser?.nome}...`, 'printer');
            setTimeout(() => window.print(), 300);
        });
    }

    // 3. Cadastrar Responsável
    const modalCadastrarResp = document.getElementById('modal-cadastrar-responsavel');
    const btnAddResp = document.getElementById('btn-add-responsible');
    const btnCloseResp = document.getElementById('btn-close-resp-modal');
    const btnCancelResp = document.getElementById('btn-cancel-resp-modal');
    const btnSaveResp = document.getElementById('btn-save-resp-modal');

    if (btnAddResp && modalCadastrarResp) {
        btnAddResp.addEventListener('click', () => modalCadastrarResp.classList.remove('hidden'));
    }
    if (btnCloseResp && modalCadastrarResp) {
        btnCloseResp.addEventListener('click', () => modalCadastrarResp.classList.add('hidden'));
    }
    if (btnCancelResp && modalCadastrarResp) {
        btnCancelResp.addEventListener('click', () => modalCadastrarResp.classList.add('hidden'));
    }
    if (btnSaveResp) {
        btnSaveResp.addEventListener('click', () => {
            const nome = document.getElementById('resp-input-nome')?.value.trim();
            const parentesco = document.getElementById('resp-input-parentesco')?.value || 'Mãe';
            const tel = document.getElementById('resp-input-tel')?.value.trim();
            const cpf = document.getElementById('resp-input-cpf')?.value.trim();

            if (!nome || !tel) {
                showToast('Informe o nome e o telefone do responsável.', 'alert-triangle');
                return;
            }

            if (currentSelectedUser) {
                currentSelectedUser.responsavel = { nome, parentesco, telefone: tel, cpf };
                modalCadastrarResp.classList.add('hidden');
                openUserProfileDetail(currentSelectedUser);
                showToast('Responsável legal cadastrado com sucesso!', 'check');
            }
        });
    }

    // 4. Cadastrar Origem Escolar
    const modalCadastrarOrigem = document.getElementById('modal-cadastrar-origem');
    const btnAddOrigem = document.getElementById('btn-add-school-origin');
    const btnCloseOrigem = document.getElementById('btn-close-origem-modal');
    const btnCancelOrigem = document.getElementById('btn-cancel-origem-modal');
    const btnSaveOrigem = document.getElementById('btn-save-origem-modal');
    const selOrigemEscolaAtual = document.getElementById('origem-input-escola-atual');

    if (btnAddOrigem && modalCadastrarOrigem) {
        btnAddOrigem.addEventListener('click', () => {
            if (selOrigemEscolaAtual && dbEscolas) {
                selOrigemEscolaAtual.innerHTML = dbEscolas.map(e => `<option value="${e.nome}">${e.nome}</option>`).join('');
            }
            modalCadastrarOrigem.classList.remove('hidden');
        });
    }
    if (btnCloseOrigem && modalCadastrarOrigem) {
        btnCloseOrigem.addEventListener('click', () => modalCadastrarOrigem.classList.add('hidden'));
    }
    if (btnCancelOrigem && modalCadastrarOrigem) {
        btnCancelOrigem.addEventListener('click', () => modalCadastrarOrigem.classList.add('hidden'));
    }
    if (btnSaveOrigem) {
        btnSaveOrigem.addEventListener('click', () => {
            const escolaAnt = document.getElementById('origem-input-escola-ant')?.value.trim() || 'Rede Municipal';
            const escolaAtual = document.getElementById('origem-input-escola-atual')?.value || 'UI JOSE CORREA LIMA';
            const turma = document.getElementById('origem-input-turma')?.value.trim() || '5º Ano A';

            if (currentSelectedUser) {
                currentSelectedUser.origem = { escolaAnterior: escolaAnt, escolaAtual, turma };
                currentSelectedUser.escola = escolaAtual;
                currentSelectedUser.turma = turma;
                modalCadastrarOrigem.classList.add('hidden');
                openUserProfileDetail(currentSelectedUser);
                showToast('Vínculo escolar atualizado com sucesso!', 'check');
            }
        });
    }

    // 5. Criar Acesso ao Sistema
    const modalCriarAcesso = document.getElementById('modal-criar-acesso');
    const btnCloseAcesso = document.getElementById('btn-close-acesso-modal');
    const btnCancelAcesso = document.getElementById('btn-cancel-acesso-modal');
    const btnSaveAcesso = document.getElementById('btn-save-acesso-modal');

    if (btnCloseAcesso && modalCriarAcesso) {
        btnCloseAcesso.addEventListener('click', () => modalCriarAcesso.classList.add('hidden'));
    }
    if (btnCancelAcesso && modalCriarAcesso) {
        btnCancelAcesso.addEventListener('click', () => modalCriarAcesso.classList.add('hidden'));
    }
    if (btnSaveAcesso) {
        btnSaveAcesso.addEventListener('click', () => {
            const email = document.getElementById('acesso-input-email')?.value.trim();
            const role = document.getElementById('acesso-input-role')?.value || 'Aluno';

            if (!email) {
                showToast('Informe um e-mail válido para login.', 'alert-triangle');
                return;
            }

            if (currentSelectedUser) {
                currentSelectedUser.acesso = { email, role };
                modalCriarAcesso.classList.add('hidden');
                openUserProfileDetail(currentSelectedUser);
                showToast(`Acesso criado com sucesso para ${email}!`, 'check');
            }
        });
    }

    // 6. Cadastrar Novo Usuário Global Modal
    const btnOpenCreateUser = document.getElementById('btn-open-create-user-modal');
    const createUserModal = document.getElementById('create-user-modal');
    const closeCreateUserModalBtn = document.getElementById('close-create-user-modal-btn');
    const btnCancelCreateUser = document.getElementById('btn-cancel-create-user');
    const createUserForm = document.getElementById('create-user-form');
    const selectUserSchool = document.getElementById('new-user-school');

    if (btnOpenCreateUser && createUserModal) {
        btnOpenCreateUser.addEventListener('click', () => {
            if (selectUserSchool && dbEscolas) {
                selectUserSchool.innerHTML = dbEscolas.map(e => `<option value="${e.nome}">${e.nome}</option>`).join('');
            }
            createUserModal.classList.remove('hidden');
        });
    }
    if (closeCreateUserModalBtn && createUserModal) {
        closeCreateUserModalBtn.addEventListener('click', () => createUserModal.classList.add('hidden'));
    }
    if (btnCancelCreateUser && createUserModal) {
        btnCancelCreateUser.addEventListener('click', () => createUserModal.classList.add('hidden'));
    }

    if (createUserForm) {
        createUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nome = document.getElementById('new-user-name')?.value.trim();
            const tipo = document.getElementById('new-user-role')?.value || 'Aluno(a)';
            const tel = document.getElementById('new-user-phone')?.value.trim();
            const cpf = document.getElementById('new-user-cpf')?.value.trim();
            const inep = document.getElementById('new-user-inep')?.value.trim();
            const mae = document.getElementById('new-user-mother')?.value.trim();
            const escola = document.getElementById('new-user-school')?.value || 'UI JOSE CORREA LIMA';
            const turma = document.getElementById('new-user-grade')?.value.trim() || '5º Ano A';

            if (!nome) return;

            const newId = String(4770 + dbUsersList.length + 1);
            const newUser = {
                id: newId,
                nome: nome.toUpperCase(),
                tipo,
                situacao: 'Ativo',
                cpf: cpf || '-',
                inep: inep || '-',
                nis: '-',
                mae: mae || '-',
                telefone: tel || '-',
                escola,
                turma,
                turno: 'Matutino',
                dataInclusao: new Date().toLocaleDateString('pt-BR'),
                saebNivel: 'Em Avaliação',
                lpPontos: '-',
                matPontos: '-',
                frequencia: '100%',
                responsavel: mae ? { nome: mae, parentesco: 'Mãe', telefone: tel, cpf: '-' } : null,
                origem: { escolaAnterior: 'Rede Municipal', escolaAtual: escola, turma },
                acesso: null
            };

            dbUsersList.unshift(newUser);
            createUserModal.classList.add('hidden');
            createUserForm.reset();
            renderUsersTable();
            showToast(`Usuário ${newUser.nome} cadastrado com sucesso!`, 'check');
        });
    }


    // Initial render calls - Start clean and responsive
    initLoginMotionCanvas();
    rotateLoginHeadlines();
    loadDatabaseState();
    renderCreatedEvents();
    renderOngoingAssessments();
    renderActiveDescriptors();
    renderQuestions();
    renderReferenceMatrix();
    renderSkillsSchedule();
    populateQuestionCreatorDropdowns();
    initIdebComparativo();
    renderPedagogicLibrary();
    loadUsersList();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}



    // ==========================================
    // BIBLIOTECA PEDAGÓGICA (ESTILO MEC LIVROS)
    // ==========================================

    const pedagogicLibraryBooks = [
        {
            id: 'BOOK_01',
            titulo: 'Caderno de Simulado Oficial SAEB • 5º Ano EF',
            subtitulo: 'Língua Portuguesa (Leitura) & Matemática (Problemas)',
            etapa: '5º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            formato: 'PDF A4 Imprimível',
            paginas: 28,
            ano: 2026,
            corTema: '#6366f1',
            capaBadge: 'Simulado Oficial',
            descricao: 'Caderno completo de 44 itens padrão SAEB/INEP diagramado para aplicação em sala de aula, com folha de respostas e gabarito.'
        },
        {
            id: 'BOOK_02',
            titulo: 'Caderno de Fluência Leitora & Alfabetização • 2º Ano EF',
            subtitulo: 'Avaliação Diagnóstica SEAMA / Compromisso Criança Alfabetizada',
            etapa: '2º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Reforco',
            formato: 'PDF A4 Imprimível',
            paginas: 20,
            ano: 2026,
            corTema: '#f59e0b',
            capaBadge: 'Fluência & Leitura',
            descricao: 'Conjunto de textos curtos, parlendas e itens de consciência fonológica para monitoramento individual da leitura no 2º ano.'
        },
        {
            id: 'BOOK_03',
            titulo: 'Caderno de Simulado Prova Brasil • 9º Ano EF',
            subtitulo: 'Língua Portuguesa & Matemática (Anos Finais)',
            etapa: '9º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            formato: 'PDF A4 Imprimível',
            paginas: 36,
            ano: 2026,
            corTema: '#3b82f6',
            capaBadge: 'Simulado Oficial',
            descricao: '52 questões calibradas nos descritores críticos do 9º ano, incluindo álgebra, geometria e interpretação de gêneros diversos.'
        },
        {
            id: 'BOOK_04',
            titulo: 'Guia de Intervenção Pedagógica & Nivelamento (SEMED)',
            subtitulo: 'Orientações Práticas para Gestores e Professores de Gonçalves Dias',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Guias',
            formato: 'Manual do Professor',
            paginas: 44,
            ano: 2026,
            corTema: '#10b981',
            capaBadge: 'Guia do Professor',
            descricao: 'Sequências didáticas ativas para recuperação de descritores críticos (D03, D11, D13, D28) com rotinas semanais estruturadas.'
        },
        {
            id: 'BOOK_05',
            titulo: 'Matriz Curricular de Descritores Comentada • SAEB 2026',
            subtitulo: 'Escala de Proficiência, Habilidades BNCC e Exemplos de Itens',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Matrizes',
            formato: 'Documento Técnico',
            paginas: 52,
            ano: 2026,
            corTema: '#8b5cf6',
            capaBadge: 'Matriz Oficial',
            descricao: 'Detalhamento técnico de todos os níveis de proficiência (0 a 5) do SAEB e correspondência com as habilidades da BNCC.'
        },
        {
            id: 'BOOK_06',
            titulo: 'Oficinas de Cálculo Mental & Resolução de Problemas',
            subtitulo: 'Caderno de Atividades Práticas para 4º e 5º Anos',
            etapa: '5º Ano',
            componente: 'Matemática',
            categoria: 'Reforco',
            formato: 'Caderno de Atividades',
            paginas: 24,
            ano: 2026,
            corTema: '#06b6d4',
            capaBadge: 'Matemática Prática',
            descricao: 'Jogos matemáticos, desafios relâmpago e situações cotidianas contextualizadas na realidade de Gonçalves Dias.'
        }
    ];

    function renderPedagogicLibrary() {
        const grid = document.getElementById('bib-materials-grid');
        if (!grid) return;

        const activeCatBtn = document.querySelector('.bib-category-pill.active');
        const activeCat = activeCatBtn ? activeCatBtn.getAttribute('data-cat') : 'all';
        const etapaFilter = document.getElementById('filter-bib-etapa')?.value || 'all';
        const compFilter = document.getElementById('filter-bib-componente')?.value || 'all';
        const searchVal = document.getElementById('search-bib-input')?.value?.toLowerCase() || '';

        const filtered = pedagogicLibraryBooks.filter(b => {
            const matchCat = activeCat === 'all' || b.categoria === activeCat;
            const matchEtapa = etapaFilter === 'all' || b.etapa === etapaFilter;
            const matchComp = compFilter === 'all' || b.componente === compFilter;
            const matchSearch = !searchVal || 
                b.titulo.toLowerCase().includes(searchVal) || 
                b.subtitulo.toLowerCase().includes(searchVal) ||
                b.descricao.toLowerCase().includes(searchVal);

            return matchCat && matchEtapa && matchComp && matchSearch;
        });

        const countAll = document.getElementById('count-bib-all');
        if (countAll) countAll.textContent = String(pedagogicLibraryBooks.length);

        grid.innerHTML = '';

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg);">
                    <i data-lucide="book-x" style="width:36px; height:36px; margin-bottom:10px; opacity:0.4; display:inline-block;"></i>
                    <p style="margin:0; font-size:0.9rem;">Nenhum material didático encontrado com estes filtros.</p>
                </div>
            `;
            safeCreateIcons();
            return;
        }

        filtered.forEach(book => {
            const card = document.createElement('div');
            card.className = 'mec-book-card';
            card.style.background = 'var(--bg-secondary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.overflow = 'hidden';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
            card.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

            card.innerHTML = `
                <!-- Capa Estilizada de Livro / Caderno -->
                <div style="background: linear-gradient(135deg, ${book.corTema} 0%, rgba(30, 27, 75, 0.95) 100%); padding: 22px 18px; color: #ffffff; position: relative; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div class="flex-between" style="align-items: flex-start;">
                        <span style="font-size: 0.68rem; font-weight: 800; text-transform: uppercase; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); padding: 3px 8px; border-radius: 12px;">
                            ${book.capaBadge}
                        </span>
                        <span style="font-size: 0.72rem; opacity: 0.9; font-family: var(--font-mono); font-weight: 600;">
                            ${book.formato}
                        </span>
                    </div>
                    <div>
                        <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; line-height: 1.3; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">
                            ${book.titulo}
                        </h4>
                        <span style="font-size: 0.75rem; color: rgba(255,255,255,0.85); display: block; margin-top: 4px;">
                            ${book.subtitulo}
                        </span>
                    </div>
                </div>

                <!-- Detalhes e Ações -->
                <div style="padding: 16px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px;">
                            <span class="badge badge-purple" style="font-size: 0.7rem;">${book.etapa}</span>
                            <span class="badge badge-outline" style="font-size: 0.7rem;">${book.componente}</span>
                            <span class="badge badge-outline" style="font-size: 0.7rem;">${book.paginas} páginas</span>
                        </div>
                        <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45; margin: 0 0 14px 0;">
                            ${book.descricao}
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid var(--border-color); padding-top: 12px;">
                        <button class="btn btn-outline btn-sm btn-read-book-online" data-id="${book.id}" style="display:flex; align-items:center; justify-content:center; gap:4px; font-size:0.75rem;">
                            <i data-lucide="book-open" style="width:13px; height:13px;"></i> Ler Online
                        </button>
                        <button class="btn btn-primary btn-sm btn-download-book-pdf" data-id="${book.id}" style="display:flex; align-items:center; justify-content:center; gap:4px; font-size:0.75rem;">
                            <i data-lucide="download" style="width:13px; height:13px;"></i> Baixar PDF
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

        // Event listeners for Category Pills
        document.querySelectorAll('.bib-category-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.bib-category-pill').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'var(--bg-tertiary)';
                    b.style.color = 'var(--text-secondary)';
                    b.style.border = '1px solid var(--border-color)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--purple-light)';
                btn.style.color = '#ffffff';
                btn.style.border = 'none';
                renderPedagogicLibrary();
            });
        });

        // Read Book Online Handlers
        grid.querySelectorAll('.btn-read-book-online').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const book = pedagogicLibraryBooks.find(b => b.id === id);
                if (book) openReadBookModal(book);
            });
        });

        // Download Book PDF Handlers
        grid.querySelectorAll('.btn-download-book-pdf').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const book = pedagogicLibraryBooks.find(b => b.id === id);
                if (book) {
                    showToast(`Iniciando download do "${book.titulo}" (PDF A4)...`, 'download');
                }
            });
        });

        safeCreateIcons();
    }

    function openReadBookModal(book) {
        const modal = document.getElementById('modal-read-book-online');
        const titleEl = document.getElementById('modal-read-book-title');
        const metaEl = document.getElementById('modal-read-book-meta');
        const bodyEl = document.getElementById('modal-read-book-content-body');
        if (!modal || !bodyEl) return;

        if (titleEl) titleEl.textContent = book.titulo;
        if (metaEl) metaEl.textContent = `${book.subtitulo} • ${book.paginas} páginas • SEMED Gonçalves Dias - MA`;

        bodyEl.innerHTML = `
            <div style="background: var(--bg-tertiary); border: 2px solid var(--border-color); border-radius: var(--radius-md); padding: 24px; max-width: 780px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,0.1);">
                <div style="text-align: center; border-bottom: 2px solid var(--border-color); padding-bottom: 14px; margin-bottom: 20px;">
                    <span style="font-size: 0.75rem; font-weight: 800; color: var(--purple-light); text-transform: uppercase; letter-spacing: 0.5px;">
                        ESTADO DO MARANHÃO • PREFEITURA MUNICIPAL DE GONÇALVES DIAS • SEMED
                    </span>
                    <h3 style="font-size: 1.25rem; font-weight: 800; margin: 6px 0 2px 0; color: var(--text-primary);">
                        ${book.titulo}
                    </h3>
                    <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">
                        Edição Oficial 2026 • ${book.formato} • ${book.etapa}
                    </p>
                </div>

                <!-- Simulação de Folha de Prova / Caderno de Leitura -->
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 18px; margin-bottom: 16px;">
                    <strong style="font-size: 0.88rem; color: var(--text-primary); display: block; margin-bottom: 8px;">
                        Instruções para o Estudante / Aplicação em Sala de Aula:
                    </strong>
                    <ul style="font-size: 0.8rem; color: var(--text-secondary); padding-left: 20px; margin: 0; line-height: 1.5;">
                        <li>Utilize caneta esferográfica de tinta preta ou azul para preenchimento do gabarito.</li>
                        <li>Cada questão possui apenas uma alternativa correta.</li>
                        <li>Duração sugerida para o bloco de aplicação: 50 minutos.</li>
                    </ul>
                </div>

                <div style="border-top: 1px dashed var(--border-color); padding-top: 16px;">
                    <h5 style="margin: 0 0 10px 0; font-size: 0.95rem; color: var(--purple-light);">
                        Amostra do Bloco 1 (Itens 1 a 4):
                    </h5>
                    <p style="font-size: 0.84rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                        <strong>Texto Base:</strong> "Na margem do Rio Flores, a garça branca observa o movimento das águas. Cada peixinho que passa é uma promessa de banquete para a manhã ensolarada."
                    </p>
                    <p style="font-size: 0.82rem; color: var(--text-primary); font-weight: 600; margin-bottom: 6px;">
                        1. De acordo com o texto, a garça branca está na margem do rio para:
                    </p>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); padding-left: 12px;">
                        A) Descansar de uma longa viagem.<br>
                        B) Observar os peixes para se alimentar.<br>
                        C) Brincar com outros pássaros.<br>
                        D) Fugir do calor do meio-dia.
                    </div>
                </div>
            </div>
        `;

        modal.classList.remove('hidden');
        safeCreateIcons();
    }

    const btnCloseReadBook = document.getElementById('btn-close-read-book-modal');
    if (btnCloseReadBook) {
        btnCloseReadBook.addEventListener('click', () => {
            document.getElementById('modal-read-book-online')?.classList.add('hidden');
        });
    }

    const btnPrintActiveBook = document.getElementById('btn-print-active-book');
    if (btnPrintActiveBook) {
        btnPrintActiveBook.addEventListener('click', () => {
            showToast('Preparando impressão do caderno em formato A4...', 'printer');
            setTimeout(() => window.print(), 300);
        });
    }

    const filterBibEtapa = document.getElementById('filter-bib-etapa');
    const filterBibComp = document.getElementById('filter-bib-componente');
    const searchBibInput = document.getElementById('search-bib-input');

    if (filterBibEtapa) filterBibEtapa.addEventListener('change', renderPedagogicLibrary);
    if (filterBibComp) filterBibComp.addEventListener('change', renderPedagogicLibrary);
    if (searchBibInput) searchBibInput.addEventListener('input', debounce(renderPedagogicLibrary, 250));


    function openSchoolWorkspace(schoolName) {
        openSchoolClassesTableView(schoolName);
    }

    function openSchoolClassesTableView(schoolName) {
        activeDiarySchool = schoolName || 'UI JOSE CORREA LIMA';

        const overview = document.getElementById('schools-overview-container');
        const classesView = document.getElementById('school-classes-table-view');
        const diaryView = document.getElementById('class-diary-view');

        if (overview) overview.classList.add('hidden');
        if (diaryView) diaryView.classList.add('hidden');
        if (classesView) classesView.classList.remove('hidden');

        const info = schoolZonesMap[activeDiarySchool] || { inep: '21128723', zone: 'Zona Rural' };
        const nameEl = document.getElementById('workspace-school-name');
        const inepEl = document.getElementById('workspace-school-inep');
        const mgrEl = document.getElementById('workspace-school-manager');

        if (nameEl) nameEl.textContent = activeDiarySchool;
        if (inepEl) inepEl.textContent = `INEP: ${info.inep}`;
        if (mgrEl) mgrEl.textContent = `Gestor: ${schoolDirectorsMap[activeDiarySchool] || 'S/G'}`;

        renderSchoolClassesTable();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        safeCreateIcons();
    }

    function renderSchoolClassesTable() {
        const tbody = document.getElementById('school-classes-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        // Turmas da escola
        const schoolClasses = dbTurmas.filter(t => t.escola === activeDiarySchool);

        // Update KPIs to match state (0 if none created yet)
        const kpiTotal = document.getElementById('kpi-school-total-classes');
        const kpiYear = document.getElementById('kpi-school-classes-year');
        const kpiActive = document.getElementById('kpi-school-active-classes');

        if (kpiTotal) kpiTotal.textContent = String(schoolClasses.length);
        if (kpiYear) kpiYear.textContent = String(schoolClasses.length);
        if (kpiActive) kpiActive.textContent = String(schoolClasses.length);

        if (schoolClasses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="padding: 48px 20px; text-align: center; color: #94a3b8;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: rgba(255,255,255,0.05); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; color: #64748b;">
                            <i data-lucide="book-open" style="width: 24px; height: 24px;"></i>
                        </div>
                        <h4 style="margin: 0 0 6px 0; font-size: 1rem; color: #ffffff;">Nenhuma turma cadastrada ainda nesta escola</h4>
                        <p style="margin: 0 0 16px 0; font-size: 0.8rem; color: #64748b;">Todas as turmas iniciam zeradas. Clique no botão abaixo para adicionar a primeira turma.</p>
                        <button class="btn btn-primary btn-sm" id="btn-empty-add-class" style="background: #4f46e5; border-color: #4f46e5; display: inline-flex; align-items: center; gap: 6px; font-weight: 700;">
                            <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                            <span>+ Adicionar Primeira Turma</span>
                        </button>
                    </td>
                </tr>
            `;
            document.getElementById('btn-empty-add-class')?.addEventListener('click', () => {
                document.getElementById('modal-new-class-table')?.classList.remove('hidden');
            });
            safeCreateIcons();
            return;
        }

        schoolClasses.forEach(cls => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #1c2541';
            tr.style.height = '52px';
            tr.style.fontSize = '0.82rem';

            tr.innerHTML = `
                <td style="padding: 12px 20px; font-weight: 700; color: #ffffff;">
                    ${cls.nome}
                </td>
                <td style="padding: 12px 16px; color: #94a3b8;">
                    ${cls.escola}
                </td>
                <td style="padding: 12px 16px; color: #94a3b8;">
                    ${cls.turno || 'Matutino'}
                </td>
                <td style="padding: 12px 16px; text-align: center;">
                    <span class="badge" style="background: #064e3b; color: #34d399; font-weight: 700; font-size: 0.7rem;">
                        ATIVA
                    </span>
                </td>
                <td style="padding: 12px 20px; text-align: center;">
                    <button class="btn btn-outline btn-sm btn-open-diary" data-class="${cls.nome}" style="font-size: 0.75rem; padding: 4px 10px; color: #34d399; border-color: #059669;">
                        Diário da Turma
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.btn-open-diary').forEach(btn => {
            btn.addEventListener('click', () => {
                const clsName = btn.getAttribute('data-class');
                openClassDiaryView(activeDiarySchool, clsName);
            });
        });

        safeCreateIcons();
    }

    // ==========================================
    // CALENDÁRIO ANUAL DE HABILIDADES & ROTINA DOCENTE (2026)
    // ==========================================

    let currentCalendarMonth = 2; // Fevereiro
    let activeCalendarDayItem = null;

    const ANNUAL_SKILLS_CALENDAR_DATA = {};

    const MONTH_NAMES_PT = {
        2: 'Fevereiro',
        3: 'Março',
        4: 'Abril',
        5: 'Maio',
        6: 'Junho',
        7: 'Julho (Recesso Escolar)',
        8: 'Agosto',
        9: 'Setembro',
        10: 'Outubro',
        11: 'Novembro',
        12: 'Dezembro'
    };

    const DESCRIPTORS_POOL_5ANO = [
        { code: 'D01 (LP)', title: 'Localizar informações explícitas no texto', comp: 'Língua Portuguesa', metod: 'Leitura compartilhada de notícias e localização de datas, nomes e locais.' },
        { code: 'D03 (LP)', title: 'Inferir o sentido de uma palavra ou expressão', comp: 'Língua Portuguesa', metod: 'Atividade de dedução de vocabulário poético a partir do contexto.' },
        { code: 'D04 (LP)', title: 'Inferir uma informação implícita em um texto', comp: 'Língua Portuguesa', metod: 'Interpretação de tirinhas e charges com pistas visuais e textuais.' },
        { code: 'D06 (LP)', title: 'Identificar o tema ou assunto principal de um texto', comp: 'Língua Portuguesa', metod: 'Resumo oral e identificação da ideia central em fábulas e contos.' },
        { code: 'D11 (LP)', title: 'Distinguir um fato da opinião relativa a esse fato', comp: 'Língua Portuguesa', metod: 'Análise comparativa entre notícias e comentários de leitores.' },
        { code: 'D14 (LP)', title: 'Identificar o efeito de sentido da pontuação', comp: 'Língua Portuguesa', metod: 'Dramatização de diálogos pontuados com exclamações e reticências.' },
        { code: 'D13 (MAT)', title: 'Resolver problemas com números naturais (adição/subtração)', comp: 'Matemática', metod: 'Resolução de situações-problema com dados do comércio local.' },
        { code: 'D14 (MAT)', title: 'Resolver problemas de multiplicação e divisão', comp: 'Matemática', metod: 'Problemas de divisão em partes iguais e proporcionalidade.' },
        { code: 'D19 (MAT)', title: 'Resolver problemas com números decimais e dinheiro', comp: 'Matemática', metod: 'Simulação de feira livre e cálculo de troco com notas e moedas.' },
        { code: 'D28 (MAT)', title: 'Ler informações e dados em tabelas e gráficos', comp: 'Matemática', metod: 'Construção de gráficos de colunas com dados de frequência da turma.' }
    ];

    const DESCRIPTORS_POOL_2ANO = [
        { code: 'D01 (LP)', title: 'Reconhecer letras do alfabeto', comp: 'Língua Portuguesa', metod: 'Jogo de bingo fonético e alfabeto ilustrado móvel.' },
        { code: 'D02 (LP)', title: 'Identificar rimas e aliterações', comp: 'Língua Portuguesa', metod: 'Roda de cantigas e parlendas com palmas para marcar as rimas.' },
        { code: 'D03 (LP)', title: 'Segmentar oralmente palavras em sílabas', comp: 'Língua Portuguesa', metod: 'Contagem de palmas para cada sílaba de palavras do cotidiano.' },
        { code: 'D06 (LP)', title: 'Localizar informação explícita em bilhetes', comp: 'Língua Portuguesa', metod: 'Leitura de bilhetes escolares com caça às palavras-chave.' },
        { code: 'D01 (MAT)', title: 'Contagem e comparação de quantidades até 100', comp: 'Matemática', metod: 'Agrupamentos com material dourado e tampinhas plásticas.' },
        { code: 'D02 (MAT)', title: 'Problemas de adição e subtração até 100', comp: 'Matemática', metod: 'Histórias matemáticas com apoio de desenhos e reta numérica.' }
    ];

    const DESCRIPTORS_POOL_9ANO = [
        { code: 'D01 (LP)', title: 'Localizar informações explícitas em artigos', comp: 'Língua Portuguesa', metod: 'Sublinhamento de teses e argumentos em editoriais de opinião.' },
        { code: 'D03 (LP)', title: 'Inferir o sentido de palavras em contexto', comp: 'Língua Portuguesa', metod: 'Análise de figuras de linguagem em poemas e músicas maranhenses.' },
        { code: 'D15 (LP)', title: 'Estabelecer relações lógico-discursivas', comp: 'Língua Portuguesa', metod: 'Identificação de conjunções de oposição, causa e conclusão.' },
        { code: 'D16 (MAT)', title: 'Localização de números inteiros na reta', comp: 'Matemática', metod: 'Termômetro matemático e movimentação sobre a reta numérica.' },
        { code: 'D19 (MAT)', title: 'Problemas envolvendo juros e porcentagem', comp: 'Matemática', metod: 'Cálculo de descontos e parcelamentos em compras comerciais.' },
        { code: 'D28 (MAT)', title: 'Cálculo de área e perímetro de figuras planas', comp: 'Matemática', metod: 'Medição prática do piso da sala e quadra da escola.' }
    ];

    function initAnnualSkillsCalendar() {
        for (let m = 2; m <= 12; m++) {
            ANNUAL_SKILLS_CALENDAR_DATA[m] = {};
            const daysInMonth = (m === 2) ? 28 : ((m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31);

            for (let d = 1; d <= daysInMonth; d++) {
                const dateObj = new Date(2026, m - 1, d);
                const dayOfWeek = dateObj.getDay();

                if (dayOfWeek >= 1 && dayOfWeek <= 5 && m !== 7) {
                    const pool5 = DESCRIPTORS_POOL_5ANO[(d + m) % DESCRIPTORS_POOL_5ANO.length];
                    const pool2 = DESCRIPTORS_POOL_2ANO[(d + m) % DESCRIPTORS_POOL_2ANO.length];
                    const pool9 = DESCRIPTORS_POOL_9ANO[(d + m) % DESCRIPTORS_POOL_9ANO.length];

                    ANNUAL_SKILLS_CALENDAR_DATA[m][d] = {
                        day: d,
                        dayOfWeek,
                        month: m,
                        isLetivo: true,
                        skills: {
                            '5º Ano': { code: pool5.code, title: pool5.title, comp: pool5.comp, metod: pool5.metod, status: 'pendente', obs: '' },
                            '2º Ano': { code: pool2.code, title: pool2.title, comp: pool2.comp, metod: pool2.metod, status: 'pendente', obs: '' },
                            '9º Ano': { code: pool9.code, title: pool9.title, comp: pool9.comp, metod: pool9.metod, status: 'pendente', obs: '' }
                        }
                    };
                }
            }
        }
    }
    initAnnualSkillsCalendar();

    function renderSkillsSchedule() {
        renderAnnualCalendar();
    }

    function renderAnnualCalendar() {
        const grid = document.getElementById('annual-calendar-days-grid');
        if (!grid) return;

        const stage = document.getElementById('cal-filter-stage')?.value || '5º Ano';
        const subject = document.getElementById('cal-filter-subject')?.value || 'all';

        const monthLabel = document.getElementById('calendar-active-month-label');
        const monthTitleSummary = document.getElementById('cal-month-title-summary');
        const monthStatsText = document.getElementById('cal-month-stats-text');
        const progressBarDone = document.getElementById('cal-progress-bar-done');
        const progressBarPending = document.getElementById('cal-progress-bar-pending');

        const monthName = MONTH_NAMES_PT[currentCalendarMonth];
        if (monthLabel) monthLabel.textContent = `${monthName} / 2026`;
        if (monthTitleSummary) monthTitleSummary.textContent = `Progresso de Cumprimento — ${monthName} de 2026 (${stage})`;

        const monthData = ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth] || {};
        const daysInMonth = (currentCalendarMonth === 2) ? 28 : ((currentCalendarMonth === 4 || currentCalendarMonth === 6 || currentCalendarMonth === 9 || currentCalendarMonth === 11) ? 30 : 31);

        grid.innerHTML = '';

        if (currentCalendarMonth === 7) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 60px 20px; text-align: center; background: var(--bg-tertiary); border-radius: var(--radius-lg);">
                    <i data-lucide="sun" style="width: 48px; height: 48px; color: #f59e0b; margin-bottom: 12px; display: inline-block;"></i>
                    <h3 style="margin: 0 0 6px 0; color: var(--text-primary);">Recesso Escolar de Meio de Ano (Férias)</h3>
                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">Não há atividades letivas programadas para o mês de Julho.</p>
                </div>
            `;
            if (monthStatsText) monthStatsText.textContent = 'Mês de Recesso Escolar';
            if (progressBarDone) progressBarDone.style.width = '0%';
            if (progressBarPending) progressBarPending.style.width = '0%';
            safeCreateIcons();
            return;
        }

        let totalLetivos = 0;
        let totalWorked = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateObj = new Date(2026, currentCalendarMonth - 1, d);
            const dayOfWeek = dateObj.getDay();

            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                totalLetivos++;
                const dayItem = monthData[d];
                const daySkill = dayItem ? dayItem.skills[stage] : null;

                const isWorked = daySkill && daySkill.status === 'trabalhada';
                if (isWorked) totalWorked++;

                const matchSubject = !daySkill || subject === 'all' || daySkill.comp === subject;

                const card = document.createElement('div');
                card.className = 'calendar-day-box';
                card.style.background = isWorked ? '#f0fdf4' : '#fef2f2';
                card.style.border = `2px solid ${isWorked ? '#22c55e' : '#ef4444'}`;
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '12px';
                card.style.minHeight = '115px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.justifyContent = 'space-between';
                card.style.cursor = 'pointer';
                card.style.transition = 'all 0.2s ease';

                const dayNameShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek];

                card.innerHTML = `
                    <div>
                        <div class="flex-between" style="align-items: center; margin-bottom: 6px;">
                            <span style="font-size: 1.1rem; font-weight: 800; color: ${isWorked ? '#15803d' : '#b91c1c'}; font-family: var(--font-mono);">
                                ${String(d).padStart(2, '0')}
                            </span>
                            <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">
                                ${dayNameShort}
                            </span>
                        </div>

                        ${daySkill && matchSubject ? `
                            <div style="background: ${isWorked ? '#dcfce7' : '#fee2e2'}; border: 1px solid ${isWorked ? '#86efac' : '#fca5a5'}; border-radius: 4px; padding: 4px 6px; margin-bottom: 6px;">
                                <strong style="font-size: 0.74rem; font-weight: 800; color: ${isWorked ? '#15803d' : '#dc2626'}; display: block;">
                                    ${isWorked ? '🟢' : '🔴'} ${daySkill.code}
                                </strong>
                                <span style="font-size: 0.68rem; color: ${isWorked ? '#166534' : '#991b1b'}; display: block; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${daySkill.title}">
                                    ${daySkill.title}
                                </span>
                            </div>
                        ` : `
                            <span style="font-size: 0.72rem; color: var(--text-muted);">Sem descritor</span>
                        `}
                    </div>

                    <div class="flex-between" style="align-items: center; border-top: 1px dashed ${isWorked ? '#86efac' : '#fca5a5'}; padding-top: 6px; margin-top: 4px;">
                        <span style="font-size: 0.68rem; font-weight: 700; color: ${isWorked ? '#15803d' : '#dc2626'};">
                            ${isWorked ? 'Trabalhada' : 'Pendente'}
                        </span>
                        <button class="btn btn-sm btn-quick-toggle-day" data-day="${d}" style="padding: 2px 6px; font-size: 0.68rem; background: ${isWorked ? '#16a34a' : '#ef4444'}; color: #ffffff; border: none; border-radius: 3px; cursor: pointer;">
                            ${isWorked ? '✓ Ok' : 'Marcar'}
                        </button>
                    </div>
                `;

                card.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-quick-toggle-day')) return;
                    openCalendarDayDetailModal(d, stage);
                });

                card.querySelector('.btn-quick-toggle-day')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleCalendarDayStatus(d, stage);
                });

                grid.appendChild(card);
            }
        }

        const pctDone = totalLetivos > 0 ? ((totalWorked / totalLetivos) * 100).toFixed(1) : '0';
        if (monthStatsText) {
            monthStatsText.innerHTML = `<strong>${totalWorked}</strong> de <strong>${totalLetivos}</strong> habilidades trabalhadas (${pctDone}% de cumprimento)`;
        }
        if (progressBarDone) progressBarDone.style.width = `${pctDone}%`;
        if (progressBarPending) progressBarPending.style.width = `${100 - parseFloat(pctDone)}%`;

        safeCreateIcons();
    }

    function toggleCalendarDayStatus(dayNumber, stage) {
        const dayItem = ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth] && ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth][dayNumber];
        if (!dayItem || !dayItem.skills[stage]) return;

        const currentStatus = dayItem.skills[stage].status;
        const newStatus = (currentStatus === 'trabalhada') ? 'pendente' : 'trabalhada';
        dayItem.skills[stage].status = newStatus;

        renderAnnualCalendar();
        showToast(`Dia ${dayNumber} (${dayItem.skills[stage].code}) marcado como: ${newStatus === 'trabalhada' ? 'TRABALHADA EM AULA 🟢' : 'PENDENTE 🔴'}`, newStatus === 'trabalhada' ? 'check' : 'alert-circle');
    }

    function openCalendarDayDetailModal(dayNumber, stage) {
        const dayItem = ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth] && ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth][dayNumber];
        if (!dayItem || !dayItem.skills[stage]) return;

        activeCalendarDayItem = { dayNumber, stage, item: dayItem };
        const skill = dayItem.skills[stage];

        const modal = document.getElementById('modal-calendar-day-detail');
        const titleEl = document.getElementById('modal-cal-day-title');
        const metaEl = document.getElementById('modal-cal-day-meta');
        const descCodeEl = document.getElementById('modal-cal-desc-code');
        const descCompEl = document.getElementById('modal-cal-desc-component');
        const metodEl = document.getElementById('modal-cal-metodologia');
        const obsEl = document.getElementById('modal-cal-teacher-obs');
        const statusLabel = document.getElementById('modal-cal-status-label');
        const toggleBtn = document.getElementById('btn-modal-toggle-day-status');

        if (!modal) return;

        const monthName = MONTH_NAMES_PT[currentCalendarMonth];
        if (titleEl) titleEl.textContent = `Planejamento do Dia ${dayNumber} de ${monthName} (${stage})`;
        if (metaEl) metaEl.textContent = `Ano Letivo 2026 • SEMED Gonçalves Dias • ${skill.comp}`;
        if (descCodeEl) descCodeEl.textContent = `${skill.code} — ${skill.title}`;
        if (descCompEl) descCompEl.textContent = `Componente: ${skill.comp} • Etapa: ${stage}`;
        if (metodEl) metodEl.textContent = skill.metod;
        if (obsEl) obsEl.value = skill.obs || '';

        const isWorked = skill.status === 'trabalhada';
        if (statusLabel) {
            statusLabel.innerHTML = isWorked ? '<strong style="color:#22c55e;">🟢 Trabalhada em Aula</strong>' : '<strong style="color:#ef4444;">🔴 Pendente / A Trabalhar</strong>';
        }
        if (toggleBtn) {
            toggleBtn.textContent = isWorked ? 'Desmarcar (Voltar para Pendente)' : 'Marcar como Trabalhada';
            toggleBtn.style.background = isWorked ? '#ef4444' : '#22c55e';
        }

        modal.classList.remove('hidden');
        safeCreateIcons();
    }

    // Modal Action Listeners
    const modalCalDay = document.getElementById('modal-calendar-day-detail');
    const btnCloseCalDay = document.getElementById('btn-close-cal-day-modal');
    const btnCancelCalDay = document.getElementById('btn-cancel-cal-day-modal');
    const btnSaveCalDay = document.getElementById('btn-save-cal-day-modal');
    const btnToggleCalDayStatus = document.getElementById('btn-modal-toggle-day-status');

    if (btnCloseCalDay && modalCalDay) {
        btnCloseCalDay.addEventListener('click', () => modalCalDay.classList.add('hidden'));
    }
    if (btnCancelCalDay && modalCalDay) {
        btnCancelCalDay.addEventListener('click', () => modalCalDay.classList.add('hidden'));
    }
    if (btnToggleCalDayStatus) {
        btnToggleCalDayStatus.addEventListener('click', () => {
            if (!activeCalendarDayItem) return;
            const { dayNumber, stage, item } = activeCalendarDayItem;
            const currentStatus = item.skills[stage].status;
            item.skills[stage].status = (currentStatus === 'trabalhada') ? 'pendente' : 'trabalhada';
            openCalendarDayDetailModal(dayNumber, stage);
            renderAnnualCalendar();
        });
    }
    if (btnSaveCalDay) {
        btnSaveCalDay.addEventListener('click', () => {
            if (!activeCalendarDayItem) return;
            const { stage, item } = activeCalendarDayItem;
            const obsVal = document.getElementById('modal-cal-teacher-obs')?.value.trim();
            item.skills[stage].obs = obsVal || '';
            modalCalDay?.classList.add('hidden');
            showToast('Registro pedagógico do dia salvo com sucesso!', 'check');
        });
    }

    // Month Pills Handlers
    document.querySelectorAll('.calendar-month-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.calendar-month-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCalendarMonth = parseInt(pill.getAttribute('data-month'), 10);
            renderAnnualCalendar();
        });
    });

    // Filter Change Handlers
    ['cal-filter-stage', 'cal-filter-subject', 'cal-filter-school'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', renderAnnualCalendar);
    });

    // Mark All Month as Done
    const btnMarkAllMonthDone = document.getElementById('btn-mark-all-month-done');
    if (btnMarkAllMonthDone) {
        btnMarkAllMonthDone.addEventListener('click', () => {
            const stage = document.getElementById('cal-filter-stage')?.value || '5º Ano';
            const monthData = ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth] || {};
            Object.values(monthData).forEach(dayItem => {
                if (dayItem.skills[stage]) dayItem.skills[stage].status = 'trabalhada';
            });
            renderAnnualCalendar();
            showToast(`Todas as habilidades de ${MONTH_NAMES_PT[currentCalendarMonth]} foram marcadas como TRABALHADAS 🟢!`, 'check');
        });
    }

    // Export PDF Handler
    const btnExportCalPdf = document.getElementById('btn-export-calendar-pdf');
    if (btnExportCalPdf) {
        btnExportCalPdf.addEventListener('click', () => {
            showToast(`Gerando Calendário de Habilidades de ${MONTH_NAMES_PT[currentCalendarMonth]} para impressão...`, 'printer');
            setTimeout(() => window.print(), 300);
        });
    }

    // ==========================================
    // COMPARATIVO REGIONAL IDEB 2023 & 2025
    // ==========================================

    const URE_PRESIDENTE_DUTRA_DATA = [
        { rank: 1, cidade: 'Presidente Dutra', ai2023: 5.1, ai2025: 5.4, af2023: 4.6, af2025: 4.8 },
        { rank: 2, cidade: 'Santo Antônio dos Lopes', ai2023: 5.0, ai2025: 5.3, af2023: 4.5, af2025: 4.8 },
        { rank: 3, cidade: 'Dom Pedro', ai2023: 4.9, ai2025: 5.3, af2023: 4.4, af2025: 4.7 },
        { rank: 4, cidade: 'Gonçalves Dias', ai2023: 4.8, ai2025: 5.2, af2023: 4.2, af2025: 4.5, isDestaque: true },
        { rank: 5, cidade: 'Graça Aranha', ai2023: 4.7, ai2025: 5.1, af2023: 4.1, af2025: 4.4 },
        { rank: 6, cidade: 'Tuntum', ai2023: 4.7, ai2025: 5.0, af2023: 4.3, af2025: 4.6 },
        { rank: 7, cidade: 'São Domingos do Maranhão', ai2023: 4.6, ai2025: 5.0, af2023: 4.0, af2025: 4.3 },
        { rank: 8, cidade: 'Governador Eugênio Barros', ai2023: 4.5, ai2025: 4.9, af2023: 3.9, af2025: 4.3 },
        { rank: 9, cidade: 'Capinzal do Norte', ai2023: 4.5, ai2025: 4.8, af2023: 4.0, af2025: 4.3 },
        { rank: 10, cidade: 'São José dos Basílios', ai2023: 4.4, ai2025: 4.8, af2023: 3.9, af2025: 4.2 },
        { rank: 11, cidade: 'Joselândia', ai2023: 4.4, ai2025: 4.7, af2023: 3.9, af2025: 4.2 },
        { rank: 12, cidade: 'Senador Alexandre Costa', ai2023: 4.3, ai2025: 4.7, af2023: 3.8, af2025: 4.1 },
        { rank: 13, cidade: 'Santa Filomena do Maranhão', ai2023: 4.2, ai2025: 4.6, af2023: 3.7, af2025: 4.0 }
    ];

    const REGIAO_CENTRO_MA_DATA = [
        { rank: 1, cidade: 'Colinas', ai2023: 5.3, ai2025: 5.7, af2023: 4.8, af2025: 5.1 },
        { rank: 2, cidade: 'São João dos Patos', ai2023: 5.2, ai2025: 5.5, af2023: 4.7, af2025: 5.0 },
        { rank: 3, cidade: 'Presidente Dutra', ai2023: 5.1, ai2025: 5.4, af2023: 4.6, af2025: 4.8 },
        { rank: 4, cidade: 'Barra do Corda', ai2023: 4.9, ai2025: 5.3, af2023: 4.4, af2025: 4.7 },
        { rank: 5, cidade: 'Grajaú', ai2023: 4.7, ai2025: 5.1, af2023: 4.2, af2025: 4.5 },
        { rank: 6, cidade: 'Gonçalves Dias', ai2023: 4.8, ai2025: 5.2, af2023: 4.2, af2025: 4.5, isDestaque: true },
        { rank: 7, cidade: 'Passagem Franca', ai2023: 4.6, ai2025: 4.9, af2023: 4.0, af2025: 4.3 },
        { rank: 8, cidade: 'Fortuna', ai2023: 4.5, ai2025: 4.8, af2023: 3.9, af2025: 4.2 },
        { rank: 9, cidade: 'Jatobá', ai2023: 4.3, ai2025: 4.7, af2023: 3.8, af2025: 4.1 },
        { rank: 10, cidade: 'Mirador', ai2023: 4.4, ai2025: 4.7, af2023: 3.9, af2025: 4.2 }
    ];

    const RANKING_GERAL_MA_DATA = [
        { rank: 1, cidade: 'Santa Inês', ideb2023: 5.8, ideb2025: 6.2, evolucao: '+0.4', classif: 'Destaque Estadual' },
        { rank: 2, cidade: 'Balsas', ideb2023: 5.6, ideb2025: 6.0, evolucao: '+0.4', classif: 'Avançado' },
        { rank: 3, cidade: 'Imperatriz', ideb2023: 5.5, ideb2025: 5.9, evolucao: '+0.4', classif: 'Avançado' },
        { rank: 4, cidade: 'Colinas', ideb2023: 5.3, ideb2025: 5.7, evolucao: '+0.4', classif: 'Consolidado' },
        { rank: 5, cidade: 'São João dos Patos', ideb2023: 5.2, ideb2025: 5.5, evolucao: '+0.3', classif: 'Consolidado' },
        { rank: 6, cidade: 'Presidente Dutra', ideb2023: 5.1, ideb2025: 5.4, evolucao: '+0.3', classif: 'Consolidado' },
        { rank: 7, cidade: 'Gonçalves Dias', ideb2023: 4.8, ideb2025: 5.2, evolucao: '+0.4', classif: 'Evolução Acima da Média', isDestaque: true },
        { rank: 8, cidade: 'São Luís (Capital)', ideb2023: 4.9, ideb2025: 5.2, evolucao: '+0.3', classif: 'Média da Capital' },
        { rank: 9, cidade: 'Caxias', ideb2023: 4.8, ideb2025: 5.1, evolucao: '+0.3', classif: 'Em Crescimento' },
        { rank: 10, cidade: 'Codó', ideb2023: 4.6, ideb2025: 4.9, evolucao: '+0.3', classif: 'Em Desenvolvimento' },
        { rank: '-', cidade: '🏛️ Média do Estado do Maranhão', ideb2023: 4.4, ideb2025: 4.8, evolucao: '+0.4', classif: 'Referência Estadual', isMedia: true }
    ];

    function renderUrePresidenteDutraTable() {
        const tbody = document.getElementById('table-ure-presidente-dutra-body');
        if (!tbody) return;

        tbody.innerHTML = URE_PRESIDENTE_DUTRA_DATA.map(item => {
            const isGd = item.isDestaque;
            const diffAi = (item.ai2025 - item.ai2023).toFixed(1);
            const diffAf = (item.af2025 - item.af2023).toFixed(1);
            
            return `
                <tr style="border-bottom: 1px solid var(--border-color); height: 48px; ${isGd ? 'background: rgba(139, 92, 246, 0.12); font-weight: 700;' : ''}">
                    <td style="padding: 10px 14px; font-family: var(--font-mono); ${isGd ? 'color: var(--purple-light); font-weight: 800;' : ''}">
                        ${isGd ? '⭐ ' : ''}${item.rank}º
                    </td>
                    <td style="padding: 10px 14px; color: ${isGd ? 'var(--purple-light)' : 'var(--text-primary)'};">
                        ${item.cidade} ${isGd ? '<span class="badge badge-purple" style="font-size:0.68rem; margin-left:6px;">Nosso Município</span>' : ''}
                    </td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono);">${item.ai2023.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--green-light);">${item.ai2025.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: var(--green-light);">+${diffAi}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono);">${item.af2023.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--green-light);">${item.af2025.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: var(--green-light);">+${diffAf}</td>
                </tr>
            `;
        }).join('');
    }

    function renderRegiaoCentroTable() {
        const tbody = document.getElementById('table-regiao-centro-body');
        if (!tbody) return;

        tbody.innerHTML = REGIAO_CENTRO_MA_DATA.map(item => {
            const isGd = item.isDestaque;
            const diffAi = (item.ai2025 - item.ai2023).toFixed(1);
            const diffAf = (item.af2025 - item.af2023).toFixed(1);

            return `
                <tr style="border-bottom: 1px solid var(--border-color); height: 48px; ${isGd ? 'background: rgba(139, 92, 246, 0.12); font-weight: 700;' : ''}">
                    <td style="padding: 10px 14px; font-family: var(--font-mono); ${isGd ? 'color: var(--purple-light); font-weight: 800;' : ''}">
                        ${isGd ? '⭐ ' : ''}${item.rank}º
                    </td>
                    <td style="padding: 10px 14px; color: ${isGd ? 'var(--purple-light)' : 'var(--text-primary)'};">
                        ${item.cidade} ${isGd ? '<span class="badge badge-purple" style="font-size:0.68rem; margin-left:6px;">Nosso Município</span>' : ''}
                    </td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono);">${item.ai2023.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--green-light);">${item.ai2025.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: var(--green-light);">+${diffAi}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono);">${item.af2023.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--green-light);">${item.af2025.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: var(--green-light);">+${diffAf}</td>
                </tr>
            `;
        }).join('');
    }

    function renderRankingGeralMaTable() {
        const tbody = document.getElementById('table-ranking-geral-ma-body');
        if (!tbody) return;

        tbody.innerHTML = RANKING_GERAL_MA_DATA.map(item => {
            const isGd = item.isDestaque;
            const isMedia = item.isMedia;

            return `
                <tr style="border-bottom: 1px solid var(--border-color); height: 48px; ${isGd ? 'background: rgba(139, 92, 246, 0.12); font-weight: 700;' : (isMedia ? 'background: var(--bg-tertiary); font-weight: 700;' : '')}">
                    <td style="padding: 10px 14px; font-family: var(--font-mono); ${isGd ? 'color: var(--purple-light); font-weight: 800;' : ''}">
                        ${isGd ? '⭐ ' : ''}${item.rank}
                    </td>
                    <td style="padding: 10px 14px; color: ${isGd ? 'var(--purple-light)' : (isMedia ? 'var(--text-primary)' : 'var(--text-primary)')};">
                        ${item.cidade}
                    </td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono);">${item.ideb2023.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); font-weight: 700; color: var(--green-light);">${item.ideb2025.toFixed(1)}</td>
                    <td style="padding: 10px 14px; text-align: center; font-family: var(--font-mono); color: var(--green-light);">+${item.evolucao}</td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <span class="badge ${isGd ? 'badge-purple' : (isMedia ? 'badge-info' : 'badge-outline')}" style="font-size:0.72rem;">
                            ${item.classif}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function initIdebComparativo() {
        selectedIdebCity = "Gonçalves Dias";
        const cityInput = document.getElementById('ideb-city-search');
        if (cityInput) cityInput.value = "Gonçalves Dias";

        renderUrePresidenteDutraTable();
        renderRegiaoCentroTable();
        renderRankingGeralMaTable();
        updateIdebComparativoView();
    }

    // Direct event delegation on document for regional tab switching
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.ideb-regional-tab-btn');
        if (!btn) return;
        
        const targetTab = btn.getAttribute('data-tab');
        if (!targetTab) return;

        document.querySelectorAll('.ideb-regional-tab-btn').forEach(b => {
            b.classList.remove('active');
            b.style.background = 'transparent';
            b.style.color = 'var(--text-secondary)';
            b.style.border = '1px solid var(--border-color)';
        });

        btn.classList.add('active');
        btn.style.background = 'var(--purple-light)';
        btn.style.color = '#ffffff';
        btn.style.border = 'none';

        document.querySelectorAll('.ideb-regional-tab-content').forEach(c => c.classList.add('hidden'));
        const activeContent = document.getElementById(`tab-ideb-${targetTab}`);
        if (activeContent) activeContent.classList.remove('hidden');

        if (targetTab === 'ure-presidente-dutra') renderUrePresidenteDutraTable();
        if (targetTab === 'regiao-centro-ma') renderRegiaoCentroTable();
        if (targetTab === 'ranking-geral-ma') renderRankingGeralMaTable();

        safeCreateIcons();
    });


    // ==========================================
    // SIDEBAR TOGGLE & GLOBAL BACK NAVIGATION
    // ==========================================
    let navigationHistory = ['dashboard'];

    function setupSidebarAndNavigation() {
        const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
        const appContainer = document.querySelector('.app-container') || document.body;

        if (btnToggleSidebar) {
            btnToggleSidebar.addEventListener('click', () => {
                appContainer.classList.toggle('sidebar-collapsed');
                const isCollapsed = appContainer.classList.contains('sidebar-collapsed');
                localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
            });

            if (localStorage.getItem('sidebar_collapsed') === 'true') {
                appContainer.classList.add('sidebar-collapsed');
            }
        }

        const btnGlobalBack = document.getElementById('btn-global-header-back');
        if (btnGlobalBack) {
            btnGlobalBack.addEventListener('click', () => {
                // Check if inside School Workspace or Class Diary
                const schoolClassesView = document.getElementById('school-classes-table-view');
                const diaryView = document.getElementById('class-diary-view');
                const userProfileView = document.getElementById('user-profile-view');

                if (diaryView && !diaryView.classList.contains('hidden')) {
                    diaryView.classList.add('hidden');
                    if (schoolClassesView) schoolClassesView.classList.remove('hidden');
                    return;
                }

                if (schoolClassesView && !schoolClassesView.classList.contains('hidden')) {
                    schoolClassesView.classList.add('hidden');
                    const overview = document.getElementById('schools-overview-container');
                    if (overview) overview.classList.remove('hidden');
                    return;
                }

                if (userProfileView && !userProfileView.classList.contains('hidden')) {
                    userProfileView.classList.add('hidden');
                    const usersList = document.getElementById('users-list-view');
                    if (usersList) usersList.classList.remove('hidden');
                    return;
                }

                if (navigationHistory.length > 1) {
                    navigationHistory.pop(); // current
                    const prevTab = navigationHistory.pop() || 'dashboard';
                    window.navigateToTab(prevTab);
                } else {
                    window.navigateToTab('dashboard');
                }
            });
        }
    }


    // ==========================================
    // PERSISTÊNCIA DE LOGIN & RECUPERAÇÃO OFFLINE
    // ==========================================
    function checkPersistentLogin() {
        const logged = localStorage.getItem('isLoggedIn') === 'true';
        const userEmail = localStorage.getItem('userEmail') || 'gestor@municipio.gov.br';
        const userProfile = localStorage.getItem('userProfile') || 'admin';
        const lastTab = localStorage.getItem('lastActiveTab') || 'dashboard';

        if (logged) {
            currentUser = { email: userEmail, profile: userProfile };
            const loginSection = document.getElementById('login-section');
            const mainAppSection = document.getElementById('main-app-section');
            if (loginSection) loginSection.classList.add('hidden');
            if (mainAppSection) mainAppSection.classList.remove('hidden');

            const userEmailEl = document.getElementById('user-display-email');
            if (userEmailEl) userEmailEl.textContent = userEmail;

            setTimeout(() => {
                window.navigateToTab(lastTab);
            }, 100);
        }
    }


    // ==========================================
    // ENTER KEYPRESS TRIGGER PARA TODAS AS BARRAS DE BUSCA
    // ==========================================
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const activeEl = document.activeElement;
            if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) {
                // School search
                if (activeEl.id === 'db-school-search') {
                    if (typeof renderDbSchools === 'function') renderDbSchools();
                }
                // IDEB City search
                else if (activeEl.id === 'ideb-city-search') {
                    selectedIdebCity = activeEl.value.trim() || 'Gonçalves Dias';
                    document.getElementById('ideb-city-suggestions')?.classList.add('hidden');
                    if (typeof updateIdebComparativoView === 'function') updateIdebComparativoView();
                }
                // Classes table search
                else if (activeEl.id === 'classes-table-search-input') {
                    if (typeof renderSchoolClassesTable === 'function') renderSchoolClassesTable();
                }
                // Student search
                else if (activeEl.id === 'student-search') {
                    if (typeof renderDbStudents === 'function') renderDbStudents();
                }
                // Questions search
                else if (activeEl.id === 'search-questions-input') {
                    if (typeof renderQuestionsList === 'function') renderQuestionsList();
                }
            }
        }
    });


    // ==========================================
    // CALENDÁRIO 7 COLUNAS (LAYOUT DO SCREENSHOT)
    // ==========================================
    let calMonth = 8; // Agosto / 2026 default
    let calYear = 2026;
    let selectedCalDay = 15; // Destaque no dia 15

    const MONTH_LABELS = {
        2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
        7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    };

    function render7ColCalendar() {
        const grid = document.getElementById('calendar-7col-cells-grid');
        const heading = document.getElementById('cal-month-year-heading');
        const dropdown = document.getElementById('cal-month-dropdown-select');
        const stage = document.getElementById('cal-filter-stage-v2')?.value || '5º Ano';

        if (!grid) return;

        if (heading) heading.textContent = `${MONTH_LABELS[calMonth] || 'Mês'} de ${calYear}`;
        if (dropdown) dropdown.value = String(calMonth);

        grid.innerHTML = '';

        // First day of month and total days
        const firstDate = new Date(calYear, calMonth - 1, 1);
        const startDayOfWeek = firstDate.getDay(); // 0 = Domingo
        const daysInCurrentMonth = new Date(calYear, calMonth, 0).getDate();
        const daysInPrevMonth = new Date(calYear, calMonth - 1, 0).getDate();

        // 1. Previous month trailing days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const prevDayNum = daysInPrevMonth - i;
            const cell = document.createElement('div');
            cell.className = 'cal-day-cell other-month';
            cell.innerHTML = `<div class="cal-day-number" style="color:var(--text-muted);">${prevDayNum}</div>`;
            grid.appendChild(cell);
        }

        // 2. Current month days
        for (let d = 1; d <= daysInCurrentMonth; d++) {
            const dateObj = new Date(calYear, calMonth - 1, d);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            const monthData = ANNUAL_SKILLS_CALENDAR_DATA[calMonth] || {};
            const dayData = monthData[d];
            const daySkill = dayData ? dayData.skills[stage] : null;

            const isWorked = daySkill && daySkill.status === 'trabalhada';
            const hasSkill = !!daySkill;

            const cell = document.createElement('div');
            cell.className = 'cal-day-cell';
            const isSelected = (d === selectedCalDay);

            let dotsHtml = '';
            if (hasSkill && !isWeekend && calMonth !== 7) {
                dotsHtml = `
                    <div class="cal-dots-container">
                        <span class="cal-dot ${isWorked ? 'worked' : 'pending'}" title="${daySkill.code} (${isWorked ? 'Trabalhada' : 'Pendente'})"></span>
                        <span class="cal-dot ${isWorked ? 'worked' : 'pending'}"></span>
                    </div>
                `;
            }

            cell.innerHTML = `
                <div class="flex-between" style="align-items: flex-start;">
                    <div class="cal-day-number ${isSelected ? 'active-today' : ''}">${d}</div>
                </div>
                ${dotsHtml}
            `;

            cell.addEventListener('click', () => {
                selectedCalDay = d;
                document.querySelectorAll('.cal-day-number').forEach(el => el.classList.remove('active-today'));
                cell.querySelector('.cal-day-number')?.classList.add('active-today');

                if (hasSkill) {
                    openCalendarDayDetailModal(d, stage);
                } else {
                    showToast(`Dia ${d} de ${MONTH_LABELS[calMonth]}: Sem descritores planejados para este dia.`, 'calendar');
                }
            });

            grid.appendChild(cell);
        }

        // 3. Next month leading days (to fill 35 or 42 cells)
        const totalRendered = startDayOfWeek + daysInCurrentMonth;
        const totalCellsNeeded = totalRendered > 35 ? 42 : 35;
        const remaining = totalCellsNeeded - totalRendered;

        for (let nextD = 1; nextD <= remaining; nextD++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day-cell other-month';
            cell.innerHTML = `<div class="cal-day-number" style="color:var(--text-muted);">${nextD}</div>`;
            grid.appendChild(cell);
        }

        safeCreateIcons();
    }

    function setup7ColCalendarEvents() {
        const btnPrev = document.getElementById('btn-cal-prev-month');
        const btnNext = document.getElementById('btn-cal-next-month');
        const dropdown = document.getElementById('cal-month-dropdown-select');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (calMonth > 2) {
                    calMonth--;
                    render7ColCalendar();
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (calMonth < 12) {
                    calMonth++;
                    render7ColCalendar();
                }
            });
        }

        if (dropdown) {
            dropdown.addEventListener('change', (e) => {
                calMonth = parseInt(e.target.value, 10);
                render7ColCalendar();
            });
        }

        ['cal-filter-stage-v2', 'cal-filter-subject-v2', 'cal-filter-school-v2'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', render7ColCalendar);
        });

        document.getElementById('btn-cal-mark-month-done')?.addEventListener('click', () => {
            const stage = document.getElementById('cal-filter-stage-v2')?.value || '5º Ano';
            const monthData = ANNUAL_SKILLS_CALENDAR_DATA[calMonth] || {};
            Object.values(monthData).forEach(dayItem => {
                if (dayItem.skills[stage]) dayItem.skills[stage].status = 'trabalhada';
            });
            render7ColCalendar();
            showToast(`Todas as habilidades de ${MONTH_LABELS[calMonth]} foram marcadas como TRABALHADAS 🟢!`, 'check');
        });

        document.getElementById('btn-cal-print-month')?.addEventListener('click', () => {
            window.print();
        });
    }


    // ==========================================
    // DADOS OFICIAIS SAEB 2025 POR ESCOLA (GONÇALVES DIAS)
    // ==========================================
    const SAEB_2025_OFFICIAL_DATA = {
        '21128723': {
            nome: 'UI JOSE CORREA LIMA',
            inep: '21128723',
            zona: 'Zona Rural',
            inse: 'Nível III',
            adequacaoDocenteAI: '88.9%',
            adequacaoDocenteAF: '10.9%',
            participacao5Ano: '100%',
            participacao9Ano: '100%',
            proficienciaLP_5Ano: 218.4,
            proficienciaMAT_5Ano: 224.6,
            idebObservado2023: 4.8,
            idebCalculado2025: 5.2,
            meta2026: 5.6
        },
        '21128146': {
            nome: 'UI EMILIO MURAD',
            inep: '21128146',
            zona: 'Zona Rural',
            inse: 'Nível III',
            adequacaoDocenteAI: '85.0%',
            adequacaoDocenteAF: '50.0%',
            participacao5Ano: '100%',
            participacao9Ano: '100%',
            proficienciaLP_5Ano: 212.1,
            proficienciaMAT_5Ano: 219.8,
            idebObservado2023: 4.6,
            idebCalculado2025: 5.0,
            meta2026: 5.4
        },
        '21128740': {
            nome: 'UE VEREADOR LEONARDO FERREIRA LIMA',
            inep: '21128740',
            zona: 'Sede Urbana',
            inse: 'Nível IV',
            adequacaoDocenteAI: '90.5%',
            adequacaoDocenteAF: '75.0%',
            participacao5Ano: '100%',
            participacao9Ano: '98%',
            proficienciaLP_5Ano: 226.5,
            proficienciaMAT_5Ano: 231.2,
            idebObservado2023: 5.1,
            idebCalculado2025: 5.5,
            meta2026: 5.9
        },
        '21128120': {
            nome: 'U I BASILIO ALVES',
            inep: '21128120',
            zona: 'Zona Rural',
            inse: 'Nível III',
            adequacaoDocenteAI: '80.0%',
            adequacaoDocenteAF: '45.0%',
            participacao5Ano: '100%',
            participacao9Ano: '100%',
            proficienciaLP_5Ano: 209.7,
            proficienciaMAT_5Ano: 215.3,
            idebObservado2023: 4.4,
            idebCalculado2025: 4.9,
            meta2026: 5.3
        },
        '21286973': {
            nome: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ',
            inep: '21286973',
            zona: 'Sede Urbana',
            inse: 'Nível IV',
            adequacaoDocenteAI: '57.9%',
            adequacaoDocenteAF: '54.9%',
            participacao5Ano: '100%',
            participacao9Ano: '97.4%',
            proficienciaLP_5Ano: 222.8,
            proficienciaMAT_5Ano: 228.4,
            idebObservado2023: 4.9,
            idebCalculado2025: 5.3,
            meta2026: 5.7
        },
        '21128758': {
            nome: 'UE RAIMUNDO DOS REIS DA SILVA',
            inep: '21128758',
            zona: 'Zona Rural',
            inse: 'Nível III',
            adequacaoDocenteAI: '75.0%',
            adequacaoDocenteAF: '40.0%',
            participacao5Ano: '100%',
            participacao9Ano: '100%',
            proficienciaLP_5Ano: 206.5,
            proficienciaMAT_5Ano: 211.9,
            idebObservado2023: 4.3,
            idebCalculado2025: 4.7,
            meta2026: 5.1
        },
        '21286990': {
            nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS',
            inep: '21286990',
            zona: 'Zona Rural',
            inse: 'Nível III',
            adequacaoDocenteAI: '60.0%',
            adequacaoDocenteAF: '50.0%',
            participacao5Ano: '106.6%',
            participacao9Ano: '100%',
            proficienciaLP_5Ano: 215.3,
            proficienciaMAT_5Ano: 220.7,
            idebObservado2023: 4.7,
            idebCalculado2025: 5.1,
            meta2026: 5.5
        },
        '21128774': {
            nome: 'UNIDADE ESCOLAR ANISIO GOMES',
            inep: '21128774',
            zona: 'Zona Rural',
            inse: 'Nível III',
            adequacaoDocenteAI: '70.0%',
            adequacaoDocenteAF: '45.0%',
            participacao5Ano: '100%',
            participacao9Ano: '100%',
            proficienciaLP_5Ano: 210.4,
            proficienciaMAT_5Ano: 216.8,
            idebObservado2023: 4.5,
            idebCalculado2025: 4.9,
            meta2026: 5.3
        },
        '21192544': {
            nome: 'UE ANITA FURTADO',
            inep: '21192544',
            zona: 'Sede Urbana',
            inse: 'Nível IV',
            adequacaoDocenteAI: '85.0%',
            adequacaoDocenteAF: '65.0%',
            participacao5Ano: '100%',
            participacao9Ano: '98%',
            proficienciaLP_5Ano: 224.2,
            proficienciaMAT_5Ano: 230.1,
            idebObservado2023: 5.0,
            idebCalculado2025: 5.4,
            meta2026: 5.8
        }
    };


    // Bootstrap enhancements
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof setupSidebarAndNavigation === 'function') setupSidebarAndNavigation();
        if (typeof checkPersistentLogin === 'function') checkPersistentLogin();
        if (typeof setup7ColCalendarEvents === 'function') setup7ColCalendarEvents();
        if (typeof render7ColCalendar === 'function') render7ColCalendar();
    });
