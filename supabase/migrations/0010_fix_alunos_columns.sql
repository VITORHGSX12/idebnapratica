-- Migration: 0010_fix_alunos_columns.sql
-- Descrição: Adiciona matricula e colunas complementares em alunos

ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS matricula VARCHAR(50);
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS cpf VARCHAR(20);
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS nascimento VARCHAR(30);
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS tenant_id UUID;
