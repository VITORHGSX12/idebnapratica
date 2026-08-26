/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — ESCOLAS DA REDE MUNICIPAL (ESTADO & LISTAGEM GERAL)
 * Arquivo: js/modules/escolas/escolas.js
 * Descrição: Gestão centralizada do estado oficial da rede, grid de escolas,
 *            edição geral de dados cadastrais e exportação CSV/XLS.
 * ============================================================================
 */

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
        var seed = getSeedData();
        try {
            var saved = localStorage.getItem(STORAGE_KEY_OFFICIAL_SCHOOLS);
            if (saved) {
                var parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === (seed.escolas ? seed.escolas.length : 9)) return parsed;
            }
        } catch(e) {}

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
        var seed = getSeedData();
        try {
            var saved = localStorage.getItem(STORAGE_KEY_OFFICIAL_STUDENTS);
            if (saved) {
                var parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === (seed.alunos ? seed.alunos.length : 526)) return parsed;
            }
        } catch(e) {}

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

            var statusLabel = sch.status || 'Ativa';
            var isAtiva = statusLabel === 'Ativa';
            var badgeClass = isAtiva ? 'badge-status-success' : 'badge-status-warning';

            var safeName = typeof global.escapeHtml === 'function' ? global.escapeHtml(sch.name) : sch.name;
            var safeInep = typeof global.escapeHtml === 'function' ? global.escapeHtml(sch.inep) : sch.inep;
            var safeCity = typeof global.escapeHtml === 'function' ? global.escapeHtml(sch.city || 'Gonçalves Dias - MA') : (sch.city || 'Gonçalves Dias - MA');
            var safeZone = typeof global.escapeHtml === 'function' ? global.escapeHtml(sch.zone || 'Zona Rural') : (sch.zone || 'Zona Rural');
            var safeStatusLabel = typeof global.escapeHtml === 'function' ? global.escapeHtml(statusLabel) : statusLabel;

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
    // 3. MODAL DE EDIÇÃO GERAL DA ESCOLA
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // 4. EXPORTAÇÃO E ATUALIZAÇÃO
    // -------------------------------------------------------------------------

    function exportSchoolsList() {
        var schools = getOfficialSchoolsState();
        if (!schools || schools.length === 0) {
            if (typeof global.showToast === 'function') global.showToast('Nenhuma escola encontrada para exportar.', 'alert');
            return;
        }

        var csvRows = [
            ['UNIDADE ESCOLAR', 'CODIGO INEP', 'LOCALIZACAO', 'STATUS', 'DIRECAO', 'TELEFONE']
        ];

        schools.forEach(function(s) {
            csvRows.push([
                '"' + (s.name || '').replace(/"/g, '""') + '"',
                '"' + (s.inep || s.codigo_inep || '') + '"',
                '"' + (s.zone || 'Zona Rural') + '"',
                '"' + (s.status || 'Ativa') + '"',
                '"' + (s.director || 'Gestão Escolar') + '"',
                '"' + (s.phone || '(99) 9935-6200') + '"'
            ]);
        });

        var csvContent = '\uFEFF' + csvRows.map(function(r) { return r.join(';'); }).join('\r\n');
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'escolas_rede_municipal_goncalves_dias.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (typeof global.showToast === 'function') {
            global.showToast('Lista de escolas exportada com sucesso (CSV)!', 'check');
        }
    }

    function refreshSchoolsList() {
        renderDbSchools();
        if (typeof global.showToast === 'function') {
            global.showToast('Lista de escolas atualizada com sucesso!', 'check');
        }
    }

    function initSchoolsEventListeners() {
        var searchInput = document.getElementById('db-school-search');
        if (searchInput) {
            searchInput.oninput = function() {
                renderDbSchools();
            };
        }

        var exportBtn = document.getElementById('btn-export-schools-list');
        if (exportBtn) {
            exportBtn.onclick = function() {
                exportSchoolsList();
            };
        }

        var refreshBtn = document.getElementById('btn-refresh-schools-list');
        if (refreshBtn) {
            refreshBtn.onclick = function() {
                refreshSchoolsList();
            };
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSchoolsEventListeners);
    } else {
        initSchoolsEventListeners();
    }

    // Exposição no Escopo Global
    global.getOfficialSchoolsState = getOfficialSchoolsState;
    global.getOfficialStudentsState = getOfficialStudentsState;
    global.getOfficialClassesState = getOfficialClassesState;
    global.getOfficialTeachersState = getOfficialTeachersState;
    global.saveOfficialSchoolsState = saveOfficialSchoolsState;
    global.saveOfficialStudentsState = saveOfficialStudentsState;
    global.saveOfficialClassesState = saveOfficialClassesState;
    global.saveOfficialTeachersState = saveOfficialTeachersState;

    global.renderDbSchools = renderDbSchools;
    global.openEditSchoolModal = openEditSchoolModal;
    global.closeEditSchoolModal = closeEditSchoolModal;
    global.handleSaveEditSchool = handleSaveEditSchool;
    global.exportSchoolsList = exportSchoolsList;
    global.refreshSchoolsList = refreshSchoolsList;

})(typeof window !== 'undefined' ? window : this);
