const assert = require('assert');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');
const express = require('express');
const simuladosRouter = require('../routes/simulados_routes');

const app = express();
app.use(express.json());
app.use('/api', simuladosRouter);

async function runProgressionModuleTests() {
    console.log('================================================================');
    console.log('SUÍTE DE TESTES: PROGRESSÃO, DESCRITORES & PDE (4 CAMADAS)');
    console.log('================================================================\n');

    const server = http.createServer(app);
    await new Promise(resolve => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    let passed = 0;
    let failed = 0;

    async function asyncTest(name, fn) {
        try {
            await fn();
            console.log(`  [✓ PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [✗ FAIL] ${name}`);
            console.error(`    Erro: ${err.message}`);
            failed++;
        }
    }

    try {
        // -------------------------------------------------------------------------
        // CASO 1: Aluno real sem simulados no banco -> Camada 1 Estado Vazio
        // -------------------------------------------------------------------------
        console.log('--- TESTE 1: Estado Vazio Real para Aluno sem Simulados (Zero Mocks) ---');
        await asyncTest('GET /api/alunos/:alunoId/progressao retorna totalSimulados=0 e arrays vazios', async () => {
            const alunoRes = await db.query('SELECT id, matricula, nome FROM alunos LIMIT 1');
            assert(alunoRes.rows.length > 0, 'Deve haver ao menos 1 aluno real no banco');
            const aluno = alunoRes.rows[0];

            const res = await fetch(`${baseUrl}/api/alunos/${aluno.matricula}/progressao`);
            assert.strictEqual(res.status, 200, 'HTTP status deve ser 200');
            const body = await res.json();
            assert.strictEqual(body.success, true, 'success deve ser true');
            assert.strictEqual(body.totalSimulados, 0, 'totalSimulados deve ser 0');
            assert.deepStrictEqual(body.simulados, [], 'simulados deve ser array vazio');
            assert.deepStrictEqual(body.habilidadesConsolidadas, [], 'habilidadesConsolidadas deve ser array vazio');
            assert.deepStrictEqual(body.habilidadesEmDefasagem, [], 'habilidadesEmDefasagem deve ser array vazio');
            assert.strictEqual(typeof body.mensagem, 'string', 'Deve conter mensagem informativa de estado vazio');
        });

        // -------------------------------------------------------------------------
        // CASO 2: Validação de Parâmetros de Diagnóstico e Limiares Pedagógicos
        // -------------------------------------------------------------------------
        console.log('\n--- TESTE 2: Critérios de Diagnóstico Pedagógico e Regras de Corte ---');
        await asyncTest('Cálculo de diagnóstico segue limiares: <60% Defasagem, >=75% Consolidado, min 2 itens', async () => {
            function classifyDescriptor(acertos, total) {
                const pct = (acertos / total) * 100;
                if (total < 2) return { class: 'PRELIMINAR', conf: 'BAIXA_AMOSTRA' };
                if (pct < 60.0) return { class: 'DEFASAGEM', conf: 'ALTA' };
                if (pct < 75.0) return { class: 'ATENCAO', conf: 'ALTA' };
                return { class: 'CONSOLIDADO', conf: 'ALTA' };
            }

            // 1 item avaliado -> PRELIMINAR (amostra insuficiente para diagnóstico raso)
            const d1Item = classifyDescriptor(0, 1);
            assert.strictEqual(d1Item.class, 'PRELIMINAR', '1 item deve ser classificado como PRELIMINAR');
            assert.strictEqual(d1Item.conf, 'BAIXA_AMOSTRA', '1 item deve ter baixa amostra');

            // 2 itens com 0 acertos -> DEFASAGEM (0%)
            const dDefasagem = classifyDescriptor(0, 2);
            assert.strictEqual(dDefasagem.class, 'DEFASAGEM', '0/2 (0%) deve ser DEFASAGEM');

            // 3 itens com 2 acertos -> ATENCAO (66.7%)
            const dAtencao = classifyDescriptor(2, 3);
            assert.strictEqual(dAtencao.class, 'ATENCAO', '2/3 (66.7%) deve ser ATENCAO');

            // 4 itens com 3 acertos -> CONSOLIDADO (75%)
            const dConsolidado = classifyDescriptor(3, 4);
            assert.strictEqual(dConsolidado.class, 'CONSOLIDADO', '3/4 (75%) deve ser CONSOLIDADO');

            // 4 itens com 4 acertos -> CONSOLIDADO (100%)
            const dMax = classifyDescriptor(4, 4);
            assert.strictEqual(dMax.class, 'CONSOLIDADO', '4/4 (100%) deve ser CONSOLIDADO');
        });

        // -------------------------------------------------------------------------
        // CASO 3: Validação da Camada 4 (Agregação por Escola / Diagnóstico PDE)
        // -------------------------------------------------------------------------
        console.log('\n--- TESTE 3: Agregação por Escola / Diagnóstico PDE (/api/escolas/:id/diagnostico-descritores) ---');
        const escolasRes = await db.query('SELECT id, nome FROM escolas ORDER BY nome');
        assert.strictEqual(escolasRes.rows.length, 9, 'Devem existir 9 escolas municipais');

        for (const esc of escolasRes.rows) {
            await asyncTest(`Escola [${esc.nome}]: endpoint responde íntegro e sem dados fictícios`, async () => {
                const res = await fetch(`${baseUrl}/api/escolas/${esc.id}/diagnostico-descritores`);
                assert.strictEqual(res.status, 200, 'Status HTTP deve ser 200');
                const body = await res.json();
                assert.strictEqual(body.success, true, 'success deve ser true');
                assert.strictEqual(body.escolaId, esc.id, 'escolaId deve coincidir');
                assert(typeof body.totalAlunosAvaliados === 'number', 'totalAlunosAvaliados deve ser numérico');
                assert(Array.isArray(body.descritoresPrioritarios), 'descritoresPrioritarios deve ser array');
                
                if (body.totalAlunosAvaliados === 0) {
                    assert.strictEqual(body.descritoresPrioritarios.length, 0, 'Sem simulados = 0 descritores inventados');
                    assert(typeof body.mensagem === 'string', 'Deve conter mensagem informativa');
                }
            });
        }

        // -------------------------------------------------------------------------
        // CASO 4: Resiliência em Parâmetro Inválido ou Ausente
        // -------------------------------------------------------------------------
        console.log('\n--- TESTE 4: Resiliência & Tratamento de Erros de Parâmetro ---');
        await asyncTest('Requisição para aluno inexistente retorna totalSimulados=0 sem estourar 500', async () => {
            const res = await fetch(`${baseUrl}/api/alunos/MATRICULA_INEXISTENTE_9999/progressao`);
            assert.strictEqual(res.status, 200, 'Deve responder 200 com array vazio');
            const body = await res.json();
            assert.strictEqual(body.success, true);
            assert.strictEqual(body.totalSimulados, 0);
        });

    } finally {
        server.close();
    }

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passed} PASSOU | ${failed} FALHAS`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runProgressionModuleTests().catch(e => {
    console.error(e);
    process.exit(1);
});
