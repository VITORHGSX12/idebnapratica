// scripts/dump_pdf_sections.js
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\comocalcularidebsaeb';

async function run() {
    const p = path.join(DIR, 'NOTA_TECNICA_7_2024_CGEE_DIRED_INEP.pdf');
    const data = fs.readFileSync(p);
    const parser = new PDFParse(new Uint8Array(data));
    await parser.load();
    const res = await parser.getText();
    const text = typeof res === 'string' ? res : (res.text || JSON.stringify(res));

    fs.writeFileSync('scripts/nt_7_2024_full.txt', text, 'utf8');
    console.log('Arquivo salvo com tamanho:', text.length);

    // Salvar também Nota Tecnica 23
    const p23 = path.join(DIR, 'Nota_Tecnica_Conjunta_23_2023.pdf');
    const data23 = fs.readFileSync(p23);
    const parser23 = new PDFParse(new Uint8Array(data23));
    await parser23.load();
    const res23 = await parser23.getText();
    const text23 = typeof res23 === 'string' ? res23 : (res23.text || JSON.stringify(res23));
    fs.writeFileSync('scripts/nt_23_2023_full.txt', text23, 'utf8');

    // Salvar também Errata 12 2024
    const p12 = path.join(DIR, 'errata_nota_tcnica_n_12_2024.pdf');
    const data12 = fs.readFileSync(p12);
    const parser12 = new PDFParse(new Uint8Array(data12));
    await parser12.load();
    const res12 = await parser12.getText();
    const text12 = typeof res12 === 'string' ? res12 : (res12.text || JSON.stringify(res12));
    fs.writeFileSync('scripts/errata_12_2024_full.txt', text12, 'utf8');

    console.log('Todos os 3 textos extraídos com sucesso!');
}

run();
