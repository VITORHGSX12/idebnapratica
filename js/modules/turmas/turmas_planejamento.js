/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO TURMAS: PLANEJAMENTO PEDAGÓGICO
 * Arquivo: js/modules/turmas/turmas_planejamento.js
 * Descrição: Planejamento pedagógico geral da turma e individual por aluno.
 *            Criação, acompanhamento de status, edição e exclusão.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var currentTurmaId = null;
    var currentTurmaNome = '';
    var currentTurmaAlunos = [];

    /**
     * Busca os planejamentos de uma turma na API
     */
    async function getTurmaPlanejamentos(turmaId, alunoId) {
        if (!turmaId) return [];
        try {
            var url = '/api/turmas/' + encodeURIComponent(turmaId) + '/planejamentos' + (alunoId ? '?aluno_id=' + encodeURIComponent(alunoId) : '');
            var res = (typeof global.apiFetch === 'function')
                ? await global.apiFetch(url)
                : await fetch(url);

            if (res && res.ok) {
                var data = await res.json();
                if (data && data.success && Array.isArray(data.planejamentos)) {
                    return data.planejamentos;
                }
            }
        } catch (err) {
            console.warn('[TurmasPlanejamento] Erro ao buscar da API, usando fallback local:', err);
        }

        // Fallback local do localStorage
        var localKey = 'turma_planejamentos_' + turmaId;
        try {
            var cached = localStorage.getItem(localKey);
            if (cached) {
                var all = JSON.parse(cached);
                if (alunoId) {
                    return all.filter(function(p) { return p.aluno_id === alunoId; });
                }
                return all;
            }
        } catch (e) {}

        // Fallback inicial ilustrativo se vazio
        return [
            {
                id: 'plan_01',
                turma_id: turmaId,
                aluno_id: null,
                aluno_nome: null,
                titulo: 'Recomposição de Leitura e Interpretação (SAEB D01 & D03)',
                descricao: 'Rotina quinzenal de leitura de crônicas e contos regionais com verificação de inferência e localização de informações.',
                data_inicio: '2026-03-01',
                data_fim: '2026-03-31',
                status: 'em andamento',
                professor_nome: 'Docente Regente'
            }
        ];
    }

    /**
     * Salva novo planejamento
     */
    async function savePlanejamento(payload) {
        if (!payload || !payload.turma_id || !payload.titulo) {
            if (typeof global.showToast === 'function') {
                global.showToast('Título do planejamento é obrigatório.', 'warning');
            }
            return false;
        }

        try {
            var url = '/api/turmas/' + encodeURIComponent(payload.turma_id) + '/planejamentos';
            var res = (typeof global.apiFetch === 'function')
                ? await global.apiFetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                : await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

            if (res && (res.ok || res.status === 201)) {
                var data = await res.json();
                if (typeof global.showToast === 'function') {
                    global.showToast(data.message || 'Planejamento registrado com sucesso!', 'success');
                }
                return true;
            } else {
                var errData = await res.json().catch(function() { return {}; });
                if (typeof global.showToast === 'function') {
                    global.showToast(errData.message || 'Erro ao registrar planejamento.', 'warning');
                }
                return false;
            }
        } catch (err) {
            console.warn('[TurmasPlanejamento] Erro ao salvar via API:', err);
            // Salva no fallback local
            var localKey = 'turma_planejamentos_' + payload.turma_id;
            var list = [];
            try {
                var cached = localStorage.getItem(localKey);
                if (cached) list = JSON.parse(cached);
            } catch(e) {}

            var newPlan = Object.assign({}, payload, {
                id: 'plan_' + Date.now(),
                status: payload.status || 'planejado',
                criado_em: new Date().toISOString()
            });

            list.push(newPlan);
            try { localStorage.setItem(localKey, JSON.stringify(list)); } catch(e) {}

            if (typeof global.showToast === 'function') {
                global.showToast('Planejamento salvo com sucesso (modo local)!', 'success');
            }
            return true;
        }
    }

    /**
     * Atualiza o status de um planejamento
     */
    async function updatePlanejamentoStatus(id, newStatus, turmaId) {
        try {
            var url = '/api/planejamentos/' + encodeURIComponent(id);
            var res = (typeof global.apiFetch === 'function')
                ? await global.apiFetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                })
                : await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });

            if (res && res.ok) {
                if (typeof global.showToast === 'function') {
                    global.showToast('Status do planejamento atualizado!', 'success');
                }
                return true;
            }
        } catch (err) {
            console.warn('[TurmasPlanejamento] Erro ao atualizar status via API:', err);
        }

        // Fallback local
        if (turmaId) {
            var localKey = 'turma_planejamentos_' + turmaId;
            try {
                var list = JSON.parse(localStorage.getItem(localKey) || '[]');
                var item = list.find(function(p) { return p.id === id; });
                if (item) {
                    item.status = newStatus;
                    localStorage.setItem(localKey, JSON.stringify(list));
                    if (typeof global.showToast === 'function') {
                        global.showToast('Status atualizado!', 'success');
                    }
                    return true;
                }
            } catch(e) {}
        }
        return false;
    }

    /**
     * Exclui um planejamento
     */
    async function deletePlanejamento(id, turmaId) {
        if (typeof confirm === 'function' && !confirm('Deseja excluir este planejamento pedagógico?')) {
            return false;
        }

        try {
            var url = '/api/planejamentos/' + encodeURIComponent(id);
            var res = (typeof global.apiFetch === 'function')
                ? await global.apiFetch(url, { method: 'DELETE' })
                : await fetch(url, { method: 'DELETE' });

            if (res && res.ok) {
                if (typeof global.showToast === 'function') {
                    global.showToast('Planejamento removido com sucesso.', 'info');
                }
                return true;
            }
        } catch (err) {
            console.warn('[TurmasPlanejamento] Erro ao excluir via API:', err);
        }

        // Fallback local
        if (turmaId) {
            var localKey = 'turma_planejamentos_' + turmaId;
            try {
                var list = JSON.parse(localStorage.getItem(localKey) || '[]');
                var updated = list.filter(function(p) { return p.id !== id; });
                localStorage.setItem(localKey, JSON.stringify(updated));
                if (typeof global.showToast === 'function') {
                    global.showToast('Planejamento removido.', 'info');
                }
                return true;
            } catch(e) {}
        }
        return false;
    }

    /**
     * Renderiza a aba de planejamento pedagógico da turma
     */
    async function renderTurmaPlanejamentoTab(turmaId, containerId, filterAlunoId) {
        var container = document.getElementById(containerId || 'modal-journal-planejamento-container');
        if (!container) return;

        container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted);"><i data-lucide="loader-2" class="spin" style="width: 24px; height: 24px;"></i><br>Carregando planejamentos pedagógicos...</div>';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();

        var planejamentos = await getTurmaPlanejamentos(turmaId, filterAlunoId);

        var statusBadgeMap = {
            'planejado': { label: 'Planejado', cls: 'badge-primary', color: '#6366f1' },
            'em andamento': { label: 'Em Andamento', cls: 'badge-warning', color: '#f59e0b' },
            'concluido': { label: 'Concluído', cls: 'badge-success', color: '#10b981' },
            'concluído': { label: 'Concluído', cls: 'badge-success', color: '#10b981' }
        };

        var html = [
            '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">',
            '    <div style="display: flex; align-items: center; gap: 8px;">',
            '        <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">' + planejamentos.length + ' ação(ões) pedagógica(s) registrada(s)</span>',
            '    </div>',
            '    <button type="button" class="btn btn-primary btn-sm" onclick="TurmasPlanejamento.openCreatePlanModal(\'' + turmaId + '\', null);" style="display: flex; align-items: center; gap: 6px; font-weight: 700;">',
            '        <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i> + Novo Planejamento',
            '    </button>',
            '</div>'
        ];

        if (!planejamentos || planejamentos.length === 0) {
            html.push([
                '<div style="padding: 32px 20px; text-align: center; background: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">',
                '    <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(99,102,241,0.1); color: #6366f1; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px;">',
                '        <i data-lucide="calendar" style="width: 22px; height: 22px;"></i>',
                '    </div>',
                '    <h4 style="margin: 0 0 4px 0; font-size: 0.95rem; color: var(--text-primary);">Nenhum planejamento registrado</h4>',
                '    <p style="margin: 0 0 16px 0; font-size: 0.78rem; color: var(--text-secondary);">Defina intervenções pedagógicas e roteiros de estudo para a turma ou individualmente por aluno.</p>',
                '    <button type="button" class="btn btn-primary btn-sm" onclick="TurmasPlanejamento.openCreatePlanModal(\'' + turmaId + '\', null);" style="display: inline-flex; align-items: center; gap: 6px;">',
                '        <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i> Registrar Primeiro Planejamento',
                '    </button>',
                '</div>'
            ].join('\n'));
        } else {
            html.push('<div style="display: flex; flex-direction: column; gap: 12px;">');

            planejamentos.forEach(function(plan) {
                var isIndividual = Boolean(plan.aluno_id);
                var statusInfo = statusBadgeMap[plan.status] || { label: plan.status || 'Planejado', cls: 'badge-primary', color: '#6366f1' };
                var dates = (plan.data_inicio || plan.data_fim)
                    ? ((plan.data_inicio ? new Date(plan.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '') + (plan.data_fim ? ' até ' + new Date(plan.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : ''))
                    : 'Período contínuo';

                var targetBadge = isIndividual
                    ? '<span class="badge" style="background: rgba(239, 68, 68, 0.12); color: #dc2626; font-size: 0.7rem; font-weight: 700;"><i data-lucide="user" style="width:11px; height:11px; vertical-align:middle;"></i> Individual: ' + (plan.aluno_nome || 'Aluno ' + plan.aluno_id) + '</span>'
                    : '<span class="badge" style="background: rgba(99, 102, 241, 0.12); color: #6366f1; font-size: 0.7rem; font-weight: 700;"><i data-lucide="users" style="width:11px; height:11px; vertical-align:middle;"></i> Turma Toda</span>';

                html.push([
                    '<div class="card" style="padding: 14px 16px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); border-left: 4px solid ' + statusInfo.color + ';">',
                    '    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px;">',
                    '        <div>',
                    '            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px;">',
                    '                ' + targetBadge,
                    '                <span class="badge ' + statusInfo.cls + '" style="font-size: 0.7rem;">' + statusInfo.label + '</span>',
                    '            </div>',
                    '            <h4 style="margin: 0; font-size: 0.98rem; font-weight: 700; color: var(--text-primary);">' + plan.titulo + '</h4>',
                    '        </div>',
                    '        <div style="display: flex; align-items: center; gap: 6px;">',
                    '            <select onchange="TurmasPlanejamento.handleStatusChange(\'' + plan.id + '\', this.value, \'' + turmaId + '\', \'' + containerId + '\');" class="form-select" style="font-size: 0.72rem; padding: 2px 6px; height: 26px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">',
                    '                <option value="planejado"' + (plan.status === 'planejado' ? ' selected' : '') + '>Planejado</option>',
                    '                <option value="em andamento"' + (plan.status === 'em andamento' ? ' selected' : '') + '>Em Andamento</option>',
                    '                <option value="concluido"' + (plan.status === 'concluido' || plan.status === 'concluído' ? ' selected' : '') + '>Concluído</option>',
                    '            </select>',
                    '            <button type="button" class="btn btn-outline btn-sm" onclick="TurmasPlanejamento.handleDeleteClick(\'' + plan.id + '\', \'' + turmaId + '\', \'' + containerId + '\');" style="color: var(--color-status-critical-text); padding: 2px 6px; height: 26px;" title="Excluir Planejamento">',
                    '                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>',
                    '            </button>',
                    '        </div>',
                    '    </div>',
                    '    <p style="margin: 0 0 8px 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45;">' + (plan.descricao || 'Sem descrição detalhada.') + '</p>',
                    '    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 6px; margin-top: 4px;">',
                    '        <span><i data-lucide="clock" style="width:12px; height:12px; vertical-align:middle;"></i> Período: ' + dates + '</span>',
                    '        <span>Professor: <strong>' + (plan.professor_nome || 'Regente') + '</strong></span>',
                    '    </div>',
                    '</div>'
                ].join('\n'));
            });

            html.push('</div>');
        }

        container.innerHTML = html.join('\n');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Abre o modal de criação de planejamento
     */
    function openCreatePlanModal(turmaId, defaultAlunoId) {
        currentTurmaId = turmaId;
        var modal = document.getElementById('modal-create-planejamento');
        if (!modal) return;

        var inputTurmaId = document.getElementById('plan-form-turma-id');
        var selectAluno = document.getElementById('plan-form-aluno-id');
        var inputTitulo = document.getElementById('plan-form-titulo');
        var inputDesc = document.getElementById('plan-form-descricao');
        var inputInicio = document.getElementById('plan-form-data-inicio');
        var inputFim = document.getElementById('plan-form-data-fim');
        var selectStatus = document.getElementById('plan-form-status');

        if (inputTurmaId) inputTurmaId.value = turmaId;
        if (inputTitulo) inputTitulo.value = '';
        if (inputDesc) inputDesc.value = '';
        if (inputInicio) inputInicio.value = new Date().toISOString().split('T')[0];
        if (inputFim) inputFim.value = '';
        if (selectStatus) selectStatus.value = 'planejado';

        if (selectAluno) {
            var loaded = (typeof global.getMasterStudentsDatabase === 'function') ? global.getMasterStudentsDatabase() : (global.loadedStudents || []);
            var students = loaded.filter(function(s) {
                return (s.turma && currentTurmaNome && s.turma.includes(currentTurmaNome)) || true;
            }).slice(0, 35);

            selectAluno.innerHTML = '<option value="">-- Toda a Turma (Geral) --</option>' + students.map(function(st) {
                var sId = st.matricula || st.id;
                var isSel = defaultAlunoId && (defaultAlunoId === sId || defaultAlunoId === st.id);
                return '<option value="' + sId + '"' + (isSel ? ' selected' : '') + '>Aluno: ' + st.nome + ' (' + sId + ')</option>';
            }).join('');
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeCreatePlanModal() {
        var modal = document.getElementById('modal-create-planejamento');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    async function handlePlanFormSubmit(event) {
        if (event && event.preventDefault) event.preventDefault();

        var turmaId = document.getElementById('plan-form-turma-id') ? document.getElementById('plan-form-turma-id').value : currentTurmaId;
        var alunoId = (document.getElementById('plan-form-aluno-id') && document.getElementById('plan-form-aluno-id').value) || null;
        var titulo = document.getElementById('plan-form-titulo') ? document.getElementById('plan-form-titulo').value.trim() : '';
        var descricao = document.getElementById('plan-form-descricao') ? document.getElementById('plan-form-descricao').value.trim() : '';
        var dataInicio = (document.getElementById('plan-form-data-inicio') && document.getElementById('plan-form-data-inicio').value) || null;
        var dataFim = (document.getElementById('plan-form-data-fim') && document.getElementById('plan-form-data-fim').value) || null;
        var status = (document.getElementById('plan-form-status') && document.getElementById('plan-form-status').value) || 'planejado';

        if (!titulo) {
            if (typeof global.showToast === 'function') {
                global.showToast('Por favor, informe o título da intervenção/planejamento.', 'warning');
            }
            return;
        }

        var payload = {
            turma_id: turmaId,
            aluno_id: alunoId,
            titulo: titulo,
            descricao: descricao,
            data_inicio: dataInicio,
            data_fim: dataFim,
            status: status
        };

        var ok = await savePlanejamento(payload);
        if (ok) {
            closeCreatePlanModal();
            renderTurmaPlanejamentoTab(turmaId, 'modal-journal-planejamento-container');
        }
    }

    async function handleStatusChange(id, newStatus, turmaId, containerId) {
        var ok = await updatePlanejamentoStatus(id, newStatus, turmaId);
        if (ok) {
            renderTurmaPlanejamentoTab(turmaId, containerId);
        }
    }

    async function handleDeleteClick(id, turmaId, containerId) {
        var ok = await deletePlanejamento(id, turmaId);
        if (ok) {
            renderTurmaPlanejamentoTab(turmaId, containerId);
        }
    }

    // Exposição global
    var TurmasPlanejamento = {
        getTurmaPlanejamentos: getTurmaPlanejamentos,
        savePlanejamento: savePlanejamento,
        updatePlanejamentoStatus: updatePlanejamentoStatus,
        deletePlanejamento: deletePlanejamento,
        renderTurmaPlanejamentoTab: renderTurmaPlanejamentoTab,
        openCreatePlanModal: openCreatePlanModal,
        closeCreatePlanModal: closeCreatePlanModal,
        handlePlanFormSubmit: handlePlanFormSubmit,
        handleStatusChange: handleStatusChange,
        handleDeleteClick: handleDeleteClick,
        setCurrentTurmaNome: function(nome) { currentTurmaNome = nome; }
    };

    global.TurmasPlanejamento = TurmasPlanejamento;
    global.handleSavePlanejamento = handlePlanFormSubmit;

})(typeof window !== 'undefined' ? window : this);
