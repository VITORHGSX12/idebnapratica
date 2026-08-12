const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');

// Find all words before .addEventListener
const regex = /(\w+)\.addEventListener/g;
const matches = [];
let match;
while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
}

const uniqueMatches = Array.from(new Set(matches)).sort();

console.log('--- EVENT LISTENERS TARGETS DECLARATION CHECK ---');
uniqueMatches.forEach(name => {
    if (name === 'document' || name === 'window') {
        console.log(`${name}: BUILTIN`);
        return;
    }
    const isDeclared = content.includes(`const ${name}`) || content.includes(`let ${name}`) || content.includes(`var ${name}`) || content.includes(`function ${name}`);
    console.log(`${name}: ${isDeclared ? 'DECLARED' : 'UNDECLARED'}`);
});
