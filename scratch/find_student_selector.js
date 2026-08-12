const fs = require('fs');
const readline = require('readline');

async function findStudentSelector() {
    const fileStream = fs.createReadStream('../../brain/fb6df70c-c527-43bd-ac54-5686a4047477/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const data = JSON.parse(line);
        if (data.step_index < 1600 && line.includes('student-selector') && line.includes('index.html')) {
            fs.writeFileSync('scratch/original_student_selector.txt', line);
            console.log(`Saved step ${data.step_index} to scratch/original_student_selector.txt`);
            break;
        }
    }
}

findStudentSelector();
