const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureTabHeaders() {
    const artifactDir = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\a43b0565-56ad-4732-97a0-6687c6b9fce6\\screenshots';
    if (!fs.existsSync(artifactDir)) {
        fs.mkdirSync(artifactDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });

    // Fazer login como gestor
    await page.evaluate(() => {
        if (typeof window.loginAsRole === 'function') {
            window.loginAsRole('gestor');
        } else if (typeof window.handleMockLogin === 'function') {
            window.handleMockLogin('gestor@goncalvesdias.ma.gov.br', 'admin123');
        }
    });
    await new Promise(r => setTimeout(r, 1200));

    const tabsToCapture = [
        { id: 'escolas-panel', filename: 'tab_header_01_escolas.png' },
        { id: 'alunos-panel', filename: 'tab_header_02_alunos.png' },
        { id: 'metas-ideb', filename: 'tab_header_03_metas.png' },
        { id: 'cronograma-habilidades', filename: 'tab_header_04_cronograma.png' },
        { id: 'biblioteca-recursos', filename: 'tab_header_05_biblioteca.png' },
        { id: 'admin-panel', filename: 'tab_header_06_admin.png' }
    ];

    for (const tab of tabsToCapture) {
        await page.evaluate((tabId) => {
            if (typeof window.switchTab === 'function') {
                window.switchTab(tabId);
            } else if (typeof window.navigateToTab === 'function') {
                window.navigateToTab(tabId);
            }
        }, tab.id);

        await new Promise(r => setTimeout(r, 800));
        const outPath = path.join(artifactDir, tab.filename);
        await page.screenshot({ path: outPath });
        console.log(`[OK] Screenshot salvo: ${tab.filename}`);
    }

    await browser.close();
    console.log('Todos os screenshots foram gerados com sucesso!');
}

captureTabHeaders().catch(console.error);
