const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');

function check(limit) {
    const subCode = lines.slice(0, limit).join('\n');
    try {
        acorn.parse(subCode, { ecmaVersion: 2020 });
        return true; // compiles completely (no syntax errors, not even incomplete)
    } catch (e) {
        if (e.message.includes('Unexpected end of input') || e.message.includes('Unterminated')) {
            return 'INCOMPLETE';
        }
        return e.message + ` at Line ${e.loc.line}, Col ${e.loc.column}`;
    }
}

let low = 1;
let high = lines.length;
let firstErrorLine = -1;
let firstErrorMessage = '';

while (low <= high) {
    let mid = Math.floor((low + high) / 2);
    let res = check(mid);
    if (res === true || res === 'INCOMPLETE') {
        low = mid + 1;
    } else {
        firstErrorLine = mid;
        firstErrorMessage = res;
        high = mid - 1;
    }
}

console.log(`Binary search found first syntax error at or before line: ${firstErrorLine}`);
console.log(`Error message: ${firstErrorMessage}`);
if (firstErrorLine !== -1) {
    console.log('Context:');
    for (let i = Math.max(1, firstErrorLine - 5); i <= Math.min(lines.length, firstErrorLine + 5); i++) {
        console.log(`${i === firstErrorLine ? '=>' : '  '} Line ${i}: ${lines[i - 1]}`);
    }
}
