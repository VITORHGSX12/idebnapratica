const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        databaseMode: db.useLocalFallback ? 'local-json' : 'postgres',
        timestamp: new Date()
    });
});

// Masking Helpers
function maskCPF(cpf) {
    if (!cpf) return '';
    const parts = cpf.split('-');
    if (parts.length < 2) return '***.***.***-**';
    const main = parts[0].split('.');
    if (main.length < 3) return '***.***.***-**';
    const lastDigits = main[2].slice(-1);
    return `***.***.**${lastDigits}-${parts[1]}`;
}

function maskName(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 1) return parts[0][0] + '...';
    const lastWord = parts[parts.length - 1];
    const middle = parts.slice(1, -1).map(p => p[0] + '...').join(' ');
    return parts[0] + (middle ? ' ' + middle : '') + ' ' + lastWord[0] + '...';
}

function maskAddress(addr) {
    if (!addr) return '';
    return '***';
}

function maskNee(nee) {
    if (!nee) return '';
    return '*** (Sob restrição DPO)';
}

function applyMaskingToState(state, role) {
    if (role === 'Master Admin') {
        return state;
    }
    const cloned = JSON.parse(JSON.stringify(state));
    if (cloned.dbAlunos && Array.isArray(cloned.dbAlunos)) {
        cloned.dbAlunos = cloned.dbAlunos.map(student => ({
            ...student,
            cpf: maskCPF(student.cpf),
            mae: maskName(student.mae),
            pai: maskName(student.pai),
            endereco: maskAddress(student.endereco),
            nee: maskNee(student.nee)
        }));
    }
    return cloned;
}

const MOCK_USER_MAPPINGS = {
    'professor@municipio.gov.br': {
        role: 'Professor',
        escola: 'UNIDADE ESCOLAR ANTONIO SIMAO OLIVEIRA',
        turma: '2º Ano'
    },
    'diretor@municipio.gov.br': {
        role: 'Diretor Escola',
        escola: 'UNIDADE ESCOLAR ANTONIO SIMAO OLIVEIRA'
    }
};

function applyRBACFilterToState(state, role, email) {
    if (role === 'Master Admin' || !email) {
        return state;
    }
    const mapping = MOCK_USER_MAPPINGS[email.trim().toLowerCase()];
    if (!mapping) {
        return state;
    }
    const cloned = JSON.parse(JSON.stringify(state));
    
    if (role === 'Professor') {
        if (cloned.dbEscolas && Array.isArray(cloned.dbEscolas)) {
            cloned.dbEscolas = cloned.dbEscolas.filter(e => e.nome === mapping.escola);
        }
        const schoolIds = new Set(cloned.dbEscolas ? cloned.dbEscolas.map(e => e.id) : []);
        if (cloned.dbTurmas && Array.isArray(cloned.dbTurmas)) {
            cloned.dbTurmas = cloned.dbTurmas.filter(t => schoolIds.has(t.escola_id) && t.nome.includes(mapping.turma));
        }
        if (cloned.dbAlunos && Array.isArray(cloned.dbAlunos)) {
            cloned.dbAlunos = cloned.dbAlunos.filter(a => a.escola === mapping.escola && a.etapa.includes(mapping.turma));
        }
        if (cloned.dbResultadosAluno && Array.isArray(cloned.dbResultadosAluno)) {
            const studentIds = new Set(cloned.dbAlunos.map(a => a.matricula));
            cloned.dbResultadosAluno = cloned.dbResultadosAluno.filter(r => studentIds.has(r.aluno_id));
        }
    } else if (role === 'Diretor Escola') {
        if (cloned.dbEscolas && Array.isArray(cloned.dbEscolas)) {
            cloned.dbEscolas = cloned.dbEscolas.filter(e => e.nome === mapping.escola);
        }
        const schoolIds = new Set(cloned.dbEscolas ? cloned.dbEscolas.map(e => e.id) : []);
        if (cloned.dbTurmas && Array.isArray(cloned.dbTurmas)) {
            cloned.dbTurmas = cloned.dbTurmas.filter(t => schoolIds.has(t.escola_id));
        }
        if (cloned.dbAlunos && Array.isArray(cloned.dbAlunos)) {
            cloned.dbAlunos = cloned.dbAlunos.filter(a => a.escola === mapping.escola);
        }
        if (cloned.dbResultadosAluno && Array.isArray(cloned.dbResultadosAluno)) {
            const studentIds = new Set(cloned.dbAlunos.map(a => a.matricula));
            cloned.dbResultadosAluno = cloned.dbResultadosAluno.filter(r => studentIds.has(r.aluno_id));
        }
    }
    return cloned;
}

