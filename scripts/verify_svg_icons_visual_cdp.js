const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3362;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\949e6a03-e104-4aad-8205-a0bf96be5959';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function createStaticServer() {
    return http.createServer((req, res) => {
        let cleanUrl = req.url.split('?')[0];
        if (cleanUrl === '/') cleanUrl = '/index.html';
        const filePath = path.join(ROOT_DIR, cleanUrl);

        if (!fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('Not Found: ' + cleanUrl);
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCDPClient(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = err => reject(err);
    });

    let idSeq = 1;
    const callbacks = new Map();

    ws.onmessage = event => {
        const msg = JSON.parse(event.data);
        if (msg.id && callbacks.has(msg.id)) {
            const cb = callbacks.get(msg.id);
            callbacks.delete(msg.id);
            if (msg.error) cb.reject(new Error(msg.error.message));
            else cb.resolve(msg.result);
        }
    };

    function send(method, params = {}) {
        const id = idSeq++;
        return new Promise((resolve, reject) => {
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    return { send, close: () => ws.close() };
}

function findBrowserBinary() {
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('Nenhum navegador Chrome ou Edge encontrado.');
}

async function main() {
    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
    console.log(`[Visual Test] Servidor rodando em http://127.0.0.1:${PORT}`);

    const chromePath = findBrowserBinary();
    const tempDir = path.join(ROOT_DIR, '.temp_visual_verify');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const remotePort = 9235;
    const chromeProcess = spawn(chromePath, [
        '--headless=new',
        `--remote-debugging-port=${remotePort}`,
        `--user-data-dir=${tempDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        '--window-size=1440,900',
        `http://127.0.0.1:${PORT}/index.html`
    ]);

    let targets = null;
    for (let i = 0; i < 30; i++) {
        await wait(300);
        try {
            const res = await fetch(`http://127.0.0.1:${remotePort}/json/list`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) throw new Error('Falha ao conectar ao CDP');

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = await getCDPClient(pageTarget.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
    });

    await wait(2000);

    // 1. Screenshot da Tela de Login com login.svg
    const loginShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verify_login_svg_pack.png'), Buffer.from(loginShot.data, 'base64'));
    console.log('✓ Screenshot da tela de Login com login.svg salvo.');

    // 2. Fazer Login e capturar Sidebar Expandida com todos os novos SVGs
    await cdp.send('Runtime.evaluate', {
        expression: `
            (function() {
                localStorage.setItem('userEmail', 'admin@goncalvesdias.ma.gov.br');
                localStorage.setItem('isAuthenticated', 'true');
                if (typeof showAppContainer === 'function') {
                    showAppContainer();
                } else {
                    document.getElementById('login-screen').classList.add('hidden');
                    document.getElementById('app-container').classList.remove('hidden');
                }
                if (typeof switchTab === 'function') switchTab('dashboard');
            })()
        `
    });
    await wait(1500);

    const expandedShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verify_sidebar_expanded_svg.png'), Buffer.from(expandedShot.data, 'base64'));
    console.log('✓ Screenshot da Sidebar Expandida com novos SVGs salvo.');

    // 3. Recolher a Sidebar e capturar
    await cdp.send('Runtime.evaluate', {
        expression: `if (typeof toggleSidebarCollapse === 'function') toggleSidebarCollapse();`
    });
    await wait(1000);

    const collapsedShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verify_sidebar_collapsed_svg.png'), Buffer.from(collapsedShot.data, 'base64'));
    console.log('✓ Screenshot da Sidebar Recolhida (Collapsed) salvo.');

    // 4. Mobile View (375x812)
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        mobile: true
    });
    await wait(800);
    const mobileShot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACTS_DIR, 'verify_mobile_view_svg.png'), Buffer.from(mobileShot.data, 'base64'));
    console.log('✓ Screenshot do Mobile View salvo.');

    // 5. Auditar carregamento de todos os SVGs na página
    const svgAuditRes = await cdp.send('Runtime.evaluate', {
        expression: `
            (function() {
                var icons = Array.from(document.querySelectorAll('img[src*=".svg"]')).map(function(img) {
                    return {
                        src: img.getAttribute('src'),
                        naturalWidth: img.naturalWidth,
                        naturalHeight: img.naturalHeight,
                        loaded: img.complete && img.naturalWidth > 0
                    };
                });
                return JSON.stringify(icons);
            })()
        `,
        returnByValue: true
    });

    const svgs = JSON.parse(svgAuditRes.result.value);
    console.log(`\n====================================================`);
    console.log(`📊 AUDITORIA VISUAL DE SVGS RENDERIZADOS (${svgs.length} encontrados):`);
    let allOk = true;
    svgs.forEach(s => {
        const ok = s.loaded;
        if (!ok) allOk = false;
        console.log(`   ${ok ? '✓' : '✗'} [${s.src}] (Tam: ${s.naturalWidth}x${s.naturalHeight})`);
    });
    console.log(`====================================================`);
    console.log(`Status de Carregamento dos SVGs: ${allOk ? '100% SUCESSO' : 'FALHA'}`);

    cdp.close();
    chromeProcess.kill();
    server.close();

    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}

    process.exit(0);
}

main().catch(err => {
    console.error('Erro na auditoria visual:', err);
    process.exit(1);
});
