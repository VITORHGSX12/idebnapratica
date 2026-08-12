const fs = require('fs');
const vm = require('vm');

try {
    const code = fs.readFileSync('app.js', 'utf8');
    new vm.Script(code, { filename: 'app.js' });
} catch (e) {
    console.log('Error Properties:');
    console.log('Message:', e.message);
    console.log('Line:', e.lineNumber);
    console.log('Col:', e.columnNumber);
    console.log('Stack:', e.stack);
    
    // We can also extract the line number from the stack trace
    const match = e.stack.match(/app\.js:(\d+)/);
    if (match) {
        console.log('Extracted Line from Stack:', match[1]);
    }
}
