// scripts/extract_formulas.js
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
        console.log(`ARQUIVO: ${f}`);
        console.log(`======================================================`);
        const text = await extract(f);
        const lines = text.split('\n');
        
        // Procurar por blocos com formulas de proficiencia normalizada, fluxo, etc.
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('normalização da proficiência') || 
                line.includes('normaliz') || 
                line.includes('Padroniz') || 
                line.includes('8.2.2.') ||
                line.includes('Ideb') ||
                line.includes('IDEB') ||
                line.includes('N_') ||
                line.includes('P_') ||
                line.includes('fluxo') ||
                line.includes('aprovação')) {
                
                // Mostrar contexto de 15 linhas se relevante
                const ctx = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 15)).join('\n');
                if (ctx.includes('Matemá') || ctx.includes('Portug') || ctx.includes('escala') || ctx.includes('taxa') || ctx.includes('Ideb') || ctx.includes('IDEB')) {
                    console.log(`--- [Linha ${i + 1}] ---`);
                    console.log(ctx);
                    console.log('------------------------------------------------------');
                    i += 10; // pular para evitar duplicação excessiva
                }
            }
        }
    }
}

run();
