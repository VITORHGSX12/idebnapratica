const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const f1 = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\Matriz_Descritores_SAEB_SEAMA_IDEB_OBA.xlsx';
const f2 = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\BNCC\\BNCC_Separada_por_Etapa.xlsx';

const wb1 = xlsx.readFile(f1);
const wb2 = xlsx.readFile(f2);

const outputData = {
  descritores: {
    visaoGeral: [],
    linguaPortuguesa: [],
    matematica: [],
    ciencias: [],
    geografiaOba: []
  },
  bncc: {
    segundoAno: [],
    quintoAno: [],
    nonoAno: []
  }
};

// 1. Visão Geral
if (wb1.Sheets['Visão Geral']) {
  const rows = xlsx.utils.sheet_to_json(wb1.Sheets['Visão Geral']);
  // Header row 0 is column titles: "Disciplina", "__EMPTY", "__EMPTY_1", "__EMPTY_2"
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const disciplina = r['Matriz Consolidada de Descritores — SAEB / SEAMA / IDEB / OBA'] || '';
    const topico = r['__EMPTY'] || '';
    const codigo = r['__EMPTY_1'] || '';
    const descricao = r['__EMPTY_2'] || '';
    if (codigo && descricao) {
      outputData.descritores.visaoGeral.push({ disciplina, topico, codigo, descricao });
    }
  }
}

// 2. Língua Portuguesa
if (wb1.Sheets['Língua Portuguesa']) {
  const rows = xlsx.utils.sheet_to_json(wb1.Sheets['Língua Portuguesa']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const topico = r['Matriz de Descritores e Habilidades — Língua Portuguesa'] || '';
    const codigo = r['__EMPTY'] || '';
    const descricao = r['__EMPTY_1'] || '';
    if (codigo && descricao) {
      outputData.descritores.linguaPortuguesa.push({ topico, codigo, descricao });
    }
  }
}

// 3. Matemática
if (wb1.Sheets['Matemática']) {
  const rows = xlsx.utils.sheet_to_json(wb1.Sheets['Matemática']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const topico = r['Matriz de Descritores e Habilidades — Matemática'] || '';
    const codigo = r['__EMPTY'] || '';
    const descricao = r['__EMPTY_1'] || '';
    if (codigo && descricao) {
      outputData.descritores.matematica.push({ topico, codigo, descricao });
    }
  }
}

// 4. Ciências
if (wb1.Sheets['Ciências']) {
  const rows = xlsx.utils.sheet_to_json(wb1.Sheets['Ciências']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const topico = r['Matriz de Descritores e Habilidades — Ciências'] || '';
    const codigo = r['__EMPTY'] || '';
    const descricao = r['__EMPTY_1'] || '';
    if (codigo && descricao) {
      outputData.descritores.ciencias.push({ topico, codigo, descricao });
    }
  }
}

// 5. Geografia (OBA)
if (wb1.Sheets['Geografia (OBA)']) {
  const rows = xlsx.utils.sheet_to_json(wb1.Sheets['Geografia (OBA)']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const topico = r['Matriz de Descritores e Habilidades — Geografia (OBA)'] || '';
    const codigo = r['__EMPTY'] || '';
    const descricao = r['__EMPTY_1'] || '';
    if (codigo && descricao) {
      outputData.descritores.geografiaOba.push({ topico, codigo, descricao });
    }
  }
}

// 6. BNCC 2º Ano
if (wb2.Sheets['2º Ano (Anos Iniciais)']) {
  const rows = xlsx.utils.sheet_to_json(wb2.Sheets['2º Ano (Anos Iniciais)']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const disciplina = r['BNCC — Matriz Curricular do 2º Ano (Anos Iniciais)'] || '';
    const campo = r['__EMPTY'] || '';
    const objeto = r['__EMPTY_1'] || '';
    const codigo = r['__EMPTY_2'] || '';
    const descricao = r['__EMPTY_3'] || '';
    if (codigo && descricao) {
      outputData.bncc.segundoAno.push({ disciplina, campo, objeto, codigo, descricao });
    }
  }
}

// 7. BNCC 5º Ano
if (wb2.Sheets['5º Ano (Anos Iniciais)']) {
  const rows = xlsx.utils.sheet_to_json(wb2.Sheets['5º Ano (Anos Iniciais)']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const disciplina = r['BNCC — Matriz Curricular do 5º Ano (Anos Iniciais)'] || '';
    const campo = r['__EMPTY'] || '';
    const objeto = r['__EMPTY_1'] || '';
    const codigo = r['__EMPTY_2'] || '';
    const descricao = r['__EMPTY_3'] || '';
    if (codigo && descricao) {
      outputData.bncc.quintoAno.push({ disciplina, campo, objeto, codigo, descricao });
    }
  }
}

// 8. BNCC 9º Ano
if (wb2.Sheets['9º Ano (Anos Finais)']) {
  const rows = xlsx.utils.sheet_to_json(wb2.Sheets['9º Ano (Anos Finais)']);
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const disciplina = r['BNCC — Matriz Curricular do 9º Ano (Anos Finais)'] || '';
    const campo = r['__EMPTY'] || '';
    const objeto = r['__EMPTY_1'] || '';
    const codigo = r['__EMPTY_2'] || '';
    const descricao = r['__EMPTY_3'] || '';
    if (codigo && descricao) {
      outputData.bncc.nonoAno.push({ disciplina, campo, objeto, codigo, descricao });
    }
  }
}

const outPath = path.join(__dirname, '..', 'src', 'data', 'matrizes_descritores_bncc.json');
fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2), 'utf8');

const jsPath = path.join(__dirname, '..', 'matrizes_descritores_bncc_data.js');
const jsContent = `// Base Oficial Consolidada: Matrizes SAEB / SEAMA / IDEB / OBA & BNCC
window.MATRIZES_DESCRITORES_BNCC_DATA = ${JSON.stringify(outputData, null, 2)};
if (typeof module !== 'undefined' && module.exports) {
  module.exports = window.MATRIZES_DESCRITORES_BNCC_DATA;
}
`;
fs.writeFileSync(jsPath, jsContent, 'utf8');

console.log('Successfully generated matrizes_descritores_bncc.json & matrizes_descritores_bncc_data.js!');
console.log(`Visão Geral: ${outputData.descritores.visaoGeral.length} descritores`);
console.log(`Língua Portuguesa: ${outputData.descritores.linguaPortuguesa.length} descritores`);
console.log(`Matemática: ${outputData.descritores.matematica.length} descritores`);
console.log(`Ciências: ${outputData.descritores.ciencias.length} descritores`);
console.log(`Geografia (OBA): ${outputData.descritores.geografiaOba.length} descritores`);
console.log(`BNCC 2º Ano: ${outputData.bncc.segundoAno.length} habilidades`);
console.log(`BNCC 5º Ano: ${outputData.bncc.quintoAno.length} habilidades`);
console.log(`BNCC 9º Ano: ${outputData.bncc.nonoAno.length} habilidades`);
