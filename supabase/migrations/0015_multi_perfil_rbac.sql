-- =============================================================================
-- MIGRAÇÃO 0015: MODELO N:N PARA MÚLTIPLOS PERFIS DE ACESSO (RBAC)
-- =============================================================================

-- 1. Tabela de Grupos de Acesso
CREATE TABLE IF NOT EXISTS public.grupos_acesso (
    id VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) DEFAULT 'PEDAGOGICO',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir Grupos Padrão do Sistema
INSERT INTO public.grupos_acesso (id, nome, descricao, categoria) VALUES
('Master Admin', 'Administrador Geral (TI/DPO)', 'Acesso irrestrito a configurações do sistema, usuários e auditoria', 'ADMINISTRATIVO'),
('Gestor SEMED', 'Gestor Municipal SEMED', 'Gestão estratégica de metas municipais, escolas e equipe da rede', 'GESTAO'),
('Diretor(a) Escolar', 'Diretor(a) Escolar', 'Gestão administrativa e pedagógica da unidade escolar', 'ESCOLA'),
('Coordenador(a)', 'Coordenador(a) Pedagógico(a)', 'Acompanhamento pedagógico, relatórios de simulados e planejamento', 'ESCOLA'),
('Professor(a)', 'Professor(a) Docente', 'Lançamento de notas, diário de classe e plano de aula', 'DOCENTE'),
('Professor AEE', 'Professor(a) AEE', 'Atendimento Educacional Especializado', 'DOCENTE')
ON CONFLICT (id) DO NOTHING;

-- 2. Tabela Associativa N:N (usuario_grupo_acesso)
CREATE TABLE IF NOT EXISTS public.usuario_grupo_acesso (
    id SERIAL PRIMARY KEY,
    usuario_id VARCHAR(100) NOT NULL,
    grupo_acesso_id VARCHAR(50) NOT NULL REFERENCES public.grupos_acesso(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (usuario_id, grupo_acesso_id)
);

-- 3. Tabela de Log de Auditoria para Troca de Perfis de Sessão
CREATE TABLE IF NOT EXISTS public.logs_troca_perfil (
    id SERIAL PRIMARY KEY,
    usuario_id VARCHAR(100) NOT NULL,
    usuario_email VARCHAR(255) NOT NULL,
    perfil_anterior VARCHAR(50),
    perfil_novo VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Migração de Dados Existentes: Popular usuario_grupo_acesso com os perfis atuais da tabela usuarios
INSERT INTO public.usuario_grupo_acesso (usuario_id, grupo_acesso_id)
SELECT 
    u.id as usuario_id,
    CASE 
        WHEN LOWER(u.role) LIKE '%admin%' THEN 'Master Admin'
        WHEN LOWER(u.role) LIKE '%gestor%' OR LOWER(u.role) LIKE '%semed%' THEN 'Gestor SEMED'
        WHEN LOWER(u.role) LIKE '%diretor%' THEN 'Diretor(a) Escolar'
        WHEN LOWER(u.role) LIKE '%coordenador%' THEN 'Coordenador(a)'
        WHEN LOWER(u.role) LIKE '%aee%' THEN 'Professor AEE'
        ELSE 'Professor(a)'
    END as grupo_acesso_id
FROM public.usuarios u
WHERE u.id IS NOT NULL
ON CONFLICT (usuario_id, grupo_acesso_id) DO NOTHING;
