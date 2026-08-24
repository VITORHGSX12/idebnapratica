const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const pdfDir = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'RELATORIOS SAEB');
const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));

async function parseAll() {
    console.log('=== EXTRAÇÃO DOS RELATÓRIOS OFICIAIS DO SAEB/IDEB ===\n');

    const results = {};

    for (const file of files) {
        const filePath = path.join(pdfDir, file);
        const dataBuffer = fs.readFileSync(filePath);
        try {
            const data = await pdf(dataBuffer);
            console.log(`\n📄 [${file}] (${data.numpages} páginas)`);
            
            // Extrair trechos chave
            const text = data.text;
            const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
            
            console.log('Primeiras 15 linhas:');
            console.log(lines.slice(0, 15).join(' | '));
            
            results[file] = {
                rawText: text,
                sampleLines: lines.slice(0, 30)
            };
        } catch(err) {
            console.error(`Erro ao ler ${file}:`, err.message);
        }
    }
}

parseAll();
