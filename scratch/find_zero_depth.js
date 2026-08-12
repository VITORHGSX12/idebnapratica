const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

let depth = 0;
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
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0) {
                    console.log(`Brace depth became 0 at line ${i + 1}: ${line.trim()}`);
                }
            }
        }
    }
}

console.log(`Final depth: ${depth}`);
