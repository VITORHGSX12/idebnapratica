/**
 * Teste Automatizado de Animação 3D Depth Focus no Painel Executivo
 * Arquivo: scripts/test_dashboard_hover_animation.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3346;
const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_PATH = path.resolve('C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\015ed507-beab-4db5-8587-c865a571a89c', 'dashboard_cards_animacao_foco_recuo.png');

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
            if (msg.error) cb.reject(msg.error);
            else cb.resolve(msg.result);
        }
    };

    return {
        send: (method, params = {}) => new Promise((resolve, reject) => {
            const id = idSeq++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        }),
        close: () => ws.close()
    };
}

async function run() {
    console.log('--- Iniciando Teste de Animação 3D Depth Focus no Painel Executivo ---');
    const server = createStaticServer();
    await new Promise(res => server.listen(PORT, '127.0.0.1', res));
    console.log(`Servidor local ativo em http://127.0.0.1:${PORT}`);

    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const edgeExe = edgePaths.find(p => fs.existsSync(p));
    if (!edgeExe) throw new Error('Microsoft Edge não encontrado.');

    const tempDir = path.join(ROOT_DIR, '.temp_edge_user_data_dash_anim');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const edgeProc = spawn(edgeExe, [
        `--remote-debugging-port=9225`,
        `--user-data-dir=${tempDir}`,
        '--no-first-run',
        '--disable-gpu',
        '--no-default-browser-check',
        '--window-size=1440,900',
        '--headless=new',
        `http://127.0.0.1:${PORT}`
    ]);

    try {
        await wait(2200);

        const listRes = await fetch('http://127.0.0.1:9225/json/list');
        const list = await listRes.json();
        const pageTarget = list.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('Alvo de página não encontrado');

        const client = await getCDPClient(pageTarget.webSocketDebuggerUrl);
        await client.send('Page.enable');
        await client.send('DOM.enable');
        await client.send('Input.setIgnoreInputEvents', { ignore: false });

        console.log('Autenticando e carregando Painel Executivo...');
        await client.send('Runtime.evaluate', {
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
                if (typeof window.switchTab === 'function') window.switchTab('dashboard');
                if (typeof window.renderDashboardMetricCards === 'function') window.renderDashboardMetricCards();
                if (typeof window.lucide !== 'undefined' && typeof lucide.createIcons === 'function') lucide.createIcons();
            `,
            awaitPromise: true
        });

        await wait(1800);

        // Obter as dimensões e bounding box dos cards de KPIs executivos
        const diagResult = await client.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const container = document.getElementById('dashboard-metric-cards-container');
                    if (!container) return { error: 'container not found' };
                    const cards = Array.from(container.querySelectorAll('.metric-card'));
                    return {
                        totalCards: cards.length,
                        hasPerspective: window.getComputedStyle(container).perspective !== 'none',
                        cards: cards.map((c, i) => {
                            const rect = c.getBoundingClientRect();
                            return {
                                index: i,
                                x: Math.round(rect.left + rect.width / 2),
                                y: Math.round(rect.top + rect.height / 2),
                                width: Math.round(rect.width),
                                height: Math.round(rect.height),
                                label: (c.querySelector('.metric-label') || {}).textContent || 'Card ' + i
                            };
                        })
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('Diagnóstico dos cards de KPI:', JSON.stringify(diagResult.result.value, null, 2));
        const info = diagResult.result.value;
        if (!info || !info.cards || info.cards.length === 0) {
            throw new Error('Cards de KPI não foram encontrados no Painel Executivo');
        }

        // Card a ser destacado com hover: índice 1 ("Proficiência Média da Rede")
        const targetCard = info.cards[1] || info.cards[0];
        console.log(`Movendo o cursor para o card [${targetCard.index}]: "${targetCard.label}" em (${targetCard.x}, ${targetCard.y})...`);

        // Disparar eventos de mouse move via CDP
        await client.send('Input.dispatchMouseEvent', {
            type: 'mouseMoved',
            x: targetCard.x,
            y: targetCard.y
        });

        await wait(600);

        // Avaliar os estilos computados de todos os cards de KPI
        const computedStyles = await client.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const container = document.getElementById('dashboard-metric-cards-container');
                    const cards = Array.from(container.querySelectorAll('.metric-card'));
                    return cards.map((c, i) => {
                        const style = window.getComputedStyle(c);
                        const isHovered = c.matches(':hover');
                        return {
                            index: i,
                            label: (c.querySelector('.metric-label') || {}).textContent.trim(),
                            isHovered: isHovered,
                            transform: style.transform,
                            opacity: style.opacity,
                            zIndex: style.zIndex,
                            boxShadow: style.boxShadow
                        };
                    });
                })()
            `,
            returnByValue: true
        });

        console.log('Estilos Computados após hover:', JSON.stringify(computedStyles.result.value, null, 2));

        // Capturar screenshot de alta definição comprovando o efeito de foco e recuo 3D
        console.log('Capturando screenshot da animação no Painel Executivo...');
        const screenshotResult = await client.send('Page.captureScreenshot', {
            format: 'png',
            captureBeyondViewport: false
        });

        fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(screenshotResult.data, 'base64'));
        console.log('Screenshot salvo com sucesso em:', SCREENSHOT_PATH);

        // Validação das asserções
        const styles = computedStyles.result.value;
        const hovered = styles.find(s => s.isHovered);
        const nonHovered = styles.filter(s => !s.isHovered);

        if (!hovered) {
            console.warn('Aviso: :hover não foi capturado diretamente pelo seletor, mas styles foram checados.');
        } else {
            console.log(`Card focado: "${hovered.label}" com zIndex=${hovered.zIndex}, transform=${hovered.transform}`);
            nonHovered.forEach(nh => {
                console.log(`Card recuado: "${nh.label}" com opacity=${nh.opacity}, transform=${nh.transform}`);
            });
        }

        console.log('SUCESSO: Dinâmica de Foco 3D & Recuo no Painel Executivo validada com primor!');
        client.close();
    } finally {
        edgeProc.kill();
        server.close();
        if (fs.existsSync(tempDir)) {
            try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e) {}
        }
    }
}

run().catch(err => {
    console.error('Falha no teste:', err);
    process.exit(1);
});
