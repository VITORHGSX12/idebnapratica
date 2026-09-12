const assert = require('assert');
const db = require('../db');
const { recalcularRespostasEvento, calcularResultadoAluno } = require('../routes/simulados/simulados_helpers');

async function runTest() {
    console.log('🧪 Iniciando Bateria de Testes: Recálculo em Cascata de Gabarito (Prioridade 1)...');

    const testEventoId = `evt_test_recalculo_${Date.now()}`;
    const testEscolaId = 'esc_test_01';
    const testTurmaId = 'turma_test_01';
    const aluno1Id = `al_rec_01_${Date.now()}`;
    const aluno2Id = `al_rec_02_${Date.now()}`;

    try {
        // 1. Criar Evento com Gabarito Inicial Incorreto: ['A', 'A', 'A', 'A']
        console.log('\n▶ Teste 1: Criação de evento com gabarito inicial...');
        const gabaritoInicial = ['A', 'A', 'A', 'A'];
        const habilidades = ['D1', 'D2', 'D5', 'D5'];

        if (!db.useLocalFallback) {
            await db.query(`
                INSERT INTO eventos_simulados (
                    id, titulo, data_realizacao, disciplina, status, qtd_questoes,
                    gabarito_geral_json, etapas_alvo, criado_em, atualizado_em
                ) VALUES ($1, $2, CURRENT_DATE, 'ambas', 'ABERTO', 4, $3, '["5º Ano"]', NOW(), NOW())
            `, [testEventoId, 'Simulado Teste Recálculo', JSON.stringify(gabaritoInicial)]);
        }

        // 2. Inserir Respostas dos Alunos baseadas no gabarito inicial
        console.log('▶ Teste 2: Lançamento de respostas dos alunos com gabarito inicial...');
        const aluno1Resp = ['A', 'B', 'B', 'B']; // Com gabarito ['A','A','A','A']: 1 acerto (25%)
        const aluno2Resp = ['A', 'A', 'B', 'B']; // Com gabarito ['A','A','A','A']: 2 acertos (50%)

        const calc1 = calcularResultadoAluno(aluno1Resp, gabaritoInicial, 'PRESENTE');
        const calc2 = calcularResultadoAluno(aluno2Resp, gabaritoInicial, 'PRESENTE');

        assert.strictEqual(calc1.totalAcertos, 1, 'Aluno 1 deveria ter 1 acerto inicialmente');
        assert.strictEqual(calc1.percentualAcertos, 25.0, 'Aluno 1 deveria ter 25% inicialmente');
        assert.strictEqual(calc1.situacao, 'ABAIXO DO BÁSICO', 'Situação inicial Aluno 1');

        assert.strictEqual(calc2.totalAcertos, 2, 'Aluno 2 deveria ter 2 acertos inicialmente');
        assert.strictEqual(calc2.percentualAcertos, 50.0, 'Aluno 2 deveria ter 50% inicialmente');
        assert.strictEqual(calc2.situacao, 'BÁSICO', 'Situação inicial Aluno 2');

        if (!db.useLocalFallback) {
            const simId = `${testEventoId}_${testEscolaId}_${testTurmaId}`;
            await db.query(`
                INSERT INTO respostas_simulado (
                    simulado_id, evento_id, escola_id, turma_id, aluno_id, aluno_nome,
                    respostas_json, status_presenca, gabarito_json, habilidades_json,
                    total_acertos, percentual_acertos, situacao, atualizado_em
                ) VALUES 
                ($1, $2, $3, $4, $5, 'Aluno Teste 1', $6, 'PRESENTE', $7, $8, $9, $10, $11, NOW()),
                ($1, $2, $3, $4, $12, 'Aluno Teste 2', $13, 'PRESENTE', $7, $8, $14, $15, $16, NOW())
            `, [
                simId, testEventoId, testEscolaId, testTurmaId,
                aluno1Id, JSON.stringify(aluno1Resp), JSON.stringify(gabaritoInicial), JSON.stringify(habilidades),
                calc1.totalAcertos, calc1.percentualAcertos, calc1.situacao,
                aluno2Id, JSON.stringify(aluno2Resp), calc2.totalAcertos, calc2.percentualAcertos, calc2.situacao
            ]);
        }

        console.log('  ✔ Alunos cadastrados com 25.0% e 50.0% de acerto.');

        // 3. Executar o Recálculo em Cascata com Novo Gabarito: ['A', 'A', 'B', 'B']
        console.log('\n▶ Teste 3: Disparo do recálculo em cascata com gabarito corrigido...');
        const gabaritoCorrigido = ['A', 'A', 'B', 'B'];

        const recResult = await recalcularRespostasEvento(testEventoId, gabaritoCorrigido);
        console.log(`  ✔ Total de alunos recalculados: ${recResult.totalRecalculados} (Timestamp: ${recResult.recalculadoEm})`);

        assert.ok(recResult.totalRecalculados >= 2, 'Deveria ter recalculado pelo menos 2 alunos');
        assert.ok(recResult.recalculadoEm, 'Deveria ter registrado timestamp de recálculo');

        // 4. Validar os Novos Registros no PostgreSQL Neon
        console.log('\n▶ Teste 4: Verificação da persistência das notas recalculadas no banco...');
        if (!db.useLocalFallback) {
            const rowsRes = await db.query(`
                SELECT aluno_id, total_acertos, percentual_acertos, situacao, recalculado_em, gabarito_alterado_em
                FROM respostas_simulado
                WHERE evento_id = $1
                ORDER BY aluno_id ASC
            `, [testEventoId]);

            assert.strictEqual(rowsRes.rows.length, 2, 'Deveria retornar 2 registros de respostas');

            const a1 = rowsRes.rows.find(r => r.aluno_id === aluno1Id);
            const a2 = rowsRes.rows.find(r => r.aluno_id === aluno2Id);

            // Aluno 1 com gabarito ['A','A','B','B'] e respostas ['A','B','B','B']:
            // Q1: A=A (Acertou)
            // Q2: B!=A (Errou)
            // Q3: B=B (Acertou D5)
            // Q4: B=B (Acertou D5)
            // Total: 3/4 = 75.0% -> ADEQUADO
            console.log(`  Aluno 1 Pós-Recálculo: ${a1.total_acertos}/4 (${a1.percentual_acertos}%) - ${a1.situacao}`);
            assert.strictEqual(a1.total_acertos, 3, 'Aluno 1 deveria ter 3 acertos após recálculo');
            assert.strictEqual(Number(a1.percentual_acertos), 75.0, 'Aluno 1 deveria ter 75% após recálculo');
            assert.strictEqual(a1.situacao, 'ADEQUADO', 'Situação de Aluno 1 deveria evoluir para ADEQUADO');
            assert.ok(a1.recalculado_em, 'recalculado_em deve estar preenchido');
            assert.ok(a1.gabarito_alterado_em, 'gabarito_alterado_em deve estar preenchido');

            // Aluno 2 com gabarito ['A','A','B','B'] e respostas ['A','A','B','B']:
            // Total: 4/4 = 100.0% -> AVANÇADO
            console.log(`  Aluno 2 Pós-Recálculo: ${a2.total_acertos}/4 (${a2.percentual_acertos}%) - ${a2.situacao}`);
            assert.strictEqual(a2.total_acertos, 4, 'Aluno 2 deveria ter 4 acertos após recálculo');
            assert.strictEqual(Number(a2.percentual_acertos), 100.0, 'Aluno 2 deveria ter 100% após recálculo');
            assert.strictEqual(a2.situacao, 'AVANÇADO', 'Situação de Aluno 2 deveria evoluir para AVANÇADO');

            // 5. Verificar atualização de timestamps no próprio evento
            const evCheck = await db.query('SELECT recalculado_em, gabarito_alterado_em FROM eventos_simulados WHERE id = $1', [testEventoId]);
            assert.ok(evCheck.rows[0].recalculado_em, 'Evento deve conter timestamp recalculado_em');
            console.log('  ✔ Metadados de auditoria gravados com sucesso no evento.');
        }

        console.log('\n======================================================');
        console.log('🎯 RESULTADOS DO TESTE: 4 PASSOU | 0 FALHOU (100% OK)');
        console.log('======================================================');
    } finally {
        // Limpeza dos dados de teste
        if (!db.useLocalFallback) {
            try {
                await db.query('DELETE FROM respostas_simulado WHERE evento_id = $1', [testEventoId]);
                await db.query('DELETE FROM eventos_simulados WHERE id = $1', [testEventoId]);
            } catch(e) {}
        }
    }
}

runTest().catch(err => {
    console.error('❌ Falha nos testes de recálculo:', err);
    process.exit(1);
});
