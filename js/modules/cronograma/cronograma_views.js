/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (VIEWS & TIMETABLE)
 * Arquivo: js/modules/cronograma/cronograma_views.js
 * Descrição: Renderização das visões Mensal, Semanal Timetable, Comparativo
 *            e Drawer de visualização expandida de aulas por dia.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    let currentTurmaContext = 'UI JOSE CORREA LIMA — 2º Ano A';
    let currentScheduleMainView = 'monthly'; // 'monthly' | 'weekly' | 'comparison'
    let activeExpandedDate = '2026-08-18';

    // =========================================================================
    // CONTEXTO DE TURMA E TROCA DE VISÃO PRINCIPAL
    // =========================================================================

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
            renderScheduleMonthlyCalendar();
        } else if (currentScheduleMainView === 'weekly') {
            renderScheduleWeeklyTimetable();
        } else if (currentScheduleMainView === 'comparison') {
            renderScheduleComparisonView();
        }
        if (typeof window.updateTrashBadgeCount === 'function') {
            window.updateTrashBadgeCount();
        }
    }

    // =========================================================================
    // VISÃO MENSAL (DRAG & DROP, EXPANSOR DE AULAS)
    // =========================================================================

    function renderScheduleMonthlyCalendar() {
        const grid = document.getElementById('calendar-monthly-cells-grid');
        const accordion = document.getElementById('calendar-monthly-accordion-mobile');
        const statsEl = document.getElementById('monthly-stats-summary');
        if (!grid) return;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const subjectFilter = document.getElementById('cal-filter-subject-v2')?.value || 'all';

        const turmaLessons = allLessons.filter(l => {
            if (l.turmaContext !== currentTurmaContext) return false;
            if (subjectFilter !== 'all' && l.disciplina !== subjectFilter) return false;
            return true;
        });

        const todayStr = '2026-08-18';

        const total = turmaLessons.length;
        const trabalhadas = turmaLessons.filter(l => l.status === 'trabalhada').length;
        const atrasadas = turmaLessons.filter(l => l.status === 'planejada' && l.date < todayStr).length;
        const pct = total > 0 ? Math.round((trabalhadas / total) * 100) : 0;

        if (statsEl) {
            statsEl.innerHTML = `
                <span>${trabalhadas} de ${total} aulas trabalhadas (${pct}%)</span>
                ${atrasadas > 0 ? `<span style="color: #ef4444; margin-left: 10px;">• ⚠️ ${atrasadas} em atraso</span>` : ''}
            `;
        }

        grid.innerHTML = '';
        if (accordion) accordion.innerHTML = '';

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
                const isAtrasada = les.status === 'planejada' && les.date < todayStr;
                const tag = document.createElement('div');
                tag.draggable = true;
                tag.ondragstart = (e) => { e.dataTransfer.setData('text/plain', les.id); };
                tag.className = `cal-lesson-tag ${les.status === 'trabalhada' ? 'tag-trabalhada' : (isAtrasada ? 'tag-atrasada' : 'tag-planejada')}`;
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
                        ${isAtrasada ? '⚠️ ' : (les.status === 'trabalhada' ? '✓ ' : '⏳ ')}${les.habilidadeCode || les.disciplina}
                    </div>
                    <button type="button" onclick="event.stopPropagation(); toggleLessonWorkStatus('${les.id}');" 
                            style="background: none; border: none; cursor: pointer; font-size: 10px; padding: 0 2px; line-height: 1;" title="Alternar Trabalhada/Planejada">
                        ${les.status === 'trabalhada' ? '🟢' : '🟡'}
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

    // =========================================================================
    // VISÃO SEMANAL TIMETABLE
    // =========================================================================

    function renderScheduleWeeklyTimetable() {
        const container = document.getElementById('weekly-timetable-grid');
        if (!container) return;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurmaContext);
        const todayStr = '2026-08-18';

        const daysOfWeek = [
            { label: 'Segunda-feira', dateIso: '2026-08-17', short: 'SEG 17/08' },
            { label: 'Terça-feira', dateIso: '2026-08-18', short: 'TER 18/08 (Hoje)' },
            { label: 'Quarta-feira', dateIso: '2026-08-19', short: 'QUA 19/08' },
            { label: 'Quinta-feira', dateIso: '2026-08-20', short: 'QUI 20/08' },
            { label: 'Sexta-feira', dateIso: '2026-08-21', short: 'SEX 21/08' }
        ];

        let html = `
            <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); font-weight: 700; font-size: 0.8rem; text-align: center;">
                <div style="padding: 12px; border-right: 1px solid var(--border-color); color: var(--text-muted);">HORÁRIO</div>
                ${daysOfWeek.map(d => `<div style="padding: 12px; border-right: 1px solid var(--border-color); color: ${d.dateIso === todayStr ? '#6366f1' : 'var(--text-primary)'};">${d.short}</div>`).join('')}
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
                                    const isAtrasada = les.status === 'planejada' && les.date < todayStr;
                                    return `
                                        <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${les.id}');"
                                             class="weekly-lesson-card ${les.status === 'trabalhada' ? 'status-trabalhada' : (isAtrasada ? 'status-atrasada' : 'status-planejada')}"
                                             style="padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); font-size: 0.75rem; cursor: grab; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative;"
                                             onclick="openDayExpandedDrawer('${les.date}');">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                <strong style="color: #6366f1;">${les.habilidadeCode}</strong>
                                                <button type="button" onclick="event.stopPropagation(); toggleLessonWorkStatus('${les.id}');" 
                                                        class="badge ${les.status === 'trabalhada' ? 'badge-success' : (isAtrasada ? 'badge-danger' : 'badge-warning')}" 
                                                        style="font-size: 0.65rem; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;" title="Clique para alternar Trabalhada / Planejada">
                                                    ${isAtrasada ? 'Atrasada' : (les.status === 'trabalhada' ? 'Trabalhada' : 'Planejada')}
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

    // =========================================================================
    // VISÃO COMPARATIVO LADO A LADO ENTRE TURMAS
    // =========================================================================

    function renderScheduleComparisonView() {
        const container = document.getElementById('schedule-comparison-cards-container');
        const sel1 = document.getElementById('compare-turma-select-1');
        const sel2 = document.getElementById('compare-turma-select-2');
        if (!container || !sel1 || !sel2) return;

        const turma1 = sel1.value;
        const turma2 = sel2.value;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lessons1 = allLessons.filter(l => l.turmaContext === turma1);
        const lessons2 = allLessons.filter(l => l.turmaContext === turma2);

        function buildColumnHtml(turmaName, lessons, accentColor) {
            const total = lessons.length;
            const trab = lessons.filter(l => l.status === 'trabalhada').length;
            const atras = lessons.filter(l => l.status === 'planejada' && l.date < '2026-08-18').length;
            const pct = total > 0 ? Math.round((trab / total) * 100) : 0;

            const lpTrab = lessons.filter(l => l.disciplina === 'Língua Portuguesa' && l.status === 'trabalhada').length;
            const mtTrab = lessons.filter(l => l.disciplina === 'Matemática' && l.status === 'trabalhada').length;
            const ciTrab = lessons.filter(l => l.disciplina && l.disciplina.includes('Ciências') && l.status === 'trabalhada').length;

            return `
                <div class="comparison-column-card">
                    <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                        <span style="font-size: 0.72rem; font-weight: 800; color: ${accentColor}; text-transform: uppercase;">TURMA ANALISADA</span>
                        <h4 style="margin: 2px 0 0 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">${turmaName}</h4>
                    </div>

                    <!-- Métricas Principais -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">COBERTURA</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: ${accentColor};">${pct}%</div>
                        </div>
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">TRABALHADAS</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: #10b981;">${trab}/${total}</div>
                        </div>
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">ATRASOS</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: ${atras > 0 ? '#ef4444' : '#10b981'};">${atras}</div>
                        </div>
                    </div>

                    <!-- Progresso por Componente Curricular -->
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">Progresso por Disciplina:</div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Língua Portuguesa</span>
                                <strong>${lpTrab} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar purple" style="width: ${total > 0 ? (lpTrab / total) * 100 : 0}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Matemática</span>
                                <strong>${mtTrab} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar blue" style="width: ${total > 0 ? (mtTrab / total) * 100 : 0}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Ciências da Natureza</span>
                                <strong>${ciTrab} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar green" style="width: ${total > 0 ? (ciTrab / total) * 100 : 0}%;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Lista de Habilidades Agendadas -->
                    <div style="flex: 1; border-top: 1px solid var(--border-color); padding-top: 10px;">
                        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">Habilidades Trabalhadas e Lacunas:</div>
                        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto;">
                            ${lessons.map(l => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.75rem;">
                                    <div>
                                        <strong style="color: #6366f1;">${l.habilidadeCode}</strong> - ${l.disciplina}
                                        <div style="font-size: 0.68rem; color: var(--text-muted);">Data: ${l.date.split('-').reverse().join('/')}</div>
                                    </div>
                                    <span class="badge ${l.status === 'trabalhada' ? 'badge-success' : 'badge-warning'}">${l.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = buildColumnHtml(turma1, lessons1, '#6366f1') + buildColumnHtml(turma2, lessons2, '#10b981');
    }

    // =========================================================================
    // VISUALIZAÇÃO EXPANDIDA DO DIA (DRAWER LATERAL)
    // =========================================================================

    function openDayExpandedDrawer(dateIso) {
        activeExpandedDate = dateIso;
        const overlay = document.getElementById('drawer-day-expanded-overlay');
        const title = document.getElementById('drawer-day-title');
        const subtitle = document.getElementById('drawer-day-subtitle');
        const list = document.getElementById('drawer-day-lessons-list');
        const addBtn = document.getElementById('btn-drawer-add-lesson-to-day');

        if (!overlay || !list) return;

        const formattedDate = dateIso.split('-').reverse().join('/');
        if (title) title.textContent = `Aulas do Dia: ${formattedDate}`;
        if (subtitle) subtitle.textContent = currentTurmaContext;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const dayLessons = allLessons.filter(l => l.turmaContext === currentTurmaContext && l.date === dateIso);
        const todayStr = '2026-08-18';

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
                const isAtrasada = les.status === 'planejada' && les.date < todayStr;
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
                        <span class="badge ${les.status === 'trabalhada' ? 'badge-success' : (isAtrasada ? 'badge-danger' : 'badge-warning')}">
                            ${isAtrasada ? '⚠️ Atrasada / Pendente' : (les.status === 'trabalhada' ? 'Trabalhada' : 'Planejada')}
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

    // =========================================================================
    // MODAL DE PROGRESSO DETALHADO POR DISCIPLINA & LACUNAS
    // =========================================================================

    function openDetailedProgressModal() {
        const modal = document.getElementById('modal-detailed-progress');
        const turmaLabel = document.getElementById('modal-progress-turma-label');
        const body = document.getElementById('modal-detailed-progress-body');
        if (!modal || !body) return;

        if (turmaLabel) turmaLabel.textContent = currentTurmaContext;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurmaContext);

        const disciplines = ['Língua Portuguesa', 'Matemática', 'Ciências da Natureza'];
        let html = '';

        disciplines.forEach(disc => {
            const discLessons = turmaLessons.filter(l => l.disciplina.includes(disc) || disc.includes(l.disciplina));
            const total = discLessons.length;
            const trab = discLessons.filter(l => l.status === 'trabalhada').length;
            const pct = total > 0 ? Math.round((trab / total) * 100) : 0;
            const lacunas = discLessons.filter(l => l.status === 'planejada').map(l => l.habilidadeCode);

            html += `
                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 0.95rem; color: var(--text-primary);">${disc}</strong>
                        <span style="font-weight: 800; font-size: 0.9rem; color: #6366f1;">${trab} de ${total} aulas (${pct}%)</span>
                    </div>
                    <div class="progress-bar-container" style="height: 10px; margin-bottom: 10px;">
                        <div class="progress-bar purple" style="width: ${pct}%;"></div>
                    </div>
                    ${lacunas.length > 0 ? `
                        <div style="font-size: 0.78rem; color: var(--text-secondary);">
                            <strong>Habilidades Pendentes (Lacunas):</strong>
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                                ${lacunas.map(lac => `<span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">${lac}</span>`).join('')}
                            </div>
                        </div>
                    ` : `<div style="font-size: 0.78rem; color: #10b981; font-weight: 700;">✓ Todas as habilidades planejadas foram consolidadas!</div>`}
                </div>
            `;
        });

        body.innerHTML = html;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeDetailedProgressModal() {
        const modal = document.getElementById('modal-detailed-progress');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    // =========================================================================
    // REAGENDAMENTO RÁPIDO & TOGGLE DE STATUS
    // =========================================================================

    function handleLessonDropToDate(lessonId, targetDateIso) {
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const oldDate = lesson.date;
        lesson.date = targetDateIso;
        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }
        renderActiveScheduleView();
        if (typeof window.showToast === 'function') {
            window.showToast(`Aula reagendada de ${oldDate.split('-').reverse().join('/')} para ${targetDateIso.split('-').reverse().join('/')}!`, 'success');
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
        renderActiveScheduleView();
        if (typeof window.showToast === 'function') {
            window.showToast(`Aula reagendada para ${targetDateIso.split('-').reverse().join('/')} às ${targetTime}!`, 'success');
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
        if (drawer && drawer.style.display !== 'none') {
            openDayExpandedDrawer(lesson.date || lesson.data_planejada);
        }
        renderActiveScheduleView();

        if (typeof window.showToast === 'function') {
            window.showToast(`Status alterado para "${lesson.status.toUpperCase()}"${isNowTrabalhada ? ' (Confirmada em ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ')' : ''}!`, isNowTrabalhada ? 'success' : 'info');
        }
    }

    // Exposição no Window
    window.handleTurmaContextChange = handleTurmaContextChange;
    window.switchScheduleMainView = switchScheduleMainView;
    window.renderActiveScheduleView = renderActiveScheduleView;
    window.renderScheduleMonthlyCalendar = renderScheduleMonthlyCalendar;
    window.renderScheduleWeeklyTimetable = renderScheduleWeeklyTimetable;
    window.renderScheduleComparisonView = renderScheduleComparisonView;
    window.openDayExpandedDrawer = openDayExpandedDrawer;
    window.closeDayExpandedDrawer = closeDayExpandedDrawer;
    window.openDetailedProgressModal = openDetailedProgressModal;
    window.closeDetailedProgressModal = closeDetailedProgressModal;
    window.handleLessonDropToDate = handleLessonDropToDate;
    window.handleLessonDropToSlot = handleLessonDropToSlot;
    window.toggleLessonWorkStatus = toggleLessonWorkStatus;

})(window, document);
