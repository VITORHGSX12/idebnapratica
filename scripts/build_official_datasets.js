const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log('=== EXTRAINDO DADOS OFICIAIS DAS PLANILHAS DO USUÁRIO ===');

// 1. PROCESSAR MATRIZ DE DESCRITORES
const descritoresPath = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\Matriz_Descritores_SAEB_SEAMA_IDEB_OBA.xlsx';
let descritoresData = { visaoGeral: [], linguaPortuguesa: [], matematica: [], ciencias: [], geografiaOba: [] };

if (fs.existsSync(descritoresPath)) {
    const wbDesc = XLSX.readFile(descritoresPath);
    
    // Visao Geral
    if (wbDesc.Sheets['Visão Geral']) {
        const rows = XLSX.utils.sheet_to_json(wbDesc.Sheets['Visão Geral'], { header: 1 });
        descritoresData.visaoGeral = rows.slice(2).filter(r => r && r[0] && r[2]).map(r => ({
            disciplina: r[0] || '',
            topico: r[1] || '',
            codigo: r[2] || '',
            descricao: r[3] || ''
        }));
    }
    // Lingua Portuguesa
    if (wbDesc.Sheets['Língua Portuguesa']) {
        const rows = XLSX.utils.sheet_to_json(wbDesc.Sheets['Língua Portuguesa'], { header: 1 });
        descritoresData.linguaPortuguesa = rows.slice(2).filter(r => r && r[1]).map(r => ({
            topico: r[0] || '',
            codigo: r[1] || '',
            descricao: r[2] || ''
        }));
    }
    // Matematica
    if (wbDesc.Sheets['Matemática']) {
        const rows = XLSX.utils.sheet_to_json(wbDesc.Sheets['Matemática'], { header: 1 });
        descritoresData.matematica = rows.slice(2).filter(r => r && r[1]).map(r => ({
            topico: r[0] || '',
            codigo: r[1] || '',
            descricao: r[2] || ''
        }));
    }
    // Ciencias
    if (wbDesc.Sheets['Ciências']) {
        const rows = XLSX.utils.sheet_to_json(wbDesc.Sheets['Ciências'], { header: 1 });
        descritoresData.ciencias = rows.slice(2).filter(r => r && r[1]).map(r => ({
            topico: r[0] || '',
            codigo: r[1] || '',
            descricao: r[2] || ''
        }));
    }
    // Geografia OBA
    if (wbDesc.Sheets['Geografia (OBA)']) {
        const rows = XLSX.utils.sheet_to_json(wbDesc.Sheets['Geografia (OBA)'], { header: 1 });
        descritoresData.geografiaOba = rows.slice(2).filter(r => r && r[1]).map(r => ({
            topico: r[0] || '',
            codigo: r[1] || '',
            descricao: r[2] || ''
        }));
    }
    console.log(`[Descritores] Extraídos ${descritoresData.visaoGeral.length} descritores da Visão Geral, ${descritoresData.linguaPortuguesa.length} LP, ${descritoresData.matematica.length} MAT, ${descritoresData.ciencias.length} Ciencias, ${descritoresData.geografiaOba.length} Geografia (OBA).`);
}

// Write matriz_descritores_excel_oficial.js
const descritoresJsContent = `// Base Oficial de Descritores SAEB / SEAMA / IDEB / OBA
window.MATRIZ_DESCRITORES_EXCEL = ${JSON.stringify(descritoresData, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'matriz_descritores_excel_oficial.js'), descritoresJsContent, 'utf8');

// 2. PROCESSAR MATRIZ BNCC POR ETAPA
const bnccPath = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\BNCC\\BNCC_Separada_por_Etapa.xlsx';
let bnccData = { ano2: [], ano5: [], ano9: [] };

if (fs.existsSync(bnccPath)) {
    const wbBncc = XLSX.readFile(bnccPath);
    
    // 2o Ano
    if (wbBncc.Sheets['2º Ano (Anos Iniciais)']) {
        const rows = XLSX.utils.sheet_to_json(wbBncc.Sheets['2º Ano (Anos Iniciais)'], { header: 1 });
        bnccData.ano2 = rows.slice(2).filter(r => r && r[3]).map(r => ({
            disciplina: r[0] || 'Língua Portuguesa',
            unidadeTematica: r[1] || '',
            objetoConhecimento: r[2] || '',
            codigoBncc: r[3] || '',
            descricao: r[4] || '',
            etapa: '2º Ano',
            status: 'Essencial'
        }));
    }
    // 5o Ano
    if (wbBncc.Sheets['5º Ano (Anos Iniciais)']) {
        const rows = XLSX.utils.sheet_to_json(wbBncc.Sheets['5º Ano (Anos Iniciais)'], { header: 1 });
        bnccData.ano5 = rows.slice(2).filter(r => r && r[3]).map(r => ({
            disciplina: r[0] || 'Língua Portuguesa',
            unidadeTematica: r[1] || '',
            objetoConhecimento: r[2] || '',
            codigoBncc: r[3] || '',
            descricao: r[4] || '',
            etapa: '5º Ano',
            status: 'Prioritária'
        }));
    }
    // 9o Ano
    if (wbBncc.Sheets['9º Ano (Anos Finais)']) {
        const rows = XLSX.utils.sheet_to_json(wbBncc.Sheets['9º Ano (Anos Finais)'], { header: 1 });
        bnccData.ano9 = rows.slice(2).filter(r => r && r[3]).map(r => ({
            disciplina: r[0] || 'Língua Portuguesa',
            unidadeTematica: r[1] || '',
            objetoConhecimento: r[2] || '',
            codigoBncc: r[3] || '',
            descricao: r[4] || '',
            etapa: '9º Ano',
            status: 'Avançada'
        }));
    }
    console.log(`[BNCC] Extraídas ${bnccData.ano2.length} habilidades do 2º Ano, ${bnccData.ano5.length} do 5º Ano, ${bnccData.ano9.length} do 9º Ano.`);
}

// Write bncc_habilidades_oficial.js
const bnccJsContent = `// Base Oficial BNCC por Etapa (2º, 5º e 9º Ano)
window.BNCC_HABILIDADES_OFICIAL = ${JSON.stringify(bnccData, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'bncc_habilidades_oficial.js'), bnccJsContent, 'utf8');

