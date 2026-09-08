/**
 * GESTÃO EDUCACIONAL SAAS — FASE 0: INSPEÇÃO PROFUNDA DE COMPONENTES RESPONSIVOS
 * 
 * Inspeciona:
 * 1. Topbar / Header (Barra de busca, seletor de escola, sino de notificações, perfil do usuário).
 * 2. Mobile Sidebar & Backdrop (Botão hambúrguer, transição de gaveta drawer).
 * 3. Cards KPIs e Gráficos (Grid layout 1 col mobile vs 2 col tablet vs 4 col desktop).
 * 4. Modais do Sistema (Responsividade de formulários em modais).
 * 5. Tabelas e Ações em Linha.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8093;
const ROOT_DIR = path.resolve(__dirname, '..');
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
    const filePath = path.join(ROOT_DIR, reqPath);

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
    console.log(`[Inspection Server] Ativo em http://127.0.0.1:${PORT}`);

    const browserExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const DEBUG_PORT = 9265;
    const tempDir = path.join(ROOT_DIR, '.temp_edge_resp_depth');
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
        const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
        await new Promise(r => ws.onopen = r);

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

        // Entrar no sistema / Mostrar app-container
        await send('Runtime.evaluate', {
            expression: `
                (() => {
                    const loginScreen = document.getElementById('login-screen');
                    const appContainer = document.getElementById('app-container');
                    const transitionScreen = document.getElementById('login-transition-screen');
                    if (loginScreen) {
                        loginScreen.style.display = 'none';
                        loginScreen.classList.add('hidden');
                    }
                    if (transitionScreen) {
                        transitionScreen.style.display = 'none';
                        transitionScreen.classList.add('hidden');
                    }
                    if (appContainer) {
                        appContainer.style.display = 'flex';
                        appContainer.classList.remove('hidden');
                    }
                    localStorage.setItem('userEmail', 'admin@goncalvesdias.ma.gov.br');
                    localStorage.setItem('userRole', 'gestor');
                    if (window.Router && window.Router.navigate) {
                        window.Router.navigate('dashboard');
                    }
                })()
            `
        });
        await new Promise(r => setTimeout(r, 1500));

        const captureComponentScreenshot = async (width, height, filename) => {
            await send('Emulation.setDeviceMetricsOverride', {
                width,
                height,
                deviceScaleFactor: 1,
                mobile: width < 600
            });
            await new Promise(r => setTimeout(r, 500));
            const ss = await send('Page.captureScreenshot', { format: 'png' });
            const buf = Buffer.from(ss.data, 'base64');
            fs.writeFileSync(path.join(ARTIFACTS_DIR, filename), buf);
            console.log(`[Screenshot Capturado] ${filename} (${width}x${height})`);
        };

        // Captura Dashboard em múltiplos breakpoints
        await captureComponentScreenshot(1440, 900, 'resp_dashboard_desktop_1440.png');
        await captureComponentScreenshot(1024, 768, 'resp_dashboard_tablet_landscape_1024.png');
        await captureComponentScreenshot(768, 1024, 'resp_dashboard_tablet_portrait_768.png');
        await captureComponentScreenshot(390, 844, 'resp_dashboard_mobile_390.png');

        // Testar Navegação para Escolas
        await send('Runtime.evaluate', {
            expression: `if (window.Router) window.Router.navigate('escolas-panel');`
        });
        await new Promise(r => setTimeout(r, 600));
        await captureComponentScreenshot(1440, 900, 'resp_escolas_desktop_1440.png');
        await captureComponentScreenshot(390, 844, 'resp_escolas_mobile_390.png');

        // Inspecionar Estado da Topbar e Sidebar em Mobile (390px)
        const mobileInspection = await send('Runtime.evaluate', {
            expression: `
                (() => {
                    const topbar = document.querySelector('.topbar, .app-header, header');
                    const topbarRect = topbar ? topbar.getBoundingClientRect() : null;
                    const hamburgerBtn = document.querySelector('.menu-toggle, .btn-hamburger, #btn-sidebar-toggle, .sidebar-toggle');
                    const sidebar = document.getElementById('main-sidebar');
                    const kpiCards = document.querySelectorAll('.metric-card, .kpi-card, .stat-card');
                    
                    return {
                        hasTopbar: !!topbar,
                        topbarHeight: topbarRect ? Math.round(topbarRect.height) : 0,
                        hasHamburger: !!hamburgerBtn,
                        hamburgerVisible: hamburgerBtn ? (hamburgerBtn.offsetWidth > 0 && hamburgerBtn.offsetHeight > 0) : false,
                        sidebarDisplay: sidebar ? window.getComputedStyle(sidebar).display : 'none',
                        sidebarPosition: sidebar ? window.getComputedStyle(sidebar).position : 'static',
                        kpiCardsCount: kpiCards.length
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('\n--- DIAGNÓSTICO ESTRUTURAL MOBILE (390px) ---');
        console.log(JSON.stringify(mobileInspection.result.value, null, 2));

        ws.close();
        browser.kill();
        server.close();
        console.log('\n✨ Auditoria profunda de componentes concluída!');
        process.exit(0);

    } catch (e) {
        console.error(e);
        browser.kill();
        server.close();
        process.exit(1);
    }
});
