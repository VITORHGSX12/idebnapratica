/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — WIZARD DE CRIAÇÃO E EDIÇÃO DE EVENTOS AVALIATIVOS
 * Arquivo: js/modules/avaliacoes/avaliacoes_wizard.js
 * Descrição: Assistente de 3 passos para agendamento de simulados, seleção
 *            de escolas/turmas e configuração da matriz de gabarito por descritores.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var wizardEditingEventId = null;
    var wizardCurrentStep = 1;

    function abrirNovoEventoWizard() {
        wizardEditingEventId = null;
        
        var panelEvents = document.getElementById('panel-created-events');
        var panelWizard = document.getElementById('panel-new-event-wizard');
        if (panelEvents) panelEvents.classList.add('hidden');
        if (panelWizard) panelWizard.classList.remove('hidden');

        var titleEl = document.getElementById('wizard-title');
        var dateEl = document.getElementById('wizard-date');
        var numQEl = document.getElementById('wizard-num-questions');

        if (titleEl) titleEl.value = 'Simulado Municipal SAEB 2026 — ' + new Date().toLocaleDateString('pt-BR');
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        if (numQEl) numQEl.value = '20';

        if (typeof global.populateWizardSchools === 'function') global.populateWizardSchools();
        if (typeof global.populateWizardClasses === 'function') global.populateWizardClasses();
        initStageChips();

        if (global.selectedItemsForWizard && global.selectedItemsForWizard.length > 0) {
            if (numQEl) numQEl.value = global.selectedItemsForWizard.length.toString();
            if (titleEl) titleEl.value = 'Simulado Especial — Itens Selecionados (' + global.selectedItemsForWizard.length + ' Itens)';
            wizardCurrentStep = 2;
            renderWizardStep(2);
        } else {
            wizardCurrentStep = 1;
            renderWizardStep(1);
        }
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

        var titleEl = document.getElementById('wizard-title');
        var dateEl = document.getElementById('wizard-date');
        var numQEl = document.getElementById('wizard-num-questions');
        var subjEl = document.getElementById('wizard-subject');

        if (titleEl) titleEl.value = ev.titulo || ev.nome || '';
        if (dateEl) dateEl.value = ev.dataRealizacao || '';
        if (numQEl) numQEl.value = ev.qtdQuestoes || 20;
        if (subjEl) subjEl.value = ev.disciplina || 'Matemática';

        if (typeof global.populateWizardSchools === 'function') global.populateWizardSchools();
        if (typeof global.populateWizardClasses === 'function') global.populateWizardClasses();
        initStageChips();
        renderWizardStep(1);
    }

    function fecharWizardEventos() {
        var panelEvents = document.getElementById('panel-created-events');
        var panelWizard = document.getElementById('panel-new-event-wizard');
        if (panelWizard) panelWizard.classList.add('hidden');
        if (panelEvents) panelEvents.classList.remove('hidden');
        if (typeof global.renderEventosTable === 'function') global.renderEventosTable();
    }

    function initStageChips() {
        var chipBtns = document.querySelectorAll('.stage-chip-btn');
        chipBtns.forEach(function(btn) {
            btn.onclick = function(e) {
                e.preventDefault();
                chipBtns.forEach(function(b) {
                    b.classList.remove('active');
                    b.style.border = '1px solid var(--color-border-subtle)';
                    b.style.background = 'var(--color-surface-subtle)';
                    b.style.color = 'var(--color-text-secondary)';
                    b.style.fontWeight = '500';
                });
                this.classList.add('active');
                this.style.border = '1.5px solid var(--color-brand-primary)';
                this.style.background = 'var(--color-brand-primary)';
                this.style.color = '#FFFFFF';
                this.style.fontWeight = '700';
            };
        });
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
                    ind.style.color = 'var(--color-brand-primary, #1A2D42)';
                    ind.style.fontWeight = '700';
                } else if (i < step) {
                    ind.classList.remove('active');
                    ind.style.color = 'var(--color-status-success, #059669)';
                    ind.style.fontWeight = '600';
                } else {
                    ind.classList.remove('active');
                    ind.style.color = 'var(--color-text-secondary, #2E4156)';
                    ind.style.fontWeight = '500';
                }
            }
        }

        if (step === 1) {
            if (typeof global.populateWizardSchools === 'function') global.populateWizardSchools();
        } else if (step === 2) {
            renderGabaritoMatrixStep2();
        } else if (step === 3) {
            if (typeof global.populateWizardClasses === 'function') global.populateWizardClasses();
            renderReviewStep3();
        }

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    function renderGabaritoMatrixStep2() {
        var container = document.getElementById('wizard-questions-list');
        if (!container) return;

        var numQuestions = parseInt(document.getElementById('wizard-num-questions')?.value, 10) || 20;
        var subjectRaw = (document.getElementById('wizard-subject')?.value || '').toLowerCase();

        var isMatematica = subjectRaw.includes('matem');
        var isMista = subjectRaw.includes('mista') || subjectRaw.includes('ambas');

        var optionsLetters = ['A', 'B', 'C', 'D', 'E'];
        var matrizSAEB = global.MATRIZ_HABILIDADES_SAEB || { portugues: [], matematica: [] };

        var habPort = matrizSAEB.portugues || [];
        var habMat = matrizSAEB.matematica || [];

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; background: var(--color-surface-subtle); padding: 10px 16px; border-radius: var(--radius-md); border: 1px solid var(--color-border-subtle);">
                <div>
                    <span style="font-size: var(--text-xs); font-weight: 700; color: var(--color-brand-primary);">GABARITO OFICIAL & DESCRITOR BNCC/SAEB (${numQuestions} ITENS)</span>
                    <p style="margin: 2px 0 0 0; font-size: 11px; color: var(--color-text-secondary);">
                        ${isMista ? 'Prova Mista (Português + Matemática)' : (isMatematica ? 'Componente: Matemática' : 'Componente: Língua Portuguesa')}
                    </p>
                </div>
                <button type="button" onclick="preencherGabaritoAleatorio()" class="btn btn-outline btn-sm" style="font-size: 11px;">
                    ✨ Preencher Gabarito Sugerido
                </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; max-height: 420px; overflow-y: auto; padding: 4px;">
                ${Array.from({ length: numQuestions }).map(function(_, idx) {
                    var qNum = idx + 1;
                    var selectedQ = (global.selectedItemsForWizard && global.selectedItemsForWizard[idx]) ? global.selectedItemsForWizard[idx] : null;
                    var defaultLetter = selectedQ ? (selectedQ.gabarito || selectedQ.opcoes?.find(o => o.correta)?.letra || 'A') : optionsLetters[idx % 4];
                    var isItemMat = isMatematica || (isMista && qNum > Math.floor(numQuestions / 2));
                    var currentHabList = isItemMat ? habMat : habPort;
                    var disciplineTag = selectedQ ? (selectedQ.disciplina?.toUpperCase().includes('MAT') ? 'MAT' : 'LP') : (isItemMat ? 'MAT' : 'LP');
                    var defaultHab = selectedQ ? (selectedQ.codigo_bncc || 'D01') : (currentHabList[idx % currentHabList.length] ? currentHabList[idx % currentHabList.length].codigo : (isItemMat ? 'MT01' : 'LP01'));

                    var snippetHtml = selectedQ ? `
                        <div style="margin-top: 6px; padding: 6px 8px; background: var(--color-surface-subtle); border-radius: 4px; border-left: 2px solid var(--color-brand-primary);">
                            <p style="margin: 0; font-size: 10px; color: var(--color-text-primary); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                <strong>Item importado:</strong> ${selectedQ.enunciado.replace(/<[^>]*>?/gm, '')}
                            </p>
                        </div>
                    ` : '';

                    return `
                        <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 12px; box-shadow: var(--shadow-subtle);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <strong style="font-size: var(--text-xs); color: var(--color-brand-primary);">Item ${qNum}</strong>
                                    <span class="badge" style="font-size: 9px; padding: 1px 4px; background: var(--color-surface-subtle); color: var(--color-brand-primary);">${disciplineTag}</span>
                                </div>
                                <select id="gab-alt-${qNum}" style="font-weight: 800; font-size: var(--text-xs); padding: 2px 8px; border-radius: 6px; border: 1px solid var(--color-brand-primary); color: var(--color-brand-primary);">
                                    ${optionsLetters.map(function(l) {
                                        return `<option value="${l}" ${l === defaultLetter ? 'selected' : ''}>${l}</option>`;
                                    }).join('')}
                                </select>
                            </div>
                            <div>
                                <label style="font-size: 10px; color: var(--color-text-secondary); display: block; margin-bottom: 2px;">Descritor SAEB Associado</label>
                                <select id="gab-hab-${qNum}" style="width: 100%; font-size: 11px; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--color-border-subtle);">
                                    ${currentHabList.map(function(h) {
                                        return `<option value="${h.codigo}" ${h.codigo === defaultHab || defaultHab.includes(h.codigo) ? 'selected' : ''}>${h.codigo} - ${h.nome}</option>`;
                                    }).join('')}
                                    ${selectedQ && !currentHabList.some(h => defaultHab.includes(h.codigo)) ? `<option value="${defaultHab}" selected>${defaultHab}</option>` : ''}
                                </select>
                            </div>
                            ${snippetHtml}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    function preencherGabaritoAleatorio() {
        var numQuestions = parseInt(document.getElementById('wizard-num-questions')?.value, 10) || 20;
        var options = ['A', 'B', 'C', 'D'];
        for (var i = 1; i <= numQuestions; i++) {
            var el = document.getElementById('gab-alt-' + i);
            if (el) el.value = options[Math.floor(Math.random() * options.length)];
        }
    }

    function renderReviewStep3() {
        var title = document.getElementById('wizard-title')?.value || 'Simulado SAEB 2026';
        var date = document.getElementById('wizard-date')?.value || new Date().toISOString().split('T')[0];
        var subject = document.getElementById('wizard-subject')?.value || 'Língua Portuguesa';
        var numQuestions = document.getElementById('wizard-num-questions')?.value || '20';

        var selectedSchools = Array.from(document.querySelectorAll('.wizard-school-check:checked')).map(function(c) { return c.value; });
        var activeStageEl = document.querySelector('.stage-chip-btn.active');
        var stageText = activeStageEl ? activeStageEl.textContent.trim() : '5º ANO';

        var reviewTitle = document.getElementById('wizard-review-title');
        var reviewMeta = document.getElementById('wizard-review-meta');
        var reviewCount = document.getElementById('wizard-review-questions-count');

        if (reviewTitle) reviewTitle.textContent = title;
        if (reviewMeta) reviewMeta.textContent = 'Data: ' + date + ' | Componente: ' + subject + ' | Etapa: ' + stageText + ' | ' + selectedSchools.length + ' Escolas Participantes';
        if (reviewCount) reviewCount.innerHTML = 'Gabarito Configurado: <strong style="color:var(--color-status-success);">' + numQuestions + ' questões com descritores validados</strong>';
    }

    function salvarPublicarEventoFinal() {
        var title = (document.getElementById('wizard-title')?.value || '').trim();
        var date = document.getElementById('wizard-date')?.value || new Date().toISOString().split('T')[0];
        var subject = document.getElementById('wizard-subject')?.value || 'Língua Portuguesa';
        var numQuestions = parseInt(document.getElementById('wizard-num-questions')?.value, 10) || 20;

        if (!title) {
            alert('Por favor, informe o título do evento avaliativo.');
            return;
        }

        var selectedSchools = Array.from(document.querySelectorAll('.wizard-school-check:checked')).map(function(c) { return c.value; });
        var selectedClasses = Array.from(document.querySelectorAll('.wizard-class-check:checked')).map(function(c) { return c.value; });
        var activeStageEl = document.querySelector('.stage-chip-btn.active');
        var stageText = activeStageEl ? activeStageEl.textContent.trim() : '5º Ano';

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
            nome: title,
            dataRealizacao: date,
            janela: date + ' a ' + (document.getElementById('wizard-end-date')?.value || date),
            disciplina: subject,
            tipo: 'Simulado SAEB / Diagnóstico',
            etapa: stageText,
            etapasAlvo: [stageText],
            escola: selectedSchools.length > 0 ? (selectedSchools.length + ' Escolas') : 'Todas as Escolas',
            escolas: selectedSchools,
            turmas: selectedClasses,
            gabaritoStatus: 'Gabarito Oficial Cadastrado (' + numQuestions + ' Itens)',
            status: 'ABERTO',
            qtdQuestoes: numQuestions,
            gabaritoGeralJson: JSON.stringify([
                {
                    etapaNome: stageText,
                    qtdQuestoes: numQuestions,
                    gabarito: gabarito,
                    habilidades: habilidades
                }
            ]),
            criadoEm: new Date().toISOString()
        };

        if (wizardEditingEventId) {
            var idx = eventos.findIndex(function(e) { return e.id === wizardEditingEventId; });
            if (idx !== -1) eventos[idx] = novoEvento;
            else eventos.push(novoEvento);
        } else {
            eventos.unshift(novoEvento);
        }

        if (typeof global.saveEventosState === 'function') global.saveEventosState(eventos);
        fecharWizardEventos();

        if (typeof global.showToast === 'function') {
            global.showToast('Evento "' + title + '" publicado e pronto para lançamentos!', 'check');
        }
    }

    // Exportação Global
    global.abrirNovoEventoWizard = abrirNovoEventoWizard;
    global.abrirEditarEventoWizard = abrirEditarEventoWizard;
    global.fecharWizardEventos = fecharWizardEventos;
    global.renderWizardStep = renderWizardStep;
    global.renderGabaritoMatrixStep2 = renderGabaritoMatrixStep2;
    global.preencherGabaritoAleatorio = preencherGabaritoAleatorio;
    global.renderReviewStep3 = renderReviewStep3;
    global.salvarPublicarEventoFinal = salvarPublicarEventoFinal;

})(typeof window !== 'undefined' ? window : this);
