const fs = require('fs');
const logLine = fs.readFileSync('scratch/original_student_selector_js.txt', 'utf8');
const data = JSON.parse(logLine);

let str = '';
if (data.content) {
    str = data.content;
} else if (data.tool_calls) {
    data.tool_calls.forEach(tc => {
        if (tc.args && tc.args.CodeContent) {
            str += '\n' + tc.args.CodeContent;
        }
    });
}

const lines = str.split('\n');
lines.forEach((l, i) => {
    if (l.includes('studentSelector') || l.includes('student-selector')) {
        console.log(`${i + 1}: ${l.trim()}`);
    }
});
