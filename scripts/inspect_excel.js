const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const files = [
    { label: 'Descritores', path: 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\Matriz_Descritores_SAEB_SEAMA_IDEB_OBA.xlsx' },
    { label: 'BNCC', path: 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DESCRITORES SEAMA E SAEB\\BNCC\\BNCC_Separada_por_Etapa.xlsx' },
    { label: 'Ideb Municipios', path: 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DOCUMENTOS\\idebmaranhao\\IDEB_Maranhao_Municipios_2015-2025.xlsx' },
    { label: 'Ideb Escolas', path: 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DOCUMENTOS\\escolasmaranahoideb\\IDEB_Maranhao_Escolas_2015-2025.xlsx' }
];

files.forEach(f => {
    console.log(`=== FILE: ${f.label} (${f.path}) ===`);
    if (!fs.existsSync(f.path)) {
        console.log('File NOT found');
        return;
    }
    const wb = XLSX.readFile(f.path);
    console.log('Sheet names:', wb.SheetNames);
    wb.SheetNames.forEach(sheetName => {
        const sheet = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`--- Sheet: ${sheetName} (Total Rows: ${json.length}) ---`);
        console.log('Header / Row 0:', json[0]);
        if (json.length > 1) console.log('Row 1:', json[1]);
        if (json.length > 2) console.log('Row 2:', json[2]);
        if (json.length > 3) console.log('Row 3:', json[3]);
    });
    console.log('\n');
});
