const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3355;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\a43b0565-56ad-4732-97a0-6687c6b9fce6\\screenshots';
if (!fs.existsSync(ARTIFACTS_DIR)) {
    fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
}

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
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
        const filePath = path.join(ROOT_DIR, reqPath);
        const ext = path.extname(filePath).toLowerCase();

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
                return;
            }
            res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
            res.end(data);
        });
    });
}

function connectCDP(wsUrl) {
    const WebSocket = require('ws');
    const ws = new WebSocket(wsUrl);
    let idSeq = 1;
    const callbacks = new Map();

    ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (callbacks.has(msg.id)) {
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

    return new Promise((resolve) => {
        ws.onopen = () => resolve({ send, close: () => ws.close() });
    });
}

async function captureScreenshots() {
    console.log('Iniciando captura de screenshots dos topos padronizados...');
    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const browserPath = edgePaths.find(p => fs.existsSync(p));
    if (!browserPath) throw new Error('Navegador não encontrado');

    const remoteDebuggingPort = 9235;
    const proc = spawn(browserPath, [
        '--headless',
        '--disable-gpu',
        `--remote-debugging-port=${remoteDebuggingPort}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1440,900',
        `http://127.0.0.1:${PORT}/index.html`
    ]);

    await new Promise(r => setTimeout(r, 2000));

    let jsonTarget;
    for (let i = 0; i < 20; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${remoteDebuggingPort}/json`);
            const targets = await res.json();
            jsonTarget = targets.find(t => t.type === 'page');
            if (jsonTarget) break;
        } catch (e) {
            await new Promise(r => setTimeout(r, 300));
        }
    }

    if (!jsonTarget) throw new Error('Falha ao obter alvo de depuração');
    const cdp = await connectCDP(jsonTarget.webSocketDebuggerUrl);

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
    });

    // Login Gestor
    await cdp.send('Runtime.evaluate', {
        expression: `
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userRole', 'Gestor da Rede');
            localStorage.setItem('userRole', 'Gestor da Rede');
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            if (typeof initApp === 'function') initApp();
            if (typeof renderDashboardWelcomeBanner === 'function') renderDashboardWelcomeBanner();
        `
    });
    await new Promise(r => setTimeout(r, 1000));

    const tabsToCapture = [
        { id: 'escolas-panel', filename: 'tab_header_01_escolas.png' },
        { id: 'alunos-panel', filename: 'tab_header_02_alunos.png' },
        { id: 'metas-ideb', filename: 'tab_header_03_metas.png' },
        { id: 'cronograma-habilidades', filename: 'tab_header_04_cronograma.png' },
        { id: 'biblioteca-recursos', filename: 'tab_header_05_biblioteca.png' },
        { id: 'admin-panel', filename: 'tab_header_06_admin.png' }
    ];

    for (const tab of tabsToCapture) {
        await cdp.send('Runtime.evaluate', {
            expression: `
                document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
                const activeEl = document.getElementById('${tab.id}');
                if (activeEl) activeEl.classList.remove('hidden');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            `
        });
        await new Promise(r => setTimeout(r, 600));

        const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const filePath = path.join(ARTIFACTS_DIR, tab.filename);
        fs.writeFileSync(filePath, Buffer.from(shot.data, 'base64'));
        console.log(`[OK] Gravado: ${tab.filename}`);
    }

    cdp.close();
    proc.kill();
    server.close();
    console.log('Finalizado com sucesso!');
}

captureScreenshots().catch(console.error);
