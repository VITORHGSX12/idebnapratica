/**
 * ============================================================================
 * TESTE REAL DE RATE LIMITING PERSISTENTE CONTRA POSTGRESQL (NEON)
 * ============================================================================
 */

require('dotenv').config();

const assert = require('assert');
const http = require('http');

if (!process.env.DATABASE_URL) {
    console.error('❌ ERRO: DATABASE_URL não definida no ambiente (.env).');
    process.exit(1);
}

const app = require('../server');
const db = require('../db');

function makeRequest(baseUrl, method, path, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        let reqBody = null;
        const headers = {};
        if (body) {
            reqBody = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = Buffer.byteLength(reqBody);
        }
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers
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

async function runTest() {
    console.log('🧪 Iniciando Teste Real de Rate Limiting Persistente no PostgreSQL (Neon)...\n');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const testEmail = `test.ratelimit.${Date.now()}@semed.gov.br`;

    try {
        console.log(`1. Testando 5 tentativas de login incorretas com e-mail: ${testEmail}`);
        for (let i = 1; i <= 5; i++) {
            const res = await makeRequest(baseUrl, 'POST', '/api/auth/login', {
                email: testEmail,
                password: 'wrong_password_' + i
            });
            console.log(`   Tentativa #${i}: Status ${res.status} | Resposta: ${res.body.error || JSON.stringify(res.body)}`);
            assert.strictEqual(res.status, 401, `Tentativa #${i} deveria retornar 401`);
        }

        console.log('\n2. Verificando persistência real na tabela public.login_attempts no PostgreSQL...');
        const dbCheck = await db.query(
            'SELECT count(*)::int as total FROM public.login_attempts WHERE LOWER(email) = $1 AND success = FALSE',
            [testEmail]
        );
        const countInDb = dbCheck.rows[0].total;
        console.log(`   Total de registros gravados no PostgreSQL Neon: ${countInDb}`);
        assert.strictEqual(countInDb, 5, 'Deveria haver exatamente 5 registros persistidos no banco Neon');

        console.log('\n3. Testando a 6ª tentativa para comprovar bloqueio (429 Too Many Requests)...');
        const blockedRes = await makeRequest(baseUrl, 'POST', '/api/auth/login', {
            email: testEmail,
            password: 'any_password'
        });

        console.log(`   6ª Tentativa: Status ${blockedRes.status} | Mensagem: ${blockedRes.body.error}`);
        assert.strictEqual(blockedRes.status, 429, 'A 6ª tentativa DEVE retornar 429 Too Many Requests');
        assert(blockedRes.body.error.includes('Muitas tentativas incorretas') || blockedRes.body.error.includes('bloqueada'), 'Deve conter mensagem explicativa de bloqueio');

        console.log('\n✅ SUCESSO: Rate limiting persistente no PostgreSQL Neon 100% validado!');

        // Limpeza dos registros de teste no banco
        await db.query('DELETE FROM public.login_attempts WHERE LOWER(email) = $1', [testEmail]);
        console.log('🧹 Limpeza dos dados de teste concluída no banco.');

    } finally {
        if (server && server.listening) {
            server.close();
        }
    }

    process.exit(0);
}

runTest().catch(err => {
    console.error('❌ Erro no teste de rate limit real:', err);
    process.exit(1);
});
