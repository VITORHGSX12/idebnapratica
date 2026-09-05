/**
 * Auditoria Completa dos Dados do IDEB Maranhão (Planilha vs Banco de Dados PostgreSQL vs Dataset Front-end)
 * Arquivo: scripts/audit_ideb_maranhao_database.js
 */
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

const EXCEL_PATH = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'idebmaranhao', 'IDEB_Maranhao_Municipios_2015-2025.xlsx');
const SAMPLE_IBGE_CODES = ['2100105', '2100204', '2100303'];

async function runAudit() {
    console.log('========================================================================');
    console.log('AUDITORIA DE DADOS DO IDEB (MARANHÃO) — COMPARATIVO REGIONAL');
    console.log('========================================================================\n');

    // -------------------------------------------------------------------------
    // 1. LEITURA DA PLANILHA EXCEL
    // -------------------------------------------------------------------------
    console.log(`1. Lendo Planilha: ${EXCEL_PATH}`);
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error('ERRO: Planilha não encontrada no caminho informado.');
        return;
    }

    const wb = xlsx.readFile(EXCEL_PATH);
    console.log('Abas encontradas na planilha:', wb.SheetNames);

    function parseVal(v) {
        if (v === undefined || v === null || v === '' || v === '-' || v === 'ND' || v === 'Sem dado') return null;
        const num = parseFloat(String(v).replace(',', '.'));
        return isNaN(num) ? null : Number(num.toFixed(2));
    }

    const sheetAI = wb.Sheets['Anos Iniciais'];
    const sheetAF = wb.Sheets['Anos Finais'];
    const sheetNotas = wb.Sheets['Notas'];

    if (sheetNotas) {
        console.log('\n--- Conteúdo da Aba "Notas" (Metodologia) ---');
        const notasData = xlsx.utils.sheet_to_json(sheetNotas, { header: 1 });
        notasData.forEach(r => { if (r.length) console.log(r.join(' | ')); });
    }

    const rawAI = xlsx.utils.sheet_to_json(sheetAI, { header: 1 });
    const rawAF = xlsx.utils.sheet_to_json(sheetAF, { header: 1 });

    console.log(`\nLinhas brutas em "Anos Iniciais": ${rawAI.length}`);
    console.log('Header detectado em AI (primeiras 5 linhas):');
    rawAI.slice(0, 5).forEach((r, idx) => console.log(`  [${idx}]:`, r));

    // Identificar a linha onde começam os dados de AI
    let startRowAI = 0;
    for (let i = 0; i < 10; i++) {
        const r = rawAI[i];
        if (r && r[0] && String(r[0]).match(/^\d{7}$/)) {
            startRowAI = i;
            break;
        }
    }
    console.log(`Dados em "Anos Iniciais" iniciam na linha índice ${startRowAI}`);

    // Identificar a linha onde começam os dados de AF
    let startRowAF = 0;
    for (let i = 0; i < 10; i++) {
        const r = rawAF[i];
        if (r && r[0] && String(r[0]).match(/^\d{7}$/)) {
            startRowAF = i;
            break;
        }
    }
    console.log(`Dados em "Anos Finais" iniciam na linha índice ${startRowAF}`);

    const excelAI = {};
    for (let i = startRowAI; i < rawAI.length; i++) {
        const r = rawAI[i];
        if (!r || !r[0]) continue;
        const cod = String(r[0]).trim();
        excelAI[cod] = {
            codigoIbge: cod,
            municipio: String(r[1] || '').trim(),
            y2015: parseVal(r[2]),
            y2017: parseVal(r[3]),
            y2019: parseVal(r[4]),
            y2021: parseVal(r[5]),
            y2023: parseVal(r[6]),
            y2025: parseVal(r[7])
        };
    }

    const excelAF = {};
    for (let i = startRowAF; i < rawAF.length; i++) {
        const r = rawAF[i];
        if (!r || !r[0]) continue;
        const cod = String(r[0]).trim();
        excelAF[cod] = {
            codigoIbge: cod,
            municipio: String(r[1] || '').trim(),
            y2015: parseVal(r[2]),
            y2017: parseVal(r[3]),
            y2019: parseVal(r[4]),
            y2021: parseVal(r[5]),
            y2023: parseVal(r[6]),
            y2025: parseVal(r[7])
        };
    }

    const totalMunAI = Object.keys(excelAI).length;
    const totalMunAF = Object.keys(excelAF).length;
    console.log(`\nTotal de municípios na planilha (Anos Iniciais): ${totalMunAI}`);
    console.log(`Total de municípios na planilha (Anos Finais): ${totalMunAF}`);

    // Mostrar amostra da planilha
    console.log('\n--- Amostra de Dados da Planilha Excel ---');
    SAMPLE_IBGE_CODES.forEach(cod => {
        console.log(`\nMunicípio IBGE ${cod}:`);
        console.log('  Anos Iniciais:', excelAI[cod] || 'NÃO ENCONTRADO');
        console.log('  Anos Finais:  ', excelAF[cod] || 'NÃO ENCONTRADO');
    });

    // -------------------------------------------------------------------------
    // 2. VERIFICAÇÃO DO BANCO DE DADOS POSTGRESQL (Nuvem / Railway)
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log('2. VERIFICANDO O BANCO DE DADOS POSTGRESQL');
    console.log('========================================================================');

    const connStr = process.env.DATABASE_URL;
    if (!connStr) {
        console.log('DATABASE_URL não configurada no ambiente.');
        return;
    }

    const isLocal = connStr.includes('localhost') || connStr.includes('127.0.0.1');
    const pool = new Pool({
        connectionString: connStr,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    try {
        const client = await pool.connect();
        console.log('Conexão com PostgreSQL realizada com sucesso!');

        // Listar tabelas relevantes
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        const tableNames = tablesRes.rows.map(r => r.table_name);
        console.log('\nTabelas existentes no banco PostgreSQL:', tableNames);

        // Checar estrutura das tabelas relacionadas a IDEB / Municípios
        const targetTables = ['ideb_publico_referencia', 'municipios_ma', 'escolas', 'turmas', 'alunos'];
        for (const tName of targetTables) {
            if (tableNames.includes(tName)) {
                const colsRes = await client.query(`
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns 
                    WHERE table_name = $1
                    ORDER BY ordinal_position;
                `, [tName]);
                console.log(`\nColunas da tabela [${tName}]:`);
                colsRes.rows.forEach(c => console.log(`  - ${c.column_name} (${c.data_type}, nullable: ${c.is_nullable})`));

                const countRes = await client.query(`SELECT COUNT(*) as total FROM "${tName}";`);
                console.log(`  Total de registros em [${tName}]: ${countRes.rows[0].total}`);
            } else {
                console.log(`\nTabela [${tName}] NÃO existe no banco de dados.`);
            }
        }

        // Consultar especificamente `ideb_publico_referencia`
        if (tableNames.includes('ideb_publico_referencia')) {
            console.log('\n--- Auditoria Específica em [ideb_publico_referencia] ---');
            
            // Municípios distintos no Maranhão
            const distinctMunRes = await client.query(`
                SELECT COUNT(DISTINCT codigo_ibge) as total_ibge,
                       COUNT(DISTINCT municipio) as total_nomes
                FROM ideb_publico_referencia
                WHERE uf = 'MA';
            `);
            console.log('Municípios distintos com UF=MA no banco:', distinctMunRes.rows[0]);

            // Anos e etapas disponíveis
            const yearsEtapasRes = await client.query(`
                SELECT ano, etapa, COUNT(*) as registros,
                       COUNT(ideb_observado) as com_ideb_observado,
                       COUNT(meta_projetada) as com_meta
                FROM ideb_publico_referencia
                WHERE uf = 'MA'
                GROUP BY ano, etapa
                ORDER BY etapa, ano;
            `);
            console.log('\nDistribuição por Ano e Etapa no banco:');
            console.table(yearsEtapasRes.rows);

            // Verificar amostra de municípios no banco
            console.log('\n--- Amostra no Banco para os códigos IBGE 2100105, 2100204, 2100303 ---');
            const sampleRes = await client.query(`
                SELECT codigo_ibge, municipio, ano, etapa, ideb_observado, meta_projetada
                FROM ideb_publico_referencia
                WHERE codigo_ibge = ANY($1::varchar[])
                ORDER BY codigo_ibge, etapa, ano;
            `, [SAMPLE_IBGE_CODES]);
            console.table(sampleRes.rows);
        }

        // Consultar `municipios_ma`
        if (tableNames.includes('municipios_ma')) {
            console.log('\n--- Auditoria Específica em [municipios_ma] ---');
            const munMaCount = await client.query(`SELECT COUNT(*) as total FROM municipios_ma WHERE uf = 'MA';`);
            console.log('Total de municípios cadastrados em municipios_ma:', munMaCount.rows[0].total);

            const sampleMunMa = await client.query(`
                SELECT codigo_ibge, nome, uf 
                FROM municipios_ma 
                WHERE codigo_ibge = ANY($1::varchar[])
                ORDER BY codigo_ibge;
            `, [SAMPLE_IBGE_CODES]);
            console.table(sampleMunMa.rows);
        }

        client.release();
    } catch (err) {
        console.error('Erro ao consultar PostgreSQL:', err.message);
    } finally {
        await pool.end();
    }

    // -------------------------------------------------------------------------
    // 3. VERIFICAÇÃO DO DATASET FRONT-END DO SISTEMA (ideb_maranhao_oficial_2015_2025.js)
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log('3. VERIFICANDO DATASET FRONT-END (ideb_maranhao_oficial_2015_2025.js)');
    console.log('========================================================================');

    const jsDatasetPath = path.join(__dirname, '..', 'ideb_maranhao_oficial_2015_2025.js');
    if (fs.existsSync(jsDatasetPath)) {
        const dataset = require(jsDatasetPath);
        console.log('Dataset carregado com sucesso!');
        const jsAI = dataset.iniciais || [];
        const jsAF = dataset.finais || [];
        console.log(`Total em Anos Iniciais: ${jsAI.length}`);
        console.log(`Total em Anos Finais:   ${jsAF.length}`);

        console.log('\n--- Amostra no Dataset Front-end para os códigos IBGE ---');
        SAMPLE_IBGE_CODES.forEach(cod => {
            const itemAI = jsAI.find(m => String(m.codigoInep || m.codigoIbge || m.codigo_ibge) === cod);
            const itemAF = jsAF.find(m => String(m.codigoInep || m.codigoIbge || m.codigo_ibge) === cod);
            console.log(`\nMunicípio IBGE ${cod}:`);
            console.log('  Anos Iniciais no JS:', itemAI);
            console.log('  Anos Finais no JS:  ', itemAF);
        });

        // ---------------------------------------------------------------------
        // 4. COMPARAÇÃO DETALHADA: PLANILHA vs DATASET DO SISTEMA
        // ---------------------------------------------------------------------
        console.log('\n========================================================================');
        console.log('4. COMPARAÇÃO DETALHADA: PLANILHA vs SISTEMA ATUAL');
        console.log('========================================================================');

        SAMPLE_IBGE_CODES.forEach(cod => {
            const pAI = excelAI[cod];
            const pAF = excelAF[cod];
            const jAI = jsAI.find(m => String(m.codigoInep || m.codigoIbge || m.codigo_ibge) === cod);
            const jAF = jsAF.find(m => String(m.codigoInep || m.codigoIbge || m.codigo_ibge) === cod);

            console.log(`\nComparando Município [${cod}] (${pAI ? pAI.municipio : 'N/A'}):`);
            const anos = [2015, 2017, 2019, 2021, 2023, 2025];
            
            console.log('  ANOS INICIAIS:');
            anos.forEach(ano => {
                const valPlanilha = pAI ? pAI[`y${ano}`] : null;
                const valJs = jAI ? jAI[`y${ano}`] : null;
                const match = valPlanilha === valJs ? '✅ BATE' : '⚠️ DIVERGE';
                console.log(`    Ano ${ano}: Planilha = ${valPlanilha !== null ? valPlanilha : '-'} | Sistema = ${valJs !== null ? valJs : '-'} [${match}]`);
            });

            console.log('  ANOS FINAIS:');
            anos.forEach(ano => {
                const valPlanilha = pAF ? pAF[`y${ano}`] : null;
                const valJs = jAF ? jAF[`y${ano}`] : null;
                const match = valPlanilha === valJs ? '✅ BATE' : '⚠️ DIVERGE';
                console.log(`    Ano ${ano}: Planilha = ${valPlanilha !== null ? valPlanilha : '-'} | Sistema = ${valJs !== null ? valJs : '-'} [${match}]`);
            });
        });
    } else {
        console.log('ideb_maranhao_oficial_2015_2025.js não encontrado.');
    }
}

runAudit().catch(err => {
    console.error('Erro na auditoria:', err);
});
