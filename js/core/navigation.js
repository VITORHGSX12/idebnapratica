// =========================================================================
// NAVIGATION & ROUTING MODULE
// Responsabilidade: Roteador mestre de abas (SPA), Sidebar dinâmica e navegação
// =========================================================================

(function(global) {
    'use strict';

    // Pilha de histórico de navegação
    global.navigationHistory = global.navigationHistory || ['dashboard'];

    // Mapeamento de aliases de abas para IDs de seções do DOM
    var TAB_MAP = {
        'dashboard': 'dashboard',
        'escolas-panel': 'escolas-panel',
        'alunos-panel': 'alunos-panel',
        'metas-ideb': 'metas-ideb',
        'ideb-comparativo': 'ideb-comparativo',
        'matriz-descritores': 'matriz-descritores',
        'cronograma-habilidades': 'cronograma-habilidades',
        'sec-criar-avaliacoes': 'sec-criar-avaliacoes',
        'criar-avaliacoes': 'sec-criar-avaliacoes',
        'sec-aplicacao-provas': 'sec-aplicacao-provas',
        'aplicacao-provas': 'sec-aplicacao-provas',
        'banco-questoes': 'banco-questoes',
        'questions': 'banco-questoes',
        'relatorios-monitoramento': 'relatorios-monitoramento',
        'ai-playground': 'relatorios-monitoramento',
        'gestao-pedagogica': 'gestao-pedagogica',
        'biblioteca-recursos': 'biblioteca-recursos',
        'doc-tecnica': 'doc-tecnica',
        'admin-panel': 'admin-panel'
    };

    /**
     * Alterna a aba visível na aplicação com suporte a histórico e renderização sob demanda
     * @param {string} targetTab ID ou alias da aba
     * @param {boolean} [trackHistory=true] Se deve registrar na pilha de histórico
     */
    function switchTab(targetTab, trackHistory) {
        if (trackHistory === undefined) trackHistory = true;
        var safeTarget = (targetTab || 'dashboard').toString().trim();
        var resolvedId = TAB_MAP[safeTarget] || safeTarget;

        try {
            try { 
                localStorage.setItem('lastActiveTab', resolvedId); 
            } catch(err) {}

            // Atualiza pilha de histórico de navegação
            if (trackHistory !== false) {
                if (!global.navigationHistory) global.navigationHistory = ['dashboard'];
                var last = global.navigationHistory[global.navigationHistory.length - 1];
                if (last !== resolvedId) {
                    global.navigationHistory.push(resolvedId);
                }
            }

            // Fecha drawer mobile ao navegar
            var appContainer = document.querySelector('.app-container') || document.body;
            if (appContainer && appContainer.classList.contains('mobile-sidebar-open')) {
                appContainer.classList.remove('mobile-sidebar-open');
                document.body.classList.remove('mobile-sidebar-open');
                document.body.style.overflow = '';
                var backdrop = document.getElementById('mobile-sidebar-backdrop');
                if (backdrop) backdrop.classList.remove('active');
            }

            // Reseta scroll para o topo
            var mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;
            if (typeof window.scrollTo === 'function') window.scrollTo(0, 0);

            // Fecha qualquer modal ativo ao trocar de rota/aba
            var openModals = document.querySelectorAll('.modal-overlay');
            openModals.forEach(function(modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            });

            // 1. Ocultar todas as seções .tab-content
            var allSections = document.querySelectorAll('.tab-content');
            allSections.forEach(function(sec) {
                sec.classList.remove('active');
                sec.classList.add('hidden');
                sec.style.display = 'none';
            });

            // 2. Exibir exclusivamente a seção correspondente
            var targetEl = document.getElementById(resolvedId) || document.getElementById(safeTarget);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                targetEl.classList.add('active');
                targetEl.style.display = 'block';
            } else {
                console.warn('[Router Warning] Section element missing for ID:', resolvedId, '- Falling back to Dashboard');
                var dashEl = document.getElementById('dashboard');
                if (dashEl) {
                    dashEl.classList.remove('hidden');
                    dashEl.classList.add('active');
                    dashEl.style.display = 'block';
                }
            }

            // 3. Atualizar realce visual nos menus da Sidebar e Título do Header
            var pageTitle = document.getElementById('page-title');
            var pageSubtitle = document.getElementById('page-subtitle');
            if (pageTitle) pageTitle.textContent = 'IDEB na Prática';
            
            var TAB_SUBTITLES = {
                'dashboard': 'Visão geral do desempenho pedagógico e estatísticas operacionais da rede.',
                'escolas-panel': 'Painel geral de escolas, total de alunos cadastrados e estatísticas de proficiência de exames externos.',
                'alunos-panel': 'Consulta de fichas cadastrais completas, dados de contato e acessibilidade da rede.',
                'metas-ideb': 'Acompanhamento de metas pactuadas e planos de ação direcionados para escolas com desvio de aprendizagem.',
                'ideb-comparativo': 'Resultados históricos oficiais e metas projetadas do IDEB por estados e municípios (Fonte: MEC / INEP).',
                'matriz-descritores': 'Lista de descritores cognitivos de competências do SAEB e do SEAMA.',
                'cronograma-habilidades': 'Planejamento e pactuação semanal de habilidades (SEMED ↔ Docentes) para acelerar a recomposição de aprendizagem.',
                'sec-criar-avaliacoes': 'Criação de instrumentos pedagógicos focados na preparação para o IDEB (SAEB) e SEAMA.',
                'criar-avaliacoes': 'Criação de instrumentos pedagógicos focados na preparação para o IDEB (SAEB) e SEAMA.',
                'sec-aplicacao-provas': 'Monitoramento da presença dos alunos e digitação de cartões-resposta em tempo real.',
                'aplicacao-provas': 'Monitoramento da presença dos alunos e digitação de cartões-resposta em tempo real.',
                'banco-questoes': 'Pesquisa avançada, montagem de itens de teste e exportação de exames com descritores e habilidades.',
                'questions': 'Pesquisa avançada, montagem de itens de teste e exportação de exames com descritores e habilidades.',
                'relatorios-monitoramento': 'Acompanhamento longitudinal de alunos e geração de diagnósticos pedagógicos focados em avaliações externas.',
                'ai-playground': 'Acompanhamento longitudinal de alunos e geração de diagnósticos pedagógicos focados em avaliações externas.',
                'gestao-pedagogica': 'Acompanhamento de planos de ação pedagógica e alertas preditivos de desvios de metas.',
                'doc-tecnica': 'Especificação técnica dos módulos, modelo relacional ERD, script DDL SQL e APIs do sistema.',
                'biblioteca-recursos': 'Acervo oficial da SEMED Gonçalves Dias - MA. Simulados, matrizes e provas formatadas para impressão A4.',
                'admin-panel': 'Gestão de usuários (RBAC), controle de acessos da SEMED e ferramentas de manutenção do sistema.'
            };

            if (pageSubtitle && (TAB_SUBTITLES[resolvedId] || TAB_SUBTITLES[safeTarget])) {
                pageSubtitle.textContent = TAB_SUBTITLES[resolvedId] || TAB_SUBTITLES[safeTarget];
            }

            var menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(function(item) {
                var dt = item.getAttribute('data-target');
                if (dt === resolvedId || dt === safeTarget || TAB_MAP[dt] === resolvedId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // 4. Executar o renderizador sob demanda da aba selecionada
            if (resolvedId === 'dashboard' || resolvedId === 'sec-dashboard') {
                if (typeof global.renderDashboardComplete === 'function') global.renderDashboardComplete();
            } else if (resolvedId === 'escolas-panel') {
                if (typeof global.renderDbSchools === 'function') global.renderDbSchools();
            } else if (resolvedId === 'alunos-panel') {
                if (typeof global.renderDbStudents === 'function') global.renderDbStudents();
            } else if (resolvedId === 'metas-ideb') {
                if (typeof global.populateIdebGoalsTable === 'function') global.populateIdebGoalsTable();
            } else if (resolvedId === 'ideb-comparativo') {
                if (typeof global.initIdebCitySelector === 'function') global.initIdebCitySelector();
                if (typeof global.updateIdebComparativoView === 'function') global.updateIdebComparativoView();
            } else if (resolvedId === 'matriz-descritores') {
                if (typeof global.renderReferenceMatrix === 'function') global.renderReferenceMatrix();
                if (typeof global.renderBnccSkillsTable === 'function') global.renderBnccSkillsTable();
            } else if (resolvedId === 'cronograma-habilidades') {
                if (typeof global.render7ColCalendar === 'function') global.render7ColCalendar();
                if (typeof global.renderTeacherWeeklyChecklist === 'function') global.renderTeacherWeeklyChecklist();
            } else if (resolvedId === 'sec-criar-avaliacoes') {
                if (typeof global.populateWizardSchools === 'function') global.populateWizardSchools();
            } else if (resolvedId === 'sec-aplicacao-provas') {
                if (typeof global.renderEventsListForPrinting === 'function') global.renderEventsListForPrinting();
            } else if (resolvedId === 'banco-questoes') {
                if (typeof global.renderQuestions === 'function') global.renderQuestions();
            } else if (resolvedId === 'relatorios-monitoramento') {
                if (typeof global.runDiagnosticoCalculation === 'function') global.runDiagnosticoCalculation();
                if (typeof global.renderAiGenDescriptors === 'function') global.renderAiGenDescriptors();
            } else if (resolvedId === 'gestao-pedagogica') {
                if (typeof global.renderPedagogicInterventions === 'function') global.renderPedagogicInterventions();
            } else if (resolvedId === 'biblioteca-recursos') {
                if (typeof global.renderPedagogicLibrary === 'function') global.renderPedagogicLibrary();
            } else if (resolvedId === 'admin-panel') {
                if (typeof global.renderUsersList === 'function') global.renderUsersList();
                if (typeof global.loadUsersList === 'function') global.loadUsersList();
            }

            if (typeof global.safeCreateIcons === 'function') {
                global.safeCreateIcons();
            }
        } catch(e) {
            console.error('[Router Error]', e);
        }
    }

    /**
     * Renderiza o menu lateral completo para SEMED e Administradores
     * @param {HTMLElement} sidebarMenu 
     * @param {string} currentTab 
     * @param {boolean} isAdmin 
     */
    function renderFullNetworkSidebar(sidebarMenu, currentTab, isAdmin) {
        if (!sidebarMenu) return;
        sidebarMenu.innerHTML = `
            <!-- SEÇÃO 1: VISÃO GERAL -->
            <div class="menu-group" id="menu-group-gestao">
                <span class="menu-section-label">VISÃO GERAL</span>
                <a href="javascript:void(0)" onclick="switchTab('dashboard'); return false;" class="menu-item ${currentTab === 'dashboard' ? 'active' : ''}" data-target="dashboard" data-tooltip="Painel Executivo">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                    <span>Painel Executivo</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('escolas-panel'); return false;" class="menu-item ${currentTab === 'escolas-panel' ? 'active' : ''}" data-target="escolas-panel" data-tooltip="Escolas da Rede">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/></svg>
                    <span>Escolas da Rede</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('alunos-panel'); return false;" class="menu-item ${currentTab === 'alunos-panel' ? 'active' : ''}" data-target="alunos-panel" data-tooltip="Estudantes &amp; Turmas">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>Estudantes &amp; Turmas</span>
                    <span class="badge badge-counter" id="badge-count-students">1.7k</span>
                </a>
            </div>

            <!-- SEÇÃO 2: PLANEJAMENTO -->
            <div class="menu-group" id="menu-group-planejamento">
                <span class="menu-section-label">PLANEJAMENTO</span>
                <a href="javascript:void(0)" onclick="switchTab('metas-ideb'); return false;" class="menu-item ${currentTab === 'metas-ideb' ? 'active' : ''}" data-target="metas-ideb" data-tooltip="Metas Municipais (PDE)">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                    <span>Metas Municipais (PDE)</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('ideb-comparativo'); return false;" class="menu-item ${currentTab === 'ideb-comparativo' ? 'active' : ''}" data-target="ideb-comparativo" data-tooltip="Comparativo Regional">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                    <span>Comparativo Regional</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('matriz-descritores'); return false;" class="menu-item ${currentTab === 'matriz-descritores' ? 'active' : ''}" data-target="matriz-descritores" data-tooltip="Matriz &amp; Descritores">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>
                    <span>Matriz &amp; Descritores</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('cronograma-habilidades'); return false;" class="menu-item ${currentTab === 'cronograma-habilidades' ? 'active' : ''}" data-target="cronograma-habilidades" data-tooltip="Cronograma de Habilidades">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>
                    <span>Cronograma de Habilidades</span>
                    <span class="badge badge-counter">Semanal</span>
                </a>
            </div>

            <!-- SEÇÃO 3: AVALIAÇÕES -->
            <div class="menu-group" id="menu-group-avaliacoes">
                <span class="menu-section-label">AVALIAÇÕES</span>
                <a href="javascript:void(0)" onclick="switchTab('sec-criar-avaliacoes'); return false;" class="menu-item ${currentTab === 'sec-criar-avaliacoes' ? 'active' : ''}" data-target="sec-criar-avaliacoes" data-tooltip="Criar Avaliações">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M12 14v4"/><path d="M10 16h4"/></svg>
                    <span>Criar Avaliações</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('sec-aplicacao-provas'); return false;" class="menu-item ${currentTab === 'sec-aplicacao-provas' ? 'active' : ''}" data-target="sec-aplicacao-provas" data-tooltip="Aplicação de Provas">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                    <span>Aplicação de Provas</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('banco-questoes'); return false;" class="menu-item ${currentTab === 'banco-questoes' ? 'active' : ''}" data-target="banco-questoes" data-tooltip="Banco de Questões">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="13" r="1"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/></svg>
                    <span>Banco de Questões</span>
                    <span class="badge badge-counter" id="badge-count-questions">12</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('relatorios-monitoramento'); return false;" class="menu-item ${currentTab === 'relatorios-monitoramento' ? 'active' : ''}" data-target="relatorios-monitoramento" data-tooltip="Relatórios &amp; Monitoramento">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                    <span>Relatórios &amp; Monitoramento</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('gestao-pedagogica'); return false;" class="menu-item ${currentTab === 'gestao-pedagogica' ? 'active' : ''}" data-target="gestao-pedagogica" data-tooltip="Gestão Pedagógica">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M12 18v4"/><path d="M8 22h8"/></svg>
                    <span>Gestão Pedagógica</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('biblioteca-recursos'); return false;" class="menu-item ${currentTab === 'biblioteca-recursos' ? 'active' : ''}" data-target="biblioteca-recursos" data-tooltip="Biblioteca Pedagógica">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                    <span>Biblioteca Pedagógica</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('doc-tecnica'); return false;" class="menu-item ${currentTab === 'doc-tecnica' ? 'active' : ''}" data-target="doc-tecnica" data-tooltip="Documentação Técnica">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span>Documentação Técnica</span>
                </a>
                <a href="javascript:void(0)" onclick="switchTab('admin-panel'); return false;" class="menu-item ${currentTab === 'admin-panel' ? 'active' : ''}" data-target="admin-panel" data-tooltip="Área Administrativa">
                    <div class="menu-active-indicator"></div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                    <span>Área Administrativa</span>
                </a>
            </div>
        `;
    }

    /**
     * Atualiza a visibilidade e opções dos menus com base no perfil autenticado
     * // NOTA: Esta verificação é apenas cosmética. A segurança real está no servidor.
     * // SECURITY FIX: [Client-Side Auth]
     */
    function updateMenuVisibilityByRole() {
        var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        var userEscola = sessionStorage.getItem('userEscola') || 'UI JOSE CORREA LIMA';
        var userTurma = sessionStorage.getItem('userTurma') || '5º Ano A';

        var activeNetworkLabel = document.getElementById('sidebar-active-network-label');
        var userProfileName = document.querySelector('.user-profile .user-name');
        var userProfileRole = document.querySelector('.user-profile .user-role');
        var userProfileAvatar = document.querySelector('.user-profile .avatar');
        var sidebarMenu = document.querySelector('.sidebar-menu');

        if (!sidebarMenu) return;

        var currentTab = localStorage.getItem('lastActiveTab') || 'dashboard';

        // 1. VISÃO DO PROFESSOR
        if (userRole === 'Professor' || userRole === 'Professor AEE') {
            if (activeNetworkLabel) activeNetworkLabel.textContent = '👨‍🏫 ' + userTurma + ' • ' + userEscola;
            if (userProfileName) userProfileName.textContent = sessionStorage.getItem('userName') || 'Prof. Carlos Eduardo';
            if (userProfileRole) userProfileRole.textContent = 'Visão de Docente • ' + userTurma;
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'PR';
                userProfileAvatar.style.backgroundColor = '#2563eb';
            }

            sidebarMenu.innerHTML = `
                <div class="menu-group">
                    <span class="menu-group-header" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; margin-left: 12px; display: block; margin-bottom: 8px;">Diagnóstico & Turma</span>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <a href="javascript:void(0)" onclick="switchTab('dashboard'); return false;" class="menu-item ${currentTab === 'dashboard' ? 'active' : ''}" data-target="dashboard">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                            <span>Painel da Turma</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('alunos-panel'); return false;" class="menu-item ${currentTab === 'alunos-panel' ? 'active' : ''}" data-target="alunos-panel">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            <span>Diagnóstico por Aluno</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('cronograma-habilidades'); return false;" class="menu-item ${currentTab === 'cronograma-habilidades' ? 'active' : ''}" data-target="cronograma-habilidades">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
                            <span>Cronograma & Plano de Aulas</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('matriz-descritores'); return false;" class="menu-item ${currentTab === 'matriz-descritores' ? 'active' : ''}" data-target="matriz-descritores">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>
                            <span>Habilidades a Recompor</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('sec-aplicacao-provas'); return false;" class="menu-item ${currentTab === 'sec-aplicacao-provas' || currentTab === 'aplicacao-provas' ? 'active' : ''}" data-target="aplicacao-provas">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                            <span>Desempenho em Simulados</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('biblioteca-recursos'); return false;" class="menu-item ${currentTab === 'biblioteca-recursos' ? 'active' : ''}" data-target="biblioteca-recursos">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
                            <span>Recursos & Materiais</span>
                        </a>
                    </div>
                </div>
            `;
        } 
        // 2. VISÃO DO DIRETOR ESCOLAR
        else if (userRole === 'Diretor Escola') {
            if (activeNetworkLabel) activeNetworkLabel.textContent = '🏫 ' + userEscola + ' (INEP 21128723)';
            if (userProfileName) userProfileName.textContent = 'Profa. Antonia Silva';
            if (userProfileRole) userProfileRole.textContent = 'Visão de Direção • ' + userEscola;
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'DE';
                userProfileAvatar.style.backgroundColor = '#059669';
            }

            sidebarMenu.innerHTML = `
                <div class="menu-group">
                    <span class="menu-group-header" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 700; margin-left: 12px; display: block; margin-bottom: 8px;">Gestão da Unidade Escolar</span>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <a href="javascript:void(0)" onclick="switchTab('dashboard'); return false;" class="menu-item ${currentTab === 'dashboard' ? 'active' : ''}" data-target="dashboard">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                            <span>Monitoramento da Escola</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('escolas-panel'); return false;" class="menu-item ${currentTab === 'escolas-panel' ? 'active' : ''}" data-target="escolas-panel">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/></svg>
                            <span>Desempenho por Turma</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('relatorios-monitoramento'); return false;" class="menu-item ${currentTab === 'relatorios-monitoramento' ? 'active' : ''}" data-target="relatorios-monitoramento">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                            <span>Evolução dos Simulados</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('matriz-descritores'); return false;" class="menu-item ${currentTab === 'matriz-descritores' ? 'active' : ''}" data-target="matriz-descritores">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>
                            <span>Matriz de Descritores (BNCC)</span>
                        </a>
                        <a href="javascript:void(0)" onclick="switchTab('metas-ideb'); return false;" class="menu-item ${currentTab === 'metas-ideb' ? 'active' : ''}" data-target="metas-ideb">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                            <span>Acompanhamento de Metas (PDE)</span>
                        </a>
                    </div>
                </div>
            `;
        } 
        // 3. MASTER ADMIN
        else if (userRole === 'Master Admin') {
            if (activeNetworkLabel) activeNetworkLabel.textContent = '⚙️ Administração TI / DPO';
            if (userProfileName) userProfileName.textContent = 'Administrador TI';
            if (userProfileRole) userProfileRole.textContent = 'DPO & Infraestrutura';
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'AD';
                userProfileAvatar.style.backgroundColor = '#e11d48';
            }
            renderFullNetworkSidebar(sidebarMenu, currentTab, true);
        } 
        // 4. SEMED (Gestor da Rede)
        else {
            if (activeNetworkLabel) activeNetworkLabel.textContent = '🏛️ SEMED Gonçalves Dias - MA';
            if (userProfileName) userProfileName.textContent = 'Secretaria de Educação';
            if (userProfileRole) userProfileRole.textContent = 'Gestão Executiva SEMED';
            if (userProfileAvatar) {
                userProfileAvatar.textContent = 'SM';
                userProfileAvatar.style.backgroundColor = '#9333ea';
            }
            renderFullNetworkSidebar(sidebarMenu, currentTab, false);
        }

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }
    }

    /**
     * Alternador de colapso da barra lateral (desktop)
     */
    function toggleSidebarCollapse() {
        document.body.classList.toggle('collapsed-sidebar');
        var isCollapsed = document.body.classList.contains('collapsed-sidebar');
        try { 
            localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false'); 
        } catch(e) {}
        var svg = document.getElementById('sidebar-toggle-svg');
        if (svg) {
            svg.style.transform = isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }

    /**
     * Filtro em tempo real de busca no menu da Sidebar
     */
    function filterSidebarMenuItems(query) {
        var q = (query || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        var items = document.querySelectorAll('.sidebar-menu .menu-item');
        var dividers = document.querySelectorAll('.sidebar-menu .sidebar-divider');
        var labels = document.querySelectorAll('.sidebar-menu .menu-section-label');
        
        items.forEach(function(item) {
            var text = (item.textContent || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var tooltip = (item.getAttribute('data-tooltip') || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!q || text.includes(q) || tooltip.includes(q)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });

        // Oculta divisores e rótulos de seção se o usuário estiver buscando ativamente
        dividers.forEach(function(div) {
            div.style.display = q ? 'none' : '';
        });
        labels.forEach(function(lbl) {
            lbl.style.display = q ? 'none' : '';
        });
    }

    /**
     * Alternador da barra lateral para dispositivos móveis (drawer)
     */
    function toggleMobileSidebar(forceState) {
        var appContainer = document.querySelector('.app-container') || document.body;
        var backdrop = document.getElementById('mobile-sidebar-backdrop');
        var isOpen = appContainer.classList.contains('mobile-sidebar-open') || document.body.classList.contains('mobile-sidebar-open');

        if (typeof forceState === 'boolean') {
            isOpen = !forceState;
        }

        if (!isOpen) {
            appContainer.classList.add('mobile-sidebar-open');
            document.body.classList.add('mobile-sidebar-open');
            document.body.style.overflow = 'hidden';
            if (backdrop) backdrop.classList.add('active');
        } else {
            appContainer.classList.remove('mobile-sidebar-open');
            document.body.classList.remove('mobile-sidebar-open');
            document.body.style.overflow = '';
            if (backdrop) backdrop.classList.remove('active');
        }
    }

    /**
     * Fecha a sidebar mobile
     */
    function closeMobileSidebar() {
        toggleMobileSidebar(false);
    }

    /**
     * Tratamento global de navegação de voltar inteligente
     */
    function handleGlobalBackNavigation() {
        var diaryView = document.getElementById('class-diary-view');
        var schoolClassesView = document.getElementById('school-classes-table-view');
        var userProfileView = document.getElementById('user-profile-view');

        if (diaryView && !diaryView.classList.contains('hidden')) {
            diaryView.classList.add('hidden');
            if (schoolClassesView) schoolClassesView.classList.remove('hidden');
            return;
        }

        if (schoolClassesView && !schoolClassesView.classList.contains('hidden')) {
            schoolClassesView.classList.add('hidden');
            var overview = document.getElementById('schools-overview-container');
            if (overview) overview.classList.remove('hidden');
            return;
        }

        if (userProfileView && !userProfileView.classList.contains('hidden')) {
            userProfileView.classList.add('hidden');
            var usersList = document.getElementById('users-list-view');
            if (usersList) usersList.classList.remove('hidden');
            return;
        }

        // Caso haja histórico anterior, retorna à aba anterior
        if (global.navigationHistory && global.navigationHistory.length > 1) {
            global.navigationHistory.pop(); // remove a atual
            var prevTab = global.navigationHistory.pop(); // pega a anterior
            switchTab(prevTab, true);
            return;
        }

        switchTab('dashboard');
    }

    /**
     * Vincula listeners de navegação
     */
    function initNavigationEventListeners() {
        document.addEventListener('click', function(e) {
            var targetItem = e.target.closest('.menu-item');
            if (targetItem && targetItem.getAttribute('data-target')) {
                e.preventDefault();
                var targetTab = targetItem.getAttribute('data-target');
                switchTab(targetTab);
            }
        });
    }

    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNavigationEventListeners);
    } else {
        initNavigationEventListeners();
    }

    // Exposição global
    global.switchTab = switchTab;
    global.switchMainTab = switchTab;
    global.showTab = switchTab;
    global.navigateToTab = switchTab;
    global.renderFullNetworkSidebar = renderFullNetworkSidebar;
    global.updateMenuVisibilityByRole = updateMenuVisibilityByRole;
    global.toggleSidebarCollapse = toggleSidebarCollapse;
    global.filterSidebarMenuItems = filterSidebarMenuItems;
    global.toggleMobileSidebar = toggleMobileSidebar;
    global.closeMobileSidebar = closeMobileSidebar;
    global.handleGlobalBackNavigation = handleGlobalBackNavigation;

})(typeof window !== 'undefined' ? window : this);
