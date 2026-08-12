-- Migration: 0001_init_schema.sql
-- Description: Inicialização do schema do banco de dados real com RLS no Supabase.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE
);
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
    SELECT gen_random_uuid();
$$ LANGUAGE sql STABLE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
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
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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


-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLÍTICAS
-- ==========================================

-- Função auxiliar para obter o tenant_id do usuário autenticado no contexto do Supabase Auth
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.usuarios WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. RLS na tabela ALUNOS
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de alunos vinculados ao tenant do usuário" ON public.alunos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.matriculas m
            JOIN public.turmas t ON m.turma_id = t.id
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE m.aluno_id = public.alunos.id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );

CREATE POLICY "Permitir inserção de alunos por usuários autenticados" ON public.alunos
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Permitir alteração de alunos vinculados ao tenant do usuário" ON public.alunos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.matriculas m
            JOIN public.turmas t ON m.turma_id = t.id
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE m.aluno_id = public.alunos.id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );

CREATE POLICY "Permitir exclusão de alunos vinculados ao tenant do usuário" ON public.alunos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.matriculas m
            JOIN public.turmas t ON m.turma_id = t.id
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE m.aluno_id = public.alunos.id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );


-- 2. RLS na tabela MATRÍCULAS
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de matrículas vinculadas ao tenant do usuário" ON public.matriculas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.turmas t
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE t.id = public.matriculas.turma_id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );

CREATE POLICY "Permitir inserção de matrículas vinculadas ao tenant do usuário" ON public.matriculas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.turmas t
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE t.id = public.matriculas.turma_id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );

CREATE POLICY "Permitir atualização de matrículas vinculadas ao tenant do usuário" ON public.matriculas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.turmas t
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE t.id = public.matriculas.turma_id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );

CREATE POLICY "Permitir exclusão de matrículas vinculadas ao tenant do usuário" ON public.matriculas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.turmas t
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE t.id = public.matriculas.turma_id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );


-- 3. RLS na tabela RESPOSTAS_ALUNO
ALTER TABLE public.respostas_aluno ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações de respostas vinculadas ao tenant do usuário" ON public.respostas_aluno
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.matriculas m
            JOIN public.turmas t ON m.turma_id = t.id
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE m.id = public.respostas_aluno.matricula_id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );


-- 4. RLS na tabela DIAGNÓSTICOS_IA
ALTER TABLE public.diagnosticos_ia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todas as operações de diagnósticos vinculados ao tenant do usuário" ON public.diagnosticos_ia
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.matriculas m
            JOIN public.turmas t ON m.turma_id = t.id
            JOIN public.anos_letivos al ON t.ano_letivo_id = al.id
            JOIN public.escolas esc ON al.escola_id = esc.id
            WHERE m.id = public.diagnosticos_ia.matricula_id AND esc.tenant_id = public.get_user_tenant_id()
        )
    );
