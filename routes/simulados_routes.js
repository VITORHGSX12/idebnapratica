// =============================================================================
// ROTAS DE AVALIAÇÕES DIAGNÓSTICAS, EVENTOS E SIMULADOS SAEB (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const diagnosticoService = require('../services/diagnostico/diagnosticoService');
const { authMiddleware } = require('../middleware/auth');

// Banco em memória / fallback de eventos e respostas
let dbEventosSimulados = [
    {
        id: 'evt_2026_01',
        titulo: '1º Simulado Municipal SAEB 2026 — 5º e 9º Anos',
        dataRealizacao: '2026-09-15',
        disciplina: 'ambas',
        portuguesInicio: 1,
        portuguesFim: 10,
        matematicaInicio: 11,
        matematicaFim: 20,
        status: 'ABERTO',
        passoAtivo: 4,
        qtdQuestoes: 20,
        etapasAlvo: ['5º Ano', '9º Ano'],
        gabaritoGeralJson: JSON.stringify([
            {
                etapaNome: '5º Ano',
                qtdQuestoes: 20,
                gabarito: ['A','B','C','D','A','C','B','D','A','B','C','D','A','B','C','D','A','B','C','D'],
                habilidades: ['LP01','LP02','LP03','LP05','LP07','LP12','LP17','LP21','LP23','LP31','MT01','MT02','MT03','MT05','MT06','MT15','MT16','MT22','MT27','MT28']
            }
        ]),
        turmas: [],
        criadoEm: '2026-08-20T08:00:00.000Z'
    }
];

let dbRespostasSimulados = {};

// -----------------------------------------------------------------------------
// 1. ENDPOINTS DE EVENTOS AVALIATIVOS (/api/eventos-simulado)
// -----------------------------------------------------------------------------

router.get('/eventos-simulado', (req, res) => {
    res.json({ success: true, eventos: dbEventosSimulados });
});

router.post('/eventos-simulado', (req, res) => {
    try {
        const body = req.body || {};
        const id = body.id || `evt_${Date.now()}`;
        const evento = {
            id,
            titulo: body.titulo || 'Novo Simulado',
            dataRealizacao: body.dataRealizacao || new Date().toISOString().split('T')[0],
            disciplina: body.disciplina || 'ambas',
            portuguesInicio: body.portuguesInicio || 1,
            portuguesFim: body.portuguesFim || 20,
            matematicaInicio: body.matematicaInicio || 1,
            matematicaFim: body.matematicaFim || 20,
            status: body.status || 'ABERTO',
            passoAtivo: body.passoAtivo || 4,
            qtdQuestoes: body.qtdQuestoes || 20,
            gabaritoGeralJson: body.gabaritoGeralJson || '[]',
            etapasAlvo: body.etapasAlvo || ['5º Ano'],
            turmas: body.turmas || [],
            criadoEm: body.criadoEm || new Date().toISOString()
        };

        const idx = dbEventosSimulados.findIndex(e => e.id === id);
        if (idx !== -1) {
            dbEventosSimulados[idx] = evento;
        } else {
            dbEventosSimulados.push(evento);
        }

        res.status(201).json({ success: true, evento });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.patch('/eventos-simulado/:id/encerrar', (req, res) => {
    const { id } = req.params;
    const ev = dbEventosSimulados.find(e => e.id === id);
    if (!ev) return res.status(404).json({ success: false, error: 'Evento não encontrado.' });

    ev.status = 'ENCERRADO';
    res.json({ success: true, evento: ev });
});

router.patch('/eventos-simulado/:id/reabrir', (req, res) => {
    const { id } = req.params;
    const ev = dbEventosSimulados.find(e => e.id === id);
    if (!ev) return res.status(404).json({ success: false, error: 'Evento não encontrado.' });

    ev.status = 'ABERTO';
    res.json({ success: true, evento: ev });
});

router.delete('/eventos-simulado/:id', (req, res) => {
    const { id } = req.params;
    dbEventosSimulados = dbEventosSimulados.filter(e => e.id !== id);
    res.json({ success: true, message: 'Evento excluído com sucesso.' });
});

// -----------------------------------------------------------------------------
// 2. ENDPOINTS DE LANÇAMENTO DE RESPOSTAS (/api/simulados)
// -----------------------------------------------------------------------------

router.get('/simulados/evento/:eventoId/escola/:escolaId/turma/:turmaId', (req, res) => {
    const { eventoId, escolaId, turmaId } = req.params;
    const key = `${eventoId}_${escolaId}_${turmaId}`;
    const data = dbRespostasSimulados[key] || null;

    if (!data) return res.status(204).send();
    res.json({ success: true, respostas: data });
});

router.post('/simulados', (req, res) => {
    try {
        const { eventoId, escolaId, turmaId, respostasAlunos, titulo, disciplina } = req.body || {};
        if (!eventoId || !escolaId || !turmaId) {
            return res.status(400).json({ success: false, error: 'Parâmetros obrigatórios ausentes.' });
        }

        const key = `${eventoId}_${escolaId}_${turmaId}`;
        dbRespostasSimulados[key] = {
            eventoId,
            escolaId,
            turmaId,
            titulo: titulo || 'Simulado',
            disciplina: disciplina || 'ambas',
            respostasAlunos: respostasAlunos || [],
            atualizadoEm: new Date().toISOString()
        };

        res.status(200).json({ success: true, message: 'Lote de respostas gravado com sucesso.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/simulados/dashboard/turma', (req, res) => {
    try {
        const { eventoIds = [], escolaIds = [], turmaIds = [] } = req.body || {};
        res.json({
            success: true,
            mediaTurma: 14.8,
            totalMatriculados: 25,
            totalPresentes: 23,
            totalAusentes: 2,
            taxaParticipacao: 92.0,
            distribuicao: {
                avancado: 5,
                adequado: 11,
                basico: 5,
                abaixoBasico: 2
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------------------------------------
// 3. ENDPOINTS DE ANALYTICS & IA (DIAGNÓSTICO SAEB)
// -----------------------------------------------------------------------------

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

        const totalAlunosAvaliados = descritores.length > 0 ? descritores[0].total_alunos_avaliados : 0;
        const totalAcertos = descritores.reduce((sum, d) => sum + d.total_acertos, 0);
        const totalRespostas = descritores.reduce((sum, d) => sum + d.total_respostas, 0);
        const mediaGeralAcerto = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 1000) / 10 : 0;
        const descritoresCriticos = descritores.filter(d => d.classificacao === 'critico');

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
