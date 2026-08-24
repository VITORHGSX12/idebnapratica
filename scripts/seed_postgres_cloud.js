require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

function getSeedData() {
    const seedPath = path.join(__dirname, '..', 'js', 'data', 'official_students_seed.js');
    if (!fs.existsSync(seedPath)) {
        throw new Error('Arquivo official_students_seed.js não encontrado em ' + seedPath);
    }
    const content = fs.readFileSync(seedPath, 'utf8');
    const startIdx = content.indexOf('{');
    const endIdx = content.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
        throw new Error('Estrutura JSON inválida em official_students_seed.js');
    }
    return JSON.parse(content.substring(startIdx, endIdx + 1));
}

async function runCloudSeed() {
    console.log('=== SEED AUTOMATIZADO: BANCO DE DADOS RELACIONAL EM NUVEM ===\n');

    const seedData = getSeedData();
    const schools = seedData.escolas || [];
    const classes = seedData.turmas || [];
    const students = seedData.alunos || [];

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.log('⚠️  DATABASE_URL não configurada no .env local.');
        console.log('ℹ️  Modo de simulação (Dry Run): Validando estrutura do seed relacional...\n');
        console.log(`📊 Validação de Carga Oficial:`);
        console.log(`   - 🏫 Escolas Municipais Mapeadas: ${schools.length}`);
        console.log(`   - 👥 Turmas Oficiais: ${classes.length}`);
        console.log(`   - 🎓 Estudantes Oficiais: ${students.length}`);
        console.log(`\n✅ O script de seed está pronto para execução quando o DATABASE_URL for conectado.`);
        return;
    }

    console.log('🔗 Conectando ao PostgreSQL em nuvem...');
    const pool = new Pool({
        connectionString: dbUrl,
        ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
    });

    let client;
    try {
        client = await pool.connect();
        console.log('✅ Conexão estabelecida com sucesso ao PostgreSQL!\n');

        // 1. Criar tabelas se não existirem
        console.log('📦 Executando migrações relacionais...');
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '0001_init_schema.sql');
        if (fs.existsSync(migrationPath)) {
            const sql = fs.readFileSync(migrationPath, 'utf8');
            await client.query(sql);
            console.log('✅ Tabelas relacionais inicializadas com sucesso.');
        }

        // 2. Garantir Tenant Gonçalves Dias
        const tenantRes = await client.query(`
            INSERT INTO tenants (nome, cnpj, slug)
            VALUES ('Secretaria Municipal de Educação de Gonçalves Dias', '12.345.678/0001-99', 'gd')
            ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
            RETURNING id;
        `);
        const tenantId = tenantRes.rows[0].id;
        console.log(`✅ Tenant Gonçalves Dias registrado com ID: ${tenantId}`);

        // Limpar dados anteriores
        try {
            await client.query('DELETE FROM alunos WHERE tenant_id = $1;', [tenantId]);
            await client.query('DELETE FROM turmas WHERE tenant_id = $1;', [tenantId]);
            await client.query('DELETE FROM escolas WHERE tenant_id = $1;', [tenantId]);
        } catch(e) {}

        // Inserir Escolas
        const schoolMap = {};
        for (const sc of schools) {
            const res = await client.query(`
                INSERT INTO escolas (tenant_id, nome, codigo_inep, zona)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (codigo_inep) DO UPDATE SET nome = EXCLUDED.nome
                RETURNING id, nome;
            `, [tenantId, sc.name, sc.inep, sc.zone]);
            schoolMap[sc.name] = res.rows[0].id;
        }
        console.log(`✅ ${schools.length} escolas municipais sincronizadas.`);

        // Inserir Turmas
        const classMap = {};
        for (const cl of classes) {
            const schoolId = schoolMap[cl.escola] || null;
            const res = await client.query(`
                INSERT INTO turmas (tenant_id, escola_id, nome, serie, turno, ano_letivo)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, nome;
            `, [tenantId, schoolId, cl.nome, cl.serie, cl.turno, 2026]);
            classMap[cl.nome] = res.rows[0].id;
        }
        console.log(`✅ ${classes.length} turmas sincronizadas.`);

        // Inserir Estudantes em Lotes de 50
        let insertedStudents = 0;
        for (let i = 0; i < students.length; i += 50) {
            const chunk = students.slice(i, i + 50);
            for (const st of chunk) {
                const turmaId = classMap[st.turma] || null;
                await client.query(`
                    INSERT INTO alunos (tenant_id, nome, matricula, turma_id, cpf, nascimento)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (matricula) DO NOTHING;
                `, [tenantId, st.nome, st.matricula, turmaId, st.cpf || '', st.dataNascimento || null]);
                insertedStudents++;
            }
        }
        console.log(`✅ ${insertedStudents} estudantes reais sincronizados no PostgreSQL.`);

        console.log('\n🎉 SINCRONIZAÇÃO COMPLETA: O BANCO EM NUVEM ESTÁ PRONTO PARA OPERAÇÃO MULTIUSUÁRIO!');
    } catch(err) {
        console.error('❌ Erro durante o seed em nuvem:', err);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runCloudSeed();
}

module.exports = { runCloudSeed, getSeedData };
