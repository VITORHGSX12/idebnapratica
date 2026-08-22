// =========================================================================
// BIBLIOTECA PEDAGÓGICA & ACERVO DIGITAL (MODULAR ENGINE)
// Responsabilidade: Gestão do acervo de provas, livros didáticos, simulados,
// cadernos A4, upload de arquivos do computador (PDF / Word) e renderização
// de capas/thumbnails personalizadas com leitor e download.
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY = 'gd_pedagogic_library_db';

    // Acervo padrão inicial institucional da SEMED Gonçalves Dias
    var INITIAL_LIBRARY_DATABASE = [
        {
            id: 'BOOK_07',
            titulo: 'Simulado Diagnóstico 5º Ano • Língua Portuguesa (Foco D1, D3, D4)',
            subtitulo: 'Caderno Específico de Inferência e Informações Explícitas',
            etapa: '5º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D03', 'D04', 'D06'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 16,
            ano: 2026,
            versao: 'v1.2 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 425,
            downloadsCount: 210,
            corTema: '#3b82f6',
            capaBadge: 'Simulado Língua Portuguesa',
            capaUrl: '',
            fileName: 'Simulado_5Ano_Portugues_SEMED_2026.pdf',
            fileSize: '2.4 MB',
            fileType: 'application/pdf',
            descricao: 'Avaliação direcionada aos descritores de maior defasagem apurados no 1º Simulado Diagnóstico da rede municipal.'
        },
        {
            id: 'BOOK_08',
            titulo: 'Simulado Diagnóstico 5º Ano • Matemática (Foco D13, D26, D28)',
            subtitulo: 'Caderno Específico de Geometria, Espaço & Forma e Operações',
            etapa: '5º Ano',
            componente: 'Matemática',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D13', 'D19', 'D26', 'D28'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 18,
            ano: 2026,
            versao: 'v1.2 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 395,
            downloadsCount: 188,
            corTema: '#2563eb',
            capaBadge: 'Simulado Matemática',
            capaUrl: '',
            fileName: 'Simulado_5Ano_Matematica_SEMED_2026.pdf',
            fileSize: '2.8 MB',
            fileType: 'application/pdf',
            descricao: '20 itens calibrados de resolução de problemas cotidianos com frações, áreas, perímetros e gráficos.'
        },
        {
            id: 'BOOK_06',
            titulo: 'Oficinas de Cálculo Mental & Resolução de Problemas',
            subtitulo: 'Caderno de Atividades Práticas para 4º e 5º Anos',
            etapa: '5º Ano',
            componente: 'Matemática',
            categoria: 'Reforco',
            tipo: 'Reforco',
            descritores: ['D13', 'D14', 'D16', 'D20'],
            formato: 'Caderno de Atividades',
            formatoArquivo: 'DOCX',
            paginas: 24,
            ano: 2026,
            versao: 'v2.0 (2026)',
            data_publicacao: 'Mar/2026',
            viewsCount: 340,
            downloadsCount: 155,
            corTema: '#f59e0b',
            capaBadge: 'Matemática Prática',
            capaUrl: '',
            fileName: 'Oficinas_Calculo_Mental_Atividades.docx',
            fileSize: '1.6 MB',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            descricao: 'Jogos matemáticos, desafios relâmpago e situações cotidianas contextualizadas na realidade de Gonçalves Dias.'
        },
        {
            id: 'BOOK_01',
            titulo: 'Caderno de Simulado Oficial SAEB • 5º Ano EF',
            subtitulo: 'Língua Portuguesa (Leitura) & Matemática (Problemas)',
            etapa: '5º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D03', 'D04', 'D13', 'D14', 'D28'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 28,
            ano: 2026,
            versao: 'v2.4 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 512,
            downloadsCount: 245,
            corTema: '#4f46e5',
            capaBadge: 'Simulado Oficial',
            capaUrl: '',
            fileName: 'Simulado_Oficial_SAEB_5Ano.pdf',
            fileSize: '3.5 MB',
            fileType: 'application/pdf',
            descricao: 'Caderno completo de 44 itens padrão SAEB/INEP diagramado para aplicação em sala de aula, com folha de respostas e gabarito desmembrável.'
        },
        {
            id: 'BOOK_03',
            titulo: 'Caderno de Simulado Prova Brasil • 9º Ano EF',
            subtitulo: 'Língua Portuguesa & Matemática (Anos Finais)',
            etapa: '9º Ano',
            componente: 'Integrado',
            categoria: 'Simulados',
            tipo: 'Simulado',
            descritores: ['D01', 'D05', 'D07', 'D16', 'D19', 'D35'],
            formato: 'Caderno A4 com Gabarito',
            formatoArquivo: 'PDF',
            paginas: 36,
            ano: 2026,
            versao: 'v2.1 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 380,
            downloadsCount: 190,
            corTema: '#3b82f6',
            capaBadge: 'Simulado Oficial',
            capaUrl: '',
            fileName: 'Simulado_9Ano_Prova_Brasil.pdf',
            fileSize: '4.1 MB',
            fileType: 'application/pdf',
            descricao: '52 questões calibradas nos descritores críticos do 9º ano, incluindo álgebra, geometria e interpretação de gêneros diversos.'
        },
        {
            id: 'BOOK_05',
            titulo: 'Matriz Curricular de Descritores Comentada • SAEB 2026',
            subtitulo: 'Escala de Proficiência, Habilidades BNCC e Exemplos de Itens',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Matrizes',
            tipo: 'Matriz',
            descritores: ['Todos os Descritores SAEB/SEAMA'],
            formato: 'Documento Técnico PDF',
            formatoArquivo: 'PDF',
            paginas: 52,
            ano: 2026,
            versao: 'v1.5 (2026)',
            data_publicacao: 'Fev/2026',
            viewsCount: 290,
            downloadsCount: 115,
            corTema: '#8b5cf6',
            capaBadge: 'Matriz Oficial',
            capaUrl: '',
            fileName: 'Matriz_Curricular_Descritores_Comentada_2026.pdf',
            fileSize: '5.2 MB',
            fileType: 'application/pdf',
            descricao: 'Detalhamento técnico de todos os níveis de proficiência (0 a 5) do SAEB e correspondência com as matrizes BNCC e SEAMA.'
        },
        {
            id: 'BOOK_02',
            titulo: 'Caderno de Fluência Leitora & Alfabetização • 2º Ano EF',
            subtitulo: 'Avaliação Diagnóstica SEAMA / Compromisso Criança Alfabetizada',
            etapa: '2º Ano',
            componente: 'Língua Portuguesa',
            categoria: 'Reforco',
            tipo: 'Reforco',
            descritores: ['EF02LP01', 'EF02LP04', 'EF02LP08'],
            formato: 'Guia de Aplicação & Fichas',
            formatoArquivo: 'DOCX',
            paginas: 20,
            ano: 2026,
            versao: 'v1.8 (2026)',
            data_publicacao: 'Jan/2026',
            viewsCount: 420,
            downloadsCount: 165,
            corTema: '#f59e0b',
            capaBadge: 'Fluência & Leitura',
            capaUrl: '',
            fileName: 'Guia_Fluencia_Leitora_2Ano.docx',
            fileSize: '1.9 MB',
            fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            descricao: 'Conjunto de textos curtos, parlendas e itens de consciência fonológica para monitoramento individual da leitura no 2º ano.'
        },
        {
            id: 'BOOK_04',
            titulo: 'Guia de Intervenção Pedagógica & Nivelamento (SEMED)',
            subtitulo: 'Orientações Práticas para Gestores e Professores de Gonçalves Dias',
            etapa: 'Docente',
            componente: 'Integrado',
            categoria: 'Guias',
            tipo: 'Guia',
            descritores: ['D01', 'D03', 'D13', 'D28'],
            formato: 'Manual do Professor',
            formatoArquivo: 'PDF',
            paginas: 44,
            ano: 2026,
            versao: 'v3.0 (Oficial)',
            data_publicacao: 'Jan/2026',
            viewsCount: 310,
            downloadsCount: 125,
            corTema: '#0d9488',
            capaBadge: 'Guia do Professor',
            capaUrl: '',
            fileName: 'Guia_Intervencao_Pedagogica_SEMED.pdf',
            fileSize: '3.8 MB',
            fileType: 'application/pdf',
            descricao: 'Sequências didáticas ativas para recuperação de descritores críticos com rotinas semanais estruturadas e oficinas em grupo.'
        }
    ];

    // Carregar acervo do localStorage ou inicializar
    function loadLibraryDatabase() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch(e) {
            console.warn('[Biblioteca Module] Falha ao carregar do localStorage, usando acervo inicial.', e);
        }
        return INITIAL_LIBRARY_DATABASE.slice();
    }

    function saveLibraryDatabase(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch(e) {
            console.error('[Biblioteca Module] Erro ao salvar acervo no localStorage:', e);
        }
    }

    var libraryItems = loadLibraryDatabase();
    global.PEDAGOGIC_LIBRARY_DATABASE = libraryItems;

    var currentActiveCategory = 'all';
    var searchDebounceTimer = null;

    // -------------------------------------------------------------------------
    // 1. ATUALIZAR CONTADORES DAS CATEGORIAS
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
    // 2. SELEÇÃO DE CATEGORIA (PILLS)
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
    // 3. AUTOCOMPLETE DE BUSCA
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
    // 4. GERADOR DE THUMBNAIL / CAPA VISUAL
    // -------------------------------------------------------------------------
    function generateCoverThumbnailHtml(book) {
        var isPdf = (book.formatoArquivo === 'PDF') || (book.fileName && book.fileName.toLowerCase().endsWith('.pdf')) || (book.fileType === 'application/pdf');
        var isWord = (book.formatoArquivo === 'DOCX' || book.formatoArquivo === 'DOC') || (book.fileName && (book.fileName.toLowerCase().endsWith('.docx') || book.fileName.toLowerCase().endsWith('.doc'))) || (book.fileType && book.fileType.indexOf('word') !== -1);
        var hasCustomCover = !!(book.capaUrl && book.capaUrl.startsWith('data:image'));

        var corTema = book.corTema || (isWord ? '#2b579a' : (isPdf ? '#dc2626' : '#4f46e5'));
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

        // Capa Estilizada de Documento Word
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

        // Capa Estilizada de Documento PDF
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

        // Capa Editorial Padrão (Estilo MEC Vitrine)
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
    // 5. RENDERIZADOR PRINCIPAL DA VITRINE DA BIBLIOTECA
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

        // Contador de Resultados e Botão Limpar Filtros
        var counterText = document.getElementById('bib-results-counter-text');
        var clearBtn = document.getElementById('btn-bib-clear-filters');
        if (counterText) {
            counterText.innerHTML = 'Exibindo <strong>' + filtered.length + ' de ' + libraryItems.length + '</strong> materiais';
        }

        var isFiltered = currentActiveCategory !== 'all' || etapaFilter !== 'all' || compFilter !== 'all' || searchVal !== '';
        if (clearBtn) {
            clearBtn.style.display = isFiltered ? 'inline-flex' : 'none';
            if (isFiltered) clearBtn.classList.remove('hidden'); else clearBtn.classList.add('hidden');
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<div class="bib-empty-state" style="grid-column: 1 / -1; padding: 48px 20px; text-align: center; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">' +
                '<div style="font-size: 2.5rem; margin-bottom: 8px;">📚</div>' +
                '<h4 style="margin: 0 0 4px 0; color: var(--text-primary); font-size: 1.1rem; font-weight: 700;">Nenhum material didático encontrado</h4>' +
                '<p style="margin: 0 0 16px 0; font-size: 0.85rem;">Tente ajustar a etapa, disciplina ou o termo pesquisado.</p>' +
                '<button type="button" onclick="clearLibraryFilters();" class="btn btn-primary btn-sm" style="font-weight: 700;">Limpar Filtros e Ver Todos</button>' +
            '</div>';
            if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
            return;
        }

        grid.innerHTML = filtered.map(function(book) {
            var coverHtml = generateCoverThumbnailHtml(book);
            var isSimulado = book.tipo === 'Simulado';
            var hasAttachedFile = !!(book.fileData || book.fileUrl);

            return '<div class="mec-book-card" id="card-bib-' + book.id + '">' +
                '<div class="book-cover-wrapper">' +
                    coverHtml +
                '</div>' +
                '<div class="book-card-body">' +
                    '<div class="book-meta-top">' +
                        '<span class="book-date">📅 ' + (book.data_publicacao || '2026') + '</span>' +
                        '<span class="book-version">' + (book.versao || 'v1.0') + '</span>' +
                    '</div>' +
                    '<h4 class="book-title" title="' + (book.titulo || '') + '">' + (book.titulo || '') + '</h4>' +
                    '<p class="book-desc">' + (book.descricao || 'Material pedagógico oficial da SEMED Gonçalves Dias.') + '</p>' +
                    '<div class="book-badges-row">' +
                        '<span class="badge badge-purple">' + (book.etapa || '5º Ano') + '</span>' +
                        '<span class="badge badge-outline">' + (book.componente || 'Geral') + '</span>' +
                        '<span class="badge badge-success">👁️ ' + (book.viewsCount || 0) + ' acessos</span>' +
                    '</div>' +
                    '<div class="book-actions-footer">' +
                        (isSimulado ? 
                            '<button type="button" onclick="trackAndPrintExam(\'' + book.id + '\');" class="btn btn-primary btn-sm btn-action-primary" title="Imprimir Caderno A4">' +
                                '<i data-lucide="printer"></i> Imprimir A4' +
                            '</button>' :
                            '<button type="button" onclick="trackAndDownloadBookPdf(\'' + book.id + '\');" class="btn btn-primary btn-sm btn-action-download" title="Baixar Arquivo ' + (book.formatoArquivo || 'PDF') + '">' +
                                '<i data-lucide="download"></i> Baixar ' + (book.formatoArquivo || 'PDF') +
                            '</button>'
                        ) +
                        '<button type="button" onclick="trackAndViewBook(\'' + book.id + '\');" class="btn btn-outline btn-sm" title="Visualizar / Ler Online">' +
                            '<i data-lucide="eye"></i> Abrir' +
                        '</button>' +
                        '<button type="button" onclick="handleDeleteLibraryMaterial(\'' + book.id + '\');" class="btn btn-outline btn-sm btn-delete-material" title="Excluir Material">' +
                            '<i data-lucide="trash-2"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    // -------------------------------------------------------------------------
    // 6. SEÇÃO DE DESTAQUES (MAIS ACESSADOS)
    // -------------------------------------------------------------------------
    function renderSpotlightSection() {
        var row = document.getElementById('bib-spotlight-cards-row');
        if (!row) return;

        var top4 = libraryItems.slice().sort(function(a, b) {
            return (b.viewsCount || 0) - (a.viewsCount || 0);
        }).slice(0, 4);

        row.innerHTML = top4.map(function(item) {
            var icon = item.tipo === 'Simulado' ? 'file-check-2' : (item.tipo === 'Matriz' ? 'layers' : (item.tipo === 'Reforco' ? 'target' : 'book-open'));
            return '<div class="bib-spotlight-card" onclick="trackAndViewBook(\'' + item.id + '\');">' +
                '<div style="width: 36px; height: 36px; border-radius: 8px; background: ' + (item.corTema || '#4f46e5') + '; color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">' +
                    '<i data-lucide="' + icon + '" style="width: 18px; height: 18px;"></i>' +
                '</div>' +
                '<div style="flex: 1; min-width: 0;">' +
                    '<strong style="font-size: 0.78rem; color: var(--text-primary); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + item.titulo + '</strong>' +
                    '<span style="font-size: 0.68rem; color: var(--text-muted); display: block;">' + (item.etapa || '') + ' • 👁️ ' + (item.viewsCount || 0) + ' acessos • ' + (item.formatoArquivo || 'PDF') + '</span>' +
                '</div>' +
            '</div>';
        }).join('');

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    // -------------------------------------------------------------------------
    // 7. DOWNLOAD E VISUALIZAÇÃO DE ARQUIVOS REAIS DO COMPUTADOR
    // -------------------------------------------------------------------------
    function trackAndDownloadBookPdf(bookId) {
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;

        book.viewsCount = (book.viewsCount || 0) + 1;
        book.downloadsCount = (book.downloadsCount || 0) + 1;
        saveLibraryDatabase(libraryItems);
        renderSpotlightSection();

        // Se o material possui arquivo real anexado via upload em Base64
        if (book.fileData) {
            var downloadLink = document.createElement('a');
            downloadLink.href = book.fileData;
            downloadLink.download = book.fileName || (book.titulo + '.' + (book.formatoArquivo || 'pdf').toLowerCase());
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            if (typeof global.showToast === 'function') {
                global.showToast('Download do arquivo "' + (book.fileName || book.titulo) + '" iniciado com sucesso!', 'check');
            }
            return;
        }

        // Se possui fileUrl (arquivo do servidor/projeto)
        if (book.fileUrl) {
            var link = document.createElement('a');
            link.href = book.fileUrl;
            link.download = book.fileName || book.fileUrl.split('/').pop() || 'documento.pdf';
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (typeof global.showToast === 'function') {
                global.showToast('Baixando PDF oficial...', 'check');
            }
            return;
        }

        // Fallback: Gerar impressão / PDF institucional
        if (typeof global.generateA4PrintableExam === 'function') {
            global.generateA4PrintableExam(book);
        } else {
            if (typeof global.showToast === 'function') {
                global.showToast('Iniciando visualizador para download de ' + book.titulo, 'info');
            }
        }
    }

    function trackAndViewBook(bookId) {
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;

        book.viewsCount = (book.viewsCount || 0) + 1;
        saveLibraryDatabase(libraryItems);
        renderSpotlightSection();

        // Se for um arquivo de imagem ou PDF com dataURL, podemos abrir no leitor ou nova aba
        if (book.fileData && book.fileType && book.fileType.indexOf('image') !== -1) {
            var imageWindow = window.open('');
            if (imageWindow) {
                imageWindow.document.write('<html><head><title>' + book.titulo + '</title></head><body style="margin:0; background:#0f172a; display:flex; align-items:center; justify-content:center; height:100vh;"><img src="' + book.fileData + '" style="max-width:95vw; max-height:95vh; object-fit:contain; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5);"></body></html>');
            }
            return;
        }

        // Abrir Leitor Digital / Simulado A4
        if (typeof global.generateA4PrintableExam === 'function') {
            global.generateA4PrintableExam(book);
        } else {
            alert('📖 Visualizando material: ' + book.titulo + ' (' + (book.versao || '2026') + ')');
        }
    }

    function trackAndPrintExam(bookId) {
        var book = libraryItems.find(function(b) { return b.id === bookId; });
        if (!book) return;

        book.viewsCount = (book.viewsCount || 0) + 1;
        book.downloadsCount = (book.downloadsCount || 0) + 1;
        saveLibraryDatabase(libraryItems);
        renderSpotlightSection();

        if (typeof global.generateA4PrintableExam === 'function') {
            global.generateA4PrintableExam(book);
        } else {
            window.print();
        }
    }

    // -------------------------------------------------------------------------
    // 8. EXCLUSÃO DE MATERIAL
    // -------------------------------------------------------------------------
    function handleDeleteLibraryMaterial(bookId) {
        if (!confirm('Deseja realmente remover este material da Biblioteca de Recursos?')) {
            return;
        }

        var index = libraryItems.findIndex(function(b) { return b.id === bookId; });
        if (index !== -1) {
            var removed = libraryItems.splice(index, 1)[0];
            saveLibraryDatabase(libraryItems);
            renderPedagogicLibrary();

            if (typeof global.showToast === 'function') {
                global.showToast('Material "' + (removed.titulo || '') + '" excluído da biblioteca.', 'info');
            }
        }
    }

    // -------------------------------------------------------------------------
    // 9. MODAL DE UPLOAD DE ARQUIVOS DO COMPUTADOR (PDF, WORD, IMAGENS)
    // -------------------------------------------------------------------------
    var uploadedFileState = {
        fileData: null,
        fileName: '',
        fileSize: '',
        fileType: '',
        formatoArquivo: 'PDF'
    };

    var uploadedCoverState = {
        coverData: null
    };

    function openUploadPedagogicModal() {
        var modal = document.getElementById('upload-pedagogic-modal');
        if (!modal) return;

        // Resetar estados e campos
        uploadedFileState = {
            fileData: null,
            fileName: '',
            fileSize: '',
            fileType: '',
            formatoArquivo: 'PDF'
        };
        uploadedCoverState = { coverData: null };

        var form = document.getElementById('upload-pedagogic-form');
        if (form) form.reset();

        var filePreview = document.getElementById('file-upload-preview');
        if (filePreview) filePreview.innerHTML = '';

        var coverPreview = document.getElementById('cover-upload-preview');
        if (coverPreview) {
            coverPreview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Nenhuma capa personalizada enviada (será gerada automaticamente).</span>';
        }

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

        var preview = document.getElementById('file-upload-preview');
        var fileName = file.name;
        var fileSizeMb = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        var ext = fileName.split('.').pop().toUpperCase();
        var isWord = ext === 'DOCX' || ext === 'DOC';
        var isPdf = ext === 'PDF';

        uploadedFileState.fileName = fileName;
        uploadedFileState.fileSize = fileSizeMb;
        uploadedFileState.fileType = file.type;
        uploadedFileState.formatoArquivo = isWord ? 'DOCX' : (isPdf ? 'PDF' : ext);

        // Preencher automaticamente o título caso o usuário ainda não tenha digitado
        var titleInput = document.getElementById('new-material-title');
        if (titleInput && !titleInput.value) {
            var rawTitle = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            titleInput.value = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
        }

        // Leitura via FileReader
        var reader = new FileReader();
        reader.onload = function(evt) {
            uploadedFileState.fileData = evt.target.result;
            if (preview) {
                preview.innerHTML = '<div class="attached-file-badge">' +
                    '<div class="file-icon-box ' + (isWord ? 'doc-word' : (isPdf ? 'doc-pdf' : 'doc-general')) + '">' +
                        (isWord ? '📝' : (isPdf ? '📄' : '📁')) +
                    '</div>' +
                    '<div class="file-meta-box">' +
                        '<strong>' + fileName + '</strong>' +
                        '<span>' + fileSizeMb + ' • Formato ' + uploadedFileState.formatoArquivo + ' pronto para acervo</span>' +
                    '</div>' +
                    '<button type="button" class="btn btn-icon btn-xs" onclick="clearAttachedFile();" title="Remover arquivo">✕</button>' +
                '</div>';
            }
        };
        reader.readAsDataURL(file);
    }

    function clearAttachedFile() {
        uploadedFileState = { fileData: null, fileName: '', fileSize: '', fileType: '', formatoArquivo: 'PDF' };
        var fileInput = document.getElementById('new-material-file-input');
        if (fileInput) fileInput.value = '';
        var preview = document.getElementById('file-upload-preview');
        if (preview) preview.innerHTML = '';
    }

    function handleCoverFileUpload(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;

        var preview = document.getElementById('cover-upload-preview');
        var reader = new FileReader();
        reader.onload = function(evt) {
            uploadedCoverState.coverData = evt.target.result;
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
        uploadedCoverState.coverData = null;
        var coverInput = document.getElementById('new-material-cover-input');
        if (coverInput) coverInput.value = '';
        var preview = document.getElementById('cover-upload-preview');
        if (preview) {
            preview.innerHTML = '<span style="font-size:0.75rem; color:var(--text-muted);">Nenhuma capa personalizada enviada (será gerada automaticamente).</span>';
        }
    }

    function saveNewPedagogicMaterial(e) {
        if (e) e.preventDefault();

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

        // Mapear categoria a partir do tipo
        var categoria = 'Simulados';
        if (tipo === 'Reforco' || tipo === 'Intervencao') categoria = 'Reforco';
        else if (tipo === 'Matriz') categoria = 'Matrizes';
        else if (tipo === 'Guia' || tipo === 'Gabarito') categoria = 'Guias';

        var newBook = {
            id: 'BOOK_' + Date.now(),
            titulo: title.trim(),
            subtitulo: subtitulo.trim() || ('Material Pedagógico • ' + comp),
            etapa: etapa,
            componente: comp,
            categoria: categoria,
            tipo: tipo,
            descritores: ['Matriz BNCC / SAEB'],
            formato: uploadedFileState.formatoArquivo ? (uploadedFileState.formatoArquivo + ' Digital') : 'Caderno Digital A4',
            formatoArquivo: uploadedFileState.formatoArquivo || 'PDF',
            paginas: 12,
            ano: new Date().getFullYear(),
            versao: 'v1.0 (' + new Date().getFullYear() + ')',
            data_publicacao: 'Recente',
            viewsCount: 1,
            downloadsCount: 0,
            corTema: corTema,
            capaBadge: tipo === 'Simulado' ? 'Simulado Oficial' : (tipo === 'Reforco' ? 'Reforço Escolar' : (tipo === 'Matriz' ? 'Matriz Curricular' : 'Guia Prático')),
            capaUrl: uploadedCoverState.coverData || '',
            fileName: uploadedFileState.fileName || (title.replace(/\s+/g, '_') + '.' + (uploadedFileState.formatoArquivo || 'pdf').toLowerCase()),
            fileSize: uploadedFileState.fileSize || '1.5 MB',
            fileType: uploadedFileState.fileType || 'application/pdf',
            fileData: uploadedFileState.fileData || null,
            descricao: desc.trim() || 'Material pedagógico adicionado ao acervo municipal da SEMED Gonçalves Dias.'
        };

        libraryItems.unshift(newBook);
        saveLibraryDatabase(libraryItems);
        closeUploadPedagogicModal();
        renderPedagogicLibrary();

        if (typeof global.showToast === 'function') {
            global.showToast('Material "' + newBook.titulo + '" catalogado na Biblioteca com sucesso!', 'check');
        }
    }

    // -------------------------------------------------------------------------
    // 10. INICIALIZADOR DE EVENTOS DO MÓDULO
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

        // Eventos do Modal de Upload
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

        // Renderizar na inicialização
        renderPedagogicLibrary();
    }

    // Exportar para o escopo global
    global.renderPedagogicLibrary = renderPedagogicLibrary;
    global.handleCategoryPillClick = handleCategoryPillClick;
    global.handleLibrarySearchInput = handleLibrarySearchInput;
    global.applySuggestionSearch = applySuggestionSearch;
    global.clearLibraryFilters = clearLibraryFilters;
    global.handleDeleteLibraryMaterial = handleDeleteLibraryMaterial;
    global.trackAndDownloadBookPdf = trackAndDownloadBookPdf;
    global.trackAndViewBook = trackAndViewBook;
    global.trackAndPrintExam = trackAndPrintExam;
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

})(typeof window !== 'undefined' ? window : global);
