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
                            <span style="margin-left: auto; font-size: var(--text-xs); color: var(--color-text-secondary);">Meta 2026: <strong style="color: var(--color-brand-primary);">5.8</strong></span>
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

    // Exposição no Escopo Global
    global.getPdeGoalsState = getPdeGoalsState;
    global.renderDashboardMetricCards = renderDashboardMetricCards;
    global.renderDashboardPdeProgress = renderDashboardPdeProgress;

})(typeof window !== 'undefined' ? window : this);
