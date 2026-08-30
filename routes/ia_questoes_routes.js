// =============================================================================
// ROTAS DO BANCO DE QUESTÕES & INTELIGÊNCIA ARTIFICIAL (POSTGRESQL REAL)
// Persistência relacional de questões, importação em lote e geração via IA
// =============================================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');
const geminiQuestionService = require('../services/ai/geminiQuestionService');

// Fallback em memória caso o banco esteja inacessível
let memoryQuestoes = [
    {
        id: 'Q_01',
        matriz: 'SAEB',
        codigo_bncc: 'D03 (LP - 5º Ano)',
        disciplina: 'Língua Portuguesa',
        etapa: '5º Ano',
        dificuldade: 'Médio',
        nivel_cognitivo: 'Analisar',
        texto_base: 'O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave. Dona Francisca apressou o passo na vereda, sentindo o frescor da tarde anunciar o fim da colheita.',
        enunciado: 'No trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:',
        opcoes: [
            { letra: 'A', texto: 'Perder a consciência por cansaço físico.', correta: false },
            { letra: 'B', texto: 'Desaparecer lentamente ao entardecer.', correta: true },
            { letra: 'C', texto: 'Aumentar a intensidade de sua luz solar.', correta: false },
            { letra: 'D', texto: 'Mudar de posição devido ao vento forte.', correta: false }
        ],
        explicacao: 'GABARITO: B. A expressão "desmaiar no horizonte" é uma metáfora poética que expressa o pôr do sol gradativo.',
        origem: 'MANUAL'
    },
    {
        id: 'Q_02',
        matriz: 'SAEB',
        codigo_bncc: 'D13 (MAT - 5º Ano)',
        disciplina: 'Matemática',
        etapa: '5º Ano',
        dificuldade: 'Fácil',
        nivel_cognitivo: 'Aplicar',
        texto_base: null,
        enunciado: 'Na feira do produtor rural de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele conseguiu vender 1.830 espigas.\n\nQuantas espigas de milho restaram com Seu Raimundo?',
        opcoes: [
            { letra: 'A', texto: '500 espigas', correta: false },
            { letra: 'B', texto: '600 espigas', correta: true },
            { letra: 'C', texto: '650 espigas', correta: false },
            { letra: 'D', texto: '720 espigas', correta: false }
        ],
        explicacao: 'GABARITO: B. Total colhido: 1.450 + 980 = 2.430 espigas. Restante após as vendas: 2.430 - 1.830 = 600 espigas.',
        origem: 'MANUAL'
    },
    {
        id: 'Q_03',
        matriz: 'SEAMA',
        codigo_bncc: 'D28 (MAT - 9º Ano)',
        disciplina: 'Matemática',
        etapa: '9º Ano',
        dificuldade: 'Médio',
        nivel_cognitivo: 'Analisar',
        texto_base: null,
        enunciado: 'A tabela abaixo registra o número de livros lidos pelos estudantes de uma turma durante o 1º bimestre:\n\n• 1 a 2 livros: 12 alunos\n• 3 a 4 livros: 18 alunos\n• 5 ou mais livros: 10 alunos\n\nQual é o percentual de estudantes que leram 3 ou mais livros nessa turma?',
        opcoes: [
            { letra: 'A', texto: '30%', correta: false },
            { letra: 'B', texto: '45%', correta: false },
            { letra: 'C', texto: '70%', correta: true },
            { letra: 'D', texto: '80%', correta: false }
        ],
        explicacao: 'GABARITO: C. Total de alunos na turma = 12 + 18 + 10 = 40 alunos. Alunos que leram 3 ou mais livros = 18 + 10 = 28 alunos. Percentual = (28 / 40) × 100 = 70%.',
        origem: 'MANUAL'
    }
];

// -----------------------------------------------------------------------------
// 1. ENDPOINTS DO BANCO DE QUESTÕES (/api/questoes)
// -----------------------------------------------------------------------------

