// =============================================================================
// ROTAS DE EVENTOS AVALIATIVOS (/api/eventos-simulado)
// =============================================================================

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { memoryEventosSimulados, memoryRespostasSimulados, recalcularRespostasEvento } = require('./simulados_helpers');

router.get('/eventos-simulado', async (req, res) => {
    try {
        if (!db.useLocalFallback) {
            const queryRes = await db.query(`
                SELECT 
                    id, titulo, data_realizacao as "dataRealizacao", disciplina,
                    portugues_inicio as "portuguesInicio", portugues_fim as "portuguesFim",
                    matematica_inicio as "matematicaInicio", matematica_fim as "matematicaFim",
                    status, passo_ativo as "passoAtivo", qtd_questoes as "qtdQuestoes",
                    gabarito_geral_json as "gabaritoGeralJson",
                    etapas_alvo as "etapasAlvo",
                    turmas,
                    gabarito_alterado_em as "gabaritoAlteradoEm",
                    recalculado_em as "recalculadoEm",
                    criado_em as "criadoEm", atualizado_em as "atualizadoEm"
                FROM eventos_simulados
                ORDER BY criado_em DESC
            `);
            if (queryRes && Array.isArray(queryRes.rows)) {
                return res.json({ success: true, eventos: queryRes.rows });
            }
        }
        res.json({ success: true, eventos: memoryEventosSimulados });
    } catch (err) {
        console.warn('[Eventos API Fallback]', err.message);
        res.json({ success: true, eventos: memoryEventosSimulados });
    }
});

