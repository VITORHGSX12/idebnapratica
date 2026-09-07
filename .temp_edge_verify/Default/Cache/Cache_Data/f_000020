/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO TURMAS (CRUD, SEEDS & WORKSPACE)
 * Arquivo: js/modules/turmas/turmas_crud.js
 * Descrição: Persistência de turmas e docentes, formulários modais de cadastro/edição,
 *            workspace da escola e tabela de turmas ativas.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var STORAGE_KEY_NETWORK_TURMAS = 'school_network_turmas_db';
    var STORAGE_KEY_NETWORK_TEACHERS = 'school_network_teachers_db';

    var INITIAL_NETWORK_TURMAS_SEED = [
        // UI JOSE CORREA LIMA
        { id: 'turma_jcl_2a', escola: 'UI JOSE CORREA LIMA', nome: '2º Ano A', etapa: '2º Ano', turno: 'Matutino', professor: 'Profa. Silvana Ferreira (Regente)', status: 'Ativa', createdAt: '2026-02-01' },
        { id: 'turma_jcl_2b', escola: 'UI JOSE CORREA LIMA', nome: '2º Ano B', etapa: '2º Ano', turno: 'Vespertino', professor: 'Prof. Marcos Andrade (Regente)', status: 'Ativa', createdAt: '2026-02-01' },
        { id: 'turma_jcl_5a', escola: 'UI JOSE CORREA LIMA', nome: '5º Ano A', etapa: '5º Ano', turno: 'Matutino', professor: 'Profa. Maria Josefa Lima', status: 'Ativa', createdAt: '2026-02-01' },
        { id: 'turma_jcl_9a', escola: 'UI JOSE CORREA LIMA', nome: '9º Ano A', etapa: '9º Ano', turno: 'Matutino', professor: 'Prof. Carlos Alberto Silva', status: 'Ativa', createdAt: '2026-02-01' },

        // U I BASILIO ALVES
        { id: 'turma_ba_2a', escola: 'U I BASILIO ALVES', nome: '2º Ano A', etapa: '2º Ano', turno: 'Matutino', professor: 'Profa. Claudia Mendes', status: 'Ativa', createdAt: '2026-02-01' },
        { id: 'turma_ba_5a', escola: 'U I BASILIO ALVES', nome: '5º Ano A', etapa: '5º Ano', turno: 'Matutino', professor: 'Prof. Raimundo Nonato', status: 'Ativa', createdAt: '2026-02-01' },

        // UNIDADE INTEGRADA JOSE GONCALVES DIAS
        { id: 'turma_jgd_5a', escola: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', nome: '5º Ano A', etapa: '5º Ano', turno: 'Matutino', professor: 'Profa. Ana Carolina Lima', status: 'Ativa', createdAt: '2026-02-01' },
        { id: 'turma_jgd_9a', escola: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', nome: '9º Ano A', etapa: '9º Ano', turno: 'Vespertino', professor: 'Prof. Carlos Silva', status: 'Ativa', createdAt: '2026-02-01' },

        // UI EMILIO MURAD
        { id: 'turma_em_5a', escola: 'UI EMILIO MURAD', nome: '5º Ano A', etapa: '5º Ano', turno: 'Matutino', professor: 'Profa. Francisca Antonia', status: 'Ativa', createdAt: '2026-02-01' },

        // UE ANITA FURTADO
        { id: 'turma_af_5a', escola: 'UE ANITA FURTADO', nome: '5º Ano A', etapa: '5º Ano', turno: 'Matutino', professor: 'Profa. Teresa Cristina', status: 'Ativa', createdAt: '2026-02-01' },

        // UNIDADE INTEGRADA ALDENORA ARAUJO CRUZ
        { id: 'turma_aac_5a', escola: 'UNIDADE INTEGRADA ALDENORA ARAUJO CRUZ', nome: '5º Ano A', etapa: '5º Ano', turno: 'Matutino', professor: 'Prof. João Batista Lima', status: 'Ativa', createdAt: '2026-02-01' }
    ];

    var INITIAL_NETWORK_TEACHERS_SEED = [
        { id: 'prof_01', escola: 'UI JOSE CORREA LIMA', nome: 'Profa. Silvana Ferreira', componente: 'Língua Portuguesa', turmas: '2º Ano A, 5º Ano A', telefone: '(99) 9935-6218', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_02', escola: 'UI JOSE CORREA LIMA', nome: 'Prof. Carlos Alberto Silva', componente: 'Matemática', turmas: '5º Ano A, 9º Ano A', telefone: '(99) 9935-6218', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_03', escola: 'UI JOSE CORREA LIMA', nome: 'Profa. Maria Josefa Lima', componente: 'Polivalente (Anos Iniciais)', turmas: '2º Ano B', telefone: '(99) 9935-6218', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_04', escola: 'U I BASILIO ALVES', nome: 'Profa. Claudia Mendes', componente: 'Língua Portuguesa', turmas: '2º Ano A, 5º Ano A', telefone: '(99) 9935-6221', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_05', escola: 'U I BASILIO ALVES', nome: 'Prof. Raimundo Nonato', componente: 'Matemática', turmas: '5º Ano A', telefone: '(99) 9935-6221', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_06', escola: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', nome: 'Profa. Ana Carolina Lima', componente: 'Língua Portuguesa', turmas: '5º Ano A', telefone: '(99) 9935-6224', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_07', escola: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', nome: 'Prof. Carlos Silva', componente: 'Matemática', turmas: '9º Ano A', telefone: '(99) 9935-6224', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_08', escola: 'UI EMILIO MURAD', nome: 'Profa. Francisca Antonia', componente: 'Polivalente (Anos Iniciais)', turmas: '5º Ano A', telefone: '(99) 9935-6219', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_09', escola: 'UE ANITA FURTADO', nome: 'Profa. Teresa Cristina', componente: 'Língua Portuguesa', turmas: '5º Ano A', telefone: '(99) 9935-6226', status: 'Ativo', createdAt: '2026-02-01' },
        { id: 'prof_10', escola: 'UNIDADE INTEGRADA ALDENORA ARAUJO CRUZ', nome: 'Prof. João Batista Lima', componente: 'Matemática', turmas: '5º Ano A', telefone: '(99) 9935-6222', status: 'Ativo', createdAt: '2026-02-01' }
    ];

    // -------------------------------------------------------------------------
    // 1. BANCO DE DADOS & PERSISTÊNCIA DE TURMAS E PROFESSORES
    // -------------------------------------------------------------------------

    function getAllNetworkTurmasDb() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_NETWORK_TURMAS);
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return INITIAL_NETWORK_TURMAS_SEED;
    }

    function saveNetworkTurmasDb(turmas) {
        try {
            localStorage.setItem(STORAGE_KEY_NETWORK_TURMAS, JSON.stringify(turmas));
        } catch(e) {}
    }

    function getSchoolTurmas(schoolName) {
        var all = getAllNetworkTurmasDb();
        return all.filter(function(t) { return t.escola === schoolName; });
    }

    function getAllNetworkTeachersDb() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_NETWORK_TEACHERS);
            if (raw) return JSON.parse(raw);
        } catch(e) {}
        return INITIAL_NETWORK_TEACHERS_SEED;
    }

    function saveNetworkTeachersDb(teachers) {
        try {
            localStorage.setItem(STORAGE_KEY_NETWORK_TEACHERS, JSON.stringify(teachers));
        } catch(e) {}
    }

    function getSchoolTeachers(schoolName) {
        var all = getAllNetworkTeachersDb();
        return all.filter(function(t) { return t.escola === schoolName; });
    }

    // -------------------------------------------------------------------------
    // 2. MODAL & CRUD DE TURMAS
    // -------------------------------------------------------------------------

    function openCreateTurmaModal(schoolName) {
        var modal = document.getElementById('modal-create-turma');
        var title = document.getElementById('modal-turma-title');
        var formId = document.getElementById('turma-form-id');
        var formSchool = document.getElementById('turma-form-school');
        var formName = document.getElementById('turma-form-name');
        var formStage = document.getElementById('turma-form-stage');
        var formShift = document.getElementById('turma-form-shift');
        var formTeacher = document.getElementById('turma-form-teacher');

        if (!modal) return;

        var activeSchool = schoolName || global.currentSelectedSchoolDetail || 'UI BASILIO ALVES';

        if (title) title.textContent = '+ Cadastrar Nova Turma em ' + activeSchool;
        if (formId) formId.value = '';
        if (formSchool) formSchool.value = activeSchool;
        if (formName) formName.value = '';
        if (formStage) formStage.value = '5º Ano';
        if (formShift) formShift.value = 'Matutino';
        if (formTeacher) formTeacher.value = '';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function openEditTurmaModal(turmaId) {
        var all = getAllNetworkTurmasDb();
        var turma = all.find(function(t) { return t.id === turmaId; });
        if (!turma) return;

        var modal = document.getElementById('modal-create-turma');
        var title = document.getElementById('modal-turma-title');
        var formId = document.getElementById('turma-form-id');
        var formSchool = document.getElementById('turma-form-school');
        var formName = document.getElementById('turma-form-name');
        var formStage = document.getElementById('turma-form-stage');
        var formShift = document.getElementById('turma-form-shift');
        var formTeacher = document.getElementById('turma-form-teacher');

        if (!modal) return;

        if (title) title.textContent = '✏️ Editar Turma — ' + turma.nome;
        if (formId) formId.value = turma.id;
        if (formSchool) formSchool.value = turma.escola;
        if (formName) formName.value = turma.nome;
        if (formStage) formStage.value = turma.etapa || '5º Ano';
        if (formShift) formShift.value = turma.turno || 'Matutino';
        if (formTeacher) formTeacher.value = turma.professor || '';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeModalTurma() {
        var modal = document.getElementById('modal-create-turma');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleSaveTurma(event) {
        if (event && event.preventDefault) event.preventDefault();

        var formId = document.getElementById('turma-form-id') ? document.getElementById('turma-form-id').value : '';
        var formSchool = (document.getElementById('turma-form-school') && document.getElementById('turma-form-school').value) || global.currentSelectedSchoolDetail || 'UI BASILIO ALVES';
        var formName = document.getElementById('turma-form-name') ? document.getElementById('turma-form-name').value.trim() : '';
        var formStage = (document.getElementById('turma-form-stage') && document.getElementById('turma-form-stage').value) || '5º Ano';
        var formShift = (document.getElementById('turma-form-shift') && document.getElementById('turma-form-shift').value) || 'Matutino';
        var formTeacher = (document.getElementById('turma-form-teacher') && document.getElementById('turma-form-teacher').value) || 'Coordenação / Regente';

        if (!formName) {
            if (typeof global.showToast === 'function') {
                global.showToast('Por favor, informe o nome da turma.', 'warning');
            }
            return;
        }

        var all = getAllNetworkTurmasDb();

        if (formId) {
            var existing = all.find(function(t) { return t.id === formId; });
            if (existing) {
                existing.nome = formName;
                existing.etapa = formStage;
                existing.turno = formShift;
                existing.professor = formTeacher;
            }
        } else {
            var newTurma = {
                id: 'turma_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                escola: formSchool,
                nome: formName,
                etapa: formStage,
                turno: formShift,
                professor: formTeacher,
                status: 'Ativa',
                createdAt: new Date().toISOString()
            };
            all.push(newTurma);
        }

        saveNetworkTurmasDb(all);
        closeModalTurma();

        if (typeof global.switchSchoolInnerTab === 'function') {
            global.switchSchoolInnerTab('turmas');
        }

        if (typeof global.showToast === 'function') {
            global.showToast('✅ Turma "' + formName + '" salva com sucesso em ' + formSchool + '!', 'success');
        }
    }

    function handleDeleteTurma(turmaId) {
        var all = getAllNetworkTurmasDb();
        var turma = all.find(function(t) { return t.id === turmaId; });
        if (!turma) return;

        if (typeof confirm === 'function' && !confirm('Tem certeza de que deseja excluir a turma "' + turma.nome + '" da escola ' + turma.escola + '?')) {
            return;
        }

        var updated = all.filter(function(t) { return t.id !== turmaId; });
        saveNetworkTurmasDb(updated);

        if (typeof global.switchSchoolInnerTab === 'function') {
            global.switchSchoolInnerTab('turmas');
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Turma "' + turma.nome + '" excluída com sucesso.', 'info');
        }
    }

    // -------------------------------------------------------------------------
    // 3. MODAL & CRUD DE PROFESSORES
    // -------------------------------------------------------------------------

    function openCreateTeacherModal(schoolName) {
        var modal = document.getElementById('modal-create-teacher');
        var title = document.getElementById('modal-teacher-title');
        var formId = document.getElementById('teacher-form-id');
        var formSchool = document.getElementById('teacher-form-school');
        var formName = document.getElementById('teacher-form-name');
        var formSubject = document.getElementById('teacher-form-subject');
        var formStatus = document.getElementById('teacher-form-status');
        var formClasses = document.getElementById('teacher-form-classes');
        var formPhone = document.getElementById('teacher-form-phone');

        if (!modal) return;

        var activeSchool = schoolName || global.currentSelectedSchoolDetail || 'UI BASILIO ALVES';

        if (title) title.textContent = '+ Vincular Docente — ' + activeSchool;
        if (formId) formId.value = '';
        if (formSchool) formSchool.value = activeSchool;
        if (formName) formName.value = '';
        if (formSubject) formSubject.value = 'Língua Portuguesa';
        if (formStatus) formStatus.value = 'Ativo';
        if (formClasses) formClasses.value = '';
        if (formPhone) formPhone.value = '';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function openEditTeacherModal(teacherId) {
        var all = getAllNetworkTeachersDb();
        var teacher = all.find(function(t) { return t.id === teacherId; });
        if (!teacher) return;

        var modal = document.getElementById('modal-create-teacher');
        var title = document.getElementById('modal-teacher-title');
        var formId = document.getElementById('teacher-form-id');
        var formSchool = document.getElementById('teacher-form-school');
        var formName = document.getElementById('teacher-form-name');
        var formSubject = document.getElementById('teacher-form-subject');
        var formStatus = document.getElementById('teacher-form-status');
        var formClasses = document.getElementById('teacher-form-classes');
        var formPhone = document.getElementById('teacher-form-phone');

        if (!modal) return;

        if (title) title.textContent = '✏️ Editar Dados do Professor — ' + teacher.nome;
        if (formId) formId.value = teacher.id;
        if (formSchool) formSchool.value = teacher.escola;
        if (formName) formName.value = teacher.nome;
        if (formSubject) formSubject.value = teacher.componente || 'Língua Portuguesa';
        if (formStatus) formStatus.value = teacher.status || 'Ativo';
        if (formClasses) formClasses.value = teacher.turmas || '';
        if (formPhone) formPhone.value = teacher.telefone || '';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeModalTeacher() {
        var modal = document.getElementById('modal-create-teacher');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleSaveTeacher(event) {
        if (event && event.preventDefault) event.preventDefault();

        var formId = document.getElementById('teacher-form-id') ? document.getElementById('teacher-form-id').value : '';
        var formSchool = (document.getElementById('teacher-form-school') && document.getElementById('teacher-form-school').value) || global.currentSelectedSchoolDetail || 'UI BASILIO ALVES';
        var formName = document.getElementById('teacher-form-name') ? document.getElementById('teacher-form-name').value.trim() : '';
        var formSubject = (document.getElementById('teacher-form-subject') && document.getElementById('teacher-form-subject').value) || 'Língua Portuguesa';
        var formStatus = (document.getElementById('teacher-form-status') && document.getElementById('teacher-form-status').value) || 'Ativo';
        var formClasses = (document.getElementById('teacher-form-classes') && document.getElementById('teacher-form-classes').value.trim()) || 'Todas as turmas da etapa';
        var formPhone = (document.getElementById('teacher-form-phone') && document.getElementById('teacher-form-phone').value.trim()) || '';

        if (!formName) {
            if (typeof global.showToast === 'function') {
                global.showToast('Por favor, informe o nome do professor.', 'warning');
            }
            return;
        }

        var all = getAllNetworkTeachersDb();

        if (formId) {
            var existing = all.find(function(t) { return t.id === formId; });
            if (existing) {
                existing.nome = formName;
                existing.componente = formSubject;
                existing.status = formStatus;
                existing.turmas = formClasses;
                existing.telefone = formPhone;
            }
        } else {
            var newTeacher = {
                id: 'prof_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
                escola: formSchool,
                nome: formName,
                componente: formSubject,
                status: formStatus,
                turmas: formClasses,
                telefone: formPhone,
                createdAt: new Date().toISOString()
            };
            all.push(newTeacher);
        }

        saveNetworkTeachersDb(all);
        closeModalTeacher();

        if (typeof global.switchSchoolInnerTab === 'function') {
            global.switchSchoolInnerTab('professores');
        }

        if (typeof global.showToast === 'function') {
            global.showToast('✅ Professor(a) "' + formName + '" salvo(a) com sucesso!', 'success');
        }
    }

    function handleDeleteTeacher(teacherId) {
        var all = getAllNetworkTeachersDb();
        var teacher = all.find(function(t) { return t.id === teacherId; });
        if (!teacher) return;

        if (typeof confirm === 'function' && !confirm('Deseja realmente desvincular o(a) docente "' + teacher.nome + '" da escola ' + teacher.escola + '?')) {
            return;
        }

        var updated = all.filter(function(t) { return t.id !== teacherId; });
        saveNetworkTeachersDb(updated);

        if (typeof global.switchSchoolInnerTab === 'function') {
            global.switchSchoolInnerTab('professores');
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Docente "' + teacher.nome + '" desvinculado(a) com sucesso.', 'info');
        }
    }

    // -------------------------------------------------------------------------
    // 4. WORKSPACE & TABELA DE TURMAS DA ESCOLA
    // -------------------------------------------------------------------------

    function openSchoolWorkspace(schoolName) {
        openSchoolClassesTableView(schoolName);
    }

    function openSchoolClassesTableView(schoolName) {
        if (typeof global.setActiveDiarySchool === 'function') {
            global.setActiveDiarySchool(schoolName || 'UI JOSE CORREA LIMA');
        }

        var activeDiarySchool = schoolName || 'UI JOSE CORREA LIMA';
        var overview = document.getElementById('schools-overview-container');
        var classesView = document.getElementById('school-classes-table-view');
        var diaryView = document.getElementById('class-diary-view');

        if (overview) overview.classList.add('hidden');
        if (diaryView) diaryView.classList.add('hidden');
        if (classesView) classesView.classList.remove('hidden');

        var subtitle = document.getElementById('classes-school-subtitle');
        if (subtitle) subtitle.textContent = 'Turmas e Agrupamentos Escolares — ' + activeDiarySchool;

        renderSchoolClassesTable();
        if (typeof global.scrollTo === 'function') global.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function renderSchoolClassesTable() {
        var tbody = document.getElementById('school-classes-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        var activeDiarySchool = (typeof global.getActiveDiarySchool === 'function') ? global.getActiveDiarySchool() : 'UI JOSE CORREA LIMA';
        var loaded = global.loadedStudents || [];
        var schoolStudents = loaded.filter(function(s) { return s.escola === activeDiarySchool; });
        
        var classesSet = Array.from(new Set(schoolStudents.map(function(s) { return s.turma || s.etapa; }))).filter(Boolean);
        
        if (classesSet.length === 0 || classesSet.length < 4) {
            classesSet = [
                '5º ANO "A" - MATUTINO',
                '5º ANO "A" - VESPERTINO',
                '5º ANO "B" - MATUTINO',
                '5º ANO "B" - VESPERTINO',
                '2º ANO "A" - MATUTINO',
                '2º ANO "A" - VESPERTINO',
                '9º ANO "A" - MATUTINO',
                '9º ANO "B" - VESPERTINO',
                '6º ANO "A" - MATUTINO'
            ];
        }

        var searchInput = document.getElementById('classes-table-search-input');
        var query = searchInput ? searchInput.value.toLowerCase() : '';
        var filteredClasses = classesSet.filter(function(cls) {
            return cls.toLowerCase().includes(query) || activeDiarySchool.toLowerCase().includes(query);
        });

        var kpiTotal = document.getElementById('kpi-school-total-classes');
        var kpiYear = document.getElementById('kpi-school-classes-year');
        var kpiActive = document.getElementById('kpi-school-active-classes');

        var countVal = classesSet.length;
        if (kpiTotal) kpiTotal.textContent = String(countVal);
        if (kpiYear) kpiYear.textContent = String(countVal);
        if (kpiActive) kpiActive.textContent = String(countVal);

        if (filteredClasses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 30px; text-align: center; color: var(--text-muted);">Nenhuma turma encontrada nesta escola com este termo de busca.</td></tr>';
            return;
        }

        filteredClasses.forEach(function(clsName) {
            var gradeNum = '5';
            var stageDesc = 'Etapa: FUNDAMENTAL MENOR (1º AO 5º ANO) ➔ 5º ANO';
            var shift = clsName.toLowerCase().includes('vespertino') ? 'VESPERTINO' : 'Matutino';

            if (clsName.includes('2')) {
                gradeNum = '2';
                stageDesc = 'Etapa: ALFABETIZAÇÃO & FLUÊNCIA (SEAMA) ➔ 2º ANO';
            } else if (clsName.includes('6')) {
                gradeNum = '6';
                stageDesc = 'Etapa: FUNDAMENTAL MAIOR (6º AO 9º ANO) ➔ 6º ANO';
            } else if (clsName.includes('9')) {
                gradeNum = '9';
                stageDesc = 'Etapa: FUNDAMENTAL MAIOR (6º AO 9º ANO) ➔ 9º ANO';
            }

            var tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '62px';

            tr.innerHTML = [
                '<td style="padding: 12px 20px;">',
                '    <div style="display: flex; align-items: center; gap: 14px;">',
                '        <div class="class-grade-box">' + gradeNum + '</div>',
                '        <div>',
                '            <div class="class-title-bold">' + clsName + '</div>',
                '            <div class="class-stage-subtitle">' + stageDesc + '</div>',
                '        </div>',
                '    </div>',
                '</td>',
                '<td style="padding: 12px 16px;">',
                '    <span class="class-school-badge" title="' + activeDiarySchool + '">' + activeDiarySchool + '</span>',
                '</td>',
                '<td style="padding: 12px 16px;">',
                '    <span class="class-shift-badge ' + shift.toLowerCase() + '">' + shift + '</span>',
                '</td>',
                '<td style="padding: 12px 16px; text-align: center;">',
                '    <span class="class-status-badge">ATIVA</span>',
                '</td>',
                '<td style="padding: 12px 20px; text-align: center;">',
                '    <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">',
                '        <button class="class-action-btn more-options-btn" title="Mais Opções">',
                '            <i data-lucide="more-horizontal" style="width:15px; height:15px;"></i>',
                '        </button>',
                '        <button class="class-action-btn edit-class-btn" data-class="' + clsName + '" title="Editar Turma">',
                '            <i data-lucide="pencil" style="width:14px; height:14px;"></i>',
                '        </button>',
                '        <button class="class-action-btn view view-class-diary-btn" data-class="' + clsName + '" title="Abrir Diário da Turma">',
                '            <i data-lucide="eye" style="width:15px; height:15px;"></i>',
                '        </button>',
                '    </div>',
                '</td>'
            ].join('');

            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.view-class-diary-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cls = btn.getAttribute('data-class');
                if (typeof global.openClassDiaryView === 'function') {
                    global.openClassDiaryView(cls, activeDiarySchool);
                }
            });
        });

        tbody.querySelectorAll('.edit-class-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cls = btn.getAttribute('data-class');
                var newName = prompt('Editar nome da turma:', cls);
                if (newName && newName.trim()) {
                    if (typeof global.showToast === 'function') {
                        global.showToast('Turma renomeada para "' + newName.trim() + '"!', 'check');
                    }
                    renderSchoolClassesTable();
                }
            });
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function renderInnerTurmasRows(turmasList, school) {
        if (!turmasList || turmasList.length === 0) {
            return [
                '<tr>',
                '    <td colspan="5" style="padding: 42px 20px; text-align: center; color: var(--text-muted);">',
                '        <div style="width: 46px; height: 46px; border-radius: 50%; background: rgba(99,102,241,0.1); color: #6366f1; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 10px;">',
                '            <i data-lucide="book-open" style="width: 22px; height: 22px;"></i>',
                '        </div>',
                '        <h4 style="margin: 0 0 4px 0; font-size: 1rem; color: var(--text-primary);">Nenhuma turma cadastrada para esta escola</h4>',
                '        <p style="margin: 0 0 14px 0; font-size: 0.8rem; color: var(--text-secondary);">Esta escola ainda não possui turmas cadastradas. Clique abaixo para criar a primeira turma.</p>',
                '        <button type="button" onclick="openCreateTurmaModal(\'' + school.replace(/'/g, "\\'") + '\');" class="btn btn-primary btn-sm" style="font-weight: 700; background: #6366f1; border-color: #6366f1;">',
                '            + Criar Primeira Turma',
                '        </button>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }

        return turmasList.map(function(t) {
            return [
                '<tr style="border-bottom: 1px solid var(--border-color); height: 60px; transition: background 0.15s ease;">',
                '    <td style="padding: 12px 20px;">',
                '        <div style="font-weight: 800; color: var(--text-primary); font-size: 0.92rem;">' + t.nome + '</div>',
                '        <div style="font-size: 0.74rem; color: var(--text-muted);">' + (t.etapa || 'Ensino Fundamental') + ' • ' + (t.professor || 'Docente Regente') + '</div>',
                '    </td>',
                '    <td style="padding: 12px 16px; color: var(--text-secondary); font-size: 0.84rem;">' + t.escola + '</td>',
                '    <td style="padding: 12px 16px;">',
                '        <span class="badge" style="background: rgba(99,102,241,0.1); color: #6366f1; font-weight: 700; font-size: 0.75rem;">' + (t.turno || 'Matutino') + '</span>',
                '    </td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <span style="background: #dcfce7; color: #166534; font-size: 0.72rem; font-weight: 800; padding: 3px 10px; border-radius: 12px;">Ativa</span>',
                '    </td>',
                '    <td style="padding: 12px 20px; text-align: center;">',
                '        <div style="display: inline-flex; align-items: center; gap: 8px; justify-content: center;">',
                '            <button type="button" onclick="openTurmaJournalModal(\'' + t.id + '\', \'' + t.nome.replace(/'/g, "\\'") + '\', \'' + t.escola.replace(/'/g, "\\'") + '\');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 5px 12px; height: 30px;" title="Abrir Diário da Turma e Lista de Alunos">',
                '                <i data-lucide="book-open" style="width: 14px; height: 14px;"></i> <span>Ver Diário</span>',
                '            </button>',
                '            <button type="button" onclick="openEditTurmaModal(\'' + t.id + '\');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 5px 8px; height: 30px;" title="Editar Turma"><i data-lucide="edit-3" style="width: 13px; height: 13px;"></i></button>',
                '            <button type="button" onclick="handleDeleteTurma(\'' + t.id + '\');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 5px 8px; height: 30px; color: var(--color-status-critical-text);" title="Excluir Turma"><i data-lucide="trash-2" style="width: 13px; height: 13px;"></i></button>',
                '        </div>',
                '    </td>',
                '</tr>'
            ].join('\n');
        }).join('\n');
    }

    function filterInnerTurmasTable(query) {
        var tbody = document.getElementById('inner-turmas-tbody');
        if (!tbody) return;

        var school = global.currentSelectedSchoolDetail || "UI BASILIO ALVES";
        var allSchoolTurmas = getSchoolTurmas(school);
        var q = (query || '').toLowerCase().trim();

        var filtered = allSchoolTurmas.filter(function(t) {
            return t.nome.toLowerCase().includes(q) || (t.etapa && t.etapa.toLowerCase().includes(q));
        });
        tbody.innerHTML = renderInnerTurmasRows(filtered, school);
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    // Exposição no Escopo Global
    global.getAllNetworkTurmasDb = getAllNetworkTurmasDb;
    global.saveNetworkTurmasDb = saveNetworkTurmasDb;
    global.getSchoolTurmas = getSchoolTurmas;

    global.getAllNetworkTeachersDb = getAllNetworkTeachersDb;
    global.saveNetworkTeachersDb = saveNetworkTeachersDb;
    global.getSchoolTeachers = getSchoolTeachers;

    global.openCreateTurmaModal = openCreateTurmaModal;
    global.openEditTurmaModal = openEditTurmaModal;
    global.closeModalTurma = closeModalTurma;
    global.handleSaveTurma = handleSaveTurma;
    global.handleDeleteTurma = handleDeleteTurma;

    global.openCreateTeacherModal = openCreateTeacherModal;
    global.openEditTeacherModal = openEditTeacherModal;
    global.closeModalTeacher = closeModalTeacher;
    global.handleSaveTeacher = handleSaveTeacher;
    global.handleDeleteTeacher = handleDeleteTeacher;

    global.openSchoolWorkspace = openSchoolWorkspace;
    global.openSchoolClassesTableView = openSchoolClassesTableView;
    global.renderSchoolClassesTable = renderSchoolClassesTable;
    global.renderInnerTurmasRows = renderInnerTurmasRows;
    global.filterInnerTurmasTable = filterInnerTurmasTable;

})(typeof window !== 'undefined' ? window : this);
