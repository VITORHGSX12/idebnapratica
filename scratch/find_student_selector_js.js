const fs = require('fs');
const readline = require('readline');

async function findStudentSelectorJS() {
    const fileStream = fs.createReadStream('../../brain/fb6df70c-c527-43bd-ac54-5686a4047477/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.includes('studentSelector') && line.includes('document.getElementById') && line.includes('app.js')) {
            const data = JSON.parse(line);
            fs.writeFileSync('scratch/original_student_selector_js.txt', line);
            console.log(`Saved step ${data.step_index} to scratch/original_student_selector_js.txt`);
            break;
        }
    }
}

findStudentSelectorJS();
