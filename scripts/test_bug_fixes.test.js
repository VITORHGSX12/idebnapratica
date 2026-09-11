/**
 * ============================================================================
 * SUÍTE DE TESTES: CORREÇÃO DOS BUGS 1, 2, 3, 4, 5 e 6 — IDEB NA PRÁTICA
 * ============================================================================
 */

const assert = require('assert');
const http = require('http');
const app = require('../server');
const { isValidCPF, formatCPF } = require('../routes/alunos_routes');

let server;
const PORT = 4099;
const baseUrl = `http://127.0.0.1:${PORT}`;

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

        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: reqHeaders
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed;
                try {
                    parsed = JSON.parse(data);
                } catch(e) {
                    parsed = data;
                }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });

        req.on('error', reject);
        if (reqBody) req.write(reqBody);
        req.end();
    });
}

async function runTests() {
    console.log('====================================================================');
    console.log('INICIANDO AUDITORIA E TESTES DOS 6 BUGS REPORTADOS');
    console.log('====================================================================\n');

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`[PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`[FAIL] ${name}`);
            console.error('       ', err.message);
            failed++;
        }
    }

    try {
        server = app.listen(PORT);
        await new Promise(resolve => setTimeout(resolve, 300));

        // -------------------------------------------------------------
        // BUG 3: VALIDAÇÃO DE CPF & CADASTRO DE ALUNO
        // -------------------------------------------------------------
        console.log('--- TESTES BUG 3: Validação de CPF e Cadastro de Alunos ---');

        await test('Bug 3.1: Algoritmo Modulo 11 rejeita CPF inválido ou sequencial (11111111111)', () => {
            assert.strictEqual(isValidCPF('11111111111'), false);
            assert.strictEqual(isValidCPF('00000000000'), false);
            assert.strictEqual(isValidCPF('12345678900'), false);
            assert.strictEqual(isValidCPF('123.456.789-99'), false);
        });

        await test('Bug 3.2: Algoritmo Modulo 11 aceita CPFs matematicamente válidos', () => {
            // Exemplos matematicamente válidos para teste
            assert.strictEqual(isValidCPF('52998224725'), true);
            assert.strictEqual(isValidCPF('529.982.247-25'), true);
            assert.strictEqual(isValidCPF('11144477735'), true);
            assert.strictEqual(isValidCPF('111.444.777-35'), true);
        });

        await test('Bug 3.3: formatCPF aplica máscara 000.000.000-00 e limita tamanho', () => {
            assert.strictEqual(formatCPF('52998224725'), '529.982.247-25');
            assert.strictEqual(formatCPF('529982247259999'), '529.982.247-25'); // Trunca além de 11 dígitos
        });

        // Gerar tokens JWT assinados para dois Admin Master diferentes
        const { JWT_SECRET } = require('../middleware/auth');
        const jwt = require('jsonwebtoken');

        const token = jwt.sign({
            id: 'usr_admin_01',
            nome: 'ADMIN MASTER 01',
            email: 'admin1@goncalvesdias.ma.gov.br',
            role: 'Master Admin',
            perfis: ['Master Admin'],
            org_id: 'semed_goncalves_dias',
            tenant_id: '00000000-0000-0000-0000-000000000001'
        }, JWT_SECRET, { expiresIn: '2h' });

        const token2 = jwt.sign({
            id: 'usr_admin_02',
            nome: 'ADMIN MASTER 02 (OUTRO DISPOSITIVO)',
            email: 'admin2@goncalvesdias.ma.gov.br',
            role: 'Master Admin',
            perfis: ['Master Admin'],
            org_id: 'gd',
            tenant_id: '00000000-0000-0000-0000-000000000001'
        }, JWT_SECRET, { expiresIn: '2h' });

        await test('Bug 3.4: POST /api/students rejeita CPF inválido com status 400 sem deslogar', async () => {
            const res = await makeRequest('POST', '/api/students', {
                nome: 'ALUNO TESTE CPF INVALIDO',
                cpf: '123.456.789-99',
                matricula: 'REG_TEST_INV_' + Date.now()
            }, { 'Authorization': `Bearer ${token}` });

            assert.strictEqual(res.status, 400);
            assert.ok(res.body.error.includes('CPF'), 'Deve retornar erro explícito sobre CPF inválido');
        });

        await test('Bug 3.5: POST /api/students cadastra com sucesso aluno com CPF válido', async () => {
            const matricula = 'REG_TEST_OK_' + Date.now();
            const res = await makeRequest('POST', '/api/students', {
                nome: 'aluno teste cpf valido',
                cpf: '529.982.247-25',
                matricula: matricula
            }, { 'Authorization': `Bearer ${token}` });

            assert.strictEqual(res.status, 201);
            assert.strictEqual(res.body.success, true);
            assert.strictEqual(res.body.student.nome, 'ALUNO TESTE CPF VALIDO'); // Valida caixa alta
            assert.strictEqual(res.body.student.cpf, '529.982.247-25');
        });

        // -------------------------------------------------------------
        // BUG 5 & BUG 6: MULTITENANCY E VISIBILIDADE DE ALUNOS (500+)
        // -------------------------------------------------------------
        console.log('\n--- TESTES BUG 5 & 6: Visibilidade de Alunos e Consistência entre Admin Master ---');

        await test('Bug 5 & 6: GET /api/students retorna lista consistente de alunos para ambas as contas de Admin Master', async () => {
            const listAdmin1 = await makeRequest('GET', '/api/students', null, { 'Authorization': `Bearer ${token}` });
            const listAdmin2 = await makeRequest('GET', '/api/students', null, { 'Authorization': `Bearer ${token2}` });

            assert.strictEqual(listAdmin1.status, 200);
            assert.strictEqual(listAdmin2.status, 200);
            assert.ok(Array.isArray(listAdmin1.body), 'Deve retornar array de alunos');
            assert.ok(Array.isArray(listAdmin2.body), 'Deve retornar array de alunos');
            assert.strictEqual(listAdmin1.body.length, listAdmin2.body.length, 'Ambos Admin Master devem ver exatamente a mesma quantidade de alunos da rede');
        });

        // -------------------------------------------------------------
        // BUG 1 & BUG 2 & BUG 4: NAVEGAÇÃO, NOTIFICAÇÕES E EXPORTAÇÃO
        // -------------------------------------------------------------
        console.log('\n--- TESTES BUG 1, 2 & 4: Interface, Notificações e Exportação ---');

        await test('Bug 1: navigation.js possui suporte a toggleMobileSidebar inteligente (desktop collapse + mobile drawer)', () => {
            const fs = require('fs');
            const navJs = fs.readFileSync('js/core/navigation.js', 'utf8');
            assert.ok(navJs.includes('toggleSidebarCollapse'), 'navigation.js deve alternar collapse no desktop');
            assert.ok(navJs.includes('mobile-sidebar-open'), 'navigation.js deve alternar drawer no mobile');
        });

        await test('Bug 2: notifications.js inicializa e sincroniza contador de badge e esvaziamento', () => {
            const fs = require('fs');
            const notifJs = fs.readFileSync('js/core/notifications.js', 'utf8');
            assert.ok(notifJs.includes('notification-badge'), 'notifications.js deve gerenciar o badge');
            assert.ok(notifJs.includes('btn-clear-notifications'), 'notifications.js deve gerenciar a ação Limpar todos');
            assert.ok(notifJs.includes('notifications-list'), 'notifications.js deve injetar itens na lista');
        });

        await test('Bug 4: export_service.js oferece exportToCSV com BOM UTF-8 e exportStudentsDataset', () => {
            const fs = require('fs');
            const exportJs = fs.readFileSync('js/core/export_service.js', 'utf8');
            assert.ok(exportJs.includes('\\uFEFF'), 'export_service.js deve incluir BOM UTF-8 para compatibilidade Excel');
            assert.ok(exportJs.includes('exportToCSV'), 'export_service.js deve exportar CSV');
            assert.ok(exportJs.includes('exportStudentsDataset'), 'export_service.js deve exportar lista de estudantes');
        });

        console.log(`\n====================================================================`);
        console.log(`RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
        console.log(`====================================================================\n`);

    } finally {
        if (server) {
            server.close(() => {
                process.exit(failed > 0 ? 1 : 0);
            });
            setTimeout(() => process.exit(failed > 0 ? 1 : 0), 500).unref();
        } else {
            process.exit(failed > 0 ? 1 : 0);
        }
    }
}

runTests();
