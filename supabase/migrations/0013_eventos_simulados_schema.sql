-- =============================================================================
-- MIGRATION 0013: MÓDULO DE AVALIAÇÕES DIAGNÓSTICAS & SIMULADOS (SAEB / BNCC)
-- Em conformidade estrita com a especificação AVALIACOES_DIAGNOSTICAS_ESPECIFICACAO_COMPLETA.md
-- =============================================================================

-- 1. TABELA PRINCIPAL DE EVENTOS DE SIMULADOS
CREATE TABLE IF NOT EXISTS public.eventos_simulados (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) DEFAULT 'default',
    titulo VARCHAR(255) NOT NULL,
    data_realizacao DATE NOT NULL DEFAULT CURRENT_DATE,
    disciplina VARCHAR(50) NOT NULL DEFAULT 'ambas',
    portugues_inicio INT DEFAULT 1,
    portugues_fim INT DEFAULT 10,
    matematica_inicio INT DEFAULT 11,
    matematica_fim INT DEFAULT 20,
    status VARCHAR(20) NOT NULL DEFAULT 'RASCUNHO' CHECK (status IN ('RASCUNHO', 'ABERTO', 'ENCERRADO')),
    passo_ativo INT DEFAULT 1,
    qtd_questoes INT DEFAULT 20,
    gabarito_geral_json JSONB DEFAULT '[]'::jsonb,
    etapas_alvo JSONB DEFAULT '[]'::jsonb,
    turmas JSONB DEFAULT '[]'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE VÍNCULO EVENTO <-> TURMAS (COM GABARITO DIFERENCIADO SE HOUVER)
CREATE TABLE IF NOT EXISTS public.eventos_simulados_turmas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id VARCHAR(255) NOT NULL REFERENCES public.eventos_simulados(id) ON DELETE CASCADE,
    turma_id VARCHAR(255) NOT NULL,
    escola_id VARCHAR(255),
    modo_gabarito VARCHAR(20) NOT NULL DEFAULT 'GERAL' CHECK (modo_gabarito IN ('GERAL', 'INDIVIDUAL')),
    num_questoes INT DEFAULT 20,
    gabarito_json JSONB,
    habilidades_json JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evento_turma UNIQUE (evento_id, turma_id)
);

-- 3. TABELA DE INSTÂNCIAS DE SIMULADO POR ESCOLA E TURMA
CREATE TABLE IF NOT EXISTS public.simulados (
    id VARCHAR(255) PRIMARY KEY,
    evento_id VARCHAR(255) NOT NULL REFERENCES public.eventos_simulados(id) ON DELETE CASCADE,
    escola_id VARCHAR(255) NOT NULL,
    turma_id VARCHAR(255) NOT NULL,
    titulo VARCHAR(255),
    disciplina VARCHAR(50) DEFAULT 'ambas',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_evento_escola_turma UNIQUE (evento_id, escola_id, turma_id)
);

-- 4. TABELA DE RESPOSTAS DOS ALUNOS (1 LINHA POR ALUNO COM RESPOSTAS_JSON)
CREATE TABLE IF NOT EXISTS public.respostas_simulado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    simulado_id VARCHAR(255) NOT NULL REFERENCES public.simulados(id) ON DELETE CASCADE,
    evento_id VARCHAR(255) NOT NULL REFERENCES public.eventos_simulados(id) ON DELETE CASCADE,
    escola_id VARCHAR(255) NOT NULL,
    turma_id VARCHAR(255) NOT NULL,
    aluno_id VARCHAR(255) NOT NULL,
    aluno_nome VARCHAR(255),
    respostas_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    status_presenca VARCHAR(20) NOT NULL DEFAULT 'PRESENTE' CHECK (status_presenca IN ('PRESENTE', 'AUSENTE', 'TRANSFERIDO')),
    gabarito_json JSONB,
    habilidades_json JSONB,
    total_acertos INT DEFAULT 0,
    percentual_acertos NUMERIC(5,2) DEFAULT 0.00,
    situacao VARCHAR(50) DEFAULT 'ABAIXO DO BÁSICO',
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_simulado_aluno UNIQUE (simulado_id, aluno_id)
);

-- ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_respostas_simulado_lookup ON public.respostas_simulado(evento_id, escola_id, turma_id);
CREATE INDEX IF NOT EXISTS idx_respostas_simulado_aluno ON public.respostas_simulado(aluno_id);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON public.eventos_simulados(status);
CREATE INDEX IF NOT EXISTS idx_simulados_evento ON public.simulados(evento_id);

-- 5. SEED INICIAL DO 1º SIMULADO SAEB 2026 SE NÃO EXISTIR
INSERT INTO public.eventos_simulados (
    id, titulo, data_realizacao, disciplina, portugues_inicio, portugues_fim,
    matematica_inicio, matematica_fim, status, passo_ativo, qtd_questoes,
    gabarito_geral_json, etapas_alvo, criado_em
) VALUES (
    'evt_2026_01',
    '1º Simulado Municipal SAEB 2026 — 5º e 9º Anos',
    '2026-09-15',
    'ambas',
    1, 10, 11, 20,
    'ABERTO',
    4,
    20,
    '[{"etapaNome":"5º Ano","qtdQuestoes":20,"gabarito":["A","B","C","D","A","C","B","D","A","B","C","D","A","B","C","D","A","B","C","D"],"habilidades":["LP01","LP02","LP03","LP05","LP07","LP12","LP17","LP21","LP23","LP31","MT01","MT02","MT03","MT05","MT06","MT15","MT16","MT22","MT27","MT28"]}]'::jsonb,
    '["5º Ano", "9º Ano"]'::jsonb,
    '2026-08-20T08:00:00.000Z'
) ON CONFLICT (id) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    status = EXCLUDED.status,
    gabarito_geral_json = EXCLUDED.gabarito_geral_json;
