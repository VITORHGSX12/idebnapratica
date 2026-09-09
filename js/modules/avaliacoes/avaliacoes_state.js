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
    var STORAGE_KEY_DELETED_EVENTOS = 'gd_eventos_simulados_deleted_ids';

    function getDeletedEventosIds() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY_DELETED_EVENTOS);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch(e) {}
        return [];
    }

    function addDeletedEventoId(eventoId) {
        if (!eventoId) return;
        var list = getDeletedEventosIds();
        if (!list.includes(eventoId)) {
            list.push(eventoId);
            try {
                localStorage.setItem(STORAGE_KEY_DELETED_EVENTOS, JSON.stringify(list));
            } catch(e) {}
        }
    }

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
        return [];
    }

    // -------------------------------------------------------------------------
    // 3. GETTERS & SETTERS DE ESTADO (LOCALSTORAGE + FALLBACK)
    // -------------------------------------------------------------------------

    function getEventosState() {
        var deletedIds = getDeletedEventosIds();
        try {
            var raw = localStorage.getItem(STORAGE_KEY_EVENTOS);
            if (raw !== null) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    // Remove automaticamente simulados de teste antigos
                    var filtered = parsed.filter(function(e) { 
                        return e && e.id && e.id !== 'evt_2026_01' && e.id !== 'evt_2026_02' && !deletedIds.includes(e.id); 
                    });
                    if (filtered.length !== parsed.length) {
                        saveEventosState(filtered);
                    }
                    return filtered;
                }
            }
        } catch(e) {}

        var seed = getInitialEventosSeed().filter(function(e) { return e && e.id && !deletedIds.includes(e.id); });
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
                if (parsed && typeof parsed === 'object') {
                    var cleaned = {};
                    var hadTest = false;
                    Object.keys(parsed).forEach(function(k) {
                        if (k.startsWith('evt_2026_01') || k.startsWith('evt_2026_02')) {
                            hadTest = true;
                        } else {
                            cleaned[k] = parsed[k];
                        }
                    });
                    if (hadTest) {
                        saveRespostasState(cleaned);
                    }
                    return cleaned;
                }
            }
        } catch(e) {}
        return {};
    }

    function saveRespostasState(respostas) {
        try {
            var toSave = respostas || getRespostasState();
            localStorage.setItem(STORAGE_KEY_RESPOSTAS, JSON.stringify(toSave));
            localStorage.removeItem('gd_simulado_respostas_db');
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
        var emoji = '';

        if (percentual >= 80.0) {
            situacao = 'AVANÇADO';
            corClass = '#3b82f6';
            corBadge = 'badge-info';
            emoji = '';
        } else if (percentual >= 60.0) {
            situacao = 'ADEQUADO';
            corClass = '#10b981';
            corBadge = 'badge-success';
            emoji = '';
        } else if (percentual >= 40.0) {
            situacao = 'BÁSICO';
            corClass = '#f59e0b';
            corBadge = 'badge-warning';
            emoji = '';
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

    // -------------------------------------------------------------------------
    // 5. GESTÃO GERENCIAL DE AVALIAÇÕES: PROGRESSO, STATUS E EXCLUSÃO EM CASCATA
    // -------------------------------------------------------------------------

    /**
     * Calcula com precisão o progresso de digitação de respostas de uma avaliação
     * @param {string} eventoId ID do evento avaliativo
     * @returns {Object} Estatísticas de preenchimento, status gerencial e percentual
     */
    function calcularProgressoEvento(eventoId) {
        var eventos = getEventosState();
        var ev = eventos.find(function(e) { return e.id === eventoId; });
        if (!ev) {
            return {
                eventoId: eventoId,
                statusEvento: 'INEXISTENTE',
                alunosPreenchidos: 0,
                alunosEsperados: 0,
                percentual: 0,
                isConcluido: false,
                isEmAndamento: false,
                isAtivo: false,
                isRascunho: false,
                statusGerencial: 'INEXISTENTE'
            };
        }

        var statusEvento = (ev.status || 'ABERTO').toUpperCase();
        var respostasDb = getRespostasState();
        var prefix = eventoId + '_';

        var totalPreenchidos = 0;
        var totalAusentes = 0;
        var chavesEvento = Object.keys(respostasDb).filter(function(k) {
            return k === eventoId || k.indexOf(prefix) === 0;
        });

        chavesEvento.forEach(function(k) {
            var turmaData = respostasDb[k];
            if (turmaData && typeof turmaData === 'object') {
                Object.keys(turmaData).forEach(function(alunoId) {
                    var rec = turmaData[alunoId];
                    if (!rec) return;
                    if (rec.statusPresenca === 'AUSENTE') {
                        totalAusentes++;
                        totalPreenchidos++;
                    } else if (Array.isArray(rec.respostas)) {
                        var temRespostas = rec.respostas.some(function(r) { return r && r.toString().trim() !== ''; });
                        if (temRespostas) {
                            totalPreenchidos++;
                        }
                    }
                });
            }
        });

        // Determinação de alunos esperados
        var totalEsperados = 0;
        if (Array.isArray(ev.turmas) && ev.turmas.length > 0) {
            ev.turmas.forEach(function(t) {
                totalEsperados += (parseInt(t.totalAlunos) || parseInt(t.qtdAlunos) || 25);
            });
        }

        // Se não tiver turmas explícitas, verifica base de alunos oficial cadastrada
        if (totalEsperados === 0) {
            var allStudents = typeof global.getOfficialStudentsState === 'function' ? global.getOfficialStudentsState() : (global.dbAlunos || []);
            if (Array.isArray(allStudents) && allStudents.length > 0) {
                var etapas = Array.isArray(ev.etapasAlvo) ? ev.etapasAlvo : [ev.etapasAlvo || '5º Ano'];
                var filteredSt = allStudents.filter(function(st) {
                    return etapas.some(function(et) {
                        return st.serie && (st.serie.includes(et) || et.includes(st.serie));
                    });
                });
                totalEsperados = filteredSt.length;
            }
        }

        // Fallback inteligente para garantir percentual consistente
        if (totalEsperados === 0) {
            totalEsperados = totalPreenchidos > 0 ? totalPreenchidos : 30;
        }

        if (totalPreenchidos > totalEsperados) {
            totalEsperados = totalPreenchidos;
        }

        var percentual = totalEsperados > 0 ? Math.min(100, Number(((totalPreenchidos / totalEsperados) * 100).toFixed(1))) : 0;

        var isRascunho = (statusEvento === 'RASCUNHO');
        var isConcluido = (statusEvento === 'ENCERRADO') || (percentual >= 100 && totalPreenchidos > 0);
        var isEmAndamento = (!isRascunho && !isConcluido && totalPreenchidos > 0);
        var isAtivo = (statusEvento === 'ABERTO' && totalPreenchidos === 0);

        var statusGerencial = 'ATIVO';
        if (isRascunho) statusGerencial = 'RASCUNHO';
        else if (isConcluido) statusGerencial = 'CONCLUIDO';
        else if (isEmAndamento) statusGerencial = 'EM_ANDAMENTO';

        return {
            eventoId: eventoId,
            statusEvento: statusEvento,
            alunosPreenchidos: totalPreenchidos,
            alunosAusentes: totalAusentes,
            alunosEsperados: totalEsperados,
            percentual: percentual,
            isConcluido: isConcluido,
            isEmAndamento: isEmAndamento,
            isAtivo: isAtivo,
            isRascunho: isRascunho,
            statusGerencial: statusGerencial
        };
    }

    /**
     * Remove um evento e purga permanentemente todas as suas respostas do armazenamento
     * @param {string} eventoId 
     * @returns {Object} Resultado da exclusão
     */
    function excluirEventoComRespostas(eventoId) {
        if (!eventoId) return { success: false };
        addDeletedEventoId(eventoId);

        var eventos = getEventosState();
        var novoEventos = eventos.filter(function(e) { return e && e.id !== eventoId; });
        saveEventosState(novoEventos);

        var respostasDb = getRespostasState();
        var prefix = eventoId + '_';
        var chavesRemover = Object.keys(respostasDb).filter(function(k) {
            return k === eventoId || k.indexOf(prefix) === 0;
        });

        chavesRemover.forEach(function(k) {
            delete respostasDb[k];
        });
        saveRespostasState(respostasDb);

        return {
            success: true,
            eventoId: eventoId,
            chavesRespostasRemovidas: chavesRemover.length
        };
    }

    /**
     * Obtém o resumo numérico consolidado para os cards de filtro do Gerenciador
     * @returns {Object} { total, ativas, emAndamento, concluidas, rascunhos }
     */
    function obterResumoGerencialAvaliacoes() {
        var eventos = getEventosState();
        var total = eventos.length;
        var ativas = 0;
        var emAndamento = 0;
        var concluidas = 0;
        var rascunhos = 0;

        eventos.forEach(function(ev) {
            var prog = calcularProgressoEvento(ev.id);
            if (prog.isRascunho) rascunhos++;
            else if (prog.isConcluido) concluidas++;
            else if (prog.isEmAndamento) emAndamento++;
            else ativas++;
        });

        return {
            total: total,
            ativas: ativas,
            emAndamento: emAndamento,
            concluidas: concluidas,
            rascunhos: rascunhos
        };
    }

    // Exposição Global
    global.MATRIZ_HABILIDADES_SAEB = MATRIZ_HABILIDADES_SAEB;
    global.getEventosState = getEventosState;
    global.saveEventosState = saveEventosState;
    global.getRespostasState = getRespostasState;
    global.saveRespostasState = saveRespostasState;
    global.getDeletedEventosIds = getDeletedEventosIds;
    global.addDeletedEventoId = addDeletedEventoId;
    global.processarCorrecaoAluno = processarCorrecaoAluno;
    global.calcularProgressoEvento = calcularProgressoEvento;
    global.excluirEventoComRespostas = excluirEventoComRespostas;
    global.obterResumoGerencialAvaliacoes = obterResumoGerencialAvaliacoes;

})(typeof window !== 'undefined' ? window : this);
