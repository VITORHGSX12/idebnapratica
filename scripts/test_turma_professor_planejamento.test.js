/**
 * Test Suite: Vínculo Professor ↔ Turma, Restrição de Visão, Planejamento e Progressão Individual
 * Arquivo: scripts/test_turma_professor_planejamento.test.js
 */

const assert = require('assert');
const planejamentoService = require('../services/planejamento_turmas_service');

async function runTests() {
    console.log('\n============================================================');
    console.log('🧪 INICIANDO TESTES DO MÓDULO PROFESSOR, TURMAS & PLANEJAMENTO');
    console.log('============================================================\n');

    const testTurmaId = 'turma_test_5a_' + Date.now();
    const testTurmaId2 = 'turma_test_9b_' + Date.now();
    const testProfId1 = 'prof_test_carlos_' + Date.now();
    const testProfId2 = 'prof_test_ana_' + Date.now();

    // -------------------------------------------------------------
    // Teste 1: Vínculo N:N Professor ↔ Turma
    // -------------------------------------------------------------
    console.log('▶ Teste 1: Vínculo N:N Professor ↔ Turma...');
    
    // Vincular prof 1 à turma 1
    const link1 = await planejamentoService.linkProfessorToTurma(testTurmaId, testProfId1, 'titular');
    assert.strictEqual(link1.success, true, 'Deveria vincular prof 1 à turma 1');

    // Vincular prof 1 à turma 2 (1 professor lecionando em múltiplas turmas)
    const link2 = await planejamentoService.linkProfessorToTurma(testTurmaId2, testProfId1, 'titular');
    assert.strictEqual(link2.success, true, 'Deveria vincular prof 1 à turma 2');

    // Vincular prof 2 à turma 1 (turma com múltiplos professores: titular + apoio)
    const link3 = await planejamentoService.linkProfessorToTurma(testTurmaId, testProfId2, 'apoio');
    assert.strictEqual(link3.success, true, 'Deveria vincular prof 2 à turma 1');

    // Listar professores da turma 1
    const profsTurma1 = await planejamentoService.getProfessoresByTurma(testTurmaId);
    assert.ok(profsTurma1.length >= 2, 'Turma 1 deve conter pelo menos 2 professores');
    console.log('  ✔ Múltiplos professores vinculados com sucesso (N:N).');

    // -------------------------------------------------------------
    // Teste 2: Prevenção de Duplicidade (Idempotência / Unique)
    // -------------------------------------------------------------
    console.log('\n▶ Teste 2: Prevenção de duplicidade de vínculo...');
    const dupLink = await planejamentoService.linkProfessorToTurma(testTurmaId, testProfId1, 'titular');
    assert.strictEqual(dupLink.success, true, 'Chamada duplicada deve retornar sucesso idempotente');
    const profsAfterDup = await planejamentoService.getProfessoresByTurma(testTurmaId);
    const countProf1 = profsAfterDup.filter(p => (p.professor_id || p.id) === testProfId1).length;
    assert.strictEqual(countProf1, 1, 'Professor não deve ser duplicado na mesma turma');
    console.log('  ✔ Duplicidade tratada corretamente sem registros redundantes.');

    // -------------------------------------------------------------
    // Teste 3: Verificação de Vínculo do Professor (Scoping)
    // -------------------------------------------------------------
    console.log('\n▶ Teste 3: Verificação de acesso e escopo do professor...');
    const isLinkedT1 = await planejamentoService.isProfessorLinkedToTurma(testProfId1, testTurmaId);
    assert.strictEqual(isLinkedT1, true, 'Prof 1 deve ter vínculo com Turma 1');

    const isLinkedT2 = await planejamentoService.isProfessorLinkedToTurma(testProfId1, testTurmaId2);
    assert.strictEqual(isLinkedT2, true, 'Prof 1 deve ter vínculo com Turma 2');

    const isLinkedUnrelated = await planejamentoService.isProfessorLinkedToTurma(testProfId2, testTurmaId2);
    assert.strictEqual(isLinkedUnrelated, false, 'Prof 2 NÃO deve ter vínculo com Turma 2');
    console.log('  ✔ Validação de permissões de acesso por turma funcionando rigorosamente.');

    // -------------------------------------------------------------
    // Teste 4: Planejamento Pedagógico (Geral da Turma e Individual)
    // -------------------------------------------------------------
    console.log('\n▶ Teste 4: Planejamento Pedagógico (Geral e Individual)...');
    
    // 4.1 Criar Planejamento Geral da Turma
    const planTurma = await planejamentoService.createPlanejamento({
        turma_id: testTurmaId,
        aluno_id: null,
        professor_id: testProfId1,
        titulo: 'Recomposição SAEB - Frações e Porcentagem',
        descricao: 'Atividades práticas com material manipulável e resolução guiada de itens D19.',
        data_inicio: '2026-03-01',
        data_fim: '2026-03-20',
        status: 'planejado'
    });
    assert.strictEqual(planTurma.success, true, 'Deveria criar planejamento geral da turma');
    const planTurmaId = planTurma.planejamento.id;

    // 4.2 Criar Planejamento Individual para Aluno
    const testAlunoId = 'aluno_2026_001';
    const planAluno = await planejamentoService.createPlanejamento({
        turma_id: testTurmaId,
        aluno_id: testAlunoId,
        professor_id: testProfId1,
        titulo: 'Plano Individual de Fluência Leitora - Aluno ' + testAlunoId,
        descricao: 'Treino diário de 15 min de leitura em voz alta com foco em pontuação (D01).',
        data_inicio: '2026-03-05',
        data_fim: '2026-03-25',
        status: 'em andamento'
    });
    assert.strictEqual(planAluno.success, true, 'Deveria criar planejamento individual');
    const planAlunoId = planAluno.planejamento.id;

    // 4.3 Listar todos os planejamentos da turma
    const allPlans = await planejamentoService.getPlanejamentosByTurma(testTurmaId);
    assert.ok(allPlans.length >= 2, 'Deveria retornar ambos os planejamentos (geral e individual)');

    // 4.4 Filtrar planejamentos apenas do aluno
    const studentPlans = await planejamentoService.getPlanejamentosByTurma(testTurmaId, testAlunoId);
    assert.strictEqual(studentPlans.length, 1, 'Deveria retornar apenas o planejamento do aluno');
    assert.strictEqual(studentPlans[0].titulo, 'Plano Individual de Fluência Leitora - Aluno ' + testAlunoId);

    // 4.5 Atualizar status do planejamento
    const updateRes = await planejamentoService.updatePlanejamento(planTurmaId, { status: 'concluido' });
    assert.strictEqual(updateRes.success, true, 'Deveria atualizar status para concluído');

    const updatedPlans = await planejamentoService.getPlanejamentosByTurma(testTurmaId);
    const updatedItem = updatedPlans.find(p => p.id === planTurmaId);
    assert.strictEqual(updatedItem.status, 'concluido', 'Status deve constar como concluido');
    console.log('  ✔ Planejamentos gerais e individuais criados, filtrados e atualizados.');

    // -------------------------------------------------------------
    // Teste 5: Exclusão de Planejamento e Desvinculação de Docente
    // -------------------------------------------------------------
    console.log('\n▶ Teste 5: Exclusão de Planejamento e Desvinculação...');
    
    // Excluir planejamento individual
    const delPlan = await planejamentoService.deletePlanejamento(planAlunoId, { id: testProfId1 });
    assert.strictEqual(delPlan.success, true, 'Deveria excluir planejamento');

    // Desvincular Prof 2 da turma 1
    const unlinkProf = await planejamentoService.unlinkProfessorFromTurma(testTurmaId, testProfId2);
    assert.strictEqual(unlinkProf.success, true, 'Deveria desvincular professor 2');

    const profsAfterUnlink = await planejamentoService.getProfessoresByTurma(testTurmaId);
    const stillLinked = profsAfterUnlink.some(p => (p.professor_id || p.id) === testProfId2);
    assert.strictEqual(stillLinked, false, 'Prof 2 não deve mais constar na turma 1');
    console.log('  ✔ Exclusão de planejamento e desvinculação de docente concluídas com sucesso.');

    console.log('\n============================================================');
    console.log('🎉 TODOS OS TESTES FORAM EXECUTADOS COM SUCESSO (100% PASS)');
    console.log('============================================================\n');
}

runTests().catch(err => {
    console.error('❌ ERRO DURANTE OS TESTES:', err);
    process.exit(1);
});
