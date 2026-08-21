-- Migration: 0006_tenants_subdominio.sql
-- Description: Adiciona colunas slug, subdominio e tipo (producao/demo) na tabela tenants existente com backfill resiliente.

-- 1. Adicionar colunas caso não existam
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS slug VARCHAR(50);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS subdominio VARCHAR(100);
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'producao';

-- 2. Backfill: associar pelo nome oficial de Gonçalves Dias
UPDATE public.tenants 
SET slug = 'gd', subdominio = 'gd', tipo = 'producao' 
WHERE (slug IS NULL OR slug = '') 
  AND (nome ILIKE '%Gon%alves Dias%' OR nome ILIKE '%Goncalves Dias%');

-- 3. Backfill de compatibilidade: se o banco legado foi seedado com outro nome (ex: Codó)
UPDATE public.tenants 
SET nome = 'Município de Gonçalves Dias', slug = 'gd', subdominio = 'gd', tipo = 'producao' 
WHERE (slug IS NULL OR slug = '') 
  AND nome ILIKE '%Cod%';

-- 4. Salvaguarda final: garante que nenhum tenant pré-existente permaneça com slug nulo
UPDATE public.tenants 
SET slug = 'gd', subdominio = 'gd', tipo = 'producao' 
WHERE slug IS NULL OR slug = '';

-- 5. Criar índices para resolução por subdomínio e slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_subdominio ON public.tenants(subdominio);
