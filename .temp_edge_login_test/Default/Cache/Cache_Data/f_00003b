/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — TOUR GUIADO DE ONBOARDING (SPOTLIGHT EM 12 ETAPAS)
 * Arquivo: js/modules/onboarding/onboarding_tour.js
 * Descrição: Sistema de onboarding sequencial leve, não invasivo e opcional.
 *            Apresenta as 12 etapas principais do sistema com spotlight,
 *            card de boas-vindas inicial, persistência e ajuda contextual.
 * ============================================================================
 */

(function(global) {
    'use strict';

    // 1. CATÁLOGO DAS 12 ETAPAS DO TOUR GUIADO
    var ONBOARDING_STEPS = [
        {
            id: 'step-dashboard',
            tabId: 'dashboard',
            targetSelector: '#tab-dashboard, #dashboard',
            title: '1. Painel Executivo & Indicadores',
            text: 'Acompanhe em tempo real as metas do IDEB, proficiência do SAEB/SEAMA e a adesão aos simulados da rede.',
            placement: 'bottom'
        },
        {
            id: 'step-calculo-ideb',
            tabId: 'calculo-ideb',
            targetSelector: 'a[data-target="calculo-ideb"], #calculo-ideb',
            title: '2. Cálculo do IDEB & Simulador VAAR',
            text: 'Explore a metodologia oficial do INEP (N × P), os indicadores do VAAR/FUNDEB e teste simulações interativas.',
            placement: 'right'
        },
        {
            id: 'step-escolas',
            tabId: 'escolas-panel',
            targetSelector: 'a[data-target="escolas-panel"], #escolas-panel',
            title: '3. Gestão de Escolas',
            text: 'Consulte o panorama completo das unidades de ensino, turmas, estatísticas de infraestrutura e proficiência.',
            placement: 'right'
        },
        {
            id: 'step-alunos',
            tabId: 'alunos-panel',
            targetSelector: 'a[data-target="alunos-panel"], #alunos-panel',
            title: '4. Alunos & Fichas Cadastrais',
            text: 'Acesse o cadastro individual dos estudantes, histórico de desempenho, contato e necessidades de acessibilidade.',
            placement: 'right'
        },
        {
            id: 'step-metas',
            tabId: 'metas-ideb',
            targetSelector: 'a[data-target="metas-ideb"], #metas-ideb',
            title: '5. Metas & Planos PDE',
            text: 'Defina metas pactuadas e crie planos de ação pedagógicos direcionados para escolas com desvios de aprendizagem.',
            placement: 'right'
        },
        {
            id: 'step-regional',
            tabId: 'ideb-comparativo',
            targetSelector: 'a[data-target="ideb-comparativo"], #ideb-comparativo',
            title: '6. Comparativo Regional (INEP)',
            text: 'Analise séries históricas oficiais de 2015 a 2025, compare seu município com as 19 UREs e o ranking estadual.',
            placement: 'right'
        },
        {
            id: 'step-matrizes',
            tabId: 'matriz-descritores',
            targetSelector: 'a[data-target="matriz-descritores"], #matriz-descritores',
            title: '7. Matrizes de Referência & BNCC',
            text: 'Consulte descritores cognitivos de Língua Portuguesa e Matemática do SAEB e o catálogo de habilidades da BNCC.',
            placement: 'right'
        },
        {
            id: 'step-cronograma',
            tabId: 'cronograma-habilidades',
            targetSelector: 'a[data-target="cronograma-habilidades"], #cronograma-habilidades',
            title: '8. Cronograma Pedagógico',
            text: 'Planeje a distribuição de habilidades ao longo dos 4 bimestres letivos com sugestões de planos de aula.',
            placement: 'right'
        },
        {
            id: 'step-avaliacoes',
            tabId: 'criar-avaliacoes',
            targetSelector: 'a[data-target="criar-avaliacoes"], #criar-avaliacoes',
            title: '9. Criação de Simulados & Provas',
            text: 'Utilize o assistente de 3 passos para montar provas balanceadas por descritores e gerar cadernos em PDF.',
            placement: 'right'
        },
        {
            id: 'step-aplicacao',
            tabId: 'aplicacao-provas',
            targetSelector: 'a[data-target="aplicacao-provas"], #aplicacao-provas',
            title: '10. Aplicação & Lançamento de Notas',
            text: 'Registre a presença dos alunos no dia do simulado, lance gabaritos e acompanhe a taxa de participação do SAEB.',
            placement: 'right'
        },
        {
            id: 'step-ai',
            tabId: 'ai-playground',
            targetSelector: 'a[data-target="ai-playground"], #ai-playground',
            title: '11. Assistente Pedagógico IA',
            text: 'Gere questões inéditas com gabarito comentado e planos de intervenção personalizados com inteligência artificial.',
            placement: 'right'
        },
        {
            id: 'step-ajuda',
            tabId: 'dashboard',
            targetSelector: '#header-help-tour-btn, .user-profile-widget, #user-profile-btn',
            title: '12. Ajuda, Perfil & Suporte',
            text: 'Acesse a qualquer momento este tour pelo botão de ajuda (?), alterne o modo escuro ou consulte relatórios técnicos.',
            placement: 'bottom'
        }
    ];

    var currentStepIndex = 0;
    var isTourActive = false;

    // 2. PERSISTÊNCIA DE STATUS POR USUÁRIO
    function getStorageKey(userEmail) {
        var email = userEmail || (global.sessionStorage ? global.sessionStorage.getItem('userEmail') : '') || (global.localStorage ? global.localStorage.getItem('userEmail') : '') || 'default';
        return 'onboarding_completed_' + email.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    function isTourCompleted(userEmail) {
        try {
            var key = getStorageKey(userEmail);
            if (global.localStorage && global.localStorage.getItem(key) === 'true') return true;
            if (global.localStorage && global.localStorage.getItem('onboarding_completed_global') === 'true') return true;
        } catch(e) {}
        return false;
    }

    function markTourCompleted(userEmail) {
        try {
            var key = getStorageKey(userEmail);
            if (global.localStorage) {
                global.localStorage.setItem(key, 'true');
                global.localStorage.setItem('onboarding_completed_global', 'true');
            }
            if (global.sessionStorage) {
                global.sessionStorage.setItem(key, 'true');
            }
        } catch(e) {}
    }

    // 3. CRIAÇÃO OU OBTENÇÃO DOS ELEMENTOS DO TOUR NO DOM
    function ensureTourDOMElements() {
        if (typeof document === 'undefined') return {};

        // Backdrop / Overlay
        var backdrop = document.getElementById('onboarding-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'onboarding-backdrop';
            backdrop.className = 'onboarding-backdrop hidden';
            backdrop.onclick = function(e) {
                if (e.target === backdrop) {
                    closeOnboardingTour(true);
                }
            };
            document.body.appendChild(backdrop);
        }

        // Spotlight Box
        var spotlight = document.getElementById('onboarding-spotlight-box');
        if (!spotlight) {
            spotlight = document.createElement('div');
            spotlight.id = 'onboarding-spotlight-box';
            spotlight.className = 'onboarding-spotlight-box hidden';
            document.body.appendChild(spotlight);
        }

        // Tooltip Card
        var card = document.getElementById('onboarding-tooltip-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'onboarding-tooltip-card';
            card.className = 'onboarding-tooltip-card hidden';
            document.body.appendChild(card);
        }

        return { backdrop: backdrop, spotlight: spotlight, card: card };
    }

    // 4. CARD DE BOAS-VINDAS INICIAL
    function showWelcomeOnboardingCard() {
        if (typeof document === 'undefined') return;

        // Remover modal anterior se existir
        var existing = document.getElementById('onboarding-welcome-modal');
        if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

        var modal = document.createElement('div');
        modal.id = 'onboarding-welcome-modal';
        modal.className = 'onboarding-welcome-modal-wrapper';
        modal.innerHTML = `
            <div class="onboarding-welcome-card" style="background: var(--bg-secondary, #ffffff); color: var(--text-primary, #0f172a); border: 1px solid var(--border-color, #e2e8f0); border-radius: 16px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3); max-width: 440px; width: 90%; padding: 26px 28px; position: relative; animation: tourFadeIn 0.3s ease-out;">
                <button type="button" onclick="window.closeWelcomeOnboardingCard(true)" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; font-size: 1.25rem; line-height: 1; color: var(--text-muted, #94a3b8); cursor: pointer; padding: 4px;" title="Pular Tour">
                    ✕
                </button>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
                    <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #1A2D42 0%, #4A7FA7 100%); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 1.3rem;">
                        ✨
                    </div>
                    <div>
                        <h3 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-primary, #0f172a);">Bem-vindo ao IDEB na Prática!</h3>
                        <p style="margin: 2px 0 0 0; font-size: 0.78rem; color: var(--text-muted, #64748b);">Plataforma de Gestão Educacional e Metas</p>
                    </div>
                </div>
                <p style="font-size: 0.86rem; color: var(--text-secondary, #334155); margin: 0 0 20px 0; line-height: 1.5;">
                    Gostaria de fazer um tour rápido de 12 etapas para conhecer as principais ferramentas e recursos do sistema?
                </p>
                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px;">
                    <button type="button" onclick="window.closeWelcomeOnboardingCard(true)" class="btn btn-outline" style="padding: 8px 16px; font-size: 0.82rem; font-weight: 600; border-radius: 8px; cursor: pointer; border: 1px solid var(--border-color, #cbd5e1); background: transparent; color: var(--text-secondary, #475569);">
                        Pular Tour
                    </button>
                    <button type="button" onclick="window.startOnboardingFromWelcome()" class="btn btn-primary" style="padding: 8px 18px; font-size: 0.82rem; font-weight: 700; border-radius: 8px; cursor: pointer; background: #1A2D42; color: #ffffff; border: none; box-shadow: 0 2px 6px rgba(26,45,66,0.25);">
                        Iniciar Tour ➔
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    function closeWelcomeOnboardingCard(markCompleted) {
        var modal = document.getElementById('onboarding-welcome-modal');
        if (modal && modal.parentNode) modal.parentNode.removeChild(modal);
        if (markCompleted) markTourCompleted();
    }

    function startOnboardingFromWelcome() {
        closeWelcomeOnboardingCard(false);
        startOnboardingTour(0);
    }

    // 5. RENDERIZAÇÃO DE UMA ETAPA ESPECÍFICA (SPOTLIGHT + TOOLTIP)
    function renderStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= ONBOARDING_STEPS.length) {
            closeOnboardingTour(true);
            return;
        }

        currentStepIndex = stepIndex;
        var step = ONBOARDING_STEPS[stepIndex];
        var dom = ensureTourDOMElements();

        // 1. Trocar de aba se necessário
        if (step.tabId && typeof global.switchTab === 'function') {
            global.switchTab(step.tabId);
        }

        // 2. Localizar elemento-alvo
        setTimeout(function() {
            var targetEl = null;
            var selectors = step.targetSelector.split(',');
            for (var i = 0; i < selectors.length; i++) {
                var el = document.querySelector(selectors[i].trim());
                if (el && el.offsetParent !== null) { // se está visível
                    targetEl = el;
                    break;
                }
            }

            if (!targetEl) {
                // Fallback para elemento geral da aba se o específico não for encontrado
                targetEl = document.querySelector('.main-content') || document.body;
            }

            // Scroll suave até o elemento se necessário
            try {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            } catch(e) {}

            var rect = targetEl.getBoundingClientRect();

            // 3. Atualizar Spotlight
            if (dom.spotlight) {
                dom.spotlight.classList.remove('hidden');
                dom.spotlight.style.top = (rect.top - 6) + 'px';
                dom.spotlight.style.left = (rect.left - 6) + 'px';
                dom.spotlight.style.width = (rect.width + 12) + 'px';
                dom.spotlight.style.height = (rect.height + 12) + 'px';
            }

            if (dom.backdrop) {
                dom.backdrop.classList.remove('hidden');
            }

            // 4. Renderizar Conteúdo do Card Tooltip
            var total = ONBOARDING_STEPS.length;
            var isFirst = (stepIndex === 0);
            var isLast = (stepIndex === total - 1);
            var progressPct = Math.round(((stepIndex + 1) / total) * 100);

            if (dom.card) {
                dom.card.classList.remove('hidden');
                dom.card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; color: var(--color-brand-primary, #4A7FA7); letter-spacing: 0.5px;">
                            Passo ${stepIndex + 1} de ${total}
                        </span>
                        <button type="button" onclick="window.closeOnboardingTour(true)" style="background: transparent; border: none; font-size: 1rem; color: var(--text-muted, #94a3b8); cursor: pointer; padding: 2px;" title="Fechar Tour">
                            ✕
                        </button>
                    </div>

                    <!-- Barra fina de progresso -->
                    <div style="width: 100%; height: 3px; background: var(--border-color, #e2e8f0); border-radius: 2px; margin-bottom: 12px; overflow: hidden;">
                        <div style="width: ${progressPct}%; height: 100%; background: #4A7FA7; transition: width 0.3s ease;"></div>
                    </div>

                    <h4 style="margin: 0 0 6px 0; font-size: 0.98rem; font-weight: 800; color: var(--text-primary, #0f172a);">
                        ${step.title}
                    </h4>
                    <p style="margin: 0 0 16px 0; font-size: 0.82rem; color: var(--text-secondary, #475569); line-height: 1.45;">
                        ${step.text}
                    </p>

                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            ${!isFirst ? `
                                <button type="button" onclick="window.prevOnboardingStep()" class="btn btn-outline" style="padding: 5px 12px; font-size: 0.76rem; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color, #cbd5e1); background: transparent; color: var(--text-secondary, #475569);">
                                    ◀ Voltar
                                </button>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" onclick="window.nextOnboardingStep()" class="btn btn-primary" style="padding: 6px 14px; font-size: 0.78rem; font-weight: 700; border-radius: 6px; cursor: pointer; background: #1A2D42; color: #ffffff; border: none;">
                                ${isLast ? 'Concluir ✓' : 'Próximo ➔'}
                            </button>
                        </div>
                    </div>
                `;

                // Posicionamento inteligente do Tooltip
                var cardWidth = 340;
                var cardHeight = 180;
                var top = rect.bottom + 14;
                var left = rect.left;

                // Ajuste se estiver próximo da borda direita da tela
                if (left + cardWidth > window.innerWidth - 20) {
                    left = window.innerWidth - cardWidth - 20;
                }
                if (left < 20) left = 20;

                // Ajuste se estiver próximo da borda inferior da tela
                if (top + cardHeight > window.innerHeight - 20) {
                    top = rect.top - cardHeight - 14;
                }
                if (top < 20) top = 20;

                dom.card.style.top = top + 'px';
                dom.card.style.left = left + 'px';
            }
        }, 120);
    }

    // 6. CONTROLADORES DE NAVEGAÇÃO
    function startOnboardingTour(stepIndexOrTabId) {
        isTourActive = true;
        var startIdx = 0;

        if (typeof stepIndexOrTabId === 'number') {
            startIdx = Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, stepIndexOrTabId));
        } else if (typeof stepIndexOrTabId === 'string') {
            // Mapear por tabId
            for (var i = 0; i < ONBOARDING_STEPS.length; i++) {
                if (ONBOARDING_STEPS[i].tabId === stepIndexOrTabId) {
                    startIdx = i;
                    break;
                }
            }
        }

        renderStep(startIdx);
    }

    function nextOnboardingStep() {
        if (!isTourActive) return;
        if (currentStepIndex >= ONBOARDING_STEPS.length - 1) {
            closeOnboardingTour(true);
            if (typeof global.showToast === 'function') {
                global.showToast('Parabéns! Tour concluído com sucesso.', 'check');
            }
        } else {
            renderStep(currentStepIndex + 1);
        }
    }

    function prevOnboardingStep() {
        if (!isTourActive || currentStepIndex <= 0) return;
        renderStep(currentStepIndex - 1);
    }

    function closeOnboardingTour(markCompleted) {
        isTourActive = false;
        var dom = ensureTourDOMElements();
        if (dom.backdrop) dom.backdrop.classList.add('hidden');
        if (dom.spotlight) dom.spotlight.classList.add('hidden');
        if (dom.card) dom.card.classList.add('hidden');

        if (markCompleted) {
            markTourCompleted();
        }
    }

    // 7. GATILHO AUTOMÁTICO APÓS PRIMEIRO LOGIN
    function checkAndTriggerOnboarding() {
        if (!isTourCompleted()) {
            setTimeout(function() {
                showWelcomeOnboardingCard();
            }, 600);
        }
    }

    // 8. EXPOSIÇÃO GLOBAL
    global.ONBOARDING_STEPS = ONBOARDING_STEPS;
    global.isTourCompleted = isTourCompleted;
    global.markTourCompleted = markTourCompleted;
    global.showWelcomeOnboardingCard = showWelcomeOnboardingCard;
    global.closeWelcomeOnboardingCard = closeWelcomeOnboardingCard;
    global.startOnboardingFromWelcome = startOnboardingFromWelcome;
    global.startOnboardingTour = startOnboardingTour;
    global.nextOnboardingStep = nextOnboardingStep;
    global.prevOnboardingStep = prevOnboardingStep;
    global.closeOnboardingTour = closeOnboardingTour;
    global.checkAndTriggerOnboarding = checkAndTriggerOnboarding;

})(typeof window !== 'undefined' ? window : global);
