/**
 * Script de Carga e Atualização Completa do IDEB no Banco PostgreSQL (Railway) — VERSÃO OTIMIZADA COM BATCH
 * Arquivo: scripts/seed_ideb_full_database.js
 */
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { Pool } = require('pg');
require('dotenv').config();

const EXCEL_MUN_PATH = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'idebmaranhao', 'IDEB_Maranhao_Municipios_2015-2025.xlsx');
const EXCEL_ESC_PATH = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'escolasmaranahoideb', 'IDEB_Maranhao_Escolas_2015-2025.xlsx');

function parseVal(v) {
    if (v === undefined || v === null || v === '' || v === '-' || v === 'ND' || v === 'Sem dado') return null;
    const num = parseFloat(String(v).replace(',', '.'));
    return isNaN(num) ? null : Number(num.toFixed(2));
}

async function runSeed() {
    console.log('=== INICIANDO ATUALIZAÇÃO COMPLETA NO BANCO POSTGRESQL (BATCH RÁPIDO) ===\n');

    const connStr = process.env.DATABASE_URL;
    if (!connStr) {
        throw new Error('DATABASE_URL não configurada no arquivo .env');
    }

    const isLocal = connStr.includes('localhost') || connStr.includes('127.0.0.1');
    const pool = new Pool({
        connectionString: connStr,
        ssl: isLocal ? false : { rejectUnauthorized: false }
    });

    const client = await pool.connect();

    try {
        console.log('Conectado ao PostgreSQL com sucesso!');

        // 1. Criar tabela de referência de escolas se não existir
        console.log('Criando tabela `ideb_escolas_referencia` no banco...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS ideb_escolas_referencia (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                codigo_inep VARCHAR(8) NOT NULL,
                nome VARCHAR(255) NOT NULL,
                municipio VARCHAR(255) NOT NULL,
                codigo_municipio VARCHAR(7),
                rede VARCHAR(50) DEFAULT 'Municipal',
                ure VARCHAR(100),
                ai_2015 NUMERIC(4, 2),
                ai_2017 NUMERIC(4, 2),
                ai_2019 NUMERIC(4, 2),
                ai_2021 NUMERIC(4, 2),
                ai_2023 NUMERIC(4, 2),
                ai_2025 NUMERIC(4, 2),
                af_2015 NUMERIC(4, 2),
                af_2017 NUMERIC(4, 2),
                af_2019 NUMERIC(4, 2),
                af_2021 NUMERIC(4, 2),
                af_2023 NUMERIC(4, 2),
                af_2025 NUMERIC(4, 2),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_ideb_escolas_ref_inep ON ideb_escolas_referencia (codigo_inep);
            CREATE INDEX IF NOT EXISTS idx_ideb_escolas_ref_mun ON ideb_escolas_referencia (municipio);
            CREATE INDEX IF NOT EXISTS idx_ideb_escolas_ref_cod_mun ON ideb_escolas_referencia (codigo_municipio);
        `);

        await client.query(`
            ALTER TABLE IF EXISTS ideb_publico_referencia 
            ALTER COLUMN ideb_observado TYPE NUMERIC(4, 2);
        `);

        // ---------------------------------------------------------------------
        // 2. ATUALIZAR MUNICÍPIOS EM `ideb_publico_referencia` (BATCH)
        // ---------------------------------------------------------------------
        console.log('Lendo planilha de municípios:', EXCEL_MUN_PATH);
        const wbMun = xlsx.readFile(EXCEL_MUN_PATH);
        const rowsAI = xlsx.utils.sheet_to_json(wbMun.Sheets['Anos Iniciais'], { header: 1 });
        const rowsAF = xlsx.utils.sheet_to_json(wbMun.Sheets['Anos Finais'], { header: 1 });

        const anos = [2015, 2017, 2019, 2021, 2023, 2025];
        const anoCols = [2, 3, 4, 5, 6, 7];

        const munRecords = [];

        // Anos Iniciais
        for (let i = 0; i < rowsAI.length; i++) {
            const r = rowsAI[i];
            if (!r || !r[0] || !String(r[0]).match(/^\d{7}$/)) continue;
            const codIbge = String(r[0]).trim();
            const nomeMun = String(r[1] || '').trim();

            for (let yIdx = 0; yIdx < anos.length; yIdx++) {
                munRecords.push({
                    uf: 'MA',
                    municipio: nomeMun,
                    codigo_ibge: codIbge,
                    ano: anos[yIdx],
                    etapa: 'Anos Iniciais',
                    ideb_observado: parseVal(r[anoCols[yIdx]])
                });
            }
        }

        // Anos Finais
        for (let i = 0; i < rowsAF.length; i++) {
            const r = rowsAF[i];
            if (!r || !r[0] || !String(r[0]).match(/^\d{7}$/)) continue;
            const codIbge = String(r[0]).trim();
            const nomeMun = String(r[1] || '').trim();

            for (let yIdx = 0; yIdx < anos.length; yIdx++) {
                munRecords.push({
                    uf: 'MA',
                    municipio: nomeMun,
                    codigo_ibge: codIbge,
                    ano: anos[yIdx],
                    etapa: 'Anos Finais',
                    ideb_observado: parseVal(r[anoCols[yIdx]])
                });
            }
        }

        console.log(`Inserindo ${munRecords.length} registros municipais em lotes...`);
        await client.query('BEGIN');
        await client.query("DELETE FROM ideb_publico_referencia WHERE uf = 'MA';");

        const BATCH_SIZE = 300;
        for (let i = 0; i < munRecords.length; i += BATCH_SIZE) {
            const batch = munRecords.slice(i, i + BATCH_SIZE);
            const valueClauses = [];
            const values = [];

            batch.forEach((row, idx) => {
                const offset = idx * 6;
                valueClauses.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);
                values.push(row.uf, row.municipio, row.codigo_ibge, row.ano, row.etapa, row.ideb_observado);
            });

            const query = `
                INSERT INTO ideb_publico_referencia (uf, municipio, codigo_ibge, ano, etapa, ideb_observado)
                VALUES ${valueClauses.join(', ')};
            `;
            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log('Carga de municípios em `ideb_publico_referencia` concluída com sucesso!');

        // ---------------------------------------------------------------------
        // 3. ATUALIZAR ESCOLAS EM `ideb_escolas_referencia` (BATCH)
        // ---------------------------------------------------------------------
        console.log('Lendo planilha de escolas:', EXCEL_ESC_PATH);
        const wbEsc = xlsx.readFile(EXCEL_ESC_PATH);
        const rowsEsc = xlsx.utils.sheet_to_json(wbEsc.Sheets[wbEsc.SheetNames[0]], { header: 1 });

        const escolaRecords = [];
        for (let i = 5; i < rowsEsc.length; i++) {
            const r = rowsEsc[i];
            if (!r || !r[0] || !String(r[0]).match(/^\d{7,8}$/)) continue;

            escolaRecords.push({
                codigo_inep: String(r[0]).trim(),
                nome: String(r[1] || '').trim(),
                municipio: String(r[2] || '').trim(),
                codigo_municipio: String(r[3] || '').trim(),
                rede: String(r[4] || 'Municipal').trim(),
                ai_2015: parseVal(r[5]),
                ai_2017: parseVal(r[6]),
                ai_2019: parseVal(r[7]),
                ai_2021: parseVal(r[8]),
                ai_2023: parseVal(r[9]),
                ai_2025: parseVal(r[10]),
                af_2015: parseVal(r[11]),
                af_2017: parseVal(r[12]),
                af_2019: parseVal(r[13]),
                af_2021: parseVal(r[14]),
                af_2023: parseVal(r[15]),
                af_2025: parseVal(r[16])
            });
        }

        console.log(`Inserindo ${escolaRecords.length} escolas em lotes...`);
        await client.query('BEGIN');
        await client.query('TRUNCATE TABLE ideb_escolas_referencia;');

        const ESC_BATCH_SIZE = 250;
        for (let i = 0; i < escolaRecords.length; i += ESC_BATCH_SIZE) {
            const batch = escolaRecords.slice(i, i + ESC_BATCH_SIZE);
            const valueClauses = [];
            const values = [];

            batch.forEach((row, idx) => {
                const offset = idx * 17;
                valueClauses.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17})`);
                values.push(
                    row.codigo_inep, row.nome, row.municipio, row.codigo_municipio, row.rede,
                    row.ai_2015, row.ai_2017, row.ai_2019, row.ai_2021, row.ai_2023, row.ai_2025,
                    row.af_2015, row.af_2017, row.af_2019, row.af_2021, row.af_2023, row.af_2025
                );
            });

            const query = `
                INSERT INTO ideb_escolas_referencia (
                    codigo_inep, nome, municipio, codigo_municipio, rede,
                    ai_2015, ai_2017, ai_2019, ai_2021, ai_2023, ai_2025,
                    af_2015, af_2017, af_2019, af_2021, af_2023, af_2025
                ) VALUES ${valueClauses.join(', ')};
            `;
            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log('Carga de escolas em `ideb_escolas_referencia` concluída com sucesso!');

        // 4. Verificação Final
        const checkMun = await client.query(`
            SELECT COUNT(*) as total_registros, 
                   COUNT(DISTINCT codigo_ibge) as total_municipios, 
                   MIN(ano) as menor_ano, 
                   MAX(ano) as maior_ano,
                   COUNT(ideb_observado) as preenchidos
            FROM ideb_publico_referencia WHERE uf = 'MA';
        `);
        console.log('\n--- Status de ideb_publico_referencia no PostgreSQL ---');
        console.table(checkMun.rows);

        const checkEsc = await client.query(`
            SELECT COUNT(*) as total_escolas, 
                   COUNT(DISTINCT municipio) as cidades_com_escola,
                   COUNT(ai_2025) as escolas_com_ai_2025,
                   COUNT(af_2025) as escolas_com_af_2025
            FROM ideb_escolas_referencia;
        `);
        console.log('\n--- Status de ideb_escolas_referencia no PostgreSQL ---');
        console.table(checkEsc.rows);

        client.release();
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Erro durante a carga batch no PostgreSQL:', e);
        throw e;
    } finally {
        await pool.end();
    }
}

runSeed().then(() => {
    console.log('\n=== CARGA COMPLETA DO BANCO POSTGRESQL CONCLUÍDA COM ÊXITO! ===');
}).catch(err => {
    console.error('Falha crítica:', err);
    process.exit(1);
});
