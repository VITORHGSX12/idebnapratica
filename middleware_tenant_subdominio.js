// =========================================================
// MIDDLEWARE: RESOLUÇÃO DE TENANT POR SUBDOMÍNIO
// =========================================================

const db = require('./db');

// ---------------------------------------------------------
// 1. Cache simples em memória da tabela `tenants`
//    Evita bater no banco a cada requisição. Atualiza a cada 60s.
// ---------------------------------------------------------
let tenantCache = new Map(); // slug -> { id, slug, subdominio, tipo, nome }
let tenantCacheLoadedAt = 0;
const TENANT_CACHE_TTL_MS = 60 * 1000;

async function loadTenantCache() {
    if (db.useLocalFallback) {
        const next = new Map();
        next.set('gd', {
            id: '00000000-0000-0000-0000-000000000001',
            slug: 'gd',
            subdominio: 'gd',
            tipo: 'producao',
            nome: 'Município de Gonçalves Dias'
        });
        tenantCache = next;
        tenantCacheLoadedAt = Date.now();
        return;
    }

    try {
        const result = await db.query('SELECT id, slug, subdominio, tipo, nome FROM tenants WHERE slug IS NOT NULL');
        const next = new Map();
        for (const row of result.rows) {
            next.set(row.slug, row);
            if (row.subdominio && row.subdominio !== row.slug) {
                next.set(row.subdominio, row);
            }
        }
        if (next.size === 0) {
            next.set('gd', {
                id: '00000000-0000-0000-0000-000000000001',
                slug: 'gd',
                subdominio: 'gd',
                tipo: 'producao',
                nome: 'Município de Gonçalves Dias'
            });
        }
        tenantCache = next;
        tenantCacheLoadedAt = Date.now();
    } catch (err) {
        console.error('[tenantCache] Falha ao carregar tenants:', err.message);
        if (tenantCache.size === 0) {
            tenantCache.set('gd', {
                id: '00000000-0000-0000-0000-000000000001',
                slug: 'gd',
                subdominio: 'gd',
                tipo: 'producao',
                nome: 'Município de Gonçalves Dias'
            });
        }
    }
}

async function getTenantBySlug(slug) {
    if (Date.now() - tenantCacheLoadedAt > TENANT_CACHE_TTL_MS || tenantCache.size === 0) {
        await loadTenantCache();
    }
    return tenantCache.get(slug) || null;
}

// ---------------------------------------------------------
// 2. Middleware: identifica o tenant da requisição
//
//    Lê o slug do header customizado x-tenant-slug enviado
//    pelo frontend (extraído de window.location.hostname).
//    Mantém req.query.tenantId como fallback de compatibilidade.
// ---------------------------------------------------------
async function resolveTenant(req, res, next) {
    const slugFromHeader = req.headers['x-tenant-slug'];
    const slugFromQuery = req.query.tenantId || req.query.tenant;

    const slug = (slugFromHeader || slugFromQuery || 'default').toString().toLowerCase().trim();

    if (slug === 'default' || slug === 'all') {
        req.tenant = { id: '00000000-0000-0000-0000-000000000001', slug, tipo: 'producao', nome: 'Padrão / Global' };
        return next();
    }

    const tenant = await getTenantBySlug(slug);
    if (!tenant) {
        // Se estiver em modo local fallback, cria mock dinâmico em vez de 404
        if (db.useLocalFallback) {
            req.tenant = {
                id: '00000000-0000-0000-0000-000000000001',
                slug,
                subdominio: slug,
                tipo: 'producao',
                nome: `Município (${slug})`
            };
            return next();
        }
        return res.status(404).json({ error: `Município/tenant "${slug}" não encontrado.` });
    }

    req.tenant = tenant; // { id, slug, subdominio, tipo, nome }
    next();
}

// ---------------------------------------------------------
// 3. Validação real de acesso do usuário ao tenant via banco
// ---------------------------------------------------------
async function validateTenantAccessDB(user, requestedTenant) {
    if (!requestedTenant) return false;
    if (requestedTenant === 'all' || requestedTenant === 'default') return true;
    if (['Master Admin', 'Gestor da Rede', 'DPO / Encarregado'].includes(user.role)) {
        return true;
    }

    if (db.useLocalFallback) {
        return true;
    }

    try {
        const result = await db.query(
            `SELECT t.slug FROM usuarios u
             JOIN tenants t ON t.id = u.tenant_id
             WHERE u.email = $1`,
            [user.email]
        );

        if (result.rows.length === 0) {
            return false;
        }

        return result.rows[0].slug === requestedTenant;
    } catch (err) {
        console.error('[validateTenantAccessDB] Erro ao consultar vínculo:', err.message);
        return true; // Fallback tolerante em caso de erro transitório de banco
    }
}

// ---------------------------------------------------------
// 4. Bypass de login para demonstração
// ---------------------------------------------------------
function isBypassLoginAllowed(req) {
    return req.tenant && req.tenant.tipo === 'demo';
}

module.exports = {
    resolveTenant,
    validateTenantAccessDB,
    isBypassLoginAllowed,
    loadTenantCache,
};
