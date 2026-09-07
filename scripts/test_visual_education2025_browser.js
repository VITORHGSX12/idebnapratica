const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function testVisualDesign() {
    console.log('--- TESTE VISUAL E2E: PALETA EDUCATION2025 & SIDEBAR ---');
    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    let edgePath = edgePaths.find(p => fs.existsSync(p));
    if (!edgePath) {
        console.error('Edge executable not found');
        process.exit(1);
    }

    const userDataDir = path.join(process.cwd(), 'scratch', 'temp_edge_profile_visual');
    const port = 9260;
    const proc = spawn(edgePath, [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${userDataDir}`,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        `--window-size=1440,900`,
        `file:///${path.join(process.cwd(), 'index.html').replace(/\\/g, '/')}`
    ], { detached: false });

    await new Promise(r => setTimeout(r, 2500));

    function getJson(url) {
        return new Promise((resolve, reject) => {
            http.get(url, res => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => resolve(JSON.parse(d)));
            }).on('error', reject);
        });
    }

    const list = await getJson(`http://127.0.0.1:${port}/json/list`);
    const pageTarget = list.find(t => t.type === 'page');
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
        console.error('Page debugger URL not found');
        proc.kill();
        process.exit(1);
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && callbacks.has(data.id)) {
            callbacks.get(data.id)(data);
            callbacks.delete(data.id);
        }
    };

    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = msgId++;
            callbacks.set(id, (res) => {
                if (res.error) reject(res.error);
                else resolve(res.result);
            });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async function evaluate(expression) {
        const res = await send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        return res.result ? res.result.value : null;
    }

    await send('Page.enable');
    await send('DOM.enable');

    console.log('1. Autenticando e abrindo a aplicação...');
    await evaluate(`
        (function() {
            var loginScreen = document.getElementById('login-screen');
            var appContainer = document.querySelector('.app-container');
            if (loginScreen) {
                loginScreen.classList.add('hidden');
                loginScreen.style.display = 'none';
            }
            if (appContainer) {
                appContainer.style.display = 'flex';
            }
            if (typeof window.switchTab === 'function') {
                window.switchTab('dashboard');
            }
            if (typeof window.safeCreateIcons === 'function') {
                window.safeCreateIcons();
            }
        })()
    `);

    await new Promise(r => setTimeout(r, 1000));

    console.log('2. Verificando estilos computados da Sidebar e Tokens...');
    const visualAudit = await evaluate(`
        (function() {
            var sidebar = document.querySelector('.sidebar');
            var sidebarBg = window.getComputedStyle(sidebar).backgroundImage;
            var activeItem = document.querySelector('.menu-item.active');
            var activeBg = window.getComputedStyle(activeItem).backgroundColor;
            var activeColor = window.getComputedStyle(activeItem).color;
            var topNavbar = document.querySelector('.top-navbar');
            var topNavbarBg = window.getComputedStyle(topNavbar).backgroundColor;
            var mainContent = document.querySelector('.main-content');
            var mainBg = window.getComputedStyle(mainContent).backgroundColor;
            var metricCard = document.querySelector('.metric-card');
            var cardRadius = metricCard ? window.getComputedStyle(metricCard).borderRadius : null;

            return {
                sidebarBg: sidebarBg,
                activeBg: activeBg,
                activeColor: activeColor,
                topNavbarBg: topNavbarBg,
                mainBg: mainBg,
                cardRadius: cardRadius
            };
        })()
    `);

    console.log('Estilos Computados:', visualAudit);

    console.log('3. Capturando screenshot da interface no modo escuro...');
    const ssDark = await send('Page.captureScreenshot', { format: 'png' });
    const darkPath = path.join('C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\949e6a03-e104-4aad-8205-a0bf96be5959', 'education2025_visual_dashboard_dark.png');
    fs.writeFileSync(darkPath, Buffer.from(ssDark.data, 'base64'));
    console.log('Screenshot escuro salvo em:', darkPath);

    console.log('4. Alternando para o Modo Claro...');
    await evaluate(`
        (function() {
            if (typeof window.setThemeMode === 'function') {
                window.setThemeMode('light');
            } else {
                document.body.classList.remove('dark-mode');
            }
        })()
    `);

    await new Promise(r => setTimeout(r, 600));

    const ssLight = await send('Page.captureScreenshot', { format: 'png' });
    const lightPath = path.join('C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\949e6a03-e104-4aad-8205-a0bf96be5959', 'education2025_visual_dashboard_light.png');
    fs.writeFileSync(lightPath, Buffer.from(ssLight.data, 'base64'));
    console.log('Screenshot claro salvo em:', lightPath);

    console.log('5. Capturando screenshot da aba Cálculo do IDEB...');
    await evaluate(`window.switchTab('calculo-ideb')`);
    await new Promise(r => setTimeout(r, 600));
    const ssCalc = await send('Page.captureScreenshot', { format: 'png' });
    const calcPath = path.join('C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\949e6a03-e104-4aad-8205-a0bf96be5959', 'education2025_visual_calculo_ideb.png');
    fs.writeFileSync(calcPath, Buffer.from(ssCalc.data, 'base64'));
    console.log('Screenshot Calculo IDEB salvo em:', calcPath);

    console.log('6. Capturando screenshot da aba Escolas da Rede...');
    await evaluate(`window.switchTab('escolas-panel')`);
    await new Promise(r => setTimeout(r, 600));
    const ssEscolas = await send('Page.captureScreenshot', { format: 'png' });
    const escolasPath = path.join('C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\949e6a03-e104-4aad-8205-a0bf96be5959', 'education2025_visual_escolas.png');
    fs.writeFileSync(escolasPath, Buffer.from(ssEscolas.data, 'base64'));
    console.log('Screenshot Escolas salvo em:', escolasPath);

    ws.close();
    proc.kill();
    console.log('--- TESTE VISUAL CONCLUÍDO COM SUCESSO! ---');
}

testVisualDesign().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
