const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
let pool = null;
let useLocalFallback = false;

if (connectionString) {
    try {
        console.log('Connecting to PostgreSQL using DATABASE_URL...');
        const isInternalOrLocal = !connectionString || 
            connectionString.includes('localhost') || 
            connectionString.includes('railway.internal') || 
            connectionString.includes('127.0.0.1');

        pool = new Pool({
            connectionString,
            ssl: isInternalOrLocal ? false : { rejectUnauthorized: false }
        });
        pool.on('error', (err) => {
            console.error('[PG Pool Error]', err ? err.message : err);
        });
    } catch(e) {
        console.error('Failed to create PG pool, using local fallback:', e.message);
        useLocalFallback = true;
    }
} else {
    console.log('DATABASE_URL not found. Running in local fallback mode (using local JSON file for database).');
    useLocalFallback = true;
}

const LOCAL_DB_FILE = path.join(__dirname, 'local_db_state.json');

// Initialize Local JSON Fallback File if not exists
if (useLocalFallback && !fs.existsSync(LOCAL_DB_FILE)) {
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify({
        escolas: [],
        turmas: [],
        alunos: [],
        avaliacoes: [],
        resultados: [],
        questoes: []
    }, null, 2));
}

async function query(text, params) {
    if (useLocalFallback) {
        throw new Error('Database is in local fallback mode.');
    }
    return pool.query(text, params);
}

// Auto-run Migrations
async function runMigrations() {
    if (useLocalFallback || !pool) return;

    let client = null;
    try {
        client = await pool.connect();
        console.log('Checking/running database migrations...');
        // Create migrations tracking table
        await client.query(`
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('Migrations directory not found, skipping migrations.');
            return;
        }

        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        
        for (const file of files) {
            const res = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
            if (res.rows.length === 0) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                try {
                    await client.query('BEGIN');
                    await client.query(sql);
                    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                    await client.query('COMMIT');
                    console.log(`Migration ${file} executed successfully.`);
                } catch (mErr) {
                    await client.query('ROLLBACK');
                    console.error(`Migration ${file} failed:`, mErr.message);
                }
            }
        }
        console.log('All migrations checked and up to date.');
    } catch (err) {
        console.error('Error executing database migrations (continuing in fallback mode):', err.message);
    } finally {
        if (client) {
            try { client.release(); } catch(e) {}
        }
    }
}

// Auto-seed Reference & Initial Data
async function seedDatabase() {
    if (useLocalFallback || !pool) return;

    let client = null;
    try {
        client = await pool.connect();
        
        // 1. Seed Tenant Gonçalves Dias
        let defaultTenantId = null;
        const tenantRes = await client.query(`
            INSERT INTO tenants (nome, cnpj, slug)
            VALUES ('Secretaria Municipal de Educação de Gonçalves Dias', '12.345.678/0001-99', 'gd')
            ON CONFLICT (slug) DO UPDATE SET nome = EXCLUDED.nome
            RETURNING id;
        `);
        defaultTenantId = tenantRes.rows[0].id;

        // 2. Seed official schools, classes and students from official_students_seed.js
        const hasEscolas = await client.query('SELECT 1 FROM escolas LIMIT 1');
        if (hasEscolas.rows.length === 0) {
            console.log('Seeding official schools and students from official_students_seed.js...');
            const seedPath = path.join(__dirname, 'js', 'data', 'official_students_seed.js');
            if (fs.existsSync(seedPath)) {
                const content = fs.readFileSync(seedPath, 'utf8');
                const startIdx = content.indexOf('{');
                const endIdx = content.lastIndexOf('}');
                if (startIdx > -1 && endIdx > -1) {
                    const seedData = JSON.parse(content.substring(startIdx, endIdx + 1));
                    const schools = seedData.escolas || [];
                    const classes = seedData.turmas || [];
                    const students = seedData.alunos || [];

                    // Inserir Escolas
                    const schoolMap = {};
                    for (const sc of schools) {
                        const res = await client.query(`
                            INSERT INTO escolas (tenant_id, nome, codigo_inep, zona)
                            VALUES ($1, $2, $3, $4)
                            ON CONFLICT (codigo_inep) DO UPDATE SET nome = EXCLUDED.nome
                            RETURNING id, nome;
                        `, [defaultTenantId, sc.name, sc.inep, sc.zone]);
                        schoolMap[sc.name] = res.rows[0].id;
                    }
                    console.log(`Successfully seeded ${schools.length} official schools.`);

                    // Inserir Turmas
                    const classMap = {};
                    for (const cl of classes) {
                        const schoolId = schoolMap[cl.escola] || null;
                        const res = await client.query(`
                            INSERT INTO turmas (tenant_id, escola_id, nome, serie, turno, ano_letivo)
                            VALUES ($1, $2, $3, $4, $5, $6)
                            RETURNING id, nome;
                        `, [defaultTenantId, schoolId, cl.nome, cl.serie, cl.turno, 2026]);
                        classMap[cl.nome] = res.rows[0].id;
                    }
                    console.log(`Successfully seeded ${classes.length} official classes.`);

                    // Inserir Estudantes
                    let insertedStudents = 0;
                    for (let i = 0; i < students.length; i += 50) {
                        const chunk = students.slice(i, i + 50);
                        for (const st of chunk) {
                            const turmaId = classMap[st.turma] || null;
                            await client.query(`
                                INSERT INTO alunos (tenant_id, nome, matricula, turma_id, cpf, nascimento)
                                VALUES ($1, $2, $3, $4, $5, $6)
                                ON CONFLICT (matricula) DO NOTHING;
                            `, [defaultTenantId, st.nome, st.matricula, turmaId, st.cpf || '', st.dataNascimento || null]);
                            insertedStudents++;
                        }
                    }
                    console.log(`Successfully seeded ${insertedStudents} official students.`);
                }
            }
        }
    } catch (err) {
        console.error('Error seeding database (continuing in fallback mode):', err.message);
    } finally {
        if (client) {
            try { client.release(); } catch(e) {}
        }
    }
}

async function queryWithTenant(tenantId, text, params) {
    if (useLocalFallback) {
        throw new Error('Database is in local fallback mode.');
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
        const res = await client.query(text, params);
        await client.query('COMMIT');
        return res;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    queryWithTenant,
    runMigrations,
    seedDatabase,
    useLocalFallback,
    LOCAL_DB_FILE
};
