const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

let depth = 0;
let inString = false;
let stringChar = '';
let inComment = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check characters
    let lineChanges = '';
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
                depth++;
                if (i + 1 >= 1470 && i + 1 <= 1545) lineChanges += '(';
            } else if (char === ')') {
                depth--;
                if (i + 1 >= 1470 && i + 1 <= 1545) lineChanges += ')';
            }
        }
    }
    
    if (i + 1 >= 1470 && i + 1 <= 1545) {
        console.log(`Line ${i + 1}: depth = ${depth} (changes: ${lineChanges}) -> ${line.trim()}`);
    }
}
