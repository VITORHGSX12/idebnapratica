// =========================================================================
// MÓDULO DE LAUDO TÉCNICO & DIAGNÓSTICO PEDAGÓGICO (RELATÓRIOS & MONITORAMENTO)
// Responsabilidade: Renderizar motor diagnóstico de 4 níveis e evolução temporal
// =========================================================================

(function(global) {
    'use strict';

    var DESCRITORES_DIAG_DATA = [
        { codigo: 'D1', disciplina: 'Língua Portuguesa', desc: 'Localizar informações explícitas em um texto.', taxa: 48.5, anterior: 42.0, status: 'critico' },
        { codigo: 'D3', disciplina: 'Língua Portuguesa', desc: 'Inferir o sentido de uma palavra ou expressão.', taxa: 62.0, anterior: 58.0, status: 'atencao' },
        { codigo: 'D4', disciplina: 'Língua Portuguesa', desc: 'Inferir uma informação implícita em um texto.', taxa: 51.2, anterior: 46.0, status: 'atencao' },
        { codigo: 'D6', disciplina: 'Língua Portuguesa', desc: 'Identificar o tema de um texto.', taxa: 81.4, anterior: 78.0, status: 'adequado' },
        { codigo: 'D14', disciplina: 'Língua Portuguesa', desc: 'Identificar o efeito de sentido decorrente do uso da pontuação.', taxa: 67.8, anterior: 64.0, status: 'atencao' },
        { codigo: 'D13', disciplina: 'Matemática', desc: 'Resolver problemas com números naturais envolvendo as quatro operações.', taxa: 46.2, anterior: 40.0, status: 'critico' },
        { codigo: 'D16', disciplina: 'Matemática', desc: 'Identificar a representação fracionária de números racionais.', taxa: 58.9, anterior: 52.0, status: 'atencao' },
        { codigo: 'D19', disciplina: 'Matemática', desc: 'Resolver problemas que envolvam equações do 1º grau.', taxa: 64.5, anterior: 61.0, status: 'atencao' },
        { codigo: 'D26', disciplina: 'Matemática', desc: 'Resolver problemas envolvendo noções de probabilidade.', taxa: 49.0, anterior: 48.0, status: 'critico' },
        { codigo: 'D28', disciplina: 'Matemática', desc: 'Ler e interpretar dados em tabelas e gráficos.', taxa: 85.1, anterior: 82.0, status: 'adequado' }
    ];

    var ESCOLAS_RANKING_DATA = [
        { nome: 'UI JOSE CORREA LIMA', ideb: 5.4, taxa: 74.2, variacao: '+4.2%', status: 'Acima da Meta' },
        { nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', ideb: 5.3, taxa: 71.8, variacao: '+3.5%', status: 'Meta Atingida' },
        { nome: 'U I BASILIO ALVES', ideb: 5.2, taxa: 68.5, variacao: '+2.8%', status: 'Em Evolução' },
        { nome: 'UE ANITA FURTADO', ideb: 5.1, taxa: 65.0, variacao: '+1.9%', status: 'Atenção Pedagógica' },
        { nome: 'UI EMILIO MURAD', ideb: 5.0, taxa: 63.4, variacao: '+2.1%', status: 'Atenção Pedagógica' }
    ];

    /**
     * Executa o cálculo e renderização do Laudo Técnico
     */
    function runDiagnosticoCalculation() {
        var container = document.getElementById('diagnostico-results-container');
        if (!container) return;

        var schoolFilter = (document.getElementById('diag-filter-school') || {}).value || 'all';
        var subjectFilter = (document.getElementById('diag-filter-subject') || {}).value || 'all';
        var simuladoFilter = (document.getElementById('diag-filter-simulado') || {}).value || 'sim_2026_02';

        var filteredDescritores = DESCRITORES_DIAG_DATA.filter(function(d) {
            if (subjectFilter !== 'all' && d.disciplina !== subjectFilter) return false;
            return true;
        });

        var totalAlunos = 526;
        var mediaGeral = Math.round(filteredDescritores.reduce(function(acc, d) { return acc + d.taxa; }, 0) / (filteredDescritores.length || 1) * 10) / 10;
        var criticosCount = filteredDescritores.filter(function(d) { return d.status === 'critico'; }).length;

        var html = [];

        // 1. CARDS DE RESUMO EXECUTIVO
        html.push(
            '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Aproveitamento Médio da Rede</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: #6366f1; display: block; margin: 4px 0; font-family: var(--font-mono);">' + mediaGeral + '%</strong>',
            '        <span style="font-size: 0.75rem; color: #10b981; font-weight: 700;">+3.4% vs 1º Simulado</span>',
            '    </div>',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Total de Estudantes Avaliados</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: #3b82f6; display: block; margin: 4px 0; font-family: var(--font-mono);">' + totalAlunos.toLocaleString('pt-BR') + '</strong>',
            '        <span style="font-size: 0.75rem; color: var(--text-secondary);">95.2% de Taxa de Presença</span>',
            '    </div>',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Descritores em Situação Crítica (&lt;50%)</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: #ef4444; display: block; margin: 4px 0; font-family: var(--font-mono);">' + criticosCount + '</strong>',
            '        <span style="font-size: 0.75rem; color: #ef4444; font-weight: 700;">Requer Intervenção Imediata</span>',
            '    </div>',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Projeção de IDEB 2025</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: #10b981; display: block; margin: 4px 0; font-family: var(--font-mono);">5.45</strong>',
            '        <span style="font-size: 0.75rem; color: #10b981; font-weight: 700;">Meta Pactuada: 5.50</span>',
            '    </div>',
            '</div>'
        );

        // 2. TABELA DE DESCRITORES E LACUNAS
        html.push(
            '<div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden;">',
            '    <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary); display:flex; justify-content:space-between; align-items:center;">',
            '        <div>',
            '            <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-primary);">Diagnóstico Detalhado por Descritor SAEB</h4>',
            '            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: var(--text-secondary);">Taxa de acertos e evolução comparativa entre ciclos de simulados.</p>',
            '        </div>',
            '        <span class="badge badge-purple" style="font-size:0.72rem;">' + filteredDescritores.length + ' Descritores Mapeados</span>',
            '    </div>',
            '    <div style="overflow-x: auto;">',
            '        <table class="table-compact" style="width: 100%; border-collapse: collapse; text-align: left;">',
            '            <thead>',
            '                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; background: var(--bg-primary);">',
            '                    <th style="padding: 10px 16px; width: 90px;">Código</th>',
            '                    <th style="padding: 10px 16px; width: 140px;">Disciplina</th>',
            '                    <th style="padding: 10px 16px;">Habilidade / Descrição Pedagógica</th>',
            '                    <th style="padding: 10px 16px; text-align: center; width: 120px;">Taxa Atual</th>',
            '                    <th style="padding: 10px 16px; text-align: center; width: 110px;">Evolução</th>',
            '                    <th style="padding: 10px 16px; text-align: center; width: 120px;">Classificação</th>',
            '                </tr>',
            '            </thead>',
            '            <tbody>'
        );

        filteredDescritores.forEach(function(d) {
            var diff = Math.round((d.taxa - d.anterior) * 10) / 10;
            var diffStr = diff >= 0 ? '+' + diff + '%' : diff + '%';
            var diffColor = diff >= 0 ? '#10b981' : '#ef4444';
            var badge = d.status === 'critico'
                ? '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">Crítico</span>'
                : (d.status === 'atencao'
                    ? '<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">Atenção</span>'
                    : '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">Adequado</span>');

            html.push(
                '            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.82rem;">',
                '                <td style="padding: 10px 16px; font-weight: 700; font-family: var(--font-mono); color: #6366f1;">' + d.codigo + '</td>',
                '                <td style="padding: 10px 16px; font-size: 0.78rem; color: var(--text-secondary);">' + d.disciplina + '</td>',
                '                <td style="padding: 10px 16px; color: var(--text-primary);">' + d.desc + '</td>',
                '                <td style="padding: 10px 16px; text-align: center; font-weight: 800; font-family: var(--font-mono);">' + d.taxa + '%</td>',
                '                <td style="padding: 10px 16px; text-align: center; font-weight: 700; color:' + diffColor + ';">' + diffStr + '</td>',
                '                <td style="padding: 10px 16px; text-align: center;">' + badge + '</td>',
                '            </tr>'
            );
        });

        html.push(
            '            </tbody>',
            '        </table>',
            '    </div>',
            '</div>'
        );

        // 3. RANKING DE ESCOLAS E PLANO DE INTERVENÇÃO
        html.push(
            '<div class="grid-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px;">',
            '        <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">Desempenho por Unidade Escolar</h4>',
            '        <div style="display: flex; flex-direction: column; gap: 10px;">'
        );

        ESCOLAS_RANKING_DATA.forEach(function(esc) {
            html.push(
                '            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:var(--radius-sm);">',
                '                <div>',
                '                    <strong style="font-size:0.82rem; color:var(--text-primary); display:block;">' + esc.nome + '</strong>',
                '                    <span style="font-size:0.72rem; color:var(--text-secondary);">IDEB: ' + esc.ideb + ' • ' + esc.status + '</span>',
                '                </div>',
                '                <div style="text-align:right;">',
                '                    <strong style="font-size:0.9rem; font-weight:800; color:#6366f1; font-family:var(--font-mono);">' + esc.taxa + '%</strong>',
                '                    <span style="font-size:0.72rem; color:#10b981; display:block; font-weight:700;">' + esc.variacao + '</span>',
                '                </div>',
                '            </div>'
            );
        });

        html.push(
            '        </div>',
            '    </div>',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px;">',
            '        <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">Parecer e Ações Recomendadas</h4>',
            '        <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">',
            '            Com base nos dados consolidados do simulado, recomenda-se foco intensivo nos descritores <strong>D1</strong> (Localizar informações explícitas) e <strong>D13</strong> (Operações fundamentais).',
            '        </p>',
            '        <div style="background: rgba(99, 102, 241, 0.08); border-left: 3px solid #6366f1; padding: 10px 14px; border-radius: 4px; font-size: 0.78rem; color: var(--text-primary); line-height: 1.45; margin-bottom: 14px;">',
            '            <strong>Ação Pedagógica 1:</strong> Oficinas semanais de resolução de problemas com cálculo mental nas turmas de 5º Ano.<br>',
            '            <strong>Ação Pedagógica 2:</strong> Rotinas diárias de leitura de 15 minutos com fichas diagnósticas de localização de dados.',
            '        </div>',
            '        <button class="btn btn-primary btn-full" onclick="handlePrintDiagnosticoReport();" style="height: 38px; font-size: 0.82rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">',
            '            <i data-lucide="printer" style="width: 14px; height: 14px;"></i> Exportar Relatório com Assinatura da SEMED',
            '        </button>',
            '    </div>',
            '</div>'
        );

        container.innerHTML = html.join('\n');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Dispara a impressão do Laudo Completo
     */
    function handlePrintDiagnosticoReport() {
        if (typeof global.showToast === 'function') {
            global.showToast('Preparando laudo diagnóstico para impressão / PDF...', 'printer');
        }
        setTimeout(function() {
            window.print();
        }, 300);
    }

    // Exposição Global
    global.runDiagnosticoCalculation = runDiagnosticoCalculation;
    global.handlePrintDiagnosticoReport = handlePrintDiagnosticoReport;

    // Inicialização automática ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            var target = document.getElementById('diagnostico-results-container');
            if (target) runDiagnosticoCalculation();
        });
    } else {
        setTimeout(function() {
            var target = document.getElementById('diagnostico-results-container');
            if (target) runDiagnosticoCalculation();
        }, 150);
    }

})(typeof window !== 'undefined' ? window : this);
