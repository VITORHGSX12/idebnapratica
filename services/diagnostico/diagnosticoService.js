const fs = require('fs');
const path = require('path');
const descritoresOficiais = require('../../matriz_descritores_excel_oficial.js');
const geminiService = require('../ai/geminiQuestionService');

// Limiares de Classificação Configuráveis
const THRESHOLD_CRITICO = parseFloat(process.env.DIAG_THRESHOLD_CRITICO || '50.0');
const THRESHOLD_ATENCAO = parseFloat(process.env.DIAG_THRESHOLD_ATENCAO || '70.0');

// =============================================================================
// SEED E CARREGAMENTO DE SIMULADOS E RESPOSTAS POR ITEM
// =============================================================================

const SIMULADOS_OFICIAIS_DB = [
    {
        id: 'sim_2026_01',
        nome: '1º Simulado Diagnóstico SAEB / SEAMA 2026',
        data_aplicacao: '2026-03-15',
        etapa: '5º Ano',
        componentes_avaliados: ['Língua Portuguesa', 'Matemática'],
        total_questoes: 20
    },
    {
        id: 'sim_2026_02',
        nome: '2º Simulado Bimestral de Recomposição 2026',
        data_aplicacao: '2026-05-20',
        etapa: '5º Ano',
        componentes_avaliados: ['Língua Portuguesa', 'Matemática'],
        total_questoes: 20
    }
];

