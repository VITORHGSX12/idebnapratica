const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
const origQPath = path.join(__dirname, 'original_questions.js');

let appJs = fs.readFileSync(appJsPath, 'utf8');
let origQ = fs.readFileSync(origQPath, 'utf8');

// Parse out the array contents from "const DEMO_QUESTIONS = [ ... ];"
// We want to transform it into "let rawQuestions = [ ... ];"
let arrayCode = origQ.replace('const DEMO_QUESTIONS =', 'let rawQuestions =');

const targetStr = 'const DEMO_QUESTIONS = [];\n\n    let rawQuestions = [];';
if (appJs.includes(targetStr)) {
    appJs = appJs.replace(targetStr, arrayCode);
    fs.writeFileSync(appJsPath, appJs);
    console.log('SUCCESS: rawQuestions populated in app.js!');
} else {
    console.log('Error: Could not find target string in app.js');
}
