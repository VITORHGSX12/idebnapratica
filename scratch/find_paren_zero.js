const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

let parenDepth = 0;
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
            if (char === '(') {
                parenDepth++;
            } else if (char === ')') {
                parenDepth--;
                if (parenDepth === 0) {
                    console.log(`Paren depth became 0 at line ${i + 1}: ${line.trim()}`);
                }
            }
        }
    }
}
