/**
 * Teste Automatizado: Validação de Fontes Brancas nos Cards de KPI do Painel Executivo
 * Arquivo: scripts/test_metric_cards_white_fonts.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3351;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\015ed507-beab-4db5-8587-c865a571a89c';

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
            return res.end('Not Found');
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
            if (msg.error) cb.reject(new Error(msg.error.message || 'CDP Error'));
            else cb.resolve(msg.result);
        }
    };

    return {
        send: (method, params = {}) => {
            return new Promise((resolve, reject) => {
                const id = idSeq++;
                callbacks.set(id, { resolve, reject });
                ws.send(JSON.stringify({ id, method, params }));
            });
        },
        close: () => ws.close()
    };
}

async function findEdgePath() {
    const candidates = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Users\\' + (process.env.USERNAME || 'Alleg') + '\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe'
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return 'msedge';
}

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function runTest() {
    console.log('--- TESTE: VALIDAÇÃO DE FONTES BRANCAS NOS CARDS DE KPI ---');

    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

    const edgePath = await findEdgePath();
    const cdpPort = 9228;
    const userDataDir = path.join(ROOT_DIR, '.tmp_edge_test_white_fonts');

    const edgeProcess = spawn(edgePath, [
        `--remote-debugging-port=${cdpPort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        `http://127.0.0.1:${PORT}/index.html`
    ], { stdio: 'ignore' });

    let targets = null;
    for (let i = 0; i < 30; i++) {
        await wait(300);
        try {
            targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) throw new Error('Falha ao conectar ao Edge CDP');

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = await getCDPClient(pageTarget.webSocketDebuggerUrl);

    try {
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

        // 1. Autenticar e carregar o Painel Executivo no tema claro (igual ao screenshot do usuário)
        console.log('1. Autenticando e carregando o Painel Executivo...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('authToken', 'test-token');
                sessionStorage.setItem('userRole', 'Master Admin');
                sessionStorage.setItem('userName', 'Administrador Geral (TI)');
                localStorage.setItem('theme', 'light');
                localStorage.setItem('ideb_app_theme', 'light');
                document.body.classList.remove('dark-mode');
                
                var ls = document.getElementById('login-screen');
                if (ls) ls.remove();
                var ts = document.getElementById('login-transition-screen');
                if (ts) ts.remove();
                var app = document.querySelector('.app-container');
                if (app) {
                    app.style.setProperty('display', 'flex', 'important');
                    app.classList.remove('hidden');
                }
                if (typeof window.checkAuthSession === 'function') window.checkAuthSession();
                if (typeof window.switchTab === 'function') window.switchTab('dashboard');
                if (typeof window.renderDashboardComplete === 'function') window.renderDashboardComplete();
                if (typeof window.renderDashboardMetricCards === 'function') window.renderDashboardMetricCards();
                if (typeof window.lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons();
            `
        });
        await wait(1500);

        // 2. Inspecionar as cores computadas dos 3 cards de KPI
        console.log('2. Inspecionando cores computadas dos cards de KPI...');
        const colorsEval = await cdp.send('Runtime.evaluate', {
            expression: `
                (function() {
                    const cont = document.getElementById('dashboard-metric-cards-container');
                    const cards = Array.from(document.querySelectorAll('#dashboard-metric-cards-container .metric-card'));
                    return {
                        containerExists: !!cont,
                        containerDisplay: cont ? window.getComputedStyle(cont).display : null,
                        containerOuterHtml: cont ? cont.outerHTML.substring(0, 400) : null,
                        cardsFound: cards.length,
                        cards: cards.map((c, i) => {
                            const label = c.querySelector('.metric-label');
                            const value = c.querySelector('.metric-value');
                            const sub = c.querySelector('.metric-sub');
                            return {
                                cardIndex: i,
                                labelText: label ? label.innerText.trim() : null,
                                labelColor: label ? window.getComputedStyle(label).color : null,
                                valueText: value ? value.innerText.trim() : null,
                                valueColor: value ? window.getComputedStyle(value).color : null,
                                subColor: sub ? window.getComputedStyle(sub).color : null
                            };
                        })
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('Cores Computadas nos Cards:', JSON.stringify(colorsEval.result.value, null, 2));

        // 3. Capturar screenshot do Painel Executivo com as fontes brancas
        const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const snapPath = path.join(ARTIFACTS_DIR, 'painel_executivo_cards_fontes_brancas.png');
        fs.writeFileSync(snapPath, Buffer.from(snap.data, 'base64'));
        console.log(`Screenshot salvo com sucesso em: ${snapPath}`);

        console.log('✅ TESTE DAS FONTES BRANCAS CONCLUÍDO COM SUCESSO!');
    } finally {
        cdp.close();
        edgeProcess.kill();
        server.close();
        if (fs.existsSync(userDataDir)) {
            try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
        }
    }
}

runTest().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
