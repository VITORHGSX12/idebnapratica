const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const serverPort = 3337;
const edgePort = 9346;
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(rootDir, reqPath);
    const ext = path.extname(filePath);
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
            });
        }).on('error', reject);
    });
}

class CdpClient {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.nextId = 1;
        this.callbacks = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws.onopen = () => resolve();
            this.ws.onerror = (e) => reject(e);
            this.ws.onmessage = (msg) => {
                const data = JSON.parse(msg.data);
                if (data.id && this.callbacks.has(data.id)) {
                    const cb = this.callbacks.get(data.id);
                    this.callbacks.delete(data.id);
                    cb(data.result);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve) => {
            const id = this.nextId++;
            this.callbacks.set(id, resolve);
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async eval(expr) {
        const res = await this.send('Runtime.evaluate', {
            expression: expr,
            returnByValue: true,
            awaitPromise: true
        });
        return res ? res.result ? res.result.value : null : null;
    }
}

async function run() {
    server.listen(serverPort);
    console.log(`Servidor local rodando em http://localhost:${serverPort}`);

    const edge = spawn(edgePath, [
        `--remote-debugging-port=${edgePort}`,
        '--headless',
        '--disable-gpu',
        '--window-size=1440,900',
        'about:blank'
    ]);

    await sleep(2000);
    const version = await getJson(`http://127.0.0.1:${edgePort}/json/version`);
    const cdp = new CdpClient(version.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Target.setDiscoverTargets', { discover: true });
    const target = await cdp.send('Target.createTarget', { url: `http://localhost:${serverPort}/index.html` });
    const pageWsUrl = `ws://127.0.0.1:${edgePort}/devtools/page/${target.targetId}`;
    const pageCdp = new CdpClient(pageWsUrl);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('DOM.enable');
    await sleep(2500);

    // Remove tela de login e força autenticação
    await pageCdp.eval(`
        (() => {
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userRole', 'Master Admin');
            sessionStorage.setItem('userEmail', 'admin@goncalvesdias.ma.gov.br');
            
            const ls = document.getElementById('login-screen');
            if (ls) ls.remove();
            const ts = document.getElementById('login-transition-screen');
            if (ts) ts.remove();
            const app = document.querySelector('.app-container');
            if (app) {
                app.style.setProperty('display', 'flex', 'important');
                app.classList.remove('hidden');
            }
            if (typeof window.checkAuthSession === 'function') window.checkAuthSession();
            if (typeof window.switchTab === 'function') window.switchTab('dashboard');
            if (typeof window.renderDashboardMetricCards === 'function') window.renderDashboardMetricCards();
        })()
    `);
    await sleep(2000);

    // 1. Auditoria Desktop
    const desktopAudit = await pageCdp.eval(`
        (() => {
            const h2 = document.querySelector('.top-navbar h2') || document.getElementById('page-title');
            const card1Val = document.querySelector('#dashboard-metric-cards-container .metric-card:nth-child(1) .metric-value');
            const card2Val = document.querySelector('#dashboard-metric-cards-container .metric-card:nth-child(2) .metric-value');
            const card3Val = document.querySelector('#dashboard-metric-cards-container .metric-card:nth-child(3) .metric-value');
            const bubble1 = document.querySelector('#dashboard-metric-cards-container .metric-card:nth-child(1) .metric-icon-bubble');

            return {
                headerTitleColor: h2 ? getComputedStyle(h2).color : null,
                card1ValueColor: card1Val ? getComputedStyle(card1Val).color : null,
                card2ValueColor: card2Val ? getComputedStyle(card2Val).color : null,
                card3ValueColor: card3Val ? getComputedStyle(card3Val).color : null,
                bubbleColor: bubble1 ? getComputedStyle(bubble1).color : null,
                bubbleBg: bubble1 ? getComputedStyle(bubble1).backgroundColor : null
            };
        })()
    `);
    console.log('AUDITORIA COMPUTADA (DESKTOP):', JSON.stringify(desktopAudit, null, 2));

    // Screenshot Desktop
    const shotDesktop = await pageCdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
            x: 272,
            y: 0,
            width: 1168,
            height: 600,
            scale: 1.5
        }
    });
    if (shotDesktop && shotDesktop.data) {
        fs.writeFileSync('scripts/etapa2_header_kpis_desktop.png', Buffer.from(shotDesktop.data, 'base64'));
        console.log('Screenshot Desktop salvo: scripts/etapa2_header_kpis_desktop.png');
    }

    // 2. Auditoria Mobile Viewport (390 x 844)
    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
    });
    await sleep(800);

    const shotMobile = await pageCdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
            x: 0,
            y: 0,
            width: 390,
            height: 750,
            scale: 1.5
        }
    });
    if (shotMobile && shotMobile.data) {
        fs.writeFileSync('scripts/etapa2_header_kpis_mobile.png', Buffer.from(shotMobile.data, 'base64'));
        console.log('Screenshot Mobile salvo: scripts/etapa2_header_kpis_mobile.png');
    }

    try { edge.kill(); } catch(e) {}
    server.close();
}

run().catch((e) => {
    console.error(e);
    try { server.close(); } catch(err) {}
});
