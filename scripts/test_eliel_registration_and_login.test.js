const http = require('http');
const app = require('../server');
const { getUsers } = require('../routes/auth_routes');

async function testUserRegistrationAndLogin() {
    console.log('========================================================================');
    console.log('🧪 TESTE DE VERIFICAÇÃO: CADASTRO E LOGIN DE NOVO USUÁRIO (ELIEL SILVA REIS)');
    console.log('========================================================================\n');

    const server = http.createServer(app);
    await new Promise(r => server.listen(8081, r));
    console.log('Servidor de teste rodando na porta 8081\n');

    try {
        // 1. Fazer login como Admin para obter token
        console.log('Passo 1: Autenticando como Administrador Geral...');
        const adminLoginRes = await fetch('http://localhost:8081/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@goncalvesdias.ma.gov.br',
                password: '$!6v3m%rYBm*CA'
            })
        });

        const adminLoginData = await adminLoginRes.json();
        console.log('Admin login status:', adminLoginRes.status, '| Token gerado:', !!adminLoginData.token);
        const adminToken = adminLoginData.token;

        // 2. Cadastrar exatamente o usuário da imagem: Eliel Silva Reis
        console.log('\nPasso 2: Cadastrando Eliel Silva Reis com dados do formulário...');
        const registerPayload = {
            nome: 'Eliel Silva Reis',
            cpf: '451.785.363-02',
            dataNascimento: '11/01/2001',
            telefone: '9940028922',
            role: 'Master Admin',
            tipo: 'Master Admin',
            escola: 'Todas as Escolas (SEMED)',
            email: 'eliel.reis@goncalvesdias.ma.gov.br',
            senha: 'Gondias@2026',
            password: 'Gondias@2026',
            mustChangePassword: false
        };

        const registerRes = await fetch('http://localhost:8081/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + adminToken
            },
            body: JSON.stringify(registerPayload)
        });

        const registerData = await registerRes.json();
        console.log('Status do Cadastro:', registerRes.status);
        console.log('Resposta do Cadastro:', registerData);

        if (!registerRes.ok) {
            throw new Error(`Falha no cadastro: ${JSON.stringify(registerData)}`);
        }

        // 3. Tentar fazer login imediatamente com o novo usuário recém-criado
        console.log('\nPasso 3: Testando login imediato de Eliel Silva Reis...');
        const userLoginRes = await fetch('http://localhost:8081/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'eliel.reis@goncalvesdias.ma.gov.br',
                password: 'Gondias@2026'
            })
        });

        const userLoginData = await userLoginRes.json();
        console.log('Status do Login do Novo Usuário:', userLoginRes.status);
        console.log('Resposta do Login:', userLoginData);

        if (userLoginRes.ok && userLoginData.success) {
            console.log('\n========================================================================');
            console.log('🎉 SUCESSO TOTAL: Novo usuário cadastrado e autenticado com sucesso!');
            console.log(`👤 Nome: ${userLoginData.user.nome}`);
            console.log(`📧 E-mail: ${userLoginData.user.email}`);
            console.log(`🛡️ Cargo: ${userLoginData.user.role}`);
            console.log(`🔑 Token emitido: ${userLoginData.token.slice(0, 25)}...`);
            console.log('========================================================================\n');
        } else {
            throw new Error(`Falha no login do novo usuário: ${JSON.stringify(userLoginData)}`);
        }

    } catch (err) {
        console.error('❌ Erro no teste:', err.message);
    } finally {
        server.close();
        process.exit(0);
    }
}

testUserRegistrationAndLogin();
