const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
let pool = null;
let useLocalFallback = false;

if (connectionString) {
    console.log('Connecting to PostgreSQL using DATABASE_URL...');
    pool = new Pool({
        connectionString,
        ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
    });
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
    if (useLocalFallback) return;

    const client = await pool.connect();
    try {
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
            const alreadyRun = await client.query('SELECT 1 FROM _migrations WHERE name = $1', [file]);
            if (alreadyRun.rows.length === 0) {
                console.log(`Running migration: ${file}...`);
                let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                
                // Execute migration
                await client.query(sql);
                await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                console.log(`Migration ${file} complete.`);
            }
        }
    } catch (err) {
        console.error('Error running migrations:', err);
    } finally {
        client.release();
    }
}

// Seed Initial Data (Municipios and Alunos)
async function seedDatabase() {
    if (useLocalFallback) return;

    const client = await pool.connect();
    try {
        // 1. Seed municipios_ma
        const hasMunicipios = await client.query('SELECT 1 FROM municipios_ma LIMIT 1');
        if (hasMunicipios.rows.length === 0) {
            console.log('Seeding municipios_ma from ideb_publico_db.js...');
            const publicDbPath = path.join(__dirname, 'ideb_publico_db.js');
            if (fs.existsSync(publicDbPath)) {
                const content = fs.readFileSync(publicDbPath, 'utf8');
                const startIdx = content.indexOf('[');
                const endIdx = content.lastIndexOf(']');
                if (startIdx > -1 && endIdx > -1) {
                    const rawData = JSON.parse(content.substring(startIdx, endIdx + 1));
                    const municipiosSet = new Set();
                    const insertValues = [];
                    
                    rawData.forEach(item => {
                        if (item.uf === 'MA' && item.municipio && item.codigo_ibge && item.municipio !== 'Maranhão (Estado)') {
                            if (!municipiosSet.has(item.codigo_ibge)) {
                                municipiosSet.add(item.codigo_ibge);
                                insertValues.push(`('${item.codigo_ibge}', '${item.municipio.replace(/'/g, "''")}', 'MA')`);
                            }
                        }
                    });

                    if (insertValues.length > 0) {
                        // Insert in chunks of 50 to avoid limits
                        for (let i = 0; i < insertValues.length; i += 50) {
                            const chunk = insertValues.slice(i, i + 50);
                            await client.query(`INSERT INTO municipios_ma (codigo_ibge, nome, uf) VALUES ${chunk.join(', ')} ON CONFLICT (codigo_ibge) DO NOTHING`);
                        }
                        console.log(`Successfully seeded ${municipiosSet.size} MA municipalities.`);
                    }
                }
            }
        }

        // 2. Seed ideb_publico_referencia
        const hasRefs = await client.query('SELECT 1 FROM ideb_publico_referencia LIMIT 1');
        if (hasRefs.rows.length === 0) {
            console.log('Seeding ideb_publico_referencia from ideb_publico_db.js...');
            const publicDbPath = path.join(__dirname, 'ideb_publico_db.js');
            if (fs.existsSync(publicDbPath)) {
                const content = fs.readFileSync(publicDbPath, 'utf8');
                const startIdx = content.indexOf('[');
                const endIdx = content.lastIndexOf(']');
                if (startIdx > -1 && endIdx > -1) {
                    const rawData = JSON.parse(content.substring(startIdx, endIdx + 1));
                    const insertValues = [];
                    rawData.forEach(item => {
                        insertValues.push(`('${item.uf}', '${item.municipio.replace(/'/g, "''")}', '${item.codigo_ibge}', ${item.ano}, '${item.etapa}', ${item.ideb_observado || 'NULL'}, ${item.meta_projetada || 'NULL'})`);
                    });

                    if (insertValues.length > 0) {
                        for (let i = 0; i < insertValues.length; i += 100) {
                            const chunk = insertValues.slice(i, i + 100);
                            await client.query(`INSERT INTO ideb_publico_referencia (uf, municipio, codigo_ibge, ano, etapa, ideb_observado, meta_projetada) VALUES ${chunk.join(', ')}`);
                        }
                        console.log(`Successfully seeded ${rawData.length} IDEB reference records.`);
                    }
                }
            }
        }

        // 3. Seed default Tenant, Schools and Students if empty
        const hasTenants = await client.query('SELECT 1 FROM tenants LIMIT 1');
        let defaultTenantId = null;
        if (hasTenants.rows.length === 0) {
            console.log('Seeding default Tenant...');
            const res = await client.query(`INSERT INTO tenants (nome, cnpj) VALUES ('Rede Municipal de Codó', '12.345.678/0001-99') RETURNING id`);
            defaultTenantId = res.rows[0].id;
        } else {
            const res = await client.query('SELECT id FROM tenants LIMIT 1');
            defaultTenantId = res.rows[0].id;
        }

        const hasEscolas = await client.query('SELECT 1 FROM escolas LIMIT 1');
        if (hasEscolas.rows.length === 0) {
            console.log('Seeding schools and students from alunos_db.js...');
            const alunosDbPath = path.join(__dirname, 'alunos_db.js');
            if (fs.existsSync(alunosDbPath)) {
                const content = fs.readFileSync(alunosDbPath, 'utf8');
                const startIdx = content.indexOf('[');
                const endIdx = content.lastIndexOf(']');
                if (startIdx > -1 && endIdx > -1) {
                    const students = JSON.parse(content.substring(startIdx, endIdx + 1));
                    
                    // Extract unique schools
                    const schoolNames = Array.from(new Set(students.map(s => s.escola)));
                    const schoolMap = {};
                    
                    for (const sName of schoolNames) {
                        const inep = (10000000 + Math.floor(Math.random() * 90000000)).toString();
                        const res = await client.query(
                            `INSERT INTO escolas (tenant_id, nome, codigo_inep) VALUES ($1, $2, $3) ON CONFLICT (codigo_inep) DO NOTHING RETURNING id`,
                            [defaultTenantId, sName, inep]
                        );
                        if (res.rows.length > 0) {
                            schoolMap[sName] = res.rows[0].id;
                        }
                    }

                    // Seed students in chunks
                    console.log(`Seeding ${students.length} students...`);
                    const studentValues = [];
                    students.forEach(st => {
                        const parseDate = (dStr) => {
                            if (!dStr) return '2019-01-01';
                            const p = dStr.split('/');
                            return `${p[2]}-${p[1]}-${p[0]}`;
                        };
                        studentValues.push(`('${st.matricula}', '${st.nome.replace(/'/g, "''")}', '${parseDate(st.nascimento)}', '${st.mae ? st.mae.replace(/'/g, "''") : ''}')`);
                    });

                    for (let i = 0; i < studentValues.length; i += 100) {
                        const chunk = studentValues.slice(i, i + 100);
                        await client.query(`INSERT INTO alunos (codigo_matricula, nome, data_nascimento, nome_responsavel) VALUES ${chunk.join(', ')} ON CONFLICT (codigo_matricula) DO NOTHING`);
                    }
                    console.log('Seeding of initial schools and students completed successfully.');
                }
            }
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    runMigrations,
    seedDatabase,
    useLocalFallback,
    LOCAL_DB_FILE
};
