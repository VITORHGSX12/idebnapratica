/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (VIEWS ROUTER & ORCHESTRATOR)
 * Arquivo: js/modules/cronograma/cronograma_views.js
 * Descrição: Orquestrador de visualizações e controle de contexto de turma.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    let currentTurmaContext = 'UI JOSE CORREA LIMA — 2º Ano A';
    let currentScheduleMainView = 'monthly'; // 'monthly' | 'weekly' | 'comparison'

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

        renderActiveScheduleView();
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
    window.handleTurmaContextChange = handleTurmaContextChange;
    window.switchScheduleMainView = switchScheduleMainView;
    window.renderActiveScheduleView = renderActiveScheduleView;

})(window, document);
