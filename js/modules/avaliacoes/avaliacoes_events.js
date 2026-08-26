/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — CICLO DE VIDA DE EVENTOS AVALIATIVOS & WIZARD
 * Arquivo: js/modules/avaliacoes/avaliacoes_events.js
 * Descrição: Máquina de estados (Rascunho, Aberto, Encerrado), listagem executiva,
 *            assistente de 4 passos com matriz de gabarito e habilidades por etapa.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var currentFilterTab = 'ativos';
    var wizardEditingEventId = null;
    var wizardCurrentStep = 1;

    // -------------------------------------------------------------------------
    // 1. RENDERIZAÇÃO DA TABELA DE EVENTOS AVALIATIVOS
    // -------------------------------------------------------------------------

    function filterEventosList(filterName) {
        currentFilterTab = filterName || 'ativos';
        
        var links = document.querySelectorAll('.event-filter-link');
        links.forEach(function(l) {
            var f = l.getAttribute('data-filter');
            if (f === currentFilterTab) {
                l.classList.add('active');
                l.style.color = 'var(--color-accent-primary, #6366f1)';
                l.style.fontWeight = '700';
                l.style.borderBottom = '2px solid var(--color-accent-primary, #6366f1)';
            } else {
                l.classList.remove('active');
                l.style.color = 'var(--color-text-secondary, #64748b)';
                l.style.fontWeight = '500';
                l.style.borderBottom = 'none';
            }
        });

        renderEventosTable();
    }

    function renderEventosTable() {
        var tbody = document.getElementById('created-events-table-body');
        if (!tbody) return;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        
        // Contadores dos filtros
        var countAtivos = eventos.filter(function(e) { return e.status === 'ABERTO'; }).length;
        var countRascunhos = eventos.filter(function(e) { return e.status === 'RASCUNHO'; }).length;
        var countFinalizados = eventos.filter(function(e) { return e.status === 'ENCERRADO'; }).length;

        var elAtivos = document.getElementById('filter-count-ativos');
        var elRascunhos = document.getElementById('filter-count-rascunhos');
        var elFinalizados = document.getElementById('filter-count-finalizados');

        if (elAtivos) elAtivos.textContent = 'Ativos (' + countAtivos + ')';
        if (elRascunhos) elRascunhos.textContent = 'Rascunhos (' + countRascunhos + ')';
        if (elFinalizados) elFinalizados.textContent = 'Finalizados (' + countFinalizados + ')';

        var filtered = eventos.filter(function(e) {
            if (currentFilterTab === 'ativos') return e.status === 'ABERTO';
            if (currentFilterTab === 'rascunhos') return e.status === 'RASCUNHO';
            if (currentFilterTab === 'finalizados') return e.status === 'ENCERRADO';
            return true;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="padding: 36px; text-align: center; color: var(--color-text-muted);">Nenhum evento avaliativo nesta categoria.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(ev) {
            var isAberto = ev.status === 'ABERTO';
            var isRascunho = ev.status === 'RASCUNHO';
            var isEncerrado = ev.status === 'ENCERRADO';

            var statusBadge = '';
            if (isAberto) statusBadge = '<span class="badge badge-status-success" style="font-weight:700; font-size:11px;">● ABERTO</span>';
            else if (isRascunho) statusBadge = '<span class="badge badge-status-warning" style="font-weight:700; font-size:11px;">● RASCUNHO</span>';
            else statusBadge = '<span class="badge badge-neutral" style="font-weight:700; font-size:11px;">● ENCERRADO</span>';

            var etapasList = Array.isArray(ev.etapasAlvo) ? ev.etapasAlvo.join(', ') : '5º Ano';
            var disciplinaLabel = ev.disciplina === 'portugues' ? 'Língua Portuguesa' : (ev.disciplina === 'matematica' ? 'Matemática' : 'Prova Mista (LP + MT)');
            var safeTitulo = typeof global.escapeHtml === 'function' ? global.escapeHtml(ev.titulo) : ev.titulo;

            return `
                <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 58px;">
                    <td style="padding: 12px 16px;">
                        <strong style="color: var(--color-brand-primary); font-size: var(--text-sm); display: block;">${safeTitulo}</strong>
                        <span style="font-size: 11px; color: var(--color-text-secondary);">${ev.qtdQuestoes || 20} Itens de Múltipla Escolha</span>
                    </td>
                    <td style="padding: 12px 16px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                        ${disciplinaLabel}
                    </td>
                    <td style="padding: 12px 16px; font-size: var(--text-xs); color: var(--color-text-secondary); font-family: var(--font-mono);">
                        ${ev.dataRealizacao || '2026-09-15'}
                    </td>
                    <td style="padding: 12px 16px; font-size: var(--text-xs); font-weight: 600; color: var(--color-accent-primary);">
                        ${etapasList}
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        ${statusBadge}
                    </td>
                    <td style="padding: 12px 16px; text-align: center;">
                        <div style="display: inline-flex; align-items: center; gap: 6px;">
                            ${isAberto ? `
                                <button type="button" onclick="irParaEspelhoLancamento('${ev.id}')" class="btn btn-primary" style="font-size: 11px; padding: 4px 10px; height: 28px; border-radius: var(--radius-pill);" title="Digitar Notas">
                                    <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                                    <span>Lançar Respostas</span>
                                </button>
                                <button type="button" onclick="handleEncerrarEvento('${ev.id}')" class="btn btn-outline" style="font-size: 11px; padding: 4px 8px; height: 28px; border-radius: var(--radius-pill);" title="Encerrar Avaliação">
                                    <i data-lucide="lock" style="width: 12px; height: 12px;"></i>
                                </button>
                            ` : ''}
                            ${isEncerrado ? `
                                <button type="button" onclick="irParaDashboardResultados('${ev.id}')" class="btn btn-primary" style="font-size: 11px; padding: 4px 10px; height: 28px; border-radius: var(--radius-pill);">
                                    <i data-lucide="bar-chart-2" style="width: 12px; height: 12px;"></i>
                                    <span>Ver Resultados</span>
                                </button>
                                <button type="button" onclick="handleReabrirEvento('${ev.id}')" class="btn btn-outline" style="font-size: 11px; padding: 4px 8px; height: 28px; border-radius: var(--radius-pill);" title="Reabrir Evento">
                                    <i data-lucide="unlock" style="width: 12px; height: 12px;"></i>
                                </button>
                            ` : ''}
                            ${isRascunho ? `
                                <button type="button" onclick="abrirEditarEventoWizard('${ev.id}')" class="btn btn-primary" style="font-size: 11px; padding: 4px 10px; height: 28px; border-radius: var(--radius-pill);">
                                    <i data-lucide="play" style="width: 12px; height: 12px;"></i>
                                    <span>Continuar Edição</span>
                                </button>
                            ` : ''}
                            <button type="button" onclick="abrirModalImpressaoLogistica('${ev.id}')" class="btn btn-outline" style="font-size: 11px; padding: 4px 8px; height: 28px; border-radius: var(--radius-pill);" title="Imprimir Cartões e Atas">
                                <i data-lucide="printer" style="width: 12px; height: 12px;"></i>
                            </button>
                            <button type="button" onclick="handleExcluirEvento('${ev.id}')" class="btn-icon" style="background: none; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-full); width: 28px; height: 28px; color: var(--color-status-danger); cursor: pointer;" title="Excluir">
                                <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    // -------------------------------------------------------------------------
    // 2. TRANSIÇÕES DE ESTADO (ENCERRAR, REABRIR, EXCLUIR)
    // -------------------------------------------------------------------------

    function handleEncerrarEvento(eventoId) {
        if (!confirm('Deseja realmente ENCERRAR este evento avaliativo?\n\nIsso bloqueará a inserção e edição de respostas para garantir a auditoria dos dados.')) return;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var idx = eventos.findIndex(function(e) { return e.id === eventoId; });
        if (idx !== -1) {
            eventos[idx].status = 'ENCERRADO';
            if (typeof global.saveEventosState === 'function') global.saveEventosState(eventos);
            renderEventosTable();
            if (typeof global.showToast === 'function') global.showToast('Evento encerrado com sucesso! Lançamentos bloqueados.', 'check');
        }
    }

    function handleReabrirEvento(eventoId) {
        if (!confirm('Deseja REABRIR este evento avaliativo para correções?')) return;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var idx = eventos.findIndex(function(e) { return e.id === eventoId; });
        if (idx !== -1) {
            eventos[idx].status = 'ABERTO';
            if (typeof global.saveEventosState === 'function') global.saveEventosState(eventos);
            renderEventosTable();
            if (typeof global.showToast === 'function') global.showToast('Evento reaberto para lançamentos!', 'check');
        }
    }

    function handleExcluirEvento(eventoId) {
        if (!confirm('Tem certeza que deseja excluir este evento avaliativo?')) return;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var filtered = eventos.filter(function(e) { return e.id !== eventoId; });
        if (typeof global.saveEventosState === 'function') global.saveEventosState(filtered);
        renderEventosTable();
        if (typeof global.showToast === 'function') global.showToast('Evento excluído com sucesso.', 'check');
    }

    // -------------------------------------------------------------------------
    // 3. WIZARD PASSO A PASSO (PASSOS 1 A 4)
    // -------------------------------------------------------------------------

    function abrirNovoEventoWizard() {
        wizardEditingEventId = null;
        wizardCurrentStep = 1;
        
        var panelEvents = document.getElementById('panel-created-events');
        var panelWizard = document.getElementById('panel-new-event-wizard');
        if (panelEvents) panelEvents.classList.add('hidden');
        if (panelWizard) panelWizard.classList.remove('hidden');

        var form = document.getElementById('form-novo-evento-wizard');
        if (form) form.reset();

        document.getElementById('wizard-title').value = 'Simulado Municipal SAEB 2026 — ' + new Date().toLocaleDateString('pt-BR');
        document.getElementById('wizard-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('wizard-num-questions').value = '20';

        renderWizardStep(1);
    }

    function abrirEditarEventoWizard(eventoId) {
        wizardEditingEventId = eventoId;
        wizardCurrentStep = 1;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var ev = eventos.find(function(e) { return e.id === eventoId; });
        if (!ev) return;

        var panelEvents = document.getElementById('panel-created-events');
        var panelWizard = document.getElementById('panel-new-event-wizard');
        if (panelEvents) panelEvents.classList.add('hidden');
        if (panelWizard) panelWizard.classList.remove('hidden');

        document.getElementById('wizard-title').value = ev.titulo || '';
        document.getElementById('wizard-date').value = ev.dataRealizacao || '';
        document.getElementById('wizard-num-questions').value = ev.qtdQuestoes || 20;
        document.getElementById('wizard-subject').value = ev.disciplina || 'ambas';

        renderWizardStep(1);
    }

    function fecharWizardEventos() {
        var panelEvents = document.getElementById('panel-created-events');
        var panelWizard = document.getElementById('panel-new-event-wizard');
        if (panelWizard) panelWizard.classList.add('hidden');
        if (panelEvents) panelEvents.classList.remove('hidden');
        renderEventosTable();
    }

    function renderWizardStep(step) {
        wizardCurrentStep = step;
        for (var i = 1; i <= 3; i++) {
            var pane = document.getElementById('step-pane-' + i);
            var ind = document.getElementById('step-ind-' + i);
            if (pane) {
                if (i === step) pane.classList.remove('hidden');
                else pane.classList.add('hidden');
            }
            if (ind) {
                if (i === step) {
                    ind.classList.add('active');
                    ind.style.color = 'var(--color-accent-primary, #6366f1)';
                } else {
                    ind.classList.remove('active');
                    ind.style.color = 'var(--color-text-secondary, #64748b)';
                }
            }
        }

        if (step === 2) {
            renderGabaritoMatrixStep2();
        } else if (step === 3) {
            renderReviewStep3();
        }

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    function renderGabaritoMatrixStep2() {
        var container = document.getElementById('wizard-questions-list');
        if (!container) return;

        var numQuestions = parseInt(document.getElementById('wizard-num-questions').value, 10) || 20;
        var subject = document.getElementById('wizard-subject').value;

        var optionsLetters = ['A', 'B', 'C', 'D', 'E'];
        var matrizSAEB = global.MATRIZ_HABILIDADES_SAEB || { portugues: [], matematica: [] };
        var habList = (subject === 'matematica') ? matrizSAEB.matematica : matrizSAEB.portugues;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; background: var(--color-surface-subtle); padding: 10px 16px; border-radius: var(--radius-card);">
                <span style="font-size: var(--text-xs); font-weight: 700; color: var(--color-brand-primary);">GABARITO OFICIAL & DESCRITOR SAEB (${numQuestions} ITENS)</span>
                <button type="button" onclick="preencherGabaritoAleatorio()" class="btn btn-outline" style="font-size: 11px; padding: 4px 10px; border-radius: var(--radius-pill);">
                    Preencher Gabarito Sugerido
                </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; padding: 4px;">
                ${Array.from({ length: numQuestions }).map(function(_, idx) {
                    var qNum = idx + 1;
                    var defaultLetter = optionsLetters[idx % 4];
                    var defaultHab = habList[idx % habList.length] ? habList[idx % habList.length].codigo : 'LP01';

                    return `
                        <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <strong style="font-size: var(--text-xs); color: var(--color-brand-primary);">Questão ${qNum}</strong>
                                <select id="gab-alt-${qNum}" style="font-weight: 800; font-size: var(--text-xs); padding: 2px 8px; border-radius: var(--radius-sm); border: 1px solid var(--color-accent-primary); color: var(--color-accent-primary);">
                                    ${optionsLetters.map(function(l) {
                                        return `<option value="${l}" ${l === defaultLetter ? 'selected' : ''}>${l}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 10px; color: var(--color-text-secondary); display: block; margin-bottom: 2px;">Descritor SAEB</label>
                                <select id="gab-hab-${qNum}" style="width: 100%; font-size: 11px; padding: 4px; border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle);">
                                    ${habList.map(function(h) {
                                        return `<option value="${h.codigo}" ${h.codigo === defaultHab ? 'selected' : ''}>${h.codigo} - ${h.nome}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function preencherGabaritoAleatorio() {
        var numQuestions = parseInt(document.getElementById('wizard-num-questions').value, 10) || 20;
        var options = ['A', 'B', 'C', 'D'];
        for (var i = 1; i <= numQuestions; i++) {
            var el = document.getElementById('gab-alt-' + i);
            if (el) el.value = options[Math.floor(Math.random() * options.length)];
        }
    }

    function renderReviewStep3() {
        var title = document.getElementById('wizard-title').value;
        var date = document.getElementById('wizard-date').value;
        var subject = document.getElementById('wizard-subject').value;
        var numQuestions = document.getElementById('wizard-num-questions').value;

        var reviewTitle = document.getElementById('wizard-review-title');
        var reviewMeta = document.getElementById('wizard-review-meta');
        var reviewCount = document.getElementById('wizard-review-questions-count');

        if (reviewTitle) reviewTitle.textContent = title || 'Novo Simulado';
        if (reviewMeta) reviewMeta.textContent = 'Data: ' + date + ' | Componente: ' + subject + ' | ' + numQuestions + ' Questões';
        if (reviewCount) reviewCount.innerHTML = 'Questões Configuradas: <strong style="color:var(--color-status-success);">' + numQuestions + ' itens com gabarito</strong>';
    }

    function salvarPublicarEventoFinal() {
        var title = document.getElementById('wizard-title').value.trim();
        var date = document.getElementById('wizard-date').value;
        var subject = document.getElementById('wizard-subject').value;
        var numQuestions = parseInt(document.getElementById('wizard-num-questions').value, 10) || 20;

        if (!title) {
            alert('Por favor, informe o título do evento.');
            return;
        }

        var gabarito = [];
        var habilidades = [];
        for (var i = 1; i <= numQuestions; i++) {
            var altEl = document.getElementById('gab-alt-' + i);
            var habEl = document.getElementById('gab-hab-' + i);
            gabarito.push(altEl ? altEl.value : 'A');
            habilidades.push(habEl ? habEl.value : 'LP01');
        }

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var eventId = wizardEditingEventId || ('evt_' + Date.now());

        var novoEvento = {
            id: eventId,
            titulo: title,
            dataRealizacao: date || new Date().toISOString().split('T')[0],
            disciplina: subject,
            portuguesInicio: 1,
            portuguesFim: numQuestions,
            matematicaInicio: 1,
            matematicaFim: numQuestions,
            status: 'ABERTO',
            passoAtivo: 4,
            qtdQuestoes: numQuestions,
            etapasAlvo: ['5º Ano'],
            gabaritoGeralJson: JSON.stringify([
                {
                    etapaNome: '5º Ano',
                    qtdQuestoes: numQuestions,
                    gabarito: gabarito,
                    habilidades: habilidades
                }
            ]),
            turmas: [],
            criadoEm: new Date().toISOString()
        };

        if (wizardEditingEventId) {
            var idx = eventos.findIndex(function(e) { return e.id === wizardEditingEventId; });
            if (idx !== -1) eventos[idx] = novoEvento;
            else eventos.push(novoEvento);
        } else {
            eventos.push(novoEvento);
        }

        if (typeof global.saveEventosState === 'function') global.saveEventosState(eventos);
        fecharWizardEventos();

        if (typeof global.showToast === 'function') {
            global.showToast('Evento "' + title + '" publicado e pronto para lançamentos!', 'check');
        }
    }

    function initAvaliacoesSubtabs() {
        var buttons = document.querySelectorAll('.eval-subtab-btn');
        buttons.forEach(function(btn) {
            btn.onclick = function(e) {
                e.preventDefault();
                var subtabId = this.getAttribute('data-subtab');
                switchAvaliacoesSubtab(subtabId);
            };
        });
    }

    function switchAvaliacoesSubtab(subtabId) {
        var buttons = document.querySelectorAll('.eval-subtab-btn');
        var contents = document.querySelectorAll('.eval-subtab-content');

        buttons.forEach(function(b) {
            if (b.getAttribute('data-subtab') === subtabId) {
                b.classList.add('active');
                b.style.color = 'var(--purple-light)';
                b.style.fontWeight = '700';
                b.style.borderBottom = '2px solid var(--purple)';
            } else {
                b.classList.remove('active');
                b.style.color = 'var(--text-secondary)';
                b.style.fontWeight = '500';
                b.style.borderBottom = 'none';
            }
        });

        contents.forEach(function(c) {
            if (c.id === subtabId) {
                c.classList.remove('hidden');
                c.style.display = 'block';
            } else {
                c.classList.add('hidden');
                c.style.display = 'none';
            }
        });

        if (subtabId === 'criar-evento-sub') {
            renderEventosTable();
        } else if (subtabId === 'lancar-notas-sub') {
            if (typeof global.initEspelhoSelectors === 'function') global.initEspelhoSelectors();
        } else if (subtabId === 'resultados-dash-sub') {
            if (typeof global.initAnalyticsSelectors === 'function') global.initAnalyticsSelectors();
        }
    }

    // Inicialização de Listeners
    function initEventosListeners() {
        initAvaliacoesSubtabs();

        var btnShowList = document.getElementById('btn-show-created-events');
        var btnShowWizard = document.getElementById('btn-show-new-event-wizard');

        if (btnShowList) btnShowList.onclick = fecharWizardEventos;
        if (btnShowWizard) btnShowWizard.onclick = abrirNovoEventoWizard;

        var next1 = document.getElementById('wizard-next-1');
        var next2 = document.getElementById('wizard-next-2');
        var prev2 = document.getElementById('wizard-prev-2');
        var prev3 = document.getElementById('wizard-prev-3');
        var finishBtn = document.getElementById('wizard-finish-btn');

        if (next1) next1.onclick = function() { renderWizardStep(2); };
        if (next2) next2.onclick = function() { renderWizardStep(3); };
        if (prev2) prev2.onclick = function() { renderWizardStep(1); };
        if (prev3) prev3.onclick = function() { renderWizardStep(2); };
        if (finishBtn) finishBtn.onclick = salvarPublicarEventoFinal;

        document.querySelectorAll('.event-filter-link').forEach(function(link) {
            link.onclick = function(e) {
                e.preventDefault();
                filterEventosList(this.getAttribute('data-filter'));
            };
        });

        renderEventosTable();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventosListeners);
    } else {
        initEventosListeners();
    }

    // Exposição Global
    global.initAvaliacoesSubtabs = initAvaliacoesSubtabs;
    global.switchAvaliacoesSubtab = switchAvaliacoesSubtab;
    global.filterEventosList = filterEventosList;
    global.renderEventosTable = renderEventosTable;
    global.handleEncerrarEvento = handleEncerrarEvento;
    global.handleReabrirEvento = handleReabrirEvento;
    global.handleExcluirEvento = handleExcluirEvento;
    global.abrirNovoEventoWizard = abrirNovoEventoWizard;
    global.abrirEditarEventoWizard = abrirEditarEventoWizard;
    global.fecharWizardEventos = fecharWizardEventos;
    global.renderWizardStep = renderWizardStep;
    global.preencherGabaritoAleatorio = preencherGabaritoAleatorio;
    global.salvarPublicarEventoFinal = salvarPublicarEventoFinal;

})(typeof window !== 'undefined' ? window : this);
