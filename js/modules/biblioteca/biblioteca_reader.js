/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — LEITOR IN-APP & CADERNO A4 (BIBLIOTECA)
 * Arquivo: js/modules/biblioteca/biblioteca_reader.js
 * Descrição: Leitor integrado in-app (PDF.js + Mammoth.js), download de arquivos,
 *            impressão e gerador de caderno unificado A4.
 * ============================================================================
 */

(function(global) {
    'use strict';

    // Inicialização do Worker do PDF.js
    if (global.pdfjsLib) {
        global.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    // Estado do Leitor Ativo
    var activeReaderState = {
        book: null,
        pdfDoc: null,
        currentPage: 1,
        totalPages: 1,
        scale: 1.2,
        isRendering: false,
        pageNumPending: null
    };

    function getAuthToken() {
        return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || (function() {
            var email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || 'admin@goncalvesdias.ma.gov.br';
            try { return btoa(email); } catch(e) { return ''; }
        })();
    }

    // -------------------------------------------------------------------------
    // 1. LEITOR INTEGRADO IN-APP (PDF.JS + MAMMOTH.JS)
    // -------------------------------------------------------------------------
    function openBibliotecaReader(book) {
        if (!book) return;
        activeReaderState.book = book;

        var modal = document.getElementById('modal-biblioteca-reader');
        if (!modal) return;

        // Resetar UI
        var titleEl = document.getElementById('reader-doc-title');
        var badgeEl = document.getElementById('reader-doc-format-badge');
        var metaEl = document.getElementById('reader-doc-meta');
        var iconEl = document.getElementById('reader-doc-icon');
        var spinner = document.getElementById('reader-loading-spinner');
        var errorBanner = document.getElementById('reader-error-banner');
        var pdfWrapper = document.getElementById('reader-pdf-canvas-wrapper');
        var wordWrapper = document.getElementById('reader-word-html-container');
        var toolbar = document.getElementById('reader-toolbar-container');

        var isWord = (book.formatoArquivo === 'DOCX' || book.formatoArquivo === 'DOC') || (book.fileName && (book.fileName.toLowerCase().endsWith('.docx') || book.fileName.toLowerCase().endsWith('.doc')));
        var formatText = isWord ? 'DOCX / Word' : 'PDF Digital';

        if (titleEl) titleEl.textContent = book.titulo;
        if (badgeEl) badgeEl.textContent = formatText;
        if (metaEl) metaEl.textContent = (book.etapa || 'SEMED') + ' • ' + (book.componente || 'Pedagógico') + ' • ' + (book.fileSize || '');
        if (iconEl) {
            iconEl.innerHTML = '<i data-lucide="' + (isWord ? 'file-text' : 'file') + '" style="width: 20px; height: 20px;"></i>';
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
        }

        var btnDownload = document.getElementById('btn-reader-download-original');
        if (btnDownload) {
            btnDownload.onclick = function() { trackAndDownloadBookPdf(book.id); };
        }

        if (spinner) spinner.style.display = 'flex';
        if (errorBanner) { errorBanner.style.display = 'none'; errorBanner.classList.add('hidden'); }
        if (pdfWrapper) pdfWrapper.style.display = 'none';
        if (wordWrapper) { wordWrapper.style.display = 'none'; wordWrapper.classList.add('hidden'); }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        var token = getAuthToken();
        var targetFileId = book.fileName || book.id;
        var fileUrl = '/api/library/files/' + encodeURIComponent(targetFileId);

        if (isWord) {
            // Renderizador DOCX via Mammoth.js
            if (toolbar) toolbar.style.display = 'none';
            fetch(fileUrl, {
                headers: { 'Authorization': 'Bearer ' + token }
            })
            .then(function(res) {
                if (!res.ok) throw new Error('Falha na resposta do servidor (HTTP ' + res.status + ')');
                return res.arrayBuffer();
            })
            .then(function(arrayBuffer) {
                if (!global.mammoth) {
                    throw new Error('Biblioteca Mammoth.js não está carregada.');
                }
                return global.mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            })
            .then(function(result) {
                if (spinner) spinner.style.display = 'none';
                if (wordWrapper) {
                    wordWrapper.innerHTML = `
                        <div style="border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
                            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                                <span class="badge badge-purple">Documento Word (.docx)</span>
                                <span style="font-size:0.75rem; color:#64748b;">Convertido com Mammoth.js</span>
                            </div>
                            <h2 style="color: #0f172a; margin: 0 0 4px 0; font-size: 1.4rem;">${book.titulo}</h2>
                            <p style="color: #64748b; margin: 0; font-size: 0.85rem;">${book.subtitulo || ''}</p>
                        </div>
                        <div class="word-content-body">
                            ${result.value}
                        </div>
                    `;
                    wordWrapper.style.display = 'block';
                    wordWrapper.classList.remove('hidden');
                }
            })
            .catch(function(err) {
                console.error('[Mammoth Reader Error]', err);
                if (spinner) spinner.style.display = 'none';
                showReaderError('Não foi possível renderizar o arquivo Word.', err.message || 'Verifique as permissões de acesso ou utilize o botão de download.');
            });

        } else {
            // Renderizador PDF página por página via PDF.js
            if (toolbar) toolbar.style.display = 'flex';
            activeReaderState.currentPage = 1;
            activeReaderState.scale = 1.2;

            if (!global.pdfjsLib) {
                if (spinner) spinner.style.display = 'none';
                showReaderError('Leitor PDF não disponível.', 'A biblioteca PDF.js não pôde ser carregada.');
                return;
            }

            var loadingTask = global.pdfjsLib.getDocument({
                url: fileUrl,
                httpHeaders: { 'Authorization': 'Bearer ' + token }
            });

            loadingTask.promise.then(function(pdfDoc) {
                activeReaderState.pdfDoc = pdfDoc;
                activeReaderState.totalPages = pdfDoc.numPages;

                var totalPagesEl = document.getElementById('pdf-total-pages');
                if (totalPagesEl) totalPagesEl.textContent = String(pdfDoc.numPages);

                renderPdfPage(activeReaderState.currentPage);
            }).catch(function(err) {
                console.error('[PDF.js Loading Error]', err);
                if (spinner) spinner.style.display = 'none';
                showReaderError('Erro ao abrir o documento PDF.', err.message || 'Arquivo indisponível no storage ou permissão insuficiente.');
            });
        }
    }

    function renderPdfPage(num) {
        if (!activeReaderState.pdfDoc) return;
        activeReaderState.isRendering = true;

        var spinner = document.getElementById('reader-loading-spinner');
        if (spinner) spinner.style.display = 'flex';

        activeReaderState.pdfDoc.getPage(num).then(function(page) {
            var canvas = document.getElementById('reader-pdf-canvas');
            var wrapper = document.getElementById('reader-pdf-canvas-wrapper');
            if (!canvas || !wrapper) return;

            var viewport = page.getViewport({ scale: activeReaderState.scale });
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            var ctx = canvas.getContext('2d');
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            var renderTask = page.render(renderContext);
            renderTask.promise.then(function() {
                activeReaderState.isRendering = false;
                if (spinner) spinner.style.display = 'none';
                wrapper.style.display = 'block';

                if (activeReaderState.pageNumPending !== null) {
                    renderPdfPage(activeReaderState.pageNumPending);
                    activeReaderState.pageNumPending = null;
                }
            });
        });

        var currentPageEl = document.getElementById('pdf-current-page');
        if (currentPageEl) currentPageEl.textContent = String(num);

        var zoomLevelEl = document.getElementById('pdf-zoom-level');
        if (zoomLevelEl) zoomLevelEl.textContent = Math.round(activeReaderState.scale * 100) + '%';
    }

    function queueRenderPdfPage(num) {
        if (activeReaderState.isRendering) {
            activeReaderState.pageNumPending = num;
        } else {
            renderPdfPage(num);
        }
    }

    function onPdfPrevPage() {
        if (activeReaderState.currentPage <= 1) return;
        activeReaderState.currentPage--;
        queueRenderPdfPage(activeReaderState.currentPage);
    }

    function onPdfNextPage() {
        if (!activeReaderState.pdfDoc || activeReaderState.currentPage >= activeReaderState.totalPages) return;
        activeReaderState.currentPage++;
        queueRenderPdfPage(activeReaderState.currentPage);
    }

    function onPdfZoomIn() {
        if (activeReaderState.scale >= 3.0) return;
        activeReaderState.scale += 0.2;
        queueRenderPdfPage(activeReaderState.currentPage);
    }

    function onPdfZoomOut() {
        if (activeReaderState.scale <= 0.6) return;
        activeReaderState.scale -= 0.2;
        queueRenderPdfPage(activeReaderState.currentPage);
    }

    function onPdfZoomReset() {
        activeReaderState.scale = 1.2;
        queueRenderPdfPage(activeReaderState.currentPage);
    }

    function showReaderError(title, desc) {
        var errorBanner = document.getElementById('reader-error-banner');
        var errTitle = document.getElementById('reader-error-title');
        var errDesc = document.getElementById('reader-error-desc');
        if (errTitle) errTitle.textContent = title;
        if (errDesc) errDesc.textContent = desc;
        if (errorBanner) {
            errorBanner.classList.remove('hidden');
            errorBanner.style.display = 'block';
        }
    }

    function closeBibliotecaReader() {
        var modal = document.getElementById('modal-biblioteca-reader');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
        activeReaderState.pdfDoc = null;
        activeReaderState.book = null;
    }

    // -------------------------------------------------------------------------
    // 2. DOWNLOAD E IMPRESSÃO DE ARQUIVOS
    // -------------------------------------------------------------------------
    async function trackAndDownloadBookPdf(bookId) {
        var libraryItems = global.PEDAGOGIC_LIBRARY_DATABASE || [];
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;

        book.viewsCount = (book.viewsCount || 0) + 1;
        book.downloadsCount = (book.downloadsCount || 0) + 1;
        if (typeof global.renderSpotlightSection === 'function') {
            global.renderSpotlightSection();
        }

        var token = getAuthToken();
        var targetFileId = book.fileName || book.id;
        var fileUrl = '/api/library/files/' + encodeURIComponent(targetFileId);

        try {
            var res = await fetch(fileUrl, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (!res.ok) throw new Error('Não foi possível baixar o arquivo.');

            var blob = await res.blob();
            var downloadUrl = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = downloadUrl;
            a.download = book.originalFileName || book.fileName || (book.titulo + '.' + (book.formatoArquivo || 'pdf').toLowerCase());
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);

            if (typeof global.showToast === 'function') {
                global.showToast('Download do arquivo "' + (book.titulo) + '" concluído com sucesso!', 'check');
            }
        } catch(e) {
            console.error('[Download Error]', e);
            alert('Falha ao baixar arquivo. Verifique sua conexão e tente novamente.');
        }
    }

    function trackAndViewBook(bookId) {
        var libraryItems = global.PEDAGOGIC_LIBRARY_DATABASE || [];
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;
        openBibliotecaReader(book);
    }

    function trackAndPrintExam(bookId) {
        var libraryItems = global.PEDAGOGIC_LIBRARY_DATABASE || [];
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;
        if (typeof global.generateA4PrintableExam === 'function') {
            global.generateA4PrintableExam(book);
        } else {
            trackAndViewBook(bookId);
        }
    }

    // -------------------------------------------------------------------------
    // 3. MODAL E MOTOR: GERAR CADERNO A4 COMBINADO
    // -------------------------------------------------------------------------
    function openCombinedCadernoModal() {
        var modal = document.getElementById('modal-combine-caderno-a4');
        var listContainer = document.getElementById('modal-combine-simulados-list');
        if (!modal || !listContainer) return;

        var etapaFilter = (document.getElementById('filter-bib-etapa') && document.getElementById('filter-bib-etapa').value) || 'all';
        var compFilter = (document.getElementById('filter-bib-componente') && document.getElementById('filter-bib-componente').value) || 'all';
        var searchVal = (document.getElementById('search-bib-input') && document.getElementById('search-bib-input').value.toLowerCase().trim()) || '';

        var allDb = global.PEDAGOGIC_LIBRARY_DATABASE || [];
        var simulados = allDb.filter(function(b) {
            if (b.categoria !== 'Simulados' && b.tipo !== 'Simulado') return false;
            var matchEtapa = etapaFilter === 'all' || b.etapa === etapaFilter;
            var matchComp = compFilter === 'all' || b.componente === compFilter || b.componente === 'Integrado';
            var matchSearch = !searchVal || 
                b.titulo.toLowerCase().includes(searchVal) || 
                (b.subtitulo && b.subtitulo.toLowerCase().includes(searchVal)) ||
                (b.descritores && b.descritores.some(function(d) { return d.toLowerCase().includes(searchVal); }));
            return matchEtapa && matchComp && matchSearch;
        });

        if (simulados.length === 0) {
            simulados = allDb.filter(function(b) { return b.categoria === 'Simulados' || b.tipo === 'Simulado'; });
        }

        listContainer.innerHTML = simulados.map(function(sim) {
            return [
                '<label style="display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.15s ease;">',
                '    <input type="checkbox" class="chk-combine-simulado" data-id="' + sim.id + '" onchange="updateCombinedSimuladoSelectionCount();" checked style="width: 18px; height: 18px; margin-top: 2px; accent-color: #6366f1;">',
                '    <div style="flex: 1;">',
                '        <div style="display: flex; justify-content: space-between; align-items: center;">',
                '            <strong style="font-size: 0.88rem; color: var(--text-primary);">' + sim.titulo + '</strong>',
                '            <span style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">' + (sim.versao || '2026') + '</span>',
                '        </div>',
                '        <span style="font-size: 0.75rem; color: var(--text-secondary); display: block; margin: 2px 0;">' + (sim.subtitulo || '') + '</span>',
                '        <div style="display: flex; gap: 6px; margin-top: 4px;">',
                '            <span class="badge badge-purple" style="font-size: 0.65rem;">' + sim.etapa + '</span>',
                '            <span class="badge badge-outline" style="font-size: 0.65rem;">' + sim.componente + '</span>',
                '            <span class="badge badge-outline" style="font-size: 0.65rem;">' + (sim.paginas || 4) + ' páginas</span>',
                '            <span class="badge badge-success" style="font-size: 0.65rem;">' + (sim.formato || 'PDF') + '</span>',
                '        </div>',
                '    </div>',
                '</label>'
            ].join('\n');
        }).join('\n');

        updateCombinedSimuladoSelectionCount();
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeCombinedCadernoModal() {
        var modal = document.getElementById('modal-combine-caderno-a4');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function updateCombinedSimuladoSelectionCount() {
        var checked = document.querySelectorAll('.chk-combine-simulado:checked');
        var countText = document.getElementById('modal-combine-selected-count');
        if (countText) {
            countText.textContent = checked.length + ' simulados selecionados para o caderno';
        }
    }

    function executeGenerateCombinedA4Booklet() {
        var checked = Array.from(document.querySelectorAll('.chk-combine-simulado:checked')).map(function(c) {
            return c.getAttribute('data-id');
        });
        if (checked.length === 0) {
            alert('Por favor, selecione pelo menos 1 simulado para gerar o caderno.');
            return;
        }

        var selectedBooks = (global.PEDAGOGIC_LIBRARY_DATABASE || []).filter(function(b) { return checked.includes(b.id); });
        closeCombinedCadernoModal();

        if (typeof global.showToast === 'function') {
            global.showToast('Gerando Caderno A4 Unificado com ' + selectedBooks.length + ' simulados...', 'sparkles');
        }

        setTimeout(function() {
            var combinedObj = {
                titulo: 'Caderno Unificado de Simulados SAEB/SEAMA (' + selectedBooks.length + ' Provas)',
                componente: 'Multidisciplinar Integrado',
                etapa: '5º e 9º Anos',
                formato: 'Caderno A4 Completo com Folha de Respostas Unificada',
                descricao: 'Compilado oficial de ' + selectedBooks.map(function(s) { return s.titulo; }).join(', ') + '. Gabaritos agrupados ao final do caderno.'
            };

            if (typeof global.generateA4PrintableExam === 'function') {
                global.generateA4PrintableExam(combinedObj);
            } else {
                window.print();
            }
        }, 400);
    }

    // Exposição no Escopo Global
    global.activeReaderState = activeReaderState;
    global.openBibliotecaReader = openBibliotecaReader;
    global.renderPdfPage = renderPdfPage;
    global.queueRenderPdfPage = queueRenderPdfPage;
    global.onPdfPrevPage = onPdfPrevPage;
    global.onPdfNextPage = onPdfNextPage;
    global.onPdfZoomIn = onPdfZoomIn;
    global.onPdfZoomOut = onPdfZoomOut;
    global.onPdfZoomReset = onPdfZoomReset;
    global.showReaderError = showReaderError;
    global.closeBibliotecaReader = closeBibliotecaReader;

    global.trackAndDownloadBookPdf = trackAndDownloadBookPdf;
    global.trackAndViewBook = trackAndViewBook;
    global.trackAndPrintExam = trackAndPrintExam;

    global.openCombinedCadernoModal = openCombinedCadernoModal;
    global.closeCombinedCadernoModal = closeCombinedCadernoModal;
    global.updateCombinedSimuladoSelectionCount = updateCombinedSimuladoSelectionCount;
    global.executeGenerateCombinedA4Booklet = executeGenerateCombinedA4Booklet;

})(typeof window !== 'undefined' ? window : this);
