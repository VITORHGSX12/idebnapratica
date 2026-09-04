/**
 * DIAGNÓSTICO FORENSE: CADASTRO DE USUÁRIOS EM PRODUÇÃO & RUNTIME
 */
const { spawn } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9334;

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
        this.consoleLogs = [];
        this.pageErrors = [];
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
                } else if (data.method === 'Runtime.consoleAPICalled') {
                    const text = data.params.args.map(a => a.value || a.description || '').join(' ');
                    this.consoleLogs.push(`[${data.params.type}] ${text}`);
                } else if (data.method === 'Runtime.exceptionThrown') {
                    this.pageErrors.push(data.params.exceptionDetails.text + ' ' + (data.params.exceptionDetails.exception ? data.params.exceptionDetails.exception.description : ''));
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

async function diagnose() {
    console.log('Iniciando diagnóstico via Edge Headless na Vercel...');

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
        if (!target) throw new Error('Alvo não encontrado');

        client = new CdpClient(target.webSocketDebuggerUrl);
        await client.connect();
        await client.send('Page.enable');
        await client.send('Runtime.enable');

        // Aguarda carregamento de todos os scripts
        for (let i = 0; i < 30; i++) {
            const ready = await client.evaluate(`typeof window.openCreateUserModal === 'function' && document.readyState === 'complete'`);
            if (ready) break;
            await sleep(500);
        }

        console.log('\n--- 1. Verificação das Funções Globais no Navegador ---');
        const globalsCheck = await client.evaluate(`
            JSON.stringify({
                hasOpenCreateUserModal: typeof window.openCreateUserModal === 'function',
                hasHandleSaveNewUser: typeof window.handleSaveNewUser === 'function',
                hasGetStoredUsers: typeof window.getStoredUsers === 'function',
                hasRenderUsersList: typeof window.renderUsersList === 'function',
                hasCloseModal: typeof window.closeModal === 'function',
                hasGenerateAutoCredentials: typeof window.generateAutoCredentials === 'function'
            })
        `);
        console.log('Funções globais:', globalsCheck);

        console.log('\n--- 2. Verificação de Elementos DOM Duplicados ou Conflitantes ---');
        const domCheck = await client.evaluate(`
            JSON.stringify({
                createUserModalCount: document.querySelectorAll('#create-user-modal').length,
                createUserFormCount: document.querySelectorAll('#create-user-form').length,
                newUserNameCount: document.querySelectorAll('#new-user-name').length,
                btnOpenModalExists: !!document.getElementById('btn-open-create-user-modal'),
                userTableRowsCount: document.querySelectorAll('#users-table-body tr').length
            })
        `);
        console.log('Contagem DOM:', domCheck);

        console.log('\n--- 3. Autenticação e Navegação para #admin-panel ---');
        const navResult = await client.evaluate(`
            (function() {
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userRole', 'Master Admin');
                sessionStorage.setItem('userEmail', 'admin@goncalvesdias.ma.gov.br');
                if (typeof window.checkAuthSession === 'function') window.checkAuthSession();
                if (typeof window.switchTab === 'function') window.switchTab('admin-panel');
                return {
                    currentTab: document.getElementById('admin-panel') ? document.getElementById('admin-panel').classList.contains('active') : false,
                    btnDisplay: document.getElementById('btn-open-create-user-modal') ? document.getElementById('btn-open-create-user-modal').style.display : 'none'
                };
            })()
        `);
        console.log('Navegação para admin-panel:', navResult);

        console.log('\n--- 4. Disparo do Clique em "+ Cadastrar Novo Usuário" ---');
        const clickResult = await client.evaluate(`
            (function() {
                var btn = document.getElementById('btn-open-create-user-modal');
                if (!btn) return 'Botão não encontrado';
                btn.click();
                
                var modal = document.getElementById('create-user-modal');
                if (!modal) return 'Modal não encontrado';

                return {
                    modalDisplay: modal.style.display,
                    modalClassList: modal.className,
                    isHidden: modal.classList.contains('hidden'),
                    nameVal: document.getElementById('new-user-name') ? document.getElementById('new-user-name').value : null,
                    emailVal: document.getElementById('new-user-email') ? document.getElementById('new-user-email').value : null,
                    passVal: document.getElementById('new-user-password') ? document.getElementById('new-user-password').value : null
                };
            })()
        `);
        console.log('Estado do modal após clique:', clickResult);

        console.log('\n--- 5. Teste de Clique Físico no Botão de Submit ---');
        const submitClickResult = await client.evaluate(`
            (function() {
                var modal = document.getElementById('create-user-modal');
                var nameInput = document.getElementById('new-user-name');
                var cpfInput = document.getElementById('new-user-cpf');
                var emailInput = document.getElementById('new-user-email');
                var passInput = document.getElementById('new-user-password');
                var submitBtn = modal.querySelector('button[type="submit"]');

                if (!submitBtn) return { error: 'Botão submit não encontrado no modal' };

                // Teste A: Sem preencher CPF (apenas Nome, Email, Senha)
                nameInput.value = 'Prof. Teste Sem Cpf';
                cpfInput.value = ''; // Vazio
                emailInput.value = 'prof.semcpf@goncalvesdias.ma.gov.br';
                passInput.value = 'Gondias@2026';

                var form = document.getElementById('create-user-form');
                var isFormValidA = form.checkValidity();
                var cpfValidationMsg = cpfInput.validationMessage;

                // Teste B: Preenchendo CPF e clicando no botão de submit físico
                cpfInput.value = '098.765.432-11';
                nameInput.value = 'Prof. Teste Com Cpf';
                emailInput.value = 'prof.comcpf@goncalvesdias.ma.gov.br';
                var isFormValidB = form.checkValidity();

                submitBtn.click();

                var stored = window.getStoredUsers ? window.getStoredUsers() : [];
                var foundB = stored.some(u => u.email === 'prof.comcpf@goncalvesdias.ma.gov.br');

                return {
                    semCpfValid: isFormValidA,
                    semCpfMsg: cpfValidationMsg,
                    comCpfValid: isFormValidB,
                    submitedAndFound: foundB,
                    modalHiddenAfterSubmit: modal.classList.contains('hidden') || modal.style.display === 'none'
                };
            })()
        `);
        console.log('Validação do formulário com e sem CPF:', submitClickResult);

        console.log('\n--- 6. Logs e Erros Capturados no Console ---');
        console.log('Erros de página:', client.pageErrors);
        console.log('Console logs recentes:', client.consoleLogs.slice(-10));

    } catch (err) {
        console.error('Falha no diagnóstico:', err);
    } finally {
        if (client) client.close();
        browserProc.kill();
    }
}

diagnose();
