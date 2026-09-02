/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (TRASH & DUPLICATION)
 * Arquivo: js/modules/cronograma/cronograma_trash.js
 * Descrição: Duplicação de planos de rotina pedagógica entre turmas,
 *            busca de habilidades agendadas e lixeira com restauração e expiração (30 dias).
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    // =========================================================================
    // BUSCA DE HABILIDADES NO CRONOGRAMA
    // =========================================================================

    function handleScheduleSkillSearch() {
        const input = document.getElementById('schedule-skill-search-input');
        const results = document.getElementById('schedule-skill-search-results');
        if (!input || !results) return;

        const query = input.value.trim().toLowerCase();
        if (!query) {
            results.style.display = 'none';
            return;
        }

        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const matches = allLessons.filter(l => {
            if (l.turmaContext !== currentTurma) return false;
            const str = (l.habilidadeCode + ' ' + l.habilidadeDesc + ' ' + l.disciplina).toLowerCase();
            return str.includes(query);
        });

        if (matches.length === 0) {
            results.innerHTML = '<div style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">Nenhuma aula agendada com esta habilidade.</div>';
        } else {
            results.innerHTML = matches.map(m => `
                <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-color); cursor: pointer; font-size: 0.8rem;"
                     onclick="if(window.openDayExpandedDrawer) window.openDayExpandedDrawer('${m.date}'); document.getElementById('schedule-skill-search-results').style.display='none';">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #6366f1;">${m.habilidadeCode}</strong>
                        <span style="font-size: 0.72rem; color: var(--text-muted);">Data: ${m.date.split('-').reverse().join('/')}</span>
                    </div>
                    <div style="color: var(--text-primary); font-size: 0.75rem; margin-top: 2px;">${m.disciplina} - ${m.habilidadeDesc.slice(0, 65)}...</div>
                </div>
            `).join('');
        }
        results.style.display = 'block';
    }

    // =========================================================================
    // DUPLICAÇÃO DE ROTINA PARA OUTRA TURMA
    // =========================================================================

    function openDuplicateLessonModal(lessonId) {
        const modal = document.getElementById('modal-duplicate-lesson');
        const inputId = document.getElementById('duplicate-source-lesson-id');
        const info = document.getElementById('duplicate-lesson-info');
        if (!modal || !inputId) return;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        inputId.value = lessonId;
        if (info) {
            info.innerHTML = `
                <div><strong>${lesson.habilidadeCode}</strong> - ${lesson.disciplina}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Origem: ${lesson.turmaContext} • Data: ${lesson.date.split('-').reverse().join('/')}</div>
            `;
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeDuplicateLessonModal() {
        const modal = document.getElementById('modal-duplicate-lesson');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleConfirmDuplicateLesson() {
        const inputId = document.getElementById('duplicate-source-lesson-id');
        const selectTarget = document.getElementById('duplicate-target-turma-select');
        if (!inputId || !selectTarget) return;

        const sourceId = inputId.value;
        const targetTurma = selectTarget.value;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const source = allLessons.find(l => l.id === sourceId);
        if (!source) return;

        const newLesson = Object.assign({}, source, {
            id: 'les_' + Date.now(),
            turmaContext: targetTurma,
            turma: targetTurma.split('—')[1]?.trim() || 'Turma Paralela',
            escola: targetTurma.split('—')[0]?.trim() || source.escola,
            status: 'planejada',
            criadoPor: 'Profa. Silvana Ferreira (Duplicado de ' + source.turmaContext + ')',
            createdAt: new Date().toISOString()
        });

        allLessons.push(newLesson);
        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }
        closeDuplicateLessonModal();
        if (typeof window.closeDayExpandedDrawer === 'function') {
            window.closeDayExpandedDrawer();
        }
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`Plano duplicado com sucesso para "${targetTurma}"!`, 'success');
        }
    }

    // =========================================================================
    // EXCLUSÃO SEGURA & LIXEIRA PEDAGÓGICA (30 DIAS)
    // =========================================================================

    function handleDeleteLessonWithTrash(lessonId) {
        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const trash = typeof window.getScheduleTrashDb === 'function' ? window.getScheduleTrashDb() : [];
        const trashItem = Object.assign({}, lesson, {
            deletedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        trash.push(trashItem);
        if (typeof window.saveScheduleTrashDb === 'function') {
            window.saveScheduleTrashDb(trash);
        }

        const updated = allLessons.filter(l => l.id !== lessonId);
        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(updated);
        }

        if (typeof window.closeDayExpandedDrawer === 'function') {
            window.closeDayExpandedDrawer();
        }
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`Aula movida para a Lixeira.`, 'info');
        }
    }

    function openScheduleTrashModal() {
        const modal = document.getElementById('modal-schedule-trash');
        const list = document.getElementById('schedule-trash-items-list');
        if (!modal || !list) return;

        // Auto-cleanup de itens com mais de 30 dias
        if (typeof window.cleanupExpiredTrash === 'function') {
            window.cleanupExpiredTrash(30);
        }

        const trash = typeof window.getScheduleTrashDb === 'function' ? window.getScheduleTrashDb() : [];
        list.innerHTML = '';

        if (trash.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">🗑️</div>
                    <p style="font-size: 0.85rem; margin: 0;">A lixeira está vazia.</p>
                </div>
            `;
        } else {
            trash.forEach(les => {
                const card = document.createElement('div');
                card.style.background = 'var(--bg-primary)';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-sm)';
                card.style.padding = '12px 14px';
                card.style.display = 'flex';
                card.style.justifyContent = 'space-between';
                card.style.alignItems = 'center';
                card.style.gap = '10px';

                const delDate = les.deletedAt ? new Date(les.deletedAt).toLocaleDateString('pt-BR') : 'Recente';

                card.innerHTML = `
                    <div>
                        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">
                            <strong style="color: #6366f1;">${les.habilidadeCode}</strong> - ${les.disciplina}
                        </div>
                        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                            ${les.turmaContext} • Data da aula: ${les.date.split('-').reverse().join('/')} • Excluído em: ${delDate}
                        </div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button type="button" onclick="handleRestoreTrashLesson('${les.id}');" class="btn btn-outline btn-sm" style="font-size: 0.72rem; font-weight: 700; color: #10b981; border-color: #10b981;">
                            Restaurar
                        </button>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeScheduleTrashModal() {
        const modal = document.getElementById('modal-schedule-trash');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleRestoreTrashLesson(lessonId) {
        const trash = typeof window.getScheduleTrashDb === 'function' ? window.getScheduleTrashDb() : [];
        const itemToRestore = trash.find(l => l.id === lessonId);
        if (!itemToRestore) return;

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
        const restored = Object.assign({}, itemToRestore);
        delete restored.deletedAt;
        delete restored.expiresAt;

        allLessons.push(restored);
        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }

        const updatedTrash = trash.filter(l => l.id !== lessonId);
        if (typeof window.saveScheduleTrashDb === 'function') {
            window.saveScheduleTrashDb(updatedTrash);
        }

        openScheduleTrashModal();
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`Aula restaurada com sucesso para o cronograma!`, 'success');
        }
    }

    function handleEmptyScheduleTrash() {
        const trash = typeof window.getScheduleTrashDb === 'function' ? window.getScheduleTrashDb() : [];
        if (trash.length === 0) return;

        if (typeof confirm === 'function' && !confirm('Tem certeza que deseja esvaziar a lixeira permanentemente? Essa ação não pode ser desfeita.')) return;

        if (typeof window.saveScheduleTrashDb === 'function') {
            window.saveScheduleTrashDb([]);
        }
        openScheduleTrashModal();
        if (typeof window.showToast === 'function') {
            window.showToast('Lixeira esvaziada permanentemente.', 'info');
        }
    }

    // Exposição Global
    window.handleScheduleSkillSearch = handleScheduleSkillSearch;
    window.openDuplicateLessonModal = openDuplicateLessonModal;
    window.closeDuplicateLessonModal = closeDuplicateLessonModal;
    window.handleConfirmDuplicateLesson = handleConfirmDuplicateLesson;
    window.handleDeleteLessonWithTrash = handleDeleteLessonWithTrash;
    window.openScheduleTrashModal = openScheduleTrashModal;
    window.closeScheduleTrashModal = closeScheduleTrashModal;
    window.handleRestoreTrashLesson = handleRestoreTrashLesson;
    window.handleEmptyScheduleTrash = handleEmptyScheduleTrash;

})(window, document);
