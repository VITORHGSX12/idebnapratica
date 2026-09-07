// scripts/read_ideb_manuals.js
const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const DIR = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\comocalcularidebsaeb';

async function extract(filename) {
    const filePath = path.join(DIR, filename);
    const data = fs.readFileSync(filePath);
    const parser = new PDFParse(new Uint8Array(data));
    await parser.load();
    const textResult = await parser.getText();
    return typeof textResult === 'string' ? textResult : (textResult.text || JSON.stringify(textResult));
}

async function run() {
    const files = fs.readdirSync(DIR).filter(f => f.endsWith('.pdf'));
    for (const f of files) {
        console.log(`\n=================== ${f} ===================`);
        try {
            const text = await extract(f);
            console.log(`Tamanho do texto extraído: ${text.length} caracteres.`);
            // Imprimir os primeiros 2000 caracteres e buscar seções de cálculo
            console.log('--- INÍCIO ---');
            console.log(text.slice(0, 1500));
            console.log('--- BUSCA POR PALAVRAS-CHAVE ---');
            const lines = text.split('\n');
            const keywords = ['fórmula', 'formula', 'indicador de rendimento', 'padronizada', 'média padronizada', 'fluxo', 'taxa de aprovação', 'ideb', 'saeb', 'proficiência', 'cálculo', 'calculo', 'N =', 'P =', 'N_', 'P_'];
            const matchedLines = [];
            lines.forEach((line, idx) => {
                if (keywords.some(k => line.toLowerCase().includes(k))) {
                    matchedLines.push(`[Linha ${idx + 1}] ${line.trim()}`);
                }
            });
            console.log(`Total de linhas com palavras-chave: ${matchedLines.length}`);
            console.log('Exemplos de linhas encontradas:');
            matchedLines.slice(0, 30).forEach(l => console.log(l));
        } catch (e) {
            console.error(`Erro ao ler ${f}:`, e.message);
        }
    }
}

run();
