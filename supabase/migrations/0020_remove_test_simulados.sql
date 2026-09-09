-- Migration: 0020_remove_test_simulados.sql
-- Descrição: Remove eventos e respostas de simulados de teste criados anteriormente

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'respostas_simulado') THEN
        DELETE FROM public.respostas_simulado WHERE evento_id IN ('evt_2026_01', 'evt_2026_02') OR evento_id LIKE 'evt_%';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'eventos_simulados_turmas') THEN
        DELETE FROM public.eventos_simulados_turmas WHERE evento_id IN ('evt_2026_01', 'evt_2026_02') OR evento_id LIKE 'evt_%';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'simulados') THEN
        DELETE FROM public.simulados WHERE evento_id IN ('evt_2026_01', 'evt_2026_02') OR evento_id LIKE 'evt_%';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'eventos_simulados') THEN
        DELETE FROM public.eventos_simulados WHERE id IN ('evt_2026_01', 'evt_2026_02') OR id LIKE 'evt_%' OR titulo ILIKE '%teste%' OR titulo ILIKE '%1º Simulado Municipal%';
    END IF;
END $$;
