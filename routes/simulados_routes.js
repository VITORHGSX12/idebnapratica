// =============================================================================
// ROTAS DE DIAGNÓSTICO PEDAGÓGICO, SIMULADOS E LAUDOS SAEB (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const diagnosticoService = require('../services/diagnostico/diagnosticoService');
const { authMiddleware } = require('../middleware/auth');

// POST /api/diagnostico/calcular - Cálculo de desempenho por descritor e ranking
router.post('/diagnostico/calcular', async (req, res) => {
    try {
        const {
            escola_id = 'all',
            turma_nome = 'all',
            componente = 'all',
            simulado_id = 'sim_2026_02'
        } = req.body || {};

        const descritores = diagnosticoService.calcularDesempenhoPorDescritor({
            escola_id,
            turma_nome,
            componente,
            simulado_id
        });

        const rankingEscolas = diagnosticoService.calcularRankingEscolas({
            componente
        });

        // Calcular Métricas do Resumo Geral (Cards Topo)
        const totalAlunosAvaliados = descritores.length > 0 ? descritores[0].total_alunos_avaliados : 0;
        const totalAcertos = descritores.reduce((sum, d) => sum + d.total_acertos, 0);
        const totalRespostas = descritores.reduce((sum, d) => sum + d.total_respostas, 0);
        const mediaGeralAcerto = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 1000) / 10 : 0;

        const descritoresCriticos = descritores.filter(d => d.classificacao === 'critico');

        // Calcular variação média geral entre simulados
        const variacaoMedia = rankingEscolas.length > 0 
            ? Math.round((rankingEscolas.reduce((acc, e) => acc + e.variacao_desde_ultimo_simulado, 0) / rankingEscolas.length) * 10) / 10
            : 0;

        res.json({
            success: true,
            resumo: {
                total_alunos: totalAlunosAvaliados,
                media_geral_acerto: mediaGeralAcerto,
                variacao_ultimo_simulado: variacaoMedia,
                qtd_descritores_criticos: descritoresCriticos.length
            },
            descritores,
            ranking_escolas: rankingEscolas,
            simulados_disponiveis: diagnosticoService.SIMULADOS_OFICIAIS_DB
        });
    } catch (err) {
        console.error('[API Diagnóstico Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/diagnostico/evolucao-aluno - Histórico evolutivo individual do aluno
router.post('/diagnostico/evolucao-aluno', (req, res) => {
    try {
        const { aluno_id } = req.body || {};
        const evolucao = diagnosticoService.calcularEvolucaoAluno(aluno_id);
        if (!evolucao) {
            return res.status(404).json({ success: false, error: 'Aluno não localizado.' });
        }
        res.json({ success: true, evolucao });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/diagnostico/ficha-aluno - Ficha diagnóstica e nível de proficiência
router.post('/diagnostico/ficha-aluno', (req, res) => {
    try {
        const { aluno_id, simulado_id = 'sim_2026_02' } = req.body || {};
        const ficha = diagnosticoService.calcularFichaAluno(aluno_id, simulado_id);
        if (!ficha) {
            return res.status(404).json({ success: false, error: 'Ficha do aluno não localizada.' });
        }
        res.json({ success: true, ficha });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/diagnostico/intervencao-ia - Sugestão de intervenção pedagógica
router.post('/diagnostico/intervencao-ia', async (req, res) => {
    try {
        const { descritoresCriticos, turmaNome, escolaNome } = req.body || {};
        const planoTexto = await diagnosticoService.gerarSugestaoIntervencao(descritoresCriticos, turmaNome, escolaNome);
        res.json({ success: true, plano: planoTexto });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
