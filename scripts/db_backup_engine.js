const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runBackup() {
    console.log('====================================================');
    console.log('🚀 INICIANDO BACKUP COMPLETO DO BANCO DE PRODUÇÃO');
    console.log('====================================================\n');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const sqlFileName = `db_backup_${timestamp}.sql`;
    const jsonFileName = `db_backup_${timestamp}.json`;
    const sqlFilePath = path.join(backupDir, sqlFileName);
    const jsonFilePath = path.join(backupDir, jsonFileName);

    let sqlOutput = `-- ====================================================\n`;
    sqlOutput += `-- BACKUP COMPLETO DO BANCO DE DADOS - GESTÃO EDUCACIONAL SAAS\n`;
    sqlOutput += `-- Gerado em: ${new Date().toISOString()}\n`;
    sqlOutput += `-- ====================================================\n\n`;
    sqlOutput += `BEGIN;\n\n`;

    const tablesRes = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
    `);

    const tables = tablesRes.rows.map(r => r.table_name);
    console.log(`📋 Tabelas identificadas (${tables.length}):`, tables.join(', '));
    console.log('\n--- Contagem e Extração de Registros ---');

    const stats = {};
    const fullJsonBackup = {
        metadata: {
            generatedAt: new Date().toISOString(),
            environment: 'production',
            tablesCount: tables.length
        },
        tables: {}
    };

    for (const table of tables) {
        try {
            const dataRes = await pool.query(`SELECT * FROM "${table}"`);
            const rows = dataRes.rows;
            const count = rows.length;
            stats[table] = count;
            fullJsonBackup.tables[table] = rows;

            console.log(`  • ${table.padEnd(25)} : ${String(count).padStart(5)} registros`);

            if (count > 0) {
                sqlOutput += `-- Tabela: ${table} (${count} registros)\n`;
                const cols = Object.keys(rows[0]);
                const colsQuoted = cols.map(c => `"${c}"`).join(', ');

                for (const row of rows) {
                    const vals = cols.map(c => {
                        const v = row[c];
                        if (v === null || v === undefined) return 'NULL';
                        if (typeof v === 'boolean' || typeof v === 'number') return v;
                        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
                        return `'${String(v).replace(/'/g, "''")}'`;
                    }).join(', ');

                    sqlOutput += `INSERT INTO "${table}" (${colsQuoted}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
                }
                sqlOutput += `\n`;
            }
        } catch (err) {
            console.error(`  ❌ Erro na tabela ${table}:`, err.message);
            stats[table] = `ERRO: ${err.message}`;
        }
    }

    sqlOutput += `COMMIT;\n`;

    fs.writeFileSync(sqlFilePath, sqlOutput, 'utf8');
    fs.writeFileSync(jsonFilePath, JSON.stringify(fullJsonBackup, null, 2), 'utf8');

    const sqlSizeKb = (fs.statSync(sqlFilePath).size / 1024).toFixed(2);
    const jsonSizeKb = (fs.statSync(jsonFilePath).size / 1024).toFixed(2);

    console.log('\n====================================================');
    console.log('✅ BACKUP LOCAL GERADO COM SUCESSO');
    console.log(`📄 Arquivo SQL: ${sqlFileName} (${sqlSizeKb} KB)`);
    console.log(`📄 Arquivo JSON: ${jsonFileName} (${jsonSizeKb} KB)`);
    console.log('====================================================\n');

    await pool.end();
    return {
        timestamp,
        sqlFilePath,
        jsonFilePath,
        sqlFileName,
        jsonFileName,
        sqlSizeKb,
        jsonSizeKb,
        stats
    };
}

if (require.main === module) {
    runBackup().catch(err => {
        console.error('Fatal backup error:', err);
        process.exit(1);
    });
}

module.exports = { runBackup };
