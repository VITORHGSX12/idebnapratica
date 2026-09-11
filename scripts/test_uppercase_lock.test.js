// =============================================================================
// TEST SUITE: TRAVA DE CAIXA ALTA (UPPERCASE LOCK) & NORMALIZAÇÃO
// =============================================================================

const assert = require('assert');
const http = require('http');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { JWT_SECRET } = require('../middleware/auth');
const {
    toUppercaseSafe,
    normalizeEmail,
    normalizeUppercaseEntity
} = require('../services/normalization_service');

function generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
}

async function runTests() {
    console.log('🧪 Iniciando Bateria de Testes: Trava de Caixa Alta & Normalização...\n');
    let passed = 0;
    let failed = 0;

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

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

    function makeRequest(method, path, body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, baseUrl);
            const reqHeaders = { ...headers };
            let reqBody = null;
            if (body) {
                reqBody = JSON.stringify(body);
                reqHeaders['Content-Type'] = 'application/json';
                reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
            }
            const req = http.request({
                hostname: url.hostname,
                port: url.port,
                path: url.pathname + url.search,
                method,
                headers: reqHeaders
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    let parsed;
                    try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
                    resolve({ status: res.statusCode, body: parsed });
                });
            });
            req.on('error', reject);
            if (reqBody) req.write(reqBody);
            req.end();
        });
    }

    try {
        const adminUser = {
            id: 'usr_admin_upper_01',
            nome: 'ADMINISTRADOR TESTES',
            email: 'admin.upper@semed.gov.br',
            role: 'Master Admin',
            perfis: ['Master Admin'],
            tenant_id: 'semed_goncalves_dias',
            org_id: 'semed_goncalves_dias'
        };
        const adminToken = generateToken(adminUser);

        // 1. Testes Unitários de Normalização de Texto e Exceções
        test('1. toUppercaseSafe converte strings para maiúsculas e preserva acentos', () => {
            assert.strictEqual(toUppercaseSafe('joão da silva'), 'JOÃO DA SILVA');
            assert.strictEqual(toUppercaseSafe('  escola são josé  '), 'ESCOLA SÃO JOSÉ');
            assert.strictEqual(toUppercaseSafe('5º ano matutino'), '5º ANO MATUTINO');
            assert.strictEqual(toUppercaseSafe(null), null);
            assert.strictEqual(toUppercaseSafe(123), 123);
        });

        test('2. normalizeEmail converte para minúsculas e remove espaços (Isenção da Trava)', () => {
            assert.strictEqual(normalizeEmail('  PROFESSOR@SEMED.GOV.BR '), 'professor@semed.gov.br');
            assert.strictEqual(normalizeEmail('Aluno.Teste@Escola.Com'), 'aluno.teste@escola.com');
        });

        test('3. normalizeUppercaseEntity converte campos de cadastro e preserva email/senha/token/avatar', () => {
            const rawPayload = {
                nome: 'ana beatriz moura',
                mae: 'maria josé moura',
                pai: 'carlos alberto moura',
                endereco: 'rua das flores, 123, centro',
                bairro: 'centro',
                cidade: 'gonçalves dias',
                email: 'ANA.MOURA@SEMED.GOV.BR',
                password: 'MySecretPassword123!',
                avatar_url: '/uploads/avatars/avatar_12345.png',
                token: 'jwt.token.abc'
            };

            const normalized = normalizeUppercaseEntity(rawPayload, 'aluno');

            assert.strictEqual(normalized.nome, 'ANA BEATRIZ MOURA');
            assert.strictEqual(normalized.mae, 'MARIA JOSÉ MOURA');
            assert.strictEqual(normalized.pai, 'CARLOS ALBERTO MOURA');
            assert.strictEqual(normalized.endereco, 'RUA DAS FLORES, 123, CENTRO');
            assert.strictEqual(normalized.bairro, 'CENTRO');
            assert.strictEqual(normalized.cidade, 'GONÇALVES DIAS');
            
            // Exceções obrigatórias
            assert.strictEqual(normalized.email, 'ana.moura@semed.gov.br', 'Email DEVE ser minúsculo');
            assert.strictEqual(normalized.password, 'MySecretPassword123!', 'Senha NÃO DEVE ser alterada');
            assert.strictEqual(normalized.avatar_url, '/uploads/avatars/avatar_12345.png', 'Avatar URL NÃO DEVE ser alterada');
            assert.strictEqual(normalized.token, 'jwt.token.abc', 'Token NÃO DEVE ser alterado');
        });

        // 4. Teste de Endpoint: POST /api/usuarios com dados em minúsculas
        await testAsync('4. POST /api/usuarios normaliza campos de texto para CAIXA ALTA no backend', async () => {
            const dynamicEmail = `roberto.freire.${Date.now()}@semed.gov.br`;
            const payload = {
                nome: 'professor roberto freire',
                email: dynamicEmail,
                role: 'professor(a)',
                escola: 'unidade integrada dom pedro',
                cargo: 'docente de matemática',
                perfis: ['professor(a)']
            };

            const res = await makeRequest('POST', '/api/usuarios', payload, {
                'Authorization': `Bearer ${adminToken}`
            });

            assert(res.status === 200 || res.status === 201, `Status ${res.status}: ${JSON.stringify(res.body)}`);
            assert(res.body.success, 'Deve retornar success: true');
            assert.strictEqual(res.body.user.nome, 'PROFESSOR ROBERTO FREIRE');
            assert.strictEqual(res.body.user.email, dynamicEmail.toLowerCase());
            assert.strictEqual(res.body.user.escola, 'UNIDADE INTEGRADA DOM PEDRO');
            assert.strictEqual(res.body.user.cargo, 'DOCENTE DE MATEMÁTICA');
        });

        // 5. Teste de Endpoint: POST /api/students com dados em minúsculas
        await testAsync('5. POST /api/students normaliza nome do aluno para CAIXA ALTA no backend', async () => {
            const studentPayload = {
                nome: 'lucas henrique oliveira',
                matricula: '987654',
                turma: '5º ano matutino a'
            };

            const res = await makeRequest('POST', '/api/students', studentPayload, {
                'Authorization': `Bearer ${adminToken}`
            });

            assert(res.status === 200 || res.status === 201, `Status ${res.status}`);
            assert(res.body.success, 'Deve retornar success: true');
            assert.strictEqual(res.body.student.nome, 'LUCAS HENRIQUE OLIVEIRA');
            assert.strictEqual(res.body.student.turma, '5º ANO MATUTINO A');
        });

        // 6. Teste de Endpoint: PUT /api/students/:id com atualização em minúsculas
        await testAsync('6. PUT /api/students/:id normaliza edição de aluno para CAIXA ALTA', async () => {
            const updatePayload = {
                nome: 'lucas henrique oliveira dos santos',
                mae: 'claudia ferreira oliveira'
            };

            const res = await makeRequest('PUT', '/api/students/987654', updatePayload, {
                'Authorization': `Bearer ${adminToken}`
            });

            assert.strictEqual(res.status, 200);
            assert(res.body.success, 'Deve retornar success: true');
            if (res.body.student) {
                assert.strictEqual(res.body.student.nome, 'LUCAS HENRIQUE OLIVEIRA DOS SANTOS');
                assert.strictEqual(res.body.student.mae, 'CLAUDIA FERREIRA OLIVEIRA');
            }
        });

        // 7. Teste de Endpoint: POST /api/classes com dados em minúsculas
        await testAsync('7. POST /api/classes normaliza nome da turma, série e turno para CAIXA ALTA', async () => {
            const classPayload = {
                nome: 'turma 9º ano vespertino c',
                serie: '9º ano',
                turno: 'vespertino',
                escola: 'escola municipal gonçalves dias'
            };

            const res = await makeRequest('POST', '/api/classes', classPayload, {
                'Authorization': `Bearer ${adminToken}`
            });

            assert(res.status === 200 || res.status === 201, `Status ${res.status}`);
            assert(res.body.success, 'Deve retornar success: true');
            assert.strictEqual(res.body.class.nome, 'TURMA 9º ANO VESPERTINO C');
            assert.strictEqual(res.body.class.serie, '9º ANO');
            assert.strictEqual(res.body.class.turno, 'VESPERTINO');
        });

    } finally {
        if (server && server.listening) {
            server.close();
        }
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
