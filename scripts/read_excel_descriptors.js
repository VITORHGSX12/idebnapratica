const xlsx = require('xlsx');

const f1 = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\Matriz_Descritores_SAEB_SEAMA_IDEB_OBA.xlsx';
const f2 = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\BNCC\\BNCC_Separada_por_Etapa.xlsx';

console.log('=== File 1: Matriz_Descritores_SAEB_SEAMA_IDEB_OBA.xlsx ===');
const wb1 = xlsx.readFile(f1);
console.log('Sheets:', wb1.SheetNames);
wb1.SheetNames.forEach(name => {
  const data = xlsx.utils.sheet_to_json(wb1.Sheets[name]);
  console.log(`Sheet "${name}": ${data.length} rows`);
  if (data.length > 0) {
    console.log('Keys:', Object.keys(data[0]));
    console.log('Sample row 0:', JSON.stringify(data[0]));
    console.log('Sample row 1:', JSON.stringify(data[1] || {}));
  }
});

console.log('\n=== File 2: BNCC_Separada_por_Etapa.xlsx ===');
const wb2 = xlsx.readFile(f2);
console.log('Sheets:', wb2.SheetNames);
wb2.SheetNames.forEach(name => {
  const data = xlsx.utils.sheet_to_json(wb2.Sheets[name]);
  console.log(`Sheet "${name}": ${data.length} rows`);
  if (data.length > 0) {
    console.log('Keys:', Object.keys(data[0]));
    console.log('Sample row 0:', JSON.stringify(data[0]));
    console.log('Sample row 1:', JSON.stringify(data[1] || {}));
  }
});
