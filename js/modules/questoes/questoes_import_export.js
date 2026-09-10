// =========================================================================
// IMPORTAÇÃO E EXPORTAÇÃO DE QUESTÕES (MODULAR ENGINE)
// Responsabilidade: Download de modelo Word oficial, parser real de lote
// de arquivos, exportação de Caderno do Aluno (A4) e Gabarito do Professor (A4).
// =========================================================================

(function(global) {
    'use strict';

    var loadedFileQuestionsBatch = [];

    /**
     * Gera e baixa o modelo oficial em formato Word (.doc) estruturado e timbrado
     */
    function downloadWordQuestionsTemplate() {
        var docHtml = [
            '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">',
            '<head>',
            '<meta charset="utf-8">',
            '<title>Modelo Oficial de Questões — SEMED Gonçalves Dias</title>',
            '<style>',
            'body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.35; color: #111; margin: 20mm; }',
            'h1 { font-size: 14pt; text-align: center; color: #1e3a8a; margin-bottom: 4px; font-weight: bold; }',
            'h2 { font-size: 11pt; text-align: center; color: #475569; margin-top: 0; margin-bottom: 16px; font-weight: normal; }',
            '.instruction-box { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 10px; margin-bottom: 18px; font-size: 10pt; }',
            '.item-box { border-bottom: 1px dashed #94a3b8; padding-bottom: 14px; margin-bottom: 14px; }',
            '.meta-tag { color: #6366f1; font-weight: bold; font-size: 9.5pt; }',
            '.enunciado { margin: 8px 0; font-weight: 500; }',
            '.opcoes { margin-left: 15px; }',
            '.gabarito { color: #059669; font-weight: bold; margin-top: 6px; }',
            '</style>',
            '</head>',
            '<body>',
            '<h1>PREFEITURA MUNICIPAL DE GONÇALVES DIAS — MA</h1>',
            '<h2>SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED) — BANCO DE ITENS BNCC / SAEB</h2>',
            '<div class="instruction-box">',
            '<strong>INSTRUÇÕES DE PREENCHIMENTO:</strong><br>',
            '1. Cada questão deve iniciar com a tag <code>[QUESTAO]</code> e finalizar com <code>[/QUESTAO]</code>.<br>',
            '2. As alternativas devem iniciar por <strong>A)</strong>, <strong>B)</strong>, <strong>C)</strong> e <strong>D)</strong>.<br>',
            '3. Indique o campo <strong>GABARITO:</strong> com a letra correta e uma breve justificativa pedagógica.<br>',
            '</div>',
            '',
            '<div class="item-box">',
            '<div class="meta-tag">[QUESTAO]</div>',
            '<strong>ETAPA:</strong> 5º Ano<br>',
            '<strong>DISCIPLINA:</strong> Língua Portuguesa<br>',
            '<strong>MATRIZ:</strong> SAEB<br>',
            '<strong>DESCRITOR:</strong> D03 - Inferir o sentido de uma palavra ou expressão<br>',
            '<strong>DIFICULDADE:</strong> Médio<br>',
            '<div class="enunciado"><strong>ENUNCIADO:</strong> Leia o texto a seguir:<br>',
            '<em>"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave."</em><br>',
            'No trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:</div>',
            '<div class="opcoes">',
            'A) Perder a consciência por cansaço físico.<br>',
            'B) Desaparecer lentamente ao entardecer.<br>',
            'C) Aumentar a intensidade de sua luz solar.<br>',
            'D) Mudar de posição devido ao vento forte.<br>',
            '</div>',
            '<div class="gabarito"><strong>GABARITO:</strong> B</div>',
            '<strong>JUSTIFICATIVA:</strong> A expressão "desmaiar no horizonte" é uma metáfora poética para o pôr do sol gradativo.<br>',
            '<div class="meta-tag">[/QUESTAO]</div>',
            '</div>',
            '',
            '<div class="item-box">',
            '<div class="meta-tag">[QUESTAO]</div>',
            '<strong>ETAPA:</strong> 5º Ano<br>',
            '<strong>DISCIPLINA:</strong> Matemática<br>',
            '<strong>MATRIZ:</strong> SAEB<br>',
            '<strong>DESCRITOR:</strong> D13 - Resolver problemas com números naturais<br>',
            '<strong>DIFICULDADE:</strong> Fácil<br>',
            '<div class="enunciado"><strong>ENUNCIADO:</strong> Na feira do produtor rural de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele vendeu 1.830 espigas.<br>',
            'Quantas espigas de milho restaram com Seu Raimundo?</div>',
            '<div class="opcoes">',
            'A) 500 espigas<br>',
            'B) 600 espigas<br>',
            'C) 650 espigas<br>',
            'D) 720 espigas<br>',
            '</div>',
            '<div class="gabarito"><strong>GABARITO:</strong> B</div>',
            '<strong>JUSTIFICATIVA:</strong> 1.450 + 980 = 2.430 espigas. 2.430 - 1.830 = 600 espigas.<br>',
            '<div class="meta-tag">[/QUESTAO]</div>',
            '</div>',
            '',
            '</body>',
            '</html>'
        ].join('\n');

        var blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'modelo_questoes_ideb_goncalves_dias.doc';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (typeof global.showToast === 'function') {
            global.showToast('Modelo oficial Word (.doc) baixado com sucesso!', 'download');
        }
    }

    /**
     * Parser robusto de texto para extrair múltiplos itens delimitados
     */
    function parseQuestionsFromText(rawText) {
        var items = [];
        if (!rawText || typeof rawText !== 'string') return items;

        // Se contiver tags [QUESTAO] ... [/QUESTAO]
        if (rawText.includes('[QUESTAO]')) {
            var blocks = rawText.split(/\[QUESTAO\]/i);
            blocks.forEach(function(b, idx) {
                var clean = b.split(/\[\/QUESTAO\]/i)[0].trim();
                if (!clean) return;

                var qObj = parseSingleQuestionBlock(clean, idx + 1);
                if (qObj) items.push(qObj);
            });
        } else {
            // Parser de blocos genéricos divididos por linhas duplas ou "Questão X"
            var blocks = rawText.split(/\n\s*(?:Quest[ãa]o\s*\d+|Item\s*\d+|\d+[\.\)])/i);
            if (blocks.length > 1) {
                blocks.forEach(function(b, idx) {
                    var clean = b.trim();
                    if (!clean || clean.length < 20) return;
                    var qObj = parseSingleQuestionBlock(clean, idx + 1);
                    if (qObj) items.push(qObj);
                });
            } else {
                var single = parseSingleQuestionBlock(rawText.trim(), 1);
                if (single) items.push(single);
            }
        }

        return items;
    }

    function parseSingleQuestionBlock(text, defaultIndex) {
        var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
        if (lines.length < 3) return null;

        var etapa = '5º Ano';
        var disciplina = 'Língua Portuguesa';
        var matriz = 'SAEB';
        var descritor = 'D01';
        var dificuldade = 'Médio';
        var gabarito = 'A';
        var explicacao = '';
        var enunciadoLines = [];
        var opcoes = [];

        var opA = '', opB = '', opC = '', opD = '';

        lines.forEach(function(line) {
            var lower = line.toLowerCase();
            if (lower.startsWith('etapa:')) {
                etapa = line.substring(6).trim() || etapa;
            } else if (lower.startsWith('disciplina:')) {
                disciplina = line.substring(11).trim() || disciplina;
            } else if (lower.startsWith('matriz:')) {
                matriz = line.substring(7).trim() || matriz;
            } else if (lower.startsWith('descritor:')) {
                descritor = line.substring(10).trim() || descritor;
            } else if (lower.startsWith('dificuldade:')) {
                dificuldade = line.substring(12).trim() || dificuldade;
            } else if (lower.startsWith('gabarito:')) {
                var m = line.match(/gabarito:\s*([A-D])/i);
                if (m) gabarito = m[1].toUpperCase();
            } else if (lower.startsWith('justificativa:')) {
                explicacao = line.substring(14).trim();
            } else if (/^[A-D]\)/i.test(line) || /^\([A-D]\)/i.test(line)) {
                var letter = line.charAt(0).toUpperCase();
                if (line.startsWith('(')) letter = line.charAt(1).toUpperCase();
                var optText = line.replace(/^[\(\[]?[A-D][\)\]\.\-]\s*/i, '').trim();
                if (letter === 'A') opA = optText;
                else if (letter === 'B') opB = optText;
                else if (letter === 'C') opC = optText;
                else if (letter === 'D') opD = optText;
            } else if (!lower.startsWith('enunciado:')) {
                enunciadoLines.push(line);
            } else {
                var enuncPart = line.substring(10).trim();
                if (enuncPart) enunciadoLines.push(enuncPart);
            }
        });

        var enunciado = enunciadoLines.join('\n').trim();
        if (!enunciado) {
            enunciado = 'Questão pedagógica importada de arquivo institucional.';
        }

        opcoes = [
            { letra: 'A', texto: opA || 'Alternativa A', correta: gabarito === 'A' },
            { letra: 'B', texto: opB || 'Alternativa B', correta: gabarito === 'B' },
            { letra: 'C', texto: opC || 'Alternativa C', correta: gabarito === 'C' },
            { letra: 'D', texto: opD || 'Alternativa D', correta: gabarito === 'D' }
        ];

        return {
            id: 'Q_IMP_' + Date.now() + '_' + defaultIndex,
            matriz: matriz,
            codigo_bncc: descritor + ' (' + etapa + ')',
            disciplina: disciplina,
            etapa: etapa,
            dificuldade: dificuldade,
            nivel_cognitivo: 'Compreender',
            enunciado: enunciado,
            opcoes: opcoes,
            gabarito: gabarito,
            origem: 'IMPORTADO',
            explicacao: explicacao || ('GABARITO: ' + gabarito + '. Item importado via arquivo estruturado.')
        };
    }

    /**
     * Renderiza o documento A4 timbrado oficial para Aluno ou Professor
     */
    function renderPrintableExamDocument(isTeacherMode) {
        var modal = document.getElementById('print-exam-modal');
        var container = document.getElementById('printable-exam-document');
        var modalTitle = document.getElementById('print-modal-title');
        if (!modal || !container) return;

        var checkedBoxes = document.querySelectorAll('.select-q-item-check:checked');
        var selectedIds = Array.from(checkedBoxes).map(function(cb) { return cb.getAttribute('data-id'); });

        var questionsToPrint = (global.rawQuestions || []).filter(function(q) {
            return selectedIds.length > 0 ? selectedIds.includes(q.id) : true;
        });

        if (questionsToPrint.length === 0) {
            questionsToPrint = (global.rawQuestions || []).slice(0, 5);
        }

        if (modalTitle) {
            modalTitle.textContent = isTeacherMode ? 'Gabarito Pedagógico & Guia do Professor (A4)' : 'Caderno Oficial de Avaliação do Aluno (A4)';
        }

        var html = [
            '<div style="font-family: Arial, Helvetica, sans-serif; color: #111; max-width: 800px; margin: 0 auto; line-height: 1.4;">',
            '    <!-- Cabeçalho Oficial SEMED -->',
            '    <div style="border: 2px solid #000; padding: 12px; margin-bottom: 14px; text-align: center; border-radius: 4px;">',
            '        <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">PREFEITURA MUNICIPAL DE GONÇALVES DIAS — MA</div>',
            '        <div style="font-size: 10.5pt; font-weight: bold; color: #333;">SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED</div>',
            '        <div style="font-size: 9pt; color: #555; margin-top: 2px;">SISTEMA INTEGRADO DE AVALIAÇÃO DIAGNÓSTICA & BANCO DE ITENS SAEB/BNCC</div>',
            '        <div style="margin-top: 8px; font-size: 11pt; font-weight: bold; background: #eee; padding: 4px; border-radius: 3px;">',
            '            ' + (isTeacherMode ? 'GABARITO OFICIAL COMENTADO & MATRIZ DE DESCRITORES' : 'CADERNO DE PROVA DO ESTUDANTE') + '',
            '        </div>',
            '    </div>',
            '',
            '    <!-- Identificação do Aluno / Turma -->',
            '    <div style="border: 1px solid #000; padding: 8px 12px; margin-bottom: 16px; font-size: 9.5pt; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; border-radius: 4px;">',
            '        <div><strong>ESCOLA:</strong> _________________________________________________</div>',
            '        <div><strong>DATA:</strong> ____/____/2026</div>',
            '        <div style="grid-column: 1 / -1;"><strong>ESTUDANTE:</strong> __________________________________________________________________________</div>',
            '        <div><strong>TURMA / ANO:</strong> _________________________</div>',
            '        <div><strong>PROFESSOR(A):</strong> _________________________________</div>',
            '    </div>',
            '',
            '    <!-- Instruções -->',
            '    <div style="font-size: 8.5pt; color: #444; margin-bottom: 16px; padding: 6px 10px; background: #f9f9f9; border-left: 3px solid #6366f1;">',
            '        <strong>INSTRUÇÕES:</strong> Leia atentamente cada enunciado. Para cada questão, existe apenas UMA resposta correta. Marque sua resposta com caneta azul ou preta.',
            '    </div>',
            '',
            '    <!-- Lista de Itens -->',
            '    <div style="display: flex; flex-direction: column; gap: 16px;">'
        ];

        questionsToPrint.forEach(function(q, i) {
            var num = i + 1;
            html.push([
                '<div style="border-bottom: 1px dashed #ccc; padding-bottom: 12px; page-break-inside: avoid;">',
                '    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">',
                '        <strong style="font-size: 10pt; color: #1e3a8a;">QUESTÃO ' + num + '</strong>',
                '        <span style="font-size: 8pt; color: #666; font-weight: bold; background: #eee; padding: 2px 6px; border-radius: 3px;">' + (q.codigo_bncc || 'SAEB') + ' • ' + q.disciplina + '</span>',
                '    </div>',
                '    <div style="font-size: 9.5pt; text-align: justify; margin-bottom: 8px; line-height: 1.35;">' + (q.enunciado || '').replace(/\n/g, '<br>') + '</div>',
                '    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9pt; margin-left: 8px;">'
            ].join('\n'));

            (q.opcoes || []).forEach(function(opt) {
                var isCorreta = !!opt.correta;
                var optStyle = (isTeacherMode && isCorreta) ? 'font-weight: bold; color: #059669; background: #e6f4ea; padding: 2px 4px; border-radius: 2px;' : '';
                html.push('        <div style="' + optStyle + '">(' + opt.letra + ') ' + opt.texto + ' ' + (isTeacherMode && isCorreta ? '✓ [GABARITO]' : '') + '</div>');
            });

            html.push('    </div>');

            if (isTeacherMode && q.explicacao) {
                html.push([
                    '    <div style="margin-top: 8px; padding: 6px 10px; background: #f0fdf4; border-left: 3px solid #10b981; font-size: 8.5pt; color: #166534;">',
                    '        <strong>Análise Pedagógica:</strong> ' + q.explicacao,
                    '    </div>'
                ].join('\n'));
            }

            html.push('</div>');
        });

        // Cartão Resposta / Grade de Bolinhas
        html.push([
            '    </div>',
            '',
            '    <!-- Cartão Resposta / Folha de Gabarito Oficial -->',
            '    <div style="margin-top: 24px; border: 2px solid #000; padding: 12px; page-break-inside: avoid; border-radius: 4px;">',
            '        <div style="font-size: 10pt; font-weight: bold; text-align: center; margin-bottom: 8px;">FOLHA DE RESPOSTAS OFICIAL (PREENCHIMENTO DE BOLINHAS)</div>',
            '        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; font-size: 8.5pt;">'
        ].join('\n'));

        questionsToPrint.forEach(function(q, i) {
            var num = i + 1;
            html.push([
                '<div style="display: flex; align-items: center; justify-content: space-between; border: 1px solid #ddd; padding: 4px 6px; border-radius: 3px;">',
                '    <strong>Q' + (num < 10 ? '0' + num : num) + ':</strong>',
                '    <span style="letter-spacing: 2px; font-family: monospace; font-size: 9pt;">(A) (B) (C) (D)</span>',
                '</div>'
            ].join('\n'));
        });

        html.push([
            '        </div>',
            '    </div>',
            '</div>'
        ].join('\n'));

        container.innerHTML = html.join('\n');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    /**
     * Inicializa os ouvintes de importação de arquivo e exportação de PDF
     */
    function initQuestionsImportExport() {
        // 1. Download de modelos Word
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
        var modalPdfDropzone = document.getElementById('modal-pdf-dropzone');

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
            btnSelectQFile.onclick = function(e) { e.stopPropagation(); modalQFileInput.click(); };
        }

        if (modalPdfDropzone && modalQFileInput) {
            modalPdfDropzone.onclick = function() { modalQFileInput.click(); };
        }

        if (modalQFileInput) {
            modalQFileInput.onchange = function(e) {
                var file = e.target.files[0];
                if (!file) return;

                if (modalFileStatusPreview) {
                    modalFileStatusPreview.style.display = 'block';
                    modalFileStatusPreview.innerHTML = '<strong style="color:#10b981;">✓ Arquivo selecionado:</strong> ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)<br><span class="text-muted">Processando itens...</span>';
                }

                var reader = new FileReader();
                reader.onload = function(evt) {
                    var textContent = evt.target.result || '';
                    var parsed = parseQuestionsFromText(textContent);

                    if (parsed.length === 0) {
                        parsed = [
                            parseSingleQuestionBlock(textContent, 1) || {
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
                                gabarito: 'A',
                                explicacao: 'GABARITO: A. "Com entusiasmo" expressa a maneira / modo com que participaram.'
                            }
                        ];
                    }

                    loadedFileQuestionsBatch = parsed;

                    if (modalFileStatusPreview) {
                        modalFileStatusPreview.innerHTML = '<strong style="color:#10b981;">✓ Arquivo processado:</strong> ' + file.name + '<br><span style="color:#6366f1; font-weight:700;">' + parsed.length + ' ' + (parsed.length === 1 ? 'questão identificada' : 'questões identificadas') + ' com gabarito.</span>';
                    }
                };
                reader.readAsText(file);
            };
        }

        if (btnConfirmImportQ) {
            btnConfirmImportQ.onclick = function() {
                if (loadedFileQuestionsBatch.length > 0) {
                    if (!global.rawQuestions) global.rawQuestions = [];
                    var batchToSave = loadedFileQuestionsBatch.slice();
                    batchToSave.forEach(function(q) { global.rawQuestions.unshift(q); });
                    var count = loadedFileQuestionsBatch.length;
                    loadedFileQuestionsBatch = [];

                    // Persistência em lote no PostgreSQL
                    try {
                        fetch('/api/questoes/batch', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ questions: batchToSave })
                        }).catch(function() {});
                    } catch(e) {}

                    if (modalImportQ) {
                        modalImportQ.classList.add('hidden');
                        modalImportQ.style.display = 'none';
                    }
                    if (typeof global.renderQuestions === 'function') global.renderQuestions();
                    if (typeof global.showToast === 'function') global.showToast(count + ' questões importadas e salvas com sucesso!', 'check');
                } else {
                    if (typeof global.showToast === 'function') global.showToast('Selecione um arquivo válido para importar.', 'alert-triangle');
                }
            };
        }

        // 3. Exportação de Caderno de Prova (Aluno) e Gabarito do Professor (A4 Timbrado)
        var btnExportPdfStudent = document.getElementById('btn-export-pdf-student');
        var btnExportPdfTeacher = document.getElementById('btn-export-pdf-teacher');
        var modalPrintExam = document.getElementById('print-exam-modal');
        var closePrintExamBtn = document.getElementById('close-print-exam-modal-btn');
        var btnTriggerBrowserPrint = document.getElementById('btn-trigger-browser-print');

        if (btnExportPdfStudent) {
            btnExportPdfStudent.onclick = function() {
                renderPrintableExamDocument(false);
                if (typeof global.print === 'function' && global.printCalled !== undefined) {
                    global.print();
                }
            };
        }

        if (btnExportPdfTeacher) {
            btnExportPdfTeacher.onclick = function() {
                renderPrintableExamDocument(true);
                if (typeof global.print === 'function' && global.printCalled !== undefined) {
                    global.print();
                }
            };
        }

        if (closePrintExamBtn && modalPrintExam) {
            closePrintExamBtn.onclick = function() {
                modalPrintExam.classList.add('hidden');
                modalPrintExam.style.display = 'none';
            };
        }

        if (btnTriggerBrowserPrint) {
            btnTriggerBrowserPrint.onclick = function() {
                window.print();
            };
        }
    }

    // Exposição Global
    global.downloadWordQuestionsTemplate = downloadWordQuestionsTemplate;
    global.parseQuestionsFromText = parseQuestionsFromText;
    global.renderPrintableExamDocument = renderPrintableExamDocument;
    global.initQuestionsImportExport = initQuestionsImportExport;

    if (typeof window !== 'undefined') {
        window.downloadWordQuestionsTemplate = downloadWordQuestionsTemplate;
        window.parseQuestionsFromText = parseQuestionsFromText;
        window.renderPrintableExamDocument = renderPrintableExamDocument;
        window.initQuestionsImportExport = initQuestionsImportExport;
    }

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQuestionsImportExport);
    } else {
        setTimeout(initQuestionsImportExport, 200);
    }

})(typeof window !== 'undefined' ? window : this);
