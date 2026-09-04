/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — PLATAFORMA MUNICIPAL IDEB NA PRÁTICA
 * Arquivo: app.js (Orquestrador Raiz da Aplicação)
 * Linhas: < 350 linhas
 * Descrição: Inicialização do ciclo de vida da aplicação, orquestração de rotas,
 *            resolução multi-tenant por subdomínio e pontes globais entre módulos.
 * ============================================================================
 */

if (typeof window !== 'undefined' && typeof global === 'undefined') {
    window.global = window;
}

// ============================================================================
// 1. RESOLUÇÃO MULTI-TENANT & CLIENTE HTTP COM INJEÇÃO AUTOMÁTICA DE CABEÇALHOS
// ============================================================================

function getTenantSlugFromHostname() {
    if (typeof window === 'undefined') return 'gd';
    var host = window.location.hostname;
    var parts = host.split('.');

    if (host === 'localhost' || host === '127.0.0.1' || parts.length < 3) {
        var params = new URLSearchParams(window.location.search);
        return params.get('tenant') || params.get('tenantId') || 'gd';
    }
    return parts[0];
}

var TENANT_SLUG = getTenantSlugFromHostname();
if (typeof window !== 'undefined') {
    window.TENANT_SLUG = TENANT_SLUG;
}

async function apiFetch(path, options = {}) {
    var token = (typeof safeStorage !== 'undefined' ? safeStorage.getItem('authToken') : null) || 
                (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('authToken') || (sessionStorage.getItem('userEmail') ? btoa(sessionStorage.getItem('userEmail')) : null)) : null);

    var headers = {
        'Content-Type': 'application/json',
        'x-tenant-slug': TENANT_SLUG,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
    };

    var baseUrl = (typeof window !== 'undefined' && window.location && window.location.port === '8081') ? 'http://localhost:8080' : '';
    var fullUrl = (path.startsWith('/') && baseUrl) ? `${baseUrl}${path}` : path;

    return fetch(fullUrl, { ...options, headers });
}

if (typeof window !== 'undefined') {
    window.apiFetch = apiFetch;
}

// ============================================================================
// 2. ESTADO GLOBAL DE CONTEXTO E BRIDGES DE COMPATIBILIDADE
// ============================================================================

var activeDiarySchool = 'UI JOSE CORREA LIMA';
var activeDiaryClass = '5º Ano A';

if (typeof window !== 'undefined') {
    window.activeDiarySchool = activeDiarySchool;
    window.activeDiaryClass = activeDiaryClass;
    window.getActiveDiarySchool = function() { return window.activeDiarySchool || 'UI JOSE CORREA LIMA'; };
    window.setActiveDiarySchool = function(s) { window.activeDiarySchool = s || 'UI JOSE CORREA LIMA'; activeDiarySchool = window.activeDiarySchool; };
    
    // Bridge de Navegação Canônica
    window.navigateToTab = function(targetTab) {
        if (!targetTab) return;
        if (typeof window.switchTab === 'function') {
            return window.switchTab(targetTab);
        }
        if (typeof pushNavigationHistory === 'function') {
            pushNavigationHistory(targetTab);
        }
        
        // Ativar classe menu-item
        document.querySelectorAll('.menu-item').forEach(function(i) {
            if (i.getAttribute('data-target') === targetTab || i.getAttribute('href') === '#' + targetTab) {
                i.classList.add('active');
            } else {
                i.classList.remove('active');
            }
        });

        // Ativar view content
        document.querySelectorAll('.tab-content').forEach(function(tab) {
            tab.classList.remove('active');
        });
        var activeTab = document.getElementById(targetTab);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Atualizar títulos do cabeçalho
        var pageTitle = document.getElementById('page-title');
        var pageSubtitle = document.getElementById('page-subtitle');
        if (pageTitle) pageTitle.textContent = 'IDEB na Prática';
        var meta = typeof window.getTabMeta === 'function' ? window.getTabMeta(targetTab) : null;
        if (meta && pageSubtitle) {
            pageSubtitle.textContent = meta.subtitle;
        }

        // Executar hooks de ciclo de vida específicos da aba
        triggerTabLifecycleHooks(targetTab);
        if (typeof safeCreateIcons === 'function') safeCreateIcons();
    };
}

/**
 * Strategy Map de hooks de ciclo de vida das abas
 */
