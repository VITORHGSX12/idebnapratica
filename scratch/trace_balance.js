const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

let braces = 0;
let parens = 0;
let inString = false;
let stringChar = '';
let inLineComment = false;
let inBlockComment = false;

let lines = code.split('\n');

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    let i = 0;
    while (i < line.length) {
        let char = line[i];
        let nextChar = line[i + 1] || '';
        
        if (inLineComment) {
            // Line comment ends at the end of line
        } else if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                i++;
            }
        } else if (inString) {
            if (char === '\\') {
                i++; // Skip next char
            } else if (char === stringChar) {
                inString = false;
            }
        } else {
            if (char === '/' && nextChar === '/') {
                inLineComment = true;
                i++;
            } else if (char === '/' && nextChar === '*') {
                inBlockComment = true;
                i++;
            } else if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            } else {
                if (char === '{') braces++;
                if (char === '}') braces--;
                if (char === '(') parens++;
                if (char === ')') parens--;
            }
        }
        i++;
    }
    if (inLineComment) {
        inLineComment = false;
    }
    
    // Print lines where balance changes or is weird
    if (braces < 0 || parens < 0) {
        console.log(`Mismatch at line ${lineIdx + 1}: braces=${braces}, parens=${parens}`);
        console.log(`Line content: ${line.trim()}`);
        break;
    }
}
console.log(`Final balance: braces=${braces}, parens=${parens}`);
