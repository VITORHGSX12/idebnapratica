// scripts/analyze_all_pdf_texts.js
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
        console.log(`\n======================================================`);
        console.log(`DOCUMENTO: ${f}`);
        console.log(`======================================================`);
        const text = await extract(f);
        
        // Procurar por trechos com fórmulas, equações e títulos
        const lines = text.split('\n');
        console.log(`Total de linhas: ${lines.length}`);
        
        // Extrair cabeçalho / assunto
        const header = lines.slice(0, 35).join('\n');
        console.log('--- CABEÇALHO / ASSUNTO ---');
        console.log(header);

        // Procurar por termos específicos
        const interestTerms = ['metodologia', 'cálculo', 'formula', 'equação', 'padroniz', 'fluxo', 'ideb', 'saeb', 'peso', 'pondera', 'escala'];
        console.log('\n--- SEÇÕES RELEVANTES ---');
        let inSection = false;
        let count = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^[0-9]+(\.[0-9]+)*\s+[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(line.trim()) || line.toUpperCase().includes('METODOLOGIA') || line.toUpperCase().includes('CÁLCULO')) {
                console.log(`\n>>> SEÇÃO: ${line.trim()}`);
                // imprimir próximas 10 linhas
                for (let j = 1; j <= 12 && i + j < lines.length; j++) {
                    console.log(`    ${lines[i + j].trim()}`);
                }
                count++;
                if (count > 15) break;
            }
        }
    }
}

run();
