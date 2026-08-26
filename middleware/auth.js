// =============================================================================
// MIDDLEWARES DE AUTENTICAÇÃO E AUTORIZAÇÃO RBAC (BACKEND)
// =============================================================================

const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'edu_saas_jwt_default_secret_key_2026';

/**
 * Validação estrita de token JWT e scope de primeiro acesso
 */
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
        
        // Bloqueia tokens limitados de primeiro acesso em rotas restritas do sistema
        if (decoded.scope === 'FORCE_PASSWORD_CHANGE' && req.path !== '/api/auth/change-password' && req.path !== '/api/change-password') {
            return res.status(403).json({
                error: 'Troca de senha obrigatória pendente. Conclua a redefinição da sua senha antes de acessar o sistema.',
                requirePasswordChange: true
            });
        }

        req.user = decoded;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

/**
 * Autorização por papel / perfil (RBAC)
 */
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

/**
 * Helper reutilizável de verificação de propriedade/tenant (IDOR Protection)
 */
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

module.exports = {
    JWT_SECRET,
    authMiddleware,
    authorize,
    ownershipCheck
};
