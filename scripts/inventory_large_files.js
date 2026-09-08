const fs = require('fs');
const path = require('path');

function scan(dir) {
    let list = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            if (e.name.startsWith('.') || ['node_modules', 'relatorios_saeb', 'assets', 'scratch'].includes(e.name)) continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory()) {
                list = list.concat(scan(full));
            } else if (/\.(js|html|css)$/.test(e.name)) {
                try {
                    const content = fs.readFileSync(full, 'utf8');
                    const lines = content.split(/\r?\n/).length;
                    if (lines > 700) {
                        list.push({ path: path.relative(process.cwd(), full).replace(/\\/g, '/'), lines });
                    }
                } catch(err) {}
            }
        }
    } catch(err) {}
    return list;
}

const res = scan('.');
res.sort((a,b) => b.lines - a.lines);
console.log('=== TOTAL ENCONTRADO: ' + res.length + ' ARQUIVOS > 700 LINHAS ===');
res.forEach((r, idx) => console.log(`${idx + 1}. [${r.lines} linhas] ${r.path}`));
