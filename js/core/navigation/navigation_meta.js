/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — METADADOS DE NAVEGAÇÃO E ROTAS (SIDEBAR / MENUS)
 * Arquivo: js/core/navigation/navigation_meta.js
 * Descrição: Catálogo centralizado de metadados, títulos, subtítulos, ícones
 *            e descrições das rotas e menus da aplicação.
 * ============================================================================
 */

(function(window) {
    'use strict';

    var TAB_METADATA = {
        'dashboard': {
            id: 'dashboard',
            title: 'Monitoramento Geral - IDEB & SEAMA',
            subtitle: 'Indicadores gerais do IDEB projetado, proficiência SEAMA, metas municipais e taxa de adesão aos simulados.',
            icon: 'layout-dashboard',
            category: 'visao-geral'
        },
        'escolas-panel': {
            id: 'escolas-panel',
            title: 'Escolas da Rede',
            subtitle: 'Painel geral de escolas, total de alunos cadastrados e estatísticas de proficiência de exames externos.',
            icon: 'school',
            category: 'rede-municipal'
        },
        'alunos-panel': {
            id: 'alunos-panel',
            title: 'Alunos & Cadastros',
            subtitle: 'Consulta de fichas cadastrais completas, dados de contato e acessibilidade da rede.',
            icon: 'users',
            category: 'rede-municipal'
        },
        'metas-ideb': {
            id: 'metas-ideb',
            title: 'Metas e Planos de Desenvolvimento Escolar',
            subtitle: 'Acompanhamento de metas pactuadas e planos de ação direcionados para escolas com desvio de aprendizagem.',
            icon: 'target',
            category: 'gestao-estrategica'
        },
        'ideb-comparativo': {
            id: 'ideb-comparativo',
            title: 'Comparativo Regional (INEP)',
            subtitle: 'Resultados históricos oficiais e metas projetadas do IDEB por estados e municípios (Fonte: MEC / INEP).',
            icon: 'bar-chart-3',
            category: 'gestao-estrategica'
        },
        'matriz-descritores': {
            id: 'matriz-descritores',
            title: 'Matriz de Referência & Descritores',
            subtitle: 'Lista de descritores cognitivos de competências do SAEB e do SEAMA.',
            icon: 'layers',
            category: 'pedagogico'
        },
        'cronograma-habilidades': {
            id: 'cronograma-habilidades',
            title: 'Cronograma Semanal de Habilidades',
            subtitle: 'Planejamento e pactuação semanal de habilidades (SEMED ↔ Docentes) para acelerar a recomposição de aprendizagem.',
            icon: 'calendar',
            category: 'pedagogico'
        },
        'criar-avaliacoes': {
            id: 'criar-avaliacoes',
            title: 'Simulados & Avaliações Externas',
            subtitle: 'Criação de instrumentos pedagógicos focados na preparação para o IDEB (SAEB) e SEAMA.',
            icon: 'file-text',
            category: 'avaliacoes'
        },
        'aplicacao-provas': {
            id: 'aplicacao-provas',
            title: 'Aplicação de Provas',
            subtitle: 'Monitoramento da presença dos alunos e digitação de cartões-resposta em tempo real.',
            icon: 'check-square',
            category: 'avaliacoes'
        },
        'ai-playground': {
            id: 'ai-playground',
            title: 'Relatórios & Monitoramento',
            subtitle: 'Acompanhamento longitudinal de alunos e geração de diagnósticos pedagógicos focados em avaliações externas.',
            icon: 'sparkles',
            category: 'inteligencia'
        },
        'questions': {
            id: 'questions',
            title: 'Banco de Itens (IDEB / SEAMA / BNCC)',
            subtitle: 'Pesquisa avançada, montagem de itens de teste e exportação de exames com descritores e habilidades.',
            icon: 'help-circle',
            category: 'pedagogico'
        },
        'gestao-pedagogica': {
            id: 'gestao-pedagogica',
            title: 'Gestão Pedagógica & Intervenções',
            subtitle: 'Acompanhamento de planos de ação pedagógica e alertas preditivos de desvios de metas.',
            icon: 'trending-up',
            category: 'gestao-estrategica'
        },
        'doc-tecnica': {
            id: 'doc-tecnica',
            title: 'Documentação Técnica',
            subtitle: 'Especificação técnica dos módulos, modelo relacional ERD, script DDL SQL e APIs do sistema.',
            icon: 'code-2',
            category: 'sistema'
        },
        'biblioteca-recursos': {
            id: 'biblioteca-recursos',
            title: 'Biblioteca Pedagógica & Provas Impressas',
            subtitle: 'Acervo oficial da SEMED Gonçalves Dias - MA. Simulados, matrizes e provas formatadas para impressão A4.',
            icon: 'book-open',
            category: 'pedagogico'
        },
        'admin-panel': {
            id: 'admin-panel',
            title: 'Área Administrativa & Usuários',
            subtitle: 'Gestão de usuários (RBAC), controle de acessos da SEMED e ferramentas de manutenção do sistema.',
            icon: 'shield',
            category: 'sistema'
        }
    };

    /**
     * Helper seguro para obter metadados de uma aba por ID
     */
    function getTabMeta(tabId) {
        if (!tabId) return null;
        var cleanId = tabId.toString().trim().replace(/^#/, '');
        return TAB_METADATA[cleanId] || {
            id: cleanId,
            title: cleanId.charAt(0).toUpperCase() + cleanId.slice(1).replace(/-/g, ' '),
            subtitle: 'Painel de navegação e gestão escolar.',
            icon: 'file',
            category: 'geral'
        };
    }

    // Exportação Global
    window.TAB_METADATA = TAB_METADATA;
    window.getTabMeta = getTabMeta;

})(typeof window !== 'undefined' ? window : this);
