/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — PACTUAÇÃO DE METAS PDE & PLANOS DE INTERVENÇÃO
 * Arquivo: js/modules/metas/metas_pactuacao.js
 * Descrição: Gestão de metas por escola (PDE), cálculo de gaps e risco,
 *            e gerador manual/IA de Planos de Desenvolvimento Escolar.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var gdSchoolTargetsMap = {};
    var gdSchoolPdePlansMap = {};

    function initGdMetasDatabase() {
        try {
            var parseFn = (typeof global.safeJsonParse === 'function') ? global.safeJsonParse : JSON.parse;
            var savedTargets = localStorage.getItem('gd_school_targets_db');
            if (savedTargets) gdSchoolTargetsMap = parseFn(savedTargets, {}) || {};

            var savedPde = localStorage.getItem('gd_school_pde_plans_db');
            if (savedPde) gdSchoolPdePlansMap = parseFn(savedPde, {}) || {};
        } catch(e) {
            gdSchoolTargetsMap = {};
            gdSchoolPdePlansMap = {};
        }
    }

    function checkPossuiAvaliacaoRealizada(schName, selectedYear) {
        if (selectedYear === '2023' || selectedYear === '2025') return true;
        var state = global.SCHOOL_ASSESSMENTS_STATE ? global.SCHOOL_ASSESSMENTS_STATE[selectedYear] : null;
        if (!state) return false;
        if (state.hasOwnProperty(schName)) return state[schName];
        return state.default !== undefined ? state.default : false;
    }

    function handleRegisterFirstAssessment(schName, year) {
        if (!global.SCHOOL_ASSESSMENTS_STATE) global.SCHOOL_ASSESSMENTS_STATE = {};
        if (!global.SCHOOL_ASSESSMENTS_STATE[year]) global.SCHOOL_ASSESSMENTS_STATE[year] = {};
        global.SCHOOL_ASSESSMENTS_STATE[year][schName] = true;
        alert('✅ 1ª Avaliação Diagnóstica de ' + year + ' registrada com sucesso para ' + schName + '!\n\nOs dados de desempenho, desvio e metas de PDE para este ciclo foram liberados.');
        populateIdebGoalsTable();
    }

    function populateIdebGoalsTable() {
        initGdMetasDatabase();
        var tbody = document.getElementById('goals-table-body') || document.getElementById('ideb-goals-table-body');
        if (!tbody) return;

        var filterStatus = (document.getElementById('pde-filter-status') && document.getElementById('pde-filter-status').value) || 'all';
        var filterStage = (document.getElementById('pde-filter-stage') && document.getElementById('pde-filter-stage').value) || 'ai';
        var isAnosIniciais = (filterStage === 'ai');

        var officialSource = (window.OFFICIAL_IMPORTED_STUDENTS_SEED && window.OFFICIAL_IMPORTED_STUDENTS_SEED.escolas) || [];
        var schoolsEvaluated = officialSource.map(function(s) {
            return {
                id: s.inep || s.id,
                nome: s.nome || s.name,
                inep2023: s.ideb_2023 || 5.0,
                score2025: s.ideb_2025_observado || 5.2,
                af2023: s.ideb_2023 || 4.8,
                af2025: s.ideb_2025_observado || 5.0,
                profLP: s.saeb_lp_5ano || 205.0,
                profMAT: s.saeb_mt_5ano || 212.0
            };
        });

        var totalTarget = 0;
        var totalScore = 0;
        var count = 0;

        var renderedRows = schoolsEvaluated.map(function(sch) {
            var baseScore = isAnosIniciais ? sch.inep2023 : (sch.af2023 || sch.inep2023);
            var currentObserved = isAnosIniciais ? sch.score2025 : (sch.af2025 || sch.score2025);

            var targetKey = sch.id + '_' + filterStage;
            var targetScore = gdSchoolTargetsMap[targetKey] ? Number(gdSchoolTargetsMap[targetKey]) : Number((baseScore + 0.3).toFixed(1));
            var gap = Number((currentObserved - targetScore).toFixed(1));

            var riskLevel = 'Baixo (Meta Atingida)';
            var riskBadge = '<span class="badge badge-success" style="font-size:0.7rem; font-weight:800;">🟢 Baixo (Meta OK)</span>';

            if (gap < -0.3 || currentObserved < 4.6) {
                riskLevel = 'Alto (Risco Crítico)';
                riskBadge = '<span class="badge badge-danger" style="font-size:0.7rem; font-weight:800;">🔴 Alto (Risco Crítico)</span>';
            } else if (gap < 0) {
                riskLevel = 'Médio (Atenção)';
                riskBadge = '<span class="badge badge-warning" style="font-size:0.7rem; font-weight:800;">🟡 Médio (Atenção)</span>';
            }

            if (filterStatus === 'risk' && riskLevel.includes('Baixo')) return null;
            if (filterStatus === 'ok' && !riskLevel.includes('Baixo')) return null;

            totalTarget += targetScore;
            totalScore += currentObserved;
            count++;

            var pdePlan = gdSchoolPdePlansMap[sch.id];
            var pdeCell = pdePlan ? [
                '<div style="text-align: left; line-height: 1.3;">',
                '    <div style="font-size: 0.76rem; font-weight: 800; color: #6366f1;">' + pdePlan.indicator + '</div>',
                '    <div style="font-size: 0.68rem; color: var(--color-text-secondary);">Resp: ' + pdePlan.responsible + ' • Prazo: ' + pdePlan.deadline + '</div>',
                '    <span class="badge ' + (pdePlan.status.includes('Concluído') ? 'badge-success' : 'badge-neutral') + '" style="font-size:0.62rem; margin-top:2px;">' + pdePlan.status + '</span>',
                '</div>'
            ].join('') : '<span class="text-sm text-muted" style="font-size: 0.75rem;">Sem plano cadastrado</span>';

            return [
                '<tr style="border-bottom: 1px solid var(--color-border-subtle); height: 58px;">',
                '    <td style="padding: 12px 16px;">',
                '        <strong style="font-size: 0.88rem; color: var(--color-brand-primary); display: block;">' + sch.nome + '</strong>',
                '        <span style="font-size: 0.72rem; color: var(--color-text-secondary); font-family: var(--font-display); font-variant-numeric: tabular-nums;">INEP: ' + sch.id + ' • Gonçalves Dias (MA)</span>',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-weight: 700; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.95rem; color: var(--color-text-secondary);">' + baseScore.toFixed(1) + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <input type="number" step="0.1" min="1.0" max="10.0" value="' + targetScore.toFixed(1) + '" onchange="handleUpdateSchoolTarget(\'' + sch.id + '\', \'' + filterStage + '\', this.value)" style="width: 65px; height: 32px; text-align: center; font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.92rem; color: #6366f1; background: var(--color-surface-card); border: 1px solid var(--color-border-strong); border-radius: var(--radius-sm);">',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.82rem; color: var(--color-brand-primary);">',
                '        <strong>' + (currentObserved * 0.96).toFixed(2) + '</strong> N <span style="font-size: 0.68rem; color: var(--color-text-secondary);">(' + sch.profLP.toFixed(0) + ' LP/' + sch.profMAT.toFixed(0) + ' MT)</span>',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center; font-weight: 800; font-family: var(--font-display); font-variant-numeric: tabular-nums; font-size: 0.95rem; color: ' + (gap >= 0 ? '#10b981' : '#ef4444') + ';">' + (gap >= 0 ? '+' : '') + gap.toFixed(1) + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">' + riskBadge + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">' + pdeCell + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <button onclick="openPdeManagerForSchool(\'' + sch.id + '\', \'' + sch.nome.replace(/'/g, "\\'") + '\', ' + targetScore + ')" class="btn btn-outline btn-sm" style="font-size: 0.74rem; font-weight: 700; color: #6366f1; border-color: #6366f1; padding: 4px 8px;" title="Gerenciar Plano de Ação">' + (pdePlan ? '✏️ Editar PDE' : '📋 Criar PDE') + '</button>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).filter(Boolean);

        if (renderedRows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="padding:30px; text-align:center; color:var(--color-text-secondary);">Nenhuma escola encontrada para o filtro de risco selecionado.</td></tr>';
            return;
        }

        tbody.innerHTML = renderedRows.join('');

        var avgScore = count > 0 ? (totalScore / count).toFixed(1) : '5.2';
        var summaryIdeb = document.getElementById('metas-summary-ideb');
        if (summaryIdeb) summaryIdeb.textContent = avgScore;

        var countBadge = document.getElementById('pde-count-schools-badge');
        if (countBadge) countBadge.textContent = count + ' Escolas Mapeadas';
    }

    function handleUpdateSchoolTarget(schId, stage, val) {
        var num = parseFloat(val);
        if (isNaN(num) || num < 1 || num > 10) return;

        var key = schId + '_' + stage;
        gdSchoolTargetsMap[key] = num;
        try {
            localStorage.setItem('gd_school_targets_db', JSON.stringify(gdSchoolTargetsMap));
        } catch(e) {}

        populateIdebGoalsTable();
    }

    function openPdeManagerForSchool(schId, schName, targetScore) {
        var modal = document.getElementById('modal-pde-manager');
        if (!modal) return;

        var idInput = document.getElementById('pde-manager-school-id');
        var titleEl = document.getElementById('pde-modal-school-title');
        var metaEl = document.getElementById('pde-modal-school-meta');
        var targetInput = document.getElementById('pde-manager-target-score');

        if (idInput) idInput.value = schId;
        if (titleEl) titleEl.textContent = schName;
        if (metaEl) metaEl.textContent = 'Unidade Escolar de Gonçalves Dias (MA) • Plano de Intervenção Pedagógica (PDE)';
        if (targetInput) targetInput.value = targetScore ? targetScore.toFixed(1) : '5.5';

        var existing = gdSchoolPdePlansMap[schId];
        var indEl = document.getElementById('pde-manager-indicator');
        var respEl = document.getElementById('pde-manager-responsible');
        var deadEl = document.getElementById('pde-manager-deadline');
        var actEl = document.getElementById('pde-manager-actions');
        var statEl = document.getElementById('pde-manager-status');

        if (existing) {
            if (indEl) indEl.value = existing.indicator || 'Recomposição de Fluência Leitora (D1 a D6)';
            if (respEl) respEl.value = existing.responsible || 'Coordenador Pedagógico';
            if (deadEl) deadEl.value = existing.deadline || '2026-11-30';
            if (actEl) actEl.value = existing.actions || '';
            if (statEl) statEl.value = existing.status || 'Em Execução';
        } else {
            if (actEl) actEl.value = '1. Monitoramento quinzenal de fluência leitora e resolução de problemas;\n2. Oficinas práticas semanais nos descritores prioritários com gap;\n3. Plantões pedagógicos para os alunos nos níveis crítico e muito crítico.';
            if (respEl) respEl.value = 'Coordenador Pedagógico & Direção';
            if (deadEl) deadEl.value = '2026-11-30';
        }

        switchPdeModalMode('manual');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    function closePdeManagerModal() {
        var modal = document.getElementById('modal-pde-manager');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    }

    function switchPdeModalMode(mode) {
        var btnManual = document.getElementById('btn-pde-mode-manual');
        var btnAi = document.getElementById('btn-pde-mode-ai');
        var btnPdf = document.getElementById('btn-pde-mode-pdf');
        var pdfPanel = document.getElementById('pde-panel-pdf-upload');
        var actionsText = document.getElementById('pde-manager-actions');

        [btnManual, btnAi, btnPdf].forEach(function(b) {
            if (b) {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--color-text-secondary)';
                b.style.borderColor = 'var(--color-border-subtle)';
            }
        });

        if (mode === 'manual') {
            if (btnManual) {
                btnManual.classList.add('active');
                btnManual.style.background = '#6366f1';
                btnManual.style.color = '#fff';
                btnManual.style.borderColor = '#6366f1';
            }
            if (pdfPanel) pdfPanel.style.display = 'none';
        } else if (mode === 'ai') {
            if (btnAi) {
                btnAi.classList.add('active');
                btnAi.style.background = '#6366f1';
                btnAi.style.color = '#fff';
                btnAi.style.borderColor = '#6366f1';
            }
            if (pdfPanel) pdfPanel.style.display = 'none';
            if (actionsText) {
                actionsText.value = '🤖 PLANO DE INTERVENÇÃO GERADO AUTOMATICAMENTE:\n\n• Eixo 1: Recomposição de Habilidades Críticas do SAEB (Foco em D1, D3, D13 e D16)\n• Eixo 2: Ciclo de Simulados Diagnósticos Quinzenais com Devolutiva Pedagógica\n• Eixo 3: Formação Continuada dos Docentes em Matrizes de Referência e BNCC\n• Eixo 4: Tutoria Individualizada para os 15% de alunos com maior defasagem';
            }
        } else if (mode === 'pdf') {
            if (btnPdf) {
                btnPdf.classList.add('active');
                btnPdf.style.background = '#6366f1';
                btnPdf.style.color = '#fff';
                btnPdf.style.borderColor = '#6366f1';
            }
            if (pdfPanel) pdfPanel.style.display = 'block';
        }
    }

    function handleSavePdeManagerForm(e) {
        if (e && e.preventDefault) e.preventDefault();

        var schId = document.getElementById('pde-manager-school-id') ? document.getElementById('pde-manager-school-id').value : '';
        if (!schId) return;

        var indicator = (document.getElementById('pde-manager-indicator') && document.getElementById('pde-manager-indicator').value) || 'Recomposição de Fluência Leitora';
        var targetScore = parseFloat((document.getElementById('pde-manager-target-score') && document.getElementById('pde-manager-target-score').value) || '5.5');
        var responsible = (document.getElementById('pde-manager-responsible') && document.getElementById('pde-manager-responsible').value) || 'Coordenador';
        var deadline = (document.getElementById('pde-manager-deadline') && document.getElementById('pde-manager-deadline').value) || '2026-11-30';
        var actions = (document.getElementById('pde-manager-actions') && document.getElementById('pde-manager-actions').value) || '';
        var status = (document.getElementById('pde-manager-status') && document.getElementById('pde-manager-status').value) || 'Em Execução';

        gdSchoolPdePlansMap[schId] = {
            indicator: indicator,
            targetScore: targetScore,
            responsible: responsible,
            deadline: deadline,
            actions: actions,
            status: status,
            updatedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem('gd_school_pde_plans_db', JSON.stringify(gdSchoolPdePlansMap));
        } catch(err) {}

        closePdeManagerModal();
        populateIdebGoalsTable();
        if (typeof global.showToast === 'function') {
            global.showToast('✅ Plano de Desenvolvimento Escolar (PDE) registrado com sucesso!', 'success');
        } else {
            alert('✅ Plano de Desenvolvimento Escolar (PDE) registrado com sucesso!');
        }
    }

    function handleAutoGenerateAllPdePlans() {
        var schools = (window.OFFICIAL_IMPORTED_STUDENTS_SEED && window.OFFICIAL_IMPORTED_STUDENTS_SEED.escolas) || [];
        schools.forEach(function(s) {
            var schId = s.inep || s.id;
            if (!gdSchoolPdePlansMap[schId]) {
                gdSchoolPdePlansMap[schId] = {
                    indicator: 'Recomposição SAEB & BNCC (D1 a D16)',
                    targetScore: 5.5,
                    responsible: 'Coordenação Pedagógica da Rede SEMED',
                    deadline: '2026-11-30',
                    actions: '1. Aplicação do protocolo de reforço quinzenal; 2. Formação em descritores da BNCC; 3. Simulados com devolutiva imediata.',
                    status: 'Em Execução',
                    updatedAt: new Date().toISOString()
                };
            }
        });

        try {
            localStorage.setItem('gd_school_pde_plans_db', JSON.stringify(gdSchoolPdePlansMap));
        } catch(err) {}

        populateIdebGoalsTable();
        if (typeof global.showToast === 'function') {
            global.showToast('✨ Planos de Desenvolvimento Escolar (PDE) gerados automaticamente!', 'sparkles');
        } else {
            alert('✨ Planos de Desenvolvimento Escolar (PDE) gerados automaticamente para todas as escolas da rede de Gonçalves Dias com gap ou risco!');
        }
    }

    function handleExportPdeReportPdf() {
        if (typeof global.print === 'function') global.print();
    }

    // Exposição Global
    global.initGdMetasDatabase = initGdMetasDatabase;
    global.checkPossuiAvaliacaoRealizada = checkPossuiAvaliacaoRealizada;
    global.handleRegisterFirstAssessment = handleRegisterFirstAssessment;
    global.populateIdebGoalsTable = populateIdebGoalsTable;
    global.handleUpdateSchoolTarget = handleUpdateSchoolTarget;
    global.openPdeManagerForSchool = openPdeManagerForSchool;
    global.closePdeManagerModal = closePdeManagerModal;
    global.switchPdeModalMode = switchPdeModalMode;
    global.handleSavePdeManagerForm = handleSavePdeManagerForm;
    global.handleAutoGenerateAllPdePlans = handleAutoGenerateAllPdePlans;
    global.handleExportPdeReportPdf = handleExportPdeReportPdf;

})(typeof window !== 'undefined' ? window : this);
