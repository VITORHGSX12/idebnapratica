const puppeteer = require('puppeteer');
const path = require('path');

async function testUnifiedGestaoPedagogica() {
    console.log('================================================================');
    console.log('TESTE DE BROWSER: UNIFICAÇÃO GESTÃO & LAUDOS PEDAGÓGICOS');
    console.log('================================================================\n');

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    const indexPath = 'file://' + path.resolve(__dirname, '../index.html').replace(/\\/g, '/');
    await page.goto(indexPath, { waitUntil: 'networkidle0' });

    // 1. Verificar login
    console.log('1. Autenticando com perfil SEMED...');
    await page.evaluate(() => {
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'Master Admin');
        if (typeof checkAuthOnLoad === 'function') checkAuthOnLoad();
        if (typeof switchTab === 'function') switchTab('gestao-pedagogica');
    });
    await new Promise(r => setTimeout(r, 600));

    // 2. Verificar sub-abas presentes
    console.log('2. Verificando as 4 sub-abas no DOM...');
    const subtabs = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('#gestao-pedagogica .pedagogic-subtab-btn'));
        return btns.map(b => ({
            id: b.getAttribute('data-subtab'),
            text: b.innerText.trim(),
            active: b.classList.contains('active')
        }));
    });

    console.log('   Sub-abas encontradas:', subtabs);
    if (subtabs.length !== 4) {
        throw new Error(`Esperado 4 sub-abas, encontrado ${subtabs.length}`);
    }

    // 3. Testar clique na sub-aba Laudo Técnico & Diagnóstico
    console.log('3. Clicando na sub-aba "Laudo Técnico & Diagnóstico"...');
    await page.evaluate(() => {
        const laudoBtn = document.querySelector('.pedagogic-subtab-btn[data-subtab="laudo-diagnostico-sub"]');
        if (laudoBtn) laudoBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const isLaudoVisible = await page.evaluate(() => {
        const laudoDiv = document.getElementById('laudo-diagnostico-sub');
        const results = document.getElementById('diagnostico-results-container');
        return laudoDiv && !laudoDiv.classList.contains('hidden') && results !== null;
    });
    console.log('   Laudo visível:', isLaudoVisible ? 'SIM ✓' : 'NÃO ✗');
    if (!isLaudoVisible) throw new Error('Sub-aba de laudo não foi exibida corretamente');

    // 4. Testar clique nas demais sub-abas
    console.log('4. Alternando entre as demais sub-abas...');
    for (const sub of ['planos-intervencao-sub', 'comparativo-saeb-sub', 'niveis-saeb-sub']) {
        await page.evaluate((id) => {
            const btn = document.querySelector(`.pedagogic-subtab-btn[data-subtab="${id}"]`);
            if (btn) btn.click();
        }, sub);
        await new Promise(r => setTimeout(r, 300));
        const isVisible = await page.evaluate((id) => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        }, sub);
        console.log(`   Sub-aba ${sub}:`, isVisible ? 'Ativa com sucesso ✓' : 'FALHA ✗');
        if (!isVisible) throw new Error(`Falha ao ativar sub-aba ${sub}`);
    }

    // 5. Testar retrocompatibilidade do link legado 'relatorios-monitoramento'
    console.log('5. Testando retrocompatibilidade de rota switchTab("relatorios-monitoramento")...');
    await page.evaluate(() => {
        if (typeof switchTab === 'function') switchTab('relatorios-monitoramento');
    });
    await new Promise(r => setTimeout(r, 400));

    const aliasCheck = await page.evaluate(() => {
        const gestaoSec = document.getElementById('gestao-pedagogica');
        const isGestaoActive = gestaoSec && gestaoSec.classList.contains('active');
        const laudoSub = document.getElementById('laudo-diagnostico-sub');
        const isLaudoActive = laudoSub && !laudoSub.classList.contains('hidden');
        return { isGestaoActive, isLaudoActive };
    });

    console.log('   Retrocompatibilidade:', aliasCheck);
    if (!aliasCheck.isGestaoActive || !aliasCheck.isLaudoActive) {
        throw new Error('Falha no redirecionamento do alias relatorios-monitoramento');
    }

    // Screenshot de validação
    const screenshotPath = path.resolve(__dirname, '../gestao_pedagogica_unificada.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`   Screenshot salva em: ${screenshotPath}`);

    console.log('\nErros detectados no console:', errors.length);
    if (errors.length > 0) {
        console.error('Erros:', errors);
    }

    await browser.close();

    console.log('\n================================================================');
    console.log('🎯 TODAS AS VALIDAÇÕES DA UNIFICAÇÃO FORAM CONCLUÍDAS COM SUCESSO!');
    console.log('================================================================');
}

testUnifiedGestaoPedagogica().catch(err => {
    console.error('Erro no teste:', err);
    process.exit(1);
});
