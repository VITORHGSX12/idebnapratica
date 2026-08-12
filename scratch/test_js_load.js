const fs = require('fs');
const path = require('path');

// Mock DOM environment
const domMock = {
    addEventListener: () => {},
    classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
        toggle: () => {}
    },
    style: {},
    querySelector: () => domMock,
    querySelectorAll: () => [domMock],
    getElementById: (id) => {
        // console.log('Mocked getElementById:', id);
        return domMock;
    },
    createElement: () => domMock,
    appendChild: () => {},
    removeAttribute: () => {},
    options: [{ text: 'All' }],
    selectedIndex: 0,
    reset: () => {},
    cloneNode: () => domMock,
    getContext: () => ({
        getContext: () => ({}),
        measureText: () => ({ width: 0 }),
        fillText: () => {}
    })
};

global.document = domMock;
global.window = {
    addEventListener: () => {},
    lucide: { createIcons: () => {} },
    mermaid: { initialize: () => {}, init: () => {} },
    alunosDatabase: []
};
global.mermaid = global.window.mermaid;
global.lucide = global.window.lucide;
global.navigator = { userAgent: 'mock' };

try {
    const filePath = path.join(__dirname, '..', 'app.js');
    const jsContent = fs.readFileSync(filePath, 'utf8');
    
    // Evaluate the code
    eval(jsContent);
    console.log('SUCCESS: JS loaded and executed without errors!');
} catch (e) {
    console.error('ERROR during execution:', e);
}
