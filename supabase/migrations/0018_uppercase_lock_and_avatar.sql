-- ============================================================================
-- MIGRATION 0018: UPLOAD DE AVATAR & TRAVA DE CAIXA ALTA (UPPERCASE LOCK)
-- Descrição: Adiciona coluna avatar_url na tabela usuarios, normaliza dados
--            legados para UPPERCASE e instala triggers para forçar caixa alta.
-- ============================================================================

-- 1. Coluna avatar_url na tabela de usuários
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'usuarios' 
          AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.usuarios ADD COLUMN avatar_url VARCHAR(500);
    END IF;
END $$;

-- 2. Migração de dados legados existentes para CAIXA ALTA
-- 2.1 Usuários
UPDATE public.usuarios
SET 
    nome = UPPER(TRIM(nome)),
    email = LOWER(TRIM(email))
WHERE nome IS NOT NULL;

-- 2.2 Alunos
UPDATE public.alunos
SET 
    nome = UPPER(TRIM(nome))
WHERE nome IS NOT NULL;

-- 2.3 Escolas
UPDATE public.escolas
SET 
    nome = UPPER(TRIM(nome))
WHERE nome IS NOT NULL;

-- 2.4 Turmas
UPDATE public.turmas
SET 
    nome = UPPER(TRIM(nome))
WHERE nome IS NOT NULL;

-- 3. Funções de Trigger para Trava de Caixa Alta no Banco (PostgreSQL)

-- 3.1 Trigger para Usuários
CREATE OR REPLACE FUNCTION public.trg_enforce_uppercase_usuarios()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nome IS NOT NULL THEN
        NEW.nome := UPPER(TRIM(NEW.nome));
    END IF;
    IF NEW.email IS NOT NULL THEN
        NEW.email := LOWER(TRIM(NEW.email));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_uppercase ON public.usuarios;
CREATE TRIGGER trg_usuarios_uppercase
BEFORE INSERT OR UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.trg_enforce_uppercase_usuarios();

-- 3.2 Trigger para Alunos
CREATE OR REPLACE FUNCTION public.trg_enforce_uppercase_alunos()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nome IS NOT NULL THEN
        NEW.nome := UPPER(TRIM(NEW.nome));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alunos_uppercase ON public.alunos;
CREATE TRIGGER trg_alunos_uppercase
BEFORE INSERT OR UPDATE ON public.alunos
FOR EACH ROW
EXECUTE FUNCTION public.trg_enforce_uppercase_alunos();

-- 3.3 Trigger para Escolas
CREATE OR REPLACE FUNCTION public.trg_enforce_uppercase_escolas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nome IS NOT NULL THEN
        NEW.nome := UPPER(TRIM(NEW.nome));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_escolas_uppercase ON public.escolas;
CREATE TRIGGER trg_escolas_uppercase
BEFORE INSERT OR UPDATE ON public.escolas
FOR EACH ROW
EXECUTE FUNCTION public.trg_enforce_uppercase_escolas();

-- 3.4 Trigger para Turmas
CREATE OR REPLACE FUNCTION public.trg_enforce_uppercase_turmas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nome IS NOT NULL THEN
        NEW.nome := UPPER(TRIM(NEW.nome));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_turmas_uppercase ON public.turmas;
CREATE TRIGGER trg_turmas_uppercase
BEFORE INSERT OR UPDATE ON public.turmas
FOR EACH ROW
EXECUTE FUNCTION public.trg_enforce_uppercase_turmas();

