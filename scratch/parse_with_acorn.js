const fs = require('fs');
const acorn = require('acorn');

try {
    const code = fs.readFileSync('app.js', 'utf8');
    acorn.parse(code, { ecmaVersion: 2020 });
    console.log('Success! No syntax errors.');
} catch (e) {
    console.error('Acorn Syntax Error:');
    console.error(e.message);
    if (e.loc) {
        console.error(`Line: ${e.loc.line}, Col: ${e.loc.column}`);
        // print the line of code
        const lines = fs.readFileSync('app.js', 'utf8').split('\n');
        console.error('Line content:', lines[e.loc.line - 1]);
    }
}
