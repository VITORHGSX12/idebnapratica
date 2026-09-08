// =============================================================================
// ROTAS DE AVALIAÇÕES DIAGNÓSTICAS, EVENTOS E SIMULADOS SAEB (MODULAR ENGINE)
// Em conformidade estrita com a especificação AVALIACOES_DIAGNOSTICAS_ESPECIFICACAO_COMPLETA.md
// Submódulos: simulados/simulados_helpers.js, simulados/simulados_eventos_routes.js,
//             simulados/simulados_lancamento_routes.js, simulados/simulados_dashboard_routes.js,
//             simulados/simulados_progressao_routes.js
// =============================================================================

const express = require('express');
const router = express.Router();

const eventosRouter = require('./simulados/simulados_eventos_routes');
const lancamentoRouter = require('./simulados/simulados_lancamento_routes');
const dashboardRouter = require('./simulados/simulados_dashboard_routes');
const progressaoRouter = require('./simulados/simulados_progressao_routes');

router.use('/', eventosRouter);
router.use('/', lancamentoRouter);
router.use('/', dashboardRouter);
router.use('/', progressaoRouter);

module.exports = router;
