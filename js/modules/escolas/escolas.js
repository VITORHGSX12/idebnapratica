// =========================================================================
// ESCOLAS DA REDE MODULE
// Responsabilidade: Gestão e listagem de escolas da rede, detalhe e edição
// =========================================================================

(function(global) {
    'use strict';

    var STORAGE_KEY_OFFICIAL_SCHOOLS = 'gd_official_schools_data';

    // Lista oficial das 9 escolas municipais de Gonçalves Dias - MA
    var defaultSchoolsSeed = [
        { id: "esc_1", name: "UI JOSE CORREA LIMA", inep: "21128723", zone: "Zona Rural", status: "Ativa", city: "Gonçalves Dias - MA", director: "Profª Maria da Conceição Lima", role: "Diretora Escolar", phone: "(99) 9935-6201", email: "jclima@goncalvesdias.ma.gov.br", alunosCount: 265, turmasCount: 8, ideb2025: "5.4" },
        { id: "esc_2", name: "UI EMILIO MURAD", inep: "21128146", zone: "Zona Rural", status: "Ativa", city: "Gonçalves Dias - MA", director: "Prof. Francisco Carlos Silva", role: "Diretor Escolar", phone: "(99) 9935-6250", email: "emiliomurad@goncalvesdias.ma.gov.br", alunosCount: 210, turmasCount: 6, ideb2025: "5.1" },
        { id: "esc_3", name: "UE VEREADOR LEONARDO FERREIRA LIMA", inep: "21128740", zone: "Sede Urbana", status: "Ativa", city: "Gonçalves Dias - MA", director: "Profª Antonia Ferreira Lima", role: "Diretora Escolar", phone: "(99) 9981-4371", email: "leonardolima@goncalvesdias.ma.gov.br", alunosCount: 380, turmasCount: 11, ideb2025: "5.6" },
        { id: "esc_4", name: "U I BASILIO ALVES", inep: "21128120", zone: "Zona Rural", status: "Ativa", city: "Gonçalves Dias - MA", director: "Prof. José Basílio Alves", role: "Diretor Escolar", phone: "(99) 9935-6218", email: "basilioalves@goncalvesdias.ma.gov.br", alunosCount: 195, turmasCount: 6, ideb2025: "4.9" },
        { id: "esc_5", name: "UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ", inep: "21286973", zone: "Sede Urbana", status: "Ativa", city: "Gonçalves Dias - MA", director: "Profª Aldenora Araújo Cruz", role: "Diretora Escolar", phone: "(99) 9998-2055", email: "aldenoracruz@goncalvesdias.ma.gov.br", alunosCount: 320, turmasCount: 9, ideb2025: "5.3" },
        { id: "esc_6", name: "UE RAIMUNDO DOS REIS DA SILVA", inep: "21128758", zone: "Zona Rural", status: "Ativa", city: "Gonçalves Dias - MA", director: "Prof. Raimundo Nonato Reis", role: "Diretor Escolar", phone: "(99) 9935-6202", email: "raimundoreis@goncalvesdias.ma.gov.br", alunosCount: 175, turmasCount: 5, ideb2025: "4.8" },
        { id: "esc_7", name: "UNIDADE INTEGRADA JOSE GONCALVES DIAS", inep: "21286990", zone: "Zona Rural", status: "Ativa", city: "Gonçalves Dias - MA", director: "Prof. Raimundo José Dias", role: "Diretor Escolar", phone: "(99) 9998-2055", email: "josegoncalves@goncalvesdias.ma.gov.br", alunosCount: 230, turmasCount: 7, ideb2025: "5.0" },
        { id: "esc_8", name: "UNIDADE ESCOLAR ANISIO GOMES", inep: "21128774", zone: "Zona Rural", status: "Ativa", city: "Gonçalves Dias - MA", director: "Profª Francisca Anísio Gomes", role: "Diretora Escolar", phone: "(99) 99817-0566", email: "anisiogomes@goncalvesdias.ma.gov.br", alunosCount: 160, turmasCount: 5, ideb2025: "4.7" },
        { id: "esc_9", name: "UE ANITA FURTADO", inep: "21192544", zone: "Sede Urbana", status: "Ativa", city: "Gonçalves Dias - MA", director: "Profª Ana Rita Anita Furtado", role: "Diretora Escolar", phone: "(99) 9935-6210", email: "anitafurtado@goncalvesdias.ma.gov.br", alunosCount: 290, turmasCount: 8, ideb2025: "5.5" }
    ];

    var officialSchoolsDatabase = null;

    /**
     * Obtém o estado oficial e sincronizado das escolas da rede
     * @returns {Array} Lista de escolas
     */
    function getOfficialSchoolsState() {
        if (officialSchoolsDatabase && officialSchoolsDatabase.length > 0) {
            return officialSchoolsDatabase;
        }

        try {
            var saved = localStorage.getItem(STORAGE_KEY_OFFICIAL_SCHOOLS);
            if (saved) {
                officialSchoolsDatabase = JSON.parse(saved);
                if (Array.isArray(officialSchoolsDatabase) && officialSchoolsDatabase.length > 0) {
                    return officialSchoolsDatabase;
                }
            }
        } catch(e) {}

        // Fallback para bases já carregadas na janela ou semente padrão
        if (typeof global.ESCOLAS_MARANHAO_OFICIAL_DB !== 'undefined' && Array.isArray(global.ESCOLAS_MARANHAO_OFICIAL_DB)) {
            var filteredGd = global.ESCOLAS_MARANHAO_OFICIAL_DB.filter(function(e) {
                return (e.municipio || '').toUpperCase().includes('GONÇALVES DIAS') || (e.municipio || '').toUpperCase().includes('GONCALVES DIAS');
            });
            if (filteredGd.length > 0) {
                officialSchoolsDatabase = filteredGd.map(function(s, idx) {
                    return {
                        id: 'esc_' + (idx + 1),
                        name: s.escola || s.name,
                        inep: s.inep || ('2112' + (8720 + idx)),
                        zone: s.localizacao || s.zone || 'Zona Rural',
                        status: 'Ativa',
                        city: 'Gonçalves Dias - MA',
                        director: s.diretor || 'Gestão Escolar',
                        role: 'Diretor(a) Escolar',
                        phone: s.telefone || '(99) 9935-6200',
                        email: 'escola' + (idx + 1) + '@goncalvesdias.ma.gov.br',
                        alunosCount: s.alunos || 200,
                        turmasCount: s.turmas || 6,
                        ideb2025: s.ideb || '5.2'
                    };
                });
            }
        }

        if (!officialSchoolsDatabase || officialSchoolsDatabase.length === 0) {
            officialSchoolsDatabase = defaultSchoolsSeed;
        }

        saveOfficialSchoolsState();
        return officialSchoolsDatabase;
    }

    /**
     * Persiste o estado das escolas no armazenamento local
     */
    function saveOfficialSchoolsState() {
        try {
            localStorage.setItem(STORAGE_KEY_OFFICIAL_SCHOOLS, JSON.stringify(officialSchoolsDatabase));
        } catch(e) {}
    }

    /**
     * Renderiza a listagem completa de escolas no painel
     */
    function renderDbSchools() {
        var tbody = document.getElementById('db-schools-table-body') || document.getElementById('schools-table-body');
        if (!tbody) return;

        var userRole = sessionStorage.getItem('userRole') || 'Master Admin';
        var userEscola = sessionStorage.getItem('userEscola') || '';
        var isDirector = userRole === 'Diretor Escola';
        var isTeacher = userRole === 'Professor' || userRole === 'Professor AEE';
        var isAdminOrSemed = userRole === 'Master Admin' || userRole === 'Gestor da Rede';

        var schools = getOfficialSchoolsState();

        // Filtro de escopo por papel
        if ((isDirector || isTeacher) && userEscola) {
            schools = schools.filter(function(s) {
                return s.name.toUpperCase().includes(userEscola.toUpperCase()) || 
                       userEscola.toUpperCase().includes(s.name.toUpperCase()) || 
                       (s.inep && s.inep === '21128723');
            });
        }

        var searchInput = document.getElementById('db-school-search');
        var query = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        var filtered = schools.filter(function(s) {
            var normName = s.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return normName.includes(query) || (s.inep && s.inep.includes(query));
        });

        // Atualizar Contadores de KPI
        var kpiTotal = document.getElementById('kpi-total-schools');
        var kpiStudents = document.getElementById('kpi-total-students-val');
        if (kpiTotal) {
            kpiTotal.textContent = (isDirector || isTeacher) ? ('1 Unidade (' + (userEscola || 'Vinculada') + ')') : (schools.length + ' Unidades da Rede');
        }
        if (kpiStudents) {
            var totalAlunos = schools.reduce(function(sum, s) { return sum + (s.alunosCount || 0); }, 0);
            kpiStudents.textContent = totalAlunos.toLocaleString('pt-BR') + ' Estudantes';
        }

        // Ocultar botão de cadastrar nova escola para diretor/professor
        var btnNewSchool = document.getElementById('btn-create-school') || document.querySelector('[data-action="create-school"]');
        if (btnNewSchool) {
            btnNewSchool.style.display = isAdminOrSemed ? 'inline-flex' : 'none';
        }

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 36px; text-align: center; color: var(--text-muted);">Nenhuma escola encontrada com este termo de busca.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function(sch) {
            var isUrban = sch.zone && sch.zone.includes('Urbana');
            var zoneIcon = isUrban ? '🏫' : '🌾';
            var statusLabel = sch.status || 'Ativa';
            var statusColor = statusLabel === 'Ativa' ? '#16a34a' : (statusLabel === 'Em manutenção' ? '#d97706' : '#ef4444');
            var statusBg = statusLabel === 'Ativa' ? 'rgba(34, 197, 94, 0.12)' : (statusLabel === 'Em manutenção' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)');
            var statusBorder = statusLabel === 'Ativa' ? 'rgba(34, 197, 94, 0.25)' : (statusLabel === 'Em manutenção' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.25)');

            return `
                <tr style="border-bottom: 1px solid var(--border-color); height: 64px; transition: background-color 0.15s ease;">
                    <td style="padding: 12px 20px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 38px; height: 38px; border-radius: 8px; background: rgba(99, 102, 241, 0.1); color: #6366f1; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.15rem;">
                                ${zoneIcon}
                            </div>
                            <div>
                                <strong style="font-size: 0.9rem; color: var(--text-primary); display: block; line-height: 1.3;">${sch.name}</strong>
                                <span style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px; display: block;">
                                    ${sch.city || 'Gonçalves Dias - MA'} • ${sch.alunosCount || 200} estudantes
                                </span>
                            </div>
                        </div>
                    </td>

                    <td style="padding: 12px 16px; font-family: var(--font-mono); font-size: 0.85rem; color: var(--text-secondary); font-weight: 700;">
                        ${sch.inep}
                    </td>

                    <td style="padding: 12px 16px;">
                        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; background: var(--bg-tertiary); color: var(--text-primary); border: 1px solid var(--border-color);">
                            <span>${zoneIcon}</span> <span>${sch.zone}</span>
                        </span>
                    </td>

                    <td style="padding: 12px 16px; text-align: center;">
                        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 4px 12px; border-radius: 20px; font-size: 0.74rem; font-weight: 800; background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder};">
                            ● ${statusLabel.toUpperCase()}
                        </span>
                    </td>

                    <td style="padding: 12px 20px; text-align: center;">
                        <div style="display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
                            <button type="button" onclick="openSchoolWorkspace('${sch.name.replace(/'/g, "\\\'")}');" class="btn btn-outline btn-sm" style="font-size: 0.76rem; font-weight: 700; color: #6366f1; border: 1px solid #6366f1; background: rgba(99, 102, 241, 0.08); padding: 6px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(99, 102, 241, 0.08); cursor: pointer; transition: all 0.15s ease;">
                                <span>Ver Escola</span> <span style="font-size: 0.85rem;">→</span>
                            </button>
                            
                            ${isAdminOrSemed ? `
                                <button type="button" onclick="openEditSchoolModal('${sch.inep}');" class="btn btn-outline btn-sm" style="font-size: 0.76rem; font-weight: 600; color: var(--text-primary); border: 1px solid var(--border-color); background: var(--bg-tertiary); padding: 6px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; transition: all 0.15s ease;" title="Editar Dados da Escola (Admin/SEMED)">
                                    ✏️ Editar
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }
    }

    /**
     * Abre a visão detalhada de uma escola
     */
    function openSchoolDetailView(schoolName, inep, zone, phone, director) {
        var schools = getOfficialSchoolsState();
        var schoolObj = schools.find(function(s) {
            return s.name === schoolName || s.inep === inep || s.name.toLowerCase().includes((schoolName || '').toLowerCase());
        }) || {
            name: schoolName || "UI BASILIO ALVES",
            inep: inep || "21128120",
            zone: zone || "Zona Rural",
            phone: phone || "(99) 9935-6218",
            director: director || "Gestão Escolar"
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
        var isRural = (schoolObj.zone || '').includes('Rural');
        
        if (nameEl) nameEl.textContent = schoolObj.name;
        if (badgeEl) {
            badgeEl.innerHTML = `<span>${isRural ? '🌾' : '🏫'}</span> <span>${schoolObj.zone || 'Rede Municipal'}</span>`;
            badgeEl.style.background = isRural ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)';
            badgeEl.style.color = isRural ? '#d97706' : '#6366f1';
        }
        if (metaEl) {
            metaEl.textContent = `INEP: ${schoolObj.inep} • Direção: ${schoolObj.director || 'Gestão Escolar'} • Fone: ${schoolObj.phone || '-'}`;
        }
        
        if (typeof global.switchSchoolInnerTab === 'function') {
            global.switchSchoolInnerTab('turmas');
        }
        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }
    }

    /**
     * Retorna da visualização detalhada para a listagem de escolas
     */
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
        if (typeof global.safeCreateIcons === 'function') {
            global.safeCreateIcons();
        }
    }

    /**
     * Alterna sub-abas dentro do detalhe da escola (Turmas, Professores, Infraestrutura)
     */
    function switchSchoolInnerTab(tabName) {
        var btns = document.querySelectorAll('.school-nav-tab-btn');
        btns.forEach(function(btn) {
            var dt = btn.getAttribute('data-tab');
            if (dt === tabName) {
                btn.classList.add('active');
                btn.style.color = '#10b981';
                btn.style.background = 'rgba(16, 185, 129, 0.12)';
                btn.style.border = '1px solid rgba(16, 185, 129, 0.25)';
                btn.style.fontWeight = '700';
            } else {
                btn.classList.remove('active');
                btn.style.color = 'var(--text-secondary)';
                btn.style.background = 'transparent';
                btn.style.border = 'none';
                btn.style.fontWeight = '600';
            }
        });

        var container = document.getElementById('school-inner-tab-content-container');
        if (!container) return;

        var school = global.currentSelectedSchoolDetail || "UI BASILIO ALVES";

        if (tabName === 'professores') {
            var teachers = (typeof global.getSchoolTeachers === 'function') ? global.getSchoolTeachers(school) : [];
            container.innerHTML = `
                <div class="card" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 20px;">
                    <div class="flex-between flex-wrap gap-md" style="margin-bottom: 16px;">
                        <div>
                            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0;">Professores da Escola</h3>
                            <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 2px 0 0 0;">Corpo docente vinculado a ${school} (${teachers.length} docentes cadastrados)</p>
                        </div>
                        <button type="button" onclick="openCreateTeacherModal('${school.replace(/'/g, "\\\'")}');" class="btn btn-primary" style="display:flex; align-items:center; gap:6px; font-size:0.82rem; font-weight:700; background:linear-gradient(135deg, #4f46e5, #6366f1); border:none; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);">
                            + Vincular Professor
                        </button>
                    </div>

                    ${teachers.length === 0 ? `
                        <div style="padding: 36px 20px; text-align: center; color: var(--text-muted); background: var(--bg-tertiary); border-radius: var(--radius-md);">
                            <div style="font-size: 1.8rem; margin-bottom: 8px;">👨‍🏫</div>
                            <p style="margin: 0; font-weight: 600;">Nenhum professor vinculado a esta escola no momento.</p>
                        </div>
                    ` : `
                        <div class="table-responsive">
                            <table class="data-table" style="width: 100%;">
                                <thead>
                                    <tr>
                                        <th>Nome do Docente</th>
                                        <th>Componente Curricular</th>
                                        <th>Turmas Atribuídas</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${teachers.map(function(t) {
                                        return `
                                            <tr>
                                                <td><strong>${t.nome || t.name}</strong></td>
                                                <td>${t.disciplina || t.subject || 'Língua Portuguesa'}</td>
                                                <td>${t.turmas || '2º e 5º Ano'}</td>
                                                <td><span class="badge badge-success">● Ativo</span></td>
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
    }

    /**
     * Abre modal de edição de escola
     */
    function openEditSchoolModal(schoolInepOrName) {
        var modal = document.getElementById('modal-edit-school');
        if (!modal) return;

        var schools = getOfficialSchoolsState();
        var target = schoolInepOrName || global.currentSelectedSchoolDetail;
        var school = schools.find(function(s) {
            return s.inep === target || s.name === target || s.id === target;
        }) || schools[0];
        if (!school) return;

        // Preencher formulário
        var elId = document.getElementById('edit-school-id');
        var elName = document.getElementById('edit-school-name');
        var elInep = document.getElementById('edit-school-inep');
        var elZone = document.getElementById('edit-school-zone');
        var elCity = document.getElementById('edit-school-city');
        var elDirector = document.getElementById('edit-school-director');
        var elRole = document.getElementById('edit-school-role');
        var elStatus = document.getElementById('edit-school-status');
        var elPhone = document.getElementById('edit-school-phone');
        var elEmail = document.getElementById('edit-school-email');
        var elStudents = document.getElementById('edit-school-students');

        if (elId) elId.value = school.inep;
        if (elName) elName.value = school.name || '';
        if (elInep) elInep.value = school.inep || '';
        if (elZone) elZone.value = school.zone || 'Zona Rural';
        if (elCity) elCity.value = school.city || 'Gonçalves Dias - MA';
        if (elDirector) elDirector.value = school.director || '';
        if (elRole) elRole.value = school.role || 'Diretor(a) Escolar';
        if (elStatus) elStatus.value = school.status || 'Ativa';
        if (elPhone) elPhone.value = school.phone || '';
        if (elEmail) elEmail.value = school.email || '';
        if (elStudents) elStudents.value = (school.alunosCount || 200) + ' estudantes matriculados';

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    /**
     * Fecha modal de edição de escola
     */
    function closeEditSchoolModal() {
        var modal = document.getElementById('modal-edit-school');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    /**
     * Trata o salvamento dos dados editados da escola
     */
    function handleSaveEditSchool(event) {
        if (event) event.preventDefault();

        var elId = document.getElementById('edit-school-id');
        var elName = document.getElementById('edit-school-name');
        var elInep = document.getElementById('edit-school-inep');
        var elZone = document.getElementById('edit-school-zone');
        var elStatus = document.getElementById('edit-school-status');
        var elDirector = document.getElementById('edit-school-director');
        var elRole = document.getElementById('edit-school-role');
        var elPhone = document.getElementById('edit-school-phone');
        var elEmail = document.getElementById('edit-school-email');

        var inepId = elId ? elId.value : '';
        var nameVal = elName ? elName.value.trim() : '';
        var inepVal = elInep ? elInep.value.trim() : '';
        var zoneVal = elZone ? elZone.value : 'Zona Rural';
        var statusVal = elStatus ? elStatus.value : 'Ativa';
        var directorVal = elDirector ? elDirector.value.trim() : '';
        var roleVal = elRole ? elRole.value.trim() : 'Diretor(a) Escolar';
        var phoneVal = elPhone ? elPhone.value.trim() : '';
        var emailVal = elEmail ? elEmail.value.trim() : '';

        if (!nameVal || !inepVal) {
            alert('Por favor preencha os campos obrigatórios (Nome e Código INEP).');
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
            schools[index].role = roleVal;
            schools[index].phone = phoneVal;
            schools[index].email = emailVal;
        } else {
            schools.push({
                id: 'esc_' + Date.now(),
                name: nameVal,
                inep: inepVal,
                zone: zoneVal,
                status: statusVal,
                city: 'Gonçalves Dias - MA',
                director: directorVal,
                role: roleVal,
                phone: phoneVal,
                email: emailVal,
                alunosCount: 200,
                turmasCount: 6,
                ideb2025: '5.2'
            });
        }

        saveOfficialSchoolsState();
        closeEditSchoolModal();
        renderDbSchools();

        if (typeof global.showToast === 'function') {
            global.showToast('Escola "' + nameVal + '" salva com sucesso!', 'check');
        }
    }

    // Ouvintes de busca no input
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
    global.saveOfficialSchoolsState = saveOfficialSchoolsState;
    global.renderDbSchools = renderDbSchools;
    global.openSchoolDetailView = openSchoolDetailView;
    global.openSchoolWorkspace = openSchoolDetailView;
    global.backToSchoolsList = backToSchoolsList;
    global.switchSchoolInnerTab = switchSchoolInnerTab;
    global.openEditSchoolModal = openEditSchoolModal;
    global.closeEditSchoolModal = closeEditSchoolModal;
    global.handleSaveEditSchool = handleSaveEditSchool;

})(typeof window !== 'undefined' ? window : this);
