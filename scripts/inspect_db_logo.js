const { Pool } = require('pg');
require('dotenv').config();

const connStr = process.env.DATABASE_URL || '';
const isLocal = connStr.includes('localhost') || connStr.includes('127.0.0.1');

const pool = new Pool({
    connectionString: connStr,
    ssl: isLocal ? false : { rejectUnauthorized: true }
});

async function main() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tabelas no banco:', res.rows.map(r => r.table_name));

        for (const t of res.rows) {
            const tname = t.table_name;
            const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = $1", [tname]);
            const colNames = cols.rows.map(c => c.column_name);
            const hasLogoOrImage = colNames.some(c => c.includes('logo') || c.includes('image') || c.includes('brasao') || c.includes('foto') || c.includes('config'));
            if (hasLogoOrImage || tname.includes('config') || tname.includes('municip') || tname.includes('setting') || tname.includes('rede')) {
                console.log(`Tabela ${tname} colunas:`, colNames);
                const sample = await pool.query(`SELECT * FROM "${tname}" LIMIT 2`);
                console.log(`Amostra de ${tname}:`, sample.rows);
            }
        }
    } catch (e) {
        console.error('Erro na consulta:', e);
    } finally {
        await pool.end();
    }
}

main();
