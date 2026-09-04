const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const PORT = 3340;
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
    console.log('--- Iniciando Teste de Auditoria e Correção: Botão "Ver Turma (N)" ---');
    await new Promise(resolve => server.listen(PORT, resolve));
    console.log(`Servidor local rodando em http://127.0.0.1:${PORT}`);

    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const remotePort = 9225;
    const userDataDir = path.join(rootDir, '.temp_edge_user_data_turmas');

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
        const versionInfo = await getJson(`http://127.0.0.1:${remotePort}/json/version`);
        console.log('Edge CDP conectado:', versionInfo['Browser']);

        const targets = await getJson(`http://127.0.0.1:${remotePort}/json/list`);
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('Nenhuma aba encontrada!');

        const cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
        await cdp.connect();
        console.log('WebSocket CDP conectado à página.');

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        await sleep(1500);

        // 0. Login Bypass
        console.log('Realizando login session...');
        await cdp.evaluate(`
            (function() {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'Master Admin');
                sessionStorage.setItem('userEmail', 'admin@goncalvesdias.ma.gov.br');
                
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
        await sleep(1500);

        // 1. Abrir o painel de Escolas da Rede
        console.log('Navegando para o módulo Escolas da Rede...');
        const navRes = await cdp.evaluate(`
            (function() {
                if (typeof window.switchTab === 'function') {
                    window.switchTab('escolas-panel');
                    return { success: true, tab: 'escolas-panel' };
                }
                return { success: false };
            })()
        `);
        console.log('Resultado da navegação:', navRes);
        await sleep(1500);

        // 2. Abrir o Workspace da Escola "UE ANITA FURTADO"
        console.log('Abrindo Workspace da Escola...');
        const schoolRes = await cdp.evaluate(`
            (function() {
                var schools = typeof getOfficialSchoolsState === 'function' ? getOfficialSchoolsState() : [];
                var schoolName = (schools.length > 0 && (schools[0].name || schools[0].nome)) ? (schools[0].name || schools[0].nome) : 'UE ANITA FURTADO';
                if (typeof window.openSchoolDetailView === 'function') {
                    window.openSchoolDetailView(schoolName);
                    return { success: true, schoolName: schoolName };
                }
                if (typeof window.openSchoolWorkspace === 'function') {
                    window.openSchoolWorkspace(schoolName);
                    return { success: true, schoolName: schoolName };
                }
                return { success: false, err: 'openSchoolDetailView não disponível' };
            })()
        `);
        console.log('Workspace aberto para:', schoolRes);
        await sleep(1500);

        // 3. Alternar para a sub-aba "turmas"
        console.log('Alternando para sub-aba "Turmas"...');
        const tabTurmasRes = await cdp.evaluate(`
            (function() {
                if (typeof window.switchSchoolInnerTab === 'function') {
                    window.switchSchoolInnerTab('turmas');
                    return { success: true, tab: 'turmas' };
                }
                var btn = document.querySelector('[onclick*="switchSchoolInnerTab(\\\'turmas\\\')"]');
                if (btn) { btn.click(); return { success: true, clicked: true }; }
                return { success: false };
            })()
        `);
        console.log('Sub-aba Turmas:', tabTurmasRes);
        await sleep(1500);

        const diag = await cdp.evaluate(`
            (function() {
                var c = document.getElementById('school-inner-tab-content-container');
                var cur = window.currentSelectedSchoolDetail;
                var classes = typeof getOfficialClassesState === 'function' ? getOfficialClassesState() : [];
                return {
                    hasContainer: !!c,
                    containerHtmlSnippet: c ? c.innerHTML.substring(0, 300) : null,
                    currentSchool: cur,
                    totalClasses: classes.length,
                    firstClass: classes[0]
                };
            })()
        `);
        console.log('Diagnóstico do DOM:', diag);

        // Executar e capturar erro explícito
        const execRes = await cdp.evaluate(`
            (function() {
                try {
                    var school = window.currentSelectedSchoolDetail || 'UE ANITA FURTADO';
                    if (typeof window.renderSchoolClassesTab !== 'function') {
                        return { ok: false, err: 'window.renderSchoolClassesTab is not a function' };
                    }
                    window.renderSchoolClassesTab(school);
                    return { ok: true, school: school };
                } catch(e) {
                    return { ok: false, err: e.message, stack: e.stack };
                }
            })()
        `);
        console.log('Resultado da execução de renderSchoolClassesTab:', execRes);
        await sleep(1000);

        // 4. Inspecionar os cards de turma renderizados e seus botões "Ver Turma"
        const cardsCheck = await cdp.evaluate(`
            (function() {
                var buttons = Array.from(document.querySelectorAll('.btn-ver-turma'));
                return buttons.map(function(b, idx) {
                    return {
                        index: idx,
                        text: b.textContent.trim(),
                        dataClassId: b.getAttribute('data-class-id'),
                        dataClassName: b.getAttribute('data-class-name'),
                        dataSchoolName: b.getAttribute('data-school-name')
                    };
                });
            })()
        `);
        console.log('Botões "Ver Turma" encontrados:', cardsCheck.length);
        console.log('Detalhes dos 3 primeiros botões:', cardsCheck.slice(0, 3));

        if (cardsCheck.length === 0) {
            const innerFull = await cdp.evaluate(`document.getElementById('school-inner-tab-content-container') ? document.getElementById('school-inner-tab-content-container').innerHTML : 'none'`);
            console.log('Conteúdo completo do container:', innerFull);
            throw new Error('Nenhum botão .btn-ver-turma foi encontrado na aba Turmas!');
        }

        // 5. Clicar no primeiro botão "Ver Turma"
        console.log('Disparando clique no botão .btn-ver-turma da turma:', cardsCheck[0].dataClassName);
        const clickRes = await cdp.evaluate(`
            (function() {
                var btn = document.querySelector('.btn-ver-turma');
                if (!btn) return { clicked: false, err: 'btn not found' };
                btn.click();
                return {
                    clicked: true,
                    targetTurma: btn.getAttribute('data-class-name')
                };
            })()
        `);
        console.log('Clique disparado:', clickRes);
        await sleep(1500);

        // 6. Validar o estado do Modal #modal-view-class-students
        const modalState = await cdp.evaluate(`
            (function() {
                var modal = document.getElementById('modal-view-class-students');
                if (!modal) return { exists: false };
                var title = document.getElementById('view-class-title');
                var subtitle = document.getElementById('view-class-subtitle');
                var footerCount = document.getElementById('view-class-footer-count');
                var rows = Array.from(document.querySelectorAll('#view-class-students-tbody tr'));
                var btnInTab = document.getElementById('btn-view-class-in-school-tab');

                return {
                    exists: true,
                    display: modal.style.display,
                    hasHiddenClass: modal.classList.contains('hidden'),
                    title: title ? title.textContent.trim() : null,
                    subtitle: subtitle ? subtitle.textContent.trim() : null,
                    footerCount: footerCount ? footerCount.textContent.trim() : null,
                    studentRowsCount: rows.length,
                    firstRowText: rows.length > 0 ? rows[0].textContent.trim().replace(/\\s+/g, ' ') : null,
                    btnInTabExists: !!btnInTab
                };
            })()
        `);
        console.log('Estado do Modal após clique:', modalState);

        if (modalState.display !== 'flex' || modalState.hasHiddenClass) {
            throw new Error('Falha: O modal #modal-view-class-students não ficou visível (display !== flex)!');
        }

        if (modalState.studentRowsCount === 0) {
            throw new Error('Falha: Nenhuma linha de aluno renderizada no modal!');
        }

        console.log('SUCESSO: Modal abriu perfeitamente com', modalState.studentRowsCount, 'alunos!');

        // 7. Tirar Screenshot de Comprovação
        const screenshotRes = await cdp.send('Page.captureScreenshot', {
            format: 'png',
            quality: 100
        });

        const screenshotPath = path.join(artifactDir, 'turmas_ver_turma_modal_aberto.png');
        fs.writeFileSync(screenshotPath, Buffer.from(screenshotRes.data, 'base64'));
        console.log('Screenshot salvo em:', screenshotPath);

        // 8. Testar o botão "Ver na Tabela da Escola"
        console.log('Testando clique no botão "Ver na Tabela da Escola"...');
        const clickTabRes = await cdp.evaluate(`
            (function() {
                var btn = document.getElementById('btn-view-class-in-school-tab');
                if (!btn) return { exists: false };
                btn.click();
                return { clicked: true };
            })()
        `);
        await sleep(1000);

        const afterTabSwitch = await cdp.evaluate(`
            (function() {
                var modal = document.getElementById('modal-view-class-students');
                var modalClosed = modal ? (modal.style.display === 'none' || modal.classList.contains('hidden')) : true;
                var activeTabBtn = document.querySelector('.school-nav-tab-btn.active');
                var activeTabName = activeTabBtn ? activeTabBtn.getAttribute('data-tab') : null;
                var classFilter = document.getElementById('school-students-class-filter');
                var selectedClassFilter = classFilter ? classFilter.value : null;

                return {
                    modalClosed: modalClosed,
                    activeTabName: activeTabName,
                    selectedClassFilter: selectedClassFilter
                };
            })()
        `);
        console.log('Estado após navegar para tabela da escola:', afterTabSwitch);

        if (!afterTabSwitch.modalClosed || afterTabSwitch.activeTabName !== 'alunos') {
            throw new Error('Falha ao navegar para sub-aba Alunos via botão do modal!');
        }
        console.log('SUCESSO TOTAL: Todos os fluxos do botão "Ver Turma (N)" testados e validados!');

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
    console.error('Erro no teste:', err);
    process.exit(1);
});
