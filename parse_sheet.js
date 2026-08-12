const fs = require('fs');

const filePath = 'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho\\alunosdegd_arquivos\\sheet001.htm';

try {
    console.log('Reading file...');
    const content = fs.readFileSync(filePath, 'utf8');
    console.log('File loaded. Size:', content.length, 'characters.');

    // Look for <tr ...> ... </tr>
    // Let's use a regex to find tr elements. Since the file is large, we can parse it line-by-line or cell-by-cell
    // Excel HTML usually formats each row on a few lines or a single line. Let's do a fast RegExp matching or a custom parse.
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;
    let rowCount = 0;
    const rows = [];

    // Let's extract first 20 rows first to see what's in there
    while ((match = trRegex.exec(content)) !== null && rowCount < 50) {
        const trContent = match[1];
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let tdMatch;
        const cells = [];
        while ((tdMatch = tdRegex.exec(trContent)) !== null) {
            // Strip HTML tags from cell content
            let cellText = tdMatch[1]
                .replace(/<[^>]+>/g, '')
                .replace(/&nbsp;/gi, ' ')
                .replace(/\r?\n|\r/g, ' ')
                .trim();
            cells.push(cellText);
        }
        if (cells.length > 0) {
            rows.push(cells);
            rowCount++;
        }
    }

    console.log(`Parsed first ${rows.length} rows:`);
    rows.forEach((r, idx) => {
        console.log(`Row ${idx}:`, r);
    });

} catch (err) {
    console.error('Error reading/parsing sheet001.htm:', err);
}
