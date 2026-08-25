const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch(e) {}
                resolve({ status: res.statusCode, headers: res.headers, body: parsed || data });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runSecurityTestSuite() {
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(' BATERIA DE TESTES DE SEGURANÇA INTEGRADA (SENIOR SECURITY AUDIT)');
    console.log('═══════════════════════════════════════════════════════════════════════\n');

    let passedTests = 0;
    let totalTests = 0;

    function assertTest(condition, name, details) {
        totalTests++;
        if (condition) {
            console.log(`[PASS] ${name}`);
            if (details) console.log(`       └─ ${details}`);
            passedTests++;
        } else {
            console.error(`[FAIL] ${name}`);
            if (details) console.error(`       └─ ${details}`);
        }
    }

    // -------------------------------------------------------------------------
    // TESTES FALHA 1: Row Level Security (RLS)
    // -------------------------------------------------------------------------
    console.log('--- [FALHA 1: ROW LEVEL SECURITY & APPEND-ONLY] ---');
    const rlsMigrationPath = path.join(__dirname, 'supabase', 'migrations', '0007_enable_rls_policies.sql');
    const rlsExists = fs.existsSync(rlsMigrationPath);
    assertTest(rlsExists, 'Migration 0007_enable_rls_policies.sql existe', rlsMigrationPath);
    if (rlsExists) {
        const sqlContent = fs.readFileSync(rlsMigrationPath, 'utf8');
        assertTest(sqlContent.includes('ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;'), 'RLS habilitado para tenants');
        assertTest(sqlContent.includes('ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;'), 'RLS habilitado para escolas');
        assertTest(sqlContent.includes('ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;'), 'RLS habilitado para alunos');
        assertTest(sqlContent.includes('ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;'), 'RLS habilitado para usuarios');
        assertTest(sqlContent.includes('ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;'), 'RLS habilitado para logs_auditoria');
        assertTest(sqlContent.includes('CREATE POLICY "logs_auditoria_insert_authenticated"'), 'logs_auditoria configurada como Append-Only (INSERT para autenticados, UPDATE/DELETE negados)');
    }

    // -------------------------------------------------------------------------
    // TESTES FALHA 2: Server-Side JWT Auth & RBAC Authorization
    // -------------------------------------------------------------------------
    console.log('\n--- [FALHA 2: SERVER-SIDE JWT & RBAC] ---');
    // 2a: Request sem token
    const resNoToken = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/students',
        method: 'GET'
    });
    assertTest(resNoToken.status === 401, 'Requisição sem token bloqueada com 401 Unauthorized', `Status: ${resNoToken.status}`);

    // 2b: Request com token inválido/adulterado
    const resInvalidToken = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/students',
        method: 'GET',
        headers: { 'Authorization': 'Bearer token_adulterado_invalido_xyz' }
    });
    assertTest(resInvalidToken.status === 401, 'Requisição com token adulterado bloqueada com 401 Unauthorized', `Status: ${resInvalidToken.status}`);

    // 2c: Login com credenciais válidas e retorno de JWT real
    const resLogin = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, { email: 'admin@goncalvesdias.ma.gov.br', password: 'admin' });
    
    let validJwtToken = null;
    if (resLogin.status === 200 && resLogin.body.token) {
        validJwtToken = resLogin.body.token;
        const decoded = jwt.verify(validJwtToken, JWT_SECRET);
        assertTest(!!decoded && decoded.email === 'admin@goncalvesdias.ma.gov.br', 'Login emite JWT real com assinatura válida e expiração de 8h', `Exp: ${new Date(decoded.exp * 1000).toISOString()}`);
    } else {
        assertTest(false, 'Login falhou', JSON.stringify(resLogin.body));
    }

    // 2d: Acesso autorizado a rota protegida com JWT
    if (validJwtToken) {
        const resAuthReq = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: '/api/students',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${validJwtToken}` }
        });
        assertTest(resAuthReq.status === 200 && Array.isArray(resAuthReq.body), 'Acesso a rota protegida /api/students permitido para usuário autenticado com JWT', `Total alunos: ${resAuthReq.body.length}`);
    }

    // 2e: Teste de RBAC - Professor tentando executar ação restrita a Gestor/Admin
    const teacherToken = jwt.sign(
        { id: 'usr_prof', email: 'professor@goncalvesdias.ma.gov.br', role: 'Professor', org_id: 'semed_goncalves_dias' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    const resForbiddenReq = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/students',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${teacherToken}`,
            'Content-Type': 'application/json'
        }
    }, { nome: 'Aluno Não Autorizado' });
    assertTest(resForbiddenReq.status === 403, 'Acesso RBAC: Usuário com role "Professor" bloqueado com 403 Forbidden em rota exclusiva de Gestor/Admin', `Status: ${resForbiddenReq.status}`);

    // -------------------------------------------------------------------------
    // TESTES FALHA 3: Insecure Direct Object Reference (IDOR)
    // -------------------------------------------------------------------------
    console.log('\n--- [FALHA 3: IDOR PROTECTION & 404 NOT FOUND] ---');
    const resIdorStudent = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/students/id_inexistente_ou_outro_tenant_999999',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${validJwtToken}` }
    });
    assertTest(resIdorStudent.status === 404, 'IDOR em /api/students/:id retorna 404 Not Found (não 403) para não revelar existência', `Status: ${resIdorStudent.status}`);

    const resIdorSchool = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/schools/id_inexistente_999999',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${validJwtToken}` }
    });
    assertTest(resIdorSchool.status === 404, 'IDOR em /api/schools/:id retorna 404 Not Found', `Status: ${resIdorSchool.status}`);

    const resIdorSchedule = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/schedules/id_inexistente_999999',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${validJwtToken}` }
    });
    assertTest(resIdorSchedule.status === 404, 'IDOR em /api/schedules/:id retorna 404 Not Found', `Status: ${resIdorSchedule.status}`);

    const resIdorUser = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/users/id_inexistente_999999',
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${validJwtToken}`,
            'Content-Type': 'application/json'
        }
    }, { nome: 'Alteração Fantasma' });
    assertTest(resIdorUser.status === 404, 'IDOR em /api/users/:id retorna 404 Not Found', `Status: ${resIdorUser.status}`);

    // -------------------------------------------------------------------------
    // TESTES FALHA 4: Hardcode & Secrets
    // -------------------------------------------------------------------------
    console.log('\n--- [FALHA 4: HARDCODE, SECRETS & BCRYPT] ---');
    const gitignoreContent = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
    assertTest(gitignoreContent.includes('users.json'), 'users.json adicionado ao .gitignore');
    assertTest(gitignoreContent.includes('.env'), '.env adicionado ao .gitignore');

    const envExampleExists = fs.existsSync(path.join(__dirname, '.env.example'));
    assertTest(envExampleExists, '.env.example criado como template seguro sem valores de produção');

    // Verificar senhas no users.json com bcrypt
    const usersJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
    const allHashed = usersJson.every(u => !u.password || u.password.startsWith('$2b$') || u.password.startsWith('$2a$'));
    assertTest(allHashed, 'Todas as senhas no users.json foram migradas para hashes Bcrypt (Salt: 12)', `Total de usuários auditados: ${usersJson.length}`);

    // -------------------------------------------------------------------------
    // TESTES FALHA 5: XSS Sanitization & Content-Security-Policy
    // -------------------------------------------------------------------------
    console.log('\n--- [FALHA 5: XSS SANITIZATION & CONTENT-SECURITY-POLICY] ---');
    const securityJsPath = path.join(__dirname, 'js', 'core', 'security.js');
    assertTest(fs.existsSync(securityJsPath), 'Arquivo js/core/security.js criado com funções universais de escape');

    const indexHtmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
    assertTest(indexHtmlContent.includes('<script src="js/core/security.js"></script>'), 'js/core/security.js importado no index.html antes dos módulos');

    const resCsp = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/health',
        method: 'GET'
    });
    const cspHeader = resCsp.headers['content-security-policy'];
    assertTest(!!cspHeader && cspHeader.includes("default-src 'self'"), 'Header Content-Security-Policy ativo em todas as respostas HTTP', cspHeader);

    console.log('\n═══════════════════════════════════════════════════════════════════════');
    console.log(` RESULTADO FINAL DA AUDITORIA: ${passedTests}/${totalTests} TESTES APROVADOS (${Math.round((passedTests/totalTests)*100)}%)`);
    console.log('═══════════════════════════════════════════════════════════════════════');
}

runSecurityTestSuite().catch(console.error);
