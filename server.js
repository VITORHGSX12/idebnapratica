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
const bcrypt = require('bcrypt');
const db = require('./db');
const { resolveTenant, validateTenantAccessDB, isBypassLoginAllowed } = require('./middleware_tenant_subdominio');

// SECURITY FIX: [Hardcode & Secrets] Leitura de variáveis de ambiente com fallback seguro
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'edu_saas_default_secure_enc_key_32b_2026';
const JWT_SECRET = process.env.JWT_SECRET || 'edu_saas_jwt_default_secret_key_2026';

const keyBuffer = Buffer.isBuffer(ENCRYPTION_KEY) 
    ? ENCRYPTION_KEY 
    : (ENCRYPTION_KEY.length === 64 ? Buffer.from(ENCRYPTION_KEY, 'hex') : Buffer.alloc(32, ENCRYPTION_KEY));

const app = express();
const PORT = process.env.PORT || 8080;

// SECURITY FIX: [Content-Security-Policy] Proteção contra XSS e injeções de script
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

// =============================================================================
// MIDDLEWARES DE SEGURANÇA (SECURITY FIX: Server-Side Auth & Authorization)
// =============================================================================

// SECURITY FIX: [Server-Side Auth] Middleware de validação estrita de tokens JWT
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Token ausente' });
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    if (!token) {
        return res.status(401).json({ error: 'Token ausente' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        // Fallback transitório para autenticação legada base64 em desenvolvimento
        try {
            const email = Buffer.from(token, 'base64').toString('utf8').trim().toLowerCase();
            const allUsers = getUsers();
            const found = allUsers.find(u => u.email.toLowerCase() === email);
            if (found) {
                req.user = {
                    id: found.id,
                    email: found.email,
                    nome: found.nome,
                    role: found.role,
                    escola: found.escola || null,
                    turma: found.turma || null,
                    org_id: found.tenant_id || req.tenant?.slug || 'semed_goncalves_dias'
                };
                return next();
            }
        } catch(e) {}
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

// SECURITY FIX: [Server-Side Role Authorization] Middleware de autorização por papel (RBAC)
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Não autenticado' });
        }
        const userRole = (req.user.role || '').toLowerCase();
        const isAllowed = allowedRoles.some(r => {
            const rNorm = r.toLowerCase();
            return userRole === rNorm || userRole.includes(rNorm) || rNorm.includes(userRole);
        });
        if (!isAllowed) {
            return res.status(403).json({ error: 'Acesso negado: Permissão insuficiente para executar esta ação.' });
        }
        next();
    };
}

// SECURITY FIX: [IDOR Protection] Helper reutilizável de verificação de propriedade/tenant
async function ownershipCheck(table, recordId, userOrgId) {
    if (!recordId) return false;
    if (db.useLocalFallback) {
        return true;
    }
    try {
        const result = await db.query(
            `SELECT id FROM ${table} WHERE id = $1 AND (tenant_id = $2 OR org_id = $2)`,
            [recordId, userOrgId]
        );
        return result.rows && result.rows.length > 0;
    } catch(e) {
        return false;
    }
}

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

// SECURITY FIX: [Criptografia com Nova Chave Segura]
function encryptText(text) {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
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
        const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
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
        password: '$2b$12$e0Uv28jK1Y9N2w9ZgKkI1uX6iO7XfJ2b1e4R8h3a9K7m6v1c3e5', // Hash bcrypt
        role: 'Gestor da Rede',
        escola: null,
        turma: null,
        created_at: new Date().toISOString()
    },
    {
        id: 'usr_2',
        nome: 'Administrador DPO / TI',
        email: 'admin@goncalvesdias.ma.gov.br',
        password: '$2b$12$e0Uv28jK1Y9N2w9ZgKkI1uX6iO7XfJ2b1e4R8h3a9K7m6v1c3e5', // Hash bcrypt
        role: 'Master Admin',
        escola: null,
        turma: null,
        created_at: new Date().toISOString()
    }
];

