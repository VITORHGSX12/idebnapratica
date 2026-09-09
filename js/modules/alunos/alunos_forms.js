// =========================================================================
// ALUNOS & ESCOLAS FORMS ENGINE
// Responsabilidade: Modais e formulários de cadastro de novas escolas e
// novos alunos, dropdown dinâmico de turmas por escola, validação de campos
// obrigatórios e atualização de métricas e seletores de rede.
// =========================================================================

(function(global) {
    'use strict';

    /**
     * Inicializa os listeners dos formulários de cadastro de escola e aluno
     */
    function initAlunosForms() {
        var createSchoolModal = document.getElementById('create-school-modal');
        var openCreateSchoolBtn = document.getElementById('btn-open-create-school-modal');
        var closeCreateSchoolBtn = document.getElementById('close-create-school-modal-btn');
        var createSchoolForm = document.getElementById('create-school-form');

        var createStudentModal = document.getElementById('create-student-modal');
        var openCreateStudentBtn = document.getElementById('btn-open-create-student-modal');
        var closeCreateStudentBtn = document.getElementById('close-create-student-modal-btn');
        var createStudentForm = document.getElementById('create-student-form');
        var newStudentSchoolDropdown = document.getElementById('new-student-school');

        // Modal de Cadastro de Escola
        if (openCreateSchoolBtn) {
            openCreateSchoolBtn.addEventListener('click', function() {
                if (createSchoolModal) createSchoolModal.classList.remove('hidden');
            });
        }
        if (closeCreateSchoolBtn) {
            closeCreateSchoolBtn.addEventListener('click', function() {
                if (createSchoolModal) createSchoolModal.classList.add('hidden');
            });
        }
        if (createSchoolModal) {
            createSchoolModal.addEventListener('click', function(e) {
                if (e.target === createSchoolModal) createSchoolModal.classList.add('hidden');
            });
        }

        if (createSchoolForm) {
            createSchoolForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var safeGet = global.safeGetProp || function(id, prop) { var el = document.getElementById(id); return el ? el[prop] : ''; };
                var schoolName = safeGet('new-school-name', 'value').trim().toUpperCase();
                var schoolInep = safeGet('new-school-inep', 'value').trim();
                var schoolCep = safeGet('new-school-cep', 'value').trim();
                var schoolAddress = safeGet('new-school-address', 'value').trim();

                if (!schoolName || !schoolInep) return;

                var loaded = global.loadedStudents || [];
                var schools = Array.from(new Set(loaded.map(function(s) { return s.escola; })));
                if (!schools.includes(schoolName)) {
                    schools.push(schoolName);
                    schools.sort();
                    
                    if (typeof global.populateSchoolPanelSelector === 'function') {
                        global.populateSchoolPanelSelector(schools);
                    }
                    
                    var newStudentMatricula = "REG-" + Math.floor(1000 + Math.random() * 9000);
                    var newStudent = {
                        matricula: newStudentMatricula,
                        nome: "ALUNO EXEMPLO (NOVO CADASTRO)",
                        nascimento: "01/01/2018",
                        sexo: "M",
                        cor: "Parda",
                        mae: "MÃE EXEMPLO",
                        pai: "PAI EXEMPLO",
                        endereco: schoolAddress || "ZONA URBANA",
                        cep: schoolCep || "65775-000",
                        nee: "",
                        escola: schoolName,
                        etapa: "Ensino fundamental de 9 anos - 3º Ano",
                        data_matricula: "07/08/2026",
                        cpf: "",
                        avg_score: 75
                    };
                    loaded.push(newStudent);

                    // Adicionar às tabelas relacionais do banco em memória
                    var dbEsc = global.dbEscolas || [];
                    var dbTur = global.dbTurmas || [];
                    var dbAln = global.dbAlunos || [];

                    dbEsc.push({
                        id: `esc_${dbEsc.length + 1}`,
                        nome: schoolName,
                        rede_id: "municipal",
                        codigo_inep: parseInt(schoolInep) || 0
                    });
                    dbTur.push({
                        id: `tur_${dbTur.length + 1}`,
                        escola_id: `esc_${dbEsc.length}`,
                        nome: "Ensino fundamental de 9 anos - 3º Ano",
                        turno: "Matutino",
                        ano_letivo: 2026
                    });
                    dbAln.push({
                        id: `aln_${dbAln.length + 1}`,
                        turma_id: `tur_${dbTur.length}`,
                        nome: "ALUNO EXEMPLO (NOVO CADASTRO)",
                        matricula: newStudentMatricula,
                        nee: "",
                        avg_score: 75
                    });
                    
                    var metricStud = document.getElementById('metric-students-eval');
                    if (metricStud) metricStud.textContent = `${loaded.length.toLocaleString('pt-BR')} alunos avaliados`;
                    
                    if (typeof global.initAlunosTab === 'function') global.initAlunosTab(schools);
                    
                    var tenantSelector = document.getElementById('tenant-selector');
                    if (tenantSelector) {
                        tenantSelector.innerHTML = '<option value="all">Todas as Redes (Multitenant)</option>';
                        schools.forEach(function(sch) {
                            var opt = document.createElement('option');
                            opt.value = sch;
                            opt.textContent = sch;
                            tenantSelector.appendChild(opt);
                        });
                    }
                    if (typeof global.recalculateNetworkStats === 'function') global.recalculateNetworkStats();
                    if (typeof global.saveDatabaseState === 'function') global.saveDatabaseState();
                    if (typeof global.showToast === 'function') global.showToast(`Escola "${schoolName}" cadastrada com sucesso!`, 'check-circle');
                } else {
                    if (typeof global.showToast === 'function') global.showToast(`A escola "${schoolName}" já existe.`, 'alert-triangle');
                }

                createSchoolForm.reset();
                if (createSchoolModal) createSchoolModal.classList.add('hidden');
            });
        }

        // Modal de Cadastro de Aluno
        if (openCreateStudentBtn) {
            openCreateStudentBtn.addEventListener('click', function() {
                var dropdown = document.getElementById('new-student-school');
                var dbEsc = global.dbEscolas || [];
                if (dropdown) {
                    dropdown.innerHTML = '<option value="">Selecione a Escola...</option>';
                    dbEsc.forEach(function(esc) {
                        var opt = document.createElement('option');
                        opt.value = esc.nome;
                        opt.textContent = esc.nome;
                        dropdown.appendChild(opt);
                    });
                }
                var newStudentClassDropdown = document.getElementById('new-student-class');
                if (newStudentClassDropdown) {
                    newStudentClassDropdown.innerHTML = '<option value="">Selecione primeiro a escola...</option>';
                }
                if (createStudentModal) createStudentModal.classList.remove('hidden');
            });
        }

        if (newStudentSchoolDropdown) {
            newStudentSchoolDropdown.addEventListener('change', function() {
                var selectedSchoolName = newStudentSchoolDropdown.value;
                var newStudentClassDropdown = document.getElementById('new-student-class');
                if (!newStudentClassDropdown) return;

                if (typeof global.populateTurmasSelect === 'function') {
                    global.populateTurmasSelect(selectedSchoolName, newStudentClassDropdown);
                } else {
                    newStudentClassDropdown.innerHTML = '';
                    var dbEsc = global.dbEscolas || [];
                    var dbTur = global.dbTurmas || [];
                    var schoolObj = dbEsc.find(function(e) { return e.nome === selectedSchoolName; });
                    if (!schoolObj) {
                        newStudentClassDropdown.innerHTML = '<option value="">Selecione primeiro a escola...</option>';
                        return;
                    }
                    var classes = dbTur.filter(function(t) { return t.escola_id === schoolObj.id; });
                    if (classes.length === 0) {
                        newStudentClassDropdown.innerHTML = '<option value="">Nenhuma turma cadastrada nesta escola</option>';
                        return;
                    }
                    newStudentClassDropdown.innerHTML = '<option value="">Selecione a Turma...</option>';
                    classes.forEach(function(c) {
                        var opt = document.createElement('option');
                        opt.value = c.id;
                        opt.textContent = `${c.nome} (${c.serie} - ${c.turno})`;
                        newStudentClassDropdown.appendChild(opt);
                    });
                }
            });
        }

    // =========================================================================
    // VALIDAÇÃO E MÁSCARA DE CPF
    // =========================================================================
    function validateCPF(cpf) {
        if (!cpf) return true; // Campo opcional no cadastro
        var clean = String(cpf).replace(/\D/g, '');
        if (clean.length === 0) return true;
        if (clean.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(clean)) return false;

        var sum = 0;
        for (var i = 0; i < 9; i++) {
            sum += parseInt(clean.charAt(i), 10) * (10 - i);
        }
        var rest = 11 - (sum % 11);
        var dig1 = (rest === 10 || rest === 11) ? 0 : rest;
        if (dig1 !== parseInt(clean.charAt(9), 10)) return false;

        sum = 0;
        for (var j = 0; j < 10; j++) {
            sum += parseInt(clean.charAt(j), 10) * (11 - j);
        }
        rest = 11 - (sum % 11);
        var dig2 = (rest === 10 || rest === 11) ? 0 : rest;
        return dig2 === parseInt(clean.charAt(10), 10);
    }

    function formatCPFMask(value) {
        if (!value) return '';
        var clean = String(value).replace(/\D/g, '').slice(0, 11);
        if (clean.length <= 3) return clean;
        if (clean.length <= 6) return clean.slice(0, 3) + '.' + clean.slice(3);
        if (clean.length <= 9) return clean.slice(0, 3) + '.' + clean.slice(3, 6) + '.' + clean.slice(6);
        return clean.slice(0, 3) + '.' + clean.slice(3, 6) + '.' + clean.slice(6, 9) + '-' + clean.slice(9, 11);
    }

    // Modal de Cadastro de Estudante
    var studentCpfInput = document.getElementById('new-student-cpf');
    if (studentCpfInput) {
        studentCpfInput.setAttribute('maxlength', '14');
        studentCpfInput.addEventListener('input', function(e) {
            var formatted = formatCPFMask(e.target.value);
            if (e.target.value !== formatted) {
                e.target.value = formatted;
            }
        });
    }

    if (closeCreateStudentBtn) {
        closeCreateStudentBtn.addEventListener('click', function() {
            if (createStudentModal) createStudentModal.classList.add('hidden');
        });
    }
    if (createStudentModal) {
        createStudentModal.addEventListener('click', function(e) {
            if (e.target === createStudentModal) createStudentModal.classList.add('hidden');
        });
    }

    if (createStudentForm) {
        createStudentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var safeGet = global.safeGetProp || function(id, prop) { var el = document.getElementById(id); return el ? el[prop] : ''; };
            var name = safeGet('new-student-name', 'value').trim().toUpperCase();
            var cpf = safeGet('new-student-cpf', 'value').trim();
            var birth = safeGet('new-student-birth', 'value');
            var sexo = safeGet('new-student-sexo', 'value');
            var color = safeGet('new-student-color', 'value');
            var nee = safeGet('new-student-nee', 'value').trim();
            var mae = safeGet('new-student-mae', 'value').trim().toUpperCase();
            var pai = safeGet('new-student-pai', 'value').trim().toUpperCase();
            var address = safeGet('new-student-address', 'value').trim().toUpperCase();
            var cep = safeGet('new-student-cep', 'value').trim();
            var matricula = safeGet('new-student-matricula', 'value').trim();
            var school = safeGet('new-student-school', 'value');
            var selectedClassId = safeGet('new-student-class', 'value');
            var start = safeGet('new-student-start', 'value');

            // Validação de campos obrigatórios
            if (!name || !matricula || !school || !selectedClassId) {
                if (typeof global.showToast === 'function') global.showToast('Preencha todos os campos obrigatórios e selecione uma turma.', 'alert-triangle');
                return;
            }

            // Validação de CPF com Módulo 11 (Bug 3)
            var cleanCpf = cpf.replace(/\D/g, '');
            if (cleanCpf.length > 0) {
                if (!validateCPF(cleanCpf)) {
                    if (typeof global.showToast === 'function') {
                        global.showToast('CPF inválido. Verifique os dígitos digitados.', 'alert-triangle');
                    }
                    if (studentCpfInput) studentCpfInput.focus();
                    return;
                }
                cpf = formatCPFMask(cleanCpf);
            }

            var dbTur = global.dbTurmas || [];
            var dbAln = global.dbAlunos || [];
            var loaded = global.loadedStudents || [];

            var classObj = dbTur.find(function(t) { return t.id === selectedClassId; });
            if (!classObj) {
                if (typeof global.showToast === 'function') global.showToast('Turma selecionada não encontrada.', 'alert-triangle');
                return;
            }

            var formatDate = function(dateStr) {
                if (!dateStr) return '';
                var parts = dateStr.split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
            };

            var newStudent = {
                matricula: matricula,
                nome: name,
                nascimento: formatDate(birth),
                sexo: sexo,
                cor: color,
                mae: mae,
                pai: pai,
                endereco: address,
                cep: cep,
                nee: nee,
                escola: school,
                etapa: classObj.serie,
                turma_id: classObj.id,
                data_matricula: formatDate(start),
                cpf: cpf,
                avg_score: 75
            };

            var submitBtn = createStudentForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Salvando Estudante...';
            }

            try {
                // Tenta sincronizar com a nuvem via API se houver token
                var token = sessionStorage.getItem('authToken');
                if (token && token !== 'preview_token') {
                    try {
                        var apiRes = await fetch('/api/students', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token
                            },
                            body: JSON.stringify(newStudent)
                        });
                        if (!apiRes.ok && apiRes.status !== 401 && apiRes.status !== 403) {
                            var errData = await apiRes.json().catch(function() { return {}; });
                            if (errData && errData.error) {
                                if (typeof global.showToast === 'function') global.showToast(errData.error, 'alert-triangle');
                                return;
                            }
                        }
                    } catch(netErr) {
                        console.warn('[Sync API Warning] Offline ou modo local:', netErr);
                    }
                }

                // Atualiza estado em memória
                loaded.push(newStudent);

                dbAln.push({
                    id: `aln_${dbAln.length + 1}_${Date.now()}`,
                    turma_id: classObj.id,
                    nome: name,
                    matricula: matricula,
                    nee: nee,
                    avg_score: 75
                });
                
                if (typeof global.recalculateNetworkStats === 'function') global.recalculateNetworkStats();
                
                var metricStud = document.getElementById('metric-students-eval');
                if (metricStud) metricStud.textContent = `${loaded.length.toLocaleString('pt-BR')} alunos avaliados`;
                
                var badgeCount = document.getElementById('badge-count-students');
                if (badgeCount) badgeCount.textContent = loaded.length.toLocaleString('pt-BR');
                
                var schools = Array.from(new Set(loaded.map(function(s) { return s.escola; }))).sort();
                if (typeof global.initAlunosTab === 'function') global.initAlunosTab(schools);
                if (typeof global.populateSchoolPanelSelector === 'function') global.populateSchoolPanelSelector(schools);
                
                if (typeof global.initStudentSearch === 'function') global.initStudentSearch();
                if (typeof global.renderRiskGoalsTable === 'function') global.renderRiskGoalsTable();
                if (typeof global.renderHeatmapGrid === 'function') global.renderHeatmapGrid();
                if (typeof global.saveDatabaseState === 'function') global.saveDatabaseState();

                if (typeof global.showToast === 'function') global.showToast(`Aluno ${name} cadastrado com sucesso!`, 'check-circle');
                createStudentForm.reset();
                if (createStudentModal) createStudentModal.classList.add('hidden');
            } catch(err) {
                console.error('[Student Registration Error]', err);
                if (typeof global.showToast === 'function') global.showToast('Erro ao salvar aluno.', 'x');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Cadastrar Aluno';
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAlunosForms);
} else {
    initAlunosForms();
}

// Exposição Global
global.initAlunosForms = initAlunosForms;
global.validateCPF = validateCPF;
global.formatCPFMask = formatCPFMask;

})(typeof window !== 'undefined' ? window : this);
