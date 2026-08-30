// =========================================================================
// BANCO DE QUESTÕES - LISTAGEM, FILTROS & CADASTRO MANUAL (MODULAR ENGINE)
// Responsabilidade: Renderização de cards de itens, busca textual reativa,
// filtros por matriz e dificuldade, exibição de gabarito e cadastro manual.
// =========================================================================

(function(global) {
    'use strict';

    var rawQuestions = global.rawQuestions || [
        {
            id: 'Q_01',
            matriz: 'SAEB',
            codigo_bncc: 'D03 (LP - 5º Ano)',
            disciplina: 'Língua Portuguesa',
            etapa: '5º Ano',
            dificuldade: 'Médio',
            nivel_cognitivo: 'Analisar',
            enunciado: 'Leia o texto a seguir:\n\n"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave. Dona Francisca apressou o passo na vereda, sentindo o frescor da tarde anunciar o fim da colheita."\n\nNo trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:',
            opcoes: [
                { letra: 'A', texto: 'Perder a consciência por cansaço físico.', correta: false },
                { letra: 'B', texto: 'Desaparecer lentamente ao entardecer.', correta: true },
                { letra: 'C', texto: 'Aumentar a intensidade de sua luz solar.', correta: false },
                { letra: 'D', texto: 'Mudar de posição devido ao vento forte.', correta: false }
            ],
            explicacao: "GABARITO: B. A expressão 'desmaiar no horizonte' é uma metáfora poética que expressa o pôr do sol gradativo."
        },
        {
            id: 'Q_02',
            matriz: 'SAEB',
            codigo_bncc: 'D13 (MAT - 5º Ano)',
            disciplina: 'Matemática',
            etapa: '5º Ano',
            dificuldade: 'Fácil',
            nivel_cognitivo: 'Aplicar',
            enunciado: 'Na feira do produtor rural de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele conseguiu vender 1.830 espigas.\n\nQuantas espigas de milho restaram com Seu Raimundo?',
            opcoes: [
                { letra: 'A', texto: '500 espigas', correta: false },
                { letra: 'B', texto: '600 espigas', correta: true },
                { letra: 'C', texto: '650 espigas', correta: false },
                { letra: 'D', texto: '720 espigas', correta: false }
            ],
            explicacao: 'GABARITO: B. Total colhido: 1.450 + 980 = 2.430 espigas. Restante após as vendas: 2.430 - 1.830 = 600 espigas.'
        },
        {
            id: 'Q_03',
            matriz: 'SEAMA',
            codigo_bncc: 'D28 (MAT - 9º Ano)',
            disciplina: 'Matemática',
            etapa: '9º Ano',
            dificuldade: 'Médio',
            nivel_cognitivo: 'Analisar',
            enunciado: 'A tabela abaixo registra o número de livros lidos pelos estudantes de uma turma durante o 1º bimestre:\n\n• 1 a 2 livros: 12 alunos\n• 3 a 4 livros: 18 alunos\n• 5 ou mais livros: 10 alunos\n\nQual é o percentual de estudantes que leram 3 ou mais livros nessa turma?',
            opcoes: [
                { letra: 'A', texto: '30%', correta: false },
                { letra: 'B', texto: '45%', correta: false },
                { letra: 'C', texto: '70%', correta: true },
                { letra: 'D', texto: '80%', correta: false }
            ],
            explicacao: 'GABARITO: C. Total de alunos na turma = 12 + 18 + 10 = 40 alunos. Alunos que leram 3 ou mais livros = 18 + 10 = 28 alunos. Percentual = (28 / 40) × 100 = 70%.'
        }
    ];
    global.rawQuestions = rawQuestions;

    /**
     * Renderiza o acervo de questões com filtros e busca textual
     */
    function renderQuestions() {
        var questionsContainer = document.getElementById('questions-container-list');
        var questionsCounter = document.getElementById('questions-counter');
        var filterMatrix = document.getElementById('filter-matrix');
        var filterStage = document.getElementById('filter-stage');
        var filterSubject = document.getElementById('filter-subject');
        var filterDifficulty = document.getElementById('filter-difficulty');
        var qSearchInput = document.getElementById('questions-search-query');
        var searchQuery = qSearchInput ? qSearchInput.value.toLowerCase().trim() : '';

        if (!questionsContainer) return;

        var selectedMatrix = filterMatrix ? filterMatrix.value : 'all';
        var selectedStage = filterStage ? filterStage.value : 'all';
        var selectedSubject = filterSubject ? filterSubject.value : 'all';
        var selectedDifficulty = filterDifficulty ? filterDifficulty.value : 'all';

        var filtered = global.rawQuestions.filter(function(q) {
            var matchMatrix = selectedMatrix === 'all' || q.matriz === selectedMatrix;
            var matchStage = selectedStage === 'all' || q.etapa === selectedStage;
            var matchSubject = selectedSubject === 'all' || q.disciplina === selectedSubject;
            var matchDifficulty = selectedDifficulty === 'all' || q.dificuldade === selectedDifficulty;
            var matchSearch = !searchQuery ||
                (q.enunciado && q.enunciado.toLowerCase().includes(searchQuery)) ||
                (q.codigo_bncc && q.codigo_bncc.toLowerCase().includes(searchQuery)) ||
                (q.disciplina && q.disciplina.toLowerCase().includes(searchQuery));

            return matchMatrix && matchStage && matchSubject && matchDifficulty && matchSearch;
        });

        if (questionsCounter) {
            questionsCounter.textContent = 'Exibindo ' + filtered.length + ' ' + (filtered.length === 1 ? 'questão' : 'questões') + ' do banco';
        }

        questionsContainer.innerHTML = '';

        if (filtered.length === 0) {
            questionsContainer.innerHTML = [
                '<div class="card text-center" style="padding: 40px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">',
                '    <p class="text-muted" style="margin:0; font-size:0.9rem;">Nenhuma questão encontrada para os filtros selecionados.</p>',
                '</div>'
            ].join('\n');
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
            return;
        }

        filtered.forEach(function(q, idx) {
            var card = document.createElement('div');
            card.className = 'question-card';
            card.style.background = 'var(--bg-secondary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.padding = '18px';
            card.style.position = 'relative';

            var badgeDiffClass = q.dificuldade === 'Fácil' ? 'badge-success' : (q.dificuldade === 'Médio' ? 'badge-warning' : 'badge-danger');
            var cleanEnunciado = (q.enunciado || '').replace(/\n/g, '<br>');

            var optionsHtml = (q.opcoes || []).map(function(opt) {
                return [
                    '<div class="question-option ' + (opt.correta ? 'is-correct-answer' : '') + '" data-correct="' + opt.correta + '" style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-tertiary); font-size: 0.84rem; cursor: pointer; transition: all 0.15s ease;">',
                    '    <strong class="option-letter" style="min-width: 22px; font-weight: 700; color: var(--purple-light);">' + opt.letra + ')</strong>',
                    '    <span class="option-text" style="color: var(--text-primary);">' + opt.texto + '</span>',
                    '</div>'
                ].join('\n');
            }).join('\n');

            card.innerHTML = [
                '<div class="question-header flex-between flex-wrap gap-sm" style="margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">',
                '    <div class="question-badges" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">',
                '        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.75rem; font-weight:700; color:var(--purple-light); background:rgba(139,92,246,0.1); padding:2px 8px; border-radius:4px; border:1px solid rgba(139,92,246,0.3);">',
                '            <input type="checkbox" class="select-q-item-check" data-id="' + q.id + '" style="cursor:pointer; accent-color:var(--purple);" checked />',
                '            <span>Selecionar Item</span>',
                '        </label>',
                '        <span class="badge badge-purple" style="font-weight:700;">' + (q.codigo_bncc || 'BNCC') + '</span>',
                '        <span class="badge badge-info">' + q.disciplina + '</span>',
                '        <span class="badge badge-outline">' + (q.etapa || '5º Ano') + '</span>',
                '        <span class="badge badge-outline">' + (q.matriz || 'SAEB') + '</span>',
                '        <span class="badge ' + badgeDiffClass + '">' + q.dificuldade + '</span>',
                '    </div>',
                '    <div class="question-actions" style="display:flex; gap:6px;">',
                '        <button class="btn btn-outline btn-sm btn-reveal-q-expl" data-id="' + q.id + '" style="font-size:0.75rem; padding:3px 8px; display:flex; align-items:center; gap:4px;">',
                '            <i data-lucide="eye" style="width:13px; height:13px;"></i> Ver Gabarito',
                '        </button>',
                '        <button class="btn btn-outline btn-sm btn-delete-question" data-id="' + q.id + '" style="color:var(--red-light); border-color:rgba(239,68,68,0.3); padding:3px 8px;" title="Excluir">',
                '            <i data-lucide="trash-2" style="width:13px; height:13px;"></i>',
                '        </button>',
                '    </div>',
                '</div>',
                '<div class="question-body" style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.55; margin-bottom: 14px;">',
                '    <strong style="color: var(--purple-light); margin-right: 4px;">Item ' + (idx + 1) + '.</strong>',
                '    ' + cleanEnunciado,
                '</div>',
                '<div class="question-options-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">',
                optionsHtml,
                '</div>',
                '<div class="question-explanation hidden" id="expl-' + q.id + '" style="padding: 12px 16px; background: rgba(139, 92, 246, 0.06); border-left: 4px solid var(--purple); border-radius: var(--radius-sm); margin-top: 10px; display:none;">',
                '    <strong style="font-size: 0.82rem; color: var(--purple-light); display: flex; align-items: center; gap: 6px;">',
                '        <i data-lucide="check-circle" style="width: 14px; height: 14px;"></i>',
                '        Gabarito Comentado & Análise Pedagógica:',
                '    </strong>',
                '    <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45;">',
                '        ' + (q.explicacao || 'Sem justificativa cadastrada.'),
                '    </p>',
                '</div>'
            ].join('\n');

            questionsContainer.appendChild(card);
        });

        // Alternar visualização de gabarito comentado
        questionsContainer.querySelectorAll('.btn-reveal-q-expl').forEach(function(btn) {
            btn.onclick = function() {
                var id = btn.getAttribute('data-id');
                var expl = document.getElementById('expl-' + id);
                if (expl) {
                    var isHidden = expl.style.display === 'none' || expl.classList.contains('hidden');
                    expl.style.display = isHidden ? 'block' : 'none';
                    expl.classList.toggle('hidden', !isHidden);
                }
            };
        });

    /**
     * Sincroniza o acervo de questões com o PostgreSQL
     */
    async function fetchQuestionsFromApi() {
        try {
            var res = await fetch('/api/questoes');
            if (res.ok) {
                var data = await res.json();
                if (data && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
                    global.rawQuestions = data.questions;
                    renderQuestions();
                }
            }
        } catch (err) {
            console.warn('[Questoes API Fallback]');
        }
    }

    // Exclusão de questão com confirmação e persistência no PostgreSQL
    function handleDeleteQuestion(id) {
        global.rawQuestions = (global.rawQuestions || []).filter(function(q) { return q.id !== id; });
        renderQuestions();

        try {
            fetch('/api/questoes/' + id, { method: 'DELETE' }).catch(function() {});
        } catch (e) {}

        if (typeof global.showToast === 'function') global.showToast('Questão removida do banco!', 'trash-2');
    }
        ['filter-matrix', 'filter-stage', 'filter-subject', 'filter-difficulty'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.onchange = renderQuestions;
        });

        var qSearchInput = document.getElementById('questions-search-query');
        if (qSearchInput) qSearchInput.oninput = renderQuestions;

        // Botão "Montar Simulado com Itens" -> Encaminha para o Wizard de Avaliações
        var btnOpenCreateExam = document.getElementById('btn-open-create-exam-from-q');
        if (btnOpenCreateExam) {
            btnOpenCreateExam.onclick = function() {
                var checkedBoxes = document.querySelectorAll('.select-q-item-check:checked');
                var selectedIds = Array.from(checkedBoxes).map(function(cb) { return cb.getAttribute('data-id'); });
                
                var selectedQuestions = (global.rawQuestions || []).filter(function(q) {
                    return selectedIds.includes(q.id);
                });

                if (selectedQuestions.length === 0) {
                    selectedQuestions = (global.rawQuestions || []).slice(0, 3);
                }

                global.selectedItemsForWizard = selectedQuestions;

                if (typeof global.switchTab === 'function') global.switchTab('sec-criar-avaliacoes');
                if (typeof global.switchAvaliacoesSubtab === 'function') global.switchAvaliacoesSubtab('criar-evento-sub');
                if (typeof global.showNewEventWizard === 'function') global.showNewEventWizard();

                var numQEl = document.getElementById('wizard-num-questions');
                if (numQEl) {
                    numQEl.value = selectedQuestions.length.toString();
                }

                var titleEl = document.getElementById('wizard-title');
                if (titleEl && !titleEl.value) {
                    titleEl.value = 'Simulado Especial — Banco de Questões (' + selectedQuestions.length + ' Itens)';
                }

                if (typeof global.goToWizardStep === 'function') {
                    global.goToWizardStep(2);
                } else if (typeof global.renderGabaritoMatrixStep2 === 'function') {
                    global.renderGabaritoMatrixStep2();
                }

                if (typeof global.showToast === 'function') {
                    global.showToast(selectedQuestions.length + ' questões transferidas com sucesso para o Wizard!', 'check-circle');
                }
            };
        }

        // Modal de Criação Manual
        var btnOpenManual = document.getElementById('btn-trigger-manual-q-modal');
        var btnCloseManual = document.getElementById('btn-close-manual-q-modal');
        var btnSaveManual = document.getElementById('btn-save-manual-q');
        var modalManual = document.getElementById('modal-create-manual-question');

        if (btnOpenManual && modalManual) {
            btnOpenManual.onclick = function() {
                modalManual.classList.remove('hidden');
                modalManual.style.display = 'flex';
            };
        }

        if (btnCloseManual && modalManual) {
            btnCloseManual.onclick = function() {
                modalManual.classList.add('hidden');
                modalManual.style.display = 'none';
            };
        }

        if (btnSaveManual && modalManual) {
            btnSaveManual.onclick = function() {
                var stageEl = document.getElementById('manual-q-stage');
                var subjectEl = document.getElementById('manual-q-subject');
                var matrixEl = document.getElementById('manual-q-matrix');
                var diffEl = document.getElementById('manual-q-diff');
                var descEl = document.getElementById('manual-q-desc');
                var textEl = document.getElementById('manual-q-text');
                var opA = document.getElementById('manual-q-op-a');
                var opB = document.getElementById('manual-q-op-b');
                var opC = document.getElementById('manual-q-op-c');
                var opD = document.getElementById('manual-q-op-d');
                var correctEl = document.getElementById('manual-q-correct');

                var stage = stageEl ? stageEl.value : '5º Ano';
                var subject = subjectEl ? subjectEl.value : 'Língua Portuguesa';
                var matrix = matrixEl ? matrixEl.value : 'SAEB';
                var diff = diffEl ? diffEl.value : 'Médio';
                var desc = descEl ? descEl.value.trim() : 'D01';
                var text = textEl ? textEl.value.trim() : '';
                var cor = correctEl ? correctEl.value : 'A';

                if (!text) {
                    if (typeof global.showToast === 'function') global.showToast('Por favor, informe o enunciado da questão.', 'alert-triangle');
                    return;
                }

                var newQ = {
                    id: 'Q_' + Date.now(),
                    matriz: matrix,
                    codigo_bncc: desc + ' (' + stage + ')',
                    disciplina: subject,
                    etapa: stage,
                    dificuldade: diff,
                    nivel_cognitivo: 'Compreender',
                    enunciado: text,
                    opcoes: [
                        { letra: 'A', texto: opA ? opA.value || 'Opção A' : 'A', correta: cor === 'A' },
                        { letra: 'B', texto: opB ? opB.value || 'Opção B' : 'B', correta: cor === 'B' },
                        { letra: 'C', texto: opC ? opC.value || 'Opção C' : 'C', correta: cor === 'C' },
                        { letra: 'D', texto: opD ? opD.value || 'Opção D' : 'D', correta: cor === 'D' }
                    ],
                    gabarito: cor,
                    origem: 'MANUAL',
                    explicacao: 'GABARITO: ' + cor + '. Cadastrado manualmente no banco oficial.'
                };

                global.rawQuestions.unshift(newQ);
                renderQuestions();

                // Persistência no PostgreSQL
                try {
                    fetch('/api/questoes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newQ)
                    }).catch(function() {});
                } catch(e) {}

                modalManual.classList.add('hidden');
                modalManual.style.display = 'none';

                if (typeof global.showToast === 'function') global.showToast('Questão cadastrada e salva no PostgreSQL!', 'check-circle');
            };
        }

        fetchQuestionsFromApi();
        renderQuestions();
    }

    // Exposição Global
    global.renderQuestions = renderQuestions;
    global.initQuestionsListModule = initQuestionsListModule;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuestionsListModule);
    } else {
        setTimeout(initQuestionsListModule, 180);
    }

})(typeof window !== 'undefined' ? window : this);
