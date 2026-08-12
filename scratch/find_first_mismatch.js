const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

let braces = 0;
let parens = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let char of line) {
        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '(') parens++;
        if (char === ')') parens--;
    }
    if (braces < 0 || parens < 0) {
        console.log(`First mismatch at line ${i + 1}: braces=${braces}, parens=${parens}`);
        console.log(`Content of line ${i + 1}: ${line}`);
        break;
    }
}
