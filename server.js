if (typeof window === 'undefined') {
    global.window = global;
}

// SECURITY FIX: [Hardcode & Secrets] Leitura estrita de variáveis de ambiente
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { resolveTenant, validateTenantAccessDB, isBypassLoginAllowed } = require('./middleware_tenant_subdominio');
const { JWT_SECRET, authMiddleware, authorize, ownershipCheck } = require('./middleware/auth');
const { authRouter, getUsers, saveUsers, findUserByEmail } = require('./routes/auth_routes');
const escolasTurmasRouter = require('./routes/escolas_turmas_routes');
const { alunosRouter, maskCPF, maskName, maskAddress, maskNee, applyMaskingToState, encryptText, decryptText, encryptSensitiveDataInState } = require('./routes/alunos_routes');
const simuladosRouter = require('./routes/simulados_routes');
const { bibliotecaRouter } = require('./routes/biblioteca_routes');
const { usuariosRouter, isConfigurationGroup, isVisualizationGroup, fetchAllUsersFromDb, insertUserInDb } = require('./routes/usuarios_routes');
const iaQuestoesRouter = require('./routes/ia_questoes_routes');

const app = express();
const PORT = process.env.PORT || 8080;

app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: ws:;"
    );
    next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(resolveTenant);
app.use('/api', authRouter);
app.use('/api', escolasTurmasRouter);
app.use('/api', alunosRouter);
app.use('/api', simuladosRouter);
app.use('/api', bibliotecaRouter);
app.use('/api', usuariosRouter);
app.use('/api', iaQuestoesRouter);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        databaseMode: db.useLocalFallback ? 'local-json' : 'postgres',
        tenant: req.tenant || null,
        timestamp: new Date()
    });
});

