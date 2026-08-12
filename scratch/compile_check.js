const fs = require('fs');
const vm = require('vm');

try {
    const code = fs.readFileSync('app.js', 'utf8');
    new vm.Script(code);
    console.log('Success! No syntax errors.');
} catch (e) {
    console.error('Syntax Error details:');
    console.error(e.message);
    console.error(e.stack);
}
