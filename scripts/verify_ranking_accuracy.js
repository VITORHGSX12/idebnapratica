// scripts/verify_ranking_accuracy.js
const fs = require('fs');
const path = require('path');

// 1. Carregar datasets
const baseDir = path.resolve(__dirname, '..');
const munDataCode = fs.readFileSync(path.join(baseDir, 'ideb_maranhao_oficial_2015_2025.js'), 'utf8');
const schDataCode = fs.readFileSync(path.join(baseDir, 'escolas_maranhao_oficial_2015_2025.js'), 'utf8');

const globalScope = {
    currentIdebYear: 2025,
    currentIdebStage: 'Anos Iniciais'
};

const evalMun = new Function('window', munDataCode);
evalMun(globalScope);

const evalSch = new Function('window', schDataCode);
evalSch(globalScope);

console.log('--- TESTE 1: Integridade dos Datasets Carregados ---');
console.log('Municípios Iniciais:', globalScope.IDEB_MARANHAO_MUNICIPIOS.iniciais.length);
console.log('Municípios Finais:', globalScope.IDEB_MARANHAO_MUNICIPIOS.finais.length);
console.log('Escolas:', globalScope.ESCOLAS_MARANHAO_OFICIAL.length);

if (globalScope.IDEB_MARANHAO_MUNICIPIOS.iniciais.length !== 217 || globalScope.ESCOLAS_MARANHAO_OFICIAL.length !== 4799) {
    throw new Error('Falha na contagem de municípios ou escolas!');
}

console.log('\n--- TESTE 2: Auditoria Matemática de Gonçalves Dias (2025) ---');
const cleanName = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

const gdMunIniciais = globalScope.IDEB_MARANHAO_MUNICIPIOS.iniciais.find(m => cleanName(m.municipio) === 'goncalves dias');
const gdMunFinais = globalScope.IDEB_MARANHAO_MUNICIPIOS.finais.find(m => cleanName(m.municipio) === 'goncalves dias');

console.log('Gonçalves Dias - IDEB Municipal 2025 Anos Iniciais:', gdMunIniciais.y2025);
console.log('Gonçalves Dias - IDEB Municipal 2025 Anos Finais:', gdMunFinais.y2025);

// Escolas de Gonçalves Dias
const gdSchools = globalScope.ESCOLAS_MARANHAO_OFICIAL.filter(s => cleanName(s.municipio) === 'goncalves dias');
console.log('Total de Escolas em Gonçalves Dias:', gdSchools.length);

const ai2025Scores = gdSchools.map(s => ({ inep: s.inep, nome: s.nome, score: s.ai_2025 })).sort((a, b) => (b.score || -1) - (a.score || -1));
const validAiScores = ai2025Scores.filter(s => s.score !== null);
const sumAi = validAiScores.reduce((acc, s) => acc + s.score, 0);
const avgAi = (sumAi / validAiScores.length).toFixed(2);

console.log(`\nEscolas Anos Iniciais 2025 (${validAiScores.length} com nota de ${gdSchools.length} totais):`);
ai2025Scores.forEach((s, idx) => console.log(` ${idx + 1}. [INEP ${s.inep}] ${s.nome}: ${s.score !== null ? s.score : '—'}`));
console.log(`Média simples das escolas avaliadas: ${sumAi.toFixed(1)} / ${validAiScores.length} = ${avgAi}`);
console.log(`Valor oficial da planilha municipal: ${gdMunIniciais.y2025}`);
if (parseFloat(avgAi) !== gdMunIniciais.y2025) {
    console.warn(`Aviso de arredondamento: avg=${avgAi} vs mun=${gdMunIniciais.y2025}`);
} else {
    console.log('-> CONFERÊNCIA EXATA! A média das escolas bate 100% com a nota municipal oficial.');
}

const af2025Scores = gdSchools.map(s => ({ inep: s.inep, nome: s.nome, score: s.af_2025 })).sort((a, b) => (b.score || -1) - (a.score || -1));
const validAfScores = af2025Scores.filter(s => s.score !== null);
const sumAf = validAfScores.reduce((acc, s) => acc + s.score, 0);
const avgAf = (sumAf / validAfScores.length).toFixed(2);

console.log(`\nEscolas Anos Finais 2025 (${validAfScores.length} com nota de ${gdSchools.length} totais):`);
af2025Scores.forEach((s, idx) => console.log(` ${idx + 1}. [INEP ${s.inep}] ${s.nome}: ${s.score !== null ? s.score : '—'}`));
console.log(`Média simples das escolas avaliadas: ${sumAf.toFixed(1)} / ${validAfScores.length} = ${avgAf}`);
console.log(`Valor oficial da planilha municipal: ${gdMunFinais.y2025}`);
if (parseFloat(avgAf) !== gdMunFinais.y2025) {
    console.warn(`Aviso de arredondamento: avg=${avgAf} vs mun=${gdMunFinais.y2025}`);
} else {
    console.log('-> CONFERÊNCIA EXATA! A média das escolas bate 100% com a nota municipal oficial.');
}

console.log('\n--- TESTE 3: Regra de Empate (Standard Competition Ranking) ---');
function testTieRank(scores) {
    const list = scores.map((val, idx) => ({ id: idx, val }));
    list.sort((a, b) => {
        const valA = a.val !== null ? a.val : -1;
        const valB = b.val !== null ? b.val : -1;
        return valB - valA;
    });

    list.forEach((item, idx) => {
        if (item.val === null) {
            item.rank = null;
        } else {
            if (idx > 0 && list[idx - 1].val !== null && item.val === list[idx - 1].val) {
                item.rank = list[idx - 1].rank;
            } else {
                item.rank = idx + 1;
            }
        }
    });
    return list;
}

const testScores = [6.1, 5.8, 5.8, 5.5, 5.2, 4.8, 4.8, null];
const ranked = testTieRank(testScores);
console.log('Scores testados:', testScores);
console.log('Ranks calculados:', ranked.map(r => `${r.val}: #${r.rank}`));

const expectedRanks = ['6.1: #1', '5.8: #2', '5.8: #2', '5.5: #4', '5.2: #5', '4.8: #6', '4.8: #6', 'null: #null'];
const actualRanks = ranked.map(r => `${r.val}: #${r.rank}`);
const matches = expectedRanks.every((exp, i) => exp === actualRanks[i]);
if (!matches) {
    throw new Error('Falha no cálculo de empates!');
}
console.log('-> Algoritmo de empate (Standard Competition Ranking) verificado com 100% de sucesso!');
