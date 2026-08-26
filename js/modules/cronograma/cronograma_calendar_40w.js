/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (CALENDÁRIO 7 COLUNAS & 40 SEMANAS)
 * Arquivo: js/modules/cronograma/cronograma_calendar_40w.js
 * Descrição: Calendário 7 colunas, Cronograma 40 Semanas Meta IDEB,
 *            Rotina Diária e Monitoramento das Escolas Municipais.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    let currentCalendarMonth = 2;
    let calMonth = 8; // Agosto default
    let calYear = 2026;
    let selectedCalDay = 15;
    let activeCalendarDayItem = null;
    let skillsScheduleList = [];

    const MONTH_LABELS = {
        2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
        7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    };

    const MONTH_NAMES_PT = {
        2: 'Fevereiro', 3: 'Março', 4: 'Abril', 5: 'Maio', 6: 'Junho',
        7: 'Julho (Recesso Escolar)', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    };

    const ANNUAL_SKILLS_CALENDAR_DATA = {};

    // =========================================================================
    // CALENDÁRIO 7 COLUNAS & CALENDÁRIO ANUAL
    // =========================================================================

    function initAnnualSkillsCalendar() {
        const pool5 = window.CronogramaState?.DESCRIPTORS_POOL_5ANO || [];
        const pool2 = window.CronogramaState?.DESCRIPTORS_POOL_2ANO || [];
        const pool9 = window.CronogramaState?.DESCRIPTORS_POOL_9ANO || [];

        for (let m = 2; m <= 12; m++) {
            ANNUAL_SKILLS_CALENDAR_DATA[m] = {};
            const daysInMonth = (m === 2) ? 28 : ((m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31);

            for (let d = 1; d <= daysInMonth; d++) {
                const dateObj = new Date(2026, m - 1, d);
                const dayOfWeek = dateObj.getDay();

                if (dayOfWeek >= 1 && dayOfWeek <= 5 && m !== 7) {
                    const desc5 = pool5.length > 0 ? pool5[(d + m) % pool5.length] : { code: 'D01', title: 'Leitura', comp: 'Língua Portuguesa', metod: 'Prática' };
                    const desc2 = pool2.length > 0 ? pool2[(d + m) % pool2.length] : { code: 'D01', title: 'Alfabetização', comp: 'Língua Portuguesa', metod: 'Prática' };
                    const desc9 = pool9.length > 0 ? pool9[(d + m) % pool9.length] : { code: 'D01', title: 'Interpretação', comp: 'Língua Portuguesa', metod: 'Prática' };

                    ANNUAL_SKILLS_CALENDAR_DATA[m][d] = {
                        day: d,
                        dayOfWeek,
                        month: m,
                        isLetivo: true,
                        skills: {
                            '5º Ano': { code: desc5.code, title: desc5.title, comp: desc5.comp, metod: desc5.metod, status: 'pendente', obs: '' },
                            '2º Ano': { code: desc2.code, title: desc2.title, comp: desc2.comp, metod: desc2.metod, status: 'pendente', obs: '' },
                            '9º Ano': { code: desc9.code, title: desc9.title, comp: desc9.comp, metod: desc9.metod, status: 'pendente', obs: '' }
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
        const dayItem = ANNUAL_SKILLS_CALENDAR_DATA[calMonth] && ANNUAL_SKILLS_CALENDAR_DATA[calMonth][dayNumber];
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

        const monthName = MONTH_NAMES_PT[calMonth] || 'Mês';
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
            toggleBtn.onclick = () => {
                skill.status = isWorked ? 'pendente' : 'trabalhada';
                skill.obs = obsEl ? obsEl.value : '';
                render7ColCalendar();
                openCalendarDayDetailModal(dayNumber, stage);
            };
        }

        modal.style.display = 'flex';
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
            { etapa: '5º Ano', comp: 'Língua Portuguesa (Leitura)', desc: 'SAEB D06', tit: 'Identificar o tema ou assunto central de um texto', met: 'Elaboração de títulos alternativos, mapas mentais e síntese de parágrafos.' },
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

    // Inicialização automática das matrizes anuais
    initAnnualSkillsCalendar();

    // Exposição no Window
    window.renderDailyCalendar = renderDailyCalendar;
    window.renderSchoolRoutineMonitoring = renderSchoolRoutineMonitoring;
    window.initAnnualSkillsCalendar = initAnnualSkillsCalendar;
    window.render7ColCalendar = render7ColCalendar;
    window.setup7ColCalendarEvents = setup7ColCalendarEvents;
    window.generateFull40WeeksSchedule = generateFull40WeeksSchedule;
    window.renderSkillsSchedule = renderSkillsSchedule;
    window.openCalendarDayDetailModal = openCalendarDayDetailModal;

})(window, document);
