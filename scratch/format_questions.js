const fs = require('fs');
const logLine = fs.readFileSync('scratch/original_questions_block.txt', 'utf8');
const data = JSON.parse(logLine);

let str = '';
if (data.content) {
    str = data.content;
} else if (data.tool_calls) {
    data.tool_calls.forEach(tc => {
        if (tc.args && tc.args.TargetContent) {
            str += '\n' + tc.args.TargetContent;
        }
        if (tc.args && tc.args.ReplacementContent) {
            str += '\n' + tc.args.ReplacementContent;
        }
    });
}

if (str) {
    const idx = str.indexOf('const DEMO_QUESTIONS = [');
    if (idx !== -1) {
        const endIdx = str.indexOf('];', idx);
        if (endIdx !== -1) {
            fs.writeFileSync('scratch/original_questions.js', str.slice(idx, endIdx + 2));
            console.log('Saved to scratch/original_questions.js');
        } else {
            console.log('Could not find ];, saving 15000 chars');
            fs.writeFileSync('scratch/original_questions.js', str.slice(idx, idx + 15000));
        }
    } else {
        console.log('Could not find const DEMO_QUESTIONS in str:', str.slice(0, 1000));
    }
} else {
    console.log('No string content found in log line.');
}
