const fs = require('fs');
const readline = require('readline');

async function findFullQuestions() {
    const fileStream = fs.createReadStream('../../brain/fb6df70c-c527-43bd-ac54-5686a4047477/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let bestLine = '';
    let maxLength = 0;

    for await (const line of rl) {
        if (line.includes('const DEMO_QUESTIONS = [') && line.includes('EF05LP01') && !line.includes('findFullQuestions')) {
            if (line.length > maxLength) {
                maxLength = line.length;
                bestLine = line;
            }
        }
    }

    if (bestLine) {
        fs.writeFileSync('scratch/original_questions_block.txt', bestLine);
        console.log(`Found line with length ${maxLength} and saved to scratch/original_questions_block.txt`);
    } else {
        console.log('No line found.');
    }
}

findFullQuestions();
