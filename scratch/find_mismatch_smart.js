const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

function cleanCode(code) {
    let clean = '';
    let i = 0;
    let inString = false;
    let stringChar = '';
    let inLineComment = false;
    let inBlockComment = false;
    
    while (i < code.length) {
        let char = code[i];
        let nextChar = code[i + 1] || '';
        
        if (inLineComment) {
            if (char === '\n') {
                inLineComment = false;
                clean += char;
            }
        } else if (inBlockComment) {
            if (char === '*' && nextChar === '/') {
                inBlockComment = false;
                i++;
            }
        } else if (inString) {
            if (char === '\\') {
                i++; // Skip next char (escaped)
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
                clean += char;
            }
        }
        i++;
    }
    return clean;
}

const cleaned = cleanCode(content);

let braces = 0;
let parens = 0;
let lines = cleaned.split('\n');

for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    for (let char of line) {
        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '(') parens++;
        if (char === ')') parens--;
    }
    if (braces < 0 || parens < 0) {
        console.log(`Smart mismatch at line ${idx + 1}: braces=${braces}, parens=${parens}`);
        console.log(`Content: ${line.trim()}`);
        break;
    }
}

console.log(`Cleaned Total: braces=${braces}, parens=${parens}`);
// Let's write cleaned to a file to inspect line numbers if needed
fs.writeFileSync('scratch/cleaned_app.js', cleaned);
