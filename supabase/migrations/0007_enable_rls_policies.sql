-- =========================================================================
-- SECURITY FIX: [Row Level Security]
-- Migration: 0007_enable_rls_policies.sql
-- Descrição: Habilita Row Level Security (RLS) de forma segura e resiliente
-- =========================================================================

-- Helper para obter tenant_id do usuário autenticado no contexto do Supabase
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.usuarios WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper para verificar roles administrativas
CREATE OR REPLACE FUNCTION public.is_admin_or_gestor()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() 
        AND role IN ('Master Admin', 'admin', 'Gestor da Rede', 'gestor')
        AND ativo = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() 
        AND role IN ('Master Admin', 'admin')
        AND ativo = TRUE
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. HABILITAR RLS EM TODAS AS TABELAS EXISTENTES
DO $$ 
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'tenants', 'escolas', 'turnos', 'anos_letivos', 'turmas', 
        'usuarios', 'alunos', 'matriculas', 'categorias_materiais', 
        'materiais_didaticos', 'matrizes_curriculares', 'habilidades_bncc', 
        'descritores_saeb', 'banco_questoes', 'avaliacoes', 'itens_avaliacao', 
        'cadernos_respostas', 'respostas_itens', 'logs_auditoria'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

-- 2. CRIAR POLÍTICAS RLS SEGURAS
DO $$ 
BEGIN
    -- TENANTS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        DROP POLICY IF EXISTS "tenants_select_own" ON public.tenants;
        CREATE POLICY "tenants_select_own" ON public.tenants FOR SELECT USING (auth.uid() IS NOT NULL);
        DROP POLICY IF EXISTS "tenants_admin_manage" ON public.tenants;
        CREATE POLICY "tenants_admin_manage" ON public.tenants FOR ALL USING (public.is_master_admin());
    END IF;

    -- ESCOLAS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'escolas') THEN
        DROP POLICY IF EXISTS "escolas_select_own_org" ON public.escolas;
        CREATE POLICY "escolas_select_own_org" ON public.escolas FOR SELECT USING (auth.uid() IS NOT NULL);
        DROP POLICY IF EXISTS "escolas_insert_gestor" ON public.escolas;
        CREATE POLICY "escolas_insert_gestor" ON public.escolas FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin_or_gestor());
    END IF;

    -- ALUNOS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alunos') THEN
        DROP POLICY IF EXISTS "alunos_select_authenticated" ON public.alunos;
        CREATE POLICY "alunos_select_authenticated" ON public.alunos FOR SELECT USING (auth.uid() IS NOT NULL);
        DROP POLICY IF EXISTS "alunos_insert_gestor" ON public.alunos;
        CREATE POLICY "alunos_insert_gestor" ON public.alunos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin_or_gestor());
    END IF;

    -- TURMAS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'turmas') THEN
        DROP POLICY IF EXISTS "turmas_select_auth" ON public.turmas;
        CREATE POLICY "turmas_select_auth" ON public.turmas FOR SELECT USING (auth.uid() IS NOT NULL);
        DROP POLICY IF EXISTS "turmas_manage_gestor" ON public.turmas;
        CREATE POLICY "turmas_manage_gestor" ON public.turmas FOR ALL USING (public.is_admin_or_gestor());
    END IF;

    -- LOGS_AUDITORIA
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'logs_auditoria') THEN
        DROP POLICY IF EXISTS "logs_auditoria_select_authorized" ON public.logs_auditoria;
        CREATE POLICY "logs_auditoria_select_authorized" ON public.logs_auditoria FOR SELECT USING (auth.uid() IS NOT NULL);
        DROP POLICY IF EXISTS "logs_auditoria_insert_authenticated" ON public.logs_auditoria;
        CREATE POLICY "logs_auditoria_insert_authenticated" ON public.logs_auditoria FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;
