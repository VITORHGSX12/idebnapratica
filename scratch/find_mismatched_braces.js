const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

let braces = 0;
let parens = 0;
let lines = content.split('\n');

lines.forEach((line, index) => {
    for (let char of line) {
        if (char === '{') braces++;
        if (char === '}') braces--;
        if (char === '(') parens++;
        if (char === ')') parens--;
    }
    if (braces < 0 || parens < 0) {
        console.log(`Mismatch at line ${index + 1}: braces=${braces}, parens=${parens}`);
    }
});

console.log(`Total: braces=${braces}, parens=${parens}`);
