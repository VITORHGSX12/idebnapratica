// =========================================================================
// DASHBOARD SCALES & ORCHESTRATOR ENGINE
// Responsabilidade: Escala de Aprendizado SAEB, Indicador de Proficiência,
// Evolução Histórica SAEB por Disciplina (5º e 9º Ano) e Orquestrador
// de renderização completa do Dashboard (renderDashboardComplete).
// =========================================================================

(function(global) {
    'use strict';

    var dashSaebEvoChartInstance = null;

    /**
     * Renderiza o Indicador de Escala e gráfico evolutivo SAEB
     */
    function renderDashboardIndicadorEscala() {
        var ctxSaeb = document.getElementById('dashChartSaebEvo');
        if (!ctxSaeb) return;

        var saebData = {
            iniciais: {
                indicador: '5,63', port: '201,07', mat: '209,71',
                port_s: [157.56, 160.41, 163.69, 162.59, 177.56, 182.75, 185.42, 181.24, 191.75, 201.07],
                mat_s:  [174.56, 175.68, 176.64, 172.31, 187.83, 189.91, 197.35, 189.87, 199.98, 209.71]
            },
            finais: {
                indicador: '4,79', port: '245,03', mat: '242,35',
                port_s: [216.58, 223.10, 223.70, 222.00, 230.50, 234.51, 236.00, 236.75, 241.86, 245.03],
                mat_s:  [223.40, 223.26, 223.80, 222.39, 230.93, 228.68, 236.42, 230.44, 236.50, 242.35]
            }
        };
        var saebYears = ['2007','2009','2011','2013','2015','2017','2019','2021','2023','2025'];
        var fmt = function(v) { return (v !== null && v !== undefined) ? Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''; };

        var t = (global.ChartTheme && global.ChartTheme.getTheme) ? global.ChartTheme.getTheme() : {
            isDark: false, textPrimary: '#0A1931', textSecondary: '#1A3D63', textMuted: '#4A7FA7', grid: 'rgba(10, 25, 49, 0.09)',
            portugues: '#2563EB', matematica: '#0D9488'
        };

        if (typeof Chart === 'undefined') {
            if (typeof global.drawCanvasFallbackChart === 'function') {
                global.drawCanvasFallbackChart(ctxSaeb, saebYears, [
                    { type: 'line', label: 'Português', data: saebData.finais.port_s, borderColor: t.portugues },
                    { type: 'line', label: 'Matemática', data: saebData.finais.mat_s, borderColor: t.matematica }
                ], 80, 300);
            }
            return;
        }

        try {
            if (dashSaebEvoChartInstance) dashSaebEvoChartInstance.destroy();

            dashSaebEvoChartInstance = new Chart(ctxSaeb, {
                type: 'line',
                data: {
                    labels: saebYears,
                    datasets: [
                        {
                            label: 'Língua Portuguesa',
                            data: saebData.finais.port_s,
                            borderColor: t.portugues,
                            backgroundColor: t.portugues,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.portugues,
                            pointBorderWidth: 2.5,
                            borderWidth: 2.5,
                            pointRadius: 4.5,
                            tension: 0.3,
                            datalabels: {
                                display: true,
                                align: 'bottom',
                                offset: 6,
                                color: t.isDark ? '#0A1931' : '#FFFFFF',
                                font: { weight: '800', size: 9.5, family: 'var(--font-mono)' },
                                backgroundColor: t.portugues,
                                borderRadius: 6,
                                padding: { top: 2, bottom: 2, left: 6, right: 6 },
                                formatter: function(v) { return fmt(v); }
                            }
                        },
                        {
                            label: 'Matemática',
                            data: saebData.finais.mat_s,
                            borderColor: t.matematica,
                            backgroundColor: t.matematica,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.matematica,
                            pointBorderWidth: 2.5,
                            borderWidth: 2.5,
                            pointRadius: 4.5,
                            tension: 0.3,
                            datalabels: {
                                display: true,
                                align: 'top',
                                offset: 6,
                                color: t.isDark ? '#0A1931' : '#FFFFFF',
                                font: { weight: '800', size: 9.5, family: 'var(--font-mono)' },
                                backgroundColor: t.matematica,
                                borderRadius: 6,
                                padding: { top: 2, bottom: 2, left: 6, right: 6 },
                                formatter: function(v) { return fmt(v); }
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 26, bottom: 8, left: 4, right: 4 } },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 10,
                                boxHeight: 10,
                                usePointStyle: true,
                                color: t.textPrimary,
                                font: { size: 11.5, weight: '600' }
                            }
                        },
                        tooltip: {
                            backgroundColor: t.tooltipBg || 'rgba(15, 23, 42, 0.9)',
                            titleFont: { size: 12, weight: '800' },
                            bodyFont: { size: 11 },
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: function(context) {
                                    return ' ' + context.dataset.label + ': ' + (context.raw ? fmt(context.raw) : 'N/A');
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            min: 80,
                            max: 300,
                            grid: { color: t.grid },
                            ticks: { stepSize: 40, font: { size: 11, weight: '600' }, color: t.textSecondary },
                            title: { display: true, text: 'Nota padronizada', font: { size: 11, weight: '700' }, color: t.textMuted }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '700' }, color: t.textPrimary }
                        }
                    }
                }
            });

            // Listener de abas para Anos Iniciais / Anos Finais
            var etapaBtns = document.querySelectorAll('#dashEtapaTabs .tab-btn');
            etapaBtns.forEach(function(btn) {
                btn.onclick = function() {
                    var etapa = btn.dataset.etapa;
                    var d = saebData[etapa];
                    if (!d) return;

                    var numEl = document.getElementById('dashIndicadorNum');
                    var portEl = document.getElementById('dashPortNum');
                    var matEl = document.getElementById('dashMatNum');
                    if (numEl) numEl.textContent = d.indicador;
                    if (portEl) portEl.textContent = d.port;
                    if (matEl) matEl.textContent = d.mat;

                    if (dashSaebEvoChartInstance && dashSaebEvoChartInstance.data) {
                        dashSaebEvoChartInstance.data.datasets[0].data = d.port_s;
                        dashSaebEvoChartInstance.data.datasets[1].data = d.mat_s;
                        dashSaebEvoChartInstance.update();
                    }

                    etapaBtns.forEach(function(x) {
                        x.classList.toggle('active', x === btn);
                        x.style.background = x === btn ? '#fff' : 'transparent';
                        x.style.color = x === btn ? '#6366f1' : 'var(--text-secondary)';
                    });
                };
            });
        } catch(err) {
            console.error('[renderDashboardIndicadorEscala Error]', err);
        }
    }

    /**
     * Renderiza a Escala de Aprendizado SAEB por Níveis e Faixas
     */
    function renderDashboardEscalaAprendizado() {
        var escalaBody = document.getElementById('dashEscalaBody');
        if (!escalaBody) return;

        var escalaData = {
            '5-lp': [
                {
                    cat: 'Abaixo do Básico',
                    bg: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    rows: [
                        ['Até nível 1', '0 - 149 pts']
                    ]
                },
                {
                    cat: 'Básico',
                    bg: 'rgba(245, 158, 11, 0.08)',
                    color: '#d97706',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                    rows: [
                        ['Nível 2', '150 - 174 pts'],
                        ['Nível 3', '175 - 199 pts']
                    ]
                },
                {
                    cat: 'Proficiente',
                    bg: 'rgba(59, 130, 246, 0.08)',
                    color: '#2563eb',
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    rows: [
                        ['Nível 4', '200 - 224 pts'],
                        ['Nível 5', '225 - 249 pts']
                    ]
                },
                {
                    cat: 'Avançado',
                    bg: 'rgba(16, 185, 129, 0.08)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    rows: [
                        ['Nível 6', '250 - 274 pts'],
                        ['Nível 7', '275 - 299 pts'],
                        ['Nível 8', '300 - 324 pts'],
                        ['Nível 9', '≥ 325 pts']
                    ]
                }
            ],
            '5-mat': [
                {
                    cat: 'Abaixo do Básico',
                    bg: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    rows: [
                        ['Nível 0', '0 - 124 pts'],
                        ['Nível 1', '125 - 149 pts'],
                        ['Nível 2', '150 - 174 pts']
                    ]
                },
                {
                    cat: 'Básico',
                    bg: 'rgba(245, 158, 11, 0.08)',
                    color: '#d97706',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                    rows: [
                        ['Nível 3', '175 - 199 pts'],
                        ['Nível 4', '200 - 224 pts']
                    ]
                },
                {
                    cat: 'Proficiente',
                    bg: 'rgba(59, 130, 246, 0.08)',
                    color: '#2563eb',
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    rows: [
                        ['Nível 5', '225 - 249 pts'],
                        ['Nível 6', '250 - 274 pts']
                    ]
                },
                {
                    cat: 'Avançado',
                    bg: 'rgba(16, 185, 129, 0.08)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    rows: [
                        ['Nível 7', '275 - 299 pts'],
                        ['Nível 8', '300 - 324 pts'],
                        ['Nível 9', '325 - 349 pts'],
                        ['Nível 10', '≥ 350 pts']
                    ]
                }
            ],
            '9-lp': [
                {
                    cat: 'Abaixo do Básico',
                    bg: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    rows: [
                        ['Nível 0', '0 - 199 pts']
                    ]
                },
                {
                    cat: 'Básico',
                    bg: 'rgba(245, 158, 11, 0.08)',
                    color: '#d97706',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                    rows: [
                        ['Nível 1', '200 - 224 pts'],
                        ['Nível 2', '225 - 249 pts'],
                        ['Nível 3', '250 - 274 pts']
                    ]
                },
                {
                    cat: 'Proficiente',
                    bg: 'rgba(59, 130, 246, 0.08)',
                    color: '#2563eb',
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    rows: [
                        ['Nível 4', '275 - 299 pts'],
                        ['Nível 5', '300 - 324 pts']
                    ]
                },
                {
                    cat: 'Avançado',
                    bg: 'rgba(16, 185, 129, 0.08)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    rows: [
                        ['Nível 6', '325 - 349 pts'],
                        ['Nível 7', '350 - 374 pts'],
                        ['Nível 8', '≥ 375 pts']
                    ]
                }
            ],
            '9-mat': [
                {
                    cat: 'Abaixo do Básico',
                    bg: 'rgba(239, 68, 68, 0.08)',
                    color: '#ef4444',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                    rows: [
                        ['Nível 0', '0 - 199 pts'],
                        ['Nível 1', '200 - 224 pts']
                    ]
                },
                {
                    cat: 'Básico',
                    bg: 'rgba(245, 158, 11, 0.08)',
                    color: '#d97706',
                    borderColor: 'rgba(245, 158, 11, 0.25)',
                    rows: [
                        ['Nível 2', '225 - 249 pts'],
                        ['Nível 3', '250 - 274 pts'],
                        ['Nível 4', '275 - 299 pts']
                    ]
                },
                {
                    cat: 'Proficiente',
                    bg: 'rgba(59, 130, 246, 0.08)',
                    color: '#2563eb',
                    borderColor: 'rgba(59, 130, 246, 0.25)',
                    rows: [
                        ['Nível 5', '300 - 324 pts'],
                        ['Nível 6', '325 - 349 pts']
                    ]
                },
                {
                    cat: 'Avançado',
                    bg: 'rgba(16, 185, 129, 0.08)',
                    color: '#10b981',
                    borderColor: 'rgba(16, 185, 129, 0.25)',
                    rows: [
                        ['Nível 7', '350 - 374 pts'],
                        ['Nível 8', '375 - 399 pts'],
                        ['Nível 9', '≥ 400 pts']
                    ]
                }
            ]
        };

        var curSerie = '5';
        var curDisc = 'lp';

        function renderActiveEscala() {
            var key = curSerie + '-' + curDisc;
            var groups = escalaData[key] || [];

            var html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 10px;">';

            groups.forEach(function(g) {
                html += `
                    <div style="background: ${g.bg}; border: 1px solid ${g.borderColor}; border-radius: 12px; padding: 14px 16px;">
                        <div style="font-size: 0.85rem; font-weight: 800; color: ${g.color}; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
                            <span>${g.cat}</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                `;

                g.rows.forEach(function(row) {
                    var nivel = row[0];
                    var faixa = row[1];
                    html += `
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; padding: 5px 10px; background: var(--bg-secondary); border-radius: 6px; border: 1px solid var(--border-color);">
                            <span style="font-weight: 700; color: var(--text-primary);">${nivel}</span>
                            <span style="font-weight: 800; color: ${g.color}; font-family: var(--font-mono);">${faixa}</span>
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            });

            html += '</div>';
            escalaBody.innerHTML = html;
        }

        var serieBtns = document.querySelectorAll('#dashSerieSeg button');
        serieBtns.forEach(function(btn) {
            btn.onclick = function() {
                curSerie = btn.dataset.serie;
                serieBtns.forEach(function(b) {
                    var isActive = (b === btn);
                    b.className = isActive ? 'active' : '';
                    b.style.background = isActive ? '#fff' : 'transparent';
                    b.style.color = isActive ? '#6366f1' : 'var(--text-secondary)';
                });
                renderActiveEscala();
            };
        });

        var discBtns = document.querySelectorAll('#dashDiscSeg button');
        discBtns.forEach(function(btn) {
            btn.onclick = function() {
                curDisc = btn.dataset.disc;
                discBtns.forEach(function(b) {
                    var isActive = (b === btn);
                    b.className = isActive ? 'active' : '';
                    b.style.background = isActive ? '#fff' : 'transparent';
                    b.style.color = isActive ? '#6366f1' : 'var(--text-secondary)';
                });
                renderActiveEscala();
            };
        });

        renderActiveEscala();
    }

    /**
     * Gráfico de Evolução SAEB Gonçalves Dias por Disciplina (5º e 9º Ano)
     */
    function renderDashboardSaebEvolucaoGoncalvesChart() {
        var ctx = document.getElementById('dashChartSaebEvolucaoGoncalves');
        if (!ctx) return;

        var t = (global.ChartTheme && global.ChartTheme.getTheme) ? global.ChartTheme.getTheme() : {
            isDark: false, textPrimary: '#0A1931', textSecondary: '#1A3D63', grid: 'rgba(10, 25, 49, 0.09)'
        };

        var anos = ['2015', '2017', '2019', '2021', '2023', '2025'];
        var port5 = [201.4, 205.8, 216.3, 210.2, 224.5, 231.8];
        var mat5  = [206.2, 211.5, 222.1, 215.8, 230.4, 238.2];
        var port9 = [232.1, 235.6, 248.4, 242.0, 254.8, 261.5];
        var mat9  = [238.5, 241.2, 252.7, 246.3, 258.9, 267.4];

        if (typeof Chart === 'undefined') return;

        var colPort5 = t.isDark ? '#A78BFA' : '#8B5CF6';
        var colMat5  = t.isDark ? '#7FB3E0' : '#2563EB';
        var colPort9 = t.isDark ? '#5FD3C4' : '#0D9488';
        var colMat9  = t.isDark ? '#FFC857' : '#D97706';

        try {
            if (global.dashSaebEvolucaoChartInstance) global.dashSaebEvolucaoChartInstance.destroy();

            global.dashSaebEvolucaoChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: anos,
                    datasets: [
                        {
                            type: 'line',
                            label: '5º Ano — Língua Portuguesa',
                            data: port5,
                            borderColor: colPort5,
                            backgroundColor: 'rgba(167, 139, 250, 0.08)',
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: colPort5,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: false,
                            datalabels: {
                                display: true,
                                align: 'top',
                                color: colPort5,
                                font: { weight: '800', size: 10 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            type: 'line',
                            label: '5º Ano — Matemática',
                            data: mat5,
                            borderColor: colMat5,
                            backgroundColor: 'rgba(127, 179, 224, 0.08)',
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: colMat5,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: false,
                            datalabels: {
                                display: true,
                                align: 'bottom',
                                color: colMat5,
                                font: { weight: '800', size: 10 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            type: 'line',
                            label: '9º Ano — Língua Portuguesa',
                            data: port9,
                            borderColor: colPort9,
                            backgroundColor: 'rgba(95, 211, 196, 0.08)',
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: colPort9,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: false,
                            datalabels: {
                                display: true,
                                align: 'top',
                                color: colPort9,
                                font: { weight: '800', size: 10 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            type: 'line',
                            label: '9º Ano — Matemática',
                            data: mat9,
                            borderColor: colMat9,
                            backgroundColor: 'rgba(255, 200, 87, 0.08)',
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: colMat9,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: false,
                            datalabels: {
                                display: true,
                                align: 'bottom',
                                color: colMat9,
                                font: { weight: '800', size: 10 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 26, bottom: 8, left: 4, right: 4 } },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 10,
                                boxHeight: 10,
                                usePointStyle: true,
                                color: t.textPrimary,
                                font: { size: 11.5, weight: '600' }
                            }
                        },
                        tooltip: {
                            backgroundColor: t.tooltipBg || 'rgba(15, 23, 42, 0.9)',
                            titleFont: { size: 12, weight: '800' },
                            bodyFont: { size: 11 },
                            padding: 10,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            min: 190,
                            max: 280,
                            grid: { color: t.grid },
                            ticks: { stepSize: 15, font: { size: 11, weight: '600' }, color: t.textSecondary }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '700' }, color: t.textPrimary }
                        }
                    }
                }
            });
        } catch(err) {
            console.error('[dashChartSaebEvolucaoGoncalves Error]', err);
        }
    }

    /**
     * Orquestrador de Renderização Completa do Dashboard
     */
    function renderDashboardComplete() {
        if (typeof global.updateUserHeaderUI === 'function') global.updateUserHeaderUI();
        if (typeof global.renderDashboardWelcomeBanner === 'function') global.renderDashboardWelcomeBanner();
        if (typeof global.renderDashboardMetricCards === 'function') global.renderDashboardMetricCards();
        if (typeof global.renderDashboardPdeProgress === 'function') global.renderDashboardPdeProgress();
        if (typeof global.renderDashboardTimelineChart === 'function') global.renderDashboardTimelineChart();
        if (typeof global.renderDashboardPriorityDescriptors === 'function') global.renderDashboardPriorityDescriptors();
        if (typeof global.renderDashboardGoncalvesDiasChart === 'function') global.renderDashboardGoncalvesDiasChart();
        if (typeof global.renderDashboardEtapasCharts === 'function') global.renderDashboardEtapasCharts();
        if (typeof global.renderDashboardComparativoChart === 'function') global.renderDashboardComparativoChart();
        if (typeof global.renderDashboardIndicadorEscala === 'function') global.renderDashboardIndicadorEscala();
        if (typeof global.renderDashboardEscalaAprendizado === 'function') global.renderDashboardEscalaAprendizado();
        if (typeof global.renderDashboardSaebEvolucaoGoncalvesChart === 'function') global.renderDashboardSaebEvolucaoGoncalvesChart();
        if (typeof global.renderDashboardProficiency === 'function') global.renderDashboardProficiency();
        if (typeof global.renderDashboardSchoolsRanking === 'function') global.renderDashboardSchoolsRanking();
        if (typeof global.renderDashboardSimuladosConsolidados === 'function') global.renderDashboardSimuladosConsolidados();
    }

    // Exposição Global
    global.renderDashboardIndicadorEscala = renderDashboardIndicadorEscala;
    global.renderDashboardEscalaAprendizado = renderDashboardEscalaAprendizado;
    global.renderDashboardSaebEvolucaoGoncalvesChart = renderDashboardSaebEvolucaoGoncalvesChart;
    global.renderDashboardComplete = renderDashboardComplete;

})(typeof window !== 'undefined' ? window : this);
