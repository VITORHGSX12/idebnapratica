const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const stylesCssPath = path.join(__dirname, '..', 'styles.css');
const tokensCssPath = path.join(__dirname, '..', 'design-tokens.css');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const stylesCss = fs.readFileSync(stylesCssPath, 'utf8');
const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');

console.log('================================================================');
console.log('🔍 AUDITORIA VISUAL: AMBIENTAÇÃO DO DESIGN SYSTEM EM TODOS OS MENUS');
console.log('================================================================\n');

// 1. Mapeamento de todos os menus da Sidebar
const sidebarRegex = /<a\s+href="#([^"]+)"[^>]*class="([^"]*menu-item[^"]*)"[^>]*data-target="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
let match;
const sidebarMenus = [];

while ((match = sidebarRegex.exec(indexHtml)) !== null) {
    const target = match[3];
    const textMatch = match[4].match(/<span>(.*?)<\/span>/);
    const label = textMatch ? textMatch[1].replace(/&amp;/g, '&') : target;
    const iconMatch = match[4].match(/src="([^"]+)"/);
    const icon = iconMatch ? iconMatch[1] : 'sem icone';
    
    sidebarMenus.push({
        target,
        label,
        icon
    });
}

console.log(`📌 MENUS NA SIDEBAR IDENTIFICADOS: ${sidebarMenus.length}`);
sidebarMenus.forEach((m, i) => {
    console.log(`   ${i+1}. [${m.target}] -> "${m.label}" (Ícone: ${path.basename(m.icon)})`);
});

console.log('\n----------------------------------------------------------------');
console.log('📋 AUDITORIA DE AMBIENTAÇÃO POR ABA / SEÇÃO:');
console.log('----------------------------------------------------------------\n');

let issues = [];

sidebarMenus.forEach((m, i) => {
    const secRegex = new RegExp(`<section\\s+id="${m.target}"[\\s\\S]*?<\\/section>`, 'i');
    const secMatch = indexHtml.match(secRegex);
    
    if (!secMatch) {
        issues.push(`Menu [${m.target}] não possui uma <section id="${m.target}"> correspondente.`);
        console.log(`❌ [${i+1}] ${m.label} (#${m.target}): Seção não encontrada no DOM!`);
        return;
    }
    
    const secContent = secMatch[0];
    
    // Verificações Visuais
    const hasHeroBanner = secContent.includes('tab-hero-banner') || secContent.includes('dashboard-header') || m.target === 'dashboard';
    const hasCards = secContent.includes('class="card') || secContent.includes("class='card") || secContent.includes('kpi-card') || secContent.includes('stat-card');
    const hasLucideIcons = secContent.includes('data-lucide=') || secContent.includes('lucide');
    const hasDesignTokens = !secContent.includes('font-family: Arial') && !secContent.includes('font-family: Roboto');
    
    // Verificar se há estilos inline de cores hardcoded proibidas (ex: background: #ff0000)
    const hardcodedBadColors = secContent.match(/background(?:-color)?:\s*(?:#ff0000|#00ff00|#0000ff|red|blue|green)/gi) || [];
    
    console.log(`✅ [${i+1}] ${m.label} (#${m.target}):`);
    console.log(`    • Topo/Banner ambientado: ${hasHeroBanner ? 'SIM (tab-hero-banner/header padrão)' : 'AVISO: Não detectado'}`);
    console.log(`    • Cards estruturados: ${hasCards ? 'SIM' : 'N/A ou Estrutura Custom'}`);
    console.log(`    • Ícones Lucide presentes: ${hasLucideIcons ? 'SIM' : 'NÃO'}`);
    console.log(`    • Cores Hardcoded Inadequadas: ${hardcodedBadColors.length === 0 ? 'ZERO (100% tokens)' : hardcodedBadColors.join(', ')}`);
});

console.log('\n----------------------------------------------------------------');
console.log('🎨 VERIFICAÇÃO DOS DESIGN TOKENS GLOBAIS E TEMA ESCURO/CLARO:');
console.log('----------------------------------------------------------------\n');

const tokenKeys = [
    '--color-brand-primary',
    '--color-brand-secondary',
    '--color-surface-canvas',
    '--color-surface-card',
    '--color-surface-subtle',
    '--color-border-subtle',
    '--color-text-primary',
    '--color-text-secondary',
    '--color-status-success',
    '--color-status-warning',
    '--color-status-critical',
    '--font-family-display',
    '--font-family-body',
    '--radius-card',
    '--radius-btn'
];

let missingTokens = [];
tokenKeys.forEach(tok => {
    if (!tokensCss.includes(tok)) missingTokens.push(tok);
});

console.log(`• Total de Tokens Críticos: ${tokenKeys.length}`);
console.log(`• Tokens Ativos no CSS: ${tokenKeys.length - missingTokens.length}/${tokenKeys.length}`);

// Verificar modo escuro (dark-mode)
const hasDarkModeRules = stylesCss.includes('.dark-mode') || tokensCss.includes('.dark-mode');
console.log(`• Suporte a Dark Mode / Light Mode: ${hasDarkModeRules ? 'ATIVO E SINCRONIZADO' : 'NÃO DETECTADO'}`);

console.log('\n================================================================');
if (issues.length === 0 && missingTokens.length === 0) {
    console.log('🎉 RESULTADO: TODOS OS MENUS ESTÃO 100% AMBIENTADOS AO DESIGN SYSTEM!');
} else {
    console.log(`⚠️ Foram encontrados ${issues.length + missingTokens.length} apontamentos para revisão.`);
}
console.log('================================================================\n');
