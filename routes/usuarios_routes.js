// =============================================================================
// ROTAS DE GESTÃO DE USUÁRIOS E CONTROLE RBAC (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authMiddleware, authorize } = require('../middleware/auth');
const { getUsers, saveUsers, findUserByEmail } = require('./auth_routes');
const { normalizeUppercaseEntity } = require('../services/normalization_service');
const {
    DEFAULT_GRUPOS_ACESSO,
    normalizeRoleName,
    getAvailableAccessGroups,
    getUserLinkedProfiles,
    syncUserProfiles,
    linkUserProfile,
    unlinkUserProfile,
    switchActiveSessionProfile
} = require('../services/rbac_service');

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
    let usersList = [];
    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                SELECT id, nome, email, role, tipo, escola, turma, telefone, cpf, status, avatar_url, must_change_password 
                FROM public.usuarios 
                ORDER BY nome ASC
            `);
            if (res.rows && res.rows.length > 0) {
                usersList = res.rows.map(r => ({
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
                    avatar_url: r.avatar_url || null,
                    avatarPhoto: r.avatar_url || null,
                    mustChangePassword: r.must_change_password
                }));
            }
        } catch(e) {
            console.error('[DB fetchAllUsersFromDb Error]:', e.message);
        }
    }
    
    if (usersList.length === 0) {
        try {
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                let fileState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8'));
                let foundUsers = [];
                Object.keys(fileState).forEach(org => {
                    if (fileState[org] && Array.isArray(fileState[org].dbUsuarios)) {
                        foundUsers.push(...fileState[org].dbUsuarios);
                    }
                });
                if (foundUsers.length > 0) {
                    usersList = foundUsers.map(r => ({
                        id: r.id,
                        nome: r.nome,
                        email: r.email,
                        role: r.role || r.tipo || 'Professor',
                        tipo: r.tipo || r.role || 'Professor',
                        escola: r.escola,
                        turma: r.turma,
                        telefone: r.telefone,
                        cpf: r.cpf,
                        status: r.status || 'Ativo',
                        avatar_url: r.avatar_url || r.avatarPhoto || null,
                        avatarPhoto: r.avatar_url || r.avatarPhoto || null,
                        mustChangePassword: r.must_change_password
                    }));
                }
            }
        } catch(e) {}
    }
    
    if (usersList.length === 0) {
        usersList = getUsers();
    }

    // Carregar vínculos N:N de perfis para cada usuário
    for (const u of usersList) {
        u.perfis = await getUserLinkedProfiles(u.id, u.role || u.tipo);
    }

    return usersList;
}

async function insertUserInDb(newUser) {
    const normalizedUser = normalizeUppercaseEntity(newUser, 'usuario');
    const rawPerfis = normalizedUser.perfis || [normalizedUser.role || normalizedUser.tipo || 'Professor(a)'];
    const normalizedPerfis = rawPerfis.map(normalizeRoleName);
    const primaryRole = normalizedPerfis[0] || normalizeRoleName(normalizedUser.role);

    normalizedUser.role = primaryRole;
    normalizedUser.tipo = primaryRole;
    normalizedUser.perfis = normalizedPerfis;

    if (!db.useLocalFallback) {
        try {
            let dbRole = 'Professor';
            if (primaryRole.includes('Admin') || primaryRole.includes('Master')) dbRole = 'Master Admin';
            else if (primaryRole.includes('Gestor')) dbRole = 'Gestor da Rede';
            else if (primaryRole.includes('Diretor')) dbRole = 'Diretor Escola';
            else if (primaryRole.includes('Aluno')) dbRole = 'Aluno';
            else if (primaryRole.includes('Respons')) dbRole = 'Responsavel';

            await db.query(`
                INSERT INTO public.usuarios (
                    id, tenant_id, nome, email, senha_hash, role
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (email) DO UPDATE SET
                    nome = EXCLUDED.nome,
                    role = EXCLUDED.role;
            `, [
                normalizedUser.id,
                normalizedUser.tenant_id || null,
                normalizedUser.nome,
                normalizedUser.email,
                normalizedUser.password || 'hash_default',
                dbRole
            ]);
        } catch(e) {
            console.error('[DB insertUserInDb Error]:', e.message);
        }
    }

    // Sincroniza tabela associativa N:N (usuario_grupo_acesso) e users.json
    await syncUserProfiles(normalizedUser.id, normalizedPerfis, normalizedUser.email);

    const users = getUsers();
    const existingIdx = users.findIndex(u => u.id === normalizedUser.id || (u.email && u.email.toLowerCase() === (normalizedUser.email || '').toLowerCase()));
    if (existingIdx >= 0) {
        users[existingIdx] = Object.assign(users[existingIdx], normalizedUser);
    } else {
        users.push(normalizedUser);
    }
    saveUsers(users);
    return normalizedUser;
}

// =============================================================================
// ENDPOINTS DE GESTÃO N:N DE GRUPOS DE ACESSO & SESSÃO ATIVA
// =============================================================================

// GET /api/usuarios/:id/grupos-acesso e GET /api/users/:id/grupos-acesso
router.get(['/usuarios/:id/grupos-acesso', '/users/:id/grupos-acesso'], authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const linked = await getUserLinkedProfiles(id);
        const available = await getAvailableAccessGroups();

        res.json({
            usuarioId: id,
            gruposVinculados: linked,
            gruposDisponiveis: available
        });
    } catch (err) {
        console.error('Error in GET /grupos-acesso:', err);
        res.status(500).json({ error: 'Erro ao listar grupos de acesso do usuário.' });
    }
});

// POST /api/usuarios/:id/grupos-acesso e POST /api/users/:id/grupos-acesso
router.post(['/usuarios/:id/grupos-acesso', '/users/:id/grupos-acesso'], authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor', 'semed'), async (req, res) => {
    try {
        const { id } = req.params;
        const { grupoId, grupo_acesso_id } = req.body || {};
        const targetGroup = grupoId || grupo_acesso_id;

        if (!targetGroup) {
            return res.status(400).json({ error: 'ID do grupo de acesso é obrigatório.' });
        }

        await linkUserProfile(id, targetGroup);
        const updatedProfiles = await getUserLinkedProfiles(id);

        res.json({
            success: true,
            message: `Grupo "${targetGroup}" vinculado ao usuário com sucesso.`,
            gruposVinculados: updatedProfiles
        });
    } catch (err) {
        console.error('Error in POST /grupos-acesso:', err);
        res.status(500).json({ error: 'Erro ao vincular grupo de acesso: ' + err.message });
    }
});

// DELETE /api/usuarios/:id/grupos-acesso/:grupoId e DELETE /api/users/:id/grupos-acesso/:grupoId
router.delete(['/usuarios/:id/grupos-acesso/:grupoId', '/users/:id/grupos-acesso/:grupoId'], authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor', 'semed'), async (req, res) => {
    try {
        const { id, grupoId } = req.params;
        await unlinkUserProfile(id, grupoId);
        const updatedProfiles = await getUserLinkedProfiles(id);

        res.json({
            success: true,
            message: `Grupo "${grupoId}" desvinculado com sucesso.`,
            gruposVinculados: updatedProfiles
        });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Erro ao desvincular grupo de acesso.' });
    }
});

// PATCH /api/sessao/perfil-ativo e PATCH /sessao/perfil-ativo - Troca de perfil ativo da sessão
router.patch(['/sessao/perfil-ativo', '/auth/perfil-ativo'], authMiddleware, async (req, res) => {
    try {
        const { role, perfil_id, grupo_acesso_id } = req.body || {};
        const targetRole = role || perfil_id || grupo_acesso_id;

        if (!targetRole) {
            return res.status(400).json({ error: 'Perfil alvo é obrigatório para troca de contexto de sessão.' });
        }

        const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Browser';

        const switchResult = await switchActiveSessionProfile(req.user, targetRole, { ip, userAgent });
        res.json(switchResult);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ error: err.message || 'Erro ao alternar perfil ativo.' });
    }
});

// GET /api/sessao/perfil-ativo - Consulta perfil ativo e lista de perfis disponíveis
router.get(['/sessao/perfil-ativo', '/auth/perfil-ativo'], authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const linkedProfiles = await getUserLinkedProfiles(user.id, user.role);

        res.json({
            perfilAtivo: user.role,
            perfisDisponiveis: linkedProfiles,
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                escola: user.escola,
                turma: user.turma
            }
        });
    } catch (err) {
        console.error('Error in GET /sessao/perfil-ativo:', err);
        res.status(500).json({ error: 'Erro ao consultar perfil ativo da sessão.' });
    }
});

// =============================================================================
// ENDPOINTS REST PADRÃO DE USUÁRIOS
// =============================================================================

// GET /api/users e /api/usuarios - Listagem de usuários
router.get(['/users', '/usuarios'], authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const rawUsers = await fetchAllUsersFromDb();
        const allUsers = rawUsers.map(u => {
            const { password, ...rest } = u;
            return rest;
        });

        // Grupo CONFIGURAÇÃO (Admin / SEMED) - Visão global de toda a rede
        if (isConfigurationGroup(user)) {
            return res.json({ users: allUsers });
        }

        // Grupo VISUALIZAÇÃO (Escola / Docente) - Apenas usuários vinculados à mesma escola
        const escolaUser = user.escola;
        if (!escolaUser) {
            return res.json({ users: allUsers.filter(u => u.id === user.id) });
        }

        const filtered = allUsers.filter(u => u.escola === escolaUser);
        return res.json({ users: filtered });
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

// POST /api/users e /api/usuarios - Cadastrar novo usuário com múltiplos perfis
router.post(['/users', '/usuarios'], authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor', 'semed'), async (req, res) => {
    try {
        const { nome, email, password, senha, role, tipo, cargo, perfis, escola, turma, telefone, cpf, dataNascimento, nascimento, mustChangePassword } = req.body || {};
        
        const rawPerfis = Array.isArray(perfis) && perfis.length > 0 ? perfis : [role || tipo];
        const validPerfis = rawPerfis.filter(Boolean);

        if (!nome || !email || validPerfis.length === 0) {
            return res.status(400).json({ error: 'Nome, e-mail e ao menos um perfil de acesso são obrigatórios.' });
        }

        const normalizedPerfis = validPerfis.map(normalizeRoleName);
        const primaryRole = normalizedPerfis[0];

        // Sanitização e formatação do CPF
        let formattedCpf = cpf || '-';
        if (cpf && cpf !== '-') {
            const cleanCpf = String(cpf).replace(/\D/g, '');
            if (cleanCpf.length === 11) {
                formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            }
        }

        // Validação de Data de Nascimento se informada
        const birthInput = dataNascimento || nascimento;
        let birthFormatted = null;
        if (birthInput) {
            const birthVal = validateBirthDateServer(birthInput);
            if (!birthVal.valid) {
                return res.status(400).json({ error: birthVal.error });
            }
            birthFormatted = birthVal.formatted;
        }

        // Normalização de e-mail institucional
        let cleanEmail = email.trim().toLowerCase();
        if (cleanEmail.endsWith('@goncalvesdias.ma.gov')) {
            cleanEmail = cleanEmail + '.br';
        } else if (!cleanEmail.includes('@')) {
            cleanEmail = cleanEmail + '@goncalvesdias.ma.gov.br';
        }

        const existing = await findUserByEmail(cleanEmail);
        if (existing) {
            return res.status(409).json({ error: 'Já existe um usuário com este e-mail.' });
        }

        const effectivePassword = password || senha || 'Gondias@2026';
        const hashedPassword = await bcrypt.hash(effectivePassword, 12);

        const newUser = {
            id: req.body?.id || ('usr_' + Date.now()),
            nome: nome.trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: primaryRole,
            tipo: primaryRole,
            cargo: cargo || tipo || primaryRole,
            perfis: normalizedPerfis,
            cpf: formattedCpf,
            telefone: telefone || '-',
            dataNascimento: birthFormatted,
            escola: escola || 'Todas as Escolas (SEMED)',
            turma: turma || null,
            status: 'Ativo',
            mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : false,
            created_at: new Date().toISOString()
        };

        const inserted = await insertUserInDb(newUser);

        const { password: _, ...clean } = inserted;
        res.json({ success: true, user: clean, message: 'Usuário cadastrado com sucesso.' });
    } catch (err) {
        console.error('Error in POST /api/users:', err);
        res.status(500).json({ error: 'Erro ao cadastrar usuário: ' + err.message });
    }
});

// PUT /api/users/:id e /api/usuarios/:id - Atualizar usuário e seus perfis de acesso
router.put(['/users/:id', '/usuarios/:id'], authMiddleware, authorize('Master Admin', 'Gestor da Rede', 'admin', 'gestor'), async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, password, role, tipo, perfis, escola, turma, telefone, cpf, status } = req.body || {};

        let updatedPerfis = null;
        if (Array.isArray(perfis) && perfis.length > 0) {
            updatedPerfis = perfis.map(normalizeRoleName);
        } else if (role || tipo) {
            updatedPerfis = [normalizeRoleName(role || tipo)];
        }

        const primaryRole = updatedPerfis ? updatedPerfis[0] : (role ? normalizeRoleName(role) : null);

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
                    primaryRole,
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

        if (updatedPerfis) {
            await syncUserProfiles(id, updatedPerfis, email);
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
            if (primaryRole) {
                users[userIndex].role = primaryRole;
                users[userIndex].tipo = primaryRole;
            }
            if (updatedPerfis) {
                users[userIndex].perfis = updatedPerfis;
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

        updatedUser.perfis = updatedPerfis || await getUserLinkedProfiles(id, updatedUser.role);
        res.json({ success: true, user: updatedUser });
    } catch (err) {
        console.error('Error in PUT /api/users/:id:', err);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

// DELETE /api/users/:id e /api/usuarios/:id - Excluir usuário
router.delete(['/users/:id', '/usuarios/:id'], authMiddleware, authorize('Master Admin', 'admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!db.useLocalFallback) {
            try {
                const resDb = await db.query('DELETE FROM public.usuarios WHERE id = $1 RETURNING id', [id]);
                if (resDb.rows && resDb.rows.length > 0) {
                    try {
                        await db.query('DELETE FROM public.usuario_grupo_acesso WHERE usuario_id = $1', [id]);
                    } catch(e) {}
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

// GET /api/usuarios/me e GET /api/users/me - Dados do usuário logado
router.get(['/usuarios/me', '/users/me'], authMiddleware, async (req, res) => {
    try {
        const userId = req.user && (req.user.id || req.user.email);
        const users = await fetchAllUsersFromDb();
        const user = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === (req.user.email || '').toLowerCase()));

        if (!user) {
            return res.json({
                success: true,
                user: {
                    id: userId,
                    nome: req.user.nome || 'USUÁRIO',
                    email: req.user.email,
                    role: req.user.role || 'Professor(a)',
                    perfis: [req.user.role || 'Professor(a)'],
                    avatar_url: null
                }
            });
        }

        const perfis = await getUserLinkedProfiles(user.id, user.role);
        res.json({
            success: true,
            user: {
                ...user,
                perfis
            }
        });
    } catch(err) {
        res.status(500).json({ error: 'Erro ao carregar dados do perfil.' });
    }
});

module.exports = {
    usuariosRouter: router,
    isConfigurationGroup,
    isVisualizationGroup,
    fetchAllUsersFromDb,
    insertUserInDb
};
