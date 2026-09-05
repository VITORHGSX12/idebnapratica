/**
 * Teste Automatizado da Sub-Aba e Simulador do Manual de Cálculo IDEB & VAAR (Edge Headless CDP)
 * Arquivo: scripts/test_manual_calculo_ideb_browser.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3349;
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
            if (msg.error) {
                cb.reject(new Error(msg.error.message || 'CDP Error'));
            } else {
                cb.resolve(msg.result);
            }
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
    console.log('--- TESTE: MANUAL DE CÁLCULO IDEB & VAAR NO BROWSER ---');

    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

    const edgePath = await findEdgePath();
    const cdpPort = 9226;
    const userDataDir = path.join(ROOT_DIR, '.tmp_edge_test_manual_ideb');

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
            height: 1100,
            deviceScaleFactor: 1,
            mobile: false
        });

        await wait(2500);

        // 1. Autenticar e abrir Comparativo Regional
        console.log('1. Autenticando e abrindo Comparativo Regional...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('authToken', 'test-token');
                sessionStorage.setItem('userRole', 'Master Admin');
                sessionStorage.setItem('userName', 'Gestor da Rede');
                
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
                if (typeof window.switchTab === 'function') window.switchTab('ideb-comparativo');
            `
        });
        await wait(800);

        // 1b. Ativar a sub-aba do manual
        console.log('1b. Abrindo sub-aba Manual de Cálculo IDEB & VAAR...');
        const subtabDiag = await cdp.send('Runtime.evaluate', {
            expression: `
                (function() {
                    if (typeof window.switchIdebSubtab === 'function') {
                        window.switchIdebSubtab('manual-calculo-ideb');
                    }
                    var el = document.getElementById('tab-ideb-manual-calculo-ideb');
                    return {
                        exists: !!el,
                        display: el ? el.style.display : null,
                        classes: el ? Array.from(el.classList) : [],
                        btnClasses: Array.from(document.querySelector('button[data-tab="manual-calculo-ideb"]')?.classList || [])
                    };
                })()
            `,
            returnByValue: true
        });
        console.log('Diagnóstico da sub-aba:', subtabDiag.result.value);
        await wait(800);

        // 2. Auditar elementos e valores iniciais
        console.log('2. Auditando cálculos iniciais do simulador...');
        const evalInitial = await cdp.send('Runtime.evaluate', {
            expression: `
                (function() {
                    return {
                        ideb: document.getElementById('sim-out-ideb')?.innerText?.trim(),
                        ind: document.getElementById('sim-out-ind')?.innerText?.trim(),
                        iad: document.getElementById('sim-out-iad')?.innerText?.trim(),
                        inad: document.getElementById('sim-out-inad')?.innerText?.trim(),
                        status: document.getElementById('sim-out-status-vaar')?.innerText?.trim(),
                        visible: !document.getElementById('tab-ideb-manual-calculo-ideb')?.classList.contains('hidden')
                    };
                })()
            `,
            returnByValue: true
        });
        console.log('Valores Iniciais:', evalInitial.result.value);

        // 3. Simular alteração dinâmica de valores (ajuste de proficiência e aprovação)
        console.log('3. Simulando ajuste de indicadores...');
        const evalAfterChange = await cdp.send('Runtime.evaluate', {
            expression: `
                (function() {
                    var lp = document.getElementById('sim-saeb-lp');
                    var mat = document.getElementById('sim-saeb-mat');
                    var tap = document.getElementById('sim-tap');
                    if (lp) lp.value = 220;
                    if (mat) mat.value = 230;
                    if (tap) tap.value = 98;
                    if (typeof window.updateIdebVaarSimulator === 'function') window.updateIdebVaarSimulator();
                    return {
                        novoIdeb: document.getElementById('sim-out-ideb')?.innerText?.trim(),
                        novoInd: document.getElementById('sim-out-ind')?.innerText?.trim(),
                        novoIad: document.getElementById('sim-out-iad')?.innerText?.trim(),
                        novoInad: document.getElementById('sim-out-inad')?.innerText?.trim(),
                        status: document.getElementById('sim-out-status-vaar')?.innerText?.trim()
                    };
                })()
            `,
            returnByValue: true
        });
        console.log('Valores após simulação:', evalAfterChange.result.value);

        // 4. Capturar screenshot do topo do manual
        const snap = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const snapPath = path.join(ARTIFACTS_DIR, 'manual_calculo_ideb_vaar_simulador.png');
        fs.writeFileSync(snapPath, Buffer.from(snap.data, 'base64'));
        console.log(`Screenshot do topo salvo com sucesso em: ${snapPath}`);

        // 5. Rolar a área de conteúdo para o simulador e tabela e capturar novo screenshot
        await cdp.send('Runtime.evaluate', {
            expression: `
                var target = document.getElementById('ideb-vaar-simulator-card') || document.querySelector('#tab-ideb-manual-calculo-ideb table');
                if (target) target.scrollIntoView({ behavior: 'instant', block: 'start' });
            `
        });
        await wait(600);
        const snapSim = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const snapSimPath = path.join(ARTIFACTS_DIR, 'manual_calculo_ideb_vaar_simulador_interativo.png');
        fs.writeFileSync(snapSimPath, Buffer.from(snapSim.data, 'base64'));
        console.log(`Screenshot do simulador salvo com sucesso em: ${snapSimPath}`);

        console.log('✅ TESTE DO MANUAL E SIMULADOR CONCLUÍDO COM SUCESSO!');
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
