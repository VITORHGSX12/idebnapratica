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
            title: 'Metas & Planejamento (IDEB)',
            subtitle: 'Planejamento e acompanhamento das metas padronizadas e proficiências pactuadas para a rede.'
        },
        'ideb-comparativo': {
            title: 'Comparativo Regional (INEP)',
            subtitle: 'Resultados históricos oficiais e metas projetadas do IDEB por estados e municípios (Fonte: MEC / INEP).'
        },
        'matriz-descritores': {
            title: 'Matriz de Referência & Descritores',
            subtitle: 'Lista de descritores cognitivos de competências do SAEB e do SEAMA.'
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
        }
    };

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute('data-target');

            // Switch active menu class
            menuItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Switch active tab content
            tabContents.forEach(tab => tab.classList.remove('active'));
            const activeTab = document.getElementById(targetTab);
            if (activeTab) {
                activeTab.classList.add('active');
            }

            // Update titles
            if (tabMeta[targetTab]) {
                pageTitle.textContent = tabMeta[targetTab].title;
                pageSubtitle.textContent = tabMeta[targetTab].subtitle;
            }

            // Trigger specific actions when switching tabs
            if (targetTab === 'doc-tecnica') {
                renderMermaidDiagram();
            } else if (targetTab === 'gestao-pedagogica') {
                renderRiskGoalsTable();
            } else if (targetTab === 'ideb-comparativo') {
                updateIdebComparativoView();
            } else if (targetTab === 'ai-playground') {
                populateAiSelectors();
            }
            
            safeCreateIcons();
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

    function saveDatabaseState() {
        localStorage.setItem('dbEscolas', JSON.stringify(dbEscolas));
        localStorage.setItem('dbTurmas', JSON.stringify(dbTurmas));
        localStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
        localStorage.setItem('dbAvaliacoes', JSON.stringify(dbAvaliacoes));
        localStorage.setItem('dbQuestoes', JSON.stringify(dbQuestoes));
        localStorage.setItem('dbResultadosAluno', JSON.stringify(dbResultadosAluno));
        localStorage.setItem('rawQuestions', JSON.stringify(rawQuestions));
        localStorage.setItem('activeEvaluations', JSON.stringify(activeEvaluations));

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
            fetch(`${API_BASE_URL}/api/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            }).catch(err => console.error('Cloud save failed:', err));
        }
    }

    async function loadDatabaseState() {
        const online = await checkCloudStatus();
        if (online) {
            try {
                const res = await fetch(`${API_BASE_URL}/api/sync`);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.dbEscolas && data.dbEscolas.length > 0) {
                        dbEscolas = data.dbEscolas;
                        dbTurmas = data.dbTurmas || [];
                        dbAlunos = data.dbAlunos || [];
                        dbAvaliacoes = data.dbAvaliacoes || [];
                        dbQuestoes = data.dbQuestoes || [];
                        dbResultadosAluno = data.dbResultadosAluno || [];
                        activeEvaluations = data.activeEvaluations || [];
                        rawQuestions = data.rawQuestions || [];
                        loadedStudents = dbAlunos;
                        
                        localStorage.setItem('dbEscolas', JSON.stringify(dbEscolas));
                        localStorage.setItem('dbTurmas', JSON.stringify(dbTurmas));
                        localStorage.setItem('dbAlunos', JSON.stringify(dbAlunos));
                        localStorage.setItem('dbAvaliacoes', JSON.stringify(dbAvaliacoes));
                        localStorage.setItem('dbQuestoes', JSON.stringify(dbQuestoes));
                        localStorage.setItem('dbResultadosAluno', JSON.stringify(dbResultadosAluno));
                        localStorage.setItem('rawQuestions', JSON.stringify(rawQuestions));
                        localStorage.setItem('activeEvaluations', JSON.stringify(activeEvaluations));
                        
                        finishLoading();
                        return;
                    }
                }
            } catch (err) {
                console.error('Error fetching state from backend:', err);
            }
        }

        const storedEscolas = localStorage.getItem('dbEscolas');
        const storedQuestions = localStorage.getItem('rawQuestions');
        
        if (storedEscolas) {
            dbEscolas = JSON.parse(storedEscolas);
            dbTurmas = JSON.parse(localStorage.getItem('dbTurmas') || '[]');
            dbAlunos = JSON.parse(localStorage.getItem('dbAlunos') || '[]');
            dbAvaliacoes = JSON.parse(localStorage.getItem('dbAvaliacoes') || '[]');
            dbQuestoes = JSON.parse(localStorage.getItem('dbQuestoes') || '[]');
            dbResultadosAluno = JSON.parse(localStorage.getItem('dbResultadosAluno') || '[]');
            activeEvaluations = JSON.parse(localStorage.getItem('activeEvaluations') || '[]');
            loadedStudents = dbAlunos;
        } else {
            if (loadedStudents && loadedStudents.length > 0) {
                syncNormalizedTablesFromLoadedData();
            } else {
                dbEscolas = [];
                dbTurmas = [];
                dbAlunos = [];
                dbAvaliacoes = [];
                dbQuestoes = [];
                dbResultadosAluno = [];
                activeEvaluations = [];
            }
            saveDatabaseState();
        }

        if (storedQuestions) {
            rawQuestions = JSON.parse(storedQuestions);
        } else {
            saveDatabaseState();
        }

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

        const schools = Array.from(new Set(dbAlunos.map(a => a.escola))).sort();
        populateLoginTenants(schools);

        renderCreatedEvents();
        renderOngoingAssessments();
        renderActiveDescriptors();
        renderQuestions();
        renderReferenceMatrix();
        generateIACSugestedCalendar(6.0);
        populateManualWeeksAndDescriptors();
        renderManualScheduleTable();
        populateQuestionCreatorDropdowns();
        initIdebComparativo();
    }

    function syncNormalizedTablesFromLoadedData() {
        dbEscolas = [];
        dbTurmas = [];
        dbAlunos = [];
        dbAvaliacoes = [];
        dbQuestoes = [];
        dbResultadosAluno = [];

        // 1. Escolas
        const uniqueSchools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
        uniqueSchools.forEach((schoolName, idx) => {
            let hash = 0;
            for (let i = 0; i < schoolName.length; i++) {
                hash += schoolName.charCodeAt(i);
            }
            const inepCode = 21000000 + (hash % 899999);
            dbEscolas.push({
                id: `esc_${idx + 1}`,
                nome: schoolName,
                rede_id: "municipal",
                codigo_inep: inepCode
            });
        });

        // 2. Turmas
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

        // 3. Alunos
        loadedStudents.forEach((s, idx) => {
            const schoolObj = dbEscolas.find(e => e.nome === s.escola);
            const classObj = dbTurmas.find(t => t.escola_id === (schoolObj ? schoolObj.id : null) && t.nome === s.etapa);
            dbAlunos.push({
                id: `aln_${idx + 1}`,
                turma_id: classObj ? classObj.id : null,
                nome: s.nome,
                matricula: s.matricula,
                nee: s.nee || '',
                avg_score: s.avg_score
            });
        });

        // 4. Avaliacoes
        activeEvaluations.forEach(ev => {
            dbAvaliacoes.push({
                id: ev.id,
                nome: ev.titulo,
                componente: ev.tipo.includes("Língua Portuguesa") || ev.titulo.includes("LP") ? "Português" : "Matemática",
                data_aplicacao: ev.janela || "2026-08-10",
                matriz_referencia: ev.etapa || "IDEB"
            });
        });

        // 5. Questoes
        const sourceQuestions = (rawQuestions && rawQuestions.length > 0) ? rawQuestions : (window.DEMO_QUESTIONS || []);
        sourceQuestions.forEach(q => {
            dbQuestoes.push({
                id: q.id,
                avaliacao_id: q.matriz === "IDEB" ? "eval-diag" : "sim-1",
                descritor_bncc_id: q.codigo_bncc,
                nivel_dificuldade: q.dificuldade
            });
        });

        // 6. Resultados Aluno
        dbAlunos.forEach(al => {
            const matNum = parseInt(al.matricula) || 0;
            dbAvaliacoes.forEach(av => {
                const isLP = av.componente === "Português";
                const testQuestions = dbQuestoes.filter(q => {
                    const isQ_LP = q.descritor_bncc_id.includes("LP") || q.descritor_bncc_id.startsWith("EF05LP");
                    return isLP ? isQ_LP : !isQ_LP;
                }).slice(0, 5);

                testQuestions.forEach((q, idx) => {
                    const threshold = al.avg_score || 65;
                    const randomVal = (matNum + idx * 17) % 100;
                    const acertou = randomVal < threshold;
                    dbResultadosAluno.push({
                        id: `res_${dbResultadosAluno.length + 1}`,
                        aluno_id: al.matricula,
                        avaliacao_id: av.id,
                        questao_id: q.id,
                        acertou: acertou
                    });
                });
            });
        });
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

    function populateIdebGoalsTable(schools) {
        const tableBody = document.getElementById('ideb-goals-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        schools.forEach((schName, idx) => {
            let hash = 0;
            for (let i = 0; i < schName.length; i++) {
                hash += schName.charCodeAt(i);
            }
            const baseIdeb = 4.2 + (hash % 15) / 10;
            const projectedIdeb = baseIdeb + 0.2 + (hash % 4) / 10;
            const targetIdeb = baseIdeb + 0.4;
            const gap = projectedIdeb - targetIdeb;
            const gapText = gap >= 0 ? `+${gap.toFixed(1)}` : `${gap.toFixed(1)}`;
            const gapColor = gap >= 0 ? 'var(--green-light)' : 'var(--red-light)';
            const statusBadge = gap >= 0 ? '<span class="badge badge-success">Meta Atingida</span>' : '<span class="badge badge-danger">Alerta de Gap</span>';

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '42px';
            tr.innerHTML = `
                <td style="padding: 10px 16px; font-weight:600;">${schName}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono);">${baseIdeb.toFixed(1)}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); font-weight:600; color:var(--purple-light);">${projectedIdeb.toFixed(1)}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); color:var(--text-secondary);">${targetIdeb.toFixed(1)}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); color:${gapColor}; font-weight:600;">${gapText}</td>
                <td style="padding: 10px 16px; text-align:center;">${statusBadge}</td>
            `;
            tableBody.appendChild(tr);
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

    let rawQuestions = [
        // --- LÍNGUA PORTUGUESA ---
        {
            id: "q_lp_1",
            codigo_bncc: "EF05LP01",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D1 (Localizar informação explícita)",
            enunciado: "Leia o texto a seguir:<br><em>'A Floresta Amazônica desempenha um papel crucial na regulação do clima global. Cientistas estimam que as árvores da região armazenem cerca de 120 bilhões de toneladas de carbono, ajudando a desacelerar o efeito estufa.'</em><br><br>De acordo com o texto, qual é a estimativa de carbono armazenado pelas árvores da região?",
            nivel_cognitivo: "Lembrar",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "120 milhões de toneladas de carbono", correta: false },
                { letra: "B", texto: "120 bilhões de toneladas de carbono", correta: true },
                { letra: "C", texto: "12 bilhões de toneladas de carbono", correta: false },
                { letra: "D", texto: "1.200 toneladas de carbono", correta: false }
            ],
            explicacao: "Localizar informação expressa no texto: 'árvores da região armazenem cerca de 120 bilhões de toneladas'."
        },
        {
            id: "q_lp_2",
            codigo_bncc: "EF05LP03",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D3 (Inferir o sentido de uma palavra ou expressão)",
            enunciado: "No trecho: <em>'O garoto ficou <strong>uma fera</strong> quando percebeu que seu brinquedo favorito havia quebrado.'</em><br><br>A expressão destacada 'uma fera' significa que o garoto ficou:",
            nivel_cognitivo: "Entender",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "Muito irritado", correta: true },
                { letra: "B", texto: "Muito assustado", correta: false },
                { letra: "C", texto: "Muito feliz", correta: false },
                { letra: "D", texto: "Muito cansado", correta: false }
            ],
            explicacao: "Compreender o sentido figurado da expressão idiomática popular 'ficar uma fera'."
        },
        {
            id: "q_lp_3",
            codigo_bncc: "EF05LP04",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D4 (Inferir uma informação implícita em um texto)",
            enunciado: "Leia os versos abaixo:<br><em>'A nuvem chorou fininho<br>Molhando a folha da flor<br>Depois veio o sol mansinho<br>E a nuvem se foi com calor.'</em><br><br>O trecho 'A nuvem chorou fininho' significa implicitamente que:",
            nivel_cognitivo: "Entender",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Estava caindo uma chuva leve", correta: true },
                { letra: "B", texto: "A nuvem estava muito triste", correta: false },
                { letra: "C", texto: "Houve uma grande tempestade", correta: false },
                { letra: "D", texto: "O dia estava muito frio", correta: false }
            ],
            explicacao: "Estabelecer relações de causa e efeito e interpretar linguagem metafórica básica."
        },
        {
            id: "q_lp_4",
            codigo_bncc: "EF05LP06",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D6 (Identificar o tema de um texto)",
            enunciado: "Leia com atenção:<br><em>'As abelhas são essenciais para a nossa sobrevivência. Ao voar de flor em flor em busca de pólen, realizam a polinização, processo que permite a reprodução de mais de 80% das plantas com flores do planeta, incluindo a maioria dos alimentos que consumimos.'</em><br><br>Qual é o tema principal do texto?",
            nivel_cognitivo: "Entender",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "O processo de fabricação do mel pelas abelhas", correta: false },
                { letra: "B", texto: "A importância das abelhas para a polinização e a vida na Terra", correta: true },
                { letra: "C", texto: "O perigo da extinção de insetos voadores", correta: false },
                { letra: "D", texto: "A variedade de flores existentes no planeta", correta: false }
            ],
            explicacao: "Identificar a ideia central e o tema articulador do parágrafo."
        },

        // --- MATEMÁTICA ---
        {
            id: "q_mt_1",
            codigo_bncc: "EF05MA01",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D1 (Identificar a localização/movimentação de objeto em mapas e representações)",
            enunciado: "Uma sala de aula possui as carteiras organizadas em colunas (1 a 5) e linhas (A a D). O aluno Pedro senta-se na carteira localizada na coluna 3, linha B.<br><br>Qual par de coordenadas representa a posição de Pedro?",
            nivel_cognitivo: "Lembrar",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "(B, 3)", correta: true },
                { letra: "B", texto: "(3, A)", correta: false },
                { letra: "C", texto: "(C, 2)", correta: false },
                { letra: "D", texto: "(2, B)", correta: false }
            ],
            explicacao: "Localizar pontos de referência em malha bidimensional através de coordenadas."
        },
        {
            id: "q_mt_2",
            codigo_bncc: "EF05MA19",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D13 (Resolver problemas com números naturais envolvendo as quatro operações)",
            enunciado: "Para organizar uma festa escolar, a diretora comprou 12 caixas de suco. Cada caixa contém exatamente 24 garrafinhas. Ao longo do evento, os alunos consumiram 185 garrafinhas.<br><br>Quantas garrafinhas de suco sobraram após o evento?",
            nivel_cognitivo: "Aplicar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "103 garrafinhas", correta: true },
                { letra: "B", texto: "288 garrafinhas", correta: false },
                { letra: "C", texto: "185 garrafinhas", correta: false },
                { letra: "D", texto: "113 garrafinhas", correta: false }
            ],
            explicacao: "Resolução em duas etapas: Multiplicação (12 * 24 = 288) seguida de Subtração (288 - 185 = 103)."
        },
        {
            id: "q_mt_3",
            codigo_bncc: "EF05MA20",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D20 (Resolver problemas com números inteiros envolvendo frações)",
            enunciado: "Uma pizza inteira foi cortada em 8 pedaços iguais. Ana comeu 2 pedaços e seu irmão Carlos comeu 3 pedaços.<br><br>Que fração da pizza sobrou?",
            nivel_cognitivo: "Aplicar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "3/8", correta: true },
                { letra: "B", texto: "5/8", correta: false },
                { letra: "C", texto: "2/8", correta: false },
                { letra: "D", texto: "1/2", correta: false }
            ],
            explicacao: "Soma das partes comidas (2/8 + 3/8 = 5/8) e cálculo do complementar (8/8 - 5/8 = 3/8)."
        },
        {
            id: "q_mt_4",
            codigo_bncc: "EF05MA24",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D24 (Identificar a relação entre figuras tridimensionais e suas planificações)",
            enunciado: "Um dado clássico de jogo tem o formato de um cubo sólido regular de 6 faces.<br><br>Ao planificarmos esse cubo, qual das figuras a seguir representa sua estrutura correta?",
            nivel_cognitivo: "Analisar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Um arranjo em forma de cruz com 6 quadrados conectados", correta: true },
                { letra: "B", texto: "Uma fileira reta de 6 quadrados adjacentes", correta: false },
                { letra: "C", texto: "Uma pirâmide triangular planificada", correta: false },
                { letra: "D", texto: "Cinco retângulos e um círculo", correta: false }
            ],
            explicacao: "Reconhecimento espacial e planificação de poliedros regulares comuns."
        },

        // --- CIÊNCIAS DA NATUREZA ---
        {
            id: "q_ci_1",
            codigo_bncc: "EF05CI01",
            disciplina: "Ciências",
            matriz: "SEAMA",
            descritor: "EF05CI01 (Explorar e classificar propriedades físicas de materiais cotidianos)",
            enunciado: "Ao preparar café da manhã, Júlia notou que a colher de metal que deixou dentro da xícara de chá quente aqueceu rapidamente, enquanto a colher de plástico permaneceu fria.<br><br>Essa diferença ocorre porque o metal apresenta alta:",
            nivel_cognitivo: "Entender",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "Condutibilidade térmica", correta: true },
                { letra: "B", texto: "Densidade volumétrica", correta: false },
                { letra: "C", texto: "Magnetização estática", correta: false },
                { letra: "D", texto: "Solubilidade aquosa", correta: false }
            ],
            explicacao: "Identificar características de condução térmica dos materiais em situações cotidianas."
        },

        // --- GEOGRAFIA ---
        {
            id: "q_ge_1",
            codigo_bncc: "EF05GE05",
            disciplina: "Geografia",
            matriz: "SEAMA",
            descritor: "EF05GE05 (Identificar e comparar as transformações espaciais decorrentes da ação antrópica)",
            enunciado: "A construção de grandes barragens hidrelétricas altera significativamente o leito dos rios, inunda áreas de florestas nativas e muitas vezes força a remoção de comunidades ribeirinhas.<br><br>Essas alterações no relevo e ocupação humana são exemplos clássicos de:",
            nivel_cognitivo: "Entender",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Transformações da paisagem natural decorrentes da ação humana (antrópica)", correta: true },
                { letra: "B", texto: "Processos puramente climáticos e erosivos geológicos", correta: false },
                { letra: "C", texto: "Preservação integral da cobertura florestal intocada", correta: false },
                { letra: "D", texto: "Migração natural espontânea da fauna aquática", correta: false }
            ],
            explicacao: "Analisar as modificações na paisagem e no meio ambiente promovidas pelo homem."
        },
        {
            id: "q_ge_2",
            codigo_bncc: "EF05GE09",
            disciplina: "Geografia",
            matriz: "SEAMA",
            descritor: "EF05GE09 (Reconhecer as características das vegetações nativas regionais brasileiras)",
            enunciado: "Uma região de transição com grande ocorrência de palmeiras de babaçu e carnaúba, localizada principalmente nos estados do Maranhão e Piauí, é chamada de:<br><br>Marque a alternativa correta:",
            nivel_cognitivo: "Lembrar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Mata Atlântica", correta: false },
                { letra: "B", texto: "Mata dos Cocais", correta: true },
                { letra: "C", texto: "Manguezal Litorâneo", correta: false },
                { letra: "D", texto: "Pampas Gaúchos", correta: false }
            ],
            explicacao: "A Mata dos Cocais é uma zona de transição morfoclimática típica do Meio-Norte brasileiro (Maranhão, Piauí e Ceará), caracterizada pela abundância de palmeiras extrativistas como o babaçu."
        }
    ];

    function renderQuestions() {
        if (!filterMatrix || !filterSubject || !filterBloom || !filterDifficulty) return;
        const selectedMatrix = filterMatrix.value;
        const selectedSubject = filterSubject.value;
        const selectedBloom = filterBloom.value;
        const selectedDifficulty = filterDifficulty.value;

        // Filter list
        const filtered = rawQuestions.filter(q => {
            const matchMatrix = selectedMatrix === 'all' || q.matriz === selectedMatrix;
            const matchSubject = selectedSubject === 'all' || q.disciplina === selectedSubject;
            const matchBloom = selectedBloom === 'all' || q.nivel_cognitivo === selectedBloom;
            const matchDifficulty = selectedDifficulty === 'all' || q.dificuldade === selectedDifficulty;
            return matchMatrix && matchSubject && matchBloom && matchDifficulty;
        });

        questionsCounter.textContent = `Exibindo ${filtered.length} ${filtered.length === 1 ? 'questão' : 'questões'}`;
        questionsContainer.innerHTML = '';

        if (filtered.length === 0) {
            questionsContainer.innerHTML = `
                <div class="card text-center padding-lg">
                    <p class="text-muted">Nenhuma questão encontrada com os filtros selecionados.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(q => {
            const card = document.createElement('div');
            card.className = 'question-card';
            
            let badgeDiffClass = 'badge-success';
            if (q.dificuldade === 'Médio') badgeDiffClass = 'badge-warning';
            if (q.dificuldade === 'Difícil') badgeDiffClass = 'badge-danger';

            card.innerHTML = `
                <div class="question-header" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div class="question-badges" style="display:flex; gap:4px; flex-wrap:wrap;">
                        <span class="badge badge-info">${q.codigo_bncc}</span>
                        <span class="badge badge-success">${q.disciplina}</span>
                        <span class="badge badge-danger">${q.matriz}</span>
                        <span class="badge badge-purple">${q.nivel_cognitivo}</span>
                        <span class="badge ${badgeDiffClass}">${q.dificuldade}</span>
                    </div>
                    <div class="question-actions" style="display:flex; gap:8px; flex-shrink:0;">
                        <button class="btn btn-icon btn-edit-question" data-id="${q.id}" style="padding:4px; height:28px; width:28px; display:flex; align-items:center; justify-content:center; background:none; border:none; color:var(--text-secondary); cursor:pointer;" title="Editar"><i data-lucide="edit-3" style="width:14px; height:14px;"></i></button>
                        <button class="btn btn-icon btn-delete-question" data-id="${q.id}" style="padding:4px; height:28px; width:28px; display:flex; align-items:center; justify-content:center; background:none; border:none; color:var(--red-light); cursor:pointer;" title="Excluir"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>
                    </div>
                </div>
                <div class="question-body" style="margin-top:12px;">
                    <p>${q.enunciado}</p>
                </div>
                <div class="question-options-list" style="margin-top:12px; display:flex; flex-direction:column; gap:8px;">
                    ${q.opcoes.map(opt => `
                        <div class="question-option" data-correct="${opt.correta}">
                            <span class="option-letter">${opt.letra})</span>
                            <span class="option-text">${opt.texto}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="question-explanation hidden" style="margin-top:12px; padding:12px; background:var(--bg-tertiary); border-left:4px solid var(--purple); border-radius:var(--radius-sm);">
                    <strong>Gabarito Comentado:</strong>
                    <p style="margin-top:4px; font-size:0.8rem; color:var(--text-secondary);">${q.explicacao || 'Sem explicação disponível.'}</p>
                </div>
            `;

            questionsContainer.appendChild(card);
        });

        // Add action on option click to reveal correctness and explanation
        const questionCards = questionsContainer.querySelectorAll('.question-card');
        questionCards.forEach(card => {
            const options = card.querySelectorAll('.question-option');
            const explanation = card.querySelector('.question-explanation');

            options.forEach(opt => {
                opt.addEventListener('click', () => {
                    options.forEach(o => {
                        if (o.getAttribute('data-correct') === 'true') {
                            o.classList.add('correct');
                        }
                        o.style.pointerEvents = 'none';
                    });
                    explanation.classList.remove('hidden');
                });
            });
        });

        // Add Edit and Delete event listeners
        const editBtns = questionsContainer.querySelectorAll('.btn-edit-question');
        const deleteBtns = questionsContainer.querySelectorAll('.btn-delete-question');

        editBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const qId = btn.getAttribute('data-id');
                const q = rawQuestions.find(qu => qu.id === qId);
                if (q) {
                    openEditQuestionModal(q);
                }
            });
        });

        deleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const qId = btn.getAttribute('data-id');
                if (confirm('Tem certeza de que deseja excluir esta questão do banco?')) {
                    deleteQuestion(qId);
                }
            });
        });

        if (window.lucide) {
            lucide.createIcons();
        }

        if (window.MathJax) {
            MathJax.typesetPromise([questionsContainer]).catch(err => console.log('MathJax error: ', err));
        }
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

    function renderDbSchools() {
        if (!dbSchoolsTableBody) return;
        dbSchoolsTableBody.innerHTML = '';

        const query = dbSchoolSearch ? dbSchoolSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
        const filteredSchools = uniqueSchoolsList.filter(s => {
            const schNorm = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return schNorm.includes(query);
        });

        if (filteredSchools.length === 0) {
            dbSchoolsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">
                        Nenhuma escola encontrada com este nome.
                    </td>
                </tr>
            `;
            return;
        }

        filteredSchools.forEach(schName => {
            const schStudents = loadedStudents.filter(s => s.escola === schName);
            const schStudentsCount = schStudents.length;
            const schStages = Array.from(new Set(schStudents.map(s => s.etapa))).length;

            let hash = 0;
            for (let i = 0; i < schName.length; i++) {
                hash += schName.charCodeAt(i);
            }
            const inepCode = 21000000 + (hash % 899999);

            // Compute actual average score dynamically from student roster!
            let schTotalScores = 0;
            let schCountScores = 0;
            schStudents.forEach(st => {
                if (st.avg_score !== undefined) {
                    schTotalScores += st.avg_score;
                    schCountScores++;
                }
            });
            const avgScore = schCountScores > 0 ? (schTotalScores / schCountScores) : (62 + (hash % 20) + (hash % 10) / 10);

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '46px';

            tr.innerHTML = `
                <td style="padding: 10px 16px; font-family:var(--font-mono); font-size:0.75rem;">${inepCode}</td>
                <td style="padding: 10px 16px; font-weight:600;">${schName}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono);">${schStudentsCount.toLocaleString('pt-BR')}</td>
                <td style="padding: 10px 16px; text-align:center;">${schStages}</td>
                <td style="padding: 10px 16px; text-align:center; font-weight:600; color:var(--green-light);">${avgScore.toFixed(1)}%</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <div style="display:flex; gap:8px; justify-content:center;">
                        <button class="btn btn-outline btn-sm view-school-students-btn" data-school="${schName}">
                            <i data-lucide="users" style="width:14px; height:14px; margin-right:4px;"></i> Alunos
                        </button>
                        <button class="btn btn-outline btn-sm view-school-classes-btn" data-school="${schName}">
                            <i data-lucide="book-open" style="width:14px; height:14px; margin-right:4px;"></i> Turmas
                        </button>
                    </div>
                </td>
            `;
            dbSchoolsTableBody.appendChild(tr);
        });

        const btnViewStudents = dbSchoolsTableBody.querySelectorAll('.view-school-students-btn');
        btnViewStudents.forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                const tabBtn = document.querySelector('.menu-item[data-target="alunos-panel"]');
                if (tabBtn) {
                    tabBtn.click();
                }
                if (dbStudentSchoolFilter) {
                    dbStudentSchoolFilter.value = sch;
                    applyDbFilters();
                }
            });
        });

        const btnViewClasses = dbSchoolsTableBody.querySelectorAll('.view-school-classes-btn');
        btnViewClasses.forEach(btn => {
            btn.addEventListener('click', () => {
                const sch = btn.getAttribute('data-school');
                openSchoolClassesModal(sch);
            });
        });

        safeCreateIcons();
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

            if (target === 'risco-metas-sub') {
                renderRiskGoalsTable();
            } else if (target === 'planos-intervencao-sub') {
                populateInterventionPlansSelectors();
            }
        });
    });

    function renderRiskGoalsTable() {
        const tableBody = document.getElementById('risk-goals-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        const schools = Array.from(new Set(loadedStudents.map(s => s.escola))).sort();
        schools.forEach((schName, idx) => {
            let hash = 0;
            for (let i = 0; i < schName.length; i++) {
                hash += schName.charCodeAt(i);
            }
            const baseIdeb = 4.2 + (hash % 15) / 10;
            const projectedIdeb = baseIdeb + 0.2 + (hash % 4) / 10;
            const targetIdeb = baseIdeb + 0.5; // meta pactuada
            const desvio = projectedIdeb - targetIdeb;
            const desvioText = desvio >= 0 ? `+${desvio.toFixed(1)}` : `${desvio.toFixed(1)}`;
            const desvioColor = desvio >= 0 ? 'var(--green-light)' : 'var(--red-light)';

            let riskLabel = 'Baixo';
            let riskBadgeClass = 'badge-success';
            if (desvio < -0.3) {
                riskLabel = 'Alto';
                riskBadgeClass = 'badge-danger';
            } else if (desvio < 0) {
                riskLabel = 'Médio';
                riskBadgeClass = 'badge-warning';
            }

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '42px';
            tr.innerHTML = `
                <td style="padding: 10px 16px; font-weight:600;">${schName}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono);">${targetIdeb.toFixed(1)}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); font-weight:600; color:var(--purple-light);">${projectedIdeb.toFixed(1)}</td>
                <td style="padding: 10px 16px; text-align:center; font-family:var(--font-mono); color:${desvioColor}; font-weight:600;">${desvioText}</td>
                <td style="padding: 10px 16px; text-align:center;"><span class="badge ${riskBadgeClass}">${riskLabel}</span></td>
                <td style="padding: 10px 16px; text-align:center; font-size:0.75rem; color:var(--text-muted);">${desvio < 0 ? 'Ação Corretiva Recomendada' : 'No Rumo da Meta'}</td>
            `;
            tableBody.appendChild(tr);
        });
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
    const dbStudentNeeFilter = document.getElementById('db-student-nee-filter');
    const dbStudentsTableBody = document.getElementById('db-students-table-body');
    const dbStudentsPaginationInfo = document.getElementById('db-students-pagination-info');
    const btnDbStudentsPrev = document.getElementById('btn-db-students-prev');
    const btnDbStudentsNext = document.getElementById('btn-db-students-next');

    const studentModal = document.getElementById('student-modal');
    const closeStudentModalBtn = document.getElementById('close-student-modal-btn');
    
    let dbCurrentPage = 1;
    const dbPageSize = 50;
    let dbFilteredStudents = [];

    window.initAlunosTab = function(schools) {
        if (dbStudentSchoolFilter) {
            dbStudentSchoolFilter.innerHTML = '<option value="all">Filtrar por Escola (Todas)</option>';
            schools.forEach(sch => {
                const opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, ' ');
                dbStudentSchoolFilter.appendChild(opt);
            });
        }

        dbFilteredStudents = [...loadedStudents];
        dbCurrentPage = 1;
        renderDbStudents();
    };

    function applyDbFilters() {
        const query = dbStudentSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const schoolFilter = dbStudentSchoolFilter.value;
        const neeFilter = dbStudentNeeFilter.value;

        dbFilteredStudents = loadedStudents.filter(s => {
            const nameNorm = s.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const cpfNorm = (s.cpf || '').replace(/\D/g, '');
            const matchQuery = nameNorm.includes(query) || s.matricula.includes(query) || cpfNorm.includes(query);
            const matchSchool = schoolFilter === 'all' || s.escola === schoolFilter;
            const hasNee = !!s.nee;
            const matchNee = neeFilter === 'all' || (neeFilter === 'sim' && hasNee) || (neeFilter === 'nao' && !hasNee);

            return matchQuery && matchSchool && matchNee;
        });

        dbCurrentPage = 1;
        renderDbStudents();
    }

    if (dbStudentSearch) dbStudentSearch.addEventListener('input', applyDbFilters);
    if (dbStudentSchoolFilter) dbStudentSchoolFilter.addEventListener('change', applyDbFilters);
    if (dbStudentNeeFilter) dbStudentNeeFilter.addEventListener('change', applyDbFilters);

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

        btnDbStudentsPrev.disabled = dbCurrentPage === 1;
        btnDbStudentsNext.disabled = endIndex >= dbFilteredStudents.length;

        if (dbFilteredStudents.length === 0) {
            dbStudentsPaginationInfo.textContent = 'Nenhum aluno encontrado';
            dbStudentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">
                        Nenhum cadastro atende aos filtros definidos.
                    </td>
                </tr>
            `;
            return;
        }

        dbStudentsPaginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${dbFilteredStudents.length.toLocaleString('pt-BR')} alunos`;

        pageStudents.forEach(s => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '46px';
            
            const stageClean = s.etapa.replace('Ensino fundamental de 9 anos - ', '').trim();
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

    function openStudentModal(student) {
        document.getElementById('modal-student-name').textContent = student.nome;
        document.getElementById('modal-student-matricula').textContent = `Matrícula: ${student.matricula}`;
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
        document.getElementById('modal-student-inicio').textContent = student.data_matricula || 'Não Informada';
        
        const neeField = document.getElementById('modal-student-nee');
        if (student.nee) {
            neeField.className = 'badge badge-warning';
            neeField.textContent = student.nee;
        } else {
            neeField.className = 'text-muted';
            neeField.textContent = 'Nenhuma deficiência declarada / Ensino Regular';
        }

        studentModal.classList.remove('hidden');
    }

    if (closeStudentModalBtn) {
        closeStudentModalBtn.addEventListener('click', () => {
            studentModal.classList.add('hidden');
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
            showToast('Banco de dados completamente zerado!', 'trash-2');
        });
    }

    // ==========================================
    // CRONOGRAMA LETIVO & PLANEJADOR ESTRATÉGICO
    // ==========================================
    let manualSchedule = [];

    function generateIACSugestedCalendar(targetIdeb) {
        const cronResult = document.getElementById('cron-ia-result');
        if (!cronResult) return;
        cronResult.innerHTML = '';

        const val = parseFloat(targetIdeb) || 6.0;
        let intensity = "Básico";
        let tip = "Foco em alfabetização matemática e fluência leitora básica.";
        if (val >= 6.5) {
            intensity = "Avançado (Sobral Premium)";
            tip = "Intensificação de simulados quinzenais e correção imediata baseada em descritores.";
        } else if (val >= 5.8) {
            intensity = "Intermediário de Aceleração";
            tip = "Simulados mensais e plano de metas por escola com foco em descritores críticos.";
        }

        const headerDiv = document.createElement('div');
        headerDiv.style.padding = '12px';
        headerDiv.style.borderRadius = 'var(--radius-sm)';
        headerDiv.style.border = '1px solid var(--border-color)';
        headerDiv.style.background = 'var(--bg-tertiary)';
        headerDiv.style.marginBottom = '10px';
        headerDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:0.8rem; font-weight:700; color:var(--text-primary);">Modelo Estratégico Sugerido:</span>
                <span class="badge badge-info" style="font-weight:700; color:var(--purple-light);">${intensity}</span>
            </div>
            <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">${tip}</p>
        `;
        cronResult.appendChild(headerDiv);

        const planWeeks = [
            { w: "Semana 1", lp: "D1 - Info Explícita", mt: "D1 - Localização e Mapas", action: val >= 6.5 ? "Oficina de leitura com cronômetro e trilhas de coordenadas no pátio." : "Leitura coletiva de contos e desenho de mapas da escola." },
            { w: "Semana 2", lp: "D3 - Sentido de Expressões", mt: "D13 - Operações Aritméticas", action: val >= 6.5 ? "Desafio relâmpago de cálculo mental e vocabulário contextualizado." : "Jogos matemáticos e dicionário ilustrado." },
            { w: "Semana 3", lp: "D4 - Info Implícita", mt: "D8 - Perímetro de Figuras", action: "Leitura de charges, tirinhas e medição real do perímetro das salas de aula." },
            { w: "Semana 4", type: "assessment", title: "1º Simulado Preparatório de Rede", action: "Aplicação e digitação imediata de gabarito para diagnóstico de gaps." },
            { w: "Semana 5", lp: "D6 - Tema do Texto", mt: "D9 - Área de Figuras Planas", action: "Identificação de ideias centrais e uso de malhas quadriculadas para áreas." },
            { w: "Semana 6", lp: "D11 - Fato vs Opinião", mt: "D12 - Porcentagem Comercial", action: val >= 6.5 ? "Debate regrado com notícias reais e simulação de lojinha com descontos." : "Identificação de opiniões em cartas e cálculo de descontos simples." },
            { w: "Semana 7", lp: "D14 - Efeitos de Pontuação", mt: "D14 - Representação Decimal", action: "Leitura dramática enfatizando pontuações e jogos com moedas decimais." },
            { w: "Semana 8", type: "assessment", title: "Avaliação Formativa de Recuperação", action: "Foco metodológico nos alunos que não atingiram 50% de acertos." },
            { w: "Semana 9", lp: "D19 - Tese do Autor", mt: "D26 - Noções de Probabilidade", action: "Identificação da opinião do autor em editoriais e experimentos com dados/moedas." },
            { w: "Semana 10", lp: "D22 - Coerência e Repetição", mt: "D27 - Gráficos e Tabelas", action: "Exercícios de substituição pronominal e construção de gráficos baseados no censo." }
        ];

        planWeeks.forEach(week => {
            const row = document.createElement('div');
            row.style.padding = '12px 16px';
            row.style.borderRadius = 'var(--radius-sm)';
            row.style.border = '1px solid var(--border-color)';
            row.style.background = week.type === 'assessment' ? 'rgba(144,126,252,0.08)' : 'var(--bg-secondary)';
            row.style.display = 'flex';
            row.style.flexDirection = 'column';
            row.style.gap = '6px';
            row.style.marginBottom = '8px';

            if (week.type === 'assessment') {
                row.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; font-size:0.8rem; color:var(--purple-light);">${week.w}</span>
                        <span class="badge badge-warning" style="font-size:0.7rem;">AVALIAÇÃO E CONTROLE</span>
                    </div>
                    <strong style="font-size:0.85rem; color:var(--text-primary);">${week.title}</strong>
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;">${week.action}</p>
                `;
            } else {
                row.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:700; font-size:0.8rem; color:var(--text-primary);">${week.w}</span>
                        <span style="font-size:0.7rem; color:var(--text-muted);">Reforço Semanal</span>
                    </div>
                    <div style="display:flex; gap:12px; font-size:0.75rem; flex-wrap:wrap;">
                        <span style="color:var(--purple-light); font-weight:600;"><i data-lucide="book-open" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i>${week.lp}</span>
                        <span style="color:var(--blue-light); font-weight:600;"><i data-lucide="plus-circle" style="width:12px; height:12px; display:inline-block; vertical-align:middle; margin-right:4px;"></i>${week.mt}</span>
                    </div>
                    <p style="font-size:0.75rem; color:var(--text-secondary); margin:0;"><strong>Diretriz Pedagógica:</strong> ${week.action}</p>
                `;
            }
            cronResult.appendChild(row);
        });

        safeCreateIcons();
    }

    function populateManualWeeksAndDescriptors() {
        const weekSelect = document.getElementById('manual-cron-week');
        const descSelect = document.getElementById('manual-cron-descriptor');
        const subjectSelect = document.getElementById('manual-cron-subject');

        if (weekSelect) {
            weekSelect.innerHTML = '';
            for (let i = 1; i <= 40; i++) {
                const opt = document.createElement('option');
                opt.value = `Semana ${i}`;
                opt.textContent = `Semana Letiva ${i}`;
                weekSelect.appendChild(opt);
            }
        }

        function updateDescriptorsDropdown() {
            if (!descSelect || !subjectSelect) return;
            descSelect.innerHTML = '';
            
            const subj = subjectSelect.value;
            if (subj === 'Língua Portuguesa') {
                FULL_INEP_MATRICES.portuguese.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = `${d.codigo} - ${d.desc}`;
                    opt.textContent = `${d.codigo} - ${d.desc.slice(0, 50)}...`;
                    descSelect.appendChild(opt);
                });
            } else if (subj === 'Matemática') {
                FULL_INEP_MATRICES.math.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = `${d.codigo} - ${d.desc}`;
                    opt.textContent = `${d.codigo} - ${d.desc.slice(0, 50)}...`;
                    descSelect.appendChild(opt);
                });
            } else {
                FULL_INEP_MATRICES.science.forEach(d => {
                    const opt = document.createElement('option');
                    opt.value = `${d.codigo} - ${d.desc}`;
                    opt.textContent = `${d.codigo} - ${d.desc.slice(0, 50)}...`;
                    descSelect.appendChild(opt);
                });
            }
        }

        if (subjectSelect) {
            subjectSelect.addEventListener('change', updateDescriptorsDropdown);
            updateDescriptorsDropdown();
        }
    }

    function renderManualScheduleTable() {
        const tableBody = document.getElementById('cron-manual-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (manualSchedule.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="padding: 18px; text-align:center; color:var(--text-muted); font-size:0.8rem;">
                        Nenhum planejamento inserido no cronograma manual ainda.
                    </td>
                </tr>
            `;
            return;
        }

        manualSchedule.sort((a, b) => {
            const numA = parseInt(a.week.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.week.replace(/\D/g, '')) || 0;
            return numA - numB;
        });

        manualSchedule.forEach((item, idx) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '38px';
            tr.innerHTML = `
                <td style="padding: 8px 12px; font-weight:600; font-size:0.8rem; color:var(--text-primary);">${item.week}</td>
                <td style="padding: 8px 12px; font-size:0.75rem; color:var(--text-secondary);">${item.subject}</td>
                <td style="padding: 8px 12px; font-size:0.75rem; color:var(--text-secondary);">${item.descriptor}</td>
                <td style="padding: 8px 12px; text-align:center;">
                    <span class="btn-delete-manual-cron" data-idx="${idx}" style="color:var(--red-light); cursor:pointer; font-size:0.75rem; display:inline-flex; align-items:center; gap:2px;">
                        <i data-lucide="trash-2" style="width:12px; height:12px;"></i> Excluir
                    </span>
                </td>
            `;
            tableBody.appendChild(tr);
        });

        tableBody.querySelectorAll('.btn-delete-manual-cron').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-idx'));
                manualSchedule.splice(idx, 1);
                renderManualScheduleTable();
                showToast('Habilidade removida do cronograma.', 'trash-2');
            });
        });

        safeCreateIcons();
    }

    const btnCronIaMode = document.getElementById('btn-cron-ia-mode');
    const btnCronManualMode = document.getElementById('btn-cron-manual-mode');
    const cronIaPanel = document.getElementById('cron-ia-panel');
    const cronManualPanel = document.getElementById('cron-manual-panel');
    const targetIdebInput = document.getElementById('target-ideb-input');
    const btnAddCronManual = document.getElementById('btn-add-cron-manual');

    if (btnCronIaMode && btnCronManualMode && cronIaPanel && cronManualPanel) {
        btnCronIaMode.addEventListener('click', () => {
            btnCronIaMode.className = 'btn btn-primary';
            btnCronManualMode.className = 'btn btn-outline';
            cronIaPanel.classList.remove('hidden');
            cronManualPanel.classList.add('hidden');
        });

        btnCronManualMode.addEventListener('click', () => {
            btnCronManualMode.className = 'btn btn-primary';
            btnCronIaMode.className = 'btn btn-outline';
            cronManualPanel.classList.remove('hidden');
            cronIaPanel.classList.add('hidden');
            renderManualScheduleTable();
        });
    }

    if (targetIdebInput) {
        targetIdebInput.addEventListener('change', () => {
            const val = parseFloat(targetIdebInput.value) || 6.0;
            generateIACSugestedCalendar(val.toFixed(1));
            showToast(`Cronograma recalculado para a nova meta IDEB de ${val.toFixed(1)}!`, 'sparkles');
        });
    }

    if (btnAddCronManual) {
        btnAddCronManual.addEventListener('click', () => {
            const week = document.getElementById('manual-cron-week').value;
            const subject = document.getElementById('manual-cron-subject').value;
            const descriptor = document.getElementById('manual-cron-descriptor').value;

            const exists = manualSchedule.some(item => item.week === week && item.subject === subject);
            if (exists) {
                showToast('Já existe um planejamento para esta disciplina nesta semana.', 'alert-triangle');
                return;
            }

            manualSchedule.push({ week, subject, descriptor });
            renderManualScheduleTable();
            showToast('Habilidade inserida no cronograma letivo!', 'check-circle');
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
                justificativa: `Item pedagógico de nível ${difficulty} gerado automaticamente pelo motor de IA para o descritor ${descCode}.`
            };
            rawQuestions.unshift(newQ);

            dbQuestoes.push({
                id: newQ.id,
                avaliacao_id: "eval-diag",
                descritor_bncc_id: newQ.codigo_bncc,
                nivel_dificuldade: newQ.dificuldade
            });

            renderQuestions();
            showToast(`Questão do descritor ${descCode} gerada pela IA com sucesso!`, 'sparkles');
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
    // LÓGICA DE CONTROLE DA TELA DE LOGIN
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

    function populateLoginTenants(schools) {
        const loginTenant = document.getElementById('login-tenant');
        if (!loginTenant) return;
        
        // Keep the placeholder and multitenant option
        loginTenant.innerHTML = `
            <option value="" disabled selected>Selecione seu município...</option>
            <option value="all">Todas as Redes (Multitenant - Demo)</option>
        `;
        schools.forEach(sch => {
            const opt = document.createElement('option');
            opt.value = sch;
            opt.textContent = sch.replace(/\s+/g, ' ');
            loginTenant.appendChild(opt);
        });
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

    // Login Form Submit Handlers
    const loginForm = document.getElementById('login-form');
    const loginScreen = document.getElementById('login-screen');
    const btnLoginSubmit = document.getElementById('btn-login-submit');

    if (loginForm && loginScreen && btnLoginSubmit) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const selectedTenant = document.getElementById('login-tenant').value;
            const emailInput = document.getElementById('login-email').value;

            // Simple loading simulation
            btnLoginSubmit.disabled = true;
            const btnSpan = btnLoginSubmit.querySelector('span');
            const originalText = btnSpan.textContent;
            btnSpan.textContent = 'Autenticando acesso...';

            setTimeout(() => {
                // Set global network filter in dashboard
                const tenantSelector = document.getElementById('tenant-selector');
                if (tenantSelector) {
                    tenantSelector.value = selectedTenant;
                    tenantSelector.dispatchEvent(new Event('change'));
                }

                // Smooth Fade-out animation
                loginScreen.classList.add('fade-out');
                showToast(`Bem-vindo! Acesso autorizado para a rede de ${selectedTenant === 'all' ? 'Multitenant' : selectedTenant}.`, 'check');
                window.scrollTo(0, 0);
                
                // Store session to avoid forcing login on refresh
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('activeTenant', selectedTenant);

                setTimeout(() => {
                    loginScreen.style.display = 'none';
                    if (window.lucide) {
                        lucide.createIcons({ attrs: { class: 'lucide' } });
                    }
                }, 600);
            }, 1000);
        });
    }

    // Check Login Session
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
        window.scrollTo(0, 0);
        // Restore active tenant if saved
        const savedTenant = sessionStorage.getItem('activeTenant');
        const tenantSelector = document.getElementById('tenant-selector');
        if (savedTenant && tenantSelector) {
            setTimeout(() => {
                tenantSelector.value = savedTenant;
                tenantSelector.dispatchEvent(new Event('change'));
            }, 500);
        }
    } else {
        rotateLoginHeadlines();
    }

    // ==========================================
    // CONTROLE DE RECOLHIMENTO DA SIDEBAR
    // ==========================================
    const sidebarCollapseToggle = document.getElementById('sidebar-collapse-toggle');
    if (sidebarCollapseToggle) {
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            document.body.classList.add('collapsed-sidebar');
            const icon = sidebarCollapseToggle.querySelector('i') || sidebarCollapseToggle.querySelector('svg');
            if (icon && window.lucide) {
                icon.setAttribute('data-lucide', 'chevron-right');
            }
        }

        sidebarCollapseToggle.addEventListener('click', () => {
            const isCollapsed = document.body.classList.toggle('collapsed-sidebar');
            localStorage.setItem('sidebarCollapsed', isCollapsed ? 'true' : 'false');
            
            const icon = sidebarCollapseToggle.querySelector('i') || sidebarCollapseToggle.querySelector('svg');
            if (icon && window.lucide) {
                icon.setAttribute('data-lucide', isCollapsed ? 'chevron-right' : 'chevron-left');
                lucide.createIcons({ attrs: { class: 'lucide' } });
            }
        });
    }

    // Initial render calls - Start completely clean/empty
    loadDatabaseState();
    renderCreatedEvents();
    renderOngoingAssessments();
    renderActiveDescriptors();
    renderQuestions();
    renderReferenceMatrix();
    generateIACSugestedCalendar(6.0);
    populateManualWeeksAndDescriptors();
    renderManualScheduleTable();
    populateQuestionCreatorDropdowns();
    initIdebComparativo();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