// Endpoint de Diagnóstico e Métricas do Banco de Dados
app.get('/api/db/stats', async (req, res) => {
    try {
        if (db.useLocalFallback) {
            return res.json({
                databaseMode: 'local-json',
                message: 'Servidor operando em modo de contingência local.'
            });
        }

        const tables = ['tenants', 'escolas', 'turmas', 'alunos', 'usuarios', 'tenant_state', 'ideb_publico_referencia'];
        const counts = {};

        for (const t of tables) {
            try {
                const queryRes = await db.query(`SELECT count(*) as total FROM ${t}`);
                counts[t] = parseInt(queryRes.rows[0].total);
            } catch(e) {
                counts[t] = 0;
            }
        }

        let sampleSchools = [];
        try {
            const esc = await db.query('SELECT nome, codigo_inep, zona FROM escolas ORDER BY nome LIMIT 10');
            sampleSchools = esc.rows;
        } catch(e) {}

        let sampleTurmas = [];
        try {
            const tur = await db.query('SELECT nome, serie, turno FROM turmas ORDER BY nome LIMIT 10');
            sampleTurmas = tur.rows;
        } catch(e) {}

        let sampleAlunos = [];
        try {
            const aln = await db.query('SELECT matricula, nome, nascimento FROM alunos ORDER BY nome LIMIT 10');
            sampleAlunos = aln.rows;
        } catch(e) {}

        return res.json({
            databaseMode: 'postgres',
            counts,
            schools: sampleSchools,
            classes: sampleTurmas,
            students: sampleAlunos,
            timestamp: new Date()
        });
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
});

// Endpoint para consulta do Tenant Atual
app.get('/api/tenant/current', (req, res) => {
    res.json({
        success: true,
        tenant: req.tenant
    });
});

// Endpoint de Diagnóstico e Métricas do Banco de Dados
app.get('/api/db/stats', async (req, res) => {
    try {
        if (db.useLocalFallback) {
            return res.json({
                databaseMode: 'local-json',
                message: 'Servidor operando em modo de contingência local.'
            });
        }

        const tables = ['tenants', 'escolas', 'turmas', 'alunos', 'usuarios', 'tenant_state', 'ideb_publico_referencia'];
        const counts = {};

        for (const t of tables) {
            try {
                const queryRes = await db.query(`SELECT count(*) as total FROM ${t}`);
                counts[t] = parseInt(queryRes.rows[0].total);
            } catch(e) {
                counts[t] = 0;
            }
        }

        let sampleSchools = [];
        try {
            const esc = await db.query('SELECT nome, codigo_inep, zona FROM escolas ORDER BY nome LIMIT 10');
            sampleSchools = esc.rows;
        } catch(e) {}

        let sampleTurmas = [];
        try {
            const tur = await db.query('SELECT nome, serie, turno FROM turmas ORDER BY nome LIMIT 10');
            sampleTurmas = tur.rows;
        } catch(e) {}

        let sampleAlunos = [];
        try {
            const aln = await db.query('SELECT matricula, nome, nascimento FROM alunos ORDER BY nome LIMIT 10');
            sampleAlunos = aln.rows;
        } catch(e) {}

        return res.json({
            databaseMode: 'postgres',
            counts,
            schools: sampleSchools,
            classes: sampleTurmas,
            students: sampleAlunos,
            timestamp: new Date()
        });
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
});

function authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (e) {
        try {
            const email = Buffer.from(token, 'base64').toString('utf8').trim().toLowerCase();
            const allUsers = getUsers();
            const found = allUsers.find(u => u.email.toLowerCase() === email);
            if (found) {
                return {
                    id: found.id,
                    nome: found.nome,
                    email: found.email,
                    role: found.role,
                    escola: found.escola || null,
                    turma: found.turma || null,
                    org_id: found.tenant_id || req.tenant?.slug || 'semed_goncalves_dias'
                };
            }
        } catch(err) {}
        return null;
    }
}

function applyRBACFilterToState(state, role, email) {
    if (role === 'Master Admin' || role === 'Gestor da Rede' || !email) {
        return state;
    }
    const allUsers = getUsers();
    const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        role,
        escola: email.includes('benta') ? 'U.E. BENTA VILANOVA' : 'U.E. RAIMUNDO VELOSO BARROS',
        turma: email.includes('2') ? '2º Ano' : (email.includes('5') ? '5º Ano' : '9º Ano')
    };

    const cloned = JSON.parse(JSON.stringify(state));
    
    if (role === 'Professor') {
        if (cloned.dbEscolas && Array.isArray(cloned.dbEscolas)) {
            cloned.dbEscolas = cloned.dbEscolas.filter(e => !user.escola || e.nome.toLowerCase().includes(user.escola.toLowerCase()) || user.escola.toLowerCase().includes(e.nome.toLowerCase()));
        }
        const schoolIds = new Set(cloned.dbEscolas ? cloned.dbEscolas.map(e => e.id) : []);
        if (cloned.dbTurmas && Array.isArray(cloned.dbTurmas)) {
            cloned.dbTurmas = cloned.dbTurmas.filter(t => schoolIds.has(t.escola_id) && (!user.turma || t.nome.toLowerCase().includes(user.turma.toLowerCase())));
        }
        if (cloned.dbAlunos && Array.isArray(cloned.dbAlunos)) {
            cloned.dbAlunos = cloned.dbAlunos.filter(a => 
                (!user.escola || a.escola.toLowerCase().includes(user.escola.toLowerCase()) || user.escola.toLowerCase().includes(a.escola.toLowerCase())) && 
                (!user.turma || a.etapa.toLowerCase().includes(user.turma.toLowerCase()))
            );
        }
        if (cloned.dbResultadosAluno && Array.isArray(cloned.dbResultadosAluno)) {
            const studentIds = new Set(cloned.dbAlunos ? cloned.dbAlunos.map(a => a.matricula) : []);
            cloned.dbResultadosAluno = cloned.dbResultadosAluno.filter(r => studentIds.has(r.aluno_id));
        }
    } else if (role === 'Diretor Escola') {
        if (cloned.dbEscolas && Array.isArray(cloned.dbEscolas)) {
            cloned.dbEscolas = cloned.dbEscolas.filter(e => !user.escola || e.nome.toLowerCase().includes(user.escola.toLowerCase()) || user.escola.toLowerCase().includes(e.nome.toLowerCase()));
        }
        const schoolIds = new Set(cloned.dbEscolas ? cloned.dbEscolas.map(e => e.id) : []);
        if (cloned.dbTurmas && Array.isArray(cloned.dbTurmas)) {
            cloned.dbTurmas = cloned.dbTurmas.filter(t => schoolIds.has(t.escola_id));
        }
        if (cloned.dbAlunos && Array.isArray(cloned.dbAlunos)) {
            cloned.dbAlunos = cloned.dbAlunos.filter(a => !user.escola || a.escola.toLowerCase().includes(user.escola.toLowerCase()) || user.escola.toLowerCase().includes(a.escola.toLowerCase()));
        }
        if (cloned.dbResultadosAluno && Array.isArray(cloned.dbResultadosAluno)) {
            const studentIds = new Set(cloned.dbAlunos ? cloned.dbAlunos.map(a => a.matricula) : []);
            cloned.dbResultadosAluno = cloned.dbResultadosAluno.filter(r => studentIds.has(r.aluno_id));
        }
    }
    return cloned;
}

function mergeStates(incomingState, currentState) {
    if (!currentState) return incomingState;
    const mergedState = { ...incomingState };
    if (incomingState.dbAlunos && Array.isArray(incomingState.dbAlunos) && currentState.dbAlunos && Array.isArray(currentState.dbAlunos)) {
        const originalMap = new Map(currentState.dbAlunos.map(a => [a.matricula, a]));
        mergedState.dbAlunos = incomingState.dbAlunos.map(inc => {
            const orig = originalMap.get(inc.matricula);
            if (!orig) return inc;
            const merged = { ...inc };
            if (inc.cpf && (inc.cpf.includes('*') || inc.cpf === '')) {
                merged.cpf = orig.cpf || '';
            }
            if (inc.mae && (inc.mae.includes('...') || inc.mae.includes('*'))) {
                merged.mae = orig.mae || '';
            }
            if (inc.pai && (inc.pai.includes('...') || inc.pai.includes('*'))) {
                merged.pai = orig.pai || '';
            }
            if (inc.endereco && (inc.endereco === '***' || inc.endereco.includes('*'))) {
                merged.endereco = orig.endereco || '';
            }
            if (inc.nee && (inc.nee.includes('***') || inc.nee.includes('*'))) {
                merged.nee = orig.nee || '';
            }
            return merged;
        });
    }
    return mergedState;
}

