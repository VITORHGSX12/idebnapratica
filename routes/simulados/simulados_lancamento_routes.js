// =============================================================================
// ROTAS DE LANÇAMENTO E PERSISTÊNCIA DE RESPOSTAS (/api/simulados)
// =============================================================================

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { validateSchoolAccess, calcularResultadoAluno, memoryRespostasSimulados } = require('./simulados_helpers');

router.get('/simulados/evento/:eventoId/escola/:escolaId/turma/:turmaId', async (req, res) => {
    try {
        const { eventoId, escolaId, turmaId } = req.params;

        // Validação de Segurança Fail-Closed
        if (!validateSchoolAccess(req, escolaId, turmaId)) {
            return res.status(403).json({ success: false, error: 'Acesso negado para a escola/turma solicitada.' });
        }

        if (!db.useLocalFallback) {
            const simuladoQuery = await db.query(`
                SELECT id, evento_id as "eventoId", escola_id as "escolaId", turma_id as "turmaId", titulo, disciplina, atualizado_em as "atualizadoEm"
                FROM simulados
                WHERE evento_id = $1 AND escola_id = $2 AND turma_id = $3
            `, [eventoId, escolaId, turmaId]);

            if (simuladoQuery && simuladoQuery.rows && simuladoQuery.rows.length > 0) {
                const simulado = simuladoQuery.rows[0];
                const respostasQuery = await db.query(`
                    SELECT 
                        aluno_id as "alunoId",
                        aluno_nome as "alunoNome",
                        respostas_json as "respostas",
                        status_presenca as "statusPresenca",
                        gabarito_json as "gabarito",
                        habilidades_json as "habilidades",
                        total_acertos as "totalAcertos",
                        percentual_acertos as "percentualAcertos",
                        situacao
                    FROM respostas_simulado
                    WHERE simulado_id = $1
                    ORDER BY aluno_nome ASC, aluno_id ASC
                `, [simulado.id]);

                return res.json({
                    success: true,
                    respostas: {
                        id: simulado.id,
                        eventoId: simulado.eventoId,
                        escolaId: simulado.escolaId,
                        turmaId: simulado.turmaId,
                        titulo: simulado.titulo,
                        disciplina: simulado.disciplina,
                        respostasAlunos: respostasQuery.rows || [],
                        atualizadoEm: simulado.atualizadoEm
                    }
                });
            }
        }

        const key = `${eventoId}_${escolaId}_${turmaId}`;
        const data = memoryRespostasSimulados[key] || null;
        if (!data) return res.status(204).send();
        res.json({ success: true, respostas: data });
    } catch (err) {
        console.warn('[Simulados GET Fallback]', err.message);
        const key = `${req.params.eventoId}_${req.params.escolaId}_${req.params.turmaId}`;
        const data = memoryRespostasSimulados[key] || null;
        if (!data) return res.status(204).send();
        res.json({ success: true, respostas: data });
    }
});

router.post('/simulados', async (req, res) => {
    try {
        const { eventoId, escolaId, turmaId, respostasAlunos = [], titulo, disciplina } = req.body || {};
        if (!eventoId || !escolaId || !turmaId) {
            return res.status(400).json({ success: false, error: 'Parâmetros obrigatórios (eventoId, escolaId, turmaId) ausentes.' });
        }

        // 1. Validação de Segurança Fail-Closed
        if (!validateSchoolAccess(req, escolaId, turmaId)) {
            return res.status(403).json({ success: false, error: 'Acesso negado para a escola/turma solicitada.' });
        }

        // 2. Trava de Segurança de Evento ENCERRADO
        if (!db.useLocalFallback) {
            const evStatusRes = await db.query('SELECT status FROM eventos_simulados WHERE id = $1', [eventoId]);
            if (evStatusRes && evStatusRes.rows && evStatusRes.rows.length > 0) {
                if (evStatusRes.rows[0].status === 'ENCERRADO') {
                    return res.status(403).json({
                        success: false,
                        error: 'Este evento avaliativo está ENCERRADO. O lançamento e edição de notas estão bloqueados.'
                    });
                }
            }
        }

        const simuladoId = `${eventoId}_${escolaId}_${turmaId}`;

        if (!db.useLocalFallback) {
            // Upsert na tabela simulados
            await db.query(`
                INSERT INTO simulados (id, evento_id, escola_id, turma_id, titulo, disciplina, atualizado_em)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (evento_id, escola_id, turma_id) DO UPDATE SET
                    titulo = EXCLUDED.titulo,
                    disciplina = EXCLUDED.disciplina,
                    atualizado_em = NOW()
            `, [simuladoId, eventoId, escolaId.toString(), turmaId.toString(), titulo || 'Simulado', disciplina || 'ambas']);

            // Upsert em lote das respostas dos alunos
            for (const item of respostasAlunos) {
                const alunoId = item.alunoId ? item.alunoId.toString() : '';
                if (!alunoId) continue;

                const calculo = calcularResultadoAluno(item.respostas, item.gabarito, item.statusPresenca);

                await db.query(`
                    INSERT INTO respostas_simulado (
                        simulado_id, evento_id, escola_id, turma_id,
                        aluno_id, aluno_nome, respostas_json, status_presenca,
                        gabarito_json, habilidades_json, total_acertos, percentual_acertos,
                        situacao, atualizado_em
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                    ON CONFLICT (simulado_id, aluno_id) DO UPDATE SET
                        respostas_json = EXCLUDED.respostas_json,
                        status_presenca = EXCLUDED.status_presenca,
                        gabarito_json = EXCLUDED.gabarito_json,
                        habilidades_json = EXCLUDED.habilidades_json,
                        total_acertos = EXCLUDED.total_acertos,
                        percentual_acertos = EXCLUDED.percentual_acertos,
                        situacao = EXCLUDED.situacao,
                        atualizado_em = NOW()
                `, [
                    simuladoId, eventoId, escolaId.toString(), turmaId.toString(),
                    alunoId, item.alunoNome || null,
                    JSON.stringify(item.respostas || []),
                    (item.statusPresenca || 'PRESENTE').toUpperCase(),
                    JSON.stringify(item.gabarito || []),
                    JSON.stringify(item.habilidades || []),
                    calculo.totalAcertos,
                    calculo.percentualAcertos,
                    calculo.situacao
                ]);
            }
        }

        // Atualizar também na memória como fallback de alta velocidade
        memoryRespostasSimulados[simuladoId] = {
            eventoId,
            escolaId,
            turmaId,
            titulo: titulo || 'Simulado',
            disciplina: disciplina || 'ambas',
            respostasAlunos: respostasAlunos || [],
            atualizadoEm: new Date().toISOString()
        };

        res.status(200).json({ success: true, message: 'Lote de respostas gravado com sucesso no PostgreSQL.' });
    } catch (err) {
        console.error('[POST /simulados Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
