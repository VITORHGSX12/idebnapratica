-- Migration: 0009_fix_turmas_not_null.sql
-- Descrição: Remove restrição NOT NULL de ano_letivo_id e turno_id em turmas

ALTER TABLE IF EXISTS public.turmas ALTER COLUMN ano_letivo_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.turmas ALTER COLUMN turno_id DROP NOT NULL;
