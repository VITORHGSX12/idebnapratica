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
        const isLocal = !connectionString || 
            connectionString.includes('localhost') || 
            connectionString.includes('127.0.0.1');

        pool = new Pool({
            connectionString,
            ssl: isLocal ? false : { rejectUnauthorized: false }
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
        const existingTenant = await client.query('SELECT id FROM tenants LIMIT 1');
        if (existingTenant.rows.length > 0) {
            defaultTenantId = existingTenant.rows[0].id;
        } else {
            const tenantRes = await client.query(`
                INSERT INTO tenants (nome, cnpj, slug)
                VALUES ('Secretaria Municipal de Educação de Gonçalves Dias', '12.345.678/0001-99', 'semed_goncalves_dias')
                RETURNING id;
            `);
            defaultTenantId = tenantRes.rows[0].id;
        }

        // 2. Seed official schools, classes and students from official_students_seed.js
        const escCountRes = await client.query('SELECT count(*) as total FROM escolas');
        const currentEscCount = parseInt(escCountRes.rows[0].total) || 0;

        const alnCountRes = await client.query('SELECT count(*) as total FROM alunos');
        const currentAlnCount = parseInt(alnCountRes.rows[0].total) || 0;

        // Se tiver contagem diferente de 9 escolas ou 0 alunos, faz a carga oficial completa
        if (currentEscCount !== 9 || currentAlnCount === 0) {
            console.log('Seeding official 9 schools of SAEB, 32 classes and 526 students...');
            try {
                await client.query('DELETE FROM alunos;');
                await client.query('DELETE FROM turmas;');
                await client.query('DELETE FROM escolas;');
            } catch(e) {}

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
                            INSERT INTO escolas (tenant_id, nome, codigo_inep, endereco)
                            VALUES ($1, $2, $3, $4)
                            ON CONFLICT (codigo_inep) DO UPDATE SET nome = EXCLUDED.nome
                            RETURNING id, nome;
                        `, [defaultTenantId, sc.name, sc.inep, sc.zone]);
                        schoolMap[sc.name] = res.rows[0].id;
                        try {
                            await client.query(`UPDATE escolas SET zona = $1 WHERE id = $2;`, [sc.zone, res.rows[0].id]);
                        } catch(e) {}
                    }
                    console.log(`Successfully seeded ${schools.length} official schools.`);

                    // Inserir Turmas
                    try {
                        await client.query('ALTER TABLE turmas ALTER COLUMN ano_letivo_id DROP NOT NULL; ALTER TABLE turmas ALTER COLUMN turno_id DROP NOT NULL;');
                    } catch(e) {}

                    const classMap = {};
                    for (const cl of classes) {
                        const res = await client.query(`
                            INSERT INTO turmas (nome)
                            VALUES ($1)
                            RETURNING id, nome;
                        `, [cl.nome]);
                        classMap[cl.nome] = res.rows[0].id;
                        try {
                            const schoolId = schoolMap[cl.escola] || null;
                            await client.query(`UPDATE turmas SET escola_id = $1, serie = $2, turno = $3, ano_letivo = $4 WHERE id = $5;`, [schoolId, cl.serie, cl.turno, 2026, res.rows[0].id]);
                        } catch(e) {}
                    }
                    console.log(`Successfully seeded ${classes.length} official classes.`);

                    // Inserir Estudantes
                    try {
                        await client.query(`
                            ALTER TABLE alunos ADD COLUMN IF NOT EXISTS turma_id UUID;
                            ALTER TABLE alunos ALTER COLUMN codigo_matricula DROP NOT NULL;
                            ALTER TABLE alunos ALTER COLUMN data_nascimento DROP NOT NULL;
                            ALTER TABLE alunos ADD COLUMN IF NOT EXISTS matricula VARCHAR(50);
                            ALTER TABLE alunos ADD COLUMN IF NOT EXISTS cpf VARCHAR(20);
                            ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nascimento VARCHAR(30);
                            DO $$ BEGIN
                                ALTER TABLE alunos ADD CONSTRAINT alunos_matricula_key UNIQUE (matricula);
                            EXCEPTION WHEN OTHERS THEN NULL;
                            END $$;
                        `);
                    } catch(e) {}

                    let insertedStudents = 0;
                    for (let i = 0; i < students.length; i += 50) {
                        const chunk = students.slice(i, i + 50);
                        for (const st of chunk) {
                            const turmaId = classMap[st.turma] || null;
                            await client.query(`
                                INSERT INTO alunos (nome, matricula, codigo_matricula, turma_id, cpf)
                                VALUES ($1, $2, $3, $4, $5)
                                ON CONFLICT DO NOTHING;
                            `, [st.nome, st.matricula, st.matricula, turmaId, st.cpf || '']);
                            insertedStudents++;
                        }
                    }
                    console.log(`Successfully seeded ${insertedStudents} official students.`);
                }
            }
        }

        // 3. Seed Users from users.json if table is empty or missing users
        const usersCountRes = await client.query('SELECT count(*) as total FROM public.usuarios');
        const currentUsersCount = parseInt(usersCountRes.rows[0].total) || 0;

        if (currentUsersCount === 0) {
            const usersPath = path.join(__dirname, 'users.json');
            if (fs.existsSync(usersPath)) {
                console.log('Seeding official registered users from users.json...');
                const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
                for (const u of usersData) {
                    await client.query(`
                        INSERT INTO public.usuarios (
                            id, tenant_id, nome, email, password, role, tipo, escola, turma, telefone, cpf, status, must_change_password
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                        ON CONFLICT (email) DO UPDATE SET
                            password = EXCLUDED.password,
                            role = EXCLUDED.role,
                            must_change_password = EXCLUDED.must_change_password;
                    `, [
                        u.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                        defaultTenantId,
                        u.nome,
                        u.email.toLowerCase().trim(),
                        u.password,
                        u.role,
                        u.tipo || u.role,
                        u.escola || null,
                        u.turma || null,
                        u.telefone || null,
                        u.cpf || null,
                        u.status || 'Ativo',
                        u.mustChangePassword !== undefined ? !!u.mustChangePassword : true
                    ]);
                }
                console.log(`Successfully seeded ${usersData.length} users into public.usuarios.`);
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
