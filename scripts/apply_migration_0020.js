const fs = require('fs');
const path = require('path');
const db = require('../db');

async function applyMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/0020_recalculo_gabarito_audit.sql'), 'utf8');
        console.log('Aplicando migration 0020 no PostgreSQL Neon...');
        await db.query(sql);
        console.log('✅ Migration 0020 aplicada com sucesso!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro ao aplicar migration 0020:', e);
        process.exit(1);
    }
}

applyMigration();
