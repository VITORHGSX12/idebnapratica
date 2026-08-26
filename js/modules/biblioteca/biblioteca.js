/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — BIBLIOTECA PEDAGÓGICA & ACERVO DIGITAL
 * Arquivo: js/modules/biblioteca/biblioteca.js
 * Descrição: Gestão do acervo de provas, livros didáticos, simulados,
 *            vitrine de materiais, filtros inteligentes e sincronização.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var STORAGE_KEY = 'gd_pedagogic_library_db';
    var libraryItems = [];
    var currentActiveCategory = 'all';
    var searchDebounceTimer = null;

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
    // 7. EXCLUSÃO DE MATERIAL
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
    // 8. INICIALIZADOR DE EVENTOS DO MÓDULO & ATALHOS DE TECLADO
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
                    if (typeof global.closeBibliotecaReader === 'function') global.closeBibliotecaReader();
                } else if (e.key === 'ArrowLeft') {
                    if (typeof global.onPdfPrevPage === 'function') global.onPdfPrevPage();
                } else if (e.key === 'ArrowRight') {
                    if (typeof global.onPdfNextPage === 'function') global.onPdfNextPage();
                }
            }
        });

        // Sincronizar dados da biblioteca
        loadLibraryDatabase();
    }

    // Exposição no Escopo Global
    global.renderPedagogicLibrary = renderPedagogicLibrary;
    global.loadLibraryDatabase = loadLibraryDatabase;
    global.renderSpotlightSection = renderSpotlightSection;
    global.handleCategoryPillClick = handleCategoryPillClick;
    global.handleLibrarySearchInput = handleLibrarySearchInput;
    global.applySuggestionSearch = applySuggestionSearch;
    global.clearLibraryFilters = clearLibraryFilters;
    global.handleDeleteLibraryMaterial = handleDeleteLibraryMaterial;
    global.initPedagogicLibrary = initPedagogicLibrary;

    // Auto-inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPedagogicLibrary);
    } else {
        initPedagogicLibrary();
    }

})(typeof window !== 'undefined' ? window : this);
