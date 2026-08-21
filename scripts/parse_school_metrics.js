const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'extracted_pdf_reports_text.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`Processing ${rawData.length} schools...`);

const parsedSchools = [];

rawData.forEach(item => {
  const text = item.text;
  const fileName = item.fileName;

  // Extract School Name & INEP Code
  const inepMatch = text.match(/(?:GONÇALVES DIAS - MA\s+)(\d{8})/i) || text.match(/(\d{8})/);
  const inepCode = inepMatch ? inepMatch[1] : '';

  let schoolName = fileName.replace('RELATÓRIO - ', '').replace('.pdf', '').trim();

  // Search for 5º Ano and 9º Ano proficiencies / IDEB in text
  // Let's print snippets containing numbers and proficiência
  console.log(`\n========================================`);
  console.log(`SCHOOL: ${schoolName} (INEP: ${inepCode})`);
  
  // Find lines with numbers, "Língua Portuguesa", "Matemática", "Ideb", "Proficiência", "2025", "2023", etc.
  const lines = text.split('\n');
  const relevantLines = lines.filter(l => 
    l.includes('Proficiência') || 
    l.includes('Média') || 
    l.includes('Ideb') || 
    l.includes('5° Ano') || 
    l.includes('5º Ano') || 
    l.includes('9° Ano') || 
    l.includes('9º Ano') ||
    l.includes('Língua Portuguesa') ||
    l.includes('Matemática')
  );

  console.log('RELEVANT SNIPPETS (first 15):');
  relevantLines.slice(0, 15).forEach(l => console.log('  ', l.trim()));
});
