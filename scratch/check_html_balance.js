const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

// Simple tag balancer for key layout tags: div, section, main, aside, header
const lines = content.split('\n');
let stack = [];
let tagsCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Find tags
    const regex = /<\/?(div|section|main|aside|header|nav)\b[^>]*>/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullTag = match[0];
        const isClosing = fullTag.startsWith('</');
        const tagName = match[1];
        
        if (!isClosing) {
            stack.push({ tag: tagName, line: i + 1, code: fullTag.trim() });
        } else {
            if (stack.length === 0) {
                console.log(`Error: Extra closing tag </${tagName}> at line ${i + 1}`);
            } else {
                const last = stack.pop();
                if (last.tag !== tagName) {
                    console.log(`Mismatch: Opened <${last.tag}> at line ${last.line} (${last.code}) but closed with </${tagName}> at line ${i + 1}`);
                    // Push back last to keep stack sanity
                    stack.push(last);
                }
            }
        }
    }
}

console.log('Finished balancing tags. Remaining open tags in stack:', stack.length);
stack.forEach(s => {
    console.log(`- Unclosed <${s.tag}> opened at line ${s.line}: ${s.code}`);
});
