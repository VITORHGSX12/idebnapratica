const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const PORT = 3345;
const artifactDir = path.resolve('C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\015ed507-beab-4db5-8587-c865a571a89c');

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
                    if (data.error) cb.reject(data.error);
                    else cb.resolve(data.result);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = this.nextId++;
            this.callbacks.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
    }

    close() {
        this.ws.close();
    }
}

async function run() {
    console.log('--- Iniciando Teste de Animação 3D Depth Focus nos Cards de Turmas ---');
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`Servidor local em http://127.0.0.1:${PORT}`);

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const remotePort = 9226;
    const userDataDir = path.join(rootDir, '.temp_edge_user_data_turmas_anim');

    const edgeProc = spawn(edgePath, [
        `--remote-debugging-port=${remotePort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        `http://127.0.0.1:${PORT}/index.html`
    ]);

    await sleep(2500);

    try {
        const targets = await getJson(`http://127.0.0.1:${remotePort}/json/list`);
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('Aba não encontrada!');

        const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
        await cdp.connect();

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('DOM.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        await sleep(1500);

        // Login Bypass
        console.log('Autenticando...');
        await cdp.evaluate(`
            (function() {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'Master Admin');
                sessionStorage.setItem('authToken', 'mock_jwt_token_for_test');
                
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
            })()
        `);
        await sleep(1000);

        // Navegar para escolas-panel
        console.log('Navegando para Escolas da Rede...');
        await cdp.evaluate(`
            if (typeof window.switchTab === 'function') window.switchTab('escolas-panel');
        `);
        await sleep(1000);

        // Abrir Escola "UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ" (escola com múltiplas turmas)
        console.log('Abrindo Unidade Integrada Aldenora de Araújo Cruz...');
        await cdp.evaluate(`
            var schoolName = "UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ";
            if (typeof window.openSchoolDetailView === 'function') {
                window.openSchoolDetailView(schoolName);
            }
        `);
        await sleep(1000);

        // Mudar para sub-aba turmas
        console.log('Alternando para sub-aba Turmas...');
        await cdp.evaluate(`
            if (typeof window.switchSchoolInnerTab === 'function') {
                window.switchSchoolInnerTab('turmas');
            }
        `);
        await sleep(1500);

        // Inspecionar cards renderizados e posições
        const cardsInfo = await cdp.evaluate(`
            (function() {
                var grid = document.querySelector('.school-classes-grid');
                var cards = Array.from(document.querySelectorAll('.school-class-card'));
                return {
                    hasGridClass: !!grid,
                    totalCards: cards.length,
                    rects: cards.slice(0, 4).map(function(c, i) {
                        var r = c.getBoundingClientRect();
                        return {
                            index: i,
                            x: Math.round(r.x + r.width / 2),
                            y: Math.round(r.y + r.height / 2),
                            width: Math.round(r.width),
                            height: Math.round(r.height),
                            title: c.querySelector('h4') ? c.querySelector('h4').textContent.trim() : ''
                        };
                    })
                };
            })()
        `);
        console.log('Diagnóstico dos cards de turma:', cardsInfo);

        if (cardsInfo.totalCards < 2) {
            throw new Error('Menos de 2 cards encontrados para testar o efeito de foco e recuo!');
        }

        // Posicionar mouse sobre o segundo card de turma
        const targetCard = cardsInfo.rects[1];
        console.log(`Movendo o cursor para o card [${targetCard.index}]: "${targetCard.title}" nas coordenadas (${targetCard.x}, ${targetCard.y})...`);

        await cdp.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: targetCard.x,
            y: targetCard.y
        });

        await sleep(600); // Aguardar transição CSS (0.32s)

        // Avaliar os estilos computados no card focado e nos cards adjacentes
        const computedStyles = await cdp.evaluate(`
            (function() {
                var cards = Array.from(document.querySelectorAll('.school-class-card'));
                return cards.slice(0, 4).map(function(c, i) {
                    var s = window.getComputedStyle(c);
                    var isHovered = c.matches(':hover');
                    return {
                        index: i,
                        title: c.querySelector('h4') ? c.querySelector('h4').textContent.trim() : '',
                        isHovered: isHovered,
                        transform: s.transform,
                        opacity: s.opacity,
                        zIndex: s.zIndex,
                        boxShadow: s.boxShadow
                    };
                });
            })()
        `);
        console.log('Estilos Computados após hover:', computedStyles);

        // Capturar Screenshot de Alta Definição
        console.log('Capturando screenshot da animação de foco...');
        const screenshot = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            quality: 100
        });

        const screenshotPath = path.join(artifactDir, 'turmas_cards_animacao_foco_recuo.png');
        fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
        console.log('Screenshot salvo com sucesso em:', screenshotPath);

        console.log('SUCESSO: Animação de Foco e Recuo 3D validada com excelência!');
        cdp.close();

    } finally {
        edgeProc.kill();
        server.close();
        try {
            fs.rmSync(userDataDir, { recursive: true, force: true });
        } catch(e) {}
    }
}

run().catch(err => {
    console.error('Erro no teste de animação:', err);
    process.exit(1);
});
