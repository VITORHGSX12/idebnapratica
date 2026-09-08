/**
 * ============================================================================
 * SUÍTE DE TESTES: VALIDAÇÕES DE CADASTRO DE USUÁRIOS (RBAC, CPF & IDADE)
 * Arquivo: scripts/test_user_registration_validations.test.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Mock de Ambiente DOM
const globalMock = {
    DEFAULT_STAFF_USERS: [
        {
            id: 'USR-001',
            nome: 'Secretaria Municipal de Educação',
            cpf: '012.345.678-00',
            email: 'semed@goncalvesdias.ma.gov.br',
            role: 'Gestor da Rede',
            tipo: 'Gestor SEMED',
            escola: 'Todas as Escolas (SEMED)',
            turma: 'Todas as Turmas',
            status: 'Ativo'
        },
        {
            id: 'USR-005',
            nome: 'Prof. Carlos Eduardo',
            cpf: '456.789.012-33',
            email: 'professor@goncalvesdias.ma.gov.br',
            role: 'Professor',
            tipo: 'Professor(a)',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            status: 'Ativo'
        }
    ],
    OFFICIAL_REGISTERED_USERS: [],
    showToast: function(msg, type) {}
};

// Carregar script admin_users.js no mock
const adminUsersCode = fs.readFileSync(path.join(__dirname, '../js/modules/admin/admin_users.js'), 'utf8');
const runInMock = new Function('global', adminUsersCode);
runInMock.call(globalMock, globalMock);

console.log('========================================================================');
console.log('🔍 AUDITORIA & TESTES DE VALIDAÇÃO: CADASTRO DE USUÁRIOS (RBAC & REGRAS)');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details) {
    if (condition) {
        console.log(`  [✓ PASS] ${testName}`);
        passCount++;
    } else {
        console.error(`  [✗ FAIL] ${testName} -> ${details}`);
        failCount++;
    }
}

// --- TESTE 1: VALIDAÇÃO MATEMÁTICA DE CPF (MÓDULO 11) ---
console.log('--- TESTE 1: VALIDAÇÃO MATEMÁTICA DE CPF (DÍGITOS VERIFICADORES) ---');
assert(globalMock.isValidCPF('529.982.247-25') === true, '1.1 CPF com dígitos verificadores válidos é aceito', 'Falha ao validar CPF autêntico');
assert(globalMock.isValidCPF('111.111.111-11') === false, '1.2 CPF com dígitos repetidos (111...) é rejeitado', 'Permitiu sequência repetida');
assert(globalMock.isValidCPF('000.000.000-00') === false, '1.3 CPF com zeros repetidos (000...) é rejeitado', 'Permitiu zeros');
assert(globalMock.isValidCPF('123.456.789-00') === false, '1.4 CPF com dígitos verificadores matematicamente incorretos é rejeitado', 'Permitiu dígito errado');
assert(globalMock.isValidCPF('123') === false, '1.5 CPF incompleto (< 11 dígitos) é rejeitado', 'Permitiu CPF curto');

// --- TESTE 2: DUPLICIDADE DE CPF NA REDE ---
console.log('\n--- TESTE 2: DETECÇÃO DE CPF DUPLICADO ---');
const usersBase = [
    { id: 'USR-001', cpf: '529.982.247-25', email: 'user1@teste.com' },
    { id: 'USR-002', cpf: '012.345.678-00', email: 'user2@teste.com' }
];
assert(globalMock.isDuplicateCPF('52998224725', 'USR-003', usersBase) === true, '2.1 Rejeita CPF já pertencente a outro membro da equipe', 'Não detectou duplicidade');
assert(globalMock.isDuplicateCPF('52998224725', 'USR-001', usersBase) === false, '2.2 Permite o mesmo CPF ao editar o próprio usuário', 'Bloqueou edição legítima');
assert(globalMock.isDuplicateCPF('99988877700', 'USR-003', usersBase) === false, '2.3 Permite CPF novo e inédito', 'Rejeitou CPF inédito');

// --- TESTE 3: DATA DE NASCIMENTO E LIMITES DE IDADE (CORTE <18 E >=90 ANOS) ---
console.log('\n--- TESTE 3: VALIDAÇÃO DE DATA DE NASCIMENTO & CORTE DE IDADE ---');

// 3.1 Data Futura
const futureVal = globalMock.validateBirthDate('10/10/2030');
assert(futureVal.valid === false && futureVal.error.includes('futura'), '3.1 Rejeita data de nascimento no futuro', futureVal.error);

// 3.2 Menor de 18 anos
const currentYear = new Date().getFullYear();
const minorBirth = `15/05/${currentYear - 15}`;
const minorVal = globalMock.validateBirthDate(minorBirth);
assert(minorVal.valid === false && minorVal.error.includes('18 anos'), '3.2 Rejeita profissional menor de 18 anos', minorVal.error);

// 3.3 Idade Irregular (Pessoa com mais de 90 anos)
const oldBirth = '10/01/1930'; // 96 anos
const oldVal = globalMock.validateBirthDate(oldBirth);
assert(oldVal.valid === false && oldVal.error.includes('irregular'), '3.3 Rejeita data irregular para profissionais com mais de 90 anos', oldVal.error);

// 3.4 Data de Calendário Inexistente (ex: 31 de Fevereiro)
const invalidDateVal = globalMock.validateBirthDate('31/02/1990');
assert(invalidDateVal.valid === false, '3.4 Rejeita data de calendário inexistente (31/02/1990)', invalidDateVal.error);

// 3.5 Data Válida e Idade Plena (Ex: 35 anos)
const validBirth = '20/04/1991';
const validVal = globalMock.validateBirthDate(validBirth);
assert(validVal.valid === true && validVal.idade >= 18 && validVal.idade < 85, '3.5 Aceita data válida de profissional ativo com cálculo exato de idade', validVal.error);

// --- TESTE 4: SINCRONIZAÇÃO DE SENHA E RESET ---
console.log('\n--- TESTE 4: RESET DE SENHA E SINCRONIZAÇÃO ---');
const testUser = { id: 'USR-999', nome: 'Docente Teste', senha: 'OutraSenhaAntiga' };
globalMock.DEFAULT_STAFF_USERS.push(testUser);
globalMock.handleResetUserPassword('USR-999');
assert(testUser.senha === 'Gondias@2026', '4.1 Reset de senha define a senha padrão Gondias@2026', testUser.senha);

console.log('\n========================================================================');
console.log(`RELATÓRIO DE AUDITORIA: ${passCount} PASSOU | ${failCount} FALHAS`);
console.log('========================================================================');

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