// GET /api/sync - Retrieve state with masking & RBAC & Multitenancy
app.get('/api/sync', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const activeTenant = req.tenant.slug;
        const tenantDbId = req.tenant.id || activeTenant;

        const podeAcessar = await validateTenantAccessDB(user, activeTenant);
        if (!podeAcessar) {
            return res.status(403).json({ error: 'Acesso negado: Você não possui permissão para acessar este tenant/município.' });
        }

        let state = {};
        if (db.useLocalFallback) {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
                const fileState = JSON.parse(raw);
                state = fileState[activeTenant] || {};
            }
        } else {
            const queryResult = await db.queryWithTenant(tenantDbId, 'SELECT data FROM tenant_state WHERE tenant_id = $1', [tenantDbId]);
            if (queryResult.rows.length > 0) {
                state = queryResult.rows[0].data;
            }
        }
        const filteredState = applyRBACFilterToState(state, user.role, user.email);
        const maskedState = applyMaskingToState(filteredState, user.role);
        return res.json(maskedState);
    } catch (err) {
        console.error('Error in GET /api/sync:', err);
        res.status(500).json({ error: 'Failed to retrieve database state.' });
    }
});

// POST /api/sync - Persist state with merging & Multitenancy
app.post('/api/sync', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const user = req.user;
        const activeTenant = req.tenant.slug;
        const tenantDbId = req.tenant.id || activeTenant;
        const incomingState = req.body;

        const podeAcessar = await validateTenantAccessDB(user, activeTenant);
        if (!podeAcessar) {
            return res.status(403).json({ error: 'Acesso negado: Você não possui permissão para alterar este tenant/município.' });
        }

        let currentState = {};
        let fileState = {};
        if (db.useLocalFallback) {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
                fileState = JSON.parse(raw);
                currentState = fileState[activeTenant] || {};
            }
        } else {
            const queryResult = await db.queryWithTenant(tenantDbId, 'SELECT data FROM tenant_state WHERE tenant_id = $1', [tenantDbId]);
            if (queryResult.rows.length > 0) {
                currentState = queryResult.rows[0].data;
            }
        }
        
        const mergedState = mergeStates(incomingState, currentState);
        const encryptedState = encryptSensitiveDataInState(mergedState);
        
        if (db.useLocalFallback) {
            if (currentState.auditLogs) {
                encryptedState.auditLogs = currentState.auditLogs;
            }
            fileState[activeTenant] = encryptedState;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true });
        } else {
            await db.queryWithTenant(tenantDbId, `
                INSERT INTO tenant_state (tenant_id, data, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id)
                DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
            `, [tenantDbId, JSON.stringify(encryptedState)]);
            return res.json({ success: true });
        }
    } catch (err) {
        console.error('Error in POST /api/sync:', err);
        res.status(500).json({ error: 'Failed to persist database state.' });
    }
});

// =============================================================================
// ROTAS DE CRONOGRAMA & AGENDAS (SECURITY FIX: JWT + RBAC + IDOR Protection)
// =============================================================================
app.get('/api/schedules', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            return res.json(state.dbSchedules || []);
        }

        const result = await db.query('SELECT * FROM turnos WHERE tenant_id = $1', [orgId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/schedules:', err);
        res.status(500).json({ error: 'Erro ao listar cronogramas.' });
    }
});

app.get('/api/schedules/:id', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const schedule = (state.dbSchedules || []).find(s => s.id === id);
            if (!schedule) {
                // SECURITY FIX: [IDOR] Retorna 404
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            return res.json(schedule);
        }

        const result = await db.query('SELECT * FROM turnos WHERE id = $1 AND tenant_id = $2', [id, orgId]);
        if (!result.rows || !result.rows.length) {
            // SECURITY FIX: [IDOR] Retorna 404
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in GET /api/schedules/:id:', err);
        res.status(500).json({ error: 'Erro ao buscar cronograma.' });
    }
});

// Global Anti-Cache Middleware
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// Serve Static Frontend Assets with anti-cache headers

app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Health check simples para proxy Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

// Serve index.html for all other routes (Single Page Application routing)
app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server and Init Database
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Railway/Production] Server running on 0.0.0.0:${PORT}`);
    
    // Rodar checagens de banco em segundo plano de forma assíncrona para não atrasar o binding do Railway
    setImmediate(async () => {
        if (!db.useLocalFallback) {
            try {
                console.log('Ensuring tenant_state table exists...');
                await db.query(`
                    CREATE TABLE IF NOT EXISTS tenant_state (
                        tenant_id VARCHAR(50) PRIMARY KEY,
                        data JSONB,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                await db.runMigrations();
                await db.seedDatabase();
            } catch (err) {
                console.error('[DB Init Warning]', err.message);
            }
        }
    });
});

process.on('uncaughtException', (err) => {
    console.error('[UncaughtException]', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[UnhandledRejection]', reason);
});