// Gerar base estruturada de respostas por item para os alunos de Gonçalves Dias
function generateInitialRespostasDb() {
    const respostas = [];
    const escolas = [
        { id: 'esc_01', nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS' },
        { id: 'esc_02', nome: 'U I BASILIO ALVES' },
        { id: 'esc_03', nome: 'UI JOSE CORREA LIMA' },
        { id: 'esc_04', nome: 'UE ANITA FURTADO' },
        { id: 'esc_05', nome: 'UI EMILIO MURAD' }
    ];

    const descritoresAvaliados = [
        { codigo: 'D1', componente: 'Língua Portuguesa', taxa_base: 0.42 }, // Crítico
        { codigo: 'D3', componente: 'Língua Portuguesa', taxa_base: 0.58 }, // Atenção
        { codigo: 'D4', componente: 'Língua Portuguesa', taxa_base: 0.46 }, // Crítico
        { codigo: 'D6', componente: 'Língua Portuguesa', taxa_base: 0.78 }, // Adequado
        { codigo: 'D14', componente: 'Língua Portuguesa', taxa_base: 0.64 }, // Atenção
        { codigo: 'D13', componente: 'Matemática', taxa_base: 0.40 }, // Crítico
        { codigo: 'D16', componente: 'Matemática', taxa_base: 0.52 }, // Atenção
        { codigo: 'D19', componente: 'Matemática', taxa_base: 0.61 }, // Atenção
        { codigo: 'D26', componente: 'Matemática', taxa_base: 0.48 }, // Crítico
        { codigo: 'D28', componente: 'Matemática', taxa_base: 0.82 }  // Adequado
    ];

    const alunosNomes = [
        { id: 'al_001', nome: 'Ana Clara Silva Santos', turma: '5º Ano A', baseBonus: 0.15 },
        { id: 'al_002', nome: 'Lucas Gabriel Oliveira', turma: '5º Ano A', baseBonus: -0.10 },
        { id: 'al_003', nome: 'Maria Eduarda Fernandes', turma: '5º Ano A', baseBonus: 0.20 },
        { id: 'al_004', nome: 'João Pedro Carvalho', turma: '5º Ano A', baseBonus: -0.15 },
        { id: 'al_005', nome: 'Beatriz Costa Lima', turma: '5º Ano A', baseBonus: 0.05 },
        { id: 'al_006', nome: 'Guilherme Souza Ramos', turma: '5º Ano B', baseBonus: 0.10 },
        { id: 'al_007', nome: 'Larissa Alves Moreira', turma: '5º Ano B', baseBonus: -0.05 },
        { id: 'al_008', nome: 'Matheus Henrique Cruz', turma: '5º Ano B', baseBonus: -0.20 },
        { id: 'al_009', nome: 'Yasmin Ribeiro Dias', turma: '5º Ano B', baseBonus: 0.18 },
        { id: 'al_010', nome: 'Enzo Gabriel Castro', turma: '5º Ano B', baseBonus: 0.00 }
    ];

    // Simulado 1 (Diagnóstico Inicial) e Simulado 2 (com evolução positiva de ~12% na rede)
    SIMULADOS_OFICIAIS_DB.forEach((sim, sIdx) => {
        const evolutionMultiplier = sIdx === 0 ? 0.0 : 0.14; // Simulado 2 tem melhora

        escolas.forEach(esc => {
            alunosNomes.forEach(al => {
                descritoresAvaliados.forEach((desc, qIdx) => {
                    const seedProbability = desc.taxa_base + al.baseBonus + evolutionMultiplier + (Math.sin(al.id.charCodeAt(3) + qIdx) * 0.08);
                    const isCorrect = Math.random() < Math.max(0.1, Math.min(0.95, seedProbability));

                    respostas.push({
                        id: `resp_${sim.id}_${esc.id}_${al.id}_${desc.codigo}`,
                        simulado_id: sim.id,
                        simulado_nome: sim.nome,
                        aluno_id: al.id,
                        aluno_nome: al.nome,
                        escola_id: esc.id,
                        escola_nome: esc.nome,
                        turma_id: `turma_${esc.id}_${al.turma.replace(/\s+/g, '_')}`,
                        turma_nome: al.turma,
                        questao_id: `q_${desc.codigo}_${qIdx + 1}`,
                        descritor_codigo: desc.codigo,
                        componente: desc.componente,
                        alternativa_marcada: isCorrect ? 'B' : ['A', 'C', 'D'][Math.floor(Math.random() * 3)],
                        gabarito_oficial: 'B',
                        correta: isCorrect,
                        data_aplicacao: sim.data_aplicacao
                    });
                });
            });
        });
    });

    return respostas;
}

let cachedRespostasSimuladoDb = null;
function getRespostasSimuladoDb() {
    if (!cachedRespostasSimuladoDb) {
        cachedRespostasSimuladoDb = generateInitialRespostasDb();
    }
    return cachedRespostasSimuladoDb;
}

// =============================================================================
// FUNÇÃO 1: CALCULAR DESEMPENHO POR DESCRITOR (ORDENADO DO MAIS GRAVE AO CONSOLIDADO)
// =============================================================================
function calcularDesempenhoPorDescritor(filtros = {}) {
    const {
        escola_id = 'all',
        turma_nome = 'all',
        componente = 'all',
        simulado_id = 'all'
    } = filtros;

    const respostasDb = getRespostasSimuladoDb();

    // Filtrar respostas conforme escopo selecionado
    const filtradas = respostasDb.filter(r => {
        if (escola_id !== 'all' && r.escola_nome !== escola_id && r.escola_id !== escola_id) return false;
        if (turma_nome !== 'all' && r.turma_nome !== turma_nome) return false;
        if (componente !== 'all' && r.componente !== componente) return false;
        if (simulado_id !== 'all' && r.simulado_id !== simulado_id) return false;
        return true;
    });

    // Agrupar por descritor
    const descMap = {};

    filtradas.forEach(r => {
        if (!descMap[r.descritor_codigo]) {
            descMap[r.descritor_codigo] = {
                codigo: r.descritor_codigo,
                componente: r.componente,
                total_respostas: 0,
                total_acertos: 0,
                alunos_avaliados_set: new Set()
            };
        }
        descMap[r.descritor_codigo].total_respostas++;
        if (r.correta) descMap[r.descritor_codigo].total_acertos++;
        descMap[r.descritor_codigo].alunos_avaliados_set.add(r.aluno_id);
    });

    // Formatar resultados com percentual e classificação
    const resultado = Object.values(descMap).map(d => {
        const percentual = d.total_respostas > 0 ? (d.total_acertos / d.total_respostas) * 100 : 0;
        let classificacao = 'adequado';
        if (percentual < THRESHOLD_CRITICO) {
            classificacao = 'critico';
        } else if (percentual <= THRESHOLD_ATENCAO) {
            classificacao = 'atencao';
        }

        // Buscar descrição oficial
        const descCompleta = geminiService.getFullDescriptorDescription(d.codigo, d.componente);

        return {
            codigo: d.codigo,
            descricao: descCompleta,
            componente: d.componente,
            percentual_acerto: Math.round(percentual * 10) / 10,
            total_alunos_avaliados: d.alunos_avaliados_set.size,
            total_acertos: d.total_acertos,
            total_respostas: d.total_respostas,
            classificacao: classificacao
        };
    });

    // Ordenar estritamente do mais grave (menor percentual) para o mais consolidado
    resultado.sort((a, b) => a.percentual_acerto - b.percentual_acerto);
    return resultado;
}

// =============================================================================
// FUNÇÃO 2: CALCULAR RANKING DE ESCOLAS (COM VARIAÇÃO E DESCRITOR MAIS CRÍTICO)
// =============================================================================
function calcularRankingEscolas(filtros = {}) {
    const { componente = 'all', etapa = 'all' } = filtros;
    const respostasDb = getRespostasSimuladoDb();

    // Agrupar por escola
    const escolaMap = {};

    respostasDb.forEach(r => {
        if (componente !== 'all' && r.componente !== componente) return;

        if (!escolaMap[r.escola_nome]) {
            escolaMap[r.escola_nome] = {
                escola_id: r.escola_id,
                nome: r.escola_nome,
                simulado1_acertos: 0,
                simulado1_total: 0,
                simulado2_acertos: 0,
                simulado2_total: 0,
                descritores: {}
            };
        }

        const e = escolaMap[r.escola_nome];
        if (r.simulado_id === 'sim_2026_01') {
            e.simulado1_total++;
            if (r.correta) e.simulado1_acertos++;
        } else if (r.simulado_id === 'sim_2026_02') {
            e.simulado2_total++;
            if (r.correta) e.simulado2_acertos++;
        }

        if (!e.descritores[r.descritor_codigo]) {
            e.descritores[r.descritor_codigo] = { total: 0, acertos: 0, comp: r.componente };
        }
        e.descritores[r.descritor_codigo].total++;
        if (r.correta) e.descritores[r.descritor_codigo].acertos++;
    });

    const ranking = Object.values(escolaMap).map(e => {
        const pctSim1 = e.simulado1_total > 0 ? (e.simulado1_acertos / e.simulado1_total) * 100 : 0;
        const pctSim2 = e.simulado2_total > 0 ? (e.simulado2_acertos / e.simulado2_total) * 100 : pctSim1;
        const variacao = Math.round((pctSim2 - pctSim1) * 10) / 10;

        // Descritor mais crítico da escola
        let piorDesc = 'D1';
        let piorPct = 100;
        Object.entries(e.descritores).forEach(([cod, data]) => {
            const pct = (data.acertos / data.total) * 100;
            if (pct < piorPct) {
                piorPct = pct;
                piorDesc = cod;
            }
        });

        const pctGeral = Math.round(pctSim2 * 10) / 10;
        return {
            escola_id: e.escola_id,
            nome: e.nome,
            percentual_acerto_geral: pctGeral,
            descritor_mais_critico: {
                codigo: piorDesc,
                percentual: Math.round(piorPct * 10) / 10
            },
            variacao_desde_ultimo_simulado: variacao,
            tendencia: variacao > 0 ? 'evoluiu' : (variacao < 0 ? 'regrediu' : 'estavel'),
            is_critica: pctGeral < THRESHOLD_CRITICO
        };
    });

    ranking.sort((a, b) => b.percentual_acerto_geral - a.percentual_acerto_geral);
    return ranking;
}

// =============================================================================
// FUNÇÃO 3: CALCULAR EVOLUÇÃO DO ALUNO (CRONOLÓGICA ENTRE SIMULADOS)
// =============================================================================
function calcularEvolucaoAluno(aluno_id) {
    const respostasDb = getRespostasSimuladoDb();
    const alunoRespostas = respostasDb.filter(r => r.aluno_id === aluno_id);
    if (alunoRespostas.length === 0) return null;

    const alunoNome = alunoRespostas[0].aluno_nome;
    const escolaNome = alunoRespostas[0].escola_nome;
    const turmaNome = alunoRespostas[0].turma_nome;

    const descMap = {};

    alunoRespostas.forEach(r => {
        if (!descMap[r.descritor_codigo]) {
            descMap[r.descritor_codigo] = {
                codigo: r.descritor_codigo,
                componente: r.componente,
                sim1_correta: null,
                sim2_correta: null
            };
        }

        if (r.simulado_id === 'sim_2026_01') {
            descMap[r.descritor_codigo].sim1_correta = r.correta;
        } else if (r.simulado_id === 'sim_2026_02') {
            descMap[r.descritor_codigo].sim2_correta = r.correta;
        }
    });

    let totalSim1Acertos = 0;
    let totalSim1Count = 0;
    let totalSim2Acertos = 0;
    let totalSim2Count = 0;

    const descritoresEvolucao = Object.values(descMap).map(d => {
        const pct1 = d.sim1_correta !== null ? (d.sim1_correta ? 100 : 0) : null;
        const pct2 = d.sim2_correta !== null ? (d.sim2_correta ? 100 : 0) : null;

        if (d.sim1_correta !== null) { totalSim1Count++; if (d.sim1_correta) totalSim1Acertos++; }
        if (d.sim2_correta !== null) { totalSim2Count++; if (d.sim2_correta) totalSim2Acertos++; }

        let tendencia = 'estavel';
        if (pct1 !== null && pct2 !== null) {
            if (pct2 > pct1) tendencia = 'evoluiu';
            else if (pct2 < pct1) tendencia = 'regrediu';
        }

        return {
            codigo: d.codigo,
            componente: d.componente,
            simulado_anterior: pct1,
            simulado_atual: pct2,
            tendencia: tendencia,
            classificacao: pct2 === 100 ? 'adequado' : 'critico'
        };
    });

    const mediaSim1 = totalSim1Count > 0 ? (totalSim1Acertos / totalSim1Count) * 100 : 0;
    const mediaSim2 = totalSim2Count > 0 ? (totalSim2Acertos / totalSim2Count) * 100 : mediaSim1;
    const variacaoGeral = Math.round((mediaSim2 - mediaSim1) * 10) / 10;

    // Calcular nível de proficiência SAEB (Abaixo do Básico, Básico, Adequado, Avançado)
    let nivelProficiencia = 'Básico';
    if (mediaSim2 < 40) nivelProficiencia = 'Abaixo do Básico';
    else if (mediaSim2 < 70) nivelProficiencia = 'Básico';
    else if (mediaSim2 < 85) nivelProficiencia = 'Adequado';
    else nivelProficiencia = 'Avançado';

    return {
        aluno_id: aluno_id,
        nome: alunoNome,
        escola: escolaNome,
        turma: turmaNome,
        media_simulado_anterior: Math.round(mediaSim1 * 10) / 10,
        media_simulado_atual: Math.round(mediaSim2 * 10) / 10,
        variacao_geral: variacaoGeral,
        tendencia_geral: variacaoGeral > 5 ? 'evoluiu' : (variacaoGeral < -5 ? 'regrediu' : 'estavel'),
        nivel_proficiencia: nivelProficiencia,
        descritores: descritoresEvolucao
    };
}

// =============================================================================
// FUNÇÃO 4: CALCULAR FICHA DETALHADA DO ALUNO (TELA & IMPRESSÃO)
// =============================================================================
function calcularFichaAluno(aluno_id, simulado_id = 'sim_2026_02') {
    const evolucao = calcularEvolucaoAluno(aluno_id);
    if (!evolucao) return null;

    const respostasDb = getRespostasSimuladoDb();
    const respostasSim = respostasDb.filter(r => r.aluno_id === aluno_id && r.simulado_id === simulado_id);

    const descritoresFicha = respostasSim.map(r => ({
        codigo: r.descritor_codigo,
        componente: r.componente,
        alternativa_marcada: r.alternativa_marcada,
        gabarito: r.gabarito_oficial,
        correta: r.correta,
        descricao: geminiService.getFullDescriptorDescription(r.descritor_codigo, r.componente),
        classificacao: r.correta ? 'adequado' : 'critico'
    }));

    return {
        ...evolucao,
        simulado_selecionado_id: simulado_id,
        respostas_detalhadas: descritoresFicha
    };
}

// =============================================================================
// FUNÇÃO 5: GERAR SUGESTÃO DE INTERVENÇÃO PEDAGÓGICA (COM IA GEMINI)
// =============================================================================
async function gerarSugestaoIntervencao(descritoresCriticos = [], turmaNome = '5º Ano A', escolaNome = 'UI JOSE CORREA LIMA') {
    if (!descritoresCriticos || descritoresCriticos.length === 0) {
        return `✅ **Excelente Desempenho:** Não foram detectados descritores em situação crítica para a turma ${turmaNome}. Recomenda-se manter o ciclo de simulados e aprofundar desafios avançados da BNCC.`;
    }

    const descListFormatted = descritoresCriticos.slice(0, 3).map(d => `- **${d.codigo}:** ${d.descricao || d.codigo} (${d.percentual_acerto}% de acerto)`).join('\n');

    const prompt = `Você é um consultor pedagógico especialista em alfabetização e avaliações SAEB/SEAMA/BNCC.

A turma ${turmaNome} da escola ${escolaNome} apresenta desempenho crítico nos seguintes descritores:
${descListFormatted}

Sugira, em até 4 tópicos curtos e práticos, ações de intervenção pedagógica que o professor pode aplicar nas próximas semanas para trabalhar essas habilidades. Seja específico e prático, evite recomendações genéricas como "reforçar o conteúdo".`;

    try {
        if (process.env.GEMINI_API_KEY) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { thinkingConfig: { thinking_budget: 2048 } }
                })
            });

            if (resp.ok) {
                const data = await resp.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) return text;
            }
        }
    } catch(err) {
        console.warn('[Intervenção IA Warning]:', err.message);
    }

    // Fallback didático robusto
    return `### 📋 Plano de Intervenção Pedagógica Imediato (${turmaNome} - ${escolaNome})

1. **Oficina de Leitura e Inferência Contextual (${descritoresCriticos[0]?.codigo || 'D1'}):**
   - Trabalhar textos curtos do folclore maranhense com perguntas de pista e dedução de pistas implícitas em duplas.
2. **Resolução de Problemas com Material Concreto (${descritoresCriticos[1]?.codigo || 'D13'}):**
   - Utilizar encartes de supermercado de Gonçalves Dias e cédulas simuladas para fixar cálculos aditivos e estimativa de troco.
3. **Mini-Simulados Quinzenais de 5 Questões:**
   - Aplicar avaliações rápidas de 15 minutos com devolutiva imediata no quadro para desmistificar distratores comuns.
4. **Agrupamento Produtivo:**
   - Formar duplas entre estudantes com nível "Adequado" e "Crítico" para atividades cooperativas de recomposição.`;
}

module.exports = {
    SIMULADOS_OFICIAIS_DB,
    getRespostasSimuladoDb,
    calcularDesempenhoPorDescritor,
    calcularRankingEscolas,
    calcularEvolucaoAluno,
    calcularFichaAluno,
    gerarSugestaoIntervencao
};