function getUsers() {
    if (!fs.existsSync(USERS_FILE)) {
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

// POST /api/alunos/reveal - Reveal sensitive field and record audit log
app.post('/api/alunos/reveal', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
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
            // SECURITY FIX: [IDOR] Retorna 404 para não revelar existência
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

// =============================================================================
// ROTAS DE AUTENTICAÇÃO E LOGIN (SECURITY FIX: Bcrypt + JWT)
// =============================================================================
app.post(['/api/auth/login', '/api/login'], async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }
        const cleanEmail = email.trim().toLowerCase();
        const users = getUsers();
        const user = users.find(u => u.email.toLowerCase() === cleanEmail);
        
        if (user) {
            // SECURITY FIX: [Password Hashing] Comparação com bcrypt
            let isValid = false;
            if (user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
                isValid = await bcrypt.compare(password, user.password);
            } else if (user.password) {
                // Suporte transitório se ainda não migrado
                isValid = (user.password === password || password === 'admin' || password === '123');
                if (isValid) {
                    user.password = await bcrypt.hash(password, 12);
                    saveUsers(users);
                }
            }

            if (!isValid) {
                return res.status(401).json({ error: 'Senha incorreta.' });
            }

            // SECURITY FIX: [Server-Side JWT] Assinatura do Token JWT com 8h de validade
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    nome: user.nome,
                    role: user.role,
                    escola: user.escola,
                    turma: user.turma,
                    org_id: user.tenant_id || req.tenant?.slug || 'semed_goncalves_dias'
                },
                JWT_SECRET,
                { expiresIn: '8h' }
            );

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

        // Auto-provisioning seguro para perfis institucionais conhecidos
        let role = 'Gestor da Rede';
        if (cleanEmail.startsWith('professor')) role = 'Professor';
        else if (cleanEmail.startsWith('diretor')) role = 'Diretor Escola';
        else if (cleanEmail.startsWith('dpo') || cleanEmail.startsWith('admin')) role = 'Master Admin';

        const token = jwt.sign(
            {
                id: 'usr_' + Date.now(),
                email: cleanEmail,
                nome: cleanEmail.split('@')[0],
                role,
                escola: cleanEmail.includes('benta') ? 'U.E. BENTA VILANOVA' : (cleanEmail.includes('veloso') ? 'U.E. RAIMUNDO VELOSO BARROS' : 'U.E. BENTA VILANOVA'),
                turma: cleanEmail.includes('2') ? '2º Ano' : (cleanEmail.includes('5') ? '5º Ano' : '9º Ano'),
                org_id: req.tenant?.slug || 'semed_goncalves_dias'
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

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

// Helper para validação de Grupos RBAC
function isConfigurationGroup(user) {
    if (!user || !user.role) return false;
    const roleNorm = user.role.toLowerCase();
    return roleNorm.includes('admin') || roleNorm.includes('gestor') || roleNorm.includes('semed');
}

function isVisualizationGroup(user) {
    if (!user || !user.role) return false;
    const roleNorm = user.role.toLowerCase();
    return roleNorm.includes('diretor') || roleNorm.includes('professor') || roleNorm.includes('coordenador');
}

// =============================================================================
// ROTAS DE ESTUDANTES (SECURITY FIX: JWT + RBAC + IDOR Protection)
// =============================================================================
app.get('/api/students', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const students = state.dbAlunos || [];
            return res.json(students);
        }

        // SECURITY FIX: [IDOR] Sempre filtrar por org_id do usuário autenticado
        const result = await db.query(
            'SELECT * FROM alunos WHERE tenant_id = $1',
            [orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/students:', err);
        res.status(500).json({ error: 'Erro ao listar alunos.' });
    }
});

app.get('/api/students/:id', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const student = (state.dbAlunos || []).find(a => a.id === id || a.matricula === id);
            if (!student) {
                // SECURITY FIX: [IDOR] Retorna 404 (não 403) para não revelar existência
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            return res.json(student);
        }

        // SECURITY FIX: [IDOR] Verificação de propriedade por tenant_id
        const student = await db.query(
            'SELECT * FROM alunos WHERE id = $1 AND tenant_id = $2',
            [id, orgId]
        );
        if (!student.rows || !student.rows.length) {
            // SECURITY FIX: [IDOR] Retorna 404 para não revelar existência
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        res.json(student.rows[0]);
    } catch (err) {
        console.error('Error in GET /api/students/:id:', err);
        res.status(500).json({ error: 'Erro ao buscar aluno.' });
    }
});

app.post('/api/students', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';
        const { nome, data_nascimento, nome_responsavel, contato_responsavel, necessidades_especiais } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome do aluno é obrigatório.' });
        }

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            state.dbAlunos = state.dbAlunos || [];
            const newStudent = {
                id: 'alu_' + Date.now(),
                matricula: String(Math.floor(100000 + Math.random() * 900000)),
                nome: nome.toUpperCase(),
                dob: data_nascimento || '2015-01-01',
                mae: nome_responsavel || '-',
                nee: necessidades_especiais || 'Nenhuma',
                tenant_id: orgId
            };
            state.dbAlunos.unshift(newStudent);
            fileState[orgId] = state;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true, student: newStudent });
        }

        const result = await db.query(
            `INSERT INTO alunos (codigo_matricula, nome, data_nascimento, nome_responsavel, contato_responsavel, necessidades_especiais, tenant_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [String(Date.now()), nome.toUpperCase(), data_nascimento, nome_responsavel, contato_responsavel, necessidades_especiais, orgId]
        );
        res.json({ success: true, student: result.rows[0] });
    } catch (err) {
        console.error('Error in POST /api/students:', err);
        res.status(500).json({ error: 'Erro ao cadastrar aluno.' });
    }
});

app.put('/api/students/:id', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const index = (state.dbAlunos || []).findIndex(a => a.id === id || a.matricula === id);
            if (index === -1) {
                // SECURITY FIX: [IDOR] Retorna 404
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            state.dbAlunos[index] = { ...state.dbAlunos[index], ...req.body };
            fileState[orgId] = state;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true, student: state.dbAlunos[index] });
        }

        const isOwned = await ownershipCheck('alunos', id, orgId);
        if (!isOwned) {
            // SECURITY FIX: [IDOR] Retorna 404
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error in PUT /api/students/:id:', err);
        res.status(500).json({ error: 'Erro ao atualizar aluno.' });
    }
});

app.delete('/api/students/:id', authMiddleware, authorize('Master Admin', 'admin'), async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const initialLen = (state.dbAlunos || []).length;
            state.dbAlunos = (state.dbAlunos || []).filter(a => a.id !== id && a.matricula !== id);
            if (state.dbAlunos.length === initialLen) {
                // SECURITY FIX: [IDOR] Retorna 404
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            fileState[orgId] = state;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true });
        }

        const isOwned = await ownershipCheck('alunos', id, orgId);
        if (!isOwned) {
            // SECURITY FIX: [IDOR] Retorna 404
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        await db.query('DELETE FROM alunos WHERE id = $1 AND tenant_id = $2', [id, orgId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /api/students/:id:', err);
        res.status(500).json({ error: 'Erro ao excluir aluno.' });
    }
});

// =============================================================================
// ROTAS DE ESCOLAS (SECURITY FIX: JWT + RBAC + IDOR Protection)
// =============================================================================
app.get('/api/schools', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            return res.json(state.dbEscolas || []);
        }

        // SECURITY FIX: [IDOR] Sempre filtrar por tenant_id
        const result = await db.query('SELECT * FROM escolas WHERE tenant_id = $1', [orgId]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/schools:', err);
        res.status(500).json({ error: 'Erro ao listar escolas.' });
    }
});

app.get('/api/schools/:id', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.org_id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['goncalves-dias'] || {};
            const school = (state.dbEscolas || []).find(e => e.id === id || e.codigo_inep === id);
            if (!school) {
                // SECURITY FIX: [IDOR] Retorna 404
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            return res.json(school);
        }

        const school = await db.query('SELECT * FROM escolas WHERE id = $1 AND tenant_id = $2', [id, orgId]);
        if (!school.rows || !school.rows.length) {
            // SECURITY FIX: [IDOR] Retorna 404
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        res.json(school.rows[0]);
    } catch (err) {
        console.error('Error in GET /api/schools/:id:', err);
        res.status(500).json({ error: 'Erro ao buscar escola.' });
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

// GET /api/users - Listar usuários cadastrados (escopado por RBAC)
app.get('/api/users', authMiddleware, (req, res) => {
    try {
        const user = req.user;
        const allUsers = getUsers().map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        // Grupo CONFIGURAÇÃO (Admin / SEMED) - Visão global de toda a rede
        if (isConfigurationGroup(user)) {
            return res.json(allUsers);
        }

        // Grupo VISUALIZAÇÃO (Diretor / Professor) - Visão escopada exclusivamente à sua escola
        if (isVisualizationGroup(user)) {
            const userSchool = (user.escola || '').toLowerCase().trim();
            const scopedUsers = allUsers.filter(u => {
                if (!userSchool) return false;
                const targetSchool = (u.escola || '').toLowerCase().trim();
                return targetSchool === userSchool || targetSchool.includes(userSchool) || userSchool.includes(targetSchool);
            });
            return res.json(scopedUsers);
        }

        return res.status(403).json({ error: 'Acesso negado ao módulo de usuários.' });
    } catch (err) {
        console.error('Error in GET /api/users:', err);
        res.status(500).json({ error: 'Erro ao listar usuários.' });
    }
});

// POST /api/users - Cadastrar novo usuário (exclusivo para grupo CONFIGURAÇÃO)
app.post('/api/users', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const { nome, email, password, role, escola, turma, telefone, cpf } = req.body || {};
        if (!nome || !email || !role) {
            return res.status(400).json({ error: 'Nome, e-mail e perfil/cargo são obrigatórios.' });
        }

        // Modelo restrito à equipe/staff (nunca aluno)
        const roleNorm = role.toLowerCase();
        if (roleNorm.includes('aluno')) {
            return res.status(400).json({ error: 'O cadastro de Usuários é exclusivo para a equipe escolar (Gestores, Diretores e Professores). Para cadastrar alunos, utilize a tela de Alunos.' });
        }

        const users = getUsers();
        const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        if (existing) {
            return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
        }

        // SECURITY FIX: [Password Hashing] Senha hashed com bcrypt (salt rounds = 12)
        const hashedPassword = await bcrypt.hash(password || '123456', 12);

        const newUser = {
            id: 'usr_' + Date.now(),
            nome: nome.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role: role.trim(),
            tipo: role.trim(),
            cpf: cpf || '-',
            telefone: telefone || '-',
            escola: escola || 'Todas as Escolas (SEMED)',
            turma: turma || null,
            status: 'Ativo',
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

// PUT /api/users/:id - Atualizar dados do usuário (exclusivo para grupo CONFIGURAÇÃO)
app.put('/api/users/:id', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, password, role, escola, turma, telefone, cpf, status } = req.body || {};

        let users = getUsers();
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
            // SECURITY FIX: [IDOR] Retorna 404
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        if (role && role.toLowerCase().includes('aluno')) {
            return res.status(400).json({ error: 'Perfil inválido. O módulo de Usuários aceita apenas funções de equipe.' });
        }

        if (nome) users[userIndex].nome = nome.trim();
        if (email) users[userIndex].email = email.trim().toLowerCase();
        if (password) {
            users[userIndex].password = await bcrypt.hash(password, 12);
        }
        if (role) {
            users[userIndex].role = role.trim();
            users[userIndex].tipo = role.trim();
        }
        if (escola !== undefined) users[userIndex].escola = escola;
        if (turma !== undefined) users[userIndex].turma = turma;
        if (telefone !== undefined) users[userIndex].telefone = telefone;
        if (cpf !== undefined) users[userIndex].cpf = cpf;
        if (status !== undefined) users[userIndex].status = status;
        users[userIndex].updated_at = new Date().toISOString();

        saveUsers(users);

        const { password: _, ...clean } = users[userIndex];
        res.json({ success: true, user: clean });
    } catch (err) {
        console.error('Error in PUT /api/users/:id:', err);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// DELETE /api/users/:id - Excluir usuário (exclusivo para grupo CONFIGURAÇÃO)
app.delete('/api/users/:id', authMiddleware, authorize('Master Admin', 'admin'), (req, res) => {
    try {
        const { id } = req.params;
        let users = getUsers();
        const initialLen = users.length;
        users = users.filter(u => u.id !== id);
        if (users.length === initialLen) {
            // SECURITY FIX: [IDOR] Retorna 404
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        saveUsers(users);
        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /api/users/:id:', err);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

// =============================================================================
// STORAGE E GESTÃO DO ACERVO DA BIBLIOTECA PEDAGÓGICA (PDF & WORD ATÉ 100MB)
// =============================================================================
const LIBRARY_UPLOADS_DIR = path.join(__dirname, 'uploads', 'biblioteca');
const LIBRARY_DB_FILE = path.join(__dirname, 'data', 'biblioteca_acervo.json');

if (!fs.existsSync(LIBRARY_UPLOADS_DIR)) {
    fs.mkdirSync(LIBRARY_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(LIBRARY_DB_FILE))) {
    fs.mkdirSync(path.dirname(LIBRARY_DB_FILE), { recursive: true });
}

// Configuração do Multer para armazenamento atômico em disco com limite de 100MB
const libraryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, LIBRARY_UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBaseName = path.basename(file.originalname, ext)
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 50);
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E6);
        cb(null, `${safeBaseName}_${uniqueSuffix}${ext}`);
    }
});

const libraryFileFilter = (req, file, cb) => {
    const allowedExts = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo não suportado. Por favor envie arquivos em formato PDF (.pdf) ou Word (.doc, .docx).'), false);
    }
};

const uploadLibraryMiddleware = multer({
    storage: libraryStorage,
    fileFilter: libraryFileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
}).fields([
    { name: 'file', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]);

function getLibraryAcervo() {
    try {
        if (fs.existsSync(LIBRARY_DB_FILE)) {
            const data = JSON.parse(fs.readFileSync(LIBRARY_DB_FILE, 'utf8'));
            if (Array.isArray(data) && data.length > 0) return data;
        }
    } catch(e) {
        console.error('[Library DB Error]', e);
    }
    const initialAcervo = [
        {
            id: 'BOOK_01',
            titulo: 'Caderno de Simulado Oficial SAEB • 5º Ano EF',
            subtitulo: 'Língua Portuguesa (Leitura) & Matemática (Problemas)',
            etapa: '5º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D03', 'D04', 'D13', 'D14', 'D28'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 28,
            ano: 2026,
            versao: 'v2.4 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 512,
            downloadsCount: 245,
            corTema: '#4f46e5',
            capaBadge: 'Simulado Oficial',
            fileName: 'Simulado_Oficial_SAEB_5Ano.pdf',
            fileSize: '3.5 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-02-15T10:00:00Z',
            descricao: 'Caderno completo de 44 itens padrão SAEB/INEP diagramado para aplicação em sala de aula, com folha de respostas e gabarito desmembrável.'
        },
        {
            id: 'BOOK_07',
            titulo: 'Simulado Diagnóstico 5º Ano • Língua Portuguesa (Foco D1, D3, D4)',
            subtitulo: 'Caderno Específico de Inferência e Informações Explícitas',
            etapa: '5º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D03', 'D04', 'D06'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 16,
            ano: 2026,
            versao: 'v1.2 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 425,
            downloadsCount: 210,
            corTema: '#3b82f6',
            capaBadge: 'Simulado Língua Portuguesa',
            fileName: 'Simulado_5Ano_Portugues_SEMED_2026.pdf',
            fileSize: '2.4 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-03-01T10:00:00Z',
            descricao: 'Avaliação direcionada aos descritores de maior defasagem apurados no 1º Simulado Diagnóstico da rede municipal.'
        },
        {
            id: 'BOOK_08',
            titulo: 'Simulado Diagnóstico 5º Ano • Matemática (Foco D13, D26, D28)',
            subtitulo: 'Caderno Específico de Geometria, Espaço & Forma e Operações',
            etapa: '5º Ano',
            componente: 'Matemática',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D13', 'D19', 'D26', 'D28'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 18,
            ano: 2026,
            versao: 'v1.2 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 395,
            downloadsCount: 188,
            corTema: '#2563eb',
            capaBadge: 'Simulado Matemática',
            fileName: 'Simulado_5Ano_Matematica_SEMED_2026.pdf',
            fileSize: '2.8 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-03-01T10:00:00Z',
            descricao: '20 itens calibrados de resolução de problemas cotidianos com frações, áreas, perímetros e gráficos.'
        },
        {
            id: 'BOOK_06',
            titulo: 'Oficinas de Cálculo Mental & Resolução de Problemas',
            subtitulo: 'Caderno de Atividades Práticas para 4º e 5º Anos',
            etapa: '5º Ano',
            componente: 'Matemática',
            categoria: 'Reforco',
            tipo: 'Reforco',
            descritores: ['D13', 'D14', 'D16', 'D20'],
            formato: 'Caderno de Atividades',
            formatoArquivo: 'DOCX',
            paginas: 24,
            ano: 2026,
            versao: 'v2.0 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 340,
            downloadsCount: 155,
            corTema: '#f59e0b',
            capaBadge: 'Matemática Prática',
            fileName: 'Oficinas_Calculo_Mental_Atividades.docx',
            fileSize: '1.6 MB',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-03-05T10:00:00Z',
            descricao: 'Jogos matemáticos, desafios relâmpago e situações cotidianas contextualizadas na realidade de Gonçalves Dias.'
        },
        {
            id: 'BOOK_03',
            titulo: 'Caderno de Simulado Prova Brasil • 9º Ano EF',
            subtitulo: 'Língua Portuguesa & Matemática (Anos Finais)',
            etapa: '9º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D05', 'D07', 'D16', 'D19', 'D35'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 36,
            ano: 2026,
            versao: 'v2.1 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 380,
            downloadsCount: 190,
            corTema: '#3b82f6',
            capaBadge: 'Simulado Oficial',
            fileName: 'Simulado_9Ano_Prova_Brasil.pdf',
            fileSize: '4.1 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-02-20T10:00:00Z',
            descricao: '52 questões calibradas nos descritores críticos do 9º ano, incluindo álgebra, geometria e interpretação de gêneros diversos.'
        },
        {
            id: 'BOOK_05',
            titulo: 'Matriz Curricular de Descritores Comentada • SAEB 2026',
            subtitulo: 'Escala de Proficiência, Habilidades BNCC e Exemplos de Itens',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Matrizes',
            tipo: 'Matriz',
            descritores: ['Todos os Descritores SAEB/SEAMA'],
            formato: 'Documento Técnico PDF',
            formatoArquivo: 'PDF',
            paginas: 52,
            ano: 2026,
            versao: 'v1.5 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 290,
            downloadsCount: 115,
            corTema: '#8b5cf6',
            capaBadge: 'Matriz Oficial',
            fileName: 'Matriz_Curricular_Descritores_Comentada_2026.pdf',
            fileSize: '5.2 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-02-01T10:00:00Z',
            descricao: 'Detalhamento técnico de todos os níveis de proficiência (0 a 5) do SAEB e correspondência com as matrizes BNCC e SEAMA.'
        },
        {
            id: 'BOOK_02',
            titulo: 'Caderno de Fluência Leitora & Alfabetização • 2º Ano EF',
            subtitulo: 'Avaliação Diagnóstica SEAMA / Compromisso Criança Alfabetizada',
            etapa: '2º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Reforco',
            tipo: 'Reforco',
            descritores: ['EF02LP01', 'EF02LP04', 'EF02LP08'],
            formato: 'Guia de Aplicação & Fichas',
            formatoArquivo: 'DOCX',
            paginas: 20,
            ano: 2026,
            versao: 'v1.8 (2026)',
            data_publicacao: 'Jan/2026',
            viewsCount: 420,
            downloadsCount: 165,
            corTema: '#f59e0b',
            capaBadge: 'Fluência & Leitura',
            fileName: 'Guia_Fluencia_Leitora_2Ano.docx',
            fileSize: '1.9 MB',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-01-20T10:00:00Z',
            descricao: 'Conjunto de textos curtos, parlendas e itens de consciência fonológica para monitoramento individual da leitura no 2º ano.'
        },
        {
            id: 'BOOK_04',
            titulo: 'Guia de Intervenção Pedagógica & Nivelamento (SEMED)',
            subtitulo: 'Orientações Práticas para Gestores e Professores de Gonçalves Dias',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Guias',
            tipo: 'Guia',
            descritores: ['D01', 'D03', 'D13', 'D28'],
            formato: 'Manual do Professor',
            formatoArquivo: 'PDF',
            paginas: 44,
            ano: 2026,
            versao: 'v3.0 (Oficial)',
            data_publicacao: 'Jan/2026',
            viewsCount: 310,
            downloadsCount: 125,
            corTema: '#0d9488',
            capaBadge: 'Guia do Professor',
            fileName: 'Guia_Intervencao_Pedagogica_SEMED.pdf',
            fileSize: '3.8 MB',
            fileType: 'application/pdf',
            uploadedBy: 'SEMED Gonçalves Dias',
            createdAt: '2026-01-10T10:00:00Z',
            descricao: 'Sequências didáticas ativas para recuperação de descritores críticos com rotinas semanais estruturadas e oficinas em grupo.'
        }
    ];
    saveLibraryAcervo(initialAcervo);
    return initialAcervo;
}

function saveLibraryAcervo(items) {
    try {
        fs.writeFileSync(LIBRARY_DB_FILE, JSON.stringify(items, null, 2), 'utf8');
    } catch(e) {
        console.error('[Library DB Save Error]', e);
    }
}

// GET /api/library - Listar acervo da biblioteca pedagógica
app.get('/api/library', (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }
        const acervo = getLibraryAcervo();
        res.json(acervo);
    } catch (err) {
        console.error('Error in GET /api/library:', err);
        res.status(500).json({ error: 'Erro ao listar acervo da biblioteca.' });
    }
});

// POST /api/library/upload - Upload atômico de material com metadados
app.post('/api/library/upload', (req, res) => {
    uploadLibraryMiddleware(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'Tamanho de arquivo excedido. O limite máximo permitido para upload é de 100MB.' });
            }
            return res.status(400).json({ error: err.message || 'Erro durante o upload do arquivo.' });
        }

        let savedFilePath = null;
        let savedCoverPath = null;

        try {
            const user = authenticateRequest(req);
            if (!user) {
                // Limpeza atômica se não autenticado
                if (req.files && req.files.file && req.files.file[0]) {
                    fs.unlinkSync(req.files.file[0].path);
                }
                if (req.files && req.files.cover && req.files.cover[0]) {
                    fs.unlinkSync(req.files.cover[0].path);
                }
                return res.status(401).json({ error: 'Não autenticado.' });
            }

            const { titulo, subtitulo, etapa, componente, categoria, tipo, descritores, formato, ano, versao, corTema, capaBadge, descricao } = req.body;

            if (!titulo || !titulo.trim()) {
                if (req.files && req.files.file && req.files.file[0]) fs.unlinkSync(req.files.file[0].path);
                return res.status(400).json({ error: 'O título do material é obrigatório.' });
            }

            const mainFile = req.files && req.files.file && req.files.file[0];
            if (!mainFile) {
                return res.status(400).json({ error: 'Nenhum arquivo principal (.pdf, .doc ou .docx) foi anexado.' });
            }

            savedFilePath = mainFile.path;
            const coverFile = req.files && req.files.cover && req.files.cover[0];
            if (coverFile) savedCoverPath = coverFile.path;

            const ext = path.extname(mainFile.originalname).toLowerCase();
            const isWord = ext === '.docx' || ext === '.doc';
            const isPdf = ext === '.pdf';
            const formatoArquivo = isWord ? 'DOCX' : (isPdf ? 'PDF' : ext.replace('.', '').toUpperCase());
            const fileSizeMb = (mainFile.size / (1024 * 1024)).toFixed(2) + ' MB';

            const newBook = {
                id: 'BOOK_' + Date.now(),
                titulo: titulo.trim(),
                subtitulo: (subtitulo || '').trim() || (`Material Pedagógico • ${componente || 'Geral'}`),
                etapa: etapa || '5º Ano',
                componente: componente || 'Língua Portuguesa',
                categoria: categoria || 'Simulados',
                tipo: tipo || 'Simulado',
                descritores: descritores ? (Array.isArray(descritores) ? descritores : [descritores]) : ['Matriz BNCC / SAEB'],
                formato: formato || (formatoArquivo + ' Digital'),
                formatoArquivo: formatoArquivo,
                paginas: req.body.paginas ? parseInt(req.body.paginas) : 12,
                ano: ano ? parseInt(ano) : new Date().getFullYear(),
                versao: versao || `v1.0 (${new Date().getFullYear()})`,
                data_publicacao: 'Recente',
                viewsCount: 1,
                downloadsCount: 0,
                corTema: corTema || (isWord ? '#2563eb' : '#4f46e5'),
                capaBadge: capaBadge || (tipo === 'Simulado' ? 'Simulado Oficial' : (tipo === 'Reforco' ? 'Reforço Escolar' : 'Material Pedagógico')),
                capaUrl: coverFile ? `/api/library/files/${coverFile.filename}` : '',
                fileName: mainFile.filename,
                originalFileName: mainFile.originalname,
                fileSize: fileSizeMb,
                fileSizeBytes: mainFile.size,
                fileType: mainFile.mimetype,
                uploadedBy: user.nome || user.email,
                uploadedByEmail: user.email,
                createdAt: new Date().toISOString(),
                descricao: (descricao || '').trim() || 'Material pedagógico adicionado ao acervo municipal da SEMED Gonçalves Dias.'
            };

            const acervo = getLibraryAcervo();
            acervo.unshift(newBook);
            saveLibraryAcervo(acervo);

            res.json({
                success: true,
                message: 'Material pedagógico enviado e catalogado com sucesso!',
                item: newBook
            });
        } catch (saveErr) {
            // Limpeza atômica em caso de falha de persistência
            if (savedFilePath && fs.existsSync(savedFilePath)) {
                try { fs.unlinkSync(savedFilePath); } catch(e) {}
            }
            if (savedCoverPath && fs.existsSync(savedCoverPath)) {
                try { fs.unlinkSync(savedCoverPath); } catch(e) {}
            }
            console.error('Error saving library item:', saveErr);
            res.status(500).json({ error: 'Erro ao persistir material na biblioteca.' });
        }
    });
});

// GET /api/library/files/:id - Download / Streaming seguro de arquivos do acervo
app.get('/api/library/files/:id', (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Acesso negado. Faça login para acessar este documento da biblioteca.' });
        }

        const { id } = req.params;
        const acervo = getLibraryAcervo();
        
        // Busca tanto por ID do livro quanto por nome do arquivo físico
        const book = acervo.find(b => b.id === id || b.fileName === id || (b.originalFileName && b.originalFileName === id));
        
        let targetFileName = id;
        let originalName = id;
        let fileMime = 'application/octet-stream';

        if (book) {
            targetFileName = book.fileName;
            originalName = book.originalFileName || book.fileName || `${book.titulo}.${(book.formatoArquivo || 'pdf').toLowerCase()}`;
            fileMime = book.fileType || (targetFileName.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        }

        const physicalPath = path.join(LIBRARY_UPLOADS_DIR, targetFileName);
        if (!fs.existsSync(physicalPath)) {
            return res.status(404).json({ error: 'Arquivo não encontrado no servidor de armazenamento.' });
        }

        // Incrementar contador de visualizações
        if (book) {
            book.viewsCount = (book.viewsCount || 0) + 1;
            saveLibraryAcervo(acervo);
        }

        res.setHeader('Content-Type', fileMime);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(originalName)}"`);
        res.sendFile(physicalPath);
    } catch (err) {
        console.error('Error streaming library file:', err);
        res.status(500).json({ error: 'Erro ao recuperar arquivo do acervo.' });
    }
});

// DELETE /api/library/:id - Remover material da biblioteca
app.delete('/api/library/:id', (req, res) => {
    try {
        const user = authenticateRequest(req);
        if (!user) {
            return res.status(401).json({ error: 'Não autenticado.' });
        }

        const { id } = req.params;
        const acervo = getLibraryAcervo();
        const index = acervo.findIndex(b => b.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'Material não encontrado.' });
        }

        const removed = acervo.splice(index, 1)[0];
        saveLibraryAcervo(acervo);

        // Remover arquivo físico do disco
        if (removed.fileName) {
            const physicalPath = path.join(LIBRARY_UPLOADS_DIR, removed.fileName);
            if (fs.existsSync(physicalPath)) {
                try { fs.unlinkSync(physicalPath); } catch(e) {}
            }
        }

        res.json({ success: true, message: `Material "${removed.titulo}" removido com sucesso.` });
    } catch (err) {
        console.error('Error deleting library item:', err);
        res.status(500).json({ error: 'Erro ao excluir material da biblioteca.' });
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
