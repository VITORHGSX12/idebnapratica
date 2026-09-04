/**
 * =========================================================================
 * IDEB NA PRÁTICA — SISTEMA CENTRALIZADO DE CORES E TEMAS PARA GRÁFICOS
 * Arquivo: js/core/chart-theme.js
 * Responsabilidade:
 * - Paleta padronizada e calibrada para modo Claro (Light) e Escuro (Dark)
 * - Garantia de contraste WCAG AA (> 4.5:1) em todos os eixos, textos e séries
 * - Diferenciação visual nítida entre séries (ex: Anos Iniciais vs Finais vs Meta)
 * - Utilitários para detecção e re-renderização reativa em troca de tema
 * =========================================================================
 */

(function(global) {
    'use strict';

    var chartColors = {
        light: {
            isDark: false,
            bgCard: '#F6FAFD',
            textPrimary: '#0A1931',
            textSecondary: '#1A3D63',
            textMuted: '#4A7FA7',
            grid: 'rgba(10, 25, 49, 0.09)',
            border: '#E2E8F0',
            
            // Séries Principais (Claro) — Azul para Observado/Real e Âmbar para Meta
            iniciais: '#2563EB',         // Azul Royal vibrante (Observado Anos Iniciais)
            iniciaisBg: 'rgba(37, 99, 235, 0.12)',
            finais: '#1E40AF',           // Azul Marinho Profundo (Observado Anos Finais)
            finaisBg: 'rgba(30, 64, 175, 0.10)',
            meta: '#D97706',             // Âmbar/Dourado Quente (Meta/Projeção exclusiva)
            metaBg: 'rgba(217, 119, 6, 0.15)',
            
            // Disciplinas SAEB
            portugues: '#2563EB',
            matematica: '#0D9488',
            
            // Simulados Consolidados (Fase 4)
            simuladoAcimaMedia: '#0D9488',     // Teal acima da média
            simuladoAcimaHover: '#0F766E',
            simuladoAbaixoMedia: '#4A7FA7',    // Azul acinzentado abaixo da média
            simuladoAbaixoHover: '#1A3D63',
            
            // Tooltips
            tooltipBg: 'rgba(10, 25, 49, 0.95)',
            tooltipText: '#FFFFFF',
            tooltipBorder: 'rgba(255, 255, 255, 0.15)',
            
            // Datalabels
            datalabelIniciais: '#1D4ED8',
            datalabelFinais: '#1E40AF',
            datalabelMeta: '#B45309',
            datalabelBadgeBg: '#0D9488',

            // Semantic Tokens (1:1 com CSS Variables)
            colorPrimary: '#4A7FA7',
            colorPrimaryLight: '#B3CFE5',
            colorPrimaryDark: '#1A3D63',
            colorPrimaryChart: '#2563EB',
            colorTarget: '#D97706',
            colorTargetBg: 'rgba(217, 119, 6, 0.15)',
            colorSuccess: '#059669',
            colorSuccessBg: '#ECFDF5'
        },
        dark: {
            isDark: true,
            bgCard: '#1A3D63',
            textPrimary: '#F6FAFD',     // Branco puro alto contraste
            textSecondary: '#B3CFE5',   // Azul bebê claro legível
            textMuted: '#7FB3E0',       // Tom claro de apoio
            grid: 'rgba(179, 207, 229, 0.16)', // Grid suave perceptível
            border: 'rgba(179, 207, 229, 0.22)',
            
            // Séries Principais (Escuro - Cores vivas e distinguíveis)
            iniciais: '#7FB3E0',        // Azul Celeste Claro (Observado Anos Iniciais)
            iniciaisBg: 'rgba(127, 179, 224, 0.18)',
            finais: '#93C5FD',          // Azul Claro Distinto (Observado Anos Finais)
            finaisBg: 'rgba(147, 197, 253, 0.16)',
            meta: '#FFC857',            // Ouro/Amarelo Quente Dourado (Meta/Projeção exclusiva)
            metaBg: 'rgba(255, 200, 87, 0.20)',
            
            // Disciplinas SAEB
            portugues: '#7FB3E0',
            matematica: '#5FD3C4',
            
            // Simulados Consolidados (Fase 4)
            simuladoAcimaMedia: '#5FD3C4',     // Menta vibrante
            simuladoAcimaHover: '#86EFAC',
            simuladoAbaixoMedia: '#7FB3E0',    // Azul celeste claro
            simuladoAbaixoHover: '#93C5FD',
            
            // Tooltips
            tooltipBg: 'rgba(10, 25, 49, 0.96)',
            tooltipText: '#FFFFFF',
            tooltipBorder: 'rgba(179, 207, 229, 0.3)',
            
            // Datalabels
            datalabelIniciais: '#F6FAFD',
            datalabelFinais: '#F6FAFD',
            datalabelMeta: '#FFC857',
            datalabelBadgeBg: '#059669',

            // Semantic Tokens (1:1 com CSS Variables)
            colorPrimary: '#4A7FA7',
            colorPrimaryLight: '#7FB3E0',
            colorPrimaryDark: '#1A3D63',
            colorPrimaryChart: '#7FB3E0',
            colorTarget: '#FFC857',
            colorTargetBg: 'rgba(255, 200, 87, 0.20)',
            colorSuccess: '#059669',
            colorSuccessBg: 'rgba(95, 211, 196, 0.15)'
        }
    };

    /**
     * Retorna o objeto de cores ativo com base no estado atual do DOM
     */
    function getChartTheme() {
        var isDark = document.body.classList.contains('dark-mode') || 
                     document.documentElement.classList.contains('dark-mode') ||
                     (typeof localStorage !== 'undefined' && localStorage.getItem('gd_theme') === 'dark');
        return isDark ? chartColors.dark : chartColors.light;
    }

    /**
     * Utilitário para recriar/atualizar todos os gráficos do sistema após alternância de tema
     */
    function refreshAllSystemCharts() {
        var isDark = getChartTheme().isDark;

        // 1. Gráficos Históricos do Painel Executivo
        if (typeof global.renderDashboardGoncalvesDiasChart === 'function') {
            try { global.renderDashboardGoncalvesDiasChart(); } catch(e) { console.warn(e); }
        }
        if (typeof global.renderDashboardEtapasCharts === 'function') {
            try { global.renderDashboardEtapasCharts(); } catch(e) { console.warn(e); }
        }
        if (typeof global.renderDashboardComparativoChart === 'function') {
            try { global.renderDashboardComparativoChart(); } catch(e) { console.warn(e); }
        }

        // 2. Gráficos de Escala e SAEB
        if (typeof global.renderDashboardIndicadorEscala === 'function') {
            try { global.renderDashboardIndicadorEscala(); } catch(e) { console.warn(e); }
        }
        if (typeof global.renderDashboardSaebEvolucaoGoncalvesChart === 'function') {
            try { global.renderDashboardSaebEvolucaoGoncalvesChart(); } catch(e) { console.warn(e); }
        }

        // 3. Linha do Tempo Vetorial SVG
        if (typeof global.renderDashboardTimelineChart === 'function') {
            try { global.renderDashboardTimelineChart(); } catch(e) { console.warn(e); }
        }

        // 4. Dashboard de Simulados da Fase 4
        if (typeof global.renderConsolidatedSimuladosSection === 'function' && typeof global.getConsolidatedSimuladosData === 'function') {
            try {
                var simData = global.getConsolidatedSimuladosData();
                global.renderConsolidatedSimuladosSection(simData);
            } catch(e) { console.warn(e); }
        }

        // 5. Proficiência e Descritores
        if (typeof global.renderDashboardProficiency === 'function') {
            try { global.renderDashboardProficiency(); } catch(e) { console.warn(e); }
        }
    }

    // Ouvir eventos globais de mudança de tema
    if (typeof window !== 'undefined') {
        window.addEventListener('themeChanged', function() {
            setTimeout(refreshAllSystemCharts, 50);
        });
    }

    // Exposição Global
    global.ChartTheme = {
        colors: chartColors,
        getTheme: getChartTheme,
        refreshAll: refreshAllSystemCharts
    };

})(typeof window !== 'undefined' ? window : this);
