const fs = require('fs');
const path = require('path');
const geminiQuestionService = require('../services/ai/geminiQuestionService');

async function runMigration() {
    console.log('==============================================================');
    console.log('🚀 INICIANDO MIGRAÇÃO RETROATIVA DE EMBEDDINGS (text-embedding-004)');
    console.log('==============================================================\n');

    const localDbPath = path.join(__dirname, '..', 'local_db_state.json');
    if (!fs.existsSync(localDbPath)) {
        console.log('Nenhum arquivo local_db_state.json encontrado. Criando base padrão.');
        return;
    }

    const stateData = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    const questions = stateData.dbQuestoes || [];
    console.log(`Total de questões encontradas: ${questions.length}`);

    let updatedCount = 0;
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.embedding || !Array.isArray(q.embedding) || q.embedding.length === 0) {
            console.log(`[${i + 1}/${questions.length}] Gerando embedding para questão "${q.codigo_bncc || q.id}"...`);
            q.embedding = await geminiQuestionService.generateEmbedding(q.enunciado);
            updatedCount++;
        }
    }

    fs.writeFileSync(localDbPath, JSON.stringify(stateData, null, 2), 'utf8');
    console.log(`\n🎉 Migração concluída com sucesso! ${updatedCount} questões receberam vetores de embedding.\n`);
}

runMigration().catch(err => {
    console.error('Erro na migração de embeddings:', err);
});
