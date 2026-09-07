/**
 * Teste Visual e Alinhamento Óptico da Sidebar Recolhida (Collapsed Mode)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3353;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\949e6a03-e104-4aad-8205-a0bf96be5959';
const SCREENSHOT_SIDEBAR = path.join(ARTIFACTS_DIR, 'sidebar_collapsed_centered_verified.png');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
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
            if (msg.error) cb.reject(msg.error);
            else cb.resolve(msg.result);
        }
    };

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = idSeq++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    return { send, close: () => ws.close() };
}

async function main() {
    console.log('[Test] Iniciando servidor na porta', PORT);
    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const browserPath = edgePaths.find(p => fs.existsSync(p));
    if (!browserPath) throw new Error('Navegador não encontrado');

    const tempDir = path.join(ROOT_DIR, '.temp_edge_sidebar_test');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const remotePort = 9233;
    const browserProcess = spawn(browserPath, [
        `--remote-debugging-port=${remotePort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${tempDir}`,
        `http://127.0.0.1:${PORT}/index.html`
    ], { stdio: 'ignore' });

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

    try {
        const pageTarget = targets.find(t => t.type === 'page') || targets[0];
        const cdp = await getCDPClient(pageTarget.webSocketDebuggerUrl);

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('DOM.enable');

        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        await wait(2000);

        // 1. Logar no sistema e recolher a sidebar
        await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const loginScreen = document.getElementById('login-screen');
                    const appContainer = document.querySelector('.app-container');
                    if (loginScreen) loginScreen.style.display = 'none';
                    if (appContainer) appContainer.style.display = 'flex';
                    document.body.classList.add('collapsed-sidebar');
                })()
            `
        });

        await wait(800);

        // 2. Medir alinhamento óptico
        const alignmentReport = await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const sidebar = document.querySelector('.sidebar');
                    const sidebarRect = sidebar.getBoundingClientRect();
                    const sidebarCenter = sidebarRect.left + sidebarRect.width / 2;

                    const activeItem = document.querySelector('.menu-item.active');
                    const activeRect = activeItem ? activeItem.getBoundingClientRect() : null;
                    const activeCenter = activeRect ? (activeRect.left + activeRect.width / 2) : null;

                    const searchBox = document.querySelector('.sidebar-search-box');
                    const searchRect = searchBox ? searchBox.getBoundingClientRect() : null;
                    const searchCenter = searchRect ? (searchRect.left + searchRect.width / 2) : null;

                    const collapseBtn = document.querySelector('.sidebar-collapse-btn');
                    const collapseRect = collapseBtn ? collapseBtn.getBoundingClientRect() : null;
                    const collapseCenter = collapseRect ? (collapseRect.left + collapseRect.width / 2) : null;

                    const allItems = Array.from(document.querySelectorAll('.menu-item')).map(item => {
                        const r = item.getBoundingClientRect();
                        const icon = item.querySelector('i, svg');
                        const iconR = icon ? icon.getBoundingClientRect() : null;
                        return {
                            id: item.getAttribute('data-target') || item.textContent.trim(),
                            itemWidth: r.width,
                            itemHeight: r.height,
                            itemCenter: r.left + r.width / 2,
                            iconCenter: iconR ? (iconR.left + iconR.width / 2) : null,
                            iconOffsetFromItemCenter: iconR ? Math.abs((r.left + r.width / 2) - (iconR.left + iconR.width / 2)) : null
                        };
                    });

                    return {
                        sidebarWidth: sidebarRect.width,
                        sidebarCenter,
                        activeCenter,
                        activeItemDeltaFromSidebar: activeCenter ? (activeCenter - sidebarCenter) : null,
                        searchCenter,
                        searchDeltaFromSidebar: searchCenter ? (searchCenter - sidebarCenter) : null,
                        collapseCenter,
                        collapseDeltaFromSidebar: collapseCenter ? (collapseCenter - sidebarCenter) : null,
                        itemsSample: allItems.slice(0, 5)
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('[Test] Relatório de Alinhamento Óptico:', JSON.stringify(alignmentReport.result.value, null, 2));

        // 3. Capturar screenshot focado na sidebar
        const screenshotRes = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            clip: {
                x: 0,
                y: 0,
                width: 140,
                height: 900,
                scale: 1
            }
        });

        fs.writeFileSync(SCREENSHOT_SIDEBAR, Buffer.from(screenshotRes.data, 'base64'));
        console.log('[Test] Screenshot da sidebar recolhida salvo em:', SCREENSHOT_SIDEBAR);

        cdp.close();
    } finally {
        browserProcess.kill();
        server.close();
        try {
            if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        } catch(e) {}
    }
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
