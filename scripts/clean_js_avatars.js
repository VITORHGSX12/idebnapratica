const fs = require('fs');
const path = require('path');

// 1. official_users_directory.js
const uDirPath = path.join(__dirname, '..', 'js', 'data', 'official_users_directory.js');
if (fs.existsSync(uDirPath)) {
    let uDir = fs.readFileSync(uDirPath, 'utf8');
    uDir = uDir.replace(/avatar:\s*'[^\']+'/g, "avatar: ''");
    fs.writeFileSync(uDirPath, uDir, 'utf8');
    console.log('✅ official_users_directory.js limpo.');
}

// 2. auth_login.js
const aLoginPath = path.join(__dirname, '..', 'js', 'core', 'auth', 'auth_login.js');
if (fs.existsSync(aLoginPath)) {
    let aLogin = fs.readFileSync(aLoginPath, 'utf8');
    aLogin = aLogin.replace(/avatar:\s*loginData\.user\.role === 'Professor' \? '👨‍🏫' : \(loginData\.user\.role === 'Master Admin' \? '👨‍💻' : '🧑‍💼'\)/g, "avatar: ''");
    aLogin = aLogin.replace(/avatar:\s*\(p\.role \|\| ''\)\.includes\('Professor'\) \? '👨‍🏫' : '🧑‍💼'/g, "avatar: ''");
    aLogin = aLogin.replace(/avatar:\s*found\.avatar \|\| '🧑‍💼'/g, "avatar: found.avatar || ''");
    aLogin = aLogin.replace(/var profileAvatar = authenticatedUser\.avatar \|\| '🧑‍💼';/g, "var profileAvatar = authenticatedUser.avatar || '';");
    fs.writeFileSync(aLoginPath, aLogin, 'utf8');
    console.log('✅ auth_login.js limpo.');
}

// 3. user-profile.js
const uProfPath = path.join(__dirname, '..', 'js', 'core', 'user-profile.js');
if (fs.existsSync(uProfPath)) {
    let uProf = fs.readFileSync(uProfPath, 'utf8');
    uProf = uProf.replace(/var selectedProfileIcon = '🧑‍💼';/g, "var selectedProfileIcon = '';");
    uProf = uProf.replace(/var defaultAvatar = '🧑‍💼';/g, "var defaultAvatar = '';");
    uProf = uProf.replace(/defaultAvatar = '👨‍🏫';/g, "defaultAvatar = '';");
    uProf = uProf.replace(/defaultAvatar = '👩‍💼';/g, "defaultAvatar = '';");
    uProf = uProf.replace(/defaultAvatar = '👨‍💻';/g, "defaultAvatar = '';");
    uProf = uProf.replace(/headerAvatar\.innerHTML = profile\.avatarIcon \|\| '🧑‍💼';/g, "headerAvatar.innerHTML = profile.avatarIcon || '<svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/></svg>';");
    fs.writeFileSync(uProfPath, uProf, 'utf8');
    console.log('✅ user-profile.js limpo.');
}
