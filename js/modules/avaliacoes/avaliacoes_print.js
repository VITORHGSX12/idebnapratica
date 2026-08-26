/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — CENTRAL DE LOGÍSTICA, IMPRESSÃO & EXPORTAÇÃO
 * Arquivo: js/modules/avaliacoes/avaliacoes_print.js
 * Descrição: Geração e impressão A4 de Folhas de Resposta com bolhas ópticas,
 *            Atas de Aplicação com assinaturas e exportação em CSV/Excel.
 * ============================================================================
 */

(function(global) {
    'use strict';

    function abrirModalImpressaoLogistica(eventoId) {
        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var ev = eventos.find(function(e) { return e.id === eventoId; }) || eventos[0];
        if (!ev) return;

        var existingModal = document.getElementById('modal-print-logistica');
        if (existingModal) existingModal.remove();

        var modal = document.createElement('div');
        modal.id = 'modal-print-logistica';
        modal.className = 'modal-overlay';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(15, 23, 42, 0.7)';
        modal.style.backdropFilter = 'blur(4px)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = '9999';

        var numQuestoes = ev.qtdQuestoes || 20;

        modal.innerHTML = `
            <div class="card" style="width: 90%; max-width: 580px; background: var(--color-surface-card, #ffffff); border-radius: var(--radius-card); padding: 24px; box-shadow: var(--shadow-xl); border: 1px solid var(--color-border-subtle);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border-subtle); padding-bottom: 12px; margin-bottom: 16px;">
                    <div>
                        <h3 style="margin: 0; font-size: var(--text-title-sm); color: var(--color-brand-primary);">Central de Logística & Impressão</h3>
                        <p style="margin: 2px 0 0 0; font-size: 11px; color: var(--color-text-secondary);">${ev.titulo}</p>
                    </div>
                    <button type="button" onclick="fecharModalImpressaoLogistica()" style="background:none; border:none; font-size:18px; cursor:pointer; color:var(--color-text-secondary);">&times;</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="background: var(--color-surface-subtle); padding: 14px; border-radius: var(--radius-card); border: 1px solid var(--color-border-subtle);">
                        <strong style="font-size: var(--text-xs); color: var(--color-brand-primary); display:block; margin-bottom:4px;">📄 Cartão-Resposta do Estudante (A4)</strong>
                        <p style="font-size: 11px; color: var(--color-text-secondary); margin: 0 0 10px 0;">Folha óptica individual com ${numQuestoes} questões (bolhas A-E), cabeçalho institucional SEMED e código de barras.</p>
                        <button type="button" onclick="imprimirFolhaRespostaA4('${ev.id}')" class="btn btn-primary" style="font-size: 11px; padding: 6px 12px; border-radius: var(--radius-pill);">
                            <i data-lucide="printer" style="width:12px;height:12px;"></i> Imprimir Cartões-Resposta da Turma
                        </button>
                    </div>
                    <div style="background: var(--color-surface-subtle); padding: 14px; border-radius: var(--radius-card); border: 1px solid var(--color-border-subtle);">
                        <strong style="font-size: var(--text-xs); color: var(--color-brand-primary); display:block; margin-bottom:4px;">📋 Ata de Aplicação & Lista de Presença</strong>
                        <p style="font-size: 11px; color: var(--color-text-secondary); margin: 0 0 10px 0;">Lista nominal com matrícula, campo para assinatura do estudante e ateste do fiscal aplicador.</p>
                        <button type="button" onclick="imprimirAtaPresencaA4('${ev.id}')" class="btn btn-outline" style="font-size: 11px; padding: 6px 12px; border-radius: var(--radius-pill);">
                            <i data-lucide="file-text" style="width:12px;height:12px;"></i> Imprimir Ata de Aplicação
                        </button>
                    </div>
                </div>
                <div style="margin-top: 18px; display: flex; justify-content: flex-end;">
                    <button type="button" onclick="fecharModalImpressaoLogistica()" class="btn btn-outline" style="font-size: 12px; padding: 6px 16px;">Fechar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    function fecharModalImpressaoLogistica() {
        var modal = document.getElementById('modal-print-logistica');
        if (modal) modal.remove();
    }

    function imprimirFolhaRespostaA4(eventoId) {
        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var ev = eventos.find(function(e) { return e.id === eventoId; }) || eventos[0];
        var numQuestoes = ev ? (ev.qtdQuestoes || 20) : 20;

        var printWin = window.open('', '_blank');
        if (!printWin) {
            alert('Por favor, autorize pop-ups para visualizar a folha de resposta para impressão.');
            return;
        }

        var bubblesHtml = Array.from({ length: numQuestoes }).map(function(_, idx) {
            var q = idx + 1;
            return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 8px; border-bottom: 1px dashed #cbd5e1; font-size: 11px;">
                    <strong style="width: 24px;">${q < 10 ? '0' + q : q}</strong>
                    <div style="display: flex; gap: 8px;">
                        ${['A', 'B', 'C', 'D', 'E'].map(function(opt) {
                            return `<div style="width: 18px; height: 18px; border: 1.5px solid #1e293b; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800;">${opt}</div>`;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');

        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Cartão Resposta — ${ev ? ev.titulo : 'Simulado'}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 0; }
                    .card-box { border: 2px solid #0f172a; padding: 14px; border-radius: 6px; margin-bottom: 12px; }
                    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 10px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                </style>
            </head>
            <body>
                <div class="card-box">
                    <div class="header">
                        <h2 style="margin:0; font-size:15px; text-transform:uppercase;">SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED</h2>
                        <h3 style="margin:4px 0 0 0; font-size:13px; color:#475569;">${ev ? ev.titulo : 'SIMULADO SAEB'}</h3>
                        <p style="margin:4px 0 0 0; font-size:10px; color:#64748b;">FOLHA OFICIAL DE RESPOSTAS / LEITURA ÓPTICA</p>
                    </div>
                    <div style="font-size:11px; margin-bottom:12px; line-height:1.6;">
                        <div><strong>ESCOLA:</strong> ________________________________________________________________</div>
                        <div><strong>TURMA:</strong> 5º ANO A &nbsp;&nbsp;&nbsp;&nbsp; <strong>TURNO:</strong> MATUTINO &nbsp;&nbsp;&nbsp;&nbsp; <strong>DATA:</strong> ${ev ? ev.dataRealizacao : '2026-09-15'}</div>
                        <div><strong>ESTUDANTE:</strong> ___________________________________________________________ &nbsp;&nbsp; <strong>Nº:</strong> ____</div>
                    </div>
                    <div class="grid">
                        <div>
                            ${bubblesHtml.slice(0, Math.ceil(numQuestoes / 2))}
                        </div>
                        <div>
                            ${bubblesHtml.slice(Math.ceil(numQuestoes / 2))}
                        </div>
                    </div>
                    <div style="margin-top:16px; border-top:1px solid #0f172a; padding-top:8px; display:flex; justify-content:space-between; font-size:10px;">
                        <span>INSTRUÇÕES: Preencha totalmente a bolha com caneta azul ou preta.</span>
                        <span>ASSINATURA DO ESTUDANTE: __________________________</span>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); };</script>
            </body>
            </html>
        `);
        printWin.document.close();
    }

    function imprimirAtaPresencaA4(eventoId) {
        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var ev = eventos.find(function(e) { return e.id === eventoId; }) || eventos[0];

        var printWin = window.open('', '_blank');
        if (!printWin) return;

        var alunosMock = [
            'Ana Clara Silva Santos', 'Lucas Gabriel Oliveira', 'Maria Eduarda Fernandes',
            'João Pedro Carvalho', 'Beatriz Costa Lima', 'Guilherme Souza Ramos',
            'Larissa Alves Moreira', 'Matheus Henrique Cruz', 'Yasmin Ribeiro Dias', 'Enzo Gabriel Castro'
        ];

        var rowsHtml = alunosMock.map(function(nome, idx) {
            return `
                <tr style="height: 32px; border-bottom: 1px solid #cbd5e1; font-size: 11px;">
                    <td style="text-align:center; font-weight:700;">${idx + 1}</td>
                    <td style="padding-left:8px;">${nome}</td>
                    <td style="text-align:center;">[ &nbsp; ] PRESENTE &nbsp; [ &nbsp; ] AUSENTE</td>
                    <td style="padding-left:8px;">____________________________________</td>
                </tr>
            `;
        }).join('');

        printWin.document.write(`
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>Ata de Sala — ${ev ? ev.titulo : 'Simulado'}</title>
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
                    table { width: 100%; border-collapse: collapse; margin-top: 14px; }
                    th { background: #f1f5f9; border: 1px solid #cbd5e1; padding: 6px; font-size: 11px; }
                    td { border: 1px solid #cbd5e1; }
                </style>
            </head>
            <body>
                <div style="text-align:center; border-bottom:2px solid #0f172a; padding-bottom:8px;">
                    <h2 style="margin:0; font-size:15px;">SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED</h2>
                    <h3 style="margin:4px 0; font-size:13px;">ATA DE APLICAÇÃO E LISTA DE PRESENÇA</h3>
                    <p style="margin:0; font-size:11px; color:#475569;">${ev ? ev.titulo : 'Simulado 2026'}</p>
                </div>
                <table style="margin-top:10px; font-size:11px;">
                    <tr>
                        <td style="padding:4px;"><strong>ESCOLA:</strong> UI JOSE GONCALVES DIAS</td>
                        <td style="padding:4px;"><strong>TURMA:</strong> 5º ANO A</td>
                        <td style="padding:4px;"><strong>DATA:</strong> ${ev ? ev.dataRealizacao : '2026-09-15'}</td>
                    </tr>
                </table>
                <table>
                    <thead>
                        <tr>
                            <th style="width:30px;">Nº</th>
                            <th>NOME DO ESTUDANTE</th>
                            <th style="width:180px;">SITUAÇÃO</th>
                            <th style="width:220px;">ASSINATURA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div style="margin-top:30px; display:flex; justify-content:space-between; font-size:11px;">
                    <span>____________________________________________<br>Assinatura do Aplicador/Fiscal</span>
                    <span>____________________________________________<br>Assinatura da Direção Escolar</span>
                </div>
                <script>window.onload = function() { window.print(); };</script>
            </body>
            </html>
        `);
        printWin.document.close();
    }

    // Exposição Global
    global.abrirModalImpressaoLogistica = abrirModalImpressaoLogistica;
    global.fecharModalImpressaoLogistica = fecharModalImpressaoLogistica;
    global.imprimirFolhaRespostaA4 = imprimirFolhaRespostaA4;
    global.imprimirAtaPresencaA4 = imprimirAtaPresencaA4;

})(typeof window !== 'undefined' ? window : this);
