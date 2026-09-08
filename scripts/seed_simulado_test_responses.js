/**
 * ============================================================================
 * SCRIPT DE SIMULAÇÃO: PREENCHIMENTO ALEATÓRIO DE CARTÕES PELA SEMED (TESTE)
 * Arquivo: scripts/seed_simulado_test_responses.js
 * Descrição: Popula respostas de simulados realistas para turmas da rede (incluindo
 *            o 5º Ano da UI José Corrêa Lima) com taxa de participação ~94%,
 *            gerando dados estatísticos nos 4 níveis de proficiência SAEB.
 *            Inclui rotina de reversão (cleanSimuladoTestResponses) para exclusão pós-teste.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var STORAGE_KEY_RESPOSTAS = 'gd_respostas_simulados_data';
    var STORAGE_KEY_SIMULADO_DB = 'gd_simulado_respostas_db';

    // Gabarito oficial do 1º Simulado SAEB 2026 (5º Ano)
    var GABARITO_5_ANO = ['A','B','C','D','A','C','B','D','A','B','C','D','A','B','C','D','A','B','C','D'];
    var ALTERNATIVAS = ['A', 'B', 'C', 'D'];

    function generateRealisticAnswers(gabarito, targetAccuracy) {
        return gabarito.map(function(correctOption) {
            var isCorrect = Math.random() < targetAccuracy;
            if (isCorrect) return correctOption;
            var wrongOptions = ALTERNATIVAS.filter(function(opt) { return opt !== correctOption; });
            return wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
        });
    }

    function seedSimuladoTestResponses(options) {
        var eventoId = (options && options.eventoId) || 'evt_2026_01';
        var allStudents = typeof global.getOfficialStudentsState === 'function' 
            ? global.getOfficialStudentsState() 
            : (global.dbAlunos || []);

        var existingRespostas = {};
        try {
            var raw = localStorage.getItem(STORAGE_KEY_RESPOSTAS);
            if (raw) existingRespostas = JSON.parse(raw);
        } catch(e) {}

        var totalGenerated = 0;

        // Encontrar todos os alunos de 5º Ano e 9º Ano da rede
        var targetStudents = allStudents.filter(function(st) {
            var etapa = (st.etapa || st.serie || '').toUpperCase();
            var turma = (st.turma || '').toUpperCase();
            return etapa.includes('5') || etapa.includes('9') || turma.includes('5º') || turma.includes('9º') || turma.includes('5 ANO') || turma.includes('9 ANO');
        });

        // Agrupar por chave (eventoId_escolaId_turmaId)
        targetStudents.forEach(function(aluno, idx) {
            var escId = aluno.escolaId || aluno.escola_id || aluno.escola || 'esc_01';
            var turId = aluno.turmaId || aluno.turma_id || aluno.turma || 'turma_01';
            var key1 = eventoId + '_' + escId + '_' + turId;
            var key2 = eventoId + '_' + (aluno.escola || escId) + '_' + (aluno.turma || turId);

            var accuracyBase = 0.65;
            if (aluno.escola && aluno.escola.includes('CORREA LIMA')) accuracyBase = 0.72;
            else if (aluno.escola && aluno.escola.includes('GONCALVES DIAS')) accuracyBase = 0.75;
            else if (aluno.escola && aluno.escola.includes('BASILIO')) accuracyBase = 0.58;

            var isAusente = (idx % 22 === 0 && idx > 0);
            var individualAccuracy = Math.min(0.95, Math.max(0.25, accuracyBase + (Math.sin(idx * 2.3) * 0.28)));

            var studentRecord = {
                nome: aluno.nome,
                matricula: aluno.matricula || ('2026' + String(idx).padStart(4, '0')),
                escolaNome: aluno.escola || escId,
                turmaNome: aluno.turma || turId,
                statusPresenca: isAusente ? 'AUSENTE' : 'PRESENTE',
                respostas: isAusente ? Array.from({ length: 20 }).map(function() { return ''; }) : generateRealisticAnswers(GABARITO_5_ANO, individualAccuracy),
                corrigidoPor: 'SEMED — Central de Avaliação Municipal',
                corrigidoEm: new Date().toISOString()
            };

            [key1, key2].forEach(function(k) {
                if (!existingRespostas[k]) existingRespostas[k] = {};
                existingRespostas[k][aluno.id] = studentRecord;
            });

            totalGenerated++;
        });

        // Persistência dupla
        try {
            localStorage.setItem(STORAGE_KEY_RESPOSTAS, JSON.stringify(existingRespostas));
            localStorage.setItem(STORAGE_KEY_SIMULADO_DB, JSON.stringify(existingRespostas));
            if (typeof global.saveRespostasState === 'function') {
                global.saveRespostasState(existingRespostas);
            }
        } catch(e) {
            console.error('[Seed Simulado Error]', e);
        }

        console.log(`[Seed Simulado] Sucesso: ${totalGenerated} estudantes populados em todas as turmas de 5º e 9º anos pela SEMED.`);
        return { success: true, totalAlunos: totalGenerated };
    }

    function cleanSimuladoTestResponses(eventoId) {
        var targetEvento = eventoId || 'evt_2026_01';
        var raw = localStorage.getItem(STORAGE_KEY_RESPOSTAS);
        if (!raw) return { cleaned: 0 };

        try {
            var data = JSON.parse(raw);
            var cleanedCount = 0;
            var remaining = {};
            Object.keys(data).forEach(function(k) {
                if (k.startsWith(targetEvento + '_')) {
                    cleanedCount++;
                } else {
                    remaining[k] = data[k];
                }
            });

            localStorage.setItem(STORAGE_KEY_RESPOSTAS, JSON.stringify(remaining));
            localStorage.setItem(STORAGE_KEY_SIMULADO_DB, JSON.stringify(remaining));
            if (typeof global.saveRespostasState === 'function') {
                global.saveRespostasState(remaining);
            }
            console.log(`[Clean Simulado] ${cleanedCount} turmas/lotes de simulado removidos com sucesso.`);
            return { success: true, cleaned: cleanedCount };
        } catch(e) {
            console.error('[Clean Simulado Error]', e);
            return { success: false, error: e.message };
        }
    }

    // Exposição global
    global.seedSimuladoTestResponses = seedSimuladoTestResponses;
    global.cleanSimuladoTestResponses = cleanSimuladoTestResponses;

})(typeof window !== 'undefined' ? window : this);
