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
        var eventosAbertos = eventos.filter(function(e) { return (e.status || '').toUpperCase() === 'ABERTO'; });
        
        // Remove banner de aviso anterior se existir
        var existingBanner = document.getElementById('espelho-empty-aberto-banner');
        if (existingBanner) existingBanner.remove();

        if (eventos.length === 0 || eventosAbertos.length === 0) {
            var scoreCardBody = evalSelect.closest('.card-body');
            if (scoreCardBody && !document.getElementById('espelho-empty-aberto-banner')) {
                var banner = document.createElement('div');
                banner.id = 'espelho-empty-aberto-banner';
                banner.style.cssText = 'background: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 32px 20px; text-align: center; margin-bottom: 20px;';
                banner.innerHTML = `
                    <div style="font-size: 2.2rem; margin-bottom: 8px;">📋</div>
                    <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0;">Nenhuma avaliação aberta para lançamento no momento</h4>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto 16px auto;">Não existem avaliações com status <strong>ABERTO</strong> para digitação de notas. Publique um evento existente ou crie uma nova avaliação para iniciar o lançamento.</p>
                    <button type="button" onclick="switchTab('sec-criar-avaliacoes'); if(typeof switchAvaliacoesSubtab==='function') switchAvaliacoesSubtab('criar-evento-sub'); if(typeof window.showNewEventWizard==='function') window.showNewEventWizard();" class="btn btn-primary btn-sm" style="font-weight: 700;">
                        + Criar Nova Avaliação / Abrir Evento
                    </button>
                `;
                scoreCardBody.insertBefore(banner, scoreCardBody.firstChild);
            }
        }

        evalSelect.innerHTML = eventos.map(function(ev) {
            var isAberto = (ev.status || '').toUpperCase() === 'ABERTO';
            var prefix = isAberto ? '🟢 [ABERTO] ' : '🔒 [' + (ev.status || 'RASCUNHO') + '] ';
            return `<option value="${ev.id}">${prefix}${ev.titulo}</option>`;
        }).join('');

        // Pré-seleciona prioritariamente o evento ABERTO mais recente
        if (eventosAbertos.length > 0) {
            evalSelect.value = eventosAbertos[0].id;
        } else if (eventos.length > 0) {
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

        var allEscolas = typeof global.getOfficialSchoolsState === 'function' ? global.getOfficialSchoolsState() : (global.dbEscolas || [
            { id: 'esc_01', nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS' },
            { id: 'esc_02', nome: 'U I BASILIO ALVES' },
            { id: 'esc_03', nome: 'UI JOSE CORREA LIMA' },
            { id: 'esc_04', nome: 'UE ANITA FURTADO' },
            { id: 'esc_05', nome: 'UI EMILIO MURAD' }
        ]);

        // Validação de RBAC do usuário autenticado
        var user = global.currentUser;
        if (!user) {
            try { user = JSON.parse(localStorage.getItem('user_session') || '{}'); } catch(e) {}
        }
        var role = (user && user.role ? user.role : '').toUpperCase();
        var userEscola = (user && (user.escola_id || user.escola || user.schoolId) ? user.escola_id || user.escola || user.schoolId : '').toString().toLowerCase();

        var filteredEscolas = allEscolas;
        if (userEscola && !role.includes('ADMIN') && !role.includes('MASTER') && !role.includes('SEMED') && !role.includes('COORDENADOR_GERAL')) {
            filteredEscolas = allEscolas.filter(function(esc) {
                var escId = (esc.id || '').toString().toLowerCase();
                var escNome = (esc.nome || '').toString().toLowerCase();
                return escId.includes(userEscola) || userEscola.includes(escId) || escNome.includes(userEscola) || userEscola.includes(escNome);
            });
            if (filteredEscolas.length === 0) filteredEscolas = allEscolas;
        }

        schoolSelect.innerHTML = filteredEscolas.map(function(esc) {
            var nome = esc.nome || esc.name || esc.escola || esc.id;
            var id = esc.id || esc.codigo_inep || esc.inep || nome;
            return `<option value="${id}">${nome}</option>`;
        }).join('');

        if (filteredEscolas.length > 0) {
            var firstEsc = filteredEscolas[0];
            schoolSelect.value = firstEsc.id || firstEsc.codigo_inep || firstEsc.inep || firstEsc.nome || firstEsc.name;
        }

        carregarTurmasParaEspelho();
    }

    async function carregarTurmasParaEspelho() {
        var schoolSelect = document.getElementById('score-school-select');
        var classSelect = document.getElementById('score-class-select');
        if (!schoolSelect || !classSelect) return;

        var selectedSchoolVal = schoolSelect.value;
        var selectedSchoolText = schoolSelect.options[schoolSelect.selectedIndex] ? schoolSelect.options[schoolSelect.selectedIndex].text : '';

        var allClasses = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState() : (global.dbTurmas || []);
        
        // Se a lista de turmas estiver vazia, busca da API
        if (allClasses.length === 0) {
            try {
                var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
                var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                var res = await fetch('/api/classes', { headers: headers });
                if (res.ok) {
                    var data = await res.json();
                    if (Array.isArray(data)) {
                        allClasses = data;
                        if (typeof global.saveOfficialClassesState === 'function') global.saveOfficialClassesState(data);
                    }
                }
            } catch(e) {
                console.warn('[Espelho Load Classes API Fallback]', e);
            }
        }

        var filteredTurmas = allClasses.filter(function(t) {
            var matchId = (t.escola_id && t.escola_id.toString() === selectedSchoolVal.toString());
            var matchNome = (t.escola && (t.escola.toUpperCase().includes(selectedSchoolText.toUpperCase()) || selectedSchoolText.toUpperCase().includes(t.escola.toUpperCase())));
            return matchId || matchNome;
        });

        if (filteredTurmas.length === 0) {
            filteredTurmas = allClasses;
        }

        classSelect.innerHTML = filteredTurmas.map(function(t) {
            var label = t.nome + (t.serie ? ' (' + t.serie + ')' : '');
            return `<option value="${t.id}">${label}</option>`;
        }).join('');

        if (filteredTurmas.length > 0) {
            classSelect.value = filteredTurmas[0].id;
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

    async function getAlunosReaisPorTurma(turmaId, escolaNome, turmaNome) {
        // 1. Tentar buscar da API de turma
        if (turmaId && !turmaId.startsWith('turma_')) {
            try {
                var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
                var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
                var res = await fetch('/api/classes/' + encodeURIComponent(turmaId) + '/students', { headers: headers });
                if (res.ok) {
                    var apiAlunos = await res.json();
                    if (Array.isArray(apiAlunos) && apiAlunos.length > 0) return apiAlunos;
                }
            } catch(e) {}
        }

        // 2. Buscar do estado local de estudantes
        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : (global.dbAlunos || []);
        var filtered = allStudents.filter(function(st) {
            var matchTurma = (st.turmaId === turmaId) || (turmaNome && st.turma && st.turma.toUpperCase() === turmaNome.toUpperCase());
            var matchEscola = !escolaNome || (st.escola && (st.escola.toUpperCase().includes(escolaNome.toUpperCase()) || escolaNome.toUpperCase().includes(st.escola.toUpperCase())));
            return matchTurma && matchEscola;
        });

        return filtered;
    }

    async function renderEspelhoLancamentoTable() {
        var evalSelect = document.getElementById('score-eval-select');
        var schoolSelect = document.getElementById('score-school-select');
        var classSelect = document.getElementById('score-class-select');
        var placeholder = document.getElementById('score-table-placeholder');
        var content = document.getElementById('score-table-content');
        var tbody = document.getElementById('score-students-table-body');

        if (!evalSelect || !schoolSelect || !classSelect || !tbody) return;

        var eventoId = evalSelect.value;
        var escolaId = schoolSelect.value;
        var escolaNome = schoolSelect.options[schoolSelect.selectedIndex] ? schoolSelect.options[schoolSelect.selectedIndex].text : '';
        var turmaId = classSelect.value;
        var turmaNome = classSelect.options[classSelect.selectedIndex] ? classSelect.options[classSelect.selectedIndex].text : '';

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

        var alunos = await getAlunosReaisPorTurma(turmaId, escolaNome, turmaNome);
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        var key = eventoId + '_' + escolaId + '_' + turmaId;
        var turmaRespostas = respostasDb[key] || {};

        if (alunos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + (numQuestoes + 5) + '" style="padding: 32px; text-align: center; color: var(--color-text-muted);">Nenhum estudante matriculado nesta turma para lançamento.</td></tr>';
            return;
        }

        tbody.innerHTML = alunos.map(function(aluno, aIdx) {
            var alData = turmaRespostas[aluno.id] || {
                statusPresenca: 'PRESENTE',
                respostas: Array.from({ length: numQuestoes }).map(function() { return ''; })
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
