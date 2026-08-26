// =============================================================================
// ROTAS DE AUTENTICAÇÃO, CONTROLE DE ACESSO E USUÁRIOS (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const { JWT_SECRET, authMiddleware, authorize } = require('../middleware/auth');

const USERS_FILE = path.join(__dirname, '../users.json');

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

// Rate Limiting (Máximo de 5 falhas a cada 15 minutos por e-mail)
const loginFailedAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

setInterval(() => {
    const now = Date.now();
    for (const [key, record] of loginFailedAttempts.entries()) {
        if (now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
            loginFailedAttempts.delete(key);
        }
    }
}, RATE_LIMIT_WINDOW_MS);

// Helper para carregar e sincronizar usuários do Banco / JSON
async function findUserByEmail(cleanEmail) {
    const normalized = (cleanEmail || '').toLowerCase().trim();
    if (!db.useLocalFallback) {
        try {
            const res = await db.query('SELECT * FROM public.usuarios WHERE LOWER(TRIM(email)) = $1 LIMIT 1', [normalized]);
            if (res.rows && res.rows.length > 0) {
                const row = res.rows[0];
                return {
                    id: row.id,
                    nome: row.nome,
                    email: row.email,
                    password: row.password || row.senha_hash,
                    role: row.role,
                    tipo: row.tipo || row.role,
                    escola: row.escola,
                    turma: row.turma,
                    telefone: row.telefone,
                    cpf: row.cpf,
                    status: row.status || 'Ativo',
                    mustChangePassword: row.must_change_password !== undefined ? row.must_change_password : true,
                    tenant_id: row.tenant_id
                };
            }
        } catch(e) {
            console.error('[DB findUserByEmail Error]:', e.message);
        }
    }
    const users = getUsers();
    const local = users.find(u => (u.email || '').toLowerCase().trim() === normalized);
    if (local) {
        return {
            ...local,
            password: local.password || local.senha_hash
        };
    }
    return null;
}

async function updateUserPasswordInDb(userId, email, newHash) {
    if (!db.useLocalFallback) {
        try {
            await db.query(`
                UPDATE public.usuarios 
                SET password = $1, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP 
                WHERE email = $2 OR id = $3
            `, [newHash, email, userId]);
            return true;
        } catch(e) {
            console.error('[DB updateUserPasswordInDb Error]:', e.message);
        }
    }
    const users = getUsers();
    const u = users.find(x => x.email.toLowerCase() === email.toLowerCase() || x.id === userId);
    if (u) {
        u.password = newHash;
        u.mustChangePassword = false;
        u.updated_at = new Date().toISOString();
        saveUsers(users);
        return true;
    }
    return false;
}