var TAB_LIFECYCLE_HOOKS = {
    'dashboard': function() {
        if (typeof renderDashboardComplete === 'function') renderDashboardComplete();
        if (typeof recalculateNetworkStats === 'function') recalculateNetworkStats();
        if (typeof renderHeatmapGrid === 'function') renderHeatmapGrid();
    },
    'doc-tecnica': function() {
        if (typeof renderMermaidDiagram === 'function') renderMermaidDiagram();
    },
    'cronograma-habilidades': function() {
        if (typeof renderSkillsSchedule === 'function') renderSkillsSchedule();
    },
    'gestao-pedagogica': function() {
        if (typeof renderSaebProficiencyDashboard === 'function') renderSaebProficiencyDashboard();
        if (typeof initPedagogicPlansSubtab === 'function') initPedagogicPlansSubtab();
        if (typeof renderSaebOficialComparativoTable === 'function') renderSaebOficialComparativoTable();
        if (typeof renderRiskGoalsTable === 'function') renderRiskGoalsTable();
    },
    'ideb-comparativo': function() {
        if (typeof updateIdebComparativoView === 'function') updateIdebComparativoView();
    },
    'ai-playground': function() {
        if (typeof populateAiSelectors === 'function') populateAiSelectors();
    },
    'alunos-panel': function() {
        if (typeof initAlunosTab === 'function') initAlunosTab();
        if (typeof renderDbStudents === 'function') renderDbStudents();
    },
    'escolas-panel': function() {
        if (typeof renderDbSchools === 'function') renderDbSchools();
    },
    'biblioteca-recursos': function() {
        if (typeof renderPedagogicLibrary === 'function') renderPedagogicLibrary();
    },
    'criar-avaliacoes': function() {
        if (typeof renderEventosTable === 'function') renderEventosTable();
        if (typeof populateWizardSchools === 'function') populateWizardSchools();
        if (typeof initAvaliacoesSubtabs === 'function') initAvaliacoesSubtabs();
        if (typeof switchAvaliacoesSubtab === 'function') switchAvaliacoesSubtab('criar-evento-sub');
    },
    'sec-criar-avaliacoes': function() {
        if (typeof renderEventosTable === 'function') renderEventosTable();
        if (typeof populateWizardSchools === 'function') populateWizardSchools();
        if (typeof initAvaliacoesSubtabs === 'function') initAvaliacoesSubtabs();
        if (typeof switchAvaliacoesSubtab === 'function') switchAvaliacoesSubtab('criar-evento-sub');
    },
    'aplicacao-provas': function() {
        if (typeof switchAvaliacoesSubtab === 'function') switchAvaliacoesSubtab('lancar-notas-sub');
        if (typeof initEspelhoSelectors === 'function') initEspelhoSelectors();
    },
    'sec-aplicacao-provas': function() {
        if (typeof switchAvaliacoesSubtab === 'function') switchAvaliacoesSubtab('lancar-notas-sub');
        if (typeof initEspelhoSelectors === 'function') initEspelhoSelectors();
    },
    'matriz-descritores': function() {
        if (typeof renderReferenceMatrix === 'function') renderReferenceMatrix();
    },
    'questions': function() {
        if (typeof renderQuestions === 'function') renderQuestions();
        if (typeof initQuestionsListModule === 'function') initQuestionsListModule();
        if (typeof populateQuestionCreatorDropdowns === 'function') populateQuestionCreatorDropdowns();
    },
    'banco-questoes': function() {
        if (typeof renderQuestions === 'function') renderQuestions();
        if (typeof initQuestionsListModule === 'function') initQuestionsListModule();
        if (typeof populateQuestionCreatorDropdowns === 'function') populateQuestionCreatorDropdowns();
    },
    'metas-ideb': function() {
        if (typeof populateIdebGoalsTable === 'function') populateIdebGoalsTable();
    },
    'admin-panel': function() {
        if (typeof loadUsersList === 'function') loadUsersList();
    }
};

/**
 * Dispara os renderizadores de módulo apropriados ao entrar na aba
 */
function triggerTabLifecycleHooks(targetTab) {
    var hook = TAB_LIFECYCLE_HOOKS[targetTab];
    if (typeof hook === 'function') {
        hook();
    }
}

// ============================================================================
// 3. LISTENERS GLOBAIS DE ENTRADA (TECLA ENTER EM PESQUISAS)
// ============================================================================

document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        var activeEl = document.activeElement;
        if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) {
            if (activeEl.id === 'db-school-search') {
                if (typeof renderDbSchools === 'function') renderDbSchools();
            } else if (activeEl.id === 'ideb-city-search') {
                if (typeof updateIdebComparativoView === 'function') updateIdebComparativoView();
            } else if (activeEl.id === 'classes-table-search-input') {
                if (typeof renderSchoolClassesTable === 'function') renderSchoolClassesTable();
            } else if (activeEl.id === 'student-search') {
                if (typeof renderDbStudents === 'function') renderDbStudents();
            } else if (activeEl.id === 'search-questions-input') {
                if (typeof renderQuestionsList === 'function') renderQuestionsList();
            }
        }
    }
});

// ============================================================================
// 4. BOOTSTRAP DA APLICAÇÃO NO CARREGAMENTO DO DOM
// ============================================================================

function initAppBootstrap() {
    console.log('🚀 Inicializando IDEB na Prática SaaS (Tenant: ' + TENANT_SLUG + ')');

    // 1. Inicializar ícones Lucide
    if (typeof safeCreateIcons === 'function') safeCreateIcons();

    // 2. Inicializar menus e histórico
    if (typeof bindSidebarMenuEvents === 'function') bindSidebarMenuEvents();
    if (typeof setupSidebarAndNavigation === 'function') setupSidebarAndNavigation();

    // 3. Verificar login persistente
    var logged = false;
    try {
        logged = localStorage.getItem('isLoggedIn') === 'true';
    } catch(e) {}

    if (logged) {
        var userEmail = localStorage.getItem('userEmail') || 'gestor@municipio.gov.br';
        var userProfile = localStorage.getItem('userProfile') || 'admin';
        var lastTab = localStorage.getItem('lastActiveTab') || 'dashboard';

        var loginSection = document.getElementById('login-section');
        var mainAppSection = document.getElementById('main-app-section');
        if (loginSection) loginSection.classList.add('hidden');
        if (mainAppSection) mainAppSection.classList.remove('hidden');

        var userEmailEl = document.getElementById('user-display-email');
        if (userEmailEl) userEmailEl.textContent = userEmail;

        setTimeout(function() {
            window.navigateToTab(lastTab);
        }, 100);
    } else {
        // Exibir tela de login ou iniciar com dashboard
        var loginSec = document.getElementById('login-section');
        var mainSec = document.getElementById('main-app-section');
        if (loginSec && !loginSec.classList.contains('hidden')) {
            if (typeof initLoginMotionCanvas === 'function') initLoginMotionCanvas();
        } else if (mainSec) {
            window.navigateToTab('dashboard');
        }
    }
}

// Executar inicialização segura
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppBootstrap);
} else {
    initAppBootstrap();
}
