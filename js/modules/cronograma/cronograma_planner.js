/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO CRONOGRAMA (PLANNER & AUTOCOMPLETE)
 * Arquivo: js/modules/cronograma/cronograma_planner.js
 * Descrição: Planejador de Habilidades, Autocomplete Dual BNCC/SAEB,
 *            prevenção de repetição em 30 dias e recorrência semanal.
 * ============================================================================
 */

(function (window, document) {
    'use strict';

    let plannerSelectedItems = [];
    let plannerEditingPlanId = null;

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

        const currentTurma = document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        if (turmaSelect) {
            turmaSelect.value = currentTurma;
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
            const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
            const existing = allLessons.find(l => l.id === existingPlanId);
            if (existing) {
                if (titleEl) titleEl.textContent = '✏️ Editar Planejamento de Habilidades';
                if (planIdInput) planIdInput.value = existing.id;
                if (turmaSelect) turmaSelect.value = existing.turmaContext || currentTurma;
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
                <button type="button" onclick="if(window.setPlannerDateFromQuickButton) window.setPlannerDateFromQuickButton('${iso}');" 
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

        const currentTurma = document.getElementById('planner-modal-turma')?.value || document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
        const chosenDate = document.getElementById('planner-modal-date')?.value || '2026-08-19';

        if (plannerSelectedItems.length === 0) {
            warningBox.style.display = 'none';
            return;
        }

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];
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
        const turmaContext = document.getElementById('planner-modal-turma')?.value || document.getElementById('cal-filter-turma-context')?.value || 'UI JOSE CORREA LIMA — 2º Ano A';
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

        const allLessons = typeof window.getScheduleLessonsDb === 'function' ? window.getScheduleLessonsDb() : [];

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

        if (typeof window.saveScheduleLessonsDb === 'function') {
            window.saveScheduleLessonsDb(allLessons);
        }
        closeNewSchedulePlanModal();
        if (typeof window.renderActiveScheduleView === 'function') {
            window.renderActiveScheduleView();
        }

        if (typeof window.showToast === 'function') {
            window.showToast(`✅ Planejamento (${primaryCode}) salvo no cronograma com sucesso!`, 'success');
        }
    }

    // Exposição no Window
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

})(window, document);
