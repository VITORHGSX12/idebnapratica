-- =============================================================================
-- MIGRATION 0016: LIMPEZA DE TURMAS ÓRFÃS/RESIDUAIS SEM ESCOLA VINCULADA
-- =============================================================================
-- Remove com segurança registros de turmas residuais (escola_id IS NULL) que
-- não possuem nenhum vínculo com alunos, garantindo integridade relacional
-- e evitando contagens fantasmas em relatórios globais.

BEGIN;

-- 1. Remover com segurança apenas turmas sem escola_id e com 0 alunos vinculados
DELETE FROM turmas
WHERE escola_id IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM alunos a WHERE a.turma_id = turmas.id
  );

COMMIT;