// GET /api/questoes - Listagem de questões com filtros dinâmicos
router.get('/questoes', async (req, res) => {
    try {
        const { matriz, etapa, disciplina, dificuldade, search, origem } = req.query || {};

        if (!db.useLocalFallback) {
            let sql = `
                SELECT 
                    id, matriz, codigo_bncc, disciplina, etapa, dificuldade, nivel_cognitivo,
                    texto_base, enunciado, opcoes_json as opcoes, gabarito, explicacao, origem,
                    criado_em as "criadoEm", atualizado_em as "atualizadoEm"
                FROM questoes
                WHERE 1=1
            `;
            const params = [];

            if (matriz && matriz !== 'all') {
                params.push(matriz);
                sql += ` AND matriz = $${params.length}`;
            }
            if (etapa && etapa !== 'all') {
                params.push(etapa);
                sql += ` AND etapa = $${params.length}`;
            }
            if (disciplina && disciplina !== 'all') {
                params.push(disciplina);
                sql += ` AND disciplina = $${params.length}`;
            }
            if (dificuldade && dificuldade !== 'all') {
                params.push(dificuldade);
                sql += ` AND dificuldade = $${params.length}`;
            }
            if (origem && origem !== 'all') {
                params.push(origem);
                sql += ` AND origem = $${params.length}`;
            }
            if (search) {
                params.push(`%${search}%`);
                sql += ` AND (enunciado ILIKE $${params.length} OR codigo_bncc ILIKE $${params.length} OR texto_base ILIKE $${params.length})`;
            }

            sql += ` ORDER BY criado_em DESC`;

            const queryRes = await db.query(sql, params);
            if (queryRes && queryRes.rows && queryRes.rows.length > 0) {
                return res.json({ success: true, questions: queryRes.rows });
            }
        }

        // Fallback local em memória
        let filtered = memoryQuestoes;
        if (matriz && matriz !== 'all') filtered = filtered.filter(q => q.matriz === matriz);
        if (etapa && etapa !== 'all') filtered = filtered.filter(q => q.etapa === etapa);
        if (disciplina && disciplina !== 'all') filtered = filtered.filter(q => q.disciplina === disciplina);
        if (dificuldade && dificuldade !== 'all') filtered = filtered.filter(q => q.dificuldade === dificuldade);
        if (search) {
            const sq = search.toLowerCase();
            filtered = filtered.filter(q => (q.enunciado && q.enunciado.toLowerCase().includes(sq)) || (q.codigo_bncc && q.codigo_bncc.toLowerCase().includes(sq)));
        }

        res.json({ success: true, questions: filtered });
    } catch (err) {
        console.warn('[Questoes GET Fallback]', err.message);
        res.json({ success: true, questions: memoryQuestoes });
    }
});

