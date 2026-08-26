/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (COORDINATOR & INIT)
 * Arquivo: js/modules/cronograma/cronograma.js
 * Descrição: Orquestrador principal do módulo de Cronograma e Rotina de
 *            Habilidades IDEB / SAEB. Integra State, Views, Planner e Calendar.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    function initCronogramaModule() {
        console.log('[Cronograma] Inicializando orquestrador do módulo de habilidades...');

        // 1. Inicializar Matriz e Calendário 7 Colunas
        if (typeof window.initAnnualSkillsCalendar === 'function') {
            window.initAnnualSkillsCalendar();
        }
        if (typeof window.setup7ColCalendarEvents === 'function') {
            window.setup7ColCalendarEvents();
        }

        // 2. Renderizar Visões Principais
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }
        if (typeof window.renderSkillsSchedule === 'function') {
            window.renderSkillsSchedule();
        }
        if (typeof window.renderDailyCalendar === 'function') {
            window.renderDailyCalendar();
        }
        if (typeof window.renderSchoolRoutineMonitoring === 'function') {
            window.renderSchoolRoutineMonitoring();
        }

        // 3. Atualizar Badges e Contadores
        if (typeof window.updateTrashBadgeCount === 'function') {
            window.updateTrashBadgeCount();
        }

        // 4. Vincular listeners aos filtros principais
        const turmaFilter = document.getElementById('cal-filter-turma-context');
        if (turmaFilter) {
            turmaFilter.addEventListener('change', () => {
                if (typeof window.handleTurmaContextChange === 'function') {
                    window.handleTurmaContextChange();
                }
            });
        }

        const subjectFilter = document.getElementById('cal-filter-subject-v2');
        if (subjectFilter) {
            subjectFilter.addEventListener('change', () => {
                if (typeof window.renderActiveScheduleView === 'function') {
                    window.renderActiveScheduleView();
                }
            });
        }

        const idebTargetInput = document.getElementById('target-ideb-input');
        if (idebTargetInput) {
            idebTargetInput.addEventListener('input', (e) => {
                if (typeof window.generateFull40WeeksSchedule === 'function') {
                    window.generateFull40WeeksSchedule(e.target.value);
                }
                if (typeof window.renderSkillsSchedule === 'function') {
                    window.renderSkillsSchedule();
                }
            });
        }

        const stageFilter = document.getElementById('schedule-filter-stage');
        const statusFilter = document.getElementById('schedule-filter-status');
        if (stageFilter) stageFilter.addEventListener('change', () => window.renderSkillsSchedule?.());
        if (statusFilter) statusFilter.addEventListener('change', () => window.renderSkillsSchedule?.());

        if (typeof window.safeCreateIcons === 'function') {
            window.safeCreateIcons();
        }
    }

    // Inicialização segura após o carregamento da DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCronogramaModule);
    } else {
        setTimeout(initCronogramaModule, 100);
    }

    // Exposição global para chamadas reativas da SPA
    window.initCronogramaModule = initCronogramaModule;

})(window, document);
