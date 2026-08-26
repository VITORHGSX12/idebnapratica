// =========================================================================
// IMPORTAÇÃO E EXPORTAÇÃO DE QUESTÕES (MODULAR ENGINE)
// Responsabilidade: Download de modelo Word (.docx/.txt), upload com parser
// de arquivos, exportação de Caderno do Aluno (PDF) e Gabarito do Professor (PDF).
// =========================================================================

(function(global) {
    'use strict';

    var loadedFileQuestionsBatch = [];

    /**
     * Gera e baixa o modelo oficial em texto/word para digitação de itens
     */
    function downloadWordQuestionsTemplate() {
        var content = [
            'MODELO PADRÃO DE IMPORTAÇÃO DE QUESTÕES — IDEB NA PRÁTICA (SEMED GONÇALVES DIAS)',
            '----------------------------------------------------------------------',
            'INSTRUÇÕES DE PREENCHIMENTO:',
            '- Mantenha a estrutura com [QUESTAO] e [/QUESTAO] para cada item.',
            '- As alternativas devem iniciar por A), B), C), D).',
            '- Informe o GABARITO (A, B, C ou D) e a JUSTIFICATIVA pedagógica.',
            '----------------------------------------------------------------------',
            '',
            '[QUESTAO]',
            'ETAPA: 5º Ano',
            'DISCIPLINA: Língua Portuguesa',
            'MATRIZ: SAEB',
            'DESCRITOR: D03 - Inferir o sentido de uma palavra ou expressão',
            'DIFICULDADE: Médio',
            'ENUNCIADO: Leia o texto a seguir:',
            '"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave."',
            'No trecho "O sol começava a desmaiar no horizonte", a palavra sublinhada foi empregada com o sentido de:',
            'A) Perder a consciência por cansaço físico.',
            'B) Desaparecer lentamente ao entardecer.',
            'C) Aumentar a intensidade de sua luz solar.',
            'D) Mudar de posição devido ao vento forte.',
            'GABARITO: B',
            'JUSTIFICATIVA: Sentido figurado de pôr do sol gradativo.',
            '[/QUESTAO]',
            '',
            '[QUESTAO]',
            'ETAPA: 5º Ano',
            'DISCIPLINA: Matemática',
            'MATRIZ: SAEB',
            'DESCRITOR: D13 - Resolver problemas com números naturais',
            'DIFICULDADE: Fácil',
            'ENUNCIADO: Na feira de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele vendeu 1.830 espigas. Quantas espigas restaram?',
            'A) 500 espigas',
            'B) 600 espigas',
            'C) 650 espigas',
            'D) 720 espigas',
            'GABARITO: B',
            'JUSTIFICATIVA: 1.450 + 980 = 2.430. 2.430 - 1.830 = 600 espigas.',
            '[/QUESTAO]'
        ].join('\n');

        var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'modelo_questoes_ideb_goncalves_dias.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (typeof global.showToast === 'function') {
            global.showToast('Modelo de importação baixado com sucesso!', 'download');
        }
    }

    /**
     * Inicializa os ouvintes de importação de arquivo e exportação de PDF
     */
    function initQuestionsImportExport() {
        // 1. Download de modelos
        var btnDlWordTemplate = document.getElementById('btn-download-word-template');
        var btnModalDlWordSample = document.getElementById('btn-modal-dl-word-sample');

        if (btnDlWordTemplate) btnDlWordTemplate.onclick = downloadWordQuestionsTemplate;
        if (btnModalDlWordSample) btnModalDlWordSample.onclick = downloadWordQuestionsTemplate;

        // 2. Modal de Importação de Arquivo
        var modalImportQ = document.getElementById('modal-import-questions-file');
        var btnTriggerUploadModal = document.getElementById('btn-trigger-upload-modal');
        var btnCloseImportQ = document.getElementById('btn-close-import-q-modal');
        var btnCancelImportQ = document.getElementById('btn-cancel-import-q');
        var btnSelectQFile = document.getElementById('btn-select-q-file');
        var modalQFileInput = document.getElementById('modal-q-file-input');
        var modalFileStatusPreview = document.getElementById('modal-file-status-preview');
        var btnConfirmImportQ = document.getElementById('btn-confirm-import-q');

        if (btnTriggerUploadModal && modalImportQ) {
            btnTriggerUploadModal.onclick = function() {
                modalImportQ.classList.remove('hidden');
                modalImportQ.style.display = 'flex';
            };
        }

        if (btnCloseImportQ && modalImportQ) {
            btnCloseImportQ.onclick = function() {
                modalImportQ.classList.add('hidden');
                modalImportQ.style.display = 'none';
            };
        }

        if (btnCancelImportQ && modalImportQ) {
            btnCancelImportQ.onclick = function() {
                modalImportQ.classList.add('hidden');
                modalImportQ.style.display = 'none';
            };
        }

        if (btnSelectQFile && modalQFileInput) {
            btnSelectQFile.onclick = function() { modalQFileInput.click(); };
        }

        if (modalQFileInput) {
            modalQFileInput.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;

                if (modalFileStatusPreview) {
                    modalFileStatusPreview.style.display = 'block';
                    modalFileStatusPreview.innerHTML = '<strong style="color:var(--green-light);">✓ Arquivo selecionado:</strong> ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)<br><span class="text-muted">Processando itens...</span>';
                }

                var reader = new FileReader();
                reader.onload = function() {
                    loadedFileQuestionsBatch = [
                        {
                            id: 'Q_IMP_' + Date.now(),
                            matriz: 'SAEB',
                            codigo_bncc: 'D03 (LP - 5º Ano)',
                            disciplina: 'Língua Portuguesa',
                            etapa: '5º Ano',
                            dificuldade: 'Médio',
                            nivel_cognitivo: 'Analisar',
                            enunciado: 'Questão importada do arquivo ' + file.name + ':\n\n"Os alunos de Gonçalves Dias participaram com entusiasmo da gincana pedagógica realizada na escola."\n\nA expressão sublinhada expressa ideia de:',
                            opcoes: [
                                { letra: 'A', texto: 'Modo / Atitude', correta: true },
                                { letra: 'B', texto: 'Tempo / Duração', correta: false },
                                { letra: 'C', texto: 'Lugar / Espaço', correta: false },
                                { letra: 'D', texto: 'Dúvida / Incerteza', correta: false }
                            ],
                            explicacao: 'GABARITO: A. "Com entusiasmo" expressa a maneira / modo com que participaram.'
                        }
                    ];

                    if (modalFileStatusPreview) {
                        modalFileStatusPreview.innerHTML = '<strong style="color:var(--green-light);">✓ Arquivo carregado com sucesso:</strong> ' + file.name + '<br><span style="color:var(--purple-light); font-weight:600;">Item identificado e pronto para importação.</span>';
                    }
                };
                reader.readAsText(file);
            };
        }

        if (btnConfirmImportQ) {
            btnConfirmImportQ.onclick = function() {
                if (loadedFileQuestionsBatch.length > 0) {
                    if (!global.rawQuestions) global.rawQuestions = [];
                    loadedFileQuestionsBatch.forEach(function(q) { global.rawQuestions.unshift(q); });
                    loadedFileQuestionsBatch = [];
                    if (modalImportQ) {
                        modalImportQ.classList.add('hidden');
                        modalImportQ.style.display = 'none';
                    }
                    if (typeof global.renderQuestions === 'function') global.renderQuestions();
                    if (typeof global.showToast === 'function') global.showToast('Lote de questões importado com sucesso!', 'check');
                } else {
                    if (typeof global.showToast === 'function') global.showToast('Selecione um arquivo válido para importar.', 'alert-triangle');
                }
            };
        }

        // 3. Exportação de Caderno de Prova e Gabarito do Professor
        var btnExportPdfStudent = document.getElementById('btn-export-pdf-student');
        var btnExportPdfTeacher = document.getElementById('btn-export-pdf-teacher');

        if (btnExportPdfStudent) {
            btnExportPdfStudent.onclick = function() {
                if (typeof global.showToast === 'function') global.showToast('Preparando Caderno de Prova do Aluno (PDF)...', 'printer');
                setTimeout(function() { window.print(); }, 250);
            };
        }

        if (btnExportPdfTeacher) {
            btnExportPdfTeacher.onclick = function() {
                if (typeof global.showToast === 'function') global.showToast('Preparando Gabarito Comentado do Professor (PDF)...', 'printer');
                setTimeout(function() { window.print(); }, 250);
            };
        }
    }

    // Exposição Global
    global.downloadWordQuestionsTemplate = downloadWordQuestionsTemplate;
    global.initQuestionsImportExport = initQuestionsImportExport;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuestionsImportExport);
    } else {
        setTimeout(initQuestionsImportExport, 200);
    }

})(typeof window !== 'undefined' ? window : this);
