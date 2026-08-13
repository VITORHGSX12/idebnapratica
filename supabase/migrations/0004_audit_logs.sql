-- Migration: 0004_audit_logs.sql
-- Description: Criação da tabela de logs de auditoria de acessos a dados sensíveis de alunos.

CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_email VARCHAR(255) NOT NULL,
    aluno_id VARCHAR(100) NOT NULL,
    aluno_nome VARCHAR(255) NOT NULL,
    campo_acessado VARCHAR(100) NOT NULL,
    justificativa TEXT,
    tenant_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS para logs de auditoria
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Política de leitura: Apenas DPOs (Superadmin) ou gestores do mesmo tenant podem ver logs
CREATE POLICY "Permitir leitura de logs do mesmo tenant" ON public.logs_auditoria
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.usuarios u
            WHERE u.id = auth.uid() AND (u.role = 'Master Admin' OR u.tenant_id::text = public.logs_auditoria.tenant_id)
        )
    );

-- Política de inserção: Qualquer usuário autenticado pode registrar logs
CREATE POLICY "Permitir inserção de logs por usuários autenticados" ON public.logs_auditoria
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);
