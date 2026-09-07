/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — ANALYTICS PEDAGÓGICO, HEATMAP & PROFICIÊNCIA REAL
 * Arquivo: js/modules/avaliacoes/avaliacoes_analytics.js
 * Descrição: Indicadores de adesão reais, consolidação estrita das 4 faixas
 *            de proficiência SAEB, mapa de calor por descritor ($Q_k$) a partir
 *            das respostas lançadas e laudos pedagógicos detalhados.
 * ============================================================================
 */

(function(global) {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. POVOAMENTO DINÂMICO DOS SELETORES (SIMULADO > ESCOLA > TURMA > COMPONENTE)
    // -------------------------------------------------------------------------

    function initAnalyticsSelectors() {
        var dashEvalSelect = document.getElementById('dash-eval-select');
        var dashSchoolSelect = document.getElementById('dash-school-select');
        var dashClassSelect = document.getElementById('dash-class-select');
        var dashSubjectSelect = document.getElementById('dash-subject-select');

        if (!dashEvalSelect || !dashSchoolSelect) return;

        // 1.1 Povoar Seletor de Simulados
        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        if (eventos.length === 0) {
            dashEvalSelect.innerHTML = '<option value="">Nenhum simulado cadastrado</option>';
        } else {
            dashEvalSelect.innerHTML = eventos.map(function(ev) {
                var isAberto = (ev.status || '').toUpperCase() === 'ABERTO';
                var prefix = isAberto ? '🟢 ' : '🔒 ';
                return `<option value="${ev.id}">${prefix}${ev.titulo}</option>`;
            }).join('');
        }

        // 1.2 Povoar Seletor de Escolas (Correção definitiva do bug 'undefined')
        var allEscolas = typeof global.getOfficialSchoolsState === 'function' 
            ? global.getOfficialSchoolsState() 
            : (Array.isArray(global.dbEscolas) ? global.dbEscolas : []);

        if (allEscolas.length === 0 && global.officialStudentsSeed && Array.isArray(global.officialStudentsSeed.escolas)) {
            allEscolas = global.officialStudentsSeed.escolas;
        }

        var schoolOptions = '<option value="all">Todas as Escolas</option>';
        allEscolas.forEach(function(esc) {
            var nome = esc.nome || esc.name || esc.escola || esc.escola_nome || esc.id || 'Escola Municipal';
            var id = esc.id || esc.codigo_inep || esc.inep || nome;
            schoolOptions += `<option value="${id}">${nome}</option>`;
        });
        dashSchoolSelect.innerHTML = schoolOptions;

        // 1.3 Povoar Seletor de Turmas em Cascata
        function atualizarTurmasAnalytics() {
            if (!dashClassSelect) return;
            var selectedSchoolId = dashSchoolSelect.value;
            var allClasses = typeof global.getOfficialClassesState === 'function' 
                ? global.getOfficialClassesState() 
                : (Array.isArray(global.dbTurmas) ? global.dbTurmas : []);

            var filteredClasses = allClasses;
            if (selectedSchoolId !== 'all') {
                filteredClasses = allClasses.filter(function(t) {
                    var matchId = t.escola_id && (t.escola_id === selectedSchoolId || String(t.escola_id) === String(selectedSchoolId));
                    var matchName = t.schoolName && (t.schoolName === selectedSchoolId || selectedSchoolId.includes(t.schoolName));
                    return matchId || matchName;
                });
            }

            var classOptions = '<option value="all">Todas as Turmas</option>';
            filteredClasses.forEach(function(c) {
                var nomeTurma = c.nome || c.name || c.turma || c.id;
                var serie = c.serie || c.ano || c.etapa || '';
                var label = serie ? `${nomeTurma} (${serie})` : nomeTurma;
                classOptions += `<option value="${c.id}">${label}</option>`;
            });
            dashClassSelect.innerHTML = classOptions;

            renderAvaliacoesDashboard();
        }

        dashEvalSelect.onchange = renderAvaliacoesDashboard;
        dashSchoolSelect.onchange = atualizarTurmasAnalytics;
        if (dashClassSelect) dashClassSelect.onchange = renderAvaliacoesDashboard;
        if (dashSubjectSelect) dashSubjectSelect.onchange = renderAvaliacoesDashboard;

        atualizarTurmasAnalytics();
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

    // -------------------------------------------------------------------------
    // 2. MOTOR DE CÁLCULO E RENDERIZAÇÃO ESTREITAMENTE BASEADO EM DADOS REAIS
    // -------------------------------------------------------------------------

    function renderAvaliacoesDashboard() {
        var dashEvalSelect = document.getElementById('dash-eval-select');
        var dashSchoolSelect = document.getElementById('dash-school-select');
        var dashClassSelect = document.getElementById('dash-class-select');
        var dashSubjectSelect = document.getElementById('dash-subject-select');

        if (!dashEvalSelect) return;

        var eventoId = dashEvalSelect.value;
        var escolaFiltro = dashSchoolSelect ? dashSchoolSelect.value : 'all';
        var turmaFiltro = dashClassSelect ? dashClassSelect.value : 'all';
        var subjectFiltro = dashSubjectSelect ? dashSubjectSelect.value : 'all';

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var evento = eventos.find(function(e) { return e.id === eventoId; });

        // Elementos de UI
        var adhesionVal = document.getElementById('results-adhesion-value');
        var adhesionSub = document.getElementById('results-adhesion-sub');
        var profVal = document.getElementById('results-proficiency-value');
        var profSub = document.getElementById('results-proficiency-sub');
        var targetVal = document.getElementById('results-target-value');
        var targetSub = document.getElementById('results-target-sub');

        var barAbaixo = document.getElementById('bar-pct-insuficiente');
        var badgeAbaixo = document.getElementById('badge-pct-insuficiente');
        var barBasico = document.getElementById('bar-pct-basico');
        var badgeBasico = document.getElementById('badge-pct-basico');
        var barAdequado = document.getElementById('bar-pct-adequado');
        var badgeAdequado = document.getElementById('badge-pct-adequado');
        var barAvancado = document.getElementById('bar-pct-avancado');
        var badgeAvancado = document.getElementById('badge-pct-avancado');

        var grid = document.getElementById('dashboard-heatmap-grid');
        var detailCard = document.getElementById('heatmap-descriptor-detail-card');
        if (detailCard) detailCard.classList.add('hidden');

        // Se não houver evento selecionado
        if (!evento) {
            renderizarEstadoVazioResultados('Nenhum simulado selecionado.');
            return;
        }

        // Buscar respostas reais persistidas no banco / localStorage
        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        
        // Coleta de estudantes avaliados no escopo do evento e dos filtros
        var avaliacoesAlunos = [];
        var totalAusentes = 0;

        Object.keys(respostasDb).forEach(function(key) {
            // A chave segue o padrão: `${eventoId}_${escolaId}_${turmaId}`
            if (!key.startsWith(eventoId + '_')) return;

            var remainder = key.slice(eventoId.length + 1); // "${escolaId}_${turmaId}"
            var lastUnderIndex = remainder.lastIndexOf('_');
            var escId = lastUnderIndex !== -1 ? remainder.slice(0, lastUnderIndex) : remainder;
            var turId = lastUnderIndex !== -1 ? remainder.slice(lastUnderIndex + 1) : '';

            // Aplicar filtros de Escola e Turma se ativos
            if (escolaFiltro !== 'all' && escId !== escolaFiltro && !key.includes(escolaFiltro)) return;
            if (turmaFiltro !== 'all' && turId !== turmaFiltro && !key.includes(turmaFiltro)) return;

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
                var temAlgumaResposta = respArray.some(function(r) { return r && String(r).trim() !== ''; });

                if (temAlgumaResposta) {
                    avaliacoesAlunos.push({
                        alunoId: alunoId,
                        escolaId: escId,
                        turmaId: turId,
                        respostas: respArray
                    });
                }
            });
        });

        // ---------------------------------------------------------------------
        // ESTADO VAZIO: NENHUMA NOTA OU RESPOSTA LANÇADA PARA O SIMULADO
        // ---------------------------------------------------------------------
        if (avaliacoesAlunos.length === 0) {
            if (adhesionVal) adhesionVal.textContent = '0.0%';
            if (adhesionSub) adhesionSub.textContent = '0 estudantes avaliados';
            if (profVal) profVal.textContent = '—';
            if (profSub) profSub.textContent = 'Nenhum resultado lançado';
            if (targetVal) targetVal.textContent = '—';
            if (targetSub) targetSub.textContent = 'Aguardando lançamento de notas';

            if (barAbaixo && badgeAbaixo) { barAbaixo.style.width = '0%'; badgeAbaixo.textContent = '0.0% (0 alunos)'; }
            if (barBasico && badgeBasico) { barBasico.style.width = '0%'; badgeBasico.textContent = '0.0% (0 alunos)'; }
            if (barAdequado && badgeAdequado) { barAdequado.style.width = '0%'; badgeAdequado.textContent = '0.0% (0 alunos)'; }
            if (barAvancado && badgeAvancado) { barAvancado.style.width = '0%'; badgeAvancado.textContent = '0.0% (0 alunos)'; }

            if (grid) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; background: var(--bg-primary); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 36px 20px; text-align: center;">
                        <div style="font-size: 2rem; margin-bottom: 8px;">📊</div>
                        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0;">Nenhum resultado disponível ainda</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto 16px auto;">Lance as notas na aba <strong>"Lançar Notas (Simulado)"</strong> para ver os resultados e o mapa de calor aqui.</p>
                        <button type="button" onclick="if(typeof switchAvaliacoesSubtab==='function') switchAvaliacoesSubtab('lancar-notas-sub');" class="btn btn-primary btn-sm" style="font-weight: 700;">
                            Ir para Lançar Notas
                        </button>
                    </div>
                `;
            }
            return;
        }

        // ---------------------------------------------------------------------
        // CÁLCULO ESTATÍSTICO REAL COM AS RESPOSTAS LANÇADAS
        // ---------------------------------------------------------------------
        
        // 1. Extrair Gabarito e Mapeamento de Descritores do Evento
        var gabaritosGerais = [];
        try {
            gabaritosGerais = JSON.parse(evento.gabaritoGeralJson);
        } catch(e) {}
        if (!Array.isArray(gabaritosGerais) || gabaritosGerais.length === 0) {
            gabaritosGerais = [{
                etapaNome: 'Geral',
                qtdQuestoes: evento.qtdQuestoes || 20,
                gabarito: ['A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D','A','B','C','D'],
                habilidades: ['LP01','LP02','LP03','LP05','LP07','LP12','LP17','LP21','LP23','LP31','MT01','MT02','MT03','MT05','MT06','MT15','MT16','MT22','MT27','MT28']
            }];
        }

        var defaultGabaritoObj = gabaritosGerais[0];
        var gabaritoOficial = defaultGabaritoObj.gabarito || [];
        var habilidadesQuestoes = defaultGabaritoObj.habilidades || [];

        var portInicio = evento.portuguesInicio || 1;
        var portFim = evento.portuguesFim || 10;
        var matInicio = evento.matematicaInicio || 11;
        var matFim = evento.matematicaFim || 20;

        var somaPercentuais = 0;
        var faixasCount = { insuficiente: 0, basico: 0, adequado: 0, avancado: 0 };
        var descritoresStats = {}; // { 'LP01': { acertos: 0, total: 0, escolas: { escId: { acertos: 0, total: 0 } } } }

        avaliacoesAlunos.forEach(function(al) {
            var acertosAluno = 0;
            var questoesValidas = 0;

            for (var q = 0; q < gabaritoOficial.length; q++) {
                var qNum = q + 1;
                var isLP = qNum >= portInicio && qNum <= portFim;
                var isMT = qNum >= matInicio && qNum <= matFim;

                if (subjectFiltro === 'lp' && !isLP) continue;
                if (subjectFiltro === 'mt' && !isMT) continue;

                questoesValidas++;
                var resp = (al.respostas[q] || '').trim().toUpperCase();
                var gab = (gabaritoOficial[q] || '').trim().toUpperCase();
                var acertou = Boolean(resp && gab && resp === gab);

                if (acertou) acertosAluno++;

                var descCodigo = habilidadesQuestoes[q] || (isLP ? 'LP' + (qNum < 10 ? '0' + qNum : qNum) : 'MT' + (qNum < 10 ? '0' + qNum : qNum));
                if (!descritoresStats[descCodigo]) {
                    descritoresStats[descCodigo] = { codigo: descCodigo, acertos: 0, total: 0, escolas: {} };
                }
                descritoresStats[descCodigo].total++;
                if (acertou) descritoresStats[descCodigo].acertos++;

                var eId = al.escolaId || 'rede';
                if (!descritoresStats[descCodigo].escolas[eId]) {
                    descritoresStats[descCodigo].escolas[eId] = { acertos: 0, total: 0 };
                }
                descritoresStats[descCodigo].escolas[eId].total++;
                if (acertou) descritoresStats[descCodigo].escolas[eId].acertos++;
            }

            var pctAluno = questoesValidas > 0 ? (acertosAluno / questoesValidas) * 100 : 0;
            somaPercentuais += pctAluno;

            if (pctAluno >= 80) faixasCount.avancado++;
            else if (pctAluno >= 60) faixasCount.adequado++;
            else if (pctAluno >= 40) faixasCount.basico++;
            else faixasCount.insuficiente++;
        });

        var totalAvaliados = avaliacoesAlunos.length;
        var mediaGeralPct = Number((somaPercentuais / totalAvaliados).toFixed(1));
        var totalParticipantes = totalAvaliados + totalAusentes;
        var adesaoPct = totalParticipantes > 0 ? Number(((totalAvaliados / totalParticipantes) * 100).toFixed(1)) : 100.0;

        // 2. Atualizar KPIs de Topo Reais
        if (adhesionVal) adhesionVal.textContent = adesaoPct + '%';
        if (adhesionSub) adhesionSub.textContent = `${totalAvaliados} de ${totalParticipantes} estudantes avaliados`;

        if (profVal) profVal.textContent = mediaGeralPct + '%';
        if (profSub) {
            var nivelDesc = mediaGeralPct >= 80 ? 'Nível Avançado' : (mediaGeralPct >= 60 ? 'Nível Adequado' : (mediaGeralPct >= 40 ? 'Nível Básico' : 'Nível Insuficiente'));
            profSub.textContent = `Média calculada da amostra (${nivelDesc})`;
        }

        var metaProjetada = 70.0;
        var desvio = Number((mediaGeralPct - metaProjetada).toFixed(1));
        if (targetVal) targetVal.textContent = metaProjetada.toFixed(1) + '%';
        if (targetSub) targetSub.textContent = `Desvio atual: ${desvio >= 0 ? '+' : ''}${desvio} pontos`;

        // 3. Atualizar Faixas de Distribuição Reais
        var pctInsuf = Number(((faixasCount.insuficiente / totalAvaliados) * 100).toFixed(1));
        var pctBas = Number(((faixasCount.basico / totalAvaliados) * 100).toFixed(1));
        var pctAdeq = Number(((faixasCount.adequado / totalAvaliados) * 100).toFixed(1));
        var pctAvanc = Number(((faixasCount.avancado / totalAvaliados) * 100).toFixed(1));

        if (barAbaixo && badgeAbaixo) {
            barAbaixo.style.width = pctInsuf + '%';
            badgeAbaixo.textContent = `${pctInsuf}% (${faixasCount.insuficiente} ${faixasCount.insuficiente === 1 ? 'aluno' : 'alunos'})`;
        }
        if (barBasico && badgeBasico) {
            barBasico.style.width = pctBas + '%';
            badgeBasico.textContent = `${pctBas}% (${faixasCount.basico} ${faixasCount.basico === 1 ? 'aluno' : 'alunos'})`;
        }
        if (barAdequado && badgeAdequado) {
            barAdequado.style.width = pctAdeq + '%';
            badgeAdequado.textContent = `${pctAdeq}% (${faixasCount.adequado} ${faixasCount.adequado === 1 ? 'aluno' : 'alunos'})`;
        }
        if (barAvancado && badgeAvancado) {
            barAvancado.style.width = pctAvanc + '%';
            badgeAvancado.textContent = `${pctAvanc}% (${faixasCount.avancado} ${faixasCount.avancado === 1 ? 'aluno' : 'alunos'})`;
        }

        // 4. Renderizar Mapa de Calor Real por Descritor
        if (grid) {
            var descKeys = Object.keys(descritoresStats);
            if (descKeys.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding:20px; color:var(--text-muted);">Nenhum descritor computado para o componente selecionado.</div>';
                return;
            }

            var matrizSAEB = global.MATRIZ_HABILIDADES_SAEB || { portugues: [], matematica: [] };
            var allHabDict = {};
            (matrizSAEB.portugues || []).concat(matrizSAEB.matematica || []).forEach(function(h) {
                allHabDict[h.codigo] = h.nome;
            });

            grid.innerHTML = descKeys.map(function(k) {
                var item = descritoresStats[k];
                var taxaAcerto = item.total > 0 ? Math.round((item.acertos / item.total) * 100) : 0;
                var nomeHab = allHabDict[k] || 'Habilidade ' + k;

                var bg = 'rgba(239, 68, 68, 0.15)';
                var border = '#ef4444';
                var textColor = '#ef4444';

                if (taxaAcerto >= 70) {
                    bg = 'rgba(16, 185, 129, 0.15)';
                    border = '#10b981';
                    textColor = '#10b981';
                } else if (taxaAcerto >= 50) {
                    bg = 'rgba(245, 158, 11, 0.15)';
                    border = '#f59e0b';
                    textColor = '#f59e0b';
                }

                return `
                    <div 
                        onclick="global.abrirDetalheDescritorAnalytics('${k}', '${nomeHab.replace(/'/g, "\\'")}', '${taxaAcerto}', ${JSON.stringify(item.escolas).replace(/"/g, '&quot;')})"
                        style="background: ${bg}; border: 1px solid ${border}; border-radius: var(--radius-sm); padding: 8px 6px; text-align: center; cursor: pointer; transition: transform 0.15s ease;"
                        onmouseover="this.style.transform='translateY(-2px)'"
                        onmouseout="this.style.transform='none'"
                        title="${k}: ${nomeHab} (${taxaAcerto}% de acerto)"
                    >
                        <div style="font-weight: 800; font-size: 11px; color: ${textColor};">${k}</div>
                        <div style="font-size: 13px; font-weight: 800; color: var(--color-brand-primary); margin-top: 2px;">${taxaAcerto}%</div>
                    </div>
                `;
            }).join('');
        }
    }

    function renderizarEstadoVazioResultados(msg) {
        var grid = document.getElementById('dashboard-heatmap-grid');
        if (grid) {
            grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; padding:32px 20px; color:var(--text-muted);">${msg}</div>`;
        }
    }

    function abrirDetalheDescritorAnalytics(codigo, nome, taxa, escolasBreakdown) {
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
            var ranksHtml = '';
            var escolasObj = escolasBreakdown || {};
            var eKeys = Object.keys(escolasObj);

            if (eKeys.length === 0) {
                ranksHtml = '<div style="font-size:11px; color:var(--text-muted); padding:8px;">Dados globais da rede consolidada.</div>';
            } else {
                ranksHtml = eKeys.map(function(eId) {
                    var stat = escolasObj[eId];
                    var escTaxa = stat.total > 0 ? Math.round((stat.acertos / stat.total) * 100) : 0;
                    var labelStatus = escTaxa >= 70 ? 'Adequado' : (escTaxa >= 50 ? 'Atenção' : 'Crítico');
                    var colorStatus = escTaxa >= 70 ? '#10b981' : (escTaxa >= 50 ? '#f59e0b' : '#ef4444');

                    var escNome = eId;
                    if (global.officialStudentsSeed && Array.isArray(global.officialStudentsSeed.escolas)) {
                        var found = global.officialStudentsSeed.escolas.find(function(s) { return s.id === eId || s.name === eId; });
                        if (found) escNome = found.name;
                    }

                    return `
                        <div style="display:flex; justify-content:space-between; padding:6px 10px; font-size:11px; background:var(--color-surface-subtle); border-radius:4px; margin-bottom:4px;">
                            <span>${escNome}</span>
                            <strong style="color:${colorStatus};">${escTaxa}% ${labelStatus}</strong>
                        </div>
                    `;
                }).join('');
            }
            schoolRanks.innerHTML = ranksHtml;
        }

        if (tipEl) {
            var isLP = codigo.startsWith('LP');
            if (isLP) {
                tipEl.innerHTML = `
                    <strong>Plano de Ação Pedagógica (Língua Portuguesa):</strong><br>
                    Recomenda-se realizar oficinas de leitura e interpretação contextualizada focadas no descritor <em>${codigo} — ${nome}</em>, utilizando textos multimodais, charges e atividades em duplas produtivas.
                `;
            } else {
                tipEl.innerHTML = `
                    <strong>Plano de Ação Pedagógica (Matemática):</strong><br>
                    Promover resolução de problemas práticos do cotidiano e laboratório de raciocínio lógico focados em <em>${codigo} — ${nome}</em> para consolidação da habilidade.
                `;
            }
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
