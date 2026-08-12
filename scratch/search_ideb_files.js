const fs = require('fs');
const path = require('path');

const searchPaths = [
    'C:\\Users\\Alleg\\OneDrive\\Área de Trabalho',
    'C:\\Users\\Alleg\\Desktop',
    'C:\\Users\\Alleg\\Downloads'
];

searchPaths.forEach(sp => {
    try {
        if (fs.existsSync(sp)) {
            console.log(`Scanning ${sp}...`);
            const files = fs.readdirSync(sp);
            files.forEach(f => {
                if (f.toLowerCase().includes('ideb')) {
                    console.log(`Found: ${path.join(sp, f)}`);
                }
            });
        }
    } catch (err) {
        console.log(`Error reading ${sp}: ${err.message}`);
    }
});
