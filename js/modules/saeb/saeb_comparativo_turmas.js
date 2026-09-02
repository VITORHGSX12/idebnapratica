/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO SAEB (COMPARATIVO TURMAS & FICHAS DESCRITIVAS)
 * Arquivo: js/modules/saeb/saeb_comparativo_turmas.js
 * Descrição: Renderização da tabela comparativa por turmas x média municipal
 *            e síntese interpretativa das fichas descritivas dos níveis SAEB.
 * ============================================================================
 */

(function (global) {
    'use strict';

    function renderSaebComparativeTable(turmasLista, mediaGeral, pctGeral, totalGeral) {
        var tbody = document.getElementById('saeb-comparative-table-body');
        if (!tbody) return;

        if (!Array.isArray(turmasLista) || turmasLista.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.8rem;">
                        Nenhuma turma com notas lançadas para o filtro ativo.
                    </td>
                </tr>
            `;
            renderSaebLevelCards();
            return;
        }

        var html = [];

        turmasLista.forEach(function (t) {
            var pn = t.pctNiveis;
            html.push(`
                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.82rem;">
                    <td style="padding: 10px 14px; font-weight: 700; color: var(--text-primary);">
                        ${t.turmaNome}
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${t.escolaNome}</div>
                    </td>
                    <td style="padding: 10px 14px; text-align: center; font-weight: 700;">${t.total}</td>
                    <td style="padding: 10px 14px; text-align: center; color: #ef4444; font-weight: 700;">${pn[0]}%</td>
                    <td style="padding: 10px 14px; text-align: center; color: #f97316; font-weight: 700;">${pn[1]}%</td>
                    <td style="padding: 10px 14px; text-align: center; color: #eab308; font-weight: 700;">${pn[2]}%</td>
                    <td style="padding: 10px 14px; text-align: center; color: #0ea5e9; font-weight: 700;">${pn[3]}%</td>
                    <td style="padding: 10px 14px; text-align: center; color: #22c55e; font-weight: 700;">${pn[4]}%</td>
                    <td style="padding: 10px 14px; text-align: center; color: #a855f7; font-weight: 700;">${pn[5]}%</td>
                    <td style="padding: 10px 14px; text-align: center; font-weight: 800; color: #6366f1; font-family: var(--font-mono);">${t.media}%</td>
                </tr>
            `);
        });

        // Linha Consolidada da Média Geral da Rede / Amostra
        if (pctGeral) {
            html.push(`
                <tr style="background: var(--bg-tertiary); font-size: 0.84rem; font-weight: 800; border-top: 2px solid var(--border-color);">
                    <td style="padding: 12px 14px; color: #6366f1;">MÉDIA MUNICIPAL CONSOLIDADA</td>
                    <td style="padding: 12px 14px; text-align: center;">${totalGeral || 0}</td>
                    <td style="padding: 12px 14px; text-align: center; color: #ef4444;">${pctGeral[0]}%</td>
                    <td style="padding: 12px 14px; text-align: center; color: #f97316;">${pctGeral[1]}%</td>
                    <td style="padding: 12px 14px; text-align: center; color: #eab308;">${pctGeral[2]}%</td>
                    <td style="padding: 12px 14px; text-align: center; color: #0ea5e9;">${pctGeral[3]}%</td>
                    <td style="padding: 12px 14px; text-align: center; color: #22c55e;">${pctGeral[4]}%</td>
                    <td style="padding: 12px 14px; text-align: center; color: #a855f7;">${pctGeral[5]}%</td>
                    <td style="padding: 12px 14px; text-align: center; color: #6366f1; font-size: 0.95rem; font-family: var(--font-mono);">${mediaGeral}%</td>
                </tr>
            `);
        }

        tbody.innerHTML = html.join('\n');
        renderSaebLevelCards();
    }

    function renderSaebLevelCards() {
        var container = document.getElementById('saeb-level-descriptions-container');
        if (!container) return;

        var matriz = global.MATRIZ_DESCRITIVA_NIVEIS || [];
        container.innerHTML = matriz.map(function (m) {
            return `
                <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-left: 4px solid ${m.cor}; border-radius: var(--radius-md); padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 0.88rem; color: var(--text-primary);">${m.titulo}</strong>
                        <span class="badge" style="font-size: 0.68rem; background: rgba(99,102,241,0.1); color: ${m.cor}; border: 1px solid ${m.cor}; font-weight: 700;">${m.badge}</span>
                    </div>
                    <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.45; margin: 0 0 10px 0;">${m.descricao}</p>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.74rem; color: var(--text-primary); line-height: 1.4;">
                        ${m.competencias.map(function (c) { return `<li>${c}</li>`; }).join('')}
                    </ul>
                </div>
            `;
        }).join('');
    }

    // Exposição Global
    global.renderSaebComparativeTable = renderSaebComparativeTable;
    global.renderSaebLevelCards = renderSaebLevelCards;

})(typeof window !== 'undefined' ? window : this);
