const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');

let braces = 0;
let parens = 0;
let inString = false;
let stringChar = '';
let inLineComment = false;
let inBlockComment = false;

let lines = code.split('\n');

const stack = [];

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
                if (char === '{') {
                    braces++;
                    stack.push({ type: '{', line: lineIdx + 1 });
                }
                if (char === '}') {
                    braces--;
                    const pop = stack.pop();
                    if (!pop || pop.type !== '{') {
                        console.log(`Unmatched } at line ${lineIdx + 1}`);
                    }
                }
                if (char === '(') {
                    parens++;
                    stack.push({ type: '(', line: lineIdx + 1 });
                }
                if (char === ')') {
                    parens--;
                    const pop = stack.pop();
                    if (!pop || pop.type !== '(') {
                        console.log(`Unmatched ) at line ${lineIdx + 1}`);
                    }
                }
            }
        }
        i++;
    }
    if (inLineComment) {
        inLineComment = false;
    }
}

console.log('Unclosed items in stack:');
stack.forEach(item => {
    console.log(`Unclosed ${item.type} opened at line ${item.line}: ${lines[item.line - 1].trim()}`);
});
