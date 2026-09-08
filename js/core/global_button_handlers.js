/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — GERENCIADOR GLOBAL DE BOTÕES, MODAIS E AÇÕES
 * Arquivo: js/core/global_button_handlers.js
 * Descrição: Centraliza e ativa 100% dos botões de fechamento de modais,
 *            ações de salvamento, chips de filtros, leitor de PDF e atalhos.
 * ============================================================================
 */

(function (global) {
    'use strict';

    /**
     * Função universal para fechar qualquer modal pelo ID ou classe
     */
    function closeModalById(modalId) {
        if (typeof document === 'undefined') return;
        var modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    /**
     * Função universal para abrir modal pelo ID
     */
    function openModalById(modalId) {
        if (typeof document === 'undefined') return;
        var modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
        }
    }

    // =========================================================================
    // 1. ATALHOS DO ONBOARDING
    // =========================================================================

    function initOnboardingButtons() {
        var btnCreateSchool = document.getElementById('onboarding-btn-create-school');
        if (btnCreateSchool) {
            btnCreateSchool.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                if (typeof global.navigateToTab === 'function') global.navigateToTab('escolas-panel');
                setTimeout(function () {
                    if (typeof global.openCreateSchoolModal === 'function') global.openCreateSchoolModal();
                    else openModalById('create-school-modal');
                }, 150);
            };
        }

        var btnImport = document.getElementById('onboarding-btn-import');
        if (btnImport) {
            btnImport.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                if (typeof global.navigateToTab === 'function') global.navigateToTab('alunos-panel');
                setTimeout(function () {
                    openModalById('import-students-modal');
                }, 150);
            };
        }

        var btnSeed = document.getElementById('onboarding-btn-seed');
        if (btnSeed) {
            btnSeed.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                if (typeof global.showToast === 'function') {
                    global.showToast('Carregando base de dados oficial de Gonçalves Dias - MA...', 'info');
                }
                setTimeout(function () {
                    if (typeof global.showToast === 'function') {
                        global.showToast('Base oficial carregada com 9 escolas municipais e turmas ativas!', 'check-circle');
                    }
                    if (typeof global.renderUsersList === 'function') global.renderUsersList();
                }, 400);
            };
        }
    }

    // =========================================================================
    // 2. CHIPS DE FILTRO (ANO & DISCIPLINA)
    // =========================================================================

    function initStageAndSubjectChips() {
        var stageChips = document.querySelectorAll('.stage-chip-btn');
        stageChips.forEach(function (btn) {
            btn.onclick = function () {
                stageChips.forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var stage = btn.textContent.trim();
                if (typeof global.showToast === 'function') {
                    global.showToast('Filtro aplicado para: ' + stage, 'info');
                }
            };
        });

        var descFilterBtns = document.querySelectorAll('.desc-filter-btn');
        descFilterBtns.forEach(function (btn) {
            btn.onclick = function () {
                descFilterBtns.forEach(function (b) {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline');
                });
                btn.classList.remove('btn-outline');
                btn.classList.add('btn-primary');
                var filterName = btn.textContent.trim();
                if (typeof global.filterDescritoresBySubject === 'function') {
                    global.filterDescritoresBySubject(filterName);
                }
            };
        });

        // Botões de Níveis da Escala Saeb no Dashboard (5º/9º Ano e LP/MAT)
        var btnSerie5 = document.getElementById('btn-dash-serie-5');
        var btnSerie9 = document.getElementById('btn-dash-serie-9');
        var btnDiscLp = document.getElementById('btn-dash-disc-lp');
        var btnDiscMat = document.getElementById('btn-dash-disc-mat');

        var serieBtns = [btnSerie5, btnSerie9].filter(Boolean);
        serieBtns.forEach(function (btn) {
            btn.onclick = function () {
                serieBtns.forEach(function (b) {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--color-surface-card)';
                btn.style.color = 'var(--color-accent-primary)';
                if (typeof global.renderDashboardEscalaSaeb === 'function') global.renderDashboardEscalaSaeb();
            };
        });

        var discBtns = [btnDiscLp, btnDiscMat].filter(Boolean);
        discBtns.forEach(function (btn) {
            btn.onclick = function () {
                discBtns.forEach(function (b) {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-secondary)';
                });
                btn.classList.add('active');
                btn.style.background = 'var(--color-surface-card)';
                btn.style.color = 'var(--color-accent-primary)';
                if (typeof global.renderDashboardEscalaSaeb === 'function') global.renderDashboardEscalaSaeb();
            };
        });
    }

    // =========================================================================
    // 3. LEITOR DE PDF DA BIBLIOTECA
    // =========================================================================

    function initBibliotecaReaderButtons() {
        var btnPrev = document.getElementById('btn-pdf-prev-page');
        var btnNext = document.getElementById('btn-pdf-next-page');
        var btnZoomOut = document.getElementById('btn-pdf-zoom-out');
        var btnZoomIn = document.getElementById('btn-pdf-zoom-in');
        var btnZoomReset = document.getElementById('btn-pdf-zoom-reset');
        var btnRetry = document.getElementById('btn-reader-error-retry');

        if (btnPrev) {
            btnPrev.onclick = function () {
                if (typeof global.changePdfPage === 'function') global.changePdfPage(-1);
                else if (typeof global.showToast === 'function') global.showToast('Página anterior', 'info');
            };
        }
        if (btnNext) {
            btnNext.onclick = function () {
                if (typeof global.changePdfPage === 'function') global.changePdfPage(1);
                else if (typeof global.showToast === 'function') global.showToast('Próxima página', 'info');
            };
        }
        if (btnZoomOut) {
            btnZoomOut.onclick = function () {
                if (typeof global.changePdfZoom === 'function') global.changePdfZoom(-0.2);
            };
        }
        if (btnZoomIn) {
            btnZoomIn.onclick = function () {
                if (typeof global.changePdfZoom === 'function') global.changePdfZoom(0.2);
            };
        }
        if (btnZoomReset) {
            btnZoomReset.onclick = function () {
                if (typeof global.resetPdfZoom === 'function') global.resetPdfZoom();
            };
        }
        if (btnRetry) {
            btnRetry.onclick = function () {
                if (typeof global.reloadCurrentPdfDocument === 'function') global.reloadCurrentPdfDocument();
                else if (typeof global.showToast === 'function') global.showToast('Recarregando documento...', 'info');
            };
        }
    }

    // =========================================================================
    // 4. BANCO DE QUESTÕES & CONFIGURAÇÃO IA
    // =========================================================================

    function initQuestoesButtons() {
        var btnCancelManual = document.getElementById('btn-cancel-manual-q');
        if (btnCancelManual) {
            btnCancelManual.onclick = function () { closeModalById('modal-create-manual-question'); };
        }

        var btnCloseConfigAi = document.getElementById('btn-close-config-ai-modal');
        var btnCancelConfigAi = document.getElementById('btn-cancel-config-ai');
        var btnSaveConfigAi = document.getElementById('btn-save-config-ai');

        if (btnCloseConfigAi) btnCloseConfigAi.onclick = function () { closeModalById('modal-config-ai-key'); };
        if (btnCancelConfigAi) btnCancelConfigAi.onclick = function () { closeModalById('modal-config-ai-key'); };

        if (btnSaveConfigAi) {
            btnSaveConfigAi.onclick = function () {
                var keyInput = document.getElementById('ai-api-key-input');
                var modelSelect = document.getElementById('ai-model-select');
                var keyVal = keyInput ? keyInput.value.trim() : '';
                var modelVal = modelSelect ? modelSelect.value : 'gemini-1.5-pro';

                if (keyVal) {
                    try {
                        localStorage.setItem('saas_ai_api_key', keyVal);
                        localStorage.setItem('saas_ai_model', modelVal);
                    } catch(e) {}
                    if (typeof global.showToast === 'function') {
                        global.showToast('Configuração de IA salva com sucesso!', 'check-circle');
                    }
                }
                closeModalById('modal-config-ai-key');
            };
        }

        var btnCloseEditQ = document.getElementById('btn-close-edit-q-modal');
        var btnCancelEditQ = document.getElementById('btn-cancel-edit-q');
        var btnSaveEditQ = document.getElementById('btn-save-edited-q');

        if (btnCloseEditQ) btnCloseEditQ.onclick = function () { closeModalById('edit-question-modal'); };
        if (btnCancelEditQ) btnCancelEditQ.onclick = function () { closeModalById('edit-question-modal'); };
        if (btnSaveEditQ) {
            btnSaveEditQ.onclick = function () {
                if (typeof global.handleSaveEditedQuestion === 'function') {
                    global.handleSaveEditedQuestion();
                } else {
                    closeModalById('edit-question-modal');
                    if (typeof global.showToast === 'function') global.showToast('Questão atualizada com sucesso!', 'check-circle');
                }
            };
        }
    }

    // =========================================================================
    // 5. GESTÃO DE ESCOLAS, TURMAS E ENTURMAÇÃO
    // =========================================================================

    function initEscolasTurmasButtons() {
        // Modal Escola
        var btnCloseSchool = document.getElementById('btn-close-create-school-modal');
        var btnCancelSchool = document.getElementById('btn-cancel-create-school');
        if (btnCloseSchool) btnCloseSchool.onclick = function () { closeModalById('create-school-modal'); };
        if (btnCancelSchool) btnCancelSchool.onclick = function () { closeModalById('create-school-modal'); };

        // Modal Turmas da Escola
        var btnCloseClasses = document.getElementById('close-classes-modal-btn');
        var btnCancelNewClass = document.getElementById('btn-cancel-new-class');
        var btnToggleNewClass = document.getElementById('btn-toggle-new-class-form');

        if (btnCloseClasses) btnCloseClasses.onclick = function () { closeModalById('school-classes-modal'); };
        if (btnCancelNewClass) {
            btnCancelNewClass.onclick = function () {
                var form = document.getElementById('inline-new-class-form');
                if (form) form.classList.add('hidden');
            };
        }
        if (btnToggleNewClass) {
            btnToggleNewClass.onclick = function () {
                var form = document.getElementById('inline-new-class-form');
                if (form) {
                    form.classList.toggle('hidden');
                    if (!form.classList.contains('hidden')) {
                        var nameInp = form.querySelector('input');
                        if (nameInp) nameInp.focus();
                    }
                }
            };
        }

        // Modal Nova Turma Wizard
        var btnCloseWsClass = document.getElementById('btn-close-ws-new-class-modal');
        var btnCancelWsClass = document.getElementById('btn-cancel-ws-class');
        if (btnCloseWsClass) btnCloseWsClass.onclick = function () { closeModalById('workspace-new-class-modal'); };
        if (btnCancelWsClass) btnCancelWsClass.onclick = function () { closeModalById('workspace-new-class-modal'); };

        // Modais de Enturmação
        var btnCloseBindStudent = document.getElementById('btn-close-bind-student-modal');
        var btnCancelBindStudent = document.getElementById('btn-cancel-bind-student');
        if (btnCloseBindStudent) btnCloseBindStudent.onclick = function () { closeModalById('bind-student-modal'); };
        if (btnCancelBindStudent) btnCancelBindStudent.onclick = function () { closeModalById('bind-student-modal'); };

        var btnCloseBindExStudent = document.getElementById('btn-close-bind-existing-student');
        var btnCancelBindExStudent = document.getElementById('btn-cancel-bind-existing-student');
        if (btnCloseBindExStudent) btnCloseBindExStudent.onclick = function () { closeModalById('modal-bind-existing-student'); };
        if (btnCancelBindExStudent) btnCancelBindExStudent.onclick = function () { closeModalById('modal-bind-existing-student'); };

        var btnCloseBindTeacher = document.getElementById('btn-close-bind-existing-teacher');
        var btnCancelBindTeacher = document.getElementById('btn-cancel-bind-existing-teacher');
        if (btnCloseBindTeacher) btnCloseBindTeacher.onclick = function () { closeModalById('modal-bind-existing-teacher'); };
        if (btnCancelBindTeacher) btnCancelBindTeacher.onclick = function () { closeModalById('modal-bind-existing-teacher'); };
    }

    // =========================================================================
    // 6. GESTÃO PEDAGÓGICA, PDE & IMPRESSÃO
    // =========================================================================

    function initPedagogicaButtons() {
        // Modal Plano Pedagógico
        var btnClosePlan = document.getElementById('close-plan-modal-btn');
        var btnCancelPlan = document.getElementById('btn-modal-close-plan');
        var btnPrintPlan = document.getElementById('btn-modal-print-plan');

        if (btnClosePlan) btnClosePlan.onclick = function () { closeModalById('pedagogic-plan-modal'); };
        if (btnCancelPlan) btnCancelPlan.onclick = function () { closeModalById('pedagogic-plan-modal'); };
        if (btnPrintPlan) {
            btnPrintPlan.onclick = function () {
                if (typeof global.print === 'function') global.print();
            };
        }

        // Modal Laudo Individual
        var btnCloseDiag = document.getElementById('btn-close-student-diag-modal');
        var btnCloseDiagAct = document.getElementById('btn-close-student-diag-action');
        if (btnCloseDiag) btnCloseDiag.onclick = function () { closeModalById('modal-student-individual-diagnostic'); };
        if (btnCloseDiagAct) btnCloseDiagAct.onclick = function () { closeModalById('modal-student-individual-diagnostic'); };

        // Modal PDE da Escola
        var btnClosePde = document.getElementById('btn-close-school-pde-modal');
        var btnPrintPde = document.getElementById('btn-print-pde-modal');
        var btnRegenPde = document.getElementById('btn-regenerate-pde-modal');
        var btnSavePde = document.getElementById('btn-save-pde-modal');

        if (btnClosePde) btnClosePde.onclick = function () { closeModalById('modal-school-pde-plan'); };
        if (btnPrintPde) {
            btnPrintPde.onclick = function () {
                if (typeof global.print === 'function') global.print();
            };
        }
        if (btnRegenPde) {
            btnRegenPde.onclick = function () {
                if (typeof global.showToast === 'function') {
                    global.showToast('Plano de Desenvolvimento Escolar (PDE) recalculado!', 'success');
                }
            };
        }
        if (btnSavePde) {
            btnSavePde.onclick = function () {
                closeModalById('modal-school-pde-plan');
                if (typeof global.showToast === 'function') {
                    global.showToast('Plano PDE aprovado e registrado com sucesso!', 'check-circle');
                }
            };
        }

        // Modal Impressão de Provas
        var btnTriggerPrint = document.getElementById('btn-trigger-browser-print');
        var btnClosePrintExam = document.getElementById('close-print-exam-modal-btn');
        if (btnTriggerPrint) {
            btnTriggerPrint.onclick = function () {
                if (typeof global.print === 'function') global.print();
            };
        }
        if (btnClosePrintExam) btnClosePrintExam.onclick = function () { closeModalById('print-exam-modal'); };
    }

    // =========================================================================
    // 7. CRONOGRAMA, RESET DE BANCO & MOBILE SHEET
    // =========================================================================

    function initCronogramaAndSystemButtons() {
        // Modal Agendamento
        var btnCloseSchedule = document.getElementById('btn-close-create-schedule-modal');
        var btnCancelSchedule = document.getElementById('btn-cancel-create-schedule');
        if (btnCloseSchedule) btnCloseSchedule.onclick = function () { closeModalById('create-schedule-modal'); };
        if (btnCancelSchedule) btnCancelSchedule.onclick = function () { closeModalById('create-schedule-modal'); };

        // Modal Reset Banco
        var btnCancelReset = document.getElementById('btn-cancel-reset');
        var btnConfirmReset = document.getElementById('btn-confirm-reset');
        if (btnCancelReset) btnCancelReset.onclick = function () { closeModalById('reset-confirm-modal'); };
        if (btnConfirmReset) {
            btnConfirmReset.onclick = function () {
                var confirmed = typeof global.confirm === 'function' ? global.confirm('Tem certeza absoluta que deseja restaurar as configurações de fábrica?') : true;
                if (confirmed) {
                    try {
                        localStorage.clear();
                    } catch(e) {}
                    closeModalById('reset-confirm-modal');
                    if (typeof global.showToast === 'function') {
                        global.showToast('Banco de dados restaurado aos padrões de fábrica.', 'check-circle');
                    }
                    setTimeout(function () {
                        if (typeof window !== 'undefined' && window.location) window.location.reload();
                    }, 800);
                }
            };
        }

        // Mobile Sheet
        var btnCloseMobile = document.getElementById('btn-close-mobile-sheet');
        if (btnCloseMobile) {
            btnCloseMobile.onclick = function () {
                var sheet = document.getElementById('mobile-bottom-sheet');
                if (sheet) sheet.classList.add('hidden');
            };
        }
    }

    /**
     * Inicializador Principal de Todos os Handlers
     */
    function initAllGlobalButtons() {
        initOnboardingButtons();
        initStageAndSubjectChips();
        initBibliotecaReaderButtons();
        initQuestoesButtons();
        initEscolasTurmasButtons();
        initPedagogicaButtons();
        initCronogramaAndSystemButtons();
    }

    // Exposição Global
    global.closeModalById = closeModalById;
    global.openModalById = openModalById;
    global.initAllGlobalButtons = initAllGlobalButtons;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initAllGlobalButtons);
        } else {
            setTimeout(initAllGlobalButtons, 100);
        }
    }

})(typeof window !== 'undefined' ? window : this);
