const fs = require('fs');
const path = require('path');
const descritoresOficiais = require('../../matriz_descritores_excel_oficial.js');

// Variáveis de Configuração
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
const GEMINI_THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || 'high';
const GEMINI_SIMILARITY_THRESHOLD = parseFloat(process.env.GEMINI_SIMILARITY_THRESHOLD || '0.85');

// Lista pré-definida de temas de contexto por disciplina para sorteio obrigatório
const CONTEXT_THEMES_BY_SUBJECT = {
    'Língua Portuguesa': [
        'mercado e feira livre comunitária',
        'esporte escolar e superação esportiva',
        'natureza, fauna e flora maranhense',
        'tecnologia e uso consciente de redes sociais',
        'cotidiano familiar e convivência intergeracional',
        'cidade, mobilidade urbana e trânsito seguro',
        'saúde preventiva, alimentação e hábitos saudáveis',
        'arte, música popular e bumba meu boi',
        'ciência, invenções e descobertas do dia a dia',
        'história local de Gonçalves Dias e tradições maranhenses'
    ],
    'Matemática': [
        'mercado, comércio local e economia doméstica',
        'campeonato esportivo, placares e estatísticas de jogos',
        'agricultura familiar, plantio e colheita de grãos',
        'construção civil, medição de terrenos e plantas de casas',
        'viagens rodoviárias, distâncias e consumo de combustível',
        'tecnologia, consumo de energia e franquia de internet',
        'culinária regional, receitas e porções fracionárias',
        'feira de ciências e jogos de tabuleiro'
    ],
    'Ciências da Natureza': [
        'energia solar, fontes renováveis e sustentabilidade',
        'saúde pública, vacinação e higiene coletiva',
        'ciclo da água, preservação dos rios e clima',
        'biodiversidade dos biomas Cerrado e Mata dos Cocais',
        'nutrição balanceada, digestão e grupos alimentares',
        'reciclagem de materiais e transformações físicas'
    ],
    'Geografia': [
        'Centro de Lançamento de Alcântara (CLA) e programa espacial',
        'bacias hidrográficas e relevo do Maranhão',
        'migração regional e formação das cidades',
        'estações do ano, fusos horários e clima tropical'
    ],
    'História': [
        'memória comunitária, patrimônio histórico e oralidade',
        'movimentos sociais e cidadania no Maranhão',
        'trabalho artesanal e evolução dos meios de comunicação'
    ],
    'default': [
        'cotidiano escolar e projetos comunitários',
        'feiras culturais e eventos esportivos',
        'meio ambiente e preservação ecológica',
        'trabalho, cooperação e cidadania ativa'
    ]
};

// Obter descrição completa do descritor na matriz oficial
function getFullDescriptorDescription(code, subject) {
    if (!code) return 'Habilidade curricular essencial';
    const cleanCode = code.trim().toUpperCase();

    // Busca em LP
    const lp = descritoresOficiais.portuguese.find(d => d.codigo.toUpperCase() === cleanCode);
    if (lp) return `${lp.codigo} - ${lp.desc} (${lp.topico})`;

    // Busca em MT
    const mt = descritoresOficiais.math.find(d => d.codigo.toUpperCase() === cleanCode);
    if (mt) return `${mt.codigo} - ${mt.desc} (${mt.topico})`;

    // Busca em Ciências
    const ci = descritoresOficiais.science.find(d => d.codigo.toUpperCase() === cleanCode);
    if (ci) return `${ci.codigo} - ${ci.desc} (${ci.topico})`;

    // Busca em OBA
    const oba = descritoresOficiais.oba.find(d => d.codigo.toUpperCase() === cleanCode);
    if (oba) return `${oba.codigo} - ${oba.desc} (${oba.topico})`;

    return `${code} - Habilidade referencial da matriz pedagógica`;
}

// Sorteio de tema de contexto no backend
function pickRandomContextTheme(subject) {
    const list = CONTEXT_THEMES_BY_SUBJECT[subject] || CONTEXT_THEMES_BY_SUBJECT['default'];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
}

// Cálculo de similaridade de cosseno entre dois vetores de embeddings
function calculateCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Gerar embedding usando text-embedding-004 do Gemini
async function generateEmbedding(text, apiKey = GEMINI_API_KEY) {
    if (!text) return null;

    if (!apiKey) {
        // Fallback determinístico de vetor vetorial de 768 dimensões para modo local/offline
        return generateMockVector(text);
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/text-embedding-004',
                content: {
                    parts: [{ text }]
                }
            })
        });

        if (!response.ok) {
            console.warn(`[Embedding API Warning] Status ${response.status}. Usando vetor de fallback.`);
            return generateMockVector(text);
        }

        const data = await response.json();
        if (data.embedding && data.embedding.values) {
            return data.embedding.values;
        }
        return generateMockVector(text);
    } catch (err) {
        console.warn('[Embedding Error]:', err.message);
        return generateMockVector(text);
    }
}

