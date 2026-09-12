-- ============================================================================
-- MIGRATION 0020: Auditoria e Rastreabilidade de Recálculo de Gabarito
-- ============================================================================

DO $$
BEGIN
    -- Adicionar colunas de auditoria em eventos_simulados
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos_simulados' AND column_name = 'gabarito_alterado_em'
    ) THEN
        ALTER TABLE eventos_simulados ADD COLUMN gabarito_alterado_em TIMESTAMPTZ DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'eventos_simulados' AND column_name = 'recalculado_em'
    ) THEN
        ALTER TABLE eventos_simulados ADD COLUMN recalculado_em TIMESTAMPTZ DEFAULT NULL;
    END IF;

    -- Adicionar colunas de auditoria em respostas_simulado
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'respostas_simulado' AND column_name = 'gabarito_alterado_em'
    ) THEN
        ALTER TABLE respostas_simulado ADD COLUMN gabarito_alterado_em TIMESTAMPTZ DEFAULT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'respostas_simulado' AND column_name = 'recalculado_em'
    ) THEN
        ALTER TABLE respostas_simulado ADD COLUMN recalculado_em TIMESTAMPTZ DEFAULT NULL;
    END IF;
END $$;
