// =========================================================================
// DASHBOARD DE RESULTADOS & MAPA DE CALOR (MODULAR ENGINE)
// Responsabilidade: Renderização de mapa de calor (Heatmap) por descritor,
// drawer de detalhes pedagógicos, faixas de proficiência SAEB e KPIs de adesão.
// =========================================================================

(function(global) {
    'use strict';

    var DESCRITORES_HEATMAP_SAMPLE = [
        { codigo: 'D01', disciplina: 'Língua Portuguesa', desc: 'Localizar informações explícitas em um texto.', taxa: 48.5, status: 'critico', tip: 'Práticas diárias de leitura exploratória com questões de busca direta.' },
        { codigo: 'D03', disciplina: 'Língua Portuguesa', desc: 'Inferir o sentido de uma palavra ou expressão.', taxa: 62.0, status: 'atencao', tip: 'Trabalho sistemático com vocabulário contextual e sinonímia.' },
        { codigo: 'D04', disciplina: 'Língua Portuguesa', desc: 'Inferir uma informação implícita em um texto.', taxa: 51.2, status: 'atencao', tip: 'Atividades de dedução e pistas textuais com crônicas e tirinhas.' },
        { codigo: 'D06', disciplina: 'Língua Portuguesa', desc: 'Identificar o tema de um texto.', taxa: 81.4, status: 'adequado', tip: 'Habilidade consolidada. Manter manutenção periódica.' },
        { codigo: 'D14', disciplina: 'Língua Portuguesa', desc: 'Identificar o efeito de sentido da pontuação.', taxa: 67.8, status: 'atencao', tip: 'Análise de entonação e expressividade em diálogos.' },
        { codigo: 'D13', disciplina: 'Matemática', desc: 'Resolver problemas com as quatro operações fundamentais.', taxa: 46.2, status: 'critico', tip: 'Oficinas práticas de cálculo mental e resolução de situações do cotidiano.' },
        { codigo: 'D16', disciplina: 'Matemática', desc: 'Identificar a representação fracionária.', taxa: 58.9, status: 'atencao', tip: 'Uso de materiais manipuláveis (barras de frações e pizzas didáticas).' },
        { codigo: 'D19', disciplina: 'Matemática', desc: 'Resolver problemas com equações do 1º grau.', taxa: 64.5, status: 'atencao', tip: 'Trabalho de equilíbrio em balanças virtuais e raciocínio algébrico.' },
        { codigo: 'D26', disciplina: 'Matemática', desc: 'Resolver problemas com noções de probabilidade.', taxa: 49.0, status: 'critico', tip: 'Experimentos práticos com dados, moedas e roletas.' },
        { codigo: 'D28', disciplina: 'Matemática', desc: 'Ler e interpretar dados em tabelas e gráficos.', taxa: 85.1, status: 'adequado', tip: 'Habilidade consolidada com excelente domínio pelos estudantes.' }
    ];

    /**
     * Renderiza a grade de calor de descritores
     */
    function renderHeatmapGrid() {
        var gridContainer = document.getElementById('dashboard-heatmap-grid');
        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        DESCRITORES_HEATMAP_SAMPLE.forEach(function(item) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'heatmap-cell-btn';
            btn.setAttribute('data-code', item.codigo);

            var bg = item.status === 'critico' ? 'rgba(239, 68, 68, 0.85)' : (item.status === 'atencao' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(16, 185, 129, 0.85)');

            btn.style.backgroundColor = bg;
            btn.style.color = '#ffffff';
            btn.style.border = 'none';
            btn.style.borderRadius = '6px';
            btn.style.padding = '10px 6px';
            btn.style.textAlign = 'center';
            btn.style.cursor = 'pointer';
            btn.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';

            btn.innerHTML = '<strong style="display:block; font-size:0.8rem; font-family:var(--font-mono);">' + item.codigo + '</strong><span style="font-size:0.7rem; font-weight:700;">' + item.taxa + '%</span>';

            btn.onclick = function() {
                openHeatmapDescriptorDetail(item);
            };

            gridContainer.appendChild(btn);
        });

        renderProficiencyDistribution();
    }

    /**
     * Abre a gaveta de detalhamento pedagógico do descritor clicado
     */
    function openHeatmapDescriptorDetail(item) {
        var drawer = document.getElementById('heatmap-descriptor-detail-card');
        if (!drawer) return;

        var codeEl = document.getElementById('detail-desc-code');
        var descEl = document.getElementById('detail-desc-desc');
        var tipEl = document.getElementById('detail-descriptor-pedagogic-tip');
        var ranksContainer = document.getElementById('detail-descriptor-school-ranks');

        if (codeEl) codeEl.textContent = item.codigo + ' • ' + item.disciplina;
        if (descEl) descEl.textContent = item.desc;
        if (tipEl) tipEl.textContent = item.tip;

        if (ranksContainer) {
            var escolas = [
                { nome: 'UI JOSE CORREA LIMA', taxa: (item.taxa + 6).toFixed(1) },
                { nome: 'UNIDADE INTEGRADA JOSE GONCALVES DIAS', taxa: (item.taxa + 3).toFixed(1) },
                { nome: 'U I BASILIO ALVES', taxa: item.taxa.toFixed(1) },
                { nome: 'UE ANITA FURTADO', taxa: (item.taxa - 4).toFixed(1) },
                { nome: 'UI EMILIO MURAD', taxa: (item.taxa - 7).toFixed(1) }
            ];

            ranksContainer.innerHTML = escolas.map(function(e) {
                return '<div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:var(--bg-tertiary); border-radius:4px; font-size:0.75rem;">' +
                    '<span style="color:var(--text-primary); font-weight:600;">' + e.nome + '</span>' +
                    '<strong style="color:var(--purple-light); font-family:var(--font-mono);">' + e.taxa + '%</strong>' +
                '</div>';
            }).join('');
        }

        drawer.classList.remove('hidden');
        drawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Fecha a gaveta de detalhamento do descritor
     */
    function closeHeatmapDescriptorDetail() {
        var drawer = document.getElementById('heatmap-descriptor-detail-card');
        if (drawer) drawer.classList.add('hidden');
    }

    /**
     * Atualiza as faixas de proficiência e indicadores de adesão
     */
    function renderProficiencyDistribution() {
        var adesaoVal = document.getElementById('results-adhesion-value');
        var adesaoSub = document.getElementById('results-adhesion-sub');
        var profVal = document.getElementById('results-proficiency-value');
        var targetVal = document.getElementById('results-target-value');

        if (adesaoVal) adesaoVal.textContent = '95.2%';
        if (adesaoSub) adesaoSub.textContent = '501 de 526 estudantes avaliados';
        if (profVal) profVal.textContent = '248.6';
        if (targetVal) targetVal.textContent = '260.0';
    }

    /**
     * Inicializa os ouvintes de eventos do Heatmap
     */
    function initEvaluationHeatmap() {
        var btnCloseDetail = document.getElementById('btn-close-descriptor-detail');
        if (btnCloseDetail) {
            btnCloseDetail.onclick = closeHeatmapDescriptorDetail;
        }

        renderHeatmapGrid();
    }

    // Exposição Global
    global.renderHeatmapGrid = renderHeatmapGrid;
    global.openHeatmapDescriptorDetail = openHeatmapDescriptorDetail;
    global.closeHeatmapDescriptorDetail = closeHeatmapDescriptorDetail;
    global.renderProficiencyDistribution = renderProficiencyDistribution;
    global.initEvaluationHeatmap = initEvaluationHeatmap;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initEvaluationHeatmap);
    } else {
        setTimeout(initEvaluationHeatmap, 140);
    }

})(typeof window !== 'undefined' ? window : this);
