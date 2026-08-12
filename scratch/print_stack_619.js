const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
let subCode = lines.slice(0, 619).join('\n');

let bracketStack = [];
let inString = false;
let stringChar = '';
let inCommentLine = false;
let inCommentBlock = false;

for (let i = 0; i < subCode.length; i++) {
    const char = subCode[i];
    const nextChar = subCode[i + 1] || '';
    
    if (inCommentLine) {
        if (char === '\n') {
            inCommentLine = false;
        }
        continue;
    }
    
    if (inCommentBlock) {
        if (char === '*' && nextChar === '/') {
            inCommentBlock = false;
            i++;
        }
        continue;
    }

    const state = bracketStack.length > 0 && bracketStack[bracketStack.length - 1] === 'TEMPLATE_JS' ? 'TEMPLATE_JS' : 
                  inString ? 'STRING' : 'NORMAL';

    if (state === 'NORMAL') {
        if (char === '/' && nextChar === '/') {
            inCommentLine = true;
            i++;
        } else if (char === '/' && nextChar === '*') {
            inCommentBlock = true;
            i++;
        } else if (char === "'" || char === '"' || char === '`') {
            inString = true;
            stringChar = char;
        } else if (char === '(') {
            bracketStack.push('PAREN');
        } else if (char === ')') {
            const idx = bracketStack.lastIndexOf('PAREN');
            if (idx !== -1) bracketStack.splice(idx, 1);
        } else if (char === '{') {
            bracketStack.push('BRACE');
        } else if (char === '}') {
            const idx = bracketStack.lastIndexOf('BRACE');
            if (idx !== -1) bracketStack.splice(idx, 1);
        } else if (char === '[') {
            bracketStack.push('BRACKET');
        } else if (char === ']') {
            const idx = bracketStack.lastIndexOf('BRACKET');
            if (idx !== -1) bracketStack.splice(idx, 1);
        }
    } else if (state === 'STRING') {
        if (char === '\\') {
            i++;
        } else if (char === stringChar) {
            inString = false;
        } else if (stringChar === '`' && char === '$' && nextChar === '{') {
            bracketStack.push('TEMPLATE_JS');
            i++;
        }
    } else if (state === 'TEMPLATE_JS') {
        if (char === '}') {
            const top = bracketStack[bracketStack.length - 1];
            if (top === 'TEMPLATE_JS') {
                bracketStack.pop();
            } else {
                const idx = bracketStack.lastIndexOf('BRACE');
                if (idx !== -1) bracketStack.splice(idx, 1);
            }
        } else if (char === '{') {
            bracketStack.push('BRACE');
        } else if (char === '(') {
            bracketStack.push('PAREN');
        } else if (char === ')') {
            const idx = bracketStack.lastIndexOf('PAREN');
            if (idx !== -1) bracketStack.splice(idx, 1);
        } else if (char === '[') {
            bracketStack.push('BRACKET');
        } else if (char === ']') {
            const idx = bracketStack.lastIndexOf('BRACKET');
            if (idx !== -1) bracketStack.splice(idx, 1);
        }
    }
}

console.log('Bracket stack at end of line 619:');
console.log(bracketStack);
console.log('inString:', inString, 'stringChar:', stringChar);
