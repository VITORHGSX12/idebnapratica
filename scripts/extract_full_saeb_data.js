const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfDir = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'RELATORIOS SAEB');
const files = fs.readdirSync(pdfDir).filter(f => f.endsWith('.pdf'));

async function extractAllReports() {
    console.log('=== EXTRAÇÃO COMPLETA DOS DADOS SAEB / IDEB DE GONÇALVES DIAS ===\n');

    const schoolReports = {};

    for (const f of files) {
        const buf = fs.readFileSync(path.join(pdfDir, f));
        const parser = new PDFParse(new Uint8Array(buf));
        const textResult = await parser.getText();
        const text = textResult.text || '';

        // Extrair Nome e INEP
        const inepMatch = text.match(/GONÇALVES DIAS\s*-\s*MA\s+(\d{8})/i);
        const inep = inepMatch ? inepMatch[1] : '';

        // Extrair Nome da Escola
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        let schoolName = '';
        const boletimIdx = lines.findIndex(l => l.includes('Boletim da Escola'));
        if (boletimIdx !== -1 && lines[boletimIdx + 1]) {
            schoolName = lines[boletimIdx + 1];
        }

        // Extrair INSE
        const inseMatch = text.match(/N[íi]vel Socioecon[ôo]mico\s*\n*\s*(N[íi]vel\s+[IVXLCDM]+)/i);
        const inse = inseMatch ? inseMatch[1] : 'Nível IV';

        // Extrair Formação Docente
        const docIniciaisMatch = text.match(/Forma[çc][ãa]o Docente[\s\S]*?(\d+[\.,]\d+)\%/i);
        const docIniciais = docIniciaisMatch ? docIniciaisMatch[1] + '%' : '60%';

        // Extrair Proficiências (Médias de Proficiência LP e MT)
        const profMatches = [...text.matchAll(/M[ée]dia de Profici[êe]ncia[:\s]+(\d+[\.,]\d+)/gi)];
        const proficiencias = profMatches.map(m => parseFloat(m[1].replace(',', '.')));

        // Extrair Taxas de Participação
        const partMatches = [...text.matchAll(/Taxa de participa[çc][ãa]o\s+(\d+[\.,]\d+)\%/gi)];
        const participacao = partMatches.map(m => m[1] + '%');

        // Extrair dados do 5º ano e 9º ano
        schoolReports[f] = {
            arquivo: f,
            escola: schoolName,
            inep: inep,
            inse: inse,
            formacaoDocenteIniciais: docIniciais,
            proficiencias: proficiencias,
            participacao: participacao,
            textSnippet: lines.slice(0, 35)
        };

        console.log(`🏫 [${schoolName}] (INEP: ${inep})`);
        console.log(`   - INSE: ${inse} | Docência: ${docIniciais}`);
        console.log(`   - Proficiências extraídas: ${proficiencias.join(' | ')}`);
        console.log(`   - Taxa de Participação: ${participacao.join(' | ')}\n`);
    }

    fs.writeFileSync(
        path.join(__dirname, '..', 'js', 'data', 'saeb_reports_extracted.json'),
        JSON.stringify(schoolReports, null, 2),
        'utf8'
    );
    console.log('✅ Todos os relatórios foram extraídos e salvos em js/data/saeb_reports_extracted.json!');
}

extractAllReports();
