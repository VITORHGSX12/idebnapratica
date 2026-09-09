/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (VISÃO MENSAL & DRAWER)
 * Arquivo: js/modules/cronograma/cronograma_views_monthly.js
 * Descrição: Renderização do calendário mensal com drag & drop, drawer lateral,
 *            filtros de status integrados e alternância de status 1-clique.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    let activeExpandedDate = null;

    function renderScheduleMonthlyCalendar() {
        const grid = document.getElementById('calendar-monthly-cells-grid');
        const accordion = document.getElementById('calendar-monthly-accordion-mobile');
        const statsEl = document.getElementById('monthly-stats-summary');
        const filteredCountBadge = document.getElementById('schedule-filtered-count-badge');
        if (!grid) return;

        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const subjectFilter = document.getElementById('cal-filter-subject-v2')?.value || 'all';
        const statusFilter = typeof window.getScheduleStatusFilter === 'function' ? window.getScheduleStatusFilter() : 'all';

        const todayStr = typeof window.getScheduleReferenceToday === 'function' 
            ? window.getScheduleReferenceToday() 
            : new Date().toISOString().split('T')[0];

        // Todas as aulas da turma para estatísticas gerais
        const allTurmaLessons = allLessons.filter(l => {
            if (l.turmaContext !== currentTurma) return false;
            if (subjectFilter !== 'all' && l.disciplina !== subjectFilter) return false;
            return true;
        });

        // Aulas filtradas por status para exibição no calendário
        const turmaLessons = allTurmaLessons.filter(l => {
            if (statusFilter === 'all') return true;
            const computed = typeof window.getLessonComputedStatus === 'function'
                ? window.getLessonComputedStatus(l, todayStr)
                : (l.status === 'trabalhada' ? 'trabalhada' : (l.date < todayStr ? 'atrasada' : 'planejada'));
            return computed === statusFilter;
        });

        // Cálculo via Fonte Única da Verdade
        const progress = typeof window.calculateScheduleProgress === 'function'
            ? window.calculateScheduleProgress(allTurmaLessons, todayStr)
            : { total: allTurmaLessons.length, trabalhadas: 0, atrasadas: 0, pct: 0 };

        if (statsEl) {
            statsEl.innerHTML = `
                <span>${progress.trabalhadas} de ${progress.total} aulas trabalhadas (${progress.pct}%)</span>
                ${progress.atrasadas > 0 ? `<span style="color: #ef4444; margin-left: 10px; display:inline-flex; align-items:center; gap:3px;">• <i data-lucide="alert-circle" style="width:12px;height:12px;"></i> ${progress.atrasadas} em atraso</span>` : ''}
            `;
        }

        if (filteredCountBadge) {
            if (statusFilter === 'all') {
                filteredCountBadge.textContent = `Mostrando todas as ${allTurmaLessons.length} aulas do mês`;
            } else if (statusFilter === 'atrasada') {
                filteredCountBadge.innerHTML = `<span style="color:#ef4444;">Filtrado: ${turmaLessons.length} aula(s) em atraso / reposição</span>`;
            } else if (statusFilter === 'trabalhada') {
                filteredCountBadge.innerHTML = `<span style="color:#10b981;">Filtrado: ${turmaLessons.length} aula(s) trabalhadas</span>`;
            } else {
                filteredCountBadge.innerHTML = `<span style="color:#f59e0b;">Filtrado: ${turmaLessons.length} aula(s) planejadas</span>`;
            }
        }

        if (typeof window.renderCurricularCoverageBar === 'function') {
            window.renderCurricularCoverageBar(currentTurma);
        }

        grid.innerHTML = '';
        if (accordion) accordion.innerHTML = '';

        // Empty state caso não existam aulas planejadas
        if (allTurmaLessons.length === 0) {
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
                <div style="width: 48px; height: 48px; border-radius: var(--radius-pill); background: var(--color-primary-subtle); color: var(--color-brand-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
                    <i data-lucide="calendar" style="width: 24px; height: 24px;"></i>
                </div>
                <h4 style="margin: 0 0 6px 0; color: var(--text-primary); font-weight: 700;">Nenhum planejamento cadastrado neste período</h4>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin: 0 0 16px 0; max-width: 450px; margin-left: auto; margin-right: auto;">
                    Comece a estruturar a rotina pedagógica desta turma selecionando habilidades BNCC e descritores SAEB.
                </p>
                <button type="button" class="btn btn-primary btn-sm" onclick="if(window.openNewSchedulePlanModal) window.openNewSchedulePlanModal();" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-weight: 700;">
                    <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                    <span>Novo Planejamento</span>
                </button>
            `;
            grid.appendChild(emptyContainer);
            if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons(grid);
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
                expandBtn.title = `Ver ${dayLessons.length} aula(s) do dia ${dayNumStr}/08`;
                expandBtn.style.background = 'rgba(99,102,241,0.1)';
                expandBtn.style.border = 'none';
                expandBtn.style.color = '#6366f1';
                expandBtn.style.fontSize = '0.68rem';
                expandBtn.style.fontWeight = '700';
                expandBtn.style.borderRadius = '4px';
                expandBtn.style.padding = '1px 5px';
                expandBtn.style.cursor = 'pointer';
                expandBtn.textContent = `${dayLessons.length} aula(s)`;
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

                const statusIcon = isAtrasada ? 'alert-triangle' : (computedStatus === 'trabalhada' ? 'check-circle' : 'clock');
                const dotColor = computedStatus === 'trabalhada' ? '#10b981' : (isAtrasada ? '#ef4444' : '#f59e0b');

                tag.innerHTML = `
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; flex: 1; display:flex; align-items:center; gap:4px;">
                        <i data-lucide="${statusIcon}" style="width:11px;height:11px;flex-shrink:0;"></i>
                        <span>${les.habilidadeCode || les.disciplina}</span>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); toggleLessonWorkStatus('${les.id}');" 
                            style="background: none; border: none; cursor: pointer; padding: 0 2px; display:inline-flex; align-items:center;" title="Alternar Trabalhada/Planejada (1-Clique)">
                        <span style="width:8px; height:8px; border-radius:50%; background:${dotColor}; display:inline-block;"></span>
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

        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons(grid);
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
                <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                    Nenhuma aula cadastrada para esta data.
                </div>
            `;
        } else {
            dayLessons.forEach(les => {
                const computedStatus = typeof window.getLessonComputedStatus === 'function'
                    ? window.getLessonComputedStatus(les, todayStr)
                    : (les.status === 'trabalhada' ? 'trabalhada' : (les.date < todayStr ? 'atrasada' : 'planejada'));

                const isAtrasada = computedStatus === 'atrasada';
                const statusBadge = computedStatus === 'trabalhada' 
                    ? '<span class="badge badge-success">Trabalhada</span>' 
                    : (isAtrasada ? '<span class="badge badge-danger">Em Atraso</span>' : '<span class="badge badge-warning">Planejada</span>');

                const card = document.createElement('div');
                card.style.background = 'var(--bg-secondary)';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '14px';
                card.style.marginBottom = '10px';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <div>
                            <span class="badge badge-primary" style="font-size: 0.7rem; font-weight: 700;">${les.disciplina}</span>
                            <span style="font-size: 0.72rem; color: var(--text-muted); margin-left: 6px;">${les.time || '07:30 - 08:20'}</span>
                        </div>
                        ${statusBadge}
                    </div>
                    <div style="font-size: 0.88rem; font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                        ${les.habilidadeCode ? `<span style="color:#6366f1;">[${les.habilidadeCode}]</span> ` : ''}${les.habilidadeDesc || les.title || 'Conteúdo Programático'}
                    </div>
                    ${les.metodologia ? `<p style="font-size: 0.78rem; color: var(--text-secondary); margin: 4px 0 8px 0; line-height: 1.4;">${les.metodologia}</p>` : ''}
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 8px;">
                        <button type="button" onclick="toggleLessonWorkStatus('${les.id}');" class="btn btn-outline btn-xs" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
                            <i data-lucide="${computedStatus === 'trabalhada' ? 'rotate-ccw' : 'check'}" style="width:12px;height:12px;"></i>
                            <span>${computedStatus === 'trabalhada' ? 'Marcar Pendente' : 'Marcar Concluída'}</span>
                        </button>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" onclick="if(window.openNewSchedulePlanModal) window.openNewSchedulePlanModal(null, null, '${les.id}');" class="btn btn-outline btn-xs" style="font-size: 0.72rem;">Editar</button>
                            <button type="button" onclick="if(window.handleDeleteLessonWithTrash) window.handleDeleteLessonWithTrash('${les.id}');" class="btn btn-outline btn-xs" style="font-size: 0.72rem; color: #ef4444; border-color: rgba(239,68,68,0.4);">Excluir</button>
                        </div>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        if (addBtn) {
            addBtn.onclick = () => {
                closeDayExpandedDrawer();
                if (window.openNewSchedulePlanModal) window.openNewSchedulePlanModal(dateIso);
            };
        }

        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons(overlay);
    }

    function closeDayExpandedDrawer() {
        const overlay = document.getElementById('drawer-day-expanded-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
        activeExpandedDate = null;
    }

    function handleLessonDropToDate(lessonId, targetDateIso) {
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const prevDate = lesson.date;
        lesson.date = targetDateIso;

        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }

        renderScheduleMonthlyCalendar();
        if (typeof window.showToast === 'function') {
            const formatted = targetDateIso.split('-').reverse().join('/');
            window.showToast(`Aula reagendada para ${formatted} com sucesso!`, 'calendar');
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
            window.showToast(`Status da aula alterado para "${isNowTrabalhada ? 'CONCLUÍDA / TRABALHADA' : 'PLANEJADA'}"!`, isNowTrabalhada ? 'check-circle' : 'info');
        }
    }

    // Exposição Global
    window.renderScheduleMonthlyCalendar = renderScheduleMonthlyCalendar;
    window.openDayExpandedDrawer = openDayExpandedDrawer;
    window.closeDayExpandedDrawer = closeDayExpandedDrawer;
    window.handleLessonDropToDate = handleLessonDropToDate;
    window.toggleLessonWorkStatus = toggleLessonWorkStatus;

})(window, document);
