// =========================================================================
// ALUNOS LIST & STUDENT RECORD ENGINE
// Responsabilidade: Busca, filtros por escola/etapa, paginação da listagem
// de alunos, visualização de ficha cadastral completa, revelação de dados
// sensíveis LGPD com auditoria e progressão longitudinal por simulado.
// =========================================================================

(function(global) {
    'use strict';

    // Elementos do DOM da Lista de Alunos
    var dbStudentSearch = document.getElementById('db-student-search');
    var dbStudentSchoolFilter = document.getElementById('db-student-school-filter');
    var dbStudentStageFilter = document.getElementById('db-student-stage-filter');
    var dbStudentsTableBody = document.getElementById('db-students-table-body');
    var dbStudentsPaginationInfo = document.getElementById('db-students-pagination-info');
    var btnDbStudentsPrev = document.getElementById('btn-db-students-prev');
    var btnDbStudentsNext = document.getElementById('btn-db-students-next');

    var studentModal = document.getElementById('student-modal');
    var closeStudentModalBtn = document.getElementById('close-student-modal-btn');
    var btnCloseStudentAction = document.getElementById('btn-close-student-modal-action');
    var btnPrintStudentRecord = document.getElementById('btn-print-student-record');

    /**
     * Inicializa a aba de alunos e popula o seletor de escolas
     */
    function initAlunosTab(schools) {
        dbStudentSearch = document.getElementById('db-student-search');
        dbStudentSchoolFilter = document.getElementById('db-student-school-filter');
        dbStudentStageFilter = document.getElementById('db-student-stage-filter');
        dbStudentsTableBody = document.getElementById('db-students-table-body');
        dbStudentsPaginationInfo = document.getElementById('db-students-pagination-info');
        btnDbStudentsPrev = document.getElementById('btn-db-students-prev');
        btnDbStudentsNext = document.getElementById('btn-db-students-next');

        if (dbStudentSchoolFilter) {
            dbStudentSchoolFilter.innerHTML = '<option value="all">Filtrar por Escola (Todas as Escolas)</option>';
            var targetSchools = (schools && schools.length > 0) ? schools : (global.uniqueSchoolsList || []);
            targetSchools.forEach(function(sch) {
                var opt = document.createElement('option');
                opt.value = sch;
                opt.textContent = sch.replace(/\s+/g, ' ');
                dbStudentSchoolFilter.appendChild(opt);
            });
        }

        var loaded = (global.loadedStudents && global.loadedStudents.length > 0) ? global.loadedStudents : ((global.dbAlunos && global.dbAlunos.length > 0) ? global.dbAlunos : (global.ALUNOS_DATABASE || []));
        global.loadedStudents = loaded;
        global.dbFilteredStudents = loaded.slice();
        global.dbCurrentPage = 1;
        renderDbStudents();
        if (typeof global.updateAiGenDescriptors === 'function') global.updateAiGenDescriptors();
        if (typeof global.renderPedagogicLibrary === 'function') global.renderPedagogicLibrary();
    }

    /**
     * Aplica filtros de texto, escola e etapa sobre a base de alunos
     */
    function applyDbFilters() {
        dbStudentSearch = document.getElementById('db-student-search');
        dbStudentSchoolFilter = document.getElementById('db-student-school-filter');
        dbStudentStageFilter = document.getElementById('db-student-stage-filter');

        var query = dbStudentSearch ? dbStudentSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
        var schoolFilter = dbStudentSchoolFilter ? dbStudentSchoolFilter.value : 'all';
        var stageFilter = dbStudentStageFilter ? dbStudentStageFilter.value : 'all';
        var loaded = global.loadedStudents || [];

        global.dbFilteredStudents = loaded.filter(function(s) {
            var nameNorm = (s.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var cpfNorm = (s.cpf || '').replace(/\D/g, '');
            var matchQuery = !query || nameNorm.includes(query) || (s.matricula && s.matricula.includes(query)) || cpfNorm.includes(query);
            var matchSchool = schoolFilter === 'all' || s.escola === schoolFilter;
            var matchStage = stageFilter === 'all' || (s.etapa && s.etapa.includes(stageFilter)) || (s.turma && s.turma.includes(stageFilter));

            return matchQuery && matchSchool && matchStage;
        });

        global.dbCurrentPage = 1;
        renderDbStudents();
    }

    /**
     * Renderiza a tabela paginada de alunos
     */
    function renderDbStudents() {
        dbStudentsTableBody = document.getElementById('db-students-table-body');
        dbStudentsPaginationInfo = document.getElementById('db-students-pagination-info');
        btnDbStudentsPrev = document.getElementById('btn-db-students-prev');
        btnDbStudentsNext = document.getElementById('btn-db-students-next');

        if (!dbStudentsTableBody) return;
        dbStudentsTableBody.innerHTML = '';
        
        var filtered = global.dbFilteredStudents || global.loadedStudents || [];
        var curPage = global.dbCurrentPage || 1;
        var pageSize = global.dbPageSize || 10;

        var startIndex = (curPage - 1) * pageSize;
        var endIndex = Math.min(startIndex + pageSize, filtered.length);
        var pageStudents = filtered.slice(startIndex, endIndex);

        if (btnDbStudentsPrev) btnDbStudentsPrev.disabled = curPage === 1;
        if (btnDbStudentsNext) btnDbStudentsNext.disabled = endIndex >= filtered.length;

        if (filtered.length === 0) {
            if (dbStudentsPaginationInfo) dbStudentsPaginationInfo.textContent = 'Nenhum aluno encontrado';
            dbStudentsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="padding: 20px; text-align: center; color: var(--text-muted);">
                        Nenhum aluno atende aos filtros definidos.
                    </td>
                </tr>
            `;
            return;
        }

        if (dbStudentsPaginationInfo) {
            dbStudentsPaginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${filtered.length.toLocaleString('pt-BR')} alunos`;
        }

        pageStudents.forEach(function(s) {
            var tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '46px';
            
            var stageClean = (s.etapa || s.turma || '5º Ano').replace('Ensino fundamental de 9 anos - ', '').trim();
            var neeBadge = s.nee ? `<span class="badge badge-warning" title="${s.nee}">${s.nee.slice(0, 15)}...</span>` : '<span class="text-muted text-sm">-</span>';

            tr.innerHTML = `
                <td style="padding: 10px 16px; font-family:var(--font-mono); font-size:0.75rem;">${s.matricula}</td>
                <td style="padding: 10px 16px; font-weight:600;">${s.nome}</td>
                <td style="padding: 10px 16px; font-size:0.75rem; color:var(--text-secondary);">${s.escola}</td>
                <td style="padding: 10px 16px; font-size:0.8rem; color:var(--text-secondary);">${stageClean}</td>
                <td style="padding: 10px 16px;">${neeBadge}</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <button class="btn btn-outline btn-sm view-student-btn" data-mat="${s.matricula}">
                        <i data-lucide="eye" style="width:14px; height:14px; margin-right:4px;"></i> Ver Ficha
                    </button>
                </td>
            `;
            dbStudentsTableBody.appendChild(tr);
        });

        var viewButtons = dbStudentsTableBody.querySelectorAll('.view-student-btn');
        viewButtons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                var mat = btn.getAttribute('data-mat');
                var loaded = global.loadedStudents || [];
                var student = loaded.find(function(s) { return s.matricula === mat; });
                if (student) {
                    openStudentModal(student);
                }
            });
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Botão de Revelação de Dados Sensíveis LGPD com Auditoria
     */
    function setupRevealButton(fieldId, value, matricula, fieldName) {
        var btn = document.querySelector(`.btn-reveal-field[data-field="${fieldName}"]`);
        if (!btn) return;
        
        var isMaskedVal = value && (value.includes('*') || value.includes('...'));
        if (isMaskedVal) {
            btn.style.display = 'inline-block';
            var newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async function() {
                var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
                
                if (userRole === 'Professor') {
                    if (typeof global.showToast === 'function') global.showToast('Acesso negado: Professores não têm permissão para revelar dados.', 'x');
                    return;
                }
                
                var justification = '';
                if (userRole === 'Gestor da Rede') {
                    justification = prompt('Este dado é sensível (LGPD). Insira uma justificativa legal ou pedagógica para visualizá-lo:');
                    if (!justification) return;
                    if (justification.trim().length < 5) {
                        if (typeof global.showToast === 'function') global.showToast('Justificativa inválida ou muito curta.', 'x');
                        return;
                    }
                }
                
                try {
                    var apiFetchFn = global.apiFetch || fetch;
                    var revealRes = await apiFetchFn('/api/alunos/reveal', {
                        method: 'POST',
                        body: JSON.stringify({
                            matricula: matricula,
                            field: fieldName,
                            justificativa: justification
                        })
                    });
                    
                    if (revealRes.ok) {
                        var data = await revealRes.json();
                        if (data.success) {
                            var valSpan = document.getElementById(fieldId);
                            if (fieldName === 'nee' && valSpan) {
                                valSpan.className = 'badge badge-warning';
                            }
                            if (valSpan) valSpan.textContent = data.value || 'Não Informado';
                            newBtn.style.display = 'none';
                            if (typeof global.showToast === 'function') global.showToast('Dado revelado e registrado em auditoria.', 'check');
                            var loaded = global.loadedStudents || [];
                            var inMemoryStudent = loaded.find(function(st) { return st.matricula === matricula; });
                            if (inMemoryStudent) {
                                inMemoryStudent[fieldName] = data.value;
                            }
                        } else {
                            if (typeof global.showToast === 'function') global.showToast('Erro ao revelar dado.', 'x');
                        }
                    } else {
                        var errData = await revealRes.json();
                        if (typeof global.showToast === 'function') global.showToast(errData.error || 'Erro na requisição.', 'x');
                    }
                } catch (err) {
                    console.error('Reveal failed:', err);
                    if (typeof global.showToast === 'function') global.showToast('Erro de conexão.', 'x');
                }
            });
        } else {
            btn.style.display = 'none';
        }
    }

    /**
     * Abre a Ficha Detalhada do Aluno (Modal com abas Cadastral e Progressão)
     */
    function openStudentModal(student) {
        studentModal = document.getElementById('student-modal');
        if (!studentModal) return;

        var initial = (student.nome || 'A').charAt(0).toUpperCase();
        var avatar = document.getElementById('modal-student-avatar-circle');
        if (avatar) avatar.textContent = initial;

        if (typeof global.safeSetProp === 'function') {
            global.safeSetProp('modal-student-name', 'textContent', student.nome);
            global.safeSetProp('modal-student-matricula', 'textContent', `Matrícula: ${student.matricula}`);
        }
        
        // Proficiency Badge
        var profBadge = document.getElementById('modal-student-proficiency-badge');
        var nivel = student.nivel_proficiencia || 'Adequado';
        if (profBadge) {
            profBadge.textContent = nivel;
            if (nivel === 'Crítico') {
                profBadge.style.background = 'rgba(239, 68, 68, 0.15)';
                profBadge.style.color = 'var(--red-light)';
                profBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            } else if (nivel === 'Básico') {
                profBadge.style.background = 'rgba(245, 158, 11, 0.15)';
                profBadge.style.color = 'var(--amber-light)';
                profBadge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
            } else if (nivel === 'Avançado') {
                profBadge.style.background = 'rgba(16, 185, 129, 0.2)';
                profBadge.style.color = '#10b981';
                profBadge.style.borderColor = '#10b981';
            } else {
                profBadge.style.background = 'rgba(59, 130, 246, 0.15)';
                profBadge.style.color = 'var(--blue-light)';
                profBadge.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            }
        }

        var headerMeta = document.getElementById('modal-student-header-meta');
        if (headerMeta) {
            headerMeta.textContent = `${student.turma || student.etapa} • ${student.escola} • ${student.turno || 'Matutino'}`;
        }

        // Tab 1: Ficha Cadastral Fields
        if (typeof global.safeSetProp === 'function') {
            global.safeSetProp('modal-student-cpf', 'textContent', student.cpf || 'Não Informado');
            global.safeSetProp('modal-student-sexo', 'textContent', student.sexo === 'F' ? 'Feminino' : (student.sexo === 'M' ? 'Masculino' : 'Não Informado'));
            global.safeSetProp('modal-student-nascimento', 'textContent', student.nascimento || 'Não Informada');
            global.safeSetProp('modal-student-cor', 'textContent', student.cor || 'Não Informada');
            global.safeSetProp('modal-student-mae', 'textContent', student.mae || 'Não Informada');
            global.safeSetProp('modal-student-pai', 'textContent', student.pai || 'Não Informado');
            global.safeSetProp('modal-student-endereco', 'textContent', student.endereco || 'Não Informado');
            global.safeSetProp('modal-student-cep', 'textContent', student.cep || 'Não Informado');
            global.safeSetProp('modal-student-escola', 'textContent', student.escola);
            global.safeSetProp('modal-student-etapa', 'textContent', student.etapa);
            global.safeSetProp('modal-student-turma-turno', 'textContent', `${student.turma || student.etapa} (${student.turno || 'Matutino'})`);
            global.safeSetProp('modal-student-inicio', 'textContent', student.data_matricula || '10/01/2026');
            
            var scoreVal = student.avg_score || 215;
            var scoreLp = student.score_lp || Math.round(scoreVal * 1.02);
            var scoreMat = student.score_mat || Math.round(scoreVal * 0.98);
            global.safeSetProp('modal-student-score', 'textContent', `${scoreVal} pts`);
            global.safeSetProp('modal-student-score-lp', 'textContent', `${scoreLp} pts`);
            global.safeSetProp('modal-student-score-mat', 'textContent', `${scoreMat} pts`);
            global.safeSetProp('modal-student-freq', 'textContent', `${student.frequencia_pct || 98}%`);
        }

        var neeField = document.getElementById('modal-student-nee');
        if (neeField) {
            if (student.nee) {
                neeField.className = 'badge badge-warning';
                neeField.textContent = student.nee;
            } else {
                neeField.className = 'text-muted';
                neeField.textContent = 'Regular / Sem Deficiência Declarada';
            }
        }

        // Tab 2: Histórico de Progressão Longitudinal
        var histContainer = document.getElementById('student-progression-milestones-container');
        if (histContainer) {
            var scoreVal2 = student.avg_score || 215;
            var scoreLp2 = student.score_lp || Math.round(scoreVal2 * 1.02);
            var scoreMat2 = student.score_mat || Math.round(scoreVal2 * 0.98);

            var simulados = student.historico_simulados || [
                { simulado: 'Diagnóstico Inicial (Fev/2026)', lp: Math.round(scoreVal2 * 0.88), mat: Math.round(scoreVal2 * 0.90), total: Math.round(scoreVal2 * 0.89), acerto_pct: 54 },
                { simulado: '1º Simulado Bimestral (Abr/2026)', lp: Math.round(scoreVal2 * 0.95), mat: Math.round(scoreVal2 * 0.96), total: Math.round(scoreVal2 * 0.95), acerto_pct: 65 },
                { simulado: '2º Simulado Bimestral (Jun/2026)', lp: scoreLp2, mat: scoreMat2, total: scoreVal2, acerto_pct: 78 }
            ];

            histContainer.innerHTML = '';
            simulados.forEach(function(sim, idx) {
                var delta = idx > 0 ? sim.total - simulados[idx - 1].total : 0;
                var deltaBadge = idx > 0 
                    ? `<span style="font-size:0.75rem; font-weight:700; color:${delta >= 0 ? 'var(--green-light)' : 'var(--red-light)'};">(${delta >= 0 ? '+' : ''}${delta} pts)</span>`
                    : '<span style="font-size:0.75rem; color:var(--text-muted);">(Marco Base)</span>';

                var mCard = document.createElement('div');
                mCard.style.background = 'var(--bg-tertiary)';
                mCard.style.border = '1px solid var(--border-color)';
                mCard.style.borderRadius = 'var(--radius-md)';
                mCard.style.padding = '12px 14px';

                mCard.innerHTML = `
                    <div style="font-size:0.74rem; font-weight:700; color:var(--purple-light); text-transform:uppercase; margin-bottom:4px;">
                        ${sim.simulado}
                    </div>
                    <div style="display:flex; align-items:baseline; gap:8px; margin-bottom:6px;">
                        <strong style="font-size:1.3rem; color:var(--text-primary); font-family:var(--font-mono);">${sim.total} pts</strong>
                        ${deltaBadge}
                    </div>
                    <div style="font-size:0.76rem; color:var(--text-secondary); display:flex; justify-content:space-between; margin-bottom:4px;">
                        <span>LP: <strong>${sim.lp}</strong> | MT: <strong>${sim.mat}</strong></span>
                        <span>Acerto: <strong>${sim.acerto_pct}%</strong></span>
                    </div>
                    <div style="width:100%; height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
                        <div style="width:${Math.min(100, Math.round((sim.total / 400) * 100))}%; height:100%; background:var(--purple-light);"></div>
                    </div>
                `;
                histContainer.appendChild(mCard);
            });
        }

        // Consolidated and Focus Skills
        var consolidatedList = document.getElementById('student-consolidated-skills-list');
        if (consolidatedList) {
            consolidatedList.innerHTML = `
                <li><strong>LP D01:</strong> Localizar informações explícitas no texto narrativo e poético.</li>
                <li><strong>MT D13:</strong> Resolver problemas com operações de adição e subtração.</li>
                <li><strong>LP D04:</strong> Identificar o sentido de palavra pelo contexto.</li>
            `;
        }

        var focusList = document.getElementById('student-focus-skills-list');
        if (focusList) {
            focusList.innerHTML = `
                <li><strong>LP D03:</strong> Inferir o sentido de uma palavra ou expressão (Ação: Leitura compartilhada).</li>
                <li><strong>MT D28:</strong> Leitura e interpretação de tabelas e gráficos estatísticos.</li>
                <li><strong>LP D11:</strong> Distinguir um fato da opinião relativa a esse fato.</li>
            `;
        }

        switchStudentModalTab('cadastral');

        setupRevealButton('modal-student-cpf', student.cpf, student.matricula, 'cpf');
        setupRevealButton('modal-student-mae', student.mae, student.matricula, 'mae');
        setupRevealButton('modal-student-pai', student.pai, student.matricula, 'pai');
        setupRevealButton('modal-student-endereco', student.endereco, student.matricula, 'endereco');
        setupRevealButton('modal-student-nee', student.nee, student.matricula, 'nee');

        studentModal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Alterna abas internas do modal de ficha do aluno
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
            if (panelCadastral) panelCadastral.classList.remove('hidden');
            if (panelProgressao) panelProgressao.classList.add('hidden');
        } else {
            if (btnProgressao) {
                btnProgressao.style.color = 'var(--purple-light)';
                btnProgressao.style.borderBottom = '2px solid var(--purple)';
            }
            if (btnCadastral) {
                btnCadastral.style.color = 'var(--text-secondary)';
                btnCadastral.style.borderBottom = 'none';
            }
            if (panelProgressao) panelProgressao.classList.remove('hidden');
            if (panelCadastral) panelCadastral.classList.add('hidden');
        }
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    // Inicialização de Listeners de Eventos do Módulo
    function bindAlunosEventListeners() {
        dbStudentSearch = document.getElementById('db-student-search');
        dbStudentSchoolFilter = document.getElementById('db-student-school-filter');
        dbStudentStageFilter = document.getElementById('db-student-stage-filter');
        btnDbStudentsPrev = document.getElementById('btn-db-students-prev');
        btnDbStudentsNext = document.getElementById('btn-db-students-next');
        studentModal = document.getElementById('student-modal');
        closeStudentModalBtn = document.getElementById('close-student-modal-btn');
        btnCloseStudentAction = document.getElementById('btn-close-student-modal-action');
        btnPrintStudentRecord = document.getElementById('btn-print-student-record');

        if (dbStudentSearch) dbStudentSearch.addEventListener('input', applyDbFilters);
        if (dbStudentSchoolFilter) dbStudentSchoolFilter.addEventListener('change', applyDbFilters);
        if (dbStudentStageFilter) dbStudentStageFilter.addEventListener('change', applyDbFilters);

        if (btnDbStudentsPrev) {
            btnDbStudentsPrev.addEventListener('click', function() {
                if (global.dbCurrentPage > 1) {
                    global.dbCurrentPage--;
                    renderDbStudents();
                }
            });
        }

        if (btnDbStudentsNext) {
            btnDbStudentsNext.addEventListener('click', function() {
                var filtered = global.dbFilteredStudents || [];
                var pageSize = global.dbPageSize || 10;
                var maxPage = Math.ceil(filtered.length / pageSize);
                if (global.dbCurrentPage < maxPage) {
                    global.dbCurrentPage++;
                    renderDbStudents();
                }
            });
        }

        var btnTabStudentCadastral = document.getElementById('btn-tab-student-cadastral');
        var btnTabStudentProgressao = document.getElementById('btn-tab-student-progressao');
        if (btnTabStudentCadastral) btnTabStudentCadastral.addEventListener('click', function() { switchStudentModalTab('cadastral'); });
        if (btnTabStudentProgressao) btnTabStudentProgressao.addEventListener('click', function() { switchStudentModalTab('progressao'); });

        if (closeStudentModalBtn) {
            closeStudentModalBtn.addEventListener('click', function() {
                if (studentModal) studentModal.classList.add('hidden');
            });
        }

        if (btnCloseStudentAction) {
            btnCloseStudentAction.addEventListener('click', function() {
                if (studentModal) studentModal.classList.add('hidden');
            });
        }

        if (btnPrintStudentRecord) {
            btnPrintStudentRecord.addEventListener('click', function() {
                if (typeof global.showToast === 'function') global.showToast('Preparando impressão da ficha do aluno...', 'printer');
                setTimeout(function() {
                    window.print();
                }, 300);
            });
        }

        if (studentModal) {
            studentModal.addEventListener('click', function(e) {
                if (e.target === studentModal) {
                    studentModal.classList.add('hidden');
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindAlunosEventListeners);
    } else {
        bindAlunosEventListeners();
    }

    // Exposição Global
    global.initAlunosTab = initAlunosTab;
    global.applyDbFilters = applyDbFilters;
    global.renderDbStudents = renderDbStudents;
    global.setupRevealButton = setupRevealButton;
    global.openStudentModal = openStudentModal;
    global.switchStudentModalTab = switchStudentModalTab;

})(typeof window !== 'undefined' ? window : this);
