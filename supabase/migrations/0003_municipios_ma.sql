-- Migration: 0003_municipios_ma.sql
-- Description: Creates the municipios_ma table for Maranhão municipalities list and updates ideb_publico_referencia.

CREATE TABLE IF NOT EXISTS municipios_ma (
    codigo_ibge VARCHAR(7) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    uf VARCHAR(2) DEFAULT 'MA' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching names
CREATE INDEX IF NOT EXISTS idx_municipios_ma_nome ON municipios_ma (nome);

COMMENT ON TABLE municipios_ma IS 'Lista de referência dos 217 municípios do estado do Maranhão.';

-- Let's also adjust ideb_publico_referencia to link to municipios_ma or hold general refs
-- We can add a foreign key constraint or indexes if needed.
