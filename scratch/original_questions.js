const DEMO_QUESTIONS = [
        // --- LÍNGUA PORTUGUESA ---
        {
            id: "q_lp_1",
            codigo_bncc: "EF05LP01",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D1 (Localizar informação explícita)",
            enunciado: "Leia o texto a seguir:<br><em>'A Floresta Amazônica desempenha um papel crucial na regulação do clima global. Cientistas estimam que as árvores da região armazenem cerca de 120 bilhões de toneladas de carbono, ajudando a desacelerar o efeito estufa.'</em><br><br>De acordo com o texto, qual é a estimativa de carbono armazenado pelas árvores da região?",
            nivel_cognitivo: "Lembrar",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "120 milhões de toneladas de carbono", correta: false },
                { letra: "B", texto: "120 bilhões de toneladas de carbono", correta: true },
                { letra: "C", texto: "12 bilhões de toneladas de carbono", correta: false },
                { letra: "D", texto: "1.200 toneladas de carbono", correta: false }
            ],
            explicacao: "Localizar informação expressa no texto: 'árvores da região armazenem cerca de 120 bilhões de toneladas'."
        },
        {
            id: "q_lp_2",
            codigo_bncc: "EF05LP03",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D3 (Inferir o sentido de uma palavra ou expressão)",
            enunciado: "No trecho: <em>'O garoto ficou <strong>uma fera</strong> quando percebeu que seu brinquedo favorito havia quebrado.'</em><br><br>A expressão destacada 'uma fera' significa que o garoto ficou:",
            nivel_cognitivo: "Entender",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "Muito irritado", correta: true },
                { letra: "B", texto: "Muito assustado", correta: false },
                { letra: "C", texto: "Muito feliz", correta: false },
                { letra: "D", texto: "Muito cansado", correta: false }
            ],
            explicacao: "Compreender o sentido figurado da expressão idiomática popular 'ficar uma fera'."
        },
        {
            id: "q_lp_3",
            codigo_bncc: "EF05LP04",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D4 (Inferir uma informação implícita em um texto)",
            enunciado: "Leia os versos abaixo:<br><em>'A nuvem chorou fininho<br>Molhando a folha da flor<br>Depois veio o sol mansinho<br>E a nuvem se foi com calor.'</em><br><br>O trecho 'A nuvem chorou fininho' significa implicitamente que:",
            nivel_cognitivo: "Entender",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Estava caindo uma chuva leve", correta: true },
                { letra: "B", texto: "A nuvem estava muito triste", correta: false },
                { letra: "C", texto: "Houve uma grande tempestade", correta: false },
                { letra: "D", texto: "O dia estava muito frio", correta: false }
            ],
            explicacao: "Estabelecer relações de causa e efeito e interpretar linguagem metafórica básica."
        },
        {
            id: "q_lp_4",
            codigo_bncc: "EF05LP06",
            disciplina: "Língua Portuguesa",
            matriz: "IDEB",
            descritor: "SAEB-LP-D6 (Identificar o tema de um texto)",
            enunciado: "Leia com atenção:<br><em>'As abelhas são essenciais para a nossa sobrevivência. Ao voar de flor em flor em busca de pólen, realizam a polinização, processo que permite a reprodução de mais de 80% das plantas com flores do planeta, incluindo a maioria dos alimentos que consumimos.'</em><br><br>Qual é o tema principal do texto?",
            nivel_cognitivo: "Entender",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "O processo de fabricação do mel pelas abelhas", correta: false },
                { letra: "B", texto: "A importância das abelhas para a polinização e a vida na Terra", correta: true },
                { letra: "C", texto: "O perigo da extinção de insetos voadores", correta: false },
                { letra: "D", texto: "A variedade de flores existentes no planeta", correta: false }
            ],
            explicacao: "Identificar a ideia central e o tema articulador do parágrafo."
        },

        // --- MATEMÁTICA ---
        {
            id: "q_mt_1",
            codigo_bncc: "EF05MA01",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D1 (Identificar a localização/movimentação de objeto em mapas e representações)",
            enunciado: "Uma sala de aula possui as carteiras organizadas em colunas (1 a 5) e linhas (A a D). O aluno Pedro senta-se na carteira localizada na coluna 3, linha B.<br><br>Qual par de coordenadas representa a posição de Pedro?",
            nivel_cognitivo: "Lembrar",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "(B, 3)", correta: true },
                { letra: "B", texto: "(3, A)", correta: false },
                { letra: "C", texto: "(C, 2)", correta: false },
                { letra: "D", texto: "(2, B)", correta: false }
            ],
            explicacao: "Localizar pontos de referência em malha bidimensional através de coordenadas."
        },
        {
            id: "q_mt_2",
            codigo_bncc: "EF05MA19",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D13 (Resolver problemas com números naturais envolvendo as quatro operações)",
            enunciado: "Para organizar uma festa escolar, a diretora comprou 12 caixas de suco. Cada caixa contém exatamente 24 garrafinhas. Ao longo do evento, os alunos consumiram 185 garrafinhas.<br><br>Quantas garrafinhas de suco sobraram após o evento?",
            nivel_cognitivo: "Aplicar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "103 garrafinhas", correta: true },
                { letra: "B", texto: "288 garrafinhas", correta: false },
                { letra: "C", texto: "185 garrafinhas", correta: false },
                { letra: "D", texto: "113 garrafinhas", correta: false }
            ],
            explicacao: "Resolução em duas etapas: Multiplicação (12 * 24 = 288) seguida de Subtração (288 - 185 = 103)."
        },
        {
            id: "q_mt_3",
            codigo_bncc: "EF05MA20",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D20 (Resolver problemas com números inteiros envolvendo frações)",
            enunciado: "Uma pizza inteira foi cortada em 8 pedaços iguais. Ana comeu 2 pedaços e seu irmão Carlos comeu 3 pedaços.<br><br>Que fração da pizza sobrou?",
            nivel_cognitivo: "Aplicar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "3/8", correta: true },
                { letra: "B", texto: "5/8", correta: false },
                { letra: "C", texto: "2/8", correta: false },
                { letra: "D", texto: "1/2", correta: false }
            ],
            explicacao: "Soma das partes comidas (2/8 + 3/8 = 5/8) e cálculo do complementar (8/8 - 5/8 = 3/8)."
        },
        {
            id: "q_mt_4",
            codigo_bncc: "EF05MA24",
            disciplina: "Matemática",
            matriz: "IDEB",
            descritor: "SAEB-MT-D24 (Identificar a relação entre figuras tridimensionais e suas planificações)",
            enunciado: "Um dado clássico de jogo tem o formato de um cubo sólido regular de 6 faces.<br><br>Ao planificarmos esse cubo, qual das figuras a seguir representa sua estrutura correta?",
            nivel_cognitivo: "Analisar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Um arranjo em forma de cruz com 6 quadrados conectados", correta: true },
                { letra: "B", texto: "Uma fileira reta de 6 quadrados adjacentes", correta: false },
                { letra: "C", texto: "Uma pirâmide triangular planificada", correta: false },
                { letra: "D", texto: "Cinco retângulos e um círculo", correta: false }
            ],
            explicacao: "Reconhecimento espacial e planificação de poliedros regulares comuns."
        },

        // --- CIÊNCIAS DA NATUREZA ---
        {
            id: "q_ci_1",
            codigo_bncc: "EF05CI01",
            disciplina: "Ciências",
            matriz: "SEAMA",
            descritor: "EF05CI01 (Explorar e classificar propriedades físicas de materiais cotidianos)",
            enunciado: "Ao preparar café da manhã, Júlia notou que a colher de metal que deixou dentro da xícara de chá quente aqueceu rapidamente, enquanto a colher de plástico permaneceu fria.<br><br>Essa diferença ocorre porque o metal apresenta alta:",
            nivel_cognitivo: "Entender",
            dificuldade: "Fácil",
            opcoes: [
                { letra: "A", texto: "Condutibilidade térmica", correta: true },
                { letra: "B", texto: "Densidade volumétrica", correta: false },
                { letra: "C", texto: "Magnetização estática", correta: false },
                { letra: "D", texto: "Solubilidade aquosa", correta: false }
            ],
            explicacao: "Identificar características de condução térmica dos materiais em situações cotidianas."
        },

        // --- GEOGRAFIA ---
        {
            id: "q_ge_1",
            codigo_bncc: "EF05GE05",
            disciplina: "Geografia",
            matriz: "SEAMA",
            descritor: "EF05GE05 (Identificar e comparar as transformações espaciais decorrentes da ação antrópica)",
            enunciado: "A construção de grandes barragens hidrelétricas altera significativamente o leito dos rios, inunda áreas de florestas nativas e muitas vezes força a remoção de comunidades ribeirinhas.<br><br>Essas alterações no relevo e ocupação humana são exemplos clássicos de:",
            nivel_cognitivo: "Entender",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Transformações da paisagem natural decorrentes da ação humana (antrópica)", correta: true },
                { letra: "B", texto: "Processos puramente climáticos e erosivos geológicos", correta: false },
                { letra: "C", texto: "Preservação integral da cobertura florestal intocada", correta: false },
                { letra: "D", texto: "Migração natural espontânea da fauna aquática", correta: false }
            ],
            explicacao: "Analisar as modificações na paisagem e no meio ambiente promovidas pelo homem."
        },
        {
            id: "q_ge_2",
            codigo_bncc: "EF05GE09",
            disciplina: "Geografia",
            matriz: "SEAMA",
            descritor: "EF05GE09 (Reconhecer as características das vegetações nativas regionais brasileiras)",
            enunciado: "Uma região de transição com grande ocorrência de palmeiras de babaçu e carnaúba, localizada principalmente nos estados do Maranhão e Piauí, é chamada de:<br><br>Marque a alternativa correta:",
            nivel_cognitivo: "Lembrar",
            dificuldade: "Médio",
            opcoes: [
                { letra: "A", texto: "Mata Atlântica", correta: false },
                { letra: "B", texto: "Mata dos Cocais", correta: true },
                { letra: "C", texto: "Manguezal Litorâneo", correta: false },
                { letra: "D", texto: "Pampas Gaúchos", correta: false }
            ],
            explicacao: "A Mata dos Cocais é uma zona de transição morfoclimática típica do Meio-Norte brasileiro (Maranhão, Piauí e Ceará), caracterizada pela abundância de palmeiras extrativistas como o babaçu."
        }
    ];