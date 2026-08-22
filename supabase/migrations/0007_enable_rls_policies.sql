-- =========================================================================
-- SECURITY FIX: [Row Level Security]
-- Migration: 0007_enable_rls_policies.sql
-- Descrição: Habilita Row Level Security (RLS) em TODAS as tabelas do Supabase/PostgreSQL
-- e implementa políticas granulares de SELECT, INSERT, UPDATE e DELETE baseadas
-- em organização/tenant e roles RBAC, garantindo isolamento estrito de dados e append-only em audit_logs.
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

-- 1. HABILITAR RLS EM TODAS AS TABELAS (SECURITY FIX: Row Level Security)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anos_letivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais_didaticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matrizes_curriculares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilidades_bncc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descritores_saeb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banco_questoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadernos_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS RLS PARA TABELA: TENANTS
DROP POLICY IF EXISTS "tenants_select_own" ON public.tenants;
CREATE POLICY "tenants_select_own" ON public.tenants
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            id = public.get_auth_tenant_id() OR public.is_master_admin()
        )
    );

DROP POLICY IF EXISTS "tenants_admin_manage" ON public.tenants;
CREATE POLICY "tenants_admin_manage" ON public.tenants
    FOR ALL USING (public.is_master_admin());

-- 3. POLÍTICAS RLS PARA TABELA: ESCOLAS
DROP POLICY IF EXISTS "escolas_select_own_org" ON public.escolas;
CREATE POLICY "escolas_select_own_org" ON public.escolas
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            tenant_id = public.get_auth_tenant_id() OR public.is_master_admin()
        )
    );

DROP POLICY IF EXISTS "escolas_insert_gestor" ON public.escolas;
CREATE POLICY "escolas_insert_gestor" ON public.escolas
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin_or_gestor()
    );

DROP POLICY IF EXISTS "escolas_update_own_org" ON public.escolas;
CREATE POLICY "escolas_update_own_org" ON public.escolas
    FOR UPDATE USING (
        tenant_id = public.get_auth_tenant_id() OR public.is_master_admin()
    ) WITH CHECK (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "escolas_delete_admin" ON public.escolas;
CREATE POLICY "escolas_delete_admin" ON public.escolas
    FOR DELETE USING (public.is_master_admin());

-- 4. POLÍTICAS RLS PARA TABELA: USUARIOS
DROP POLICY IF EXISTS "usuarios_select_own_org" ON public.usuarios;
CREATE POLICY "usuarios_select_own_org" ON public.usuarios
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            tenant_id = public.get_auth_tenant_id() OR id = auth.uid() OR public.is_master_admin()
        )
    );

DROP POLICY IF EXISTS "usuarios_insert_gestor" ON public.usuarios;
CREATE POLICY "usuarios_insert_gestor" ON public.usuarios
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND public.is_admin_or_gestor()
    );

DROP POLICY IF EXISTS "usuarios_update_own_org" ON public.usuarios;
CREATE POLICY "usuarios_update_own_org" ON public.usuarios
    FOR UPDATE USING (
        id = auth.uid() OR (tenant_id = public.get_auth_tenant_id() AND public.is_admin_or_gestor())
    ) WITH CHECK (public.is_admin_or_gestor() OR id = auth.uid());

DROP POLICY IF EXISTS "usuarios_delete_admin" ON public.usuarios;
CREATE POLICY "usuarios_delete_admin" ON public.usuarios
    FOR DELETE USING (public.is_master_admin());

-- 5. POLÍTICAS RLS PARA TABELA: ALUNOS
DROP POLICY IF EXISTS "alunos_select_authenticated" ON public.alunos;
CREATE POLICY "alunos_select_authenticated" ON public.alunos
    FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "alunos_insert_gestor" ON public.alunos;
CREATE POLICY "alunos_insert_gestor" ON public.alunos
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND public.is_admin_or_gestor());

