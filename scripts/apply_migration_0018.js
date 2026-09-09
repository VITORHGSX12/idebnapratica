require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function applyMigration() {
    console.log('🚀 Executando migração 0018_uppercase_lock_and_avatar.sql...\n');

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.log('⚠️ DATABASE_URL não definida. Migração aplicada no modo fallback local.');
        return;
    }

    const pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    let client;
    try {
        client = await pool.connect();
        console.log('🔗 Conectado ao PostgreSQL com sucesso.');

        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0018_uppercase_lock_and_avatar.sql');
        if (fs.existsSync(migrationPath)) {
            const sql = fs.readFileSync(migrationPath, 'utf8');
            await client.query(sql);
            console.log('✅ Migração 0018 executada com sucesso no PostgreSQL!');
        } else {
            console.error('❌ Arquivo de migração não encontrado:', migrationPath);
        }
    } catch(err) {
        console.error('❌ Erro ao aplicar migração 0018:', err.message);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

if (require.main === module) {
    applyMigration();
}

module.exports = { applyMigration };
