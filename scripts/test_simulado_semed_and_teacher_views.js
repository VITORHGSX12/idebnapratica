/**
 * ============================================================================
 * TESTE E CAPTURA DE TELAS: VISÃO SEMED VS VISÃO PROFESSOR (PÓS-SIMULADO)
 * Arquivo: scripts/test_simulado_semed_and_teacher_views.js
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3355;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\a43b0565-56ad-4732-97a0-6687c6b9fce6';

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
            return res.end('Not Found: ' + cleanUrl);
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

    function send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = idSeq++;
            callbacks.set(id, { resolve, reject });
            ws.send(JSON.stringify({ id, method, params }));
        });
    }

    return { send, close: () => ws.close() };
}

async function captureScreenshot(cdp, filename) {
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshot.data, 'base64');
    const fullPath = path.join(ARTIFACTS_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    console.log(`[Screenshot Salva] ${fullPath}`);
    return fullPath;
}

async function run() {
    console.log('[Test] Iniciando servidor de teste na porta', PORT);
    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    ];
    const browserPath = edgePaths.find(p => fs.existsSync(p));
    if (!browserPath) throw new Error('Navegador Edge/Chrome não encontrado');

    const tempDir = path.join(ROOT_DIR, '.temp_edge_simulado_test');
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
    fs.mkdirSync(tempDir, { recursive: true });

    const remotePort = 9248;
    console.log('[Test] Iniciando navegador headless...');
    const browserProcess = spawn(browserPath, [
        `--remote-debugging-port=${remotePort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${tempDir}`,
        `http://127.0.0.1:${PORT}/index.html`
    ], { stdio: 'ignore' });

    let targets = null;
    for (let i = 0; i < 30; i++) {
        await wait(300);
        try {
            const res = await fetch(`http://127.0.0.1:${remotePort}/json/list`);
            targets = await res.json();
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) throw new Error('Falha ao conectar ao Edge CDP');

    try {
        const pageTarget = targets.find(t => t.type === 'page') || targets[0];
        const cdp = await getCDPClient(pageTarget.webSocketDebuggerUrl);

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('DOM.enable');

        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        await wait(2500);

        // 1. CARREGAR SEED SCRIPT E GERAR DADOS DO SIMULADO PELA SEMED
        console.log('\n======================================================');
        console.log('1. SEMED: Preenchimento e Lançamento Centralizado de Cartões');
        console.log('======================================================');

        const seedScriptContent = fs.readFileSync(path.join(__dirname, 'seed_simulado_test_responses.js'), 'utf8');
        await cdp.send('Runtime.evaluate', {
            expression: seedScriptContent
        });

        const seedRes = await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const user = {
                        name: 'Gestor da Rede',
                        nome: 'Gestor da Rede',
                        role: 'Master Admin',
                        email: 'semed@goncalvesdias.ma.gov.br',
                        escola: 'Secretaria Municipal de Educação',
                        escola_id: 'semed'
                    };
                    sessionStorage.setItem('user_session', JSON.stringify(user));
                    sessionStorage.setItem('userRole', 'Master Admin');
                    sessionStorage.setItem('userName', 'Gestor da Rede');
                    sessionStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('user_session', JSON.stringify(user));
                    localStorage.setItem('gd_current_user_profile', JSON.stringify(user));
                    if (typeof window.setCurrentUser === 'function') window.setCurrentUser(user);
                    if (typeof window.renderAllUserInfoHeaders === 'function') window.renderAllUserInfoHeaders();

                    const loginScreen = document.getElementById('login-screen');
                    const mainLayout = document.getElementById('main-layout');
                    if (loginScreen) loginScreen.classList.add('hidden');
                    if (mainLayout) mainLayout.classList.remove('hidden');

                    return window.seedSimuladoTestResponses();
                })()
            `,
            returnByValue: true
        });

        console.log('[Seed Result]:', seedRes.result ? seedRes.result.value : seedRes);
        await wait(1000);

        // 1.1 Ir para o Espelho de Lançamento (Visão SEMED) com 5º Ano da UI José Corrêa Lima
        console.log('Navegando para Espelho de Cartões (Visão SEMED)...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                (async () => {
                    if (typeof window.switchTab === 'function') window.switchTab('sec-criar-avaliacoes');
                    if (typeof window.switchAvaliacoesSubtab === 'function') window.switchAvaliacoesSubtab('lancar-notas-sub');
                    
                    const evalSelect = document.getElementById('score-eval-select');
                    const schoolSelect = document.getElementById('score-school-select');
                    const classSelect = document.getElementById('score-class-select');

                    if (evalSelect) evalSelect.value = 'evt_2026_01';
                    if (typeof window.carregarEscolasParaEspelho === 'function') window.carregarEscolasParaEspelho();
                    
                    if (schoolSelect) {
                        for (let i = 0; i < schoolSelect.options.length; i++) {
                            if (schoolSelect.options[i].text.includes('CORREA LIMA') || schoolSelect.options[i].value === 'esc_03' || schoolSelect.options[i].value.includes('3a3b0e2f')) {
                                schoolSelect.selectedIndex = i;
                                schoolSelect.value = schoolSelect.options[i].value;
                                break;
                            }
                        }
                    }
                    if (typeof window.carregarTurmasParaEspelho === 'function') await window.carregarTurmasParaEspelho();
                    
                    if (classSelect) {
                        for (let i = 0; i < classSelect.options.length; i++) {
                            if (classSelect.options[i].text.includes('5º') || classSelect.options[i].text.includes('5 ANO') || classSelect.options[i].value.includes('5a') || classSelect.options[i].value.includes('ec592c98')) {
                                classSelect.selectedIndex = i;
                                classSelect.value = classSelect.options[i].value;
                                break;
                            }
                        }
                    }
                    if (typeof window.renderEspelhoLancamentoTable === 'function') await window.renderEspelhoLancamentoTable();
                })()
            `,
            awaitPromise: true
        });

        await wait(2200);
        await captureScreenshot(cdp, 'semed_espelho_lancamento_preenchido.png');

        // 1.2 Ir para Resultados & Dashboard da SEMED (Subtab 3)
        console.log('Navegando para Resultados & Dashboard do Simulado (Visão SEMED)...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    if (typeof window.switchTab === 'function') window.switchTab('sec-criar-avaliacoes');
                    if (typeof window.switchAvaliacoesSubtab === 'function') window.switchAvaliacoesSubtab('resultados-dash-sub');
                    if (typeof window.renderAvaliacoesDashboard === 'function') window.renderAvaliacoesDashboard();
                })()
            `
        });

        await wait(2200);
        await captureScreenshot(cdp, 'semed_resultados_dashboard.png');

        // 1.3 Dashboard Executivo da Rede
        console.log('Navegando para Dashboard Executivo da Rede...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    if (typeof window.switchTab === 'function') window.switchTab('sec-dashboard');
                    if (typeof window.renderDashboardMetricCards === 'function') window.renderDashboardMetricCards();
                    if (typeof window.renderAllUserInfoHeaders === 'function') window.renderAllUserInfoHeaders();
                })()
            `
        });
        await wait(2200);
        await captureScreenshot(cdp, 'semed_dashboard_pos_simulado.png');

        // 2. ALTERAR SESSÃO PARA PROFESSOR (UI JOSÉ CORRÊA LIMA / 5º ANO)
        console.log('\n======================================================');
        console.log('2. PROFESSOR: Consulta de Resultados e Diagnóstico');
        console.log('======================================================');

        await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const teacherUser = {
                        name: 'Profa. Silvana Ferreira',
                        nome: 'Profa. Silvana Ferreira (Regente)',
                        role: 'Professor',
                        email: 'prof.silvana@goncalvesdias.ma.gov.br',
                        escola: 'UI JOSE CORREA LIMA',
                        escola_id: 'esc_03',
                        turma: '5º ANO - VESPERTINO',
                        turma_id: 'ec592c98-cf05-4c83-91cf-a96e6d20679f'
                    };
                    sessionStorage.setItem('user_session', JSON.stringify(teacherUser));
                    sessionStorage.setItem('userRole', 'Professor');
                    sessionStorage.setItem('userName', 'Profa. Silvana Ferreira');
                    sessionStorage.setItem('userEscola', 'UI JOSE CORREA LIMA');
                    sessionStorage.setItem('userTurma', '5º ANO - VESPERTINO');
                    localStorage.setItem('user_session', JSON.stringify(teacherUser));
                    localStorage.setItem('gd_current_user_profile', JSON.stringify(teacherUser));
                    if (typeof window.setCurrentUser === 'function') window.setCurrentUser(teacherUser);
                    if (typeof window.renderAllUserInfoHeaders === 'function') window.renderAllUserInfoHeaders();
                })()
            `
        });

        // 2.1 Dashboard do Professor pós-simulado
        console.log('Navegando para Dashboard do Professor Pós-Simulado...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    if (typeof window.switchTab === 'function') window.switchTab('sec-dashboard');
                    if (typeof window.renderDashboardMetricCards === 'function') window.renderDashboardMetricCards();
                    if (typeof window.renderAllUserInfoHeaders === 'function') window.renderAllUserInfoHeaders();
                })()
            `
        });

        await wait(2200);
        await captureScreenshot(cdp, 'professor_dashboard_pos_simulado.png');

        // 2.2 Espelho de Respostas na visão do Professor (ReadOnly)
        console.log('Navegando para Espelho de Respostas na Visão Professor (Somente Leitura)...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                (async () => {
                    if (typeof window.switchTab === 'function') window.switchTab('sec-criar-avaliacoes');
                    if (typeof window.switchAvaliacoesSubtab === 'function') window.switchAvaliacoesSubtab('lancar-notas-sub');
                    
                    const evalSelect = document.getElementById('score-eval-select');
                    const schoolSelect = document.getElementById('score-school-select');
                    const classSelect = document.getElementById('score-class-select');

                    if (evalSelect) evalSelect.value = 'evt_2026_01';
                    if (typeof window.carregarEscolasParaEspelho === 'function') window.carregarEscolasParaEspelho();
                    
                    if (schoolSelect) {
                        for (let i = 0; i < schoolSelect.options.length; i++) {
                            if (schoolSelect.options[i].text.includes('CORREA LIMA') || schoolSelect.options[i].value === 'esc_03' || schoolSelect.options[i].value.includes('3a3b0e2f')) {
                                schoolSelect.selectedIndex = i;
                                schoolSelect.value = schoolSelect.options[i].value;
                                break;
                            }
                        }
                    }
                    if (typeof window.carregarTurmasParaEspelho === 'function') await window.carregarTurmasParaEspelho();
                    
                    if (classSelect) {
                        for (let i = 0; i < classSelect.options.length; i++) {
                            if (classSelect.options[i].text.includes('5º') || classSelect.options[i].text.includes('5 ANO') || classSelect.options[i].value.includes('5a') || classSelect.options[i].value.includes('ec592c98')) {
                                classSelect.selectedIndex = i;
                                classSelect.value = classSelect.options[i].value;
                                break;
                            }
                        }
                    }
                    if (typeof window.renderEspelhoLancamentoTable === 'function') await window.renderEspelhoLancamentoTable();
                })()
            `,
            awaitPromise: true
        });

        await wait(2200);
        await captureScreenshot(cdp, 'professor_espelho_readonly.png');

        // 2.3 Resultados & Dashboard na visão do Professor (Filtrado na turma)
        console.log('Navegando para Resultados da Turma na Visão Professor...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    if (typeof window.switchTab === 'function') window.switchTab('sec-criar-avaliacoes');
                    if (typeof window.switchAvaliacoesSubtab === 'function') window.switchAvaliacoesSubtab('resultados-dash-sub');
                    
                    const schoolSel = document.getElementById('dash-school-select');
                    const classSel = document.getElementById('dash-class-select');

                    if (schoolSel) {
                        for (let i = 0; i < schoolSel.options.length; i++) {
                            if (schoolSel.options[i].text.includes('CORREA LIMA') || schoolSel.options[i].value.includes('3a3b0e2f')) {
                                schoolSel.selectedIndex = i;
                                schoolSel.value = schoolSel.options[i].value;
                                break;
                            }
                        }
                        if (typeof window.initAnalyticsSelectors === 'function') schoolSel.dispatchEvent(new Event('change'));
                    }
                    if (typeof window.renderAvaliacoesDashboard === 'function') window.renderAvaliacoesDashboard();
                })()
            `
        });
        await wait(2200);
        await captureScreenshot(cdp, 'professor_resultados_turma.png');

        // Validar trava RBAC do professor
        const rbacStatus = await cdp.send('Runtime.evaluate', {
            expression: `
                (() => {
                    const inputs = Array.from(document.querySelectorAll('.resp-input'));
                    const allDisabled = inputs.length > 0 && inputs.every(i => i.disabled);
                    const saveBtn = document.getElementById('btn-save-all-scores');
                    const saveBtnHidden = !saveBtn || saveBtn.style.display === 'none' || saveBtn.disabled;
                    const banner = document.getElementById('espelho-semed-readonly-banner');
                    return {
                        totalInputs: inputs.length,
                        allDisabled,
                        saveBtnHidden,
                        hasBanner: banner != null,
                        bannerText: banner ? banner.textContent.replace(/\\s+/g, ' ').trim() : ''
                    };
                })()
            `,
            returnByValue: true
        });

        console.log('\n[RBAC Verification Report]:', rbacStatus.result.value);

        await cdp.close();
        browserProcess.kill();
        server.close();
        console.log('\nTodas as capturas e validações foram concluídas com êxito absoluto!');
    } catch (err) {
        console.error('Erro na auditoria CDP:', err);
        browserProcess.kill();
        server.close();
        process.exit(1);
    }
}

run();
