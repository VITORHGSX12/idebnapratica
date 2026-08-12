const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('app.js', 'utf8');
const lines = code.split('\n');
const sub = lines.slice(0, 5382).join('\n');

function trySuffix(suffix) {
    try {
        new vm.Script(sub + '\n' + suffix);
        console.log(`Suffix '${suffix}' compiles successfully!`);
    } catch (e) {
        console.log(`Suffix '${suffix}' failed:`, e.message);
    }
}

trySuffix('}');
trySuffix(')');
trySuffix('})');
trySuffix('}');
trySuffix('}}');
trySuffix('}})');
trySuffix('}}})');
trySuffix('}}}}');
