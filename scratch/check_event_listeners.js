const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');

lines.forEach((l, i) => {
    if (l.includes('.addEventListener')) {
        // Find if the variable name before .addEventListener is checked
        // Let's print the line and context
        console.log(`${i + 1}: ${l.trim()}`);
    }
});
