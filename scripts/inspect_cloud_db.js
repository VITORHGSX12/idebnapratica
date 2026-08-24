const { Pool } = require('pg');
require('dotenv').config();

async function inspectDb() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error('DATABASE_URL not found');
        process.exit(1);
    }

    const isInternalOrLocal = !connectionString || 
        connectionString.includes('localhost') || 
        connectionString.includes('railway.internal') || 
        connectionString.includes('127.0.0.1');

    const pool = new Pool({
        connectionString,
        ssl: isInternalOrLocal ? false : { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('=== RELATÓRIO DE DADOS DO BANCO POSTGRESQL (PRODUÇÃO) ===\n');

        // 1. Listar tabelas e contagens
        const tables = ['tenants', 'escolas', 'turmas', 'alunos', 'usuarios', 'tenant_state', 'ideb_publico_referencia'];
        const summary = [];

        for (const t of tables) {
            try {
                const res = await client.query(`SELECT count(*) as total FROM ${t}`);
                summary.push({ Tabela: t, TotalRegistros: parseInt(res.rows[0].total) });
            } catch(e) {
                summary.push({ Tabela: t, TotalRegistros: 'Tabela não criada' });
            }
        }
        console.table(summary);

        // 2. Detalhe das Escolas
        console.log('\n🏫 Escolas Cadastradas no Banco:');
        try {
            const escRes = await client.query('SELECT nome, codigo_inep, zona FROM escolas ORDER BY nome LIMIT 10');
            console.table(escRes.rows);
        } catch(e) {
            console.log('Sem dados de escolas no momento.');
        }

        // 3. Detalhe das Turmas
        console.log('\n👥 Amostra de Turmas:');
        try {
            const turRes = await client.query('SELECT nome, serie, turno, ano_letivo FROM turmas ORDER BY nome LIMIT 10');
            console.table(turRes.rows);
        } catch(e) {
            console.log('Sem dados de turmas no momento.');
        }

        // 4. Detalhe dos Alunos
        console.log('\n🎓 Amostra de Alunos (com proteção de dados):');
        try {
            const alnRes = await client.query('SELECT matricula, nome, nascimento FROM alunos ORDER BY nome LIMIT 10');
            console.table(alnRes.rows);
        } catch(e) {
            console.log('Sem dados de alunos no momento.');
        }

        client.release();
    } catch(err) {
        console.error('Erro ao inspecionar banco:', err.message);
    } finally {
        await pool.end();
    }
}

inspectDb();
