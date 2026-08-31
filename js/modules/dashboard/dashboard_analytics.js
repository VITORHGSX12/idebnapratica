/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — DASHBOARD ANALYTICS & VISUALIZAÇÕES
 * Arquivo: js/modules/dashboard/dashboard_analytics.js
 * Descrição: Gráficos de trajetória histórica do IDEB, descritores prioritários,
 *            distribuição nos 4 níveis de proficiência SAEB e ranking de escolas.
 * ============================================================================
 */

(function(global) {
    'use strict';

    /**
     * Renderiza o gráfico vetorial SVG da linha do tempo histórica do IDEB
     */
    function renderDashboardTimelineChart() {
        var container = document.getElementById('dashboard-ideb-chart-container');
        if (!container) return;

        var historyPoints = [
            { year: '2015', score: 3.4, target: 3.6 },
            { year: '2017', score: 3.8, target: 4.1 },
            { year: '2019', score: 4.2, target: 4.5 },
            { year: '2021', score: 4.5, target: 4.8 },
            { year: '2023', score: 4.8, target: 5.1 },
            { year: 'SAEB 25', score: 5.2, target: 5.5, isOfficial: true }
        ];

        var events = typeof global.getStoredEvents === 'function' ? global.getStoredEvents() : [];
        var finishedEvents = events.filter(function(e) { return e.status === 'finalizados' || e.mediaScore; });
        if (finishedEvents.length > 0) {
            var lastSim = finishedEvents[0];
            historyPoints.push({
                year: '1º Simulado',
                score: parseFloat(lastSim.mediaScore || 5.4),
                target: 5.5,
                isSim: true
            });
        }

        var width = 540;
        var height = 220;
        var paddingLeft = 50;
        var paddingRight = 40;
        var paddingTop = 30;
        var paddingBottom = 40;

        var minScore = 3.0;
        var maxScore = 6.0;

        var getX = function(idx, total) { return paddingLeft + (idx * ((width - paddingLeft - paddingRight) / (total - 1 || 1))); };
        var getY = function(val) { return paddingTop + (height - paddingTop - paddingBottom) * (1 - (val - minScore) / (maxScore - minScore)); };

        var observedPath = '';
        var targetPath = '';
        var circlesHtml = '';
        var labelsHtml = '';

        var t = (global.ChartTheme && global.ChartTheme.getTheme) ? global.ChartTheme.getTheme() : {
            isDark: false, textPrimary: '#0A1931', textSecondary: '#1A3D63', textMuted: '#4A7FA7', grid: 'rgba(10, 25, 49, 0.09)',
            iniciais: '#2563EB', finais: '#0D9488', meta: '#D97706'
        };

        var colorObs = t.iniciais;
        var colorSim = t.finais;
        var colorMeta = t.meta;
        var gridStroke = t.grid;
        var textMuted = t.isDark ? '#B3CFE5' : '#64748B';

        historyPoints.forEach(function(pt, idx) {
            var x = getX(idx, historyPoints.length);
            var yObs = getY(pt.score);
            var yTgt = getY(pt.target);

            if (idx === 0) {
                observedPath += 'M ' + x + ' ' + yObs;
                targetPath += 'M ' + x + ' ' + yTgt;
            } else {
                observedPath += ' L ' + x + ' ' + yObs;
                targetPath += ' L ' + x + ' ' + yTgt;
            }

            var color = pt.isSim ? colorSim : colorObs;
            circlesHtml += `
                <circle cx="${x}" cy="${yObs}" r="5" fill="${color}" stroke="${t.isDark ? '#0A1931' : '#FFFFFF'}" stroke-width="2">
                    <title>${pt.year}: ${pt.score}</title>
                </circle>
                <text x="${x}" y="${yObs - 9}" text-anchor="middle" font-size="10" font-weight="700" fill="${color}" font-family="var(--font-display)">${pt.score}</text>
            `;

            labelsHtml += `
                <text x="${x}" y="${height - 10}" text-anchor="middle" font-size="11" font-weight="${pt.isSim ? '700' : '500'}" fill="${t.textPrimary}">${pt.year}</text>
            `;
        });

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" width="100%" height="210" style="overflow: visible; font-family: var(--font-body);">
                <line x1="${paddingLeft}" y1="${getY(6.0)}" x2="${width - paddingRight}" y2="${getY(6.0)}" stroke="${gridStroke}" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(6.0) + 3}" fill="${textMuted}" font-size="10" font-weight="600" text-anchor="end">6.0</text>

                <line x1="${paddingLeft}" y1="${getY(5.0)}" x2="${width - paddingRight}" y2="${getY(5.0)}" stroke="${gridStroke}" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(5.0) + 3}" fill="${textMuted}" font-size="10" font-weight="600" text-anchor="end">5.0</text>

                <line x1="${paddingLeft}" y1="${getY(4.0)}" x2="${width - paddingRight}" y2="${getY(4.0)}" stroke="${gridStroke}" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(4.0) + 3}" fill="${textMuted}" font-size="10" font-weight="600" text-anchor="end">4.0</text>

                <line x1="${paddingLeft}" y1="${getY(3.0)}" x2="${width - paddingRight}" y2="${getY(3.0)}" stroke="${gridStroke}" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(3.0) + 3}" fill="${textMuted}" font-size="10" font-weight="600" text-anchor="end">3.0</text>

                <path d="${targetPath}" fill="none" stroke="${colorMeta}" stroke-width="1.75" stroke-dasharray="4,4"/>
                <path d="${observedPath}" fill="none" stroke="${colorObs}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                
                ${circlesHtml}
                ${labelsHtml}
            </svg>
            
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: var(--text-xs); font-weight: 600;">
                <span style="display: flex; align-items: center; gap: 6px; color: ${colorObs};">
                    <span style="width: 12px; height: 3px; background: ${colorObs}; border-radius: 2px;"></span> IDEB Observado / Simulado
                </span>
                <span style="display: flex; align-items: center; gap: 6px; color: ${colorMeta};">
                    <span style="width: 12px; height: 2px; border-top: 2px dashed ${colorMeta};"></span> Meta Projetada INEP
                </span>
            </div>
        `;
    }

    /**
     * Renderiza os Descritores Prioritários no Dashboard
     */
    function renderDashboardPriorityDescriptors() {
        var container = document.getElementById('dashboard-priority-descriptors-container');
        if (!container) return;

        var hasSimuladoWithAnswers = false;
        try {
            var savedRespostas = (typeof localStorage !== 'undefined' && localStorage.getItem) ? localStorage.getItem('gd_simulado_respostas_db') : null;
            if (savedRespostas && savedRespostas !== '{}' && savedRespostas !== '[]') {
                hasSimuladoWithAnswers = true;
            }
        } catch (e) {}

        if (!hasSimuladoWithAnswers) {
            container.innerHTML = `
                <div style="padding: 24px; text-align: center; color: var(--color-text-secondary); background: var(--color-surface-subtle); border-radius: var(--radius-md); border: 1px dashed var(--color-border-strong);">
                    <div style="width: 36px; height: 36px; margin: 0 auto 8px auto; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted);">
                        <i data-lucide="bar-chart-3"></i>
                    </div>
                    <div style="font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px; font-size: var(--text-body);">Nenhum simulado com respostas lançado</div>
                    <div style="font-size: var(--text-sm); color: var(--color-text-muted); line-height: 1.4;">
                        Os descritores de maior defasagem serão consolidados automaticamente após o lançamento de provas diagnósticas.
                    </div>
                </div>
            `;
            if (window.lucide && typeof lucide.createIcons === 'function') {
                try { lucide.createIcons(); } catch(e) {}
            }
            return;
        }

        var descriptors = [
            { code: 'D01', disc: 'Português', desc: 'Localizar informações explícitas em um texto', pct: '42.5%', status: 'Crítico', badgeClass: 'badge-status-critical' },
            { code: 'D13', disc: 'Matemática', desc: 'Reconhecer figuras geométricas bidimensionais', pct: '48.0%', status: 'Crítico', badgeClass: 'badge-status-critical' },
            { code: 'D03', disc: 'Português', desc: 'Inferir o sentido de uma palavra ou expressão', pct: '54.2%', status: 'Alerta', badgeClass: 'badge-status-warning' },
            { code: 'D26', disc: 'Matemática', desc: 'Resolver problemas com frações e decimais', pct: '58.7%', status: 'Alerta', badgeClass: 'badge-status-warning' }
        ];

        container.innerHTML = descriptors.map(function(d) {
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); margin-bottom: 8px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="font-family: var(--font-mono); font-size: var(--text-sm); color: var(--color-brand-primary);">${d.code}</strong>
                            <span style="font-size: var(--text-xs); color: var(--color-text-muted); font-weight: 600;">${d.disc}</span>
                        </div>
                        <p style="margin: 3px 0 0 0; font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.3;">${d.desc}</p>
                    </div>
                    <div style="text-align: right; min-width: 80px;">
                        <span style="font-family: var(--font-display); font-size: 1rem; font-weight: 800; color: var(--color-text-primary); font-variant-numeric: tabular-nums;">${d.pct}</span>
                        <div style="margin-top: 2px;">
                            <span class="badge ${d.badgeClass}">${d.status}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    /**
     * Renderiza a distribuição qualitativa de alunos por proficiência
     */
    function renderDashboardProficiency() {
        var container = document.getElementById('dashboard-proficiency-container');
        if (!container) return;

        var levelMeta = {
            avancado: { name: 'Avançado', color: 'var(--color-status-advanced)', bg: 'var(--color-status-advanced-bg)' },
            adequado: { name: 'Proficiente', color: 'var(--color-status-success)', bg: 'var(--color-status-success-bg)' },
            basico:   { name: 'Básico', color: 'var(--color-status-warning)', bg: 'var(--color-status-warning-bg)' },
            abaixo:   { name: 'Abaixo do Básico', color: 'var(--color-status-critical)', bg: 'var(--color-status-critical-bg)' }
        };

        var proficiencyCycles = [
            { year: 2019, adequadoPct: 22, nextDelta: -5, levels: { avancado: { pct: 5, alunos: 4671 }, adequado: { pct: 18, alunos: 17779 }, basico: { pct: 41, alunos: 41370 }, abaixo: { pct: 37, alunos: 37494 } } },
            { year: 2021, adequadoPct: 17, nextDelta: 9, levels: { avancado: { pct: 3, alunos: 2902 }, adequado: { pct: 14, alunos: 13714 }, basico: { pct: 39, alunos: 36991 }, abaixo: { pct: 44, alunos: 41381 } } },
            { year: 2023, adequadoPct: 26, nextDelta: null, levels: { avancado: { pct: 7, alunos: 5973 }, adequado: { pct: 19, alunos: 15496 }, basico: { pct: 37, alunos: 30540 }, abaixo: { pct: 36, alunos: 29774 } } }
        ];

        var legendItems = [
            { key: 'avancado', desc: 'Aprendizado além da expectativa. Alunos com domínio pleno das competências da etapa.' },
            { key: 'adequado', desc: 'Alunos que desenvolveram as competências essenciais e necessárias para progressão.' },
            { key: 'basico', desc: 'Alunos que desenvolveram parcialmente as habilidades. Recomendam-se planos de recomposição.' },
            { key: 'abaixo', desc: 'Alunos com defasagens graves de aprendizagem. Exigem intervenção pedagógica prioritária.' }
        ];

        var cyclesHtml = proficiencyCycles.map(function(c) {
            var levelsKeys = ['avancado', 'adequado', 'basico', 'abaixo'];
            var levelsHtml = levelsKeys.map(function(key) {
                var l = c.levels[key] || { pct: 0, alunos: 0 };
                var meta = levelMeta[key];
                return `
                    <div style="padding: 8px 0; border-bottom: 1px solid var(--color-border-subtle);">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-family: var(--font-display); font-weight: 700; font-size: 0.95rem; color: ${meta.color};">${l.pct}%</span>
                            <span style="font-size: var(--text-xs); color: var(--color-text-muted); font-variant-numeric: tabular-nums;">(${l.alunos.toLocaleString('pt-BR')} alunos)</span>
                        </div>
                        <div style="height: 5px; border-radius: 4px; background: var(--color-surface-subtle); overflow: hidden; margin: 4px 0;">
                            <div style="height: 100%; border-radius: 4px; width: ${l.pct}%; background: ${meta.color};"></div>
                        </div>
                        <div style="font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 600;">${meta.name}</div>
                    </div>
                `;
            }).join('');

            var deltaChip = (c.nextDelta === null || c.nextDelta === undefined) ? '' :
                `<span class="badge ${c.nextDelta > 0 ? 'badge-status-success' : 'badge-status-critical'}" style="position: absolute; top: 10px; right: 10px;">${c.nextDelta > 0 ? '+' : ''}${c.nextDelta} pts</span>`;

            return `
                <div style="border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); overflow: hidden; background: var(--color-surface-card);">
                    <div style="padding: 14px 10px; text-align: center; position: relative; background: var(--color-surface-subtle); border-bottom: 1px solid var(--color-border-subtle);">
                        ${deltaChip}
                        <div style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; line-height: 1.1; color: var(--color-brand-primary);">${c.adequadoPct}%</div>
                        <div style="font-size: var(--text-xs); font-weight: 600; margin-top: 3px; color: var(--color-text-secondary);">Aprendizado Adequado</div>
                    </div>
                    <div style="padding: 10px 14px 2px; font-weight: 700; font-size: 0.85rem; color: var(--color-brand-primary);">${c.year}</div>
                    <div style="padding: 2px 14px 12px;">${levelsHtml}</div>
                </div>
            `;
        }).join('');

        var legendHtml = legendItems.map(function(it) {
            var meta = levelMeta[it.key];
            return `
                <div style="display: flex; gap: 10px; margin-bottom: 12px; padding: 10px; border-radius: var(--radius-sm); background: var(--color-surface-subtle); border: 1px solid var(--color-border-subtle);">
                    <span style="width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; background: ${meta.color};"></span>
                    <div>
                        <div style="font-weight: 700; font-size: var(--text-sm); margin-bottom: 2px; color: var(--color-brand-primary);">${meta.name}</div>
                        <div style="font-size: var(--text-xs); color: var(--color-text-secondary); line-height: 1.4;">${it.desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="grid-2" style="display: grid; grid-template-columns: 2.1fr 1fr; gap: 16px; width: 100%;">
                <div class="card card-full" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 20px;">
                    <div class="card-header" style="margin-bottom: 12px;">
                        <h3 style="font-size: var(--text-title-md); font-weight: 700; color: var(--color-brand-primary); margin: 0;">Distribuição dos Alunos por Nível de Proficiência</h3>
                        <p class="card-subtitle" style="font-size: var(--text-sm); color: var(--color-text-secondary); margin: 3px 0 0 0;">Posicionamento do aprendizado nos 4 padrões oficiais do SAEB / INEP.</p>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 12px; margin-top: 14px;">${cyclesHtml}</div>
                </div>

                <div class="card card-full" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); padding: 20px;">
                    <div class="card-header" style="margin-bottom: 12px;">
                        <h3 style="font-size: var(--text-title-md); font-weight: 700; color: var(--color-brand-primary); margin: 0;">Escala Qualitativa SAEB</h3>
                    </div>
                    <div>${legendHtml}</div>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza o ranking resumido das escolas da rede no Dashboard
     */
    function renderDashboardSchoolsRanking() {
        var tbody = document.getElementById('dashboard-schools-ranking-body');
        if (!tbody) return;

        var schools = typeof global.getOfficialSchoolsState === 'function' ? global.getOfficialSchoolsState() : [];
        if (!schools || schools.length === 0) {
            schools = [
                { name: 'UI JOSE CORREA LIMA', inep: '21128723', ideb: 5.4, meta: 5.5, status: 'Próxima da Meta' },
                { name: 'UI BASILIO ALVES', inep: '21128120', ideb: 5.2, meta: 5.5, status: 'Em Evolução' },
                { name: 'U.E. BENTA VILANOVA', inep: '21128154', ideb: 5.1, meta: 5.5, status: 'Em Evolução' },
                { name: 'U.E. RAIMUNDO VELOSO BARROS', inep: '21128456', ideb: 4.9, meta: 5.5, status: 'Foco Pedagógico' }
            ];
        }

        var topSchools = schools.slice(0, 5);
        tbody.innerHTML = topSchools.map(function(sch, idx) {
            var positionLabel = '#' + (idx + 1);
            var safeName = typeof global.escapeHtml === 'function' ? global.escapeHtml(sch.name) : sch.name;
            var zoneLabel = sch.zone || 'Zona Rural';
            var statusLabel = sch.status || 'Ativa';
            var badgeClass = statusLabel === 'Ativa' ? 'badge-status-success' : (statusLabel === 'Em manutenção' ? 'badge-status-warning' : 'badge-neutral');

            return `
                <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 48px;">
                    <td style="padding: 10px 16px; font-weight: 700; color: var(--color-text-secondary); text-align: center; font-family: var(--font-mono); font-size: var(--text-xs);">
                        ${positionLabel}
                    </td>
                    <td style="padding: 10px 16px;">
                        <strong style="font-size: var(--text-body); color: var(--color-text-primary); display: block;">${safeName}</strong>
                        <span style="font-size: var(--text-xs); color: var(--color-text-muted); font-family: var(--font-mono);">INEP: ${sch.inep || sch.codigo_inep || '-'}</span>
                    </td>
                    <td style="padding: 10px 16px;">
                        <span class="badge badge-neutral">
                            ${zoneLabel}
                        </span>
                    </td>
                    <td style="padding: 10px 16px; text-align: center;">
                        <span class="badge ${badgeClass}">
                            ${statusLabel.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 10px 16px; text-align: right;">
                        <button type="button" onclick="openSchoolWorkspace('${sch.name.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 10px; height: 30px;">
                            <span>Ver Unidade</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Exposição no Escopo Global
    global.renderDashboardTimelineChart = renderDashboardTimelineChart;
    global.renderDashboardPriorityDescriptors = renderDashboardPriorityDescriptors;
    global.renderDashboardProficiency = renderDashboardProficiency;
    global.renderDashboardSchoolsRanking = renderDashboardSchoolsRanking;

})(typeof window !== 'undefined' ? window : this);
