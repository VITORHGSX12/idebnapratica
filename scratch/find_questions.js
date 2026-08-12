const fs = require('fs');
const readline = require('readline');

async function findQuestions() {
    const fileStream = fs.createReadStream('../../brain/fb6df70c-c527-43bd-ac54-5686a4047477/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.includes('const DEMO_QUESTIONS = [') && line.includes('EF05LP01') && !line.includes('findQuestions')) {
            fs.writeFileSync('scratch/original_questions_block.txt', line);
            console.log('Found and saved to scratch/original_questions_block.txt');
            break;
        }
    }
}

findQuestions();
