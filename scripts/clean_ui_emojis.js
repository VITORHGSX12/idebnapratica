const fs = require('fs');
const path = require('path');

// 1. UPDATE index.html
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Sidebar Vision current icon
indexHtml = indexHtml.replace(
    '<div class="vision-btn-icon" id="sidebar-vision-current-icon">👑</div>',
    '<div class="vision-btn-icon" id="sidebar-vision-current-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>'
);

// Títulos com emojis em index.html
indexHtml = indexHtml.replace(
    '📊 RESULTADOS GERAIS DE SIMULADOS',
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> RESULTADOS GERAIS DE SIMULADOS'
);

indexHtml = indexHtml.replace(
    '<div style="font-size: 2.2rem; margin-bottom: 8px;">📊</div>',
    '<div style="font-size: 2.2rem; margin-bottom: 8px;"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="color:var(--color-brand-primary, #6366f1);"><path d="M18 20V10M12 20V4M6 20v-6"/></svg></div>'
);

indexHtml = indexHtml.replace(
    '🏫 Ranking Geral de Escolas do Maranhão',
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:6px;"><path d="M3 21h18M5 21V7l8-4v18M13 3l6 3v15M9 9h1M9 13h1M9 17h1M17 9h1M17 13h1M17 17h1"/></svg> Ranking Geral de Escolas do Maranhão'
);

indexHtml = indexHtml.replace(
    '📍 Filtrar por Município:',
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Filtrar por Município:'
);

indexHtml = indexHtml.replace(
    '🎯 Termômetro de Conquista da Meta',
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:6px;"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Termômetro de Conquista da Meta'
);

indexHtml = indexHtml.replace(/2025 ★/g, '2025 (Oficial)');

// Opções de papéis de usuário no modal
indexHtml = indexHtml.replace('<span>👨‍🏫 Professor(a)</span>', '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Professor(a)</span>');
indexHtml = indexHtml.replace('<span>📋 Coordenador(a)</span>', '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> Coordenador(a)</span>');
indexHtml = indexHtml.replace('<span>🏫 Diretor(a) Escolar</span>', '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M3 21h18M5 21V7l8-4v18M13 3l6 3v15M9 9h1M9 13h1M9 17h1M17 9h1M17 13h1M17 17h1"/></svg> Diretor(a) Escolar</span>');
indexHtml = indexHtml.replace('<span>🏛️ Gestor SEMED</span>', '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M4 22h16M2 9h20M12 2l10 7H2l10-7zM6 13v6M10 13v6M14 13v6M18 13v6"/></svg> Gestor SEMED</span>');
indexHtml = indexHtml.replace('<span>⚙️ Master Admin</span>', '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Master Admin</span>');
indexHtml = indexHtml.replace('<span>🌟 Professor AEE</span>', '<span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Professor AEE</span>');

// Botões fechar e setas
indexHtml = indexHtml.replace(/➔/g, '&rarr;');
indexHtml = indexHtml.replace(/<button type="button" onclick="fecharModalExcluirEvento\(\)"([^>]*)>✕<\/button>/g, '<button type="button" onclick="fecharModalExcluirEvento()"$1 aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeDayExpandedDrawer\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeDayExpandedDrawer();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeDetailedProgressModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeDetailedProgressModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeDuplicateLessonModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeDuplicateLessonModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeScheduleTrashModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeScheduleTrashModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeModalTurma\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeModalTurma();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeModalTeacher\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeModalTeacher();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeModalManageClassStudents\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeModalManageClassStudents();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeStudentProgressModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeStudentProgressModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="TurmasPlanejamento\.closeCreatePlanModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="TurmasPlanejamento.closeCreatePlanModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeTurmaJournalModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeTurmaJournalModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeStudentProficiencyCalcModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeStudentProficiencyCalcModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace(/<button type="button" onclick="closeEditSchoolModal\(\);"[^>]*>✕<\/button>/g, '<button type="button" onclick="closeEditSchoolModal();" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted);" aria-label="Fechar">&times;</button>');
indexHtml = indexHtml.replace('✓ Habilidades Consolidadas (&ge; 75%)', '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block;vertical-align:middle;margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg> Habilidades Consolidadas (&ge; 75%)');

fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
console.log('✅ index.html atualizado.');

// 2. UPDATE js/core/user-profile.js
const userProfilePath = path.join(__dirname, '..', 'js', 'core', 'user-profile.js');
let userProfile = fs.readFileSync(userProfilePath, 'utf8');

userProfile = userProfile.replace(
    "icon: '👑',",
    'icon: \'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>\','
);
userProfile = userProfile.replace(
    "icon: '🏫',",
    'icon: \'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M13 3l6 3v15M9 9h1M9 13h1M9 17h1M17 9h1M17 13h1M17 17h1"/></svg>\','
);
userProfile = userProfile.replace(
    "icon: '👨‍🏫',",
    'icon: \'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>\','
);

userProfile = userProfile.replace(
    "if (iconEl) iconEl.textContent = currentVision.icon;",
    "if (iconEl) iconEl.innerHTML = currentVision.icon;"
);

userProfile = userProfile.replace(
    "(isActive ? '<span class=\"vision-item-check\" title=\"Visão em uso\">✓</span>' : '')",
    "(isActive ? '<span class=\"vision-item-check\" title=\"Visão em uso\"><svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\"><polyline points=\"20 6 9 17 4 12\"/></svg></span>' : '')"
);

userProfile = userProfile.replace(
    '<span>${greeting}, <span id="welcome-user-display-name">${cleanName}</span> 👋</span>',
    '<span>${greeting}, <span id="welcome-user-display-name">${cleanName}</span></span>'
);

fs.writeFileSync(userProfilePath, userProfile, 'utf8');
console.log('✅ js/core/user-profile.js atualizado.');

// 3. UPDATE js/modules/turmas/turmas_crud.js
const turmasCrudPath = path.join(__dirname, '..', 'js', 'modules', 'turmas', 'turmas_crud.js');
let turmasCrud = fs.readFileSync(turmasCrudPath, 'utf8');
turmasCrud = turmasCrud.replace(/➔/g, '•');
fs.writeFileSync(turmasCrudPath, turmasCrud, 'utf8');
console.log('✅ js/modules/turmas/turmas_crud.js atualizado.');

console.log('🎉 Todas as substituições de emojis de UI foram concluídas!');