// Vetor determinístico para cenários offline/mock
function generateMockVector(text) {
    const dim = 768;
    const vec = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        vec[i % dim] += Math.sin(code * (i + 1));
    }
    // Normalizar
    let mag = 0;
    for (let i = 0; i < dim; i++) mag += vec[i] * vec[i];
    mag = Math.sqrt(mag) || 1;
    for (let i = 0; i < dim; i++) vec[i] /= mag;
    return vec;
}

// Montar o Prompt Rigoroso para o Gemini 3.7 Flash Thinking
function buildQuestionPrompt({ stage, subject, descriptorCode, difficulty, matrix, contextTheme, recentQuestionsHistory }) {
    const descriptorFull = getFullDescriptorDescription(descriptorCode, subject);

    let antiRepetitionSection = '';
    if (recentQuestionsHistory && recentQuestionsHistory.length > 0) {
        antiRepetitionSection = `
HISTÓRICO DE QUESTÕES RECENTES JÁ GERADAS PARA ESTE DESCRITOR (NÃO REPETIR CENÁRIOS, NOMES OU TEXTOS-BASE ABAIXO):
${recentQuestionsHistory.map((q, idx) => `${idx + 1}. [Tema: ${q.tema || 'Geral'}] ${q.enunciado ? q.enunciado.slice(0, 120) : 'Item anterior'}...`).join('\n')}

INSTRUÇÃO ANTI-REPETIÇÃO: É ESTRITAMENTE PROIBIDO repetir o enredo, personagens, valores numéricos ou estrutura textual das questões listadas acima. Crie uma situação 100% inédita.`;
    }

    return `Você é um Elaborador de Itens Sênior Especialista nas Matrizes de Avaliação Educacional ${matrix || 'SAEB / SEAMA / BNCC'}.
Sua missão é criar uma questão inédita, com rigor pedagógico absoluto, alinhada à matriz de referência e calibrada para a etapa escolar especificada.

=== PARÂMETROS OBRIGATÓRIOS DO ITEM ===
- ETAPA / ANO ESCOLAR: ${stage}
- COMPONENTE CURRICULAR: ${subject}
- MATRIZ: ${matrix || 'SAEB'}
- DESCRITOR / HABILIDADE ALVO: ${descriptorFull}
- NÍVEL DE DIFICULDADE: ${difficulty} (Adequado à faixa etária do ${stage})
- TEMA DE CONTEXTO OBRIGATÓRIO (SORTEADO): "${contextTheme}"

${antiRepetitionSection}

=== PROCESSO DE RACIOCÍNIO PEDAGÓGICO INTERNO (EXECUTE ANTES DE ESCREVER) ===
1. Mapeie rigorosamente o que o descritor "${descriptorFull}" exige cognitivamente do estudante do ${stage}.
2. Desenvolva um texto-base ou situação-problema envolvente e contextualizada exclusivamente no tema sorteado: "${contextTheme}".
3. Elabore o enunciado claro com comando direto.
4. Construa a ALTERNATIVA CORRETA que atende com precisão ao descritor.
5. Construa 3 DISTRATORES (alternativas incorretas) que representem equívocos conceituais plausíveis e frequentes cometidos por alunos nessa etapa (e não opções absurdas ou fáceis de descartar por eliminação óbvia).

=== FORMATO DE SAÍDA ESTRITO ===
Retorne EXCLUSIVAMENTE um objeto JSON válido (sem texto antes ou depois, sem formatação markdown fora do JSON).

{
  "enunciado": "Texto-base completo e comando da questão aqui.",
  "alternativas": {
    "A": "Texto da alternativa A",
    "B": "Texto da alternativa B",
    "C": "Texto da alternativa C",
    "D": "Texto da alternativa D"
  },
  "gabarito": "A",
  "justificativa_gabarito": "Explicação pedagógica detalhada demonstrando por que a alternativa indicada como gabarito atende exatamente ao descritor e por que os distratores estão incorretos."
}`;
}

