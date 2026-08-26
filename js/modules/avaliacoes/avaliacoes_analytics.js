/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — ANALYTICS PEDAGÓGICO, HEATMAP & PROFICIÊNCIA
 * Arquivo: js/modules/avaliacoes/avaliacoes_analytics.js
 * Descrição: Indicadores de adesão, consolidação das 4 faixas de proficiência,
 *            mapa de calor por descritor SAEB ($Q_k$) e laudos pedagógicos.
 * ============================================================================
 */

(function(global) {
    'use strict';

    function initAnalyticsSelectors() {
        var dashEvalSelect = document.getElementById('dash-eval-select');
        var dashSchoolSelect = document.getElementById('dash-school-select');
        var dashClassSelect = document.getElementById('dash-class-select');
        var dashSubjectSelect = document.getElementById('dash-subject-select');

        if (!dashEvalSelect || !dashSchoolSelect) return;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        dashEvalSelect.innerHTML = eventos.map(function(ev) {
            return `<option value="${ev.id}">${ev.titulo}</option>`;
        }).join('');

        var escolas = global.dbEscolas || [
            { id: 'all', nome: 'Todas as Escolas da Rede' },
            { id: 'esc_01', nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS' },
            { id: 'esc_02', nome: 'U I BASILIO ALVES' },
            { id: 'esc_03', nome: 'UI JOSE CORREA LIMA' }
        ];

        dashSchoolSelect.innerHTML = escolas.map(function(e) {
            return `<option value="${e.id}">${e.nome}</option>`;
        }).join('');

        if (dashClassSelect) {
            dashClassSelect.innerHTML = `
                <option value="all">Todas as Turmas</option>
                <option value="turma_5a">5º Ano A</option>
                <option value="turma_5b">5º Ano B</option>
                <option value="turma_9a">9º Ano A</option>
            `;
        }

        dashEvalSelect.onchange = renderAvaliacoesDashboard;
        dashSchoolSelect.onchange = renderAvaliacoesDashboard;
        if (dashClassSelect) dashClassSelect.onchange = renderAvaliacoesDashboard;
        if (dashSubjectSelect) dashSubjectSelect.onchange = renderAvaliacoesDashboard;

        renderAvaliacoesDashboard();
    }

    function irParaDashboardResultados(eventoId) {
        var btnResultadosTab = document.querySelector('[data-subtab="resultados-dash-sub"]');
        if (btnResultadosTab) btnResultadosTab.click();

        var dashEvalSelect = document.getElementById('dash-eval-select');
        if (dashEvalSelect && eventoId) {
            dashEvalSelect.value = eventoId;
        }

        renderAvaliacoesDashboard();
    }

    function renderAvaliacoesDashboard() {
        var dashEvalSelect = document.getElementById('dash-eval-select');
        if (!dashEvalSelect) return;

        var eventoId = dashEvalSelect.value;
        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var ev = eventos.find(function(e) { return e.id === eventoId; }) || eventos[0];

        // 1. Atualizar KPIs Topo
        var adhesionVal = document.getElementById('results-adhesion-value');
        var adhesionSub = document.getElementById('results-adhesion-sub');
        var profVal = document.getElementById('results-proficiency-value');
        var profSub = document.getElementById('results-proficiency-sub');
        var targetVal = document.getElementById('results-target-value');

        if (adhesionVal) adhesionVal.textContent = '94.8%';
        if (adhesionSub) adhesionSub.textContent = '2.820 de 2.975 estudantes avaliados';
        if (profVal) profVal.textContent = '68.4%';
        if (profSub) profSub.textContent = 'Média geral da rede municipal (Nível Adequado)';
        if (targetVal) targetVal.textContent = '72.0%';

        // 2. Atualizar Barras de Distribuição das 4 Faixas
        var barAbaixo = document.getElementById('bar-pct-insuficiente');
        var badgeAbaixo = document.getElementById('badge-pct-insuficiente');
        var barBasico = document.getElementById('bar-pct-basico');
        var badgeBasico = document.getElementById('badge-pct-basico');
        var barAdequado = document.getElementById('bar-pct-adequado');
        var badgeAdequado = document.getElementById('badge-pct-adequado');
        var barAvancado = document.getElementById('bar-pct-avancado');
        var badgeAvancado = document.getElementById('badge-pct-avancado');

        if (barAbaixo && badgeAbaixo) { barAbaixo.style.width = '12.4%'; badgeAbaixo.textContent = '12.4% (350 alunos)'; }
        if (barBasico && badgeBasico) { barBasico.style.width = '28.6%'; badgeBasico.textContent = '28.6% (806 alunos)'; }
        if (barAdequado && badgeAdequado) { barAdequado.style.width = '42.2%'; badgeAdequado.textContent = '42.2% (1.190 alunos)'; }
        if (barAvancado && badgeAvancado) { barAvancado.style.width = '16.8%'; badgeAvancado.textContent = '16.8% (474 alunos)'; }

        // 3. Renderizar Mapa de Calor de Descritores SAEB
        renderHeatmapGrid(ev);
    }

    function renderHeatmapGrid(evento) {
        var grid = document.getElementById('dashboard-heatmap-grid');
        if (!grid) return;

        var matrizSAEB = global.MATRIZ_HABILIDADES_SAEB || { portugues: [], matematica: [] };
        var allHab = matrizSAEB.portugues.concat(matrizSAEB.matematica);

        grid.innerHTML = allHab.slice(0, 16).map(function(h, idx) {
            var mockTaxa = Math.min(95, Math.max(35, Math.floor(40 + (Math.sin(idx * 2) * 25) + (idx * 2))));
            var bg = 'rgba(239, 68, 68, 0.15)';
            var border = '#ef4444';
            var textColor = '#ef4444';

            if (mockTaxa >= 70) {
                bg = 'rgba(16, 185, 129, 0.15)';
                border = '#10b981';
                textColor = '#10b981';
            } else if (mockTaxa >= 50) {
                bg = 'rgba(245, 158, 11, 0.15)';
                border = '#f59e0b';
                textColor = '#f59e0b';
            }

            return `
                <div 
                    onclick="abrirDetalheDescritorAnalytics('${h.codigo}', '${h.nome}', '${mockTaxa}')"
                    style="background: ${bg}; border: 1px solid ${border}; border-radius: var(--radius-sm); padding: 8px 6px; text-align: center; cursor: pointer; transition: transform 0.15s ease;"
                    onmouseover="this.style.transform='translateY(-2px)'"
                    onmouseout="this.style.transform='none'"
                    title="${h.codigo}: ${h.nome}"
                >
                    <div style="font-weight: 800; font-size: 11px; color: ${textColor};">${h.codigo}</div>
                    <div style="font-size: 13px; font-weight: 800; color: var(--color-brand-primary); margin-top: 2px;">${mockTaxa}%</div>
                </div>
            `;
        }).join('');
    }

    function abrirDetalheDescritorAnalytics(codigo, nome, taxa) {
        var card = document.getElementById('heatmap-descriptor-detail-card');
        var codeEl = document.getElementById('detail-desc-code');
        var descEl = document.getElementById('detail-desc-desc');
        var schoolRanks = document.getElementById('detail-descriptor-school-ranks');
        var tipEl = document.getElementById('detail-descriptor-pedagogic-tip');

        if (!card) return;

        card.classList.remove('hidden');

        if (codeEl) codeEl.textContent = codigo + ' — ' + nome + ' (' + taxa + '% de Acerto)';
        if (descEl) descEl.textContent = 'Análise diagnóstica oficial de domínio da habilidade para recomposição de aprendizagem.';

        if (schoolRanks) {
            schoolRanks.innerHTML = `
                <div style="display:flex; justify-content:space-between; padding:4px 8px; font-size:11px; background:var(--color-surface-subtle); border-radius:4px;">
                    <span>UI JOSE GONCALVES DIAS</span>
                    <strong style="color:#10b981;">78.5% Adequado</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 8px; font-size:11px; background:var(--color-surface-subtle); border-radius:4px;">
                    <span>U I BASILIO ALVES</span>
                    <strong style="color:#f59e0b;">56.0% Atenção</strong>
                </div>
                <div style="display:flex; justify-content:space-between; padding:4px 8px; font-size:11px; background:var(--color-surface-subtle); border-radius:4px;">
                    <span>UI JOSE CORREA LIMA</span>
                    <strong style="color:#ef4444;">42.1% Crítico</strong>
                </div>
            `;
        }

        if (tipEl) {
            tipEl.innerHTML = `
                <strong>Plano de Ação Pedagógica:</strong><br>
                Recomenda-se realizar oficinas práticas com foco em <em>${nome}</em>, utilizando questões contextualizadas e atividades de fixação em duplas produtivas.
            `;
        }

        var btnClose = document.getElementById('btn-close-descriptor-detail');
        if (btnClose) {
            btnClose.onclick = function() { card.classList.add('hidden'); };
        }
    }

    // Inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAnalyticsSelectors);
    } else {
        initAnalyticsSelectors();
    }

    // Exposição Global
    global.initAnalyticsSelectors = initAnalyticsSelectors;
    global.irParaDashboardResultados = irParaDashboardResultados;
    global.renderAvaliacoesDashboard = renderAvaliacoesDashboard;
    global.abrirDetalheDescritorAnalytics = abrirDetalheDescritorAnalytics;

})(typeof window !== 'undefined' ? window : this);
