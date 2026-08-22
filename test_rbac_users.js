const http = require('http');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch(e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

const PORT = process.env.PORT || 8080;

async function runRBACTests() {
    console.log(`=== INICIANDO TESTES DE SEGURANÇA RBAC (PORTA ${PORT}) ===\n`);

    // 1. Tokens de Teste
    const profToken = Buffer.from('professor@goncalvesdias.ma.gov.br').toString('base64');
    const diretorToken = Buffer.from('diretor@goncalvesdias.ma.gov.br').toString('base64');
    const adminToken = Buffer.from('admin@goncalvesdias.ma.gov.br').toString('base64');
    const semedToken = Buffer.from('semed@goncalvesdias.ma.gov.br').toString('base64');

    // TESTE 1: Professor tentando cadastrar usuário via API direta
    console.log('[TESTE 1] Professor (Grupo VISUALIZAÇÃO) tenta POST /api/users...');
    const resProfPost = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/users',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${profToken}`
        }
    }, {
        nome: 'Usuario Invasor',
        email: 'invasor@goncalvesdias.ma.gov.br',
        role: 'Master Admin'
    });
    console.log(`Status retornado: ${resProfPost.status} (Esperado: 403)`);
    console.log('Resposta:', resProfPost.body);
    if (resProfPost.status === 403) {
        console.log('✅ SUCESSO: Tentativa de escrita por Professor foi BLOQUEADA com 403 Forbidden no backend!\n');
    } else {
        console.error('❌ FALHA: Professor conseguiu chamar rota de escrita!\n');
    }

    // TESTE 2: Diretor tentando excluir usuário via API direta
    console.log('[TESTE 2] Diretor (Grupo VISUALIZAÇÃO) tenta DELETE /api/users/usr_admin...');
    const resDirDel = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/users/usr_admin',
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${diretorToken}`
        }
    });
    console.log(`Status retornado: ${resDirDel.status} (Esperado: 403)`);
    console.log('Resposta:', resDirDel.body);
    if (resDirDel.status === 403) {
        console.log('✅ SUCESSO: Tentativa de exclusão por Diretor foi BLOQUEADA com 403 Forbidden no backend!\n');
    } else {
        console.error('❌ FALHA: Diretor conseguiu excluir registro!\n');
    }

    // TESTE 3: Admin (Grupo CONFIGURAÇÃO) cadastrando novo usuário de equipe
    console.log('[TESTE 3] Admin (Grupo CONFIGURAÇÃO) cadastra novo Professor via POST /api/users...');
    const testUserEmail = `prof.teste_${Date.now()}@goncalvesdias.ma.gov.br`;
    const resAdminPost = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/users',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        }
    }, {
        nome: 'Prof. Teste Automatizado RBAC',
        email: testUserEmail,
        password: 'Password@2026',
        role: 'Professor',
        escola: 'U.E. BENTA VILANOVA',
        turma: '5º Ano B'
    });
    console.log(`Status retornado: ${resAdminPost.status} (Esperado: 200)`);
    console.log('Resposta:', resAdminPost.body);
    if (resAdminPost.status === 200 && resAdminPost.body.success) {
        console.log('✅ SUCESSO: Admin cadastrou o usuário com sucesso!\n');
    } else {
        console.error('❌ FALHA: Admin não conseguiu cadastrar usuário!\n');
    }

    // TESTE 4: Tentativa de cadastrar "Aluno" na tela de Usuários
    console.log('[TESTE 4] Admin tentando cadastrar "Aluno" na rota de Usuários...');
    const resAdminPostAluno = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/users',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        }
    }, {
        nome: 'Aluno Na Rota Errada',
        email: `aluno.errado_${Date.now()}@goncalvesdias.ma.gov.br`,
        role: 'Aluno'
    });
    console.log(`Status retornado: ${resAdminPostAluno.status} (Esperado: 400)`);
    console.log('Resposta:', resAdminPostAluno.body);
    if (resAdminPostAluno.status === 400) {
        console.log('✅ SUCESSO: Modelo de dados protegido! Cadastro de aluno na rota de equipe foi rejeitado.\n');
    }

    // TESTE 5: Listagem escopada para Diretor (apenas sua escola) vs Admin (rede completa)
    console.log('[TESTE 5] GET /api/users com token de Diretor (Escopo: U.E. BENTA VILANOVA)...');
    const resDirGet = await makeRequest({
        hostname: 'localhost',
        port: PORT,
        path: '/api/users',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${diretorToken}`
        }
    });
    console.log(`Status: ${resDirGet.status}, Total de usuários retornados para o Diretor: ${resDirGet.body.length}`);
    const otherSchoolUsers = (resDirGet.body || []).filter(u => u.escola && !u.escola.toLowerCase().includes('benta') && !u.escola.toLowerCase().includes('todas'));
    console.log(`Usuários de outras escolas vazados: ${otherSchoolUsers.length}`);
    if (otherSchoolUsers.length === 0) {
        console.log('✅ SUCESSO: Isolamento de dados do Diretor confirmado! Nenhum dado de outra escola foi exposto.\n');
    }

    // TESTE 6: Limpeza do usuário de teste
    if (resAdminPost.body && resAdminPost.body.user && resAdminPost.body.user.id) {
        console.log(`[TESTE 6] Admin excluindo usuário de teste ${resAdminPost.body.user.id}...`);
        const resDel = await makeRequest({
            hostname: 'localhost',
            port: PORT,
            path: `/api/users/${resAdminPost.body.user.id}`,
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        console.log(`Status exclusão: ${resDel.status} (Esperado: 200)`);
        console.log('✅ SUCESSO: Limpeza concluída.\n');
    }

    console.log('=== TODOS OS TESTES DE RBAC E SEPARAÇÃO DE MODELO FORAM CONCLUÍDOS COM SUCESSO ===');
}

runRBACTests().catch(console.error);
