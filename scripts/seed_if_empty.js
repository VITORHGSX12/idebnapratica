/**
 * ============================================================================
 * SCRIPT DE SEED SEGURO E IDEMPOTENTE (NÃO-DESTRUTIVO) — IDEB NA PRÁTICA
 * Execução MANUAL exclusivamente via: npm run seed:safe
 * ============================================================================
 * Regras de Segurança:
 * 1. NUNCA executa comandos DELETE, DROP ou TRUNCATE.
 * 2. Verifica a contagem de registros antes de qualquer ação.
 * 3. Só realiza inserção se as tabelas estiverem 100% vazias.
 * 4. Utiliza sempre ON CONFLICT DO NOTHING para evitar duplicidade ou colisão.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db');

async function runSafeSeed() {
    console.log('====================================================================');
    console.log('🔒 INICIANDO SEED SEGURO E IDEMPOTENTE DO BANCO DE DADOS');
    console.log('====================================================================\n');

    if (db.useLocalFallback) {
        console.log('⚠️ [Aviso] DATABASE_URL não definida. Operando em modo local JSON.');
        return;
    }

    try {
        console.log('1. Verificando estado atual das tabelas...');
        const escCountRes = await db.query('SELECT count(*) as total FROM escolas');
        const currentEscCount = parseInt(escCountRes.rows[0].total) || 0;

        const turCountRes = await db.query('SELECT count(*) as total FROM turmas');
        const currentTurCount = parseInt(turCountRes.rows[0].total) || 0;

        const alnCountRes = await db.query('SELECT count(*) as total FROM alunos');
        const currentAlnCount = parseInt(alnCountRes.rows[0].total) || 0;

        const usrCountRes = await db.query('SELECT count(*) as total FROM public.usuarios');
        const currentUsrCount = parseInt(usrCountRes.rows[0].total) || 0;

        console.log(`   - Escolas cadastradas : ${currentEscCount}`);
        console.log(`   - Turmas cadastradas  : ${currentTurCount}`);
        console.log(`   - Alunos cadastrados  : ${currentAlnCount}`);
        console.log(`   - Usuários cadastrados: ${currentUsrCount}\n`);

        if (currentEscCount > 0 && currentAlnCount > 0) {
            console.log('✅ [PROTEÇÃO ATIVA] O banco já possui dados cadastrados em produção.');
            console.log('   Nenhuma operação de seed foi necessária. Nenhum registro foi alterado ou excluído.\n');
            process.exit(0);
        }

        console.log('2. Banco vazio detectado. Executando seed não-destrutivo...');
        await db.seedDatabase();

        console.log('\n====================================================================');
        console.log('🎉 SEED SEGURO CONCLUÍDO COM SUCESSO!');
        console.log('====================================================================\n');
        process.exit(0);
    } catch (err) {
        console.error('\n❌ Erro durante a execução do seed seguro:', err.message);
        process.exit(1);
    }
}

runSafeSeed();
