/**
 * ============================================================================
 * SCRIPT DE LIMPEZA E RETENÇÃO DE LOGS DE RATE LIMIT (POSTGRESQL NEON)
 * Execução: npm run cleanup:ratelimit ou Agendador Cron Periódico
 * ============================================================================
 */

require('dotenv').config();
const { cleanupOldLoginAttempts } = require('../routes/auth_routes');

async function run() {
    const days = parseInt(process.env.RATE_LIMIT_RETENTION_DAYS || '30', 10);
    console.log('====================================================================');
    console.log(`🧹 INICIANDO EXPURGO DE TENTATIVAS DE LOGIN (RETENÇÃO: ${days} DIAS)`);
    console.log('====================================================================\n');
    
    const count = await cleanupOldLoginAttempts(days);
    console.log(`\n✅ Concluído com sucesso. Registros expurgados: ${count}`);
    process.exit(0);
}

run().catch((err) => {
    console.error('❌ Erro na execução da limpeza:', err);
    process.exit(1);
});
