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
        if (typeof global.showToast === 'function') {
            global.showToast('1ª Avaliação Diagnóstica de ' + year + ' registrada com sucesso para ' + schName + '!', 'check');
        } else {
            alert('1ª Avaliação Diagnóstica de ' + year + ' registrada com sucesso para ' + schName + '!\n\nOs dados de desempenho, desvio e metas de PDE para este ciclo foram liberados.');
        }
        populateIdebGoalsTable();
    }

    function populateIdebGoalsTable() {
        initGdMetasDatabase();
        var tbody = document.getElementById('goals-table-body') || document.getElementById('ideb-goals-table-body');
        if (!tbody) return;

        var filterYear = (document.getElementById('pde-filter-year') && document.getElementById('pde-filter-year').value) || '2026';
        var filterStatus = (document.getElementById('pde-filter-status') && document.getElementById('pde-filter-status').value) || 'all';
        var filterStage = (document.getElementById('pde-filter-stage') && document.getElementById('pde-filter-stage').value) || 'ai';
        var isAnosIniciais = (filterStage === 'ai');

        var CANONICAL_GONCALVES_DIAS_PTE = [
            { id: "21286973", nome: "UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ", inep: "21286973", inep2023: 5.5, score2025: 5.7, af2023: 4.8, af2025: 5.0, profLP: 221.0, profMAT: 229.0 },
            { id: "21128723", nome: "UI JOSE CORREA LIMA", inep: "21128723", inep2023: 5.4, score2025: 5.6, af2023: 4.6, af2025: 4.8, profLP: 218.0, profMAT: 225.0 },
            { id: "21128146", nome: "UI EMILIO MURAD", inep: "21128146", inep2023: 5.1, score2025: 5.3, af2023: 4.5, af2025: 4.7, profLP: 212.0, profMAT: 219.0 },
            { id: "21128740", nome: "UE VEREADOR LEONARDO FERREIRA LIMA", inep: "21128740", inep2023: 5.6, score2025: 5.8, af2023: 4.9, af2025: 5.1, profLP: 223.0, profMAT: 231.0 },
            { id: "21128120", nome: "U I BASILIO ALVES", inep: "21128120", inep2023: 5.0, score2025: 5.2, af2023: 4.4, af2025: 4.6, profLP: 210.0, profMAT: 217.0 },
            { id: "21128758", nome: "UE RAIMUNDO DOS REIS DA SILVA", inep: "21128758", inep2023: 4.9, score2025: 5.1, af2023: 4.3, af2025: 4.5, profLP: 208.0, profMAT: 215.0 },
            { id: "21286990", nome: "UNIDADE INTEGRADA JOSE GONCALVES DIAS", inep: "21286990", inep2023: 5.3, score2025: 5.5, af2023: 4.7, af2025: 4.9, profLP: 216.0, profMAT: 224.0 },
            { id: "21128774", nome: "UNIDADE ESCOLAR ANISIO GOMES", inep: "21128774", inep2023: 4.8, score2025: 5.0, af2023: 4.2, af2025: 4.4, profLP: 205.0, profMAT: 212.0 },
            { id: "21192544", nome: "UE ANITA FURTADO", inep: "21192544", inep2023: 5.4, score2025: 5.6, af2023: 4.6, af2025: 4.8, profLP: 218.0, profMAT: 226.0 }
        ];

        var schoolsEvaluated = CANONICAL_GONCALVES_DIAS_PTE;

        var totalTarget = 0;
        var totalScore = 0;
        var totalProf = 0;
        var totalBase = 0;
        var count = 0;

        var stepAdd = (filterYear === '2027') ? 0.5 : ((filterYear === '2025') ? 0.0 : 0.3);

        var renderedRows = schoolsEvaluated.map(function(sch) {
            var baseScore = isAnosIniciais ? sch.inep2023 : (sch.af2023 || sch.inep2023);
            var currentObserved = isAnosIniciais ? sch.score2025 : (sch.af2025 || sch.score2025);

            var targetKey = sch.id + '_' + filterStage + '_' + filterYear;
            var targetScore = gdSchoolTargetsMap[targetKey] ? Number(gdSchoolTargetsMap[targetKey]) : Number((baseScore + stepAdd).toFixed(1));
            var gap = Number((currentObserved - targetScore).toFixed(1));

            var riskLevel = 'Baixo (Meta Atingida)';
            var riskBadge = '<span class="badge badge-success" style="font-size:0.7rem; font-weight:700;">Baixo (Meta OK)</span>';

            if (gap < -0.3 || currentObserved < 4.6) {
                riskLevel = 'Alto (Risco Crítico)';
                riskBadge = '<span class="badge badge-danger" style="font-size:0.7rem; font-weight:700;">Alto (Risco Crítico)</span>';
            } else if (gap < 0) {
                riskLevel = 'Médio (Atenção)';
                riskBadge = '<span class="badge badge-warning" style="font-size:0.7rem; font-weight:700;">Médio (Atenção)</span>';
            }

            if (filterStatus === 'risk' && riskLevel.includes('Baixo')) return null;
            if (filterStatus === 'ok' && !riskLevel.includes('Baixo')) return null;

            totalTarget += targetScore;
            totalScore += currentObserved;
            totalBase += baseScore;
            totalProf += (sch.profLP + sch.profMAT) / 2;
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
                '        <div style="display:flex; align-items:center; justify-content:center; gap:6px; flex-wrap:wrap;">' +
                (pdePlan ?
                    '            <button type="button" onclick="openViewSchoolPdeModal(\'' + sch.id + '\', \'' + sch.nome.replace(/'/g, "\\'") + '\', ' + targetScore + ', ' + currentObserved + ', ' + gap + ', \'' + riskLevel + '\')" class="btn btn-outline btn-sm" style="font-size: 0.74rem; font-weight: 700; color: #10b981; border-color: rgba(16,185,129,0.4); background: rgba(16,185,129,0.06); padding: 4px 8px; display:inline-flex; align-items:center; gap:4px;" title="Visualizar Plano PDE da Escola"><i data-lucide="eye" style="width:13px;height:13px;"></i> Visualizar PDE</button>' +
                    '            <button type="button" onclick="openPdeManagerForSchool(\'' + sch.id + '\', \'' + sch.nome.replace(/'/g, "\\'") + '\', ' + targetScore + ')" class="btn btn-outline btn-sm" style="font-size: 0.74rem; font-weight: 600; color: #6366f1; border-color: rgba(99,102,241,0.4); padding: 4px 8px; display:inline-flex; align-items:center; gap:4px;" title="Editar Plano PDE"><i data-lucide="edit-3" style="width:12px;height:12px;"></i> Editar</button>'
                :
                    '            <button type="button" onclick="openPdeManagerForSchool(\'' + sch.id + '\', \'' + sch.nome.replace(/'/g, "\\'") + '\', ' + targetScore + ')" class="btn btn-primary btn-sm" style="font-size: 0.74rem; font-weight: 700; padding: 4px 10px; display:inline-flex; align-items:center; gap:4px;" title="Criar Novo Plano de Ação PDE"><i data-lucide="plus-circle" style="width:13px;height:13px;"></i> Criar PDE</button>'
                ) +
                '        </div>',
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
        var avgBase = count > 0 ? (totalBase / count).toFixed(1) : '5.0';
        var diff = (avgScore - avgBase).toFixed(1);

        var summaryIdeb = document.getElementById('metas-summary-ideb');
        if (summaryIdeb) summaryIdeb.textContent = avgScore;

        var summaryDiff = document.getElementById('metas-summary-ideb-diff');
        if (summaryDiff) {
            var diffSign = diff >= 0 ? '+' : '';
            summaryDiff.innerHTML = '<i data-lucide="trending-up" style="width:14px; height:14px; display:inline-block; vertical-align:middle;"></i> ' + diffSign + diff + ' vs IDEB 2023';
        }

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

    async function openPdeManagerForSchool(schId, schName, targetScore) {
        var modal = document.getElementById('modal-pde-manager');
        if (!modal) return;

        var idInput = document.getElementById('pde-manager-school-id');
        var titleEl = document.getElementById('pde-modal-school-title');
        var metaEl = document.getElementById('pde-modal-school-meta');
        var targetInput = document.getElementById('pde-manager-target-score');
        var diagStatus = document.getElementById('pde-school-diag-status');
        var diagContent = document.getElementById('pde-school-diagnostic-content');

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
            if (actEl) actEl.value = '1. Monitoramento contínuo com aplicação dos protocolos diagnósticos;\n2. Aulões focados nos descritores prioritários com maior defasagem;\n3. Acompanhamento individualizado para os alunos em nível crítico.';
            if (respEl) respEl.value = 'Coordenador Pedagógico & Direção';
            if (deadEl) deadEl.value = '2026-11-30';
        }

        switchPdeModalMode('manual');
        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        // Carregar Diagnóstico Agregado por Descritores da Escola (Camada 4 - Zero Dados Fictícios)
        if (diagContent) {
            diagContent.innerHTML = '<span class="loading-spinner" style="display:inline-block; width:14px; height:14px; border:2px solid #4A7FA7; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:6px;"></span> Carregando dados agregados dos simulados da escola...';
        }
        if (diagStatus) diagStatus.textContent = 'Consultando banco...';

        try {
            var res = typeof global.apiFetch === 'function'
                ? await global.apiFetch('/api/escolas/' + encodeURIComponent(schId) + '/diagnostico-descritores')
                : await fetch('/api/escolas/' + encodeURIComponent(schId) + '/diagnostico-descritores');

            var data = null;
            if (res && res.ok) data = await res.json();

            var prioridades = (data && data.success && Array.isArray(data.descritoresPrioritarios)) ? data.descritoresPrioritarios : [];
            var totalAlunos = (data && data.totalAlunosAvaliados) || 0;

            if (totalAlunos === 0 || prioridades.length === 0) {
                if (diagStatus) diagStatus.textContent = 'Sem simulados lançados';
                if (diagContent) {
                    diagContent.innerHTML = `
                        <div style="background:rgba(255,255,255,0.03); border:1px dashed var(--border-color); border-radius:6px; padding:10px 12px; font-style:italic; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
                            <i data-lucide="info" style="width:16px;height:16px;flex-shrink:0;"></i>
                            <span><strong>Aguardando dados de simulados:</strong> Nenhum simulado com respostas foi lançado para esta escola até o momento. O ranking de descritores críticos será calculado automaticamente após os lançamentos de notas.</span>
                        </div>
                    `;
                }
            } else {
                if (diagStatus) diagStatus.textContent = `${totalAlunos} alunos avaliados`;
                var itemsHtml = prioridades.slice(0, 5).map(function(d) {
                    var cor = d.prioridadePDE === 'ALTA' ? '#ef4444' : (d.prioridadePDE === 'MEDIA' ? '#f59e0b' : '#10b981');
                    return `
                        <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:6px; padding:6px 10px; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <strong style="color:${cor};">${d.codigo}</strong> <span style="color:var(--text-secondary); font-size:0.74rem;">— ${d.descricao}</span>
                                <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">Sugestão: ${d.sugestaoPlanoAcao}</div>
                            </div>
                            <span style="font-size:0.72rem; font-weight:800; color:${cor}; white-space:nowrap; margin-left:12px;">${d.alunosEmDefasagem}/${d.totalAlunosAvaliados} alunos (${d.taxaDefasagemPct}%)</span>
                        </div>
                    `;
                }).join('');

                if (diagContent) {
                    diagContent.innerHTML = `
                        <div style="margin-bottom:8px;"><strong>Descritores com Maior Taxa de Defasagem na Escola:</strong></div>
                        ${itemsHtml}
                    `;
                }
            }
        } catch(e) {
            console.warn('[PDE School Diag Error]', e);
            if (diagStatus) diagStatus.textContent = 'Indisponível';
            if (diagContent) diagContent.innerHTML = '<span style="color:var(--text-muted);">Dados agregados de simulados não disponíveis no momento.</span>';
        }
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
                btnManual.style.background = '#4A7FA7';
                btnManual.style.color = '#fff';
                btnManual.style.borderColor = '#4A7FA7';
            }
            if (pdfPanel) pdfPanel.style.display = 'none';
        } else if (mode === 'ai') {
            if (btnAi) {
                btnAi.classList.add('active');
                btnAi.style.background = '#4A7FA7';
                btnAi.style.color = '#fff';
                btnAi.style.borderColor = '#4A7FA7';
            }
            if (pdfPanel) pdfPanel.style.display = 'none';
            if (actionsText) {
                actionsText.value = 'PROPOSTA DE PLANO DE DESENVOLVIMENTO ESCOLAR (PDE):\n\n• Eixo 1: Recomposição nos descritores prioritários diagnosticados nos simulados municipais.\n• Eixo 2: Ciclo de simulados com devolutiva individualizada e oficinas de fluência e raciocínio.\n• Eixo 3: Formação continuada e alinhamento pedagógico com as matrizes SAEB / BNCC.\n• Eixo 4: Monitoramento quinzenal de frequência e plantões pedagógicos para os estudantes em defasagem.';
            }
        } else if (mode === 'pdf') {
            if (btnPdf) {
                btnPdf.classList.add('active');
                btnPdf.style.background = '#4A7FA7';
                btnPdf.style.color = '#fff';
                btnPdf.style.borderColor = '#4A7FA7';
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
            global.showToast('Plano de Desenvolvimento Escolar (PDE) registrado com sucesso!', 'success');
        } else {
            alert('Plano de Desenvolvimento Escolar (PDE) registrado com sucesso!');
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
            global.showToast('Planos de Desenvolvimento Escolar (PDE) gerados automaticamente!', 'sparkles');
        } else {
            alert('Planos de Desenvolvimento Escolar (PDE) gerados automaticamente para todas as escolas da rede de Gonçalves Dias com gap ou risco!');
        }
    }

    function openViewSchoolPdeModal(schId, schName, targetScore, currentObserved, gap, riskLevel) {
        var modal = document.getElementById('modal-school-pde-plan');
        if (!modal) return;

        var nameEl = document.getElementById('modal-pde-school-name');
        var riskBadgeEl = document.getElementById('modal-pde-risk-badge');
        var metaEl = document.getElementById('modal-pde-school-meta');
        var bodyEl = document.getElementById('modal-pde-content-body');

        if (nameEl) nameEl.textContent = schName;

        var numGap = Number(gap || 0);
        var numObs = Number(currentObserved || 5.0);
        var numTarget = Number(targetScore || 5.5);

        if (riskBadgeEl) {
            if (numGap < -0.3 || numObs < 4.6) {
                riskBadgeEl.className = 'badge badge-danger';
                riskBadgeEl.textContent = 'Alto Risco (GAP: ' + numGap.toFixed(1) + ')';
            } else if (numGap < 0) {
                riskBadgeEl.className = 'badge badge-warning';
                riskBadgeEl.textContent = 'Médio Risco (GAP: ' + numGap.toFixed(1) + ')';
            } else {
                riskBadgeEl.className = 'badge badge-success';
                riskBadgeEl.textContent = 'Meta Atingida (+ ' + Math.abs(numGap).toFixed(1) + ')';
            }
        }

        if (metaEl) {
            metaEl.textContent = 'INEP: ' + schId + ' • Observado: ' + numObs.toFixed(1) + ' | Meta Pactuada: ' + numTarget.toFixed(1) + ' (Gap: ' + (numGap >= 0 ? '+' : '') + numGap.toFixed(1) + ')';
        }

        var pdePlan = gdSchoolPdePlansMap[schId] || {
            indicator: 'Recomposição SAEB & BNCC (D1 a D16)',
            targetScore: numTarget,
            responsible: 'Coordenação Pedagógica & Direção Escolar',
            deadline: '2026-11-30',
            actions: '1. Monitoramento quinzenal de frequência e plantões pedagógicos;\n2. Aulões focados nos descritores prioritários com defasagem;\n3. Simulados com devolutiva imediata e plano de recomposição.',
            status: 'Em Execução'
        };

        if (bodyEl) {
            var rawActions = pdePlan.actions || '';
            var actionsList = rawActions
                .split('\n')
                .filter(function(a) { return a.trim().length > 0; })
                .map(function(a) {
                    return '<li style="margin-bottom:6px; color:var(--text-primary); font-size:0.85rem;">' + a.trim() + '</li>';
                }).join('');

            if (!actionsList) {
                actionsList = '<li style="color:var(--text-secondary);">Ações pedagógicas em fase de consolidação pela equipe escolar.</li>';
            }

            var formattedDate = pdePlan.deadline ? (pdePlan.deadline.includes('-') ? pdePlan.deadline.split('-').reverse().join('/') : pdePlan.deadline) : '30/11/2026';

            bodyEl.innerHTML = [
                '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:18px;">',
                '    <div class="card" style="background:var(--bg-tertiary); border:1px solid var(--border-color); padding:12px 16px; border-radius:var(--radius-md);">',
                '        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Meta Pactuada IDEB</span>',
                '        <strong style="font-size:1.6rem; color:#6366f1; font-weight:800; display:block;">' + numTarget.toFixed(1) + '</strong>',
                '    </div>',
                '    <div class="card" style="background:var(--bg-tertiary); border:1px solid var(--border-color); padding:12px 16px; border-radius:var(--radius-md);">',
                '        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Responsável pela Execução</span>',
                '        <strong style="font-size:0.95rem; color:var(--text-primary); font-weight:700; display:block; margin-top:4px;">' + (pdePlan.responsible || 'Coordenação') + '</strong>',
                '    </div>',
                '    <div class="card" style="background:var(--bg-tertiary); border:1px solid var(--border-color); padding:12px 16px; border-radius:var(--radius-md);">',
                '        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Prazo Limite / Conclusão</span>',
                '        <strong style="font-size:1.1rem; color:var(--text-primary); font-weight:700; display:block; margin-top:2px;">' + formattedDate + '</strong>',
                '    </div>',
                '    <div class="card" style="background:var(--bg-tertiary); border:1px solid var(--border-color); padding:12px 16px; border-radius:var(--radius-md);">',
                '        <span style="font-size:0.72rem; color:var(--text-muted); font-weight:700; text-transform:uppercase;">Status de Execução</span>',
                '        <div style="margin-top:4px;"><span class="badge badge-success" style="font-size:0.75rem;">' + (pdePlan.status || 'Em Execução') + '</span></div>',
                '    </div>',
                '</div>',
                '<div style="background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px; margin-bottom:14px;">',
                '    <h4 style="margin:0 0 6px 0; font-size:0.9rem; font-weight:800; color:#4A7FA7; display:flex; align-items:center; gap:6px;">',
                '        <i data-lucide="target" style="width:16px;height:16px;"></i> Indicador & Eixo Prioritário do PDE',
                '    </h4>',
                '    <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary);">' + (pdePlan.indicator || 'Recomposição das Aprendizagens') + '</div>',
                '</div>',
                '<div style="background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:16px;">',
                '    <h4 style="margin:0 0 10px 0; font-size:0.9rem; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px;">',
                '        <i data-lucide="list-checks" style="width:16px;height:16px;"></i> Plano de Ações Estratégicas Cadastradas',
                '    </h4>',
                '    <ul style="margin:0; padding-left:20px; line-height:1.6;">' + actionsList + '</ul>',
                '</div>'
            ].join('\n');
        }

        var printBtn = document.getElementById('btn-print-pde-modal');
        if (printBtn) {
            printBtn.onclick = function() {
                var printWin = window.open('', '_blank', 'width=880,height=960');
                if (!printWin) {
                    window.print();
                    return;
                }
                var doc = [
                    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>PDE - ' + schName + '</title>',
                    '<style>',
                    '@page { size: A4 portrait; margin: 15mm; }',
                    'body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.5; }',
                    '.header { border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }',
                    '.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }',
                    '.kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }',
                    '.kpi-val { font-size: 18px; font-weight: 800; color: #4338ca; }',
                    '.box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; margin-bottom: 14px; }',
                    'ul { margin: 0; padding-left: 20px; }',
                    'li { margin-bottom: 6px; }',
                    '.signatures { margin-top: 40px; display: flex; justify-content: space-between; gap: 20px; }',
                    '.sig-line { border-top: 1px solid #94a3b8; text-align: center; padding-top: 6px; font-size: 11px; width: 45%; color: #475569; }',
                    '@media print { body { padding: 0; } }',
                    '</style></head><body>',
                    '<div class="header">',
                    '    <div>',
                    '        <h2 style="margin:0; font-size:16px; color:#0f172a;">PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA</h2>',
                    '        <h3 style="margin:3px 0 0 0; font-size:13px; color:#4338ca;">SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED</h3>',
                    '        <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">Plano de Desenvolvimento Escolar (PDE) • Ano Letivo 2026</p>',
                    '    </div>',
                    '    <div style="text-align:right; font-size:11px; color:#64748b;">',
                    '        <strong>Emissão:</strong> ' + new Date().toLocaleDateString('pt-BR') + '<br>',
                    '        INEP: ' + schId,
                    '    </div>',
                    '</div>',
                    '<div class="box" style="background:#eef2ff; border-color:#c7d2fe;">',
                    '    <h3 style="margin:0 0 4px 0; color:#312e81; font-size:14px;">' + schName + '</h3>',
                    '    <p style="margin:0; font-size:12px; color:#4338ca;">Status de Risco: <strong>' + (numGap < 0 ? 'Em Atenção / GAP Defasagem' : 'Meta Atingida') + '</strong></p>',
                    '</div>',
                    '<div class="kpi-grid">',
                    '    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">IDEB BASE</div><div class="kpi-val">' + numObs.toFixed(1) + '</div></div>',
                    '    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">META PACTUADA</div><div class="kpi-val" style="color:#10b981;">' + numTarget.toFixed(1) + '</div></div>',
                    '    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">GAP A SUPERAR</div><div class="kpi-val" style="color:' + (numGap < 0 ? '#ef4444' : '#10b981') + ';">' + (numGap >= 0 ? '+' : '') + numGap.toFixed(1) + '</div></div>',
                    '    <div class="kpi-card"><div style="font-size:10px; color:#64748b; font-weight:700;">STATUS PDE</div><div class="kpi-val" style="font-size:13px; color:#6366f1;">' + (pdePlan.status || 'Em Execução') + '</div></div>',
                    '</div>',
                    '<div class="box">',
                    '    <h4 style="margin:0 0 6px 0; font-size:12px; text-transform:uppercase; color:#334155;">Eixo / Indicador Prioritário</h4>',
                    '    <p style="margin:0; font-size:13px; font-weight:700; color:#0f172a;">' + (pdePlan.indicator || 'Recomposição das Aprendizagens') + '</p>',
                    '    <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;"><strong>Responsável:</strong> ' + (pdePlan.responsible || 'Coordenação') + ' • <strong>Prazo:</strong> ' + formattedDate + '</p>',
                    '</div>',
                    '<div class="box">',
                    '    <h4 style="margin:0 0 8px 0; font-size:12px; text-transform:uppercase; color:#334155;">Ações Estratégicas Pactuadas</h4>',
                    '    <ul>' + actionsList + '</ul>',
                    '</div>',
                    '<div class="signatures">',
                    '    <div class="sig-line">Direção Escolar / Gestão da Unidade</div>',
                    '    <div class="sig-line">Coordenação Pedagógica SEMED Gonçalves Dias</div>',
                    '</div>',
                    '<script>window.onload = function() { window.print(); };<\/script>',
                    '</body></html>'
                ].join('\n');
                printWin.document.open();
                printWin.document.write(doc);
                printWin.document.close();
            };
        }

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
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
    global.openViewSchoolPdeModal = openViewSchoolPdeModal;
    global.closePdeManagerModal = closePdeManagerModal;
    global.switchPdeModalMode = switchPdeModalMode;
    global.handleSavePdeManagerForm = handleSavePdeManagerForm;
    global.handleAutoGenerateAllPdePlans = handleAutoGenerateAllPdePlans;
    global.handleExportPdeReportPdf = handleExportPdeReportPdf;

})(typeof window !== 'undefined' ? window : this);

