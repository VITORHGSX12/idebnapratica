// =============================================================================
// RBAC SERVICE — GESTÃO DE MÚLTIPLOS PERFIS E CONTROLE DE SESSÃO ATIVA
// =============================================================================

const db = require('../db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../users.json');

const DEFAULT_GRUPOS_ACESSO = [
    { id: 'Master Admin', nome: 'Administrador Geral (TI/DPO)', descricao: 'Acesso irrestrito a configurações do sistema, usuários e auditoria', categoria: 'ADMINISTRATIVO' },
    { id: 'Gestor SEMED', nome: 'Gestor Municipal SEMED', descricao: 'Gestão estratégica de metas municipais, escolas e equipe da rede', categoria: 'GESTAO' },
    { id: 'Diretor(a) Escolar', nome: 'Diretor(a) Escolar', descricao: 'Gestão administrativa e pedagógica da unidade escolar', categoria: 'ESCOLA' },
    { id: 'Coordenador(a)', nome: 'Coordenador(a) Pedagógico(a)', descricao: 'Acompanhamento pedagógico, relatórios de simulados e planejamento', categoria: 'ESCOLA' },
    { id: 'Professor(a)', nome: 'Professor(a) Docente', descricao: 'Lançamento de notas, diário de classe e plano de aula', categoria: 'DOCENTE' },
    { id: 'Professor AEE', nome: 'Professor(a) AEE', descricao: 'Atendimento Educacional Especializado', categoria: 'DOCENTE' }
];

function normalizeRoleName(role) {
    if (!role) return 'Professor(a)';
    const r = String(role).trim().toLowerCase();
    if (r.includes('admin') || r.includes('dpo') || r.includes('ti')) return 'Master Admin';
    if (r.includes('gestor') || r.includes('semed') || r.includes('rede')) return 'Gestor SEMED';
    if (r.includes('diretor')) return 'Diretor(a) Escolar';
    if (r.includes('coordenador')) return 'Coordenador(a)';
    if (r.includes('aee')) return 'Professor AEE';
    return 'Professor(a)';
}

function getLocalUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        const content = fs.readFileSync(USERS_FILE, 'utf8');
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
    } catch(e) {
        return [];
    }
}

function saveLocalUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch(e) {
        console.error('[RBAC Service saveLocalUsers Error]:', e);
    }
}

