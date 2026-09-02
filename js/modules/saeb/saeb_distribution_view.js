/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO SAEB (VISÃO DE DISTRIBUIÇÃO & FILTROS)
 * Arquivo: js/modules/saeb/saeb_distribution_view.js
 * Descrição: Barra empilhada 0 a 5, taxas de participação reais, filtros
 *            em cascata com helpers centralizados e tratamento de estado vazio.
 * ============================================================================
 */

(function (global) {
    'use strict';

    function initSaebSelectors() {
        var evalSelect = document.getElementById('saeb-eval-select');
        var schoolSelect = document.getElementById('saeb-school-select');
        var classSelect = document.getElementById('saeb-class-select');
        var thresholdInput = document.getElementById('saeb-threshold-input');

        if (evalSelect) {
            var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
            if (eventos.length > 0) {
                evalSelect.innerHTML = eventos.map(function(ev) {
                    var isAberto = (ev.status || '').toUpperCase() === 'ABERTO';
                    var prefix = isAberto ? '🟢 ' : '🔒 ';
                    return `<option value="${ev.id}">${prefix}${ev.titulo}</option>`;
                }).join('');
            } else {
                evalSelect.innerHTML = '<option value="">Nenhum simulado cadastrado</option>';
            }
        }

        if (schoolSelect) {
            var allEscolas = typeof global.getOfficialSchoolsState === 'function' 
                ? global.getOfficialSchoolsState() 
                : (Array.isArray(global.dbEscolas) ? global.dbEscolas : []);

            var schoolOpts = '<option value="all" selected>Todas as Escolas (Rede Municipal)</option>';
            allEscolas.forEach(function(esc) {
                var nome = esc.nome || esc.name || esc.escola || esc.id;
                var id = esc.id || esc.codigo_inep || esc.inep || nome;
                schoolOpts += `<option value="${id}">${nome}</option>`;
            });
            schoolSelect.innerHTML = schoolOpts;
        }

        function syncTurmasSaeb() {
            if (!classSelect || !schoolSelect) return;
            var selSchool = schoolSelect.value;
            if (selSchool === 'all') {
                classSelect.innerHTML = '<option value="all" selected>Todas as Turmas</option>';
            } else {
                var turmas = typeof global.getTurmasPorEscola === 'function'
                    ? global.getTurmasPorEscola(selSchool)
                    : [];
                var opts = '<option value="all" selected>Todas as Turmas desta Escola</option>';
                turmas.forEach(function(t) {
                    var label = t.nome + (t.serie ? ' (' + t.serie + ')' : '');
                    opts += `<option value="${t.id}">${label}</option>`;
                });
                classSelect.innerHTML = opts;
            }
            renderSaebProficiencyDashboard();
        }

        if (schoolSelect) schoolSelect.onchange = syncTurmasSaeb;
        if (evalSelect) evalSelect.onchange = renderSaebProficiencyDashboard;
        if (classSelect) classSelect.onchange = renderSaebProficiencyDashboard;
        if (thresholdInput) thresholdInput.oninput = renderSaebProficiencyDashboard;
    }

    function getFiltradosSaebData() {
        var evalSelect = document.getElementById('saeb-eval-select');
        var schoolSelect = document.getElementById('saeb-school-select');
        var classSelect = document.getElementById('saeb-class-select');
        var thresholdInput = document.getElementById('saeb-threshold-input');

        var eventoId = evalSelect ? evalSelect.value : '';
        var escolaFiltro = schoolSelect ? schoolSelect.value : 'all';
        var turmaFiltro = classSelect ? classSelect.value : 'all';
        var limiarCorte = thresholdInput ? (parseFloat(thresholdInput.value) || 65) : 65;

        var eventos = typeof global.getEventosState === 'function' ? global.getEventosState() : [];
        var eventoAtivo = eventos.find(function(e) { return e.id === eventoId; }) || eventos[0];
        var finalEventoId = eventoAtivo ? eventoAtivo.id : eventoId;

        var respostasDb = typeof global.getRespostasState === 'function' ? global.getRespostasState() : {};
        var avaliacoesAlunos = [];
        var totalPresentes = 0;
        var totalAusentes = 0;

        var gabaritoOficial = (eventoAtivo && Array.isArray(eventoAtivo.gabarito)) ? eventoAtivo.gabarito : [];

        Object.keys(respostasDb).forEach(function(key) {
            if (finalEventoId && !key.startsWith(finalEventoId + '_')) return;

            var remainder = finalEventoId ? key.slice(finalEventoId.length + 1) : key;
            var lastUnderIndex = remainder.lastIndexOf('_');
            var escId = lastUnderIndex !== -1 ? remainder.slice(0, lastUnderIndex) : remainder;
            var turId = lastUnderIndex !== -1 ? remainder.slice(lastUnderIndex + 1) : '';

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
                var temRespostas = respArray.some(function(r) { return r && String(r).trim() !== ''; });

                if (temRespostas) {
                    totalPresentes++;
                    var acertos = 0;
                    var totalQ = gabaritoOficial.length > 0 ? gabaritoOficial.length : respArray.length;

                    respArray.forEach(function(r, idx) {
                        var g = gabaritoOficial[idx];
                        if (g && String(r).toUpperCase() === String(g).toUpperCase()) {
                            acertos++;
                        }
                    });

                    var pct = totalQ > 0 ? Math.round((acertos / totalQ) * 1000) / 10 : 0;

                    avaliacoesAlunos.push({
                        alunoId: alunoId,
                        alunoNome: record.nome || 'Estudante',
                        escolaId: escId,
                        escolaNome: record.escolaNome || escId,
                        turmaId: turId,
                        turmaNome: record.turmaNome || turId,
                        respostas: respArray,
                        acertos: acertos,
                        totalQuestoes: totalQ,
                        percentual: pct
                    });
                }
            });
        });

        var stats = typeof global.processarDistribuicaoSaeb === 'function'
            ? global.processarDistribuicaoSaeb(avaliacoesAlunos, limiarCorte)
            : { totalAvaliados: 0, pctNiveis: {0:0,1:0,2:0,3:0,4:0,5:0}, proficienciaMedia: 0, turmasDistribuicao: [] };

        return {
            eventoAtivo: eventoAtivo,
            avaliacoesAlunos: avaliacoesAlunos,
            totalPresentes: totalPresentes,
            totalAusentes: totalAusentes,
            stats: stats,
            limiarCorte: limiarCorte
        };
    }

    function renderSaebProficiencyDashboard() {
        var distBar = document.getElementById('saeb-dist-bar-element');
        var metaEl = document.getElementById('saeb-participation-meta');
        if (!distBar) return;

        var data = getFiltradosSaebData();
        var stats = data.stats;
        var total = stats.totalAvaliados;

        // ESTADO VAZIO: ZERO ALUNOS
        if (total === 0) {
            distBar.innerHTML = `
                <div style="width: 100%; background: var(--bg-tertiary); color: var(--text-muted); text-align: center; font-size: 0.75rem; font-weight: 700; padding: 10px; border-radius: 6px;">
                    Aguardando lançamento de notas — Nenhum estudante avaliado neste filtro.
                </div>
            `;
            if (metaEl) {
                metaEl.innerHTML = `Taxa de Participação: <strong style="color: var(--text-muted);">0.0%</strong> (0 estudantes avaliados)`;
            }

            if (typeof global.renderSaebComparativeTable === 'function') {
                global.renderSaebComparativeTable([]);
            }
            if (typeof global.initSaebIndividualSheet === 'function') {
                global.initSaebIndividualSheet([]);
            }
            if (typeof global.desabilitarBoletimSaebBtn === 'function') {
                global.desabilitarBoletimSaebBtn(true);
            }
            return;
        }

        if (typeof global.desabilitarBoletimSaebBtn === 'function') {
            global.desabilitarBoletimSaebBtn(false);
        }

        var totalMatriculados = total + data.totalAusentes;
        var taxaParticipacao = totalMatriculados > 0 ? Math.round((total / totalMatriculados) * 1000) / 10 : 100;

        if (metaEl) {
            metaEl.innerHTML = `
                Taxa de Participação: <strong style="color: var(--green-light);">${taxaParticipacao}%</strong> (${total} de ${totalMatriculados} alunos avaliados)
                • Proficiência Média: <strong style="color: #6366f1;">${stats.proficienciaMedia}%</strong>
                • Atingiram Meta (${data.limiarCorte}%): <strong style="color: #10b981;">${stats.pctAdequado}%</strong>
            `;
        }

        // Renderizar Barra Multicolorida 0 a 5
        var p = stats.pctNiveis;
        distBar.innerHTML = `
            <div class="saeb-dist-seg seg-0" style="width: ${p[0]}%;" title="Nível 0 (Alerta): ${p[0]}% (${stats.contagemNiveis[0]} alunos)">${p[0] > 5 ? 'N0 (' + p[0] + '%)' : (p[0] > 0 ? p[0] + '%' : '')}</div>
            <div class="saeb-dist-seg seg-1" style="width: ${p[1]}%;" title="Nível 1 (Inicial): ${p[1]}% (${stats.contagemNiveis[1]} alunos)">${p[1] > 5 ? 'N1 (' + p[1] + '%)' : (p[1] > 0 ? p[1] + '%' : '')}</div>
            <div class="saeb-dist-seg seg-2" style="width: ${p[2]}%;" title="Nível 2 (Em Desenv.): ${p[2]}% (${stats.contagemNiveis[2]} alunos)">${p[2] > 5 ? 'N2 (' + p[2] + '%)' : (p[2] > 0 ? p[2] + '%' : '')}</div>
            <div class="saeb-dist-seg seg-3" style="width: ${p[3]}%;" title="Nível 3 (Adequado): ${p[3]}% (${stats.contagemNiveis[3]} alunos)">${p[3] > 5 ? 'N3 (' + p[3] + '%)' : (p[3] > 0 ? p[3] + '%' : '')}</div>
            <div class="saeb-dist-seg seg-4" style="width: ${p[4]}%;" title="Nível 4 (Consolidado): ${p[4]}% (${stats.contagemNiveis[4]} alunos)">${p[4] > 5 ? 'N4 (' + p[4] + '%)' : (p[4] > 0 ? p[4] + '%' : '')}</div>
            <div class="saeb-dist-seg seg-5" style="width: ${p[5]}%;" title="Nível 5 (Avançado): ${p[5]}% (${stats.contagemNiveis[5]} alunos)">${p[5] > 5 ? 'N5 (' + p[5] + '%)' : (p[5] > 0 ? p[5] + '%' : '')}</div>
        `;

        if (typeof global.renderSaebComparativeTable === 'function') {
            global.renderSaebComparativeTable(stats.turmasDistribuicao, stats.proficienciaMedia, p, total);
        }
        if (typeof global.initSaebIndividualSheet === 'function') {
            global.initSaebIndividualSheet(data.avaliacoesAlunos, data.eventoAtivo);
        }
    }

    // Exposição Global
    global.initSaebSelectors = initSaebSelectors;
    global.renderSaebProficiencyDashboard = renderSaebProficiencyDashboard;
    global.getFiltradosSaebData = getFiltradosSaebData;

})(typeof window !== 'undefined' ? window : this);
