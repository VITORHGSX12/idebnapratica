const fs = require('fs');
const logLine = fs.readFileSync('scratch/original_questions_block.txt', 'utf8');
const data = JSON.parse(logLine);
const content = data.content || '';

const lines = content.split('\n');
lines.forEach((l, i) => {
    if (l.includes('rawQuestions')) {
        console.log(`${i + 1}: ${l.trim()}`);
    }
});
