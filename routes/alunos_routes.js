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
const { normalizeUppercaseEntity } = require('../services/normalization_service');

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
// VALIDAÇÃO E FORMATAÇÃO DE CPF (MOD 11)
// =============================================================================
function isValidCPF(cpf) {
    if (!cpf) return false;
    const clean = String(cpf).replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false; // Rejeita CPFs repetidos como 11111111111

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(clean.charAt(i), 10) * (10 - i);
    }
    let rest = 11 - (sum % 11);
    let dig1 = (rest === 10 || rest === 11) ? 0 : rest;
    if (dig1 !== parseInt(clean.charAt(9), 10)) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(clean.charAt(i), 10) * (11 - i);
    }
    rest = 11 - (sum % 11);
    let dig2 = (rest === 10 || rest === 11) ? 0 : rest;
    return dig2 === parseInt(clean.charAt(10), 10);
}

function formatCPF(cpf) {
    if (!cpf) return '';
    const clean = String(cpf).replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

// =============================================================================
// ROTAS DE ESTUDANTES
// =============================================================================

// GET /api/students - Listar alunos com isolamento IDOR e unificação de rede
router.get('/students', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['semed_goncalves_dias'] || fileState['gd'] || fileState['goncalves-dias'] || {};
            const students = state.dbAlunos || [];
            return res.json(students);
        }

        const result = await db.query(
            `SELECT a.*, t.nome as turma_nome, t.serie as etapa, e.nome as escola
             FROM alunos a
             LEFT JOIN turmas t ON a.turma_id = t.id
             LEFT JOIN escolas e ON t.escola_id = e.id
             WHERE a.tenant_id::text = $1::text 
                OR a.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
                OR a.tenant_id = (SELECT id FROM tenants WHERE slug = 'semed_goncalves_dias' OR slug = 'gd' LIMIT 1)
                OR $1::text IN ('semed_goncalves_dias', 'gd', 'goncalves-dias')
             ORDER BY a.nome ASC`,
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
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['semed_goncalves_dias'] || fileState['gd'] || fileState['goncalves-dias'] || {};
            const student = (state.dbAlunos || []).find(a => a.id === id || a.matricula === id);
            if (!student) {
                return res.status(404).json({ error: 'Registro não encontrado' });
            }
            return res.json(student);
        }

        const student = await db.query(
            `SELECT a.*, t.nome as turma_nome, t.serie as etapa, e.nome as escola
             FROM alunos a
             LEFT JOIN turmas t ON a.turma_id = t.id
             LEFT JOIN escolas e ON t.escola_id = e.id
             WHERE (a.id::text = $1::text OR a.matricula::text = $1::text)
               AND (a.tenant_id::text = $2::text 
                    OR a.tenant_id = '00000000-0000-0000-0000-000000000001'::uuid
                    OR a.tenant_id = (SELECT id FROM tenants WHERE slug = 'semed_goncalves_dias' OR slug = 'gd' LIMIT 1)
                    OR $2::text IN ('semed_goncalves_dias', 'gd', 'goncalves-dias'))`,
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

// POST /api/students - Cadastrar estudante com validação de CPF
router.post('/students', authMiddleware, async (req, res) => {
    try {
        const rawData = req.body || {};
        if (!rawData.nome || (!rawData.matricula && !rawData.nome)) {
            return res.status(400).json({ error: 'Nome do aluno é obrigatório.' });
        }

        // Validação estrita de CPF se preenchido
        if (rawData.cpf) {
            const rawCpfDigits = String(rawData.cpf).replace(/\D/g, '');
            if (rawCpfDigits.length > 0 && !isValidCPF(rawCpfDigits)) {
                return res.status(400).json({ 
                    error: 'CPF do aluno inválido. Verifique o número digitado ou deixe em branco caso não possua.' 
                });
            }
            rawData.cpf = formatCPF(rawCpfDigits);
        }

        const studentData = normalizeUppercaseEntity(rawData, 'aluno');
        const activeTenant = req.tenant?.slug || 'gd';
        const rawTenantId = req.tenant?.id || req.user?.tenant_id;
        const tenantDbId = (rawTenantId && String(rawTenantId).includes('-')) ? rawTenantId : '00000000-0000-0000-0000-000000000001';

        const newStudent = {
            ...studentData,
            id: studentData.id || `aln_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
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
                INSERT INTO alunos (tenant_id, nome, matricula, codigo_matricula, turma_id, cpf, nascimento)
                VALUES ($1, $2, $3, $3, $4, $5, $6)
                ON CONFLICT (codigo_matricula) DO UPDATE SET 
                    nome = EXCLUDED.nome,
                    turma_id = COALESCE(EXCLUDED.turma_id, alunos.turma_id),
                    cpf = COALESCE(EXCLUDED.cpf, alunos.cpf),
                    nascimento = COALESCE(EXCLUDED.nascimento, alunos.nascimento)
            `, [tenantDbId, newStudent.nome, newStudent.matricula, newStudent.turma_id || null, newStudent.cpf || null, newStudent.nascimento || null]);
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
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (req.body && req.body.cpf) {
            const rawDigits = String(req.body.cpf).replace(/\D/g, '');
            if (rawDigits.length > 0 && !isValidCPF(rawDigits) && !req.body.cpf.includes('*')) {
                return res.status(400).json({ error: 'CPF inválido.' });
            }
            if (rawDigits.length === 11) {
                req.body.cpf = formatCPF(rawDigits);
            }
        }

        const normalizedBody = normalizeUppercaseEntity(req.body || {}, 'aluno');

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            let targetList = null;
            let targetIdx = -1;

            if (fileState[orgId] && Array.isArray(fileState[orgId].dbAlunos)) {
                targetIdx = fileState[orgId].dbAlunos.findIndex(a => a.id === id || a.matricula === id);
                if (targetIdx !== -1) targetList = fileState[orgId].dbAlunos;
            }
            if (targetIdx === -1 && Array.isArray(fileState.alunos)) {
                targetIdx = fileState.alunos.findIndex(a => a.id === id || a.matricula === id);
                if (targetIdx !== -1) targetList = fileState.alunos;
            }
            if (targetIdx === -1) {
                Object.keys(fileState).forEach(k => {
                    if (fileState[k] && Array.isArray(fileState[k].dbAlunos) && targetIdx === -1) {
                        const idx = fileState[k].dbAlunos.findIndex(a => a.id === id || a.matricula === id);
                        if (idx !== -1) {
                            targetIdx = idx;
                            targetList = fileState[k].dbAlunos;
                        }
                    }
                });
            }

            if (targetIdx === -1 || !targetList) {
                return res.status(404).json({ error: 'Registro não encontrado' });
            }

            const cleanUpdate = { ...normalizedBody };
            delete cleanUpdate.id;
            delete cleanUpdate.matricula;

            targetList[targetIdx] = {
                ...targetList[targetIdx],
                ...cleanUpdate
            };
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
            return res.json({ success: true, student: targetList[targetIdx] });
        }

        let isOwned = false;
        let studentDbId = id;
        try {
            isOwned = await ownershipCheck('alunos', id, orgId);
        } catch(e) {}

        if (!isOwned) {
            try {
                const matQuery = await db.query('SELECT id FROM alunos WHERE matricula = $1', [id]);
                if (matQuery.rows && matQuery.rows.length > 0) {
                    studentDbId = matQuery.rows[0].id;
                    isOwned = true;
                }
            } catch(e) {}
        }

        if (!isOwned) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        if (normalizedBody.nome) {
            await db.query('UPDATE alunos SET nome = $1 WHERE id = $2', [normalizedBody.nome, studentDbId]);
        }

        res.json({ success: true, student: { id: studentDbId, ...normalizedBody } });
    } catch (err) {
        console.error('Error in PUT /api/students/:id:', err);
        res.status(500).json({ error: 'Erro ao atualizar aluno.' });
    }
});

// DELETE /api/students/:id - Excluir aluno
router.delete('/students/:id', authMiddleware, authorize('Master Admin', 'admin'), async (req, res) => {
    try {
        const user = req.user;
        const orgId = user.tenant_id || user.org_id || req.tenant?.id || req.tenant?.slug || 'semed_goncalves_dias';
        const { id } = req.params;

        if (db.useLocalFallback) {
            const raw = fs.readFileSync(db.LOCAL_DB_FILE, 'utf8');
            const fileState = JSON.parse(raw);
            const state = fileState[orgId] || fileState['semed_goncalves_dias'] || fileState['gd'] || fileState['goncalves-dias'] || {};
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

        await db.query(
            `DELETE FROM alunos 
             WHERE id = $1 
               AND (tenant_id = $2 
                    OR tenant_id = '00000000-0000-0000-0000-000000000001'
                    OR tenant_id = (SELECT id FROM tenants WHERE slug = 'semed_goncalves_dias' OR slug = 'gd' LIMIT 1)
                    OR $2 = 'semed_goncalves_dias'
                    OR $2 = 'gd'
                    OR $2 = 'goncalves-dias')`,
            [id, orgId]
        );
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
    encryptSensitiveDataInState,
    isValidCPF,
    formatCPF
};
