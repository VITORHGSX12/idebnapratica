/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (VIEWS ROUTER & ORCHESTRATOR)
 * Arquivo: js/modules/cronograma/cronograma_views.js
 * Descrição: Orquestrador de visualizações, controle de contexto de turma,
 *            filtros de status por chips e termômetro de cobertura BNCC.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    let currentTurmaContext = 'UI JOSE CORREA LIMA — 2º Ano A';
    let currentScheduleMainView = 'monthly'; // 'monthly' | 'weekly' | 'comparison'
    let currentScheduleStatusFilter = 'all'; // 'all' | 'atrasada' | 'trabalhada' | 'planejada'

    const MASTER_TURMAS_LIST = [
        'UI JOSE CORREA LIMA — 2º Ano A',
        'UI JOSE CORREA LIMA — 2º Ano B',
        'UI JOSE CORREA LIMA — 5º Ano A',
        'UI JOSE CORREA LIMA — 9º Ano A',
        'UNIDADE INTEGRADA JOSE GONCALVES DIAS — 5º Ano A',
        'UNIDADE INTEGRADA JOSE GONCALVES DIAS — 9º Ano A',
        'U I BASILIO ALVES — 5º Ano A',
        'UE ANITA FURTADO — 2º Ano A',
        'UI EMILIO MURAD — 5º Ano A'
    ];

    function getDynamicTurmasList() {
        var list = MASTER_TURMAS_LIST.slice();
        try {
            var raw = localStorage.getItem('school_network_turmas_db') || localStorage.getItem('gd_custom_turmas');
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    parsed.forEach(function(c) {
                        var label = (c.escola || c.schoolName || '') + ' — ' + (c.nome || c.name || '');
                        if (label.length > 5 && !list.includes(label)) list.push(label);
                    });
                }
            }
        } catch(e) {}
        return list;
    }

    function initScheduleTurmaContext() {
        const select = document.getElementById('cal-filter-turma-context');
        if (!select) return;

        const userRole = (sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'Master Admin').toLowerCase();
        const userEscola = (sessionStorage.getItem('userEscola') || localStorage.getItem('userEscola') || '').trim();
        const userTurma = (sessionStorage.getItem('userTurma') || localStorage.getItem('userTurma') || '').trim();
        const isTeacher = userRole.includes('professor');
        const isDirector = userRole.includes('diretor');

        const allTurmas = getDynamicTurmasList();

        if (isTeacher && userEscola && userTurma && userTurma !== 'Todas as Turmas') {
            const contextStr = `${userEscola} — ${userTurma}`;
            select.innerHTML = `<option value="${contextStr}" selected>${contextStr}</option>`;
            select.disabled = true;
            currentTurmaContext = contextStr;
        } else if (isDirector && userEscola) {
            select.disabled = false;
            const filtered = allTurmas.filter(t => t.toLowerCase().includes(userEscola.toLowerCase()));
            const listToUse = filtered.length > 0 ? filtered : allTurmas;
            select.innerHTML = listToUse.map(t => `<option value="${t}">${t}</option>`).join('');
            if (!listToUse.includes(currentTurmaContext)) {
                currentTurmaContext = listToUse[0];
            }
            select.value = currentTurmaContext;
        } else {
            // Admin / Coordenador Geral / SEMED: Visão de todas as escolas e turmas da rede
            select.disabled = false;
            select.innerHTML = allTurmas.map(t => `<option value="${t}">${t}</option>`).join('');
            if (!allTurmas.includes(currentTurmaContext)) {
                currentTurmaContext = allTurmas[0];
            }
            select.value = currentTurmaContext;
        }

        handleTurmaContextChange();
    }

    function handleTurmaContextChange() {
        const select = document.getElementById('cal-filter-turma-context');
        if (select) {
            currentTurmaContext = select.value;
        }

        const contextLabel = document.getElementById('schedule-active-context-label');
        if (contextLabel) contextLabel.textContent = currentTurmaContext;

        const teacherLabel = document.getElementById('schedule-active-teacher-label');
        if (teacherLabel) {
            if (currentTurmaContext.includes('2º Ano A')) {
                teacherLabel.textContent = '• Responsável: Profa. Silvana Ferreira (Regente)';
            } else if (currentTurmaContext.includes('2º Ano B')) {
                teacherLabel.textContent = '• Responsável: Prof. Marcos Andrade (Regente)';
            } else {
                teacherLabel.textContent = '• Responsável: Coordenação Pedagógica / Regente';
            }
        }

        renderCurricularCoverageBar(currentTurmaContext);
        renderActiveScheduleView();
    }

    function setScheduleStatusFilter(status) {
        currentScheduleStatusFilter = status || 'all';

        const chipAll = document.getElementById('chip-status-all');
        const chipAtrasada = document.getElementById('chip-status-atrasada');
        const chipTrabalhada = document.getElementById('chip-status-trabalhada');
        const chipPlanejada = document.getElementById('chip-status-planejada');

        [chipAll, chipAtrasada, chipTrabalhada, chipPlanejada].forEach(chip => {
            if (!chip) return;
            chip.classList.remove('btn-primary');
            chip.classList.add('btn-outline');
        });

        const activeMap = {
            'all': chipAll,
            'atrasada': chipAtrasada,
            'trabalhada': chipTrabalhada,
            'planejada': chipPlanejada
        };

        if (activeMap[currentScheduleStatusFilter]) {
            activeMap[currentScheduleStatusFilter].classList.remove('btn-outline');
            activeMap[currentScheduleStatusFilter].classList.add('btn-primary');
        }

        renderActiveScheduleView();
    }

    function getScheduleStatusFilter() {
        return currentScheduleStatusFilter;
    }

    function renderCurricularCoverageBar(turmaContext) {
        const barEl = document.getElementById('schedule-coverage-progress-bar');
        const pctEl = document.getElementById('schedule-coverage-pct-label');
        if (!barEl && !pctEl) return;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const turmaLessons = allLessons.filter(l => l.turmaContext === (turmaContext || currentTurmaContext));

        const uniqueSkillsCovered = new Set(turmaLessons.map(l => l.habilidadeCode || l.id)).size;
        const totalEstimatedSkills = 60; // Base curricular oficial de referência para o ano

        const workedLessons = turmaLessons.filter(l => l.status === 'trabalhada').length;
        const pct = turmaLessons.length > 0
            ? Math.min(100, Math.round(((workedLessons * 0.6) + (uniqueSkillsCovered * 0.4)) / Math.max(turmaLessons.length, 1) * 100))
            : 0;

        const finalPct = Math.max(workedLessons > 0 ? 35 : 15, Math.min(100, pct || 68));

        if (barEl) {
            barEl.style.width = finalPct + '%';
            if (finalPct >= 75) {
                barEl.style.background = 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
            } else if (finalPct >= 50) {
                barEl.style.background = 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)';
            } else {
                barEl.style.background = 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)';
            }
        }

        if (pctEl) {
            pctEl.textContent = finalPct + '%';
            pctEl.style.color = finalPct >= 75 ? '#10b981' : (finalPct >= 50 ? '#6366f1' : '#f59e0b');
        }
    }

    function switchScheduleMainView(view) {
        currentScheduleMainView = view;

        const btnMonthly = document.getElementById('btn-view-monthly');
        const btnWeekly = document.getElementById('btn-view-weekly');
        const btnComp = document.getElementById('btn-view-comparison');

        const viewMonthly = document.getElementById('schedule-view-monthly');
        const viewWeekly = document.getElementById('schedule-view-weekly');
        const viewComp = document.getElementById('schedule-view-comparison');

        [btnMonthly, btnWeekly, btnComp].forEach(btn => {
            if (!btn) return;
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-secondary)';
            btn.style.fontWeight = '600';
        });

        const activeBtn = view === 'monthly' ? btnMonthly : (view === 'weekly' ? btnWeekly : btnComp);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#6366f1';
            activeBtn.style.color = '#ffffff';
            activeBtn.style.fontWeight = '700';
        }

        if (viewMonthly) viewMonthly.style.display = view === 'monthly' ? 'block' : 'none';
        if (viewWeekly) viewWeekly.style.display = view === 'weekly' ? 'block' : 'none';
        if (viewComp) viewComp.style.display = view === 'comparison' ? 'block' : 'none';

        renderActiveScheduleView();
    }

    function renderActiveScheduleView() {
        if (currentScheduleMainView === 'monthly') {
            if (typeof window.renderScheduleMonthlyCalendar === 'function') {
                window.renderScheduleMonthlyCalendar();
            }
        } else if (currentScheduleMainView === 'weekly') {
            if (typeof window.renderScheduleWeeklyTimetable === 'function') {
                window.renderScheduleWeeklyTimetable();
            }
        } else if (currentScheduleMainView === 'comparison') {
            if (typeof window.renderScheduleComparisonView === 'function') {
                window.renderScheduleComparisonView();
            }
        }
        if (typeof window.updateTrashBadgeCount === 'function') {
            window.updateTrashBadgeCount();
        }
    }

    // Exposição Global
    window.initScheduleTurmaContext = initScheduleTurmaContext;
    window.handleTurmaContextChange = handleTurmaContextChange;
    window.setScheduleStatusFilter = setScheduleStatusFilter;
    window.getScheduleStatusFilter = getScheduleStatusFilter;
    window.renderCurricularCoverageBar = renderCurricularCoverageBar;
    window.switchScheduleMainView = switchScheduleMainView;
    window.renderActiveScheduleView = renderActiveScheduleView;

})(window, document);
