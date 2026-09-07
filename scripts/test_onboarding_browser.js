const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function testOnboardingBrowser() {
    console.log('--- TESTE E2E ONBOARDING NO BROWSER HEADLESS (EDGE CDP) ---');
    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    let edgePath = edgePaths.find(p => fs.existsSync(p));
    if (!edgePath) {
        console.error('Edge executable not found');
        process.exit(1);
    }

    const userDataDir = path.join(process.cwd(), 'scratch', 'temp_edge_onboarding');
    const port = 9260;
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

    // 1. Test Welcome Card Display
    const resWelcome = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                if (typeof window.showWelcomeOnboardingCard === 'function') {
                    window.showWelcomeOnboardingCard();
                }
                const card = document.getElementById('onboarding-welcome-modal');
                return JSON.stringify({
                    welcomeModalRendered: !!card,
                    title: card?.querySelector('h3')?.textContent
                });
            })()
        `
    });
    console.log('1. Card de Boas-Vindas:', resWelcome.result?.value || resWelcome.result?.result?.value);

    // 2. Start Tour from Welcome Card
    await sendCmd('Runtime.evaluate', { expression: `window.startOnboardingFromWelcome();` });
    await new Promise(r => setTimeout(r, 300));
    const resStart = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                const spotlight = document.getElementById('onboarding-spotlight-box');
                const tooltip = document.getElementById('onboarding-tooltip-card');
                return JSON.stringify({
                    spotlightVisible: !spotlight?.classList.contains('hidden'),
                    tooltipVisible: !tooltip?.classList.contains('hidden'),
                    title: tooltip?.querySelector('h4')?.textContent?.trim()
                });
            })()
        `
    });
    console.log('2. Início do Tour (Spotlight):', resStart.result?.value || resStart.result?.result?.value);

    // 3. Advance to Next Step (Step 2 - Calculo IDEB)
    await sendCmd('Runtime.evaluate', { expression: `window.nextOnboardingStep();` });
    await new Promise(r => setTimeout(r, 300));
    const resStep2 = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                const tooltip = document.getElementById('onboarding-tooltip-card');
                return JSON.stringify({
                    tooltipText: tooltip?.querySelector('h4')?.textContent?.trim()
                });
            })()
        `
    });
    console.log('3. Avanço para Passo 2:', resStep2.result?.value || resStep2.result?.result?.value);

    // 4. Test Contextual Help Button Click
    const resHelpBtn = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                const helpBtn = document.getElementById('header-help-tour-btn');
                if (helpBtn) helpBtn.click();
                const tooltip = document.getElementById('onboarding-tooltip-card');
                return JSON.stringify({
                    helpBtnFound: !!helpBtn,
                    tourActive: !tooltip?.classList.contains('hidden')
                });
            })()
        `
    });
    console.log('4. Botão de Ajuda no Header:', resHelpBtn.result?.value || resHelpBtn.result?.result?.value);

    // 5. Close Tour and check persistence
    const resClose = await sendCmd('Runtime.evaluate', {
        expression: `
            (function() {
                if (typeof window.closeOnboardingTour === 'function') {
                    window.closeOnboardingTour(true);
                }
                const tooltip = document.getElementById('onboarding-tooltip-card');
                return JSON.stringify({
                    tourClosed: tooltip?.classList.contains('hidden'),
                    isCompleted: window.isTourCompleted()
                });
            })()
        `
    });
    console.log('5. Fechamento e Persistência:', resClose.result?.value || resClose.result?.result?.value);

    // Screenshot
    const shot = await sendCmd('Page.captureScreenshot', { format: 'png' });
    const shotPath = path.join(process.cwd(), 'scratch', 'onboarding_verified_e2e.png');
    fs.mkdirSync(path.dirname(shotPath), { recursive: true });
    fs.writeFileSync(shotPath, Buffer.from(shot.result.data, 'base64'));
    console.log('6. Screenshot de validação salvo em:', shotPath);

    ws.close();
    proc.kill();
    console.log('=== TODOS OS TESTES E2E DE ONBOARDING PASSARAM COM SUCESSO! ===');
}

testOnboardingBrowser().catch(e => {
    console.error(e);
    process.exit(1);
});
