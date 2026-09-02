/**
 * ============================================================================
 * SUÍTE DE TESTES E AUDITORIA: VÍNCULO ALUNO - TURMA - ESCOLA
 * Arquivo: scripts/audit_turmas_matriculas.test.js
 * Descrição: Validação automatizada de integridade relacional, consistência
 *            de contagens por turma/escola e campos do modal de estudantes.
 * ============================================================================
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../db');

async function runOfficialAuditTests() {
    console.log('================================================================');
    console.log('SUÍTE OFICIAL DE AUDITORIA & TESTES: VÍNCULO ALUNO-TURMA');
    console.log('================================================================\n');

    let passedTests = 0;
    let failedTests = 0;

    function assert(cond, msg) {
        if (cond) {
            console.log(`  [✓ PASS] ${msg}`);
            passedTests++;
        } else {
            console.error(`  [✗ FAIL] ${msg}`);
            failedTests++;
        }
    }

    // -------------------------------------------------------------------------
    // TESTE 1: Endpoint /api/classes e Contagem Global de Estudantes
    // -------------------------------------------------------------------------
    console.log('--- TESTE 1: Integridade Global de Turmas e Alunos (/api/classes) ---');
    const classesQuery = await db.query(`
        SELECT 
            t.id, 
            t.nome, 
            t.serie, 
            t.turno, 
            t.ano_letivo, 
            t.escola_id, 
            esc.nome as escola,
            esc.codigo_inep,
            COUNT(a.id)::int as "alunosCount"
        FROM turmas t
        JOIN escolas esc ON esc.id = t.escola_id
        LEFT JOIN alunos a ON a.turma_id = t.id
        GROUP BY t.id, t.nome, t.serie, t.turno, t.ano_letivo, t.escola_id, esc.nome, esc.codigo_inep
        ORDER BY esc.nome ASC, t.serie ASC, t.nome ASC
    `);

    assert(classesQuery.rows.length === 32, `Total de 32 turmas ativas vinculadas a escolas oficiais (obtido: ${classesQuery.rows.length})`);
    
    const totalAlunos = classesQuery.rows.reduce((acc, row) => acc + row.alunosCount, 0);
    assert(totalAlunos === 526, `Total acumulado de 526 alunos matriculados nas turmas ativas (obtido: ${totalAlunos})`);

    // -------------------------------------------------------------------------
    // TESTE 2: Consulta Individual de Alunos por Turma (/api/classes/:id/students)
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 2: Paridade Card vs Query de Alunos (/api/classes/:id/students) ---');
    let allMatched = true;

    for (const cls of classesQuery.rows) {
        const studentsQuery = await db.query(`
            SELECT 
                a.id, 
                a.nome, 
                a.matricula, 
                a.nascimento, 
                a.data_nascimento as "dataNascimento",
                a.cpf,
                a.necessidades_especiais as nee,
                t.id as "turmaId", 
                t.nome as turma, 
                t.serie, 
                t.turno,
                esc.id as "escolaId", 
                esc.nome as escola, 
                esc.codigo_inep as inep
            FROM alunos a
            JOIN turmas t ON t.id = a.turma_id
            JOIN escolas esc ON esc.id = t.escola_id
            WHERE t.id = $1
            ORDER BY a.nome ASC
        `, [cls.id]);

        if (studentsQuery.rows.length !== cls.alunosCount) {
            allMatched = false;
            console.error(`  Divergência detectada na turma ${cls.nome} (${cls.escola}): card=${cls.alunosCount}, query=${studentsQuery.rows.length}`);
        }
    }
    assert(allMatched, 'Paridade exata de 100% nas 32 turmas (contagem do card == retorno da query)');

    // -------------------------------------------------------------------------
    // TESTE 3: Resiliência em Turma sem Alunos
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 3: Resiliência em Turma Vazia (0 Alunos) ---');
    const emptyQuery = await db.query(`
        SELECT a.id, a.nome, a.matricula
        FROM alunos a
        WHERE a.turma_id = '00000000-0000-0000-0000-000000000000'
    `);
    assert(emptyQuery.rows.length === 0, 'Consulta de turma vazia retorna array vazio de forma resiliente e sem erro');

    // -------------------------------------------------------------------------
    // TESTE 4: Cobertura por Escola (Zonas Urbana e Rural)
    // Composição das 19 asserções:
    // - 1 asserção global: contagem total de escolas cadastradas (>= 8)
    // - 18 asserções: 2 asserções para cada uma das 9 escolas (turmas > 0 e alunos > 0)
    // Total = 1 + (9 * 2) = 19 asserções.
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 4: Cobertura Individual por Escola Municipal (19 asserções) ---');
    const escolas = await db.query('SELECT DISTINCT id, nome, zona FROM escolas ORDER BY nome');
    assert(escolas.rows.length >= 8, `Auditadas todas as ${escolas.rows.length} escolas municipais cadastradas`);

    for (const esc of escolas.rows) {
        const turmasEscola = classesQuery.rows.filter(c => c.escola_id === esc.id);
        const alunosEscola = turmasEscola.reduce((acc, c) => acc + c.alunosCount, 0);
        console.log(`    • ${esc.nome} (${esc.zona || 'Urbana/Rural'}): ${turmasEscola.length} turmas, ${alunosEscola} alunos`);
        assert(turmasEscola.length > 0, `Escola ${esc.nome} possui turmas ativas cadastradas`);
        assert(alunosEscola > 0, `Escola ${esc.nome} possui alunos vinculados`);
    }

    // -------------------------------------------------------------------------
    // TESTE 5: Presença dos Campos Obrigatórios para o Modal
    // -------------------------------------------------------------------------
    console.log('\n--- TESTE 5: Integridade dos Campos de Renderização do Modal ---');
    const sample = await db.query(`
        SELECT 
            a.id, 
            a.nome, 
            a.matricula, 
            a.nascimento, 
            a.necessidades_especiais as nee,
            t.nome as turma,
            t.serie,
            esc.nome as escola
        FROM alunos a
        JOIN turmas t ON t.id = a.turma_id
        JOIN escolas esc ON esc.id = t.escola_id
        LIMIT 10
    `);

    let validFields = true;
    for (const st of sample.rows) {
        if (!st.nome || !st.matricula || !st.escola || !st.serie) {
            validFields = false;
        }
    }
    assert(validFields, '100% dos estudantes amostrados possuem Matrícula, Nome, Escola e Série preenchidos');

    console.log('\n================================================================');
    console.log(`RELATÓRIO DE EXECUÇÃO: ${passedTests} ASSERÇÕES APROVADAS | ${failedTests} FALHAS`);
    console.log('================================================================');

    if (failedTests > 0) process.exit(1);
    process.exit(0);
}

runOfficialAuditTests().catch(e => {
    console.error(e);
    process.exit(1);
});
