-- Migration: 0002_ideb_publico_referencia.sql
-- Description: Creates the public reference table for IDEB official data comparison.

CREATE TABLE IF NOT EXISTS ideb_publico_referencia (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    uf VARCHAR(2) NOT NULL,
    municipio VARCHAR(255) NOT NULL,
    codigo_ibge VARCHAR(7) NOT NULL,
    ano INTEGER NOT NULL,
    etapa VARCHAR(50) NOT NULL, -- 'Anos Iniciais' ou 'Anos Finais'
    ideb_observado NUMERIC(3, 1),
    meta_projetada NUMERIC(3, 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ideb_publico_ref_search ON ideb_publico_referencia (uf, municipio, etapa);
CREATE INDEX IF NOT EXISTS idx_ideb_publico_ref_ibge ON ideb_publico_referencia (codigo_ibge);

COMMENT ON TABLE ideb_publico_referencia IS 'Tabela de referência para dados públicos oficiais do IDEB (INEP) por município e estado.';
