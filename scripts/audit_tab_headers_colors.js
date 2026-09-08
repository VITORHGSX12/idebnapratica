const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Regex para capturar todas as sections com id
const sectionRegex = /<section\s+id="([^"]+)"\s+class="([^"]*tab-content[^"]*)"[^>]*>([\s\S]*?)<\/section>/g;

let match;
const sections = [];

while ((match = sectionRegex.exec(indexHtml)) !== null) {
    const id = match[1];
    const content = match[3];
    
    // Pegar os primeiros 1200 caracteres do conteúdo da seção para inspecionar o topo/banner
    const topSnippet = content.trim().slice(0, 1500);
    
    // Identificar elementos de header/banner no topo
    const hasWelcomeBanner = topSnippet.includes('dashboard-welcome-banner') || topSnippet.includes('welcome-banner');
    const hasHeaderFlex = topSnippet.includes('page-header') || topSnippet.includes('tab-header') || topSnippet.includes('flex-between');
    const bgMatches = topSnippet.match(/background(?:-color)?:\s*([^;"'>]+)/gi) || [];
    const classMatches = topSnippet.match(/class="([^"]+)"/gi) || [];
    
    // Extrair o primeiro elemento filho (título ou banner)
    const firstTagMatch = topSnippet.match(/<div[^>]*class="([^"]+)"[^>]*>/i);
    const firstTagClass = firstTagMatch ? firstTagMatch[1] : 'sem div';
    
    sections.push({
        id,
        firstTagClass,
        bgMatches: bgMatches.slice(0, 5),
        classes: classMatches.slice(0, 6),
        snippetPreview: topSnippet.slice(0, 300).replace(/\s+/g, ' ')
    });
}

console.log('--- AUDITORIA DOS TOPOS DE PÁGINA (MENUS & ABAS) ---');
console.log(`Total de seções encontradas: ${sections.length}\n`);

sections.forEach((sec, idx) => {
    console.log(`[${idx + 1}] Aba: #${sec.id}`);
    console.log(`    Primeira Classe do Topo: ${sec.firstTagClass}`);
    console.log(`    Cores/Backgrounds encontrados: ${sec.bgMatches.join(' | ') || 'Nenhum inline (usa CSS padrão)'}`);
    console.log(`    Preview do topo: ${sec.snippetPreview.slice(0, 160)}...`);
    console.log('----------------------------------------------------');
});
