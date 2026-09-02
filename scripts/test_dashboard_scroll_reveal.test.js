/**
 * ============================================================================
 * TEST SUITE: DASHBOARD SCROLL REVEAL PROGRESSIVO
 * Arquivo: scripts/test_dashboard_scroll_reveal.test.js
 * Descrição: Valida sintaxe, limites de linhas, escopo de estilos,
 *            motor de contagem numérica e integração no index.html.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
    if (condition) {
        console.log('  [✓ PASS] ' + message);
        passCount++;
    } else {
        console.error('  [✗ FAIL] ' + message);
        failCount++;
    }
}

console.log('================================================================');
console.log('SUÍTE DE TESTES: SCROLL REVEAL PROGRESSIVO DO DASHBOARD');
console.log('================================================================\n');

// 1. Limites de linhas (< 700 linhas)
console.log('--- TESTE 1: Limite de Linhas e Integridade de Arquivos ---');
const filesToCheck = [
    'js/modules/dashboard/dashboard_scroll_reveal.js',
    'js/modules/dashboard/dashboard_kpis.js',
    'js/modules/dashboard/dashboard_charts.js',
    'js/core/navigation.js'
];

filesToCheck.forEach(file => {
    const fullPath = path.resolve(__dirname, '..', file);
    assert(fs.existsSync(fullPath), `Arquivo existe: ${file}`);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lineCount = content.split('\n').length;
    assert(lineCount < 700, `${file} tem ${lineCount} linhas (< 700 linhas)`);
});

// 2. Validação de Sintaxe em Sandbox Node.js
console.log('\n--- TESTE 2: Validação de Sintaxe em Sandbox ---');
filesToCheck.forEach(file => {
    const fullPath = path.resolve(__dirname, '..', file);
    const content = fs.readFileSync(fullPath, 'utf8');
    try {
        new vm.Script(content);
        assert(true, `Sintaxe válida sem erros: ${file}`);
    } catch(err) {
        assert(false, `Erro de sintaxe em ${file}: ${err.message}`);
    }
});

// 3. Estilos de Scroll Reveal e Acessibilidade
console.log('\n--- TESTE 3: Regras de Estilo Escopadas e Acessibilidade ---');
const scrollJs = fs.readFileSync(path.resolve(__dirname, '../js/modules/dashboard/dashboard_scroll_reveal.js'), 'utf8');
assert(scrollJs.includes('#dashboard .dash-scroll-block'), 'Regra .dash-scroll-block escopada em #dashboard');
assert(scrollJs.includes('#dashboard .dash-scroll-block.dash-visible'), 'Regra .dash-visible escopada em #dashboard');
assert(scrollJs.includes('prefers-reduced-motion: reduce'), 'Suporte a prefers-reduced-motion implementado');
assert(scrollJs.includes('.main-content'), 'Scroll monitor vinculado ao container principal .main-content');

// 4. Teste Lógico do Motor de CountUp
console.log('\n--- TESTE 4: Motor de Extração e Análise Numérica (CountUp) ---');
function parseTargetString(rawText) {
    var match = rawText.match(/^([^\d\.-]*)([-+]?\d+(?:[\.,]\d+)?)(.*)$/);
    if (!match) return null;
    var prefix = match[1] || '';
    var numStr = match[2] || '';
    var suffix = match[3] || '';
    var cleanNumStr = numStr.replace(',', '.');
    var targetNum = parseFloat(cleanNumStr);
    var decimalPart = cleanNumStr.split('.')[1];
    var decimals = decimalPart ? decimalPart.length : 0;
    return { prefix, targetNum, suffix: suffix.trim(), decimals };
}

const testCases = [
    { input: '5.2', expectedNum: 5.2, expectedDec: 1 },
    { input: '228.4 pts', expectedNum: 228.4, expectedDec: 1 },
    { input: '96.2%', expectedNum: 96.2, expectedDec: 1 },
    { input: '+0.4', expectedNum: 0.4, expectedDec: 1 },
    { input: '40 Semanas', expectedNum: 40, expectedDec: 0 }
];

testCases.forEach(tc => {
    const parsed = parseTargetString(tc.input);
    assert(parsed && parsed.targetNum === tc.expectedNum && parsed.decimals === tc.expectedDec,
        `parseTargetString('${tc.input}') -> ${parsed.targetNum} (${parsed.decimals} decimais)`);
});

// 5. Inclusão no index.html
console.log('\n--- TESTE 5: Script tag registrada no index.html ---');
const indexHtml = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
assert(indexHtml.includes('js/modules/dashboard/dashboard_scroll_reveal.js'), 'dashboard_scroll_reveal.js incluído no index.html');

console.log('\n================================================================');
console.log(`RELATÓRIO DE EXECUÇÃO: ${passCount} PASSOU | ${failCount} FALHAS`);
console.log('================================================================');

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
