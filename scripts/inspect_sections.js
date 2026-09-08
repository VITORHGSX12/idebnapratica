const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const content = fs.readFileSync(indexHtmlPath, 'utf8');

const lines = content.split('\n');
console.log('Total lines in index.html:', lines.length);

const sectionRegex = /<section\s+id="([^"]+)"\s+class="([^"]*tab-content[^"]*)"/g;
let match;
const sections = [];

while ((match = sectionRegex.exec(content)) !== null) {
    const id = match[1];
    const index = match.index;
    const lineNumber = content.substring(0, index).split('\n').length;
    sections.push({ id, lineNumber });
}

console.log('Sections found:');
sections.forEach(s => console.log(`- #${s.id} (Line ${s.lineNumber})`));
