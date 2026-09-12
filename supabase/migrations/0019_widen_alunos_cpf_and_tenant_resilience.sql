-- Migration: 0019_widen_alunos_cpf_and_tenant_resilience.sql
-- Descrição: Expande coluna cpf para TEXT para suportar tanto CPF mascarado quanto criptografado

ALTER TABLE IF EXISTS public.alunos ALTER COLUMN cpf TYPE TEXT;
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE IF EXISTS public.alunos ADD COLUMN IF NOT EXISTS nee TEXT;
