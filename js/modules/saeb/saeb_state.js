/**
 * ============================================================================
 * GESTÃO EDUCACIONAL SAAS — MÓDULO SAEB (FONTE ÚNICA DA VERDADE & CÁLCULOS)
 * Arquivo: js/modules/saeb/saeb_state.js
 * Descrição: Motor centralizado de cálculo dos 6 patamares de proficiência SAEB (0 a 5),
 *            distribuição percentual cumulativa, médias e matrizes descritivas.
 * ============================================================================
 */

(function (global) {
    'use strict';

    var MIN_SAMPLE_REDE = 5;

    var SAEB_LEVELS_META = {
        0: { nivel: 0, label: 'Alerta / Crítico', min: 0.0, max: 39.9, cor: '#ef4444', classBadge: 'badge-danger' },
        1: { nivel: 1, label: 'Inicial', min: 40.0, max: 49.9, cor: '#f97316', classBadge: 'badge-warning' },
        2: { nivel: 2, label: 'Em Desenvolvimento', min: 50.0, max: 64.9, cor: '#eab308', classBadge: 'badge-warning' },
        3: { nivel: 3, label: 'Adequado', min: 65.0, max: 74.9, cor: '#0ea5e9', classBadge: 'badge-info' },
        4: { nivel: 4, label: 'Consolidado', min: 75.0, max: 84.9, cor: '#22c55e', classBadge: 'badge-success' },
        5: { nivel: 5, label: 'Avançado', min: 85.0, max: 100.0, cor: '#a855f7', classBadge: 'badge-purple' }
    };

    var MATRIZ_DESCRITIVA_NIVEIS = [
        {
            nivel: 0,
            titulo: 'Nível 0: Abaixo do Básico (&lt; 40%)',
            cor: '#ef4444',
            badge: 'Alerta Pedagógico',
            descricao: 'Estudantes com defasagens severas de alfabetização ou raciocínio lógico elementar. Dificuldade em reconhecer letras, decodificar palavras simples e realizar contagens básicas.',
            competencias: [
                'Leitura não fluente de palavras isoladas',
                'Dificuldade no reconhecimento do sistema de numeração decimal',
                'Necessita de intervenção diagnóstica e recomposição imediata'
            ]
        },
        {
            nivel: 1,
            titulo: 'Nível 1: Inicial (40% a 49.9%)',
            cor: '#f97316',
            badge: 'Inicial',
            descricao: 'Localiza informações explícitas diretas em textos narrativos curtos e resolve operações diretas de adição sem reserva com suporte visual.',
            competencias: [
                'Localização de personagem e tema explícito em texto curto',
                'Contagem e comparação de pequenas grandezas',
                'Resolução de problemas de uma única operação direta'
            ]
        },
        {
            nivel: 2,
            titulo: 'Nível 2: Em Desenvolvimento (50% a 64.9%)',
            cor: '#eab308',
            badge: 'Em Desenvolvimento',
            descricao: 'Infere o sentido de palavras pelo contexto, reconhece a finalidade de gêneros do cotidiano (receitas, bilhetes) e opera subtrações simples.',
            competencias: [
                'Inferência de sentidos literais em tirinhas e contos',
                'Associação de figuras geométricas planas elementares',
                'Leitura de tabelas simples de dupla entrada'
            ]
        },
        {
            nivel: 3,
            titulo: 'Nível 3: Padrão Adequado (65% a 74.9%)',
            cor: '#0ea5e9',
            badge: 'Adequado (Meta)',
            descricao: 'Demonstra domínio sólido das habilidades esperadas para o ciclo. Identifica relações de causa e efeito, ideia central e opera multiplicações com reserva.',
            competencias: [
                'Identificação de tese e argumentos principais',
                'Resolução de situações-problema do cotidiano com moedas e medidas',
                'Interpretação e integração de linguagem verbal e não-verbal'
            ]
        },
        {
            nivel: 4,
            titulo: 'Nível 4: Consolidado (75% a 84.9%)',
            cor: '#22c55e',
            badge: 'Consolidado',
            descricao: 'Diferencia fato de opinião, infere efeitos de humor e ironia, resolve divisões exatas e problemas com frações e porcentagens simples.',
            competencias: [
                'Distinção clara entre informação objetiva e julgamento de valor',
                'Cálculo de frações, áreas simples e proporções diretas',
                'Compreensão autônoma de múltiplos gêneros textuais'
            ]
        },
        {
            nivel: 5,
            titulo: 'Nível 5: Avançado (&ge; 85%)',
            cor: '#a855f7',
            badge: 'Avançado',
            descricao: 'Plena autonomia leitora e raciocínio matemático sofisticado. Estabelece relações complexas entre textos, resolve equações e analisa gráficos com múltiplas variáveis.',
            competencias: [
                'Análise crítica e comparação intertextual de temas divergentes',
                'Resolução de problemas complexos de probabilidade e proporcionalidade',
                'Capacidade de mentoria e liderança pedagógica entre pares'
            ]
        }
    ];

    /**
     * Converte percentual de acerto (0 a 100) para Nível SAEB (0 a 5)
     */
    function calcularNivelSaeb(percentual) {
        var pct = typeof percentual === 'number' ? percentual : parseFloat(percentual) || 0;
        if (pct >= 85.0) return 5;
        if (pct >= 75.0) return 4;
        if (pct >= 65.0) return 3;
        if (pct >= 50.0) return 2;
        if (pct >= 40.0) return 1;
        return 0;
    }

    /**
     * Processa estatísticas reais de distribuição e médias
     */
    function processarDistribuicaoSaeb(alunosAvaliacoes, limiarCorte) {
        var corte = typeof limiarCorte === 'number' ? limiarCorte : (parseFloat(limiarCorte) || 65);
        var total = alunosAvaliacoes.length;

        var contagemNiveis = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        var somaProficiencia = 0;
        var totalAcimaCorte = 0;

        var turmasMap = {};

        alunosAvaliacoes.forEach(function (aluno) {
            var pct = aluno.percentual || 0;
            var nivel = calcularNivelSaeb(pct);
            contagemNiveis[nivel]++;
            somaProficiencia += pct;

            if (pct >= corte) {
                totalAcimaCorte++;
            }

            var tId = aluno.turmaId || aluno.turmaNome || 'Turma Não Informada';
            if (!turmasMap[tId]) {
                turmasMap[tId] = {
                    turmaId: tId,
                    turmaNome: aluno.turmaNome || tId,
                    escolaNome: aluno.escolaNome || 'Escola',
                    total: 0,
                    niveis: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    somaPct: 0
                };
            }
            turmasMap[tId].total++;
            turmasMap[tId].niveis[nivel]++;
            turmasMap[tId].somaPct += pct;
        });

        var pctNiveis = {};
        for (var n = 0; n <= 5; n++) {
            pctNiveis[n] = total > 0 ? Math.round((contagemNiveis[n] / total) * 1000) / 10 : 0;
        }

        var proficienciaMedia = total > 0 ? Math.round((somaProficiencia / total) * 10) / 10 : 0;
        var pctAdequado = total > 0 ? Math.round((totalAcimaCorte / total) * 1000) / 10 : 0;

        var turmasLista = Object.values(turmasMap).map(function (t) {
            var mediaT = t.total > 0 ? Math.round((t.somaPct / t.total) * 10) / 10 : 0;
            var pctN = {};
            for (var i = 0; i <= 5; i++) {
                pctN[i] = t.total > 0 ? Math.round((t.niveis[i] / t.total) * 1000) / 10 : 0;
            }
            return {
                turmaId: t.turmaId,
                turmaNome: t.turmaNome,
                escolaNome: t.escolaNome,
                total: t.total,
                niveis: t.niveis,
                pctNiveis: pctN,
                media: mediaT
            };
        });

        return {
            totalAvaliados: total,
            contagemNiveis: contagemNiveis,
            pctNiveis: pctNiveis,
            proficienciaMedia: proficienciaMedia,
            pctAdequado: pctAdequado,
            limiarCorte: corte,
            turmasDistribuicao: turmasLista
        };
    }

    // Exposição Global
    global.MIN_SAMPLE_REDE_SAEB = MIN_SAMPLE_REDE;
    global.SAEB_LEVELS_META = SAEB_LEVELS_META;
    global.MATRIZ_DESCRITIVA_NIVEIS = MATRIZ_DESCRITIVA_NIVEIS;
    global.calcularNivelSaeb = calcularNivelSaeb;
    global.processarDistribuicaoSaeb = processarDistribuicaoSaeb;

})(typeof window !== 'undefined' ? window : this);
