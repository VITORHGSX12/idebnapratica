/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO SAEB (FICHA DIAGNÓSTICA INDIVIDUAL & RBAC)
 * Arquivo: js/modules/saeb/saeb_ficha_individual.js
 * Descrição: Ficha individual do estudante com controle de privacidade (LGPD),
 *            permissões RBAC por escola/turma e plano de intervenção personalizado.
 * ============================================================================
 */

(function (global) {
    'use strict';

    var cachedAvaliados = [];
    var cachedEvento = null;

    function initSaebIndividualSheet(avaliados, eventoAtivo) {
        cachedAvaliados = Array.isArray(avaliados) ? avaliados : [];
        cachedEvento = eventoAtivo || null;

        var studentSelect = document.getElementById('saeb-individual-student-select');
        var reportContent = document.getElementById('student-saeb-report-content');
        if (!studentSelect || !reportContent) return;

        // 1. APLICAÇÃO DE RBAC (PRIVACIDADE & LGPD)
        var user = typeof global.getCurrentUserProfile === 'function' ? global.getCurrentUserProfile() : {};
        var userRole = (user.role || sessionStorage.getItem('userRole') || 'Master Admin').toUpperCase();
        var userEscola = (user.escola || sessionStorage.getItem('userEscola') || '').toUpperCase().trim();

        var permittedStudents = cachedAvaliados;

        if (userRole.includes('PROFESSOR') || userRole.includes('DIRETOR')) {
            if (userEscola) {
                permittedStudents = cachedAvaliados.filter(function (a) {
                    var escName = (a.escolaNome || a.escolaId || '').toUpperCase();
                    return escName.includes(userEscola) || userEscola.includes(escName);
                });
            }
        }

        studentSelect.innerHTML = '';

        if (permittedStudents.length === 0) {
            studentSelect.innerHTML = '<option value="" disabled selected>Nenhum estudante disponível no seu escopo de acesso</option>';
            reportContent.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.82rem;">
                    Selecione um estudante acima para emitir a Ficha Diagnóstica Individual com plano de intervenção.
                </div>
            `;
            return;
        }

        var opts = '<option value="">Selecione um Estudante para visualizar a Ficha...</option>';
        permittedStudents.forEach(function (aluno) {
            var label = `${aluno.alunoNome} (${aluno.turmaNome || 'Turma'} — ${aluno.escolaNome || 'Escola'})`;
            opts += `<option value="${aluno.alunoId}">${label}</option>`;
        });
        studentSelect.innerHTML = opts;

        studentSelect.onchange = function () {
            renderStudentDiagnosticReport(studentSelect.value);
        };

        reportContent.innerHTML = `
            <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.82rem;">
                👉 Selecione um estudante no seletor acima para carregar as habilidades dominadas e o plano individual.
            </div>
        `;
    }

    function renderStudentDiagnosticReport(alunoId) {
        var reportContent = document.getElementById('student-saeb-report-content');
        if (!reportContent) return;

        if (!alunoId) {
            reportContent.innerHTML = `
                <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.82rem;">
                    Selecione um estudante no seletor acima.
                </div>
            `;
            return;
        }

        var aluno = cachedAvaliados.find(function (a) { return a.alunoId === alunoId; });
        if (!aluno) {
            reportContent.innerHTML = '<div style="color: #ef4444; padding: 12px; font-size: 0.82rem;">Estudante não encontrado nos registros do simulado.</div>';
            return;
        }

        var nivel = typeof global.calcularNivelSaeb === 'function' ? global.calcularNivelSaeb(aluno.percentual) : 0;
        var nivelInfo = (global.SAEB_LEVELS_META && global.SAEB_LEVELS_META[nivel]) || { label: 'Nível ' + nivel, cor: '#6366f1', classBadge: 'badge-info' };
        var matrizDescritores = (cachedEvento && Array.isArray(cachedEvento.matrizDescritores)) ? cachedEvento.matrizDescritores : [];
        var gabarito = (cachedEvento && Array.isArray(cachedEvento.gabarito)) ? cachedEvento.gabarito : [];

        var acertosLista = [];
        var errosLista = [];

        aluno.respostas.forEach(function (resp, idx) {
            var g = gabarito[idx];
            var d = matrizDescritores[idx] || { codigo: 'Q' + (idx + 1), desc: 'Questão ' + (idx + 1) };
            var isCorreta = g && String(resp).toUpperCase() === String(g).toUpperCase();

            var item = {
                questao: idx + 1,
                resposta: resp || '—',
                gabarito: g || '—',
                descCodigo: d.codigo || ('Q' + (idx + 1)),
                descTexto: d.desc || d.descricao || 'Habilidade avaliada'
            };

            if (isCorreta) {
                acertosLista.push(item);
            } else {
                errosLista.push(item);
            }
        });

        var html = `
            <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 18px; margin-top: 10px;">
                <!-- Cabeçalho do Aluno -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-primary); font-weight: 800;">${aluno.alunoNome}</h4>
                        <div style="font-size: 0.76rem; color: var(--text-secondary); margin-top: 2px;">
                            ${aluno.escolaNome} • ${aluno.turmaNome} • Matrícula/ID: <code>${aluno.alunoId}</code>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${nivelInfo.classBadge}" style="font-size: 0.8rem; padding: 4px 10px; font-weight: 800; background: rgba(99,102,241,0.1); color: ${nivelInfo.cor}; border: 1.5px solid ${nivelInfo.cor};">
                            Nível ${nivel} (${nivelInfo.label})
                        </span>
                        <div style="font-size: 0.74rem; font-weight: 700; color: #6366f1; margin-top: 4px; font-family: var(--font-mono);">
                            Aproveitamento: ${aluno.percentual}% (${aluno.acertos}/${aluno.totalQuestoes} acertos)
                        </div>
                    </div>
                </div>

                <!-- Gaps de Aprendizagem & Habilidades Dominadas -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 14px;">
                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px;">
                        <strong style="font-size: 0.8rem; color: #10b981; display: block; margin-bottom: 6px;">✓ Habilidades Consolidadas (${acertosLista.length})</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; max-height: 140px; overflow-y: auto;">
                            ${acertosLista.length > 0 ? acertosLista.map(function (a) {
                                return `<span style="background: #dcfce7; color: #166534; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;" title="Q${a.questao}: ${a.descTexto}">Q${a.questao} (${a.descCodigo})</span>`;
                            }).join('') : '<span style="font-size: 0.72rem; color: var(--text-muted);">Nenhum acerto registrado</span>'}
                        </div>
                    </div>

                    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px;">
                        <strong style="font-size: 0.8rem; color: #ef4444; display: block; margin-bottom: 6px;">⚠️ Lacunas Prioritárias (${errosLista.length})</strong>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; max-height: 140px; overflow-y: auto;">
                            ${errosLista.length > 0 ? errosLista.map(function (e) {
                                return `<span style="background: #fee2e2; color: #991b1b; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 700;" title="Q${e.questao}: ${e.descTexto} (Marcou ${e.resposta}, Correto ${e.gabarito})">Q${e.questao} (${e.descCodigo})</span>`;
                            }).join('') : '<span style="font-size: 0.72rem; color: #10b981; font-weight: 700;">100% de acerto no simulado!</span>'}
                        </div>
                    </div>
                </div>

                <!-- Plano de Intervenção Personalizado -->
                <div style="background: rgba(99, 102, 241, 0.05); border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 4px; font-size: 0.78rem; color: var(--text-primary); line-height: 1.45;">
                    <strong style="color: #6366f1; display: block; margin-bottom: 4px;">Plano de Intervenção Pedagógica Individual:</strong>
                    ${errosLista.length > 0 ? `
                        Focar em atividades direcionadas para as habilidades não consolidadas: <strong>${errosLista.slice(0, 4).map(function(e){ return e.descCodigo; }).join(', ')}</strong>. Sugere-se tutoria em pequenos grupos e apoio com material didático complementar.
                    ` : 'Manter rotinas de aprofundamento e desafios pedagógicos avançados.'}
                </div>
            </div>
        `;

        reportContent.innerHTML = html;
    }

    // Exposição Global
    global.initSaebIndividualSheet = initSaebIndividualSheet;
    global.renderStudentDiagnosticReport = renderStudentDiagnosticReport;

})(typeof window !== 'undefined' ? window : this);
