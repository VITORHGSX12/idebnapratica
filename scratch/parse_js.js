const fs = require('fs');

const code = fs.readFileSync('app.js', 'utf8');

let parenStack = [];
let braceStack = [];
let stateStack = ['NORMAL']; // NORMAL, TEMPLATE, TEMPLATE_JS, SINGLE, DOUBLE, BLOCK_COMMENT, LINE_COMMENT

let lineNum = 1;
let colNum = 1;

for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1] || '';
    const state = stateStack[stateStack.length - 1];

    if (char === '\n') {
        lineNum++;
        colNum = 1;
        if (state === 'LINE_COMMENT') {
            stateStack.pop();
        }
        continue;
    }

    // Handle escapes in strings
    if ((state === 'SINGLE' || state === 'DOUBLE' || state === 'TEMPLATE') && char === '\\') {
        i++; // skip next char
        colNum += 2;
        continue;
    }

    if (state === 'NORMAL' || state === 'TEMPLATE_JS') {
        if (char === '/' && nextChar === '/') {
            stateStack.push('LINE_COMMENT');
            i++;
            colNum += 2;
        } else if (char === '/' && nextChar === '*') {
            stateStack.push('BLOCK_COMMENT');
            i++;
            colNum += 2;
        } else if (char === "'") {
            stateStack.push('SINGLE');
            colNum++;
        } else if (char === '"') {
            stateStack.push('DOUBLE');
            colNum++;
        } else if (char === '`') {
            stateStack.push('TEMPLATE');
            colNum++;
        } else if (char === '(') {
            parenStack.push({ line: lineNum, col: colNum });
            colNum++;
        } else if (char === ')') {
            if (parenStack.length === 0) {
                console.log(`EXTRA closing parenthesis ) at line ${lineNum}, col ${colNum}`);
            } else {
                parenStack.pop();
            }
            colNum++;
        } else if (char === '{') {
            braceStack.push({ line: lineNum, col: colNum, isJS: false });
            colNum++;
        } else if (char === '}') {
            if (state === 'TEMPLATE_JS' && braceStack.length > 0 && braceStack[braceStack.length - 1].isJS) {
                // Close the template JS interpolation
                braceStack.pop();
                stateStack.pop(); // return to TEMPLATE state
            } else {
                if (braceStack.length === 0) {
                    console.log(`EXTRA closing brace } at line ${lineNum}, col ${colNum}`);
                } else {
                    braceStack.pop();
                }
            }
            colNum++;
        } else {
            colNum++;
        }
    } else if (state === 'TEMPLATE') {
        if (char === '`') {
            stateStack.pop();
            colNum++;
        } else if (char === '$' && nextChar === '{') {
            stateStack.push('TEMPLATE_JS');
            braceStack.push({ line: lineNum, col: colNum, isJS: true });
            i++;
            colNum += 2;
        } else {
            colNum++;
        }
    } else if (state === 'SINGLE') {
        if (char === "'") {
            stateStack.pop();
        }
        colNum++;
    } else if (state === 'DOUBLE') {
        if (char === '"') {
            stateStack.pop();
        }
        colNum++;
    } else if (state === 'BLOCK_COMMENT') {
        if (char === '*' && nextChar === '/') {
            stateStack.pop();
            i++;
            colNum += 2;
        } else {
            colNum++;
        }
    } else {
        colNum++;
    }
}

console.log('--- Check complete ---');
console.log(`Unclosed parens: ${parenStack.length}`);
parenStack.forEach(p => console.log(`Unclosed ( from line ${p.line}, col ${p.col}`));

console.log(`Unclosed braces: ${braceStack.length}`);
braceStack.forEach(b => console.log(`Unclosed { from line ${b.line}, col ${b.col}`));