// POST /api/questoes - Cadastro / Upsert de questão única
router.post('/questoes', async (req, res) => {
    try {
        const q = req.body || {};
        const id = q.id || `q_${Date.now()}_${Math.floor(Math.random()*1000)}`;
        const matriz = q.matriz || 'SAEB';
        const codigoBncc = q.codigo_bncc || q.codigoBncc || 'D01';
        const disciplina = q.disciplina || 'Língua Portuguesa';
        const etapa = q.etapa || '5º Ano';
        const dificuldade = q.dificuldade || 'Médio';
        const nivelCognitivo = q.nivel_cognitivo || q.nivelCognitivo || 'Compreender';
        const textoBase = q.texto_base || q.textoBase || null;
        const enunciado = q.enunciado || '';
        const opcoes = Array.isArray(q.opcoes) ? q.opcoes : [];
        const gabarito = q.gabarito || (opcoes.find(o => o.correta)?.letra || 'A');
        const explicacao = q.explicacao || '';
        const origem = q.origem || 'MANUAL';

        if (!enunciado) {
            return res.status(400).json({ success: false, error: 'Enunciado da questão é obrigatório.' });
        }

        if (!db.useLocalFallback) {
            await db.query(`
                INSERT INTO questoes (
                    id, matriz, codigo_bncc, disciplina, etapa, dificuldade, nivel_cognitivo,
                    texto_base, enunciado, opcoes_json, gabarito, explicacao, origem, atualizado_em
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    matriz = EXCLUDED.matriz,
                    codigo_bncc = EXCLUDED.codigo_bncc,
                    disciplina = EXCLUDED.disciplina,
                    etapa = EXCLUDED.etapa,
                    dificuldade = EXCLUDED.dificuldade,
                    nivel_cognitivo = EXCLUDED.nivel_cognitivo,
                    texto_base = EXCLUDED.texto_base,
                    enunciado = EXCLUDED.enunciado,
                    opcoes_json = EXCLUDED.opcoes_json,
                    gabarito = EXCLUDED.gabarito,
                    explicacao = EXCLUDED.explicacao,
                    origem = EXCLUDED.origem,
                    atualizado_em = NOW()
            `, [
                id, matriz, codigoBncc, disciplina, etapa, dificuldade, nivelCognitivo,
                textoBase, enunciado, JSON.stringify(opcoes), gabarito, explicacao, origem
            ]);
        }

        const questionObj = {
            id, matriz, codigo_bncc: codigoBncc, disciplina, etapa, dificuldade,
            nivel_cognitivo: nivelCognitivo, texto_base: textoBase, enunciado,
            opcoes, gabarito, explicacao, origem, criadoEm: new Date().toISOString()
        };

        const idx = memoryQuestoes.findIndex(item => item.id === id);
        if (idx !== -1) memoryQuestoes[idx] = questionObj;
        else memoryQuestoes.unshift(questionObj);

        res.status(201).json({ success: true, question: questionObj });
    } catch (err) {
        console.error('[POST /questoes Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/questoes/batch - Importação de questões em lote
router.post('/questoes/batch', async (req, res) => {
    try {
        const { questions = [] } = req.body || {};
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ success: false, error: 'Lista de questões vazia ou inválida.' });
        }

        let savedCount = 0;
        for (const q of questions) {
            const id = q.id || `q_imp_${Date.now()}_${Math.floor(Math.random()*1000)}`;
            const matriz = q.matriz || 'SAEB';
            const codigoBncc = q.codigo_bncc || q.codigoBncc || 'D01';
            const disciplina = q.disciplina || 'Língua Portuguesa';
            const etapa = q.etapa || '5º Ano';
            const dificuldade = q.dificuldade || 'Médio';
            const nivelCognitivo = q.nivel_cognitivo || q.nivelCognitivo || 'Compreender';
            const textoBase = q.texto_base || q.textoBase || null;
            const enunciado = q.enunciado || '';
            const opcoes = Array.isArray(q.opcoes) ? q.opcoes : [];
            const gabarito = q.gabarito || (opcoes.find(o => o.correta)?.letra || 'A');
            const explicacao = q.explicacao || '';
            const origem = q.origem || 'IMPORTADO';

            if (!enunciado) continue;

            if (!db.useLocalFallback) {
                await db.query(`
                    INSERT INTO questoes (
                        id, matriz, codigo_bncc, disciplina, etapa, dificuldade, nivel_cognitivo,
                        texto_base, enunciado, opcoes_json, gabarito, explicacao, origem, atualizado_em
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        matriz = EXCLUDED.matriz,
                        codigo_bncc = EXCLUDED.codigo_bncc,
                        disciplina = EXCLUDED.disciplina,
                        etapa = EXCLUDED.etapa,
                        dificuldade = EXCLUDED.dificuldade,
                        nivel_cognitivo = EXCLUDED.nivel_cognitivo,
                        texto_base = EXCLUDED.texto_base,
                        enunciado = EXCLUDED.enunciado,
                        opcoes_json = EXCLUDED.opcoes_json,
                        gabarito = EXCLUDED.gabarito,
                        explicacao = EXCLUDED.explicacao,
                        origem = EXCLUDED.origem,
                        atualizado_em = NOW()
                `, [
                    id, matriz, codigoBncc, disciplina, etapa, dificuldade, nivelCognitivo,
                    textoBase, enunciado, JSON.stringify(opcoes), gabarito, explicacao, origem
                ]);
            }

            const qObj = {
                id, matriz, codigo_bncc: codigoBncc, disciplina, etapa, dificuldade,
                nivel_cognitivo: nivelCognitivo, texto_base: textoBase, enunciado,
                opcoes, gabarito, explicacao, origem
            };
            const idx = memoryQuestoes.findIndex(item => item.id === id);
            if (idx !== -1) memoryQuestoes[idx] = qObj;
            else memoryQuestoes.unshift(qObj);

            savedCount++;
        }

        res.status(200).json({ success: true, savedCount, message: `${savedCount} questões salvas no PostgreSQL.` });
    } catch (err) {
        console.error('[POST /questoes/batch Error]', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/questoes/:id - Exclusão de questão
router.delete('/questoes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!db.useLocalFallback) {
            await db.query('DELETE FROM questoes WHERE id = $1', [id]);
        }
        memoryQuestoes = memoryQuestoes.filter(q => q.id !== id);
        res.json({ success: true, message: 'Questão excluída com sucesso.' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// -----------------------------------------------------------------------------
// 2. ENDPOINTS DE INTELIGÊNCIA ARTIFICIAL & GERAÇÃO
// -----------------------------------------------------------------------------

// POST /api/ia/gerar-questao - Geração de questão BNCC/SAEB via Gemini IA
router.post('/ia/gerar-questao', async (req, res) => {
    try {
        const {
            stage = '5º Ano',
            subject = 'Língua Portuguesa',
            descriptorCode = 'D03',
            difficulty = 'Médio',
            matrix = 'SAEB',
            apiKey = process.env.GEMINI_API_KEY,
            customModel = process.env.GEMINI_MODEL || 'gemini-3.7-flash'
        } = req.body || {};

        let existingQuestions = [];
        try {
            if (!db.useLocalFallback) {
                const queryRes = await db.query('SELECT enunciado FROM questoes LIMIT 50');
                existingQuestions = queryRes.rows || [];
            }
        } catch(e) {}

        const generatedQuestion = await geminiQuestionService.generateEducationalQuestion({
            stage,
            subject,
            descriptorCode,
            difficulty,
            matrix,
            existingQuestionsDb: existingQuestions,
            apiKey,
            customModel
        });

        // Persistir automaticamente a questão gerada no PostgreSQL
        if (generatedQuestion && generatedQuestion.enunciado) {
            const qId = generatedQuestion.id || `q_ia_${Date.now()}`;
            generatedQuestion.id = qId;
            generatedQuestion.origem = 'IA';

            if (!db.useLocalFallback) {
                try {
                    await db.query(`
                        INSERT INTO questoes (
                            id, matriz, codigo_bncc, disciplina, etapa, dificuldade, nivel_cognitivo,
                            texto_base, enunciado, opcoes_json, gabarito, explicacao, origem, atualizado_em
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'IA', NOW())
                        ON CONFLICT (id) DO UPDATE SET
                            enunciado = EXCLUDED.enunciado,
                            opcoes_json = EXCLUDED.opcoes_json,
                            atualizado_em = NOW()
                    `, [
                        qId,
                        generatedQuestion.matriz || matrix,
                        generatedQuestion.codigo_bncc || descriptorCode,
                        generatedQuestion.disciplina || subject,
                        generatedQuestion.etapa || stage,
                        generatedQuestion.dificuldade || difficulty,
                        generatedQuestion.nivel_cognitivo || 'Analisar',
                        generatedQuestion.texto_base || null,
                        generatedQuestion.enunciado,
                        JSON.stringify(generatedQuestion.opcoes || []),
                        generatedQuestion.gabarito || 'A',
                        generatedQuestion.explicacao || ''
                    ]);
                } catch (dbErr) {
                    console.warn('[Auto-save IA Question Warning]', dbErr.message);
                }
            }
            memoryQuestoes.unshift(generatedQuestion);
        }

        res.json({
            success: true,
            question: generatedQuestion
        });
    } catch (err) {
        console.error('[API IA Geração Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Erro ao gerar questão com a API do Gemini.'
        });
    }
});

// POST /api/ia/embeddings/migrar - Migração em lote de vetores semânticos
router.post('/ia/embeddings/migrar', async (req, res) => {
    try {
        const { apiKey = process.env.GEMINI_API_KEY } = req.body || {};
        let count = 0;

        if (!db.useLocalFallback) {
            const queryRes = await db.query('SELECT id, enunciado, embedding FROM questoes WHERE embedding IS NULL');
            if (queryRes && queryRes.rows) {
                for (const q of queryRes.rows) {
                    const emb = await geminiQuestionService.generateEmbedding(q.enunciado, apiKey);
                    if (emb) {
                        await db.query('UPDATE questoes SET embedding = $1 WHERE id = $2', [JSON.stringify(emb), q.id]);
                        count++;
                    }
                }
            }
        }

        res.json({
            success: true,
            migrated: count,
            message: `Migração concluída com sucesso! ${count} questões receberam embeddings.`
        });
    } catch (err) {
        console.error('[API IA Migração Error]:', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Erro ao migrar embeddings.'
        });
    }
});

module.exports = router;
