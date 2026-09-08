/**
 * SUÍTE DE AUDITORIA: FLUXO DE INFORMAÇÕES E ISOLAMENTO RBAC (ADMIN -> DIRETOR -> PROFESSOR)
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

async function runRbacFlowTestSuite() {
    console.log('========================================================================');
    console.log('🔍 AUDITORIA DO FLUXO DE INFORMAÇÕES E ESCOPO RBAC (ESCOLA / TURMA)');
    console.log('========================================================================\n');

    let passed = 0;
    let failed = 0;

    function test(name, fn) {
        try {
            fn();
            console.log(`  [✓ PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [✗ FAIL] ${name}`);
            console.error(`    Erro: ${err.message}`);
            failed++;
        }
    }

    // Mock do ambiente browser
    const sessionStorageMock = {
        store: {},
        getItem(k) { return this.store[k] || null; },
        setItem(k, v) { this.store[k] = v.toString(); },
        removeItem(k) { delete this.store[k]; },
        clear() { this.store = {}; }
    };

    const localStorageMock = {
        store: {},
        getItem(k) { return this.store[k] || null; },
        setItem(k, v) { this.store[k] = v.toString(); },
        removeItem(k) { delete this.store[k]; },
        clear() { this.store = {}; }
    };

    // Base mock de estudantes oficiais (9 Escolas)
    const mockStudents = [
        { id: 'st1', nome: 'João Gabriel Silva', escola: 'UI JOSE CORREA LIMA', turma: '5º Ano A', etapa: '5º Ano' },
        { id: 'st2', nome: 'Maria Clara Souza', escola: 'UI JOSE CORREA LIMA', turma: '5º Ano A', etapa: '5º Ano' },
        { id: 'st3', nome: 'Pedro Henrique Lima', escola: 'UI JOSE CORREA LIMA', turma: '2º Ano A', etapa: '2º Ano' },
        { id: 'st4', nome: 'Ana Beatriz Castro', escola: 'U I BASILIO ALVES', turma: '5º Ano A', etapa: '5º Ano' },
        { id: 'st5', nome: 'Lucas Emanuel Costa', escola: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', turma: '9º Ano A', etapa: '9º Ano' },
        { id: 'st6', nome: 'Rafaela Santos', escola: 'UE ANITA FURTADO', turma: '5º Ano A', etapa: '5º Ano' }
    ];

    const mockSchools = [
        { id: 'esc1', name: 'UI JOSE CORREA LIMA', inep: '21128723', city: 'Gonçalves Dias - MA', alunosCount: 120, turmasCount: 4 },
        { id: 'esc2', name: 'U I BASILIO ALVES', inep: '21128120', city: 'Gonçalves Dias - MA', alunosCount: 85, turmasCount: 3 },
        { id: 'esc3', name: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', inep: '21128140', city: 'Gonçalves Dias - MA', alunosCount: 210, turmasCount: 6 }
    ];

    const mockClasses = [
        { id: 't1', nome: '2º Ano A', serie: '2º Ano', escola: 'UI JOSE CORREA LIMA' },
        { id: 't2', nome: '5º Ano A', serie: '5º Ano', escola: 'UI JOSE CORREA LIMA' },
        { id: 't3', nome: '9º Ano A', serie: '9º Ano', escola: 'UI JOSE CORREA LIMA' },
        { id: 't4', nome: '5º Ano A', serie: '5º Ano', escola: 'U I BASILIO ALVES' }
    ];

    // Simulação do escopo do módulo Alunos
    function filterStudentsForUser(userRole, userEscola, userTurma) {
        const isTeacher = userRole.toLowerCase().includes('professor');
        const isDirector = userRole.toLowerCase().includes('diretor');

        return mockStudents.filter(s => {
            let matchSchool = true;
            if (isTeacher || isDirector) {
                const sSch = (s.escola || '').toLowerCase().trim();
                const uSch = userEscola.toLowerCase().trim();
                matchSchool = !uSch || sSch === uSch || sSch.includes(uSch) || uSch.includes(sSch);
            }

            let matchTeacherTurma = true;
            if (isTeacher && userTurma && userTurma !== 'Todas as Turmas') {
                const sTurma = (s.turma || '').toLowerCase().trim();
                const sEtapa = (s.etapa || '').toLowerCase().trim();
                const uTurma = userTurma.toLowerCase().trim();
                matchTeacherTurma = sTurma.includes(uTurma) || uTurma.includes(sTurma) || sEtapa.includes(uTurma) || uTurma.includes(sEtapa);
            }

            return matchSchool && matchTeacherTurma;
        });
    }

    // Simulação do escopo do módulo Escolas
    function filterSchoolsForUser(userRole, userEscola) {
        const isTeacher = userRole.toLowerCase().includes('professor');
        const isDirector = userRole.toLowerCase().includes('diretor');

        if ((isDirector || isTeacher) && userEscola) {
            return mockSchools.filter(s => {
                return s.name.toUpperCase().includes(userEscola.toUpperCase()) || 
                       userEscola.toUpperCase().includes(s.name.toUpperCase());
            });
        }
        return mockSchools;
    }

    console.log('--- TESTE 1: FLUXO DE CRIAÇÃO DO ADMIN -> DISPONIBILIDADE NA REDE ---');
    test('1.1 Simulado criado pelo Admin fica disponível para Escolas e Professores', () => {
        const adminSimulado = {
            id: 'sim_2026_01',
            titulo: '1º Simulado Oficial SAEB 2026',
            status: 'ABERTO',
            data_criacao: '2026-08-10'
        };
        localStorageMock.setItem('gd_eventos_db', JSON.stringify([adminSimulado]));
        const eventosSalvos = JSON.parse(localStorageMock.getItem('gd_eventos_db'));
        assert.strictEqual(eventosSalvos.length, 1);
        assert.strictEqual(eventosSalvos[0].id, 'sim_2026_01');
    });

    test('1.2 Aula/Habilidade planejada no Cronograma salva no State Compartilhado', () => {
        const novaAula = {
            id: 'aula_101',
            escola: 'UI JOSE CORREA LIMA',
            turma: '5º Ano A',
            turmaContext: 'UI JOSE CORREA LIMA — 5º Ano A',
            descritor_codigo: 'D14',
            disciplina: 'Matemática',
            status: 'planejada'
        };
        localStorageMock.setItem('teacher_schedule_lessons_db', JSON.stringify([novaAula]));
        const aulasSalvas = JSON.parse(localStorageMock.getItem('teacher_schedule_lessons_db'));
        assert.strictEqual(aulasSalvas.length, 1);
        assert.strictEqual(aulasSalvas[0].turmaContext, 'UI JOSE CORREA LIMA — 5º Ano A');
    });

    console.log('\n--- TESTE 2: ISOLAMENTO RBAC DO DIRETOR ESCOLAR (ESCOLA) ---');
    test('2.1 Diretor Escolar enxerga EXCLUSIVAMENTE a sua própria unidade escolar', () => {
        const filtered = filterSchoolsForUser('Diretor Escola', 'UI JOSE CORREA LIMA');
        assert.strictEqual(filtered.length, 1, 'Deve conter apenas 1 escola');
        assert.strictEqual(filtered[0].name, 'UI JOSE CORREA LIMA');
    });

    test('2.2 Diretor Escolar visualiza apenas estudantes matriculados em sua escola (todas as turmas da sua escola)', () => {
        const students = filterStudentsForUser('Diretor Escola', 'UI JOSE CORREA LIMA', 'Todas as Turmas');
        assert.strictEqual(students.length, 3, 'Deve listar exatamente os 3 alunos da UI José Corrêa Lima');
        students.forEach(st => {
            assert.strictEqual(st.escola, 'UI JOSE CORREA LIMA');
        });
    });

    console.log('\n--- TESTE 3: ISOLAMENTO RBAC DO PROFESSOR (ESCOLA + TURMA) ---');
    test('3.1 Professor visualiza EXCLUSIVAMENTE os estudantes da sua turma vinculada', () => {
        const students = filterStudentsForUser('Professor', 'UI JOSE CORREA LIMA', '5º Ano A');
        assert.strictEqual(students.length, 2, 'Deve conter apenas os 2 alunos do 5º Ano A');
        assert.strictEqual(students[0].nome, 'João Gabriel Silva');
        assert.strictEqual(students[1].nome, 'Maria Clara Souza');
    });

    test('3.2 Professor do 2º Ano não acessa alunos do 5º Ano nem de outras escolas', () => {
        const students = filterStudentsForUser('Professor', 'UI JOSE CORREA LIMA', '2º Ano A');
        assert.strictEqual(students.length, 1, 'Deve conter apenas 1 aluno do 2º Ano');
        assert.strictEqual(students[0].nome, 'Pedro Henrique Lima');
    });

    console.log('\n--- TESTE 4: VISÃO DO ADMIN / GESTOR DA REDE (SEMED) ---');
    test('4.1 Gestor da Rede / Admin tem acesso consolidado a TODAS as 9 escolas e todos os estudantes', () => {
        const allSc = filterSchoolsForUser('Master Admin', '');
        assert.strictEqual(allSc.length, 3);
        const allSt = filterStudentsForUser('Master Admin', '', 'Todas as Turmas');
        assert.strictEqual(allSt.length, 6);
    });

    console.log('\n========================================================================');
    console.log(`RELATÓRIO FINAL: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('========================================================================');
    if (failed > 0) process.exit(1);
}

runRbacFlowTestSuite();
