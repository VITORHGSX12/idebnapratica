// =========================================================================
// SECURITY FIX: [Hardcode & Password Hashing]
// Script de migração de senhas em texto puro para hashes bcrypt com salt rounds = 12
// =========================================================================

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;
const USERS_FILE = path.join(__dirname, '..', 'users.json');

async function migrate() {
    if (!fs.existsSync(USERS_FILE)) {
        console.log('users.json não existe ou já foi migrado.');
        return;
    }

    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    let migratedCount = 0;

    for (const user of users) {
        if (user.password && !user.password.startsWith('$2b$') && !user.password.startsWith('$2a$')) {
            const raw = user.password;
            user.password = await bcrypt.hash(raw, SALT_ROUNDS);
            migratedCount++;
        }
    }

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    console.log(`[Bcrypt Migration] ${migratedCount} senhas foram migradas com sucesso para hashes Bcrypt (Salt: ${SALT_ROUNDS})!`);
}

migrate().catch(console.error);
