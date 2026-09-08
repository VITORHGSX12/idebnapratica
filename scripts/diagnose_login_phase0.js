/**
 * GESTÃO EDUCACIONAL SAAS — FASE 0: DIAGNÓSTICO FUNCIONAL DA TELA DE LOGIN
 * 
 * Tarefas executadas:
 * 1. Inspeção detalhada do DOM do formulário de login (presença do botão de submit).
 * 2. Captura de screenshots em resolução Desktop (1440x900) e Tablet (800x1024).
 * 3. Validação do fluxo de autenticação completo (login válido, login inválido com mensagem de erro, troca de perfil e redirecionamento).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = 3000;

function createStaticServer() {
    return http.createServer((req, res) => {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';
        const fullPath = path.join(ROOT_DIR, reqPath);

        if (!fs.existsSync(fullPath)) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Arquivo não encontrado: ' + reqPath);
            return;
        }

        const ext = path.extname(fullPath).toLowerCase();
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.webp': 'image/webp',
            '.mp4': 'video/mp4'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(fullPath).pipe(res);
    });
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectCDP(wsUrl) {
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

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = idSeq++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    return { send, close: () => ws.close() };
}

async function runDiagnosis() {
    console.log('================================================================');
    console.log('🔍 FASE 0: DIAGNÓSTICO FUNCIONAL E ESTRUTURAL DA TELA DE LOGIN');
    console.log('================================================================\n');

    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    const browserPath = edgePaths.find(p => fs.existsSync(p));
    if (!browserPath) throw new Error('Navegador Edge não encontrado no sistema.');

    const tempDir = path.join(ROOT_DIR, '.temp_edge_login_diag');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const remotePort = 9235;
    const browserProcess = spawn(browserPath, [
        `--remote-debugging-port=${remotePort}`,
        '--headless=new',
        '--disable-gpu',
        '--window-size=1440,900',
        `--user-data-dir=${tempDir}`
    ]);

    await wait(2000);

    try {
        const targetsRes = await fetch(`http://127.0.0.1:${remotePort}/json`);
        const targets = await targetsRes.json();
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
            throw new Error('Alvo de depuração da página não encontrado.');
        }

        const cdp = await connectCDP(pageTarget.webSocketDebuggerUrl);
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('DOM.enable');

        // 1. Diagnóstico em Desktop (1440x900)
        console.log('--- 1. AUDITORIA ESTATÍSTICA DE ELEMENTOS NO DOM (DESKTOP) ---');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
        await wait(2000);

        // Screenshot Desktop
        const ssDesktop = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const pathDesktop = path.join(ROOT_DIR, 'scripts', 'login_phase0_desktop.png');
        fs.writeFileSync(pathDesktop, Buffer.from(ssDesktop.data, 'base64'));
        console.log('  ✓ Screenshot Desktop salvo em:', pathDesktop);

        const domAudit = await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const form = document.getElementById('login-form');
                    const emailInput = document.getElementById('login-email');
                    const passInput = document.getElementById('login-password');
                    const rememberMe = document.getElementById('login-remember-me');
                    const forgotLink = document.getElementById('link-forgot-password');
                    const submitBtnById = document.getElementById('btn-login-submit');
                    const anySubmitInForm = form ? form.querySelector('button[type="submit"], input[type="submit"], button.btn-login, button.btn-dark-signin') : null;
                    const allButtonsInForm = form ? Array.from(form.querySelectorAll('button')).map(b => ({
                        id: b.id,
                        type: b.type,
                        className: b.className,
                        text: b.textContent.trim(),
                        visible: b.offsetParent !== null
                    })) : [];

                    return {
                        formExists: !!form,
                        emailInputExists: !!emailInput,
                        passInputExists: !!passInput,
                        rememberMeExists: !!rememberMe,
                        forgotLinkExists: !!forgotLink,
                        submitBtnByIdExists: !!submitBtnById,
                        anySubmitInFormExists: !!anySubmitInForm,
                        allButtonsInForm: allButtonsInForm,
                        formBoundingBox: form ? form.getBoundingClientRect() : null
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('Resultado da Inspeção do DOM:', JSON.stringify(domAudit.result.value, null, 2));

        // 2. Screenshot Tablet (800x1024)
        console.log('\n--- 2. AUDITORIA EM BREAKPOINT TABLET (800x1024) ---');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 800,
            height: 1024,
            deviceScaleFactor: 1,
            mobile: false
        });
        await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
        await wait(2000);

        const ssTablet = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const pathTablet = path.join(ROOT_DIR, 'scripts', 'login_phase0_tablet.png');
        fs.writeFileSync(pathTablet, Buffer.from(ssTablet.data, 'base64'));
        console.log('  ✓ Screenshot Tablet salvo em:', pathTablet);

        // Reset para desktop
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });
        await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
        await wait(2000);

        // 3. Teste do Fluxo de Login: Credenciais Inválidas (Mensagem de Erro)
        console.log('\n--- 3. TESTE FUNCIONAL: TRATAMENTO DE ERRO COM CREDENCIAIS INVÁLIDAS ---');
        const invalidLoginRes = await cdp.send('Runtime.evaluate', {
            expression: `
                (async () => {
                    const email = document.getElementById('login-email');
                    const pass = document.getElementById('login-password');
                    email.value = 'usuario_invalido@teste.com';
                    pass.value = 'senha123';
                    
                    if (window.executeSystemLogin) {
                        await window.executeSystemLogin();
                    }
                    
                    const errorAlert = document.getElementById('login-error-alert');
                    const errorText = document.getElementById('login-error-text')?.textContent.trim();
                    const isErrorVisible = errorAlert && errorAlert.style.display !== 'none' && !errorAlert.classList.contains('hidden');

                    return {
                        errorShown: isErrorVisible,
                        errorText: errorText
                    };
                })()
            `,
            awaitPromise: true,
            returnByValue: true
        });
        console.log('Resultado de Credenciais Inválidas:', JSON.stringify(invalidLoginRes.result.value, null, 2));

        // 4. Teste do Fluxo de Login: Troca de Perfil e Login Válido
        console.log('\n--- 4. TESTE FUNCIONAL: SELEÇÃO DE PERFIL E LOGIN VÁLIDO ---');
        const validLoginRes = await cdp.send('Runtime.evaluate', {
            expression: `
                (async () => {
                    const gestorPill = Array.from(document.querySelectorAll('.role-pill')).find(p => p.textContent.includes('Gestor'));
                    if (window.selectLoginProfile) {
                        window.selectLoginProfile('admin@goncalvesdias.ma.gov.br', gestorPill);
                    }
                    
                    const emailAfterPill = document.getElementById('login-email')?.value;
                    const passAfterPill = document.getElementById('login-password')?.value;

                    // Executa o login via executeSystemLogin
                    if (window.executeSystemLogin) {
                        await window.executeSystemLogin();
                    }
                    
                    return {
                        emailAfterPill,
                        passSet: !!passAfterPill
                    };
                })()
            `,
            awaitPromise: true,
            returnByValue: true
        });
        console.log('Resultado Pré-Login:', JSON.stringify(validLoginRes.result.value, null, 2));

        // Aguardar transição de login
        await wait(3000);

        const postLoginState = await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const loginScreen = document.getElementById('login-screen');
                    const appContainer = document.getElementById('app-container');
                    const userEmail = localStorage.getItem('userEmail');
                    const userName = document.getElementById('user-name-display')?.textContent.trim();
                    const welcomeBanner = document.getElementById('dashboard-welcome-banner')?.textContent.trim();

                    return {
                        loginHidden: loginScreen ? loginScreen.style.display === 'none' : true,
                        appVisible: appContainer ? appContainer.style.display !== 'none' : false,
                        userEmail,
                        userName,
                        hasBanner: !!welcomeBanner
                    };
                })()
            `,
            returnByValue: true
        });
        console.log('Resultado Pós-Login:', JSON.stringify(postLoginState.result.value, null, 2));

        console.log('\n================================================================');
        console.log('🎯 DIAGNÓSTICO CONCLUÍDO COM SUCESSO');
        console.log('================================================================\n');

        cdp.close();
    } finally {
        browserProcess.kill();
        server.close();
        try {
            if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {}
    }
}

runDiagnosis().catch(err => {
    console.error('Falha no diagnóstico:', err);
    process.exit(1);
});
