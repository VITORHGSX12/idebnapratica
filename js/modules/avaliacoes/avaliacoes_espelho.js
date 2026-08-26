/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — ESPELHO DE DIGITAÇÃO RÁPIDA & CORREÇÃO EM TEMPO REAL
 * Arquivo: js/modules/avaliacoes/avaliacoes_espelho.js
 * Descrição: Entrada rápida orientada a teclado (auto-avanço A-E, setas, backspace),
 *            alternância de presença, auto-save com debounce de 1200ms e cálculo das 4 faixas.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var debounceSaveTimeout = null;
    var currentActiveEvent = null;
    var currentActiveSchool = null;
    var currentActiveTurma = null;

    // -------------------------------------------------------------------------
    // 1. POVOAMENTO DOS SELETORES EM CASCATA (EVENTO > ESCOLA > TURMA)
    // -------------------------------------------------------------------------

    function initEspelhoSelectors() {
        var evalSelect = document.getElementById('score-eval-select');
        var schoolSelect = document.getElementById('score-school-select');
        var classSelect = document.getElementById('score-class-select');
        if (!evalSelect || !schoolSelect || !classSelect) return;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        evalSelect.innerHTML = eventos.map(function(ev) {
            return `<option value="${ev.id}">${ev.titulo} (${ev.status})</option>`;
        }).join('');

        if (eventos.length > 0) {
            evalSelect.value = eventos[0].id;
        }

        evalSelect.onchange = function() {
            carregarEscolasParaEspelho();
        };

        schoolSelect.onchange = function() {
            carregarTurmasParaEspelho();
        };

        classSelect.onchange = function() {
            renderEspelhoLancamentoTable();
        };

        carregarEscolasParaEspelho();
    }

    function carregarEscolasParaEspelho() {
        var schoolSelect = document.getElementById('score-school-select');
        if (!schoolSelect) return;

        var escolas = global.dbEscolas || [
            { id: 'esc_01', nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS' },
            { id: 'esc_02', nome: 'U I BASILIO ALVES' },
            { id: 'esc_03', nome: 'UI JOSE CORREA LIMA' },
            { id: 'esc_04', nome: 'UE ANITA FURTADO' },
            { id: 'esc_05', nome: 'UI EMILIO MURAD' }
        ];

        schoolSelect.innerHTML = escolas.map(function(esc) {
            return `<option value="${esc.id}">${esc.nome}</option>`;
        }).join('');

        if (escolas.length > 0) {
            schoolSelect.value = escolas[0].id;
        }

        carregarTurmasParaEspelho();
    }

    function carregarTurmasParaEspelho() {
        var classSelect = document.getElementById('score-class-select');
        if (!classSelect) return;

        var turmas = global.dbTurmas || [
            { id: 'turma_5a', nome: '5º Ano A — Matutino' },
            { id: 'turma_5b', nome: '5º Ano B — Vespertino' },
            { id: 'turma_9a', nome: '9º Ano A — Matutino' }
        ];

        classSelect.innerHTML = turmas.map(function(t) {
            return `<option value="${t.id}">${t.nome}</option>`;
        }).join('');

        if (turmas.length > 0) {
            classSelect.value = turmas[0].id;
        }

        renderEspelhoLancamentoTable();
    }

    // -------------------------------------------------------------------------
    // 2. RENDERIZAÇÃO DO ESPELHO DE DIGITAÇÃO DOS ALUNOS
    // -------------------------------------------------------------------------

    function irParaEspelhoLancamento(eventoId) {
        if (typeof global.switchIdebSubtab === 'function') {
            global.switchIdebSubtab('lancar-notas-sub');
        }
        var evalSelect = document.getElementById('score-eval-select');
        if (evalSelect && eventoId) {
            evalSelect.value = eventoId;
            carregarEscolasParaEspelho();
        }

        var btnLancarTab = document.querySelector('[data-subtab="lancar-notas-sub"]');
        if (btnLancarTab) btnLancarTab.click();
    }

    function getAlunosMockPorTurma(turmaId) {
        var rawAlunos = global.dbAlunos || [];
        if (rawAlunos.length > 0) return rawAlunos.slice(0, 15);

        return [
            { id: 'al_001', matricula: '2026001', nome: 'Ana Clara Silva Santos' },
            { id: 'al_002', matricula: '2026002', nome: 'Lucas Gabriel Oliveira' },
            { id: 'al_003', matricula: '2026003', nome: 'Maria Eduarda Fernandes' },
            { id: 'al_004', matricula: '2026004', nome: 'João Pedro Carvalho' },
            { id: 'al_005', matricula: '2026005', nome: 'Beatriz Costa Lima' },
            { id: 'al_006', matricula: '2026006', nome: 'Guilherme Souza Ramos' },
            { id: 'al_007', matricula: '2026007', nome: 'Larissa Alves Moreira' },
            { id: 'al_008', matricula: '2026008', nome: 'Matheus Henrique Cruz' },
            { id: 'al_009', matricula: '2026009', nome: 'Yasmin Ribeiro Dias' },
            { id: 'al_010', matricula: '2026010', nome: 'Enzo Gabriel Castro' }
        ];
    }

    function renderEspelhoLancamentoTable() {
        var evalSelect = document.getElementById('score-eval-select');
        var schoolSelect = document.getElementById('score-school-select');
        var classSelect = document.getElementById('score-class-select');
        var placeholder = document.getElementById('score-table-placeholder');
        var content = document.getElementById('score-table-content');
        var tbody = document.getElementById('score-students-table-body');

        if (!evalSelect || !schoolSelect || !classSelect || !tbody) return;

        var eventoId = evalSelect.value;
        var escolaId = schoolSelect.value;
        var turmaId = classSelect.value;

        if (!eventoId || !escolaId || !turmaId) {
            if (placeholder) placeholder.classList.remove('hidden');
            if (content) content.classList.add('hidden');
            return;
        }

        if (placeholder) placeholder.classList.add('hidden');
        if (content) content.classList.remove('hidden');

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var ev = eventos.find(function(e) { return e.id === eventoId; }) || eventos[0];
        currentActiveEvent = ev;
        currentActiveSchool = escolaId;
        currentActiveTurma = turmaId;

        var numQuestoes = ev ? (ev.qtdQuestoes || 20) : 20;
        var isLocked = ev && ev.status === 'ENCERRADO';

        var gabaritoOficial = [];
        try {
            var parsed = JSON.parse(ev.gabaritoGeralJson);
            if (Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0].gabarito)) {
                gabaritoOficial = parsed[0].gabarito;
            }
        } catch(e) {}

        while (gabaritoOficial.length < numQuestoes) {
            gabaritoOficial.push(['A', 'B', 'C', 'D'][gabaritoOficial.length % 4]);
        }

        var alunos = getAlunosMockPorTurma(turmaId);
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        var key = eventoId + '_' + escolaId + '_' + turmaId;
        var turmaRespostas = respostasDb[key] || {};

        tbody.innerHTML = alunos.map(function(aluno, aIdx) {
            var alData = turmaRespostas[aluno.id] || {
                statusPresenca: 'PRESENTE',
                respostas: Array.from({ length: numQuestoes }).map(function(_, i) {
                    return (Math.random() < 0.75) ? gabaritoOficial[i] : ['A','B','C','D'][Math.floor(Math.random()*4)];
                })
            };

            var presenca = alData.statusPresenca || 'PRESENTE';
            var isAusente = presenca !== 'PRESENTE';

            var resultado = typeof global.processarCorrecaoAluno === 'function'
                ? global.processarCorrecaoAluno({ respostas: alData.respostas, gabarito: gabaritoOficial, statusPresenca: presenca })
                : { acertos: 0, percentual: 0, situacao: presenca, corClass: '#64748b', emoji: '⚪' };

            var inputsHtml = Array.from({ length: numQuestoes }).map(function(_, qIdx) {
                var val = (alData.respostas && alData.respostas[qIdx]) ? alData.respostas[qIdx].toUpperCase() : '';
                var isCorreta = val && gabaritoOficial[qIdx] && val === gabaritoOficial[qIdx];
                var cellBg = val ? (isCorreta ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)') : 'transparent';
                var cellColor = val ? (isCorreta ? '#10b981' : '#ef4444') : 'inherit';

                return `
                    <input 
                        type="text" 
                        class="resp-input q-cell-${aIdx}" 
                        data-aluno-idx="${aIdx}" 
                        data-questao-idx="${qIdx}" 
                        data-aluno-id="${aluno.id}"
                        maxlength="1" 
                        value="${val}" 
                        ${isLocked || isAusente ? 'disabled' : ''}
                        style="width: 26px; height: 28px; text-align: center; font-weight: 800; font-family: var(--font-mono); font-size: 12px; border-radius: 4px; border: 1px solid var(--color-border-subtle); background: ${cellBg}; color: ${cellColor}; padding: 0; text-transform: uppercase; outline: none; margin: 0 1px;"
                    />
                `;
            }).join('');

            return `
                <tr id="row-aluno-${aluno.id}" style="border-bottom: 1px solid var(--color-border-subtle); height: 52px; ${isAusente ? 'opacity: 0.5; background: var(--color-surface-subtle);' : ''}">
                    <td style="padding: 10px 14px; font-family: var(--font-mono); font-size: 11px; color: var(--color-text-secondary); width: 80px;">
                        ${aluno.matricula}
                    </td>
                    <td style="padding: 10px 14px; font-size: var(--text-xs); font-weight: 700; color: var(--color-brand-primary); min-width: 180px;">
                        ${aluno.nome}
                    </td>
                    <td style="padding: 10px 14px; text-align: center; width: 140px;">
                        <button type="button" onclick="alternarPresencaAluno('${aluno.id}', '${presenca}')" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 2px 8px; height: 26px; border-radius: var(--radius-pill); font-weight: 700;">
                            ${presenca === 'PRESENTE' ? '🟢 Presente' : '🔴 Ausente'}
                        </button>
                    </td>
                    <td style="padding: 8px 10px; text-align: center; white-space: nowrap;">
                        <div style="display: inline-flex; align-items: center;">
                            ${inputsHtml}
                        </div>
                    </td>
                    <td style="padding: 10px 14px; text-align: center; width: 140px;" id="res-col-${aluno.id}">
                        <div style="font-weight: 800; font-size: 13px; color: ${resultado.corClass};">
                            ${isAusente ? '—' : resultado.acertos + ' / ' + numQuestoes + ' (' + resultado.percentual + '%)'}
                        </div>
                        <div style="font-size: 10px; font-weight: 700; color: ${resultado.corClass}; margin-top: 1px;">
                            ${resultado.emoji} ${resultado.situacao}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        attachKeyboardDataEntryEvents();
    }

    // -------------------------------------------------------------------------
    // 3. KEYBOARD-DRIVEN DATA ENTRY (AUTO-AVANÇO & NAVEGAÇÃO POR SETAS)
    // -------------------------------------------------------------------------

    function attachKeyboardDataEntryEvents() {
        var inputs = document.querySelectorAll('.resp-input');

        inputs.forEach(function(inp) {
            inp.addEventListener('input', function(e) {
                var char = (this.value || '').toUpperCase();
                var validOptions = ['A', 'B', 'C', 'D', 'E'];

                if (!validOptions.includes(char)) {
                    this.value = '';
                    recalcularLinhaAluno(this.getAttribute('data-aluno-id'));
                    return;
                }

                this.value = char;
                recalcularLinhaAluno(this.getAttribute('data-aluno-id'));
                triggerDebounceAutoSave();

                // Auto-avanço para a próxima questão
                var aIdx = parseInt(this.getAttribute('data-aluno-idx'), 10);
                var qIdx = parseInt(this.getAttribute('data-questao-idx'), 10);
                var nextInput = document.querySelector(`.resp-input[data-aluno-idx="${aIdx}"][data-questao-idx="${qIdx + 1}"]`);
                if (nextInput && !nextInput.disabled) {
                    nextInput.focus();
                    nextInput.select();
                }
            });

            inp.addEventListener('keydown', function(e) {
                var aIdx = parseInt(this.getAttribute('data-aluno-idx'), 10);
                var qIdx = parseInt(this.getAttribute('data-questao-idx'), 10);

                if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    var next = document.querySelector(`.resp-input[data-aluno-idx="${aIdx}"][data-questao-idx="${qIdx + 1}"]`);
                    if (next) { next.focus(); next.select(); }
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    var prev = document.querySelector(`.resp-input[data-aluno-idx="${aIdx}"][data-questao-idx="${qIdx - 1}"]`);
                    if (prev) { prev.focus(); prev.select(); }
                } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault();
                    var down = document.querySelector(`.resp-input[data-aluno-idx="${aIdx + 1}"][data-questao-idx="${qIdx}"]`);
                    if (down && !down.disabled) { down.focus(); down.select(); }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    var up = document.querySelector(`.resp-input[data-aluno-idx="${aIdx - 1}"][data-questao-idx="${qIdx}"]`);
                    if (up && !up.disabled) { up.focus(); up.select(); }
                } else if (e.key === 'Backspace' && !this.value) {
                    var back = document.querySelector(`.resp-input[data-aluno-idx="${aIdx}"][data-questao-idx="${qIdx - 1}"]`);
                    if (back && !back.disabled) { back.focus(); back.select(); }
                }
            });
        });
    }

    function recalcularLinhaAluno(alunoId) {
        var row = document.getElementById('row-aluno-' + alunoId);
        var resCol = document.getElementById('res-col-' + alunoId);
        if (!row || !resCol) return;

        var inputs = row.querySelectorAll('.resp-input');
        var respostas = [];
        inputs.forEach(function(i) { respostas.push(i.value.trim().toUpperCase()); });

        var gabaritoOficial = [];
        try {
            var parsed = JSON.parse(currentActiveEvent.gabaritoGeralJson);
            if (Array.isArray(parsed) && parsed[0] && Array.isArray(parsed[0].gabarito)) {
                gabaritoOficial = parsed[0].gabarito;
            }
        } catch(e) {}

        var resultado = typeof global.processarCorrecaoAluno === 'function'
            ? global.processarCorrecaoAluno({ respostas: respostas, gabarito: gabaritoOficial, statusPresenca: 'PRESENTE' })
            : { acertos: 0, percentual: 0, situacao: 'PRESENTE', corClass: '#64748b', emoji: '⚪' };

        inputs.forEach(function(i, qIdx) {
            var val = i.value.trim().toUpperCase();
            var isCorreta = val && gabaritoOficial[qIdx] && val === gabaritoOficial[qIdx];
            i.style.background = val ? (isCorreta ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)') : 'transparent';
            i.style.color = val ? (isCorreta ? '#10b981' : '#ef4444') : 'inherit';
        });

        resCol.innerHTML = `
            <div style="font-weight: 800; font-size: 13px; color: ${resultado.corClass};">
                ${resultado.acertos} / ${inputs.length} (${resultado.percentual}%)
            </div>
            <div style="font-size: 10px; font-weight: 700; color: ${resultado.corClass}; margin-top: 1px;">
                ${resultado.emoji} ${resultado.situacao}
            </div>
        `;
    }

    function alternarPresencaAluno(alunoId, currentPresenca) {
        var newPresenca = (currentPresenca === 'PRESENTE') ? 'AUSENTE' : 'PRESENTE';
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        var key = currentActiveEvent.id + '_' + currentActiveSchool + '_' + currentActiveTurma;

        if (!respostasDb[key]) respostasDb[key] = {};
        if (!respostasDb[key][alunoId]) respostasDb[key][alunoId] = { respostas: [] };
        
        respostasDb[key][alunoId].statusPresenca = newPresenca;
        if (typeof global.saveRespostasState === 'function') global.saveRespostasState(respostasDb);

        renderEspelhoLancamentoTable();
        if (typeof global.showToast === 'function') global.showToast('Presença atualizada para ' + newPresenca, 'check');
    }

    function triggerDebounceAutoSave() {
        if (debounceSaveTimeout) clearTimeout(debounceSaveTimeout);
        
        debounceSaveTimeout = setTimeout(function() {
            salvarLoteRespostasTurma(true);
        }, 1200);
    }

    function salvarLoteRespostasTurma(isAutoSave) {
        if (!currentActiveEvent || !currentActiveSchool || !currentActiveTurma) return;

        var key = currentActiveEvent.id + '_' + currentActiveSchool + '_' + currentActiveTurma;
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        if (!respostasDb[key]) respostasDb[key] = {};

        var rows = document.querySelectorAll('#score-students-table-body tr');
        rows.forEach(function(r) {
            var alunoId = r.id.replace('row-aluno-', '');
            var inputs = r.querySelectorAll('.resp-input');
            var respostas = [];
            inputs.forEach(function(i) { respostas.push(i.value.trim().toUpperCase()); });

            if (!respostasDb[key][alunoId]) respostasDb[key][alunoId] = {};
            respostasDb[key][alunoId].respostas = respostas;
        });

        if (typeof global.saveRespostasState === 'function') global.saveRespostasState(respostasDb);

        if (isAutoSave) {
            if (typeof global.showToast === 'function') global.showToast('Auto-save: todas as alterações salvas!', 'check');
        } else {
            if (typeof global.showToast === 'function') global.showToast('Lançamento da turma gravado com sucesso!', 'check');
        }
    }

    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEspelhoSelectors);
    } else {
        initEspelhoSelectors();
    }

    // Exposição Global
    global.initEspelhoSelectors = initEspelhoSelectors;
    global.carregarEscolasParaEspelho = carregarEscolasParaEspelho;
    global.carregarTurmasParaEspelho = carregarTurmasParaEspelho;
    global.irParaEspelhoLancamento = irParaEspelhoLancamento;
    global.renderEspelhoLancamentoTable = renderEspelhoLancamentoTable;
    global.alternarPresencaAluno = alternarPresencaAluno;
    global.salvarLoteRespostasTurma = salvarLoteRespostasTurma;

})(typeof window !== 'undefined' ? window : this);
