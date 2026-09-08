const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8089;
const ROOT = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\a43b0565-56ad-4732-97a0-6687c6b9fce6';

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(ROOT, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Access-Control-Allow-Origin': '*'
        });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
    }
});

server.listen(PORT, '127.0.0.1', async () => {
    console.log(`[Test Server] Running on http://127.0.0.1:${PORT}`);
    
    // Find Edge or Chrome
    const browserPaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    ];
    let browserExe = browserPaths.find(p => fs.existsSync(p));
    if (!browserExe) {
        console.error('Browser not found');
        process.exit(1);
    }

    const DEBUG_PORT = 9245;
    const tempDir = path.join(ROOT, '.temp_edge_login_final');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const browser = spawn(browserExe, [
        `--remote-debugging-port=${DEBUG_PORT}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${tempDir}`
    ]);

    await new Promise(r => setTimeout(r, 2000));

    try {
        const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
        const targets = await targetsRes.json();
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
            throw new Error('Debug target not found');
        }

        const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
        await new Promise(resolve => ws.onopen = resolve);

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

        const send = (method, params = {}) => new Promise((resolve, reject) => {
            const id = idSeq++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });

        await send('Page.enable');
        await send('DOM.enable');
        await send('Runtime.enable');

        await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
        await new Promise(r => setTimeout(r, 1500));

        const captureView = async (width, height, filename) => {
            await send('Emulation.setDeviceMetricsOverride', {
                width,
                height,
                deviceScaleFactor: 1,
                mobile: false
            });
            await new Promise(r => setTimeout(r, 600));

            const screenshot = await send('Page.captureScreenshot', {
                format: 'png'
            });

            const buf = Buffer.from(screenshot.data, 'base64');
            const destBrain = path.join(ARTIFACTS_DIR, filename);
            const destLocal = path.join(ROOT, 'scripts', filename);
            fs.writeFileSync(destBrain, buf);
            fs.writeFileSync(destLocal, buf);
            console.log(`[Screenshot Saved] -> ${filename} (${width}x${height})`);
        };

        // 1. Desktop 1440x900
        await captureView(1440, 900, 'login_final_desktop_1440.png');
        
        // 2. Tablet 800x1024
        await captureView(800, 1024, 'login_final_tablet_800.png');

        // 3. Mobile 390x844
        await captureView(390, 844, 'login_final_mobile_390.png');

        ws.close();
        browser.kill();
        server.close();
        console.log('\n✨ Todos os screenshots finais foram capturados com perfeição!');
        process.exit(0);
    } catch (e) {
        console.error(e);
        browser.kill();
        server.close();
        process.exit(1);
    }
});
