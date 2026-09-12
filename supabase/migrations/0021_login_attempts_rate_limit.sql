-- Migration: 0021_login_attempts_rate_limit.sql
-- Descrição: Cria tabela persistente para controle de rate limiting e auditoria de tentativas de login

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(100),
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time 
ON public.login_attempts (LOWER(email), attempted_at DESC);
