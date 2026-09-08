/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — TOUR GUIADO CONTEXTUAL (DENTRO DE CADA ABA)
 * Arquivo: js/modules/onboarding/tab_context_tours.js
 * Descrição: Catálogo de passos e motor de spotlight para tours específicos
 *            dentro de cada uma das abas do sistema.
 * ============================================================================
 */

(function(global) {
    'use strict';

    // 1. CATÁLOGO CONTEXTUAL DE PASSOS POR ABA
    var TAB_CONTEXTUAL_TOURS = {
        'dashboard': [
            {
                targetSelector: '.dashboard-welcome-banner, #dashboard-welcome-banner',
                title: '1. Painel Municipal & Ações Rápidas',
                text: 'Aqui você visualiza uma saudação personalizada com atalhos diretos para criar novas avaliações e gerenciar o perfil.',
                placement: 'bottom'
            },
            {
                targetSelector: '#dashboard-metric-cards-container, .metrics-grid',
                title: '2. Indicadores Estratégicos em Tempo Real',
                text: 'Monitore o IDEB Observado, a Proficiência Média da Rede (Língua Portuguesa e Matemática) e a Taxa de Rendimento/Aprovação.',
                placement: 'bottom'
            },
            {
                targetSelector: '.ideb-trajectory-card, #ideb-trajectory-card',
                title: '3. Trajetória PDE vs. Meta Pactuada',
                text: 'Acompanhe a régua calibrada de distância da meta municipal para 2025/2026 com base nas diretrizes do MEC/INEP.',
                placement: 'top'
            },
            {
                targetSelector: '.chart-card, #dashboard-history-chart-card',
                title: '4. Séries Históricas & Desempenho por Escola',
                text: 'Analise gráficos evolutivos dos Anos Iniciais (5º Ano) e Finais (9º Ano) comparados com a projeção oficial.',
                placement: 'top'
            }
        ],

        'calculo-ideb': [
            {
                targetSelector: '#calculo-ideb .card, #calculo-ideb section:first-child',
                title: '1. Metodologia Oficial: IDEB = N × P',
                text: 'Entenda como a Nota Padronizada do SAEB (N) é multiplicada pelo Indicador de Rendimento/Fluxo (P) para compor o índice.',
                placement: 'bottom'
            },
            {
                targetSelector: '#sec-calculo-manual, #calculo-ideb form, #calculo-ideb .calculator-card',
                title: '2. Simulador Interativo do IDEB',
                text: 'Altere as proficiências de LP e MAT ou a taxa de aprovação para simular instantaneamente o IDEB resultante da escola ou rede.',
                placement: 'top'
            },
            {
                targetSelector: '#sec-indicadores-vaar, #calculo-ideb .vaar-card',
                title: '3. Indicadores do VAAR / FUNDEB',
                text: 'Visualize as fórmulas do IND (Nível de Desempenho), IAD (Avanço) e Inad (Indicador Ponderado) para o novo FUNDEB.',
                placement: 'top'
            },
            {
                targetSelector: '#btn-export-calculo-ideb, #calculo-ideb button.btn-primary',
                title: '4. Exportação do Laudo Metodológico',
                text: 'Gere relatórios completos e certificados de cálculo em formato executivo para prestação de contas pedagógicas.',
                placement: 'left'
            }
        ],

        'escolas-panel': [
            {
                targetSelector: '#escolas-kpis-container, #escolas-panel .metrics-grid',
                title: '1. Panorama das Unidades Escolares',
                text: 'Consulte o total de escolas ativas, total de estudantes matriculados e o IDEB médio consolidado da rede.',
                placement: 'bottom'
            },
            {
                targetSelector: '#escolas-search-input, #escolas-panel input[type="text"]',
                title: '2. Busca e Filtros por INEP / Localização',
                text: 'Filtre instantaneamente unidades da Zona Urbana ou Rural por nome ou código INEP oficial.',
                placement: 'bottom'
            },
            {
                targetSelector: '#escolas-table, #schools-overview-container table',
                title: '3. Lista de Escolas & Ações',
                text: 'Clique em qualquer escola para visualizar suas turmas, professores vinculados e histórico detalhado de proficiência.',
                placement: 'top'
            }
        ],

        'alunos-panel': [
            {
                targetSelector: '#alunos-kpis-container, #alunos-panel .metrics-grid',
                title: '1. Matrículas & Rendimento Geral',
                text: 'Acompanhe a contagem geral de estudantes cadastrados, taxa de frequência e distribuição por etapa de ensino.',
                placement: 'bottom'
            },
            {
                targetSelector: '#alunos-search-input, #alunos-filter-school',
                title: '2. Filtros por Escola, Turma e Ano',
                text: 'Localize rapidamente qualquer aluno pelo nome, matrícula, turma ou necessidades de acessibilidade pedagógica.',
                placement: 'bottom'
            },
            {
                targetSelector: '#alunos-table, #alunos-panel table',
                title: '3. Ficha Individual do Estudante',
                text: 'Acesse o histórico individual de notas em simulados, diagnóstico por descritor e presença nas avaliações externas.',
                placement: 'top'
            }
        ],

        'metas-ideb': [
            {
                targetSelector: '#metas-ideb .card:first-child, #metas-ideb-header',
                title: '1. Pactuação do Plano Municipal (PDE)',
                text: 'Defina as metas oficiais de crescimento da rede e de cada escola até o ciclo SAEB 2025/2026.',
                placement: 'bottom'
            },
            {
                targetSelector: '#metas-ideb canvas, #metas-ideb .chart-card',
                title: '2. Curva de Projeção e Desvios',
                text: 'Compare visualmente a linha da meta projetada com o desempenho real observado para identificar gargalos precocemente.',
                placement: 'top'
            },
            {
                targetSelector: '#metas-ideb table, #metas-escolas-table',
                title: '3. Desdobramento de Metas por Escola',
                text: 'Acompanhe o esforço necessário de cada unidade escolar em pontos de proficiência e taxa de aprovação.',
                placement: 'top'
            }
        ],

        'ideb-comparativo': [
            {
                targetSelector: '#ideb-comparativo .nav-tabs, #ideb-regional-tabs',
                title: '1. Painéis Comparativos do Maranhão',
                text: 'Navegue entre o Painel Principal do Município, Desempenho por UREs e o Ranking Estadual Oficial.',
                placement: 'bottom'
            },
            {
                targetSelector: '#tab-ideb-painel-principal, #ideb-comparativo .ideb-regional-tab-content',
                title: '2. Série Histórica INEP (2015 a 2025)',
                text: 'Analise a evolução de 10 anos do IDEB da sua rede municipal confrontada com a média do estado e do Brasil.',
                placement: 'top'
            },
            {
                targetSelector: '#tab-ideb-ranking-geral-ma, #ideb-comparativo table',
                title: '3. Posicionamento e Ranking Geral',
                text: 'Descubra a posição exata da sua rede entre os 217 municípios maranhenses e em sua respectiva URE.',
                placement: 'top'
            }
        ],

        'matriz-descritores': [
            {
                targetSelector: '#btn-matriz-tab-saeb, #matriz-descritores .nav-tabs',
                title: '1. Seletor de Matriz: SAEB vs. BNCC',
                text: 'Alterne entre os Descritores Cognitivos do SAEB/SEAMA e o catálogo oficial de Habilidades da BNCC.',
                placement: 'bottom'
            },
            {
                targetSelector: '#matriz-subject-select, #bncc-subject-select',
                title: '2. Filtros por Disciplina e Etapa',
                text: 'Selecione Língua Portuguesa ou Matemática para o 2º, 5º ou 9º Ano do Ensino Fundamental.',
                placement: 'bottom'
            },
            {
                targetSelector: '#matriz-descritores table, #bncc-skills-table-body',
                title: '3. Matriz Detalhada & Nível Cognitivo',
                text: 'Consulte o código, a descrição oficial da habilidade e a classificação de criticidade (Essencial / Prioritária).',
                placement: 'top'
            }
        ],

        'cronograma-habilidades': [
            {
                targetSelector: '#schedule-period-display, #cronograma-habilidades .header-actions',
                title: '1. Navegação Semanal e Mensal',
                text: 'Avance ou retroceda nos meses do ano letivo de 2026 para visualizar a distribuição temporal das aulas.',
                placement: 'bottom'
            },
            {
                targetSelector: '#schedule-calendar-grid, #cronograma-habilidades .calendar-view',
                title: '2. Grade Curricular Semana a Semana',
                text: 'Veja quais descritores do SAEB e habilidades da BNCC devem ser lecionados em cada semana do bimestre.',
                placement: 'top'
            },
            {
                targetSelector: '#cronograma-habilidades button, #btn-print-schedule',
                title: '3. Impressão & Planejamento Docente',
                text: 'Exporte e imprima o cronograma oficial para os professores utilizarem em seus planejamentos pedagógicos.',
                placement: 'left'
            }
        ],

        'criar-avaliacoes': [
            {
                targetSelector: '#btn-abrir-wizard-evento, #sec-criar-avaliacoes .btn-primary',
                title: '1. Assistente de Criação de Simulados',
                text: 'Inicie o assistente de 3 passos para configurar data, etapa, disciplina e selecionar itens do banco de questões.',
                placement: 'bottom'
            },
            {
                targetSelector: '#eval-events-table, #sec-criar-avaliacoes table',
                title: '2. Histórico de Avaliações Criadas',
                text: 'Acompanhe todas as provas agendadas, em andamento ou concluídas na rede municipal.',
                placement: 'top'
            },
            {
                targetSelector: '#eval-subtabs-nav, #sec-criar-avaliacoes .nav-tabs',
                title: '3. Lançamento de Gabaritos e Resultados',
                text: 'Lance notas por turma, visualize gráficos de acertos por descritor e emita laudos de proficiência.',
                placement: 'bottom'
            }
        ],

        'aplicacao-provas': [
            {
                targetSelector: '#sec-aplicacao-provas .card:first-child, #sec-aplicacao-provas form',
                title: '1. Registro de Presença & Folhas de Resposta',
                text: 'Controle a frequência dos estudantes no dia da aplicação para garantir a taxa mínima de 80% exigida pelo SAEB.',
                placement: 'bottom'
            },
            {
                targetSelector: '#sec-aplicacao-provas table',
                title: '2. Monitoramento de Pacotes por Escola',
                text: 'Supervisione a entrega e digitalização dos cartões-resposta de cada turma e unidade de ensino.',
                placement: 'top'
            }
        ],

        'gestao-pedagogica': [
            {
                targetSelector: '#niveis-saeb-sub, #gestao-pedagogica .card:first-child',
                title: '1. Distribuição por Níveis SAEB (0 a 9)',
                text: 'Veja o percentual de alunos nos níveis Abaixo do Básico, Básico, Adequado e Avançado.',
                placement: 'bottom'
            },
            {
                targetSelector: '#planos-intervencao-sub, #gestao-pedagogica table',
                title: '2. Planos de Intervenção Pedagógica',
                text: 'Gere roteiros de reforço e atividades direcionadas especificamente para as turmas com maior defasagem.',
                placement: 'top'
            }
        ],

        'biblioteca-recursos': [
            {
                targetSelector: '#biblioteca-search-input, #biblioteca-recursos input[type="text"]',
                title: '1. Acervo Digital Pedagógico',
                text: 'Pesquise por apostilas, simulados impressos, cadernos de descritores e matrizes alinhadas ao SAEB.',
                placement: 'bottom'
            },
            {
                targetSelector: '#library-grid-container, #biblioteca-recursos .grid',
                title: '2. Visualização e Download (PDF & DOCX)',
                text: 'Baixe arquivos editáveis em Word ou prontos para impressão em alta resolução para toda a rede.',
                placement: 'top'
            }
        ],

        'doc-tecnica': [
            {
                targetSelector: '#doc-tecnica .card:first-child, #doc-tecnica-header',
                title: '1. Documentação Oficial INEP / MEC',
                text: 'Consulte notas técnicas, erratas, manuais do SAEB e fundamentação matemática do cálculo do IDEB.',
                placement: 'bottom'
            }
        ],

        'admin-panel': [
            {
                targetSelector: '#admin-panel .card:first-child, #admin-panel form',
                title: '1. Gestão de Usuários & Permissões (RBAC)',
                text: 'Cadastre novos gestores, diretores e professores, gerenciando os níveis de acesso de cada cargo.',
                placement: 'bottom'
            }
        ]
    };

    var currentTabTourSteps = [];
    var currentTabStepIndex = 0;
    var isTabTourActive = false;
    var currentActiveTabId = 'dashboard';

    // 2. DOM ELEMENTS & CRIAÇÃO
    function ensureTabTourDOMElements() {
        if (typeof document === 'undefined') return {};

        var backdrop = document.getElementById('tab-tour-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'tab-tour-backdrop';
            backdrop.className = 'onboarding-backdrop hidden';
            backdrop.onclick = function(e) {
                if (e.target === backdrop) closeTabContextTour();
            };
            document.body.appendChild(backdrop);
        }

        var spotlight = document.getElementById('tab-tour-spotlight-box');
        if (!spotlight) {
            spotlight = document.createElement('div');
            spotlight.id = 'tab-tour-spotlight-box';
            spotlight.className = 'onboarding-spotlight-box hidden';
            document.body.appendChild(spotlight);
        }

        var card = document.getElementById('tab-tour-tooltip-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'tab-tour-tooltip-card';
            card.className = 'onboarding-tooltip-card hidden';
            document.body.appendChild(card);
        }

        return { backdrop: backdrop, spotlight: spotlight, card: card };
    }

    // 3. RENDERIZADOR DE PASSO DO TOUR DA ABA
    function renderTabTourStep(index) {
        if (index < 0 || index >= currentTabTourSteps.length) {
            closeTabContextTour();
            return;
        }

        currentTabStepIndex = index;
        var step = currentTabTourSteps[index];
        var dom = ensureTabTourDOMElements();

        setTimeout(function() {
            var targetEl = null;
            var selectors = step.targetSelector.split(',');
            for (var i = 0; i < selectors.length; i++) {
                var el = document.querySelector(selectors[i].trim());
                if (el && el.offsetParent !== null) {
                    targetEl = el;
                    break;
                }
            }

            if (!targetEl) {
                targetEl = document.getElementById(currentActiveTabId) || document.querySelector('.main-content') || document.body;
            }

            try {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } catch(e) {}

            var rect = targetEl.getBoundingClientRect();

            if (dom.spotlight) {
                dom.spotlight.classList.remove('hidden');
                dom.spotlight.style.top = (rect.top - 6) + 'px';
                dom.spotlight.style.left = (rect.left - 6) + 'px';
                dom.spotlight.style.width = (rect.width + 12) + 'px';
                dom.spotlight.style.height = (rect.height + 12) + 'px';
            }

            if (dom.backdrop) {
                dom.backdrop.classList.remove('hidden');
            }

            var total = currentTabTourSteps.length;
            var isFirst = (index === 0);
            var isLast = (index === total - 1);
            var progressPct = Math.round(((index + 1) / total) * 100);

            if (dom.card) {
                dom.card.classList.remove('hidden');
                dom.card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--color-brand-primary, #2F6FED); letter-spacing: 0.5px;">
                            Guia da Aba · Passo ${index + 1} de ${total}
                        </span>
                        <button type="button" onclick="window.closeTabContextTour()" style="background: transparent; border: none; font-size: 1rem; color: var(--color-text-muted); cursor: pointer; padding: 2px;" title="Fechar Guia">
                            <i data-lucide="x" style="width:14px; height:14px;"></i>
                        </button>
                    </div>

                    <div style="width: 100%; height: 3px; background: var(--color-border-subtle); border-radius: 2px; margin-bottom: 12px; overflow: hidden;">
                        <div style="width: ${progressPct}%; height: 100%; background: var(--color-brand-primary); transition: width 0.3s ease;"></div>
                    </div>

                    <h4 style="margin: 0 0 6px 0; font-size: 0.98rem; font-weight: 800; color: var(--text-primary, #0f172a);">
                        ${step.title}
                    </h4>
                    <p style="margin: 0 0 16px 0; font-size: 0.82rem; color: var(--text-secondary, #475569); line-height: 1.45;">
                        ${step.text}
                    </p>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${!isFirst ? `
                                <button type="button" onclick="window.prevTabTourStep()" class="btn btn-outline" style="padding: 5px 12px; font-size: 0.76rem; font-weight: 600; border-radius: var(--radius-xs); cursor: pointer; border: 1px solid var(--color-border-subtle); background: transparent; color: var(--color-text-secondary); display: inline-flex; align-items: center; gap: 4px;">
                                    <i data-lucide="chevron-left" style="width:12px; height:12px;"></i>
                                    <span>Voltar</span>
                                </button>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" onclick="window.nextTabTourStep()" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.78rem; font-weight: 700; border-radius: var(--radius-xs); cursor: pointer; background: var(--color-brand-primary); color: #ffffff; border: none; display: inline-flex; align-items: center; gap: 4px;">
                                <span>${isLast ? 'Concluir Guia' : 'Próximo'}</span>
                                <i data-lucide="${isLast ? 'check' : 'arrow-right'}" style="width:13px; height:13px;"></i>
                            </button>
                        </div>
                    </div>
                `;
                if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();

                var cardWidth = 340;
                var cardHeight = 180;
                var top = rect.bottom + 14;
                var left = rect.left;

                if (left + cardWidth > window.innerWidth - 20) {
                    left = window.innerWidth - cardWidth - 20;
                }
                if (left < 20) left = 20;

                if (top + cardHeight > window.innerHeight - 20) {
                    top = rect.top - cardHeight - 14;
                }
                if (top < 20) top = 20;

                dom.card.style.top = top + 'px';
                dom.card.style.left = left + 'px';
            }
        }, 120);
    }

    // 4. CONTROLADORES PÚBLICOS DO TOUR DA ABA
    function startTabContextTour(tabId) {
        var targetTab = tabId;
        if (!targetTab) {
            // Obter aba ativa atual
            var activeSection = document.querySelector('.tab-content.active');
            targetTab = activeSection ? activeSection.id : 'dashboard';
        }

        currentActiveTabId = targetTab;
        var steps = TAB_CONTEXTUAL_TOURS[targetTab];
        if (!steps || steps.length === 0) {
            if (typeof global.showToast === 'function') {
                global.showToast('Esta aba não possui tour específico configurado.', 'info');
            }
            return;
        }

        // Trocar de aba se necessário
        if (typeof global.switchTab === 'function') {
            global.switchTab(targetTab);
        }

        currentTabTourSteps = steps;
        isTabTourActive = true;
        renderTabTourStep(0);
    }

    function nextTabTourStep() {
        if (!isTabTourActive) return;
        if (currentTabStepIndex >= currentTabTourSteps.length - 1) {
            closeTabContextTour();
            if (typeof global.showToast === 'function') {
                global.showToast('Guia da aba concluído com sucesso!', 'check');
            }
        } else {
            renderTabTourStep(currentTabStepIndex + 1);
        }
    }

    function prevTabTourStep() {
        if (!isTabTourActive || currentTabStepIndex <= 0) return;
        renderTabTourStep(currentTabStepIndex - 1);
    }

    function closeTabContextTour() {
        isTabTourActive = false;
        var dom = ensureTabTourDOMElements();
        if (dom.backdrop) dom.backdrop.classList.add('hidden');
        if (dom.spotlight) dom.spotlight.classList.add('hidden');
        if (dom.card) dom.card.classList.add('hidden');
    }

    // 5. DROPDOWN DE AJUDA INTELIGENTE NO HEADER
    function toggleHelpTourMenu() {
        var existing = document.getElementById('help-tour-popover-menu');
        if (existing) {
            existing.remove();
            return;
        }

        var btn = document.getElementById('header-help-tour-btn');
        if (!btn) return;

        var activeSection = document.querySelector('.tab-content.active');
        var activeTab = activeSection ? activeSection.id : 'dashboard';

        var tabNameMap = {
            'dashboard': 'Painel Executivo',
            'calculo-ideb': 'Cálculo do IDEB',
            'escolas-panel': 'Escolas da Rede',
            'alunos-panel': 'Estudantes & Turmas',
            'metas-ideb': 'Metas Municipais (PDE)',
            'ideb-comparativo': 'Comparativo Regional',
            'matriz-descritores': 'Matriz & Descritores',
            'cronograma-habilidades': 'Cronograma de Habilidades',
            'criar-avaliacoes': 'Criar Avaliações',
            'sec-criar-avaliacoes': 'Criar Avaliações',
            'aplicacao-provas': 'Aplicação de Provas',
            'sec-aplicacao-provas': 'Aplicação de Provas',
            'gestao-pedagogica': 'Gestão Pedagógica',
            'biblioteca-recursos': 'Biblioteca Pedagógica',
            'admin-panel': 'Área Administrativa'
        };

        var currentName = tabNameMap[activeTab] || 'Aba Atual';

        var popover = document.createElement('div');
        popover.id = 'help-tour-popover-menu';
        popover.className = 'help-tour-popover-menu';
        popover.style.cssText = `
            position: absolute;
            top: 48px;
            right: 0;
            width: 280px;
            background: var(--color-surface-card, #FFFFFF);
            border: 1px solid var(--color-border-subtle, #E5E9F0);
            border-radius: var(--radius-md);
            box-shadow: var(--shadow-dropdown);
            padding: 8px;
            z-index: 150;
            display: flex;
            flex-direction: column;
            gap: 4px;
            animation: tourFadeIn 0.2s ease-out;
        `;

        popover.innerHTML = `
            <div style="padding: 6px 10px 4px 10px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--color-text-muted); letter-spacing: 0.05em;">
                Central de Ajuda & Tours
            </div>
            <button type="button" onclick="window.startTabContextTour('${activeTab}'); window.toggleHelpTourMenu();" style="display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: transparent; border: none; border-radius: var(--radius-sm); text-align: left; cursor: pointer; color: var(--color-text-primary); font-size: 0.82rem; font-weight: 600; transition: background 0.15s ease;" onmouseover="this.style.background='var(--color-surface-subtle)'" onmouseout="this.style.background='transparent'">
                <div style="width: 28px; height: 28px; border-radius: var(--radius-xs); background: var(--color-status-advanced-bg); color: var(--color-brand-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i data-lucide="target" style="width: 16px; height: 16px;"></i>
                </div>
                <div>
                    <div style="font-weight: 700;">Tour Desta Tela</div>
                    <div style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight: 500;">Guia de ${currentName}</div>
                </div>
            </button>
            <button type="button" onclick="if(typeof window.startOnboardingTour==='function') window.startOnboardingTour(); window.toggleHelpTourMenu();" style="display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: transparent; border: none; border-radius: var(--radius-sm); text-align: left; cursor: pointer; color: var(--color-text-primary); font-size: 0.82rem; font-weight: 600; transition: background 0.15s ease;" onmouseover="this.style.background='var(--color-surface-subtle)'" onmouseout="this.style.background='transparent'">
                <div style="width: 28px; height: 28px; border-radius: var(--radius-xs); background: var(--color-status-advanced-bg); color: var(--color-brand-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i data-lucide="compass" style="width: 16px; height: 16px;"></i>
                </div>
                <div>
                    <div style="font-weight: 700;">Tour Geral do Sistema</div>
                    <div style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight: 500;">Visão das 12 abas principais</div>
                </div>
            </button>
            <div style="height: 1px; background: var(--color-border-subtle); margin: 2px 0;"></div>
            <button type="button" onclick="if(typeof window.switchTab==='function') window.switchTab('doc-tecnica'); window.toggleHelpTourMenu();" style="display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: transparent; border: none; border-radius: var(--radius-sm); text-align: left; cursor: pointer; color: var(--color-text-primary); font-size: 0.82rem; font-weight: 600; transition: background 0.15s ease;" onmouseover="this.style.background='var(--color-surface-subtle)'" onmouseout="this.style.background='transparent'">
                <div style="width: 28px; height: 28px; border-radius: var(--radius-xs); background: var(--color-surface-subtle); color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    <i data-lucide="book-open" style="width: 16px; height: 16px;"></i>
                </div>
                <div>
                    <div style="font-weight: 700;">Manuais &amp; Documentação</div>
                    <div style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight: 500;">Notas Técnicas INEP / MEC</div>
                </div>
            </button>
        `;

        btn.parentElement.style.position = 'relative';
        btn.parentElement.appendChild(popover);
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();

        // Fechar ao clicar fora
        setTimeout(function() {
            function handleClickOutside(e) {
                if (!popover.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
                    popover.remove();
                    document.removeEventListener('click', handleClickOutside);
                }
            }
            document.addEventListener('click', handleClickOutside);
        }, 50);
    }

    // 6. EXPORTAÇÃO GLOBAL
    global.TAB_CONTEXTUAL_TOURS = TAB_CONTEXTUAL_TOURS;
    global.startTabContextTour = startTabContextTour;
    global.nextTabTourStep = nextTabTourStep;
    global.prevTabTourStep = prevTabTourStep;
    global.closeTabContextTour = closeTabContextTour;
    global.toggleHelpTourMenu = toggleHelpTourMenu;

})(typeof window !== 'undefined' ? window : global);