let dbTablesInitialized = false;
async function ensureDbTables() {
    if (db.useLocalFallback || dbTablesInitialized) return;
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS public.grupos_acesso (
                id VARCHAR(50) PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                descricao TEXT,
                categoria VARCHAR(50) DEFAULT 'PEDAGOGICO',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS public.usuario_grupo_acesso (
                id SERIAL PRIMARY KEY,
                usuario_id VARCHAR(100) NOT NULL,
                grupo_acesso_id VARCHAR(50) NOT NULL,
                ativo BOOLEAN DEFAULT true,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (usuario_id, grupo_acesso_id)
            );
            CREATE TABLE IF NOT EXISTS public.logs_troca_perfil (
                id SERIAL PRIMARY KEY,
                usuario_id VARCHAR(100) NOT NULL,
                usuario_email VARCHAR(255) NOT NULL,
                perfil_anterior VARCHAR(50),
                perfil_novo VARCHAR(50) NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        for (const g of DEFAULT_GRUPOS_ACESSO) {
            await db.query(`
                INSERT INTO public.grupos_acesso (id, nome, descricao, categoria)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (id) DO NOTHING;
            `, [g.id, g.nome, g.descricao, g.categoria]);
        }
        dbTablesInitialized = true;
    } catch(e) {
        // Ignora caso esteja em contingência ou sem permissão de DDL
    }
}

/**
 * Retorna todos os grupos de acesso disponíveis no sistema
 */
async function getAvailableAccessGroups() {
    await ensureDbTables();
    if (!db.useLocalFallback) {
        try {
            const res = await db.query('SELECT id, nome, descricao, categoria FROM public.grupos_acesso ORDER BY id ASC');
            if (res.rows && res.rows.length > 0) {
                return res.rows;
            }
        } catch(e) {}
    }
    return DEFAULT_GRUPOS_ACESSO;
}

/**
 * Retorna a lista de perfis/grupos vinculados a um usuário
 */
async function getUserLinkedProfiles(userId, fallbackRole) {
    const defaultFallback = fallbackRole ? [normalizeRoleName(fallbackRole)] : ['Professor(a)'];
    
    if (!userId) return defaultFallback;

    await ensureDbTables();
    if (!db.useLocalFallback) {
        try {
            const res = await db.query(`
                SELECT ga.id, ga.nome, ga.descricao, ga.categoria, uga.ativo
                FROM public.usuario_grupo_acesso uga
                JOIN public.grupos_acesso ga ON uga.grupo_acesso_id = ga.id
                WHERE uga.usuario_id = $1 AND uga.ativo = true
                ORDER BY ga.id ASC
            `, [userId]);

            if (res.rows && res.rows.length > 0) {
                return res.rows.map(r => r.id);
            }
        } catch(e) {}
    }

    const localUsers = getLocalUsers();
    const user = localUsers.find(u => u.id === userId || (u.email && u.email.toLowerCase() === String(userId).toLowerCase()));
    if (user) {
        if (Array.isArray(user.perfis) && user.perfis.length > 0) {
            return user.perfis.map(normalizeRoleName);
        }
        if (user.role || user.tipo) {
            return [normalizeRoleName(user.role || user.tipo)];
        }
    }

    return defaultFallback;
}

/**
 * Sincroniza a lista completa de perfis de um usuário (N:N)
 */
async function syncUserProfiles(userId, perfisArray, userEmail) {
    if (!userId) return false;

    let normalizedList = (Array.isArray(perfisArray) ? perfisArray : [perfisArray])
        .filter(Boolean)
        .map(normalizeRoleName);

    if (normalizedList.length === 0) {
        normalizedList = ['Professor(a)'];
    }

    // Remover duplicatas
    normalizedList = Array.from(new Set(normalizedList));

    await ensureDbTables();
    if (!db.useLocalFallback) {
        try {
            await db.query('DELETE FROM public.usuario_grupo_acesso WHERE usuario_id = $1', [userId]);

            for (const grupoId of normalizedList) {
                await db.query(`
                    INSERT INTO public.usuario_grupo_acesso (usuario_id, grupo_acesso_id, ativo)
                    VALUES ($1, $2, true)
                    ON CONFLICT (usuario_id, grupo_acesso_id) DO UPDATE SET ativo = true
                `, [userId, grupoId]);
            }
        } catch(e) {}
    }

    // Sincroniza no arquivo local de usuários
    const users = getLocalUsers();
    const idx = users.findIndex(u => u.id === userId || (userEmail && u.email && u.email.toLowerCase() === userEmail.toLowerCase()));
    if (idx >= 0) {
        users[idx].perfis = normalizedList;
        if (!users[idx].role || !normalizedList.includes(normalizeRoleName(users[idx].role))) {
            users[idx].role = normalizedList[0];
            users[idx].tipo = normalizedList[0];
        }
    } else {
        users.push({
            id: userId,
            email: userEmail || `${userId}@goncalvesdias.ma.gov.br`,
            nome: 'Profissional Multi-Perfil',
            role: normalizedList[0],
            tipo: normalizedList[0],
            perfis: normalizedList,
            status: 'Ativo',
            mustChangePassword: false,
            created_at: new Date().toISOString()
        });
    }
    saveLocalUsers(users);

    return normalizedList;
}

/**
 * Vincula um grupo adicional ao usuário
 */
async function linkUserProfile(userId, grupoId) {
    if (!userId || !grupoId) return false;
    const norm = normalizeRoleName(grupoId);

    await ensureDbTables();
    if (!db.useLocalFallback) {
        try {
            await db.query(`
                INSERT INTO public.usuario_grupo_acesso (usuario_id, grupo_acesso_id, ativo)
                VALUES ($1, $2, true)
                ON CONFLICT (usuario_id, grupo_acesso_id) DO UPDATE SET ativo = true
            `, [userId, norm]);
        } catch(e) {}
    }

    const users = getLocalUsers();
    const user = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === String(userId).toLowerCase()));
    if (user) {
        user.perfis = user.perfis || [normalizeRoleName(user.role || 'Professor(a)')];
        if (!user.perfis.includes(norm)) {
            user.perfis.push(norm);
        }
    } else {
        users.push({
            id: userId,
            email: `${userId}@goncalvesdias.ma.gov.br`,
            nome: 'Profissional Multi-Perfil',
            role: norm,
            tipo: norm,
            perfis: [norm],
            status: 'Ativo'
        });
    }
    saveLocalUsers(users);

    return true;
}

