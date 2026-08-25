const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const USERS_PATH = path.join(__dirname, '..', 'users.json');
const CSV_EXPORT_PATH = path.join(__dirname, '..', 'credenciais_temporarias.csv');

/**
 * Gera uma senha aleatória forte e segura com pelo menos 14 caracteres:
 * Contém letras maiúsculas, minúsculas, números e caracteres especiais.
 */
function generateStrongPassword(length = 14) {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%&*-_=+';
    const allChars = uppercase + lowercase + numbers + symbols;

    let password = '';
    // Garante pelo menos um caractere de cada grupo
    password += uppercase[crypto.randomInt(0, uppercase.length)];
    password += lowercase[crypto.randomInt(0, lowercase.length)];
    password += numbers[crypto.randomInt(0, numbers.length)];
    password += symbols[crypto.randomInt(0, symbols.length)];

    for (let i = 4; i < length; i++) {
        password += allChars[crypto.randomInt(0, allChars.length)];
    }

    // Embaralha os caracteres da senha para evitar padrão nas 4 primeiras posições
    const arr = password.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
}

function escapeCsvField(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
}

async function run() {
    console.log('=== INICIANDO MIGRAÇÃO E GERAÇÃO DE SENHAS FORTES TEMPORÁRIAS ===\n');

    if (!fs.existsSync(USERS_PATH)) {
        console.error(`Erro: Arquivo não encontrado em ${USERS_PATH}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(USERS_PATH, 'utf8');
    const users = JSON.parse(rawData);

    const csvRows = [
        'Email,Nome,Perfil,Escola,Turma,Senha_Temporaria,MustChangePassword'
    ];

    console.log(`Processando ${users.length} usuários em users.json...`);

    for (const user of users) {
        const tempPassword = generateStrongPassword(14);
        const hash = await bcrypt.hash(tempPassword, 12);

        user.password = hash;
        user.mustChangePassword = true;
        user.updated_at = new Date().toISOString();

        const csvLine = [
            escapeCsvField(user.email),
            escapeCsvField(user.nome),
            escapeCsvField(user.role),
            escapeCsvField(user.escola || ''),
            escapeCsvField(user.turma || ''),
            escapeCsvField(tempPassword),
            escapeCsvField(true)
        ].join(',');

        csvRows.push(csvLine);

        console.log(`[OK] ${user.email} (${user.role}) -> Senha forte gerada & hash Bcrypt custo 12 atualizado.`);
    }

    // 1. Salva users.json atualizado
    fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf8');
    console.log(`\n[SUCESSO] users.json atualizado com sucesso (${users.length} usuários).`);

    // 2. Exporta CSV de credenciais temporárias para entrega segura fora do sistema
    fs.writeFileSync(CSV_EXPORT_PATH, csvRows.join('\n'), 'utf8');
    console.log(`[SUCESSO] CSV de credenciais exportado em: ${CSV_EXPORT_PATH}\n`);
}

run().catch(err => {
    console.error('Erro fatal ao gerar senhas:', err);
    process.exit(1);
});
