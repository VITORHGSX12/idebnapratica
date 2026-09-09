// =============================================================================
// TEST SUITE: SIDEBAR (MEU PERFIL) & UPLOAD DE AVATAR (ESPECIFICAÇÃO TÉCNICA)
// =============================================================================

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { JWT_SECRET } = require('../middleware/auth');
const db = require('../db');

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

async function runTests() {
    console.log('🧪 Iniciando Bateria de Testes: Sidebar (Meu Perfil) & Avatar Upload...\n');
    let passed = 0;
    let failed = 0;

    // Subir servidor de testes em porta dinâmica
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

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

    try {
        const testUser = {
            id: 'usr_test_avatar_01',
            nome: 'PROFESSOR TESTE AVATAR',
            email: 'prof.avatar@goncalvesdias.ma.gov.br',
            role: 'Professor(a)',
            perfis: ['Professor(a)', 'Coordenador(a)'],
            tenant_id: 'semed_goncalves_dias',
            org_id: 'semed_goncalves_dias'
        };

        const userToken = generateToken(testUser);

        // Setup: Garantir usuário de teste cadastrado no banco (Postgres ou Local)
        if (!db.useLocalFallback) {
            try {
                await db.query(`
                    INSERT INTO public.usuarios (id, nome, email, senha_hash, role)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, id = EXCLUDED.id;
                `, [testUser.id, testUser.nome, testUser.email, 'hash_test_123', 'Professor']);
            } catch(e) {
                console.error('[Setup Test User Postgres Error]:', e.message);
            }
        } else {
            let fileState = {};
            if (fs.existsSync(db.LOCAL_DB_FILE)) {
                try { fileState = JSON.parse(fs.readFileSync(db.LOCAL_DB_FILE, 'utf8')); } catch(e) {}
            }
            const orgId = testUser.tenant_id;
            if (!fileState[orgId]) fileState[orgId] = {};
            if (!fileState[orgId].dbUsuarios) fileState[orgId].dbUsuarios = [];
            fileState[orgId].dbUsuarios = fileState[orgId].dbUsuarios.filter(u => u.id !== testUser.id);
            fileState[orgId].dbUsuarios.push(testUser);
            fs.writeFileSync(db.LOCAL_DB_FILE, JSON.stringify(fileState, null, 2));
        }

        // 1. GET /api/usuarios/me - Obtenção do perfil logado
        await testAsync('1. GET /api/usuarios/me retorna dados do usuário logado e vínculos', async () => {
            const res = await fetch(`${baseUrl}/api/usuarios/me`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert(data.success, 'Deve retornar success: true');
            assert.strictEqual(data.user.id, testUser.id);
            assert(Array.isArray(data.user.perfis), 'Perfis deve ser um array');
        });

        // 2. Rejeição de arquivo não-imagem (ex: .pdf, .exe)
        await testAsync('2. Rejeição de upload de arquivo não-imagem (.pdf / .txt)', async () => {
            const formData = new FormData();
            const blob = new Blob(['%PDF-1.4 fake pdf content'], { type: 'application/pdf' });
            formData.append('avatar', blob, 'document.pdf');

            const res = await fetch(`${baseUrl}/api/usuarios/${testUser.id}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userToken}` },
                body: formData
            });

            const data = await res.json();
            assert.strictEqual(res.status, 400);
            assert(data.error, 'Deve conter mensagem de erro');
            assert(data.error.toLowerCase().includes('formato') || data.error.toLowerCase().includes('imagem'));
        });

        // 3. Rejeição de arquivo com tamanho > 5MB
        await testAsync('3. Rejeição de upload de imagem acima do limite de 5MB', async () => {
            const formData = new FormData();
            const bigBuffer = new Uint8Array(5.5 * 1024 * 1024);
            const blob = new Blob([bigBuffer], { type: 'image/png' });
            formData.append('avatar', blob, 'huge_photo.png');

            const res = await fetch(`${baseUrl}/api/usuarios/${testUser.id}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userToken}` },
                body: formData
            });

            const data = await res.json();
            assert(res.status === 400 || res.status === 413, `Esperava status 400 ou 413, recebeu ${res.status}`);
            assert(data.error, 'Deve conter mensagem de erro');
        });

        // 4. Upload de imagem válida (PNG)
        let uploadedAvatarUrl = '';
        await testAsync('4. Upload bem-sucedido de imagem JPG/PNG válida com sanitização de nome', async () => {
            const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            const buffer = Buffer.from(validPngBase64, 'base64');
            const blob = new Blob([buffer], { type: 'image/png' });
            const formData = new FormData();
            formData.append('avatar', blob, 'minha_foto_perfil.png');

            const res = await fetch(`${baseUrl}/api/usuarios/${testUser.id}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userToken}` },
                body: formData
            });

            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert(data.success, 'Deve retornar success: true');
            assert(data.avatar_url, 'Deve retornar avatar_url');
            assert(data.avatar_url.startsWith('/uploads/avatars/'), 'URL deve apontar para /uploads/avatars/');
            assert(data.avatar_url.includes('avatar_'), 'Nome do arquivo deve ser sanitizado com prefixo seguro');
            uploadedAvatarUrl = data.avatar_url;
        });

        // 5. Verificação de persistência após upload
        await testAsync('5. GET /api/usuarios/me reflete a nova avatar_url após upload', async () => {
            const res = await fetch(`${baseUrl}/api/usuarios/me`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert.strictEqual(data.user.avatar_url, uploadedAvatarUrl);
        });

        // 6. Proteção IDOR / Acesso não autorizado a alterar avatar de outro usuário
        await testAsync('6. Usuário comum não pode alterar avatar de outro usuário (Proteção IDOR)', async () => {
            const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            const buffer = Buffer.from(validPngBase64, 'base64');
            const blob = new Blob([buffer], { type: 'image/png' });
            const formData = new FormData();
            formData.append('avatar', blob, 'ataque.png');

            const otherUserId = 'usr_outro_usuario_99';
            const res = await fetch(`${baseUrl}/api/usuarios/${otherUserId}/avatar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${userToken}` },
                body: formData
            });

            const data = await res.json();
            assert.strictEqual(res.status, 403);
            assert(data.error, 'Deve barrar com 403 Forbidden');
        });

        // 7. Remoção de foto de perfil (DELETE /api/usuarios/:id/avatar)
        await testAsync('7. DELETE /api/usuarios/:id/avatar remove o avatar com sucesso', async () => {
            const res = await fetch(`${baseUrl}/api/usuarios/${testUser.id}/avatar`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            const data = await res.json();
            assert.strictEqual(res.status, 200);
            assert(data.success, 'Deve retornar success: true');
            assert.strictEqual(data.avatar_url, null);

            // Validar no GET me que avatar_url foi zerada
            const meRes = await fetch(`${baseUrl}/api/usuarios/me`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            const meData = await meRes.json();
            assert.strictEqual(meData.user.avatar_url, null);
        });

    } finally {
        server.close();
    }

    console.log(`\n📊 Resumo da Bateria:`);
    console.log(`   Total de Testes: ${passed + failed}`);
    console.log(`   Aprovados: ${passed}`);
    console.log(`   Falhas: ${failed}`);

    process.exit(failed > 0 ? 1 : 0);
}

if (require.main === module) {
    runTests().catch(err => {
        console.error('Fatal error running tests:', err);
        process.exit(1);
    });
}

module.exports = { runTests };
