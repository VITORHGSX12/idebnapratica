const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function getHash(filePath) {
    if (!fs.existsSync(filePath)) return '1.0';
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

const indexHtmlPath = path.join(__dirname, 'index.html');
const appJsPath = path.join(__dirname, 'app.js');
const stylesCssPath = path.join(__dirname, 'styles.css');

if (fs.existsSync(indexHtmlPath)) {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const appHash = getHash(appJsPath);
    const cssHash = getHash(stylesCssPath);

    // Replace app.js reference (supports optional query version)
    indexHtml = indexHtml.replace(/src="app\.js(\?v=[a-f0-9.]+)"/g, `src="app.js?v=${appHash}"`);
    indexHtml = indexHtml.replace(/src="app\.js"/g, `src="app.js?v=${appHash}"`);
    
    // Replace styles.css reference (supports optional query version)
    indexHtml = indexHtml.replace(/href="styles\.css(\?v=[a-f0-9.]+)"/g, `href="styles.css?v=${cssHash}"`);
    indexHtml = indexHtml.replace(/href="styles\.css"/g, `href="styles.css?v=${cssHash}"`);

    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log(`[Cache-Buster] Complete! app.js?v=${appHash}, styles.css?v=${cssHash}`);
} else {
    console.error('[Cache-Buster] index.html not found!');
}