// Função de Chamada da API Gemini com Thinking e Validação Robusta
async function callGeminiApi(prompt, apiKey = GEMINI_API_KEY, customModel = GEMINI_MODEL) {
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY não configurada no ambiente.');
    }

    const modelToUse = customModel || GEMINI_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`;

    // Configuração oficial Gemini 3.x: SEM temperature, top_p, top_k; COM thinkingConfig
    const requestBody = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            responseMimeType: 'application/json',
            thinkingConfig: {
                thinking_budget: 2048
            }
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Gemini (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        throw new Error('Resposta vazia da API do Gemini.');
    }

    const rawText = candidate.content.parts[0].text;
    return cleanAndParseJson(rawText);
}

// Extrair e validar JSON de forma robusta
function cleanAndParseJson(rawText) {
    let clean = rawText.trim();
    // Remover blocos de código ```json ... ``` se vierem
    if (clean.startsWith('```json')) {
        clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (clean.startsWith('```')) {
        clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(clean);

    // Validação de campos obrigatórios
    if (!parsed.enunciado || typeof parsed.enunciado !== 'string') {
        throw new Error('Campo "enunciado" inválido ou ausente.');
    }
    if (!parsed.alternativas || typeof parsed.alternativas !== 'object') {
        throw new Error('Objeto "alternativas" inválido ou ausente.');
    }
    const altKeys = Object.keys(parsed.alternativas);
    if (!altKeys.includes('A') || !altKeys.includes('B') || !altKeys.includes('C') || !altKeys.includes('D')) {
        throw new Error('Alternativas incompletas. Esperadas chaves A, B, C e D.');
    }
    if (!['A', 'B', 'C', 'D'].includes(parsed.gabarito)) {
        throw new Error(`Gabarito inválido: ${parsed.gabarito}. Deve ser A, B, C ou D.`);
    }
    if (!parsed.justificativa_gabarito) {
        parsed.justificativa_gabarito = 'Alternativa correta de acordo com as habilidades avaliadas no descritor.';
    }

    return parsed;
}

