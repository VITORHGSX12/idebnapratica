/**
 * ============================================================================
 * TESTE DE AUDITORIA: CORREÇÃO CENTRALIZADA SEMED VS MODO LEITURA PROFESSOR
 * Arquivo: scripts/audit_semed_correction_rbac.test.js
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('========================================================================');
console.log('🔍 AUDITORIA DE REGRAS DE NEGÓCIO: CORREÇÃO SEMED & MODO LEITURA DOCENTE');
console.log('========================================================================\n');

let passCount = 0;
let failCount = 0;

function it(desc, fn) {
    try {
        fn();
        console.log(`  [✓ PASS] ${desc}`);
        passCount++;
    } catch(err) {
        console.error(`  [✗ FAIL] ${desc}\n    -> ${err.message}`);
        failCount++;
    }
}

// 1. Verificar travas de código em avaliacoes_espelho.js
const espelhoCode = fs.readFileSync(path.join(__dirname, '../js/modules/avaliacoes/avaliacoes_espelho.js'), 'utf8');

it('1.1 avaliacoes_espelho.js identifica se usuário é Professor/Diretor e ativa isReadOnlyRole', () => {
    assert(espelhoCode.includes("userRole.includes('PROFESSOR') || userRole.includes('DIRETOR')"), 'Não encontrou verificação de isReadOnlyRole');
});

it('1.2 avaliacoes_espelho.js desabilita inputs de respostas para perfis de leitura', () => {
    assert(espelhoCode.includes('${isLocked || isAusente ? \'disabled\' : \'\'}'), 'Falta disabled nos inputs quando isLocked/isReadOnlyRole');
});

it('1.3 avaliacoes_espelho.js esconde ou desabilita o botão btn-save-all-scores para Professor', () => {
    assert(espelhoCode.includes('saveBtn.disabled = true;'), 'Falta desabilitar saveBtn');
    assert(espelhoCode.includes("saveBtn.style.display = 'none';"), 'Falta esconder saveBtn para Professor');
});

it('1.4 avaliacoes_espelho.js impede alternar presença e salvamento via chamadas diretas', () => {
    assert(espelhoCode.includes('Alteração restrita à equipe da SEMED'), 'Falta bloqueio de alternarPresencaAluno para visualizadores');
    assert(espelhoCode.includes('if (userRole.includes(\'PROFESSOR\') || userRole.includes(\'DIRETOR\')) return;'), 'Falta bloqueio de auto-save para docentes');
});

it('1.5 avaliacoes_espelho.js renderiza o banner explicativo oficial da SEMED', () => {
    assert(espelhoCode.includes('espelho-semed-readonly-banner'), 'Falta ID do banner espelho-semed-readonly-banner');
    assert(espelhoCode.includes('Correção Centralizada pela SEMED'), 'Falta texto explicativo da SEMED');
});

// 2. Verificar sincronia de métricas no dashboard_kpis.js
const dashboardCode = fs.readFileSync(path.join(__dirname, '../js/modules/dashboard/dashboard_kpis.js'), 'utf8');

it('2.1 dashboard_kpis.js checa ambas as chaves de simulados (gd_simulado_respostas_db e gd_respostas_simulados_data)', () => {
    assert(dashboardCode.includes('gd_respostas_simulados_data'), 'Falta suporte a gd_respostas_simulados_data');
});

// 3. Verificar resolução resiliente de gabarito em saeb_distribution_view.js e saeb_ficha_individual.js
const saebDistCode = fs.readFileSync(path.join(__dirname, '../js/modules/saeb/saeb_distribution_view.js'), 'utf8');
const saebFichaCode = fs.readFileSync(path.join(__dirname, '../js/modules/saeb/saeb_ficha_individual.js'), 'utf8');

it('3.1 saeb_distribution_view.js possui fallback para gabaritoGeralJson', () => {
    assert(saebDistCode.includes('gabaritoGeralJson'), 'Falta fallback de gabaritoGeralJson em saeb_distribution_view');
});

it('3.2 saeb_ficha_individual.js possui fallback para gabaritoGeralJson e matriz de habilidades', () => {
    assert(saebFichaCode.includes('gabaritoGeralJson'), 'Falta fallback de gabaritoGeralJson em saeb_ficha_individual');
});

console.log('\n========================================================================');
console.log(`RELATÓRIO FINAL: ${passCount} PASSOU | ${failCount} FALHAS`);
console.log('========================================================================\n');

if (failCount > 0) process.exit(1);
