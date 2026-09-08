const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const server = http.createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p === '/') p = '/index.html';
    const f = path.join(__dirname, '..', p);
    if (fs.existsSync(f)) {
        res.writeHead(200);
        fs.createReadStream(f).pipe(res);
    } else res.end();
});

server.listen(8098, async () => {
    const browser = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
        '--remote-debugging-port=9278', '--headless=new', '--user-data-dir=' + path.join(__dirname, '..', '.temp_diag_nav2')
    ]);
    await new Promise(r => setTimeout(r, 2000));
    const tg = await fetch('http://127.0.0.1:9278/json').then(r => r.json());
    const ws = new WebSocket(tg[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);
    let idSeq = 1;
    const send = (m, p = {}) => new Promise(res => {
        const id = idSeq++;
        const h = ev => { const msg = JSON.parse(ev.data); if (msg.id === id) { ws.removeEventListener('message', h); res(msg.result); } };
        ws.addEventListener('message', h);
        ws.send(JSON.stringify({ id, method: m, params: p }));
    });
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:8098/index.html' });
    await new Promise(r => setTimeout(r, 1000));
    await send('Runtime.evaluate', {
        expression: `
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('login-transition-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'flex';
        `
    });
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    await new Promise(r => setTimeout(r, 500));
    const res = await send('Runtime.evaluate', {
        expression: `(() => {
            const nav = document.querySelector('.top-navbar');
            const left = document.querySelector('.navbar-left');
            const right = document.querySelector('.navbar-right');
            return {
                navOuterHTML: nav ? nav.outerHTML.slice(0, 300) : null,
                navRect: nav ? nav.getBoundingClientRect() : null,
                leftRect: left ? left.getBoundingClientRect() : null,
                leftStyle: left ? {
                    display: getComputedStyle(left).display,
                    visibility: getComputedStyle(left).visibility,
                    width: getComputedStyle(left).width
                } : null,
                rightRect: right ? right.getBoundingClientRect() : null,
                rightStyle: right ? {
                    display: getComputedStyle(right).display,
                    visibility: getComputedStyle(right).visibility,
                    width: getComputedStyle(right).width
                } : null
            };
        })()`,
        returnByValue: true
    });
    console.log(JSON.stringify(res.result.value, null, 2));
    browser.kill();
    server.close();
    process.exit(0);
});
