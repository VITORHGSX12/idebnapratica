/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — SERVIÇO DE NORMALIZAÇÃO DE DADOS & CAIXA ALTA
 * Arquivo: services/normalization_service.js
 * Descrição: Camada de domínio para garantir a trava de caixa alta (UPPERCASE)
 *            em cadastros de Usuários, Alunos, Escolas e Turmas.
 * ============================================================================
 */

/**
 * Campos que NUNCA devem ser convertidos para maiúsculas (whitelist de exceções)
 */
const NON_UPPERCASE_KEYS = new Set([
    'email',
    'login',
    'password',
    'senha',
    'token',
    'avatar_url',
    'avatarphoto',
    'photo_url',
    'url',
    'id',
    'uuid',
    'tenant_id',
    'tenantid',
    'created_at',
    'updated_at',
    'status' // mantém status normalizado ex: 'Ativo' ou 'planejado'
]);

/**
 * Converte uma string para CAIXA ALTA mantendo acentos
 * @param {any} val 
 * @returns {any}
 */
function toUppercaseSafe(val) {
    if (typeof val !== 'string') return val;
    return val.trim().toUpperCase();
}

/**
 * Normaliza um e-mail para minúsculas
 * @param {any} val 
 * @returns {string}
 */
function normalizeEmail(val) {
    if (typeof val !== 'string') return val;
    return val.trim().toLowerCase();
}

/**
 * Normaliza um objeto cadastral aplicando a trava de caixa alta
 * @param {Object} data 
 * @param {string} entityType - 'usuario' | 'aluno' | 'escola' | 'turma' | 'geral'
 * @returns {Object}
 */
function normalizeUppercaseEntity(data, entityType = 'geral') {
    if (!data || typeof data !== 'object') return data;
    const normalized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // 1. E-mails sempre em minúsculas
        if (lowerKey === 'email' || lowerKey === 'login') {
            normalized[key] = normalizeEmail(value);
            continue;
        }

        // 2. Chaves ignoradas
        if (NON_UPPERCASE_KEYS.has(lowerKey) || typeof value !== 'string') {
            normalized[key] = value;
            continue;
        }

        // 3. Demais campos de texto cadastral convertidos para MAIÚSCULAS
        normalized[key] = toUppercaseSafe(value);
    }

    return normalized;
}

module.exports = {
    toUppercaseSafe,
    normalizeEmail,
    normalizeUppercaseEntity
};
