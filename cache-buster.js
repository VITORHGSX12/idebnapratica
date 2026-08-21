const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getHash(filePath) {
    if (!fs.existsSync(filePath)) return Date.now().toString(36);
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 10);
}

const indexHtmlPath = path.join(__dirname, 'index.html');
const appJsPath = path.join(__dirname, 'app.js');
const stylesCssPath = path.join(__dirname, 'styles.css');

if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const timestamp = Date.now().toString(36);
    const appHash = getHash(appJsPath) + '_' + timestamp;
    const cssHash = getHash(stylesCssPath) + '_' + timestamp;

    // Replace all script tags and css tags with fresh hash
    indexHtml = indexHtml.replace(/src="app\.js(\?[^"]*)?"/g, `src="app.js?v=${appHash}"`);
    indexHtml = indexHtml.replace(/href="styles\.css(\?[^"]*)?"/g, `href="styles.css?v=${cssHash}"`);
    
    // Also update other JS databases and modular scripts
    const jsFiles = [
        'ideb_maranhao_oficial_2015_2025.js', 
        'escolas_maranhao_oficial_2015_2025.js', 
        'matriz_descritores_excel_oficial.js', 
        'ideb_publico_db.js', 
        'alunos_db.js', 
        'js/core/helpers.js',
        'js/core/theme-toast.js',
        'js/core/user-profile.js',
        'js/core/auth.js',
        'js/core/navigation.js',
        'js/modules/escolas/escolas.js'
    ];
    jsFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        const fileHash = getHash(filePath) + '_' + timestamp;
        const regex = new RegExp(`src="${file.replace(/\//g, '\\/')}(\\?[^"]*)?"`, 'g');
        indexHtml = indexHtml.replace(regex, `src="${file}?v=${fileHash}"`);
    });

    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log(`[Cache-Buster] Complete! app.js?v=${appHash}, styles.css?v=${cssHash}`);
} else {
    console.error('[Cache-Buster] index.html not found!');
}
