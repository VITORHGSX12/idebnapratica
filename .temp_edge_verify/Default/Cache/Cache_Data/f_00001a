/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — RESULTADOS CONSOLIDADOS DE SIMULADOS POR ESCOLA
 * Arquivo: js/modules/dashboard/dashboard_simulados_consolidados.js
 * Descrição: Agregação analítica dos simulados e avaliações diagnósticas
 *            de todas as unidades escolares da rede municipal, gráfico
 *            comparativo horizontal com linha de média e tabela interativa ordenável.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var simuladosChartInstance = null;
    var currentComponentFilter = 'geral'; // 'geral' | 'lp' | 'mat'
    var currentEtapaFilter = 'todas'; // 'todas' | '2º Ano' | '5º Ano' | '9º Ano'
    var currentSortColumn = 'proficiencia';
    var currentSortDirection = 'desc'; // 'asc' | 'desc'

    var cachedApiData = null;
    var cachedDescritores = [];

    /**
     * Extrai e calcula os dados consolidados de simulados de cada escola da rede
     * Retorna estritamente os dados reais do PostgreSQL — sem fallbacks artificiais
     */
    function getConsolidatedSimuladosData() {
        if (cachedApiData && Array.isArray(cachedApiData) && cachedApiData.length > 0) {
            return cachedApiData;
        }
        return [];
    }

    /**
     * Renderiza os Descritores e Habilidades Críticas da Rede
     */
    function renderDescritoresCriticosRede(descritores) {
        var container = document.getElementById('grid-descritores-criticos-rede');
        if (!container) return;

        if (!descritores || descritores.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--color-text-secondary); font-size: 12px;">
                    Nenhum descritor computado para a etapa selecionada.
                </div>
            `;
            return;
        }

        var top10 = descritores.slice(0, 8);

        container.innerHTML = top10.map(function(d) {
            var badgeBg = d.acertoPercentual < 50 ? '#FEE2E2' : (d.acertoPercentual < 70 ? '#FEF3C7' : '#ECFDF5');
            var badgeColor = d.acertoPercentual < 50 ? '#991B1B' : (d.acertoPercentual < 70 ? '#92400E' : '#065F46');
            var barColor = d.acertoPercentual < 50 ? '#EF4444' : (d.acertoPercentual < 70 ? '#F59E0B' : '#10B981');

            return `
                <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                        <div>
                            <strong style="font-size: 13px; color: var(--text-primary);">${d.codigo}</strong>
                            <span style="font-size: 10px; color: var(--text-secondary); display: block;">${d.componente}</span>
                        </div>
                        <span style="background: ${badgeBg}; color: ${badgeColor}; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
                            ${d.status}
                        </span>
                    </div>
                    <div>
                        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
                            <span style="color: var(--text-secondary);">Taxa de Acerto</span>
                            <strong style="color: var(--text-primary);">${d.acertoPercentual}%</strong>
                        </div>
                        <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.08); border-radius: 9999px; overflow: hidden;">
                            <div style="width: ${d.acertoPercentual}%; height: 100%; background: ${barColor}; border-radius: 9999px;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderiza o gráfico de barras horizontais comparando as escolas com a média municipal
     */
    function renderConsolidatedSimuladosChart(data) {
        var canvas = document.getElementById('dashChartSimuladosConsolidados');
        if (!canvas) return;

        // Ordenar dados para o gráfico do maior para o menor
        var chartData = data.slice().sort(function(a, b) {
            var valA = currentComponentFilter === 'lp' ? a.proficienciaLP : (currentComponentFilter === 'mat' ? a.proficienciaMAT : a.proficienciaGeral);
            var valB = currentComponentFilter === 'lp' ? b.proficienciaLP : (currentComponentFilter === 'mat' ? b.proficienciaMAT : b.proficienciaGeral);
            return valB - valA;
        });

        var labels = chartData.map(function(s) {
            var n = s.name.replace(/^(UNIDADE INTEGRADA|ESCOLA MUNICIPAL|U\.I\.|E\.M\.)\s*/i, '');
            return n.length > 24 ? n.substring(0, 24) + '…' : n;
        });

        var values = chartData.map(function(s) {
            return currentComponentFilter === 'lp' ? s.proficienciaLP : (currentComponentFilter === 'mat' ? s.proficienciaMAT : s.proficienciaGeral);
        });

        // Calcular Média da Rede para a linha de referência
        var networkAverage = Number((values.reduce(function(acc, v) { return acc + v; }, 0) / values.length).toFixed(1));
        var elAvgDisplay = document.getElementById('simulados-network-avg-badge');
        if (elAvgDisplay) {
            elAvgDisplay.textContent = 'Média da Rede: ' + networkAverage + ' pts';
        }

        var t = (global.ChartTheme && global.ChartTheme.getTheme) ? global.ChartTheme.getTheme() : {
            isDark: false, textPrimary: '#0A1931', textSecondary: '#1A3D63', grid: 'rgba(10, 25, 49, 0.08)',
            simuladoAcimaMedia: '#0D9488', simuladoAcimaHover: '#0F766E',
            simuladoAbaixoMedia: '#4A7FA7', simuladoAbaixoHover: '#1A3D63'
        };

        // Destacar barras acima/abaixo da média com a paleta dinâmica de alto contraste
        var backgroundColors = values.map(function(val) {
            return val >= networkAverage ? t.simuladoAcimaMedia : t.simuladoAbaixoMedia;
        });

        var hoverColors = values.map(function(val) {
            return val >= networkAverage ? t.simuladoAcimaHover : t.simuladoAbaixoHover;
        });

        if (typeof Chart === 'undefined') {
            return;
        }

        if (simuladosChartInstance) {
            try { simuladosChartInstance.destroy(); } catch(e) {}
        }

        var textColor = t.textPrimary;
        var gridColor = t.grid;

        try {
            simuladosChartInstance = new Chart(canvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: currentComponentFilter === 'lp' ? 'Proficiência LP (pts)' : (currentComponentFilter === 'mat' ? 'Proficiência MAT (pts)' : 'Proficiência Média (pts)'),
                            data: values,
                            backgroundColor: backgroundColors,
                            hoverBackgroundColor: hoverColors,
                            borderRadius: 6,
                            borderSkipped: false,
                            barThickness: 16
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: { top: 10, right: 25, bottom: 5, left: 5 }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: t.tooltipBg || 'rgba(15, 23, 42, 0.95)',
                            titleColor: '#FFFFFF',
                            bodyColor: '#F8FAFC',
                            borderColor: t.tooltipBorder || 'rgba(255, 255, 255, 0.15)',
                            borderWidth: 1,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    var val = context.raw;
                                    var diff = Number((val - networkAverage).toFixed(1));
                                    var diffStr = diff >= 0 ? ('+' + diff + ' vs média') : (diff + ' vs média');
                                    return ' Proficiência: ' + val + ' pts (' + diffStr + ')';
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            min: 190,
                            max: 260,
                            grid: { color: gridColor },
                            ticks: {
                                color: textColor,
                                font: { size: 11, weight: '600' },
                                callback: function(value) { return value + ' pts'; }
                            }
                        },
                        y: {
                            grid: { display: false },
                            ticks: {
                                color: textColor,
                                font: { size: 11, weight: '700' }
                            }
                        }
                    }
                }
            });
        } catch(err) {
            console.error('[Dashboard Simulados] Error rendering Chart:', err);
        }
    }

    /**
     * Renderiza a tabela dinâmica ordenável de todas as escolas da rede
     */
    function renderConsolidatedSimuladosTable(data) {
        var tbody = document.getElementById('table-simulados-consolidados-body');
        if (!tbody) return;

        // Ordenar dados com base na coluna e direção selecionadas
        var sorted = data.slice().sort(function(a, b) {
            var valA, valB;

            if (currentSortColumn === 'name') {
                valA = a.name.toLowerCase();
                valB = b.name.toLowerCase();
                return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else if (currentSortColumn === 'inep') {
                valA = a.inep;
                valB = b.inep;
                return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            } else if (currentSortColumn === 'simulados') {
                valA = a.simuladosCount;
                valB = b.simuladosCount;
            } else if (currentSortColumn === 'participacao') {
                valA = a.participacao;
                valB = b.participacao;
            } else if (currentSortColumn === 'variacao') {
                valA = a.variacao;
                valB = b.variacao;
            } else { // 'proficiencia'
                valA = currentComponentFilter === 'lp' ? a.proficienciaLP : (currentComponentFilter === 'mat' ? a.proficienciaMAT : a.proficienciaGeral);
                valB = currentComponentFilter === 'lp' ? b.proficienciaLP : (currentComponentFilter === 'mat' ? b.proficienciaMAT : b.proficienciaGeral);
            }

            if (valA < valB) return currentSortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        // Atualizar indicadores de seta nos cabeçalhos
        updateSortHeaderIndicators();

        tbody.innerHTML = sorted.map(function(item, idx) {
            var displayScore = currentComponentFilter === 'lp' ? item.proficienciaLP : (currentComponentFilter === 'mat' ? item.proficienciaMAT : item.proficienciaGeral);
            var safeName = typeof global.escapeHtml === 'function' ? global.escapeHtml(item.name) : item.name;
            var displayInep = item.inep || '<span style="color:var(--color-text-secondary); font-style:italic;">Não informado</span>';
            
            var hasVar = item.variacao !== null && item.variacao !== undefined;
            var varText = hasVar ? (item.variacao > 0 ? ('+' + item.variacao.toFixed(1) + '%') : (item.variacao < 0 ? item.variacao.toFixed(1) + '%' : '0.0%')) : '— (1º ciclo)';
            var varColor = hasVar ? (item.variacao > 0 ? '#059669' : (item.variacao < 0 ? '#DC2626' : 'var(--color-text-secondary)')) : 'var(--color-text-secondary)';
            var varIcon = hasVar ? (item.variacao > 0 ? '▲ ' : (item.variacao < 0 ? '▼ ' : '▬ ')) : '';

            var badgeStyle = 'background: rgba(74, 127, 167, 0.15); color: #0A1931; border: 1px solid #B3CFE5;';
            if (item.status === 'Meta Atingida') {
                badgeStyle = 'background: #ECFDF5; color: #065F46; border: 1px solid #6EE7B7;';
            } else if (item.status === 'Atenção / Reforço' || item.status === 'Crítico') {
                badgeStyle = 'background: #FFFBEB; color: #92400E; border: 1px solid #FCD34D;';
            }

            return `
                <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 52px; transition: background 0.15s ease;">
                    <td style="padding: 10px 14px;">
                        <strong style="font-size: var(--text-body, 13.5px); color: var(--color-text-primary); display: block; line-height: 1.3;">
                            ${safeName}
                        </strong>
                        <span style="font-size: 11px; color: var(--color-text-secondary); display: inline-flex; align-items: center; gap: 4px; margin-top: 2px;">
                            <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#4A7FA7;"></span>
                            ${item.zone || 'Rede Municipal'}
                        </span>
                    </td>
                    <td style="padding: 10px 14px; font-family: var(--font-mono, monospace); font-size: 12px; color: var(--color-text-secondary);">
                        ${displayInep}
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <span style="background: rgba(179, 207, 229, 0.35); color: var(--color-text-primary); font-weight: 700; font-size: 12px; padding: 3px 8px; border-radius: 6px;">
                            ${item.simuladosCount} aplicados
                        </span>
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <span style="font-size: 14px; font-weight: 800; color: #4A7FA7; font-family: var(--font-mono, monospace);">
                            ${displayScore.toFixed(1)} <span style="font-size: 10px; font-weight: 600;">pts</span>
                        </span>
                        <div style="font-size: 10px; color: var(--color-text-secondary); margin-top: 1px;">
                            LP: ${item.proficienciaLP} • MAT: ${item.proficienciaMAT}
                        </div>
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                            <div style="width: 48px; height: 6px; background: rgba(179, 207, 229, 0.4); border-radius: 9999px; overflow: hidden;">
                                <div style="width: ${item.participacao}%; height: 100%; background: #059669; border-radius: 9999px;"></div>
                            </div>
                            <span style="font-size: 12px; font-weight: 700; color: var(--color-text-primary);">${item.participacao}%</span>
                        </div>
                    </td>
                    <td style="padding: 10px 14px; text-align: center; font-weight: 700; font-size: 12px; color: ${varColor}; font-family: var(--font-mono, monospace);">
                        ${varIcon}${varText}
                    </td>
                    <td style="padding: 10px 14px; text-align: center;">
                        <span class="badge" style="${badgeStyle} font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                            ${item.status}
                        </span>
                    </td>
                    <td style="padding: 10px 14px; text-align: right;">
                        <button type="button" onclick="if(typeof openSchoolWorkspace === 'function') openSchoolWorkspace('${item.name.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="font-size: 11px; font-weight: 700; padding: 4px 10px; height: 30px; border-radius: 6px; border: 1px solid #4A7FA7; color: #4A7FA7; background: transparent; cursor: pointer;" title="Abrir Workspace da Escola">
                            <span>Ver Unidade →</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Atualiza as setas de ordenação visual nos cabeçalhos <th>
     */
    function updateSortHeaderIndicators() {
        var thElements = document.querySelectorAll('.th-sortable-simulados');
        thElements.forEach(function(th) {
            var col = th.getAttribute('data-sort-col');
            var arrowSpan = th.querySelector('.sort-arrow');
            if (col === currentSortColumn) {
                if (arrowSpan) arrowSpan.textContent = currentSortDirection === 'asc' ? ' ↑' : ' ↓';
                th.style.color = 'var(--color-brand-primary, #0A1931)';
            } else {
                if (arrowSpan) arrowSpan.textContent = ' ↕';
                th.style.color = 'var(--color-text-secondary, #1A3D63)';
            }
        });
    }

    /**
     * Alterna a ordenação ao clicar no cabeçalho
     */
    function handleSortSimuladosColumn(colName) {
        if (currentSortColumn === colName) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = colName;
            currentSortDirection = colName === 'name' ? 'asc' : 'desc';
        }
        var data = getConsolidatedSimuladosData();
        renderConsolidatedSimuladosTable(data);
    }

    /**
     * Alterna o filtro de componente curricular (Geral, LP, MAT)
     */
    function handleComponentFilterChange(component) {
        currentComponentFilter = component || 'geral';
        
        var btns = document.querySelectorAll('.btn-filter-componente-simulado');
        btns.forEach(function(b) {
            var c = b.getAttribute('data-component');
            if (c === currentComponentFilter) {
                b.classList.add('active');
                b.style.background = '#4A7FA7';
                b.style.color = '#FFFFFF';
            } else {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--color-text-secondary)';
            }
        });

        var data = getConsolidatedSimuladosData();
        renderConsolidatedSimuladosChart(data);
        renderConsolidatedSimuladosTable(data);
    }

    /**
     * Alterna o filtro de etapa de ensino (Todas, 2º Ano, 5º Ano, 9º Ano)
     */
    function handleEtapaFilterChange(etapa) {
        currentEtapaFilter = etapa || 'todas';
        cachedApiData = null;

        var btns = document.querySelectorAll('.btn-filter-etapa-simulado');
        btns.forEach(function(b) {
            var e = b.getAttribute('data-etapa');
            if (e === currentEtapaFilter) {
                b.classList.add('active');
                b.style.background = '#0A1931';
                b.style.color = '#FFFFFF';
            } else {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--color-text-secondary)';
            }
        });

        renderDashboardSimuladosConsolidados();
    }

    /**
     * Função Master de Renderização da Seção com carregamento assíncrono do PostgreSQL
     */
    async function renderDashboardSimuladosConsolidados() {
        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            var url = '/api/simulados/dashboard/rede' + (currentEtapaFilter !== 'todas' ? ('?etapa=' + encodeURIComponent(currentEtapaFilter)) : '');
            var res = await fetch(url, { headers: headers });
            if (res.ok) {
                var json = await res.json();
                if (json && json.success) {
                    if (json.hasData && Array.isArray(json.escolas) && json.escolas.length > 0) {
                        cachedApiData = json.escolas;
                    } else if (json.hasData === false) {
                        cachedApiData = [];
                    }
                    cachedDescritores = json.descritoresCriticos || [];
                }
            }
        } catch (e) {
            console.warn('[Consolidated Simulados API Fallback]', e);
        }

        var data = getConsolidatedSimuladosData();
        var emptyBanner = document.getElementById('simulados-empty-state-banner');
        var contentWrap = document.getElementById('simulados-consolidado-content-wrap');

        if (!data || data.length === 0) {
            if (contentWrap) contentWrap.style.display = 'none';
            if (emptyBanner) emptyBanner.style.display = 'block';
            return;
        } else {
            if (contentWrap) contentWrap.style.display = 'block';
            if (emptyBanner) emptyBanner.style.display = 'none';
        }

        renderConsolidatedSimuladosChart(data);
        renderConsolidatedSimuladosTable(data);
        renderDescritoresCriticosRede(cachedDescritores);
    }

    // Exposição Global
    global.renderDashboardSimuladosConsolidados = renderDashboardSimuladosConsolidados;
    global.handleSortSimuladosColumn = handleSortSimuladosColumn;
    global.handleComponentFilterChange = handleComponentFilterChange;
    global.handleEtapaFilterChange = handleEtapaFilterChange;

})(typeof window !== 'undefined' ? window : this);
