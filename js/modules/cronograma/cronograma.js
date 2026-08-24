/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA DE HABILIDADES
 * Arquivo: js/modules/cronograma/cronograma.js
 * Descrição: Gerenciamento completo do Cronograma e Planejador de Habilidades:
 *            - Visão Mensal com drag & drop e expansor
 *            - Visão Semanal Timetable
 *            - Visão Comparativa entre Turmas
 *            - Calendário 7 Colunas e Calendário Anual
 *            - Cronograma Geral de 40 Semanas (Meta IDEB)
 *            - Autocomplete Dual (Descritores SAEB/SEAMA + Habilidades BNCC)
 *            - Detecção de repetição pedagógica em 30 dias
 *            - Recorrência semanal e Lixeira temporária com restauração
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    // Chaves de Armazenamento Local
    const SCHEDULE_STORAGE_KEY = 'teacher_schedule_lessons_db';
    const SCHEDULE_TRASH_STORAGE_KEY = 'teacher_schedule_trash_db';

    // Estado Global do Cronograma
    let currentTurmaContext = 'UI JOSE CORREA LIMA — 2º Ano A';
    let currentScheduleMainView = 'monthly'; // 'monthly' | 'weekly' | 'comparison'
    let currentCalendarMonth = 2; // Fevereiro
    let calMonth = 8; // Agosto / 2026 default
    let calYear = 2026;
    let selectedCalDay = 15;
    let activeCalendarDayItem = null;
    let activeExpandedDate = '2026-08-18';
    let plannerSelectedItems = []; // Array de { type: 'SAEB'|'BNCC', code, desc, disciplina }
    let plannerEditingPlanId = null;
    let skillsScheduleList = [];

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

    function updateTrashBadgeCount() {
        const trash = getScheduleTrashDb();
        const badge = document.getElementById('trash-count-badge');
        if (badge) {
            badge.textContent = `Lixeira (${trash.length})`;
        }
    }

    // =========================================================================
    // CONTEXTO DE TURMA E TROCA DE VISÃO PRINCIPAL
    // =========================================================================

    function handleTurmaContextChange() {
        const select = document.getElementById('cal-filter-turma-context');
        if (select) {
            currentTurmaContext = select.value;
        }

        const contextLabel = document.getElementById('schedule-active-context-label');
        if (contextLabel) contextLabel.textContent = currentTurmaContext;

        const teacherLabel = document.getElementById('schedule-active-teacher-label');
        if (teacherLabel) {
            if (currentTurmaContext.includes('2º Ano A')) {
                teacherLabel.textContent = '• Responsável: Profa. Silvana Ferreira (Regente)';
            } else if (currentTurmaContext.includes('2º Ano B')) {
                teacherLabel.textContent = '• Responsável: Prof. Marcos Andrade (Regente)';
            } else {
                teacherLabel.textContent = '• Responsável: Coordenação Pedagógica / Regente';
            }
        }

        renderActiveScheduleView();
    }

    function switchScheduleMainView(view) {
        currentScheduleMainView = view;

        const btnMonthly = document.getElementById('btn-view-monthly');
        const btnWeekly = document.getElementById('btn-view-weekly');
        const btnComp = document.getElementById('btn-view-comparison');

        const viewMonthly = document.getElementById('schedule-view-monthly');
        const viewWeekly = document.getElementById('schedule-view-weekly');
        const viewComp = document.getElementById('schedule-view-comparison');

        [btnMonthly, btnWeekly, btnComp].forEach(btn => {
            if (!btn) return;
            btn.classList.remove('active');
            btn.style.background = 'transparent';
            btn.style.color = 'var(--text-secondary)';
            btn.style.fontWeight = '600';
        });

        const activeBtn = view === 'monthly' ? btnMonthly : (view === 'weekly' ? btnWeekly : btnComp);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.style.background = '#6366f1';
            activeBtn.style.color = '#ffffff';
            activeBtn.style.fontWeight = '700';
        }

        if (viewMonthly) viewMonthly.style.display = view === 'monthly' ? 'block' : 'none';
        if (viewWeekly) viewWeekly.style.display = view === 'weekly' ? 'block' : 'none';
        if (viewComp) viewComp.style.display = view === 'comparison' ? 'block' : 'none';

        renderActiveScheduleView();
    }

    function renderActiveScheduleView() {
        if (currentScheduleMainView === 'monthly') {
            renderScheduleMonthlyCalendar();
        } else if (currentScheduleMainView === 'weekly') {
            renderScheduleWeeklyTimetable();
        } else if (currentScheduleMainView === 'comparison') {
            renderScheduleComparisonView();
        }
        updateTrashBadgeCount();
    }

    // =========================================================================
    // MODAL DE NOVO PLANEJAMENTO (SEMED ↔ DOCENTES)
    // =========================================================================

    function openNewSchedulePlanModal(defaultDate, defaultSlot, existingPlanId) {
        const modal = document.getElementById('modal-create-schedule-planner');
        if (!modal) return;

        plannerEditingPlanId = existingPlanId || null;
        plannerSelectedItems = [];

        const titleEl = document.getElementById('planner-modal-title');
        const planIdInput = document.getElementById('planner-modal-plan-id');
        const turmaSelect = document.getElementById('planner-modal-turma');
        const subjectSelect = document.getElementById('planner-modal-subject');
        const dateInput = document.getElementById('planner-modal-date');
        const slotSelect = document.getElementById('planner-modal-slot');
        const obsInput = document.getElementById('planner-modal-obs');
        const statusSelect = document.getElementById('planner-modal-status');
        const searchInput = document.getElementById('planner-skill-search-input');
        const searchResults = document.getElementById('planner-skill-search-results');
        const warningBox = document.getElementById('planner-repetition-warning');
        const recToggle = document.getElementById('planner-modal-recurrence-toggle');
        const recContainer = document.getElementById('planner-modal-recurrence-container');

        if (warningBox) warningBox.style.display = 'none';
        if (searchResults) searchResults.style.display = 'none';
        if (searchInput) searchInput.value = '';
        if (recToggle) recToggle.checked = false;
        if (recContainer) recContainer.style.display = 'none';

        if (turmaSelect) {
            turmaSelect.value = currentTurmaContext || 'UI JOSE CORREA LIMA — 2º Ano A';
        }

        const activeSubjectFilter = document.getElementById('cal-filter-subject-v2')?.value;
        if (subjectSelect) {
            if (activeSubjectFilter && activeSubjectFilter !== 'all') {
                subjectSelect.value = activeSubjectFilter;
            } else {
                subjectSelect.value = 'Língua Portuguesa';
            }
        }

        const initialDate = defaultDate || '2026-08-19';
        if (dateInput) dateInput.value = initialDate;

        if (slotSelect) slotSelect.value = defaultSlot || '07:30 - 08:20';

        renderPlannerQuickDayButtons(initialDate);

        if (existingPlanId) {
            const allLessons = getScheduleLessonsDb();
            const existing = allLessons.find(l => l.id === existingPlanId);
            if (existing) {
                if (titleEl) titleEl.textContent = '✏️ Editar Planejamento de Habilidades';
                if (planIdInput) planIdInput.value = existing.id;
                if (turmaSelect) turmaSelect.value = existing.turmaContext || currentTurmaContext;
                if (subjectSelect) subjectSelect.value = existing.disciplina || 'Língua Portuguesa';
                if (dateInput) dateInput.value = existing.date || existing.data_planejada || initialDate;
                if (slotSelect) slotSelect.value = existing.time || existing.horarioTexto || '07:30 - 08:20';
                if (obsInput) obsInput.value = existing.observacoes || existing.methodology || '';
                if (statusSelect) statusSelect.value = existing.status || 'planejada';

                if (existing.descritor_codigo) {
                    plannerSelectedItems.push({
                        type: 'SAEB',
                        code: existing.descritor_codigo,
                        desc: existing.descritor_desc || existing.habilidadeDesc || 'Descritor SAEB/SEAMA',
                        disciplina: existing.disciplina || 'Língua Portuguesa'
                    });
                }
                if (existing.habilidade_bncc_codigo) {
                    plannerSelectedItems.push({
                        type: 'BNCC',
                        code: existing.habilidade_bncc_codigo,
                        desc: existing.habilidade_bncc_desc || existing.habilidadeDesc || 'Habilidade BNCC',
                        disciplina: existing.disciplina || 'Língua Portuguesa'
                    });
                }
                if (plannerSelectedItems.length === 0 && existing.habilidadeCode) {
                    const isBncc = existing.habilidadeCode.startsWith('EF');
                    plannerSelectedItems.push({
                        type: isBncc ? 'BNCC' : 'SAEB',
                        code: existing.habilidadeCode,
                        desc: existing.habilidadeDesc || '',
                        disciplina: existing.disciplina || 'Língua Portuguesa'
                    });
                }
            }
        } else {
            if (titleEl) titleEl.textContent = '+ Novo Planejamento de Habilidades';
            if (planIdInput) planIdInput.value = '';
            if (obsInput) obsInput.value = '';
            if (statusSelect) statusSelect.value = 'planejada';
        }

        renderPlannerSelectedBadges();
        checkPlannerRepetitionWarning();

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    function closeNewSchedulePlanModal() {
        const modal = document.getElementById('modal-create-schedule-planner');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function renderPlannerQuickDayButtons(baseDateStr) {
        const container = document.getElementById('planner-quick-day-buttons');
        if (!container) return;

        const base = new Date(baseDateStr + 'T00:00:00');
        const dayOfWeek = base.getDay();
        const monday = new Date(base);
        monday.setDate(base.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        let html = '';

        days.forEach((dayLabel, idx) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + idx);
            const iso = d.toISOString().split('T')[0];
            const isSelected = iso === baseDateStr;
            const dayNum = String(d.getDate()).padStart(2, '0');

            html += `
                <button type="button" onclick="setPlannerDateFromQuickButton('${iso}');" 
                        class="btn btn-sm" 
                        style="flex: 1; padding: 4px 6px; font-size: 0.72rem; font-weight: ${isSelected ? '800' : '600'}; background: ${isSelected ? '#6366f1' : 'var(--bg-secondary)'}; color: ${isSelected ? '#ffffff' : 'var(--text-primary)'}; border: 1px solid ${isSelected ? '#6366f1' : 'var(--border-color)'}; border-radius: 4px; cursor: pointer;">
                    ${dayLabel} ${dayNum}
                </button>
            `;
        });

        container.innerHTML = html;
    }

    function setPlannerDateFromQuickButton(isoDate) {
        const dateInput = document.getElementById('planner-modal-date');
        if (dateInput) {
            dateInput.value = isoDate;
            renderPlannerQuickDayButtons(isoDate);
            checkPlannerRepetitionWarning();
            updatePlannerRecurrencePreview();
        }
    }

    function handlePlannerDateChange() {
        const dateInput = document.getElementById('planner-modal-date');
        if (dateInput && dateInput.value) {
            renderPlannerQuickDayButtons(dateInput.value);
            checkPlannerRepetitionWarning();
            updatePlannerRecurrencePreview();
        }
    }

    function handlePlannerSkillSearchInput(query) {
        const resultsEl = document.getElementById('planner-skill-search-results');
        if (!resultsEl) return;

        const q = (query || '').trim().toLowerCase();
        const currentSubject = document.getElementById('planner-modal-subject')?.value || 'Língua Portuguesa';

        const saebList = [];
        const isMath = currentSubject.includes('Matemática');
        const descSource = (typeof window.MATRIZ_DESCRITORES_EXCEL_OFICIAL !== 'undefined' ? window.MATRIZ_DESCRITORES_EXCEL_OFICIAL : {});

        if (isMath && descSource.matematica) {
            descSource.matematica.forEach(d => saebList.push({ type: 'SAEB', code: d.codigo, desc: d.desc, topico: d.topico, disciplina: 'Matemática' }));
        } else if (!isMath && descSource.portuguese) {
            descSource.portuguese.forEach(d => saebList.push({ type: 'SAEB', code: d.codigo, desc: d.desc, topico: d.topico, disciplina: 'Língua Portuguesa' }));
        } else {
            const defDesc = isMath 
                ? [{ codigo: 'D01', desc: 'Identificar a localização e movimentação de objeto em mapas.' }, { codigo: 'D13', desc: 'Reconhecer e utilizar características do sistema de numeração decimal.' }, { codigo: 'D19', desc: 'Resolver problemas com números naturais envolvendo adição ou subtração.' }]
                : [{ codigo: 'D01', desc: 'Localizar informações explícitas em um texto.' }, { codigo: 'D03', desc: 'Inferir o sentido de uma palavra ou expressão.' }, { codigo: 'D04', desc: 'Inferir uma informação implícita em um texto.' }, { codigo: 'D06', desc: 'Identificar o tema ou assunto principal de um texto.' }, { codigo: 'D14', desc: 'Distinguir um fato da opinião relativa a esse fato.' }];
            defDesc.forEach(d => saebList.push({ type: 'SAEB', code: d.codigo, desc: d.desc, topico: 'SAEB', disciplina: isMath ? 'Matemática' : 'Língua Portuguesa' }));
        }

        const bnccList = (typeof window.BNCC_HABILIDADES_DATABASE !== 'undefined' ? window.BNCC_HABILIDADES_DATABASE : [])
            .filter(b => !currentSubject || b.disciplina === currentSubject || currentSubject === 'all')
            .map(b => ({ type: 'BNCC', code: b.code, desc: b.descricao, objeto: b.objeto, ano: b.ano, disciplina: b.disciplina }));

        const filteredSaeb = saebList.filter(s => !q || s.code.toLowerCase().includes(q) || (s.desc && s.desc.toLowerCase().includes(q)));
        const filteredBncc = bnccList.filter(b => !q || b.code.toLowerCase().includes(q) || (b.desc && b.desc.toLowerCase().includes(q)) || (b.objeto && b.objeto.toLowerCase().includes(q)));

        const totalFound = filteredSaeb.length + filteredBncc.length;
        if (totalFound === 0) {
            resultsEl.innerHTML = `<div style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">Nenhum descritor ou habilidade compatível encontrado para ${currentSubject}.</div>`;
            resultsEl.style.display = 'block';
            return;
        }

        let html = '';

        if (filteredSaeb.length > 0) {
            html += `
                <div style="padding: 6px 12px; background: var(--color-surface-subtle); font-size: var(--text-xs); font-weight: 700; color: var(--color-brand-primary); text-transform: uppercase; letter-spacing: 0.5px;">
                    DESCRITORES SAEB / SEAMA (MATRIZ DE REFERÊNCIA)
                </div>
            `;
            filteredSaeb.slice(0, 8).forEach(item => {
                const isSelected = plannerSelectedItems.some(sel => sel.code === item.code);
                html += `
                    <div style="padding: 10px 14px; border-bottom: 1px solid var(--color-border-subtle); cursor: pointer; transition: background 0.15s ease; display: flex; justify-content: space-between; align-items: center; ${isSelected ? 'background: var(--color-accent-subtle);' : ''}" 
                         onmouseover="this.style.background='var(--color-surface-subtle)';" 
                         onmouseout="this.style.background='${isSelected ? 'var(--color-accent-subtle)' : 'transparent'}';"
                         onclick="selectPlannerSkillItem('SAEB', '${item.code}', '${item.desc.replace(/'/g, "\\'")}', '${item.disciplina}');">
                        <div style="flex: 1; padding-right: 10px;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                <span class="badge badge-status-advanced" style="font-size: var(--text-xs); font-weight: 700;">${item.code} · SAEB</span>
                                <span style="font-size: var(--text-xs); color: var(--color-text-secondary);">${item.disciplina}</span>
                            </div>
                            <div style="font-size: var(--text-xs); color: var(--color-text-primary); line-height: 1.3;">${item.desc}</div>
                        </div>
                        <span style="font-size: var(--text-xs); font-weight: 700; color: var(--color-accent-primary);">${isSelected ? '✓ Adicionado' : '+ Selecionar'}</span>
                    </div>
                `;
            });
        }

        if (filteredBncc.length > 0) {
            html += `
                <div style="padding: 6px 12px; background: var(--color-surface-subtle); font-size: var(--text-xs); font-weight: 700; color: var(--color-status-success-text); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;">
                    HABILIDADES BNCC (BASE NACIONAL COMUM CURRICULAR)
                </div>
            `;
            filteredBncc.slice(0, 10).forEach(item => {
                const isSelected = plannerSelectedItems.some(sel => sel.code === item.code);
                html += `
                    <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-color); cursor: pointer; transition: background 0.15s ease; display: flex; justify-content: space-between; align-items: center; ${isSelected ? 'background: rgba(16,185,129,0.08);' : ''}" 
                         onmouseover="this.style.background='rgba(16, 185, 129, 0.15)';" 
                         onmouseout="this.style.background='${isSelected ? 'rgba(16,185,129,0.08)' : 'transparent'}';"
                         onclick="selectPlannerSkillItem('BNCC', '${item.code}', '${item.desc.replace(/'/g, "\\'")}', '${item.disciplina}');">
                        <div style="flex: 1; padding-right: 10px;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                                <span class="badge badge-success" style="font-size: 0.7rem; font-weight: 800; background: #10b981; color: #fff;">${item.code} · BNCC</span>
                                <span style="font-size: 0.72rem; color: var(--text-muted);">${item.ano || ''} • ${item.objeto || item.disciplina}</span>
                            </div>
                            <div style="font-size: 0.78rem; color: var(--text-primary); line-height: 1.3;">${item.desc}</div>
                        </div>
                        <span style="font-size: 0.75rem; font-weight: 700; color: #10b981;">${isSelected ? '✓ Adicionado' : '+ Selecionar'}</span>
                    </div>
                `;
            });
        }

        resultsEl.innerHTML = html;
        resultsEl.style.display = 'block';
    }

    function selectPlannerSkillItem(type, code, desc, disciplina) {
        const existingIndex = plannerSelectedItems.findIndex(i => i.code === code);
        if (existingIndex >= 0) {
            plannerSelectedItems.splice(existingIndex, 1);
        } else {
            plannerSelectedItems.push({ type, code, desc, disciplina });
        }

        const resultsEl = document.getElementById('planner-skill-search-results');
        const searchInput = document.getElementById('planner-skill-search-input');
        if (resultsEl) resultsEl.style.display = 'none';
        if (searchInput) searchInput.value = '';

        renderPlannerSelectedBadges();
        checkPlannerRepetitionWarning();
    }

    function removePlannerSelectedItem(code) {
        plannerSelectedItems = plannerSelectedItems.filter(i => i.code !== code);
        renderPlannerSelectedBadges();
        checkPlannerRepetitionWarning();
    }

    function renderPlannerSelectedBadges() {
        const container = document.getElementById('planner-selected-badges-container');
        if (!container) return;

        if (plannerSelectedItems.length === 0) {
            container.innerHTML = `
                <div style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="info" style="width: 14px; height: 14px;"></i> Nenhum descritor ou habilidade selecionado ainda. Pesquise no campo acima.
                </div>
            `;
            if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
            return;
        }

        let html = '';
        plannerSelectedItems.forEach(item => {
            const isSaeb = item.type === 'SAEB';
            const bg = isSaeb ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)';
            const border = isSaeb ? '#6366f1' : '#10b981';
            const color = isSaeb ? '#6366f1' : '#059669';

            html += `
                <div style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; background: ${bg}; border: 1px solid ${border}; border-radius: 20px; font-size: 0.78rem; font-weight: 700; color: ${color};" title="${item.desc}">
                    <span>${item.code} · ${item.type}</span>
                    <button type="button" onclick="removePlannerSelectedItem('${item.code}');" style="background: none; border: none; cursor: pointer; color: ${color}; font-weight: 800; font-size: 0.9rem; padding: 0 2px; line-height: 1;" title="Remover">✕</button>
                </div>
            `;
        });

        container.innerHTML = html;
        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    function handlePlannerTurmaChange() {
        checkPlannerRepetitionWarning();
    }

    function handlePlannerSubjectChange() {
        const searchInput = document.getElementById('planner-skill-search-input');
        if (searchInput && searchInput.value) {
            handlePlannerSkillSearchInput(searchInput.value);
        }
    }

    function checkPlannerRepetitionWarning() {
        const warningBox = document.getElementById('planner-repetition-warning');
        if (!warningBox) return;

        const currentTurma = document.getElementById('planner-modal-turma')?.value || currentTurmaContext;
        const chosenDate = document.getElementById('planner-modal-date')?.value || '2026-08-19';

        if (plannerSelectedItems.length === 0) {
            warningBox.style.display = 'none';
            return;
        }

        const allLessons = getScheduleLessonsDb();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        const planDateMs = new Date(chosenDate).getTime();

        const warnings = [];

        plannerSelectedItems.forEach(item => {
            const pastPlan = allLessons.find(l => {
                if (plannerEditingPlanId && l.id === plannerEditingPlanId) return false;
                if (l.turmaContext !== currentTurma) return false;
                const matchCode = l.descritor_codigo === item.code || l.habilidade_bncc_codigo === item.code || l.habilidadeCode === item.code;
                if (!matchCode) return false;

                const lDateMs = new Date(l.date || l.data_planejada).getTime();
                const diff = Math.abs(planDateMs - lDateMs);
                return diff <= thirtyDaysMs;
            });

            if (pastPlan) {
                const pastDateFormatted = (pastPlan.date || pastPlan.data_planejada).split('-').reverse().join('/');
                warnings.push(`O item <strong>${item.code}</strong> (${item.type}) já foi planejado em <strong>${pastDateFormatted}</strong> para esta turma.`);
            }
        });

        if (warnings.length > 0) {
            warningBox.innerHTML = `
                <div style="display: flex; gap: 8px; align-items: flex-start;">
                    <span style="font-size: 1rem;">⚠️</span>
                    <div>
                        <strong style="display: block; margin-bottom: 2px;">Aviso de Repetição Pedagógica (Últimos 30 dias):</strong>
                        ${warnings.map(w => `<div style="font-size: 0.76rem;">• ${w}</div>`).join('')}
                        <div style="font-size: 0.72rem; color: #78350f; margin-top: 4px; font-style: italic;">Você pode salvar normalmente se a intenção for reforço ou recomposição de aprendizagem.</div>
                    </div>
                </div>
            `;
            warningBox.style.display = 'block';
        } else {
            warningBox.style.display = 'none';
        }
    }

    function handlePlannerRecurrenceToggle(enabled) {
        const container = document.getElementById('planner-modal-recurrence-container');
        const endDateInput = document.getElementById('planner-modal-recurrence-end-date');
        const startDateInput = document.getElementById('planner-modal-date');

        if (!container) return;
        container.style.display = enabled ? 'block' : 'none';

        if (enabled && endDateInput && startDateInput) {
            if (!endDateInput.value) {
                const start = new Date(startDateInput.value + 'T00:00:00');
                const end = new Date(start);
                end.setDate(start.getDate() + 42); // 6 semanas padrão
                endDateInput.value = end.toISOString().split('T')[0];
            }
            updatePlannerRecurrencePreview();
        }
    }

    function updatePlannerRecurrencePreview() {
        const previewEl = document.getElementById('planner-modal-recurrence-preview');
        const toggle = document.getElementById('planner-modal-recurrence-toggle');
        const startDateInput = document.getElementById('planner-modal-date');
        const endDateInput = document.getElementById('planner-modal-recurrence-end-date');

        if (!previewEl || !toggle || !toggle.checked || !startDateInput || !endDateInput) return;

        const start = new Date(startDateInput.value + 'T00:00:00');
        const end = new Date(endDateInput.value + 'T00:00:00');

        if (end <= start) {
            previewEl.innerHTML = '<span style="color: #ef4444;">A data final deve ser posterior à data inicial.</span>';
            return;
        }

        const daysNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        const dayOfWeek = start.getDay();
        const dayName = daysNames[dayOfWeek];

        let count = 0;
        let cur = new Date(start);
        while (cur <= end) {
            count++;
            cur.setDate(cur.getDate() + 7);
        }

        const startStr = startDateInput.value.split('-').reverse().slice(0, 2).join('/');
        const endStr = endDateInput.value.split('-').reverse().slice(0, 2).join('/');

        previewEl.innerHTML = `
            <span>Isso vai criar <strong>${count} planejamentos</strong> (toda ${dayName}, de ${startStr} a ${endStr}).</span>
        `;
    }

    function handleSaveNewSchedulePlan(e) {
        if (e && e.preventDefault) e.preventDefault();

        if (plannerSelectedItems.length === 0) {
            if (typeof window.showToast === 'function') {
                window.showToast('⚠️ Selecione ao menos um Descritor SAEB/SEAMA ou Habilidade BNCC no campo principal.', 'warning');
            } else {
                alert('⚠️ Selecione ao menos um Descritor SAEB/SEAMA ou Habilidade BNCC no campo principal.');
            }
            return;
        }

        const planId = document.getElementById('planner-modal-plan-id')?.value;
        const turmaContext = document.getElementById('planner-modal-turma')?.value || currentTurmaContext;
        const subject = document.getElementById('planner-modal-subject')?.value || 'Língua Portuguesa';
        const date = document.getElementById('planner-modal-date')?.value || '2026-08-19';
        const slot = document.getElementById('planner-modal-slot')?.value || '07:30 - 08:20';
        const obs = document.getElementById('planner-modal-obs')?.value || '';
        const status = document.getElementById('planner-modal-status')?.value || 'planejada';
        const isRecurrent = document.getElementById('planner-modal-recurrence-toggle')?.checked || false;
        const recurrenceEndDate = document.getElementById('planner-modal-recurrence-end-date')?.value;

        const escola = turmaContext.split('—')[0]?.trim() || 'UI JOSE CORREA LIMA';
        const turma = turmaContext.split('—')[1]?.trim() || '2º Ano A';

        const saebItem = plannerSelectedItems.find(i => i.type === 'SAEB');
        const bnccItem = plannerSelectedItems.find(i => i.type === 'BNCC');

        const primaryCode = plannerSelectedItems.map(i => i.code).join(' + ');
        const primaryDesc = plannerSelectedItems.map(i => i.code + ': ' + i.desc).join(' | ');

        const allLessons = getScheduleLessonsDb();

        if (planId) {
            const existing = allLessons.find(l => l.id === planId);
            if (existing) {
                existing.escola_id = escola;
                existing.escola = escola;
                existing.turma_id = turma;
                existing.turma = turma;
                existing.turmaContext = turmaContext;
                existing.disciplina = subject;
                existing.descritor_codigo = saebItem ? saebItem.code : null;
                existing.descritor_desc = saebItem ? saebItem.desc : null;
                existing.habilidade_bncc_codigo = bnccItem ? bnccItem.code : null;
                existing.habilidade_bncc_desc = bnccItem ? bnccItem.desc : null;
                existing.habilidadeCode = primaryCode;
                existing.habilidadeDesc = primaryDesc;
                existing.data_planejada = date;
                existing.date = date;
                existing.time = slot;
                existing.horarioTexto = slot;
                existing.status = status;
                existing.data_confirmacao = status === 'trabalhada' ? (existing.data_confirmacao || new Date().toISOString()) : null;
                existing.observacoes = obs;
                existing.methodology = obs;
            }
        } else {
            const datesToCreate = [date];
            const recurrenceGroupId = isRecurrent ? 'rec_' + Date.now() : null;

            if (isRecurrent && recurrenceEndDate) {
                const start = new Date(date + 'T00:00:00');
                const end = new Date(recurrenceEndDate + 'T00:00:00');
                let cur = new Date(start);
                cur.setDate(cur.getDate() + 7);
                while (cur <= end) {
                    datesToCreate.push(cur.toISOString().split('T')[0]);
                    cur.setDate(cur.getDate() + 7);
                }
            }

            datesToCreate.forEach(dIso => {
                const newPlan = {
                    id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    escola_id: escola,
                    escola: escola,
                    turma_id: turma,
                    turma: turma,
                    turmaContext: turmaContext,
                    disciplina: subject,
                    descritor_codigo: saebItem ? saebItem.code : null,
                    descritor_desc: saebItem ? saebItem.desc : null,
                    habilidade_bncc_codigo: bnccItem ? bnccItem.code : null,
                    habilidade_bncc_desc: bnccItem ? bnccItem.desc : null,
                    habilidadeCode: primaryCode,
                    habilidadeDesc: primaryDesc,
                    data_planejada: dIso,
                    date: dIso,
                    time: slot,
                    horarioTexto: slot,
                    status: status,
                    data_confirmacao: status === 'trabalhada' ? new Date().toISOString() : null,
                    observacoes: obs,
                    methodology: obs,
                    recorrencia: isRecurrent ? { tipo: 'semanal', ate_data: recurrenceEndDate } : null,
                    recorrencia_grupo_id: recurrenceGroupId,
                    criado_por: sessionStorage.getItem('userName') || 'Profa. Silvana Ferreira (Regente)',
                    criadoPor: sessionStorage.getItem('userName') || 'Profa. Silvana Ferreira (Regente)',
                    criado_em: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    excluido_em: null,
                    deletedAt: null
                };
                allLessons.push(newPlan);
            });
        }

        saveScheduleLessonsDb(allLessons);
        closeNewSchedulePlanModal();
        renderActiveScheduleView();

        if (typeof window.showToast === 'function') {
            window.showToast(`✅ Planejamento (${primaryCode}) salvo no cronograma com sucesso!`, 'success');
        }
    }

    // =========================================================================
    // VISÃO MENSAL (DRAG & DROP, EXPANSOR DE AULAS)
    // =========================================================================

    function renderScheduleMonthlyCalendar() {
        const grid = document.getElementById('calendar-monthly-cells-grid');
        const accordion = document.getElementById('calendar-monthly-accordion-mobile');
        const statsEl = document.getElementById('monthly-stats-summary');
        if (!grid) return;

        const allLessons = getScheduleLessonsDb();
        const subjectFilter = document.getElementById('cal-filter-subject-v2')?.value || 'all';

        const turmaLessons = allLessons.filter(l => {
            if (l.turmaContext !== currentTurmaContext) return false;
            if (subjectFilter !== 'all' && l.disciplina !== subjectFilter) return false;
            return true;
        });

        const todayStr = '2026-08-18';

        const total = turmaLessons.length;
        const trabalhadas = turmaLessons.filter(l => l.status === 'trabalhada').length;
        const atrasadas = turmaLessons.filter(l => l.status === 'planejada' && l.date < todayStr).length;
        const pct = total > 0 ? Math.round((trabalhadas / total) * 100) : 0;

        if (statsEl) {
            statsEl.innerHTML = `
                <span>${trabalhadas} de ${total} aulas trabalhadas (${pct}%)</span>
                ${atrasadas > 0 ? `<span style="color: #ef4444; margin-left: 10px;">• ⚠️ ${atrasadas} em atraso</span>` : ''}
            `;
        }

        grid.innerHTML = '';
        if (accordion) accordion.innerHTML = '';

        const startDayOfWeek = 6; // Sábado (1 de Agosto de 2026)
        for (let i = 0; i < startDayOfWeek; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell cal-day-empty';
            emptyCell.style.background = 'var(--bg-tertiary)';
            emptyCell.style.minHeight = '110px';
            emptyCell.style.opacity = '0.4';
            grid.appendChild(emptyCell);
        }

        for (let d = 1; d <= 31; d++) {
            const dayNumStr = String(d).padStart(2, '0');
            const dateIso = `2026-08-${dayNumStr}`;
            const dayLessons = turmaLessons.filter(l => l.date === dateIso);
            const isToday = dateIso === todayStr;

            const cell = document.createElement('div');
            cell.className = `cal-day-cell ${isToday ? 'cal-day-today' : ''}`;
            cell.style.minHeight = '115px';
            cell.style.background = isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)';
            cell.style.padding = '8px';
            cell.style.display = 'flex';
            cell.style.flexDirection = 'column';
            cell.style.gap = '4px';
            cell.style.position = 'relative';

            cell.ondragover = (e) => { e.preventDefault(); cell.style.background = 'rgba(99, 102, 241, 0.15)'; };
            cell.ondragleave = () => { cell.style.background = isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)'; };
            cell.ondrop = (e) => {
                e.preventDefault();
                cell.style.background = isToday ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)';
                const lessonId = e.dataTransfer.getData('text/plain');
                if (lessonId) handleLessonDropToDate(lessonId, dateIso);
            };

            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.marginBottom = '2px';

            const daySpan = document.createElement('span');
            daySpan.style.fontWeight = isToday ? '800' : '700';
            daySpan.style.fontSize = '0.85rem';
            daySpan.style.color = isToday ? '#6366f1' : 'var(--text-primary)';
            daySpan.textContent = d;
            headerDiv.appendChild(daySpan);

            if (dayLessons.length > 0) {
                const expandBtn = document.createElement('button');
                expandBtn.type = 'button';
                expandBtn.title = `Ver ${dayLessons.length} aulas do dia ${dayNumStr}/08`;
                expandBtn.style.background = 'rgba(99,102,241,0.1)';
                expandBtn.style.border = 'none';
                expandBtn.style.color = '#6366f1';
                expandBtn.style.fontSize = '0.68rem';
                expandBtn.style.fontWeight = '700';
                expandBtn.style.borderRadius = '4px';
                expandBtn.style.padding = '1px 5px';
                expandBtn.style.cursor = 'pointer';
                expandBtn.textContent = `${dayLessons.length} aulas 👁️`;
                expandBtn.onclick = (e) => { e.stopPropagation(); openDayExpandedDrawer(dateIso); };
                headerDiv.appendChild(expandBtn);
            }

            cell.appendChild(headerDiv);

            const displayLessons = dayLessons.slice(0, 2);
            displayLessons.forEach(les => {
                const isAtrasada = les.status === 'planejada' && les.date < todayStr;
                const tag = document.createElement('div');
                tag.draggable = true;
                tag.ondragstart = (e) => { e.dataTransfer.setData('text/plain', les.id); };
                tag.className = `cal-lesson-tag ${les.status === 'trabalhada' ? 'tag-trabalhada' : (isAtrasada ? 'tag-atrasada' : 'tag-planejada')}`;
                tag.style.fontSize = '0.72rem';
                tag.style.padding = '4px 6px';
                tag.style.borderRadius = '4px';
                tag.style.cursor = 'grab';
                tag.style.marginBottom = '2px';
                tag.style.display = 'flex';
                tag.style.justifyContent = 'space-between';
                tag.style.alignItems = 'center';
                tag.onclick = () => openDayExpandedDrawer(dateIso);

                tag.innerHTML = `
                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; flex: 1;">
                        ${isAtrasada ? '⚠️ ' : (les.status === 'trabalhada' ? '✓ ' : '⏳ ')}${les.habilidadeCode || les.disciplina}
                    </div>
                    <button type="button" onclick="event.stopPropagation(); toggleLessonWorkStatus('${les.id}');" 
                            style="background: none; border: none; cursor: pointer; font-size: 10px; padding: 0 2px; line-height: 1;" title="Alternar Trabalhada/Planejada">
                        ${les.status === 'trabalhada' ? '🟢' : '🟡'}
                    </button>
                `;
                cell.appendChild(tag);
            });

            if (dayLessons.length > 2) {
                const moreBtn = document.createElement('div');
                moreBtn.style.fontSize = '0.7rem';
                moreBtn.style.color = '#6366f1';
                moreBtn.style.fontWeight = '700';
                moreBtn.style.cursor = 'pointer';
                moreBtn.style.textAlign = 'center';
                moreBtn.style.marginTop = '2px';
                moreBtn.textContent = `+${dayLessons.length - 2} aulas (ver todas)`;
                moreBtn.onclick = () => openDayExpandedDrawer(dateIso);
                cell.appendChild(moreBtn);
            }

            grid.appendChild(cell);
        }
    }

    // =========================================================================
    // VISÃO SEMANAL TIMETABLE
    // =========================================================================

    function renderScheduleWeeklyTimetable() {
        const container = document.getElementById('weekly-timetable-grid');
        if (!container) return;

        const allLessons = getScheduleLessonsDb();
        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurmaContext);
        const todayStr = '2026-08-18';

        const daysOfWeek = [
            { label: 'Segunda-feira', dateIso: '2026-08-17', short: 'SEG 17/08' },
            { label: 'Terça-feira', dateIso: '2026-08-18', short: 'TER 18/08 (Hoje)' },
            { label: 'Quarta-feira', dateIso: '2026-08-19', short: 'QUA 19/08' },
            { label: 'Quinta-feira', dateIso: '2026-08-20', short: 'QUI 20/08' },
            { label: 'Sexta-feira', dateIso: '2026-08-21', short: 'SEX 21/08' }
        ];

        let html = `
            <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); font-weight: 700; font-size: 0.8rem; text-align: center;">
                <div style="padding: 12px; border-right: 1px solid var(--border-color); color: var(--text-muted);">HORÁRIO</div>
                ${daysOfWeek.map(d => `<div style="padding: 12px; border-right: 1px solid var(--border-color); color: ${d.dateIso === todayStr ? '#6366f1' : 'var(--text-primary)'};">${d.short}</div>`).join('')}
            </div>
        `;

        const timeSlots = [
            '07:30 - 08:20',
            '08:20 - 09:10',
            '09:25 - 10:15',
            '10:15 - 11:05'
        ];

        timeSlots.forEach(slot => {
            html += `
                <div style="display: grid; grid-template-columns: 100px repeat(5, 1fr); border-bottom: 1px solid var(--border-color); min-height: 85px;">
                    <div style="padding: 10px; border-right: 1px solid var(--border-color); font-size: 0.75rem; font-weight: 700; color: var(--text-muted); background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;">
                        ${slot}
                    </div>
                    ${daysOfWeek.map(d => {
                        const slotLessons = turmaLessons.filter(l => l.date === d.dateIso && l.time === slot);
                        return `
                            <div class="weekly-slot-cell" style="padding: 6px; border-right: 1px solid var(--border-color); background: var(--bg-primary); display: flex; flex-direction: column; gap: 4px; position: relative; min-height: 80px;"
                                 ondragover="event.preventDefault(); this.style.background='rgba(99,102,241,0.1)';"
                                 ondragleave="this.style.background='var(--bg-primary)';"
                                 ondrop="event.preventDefault(); this.style.background='var(--bg-primary)'; const lid = event.dataTransfer.getData('text/plain'); if(lid) handleLessonDropToSlot(lid, '${d.dateIso}', '${slot}');">
                                ${slotLessons.map(les => {
                                    const isAtrasada = les.status === 'planejada' && les.date < todayStr;
                                    return `
                                        <div draggable="true" ondragstart="event.dataTransfer.setData('text/plain', '${les.id}');"
                                             class="weekly-lesson-card ${les.status === 'trabalhada' ? 'status-trabalhada' : (isAtrasada ? 'status-atrasada' : 'status-planejada')}"
                                             style="padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--bg-secondary); font-size: 0.75rem; cursor: grab; box-shadow: 0 1px 3px rgba(0,0,0,0.05); position: relative;"
                                             onclick="openDayExpandedDrawer('${les.date}');">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                                                <strong style="color: #6366f1;">${les.habilidadeCode}</strong>
                                                <button type="button" onclick="event.stopPropagation(); toggleLessonWorkStatus('${les.id}');" 
                                                        class="badge ${les.status === 'trabalhada' ? 'badge-success' : (isAtrasada ? 'badge-danger' : 'badge-warning')}" 
                                                        style="font-size: 0.65rem; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;" title="Clique para alternar Trabalhada / Planejada">
                                                    ${isAtrasada ? 'Atrasada' : (les.status === 'trabalhada' ? 'Trabalhada' : 'Planejada')}
                                                </button>
                                            </div>
                                            <div style="font-weight: 600; color: var(--text-primary); font-size: 0.72rem; line-height: 1.3;">${les.disciplina}</div>
                                            <div style="display: flex; gap: 4px; justify-content: flex-end; margin-top: 4px;">
                                                <button type="button" onclick="event.stopPropagation(); openNewSchedulePlanModal(null, null, '${les.id}');" style="background: none; border: none; font-size: 11px; cursor: pointer; color: var(--text-muted);" title="Editar Planejamento">Editar</button>
                                                <button type="button" onclick="event.stopPropagation(); handleDeleteLessonWithTrash('${les.id}');" style="background: none; border: none; font-size: 11px; cursor: pointer; color: #ef4444;" title="Mover para Lixeira">Excluir</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                                ${slotLessons.length === 0 ? `
                                    <div onclick="openNewSchedulePlanModal('${d.dateIso}', '${slot}');" style="flex: 1; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; cursor: pointer; color: #6366f1; font-size: 0.72rem; font-weight: 700; border: 1px dashed rgba(99,102,241,0.4); border-radius: 4px;" onmouseover="this.style.opacity='1';" onmouseout="this.style.opacity='0';">
                                        + Planejar
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // =========================================================================
    // VISÃO COMPARATIVO LADO A LADO ENTRE TURMAS
    // =========================================================================

    function renderScheduleComparisonView() {
        const container = document.getElementById('schedule-comparison-cards-container');
        const sel1 = document.getElementById('compare-turma-select-1');
        const sel2 = document.getElementById('compare-turma-select-2');
        if (!container || !sel1 || !sel2) return;

        const turma1 = sel1.value;
        const turma2 = sel2.value;

        const allLessons = getScheduleLessonsDb();
        const lessons1 = allLessons.filter(l => l.turmaContext === turma1);
        const lessons2 = allLessons.filter(l => l.turmaContext === turma2);

        function buildColumnHtml(turmaName, lessons, accentColor) {
            const total = lessons.length;
            const trab = lessons.filter(l => l.status === 'trabalhada').length;
            const atras = lessons.filter(l => l.status === 'planejada' && l.date < '2026-08-18').length;
            const pct = total > 0 ? Math.round((trab / total) * 100) : 0;

            const lpTrab = lessons.filter(l => l.disciplina === 'Língua Portuguesa' && l.status === 'trabalhada').length;
            const mtTrab = lessons.filter(l => l.disciplina === 'Matemática' && l.status === 'trabalhada').length;
            const ciTrab = lessons.filter(l => l.disciplina && l.disciplina.includes('Ciências') && l.status === 'trabalhada').length;

            return `
                <div class="comparison-column-card">
                    <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                        <span style="font-size: 0.72rem; font-weight: 800; color: ${accentColor}; text-transform: uppercase;">TURMA ANALISADA</span>
                        <h4 style="margin: 2px 0 0 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">${turmaName}</h4>
                    </div>

                    <!-- Métricas Principais -->
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: center;">
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">COBERTURA</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: ${accentColor};">${pct}%</div>
                        </div>
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">TRABALHADAS</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: #10b981;">${trab}/${total}</div>
                        </div>
                        <div style="padding: 10px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                            <div style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">ATRASOS</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: ${atras > 0 ? '#ef4444' : '#10b981'};">${atras}</div>
                        </div>
                    </div>

                    <!-- Progresso por Componente Curricular -->
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);">Progresso por Disciplina:</div>
                        
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Língua Portuguesa</span>
                                <strong>${lpTrab} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar purple" style="width: ${total > 0 ? (lpTrab / total) * 100 : 0}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Matemática</span>
                                <strong>${mtTrab} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar blue" style="width: ${total > 0 ? (mtTrab / total) * 100 : 0}%;"></div>
                            </div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; font-weight: 600; margin-bottom: 2px;">
                                <span>Ciências da Natureza</span>
                                <strong>${ciTrab} aulas trabalhadas</strong>
                            </div>
                            <div class="progress-bar-container" style="height: 8px; margin: 0;">
                                <div class="progress-bar green" style="width: ${total > 0 ? (ciTrab / total) * 100 : 0}%;"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Lista de Habilidades Agendadas -->
                    <div style="flex: 1; border-top: 1px solid var(--border-color); padding-top: 10px;">
                        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px;">Habilidades Trabalhadas e Lacunas:</div>
                        <div style="display: flex; flex-direction: column; gap: 6px; max-height: 220px; overflow-y: auto;">
                            ${lessons.map(l => `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.75rem;">
                                    <div>
                                        <strong style="color: #6366f1;">${l.habilidadeCode}</strong> - ${l.disciplina}
                                        <div style="font-size: 0.68rem; color: var(--text-muted);">Data: ${l.date.split('-').reverse().join('/')}</div>
                                    </div>
                                    <span class="badge ${l.status === 'trabalhada' ? 'badge-success' : 'badge-warning'}">${l.status}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = buildColumnHtml(turma1, lessons1, '#6366f1') + buildColumnHtml(turma2, lessons2, '#10b981');
    }

    // =========================================================================
    // VISUALIZAÇÃO EXPANDIDA DO DIA (DRAWER LATERAL)
    // =========================================================================

    function openDayExpandedDrawer(dateIso) {
        activeExpandedDate = dateIso;
        const overlay = document.getElementById('drawer-day-expanded-overlay');
        const title = document.getElementById('drawer-day-title');
        const subtitle = document.getElementById('drawer-day-subtitle');
        const list = document.getElementById('drawer-day-lessons-list');
        const addBtn = document.getElementById('btn-drawer-add-lesson-to-day');

        if (!overlay || !list) return;

        const formattedDate = dateIso.split('-').reverse().join('/');
        if (title) title.textContent = `Aulas do Dia: ${formattedDate}`;
        if (subtitle) subtitle.textContent = currentTurmaContext;

        const allLessons = getScheduleLessonsDb();
        const dayLessons = allLessons.filter(l => l.turmaContext === currentTurmaContext && l.date === dateIso);
        const todayStr = '2026-08-18';

        list.innerHTML = '';

        if (dayLessons.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                    <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                    <p style="font-size: 0.85rem; margin: 0;">Nenhuma aula agendada para esta turma neste dia.</p>
                </div>
            `;
        } else {
            dayLessons.forEach(les => {
                const isAtrasada = les.status === 'planejada' && les.date < todayStr;
                const card = document.createElement('div');
                card.style.background = 'var(--bg-primary)';
                card.style.border = isAtrasada ? '1.5px solid #ef4444' : '1px solid var(--border-color)';
                card.style.borderRadius = 'var(--radius-md)';
                card.style.padding = '14px';
                card.style.display = 'flex';
                card.style.flexDirection = 'column';
                card.style.gap = '8px';

                // SECURITY FIX: [XSS Sanitization] Sanitização dos campos de aula
                const safeCode = typeof escapeHtml === 'function' ? escapeHtml(les.habilidadeCode) : les.habilidadeCode;
                const safeDisc = typeof escapeHtml === 'function' ? escapeHtml(les.disciplina) : les.disciplina;
                const safeTime = typeof escapeHtml === 'function' ? escapeHtml(les.time || 'Horário Padrão') : (les.time || 'Horário Padrão');
                const safeDesc = typeof escapeHtml === 'function' ? escapeHtml(les.habilidadeDesc) : les.habilidadeDesc;
                const safeMethod = les.methodology ? (typeof escapeHtml === 'function' ? escapeHtml(les.methodology) : les.methodology) : '';
                const safeCriadoPor = typeof escapeHtml === 'function' ? escapeHtml(les.criadoPor || 'Docente Regente') : (les.criadoPor || 'Docente Regente');

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 800; font-size: 0.88rem; color: #6366f1;">${safeCode}</span>
                        <span class="badge ${les.status === 'trabalhada' ? 'badge-success' : (isAtrasada ? 'badge-danger' : 'badge-warning')}">
                            ${isAtrasada ? '⚠️ Atrasada / Pendente' : (les.status === 'trabalhada' ? 'Trabalhada' : 'Planejada')}
                        </span>
                    </div>
                    <div style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary);">${safeDisc} • ${safeTime}</div>
                    <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">${safeDesc}</p>
                    ${safeMethod ? `<div style="font-size: 0.72rem; color: var(--text-muted); background: var(--bg-tertiary); padding: 6px 8px; border-radius: 4px;"><strong>Metodologia:</strong> ${safeMethod}</div>` : ''}
                    <div style="font-size: 0.7rem; color: var(--text-muted);">Responsável: ${safeCriadoPor}</div>
                    
                    <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 6px; border-top: 1px solid var(--border-color); padding-top: 8px;">
                        <button type="button" onclick="toggleLessonWorkStatus('${les.id}');" class="btn btn-outline btn-sm" style="font-size: 0.72rem; font-weight: 700; color: ${les.status === 'trabalhada' ? '#f59e0b' : '#10b981'}; border-color: ${les.status === 'trabalhada' ? '#f59e0b' : '#10b981'};">
                            ${les.status === 'trabalhada' ? 'Marcar como Planejada' : 'Concluir / Trabalhada'}
                        </button>
                        <button type="button" onclick="openDuplicateLessonModal('${les.id}');" class="btn btn-outline btn-sm" style="font-size: 0.72rem;" title="Duplicar para outra turma">
                            Duplicar
                        </button>
                        <button type="button" onclick="handleDeleteLessonWithTrash('${les.id}');" class="btn btn-outline btn-sm" style="font-size: 0.72rem; color: #ef4444; border-color: #fca5a5;" title="Excluir aula">
                            Excluir
                        </button>
                    </div>
                `;
                list.appendChild(card);
            });
        }

        if (addBtn) {
            addBtn.onclick = () => {
                closeDayExpandedDrawer();
                openNewSchedulePlanModal(dateIso);
            };
        }

        overlay.style.display = 'block';
    }

    function closeDayExpandedDrawer() {
        const overlay = document.getElementById('drawer-day-expanded-overlay');
        if (overlay) overlay.style.display = 'none';
    }

    // =========================================================================
    // MODAL DE PROGRESSO DETALHADO POR DISCIPLINA & LACUNAS
    // =========================================================================

    function openDetailedProgressModal() {
        const modal = document.getElementById('modal-detailed-progress');
        const turmaLabel = document.getElementById('modal-progress-turma-label');
        const body = document.getElementById('modal-detailed-progress-body');
        if (!modal || !body) return;

        if (turmaLabel) turmaLabel.textContent = currentTurmaContext;

        const allLessons = getScheduleLessonsDb();
        const turmaLessons = allLessons.filter(l => l.turmaContext === currentTurmaContext);

        const disciplines = ['Língua Portuguesa', 'Matemática', 'Ciências da Natureza'];
        let html = '';

        disciplines.forEach(disc => {
            const discLessons = turmaLessons.filter(l => l.disciplina.includes(disc) || disc.includes(l.disciplina));
            const total = discLessons.length;
            const trab = discLessons.filter(l => l.status === 'trabalhada').length;
            const pct = total > 0 ? Math.round((trab / total) * 100) : 0;
            const lacunas = discLessons.filter(l => l.status === 'planejada').map(l => l.habilidadeCode);

            html += `
                <div style="background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <strong style="font-size: 0.95rem; color: var(--text-primary);">${disc}</strong>
                        <span style="font-weight: 800; font-size: 0.9rem; color: #6366f1;">${trab} de ${total} aulas (${pct}%)</span>
                    </div>
                    <div class="progress-bar-container" style="height: 10px; margin-bottom: 10px;">
                        <div class="progress-bar purple" style="width: ${pct}%;"></div>
                    </div>
                    ${lacunas.length > 0 ? `
                        <div style="font-size: 0.78rem; color: var(--text-secondary);">
                            <strong>Habilidades Pendentes (Lacunas):</strong>
                            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                                ${lacunas.map(lac => `<span style="background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 0.72rem;">${lac}</span>`).join('')}
                            </div>
                        </div>
                    ` : `<div style="font-size: 0.78rem; color: #10b981; font-weight: 700;">✓ Todas as habilidades planejadas foram consolidadas!</div>`}
                </div>
            `;
        });

        body.innerHTML = html;
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeDetailedProgressModal() {
        const modal = document.getElementById('modal-detailed-progress');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleScheduleSkillSearch() {
        const input = document.getElementById('schedule-skill-search-input');
        const results = document.getElementById('schedule-skill-search-results');
        if (!input || !results) return;

        const query = input.value.trim().toLowerCase();
        if (!query) {
            results.style.display = 'none';
            return;
        }

        const allLessons = getScheduleLessonsDb();
        const matches = allLessons.filter(l => {
            if (l.turmaContext !== currentTurmaContext) return false;
            const str = (l.habilidadeCode + ' ' + l.habilidadeDesc + ' ' + l.disciplina).toLowerCase();
            return str.includes(query);
        });

        if (matches.length === 0) {
            results.innerHTML = '<div style="padding: 12px; font-size: 0.8rem; color: var(--text-muted); text-align: center;">Nenhuma aula agendada com esta habilidade.</div>';
        } else {
            results.innerHTML = matches.map(m => `
                <div style="padding: 10px 14px; border-bottom: 1px solid var(--border-color); cursor: pointer; font-size: 0.8rem;"
                     onclick="openDayExpandedDrawer('${m.date}'); document.getElementById('schedule-skill-search-results').style.display='none';">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong style="color: #6366f1;">${m.habilidadeCode}</strong>
                        <span style="font-size: 0.72rem; color: var(--text-muted);">Data: ${m.date.split('-').reverse().join('/')}</span>
                    </div>
                    <div style="color: var(--text-primary); font-size: 0.75rem; margin-top: 2px;">${m.disciplina} - ${m.habilidadeDesc.slice(0, 65)}...</div>
                </div>
            `).join('');
        }
        results.style.display = 'block';
    }

    // =========================================================================
    // DUPLICAÇÃO DE ROTINA PARA OUTRA TURMA
    // =========================================================================

    function openDuplicateLessonModal(lessonId) {
        const modal = document.getElementById('modal-duplicate-lesson');
        const inputId = document.getElementById('duplicate-source-lesson-id');
        const info = document.getElementById('duplicate-lesson-info');
        if (!modal || !inputId) return;

        const allLessons = getScheduleLessonsDb();
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        inputId.value = lessonId;
        if (info) {
            info.innerHTML = `
                <div><strong>${lesson.habilidadeCode}</strong> - ${lesson.disciplina}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">Origem: ${lesson.turmaContext} • Data: ${lesson.date.split('-').reverse().join('/')}</div>
            `;
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeDuplicateLessonModal() {
        const modal = document.getElementById('modal-duplicate-lesson');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleConfirmDuplicateLesson() {
        const inputId = document.getElementById('duplicate-source-lesson-id');
        const selectTarget = document.getElementById('duplicate-target-turma-select');
        if (!inputId || !selectTarget) return;

        const sourceId = inputId.value;
        const targetTurma = selectTarget.value;

        const allLessons = getScheduleLessonsDb();
        const source = allLessons.find(l => l.id === sourceId);
        if (!source) return;

        const newLesson = {
            ...source,
            id: 'les_' + Date.now(),
            turmaContext: targetTurma,
            turma: targetTurma.split('—')[1]?.trim() || 'Turma Paralela',
            escola: targetTurma.split('—')[0]?.trim() || source.escola,
            status: 'planejada',
            criadoPor: 'Profa. Silvana Ferreira (Duplicado de ' + source.turmaContext + ')',
            createdAt: new Date().toISOString()
        };

        allLessons.push(newLesson);
        saveScheduleLessonsDb(allLessons);
        closeDuplicateLessonModal();
        closeDayExpandedDrawer();
        renderActiveScheduleView();

        if (typeof window.showToast === 'function') {
            window.showToast(`Plano duplicado com sucesso para "${targetTurma}"!`, 'success');
        }
    }

    // =========================================================================
    // EXCLUSÃO SEGURA & LIXEIRA PEDAGÓGICA (30 DIAS)
    // =========================================================================

    function handleDeleteLessonWithTrash(lessonId) {
        if (typeof confirm === 'function' && !confirm('Deseja mover este plano de aula para a Lixeira? Ele ficará salvo por até 30 dias para recuperação.')) return;

        const allLessons = getScheduleLessonsDb();
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const trash = getScheduleTrashDb();
        trash.push({
            ...lesson,
            deletedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        saveScheduleTrashDb(trash);

        const updated = allLessons.filter(l => l.id !== lessonId);
        saveScheduleLessonsDb(updated);

        closeDayExpandedDrawer();
        renderActiveScheduleView();
        if (typeof window.showToast === 'function') {
            window.showToast('Aula movida para a Lixeira temporária com sucesso!', 'info');
        }
    }

    function openScheduleTrashModal() {
        const modal = document.getElementById('modal-schedule-trash');
        const list = document.getElementById('schedule-trash-items-list');
        if (!modal || !list) return;

        const trash = getScheduleTrashDb();
        list.innerHTML = '';

        if (trash.length === 0) {
            list.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-muted); font-size: 0.85rem;">A lixeira está vazia. Nenhuma aula excluída recentemente.</div>';
        } else {
            trash.forEach(item => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.justifyContent = 'space-between';
                row.style.alignItems = 'center';
                row.style.padding = '12px 14px';
                row.style.background = 'var(--bg-primary)';
                row.style.border = '1px solid var(--border-color)';
                row.style.borderRadius = 'var(--radius-sm)';

                // SECURITY FIX: [XSS Sanitization]
                const safeCode = typeof escapeHtml === 'function' ? escapeHtml(item.habilidadeCode) : item.habilidadeCode;
                const safeDisc = typeof escapeHtml === 'function' ? escapeHtml(item.disciplina) : item.disciplina;
                const safeContext = typeof escapeHtml === 'function' ? escapeHtml(item.turmaContext) : item.turmaContext;

                row.innerHTML = `
                    <div>
                        <strong style="color: #6366f1;">${safeCode}</strong> - ${safeDisc}
                        <div style="font-size: 0.72rem; color: var(--text-muted);">${safeContext} • Excluído em: ${new Date(item.deletedAt).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <button type="button" onclick="handleRestoreTrashLesson('${item.id}');" class="btn btn-outline btn-sm" style="color: #10b981; border-color: #10b981; font-weight: 700; font-size: 0.75rem;">
                        Restaurar Aula
                    </button>
                `;
                list.appendChild(row);
            });
        }

        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }

    function closeScheduleTrashModal() {
        const modal = document.getElementById('modal-schedule-trash');
        if (modal) {
            modal.style.display = 'none';
            modal.classList.add('hidden');
        }
    }

    function handleRestoreTrashLesson(lessonId) {
        const trash = getScheduleTrashDb();
        const item = trash.find(t => t.id === lessonId);
        if (!item) return;

        const allLessons = getScheduleLessonsDb();
        allLessons.push(item);
        saveScheduleLessonsDb(allLessons);

        const updatedTrash = trash.filter(t => t.id !== lessonId);
        saveScheduleTrashDb(updatedTrash);

        openScheduleTrashModal();
        renderActiveScheduleView();
        if (typeof window.showToast === 'function') {
            window.showToast('Aula restaurada para o cronograma com sucesso!', 'success');
        }
    }

    function handleEmptyScheduleTrash() {
        if (typeof confirm === 'function' && !confirm('Tem certeza de que deseja esvaziar permanentemente toda a lixeira?')) return;
        saveScheduleTrashDb([]);
        openScheduleTrashModal();
        if (typeof window.showToast === 'function') {
            window.showToast('Lixeira esvaziada com sucesso!', 'info');
        }
    }

    // =========================================================================
    // REAGENDAMENTO RÁPIDO & TOGGLE DE STATUS
    // =========================================================================

    function handleLessonDropToDate(lessonId, targetDateIso) {
        const allLessons = getScheduleLessonsDb();
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const oldDate = lesson.date;
        lesson.date = targetDateIso;
        saveScheduleLessonsDb(allLessons);
        renderActiveScheduleView();
        if (typeof window.showToast === 'function') {
            window.showToast(`Aula reagendada de ${oldDate.split('-').reverse().join('/')} para ${targetDateIso.split('-').reverse().join('/')}!`, 'success');
        }
    }

    function handleLessonDropToSlot(lessonId, targetDateIso, targetTime) {
        const allLessons = getScheduleLessonsDb();
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        lesson.date = targetDateIso;
        lesson.time = targetTime;
        saveScheduleLessonsDb(allLessons);
        renderActiveScheduleView();
        if (typeof window.showToast === 'function') {
            window.showToast(`Aula reagendada para ${targetDateIso.split('-').reverse().join('/')} às ${targetTime}!`, 'success');
        }
    }

    function toggleLessonWorkStatus(lessonId) {
        const allLessons = getScheduleLessonsDb();
        const lesson = allLessons.find(l => l.id === lessonId);
        if (!lesson) return;

        const isNowTrabalhada = lesson.status !== 'trabalhada';
        lesson.status = isNowTrabalhada ? 'trabalhada' : 'planejada';
        lesson.data_confirmacao = isNowTrabalhada ? new Date().toISOString() : null;

        saveScheduleLessonsDb(allLessons);

        const drawer = document.getElementById('drawer-day-expanded-overlay');
        if (drawer && drawer.style.display !== 'none') {
            openDayExpandedDrawer(lesson.date || lesson.data_planejada);
        }
        renderActiveScheduleView();

        if (typeof window.showToast === 'function') {
            window.showToast(`Status alterado para "${lesson.status.toUpperCase()}"${isNowTrabalhada ? ' (Confirmada em ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ')' : ''}!`, isNowTrabalhada ? 'success' : 'info');
        }
    }

    // =========================================================================
    // CALENDÁRIO 7 COLUNAS & CALENDÁRIO ANUAL
    // =========================================================================

    function initAnnualSkillsCalendar() {
        for (let m = 2; m <= 12; m++) {
            ANNUAL_SKILLS_CALENDAR_DATA[m] = {};
            const daysInMonth = (m === 2) ? 28 : ((m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31);

            for (let d = 1; d <= daysInMonth; d++) {
                const dateObj = new Date(2026, m - 1, d);
                const dayOfWeek = dateObj.getDay();

                if (dayOfWeek >= 1 && dayOfWeek <= 5 && m !== 7) {
                    const pool5 = DESCRIPTORS_POOL_5ANO[(d + m) % DESCRIPTORS_POOL_5ANO.length];
                    const pool2 = DESCRIPTORS_POOL_2ANO[(d + m) % DESCRIPTORS_POOL_2ANO.length];
                    const pool9 = DESCRIPTORS_POOL_9ANO[(d + m) % DESCRIPTORS_POOL_9ANO.length];

                    ANNUAL_SKILLS_CALENDAR_DATA[m][d] = {
                        day: d,
                        dayOfWeek,
                        month: m,
                        isLetivo: true,
                        skills: {
                            '5º Ano': { code: pool5.code, title: pool5.title, comp: pool5.comp, metod: pool5.metod, status: 'pendente', obs: '' },
                            '2º Ano': { code: pool2.code, title: pool2.title, comp: pool2.comp, metod: pool2.metod, status: 'pendente', obs: '' },
                            '9º Ano': { code: pool9.code, title: pool9.title, comp: pool9.comp, metod: pool9.metod, status: 'pendente', obs: '' }
                        }
                    };
                }
            }
        }
    }

    function render7ColCalendar() {
        const grid = document.getElementById('calendar-7col-cells-grid');
        const heading = document.getElementById('cal-month-year-heading');
        const dropdown = document.getElementById('cal-month-dropdown-select');
        const stage = document.getElementById('cal-filter-stage-v2')?.value || '5º Ano';

        if (!grid) return;

        if (heading) heading.textContent = `${MONTH_LABELS[calMonth] || 'Mês'} de ${calYear}`;
        if (dropdown) dropdown.value = String(calMonth);

        grid.innerHTML = '';

        const firstDate = new Date(calYear, calMonth - 1, 1);
        const startDayOfWeek = firstDate.getDay();
        const daysInCurrentMonth = new Date(calYear, calMonth, 0).getDate();
        const daysInPrevMonth = new Date(calYear, calMonth - 1, 0).getDate();

        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const prevDayNum = daysInPrevMonth - i;
            const cell = document.createElement('div');
            cell.className = 'cal-day-cell other-month';
            cell.innerHTML = `<div class="cal-day-number" style="color:var(--text-muted);">${prevDayNum}</div>`;
            grid.appendChild(cell);
        }

        for (let d = 1; d <= daysInCurrentMonth; d++) {
            const dateObj = new Date(calYear, calMonth - 1, d);
            const dayOfWeek = dateObj.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            const monthData = ANNUAL_SKILLS_CALENDAR_DATA[calMonth] || {};
            const dayData = monthData[d];
            const daySkill = dayData ? dayData.skills[stage] : null;

            const isWorked = daySkill && daySkill.status === 'trabalhada';
            const hasSkill = !!daySkill;

            const cell = document.createElement('div');
            cell.className = 'cal-day-cell';
            const isSelected = (d === selectedCalDay);

            let dotsHtml = '';
            if (hasSkill && !isWeekend && calMonth !== 7) {
                dotsHtml = `
                    <div class="cal-dots-container">
                        <span class="cal-dot ${isWorked ? 'worked' : 'pending'}" title="${daySkill.code} (${isWorked ? 'Trabalhada' : 'Pendente'})"></span>
                        <span class="cal-dot ${isWorked ? 'worked' : 'pending'}"></span>
                    </div>
                `;
            }

            cell.innerHTML = `
                <div class="flex-between" style="align-items: flex-start;">
                    <div class="cal-day-number ${isSelected ? 'active-today' : ''}">${d}</div>
                </div>
                ${dotsHtml}
            `;

            cell.addEventListener('click', () => {
                selectedCalDay = d;
                document.querySelectorAll('.cal-day-number').forEach(el => el.classList.remove('active-today'));
                cell.querySelector('.cal-day-number')?.classList.add('active-today');

                if (hasSkill) {
                    openCalendarDayDetailModal(d, stage);
                } else if (typeof window.showToast === 'function') {
                    window.showToast(`Dia ${d} de ${MONTH_LABELS[calMonth]}: Sem descritores planejados para este dia.`, 'calendar');
                }
            });

            grid.appendChild(cell);
        }

        const totalRendered = startDayOfWeek + daysInCurrentMonth;
        const totalCellsNeeded = totalRendered > 35 ? 42 : 35;
        const remaining = totalCellsNeeded - totalRendered;

        for (let nextD = 1; nextD <= remaining; nextD++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day-cell other-month';
            cell.innerHTML = `<div class="cal-day-number" style="color:var(--text-muted);">${nextD}</div>`;
            grid.appendChild(cell);
        }

        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    function setup7ColCalendarEvents() {
        const btnPrev = document.getElementById('btn-cal-prev-month');
        const btnNext = document.getElementById('btn-cal-next-month');
        const dropdown = document.getElementById('cal-month-dropdown-select');

        if (btnPrev) {
            btnPrev.addEventListener('click', () => {
                if (calMonth > 2) {
                    calMonth--;
                    render7ColCalendar();
                }
            });
        }

        if (btnNext) {
            btnNext.addEventListener('click', () => {
                if (calMonth < 12) {
                    calMonth++;
                    render7ColCalendar();
                }
            });
        }

        if (dropdown) {
            dropdown.addEventListener('change', (e) => {
                calMonth = parseInt(e.target.value, 10);
                render7ColCalendar();
            });
        }

        ['cal-filter-stage-v2', 'cal-filter-subject-v2', 'cal-filter-school-v2'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', render7ColCalendar);
        });

        document.getElementById('btn-cal-mark-month-done')?.addEventListener('click', () => {
            const stage = document.getElementById('cal-filter-stage-v2')?.value || '5º Ano';
            const monthData = ANNUAL_SKILLS_CALENDAR_DATA[calMonth] || {};
            Object.values(monthData).forEach(dayItem => {
                if (dayItem.skills[stage]) dayItem.skills[stage].status = 'trabalhada';
            });
            render7ColCalendar();
            if (typeof window.showToast === 'function') {
                window.showToast(`Todas as habilidades de ${MONTH_LABELS[calMonth]} foram marcadas como TRABALHADAS 🟢!`, 'check');
            }
        });

        document.getElementById('btn-cal-print-month')?.addEventListener('click', () => {
            window.print();
        });
    }

    function openCalendarDayDetailModal(dayNumber, stage) {
        const dayItem = ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth] && ANNUAL_SKILLS_CALENDAR_DATA[currentCalendarMonth][dayNumber];
        if (!dayItem || !dayItem.skills[stage]) return;

        activeCalendarDayItem = { dayNumber, stage, item: dayItem };
        const skill = dayItem.skills[stage];

        const modal = document.getElementById('modal-calendar-day-detail');
        const titleEl = document.getElementById('modal-cal-day-title');
        const metaEl = document.getElementById('modal-cal-day-meta');
        const descCodeEl = document.getElementById('modal-cal-desc-code');
        const descCompEl = document.getElementById('modal-cal-desc-component');
        const metodEl = document.getElementById('modal-cal-metodologia');
        const obsEl = document.getElementById('modal-cal-teacher-obs');
        const statusLabel = document.getElementById('modal-cal-status-label');
        const toggleBtn = document.getElementById('btn-modal-toggle-day-status');

        if (!modal) return;

        const monthName = MONTH_NAMES_PT[currentCalendarMonth] || 'Mês';
        if (titleEl) titleEl.textContent = `Planejamento do Dia ${dayNumber} de ${monthName} (${stage})`;
        if (metaEl) metaEl.textContent = `Ano Letivo 2026 • SEMED Gonçalves Dias • ${skill.comp}`;
        if (descCodeEl) descCodeEl.textContent = `${skill.code} — ${skill.title}`;
        if (descCompEl) descCompEl.textContent = `Componente: ${skill.comp} • Etapa: ${stage}`;
        if (metodEl) metodEl.textContent = skill.metod;
        if (obsEl) obsEl.value = skill.obs || '';

        const isWorked = skill.status === 'trabalhada';
        if (statusLabel) {
            statusLabel.innerHTML = isWorked ? '<strong style="color:#22c55e;">🟢 Trabalhada em Aula</strong>' : '<strong style="color:#ef4444;">🔴 Pendente / A Trabalhar</strong>';
        }
        if (toggleBtn) {
            toggleBtn.textContent = isWorked ? 'Desmarcar (Voltar para Pendente)' : 'Marcar como Trabalhada';
            toggleBtn.style.background = isWorked ? '#ef4444' : '#22c55e';
        }

        modal.classList.remove('hidden');
        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    // =========================================================================
    // CRONOGRAMA 40 SEMANAS (META IDEB)
    // =========================================================================

    function generateFull40WeeksSchedule(targetIdeb = 6.5) {
        const val = parseFloat(targetIdeb) || 6.5;
        const generated = [];

        const descriptorPool = [
            { etapa: '2º Ano', comp: 'Língua Portuguesa (Alfabetização)', desc: 'SEAMA D01', tit: 'Reconhecer letras do alfabeto e correspondência fonema-grafema', met: 'Alfabeto móvel, cantigas populares e identificação do nome próprio e dos colegas.' },
            { etapa: '2º Ano', comp: 'Língua Portuguesa (Fluência)', desc: 'SEAMA D02', tit: 'Ler palavras com sílabas canônicas e não canônicas com fluência', met: 'Cartões de leitura rápida, leitura compartilhada e contação de histórias.' },
            { etapa: '2º Ano', comp: 'Matemática (Contagem)', desc: 'SEAMA D03', tit: 'Contar e comparar quantidades de objetos em coleções até 100', met: 'Contagem de tampinhas, ábacos e resolução de desafios em duplas.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D01', tit: 'Localizar informações explícitas em textos narrativos e informativos', met: 'Sublinhado seletivo, caça ao tesouro textual e reescrita de trechos.' },
            { etapa: '5º Ano', comp: 'Matemática (Operações)', desc: 'SAEB D13', tit: 'Resolver problemas envolvendo adição e subtração com números naturais', met: 'Material dourado, situações-problema do cotidiano comercial e cálculo mental.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D03', tit: 'Inferir o sentido de uma palavra ou expressão a partir do contexto', met: 'Leitura de fábulas e crônicas com busca de pistas contextuais e sinônimos.' },
            { etapa: '5º Ano', comp: 'Matemática (Multiplicação/Divisão)', desc: 'SAEB D14', tit: 'Resolver problemas envolvendo multiplicação e divisão de números naturais', met: 'Jogos de tabuleiros, algoritmo usual e partilha de quantias.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D04', tit: 'Inferir uma informação implícita em texto narrativo ou informativo', met: 'Análise de charges, tirinhas e identificação de subentendidos e duplos sentidos.' },
            { etapa: '5º Ano', comp: 'Matemática (Espaço e Forma)', desc: 'SAEB D06', tit: 'Estimar e medir áreas de figuras desenhadas em malhas quadriculadas', met: 'Uso de geoplano, papel quadriculado e medição real do piso da sala.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D06', tit: 'Identificar o tema ou assunto central de um texto', met: 'Elaboração de títulos alternativos, mapas mentais e síntese de parografos.' },
            { etapa: '5º Ano', comp: 'Matemática (Grandezas e Medidas)', desc: 'SAEB D08', tit: 'Calcular o perímetro de figuras planas desenhadas em malhas', met: 'Contorno de figuras com barbante, medição com fita métrica e registro em tabela.' },
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D11', tit: 'Distinguir um fato da opinião relativa a esse fato', met: 'Debates regrados em sala com análise de notícias e cartas de leitores.' },
            { etapa: '5º Ano', comp: 'Matemática (Números Racionais)', desc: 'SAEB D20', tit: 'Resolver problemas com números decimais e sistema monetário brasileiro', met: 'Simulação de lojinha com cédulas didáticas e cálculo de troco.' },
            { etapa: '9º Ano', comp: 'Matemática (Espaço e Forma)', desc: 'SAEB D01', tit: 'Identificar a localização/movimentação de objeto no plano cartesiano', met: 'Batalha naval matemática, coordenadas geográficas e leitura de mapas.' },
            { etapa: '9º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D05', tit: 'Interpretar texto com auxílio de material gráfico diverso (propagandas/tabelas)', met: 'Leitura crítica de infográficos, anúncios publicitários e gráficos estatísticos.' },
            { etapa: '9º Ano', comp: 'Matemática (Álgebra)', desc: 'SAEB D16', tit: 'Identificar a localização de números inteiros na reta numérica', met: 'Reta numérica no chão da sala de aula com deslocamento dos alunos.' },
            { etapa: '9º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D07', tit: 'Identificar o conflito gerador do enredo e os elementos da narrativa', met: 'Estruturação do arco narrativo em contos de mistério e crônicas urbanas.' },
            { etapa: '9º Ano', comp: 'Matemática (Proporcionalidade)', desc: 'SAEB D19', tit: 'Resolver problemas envolvendo cálculo de porcentagem simples e comercial', met: 'Cálculo de descontos, juros simples e interpretação de índices socioeconômicos.' },
            { etapa: '9º Ano', comp: 'Língua Portuguesa (Coesão)', desc: 'SAEB D12', tit: 'Identificar o efeito de sentido decorrente da escolha de uma pontuação', met: 'Análise de poemas e contos dramáticos com substituição de pontuações.' },
            { etapa: '9º Ano', comp: 'Matemática (Estatística)', desc: 'SAEB D27', tit: 'Ler e interpretar dados apresentados em tabelas de dupla entrada e gráficos', met: 'Construção de gráficos de colunas e setores a partir de pesquisas escolares.' }
        ];

        for (let i = 1; i <= 40; i++) {
            if (i % 10 === 0) {
                const simNum = i / 10;
                generated.push({
                    id: `SCH_${i}`,
                    semana: `Semana ${i}`,
                    etapa: 'Todas as Etapas',
                    componente: 'Avaliação Diagnóstica Integrada',
                    descritor: `SIMULADO REDE ${simNum}`,
                    titulo: `${simNum}º Simulado Diagnóstico Geral de Rede (IDEB Meta ${val.toFixed(1)})`,
                    metodologia: 'Aplicação padrão SAEB/SEAMA, correção em tempo real por matriz de descritores e tabulação de dados.',
                    status: (i <= 10) ? 'cumprido' : (i === 20 ? 'andamento' : 'pendente'),
                    professor_obs: (i <= 10) ? 'Simulado aplicado em 100% das turmas com taxa de presença de 96%.' : 'Agendado conforme calendário letivo municipal.'
                });
            } else {
                const template = descriptorPool[(i - 1) % descriptorPool.length];
                let status = 'pendente';
                let obs = 'Programado para o ciclo letivo.';
                if (i <= 4) {
                    status = 'cumprido';
                    obs = 'Habilidade trabalhada com excelente engajamento e fixação pelos estudantes.';
                } else if (i <= 7) {
                    status = 'andamento';
                    obs = 'Em execução nas salas de aula com acompanhamento do coordenador pedagógico.';
                }

                generated.push({
                    id: `SCH_${i}`,
                    semana: `Semana ${i}`,
                    etapa: template.etapa,
                    componente: template.comp,
                    descritor: template.desc,
                    titulo: template.tit,
                    metodologia: template.met,
                    status: status,
                    professor_obs: obs
                });
            }
        }

        skillsScheduleList = generated;
        return skillsScheduleList;
    }

    function renderSkillsSchedule() {
        const container = document.getElementById('skills-schedule-container');
        if (!container) return;

        if (skillsScheduleList.length === 0) {
            const currentTargetIdeb = document.getElementById('target-ideb-input')?.value || 6.5;
            generateFull40WeeksSchedule(currentTargetIdeb);
        }

        const stageFilter = document.getElementById('schedule-filter-stage')?.value || 'all';
        const statusFilter = document.getElementById('schedule-filter-status')?.value || 'all';

        const filtered = skillsScheduleList.filter(item => {
            const matchStage = (stageFilter === 'all' || item.etapa === stageFilter || item.etapa === 'Todas as Etapas');
            const matchStatus = (statusFilter === 'all' || item.status === statusFilter);
            return matchStage && matchStatus;
        });

        const totalWeeks = skillsScheduleList.length;
        const completedWeeks = skillsScheduleList.filter(s => s.status === 'cumprido').length;
        const complianceRate = totalWeeks > 0 ? ((completedWeeks / totalWeeks) * 100).toFixed(1) : '0';

        const kpiWeeks = document.getElementById('schedule-kpi-weeks');
        const kpiCompliance = document.getElementById('schedule-kpi-compliance');
        const kpiCompletedSub = document.getElementById('schedule-kpi-completed-sub');
        const kpiSkills = document.getElementById('schedule-kpi-skills');
        const kpiTargetIdeb = document.getElementById('schedule-kpi-target-ideb');

        const currentTargetVal = document.getElementById('target-ideb-input')?.value || '6.5';
        if (kpiWeeks) kpiWeeks.textContent = `${totalWeeks} Semanas`;
        if (kpiCompliance) kpiCompliance.textContent = `${complianceRate}%`;
        if (kpiCompletedSub) kpiCompletedSub.textContent = `${completedWeeks} de ${totalWeeks} metas cumpridas`;
        if (kpiSkills) kpiSkills.textContent = '48 Descritores';
        if (kpiTargetIdeb) kpiTargetIdeb.textContent = `Meta ${currentTargetVal}`;

        container.innerHTML = '';

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--text-muted); background: var(--bg-secondary); border-radius: var(--radius-lg);">
                    <i data-lucide="calendar-x" style="width:36px; height:36px; opacity:0.4; margin-bottom:10px; display:inline-block;"></i>
                    <p style="margin:0; font-size:0.9rem;">Nenhuma semana cadastrada com esses filtros.</p>
                </div>
            `;
            if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
            return;
        }

        filtered.forEach(item => {
            let statusPillClass = 'status-pendente';
            let statusLabel = 'Pendente / Não Cumprido 🔴';
            if (item.status === 'cumprido') {
                statusPillClass = 'status-cumprido';
                statusLabel = 'Cumprido 🟢';
            } else if (item.status === 'andamento') {
                statusPillClass = 'status-andamento';
                statusLabel = 'Em Andamento 🟡';
            }

            const isMilestone = item.descritor.includes('SIMULADO');

            const card = document.createElement('div');
            card.className = 'schedule-week-card';
            if (isMilestone) {
                card.style.borderLeft = '4px solid var(--purple-light)';
                card.style.background = 'linear-gradient(135deg, rgba(147, 51, 234, 0.05) 0%, rgba(59, 130, 246, 0.03) 100%)';
            }

            card.innerHTML = `
                <div class="flex-between flex-wrap gap-md" style="margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; flex-wrap:wrap;">
                        <span style="font-size: 1.1rem; font-weight: 800; color: var(--purple-light);">${item.semana}</span>
                        <span class="badge ${isMilestone ? 'badge-warning' : 'badge-purple'}" style="font-size: 0.72rem;">${item.etapa}</span>
                        <span class="badge badge-outline" style="font-size: 0.72rem;">${item.descritor}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted);">${item.componente}</span>
                    </div>
                    <div>
                        <span class="schedule-status-pill ${statusPillClass}">${statusLabel}</span>
                    </div>
                </div>

                <h4 style="margin: 0 0 6px 0; font-size: 1.05rem; color: var(--text-primary);">${item.titulo}</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 10px 0;">
                    <strong>Metodologia Sugerida:</strong> ${item.metodologia}
                </p>

                ${item.professor_obs ? `
                    <div style="background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 8px 12px; font-size: 0.78rem; color: var(--text-primary); margin-bottom: 12px;">
                        <i data-lucide="message-square" style="width:13px; height:13px; color: var(--purple-light); display:inline-block; vertical-align:middle; margin-right:4px;"></i>
                        <strong>Registro Pedagógico:</strong> "${item.professor_obs}"
                    </div>
                ` : ''}

                <!-- Teacher Action Buttons -->
                <div class="flex-between flex-wrap gap-sm border-top" style="padding-top: 10px; margin-top: 8px;">
                    <span style="font-size: 0.75rem; color: var(--text-muted);">
                        <i data-lucide="user-check" style="width:13px; height:13px; display:inline-block; vertical-align:middle;"></i>
                        Acompanhamento Docente:
                    </span>
                    <div style="display: flex; gap: 8px; flex-wrap:wrap;">
                        <button class="btn btn-outline btn-sm set-schedule-status-btn" data-id="${item.id}" data-status="cumprido" style="color: #15803d; border-color: #bbf7d0;">
                            <i data-lucide="check" style="width:13px; height:13px;"></i> Cumprido
                        </button>
                        <button class="btn btn-outline btn-sm set-schedule-status-btn" data-id="${item.id}" data-status="andamento" style="color: #a16207; border-color: #fef08a;">
                            <i data-lucide="clock" style="width:13px; height:13px;"></i> Em Andamento
                        </button>
                        <button class="btn btn-outline btn-sm set-schedule-status-btn" data-id="${item.id}" data-status="pendente" style="color: #dc2626; border-color: #fca5a5;">
                            <i data-lucide="alert-circle" style="width:13px; height:13px;"></i> Justificar
                        </button>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        container.querySelectorAll('.set-schedule-status-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const newStatus = btn.getAttribute('data-status');
                const item = skillsScheduleList.find(s => s.id === id);

                if (item) {
                    if (newStatus === 'pendente') {
                        const just = prompt(`Informe a justificativa pedagógica para a "${item.semana}" (${item.descritor}):`, item.professor_obs || 'Conteúdo necessitou de replanejamento');
                        if (just) item.professor_obs = just;
                    } else if (newStatus === 'cumprido') {
                        const obs = prompt(`Adicionar anotação de consolidação para a "${item.semana}" (${item.descritor}):`, item.professor_obs || 'Habilidade trabalhada e consolidada com a turma.');
                        if (obs) item.professor_obs = obs;
                    }
                    item.status = newStatus;
                    renderSkillsSchedule();
                    if (typeof window.showToast === 'function') {
                        window.showToast(`Status da ${item.semana} atualizado para "${newStatus.toUpperCase()}"!`, 'check');
                    }
                }
            });
        });

        if (typeof window.safeCreateIcons === 'function') window.safeCreateIcons();
    }

    // Inicialização automática das matrizes anuais
    initAnnualSkillsCalendar();

    // =========================================================================
    // EXPOSIÇÃO GLOBAL NO OBJETO WINDOW
    // =========================================================================

    window.getScheduleLessonsDb = getScheduleLessonsDb;
    window.saveScheduleLessonsDb = saveScheduleLessonsDb;
    window.getScheduleTrashDb = getScheduleTrashDb;
    window.saveScheduleTrashDb = saveScheduleTrashDb;
    window.updateTrashBadgeCount = updateTrashBadgeCount;

    window.handleTurmaContextChange = handleTurmaContextChange;
    window.switchScheduleMainView = switchScheduleMainView;
    window.renderActiveScheduleView = renderActiveScheduleView;

    window.openNewSchedulePlanModal = openNewSchedulePlanModal;
    window.openSchedulePlannerDrawer = openNewSchedulePlanModal;
    window.closeNewSchedulePlanModal = closeNewSchedulePlanModal;

    window.setPlannerDateFromQuickButton = setPlannerDateFromQuickButton;
    window.handlePlannerDateChange = handlePlannerDateChange;
    window.handlePlannerSkillSearchInput = handlePlannerSkillSearchInput;
    window.selectPlannerSkillItem = selectPlannerSkillItem;
    window.removePlannerSelectedItem = removePlannerSelectedItem;
    window.renderPlannerSelectedBadges = renderPlannerSelectedBadges;
    window.handlePlannerTurmaChange = handlePlannerTurmaChange;
    window.handlePlannerSubjectChange = handlePlannerSubjectChange;
    window.checkPlannerRepetitionWarning = checkPlannerRepetitionWarning;
    window.handlePlannerRecurrenceToggle = handlePlannerRecurrenceToggle;
    window.updatePlannerRecurrencePreview = updatePlannerRecurrencePreview;
    window.handleSaveNewSchedulePlan = handleSaveNewSchedulePlan;

    window.renderScheduleMonthlyCalendar = renderScheduleMonthlyCalendar;
    window.renderScheduleWeeklyTimetable = renderScheduleWeeklyTimetable;
    window.renderScheduleComparisonView = renderScheduleComparisonView;

    window.openDayExpandedDrawer = openDayExpandedDrawer;
    window.closeDayExpandedDrawer = closeDayExpandedDrawer;
    window.openDetailedProgressModal = openDetailedProgressModal;
    window.closeDetailedProgressModal = closeDetailedProgressModal;
    window.handleScheduleSkillSearch = handleScheduleSkillSearch;

    window.openDuplicateLessonModal = openDuplicateLessonModal;
    window.closeDuplicateLessonModal = closeDuplicateLessonModal;
    window.handleConfirmDuplicateLesson = handleConfirmDuplicateLesson;

    window.handleDeleteLessonWithTrash = handleDeleteLessonWithTrash;
    window.openScheduleTrashModal = openScheduleTrashModal;
    window.closeScheduleTrashModal = closeScheduleTrashModal;
    window.handleRestoreTrashLesson = handleRestoreTrashLesson;
    window.handleEmptyScheduleTrash = handleEmptyScheduleTrash;

    window.handleLessonDropToDate = handleLessonDropToDate;
    window.handleLessonDropToSlot = handleLessonDropToSlot;
    // =========================================================================
    // CALENDÁRIO DIÁRIO E ROTINA ESCOLAR
    // =========================================================================

    function renderDailyCalendar() {
        const weekSelect = document.getElementById('calendar-week-select');
        const stageSelect = document.getElementById('calendar-stage-select');
        const cardsGrid = document.getElementById('calendar-daily-cards-grid');
        if (!cardsGrid) return;

        if (weekSelect && (!weekSelect.children || weekSelect.children.length === 0)) {
            for (let w = 1; w <= 40; w++) {
                const opt = document.createElement('option');
                opt.value = `Semana ${w}`;
                opt.textContent = `Semana ${w} (Letiva)`;
                if (w === 1) opt.selected = true;
                weekSelect.appendChild(opt);
            }
            weekSelect.addEventListener('change', renderDailyCalendar);
            if (stageSelect) stageSelect.addEventListener('change', renderDailyCalendar);
        }

        const selectedWeek = weekSelect ? weekSelect.value : 'Semana 1';
        const selectedStage = stageSelect ? stageSelect.value : '5º Ano';

        const weekItem = skillsScheduleList.find(s => s.semana === selectedWeek) || {
            descritor: 'Matemática • D13',
            titulo: 'Operações Fundamentais com Números Naturais'
        };

        const dailyPlan = [
            {
                dia: 'Segunda-feira',
                fase: 'Abertura & Sondagem',
                titulo: `Sondagem Prévia • ${weekItem.descritor}`,
                acao: 'Apresentação do descritor com 2 situações rápidas no quadro. Diagnóstico oral com a turma.',
                material: 'Quadro branco e fichas de sondagem rápida.',
                tag: 'Diagnóstico 🟢'
            },
            {
                dia: 'Terça-feira',
                fase: 'Conceito & Prática',
                titulo: 'Exploração com Material Concreto',
                acao: 'Trabalho em duplas com material estruturado (material dourado ou texto impresso guiado).',
                material: 'Caderno pedagógico e material manipulável.',
                tag: 'Prática Ativa 🔵'
            },
            {
                dia: 'Quarta-feira',
                fase: 'Contextualização',
                titulo: 'Situações-Problema do Cotidiano',
                acao: 'Resolução de problemas contextualizados com dados e histórias da realidade local de Gonçalves Dias.',
                material: 'Caderno do estudante SEMED.',
                tag: 'Aplicação 🟣'
            },
            {
                dia: 'Quinta-feira',
                fase: 'Aprofundamento',
                titulo: 'Desafio Rápido & Fixação',
                acao: 'Oficina de cálculo mental ou leitura dinâmica com correção dialogada entre os estudantes.',
                material: 'Folhas pautadas e cartões de resposta.',
                tag: 'Oficina 🟠'
            },
            {
                dia: 'Sexta-feira',
                fase: 'Checagem Formativa',
                titulo: 'Mini-Simulado Formativo (3 Itens)',
                acao: 'Aplicação individual de 3 itens padrão SAEB/SEAMA e registro do índice de acerto no sistema.',
                material: 'Folha de checagem formativa semanal.',
                tag: 'Checagem 🔴'
            }
        ];

        cardsGrid.innerHTML = '';
        dailyPlan.forEach(d => {
            const card = document.createElement('div');
            card.style.background = 'var(--bg-tertiary)';
            card.style.border = '1px solid var(--border-color)';
            card.style.borderRadius = 'var(--radius-md)';
            card.style.padding = '14px';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            card.innerHTML = `
                <div>
                    <div class="flex-between" style="margin-bottom: 6px;">
                        <span style="font-size: 0.8rem; font-weight: 700; color: var(--purple-light);">${d.dia}</span>
                        <span class="badge badge-outline" style="font-size: 0.65rem;">${d.tag}</span>
                    </div>
                    <h5 style="margin: 0 0 6px 0; font-size: 0.82rem; color: var(--text-primary);">${d.titulo}</h5>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 8px 0; line-height: 1.45;">
                        ${d.acao}
                    </p>
                </div>
                <div style="border-top: 1px solid var(--border-color); padding-top: 6px; font-size: 0.7rem; color: var(--text-muted);">
                    <strong>Recurso:</strong> ${d.material}
                </div>
            `;
            cardsGrid.appendChild(card);
        });
    }

    function renderSchoolRoutineMonitoring() {
        const tbody = document.getElementById('school-routine-monitoring-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        const schoolsMonitoring = [
            { nome: 'UI JOSE CORREA LIMA', diretor: 'Profª Maria da Conceição Lima', taxa: 94, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Rotina pedagógica executada conforme o cronograma oficial.', status: 'Regular 🟢' },
            { nome: 'UI EMILIO MURAD', diretor: 'Prof. Francisco Carlos Silva', taxa: 88, s2: 'cumprido', s5: 'andamento', s9: 'cumprido', obs: 'Acompanhamento do reforço de leitura no 5º ano.', status: 'Regular 🟢' },
            { nome: 'UE VEREADOR LEONARDO FERREIRA LIMA', diretor: 'Profª Antonia Ferreira Lima', taxa: 98, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Destaque no cumprimento das oficinas de cálculo mental.', status: 'Destaque ⭐' },
            { nome: 'U I BASILIO ALVES', diretor: 'Prof. José Basílio Alves', taxa: 82, s2: 'andamento', s5: 'andamento', s9: 'pendente', obs: 'Supervisão técnica SEMED agendada para apoio pedagógico.', status: 'Atenção 🟡' },
            { nome: 'UNIDADE INTEGRADA ALDENORA DE ARAÚJO CRUZ', diretor: 'Profª Aldenora Araújo Cruz', taxa: 96, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Turmas do 9º ano com 100% de adesão aos simulados.', status: 'Regular 🟢' },
            { nome: 'UE RAIMUNDO DOS REIS DA SILVA', diretor: 'Prof. Raimundo Nonato Reis', taxa: 86, s2: 'cumprido', s5: 'andamento', s9: 'cumprido', obs: 'Reforço no descritor SAEB D13 em execução.', status: 'Regular 🟢' },
            { nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', diretor: 'Prof. Raimundo José Dias', taxa: 92, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Frequência regular e checagem formativa registrada.', status: 'Regular 🟢' },
            { nome: 'UNIDADE ESCOLAR ANISIO GOMES', diretor: 'Profª Francisca Anísio Gomes', taxa: 90, s2: 'cumprido', s5: 'cumprido', s9: 'andamento', obs: 'Orientação concluída sobre o registro docente no sistema.', status: 'Regular 🟢' },
            { nome: 'UE ANITA FURTADO', diretor: 'Profª Ana Rita Anita Furtado', taxa: 97, s2: 'cumprido', s5: 'cumprido', s9: 'cumprido', obs: 'Oficinas de fluência leitora e matemática com alto engajamento.', status: 'Destaque ⭐' }
        ];

        schoolsMonitoring.forEach(sch => {
            const badge2 = sch.s2 === 'cumprido' ? '<span class="badge badge-success">OK 🟢</span>' : '<span class="badge badge-warning">Em Andamento 🟡</span>';
            const badge5 = sch.s5 === 'cumprido' ? '<span class="badge badge-success">OK 🟢</span>' : (sch.s5 === 'andamento' ? '<span class="badge badge-warning">Em Andamento 🟡</span>' : '<span class="badge badge-danger">Pendente 🔴</span>');
            const badge9 = sch.s9 === 'cumprido' ? '<span class="badge badge-success">OK 🟢</span>' : (sch.s9 === 'andamento' ? '<span class="badge badge-warning">Em Andamento 🟡</span>' : '<span class="badge badge-danger">Pendente 🔴</span>');

            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '44px';

            tr.innerHTML = `
                <td style="padding: 10px 14px; font-weight:600; color:var(--text-primary);">${sch.nome}</td>
                <td style="padding: 10px 14px; font-size:0.8rem; color:var(--text-secondary);">${sch.diretor}</td>
                <td style="padding: 10px 14px; text-align:center; font-family:var(--font-mono); font-weight:700; color:var(--purple-light);">${sch.taxa}%</td>
                <td style="padding: 10px 14px; text-align:center;">${badge2}</td>
                <td style="padding: 10px 14px; text-align:center;">${badge5}</td>
                <td style="padding: 10px 14px; text-align:center;">${badge9}</td>
                <td style="padding: 10px 14px; font-size:0.78rem; color:var(--text-secondary);">${sch.obs}</td>
                <td style="padding: 10px 14px; text-align:center; font-weight:600; font-size:0.78rem;">${sch.status}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.renderDailyCalendar = renderDailyCalendar;
    window.renderSchoolRoutineMonitoring = renderSchoolRoutineMonitoring;
    window.initAnnualSkillsCalendar = initAnnualSkillsCalendar;
    window.render7ColCalendar = render7ColCalendar;
    window.setup7ColCalendarEvents = setup7ColCalendarEvents;
    window.generateFull40WeeksSchedule = generateFull40WeeksSchedule;
    window.renderSkillsSchedule = renderSkillsSchedule;

})(window, document);

