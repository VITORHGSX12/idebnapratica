const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '..', 'app.js');
const htmlPath = path.join(__dirname, '..', 'index.html');

const jsCode = fs.readFileSync(jsPath, 'utf8');
const htmlCode = fs.readFileSync(htmlPath, 'utf8');

const idRegex = /document\.getElementById\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const queryRegex = /document\.querySelector\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

const idsFound = [];
const queriesFound = [];

let match;
while ((match = idRegex.exec(jsCode)) !== null) {
    idsFound.push(match[1]);
}
while ((match = queryRegex.exec(jsCode)) !== null) {
    queriesFound.push(match[1]);
}

const uniqueIds = Array.from(new Set(idsFound)).sort();
const uniqueQueries = Array.from(new Set(queriesFound)).sort();

console.log('--- GET_ELEMENT_BY_ID AUDIT ---');
uniqueIds.forEach(id => {
    const exists = htmlCode.includes(`id="${id}"`) || htmlCode.includes(`id='${id}'`) || htmlCode.includes(`id=${id}`);
    console.log(`${id}: ${exists ? 'OK' : 'MISSING'}`);
});

console.log('\n--- QUERY_SELECTOR AUDIT ---');
uniqueQueries.forEach(q => {
    let exists = false;
    if (q.startsWith('#')) {
        const id = q.slice(1);
        exists = htmlCode.includes(`id="${id}"`) || htmlCode.includes(`id='${id}'`) || htmlCode.includes(`id=${id}`);
    } else if (q.startsWith('.')) {
        const cls = q.slice(1);
        exists = htmlCode.includes(`class="${cls}"`) || htmlCode.includes(`class='${cls}'`) || htmlCode.includes(cls);
    } else {
        exists = htmlCode.includes(q);
    }
    console.log(`${q}: ${exists ? 'OK' : 'CHECK'}`);
});
