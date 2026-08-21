const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const dirPath = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\DOCUMENTOS\\RELATORIOS SAEB';
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf'));

async function parseAllPdfs() {
  console.log(`Found ${files.length} PDF reports in ${dirPath}\n`);
  const parsedSchools = [];

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const dataBuffer = fs.readFileSync(fullPath);
    try {
      const uint8 = new Uint8Array(dataBuffer);
      const parser = new PDFParse(uint8);
      const doc = await parser.load();
      
      let fullText = '';
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- PAGE ${i} ---\n` + pageText;
      }

      console.log(`========================================`);
      console.log(`FILE: ${file}`);
      console.log(`Pages: ${doc.numPages} | Length: ${fullText.length}`);
      console.log(`--- SAMPLE (FIRST 800 CHARS) ---`);
      console.log(fullText.substring(0, 800));
      console.log(`========================================\n`);

      parsedSchools.push({
        fileName: file,
        pages: doc.numPages,
        text: fullText
      });
    } catch(err) {
      console.error(`Error parsing ${file}:`, err.stack || err.message);
    }
  }

  const outFile = path.join(__dirname, 'extracted_pdf_reports_text.json');
  fs.writeFileSync(outFile, JSON.stringify(parsedSchools, null, 2), 'utf8');
  console.log(`Saved extracted text to ${outFile}`);
}

parseAllPdfs();
