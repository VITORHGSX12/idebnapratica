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

    // Update app.js and styles.css
    indexHtml = indexHtml.replace(/src="app\.js(\?[^"]*)?"/g, `src="app.js?v=${appHash}"`);
    indexHtml = indexHtml.replace(/href="styles\.css(\?[^"]*)?"/g, `href="styles.css?v=${cssHash}"`);

    // Dynamically match all local script tags src="...js"
    indexHtml = indexHtml.replace(/src="([^"]+\.js)(\?[^"]*)?"/g, (match, scriptPath) => {
        if (scriptPath === 'app.js' || scriptPath.startsWith('http://') || scriptPath.startsWith('https://')) {
            return match;
        }
        const fullLocalPath = path.join(__dirname, scriptPath);
        const scriptHash = getHash(fullLocalPath) + '_' + timestamp;
        return `src="${scriptPath}?v=${scriptHash}"`;
    });

    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    console.log(`[Cache-Buster] Complete! Updated all modular JS scripts, app.js (${appHash}) and styles.css (${cssHash})`);
} else {
    console.error('[Cache-Buster] index.html not found!');
}
