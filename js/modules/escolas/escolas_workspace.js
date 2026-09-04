/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — WORKSPACE DA UNIDADE ESCOLAR
 * Arquivo: js/modules/escolas/escolas_workspace.js
 * Descrição: Visualização detalhada da escola e gestão das abas internas
 *            (Visão Geral, Turmas, Professores, Estudantes).
 * ============================================================================
 */

(function(global) {
    'use strict';

    function escapeAttr(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function sanitizeMojibake(str) {
        if (!str || typeof str !== 'string') return str || '';
        return str
            .replace(/Ãƒ/g, 'Ã')
            .replace(/Ã /g, 'Á')
            .replace(/Ã‰/g, 'É')
            .replace(/Ã /g, 'Í')
            .replace(/Ã“/g, 'Ó')
            .replace(/Ãš/g, 'Ú')
            .replace(/ÃŠ/g, 'Ê')
            .replace(/Ã”/g, 'Ô')
            .replace(/Ã‡/g, 'Ç')
            .replace(/Ã•/g, 'Õ')
            .replace(/Ã£/g, 'ã')
            .replace(/Ã¡/g, 'á')
            .replace(/Ã©/g, 'é')
            .replace(/Ã­/g, 'í')
            .replace(/Ã³/g, 'ó')
            .replace(/Ãº/g, 'ú')
            .replace(/Ãª/g, 'ê')
            .replace(/Ã´/g, 'ô')
            .replace(/Ã§/g, 'ç')
            .replace(/Ãµ/g, 'õ')
            .replace(/\u00c3\u0083/g, 'Ã')
            .replace(/\u00c3\u0081/g, 'Á')
            .replace(/\u00c3\u0089/g, 'É')
            .replace(/\u00c3\u008d/g, 'Í')
            .replace(/\u00c3\u0093/g, 'Ó')
            .replace(/\u00c3\u009a/g, 'Ú')
            .replace(/\u00c3\u008a/g, 'Ê')
            .replace(/\u00c3\u0094/g, 'Ô')
            .replace(/\u00c3\u0087/g, 'Ç')
            .replace(/\u00c3\u0095/g, 'Õ');
    }

    // -------------------------------------------------------------------------
    // 1. VISÃO INTERNA DA ESCOLA (HEADER, BREADCRUMB E SUB-ABAS)
    // -------------------------------------------------------------------------

    function openSchoolDetailView(schoolName, inep, zone, phone, director) {
        if (typeof global.switchTab === 'function') {
            global.switchTab('escolas-panel');
        }

        var schools = typeof global.getOfficialSchoolsState === 'function' ? global.getOfficialSchoolsState() : [];
        var schoolObj = schools.find(function(s) {
            return s.name === schoolName || s.inep === inep || (schoolName && s.name.toLowerCase().includes(schoolName.toLowerCase()));
        }) || {
            name: schoolName || "UI BASILIO ALVES",
            inep: inep || "21128120",
            zone: zone || "Zona Rural",
            phone: phone || "(99) 9935-6218",
            director: director || "Gestão Escolar",
            city: "Gonçalves Dias - MA"
        };

        global.currentSelectedSchoolDetail = schoolObj.name;
        
        var overview = document.getElementById('schools-overview-container');
        var detail = document.getElementById('school-detail-view');
        
        if (overview) {
            overview.classList.add('hidden');
            overview.style.display = 'none';
        }
        
        if (detail) {
            detail.classList.remove('hidden');
            detail.style.display = 'block';
        }
        
        var nameEl = document.getElementById('school-detail-name');
        var badgeEl = document.getElementById('school-detail-badge');
        var metaEl = document.getElementById('school-detail-meta');
        
        if (nameEl) nameEl.textContent = schoolObj.name;
        if (badgeEl) {
            var safeZone = typeof global.escapeHtml === 'function' ? global.escapeHtml(schoolObj.zone || 'Rede Municipal') : (schoolObj.zone || 'Rede Municipal');
            badgeEl.className = 'badge badge-neutral';
            badgeEl.innerHTML = `<span>${safeZone}</span>`;
        }
        if (metaEl) {
            metaEl.innerHTML = `Código INEP: <strong>${schoolObj.inep}</strong> • Direção: <strong>${schoolObj.director || 'Gestão Escolar'}</strong> • Telefone: <strong>${schoolObj.phone || '(99) 9935-6200'}</strong>`;
        }

        // Abre na aba turmas por padrão
        switchSchoolInnerTab('turmas');

        if (typeof global.scrollTo === 'function') {
            global.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function backToSchoolsList() {
        var overview = document.getElementById('schools-overview-container');
        var detail = document.getElementById('school-detail-view');
        
        if (detail) {
            detail.classList.add('hidden');
            detail.style.display = 'none';
        }
        
        if (overview) {
            overview.classList.remove('hidden');
            overview.style.display = 'block';
        }
        
        if (typeof global.renderDbSchools === 'function') {
            global.renderDbSchools();
        }
        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    function enterSchoolClass(classId, className, schoolName) {
        var school = schoolName || global.currentSelectedSchoolDetail || "UI ALDENORA DE ARAÚJO CRUZ";
        global.currentSelectedSchoolDetail = school;
        switchSchoolInnerTab('alunos', className, classId);
    }

    function switchSchoolInnerTab(tabName, targetClassName, targetClassId) {
        var btns = document.querySelectorAll('.school-nav-tab-btn');
        btns.forEach(function(btn) {
            var dt = btn.getAttribute('data-tab');
            if (dt === tabName) {
                btn.classList.add('active');
                btn.style.color = 'var(--color-surface-card)';
                btn.style.backgroundColor = 'var(--color-accent-primary)';
                btn.style.fontWeight = '700';
            } else {
                btn.classList.remove('active');
                btn.style.color = 'var(--color-brand-secondary)';
                btn.style.backgroundColor = 'transparent';
                btn.style.fontWeight = '600';
            }
        });

        var school = global.currentSelectedSchoolDetail || "UI ALDENORA DE ARAÚJO CRUZ";

        if (tabName === 'turmas') {
            renderSchoolClassesTab(school);
        } else if (tabName === 'professores') {
            renderSchoolTeachersTab(school);
        } else if (tabName === 'alunos') {
            renderSchoolStudentsTab(school, targetClassName, targetClassId);
        } else {
            renderSchoolOverviewTab(school);
        }

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    // -------------------------------------------------------------------------
    // 2. ABA TURMAS DA ESCOLA
    // -------------------------------------------------------------------------

    function renderSchoolClassesTab(schoolName) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var allClasses = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState() : [];
        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : [];
        var allTeachers = typeof global.getOfficialTeachersState === 'function' ? global.getOfficialTeachersState() : [];

        function matchSchool(s1, s2) {
            if (!s1 || !s2) return false;
            return s1.trim().toLowerCase() === s2.trim().toLowerCase();
        }

        var schoolClasses = allClasses.filter(function(c) { return matchSchool(c.escola, schoolName); });
        var schoolStudents = allStudents.filter(function(st) { return matchSchool(st.escola, schoolName); });

        container.innerHTML = `
            <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 22px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
                    <div>
                        <h3 style="font-size: var(--text-title-sm); font-weight: 700; color: var(--color-brand-primary); margin: 0;">Turmas da Escola</h3>
                        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin: 2px 0 0 0;">
                            ${schoolClasses.length} turmas cadastradas • Total de ${schoolStudents.length} estudantes vinculados
                        </p>
                    </div>
                    <button type="button" onclick="openCreateClassModal('${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-primary" style="font-size: var(--text-xs); padding: 7px 16px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="plus-circle" style="width: 15px; height: 15px;"></i>
                        <span>Criar Nova Turma</span>
                    </button>
                </div>

                ${schoolClasses.length === 0 ? `
                    <div style="padding: 40px 20px; text-align: center; color: var(--color-text-muted); background: var(--color-surface-subtle); border-radius: var(--radius-card);">
                        <i data-lucide="book-open" style="width: 36px; height: 36px; margin-bottom: 8px; opacity: 0.6;"></i>
                        <p style="margin: 0; font-weight: 600;">Nenhuma turma cadastrada para esta escola.</p>
                        <button type="button" onclick="openCreateClassModal('${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="margin-top: 12px; font-size: var(--text-xs);">
                            Cadastrar Primeira Turma
                        </button>
                    </div>
                ` : `
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
                        ${schoolClasses.map(function(cls) {
                            var classStudents = schoolStudents.filter(function(st) {
                                return st.turmaId === cls.id || st.turma_id === cls.id || (st.turma && cls.nome && st.turma.trim().toLowerCase() === cls.nome.trim().toLowerCase());
                            });
                            var studentCount = classStudents.length;

                            var classTeachers = allTeachers.filter(function(t) {
                                return t.escola === schoolName && Array.isArray(t.turmas) && t.turmas.some(function(tm) {
                                    return tm === cls.nome || tm.includes(cls.serie);
                                });
                            });

                            return `
                                <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 16px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-card); transition: transform 0.15s ease, border-color 0.15s ease;">
                                    <div>
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                                            <div>
                                                <span class="badge badge-neutral" style="font-size: 10px; font-weight: 700; text-transform: uppercase;">
                                                    ${cls.serie || 'Ensino Fundamental'}
                                                </span>
                                                <h4 style="font-size: var(--text-sm); font-weight: 700; color: var(--color-brand-primary); margin: 6px 0 0 0;">
                                                    ${cls.nome}
                                                </h4>
                                            </div>
                                            <span class="badge badge-info" style="font-size: 10px; font-weight: 600;">
                                                ${cls.turno || 'Matutino'}
                                            </span>
                                        </div>

                                        <div style="margin: 14px 0 8px; padding-top: 10px; border-top: 1px solid var(--color-border-subtle); font-size: var(--text-xs); color: var(--color-text-secondary); display: flex; flex-direction: column; gap: 4px;">
                                            <div>Estudantes: <strong style="color: var(--color-brand-primary);">${studentCount} matriculados</strong></div>
                                            <div>Docentes: <strong style="color: var(--color-brand-primary);">${classTeachers.length > 0 ? classTeachers.map(function(t){ return t.nome.split(' ')[0] + ' ' + (t.nome.split(' ')[1] || ''); }).join(', ') : 'Pendente de alocação'}</strong></div>
                                        </div>
                                    </div>

                                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border-subtle); display: flex; justify-content: space-between; align-items: center;">
                                        <button type="button" 
                                                class="btn btn-outline btn-ver-turma" 
                                                data-class-id="${escapeAttr(cls.id)}" 
                                                data-class-name="${escapeAttr(cls.nome)}" 
                                                data-school-name="${escapeAttr(schoolName)}" 
                                                onclick="if (typeof openViewClassStudentsModal === 'function') { openViewClassStudentsModal(this.getAttribute('data-class-id'), this.getAttribute('data-class-name'), this.getAttribute('data-school-name')); } else { enterSchoolClass(this.getAttribute('data-class-id'), this.getAttribute('data-class-name'), this.getAttribute('data-school-name')); }" 
                                                style="font-size: var(--text-xs); padding: 5px 12px; height: 30px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 5px; font-weight: 600; cursor: pointer;" 
                                                title="Entrar na Turma e Ver Alunos">
                                            <i data-lucide="users" style="width: 13px; height: 13px;"></i>
                                            <span>Ver Turma (${studentCount})</span>
                                        </button>
                                        <button type="button" 
                                                class="btn-icon btn-add-aluno-turma" 
                                                data-class-id="${escapeAttr(cls.id)}" 
                                                data-class-name="${escapeAttr(cls.nome)}" 
                                                data-school-name="${escapeAttr(schoolName)}" 
                                                onclick="if (typeof openAddStudentToClassModal === 'function') { openAddStudentToClassModal(this.getAttribute('data-class-id'), this.getAttribute('data-class-name'), this.getAttribute('data-school-name')); } else if (typeof openCreateStudentModal === 'function') { openCreateStudentModal(this.getAttribute('data-school-name')); }" 
                                                style="background: none; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-pill); width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-accent-primary);" 
                                                title="Adicionar Aluno nesta Turma">
                                            <i data-lucide="user-plus" style="width: 14px; height: 14px;"></i>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // 3. ABA PROFESSORES DA ESCOLA
    // -------------------------------------------------------------------------

    function renderSchoolTeachersTab(schoolName) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var allTeachers = typeof global.getOfficialTeachersState === 'function' ? global.getOfficialTeachersState() : [];
        var schoolTeachers = allTeachers.filter(function(t) { return t.escola === schoolName; });

        container.innerHTML = `
            <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 22px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
                    <div>
                        <h3 style="font-size: var(--text-title-sm); font-weight: 700; color: var(--color-brand-primary); margin: 0;">Corpo Docente da Escola</h3>
                        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin: 2px 0 0 0;">
                            ${schoolTeachers.length} professores vinculados a ${schoolName}
                        </p>
                    </div>
                    <button type="button" onclick="openCreateTeacherModal('${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-primary" style="font-size: var(--text-xs); padding: 7px 16px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px;">
                        <i data-lucide="user-plus" style="width: 15px; height: 15px;"></i>
                        <span>Vincular Novo Professor</span>
                    </button>
                </div>

                ${schoolTeachers.length === 0 ? `
                    <div style="padding: 40px 20px; text-align: center; color: var(--color-text-muted); background: var(--color-surface-subtle); border-radius: var(--radius-card);">
                        <i data-lucide="graduation-cap" style="width: 36px; height: 36px; margin-bottom: 8px; opacity: 0.6;"></i>
                        <p style="margin: 0; font-weight: 600;">Nenhum professor cadastrado para esta escola.</p>
                        <button type="button" onclick="openCreateTeacherModal('${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="margin-top: 12px; font-size: var(--text-xs);">
                            Vincular Primeiro Professor
                        </button>
                    </div>
                ` : `
                    <div class="table-responsive" style="overflow-x: auto; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card);">
                        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: var(--text-body);">
                            <thead style="background: var(--color-brand-secondary); color: #FFFFFF; font-size: var(--text-xs); text-transform: uppercase;">
                                <tr>
                                    <th style="padding: 12px 16px;">Docente / E-mail</th>
                                    <th style="padding: 12px 16px;">Componente Curricular</th>
                                    <th style="padding: 12px 16px;">Turmas Atribuídas</th>
                                    <th style="padding: 12px 16px; text-align: center;">Status</th>
                                    <th style="padding: 12px 16px; text-align: center;">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${schoolTeachers.map(function(t) {
                                    var turmasPills = Array.isArray(t.turmas) && t.turmas.length > 0 ? t.turmas.map(function(tm) {
                                        return `<span class="badge badge-info" style="font-size: 10.5px; margin: 2px;">${tm}</span>`;
                                    }).join(' ') : '<span style="color: var(--color-text-muted); font-size: var(--text-xs);">Sem turma atribuída</span>';

                                    return `
                                        <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 56px;">
                                            <td style="padding: 10px 16px;">
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    <div style="width: 32px; height: 32px; border-radius: var(--radius-full); background: var(--color-accent-soft); color: var(--color-accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px;">
                                                        ${t.nome.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <strong style="color: var(--color-brand-primary); font-size: var(--text-sm); display: block;">${t.nome}</strong>
                                                        <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">${t.email || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style="padding: 10px 16px; font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary);">
                                                ${t.disciplina || 'Polivalente'}
                                            </td>
                                            <td style="padding: 10px 16px;">
                                                ${turmasPills}
                                            </td>
                                            <td style="padding: 10px 16px; text-align: center;">
                                                <span class="badge badge-status-success" style="font-size: 10px; font-weight: 700;">● ATIVO</span>
                                            </td>
                                            <td style="padding: 10px 16px; text-align: center;">
                                                <button type="button" onclick="openAssignTeacherModal('${t.id}', '${t.nome.replace(/'/g, "\\\'")}', '${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 10px; height: 28px; border-radius: var(--radius-pill);">
                                                    Gerenciar Turmas
                                                </button>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // 4. ABA ALUNOS DA ESCOLA
    // -------------------------------------------------------------------------

    function renderSchoolStudentsTab(schoolName, targetClassName, targetClassId) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        function matchSchool(s1, s2) {
            if (!s1 || !s2) return false;
            return s1.trim().toLowerCase() === s2.trim().toLowerCase();
        }
        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : [];
        var schoolStudents = allStudents.filter(function(st) { return matchSchool(st.escola, schoolName); });
        var schoolClasses = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState().filter(function(c) { return matchSchool(c.escola, schoolName); }) : [];

        var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        var canViewSensitive = userRole === 'Master Admin' || userRole === 'Gestor da Rede' || userRole === 'Diretor Escola' || userRole === 'Admin';

        var hasTargetClass = Boolean(targetClassName && targetClassName !== 'all');
        var activeClassStudents = hasTargetClass ? schoolStudents.filter(function(st) {
            return (targetClassId && (st.turmaId === targetClassId || st.turma_id === targetClassId)) ||
                   (st.turma === targetClassName || (st.turma && targetClassName && st.turma.trim().toLowerCase() === targetClassName.trim().toLowerCase()));
        }) : schoolStudents;

        container.innerHTML = `
            <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 22px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <h3 style="font-size: var(--text-title-sm); font-weight: 700; color: var(--color-brand-primary); margin: 0;">
                                ${hasTargetClass ? `Estudantes da Turma: ${escapeAttr(targetClassName)}` : 'Estudantes Matriculados'}
                            </h3>
                            ${hasTargetClass ? `<span class="badge badge-info" style="font-size: 11px; font-weight: 700;">● FILTRADO POR TURMA</span>` : ''}
                        </div>
                        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin: 2px 0 0 0;">
                            ${hasTargetClass ? `${activeClassStudents.length} alunos vinculados a esta turma em ${escapeAttr(schoolName)}` : `${schoolStudents.length} alunos cadastrados em ${escapeAttr(schoolName)}`}
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${hasTargetClass ? `
                            <button type="button" onclick="switchSchoolInnerTab('turmas');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 7px 14px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px;">
                                <i data-lucide="arrow-left" style="width: 14px; height: 14px;"></i>
                                <span>Voltar para Turmas</span>
                            </button>
                        ` : ''}
                        <button type="button" onclick="openCreateStudentModal('${escapeAttr(schoolName)}');" class="btn btn-primary" style="font-size: var(--text-xs); padding: 7px 16px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px;">
                            <i data-lucide="user-plus" style="width: 15px; height: 15px;"></i>
                            <span>Cadastrar Novo Aluno</span>
                        </button>
                    </div>
                </div>

                <!-- Barra de Busca e Filtro de Turma -->
                <div style="display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 240px; position: relative;">
                        <input type="text" id="school-students-search-input" oninput="filterSchoolStudentsTable('${escapeAttr(schoolName)}');" placeholder="Buscar por nome ou matrícula do aluno..." style="width: 100%; padding: 8px 12px 8px 34px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); font-size: var(--text-xs); outline: none;">
                        <i data-lucide="search" style="width: 14px; height: 14px; position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);"></i>
                    </div>
                    <select id="school-students-class-filter" onchange="filterSchoolStudentsTable('${escapeAttr(schoolName)}');" style="padding: 8px 12px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); font-size: var(--text-xs); background: var(--color-surface-card); font-weight: 600;">
                        <option value="all">Todas as Turmas (${schoolClasses.length})</option>
                        <option value="sem_turma">● Apenas Sem Turma</option>
                        ${schoolClasses.map(function(c) {
                            var isSelected = (hasTargetClass && (c.nome === targetClassName || c.id === targetClassId || c.id === targetClassName || (c.nome && targetClassName && c.nome.trim().toLowerCase() === targetClassName.trim().toLowerCase()))) ? 'selected' : '';
                            return `<option value="${escapeAttr(c.nome)}" ${isSelected}>${escapeAttr(c.nome)}</option>`;
                        }).join('')}
                    </select>
                </div>

                <div class="table-responsive" style="overflow-x: auto; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); max-height: 520px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: var(--text-body);">
                        <thead style="background: var(--color-brand-secondary); color: #FFFFFF; font-size: var(--text-xs); text-transform: uppercase; position: sticky; top: 0; z-index: 2;">
                            <tr>
                                <th style="padding: 12px 16px;">Matrícula</th>
                                <th style="padding: 12px 16px;">Estudante</th>
                                <th style="padding: 12px 16px;">Nascimento</th>
                                <th style="padding: 12px 16px;">Turma Vinculada</th>
                                ${canViewSensitive ? `<th style="padding: 12px 16px;">CPF / RG (LGPD)</th>` : ''}
                                <th style="padding: 12px 16px; text-align: center; min-width: 250px;">Ações Pedagógicas</th>
                            </tr>
                        </thead>
                        <tbody id="school-students-tbody">
                            <!-- Preenchido via filterSchoolStudentsTable() -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        filterSchoolStudentsTable(schoolName);
    }

    function filterSchoolStudentsTable(schoolName) {
        var tbody = document.getElementById('school-students-tbody');
        if (!tbody) return;

        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : [];
        var schoolStudents = allStudents.filter(function(st) {
            return st.escola && schoolName && st.escola.trim().toLowerCase() === schoolName.trim().toLowerCase();
        });

        var searchInput = document.getElementById('school-students-search-input');
        var query = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        var filterSelect = document.getElementById('school-students-class-filter');
        var selectedClass = filterSelect ? filterSelect.value : 'all';

        var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        var canViewSensitive = userRole === 'Master Admin' || userRole === 'Gestor da Rede' || userRole === 'Diretor Escola' || userRole === 'Admin';

        var filtered = schoolStudents.filter(function(st) {
            var matchQuery = (st.nome || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query) ||
                             (st.matricula || '').toLowerCase().includes(query);
            
            var matchClass = true;
            if (selectedClass === 'sem_turma') {
                matchClass = !st.turma || st.turma === 'Sem turma';
            } else if (selectedClass !== 'all') {
                matchClass = st.turma === selectedClass || st.turmaId === selectedClass || st.turma_id === selectedClass ||
                             (st.turma && selectedClass && st.turma.trim().toLowerCase() === selectedClass.trim().toLowerCase());
            }
            return matchQuery && matchClass;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="padding: 30px; text-align: center; color: var(--color-text-muted);">Nenhum estudante encontrado para os filtros selecionados.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(st) {
            var hasTurma = st.turma && st.turma !== 'Sem turma';
            var turmaBadge = hasTurma ? 
                `<span class="badge badge-info" style="font-size: 11px;">${st.turma}</span>` : 
                `<span class="badge badge-status-warning" style="font-size: 10px; font-weight: 700;">● SEM TURMA</span>`;

            var maskedCpf = st.cpf ? (canViewSensitive ? st.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : '***.***.***-**') : '-';

            return `
                <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 50px;">
                    <td style="padding: 8px 16px; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 600;">
                        ${st.matricula || '-'}
                    </td>
                    <td style="padding: 8px 16px;">
                        <strong style="color: var(--color-brand-primary); font-size: var(--text-sm);">${sanitizeMojibake(st.nome)}</strong>
                    </td>
                    <td style="padding: 8px 16px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                        ${st.nascimento || st.dataNascimento || '-'}
                    </td>
                    <td style="padding: 8px 16px;">
                        ${turmaBadge}
                    </td>
                    ${canViewSensitive ? `
                        <td style="padding: 8px 16px; font-family: var(--font-mono); font-size: 11px; color: var(--color-text-muted);">
                            ${maskedCpf}
                        </td>
                    ` : ''}
                    <td style="padding: 8px 16px; text-align: center;">
                        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap;">
                            <button type="button" onclick="openClassStudentDetails('${st.id}', '${st.matricula || ''}');" class="btn btn-outline" style="font-size: 11px; padding: 4px 10px; height: 28px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 4px; color: var(--color-brand-primary);" title="Visualizar Ficha Cadastral e Dados Gerais">
                                <i data-lucide="user" style="width: 12px; height: 12px;"></i>
                                <span>Ver Dados</span>
                            </button>
                            <button type="button" onclick="openClassStudentProgression('${st.id}', '${st.matricula || ''}', '${st.nome.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="font-size: 11px; padding: 4px 10px; height: 28px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 4px; color: #10b981; border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05);" title="Visualizar Trajetória e Progressão SAEB">
                                <i data-lucide="trending-up" style="width: 12px; height: 12px;"></i>
                                <span>Ver Progressão</span>
                            </button>
                            <button type="button" onclick="openChangeStudentClassModal('${st.id}', '${st.nome.replace(/'/g, "\\\'")}', '${schoolName.replace(/'/g, "\\\'")}');" class="btn-icon" style="background: none; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-pill); width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary);" title="${hasTurma ? 'Alterar Turma' : 'Vincular Turma'}">
                                <i data-lucide="shuffle" style="width: 12px; height: 12px;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    // -------------------------------------------------------------------------
    // 5. ABA VISÃO GERAL DA ESCOLA
    // -------------------------------------------------------------------------

    function renderSchoolOverviewTab(schoolName) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState().filter(function(st) { return st.escola === schoolName; }) : [];
        var allClasses = typeof global.getOfficialClassesState === 'function' ? global.getOfficialClassesState().filter(function(c) { return c.escola === schoolName; }) : [];
        var allTeachers = typeof global.getOfficialTeachersState === 'function' ? global.getOfficialTeachersState().filter(function(t) { return t.escola === schoolName; }) : [];

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <!-- 3 Cards de Resumo da Escola -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px;">
                    <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 18px; display: flex; align-items: center; gap: 14px;">
                        <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--color-accent-soft); color: var(--color-accent-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i data-lucide="book-open" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <div style="font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 700; text-transform: uppercase;">TURMAS ATIVAS</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-brand-primary);">${allClasses.length}</div>
                        </div>
                    </div>

                    <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 18px; display: flex; align-items: center; gap: 14px;">
                        <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--color-status-success-bg); color: var(--color-status-success); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i data-lucide="users" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <div style="font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 700; text-transform: uppercase;">ESTUDANTES</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-brand-primary);">${allStudents.length}</div>
                        </div>
                    </div>

                    <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 18px; display: flex; align-items: center; gap: 14px;">
                        <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--color-status-advanced-bg); color: var(--color-status-advanced); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <i data-lucide="graduation-cap" style="width: 22px; height: 22px;"></i>
                        </div>
                        <div>
                            <div style="font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 700; text-transform: uppercase;">DOCENTES</div>
                            <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-brand-primary);">${allTeachers.length}</div>
                        </div>
                    </div>
                </div>

                <!-- Ações Rápidas -->
                <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 20px;">
                    <h3 style="font-size: var(--text-title-sm); font-weight: 700; color: var(--color-brand-primary); margin: 0 0 14px 0;">Gestão Rápida da Unidade</h3>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <button type="button" onclick="switchSchoolInnerTab('turmas');" class="btn btn-primary" style="font-size: var(--text-xs); padding: 8px 16px; border-radius: var(--radius-pill);">
                            Gerenciar Turmas (${allClasses.length})
                        </button>
                        <button type="button" onclick="switchSchoolInnerTab('professores');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 8px 16px; border-radius: var(--radius-pill);">
                            Ver Professores (${allTeachers.length})
                        </button>
                        <button type="button" onclick="switchSchoolInnerTab('alunos');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 8px 16px; border-radius: var(--radius-pill);">
                            Ver Lista de Alunos (${allStudents.length})
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Exposição no Escopo Global
    global.openSchoolDetailView = openSchoolDetailView;
    global.openSchoolWorkspace = openSchoolDetailView;
    global.backToSchoolsList = backToSchoolsList;
    global.switchSchoolInnerTab = switchSchoolInnerTab;

    global.renderSchoolClassesTab = renderSchoolClassesTab;
    global.renderSchoolTeachersTab = renderSchoolTeachersTab;
    global.renderSchoolStudentsTab = renderSchoolStudentsTab;
    global.renderSchoolOverviewTab = renderSchoolOverviewTab;
    global.filterSchoolStudentsTable = filterSchoolStudentsTable;
    global.enterSchoolClass = enterSchoolClass;

    if (typeof window !== 'undefined') {
        window.enterSchoolClass = enterSchoolClass;
    }

})(typeof window !== 'undefined' ? window : this);


