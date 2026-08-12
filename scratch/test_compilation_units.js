const fs = require('fs');
const vm = require('vm');

const code = fs.readFileSync('app.js', 'utf8');

function testFunc(name, regex) {
    const match = code.match(regex);
    if (match) {
        try {
            new vm.Script(match[0]);
            console.log(`${name} compiles successfully!`);
        } catch (e) {
            console.error(`${name} failed to compile:`, e.message);
        }
    } else {
        console.log(`Could not extract ${name}`);
    }
}

testFunc('saveDatabaseState', /function saveDatabaseState\(\) \{[\s\S]*?\n    \}/);
testFunc('loadDatabaseState', /function loadDatabaseState\(\) \{[\s\S]*?\n    \}/);
testFunc('syncNormalizedTablesFromLoadedData', /function syncNormalizedTablesFromLoadedData\(\) \{[\s\S]*?\n    \}/);
