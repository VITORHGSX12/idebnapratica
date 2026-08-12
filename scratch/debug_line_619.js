const fs = require('fs');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
const line619 = lines[618]; // 0-indexed

let bracketStack = [];
let inString = false;
let stringChar = '';
let inCommentLine = false;
let inCommentBlock = false;

// Run parser on lines 1 to 618 first
let prefix = lines.slice(0, 618).join('\n') + '\n';
for (let i = 0; i < prefix.length; i++) {
    const char = prefix[i];
    const nextChar = prefix[i + 1] || '';
    
    if (inCommentLine) {
        if (char === '\n') inCommentLine = false;
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

console.log('Prefix parsed. Initial stack:', bracketStack);
console.log('Initial inString:', inString);

// Parse line 619 character by character and print details
for (let col = 0; col < line619.length; col++) {
    const char = line619[col];
    const nextChar = line619[col + 1] || '';
    
    // We run the parser logic
    const state = bracketStack.length > 0 && bracketStack[bracketStack.length - 1] === 'TEMPLATE_JS' ? 'TEMPLATE_JS' : 
                  inString ? 'STRING' : 'NORMAL';

    if (state === 'NORMAL') {
        if (char === '/' && nextChar === '/') {
            inCommentLine = true;
            col++;
        } else if (char === '/' && nextChar === '*') {
            inCommentBlock = true;
            col++;
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
        }
    } else if (state === 'STRING') {
        if (char === '\\') {
            col++;
        } else if (char === stringChar) {
            inString = false;
        } else if (stringChar === '`' && char === '$' && nextChar === '{') {
            bracketStack.push('TEMPLATE_JS');
            col++;
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
        }
    }
    
    console.log(`Col ${col} [${char}]: state=${state}, inString=${inString}, stack=`, bracketStack);
}
