const fs = require('fs');
const content = fs.readFileSync('../../brain/fb6df70c-c527-43bd-ac54-5686a4047477/.system_generated/logs/transcript.jsonl', 'utf8');
const lines = content.split('\n');
fs.writeFileSync('scratch/line_1969.json', lines[1968]);
console.log('Done!');
