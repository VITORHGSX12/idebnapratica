const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

let openParens = [];
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
                openParens.push({ line: i + 1, content: line.trim() });
            } else if (char === ')') {
                if (openParens.length === 0) {
                    console.log(`Extra closing parenthesis ) at line ${i + 1}: ${line.trim()}`);
                } else {
                    openParens.pop();
                }
            }
        }
    }
}

console.log(`Unclosed parens count (filtered): ${openParens.length}`);
if (openParens.length > 0) {
    console.log('Top 20 unclosed parens:');
    openParens.slice(0, 20).forEach((p) => {
        console.log(`Line ${p.line}: ${p.content}`);
    });
}
