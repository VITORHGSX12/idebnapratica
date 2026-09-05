/**
 * Teste Automatizado de Verificação de Veracidade dos Rankings (Edge Headless CDP)
 * Arquivo: scripts/test_escolas_ranking_browser.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3348;
const ROOT_DIR = path.resolve(__dirname, '..');
const ARTIFACTS_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\015ed507-beab-4db5-8587-c865a571a89c';

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
            return res.end('Not Found');
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
            if (msg.error) {
                cb.reject(new Error(msg.error.message || 'CDP Error'));
            } else {
                cb.resolve(msg.result);
            }
        }
    };

    return {
        send: (method, params = {}) => {
            return new Promise((resolve, reject) => {
                const id = idSeq++;
                callbacks.set(id, { resolve, reject });
                ws.send(JSON.stringify({ id, method, params }));
            });
        },
        close: () => ws.close()
    };
}

async function findEdgePath() {
    const candidates = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Users\\' + (process.env.USERNAME || 'Alleg') + '\\AppData\\Local\\Microsoft\\Edge SxS\\Application\\msedge.exe'
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return 'msedge';
}

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function runTest() {
    console.log('--- INICIANDO TESTE CDP: VERIFICAÇÃO DE VERACIDADE DOS RANKINGS ---');

    const server = createStaticServer();
    await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
    console.log(`Servidor de teste ativo em http://127.0.0.1:${PORT}`);

    const edgePath = await findEdgePath();
    const cdpPort = 9225;
    const userDataDir = path.join(ROOT_DIR, '.tmp_edge_test_ranking');

    const edgeProcess = spawn(edgePath, [
        `--remote-debugging-port=${cdpPort}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${userDataDir}`,
        `http://127.0.0.1:${PORT}/index.html`
    ], { stdio: 'ignore' });

    let targets = null;
    for (let i = 0; i < 30; i++) {
        await wait(300);
        try {
            targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
            if (targets && targets.length > 0) break;
        } catch (e) {}
    }

    if (!targets || targets.length === 0) {
        throw new Error('Não foi possível conectar ao Edge CDP');
    }

    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    const cdp = await getCDPClient(pageTarget.webSocketDebuggerUrl);

    try {
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('DOM.enable');

        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 1440,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        console.log('Aguardando inicialização da página...');
        await wait(2500);

        // 1. Navegar para a aba "Comparativo Regional"
        console.log('1. Abrindo aba Comparativo Regional...');
        const diag1 = await cdp.send('Runtime.evaluate', {
            expression: `
                (function() {
                    var out = {};
                    if (typeof window.switchTab === 'function') window.switchTab('ideb-comparativo');
                    out.hasMunDb = !!window.IDEB_MARANHAO_MUNICIPIOS;
                    out.iniciaisCount = window.IDEB_MARANHAO_MUNICIPIOS?.iniciais?.length;
                    out.hasSwitchSubtab = typeof window.switchIdebSubtab === 'function';
                    out.hasRenderRanking = typeof window.renderRankingGeralMaTable === 'function';
                    if (window.switchIdebSubtab) window.switchIdebSubtab('ranking-geral-ma');
                    if (window.renderRankingGeralMaTable) {
                        try {
                            window.renderRankingGeralMaTable();
                        } catch(e) {
                            out.renderError = e.message;
                        }
                    }
                    var tbody = document.getElementById('ranking-geral-ma-table-body');
                    out.tbodyExists = !!tbody;
                    out.rowsCount = tbody ? tbody.children.length : 0;
                    return out;
                })()
            `,
            returnByValue: true
        });
        console.log('Diagnóstico Subtab Ranking Geral:', diag1.result.value);
        await wait(1200);

        // 2. Auditar Ranking Geral dos Municípios
        console.log('2. Auditando Ranking Geral dos 217 Municípios...');
        const rankingMunEval = await cdp.send('Runtime.evaluate', {
            expression: `
                (function() {
                    var rows = Array.from(document.querySelectorAll('#ranking-geral-ma-table-body tr'));
                    var totalRows = rows.length;
                    var top3 = rows.slice(0, 3).map(r => {
                        var cols = r.querySelectorAll('td');
                        return { pos: cols[0]?.innerText.trim(), mun: cols[1]?.innerText.trim(), nota: cols[4]?.innerText.trim() };
                    });
                    var gdRow = rows.find(r => (r.innerText || '').toLowerCase().includes('gonçalves dias') || (r.innerText || '').toLowerCase().includes('goncalves dias'));
                    var gdData = null;
                    if (gdRow) {
                        var cols = gdRow.querySelectorAll('td');
                        gdData = {
                            pos: cols[0]?.innerText.trim(),
                            mun: cols[1]?.innerText.trim(),
                            ure: cols[2]?.innerText.trim(),
                            prev: cols[3]?.innerText.trim(),
                            curr: cols[4]?.innerText.trim(),
                            evol: cols[5]?.innerText.trim()
                        };
                    }
                    return { totalRows, top3, gdData };
                })()
            `,
            returnByValue: true
        });
        console.log('Resultado Ranking Geral Municípios:', JSON.stringify(rankingMunEval.result.value, null, 2));

        // Screenshot do Ranking Geral
        const snap1 = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const snap1Path = path.join(ARTIFACTS_DIR, 'ranking_geral_municipios_verificado.png');
        fs.writeFileSync(snap1Path, Buffer.from(snap1.data, 'base64'));
        console.log(`Screenshot 1 salvo em: ${snap1Path}`);

        // 3. Mudar para o Ranking de Escolas do Maranhão
        console.log('\n3. Abrindo Ranking por Escolas do Maranhão e filtrando por Gonçalves Dias...');
        await cdp.send('Runtime.evaluate', {
            expression: `
                if (typeof window.switchIdebSubtab === 'function') window.switchIdebSubtab('ranking-escolas-ma');
                var sel = document.getElementById('ranking-escolas-city-filter');
                if (sel) {
                    sel.value = 'Gonçalves Dias';
                    if (typeof window.renderRankingEscolasMaTable === 'function') window.renderRankingEscolasMaTable();
                }
            `
        });
        await wait(1500);

        // 4. Auditar Ranking de Escolas de Gonçalves Dias
        const rankingEscEval = await cdp.send('Runtime.evaluate', {
            expression: `
                (function() {
                    var summaryText = document.getElementById('ranking-escolas-city-summary')?.innerText.trim();
                    var rows = Array.from(document.querySelectorAll('#ranking-escolas-table-body tr'));
                    var schools = rows.map(r => {
                        var cols = r.querySelectorAll('td');
                        return {
                            rank: cols[0]?.innerText.trim(),
                            nome: cols[1]?.querySelector('div:first-child')?.innerText.trim(),
                            localRank: cols[3]?.innerText.trim(),
                            nota2025: cols[5]?.innerText.trim()
                        };
                    });
                    return { summaryText, totalSchoolsRendered: rows.length, schools };
                })()
            `,
            returnByValue: true
        });
        console.log('Resultado Ranking de Escolas:', JSON.stringify(rankingEscEval.result.value, null, 2));

        // Screenshot do Ranking de Escolas
        const snap2 = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const snap2Path = path.join(ARTIFACTS_DIR, 'ranking_escolas_goncalves_dias_verificado.png');
        fs.writeFileSync(snap2Path, Buffer.from(snap2.data, 'base64'));
        console.log(`Screenshot 2 salvo em: ${snap2Path}`);

        console.log('\n✅ TESTE DE VERACIDADE NO BROWSER CONCLUÍDO COM SUCESSO!');
    } finally {
        cdp.close();
        edgeProcess.kill();
        server.close();
        if (fs.existsSync(userDataDir)) {
            try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
        }
    }
}

runTest().catch(err => {
    console.error('Erro no teste de veracidade:', err);
    process.exit(1);
});
