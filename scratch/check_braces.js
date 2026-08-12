const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

let openBraces = [];
let inString = false;
let stringChar = '';
let inComment = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let col = 0; col < line.length; col++) {
        const char = line[col];
        
        // Handle strings
        if ((char === '"' || char === "'" || char === '`') && !inComment) {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (stringChar === char) {
                inString = false;
            }
        }
        
        // Handle comments
        if (char === '/' && line[col + 1] === '/' && !inString) {
            break; // ignore rest of line
        }
        
        if (!inString && !inComment) {
            if (char === '{') {
                openBraces.push({ line: i + 1, content: line.trim() });
            } else if (char === '}') {
                if (openBraces.length === 0) {
                    console.log(`Extra closing brace } at line ${i + 1}: ${line.trim()}`);
                } else {
                    openBraces.pop();
                }
            }
        }
    }
}

console.log(`Unclosed braces count (filtered): ${openBraces.length}`);
if (openBraces.length > 0) {
    console.log('Top 20 unclosed braces:');
    openBraces.slice(0, 20).forEach((b) => {
        console.log(`Line ${b.line}: ${b.content}`);
    });
}