function validateTenantAccess(userEmail, userRole, requestedTenant) {
    if (!requestedTenant) return false;
    if (userRole === 'Master Admin') {
        return true;
    }
    const mapping = MOCK_USER_MAPPINGS[userEmail.trim().toLowerCase()];
    if (mapping) {
        const allowedTenant = 'codo';
        if (requestedTenant !== allowedTenant) {
            return false;
        }
    } else {
        if (requestedTenant !== 'codo' && requestedTenant !== 'default') {
            return false;
        }
    }
    return true;
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
app.get('/api/sync', async (req, res) => {
    try {
        const { role, email, tenantId } = req.query;
        const activeTenant = tenantId || 'default';

        if (!validateTenantAccess(email || '', role || '', activeTenant)) {
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
            const queryResult = await db.queryWithTenant(activeTenant, 'SELECT data FROM tenant_state WHERE tenant_id = $1', [activeTenant]);
            if (queryResult.rows.length > 0) {
                state = queryResult.rows[0].data;
            }
        }
        const filteredState = applyRBACFilterToState(state, role, email);
        const maskedState = applyMaskingToState(filteredState, role);
        return res.json(maskedState);
    } catch (err) {
        console.error('Error in GET /api/sync:', err);
        res.status(500).json({ error: 'Failed to retrieve database state.' });
    }
});

// POST /api/sync - Persist state with merging & Multitenancy
app.post('/api/sync', async (req, res) => {
    try {
        const { role, email, tenantId } = req.query;
        const activeTenant = tenantId || 'default';
        const incomingState = req.body;

        if (!validateTenantAccess(email || '', role || '', activeTenant)) {
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
            const queryResult = await db.queryWithTenant(activeTenant, 'SELECT data FROM tenant_state WHERE tenant_id = $1', [activeTenant]);
            if (queryResult.rows.length > 0) {
                currentState = queryResult.rows[0].data;
            }
        }
        
        const mergedState = mergeStates(incomingState, currentState);
        
        if (db.useLocalFallback) {
            if (currentState.auditLogs) {
                mergedState.auditLogs = currentState.auditLogs;
            }
            fileState[activeTenant] = mergedState;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true });
        } else {
            await db.queryWithTenant(activeTenant, `
                INSERT INTO tenant_state (tenant_id, data, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id)
                DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
            `, [activeTenant, JSON.stringify(mergedState)]);
            return res.json({ success: true });
        }
    } catch (err) {
        console.error('Error in POST /api/sync:', err);
        res.status(500).json({ error: 'Failed to persist database state.' });
    }
});

// POST /api/alunos/reveal - Reveal sensitive field and record audit log
app.post('/api/alunos/reveal', async (req, res) => {
    try {
        const { matricula, field, justificativa, userEmail, userRole, tenantId } = req.body;
        const activeTenant = tenantId || 'default';
        
        if (!matricula || !field || !userEmail || !userRole) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        if (!validateTenantAccess(userEmail, userRole, activeTenant)) {
            return res.status(403).json({ error: 'Acesso negado: Você não possui permissão para acessar este tenant/município.' });
        }
        
        if (userRole === 'Professor') {
            return res.status(403).json({ error: 'Acesso negado: Professores não possuem permissão para revelar dados sensíveis.' });
        }
        
        if (userRole === 'Gestor da Rede' && (!justificativa || justificativa.trim().length < 5)) {
            return res.status(400).json({ error: 'Justificativa obrigatória para gestores da rede (mínimo de 5 caracteres).' });
        }
        
        let state = {};
        let fileState = {};
        if (db.useLocalFallback) {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
                fileState = JSON.parse(raw);
                state = fileState[activeTenant] || {};
            }
        } else {
            const queryResult = await db.queryWithTenant(activeTenant, 'SELECT data FROM tenant_state WHERE tenant_id = $1', [activeTenant]);
            if (queryResult.rows.length > 0) {
                state = queryResult.rows[0].data;
            }
        }
        
        const student = state.dbAlunos ? state.dbAlunos.find(a => a.matricula === matricula) : null;
        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado.' });
        }
        
        const alunoNome = student.nome || 'N/A';
        const actionDetails = justificativa || 'Acesso direto (DPO / Admin)';
        
        if (db.useLocalFallback) {
            if (!state.auditLogs) {
                state.auditLogs = [];
            }
            state.auditLogs.push({
                id: new Date().getTime().toString(),
                usuario_email: userEmail,
                aluno_id: matricula,
                aluno_nome: alunoNome,
                campo_acessado: field,
                justificativa: actionDetails,
                tenant_id: activeTenant,
                timestamp: new Date().toISOString()
            });
            fileState[activeTenant] = state;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
        } else {
            await db.queryWithTenant(activeTenant, `
                INSERT INTO public.logs_auditoria (usuario_email, aluno_id, aluno_nome, campo_acessado, justificativa, tenant_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [userEmail, matricula, alunoNome, field, actionDetails, activeTenant]);
        }
        
        const rawValue = student[field] || '';
        res.json({ success: true, value: rawValue });
    } catch (err) {
        console.error('Error in /api/alunos/reveal:', err);
        res.status(500).json({ error: 'Failed to reveal student sensitive field.' });
    }
});

// Serve Static Frontend Assets
app.use(express.static(__dirname));

// Serve index.html for all other routes (Single Page Application routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server and Init Database
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    
    if (!db.useLocalFallback) {
        try {
            // Ensure tenant_state table exists
            console.log('Ensuring tenant_state table exists...');
            await db.query(`
                CREATE TABLE IF NOT EXISTS tenant_state (
                    tenant_id VARCHAR(50) PRIMARY KEY,
                    data JSONB,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Run migrations and seed
            await db.runMigrations();
            await db.seedDatabase();
        } catch (err) {
            console.error('Database initialization failed:', err);
        }
    }
});
