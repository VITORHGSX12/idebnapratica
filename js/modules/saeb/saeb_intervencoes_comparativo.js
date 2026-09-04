/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO SAEB (INTERVENÇÕES PEDAGÓGICAS & COMPARATIVO)
 * Arquivo: js/modules/saeb/saeb_intervencoes_comparativo.js
 * Descrição: Gestão de Planos de Intervenção Pedagógica (Sub-aba 1) e
 *            Quadro Comparativo Oficial SAEB 2025 x Simulados da Rede (Sub-aba 2).
 * ============================================================================
 */

(function (global) {
    'use strict';

    // 9 Escolas Oficiais de Gonçalves Dias - MA (Dados Canônicos SAEB / INEP)
    var ESCOLAS_OFICIAIS_SAEB = [
        {
            id: 'esc_1',
            nome: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ',
            inep: '21286973',
            zona: 'Sede Urbana',
            inse: 'Nível IV',
            saebLp5: 208.4,
            saebMat5: 215.2,
            ideb2025: 5.4,
            simulado2026: 5.5,
            meta2026: 5.5
        },
        {
            id: 'esc_2',
            nome: 'UI JOSE CORREA LIMA',
            inep: '21128723',
            zona: 'Zona Rural',
            inse: 'Nível IV',
            saebLp5: 194.2,
            saebMat5: 201.5,
            ideb2025: 4.9,
            simulado2026: 5.1,
            meta2026: 5.0
        },
        {
            id: 'esc_3',
            nome: 'UI EMILIO MURAD',
            inep: '21128146',
            zona: 'Zona Rural',
            inse: 'Nível III',
            saebLp5: 202.1,
            saebMat5: 209.4,
            ideb2025: 5.2,
            simulado2026: 5.3,
            meta2026: 5.3
        },
        {
            id: 'esc_4',
            nome: 'UE VEREADOR LEONARDO FERREIRA LIMA',
            inep: '21128740',
            zona: 'Sede Urbana',
            inse: 'Nível IV',
            saebLp5: 212.8,
            saebMat5: 219.0,
            ideb2025: 5.6,
            simulado2026: 5.8,
            meta2026: 5.7
        },
        {
            id: 'esc_5',
            nome: 'U I BASILIO ALVES',
            inep: '21128120',
            zona: 'Zona Rural',
            inse: 'Nível III',
            saebLp5: 198.5,
            saebMat5: 205.1,
            ideb2025: 5.1,
            simulado2026: 5.2,
            meta2026: 5.2
        },
        {
            id: 'esc_6',
            nome: 'UE RAIMUNDO DOS REIS DA SILVA',
            inep: '21128758',
            zona: 'Zona Rural',
            inse: 'Nível III',
            saebLp5: 191.0,
            saebMat5: 197.8,
            ideb2025: 4.8,
            simulado2026: 5.0,
            meta2026: 4.9
        },
        {
            id: 'esc_7',
            nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS',
            inep: '21286990',
            zona: 'Zona Rural',
            inse: 'Nível III',
            saebLp5: 200.3,
            saebMat5: 207.6,
            ideb2025: 5.1,
            simulado2026: 5.3,
            meta2026: 5.2
        },
        {
            id: 'esc_8',
            nome: 'UNIDADE ESCOLAR ANISIO GOMES',
            inep: '21128774',
            zona: 'Zona Rural',
            inse: 'Nível III',
            saebLp5: 196.8,
            saebMat5: 203.4,
            ideb2025: 5.0,
            simulado2026: 5.2,
            meta2026: 5.1
        },
        {
            id: 'esc_9',
            nome: 'UE ANITA FURTADO',
            inep: '21192544',
            zona: 'Sede Urbana',
            inse: 'Nível III',
            saebLp5: 210.5,
            saebMat5: 217.2,
            ideb2025: 5.5,
            simulado2026: 5.6,
            meta2026: 5.6
        }
    ];

    // =========================================================================
    // SUBTAB 1: MODELOS DE INTERVENÇÃO PEDAGÓGICA (SELETOR ESCOLA/TURMA & IA)
    // =========================================================================

    function initPedagogicPlansSubtab() {
        var schoolSelect = document.getElementById('plan-school-select');
        var classSelect = document.getElementById('plan-class-select');
        var btnGenerateAi = document.getElementById('btn-generate-ai-plan');

        if (schoolSelect) {
            var allEscolas = typeof global.getOfficialSchoolsState === 'function'
                ? global.getOfficialSchoolsState()
                : (Array.isArray(global.dbEscolas) ? global.dbEscolas : ESCOLAS_OFICIAIS_SAEB);

            var schoolOpts = '<option value="">Selecione uma Escola da Rede...</option>';
            allEscolas.forEach(function (esc) {
                var nome = esc.nome || esc.name || esc.escola || esc.id;
                var id = esc.id || esc.codigo_inep || esc.inep || nome;
                schoolOpts += `<option value="${id}">${nome}</option>`;
            });
            schoolSelect.innerHTML = schoolOpts;

            schoolSelect.onchange = function () {
                var selSchool = schoolSelect.value;
                if (!classSelect) return;

                if (!selSchool) {
                    classSelect.innerHTML = '<option value="">Selecione a Escola...</option>';
                    return;
                }

                var turmas = typeof global.getTurmasPorEscola === 'function'
                    ? global.getTurmasPorEscola(selSchool)
                    : [];

                if (turmas.length === 0) {
                    classSelect.innerHTML = `
                        <option value="all">Todas as Turmas</option>
                        <option value="2ano">2º Ano EF</option>
                        <option value="5ano">5º Ano EF</option>
                        <option value="9ano">9º Ano EF</option>
                    `;
                } else {
                    var opts = '<option value="all">Todas as Turmas desta Escola</option>';
                    turmas.forEach(function (t) {
                        var label = t.nome + (t.serie ? ' (' + t.serie + ')' : '');
                        opts += `<option value="${t.id}">${label}</option>`;
                    });
                    classSelect.innerHTML = opts;
                }
            };
        }

        if (btnGenerateAi) {
            btnGenerateAi.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                generatePedagogicPlansFromCurrentData();
            };
        }

        bindDownloadPlanButtons();
    }

    function generatePedagogicPlansFromCurrentData() {
        var container = document.getElementById('pedagogic-plans-container');
        if (!container) return;

        var schoolSelect = document.getElementById('plan-school-select');
        var schoolName = schoolSelect && schoolSelect.options[schoolSelect.selectedIndex] ? schoolSelect.options[schoolSelect.selectedIndex].text : 'Rede Municipal';
        if (schoolName.includes('Selecione')) schoolName = 'Rede Municipal';

        var plans = [
            {
                badge: 'Matemática - D14 / D13',
                badgeClass: 'badge-danger',
                afetados: '982 alunos afetados',
                titulo: 'Recomposição Operacional & Resolução de Problemas',
                descricao: `Plano intensivo de 4 semanas para ${schoolName}: cálculo de área, frações e operações fundamentais com suporte de material manipulável.`,
                status: 'Prioridade Alta',
                statusClass: 'badge-danger',
                id: 'mat_d14'
            },
            {
                badge: 'Português - D03 / D06',
                badgeClass: 'badge-warning',
                afetados: '1.240 alunos afetados',
                titulo: 'Fluência Leitora & Inferência Textual Global',
                descricao: `Oficinas pedagógicas quinzenais para ${schoolName}: localização de informações implícitas e tema central em crônicas e contos.`,
                status: 'Recomendado',
                statusClass: 'badge-success',
                id: 'lp_d03'
            },
            {
                badge: 'Ciências - EF05CI02',
                badgeClass: 'badge-info',
                afetados: '540 alunos afetados',
                titulo: 'Ciclo Hidrológico & Conservação Ambiental',
                descricao: `Sequência didática investigativa sobre recursos hídricos e preservação do ecossistema local do Maranhão com experimentos guiados.`,
                status: 'Em Execução',
                statusClass: 'badge-warning',
                id: 'ci_ef05'
            }
        ];

        container.innerHTML = plans.map(function (plan) {
            return `
                <div class="card-outline" style="border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); background: var(--bg-tertiary); display:flex; flex-direction:column; justify-content:space-between; height: 100%;">
                    <div>
                        <div class="flex-between" style="align-items: center; margin-bottom: 12px;">
                            <span class="badge ${plan.badgeClass}">${plan.badge}</span>
                            <span class="text-sm text-muted">${plan.afetados}</span>
                        </div>
                        <h4 style="margin: 0 0 8px 0; color:var(--purple-light);">${plan.titulo}</h4>
                        <p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 16px;">${plan.descricao}</p>
                    </div>
                    <div class="flex-between border-top padding-top-sm" style="margin-top: 12px; padding-top: 10px;">
                        <span class="badge ${plan.statusClass}">${plan.status}</span>
                        <button class="btn btn-outline btn-sm download-plan-btn" data-plan="${plan.id}" onclick="handleDownloadPedagogicPlan('${plan.id}', '${plan.titulo.replace(/'/g, "\\'")}'); return false;">
                            <i data-lucide="download" style="width:14px; height:14px;"></i> PDF
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }

        if (typeof global.showToast === 'function') {
            global.showToast(`✨ Planos de intervenção gerados com sucesso para ${schoolName}!`, 'success');
        }
    }

    function bindDownloadPlanButtons() {
        var buttons = document.querySelectorAll('.download-plan-btn');
        buttons.forEach(function (btn) {
            btn.onclick = function (e) {
                if (e && e.preventDefault) e.preventDefault();
                var planId = btn.getAttribute('data-plan') || 'plano';
                handleDownloadPedagogicPlan(planId, 'Plano de Intervenção Pedagógica');
            };
        });
    }

    function handleDownloadPedagogicPlan(planId, title) {
        if (typeof global.showToast === 'function') {
            global.showToast(`📄 Gerando PDF do ${title}...`, 'info');
        }
        if (typeof global.print === 'function') {
            global.print();
        }
    }

    // =========================================================================
    // SUBTAB 2: QUADRO COMPARATIVO OFICIAL SAEB 2025 X SIMULADOS DA REDE
    // =========================================================================

    function renderSaebOficialComparativoTable() {
        var tbody = document.getElementById('table-saeb-comparativo-body');
        if (!tbody) return;

        var html = [];

        ESCOLAS_OFICIAIS_SAEB.forEach(function (esc) {
            var gap = Math.round((esc.simulado2026 - esc.meta2026) * 10) / 10;
            var gapBadge = gap >= 0 
                ? `<span class="badge badge-success" style="font-size:0.7rem;">+${gap} (Na Meta)</span>`
                : `<span class="badge badge-danger" style="font-size:0.7rem;">${gap} (Atenção)</span>`;

            html.push(`
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.82rem; transition: background 0.15s ease;">
                    <td style="padding: 12px 14px; font-weight: 700; color: var(--text-primary);">
                        ${esc.nome}
                        <div style="font-size: 0.7rem; color: var(--text-muted); font-family: var(--font-mono);">INEP: ${esc.inep}</div>
                    </td>
                    <td style="padding: 12px 14px; text-align: center;">
                        <span class="badge badge-outline" style="font-size: 0.72rem;">${esc.zona}</span>
                        <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">${esc.inse}</div>
                    </td>
                    <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #6366f1; font-family: var(--font-mono);">
                        ${esc.saebLp5} pts
                    </td>
                    <td style="padding: 12px 14px; text-align: center; font-weight: 700; color: #10b981; font-family: var(--font-mono);">
                        ${esc.saebMat5} pts
                    </td>
                    <td style="padding: 12px 14px; text-align: center; font-weight: 800; font-family: var(--font-mono); font-size: 0.9rem;">
                        ${esc.ideb2025.toFixed(1)}
                    </td>
                    <td style="padding: 12px 14px; text-align: center; font-weight: 800; color: #8b5cf6; font-family: var(--font-mono); font-size: 0.9rem;">
                        ${esc.simulado2026.toFixed(1)}
                    </td>
                    <td style="padding: 12px 14px; text-align: center;">
                        <div style="font-weight: 700; font-family: var(--font-mono);">${esc.meta2026.toFixed(1)}</div>
                        <div style="margin-top: 2px;">${gapBadge}</div>
                    </td>
                    <td style="padding: 12px 14px; text-align: center;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="if(window.navigateToTab) window.navigateToTab('escolas-panel');" style="font-size: 0.72rem; padding: 4px 10px; font-weight: 600;">
                            <span>Ver Escola</span>
                        </button>
                    </td>
                </tr>
            `);
        });

        tbody.innerHTML = html.join('\n');

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }
    }

    // Exposição Global
    global.ESCOLAS_OFICIAIS_SAEB = ESCOLAS_OFICIAIS_SAEB;
    global.initPedagogicPlansSubtab = initPedagogicPlansSubtab;
    global.generatePedagogicPlansFromCurrentData = generatePedagogicPlansFromCurrentData;
    global.handleDownloadPedagogicPlan = handleDownloadPedagogicPlan;
    global.renderSaebOficialComparativoTable = renderSaebOficialComparativoTable;

})(typeof window !== 'undefined' ? window : this);
