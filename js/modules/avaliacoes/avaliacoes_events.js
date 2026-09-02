/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — CICLO DE VIDA DE EVENTOS AVALIATIVOS & WIZARD
 * Arquivo: js/modules/avaliacoes/avaliacoes_events.js
 * Descrição: Máquina de estados (Rascunho, Aberto, Encerrado), listagem executiva (7 colunas),
 *            assistente de 3 passos com matriz de gabarito por disciplina e 4 sub-abas.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var currentFilterTab = 'ativos';
    var wizardEditingEventId = null;
    var wizardCurrentStep = 1;
    var currentDescFilter = 'all';

    // -------------------------------------------------------------------------
    // 1. RENDERIZAÇÃO DA TABELA DE EVENTOS AVALIATIVOS (7 COLUNAS ALINHADAS)
    // -------------------------------------------------------------------------

    function filterEventosList(filterName) {
        currentFilterTab = filterName || 'ativos';
        
        var links = document.querySelectorAll('.event-filter-link');
        links.forEach(function(l) {
            var f = l.getAttribute('data-filter');
            if (f === currentFilterTab) {
                l.classList.add('active');
                l.style.color = 'var(--color-brand-primary, #1A2D42)';
                l.style.fontWeight = '700';
                l.style.borderBottom = '2px solid var(--color-brand-primary, #1A2D42)';
            } else {
                l.classList.remove('active');
                l.style.color = 'var(--color-text-secondary, #2E4156)';
                l.style.fontWeight = '500';
                l.style.borderBottom = 'none';
            }
        });

        renderEventosTable();
    }

    async function carregarEventosDoBanco() {
        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            var res = await fetch('/api/eventos-simulado', { headers: headers });
            if (res.ok) {
                var json = await res.json();
                if (json && json.success && Array.isArray(json.eventos)) {
                    if (typeof global.saveEventosState === 'function') {
                        global.saveEventosState(json.eventos);
                    }
                    renderEventosTable();
                }
            }
        } catch(e) {
            console.warn('[Carregar Eventos API Fallback]', e);
        }
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
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="padding: 36px 20px; text-align: center; color: var(--color-text-secondary);">
                        <div style="font-size: 1.8rem; margin-bottom: 6px;">📋</div>
                        <div style="font-weight: 700; color: var(--color-brand-primary); margin-bottom: 4px;">Nenhum evento de avaliação encontrado nesta categoria.</div>
                        <div style="font-size: 0.8rem; color: var(--color-text-muted);">Clique em "+ Novo Evento" para agendar uma nova avaliação.</div>
                    </td>
                </tr>
            `;
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

            var etapasList = Array.isArray(ev.etapasAlvo) ? ev.etapasAlvo.join(', ') : (ev.etapasAlvo || '5º Ano');
            var disciplinaLabel = ev.disciplina || 'Língua Portuguesa';
            if (disciplinaLabel === 'portugues') disciplinaLabel = 'Língua Portuguesa';
            if (disciplinaLabel === 'matematica') disciplinaLabel = 'Matemática';
            if (disciplinaLabel === 'ambas') disciplinaLabel = 'Prova Mista (LP + MT)';

            var safeTitulo = typeof global.escapeHtml === 'function' ? global.escapeHtml(ev.titulo || ev.nome) : (ev.titulo || ev.nome);
            var escolasLabel = (ev.escolas && ev.escolas.length > 0) ? (ev.escolas.length + ' Escolas Selecionadas') : 'Todas as Escolas da Rede';

            return `
                <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 58px;">
                    <!-- 1. Avaliação -->
                    <td style="padding: 12px 16px;">
                        <strong style="color: var(--color-brand-primary); font-size: var(--text-sm); display: block;">${safeTitulo}</strong>
                        <span style="font-size: 11px; color: var(--color-text-secondary);">${ev.qtdQuestoes || 20} Itens de Múltipla Escolha</span>
                    </td>
                    <!-- 2. Escola Alvo -->
                    <td style="padding: 12px 16px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                        ${escolasLabel}
                    </td>
                    <!-- 3. Janela de Aplicação -->
                    <td style="padding: 12px 16px; font-size: var(--text-xs); color: var(--color-text-secondary); font-family: var(--font-mono);">
                        ${ev.dataRealizacao || '2026-09-15'}
                    </td>
                    <!-- 4. Tipo / Componente -->
                    <td style="padding: 12px 16px; font-size: var(--text-xs);">
                        <span class="badge" style="background: var(--color-surface-subtle); color: var(--color-brand-primary); border: 1px solid var(--color-border-subtle); font-size: 11px;">${disciplinaLabel}</span>
                    </td>
                    <!-- 5. Etapa -->
                    <td style="padding: 12px 16px; font-size: var(--text-xs); font-weight: 600; color: var(--color-brand-primary);">
                        ${etapasList}
                    </td>
                    <!-- 6. Status do Gabarito -->
                    <td style="padding: 12px 16px; text-align: center;">
                        ${statusBadge}
                    </td>
                    <!-- 7. Ações -->
                    <td style="padding: 12px 16px; text-align: center;">
                        <div style="display: inline-flex; align-items: center; gap: 6px;">
                            ${isAberto ? `
                                <button type="button" onclick="irParaEspelhoLancamento('${ev.id}')" class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 10px; height: 28px;" title="Digitar Notas">
                                    <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                                    <span>Lançar Respostas</span>
                                </button>
                                <button type="button" onclick="handleEncerrarEvento('${ev.id}')" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px; height: 28px;" title="Encerrar Avaliação">
                                    <i data-lucide="lock" style="width: 12px; height: 12px;"></i>
                                </button>
                            ` : ''}
                            ${isEncerrado ? `
                                <button type="button" onclick="irParaDashboardResultados('${ev.id}')" class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 10px; height: 28px;">
                                    <i data-lucide="bar-chart-2" style="width: 12px; height: 12px;"></i>
                                    <span>Ver Resultados</span>
                                </button>
                                <button type="button" onclick="handleReabrirEvento('${ev.id}')" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px; height: 28px;" title="Reabrir Evento">
                                    <i data-lucide="unlock" style="width: 12px; height: 12px;"></i>
                                </button>
                            ` : ''}
                            ${isRascunho ? `
                                <button type="button" onclick="abrirEditarEventoWizard('${ev.id}')" class="btn btn-primary btn-sm" style="font-size: 11px; padding: 4px 10px; height: 28px;">
                                    <i data-lucide="play" style="width: 12px; height: 12px;"></i>
                                    <span>Continuar Edição</span>
                                </button>
                            ` : ''}
                            <button type="button" onclick="abrirModalImpressaoLogistica('${ev.id}')" class="btn btn-outline btn-sm" style="font-size: 11px; padding: 4px 8px; height: 28px;" title="Imprimir Cartões e Atas">
                                <i data-lucide="printer" style="width: 12px; height: 12px;"></i>
                            </button>
                            <button type="button" onclick="handleExcluirEvento('${ev.id}')" class="btn-icon btn-sm" style="color: #ef4444; border: 1px solid rgba(239,68,68,0.3); width: 28px; height: 28px;" title="Excluir">
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

    async function handleEncerrarEvento(eventoId) {
        if (!confirm('Deseja realmente ENCERRAR este evento avaliativo?\n\nIsso bloqueará a inserção e edição de respostas para garantir a auditoria dos dados.')) return;

        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            var res = await fetch('/api/eventos-simulado/' + encodeURIComponent(eventoId) + '/encerrar', {
                method: 'PATCH',
                headers: headers
            });
            var json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Erro ao encerrar evento no servidor.');
            }

            var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
            var idx = eventos.findIndex(function(e) { return e.id === eventoId; });
            if (idx !== -1) {
                eventos[idx].status = 'ENCERRADO';
                if (typeof global.saveEventosState === 'function') global.saveEventosState(eventos);
                renderEventosTable();
                if (typeof global.showToast === 'function') global.showToast('Evento encerrado com sucesso! Lançamentos bloqueados.', 'check');
            }
        } catch(e) {
            console.error('[Encerrar Evento Erro]', e);
            if (typeof global.showToast === 'function') {
                global.showToast('Erro ao encerrar evento: ' + (e.message || 'Falha de conexão com o servidor.'), 'alert-triangle');
            } else {
                alert('Erro ao encerrar evento: ' + (e.message || 'Falha de conexão com o servidor.'));
            }
        }
    }

    async function handleReabrirEvento(eventoId) {
        if (!confirm('Deseja REABRIR este evento avaliativo para correções?')) return;

        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            var res = await fetch('/api/eventos-simulado/' + encodeURIComponent(eventoId) + '/reabrir', {
                method: 'PATCH',
                headers: headers
            });
            var json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Erro ao reabrir evento no servidor.');
            }

            var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
            var idx = eventos.findIndex(function(e) { return e.id === eventoId; });
            if (idx !== -1) {
                eventos[idx].status = 'ABERTO';
                if (typeof global.saveEventosState === 'function') global.saveEventosState(eventos);
                renderEventosTable();
                if (typeof global.showToast === 'function') global.showToast('Evento reaberto para lançamentos!', 'check');
            }
        } catch(e) {
            console.error('[Reabrir Evento Erro]', e);
            if (typeof global.showToast === 'function') {
                global.showToast('Erro ao reabrir evento: ' + (e.message || 'Falha de conexão com o servidor.'), 'alert-triangle');
            } else {
                alert('Erro ao reabrir evento: ' + (e.message || 'Falha de conexão com o servidor.'));
            }
        }
    }

    async function handleExcluirEvento(eventoId) {
        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var ev = eventos.find(function(e) { return e.id === eventoId; });

        if (ev && ev.status !== 'RASCUNHO') {
            var msg = `Não é permitido excluir eventos com status '${ev.status}'. Apenas eventos em status 'RASCUNHO' podem ser excluídos. Eventos abertos ou encerrados devem ser concluídos ou mantidos para integridade histórica.`;
            if (typeof global.showToast === 'function') {
                global.showToast(msg, 'alert-triangle');
            } else {
                alert(msg);
            }
            return;
        }

        var nomeEvento = ev ? ev.titulo : eventoId;
        if (!confirm(`Tem certeza que deseja excluir permanentemente o rascunho:\n\n"${nomeEvento}"?`)) {
            return;
        }

        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            var res = await fetch('/api/eventos-simulado/' + encodeURIComponent(eventoId), {
                method: 'DELETE',
                headers: headers
            });
            var json = await res.json();
            if (!res.ok || !json.success) {
                throw new Error(json.error || 'Falha ao excluir evento no banco de dados.');
            }

            // Exclusão confirmada pelo backend: remove do estado local
            var filtered = eventos.filter(function(e) { return e.id !== eventoId; });
            if (typeof global.saveEventosState === 'function') global.saveEventosState(filtered);
            renderEventosTable();
            if (typeof global.showToast === 'function') global.showToast('Evento em rascunho excluído com sucesso.', 'check');
        } catch(err) {
            console.error('[Excluir Evento Erro]', err);
            // Em caso de falha no servidor ou rede, o evento PERMANECE na tabela e apenas o erro é exibido
            if (typeof global.showToast === 'function') {
                global.showToast('Erro ao excluir evento: ' + (err.message || 'Falha de comunicação com o servidor.'), 'alert-triangle');
            } else {
                alert('Erro ao excluir evento: ' + (err.message || 'Falha de comunicação com o servidor.'));
            }
        }
    }

    // -------------------------------------------------------------------------
    // 3. POVOAMENTO DINÂMICO DE ESCOLAS E TURMAS DO WIZARD
    // -------------------------------------------------------------------------

    function getOfficialSchoolsList() {
        if (Array.isArray(global.dbEscolas) && global.dbEscolas.length > 0) {
            return global.dbEscolas;
        }
        try {
            var raw = localStorage.getItem('gd_schools_db') || localStorage.getItem('gd_escolas_db');
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}

        return [
            { id: 'esc_01', nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS' },
            { id: 'esc_02', nome: 'U I BASILIO ALVES' },
            { id: 'esc_03', nome: 'UI JOSE CORREA LIMA' },
            { id: 'esc_04', nome: 'UE ANITA FURTADO' },
            { id: 'esc_05', nome: 'UI EMILIO MURAD' },
            { id: 'esc_06', nome: 'UI FRANCISCO VIEIRA' },
            { id: 'esc_07', nome: 'UE JOAO ALVES DE OLIVEIRA' },
            { id: 'esc_08', nome: 'UI PEDRO ALVARES CABRAL' },
            { id: 'esc_09', nome: 'UI SANTO ANTONIO' }
        ];
    }

    function getOfficialClassesList() {
        if (Array.isArray(global.dbTurmas) && global.dbTurmas.length > 0) {
            return global.dbTurmas;
        }
        try {
            var raw = localStorage.getItem('gd_classes_db') || localStorage.getItem('gd_turmas_db');
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}

        return [
            { id: 'turma_2a', nome: '2º Ano A — Ensino Fundamental (Anos Iniciais)' },
            { id: 'turma_2b', nome: '2º Ano B — Ensino Fundamental (Anos Iniciais)' },
            { id: 'turma_5a', nome: '5º Ano A — Ensino Fundamental (Anos Iniciais)' },
            { id: 'turma_5b', nome: '5º Ano B — Ensino Fundamental (Anos Iniciais)' },
            { id: 'turma_9a', nome: '9º Ano A — Ensino Fundamental (Anos Finais)' },
            { id: 'turma_9b', nome: '9º Ano B — Ensino Fundamental (Anos Finais)' }
        ];
    }

    function populateWizardSchools() {
        var container = document.getElementById('wizard-schools-checklist');
        if (!container) return;

        var schools = getOfficialSchoolsList();
        container.innerHTML = schools.map(function(esc, idx) {
            var escNome = esc.nome || esc.name || 'Escola ' + (idx + 1);
            return `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--color-brand-primary); cursor: pointer; padding: 4px; border-radius: 4px;">
                    <input type="checkbox" class="wizard-school-check" value="${escNome}" checked>
                    <span>${escNome}</span>
                </label>
            `;
        }).join('');

        var btnSelectAll = document.getElementById('btn-select-all-wizard-schools');
        var btnClearAll = document.getElementById('btn-clear-all-wizard-schools');

        if (btnSelectAll) {
            btnSelectAll.onclick = function() {
                container.querySelectorAll('.wizard-school-check').forEach(function(chk) { chk.checked = true; });
            };
        }
        if (btnClearAll) {
            btnClearAll.onclick = function() {
                container.querySelectorAll('.wizard-school-check').forEach(function(chk) { chk.checked = false; });
            };
        }
    }

    function populateWizardClasses() {
        var container = document.getElementById('wizard-classes-checklist');
        if (!container) return;

        var classes = getOfficialClassesList();
        container.innerHTML = classes.map(function(t, idx) {
            var turmaNome = t.nome || t.name || 'Turma ' + (idx + 1);
            return `
                <label style="display: flex; align-items: center; gap: 8px; font-size: 0.78rem; color: var(--color-brand-primary); cursor: pointer; padding: 4px; border-radius: 4px;">
                    <input type="checkbox" class="wizard-class-check" value="${turmaNome}" checked>
                    <span>${turmaNome}</span>
                </label>
            `;
        }).join('');

        var btnSelectAll = document.getElementById('btn-wizard-classes-select-all');
        var btnSelectNone = document.getElementById('btn-wizard-classes-select-none');

        if (btnSelectAll) {
            btnSelectAll.onclick = function() {
                container.querySelectorAll('.wizard-class-check').forEach(function(chk) { chk.checked = true; });
            };
        }
        if (btnSelectNone) {
            btnSelectNone.onclick = function() {
                container.querySelectorAll('.wizard-class-check').forEach(function(chk) { chk.checked = false; });
            };
        }
    }

    // -------------------------------------------------------------------------
    // 4. WIZARD DE EVENTOS (DELEGADO PARA js/modules/avaliacoes/avaliacoes_wizard.js)
    // -------------------------------------------------------------------------
    // As funções abrirNovoEventoWizard, abrirEditarEventoWizard, fecharWizardEventos,
    // renderWizardStep, renderGabaritoMatrixStep2, preencherGabaritoAleatorio,
    // renderReviewStep3 e salvarPublicarEventoFinal são orquestradas pelo módulo dedicado.

    // -------------------------------------------------------------------------
    // 5. BANCO DE HABILIDADES & DESCRITORES ATIVOS (SUB-ABA 4)
    // -------------------------------------------------------------------------

    function initBancoHabilidades() {
        var form = document.getElementById('form-create-descriptor');
        if (form) {
            form.onsubmit = function(e) {
                e.preventDefault();
                var code = document.getElementById('desc-code')?.value.trim();
                var stage = document.getElementById('desc-stage')?.value;
                var text = document.getElementById('desc-text')?.value.trim();

                if (!code || !text) return;

                var matriz = global.MATRIZ_HABILIDADES_SAEB || { portugues: [], matematica: [] };
                var isMat = code.toUpperCase().startsWith('MT') || code.toUpperCase().startsWith('MAT');
                var targetList = isMat ? matriz.matematica : matriz.portugues;

                targetList.unshift({
                    codigo: code.toUpperCase(),
                    nome: text,
                    foco: 'Habilidade cadastrada pelo gestor — ' + stage
                });

                form.reset();
                renderActiveDescriptorsTable();
                if (typeof global.showToast === 'function') global.showToast('Descritor ' + code + ' cadastrado com sucesso!', 'check');
            };
        }

        var filterBtns = document.querySelectorAll('.desc-filter-btn');
        filterBtns.forEach(function(btn) {
            btn.onclick = function(e) {
                e.preventDefault();
                filterBtns.forEach(function(b) {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-outline');
                });
                this.classList.remove('btn-outline');
                this.classList.add('btn-primary');
                currentDescFilter = this.getAttribute('data-filter');
                renderActiveDescriptorsTable();
            };
        });

        renderActiveDescriptorsTable();
    }

    function renderActiveDescriptorsTable() {
        var tbody = document.getElementById('active-descriptors-table-body');
        if (!tbody) return;

        var matriz = global.MATRIZ_HABILIDADES_SAEB || { portugues: [], matematica: [] };
        var list = [];

        if (currentDescFilter === 'all') {
            list = (matriz.portugues || []).concat(matriz.matematica || []);
        } else if (currentDescFilter === 'Língua Portuguesa') {
            list = matriz.portugues || [];
        } else if (currentDescFilter === 'Matemática') {
            list = matriz.matematica || [];
        }

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--color-text-muted);">Nenhum descritor nesta categoria.</td></tr>';
            return;
        }

        tbody.innerHTML = list.map(function(item) {
            var isMat = item.codigo.startsWith('MT');
            var etapa = isMat ? '5º / 9º Ano' : '2º / 5º Ano';

            return `
                <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 48px;">
                    <td style="padding: 10px 16px; font-weight: 700; color: var(--color-brand-primary); font-family: var(--font-mono); font-size: 12px;">
                        ${item.codigo}
                    </td>
                    <td style="padding: 10px 16px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                        ${etapa}
                    </td>
                    <td style="padding: 10px 16px; font-size: var(--text-xs); color: var(--color-text-primary);">
                        <strong>${item.nome}</strong>
                        ${item.foco ? `<span style="display:block; font-size:11px; color:var(--color-text-muted);">${item.foco}</span>` : ''}
                    </td>
                    <td style="padding: 10px 16px; text-align: center;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="alert('Descritor Oficial: ${item.codigo}\\n${item.nome}')" style="font-size: 11px; padding: 2px 8px; height: 26px;">
                            Detalhes
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // -------------------------------------------------------------------------
    // 6. SUB-ABAS DE NAVEGAÇÃO DA SEÇÃO "CRIAR AVALIAÇÕES"
    // -------------------------------------------------------------------------

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
                b.style.color = 'var(--color-brand-primary, #1A2D42)';
                b.style.fontWeight = '700';
                b.style.borderBottom = '2px solid var(--color-brand-primary, #1A2D42)';
            } else {
                b.classList.remove('active');
                b.style.color = 'var(--color-text-secondary, #2E4156)';
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
        } else if (subtabId === 'banco-habilidades-sub') {
            initBancoHabilidades();
        }

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    // Inicialização de Listeners Globais
    function initEventosListeners() {
        initAvaliacoesSubtabs();

        var btnShowList = document.getElementById('btn-show-created-events');
        var btnShowWizard = document.getElementById('btn-show-new-event-wizard');

        if (btnShowList) btnShowList.onclick = function() { if (typeof global.fecharWizardEventos === 'function') global.fecharWizardEventos(); };
        if (btnShowWizard) btnShowWizard.onclick = function() { if (typeof global.abrirNovoEventoWizard === 'function') global.abrirNovoEventoWizard(); };

        var next1 = document.getElementById('wizard-next-1');
        var next2 = document.getElementById('wizard-next-2');
        var prev2 = document.getElementById('wizard-prev-2');
        var prev3 = document.getElementById('wizard-prev-3');
        var finishBtn = document.getElementById('wizard-finish-btn');

        if (next1) next1.onclick = function() { if (typeof global.renderWizardStep === 'function') global.renderWizardStep(2); };
        if (next2) next2.onclick = function() { if (typeof global.renderWizardStep === 'function') global.renderWizardStep(3); };
        if (prev2) prev2.onclick = function() { if (typeof global.renderWizardStep === 'function') global.renderWizardStep(1); };
        if (prev3) prev3.onclick = function() { if (typeof global.renderWizardStep === 'function') global.renderWizardStep(2); };
        if (finishBtn) finishBtn.onclick = function() { if (typeof global.salvarPublicarEventoFinal === 'function') global.salvarPublicarEventoFinal(); };

        document.querySelectorAll('.event-filter-link').forEach(function(link) {
            link.onclick = function(e) {
                e.preventDefault();
                filterEventosList(this.getAttribute('data-filter'));
            };
        });

        renderEventosTable();
        carregarEventosDoBanco();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEventosListeners);
    } else {
        initEventosListeners();
    }

    // Exposição Global
    global.carregarEventosDoBanco = carregarEventosDoBanco;
    global.initAvaliacoesSubtabs = initAvaliacoesSubtabs;
    global.switchAvaliacoesSubtab = switchAvaliacoesSubtab;
    global.filterEventosList = filterEventosList;
    global.renderEventosTable = renderEventosTable;
    global.handleEncerrarEvento = handleEncerrarEvento;
    global.handleReabrirEvento = handleReabrirEvento;
    global.handleExcluirEvento = handleExcluirEvento;
    global.populateWizardSchools = populateWizardSchools;
    global.populateWizardClasses = populateWizardClasses;
    global.initBancoHabilidades = initBancoHabilidades;
    global.renderActiveDescriptorsTable = renderActiveDescriptorsTable;

})(typeof window !== 'undefined' ? window : this);

