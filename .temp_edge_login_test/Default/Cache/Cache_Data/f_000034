// =========================================================================
// MÓDULO DE LAUDO TÉCNICO & DIAGNÓSTICO PEDAGÓGICO (RELATÓRIOS & MONITORAMENTO)
// Responsabilidade: Motor diagnóstico real de 4 níveis (Rede -> Escola -> Turma -> Aluno)
//                   baseado exclusivamente em lançamentos de simulados (Zero Mocks)
// =========================================================================

(function(global) {
    'use strict';

    var MIN_SAMPLE_REDE = 5; // Mínimo de estudantes avaliados para emissão oficial

    /**
     * Inicializa os seletores de filtros com eventos e escolas reais
     */
    function initDiagnosticoSelectors() {
        var schoolSelect = document.getElementById('diag-filter-school');
        var turmaSelect = document.getElementById('diag-filter-turma');
        var simuladoSelect = document.getElementById('diag-filter-simulado');

        if (simuladoSelect) {
            var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
            if (eventos.length > 0) {
                simuladoSelect.innerHTML = eventos.map(function(ev) {
                    var isAberto = (ev.status || '').toUpperCase() === 'ABERTO';
                    var prefix = isAberto ? '🟢 ' : '🔒 ';
                    return `<option value="${ev.id}">${prefix}${ev.titulo}</option>`;
                }).join('');
            } else {
                simuladoSelect.innerHTML = '<option value="">Nenhum simulado cadastrado</option>';
            }
        }

        if (schoolSelect) {
            var allEscolas = typeof global.getOfficialSchoolsState === 'function' 
                ? global.getOfficialSchoolsState() 
                : (Array.isArray(global.dbEscolas) ? global.dbEscolas : []);

            var schoolOpts = '<option value="all" selected>Toda a Rede Geral (Gonçalves Dias)</option>';
            allEscolas.forEach(function(esc) {
                var nome = esc.nome || esc.name || esc.escola || esc.id;
                var id = esc.id || esc.codigo_inep || esc.inep || nome;
                schoolOpts += `<option value="${id}">${nome}</option>`;
            });
            schoolSelect.innerHTML = schoolOpts;
        }

        function syncTurmasFilter() {
            if (!turmaSelect || !schoolSelect) return;
            var selSchool = schoolSelect.value;
            if (selSchool === 'all') {
                turmaSelect.innerHTML = '<option value="all" selected>Todas as Turmas (Rede Completa)</option>';
            } else {
                var turmas = typeof global.getTurmasPorEscola === 'function' 
                    ? global.getTurmasPorEscola(selSchool) 
                    : [];
                
                var opts = '<option value="all" selected>Todas as Turmas desta Escola</option>';
                turmas.forEach(function(t) {
                    var label = t.nome + (t.serie ? ' (' + t.serie + ')' : '');
                    opts += `<option value="${t.id}">${label}</option>`;
                });
                turmaSelect.innerHTML = opts;
            }
            runDiagnosticoCalculation();
        }

        if (schoolSelect) schoolSelect.onchange = syncTurmasFilter;
        if (turmaSelect) turmaSelect.onchange = runDiagnosticoCalculation;
        if (simuladoSelect) simuladoSelect.onchange = runDiagnosticoCalculation;
        
        var subjSelect = document.getElementById('diag-filter-subject');
        if (subjSelect) subjSelect.onchange = runDiagnosticoCalculation;
    }

    /**
     * Executa o cálculo e renderização do Laudo Técnico baseado em dados 100% reais
     */
    function runDiagnosticoCalculation() {
        var container = document.getElementById('diagnostico-results-container');
        if (!container) return;

        var schoolFilter = (document.getElementById('diag-filter-school') || {}).value || 'all';
        var turmaFilter = (document.getElementById('diag-filter-turma') || {}).value || 'all';
        var subjectFilter = (document.getElementById('diag-filter-subject') || {}).value || 'all';
        var simuladoFilter = (document.getElementById('diag-filter-simulado') || {}).value || '';

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var eventoAtivo = eventos.find(function(e) { return e.id === simuladoFilter; }) || eventos[0];
        var eventoId = eventoAtivo ? eventoAtivo.id : simuladoFilter;

        // Buscar respostas reais
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        var avaliacoesAlunos = [];
        var totalPresentes = 0;
        var totalAusentes = 0;

        Object.keys(respostasDb).forEach(function(key) {
            if (eventoId && !key.startsWith(eventoId + '_')) return;

            var remainder = eventoId ? key.slice(eventoId.length + 1) : key;
            var lastUnderIndex = remainder.lastIndexOf('_');
            var escId = lastUnderIndex !== -1 ? remainder.slice(0, lastUnderIndex) : remainder;
            var turId = lastUnderIndex !== -1 ? remainder.slice(lastUnderIndex + 1) : '';

            if (schoolFilter !== 'all' && escId !== schoolFilter && !key.includes(schoolFilter)) return;
            if (turmaFilter !== 'all' && turId !== turmaFilter && !key.includes(turmaFilter)) return;

            var turmaLote = respostasDb[key];
            if (!turmaLote || typeof turmaLote !== 'object') return;

            Object.keys(turmaLote).forEach(function(alunoId) {
                var record = turmaLote[alunoId];
                if (!record) return;

                var presenca = (record.statusPresenca || 'PRESENTE').toUpperCase();
                if (presenca !== 'PRESENTE') {
                    totalAusentes++;
                    return;
                }

                var respArray = Array.isArray(record.respostas) ? record.respostas : [];
                var temRespostas = respArray.some(function(r) { return r && String(r).trim() !== ''; });

                if (temRespostas) {
                    totalPresentes++;
                    avaliacoesAlunos.push({
                        alunoId: alunoId,
                        alunoNome: record.nome || 'Estudante',
                        escolaId: escId,
                        turmaId: turId,
                        respostas: respArray,
                        gabaritoOficial: eventoAtivo ? eventoAtivo.gabarito : []
                    });
                }
            });
        });

        // =====================================================================
        // ESTADO VAZIO HONESTO: NENHUM LANÇAMENTO REAL ENCONTRADO (ZERO MOCKS)
        // =====================================================================
        if (avaliacoesAlunos.length === 0) {
            container.innerHTML = `
                <div style="background: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: var(--radius-lg); padding: 48px 24px; text-align: center; margin: 12px 0;">
                    <div style="font-size: 2.8rem; margin-bottom: 12px;">📊</div>
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-primary); margin: 0 0 8px 0;">Nenhum dado disponível para o filtro selecionado</h3>
                    <p style="font-size: 0.88rem; color: var(--text-secondary); max-width: 580px; margin: 0 auto 20px auto; line-height: 1.5;">
                        Ainda não existem notas ou gabaritos lançados para este simulado e recorte escolar. O Laudo Técnico oficial só é processado mediante lançamentos reais de estudantes avaliados.
                    </p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button type="button" onclick="if(typeof switchTab==='function') switchTab('sec-aplicacao-provas'); if(typeof switchAvaliacoesSubtab==='function') switchAvaliacoesSubtab('lancar-notas-sub');" class="btn btn-primary" style="font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
                            <span>✍️ Ir para Lançar Notas do Simulado</span>
                        </button>
                    </div>
                </div>
            `;
            desabilitarBotoesExportacao(true);
            return;
        }

        // Amostra Mínima
        var isAmostraInsuficiente = avaliacoesAlunos.length < MIN_SAMPLE_REDE && schoolFilter === 'all';
        desabilitarBotoesExportacao(isAmostraInsuficiente);

        // =====================================================================
        // CÁLCULO REAL DE DESCRITORES & TAXAS
        // =====================================================================
        var matrizDescritores = (eventoAtivo && Array.isArray(eventoAtivo.matrizDescritores)) ? eventoAtivo.matrizDescritores : [];
        var gabaritoOficial = (eventoAtivo && Array.isArray(eventoAtivo.gabarito)) ? eventoAtivo.gabarito : [];

        var descritoresMap = {};
        var totalQuestoesRespondidas = 0;
        var totalAcertosGeral = 0;

        avaliacoesAlunos.forEach(function(aluno) {
            aluno.respostas.forEach(function(resp, qIdx) {
                if (!resp) return;
                var gab = gabaritoOficial[qIdx] || (matrizDescritores[qIdx] ? matrizDescritores[qIdx].gabarito : '');
                var descInfo = matrizDescritores[qIdx] || { codigo: 'D' + (qIdx + 1), disciplina: (eventoAtivo ? eventoAtivo.disciplina : 'Geral'), desc: 'Habilidade Avaliada na Questão ' + (qIdx + 1) };
                
                var descCod = descInfo.codigo || ('D' + (qIdx + 1));
                var descDisc = descInfo.disciplina || (eventoAtivo ? eventoAtivo.disciplina : 'Geral');

                if (subjectFilter !== 'all' && descDisc !== subjectFilter) return;

                if (!descritoresMap[descCod]) {
                    descritoresMap[descCod] = {
                        codigo: descCod,
                        disciplina: descDisc,
                        desc: descInfo.desc || descInfo.descricao || 'Descritor da Matriz SAEB',
                        total: 0,
                        acertos: 0
                    };
                }

                descritoresMap[descCod].total++;
                totalQuestoesRespondidas++;

                var isCorreta = gab && String(resp).toUpperCase() === String(gab).toUpperCase();
                if (isCorreta) {
                    descritoresMap[descCod].acertos++;
                    totalAcertosGeral++;
                }
            });
        });

        var descritoresCalculados = Object.values(descritoresMap).map(function(d) {
            var taxa = d.total > 0 ? Math.round((d.acertos / d.total) * 1000) / 10 : 0;
            var status = taxa < 60 ? 'critico' : (taxa < 75 ? 'atencao' : 'adequado');
            return {
                codigo: d.codigo,
                disciplina: d.disciplina,
                desc: d.desc,
                taxa: taxa,
                status: status,
                acertos: d.acertos,
                total: d.total
            };
        });

        var mediaGeral = totalQuestoesRespondidas > 0 ? Math.round((totalAcertosGeral / totalQuestoesRespondidas) * 1000) / 10 : 0;
        var criticosCount = descritoresCalculados.filter(function(d) { return d.status === 'critico'; }).length;
        var taxaPresenca = (totalPresentes + totalAusentes) > 0 ? Math.round((totalPresentes / (totalPresentes + totalAusentes)) * 1000) / 10 : 100;

        // Projeção real proporcional de IDEB (escala 0-10)
        var projecaoIdeb = Math.round((mediaGeral / 10) * 100) / 100;

        var html = [];

        if (isAmostraInsuficiente) {
            html.push(`
                <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid #f59e0b; border-radius: var(--radius-md); padding: 12px 18px; margin-bottom: 16px; font-size: 0.82rem; color: #92400e;">
                    <strong>⚠️ Amostra Preliminar em Consolidação:</strong> Apenas ${avaliacoesAlunos.length} estudantes lançados. O laudo com assinatura oficial requer amostragem consolidada.
                </div>
            `);
        }

        // 1. CARDS DE RESUMO EXECUTIVO REAIS
        html.push(
            '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Aproveitamento Real Apurado</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: #6366f1; display: block; margin: 4px 0; font-family: var(--font-mono);">' + mediaGeral + '%</strong>',
            '        <span style="font-size: 0.75rem; color: var(--text-secondary);">' + totalAcertosGeral + ' acertos de ' + totalQuestoesRespondidas + ' itens</span>',
            '    </div>',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Estudantes Avaliados</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: #3b82f6; display: block; margin: 4px 0; font-family: var(--font-mono);">' + avaliacoesAlunos.length + '</strong>',
            '        <span style="font-size: 0.75rem; color: var(--text-secondary);">' + taxaPresenca + '% de Presença Registrada</span>',
            '    </div>',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Descritores Críticos (&lt;60%)</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: ' + (criticosCount > 0 ? '#ef4444' : '#10b981') + '; display: block; margin: 4px 0; font-family: var(--font-mono);">' + criticosCount + '</strong>',
            '        <span style="font-size: 0.75rem; color: ' + (criticosCount > 0 ? '#ef4444' : '#10b981') + '; font-weight: 700;">' + (criticosCount > 0 ? 'Foco de Intervenção Pedagógica' : 'Dentro do Padrão Esperado') + '</span>',
            '    </div>',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 18px; border-radius: var(--radius-lg); text-align: center;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Desempenho Relativo</span>',
            '        <strong style="font-size: 2.2rem; font-weight: 800; color: #10b981; display: block; margin: 4px 0; font-family: var(--font-mono);">' + projecaoIdeb.toFixed(2) + '</strong>',
            '        <span style="font-size: 0.75rem; color: var(--text-muted);">Base Proporcional do Simulado</span>',
            '    </div>',
            '</div>'
        );

        // 2. TABELA REAL DE DESCRITORES
        html.push(
            '<div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; margin-top: 14px;">',
            '    <div class="card-header" style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-tertiary); display:flex; justify-content:space-between; align-items:center;">',
            '        <div>',
            '            <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-primary);">Diagnóstico Real por Descritor Avaliado</h4>',
            '            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: var(--text-secondary);">Taxa de acertos calculada a partir dos gabaritos lançados no sistema.</p>',
            '        </div>',
            '        <span class="badge badge-purple" style="font-size:0.72rem;">' + descritoresCalculados.length + ' Descritores Avaliados</span>',
            '    </div>',
            '    <div style="overflow-x: auto;">',
            '        <table class="table-compact" style="width: 100%; border-collapse: collapse; text-align: left;">',
            '            <thead>',
            '                <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.72rem; color: var(--text-secondary); text-transform: uppercase; background: var(--bg-primary);">',
            '                    <th style="padding: 10px 16px; width: 90px;">Código</th>',
            '                    <th style="padding: 10px 16px; width: 140px;">Disciplina</th>',
            '                    <th style="padding: 10px 16px;">Habilidade / Descrição Pedagógica</th>',
            '                    <th style="padding: 10px 16px; text-align: center; width: 120px;">Taxa Real</th>',
            '                    <th style="padding: 10px 16px; text-align: center; width: 120px;">Classificação</th>',
            '                </tr>',
            '            </thead>',
            '            <tbody>'
        );

        if (descritoresCalculados.length === 0) {
            html.push('<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-muted);">Nenhum descritor associado aos itens respondidos.</td></tr>');
        } else {
            descritoresCalculados.forEach(function(d) {
                var badge = d.status === 'critico'
                    ? '<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">Crítico (&lt;60%)</span>'
                    : (d.status === 'atencao'
                        ? '<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">Atenção</span>'
                        : '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">Adequado (&ge;75%)</span>');

                html.push(
                    '            <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.82rem;">',
                    '                <td style="padding: 10px 16px; font-weight: 700; font-family: var(--font-mono); color: #6366f1;">' + d.codigo + '</td>',
                    '                <td style="padding: 10px 16px; font-size: 0.78rem; color: var(--text-secondary);">' + d.disciplina + '</td>',
                    '                <td style="padding: 10px 16px; color: var(--text-primary);">' + d.desc + '</td>',
                    '                <td style="padding: 10px 16px; text-align: center; font-weight: 800; font-family: var(--font-mono);">' + d.taxa + '% (' + d.acertos + '/' + d.total + ')</td>',
                    '                <td style="padding: 10px 16px; text-align: center;">' + badge + '</td>',
                    '            </tr>'
                );
            });
        }

        html.push(
            '            </tbody>',
            '        </table>',
            '    </div>',
            '</div>'
        );

        // 3. PARECER PEDAGÓGICO GERADO DINAMICAMENTE
        var criticosLista = descritoresCalculados.filter(function(d) { return d.status === 'critico'; });
        var parecerHtml = '';

        if (criticosLista.length > 0) {
            var codigosStr = criticosLista.map(function(c) { return `<strong>${c.codigo}</strong> (${c.taxa}%)`; }).join(', ');
            parecerHtml = `
                <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                    Com base na apuração de <strong>${avaliacoesAlunos.length} estudantes</strong> avaliados, constatou-se necessidade prioritária de reforço pedagógico nos descritores: ${codigosStr}.
                </p>
                <div style="background: rgba(239, 68, 68, 0.08); border-left: 3px solid #ef4444; padding: 10px 14px; border-radius: 4px; font-size: 0.78rem; color: var(--text-primary); line-height: 1.45; margin-bottom: 14px;">
                    <strong>Ação Recomendada:</strong> Replanejar o cronograma de habilidades das turmas afetadas, inserindo oficinas dirigidas e revisões prévias para os itens com defasagem identificada.
                </div>
            `;
        } else {
            parecerHtml = `
                <p style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 12px;">
                    Excelente desempenho: nenhum descritor apresentou índice crítico abaixo de 60% na amostra de <strong>${avaliacoesAlunos.length} estudantes</strong>.
                </p>
                <div style="background: rgba(16, 185, 129, 0.08); border-left: 3px solid #10b981; padding: 10px 14px; border-radius: 4px; font-size: 0.78rem; color: var(--text-primary); line-height: 1.45; margin-bottom: 14px;">
                    <strong>Manutenção de Boas Práticas:</strong> Prosseguir com as rotinas regulares de consolidação e simulados de acompanhamento.
                </div>
            `;
        }

        html.push(
            '<div style="margin-top: 14px;">',
            '    <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 18px;">',
            '        <h4 style="margin: 0 0 8px 0; font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">Parecer Pedagógico Dinâmico (Base Real)</h4>',
            parecerHtml,
            '        <button class="btn btn-primary btn-full" id="btn-export-diagnostico-laudo" onclick="handlePrintDiagnosticoReport();" ' + (isAmostraInsuficiente ? 'disabled' : '') + ' style="height: 38px; font-size: 0.82rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px;">',
            '            <i data-lucide="printer" style="width: 14px; height: 14px;"></i> Exportar Relatório com Assinatura da SEMED',
            '        </button>',
            '    </div>',
            '</div>'
        );

        container.innerHTML = html.join('\n');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function desabilitarBotoesExportacao(desabilitar) {
        var btnExportTop = document.querySelector('button[onclick="handlePrintDiagnosticoReport();"]');
        if (btnExportTop) {
            btnExportTop.disabled = desabilitar;
            btnExportTop.style.opacity = desabilitar ? '0.5' : '1';
            btnExportTop.title = desabilitar ? 'Aguardando lançamentos reais de notas para liberar exportação' : 'Imprimir Laudo Completo';
        }
    }

    /**
     * Dispara a impressão do Laudo Completo
     */
    function handlePrintDiagnosticoReport() {
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        if (Object.keys(respostasDb).length === 0) {
            if (typeof global.showToast === 'function') {
                global.showToast('Não é possível exportar laudo oficial sem dados reais lançados.', 'alert-triangle');
            }
            return;
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Preparando laudo diagnóstico baseado em dados reais...', 'printer');
        }
        setTimeout(function() {
            window.print();
        }, 300);
    }

    // Exposição Global
    global.initDiagnosticoSelectors = initDiagnosticoSelectors;
    global.runDiagnosticoCalculation = runDiagnosticoCalculation;
    global.handlePrintDiagnosticoReport = handlePrintDiagnosticoReport;

    // Inicialização automática ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initDiagnosticoSelectors();
            runDiagnosticoCalculation();
        });
    } else {
        setTimeout(function() {
            initDiagnosticoSelectors();
            runDiagnosticoCalculation();
        }, 150);
    }

})(typeof window !== 'undefined' ? window : this);
