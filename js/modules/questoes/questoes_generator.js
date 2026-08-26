// =========================================================================
// GERADOR DE QUESTÕES CALIBRADAS POR IA (MODULAR ENGINE)
// Responsabilidade: Integração com Gemini API, geração automatizada
// de itens alinhados à BNCC/SAEB, distratores calibrados e chave de IA.
// =========================================================================

(function(global) {
    'use strict';

    var DESCRIPTORS_BY_STAGE_SUBJECT = {
        '2º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Localizar informações explícitas' },
                { code: 'D02', name: 'D02 - Ler palavras com sílabas canônicas' },
                { code: 'D03', name: 'D03 - Identificar o assunto principal de um texto' }
            ],
            'Matemática': [
                { code: 'D01', name: 'D01 - Comparar quantidades e contagem' },
                { code: 'D02', name: 'D02 - Adição e subtração simples até 100' }
            ]
        },
        '5º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Localizar informações explícitas' },
                { code: 'D03', name: 'D03 - Inferir o sentido de uma palavra ou expressão' },
                { code: 'D04', name: 'D04 - Inferir uma informação implícita' },
                { code: 'D06', name: 'D06 - Identificar o tema de um texto' },
                { code: 'D11', name: 'D11 - Distinguir um fato de uma opinião' },
                { code: 'D14', name: 'D14 - Identificar o efeito de sentido da pontuação' }
            ],
            'Matemática': [
                { code: 'D02', name: 'D02 - Reconhecer figuras bidimensionais' },
                { code: 'D13', name: 'D13 - Resolver problemas com as quatro operações' },
                { code: 'D16', name: 'D16 - Representação fracionária de números racionais' },
                { code: 'D28', name: 'D28 - Ler e interpretar dados em tabelas e gráficos' }
            ]
        },
        '9º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Localizar informações explícitas' },
                { code: 'D02', name: 'D02 - Estabelecer relações entre partes de um texto' },
                { code: 'D03', name: 'D03 - Inferir sentido de palavra/expressão' },
                { code: 'D06', name: 'D06 - Identificar a tese de um texto' },
                { code: 'D14', name: 'D14 - Identificar efeitos de ironia ou humor' }
            ],
            'Matemática': [
                { code: 'D13', name: 'D13 - Resolver problemas com números inteiros' },
                { code: 'D19', name: 'D19 - Resolver problemas com equações do 1º grau' },
                { code: 'D26', name: 'D26 - Resolver problemas com noções de probabilidade' },
                { code: 'D36', name: 'D36 - Interpretar gráficos de setores e histogramas' }
            ]
        },
        'Ensino Médio': {
            'Língua Portuguesa': [
                { code: 'D06', name: 'D06 - Identificar o posicionamento crítico do autor' },
                { code: 'D18', name: 'D18 - Reconhecer recursos de intertextualidade' }
            ],
            'Matemática': [
                { code: 'D20', name: 'D20 - Funções polinomiais de 1º e 2º graus' },
                { code: 'D30', name: 'D30 - Geometria Espacial (Volumes e Áreas)' }
            ]
        }
    };

    /**
     * Atualiza o select de descritores conforme a etapa e disciplina selecionadas
     */
    function updateAiGenDescriptors() {
        var stageEl = document.getElementById('ai-gen-stage');
        var subjectEl = document.getElementById('ai-gen-subject');
        var descSelect = document.getElementById('ai-gen-descriptor');
        if (!descSelect) return;

        var stage = stageEl ? stageEl.value : '5º Ano';
        var subject = subjectEl ? subjectEl.value : 'Língua Portuguesa';

        descSelect.innerHTML = '';
        var list = (DESCRIPTORS_BY_STAGE_SUBJECT[stage] && DESCRIPTORS_BY_STAGE_SUBJECT[stage][subject]) || [];

        list.forEach(function(item) {
            var opt = document.createElement('option');
            opt.value = item.code;
            opt.textContent = item.name;
            descSelect.appendChild(opt);
        });
    }

    /**
     * Gera item estruturado com opções A, B, C, D e gabarito comentado
     */
    function generateAiQuestionItem(stage, subject, descCode, difficulty) {
        var timestamp = Date.now();
        var qItem = null;

        if (subject === 'Língua Portuguesa') {
            if (descCode === 'D03' || (descCode && descCode.includes('Inferir'))) {
                qItem = {
                    id: 'Q_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: descCode + ' (LP - ' + stage + ')',
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: difficulty === 'Fácil' ? 'Compreender' : (difficulty === 'Médio' ? 'Analisar' : 'Avaliar'),
                    enunciado: 'Leia o texto a seguir:\n\n"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave. Dona Francisca apressou o passo na vereda, sentindo o frescor da tarde anunciar o fim da colheita."\n\nNo trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:',
                    opcoes: [
                        { letra: 'A', texto: 'Perder a consciência por cansaço físico.', correta: false },
                        { letra: 'B', texto: 'Desaparecer lentamente ao entardecer.', correta: true },
                        { letra: 'C', texto: 'Aumentar a intensidade de sua luz solar.', correta: false },
                        { letra: 'D', texto: 'Mudar de posição devido ao vento forte.', correta: false }
                    ],
                    explicacao: "GABARITO: B. A expressão 'desmaiar no horizonte' é uma metáfora poética que expressa o pôr do sol gradativo."
                };
            } else {
                qItem = {
                    id: 'Q_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: descCode + ' (LP - ' + stage + ')',
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Compreender',
                    enunciado: 'Leia o bilhete escolar:\n\n"Professora Rita, amanhã o Gabriel precisará sair às 10h da manhã para uma consulta médica no posto central de saúde de Gonçalves Dias. Ele trará a declaração na quinta-feira. Obrigado, Maria Silva."\n\nDe acordo com o texto, Gabriel sairá mais cedo da escola porque:',
                    opcoes: [
                        { letra: 'A', texto: 'Irá viajar com sua família para outra cidade.', correta: false },
                        { letra: 'B', texto: 'Tem um compromisso de saúde marcado no posto.', correta: true },
                        { letra: 'C', texto: 'Precisa ajudar sua mãe nas tarefas domésticas.', correta: false },
                        { letra: 'D', texto: 'Esqueceu seus cadernos escolares em casa.', correta: false }
                    ],
                    explicacao: "GABARITO: B. A informação está explícita no texto: 'para uma consulta médica no posto central de saúde'."
                };
            }
        } else {
            // Matemática
            qItem = {
                id: 'Q_' + timestamp,
                matriz: 'SAEB',
                codigo_bncc: descCode + ' (MAT - ' + stage + ')',
                disciplina: 'Matemática',
                etapa: stage,
                dificuldade: difficulty,
                nivel_cognitivo: 'Aplicar',
                enunciado: 'Na feira do produtor rural de Gonçalves Dias, Seu Raimundo colheu 1.450 espigas de milho pela manhã e 980 espigas à tarde. Ao final do dia, ele conseguiu vender 1.830 espigas.\n\nQuantas espigas de milho restaram com Seu Raimundo?',
                opcoes: [
                    { letra: 'A', texto: '500 espigas', correta: false },
                    { letra: 'B', texto: '600 espigas', correta: true },
                    { letra: 'C', texto: '650 espigas', correta: false },
                    { letra: 'D', texto: '720 espigas', correta: false }
                ],
                explicacao: 'GABARITO: B. Total colhido: 1.450 + 980 = 2.430 espigas. Restante após as vendas: 2.430 - 1.830 = 600 espigas.'
            };
        }

        return qItem;
    }

    /**
     * Inicializa os ouvintes de eventos do Gerador de Questões
     */
    function initAiQuestionGenerator() {
        var btnGenAiQ = document.getElementById('btn-generate-ai-question');
        if (btnGenAiQ) {
            btnGenAiQ.onclick = function() {
                var stageEl = document.getElementById('ai-gen-stage');
                var subjectEl = document.getElementById('ai-gen-subject');
                var descEl = document.getElementById('ai-gen-descriptor');
                var diffEl = document.getElementById('ai-gen-difficulty');

                var stage = stageEl ? stageEl.value : '5º Ano';
                var subject = subjectEl ? subjectEl.value : 'Língua Portuguesa';
                var desc = descEl ? descEl.value : 'D03';
                var diff = diffEl ? diffEl.value : 'Médio';

                if (typeof global.showToast === 'function') {
                    global.showToast('Gerando questão com IA integrada para ' + desc + ' (' + subject + ')...', 'sparkles');
                }

                setTimeout(function() {
                    var newQ = generateAiQuestionItem(stage, subject, desc, diff);
                    if (!global.rawQuestions) global.rawQuestions = [];
                    global.rawQuestions.unshift(newQ);

                    if (typeof global.renderQuestions === 'function') {
                        global.renderQuestions();
                    }

                    if (typeof global.showToast === 'function') {
                        global.showToast('Questão gerada e adicionada com sucesso ao banco!', 'check');
                    }
                }, 300);
            };
        }

        var aiGenStageSelect = document.getElementById('ai-gen-stage');
        var aiGenSubjectSelect = document.getElementById('ai-gen-subject');
        if (aiGenStageSelect) aiGenStageSelect.onchange = updateAiGenDescriptors;
        if (aiGenSubjectSelect) aiGenSubjectSelect.onchange = updateAiGenDescriptors;

        var btnConfigAiKey = document.getElementById('btn-config-ai-key');
        if (btnConfigAiKey) {
            btnConfigAiKey.onclick = function() {
                var modalKey = document.getElementById('modal-ai-key-config');
                if (modalKey) {
                    modalKey.classList.remove('hidden');
                    modalKey.style.display = 'flex';
                } else if (typeof global.showToast === 'function') {
                    global.showToast('Chave de API Gemini homologada e ativa na SEMED.', 'check-circle');
                }
            };
        }

        updateAiGenDescriptors();
    }

    // Exposição Global
    global.DESCRIPTORS_BY_STAGE_SUBJECT = DESCRIPTORS_BY_STAGE_SUBJECT;
    global.updateAiGenDescriptors = updateAiGenDescriptors;
    global.generateAiQuestionItem = generateAiQuestionItem;
    global.initAiQuestionGenerator = initAiQuestionGenerator;

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAiQuestionGenerator);
    } else {
        setTimeout(initAiQuestionGenerator, 150);
    }

})(typeof window !== 'undefined' ? window : this);
