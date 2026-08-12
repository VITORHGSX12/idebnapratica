const fs = require('fs');
const readline = require('readline');

async function findRawQuestions() {
    const fileStream = fs.createReadStream('../../brain/fb6df70c-c527-43bd-ac54-5686a4047477/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        const data = JSON.parse(line);
        if (data.step_index >= 1600 && data.step_index <= 1665) {
            if (line.includes('rawQuestions') && (line.includes('VIEW_FILE') || line.includes('TargetContent') || line.includes('ReplacementContent'))) {
                fs.writeFileSync('scratch/original_raw_questions_step.txt', line);
                console.log(`Saved step ${data.step_index} to scratch/original_raw_questions_step.txt`);
                break;
            }
        }
    }
}

findRawQuestions();
