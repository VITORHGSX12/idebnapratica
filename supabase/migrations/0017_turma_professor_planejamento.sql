-- =============================================================================
-- MIGRAÇÃO 0017: VÍNCULO TURMA ↔ PROFESSOR E PLANEJAMENTO PEDAGÓGICO
-- =============================================================================

-- 1. Tabela de Associação N:N entre Turmas e Professores
CREATE TABLE IF NOT EXISTS public.turma_professor (
    id SERIAL PRIMARY KEY,
    turma_id VARCHAR(100) NOT NULL,
    professor_id VARCHAR(100) NOT NULL,
    papel VARCHAR(50) DEFAULT 'titular',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (turma_id, professor_id)
);

-- 2. Tabela de Planejamentos Pedagógicos (Geral da Turma e Individual por Aluno)
CREATE TABLE IF NOT EXISTS public.planejamento (
    id SERIAL PRIMARY KEY,
    turma_id VARCHAR(100) NOT NULL,
    aluno_id VARCHAR(100) NULL,
    professor_id VARCHAR(100) NOT NULL,
    professor_nome VARCHAR(255),
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    disciplina VARCHAR(100) DEFAULT 'Polivalente',
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(50) DEFAULT 'planejado',
    habilidades_bncc TEXT[] DEFAULT '{}',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices para Otimização de Consultas de Turmas e Alunos
CREATE INDEX IF NOT EXISTS idx_turma_professor_prof ON public.turma_professor (professor_id);
CREATE INDEX IF NOT EXISTS idx_turma_professor_turma ON public.turma_professor (turma_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_turma ON public.planejamento (turma_id);
CREATE INDEX IF NOT EXISTS idx_planejamento_aluno ON public.planejamento (aluno_id);
