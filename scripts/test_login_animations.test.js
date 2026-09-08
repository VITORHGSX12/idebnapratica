/**
 * ============================================================================
 * TESTE AUTOMATIZADO: MOTION DESIGN & ANIMAÇÕES DA TELA DE LOGIN
 * Arquivo: scripts/test_login_animations.test.js
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('--- [TEST] Iniciando Auditoria de Motion Design & Animações da Tela de Login ---');

// 1. Validar styles.css
const stylesCss = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');

assert.ok(stylesCss.includes('@keyframes loginCascadeEntrance'), 'styles.css deve conter @keyframes loginCascadeEntrance');
assert.ok(stylesCss.includes('@keyframes ambientMeshBreathe'), 'styles.css deve conter @keyframes ambientMeshBreathe');
assert.ok(stylesCss.includes('@keyframes buttonShimmer'), 'styles.css deve conter @keyframes buttonShimmer');
assert.ok(stylesCss.includes('.hero-ambient-mesh'), 'styles.css deve conter a classe .hero-ambient-mesh');
assert.ok(stylesCss.includes('.login-cascade-item'), 'styles.css deve conter a classe .login-cascade-item');
assert.ok(stylesCss.includes('.btn-dark-signin::after'), 'styles.css deve conter o efeito shimmer no botão .btn-dark-signin');
console.log('  ✓ Keyframes e tokens de animação validados com sucesso em styles.css!');

// 2. Validar index.html
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

assert.ok(indexHtml.includes('hero-ambient-mesh'), 'index.html deve conter a camada hero-ambient-mesh no painel azul');
assert.ok(indexHtml.includes('login-cascade-item login-cascade-delay-1'), 'index.html deve conter login-cascade-delay-1');
assert.ok(indexHtml.includes('login-cascade-item login-cascade-delay-2'), 'index.html deve conter login-cascade-delay-2');
assert.ok(indexHtml.includes('login-cascade-item login-cascade-delay-3'), 'index.html deve conter login-cascade-delay-3');
assert.ok(indexHtml.includes('login-cascade-item login-cascade-delay-4'), 'index.html deve conter login-cascade-delay-4');
assert.ok(indexHtml.includes('login-cascade-item login-cascade-delay-5'), 'index.html deve conter login-cascade-delay-5');
assert.ok(indexHtml.includes('login-cascade-item login-cascade-delay-6'), 'index.html deve conter login-cascade-delay-6');
assert.ok(indexHtml.includes('login-cascade-item login-cascade-delay-7'), 'index.html deve conter login-cascade-delay-7');
console.log('  ✓ Estrutura de entrada em cascata validada com sucesso em index.html!');

console.log('\n--- TODOS OS TESTES DE ANIMAÇÃO DA TELA DE LOGIN PASSARAM COM SUCESSO! ---');
