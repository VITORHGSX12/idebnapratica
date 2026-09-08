// =============================================================================
// ROTAS DE GESTÃO DE USUÁRIOS E CONTROLE RBAC (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { getUsers, saveUsers, findUserByEmail } = require('./auth_routes');

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

async function fetchAllUsersFromDb() {
    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                SELECT id, nome, email, role, tipo, escola, turma, telefone, cpf, status, must_change_password, created_at, updated_at 
                FROM public.usuarios 
                ORDER BY nome ASC
            `);
            if (res.rows && res.rows.length > 0) {
                return res.rows.map(r => ({
                    id: r.id,
                    nome: r.nome,
                    email: r.email,
                    role: r.role,
                    tipo: r.tipo || r.role,
                    escola: r.escola,
                    turma: r.turma,
                    telefone: r.telefone,
                    cpf: r.cpf,
                    status: r.status || 'Ativo',
                    mustChangePassword: r.must_change_password,
                    created_at: r.created_at,
                    updated_at: r.updated_at
                }));
            }
        } catch(e) {
            console.error('[DB fetchAllUsersFromDb Error]:', e.message);
        }
    }
    return getUsers();
}

async function insertUserInDb(newUser) {
    if (!db.useLocalFallback) {
        try {
            await db.query(`
                INSERT INTO public.usuarios (
                    id, tenant_id, nome, email, password, role, tipo, escola, turma, telefone, cpf, status, must_change_password
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `, [
                newUser.id,
                newUser.tenant_id || null,
                newUser.nome,
                newUser.email,
                newUser.password,
                newUser.role,
                newUser.tipo || newUser.role,
                newUser.escola || null,
                newUser.turma || null,
                newUser.telefone || null,
                newUser.cpf || null,
                newUser.status || 'Ativo',
                newUser.mustChangePassword !== undefined ? newUser.mustChangePassword : true
            ]);
            return true;
        } catch(e) {
            console.error('[DB insertUserInDb Error]:', e.message);
        }
    }
    const users = getUsers();
    users.push(newUser);
    saveUsers(users);
    return true;
}

// GET /api/users - Listar usuários cadastrados (escopado por RBAC)
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const rawUsers = await fetchAllUsersFromDb();
        const allUsers = rawUsers.map(u => {
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

function isValidCPFServer(cpf) {
    if (!cpf) return false;
    const clean = String(cpf).replace(/\D/g, '');
    if (clean.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(clean)) return false;
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(clean.charAt(i), 10) * (10 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.charAt(9), 10)) return false;
    soma = 0;
    for (let j = 0; j < 10; j++) soma += parseInt(clean.charAt(j), 10) * (11 - j);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(clean.charAt(10), 10)) return false;
    return true;
}

function validateBirthDateServer(dateStr) {
    if (!dateStr || !dateStr.trim()) return { valid: false, error: 'A data de nascimento é obrigatória.' };
    let parts = dateStr.trim().split('/');
    if (parts.length !== 3) {
        parts = dateStr.trim().split('-');
        if (parts.length === 3 && parts[0].length === 4) parts = [parts[2], parts[1], parts[0]];
        else return { valid: false, error: 'Data de nascimento deve estar no formato DD/MM/AAAA.' };
    }
    const dia = parseInt(parts[0], 10);
    const mes = parseInt(parts[1], 10);
    const ano = parseInt(parts[2], 10);
    if (isNaN(dia) || isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || dia < 1 || dia > 31 || ano < 1920) {
        return { valid: false, error: 'Data de nascimento informada é inválida.' };
    }
    const dateObj = new Date(ano, mes - 1, dia);
    const hoje = new Date();
    if (dateObj > hoje) return { valid: false, error: 'Data de nascimento inválida (data futura não permitida).' };
    let idade = hoje.getFullYear() - ano;
    const m = hoje.getMonth() - (mes - 1);
    if (m < 0 || (m === 0 && hoje.getDate() < dia)) idade--;
    if (idade < 18) return { valid: false, error: `O profissional deve ter idade mínima de 18 anos (idade calculada: ${idade} anos).` };
    if (idade >= 90 || idade > 85) return { valid: false, error: `Data de nascimento irregular: idade informada (${idade} anos) é incompatível com o cadastro de profissionais ativos.` };
    return { valid: true, idade, formatted: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}` };
}

