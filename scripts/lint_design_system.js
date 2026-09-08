/**
 * GESTÃO EDUCACIONAL SAAS — SCRIPT DE BLINDAGEM AUTOMATIZADA (LINT DESIGN SYSTEM)
 * 
 * Regras auditadas:
 * 1. ZERO emojis de UI em arquivos de módulo (js/modules/**)
 * 2. ZERO emojis em títulos de modais, opções de seletores e botões no index.html
 * 3. Integridade dos Tokens Centralizados em design-tokens.css
 * 4. Integridade da Paleta Única em js/core/chart-theme.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const MODULES_DIR = path.join(ROOT_DIR, 'js', 'modules');
const INDEX_HTML_PATH = path.join(ROOT_DIR, 'index.html');
const DESIGN_TOKENS_PATH = path.join(ROOT_DIR, 'design-tokens.css');
const CHART_THEME_PATH = path.join(ROOT_DIR, 'js', 'core', 'chart-theme.js');

// Regex de emojis funcionais/decorativos proibidos na UI
const FORBIDDEN_EMOJIS_REGEX = /[✅⚠️📅📋👁️🟢🟡🔴⏳🗑️✏️🔍💡📌⭐👑🥈🥉🎯🚀🔒🔑❌✉️✍️⚙️🏛️🖐️🎛️📖📐🌱🌍]/;

let hasErrors = false;
let totalCheckedFiles = 0;
let passedAssertions = 0;

console.log('================================================================');
console.log('🛡️  SUÍTE DE AUDITORIA E LINTER: DESIGN SYSTEM & UI GOVERNANCE');
console.log('================================================================\n');

// 1. Auditando Módulos JS (js/modules/)
console.log('--- 1. AUDITORIA DE ZERO EMOJIS EM MÓDULOS MODULARES (js/modules/) ---');

function scanDirRecursive(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files = files.concat(scanDirRecursive(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
}

const moduleFiles = scanDirRecursive(MODULES_DIR);
moduleFiles.forEach(filePath => {
    totalCheckedFiles++;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let fileHasEmoji = false;

    lines.forEach((line, idx) => {
        // Ignora comentários de cabeçalho com caracteres acentuados permitidos, mas checa se há emojis
        if (FORBIDDEN_EMOJIS_REGEX.test(line)) {
            console.error(`  [X FALHA] Emoji encontrado em ${path.relative(ROOT_DIR, filePath)}:L${idx + 1}`);
            console.error(`            Linha: ${line.trim()}`);
            fileHasEmoji = true;
            hasErrors = true;
        }
    });

    if (!fileHasEmoji) {
        passedAssertions++;
    }
});

console.log(`  [✓ PASS] ${passedAssertions} de ${moduleFiles.length} arquivos modulares auditados com 0 emojis de UI.\n`);

// 2. Auditando index.html
console.log('--- 2. AUDITORIA DE BOTÕES, SELETORES E TÍTULOS (index.html) ---');
const indexHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
const indexLines = indexHtml.split('\n');
let indexEmojiCount = 0;

indexLines.forEach((line, idx) => {
    // Procura emojis em tags de UI (<option>, <button>, <label>, <h3>, <h4>, <h5>, <strong>)
    if (/<(option|button|label|h[1-6]|strong|span)[^>]*>.*[✅⚠️📅📋👁️🟢🟡🔴⏳🗑️✏️🔍💡📌⭐👑🥈🥉🎯🚀🔒🔑❌✉️✍️⚙️🏛️🖐️🎛️📖📐🌱🌍]/.test(line)) {
        console.error(`  [X FALHA] Emoji de UI encontrado em index.html:L${idx + 1}`);
        console.error(`            Linha: ${line.trim()}`);
        indexEmojiCount++;
        hasErrors = true;
    }
});

if (indexEmojiCount === 0) {
    console.log('  [✓ PASS] index.html está 100% livre de emojis em opções de seleção, botões e títulos.\n');
}

// 3. Verificação dos Tokens Centralizados
console.log('--- 3. VERIFICAÇÃO DE TOKENS CENTRALIZADOS (design-tokens.css) ---');
const designTokensContent = fs.readFileSync(DESIGN_TOKENS_PATH, 'utf8');
const requiredTokens = [
    '--color-brand-primary',
    '--color-surface-card',
    '--color-surface-subtle',
    '--color-border-subtle',
    '--color-success',
    '--color-warning',
    '--color-critical',
    '--radius-pill',
    '--radius-card',
    '.ds-badge',
    '.ds-badge-success',
    '.ds-badge-critical',
    '.ds-badge-warning',
    '.ds-btn'
];

let tokensPassed = 0;
requiredTokens.forEach(tok => {
    if (designTokensContent.includes(tok)) {
        tokensPassed++;
    } else {
        console.error(`  [X FALHA] Token canônico ausente em design-tokens.css: ${tok}`);
        hasErrors = true;
    }
});
console.log(`  [✓ PASS] ${tokensPassed}/${requiredTokens.length} tokens e classes canônicas validados em design-tokens.css.\n`);

// 4. Verificação da Centralização de Gráficos (js/core/chart-theme.js)
console.log('--- 4. VERIFICAÇÃO DA PALETA ÚNICA DE GRÁFICOS (chart-theme.js) ---');
const chartThemeContent = fs.readFileSync(CHART_THEME_PATH, 'utf8');
if (chartThemeContent.includes('ChartTheme') && chartThemeContent.includes('chartColors') && chartThemeContent.includes('chartStyles')) {
    console.log('  [✓ PASS] Motor ChartTheme (chartColors + chartStyles) ativo e configurado com tokens centralizados.\n');
} else {
    console.error('  [X FALHA] ChartTheme ou chartColors não encontrado em js/core/chart-theme.js');
    hasErrors = true;
}

// Relatório Final
console.log('================================================================');
if (hasErrors) {
    console.error('❌ RELATÓRIO: FALHAS ENCONTRADAS NA BLINDAGEM DO DESIGN SYSTEM!');
    process.exit(1);
} else {
    console.log('✨ RELATÓRIO: 100% DAS ASSERÇÕES APROVADAS! ZERO VIOLAÇÕES DE DESIGN SYSTEM.');
    console.log('================================================================\n');
    process.exit(0);
}
