-- Migration: 0011_add_turma_id_to_alunos.sql
-- Descrição: Adiciona turma_id e flexibiliza colunas em alunos

ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS turma_id UUID;
ALTER TABLE IF EXISTS public.alunos ALTER COLUMN codigo_matricula DROP NOT NULL;
ALTER TABLE IF EXISTS public.alunos ALTER COLUMN data_nascimento DROP NOT NULL;
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS matricula VARCHAR(50);
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS cpf VARCHAR(20);
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS nascimento VARCHAR(30);
