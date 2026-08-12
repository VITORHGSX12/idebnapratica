const fs = require('fs');
const acorn = require('acorn');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');

const subCode = lines.slice(0, 616).join('\n');
const testCode = subCode + '}})';

try {
    acorn.parse(testCode, { ecmaVersion: 2020 });
    console.log('Success!');
} catch (e) {
    console.log(e.message);
    console.log('TestCode End:');
    console.log(testCode.slice(-100));
}
