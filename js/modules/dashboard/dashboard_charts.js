// =========================================================================
// DASHBOARD CHARTS ENGINE
// Responsabilidade: Renderização de gráficos comparativos históricos (Chart.js),
// Anos Iniciais vs Anos Finais, metas INEP de Gonçalves Dias e Maranhão,
// tooltips interativas e fallbacks de canvas nativo.
// =========================================================================

(function(global) {
    'use strict';

    // Instâncias Globais de Gráficos do Dashboard
    var dashGoncalvesDiasChartInstance = null;
    var dashIniciaisChartInstance = null;
    var dashFinaisChartInstance = null;
    var dashComparativoChartInstance = null;

    // Registrar o plugin datalabels globalmente se a biblioteca estiver carregada
    if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined') {
        try { Chart.register(ChartDataLabels); } catch(e) {}
    }

    /**
     * Configuração Global de Tooltips Interativas Dark Theme para todos os Gráficos
     */
    function configureGlobalChartTooltips() {
        if (typeof Chart === 'undefined') return;
        try {
            Chart.defaults.interaction = Chart.defaults.interaction || {};
            Chart.defaults.interaction.mode = 'index';
            Chart.defaults.interaction.intersect = false;

            // Animação nativa suave no Chart.js
            Chart.defaults.animation = Chart.defaults.animation || {};
            var prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            Chart.defaults.animation.duration = prefersReduced ? 0 : 1000;
            Chart.defaults.animation.easing = 'easeOutQuart';

            Chart.defaults.plugins = Chart.defaults.plugins || {};
            Chart.defaults.plugins.tooltip = Chart.defaults.plugins.tooltip || {};
            Chart.defaults.plugins.tooltip.enabled = true;
            Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.94)';
            Chart.defaults.plugins.tooltip.titleColor = '#FFFFFF';
            Chart.defaults.plugins.tooltip.titleFont = { size: 13, weight: '800' };
            Chart.defaults.plugins.tooltip.bodyColor = '#F8FAFC';
            Chart.defaults.plugins.tooltip.bodyFont = { size: 12, weight: '600' };
            Chart.defaults.plugins.tooltip.padding = 12;
            Chart.defaults.plugins.tooltip.cornerRadius = 8;
            Chart.defaults.plugins.tooltip.usePointStyle = true;
            Chart.defaults.plugins.tooltip.boxWidth = 8;
            Chart.defaults.plugins.tooltip.boxHeight = 8;
            Chart.defaults.plugins.tooltip.boxPadding = 6;
            Chart.defaults.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.12)';
            Chart.defaults.plugins.tooltip.borderWidth = 1;
            Chart.defaults.plugins.tooltip.caretSize = 6;
            Chart.defaults.plugins.tooltip.caretPadding = 6;
            Chart.defaults.plugins.tooltip.callbacks = {
                title: function(context) {
                    if (!context || !context.length) return '';
                    var lbl = context[0].label;
                    return lbl.toString().toLowerCase().includes('ano') ? lbl : ('Ciclo ' + lbl);
                },
                label: function(context) {
                    var label = context.dataset.label || '';
                    var val = context.raw;
                    if (val === null || val === undefined) return null;
                    var formatted = typeof val === 'number' ? (val >= 50 ? val.toFixed(1) + ' pts' : val.toFixed(1) + ' ★') : val;
                    return ' ' + label + ': ' + formatted;
                }
            };
        } catch(e) {}
    }
    configureGlobalChartTooltips();

    /**
     * Helper de renderização Canvas Nativa de Fallback
     */
    function drawCanvasFallbackChart(canvas, labels, datasets, minY, maxY) {
        if (!canvas || !canvas.getContext) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        var width = (canvas.parentElement && canvas.parentElement.clientWidth > 0) ? canvas.parentElement.clientWidth : 600;
        var height = (canvas.parentElement && canvas.parentElement.clientHeight > 0) ? canvas.parentElement.clientHeight : 280;
        canvas.width = width; canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        var pL = 35, pR = 15, pT = 32, pB = 35;
        var cW = width - pL - pR, cH = height - pT - pB;
        var legendX = pL;
        datasets.forEach(function(ds) {
            if (!ds.label) return;
            var color = ds.borderColor || (typeof ds.backgroundColor === 'string' ? ds.backgroundColor : '#6366f1');
            ctx.fillStyle = color; ctx.beginPath(); ctx.arc(legendX + 5, 12, 4, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#475569'; ctx.font = 'bold 10.5px sans-serif'; ctx.textAlign = 'left';
            ctx.fillText(ds.label, legendX + 13, 15);
            legendX += ctx.measureText(ds.label).width + 25;
        });
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.6)'; ctx.lineWidth = 1;
        for (var i = 0; i <= 4; i++) {
            var y = pT + (cH * i) / 4;
            ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(width - pR, y); ctx.stroke();
            var val = (maxY - ((maxY - minY) * i) / 4).toFixed(1);
            ctx.fillStyle = '#64748b'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
            ctx.fillText(val, pL - 6, y + 3);
        }
        var stepX = cW / labels.length;
        datasets.forEach(function(ds) {
            if (ds.type === 'bar') {
                var barW = Math.min(stepX * 0.35, 20);
                ds.data.forEach(function(val, idx) {
                    if (val === null || val === undefined) return;
                    var x = pL + idx * stepX + stepX / 2 - barW / 2;
                    var h = Math.max(0, ((val - minY) / (maxY - minY)) * cH);
                    ctx.fillStyle = typeof ds.backgroundColor === 'string' ? ds.backgroundColor : '#6366f1';
                    ctx.fillRect(x, pT + cH - h, barW, h);
                    ctx.fillStyle = '#475569'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
                    ctx.fillText(val.toFixed(1), x + barW / 2, pT + cH - h - 4);
                });
            } else if (ds.type === 'line') {
                ctx.beginPath(); var first = true;
                ds.data.forEach(function(val, idx) {
                    if (val === null || val === undefined) return;
                    var x = pL + idx * stepX + stepX / 2;
                    var y = pT + cH - ((val - minY) / (maxY - minY)) * cH;
                    if (first) { ctx.moveTo(x, y); first = false; } else { ctx.lineTo(x, y); }
                });
                ctx.strokeStyle = ds.borderColor || '#10b981'; ctx.lineWidth = 2.5; ctx.stroke();
                ds.data.forEach(function(val, idx) {
                    if (val === null || val === undefined) return;
                    var x = pL + idx * stepX + stepX / 2;
                    var y = pT + cH - ((val - minY) / (maxY - minY)) * cH;
                    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
                    ctx.strokeStyle = ds.borderColor || '#10b981'; ctx.lineWidth = 2; ctx.stroke();
                });
            }
        });
        labels.forEach(function(lbl, idx) {
            var x = pL + idx * stepX + stepX / 2;
            ctx.fillStyle = '#334155'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
            ctx.fillText(lbl, x, height - 10);
        });
    }

    /**
     * Gráfico Histórico de Gonçalves Dias vs Meta INEP
     */
    function renderDashboardGoncalvesDiasChart() {
        var ctxGd = document.getElementById('dashChartGoncalvesDias');
        if (!ctxGd) return;

        var t = (global.ChartTheme && global.ChartTheme.getTheme) ? global.ChartTheme.getTheme() : {
            isDark: false, textPrimary: '#0A1931', textSecondary: '#1A3D63', grid: 'rgba(10, 25, 49, 0.09)',
            iniciais: '#2563EB', iniciaisBg: 'rgba(37, 99, 235, 0.12)',
            finais: '#0D9488', finaisBg: 'rgba(13, 148, 136, 0.12)',
            meta: '#D97706', datalabelIniciais: '#1D4ED8', datalabelFinais: '#0F766E', datalabelMeta: '#B45309'
        };

        var anos = ['2015', '2017', '2019', '2021', '2023', '2025'];
        var iniciaisGd = [4.1, 4.3, 4.7, 4.5, 4.9, 5.0];
        var finaisGd   = [3.5, 3.6, 4.4, 4.2, 4.8, 5.1];
        var metaInep   = [4.3, 4.6, 4.9, 5.2, 5.2, 5.2];

        if (typeof Chart === 'undefined') {
            drawCanvasFallbackChart(ctxGd, anos, [
                { type: 'line', label: 'Anos Iniciais', data: iniciaisGd, borderColor: t.iniciais },
                { type: 'line', label: 'Anos Finais', data: finaisGd, borderColor: t.finais },
                { type: 'line', label: 'Meta INEP', data: metaInep, borderColor: t.meta }
            ], 2, 6);
            return;
        }

        try {
            if (dashGoncalvesDiasChartInstance) dashGoncalvesDiasChartInstance.destroy();

            dashGoncalvesDiasChartInstance = new Chart(ctxGd, {
                type: 'line',
                data: {
                    labels: anos,
                    datasets: [
                        {
                            type: 'line',
                            label: 'Anos Iniciais (Gonçalves Dias)',
                            data: iniciaisGd,
                            borderColor: t.iniciais,
                            backgroundColor: t.iniciaisBg,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.iniciais,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: true,
                            datalabels: {
                                display: true,
                                align: 'top',
                                color: t.datalabelIniciais,
                                font: { weight: '800', size: 10.5 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            type: 'line',
                            label: 'Anos Finais (Gonçalves Dias)',
                            data: finaisGd,
                            borderColor: t.finais,
                            backgroundColor: t.finaisBg,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.finais,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.35,
                            fill: true,
                            datalabels: {
                                display: true,
                                align: 'bottom',
                                color: t.datalabelFinais,
                                font: { weight: '800', size: 10.5 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            type: 'line',
                            label: 'Meta Projetada INEP (Municipal)',
                            data: metaInep,
                            borderColor: t.meta,
                            backgroundColor: t.meta,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.meta,
                            pointBorderWidth: 2,
                            pointRadius: 4,
                            borderWidth: 2,
                            borderDash: [5, 4],
                            tension: 0.35,
                            fill: false,
                            datalabels: {
                                display: true,
                                align: 'top',
                                color: t.datalabelMeta,
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
                        }
                    },
                    scales: {
                        y: {
                            min: 2,
                            max: 6,
                            grid: { color: t.grid },
                            ticks: { stepSize: 1, font: { size: 11, weight: '600' }, color: t.textSecondary }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '700' }, color: t.textPrimary }
                        }
                    }
                }
            });
        } catch(err) {
            console.error('[dashChartGoncalvesDias Error]', err);
            drawCanvasFallbackChart(ctxGd, anos, [
                { type: 'line', label: 'Anos Iniciais', data: iniciaisGd, borderColor: t.iniciais },
                { type: 'line', label: 'Anos Finais', data: finaisGd, borderColor: t.finais },
                { type: 'line', label: 'Meta INEP', data: metaInep, borderColor: t.meta }
            ], 2, 6);
        }
    }

    /**
     * Gráficos de Etapas: Anos Iniciais vs Anos Finais (Maranhão vs INEP)
     */
    function renderDashboardEtapasCharts() {
        var ctxInc = document.getElementById('dashChartIniciais');
        var ctxFin = document.getElementById('dashChartFinais');
        if (!ctxInc || !ctxFin) return;

        var t = (global.ChartTheme && global.ChartTheme.getTheme) ? global.ChartTheme.getTheme() : {
            isDark: false, textPrimary: '#0A1931', textSecondary: '#1A3D63', grid: 'rgba(10, 25, 49, 0.09)',
            iniciais: '#2563EB', finais: '#0D9488', meta: '#D97706',
            datalabelIniciais: '#1D4ED8', datalabelFinais: '#0F766E'
        };

        var anos = ['2007','2009','2011','2013','2015','2017','2019','2021','2023','2025'];
        var iniciaisData = {
            observado: [3.5, 3.7, 3.9, 3.9, 4.4, 4.5, 4.7, 4.7, 5.1, 5.5],
            projetado: [2.8, 3.1, 3.5, 3.8, 4.1, 4.4, 4.7, 5.0, 5.0, null]
        };
        var finaisData = {
            observado: [3.2, 3.3, 3.4, 3.4, 3.7, 3.7, 4.0, 4.2, 4.3, 4.5],
            projetado: [2.9, 3.0, 3.3, 3.7, 4.1, 4.3, 4.6, 4.9, 4.9, null]
        };

        if (typeof Chart === 'undefined') {
            drawCanvasFallbackChart(ctxInc, anos, [
                { type: 'bar', label: 'Maranhão (Observado)', data: iniciaisData.observado, backgroundColor: t.iniciais },
                { type: 'line', label: 'Meta Projetada (INEP)', data: iniciaisData.projetado, borderColor: t.meta }
            ], 0, 10);

            drawCanvasFallbackChart(ctxFin, anos, [
                { type: 'bar', label: 'Maranhão (Observado)', data: finaisData.observado, backgroundColor: t.finais },
                { type: 'line', label: 'Meta Projetada (INEP)', data: finaisData.projetado, borderColor: t.meta }
            ], 0, 10);
            return;
        }

        try {
            if (dashIniciaisChartInstance) dashIniciaisChartInstance.destroy();
            if (dashFinaisChartInstance) dashFinaisChartInstance.destroy();

            // Canvas 1 (Anos Iniciais) Gradient
            var bgGradInc = t.iniciais;
            try {
                var g = ctxInc.getContext('2d').createLinearGradient(0, 0, 0, 260);
                if (t.isDark) {
                    g.addColorStop(0, '#7FB3E0');
                    g.addColorStop(1, '#3B82F6');
                } else {
                    g.addColorStop(0, '#3B82F6');
                    g.addColorStop(1, '#1D4ED8');
                }
                bgGradInc = g;
            } catch(e) {}

            dashIniciaisChartInstance = new Chart(ctxInc, {
                type: 'bar',
                data: {
                    labels: anos,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Maranhão (Observado)',
                            data: iniciaisData.observado,
                            backgroundColor: bgGradInc,
                            borderRadius: 8,
                            borderSkipped: false,
                            barPercentage: 0.65,
                            categoryPercentage: 0.8,
                            datalabels: {
                                display: true,
                                anchor: 'end',
                                align: 'top',
                                color: t.datalabelIniciais,
                                font: { weight: '800', size: 11 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            type: 'line',
                            label: 'Meta Projetada (INEP)',
                            data: iniciaisData.projetado,
                            borderColor: t.meta,
                            backgroundColor: t.meta,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.meta,
                            pointBorderWidth: 2.5,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            borderWidth: 2.5,
                            borderDash: [5, 4],
                            tension: 0.3,
                            datalabels: {
                                display: true,
                                align: 'center',
                                anchor: 'center',
                                color: t.isDark ? '#0A1931' : '#FFFFFF',
                                backgroundColor: t.meta,
                                borderRadius: 6,
                                font: { weight: '800', size: 10, family: 'var(--font-mono)' },
                                padding: { top: 3, bottom: 3, left: 6, right: 6 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 28, bottom: 8, left: 4, right: 4 } },
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
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 10,
                            grid: { color: t.grid },
                            ticks: { stepSize: 1, font: { size: 11, weight: '600' }, color: t.textSecondary }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '700' }, color: t.textPrimary }
                        }
                    }
                }
            });

            // Canvas 2 (Anos Finais) Gradient
            var bgGradFin = t.finais;
            try {
                var g2 = ctxFin.getContext('2d').createLinearGradient(0, 0, 0, 260);
                if (t.isDark) {
                    g2.addColorStop(0, '#5FD3C4');
                    g2.addColorStop(1, '#0D9488');
                } else {
                    g2.addColorStop(0, '#0D9488');
                    g2.addColorStop(1, '#047857');
                }
                bgGradFin = g2;
            } catch(e) {}

            dashFinaisChartInstance = new Chart(ctxFin, {
                type: 'bar',
                data: {
                    labels: anos,
                    datasets: [
                        {
                            type: 'bar',
                            label: 'Maranhão (Observado)',
                            data: finaisData.observado,
                            backgroundColor: bgGradFin,
                            borderRadius: 8,
                            borderSkipped: false,
                            barPercentage: 0.65,
                            categoryPercentage: 0.8,
                            datalabels: {
                                display: true,
                                anchor: 'end',
                                align: 'top',
                                color: t.datalabelFinais,
                                font: { weight: '800', size: 11 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            type: 'line',
                            label: 'Meta Projetada (INEP)',
                            data: finaisData.projetado,
                            borderColor: t.meta,
                            backgroundColor: t.meta,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.meta,
                            pointBorderWidth: 2.5,
                            pointRadius: 5,
                            pointHoverRadius: 7,
                            borderWidth: 2.5,
                            borderDash: [5, 4],
                            tension: 0.3,
                            datalabels: {
                                display: true,
                                align: 'center',
                                anchor: 'center',
                                color: t.isDark ? '#0A1931' : '#FFFFFF',
                                backgroundColor: t.meta,
                                borderRadius: 6,
                                font: { weight: '800', size: 10, family: 'var(--font-mono)' },
                                padding: { top: 3, bottom: 3, left: 6, right: 6 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { top: 28, bottom: 8, left: 4, right: 4 } },
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
                        }
                    },
                    scales: {
                        y: {
                            min: 0,
                            max: 10,
                            grid: { color: t.grid },
                            ticks: { stepSize: 1, font: { size: 11, weight: '600' }, color: t.textSecondary }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '700' }, color: t.textPrimary }
                        }
                    }
                }
            });
        } catch(err) {
            console.error('[renderDashboardEtapasCharts Error]', err);
            drawCanvasFallbackChart(ctxInc, anos, [
                { type: 'bar', label: 'Maranhão (Observado)', data: iniciaisData.observado, backgroundColor: t.iniciais },
                { type: 'line', label: 'Meta Projetada (INEP)', data: iniciaisData.projetado, borderColor: t.meta }
            ], 0, 10);

            drawCanvasFallbackChart(ctxFin, anos, [
                { type: 'bar', label: 'Maranhão (Observado)', data: finaisData.observado, backgroundColor: t.finais },
                { type: 'line', label: 'Meta Projetada (INEP)', data: finaisData.projetado, borderColor: t.meta }
            ], 0, 10);
        }
    }

    /**
     * Gráfico Comparativo: Anos Iniciais vs Anos Finais
     */
    function renderDashboardComparativoChart() {
        var ctxComp = document.getElementById('dashChartComparativo');
        if (!ctxComp) return;

        var t = (global.ChartTheme && global.ChartTheme.getTheme) ? global.ChartTheme.getTheme() : {
            isDark: false, textPrimary: '#0A1931', textSecondary: '#1A3D63', grid: 'rgba(10, 25, 49, 0.09)',
            iniciais: '#2563EB', iniciaisBg: 'rgba(37, 99, 235, 0.12)',
            finais: '#0D9488', finaisBg: 'rgba(13, 148, 136, 0.12)',
            datalabelIniciais: '#1D4ED8', datalabelFinais: '#0F766E'
        };

        var anos = ['2007','2009','2011','2013','2015','2017','2019','2021','2023','2025'];
        var iniciaisData = [3.4, 3.7, 3.9, 3.9, 4.1, 4.1, 4.6, 4.6, 5.0, 5.5];
        var finaisData   = [3.0, 3.2, 3.3, 3.3, 3.6, 3.6, 4.0, 4.2, 4.3, 4.5];

        if (typeof Chart === 'undefined') {
            drawCanvasFallbackChart(ctxComp, anos, [
                { type: 'line', label: 'Anos Iniciais', data: iniciaisData, borderColor: t.iniciais },
                { type: 'line', label: 'Anos Finais', data: finaisData, borderColor: t.finais }
            ], 2, 6);
            return;
        }

        try {
            if (dashComparativoChartInstance) dashComparativoChartInstance.destroy();

            dashComparativoChartInstance = new Chart(ctxComp, {
                type: 'line',
                data: {
                    labels: anos,
                    datasets: [
                        {
                            label: 'Anos Iniciais',
                            data: iniciaisData,
                            borderColor: t.iniciais,
                            backgroundColor: t.iniciaisBg,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.iniciais,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.3,
                            fill: true,
                            datalabels: {
                                display: true,
                                align: 'top',
                                color: t.datalabelIniciais,
                                font: { weight: '800', size: 10 },
                                formatter: function(v) { return v ? v.toFixed(1) : ''; }
                            }
                        },
                        {
                            label: 'Anos Finais',
                            data: finaisData,
                            borderColor: t.finais,
                            backgroundColor: t.finaisBg,
                            pointBackgroundColor: t.isDark ? '#0A1931' : '#FFFFFF',
                            pointBorderColor: t.finais,
                            pointBorderWidth: 2.5,
                            pointRadius: 4.5,
                            borderWidth: 2.5,
                            tension: 0.3,
                            fill: true,
                            datalabels: {
                                display: true,
                                align: 'bottom',
                                color: t.datalabelFinais,
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
                        }
                    },
                    scales: {
                        y: {
                            min: 2,
                            max: 6,
                            grid: { color: t.grid },
                            ticks: { stepSize: 1, font: { size: 11, weight: '600' }, color: t.textSecondary }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11, weight: '700' }, color: t.textPrimary }
                        }
                    }
                }
            });
        } catch(err) {
            console.error('[dashChartComparativo Error]', err);
            drawCanvasFallbackChart(ctxComp, anos, [
                { type: 'line', label: 'Anos Iniciais', data: iniciaisData, borderColor: t.iniciais },
                { type: 'line', label: 'Anos Finais', data: finaisData, borderColor: t.finais }
            ], 2, 6);
        }
    }

    // Exposição Global
    global.configureGlobalChartTooltips = configureGlobalChartTooltips;
    global.drawCanvasFallbackChart = drawCanvasFallbackChart;
    global.renderDashboardGoncalvesDiasChart = renderDashboardGoncalvesDiasChart;
    global.renderDashboardEtapasCharts = renderDashboardEtapasCharts;
    global.renderDashboardComparativoChart = renderDashboardComparativoChart;
    global.dashChartInstances = {
        getGoncalvesDias: function() { return dashGoncalvesDiasChartInstance; },
        getIniciais: function() { return dashIniciaisChartInstance; },
        getFinais: function() { return dashFinaisChartInstance; },
        getComparativo: function() { return dashComparativoChartInstance; }
    };

})(typeof window !== 'undefined' ? window : this);
