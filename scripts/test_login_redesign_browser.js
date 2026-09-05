/**
 * Teste Automatizado de Redesenho da Tela de Login
 * Arquivo: scripts/test_login_redesign_browser.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3351;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\015ed507-beab-4db5-8587-c865a571a89c';
const SCREENSHOT_LOGIN = path.join(ARTIFACTS_DIR, 'login_redesign_final_verificado.png');

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
    console.log('[Test] Iniciando servidor de teste na porta', PORT);
    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const browserPath = edgePaths.find(p => fs.existsSync(p));
    if (!browserPath) throw new Error('Navegador não encontrado');

    const tempDir = path.join(ROOT_DIR, '.temp_edge_login_test');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const remotePort = 9230;
    console.log('[Test] Iniciando navegador headless...');
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

    if (!targets || targets.length === 0) throw new Error('Falha ao conectar ao Edge CDP');

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

        await wait(3500);

        // Inspecionar o estado da página de forma passiva (sem forçar estilos que possam esconder nós)
        const pageState = await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const ls = document.getElementById('login-screen');
                    const pills = Array.from(document.querySelectorAll('.role-pill')).map(p => p.textContent.trim());
                    const headline = document.querySelector('.login-headline')?.textContent.trim();
                    const chart = document.querySelector('.login-glass-chart') != null;
                    const prefeituraBadge = document.querySelector('.prefeitura-badge-container') != null;
                    const title = document.querySelector('.login-card-title')?.textContent.trim();
                    const submitBtn = document.getElementById('btn-login-submit')?.textContent.trim();

                    return {
                        hasLoginScreen: ls != null,
                        pills,
                        headline,
                        hasGlassChart: chart,
                        hasPrefeituraBadge: prefeituraBadge,
                        cardTitle: title,
                        submitBtnText: submitBtn
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('[Test] Estado da tela de login:', JSON.stringify(pageState.result.value, null, 2));

        // Testar seleção rápida do perfil "Diretor"
        console.log('[Test] Testando clique na pílula "Diretor"...');
        const clickResult = await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const directorBtn = Array.from(document.querySelectorAll('.role-pill'))
                        .find(b => b.textContent.includes('Diretor'));
                    if (directorBtn) {
                        directorBtn.click();
                        return {
                            clicked: true,
                            email: document.getElementById('login-email')?.value,
                            password: document.getElementById('login-password')?.value
                        };
                    }
                    return { clicked: false };
                })()
            `,
            returnByValue: true
        });
        console.log('[Test] Resultado da seleção rápida de perfil:', JSON.stringify(clickResult.result.value, null, 2));

        await wait(1200);

        // Capturar screenshot oficial da tela de login
        console.log('[Test] Capturando screenshot oficial do novo login...');
        const screenshotRes = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: false
        });

        fs.writeFileSync(SCREENSHOT_LOGIN, Buffer.from(screenshotRes.data, 'base64'));
        console.log('[Test] Screenshot gravado com sucesso em:', SCREENSHOT_LOGIN);

        cdp.close();
    } finally {
        browserProcess.kill();
        server.close();
        console.log('[Test] Finalizado com sucesso.');
    }
}

main().catch(err => {
    console.error('[Test Error]', err);
    process.exit(1);
});
