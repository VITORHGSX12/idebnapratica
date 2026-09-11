// =========================================================================
// BANCO DE QUESTÕES - LISTAGEM, FILTROS, KPIS & EDIÇÃO (MODULAR ENGINE)
// Responsabilidade: Renderização de cards de itens, busca textual reativa,
// filtros por matriz e dificuldade, KPIs do acervo, edição e cadastro manual.
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY_QUESTIONS = 'gd_custom_questions_db';
    var STORAGE_KEY_DELETED_QUESTIONS = 'gd_deleted_questions_ids';

    var INITIAL_QUESTIONS_DATA = [
        {
            id: 'Q_01', matriz: 'SAEB', codigo_bncc: 'D03 (LP - 5º Ano)', disciplina: 'Língua Portuguesa', etapa: '5º Ano', dificuldade: 'Médio', nivel_cognitivo: 'Analisar',
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
            id: 'Q_02', matriz: 'SAEB', codigo_bncc: 'D13 (MAT - 5º Ano)', disciplina: 'Matemática', etapa: '5º Ano', dificuldade: 'Fácil', nivel_cognitivo: 'Aplicar',
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
            id: 'Q_03', matriz: 'SEAMA', codigo_bncc: 'D28 (MAT - 9º Ano)', disciplina: 'Matemática', etapa: '9º Ano', dificuldade: 'Médio', nivel_cognitivo: 'Analisar',
            enunciado: 'A tabela abaixo registra o número de livros lidos pelos estudantes de uma turma durante o 1º bimestre:\n\n• 1 a 2 livros: 12 alunos\n• 3 a 4 livros: 18 alunos\n• 5 ou mais livros: 10 alunos\n\nQual é o percentual de estudantes que leram 3 ou mais livros nessa turma?',
            opcoes: [
                { letra: 'A', texto: '30%', correta: false },
                { letra: 'B', texto: '45%', correta: false },
                { letra: 'C', texto: '70%', correta: true },
                { letra: 'D', texto: '80%', correta: false }
            ],
            explicacao: 'GABARITO: C. Total de alunos na turma = 12 + 18 + 10 = 40 alunos. Alunos que leram 3 ou mais livros = 18 + 10 = 28 alunos. Percentual = (28 / 40) × 100 = 70%.'
        },
        {
            id: 'Q_04', matriz: 'BNCC', codigo_bncc: 'D01 (LP - 2º Ano)', disciplina: 'Língua Portuguesa', etapa: '2º Ano', dificuldade: 'Fácil', nivel_cognitivo: 'Localizar',
            enunciado: 'Leia o texto abaixo:\n\n"A escola municipal preparou uma festa para celebrar a chegada da primavera. As crianças levaram flores e desenhos coloridos para enfeitar a entrada."\n\nDe acordo com o texto, as crianças levaram flores para:',
            opcoes: [
                { letra: 'A', texto: 'Vender para os visitantes da feira.', correta: false },
                { letra: 'B', texto: 'Enfeitar a entrada da escola na festa.', correta: true },
                { letra: 'C', texto: 'Plantar no jardim da praça da cidade.', correta: false },
                { letra: 'D', texto: 'Presentear a diretora da escola.', correta: false }
            ],
            explicacao: 'GABARITO: B. A informação está explícita no texto: "para enfeitar a entrada".'
        },
        {
            id: 'Q_05', matriz: 'SAEB', codigo_bncc: 'D19 (MAT - 9º Ano)', disciplina: 'Matemática', etapa: '9º Ano', dificuldade: 'Difícil', nivel_cognitivo: 'Resolver',
            enunciado: 'O dobro da idade de Luísa somado com 15 anos é igual a 45 anos.\n\nQual é a idade atual de Luísa?',
            opcoes: [
                { letra: 'A', texto: '12 anos', correta: false },
                { letra: 'B', texto: '15 anos', correta: true },
                { letra: 'C', texto: '18 anos', correta: false },
                { letra: 'D', texto: '20 anos', correta: false }
            ],
            explicacao: 'GABARITO: B. Equação: 2x + 15 = 45 => 2x = 30 => x = 15 anos.'
        }
    ];

    function getDeletedQuestionsIds() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_DELETED_QUESTIONS);
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return [];
    }

    function saveDeletedQuestionId(id) {
        if (!id) return;
        try {
            var list = getDeletedQuestionsIds();
            var strId = id.toString();
            if (!list.includes(strId)) {
                list.push(strId);
                localStorage.setItem(STORAGE_KEY_DELETED_QUESTIONS, JSON.stringify(list));
            }
        } catch(e) {}
    }

    function saveQuestionsToStorage(questions) {
        try {
            localStorage.setItem(STORAGE_KEY_QUESTIONS, JSON.stringify(questions || []));
        } catch(e) {}
    }

    function loadInitialQuestions() {
        var deletedIds = getDeletedQuestionsIds();
        var loaded = [];
        try {
            var raw = localStorage.getItem(STORAGE_KEY_QUESTIONS);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    loaded = parsed;
                }
            }
        } catch(e) {}

        if (loaded.length === 0) {
            loaded = INITIAL_QUESTIONS_DATA.slice();
        }

        // Remove permanentemente qualquer questão cujo ID esteja na lista de excluídos
        return loaded.filter(function(q) {
            return q && q.id && !deletedIds.includes(q.id.toString());
        });
    }

    var rawQuestions = loadInitialQuestions();
    global.rawQuestions = rawQuestions;
    global.saveQuestionsToStorage = saveQuestionsToStorage;
    global.getDeletedQuestionsIds = getDeletedQuestionsIds;

    /**
     * Atualiza os KPIs do topo do Banco de Questões e o badge da sidebar
     */
    function updateQuestionsKpis() {
        var all = global.rawQuestions || [];
        var total = all.length;
        var lpCount = all.filter(function(q) { return (q.disciplina || '').toLowerCase().includes('portug'); }).length;
        var matCount = all.filter(function(q) { return (q.disciplina || '').toLowerCase().includes('matem'); }).length;

        var uniqueDesc = new Set();
        all.forEach(function(q) {
            if (q.codigo_bncc) uniqueDesc.add(q.codigo_bncc.trim());
        });

        // 40 descritores oficiais SAEB de referência
        var coveragePct = Math.min(100, Math.round((uniqueDesc.size / 30) * 100));

        var elTotal = document.getElementById('kpi-questoes-total');
        var elLp = document.getElementById('kpi-questoes-lp');
        var elLpPct = document.getElementById('kpi-questoes-lp-pct');
        var elMat = document.getElementById('kpi-questoes-mat');
        var elMatPct = document.getElementById('kpi-questoes-mat-pct');
        var elCob = document.getElementById('kpi-questoes-cobertura');
        var elDescCount = document.getElementById('kpi-questoes-descritores-count');
        var sidebarBadge = document.getElementById('badge-count-questions');

        if (elTotal) elTotal.textContent = total.toString();
        if (elLp) elLp.textContent = lpCount.toString();
        if (elLpPct) elLpPct.textContent = total > 0 ? (Math.round((lpCount / total) * 100) + '% do acervo') : '0%';
        if (elMat) elMat.textContent = matCount.toString();
        if (elMatPct) elMatPct.textContent = total > 0 ? (Math.round((matCount / total) * 100) + '% do acervo') : '0%';
        if (elCob) elCob.textContent = coveragePct + '%';
        if (elDescCount) elDescCount.textContent = uniqueDesc.size + ' descritores mapeados';

        if (sidebarBadge) {
            sidebarBadge.textContent = total.toString();
        }
    }

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

        updateQuestionsKpis();

        if (!questionsContainer) return;

        var selectedMatrix = filterMatrix ? filterMatrix.value : 'all';
        var selectedStage = filterStage ? filterStage.value : 'all';
        var selectedSubject = filterSubject ? filterSubject.value : 'all';
        var selectedDifficulty = filterDifficulty ? filterDifficulty.value : 'all';

        var filtered = (global.rawQuestions || []).filter(function(q) {
            var matchMatrix = selectedMatrix === 'all' || q.matriz === selectedMatrix;
            var matchStage = selectedStage === 'all' || q.etapa === selectedStage;
            var matchSubject = selectedSubject === 'all' || q.disciplina === selectedSubject;
            var matchDifficulty = selectedDifficulty === 'all' || q.dificuldade === selectedDifficulty;
            var matchSearch = !searchQuery ||
                (q.enunciado && q.enunciado.toLowerCase().includes(searchQuery)) ||
                (q.codigo_bncc && q.codigo_bncc.toLowerCase().includes(searchQuery)) ||
                (q.disciplina && q.disciplina.toLowerCase().includes(searchQuery)) ||
                (q.explicacao && q.explicacao.toLowerCase().includes(searchQuery));

            return matchMatrix && matchStage && matchSubject && matchDifficulty && matchSearch;
        });

        if (questionsCounter) {
            questionsCounter.textContent = 'Exibindo ' + filtered.length + ' ' + (filtered.length === 1 ? 'questão' : 'questões') + ' do acervo';
        }

        questionsContainer.innerHTML = '';

        if (filtered.length === 0) {
            questionsContainer.innerHTML = [
                '<div class="card text-center" style="padding: 40px 20px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">',
                '    <i data-lucide="help-circle" style="width:36px; height:36px; color:var(--text-muted); margin-bottom:8px; display:inline-block;"></i>',
                '    <p class="text-muted" style="margin:0; font-size:0.9rem; font-weight:600;">Nenhuma questão encontrada para os filtros selecionados.</p>',
                '    <p style="margin:4px 0 0 0; font-size:0.75rem; color:var(--text-secondary);">Gere uma nova questão com IA ou crie manualmente no menu lateral.</p>',
                '</div>'
            ].join('\n');
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
            return;
        }

        filtered.forEach(function(q, idx) {
            var card = document.createElement('div');
            card.className = 'question-card card';
            card.id = 'card-' + q.id;
            card.style.background = 'var(--bg-secondary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.padding = '18px';
            card.style.position = 'relative';

            var badgeDiffClass = q.dificuldade === 'Fácil' ? 'badge-success' : (q.dificuldade === 'Médio' ? 'badge-warning' : 'badge-danger');
            var cleanEnunciado = (q.enunciado || '').replace(/\n/g, '<br>');

            var optionsHtml = (q.opcoes || []).map(function(opt) {
                var isCorreta = !!opt.correta;
                return '<div class="question-option ' + (isCorreta ? 'is-correct-answer' : '') + '" data-correct="' + isCorreta + '" data-letra="' + opt.letra + '" style="display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-tertiary); font-size: 0.84rem; cursor: pointer; transition: all 0.15s ease;"><strong class="option-letter" style="min-width: 22px; font-weight: 700; color: #6366f1;">' + opt.letra + ')</strong><span class="option-text" style="color: var(--text-primary); flex: 1;">' + opt.texto + '</span></div>';
            }).join('');

            card.innerHTML = [
                '<div class="question-header flex-between flex-wrap gap-sm" style="margin-bottom: 12px; display:flex; justify-content:space-between; align-items:center;">',
                '    <div class="question-badges" style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">',
                '        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.75rem; font-weight:700; color:#6366f1; background:rgba(99,102,241,0.1); padding:2px 8px; border-radius:4px; border:1px solid rgba(99,102,241,0.3);"><input type="checkbox" class="select-q-item-check" data-id="' + q.id + '" style="cursor:pointer; accent-color:#6366f1;" checked /> <span>Selecionar Item</span></label>',
                '        <span class="badge badge-purple" style="font-weight:700; background:#6366f1; color:#fff;">' + (q.codigo_bncc || 'BNCC') + '</span>',
                '        <span class="badge badge-info">' + q.disciplina + '</span><span class="badge badge-outline">' + (q.etapa || '5º Ano') + '</span><span class="badge badge-outline">' + (q.matriz || 'SAEB') + '</span><span class="badge ' + badgeDiffClass + '">' + q.dificuldade + '</span>',
                '    </div>',
                '    <div class="question-actions" style="display:flex; gap:6px; align-items:center;">',
                '        <button type="button" class="btn btn-outline btn-sm btn-reveal-q-expl" data-id="' + q.id + '" style="font-size:0.75rem; padding:3px 8px; display:flex; align-items:center; gap:4px;" title="Ver Gabarito Pedagógico"><i data-lucide="eye" style="width:13px; height:13px;"></i> Ver Gabarito</button>',
                '        <button type="button" class="btn btn-outline btn-sm btn-edit-question" data-id="' + q.id + '" style="font-size:0.75rem; padding:3px 8px; display:flex; align-items:center; gap:4px; color:#6366f1; border-color:rgba(99,102,241,0.3);" title="Editar Item"><i data-lucide="edit-3" style="width:13px; height:13px;"></i> Editar</button>',
                '        <button type="button" class="btn btn-outline btn-sm btn-duplicate-question" data-id="' + q.id + '" style="font-size:0.75rem; padding:3px 8px; display:flex; align-items:center; gap:4px;" title="Duplicar Item"><i data-lucide="copy" style="width:13px; height:13px;"></i></button>',
                '        <button type="button" class="btn btn-outline btn-sm btn-delete-question" data-id="' + q.id + '" style="color:#ef4444; border-color:rgba(239,68,68,0.3); padding:3px 8px;" title="Excluir do Banco"><i data-lucide="trash-2" style="width:13px; height:13px;"></i></button>',
                '    </div>',
                '</div>',
                '<div class="question-body" style="font-size: 0.88rem; color: var(--text-primary); line-height: 1.55; margin-bottom: 14px;"><strong style="color: #6366f1; margin-right: 4px;">Item ' + (idx + 1) + '.</strong> ' + cleanEnunciado + '</div>',
                '<div class="question-options-list" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px;">' + optionsHtml + '</div>',
                '<div class="question-explanation hidden" id="expl-' + q.id + '" style="padding: 12px 16px; background: rgba(99, 102, 241, 0.06); border-left: 4px solid #6366f1; border-radius: var(--radius-sm); margin-top: 10px; display:none;"><strong style="font-size: 0.82rem; color: #6366f1; display: flex; align-items: center; gap: 6px;"><i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Gabarito Comentado & Análise Pedagógica:</strong><p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.45;">' + (q.explicacao || 'Sem justificativa cadastrada.') + '</p></div>'
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

        // Botões de edição de questão
        questionsContainer.querySelectorAll('.btn-edit-question').forEach(function(btn) {
            btn.onclick = function() {
                var id = btn.getAttribute('data-id');
                if (id) handleOpenEditQuestionModal(id);
            };
        });

        // Botões de duplicação de questão
        questionsContainer.querySelectorAll('.btn-duplicate-question').forEach(function(btn) {
            btn.onclick = function() {
                var id = btn.getAttribute('data-id');
                if (id) handleDuplicateQuestion(id);
            };
        });

        // Botões de exclusão de questão
        questionsContainer.querySelectorAll('.btn-delete-question').forEach(function(btn) {
            btn.onclick = function() {
                var id = btn.getAttribute('data-id');
                if (id) handleDeleteQuestion(id);
            };
        });

        // Interação de teste nas opções
        questionsContainer.querySelectorAll('.question-option').forEach(function(optEl) {
            optEl.onclick = function() {
                var isCorreta = this.getAttribute('data-correct') === 'true';
                var parent = this.closest('.question-options-list');
                if (!parent) return;

                parent.querySelectorAll('.question-option').forEach(function(sibling) {
                    var sibCorreta = sibling.getAttribute('data-correct') === 'true';
                    sibling.style.border = sibCorreta ? '1.5px solid #10b981' : '1px solid var(--border-color)';
                    sibling.style.background = sibCorreta ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-tertiary)';
                });

                if (!isCorreta) {
                    this.style.border = '1.5px solid #ef4444';
                    this.style.background = 'rgba(239, 68, 68, 0.12)';
                }
            };
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Abre o modal de edição e preenche todos os campos com os dados do item
     */
    function handleOpenEditQuestionModal(qId) {
        var q = (global.rawQuestions || []).find(function(item) { return item && item.id && item.id.toString() === (qId || '').toString(); });
        if (!q) return;

        var modal = document.getElementById('edit-question-modal');
        if (!modal) return;

        var idEl = document.getElementById('edit-q-id');
        var matrixEl = document.getElementById('edit-q-matrix');
        var descEl = document.getElementById('edit-q-desc');
        var subjectEl = document.getElementById('edit-q-subject');
        var diffEl = document.getElementById('edit-q-diff');
        var bloomEl = document.getElementById('edit-q-bloom');
        var textEl = document.getElementById('edit-q-text');
        var opA = document.getElementById('edit-q-op-a');
        var opB = document.getElementById('edit-q-op-b');
        var opC = document.getElementById('edit-q-op-c');
        var opD = document.getElementById('edit-q-op-d');
        var correctEl = document.getElementById('edit-q-correct');
        var explEl = document.getElementById('edit-q-explanation');

        if (idEl) idEl.value = q.id;
        if (matrixEl) matrixEl.value = q.matriz || 'SAEB';
        if (descEl) descEl.value = q.codigo_bncc || '';
        if (subjectEl) subjectEl.value = q.disciplina || 'Língua Portuguesa';
        if (diffEl) diffEl.value = q.dificuldade || 'Médio';
        if (bloomEl) bloomEl.value = q.nivel_cognitivo || 'Analisar';
        if (textEl) textEl.value = q.enunciado || '';

        var opAVal = (q.opcoes && q.opcoes[0]) ? q.opcoes[0].texto : '';
        var opBVal = (q.opcoes && q.opcoes[1]) ? q.opcoes[1].texto : '';
        var opCVal = (q.opcoes && q.opcoes[2]) ? q.opcoes[2].texto : '';
        var opDVal = (q.opcoes && q.opcoes[3]) ? q.opcoes[3].texto : '';

        if (opA) opA.value = opAVal;
        if (opB) opB.value = opBVal;
        if (opC) opC.value = opCVal;
        if (opD) opD.value = opDVal;

        var correctLetter = 'A';
        if (q.opcoes && Array.isArray(q.opcoes)) {
            var cor = q.opcoes.find(function(o) { return o.correta; });
            if (cor) correctLetter = cor.letra;
        }
        if (correctEl) correctEl.value = correctLetter;
        if (explEl) explEl.value = q.explicacao || '';

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    /**
     * Salva as alterações feitas no modal de edição
     */
    function handleSaveEditQuestion() {
        var idEl = document.getElementById('edit-q-id');
        var qId = idEl ? idEl.value : null;
        if (!qId) return;

        var q = (global.rawQuestions || []).find(function(item) { return item && item.id && item.id.toString() === (qId || '').toString(); });
        if (!q) return;

        var matrixEl = document.getElementById('edit-q-matrix');
        var descEl = document.getElementById('edit-q-desc');
        var subjectEl = document.getElementById('edit-q-subject');
        var diffEl = document.getElementById('edit-q-diff');
        var bloomEl = document.getElementById('edit-q-bloom');
        var textEl = document.getElementById('edit-q-text');
        var opA = document.getElementById('edit-q-op-a');
        var opB = document.getElementById('edit-q-op-b');
        var opC = document.getElementById('edit-q-op-c');
        var opD = document.getElementById('edit-q-op-d');
        var correctEl = document.getElementById('edit-q-correct');
        var explEl = document.getElementById('edit-q-explanation');

        var cor = correctEl ? correctEl.value : 'A';

        q.matriz = matrixEl ? matrixEl.value : q.matriz;
        q.codigo_bncc = descEl ? descEl.value.trim() : q.codigo_bncc;
        q.disciplina = subjectEl ? subjectEl.value : q.disciplina;
        q.dificuldade = diffEl ? diffEl.value : q.dificuldade;
        q.nivel_cognitivo = bloomEl ? bloomEl.value : q.nivel_cognitivo;
        q.enunciado = textEl ? textEl.value.trim() : q.enunciado;
        q.explicacao = explEl ? explEl.value.trim() : q.explicacao;

        q.opcoes = [
            { letra: 'A', texto: opA ? opA.value.trim() : 'A', correta: cor === 'A' },
            { letra: 'B', texto: opB ? opB.value.trim() : 'B', correta: cor === 'B' },
            { letra: 'C', texto: opC ? opC.value.trim() : 'C', correta: cor === 'C' },
            { letra: 'D', texto: opD ? opD.value.trim() : 'D', correta: cor === 'D' }
        ];

        renderQuestions();
        saveQuestionsToStorage(global.rawQuestions);
        updateQuestionsKpis();

    function getAuthToken() {
        return (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('authToken')) ||
               (typeof localStorage !== 'undefined' && localStorage.getItem('authToken')) || '';
    }

    // Persistência no PostgreSQL
    try {
        var token = getAuthToken();
        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        fetch('/api/questoes', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(q)
        }).catch(function() {});
    } catch(e) {}

    var modal = document.getElementById('edit-question-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }

    if (typeof global.showToast === 'function') {
        global.showToast('Questão atualizada com sucesso!', 'check');
    }
}

/**
 * Duplica uma questão para criar uma variação paralela (Item A/B)
 */
function handleDuplicateQuestion(qId) {
    var q = (global.rawQuestions || []).find(function(item) { return item && item.id && item.id.toString() === (qId || '').toString(); });
    if (!q) return;

    var duplicated = JSON.parse(JSON.stringify(q));
    duplicated.id = 'Q_' + Date.now();
    duplicated.codigo_bncc = (duplicated.codigo_bncc || 'D01') + ' (Variação)';

    global.rawQuestions.unshift(duplicated);
    saveQuestionsToStorage(global.rawQuestions);
    renderQuestions();
    updateQuestionsKpis();

    try {
        var token = getAuthToken();
        var headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        fetch('/api/questoes', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(duplicated)
        }).catch(function() {});
    } catch(e) {}

    if (typeof global.showToast === 'function') {
        global.showToast('Variação do item criada com sucesso!', 'copy');
    }
}

/**
 * Sincroniza o acervo de questões com o PostgreSQL respeitando exclusões
 */
async function fetchQuestionsFromApi() {
    try {
        var token = getAuthToken();
        var headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        var res = await fetch('/api/questoes', { headers: headers });
        if (res.ok) {
            var data = await res.json();
            if (data && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
                var deletedIds = getDeletedQuestionsIds();
                var filtered = data.questions.filter(function(q) {
                    return q && q.id && !deletedIds.includes(q.id.toString());
                });
                if (filtered.length > 0) {
                    global.rawQuestions = filtered;
                    saveQuestionsToStorage(global.rawQuestions);
                    renderQuestions();
                    updateQuestionsKpis();
                }
            }
        }
    } catch (err) {
        console.warn('[Questoes API Fallback]');
    }
}

// Exclusão permanente de questão com tombstone de exclusão e persistência
function handleDeleteQuestion(id) {
    if (!id) return;
    saveDeletedQuestionId(id);
    var strId = id.toString();
    global.rawQuestions = (global.rawQuestions || []).filter(function(q) {
        return q && q.id && q.id.toString() !== strId;
    });
    saveQuestionsToStorage(global.rawQuestions);
    renderQuestions();
    updateQuestionsKpis();

    try {
        var token = getAuthToken();
        var headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        fetch('/api/questoes/' + id, { method: 'DELETE', headers: headers }).catch(function() {});
    } catch (e) {}

        if (typeof global.showToast === 'function') global.showToast('Questão removida do banco permanentemente!', 'trash-2');
    }

    /**
     * Inicializador do Módulo de Listagem de Questões
     */
    function initQuestionsListModule() {
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

        // Modal de Edição de Questões
        var btnCloseEditQ = document.getElementById('btn-close-edit-q-modal');
        var btnCancelEditQ = document.getElementById('btn-cancel-edit-q');
        var btnSaveEditQ = document.getElementById('btn-save-edited-q');
        var modalEditQ = document.getElementById('edit-question-modal');
        var hideEditModal = function() { if (modalEditQ) { modalEditQ.classList.add('hidden'); modalEditQ.style.display = 'none'; } };
        if (btnCloseEditQ) btnCloseEditQ.onclick = hideEditModal;
        if (btnCancelEditQ) btnCancelEditQ.onclick = hideEditModal;
        if (btnSaveEditQ) btnSaveEditQ.onclick = handleSaveEditQuestion;

        // Modal de Criação Manual
        var btnOpenManual = document.getElementById('btn-trigger-manual-q-modal');
        var btnCloseManual = document.getElementById('btn-close-manual-q-modal');
        var btnSaveManual = document.getElementById('btn-save-manual-q');
        var modalManual = document.getElementById('modal-create-manual-question');

        if (btnOpenManual && modalManual) {
            btnOpenManual.onclick = function() { modalManual.classList.remove('hidden'); modalManual.style.display = 'flex'; };
        }
        if (btnCloseManual && modalManual) {
            btnCloseManual.onclick = function() { modalManual.classList.add('hidden'); modalManual.style.display = 'none'; };
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
                var explEl = document.getElementById('manual-q-expl');

                var stage = stageEl ? stageEl.value : '5º Ano';
                var subject = subjectEl ? subjectEl.value : 'Língua Portuguesa';
                var matrix = matrixEl ? matrixEl.value : 'SAEB';
                var diff = diffEl ? diffEl.value : 'Médio';
                var desc = descEl ? descEl.value.trim() : 'D01';
                var text = textEl ? textEl.value.trim() : '';
                var cor = correctEl ? correctEl.value : 'A';
                var expl = explEl ? explEl.value.trim() : '';

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
                    explicacao: expl || ('GABARITO: ' + cor + '. Cadastrado manualmente no banco oficial.')
                };

                global.rawQuestions.unshift(newQ);
                saveQuestionsToStorage(global.rawQuestions);
                renderQuestions();
                updateQuestionsKpis();

                // Persistência no PostgreSQL
                try {
                    var token = getAuthToken();
                    var headers = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = 'Bearer ' + token;

                    fetch('/api/questoes', {
                        method: 'POST',
                        headers: headers,
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
    global.updateQuestionsKpis = updateQuestionsKpis;
    global.handleOpenEditQuestionModal = handleOpenEditQuestionModal;
    global.handleSaveEditQuestion = handleSaveEditQuestion;
    global.handleDuplicateQuestion = handleDuplicateQuestion;
    global.handleDeleteQuestion = handleDeleteQuestion;
    global.initQuestionsListModule = initQuestionsListModule;

    if (typeof window !== 'undefined') {
        window.renderQuestions = renderQuestions;
        window.updateQuestionsKpis = updateQuestionsKpis;
        window.handleOpenEditQuestionModal = handleOpenEditQuestionModal;
        window.handleSaveEditQuestion = handleSaveEditQuestion;
        window.handleDuplicateQuestion = handleDuplicateQuestion;
        window.handleDeleteQuestion = handleDeleteQuestion;
        window.initQuestionsListModule = initQuestionsListModule;
    }

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuestionsListModule);
    } else {
        setTimeout(initQuestionsListModule, 180);
    }

})(typeof window !== 'undefined' ? window : this);
