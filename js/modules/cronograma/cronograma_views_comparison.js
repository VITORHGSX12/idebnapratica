/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (VISÃO COMPARATIVO ENTRE TURMAS)
 * Arquivo: js/modules/cronograma/cronograma_views_comparison.js
 * Descrição: Comparativo pedagógico lado a lado entre turmas da rede,
 *            consumindo a fonte única da verdade para progresso e lacunas.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

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
        const todayStr = typeof window.getScheduleReferenceToday === 'function' ? window.getScheduleReferenceToday() : new Date().toISOString().split('T')[0];

        function buildColumnHtml(turmaName, lessons, accentColor) {
            const prog = typeof window.calculateScheduleProgress === 'function'
                ? window.calculateScheduleProgress(lessons, todayStr)
                : { total: lessons.length, trabalhadas: 0, atrasadas: 0, pct: 0, bySubject: {} };

            const lp = prog.bySubject['Língua Portuguesa'] || { total: 0, trabalhadas: 0 };
            const mt = prog.bySubject['Matemática'] || { total: 0, trabalhadas: 0 };
            const ci = prog.bySubject['Ciências da Natureza'] || { total: 0, trabalhadas: 0 };

            return `
                <div class="comparison-column-card">
                    <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                        <span style="font-size: 0.72rem; font-weight: 800; color: ${accentColor}; text-transform: uppercase;">TURMA ANALISADA</span>
                        <h4 style="margin: 2px 0 0 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">${turmaName}</h4>
                    </div>

                    <!-- Métricas Principais -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center; margin: 12px 0;">
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">COBERTURA</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: ${accentColor};">${prog.pct}%</div>
                        </div>
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">TRABALHADAS</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: #10b981;">${prog.trabalhadas}/${prog.total}</div>
                        </div>
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">ATRASOS</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: ${prog.atrasadas > 0 ? '#ef4444' : '#10b981'};">${prog.atrasadas}</div>
                        </div>
                    </div>

                    <!-- Progresso por Componente Curricular -->
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">Progresso por Disciplina:</div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Língua Portuguesa</span>
                                <strong>${lp.trabalhadas} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar purple" style="width: ${prog.total > 0 ? (lp.trabalhadas / prog.total) * 100 : 0}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Matemática</span>
                                <strong>${mt.trabalhadas} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar blue" style="width: ${prog.total > 0 ? (mt.trabalhadas / prog.total) * 100 : 0}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Ciências da Natureza</span>
                                <strong>${ci.trabalhadas} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar green" style="width: ${prog.total > 0 ? (ci.trabalhadas / prog.total) * 100 : 0}%;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Lista de Habilidades Agendadas -->
                    <div style="flex: 1; border-top: 1px solid var(--border-color); padding-top: 10px; margin-top: 10px;">
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

    window.renderScheduleComparisonView = renderScheduleComparisonView;

})(window, document);
