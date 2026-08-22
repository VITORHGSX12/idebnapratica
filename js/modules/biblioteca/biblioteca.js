// =========================================================================
// BIBLIOTECA PEDAGÓGICA & ACERVO DIGITAL (MODULAR ENGINE)
// Responsabilidade: Gestão do acervo de provas, livros didáticos, simulados,
// upload atômico em storage de até 100MB (PDF/Word) com barra de progresso,
// leitor integrado in-app (PDF.js + Mammoth.js) e controle de permissões.
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY = 'gd_pedagogic_library_db';

    // Inicialização do Worker do PDF.js
    if (global.pdfjsLib) {
        global.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    var libraryItems = [];
    var currentActiveCategory = 'all';
    var searchDebounceTimer = null;

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

    // Obter Token de Autenticação Atual
    function getAuthToken() {
        return sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || (function() {
            var email = sessionStorage.getItem('userEmail') || localStorage.getItem('userEmail') || 'admin@goncalvesdias.ma.gov.br';
            try { return btoa(email); } catch(e) { return ''; }
        })();
    }

    // -------------------------------------------------------------------------
    // 1. CARREGAMENTO E SINCRONIZAÇÃO DO ACERVO
    // -------------------------------------------------------------------------
    async function loadLibraryDatabase() {
        var token = getAuthToken();
        try {
            var response = await fetch('/api/library', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (response.ok) {
                var data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    libraryItems = data;
                    global.PEDAGOGIC_LIBRARY_DATABASE = libraryItems;
                    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(libraryItems)); } catch(e) {}
                    renderPedagogicLibrary();
                    return;
                }
            }
        } catch(err) {
            console.warn('[Biblioteca Module] Falha ao sincronizar com backend, tentando cache local:', err);
        }

        // Fallback local caso o backend esteja offline
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    libraryItems = parsed;
                    global.PEDAGOGIC_LIBRARY_DATABASE = libraryItems;
                    renderPedagogicLibrary();
                    return;
                }
            }
        } catch(e) {}
    }

    // -------------------------------------------------------------------------
    // 2. ATUALIZAR CONTADORES DAS CATEGORIAS
    // -------------------------------------------------------------------------
    function updateCategoryPillCounters() {
        var total = libraryItems.length;
        var totalSimulados = libraryItems.filter(function(b) { return b.categoria === 'Simulados' || b.tipo === 'Simulado'; }).length;
        var totalReforco = libraryItems.filter(function(b) { return b.categoria === 'Reforco' || b.tipo === 'Reforco'; }).length;
        var totalMatrizes = libraryItems.filter(function(b) { return b.categoria === 'Matrizes' || b.tipo === 'Matriz'; }).length;
        var totalGuias = libraryItems.filter(function(b) { return b.categoria === 'Guias' || b.tipo === 'Guia'; }).length;

        var countAll = document.getElementById('count-bib-all');
        var countSim = document.getElementById('count-bib-simulados');
        var countRef = document.getElementById('count-bib-reforco');
        var countMat = document.getElementById('count-bib-matrizes');
        var countGui = document.getElementById('count-bib-guias');

        if (countAll) countAll.textContent = String(total);
        if (countSim) countSim.textContent = String(totalSimulados);
        if (countRef) countRef.textContent = String(totalReforco);
        if (countMat) countMat.textContent = String(totalMatrizes);
        if (countGui) countGui.textContent = String(totalGuias);
    }

    // -------------------------------------------------------------------------
    // 3. SELEÇÃO DE CATEGORIA (PILLS)
    // -------------------------------------------------------------------------
    function handleCategoryPillClick(btn, cat) {
        currentActiveCategory = cat;
        document.querySelectorAll('.bib-category-pill').forEach(function(b) {
            b.classList.remove('active');
            b.style.background = 'var(--bg-tertiary)';
            b.style.color = 'var(--text-secondary)';
            b.style.border = '1px solid var(--border-color)';
            b.style.fontWeight = '500';
        });

        if (btn) {
            btn.classList.add('active');
            btn.style.background = '#4f46e5';
            btn.style.color = '#ffffff';
            btn.style.border = 'none';
            btn.style.fontWeight = '700';
        }

        renderPedagogicLibrary();
    }

    // -------------------------------------------------------------------------
    // 4. AUTOCOMPLETE E FILTROS DE BUSCA
    // -------------------------------------------------------------------------
    function handleLibrarySearchInput(input) {
        clearTimeout(searchDebounceTimer);
        var query = (input.value || '').trim().toLowerCase();
        var suggestionsBox = document.getElementById('bib-search-suggestions');

        if (query.length < 2) {
            if (suggestionsBox) {
                suggestionsBox.innerHTML = '';
                suggestionsBox.style.display = 'none';
                suggestionsBox.classList.add('hidden');
            }
            renderPedagogicLibrary();
            return;
        }

        searchDebounceTimer = setTimeout(function() {
            var matches = libraryItems.filter(function(b) {
                var inTitle = (b.titulo || '').toLowerCase().indexOf(query) !== -1;
                var inSub = (b.subtitulo || '').toLowerCase().indexOf(query) !== -1;
                var inDesc = (b.descricao || '').toLowerCase().indexOf(query) !== -1;
                var inDescritores = b.descritores && b.descritores.some(function(d) { return d.toLowerCase().indexOf(query) !== -1; });
                return inTitle || inSub || inDesc || inDescritores;
            }).slice(0, 5);

            if (suggestionsBox) {
                if (matches.length > 0) {
                    suggestionsBox.innerHTML = matches.map(function(m) {
                        var safeTitle = (m.titulo || '').replace(/'/g, "\\'");
                        return '<div class="bib-suggestion-item" onclick="applySuggestionSearch(\'' + safeTitle + '\');">' +
                            '<div>' +
                                '<strong>' + m.titulo + '</strong>' +
                                '<span style="display:block; font-size:0.7rem; color:var(--text-muted);">' + (m.etapa || '') + ' • ' + (m.componente || '') + ' • ' + (m.categoria || '') + '</span>' +
                            '</div>' +
                            '<span class="badge badge-purple" style="font-size:0.65rem;">' + (m.formato || 'Material') + '</span>' +
                        '</div>';
                    }).join('');
                    suggestionsBox.style.display = 'block';
                    suggestionsBox.classList.remove('hidden');
                } else {
                    suggestionsBox.style.display = 'none';
                    suggestionsBox.classList.add('hidden');
                }
            }

            renderPedagogicLibrary();
        }, 250);
    }

    function applySuggestionSearch(term) {
        var input = document.getElementById('search-bib-input');
        var suggestionsBox = document.getElementById('bib-search-suggestions');
        if (input) input.value = term;
        if (suggestionsBox) {
            suggestionsBox.style.display = 'none';
            suggestionsBox.classList.add('hidden');
        }
        renderPedagogicLibrary();
    }

    function clearLibraryFilters() {
        currentActiveCategory = 'all';
        var input = document.getElementById('search-bib-input');
        var etapa = document.getElementById('filter-bib-etapa');
        var comp = document.getElementById('filter-bib-componente');
        var suggestionsBox = document.getElementById('bib-search-suggestions');

        if (input) input.value = '';
        if (etapa) etapa.value = 'all';
        if (comp) comp.value = 'all';
        if (suggestionsBox) {
            suggestionsBox.innerHTML = '';
            suggestionsBox.style.display = 'none';
        }

        var allPills = document.querySelectorAll('.bib-category-pill');
        allPills.forEach(function(b) {
            var isAll = b.getAttribute('data-cat') === 'all';
            if (isAll) {
                b.classList.add('active');
                b.style.background = '#4f46e5';
                b.style.color = '#ffffff';
                b.style.border = 'none';
                b.style.fontWeight = '700';
            } else {
                b.classList.remove('active');
                b.style.background = 'var(--bg-tertiary)';
                b.style.color = 'var(--text-secondary)';
                b.style.border = '1px solid var(--border-color)';
                b.style.fontWeight = '500';
            }
        });

        renderPedagogicLibrary();
    }

    // -------------------------------------------------------------------------
    // 5. GERADOR DE THUMBNAIL / CAPA VISUAL
    // -------------------------------------------------------------------------
    function generateCoverThumbnailHtml(book) {
        var isPdf = (book.formatoArquivo === 'PDF') || (book.fileName && book.fileName.toLowerCase().endsWith('.pdf')) || (book.fileType === 'application/pdf');
        var isWord = (book.formatoArquivo === 'DOCX' || book.formatoArquivo === 'DOC') || (book.fileName && (book.fileName.toLowerCase().endsWith('.docx') || book.fileName.toLowerCase().endsWith('.doc'))) || (book.fileType && book.fileType.indexOf('word') !== -1);
        var hasCustomCover = !!(book.capaUrl && (book.capaUrl.startsWith('data:image') || book.capaUrl.startsWith('/api/')));

        var corTema = book.corTema || (isWord ? '#2563eb' : (isPdf ? '#dc2626' : '#4f46e5'));
        var formatBadgeText = isWord ? 'DOCX / Word' : (isPdf ? 'PDF Digital' : (book.formatoArquivo || 'Documento'));
        var formatBadgeClass = isWord ? 'badge-docx' : (isPdf ? 'badge-pdf' : 'badge-general');

        if (hasCustomCover) {
            return '<div class="mec-book-cover is-custom" style="background-image: url(' + book.capaUrl + ');">' +
                '<div class="cover-format-chip ' + formatBadgeClass + '">' +
                    (isWord ? '📝 ' : (isPdf ? '📄 ' : '📚 ')) + formatBadgeText +
                '</div>' +
                '<div class="cover-overlay-bottom">' +
                    '<span class="cover-badge-tag">' + (book.capaBadge || book.etapa || 'SEMED') + '</span>' +
                '</div>' +
            '</div>';
        }

        if (isWord) {
            return '<div class="mec-book-cover is-word-doc" style="background: linear-gradient(145deg, #185abd 0%, #103f84 100%);">' +
                '<div class="cover-top-bar">' +
                    '<span class="cover-format-chip badge-docx">📝 ' + formatBadgeText + '</span>' +
                    '<span class="cover-pages-count">' + (book.paginas ? book.paginas + ' pág.' : (book.fileSize || 'DOCX')) + '</span>' +
                '</div>' +
                '<div class="cover-word-sheet">' +
                    '<div class="word-sheet-header">' +
                        '<div class="word-sheet-logo">W</div>' +
                        '<div class="word-sheet-lines">' +
                            '<span></span><span></span><span></span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="word-sheet-title">' + (book.titulo || '') + '</div>' +
                    '<div class="word-sheet-sub">' + (book.subtitulo || book.etapa || '') + '</div>' +
                '</div>' +
                '<div class="cover-bottom-meta">' +
                    '<span class="cover-badge-tag">' + (book.capaBadge || 'Atividade Editável') + '</span>' +
                    '<span class="cover-version">' + (book.versao || '2026') + '</span>' +
                '</div>' +
            '</div>';
        }

        if (isPdf) {
            return '<div class="mec-book-cover is-pdf-doc" style="background: linear-gradient(145deg, #b91c1c 0%, #7f1d1d 100%);">' +
                '<div class="cover-top-bar">' +
                    '<span class="cover-format-chip badge-pdf">📄 ' + formatBadgeText + '</span>' +
                    '<span class="cover-pages-count">' + (book.paginas ? book.paginas + ' pág.' : (book.fileSize || 'PDF')) + '</span>' +
                '</div>' +
                '<div class="cover-pdf-sheet">' +
                    '<div class="pdf-sheet-seal">SEMED</div>' +
                    '<div class="pdf-sheet-title">' + (book.titulo || '') + '</div>' +
                    '<div class="pdf-sheet-sub">' + (book.subtitulo || book.etapa || '') + '</div>' +
                    '<div class="pdf-sheet-footer-line">Gonçalves Dias • MA</div>' +
                '</div>' +
                '<div class="cover-bottom-meta">' +
                    '<span class="cover-badge-tag">' + (book.capaBadge || 'Oficial INEP / SEMED') + '</span>' +
                    '<span class="cover-version">' + (book.versao || '2026') + '</span>' +
                '</div>' +
            '</div>';
        }

        return '<div class="mec-book-cover is-editorial" style="background: linear-gradient(145deg, ' + corTema + ' 0%, #1e1b4b 100%);">' +
            '<div class="cover-top-bar">' +
                '<span class="cover-format-chip badge-general">📚 ' + formatBadgeText + '</span>' +
                '<span class="cover-pages-count">' + (book.paginas ? book.paginas + ' pág.' : 'Material') + '</span>' +
            '</div>' +
            '<div class="cover-editorial-center">' +
                '<div class="editorial-icon-badge">' +
                    (book.tipo === 'Simulado' ? '📝' : (book.tipo === 'Reforco' ? '🎯' : (book.tipo === 'Matriz' ? '📊' : '📖'))) +
                '</div>' +
                '<h4 class="editorial-title">' + (book.titulo || '') + '</h4>' +
                '<p class="editorial-sub">' + (book.subtitulo || '') + '</p>' +
            '</div>' +
            '<div class="cover-bottom-meta">' +
                '<span class="cover-badge-tag">' + (book.capaBadge || book.componente || 'Pedagógico') + '</span>' +
                '<span class="cover-version">' + (book.versao || '2026') + '</span>' +
            '</div>' +
        '</div>';
    }

    // -------------------------------------------------------------------------
    // 6. RENDERIZADOR DA VITRINE DA BIBLIOTECA
    // -------------------------------------------------------------------------
    function renderPedagogicLibrary() {
        updateCategoryPillCounters();
        renderSpotlightSection();

        var grid = document.getElementById('bib-materials-grid');
        if (!grid) return;

        var etapaFilter = (document.getElementById('filter-bib-etapa') || {}).value || 'all';
        var compFilter = (document.getElementById('filter-bib-componente') || {}).value || 'all';
        var searchVal = ((document.getElementById('search-bib-input') || {}).value || '').toLowerCase().trim();

        var filtered = libraryItems.filter(function(b) {
            var matchCat = currentActiveCategory === 'all' || b.categoria === currentActiveCategory;
            var matchEtapa = etapaFilter === 'all' || b.etapa === etapaFilter;
            var matchComp = compFilter === 'all' || b.componente === compFilter || b.componente === 'Integrado' || b.componente === 'Multidisciplinar';
            var matchSearch = !searchVal || 
                (b.titulo || '').toLowerCase().indexOf(searchVal) !== -1 || 
                (b.subtitulo || '').toLowerCase().indexOf(searchVal) !== -1 ||
                (b.descricao || '').toLowerCase().indexOf(searchVal) !== -1 ||
                (b.descritores && b.descritores.some(function(d) { return d.toLowerCase().indexOf(searchVal) !== -1; }));
            return matchCat && matchEtapa && matchComp && matchSearch;
        });

        var counterText = document.getElementById('bib-results-counter-text');
        if (counterText) {
            counterText.innerHTML = 'Exibindo <strong>' + filtered.length + ' de ' + libraryItems.length + '</strong> materiais';
        }

        var btnClear = document.getElementById('btn-bib-clear-filters');
        if (btnClear) {
            var hasFilters = currentActiveCategory !== 'all' || etapaFilter !== 'all' || compFilter !== 'all' || !!searchVal;
            btnClear.style.display = hasFilters ? 'inline-flex' : 'none';
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">' +
                '<div style="font-size: 2.4rem; margin-bottom: 8px;">📚</div>' +
                '<h4 style="color: var(--text-primary); margin: 0 0 6px 0;">Nenhum material encontrado</h4>' +
                '<p style="color: var(--text-muted); font-size: 0.82rem; margin: 0 0 16px 0;">Tente ajustar os filtros de busca ou selecione outra categoria.</p>' +
                '<button type="button" class="btn btn-outline btn-sm" onclick="clearLibraryFilters();">Limpar Filtros</button>' +
            '</div>';
            return;
        }

        grid.innerHTML = filtered.map(function(book) {
            var coverHtml = generateCoverThumbnailHtml(book);
            var isWord = (book.formatoArquivo === 'DOCX' || book.formatoArquivo === 'DOC') || (book.fileName && (book.fileName.toLowerCase().endsWith('.docx') || book.fileName.toLowerCase().endsWith('.doc')));
            var formatLabel = isWord ? 'DOCX' : (book.formatoArquivo || 'PDF');

            // SECURITY FIX: [XSS Sanitization] Sanitização dos metadados exibidos
            var safeTitulo = typeof escapeHtml === 'function' ? escapeHtml(book.titulo) : (book.titulo || '');
            var safeSub = typeof escapeHtml === 'function' ? escapeHtml(book.subtitulo || book.descricao || '') : (book.subtitulo || book.descricao || '');
            var safeTipo = typeof escapeHtml === 'function' ? escapeHtml(book.tipo || 'Pedagógico') : (book.tipo || 'Pedagógico');
            var safeEtapa = typeof escapeHtml === 'function' ? escapeHtml(book.etapa || 'Geral') : (book.etapa || 'Geral');
            var safeFileSize = typeof escapeHtml === 'function' ? escapeHtml(book.fileSize || formatLabel) : (book.fileSize || formatLabel);
            var safePaginas = book.paginas ? escapeHtml(String(book.paginas)) + ' pág.' : safeFileSize;

            return '<div class="mec-book-card" data-book-id="' + book.id + '">' +
                '<div class="mec-book-card-cover" onclick="trackAndViewBook(\'' + book.id + '\');">' +
                    coverHtml +
                    '<div class="cover-hover-actions">' +
                        '<button type="button" class="btn-hover-read" onclick="event.stopPropagation(); trackAndViewBook(\'' + book.id + '\');">' +
                            '<span>📖 Ler no Sistema</span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="mec-book-card-body">' +
                    '<div class="book-card-header-meta">' +
                        '<span class="book-meta-badge ' + (book.tipo === 'Simulado' ? 'badge-blue' : (book.tipo === 'Reforco' ? 'badge-amber' : 'badge-purple')) + '">' +
                            safeTipo +
                        '</span>' +
                        '<span class="book-meta-etapa">' + safeEtapa + '</span>' +
                    '</div>' +
                    '<h3 class="book-card-title" title="' + safeTitulo + '" onclick="trackAndViewBook(\'' + book.id + '\');">' +
                        safeTitulo +
                    '</h3>' +
                    '<p class="book-card-sub">' + safeSub + '</p>' +
                    '<div class="book-card-info-chips">' +
                        '<span class="info-chip">📄 ' + safePaginas + '</span>' +
                        '<span class="info-chip">💾 ' + safeFileSize + '</span>' +
                        '<span class="info-chip">👁️ ' + (book.viewsCount || 0) + ' acessos</span>' +
                    '</div>' +
                    '<div class="book-card-actions">' +
                        '<button type="button" onclick="trackAndViewBook(\'' + book.id + '\');" class="btn btn-primary btn-sm btn-read-book">' +
                            '📖 Ler Agora' +
                        '</button>' +
                        '<button type="button" onclick="trackAndDownloadBookPdf(\'' + book.id + '\');" class="btn btn-outline btn-sm btn-download-book" title="Baixar Arquivo">' +
                            '📥' +
                        '</button>' +
                        '<button type="button" onclick="handleDeleteLibraryMaterial(\'' + book.id + '\');" class="btn btn-icon btn-sm btn-delete-book" title="Excluir Material">' +
                            '🗑️' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function renderSpotlightSection() {
        var row = document.getElementById('bib-spotlight-cards-row');
        if (!row) return;

        var top4 = libraryItems.slice().sort(function(a, b) {
            return (b.viewsCount || 0) - (a.viewsCount || 0);
        }).slice(0, 4);

        row.innerHTML = top4.map(function(item) {
            var icon = item.tipo === 'Simulado' ? 'file-check-2' : (item.tipo === 'Matriz' ? 'layers' : (item.tipo === 'Reforco' ? 'target' : 'book-open'));
            var safeTitulo = typeof escapeHtml === 'function' ? escapeHtml(item.titulo) : item.titulo;
            var safeEtapa = typeof escapeHtml === 'function' ? escapeHtml(item.etapa || '') : (item.etapa || '');
            var safeFormato = typeof escapeHtml === 'function' ? escapeHtml(item.formatoArquivo || 'PDF') : (item.formatoArquivo || 'PDF');

            return '<div class="bib-spotlight-card" onclick="trackAndViewBook(\'' + item.id + '\');">' +
                '<div style="width: 36px; height: 36px; border-radius: 8px; background: ' + (item.corTema || '#4f46e5') + '; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">' +
                    '<i data-lucide="' + icon + '" style="width: 18px; height: 18px;"></i>' +
                '</div>' +
                '<div style="flex: 1; min-width: 0;">' +
                    '<strong style="font-size: 0.78rem; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + safeTitulo + '</strong>' +
                    '<span style="font-size: 0.68rem; color: var(--text-muted); display: block;">' + safeEtapa + ' • 👁️ ' + (item.viewsCount || 0) + ' acessos • ' + safeFormato + '</span>' +
                '</div>' +
            '</div>';
        }).join('');

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    // -------------------------------------------------------------------------
    // 7. LEITOR INTEGRADO IN-APP (PDF.JS + MAMMOTH.JS)
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
        if (iconEl) iconEl.textContent = isWord ? '📝' : '📄';

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
    // 8. DOWNLOAD DE ARQUIVOS REAIS
    // -------------------------------------------------------------------------
    async function trackAndDownloadBookPdf(bookId) {
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;

        book.viewsCount = (book.viewsCount || 0) + 1;
        book.downloadsCount = (book.downloadsCount || 0) + 1;
        renderSpotlightSection();

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
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;
        openBibliotecaReader(book);
    }

    function trackAndPrintExam(bookId) {
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;
        if (typeof global.generateA4PrintableExam === 'function') {
            global.generateA4PrintableExam(book);
        } else {
            trackAndViewBook(bookId);
        }
    }

    // -------------------------------------------------------------------------
    // 9. EXCLUSÃO DE MATERIAL
    // -------------------------------------------------------------------------
    async function handleDeleteLibraryMaterial(bookId) {
        if (!confirm('Deseja realmente remover este material da Biblioteca de Recursos?')) {
            return;
        }

        var token = getAuthToken();
        try {
            var res = await fetch('/api/library/' + encodeURIComponent(bookId), {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                var index = libraryItems.findIndex(function(b) { return b.id === bookId; });
                if (index !== -1) {
                    var removed = libraryItems.splice(index, 1)[0];
                    renderPedagogicLibrary();
                    if (typeof global.showToast === 'function') {
                        global.showToast('Material "' + (removed.titulo || '') + '" excluído da biblioteca.', 'info');
                    }
                }
            } else {
                var errData = await res.json();
                alert(errData.error || 'Erro ao excluir material.');
            }
        } catch(e) {
            console.error('[Delete Error]', e);
            alert('Erro de rede ao tentar excluir material.');
        }
    }

    // -------------------------------------------------------------------------
    // 10. UPLOAD ATÔMICO COM PROGRESSO EM TEMPO REAL (ATÉ 100MB)
    // -------------------------------------------------------------------------
    var uploadedMainFile = null;
    var uploadedCoverFile = null;

    function openUploadPedagogicModal() {
        var modal = document.getElementById('upload-pedagogic-modal');
        if (!modal) return;

        uploadedMainFile = null;
        uploadedCoverFile = null;

        var form = document.getElementById('upload-pedagogic-form');
        if (form) form.reset();

        var filePreview = document.getElementById('file-upload-preview');
        if (filePreview) filePreview.innerHTML = '';

        var coverPreview = document.getElementById('cover-upload-preview');
        if (coverPreview) {
            coverPreview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Nenhuma capa personalizada enviada (será gerada automaticamente).</span>';
        }

        var progressContainer = document.getElementById('upload-progress-container');
        if (progressContainer) {
            progressContainer.classList.add('hidden');
            progressContainer.style.display = 'none';
        }

        var btnSubmit = document.getElementById('btn-submit-upload-pedagogic');
        if (btnSubmit) btnSubmit.disabled = false;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeUploadPedagogicModal() {
        var modal = document.getElementById('upload-pedagogic-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function handleMainFileUpload(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var MAX_SIZE = 100 * 1024 * 1024; // 100MB
        if (file.size > MAX_SIZE) {
            var sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            alert('⚠️ O arquivo selecionado possui ' + sizeMb + ' MB e excede o limite máximo permitido de 100 MB.');
            e.target.value = '';
            return;
        }

        var ext = file.name.split('.').pop().toLowerCase();
        var allowed = ['pdf', 'doc', 'docx'];
        if (!allowed.includes(ext)) {
            alert('⚠️ Formato não permitido (. ' + ext + '). Selecione um arquivo em formato PDF (.pdf) ou Word (.doc, .docx).');
            e.target.value = '';
            return;
        }

        uploadedMainFile = file;
        var fileSizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        var isWord = ext === 'docx' || ext === 'doc';
        var isPdf = ext === 'pdf';

        var titleInput = document.getElementById('new-material-title');
        if (titleInput && !titleInput.value) {
            var rawTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            titleInput.value = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        }

        var preview = document.getElementById('file-upload-preview');
        if (preview) {
            preview.innerHTML = '<div class="attached-file-badge" style="display:flex; align-items:center; gap:12px; background:var(--bg-secondary); border:1px solid var(--border-color); padding:10px 14px; border-radius:8px; margin-top:8px;">' +
                '<div style="font-size:1.6rem;">' + (isWord ? '📝' : (isPdf ? '📄' : '📁')) + '</div>' +
                '<div style="flex:1; min-width:0;">' +
                    '<strong style="font-size:0.85rem; color:var(--text-primary); display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + file.name + '</strong>' +
                    '<span style="font-size:0.74rem; color:#4f46e5; font-weight:600;">' + fileSizeMb + ' • Formato ' + ext.toUpperCase() + ' pronto para upload</span>' +
                '</div>' +
                '<button type="button" class="btn btn-icon btn-xs" onclick="clearAttachedFile();" title="Remover arquivo" style="color:#ef4444;">✕</button>' +
            '</div>';
        }
    }

    function clearAttachedFile() {
        uploadedMainFile = null;
        var fileInput = document.getElementById('new-material-file-input');
        if (fileInput) fileInput.value = '';
        var preview = document.getElementById('file-upload-preview');
        if (preview) preview.innerHTML = '';
    }

    function handleCoverFileUpload(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        uploadedCoverFile = file;

        var preview = document.getElementById('cover-upload-preview');
        var reader = new FileReader();
        reader.onload = function(evt) {
            if (preview) {
                preview.innerHTML = '<div style="display:flex; align-items:center; gap:12px; margin-top:8px;">' +
                    '<img src="' + evt.target.result + '" style="width:54px; height:72px; object-fit:cover; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.15); border:1px solid var(--border-color);">' +
                    '<div>' +
                        '<strong style="font-size:0.8rem; color:var(--text-primary); display:block;">Capa personalizada carregada</strong>' +
                        '<button type="button" onclick="clearCoverFile();" class="btn btn-outline btn-xs" style="margin-top:4px; font-size:0.68rem; color:#ef4444; border-color:#fca5a5;">Remover Capa</button>' +
                    '</div>' +
                '</div>';
            }
        };
        reader.readAsDataURL(file);
    }

    function clearCoverFile() {
        uploadedCoverFile = null;
        var coverInput = document.getElementById('new-material-cover-input');
        if (coverInput) coverInput.value = '';
        var preview = document.getElementById('cover-upload-preview');
        if (preview) {
            preview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Nenhuma capa personalizada enviada (será gerada automaticamente).</span>';
        }
    }

    function saveNewPedagogicMaterial(e) {
        if (e) e.preventDefault();

        if (!uploadedMainFile) {
            alert('Por favor, selecione um arquivo (PDF ou Word) do seu computador.');
            return;
        }

        var title = (document.getElementById('new-material-title') || {}).value || '';
        if (!title.trim()) {
            alert('Por favor, informe o título do material.');
            return;
        }

        var subtitulo = (document.getElementById('new-material-sub') || {}).value || '';
        var comp = (document.getElementById('new-material-comp') || {}).value || 'Língua Portuguesa';
        var etapa = (document.getElementById('new-material-etapa') || {}).value || '5º Ano';
        var tipo = (document.getElementById('new-material-tipo') || {}).value || 'Simulado';
        var desc = (document.getElementById('new-material-desc') || {}).value || '';
        var corTema = (document.getElementById('new-material-color') || {}).value || '#4f46e5';

        var categoria = 'Simulados';
        if (tipo === 'Reforco' || tipo === 'Intervencao') categoria = 'Reforco';
        else if (tipo === 'Matriz') categoria = 'Matrizes';
        else if (tipo === 'Guia' || tipo === 'Gabarito') categoria = 'Guias';

        var formData = new FormData();
        formData.append('file', uploadedMainFile);
        if (uploadedCoverFile) formData.append('cover', uploadedCoverFile);
        formData.append('titulo', title.trim());
        formData.append('subtitulo', subtitulo.trim());
        formData.append('componente', comp);
        formData.append('etapa', etapa);
        formData.append('tipo', tipo);
        formData.append('categoria', categoria);
        formData.append('corTema', corTema);
        formData.append('descricao', desc.trim());

        // UI Progresso
        var progressContainer = document.getElementById('upload-progress-container');
        var progressBar = document.getElementById('upload-progress-bar');
        var progressPercent = document.getElementById('upload-progress-percent');
        var progressBytes = document.getElementById('upload-progress-bytes');
        var btnSubmit = document.getElementById('btn-submit-upload-pedagogic');

        if (progressContainer) {
            progressContainer.classList.remove('hidden');
            progressContainer.style.display = 'flex';
        }
        if (btnSubmit) btnSubmit.disabled = true;

        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/library/upload', true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + getAuthToken());

        xhr.upload.onprogress = function(evt) {
            if (evt.lengthComputable) {
                var percentComplete = Math.round((evt.loaded / evt.total) * 100);
                var loadedMb = (evt.loaded / (1024 * 1024)).toFixed(1);
                var totalMb = (evt.total / (1024 * 1024)).toFixed(1);

                if (progressBar) progressBar.style.width = percentComplete + '%';
                if (progressPercent) progressPercent.textContent = percentComplete + '%';
                if (progressBytes) progressBytes.textContent = loadedMb + ' MB de ' + totalMb + ' MB transferidos';
            }
        };

        xhr.onload = function() {
            if (btnSubmit) btnSubmit.disabled = false;
            if (xhr.status === 200) {
                try {
                    var res = JSON.parse(xhr.responseText);
                    if (res.success && res.item) {
                        libraryItems.unshift(res.item);
                        closeUploadPedagogicModal();
                        renderPedagogicLibrary();
                        if (typeof global.showToast === 'function') {
                            global.showToast('Material "' + res.item.titulo + '" salvo no acervo com sucesso!', 'check');
                        }
                        return;
                    }
                } catch(e) {}
            }

            var errMessage = 'Erro no envio do arquivo.';
            try {
                var errObj = JSON.parse(xhr.responseText);
                if (errObj.error) errMessage = errObj.error;
            } catch(e) {}
            alert('❌ ' + errMessage);
        };

        xhr.onerror = function() {
            if (btnSubmit) btnSubmit.disabled = false;
            alert('❌ Erro de conexão durante o upload do arquivo.');
        };

        xhr.send(formData);
    }

    // -------------------------------------------------------------------------
    // 11. INICIALIZADOR DE EVENTOS DO MÓDULO & ATALHOS DE TECLADO
    // -------------------------------------------------------------------------
    function initPedagogicLibrary() {
        // Fechar sugestões de busca ao clicar fora
        document.addEventListener('click', function(e) {
            var suggestionsBox = document.getElementById('bib-search-suggestions');
            var searchInput = document.getElementById('search-bib-input');
            if (suggestionsBox && searchInput && !suggestionsBox.contains(e.target) && e.target !== searchInput) {
                suggestionsBox.style.display = 'none';
                suggestionsBox.classList.add('hidden');
            }
        });

        // Atalhos de teclado (Esc para fechar leitor, Setas para paginação PDF)
        document.addEventListener('keydown', function(e) {
            var readerModal = document.getElementById('modal-biblioteca-reader');
            if (readerModal && !readerModal.classList.contains('hidden') && readerModal.style.display !== 'none') {
                if (e.key === 'Escape') {
                    closeBibliotecaReader();
                } else if (e.key === 'ArrowLeft') {
                    onPdfPrevPage();
                } else if (e.key === 'ArrowRight') {
                    onPdfNextPage();
                }
            }
        });

        // Controles de toolbar do leitor
        var btnPrev = document.getElementById('btn-pdf-prev-page');
        if (btnPrev) btnPrev.onclick = onPdfPrevPage;

        var btnNext = document.getElementById('btn-pdf-next-page');
        if (btnNext) btnNext.onclick = onPdfNextPage;

        var btnZoomIn = document.getElementById('btn-pdf-zoom-in');
        if (btnZoomIn) btnZoomIn.onclick = onPdfZoomIn;

        var btnZoomOut = document.getElementById('btn-pdf-zoom-out');
        if (btnZoomOut) btnZoomOut.onclick = onPdfZoomOut;

        var btnZoomReset = document.getElementById('btn-pdf-zoom-reset');
        if (btnZoomReset) btnZoomReset.onclick = onPdfZoomReset;

        var btnRetry = document.getElementById('btn-reader-error-retry');
        if (btnRetry) {
            btnRetry.onclick = function() {
                if (activeReaderState.book) openBibliotecaReader(activeReaderState.book);
            };
        }

        // Modal de Upload
        var btnUploadNew = document.getElementById('btn-bib-upload-new');
        if (btnUploadNew) {
            btnUploadNew.onclick = function() { openUploadPedagogicModal(); };
        }

        var btnCloseModal = document.getElementById('close-upload-pedagogic-modal-btn');
        if (btnCloseModal) {
            btnCloseModal.onclick = function() { closeUploadPedagogicModal(); };
        }

        var btnCancelModal = document.getElementById('btn-cancel-upload-pedagogic');
        if (btnCancelModal) {
            btnCancelModal.onclick = function() { closeUploadPedagogicModal(); };
        }

        var formUpload = document.getElementById('upload-pedagogic-form');
        if (formUpload) {
            formUpload.onsubmit = saveNewPedagogicMaterial;
        }

        var fileInput = document.getElementById('new-material-file-input');
        if (fileInput) {
            fileInput.onchange = handleMainFileUpload;
        }

        var coverInput = document.getElementById('new-material-cover-input');
        if (coverInput) {
            coverInput.onchange = handleCoverFileUpload;
        }

        // Sincronizar dados da biblioteca
        loadLibraryDatabase();
    }

    // Exportar para o escopo global
    global.renderPedagogicLibrary = renderPedagogicLibrary;
    global.loadLibraryDatabase = loadLibraryDatabase;
    global.handleCategoryPillClick = handleCategoryPillClick;
    global.handleLibrarySearchInput = handleLibrarySearchInput;
    global.applySuggestionSearch = applySuggestionSearch;
    global.clearLibraryFilters = clearLibraryFilters;
    global.handleDeleteLibraryMaterial = handleDeleteLibraryMaterial;
    global.trackAndDownloadBookPdf = trackAndDownloadBookPdf;
    global.trackAndViewBook = trackAndViewBook;
    global.trackAndPrintExam = trackAndPrintExam;
    global.openBibliotecaReader = openBibliotecaReader;
    global.closeBibliotecaReader = closeBibliotecaReader;
    global.openUploadPedagogicModal = openUploadPedagogicModal;
    global.closeUploadPedagogicModal = closeUploadPedagogicModal;
    global.clearAttachedFile = clearAttachedFile;
    global.clearCoverFile = clearCoverFile;
    global.initPedagogicLibrary = initPedagogicLibrary;

    // Auto-inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPedagogicLibrary);
    } else {
        initPedagogicLibrary();
    }

})(window);
