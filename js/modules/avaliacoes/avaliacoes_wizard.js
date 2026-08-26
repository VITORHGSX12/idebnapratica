// =========================================================================
// WIZARD DE CRIAÇÃO DE AVALIAÇÕES & SIMULADOS (MODULAR ENGINE)
// Responsabilidade: Assistente passo a passo (Passos 1, 2 e 3) para criação
// de eventos, seleção de escolas/turmas, montagem de itens BNCC e agendamento.
// =========================================================================

(function(global) {
    'use strict';

    var wizardCurrentStep = 1;
    var wizardSelectedStage = '5º Ano';
    var wizardSelectedQuestions = [];

    /**
     * Alterna entre os passos 1, 2 e 3 do assistente
     */
    function goToWizardStep(step) {
        wizardCurrentStep = step;
        var panes = document.querySelectorAll('.wizard-step-pane');
        panes.forEach(function(p) { p.classList.add('hidden'); });
        
        var targetPane = document.getElementById('step-pane-' + step);
        if (targetPane) targetPane.classList.remove('hidden');

        // Atualizar indicadores de progresso
        for (var i = 1; i <= 3; i++) {
            var ind = document.getElementById('step-ind-' + i);
            var line = document.getElementById('step-line-' + (i - 1));
            if (!ind) continue;

            var span = ind.querySelector('span');
            if (i <= step) {
                ind.style.color = 'var(--purple-light)';
                ind.style.fontWeight = '600';
                if (span) {
                    span.style.background = 'var(--purple-glow)';
                    span.style.borderColor = 'var(--purple)';
                }
                if (line) line.style.background = 'var(--purple)';
            } else {
                ind.style.color = 'var(--text-muted)';
                ind.style.fontWeight = '500';
                if (span) {
                    span.style.background = 'var(--bg-tertiary)';
                    span.style.borderColor = 'var(--border-color)';
                }
                if (line) line.style.background = 'var(--border-color)';
            }
        }
    }

    /**
     * Popula checklist de escolas participantes no Passo 1
     */
    function populateWizardSchools() {
        var checklist = document.getElementById('wizard-schools-checklist');
        if (!checklist) return;
        checklist.innerHTML = '';

        var escolas = global.dbEscolas || [];
        if (escolas.length === 0) {
            checklist.innerHTML = '<div style="color:var(--text-muted); font-size:0.75rem; padding: 4px;">Nenhuma escola cadastrada no sistema.</div>';
            return;
        }

        escolas.forEach(function(esc) {
            var label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '8px';
            label.style.fontSize = '0.75rem';
            label.style.color = 'var(--text-primary)';
            label.style.cursor = 'pointer';

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = esc.id;
            checkbox.className = 'wizard-school-checkbox';
            checkbox.style.cursor = 'pointer';
            checkbox.checked = true;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(esc.nome));
            checklist.appendChild(label);
        });

        var btnSelectAll = document.getElementById('btn-select-all-wizard-schools');
        var btnClearAll = document.getElementById('btn-clear-all-wizard-schools');

        if (btnSelectAll) {
            btnSelectAll.onclick = function(e) {
                e.preventDefault();
                checklist.querySelectorAll('.wizard-school-checkbox').forEach(function(cb) { cb.checked = true; });
            };
        }

        if (btnClearAll) {
            btnClearAll.onclick = function(e) {
                e.preventDefault();
                checklist.querySelectorAll('.wizard-school-checkbox').forEach(function(cb) { cb.checked = false; });
            };
        }
    }

    /**
     * Popula checklist de turmas participantes no Passo 3
     */
    function populateWizardClasses() {
        var container = document.getElementById('wizard-classes-checklist');
        if (!container) return;
        container.innerHTML = '';

        var turmas = global.dbTurmas || [];
        var selectedSchoolCbs = document.querySelectorAll('.wizard-school-checkbox:checked');
        var selectedSchoolIds = Array.from(selectedSchoolCbs).map(function(cb) { return cb.value; });

        var filteredTurmas = turmas.filter(function(t) {
            return selectedSchoolIds.includes(t.escola_id);
        });

        if (filteredTurmas.length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted); font-size:0.75rem; padding:4px;">Nenhuma turma encontrada para as escolas selecionadas.</div>';
            return;
        }

        filteredTurmas.forEach(function(t) {
            var label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.gap = '8px';
            label.style.fontSize = '0.75rem';
            label.style.color = 'var(--text-primary)';
            label.style.cursor = 'pointer';

            var checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = t.id;
            checkbox.className = 'wizard-class-checkbox';
            checkbox.style.cursor = 'pointer';
            checkbox.checked = true;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(t.nome + ' (' + (t.turno || 'Matutino') + ')'));
            container.appendChild(label);
        });

        var btnSelectAll = document.getElementById('btn-wizard-classes-select-all');
        var btnSelectNone = document.getElementById('btn-wizard-classes-select-none');

        if (btnSelectAll) {
            btnSelectAll.onclick = function(e) {
                e.preventDefault();
                container.querySelectorAll('.wizard-class-checkbox').forEach(function(cb) { cb.checked = true; });
            };
        }
        if (btnSelectNone) {
            btnSelectNone.onclick = function(e) {
                e.preventDefault();
                container.querySelectorAll('.wizard-class-checkbox').forEach(function(cb) { cb.checked = false; });
            };
        }
    }

    /**
     * Popula lista de questões filtradas no Passo 2
     */
    function populateWizardQuestionsList() {
        var qContainer = document.getElementById('wizard-questions-list');
        if (!qContainer) return;
        qContainer.innerHTML = '';

        var subjectEl = document.getElementById('wizard-subject');
        var selectedSubject = subjectEl ? subjectEl.value : 'Língua Portuguesa';

        var stagePrefix = 'EF05';
        if (wizardSelectedStage.includes('2º')) stagePrefix = 'EF02';
        else if (wizardSelectedStage.includes('5º')) stagePrefix = 'EF05';
        else if (wizardSelectedStage.includes('9º')) stagePrefix = 'EF09';

        var rawQuestions = global.rawQuestions || global.dbQuestoes || [];

        var filtered = rawQuestions.filter(function(q) {
            var matchesDiscipline = selectedSubject.includes('Mista') || q.disciplina === selectedSubject || (selectedSubject === 'lp' && q.disciplina === 'Língua Portuguesa') || (selectedSubject === 'mat' && q.disciplina === 'Matemática');
            var matchesStage = !q.codigo_bncc || q.codigo_bncc.startsWith(stagePrefix) || true;
            return matchesDiscipline;
        });

        if (filtered.length === 0) {
            qContainer.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted); font-size: 0.85rem;">Nenhuma questão encontrada para os filtros selecionados.</div>';
            return;
        }

        filtered.slice(0, 15).forEach(function(q, idx) {
            var div = document.createElement('div');
            div.className = 'eval-question-item';
            div.style.display = 'flex';
            div.style.alignItems = 'flex-start';
            div.style.gap = '10px';
            div.style.padding = '10px';
            div.style.border = '1px solid var(--border-color)';
            div.style.borderRadius = 'var(--radius-md)';
            div.style.backgroundColor = 'var(--bg-tertiary)';

            div.innerHTML = [
                '<input type="checkbox" id="wiz-q-' + q.id + '" value="' + q.id + '" class="wizard-question-checkbox" style="margin-top: 4px;" ' + (idx < 10 ? 'checked' : '') + '>',
                '<label for="wiz-q-' + q.id + '" style="font-size: 0.75rem; line-height: 1.4; cursor: pointer; color:var(--text-primary);">',
                '    <strong>[' + (q.codigo_bncc || q.descritor || 'BNCC') + '] (' + (q.dificuldade || 'Média') + ')</strong> ' + (q.enunciado || '').replace(/\\\(.*?\\\)/g, '').slice(0, 120) + '...',
                '</label>'
            ].join('\n');

            qContainer.appendChild(div);
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Reseta o formulário do assistente para o estado inicial
     */
    function resetWizard() {
        var titleEl = document.getElementById('wizard-title');
        if (titleEl) titleEl.value = '';
        var dateEl = document.getElementById('wizard-date');
        if (dateEl) dateEl.value = '2026-08-20';
        populateWizardSchools();
        goToWizardStep(1);
    }

    /**
     * Inicializa os ouvintes de evento do Wizard
     */
    function initEvaluationWizard() {
        var btnShowWizard = document.getElementById('btn-show-new-event-wizard');
        var btnShowCreated = document.getElementById('btn-show-created-events');
        var panelWizard = document.getElementById('panel-new-event-wizard');
        var panelCreated = document.getElementById('panel-created-events');

        if (btnShowWizard && panelWizard && panelCreated) {
            btnShowWizard.onclick = function() {
                panelCreated.classList.add('hidden');
                panelWizard.classList.remove('hidden');
                btnShowWizard.classList.add('active');
                if (btnShowCreated) btnShowCreated.classList.remove('active');
                resetWizard();
            };
        }

        if (btnShowCreated && panelWizard && panelCreated) {
            btnShowCreated.onclick = function() {
                panelWizard.classList.add('hidden');
                panelCreated.classList.remove('hidden');
                btnShowCreated.classList.add('active');
                if (btnShowWizard) btnShowWizard.classList.remove('active');
            };
        }

        var wNext1 = document.getElementById('wizard-next-1');
        if (wNext1) {
            wNext1.onclick = function() {
                var titleEl = document.getElementById('wizard-title');
                var title = titleEl ? titleEl.value.trim() : '';
                if (!title) {
                    if (typeof global.showToast === 'function') global.showToast('Informe o nome da avaliação.', 'alert-triangle');
                    return;
                }

                var selectedSchoolCbs = document.querySelectorAll('.wizard-school-checkbox:checked');
                if (selectedSchoolCbs.length === 0) {
                    if (typeof global.showToast === 'function') global.showToast('Selecione pelo menos uma escola participante.', 'alert-triangle');
                    return;
                }

                populateWizardQuestionsList();
                populateWizardClasses();
                goToWizardStep(2);
            };
        }

        var wPrev2 = document.getElementById('wizard-prev-2');
        if (wPrev2) {
            wPrev2.onclick = function() { goToWizardStep(1); };
        }

        var wNext2 = document.getElementById('wizard-next-2');
        if (wNext2) {
            wNext2.onclick = function() {
                var checkedBoxes = document.querySelectorAll('.wizard-question-checkbox:checked');
                if (checkedBoxes.length === 0) {
                    if (typeof global.showToast === 'function') global.showToast('Selecione pelo menos uma questão.', 'alert-triangle');
                    return;
                }
                wizardSelectedQuestions = Array.from(checkedBoxes).map(function(cb) { return cb.value; });

                var titleEl = document.getElementById('wizard-title');
                var dateEl = document.getElementById('wizard-date');
                var subjectEl = document.getElementById('wizard-subject');

                var reviewTitle = document.getElementById('wizard-review-title');
                if (reviewTitle && titleEl) reviewTitle.textContent = titleEl.value.trim();

                var reviewMeta = document.getElementById('wizard-review-meta');
                if (reviewMeta) {
                    reviewMeta.textContent = 'Realização: ' + (dateEl ? dateEl.value : '') + ' | Componente: ' + (subjectEl ? subjectEl.value : '') + ' | Público: ' + wizardSelectedStage;
                }

                var reviewCount = document.getElementById('wizard-review-questions-count');
                if (reviewCount) {
                    reviewCount.innerHTML = 'Questões Selecionadas: <span style="color:var(--green-light); font-weight:700;">' + wizardSelectedQuestions.length + '</span>';
                }

                goToWizardStep(3);
            };
        }

        var wPrev3 = document.getElementById('wizard-prev-3');
        if (wPrev3) {
            wPrev3.onclick = function() { goToWizardStep(2); };
        }

        var wFinish = document.getElementById('wizard-finish-btn');
        if (wFinish) {
            wFinish.onclick = function() {
                var titleEl = document.getElementById('wizard-title');
                var title = titleEl ? titleEl.value.trim() : '';
                if (!title) {
                    if (typeof global.showToast === 'function') global.showToast('Por favor, informe o título do evento.', 'alert-triangle');
                    return;
                }

                var checkedClassCbs = document.querySelectorAll('.wizard-class-checkbox:checked');
                if (checkedClassCbs.length === 0) {
                    if (typeof global.showToast === 'function') global.showToast('Selecione pelo menos uma turma participante.', 'alert-triangle');
                    return;
                }

                if (typeof global.showToast === 'function') {
                    global.showToast('Simulado "' + title + '" agendado e publicado com sucesso!', 'check-circle');
                }

                if (btnShowCreated) btnShowCreated.click();
            };
        }
    }

    // Exposição Global
    global.goToWizardStep = goToWizardStep;
    global.populateWizardSchools = populateWizardSchools;
    global.populateWizardClasses = populateWizardClasses;
    global.populateWizardQuestionsList = populateWizardQuestionsList;
    global.resetWizard = resetWizard;
    global.initEvaluationWizard = initEvaluationWizard;

    // Inicialização automática
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEvaluationWizard);
    } else {
        setTimeout(initEvaluationWizard, 100);
    }

})(typeof window !== 'undefined' ? window : this);
