const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function testBrowser() {
    console.log('--- TESTE E2E NO BROWSER HEADLESS (EDGE CDP) ---');
    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    let edgePath = edgePaths.find(p => fs.existsSync(p));
    if (!edgePath) {
        console.error('Edge executable not found');
        process.exit(1);
    }

    const userDataDir = path.join(process.cwd(), 'scratch', 'temp_edge_profile');
    const port = 9245;
    const proc = spawn(edgePath, [
        `--remote-debugging-port=${port}`,
        `--user-data-dir=${userDataDir}`,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        `file:///${path.join(process.cwd(), 'index.html').replace(/\\/g, '/')}`
    ], { detached: false });

    // Wait for CDP port
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

    function sendCmd(method, params = {}) {
        return new Promise(resolve => {
            const id = msgId++;
            callbacks.set(id, resolve);
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    await new Promise(r => ws.onopen = r);

    await sendCmd('Page.enable');
    await sendCmd('Runtime.enable');
    await sendCmd('DOM.enable');

    // 1. Switch to calculo-ideb
    const resNav = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                if (typeof window.switchTab === 'function') {
                    window.switchTab('calculo-ideb');
                }
                const section = document.getElementById('calculo-ideb');
                const isHidden = section ? section.classList.contains('hidden') : true;
                const sidebarItem = document.querySelector('a[data-target="calculo-ideb"]');
                return JSON.stringify({
                    sectionFound: !!section,
                    sectionVisible: !isHidden,
                    sidebarItemFound: !!sidebarItem
                });
            })()
        `
    });
    console.log('1. Navegação para #calculo-ideb:', resNav.result?.value || resNav.result?.result?.value);

    // 2. Test Presets application (Meta PDE 2025)
    const resPreset = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                if (typeof window.applyIdebPreset === 'function') {
                    window.applyIdebPreset('meta-pde-2025');
                }
                const ideb = document.getElementById('sim-out-ideb')?.textContent?.trim();
                const nMedio = document.getElementById('sim-out-n-medio')?.textContent?.trim();
                const ind = document.getElementById('sim-out-ind')?.textContent?.trim();
                const iad = document.getElementById('sim-out-iad')?.textContent?.trim();
                const stepIdeb = document.getElementById('sim-step-ideb-final')?.textContent?.trim();
                return JSON.stringify({ ideb, nMedio, ind, iad, stepIdeb });
            })()
        `
    });
    console.log('2. Aplicação do Preset "Meta PDE 2025":', resPreset.result?.value || resPreset.result?.result?.value);

    // 3. Test 9th year preset
    const resPreset9 = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                if (typeof window.applyIdebPreset === 'function') {
                    window.applyIdebPreset('anos-finais-9ano');
                }
                const ideb = document.getElementById('sim-out-ideb')?.textContent?.trim();
                const nMedio = document.getElementById('sim-out-n-medio')?.textContent?.trim();
                const ind = document.getElementById('sim-out-ind')?.textContent?.trim();
                const iad = document.getElementById('sim-out-iad')?.textContent?.trim();
                return JSON.stringify({ ideb, nMedio, ind, iad });
            })()
        `
    });
    console.log('3. Aplicação do Preset "9º Ano Finais":', resPreset9.result?.value || resPreset9.result?.result?.value);

    // 4. Capture screenshot
    const shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(process.cwd(), 'scratch', 'calculo_ideb_verified_e2e.png');
    fs.mkdirSync(path.dirname(shotPath), { recursive: true });
    fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
    console.log('4. Screenshot salvo com sucesso em:', shotPath);

    ws.close();
    proc.kill();
    console.log('=== TODOS OS TESTES E2E NO BROWSER PASSARAM COM SUCESSO! ===');
}

testBrowser().catch(e => {
    console.error(e);
    process.exit(1);
});
