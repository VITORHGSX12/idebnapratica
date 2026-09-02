/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (PROGRESSO DETALHADO)
 * Arquivo: js/modules/cronograma/cronograma_progress_modal.js
 * Descrição: Modal de acompanhamento acumulado de progresso por disciplina,
 *            consumindo exclusivamente calculateScheduleProgress.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    function openDetailedProgressModal() {
        const modal = document.getElementById('modal-detailed-progress');
        const turmaLabel = document.getElementById('modal-progress-turma-label');
        const body = document.getElementById('modal-detailed-progress-body');
        if (!modal || !body) return;

        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        if (turmaLabel) turmaLabel.textContent = currentTurma;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurma);

        const todayStr = typeof window.getScheduleReferenceToday === 'function' 
            ? window.getScheduleReferenceToday() 
            : new Date().toISOString().split('T')[0];

        // Fonte única da verdade
        const overallProgress = typeof window.calculateScheduleProgress === 'function'
            ? window.calculateScheduleProgress(turmaLessons, todayStr)
            : { total: 0, trabalhadas: 0, atrasadas: 0, pct: 0, bySubject: {} };

        const disciplines = ['Língua Portuguesa', 'Matemática', 'Ciências da Natureza'];
        let html = '';

        disciplines.forEach(disc => {
            const sub = overallProgress.bySubject[disc] || { total: 0, trabalhadas: 0, atrasadas: 0, pct: 0, lacunas: [] };

            html += `
                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 0.95rem; color: var(--text-primary);">${disc}</strong>
                        <span style="font-weight: 800; font-size: 0.9rem; color: #6366f1;">${sub.trabalhadas} de ${sub.total} aulas (${sub.pct}%)</span>
                    </div>
                    <div class="progress-bar-container" style="height: 10px; margin-bottom: 10px;">
                        <div class="progress-bar purple" style="width: ${sub.pct}%;"></div>
                    </div>
                    ${sub.lacunas && sub.lacunas.length > 0 ? `
                        <div style="font-size: 0.78rem; color: var(--text-secondary);">
                            <strong>Habilidades Pendentes (Lacunas):</strong>
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                                ${sub.lacunas.map(lac => `<span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">${lac}</span>`).join('')}
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

    window.openDetailedProgressModal = openDetailedProgressModal;
    window.closeDetailedProgressModal = closeDetailedProgressModal;

})(window, document);
