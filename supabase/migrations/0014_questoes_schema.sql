-- =============================================================================
-- MIGRATION 0014: BANCO DE QUESTÕES & GERADOR IA (PERSISTÊNCIA RELACIONAL)
-- Normalização completa de questões, alternativas com distratores e matriz BNCC/SAEB
-- =============================================================================

-- 1. Criar tabela caso não exista
CREATE TABLE IF NOT EXISTS public.questoes (
    id VARCHAR(255) PRIMARY KEY,
    tenant_id VARCHAR(255) DEFAULT 'default',
    matriz VARCHAR(50) NOT NULL DEFAULT 'SAEB',
    codigo_bncc VARCHAR(100),
    disciplina VARCHAR(100) NOT NULL DEFAULT 'Língua Portuguesa',
    etapa VARCHAR(50) NOT NULL DEFAULT '5º Ano',
    dificuldade VARCHAR(50) NOT NULL DEFAULT 'Médio',
    nivel_cognitivo VARCHAR(50) DEFAULT 'Compreender',
    texto_base TEXT,
    enunciado TEXT NOT NULL,
    opcoes_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    gabarito VARCHAR(10),
    explicacao TEXT,
    origem VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    embedding JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Remover restrições antigas que bloqueiam dados do padrão nacional
ALTER TABLE IF EXISTS public.opcoes_resposta DROP CONSTRAINT IF EXISTS opcoes_resposta_questao_id_fkey;
ALTER TABLE IF EXISTS public.itens_avaliacao DROP CONSTRAINT IF EXISTS itens_avaliacao_questao_id_fkey;
ALTER TABLE IF EXISTS public.questoes DROP CONSTRAINT IF EXISTS questoes_codigo_bncc_fkey;
ALTER TABLE IF EXISTS public.questoes DROP CONSTRAINT IF EXISTS questoes_dificuldade_check;
ALTER TABLE IF EXISTS public.questoes DROP CONSTRAINT IF EXISTS questoes_nivel_cognitivo_check;

-- 3. Alterar tipo de coluna ID para suportar IDs textuais e UUIDs
ALTER TABLE IF EXISTS public.opcoes_resposta ALTER COLUMN questao_id TYPE VARCHAR(255);
ALTER TABLE IF EXISTS public.itens_avaliacao ALTER COLUMN questao_id TYPE VARCHAR(255);
ALTER TABLE public.questoes ALTER COLUMN id TYPE VARCHAR(255);

-- Recriar Foreign Keys com integridade referencial atualizada
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'opcoes_resposta_questao_id_fkey'
    ) THEN
        ALTER TABLE public.opcoes_resposta 
            ADD CONSTRAINT opcoes_resposta_questao_id_fkey 
            FOREIGN KEY (questao_id) REFERENCES public.questoes(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'itens_avaliacao_questao_id_fkey'
    ) THEN
        ALTER TABLE public.itens_avaliacao 
            ADD CONSTRAINT itens_avaliacao_questao_id_fkey 
            FOREIGN KEY (questao_id) REFERENCES public.questoes(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Adicionar colunas necessárias caso tabela tenha sido criada anteriormente
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default';
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS matriz VARCHAR(50) NOT NULL DEFAULT 'SAEB';
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS disciplina VARCHAR(100) NOT NULL DEFAULT 'Língua Portuguesa';
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS etapa VARCHAR(50) NOT NULL DEFAULT '5º Ano';
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS texto_base TEXT;
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS opcoes_json JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS gabarito VARCHAR(10);
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS explicacao TEXT;
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS origem VARCHAR(50) NOT NULL DEFAULT 'MANUAL';
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS embedding JSONB;
ALTER TABLE public.questoes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 5. Índices de performance
CREATE INDEX IF NOT EXISTS idx_questoes_disciplina_etapa ON public.questoes(disciplina, etapa);
CREATE INDEX IF NOT EXISTS idx_questoes_codigo_bncc ON public.questoes(codigo_bncc);
CREATE INDEX IF NOT EXISTS idx_questoes_origem ON public.questoes(origem);
CREATE INDEX IF NOT EXISTS idx_questoes_dificuldade ON public.questoes(dificuldade);

-- 6. SEED INICIAL DE QUESTÕES PADRÃO SAEB
INSERT INTO public.questoes (
    id, matriz, codigo_bncc, disciplina, etapa, dificuldade, nivel_cognitivo,
    texto_base, enunciado, opcoes_json, gabarito, explicacao, origem, criado_em
) VALUES
(
    'Q_01',
    'SAEB',
    'D03 (LP - 5º Ano)',
    'Língua Portuguesa',
    '5º Ano',
    'Médio',
    'Analisar',
    'O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave. Dona Francisca apressou o passo na vereda, sentindo o frescor da tarde anunciar o fim da colheita.',
    'No trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:',
    '[{"letra":"A","texto":"Perder a consciência por cansaço físico.","correta":false},{"letra":"B","texto":"Desaparecer lentamente ao entardecer.","correta":true},{"letra":"C","texto":"Aumentar a intensidade de sua luz solar.","correta":false},{"letra":"D","texto":"Mudar de posição devido ao vento forte.","correta":false}]'::jsonb,
    'B',
    'GABARITO: B. A expressão "desmaiar no horizonte" é uma metáfora poética que expressa o pôr do sol gradativo.',
    'MANUAL',
    '2026-08-20T10:00:00.000Z'
),
(
    'Q_02',
    'SAEB',
    'D13 (MAT - 5º Ano)',
    'Matemática',
    '5º Ano',
    'Fácil',
    'Aplicar',
    NULL,
    'Na feira do produtor rural de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele conseguiu vender 1.830 espigas.\n\nQuantas espigas de milho restaram com Seu Raimundo?',
    '[{"letra":"A","texto":"500 espigas","correta":false},{"letra":"B","texto":"600 espigas","correta":true},{"letra":"C","texto":"650 espigas","correta":false},{"letra":"D","texto":"720 espigas","correta":false}]'::jsonb,
    'B',
    'GABARITO: B. Total colhido: 1.450 + 980 = 2.430 espigas. Restante após as vendas: 2.430 - 1.830 = 600 espigas.',
    'MANUAL',
    '2026-08-20T10:00:00.000Z'
),
(
    'Q_03',
    'SEAMA',
    'D28 (MAT - 9º Ano)',
    'Matemática',
    '9º Ano',
    'Médio',
    'Analisar',
    NULL,
    'A tabela abaixo registra o número de livros lidos pelos estudantes de uma turma durante o 1º bimestre:\n\n• 1 a 2 livros: 12 alunos\n• 3 a 4 livros: 18 alunos\n• 5 ou mais livros: 10 alunos\n\nQual é o percentual de estudantes que leram 3 ou mais livros nessa turma?',
    '[{"letra":"A","texto":"30%","correta":false},{"letra":"B","texto":"45%","correta":false},{"letra":"C","texto":"70%","correta":true},{"letra":"D","texto":"80%","correta":false}]'::jsonb,
    'C',
    'GABARITO: C. Total de alunos na turma = 12 + 18 + 10 = 40 alunos. Alunos que leram 3 ou mais livros = 18 + 10 = 28 alunos. Percentual = (28 / 40) × 100 = 70%.',
    'MANUAL',
    '2026-08-20T10:00:00.000Z'
)
ON CONFLICT (id) DO UPDATE SET
    enunciado = EXCLUDED.enunciado,
    opcoes_json = EXCLUDED.opcoes_json,
    explicacao = EXCLUDED.explicacao;
