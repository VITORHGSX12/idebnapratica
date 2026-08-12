const acorn = require('acorn');
try {
    acorn.parse("document.addEventListener('DOMContentLoaded', () => {", { ecmaVersion: 2020 });
} catch (e) {
    console.log(e.message);
}
