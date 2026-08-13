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

// GET /api/sync - Retrieve state with masking
app.get('/api/sync', async (req, res) => {
    try {
        const { role } = req.query;
        let state = {};
        if (db.useLocalFallback) {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
                state = JSON.parse(raw);
            }
        } else {
            const queryResult = await db.query('SELECT data FROM tenant_state WHERE tenant_id = $1', ['default']);
            if (queryResult.rows.length > 0) {
                state = queryResult.rows[0].data;
            }
        }
        const maskedState = applyMaskingToState(state, role);
        return res.json(maskedState);
    } catch (err) {
        console.error('Error in GET /api/sync:', err);
        res.status(500).json({ error: 'Failed to retrieve database state.' });
    }
});

// POST /api/sync - Persist state with merging
app.post('/api/sync', async (req, res) => {
    try {
        const incomingState = req.body;
        let currentState = {};
        if (db.useLocalFallback) {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                currentState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8'));
            }
        } else {
            const queryResult = await db.query('SELECT data FROM tenant_state WHERE tenant_id = $1', ['default']);
            if (queryResult.rows.length > 0) {
                currentState = queryResult.rows[0].data;
            }
        }
        
        const mergedState = mergeStates(incomingState, currentState);
        
        if (db.useLocalFallback) {
            if (currentState.auditLogs) {
                mergedState.auditLogs = currentState.auditLogs;
            }
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(mergedState, null, 2));
            return res.json({ success: true });
        } else {
            await db.query(`
                INSERT INTO tenant_state (tenant_id, data, updated_at)
                VALUES ($1, $2, CURRENT_TIMESTAMP)
                ON CONFLICT (tenant_id)
                DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
            `, ['default', JSON.stringify(mergedState)]);
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
        
        if (!matricula || !field || !userEmail || !userRole) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }
        
        if (userRole === 'Professor') {
            return res.status(403).json({ error: 'Acesso negado: Professores não possuem permissão para revelar dados sensíveis.' });
        }
        
        if (userRole === 'Gestor da Rede' && (!justificativa || justificativa.trim().length < 5)) {
            return res.status(400).json({ error: 'Justificativa obrigatória para gestores da rede (mínimo de 5 caracteres).' });
        }
        
        let state = {};
        if (db.useLocalFallback) {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                state = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8'));
            }
        } else {
            const queryResult = await db.query('SELECT data FROM tenant_state WHERE tenant_id = $1', ['default']);
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
                tenant_id: tenantId || 'default',
                timestamp: new Date().toISOString()
            });
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(state, null, 2));
        } else {
            await db.query(`
                INSERT INTO public.logs_auditoria (usuario_email, aluno_id, aluno_nome, campo_acessado, justificativa, tenant_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [userEmail, matricula, alunoNome, field, actionDetails, tenantId || 'default']);
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
