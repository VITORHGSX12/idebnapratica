// =============================================================================
// ROTAS DE PROGRESSÃO HISTÓRICA DO ALUNO E DIAGNÓSTICO ESCOLAR POR DESCRITOR
// =============================================================================

const express = require('express');
const router = express.Router();
const db = require('../../db');
const { resolveDescriptorInfo } = require('./simulados_helpers');

// -----------------------------------------------------------------------------
// ENDPOINT DE PROGRESSÃO HISTÓRICA DO ALUNO (/api/alunos/:alunoId/progressao)
// -----------------------------------------------------------------------------

router.get(['/alunos/:alunoId/progressao', '/api/alunos/:alunoId/progressao'], async (req, res) => {
    try {
        const { alunoId } = req.params;
        if (!alunoId) {
            return res.status(400).json({ success: false, error: 'Matrícula ou identificador do aluno é obrigatório.' });
        }

        let rows = [];

        if (!db.useLocalFallback) {
            const queryRes = await db.query(`
                SELECT 
                    r.id as "respostaId",
                    r.simulado_id as "simuladoId",
                    r.evento_id as "eventoId",
                    e.titulo as "eventoTitulo",
                    e.data_realizacao as "dataRealizacao",
                    e.disciplina as "eventoDisciplina",
                    COALESCE(e.portugues_inicio, 1) as "portuguesInicio",
                    COALESCE(e.portugues_fim, 10) as "portuguesFim",
                    COALESCE(e.matematica_inicio, 11) as "matematicaInicio",
                    COALESCE(e.matematica_fim, 20) as "matematicaFim",
                    r.escola_id as "escolaId",
                    r.turma_id as "turmaId",
                    r.aluno_id as "alunoId",
                    r.aluno_nome as "alunoNome",
                    r.respostas_json as "respostas",
                    r.status_presenca as "statusPresenca",
                    r.gabarito_json as "gabarito",
                    r.habilidades_json as "habilidades",
                    r.total_acertos as "totalAcertos",
                    r.percentual_acertos as "percentualAcertos",
                    r.situacao,
                    r.atualizado_em as "atualizadoEm"
                FROM respostas_simulado r
                JOIN eventos_simulados e ON r.evento_id = e.id
                WHERE r.aluno_id = $1 
                   OR r.aluno_id IN (
                       SELECT matricula FROM alunos WHERE (matricula = $1 OR id::text = $1)
                       UNION
                       SELECT id::text FROM alunos WHERE (matricula = $1 OR id::text = $1)
                   )
                ORDER BY e.data_realizacao ASC, r.atualizado_em ASC
            `, [alunoId.toString().trim()]);

            if (queryRes && queryRes.rows) {
                rows = queryRes.rows;
            }
        }

        if (rows.length === 0) {
            return res.json({
                success: true,
                alunoId: alunoId,
                totalSimulados: 0,
                simulados: [],
                descritoresConsolidados: [],
                habilidadesConsolidadas: [],
                habilidadesEmAtencao: [],
                habilidadesEmDefasagem: [],
                amostrasPreliminares: [],
                mensagem: 'Nenhum simulado ou avaliação lançado para este estudante até o momento.'
            });
        }

        const globalDescritoresAccumulator = {};
        const simulados = [];

        rows.forEach((row, idx) => {
            const respostas = Array.isArray(row.respostas) ? row.respostas : [];
            const gabarito = Array.isArray(row.gabarito) ? row.gabarito : [];
            const habilidades = Array.isArray(row.habilidades) ? row.habilidades : [];

            const pIni = row.portuguesInicio || 1;
            const pFim = row.portuguesFim || 10;
            const mIni = row.matematicaInicio || 11;
            const mFim = row.matematicaFim || 20;

            let lpTotal = 0, lpAcertos = 0;
            let matTotal = 0, matAcertos = 0;
            let totalValidas = 0, acertosTotal = 0;

            const totalQ = Math.max(gabarito.length, respostas.length);
            const questoesDetalhe = [];
            const simuladoDescritoresMap = {};

            for (let q = 0; q < totalQ; q++) {
                const qNum = q + 1;
                const r = (respostas[q] || '').toString().trim().toUpperCase();
                const g = (gabarito[q] || '').toString().trim().toUpperCase();
                const descCode = habilidades[q] || (qNum <= pFim ? `D${qNum}` : `D${qNum}`);

                const isLP = qNum >= pIni && qNum <= pFim;
                const isMT = qNum >= mIni && qNum <= mFim;
                const disc = isLP ? 'Língua Portuguesa' : (isMT ? 'Matemática' : 'Geral');
                const descInfo = resolveDescriptorInfo(descCode, disc);

                if (isLP) lpTotal++;
                if (isMT) matTotal++;
                totalValidas++;

                const acertou = Boolean(r && g && r === g);
                if (acertou) {
                    acertosTotal++;
                    if (isLP) lpAcertos++;
                    if (isMT) matAcertos++;
                }

                questoesDetalhe.push({
                    numero: qNum,
                    respostaAluno: r || '-',
                    gabaritoOficial: g || '-',
                    acertou: acertou,
                    descritorCodigo: descInfo.codigo,
                    descritorDescricao: descInfo.desc,
                    disciplina: disc,
                    topico: descInfo.topico
                });

                if (!simuladoDescritoresMap[descInfo.codigo]) {
                    simuladoDescritoresMap[descInfo.codigo] = {
                        codigo: descInfo.codigo,
                        descricao: descInfo.desc,
                        disciplina: disc,
                        topico: descInfo.topico,
                        totalQuestoes: 0,
                        acertos: 0
                    };
                }
                simuladoDescritoresMap[descInfo.codigo].totalQuestoes++;
                if (acertou) simuladoDescritoresMap[descInfo.codigo].acertos++;

                if (!globalDescritoresAccumulator[descInfo.codigo]) {
                    globalDescritoresAccumulator[descInfo.codigo] = {
                        codigo: descInfo.codigo,
                        descricao: descInfo.desc,
                        disciplina: disc,
                        topico: descInfo.topico,
                        recomendacao: descInfo.rec,
                        totalQuestoes: 0,
                        acertos: 0
                    };
                }
                globalDescritoresAccumulator[descInfo.codigo].totalQuestoes++;
                if (acertou) globalDescritoresAccumulator[descInfo.codigo].acertos++;
            }

            const pctGeral = totalValidas > 0 ? Number(((acertosTotal / totalValidas) * 100).toFixed(1)) : 0;
            const pctLp = lpTotal > 0 ? Number(((lpAcertos / lpTotal) * 100).toFixed(1)) : 0;
            const pctMat = matTotal > 0 ? Number(((matAcertos / matTotal) * 100).toFixed(1)) : 0;

            const scoreLpEstimado = Math.round(150 + (pctLp * 2.0));
            const scoreMatEstimado = Math.round(150 + (pctMat * 2.0));
            const scoreTotalEstimado = Math.round(150 + (pctGeral * 2.0));

            const descritoresSimulado = Object.values(simuladoDescritoresMap).map(d => ({
                codigo: d.codigo,
                descricao: d.descricao,
                disciplina: d.disciplina,
                topico: d.topico,
                totalQuestoes: d.totalQuestoes,
                acertos: d.acertos,
                percentualAcertos: Number(((d.acertos / d.totalQuestoes) * 100).toFixed(1)),
                status: (d.acertos / d.totalQuestoes) >= 0.75 ? 'CONSOLIDADO' : ((d.acertos / d.totalQuestoes) >= 0.60 ? 'ATENCAO' : 'DEFASAGEM')
            }));

            simulados.push({
                simuladoId: row.simuladoId || row.eventoId,
                eventoId: row.eventoId,
                titulo: row.eventoTitulo || `Simulado ${idx + 1}`,
                dataRealizacao: row.dataRealizacao,
                statusPresenca: row.statusPresenca || 'PRESENTE',
                totalAcertos: acertosTotal,
                totalQuestoes: totalValidas,
                percentualAcerto: pctGeral,
                situacao: row.situacao || (pctGeral >= 80 ? 'AVANÇADO' : (pctGeral >= 60 ? 'ADEQUADO' : (pctGeral >= 40 ? 'BÁSICO' : 'ABAIXO DO BÁSICO'))),
                lp: { acertos: lpAcertos, total: lpTotal, percentual: pctLp, escoreSaeb: scoreLpEstimado },
                mat: { acertos: matAcertos, total: matTotal, percentual: pctMat, escoreSaeb: scoreMatEstimado },
                escoreSaebGeral: scoreTotalEstimado,
                questoesDetalhe: questoesDetalhe,
                descritoresSimulado: descritoresSimulado
            });
        });

        const descritoresConsolidados = Object.values(globalDescritoresAccumulator).map(d => {
            const pct = d.totalQuestoes > 0 ? Number(((d.acertos / d.totalQuestoes) * 100).toFixed(1)) : 0;
            let classificacao = 'CONSOLIDADO';
            let confiabilidade = 'ALTA';

            if (d.totalQuestoes < 2) {
                classificacao = 'PRELIMINAR';
                confiabilidade = 'BAIXA_AMOSTRA';
            } else if (pct < 60.0) {
                classificacao = 'DEFASAGEM';
            } else if (pct < 75.0) {
                classificacao = 'ATENCAO';
            } else {
                classificacao = 'CONSOLIDADO';
            }

            return {
                codigo: d.codigo,
                descricao: d.descricao,
                disciplina: d.disciplina,
                topico: d.topico,
                totalQuestoesAvaliadas: d.totalQuestoes,
                totalAcertos: d.acertos,
                percentualConsolidado: pct,
                classificacao: classificacao,
                confiabilidade: confiabilidade,
                recomendacaoPedagogica: d.recomendacao
            };
        });

        const habilidadesConsolidadas = descritoresConsolidados.filter(d => d.classificacao === 'CONSOLIDADO');
        const habilidadesEmAtencao = descritoresConsolidados.filter(d => d.classificacao === 'ATENCAO');
        const habilidadesEmDefasagem = descritoresConsolidados.filter(d => d.classificacao === 'DEFASAGEM');
        const amostrasPreliminares = descritoresConsolidados.filter(d => d.classificacao === 'PRELIMINAR');

        res.json({
            success: true,
            alunoId: alunoId,
            totalSimulados: simulados.length,
            simulados: simulados,
            descritoresConsolidados: descritoresConsolidados,
            habilidadesConsolidadas: habilidadesConsolidadas,
            habilidadesEmAtencao: habilidadesEmAtencao,
            habilidadesEmDefasagem: habilidadesEmDefasagem,
            amostrasPreliminares: amostrasPreliminares,
            criteriosDiagnostico: {
                limiarDefasagemPct: 60.0,
                limiarConsolidadoPct: 75.0,
                minimoQuestoesAmostra: 2
            }
        });
    } catch (err) {
        console.error('[GET /api/alunos/:alunoId/progressao Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------------------------------------
// ENDPOINT DE AGREGAÇÃO POR ESCOLA → METAS & PDE (CAMADA 4)
// (/api/escolas/:escolaId/diagnostico-descritores)
// -----------------------------------------------------------------------------

router.get('/escolas/:escolaId/diagnostico-descritores', async (req, res) => {
    try {
        const { escolaId } = req.params;
        if (!escolaId) {
            return res.status(400).json({ success: false, error: 'Identificador da escola é obrigatório.' });
        }

        let rows = [];
        if (!db.useLocalFallback) {
            const queryRes = await db.query(`
                SELECT 
                    r.aluno_id as "alunoId",
                    r.aluno_nome as "alunoNome",
                    r.respostas_json as "respostas",
                    r.gabarito_json as "gabarito",
                    r.habilidades_json as "habilidades",
                    r.evento_id as "eventoId",
                    e.titulo as "eventoTitulo",
                    e.data_realizacao as "dataRealizacao"
                FROM respostas_simulado r
                JOIN eventos_simulados e ON r.evento_id::text = e.id::text
                LEFT JOIN turmas t ON t.id::text = r.turma_id::text
                WHERE t.escola_id::text = $1 
                   OR r.escola_id::text = $1
                   OR t.escola_id IN (SELECT id FROM escolas WHERE id::text = $1 OR codigo_inep::text = $1)
            `, [escolaId.toString().trim()]);

            if (queryRes && queryRes.rows) {
                rows = queryRes.rows;
            }
        }

        if (rows.length === 0) {
            return res.json({
                success: true,
                escolaId: escolaId,
                totalAlunosAvaliados: 0,
                descritoresPrioritarios: [],
                mensagem: 'Nenhum simulado com respostas lançadas para estudantes desta escola até o momento.'
            });
        }

        const alunoDescritorStats = {};
        const distinctAlunos = new Set();

        rows.forEach(row => {
            const aId = row.alunoId;
            distinctAlunos.add(aId);
            if (!alunoDescritorStats[aId]) alunoDescritorStats[aId] = {};

            const respostas = Array.isArray(row.respostas) ? row.respostas : [];
            const gabarito = Array.isArray(row.gabarito) ? row.gabarito : [];
            const habilidades = Array.isArray(row.habilidades) ? row.habilidades : [];
            const totalQ = Math.max(gabarito.length, respostas.length);

            for (let q = 0; q < totalQ; q++) {
                const descCode = habilidades[q] || `D${q + 1}`;
                const r = (respostas[q] || '').toString().trim().toUpperCase();
                const g = (gabarito[q] || '').toString().trim().toUpperCase();
                const acertou = Boolean(r && g && r === g);

                if (!alunoDescritorStats[aId][descCode]) {
                    alunoDescritorStats[aId][descCode] = { total: 0, acertos: 0 };
                }
                alunoDescritorStats[aId][descCode].total++;
                if (acertou) alunoDescritorStats[aId][descCode].acertos++;
            }
        });

        const descritoresEscola = {};

        Object.keys(alunoDescritorStats).forEach(aId => {
            const studentStats = alunoDescritorStats[aId];
            Object.keys(studentStats).forEach(descCode => {
                const st = studentStats[descCode];
                const pct = st.total > 0 ? (st.acertos / st.total) * 100 : 0;
                const emDefasagem = st.total >= 2 ? pct < 60.0 : pct < 50.0;

                if (!descritoresEscola[descCode]) {
                    const descInfo = resolveDescriptorInfo(descCode);
                    descritoresEscola[descCode] = {
                        codigo: descCode,
                        descricao: descInfo.desc,
                        disciplina: descInfo.disc,
                        topico: descInfo.topico,
                        recomendacao: descInfo.rec,
                        totalAlunosAvaliados: 0,
                        alunosEmDefasagem: 0
                    };
                }

                descritoresEscola[descCode].totalAlunosAvaliados++;
                if (emDefasagem) {
                    descritoresEscola[descCode].alunosEmDefasagem++;
                }
            });
        });

        const totalAlunos = distinctAlunos.size;
        const descritoresPrioritarios = Object.values(descritoresEscola)
            .map(d => {
                const taxa = d.totalAlunosAvaliados > 0 ? Number(((d.alunosEmDefasagem / d.totalAlunosAvaliados) * 100).toFixed(1)) : 0;
                let prioridade = 'BAIXA';
                if (taxa >= 40.0) prioridade = 'ALTA';
                else if (taxa >= 25.0) prioridade = 'MEDIA';

                return {
                    codigo: d.codigo,
                    descricao: d.descricao,
                    disciplina: d.disciplina,
                    topico: d.topico,
                    totalAlunosAvaliados: d.totalAlunosAvaliados,
                    alunosEmDefasagem: d.alunosEmDefasagem,
                    taxaDefasagemPct: taxa,
                    prioridadePDE: prioridade,
                    sugestaoPlanoAcao: d.recomendacao
                };
            })
            .sort((a, b) => b.taxaDefasagemPct - a.taxaDefasagemPct);

        res.json({
            success: true,
            escolaId: escolaId,
            totalAlunosAvaliados: totalAlunos,
            descritoresPrioritarios: descritoresPrioritarios
        });
    } catch (err) {
        console.error('[GET /api/escolas/:escolaId/diagnostico-descritores Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
