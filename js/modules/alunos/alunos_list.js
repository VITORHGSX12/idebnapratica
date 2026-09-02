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

        var userRole = (sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'Gestor da Rede').toLowerCase();
        var userEscola = sessionStorage.getItem('userEscola') || localStorage.getItem('userEscola') || '';
        var isTeacher = userRole.includes('professor');
        var isDirector = userRole.includes('diretor');

        if (dbStudentSchoolFilter) {
            if (isTeacher || isDirector) {
                // Diretor ou Professor: trava na escola do usuário
                dbStudentSchoolFilter.innerHTML = '<option value="' + (userEscola || 'UI JOSE CORREA LIMA') + '">' + (userEscola || 'UI JOSE CORREA LIMA') + '</option>';
                dbStudentSchoolFilter.disabled = true;
            } else {
                dbStudentSchoolFilter.disabled = false;
                dbStudentSchoolFilter.innerHTML = '<option value="all">Filtrar por Escola (Todas as Escolas)</option>';
                var targetSchools = (schools && schools.length > 0) ? schools : (global.uniqueSchoolsList || []);
                targetSchools.forEach(function(sch) {
                    var opt = document.createElement('option');
                    opt.value = sch;
                    opt.textContent = sch.replace(/\s+/g, ' ');
                    dbStudentSchoolFilter.appendChild(opt);
                });
            }
        }

        var loaded = (global.loadedStudents && global.loadedStudents.length > 0) ? global.loadedStudents : ((global.dbAlunos && global.dbAlunos.length > 0) ? global.dbAlunos : (global.ALUNOS_DATABASE || []));
        global.loadedStudents = loaded;
        global.dbCurrentPage = 1;
        applyDbFilters();
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

        var userRole = (sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'Gestor da Rede').toLowerCase();
        var userEscola = (sessionStorage.getItem('userEscola') || localStorage.getItem('userEscola') || '').trim();
        var userTurma = (sessionStorage.getItem('userTurma') || localStorage.getItem('userTurma') || '').trim();
        var isTeacher = userRole.includes('professor');
        var isDirector = userRole.includes('diretor');

        var query = dbStudentSearch ? dbStudentSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : '';
        var schoolFilter = dbStudentSchoolFilter ? dbStudentSchoolFilter.value : 'all';
        var stageFilter = dbStudentStageFilter ? dbStudentStageFilter.value : 'all';
        var loaded = global.loadedStudents || [];

        global.dbFilteredStudents = loaded.filter(function(s) {
            var nameNorm = (s.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            var cpfNorm = (s.cpf || '').replace(/\D/g, '');
            var matchQuery = !query || nameNorm.includes(query) || (s.matricula && s.matricula.includes(query)) || cpfNorm.includes(query);

            // Isolamento RBAC por Escola
            var matchSchool = true;
            if (isTeacher || isDirector) {
                var sSch = (s.escola || '').toLowerCase().trim();
                var uSch = userEscola.toLowerCase().trim();
                matchSchool = !uSch || sSch === uSch || sSch.includes(uSch) || uSch.includes(sSch);
            } else if (schoolFilter !== 'all') {
                matchSchool = s.escola === schoolFilter;
            }

            // Isolamento RBAC por Turma para Professor
            var matchTeacherTurma = true;
            if (isTeacher && userTurma && userTurma !== 'Todas as Turmas') {
                var sTurma = (s.turma || '').toLowerCase().trim();
                var sEtapa = (s.etapa || '').toLowerCase().trim();
                var uTurma = userTurma.toLowerCase().trim();
                matchTeacherTurma = sTurma.includes(uTurma) || uTurma.includes(sTurma) || sEtapa.includes(uTurma) || uTurma.includes(sEtapa);
            }

            var matchStage = stageFilter === 'all' || (s.etapa && s.etapa.includes(stageFilter)) || (s.turma && s.turma.includes(stageFilter));

            return matchQuery && matchSchool && matchTeacherTurma && matchStage;
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

        // Tab 2: Histórico de Progressão Longitudinal (Carregado via API Real do Módulo de Avaliações)
        loadStudentProgressionData(student);

        switchStudentModalTab('cadastral');

        setupRevealButton('modal-student-cpf', student.cpf, student.matricula, 'cpf');
        setupRevealButton('modal-student-mae', student.mae, student.matricula, 'mae');
        setupRevealButton('modal-student-pai', student.pai, student.matricula, 'pai');
        setupRevealButton('modal-student-endereco', student.endereco, student.matricula, 'endereco');
        setupRevealButton('modal-student-nee', student.nee, student.matricula, 'nee');

        studentModal.classList.remove('hidden');
        studentModal.style.display = 'flex';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

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
            var emAtencao = (data && data.success && Array.isArray(data.habilidadesEmAtencao)) ? data.habilidadesEmAtencao : [];
            var emDefasagem = (data && data.success && Array.isArray(data.habilidadesEmDefasagem)) ? data.habilidadesEmDefasagem : [];
            var preliminares = (data && data.success && Array.isArray(data.amostrasPreliminares)) ? data.amostrasPreliminares : [];

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
                    consolidatedList.innerHTML = `<li style="color: var(--text-muted); list-style: none;">Nenhuma habilidade consolidada identificada com taxa $\ge 75\%$.</li>`;
                } else {
                    consolidatedList.innerHTML = consolidadas.map(function(h) {
                        return `<li style="margin-bottom:6px;"><strong>${h.codigo}</strong> (${h.disciplina}): <span style="color:#10b981; font-weight:700;">${h.percentualConsolidado}%</span> de acerto (${h.totalAcertos}/${h.totalQuestoesAvaliadas} itens)<div style="font-size:0.72rem; color:var(--text-secondary); margin-top:2px;">${h.descricao}</div></li>`;
                    }).join('');
                }
            }

            if (focusList) {
                if (emDefasagem.length === 0) {
                    focusList.innerHTML = `<li style="color: var(--text-muted); list-style: none;">Nenhum descritor em defasagem severa ($< 60\%$) identificado.</li>`;
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
            if (panelCadastral) {
                panelCadastral.classList.remove('hidden');
                panelCadastral.style.display = 'block';
            }
            if (panelProgressao) {
                panelProgressao.classList.add('hidden');
                panelProgressao.style.display = 'none';
            }
        } else {
            if (btnProgressao) {
                btnProgressao.style.color = 'var(--purple-light)';
                btnProgressao.style.borderBottom = '2px solid var(--purple)';
            }
            if (btnCadastral) {
                btnCadastral.style.color = 'var(--text-secondary)';
                btnCadastral.style.borderBottom = 'none';
            }
            if (panelProgressao) {
                panelProgressao.classList.remove('hidden');
                panelProgressao.style.display = 'block';
            }
            if (panelCadastral) {
                panelCadastral.classList.add('hidden');
                panelCadastral.style.display = 'none';
            }
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

    /**
     * Abre a Ficha do Aluno diretamente na aba de Histórico & Progressão
     */
    function openStudentProgressionModal(matricula, studentName) {
        var loaded = global.loadedStudents || (typeof global.getMasterStudentsDatabase === 'function' ? global.getMasterStudentsDatabase() : []);
        var student = loaded.find(function(s) { return String(s.matricula) === String(matricula) || String(s.id) === String(matricula); });
        if (!student) {
            student = { matricula: matricula, nome: studentName || 'Estudante', escola: 'Rede Municipal', etapa: 'Ensino Fundamental' };
        }
        openStudentModal(student);
        switchStudentModalTab('progressao');
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
    global.openStudentProgressionModal = openStudentProgressionModal;
    global.openStudentProgression = openStudentProgressionModal;
    if (typeof window !== 'undefined') {
        window.openStudentProgressionDirect = openStudentProgressionModal;
        window.openStudentProgressionModal = openStudentProgressionModal;
        window.openStudentProgression = openStudentProgressionModal;
    }

})(typeof window !== 'undefined' ? window : this);

