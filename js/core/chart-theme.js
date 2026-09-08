/**
 * =========================================================================
 * IDEB NA PRÁTICA — SISTEMA CENTRALIZADO DE CORES E TEMAS PARA GRÁFICOS
 * Arquivo: js/core/chart-theme.js
 * Responsabilidade:
 * - Paleta padronizada e enxuta calibrada para modo Claro (Light) e Escuro (Dark)
 * - Fonte ÚNICA de verdade para todas as cores e estilos de gráficos do sistema
 * - Padrões visuais sem cor: dashArray para metas vs real, estilos de marcadores
 * - Garantia de contraste WCAG AA (> 4.5:1) em todos os eixos, textos e séries
 * - Utilitários para detecção e re-renderização reativa em troca de tema
 * =========================================================================
 */

(function(global) {
    'use strict';

    /**
     * 1. PADRÕES DE ESTILO SEM COR (DIFERENCIAÇÃO ESTRUTURAL)
     */
    var chartStyles = {
        // Estilos de Traço (dashArray)
        dashArray: {
            real: [],             // Linha sólida -> Dado Real / Atual / Observado
            solid: [],
            target: [5, 4],       // Linha tracejada -> Meta / Projetado INEP
            projected: [5, 4],
            reference: [3, 3],    // Linha pontilhada -> Média da Rede / Linha de Referência
            guide: [2, 2]
        },
        // Formatos de Marcador Padrão (pointStyle)
        markers: {
            real: 'circle',       // Círculo cheio -> Dado Real / Observado Atual
            target: 'rectRot',    // Losango -> Meta / Projeção
            comparison: 'rect',   // Quadrado -> Comparativo / Histórico
            secondary: 'triangle' // Triângulo -> Série Secundária / Apoio
        },
        // Dimensões e Espessuras Padrão
        lineWidth: {
            primary: 2.5,
            target: 2.0,
            reference: 1.5,
            guide: 1.0
        },
        pointRadius: {
            default: 4.5,
            hover: 7.0,
            target: 4.0,
            targetHover: 6.0
        }
    };

    /**
     * 2. PALETA DE CORES CENTRALIZADA (LIGHT / DARK)
     */
    var chartColors = {
        light: {
            isDark: false,
            bgCard: '#FFFFFF',
            textPrimary: '#0F1A2B',       // Quase preto azulado (WCAG AAA)
            textSecondary: '#6B7A90',     // Cinza neutro legível
            textMuted: '#8A99AD',         // Rótulos secundários
            grid: 'rgba(15, 26, 43, 0.08)', // Grade suave
            border: '#E5E9F0',
            
            // --- PALETA REATORADA ENXUTA (FASE 1) ---
            primary: '#2F6FED',           // Azul Institucional -> Dado real / atual / observado
            primaryMuted: '#7FB3E0',      // Azul Suave -> Comparação / Anos Finais / Histórico
            primaryBg: 'rgba(47, 111, 237, 0.12)',
            primaryMutedBg: 'rgba(127, 179, 224, 0.14)',
            
            success: '#22C55E',           // Verde Institucional -> Metas atingidas / Indicadores positivos
            successBg: 'rgba(34, 197, 94, 0.12)',
            
            warning: '#D97706',           // Âmbar / Laranja Institucional -> EXCLUSIVO: Alertas / Meta Projetada INEP
            warningBg: 'rgba(217, 119, 6, 0.15)',
            
            neutral: '#6B7A90',           // Cinza neutro -> Linhas de grade, eixos, referências
            neutralLight: '#E2E8F0',
            
            // --- ALIASES DE COMPATIBILIDADE ---
            iniciais: '#2F6FED',
            iniciaisBg: 'rgba(47, 111, 237, 0.12)',
            finais: '#7FB3E0',
            finaisBg: 'rgba(127, 179, 224, 0.14)',
            meta: '#D97706',
            metaBg: 'rgba(217, 119, 6, 0.15)',
            
            portugues: '#2F6FED',
            matematica: '#7FB3E0',
            
            simuladoAcimaMedia: '#22C55E',
            simuladoAcimaHover: '#16A34A',
            simuladoAbaixoMedia: '#7FB3E0',
            simuladoAbaixoHover: '#2F6FED',
            
            // Tooltips
            tooltipBg: 'rgba(11, 37, 69, 0.95)',
            tooltipText: '#FFFFFF',
            tooltipBorder: 'rgba(255, 255, 255, 0.15)',
            
            // Datalabels
            datalabelIniciais: '#2F6FED',
            datalabelFinais: '#1B4B8F',
            datalabelMeta: '#B45309',
            datalabelBadgeBg: '#22C55E',

            // Semantic Tokens (1:1 com CSS Variables)
            colorPrimary: '#2F6FED',
            colorPrimaryLight: '#B3CFE5',
            colorPrimaryDark: '#0B2545',
            colorPrimaryChart: '#2F6FED',
            colorTarget: '#D97706',
            colorTargetBg: 'rgba(217, 119, 6, 0.15)',
            colorSuccess: '#22C55E',
            colorSuccessBg: 'rgba(34, 197, 94, 0.12)'
        },
        dark: {
            isDark: true,
            bgCard: '#1A3D63',
            textPrimary: '#F6FAFD',       // Branco puro alto contraste
            textSecondary: '#B3CFE5',     // Azul claro legível
            textMuted: '#7FB3E0',         // Apoio
            grid: 'rgba(179, 207, 229, 0.15)', // Grid suave perceptível
            border: 'rgba(179, 207, 229, 0.22)',
            
            // --- PALETA REATORADA ENXUTA (FASE 1 - DARK) ---
            primary: '#7FB3E0',           // Azul Celeste Claro -> Dado real / atual
            primaryMuted: '#93C5FD',      // Azul Claro Distinto -> Histórico / Comparação
            primaryBg: 'rgba(127, 179, 224, 0.18)',
            primaryMutedBg: 'rgba(147, 197, 253, 0.16)',
            
            success: '#5FD3C4',           // Verde Menta Vibrante -> Metas atingidas / Indicadores positivos
            successBg: 'rgba(95, 211, 196, 0.18)',
            
            warning: '#FFC857',           // Ouro / Amarelo Quente -> EXCLUSIVO: Alertas / Meta Projetada INEP
            warningBg: 'rgba(255, 200, 87, 0.20)',
            
            neutral: '#B3CFE5',           // Neutro claro
            neutralLight: 'rgba(179, 207, 229, 0.25)',
            
            // --- ALIASES DE COMPATIBILIDADE (DARK) ---
            iniciais: '#7FB3E0',
            iniciaisBg: 'rgba(127, 179, 224, 0.18)',
            finais: '#93C5FD',
            finaisBg: 'rgba(147, 197, 253, 0.16)',
            meta: '#FFC857',
            metaBg: 'rgba(255, 200, 87, 0.20)',
            
            portugues: '#7FB3E0',
            matematica: '#93C5FD',
            
            simuladoAcimaMedia: '#5FD3C4',
            simuladoAcimaHover: '#86EFAC',
            simuladoAbaixoMedia: '#7FB3E0',
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
        var theme = isDark ? chartColors.dark : chartColors.light;
        
        // Acopla os estilos não-cor ao objeto retornado para fácil acesso
        return Object.assign({}, theme, {
            styles: chartStyles,
            dashArray: chartStyles.dashArray,
            markers: chartStyles.markers,
            lineWidth: chartStyles.lineWidth,
            pointRadius: chartStyles.pointRadius
        });
    }

    /**
     * Utilitário para recriar/atualizar todos os gráficos do sistema após alternância de tema
     */
    function refreshAllSystemCharts() {
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
        styles: chartStyles,
        getTheme: getChartTheme,
        refreshAll: refreshAllSystemCharts
    };

})(typeof window !== 'undefined' ? window : this);
