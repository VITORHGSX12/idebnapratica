/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MODAIS DA UNIDADE ESCOLAR
 * Arquivo: js/modules/escolas/escolas_modals.js
 * Descrição: Modais de cadastro de turmas, docentes, matrículas de estudantes
 *            e gestão de agrupamentos e enturmações por unidade.
 * ============================================================================
 */

(function(global) {
    'use strict';

    // -------------------------------------------------------------------------
    // 1. MODAL CRIAR TURMA & VER ALUNOS DA TURMA
    // -------------------------------------------------------------------------

    function openCreateClassModal(schoolName) {
        var modal = document.getElementById('modal-create-class');
        if (!modal) return;
        var scEl = document.getElementById('create-class-school-name');
        if (scEl) scEl.value = schoolName;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeCreateClassModal() {
        var modal = document.getElementById('modal-create-class');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    async function handleSaveCreateClass(event) {
        if (event) event.preventDefault();

        var schoolName = document.getElementById('create-class-school-name').value;
        var className = document.getElementById('create-class-name').value.trim();
        var classStage = document.getElementById('create-class-stage').value;
        var classShift = document.getElementById('create-class-shift').value;

        if (!className) {
            alert('Por favor, informe a identificação da turma.');
            return;
        }

        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            var res = await fetch('/api/classes', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    nome: className,
                    serie: classStage,
                    etapa: classStage,
                    turno: classShift,
                    escola: schoolName
                })
            });

            var json = await res.json();
            if (res.ok && json.success) {
                var newClass = json.class;
                var allClasses = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState() : [];
                allClasses.push(newClass);
                if (typeof global.saveOfficialClassesState === 'function') {
                    global.saveOfficialClassesState(allClasses);
                }
                closeCreateClassModal();
                if (typeof global.renderSchoolClassesTab === 'function') {
                    global.renderSchoolClassesTab(schoolName);
                }
                if (typeof global.showToast === 'function') {
                    global.showToast('Turma "' + className + '" cadastrada com sucesso no banco de dados!', 'check');
                }
                return;
            }
        } catch(e) {
            console.warn('[Create Class API Fallback]', e);
        }

        var allClasses = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState() : [];
        var newClass = {
            id: 'turma_' + Date.now(),
            escola: schoolName,
            nome: className,
            serie: classStage,
            turno: classShift,
            alunosCount: 0
        };

        allClasses.push(newClass);
        if (typeof global.saveOfficialClassesState === 'function') {
            global.saveOfficialClassesState(allClasses);
        }

        closeCreateClassModal();
        if (typeof global.renderSchoolClassesTab === 'function') {
            global.renderSchoolClassesTab(schoolName);
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Turma "' + className + '" criada com sucesso!', 'check');
        }
    }

    async function openViewClassStudentsModal(classId, className, schoolName) {
        var modal = document.getElementById('modal-view-class-students');
        if (!modal) return;

        var titleEl = document.getElementById('view-class-title');
        var subtitleEl = document.getElementById('view-class-subtitle');
        var tbody = document.getElementById('view-class-students-tbody');

        if (titleEl) titleEl.textContent = className;
        if (subtitleEl) subtitleEl.textContent = schoolName + ' • Carregando estudantes...';
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--color-text-muted);">Carregando estudantes da turma...</td></tr>';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');

        var classStudents = [];
        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            if (classId && !classId.startsWith('turma_')) {
                var res = await fetch('/api/classes/' + encodeURIComponent(classId) + '/students', { headers: headers });
                if (res.ok) {
                    var data = await res.json();
                    if (Array.isArray(data)) classStudents = data;
                }
            }
        } catch(e) {
            console.warn('[Fetch Class Students Fallback]', e);
        }

        if (classStudents.length === 0) {
            var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : [];
            classStudents = allStudents.filter(function(st) {
                var matchEscola = (st.escola || '').toUpperCase().includes(schoolName.toUpperCase()) || schoolName.toUpperCase().includes((st.escola || '').toUpperCase());
                var matchTurma = (st.turmaId === classId) || ((st.turma || '').toUpperCase() === className.toUpperCase());
                return matchEscola && matchTurma;
            });
        }

        if (subtitleEl) subtitleEl.textContent = schoolName + ' • ' + classStudents.length + ' alunos matriculados';

        if (tbody) {
            if (classStudents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--color-text-muted);">Nenhum estudante vinculado a esta turma ainda.</td></tr>';
            } else {
                tbody.innerHTML = classStudents.map(function(st, idx) {
                    return `
                        <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 46px;">
                            <td style="padding: 8px 14px; font-weight: 700; color: var(--color-text-muted); font-size: 11px; width: 40px;">
                                ${idx + 1}
                            </td>
                            <td style="padding: 8px 14px; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 600;">
                                ${st.matricula || '-'}
                            </td>
                            <td style="padding: 8px 14px;">
                                <strong style="color: var(--color-brand-primary); font-size: var(--text-sm);">${st.nome}</strong>
                            </td>
                            <td style="padding: 8px 14px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                                ${st.dataNascimento || st.nascimento || '-'}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    function closeViewClassStudentsModal() {
        var modal = document.getElementById('modal-view-class-students');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    // -------------------------------------------------------------------------
    // 2. MODAL VINCULAR NOVO PROFESSOR
    // -------------------------------------------------------------------------

    function openCreateTeacherModal(schoolName) {
        var modal = document.getElementById('modal-create-teacher');
        if (!modal) return;

        var scEl = document.getElementById('create-teacher-school-name');
        if (scEl) scEl.value = schoolName;

        var selectTurmas = document.getElementById('create-teacher-turmas');
        if (selectTurmas) {
            var classes = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState().filter(function(c) { return c.escola === schoolName; }) : [];
            selectTurmas.innerHTML = classes.map(function(c) {
                return `<option value="${c.nome}">${c.nome}</option>`;
            }).join('');
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeCreateTeacherModal() {
        var modal = document.getElementById('modal-create-teacher');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleSaveCreateTeacher(event) {
        if (event) event.preventDefault();

        var schoolName = document.getElementById('create-teacher-school-name').value;
        var name = document.getElementById('create-teacher-name').value.trim();
        var email = document.getElementById('create-teacher-email').value.trim();
        var subject = document.getElementById('create-teacher-subject').value;
        var selectTurmas = document.getElementById('create-teacher-turmas');

        var selected = [];
        if (selectTurmas) {
            for (var i = 0; i < selectTurmas.options.length; i++) {
                if (selectTurmas.options[i].selected) {
                    selected.push(selectTurmas.options[i].value);
                }
            }
        }

        if (!name || !email) {
            alert('Por favor, preencha o nome e e-mail do professor.');
            return;
        }

        var allTeachers = typeof global.getOfficialTeachersState === 'function' ? global.getOfficialTeachersState() : [];
        var newTeacher = {
            id: 'prof_' + Date.now(),
            nome: name,
            email: email,
            disciplina: subject,
            escola: schoolName,
            turmas: selected.length > 0 ? selected : ['Geral'],
            status: 'Ativo'
        };
        allTeachers.push(newTeacher);

        if (typeof global.saveOfficialTeachersState === 'function') {
            global.saveOfficialTeachersState(allTeachers);
        }

        if (typeof global.enqueueSyncAction === 'function') {
            global.enqueueSyncAction('professor', 'CREATE', newTeacher);
        }

        closeCreateTeacherModal();
        if (typeof global.renderSchoolTeachersTab === 'function') {
            global.renderSchoolTeachersTab(schoolName);
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Professor "' + name + '" vinculado com sucesso!', 'check');
        }
    }

    // -------------------------------------------------------------------------
    // 3. MODAL CADASTRAR ALUNO & MUDAR DE TURMA
    // -------------------------------------------------------------------------

    function openCreateStudentModal(schoolName) {
        var modal = document.getElementById('modal-create-student');
        if (!modal) return;

        var targetSchool = schoolName || global.currentSelectedSchoolDetail || 'UI ALDENORA DE ARAÚJO CRUZ';
        var scEl = document.getElementById('create-student-school');
        if (scEl) scEl.value = targetSchool;

        var selectTurma = document.getElementById('create-student-turma');
        if (selectTurma) {
            var classes = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState().filter(function(c) { return c.escola === targetSchool; }) : [];
            selectTurma.innerHTML = '<option value="">Sem Turma Definida</option>' + classes.map(function(c) {
                return `<option value="${c.nome}">${c.nome}</option>`;
            }).join('');
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeCreateStudentModal() {
        var modal = document.getElementById('modal-create-student');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleSaveCreateStudent(event) {
        if (event) event.preventDefault();

        var schoolName = document.getElementById('create-student-school').value;
        var name = document.getElementById('create-student-name').value.trim();
        var matricula = document.getElementById('create-student-matricula').value.trim();
        var birthDate = document.getElementById('create-student-birth').value;
        var turma = document.getElementById('create-student-turma').value;
        var cpf = document.getElementById('create-student-cpf').value.trim();

        if (!name) {
            alert('Por favor, informe o nome completo do estudante.');
            return;
        }

        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : [];
        var newStudent = {
            id: 'aluno_' + Date.now(),
            matricula: matricula || ('MAT-' + Math.floor(10000 + Math.random() * 90000)),
            nome: name,
            escola: schoolName,
            etapa: turma ? (turma.includes('2º') ? '2º Ano' : (turma.includes('9º') ? '9º Ano' : '5º Ano')) : '5º Ano',
            turma: turma || 'Sem turma',
            dataNascimento: birthDate || '',
            cpf: cpf ? cpf.replace(/\D/g, '') : '',
            status: 'Ativo'
        };

        allStudents.push(newStudent);
        if (typeof global.saveOfficialStudentsState === 'function') {
            global.saveOfficialStudentsState(allStudents);
        }

        if (typeof global.enqueueSyncAction === 'function') {
            global.enqueueSyncAction('aluno', 'CREATE', newStudent);
        }

        closeCreateStudentModal();
        if (typeof global.renderSchoolStudentsTab === 'function') {
            global.renderSchoolStudentsTab(schoolName);
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Estudante "' + name + '" cadastrado com sucesso!', 'check');
        }
    }

    function openChangeStudentClassModal(studentId, studentName, schoolName) {
        var modal = document.getElementById('modal-change-student-class');
        if (!modal) return;

        var nameEl = document.getElementById('change-student-class-name');
        var idEl = document.getElementById('change-student-class-id');
        var scEl = document.getElementById('change-student-class-school');
        var selectEl = document.getElementById('change-student-class-select');

        if (nameEl) nameEl.textContent = studentName;
        if (idEl) idEl.value = studentId;
        if (scEl) scEl.value = schoolName;

        if (selectEl) {
            var classes = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState().filter(function(c) { return c.escola === schoolName; }) : [];
            var student = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState().find(function(s) { return s.id === studentId; }) : null;
            var currentTurma = student ? student.turma : '';

            selectEl.innerHTML = '<option value="">Desvincular (Sem Turma)</option>' + classes.map(function(c) {
                var isSelected = c.nome === currentTurma ? 'selected' : '';
                return `<option value="${c.nome}" ${isSelected}>${c.nome}</option>`;
            }).join('');
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeChangeStudentClassModal() {
        var modal = document.getElementById('modal-change-student-class');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleSaveChangeStudentClass(event) {
        if (event) event.preventDefault();

        var studentId = document.getElementById('change-student-class-id').value;
        var schoolName = document.getElementById('change-student-class-school').value;
        var newTurma = document.getElementById('change-student-class-select').value;

        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : [];
        var index = allStudents.findIndex(function(s) { return s.id === studentId; });

        if (index !== -1) {
            allStudents[index].turma = newTurma || 'Sem turma';
            if (typeof global.saveOfficialStudentsState === 'function') {
                global.saveOfficialStudentsState(allStudents);
            }

            if (typeof global.enqueueSyncAction === 'function') {
                global.enqueueSyncAction('aluno', 'UPDATE', { id: studentId, turma: newTurma, escola: schoolName });
            }
        }

        closeChangeStudentClassModal();
        if (typeof global.renderSchoolStudentsTab === 'function') {
            global.renderSchoolStudentsTab(schoolName);
        }

        if (typeof global.showToast === 'function') {
            global.showToast('Turma do aluno atualizada!', 'check');
        }
    }

    // Exposição no Escopo Global
    global.openCreateClassModal = openCreateClassModal;
    global.closeCreateClassModal = closeCreateClassModal;
    global.handleSaveCreateClass = handleSaveCreateClass;

    global.openViewClassStudentsModal = openViewClassStudentsModal;
    global.closeViewClassStudentsModal = closeViewClassStudentsModal;

    global.openCreateTeacherModal = openCreateTeacherModal;
    global.closeCreateTeacherModal = closeCreateTeacherModal;
    global.handleSaveCreateTeacher = handleSaveCreateTeacher;

    global.openCreateStudentModal = openCreateStudentModal;
    global.closeCreateStudentModal = closeCreateStudentModal;
    global.handleSaveCreateStudent = handleSaveCreateStudent;

    global.openChangeStudentClassModal = openChangeStudentClassModal;
    global.closeChangeStudentClassModal = closeChangeStudentClassModal;
    global.handleSaveChangeStudentClass = handleSaveChangeStudentClass;

})(typeof window !== 'undefined' ? window : this);
