// =============================================================================
// ROTAS DE INTELIGÊNCIA ARTIFICIAL: GERADOR DE QUESTÕES & EMBEDDINGS (ROUTER)
// =============================================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const geminiQuestionService = require('../services/ai/geminiQuestionService');

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
            const localDbPath = path.join(__dirname, '../local_db_state.json');
            if (fs.existsSync(localDbPath)) {
                const stateData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
                existingQuestions = stateData.dbQuestoes || [];
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
        const localDbPath = path.join(__dirname, '../local_db_state.json');
        if (!fs.existsSync(localDbPath)) {
            return res.json({ success: true, migrated: 0, message: 'Nenhum banco local encontrado.' });
        }

        const stateData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
        const questions = stateData.dbQuestoes || [];
        let count = 0;

        for (const q of questions) {
            if (!q.embedding || !Array.isArray(q.embedding)) {
                q.embedding = await geminiQuestionService.generateEmbedding(q.enunciado, apiKey);
                count++;
            }
        }

        fs.writeFileSync(localDbPath, JSON.stringify(stateData, null, 2), 'utf8');
        res.json({
            success: true,
            migrated: count,
            total: questions.length,
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