/**
 * Remove o vínculo de um grupo do usuário com validação de mínimo 1 grupo
 */
async function unlinkUserProfile(userId, grupoId) {
    if (!userId || !grupoId) throw new Error('Parâmetros inválidos');
    const norm = normalizeRoleName(grupoId);

    const currentProfiles = await getUserLinkedProfiles(userId);
    if (currentProfiles.length <= 1 && currentProfiles.includes(norm)) {
        const err = new Error('Um usuário deve possuir ao menos um grupo de acesso vinculado.');
        err.statusCode = 400;
        throw err;
    }

    await ensureDbTables();
    if (!db.useLocalFallback) {
        try {
            await db.query('DELETE FROM public.usuario_grupo_acesso WHERE usuario_id = $1 AND grupo_acesso_id = $2', [userId, norm]);
        } catch(e) {}
    }

    const users = getLocalUsers();
    const user = users.find(u => u.id === userId || (u.email && u.email.toLowerCase() === String(userId).toLowerCase()));
    if (user && Array.isArray(user.perfis)) {
        user.perfis = user.perfis.filter(p => normalizeRoleName(p) !== norm);
        if (user.perfis.length === 0) user.perfis = ['Professor(a)'];
        if (normalizeRoleName(user.role) === norm) {
            user.role = user.perfis[0];
            user.tipo = user.perfis[0];
        }
        saveLocalUsers(users);
    }

    return true;
}

/**
 * Registra log de auditoria de troca de perfil ativo de sessão
 */
async function logProfileSwitchAudit(userId, userEmail, oldRole, newRole, ip, userAgent) {
    await ensureDbTables();
    if (!db.useLocalFallback) {
        try {
            await db.query(`
                INSERT INTO public.logs_troca_perfil (
                    usuario_id, usuario_email, perfil_anterior, perfil_novo, ip_address, user_agent
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [userId, userEmail, oldRole, newRole, ip || '127.0.0.1', userAgent || 'Web Browser']);
        } catch(e) {}
    }
}

/**
 * Troca o perfil ativo da sessão e gera um novo token JWT
 */
async function switchActiveSessionProfile(userSession, targetRole, reqInfo = {}) {
    if (!userSession || !userSession.id) {
        const err = new Error('Sessão inválida');
        err.statusCode = 401;
        throw err;
    }

    const targetNorm = normalizeRoleName(targetRole);
    const linkedProfiles = await getUserLinkedProfiles(userSession.id, userSession.role);

    // Validação estrita de segurança: O perfil alvo DEVE estar vinculado ao usuário
    const isLinked = linkedProfiles.some(p => normalizeRoleName(p) === targetNorm);
    if (!isLinked) {
        const err = new Error(`Acesso negado: O perfil "${targetRole}" não está vinculado à sua conta.`);
        err.statusCode = 403;
        throw err;
    }

    const previousRole = userSession.role || 'Professor(a)';

    // Auditoria
    await logProfileSwitchAudit(
        userSession.id,
        userSession.email,
        previousRole,
        targetNorm,
        reqInfo.ip,
        reqInfo.userAgent
    );

    // Emite novo JWT com o perfil ativo atualizado e todos os perfis disponíveis
    const newJwtPayload = {
        id: userSession.id,
        email: userSession.email,
        nome: userSession.nome,
        role: targetNorm, // Perfil ativo
        perfis: linkedProfiles, // Todos os perfis vinculados
        escola: userSession.escola,
        turma: userSession.turma,
        mustChangePassword: false,
        org_id: userSession.org_id || 'semed_goncalves_dias'
    };

    const newToken = jwt.sign(newJwtPayload, JWT_SECRET, { expiresIn: '8h' });

    return {
        success: true,
        token: newToken,
        perfilAtivo: targetNorm,
        perfisDisponiveis: linkedProfiles,
        user: {
            id: userSession.id,
            nome: userSession.nome,
            email: userSession.email,
            role: targetNorm,
            tipo: targetNorm,
            perfis: linkedProfiles,
            escola: userSession.escola,
            turma: userSession.turma
        },
        message: `Perfil alterado para "${targetNorm}" com sucesso.`
    };
}

module.exports = {
    DEFAULT_GRUPOS_ACESSO,
    normalizeRoleName,
    getAvailableAccessGroups,
    getUserLinkedProfiles,
    syncUserProfiles,
    linkUserProfile,
    unlinkUserProfile,
    logProfileSwitchAudit,
    switchActiveSessionProfile
};
