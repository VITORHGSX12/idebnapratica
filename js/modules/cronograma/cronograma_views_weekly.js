/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (VISÃO SEMANAL TIMETABLE)
 * Arquivo: js/modules/cronograma/cronograma_views_weekly.js
 * Descrição: Renderização da grade semanal 5x5 de horários, drag & drop
 *            e duplicação rápida de semana para a semana seguinte.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    function renderScheduleWeeklyTimetable() {
        const container = document.getElementById('weekly-timetable-grid');
        if (!container) return;

        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurma);
        const todayStr = typeof window.getScheduleReferenceToday === 'function' ? window.getScheduleReferenceToday() : new Date().toISOString().split('T')[0];

        const daysOfWeek = [
            { label: 'Segunda-feira', dateIso: '2026-08-17', short: 'SEG 17/08' },
            { label: 'Terça-feira', dateIso: '2026-08-18', short: 'TER 18/08' },
            { label: 'Quarta-feira', dateIso: '2026-08-19', short: 'QUA 19/08' },
            { label: 'Quinta-feira', dateIso: '2026-08-20', short: 'QUI 20/08' },
            { label: 'Sexta-feira', dateIso: '2026-08-21', short: 'SEX 21/08' }
        ];

        let html = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-color);">
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">Semana Vigente: 17 a 21 de Agosto</span>
                <button type="button" class="btn btn-outline btn-sm" onclick="if(window.handleDuplicateCurrentWeekToNext) window.handleDuplicateCurrentWeekToNext();" style="font-size: 0.74rem; font-weight: 700; color: #6366f1; border-color: #6366f1; display: inline-flex; align-items: center; gap: 4px;">
                    <span>📋 Replicar grade para próxima semana</span>
                </button>
            </div>
            <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); font-weight: 700; font-size: 0.8rem; text-align: center;">
                <div style="padding: 12px; border-right: 1px solid var(--border-color); color: var(--text-muted);">HORÁRIO</div>
                ${daysOfWeek.map(d => `<div style="padding: 12px; border-right: 1px solid var(--border-color); color: ${d.dateIso === todayStr ? '#6366f1' : 'var(--text-primary)'};">${d.short}${d.dateIso === todayStr ? ' (Hoje)' : ''}</div>`).join('')}
            </div>
        `;

        const timeSlots = [
            '07:30 - 08:20',
            '08:20 - 09:10',
            '09:25 - 10:15',
            '10:15 - 11:05'
        ];

        timeSlots.forEach(slot => {
            html += `
                <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); border-bottom: 1px solid var(--border-color); min-height: 85px;">
                    <div style="padding: 10px; border-right: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 700; color: var(--text-muted); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;">
                        ${slot}
                    </div>
                    ${daysOfWeek.map(d => {
                        const slotLessons = turmaLessons.filter(l => l.date === d.dateIso && l.time === slot);
                        return `
                            <div class="weekly-slot-cell" style="padding: 6px; border-right: 1px solid var(--border-color); background: var(--bg-primary); display: flex; flex-direction: column; gap: 4px; position: relative; min-height: 80px;"
                                 ondragover="event.preventDefault(); this.style.background='rgba(99,102,241,0.1)';"
                                 ondragleave="this.style.background='var(--bg-primary)';"
                                 ondrop="event.preventDefault(); this.style.background='var(--bg-primary)'; const lid = event.dataTransfer.getData('text/plain'); if(lid) handleLessonDropToSlot(lid, '${d.dateIso}', '${slot}');">
                                ${slotLessons.map(les => {
                                    const computedStatus = typeof window.getLessonComputedStatus === 'function'
                                        ? window.getLessonComputedStatus(les, todayStr)
                                        : (les.status === 'trabalhada' ? 'trabalhada' : (les.date < todayStr ? 'atrasada' : 'planejada'));

                                    const isAtrasada = computedStatus === 'atrasada';
                                    return `
                                        <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${les.id}');"
                                             class="weekly-lesson-card ${computedStatus === 'trabalhada' ? 'status-trabalhada' : (isAtrasada ? 'status-atrasada' : 'status-planejada')}"
                                             style="padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); font-size: 0.75rem; cursor: grab; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative;"
                                             onclick="if(window.openDayExpandedDrawer) window.openDayExpandedDrawer('${les.date}');">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                <strong style="color: #6366f1;">${les.habilidadeCode}</strong>
                                                <button type="button" onclick="event.stopPropagation(); if(window.toggleLessonWorkStatus) window.toggleLessonWorkStatus('${les.id}');" 
                                                        class="badge ${computedStatus === 'trabalhada' ? 'badge-success' : (isAtrasada ? 'badge-danger' : 'badge-warning')}" 
                                                        style="font-size: 0.65rem; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;" title="Clique para alternar Trabalhada / Planejada">
                                                    ${isAtrasada ? 'Atrasada' : (computedStatus === 'trabalhada' ? 'Trabalhada' : 'Planejada')}
                                                </button>
                                            </div>
                                            <div style="font-weight: 600; color: var(--text-primary); font-size: 0.72rem; line-height: 1.3;">${les.disciplina}</div>
                                            <div style="display: flex; gap: 4px; justify-content: flex-end; margin-top: 4px;">
                                                <button type="button" onclick="event.stopPropagation(); if(window.openNewSchedulePlanModal) window.openNewSchedulePlanModal(null, null, '${les.id}');" style="background: none; border: none; font-size: 11px; cursor: pointer; color: var(--text-muted);" title="Editar Planejamento">Editar</button>
                                                <button type="button" onclick="event.stopPropagation(); if(window.handleDeleteLessonWithTrash) window.handleDeleteLessonWithTrash('${les.id}');" style="background: none; border: none; font-size: 11px; cursor: pointer; color: #ef4444;" title="Mover para Lixeira">Excluir</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                                ${slotLessons.length === 0 ? `
                                    <div onclick="if(window.openNewSchedulePlanModal) window.openNewSchedulePlanModal('${d.dateIso}', '${slot}');" style="flex: 1; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; cursor: pointer; color: #6366f1; font-size: 0.72rem; font-weight: 700; border: 1px dashed rgba(99,102,241,0.4); border-radius: 4px;" onmouseover="this.style.opacity='1';" onmouseout="this.style.opacity='0';">
                                        + Planejar
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    function handleDuplicateCurrentWeekToNext() {
        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const weekDates = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'];
        const sourceLessons = allLessons.filter(l => l.turmaContext === currentTurma && weekDates.includes(l.date));

        if (sourceLessons.length === 0) {
            if (typeof window.showToast === 'function') {
                window.showToast('Nenhuma aula encontrada na semana atual para replicar.', 'warning');
            }
            return;
        }

        let duplicatedCount = 0;
        sourceLessons.forEach(les => {
            const curDate = new Date(les.date + 'T12:00:00Z');
            curDate.setDate(curDate.getDate() + 7);
            const nextDateIso = curDate.toISOString().split('T')[0];

            const newLesson = Object.assign({}, les, {
                id: 'les_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                date: nextDateIso,
                data_planejada: nextDateIso,
                status: 'planejada',
                data_confirmacao: null,
                createdAt: new Date().toISOString()
            });

            allLessons.push(newLesson);
            duplicatedCount++;
        });

        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`✅ ${duplicatedCount} aulas replicadas com sucesso para a semana seguinte!`, 'success');
        }
    }

    function handleLessonDropToSlot(lessonId, targetDateIso, targetTime) {
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        lesson.date = targetDateIso;
        lesson.time = targetTime;
        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }
        if (typeof window.showToast === 'function') {
            window.showToast(`Aula reagendada para ${targetDateIso.split('-').reverse().join('/')} às ${targetTime}!`, 'success');
        }
    }

    // Exposição Global
    window.renderScheduleWeeklyTimetable = renderScheduleWeeklyTimetable;
    window.handleLessonDropToSlot = handleLessonDropToSlot;
    window.handleDuplicateCurrentWeekToNext = handleDuplicateCurrentWeekToNext;

})(window, document);
