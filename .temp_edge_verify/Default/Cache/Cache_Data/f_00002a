/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (VISÃO MENSAL & DRAWER)
 * Arquivo: js/modules/cronograma/cronograma_views_monthly.js
 * Descrição: Renderização do calendário mensal com drag & drop, drawer lateral
 *            e empty state amigável.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    let activeExpandedDate = null;

    function renderScheduleMonthlyCalendar() {
        const grid = document.getElementById('calendar-monthly-cells-grid');
        const accordion = document.getElementById('calendar-monthly-accordion-mobile');
        const statsEl = document.getElementById('monthly-stats-summary');
        if (!grid) return;

        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const subjectFilter = document.getElementById('cal-filter-subject-v2')?.value || 'all';

        const turmaLessons = allLessons.filter(l => {
            if (l.turmaContext !== currentTurma) return false;
            if (subjectFilter !== 'all' && l.disciplina !== subjectFilter) return false;
            return true;
        });

        const todayStr = typeof window.getScheduleReferenceToday === 'function' 
            ? window.getScheduleReferenceToday() 
            : new Date().toISOString().split('T')[0];

        // Cálculo via Fonte Única da Verdade
        const progress = typeof window.calculateScheduleProgress === 'function'
            ? window.calculateScheduleProgress(turmaLessons, todayStr)
            : { total: turmaLessons.length, trabalhadas: 0, atrasadas: 0, pct: 0 };

        if (statsEl) {
            statsEl.innerHTML = `
                <span>${progress.trabalhadas} de ${progress.total} aulas trabalhadas (${progress.pct}%)</span>
                ${progress.atrasadas > 0 ? `<span style="color: #ef4444; margin-left: 10px;">• ⚠️ ${progress.atrasadas} em atraso</span>` : ''}
            `;
        }

        grid.innerHTML = '';
        if (accordion) accordion.innerHTML = '';

        // Empty state caso não existam aulas planejadas
        if (turmaLessons.length === 0) {
            const emptyContainer = document.createElement('div');
            emptyContainer.className = 'calendar-empty-state';
            emptyContainer.style.gridColumn = '1 / -1';
            emptyContainer.style.padding = '40px 20px';
            emptyContainer.style.textAlign = 'center';
            emptyContainer.style.background = 'var(--bg-secondary)';
            emptyContainer.style.borderRadius = 'var(--radius-md)';
            emptyContainer.style.border = '1px dashed var(--border-color)';
            emptyContainer.style.margin = '10px 0';
            emptyContainer.innerHTML = `
                <div style="font-size: 2.2rem; margin-bottom: 8px;">🗓️</div>
                <h4 style="margin: 0 0 6px 0; color: var(--text-primary); font-weight: 700;">Nenhum planejamento cadastrado neste período</h4>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 16px 0; max-width: 450px; margin-left: auto; margin-right: auto;">
                    Comece a estruturar a rotina pedagógica desta turma selecionando habilidades BNCC e descritores SAEB.
                </p>
                <button type="button" class="btn btn-primary btn-sm" onclick="if(window.openNewSchedulePlanModal) window.openNewSchedulePlanModal();" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-weight: 700;">
                    <span>+ Novo Planejamento</span>
                </button>
            `;
            grid.appendChild(emptyContainer);
            return;
        }

        const startDayOfWeek = 6; // Sábado (1 de Agosto de 2026)
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell cal-day-empty';
            emptyCell.style.background = 'var(--bg-tertiary)';
            emptyCell.style.minHeight = '110px';
            emptyCell.style.opacity = '0.4';
            grid.appendChild(emptyCell);
        }

        for (let d = 1; d <= 31; d++) {
            const dayNumStr = String(d).padStart(2, '0');
            const dateIso = `2026-08-${dayNumStr}`;
            const dayLessons = turmaLessons.filter(l => l.date === dateIso);
            const isToday = dateIso === todayStr;

            const cell = document.createElement('div');
            cell.className = `cal-day-cell ${isToday ? 'cal-day-today' : ''}`;
            cell.style.minHeight = '115px';
            cell.style.background = isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)';
            cell.style.padding = '8px';
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.gap = '4px';
            cell.style.position = 'relative';

            cell.ondragover = (e) => { e.preventDefault(); cell.style.background = 'rgba(99, 102, 241, 0.15)'; };
            cell.ondragleave = () => { cell.style.background = isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)'; };
            cell.ondrop = (e) => {
                e.preventDefault();
                cell.style.background = isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)';
                const lessonId = e.dataTransfer.getData('text/plain');
                if (lessonId) handleLessonDropToDate(lessonId, dateIso);
            };

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.marginBottom = '2px';

            const daySpan = document.createElement('span');
            daySpan.style.fontWeight = isToday ? '800' : '700';
            daySpan.style.fontSize = '0.85rem';
            daySpan.style.color = isToday ? '#6366f1' : 'var(--text-primary)';
            daySpan.textContent = d;
            headerDiv.appendChild(daySpan);

            if (dayLessons.length > 0) {
                const expandBtn = document.createElement('button');
                expandBtn.type = 'button';
                expandBtn.title = `Ver ${dayLessons.length} aulas do dia ${dayNumStr}/08`;
                expandBtn.style.background = 'rgba(99,102,241,0.1)';
                expandBtn.style.border = 'none';
                expandBtn.style.color = '#6366f1';
                expandBtn.style.fontSize = '0.68rem';
                expandBtn.style.fontWeight = '700';
                expandBtn.style.borderRadius = '4px';
                expandBtn.style.padding = '1px 5px';
                expandBtn.style.cursor = 'pointer';
                expandBtn.textContent = `${dayLessons.length} aulas 👁️`;
                expandBtn.onclick = (e) => { e.stopPropagation(); openDayExpandedDrawer(dateIso); };
                headerDiv.appendChild(expandBtn);
            }

            cell.appendChild(headerDiv);

            const displayLessons = dayLessons.slice(0, 2);
            displayLessons.forEach(les => {
                const computedStatus = typeof window.getLessonComputedStatus === 'function'
                    ? window.getLessonComputedStatus(les, todayStr)
                    : (les.status === 'trabalhada' ? 'trabalhada' : (les.date < todayStr ? 'atrasada' : 'planejada'));

                const isAtrasada = computedStatus === 'atrasada';
                const tag = document.createElement('div');
                tag.draggable = true;
                tag.ondragstart = (e) => { e.dataTransfer.setData('text/plain', les.id); };
                tag.className = `cal-lesson-tag ${computedStatus === 'trabalhada' ? 'tag-trabalhada' : (isAtrasada ? 'tag-atrasada' : 'tag-planejada')}`;
                tag.style.fontSize = '0.72rem';
                tag.style.padding = '4px 6px';
                tag.style.borderRadius = '4px';
                tag.style.cursor = 'grab';
                tag.style.marginBottom = '2px';
                tag.style.display = 'flex';
                tag.style.justifyContent = 'space-between';
                tag.style.alignItems = 'center';
                tag.onclick = () => openDayExpandedDrawer(dateIso);

                tag.innerHTML = `
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; flex: 1;">
                        ${isAtrasada ? '⚠️ ' : (computedStatus === 'trabalhada' ? '✓ ' : '⏳ ')}${les.habilidadeCode || les.disciplina}
                    </div>
                    <button type="button" onclick="event.stopPropagation(); toggleLessonWorkStatus('${les.id}');" 
                            style="background: none; border: none; cursor: pointer; font-size: 10px; padding: 0 2px; line-height: 1;" title="Alternar Trabalhada/Planejada">
                        ${computedStatus === 'trabalhada' ? '🟢' : '🟡'}
                    </button>
                `;
                cell.appendChild(tag);
            });

            if (dayLessons.length > 2) {
                const moreBtn = document.createElement('div');
                moreBtn.style.fontSize = '0.7rem';
                moreBtn.style.color = '#6366f1';
                moreBtn.style.fontWeight = '700';
                moreBtn.style.cursor = 'pointer';
                moreBtn.style.textAlign = 'center';
                moreBtn.style.marginTop = '2px';
                moreBtn.textContent = `+${dayLessons.length - 2} aulas (ver todas)`;
                moreBtn.onclick = () => openDayExpandedDrawer(dateIso);
                cell.appendChild(moreBtn);
            }

            grid.appendChild(cell);
        }
    }

    function openDayExpandedDrawer(dateIso) {
        activeExpandedDate = dateIso;
        const overlay = document.getElementById('drawer-day-expanded-overlay');
        const title = document.getElementById('drawer-day-title');
        const subtitle = document.getElementById('drawer-day-subtitle');
        const list = document.getElementById('drawer-day-lessons-list');
        const addBtn = document.getElementById('btn-drawer-add-lesson-to-day');

        if (!overlay || !list) return;

        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const formattedDate = dateIso.split('-').reverse().join('/');
        if (title) title.textContent = `Aulas do Dia: ${formattedDate}`;
        if (subtitle) subtitle.textContent = currentTurma;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const dayLessons = allLessons.filter(l => l.turmaContext === currentTurma && l.date === dateIso);
        const todayStr = typeof window.getScheduleReferenceToday === 'function' ? window.getScheduleReferenceToday() : new Date().toISOString().split('T')[0];

        list.innerHTML = '';

        if (dayLessons.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                    <p style="font-size: 0.85rem; margin: 0;">Nenhuma aula agendada para esta turma neste dia.</p>
                </div>
            `;
        } else {
            dayLessons.forEach(les => {
                const computedStatus = typeof window.getLessonComputedStatus === 'function'
                    ? window.getLessonComputedStatus(les, todayStr)
                    : (les.status === 'trabalhada' ? 'trabalhada' : (les.date < todayStr ? 'atrasada' : 'planejada'));

                const isAtrasada = computedStatus === 'atrasada';
                const card = document.createElement('div');
                card.style.background = 'var(--bg-primary)';
                card.style.border = isAtrasada ? '1.5px solid #ef4444' : '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '14px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '8px';

                const safeCode = typeof window.escapeHtml === 'function' ? window.escapeHtml(les.habilidadeCode) : les.habilidadeCode;
                const safeDisc = typeof window.escapeHtml === 'function' ? window.escapeHtml(les.disciplina) : les.disciplina;
                const safeTime = typeof window.escapeHtml === 'function' ? window.escapeHtml(les.time || 'Horário Padrão') : (les.time || 'Horário Padrão');
                const safeDesc = typeof window.escapeHtml === 'function' ? window.escapeHtml(les.habilidadeDesc) : les.habilidadeDesc;
                const safeMethod = les.methodology ? (typeof window.escapeHtml === 'function' ? window.escapeHtml(les.methodology) : les.methodology) : '';
                const safeCriadoPor = typeof window.escapeHtml === 'function' ? window.escapeHtml(les.criadoPor || 'Docente Regente') : (les.criadoPor || 'Docente Regente');

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 800; font-size: 0.88rem; color: #6366f1;">${safeCode}</span>
                        <span class="badge ${computedStatus === 'trabalhada' ? 'badge-success' : (isAtrasada ? 'badge-danger' : 'badge-warning')}">
                            ${isAtrasada ? '⚠️ Atrasada / Pendente' : (computedStatus === 'trabalhada' ? 'Trabalhada' : 'Planejada')}
                        </span>
                    </div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${safeDisc} • ${safeTime}</div>
                    <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">${safeDesc}</p>
                    ${safeMethod ? `<div style="font-size: 0.72rem; color: var(--text-muted); background: var(--bg-tertiary); padding: 6px 8px; border-radius: 4px;"><strong>Metodologia:</strong> ${safeMethod}</div>` : ''}
                    <div style="font-size: 0.7rem; color: var(--text-muted);">Responsável: ${safeCriadoPor}</div>
                    
                    <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 8px;">
                        <button type="button" onclick="toggleLessonWorkStatus('${les.id}');" class="btn btn-outline btn-sm" style="font-size: 0.72rem; font-weight: 700; color: ${les.status === 'trabalhada' ? '#f59e0b' : '#10b981'}; border-color: ${les.status === 'trabalhada' ? '#f59e0b' : '#10b981'};">
                            ${les.status === 'trabalhada' ? 'Marcar como Planejada' : 'Concluir / Trabalhada'}
                        </button>
                        <button type="button" onclick="if(window.openDuplicateLessonModal) window.openDuplicateLessonModal('${les.id}');" class="btn btn-outline btn-sm" style="font-size: 0.72rem;" title="Duplicar para outra turma">
                            Duplicar
                        </button>
                        <button type="button" onclick="if(window.handleDeleteLessonWithTrash) window.handleDeleteLessonWithTrash('${les.id}');" class="btn btn-outline btn-sm" style="font-size: 0.72rem; color: #ef4444; border-color: #fca5a5;" title="Excluir aula">
                            Excluir
                        </button>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        if (addBtn) {
            addBtn.onclick = () => {
                closeDayExpandedDrawer();
                if (typeof window.openNewSchedulePlanModal === 'function') {
                    window.openNewSchedulePlanModal(dateIso);
                }
            };
        }

        overlay.style.display = 'block';
    }

    function closeDayExpandedDrawer() {
        const overlay = document.getElementById('drawer-day-expanded-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    function handleLessonDropToDate(lessonId, targetDateIso) {
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const oldDate = lesson.date;
        lesson.date = targetDateIso;
        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }
        if (typeof window.showToast === 'function') {
            window.showToast(`Aula reagendada de ${oldDate.split('-').reverse().join('/')} para ${targetDateIso.split('-').reverse().join('/')}!`, 'success');
        }
    }

    function toggleLessonWorkStatus(lessonId) {
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const isNowTrabalhada = lesson.status !== 'trabalhada';
        lesson.status = isNowTrabalhada ? 'trabalhada' : 'planejada';
        lesson.data_confirmacao = isNowTrabalhada ? new Date().toISOString() : null;

        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }

        const drawer = document.getElementById('drawer-day-expanded-overlay');
        if (drawer && drawer.style.display !== 'none' && activeExpandedDate) {
            openDayExpandedDrawer(activeExpandedDate);
        }
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`Status alterado para "${lesson.status.toUpperCase()}"${isNowTrabalhada ? ' (Confirmada)' : ''}!`, isNowTrabalhada ? 'success' : 'info');
        }
    }

    // Exposição Global
    window.renderScheduleMonthlyCalendar = renderScheduleMonthlyCalendar;
    window.openDayExpandedDrawer = openDayExpandedDrawer;
    window.closeDayExpandedDrawer = closeDayExpandedDrawer;
    window.handleLessonDropToDate = handleLessonDropToDate;
    window.toggleLessonWorkStatus = toggleLessonWorkStatus;

})(window, document);
