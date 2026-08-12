const fs = require('fs');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');

let stateStack = ['NORMAL'];
let stringCharStack = [];
let braceDepth = 0;

console.log('Line-by-line brace depth tracker:');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check braces count before line
    const prevBraceDepth = braceDepth;

    for (let col = 0; col < line.length; col++) {
        const char = line[col];
        const nextChar = line[col + 1] || '';
        const state = stateStack[stateStack.length - 1];

        if (state === 'NORMAL' || state === 'TEMPLATE_JS' || state === 'PAREN' || state === 'BRACE' || state === 'BRACKET') {
            if (char === '/' && nextChar === '/') {
                stateStack.push('COMMENT_LINE');
                col++;
            } else if (char === '/' && nextChar === '*') {
                stateStack.push('COMMENT_BLOCK');
                col++;
            } else if (char === '`') {
                stateStack.push('TEMPLATE');
            } else if (char === "'" || char === '"') {
                stateStack.push('STRING');
                stringCharStack.push(char);
            } else if (char === '(') {
                stateStack.push('PAREN');
            } else if (char === ')') {
                if (state === 'PAREN') {
                    stateStack.pop();
                }
            } else if (char === '{') {
                stateStack.push('BRACE');
            } else if (char === '}') {
                if (state === 'BRACE') {
                    stateStack.pop();
                } else if (state === 'TEMPLATE_JS') {
                    stateStack.pop();
                }
            } else if (char === '[') {
                stateStack.push('BRACKET');
            } else if (char === ']') {
                if (state === 'BRACKET') {
                    stateStack.pop();
                }
            }
        } else if (state === 'TEMPLATE') {
            if (char === '`') {
                stateStack.pop();
            } else if (char === '$' && nextChar === '{') {
                stateStack.push('TEMPLATE_JS');
                col++;
            }
        } else if (state === 'STRING') {
            const stringChar = stringCharStack[stringCharStack.length - 1];
            if (char === '\\') {
                col++;
            } else if (char === stringChar) {
                stateStack.pop();
                stringCharStack.pop();
            }
        } else if (state === 'COMMENT_LINE') {
            // ends at newline, handled outside char loop
        } else if (state === 'COMMENT_BLOCK') {
            if (char === '*' && nextChar === '/') {
                stateStack.pop();
                col++;
            }
        }
    }

    if (stateStack[stateStack.length - 1] === 'COMMENT_LINE') {
        stateStack.pop();
    }

    // Count how many 'BRACE' and 'TEMPLATE_JS' are on stateStack
    braceDepth = stateStack.filter(s => s === 'BRACE' || s === 'TEMPLATE_JS').length;

    // Log if depth changed
    if (braceDepth !== prevBraceDepth) {
        // Let's filter to show only depth transitions at the function level (depth 1 <-> 2)
        if (braceDepth === 1 || prevBraceDepth === 1) {
            console.log(`Line ${i + 1}: Depth ${prevBraceDepth} -> ${braceDepth} | ${line.trim().slice(0, 80)}`);
        }
    }
}
