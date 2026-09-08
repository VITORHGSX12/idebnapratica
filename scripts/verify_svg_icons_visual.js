const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(__dirname, '..', reqPath);
    if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found: ' + reqPath);
        return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fs.readFileSync(filePath));
});

server.listen(PORT, async () => {
    console.log('[Test] Server running on http://localhost:' + PORT);
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\949e6a03-e104-4aad-8205-a0bf96be5959';

    // 1. Check Login Page
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0' });
    
    // Ensure on login page
    await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
        if (typeof showLoginScreen === 'function') showLoginScreen();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_login_screen_svg.png') });
    console.log('[Test] Login screen screenshot saved.');

    // 2. Perform Login and Check Expanded Sidebar (Desktop)
    await page.evaluate(() => {
        if (typeof simulateSuccessfulLogin === 'function') {
            simulateSuccessfulLogin('admin@goncalvesdias.ma.gov.br');
        } else {
            localStorage.setItem('userEmail', 'admin@goncalvesdias.ma.gov.br');
            localStorage.setItem('isAuthenticated', 'true');
            if (typeof showAppContainer === 'function') showAppContainer();
        }
    });
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_sidebar_expanded_desktop.png') });
    console.log('[Test] Sidebar expanded desktop screenshot saved.');

    // 3. Check Collapsed Sidebar (Desktop)
    await page.evaluate(() => {
        if (typeof toggleSidebarCollapse === 'function') toggleSidebarCollapse();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_sidebar_collapsed_desktop.png') });
    console.log('[Test] Sidebar collapsed desktop screenshot saved.');

    // 4. Check Tablet View (768x1024)
    await page.setViewport({ width: 768, height: 1024 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_tablet_view.png') });
    console.log('[Test] Tablet view screenshot saved.');

    // 5. Check Mobile View (375x812)
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'verify_mobile_view.png') });
    console.log('[Test] Mobile view screenshot saved.');

    // 6. Check that all SVG icons exist and are rendered
    const iconsReport = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('img[src$=".svg"]')).map(img => ({
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            offsetWidth: img.offsetWidth,
            offsetHeight: img.offsetHeight,
            visible: img.offsetWidth > 0 && img.offsetHeight > 0
        }));
        return svgs;
    });

    console.log('[Test] Rendered SVG Icons Count:', iconsReport.length);
    console.log('[Test] Icons sample:', JSON.stringify(iconsReport.slice(0, 5), null, 2));
    console.log('[Test] Console errors:', consoleErrors.length);

    await browser.close();
    server.close();
    process.exit(0);
});
