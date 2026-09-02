/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA DE HABILIDADES (STATE & DATA)
 * Arquivo: js/modules/cronograma/cronograma_state.js
 * Descrição: Estado global, pools de descritores SAEB/BNCC, persistência local
 *            e CÁLCULO CENTRALIZADO E ÚNICO de status e progresso de aulas.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    // Chaves de Armazenamento Local
    const SCHEDULE_STORAGE_KEY = 'teacher_schedule_lessons_db';
    const SCHEDULE_TRASH_STORAGE_KEY = 'teacher_schedule_trash_db';

    const MONTH_NAMES_PT = {
        2: 'Fevereiro',
        3: 'Março',
        4: 'Abril',
        5: 'Maio',
        6: 'Junho',
        7: 'Julho (Recesso Escolar)',
        8: 'Agosto',
        9: 'Setembro',
        10: 'Outubro',
        11: 'Novembro',
        12: 'Dezembro'
    };

    const MONTH_LABELS = {
        2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
        7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    };

    const ANNUAL_SKILLS_CALENDAR_DATA = {};

    const DESCRIPTORS_POOL_5ANO = [
        { code: 'D01 (LP)', title: 'Localizar informações explícitas no texto', comp: 'Língua Portuguesa', metod: 'Leitura compartilhada de notícias e localização de datas, nomes e locais.' },
        { code: 'D03 (LP)', title: 'Inferir o sentido de uma palavra ou expressão', comp: 'Língua Portuguesa', metod: 'Atividade de dedução de vocabulário poético a partir do contexto.' },
        { code: 'D04 (LP)', title: 'Inferir uma informação implícita em um texto', comp: 'Língua Portuguesa', metod: 'Interpretação de tirinhas e charges com pistas visuais e textuais.' },
        { code: 'D06 (LP)', title: 'Identificar o tema ou assunto principal de um texto', comp: 'Língua Portuguesa', metod: 'Resumo oral e identificação da ideia central em fábulas e contos.' },
        { code: 'D11 (LP)', title: 'Distinguir um fato da opinião relativa a esse fato', comp: 'Língua Portuguesa', metod: 'Análise comparativa entre notícias e comentários de leitores.' },
        { code: 'D14 (LP)', title: 'Identificar o efeito de sentido da pontuação', comp: 'Língua Portuguesa', metod: 'Dramatização de diálogos pontuados com exclamações e reticências.' },
        { code: 'D13 (MAT)', title: 'Resolver problemas com números naturais (adição/subtração)', comp: 'Matemática', metod: 'Resolução de situações-problema com dados do comércio local.' },
        { code: 'D14 (MAT)', title: 'Resolver problemas de multiplicação e divisão', comp: 'Matemática', metod: 'Problemas de divisão em partes iguais e proporcionalidade.' },
        { code: 'D19 (MAT)', title: 'Resolver problemas com números decimais e dinheiro', comp: 'Matemática', metod: 'Simulação de feira livre e cálculo de troco com notas e moedas.' },
        { code: 'D28 (MAT)', title: 'Ler informações e dados em tabelas e gráficos', comp: 'Matemática', metod: 'Construção de gráficos de colunas com dados de frequência da turma.' }
    ];

    const DESCRIPTORS_POOL_2ANO = [
        { code: 'D01 (LP)', title: 'Reconhecer letras do alfabeto', comp: 'Língua Portuguesa', metod: 'Jogo de bingo fonético e alfabeto ilustrado móvel.' },
        { code: 'D02 (LP)', title: 'Identificar rimas e aliterações', comp: 'Língua Portuguesa', metod: 'Roda de cantigas e parlendas com palmas para marcar as rimas.' },
        { code: 'D03 (LP)', title: 'Segmentar oralmente palavras em sílabas', comp: 'Língua Portuguesa', metod: 'Contagem de palmas para cada sílaba de palavras do cotidiano.' },
        { code: 'D06 (LP)', title: 'Localizar informação explícita em bilhetes', comp: 'Língua Portuguesa', metod: 'Leitura de bilhetes escolares com caça às palavras-chave.' },
        { code: 'D01 (MAT)', title: 'Contagem e comparação de quantidades até 100', comp: 'Matemática', metod: 'Agrupamentos com material dourado e tampinhas plásticas.' },
        { code: 'D02 (MAT)', title: 'Problemas de adição e subtração até 100', comp: 'Matemática', metod: 'Histórias matemáticas com apoio de desenhos e reta numérica.' }
    ];

    const DESCRIPTORS_POOL_9ANO = [
        { code: 'D01 (LP)', title: 'Localizar informações explícitas em artigos', comp: 'Língua Portuguesa', metod: 'Sublinhamento de teses e argumentos em editoriais de opinião.' },
        { code: 'D03 (LP)', title: 'Inferir o sentido de palavras em contexto', comp: 'Língua Portuguesa', metod: 'Análise de figuras de linguagem em poemas e músicas maranhenses.' },
        { code: 'D15 (LP)', title: 'Estabelecer relações lógico-discursivas', comp: 'Língua Portuguesa', metod: 'Identificação de conjunções de oposição, causa e conclusão.' },
        { code: 'D16 (MAT)', title: 'Localização de números inteiros na reta', comp: 'Matemática', metod: 'Termômetro matemático e movimentação sobre a reta numérica.' },
        { code: 'D19 (MAT)', title: 'Problemas envolvendo juros e porcentagem', comp: 'Matemática', metod: 'Cálculo de descontos e parcelamentos em compras comerciais.' },
        { code: 'D28 (MAT)', title: 'Cálculo de área e perímetro de figuras planas', comp: 'Matemática', metod: 'Medição prática do piso da sala e quadra da escola.' }
    ];

    const DEFAULT_SCHEDULE_LESSONS_V2 = [
        {
            id: 'plan_seed_1',
            escola_id: 'UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma_id: '2º Ano A',
            turma: '2º Ano A',
            turmaContext: 'UI JOSE CORREA LIMA — 2º Ano A',
            disciplina: 'Língua Portuguesa',
            descritor_codigo: 'D01',
            descritor_desc: 'Localizar informações explícitas em um texto.',
            habilidade_bncc_codigo: 'EF02LP01',
            habilidade_bncc_desc: 'Decodificação e Leitura de Palavras',
            habilidadeCode: 'D01 + EF02LP01',
            habilidadeDesc: 'Localizar informações explícitas e decodificação fluente de palavras.',
            data_planejada: '2026-08-17',
            date: '2026-08-17',
            time: '07:30 - 08:20',
            horarioTexto: '1ª Aula (07:30 - 08:20)',
            status: 'trabalhada',
            data_confirmacao: '2026-08-17T11:00:00.000Z',
            observacoes: 'Leitura coletiva de cantigas e caça-palavras em grupo.',
            methodology: 'Leitura coletiva de cantigas e caça-palavras em grupo.',
            criado_por: 'Profa. Silvana Ferreira (Regente)',
            criadoPor: 'Profa. Silvana Ferreira (Regente)',
            criado_em: '2026-08-10T08:00:00.000Z',
            createdAt: '2026-08-10T08:00:00.000Z',
            excluido_em: null,
            deletedAt: null
        },
        {
            id: 'plan_seed_2',
            escola_id: 'UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma_id: '2º Ano A',
            turma: '2º Ano A',
            turmaContext: 'UI JOSE CORREA LIMA — 2º Ano A',
            disciplina: 'Matemática',
            descritor_codigo: 'D13',
            descritor_desc: 'Reconhecer e utilizar características do sistema de numeração decimal.',
            habilidade_bncc_codigo: 'EF02MA01',
            habilidade_bncc_desc: 'Sistema de Numeração Decimal até centenas',
            habilidadeCode: 'D13 + EF02MA01',
            habilidadeDesc: 'Sistema de Numeração Decimal: valor posicional e agrupamentos de 10.',
            data_planejada: '2026-08-18',
            date: '2026-08-18',
            time: '08:20 - 09:10',
            horarioTexto: '2ª Aula (08:20 - 09:10)',
            status: 'trabalhada',
            data_confirmacao: '2026-08-18T10:30:00.000Z',
            observacoes: 'Uso de material dourado e ábaco aberto.',
            methodology: 'Uso de material dourado e ábaco aberto.',
            criado_por: 'Profa. Silvana Ferreira (Regente)',
            criadoPor: 'Profa. Silvana Ferreira (Regente)',
            criado_em: '2026-08-10T08:00:00.000Z',
            createdAt: '2026-08-10T08:00:00.000Z',
            excluido_em: null,
            deletedAt: null
        },
        {
            id: 'plan_seed_3',
            escola_id: 'UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma_id: '2º Ano A',
            turma: '2º Ano A',
            turmaContext: 'UI JOSE CORREA LIMA — 2º Ano A',
            disciplina: 'Língua Portuguesa',
            descritor_codigo: 'D03',
            descritor_desc: 'Inferir o sentido de uma palavra ou expressão.',
            habilidade_bncc_codigo: 'EF02LP04',
            habilidade_bncc_desc: 'Segmentação de Palavras e Sílabas',
            habilidadeCode: 'D03 + EF02LP04',
            habilidadeDesc: 'Inferência de vocabulário e segmentação silábica em fábulas.',
            data_planejada: '2026-08-19',
            date: '2026-08-19',
            time: '07:30 - 08:20',
            horarioTexto: '1ª Aula (07:30 - 08:20)',
            status: 'planejada',
            data_confirmacao: null,
            observacoes: 'Roda de conversa sobre a fábula A Cigarra e a Formiga.',
            methodology: 'Roda de conversa sobre a fábula A Cigarra e a Formiga.',
            criado_por: 'Profa. Silvana Ferreira (Regente)',
            criadoPor: 'Profa. Silvana Ferreira (Regente)',
            criado_em: '2026-08-15T08:00:00.000Z',
            createdAt: '2026-08-15T08:00:00.000Z',
            excluido_em: null,
            deletedAt: null
        },
        {
            id: 'plan_seed_4',
            escola_id: 'UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma_id: '2º Ano A',
            turma: '2º Ano A',
            turmaContext: 'UI JOSE CORREA LIMA — 2º Ano A',
            disciplina: 'Matemática',
            descritor_codigo: 'D19',
            descritor_desc: 'Resolver problemas com números naturais envolvendo adição ou subtração.',
            habilidade_bncc_codigo: 'EF02MA06',
            habilidade_bncc_desc: 'Problemas de Adição e Subtração',
            habilidadeCode: 'D19 + EF02MA06',
            habilidadeDesc: 'Resolução de situações-problema do cotidiano com adição e subtração.',
            data_planejada: '2026-08-20',
            date: '2026-08-20',
            time: '09:25 - 10:15',
            horarioTexto: '3ª Aula (09:25 - 10:15)',
            status: 'planejada',
            data_confirmacao: null,
            observacoes: 'Simulação de mercadinho com dinheirinho de papel.',
            methodology: 'Simulação de mercadinho com dinheirinho de papel.',
            criado_por: 'Profa. Silvana Ferreira (Regente)',
            criadoPor: 'Profa. Silvana Ferreira (Regente)',
            criado_em: '2026-08-15T08:00:00.000Z',
            createdAt: '2026-08-15T08:00:00.000Z',
            excluido_em: null,
            deletedAt: null
        },
        {
            id: 'plan_seed_5',
            escola_id: 'UI JOSE CORREA LIMA',
            escola: 'UI JOSE CORREA LIMA',
            turma_id: '5º Ano A',
            turma: '5º Ano A',
            turmaContext: 'UI JOSE CORREA LIMA — 5º Ano A',
            disciplina: 'Língua Portuguesa',
            descritor_codigo: 'D14',
            descritor_desc: 'Distinguir um fato da opinião relativa a esse fato.',
            habilidade_bncc_codigo: 'EF05LP03',
            habilidade_bncc_desc: 'Diferenciar fatos de opiniões em notícias',
            habilidadeCode: 'D14 + EF05LP03',
            habilidadeDesc: 'Distinção entre fato e opinião em matérias jornalísticas.',
            data_planejada: '2026-08-19',
            date: '2026-08-19',
            time: '07:30 - 08:20',
            horarioTexto: '1ª Aula (07:30 - 08:20)',
            status: 'planejada',
            data_confirmacao: null,
            observacoes: 'Análise comparativa de manchetes de jornais.',
            methodology: 'Análise comparativa de manchetes de jornais.',
            criado_por: 'Coordenação Pedagógica SEMED',
            criadoPor: 'Coordenação Pedagógica SEMED',
            criado_em: '2026-08-15T08:00:00.000Z',
            createdAt: '2026-08-15T08:00:00.000Z',
            excluido_em: null,
            deletedAt: null
        }
    ];

    // =========================================================================
    // FONTE ÚNICA DA VERDADE: CÁLCULO DE STATUS & PROGRESSO PEDAGÓGICO
    // =========================================================================

    /**
     * Retorna a data de referência hoje no formato ISO YYYY-MM-DD
     */
    function getScheduleReferenceToday() {
        if (window.currentScheduleReferenceDate) {
            return window.currentScheduleReferenceDate;
        }
        return new Date().toISOString().split('T')[0];
    }

    /**
     * Determina o status computado determinístico de uma aula
     * @param {Object} lesson 
     * @param {string} [referenceDate] 
     * @returns {'trabalhada' | 'planejada' | 'atrasada'}
     */
    function getLessonComputedStatus(lesson, referenceDate) {
        if (!lesson) return 'planejada';
        if (lesson.status === 'trabalhada') return 'trabalhada';

        const refDate = referenceDate || getScheduleReferenceToday();
        const lessonDate = lesson.date || lesson.data_planejada || '';

        if (lessonDate && lessonDate < refDate) {
            return 'atrasada';
        }
        return 'planejada';
    }

    /**
     * Calcula o progresso pedagógico consolidado sobre um conjunto de aulas
     * @param {Array<Object>} lessons 
     * @param {string} [referenceDate] 
     * @returns {Object}
     */
    function calculateScheduleProgress(lessons, referenceDate) {
        const list = Array.isArray(lessons) ? lessons : [];
        const refDate = referenceDate || getScheduleReferenceToday();

        const total = list.length;
        let trabalhadas = 0;
        let atrasadas = 0;
        let planejadas = 0;

        const bySubject = {};
        const lacunas = [];

        list.forEach(les => {
            const st = getLessonComputedStatus(les, refDate);
            if (st === 'trabalhada') trabalhadas++;
            else if (st === 'atrasada') atrasadas++;
            else planejadas++;

            const disc = les.disciplina || 'Geral';
            if (!bySubject[disc]) {
                bySubject[disc] = { total: 0, trabalhadas: 0, atrasadas: 0, planejadas: 0, pct: 0, lacunas: [] };
            }
            bySubject[disc].total++;
            if (st === 'trabalhada') {
                bySubject[disc].trabalhadas++;
            } else {
                if (st === 'atrasada') bySubject[disc].atrasadas++;
                else bySubject[disc].planejadas++;
                if (les.habilidadeCode) {
                    bySubject[disc].lacunas.push(les.habilidadeCode);
                    lacunas.push(les.habilidadeCode);
                }
            }
        });

        const pct = total > 0 ? Math.round((trabalhadas / total) * 100) : 0;

        Object.keys(bySubject).forEach(d => {
            const sub = bySubject[d];
            sub.pct = sub.total > 0 ? Math.round((sub.trabalhadas / sub.total) * 100) : 0;
        });

        return {
            total,
            trabalhadas,
            atrasadas,
            planejadas,
            pct,
            bySubject,
            lacunas
        };
    }

    // =========================================================================
    // PERSISTÊNCIA & STORAGE LOCAL
    // =========================================================================

    function getScheduleLessonsDb() {
        try {
            const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error('[Cronograma] Erro ao ler lições do localStorage:', e);
        }
        return DEFAULT_SCHEDULE_LESSONS_V2;
    }

    function saveScheduleLessonsDb(lessons) {
        try {
            localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(lessons));
        } catch (e) {
            console.error('[Cronograma] Erro ao salvar lições no localStorage:', e);
        }
    }

    function getScheduleTrashDb() {
        try {
            const raw = localStorage.getItem(SCHEDULE_TRASH_STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error('[Cronograma] Erro ao ler lixeira:', e);
        }
        return [];
    }

    function saveScheduleTrashDb(trash) {
        try {
            localStorage.setItem(SCHEDULE_TRASH_STORAGE_KEY, JSON.stringify(trash));
        } catch (e) {
            console.error('[Cronograma] Erro ao salvar lixeira:', e);
        }
        updateTrashBadgeCount();
    }

    function cleanupExpiredTrash(maxDays = 30) {
        try {
            const trash = getScheduleTrashDb();
            const now = Date.now();
            const maxMs = maxDays * 24 * 60 * 60 * 1000;
            const valid = trash.filter(item => {
                if (!item.deletedAt) return true;
                const itemTime = new Date(item.deletedAt).getTime();
                return (now - itemTime) < maxMs;
            });
            if (valid.length !== trash.length) {
                saveScheduleTrashDb(valid);
            }
        } catch(e) {}
    }

    function updateTrashBadgeCount() {
        const trash = getScheduleTrashDb();
        const badge = document.getElementById('trash-count-badge');
        if (badge) {
            badge.textContent = `Lixeira (${trash.length})`;
        }
    }

    // Exposição Global
    window.CronogramaState = {
        SCHEDULE_STORAGE_KEY,
        SCHEDULE_TRASH_STORAGE_KEY,
        MONTH_NAMES_PT,
        MONTH_LABELS,
        ANNUAL_SKILLS_CALENDAR_DATA,
        DESCRIPTORS_POOL_5ANO,
        DESCRIPTORS_POOL_2ANO,
        DESCRIPTORS_POOL_9ANO,
        DEFAULT_SCHEDULE_LESSONS_V2
    };

    window.getScheduleReferenceToday = getScheduleReferenceToday;
    window.getLessonComputedStatus = getLessonComputedStatus;
    window.calculateScheduleProgress = calculateScheduleProgress;
    window.getScheduleLessonsDb = getScheduleLessonsDb;
    window.saveScheduleLessonsDb = saveScheduleLessonsDb;
    window.getScheduleTrashDb = getScheduleTrashDb;
    window.saveScheduleTrashDb = saveScheduleTrashDb;
    window.cleanupExpiredTrash = cleanupExpiredTrash;
    window.updateTrashBadgeCount = updateTrashBadgeCount;

})(window, document);
