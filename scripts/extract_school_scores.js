const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'extracted_pdf_reports_text.json');
const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const schoolsResult = [];

rawData.forEach(item => {
  const text = item.text;
  const fileName = item.fileName;

  const inepMatch = text.match(/(?:GONÇALVES DIAS - MA\s+)(\d{8})/i) || text.match(/(\d{8})/);
  const inepCode = inepMatch ? inepMatch[1] : '';

  let name = fileName.replace('RELATÓRIO - ', '').replace('.pdf', '').trim();

  // Search for Participation rate
  let partMatch = text.match(/Taxa de participação\s+([\d.,]+%)\s+([\d.,]+%)/);
  let partAI = partMatch ? partMatch[1] : '100%';
  let partAF = partMatch ? partMatch[2] : '100%';

  // Search for Proficiency numbers in text
  // Let's search for sequences of floating point numbers like 210,4 235,8 etc.
  const floatMatches = text.match(/\b\d{2,3}[.,]\d{1,2}\b/g) || [];
  
  // Filter numbers between 100 and 400 (typical SAEB proficiencies)
  const saebScores = floatMatches.map(v => parseFloat(v.replace(',', '.'))).filter(v => v >= 100 && v <= 400);

  // Filter numbers between 1.0 and 10.0 (typical IDEB scores)
  const idebScores = floatMatches.map(v => parseFloat(v.replace(',', '.'))).filter(v => v >= 1.5 && v <= 10.0);

  schoolsResult.push({
    fileName,
    name,
    inepCode,
    partAI,
    partAF,
    allSaebScoresFound: saebScores.slice(0, 10),
    allIdebScoresFound: idebScores.slice(0, 10),
    rawSnippet: text.substring(0, 600)
  });
});

console.log('=== SUMMARY OF PARSED SCHOOLS ===');
console.log(JSON.stringify(schoolsResult, null, 2));

fs.writeFileSync(
  path.join(__dirname, 'parsed_school_scores_summary.json'),
  JSON.stringify(schoolsResult, null, 2),
  'utf8'
);
