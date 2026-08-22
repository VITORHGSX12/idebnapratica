// =========================================================================
// DASHBOARD KPIS & INDICADORES EXECUTIVOS (MODULAR ENGINE)
// Responsabilidade: Renderização dos cards de métricas do topo (IDEB Projetado,
// Proficiência Média, Taxa de Aprovação), barra de monitoramento do PDE,
// linha do tempo histórica de Gonçalves Dias, descritores prioritários,
// distribuição por proficiência e ranking escolar resumido da rede.
// =========================================================================

(function(global) {
    'use strict';

    function getPdeGoalsState() {
        try {
            var saved = localStorage.getItem('gd_pde_goals_db');
            if (saved) return JSON.parse(saved);
        } catch(e) {}
        return null;
    }

    /**
     * Renderiza os 3 cards de métricas principais do Dashboard
     * adaptados dinamicamente ao perfil (Professor, Diretor ou Gestor/Admin)
     */
    function renderDashboardMetricCards() {
        var container = document.getElementById('dashboard-metric-cards-container');
        if (!container) return;

        var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        var userEscola = sessionStorage.getItem('userEscola') || 'UI JOSE CORREA LIMA';
        var userTurma = sessionStorage.getItem('userTurma') || '5º Ano A';
        var isDirector = userRole === 'Diretor Escola';
        var isTeacher = userRole === 'Professor' || userRole === 'Professor AEE';

        // 1. VISÃO DO DIRETOR ESCOLAR (Escopo: Unidade Escolar)
        if (isDirector) {
            container.innerHTML = `
                <!-- Card 1: IDEB Projetado vs Meta -->
                <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                    <div class="metric-header">
                        <span class="metric-title">IDEB Projetado vs. Meta</span>
                        <div class="metric-icon purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 18 18"/><path d="m13 3 8 8-4 4-8-8Z"/></svg></div>
                    </div>
                    <div class="metric-value" style="color: var(--green-light); font-weight: 800; font-size: 2.2rem;">5.4 ★</div>
                    <div class="metric-footer">
                        <span class="trend" style="color: #f59e0b; font-weight: 700; font-size: 0.8rem;">Gap: -0.4</span>
                        <span class="trend-label" style="margin-left: auto;">Meta 2026: <strong>5.8</strong></span>
                    </div>
                </div>

                <!-- Card 2: Proficiência Média (LP / MAT) -->
                <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                    <div class="metric-header">
                        <span class="metric-title">Proficiência Média (LP / MAT)</span>
                        <div class="metric-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
                    </div>
                    <div class="metric-value" style="color: var(--text-primary); font-weight: 800; font-size: 2.2rem;">231.3 pts</div>
                    <div class="metric-footer">
                        <span class="trend-label" style="font-size: 0.78rem;">LP: <strong>224.5</strong> • MAT: <strong>238.1</strong></span>
                    </div>
                </div>

                <!-- Card 3: Taxa de Domínio de Descritores (%) -->
                <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                    <div class="metric-header">
                        <span class="metric-title">Taxa de Domínio de Descritores</span>
                        <div class="metric-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div>
                    </div>
                    <div class="metric-value" style="color: #10b981; font-weight: 800; font-size: 2.2rem;">64.8%</div>
                    <div class="metric-footer">
                        <span class="trend-label">Média global de acertos em itens SAEB</span>
                    </div>
                </div>
            `;
            return;
        }

        // 2. VISÃO DO PROFESSOR (Escopo: Turma sob regência)
        if (isTeacher) {
            container.innerHTML = `
                <!-- Card 1: Desempenho Médio da Turma -->
                <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                    <div class="metric-header">
                        <span class="metric-title">Desempenho Geral da Turma</span>
                        <div class="metric-icon purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                    </div>
                    <div class="metric-value" style="color: var(--text-primary); font-weight: 800; font-size: 2.2rem;">68.2%</div>
                    <div class="metric-footer">
                        <span class="trend up" style="color: #10b981; font-weight: 700; font-size: 0.8rem;">+4.5%</span>
                        <span class="trend-label" style="margin-left: auto;">vs. Simulado Diagnóstico 1</span>
                    </div>
                </div>

                <!-- Card 2: Alunos em Nível Crítico / Recomposição -->
                <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                    <div class="metric-header">
                        <span class="metric-title">Foco de Recomposição</span>
                        <div class="metric-icon red" style="background: rgba(239, 68, 68, 0.12); color: #ef4444;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                    </div>
                    <div class="metric-value" style="color: #ef4444; font-weight: 800; font-size: 2.2rem;">6 alunos</div>
                    <div class="metric-footer">
                        <span class="trend-label">Nível Insuficiente em Descritores de Leitura</span>
                    </div>
                </div>

                <!-- Card 3: Aulas do Cronograma Executadas -->
                <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                    <div class="metric-header">
                        <span class="metric-title">Execução do Cronograma</span>
                        <div class="metric-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg></div>
                    </div>
                    <div class="metric-value" style="color: #10b981; font-weight: 800; font-size: 2.2rem;">82.5%</div>
                    <div class="metric-footer">
                        <span class="trend-label">33 de 40 habilidades SAEB trabalhadas</span>
                    </div>
                </div>
            `;
            return;
        }

        // 3. VISÃO DO GESTOR DA REDE / ADMIN (Escopo: Rede Municipal de Gonçalves Dias)
        var pde = getPdeGoalsState();
        var idebVal = '5.2 ★';
        var idebSub = 'Meta 2026: <strong>5.5</strong>';
        var profVal = '228.4 pts';
        var profSub = 'LP: <strong>221.8</strong> • MAT: <strong>235.1</strong>';
        var fluxoVal = '96.2%';
        var fluxoSub = 'Taxa de rendimento escolar consolidada';

        if (pde && pde.currentScore) {
            idebVal = Number(pde.currentScore).toFixed(1) + ' ★';
            idebSub = 'Meta Pactuada: <strong>' + (pde.metaIdeb || '5.5') + '</strong>';
        }

        container.innerHTML = `
            <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                <div class="metric-header">
                    <span class="metric-title">IDEB Projetado vs. Meta</span>
                    <div class="metric-icon purple"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 3 18 18"/><path d="m13 3 8 8-4 4-8-8Z"/></svg></div>
                </div>
                <div class="metric-value" style="color: var(--green-light); font-weight: 800; font-size: 2.2rem;">${idebVal}</div>
                <div class="metric-footer">
                    <span class="trend up" style="color: #10b981; font-weight: 700; font-size: 0.8rem;">+0.4</span>
                    <span class="trend-label" style="margin-left: auto;">${idebSub}</span>
                </div>
            </div>

            <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                <div class="metric-header">
                    <span class="metric-title">Proficiência Média da Rede</span>
                    <div class="metric-icon blue"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
                </div>
                <div class="metric-value" style="color: var(--text-primary); font-weight: 800; font-size: 2.2rem;">${profVal}</div>
                <div class="metric-footer">
                    <span class="trend-label" style="font-size: 0.78rem;">${profSub}</span>
                </div>
            </div>

            <div class="metric-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary);">
                <div class="metric-header">
                    <span class="metric-title">Taxa de Aprovação (Fluxo)</span>
                    <div class="metric-icon green"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg></div>
                </div>
                <div class="metric-value" style="color: #10b981; font-weight: 800; font-size: 2.2rem;">${fluxoVal}</div>
                <div class="metric-footer">
                    <span class="trend-label">${fluxoSub}</span>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza o progresso da meta do Plano de Desenvolvimento da Educação (PDE)
     */
    function renderDashboardPdeProgress() {
        var container = document.getElementById('dashboard-pde-progress-container');
        if (!container) return;

        var pde = getPdeGoalsState();
        var currentScore = pde && pde.currentScore ? pde.currentScore : 5.2;
        var targetScore = pde && pde.metaIdeb ? pde.metaIdeb : 5.5;
        var progressPct = Math.min(100, Math.max(0, (currentScore / targetScore) * 100)).toFixed(1);
        var gap = (currentScore - targetScore).toFixed(1);

        container.innerHTML = `
            <div class="card card-full" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 12px;">
                    <div>
                        <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(245, 158, 11, 0.12); color: #d97706; padding: 3px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; margin-bottom: 4px;">
                            ⚡ MONITORAMENTO DE TRAJETÓRIA DO CICLO
                        </div>
                        <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary);">
                            Meta Pactuada vs. Desempenho Observado (Gonçalves Dias)
                        </h3>
                        <p style="margin: 2px 0 0 0; font-size: 0.82rem; color: var(--text-secondary);">
                            Acompanhamento do índice obtido em relação à meta projetada pelo INEP e plano de recomposição de aprendizagem.
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted);">GAP ATUAL DA REDE</div>
                        <div style="font-size: 1.45rem; font-weight: 800; color: ${gap >= 0 ? '#10b981' : '#f59e0b'};">${gap} pontos</div>
                    </div>
                </div>

                <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 700; margin-bottom: 6px;">
                        <span style="color: var(--text-secondary);">Progresso para a Meta (${targetScore})</span>
                        <span style="color: #6366f1;">${progressPct}% da meta alcançada (${currentScore} / ${targetScore})</span>
                    </div>
                    <div style="height: 14px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; position: relative;">
                        <div style="width: ${progressPct}%; height: 100%; background: linear-gradient(90deg, #6366f1, #10b981); border-radius: 6px;"></div>
                    </div>
                </div>
            </div>
        `;
    }

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

            var color = pt.isSim ? '#10b981' : '#6366f1';
            circlesHtml += `
                <circle cx="${x}" cy="${yObs}" r="5.5" fill="${color}" stroke="#fff" stroke-width="2">
                    <title>${pt.year}: ${pt.score}</title>
                </circle>
                <text x="${x}" y="${yObs - 10}" text-anchor="middle" font-size="10" font-weight="800" fill="${color}">${pt.score}</text>
            `;

            labelsHtml += `
                <text x="${x}" y="${height - 10}" text-anchor="middle" font-size="11" font-weight="${pt.isSim ? '800' : '600'}" fill="${pt.isSim ? '#10b981' : 'var(--text-secondary)'}">${pt.year}</text>
            `;
        });

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" width="100%" height="210" style="overflow: visible; font-family: system-ui, -apple-system, sans-serif;">
                <line x1="${paddingLeft}" y1="${getY(6.0)}" x2="${width - paddingRight}" y2="${getY(6.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1" opacity="0.6"/>
                <text x="${paddingLeft - 10}" y="${getY(6.0) + 3}" fill="var(--text-secondary)" font-size="10" font-weight="600" text-anchor="end">6.0</text>

                <line x1="${paddingLeft}" y1="${getY(5.0)}" x2="${width - paddingRight}" y2="${getY(5.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1" opacity="0.6"/>
                <text x="${paddingLeft - 10}" y="${getY(5.0) + 3}" fill="var(--text-secondary)" font-size="10" font-weight="600" text-anchor="end">5.0</text>

                <line x1="${paddingLeft}" y1="${getY(4.0)}" x2="${width - paddingRight}" y2="${getY(4.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1" opacity="0.6"/>
                <text x="${paddingLeft - 10}" y="${getY(4.0) + 3}" fill="var(--text-secondary)" font-size="10" font-weight="600" text-anchor="end">4.0</text>

                <line x1="${paddingLeft}" y1="${getY(3.0)}" x2="${width - paddingRight}" y2="${getY(3.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1" opacity="0.6"/>
                <text x="${paddingLeft - 10}" y="${getY(3.0) + 3}" fill="var(--text-secondary)" font-size="10" font-weight="600" text-anchor="end">3.0</text>

                <path d="${targetPath}" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="5,5"/>
                <path d="${observedPath}" fill="none" stroke="#6366f1" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                
                ${circlesHtml}
                ${labelsHtml}
            </svg>
            
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 0.75rem; font-weight: 700;">
                <span style="display: flex; align-items: center; gap: 6px; color: #6366f1;">
                    <span style="width: 12px; height: 3px; background: #6366f1; border-radius: 2px;"></span> IDEB Oficial / Simulados
                </span>
                <span style="display: flex; align-items: center; gap: 6px; color: #10b981;">
                    <span style="width: 12px; height: 2px; border-top: 2px dashed #10b981;"></span> Meta Projetada INEP
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
                <div style="padding: 24px; text-align: center; color: var(--text-secondary); background: var(--bg-tertiary); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
                    <div style="font-size: 1.5rem; margin-bottom: 6px;">📊</div>
                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Nenhum simulado com respostas lançado</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.4;">
                        Os descritores críticos de maior defasagem serão exibidos aqui automaticamente assim que os alunos realizarem o 1º Simulado Diagnóstico.
                    </div>
                </div>
            `;
            return;
        }

        var descriptors = [
            { code: 'D01', disc: 'Português', desc: 'Localizar informações explícitas em um texto', pct: '42.5%', status: 'Crítico', color: '#ef4444' },
            { code: 'D13', disc: 'Matemática', desc: 'Reconhecer figuras geométricas bidimensionais', pct: '48.0%', status: 'Crítico', color: '#ef4444' },
            { code: 'D03', disc: 'Português', desc: 'Inferir o sentido de uma palavra ou expressão', pct: '54.2%', status: 'Alerta', color: '#f59e0b' },
            { code: 'D26', disc: 'Matemática', desc: 'Resolver problemas com frações e decimais', pct: '58.7%', status: 'Alerta', color: '#f59e0b' }
        ];

        container.innerHTML = descriptors.map(function(d) {
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 8px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <strong style="font-size: 0.85rem; color: #6366f1;">${d.code}</strong>
                            <span style="font-size: 0.72rem; color: var(--text-muted);">${d.disc}</span>
                        </div>
                        <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: var(--text-secondary); line-height: 1.3;">${d.desc}</p>
                    </div>
                    <div style="text-align: right; min-width: 70px;">
                        <span style="font-size: 0.95rem; font-weight: 800; color: ${d.color};">${d.pct}</span>
                        <span style="display: block; font-size: 0.65rem; color: ${d.color}; font-weight: 700; text-transform: uppercase;">${d.status}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderiza a distribuição qualitativa de alunos por proficiência
     */
    function renderDashboardProficiency() {
        var container = document.getElementById('dashboard-proficiency-container');
        if (!container) return;

        var levelMeta = {
            avancado: { name: 'Avançado', color: '#17B26A' },
            adequado: { name: 'Adequado', color: '#F2C94C' },
            basico:   { name: 'Básico',   color: '#F2994A' },
            abaixo:   { name: 'Abaixo do Básico', color: '#E0483C' }
        };

        var proficiencyCycles = [
            { year: 2019, adequadoPct: 22, nextDelta: -5, levels: { avancado: { pct: 5, alunos: 4671 }, adequado: { pct: 18, alunos: 17779 }, basico: { pct: 41, alunos: 41370 }, abaixo: { pct: 37, alunos: 37494 } } },
            { year: 2021, adequadoPct: 17, nextDelta: 9, levels: { avancado: { pct: 3, alunos: 2902 }, adequado: { pct: 14, alunos: 13714 }, basico: { pct: 39, alunos: 36991 }, abaixo: { pct: 44, alunos: 41381 } } },
            { year: 2023, adequadoPct: 26, nextDelta: null, levels: { avancado: { pct: 7, alunos: 5973 }, adequado: { pct: 19, alunos: 15496 }, basico: { pct: 37, alunos: 30540 }, abaixo: { pct: 36, alunos: 29774 } } }
        ];

        var legendItems = [
            { key: 'avancado', desc: 'Aprendizado além da expectativa. Recomenda-se aos alunos neste nível atividades desafiadoras.' },
            { key: 'adequado', desc: 'Os alunos neste nível encontram-se preparados para continuar os estudos. Recomenda-se atividades de aprofundamento.' },
            { key: 'basico', desc: 'Os alunos neste nível precisam melhorar. Sugere-se atividades de reforço.' },
            { key: 'abaixo', desc: 'Os alunos neste nível apresentaram pouquíssimo aprendizado. É necessária a recuperação de conteúdos.' }
        ];

        var bannerColor = function(pct) {
            if (pct < 25) return '#E0483C';
            if (pct < 50) return '#F2994A';
            if (pct < 75) return '#F2C94C';
            return '#17B26A';
        };

        var cyclesHtml = proficiencyCycles.map(function(c) {
            var levelsKeys = ['avancado', 'adequado', 'basico', 'abaixo'];
            var levelsHtml = levelsKeys.map(function(key) {
                var l = c.levels[key] || { pct: 0, alunos: 0 };
                var meta = levelMeta[key];
                return `
                    <div style="padding: 9px 0; border-bottom: 1px solid var(--border-color);">
                        <div style="display: flex; justify-content: space-between; align-items: baseline;">
                            <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1rem; color: ${meta.color};">${l.pct}%</span>
                            <span style="font-size: 0.72rem; color: var(--text-secondary);">(${l.alunos.toLocaleString('pt-BR')} alunos)</span>
                        </div>
                        <div style="height: 6px; border-radius: 20px; background: var(--bg-tertiary); overflow: hidden; margin: 6px 0 4px;">
                            <div style="height: 100%; border-radius: 20px; width: ${l.pct}%; background: ${meta.color};"></div>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 600;">${meta.name}</div>
                    </div>
                `;
            }).join('');

            var deltaChip = c.nextDelta === null || c.nextDelta === undefined ? '' :
                `<span style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.92); color: #1C2130; font-size: 0.68rem; font-weight: 800; padding: 3px 8px; border-radius: 20px;">${c.nextDelta > 0 ? '+' : ''}${c.nextDelta}pts</span>`;

            return `
                <div style="border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; background: var(--bg-primary);">
                    <div style="padding: 16px 10px; text-align: center; color: #fff; position: relative; background: ${bannerColor(c.adequadoPct)};">
                        ${deltaChip}
                        <div style="font-family: var(--font-heading); font-size: 1.45rem; font-weight: 800; line-height: 1.1;">${c.adequadoPct}%</div>
                        <div style="font-size: 0.72rem; font-weight: 600; margin-top: 3px; opacity: 0.95;">Aprendizado adequado</div>
                    </div>
                    <div style="padding: 12px 16px 2px; font-family: var(--font-heading); font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${c.year}</div>
                    <div style="padding: 2px 16px 14px;">${levelsHtml}</div>
                </div>
            `;
        }).join('');

        var legendHtml = legendItems.map(function(it) {
            var meta = levelMeta[it.key];
            return `
                <div style="display: flex; gap: 10px; margin-bottom: 16px;">
                    <span style="width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; background: ${meta.color};"></span>
                    <div>
                        <div style="font-weight: 700; font-size: 0.85rem; margin-bottom: 3px; color: ${meta.color};">${meta.name}</div>
                        <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">${it.desc}</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="grid-2" style="display: grid; grid-template-columns: 2.15fr 1fr; gap: 18px; width: 100%;">
                <div class="card card-full" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
                    <div class="card-header" style="margin-bottom: 14px;">
                        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">Distribuição dos alunos por proficiência</h3>
                        <p class="card-subtitle" style="font-size: 0.8rem; color: var(--text-secondary); margin: 3px 0 0 0;">Podemos posicionar o aprendizado dos alunos em 4 níveis qualitativos de proficiência. O aprendizado adequado engloba os níveis Adequado e Avançado.</p>
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin: 10px 0 18px;">
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary); background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 9px;">Pública</span>
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary); background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 9px;">Matemática</span>
                        <span style="font-size: 12px; font-weight: 600; color: var(--text-secondary); background: var(--bg-tertiary); border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 9px;">5º ano</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">${cyclesHtml}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 14px; line-height: 1.5;">
                        Dados oficiais Saeb/INEP (rede pública, Matemática, 5º ano). Assim que o módulo de simulados estiver ativo, os demais filtros (disciplina, série, rede) passam a refletir os resultados medidos internamente pela SEMED.
                    </div>
                </div>

                <div class="card card-full" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
                    <div class="card-header" style="margin-bottom: 14px;">
                        <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">Legenda Aprendizado</h3>
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
            var medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '#' + (idx + 1)));
            var safeName = typeof global.escapeHtml === 'function' ? global.escapeHtml(sch.name) : sch.name;
            var isUrban = sch.zone && sch.zone.includes('Urbana');
            var zoneIcon = isUrban ? '🏫' : '🌾';
            var statusLabel = sch.status || 'Ativa';
            var statusColor = statusLabel === 'Ativa' ? '#16a34a' : (statusLabel === 'Em manutenção' ? '#d97706' : '#ef4444');

            return `
                <tr style="border-bottom: 1px solid var(--border-color); height: 50px;">
                    <td style="padding: 10px 16px; font-weight: 800; color: var(--text-primary); text-align: center;">${medal}</td>
                    <td style="padding: 10px 16px;">
                        <strong style="font-size: 0.85rem; color: var(--text-primary); display: block;">${safeName}</strong>
                        <span style="font-size: 0.72rem; color: var(--text-muted);">INEP: ${sch.inep || sch.codigo_inep || '-'}</span>
                    </td>
                    <td style="padding: 10px 16px;">
                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 0.72rem; font-weight: 600; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color);">
                            <span>${zoneIcon}</span> <span>${sch.zone || 'Zona Rural'}</span>
                        </span>
                    </td>
                    <td style="padding: 10px 16px; text-align: center;">
                        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 700; background: rgba(34, 197, 94, 0.12); color: ${statusColor};">
                            ● ${statusLabel.toUpperCase()}
                        </span>
                    </td>
                    <td style="padding: 10px 16px; text-align: center;">
                        <button type="button" onclick="openSchoolWorkspace('${sch.name.replace(/'/g, "\\\'")}');" class="btn btn-outline btn-sm" style="font-size: 0.74rem; font-weight: 700; color: #6366f1; border-color: #6366f1; padding: 4px 10px;">
                            Ver Escola →
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Exposição no Escopo Global
    global.getPdeGoalsState = getPdeGoalsState;
    global.renderDashboardMetricCards = renderDashboardMetricCards;
    global.renderDashboardPdeProgress = renderDashboardPdeProgress;
    global.renderDashboardTimelineChart = renderDashboardTimelineChart;
    global.renderDashboardPriorityDescriptors = renderDashboardPriorityDescriptors;
    global.renderDashboardProficiency = renderDashboardProficiency;
    global.renderDashboardSchoolsRanking = renderDashboardSchoolsRanking;

})(typeof window !== 'undefined' ? window : this);
