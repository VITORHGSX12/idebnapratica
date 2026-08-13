-- Migration: 0005_rls_tenant_state.sql
-- Description: Habilita e força Row-Level Security (RLS) na tabela tenant_state para isolamento multitenant estrito.

ALTER TABLE public.tenant_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_state FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_state_isolation_policy ON public.tenant_state;

CREATE POLICY tenant_state_isolation_policy ON public.tenant_state
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', true));
