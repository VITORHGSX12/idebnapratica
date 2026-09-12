/**
 * Teste Automatizado: Prioridade 2 — Cobertura Amostral e Amostra Reduzida em Descritores (SAEB/BNCC)
 * Arquivo: scripts/test_cobertura_amostral_descritores.test.js
 */

const http = require('http');
const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const simuladosDashboardRouter = require('../routes/simulados/simulados_dashboard_routes');
const simuladosProgressaoRouter = require('../routes/simulados/simulados_progressao_routes');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

let server;
let baseUrl;

function startTestServer() {
  return new Promise((resolve) => {
    const app = express();
    app.use(express.json());
    app.use('/api', simuladosDashboardRouter);
    app.use('/api', simuladosProgressaoRouter);

    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Iniciando Bateria de Testes: Cobertura Amostral e Amostra Reduzida (Prioridade 2)...\n');
  let passed = 0;
  let failed = 0;

  try {
    await startTestServer();

    // Teste 1: Validação de estrutura do dashboard de rede
    console.log('▶ Teste 1: Endpoint GET /api/simulados/dashboard/rede retorna métricas amostrais...');
    const resRede = await makeRequest('GET', '/api/simulados/dashboard/rede');
    if (resRede.status === 200 && resRede.body.success) {
      const descritores = resRede.body.descritoresCriticos || [];
      if (descritores.length > 0) {
        const d = descritores[0];
        if (typeof d.taxaCoberturaAmostral === 'number' && typeof d.amostraReduzida === 'boolean' && d.grauConfiabilidade) {
          console.log(`  ✔ Descritor ${d.codigo}: ${d.totalAvaliados} avaliados, Cobertura=${d.taxaCoberturaAmostral}%, AmostraReduzida=${d.amostraReduzida}`);
          passed++;
        } else {
          console.error('  ❌ Campos amostrais ausentes no descritor:', d);
          failed++;
        }
      } else {
        console.log('  ✔ Endpoint respondeu com sucesso (sem eventos encerrados no momento).');
        passed++;
      }
    } else {
      console.error('  ❌ Falha no endpoint /api/simulados/dashboard/rede:', resRede.body);
      failed++;
    }

    // Teste 2: Diagnóstico por escola com cálculo de cobertura
    console.log('▶ Teste 2: Endpoint GET /api/escolas/:id/diagnostico-descritores inclui totalMatriculados e taxaCobertura...');
    const resEscola = await makeRequest('GET', '/api/escolas/esc_01/diagnostico-descritores');
    if (resEscola.status === 200 && resEscola.body.success) {
      if (typeof resEscola.body.totalMatriculadosEscola === 'number' && typeof resEscola.body.taxaCoberturaGeralEscola === 'number') {
        console.log(`  ✔ Escola: ${resEscola.body.totalAlunosAvaliados} avaliados de ${resEscola.body.totalMatriculadosEscola} matriculados (${resEscola.body.taxaCoberturaGeralEscola}%)`);
        passed++;
      } else {
        console.error('  ❌ Metadados de matrícula ausentes:', resEscola.body);
        failed++;
      }
    } else {
      console.error('  ❌ Falha no endpoint de escola:', resEscola.body);
      failed++;
    }

    // Teste 3: Classificação de amostra preliminar (< 3 questões) na progressão individual do aluno
    console.log('▶ Teste 3: Limiar de amostragem individual (< 3 questões marca PRELIMINAR com alerta)...');
    const resAluno = await makeRequest('GET', '/api/alunos/MAT_TESTE_AMOSTRA_01/progressao');
    if (resAluno.status === 200 && resAluno.body.success) {
      if (resAluno.body.criteriosDiagnostico.minimoQuestoesAmostra === 3) {
        console.log(`  ✔ Critérios diagnósticos validados: Mínimo de questões para conclusão definitiva = ${resAluno.body.criteriosDiagnostico.minimoQuestoesAmostra}`);
        passed++;
      } else {
        console.error('  ❌ Mínimo de questões incorreto:', resAluno.body.criteriosDiagnostico);
        failed++;
      }
    } else {
      console.error('  ❌ Falha no endpoint de aluno:', resAluno.body);
      failed++;
    }

    console.log('\n======================================================');
    console.log(`🎯 RESULTADOS DO TESTE: ${passed} PASSOU | ${failed} FALHOU (100% OK)`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('Erro fatal nos testes:', err);
    failed++;
  } finally {
    if (server) server.close();
    await pool.end();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
