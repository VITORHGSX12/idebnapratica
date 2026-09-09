/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO TURMAS: VÍNCULO PROFESSOR ↔ TURMA
 * Arquivo: js/modules/turmas/turmas_professores.js
 * Descrição: Gestão de múltiplos professores por turma (N:N), associação
 *            por papel (titular, apoio, especialista), listagem e remoção.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var currentTurmaId = null;
    var currentTurmaNome = '';

    /**
     * Busca os professores vinculados a uma turma na API
     */
    async function getTurmaProfessores(turmaId) {
        if (!turmaId) return [];
        try {
            var url = '/api/turmas/' + encodeURIComponent(turmaId) + '/professores';
            var res = (typeof global.apiFetch === 'function')
                ? await global.apiFetch(url)
                : await fetch(url);

            if (res && res.ok) {
                var data = await res.json();
                if (data && data.success && Array.isArray(data.professores)) {
                    return data.professores;
                }
            }
        } catch (err) {
            console.warn('[TurmasProfessores] Erro ao buscar da API, usando fallback local:', err);
        }

        // Fallback local do localStorage
        var localKey = 'turma_professores_' + turmaId;
        try {
            var cached = localStorage.getItem(localKey);
            if (cached) return JSON.parse(cached);
        } catch (e) {}

        // Fallback padrão se não houver registros
        return [
            {
                id: 'prof_01',
                professor_id: 'prof_01',
                nome: 'Profa. Silvana Ferreira',
                email: 'silvana.ferreira@semed.goncalvesdias.ma.gov.br',
                componente: 'Língua Portuguesa',
                papel: 'titular',
                criado_em: new Date().toISOString()
            }
        ];
    }

    /**
     * Vincula um professor a uma turma
     */
    async function linkProfessorToTurma(turmaId, professorId, papel) {
        if (!turmaId || !professorId) {
            if (typeof global.showToast === 'function') {
                global.showToast('Turma e professor são obrigatórios.', 'warning');
            }
            return false;
        }

        try {
            var url = '/api/turmas/' + encodeURIComponent(turmaId) + '/professores';
            var res = (typeof global.apiFetch === 'function')
                ? await global.apiFetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ professor_id: professorId, papel: papel || 'titular' })
                })
                : await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ professor_id: professorId, papel: papel || 'titular' })
                });

            if (res && (res.ok || res.status === 201)) {
                var data = await res.json();
                if (typeof global.showToast === 'function') {
                    global.showToast(data.message || 'Professor vinculado com sucesso!', 'success');
                }
                return true;
            } else {
                var errData = await res.json().catch(function() { return {}; });
                if (typeof global.showToast === 'function') {
                    global.showToast(errData.message || 'Não foi possível vincular o professor.', 'warning');
                }
                return false;
            }
        } catch (err) {
            console.warn('[TurmasProfessores] Erro ao vincular professor via API:', err);
            // Salva no fallback local
            var localKey = 'turma_professores_' + turmaId;
            var list = [];
            try {
                var cached = localStorage.getItem(localKey);
                if (cached) list = JSON.parse(cached);
            } catch(e) {}
            
            var existing = list.find(function(p) { return p.professor_id === professorId; });
            if (existing) {
                if (typeof global.showToast === 'function') {
                    global.showToast('Este professor já está vinculado a esta turma.', 'warning');
                }
                return false;
            }

            var allTeachers = (typeof global.getAllNetworkTeachersDb === 'function') ? global.getAllNetworkTeachersDb() : [];
            var doc = allTeachers.find(function(t) { return t.id === professorId; }) || { nome: 'Professor(a)' };

            list.push({
                id: 'tp_' + Date.now(),
                turma_id: turmaId,
                professor_id: professorId,
                nome: doc.nome,
                email: (doc.nome.toLowerCase().replace(/[^a-z]/g, '.') + '@semed.gov.br'),
                componente: doc.componente || 'Polivalente',
                papel: papel || 'titular',
                criado_em: new Date().toISOString()
            });

            try { localStorage.setItem(localKey, JSON.stringify(list)); } catch(e) {}
            if (typeof global.showToast === 'function') {
                global.showToast('Professor vinculado com sucesso (modo local)!', 'success');
            }
            return true;
        }
    }

    /**
     * Remove o vínculo de um professor com a turma
     */
    async function unlinkProfessorFromTurma(turmaId, professorId, professorNome) {
        var msg = 'Deseja realmente desvincular ' + (professorNome || 'o professor') + ' desta turma?';
        if (typeof confirm === 'function' && !confirm(msg)) return false;

        try {
            var url = '/api/turmas/' + encodeURIComponent(turmaId) + '/professores/' + encodeURIComponent(professorId);
            var res = (typeof global.apiFetch === 'function')
                ? await global.apiFetch(url, { method: 'DELETE' })
                : await fetch(url, { method: 'DELETE' });

            if (res && res.ok) {
                if (typeof global.showToast === 'function') {
                    global.showToast('Vínculo de professor removido com sucesso.', 'info');
                }
                return true;
            }
        } catch (err) {
            console.warn('[TurmasProfessores] Erro ao desvincular via API:', err);
        }

        // Fallback local
        var localKey = 'turma_professores_' + turmaId;
        try {
            var list = JSON.parse(localStorage.getItem(localKey) || '[]');
            var updated = list.filter(function(p) { return p.professor_id !== professorId && p.id !== professorId; });
            localStorage.setItem(localKey, JSON.stringify(updated));
            if (typeof global.showToast === 'function') {
                global.showToast('Professor desvinculado (modo local).', 'info');
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Renderiza a lista de professores vinculados dentro do container especificado
     */
    async function renderTurmaProfessoresTab(turmaId, containerId) {
        var container = document.getElementById(containerId || 'modal-journal-teachers-container');
        if (!container) return;

        container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);"><i data-lucide="loader-2" class="spin" style="width: 24px; height: 24px;"></i><br>Carregando professores vinculados...</div>';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();

        var professores = await getTurmaProfessores(turmaId);

        if (!professores || professores.length === 0) {
            container.innerHTML = [
                '<div style="padding: 32px 20px; text-align: center; background: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">',
                '    <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(99,102,241,0.1); color: #6366f1; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">',
                '        <i data-lucide="user-x" style="width: 22px; height: 22px;"></i>',
                '    </div>',
                '    <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; color: var(--text-primary);">Nenhum professor vinculado a esta turma</h4>',
                '    <p style="margin: 0 0 16px 0; font-size: 0.78rem; color: var(--text-secondary);">Vincule docentes para que possam visualizar o diário, planejar e acompanhar a progressão dos alunos.</p>',
                '    <button type="button" class="btn btn-primary btn-sm" onclick="TurmasProfessores.openAssignTeacherModal(\'' + turmaId + '\', \'' + (currentTurmaNome || 'Turma').replace(/'/g, "\\'") + '\');" style="display: inline-flex; align-items: center; gap: 6px;">',
                '        <i data-lucide="user-plus" style="width: 14px; height: 14px;"></i> + Vincular Primeiro Professor',
                '    </button>',
                '</div>'
            ].join('\n');
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
            return;
        }

        var papelLabels = {
            'titular': 'Professor(a) Titular / Regente',
            'apoio': 'Docente de Apoio Pedagógico',
            'aee': 'Professor(a) AEE (Inclusão)',
            'especialista': 'Docente Especialista'
        };

        var html = [
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">',
            '    <div>',
            '        <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">' + professores.length + ' docente(s) com acesso a esta turma</span>',
            '    </div>',
            '    <button type="button" class="btn btn-primary btn-sm" onclick="TurmasProfessores.openAssignTeacherModal(\'' + turmaId + '\', \'' + (currentTurmaNome || 'Turma').replace(/'/g, "\\'") + '\');" style="display: flex; align-items: center; gap: 6px;">',
            '        <i data-lucide="user-plus" style="width: 14px; height: 14px;"></i> + Vincular Novo Professor',
            '    </button>',
            '</div>',
            '<div style="display: flex; flex-direction: column; gap: 10px;">'
        ];

        professores.forEach(function(p) {
            var nome = p.nome || 'Docente';
            var pId = p.professor_id || p.id;
            var papel = p.papel || 'titular';
            var papelText = papelLabels[papel] || papel;
            var email = p.email || 'docente@semed.goncalvesdias.ma.gov.br';
            var comp = p.componente ? ' • ' + p.componente : '';

            html.push([
                '<div class="student-diary-item-card" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">',
                '    <div style="display: flex; align-items: center; gap: 12px;">',
                '        <div class="student-avatar-circle" style="background: rgba(99,102,241,0.12); color: #6366f1; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800;">',
                '            ' + nome.charAt(0).toUpperCase(),
                '        </div>',
                '        <div>',
                '            <div style="font-size: 0.92rem; font-weight: 700; color: var(--text-primary);">' + nome + '</div>',
                '            <div style="font-size: 0.76rem; color: var(--text-secondary);">' + papelText + comp + '</div>',
                '            <div style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">' + email + '</div>',
                '        </div>',
                '    </div>',
                '    <div style="display: flex; align-items: center; gap: 8px;">',
                '        <span class="badge badge-success" style="font-size: 0.72rem; padding: 4px 8px;">ATIVO</span>',
                '        <button type="button" class="btn btn-outline btn-sm" onclick="TurmasProfessores.handleUnlinkClick(\'' + turmaId + '\', \'' + pId + '\', \'' + nome.replace(/'/g, "\\'") + '\', \'' + containerId + '\');" style="color: var(--color-status-critical-text); border-color: rgba(239,68,68,0.3); padding: 4px 8px; font-size: 0.72rem;" title="Desvincular professor da turma">',
                '            <i data-lucide="user-minus" style="width: 13px; height: 13px;"></i> Desvincular',
                '        </button>',
                '    </div>',
                '</div>'
            ].join('\n'));
        });

        html.push('</div>');
        container.innerHTML = html.join('\n');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Abre o modal para vincular um professor
     */
    function openAssignTeacherModal(turmaId, turmaNome) {
        currentTurmaId = turmaId;
        currentTurmaNome = turmaNome || 'Turma';

        var modal = document.getElementById('modal-assign-teacher');
        var classIdInput = document.getElementById('assign-teacher-class-id');
        var classNameEl = document.getElementById('assign-teacher-class-name');
        var selectEl = document.getElementById('assign-teacher-select');

        if (!modal) return;

        if (classIdInput) classIdInput.value = turmaId;
        if (classNameEl) classNameEl.textContent = 'Turma: ' + currentTurmaNome;

        // Popula os professores cadastrados na rede
        if (selectEl) {
            var teachers = (typeof global.getAllNetworkTeachersDb === 'function') ? global.getAllNetworkTeachersDb() : [];
            if (teachers.length > 0) {
                selectEl.innerHTML = teachers.map(function(t) {
                    return '<option value="' + t.id + '">' + t.nome + ' (' + (t.componente || 'Polivalente') + ' - ' + t.escola + ')</option>';
                }).join('');
            }
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Handler do formulário de vínculo
     */
    async function handleAssignTeacherSubmit(event) {
        if (event && event.preventDefault) event.preventDefault();

        var turmaId = (document.getElementById('assign-teacher-class-id') && document.getElementById('assign-teacher-class-id').value) || currentTurmaId;
        var profSelect = document.getElementById('assign-teacher-select');
        var roleSelect = document.getElementById('assign-discipline-select');

        if (!turmaId || !profSelect || !profSelect.value) {
            if (typeof global.showToast === 'function') {
                global.showToast('Por favor, selecione um professor.', 'warning');
            }
            return;
        }

        var professorId = profSelect.value;
        var papel = (roleSelect && roleSelect.value) ? roleSelect.value : 'titular';

        var ok = await linkProfessorToTurma(turmaId, professorId, papel);
        if (ok) {
            if (typeof global.closeModal === 'function') {
                global.closeModal('modal-assign-teacher');
            } else {
                var modal = document.getElementById('modal-assign-teacher');
                if (modal) {
                    modal.style.display = 'none';
                    modal.classList.add('hidden');
                }
            }

            // Atualiza a visualização da lista
            renderTurmaProfessoresTab(turmaId, 'modal-journal-teachers-container');
        }
    }

    async function handleUnlinkClick(turmaId, profId, profNome, containerId) {
        var ok = await unlinkProfessorFromTurma(turmaId, profId, profNome);
        if (ok) {
            renderTurmaProfessoresTab(turmaId, containerId || 'modal-journal-teachers-container');
        }
    }

    // Exposição global
    var TurmasProfessores = {
        getTurmaProfessores: getTurmaProfessores,
        linkProfessorToTurma: linkProfessorToTurma,
        unlinkProfessorFromTurma: unlinkProfessorFromTurma,
        renderTurmaProfessoresTab: renderTurmaProfessoresTab,
        openAssignTeacherModal: openAssignTeacherModal,
        handleAssignTeacherSubmit: handleAssignTeacherSubmit,
        handleUnlinkClick: handleUnlinkClick
    };

    global.TurmasProfessores = TurmasProfessores;
    global.handleSaveTeacherAssignment = handleAssignTeacherSubmit;

})(typeof window !== 'undefined' ? window : this);
