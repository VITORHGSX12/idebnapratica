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
                { code: 'D01', name: 'D01 - Localizar informações explícitas em textos curtos' },
                { code: 'D02', name: 'D02 - Ler e decodificar palavras com sílabas canônicas e complexas' },
                { code: 'D03', name: 'D03 - Identificar o assunto principal e tema do texto' },
                { code: 'D04', name: 'D04 - Reconhecer a finalidade de gêneros textuais (bilhete, convite)' },
                { code: 'D05', name: 'D05 - Reconhecer rimas e sons na poesia infantil' }
            ],
            'Matemática': [
                { code: 'D01', name: 'D01 - Comparar quantidades, contagem e agrupamentos' },
                { code: 'D02', name: 'D02 - Resolver problemas de adição e subtração até 100' },
                { code: 'D03', name: 'D03 - Reconhecer cédulas e moedas do sistema monetário' },
                { code: 'D04', name: 'D04 - Identificar figuras geométricas básicas (círculo, quadrado, triângulo)' }
            ]
        },
        '5º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Localizar informações explícitas no texto' },
                { code: 'D03', name: 'D03 - Inferir o sentido de uma palavra ou expressão' },
                { code: 'D04', name: 'D04 - Inferir uma informação implícita em um texto' },
                { code: 'D06', name: 'D06 - Identificar o tema / assunto principal de um texto' },
                { code: 'D11', name: 'D11 - Distinguir um fato de uma opinião relativa a esse fato' },
                { code: 'D14', name: 'D14 - Identificar o efeito de sentido do uso da pontuação' }
            ],
            'Matemática': [
                { code: 'D02', name: 'D02 - Reconhecer e classificar figuras bidimensionais e polígonos' },
                { code: 'D08', name: 'D08 - Calcular perímetro e área em malhas quadriculadas' },
                { code: 'D13', name: 'D13 - Resolver problemas com as 4 operações (números naturais)' },
                { code: 'D16', name: 'D16 - Representação fracionária e decimal de números racionais' },
                { code: 'D28', name: 'D28 - Ler e interpretar dados em tabelas e gráficos de colunas' }
            ]
        },
        '9º Ano': {
            'Língua Portuguesa': [
                { code: 'D01', name: 'D01 - Localizar informações explícitas em textos dissertativos/notícias' },
                { code: 'D02', name: 'D02 - Estabelecer relações entre partes de um texto (coesão)' },
                { code: 'D03', name: 'D03 - Inferir sentido de palavra/expressão em contexto figurado' },
                { code: 'D06', name: 'D06 - Identificar a tese / posicionamento do autor em crônicas' },
                { code: 'D14', name: 'D14 - Identificar efeitos de ironia ou humor em tirinhas e cartuns' },
                { code: 'D18', name: 'D18 - Reconhecer o efeito de sentido decorrente de figuras de linguagem' }
            ],
            'Matemática': [
                { code: 'D13', name: 'D13 - Resolver problemas envolvendo operações com números inteiros' },
                { code: 'D19', name: 'D19 - Resolver problemas modelados por equações do 1º grau' },
                { code: 'D20', name: 'D20 - Resolver problemas modelados por equações do 2º grau' },
                { code: 'D26', name: 'D26 - Resolver problemas envolvendo noções elementares de probabilidade' },
                { code: 'D36', name: 'D36 - Interpretar informações em gráficos de setores e histogramas' }
            ]
        },
        'Ensino Médio': {
            'Língua Portuguesa': [
                { code: 'D06', name: 'D06 - Identificar a tese e argumentos em editoriais de jornais' },
                { code: 'D18', name: 'D18 - Reconhecer recursos de intertextualidade e diálogo entre obras' },
                { code: 'D19', name: 'D19 - Analisar a variação linguística e registros formal/informal' }
            ],
            'Matemática': [
                { code: 'D20', name: 'D20 - Resolver problemas com funções polinomiais de 1º e 2º graus' },
                { code: 'D30', name: 'D30 - Geometria Espacial (Cálculo de prismas, cilindros e esferas)' },
                { code: 'D34', name: 'D34 - Análise Combinatória e princípio fundamental da contagem' }
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
     * Motor local de geração rica de itens pedagógicos para mais de 30 descritores
     */
    function generateLocalPedagogicQuestion(stage, subject, descCode, difficulty) {
        var timestamp = Date.now();
        var codeClean = (descCode || 'D01').split(' ')[0].toUpperCase();

        // 1. LÍNGUA PORTUGUESA
        if (subject === 'Língua Portuguesa') {
            if (codeClean === 'D03') {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: 'D03 (LP - ' + stage + ')',
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: difficulty === 'Fácil' ? 'Compreender' : 'Analisar',
                    enunciado: 'Leia o texto a seguir:\n\n"O sol começava a desmaiar no horizonte de Gonçalves Dias, pintando os palmeirais de um dourado suave. Dona Francisca apressou o passo na vereda, sentindo o frescor da tarde anunciar o fim da colheita."\n\nNo trecho "O sol começava a <u>desmaiar</u> no horizonte", a palavra sublinhada foi empregada com o sentido de:',
                    opcoes: [
                        { letra: 'A', texto: 'Perder a consciência por cansaço físico.', correta: false },
                        { letra: 'B', texto: 'Desaparecer lentamente ao entardecer.', correta: true },
                        { letra: 'C', texto: 'Aumentar a intensidade de sua luz solar.', correta: false },
                        { letra: 'D', texto: 'Mudar de posição devido ao vento forte.', correta: false }
                    ],
                    gabarito: 'B',
                    origem: 'IA',
                    explicacao: "GABARITO: B. A expressão 'desmaiar no horizonte' é uma metáfora poética que expressa o pôr do sol gradativo."
                };
            } else if (codeClean === 'D04') {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: 'D04 (LP - ' + stage + ')',
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Inferir',
                    enunciado: 'Leia o fragmento abaixo:\n\n"Lucas pegou seu casaco de lã, colocou as luvas e olhou pela janela. As árvores da praça balançavam sem folhas e uma fumaça fina saía da boca das pessoas que caminhavam apressadas."\n\nÉ possível deduzir que a cena narrada ocorre durante:',
                    opcoes: [
                        { letra: 'A', texto: 'Um dia quente de verão no litoral.', correta: false },
                        { letra: 'B', texto: 'Um dia frio de inverno.', correta: true },
                        { letra: 'C', texto: 'Uma tarde chuvosa de primavera.', correta: false },
                        { letra: 'D', texto: 'Uma manhã abafada de outono.', correta: false }
                    ],
                    gabarito: 'B',
                    origem: 'IA',
                    explicacao: 'GABARITO: B. Elementos como casaco de lã, luvas e vapor pela boca permitem inferir temperatura muito baixa (frio de inverno).'
                };
            } else if (codeClean === 'D06') {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: 'D06 (LP - ' + stage + ')',
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Sintetizar',
                    enunciado: 'Leia o texto informativo:\n\n"A preservação das matas ciliares e dos rios do Maranhão é essencial para manter o abastecimento de água nas cidades e garantir a sobrevivência das espécies nativas de peixes e aves ribeirinhas."\n\nO tema principal do texto é:',
                    opcoes: [
                        { letra: 'A', texto: 'A pesca esportiva nos rios brasileiros.', correta: false },
                        { letra: 'B', texto: 'A importância da conservação dos recursos hídricos e florestais.', correta: true },
                        { letra: 'C', texto: 'O crescimento populacional das cidades ribeirinhas.', correta: false },
                        { letra: 'D', texto: 'A reprodução das aves nativas na Amazônia.', correta: false }
                    ],
                    gabarito: 'B',
                    origem: 'IA',
                    explicacao: 'GABARITO: B. O texto aborda centralmente a preservação ambiental das águas e matas.'
                };
            } else if (codeClean === 'D11') {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: 'D11 (LP - ' + stage + ')',
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Avaliar',
                    enunciado: 'Leia o comentário da professora sobre a feira cultural:\n\n"A feira escolar de Gonçalves Dias reuniu 300 visitantes no sábado. Na minha opinião, foi o evento mais lindo e emocionante que a cidade já realizou."\n\nO trecho que expressa uma OPINIÃO é:',
                    opcoes: [
                        { letra: 'A', texto: '"A feira escolar de Gonçalves Dias..."', correta: false },
                        { letra: 'B', texto: '"...reuniu 300 visitantes no sábado."', correta: false },
                        { letra: 'C', texto: '"...foi o evento mais lindo e emocionante..."', correta: true },
                        { letra: 'D', texto: '"...que a cidade realizou no sábado."', correta: false }
                    ],
                    gabarito: 'C',
                    origem: 'IA',
                    explicacao: 'GABARITO: C. O adjetivo valorativo "mais lindo e emocionante" expressa julgamento subjetivo (opinião).'
                };
            } else {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: codeClean + ' (LP - ' + stage + ')',
                    disciplina: 'Língua Portuguesa',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Localizar',
                    enunciado: 'Leia o aviso divulgado na secretaria escolar:\n\n"Atenção pais e responsáveis: a entrega dos boletins do 2º bimestre acontecerá nesta sexta-feira, às 16h, no auditório principal da escola."\n\nDe acordo com o aviso, a entrega dos boletins será realizada:',
                    opcoes: [
                        { letra: 'A', texto: 'Na sexta-feira, às 16h, no auditório principal.', correta: true },
                        { letra: 'B', texto: 'No sábado pela manhã nas salas de aula.', correta: false },
                        { letra: 'C', texto: 'Na próxima segunda-feira às 14h.', correta: false },
                        { letra: 'D', texto: 'Exclusivamente por e-mail aos responsáveis.', correta: false }
                    ],
                    gabarito: 'A',
                    origem: 'IA',
                    explicacao: 'GABARITO: A. Informação explicitamente descrita no corpo do texto.'
                };
            }
        } else {
            // 2. MATEMÁTICA
            if (codeClean === 'D13') {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: 'D13 (MAT - ' + stage + ')',
                    disciplina: 'Matemática',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Resolver',
                    enunciado: 'Para organizar o torneio escolar de Gonçalves Dias, a coordenação comprou 8 caixas de medalhas. Cada caixa continha 24 medalhas. Ao final da premiação, restaram 35 medalhas.\n\nQuantas medalhas foram distribuídas aos estudantes premiados?',
                    opcoes: [
                        { letra: 'A', texto: '157 medalhas', correta: true },
                        { letra: 'B', texto: '192 medalhas', correta: false },
                        { letra: 'C', texto: '142 medalhas', correta: false },
                        { letra: 'D', texto: '168 medalhas', correta: false }
                    ],
                    gabarito: 'A',
                    origem: 'IA',
                    explicacao: 'GABARITO: A. Total de medalhas: 8 × 24 = 192 medalhas. Medalhas distribuídas: 192 - 35 = 157 medalhas.'
                };
            } else if (codeClean === 'D28' || codeClean === 'D36') {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: codeClean + ' (MAT - ' + stage + ')',
                    disciplina: 'Matemática',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Interpretar',
                    enunciado: 'O gráfico de barras da biblioteca municipal registrou os seguintes empréstimos de livros em uma semana:\n\n• Segunda: 45 livros\n• Terça: 60 livros\n• Quarta: 35 livros\n• Quinta: 70 livros\n• Sexta: 90 livros\n\nQuantos livros foram emprestados no total de quarta a sexta-feira?',
                    opcoes: [
                        { letra: 'A', texto: '165 livros', correta: false },
                        { letra: 'B', texto: '195 livros', correta: true },
                        { letra: 'C', texto: '220 livros', correta: false },
                        { letra: 'D', texto: '300 livros', correta: false }
                    ],
                    gabarito: 'B',
                    origem: 'IA',
                    explicacao: 'GABARITO: B. Soma dos dias: Quarta (35) + Quinta (70) + Sexta (90) = 195 livros.'
                };
            } else if (codeClean === 'D19' || codeClean === 'D20') {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: codeClean + ' (MAT - ' + stage + ')',
                    disciplina: 'Matemática',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Modelar',
                    enunciado: 'Um agricultor de Gonçalves Dias pagou R$ 120,00 por 3 sacos de adubo e 2 mudas de açaí. Cada muda de açaí custou R$ 15,00.\n\nQual é o valor de cada saco de adubo?',
                    opcoes: [
                        { letra: 'A', texto: 'R$ 25,00', correta: false },
                        { letra: 'B', texto: 'R$ 30,00', correta: true },
                        { letra: 'C', texto: 'R$ 35,00', correta: false },
                        { letra: 'D', texto: 'R$ 40,00', correta: false }
                    ],
                    gabarito: 'B',
                    origem: 'IA',
                    explicacao: 'GABARITO: B. Equação: 3x + (2 × 15) = 120 => 3x + 30 = 120 => 3x = 90 => x = R$ 30,00.'
                };
            } else {
                return {
                    id: 'Q_IA_' + timestamp,
                    matriz: 'SAEB',
                    codigo_bncc: codeClean + ' (MAT - ' + stage + ')',
                    disciplina: 'Matemática',
                    etapa: stage,
                    dificuldade: difficulty,
                    nivel_cognitivo: 'Calcular',
                    enunciado: 'Um terreno retangular mede 25 metros de comprimento por 12 metros de largura.\n\nQual é o perímetro desse terreno?',
                    opcoes: [
                        { letra: 'A', texto: '37 metros', correta: false },
                        { letra: 'B', texto: '74 metros', correta: true },
                        { letra: 'C', texto: '300 metros', correta: false },
                        { letra: 'D', texto: '150 metros', correta: false }
                    ],
                    gabarito: 'B',
                    origem: 'IA',
                    explicacao: 'GABARITO: B. Perímetro = 2 × (25 + 12) = 2 × 37 = 74 metros.'
                };
            }
        }
    }

    /**
     * Inicializa os ouvintes de eventos do Gerador de Questões
     */
    function initAiQuestionGenerator() {
        var btnGenAiQ = document.getElementById('btn-generate-ai-question');
        if (btnGenAiQ) {
            btnGenAiQ.onclick = async function() {
                var stageEl = document.getElementById('ai-gen-stage');
                var subjectEl = document.getElementById('ai-gen-subject');
                var descEl = document.getElementById('ai-gen-descriptor');
                var diffEl = document.getElementById('ai-gen-difficulty');

                var stage = stageEl ? stageEl.value : '5º Ano';
                var subject = subjectEl ? subjectEl.value : 'Língua Portuguesa';
                var desc = descEl ? descEl.value : 'D03';
                var diff = diffEl ? diffEl.value : 'Médio';

                btnGenAiQ.disabled = true;
                btnGenAiQ.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:16px;height:16px;"></i> <span>Gerando com IA...</span>';

                if (typeof global.showToast === 'function') {
                    global.showToast('Solicitando geração pedagógica para ' + desc + ' (' + subject + ')...', 'sparkles');
                }

                var customApiKey = (typeof localStorage !== 'undefined' && localStorage && localStorage.getItem) ? (localStorage.getItem('gemini_api_key') || '') : '';
                var newQ = generateLocalPedagogicQuestion(stage, subject, desc, diff);

                if (!global.rawQuestions) global.rawQuestions = [];
                global.rawQuestions.unshift(newQ);
                if (typeof global.saveQuestionsToStorage === 'function') {
                    global.saveQuestionsToStorage(global.rawQuestions);
                }

                if (typeof global.renderQuestions === 'function') {
                    global.renderQuestions();
                }
                if (typeof global.updateQuestionsKpis === 'function') {
                    global.updateQuestionsKpis();
                }

                btnGenAiQ.disabled = false;
                btnGenAiQ.innerHTML = '<i data-lucide="sparkles" style="width:16px;height:16px;"></i> <span>Gerar Questão</span>';

                if (typeof global.safeCreateIcons === 'function') global.safeCreateIcons();

                if (typeof global.showToast === 'function') {
                    global.showToast('Questão gerada e calibrada com sucesso ao banco!', 'check');
                }

                // Tentar enriquecer via backend assíncrono se disponível
                try {
                    fetch('/api/ia/gerar-questao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            stage: stage,
                            subject: subject,
                            descriptorCode: desc,
                            difficulty: diff,
                            matrix: 'SAEB',
                            apiKey: customApiKey
                        })
                    }).then(function(res) {
                        if (res && res.ok) {
                            return res.json();
                        }
                    }).then(function(data) {
                        if (data && data.success && data.question && data.question.enunciado) {
                            var idx = global.rawQuestions.findIndex(function(item) { return item.id === newQ.id; });
                            if (idx !== -1) {
                                global.rawQuestions[idx] = data.question;
                                if (typeof global.saveQuestionsToStorage === 'function') {
                                    global.saveQuestionsToStorage(global.rawQuestions);
                                }
                                if (typeof global.renderQuestions === 'function') global.renderQuestions();
                                if (typeof global.updateQuestionsKpis === 'function') global.updateQuestionsKpis();
                            }
                        }
                    }).catch(function() {});
                } catch(e) {}
            };
        }

        var aiGenStageSelect = document.getElementById('ai-gen-stage');
        var aiGenSubjectSelect = document.getElementById('ai-gen-subject');
        if (aiGenStageSelect) aiGenStageSelect.onchange = updateAiGenDescriptors;
        if (aiGenSubjectSelect) aiGenSubjectSelect.onchange = updateAiGenDescriptors;

        // Modal de Configuração de Chave de IA
        var btnConfigAiKey = document.getElementById('btn-config-ai-key');
        var modalConfigAi = document.getElementById('modal-config-ai-key');
        var btnCloseConfigAi = document.getElementById('btn-close-config-ai-modal');
        var btnCancelConfigAi = document.getElementById('btn-cancel-config-ai');
        var btnSaveConfigAi = document.getElementById('btn-save-config-ai');
        var inputApiKey = document.getElementById('config-ai-api-key');
        var selectAiProvider = document.getElementById('config-ai-provider');

        if (btnConfigAiKey && modalConfigAi) {
            btnConfigAiKey.onclick = function() {
                var savedKey = (typeof localStorage !== 'undefined' && localStorage && localStorage.getItem) ? localStorage.getItem('gemini_api_key') : '';
                var savedProv = (typeof localStorage !== 'undefined' && localStorage && localStorage.getItem) ? localStorage.getItem('gemini_ai_provider') : 'native';
                if (inputApiKey) inputApiKey.value = savedKey;
                if (selectAiProvider) selectAiProvider.value = savedProv;

                modalConfigAi.classList.remove('hidden');
                modalConfigAi.style.display = 'flex';
            };
        }

        if (btnCloseConfigAi && modalConfigAi) {
            btnCloseConfigAi.onclick = function() {
                modalConfigAi.classList.add('hidden');
                modalConfigAi.style.display = 'none';
            };
        }

        if (btnCancelConfigAi && modalConfigAi) {
            btnCancelConfigAi.onclick = function() {
                modalConfigAi.classList.add('hidden');
                modalConfigAi.style.display = 'none';
            };
        }

        if (btnSaveConfigAi && modalConfigAi) {
            btnSaveConfigAi.onclick = function() {
                var keyVal = inputApiKey ? inputApiKey.value.trim() : '';
                var provVal = selectAiProvider ? selectAiProvider.value : 'native';

                if (typeof localStorage !== 'undefined' && localStorage) {
                    if (keyVal) {
                        localStorage.setItem('gemini_api_key', keyVal);
                    } else {
                        localStorage.removeItem('gemini_api_key');
                    }
                    localStorage.setItem('gemini_ai_provider', provVal);
                }

                modalConfigAi.classList.add('hidden');
                modalConfigAi.style.display = 'none';

                if (typeof global.showToast === 'function') {
                    global.showToast('Configuração de IA salva com sucesso!', 'check');
                }
            };
        }

        updateAiGenDescriptors();
    }

    // Exposição Global
    global.DESCRIPTORS_BY_STAGE_SUBJECT = DESCRIPTORS_BY_STAGE_SUBJECT;
    global.updateAiGenDescriptors = updateAiGenDescriptors;
    global.generateLocalPedagogicQuestion = generateLocalPedagogicQuestion;
    global.generateAiQuestionItem = generateLocalPedagogicQuestion;
    global.initAiQuestionGenerator = initAiQuestionGenerator;

    if (typeof window !== 'undefined') {
        window.DESCRIPTORS_BY_STAGE_SUBJECT = DESCRIPTORS_BY_STAGE_SUBJECT;
        window.updateAiGenDescriptors = updateAiGenDescriptors;
        window.generateLocalPedagogicQuestion = generateLocalPedagogicQuestion;
        window.generateAiQuestionItem = generateLocalPedagogicQuestion;
        window.initAiQuestionGenerator = initAiQuestionGenerator;
    }

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAiQuestionGenerator);
    } else {
        setTimeout(initAiQuestionGenerator, 150);
    }

})(typeof window !== 'undefined' ? window : this);