// POST /api/auth/login e POST /api/login
router.post(['/login', '/auth/login'], async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) {
            return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const now = Date.now();

        // 1. Verificação de Rate Limit
        const attemptRecord = loginFailedAttempts.get(cleanEmail);
        if (attemptRecord) {
            if (now - attemptRecord.firstAttempt > RATE_LIMIT_WINDOW_MS) {
                loginFailedAttempts.delete(cleanEmail);
            } else if (attemptRecord.count >= MAX_FAILED_ATTEMPTS) {
                const remainingMinutes = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - attemptRecord.firstAttempt)) / 60000);
                return res.status(429).json({
                    error: `Muitas tentativas incorretas. Conta bloqueada temporariamente. Tente novamente em ${remainingMinutes} minuto(s).`
                });
            }
        }

        // 2. Busca estrita do usuário cadastrado
        const user = await findUserByEmail(cleanEmail);
        
        let isValid = false;
        if (user && user.password && (user.password.startsWith('$2b$') || user.password.startsWith('$2a$'))) {
            isValid = await bcrypt.compare(password, user.password);
        }

        if (!isValid) {
            const currentRecord = loginFailedAttempts.get(cleanEmail) || { count: 0, firstAttempt: now };
            currentRecord.count += 1;
            loginFailedAttempts.set(cleanEmail, currentRecord);

            const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - currentRecord.count);
            return res.status(401).json({ 
                error: remainingAttempts > 0 
                    ? `Credenciais inválidas. E-mail ou senha incorreta. (${remainingAttempts} tentativa(s) restante(s))`
                    : 'Muitas tentativas incorretas. Conta bloqueada temporariamente por 15 minutos.'
            });
        }

        // 3. Sucesso na autenticação
        loginFailedAttempts.delete(cleanEmail);

        const mustChange = !!user.mustChangePassword;

        if (mustChange) {
            const tempToken = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    scope: 'FORCE_PASSWORD_CHANGE',
                    mustChangePassword: true
                },
                JWT_SECRET,
                { expiresIn: '1h' }
            );

            return res.json({
                success: true,
                token: tempToken,
                requirePasswordChange: true,
                mustChangePassword: true,
                message: 'Troca de senha obrigatória no primeiro acesso.',
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email,
                    role: user.role,
                    escola: user.escola,
                    turma: user.turma,
                    mustChangePassword: true
                }
            });
        }

        // Sessão regular completa (8h)
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                nome: user.nome,
                role: user.role,
                escola: user.escola,
                turma: user.turma,
                mustChangePassword: false,
                org_id: user.tenant_id || req.tenant?.slug || 'semed_goncalves_dias'
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            success: true,
            token,
            requirePasswordChange: false,
            mustChangePassword: false,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                escola: user.escola,
                turma: user.turma,
                mustChangePassword: false
            }
        });
    } catch (err) {
        console.error('Error in /api/auth/login:', err);
        res.status(500).json({ error: 'Falha no processamento do login.' });
    }
});

// POST /api/auth/change-password e POST /api/change-password
router.post(['/change-password', '/auth/change-password'], async (req, res) => {
    try {
        let email = req.body?.email;
        const currentPassword = req.body?.currentPassword;
        const newPassword = req.body?.newPassword;

        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded && decoded.email) {
                    email = email || decoded.email;
                }
            } catch (e) {}
        }

        if (!email || !currentPassword || !newPassword) {
            return res.status(400).json({ error: 'E-mail, senha atual e nova senha são obrigatórios.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const user = await findUserByEmail(cleanEmail);

        if (!user || !user.password) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentValid) {
            return res.status(401).json({ error: 'Senha atual/temporária incorreta.' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ error: 'A nova senha deve ser diferente da senha anterior/temporária.' });
        }

        if (newPassword.length < 10) {
            return res.status(400).json({ error: 'A nova senha deve ter no mínimo 10 caracteres.' });
        }
        if (!/[A-Z]/.test(newPassword)) {
            return res.status(400).json({ error: 'A nova senha deve conter pelo menos uma letra maiúscula (A-Z).' });
        }
        if (!/[a-z]/.test(newPassword)) {
            return res.status(400).json({ error: 'A nova senha deve conter pelo menos uma letra minúscula (a-z).' });
        }
        if (!/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: 'A nova senha deve conter pelo menos um número (0-9).' });
        }

        const newHash = await bcrypt.hash(newPassword, 12);
        await updateUserPasswordInDb(user.id, cleanEmail, newHash);

        const fullToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                nome: user.nome,
                role: user.role,
                escola: user.escola,
                turma: user.turma,
                mustChangePassword: false,
                org_id: user.tenant_id || req.tenant?.slug || 'semed_goncalves_dias'
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            success: true,
            message: 'Senha alterada com sucesso! Acesso liberado.',
            token: fullToken,
            requirePasswordChange: false,
            mustChangePassword: false,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                escola: user.escola,
                turma: user.turma,
                mustChangePassword: false
            }
        });
    } catch (err) {
        console.error('Error in /api/auth/change-password:', err);
        res.status(500).json({ error: 'Falha ao redefinir a senha.' });
    }
});

module.exports = {
    authRouter: router,
    getUsers,
    saveUsers,
    findUserByEmail
};
