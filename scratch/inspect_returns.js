const fs = require('fs');
const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');

let functionDepth = 0;
lines.forEach((l, i) => {
    // simple estimate of function depth by brace counting
    const openBraces = (l.match(/{/g) || []).length;
    const closeBraces = (l.match(/}/g) || []).length;
    
    if (l.includes('function ') || l.includes('=>')) {
        // start of function
    }
    
    if (l.includes('return') && !l.includes('return ')) {
        // console.log(`Line ${i+1}: ${l.trim()}`);
    }
});
