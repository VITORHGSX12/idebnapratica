// =========================================================================
// ESCOLAS DA REDE & GESTÃO INTERNA DA ESCOLA (TURMAS, DOCENTES E ALUNOS)
// Consome Design System Institucional SEMED e Base Oficial Importada
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY_OFFICIAL_SCHOOLS = 'gd_official_schools_data';
    var STORAGE_KEY_OFFICIAL_STUDENTS = 'gd_official_students_data';
    var STORAGE_KEY_OFFICIAL_CLASSES = 'gd_official_classes_data';
    var STORAGE_KEY_OFFICIAL_TEACHERS = 'gd_official_teachers_data';

    // -------------------------------------------------------------------------
    // 1. GESTÃO DE ESTADO CENTRALIZADO (ESCOLAS, TURMAS, PROFESSORES, ALUNOS)
    // -------------------------------------------------------------------------

    function getSeedData() {
        if (typeof global.OFFICIAL_IMPORTED_STUDENTS_SEED !== 'undefined' && global.OFFICIAL_IMPORTED_STUDENTS_SEED) {
            return global.OFFICIAL_IMPORTED_STUDENTS_SEED;
        }
        return { escolas: [], turmas: [], professores: [], alunos: [] };
    }

    function getOfficialSchoolsState() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY_OFFICIAL_SCHOOLS);
            if (saved) {
                var parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}

        var seed = getSeedData();
        if (seed.escolas && seed.escolas.length > 0) {
            saveOfficialSchoolsState(seed.escolas);
            return seed.escolas;
        }
        return [];
    }

    function saveOfficialSchoolsState(schools) {
        try {
            var toSave = schools || getOfficialSchoolsState();
            localStorage.setItem(STORAGE_KEY_OFFICIAL_SCHOOLS, JSON.stringify(toSave));
        } catch(e) {}
    }

    function getOfficialStudentsState() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY_OFFICIAL_STUDENTS);
            if (saved) {
                var parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}

        var seed = getSeedData();
        if (seed.alunos && seed.alunos.length > 0) {
            saveOfficialStudentsState(seed.alunos);
            return seed.alunos;
        }
        return [];
    }

    function saveOfficialStudentsState(students) {
        try {
            var toSave = students || getOfficialStudentsState();
            localStorage.setItem(STORAGE_KEY_OFFICIAL_STUDENTS, JSON.stringify(toSave));
        } catch(e) {}
    }

    function getOfficialClassesState() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY_OFFICIAL_CLASSES);
            if (saved) {
                var parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}

        var seed = getSeedData();
        if (seed.turmas && seed.turmas.length > 0) {
            saveOfficialClassesState(seed.turmas);
            return seed.turmas;
        }
        return [];
    }

    function saveOfficialClassesState(classes) {
        try {
            var toSave = classes || getOfficialClassesState();
            localStorage.setItem(STORAGE_KEY_OFFICIAL_CLASSES, JSON.stringify(toSave));
        } catch(e) {}
    }

    function getOfficialTeachersState() {
        try {
            var saved = localStorage.getItem(STORAGE_KEY_OFFICIAL_TEACHERS);
            if (saved) {
                var parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}

        var seed = getSeedData();
        if (seed.professores && seed.professores.length > 0) {
            saveOfficialTeachersState(seed.professores);
            return seed.professores;
        }
        return [];
    }

    function saveOfficialTeachersState(teachers) {
        try {
            var toSave = teachers || getOfficialTeachersState();
            localStorage.setItem(STORAGE_KEY_OFFICIAL_TEACHERS, JSON.stringify(toSave));
        } catch(e) {}
    }

    // -------------------------------------------------------------------------
    // 2. RENDERIZAÇÃO DA LISTAGEM GERAL DE ESCOLAS
    // -------------------------------------------------------------------------

    function renderDbSchools() {
        var tbody = document.getElementById('db-schools-table-body');
        if (!tbody) return;

        var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        var userEscola = sessionStorage.getItem('userEscola') || '';
        var isDirector = userRole === 'Diretor Escola';
        var isTeacher = userRole === 'Professor' || userRole === 'Professor AEE';
        var isAdminOrSemed = userRole === 'Master Admin' || userRole === 'Gestor da Rede' || userRole === 'Admin';

        var schools = getOfficialSchoolsState();
        var allStudents = getOfficialStudentsState();
        var allClasses = getOfficialClassesState();

        // Filtro de escopo por papel
        if ((isDirector || isTeacher) && userEscola) {
            schools = schools.filter(function(s) {
                return s.name.toUpperCase().includes(userEscola.toUpperCase()) || 
                       userEscola.toUpperCase().includes(s.name.toUpperCase());
            });
        }

        var searchInput = document.getElementById('db-school-search');
        var query = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        var filtered = schools.filter(function(s) {
            var normName = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normName.includes(query) || (s.inep && s.inep.includes(query));
        });

        // Atualizar Contadores de KPI
        var kpiTotal = document.getElementById('kpi-total-schools');
        var kpiStudents = document.getElementById('kpi-total-students-val');
        if (kpiTotal) {
            kpiTotal.textContent = (isDirector || isTeacher) ? ('1 Unidade (' + (userEscola || 'Vinculada') + ')') : (schools.length + ' Unidades');
        }
        if (kpiStudents) {
            var totalAlunos = allStudents.length > 0 ? allStudents.length : schools.reduce(function(sum, s) { return sum + (s.alunosCount || 0); }, 0);
            kpiStudents.textContent = totalAlunos.toLocaleString('pt-BR') + ' Estudantes';
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 36px; text-align: center; color: var(--color-text-muted);">Nenhuma escola encontrada com este termo de busca.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(sch) {
            var schoolStudentsCount = allStudents.filter(function(st) { return st.escola === sch.name; }).length || sch.alunosCount || 0;
            var schoolClassesCount = allClasses.filter(function(c) { return c.escola === sch.name; }).length || sch.turmasCount || 0;

            var isUrban = sch.zone && sch.zone.includes('Urbana');
            var statusLabel = sch.status || 'Ativa';
            var isAtiva = statusLabel === 'Ativa';
            var badgeClass = isAtiva ? 'badge-status-success' : 'badge-status-warning';

            var safeName = typeof escapeHtml === 'function' ? escapeHtml(sch.name) : sch.name;
            var safeInep = typeof escapeHtml === 'function' ? escapeHtml(sch.inep) : sch.inep;
            var safeCity = typeof escapeHtml === 'function' ? escapeHtml(sch.city || 'Gonçalves Dias - MA') : (sch.city || 'Gonçalves Dias - MA');
            var safeZone = typeof escapeHtml === 'function' ? escapeHtml(sch.zone || 'Zona Rural') : (sch.zone || 'Zona Rural');
            var safeStatusLabel = typeof escapeHtml === 'function' ? escapeHtml(statusLabel) : statusLabel;

            return `
                <tr style="border-bottom: 1px solid var(--color-border-subtle); height: 60px; transition: background-color 0.15s ease;">
                    <td style="padding: 12px 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 38px; height: 38px; border-radius: var(--radius-card); background: var(--color-accent-soft); color: var(--color-accent-primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--color-accent-soft-border);">
                                <i data-lucide="school" style="width: 18px; height: 18px;"></i>
                            </div>
                            <div>
                                <strong style="font-size: var(--text-sm); font-weight: 700; color: var(--color-brand-primary); display: block; line-height: 1.3;">${safeName}</strong>
                                <span style="font-size: var(--text-xs); color: var(--color-text-secondary); margin-top: 2px; display: block;">
                                    ${safeCity} • <strong style="color: var(--color-brand-primary);">${schoolStudentsCount}</strong> estudantes • <strong style="color: var(--color-brand-primary);">${schoolClassesCount}</strong> turmas
                                </span>
                            </div>
                        </div>
                    </td>

                    <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: var(--text-xs); color: var(--color-text-secondary); font-weight: 600;">
                        ${safeInep}
                    </td>

                    <td style="padding: 12px 16px;">
                        <span class="badge badge-neutral" style="font-size: var(--text-xs); font-weight: 600;">
                            ${safeZone}
                        </span>
                    </td>

                    <td style="padding: 12px 16px; text-align: center;">
                        <span class="badge ${badgeClass}" style="font-size: var(--text-xs); font-weight: 700;">
                            ● ${safeStatusLabel.toUpperCase()}
                        </span>
                    </td>

                    <td style="padding: 12px 20px; text-align: center;">
                        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                            <button type="button" onclick="openSchoolDetailView('${sch.name.replace(/'/g, "\\\'")}');" class="btn btn-primary" style="font-size: var(--text-xs); padding: 5px 12px; height: 32px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px;">
                                <span>Ver Escola</span>
                                <i data-lucide="arrow-right" style="width: 13px; height: 13px;"></i>
                            </button>
                            
                            ${isAdminOrSemed ? `
                                <button type="button" onclick="openEditSchoolModal('${safeInep}');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 5px 8px; height: 32px; border-radius: var(--radius-pill);" title="Editar Dados da Escola (Admin/SEMED)">
                                    <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
                                </button>
                            ` : ''}
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
    // 3. VISÃO INTERNA DA ESCOLA (HEADER, BREADCRUMB E SUB-ABAS)
    // -------------------------------------------------------------------------

    function openSchoolDetailView(schoolName, inep, zone, phone, director) {
        if (typeof global.switchTab === 'function') {
            global.switchTab('escolas-panel');
        }

        var schools = getOfficialSchoolsState();
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
            var safeZone = typeof escapeHtml === 'function' ? escapeHtml(schoolObj.zone || 'Rede Municipal') : (schoolObj.zone || 'Rede Municipal');
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
        
        renderDbSchools();
        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    function switchSchoolInnerTab(tabName) {
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
            renderSchoolStudentsTab(school);
        } else {
            renderSchoolOverviewTab(school);
        }

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    // -------------------------------------------------------------------------
    // 4. ABA TURMAS DA ESCOLA (CRIAÇÃO, LISTAGEM E MODAL VER TURMA)
    // -------------------------------------------------------------------------

    function renderSchoolClassesTab(schoolName) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var allClasses = getOfficialClassesState();
        var allStudents = getOfficialStudentsState();
        var allTeachers = getOfficialTeachersState();

        var schoolClasses = allClasses.filter(function(c) { return c.escola === schoolName; });
        var schoolStudents = allStudents.filter(function(st) { return st.escola === schoolName; });

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
                                return st.turmaId === cls.id || st.turma === cls.nome;
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
                                        <button type="button" onclick="openViewClassStudentsModal('${cls.id}', '${cls.nome.replace(/'/g, "\\\'")}', '${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 5px 12px; height: 30px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 5px;">
                                            <i data-lucide="users" style="width: 13px; height: 13px;"></i>
                                            <span>Ver Turma (${studentCount})</span>
                                        </button>
                                        <button type="button" onclick="openAddStudentToClassModal('${cls.id}', '${cls.nome.replace(/'/g, "\\\'")}', '${schoolName.replace(/'/g, "\\\'")}');" class="btn-icon" style="background: none; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-pill); width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-accent-primary);" title="Adicionar Aluno nesta Turma">
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
    // 5. ABA PROFESSORES DA ESCOLA (CADASTRO E VINCULAÇÃO DE TURMAS)
    // -------------------------------------------------------------------------

    function renderSchoolTeachersTab(schoolName) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var allTeachers = getOfficialTeachersState();
        var schoolTeachers = allTeachers.filter(function(t) { return t.escola === schoolName; });
        var schoolClasses = getOfficialClassesState().filter(function(c) { return c.escola === schoolName; });

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
    // 6. ABA ALUNOS DA ESCOLA (LISTA GERAL, BUSCA E TROCA DE TURMA)
    // -------------------------------------------------------------------------

    function renderSchoolStudentsTab(schoolName) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var allStudents = getOfficialStudentsState();
        var schoolStudents = allStudents.filter(function(st) { return st.escola === schoolName; });
        var schoolClasses = getOfficialClassesState().filter(function(c) { return c.escola === schoolName; });

        var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        var canViewSensitive = userRole === 'Master Admin' || userRole === 'Gestor da Rede' || userRole === 'Diretor Escola' || userRole === 'Admin';

        container.innerHTML = `
            <div class="card" style="background: var(--color-surface-card); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); padding: 22px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
                    <div>
                        <h3 style="font-size: var(--text-title-sm); font-weight: 700; color: var(--color-brand-primary); margin: 0;">Estudantes Matriculados</h3>
                        <p style="font-size: var(--text-xs); color: var(--color-text-secondary); margin: 2px 0 0 0;">
                            ${schoolStudents.length} alunos cadastrados em ${schoolName}
                        </p>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button type="button" onclick="openCreateStudentModal('${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-primary" style="font-size: var(--text-xs); padding: 7px 16px; border-radius: var(--radius-pill); display: inline-flex; align-items: center; gap: 6px;">
                            <i data-lucide="user-plus" style="width: 15px; height: 15px;"></i>
                            <span>Cadastrar Novo Aluno</span>
                        </button>
                    </div>
                </div>

                <!-- Barra de Busca e Filtro de Turma -->
                <div style="display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 240px; position: relative;">
                        <input type="text" id="school-students-search-input" oninput="filterSchoolStudentsTable('${schoolName.replace(/'/g, "\\\'")}');" placeholder="Buscar por nome ou matrícula do aluno..." style="width: 100%; padding: 8px 12px 8px 34px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); font-size: var(--text-xs); outline: none;">
                        <i data-lucide="search" style="width: 14px; height: 14px; position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted);"></i>
                    </div>
                    <select id="school-students-class-filter" onchange="filterSchoolStudentsTable('${schoolName.replace(/'/g, "\\\'")}');" style="padding: 8px 12px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-card); font-size: var(--text-xs); background: var(--color-surface-card); font-weight: 600;">
                        <option value="all">Todas as Turmas (${schoolClasses.length})</option>
                        <option value="sem_turma">● Apenas Sem Turma</option>
                        ${schoolClasses.map(function(c) {
                            return `<option value="${c.nome}">${c.nome}</option>`;
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
                                <th style="padding: 12px 16px; text-align: center;">Ações</th>
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

        var allStudents = getOfficialStudentsState();
        var schoolStudents = allStudents.filter(function(st) { return st.escola === schoolName; });
        var schoolClasses = getOfficialClassesState().filter(function(c) { return c.escola === schoolName; });

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
                matchClass = st.turma === selectedClass;
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
                        <strong style="color: var(--color-brand-primary); font-size: var(--text-sm);">${st.nome}</strong>
                    </td>
                    <td style="padding: 8px 16px; font-size: var(--text-xs); color: var(--color-text-secondary);">
                        ${st.dataNascimento || '-'}
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
                        <button type="button" onclick="openChangeStudentClassModal('${st.id}', '${st.nome.replace(/'/g, "\\\'")}', '${schoolName.replace(/'/g, "\\\'")}');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 8px; height: 26px; border-radius: var(--radius-pill);" title="Alterar Turma">
                            ${hasTurma ? 'Mudar Turma' : 'Vincular Turma'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide && typeof lucide.createIcons === 'function') {
            try { lucide.createIcons(); } catch(e) {}
        }
    }

    // -------------------------------------------------------------------------
    // 7. ABA VISÃO GERAL DA ESCOLA
    // -------------------------------------------------------------------------

    function renderSchoolOverviewTab(schoolName) {
        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var allStudents = getOfficialStudentsState().filter(function(st) { return st.escola === schoolName; });
        var allClasses = getOfficialClassesState().filter(function(c) { return c.escola === schoolName; });
        var allTeachers = getOfficialTeachersState().filter(function(t) { return t.escola === schoolName; });

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

    // -------------------------------------------------------------------------
    // 8. MODAIS INSTITUCIONAIS: CRIAR TURMA, VER ALUNOS DA TURMA, DOCENTE E ALUNO
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

    function handleSaveCreateClass(event) {
        if (event) event.preventDefault();

        var schoolName = document.getElementById('create-class-school-name').value;
        var className = document.getElementById('create-class-name').value.trim();
        var classStage = document.getElementById('create-class-stage').value;
        var classShift = document.getElementById('create-class-shift').value;

        if (!className) {
            alert('Por favor, informe a identificação da turma.');
            return;
        }

        var allClasses = getOfficialClassesState();
        var newClass = {
            id: 'turma_' + Date.now(),
            escola: schoolName,
            nome: className,
            serie: classStage,
            turno: classShift,
            alunosCount: 0
        };

        allClasses.push(newClass);
        saveOfficialClassesState(allClasses);

        // Sincronização em nuvem em segundo plano
        if (typeof global.enqueueSyncAction === 'function') {
            global.enqueueSyncAction('turma', 'CREATE', newClass);
        }

        closeCreateClassModal();
        renderSchoolClassesTab(schoolName);

        if (typeof global.showToast === 'function') {
            global.showToast('Turma "' + className + '" criada com sucesso!', 'check');
        }
    }

    function openViewClassStudentsModal(classId, className, schoolName) {
        var modal = document.getElementById('modal-view-class-students');
        if (!modal) return;

        var titleEl = document.getElementById('view-class-title');
        var subtitleEl = document.getElementById('view-class-subtitle');
        var tbody = document.getElementById('view-class-students-tbody');

        var allStudents = getOfficialStudentsState();
        var classStudents = allStudents.filter(function(st) {
            return st.escola === schoolName && (st.turmaId === classId || st.turma === className);
        });

        if (titleEl) titleEl.textContent = className;
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
                                ${st.dataNascimento || '-'}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeViewClassStudentsModal() {
        var modal = document.getElementById('modal-view-class-students');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function openCreateTeacherModal(schoolName) {
        var modal = document.getElementById('modal-create-teacher');
        if (!modal) return;

        var scEl = document.getElementById('create-teacher-school-name');
        if (scEl) scEl.value = schoolName;

        var selectTurmas = document.getElementById('create-teacher-turmas');
        if (selectTurmas) {
            var classes = getOfficialClassesState().filter(function(c) { return c.escola === schoolName; });
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

        saveOfficialTeachersState(allTeachers);

        // Sincronização em nuvem em segundo plano
        if (typeof global.enqueueSyncAction === 'function') {
            global.enqueueSyncAction('professor', 'CREATE', newTeacher);
        }

        closeCreateTeacherModal();
        renderSchoolTeachersTab(schoolName);

        if (typeof global.showToast === 'function') {
            global.showToast('Professor "' + name + '" vinculado com sucesso!', 'check');
        }
    }

    function openCreateStudentModal(schoolName) {
        var modal = document.getElementById('modal-create-student');
        if (!modal) return;

        var targetSchool = schoolName || global.currentSelectedSchoolDetail || 'UI ALDENORA DE ARAÚJO CRUZ';
        var scEl = document.getElementById('create-student-school');
        if (scEl) scEl.value = targetSchool;

        var selectTurma = document.getElementById('create-student-turma');
        if (selectTurma) {
            var classes = getOfficialClassesState().filter(function(c) { return c.escola === targetSchool; });
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

        var allStudents = getOfficialStudentsState();
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
        saveOfficialStudentsState(allStudents);

        // Sincronização em nuvem em segundo plano
        if (typeof global.enqueueSyncAction === 'function') {
            global.enqueueSyncAction('aluno', 'CREATE', newStudent);
        }

        closeCreateStudentModal();
        renderSchoolStudentsTab(schoolName);

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
            var classes = getOfficialClassesState().filter(function(c) { return c.escola === schoolName; });
            var student = getOfficialStudentsState().find(function(s) { return s.id === studentId; });
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

        var allStudents = getOfficialStudentsState();
        var index = allStudents.findIndex(function(s) { return s.id === studentId; });

        if (index !== -1) {
            allStudents[index].turma = newTurma || 'Sem turma';
            saveOfficialStudentsState(allStudents);

            // Sincronização em nuvem em segundo plano
            if (typeof global.enqueueSyncAction === 'function') {
                global.enqueueSyncAction('aluno', 'UPDATE', { id: studentId, turma: newTurma, escola: schoolName });
            }
        }

        closeChangeStudentClassModal();
        renderSchoolStudentsTab(schoolName);

        if (typeof global.showToast === 'function') {
            global.showToast('Turma do aluno atualizada!', 'check');
        }
    }

    // Modal de Edição Geral da Escola
    function openEditSchoolModal(schoolInepOrName) {
        var modal = document.getElementById('modal-edit-school');
        if (!modal) return;

        var schools = getOfficialSchoolsState();
        var target = schoolInepOrName || global.currentSelectedSchoolDetail;
        var school = schools.find(function(s) {
            return s.inep === target || s.name === target || s.id === target;
        }) || schools[0];
        if (!school) return;

        var elId = document.getElementById('edit-school-id');
        var elName = document.getElementById('edit-school-name');
        var elInep = document.getElementById('edit-school-inep');
        var elZone = document.getElementById('edit-school-zone');
        var elDirector = document.getElementById('edit-school-director');
        var elStatus = document.getElementById('edit-school-status');
        var elPhone = document.getElementById('edit-school-phone');
        var elEmail = document.getElementById('edit-school-email');

        if (elId) elId.value = school.inep;
        if (elName) elName.value = school.name || '';
        if (elInep) elInep.value = school.inep || '';
        if (elZone) elZone.value = school.zone || 'Zona Rural';
        if (elDirector) elDirector.value = school.director || '';
        if (elStatus) elStatus.value = school.status || 'Ativa';
        if (elPhone) elPhone.value = school.phone || '';
        if (elEmail) elEmail.value = school.email || '';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeEditSchoolModal() {
        var modal = document.getElementById('modal-edit-school');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleSaveEditSchool(event) {
        if (event) event.preventDefault();

        var inepId = document.getElementById('edit-school-id').value;
        var nameVal = document.getElementById('edit-school-name').value.trim();
        var inepVal = document.getElementById('edit-school-inep').value.trim();
        var zoneVal = document.getElementById('edit-school-zone').value;
        var statusVal = document.getElementById('edit-school-status').value;
        var directorVal = document.getElementById('edit-school-director').value.trim();
        var phoneVal = document.getElementById('edit-school-phone').value.trim();
        var emailVal = document.getElementById('edit-school-email').value.trim();

        if (!nameVal || !inepVal) {
            alert('Por favor preencha os campos obrigatórios.');
            return;
        }

        var schools = getOfficialSchoolsState();
        var index = schools.findIndex(function(s) { return s.inep === inepId || s.inep === inepVal; });

        if (index !== -1) {
            schools[index].name = nameVal;
            schools[index].inep = inepVal;
            schools[index].zone = zoneVal;
            schools[index].status = statusVal;
            schools[index].director = directorVal;
            schools[index].phone = phoneVal;
            schools[index].email = emailVal;
        }

        saveOfficialSchoolsState(schools);
        closeEditSchoolModal();
        renderDbSchools();

        if (typeof global.showToast === 'function') {
            global.showToast('Escola atualizada!', 'check');
        }
    }

    // Inicialização
    function initSchoolsEventListeners() {
        var searchInput = document.getElementById('db-school-search');
        if (searchInput) {
            searchInput.oninput = function() {
                renderDbSchools();
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSchoolsEventListeners);
    } else {
        initSchoolsEventListeners();
    }

    // Exposição global
    global.getOfficialSchoolsState = getOfficialSchoolsState;
    global.getOfficialStudentsState = getOfficialStudentsState;
    global.getOfficialClassesState = getOfficialClassesState;
    global.getOfficialTeachersState = getOfficialTeachersState;
    global.saveOfficialSchoolsState = saveOfficialSchoolsState;
    global.saveOfficialStudentsState = saveOfficialStudentsState;
    global.saveOfficialClassesState = saveOfficialClassesState;
    global.saveOfficialTeachersState = saveOfficialTeachersState;

    global.renderDbSchools = renderDbSchools;
    global.openSchoolDetailView = openSchoolDetailView;
    global.openSchoolWorkspace = openSchoolDetailView;
    global.backToSchoolsList = backToSchoolsList;
    global.switchSchoolInnerTab = switchSchoolInnerTab;

    global.renderSchoolClassesTab = renderSchoolClassesTab;
    global.renderSchoolTeachersTab = renderSchoolTeachersTab;
    global.renderSchoolStudentsTab = renderSchoolStudentsTab;
    global.filterSchoolStudentsTable = filterSchoolStudentsTable;

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

    global.openEditSchoolModal = openEditSchoolModal;
    global.closeEditSchoolModal = closeEditSchoolModal;
    global.handleSaveEditSchool = handleSaveEditSchool;

})(typeof window !== 'undefined' ? window : this);
