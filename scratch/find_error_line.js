const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');

function check(limit) {
    let subCode = lines.slice(0, limit).join('\n');
    
    let stateStack = ['NORMAL'];
    let stringCharStack = [];

    for (let i = 0; i < subCode.length; i++) {
        const char = subCode[i];
        const nextChar = subCode[i + 1] || '';
        const state = stateStack[stateStack.length - 1];

        if (state === 'NORMAL' || state === 'TEMPLATE_JS' || state === 'PAREN' || state === 'BRACE' || state === 'BRACKET') {
            if (char === '/' && nextChar === '/') {
                stateStack.push('COMMENT_LINE');
                i++;
            } else if (char === '/' && nextChar === '*') {
                stateStack.push('COMMENT_BLOCK');
                i++;
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
                    stateStack.pop(); // pop TEMPLATE_JS, returns to TEMPLATE
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
                stateStack.pop(); // exits TEMPLATE
            } else if (char === '$' && nextChar === '{') {
                stateStack.push('TEMPLATE_JS');
                i++;
            }
        } else if (state === 'STRING') {
            const stringChar = stringCharStack[stringCharStack.length - 1];
            if (char === '\\') {
                i++;
            } else if (char === stringChar) {
                stateStack.pop();
                stringCharStack.pop();
            }
        } else if (state === 'COMMENT_LINE') {
            if (char === '\n') {
                stateStack.pop();
            }
        } else if (state === 'COMMENT_BLOCK') {
            if (char === '*' && nextChar === '/') {
                stateStack.pop();
                i++;
            }
        }
    }

    // Build suffix from remaining stateStack (excluding NORMAL, COMMENT_LINE, COMMENT_BLOCK)
    let suffix = '';
    
    // We must close from top of stack to bottom
    for (let j = stateStack.length - 1; j >= 0; j--) {
        const s = stateStack[j];
        if (s === 'STRING') {
            suffix += stringCharStack.pop() || "'";
        } else if (s === 'TEMPLATE') {
            suffix += '`';
        } else if (s === 'TEMPLATE_JS') {
            suffix += '}';
        } else if (s === 'PAREN') {
            suffix += ')';
        } else if (s === 'BRACE') {
            suffix += '}';
        } else if (s === 'BRACKET') {
            suffix += ']';
        }
    }

    let testCode = subCode + '\n' + suffix;
    try {
        acorn.parse(testCode, { ecmaVersion: 2020 });
        return true;
    } catch (e) {
        return e.message + ` [suffix was '\\n${suffix}']`;
    }
}

// Binary search
let low = 1;
let high = lines.length;
let ans = -1;

while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    let res = check(mid);
    if (res === true) {
        low = mid + 1;
    } else {
        ans = mid;
        high = mid - 1;
    }
}

console.log(`First syntax error introduced at line: ${ans}`);
if (ans !== -1) {
    console.log('Error message:', check(ans));
    console.log('Context (around that line):');
    for (let i = Math.max(1, ans - 5); i <= Math.min(lines.length, ans + 5); i++) {
        console.log(`${i === ans ? '=>' : '  '} Line ${i}: ${lines[i - 1]}`);
    }
}