// Motor Principal de Geração com Deduplicação e Retentativas
async function generateEducationalQuestion({
    stage = '5º Ano',
    subject = 'Língua Portuguesa',
    descriptorCode = 'D03',
    difficulty = 'Médio',
    matrix = 'SAEB',
    existingQuestionsDb = [],
    apiKey = GEMINI_API_KEY,
    customModel = GEMINI_MODEL
}) {
    const maxTries = 3;
    let lastGeneratedQuestion = null;
    let selectedTheme = '';

    // Filtrar questões do mesmo descritor no histórico existente
    const sameDescriptorQuestions = (existingQuestionsDb || []).filter(q => {
        return q.codigo_bncc && q.codigo_bncc.toUpperCase().includes(descriptorCode.toUpperCase());
    });

    const recentHistory = sameDescriptorQuestions.slice(0, 8).map(q => ({
        tema: q.temaContexto || 'Geral',
        enunciado: q.enunciado
    }));

    for (let attempt = 1; attempt <= maxTries; attempt++) {
        selectedTheme = pickRandomContextTheme(subject);
        const prompt = buildQuestionPrompt({
            stage,
            subject,
            descriptorCode,
            difficulty,
            matrix,
            contextTheme: selectedTheme,
            recentQuestionsHistory: recentHistory
        });

        let parsedQuestion = null;
        let apiRetries = 0;

        while (apiRetries < 2) {
            try {
                if (apiKey) {
                    parsedQuestion = await callGeminiApi(prompt, apiKey, customModel);
                } else {
                    // Fallback simulador pedagógico inteligente com tema sorteado caso sem API Key
                    parsedQuestion = generateSmartPedagogicalFallback({ stage, subject, descriptorCode, difficulty, matrix, contextTheme: selectedTheme });
                }
                break;
            } catch (err) {
                apiRetries++;
                console.warn(`[Tentativa ${apiRetries}] Erro de parsing/API: ${err.message}. Retentando...`);
                if (apiRetries >= 2) {
                    parsedQuestion = generateSmartPedagogicalFallback({ stage, subject, descriptorCode, difficulty, matrix, contextTheme: selectedTheme });
                }
            }
        }

        // Gerar Embedding do Enunciado
        const embedding = await generateEmbedding(parsedQuestion.enunciado, apiKey);

        // Checagem de Similaridade de Cosseno contra itens do banco
        let maxSimilarity = 0;
        let mostSimilarItem = null;

        for (const existing of sameDescriptorQuestions) {
            if (existing.embedding && Array.isArray(existing.embedding)) {
                const sim = calculateCosineSimilarity(embedding, existing.embedding);
                if (sim > maxSimilarity) {
                    maxSimilarity = sim;
                    mostSimilarItem = existing;
                }
            }
        }

        console.log(`[Deduplicação Semântica] Tentativa ${attempt}/${maxTries} • Tema: "${selectedTheme}" • Similaridade Máxima: ${maxSimilarity.toFixed(4)}`);

        const formattedItem = {
            id: `Q_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            matriz: matrix || 'SAEB',
            codigo_bncc: `${descriptorCode} (${subject === 'Língua Portuguesa' ? 'LP' : 'MAT'} - ${stage})`,
            disciplina: subject,
            etapa: stage,
            dificuldade: difficulty,
            nivel_cognitivo: difficulty === 'Fácil' ? 'Compreender' : (difficulty === 'Médio' ? 'Analisar' : 'Avaliar'),
            temaContexto: selectedTheme,
            enunciado: parsedQuestion.enunciado,
            opcoes: [
                { letra: 'A', texto: parsedQuestion.alternativas.A, correta: parsedQuestion.gabarito === 'A' },
                { letra: 'B', texto: parsedQuestion.alternativas.B, correta: parsedQuestion.gabarito === 'B' },
                { letra: 'C', texto: parsedQuestion.alternativas.C, correta: parsedQuestion.gabarito === 'C' },
                { letra: 'D', texto: parsedQuestion.alternativas.D, correta: parsedQuestion.gabarito === 'D' }
            ],
            gabarito: parsedQuestion.gabarito,
            explicacao: `GABARITO: ${parsedQuestion.gabarito}. ${parsedQuestion.justificativa_gabarito}`,
            embedding: embedding,
            modelo_ia: customModel || GEMINI_MODEL,
            thinking_level: GEMINI_THINKING_LEVEL,
            created_at: new Date().toISOString()
        };

        if (maxSimilarity <= GEMINI_SIMILARITY_THRESHOLD) {
            // Aprovada sem repetição
            return formattedItem;
        }

        lastGeneratedQuestion = formattedItem;
    }

    // Se após 3 tentativas ainda for > 0.85, marca com a flag para revisão sem travar o usuário
    if (lastGeneratedQuestion) {
        lastGeneratedQuestion.revisar_similaridade = true;
        return lastGeneratedQuestion;
    }

    return generateSmartPedagogicalFallback({ stage, subject, descriptorCode, difficulty, matrix, contextTheme: selectedTheme });
}

// Gerador Pedagógico Inteligente Fallback
function generateSmartPedagogicalFallback({ stage, subject, descriptorCode, difficulty, matrix, contextTheme }) {
    const descFull = getFullDescriptorDescription(descriptorCode, subject);
    const timestamp = Date.now();

    if (subject === 'Língua Portuguesa') {
        return {
            enunciado: `Leia o texto abaixo sobre ${contextTheme}:\n\n"Durante uma atividade sobre ${contextTheme} na escola municipal, os estudantes de Gonçalves Dias observaram atentamente os detalhes apresentados pelo professor. Lucas logo percebeu que pequenas mudanças nos hábitos diários trazem grandes benefícios para toda a comunidade."\n\nNo texto, a informação principal destacada pelos alunos refere-se a:`,
            alternativas: {
                A: `À importância das mudanças positivas de hábitos a partir de ${contextTheme}.`,
                B: 'Ao cancelamento das aulas devido a eventos climáticos.',
                C: 'À necessidade de comprar novos equipamentos eletrônicos para a escola.',
                D: 'Ao deslocamento de todos os alunos para outra localidade.'
            },
            gabarito: 'A',
            justificativa_gabarito: `A alternativa A sintetiza com fidelidade o tema central trabalhado no texto sobre ${contextTheme}, alinhando-se ao descritor ${descFull}.`
        };
    } else {
        return {
            enunciado: `Em uma situação prática envolvendo ${contextTheme}, uma equipe organizou um projeto em Gonçalves Dias com 3 etapas. Na primeira etapa, foram computadas 450 unidades; na segunda etapa, 380 unidades; e na terceira, 520 unidades. Ao final, 600 unidades foram distribuídas aos participantes.\n\nQuantas unidades restaram no total?`,
            alternativas: {
                A: '650 unidades',
                B: '750 unidades',
                C: '820 unidades',
                D: '900 unidades'
            },
            gabarito: 'B',
            justificativa_gabarito: `Total computado: 450 + 380 + 520 = 1.350 unidades. Subtraindo as 600 distribuídas: 1.350 - 600 = 750 unidades restantes.`
        };
    }
}

module.exports = {
    generateEducationalQuestion,
    generateEmbedding,
    calculateCosineSimilarity,
    pickRandomContextTheme,
    getFullDescriptorDescription,
    buildQuestionPrompt,
    cleanAndParseJson,
    GEMINI_MODEL,
    GEMINI_THINKING_LEVEL,
    GEMINI_SIMILARITY_THRESHOLD
};
