/**
 * ============================================================================
 * AUDITORIA E TESTE AUTOMATIZADO: ASSETS DA IDENTIDADE VISUAL "IDEB NA PRÁTICA"
 * Arquivo: scripts/test_brand_identity_assets.test.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const BRAND_DIR = path.join(ROOT_DIR, 'assets', 'brand');

const REQUIRED_SVGS = [
    'ideb_logo_horizontal_black.svg',
    'ideb_logo_horizontal_color.svg',
    'ideb_logo_horizontal_inverted.svg',
    'ideb_logo_vertical_black.svg',
    'ideb_logo_vertical_color.svg',
    'ideb_logo_vertical_inverted.svg',
    'ideb_symbol_app_icon.svg',
    'ideb_symbol_black.svg',
    'ideb_symbol_favicon_24x24.svg',
    'ideb_symbol_full.svg',
    'ideb_symbol_grayscale.svg',
    'ideb_symbol_sidebar.svg',
    'ideb_symbol_white.svg'
];

console.log('--- [TEST] Iniciando Auditoria dos Assets da Identidade Visual ---');

// 1. Validar existência e tamanho dos 13 arquivos SVGs
REQUIRED_SVGS.forEach(file => {
    const filePath = path.join(BRAND_DIR, file);
    assert.ok(fs.existsSync(filePath), `Arquivo SVG obrigatório não encontrado: ${file}`);
    const stats = fs.statSync(filePath);
    assert.ok(stats.size > 50, `Arquivo SVG parece vazio ou inválido (${stats.size} bytes): ${file}`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('<svg'), `Arquivo SVG não possui tag <svg>: ${file}`);
    console.log(`  ✓ SVG validado: ${file} (${stats.size} bytes)`);
});

// 2. Validar index.html
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

assert.ok(indexHtml.includes('assets/brand/ideb_symbol_favicon_24x24.svg'), 'index.html deve conter favicon ideb_symbol_favicon_24x24.svg');
assert.ok(indexHtml.includes('assets/brand/ideb_symbol_app_icon.svg'), 'index.html deve conter apple-touch-icon ideb_symbol_app_icon.svg');
assert.ok(indexHtml.includes('assets/brand/ideb_symbol_sidebar.svg'), 'index.html deve conter ideb_symbol_sidebar.svg na sidebar');
assert.ok(indexHtml.includes('assets/brand/ideb_logo_horizontal_inverted.svg'), 'index.html deve conter ideb_logo_horizontal_inverted.svg no hero login e sidebar');
assert.ok(indexHtml.includes('assets/brand/ideb_logo_horizontal_color.svg'), 'index.html deve conter ideb_logo_horizontal_color.svg na navbar');
console.log('  ✓ index.html referências de marca e favicon validadas com sucesso!');

// 3. Validar manifest.json
const manifestPath = path.join(ROOT_DIR, 'manifest.json');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
assert.ok(manifestContent.includes('assets/brand/ideb_symbol_app_icon.svg'), 'manifest.json deve conter ideb_symbol_app_icon.svg');
assert.ok(manifestContent.includes('assets/brand/ideb_symbol_favicon_24x24.svg'), 'manifest.json deve conter ideb_symbol_favicon_24x24.svg');
console.log('  ✓ manifest.json referências de marca validadas com sucesso!');

// 4. Validar styles.css
const stylesCssPath = path.join(ROOT_DIR, 'styles.css');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');
assert.ok(stylesCss.includes('.sidebar-brand-symbol'), 'styles.css deve conter regras para .sidebar-brand-symbol');
assert.ok(stylesCss.includes('.sidebar-brand-full'), 'styles.css deve conter regras para .sidebar-brand-full');
assert.ok(stylesCss.includes('body.collapsed-sidebar .sidebar-brand-symbol'), 'styles.css deve exibir .sidebar-brand-symbol no modo collapsed');
assert.ok(stylesCss.includes('body.collapsed-sidebar .sidebar-brand-full'), 'styles.css deve ocultar .sidebar-brand-full no modo collapsed');
assert.ok(stylesCss.includes('.navbar-brand-header'), 'styles.css deve conter regras para .navbar-brand-header');
console.log('  ✓ styles.css regras de marca e alternância de sidebar validadas com sucesso!');

// 5. Validar impressões e PDFs
const printJsPath = path.join(ROOT_DIR, 'js', 'modules', 'avaliacoes', 'avaliacoes_print.js');
const printJs = fs.readFileSync(printJsPath, 'utf8');
assert.ok(printJs.includes('assets/brand/ideb_logo_horizontal_black.svg'), 'avaliacoes_print.js deve utilizar ideb_logo_horizontal_black.svg');

const saebIntervPath = path.join(ROOT_DIR, 'js', 'modules', 'saeb', 'saeb_intervencoes_comparativo.js');
const saebInterv = fs.readFileSync(saebIntervPath, 'utf8');
assert.ok(saebInterv.includes('assets/brand/ideb_logo_horizontal_color.svg'), 'saeb_intervencoes_comparativo.js deve utilizar ideb_logo_horizontal_color.svg');
console.log('  ✓ Módulos de impressão e relatórios validados com sucesso!');

console.log('\n--- TODOS OS 5 BLOCOS DE TESTES DA IDENTIDADE VISUAL PASSARAM COM SUCESSO! ---');
