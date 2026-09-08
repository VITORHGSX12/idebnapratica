// =============================================================================
// TEST SUITE: MULTI-PERFIL RBAC & SESSÃO ATIVA (ESPECIFICAÇÃO TÉCNICA)
// =============================================================================

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, authMiddleware, authorize } = require('../middleware/auth');
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

async function runTests() {
    console.log('🧪 Iniciando Bateria de Testes: Vínculo de Profissional a Múltiplos Perfis RBAC...\n');
    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } catch(err) {
            console.error(`  ❌ [FAIL] ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    async function testAsync(name, fn) {
        try {
            await fn();
            console.log(`  ✅ [PASS] ${name}`);
            passed++;
        } catch(err) {
            console.error(`  ❌ [FAIL] ${name}`);
            console.error(`     Error: ${err.message}`);
            failed++;
        }
    }

    // 1. Normalização de Nomes de Perfis
    test('1. Normalização inteligente de cargos e funções', () => {
        assert.strictEqual(normalizeRoleName('professor'), 'Professor(a)');
        assert.strictEqual(normalizeRoleName('coordenador'), 'Coordenador(a)');
        assert.strictEqual(normalizeRoleName('diretor de escola'), 'Diretor(a) Escolar');
        assert.strictEqual(normalizeRoleName('gestor semed'), 'Gestor SEMED');
        assert.strictEqual(normalizeRoleName('master admin'), 'Master Admin');
        assert.strictEqual(normalizeRoleName('professor aee'), 'Professor AEE');
    });

    // 2. Consulta de Grupos Disponíveis
    await testAsync('2. Obtenção de todos os grupos de acesso disponíveis no sistema', async () => {
        const groups = await getAvailableAccessGroups();
        assert(Array.isArray(groups), 'Grupos deve ser um array');
        assert(groups.length >= 6, 'Deve haver ao menos 6 grupos padrão');
        const ids = groups.map(g => g.id);
        assert(ids.includes('Professor(a)'), 'Deve conter Professor(a)');
        assert(ids.includes('Coordenador(a)'), 'Deve conter Coordenador(a)');
        assert(ids.includes('Diretor(a) Escolar'), 'Deve conter Diretor(a) Escolar');
        assert(ids.includes('Master Admin'), 'Deve conter Master Admin');
    });

    // 3. Vínculo N:N de Múltiplos Perfis
    const testUserId = 'usr_test_multi_rbac_' + Date.now();
    await testAsync('3. Vincular profissional a múltiplos perfis simultaneamente (Professor + Coordenador)', async () => {
        const synced = await syncUserProfiles(testUserId, ['Professor(a)', 'Coordenador(a)'], 'teste.multi@goncalvesdias.ma.gov.br');
        assert.deepStrictEqual(synced, ['Professor(a)', 'Coordenador(a)']);

        const linked = await getUserLinkedProfiles(testUserId);
        assert(linked.includes('Professor(a)'), 'Deve conter perfil de Professor');
        assert(linked.includes('Coordenador(a)'), 'Deve conter perfil de Coordenador');
        assert.strictEqual(linked.length, 2, 'Deve ter exatamente 2 perfis vinculados');
    });

    // 4. Adicionar perfil adicional (Diretor)
    await testAsync('4. Adicionar novo perfil ao profissional (linkUserProfile)', async () => {
        await linkUserProfile(testUserId, 'Diretor(a) Escolar');
        const linked = await getUserLinkedProfiles(testUserId);
        assert.strictEqual(linked.length, 3, 'Deve agora ter 3 perfis');
        assert(linked.includes('Diretor(a) Escolar'), 'Deve conter Diretor(a) Escolar');
    });

    // 5. Remover um perfil
    await testAsync('5. Remover um dos perfis vinculados (unlinkUserProfile)', async () => {
        await unlinkUserProfile(testUserId, 'Diretor(a) Escolar');
        const linked = await getUserLinkedProfiles(testUserId);
        assert.strictEqual(linked.length, 2);
        assert(!linked.includes('Diretor(a) Escolar'));
    });

    // 6. Bloqueio de remoção do último perfil (Validação de Regra de Negócio 3.1.4)
    await testAsync('6. Bloqueio ao tentar remover o último perfil restante (deve manter >= 1 grupo)', async () => {
        // Remover Coordenador(a) deixando apenas Professor(a)
        await unlinkUserProfile(testUserId, 'Coordenador(a)');
        const linked = await getUserLinkedProfiles(testUserId);
        assert.strictEqual(linked.length, 1);
        assert.strictEqual(linked[0], 'Professor(a)');

        // Tentar remover o último (Professor(a)) -> Deve lançar erro 400
        let threw = false;
        try {
            await unlinkUserProfile(testUserId, 'Professor(a)');
        } catch(e) {
            threw = true;
            assert.strictEqual(e.statusCode, 400);
            assert(e.message.includes('ao menos um grupo'));
        }
        assert(threw, 'Deve ter lançado erro ao tentar remover o último perfil');
    });

    // 7. Troca de Perfil Ativo da Sessão (PATCH /sessao/perfil-ativo)
    await testAsync('7. Troca de perfil ativo de sessão (Professor -> Coordenador) emitindo novo JWT', async () => {
        // Vincular novamente Professor e Coordenador
        await syncUserProfiles(testUserId, ['Professor(a)', 'Coordenador(a)']);

        const userSession = {
            id: testUserId,
            email: 'teste.multi@goncalvesdias.ma.gov.br',
            nome: 'Prof. Carlos Multi',
            role: 'Professor(a)',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A'
        };

        const switchResult = await switchActiveSessionProfile(userSession, 'Coordenador(a)', { ip: '127.0.0.1', userAgent: 'Jest Test' });
        assert(switchResult.success);
        assert.strictEqual(switchResult.perfilAtivo, 'Coordenador(a)');
        assert(switchResult.token, 'Deve retornar novo JWT');

        const decoded = jwt.verify(switchResult.token, JWT_SECRET);
        assert.strictEqual(decoded.role, 'Coordenador(a)', 'JWT deve conter o novo papel ativo');
        assert(Array.isArray(decoded.perfis), 'JWT deve conter a lista de todos os perfis');
        assert(decoded.perfis.includes('Professor(a)') && decoded.perfis.includes('Coordenador(a)'));
    });

    // 8. Tentativa de Troca para Perfil Não Vinculado (Segurança 4.0)
    await testAsync('8. Bloqueio de segurança ao tentar assumir perfil não vinculado (403 Forbidden)', async () => {
        const userSession = {
            id: testUserId,
            email: 'teste.multi@goncalvesdias.ma.gov.br',
            nome: 'Prof. Carlos Multi',
            role: 'Professor(a)'
        };

        let blocked = false;
        try {
            await switchActiveSessionProfile(userSession, 'Master Admin');
        } catch(e) {
            blocked = true;
            assert.strictEqual(e.statusCode, 403);
            assert(e.message.includes('não está vinculado'));
        }
        assert(blocked, 'Deve ter bloqueado com 403 a tentativa de assumir Master Admin sem vínculo');
    });

    // 9. Validação do Middleware de Autorização com Perfil Ativo
    test('9. Middleware authorize() valida estritamente contra o perfil ativo da requisição', () => {
        const authDocente = authorize('Professor(a)');
        const authCoord = authorize('Coordenador(a)');
        const authAdmin = authorize('Master Admin');

        const reqDocente = { user: { role: 'Professor(a)' } };
        const reqCoord = { user: { role: 'Coordenador(a)' } };

        let docenteOk = false;
        authDocente(reqDocente, {}, () => { docenteOk = true; });
        assert(docenteOk, 'Professor ativo deve passar no authorize(Professor)');

        let coordBlockedForDocente = false;
        const resMock = {
            status: (code) => ({
                json: (data) => {
                    if (code === 403) coordBlockedForDocente = true;
                }
            })
        };
        authCoord(reqDocente, resMock, () => {});
        assert(coordBlockedForDocente, 'Professor ativo não deve acessar rota de Coordenador');

        let coordOk = false;
        authCoord(reqCoord, {}, () => { coordOk = true; });
        assert(coordOk, 'Coordenador ativo deve passar no authorize(Coordenador)');
    });

    // 10. Limpeza do usuário de teste
    try {
        const users = JSON.parse(fs.readFileSync(path.join(__dirname, '../users.json'), 'utf8'));
        const filtered = users.filter(u => u.id !== testUserId);
        fs.writeFileSync(path.join(__dirname, '../users.json'), JSON.stringify(filtered, null, 2), 'utf8');
    } catch(e) {}

    console.log(`\n======================================================`);
    console.log(`🎯 RESULTADOS DO TESTE: ${passed} PASSOU | ${failed} FALHOU`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
