// =============================================================================
// ROTAS DE GESTÃO DE ESTUDANTES, LGPD & CRIPTOGRAFIA (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db');
const { authMiddleware, authorize, ownershipCheck } = require('../middleware/auth');
const { validateTenantAccessDB } = require('../middleware_tenant_subdominio');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'edu_saas_default_secure_enc_key_32b_2026';
const keyBuffer = Buffer.isBuffer(ENCRYPTION_KEY) 
    ? ENCRYPTION_KEY 
    : (ENCRYPTION_KEY.length === 64 ? Buffer.from(ENCRYPTION_KEY, 'hex') : Buffer.alloc(32, ENCRYPTION_KEY));

// =============================================================================
// MASKING HELPERS (LGPD COMPLIANCE)
// =============================================================================
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

// =============================================================================
// CRIPTOGRAFIA AES-256-GCM
// =============================================================================
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

// =============================================================================
// ROTAS DE ESTUDANTES
// =============================================================================

// GET /api/students - Listar alunos com isolamento IDOR
router.get('/students', authMiddleware, async (req, res) => {
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

        const result = await db.query(
            'SELECT * FROM alunos WHERE tenant_id = $1 ORDER BY nome ASC',
            [orgId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /api/students:', err);
        res.status(500).json({ error: 'Erro ao listar alunos.' });
    }
});

// GET /api/students/:id - Buscar estudante específico
router.get('/students/:id', authMiddleware, async (req, res) => {
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
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            return res.json(student);
        }

        const student = await db.query(
            'SELECT * FROM alunos WHERE id = $1 AND tenant_id = $2',
            [id, orgId]
        );
        if (!student.rows || !student.rows.length) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        res.json(student.rows[0]);
    } catch (err) {
        console.error('Error in GET /api/students/:id:', err);
        res.status(500).json({ error: 'Erro ao buscar aluno.' });
    }
});

// POST /api/students - Cadastrar estudante
router.post('/students', authMiddleware, async (req, res) => {
    try {
        const studentData = req.body || {};
        if (!studentData.nome || (!studentData.matricula && !studentData.nome)) {
            return res.status(400).json({ error: 'Nome do aluno é obrigatório.' });
        }

        const activeTenant = req.tenant?.slug || 'gd';
        const tenantDbId = req.tenant?.id || activeTenant;

        const newStudent = {
            ...studentData,
            id: `aln_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            matricula: studentData.matricula || String(Math.floor(100000 + Math.random() * 900000)),
            created_at: new Date().toISOString()
        };

        if (db.useLocalFallback) {
            let fileState = {};
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                try { fileState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8')); } catch(e) {}
            }
            if (!fileState[activeTenant]) fileState[activeTenant] = {};
            if (!fileState[activeTenant].dbAlunos) fileState[activeTenant].dbAlunos = [];
            fileState[activeTenant].dbAlunos.push(newStudent);
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
        } else {
            await db.queryWithTenant(tenantDbId, `
                INSERT INTO alunos (tenant_id, nome, matricula, turma_id, cpf, nascimento)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [tenantDbId, newStudent.nome, newStudent.matricula, newStudent.turma_id || null, encryptText(newStudent.cpf), newStudent.nascimento || null]);
        }

        return res.status(201).json({ success: true, student: newStudent });
    } catch(err) {
        console.error('Error in POST /api/students:', err);
        res.status(500).json({ error: 'Falha ao sincronizar aluno na nuvem.' });
    }
});

// POST /api/alunos/reveal - Revelação de campo sensível com auditoria
router.post('/alunos/reveal', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const { matricula, field, justificativa } = req.body;
        const activeTenant = req.tenant?.slug || 'gd';
        const tenantDbId = req.tenant?.id || activeTenant;
        
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

// PUT /api/students/:id - Atualizar aluno
router.put('/students/:id', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
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
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            state.dbAlunos[index] = { ...state.dbAlunos[index], ...req.body };
            fileState[orgId] = state;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true, student: state.dbAlunos[index] });
        }

        const isOwned = await ownershipCheck('alunos', id, orgId);
        if (!isOwned) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error in PUT /api/students/:id:', err);
        res.status(500).json({ error: 'Erro ao atualizar aluno.' });
    }
});

// DELETE /api/students/:id - Excluir aluno
router.delete('/students/:id', authMiddleware, authorize('Master Admin', 'admin'), async (req, res) => {
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
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            fileState[orgId] = state;
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true });
        }

        const isOwned = await ownershipCheck('alunos', id, orgId);
        if (!isOwned) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        await db.query('DELETE FROM alunos WHERE id = $1 AND tenant_id = $2', [id, orgId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /api/students/:id:', err);
        res.status(500).json({ error: 'Erro ao excluir aluno.' });
    }
});

module.exports = {
    alunosRouter: router,
    maskCPF,
    maskName,
    maskAddress,
    maskNee,
    applyMaskingToState,
    encryptText,
    decryptText,
    encryptSensitiveDataInState
};
