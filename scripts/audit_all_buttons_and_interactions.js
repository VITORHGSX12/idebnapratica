const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let match;
const buttons = [];
let index = 1;

while ((match = buttonRegex.exec(html)) !== null) {
    const attrs = match[1];
    const content = match[2].replace(/<[^>]*>?/gm, '').trim();
    
    const idMatch = attrs.match(/id="([^"]*)"/i);
    const classMatch = attrs.match(/class="([^"]*)"/i);
    const onclickMatch = attrs.match(/onclick="([^"]*)"/i);
    const dataTabMatch = attrs.match(/data-tab="([^"]*)"/i);
    const dataSubtabMatch = attrs.match(/data-subtab="([^"]*)"/i);
    const dataActionMatch = attrs.match(/data-action="([^"]*)"/i);
    const typeMatch = attrs.match(/type="([^"]*)"/i);

    // Encontrar número da linha
    const preText = html.substring(0, match.index);
    const lineNumber = preText.split('\n').length;

    buttons.push({
        index: index++,
        lineNumber,
        id: idMatch ? idMatch[1] : null,
        className: classMatch ? classMatch[1] : '',
        onclick: onclickMatch ? onclickMatch[1] : null,
        dataTab: dataTabMatch ? dataTabMatch[1] : null,
        dataSubtab: dataSubtabMatch ? dataSubtabMatch[1] : null,
        dataAction: dataActionMatch ? dataActionMatch[1] : null,
        type: typeMatch ? typeMatch[1] : 'button',
        label: content || '(Ícone/Sem Texto)'
    });
}

const jsDir = path.join(__dirname, '../js');
let allJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

function readDirRecursive(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            readDirRecursive(full);
        } else if (f.endsWith('.js')) {
            allJsContent += '\n' + fs.readFileSync(full, 'utf8');
        }
    });
}
readDirRecursive(jsDir);

const quebrado = [];

buttons.forEach(b => {
    let hasAction = false;
    if (b.onclick || b.dataTab || b.dataSubtab || b.type === 'submit') {
        hasAction = true;
    } else if (b.id) {
        const idRegex = new RegExp(`['"]${b.id}['"]`, 'i');
        if (idRegex.test(allJsContent)) hasAction = true;
    }

    if (!hasAction) {
        quebrado.push(b);
    }
});

console.log(`TOTAL DE BOTÕES PENDENTES DE AÇÃO: ${quebrado.length}\n`);
quebrado.forEach(b => {
    console.log(`Linha ${b.lineNumber} | Botão #${b.index}: ID="${b.id || 'SEM_ID'}" | Label="${b.label}" | Class="${b.className}"`);
});
