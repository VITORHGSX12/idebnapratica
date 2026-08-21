if (typeof window === 'undefined') {
    global.window = global;
}

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const { resolveTenant, validateTenantAccessDB, isBypassLoginAllowed } = require('./middleware_tenant_subdominio');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const IV_LENGTH = 16;


const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(resolveTenant);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        databaseMode: db.useLocalFallback ? 'local-json' : 'postgres',
        tenant: req.tenant || null,
        timestamp: new Date()
    });
});

// Endpoint para consulta do Tenant Atual
app.get('/api/tenant/current', (req, res) => {
    res.json({
        success: true,
        tenant: req.tenant
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
    const cloned = JSON.parse(JSON.stringify(state));
    if (cloned.dbAlunos && Array.isArray(cloned.dbAlunos)) {
        cloned.dbAlunos = cloned.dbAlunos.map(student => {
            const decCpf = decryptText(student.cpf);
            const decAddr = decryptText(student.endereco);
            const decNee = decryptText(student.nee);

            if (role === 'Master Admin') {
                return {
                    ...student,
                    cpf: decCpf,
                    endereco: decAddr,
                    nee: decNee
                };
            } else {
                return {
                    ...student,
                    cpf: maskCPF(decCpf),
                    mae: maskName(student.mae),
                    pai: maskName(student.pai),
                    endereco: maskAddress(decAddr),
                    nee: maskNee(decNee)
                };
            }
        });
    }
    return cloned;
}

function encryptText(text) {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');
        return iv.toString('hex') + ':' + authTag + ':' + encrypted;
    } catch (err) {
        console.error('Encryption failed:', err);
        return text;
    }
}

function decryptText(text) {
    if (!text) return '';
    const textParts = text.split(':');
    if (textParts.length < 3) return text;
    try {
        const iv = Buffer.from(textParts[0], 'hex');
        const authTag = Buffer.from(textParts[1], 'hex');
        const encryptedText = Buffer.from(textParts[2], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption failed:', err);
        return '*** (Erro de Descriptografia)';
    }
}

function encryptSensitiveDataInState(state) {
    const cloned = JSON.parse(JSON.stringify(state));
    if (cloned.dbAlunos && Array.isArray(cloned.dbAlunos)) {
        cloned.dbAlunos = cloned.dbAlunos.map(student => {
            const cpfEnc = (student.cpf && student.cpf.split(':').length < 3) ? encryptText(student.cpf) : student.cpf;
            const addrEnc = (student.endereco && student.endereco.split(':').length < 3) ? encryptText(student.endereco) : student.endereco;
            const neeEnc = (student.nee && student.nee.split(':').length < 3) ? encryptText(student.nee) : student.nee;
            return {
                ...student,
                cpf: cpfEnc,
                endereco: addrEnc,
                nee: neeEnc
            };
        });
    }
    return cloned;
}

const USERS_FILE = path.join(__dirname, 'users.json');

const DEFAULT_USERS = [
    {
        id: 'usr_1',
        nome: 'Secretário Executivo (SEMED)',
        email: 'gestor@goncalvesdias.ma.gov.br',
        password: 'admin',
        role: 'Gestor da Rede',
        escola: null,
        turma: null,
        created_at: new Date().toISOString()
    },
    {
        id: 'usr_2',
        nome: 'Administrador DPO / TI',
        email: 'admin@goncalvesdias.ma.gov.br',
        password: 'admin',
        role: 'Master Admin',
        escola: null,
        turma: null,
        created_at: new Date().toISOString()
    },
    {
        id: 'usr_3',
        nome: 'Diretora Maria Vilanova',
        email: 'diretor.benta@goncalvesdias.ma.gov.br',
        password: '123',
        role: 'Diretor Escola',
        escola: 'U.E. BENTA VILANOVA',
        turma: null,
        created_at: new Date().toISOString()
    },
    {
        id: 'usr_4',
        nome: 'Diretor Raimundo Nonato',
        email: 'diretor.veloso@goncalvesdias.ma.gov.br',
        password: '123',
        role: 'Diretor Escola',
        escola: 'U.E. RAIMUNDO VELOSO BARROS',
        turma: null,
        created_at: new Date().toISOString()
    },
    {
        id: 'usr_5',
        nome: 'Profª. Ana Lúcia (Alfabetização)',
        email: 'professor.benta2@goncalvesdias.ma.gov.br',
        password: '123',
        role: 'Professor',
        escola: 'U.E. BENTA VILANOVA',
        turma: '2º Ano',
        created_at: new Date().toISOString()
    },
    {
        id: 'usr_6',
        nome: 'Prof. Carlos Eduardo (5º Ano)',
        email: 'professor.benta5@goncalvesdias.ma.gov.br',
        password: '123',
        role: 'Professor',
        escola: 'U.E. BENTA VILANOVA',
        turma: '5º Ano',
        created_at: new Date().toISOString()
    },
    {
        id: 'usr_7',
        nome: 'Profª. Juliana Silva (9º Ano)',
        email: 'professor.veloso9@goncalvesdias.ma.gov.br',
        password: '123',
        role: 'Professor',
        escola: 'U.E. RAIMUNDO VELOSO BARROS',
        turma: '9º Ano',
        created_at: new Date().toISOString()
    }
];

function getUsers() {
    if (!fs.existsSync(USERS_FILE)) {
        try {
            fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2), 'utf8');
        } catch (e) {}
        return DEFAULT_USERS;
    }
    try {
        const content = fs.readFileSync(USERS_FILE, 'utf8');
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : DEFAULT_USERS;
    } catch (e) {
        return DEFAULT_USERS;
    }
}

function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving users to disk:', e);
    }
}

function authenticateRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const email = Buffer.from(token, 'base64').toString('utf8').trim().toLowerCase();
        if (!email) return null;

        const allUsers = getUsers();
        const found = allUsers.find(u => u.email.toLowerCase() === email);

        if (found) {
            return {
                id: found.id,
                nome: found.nome,
                email: found.email,
                role: found.role,
                escola: found.escola || null,
                turma: found.turma || null
            };
        }

        // Fallback role resolution for standard email prefixes
        let role = 'Gestor da Rede';
        if (email.startsWith('professor')) {
            role = 'Professor';
        } else if (email.startsWith('diretor')) {
            role = 'Diretor Escola';
        } else if (email.startsWith('dpo') || email.startsWith('admin')) {
            role = 'Master Admin';
        } else if (email.startsWith('gestor')) {
            role = 'Gestor da Rede';
        }

        return {
            email,
            role,
            escola: email.includes('benta') ? 'U.E. BENTA VILANOVA' : (email.includes('veloso') ? 'U.E. RAIMUNDO VELOSO BARROS' : 'U.E. BENTA VILANOVA'),
            turma: email.includes('2') ? '2º Ano' : (email.includes('5') ? '5º Ano' : '9º Ano')
        };
    } catch (e) {
        console.error('Failed to parse auth token:', e);
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
app.get('/api/sync', async (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Acesso negado: Usuário não autenticado.' });
        }
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
app.post('/api/sync', async (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Acesso negado: Usuário não autenticado.' });
        }
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

// POST /api/alunos/reveal - Reveal sensitive field and record audit log
app.post('/api/alunos/reveal', async (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Acesso negado: Usuário não autenticado.' });
        }
        const { matricula, field, justificativa } = req.body;
        const activeTenant = req.tenant.slug;
        const tenantDbId = req.tenant.id || activeTenant;
        
        if (!matricula || !field) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const podeAcessar = await validateTenantAccessDB(user, activeTenant);
        if (!podeAcessar) {
            return res.status(403).json({ error: 'Acesso negado: Você não possui permissão para acessar este tenant/município.' });
        }
        
        if (user.role === 'Professor') {
            return res.status(403).json({ error: 'Acesso negado: Professores não possuem permissão para revelar dados sensíveis.' });
        }
        
        if (user.role === 'Gestor da Rede' && (!justificativa || justificativa.trim().length < 5)) {
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
            const queryResult = await db.queryWithTenant(tenantDbId, 'SELECT data FROM tenant_state WHERE tenant_id = $1', [tenantDbId]);
            if (queryResult.rows.length > 0) {
                state = queryResult.rows[0].data;
            }
        }
        
        const student = state.dbAlunos ? state.dbAlunos.find(a => a.matricula === matricula) : null;
        if (!student) {
            return res.status(404).json({ error: 'Aluno não encontrado.' });
        }
        
        const decryptedValue = decryptText(student[field]);
        const alunoNome = student.nome || 'N/A';
        const actionDetails = justificativa || 'Acesso direto (DPO / Admin)';
        
        if (db.useLocalFallback) {
            if (!state.auditLogs) {
                state.auditLogs = [];
            }
            state.auditLogs.push({
                id: new Date().getTime().toString(),
                usuario_email: user.email,
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
            await db.queryWithTenant(tenantDbId, `
                INSERT INTO public.logs_auditoria (usuario_email, aluno_id, aluno_nome, campo_acessado, justificativa, tenant_id)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [user.email, matricula, alunoNome, field, actionDetails, activeTenant]);
        }
        
        res.json({ success: true, value: decryptedValue });
    } catch (err) {
        console.error('Error in /api/alunos/reveal:', err);
        res.status(500).json({ error: 'Failed to reveal student sensitive field.' });
    }
});

// POST /api/auth/login - Autenticação por credenciais
app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email) {
            return res.status(400).json({ error: 'E-mail é obrigatório.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === cleanEmail);
        
        if (user) {
            if (user.password && password && user.password !== password) {
                return res.status(401).json({ error: 'Senha incorreta.' });
            }
            const token = Buffer.from(user.email).toString('base64');
            return res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    role: user.role,
                    escola: user.escola,
                    turma: user.turma
                }
            });
        }

        // Auto-provisioning/fallback for predefined email patterns
        let role = 'Gestor da Rede';
        if (cleanEmail.startsWith('professor')) role = 'Professor';
        else if (cleanEmail.startsWith('diretor')) role = 'Diretor Escola';
        else if (cleanEmail.startsWith('dpo') || cleanEmail.startsWith('admin')) role = 'Master Admin';

        const token = Buffer.from(cleanEmail).toString('base64');
        return res.json({
            success: true,
            token,
            user: {
                id: 'usr_' + Date.now(),
                nome: cleanEmail.split('@')[0],
                email: cleanEmail,
                role,
                escola: cleanEmail.includes('benta') ? 'U.E. BENTA VILANOVA' : (cleanEmail.includes('veloso') ? 'U.E. RAIMUNDO VELOSO BARROS' : 'U.E. BENTA VILANOVA'),
                turma: cleanEmail.includes('2') ? '2º Ano' : (cleanEmail.includes('5') ? '5º Ano' : '9º Ano')
            }
        });
    } catch (err) {
        console.error('Error in /api/auth/login:', err);
        res.status(500).json({ error: 'Falha no processamento do login.' });
    }
});

// GET /api/users - Listar usuários cadastrados
app.get('/api/users', (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user || (user.role !== 'Master Admin' && user.role !== 'Gestor da Rede')) {
            return res.status(403).json({ error: 'Acesso restrito a administradores e gestores da rede.' });
        }
        const users = getUsers().map(u => {
            const { password, ...rest } = u;
            return rest;
        });
        res.json(users);
    } catch (err) {
        console.error('Error in GET /api/users:', err);
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

// POST /api/users - Cadastrar novo usuário
app.post('/api/users', (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user || (user.role !== 'Master Admin' && user.role !== 'Gestor da Rede')) {
            return res.status(403).json({ error: 'Acesso restrito a administradores e gestores da rede.' });
        }
        const { nome, email, password, role, escola, turma } = req.body || {};
        if (!nome || !email || !role) {
            return res.status(400).json({ error: 'Nome, e-mail e perfil são obrigatórios.' });
        }
        const users = getUsers();
        const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (existing) {
            return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
        }
        const newUser = {
            id: 'usr_' + Date.now(),
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            password: password || '123456',
            role,
            escola: escola || null,
            turma: turma || null,
            created_at: new Date().toISOString()
        };
        users.push(newUser);
        saveUsers(users);
        const { password: _, ...clean } = newUser;
        res.json({ success: true, user: clean });
    } catch (err) {
        console.error('Error in POST /api/users:', err);
        res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
});

// DELETE /api/users/:id - Excluir usuário
app.delete('/api/users/:id', (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user || (user.role !== 'Master Admin' && user.role !== 'Gestor da Rede')) {
            return res.status(403).json({ error: 'Acesso restrito a administradores e gestores da rede.' });
        }
        const { id } = req.params;
        let users = getUsers();
        const initialLen = users.length;
        users = users.filter(u => u.id !== id);
        if (users.length === initialLen) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }
        saveUsers(users);
        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /api/users/:id:', err);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
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

// =============================================================================
// ROTAS DE INTELIGÊNCIA ARTIFICIAL: GERADOR DE QUESTÕES COM GEMINI 3.7 & EMBEDDINGS
// =============================================================================

const geminiQuestionService = require('./services/ai/geminiQuestionService');

app.post('/api/ia/gerar-questao', async (req, res) => {
    try {
        const {
            stage = '5º Ano',
            subject = 'Língua Portuguesa',
            descriptorCode = 'D03',
            difficulty = 'Médio',
            matrix = 'SAEB',
            apiKey = process.env.GEMINI_API_KEY,
            customModel = process.env.GEMINI_MODEL || 'gemini-3.7-flash'
        } = req.body;

        // Obter questões existentes do banco de dados local ou postgres
        let existingQuestions = [];
        try {
            if (fs.existsSync(path.join(__dirname, 'local_db_state.json'))) {
                const stateData = JSON.parse(fs.readFileSync(path.join(__dirname, 'local_db_state.json'), 'utf8'));
                existingQuestions = stateData.dbQuestoes || [];
            }
        } catch(e) {}

        const generatedQuestion = await geminiQuestionService.generateEducationalQuestion({
            stage,
            subject,
            descriptorCode,
            difficulty,
            matrix,
            existingQuestionsDb: existingQuestions,
            apiKey,
            customModel
        });

        res.json({
            success: true,
            question: generatedQuestion
        });
    } catch (err) {
        console.error('[API IA Geração Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Erro ao gerar questão com a API do Gemini.'
        });
    }
});

app.post('/api/ia/embeddings/migrar', async (req, res) => {
    try {
        const { apiKey = process.env.GEMINI_API_KEY } = req.body;
        const localDbPath = path.join(__dirname, 'local_db_state.json');
        if (!fs.existsSync(localDbPath)) {
            return res.json({ success: true, migrated: 0, message: 'Nenhum banco local encontrado.' });
        }

        const stateData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        const questions = stateData.dbQuestoes || [];
        let count = 0;

        for (const q of questions) {
            if (!q.embedding || !Array.isArray(q.embedding)) {
                q.embedding = await geminiQuestionService.generateEmbedding(q.enunciado, apiKey);
                count++;
            }
        }

        fs.writeFileSync(localDbPath, JSON.stringify(stateData, null, 2), 'utf8');
        res.json({
            success: true,
            migrated: count,
            total: questions.length,
            message: `Migração concluída com sucesso! ${count} questões receberam embeddings.`
        });
    } catch (err) {
        console.error('[API IA Migração Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Erro ao migrar embeddings.'
        });
    }
});


// =============================================================================
// ROTAS DE LAUDO TÉCNICO E DIAGNÓSTICO PEDAGÓGICO (4 NÍVEIS & EVOLUÇÃO SIMULADOS)
// =============================================================================

const diagnosticoService = require('./services/diagnostico/diagnosticoService');

app.post('/api/diagnostico/calcular', async (req, res) => {
    try {
        const {
            escola_id = 'all',
            turma_nome = 'all',
            componente = 'all',
            simulado_id = 'sim_2026_02'
        } = req.body;

        const descritores = diagnosticoService.calcularDesempenhoPorDescritor({
            escola_id,
            turma_nome,
            componente,
            simulado_id
        });

        const rankingEscolas = diagnosticoService.calcularRankingEscolas({
            componente
        });

        // Calcular Métricas do Resumo Geral (Cards Topo)
        const totalAlunosAvaliados = descritores.length > 0 ? descritores[0].total_alunos_avaliados : 0;
        const totalAcertos = descritores.reduce((sum, d) => sum + d.total_acertos, 0);
        const totalRespostas = descritores.reduce((sum, d) => sum + d.total_respostas, 0);
        const mediaGeralAcerto = totalRespostas > 0 ? Math.round((totalAcertos / totalRespostas) * 1000) / 10 : 0;

        const descritoresCriticos = descritores.filter(d => d.classificacao === 'critico');

        // Calcular variação média geral entre simulados
        const variacaoMedia = rankingEscolas.length > 0 
            ? Math.round((rankingEscolas.reduce((acc, e) => acc + e.variacao_desde_ultimo_simulado, 0) / rankingEscolas.length) * 10) / 10
            : 0;

        res.json({
            success: true,
            resumo: {
                total_alunos: totalAlunosAvaliados,
                media_geral_acerto: mediaGeralAcerto,
                variacao_ultimo_simulado: variacaoMedia,
                qtd_descritores_criticos: descritoresCriticos.length
            },
            descritores,
            ranking_escolas: rankingEscolas,
            simulados_disponiveis: diagnosticoService.SIMULADOS_OFICIAIS_DB
        });
    } catch (err) {
        console.error('[API Diagnóstico Error]:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/diagnostico/evolucao-aluno', (req, res) => {
    try {
        const { aluno_id } = req.body;
        const evolucao = diagnosticoService.calcularEvolucaoAluno(aluno_id);
        if (!evolucao) {
            return res.status(404).json({ success: false, error: 'Aluno não localizado.' });
        }
        res.json({ success: true, evolucao });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/diagnostico/ficha-aluno', (req, res) => {
    try {
        const { aluno_id, simulado_id = 'sim_2026_02' } = req.body;
        const ficha = diagnosticoService.calcularFichaAluno(aluno_id, simulado_id);
        if (!ficha) {
            return res.status(404).json({ success: false, error: 'Ficha do aluno não localizada.' });
        }
        res.json({ success: true, ficha });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/diagnostico/intervencao-ia', async (req, res) => {
    try {
        const { descritoresCriticos, turmaNome, escolaNome } = req.body;
        const planoTexto = await diagnosticoService.gerarSugestaoIntervencao(descritoresCriticos, turmaNome, escolaNome);
        res.json({ success: true, plano: planoTexto });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.use(express.static(__dirname, {
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// Serve index.html for all other routes (Single Page Application routing)
app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check simples para proxy Railway
app.get('/health', (req, res) => res.status(200).send('OK'));

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
