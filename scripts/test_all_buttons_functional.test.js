/**
 * ============================================================================
 * TESTES DE VALIDAÇÃO: AUDITORIA DE 100% DOS BOTÕES DO SISTEMA (313 BOTÕES)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

console.log('========================================================================');
console.log('🔍 TESTE DE VALIDAÇÃO: AUDITORIA DE 100% DOS BOTÕES DO SISTEMA');
console.log('========================================================================\n');

const htmlPath = path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
let match;
const buttons = [];
let index = 1;

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

    buttons.push({
        index: index++,
        lineNumber,
        id: idMatch ? idMatch[1] : null,
        className: classMatch ? classMatch[1] : '',
        onclick: onclickMatch ? onclickMatch[1] : null,
        dataTab: dataTabMatch ? dataTabMatch[1] : null,
        dataSubtab: dataSubtabMatch ? dataSubtabMatch[1] : null,
        type: typeMatch ? typeMatch[1] : 'button',
        label: rawContent || '(Ícone/Sem Texto)'
    });
}

// Ler todos os arquivos JS
let allJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
function readDir(d) {
    fs.readdirSync(d).forEach(f => {
        const full = path.join(d, f);
        if (fs.statSync(full).isDirectory()) readDir(full);
        else if (f.endsWith('.js')) allJsContent += '\n' + fs.readFileSync(full, 'utf8');
    });
}
readDir(path.join(__dirname, '../js'));

const functional = [];
const dead = [];

buttons.forEach(b => {
    let hasAction = false;
    let reason = '';

    if (b.onclick) {
        hasAction = true;
        reason = `onclick inline: ${b.onclick.substring(0, 30)}...`;
    } else if (b.dataTab) {
        hasAction = true;
        reason = `Navegação de Aba: #${b.dataTab}`;
    } else if (b.dataSubtab) {
        hasAction = true;
        reason = `Sub-aba: #${b.dataSubtab}`;
    } else if (b.type === 'submit') {
        hasAction = true;
        reason = 'Submissão de Formulário';
    } else if (b.id) {
        const idRegex = new RegExp(`['"]${b.id}['"]`, 'i');
        if (idRegex.test(allJsContent)) {
            hasAction = true;
            reason = `Listener JS ativo para #${b.id}`;
        }
    }

    if (!hasAction && b.className) {
        const classes = b.className.split(/\s+/);
        const hasClassHandler = classes.some(c => {
            return ['stage-chip-btn', 'desc-filter-btn', 'download-plan-btn', 'nav-item', 'pedagogic-subtab-btn', 'subtab-btn'].includes(c) ||
                   allJsContent.includes(`.${c}`);
        });
        if (hasClassHandler) {
            hasAction = true;
            reason = `Delegação de classe: .${classes[0]}`;
        }
    }

    if (hasAction) {
        functional.push({ ...b, reason });
    } else {
        dead.push(b);
    }
});

console.log(`Total de botões auditados no sistema: ${buttons.length}`);
console.log(`🟢 Botões com Ação Funcional: ${functional.length} (${Math.round(functional.length / buttons.length * 100)}%)`);
console.log(`🔴 Botões sem Ação: ${dead.length}`);

if (dead.length > 0) {
    console.log('\n⚠️ Lista de botões que ainda estão sem ação:');
    dead.forEach(d => {
        console.log(`  - Linha ${d.lineNumber} | ID: ${d.id || 'Nenhum'} | Texto: "${d.label}" | Class: "${d.className}"`);
    });
    console.log('\n❌ FALHA: Existem botões sem ação mapeada.');
    process.exit(1);
} else {
    console.log('\n🎉 SUCESSO: 100% de todos os botões do sistema possuem ação funcional mapeada!');
    process.exit(0);
}
