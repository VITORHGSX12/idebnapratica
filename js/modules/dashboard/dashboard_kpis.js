// =========================================================================
// DASHBOARD KPIS & INDICADORES EXECUTIVOS (MODULAR ENGINE)
// Design System Institucional SEMED / INEP / SAEB
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
        var isDirector = userRole === 'Diretor Escola';
        var isTeacher = userRole === 'Professor' || userRole === 'Professor AEE';

        // 1. VISÃO DO DIRETOR ESCOLAR (Escopo: Unidade Escolar)
        if (isDirector) {
            container.innerHTML = `
                <!-- Card 1: IDEB Projetado vs Meta -->
                <div class="metric-card">
                    <div class="metric-card-header">
                        <div>
                            <span class="metric-label">IDEB Projetado</span>
                            <div class="metric-value" style="margin-top: 6px;">5.4</div>
                        </div>
                        <div class="metric-icon-bubble">
                            <i data-lucide="target"></i>
                        </div>
                    </div>
                    <div class="metric-sub">
                        <span class="badge-status-warning" style="font-size: var(--text-xs); padding: 2px 8px;">GAP -0.4</span>
                        <span style="margin-left: auto; font-size: var(--text-xs); color: var(--color-text-secondary);">Meta: <strong style="color: var(--color-brand-primary);">5.8</strong></span>
                    </div>
                </div>

                <!-- Card 2: Proficiência Média (LP / MAT) -->
                <div class="metric-card">
                    <div class="metric-card-header">
                        <div>
                            <span class="metric-label">Proficiência Média</span>
                            <div class="metric-value" style="margin-top: 6px;">231.3 <span style="font-size: 0.95rem; font-weight: 600; color: var(--color-text-muted);">pts</span></div>
                        </div>
                        <div class="metric-icon-bubble status-advanced">
                            <i data-lucide="book-open"></i>
                        </div>
                    </div>
                    <div class="metric-sub">
                        <span>LP: <strong style="color: var(--color-brand-primary);">224.5</strong> • MAT: <strong style="color: var(--color-brand-primary);">238.1</strong></span>
                    </div>
                </div>

                <!-- Card 3: Taxa de Domínio de Descritores com Anel de Progresso -->
                <div class="metric-card">
                    <div class="metric-card-header">
                        <div>
                            <span class="metric-label">Domínio de Descritores</span>
                            <div class="metric-value" style="margin-top: 6px;">64.8%</div>
                        </div>
                        <div class="progress-ring-container">
                            <svg class="progress-ring-svg" viewBox="0 0 72 72">
                                <circle class="progress-ring-bg" cx="36" cy="36" r="30" />
                                <circle class="progress-ring-fill" cx="36" cy="36" r="30" 
                                        stroke-dasharray="188.4" 
                                        stroke-dashoffset="${188.4 - (188.4 * 64.8 / 100)}" />
                            </svg>
                            <span class="progress-ring-value">65%</span>
                        </div>
                    </div>
                    <div class="metric-sub">
                        <span>Média global de acertos em itens SAEB</span>
                    </div>
                </div>
            `;
            if (window.lucide && typeof lucide.createIcons === 'function') {
                try { lucide.createIcons(); } catch(e) {}
            }
            return;
        }

        // 2. VISÃO DO PROFESSOR (Escopo: Turma sob regência)
        if (isTeacher) {
            container.innerHTML = `
                <!-- Card 1: Desempenho Médio da Turma -->
                <div class="metric-card">
                    <div class="metric-card-header">
                        <div>
                            <span class="metric-label">Desempenho da Turma</span>
                            <div class="metric-value" style="margin-top: 6px;">68.2%</div>
                        </div>
                        <div class="metric-icon-bubble">
                            <i data-lucide="users"></i>
                        </div>
                    </div>
                    <div class="metric-sub">
                        <span class="badge-status-success" style="font-size: var(--text-xs); padding: 2px 8px;">+4.5%</span>
                        <span style="margin-left: auto; font-size: var(--text-xs); color: var(--color-text-secondary);">vs. Diagnóstico Inicial</span>
                    </div>
                </div>

                <!-- Card 2: Alunos em Nível Crítico / Recomposição -->
                <div class="metric-card">
                    <div class="metric-card-header">
                        <div>
                            <span class="metric-label">Foco de Recomposição</span>
                            <div class="metric-value" style="margin-top: 6px; color: var(--color-status-critical-text);">6 <span style="font-size: 0.95rem; font-weight: 600; color: var(--color-text-muted);">alunos</span></div>
                        </div>
                        <div class="metric-icon-bubble status-critical">
                            <i data-lucide="alert-triangle"></i>
                        </div>
                    </div>
                    <div class="metric-sub">
                        <span>Nível Insuficiente em Descritores Prioritários</span>
                    </div>
                </div>

                <!-- Card 3: Execução do Cronograma com Anel de Progresso -->
                <div class="metric-card">
                    <div class="metric-card-header">
                        <div>
                            <span class="metric-label">Execução do Cronograma</span>
                            <div class="metric-value" style="margin-top: 6px;">82.5%</div>
                        </div>
                        <div class="progress-ring-container">
                            <svg class="progress-ring-svg" viewBox="0 0 72 72">
                                <circle class="progress-ring-bg" cx="36" cy="36" r="30" />
                                <circle class="progress-ring-fill" cx="36" cy="36" r="30" 
                                        stroke-dasharray="188.4" 
                                        stroke-dashoffset="${188.4 - (188.4 * 82.5 / 100)}" />
                            </svg>
                            <span class="progress-ring-value">83%</span>
                        </div>
                    </div>
                    <div class="metric-sub">
                        <span>33 de 40 habilidades SAEB trabalhadas</span>
                    </div>
                </div>
            `;
            if (window.lucide && typeof lucide.createIcons === 'function') {
                try { lucide.createIcons(); } catch(e) {}
            }
            return;
        }

        // 3. VISÃO DO GESTOR DA REDE / ADMIN (Escopo: Rede Municipal de Gonçalves Dias)
        var pde = getPdeGoalsState();
        var idebVal = '5.2';
        var idebSub = 'Meta 2026: <strong>5.5</strong>';
        var profVal = '228.4';
        var profSub = 'LP: <strong>221.8</strong> • MAT: <strong>235.1</strong>';
        var fluxoVal = '96.2%';
        var fluxoSub = 'Taxa de rendimento escolar consolidada';

        if (pde && pde.currentScore) {
            idebVal = Number(pde.currentScore).toFixed(1);
            idebSub = 'Meta Pactuada: <strong>' + (pde.metaIdeb || '5.5') + '</strong>';
        }

        var fluxoNum = parseFloat(fluxoVal) || 96.2;
        var ringOffset = (188.4 - (188.4 * fluxoNum / 100)).toFixed(1);

        container.innerHTML = `
            <div class="metric-card">
                <div class="metric-card-header">
                    <div>
                        <span class="metric-label">IDEB Observado / Projetado</span>
                        <div class="metric-value" style="margin-top: 6px;">${idebVal}</div>
                    </div>
                    <div class="metric-icon-bubble">
                        <i data-lucide="trending-up"></i>
                    </div>
                </div>
                <div class="metric-sub">
                    <span class="badge-status-success" style="font-size: var(--text-xs); padding: 2px 8px;">+0.4</span>
                    <span style="margin-left: auto; font-size: var(--text-xs); color: var(--color-text-secondary);">${idebSub}</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-card-header">
                    <div>
                        <span class="metric-label">Proficiência Média da Rede</span>
                        <div class="metric-value" style="margin-top: 6px;">${profVal} <span style="font-size: 0.95rem; font-weight: 600; color: var(--color-text-muted);">pts</span></div>
                    </div>
                    <div class="metric-icon-bubble status-advanced">
                        <i data-lucide="graduation-cap"></i>
                    </div>
                </div>
                <div class="metric-sub">
                    <span>${profSub}</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-card-header">
                    <div>
                        <span class="metric-label">Taxa de Aprovação (Fluxo)</span>
                        <div class="metric-value" style="margin-top: 6px;">${fluxoVal}</div>
                    </div>
                    <div class="progress-ring-container">
                        <svg class="progress-ring-svg" viewBox="0 0 72 72">
                            <circle class="progress-ring-bg" cx="36" cy="36" r="30" />
                            <circle class="progress-ring-fill" cx="36" cy="36" r="30" 
                                    stroke-dasharray="188.4" 
                                    stroke-dashoffset="${ringOffset}" />
                        </svg>
                        <span class="progress-ring-value">${fluxoVal}</span>
                    </div>
                </div>
                <div class="metric-sub">
                    <i data-lucide="check-circle" style="width: 14px; height: 14px; color: var(--color-status-success);"></i>
                    <span>${fluxoSub}</span>
                </div>
            </div>
        `;

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    /**
     * ELEMENTO DE ASSINATURA:
     * Renderiza a Régua Calibrada de Metas IDEB & Trajetória Municipal (PDE)
     */
    function renderDashboardPdeProgress() {
        var container = document.getElementById('dashboard-pde-progress-container');
        if (!container) return;

        var pde = getPdeGoalsState();
        var baselineScore = 4.8; // INEP 2023 consolidado
        var currentScore = pde && pde.currentScore ? Number(pde.currentScore) : 5.2;
        var targetScore = pde && pde.metaIdeb ? Number(pde.metaIdeb) : 5.5;
        var gap = (currentScore - targetScore).toFixed(1);
        var progressPct = Math.min(100, Math.max(0, (currentScore / 10) * 100)).toFixed(1);
        var baselinePct = ((baselineScore / 10) * 100).toFixed(1);
        var targetPct = ((targetScore / 10) * 100).toFixed(1);
        var currentPct = ((currentScore / 10) * 100).toFixed(1);

        var isAhead = gap >= 0;
        var gapText = isAhead ? `+${Math.abs(gap)} pts (Meta superada)` : `${gap} pts para a meta`;
        var gapBadgeClass = isAhead ? 'badge-status-success' : 'badge-status-warning';

        container.innerHTML = `
            <div class="ideb-trajectory-card">
                <div class="ideb-trajectory-header">
                    <div class="ideb-trajectory-title-group">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            <span class="badge ${gapBadgeClass}">
                                <i data-lucide="compass" style="width: 12px; height: 12px;"></i>
                                PACTUAÇÃO PDE & MONITORAMENTO DO CICLO
                            </span>
                        </div>
                        <h3>Trajetória do IDEB Municipal vs. Meta Pactuada</h3>
                        <p>Acompanhamento de calibração entre a base oficial INEP (2023), resultados observados e meta 2025/2026.</p>
                    </div>

                    <div style="text-align: right;">
                        <div style="font-size: var(--text-xs); font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Distância da Meta</div>
                        <div style="font-family: var(--font-display); font-size: 1.4rem; font-weight: 800; color: ${isAhead ? 'var(--color-status-success-text)' : 'var(--color-status-warning-text)'}; font-variant-numeric: tabular-nums;">
                            ${gapText}
                        </div>
                    </div>
                </div>

                <!-- Régua Calibrada -->
                <div class="ideb-trajectory-gauge-wrapper">
                    <div class="ideb-gauge-track">
                        <!-- Preenchimento do Progresso -->
                        <div class="ideb-gauge-fill" style="width: ${currentPct}%;"></div>

                        <!-- Pin 1: Base Histórica 2023 -->
                        <div class="ideb-gauge-pin baseline" style="left: ${baselinePct}%;">
                            <div class="ideb-gauge-pin-label-top">2023: ${baselineScore}</div>
                            <div class="ideb-gauge-pin-marker"></div>
                            <div class="ideb-gauge-pin-label-bottom">Base INEP</div>
                        </div>

                        <!-- Pin 2: Desempenho Observado Atual -->
                        <div class="ideb-gauge-pin current" style="left: ${currentPct}%;">
                            <div class="ideb-gauge-pin-label-top" style="background-color: var(--color-accent-primary); color: #ffffff; border-color: var(--color-accent-primary);">
                                Atual: ${currentScore}
                            </div>
                            <div class="ideb-gauge-pin-marker"></div>
                            <div class="ideb-gauge-pin-label-bottom" style="font-weight: 700; color: var(--color-accent-primary);">Observado</div>
                        </div>

                        <!-- Pin 3: Meta Pactuada -->
                        <div class="ideb-gauge-pin target" style="left: ${targetPct}%;">
                            <div class="ideb-gauge-pin-label-top">Meta: ${targetScore}</div>
                            <div class="ideb-gauge-pin-marker"></div>
                            <div class="ideb-gauge-pin-label-bottom">Pactuado</div>
                        </div>
                    </div>
                </div>

                <div class="ideb-trajectory-footer">
                    <div style="display: flex; align-items: center; gap: 16px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                        <span style="display: inline-flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--color-accent-primary);"></span>
                            <strong>${progressPct}%</strong> da escala total alcançada
                        </span>
                        <span>•</span>
                        <span>Crescimento histórico: <strong>+${(currentScore - baselineScore).toFixed(1)} pts</strong> desde 2023</span>
                    </div>

                    <div>
                        <a href="javascript:void(0)" onclick="switchTab('metas-ideb'); return false;" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 10px; height: 28px;">
                            <span>Ver Plano de Metas por Escola</span>
                            <i data-lucide="arrow-right" style="width: 12px; height: 12px;"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
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

            var color = pt.isSim ? '#059669' : '#1D4ED8';
            circlesHtml += `
                <circle cx="${x}" cy="${yObs}" r="5" fill="${color}" stroke="#FFFFFF" stroke-width="2">
                    <title>${pt.year}: ${pt.score}</title>
                </circle>
                <text x="${x}" y="${yObs - 9}" text-anchor="middle" font-size="10" font-weight="700" fill="${color}" font-family="var(--font-display)">${pt.score}</text>
            `;

            labelsHtml += `
                <text x="${x}" y="${height - 10}" text-anchor="middle" font-size="11" font-weight="${pt.isSim ? '700' : '500'}" fill="var(--color-text-secondary)">${pt.year}</text>
            `;
        });

        container.innerHTML = `
            <svg viewBox="0 0 ${width} ${height}" width="100%" height="210" style="overflow: visible; font-family: var(--font-body);">
                <line x1="${paddingLeft}" y1="${getY(6.0)}" x2="${width - paddingRight}" y2="${getY(6.0)}" stroke="var(--color-border-subtle)" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(6.0) + 3}" fill="var(--color-text-muted)" font-size="10" font-weight="600" text-anchor="end">6.0</text>

                <line x1="${paddingLeft}" y1="${getY(5.0)}" x2="${width - paddingRight}" y2="${getY(5.0)}" stroke="var(--color-border-subtle)" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(5.0) + 3}" fill="var(--color-text-muted)" font-size="10" font-weight="600" text-anchor="end">5.0</text>

                <line x1="${paddingLeft}" y1="${getY(4.0)}" x2="${width - paddingRight}" y2="${getY(4.0)}" stroke="var(--color-border-subtle)" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(4.0) + 3}" fill="var(--color-text-muted)" font-size="10" font-weight="600" text-anchor="end">4.0</text>

                <line x1="${paddingLeft}" y1="${getY(3.0)}" x2="${width - paddingRight}" y2="${getY(3.0)}" stroke="var(--color-border-subtle)" stroke-dasharray="3,3" stroke-width="1"/>
                <text x="${paddingLeft - 10}" y="${getY(3.0) + 3}" fill="var(--color-text-muted)" font-size="10" font-weight="600" text-anchor="end">3.0</text>

                <path d="${targetPath}" fill="none" stroke="#475569" stroke-width="1.75" stroke-dasharray="4,4"/>
                <path d="${observedPath}" fill="none" stroke="#1D4ED8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                
                ${circlesHtml}
                ${labelsHtml}
            </svg>
            
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: var(--text-xs); font-weight: 600;">
                <span style="display: flex; align-items: center; gap: 6px; color: #1D4ED8;">
                    <span style="width: 12px; height: 3px; background: #1D4ED8; border-radius: 2px;"></span> IDEB Observado / Simulado
                </span>
                <span style="display: flex; align-items: center; gap: 6px; color: #475569;">
                    <span style="width: 12px; height: 2px; border-top: 2px dashed #475569;"></span> Meta Projetada INEP
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
            var isUrban = sch.zone && sch.zone.includes('Urbana');
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
    global.getPdeGoalsState = getPdeGoalsState;
    global.renderDashboardMetricCards = renderDashboardMetricCards;
    global.renderDashboardPdeProgress = renderDashboardPdeProgress;
    global.renderDashboardTimelineChart = renderDashboardTimelineChart;
    global.renderDashboardPriorityDescriptors = renderDashboardPriorityDescriptors;
    global.renderDashboardProficiency = renderDashboardProficiency;
    global.renderDashboardSchoolsRanking = renderDashboardSchoolsRanking;

})(typeof window !== 'undefined' ? window : this);
