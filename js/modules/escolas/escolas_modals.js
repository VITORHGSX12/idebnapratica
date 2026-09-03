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
        var footerCountEl = document.getElementById('view-class-footer-count');
        var tbody = document.getElementById('view-class-students-tbody');

        if (titleEl) {
            titleEl.innerHTML = `
                <i data-lucide="users" style="width: 20px; height: 20px; color: var(--color-accent-primary);"></i>
                <span>Turma: ${className}</span>
            `;
        }
        if (subtitleEl) subtitleEl.textContent = schoolName + ' • Carregando estudantes...';
        if (footerCountEl) footerCountEl.textContent = 'Carregando...';
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="padding: 28px; text-align: center; color: var(--color-text-muted); font-size: var(--text-sm);">Carregando estudantes da turma...</td></tr>';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');

        var classStudents = [];
        var fetchFailed = false;
        var fetchCompleted = false;

        try {
            var token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
            var headers = token ? { 'Authorization': 'Bearer ' + token } : {};
            if (classId && !classId.startsWith('turma_')) {
                var res = await fetch('/api/classes/' + encodeURIComponent(classId) + '/students', { headers: headers });
                if (res.ok) {
                    var data = await res.json();
                    if (Array.isArray(data)) {
                        classStudents = data;
                        fetchCompleted = true;
                    }
                } else {
                    fetchFailed = true;
                }
            } else {
                fetchFailed = true;
            }
        } catch(e) {
            console.warn('[Fetch Class Students Network Error - Ativando Fallback]', e);
            fetchFailed = true;
        }

        // Fallback ativado EXCLUSIVAMENTE em caso de falha de rede / offline
        if (!fetchCompleted && fetchFailed) {
            var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : [];
            classStudents = allStudents.filter(function(st) {
                var matchEscola = !st.escola || (st.escola || '').toUpperCase().includes(schoolName.toUpperCase()) || schoolName.toUpperCase().includes((st.escola || '').toUpperCase());
                var matchTurma = (st.turmaId === classId) || ((st.turma || '').toUpperCase() === className.toUpperCase());
                return matchEscola && matchTurma;
            });
            if (typeof global.showToast === 'function') {
                global.showToast('Exibindo dados de alunos do cache local (modo offline)', 'alert');
            }
        }

        var countText = classStudents.length + ' estudante' + (classStudents.length === 1 ? '' : 's') + ' matriculado' + (classStudents.length === 1 ? '' : 's');
        var offlineBadge = (!fetchCompleted && fetchFailed) ? ' <span class="badge badge-warning" style="font-size: 10px; font-weight: 700; margin-left: 6px;">● CACHE LOCAL</span>' : '';
        
        if (subtitleEl) subtitleEl.innerHTML = `${schoolName} • ${countText}${offlineBadge}`;
        if (footerCountEl) footerCountEl.innerHTML = `Total: ${countText}${offlineBadge}`;

        if (tbody) {
            if (classStudents.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="padding: 32px 20px; text-align: center; color: var(--color-text-muted); font-size: var(--text-sm);"><i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 6px; opacity: 0.5;"></i><p style="margin: 0;">Nenhum estudante vinculado a esta turma no momento.</p></td></tr>';
            } else {
                tbody.innerHTML = classStudents.map(function(st) {
                    var studentMatricula = st.matricula || st.codigo_matricula || st.id || '-';
                    var studentEscola = st.escola || schoolName;
                    var studentSerie = st.serie || st.etapa || 'Ensino Fundamental';
                    var neeText = st.nee ? (typeof st.nee === 'string' ? st.nee : JSON.stringify(st.nee)) : (st.necessidades_especiais ? (typeof st.necessidades_especiais === 'string' ? st.necessidades_especiais : JSON.stringify(st.necessidades_especiais)) : null);
                    var neeBadge = neeText ? `<span class="badge badge-warning" style="font-size: 10.5px; font-weight: 700; white-space: nowrap;">${neeText}</span>` : `<span style="color: var(--color-text-muted); font-size: var(--text-xs);">Regular / Sem NEE</span>`;

                    return `
                        <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 50px; transition: background-color 0.15s ease;">
                            <td style="padding: 8px 14px; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 700;">
                                ${studentMatricula}
                            </td>
                            <td style="padding: 8px 14px;">
                                <strong style="color: var(--color-brand-primary); font-size: var(--text-sm); display: block;">${st.nome}</strong>
                                ${st.cpf ? `<span style="font-size: 11px; color: var(--color-text-muted);">CPF: ${st.cpf}</span>` : ''}
                            </td>
                            <td style="padding: 8px 14px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                                ${studentEscola}
                            </td>
                            <td style="padding: 8px 14px; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-primary);">
                                ${studentSerie}
                            </td>
                            <td style="padding: 8px 14px; text-align: center;">
                                ${neeBadge}
                            </td>
                            <td style="padding: 8px 14px; text-align: center;">
                                <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
                                    <button type="button" onclick="openClassStudentDetails('${st.id}', '${st.matricula || ''}');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 10px; height: 28px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 4px; color: var(--color-brand-primary);" title="Visualizar Ficha Cadastral e Dados Gerais">
                                        <i data-lucide="user" style="width: 12px; height: 12px;"></i>
                                        <span>Ver Dados</span>
                                    </button>
                                    <button type="button" onclick="openClassStudentProgression('${st.id}', '${st.matricula || ''}', '${st.nome.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 10px; height: 28px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 4px; color: #10b981; border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05);" title="Visualizar Trajetória & Progressão SAEB">
                                        <i data-lucide="trending-up" style="width: 12px; height: 12px;"></i>
                                        <span>Ver Progressão</span>
                                    </button>
                                </div>
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

    function openClassStudentDetails(studentId, matricula) {
        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : (global.loadedStudents || []);
        var student = allStudents.find(function(s) {
            return (studentId && (String(s.id) === String(studentId) || String(s.matricula) === String(studentId))) ||
                   (matricula && (String(s.matricula) === String(matricula) || String(s.id) === String(matricula)));
        });

        if (!student) {
            student = {
                id: studentId,
                matricula: matricula || studentId,
                nome: 'Estudante',
                escola: 'Rede Municipal',
                etapa: 'Ensino Fundamental'
            };
        }

        if (typeof global.openStudentModal === 'function') {
            global.openStudentModal(student);
        } else if (typeof window.openStudentModal === 'function') {
            window.openStudentModal(student);
        } else if (typeof global.openStudentFullDetails === 'function') {
            global.openStudentFullDetails(studentId || matricula);
        }
    }

    function openClassStudentProgression(studentId, matricula, studentName) {
        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : (global.loadedStudents || []);
        var student = allStudents.find(function(s) {
            return (studentId && (String(s.id) === String(studentId) || String(s.matricula) === String(studentId))) ||
                   (matricula && (String(s.matricula) === String(matricula) || String(s.id) === String(matricula)));
        });

        if (!student) {
            student = {
                id: studentId,
                matricula: matricula || studentId,
                nome: studentName || 'Estudante',
                escola: 'Rede Municipal',
                etapa: 'Ensino Fundamental'
            };
        }

        if (typeof global.openStudentModal === 'function') {
            global.openStudentModal(student);
            if (typeof global.switchStudentModalTab === 'function') {
                global.switchStudentModalTab('progressao');
            }
        } else if (typeof global.openStudentProgressionModal === 'function') {
            global.openStudentProgressionModal(matricula || studentId, studentName);
        } else if (typeof window.openStudentProgression === 'function') {
            window.openStudentProgression(studentId || matricula, studentName);
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
    global.openClassStudentDetails = openClassStudentDetails;
    global.openClassStudentProgression = openClassStudentProgression;

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
