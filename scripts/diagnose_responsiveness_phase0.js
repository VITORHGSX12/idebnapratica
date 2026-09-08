/**
 * GESTÃO EDUCACIONAL SAAS — FASE 0: AUDITORIA E DIAGNÓSTICO DE RESPONSIVIDADE CROSS-BROWSER / MULTI-DEVICE
 * 
 * Executa varredura profunda no DOM em múltiplos viewports:
 * - 360x800 (Mobile Pequeno - Android/Galaxy)
 * - 390x844 (Mobile Médio - iPhone 12/13/14)
 * - 430x932 (Mobile Grande - iPhone Pro Max)
 * - 768x1024 (Tablet Retrato - iPad)
 * - 1024x768 (Tablet Paisagem / Laptop Pequeno)
 * - 1280x800 (Notebook)
 * - 1440x900 (Desktop Padrão)
 * - 1920x1080 (Desktop Wide)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8092;
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

function createServer() {
    return http.createServer((req, res) => {
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
}

const VIEWPORTS = [
    { name: 'Mobile Pequeno (Galaxy)', width: 360, height: 800, category: 'mobile' },
    { name: 'Mobile Padrão (iPhone 14)', width: 390, height: 844, category: 'mobile' },
    { name: 'Mobile Grande (Pro Max)', width: 430, height: 932, category: 'mobile' },
    { name: 'Tablet Retrato (iPad)', width: 768, height: 1024, category: 'tablet' },
    { name: 'Tablet Paisagem (iPad/Laptop)', width: 1024, height: 768, category: 'tablet' },
    { name: 'Notebook Pequeno', width: 1280, height: 800, category: 'desktop' },
    { name: 'Desktop Padrão', width: 1440, height: 900, category: 'desktop' },
    { name: 'Desktop Wide FHD', width: 1920, height: 1080, category: 'desktop' }
];

const ROUTES_TO_AUDIT = [
    { id: 'dashboard', name: 'Dashboard Principal' },
    { id: 'calculo-ideb', name: 'Cálculo IDEB & Simulador' },
    { id: 'escolas-panel', name: 'Painel de Escolas & Ranking' },
    { id: 'alunos-panel', name: 'Alunos e Turmas' },
    { id: 'metas-ideb', name: 'Metas IDEB & PDE' },
    { id: 'ideb-comparativo', name: 'Comparativo Regional' },
    { id: 'matriz-descritores', name: 'Matriz de Descritores' },
    { id: 'cronograma-habilidades', name: 'Cronograma de Habilidades' },
    { id: 'criar-avaliacoes', name: 'Criação de Avaliações' },
    { id: 'gestao-pedagogica', name: 'Gestão Pedagógica' }
];

async function runAudit() {
    console.log('================================================================');
    console.log('🔍 INICIANDO DIAGNÓSTICO DE RESPONSIVIDADE MULTI-VIEWPORT (FASE 0)');
    console.log('================================================================\n');

    const server = createServer();
    await new Promise(r => server.listen(PORT, '127.0.0.1', r));
    console.log(`[Test Server] Ativo em http://127.0.0.1:${PORT}`);

    const browserPaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const browserExe = browserPaths.find(p => fs.existsSync(p));
    if (!browserExe) throw new Error('Nenhum navegador suportado encontrado.');

    const DEBUG_PORT = 9260;
    const tempDir = path.join(ROOT_DIR, '.temp_edge_resp_diag');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const browserProcess = spawn(browserExe, [
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
        if (!pageTarget || !pageTarget.webSocketDebuggerUrl) throw new Error('Target não encontrado');

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

        // Realiza Login Inicial para acessar todas as telas internas
        console.log('--- AUTENTICANDO COM PERFIL GESTOR ---');
        await send('Runtime.evaluate', {
            expression: `
                (async () => {
                    const emailInput = document.getElementById('login-email');
                    const passInput = document.getElementById('login-password');
                    if (emailInput && passInput) {
                        emailInput.value = 'gestor@edu.gov.br';
                        passInput.value = 'semed2025';
                    }
                    if (typeof window.executeSystemLogin === 'function') {
                        window.executeSystemLogin();
                    } else {
                        const form = document.getElementById('login-form');
                        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
                })()
            `,
            awaitPromise: true
        });

        await new Promise(r => setTimeout(r, 2000));

        const matrixResults = [];

        // Loop sobre as rotas principais
        for (const route of ROUTES_TO_AUDIT) {
            console.log(`\n▶ [AUDITORIA] Tela: ${route.name} (${route.id})`);

            // Navega para a rota
            await send('Runtime.evaluate', {
                expression: `
                    if (window.Router && window.Router.navigate) {
                        window.Router.navigate('${route.id}');
                    } else if (window.navigateToRoute) {
                        window.navigateToRoute('${route.id}');
                    }
                `
            });
            await new Promise(r => setTimeout(r, 600));

            for (const vp of VIEWPORTS) {
                await send('Emulation.setDeviceMetricsOverride', {
                    width: vp.width,
                    height: vp.height,
                    deviceScaleFactor: 1,
                    mobile: vp.category === 'mobile'
                });
                await new Promise(r => setTimeout(r, 300));

                // Diagnóstico detalhado de layout e quebras
                const evalResult = await send('Runtime.evaluate', {
                    expression: `
                        (() => {
                            const body = document.body;
                            const html = document.documentElement;
                            const viewportWidth = window.innerWidth;
                            const viewportHeight = window.innerHeight;

                            // 1. Verificar Scroll Horizontal Global Indesejado
                            const docScrollWidth = Math.max(
                                body.scrollWidth,
                                body.offsetWidth,
                                html.clientWidth,
                                html.scrollWidth,
                                html.offsetWidth
                            );
                            const hasGlobalHorizontalScroll = docScrollWidth > viewportWidth + 3;
                            const horizontalOverflowPx = Math.max(0, docScrollWidth - viewportWidth);

                            // 2. Elementos que estouram a largura do viewport
                            const overflowingElements = [];
                            const allElements = document.querySelectorAll('#app-container, #app-container *, .view-panel, .view-panel *');
                            for (const el of allElements) {
                                if (el.offsetWidth > 0 && el.offsetHeight > 0) {
                                    const rect = el.getBoundingClientRect();
                                    if (rect.right > viewportWidth + 5 && !el.closest('.table-responsive, .overflow-x-auto, .horizontal-scroll-container')) {
                                        overflowingElements.push({
                                            tag: el.tagName.toLowerCase(),
                                            id: el.id || null,
                                            className: (el.className && typeof el.className === 'string') ? el.className.split(' ').slice(0, 3).join(' ') : '',
                                            right: Math.round(rect.right),
                                            width: Math.round(rect.width)
                                        });
                                    }
                                }
                                if (overflowingElements.length >= 8) break;
                            }

                            // 3. Inspeção de Gráficos (Canvas)
                            const charts = [];
                            document.querySelectorAll('canvas').forEach(canvas => {
                                const rect = canvas.getBoundingClientRect();
                                if (rect.width > 0 || rect.height > 0) {
                                    charts.push({
                                        id: canvas.id || 'anonymous_canvas',
                                        width: Math.round(rect.width),
                                        height: Math.round(rect.height),
                                        parentWidth: canvas.parentElement ? Math.round(canvas.parentElement.getBoundingClientRect().width) : 0,
                                        isSquished: rect.height < 50 || rect.width < 50
                                    });
                                }
                            });

                            // 4. Inspeção de Tabelas
                            const tables = [];
                            document.querySelectorAll('table').forEach(table => {
                                const rect = table.getBoundingClientRect();
                                const parent = table.parentElement;
                                const parentStyle = parent ? window.getComputedStyle(parent) : null;
                                const hasScrollWrapper = parentStyle && (parentStyle.overflowX === 'auto' || parentStyle.overflowX === 'scroll');
                                if (rect.width > viewportWidth && !hasScrollWrapper) {
                                    tables.push({
                                        id: table.id || 'table',
                                        tableWidth: Math.round(rect.width),
                                        hasScrollWrapper: false,
                                        isLeaking: true
                                    });
                                }
                            });

                            // 5. Sidebar e Navigation State
                            const sidebar = document.getElementById('main-sidebar');
                            const sidebarRect = sidebar ? sidebar.getBoundingClientRect() : null;
                            const isSidebarVisible = sidebarRect ? (sidebarRect.width > 0 && sidebarRect.right > 0) : false;
                            const isSidebarCollapsed = sidebar ? sidebar.classList.contains('collapsed') : false;

                            // 6. Botões pequenos / touch targets (< 36px)
                            let smallButtonsCount = 0;
                            if (viewportWidth < 600) {
                                document.querySelectorAll('button, a.btn, .btn').forEach(btn => {
                                    const r = btn.getBoundingClientRect();
                                    if (r.width > 0 && r.height > 0 && (r.width < 32 || r.height < 32)) {
                                        smallButtonsCount++;
                                    }
                                });
                            }

                            return {
                                viewportWidth,
                                viewportHeight,
                                docScrollWidth,
                                hasGlobalHorizontalScroll,
                                horizontalOverflowPx,
                                overflowingElements,
                                charts,
                                tables,
                                isSidebarVisible,
                                isSidebarCollapsed,
                                smallButtonsCount
                            };
                        })()
                    `,
                    returnByValue: true
                });

                const diag = evalResult.result.value;
                const issues = [];

                if (diag.hasGlobalHorizontalScroll) {
                    issues.push({
                        type: 'GLOBAL_HORIZONTAL_SCROLL',
                        severity: diag.horizontalOverflowPx > 20 ? 'CRITICO' : 'VISUAL',
                        description: `Vazamento horizontal de ${diag.horizontalOverflowPx}px além da largura de tela (${diag.viewportWidth}px)`
                    });
                }

                if (diag.overflowingElements.length > 0) {
                    issues.push({
                        type: 'ELEMENTS_OVERFLOW',
                        severity: 'CRITICO',
                        description: `${diag.overflowingElements.length} elemento(s) sem wrapper ultrapassando o viewport: ` +
                            diag.overflowingElements.map(e => `${e.tag}${e.id ? '#' + e.id : (e.className ? '.' + e.className : '')} (${e.width}px)`).join(', ')
                    });
                }

                if (diag.tables.some(t => t.isLeaking)) {
                    issues.push({
                        type: 'TABLE_WITHOUT_WRAPPER',
                        severity: 'CRITICO',
                        description: 'Tabela larga sem container de scroll horizontal'
                    });
                }

                if (diag.charts.some(c => c.isSquished)) {
                    issues.push({
                        type: 'CHART_SQUISHED',
                        severity: 'VISUAL',
                        description: 'Gráfico com altura ou largura reduzida/espremida'
                    });
                }

                if (vp.category === 'mobile' && diag.isSidebarVisible && !diag.isSidebarCollapsed) {
                    issues.push({
                        type: 'SIDEBAR_MOBILE_COLLISION',
                        severity: 'CRITICO',
                        description: 'Sidebar desktop aberta ocupando espaço total em viewport mobile'
                    });
                }

                const resultRecord = {
                    routeId: route.id,
                    routeName: route.name,
                    viewport: vp.name,
                    width: vp.width,
                    height: vp.height,
                    category: vp.category,
                    hasGlobalHorizontalScroll: diag.hasGlobalHorizontalScroll,
                    horizontalOverflowPx: diag.horizontalOverflowPx,
                    issues
                };

                matrixResults.push(resultRecord);

                const statusSymbol = issues.length === 0 ? '✓ OK' : (issues.some(i => i.severity === 'CRITICO') ? '❌ CRÍTICO' : '⚠️ VISUAL');
                console.log(`   [${vp.name.padEnd(30)}] -> ${statusSymbol} (${issues.length} alertas)`);
            }
        }

        // Diagnóstico Especial: Tela de Login
        console.log('\n▶ [AUDITORIA ESPECIAL] Tela de Login (#login-screen)');
        await send('Runtime.evaluate', {
            expression: `
                const loginScreen = document.getElementById('login-screen');
                const appContainer = document.getElementById('app-container');
                if (loginScreen) loginScreen.style.display = 'block';
                if (appContainer) appContainer.style.display = 'none';
            `
        });
        await new Promise(r => setTimeout(r, 400));

        for (const vp of VIEWPORTS) {
            await send('Emulation.setDeviceMetricsOverride', {
                width: vp.width,
                height: vp.height,
                deviceScaleFactor: 1,
                mobile: vp.category === 'mobile'
            });
            await new Promise(r => setTimeout(r, 200));

            const loginDiag = await send('Runtime.evaluate', {
                expression: `
                    (() => {
                        const vpWidth = window.innerWidth;
                        const docW = document.documentElement.scrollWidth;
                        const btnSubmit = document.getElementById('btn-login-submit');
                        const btnRect = btnSubmit ? btnSubmit.getBoundingClientRect() : null;
                        const isBtnVisible = btnRect ? (btnRect.width > 0 && btnRect.height > 0 && btnRect.top < window.innerHeight + 600) : false;
                        return {
                            hasScroll: docW > vpWidth + 2,
                            overflowPx: Math.max(0, docW - vpWidth),
                            isBtnVisible,
                            btnWidth: btnRect ? btnRect.width : 0
                        };
                    })()
                `,
                returnByValue: true
            });

            const lRes = loginDiag.result.value;
            const lIssues = [];
            if (lRes.hasScroll) {
                lIssues.push({
                    type: 'LOGIN_HORIZONTAL_SCROLL',
                    severity: 'VISUAL',
                    description: `Overflow horizontal no login: +${lRes.overflowPx}px`
                });
            }
            if (!lRes.isBtnVisible) {
                lIssues.push({
                    type: 'LOGIN_BTN_NOT_VISIBLE',
                    severity: 'CRITICO',
                    description: 'Botão de login inacessível ou fora da viewport'
                });
            }

            matrixResults.push({
                routeId: 'login',
                routeName: 'Tela de Login',
                viewport: vp.name,
                width: vp.width,
                height: vp.height,
                category: vp.category,
                hasGlobalHorizontalScroll: lRes.hasScroll,
                horizontalOverflowPx: lRes.overflowPx,
                issues: lIssues
            });
            const lStatus = lIssues.length === 0 ? '✓ OK' : (lIssues.some(i => i.severity === 'CRITICO') ? '❌ CRÍTICO' : '⚠️ VISUAL');
            console.log(`   [${vp.name.padEnd(30)}] -> ${lStatus} (${lIssues.length} alertas)`);
        }

        // Salvar Relatório em JSON e Gerar Resumo
        const reportPath = path.join(ARTIFACTS_DIR, 'responsiveness_phase0_audit.json');
        fs.writeFileSync(reportPath, JSON.stringify(matrixResults, null, 2));
        console.log(`\n📄 Relatório JSON gravado com sucesso: ${reportPath}`);

        ws.close();
        browserProcess.kill();
        server.close();
        process.exit(0);

    } catch (err) {
        console.error('Erro na auditoria:', err);
        browserProcess.kill();
        server.close();
        process.exit(1);
    }
}

runAudit();
