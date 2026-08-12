const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');

function tryCompile(limit) {
    let subCode = lines.slice(0, limit).join('\n');
    let parenDepth = 0;
    let braceStack = [];
    let inString = false;
    let stringChar = '';
    let inComment = false;

    for (let i = 0; i < subCode.length; i++) {
        const char = subCode[i];
        const nextChar = subCode[i + 1] || '';
        const state = braceStack.length > 0 && braceStack[braceStack.length - 1].isJS ? 'TEMPLATE_JS' : 
                      inString ? 'STRING' : inComment ? 'COMMENT' : 'NORMAL';

        if (state === 'NORMAL') {
            if (char === '/' && nextChar === '/') {
                inComment = true;
                i++;
            } else if (char === '/' && nextChar === '*') {
                inComment = true;
                i++;
            } else if (char === "'" || char === '"' || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '(') {
                parenDepth++;
            } else if (char === ')') {
                parenDepth--;
            } else if (char === '{') {
                braceStack.push({ isJS: false });
            } else if (char === '}') {
                braceStack.pop();
            }
        } else if (state === 'STRING') {
            if (char === '\\') {
                i++;
            } else if (char === stringChar) {
                inString = false;
            } else if (stringChar === '`' && char === '$' && nextChar === '{') {
                braceStack.push({ isJS: true });
                i++;
            }
        } else if (state === 'TEMPLATE_JS') {
            if (char === '}') {
                braceStack.pop();
            } else if (char === '{') {
                braceStack.push({ isJS: false });
            } else if (char === '(') {
                parenDepth++;
            } else if (char === ')') {
                parenDepth--;
            }
        } else if (state === 'COMMENT') {
            // we don't care much, it ends or not
        }
    }

    let suffix = '';
    let parenCount = parenDepth;
    let braceCount = braceStack.length;
    while (parenDepth > 0) {
        suffix += ')';
        parenDepth--;
    }
    while (braceStack.length > 0) {
        braceStack.pop();
        suffix += '}';
    }

    let testCode = subCode + suffix;
    console.log(`Limit: ${limit}`);
    console.log(`Paren depth: ${parenCount}, brace stack: ${braceCount}`);
    console.log(`Suffix: '${suffix}'`);
    console.log(`Test code: '${testCode}'`);
    try {
        new vm.Script(testCode);
        console.log('Success!');
    } catch (e) {
        console.log('Error:', e.message);
    }
}

tryCompile(1);
