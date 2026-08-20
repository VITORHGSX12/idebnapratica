/**
 * Script de Importação de CSVs Oficiais do INEP (Consulta Ideb / InepData)
 * 
 * Uso:
 *   node scripts/import_inep_csv.js <caminho-do-arquivo.csv> [--municipio "Gonçalves Dias"]
 *
 * Exemplo:
 *   node scripts/import_inep_csv.js ./data/raw/divulgacao_anos_iniciais_escolas_2023.csv
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log(`
Uso: node scripts/import_inep_csv.js <caminho-do-arquivo-csv> [--municipio "Gonçalves Dias"]

Descrição:
  Lê arquivos CSV extraídos do Consulta Ideb ou InepData e atualiza automaticamente
  o arquivo src/data/schools.json para consumo pelo dashboard executivo SEMED.
  `);
  process.exit(0);
}

function normalizeStr(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

const csvPath = path.resolve(args[0]);
let targetMunicipioRaw = "Gonçalves Dias";

const munIdx = args.indexOf('--municipio');
if (munIdx !== -1 && args[munIdx + 1]) {
  targetMunicipioRaw = args[munIdx + 1];
}
const targetMunicipioNorm = normalizeStr(targetMunicipioRaw);

if (!fs.existsSync(csvPath)) {
  console.error(`❌ Erro: Arquivo CSV não encontrado em ${csvPath}`);
  process.exit(1);
}

console.log(`🚀 Processando CSV INEP: ${csvPath}`);
console.log(`🎯 Filtrando Município: ${targetMunicipioRaw} (${targetMunicipioNorm})`);

const fileBuffer = fs.readFileSync(csvPath);
// Detect Encoding (UTF-8 or ISO-8859-1)
let content = fileBuffer.toString('utf8');
if (content.includes('\uFFFD')) {
  console.log('ℹ️ Detectada codificação ISO-8859-1 / Latin1, convertendo...');
  content = fileBuffer.toString('latin1');
}

const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

if (lines.length === 0) {
  console.error('❌ Erro: O arquivo CSV está vazio.');
  process.exit(1);
}

// Detect delimiter (; or ,)
const firstLine = lines[0];
const delimiter = firstLine.includes(';') ? ';' : ',';
console.log(`ℹ️ Delimitador detectado: "${delimiter}"`);

const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toUpperCase());

// Match column indexes for INEP formats
function findHeaderIdx(possibleNames) {
  return headers.findIndex(h => possibleNames.some(p => h.includes(p)));
}

const schoolNameIdx = findHeaderIdx(['NOME DA ESCOLA', 'NO_ENTIDADE', 'ESCOLA', 'NO_ESCOLA']);
const schoolCodeIdx = findHeaderIdx(['CÓDIGO DA ESCOLA', 'CODIGO DA ESCOLA', 'CO_ENTIDADE', 'ID_ESCOLA', 'PK_COD_ENTIDADE']);
const munNameIdx = findHeaderIdx(['NOME DO MUNICÍPIO', 'NOME DO MUNICIPIO', 'NO_MUNICIPIO', 'MUNICIPIO']);
const locIdx = findHeaderIdx(['LOCALIZAÇÃO', 'LOCALIZACAO', 'TP_LOCALIZACAO']);
const idebIdx = findHeaderIdx(['IDEB 2023', 'IDEB2023', 'VL_OBSERVADO_2023', 'IDEB 2025', 'IDEB2025']);

console.log(`📌 Colunas identificadas:`);
console.log(`   - Escola: ${schoolNameIdx !== -1 ? headers[schoolNameIdx] : 'Não encontrada'}`);
console.log(`   - Código INEP: ${schoolCodeIdx !== -1 ? headers[schoolCodeIdx] : 'Não encontrada'}`);
console.log(`   - Município: ${munNameIdx !== -1 ? headers[munNameIdx] : 'Não encontrada'}`);
console.log(`   - Localização: ${locIdx !== -1 ? headers[locIdx] : 'Não encontrada'}`);
console.log(`   - Score Ideb: ${idebIdx !== -1 ? headers[idebIdx] : 'Não encontrada'}`);

const importedSchools = [];

for (let i = 1; i < lines.length; i++) {
  const row = lines[i].split(delimiter).map(c => c.trim().replace(/^"|"$/g, ''));
  if (row.length < headers.length) continue;

  const munNameNorm = munNameIdx !== -1 ? normalizeStr(row[munNameIdx]) : targetMunicipioNorm;
  
  if (munNameNorm.includes(targetMunicipioNorm)) {
    const nome = schoolNameIdx !== -1 ? row[schoolNameIdx] : `Escola ${i}`;
    const codigoInep = schoolCodeIdx !== -1 ? row[schoolCodeIdx] : `${21000000 + i}`;
    const locRaw = locIdx !== -1 ? row[locIdx] : 'Urbana';
    const idebRaw = idebIdx !== -1 ? row[idebIdx].replace(',', '.') : '5.2';

    const localizacao = (locRaw.toUpperCase().includes('RURAL') || locRaw === '2') ? 'Zona Rural' : 'Sede Urbana';
    const scoreIdeb = parseFloat(idebRaw) || 5.0;

    importedSchools.push({
      id: codigoInep,
      nome: nome.toUpperCase(),
      codigoInep: codigoInep,
      scoreIdeb: parseFloat(scoreIdeb.toFixed(1)),
      localizacao: localizacao,
      status: 'ATIVA',
      municipio: targetMunicipioRaw,
      uf: 'MA',
      rede: 'Municipal'
    });
  }
}

console.log(`✅ Sucesso! Encontradas ${importedSchools.length} escolas para ${targetMunicipioRaw}.`);

if (importedSchools.length > 0) {
  const targetJsonPath = path.resolve(__dirname, '../src/data/schools.json');
  fs.writeFileSync(targetJsonPath, JSON.stringify(importedSchools, null, 2), 'utf8');
  console.log(`💾 Arquivo src/data/schools.json atualizado com sucesso!`);
} else {
  console.warn(`⚠️ Nenhuma escola correspondente a "${targetMunicipioRaw}" foi encontrada no CSV.`);
}
