const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'C:\\Users\\Alleg\\.gemini\\antigravity-ide\\brain\\a43b0565-56ad-4732-97a0-6687c6b9fce6\\screenshots';

async function run() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log('Iniciando Edge headless para captura de telas...');
    const browser = await puppeteer.launch({
        executablePath: EDGE_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    // 1. Tela de Login (para capturar o selo da marca)
    console.log('1. Navegando para a Tela de Login...');
    await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));

    const shotLogin = path.join(OUTPUT_DIR, '01_login_brand_identity.png');
    await page.screenshot({ path: shotLogin, fullPage: false });
    console.log('   ✓ Screenshot 1 salvo:', shotLogin);

    // 2. Definir Sessão Autenticada e Carregar Dashboard
    console.log('2. Inicializando Sessão Autenticada no Dashboard...');
    await page.evaluate(() => {
        const userObj = {
            id: 'usr_admin',
            nome: 'Gestor Municipal',
            email: 'admin@goncalvesdias.ma.gov.br',
            role: 'Administrador (SEMED)',
            subRole: 'Secretaria Municipal de Educação • Gonçalves Dias',
            escola: 'SEMED Gonçalves Dias',
            turma: 'Todas as Turmas',
            avatar: '🧑‍💼'
        };
        localStorage.setItem('auth_token', 'token_demo_admin_2026');
        localStorage.setItem('current_user', JSON.stringify(userObj));
        localStorage.setItem('activeUser', JSON.stringify(userObj));
        if (typeof window.applyAuthenticatedUser === 'function') {
            window.applyAuthenticatedUser(userObj);
        }
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
            loginScreen.classList.add('hidden');
        }
        const app = document.querySelector('.app-container');
        if (app) {
            app.style.display = 'flex';
            app.classList.remove('hidden');
        }
    });

    await new Promise(r => setTimeout(r, 1200));

    // 3. Dashboard com Sidebar Expandida e Navbar Oficial
    console.log('3. Capturando Dashboard com Sidebar Expandida e Top Navbar...');
    const shotDashboard = path.join(OUTPUT_DIR, '02_dashboard_sidebar_and_navbar.png');
    await page.screenshot({ path: shotDashboard, fullPage: false });
    console.log('   ✓ Screenshot 2 salvo:', shotDashboard);

    // 4. Sidebar Compacta (Modo Colapsado)
    console.log('4. Recolhendo a Sidebar (Modo Compacto)...');
    await page.click('#sidebar-collapse-toggle');
    await new Promise(r => setTimeout(r, 600));
    const shotCompact = path.join(OUTPUT_DIR, '03_sidebar_compact_symbol.png');
    await page.screenshot({ path: shotCompact, fullPage: false });
    console.log('   ✓ Screenshot 3 salvo:', shotCompact);

    // 5. Expandir novamente e Alternar para Modo Noturno (Dark Mode)
    console.log('5. Expandindo e alternando para Dark Mode...');
    await page.click('#sidebar-collapse-toggle');
    await new Promise(r => setTimeout(r, 400));
    await page.click('#theme-btn-dark');
    await new Promise(r => setTimeout(r, 600));
    const shotDarkMode = path.join(OUTPUT_DIR, '04_dark_mode_brand_navbar.png');
    await page.screenshot({ path: shotDarkMode, fullPage: false });
    console.log('   ✓ Screenshot 4 salvo:', shotDarkMode);

    // 6. Navegar para o Módulo SAEB & Intervenções
    console.log('6. Navegando para o módulo SAEB & Intervenções...');
    await page.evaluate(() => {
        if (typeof window.switchTab === 'function') {
            window.switchTab('saeb-painel');
        }
    });
    await new Promise(r => setTimeout(r, 800));
    const shotSaeb = path.join(OUTPUT_DIR, '05_saeb_modulo_painel.png');
    await page.screenshot({ path: shotSaeb, fullPage: false });
    console.log('   ✓ Screenshot 5 salvo:', shotSaeb);

    await browser.close();
    console.log('Todas as capturas foram concluídas com sucesso!');
}

run().catch(err => {
    console.error('Erro na captura:', err);
    process.exit(1);
});
