/**
 * ============================================================================
 * TESTE AUTOMATIZADO: GERENCIADOR DE AVALIAÇÕES & SIMULADOS
 * Arquivo: scripts/test_avaliacoes_manager.test.js
 * Descrição: Testa cálculo de progresso de digitação, filtros de status gerenciais
 *            e exclusão segura em cascata de avaliações de teste.
 * ============================================================================
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock Environment
const mockLocalStorage = {};
global.localStorage = {
    getItem: (key) => mockLocalStorage[key] || null,
    setItem: (key, val) => { mockLocalStorage[key] = String(val); },
    removeItem: (key) => { delete mockLocalStorage[key]; },
    clear: () => { Object.keys(mockLocalStorage).forEach(k => delete mockLocalStorage[k]); }
};

global.window = global;
global.document = {
    readyState: 'complete',
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
};

// Carrega o módulo avaliacoes_state.js
const stateCode = fs.readFileSync(path.join(__dirname, '../js/modules/avaliacoes/avaliacoes_state.js'), 'utf8');
eval(stateCode);

console.log('🧪 INICIANDO TESTES DO GERENCIADOR DE AVALIAÇÕES...');

// Teste 1: Estado inicial e contagens básicas
const eventosIniciais = global.getEventosState();
assert(Array.isArray(eventosIniciais) && eventosIniciais.length >= 2, 'Deve carregar eventos iniciais de seed');
console.log('  ✅ Teste 1: Seed inicial carregado (' + eventosIniciais.length + ' eventos).');

// Teste 2: Progresso com 0 respostas lançadas
const evtAberto = eventosIniciais.find(e => e.status === 'ABERTO');
assert(evtAberto, 'Deve existir evento com status ABERTO');
const progAberto = global.calcularProgressoEvento(evtAberto.id);
assert.strictEqual(progAberto.percentual, 0, 'Evento aberto sem respostas deve ter 0% de progresso');
assert.strictEqual(progAberto.isAtivo, true, 'Evento aberto sem respostas deve ser considerado isAtivo = true');
assert.strictEqual(progAberto.isEmAndamento, false, 'Não deve estar em andamento');
assert.strictEqual(progAberto.isConcluido, false, 'Não deve estar concluído');
console.log('  ✅ Teste 2: Progresso de evento ABERTO com 0% verificado.');

// Teste 3: Progresso parcial (Em Digitação / Andamento)
const eventoTesteId = 'evt_test_andamento_01';
const eventoTeste = {
    id: eventoTesteId,
    titulo: 'Simulado de Teste da Plataforma',
    status: 'ABERTO',
    dataRealizacao: '2026-09-20',
    disciplina: 'ambas',
    qtdQuestoes: 20,
    etapasAlvo: ['5º Ano'],
    turmas: [{ id: 'turma_01', totalAlunos: 20 }]
};

const eventosAtualizados = [...eventosIniciais, eventoTeste];
global.saveEventosState(eventosAtualizados);

// Lança 10 alunos com respostas (50% de preenchimento)
const respostasMock = {};
respostasMock[`${eventoTesteId}_esc01_turma01`] = {};
for (let i = 1; i <= 10; i++) {
    respostasMock[`${eventoTesteId}_esc01_turma01`][`aluno_${i}`] = {
        respostas: ['A', 'B', 'C', 'D'],
        statusPresenca: 'PRESENTE'
    };
}
global.saveRespostasState(respostasMock);

const progParcial = global.calcularProgressoEvento(eventoTesteId);
assert.strictEqual(progParcial.alunosPreenchidos, 10, 'Deve contabilizar 10 alunos preenchidos');
assert.strictEqual(progParcial.alunosEsperados, 20, 'Deve ter 20 alunos esperados');
assert.strictEqual(progParcial.percentual, 50, 'Deve registrar exatamente 50% de progresso');
assert.strictEqual(progParcial.isEmAndamento, true, 'Deve ter status gerencial isEmAndamento = true');
assert.strictEqual(progParcial.isAtivo, false, 'Não deve ser isAtivo');
assert.strictEqual(progParcial.isConcluido, false, 'Não deve ser isConcluido');
console.log('  ✅ Teste 3: Progresso parcial (50% - Em Digitação) verificado com sucesso.');

// Teste 4: Progresso 100% (Concluído)
for (let i = 11; i <= 20; i++) {
    respostasMock[`${eventoTesteId}_esc01_turma01`][`aluno_${i}`] = {
        respostas: ['A', 'B', 'C', 'D'],
        statusPresenca: 'PRESENTE'
    };
}
global.saveRespostasState(respostasMock);

const prog100 = global.calcularProgressoEvento(eventoTesteId);
assert.strictEqual(prog100.alunosPreenchidos, 20, 'Deve ter 20 alunos preenchidos');
assert.strictEqual(prog100.percentual, 100, 'Deve registrar 100% de progresso');
assert.strictEqual(prog100.isConcluido, true, 'Deve ser isConcluido = true');
assert.strictEqual(prog100.isEmAndamento, false, 'Não deve ser isEmAndamento');
console.log('  ✅ Teste 4: Progresso 100% (Concluído) verificado.');

// Teste 5: Resumo consolidado do Gerenciador
const resumo = global.obterResumoGerencialAvaliacoes();
assert(typeof resumo === 'object', 'Deve retornar objeto de resumo');
assert(resumo.total >= 3, 'Total deve contabilizar todos os eventos');
assert(resumo.concluidas >= 1, 'Deve conter pelo menos 1 concluída');
assert(resumo.rascunhos >= 1, 'Deve conter pelo menos 1 rascunho');
console.log('  ✅ Teste 5: Resumo gerencial consolidado validado:', JSON.stringify(resumo));

// Teste 6: Exclusão Segura em Cascata de Avaliação de Teste
const deleteRes = global.excluirEventoComRespostas(eventoTesteId);
assert.strictEqual(deleteRes.success, true, 'Exclusão deve retornar sucesso');
assert.strictEqual(deleteRes.eventoId, eventoTesteId, 'ID excluído deve bater');

// Verifica se o evento sumiu da lista
const eventosAposExclusao = global.getEventosState();
const eventoAindaExiste = eventosAposExclusao.some(e => e.id === eventoTesteId);
assert.strictEqual(eventoAindaExiste, false, 'O evento de teste não deve mais constar em getEventosState()');

// Verifica se as respostas vinculadas ao evento foram purgadas do banco
const respostasAposExclusao = global.getRespostasState();
const chavesRestantes = Object.keys(respostasAposExclusao).filter(k => k.startsWith(eventoTesteId));
assert.strictEqual(chavesRestantes.length, 0, 'Todas as respostas do evento de teste devem ter sido purgadas');
console.log('  ✅ Teste 6: Exclusão segura em cascata de avaliação de teste verificada com sucesso.');

console.log('\n🎉 TODOS OS TESTES DO GERENCIADOR DE AVALIAÇÕES PASSARAM COM 100% DE SUCESSO!\n');
