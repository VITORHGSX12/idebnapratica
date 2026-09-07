/**
 * GESTÃO EDUCACIONAL SAAS — MODAL DE PROGRESSÃO DO ALUNO & SIMULADOS
 * Arquivo: js/modules/alunos/alunos_progression_modal.js
 * Responsabilidade: Carregamento do histórico longitudinal de simulados,
 *                   diagnóstico pedagógico (habilidades consolidadas e em defasagem)
 *                   e detalhamento questão a questão com descritores.
 */

(function(global) {
    'use strict';

    /**
     * Carrega a progressão real do estudante a partir dos simulados do banco PostgreSQL (Camadas 1, 2 e 3)
     */
    async function loadStudentProgressionData(student) {
        var histContainer = document.getElementById('student-progression-milestones-container');
        var detailSection = document.getElementById('student-simulado-detail-section');
        var consolidatedList = document.getElementById('student-consolidated-skills-list');
        var focusList = document.getElementById('student-focus-skills-list');
        var consolidatedBadge = document.getElementById('student-consolidated-count-badge');
        var focusBadge = document.getElementById('student-focus-count-badge');
        var recContainer = document.getElementById('student-recommendations-container');
        var recList = document.getElementById('student-recommendations-list');

        if (!histContainer) return;
        if (detailSection) detailSection.style.display = 'none';

        // Estado inicial de carregamento
        histContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-secondary);">
                <span class="loading-spinner" style="display:inline-block; width:18px; height:18px; border:2px solid var(--purple-light); border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite; vertical-align:middle; margin-right:8px;"></span>
                Carregando histórico de simulados e avaliações do banco de dados...
            </div>
        `;

        try {
            var mat = student.matricula || student.id;
            var res = typeof global.apiFetch === 'function' 
                ? await global.apiFetch('/api/alunos/' + encodeURIComponent(mat) + '/progressao')
                : await fetch('/api/alunos/' + encodeURIComponent(mat) + '/progressao');

            var data = null;
            if (res && res.ok) {
                data = await res.json();
            }

            var simulados = (data && data.success && Array.isArray(data.simulados)) ? data.simulados : [];
            var consolidadas = (data && data.success && Array.isArray(data.habilidadesConsolidadas)) ? data.habilidadesConsolidadas : [];
            var emDefasagem = (data && data.success && Array.isArray(data.habilidadesEmDefasagem)) ? data.habilidadesEmDefasagem : [];

            // -----------------------------------------------------------------
            // CAMADA 1: ESTADO VAZIO REAL (ZERO DADOS FICTÍCIOS)
            // -----------------------------------------------------------------
            if (simulados.length === 0) {
                histContainer.innerHTML = `
                    <div style="grid-column: 1 / -1; background: var(--bg-tertiary); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 36px 20px; text-align: center;">
                        <div style="font-size: 2.2rem; margin-bottom: 10px;">📈</div>
                        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0;">Nenhum simulado realizado ainda</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto 12px auto; line-height: 1.5;">
                            Este(a) estudante ainda não possui respostas de simulados registradas no banco de dados.
                        </p>
                        <span style="font-size: 0.78rem; font-weight: 600; color: var(--text-muted); background: rgba(255,255,255,0.04); padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border-color); display: inline-block;">
                            O diagnóstico por descritores e plano de desenvolvimento serão computados automaticamente após o lançamento de notas.
                        </span>
                    </div>
                `;

                if (consolidatedBadge) consolidatedBadge.textContent = '0';
                if (focusBadge) focusBadge.textContent = '0';
                if (consolidatedList) {
                    consolidatedList.innerHTML = `<li style="color: var(--text-muted); list-style: none; font-size: 0.82rem; padding: 4px 0;">Nenhum simulado lançado no sistema até o momento.</li>`;
                }
                if (focusList) {
                    focusList.innerHTML = `<li style="color: var(--text-muted); list-style: none; font-size: 0.82rem; padding: 4px 0;">Nenhum descritor em defasagem identificado.</li>`;
                }
                if (recContainer) recContainer.style.display = 'none';
                return;
            }

            // -----------------------------------------------------------------
            // CAMADA 1: RENDERIZAÇÃO DOS CARDS DE SIMULADOS REAIS
            // -----------------------------------------------------------------
            histContainer.innerHTML = '';
            simulados.forEach(function(sim, idx) {
                var delta = idx > 0 ? sim.escoreSaebGeral - simulados[idx - 1].escoreSaebGeral : 0;
                var deltaBadge = idx > 0 
                    ? `<span style="font-size:0.75rem; font-weight:700; color:${delta >= 0 ? 'var(--green-light)' : 'var(--red-light)'};">(${delta >= 0 ? '+' : ''}${delta} pts)</span>`
                    : '<span style="font-size:0.75rem; color:var(--text-muted);">(Marco Base)</span>';

                var mCard = document.createElement('div');
                mCard.style.background = 'var(--bg-tertiary)';
                mCard.style.border = '1px solid var(--border-color)';
                mCard.style.borderRadius = 'var(--radius-md)';
                mCard.style.padding = '12px 14px';
                mCard.style.cursor = 'pointer';
                mCard.style.transition = 'border-color 0.2s, transform 0.2s';
                mCard.title = 'Clique para ver o detalhamento de questões e descritores deste simulado';

                mCard.onmouseenter = function() { mCard.style.borderColor = '#4A7FA7'; mCard.style.transform = 'translateY(-2px)'; };
                mCard.onmouseleave = function() { mCard.style.borderColor = 'var(--border-color)'; mCard.style.transform = 'translateY(0)'; };

                mCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                        <div style="font-size:0.74rem; font-weight:700; color:#4A7FA7; text-transform:uppercase;">
                            ${sim.titulo}
                        </div>
                        <span style="font-size:0.68rem; color:var(--text-muted); font-family:var(--font-mono);">${sim.dataRealizacao ? new Date(sim.dataRealizacao).toLocaleDateString('pt-BR') : ''}</span>
                    </div>
                    <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:6px;">
                        <strong style="font-size:1.3rem; color:var(--text-primary); font-family:var(--font-mono);">${sim.escoreSaebGeral} pts</strong>
                        ${deltaBadge}
                    </div>
                    <div style="font-size:0.76rem; color:var(--text-secondary); display:flex; justify-content:space-between; margin-bottom:6px;">
                        <span>LP: <strong>${sim.lp ? sim.lp.acertos + '/' + sim.lp.total : '—'}</strong> | MT: <strong>${sim.mat ? sim.mat.acertos + '/' + sim.mat.total : '—'}</strong></span>
                        <span>Acerto: <strong>${sim.percentualAcerto}%</strong></span>
                    </div>
                    <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; margin-bottom:8px;">
                        <div style="width:${Math.min(100, Math.round((sim.escoreSaebGeral / 400) * 100))}%; height:100%; background:#4A7FA7;"></div>
                    </div>
                    <button type="button" class="btn btn-outline btn-xs" style="width:100%; font-size:0.72rem; padding:4px 8px; border-radius:4px; font-weight:600;">
                        🔍 Ver Questões & Descritores (${sim.totalQuestoes || 0})
                    </button>
                `;

                mCard.onclick = function() {
                    renderSimuladoQuestionsDetail(sim);
                };

                histContainer.appendChild(mCard);
            });

            // -----------------------------------------------------------------
            // CAMADA 3: CONSOLIDAÇÃO DO DIAGNÓSTICO PEDAGÓGICO
            // -----------------------------------------------------------------
            if (consolidatedBadge) consolidatedBadge.textContent = consolidadas.length.toString();
            if (focusBadge) focusBadge.textContent = emDefasagem.length.toString();

            if (consolidatedList) {
                if (consolidadas.length === 0) {
                    consolidatedList.innerHTML = `<li style="color: var(--text-muted); list-style: none;">Nenhuma habilidade consolidada identificada com taxa >= 75%.</li>`;
                } else {
                    consolidatedList.innerHTML = consolidadas.map(function(h) {
                        return `<li style="margin-bottom:6px;"><strong>${h.codigo}</strong> (${h.disciplina}): <span style="color:#10b981; font-weight:700;">${h.percentualConsolidado}%</span> de acerto (${h.totalAcertos}/${h.totalQuestoesAvaliadas} itens)<div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">${h.descricao}</div></li>`;
                    }).join('');
                }
            }

            if (focusList) {
                if (emDefasagem.length === 0) {
                    focusList.innerHTML = `<li style="color: var(--text-muted); list-style: none;">Nenhum descritor em defasagem severa (< 60%) identificado.</li>`;
                } else {
                    focusList.innerHTML = emDefasagem.map(function(h) {
                        return `<li style="margin-bottom:6px;"><strong>${h.codigo}</strong> (${h.disciplina}): <span style="color:#ef4444; font-weight:700;">${h.percentualConsolidado}%</span> (${h.totalAcertos}/${h.totalQuestoesAvaliadas} itens)<div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">${h.descricao}</div></li>`;
                    }).join('');
                }
            }

            // Recomendações pedagógicas para descritores em defasagem
            if (recContainer && recList) {
                if (emDefasagem.length > 0) {
                    recContainer.style.display = 'block';
                    recList.innerHTML = emDefasagem.map(function(d) {
                        return `
                            <div style="background:var(--bg-primary); border:1px solid rgba(245,158,11,0.25); border-radius:6px; padding:8px 12px; font-size:0.78rem;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                                    <strong style="color:#f59e0b;">Habilidade ${d.codigo} — ${d.topico || d.disciplina}</strong>
                                    <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">${d.totalAcertos}/${d.totalQuestoesAvaliadas} acertos</span>
                                </div>
                                <p style="margin:0; color:var(--text-secondary); line-height:1.4;">${d.recomendacaoPedagogica || 'Reforçar conteúdos fundamentais.'}</p>
                            </div>
                        `;
                    }).join('');
                } else {
                    recContainer.style.display = 'none';
                }
            }

        } catch (err) {
            console.warn('[Progression Load Fallback]', err);
            histContainer.innerHTML = `
                <div style="grid-column: 1 / -1; background: var(--bg-tertiary); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 36px 20px; text-align: center;">
                    <div style="font-size: 2.2rem; margin-bottom: 10px;">📈</div>
                    <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0 0 6px 0;">Nenhum simulado realizado ainda</h4>
                    <p style="font-size: 0.85rem; color: var(--text-secondary); max-width: 520px; margin: 0 auto;">Este(a) estudante ainda não possui avaliações cadastradas.</p>
                </div>
            `;
            if (consolidatedList) consolidatedList.innerHTML = `<li style="color: var(--text-muted); list-style: none;">Nenhuma avaliação lançada no sistema ainda.</li>`;
            if (focusList) focusList.innerHTML = `<li style="color: var(--text-muted); list-style: none;">Nenhum descritor crítico registrado no momento.</li>`;
            if (recContainer) recContainer.style.display = 'none';
        }
    }

    /**
     * CAMADA 2: Renderiza o detalhamento de questões e agrupamento por descritores de um simulado selecionado
     */
    function renderSimuladoQuestionsDetail(sim) {
        var detailSection = document.getElementById('student-simulado-detail-section');
        var detailTitle = document.getElementById('student-simulado-detail-title');
        var detailMeta = document.getElementById('student-simulado-detail-meta');
        var detailContent = document.getElementById('student-simulado-detail-content');

        if (!detailSection || !detailContent) return;

        detailSection.style.display = 'block';
        if (detailTitle) detailTitle.textContent = sim.titulo || 'Detalhamento do Simulado';
        if (detailMeta) {
            detailMeta.textContent = `Realizado em: ${sim.dataRealizacao ? new Date(sim.dataRealizacao).toLocaleDateString('pt-BR') : '—'} • Total: ${sim.totalAcertos}/${sim.totalQuestoes} acertos (${sim.percentualAcerto}%) • Escore SAEB: ${sim.escoreSaebGeral} pts`;
        }

        var questoes = Array.isArray(sim.questoesDetalhe) ? sim.questoesDetalhe : [];
        var descritores = Array.isArray(sim.descritoresSimulado) ? sim.descritoresSimulado : [];

        var html = '';

        // 1. Resumo por Descritor neste Simulado
        if (descritores.length > 0) {
            html += '<div style="margin-bottom:14px;"><strong style="font-size:0.78rem; color:var(--text-primary); display:block; margin-bottom:6px;">Desempenho por Descritor neste Simulado:</strong>';
            html += '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
            descritores.forEach(function(d) {
                var bg = d.percentualAcertos >= 75 ? 'rgba(16, 185, 129, 0.12)' : (d.percentualAcertos >= 60 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)');
                var color = d.percentualAcertos >= 75 ? '#10b981' : (d.percentualAcertos >= 60 ? '#f59e0b' : '#ef4444');
                var border = d.percentualAcertos >= 75 ? 'rgba(16, 185, 129, 0.3)' : (d.percentualAcertos >= 60 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)');
                html += `
                    <div style="background:${bg}; border:1px solid ${border}; border-radius:6px; padding:6px 10px; font-size:0.74rem;">
                        <strong style="color:${color};">${d.codigo}</strong>: ${d.acertos}/${d.totalQuestoes} (${d.percentualAcertos}%)
                        <span style="display:block; font-size:0.68rem; color:var(--text-muted); max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.descricao}</span>
                    </div>
                `;
            });
            html += '</div></div>';
        }

        // 2. Tabela Questão a Questão
        if (questoes.length > 0) {
            html += '<div style="border:1px solid var(--border-color); border-radius:6px; overflow:hidden;">';
            html += '<table style="width:100%; border-collapse:collapse; font-size:0.78rem; text-align:left;">';
            html += '<thead style="background:var(--bg-primary); color:var(--text-secondary); font-size:0.72rem;">';
            html += '<tr><th style="padding:6px 10px;">Item</th><th style="padding:6px 10px;">Disciplina</th><th style="padding:6px 10px;">Descritor / Habilidade</th><th style="padding:6px 10px; text-align:center;">Resp. Aluno</th><th style="padding:6px 10px; text-align:center;">Gabarito</th><th style="padding:6px 10px; text-align:center;">Resultado</th></tr>';
            html += '</thead><tbody>';

            questoes.forEach(function(q) {
                var icon = q.acertou 
                    ? '<span style="color:#10b981; font-weight:800;">✓ Acertou</span>' 
                    : '<span style="color:#ef4444; font-weight:800;">✗ Errou</span>';
                html += `
                    <tr style="border-top:1px solid var(--border-color);">
                        <td style="padding:6px 10px; font-family:var(--font-mono); font-weight:700;">Questão ${q.numero}</td>
                        <td style="padding:6px 10px; color:var(--text-secondary); font-size:0.73rem;">${q.disciplina}</td>
                        <td style="padding:6px 10px;">
                            <strong style="color:#4A7FA7;">${q.descritorCodigo}</strong>: <span style="color:var(--text-muted); font-size:0.72rem;">${q.descritorDescricao}</span>
                        </td>
                        <td style="padding:6px 10px; text-align:center; font-family:var(--font-mono); font-weight:700;">${q.respostaAluno}</td>
                        <td style="padding:6px 10px; text-align:center; font-family:var(--font-mono); color:var(--text-muted);">${q.gabaritoOficial}</td>
                        <td style="padding:6px 10px; text-align:center;">${icon}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
        } else {
            html += '<p style="font-size:0.78rem; color:var(--text-muted); margin:0;">Nenhum gabarito item a item registrado para este simulado.</p>';
        }

        detailContent.innerHTML = html;
        detailSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Alterna abas internas do modal de ficha do aluno (Cadastral vs Progressão)
     */
    function switchStudentModalTab(targetTab) {
        var btnCadastral = document.getElementById('btn-tab-student-cadastral');
        var btnProgressao = document.getElementById('btn-tab-student-progressao');
        var panelCadastral = document.getElementById('panel-student-cadastral');
        var panelProgressao = document.getElementById('panel-student-progressao');

        if (targetTab === 'cadastral') {
            if (btnCadastral) {
                btnCadastral.style.color = 'var(--purple-light)';
                btnCadastral.style.borderBottom = '2px solid var(--purple)';
            }
            if (btnProgressao) {
                btnProgressao.style.color = 'var(--text-secondary)';
                btnProgressao.style.borderBottom = 'none';
            }
            if (panelCadastral) {
                panelCadastral.classList.remove('hidden');
                panelCadastral.style.display = 'block';
            }
            if (panelProgressao) {
                panelProgressao.classList.add('hidden');
                panelProgressao.style.display = 'none';
            }
        } else {
            if (btnCadastral) {
                btnCadastral.style.color = 'var(--text-secondary)';
                btnCadastral.style.borderBottom = 'none';
            }
            if (btnProgressao) {
                btnProgressao.style.color = 'var(--purple-light)';
                btnProgressao.style.borderBottom = '2px solid var(--purple)';
            }
            if (panelCadastral) {
                panelCadastral.classList.add('hidden');
                panelCadastral.style.display = 'none';
            }
            if (panelProgressao) {
                panelProgressao.classList.remove('hidden');
                panelProgressao.style.display = 'block';
            }
        }
    }

    // Exposição Global
    global.loadStudentProgressionData = loadStudentProgressionData;
    global.renderSimuladoQuestionsDetail = renderSimuladoQuestionsDetail;
    global.switchStudentModalTab = switchStudentModalTab;

    if (typeof window !== 'undefined') {
        window.loadStudentProgressionData = loadStudentProgressionData;
        window.renderSimuladoQuestionsDetail = renderSimuladoQuestionsDetail;
        window.switchStudentModalTab = switchStudentModalTab;
    }

})(typeof window !== 'undefined' ? window : this);
