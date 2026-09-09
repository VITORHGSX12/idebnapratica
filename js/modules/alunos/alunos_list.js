// =========================================================================
// ALUNOS LIST & STUDENT RECORD ENGINE
// Responsabilidade: Busca, filtros por escola/etapa, paginação da listagem
// de alunos, visualização de ficha cadastral completa, revelação de dados
// sensíveis LGPD com auditoria e progressão longitudinal por simulado.
// =========================================================================

(function(global) {
    'use strict';

    // Elementos do DOM da Lista de Alunos
    var dbStudentSearch = null;
    var dbStudentSchoolFilter = null;
    var dbStudentStageFilter = null;
    var dbStudentsTableBody = null;
    var dbStudentsPaginationInfo = null;
    var btnDbStudentsPrev = null;
    var btnDbStudentsNext = null;

    var studentModal = null;
    var closeStudentModalBtn = null;
    var btnCloseStudentAction = null;
    var btnPrintStudentRecord = null;

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

        // Carregar todas as 9 escolas oficiais
        var officialSchools = [];
        if (typeof global.getOfficialSchoolsState === 'function') {
            officialSchools = global.getOfficialSchoolsState();
        } else if (global.dbEscolas && global.dbEscolas.length > 0) {
            officialSchools = global.dbEscolas;
        }

        var targetSchoolNames = [];
        if (schools && schools.length > 0) {
            targetSchoolNames = schools;
        } else if (officialSchools && officialSchools.length > 0) {
            targetSchoolNames = officialSchools.map(function(e) { return e.nome || e.name; });
        } else if (global.uniqueSchoolsList && global.uniqueSchoolsList.length > 0) {
            targetSchoolNames = global.uniqueSchoolsList;
        }

        // Se ainda vazio, extrair da lista de estudantes oficiais
        if (targetSchoolNames.length === 0) {
            var allSt = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : (global.dbAlunos || []);
            var set = {};
            allSt.forEach(function(s) { if (s.escola) set[s.escola.trim()] = true; });
            targetSchoolNames = Object.keys(set).sort();
        }

        if (dbStudentSchoolFilter) {
            if (isTeacher || isDirector) {
                dbStudentSchoolFilter.innerHTML = '<option value="' + (userEscola || 'UI JOSE CORREA LIMA') + '">' + (userEscola || 'UI JOSE CORREA LIMA') + '</option>';
                dbStudentSchoolFilter.disabled = true;
            } else {
                dbStudentSchoolFilter.disabled = false;
                var currentVal = dbStudentSchoolFilter.value;
                dbStudentSchoolFilter.innerHTML = '<option value="all">Filtrar por Escola (Todas as 9 Escolas)</option>';
                targetSchoolNames.forEach(function(sch) {
                    var opt = document.createElement('option');
                    opt.value = sch;
                    opt.textContent = sch.replace(/\s+/g, ' ');
                    if (sch === currentVal) opt.selected = true;
                    dbStudentSchoolFilter.appendChild(opt);
                });
            }
        }

        // Carrega a base oficial de 526 estudantes
        var loaded = [];
        if (typeof global.getOfficialStudentsState === 'function') {
            loaded = global.getOfficialStudentsState();
        }
        if (!loaded || loaded.length === 0) {
            loaded = (global.dbAlunos && global.dbAlunos.length > 0) ? global.dbAlunos : (global.loadedStudents || global.ALUNOS_DATABASE || []);
        }
        global.loadedStudents = loaded;
        global.dbCurrentPage = 1;

        // Atualiza contador de alunos no menu lateral
        var badgeCounter = document.getElementById('badge-count-students');
        if (badgeCounter) {
            badgeCounter.textContent = loaded.length > 0 ? String(loaded.length) : '526';
        }

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

        var query = dbStudentSearch ? dbStudentSearch.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';
        var schoolFilter = dbStudentSchoolFilter ? dbStudentSchoolFilter.value : 'all';
        var stageFilter = dbStudentStageFilter ? dbStudentStageFilter.value : 'all';
        var loaded = (global.loadedStudents && global.loadedStudents.length > 0) ? global.loadedStudents : (typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : []);
        global.loadedStudents = loaded;

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
                matchSchool = s.escola && s.escola.trim().toLowerCase() === schoolFilter.trim().toLowerCase();
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
        dbStudentSchoolFilter = document.getElementById('db-student-school-filter');

        if (!dbStudentsTableBody) return;

        // Auto-inicializa se a base de alunos estiver descarregada
        if (!global.loadedStudents || global.loadedStudents.length === 0) {
            initAlunosTab();
            return;
        }

        // Auto-popula o seletor de escolas se estiver vazio
        if (dbStudentSchoolFilter && dbStudentSchoolFilter.options.length <= 1) {
            initAlunosTab();
            return;
        }

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
                    <td colspan="6" style="padding: 26px; text-align: center; color: var(--text-muted);">
                        Nenhum aluno atende aos filtros definidos.
                    </td>
                </tr>
            `;
            return;
        }

        if (dbStudentsPaginationInfo) {
            dbStudentsPaginationInfo.textContent = `Mostrando ${startIndex + 1}-${endIndex} de ${filtered.length} estudantes`;
        }

        pageStudents.forEach(function(s) {
            var tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '48px';
            
            var stageClean = (s.turma || s.etapa || '5º Ano');
            var neeBadge = s.nee ? `<span class="badge badge-warning" title="${s.nee}">${String(s.nee).slice(0, 15)}...</span>` : '<span class="text-muted text-sm">-</span>';

            tr.innerHTML = `
                <td style="padding: 10px 16px; font-family:var(--font-mono); font-size:0.75rem; font-weight:700; color:var(--text-secondary);">${s.matricula || s.id || '-'}</td>
                <td style="padding: 10px 16px; font-weight:600; color:var(--color-brand-primary);">${s.nome}</td>
                <td style="padding: 10px 16px; font-size:0.75rem; color:var(--text-secondary);">${s.escola}</td>
                <td style="padding: 10px 16px; font-size:0.8rem; color:var(--text-secondary);">${stageClean}</td>
                <td style="padding: 10px 16px;">${neeBadge}</td>
                <td style="padding: 10px 16px; text-align:center;">
                    <div style="display:inline-flex; align-items:center; justify-content:center; gap:6px; flex-wrap:wrap;">
                        <button class="btn btn-outline btn-sm view-student-btn" data-mat="${s.matricula}" style="font-size:11px; padding:4px 10px; height:28px; border-radius:var(--radius-pill); display:inline-flex; align-items:center; gap:4px; color:var(--color-brand-primary);" title="Visualizar Ficha Cadastral e Dados">
                            <i data-lucide="user" style="width:12px; height:12px;"></i> Ver Dados
                        </button>
                        <button class="btn btn-outline btn-sm view-progression-btn" data-mat="${s.matricula}" data-nome="${(s.nome || '').replace(/"/g, '&quot;')}" style="font-size:11px; padding:4px 10px; height:28px; border-radius:var(--radius-pill); display:inline-flex; align-items:center; gap:4px; color:#10b981; border-color:rgba(16,185,129,0.4); background:rgba(16,185,129,0.05);" title="Visualizar Trajetória e Progressão SAEB">
                            <i data-lucide="trending-up" style="width:12px; height:12px;"></i> Ver Progressão
                        </button>
                    </div>
                </td>
            `;
            dbStudentsTableBody.appendChild(tr);
        });

        // Listeners dos botões de ação
        dbStudentsTableBody.querySelectorAll('.view-student-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var mat = btn.getAttribute('data-mat');
                var loaded = global.loadedStudents || [];
                var student = loaded.find(function(s) { return String(s.matricula) === String(mat) || String(s.id) === String(mat); });
                if (student) {
                    openStudentModal(student);
                }
            });
        });

        dbStudentsTableBody.querySelectorAll('.view-progression-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var mat = btn.getAttribute('data-mat');
                var nome = btn.getAttribute('data-nome');
                openStudentProgressionModal(mat, nome);
            });
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
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
            global.safeSetProp('modal-student-nascimento', 'textContent', student.nascimento || student.dataNascimento || 'Não Informada');
            global.safeSetProp('modal-student-cor', 'textContent', student.cor || 'Não Informada');
            global.safeSetProp('modal-student-mae', 'textContent', student.mae || 'Não Informada');
            global.safeSetProp('modal-student-pai', 'textContent', student.pai || 'Não Informado');
            global.safeSetProp('modal-student-endereco', 'textContent', student.endereco || 'Não Informado');
            global.safeSetProp('modal-student-cep', 'textContent', student.cep || 'Não Informado');
            global.safeSetProp('modal-student-escola', 'textContent', student.escola);
            global.safeSetProp('modal-student-etapa', 'textContent', student.etapa || student.serie || 'Ensino Fundamental');
            global.safeSetProp('modal-student-turma-turno', 'textContent', `${student.turma || student.etapa} (${student.turno || 'Matutino'})`);
            global.safeSetProp('modal-student-inicio', 'textContent', student.data_matricula || '10/01/2026');
            global.safeSetProp('modal-student-nee', 'textContent', student.nee ? (typeof student.nee === 'string' ? student.nee : JSON.stringify(student.nee)) : 'Regular / Sem NEE');
            global.safeSetProp('modal-student-laudo', 'textContent', student.laudo_medico ? 'Laudo Anexado' : 'Sem Laudo');
            global.safeSetProp('modal-student-transporte', 'textContent', student.transporte_escolar ? 'Utiliza Transporte' : 'Não Utiliza');
            global.safeSetProp('modal-student-responsavel', 'textContent', student.nome_responsavel || student.mae || 'Responsável Legal');
            global.safeSetProp('modal-student-contato', 'textContent', student.contato_responsavel || student.telefone || '(99) 98800-0000');
        }

        // Tab 2: Histórico de Progressão Longitudinal
        if (typeof global.loadStudentProgressionData === 'function') {
            global.loadStudentProgressionData(student);
        }

        if (typeof global.switchStudentModalTab === 'function') {
            global.switchStudentModalTab('cadastral');
        }

        setupRevealButton('modal-student-cpf', student.cpf, student.matricula, 'cpf');
        setupRevealButton('modal-student-mae', student.mae, student.matricula, 'mae');
        setupRevealButton('modal-student-pai', student.pai, student.matricula, 'pai');
        setupRevealButton('modal-student-endereco', student.endereco, student.matricula, 'endereco');
        setupRevealButton('modal-student-nee', student.nee, student.matricula, 'nee');

        studentModal.classList.remove('hidden');
        studentModal.style.display = 'flex';
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    /**
     * Abre a Ficha do Aluno diretamente na aba de Histórico & Progressão
     */
    function openStudentProgressionModal(matricula, studentName) {
        var loaded = global.loadedStudents || (typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : []);
        var student = loaded.find(function(s) { return String(s.matricula) === String(matricula) || String(s.id) === String(matricula); });
        if (!student) {
            student = { matricula: matricula, nome: studentName || 'Estudante', escola: 'Rede Municipal', etapa: 'Ensino Fundamental' };
        }
        openStudentModal(student);
        if (typeof global.switchStudentModalTab === 'function') {
            global.switchStudentModalTab('progressao');
        }
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
        if (btnTabStudentCadastral) btnTabStudentCadastral.addEventListener('click', function() {
            if (typeof global.switchStudentModalTab === 'function') global.switchStudentModalTab('cadastral');
        });
        if (btnTabStudentProgressao) btnTabStudentProgressao.addEventListener('click', function() {
            if (typeof global.switchStudentModalTab === 'function') global.switchStudentModalTab('progressao');
        });

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

        var activeModalStudent = null;

        if (btnPrintStudentRecord) {
            btnPrintStudentRecord.addEventListener('click', function() {
                var name = (document.getElementById('modal-student-name') && document.getElementById('modal-student-name').textContent) || 'Estudante';
                var matricula = (document.getElementById('modal-student-matricula') && document.getElementById('modal-student-matricula').textContent) || '-';
                var prof = (document.getElementById('modal-student-proficiency-badge') && document.getElementById('modal-student-proficiency-badge').textContent) || 'Adequado';
                var cpf = (document.getElementById('modal-student-cpf') && document.getElementById('modal-student-cpf').textContent) || '-';
                var sexo = (document.getElementById('modal-student-sexo') && document.getElementById('modal-student-sexo').textContent) || '-';
                var nasc = (document.getElementById('modal-student-nascimento') && document.getElementById('modal-student-nascimento').textContent) || '-';
                var cor = (document.getElementById('modal-student-cor') && document.getElementById('modal-student-cor').textContent) || '-';
                var escola = (document.getElementById('modal-student-escola') && document.getElementById('modal-student-escola').textContent) || 'Rede Municipal';
                var etapa = (document.getElementById('modal-student-etapa') && document.getElementById('modal-student-etapa').textContent) || '-';
                var turmaTurno = (document.getElementById('modal-student-turma-turno') && document.getElementById('modal-student-turma-turno').textContent) || '-';
                var mae = (document.getElementById('modal-student-mae') && document.getElementById('modal-student-mae').textContent) || '-';
                var pai = (document.getElementById('modal-student-pai') && document.getElementById('modal-student-pai').textContent) || '-';
                var endereco = (document.getElementById('modal-student-endereco') && document.getElementById('modal-student-endereco').textContent) || '-';
                var score = (document.getElementById('modal-student-score') && document.getElementById('modal-student-score').textContent) || '-';
                var scoreLp = (document.getElementById('modal-student-score-lp') && document.getElementById('modal-student-score-lp').textContent) || '-';
                var scoreMat = (document.getElementById('modal-student-score-mat') && document.getElementById('modal-student-score-mat').textContent) || '-';
                var freq = (document.getElementById('modal-student-freq') && document.getElementById('modal-student-freq').textContent) || '98%';
                var nee = (document.getElementById('modal-student-nee') && document.getElementById('modal-student-nee').textContent) || 'Regular / Sem NEE';

                var printWindow = window.open('', '_blank', 'width=880,height=960');
                if (!printWindow) {
                    window.print();
                    return;
                }

                var htmlDoc = [
                    '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ficha Individual - ' + name + '</title>',
                    '<style>',
                    '@page { size: A4 portrait; margin: 15mm; }',
                    'body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 13px; line-height: 1.4; }',
                    '.header { border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }',
                    '.section-title { background: #f1f5f9; padding: 6px 10px; font-weight: 700; font-size: 11px; text-transform: uppercase; color: #334155; margin: 14px 0 8px 0; border-left: 4px solid #2563eb; }',
                    '.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 8px; }',
                    '.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 16px; margin-bottom: 8px; }',
                    '.field-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; }',
                    '.field-value { font-size: 12px; font-weight: 700; color: #0f172a; }',
                    '.kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; }',
                    '.kpi-val { font-size: 18px; font-weight: 800; color: #2563eb; }',
                    '.signatures { margin-top: 40px; display: flex; justify-content: space-between; gap: 20px; }',
                    '.sig-line { border-top: 1px solid #94a3b8; text-align: center; padding-top: 6px; font-size: 11px; width: 45%; color: #475569; }',
                    '@media print { body { padding: 0; } }',
                    '</style></head><body>',
                    '<div class="header">',
                    '    <div>',
                    '        <h2 style="margin:0; font-size:16px; color:#0f172a;">PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA</h2>',
                    '        <h3 style="margin:3px 0 0 0; font-size:13px; color:#2563eb;">SECRETARIA MUNICIPAL DE EDUCAÇÃO — SEMED</h3>',
                    '        <p style="margin:2px 0 0 0; font-size:11px; color:#64748b;">Dossiê / Ficha Pedagógica Individual do Estudante • IDEB na Prática</p>',
                    '    </div>',
                    '    <div style="text-align:right; font-size:11px; color:#64748b;">',
                    '        <strong>Emissão:</strong> ' + new Date().toLocaleDateString('pt-BR') + '<br>',
                    '        <span style="font-family:monospace;">' + matricula + '</span>',
                    '    </div>',
                    '</div>',
                    '<div class="section-title">1. Identificação do Estudante</div>',
                    '<div class="grid-3">',
                    '    <div><span class="field-label">Nome Completo</span><div class="field-value">' + name + '</div></div>',
                    '    <div><span class="field-label">CPF</span><div class="field-value">' + cpf + '</div></div>',
                    '    <div><span class="field-label">Sexo / Cor</span><div class="field-value">' + sexo + ' • ' + cor + '</div></div>',
                    '    <div><span class="field-label">Data de Nascimento</span><div class="field-value">' + nasc + '</div></div>',
                    '    <div><span class="field-label">Nome da Mãe</span><div class="field-value">' + mae + '</div></div>',
                    '    <div><span class="field-label">Nome do Pai</span><div class="field-value">' + pai + '</div></div>',
                    '</div>',
                    '<div class="section-title">2. Vínculo Escolar & Turma</div>',
                    '<div class="grid-3">',
                    '    <div><span class="field-label">Unidade Escolar</span><div class="field-value">' + escola + '</div></div>',
                    '    <div><span class="field-label">Etapa / Série</span><div class="field-value">' + etapa + '</div></div>',
                    '    <div><span class="field-label">Turma & Turno</span><div class="field-value">' + turmaTurno + '</div></div>',
                    '    <div><span class="field-label">Acessibilidade / NEE</span><div class="field-value">' + nee + '</div></div>',
                    '    <div style="grid-column: span 2;"><span class="field-label">Endereço Residencial</span><div class="field-value">' + endereco + '</div></div>',
                    '</div>',
                    '<div class="section-title">3. Indicadores de Desempenho SAEB & Frequência</div>',
                    '<div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px;">',
                    '    <div class="kpi-card"><span class="field-label">Status Pedagógico</span><div class="kpi-val" style="font-size:14px; color:#10b981;">' + prof + '</div></div>',
                    '    <div class="kpi-card"><span class="field-label">Média SAEB</span><div class="kpi-val">' + score + '</div></div>',
                    '    <div class="kpi-card"><span class="field-label">L. Portuguesa / Mat.</span><div class="kpi-val" style="font-size:13px;">' + scoreLp + ' / ' + scoreMat + '</div></div>',
                    '    <div class="kpi-card"><span class="field-label">Frequência Escolar</span><div class="kpi-val" style="color:#059669;">' + freq + '</div></div>',
                    '</div>',
                    '<div class="signatures">',
                    '    <div class="sig-line">Professor(a) Regente / Responsável</div>',
                    '    <div class="sig-line">Direção Escolar / Coordenação SEMED</div>',
                    '</div>',
                    '<script>window.onload = function() { window.print(); };<\/script>',
                    '</body></html>'
                ].join('\n');

                printWindow.document.open();
                printWindow.document.write(htmlDoc);
                printWindow.document.close();

                if (typeof global.showToast === 'function') global.showToast('Ficha individual gerada com sucesso!', 'printer');
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
        document.addEventListener('DOMContentLoaded', function() {
            bindAlunosEventListeners();
            initAlunosTab();
        });
    } else {
        bindAlunosEventListeners();
        initAlunosTab();
    }

    // Exposição Global
    global.initAlunosTab = initAlunosTab;
    global.applyDbFilters = applyDbFilters;
    global.renderDbStudents = renderDbStudents;
    global.setupRevealButton = setupRevealButton;
    global.openStudentModal = openStudentModal;
    global.openStudentProgressionModal = openStudentProgressionModal;
    global.openStudentProgression = openStudentProgressionModal;

    if (typeof window !== 'undefined') {
        window.initAlunosTab = initAlunosTab;
        window.applyDbFilters = applyDbFilters;
        window.renderDbStudents = renderDbStudents;
        window.openStudentModal = openStudentModal;
        window.openStudentProgressionDirect = openStudentProgressionModal;
        window.openStudentProgressionModal = openStudentProgressionModal;
        window.openStudentProgression = openStudentProgressionModal;
    }

})(typeof window !== 'undefined' ? window : this);
