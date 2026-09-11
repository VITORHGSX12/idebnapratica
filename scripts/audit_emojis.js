const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{200D}\u{FE0F}]/gu;

function scanDir(dir) {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        if (['node_modules', '.git', 'backups', '.gemini', 'dist'].includes(entry.name)) continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...scanDir(fullPath));
        } else if (/\.(html|js|css)$/.test(entry.name)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
                if (emojiRegex.test(line)) {
                    results.push({ 
                        file: path.relative(path.join(__dirname, '..'), fullPath).replace(/\\/g, '/'), 
                        line: idx + 1, 
                        content: line.trim() 
                    });
                }
            });
        }
    }
    return results;
}

const rootDir = path.join(__dirname, '..');
const hits = scanDir(rootDir);

const fileSummary = {};
hits.forEach(h => {
    fileSummary[h.file] = (fileSummary[h.file] || 0) + 1;
});

console.log('=== RELATÓRIO DE AUDITORIA DE EMOJIS ===');
console.log('Total de ocorrências:', hits.length);
console.log('\nOcorrências por arquivo:');
console.log(JSON.stringify(fileSummary, null, 2));

console.log('\nPrimeiras 40 ocorrências detalhadas:');
hits.slice(0, 40).forEach(h => {
    console.log(`[${h.file}:${h.line}] ${h.content.substring(0, 120)}`);
});
