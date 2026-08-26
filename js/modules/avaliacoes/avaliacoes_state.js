/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO DE AVALIAÇÕES DIAGNÓSTICAS & SIMULADOS (SAEB / BNCC)
 * Arquivo: js/modules/avaliacoes/avaliacoes_state.js
 * Descrição: Estado centralizado de Eventos, Gabaritos, Matrizes de Habilidades
 *            e Motor de Correção Estatística das 4 Faixas de Proficiência.
 * ============================================================================
 */

(function(global) {
    'use strict';

    var STORAGE_KEY_EVENTOS = 'gd_eventos_simulados_data';
    var STORAGE_KEY_RESPOSTAS = 'gd_respostas_simulados_data';

    // -------------------------------------------------------------------------
    // 1. BANCO CANÔNICO DE HABILIDADES SAEB (LÍNGUA PORTUGUESA & MATEMÁTICA)
    // -------------------------------------------------------------------------

    var MATRIZ_HABILIDADES_SAEB = {
        portugues: [
            { codigo: 'LP01', nome: 'Localizar informação explícita', foco: 'Identificar dados diretos no texto' },
            { codigo: 'LP02', nome: 'Inferir informação implícita', foco: 'Deduzir sentidos e subentendidos' },
            { codigo: 'LP03', nome: 'Identificar tema do texto', foco: 'Reconhecer o assunto central' },
            { codigo: 'LP04', nome: 'Identificar ideia central', foco: 'Compreender a tese / foco principal' },
            { codigo: 'LP05', nome: 'Reconhecer finalidade do texto', foco: 'Objetivo comunicativo do autor' },
            { codigo: 'LP06', nome: 'Estabelecer relação entre partes', foco: 'Conexão lógica e coesão textual' },
            { codigo: 'LP07', nome: 'Identificar informação relevante', foco: 'Selecionar dados críticos' },
            { codigo: 'LP08', nome: 'Reconhecer gênero textual', foco: 'Identificar estrutura e tipo de texto' },
            { codigo: 'LP12', nome: 'Interpretar linguagem não verbal', foco: 'Leitura de imagens, charges e símbolos' },
            { codigo: 'LP17', nome: 'Inferir sentido de palavras', foco: 'Vocabulário a partir do contexto' },
            { codigo: 'LP21', nome: 'Diferenciar fato e opinião', foco: 'Informação objetiva versus julgamento' },
            { codigo: 'LP23', nome: 'Interpretar gráficos e tabelas', foco: 'Leitura e integração de dados visuais' },
            { codigo: 'LP31', nome: 'Elementos da narrativa', foco: 'Personagem, tempo, espaço e narrador' }
        ],
        matematica: [
            { codigo: 'MT01', nome: 'Sistema de numeração decimal', foco: 'Valor posicional e ordem dos números' },
            { codigo: 'MT02', nome: 'Operações fundamentais', foco: 'Adição, subtração, multiplicação e divisão' },
            { codigo: 'MT03', nome: 'Resolução de problemas', foco: 'Situações-problema do cotidiano' },
            { codigo: 'MT05', nome: 'Frações', foco: 'Representação e comparação fracionária' },
            { codigo: 'MT06', nome: 'Números decimais', foco: 'Leitura, escrita e operações com decimais' },
            { codigo: 'MT07', nome: 'Porcentagem', foco: 'Cálculo percentual e acréscimos/descontos' },
            { codigo: 'MT13', nome: 'Proporcionalidade', foco: 'Razão, proporção e regra de três' },
            { codigo: 'MT15', nome: 'Figuras planas', foco: 'Triângulos, quadriláteros e polígonos' },
            { codigo: 'MT16', nome: 'Perímetro e área', foco: 'Medidas de superfícies e contornos' },
            { codigo: 'MT22', nome: 'Medidas de comprimento', foco: 'Metro, centímetros e conversões' },
            { codigo: 'MT24', nome: 'Medidas de tempo', foco: 'Horas, minutos, dias e calendários' },
            { codigo: 'MT27', nome: 'Sistema monetário', foco: 'Cálculos financeiros e troco' },
            { codigo: 'MT28', nome: 'Leitura de tabelas e gráficos', foco: 'Extração e interpretação estatística' }
        ]
    };

    // -------------------------------------------------------------------------
    // 2. SEED INICIAL DE EVENTOS AVALIATIVOS
    // -------------------------------------------------------------------------

    function getInitialEventosSeed() {
        return [
            {
                id: 'evt_2026_01',
                titulo: '1º Simulado Municipal SAEB 2026 — 5º e 9º Anos',
                dataRealizacao: '2026-09-15',
                disciplina: 'ambas',
                portuguesInicio: 1,
                portuguesFim: 10,
                matematicaInicio: 11,
                matematicaFim: 20,
                status: 'ABERTO',
                passoAtivo: 4,
                qtdQuestoes: 20,
                etapasAlvo: ['5º Ano', '9º Ano'],
                gabaritoGeralJson: JSON.stringify([
                    {
                        etapaNome: '5º Ano',
                        qtdQuestoes: 20,
                        gabarito: ['A','B','C','D','A','C','B','D','A','B','C','D','A','B','C','D','A','B','C','D'],
                        habilidades: ['LP01','LP02','LP03','LP05','LP07','LP12','LP17','LP21','LP23','LP31','MT01','MT02','MT03','MT05','MT06','MT15','MT16','MT22','MT27','MT28']
                    },
                    {
                        etapaNome: '9º Ano',
                        qtdQuestoes: 20,
                        gabarito: ['B','C','A','D','B','A','D','C','B','D','A','B','C','D','B','C','A','D','B','C'],
                        habilidades: ['LP01','LP02','LP04','LP06','LP08','LP12','LP17','LP21','LP23','LP31','MT01','MT02','MT03','MT07','MT13','MT15','MT16','MT22','MT24','MT28']
                    }
                ]),
                turmas: [],
                criadoEm: '2026-08-20T08:00:00.000Z'
            },
            {
                id: 'evt_2026_02',
                titulo: 'Avaliação Diagnóstica de Fluência Leitora & Recomposição 2026',
                dataRealizacao: '2026-10-10',
                disciplina: 'portugues',
                portuguesInicio: 1,
                portuguesFim: 15,
                matematicaInicio: 0,
                matematicaFim: 0,
                status: 'RASCUNHO',
                passoAtivo: 2,
                qtdQuestoes: 15,
                etapasAlvo: ['2º Ano', '5º Ano'],
                gabaritoGeralJson: JSON.stringify([
                    {
                        etapaNome: '2º Ano',
                        qtdQuestoes: 15,
                        gabarito: ['A','B','A','C','D','B','A','C','D','A','B','C','A','D','B'],
                        habilidades: ['LP01','LP02','LP03','LP04','LP05','LP06','LP07','LP08','LP12','LP17','LP21','LP23','LP31','LP01','LP02']
                    }
                ]),
                turmas: [],
                criadoEm: '2026-08-22T09:30:00.000Z'
            }
        ];
    }

    // -------------------------------------------------------------------------
    // 3. GETTERS & SETTERS DE ESTADO (LOCALSTORAGE + FALLBACK)
    // -------------------------------------------------------------------------

    function getEventosState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_EVENTOS);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch(e) {}

        var seed = getInitialEventosSeed();
        saveEventosState(seed);
        return seed;
    }

    function saveEventosState(eventos) {
        try {
            var toSave = eventos || getEventosState();
            localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(toSave));
        } catch(e) {}
    }

    function getRespostasState() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_RESPOSTAS);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') return parsed;
            }
        } catch(e) {}
        return {};
    }

    function saveRespostasState(respostas) {
        try {
            var toSave = respostas || getRespostasState();
            localStorage.setItem(STORAGE_KEY_RESPOSTAS, JSON.stringify(toSave));
        } catch(e) {}
    }

    // -------------------------------------------------------------------------
    // 4. MOTOR ESTATÍSTICO DE CORREÇÃO & 4 FAIXAS DE PROFICIÊNCIA
    // -------------------------------------------------------------------------

    /**
     * Processa a correção por aluno conforme item 5.1 e 5.2 da especificação
     * @param {Object} input { respostas: string[], gabarito: string[], statusPresenca: string }
     * @returns {Object} { acertos, percentual, situacao, acertosPorQuestao, corClass, corBadge }
     */
    function processarCorrecaoAluno(input) {
        var statusPresenca = (input && input.statusPresenca) ? input.statusPresenca.toUpperCase() : 'PRESENTE';
        
        if (statusPresenca !== 'PRESENTE') {
            return {
                acertos: 0,
                percentual: 0.0,
                situacao: statusPresenca,
                acertosPorQuestao: [],
                corClass: 'text-muted',
                corBadge: 'badge-neutral',
                emoji: '⚪'
            };
        }

        var gabarito = (input && Array.isArray(input.gabarito)) ? input.gabarito : [];
        var respostas = (input && Array.isArray(input.respostas)) ? input.respostas : [];
        var total = gabarito.length;

        if (total === 0) {
            return {
                acertos: 0,
                percentual: 0.0,
                situacao: 'SEM GABARITO',
                acertosPorQuestao: [],
                corClass: 'text-muted',
                corBadge: 'badge-neutral',
                emoji: '⚪'
            };
        }

        var acertos = 0;
        var acertosPorQuestao = [];

        for (var i = 0; i < total; i++) {
            var r = (respostas[i] || '').toString().trim().toUpperCase();
            var g = (gabarito[i] || '').toString().trim().toUpperCase();
            var acertou = Boolean(r && g && r === g);
            if (acertou) acertos++;
            acertosPorQuestao.push(acertou);
        }

        var percentual = total > 0 ? Number(((acertos / total) * 100).toFixed(1)) : 0.0;

        var situacao = 'ABAIXO DO BÁSICO';
        var corClass = '#ef4444';
        var corBadge = 'badge-danger';
        var emoji = '🔴';

        if (percentual >= 80.0) {
            situacao = 'AVANÇADO';
            corClass = '#3b82f6';
            corBadge = 'badge-info';
            emoji = '🔵';
        } else if (percentual >= 60.0) {
            situacao = 'ADEQUADO';
            corClass = '#10b981';
            corBadge = 'badge-success';
            emoji = '🟢';
        } else if (percentual >= 40.0) {
            situacao = 'BÁSICO';
            corClass = '#f59e0b';
            corBadge = 'badge-warning';
            emoji = '🟡';
        }

        return {
            acertos: acertos,
            totalQuestoes: total,
            percentual: percentual,
            situacao: situacao,
            acertosPorQuestao: acertosPorQuestao,
            corClass: corClass,
            corBadge: corBadge,
            emoji: emoji
        };
    }

    // Exposição Global
    global.MATRIZ_HABILIDADES_SAEB = MATRIZ_HABILIDADES_SAEB;
    global.getEventosState = getEventosState;
    global.saveEventosState = saveEventosState;
    global.getRespostasState = getRespostasState;
    global.saveRespostasState = saveRespostasState;
    global.processarCorrecaoAluno = processarCorrecaoAluno;

})(typeof window !== 'undefined' ? window : this);