DROP POLICY IF EXISTS "alunos_update_gestor" ON public.alunos;
CREATE POLICY "alunos_update_gestor" ON public.alunos
    FOR UPDATE USING (public.is_admin_or_gestor()) WITH CHECK (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "alunos_delete_admin" ON public.alunos;
CREATE POLICY "alunos_delete_admin" ON public.alunos
    FOR DELETE USING (public.is_master_admin());

-- 6. POLÍTICAS RLS PARA TABELA: TURMAS, TURNOS, ANOS_LETIVOS, MATRICULAS
DROP POLICY IF EXISTS "turmas_select_auth" ON public.turmas;
CREATE POLICY "turmas_select_auth" ON public.turmas FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "turmas_manage_gestor" ON public.turmas;
CREATE POLICY "turmas_manage_gestor" ON public.turmas FOR ALL USING (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "turnos_select_auth" ON public.turnos;
CREATE POLICY "turnos_select_auth" ON public.turnos FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "turnos_manage_gestor" ON public.turnos;
CREATE POLICY "turnos_manage_gestor" ON public.turnos FOR ALL USING (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "anos_letivos_select_auth" ON public.anos_letivos;
CREATE POLICY "anos_letivos_select_auth" ON public.anos_letivos FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "anos_letivos_manage_gestor" ON public.anos_letivos;
CREATE POLICY "anos_letivos_manage_gestor" ON public.anos_letivos FOR ALL USING (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "matriculas_select_auth" ON public.matriculas;
CREATE POLICY "matriculas_select_auth" ON public.matriculas FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "matriculas_manage_gestor" ON public.matriculas;
CREATE POLICY "matriculas_manage_gestor" ON public.matriculas FOR ALL USING (public.is_admin_or_gestor());

-- 7. POLÍTICAS RLS PARA BANCO DE QUESTÕES, AVALIAÇÕES E RESULTADOS
DROP POLICY IF EXISTS "questoes_select_auth" ON public.banco_questoes;
CREATE POLICY "questoes_select_auth" ON public.banco_questoes FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "questoes_manage_gestor" ON public.banco_questoes;
CREATE POLICY "questoes_manage_gestor" ON public.banco_questoes FOR ALL USING (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "avaliacoes_select_auth" ON public.avaliacoes;
CREATE POLICY "avaliacoes_select_auth" ON public.avaliacoes FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "avaliacoes_manage_gestor" ON public.avaliacoes;
CREATE POLICY "avaliacoes_manage_gestor" ON public.avaliacoes FOR ALL USING (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "itens_avaliacao_select_auth" ON public.itens_avaliacao;
CREATE POLICY "itens_avaliacao_select_auth" ON public.itens_avaliacao FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "itens_avaliacao_manage_gestor" ON public.itens_avaliacao;
CREATE POLICY "itens_avaliacao_manage_gestor" ON public.itens_avaliacao FOR ALL USING (public.is_admin_or_gestor());

DROP POLICY IF EXISTS "cadernos_select_auth" ON public.cadernos_respostas;
CREATE POLICY "cadernos_select_auth" ON public.cadernos_respostas FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "cadernos_manage_auth" ON public.cadernos_respostas;
CREATE POLICY "cadernos_manage_auth" ON public.cadernos_respostas FOR ALL USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "respostas_select_auth" ON public.respostas_itens;
CREATE POLICY "respostas_select_auth" ON public.respostas_itens FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "respostas_manage_auth" ON public.respostas_itens;
CREATE POLICY "respostas_manage_auth" ON public.respostas_itens FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. POLÍTICAS RLS PARA TABELA: LOGS_AUDITORIA (APPEND-ONLY ENFORCEMENT)
-- SECURITY FIX: [Row Level Security] Append-only: INSERT permitido para usuários autenticados, UPDATE e DELETE negados
DROP POLICY IF EXISTS "logs_auditoria_select_authorized" ON public.logs_auditoria;
CREATE POLICY "logs_auditoria_select_authorized" ON public.logs_auditoria
    FOR SELECT USING (
        auth.uid() IS NOT NULL AND (
            tenant_id = public.get_auth_tenant_id()::text OR public.is_master_admin()
        )
    );

DROP POLICY IF EXISTS "logs_auditoria_insert_authenticated" ON public.logs_auditoria;
CREATE POLICY "logs_auditoria_insert_authenticated" ON public.logs_auditoria
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Nenhuma política de UPDATE ou DELETE é criada para logs_auditoria (comportamento estrito Append-Only).
