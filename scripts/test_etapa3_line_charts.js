const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const PORT = 3338;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
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

    close() {
        this.ws.close();
    }
}

async function run() {
    server.listen(PORT);
    console.log(`Servidor local rodando em http://localhost:${PORT}`);

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const cdpPort = 9223;
    const userDataDir = path.join(rootDir, '.temp_edge_etapa3');

    const edgeProc = spawn(edgePath, [
        `--remote-debugging-port=${cdpPort}`,
        `--user-data-dir=${userDataDir}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `http://localhost:${PORT}/index.html`
    ]);

    await sleep(2500);

    let targets;
    for (let i = 0; i < 10; i++) {
        try {
            targets = await getJson(`http://localhost:${cdpPort}/json`);
            if (targets && targets.length > 0) break;
        } catch(e) {}
        await sleep(500);
    }

    const pageTarget = targets.find(t => t.type === 'page');
    if (!pageTarget) throw new Error('Alvo de página não encontrado no Edge CDP');

    const pageCdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
    await pageCdp.connect();
    await pageCdp.send('Page.enable');
    await pageCdp.send('DOM.enable');
    await pageCdp.send('CSS.enable');

    await pageCdp.send('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
    });

    await sleep(1500);

    // Login & Navegação
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
            if (typeof window.renderDashboardComplete === 'function') window.renderDashboardComplete();
        })()
    `);
    await sleep(2500);

    // Auditoria dos Gráficos de Linha
    const lineAudit = await pageCdp.eval(`
        (() => {
            const obsLine = document.querySelector('.trajectory-observed-line');
            const metaLine = document.querySelector('.trajectory-meta-line');
            const legendSolid = document.querySelector('.ideb-trajectory-chart-legend .legend-line.solid');
            const legendDashed = document.querySelector('.ideb-trajectory-chart-legend .legend-line.dashed');

            let gdChartData = null;
            if (window.dashChartInstances && window.dashChartInstances.getGoncalvesDias()) {
                const c = window.dashChartInstances.getGoncalvesDias();
                gdChartData = c.data.datasets.map(ds => ({
                    label: ds.label,
                    borderColor: ds.borderColor,
                    borderDash: ds.borderDash || null,
                    fill: ds.fill
                }));
            }

            let compChartData = null;
            if (window.dashChartInstances && window.dashChartInstances.getComparativo()) {
                const c = window.dashChartInstances.getComparativo();
                compChartData = c.data.datasets.map(ds => ({
                    label: ds.label,
                    borderColor: ds.borderColor,
                    borderDash: ds.borderDash || null,
                    fill: ds.fill
                }));
            }

            return {
                trajectoryObservedStroke: obsLine ? getComputedStyle(obsLine).stroke : null,
                trajectoryMetaStroke: metaLine ? getComputedStyle(metaLine).stroke : null,
                trajectoryLegendSolidBg: legendSolid ? getComputedStyle(legendSolid).backgroundColor : null,
                trajectoryLegendDashedBorder: legendDashed ? getComputedStyle(legendDashed).borderTopColor : null,
                gdDatasets: gdChartData,
                compDatasets: compChartData
            };
        })()
    `);
    console.log('AUDITORIA DE LINHAS (ETAPA 3):', JSON.stringify(lineAudit, null, 2));

    // Screenshot da Trajetória PDE
    const shotTraj = await pageCdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
            x: 272,
            y: 190,
            width: 1168,
            height: 380,
            scale: 1.5
        }
    });
    if (shotTraj && shotTraj.data) {
        fs.writeFileSync('scripts/etapa3_trajetoria_pde.png', Buffer.from(shotTraj.data, 'base64'));
        console.log('Screenshot Trajetoria PDE salvo: scripts/etapa3_trajetoria_pde.png');
    }

    // Scroll até os gráficos de série temporal e captura de screenshot
    await pageCdp.eval(`
        (() => {
            const el = document.getElementById('dashChartGoncalvesDias');
            if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
    `);
    await sleep(1000);

    const shotCharts = await pageCdp.send('Page.captureScreenshot', {
        format: 'png',
        clip: {
            x: 272,
            y: 350,
            width: 1168,
            height: 480,
            scale: 1.5
        }
    });
    if (shotCharts && shotCharts.data) {
        fs.writeFileSync('scripts/etapa3_line_charts_historico.png', Buffer.from(shotCharts.data, 'base64'));
        console.log('Screenshot Gráficos Históricos salvo: scripts/etapa3_line_charts_historico.png');
    }

    pageCdp.close();
    edgeProc.kill();
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e) {}
    console.log('Etapa 3 Teste concluído!');
    process.exit(0);
}

run().catch(err => {
    console.error('Erro na auditoria Etapa 3:', err);
    process.exit(1);
});
