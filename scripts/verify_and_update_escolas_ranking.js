/**
 * Verificação e Auditoria de Veracidade de Todas as Escolas e Rankings do IDEB Maranhão
 * Arquivo: scripts/verify_and_update_escolas_ranking.js
 */
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const EXCEL_ESCOLAS_PATH = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'escolasmaranahoideb', 'IDEB_Maranhao_Escolas_2015-2025.xlsx');
const EXCEL_MUNICIPIOS_PATH = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'idebmaranhao', 'IDEB_Maranhao_Municipios_2015-2025.xlsx');
const JS_ESCOLAS_PATH = path.join(__dirname, '..', 'escolas_maranhao_oficial_2015_2025.js');
const JS_MUNICIPIOS_PATH = path.join(__dirname, '..', 'ideb_maranhao_oficial_2015_2025.js');

function parseVal(v) {
    if (v === undefined || v === null || v === '' || v === '-' || v === 'ND' || v === 'Sem dado') return null;
    const num = parseFloat(String(v).replace(',', '.'));
    return isNaN(num) ? null : Number(num.toFixed(2));
}

async function run() {
    console.log('========================================================================');
    console.log('AUDITORIA E VERIFICAÇÃO DE VERACIDADE: TODAS AS ESCOLAS E RANKINGS');
    console.log('========================================================================\n');

    // 1. Inspecionar Planilha de Escolas
    console.log(`Lendo planilha de escolas: ${EXCEL_ESCOLAS_PATH}`);
    const wbEsc = xlsx.readFile(EXCEL_ESCOLAS_PATH);
    console.log('Abas encontradas na planilha de escolas:', wbEsc.SheetNames);
    
    const sheetName = wbEsc.SheetNames[0];
    const rawEsc = xlsx.utils.sheet_to_json(wbEsc.Sheets[sheetName], { header: 1 });
    console.log(`Total de linhas na planilha de escolas: ${rawEsc.length}`);
    console.log('Cabeçalho (primeiras 5 linhas):');
    rawEsc.slice(0, 6).forEach((r, i) => console.log(`  [Linha ${i}]:`, r));

    // Identificar cabeçalho e linhas válidas
    let headerIdx = -1;
    for (let i = 0; i < 10; i++) {
        const r = rawEsc[i];
        if (r && r.some(cell => String(cell).toLowerCase().includes('inep') || String(cell).toLowerCase().includes('escola'))) {
            headerIdx = i;
            break;
        }
    }
    console.log(`Linha de cabeçalho detectada no índice: ${headerIdx}`);

    // Mapear todas as escolas da planilha
    const excelEscolasMap = new Map();
    const goncalvesDiasEscolasExcel = [];

    for (let i = headerIdx + 1; i < rawEsc.length; i++) {
        const r = rawEsc[i];
        if (!r || !r[0] || String(r[0]).trim() === '') continue;

        const inep = String(r[0]).trim();
        const nome = String(r[1] || '').trim();
        const municipio = String(r[2] || '').trim();
        const codMun = String(r[3] || '').trim();
        const rede = String(r[4] || 'Municipal').trim();

        const schoolData = {
            inep,
            nome,
            municipio,
            codMun,
            rede,
            ai_2015: parseVal(r[5]),
            ai_2017: parseVal(r[6]),
            ai_2019: parseVal(r[7]),
            ai_2021: parseVal(r[8]),
            ai_2023: parseVal(r[9]),
            ai_2025: parseVal(r[10]),
            af_2015: parseVal(r[11]),
            af_2017: parseVal(r[12]),
            af_2019: parseVal(r[13]),
            af_2021: parseVal(r[14]),
            af_2023: parseVal(r[15]),
            af_2025: parseVal(r[16])
        };

        excelEscolasMap.set(inep, schoolData);

        if (municipio.toLowerCase().includes('goncalves dias') || municipio.toLowerCase().includes('gonçalves dias')) {
            goncalvesDiasEscolasExcel.push(schoolData);
        }
    }

    console.log(`\nTotal de escolas processadas da planilha Excel: ${excelEscolasMap.size}`);
    console.log(`Total de escolas de Gonçalves Dias na planilha Excel: ${goncalvesDiasEscolasExcel.length}`);

    // 2. Inspecionar Dataset em escolas_maranhao_oficial_2015_2025.js
    console.log(`\nLendo dataset front-end: ${JS_ESCOLAS_PATH}`);
    const jsEscolas = require(JS_ESCOLAS_PATH);
    console.log(`Total de escolas no arquivo JS: ${jsEscolas.length}`);

    const jsEscolasMap = new Map();
    const goncalvesDiasEscolasJs = [];
    jsEscolas.forEach(s => {
        jsEscolasMap.set(String(s.inep).trim(), s);
        if (s.municipio && (s.municipio.toLowerCase().includes('goncalves dias') || s.municipio.toLowerCase().includes('gonçalves dias'))) {
            goncalvesDiasEscolasJs.push(s);
        }
    });

    console.log(`Total de escolas de Gonçalves Dias no arquivo JS: ${goncalvesDiasEscolasJs.length}`);

    // 3. Comparação de integridade entre Planilha e Arquivo JS
    console.log('\n--- Comparando Integridade (Planilha vs Arquivo JS) ---');
    let matchingScores = 0;
    let divergingScores = 0;
    let missingInJs = 0;

    for (const [inep, excelData] of excelEscolasMap.entries()) {
        const jsData = jsEscolasMap.get(inep);
        if (!jsData) {
            missingInJs++;
            continue;
        }

        const scoreKeys = [
            'ai_2015', 'ai_2017', 'ai_2019', 'ai_2021', 'ai_2023', 'ai_2025',
            'af_2015', 'af_2017', 'af_2019', 'af_2021', 'af_2023', 'af_2025'
        ];

        let hasDiff = false;
        for (const k of scoreKeys) {
            if (excelData[k] !== jsData[k]) {
                hasDiff = true;
                break;
            }
        }

        if (hasDiff) divergingScores++;
        else matchingScores++;
    }

    console.log(`Escolas idênticas em todos os 12 scores: ${matchingScores}`);
    console.log(`Escolas com alguma divergência: ${divergingScores}`);
    console.log(`Escolas da planilha ausentes no JS: ${missingInJs}`);

    // 4. Auditoria das Escolas de Gonçalves Dias (Nossa Rede)
    console.log('\n========================================================================');
    console.log('AUDITORIA DETALHADA: ESCOLAS DE GONÇALVES DIAS - MA');
    console.log('========================================================================');
    console.table(goncalvesDiasEscolasExcel.map(s => ({
        inep: s.inep,
        nome: s.nome,
        rede: s.rede,
        ai_2015: s.ai_2015,
        ai_2023: s.ai_2023,
        ai_2025: s.ai_2025,
        af_2015: s.af_2015,
        af_2023: s.af_2023,
        af_2025: s.af_2025
    })));

    // 5. Testar a Veracidade dos Rankings
    console.log('\n========================================================================');
    console.log('TESTE DE VERACIDADE DO RANKING (Simulação dos Métodos de Ordenação)');
    console.log('========================================================================');

    // Ranking de Gonçalves Dias - Anos Iniciais 2025
    console.log('\n--- Ranking Oficial de Gonçalves Dias: Anos Iniciais (2025) ---');
    const rankingGDAI2025 = [...goncalvesDiasEscolasExcel]
        .map(s => ({
            inep: s.inep,
            nome: s.nome,
            rede: s.rede,
            score: s.ai_2025,
            prevScore: s.ai_2023,
            delta: (s.ai_2025 !== null && s.ai_2023 !== null) ? Number((s.ai_2025 - s.ai_2023).toFixed(2)) : null
        }))
        .sort((a, b) => {
            if (a.score === null && b.score === null) return 0;
            if (a.score === null) return 1;
            if (b.score === null) return -1;
            return b.score - a.score;
        });

    console.table(rankingGDAI2025.map((r, idx) => ({
        posicao: r.score !== null ? `#${idx + 1}` : 'Sem Nota',
        inep: r.inep,
        nome: r.nome,
        rede: r.rede,
        ideb_2025: r.score !== null ? r.score : '—',
        ideb_2023: r.prevScore !== null ? r.prevScore : '—',
        evolucao: r.delta !== null ? (r.delta > 0 ? `+${r.delta}` : `${r.delta}`) : '—'
    })));

    // Ranking de Gonçalves Dias - Anos Finais 2025
    console.log('\n--- Ranking Oficial de Gonçalves Dias: Anos Finais (2025) ---');
    const rankingGDAF2025 = [...goncalvesDiasEscolasExcel]
        .map(s => ({
            inep: s.inep,
            nome: s.nome,
            rede: s.rede,
            score: s.af_2025,
            prevScore: s.af_2023,
            delta: (s.af_2025 !== null && s.af_2023 !== null) ? Number((s.af_2025 - s.af_2023).toFixed(2)) : null
        }))
        .sort((a, b) => {
            if (a.score === null && b.score === null) return 0;
            if (a.score === null) return 1;
            if (b.score === null) return -1;
            return b.score - a.score;
        });

    console.table(rankingGDAF2025.map((r, idx) => ({
        posicao: r.score !== null ? `#${idx + 1}` : 'Sem Nota',
        inep: r.inep,
        nome: r.nome,
        rede: r.rede,
        ideb_2025: r.score !== null ? r.score : '—',
        ideb_2023: r.prevScore !== null ? r.prevScore : '—',
        evolucao: r.delta !== null ? (r.delta > 0 ? `+${r.delta}` : `${r.delta}`) : '—'
    })));

    // Top 10 Escolas do Estado do Maranhão - Anos Iniciais 2025
    console.log('\n--- TOP 10 Escolas do Maranhão: Anos Iniciais (2025) ---');
    const top10EstadualAI = Array.from(excelEscolasMap.values())
        .filter(s => s.ai_2025 !== null)
        .sort((a, b) => b.ai_2025 - a.ai_2025)
        .slice(0, 10);

    console.table(top10EstadualAI.map((s, idx) => ({
        posicao: `#${idx + 1}`,
        inep: s.inep,
        nome: s.nome,
        municipio: s.municipio,
        rede: s.rede,
        ideb_2025: s.ai_2025,
        ideb_2023: s.ai_2023
    })));

    // Top 10 Escolas do Estado do Maranhão - Anos Finais 2025
    console.log('\n--- TOP 10 Escolas do Maranhão: Anos Finais (2025) ---');
    const top10EstadualAF = Array.from(excelEscolasMap.values())
        .filter(s => s.af_2025 !== null)
        .sort((a, b) => b.af_2025 - a.af_2025)
        .slice(0, 10);

    console.table(top10EstadualAF.map((s, idx) => ({
        posicao: `#${idx + 1}`,
        inep: s.inep,
        nome: s.nome,
        municipio: s.municipio,
        rede: s.rede,
        ideb_2025: s.af_2025,
        ideb_2023: s.af_2023
    })));
}

run().catch(err => {
    console.error('Erro na auditoria das escolas:', err);
});
