/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (COORDINATOR, INIT & EXPORTS)
 * Arquivo: js/modules/cronograma/cronograma.js
 * Descrição: Orquestrador principal do módulo de Cronograma e Rotina de
 *            Habilidades IDEB / SAEB. Integra State, Views, Planner,
 *            Exportação oficial em PDF Timbrado A4 e WhatsApp.
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

        if (typeof window.initScheduleTurmaContext === 'function') {
            window.initScheduleTurmaContext();
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

    /**
     * Exporta o Plano Semanal / Mensal em PDF Timbrado A4 Oficial da SEMED
     */
    function handlePrintScheduleReport() {
        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const teacherLabel = (document.getElementById('schedule-active-teacher-label')?.textContent || 'Profa. Silvana Ferreira').replace('• Responsável: ', '');
        const periodDisplay = document.getElementById('schedule-period-display')?.textContent.trim() || 'Agosto de 2026';
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const todayStr = typeof window.getScheduleReferenceToday === 'function' ? window.getScheduleReferenceToday() : new Date().toISOString().split('T')[0];

        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurma);
        const progress = typeof window.calculateScheduleProgress === 'function'
            ? window.calculateScheduleProgress(turmaLessons, todayStr)
            : { total: turmaLessons.length, trabalhadas: 0, atrasadas: 0, pct: 0 };

        const printWin = window.open('', '_blank', 'width=900,height=960');
        if (!printWin) {
            window.print();
            return;
        }

        const rowsHtml = turmaLessons.map((les, idx) => {
            const computed = typeof window.getLessonComputedStatus === 'function'
                ? window.getLessonComputedStatus(les, todayStr)
                : les.status;
            const statusLabel = computed === 'trabalhada' ? 'Concluída' : (computed === 'atrasada' ? 'Em Atraso' : 'Planejada');
            const statusColor = computed === 'trabalhada' ? '#10b981' : (computed === 'atrasada' ? '#ef4444' : '#f59e0b');
            const dateFormatted = les.date ? les.date.split('-').reverse().join('/') : '-';

            return `
                <tr>
                    <td style="text-align:center; font-weight:700;">${idx + 1}</td>
                    <td style="text-align:center;">${dateFormatted}<br><span style="font-size:10px; color:#64748b;">${les.time || '07:30'}</span></td>
                    <td><strong>${les.disciplina}</strong></td>
                    <td><strong style="color:#4338ca;">[${les.habilidadeCode || 'BNCC'}]</strong> ${les.habilidadeDesc || les.title || 'Conteúdo Programático'}</td>
                    <td style="font-size:11px; color:#475569;">${les.metodologia || 'Aulas expositivas e resolução comentada'}</td>
                    <td style="text-align:center; font-weight:700; color:${statusColor};">${statusLabel}</td>
                </tr>
            `;
        }).join('');

        const doc = `
            <!DOCTYPE html><html><head><meta charset="utf-8"><title>Plano de Aulas - ${currentTurma}</title>
            <style>
                @page { size: A4 landscape; margin: 12mm; }
                body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; padding: 18px; font-size: 12px; line-height: 1.4; }
                .header { border-bottom: 2px solid #6366f1; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
                .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
                .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px; text-align: center; }
                .kpi-val { font-size: 16px; font-weight: 800; color: #4338ca; }
                table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
                th { background: #f1f5f9; padding: 7px 8px; text-align: left; font-weight: 700; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; font-size: 10px; color: #475569; }
                td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                .signatures { margin-top: 30px; display: flex; justify-content: space-between; gap: 30px; }
                .sig-line { border-top: 1px solid #94a3b8; text-align: center; padding-top: 4px; font-size: 10px; width: 45%; color: #475569; }
                @media print { body { padding: 0; } }
            </style></head><body>
                <div class="header">
                    <div>
                        <h2 style="margin:0; font-size:15px; color:#0f172a;">PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA</h2>
                        <h3 style="margin:2px 0 0 0; font-size:12px; color:#4338ca;">SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED</h3>
                        <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">Plano Curricular e Cronograma Semanal de Habilidades • IDEB na Prática</p>
                    </div>
                    <div style="text-align:right; font-size:11px; color:#64748b;">
                        <strong>Turma:</strong> ${currentTurma}<br>
                        <strong>Docente:</strong> ${teacherLabel}<br>
                        <strong>Período:</strong> ${periodDisplay}
                    </div>
                </div>
                <div class="kpi-grid">
                    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">TOTAL DE AULAS</div><div class="kpi-val">${progress.total}</div></div>
                    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">AULAS TRABALHADAS</div><div class="kpi-val" style="color:#10b981;">${progress.trabalhadas}</div></div>
                    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">AULAS EM ATRASO</div><div class="kpi-val" style="color:#ef4444;">${progress.atrasadas}</div></div>
                    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">TAXA DE CUMPRIMENTO</div><div class="kpi-val" style="color:#6366f1;">${progress.pct}%</div></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:30px; text-align:center;">Nº</th>
                            <th style="width:85px; text-align:center;">Data/Horário</th>
                            <th style="width:130px;">Disciplina</th>
                            <th>Habilidade BNCC / Descritor SAEB</th>
                            <th>Metodologia & Objetivos</th>
                            <th style="width:90px; text-align:center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml || '<tr><td colspan="6" style="text-align:center; padding:20px;">Nenhuma aula programada neste período.</td></tr>'}</tbody>
                </table>
                <div class="signatures">
                    <div class="sig-line">Docente Regente: ${teacherLabel}</div>
                    <div class="sig-line">Coordenação Pedagógica / Direção Escolar</div>
                </div>
                <script>window.onload = function() { window.print(); };<\/script>
            </body></html>
        `;

        printWin.document.open();
        printWin.document.write(doc);
        printWin.document.close();

        if (typeof window.showToast === 'function') {
            window.showToast('Plano de Aulas em PDF gerado com sucesso!', 'printer');
        }
    }

    /**
     * Copia Resumo da Semana formatado para WhatsApp dos Professores
     */
    function handleCopyScheduleWhatsApp() {
        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const teacherLabel = (document.getElementById('schedule-active-teacher-label')?.textContent || 'Profa. Silvana Ferreira').replace('• Responsável: ', '');
        const periodDisplay = document.getElementById('schedule-period-display')?.textContent.trim() || 'Agosto de 2026';
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const todayStr = typeof window.getScheduleReferenceToday === 'function' ? window.getScheduleReferenceToday() : new Date().toISOString().split('T')[0];

        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurma);
        const progress = typeof window.calculateScheduleProgress === 'function'
            ? window.calculateScheduleProgress(turmaLessons, todayStr)
            : { total: turmaLessons.length, trabalhadas: 0, atrasadas: 0, pct: 0 };

        const text = [
            '📅 *PLANEJAMENTO SEMANAL DE AULAS — IDEB NA PRÁTICA*',
            '🏛️ *SEMED Gonçalves Dias - MA*',
            '',
            '🏫 *Turma:* ' + currentTurma,
            '👩‍🏫 *Docente:* ' + teacherLabel,
            '🗓️ *Período:* ' + periodDisplay,
            '',
            '📊 *INDICADORES DE CUMPRIMENTO:*',
            '✅ *Aulas Trabalhadas:* ' + progress.trabalhadas + '/' + progress.total + ' (' + progress.pct + '%)',
            (progress.atrasadas > 0 ? '⚠️ *Aulas em Atraso (Reposição):* ' + progress.atrasadas : '🎯 *Status:* Cronograma rigorosamente em dia!'),
            '',
            '🌐 *Acesse o painel completo:* ' + (typeof window !== 'undefined' ? window.location.origin : 'https://idebnapratica.goncalvesdias.ma.gov.br')
        ].join('\n');

        const nav = (typeof window !== 'undefined' && window.navigator) ? window.navigator : (typeof navigator !== 'undefined' ? navigator : null);
        if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') {
            nav.clipboard.writeText(text).then(function() {
                if (typeof window.showToast === 'function') window.showToast('Resumo da semana copiado para o WhatsApp!', 'check-circle');
            }).catch(function() {
                if (typeof window.showToast === 'function') window.showToast('Resumo preparado para envio!', 'check-circle');
            });
        } else {
            if (typeof window.showToast === 'function') window.showToast('Resumo preparado para envio!', 'check-circle');
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
    window.handlePrintScheduleReport = handlePrintScheduleReport;
    window.handleCopyScheduleWhatsApp = handleCopyScheduleWhatsApp;

})(window, document);
