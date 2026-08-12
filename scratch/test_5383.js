const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');

const sub = lines.slice(0, 5383).join('\n');
console.log('Last lines:');
console.log(lines.slice(5380, 5383).join('\n'));

try {
    new vm.Script(sub, { filename: 'app.js' });
    console.log('Success!');
} catch (e) {
    console.log('Error message:', e.message);
    console.log('Error stack:', e.stack);
}
