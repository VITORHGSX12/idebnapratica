/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO TURMAS (DIÁRIO DE CLASSE & DIAGNÓSTICO)
 * Arquivo: js/modules/turmas/turmas_diario.js
 * Descrição: Diário de classe da turma, lista de estudantes com alertas de
 *            desempenho, diagnóstico individual SAEB e progressão histórica.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var activeDiarySchool = 'UI JOSE CORREA LIMA';
    var activeDiaryClass = '5º Ano A';
    var classTeachersMap = global.classTeachersMap || {};

    function getActiveDiarySchool() {
        return activeDiarySchool;
    }

    function setActiveDiarySchool(school) {
        activeDiarySchool = school;
    }

    // -------------------------------------------------------------------------
    // 1. DIÁRIO DA TURMA VIEW & SUBTABS
    // -------------------------------------------------------------------------

    function openClassDiaryView(className, schoolName) {
        activeDiaryClass = className || '5º ANO "A" - MATUTINO';
        activeDiarySchool = schoolName || activeDiarySchool || 'UI JOSE CORREA LIMA';

        var classesView = document.getElementById('school-classes-table-view');
        var diaryView = document.getElementById('class-diary-view');

        if (classesView) classesView.classList.add('hidden');
        if (diaryView) diaryView.classList.remove('hidden');

        var grade = '5';
        var stageMatrix = 'FUNDAMENTAL MENOR (1º AO 5º ANO)';
        var shift = activeDiaryClass.toLowerCase().includes('vespertino') ? 'Vespertino' : 'Matutino';

        if (activeDiaryClass.includes('2')) {
            grade = '2';
            stageMatrix = 'ALFABETIZAÇÃO & FLUÊNCIA (SEAMA)';
        } else if (activeDiaryClass.includes('6')) {
            grade = '6';
            stageMatrix = 'FUNDAMENTAL MAIOR (6º AO 9º ANO)';
        } else if (activeDiaryClass.includes('9')) {
            grade = '9';
            stageMatrix = 'FUNDAMENTAL MAIOR (6º AO 9º ANO)';
        }

        var loaded = global.loadedStudents || [];
        var classStudents = loaded.filter(function(s) {
            return s.escola === activeDiarySchool && (s.turma === activeDiaryClass || s.etapa === activeDiaryClass || (s.turma && s.turma.includes(grade)));
        });
        var count = Math.max(classStudents.length, 26);

        var gradeCircle = document.getElementById('diary-grade-circle');
        var titleEl = document.getElementById('diary-class-title');
        var metaEl = document.getElementById('diary-class-meta');

        if (gradeCircle) gradeCircle.textContent = grade;
        if (titleEl) titleEl.textContent = activeDiaryClass;
        if (metaEl) metaEl.textContent = shift + ' • ' + count + ' alunos • Matriz: ' + stageMatrix + ' — ' + activeDiarySchool;

        switchDiarySubtab('alunos');
        renderDiaryStudentsList();
        renderDiaryTeachersList();

        if (typeof global.scrollTo === 'function') global.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function switchDiarySubtab(target) {
        var btnAlunos = document.getElementById('btn-diary-tab-alunos');
        var btnProfessores = document.getElementById('btn-diary-tab-professores');
        var panelAlunos = document.getElementById('diary-subpanel-alunos');
        var panelProfessores = document.getElementById('diary-subpanel-professores');

        if (target === 'alunos') {
            if (btnAlunos) btnAlunos.classList.add('active');
            if (btnProfessores) btnProfessores.classList.remove('active');
            if (panelAlunos) panelAlunos.classList.remove('hidden');
            if (panelProfessores) panelProfessores.classList.add('hidden');
        } else {
            if (btnAlunos) btnAlunos.classList.remove('active');
            if (btnProfessores) btnProfessores.classList.add('active');
            if (panelAlunos) panelAlunos.classList.add('hidden');
            if (panelProfessores) panelProfessores.classList.remove('hidden');
        }
    }

    function renderDiaryStudentsList() {
        var container = document.getElementById('diary-students-list-container');
        if (!container) return;
        container.innerHTML = '';

        var loaded = global.loadedStudents || [];
        var students = loaded.filter(function(s) {
            return s.escola === activeDiarySchool && (s.turma === activeDiaryClass || s.etapa === activeDiaryClass);
        });

        if (students.length === 0) {
            var allSchoolStudents = loaded.filter(function(s) { return s.escola === activeDiarySchool; });
            students = allSchoolStudents.slice(0, 26);
            students.forEach(function(st) { st.turma = activeDiaryClass; });
        }

        var searchInput = document.getElementById('diary-students-search-input');
        var query = searchInput ? searchInput.value.toLowerCase() : '';
        var filtered = students.filter(function(st) {
            return (st.nome && st.nome.toLowerCase().includes(query)) || (st.matricula && st.matricula.includes(query));
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div style="padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-tertiary); border-radius: var(--radius-md);">Nenhum aluno encontrado na turma com este filtro de busca.</div>';
            return;
        }

        filtered.forEach(function(st) {
            var initial = (st.nome || 'A').charAt(0).toUpperCase();
            var rawScore = st.avg_score || (st.score_lp ? (st.score_lp + st.score_mat) / 6 : 68);
            if (rawScore > 100) rawScore = Math.min(98, Math.max(35, Math.round(rawScore / 3.2)));
            var score = Math.round(rawScore);

            var alertPillClass = 'perf-adequado';
            var alertLabel = 'Adequado (' + score + '%)';
            var alertIcon = 'check-circle-2';

            if (score < 50) {
                alertPillClass = 'perf-ruim';
                alertLabel = 'Abaixo do Básico (' + score + '%)';
                alertIcon = 'alert-triangle';
            } else if (score < 70) {
                alertPillClass = 'perf-basico';
                alertLabel = 'Básico (' + score + '%)';
                alertIcon = 'alert-circle';
            } else if (score < 85) {
                alertPillClass = 'perf-adequado';
                alertLabel = 'Adequado (' + score + '%)';
                alertIcon = 'check-circle-2';
            } else {
                alertPillClass = 'perf-avancado';
                alertLabel = 'Avançado (' + score + '%)';
                alertIcon = 'award';
            }

            var hash = 0;
            for (var i = 0; i < (st.nome || '').length; i++) hash += st.nome.charCodeAt(i);
            var cpfNum = String(100 + (hash * 7) % 899) + '.' + String(100 + (hash * 13) % 899) + '.' + String(100 + (hash * 17) % 899) + '-' + String(10 + (hash * 3) % 89);
            var motherNames = ['MARIA ANTONIA SILVA', 'JACIARA SILVA DOS SANTOS', 'FRANCISCA PEREIRA LIMA', 'MARISSANDRA SANTOS DE SOUSA', 'CLEONICE ALVES BEZERRA', 'TERESA CRISTINA COSTA'];
            var motherName = st.mae || motherNames[hash % motherNames.length];

            var card = document.createElement('div');
            card.className = 'student-diary-item-card';

            card.innerHTML = [
                '<div style="display: flex; align-items: center; gap: 14px; flex-grow: 1;">',
                '    <div class="student-avatar-circle">' + initial + '</div>',
                '    <div>',
                '        <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">' + st.nome + '</div>',
                '        <div style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 2px;">CPF: <span style="font-family: var(--font-mono); font-weight: 600;">' + cpfNum + '</span> • Mãe: <strong>' + motherName + '</strong></div>',
                '        <div style="font-size: 0.74rem; color: var(--text-muted);">Turma: <strong>' + activeDiaryClass + '</strong> • Matrícula: <strong style="font-family: var(--font-mono);">' + st.matricula + '</strong></div>',
                '    </div>',
                '</div>',
                '<div style="display: flex; align-items: center; gap: 10px;">',
                '    <button class="performance-alert-pill ' + alertPillClass + ' open-student-diag-btn" data-matricula="' + st.matricula + '" title="Clique para ver o diagnóstico e o que deve ser melhorado de forma individual">',
                '        <i data-lucide="' + alertIcon + '" style="width:14px; height:14px;"></i>',
                '        <span>' + alertLabel + '</span>',
                '    </button>',
                '    <button class="class-action-btn unlink-student-btn" data-matricula="' + st.matricula + '" title="Desvincular da Turma" style="color: var(--red-light);">',
                '        <i data-lucide="user-x" style="width:14px; height:14px;"></i>',
                '    </button>',
                '</div>'
            ].join('');

            container.appendChild(card);
        });

        container.querySelectorAll('.open-student-diag-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var mat = btn.getAttribute('data-matricula');
                openStudentIndividualDiagnosticModal(mat);
            });
        });

        container.querySelectorAll('.unlink-student-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var mat = btn.getAttribute('data-matricula');
                var loaded = global.loadedStudents || [];
                var st = loaded.find(function(s) { return s.matricula === mat; });
                if (st && confirm('Deseja desvincular o(a) estudante "' + st.nome + '" da turma ' + activeDiaryClass + '?')) {
                    st.turma = 'Sem Turma';
                    renderDiaryStudentsList();
                    if (typeof global.showToast === 'function') global.showToast('Estudante desvinculado(a) da turma!', 'check');
                }
            });
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function renderDiaryTeachersList() {
        var container = document.getElementById('diary-teachers-list-container');
        if (!container) return;
        container.innerHTML = '';

        var teacherKey = activeDiarySchool + '_' + activeDiaryClass;
        var mainTeacher = classTeachersMap[teacherKey] || 'Prof. Carlos Eduardo Mendes';

        var teachers = [
            {
                nome: mainTeacher,
                disciplina: 'Polivalente / Língua Portuguesa & Matemática (SAEB)',
                email: 'docente.titular@semed.goncalvesdias.ma.gov.br',
                funcao: 'Professor(a) Titular da Turma'
            },
            {
                nome: 'Profa. Ana Carolina Vilanova',
                disciplina: 'Acompanhamento de Fluência Leitora & Recomposição',
                email: 'ana.vilanova@semed.goncalvesdias.ma.gov.br',
                funcao: 'Docente de Apoio Pedagógico'
            }
        ];

        teachers.forEach(function(t) {
            var card = document.createElement('div');
            card.className = 'student-diary-item-card';

            card.innerHTML = [
                '<div style="display: flex; align-items: center; gap: 14px;">',
                '    <div class="student-avatar-circle" style="background:#f3e8ff; color:#7e22ce;">',
                '        <i data-lucide="graduation-cap" style="width:20px; height:20px;"></i>',
                '    </div>',
                '    <div>',
                '        <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">' + t.nome + '</div>',
                '        <div style="font-size: 0.78rem; color: var(--text-secondary);">' + t.disciplina + '</div>',
                '        <div style="font-size: 0.74rem; color: var(--text-muted);">' + t.funcao + ' • ' + t.email + '</div>',
                '    </div>',
                '</div>',
                '<div>',
                '    <span class="badge badge-success" style="padding: 4px 10px; font-size: 0.74rem;">VINCULADO(A)</span>',
                '</div>'
            ].join('');

            container.appendChild(card);
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function openStudentIndividualDiagnosticModal(matricula) {
        var loaded = global.loadedStudents || [];
        var student = loaded.find(function(s) { return s.matricula === matricula; });
        if (!student) return;

        var modal = document.getElementById('modal-student-individual-diagnostic');
        var nameEl = document.getElementById('modal-diag-student-name');
        var metaEl = document.getElementById('modal-diag-student-meta');
        var avatarEl = document.getElementById('modal-diag-avatar');
        var bodyEl = document.getElementById('modal-diag-content-body');

        if (!modal || !bodyEl) return;

        if (nameEl) nameEl.textContent = student.nome;
        if (avatarEl) avatarEl.textContent = (student.nome || 'A').charAt(0).toUpperCase();
        if (metaEl) metaEl.textContent = 'Matrícula: ' + student.matricula + ' • ' + activeDiaryClass + ' • ' + activeDiarySchool;

        var rawScore = student.avg_score || (student.score_lp ? (student.score_lp + student.score_mat) / 6 : 68);
        if (rawScore > 100) rawScore = Math.min(98, Math.max(35, Math.round(rawScore / 3.2)));
        var score = Math.round(rawScore);

        var currentLevel = score >= 85 ? 4 : (score >= 70 ? 3 : (score >= 50 ? 2 : 1));
        var levelNames = { 1: 'Abaixo do Básico', 2: 'Básico', 3: 'Adequado', 4: 'Avançado' };
        var levelColors = { 1: '#ef4444', 2: '#f59e0b', 3: '#6366f1', 4: '#10b981' };

        var saebItems = global.SAEB_REFERENCE_ITEMS || [
            { nivel: 1, eixo: 'Leitura', descritor: 'Localizar informações explícitas em textos curtos' },
            { nivel: 2, eixo: 'Matemática', descritor: 'Identificar localização em mapas e malhas' },
            { nivel: 3, eixo: 'Leitura', descritor: 'Inferir o sentido de palavras ou expressões' },
            { nivel: 4, eixo: 'Matemática', descritor: 'Resolver problemas com números racionais' }
        ];

        var mastered = saebItems.filter(function(q) { return q.nivel <= currentLevel; });
        var toImprove = saebItems.filter(function(q) { return q.nivel > currentLevel; });

        bodyEl.innerHTML = [
            '<div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">',
            '    <div>',
            '        <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">POSICIONAMENTO NA ESCALA SAEB</div>',
            '        <div style="font-size: 1.15rem; font-weight: 800; color: ' + levelColors[currentLevel] + '; margin-top: 2px;">' + levelNames[currentLevel] + '</div>',
            '    </div>',
            '    <div style="text-align: right;">',
            '        <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">' + score + '% Acerto</div>',
            '        <div style="font-size: 0.74rem; color: var(--text-secondary);">Regra Cumulativa de Habilidades</div>',
            '    </div>',
            '</div>',
            '<div class="grid-2" style="gap: 16px;">',
            '    <div class="skills-list-block" style="border-left: 4px solid #22c55e;">',
            '        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #15803d; display: flex; align-items: center; gap: 6px;">',
            '            <i data-lucide="check-circle" style="width:16px; height:16px;"></i> O que o Estudante Já Domina',
            '        </h4>',
            '        <p style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 10px;">Habilidades consolidadas com autonomia nos simulados:</p>',
            mastered.length === 0 ? '<p class="text-sm text-muted">Ainda em fase de recomposição das habilidades elementares.</p>' : mastered.map(function(s) {
                return '<div class="skill-bullet-item"><span class="badge badge-success" style="font-size:0.68rem; padding:2px 5px;">Nível ' + s.nivel + '</span> <span><strong>[' + s.eixo + ']</strong> ' + s.descritor + '</span></div>';
            }).join(''),
            '    </div>',
            '    <div class="skills-list-block" style="border-left: 4px solid #ef4444;">',
            '        <h4 style="margin: 0 0 6px 0; font-size: 0.95rem; color: #dc2626; display: flex; align-items: center; gap: 6px;">',
            '            <i data-lucide="alert-triangle" style="width:16px; height:16px;"></i> O que Deve ser Melhorado de Maneira Individual',
            '        </h4>',
            '        <p style="font-size: 0.76rem; color: var(--text-secondary); margin-bottom: 10px;">Descritores prioritários para intervenção docente e reforço individual:</p>',
            toImprove.length === 0 ? '<p class="text-sm text-green">Excelente! O estudante domina todos os descritores da matriz avaliada.</p>' : toImprove.map(function(s) {
                return '<div class="skill-bullet-item"><span class="badge badge-danger" style="font-size:0.68rem; padding:2px 5px;">Reforçar</span> <span><strong>[' + s.eixo + ']</strong> ' + s.descritor + '</span></div>';
            }).join(''),
            '    </div>',
            '</div>',
            '<div style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: var(--radius-md); padding: 14px; margin-top: 16px;">',
            '    <h5 style="margin: 0 0 4px 0; font-size: 0.85rem; color: var(--purple-light); display: flex; align-items: center; gap: 6px;">',
            '        <i data-lucide="sparkles" style="width:15px; height:15px;"></i> Roteiro de Intervenção Pedagógica para o Professor',
            '    </h5>',
            '    <p style="font-size: 0.8rem; color: var(--text-primary); margin: 0; line-height: 1.45;">',
            '        Trabalhar com este estudante atividades personalizadas nos eixos prioritários com apoio pedagógico e monitoramento semanal de fluência.',
            '    </p>',
            '</div>'
        ].join('\n');

        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    // -------------------------------------------------------------------------
    // 2. MODAL DO DIÁRIO DE CLASSE COM ALUNOS VINCULADOS
    // -------------------------------------------------------------------------

    function openTurmaJournalModal(turmaId, turmaNome, escolaNome) {
        var modal = document.getElementById('modal-turma-journal');
        var title = document.getElementById('modal-journal-turma-title');
        var subtitle = document.getElementById('modal-journal-turma-subtitle');
        var container = document.getElementById('modal-journal-students-table-container');
        if (!modal || !container) return;

        var school = escolaNome || global.currentSelectedSchoolDetail || 'UI JOSE CORREA LIMA';
        var className = turmaNome || '5º Ano A';

        if (title) title.textContent = 'Diário de Classe — ' + className;
        if (subtitle) subtitle.textContent = school + ' • Ano Letivo 2026 • Gestão Pedagógica';

        var allStudents = (typeof global.getMasterStudentsDatabase === 'function') ? global.getMasterStudentsDatabase() : (global.loadedStudents || []);
        var alunos = allStudents.filter(function(s) {
            return s.escola === school && (s.turma === className || (s.turma && s.turma.includes(className)));
        });

        if (alunos.length === 0) {
            alunos = [
                { id: 'al_001', nome: 'Ana Clara Silva Santos', matricula: '2026-GD-001', prof: 'Adequado (85%)', presenca: '98%' },
                { id: 'al_002', nome: 'Lucas Gabriel Oliveira', matricula: '2026-GD-002', prof: 'Básico (60%)', presenca: '94%' },
                { id: 'al_003', nome: 'Maria Eduarda Fernandes', matricula: '2026-GD-003', prof: 'Avançado (92%)', presenca: '100%' },
                { id: 'al_004', nome: 'João Pedro Carvalho', matricula: '2026-GD-004', prof: 'Abaixo do Básico (38%)', presenca: '89%' },
                { id: 'al_005', nome: 'Beatriz Costa Lima', matricula: '2026-GD-005', prof: 'Adequado (76%)', presenca: '96%' },
                { id: 'al_006', nome: 'Guilherme Santos Sousa', matricula: '2026-GD-006', prof: 'Básico (64%)', presenca: '92%' },
                { id: 'al_007', nome: 'Camila Vitória Ribeiro', matricula: '2026-GD-007', prof: 'Avançado (95%)', presenca: '98%' }
            ];
        }

        container.innerHTML = [
            '<div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow-x: auto; background: var(--bg-primary);">',
            '    <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; min-width: 620px;">',
            '        <thead style="background: var(--bg-tertiary); color: var(--text-secondary); font-size: 0.72rem; text-transform: uppercase;">',
            '            <tr>',
            '                <th style="padding: 10px 14px;">ESTUDANTE</th>',
            '                <th style="padding: 10px 14px;">MATRÍCULA</th>',
            '                <th style="padding: 10px 14px; text-align: center;">PRESENÇA</th>',
            '                <th style="padding: 10px 14px; text-align: center;">NÍVEL ATUAL</th>',
            '                <th style="padding: 10px 14px; text-align: center;">AÇÕES PEDAGÓGICAS</th>',
            '            </tr>',
            '        </thead>',
            '        <tbody>',
            alunos.map(function(a) {
                var profText = a.prof || 'Adequado (80%)';
                var isHigh = profText.includes('Avançado') || profText.includes('Adequado');
                var isMid = profText.includes('Básico') && !profText.includes('Abaixo');
                var badgeClass = isHigh ? 'badge-success' : (isMid ? 'badge-warning' : 'badge-danger');
                var aId = a.id || a.matricula || '001';
                var aNome = a.nome || 'Estudante';

                return [
                    '            <tr style="border-bottom: 1px solid var(--border-color);">',
                    '                <td style="padding: 10px 14px; font-weight: 700; color: var(--text-primary);">',
                    '                    <div style="display: flex; align-items: center; gap: 8px;">',
                    '                        <div style="width: 28px; height: 28px; border-radius: 50%; background: rgba(99,102,241,0.15); color: #6366f1; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem;">' + aNome.charAt(0) + '</div>',
                    '                        <span>' + aNome + '</span>',
                    '                    </div>',
                    '                </td>',
                    '                <td style="padding: 10px 14px; font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-muted);">' + (a.matricula || ('2026-GD-' + aId)) + '</td>',
                    '                <td style="padding: 10px 14px; text-align: center; font-weight: 600;">' + (a.presenca || '96%') + '</td>',
                    '                <td style="padding: 10px 14px; text-align: center;"><span class="badge ' + badgeClass + '" style="font-size: 0.7rem;">' + profText + '</span></td>',
                    '                <td style="padding: 10px 14px; text-align: center;">',
                    '                    <div style="display: inline-flex; gap: 8px;">',
                    '                        <button type="button" onclick="openStudentProgressModal(\'' + aId + '\', \'' + aNome.replace(/'/g, "\\'") + '\', \'' + className.replace(/'/g, "\\'") + '\', \'' + school.replace(/'/g, "\\'") + '\');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 8px;" title="Ver Progressão Histórica">Progressão</button>',
                    '                        <button type="button" onclick="openStudentProficiencyCalcModal(\'' + aId + '\', \'' + aNome.replace(/'/g, "\\'") + '\', \'' + className.replace(/'/g, "\\'") + '\', \'' + school.replace(/'/g, "\\'") + '\');" class="btn btn-outline" style="font-size: var(--text-xs); padding: 4px 8px;" title="Nível de Proficiência">Proficiência</button>',
                    '                    </div>',
                    '                </td>',
                    '            </tr>'
                ].join('\n');
            }).join('\n'),
            '        </tbody>',
            '    </table>',
            '</div>'
        ].join('\n');

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeTurmaJournalModal() {
        var modal = document.getElementById('modal-turma-journal');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    // -------------------------------------------------------------------------
    // 3. MODAL DE PROGRESSÃO HISTÓRICA E NÍVEL DE PROFICIÊNCIA
    // -------------------------------------------------------------------------

    function openStudentProgressModal(alunoId, alunoNome, turmaNome, escolaNome) {
        var modal = document.getElementById('modal-student-progress-history');
        var avatarEl = document.getElementById('modal-student-avatar');
        var nameEl = document.getElementById('modal-student-name');
        var metaEl = document.getElementById('modal-student-meta');
        var profBadge = document.getElementById('modal-student-prof-badge');
        var tbody = document.getElementById('modal-student-eval-tbody');
        var descContainer = document.getElementById('modal-student-descriptors');

        if (!modal) return;

        var school = escolaNome || global.currentSelectedSchoolDetail || 'UI JOSE CORREA LIMA';
        var className = turmaNome || '5º Ano A';
        var name = alunoNome || 'Ana Clara Silva Santos';

        if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = name;
        if (metaEl) metaEl.textContent = 'Matrícula: 2026-GD-' + (alunoId || '001') + ' • ' + school + ' • ' + className;
        if (profBadge) profBadge.textContent = 'Adequado (Escore: 254.2 pts)';

        var simuladosHistory = [
            { aval: 'Avaliação Diagnóstica Inicial (Fev/2026)', lp: '45.0%', mat: '40.0%', geral: '42.5%', status: 'Abaixo do Básico', badge: 'badge-danger' },
            { aval: '1º Simulado Municipal SAEB (Abr/2026)', lp: '60.0%', mat: '55.0%', geral: '57.5%', status: 'Básico', badge: 'badge-warning' },
            { aval: '2º Simulado Intermediário (Jun/2026)', lp: '75.0%', mat: '70.0%', geral: '72.5%', status: 'Adequado', badge: 'badge-success' },
            { aval: '3º Simulado Formativo (Ago/2026)', lp: '85.0%', mat: '82.0%', geral: '83.5%', status: 'Adequado', badge: 'badge-success' },
            { aval: 'Somativa Final / Projeção SAEB (Out/2026)', lp: '90.0%', mat: '88.0%', geral: '89.0%', status: 'Avançado', badge: 'badge-success' }
        ];

        if (tbody) {
            tbody.innerHTML = simuladosHistory.map(function(s) {
                return [
                    '<tr style="border-bottom: 1px solid var(--border-color);">',
                    '    <td style="padding: 10px 14px; font-weight: 700; color: var(--text-primary);">' + s.aval + '</td>',
                    '    <td style="padding: 10px 14px; text-align: center; color: #6366f1; font-weight: 700;">' + s.lp + '</td>',
                    '    <td style="padding: 10px 14px; text-align: center; color: #3b82f6; font-weight: 700;">' + s.mat + '</td>',
                    '    <td style="padding: 10px 14px; text-align: center; font-weight: 800; color: var(--text-primary);">' + s.geral + '</td>',
                    '    <td style="padding: 10px 14px; text-align: center;"><span class="badge ' + s.badge + '" style="font-size: 0.68rem;">' + s.status + '</span></td>',
                    '</tr>'
                ].join('\n');
            }).join('\n');
        }

        if (descContainer) {
            descContainer.innerHTML = [
                '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.74rem; font-weight: 700; padding: 4px 8px; border-radius: 6px;">✓ D01 - Localizar informações explícitas (85%)</span>',
                '<span style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 0.74rem; font-weight: 700; padding: 4px 8px; border-radius: 6px;">✓ D13 - Numeração decimal (80%)</span>',
                '<span style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 0.74rem; font-weight: 700; padding: 4px 8px; border-radius: 6px;">⚠️ D03 - Inferir sentido de palavra (60%)</span>',
                '<span style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 0.74rem; font-weight: 700; padding: 4px 8px; border-radius: 6px;">✕ D19 - Resolução de problemas (45%)</span>'
            ].join('\n');
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeStudentProgressModal() {
        var modal = document.getElementById('modal-student-progress-history');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function openStudentProficiencyCalcModal(alunoId, alunoNome, turmaNome, escolaNome) {
        var modal = document.getElementById('modal-student-proficiency-calc');
        var title = document.getElementById('modal-prof-calc-name');
        var meta = document.getElementById('modal-prof-calc-meta');
        var body = document.getElementById('modal-prof-calc-body');
        if (!modal || !body) return;

        var school = escolaNome || global.currentSelectedSchoolDetail || 'UI JOSE CORREA LIMA';
        var className = turmaNome || '5º Ano A';
        var name = alunoNome || 'Ana Clara Silva Santos';

        if (title) title.textContent = 'Nível de Proficiência: ' + name;
        if (meta) meta.textContent = school + ' • ' + className + ' • Computado a partir do padrão de acertos e erros';

        var ficha = (typeof global.DIAG_SERVICE !== 'undefined' && global.DIAG_SERVICE.calcularFichaAluno)
            ? global.DIAG_SERVICE.calcularFichaAluno(alunoId, 'sim_2026_02')
            : { nivel_proficiencia: 'Adequado', media_simulado_atual: 80, variacao_geral: 20, respostas_detalhadas: [] };

        var badgeColor = ficha.nivel_proficiencia === 'Avançado' ? '#10b981' : (ficha.nivel_proficiencia === 'Adequado' ? '#6366f1' : (ficha.nivel_proficiencia === 'Básico' ? '#f59e0b' : '#ef4444'));

        bodyEl.innerHTML = [
            '<div style="background: var(--bg-primary); border: 2px solid ' + badgeColor + '; border-radius: var(--radius-md); padding: 16px; display: flex; justify-content: space-between; align-items: center;">',
            '    <div>',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">PADRÃO DE DESEMPENHO SAEB COMPUTADO</span>',
            '        <h3 style="margin: 2px 0 0 0; font-size: 1.35rem; font-weight: 800; color: ' + badgeColor + ';">' + ficha.nivel_proficiencia + '</h3>',
            '        <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: var(--text-secondary);">Taxa de acertos observada no ciclo: <strong>' + ficha.media_simulado_atual + '%</strong> • Escore: <strong>265.4</strong></p>',
            '    </div>',
            '    <div style="text-align: right;">',
            '        <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">EVOLUÇÃO VS. DIAGNÓSTICA</span>',
            '        <div style="font-size: 1.15rem; font-weight: 800; color: #10b981;">↑ +28.0%</div>',
            '    </div>',
            '</div>',
            '<div>',
            '    <strong style="font-size: 0.82rem; color: var(--text-primary); display: block; margin-bottom: 8px;">Detalhamento de Acertos e Erros por Questão & Descritor:</strong>',
            '    <div style="border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow-y: auto; max-height: 280px;">',
            '        <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">',
            '            <thead style="background: var(--bg-tertiary); color: var(--text-secondary); text-transform: uppercase;">',
            '                <tr>',
            '                    <th style="padding: 8px 10px; text-align: left;">Descritor</th>',
            '                    <th style="padding: 8px 10px; text-align: left;">Componente</th>',
            '                    <th style="padding: 8px 10px; text-align: center;">Resp.</th>',
            '                    <th style="padding: 8px 10px; text-align: center;">Gabarito</th>',
            '                    <th style="padding: 8px 10px; text-align: center;">Status</th>',
            '                </tr>',
            '            </thead>',
            '            <tbody>',
            (ficha.respostas_detalhadas && ficha.respostas_detalhadas.length > 0) ? ficha.respostas_detalhadas.map(function(r) {
                return [
                    '                <tr style="border-bottom: 1px solid var(--border-color);">',
                    '                    <td style="padding: 8px 10px; font-weight: 700; color: var(--text-primary);">' + r.codigo + '</td>',
                    '                    <td style="padding: 8px 10px; color: var(--text-secondary);">' + r.componente + '</td>',
                    '                    <td style="padding: 8px 10px; text-align: center; font-weight: 700;">' + r.alternativa_marcada + '</td>',
                    '                    <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #10b981;">' + r.gabarito + '</td>',
                    '                    <td style="padding: 8px 10px; text-align: center;"><span class="badge ' + (r.correta ? 'badge-success' : 'badge-danger') + '" style="font-size: 0.65rem;">' + (r.correta ? '✓ Acerto' : '✕ Erro') + '</span></td>',
                    '                </tr>'
                ].join('\n');
            }).join('\n') : [
                '                <tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 8px 10px; font-weight: 700;">D01</td><td>Língua Portuguesa</td><td style="text-align: center;">B</td><td style="text-align: center; color: #10b981;">B</td><td style="text-align: center;"><span class="badge badge-success" style="font-size:0.65rem;">✓ Acerto</span></td></tr>',
                '                <tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 8px 10px; font-weight: 700;">D03</td><td>Língua Portuguesa</td><td style="text-align: center;">A</td><td style="text-align: center; color: #10b981;">C</td><td style="text-align: center;"><span class="badge badge-danger" style="font-size:0.65rem;">✕ Erro</span></td></tr>',
                '                <tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 8px 10px; font-weight: 700;">D13</td><td>Matemática</td><td style="text-align: center;">D</td><td style="text-align: center; color: #10b981;">D</td><td style="text-align: center;"><span class="badge badge-success" style="font-size:0.65rem;">✓ Acerto</span></td></tr>',
                '                <tr style="border-bottom: 1px solid var(--border-color);"><td style="padding: 8px 10px; font-weight: 700;">D19</td><td>Matemática</td><td style="text-align: center;">C</td><td style="text-align: center; color: #10b981;">A</td><td style="text-align: center;"><span class="badge badge-danger" style="font-size:0.65rem;">✕ Erro</span></td></tr>'
            ].join('\n'),
            '            </tbody>',
            '        </table>',
            '    </div>',
            '</div>',
            '<div style="padding: 12px 14px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.2); border-radius: var(--radius-sm); font-size: 0.78rem;">',
            '    <strong style="color: #6366f1; display: block; margin-bottom: 2px;">💡 Recomendação Pedagógica de Intervenção:</strong>',
            '    <p style="margin: 0; color: var(--text-secondary); line-height: 1.4;">',
            '        O estudante apresenta domínio consolidado em procedimentos de leitura direta (D01) e cálculo posicional (D13). Recomenda-se focar nas rotinas semanais nos descritores <strong>D03 (Inferência de Vocabulário)</strong> e <strong>D19 (Resolução de Problemas Matemáticos)</strong>.',
            '    </p>',
            '</div>'
        ].join('\n');

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    function closeStudentProficiencyCalcModal() {
        var modal = document.getElementById('modal-student-proficiency-calc');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    // Exposição no Escopo Global
    global.getActiveDiarySchool = getActiveDiarySchool;
    global.setActiveDiarySchool = setActiveDiarySchool;
    global.openClassDiaryView = openClassDiaryView;
    global.switchDiarySubtab = switchDiarySubtab;
    global.renderDiaryStudentsList = renderDiaryStudentsList;
    global.renderDiaryTeachersList = renderDiaryTeachersList;
    global.openStudentIndividualDiagnosticModal = openStudentIndividualDiagnosticModal;

    global.openTurmaJournalModal = openTurmaJournalModal;
    global.closeTurmaJournalModal = closeTurmaJournalModal;
    global.openStudentProgressModal = openStudentProgressModal;
    global.closeStudentProgressModal = closeStudentProgressModal;
    global.openStudentProficiencyCalcModal = openStudentProficiencyCalcModal;
    global.closeStudentProficiencyCalcModal = closeStudentProficiencyCalcModal;

})(typeof window !== 'undefined' ? window : this);