router.post('/eventos-simulado', async (req, res) => {
    try {
        const body = req.body || {};
        const id = body.id || `evt_${Date.now()}`;
        const titulo = body.titulo || 'Novo Simulado';
        const dataRealizacao = body.dataRealizacao || new Date().toISOString().split('T')[0];
        const disciplina = body.disciplina || 'ambas';
        const portuguesInicio = parseInt(body.portuguesInicio) || 1;
        const portuguesFim = parseInt(body.portuguesFim) || 10;
        const matematicaInicio = parseInt(body.matematicaInicio) || 11;
        const matematicaFim = parseInt(body.matematicaFim) || 20;
        const status = body.status || 'ABERTO';
        const passoAtivo = parseInt(body.passoAtivo) || 4;
        const qtdQuestoes = parseInt(body.qtdQuestoes) || 20;
        
        let gabaritoGeralJson = body.gabaritoGeralJson;
        if (typeof gabaritoGeralJson === 'string') {
            try { gabaritoGeralJson = JSON.parse(gabaritoGeralJson); } catch(e) { gabaritoGeralJson = []; }
        }
        
        const etapasAlvo = body.etapasAlvo || ['5º Ano'];
        const turmas = body.turmas || [];

        let recalculou = false;
        let totalRecalculados = 0;
        let recalculadoEm = null;

        if (!db.useLocalFallback) {
            // Verificar se o evento já existia e se o gabarito mudou
            const existingEvRes = await db.query('SELECT gabarito_geral_json FROM eventos_simulados WHERE id = $1', [id]);
            const isExisting = existingEvRes && existingEvRes.rows && existingEvRes.rows.length > 0;
            const oldGabStr = isExisting ? JSON.stringify(existingEvRes.rows[0].gabarito_geral_json || []) : null;
            const newGabStr = JSON.stringify(gabaritoGeralJson || []);
            const gabaritoMudou = isExisting && oldGabStr !== newGabStr;

            await db.query(`
                INSERT INTO eventos_simulados (
                    id, titulo, data_realizacao, disciplina,
                    portugues_inicio, portugues_fim, matematica_inicio, matematica_fim,
                    status, passo_ativo, qtd_questoes, gabarito_geral_json, etapas_alvo, turmas,
                    gabarito_alterado_em, atualizado_em
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CASE WHEN $15::boolean THEN NOW() ELSE NULL END, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    titulo = EXCLUDED.titulo,
                    data_realizacao = EXCLUDED.data_realizacao,
                    disciplina = EXCLUDED.disciplina,
                    portugues_inicio = EXCLUDED.portugues_inicio,
                    portugues_fim = EXCLUDED.portugues_fim,
                    matematica_inicio = EXCLUDED.matematica_inicio,
                    matematica_fim = EXCLUDED.matematica_fim,
                    status = EXCLUDED.status,
                    passo_ativo = EXCLUDED.passo_ativo,
                    qtd_questoes = EXCLUDED.qtd_questoes,
                    gabarito_geral_json = EXCLUDED.gabarito_geral_json,
                    etapas_alvo = EXCLUDED.etapas_alvo,
                    turmas = EXCLUDED.turmas,
                    gabarito_alterado_em = CASE WHEN $15::boolean THEN NOW() ELSE eventos_simulados.gabarito_alterado_em END,
                    atualizado_em = NOW()
            `, [
                id, titulo, dataRealizacao, disciplina,
                portuguesInicio, portuguesFim, matematicaInicio, matematicaFim,
                status, passoAtivo, qtdQuestoes, JSON.stringify(gabaritoGeralJson),
                JSON.stringify(etapasAlvo), JSON.stringify(turmas),
                gabaritoMudou
            ]);

            // Se turmas informadas, persistir na tabela relacional de turmas
            if (Array.isArray(turmas) && turmas.length > 0) {
                for (const t of turmas) {
                    const turmaId = t.turmaId || t.id;
                    if (!turmaId) continue;
                    await db.query(`
                        INSERT INTO eventos_simulados_turmas (
                            evento_id, turma_id, escola_id, modo_gabarito, num_questoes, gabarito_json, habilidades_json
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (evento_id, turma_id) DO UPDATE SET
                            modo_gabarito = EXCLUDED.modo_gabarito,
                            num_questoes = EXCLUDED.num_questoes,
                            gabarito_json = EXCLUDED.gabarito_json,
                            habilidades_json = EXCLUDED.habilidades_json
                    `, [
                        id, turmaId.toString(), t.escolaId || null, t.modoGabarito || 'GERAL',
                        t.numQuestoes || qtdQuestoes, JSON.stringify(t.gabaritoJson || []),
                        JSON.stringify(t.habilidadesJson || [])
                    ]);
                }
            }

            // Disparar recálculo em cascata de todas as respostas já submetidas
            if (isExisting && (gabaritoMudou || body.forcarRecalculo === true)) {
                const recRes = await recalcularRespostasEvento(id, gabaritoGeralJson);
                recalculou = true;
                totalRecalculados = recRes.totalRecalculados;
                recalculadoEm = recRes.recalculadoEm;
            }
        } else {
            // Em modo fallback local
            if (Array.isArray(gabaritoGeralJson) && gabaritoGeralJson.length > 0) {
                const recRes = await recalcularRespostasEvento(id, gabaritoGeralJson);
                recalculou = true;
                totalRecalculados = recRes.totalRecalculados;
                recalculadoEm = recRes.recalculadoEm;
            }
        }

        const eventoObj = {
            id, titulo, dataRealizacao, disciplina,
            portuguesInicio, portuguesFim, matematicaInicio, matematicaFim,
            status, passoAtivo, qtdQuestoes,
            gabaritoGeralJson: JSON.stringify(gabaritoGeralJson),
            etapasAlvo, turmas,
            recalculadoEm,
            criadoEm: new Date().toISOString()
        };

        const idx = memoryEventosSimulados.findIndex(e => e.id === id);
        if (idx !== -1) memoryEventosSimulados[idx] = eventoObj;
        else memoryEventosSimulados.push(eventoObj);

        res.status(201).json({ 
            success: true, 
            evento: eventoObj,
            recalculo: {
                executado: recalculou,
                totalAlunosRecalculados: totalRecalculados,
                recalculadoEm: recalculadoEm
            }
        });
    } catch (err) {
        console.error('[POST /eventos-simulado Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Endpoint explícito para forçar recálculo em massa de um evento
router.post('/eventos-simulado/:id/recalcular', async (req, res) => {
    try {
        const { id } = req.params;
        let gabaritoGeral = [];

        if (!db.useLocalFallback) {
            const evRes = await db.query('SELECT gabarito_geral_json FROM eventos_simulados WHERE id = $1', [id]);
            if (!evRes || !evRes.rows || evRes.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Evento não encontrado.' });
            }
            gabaritoGeral = evRes.rows[0].gabarito_geral_json || [];
        } else {
            const ev = memoryEventosSimulados.find(e => e.id === id);
            if (!ev) return res.status(404).json({ success: false, error: 'Evento não encontrado.' });
            try { gabaritoGeral = JSON.parse(ev.gabaritoGeralJson || '[]'); } catch(e) { gabaritoGeral = []; }
        }

        const recRes = await recalcularRespostasEvento(id, gabaritoGeral);
        res.json({
            success: true,
            eventoId: id,
            totalAlunosRecalculados: recRes.totalRecalculados,
            recalculadoEm: recRes.recalculadoEm,
            message: `Recálculo concluído com sucesso para ${recRes.totalRecalculados} registro(s) de respostas.`
        });
    } catch (err) {
        console.error('[POST /eventos-simulado/:id/recalcular Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/eventos-simulado/:id/encerrar', async (req, res) => {
    try {
        const { id } = req.params;
        if (!db.useLocalFallback) {
            const queryRes = await db.query(`
                UPDATE eventos_simulados 
                SET status = 'ENCERRADO', atualizado_em = NOW() 
                WHERE id = $1 
                RETURNING *
            `, [id]);
            if (queryRes && queryRes.rows && queryRes.rows.length > 0) {
                return res.json({ success: true, evento: queryRes.rows[0] });
            }
        }

        const ev = memoryEventosSimulados.find(e => e.id === id);
        if (!ev) return res.status(404).json({ success: false, error: 'Evento não encontrado.' });
        ev.status = 'ENCERRADO';
        res.json({ success: true, evento: ev });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/eventos-simulado/:id/reabrir', async (req, res) => {
    try {
        const { id } = req.params;
        if (!db.useLocalFallback) {
            const queryRes = await db.query(`
                UPDATE eventos_simulados 
                SET status = 'ABERTO', atualizado_em = NOW() 
                WHERE id = $1 
                RETURNING *
            `, [id]);
            if (queryRes && queryRes.rows && queryRes.rows.length > 0) {
                return res.json({ success: true, evento: queryRes.rows[0] });
            }
        }

        const ev = memoryEventosSimulados.find(e => e.id === id);
        if (!ev) return res.status(404).json({ success: false, error: 'Evento não encontrado.' });
        ev.status = 'ABERTO';
        res.json({ success: true, evento: ev });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.delete('/eventos-simulado/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!db.useLocalFallback) {
            try {
                await db.query('DELETE FROM respostas_simulados WHERE evento_id = $1', [id]);
                await db.query('DELETE FROM eventos_simulados_turmas WHERE evento_id = $1', [id]);
                await db.query('DELETE FROM eventos_simulados WHERE id = $1', [id]);
            } catch(dbErr) {
                console.warn('[DELETE Evento DB Warning]', dbErr.message);
            }
        }
        
        const idx = memoryEventosSimulados.findIndex(e => e.id === id);
        if (idx !== -1) memoryEventosSimulados.splice(idx, 1);
        
        if (typeof memoryRespostasSimulados === 'object' && memoryRespostasSimulados !== null) {
            Object.keys(memoryRespostasSimulados).forEach(key => {
                if (key.startsWith(id + '_') || key === id) {
                    delete memoryRespostasSimulados[key];
                }
            });
        }
        
        res.json({ success: true, message: 'Evento avaliativo e respostas associadas excluídos com sucesso.' });
    } catch (err) {
        console.error('[DELETE /eventos-simulado Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
