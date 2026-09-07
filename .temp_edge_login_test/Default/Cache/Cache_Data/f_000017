/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — DASHBOARD KPIS & INDICADORES EXECUTIVOS
 * Arquivo: js/modules/dashboard/dashboard_kpis.js
 * Descrição: Cards de métricas principais do Dashboard adaptados dinamicamente
 *            por perfil (Professor, Diretor, Gestor/Admin) e Régua de Metas PDE.
 * ============================================================================
 */

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

        // Checagem rigorosa: existem respostas ou notas de simulados já lançadas?
        var hasEvaluations = false;
        try {
            var savedRespostas = localStorage.getItem('gd_simulado_respostas_db');
            if (savedRespostas && savedRespostas !== '{}' && savedRespostas !== '[]') {
                hasEvaluations = true;
            }
        } catch(e) {}

        // 1. VISÃO DO DIRETOR ESCOLAR (Escopo: Unidade Escolar)
        if (isDirector) {
            if (!hasEvaluations) {
                container.innerHTML = `
                    <!-- Card 1: IDEB Oficial da Unidade -->
                    <div class="metric-card">
                        <div class="metric-card-header">
                            <div>
                                <span class="metric-label">IDEB Oficial da Escola</span>
                                <div class="metric-value" style="margin-top: 6px;">5.4</div>
                            </div>
                            <div class="metric-icon-bubble">
                                <i data-lucide="target"></i>
                            </div>
                        </div>
                        <div class="metric-sub">
                            <span class="badge-status-advanced" style="font-size: var(--text-xs); padding: 2px 8px;">Base INEP</span>
                            <span style="margin-left: auto; font-size: var(--text-xs); color: var(--color-text-secondary);">Meta 2026: <strong style="color: var(--color-target);">5.8</strong></span>
                        </div>
                    </div>

                    <!-- Card 2: Proficiência Média dos Simulados (Aguardando) -->
                    <div class="metric-card">
                        <div class="metric-card-header">
                            <div>
                                <span class="metric-label">Proficiência em Simulados</span>
                                <div class="metric-value" style="margin-top: 6px; color: var(--color-text-muted);">-- <span style="font-size: 0.95rem; font-weight: 600;">pts</span></div>
                            </div>
                            <div class="metric-icon-bubble">
                                <i data-lucide="book-open"></i>
                            </div>
                        </div>
                        <div class="metric-sub">
                            <span class="badge-status-warning" style="font-size: var(--text-xs); padding: 2px 8px;">Aguardando Dados</span>
                            <span style="margin-left: auto; font-size: var(--text-xs); color: var(--color-text-secondary);">Após 1ª Avaliação</span>
                        </div>
                    </div>

                    <!-- Card 3: Domínio de Descritores (Aguardando) -->
                    <div class="metric-card">
                        <div class="metric-card-header">
                            <div>
                                <span class="metric-label">Domínio de Descritores</span>
                                <div class="metric-value" style="margin-top: 6px; color: var(--color-text-muted);">-- <span style="font-size: 0.95rem; font-weight: 600;">%</span></div>
                            </div>
                            <div class="metric-icon-bubble">
                                <i data-lucide="pie-chart"></i>
                            </div>
                        </div>
                        <div class="metric-sub">
                            <span>Média de acertos consolidada pós-provas</span>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
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
            }
            if (window.lucide && typeof lucide.createIcons === 'function') {
                try { lucide.createIcons(); } catch(e) {}
            }
            return;
        }

        // 2. VISÃO DO PROFESSOR (Escopo: Turma sob regência)
        if (isTeacher) {
            if (!hasEvaluations) {
                container.innerHTML = `
                    <!-- Card 1: Desempenho Diagnóstico da Turma -->
                    <div class="metric-card">
                        <div class="metric-card-header">
                            <div>
                                <span class="metric-label">Desempenho da Turma</span>
                                <div class="metric-value" style="margin-top: 6px; color: var(--color-text-muted);">-- <span style="font-size: 0.95rem; font-weight: 600;">%</span></div>
                            </div>
                            <div class="metric-icon-bubble">
                                <i data-lucide="bar-chart-2"></i>
                            </div>
                        </div>
                        <div class="metric-sub">
                            <span class="badge-status-warning" style="font-size: var(--text-xs); padding: 2px 8px;">Aguardando Dados</span>
                            <span style="margin-left: auto; font-size: var(--text-xs); color: var(--color-text-secondary);">1ª Avaliação</span>
                        </div>
                    </div>

                    <!-- Card 2: Foco de Recomposição -->
                    <div class="metric-card">
                        <div class="metric-card-header">
                            <div>
                                <span class="metric-label">Foco de Recomposição</span>
                                <div class="metric-value" style="margin-top: 6px; color: var(--color-text-muted);">-- <span style="font-size: 0.95rem; font-weight: 600;">alunos</span></div>
                            </div>
                            <div class="metric-icon-bubble">
                                <i data-lucide="users"></i>
                            </div>
                        </div>
                        <div class="metric-sub">
                            <span>Cálculo automático após 1ª avaliação</span>
                        </div>
                    </div>

                    <!-- Card 3: Cronograma de Aulas 40 Semanas -->
                    <div class="metric-card">
                        <div class="metric-card-header">
                            <div>
                                <span class="metric-label">Cronograma Curricular</span>
                                <div class="metric-value" style="margin-top: 6px; color: var(--color-brand-primary);">40 <span style="font-size: 0.95rem; font-weight: 600; color: var(--color-text-muted);">Semanas</span></div>
                            </div>
                            <div class="metric-icon-bubble status-advanced">
                                <i data-lucide="calendar-check"></i>
                            </div>
                        </div>
                        <div class="metric-sub">
                            <i data-lucide="check-circle" style="width: 14px; height: 14px; color: var(--color-status-success);"></i>
                            <span>Matriz BNCC & SAEB Ativa</span>
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
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
            }
            if (window.lucide && typeof lucide.createIcons === 'function') {
                try { lucide.createIcons(); } catch(e) {}
            }
            return;
        }

        // 3. VISÃO DO GESTOR DA REDE / ADMIN (Escopo: Rede Municipal de Gonçalves Dias)
        var pde = getPdeGoalsState();
        var idebVal = '5.2';
        var idebSub = 'Meta 2026: <strong style="color: #ffffff; font-weight: 800;">5.5</strong>';
        var profVal = '228.4';
        var profSub = 'LP: <strong style="color: #ffffff; font-weight: 800;">221.8</strong> • MAT: <strong style="color: #ffffff; font-weight: 800;">235.1</strong>';
        var fluxoVal = '96.2%';
        var fluxoSub = 'Taxa de rendimento escolar consolidada';

        if (pde && pde.currentScore) {
            idebVal = Number(pde.currentScore).toFixed(1);
            idebSub = 'Meta Pactuada: <strong style="color: #ffffff; font-weight: 800;">' + (pde.metaIdeb || '5.5') + '</strong>';
        }

        var fluxoNum = parseFloat(fluxoVal) || 96.2;
        var ringOffset = (188.4 - (188.4 * fluxoNum / 100)).toFixed(1);

        container.innerHTML = `
            <div class="metric-card">
                <div class="metric-card-header">
                    <div>
                        <span class="metric-label">IDEB Observado / Projetado</span>
                        <div class="metric-value" style="margin-top: 6px; color: #ffffff;">${idebVal}</div>
                    </div>
                    <div class="metric-icon-bubble">
                        <i data-lucide="trending-up"></i>
                    </div>
                </div>
                <div class="metric-sub">
                    <span class="badge-status-success" style="font-size: var(--text-xs); padding: 2px 8px; color: #ffffff;">+0.4</span>
                    <span style="margin-left: auto; font-size: var(--text-xs); color: rgba(255, 255, 255, 0.95);">${idebSub}</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-card-header">
                    <div>
                        <span class="metric-label">Proficiência Média da Rede</span>
                        <div class="metric-value" style="margin-top: 6px; color: #ffffff;">${profVal} <span style="font-size: 0.95rem; font-weight: 600; color: rgba(255, 255, 255, 0.88);">pts</span></div>
                    </div>
                    <div class="metric-icon-bubble status-advanced">
                        <i data-lucide="graduation-cap"></i>
                    </div>
                </div>
                <div class="metric-sub" style="color: rgba(255, 255, 255, 0.95);">
                    <span>${profSub}</span>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-card-header">
                    <div>
                        <span class="metric-label">Taxa de Aprovação (Fluxo)</span>
                        <div class="metric-value" style="margin-top: 6px; color: #ffffff;">${fluxoVal}</div>
                    </div>
                    <div class="progress-ring-container">
                        <svg class="progress-ring-svg" viewBox="0 0 72 72">
                            <circle class="progress-ring-bg" cx="36" cy="36" r="30" />
                            <circle class="progress-ring-fill" cx="36" cy="36" r="30" 
                                    stroke-dasharray="188.4" 
                                    stroke-dashoffset="${ringOffset}" />
                        </svg>
                        <span class="progress-ring-value" style="color: #ffffff;">${fluxoVal}</span>
                    </div>
                </div>
                <div class="metric-sub" style="color: rgba(255, 255, 255, 0.95);">
                    <i data-lucide="check-circle" style="width: 14px; height: 14px; color: #34D399;"></i>
                    <span>${fluxoSub}</span>
                </div>
            </div>
        `;

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
        if (typeof global.initDashboardScrollReveal === 'function') {
            global.initDashboardScrollReveal();
        }
    }

    /**
     * ELEMENTO DE ASSINATURA:
     * Renderiza o Gráfico de Linha da Trajetória do IDEB Municipal vs. Meta Pactuada (PDE)
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

        var isAhead = gap >= 0;
        var gapText = isAhead ? `+${Math.abs(gap)} pts (Meta superada)` : `${gap} pts para a meta`;

        // Pontos de Trajetória: Histórico (2017 a 2023), Observado Atual e Meta Pactuada
        var points = [
            { label: '2017', year: '2017', score: 3.8, isHistory: true },
            { label: '2019', year: '2019', score: 4.2, isHistory: true },
            { label: '2021', year: '2021', score: 4.5, isHistory: true },
            { label: '2023', year: '2023 (Base INEP)', score: baselineScore, isBase: true },
            { label: 'Atual', year: 'Atual (Observado)', score: currentScore, isCurrent: true },
            { label: 'Meta PDE', year: 'Meta Pactuada (PDE)', score: targetScore, isTarget: true }
        ];

        var width = 640;
        var height = 210;
        var paddingLeft = 48;
        var paddingRight = 40;
        var paddingTop = 32;
        var paddingBottom = 34;

        var minScore = 3.0;
        var maxScore = 6.0;

        var getX = function(idx, total) {
            return paddingLeft + (idx * ((width - paddingLeft - paddingRight) / (total - 1 || 1)));
        };
        var getY = function(val) {
            return paddingTop + (height - paddingTop - paddingBottom) * (1 - (val - minScore) / (maxScore - minScore));
        };

        var labelsHtml = points.map(function(pt, idx) {
            var cx = getX(idx, points.length);
            return `<text x="${cx}" y="${height - 8}" text-anchor="middle" font-size="10.5" font-weight="${pt.isCurrent || pt.isTarget ? '700' : '500'}" fill="${pt.isCurrent ? '#1A2D42' : 'var(--text-secondary)'}" class="trajectory-axis-label">${pt.label}</text>`;
        }).join('');

        container.innerHTML = `
            <div class="ideb-trajectory-card">
                <div class="ideb-trajectory-header">
                    <div class="ideb-trajectory-title-group">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span class="ideb-trajectory-pde-badge">
                                <i data-lucide="compass" style="width: 13px; height: 13px;"></i>
                                PACTUAÇÃO PDE & MONITORAMENTO DO CICLO
                            </span>
                        </div>
                        <h3>Trajetória do IDEB Municipal vs. Meta Pactuada</h3>
                        <p>Acompanhamento de calibração entre a série histórica, base oficial INEP (2023), resultados observados e meta 2025/2026.</p>
                    </div>

                    <div class="ideb-trajectory-gap-box">
                        <div class="ideb-trajectory-gap-label">Distância da Meta</div>
                        <div class="ideb-trajectory-gap-val ${isAhead ? 'ahead' : 'gap'}">
                            ${gapText}
                        </div>
                    </div>
                </div>

                <!-- Gráfico de Linha Vetorial (Mesmo Padrão da Linha do Tempo) -->
                <div class="ideb-trajectory-chart-wrapper">
                    <svg viewBox="0 0 ${width} ${height}" width="100%" height="210" style="overflow: visible; font-family: var(--font-body);">
                        <defs>
                            <linearGradient id="idebTrajectoryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="var(--color-primary-chart, #2563EB)" stop-opacity="0.14"/>
                                <stop offset="100%" stop-color="var(--color-primary-chart, #2563EB)" stop-opacity="0.01"/>
                            </linearGradient>
                            <linearGradient id="idebGapAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stop-color="var(--color-target, #D97706)" stop-opacity="0.18"/>
                                <stop offset="100%" stop-color="var(--color-target, #D97706)" stop-opacity="0.02"/>
                            </linearGradient>
                        </defs>

                        <!-- Linhas de Grade Horizontais do Eixo Y -->
                        <line x1="${paddingLeft}" y1="${getY(6.0)}" x2="${width - paddingRight}" y2="${getY(6.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1"/>
                        <text x="${paddingLeft - 10}" y="${getY(6.0) + 3}" fill="var(--text-muted)" font-size="10" font-weight="600" text-anchor="end">6.0</text>

                        <line x1="${paddingLeft}" y1="${getY(5.0)}" x2="${width - paddingRight}" y2="${getY(5.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1"/>
                        <text x="${paddingLeft - 10}" y="${getY(5.0) + 3}" fill="var(--text-muted)" font-size="10" font-weight="600" text-anchor="end">5.0</text>

                        <line x1="${paddingLeft}" y1="${getY(4.0)}" x2="${width - paddingRight}" y2="${getY(4.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1"/>
                        <text x="${paddingLeft - 10}" y="${getY(4.0) + 3}" fill="var(--text-muted)" font-size="10" font-weight="600" text-anchor="end">4.0</text>

                        <line x1="${paddingLeft}" y1="${getY(3.0)}" x2="${width - paddingRight}" y2="${getY(3.0)}" stroke="var(--border-color)" stroke-dasharray="3,3" stroke-width="1"/>
                        <text x="${paddingLeft - 10}" y="${getY(3.0) + 3}" fill="var(--text-muted)" font-size="10" font-weight="600" text-anchor="end">3.0</text>

                        <!-- Área de Preenchimento da Linha Real (Azul Sutil) -->
                        <path d="" fill="url(#idebTrajectoryAreaGrad)" class="trajectory-area-path"/>

                        <!-- Área sombreada do Gap da Meta (Âmbar Sutil) -->
                        <path d="" fill="url(#idebGapAreaGrad)" class="trajectory-gap-path"/>

                        <!-- Linha de Projeção da Meta (Âmbar Tracejada) -->
                        <path d="" fill="none" stroke="var(--color-target, #D97706)" stroke-width="2" stroke-dasharray="5,4" class="trajectory-meta-line"/>

                        <!-- Linha Sólida de Trajetória Observada/Real (Azul Primário) -->
                        <path d="" fill="none" stroke="var(--color-primary-chart, #2563EB)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="trajectory-observed-line"/>

                        <!-- Pontos e Rótulos -->
                        <g class="trajectory-dots-layer"></g>
                        ${labelsHtml}
                    </svg>

                    <!-- Legenda do Gráfico Horizontal -->
                    <div class="ideb-trajectory-chart-legend">
                        <span class="legend-item">
                            <span class="legend-line solid"></span>
                            <span>IDEB Observado / Real</span>
                        </span>
                        <span class="legend-item">
                            <span class="legend-line dashed"></span>
                            <span>Meta Pactuada (PDE 2025/26)</span>
                        </span>
                        <span class="legend-item">
                            <span class="legend-gap-box"></span>
                            <span>Gap Projetado: <strong>${gap} pts</strong></span>
                        </span>
                    </div>
                </div>

                <div class="ideb-trajectory-footer">
                    <div style="display: flex; align-items: center; gap: 16px; font-size: var(--text-xs); color: var(--color-text-secondary); flex-wrap: wrap;">
                        <span style="display: inline-flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: var(--color-primary-chart);"></span>
                            <strong>${progressPct}%</strong> da escala total alcançada
                        </span>
                        <span>•</span>
                        <span>Crescimento histórico: <strong>+${(currentScore - baselineScore).toFixed(1)} pts</strong> desde 2023</span>
                    </div>

                    <div>
                        <a href="#metas-ideb" onclick="switchTab('metas-ideb'); return false;" class="btn btn-outline" style="font-size: var(--text-xs); padding: 5px 12px; height: 30px; font-weight: 600;">
                            <span>Ver Plano de Metas por Escola</span>
                            <i data-lucide="arrow-right" style="width: 13px; height: 13px;"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;

        updatePdeTrajectoryProgress(0);

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
        if (typeof global.initDashboardScrollReveal === 'function') {
            global.initDashboardScrollReveal();
        }
        if (typeof global.startTrajectoryLineLoop === 'function') {
            global.startTrajectoryLineLoop(container);
        }
    }

    /**
     * Atualiza a posição dos pontos, linhas e áreas da Trajetória PDE conforme o progresso vertical (0 a 1)
     */
    function updatePdeTrajectoryProgress(progress) {
        var container = document.getElementById('dashboard-pde-progress-container');
        if (!container) return;
        var obsLine = container.querySelector('.trajectory-observed-line');
        var metaLine = container.querySelector('.trajectory-meta-line');
        var areaPath = container.querySelector('.trajectory-area-path');
        var gapPath = container.querySelector('.trajectory-gap-path');
        var dotsLayer = container.querySelector('.trajectory-dots-layer');
        if (!obsLine) return;

        var p = Math.max(0, Math.min(1, progress));
        var pde = getPdeGoalsState();
        var baselineScore = 4.8;
        var currentScore = pde && pde.currentScore ? Number(pde.currentScore) : 5.2;
        var targetScore = pde && pde.metaIdeb ? Number(pde.metaIdeb) : 5.5;

        var points = [
            { label: '2017', year: '2017', score: 3.8, isHistory: true },
            { label: '2019', year: '2019', score: 4.2, isHistory: true },
            { label: '2021', year: '2021', score: 4.5, isHistory: true },
            { label: '2023', year: '2023 (Base INEP)', score: baselineScore, isBase: true },
            { label: 'Atual', year: 'Atual (Observado)', score: currentScore, isCurrent: true },
            { label: 'Meta PDE', year: 'Meta Pactuada (PDE)', score: targetScore, isTarget: true }
        ];

        var width = 640, height = 210, padL = 48, padR = 40, padT = 32, padB = 34, minS = 3.0, maxS = 6.0;
        var getX = function(idx, total) { return padL + (idx * ((width - padL - padR) / (total - 1 || 1))); };
        var getY = function(val) { return padT + (height - padT - padB) * (1 - (val - minS) / (maxS - minS)); };

        var curPoints = points.map(function(pt) {
            var s = minS + (pt.score - minS) * p;
            return { label: pt.label, year: pt.year, curScore: +s.toFixed(2), isCurrent: pt.isCurrent, isTarget: pt.isTarget, isBase: pt.isBase };
        });

        var obsD = '', areaD = '';
        for (var i = 0; i <= 4; i++) {
            var px = getX(i, curPoints.length), py = getY(curPoints[i].curScore);
            if (i === 0) {
                obsD += 'M ' + px + ' ' + py;
                areaD += 'M ' + px + ' ' + (height - padB) + ' L ' + px + ' ' + py;
            } else {
                obsD += ' L ' + px + ' ' + py;
                areaD += ' L ' + px + ' ' + py;
            }
        }
        areaD += ' L ' + getX(4, curPoints.length) + ' ' + (height - padB) + ' Z';

        var xBase = getX(3, curPoints.length), yBase = getY(curPoints[3].curScore);
        var xTarget = getX(5, curPoints.length), yTarget = getY(curPoints[5].curScore);
        var xCurr = getX(4, curPoints.length), yCurr = getY(curPoints[4].curScore);

        obsLine.setAttribute('d', obsD);
        if (metaLine) metaLine.setAttribute('d', 'M ' + xBase + ' ' + yBase + ' L ' + xTarget + ' ' + yTarget);
        if (areaPath) areaPath.setAttribute('d', areaD);
        if (gapPath) gapPath.setAttribute('d', 'M ' + xBase + ' ' + yBase + ' L ' + xTarget + ' ' + yTarget + ' L ' + xCurr + ' ' + yCurr + ' Z');

        if (dotsLayer) {
            var dHtml = '';
            curPoints.forEach(function(pt, idx) {
                var cx = getX(idx, curPoints.length), cy = getY(pt.curScore);
                var disp = pt.curScore.toFixed(1);
                if (pt.isCurrent) {
                    dHtml += '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="var(--color-primary-chart)" stroke="#FFFFFF" stroke-width="2.5" class="trajectory-hero-dot"><title>' + pt.year + ': ' + disp + '</title></circle><g transform="translate(' + cx + ', ' + (cy - 12) + ')"><rect x="-18" y="-16" width="36" height="17" rx="5" fill="var(--color-primary-dark)" stroke="var(--color-primary-light)" stroke-width="1" class="trajectory-hero-badge"/><text x="0" y="-4" text-anchor="middle" font-size="10.5" font-weight="800" fill="#FFFFFF" font-family="var(--font-display)">' + disp + '</text></g>';
                } else if (pt.isTarget) {
                    dHtml += '<rect x="' + (cx - 5) + '" y="' + (cy - 5) + '" width="10" height="10" transform="rotate(45 ' + cx + ' ' + cy + ')" fill="var(--color-target)" stroke="#FFFFFF" stroke-width="2"><title>' + pt.year + ': ' + disp + '</title></rect><text x="' + cx + '" y="' + (cy - 10) + '" text-anchor="middle" font-size="10" font-weight="700" fill="var(--color-target)" font-family="var(--font-display)" class="trajectory-meta-text">' + disp + '</text>';
                } else if (pt.isBase) {
                    dHtml += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#FFFFFF" stroke="var(--color-primary-chart)" stroke-width="2.5"><title>' + pt.year + ': ' + disp + '</title></circle><text x="' + cx + '" y="' + (cy - 9) + '" text-anchor="middle" font-size="10" font-weight="700" fill="var(--color-primary-dark)" font-family="var(--font-display)" class="trajectory-base-text">' + disp + '</text>';
                } else {
                    dHtml += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="var(--color-primary-light)" stroke="#FFFFFF" stroke-width="1.5"><title>' + pt.year + ': ' + disp + '</title></circle><text x="' + cx + '" y="' + (cy - 8) + '" text-anchor="middle" font-size="9.5" font-weight="600" fill="var(--color-text-secondary)" font-family="var(--font-display)">' + disp + '</text>';
                }
            });
            dotsLayer.innerHTML = dHtml;
        }
    }

    // Exposição no Escopo Global
    global.getPdeGoalsState = getPdeGoalsState;
    global.renderDashboardMetricCards = renderDashboardMetricCards;
    global.renderDashboardPdeProgress = renderDashboardPdeProgress;
    global.updatePdeTrajectoryProgress = updatePdeTrajectoryProgress;

})(typeof window !== 'undefined' ? window : this);
