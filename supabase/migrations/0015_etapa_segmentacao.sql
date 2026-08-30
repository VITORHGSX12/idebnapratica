-- =============================================================================
-- MIGRATION 0015: SEGMENTAÇÃO POR ETAPA DE ENSINO E DESCRITORES SAEB
-- Adiciona suporte a agrupamento por etapa (2º, 5º e 9º ano) e otimiza queries
-- =============================================================================

ALTER TABLE IF EXISTS public.simulados ADD COLUMN IF NOT EXISTS etapa VARCHAR(50) DEFAULT '5º Ano';
ALTER TABLE IF EXISTS public.respostas_simulado ADD COLUMN IF NOT EXISTS etapa VARCHAR(50) DEFAULT '5º Ano';

-- Atualiza registros existentes com base no turma_id se houver
UPDATE public.simulados SET etapa = '9º Ano' WHERE turma_id ILIKE '%9%' OR titulo ILIKE '%9%';
UPDATE public.simulados SET etapa = '2º Ano' WHERE turma_id ILIKE '%2%' OR titulo ILIKE '%2%';
UPDATE public.respostas_simulado SET etapa = '9º Ano' WHERE turma_id ILIKE '%9%' OR simulado_id ILIKE '%9%';
UPDATE public.respostas_simulado SET etapa = '2º Ano' WHERE turma_id ILIKE '%2%' OR simulado_id ILIKE '%2%';

CREATE INDEX IF NOT EXISTS idx_respostas_simulado_etapa ON public.respostas_simulado(etapa);
CREATE INDEX IF NOT EXISTS idx_simulados_etapa ON public.simulados(etapa);