// 3. PROCESSAR IDEB MUNICÍPIOS (MARANHÃO)
const idebMunPath = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DOCUMENTOS\\idebmaranhao\\IDEB_Maranhao_Municipios_2015-2025.xlsx';
let idebMunicipiosData = { iniciais: [], finais: [] };

if (fs.existsSync(idebMunPath)) {
    const wbIdebMun = XLSX.readFile(idebMunPath);
    
    // Anos Iniciais
    if (wbIdebMun.Sheets['Anos Iniciais']) {
        const rows = XLSX.utils.sheet_to_json(wbIdebMun.Sheets['Anos Iniciais'], { header: 1 });
        idebMunicipiosData.iniciais = rows.slice(4).filter(r => r && r[1]).map(r => ({
            codigoInep: String(r[0] || ''),
            municipio: String(r[1] || '').trim(),
            y2015: typeof r[2] === 'number' ? r[2] : null,
            y2017: typeof r[3] === 'number' ? r[3] : null,
            y2019: typeof r[4] === 'number' ? r[4] : null,
            y2021: typeof r[5] === 'number' ? r[5] : null,
            y2023: typeof r[6] === 'number' ? r[6] : null,
            y2025: typeof r[7] === 'number' ? r[7] : null
        }));
    }
    // Anos Finais
    if (wbIdebMun.Sheets['Anos Finais']) {
        const rows = XLSX.utils.sheet_to_json(wbIdebMun.Sheets['Anos Finais'], { header: 1 });
        idebMunicipiosData.finais = rows.slice(4).filter(r => r && r[1]).map(r => ({
            codigoInep: String(r[0] || ''),
            municipio: String(r[1] || '').trim(),
            y2015: typeof r[2] === 'number' ? r[2] : null,
            y2017: typeof r[3] === 'number' ? r[3] : null,
            y2019: typeof r[4] === 'number' ? r[4] : null,
            y2021: typeof r[5] === 'number' ? r[5] : null,
            y2023: typeof r[6] === 'number' ? r[6] : null,
            y2025: typeof r[7] === 'number' ? r[7] : null
        }));
    }
    console.log(`[IDEB Municípios] Processados ${idebMunicipiosData.iniciais.length} municípios em Anos Iniciais e ${idebMunicipiosData.finais.length} em Anos Finais.`);
}

// Write ideb_maranhao_oficial_2015_2025.js
const idebMunJsContent = `// Base Oficial IDEB Maranhão Municípios (2015-2025)
window.IDEB_MARANHAO_MUNICIPIOS = ${JSON.stringify(idebMunicipiosData, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'ideb_maranhao_oficial_2015_2025.js'), idebMunJsContent, 'utf8');

// 4. PROCESSAR IDEB ESCOLAS (MARANHÃO)
const idebEscolasPath = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DOCUMENTOS\\escolasmaranahoideb\\IDEB_Maranhao_Escolas_2015-2025.xlsx';
let idebEscolasData = [];

if (fs.existsSync(idebEscolasPath)) {
    const wbIdebEsc = XLSX.readFile(idebEscolasPath);
    if (wbIdebEsc.Sheets['Escolas MA - IDEB']) {
        const rows = XLSX.utils.sheet_to_json(wbIdebEsc.Sheets['Escolas MA - IDEB'], { header: 1 });
        // Find row headers (usually row 4 or 5)
        const headerIndex = rows.findIndex(r => r && (r[0] === 'Código Inep' || r[1] === 'Nome da Escola' || r[2] === 'Município'));
        if (headerIndex !== -1) {
            const dataRows = rows.slice(headerIndex + 1);
            idebEscolasData = dataRows.filter(r => r && r[0] && r[1]).map(r => ({
                inep: String(r[0] || ''),
                nome: String(r[1] || '').trim(),
                municipio: String(r[2] || '').trim(),
                rede: String(r[3] || '').trim(),
                localizacao: String(r[4] || '').trim(),
                iniciais2025: typeof r[10] === 'number' ? r[10] : (typeof r[9] === 'number' ? r[9] : null),
                finais2025: typeof r[16] === 'number' ? r[16] : (typeof r[15] === 'number' ? r[15] : null)
            }));
        }
    }
    console.log(`[IDEB Escolas] Processadas ${idebEscolasData.length} escolas do Maranhão.`);
}

// Write escolas_maranhao_oficial_2015_2025.js
const idebEscJsContent = `// Base Oficial IDEB Escolas Maranhão
window.ESCOLAS_MARANHAO_IDEB = ${JSON.stringify(idebEscolasData, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'escolas_maranhao_oficial_2015_2025.js'), idebEscJsContent, 'utf8');

console.log('=== EXTRAÇÃO CONCLUÍDA COM SUCESSO! ===');
