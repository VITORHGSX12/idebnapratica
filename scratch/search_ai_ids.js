const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const ids = [
    'prompt-display-box',
    'prompt-tab-btns',
    'generate-btn',
    'generation-status',
    'diagnosis-output-box'
];

ids.forEach(id => {
    const exists = content.includes(`id="${id}"`) || content.includes(`id='${id}'`);
    console.log(`${id}: ${exists ? 'OK' : 'MISSING'}`);
});
