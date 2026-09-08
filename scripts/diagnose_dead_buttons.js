const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let match;
const buttons = [];

while ((match = buttonRegex.exec(html)) !== null) {
    const attrs = match[1];
    const rawContent = match[2].replace(/<[^>]*>?/gm, '').trim();
    const idMatch = attrs.match(/id="([^"]*)"/i);
    const classMatch = attrs.match(/class="([^"]*)"/i);
    const onclickMatch = attrs.match(/onclick="([^"]*)"/i);
    const dataTabMatch = attrs.match(/data-tab="([^"]*)"/i);
    const dataSubtabMatch = attrs.match(/data-subtab="([^"]*)"/i);
    const typeMatch = attrs.match(/type="([^"]*)"/i);

    const preText = html.substring(0, match.index);
    const lineNumber = preText.split('\n').length;

    // Encontrar qual modal ou seção envolve o botão
    const lastSectionMatches = [...preText.matchAll(/<(?:section|div)[^>]*id="([^"]+)"[^>]*class="[^"]*(?:tab-content|modal-overlay)[^"]*"/gi)];
    const lastSection = lastSectionMatches.length ? lastSectionMatches[lastSectionMatches.length - 1][1] : 'Geral';

    buttons.push({
        lineNumber,
        sectionId: lastSection,
        id: idMatch ? idMatch[1] : null,
        className: classMatch ? classMatch[1] : '',
        onclick: onclickMatch ? onclickMatch[1] : null,
        dataTab: dataTabMatch ? dataTabMatch[1] : null,
        dataSubtab: dataSubtabMatch ? dataSubtabMatch[1] : null,
        type: typeMatch ? typeMatch[1] : 'button',
        label: rawContent || '(Ícone/Sem Texto)'
    });
}

let allJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
function readDir(d) {
    fs.readdirSync(d).forEach(f => {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) readDir(full);
        else if (f.endsWith('.js')) allJs += '\n' + fs.readFileSync(full, 'utf8');
    });
}
readDir(path.join(__dirname, '../js'));

const deadButtons = buttons.filter(b => {
    if (b.onclick || b.dataTab || b.dataSubtab || b.type === 'submit') return false;
    if (b.id && new RegExp(`['"]${b.id}['"]`, 'i').test(allJs)) return false;
    return true;
});

console.log('Total de botões sem ação identificados:', deadButtons.length);
console.log('\n--- LISTA POR SEÇÃO / ABA / MODAL ---');

const grouped = {};
deadButtons.forEach(b => {
    if (!grouped[b.sectionId]) grouped[b.sectionId] = [];
    grouped[b.sectionId].push(b);
});

Object.keys(grouped).forEach(sec => {
    console.log(`\n📦 SEÇÃO / MODAL: [${sec}] (${grouped[sec].length} botões)`);
    grouped[sec].forEach(b => {
        console.log(`   - Linha ${b.lineNumber} | ID: ${b.id || '(sem id)'} | Texto: "${b.label}" | Class: "${b.className}"`);
    });
});