// POST /api/users - Cadastrar novo usuário (exclusivo para grupo CONFIGURAÇÃO)
router.post('/users', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const { nome, email, password, role, escola, turma, telefone, cpf, dataNascimento } = req.body || {};
        if (!nome || !email || !role) {
            return res.status(400).json({ error: 'Nome, e-mail e perfil/cargo são obrigatórios.' });
        }

        const roleNorm = role.toLowerCase();
        if (roleNorm.includes('aluno')) {
            return res.status(400).json({ error: 'O cadastro de Usuários é exclusivo para a equipe escolar (Gestores, Diretores e Professores). Para cadastrar alunos, utilize a tela de Alunos.' });
        }

        // Validação de CPF
        if (cpf && cpf !== '-' && !isValidCPFServer(cpf)) {
            return res.status(400).json({ error: 'CPF inválido! Verifique os dígitos verificadores informados.' });
        }

        // Validação de Data de Nascimento se informada
        if (dataNascimento) {
            const birthVal = validateBirthDateServer(dataNascimento);
            if (!birthVal.valid) {
                return res.status(400).json({ error: birthVal.error });
            }
        }

        const existing = await findUserByEmail(email.trim().toLowerCase());
        if (existing) {
            return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
        }

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
            dataNascimento: dataNascimento || null,
            escola: escola || 'Todas as Escolas (SEMED)',
            turma: turma || null,
            status: 'Ativo',
            mustChangePassword: true,
            created_at: new Date().toISOString()
        };

        await insertUserInDb(newUser);

        const { password: _, ...clean } = newUser;
        res.json({ success: true, user: clean });
    } catch (err) {
        console.error('Error in POST /api/users:', err);
        res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
});

// PUT /api/users/:id - Atualizar dados do usuário
router.put('/users/:id', authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, password, role, escola, turma, telefone, cpf, status } = req.body || {};

        if (role && role.toLowerCase().includes('aluno')) {
            return res.status(400).json({ error: 'Perfil inválido. O módulo de Usuários aceita apenas funções de equipe.' });
        }

        let updatedUser = null;

        if (!db.useLocalFallback) {
            try {
                let passHash = null;
                if (password) {
                    passHash = await bcrypt.hash(password, 12);
                }

                const resDb = await db.query(`
                    UPDATE public.usuarios 
                    SET 
                        nome = COALESCE($1, nome),
                        email = COALESCE($2, email),
                        password = COALESCE($3, password),
                        role = COALESCE($4, role),
                        tipo = COALESCE($4, tipo),
                        escola = COALESCE($5, escola),
                        turma = COALESCE($6, turma),
                        telefone = COALESCE($7, telefone),
                        cpf = COALESCE($8, cpf),
                        status = COALESCE($9, status),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $10
                    RETURNING id, nome, email, role, tipo, escola, turma, telefone, cpf, status, updated_at
                `, [
                    nome ? nome.trim() : null,
                    email ? email.trim().toLowerCase() : null,
                    passHash,
                    role ? role.trim() : null,
                    escola !== undefined ? escola : null,
                    turma !== undefined ? turma : null,
                    telefone !== undefined ? telefone : null,
                    cpf !== undefined ? cpf : null,
                    status !== undefined ? status : null,
                    id
                ]);

                if (resDb.rows && resDb.rows.length > 0) {
                    updatedUser = resDb.rows[0];
                }
            } catch(e) {
                console.error('[DB PUT /api/users Error]:', e.message);
            }
        }

        if (!updatedUser) {
            let users = getUsers();
            const userIndex = users.findIndex(u => u.id === id);
            if (userIndex === -1) {
                return res.status(404).json({ error: 'Registro não encontrado' });
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
            updatedUser = clean;
        }

        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error('Error in PUT /api/users/:id:', err);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// DELETE /api/users/:id - Excluir usuário
router.delete('/users/:id', authMiddleware, authorize('Master Admin', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!db.useLocalFallback) {
            try {
                const resDb = await db.query('DELETE FROM public.usuarios WHERE id = $1 RETURNING id', [id]);
                if (resDb.rows && resDb.rows.length > 0) {
                    return res.json({ success: true });
                }
            } catch(e) {
                console.error('[DB DELETE /api/users Error]:', e.message);
            }
        }

        let users = getUsers();
        const initialLen = users.length;
        users = users.filter(u => u.id !== id);
        if (users.length === initialLen) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }
        saveUsers(users);
        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /api/users/:id:', err);
        res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
});

module.exports = {
    usuariosRouter: router,
    isConfigurationGroup,
    isVisualizationGroup,
    fetchAllUsersFromDb,
    insertUserInDb
};
