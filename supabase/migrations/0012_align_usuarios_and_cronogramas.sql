-- Migration: 0012_align_usuarios_and_cronogramas.sql
-- Description: Alinha as tabelas usuarios, cronogramas e tenant_state para persistência real no PostgreSQL.

-- 1. Desacoplamento da tabela de Usuários de schemas externos de autenticação (auth.users)
DROP POLICY IF EXISTS "Permitir leitura de logs do mesmo tenant" ON public.logs_auditoria;

DO $$ BEGIN
    ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_id_fkey CASCADE;
    ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_pkey CASCADE;
    ALTER TABLE public.usuarios ALTER COLUMN id TYPE VARCHAR(100) USING id::text;
    ALTER TABLE public.usuarios ADD PRIMARY KEY (id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.usuarios ALTER COLUMN senha_hash DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Recriar política em logs_auditoria com compatibilidade a ID varchar
DO $$ BEGIN
    CREATE POLICY "Permitir leitura de logs do mesmo tenant" ON public.logs_auditoria
        FOR SELECT
        USING (
            EXISTS (
                SELECT 1 FROM public.usuarios u
                WHERE u.id::text = auth.uid()::text AND (u.role = 'Master Admin' OR u.tenant_id::text = public.logs_auditoria.tenant_id)
            )
        );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Garantir colunas essenciais na tabela public.usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password VARCHAR(255);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS tipo VARCHAR(50);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS escola VARCHAR(255);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS turma VARCHAR(100);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(50);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS cpf VARCHAR(50);
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Ativo';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT TRUE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 2. Tabela de Turmas (Garantir escola_id e tenant_id)
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL;
ALTER TABLE public.turmas ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 3. Tabela de Tenant State (Snapshot JSONB Multitenant)
CREATE TABLE IF NOT EXISTS public.tenant_state (
    tenant_id VARCHAR(100) PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Cronogramas Pedagógicos (40 Semanas e Metas)
CREATE TABLE IF NOT EXISTS public.cronogramas (
    id VARCHAR(100) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    escola_id UUID REFERENCES public.escolas(id) ON DELETE SET NULL,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE SET NULL,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    semana_inicio INTEGER,
    semana_fim INTEGER,
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(50) DEFAULT 'Planejado',
    metadados JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Índices para Otimização de Consultas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant ON public.usuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_alunos_turma_id ON public.alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_alunos_matricula ON public.alunos(matricula);
CREATE INDEX IF NOT EXISTS idx_turmas_escola_id ON public.turmas(escola_id);


