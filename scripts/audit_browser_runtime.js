/**
 * ============================================================================
 * AUDITORIA FORENSE DE RUNTIME NO NAVEGADOR HEADLESS VIA CDP
 * Arquivo: scripts/audit_browser_runtime.js
 * ============================================================================
 */

const { spawn } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9333;

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
        this.events = [];
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
                } else if (data.method) {
                    this.events.push(data);
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

async function runAudit() {
    console.log('------------------------------------------------------------');
    console.log('INICIANDO AUDITORIA FORENSE DE RUNTIME NO EDGE HEADLESS');
    console.log('------------------------------------------------------------');

    const browserProc = spawn(edgePath, [
        `--remote-debugging-port=${port}`,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-extensions',
        '--window-size=1366,768',
        'https://gestao-educacional-saas.vercel.app'
    ], { stdio: 'ignore' });

    let client = null;
    try {
        await sleep(3500);
        const list = await getJson(`http://127.0.0.1:${port}/json/list`);
        const target = list.find(t => t.url.includes('vercel.app') || t.type === 'page') || list[0];
        if (!target || !target.webSocketDebuggerUrl) {
            throw new Error('Target não encontrado');
        }

        client = new CdpClient(target.webSocketDebuggerUrl);
        await client.connect();
        await client.send('Page.enable');
        await client.send('Runtime.enable');
        await client.send('Log.enable');

        console.log('[1/5] Conectado ao navegador. Aguardando inicialização da página...');
        await sleep(2000);

        // Fazer login direto via sessão
        console.log('[2/5] Executando autenticação como Gestor da Rede via sessão...');
        const loginResult = await client.evaluate(`
            (async function() {
                try {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    sessionStorage.setItem('userRole', 'Master Admin');
                    sessionStorage.setItem('userEmail', 'admin@goncalvesdias.ma.gov.br');
                    sessionStorage.setItem('userName', 'Secretaria Municipal de Educação');

                    if (typeof window.checkAuthSession === 'function') {
                        window.checkAuthSession();
                    }
                    if (typeof window.switchTab === 'function') {
                        window.switchTab('dashboard');
                    }
                    if (typeof window.renderDashboardComplete === 'function') {
                        window.renderDashboardComplete();
                    }
                    return 'Autenticação e renderDashboardComplete executados';
                } catch(e) {
                    return 'Erro no login: ' + e.message;
                }
            })()
        `);
        console.log('  Resultado do login:', loginResult);

        // Aguardar autenticação e navegação para o Dashboard
        await sleep(3000);

        console.log('[3/5] Inspecionando cadeia de ancestrais até o HTML...');
        const ancestorAudit = await client.evaluate(`
            (function() {
                var el = document.getElementById('dashboard-main-content');
                var chain = [];
                while (el) {
                    var cs = window.getComputedStyle(el);
                    chain.push({
                        tag: el.tagName,
                        id: el.id,
                        className: el.className,
                        clientHeight: el.clientHeight,
                        scrollHeight: el.scrollHeight,
                        offsetHeight: el.offsetHeight,
                        height: cs.height,
                        maxHeight: cs.maxHeight,
                        overflowY: cs.overflowY,
                        overflowX: cs.overflowX,
                        position: cs.position
                    });
                    el = el.parentElement;
                }
                return chain;
            })()
        `);
        console.log('\n--- CADEIA DE ANCESTRAIS E OVERFLOW ---');
        console.log(JSON.stringify(ancestorAudit, null, 2));

        console.log('\n[4/5] Inspecionando blocos de animação e visibilidade das seções...');
        const blocksAudit = await client.evaluate(`
            (function() {
                var sections = document.querySelectorAll('#dashboard-main-content .dash-scroll-block, #dashboard-main-content .dashboard-row, #dashboard-pde-progress-container');
                var result = [];
                sections.forEach(function(sec, idx) {
                    var r = sec.getBoundingClientRect();
                    var cs = window.getComputedStyle(sec);
                    var canvas = sec.querySelector('canvas');
                    result.push({
                        index: idx,
                        tagName: sec.tagName,
                        id: sec.id || (sec.className ? '.' + sec.className.split(' ').join('.') : 'sem-id'),
                        rectTop: Math.round(r.top),
                        rectBottom: Math.round(r.bottom),
                        rectHeight: Math.round(r.height),
                        opacity: cs.opacity,
                        transform: cs.transform,
                        isRevealed: sec.getAttribute('data-revealed') || 'false',
                        classList: Array.from(sec.classList),
                        canvasId: canvas ? canvas.id : null,
                        canvasWidth: canvas ? canvas.width : null,
                        canvasHeight: canvas ? canvas.height : null
                    });
                });
                return result;
            })()
        `);
        console.log('\n--- ESTADO DAS SEÇÕES DO DASHBOARD ---');
        console.log(JSON.stringify(blocksAudit, null, 2));

        console.log('\n[5/5] Testando simulação de rolagem no .content-body...');
        const scrollTest = await client.evaluate(`
            (async function() {
                var cb = document.querySelector('.content-body');
                var beforeCbTop = cb ? cb.scrollTop : null;

                // Rolar o verdadeiro container .content-body
                if (cb) cb.scrollTop = 800;
                if (cb) cb.dispatchEvent(new Event('scroll'));

                await new Promise(r => setTimeout(r, 600));

                var afterCbTop = cb ? cb.scrollTop : null;

                return {
                    beforeCbTop: beforeCbTop,
                    afterCbTop: afterCbTop,
                    cbClientHeight: cb ? cb.clientHeight : null,
                    cbScrollHeight: cb ? cb.scrollHeight : null
                };
            })()
        `);
        console.log('\n--- RESULTADO DO TESTE DE ROLAGEM NO .CONTENT-BODY ---');
        console.log(JSON.stringify(scrollTest, null, 2));

        // Coletar erros de console
        const errors = client.events.filter(e => e.method === 'Log.entryAdded' || e.method === 'Runtime.exceptionThrown');
        console.log('\n--- LOGS E EXCEÇÕES DO NAVEGADOR ---');
        console.log('Total de eventos capturados:', errors.length);
        errors.forEach(e => console.log('LOG:', JSON.stringify(e)));

    } catch(err) {
        console.error('Erro na auditoria:', err);
    } finally {
        if (client) client.close();
        browserProc.kill();
        console.log('\nAuditoria finalizada com sucesso.');
    }
}

runAudit();
