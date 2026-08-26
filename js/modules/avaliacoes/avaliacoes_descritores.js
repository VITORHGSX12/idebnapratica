// =========================================================================
// BANCO DE HABILIDADES & NAVEGAÇÃO DE SUB-ABAS (MODULAR ENGINE)
// Responsabilidade: Cadastro e filtros do banco de descritores,
// listagem por componente curricular e alternância de sub-abas de avaliação.
// =========================================================================

(function(global) {
    'use strict';

    var activeDescriptors = [
        { codigo: 'D01', etapa: '5º Ano EF', desc: 'Localizar informações explícitas em um texto.', componente: 'Língua Portuguesa' },
        { codigo: 'D03', etapa: '5º Ano EF', desc: 'Inferir o sentido de uma palavra ou expressão.', componente: 'Língua Portuguesa' },
        { codigo: 'D04', etapa: '5º Ano EF', desc: 'Inferir uma informação implícita em um texto.', componente: 'Língua Portuguesa' },
        { codigo: 'D06', etapa: '5º Ano EF', desc: 'Identificar o tema de um texto.', componente: 'Língua Portuguesa' },
        { codigo: 'D14', etapa: '5º Ano EF', desc: 'Identificar o efeito de sentido decorrente do uso da pontuação.', componente: 'Língua Portuguesa' },
        { codigo: 'D13', etapa: '5º Ano EF', desc: 'Resolver problemas com números naturais envolvendo as quatro operações.', componente: 'Matemática' },
        { codigo: 'D16', etapa: '5º Ano EF', desc: 'Identificar a representação fracionária de números racionais.', componente: 'Matemática' },
        { codigo: 'D19', etapa: '9º Ano EF', desc: 'Resolver problemas que envolvam equações do 1º grau.', componente: 'Matemática' },
        { codigo: 'D26', etapa: '9º Ano EF', desc: 'Resolver problemas envolvendo noções de probabilidade.', componente: 'Matemática' },
        { codigo: 'D28', etapa: '9º Ano EF', desc: 'Ler e interpretar dados em tabelas e gráficos.', componente: 'Matemática' }
    ];

    /**
     * Renderiza a tabela de descritores cadastrados com filtro por disciplina
     */
    function renderActiveDescriptors(filterComponent) {
        if (!filterComponent) filterComponent = 'all';
        var tableBody = document.getElementById('active-descriptors-table-body');
        if (!tableBody) return;
        tableBody.innerHTML = '';

        var filtered = activeDescriptors.filter(function(d) {
            return filterComponent === 'all' || d.componente === filterComponent;
        });

        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align:center; color:var(--text-muted); font-size:0.8rem;">Nenhum descritor cadastrado para o filtro selecionado.</td></tr>';
            return;
        }

        filtered.forEach(function(d) {
            var tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border-color)';
            tr.style.height = '42px';

            tr.innerHTML = [
                '<td style="padding: 10px 16px; font-weight:600; color:var(--purple-light); font-family:var(--font-mono);">' + d.codigo + '</td>',
                '<td style="padding: 10px 16px; font-size:0.75rem; color:var(--text-secondary);">' + d.etapa + '</td>',
                '<td style="padding: 10px 16px; font-size:0.8rem; color:var(--text-primary);">' + d.desc + '</td>',
                '<td style="padding: 10px 16px; text-align:center;"><span style="font-size:0.7rem; color:var(--text-muted);">Padrão SAEB</span></td>'
            ].join('\n');

            tableBody.appendChild(tr);
        });

        if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();
    }

    /**
     * Inicializa os ouvintes de formulário, filtros e sub-abas
     */
    function initEvaluationDescriptors() {
        // 1. Alternância de Sub-Abas da Seção Criar Avaliações
        var subtabBtns = document.querySelectorAll('.eval-subtab-btn');
        var subtabContents = document.querySelectorAll('.eval-subtab-content');

        subtabBtns.forEach(function(btn) {
            btn.onclick = function() {
                subtabBtns.forEach(function(b) {
                    b.classList.remove('active');
                    b.style.color = 'var(--text-secondary)';
                    b.style.borderBottom = 'none';
                    b.style.fontWeight = '500';
                });
                btn.classList.add('active');
                btn.style.color = 'var(--purple-light)';
                btn.style.borderBottom = '2px solid var(--purple)';
                btn.style.fontWeight = '600';

                var target = btn.getAttribute('data-subtab');
                subtabContents.forEach(function(content) {
                    if (content.id === target) {
                        content.classList.remove('hidden');
                    } else {
                        content.classList.add('hidden');
                    }
                });

                if (target === 'lancar-notas-sub') {
                    if (typeof global.populateScoreEvalSelect === 'function') global.populateScoreEvalSelect();
                } else if (target === 'banco-habilidades-sub') {
                    renderActiveDescriptors();
                } else if (target === 'resultados-dash-sub') {
                    if (typeof global.renderHeatmapGrid === 'function') global.renderHeatmapGrid();
                }
            };
        });

        // 2. Filtros de Disciplina da Tabela de Descritores
        var descFilterBtns = document.querySelectorAll('.desc-filter-btn');
        descFilterBtns.forEach(function(btn) {
            btn.onclick = function() {
                descFilterBtns.forEach(function(b) {
                    b.className = 'btn btn-outline btn-sm desc-filter-btn';
                });
                btn.className = 'btn btn-primary btn-sm desc-filter-btn';
                var filter = btn.getAttribute('data-filter') || 'all';
                renderActiveDescriptors(filter);
            };
        });

        // 3. Formulário de Cadastro de Novo Descritor
        var formDescriptor = document.getElementById('form-create-descriptor');
        if (formDescriptor) {
            formDescriptor.onsubmit = function(e) {
                e.preventDefault();
                var codeEl = document.getElementById('desc-code');
                var stageEl = document.getElementById('desc-stage');
                var textEl = document.getElementById('desc-text');

                var code = codeEl ? codeEl.value.trim().toUpperCase() : '';
                var stage = stageEl ? stageEl.value : '5º Ano EF';
                var text = textEl ? textEl.value.trim() : '';

                if (!code || !text) return;

                var comp = code.startsWith('LP') ? 'Língua Portuguesa' : 'Matemática';

                activeDescriptors.unshift({
                    codigo: code,
                    etapa: stage,
                    desc: text,
                    componente: comp
                });

                if (typeof global.showToast === 'function') {
                    global.showToast('Descritor "' + code + '" cadastrado com sucesso!', 'check-circle');
                }

                formDescriptor.reset();
                renderActiveDescriptors();
            };
        }

        renderActiveDescriptors();
    }

    // Exposição Global
    global.renderActiveDescriptors = renderActiveDescriptors;
    global.initEvaluationDescriptors = initEvaluationDescriptors;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEvaluationDescriptors);
    } else {
        setTimeout(initEvaluationDescriptors, 160);
    }

})(typeof window !== 'undefined' ? window : this);
