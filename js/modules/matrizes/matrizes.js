// =========================================================================
// MÓDULO DE MATRIZES E DESCRITORES (SAEB / SEAMA / IDEB & BNCC)
// =========================================================================

(function(window, document) {
    'use strict';

    var activeMatrizEtapa = '5ano';
    var currentMatrizMainTab = 'saeb';

    // Bases de dados de referência oficiais
    var FULL_INEP_MATRICES = {
        portuguese: [
            { codigo: "D1", desc: "Localizar informações explícitas em um texto." },
            { codigo: "D2", desc: "Estabelecer relações entre partes de um texto, identificando repetições ou substituições que contribuem para a coerência." },
            { codigo: "D3", desc: "Inferir o sentido de uma palavra ou expressão." },
            { codigo: "D4", desc: "Inferir uma informação implícita em um texto." },
            { codigo: "D5", desc: "Interpretar texto com auxílio de material gráfico diverso (propagandas, quadrinhos, fotos, etc.)." },
            { codigo: "D6", desc: "Identificar o tema de um texto." },
            { codigo: "D7", desc: "Identificar o conflito gerador do enredo e os elementos que constroem a narrativa." },
            { codigo: "D8", desc: "Estabelecer relação entre a causa e o efeito no desenvolvimento da narrativa." },
            { codigo: "D9", desc: "Estabelecer relações de causa/consequência entre partes de um texto." },
            { codigo: "D10", desc: "Identificar as marcas linguísticas que evidenciam o locutor e o interlocutor de um texto." },
            { codigo: "D11", desc: "Distinguir um fato da opinião relativa a esse fato." },
            { codigo: "D12", desc: "Estabelecer relações lógico-discursivas presentes no texto, marcadas por conjunções, advérbios, etc." },
            { codigo: "D13", desc: "Identificar efeitos de ironia ou humor em textos variados." },
            { codigo: "D14", desc: "Identificar o efeito de sentido decorrente do uso da pontuação e de outras notações." },
            { codigo: "D15", desc: "Reconhecer diferentes formas de tratar uma informação na comparação de textos que tratam do mesmo assunto." },
            { codigo: "D16", desc: "Reconhecer a posição do autor em textos que tratam do mesmo assunto." },
            { codigo: "D17", desc: "Reconhecer o efeito de sentido decorrente da escolha de uma palavra ou expressão." },
            { codigo: "D18", desc: "Reconhecer o efeito de sentido decorrente da exploração de recursos ortográficos e/ou morfossintáticos." },
            { codigo: "D19", desc: "Identificar a tese de um texto." },
            { codigo: "D20", desc: "Diferenciar as partes principais das secundárias em um texto." },
            { codigo: "D21", desc: "Reconhecer as relações entre partes de um texto, identificando a tese e os argumentos." },
            { codigo: "D22", desc: "Estabelecer relação entre partes do texto, identificando repetições que contribuem para a coerência." },
            { codigo: "D23", desc: "Identificar efeitos de ambiguidade ou de sentido decorrentes do uso de recursos expressivos." }
        ],
        math: [
            { codigo: "D1", desc: "Identificar a localização/movimentação de objeto em mapas, croquis e outras representações gráficas." },
            { codigo: "D2", desc: "Identificar propriedades comuns e diferenças entre figuras bidimensionais e tridimensionais, relacionando-as com suas planificações." },
            { codigo: "D3", desc: "Identificar propriedades de triângulos pela comparação de medidas de lados e ângulos." },
            { codigo: "D4", desc: "Identificar relação entre quadriláteros por meio de suas propriedades." },
            { codigo: "D5", desc: "Reconhecer a conservação ou modificação de medidas nos redimensionamentos de figuras." },
            { codigo: "D6", desc: "Estimar a medida de grandezas utilizando unidades de medida não convencionais ou convencionais." },
            { codigo: "D7", desc: "Resolver problemas significativos utilizando unidades de medida padronizadas." },
            { codigo: "D8", desc: "Resolver problemas envolvendo o cálculo de perímetro de figuras planas." },
            { codigo: "D9", desc: "Resolver problemas envolvendo o cálculo de área de figuras planas." },
            { codigo: "D10", desc: "Resolver problemas envolvendo relações entre diferentes unidades de medida." },
            { codigo: "D11", desc: "Resolver problemas que envolvam grandezas diretamente proporcionais." },
            { codigo: "D12", desc: "Resolver problemas que envolvam o cálculo de porcentagem." },
            { codigo: "D13", desc: "Resolver problemas com números naturais envolvendo as quatro operações." },
            { codigo: "D14", desc: "Resolver problemas utilizando frações ou números decimais." },
            { codigo: "D15", desc: "Resolver problemas que envolvam juros simples ou compostos." },
            { codigo: "D16", desc: "Identificar a representação fracionária de números racionais." },
            { codigo: "D17", desc: "Identificar a representação decimal de números racionais." },
            { codigo: "D18", desc: "Efetuar cálculos com números reais." },
            { codigo: "D19", desc: "Resolver problemas que envolvam equações do 1º grau." },
            { codigo: "D20", desc: "Resolver problemas que envolvam equações do 2º grau." },
            { codigo: "D21", desc: "Resolver problemas envolvendo sistemas de equações." },
            { codigo: "D22", desc: "Resolver problemas que envolvam a relação de semelhança entre triângulos." },
            { codigo: "D23", desc: "Resolver problemas aplicando o teorema de Pitágoras." },
            { codigo: "D24", desc: "Resolver problemas que envolvam relações métricas no triângulo retângulo." },
            { codigo: "D25", desc: "Resolver problemas que envolvam as razões trigonométricas no triângulo retângulo." },
            { codigo: "D26", desc: "Resolver problemas envolvendo noções de probabilidade." },
            { codigo: "D27", desc: "Resolver problemas envolvendo a análise de dados apresentados em tabelas ou gráficos." }
        ],
        science: [
            { codigo: "CI01", desc: "Associar as propriedades físicas dos materiais à fabricação de objetos de uso cotidiano." },
            { codigo: "CI02", desc: "Identificar temperatura, calor e sensação térmica em diferentes situações cotidianas." },
            { codigo: "CI03", desc: "Explicar a importância da água e do ciclo hidrológico para a manutenção da vida." },
            { codigo: "CI04", desc: "Identificar a organização de cadeias alimentares simples e as relações ecológicas." },
            { codigo: "CI05", desc: "Reconhecer a importância do solo para a agricultura e os processos erosivos." },
            { codigo: "CI06", desc: "Descrever a estrutura interna da Terra e os fenômenos tectônicos (sismos, vulcanismo)." },
            { codigo: "CI07", desc: "Identificar as características dos principais biomas brasileiros e conservação ambiental." },
            { codigo: "CI08", desc: "Analisar a ação de microrganismos na produção de alimentos, combustíveis e medicamentos." },
            { codigo: "CI09", desc: "Compreender o funcionamento básico do sistema digestório e cardiovascular humano." }
        ]
    };

    var MASTER_EXHAUSTIVE_MATRICES = window.MASTER_EXHAUSTIVE_MATRICES || {
        '5ano': {
            portuguese: [
                { codigo: "D1", topico: "Procedimentos de Leitura", desc: "Localizar informações explícitas em um texto." },
                { codigo: "D2", topico: "Coerência e Coesão", desc: "Estabelecer relações entre partes de um texto, identificando repetições ou substituições." },
                { codigo: "D3", topico: "Procedimentos de Leitura", desc: "Inferir o sentido de uma palavra ou expressão." },
                { codigo: "D4", topico: "Procedimentos de Leitura", desc: "Inferir uma informação implícita em um texto." },
                { codigo: "D5", topico: "Implicância do Suporte", desc: "Interpretar texto com auxílio de material gráfico diverso (propagandas, tiras, fotos)." },
                { codigo: "D6", topico: "Procedimentos de Leitura", desc: "Identificar o tema de um texto." },
                { codigo: "D7", topico: "Coerência e Coesão", desc: "Identificar o conflito gerador do enredo e os elementos constitutivos da narrativa." },
                { codigo: "D8", topico: "Coerência e Coesão", desc: "Estabelecer relação entre a causa e a consequência no desenvolvimento do texto." },
                { codigo: "D9", topico: "Implicância do Suporte", desc: "Identificar a finalidade de textos de diferentes gêneros." },
                { codigo: "D10", topico: "Variação Linguística", desc: "Identificar as marcas linguísticas que evidenciam o locutor e o interlocutor de um texto." },
                { codigo: "D12", topico: "Coerência e Coesão", desc: "Estabelecer relações lógico-discursivas marcadas por conjunções, advérbios, etc." },
                { codigo: "D13", topico: "Relações entre Textos", desc: "Reconhecer diferentes formas de tratar uma informação na comparação de textos." },
                { codigo: "D14", topico: "Procedimentos de Leitura", desc: "Distinguir um fato da opinião relativa a esse fato." },
                { codigo: "D15", topico: "Recursos Expressivos", desc: "Reconhecer o efeito de sentido decorrente do uso da pontuação e de outras notações." }
            ],
            math: [
                { codigo: "D1", topico: "Espaço e Forma", desc: "Identificar a localização/movimentação de objeto em mapas, croquis e representações gráficas." },
                { codigo: "D2", topico: "Espaço e Forma", desc: "Identificar propriedades comuns e diferenças entre figuras bi e tridimensionais e suas planificações." },
                { codigo: "D3", topico: "Espaço e Forma", desc: "Identificar propriedades de triângulos pela comparação de lados e ângulos." },
                { codigo: "D4", topico: "Espaço e Forma", desc: "Identificar relação entre quadriláteros por meio de suas propriedades." },
                { codigo: "D5", topico: "Espaço e Forma", desc: "Reconhecer a conservação/modificação de medidas em ampliações e reduções de polígonos." },
                { codigo: "D6", topico: "Grandezas e Medidas", desc: "Estimar a medida de grandezas utilizando unidades convencionais ou não." },
                { codigo: "D7", topico: "Grandezas e Medidas", desc: "Resolver problemas utilizando unidades de medida padronizadas (km, m, cm, kg, g, l, ml)." },
                { codigo: "D8", topico: "Grandezas e Medidas", desc: "Estabelecer relações entre unidades de medida de tempo." },
                { codigo: "D9", topico: "Grandezas e Medidas", desc: "Estabelecer relações entre hora de início/término e a duração de um evento." },
                { codigo: "D10", topico: "Grandezas e Medidas", desc: "Determinar o valor total em cédulas e moedas do sistema monetário brasileiro." },
                { codigo: "D11", topico: "Grandezas e Medidas", desc: "Resolver problemas envolvendo o cálculo do perímetro de figuras planas." },
                { codigo: "D12", topico: "Grandezas e Medidas", desc: "Resolver problemas envolvendo a noção de área de figuras planas." },
                { codigo: "D13", topico: "Números e Operações", desc: "Reconhecer e utilizar características do sistema de numeração decimal (valor posicional)." },
                { codigo: "D14", topico: "Números e Operações", desc: "Identificar a localização de números naturais na reta numérica." },
                { codigo: "D15", topico: "Números e Operações", desc: "Reconhecer a decomposição de números naturais nas suas diversas ordens." },
                { codigo: "D16", topico: "Números e Operações", desc: "Reconhecer a composição e decomposição de números naturais." },
                { codigo: "D17", topico: "Números e Operações", desc: "Calcular o resultado de uma adição ou subtração de números naturais." },
                { codigo: "D18", topico: "Números e Operações", desc: "Calcular o resultado de uma multiplicação ou divisão de números naturais." },
                { codigo: "D19", topico: "Números e Operações", desc: "Resolver problemas com números naturais envolvendo adição ou subtração." },
                { codigo: "D20", topico: "Números e Operações", desc: "Resolver problemas com números naturais envolvendo multiplicação ou divisão." },
                { codigo: "D21", topico: "Números e Operações", desc: "Identificar representações de um mesmo número racional (fração, decimal, porcentagem)." },
                { codigo: "D22", topico: "Números e Operações", desc: "Identificar a localização de números decimais na reta numérica." },
                { codigo: "D23", topico: "Números e Operações", desc: "Resolver problemas utilizando a escrita decimal de cédulas e moedas." },
                { codigo: "D24", topico: "Números e Operações", desc: "Identificar fração como representação associada a partes de um todo ou razão." },
                { codigo: "D25", topico: "Números e Operações", desc: "Resolver problemas com números racionais expressos na forma decimal." },
                { codigo: "D26", topico: "Números e Operações", desc: "Resolver problemas envolvendo porcentagem (25%, 50%, 100%)." },
                { codigo: "D27", topico: "Tratamento da Informação", desc: "Ler e interpretar informações apresentadas em tabelas simples ou duplas." },
                { codigo: "D28", topico: "Tratamento da Informação", desc: "Ler e interpretar dados em gráficos de colunas ou barras." }
            ],
            science: [
                { codigo: "EF05CI01", topico: "Matéria e Energia", desc: "Explorar propriedades físicas dos materiais (densidade, condutibilidade)." },
                { codigo: "EF05CI02", topico: "Matéria e Energia", desc: "Aplicar conhecimentos sobre mudanças de estado físico no ciclo da água." },
                { codigo: "EF05CI03", topico: "Vida e Evolução", desc: "Justificar a importância da cobertura vegetal para a manutenção da água." },
                { codigo: "EF05CI04", topico: "Vida e Evolução", desc: "Identificar os órgãos dos sistemas digestório e respiratório." },
                { codigo: "EF05CI05", topico: "Vida e Evolução", desc: "Propor ações de consumo consciente e descarte adequado de resíduos." },
                { codigo: "EF05CI06", topico: "Vida e Evolução", desc: "Justificar a importância da água potável para a saúde humana." },
                { codigo: "EF05CI07", topico: "Terra e Universo", desc: "Relacionar a rotação da Terra ao movimento aparente do Sol." },
                { codigo: "EF05CI08", topico: "Terra e Universo", desc: "Organizar um cardápio equilibrado com base nos grupos alimentares." }
            ],
            humanas: [
                { codigo: "EF05HI01", topico: "História & Cidadania", desc: "Identificar os processos de formação das culturas e dos povos." },
                { codigo: "EF05HI02", topico: "História & Cidadania", desc: "Comparar os pontos de vista sobre a formação da sociedade maranhense e brasileira." },
                { codigo: "EF05HI04", topico: "História & Cidadania", desc: "Associar a noção de cidadania aos direitos humanos e de minorias." },
                { codigo: "EF05GE01", topico: "Geografia & Território", desc: "Descrever a dinâmica populacional e os fluxos migratórios regionais no Maranhão." },
                { codigo: "EF05GE02", topico: "Geografia & Território", desc: "Identificar as transformações das paisagens nas cidades e no campo." },
                { codigo: "EF05GE04", topico: "Geografia & Território", desc: "Reconhecer as características dos biomas brasileiros e do Cerrado/Mata dos Cocais." }
            ]
        },
        '9ano': {
            portuguese: [
                { codigo: "D1", topico: "Procedimentos de Leitura", desc: "Localizar informações explícitas em um texto." },
                { codigo: "D2", topico: "Procedimentos de Leitura", desc: "Estabelecer relações entre partes de um texto." },
                { codigo: "D3", topico: "Procedimentos de Leitura", desc: "Inferir o sentido de uma palavra ou expressão." },
                { codigo: "D4", topico: "Procedimentos de Leitura", desc: "Inferir uma informação implícita em um texto." },
                { codigo: "D5", topico: "Implicância do Suporte", desc: "Interpretar texto com auxílio de recursos gráficos (charges, dados)." },
                { codigo: "D6", topico: "Procedimentos de Leitura", desc: "Identificar o tema central de um texto." },
                { codigo: "D7", topico: "Coerência e Coesão", desc: "Identificar o conflito gerador do enredo na narrativa." },
                { codigo: "D8", topico: "Coerência e Coesão", desc: "Estabelecer relação entre a causa e o efeito no texto." },
                { codigo: "D9", topico: "Implicância do Suporte", desc: "Identificar a finalidade de textos de diferentes gêneros." },
                { codigo: "D11", topico: "Procedimentos de Leitura", desc: "Distinguir um fato da opinião relativa a esse fato." },
                { codigo: "D12", topico: "Coerência e Coesão", desc: "Estabelecer relações lógico-discursivas marcadas por conectivos." },
                { codigo: "D15", topico: "Relações entre Textos", desc: "Reconhecer posições distintas entre dois textos sobre o mesmo assunto." },
                { codigo: "D16", topico: "Relações entre Textos", desc: "Identificar a tese e os argumentos apresentados no texto argumentativo." },
                { codigo: "D17", topico: "Variação Linguística", desc: "Reconhecer o efeito de sentido decorrente da escolha de palavras formais/informais." },
                { codigo: "D18", topico: "Recursos Expressivos", desc: "Identificar o efeito de sentido decorrente do uso da pontuação." },
                { codigo: "D19", topico: "Recursos Expressivos", desc: "Identificar efeitos de ironia ou humor em textos variados." },
                { codigo: "D20", topico: "Recursos Expressivos", desc: "Reconhecer o efeito de sentido decorrente de recursos sintáticos." },
                { codigo: "D21", topico: "Recursos Expressivos", desc: "Reconhecer as relações entre a tese e os argumentos em textos opinativos." }
            ],
            math: [
                { codigo: "D1", topico: "Espaço e Forma", desc: "Identificar a localização/movimentação no plano cartesiano." },
                { codigo: "D2", topico: "Espaço e Forma", desc: "Identificar propriedades de figuras bi e tridimensionais." },
                { codigo: "D3", topico: "Espaço e Forma", desc: "Identificar propriedades de triângulos pela comparação de lados e ângulos." },
                { codigo: "D4", topico: "Espaço e Forma", desc: "Identificar relação entre quadriláteros por meio de suas propriedades." },
                { codigo: "D5", topico: "Espaço e Forma", desc: "Reconhecer conservação/modificação de medidas em ampliações de polígonos." },
                { codigo: "D6", topico: "Espaço e Forma", desc: "Reconhecer ângulos como mudança de direção ou giros." },
                { codigo: "D7", topico: "Espaço e Forma", desc: "Reconhecer a simetria de reflexão em figuras planas." },
                { codigo: "D8", topico: "Grandezas e Medidas", desc: "Resolver problemas envolvendo o cálculo de perímetro de figuras planas." },
                { codigo: "D9", topico: "Grandezas e Medidas", desc: "Resolver problemas envolvendo o cálculo de área de figuras planas." },
                { codigo: "D10", topico: "Grandezas e Medidas", desc: "Determinar o valor total em cédulas e moedas no sistema monetário." },
                { codigo: "D11", topico: "Grandezas e Medidas", desc: "Resolver problemas envolvendo o cálculo de volume de paralelepípedos." },
                { codigo: "D12", topico: "Grandezas e Medidas", desc: "Resolver problemas envolvendo a capacidade de recipientes." },
                { codigo: "D13", topico: "Números e Operações", desc: "Reconhecer características do sistema de numeração decimal." },
                { codigo: "D14", topico: "Números e Operações", desc: "Identificar a localização de números inteiros/racionais na reta numérica." },
                { codigo: "D15", topico: "Números e Operações", desc: "Calcular o resultado de operações de adição, subtração, multiplicação e divisão com inteiros." },
                { codigo: "D16", topico: "Números e Operações", desc: "Estabelecer relações entre representações fracionárias e decimais." },
                { codigo: "D17", topico: "Números e Operações", desc: "Resolver problemas com números racionais envolvendo as 4 operações." },
                { codigo: "D18", topico: "Números e Operações", desc: "Calcular o valor numérico de uma expressão algébrica." },
                { codigo: "D19", topico: "Números e Operações", desc: "Resolver problema envolvendo equação do 1º grau." },
                { codigo: "D20", topico: "Números e Operações", desc: "Resolver problema envolvendo sistema de equações do 1º grau." },
                { codigo: "D21", topico: "Números e Operações", desc: "Resolver problema envolvendo equação do 2º grau." },
                { codigo: "D22", topico: "Números e Operações", desc: "Identificar a representação gráfica de uma função de 1º grau." },
                { codigo: "D23", topico: "Números e Operações", desc: "Resolver problema que envolva a razão entre duas grandezas." },
                { codigo: "D24", topico: "Números e Operações", desc: "Resolver problema que envolva variação proporcional direta ou inversa." },
                { codigo: "D25", topico: "Números e Operações", desc: "Resolver problema envolvendo porcentagem (aumentos e descontos)." },
                { codigo: "D26", topico: "Números e Operações", desc: "Resolver problema envolvendo juros simples." },
                { codigo: "D27", topico: "Tratamento da Informação", desc: "Ler e interpretar informações em tabelas." },
                { codigo: "D28", topico: "Tratamento da Informação", desc: "Ler e interpretar dados em gráficos de colunas, setores, linhas e histogramas." },
                { codigo: "D29", topico: "Tratamento da Informação", desc: "Resolver problemas envolvendo o cálculo da média aritmética." },
                { codigo: "D30", topico: "Tratamento da Informação", desc: "Resolver problemas envolvendo noções de probabilidade." },
                { codigo: "D31", topico: "Geometria Avançada", desc: "Resolver problemas aplicando o Teorema de Pitágoras." },
                { codigo: "D32", topico: "Geometria Avançada", desc: "Resolver problemas envolvendo a circunferência (comprimento e área)." },
                { codigo: "D33", topico: "Estatística", desc: "Interpretar mediana e moda em conjuntos de dados." },
                { codigo: "D34", topico: "Tratamento da Informação", desc: "Resolver problemas de contagem via princípio multiplicativo." },
                { codigo: "D35", topico: "Álgebra", desc: "Identificar padrões e termos de uma sequência numérica." },
                { codigo: "D36", topico: "Funções", desc: "Reconhecer a representação gráfica da função quadrática (parábola)." },
                { codigo: "D37", topico: "Geometria", desc: "Resolver problemas usando razões trigonométricas no triângulo retângulo (seno, cosseno, tangente)." }
            ],
            science: [
                { codigo: "EF09CI01", topico: "Matéria e Energia", desc: "Investigar mudanças de estado físico e conservação da massa." },
                { codigo: "EF09CI02", topico: "Matéria e Energia", desc: "Comparar grandezas físicas (massa, volume, densidade)." },
                { codigo: "EF09CI03", topico: "Matéria e Energia", desc: "Identificar os modelos atômicos e a estrutura do átomo." },
                { codigo: "EF09CI04", topico: "Vida e Evolução", desc: "Descrever a estrutura do DNA e as leis da hereditariedade." },
                { codigo: "EF09CI05", topico: "Vida e Evolução", desc: "Analisar as teorias de evolução e seleção natural." },
                { codigo: "EF09CI06", topico: "Terra e Universo", desc: "Associar o ciclo das fases da Lua ao movimento de revolução." },
                { codigo: "EF09CI07", topico: "Terra e Universo", desc: "Explicar a evolução das estrelas e do Sistema Solar." }
            ],
            humanas: [
                { codigo: "EF09HI01", topico: "História Contemporânea", desc: "Descrever os processos de urbanização e industrialização no século XX." },
                { codigo: "EF09HI02", topico: "História do Brasil", desc: "Analisar a formação da República Brasileira e os movimentos sociais no Maranhão." },
                { codigo: "EF09GE01", topico: "Geografia Mundial", desc: "Analisar a hegemonia europeia e os conflitos geopolíticos globais." },
                { codigo: "EF09GE02", topico: "Geografia Econômica", desc: "Relacionar a globalização às transformações no mundo do trabalho." }
            ]
        },
        'alfabetizacao': {
            portuguese: [
                { codigo: "D1", topico: "Consciência Fonológica", desc: "Reconhecer o alfabeto e a grafia das letras maiúsculas e minúsculas." },
                { codigo: "D2", topico: "Consciência Fonológica", desc: "Diferenciar letras de números e outros símbolos gráficos." },
                { codigo: "D3", topico: "Consciência Fonológica", desc: "Identificar rimas e aliterações em textos versificados." },
                { codigo: "D4", topico: "Consciência Fonológica", desc: "Contar sílabas de palavras faladas (segmentação silábica)." },
                { codigo: "D5", topico: "Decodificação & Fluência", desc: "Ler palavras de sílabas canônicas e não canônicas." },
                { codigo: "D6", topico: "Decodificação & Fluência", desc: "Ler frases curtas com ritmo e entonação adequados." },
                { codigo: "D7", topico: "Compreensão de Leitura", desc: "Localizar informação explícita em textos curtos." },
                { codigo: "D8", topico: "Compreensão de Leitura", desc: "Identificar o assunto principal de um texto ilustrado." },
                { codigo: "D9", topico: "Compreensão de Leitura", desc: "Inferir o sentido de palavras simples em cantigas e parlendas." },
                { codigo: "D10", topico: "Escrita & Ortografia", desc: "Escrever palavras corretamente observando a correspondência grafofonêmica." },
                { codigo: "D11", topico: "Fluência Leitora", desc: "Ler texto curto com velocidade igual ou superior a 60 palavras por minuto." },
                { codigo: "D12", topico: "Produção de Texto", desc: "Produzir pequenos textos narrativos utilizando pontuação básica." }
            ],
            math: [
                { codigo: "D1", topico: "Números", desc: "Reconhecer a contagem de coleções de objetos até 100." },
                { codigo: "D2", topico: "Números", desc: "Identificar a posição de um número na sequência numérica até 100." },
                { codigo: "D3", topico: "Números", desc: "Comparar quantidades de dois conjuntos (mais, menos, igual)." },
                { codigo: "D4", topico: "Operações", desc: "Calcular adição com números até dois algarismos sem reagrupamento." },
                { codigo: "D5", topico: "Operações", desc: "Calcular subtração simples de dois algarismos." },
                { codigo: "D6", topico: "Geometria", desc: "Reconhecer figuras geométricas planas básicas (quadrado, retângulo, triângulo, círculo)." },
                { codigo: "D7", topico: "Medidas", desc: "Comparar comprimentos, massas e capacidades utilizando termos adequados." },
                { codigo: "D8", topico: "Medidas", desc: "Reconhecer dias da semana e meses do ano no calendário." },
                { codigo: "D9", topico: "Tratamento da Informação", desc: "Ler dados organizados em listas simples ou tabelas de 1 entrada." },
                { codigo: "D10", topico: "Moedas & Sistema", desc: "Identificar moedas e cédulas do sistema monetário brasileiro." },
                { codigo: "D11", topico: "Padrões", desc: "Identificar o elemento ausente em uma sequência de figuras ou números." },
                { codigo: "D12", topico: "Resolução de Problemas", desc: "Resolver problemas simples de juntar ou acrescentar com apoio de imagens." }
            ],
            science: [
                { codigo: "EF02CI01", topico: "Vida e Saúde", desc: "Identificar hábitos de higiene corporal necessários para a manutenção da saúde." },
                { codigo: "EF02CI02", topico: "Seres Vivos", desc: "Identificar plantas e animais do ambiente próximo e suas necessidades vitais." },
                { codigo: "EF02CI03", topico: "Terra e Solo", desc: "Reconhecer a importância do solo e da água para o cultivo de alimentos." },
                { codigo: "EF02CI04", topico: "Matéria e Materiais", desc: "Descrever posições e movimentos de objetos em relação ao observador." }
            ],
            humanas: [
                { codigo: "EF02HI01", topico: "História da Família", desc: "Reconhecer a história e os laços da comunidade e da família." },
                { codigo: "EF02GE01", topico: "Espaço Vivenciado", desc: "Descrever o trajeto da residência até a escola e os pontos de referência." }
            ]
        },
        'em': {
            portuguese: [
                { codigo: "D1_EM", topico: "Leitura Crítica", desc: "Inferir tema, tese e posicionamento crítico em textos de divulgação científica e artigos de opinião." },
                { codigo: "D2_EM", topico: "Argumentação", desc: "Avaliar a consistência dos argumentos e recursos persuasivos empregados no discurso dissertativo." },
                { codigo: "D3_EM", topico: "Intertextualidade", desc: "Reconhecer a apropriação e o diálogo estilístico e temático entre clássicos e obras contemporâneas." }
            ],
            math: [
                { codigo: "D1_EM", topico: "Funções e Modelos", desc: "Modelar e resolver problemas por meio de funções exponenciais e logarítmicas." },
                { codigo: "D2_EM", topico: "Geometria Espacial", desc: "Calcular áreas totais e volumes de prismas, pirâmides, cilindros, cones e esferas." },
                { codigo: "D3_EM", topico: "Probabilidade & Estatística", desc: "Calcular probabilidade condicional, desvio padrão e variância amostral em tomadas de decisão." }
            ],
            science: [
                { codigo: "EM13CNT101", topico: "Física e Química", desc: "Analisar e quantificar transformações termodinâmicas e conservação de energia em circuitos e máquinas térmicas." },
                { codigo: "EM13CNT202", topico: "Biologia e Ecologia", desc: "Avaliar impactos antrópicos, perda de biodiversidade e dinâmicas biogeoquímicas na Amazônia e no Cerrado." }
            ],
            humanas: [
                { codigo: "EM13CHS102", topico: "Sociedade e Política", desc: "Identificar as transformações no trabalho, geopolítica e direitos humanos na era da inteligência artificial e globalização." }
            ]
        },
        'oba': {
            portuguese: [
                { codigo: "OBA_L1", topico: "Leitura Científica", desc: "Interpretar relatórios de missões espaciais, dados de telescópios e artigos de astrofísica básica." }
            ],
            math: [
                { codigo: "OBA_M1", topico: "Cálculos Astronômicos", desc: "Calcular escalas astronômicas, distâncias relativas no Sistema Solar e velocidade orbital média." }
            ],
            science: [
                { codigo: "OBA_C1", topico: "Astronomia Básica", desc: "Compreender as leis de Kepler, a gravitação universal e a estrutura do Sistema Solar e das galáxias." },
                { codigo: "OBA_C2", topico: "Astronáutica", desc: "Reconhecer os princípios de foguetemodelismo, satélites de observação da Terra e o programa espacial brasileiro (CLA - Alcântara/MA)." }
            ],
            humanas: [
                { codigo: "OBA_H1", topico: "Geopolítica Espacial", desc: "Analisar a história da exploração espacial e o papel estratégico do Centro de Lançamento de Alcântara no Maranhão." }
            ]
        }
    };

    window.MASTER_EXHAUSTIVE_MATRICES = MASTER_EXHAUSTIVE_MATRICES;
    window.FULL_INEP_MATRICES = FULL_INEP_MATRICES;

    // -------------------------------------------------------------------------
    // 1. ALTERNÂNCIA ENTRE ABAS PRINCIPAIS (SAEB / BNCC)
    // -------------------------------------------------------------------------
    function switchMatrizMainTab(tab) {
        currentMatrizMainTab = tab;
        var btnSaeb = document.getElementById('btn-matriz-tab-saeb');
        var btnBncc = document.getElementById('btn-matriz-tab-bncc');
        var subSaeb = document.getElementById('subview-matriz-saeb');
        var subBncc = document.getElementById('subview-matriz-bncc');

        if (tab === 'saeb') {
            if (btnSaeb) {
                btnSaeb.classList.add('active');
                btnSaeb.style.background = '#6366f1';
                btnSaeb.style.color = '#ffffff';
                btnSaeb.style.border = 'none';
            }
            if (btnBncc) {
                btnBncc.classList.remove('active');
                btnBncc.style.background = 'var(--bg-secondary)';
                btnBncc.style.color = 'var(--text-secondary)';
                btnBncc.style.border = '1px solid var(--border-color)';
            }
            if (subSaeb) {
                subSaeb.classList.remove('hidden');
                subSaeb.style.display = 'block';
            }
            if (subBncc) {
                subBncc.classList.add('hidden');
                subBncc.style.display = 'none';
            }
            renderReferenceMatrix();
        } else {
            if (btnBncc) {
                btnBncc.classList.add('active');
                btnBncc.style.background = '#6366f1';
                btnBncc.style.color = '#ffffff';
                btnBncc.style.border = 'none';
            }
            if (btnSaeb) {
                btnSaeb.classList.remove('active');
                btnSaeb.style.background = 'var(--bg-secondary)';
                btnSaeb.style.color = 'var(--text-secondary)';
                btnSaeb.style.border = '1px solid var(--border-color)';
            }
            if (subSaeb) {
                subSaeb.classList.add('hidden');
                subSaeb.style.display = 'none';
            }
            if (subBncc) {
                subBncc.classList.remove('hidden');
                subBncc.style.display = 'block';
            }
            renderBnccSkillsTable();
        }
    }

    // -------------------------------------------------------------------------
    // 2. ALTERNÂNCIA DE ETAPAS (5º ANO, 9º ANO, ALFABETIZAÇÃO, EM, OBA)
    // -------------------------------------------------------------------------
    function switchMatrizEtapa(etapa) {
        activeMatrizEtapa = etapa;
        document.querySelectorAll('.matriz-etapa-btn').forEach(function(b) {
            if (b.getAttribute('data-etapa') === etapa) {
                b.classList.add('active');
                b.style.background = '#6366f1';
                b.style.color = '#fff';
                b.style.border = 'none';
                b.style.fontWeight = '700';
            } else {
                b.classList.remove('active');
                b.style.background = 'var(--bg-secondary)';
                b.style.color = 'var(--text-secondary)';
                b.style.border = '1px solid var(--border-color)';
                b.style.fontWeight = '600';
            }
        });
        renderReferenceMatrix();
    }

    // -------------------------------------------------------------------------
    // 3. FILTRAGEM E RENDERIZAÇÃO DA MATRIZ SAEB / SEAMA (4 COLUNAS)
    // -------------------------------------------------------------------------
    function filterMatrizDescritores() {
        renderReferenceMatrix();
    }

    function renderReferenceMatrix() {
        var lpList = document.getElementById('matriz-lp-list');
        var mtList = document.getElementById('matriz-mt-list');
        var ciList = document.getElementById('matriz-ci-list');
        var chList = document.getElementById('matriz-ch-list');

        if (!lpList && !mtList) return;

        var searchInput = document.getElementById('matriz-search-input');
        var query = searchInput ? searchInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        var stageData = MASTER_EXHAUSTIVE_MATRICES[activeMatrizEtapa] || MASTER_EXHAUSTIVE_MATRICES['5ano'] || {
            portuguese: [], math: [], science: [], humanas: []
        };

        // Fallback enriquecido de dados oficiais caso disponíveis
        var officialExcel = window.MATRIZ_DESCRITORES_EXCEL_DATA || (window.MATRIZES_DESCRITORES_BNCC_DATA && window.MATRIZES_DESCRITORES_BNCC_DATA.descritores);
        if (activeMatrizEtapa === '5ano' && officialExcel && officialExcel.visaoGeral) {
            var lpItems = officialExcel.visaoGeral.filter(function(d) { return d.disciplina && d.disciplina.toLowerCase().includes('portuguesa'); });
            var mtItems = officialExcel.visaoGeral.filter(function(d) { return d.disciplina && d.disciplina.toLowerCase().includes('matem'); });
            if (lpItems.length > 0) {
                stageData.portuguese = lpItems.map(function(d) { return { codigo: d.codigo, topico: d.topico || 'Geral', desc: d.descricao || d.desc }; });
            }
            if (mtItems.length > 0) {
                stageData.math = mtItems.map(function(d) { return { codigo: d.codigo, topico: d.topico || 'Geral', desc: d.descricao || d.desc }; });
            }
        }

        function renderColumn(container, items, badgeColor, componentName) {
            if (!container) return;
            container.innerHTML = '';

            var filtered = (items || []).filter(function(d) {
                var text = ((d.codigo || '') + ' ' + (d.desc || '') + ' ' + (d.topico || '')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return text.includes(query);
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 0.78rem;">Nenhum descritor encontrado para "' + componentName + '".</div>';
                return;
            }

            filtered.forEach(function(d) {
                var div = document.createElement('div');
                div.className = 'matriz-card-descritor';
                div.style.padding = '10px 14px';
                div.style.borderRadius = 'var(--radius-sm)';
                div.style.border = '1px solid var(--border-color)';
                div.style.backgroundColor = 'var(--bg-tertiary)';
                div.style.fontSize = '0.84rem';
                div.style.lineHeight = '1.45';
                div.style.transition = 'all 0.15s ease';
                div.style.marginBottom = '6px';
                div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                div.innerHTML = [
                    '<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">',
                    '    <span style="font-weight: 800; font-family: var(--font-mono); color: ' + badgeColor + '; font-size: 0.85rem;">' + d.codigo + '</span>',
                    '    ' + (d.topico ? '<span style="font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; background: rgba(99, 102, 241, 0.08); color: var(--text-secondary); border: 1px solid var(--border-color); font-weight: 600;">' + d.topico + '</span>' : ''),
                    '</div>',
                    '<div style="color: var(--text-primary); font-weight: 500;">' + d.desc + '</div>'
                ].join('');
                container.appendChild(div);
            });
        }

        renderColumn(lpList, stageData.portuguese, '#8b5cf6', 'Língua Portuguesa');
        renderColumn(mtList, stageData.math, '#3b82f6', 'Matemática');
        renderColumn(ciList, stageData.science, '#10b981', 'Ciências da Natureza');
        renderColumn(chList, stageData.humanas, '#f59e0b', 'Ciências Humanas / Geografia');
    }

    // -------------------------------------------------------------------------
    // 4. RENDERIZAÇÃO DA TABELA DE HABILIDADES BNCC OFICIAL
    // -------------------------------------------------------------------------
    function renderBnccSkillsTable() {
        var tbody = document.getElementById('bncc-skills-table-body');
        if (!tbody) return;

        var subjectSel = document.getElementById('bncc-subject-select');
        var stageSel = document.getElementById('bncc-stage-select');
        var searchInp = document.getElementById('bncc-search-input');

        var selectedSubject = subjectSel ? subjectSel.value.toLowerCase().trim() : '';
        var selectedStage = stageSel ? stageSel.value : 'all';
        var query = searchInp ? searchInp.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : '';

        var allSkills = [];

        // 1. Coleta da base oficial BNCC_HABILIDADES_OFICIAL
        if (typeof BNCC_HABILIDADES_OFICIAL !== 'undefined' && BNCC_HABILIDADES_OFICIAL) {
            if (BNCC_HABILIDADES_OFICIAL.ano2) allSkills.push.apply(allSkills, BNCC_HABILIDADES_OFICIAL.ano2.map(function(i) { return { codigo: i.codigoBncc, etapa: '2º Ano', disciplina: i.disciplina, objeto: i.objetoConhecimento, campo: i.unidadeTematica, descricao: i.descricao, status: i.status || 'Essencial' }; }));
            if (BNCC_HABILIDADES_OFICIAL.ano5) allSkills.push.apply(allSkills, BNCC_HABILIDADES_OFICIAL.ano5.map(function(i) { return { codigo: i.codigoBncc, etapa: '5º Ano', disciplina: i.disciplina, objeto: i.objetoConhecimento, campo: i.unidadeTematica, descricao: i.descricao, status: i.status || 'Essencial' }; }));
            if (BNCC_HABILIDADES_OFICIAL.ano9) allSkills.push.apply(allSkills, BNCC_HABILIDADES_OFICIAL.ano9.map(function(i) { return { codigo: i.codigoBncc, etapa: '9º Ano', disciplina: i.disciplina, objeto: i.objetoConhecimento, campo: i.unidadeTematica, descricao: i.descricao, status: i.status || 'Essencial' }; }));
        }

        // 2. Coleta da base MATRIZES_DESCRITORES_BNCC_DATA.bncc se necessário
        if (allSkills.length === 0 && window.MATRIZES_DESCRITORES_BNCC_DATA && window.MATRIZES_DESCRITORES_BNCC_DATA.bncc) {
            var db = window.MATRIZES_DESCRITORES_BNCC_DATA.bncc;
            if (db.segundoAno) allSkills.push.apply(allSkills, db.segundoAno.map(function(i) { return Object.assign({}, i, { etapa: '2º Ano' }); }));
            if (db.quintoAno) allSkills.push.apply(allSkills, db.quintoAno.map(function(i) { return Object.assign({}, i, { etapa: '5º Ano' }); }));
            if (db.nonoAno) allSkills.push.apply(allSkills, db.nonoAno.map(function(i) { return Object.assign({}, i, { etapa: '9º Ano' }); }));
        }

        var filtered = allSkills.filter(function(item) {
            var itemDisc = (item.disciplina || '').toLowerCase();
            if (selectedSubject && !itemDisc.includes(selectedSubject) && !selectedSubject.includes(itemDisc)) {
                return false;
            }
            if (selectedStage !== 'all') {
                var stageClean = selectedStage.replace('EF', '').replace('º', '').replace('Ano', '').trim();
                var itemEtapaClean = (item.etapa || '').replace('EF', '').replace('º', '').replace('Ano', '').trim();
                if (stageClean && !itemEtapaClean.includes(stageClean)) {
                    return false;
                }
            }
            if (query) {
                var text = ((item.codigo || '') + ' ' + (item.descricao || '') + ' ' + (item.campo || '') + ' ' + (item.objeto || '') + ' ' + (item.disciplina || '')).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return text.includes(query);
            }
            return true;
        });

        tbody.innerHTML = '';

        if (filtered.length === 0) {
            tbody.innerHTML = [
                '<tr>',
                '    <td colspan="5" style="padding: 28px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">',
                '        Nenhuma habilidade encontrada para os filtros selecionados.',
                '    </td>',
                '</tr>'
            ].join('');
            return;
        }

        var rowsHtml = filtered.map(function(item) {
            var statusBadge = item.status === 'Essencial' ? 'badge-danger' : 'badge-purple';
            return [
                '<tr style="border-bottom: 1px solid var(--border-color); font-size: 0.82rem;">',
                '    <td style="padding: 12px 16px; font-weight: 800; font-family: var(--font-mono); color: #6366f1;">' + (item.codigo || item.codigoBncc || '—') + '</td>',
                '    <td style="padding: 12px 16px; font-weight: 700; color: var(--text-primary);">' + (item.etapa || 'Geral') + '</td>',
                '    <td style="padding: 12px 16px;">',
                '        <div style="font-weight: 700; color: var(--text-primary);">' + (item.objeto || item.campo || '—') + '</div>',
                '        <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">' + (item.campo || item.disciplina || '') + '</div>',
                '    </td>',
                '    <td style="padding: 12px 16px; color: var(--text-primary); line-height: 1.45;">' + (item.descricao || '—') + '</td>',
                '    <td style="padding: 12px 16px; text-align: center;">',
                '        <span class="badge ' + statusBadge + '" style="font-size: 0.7rem; padding: 4px 8px; font-weight: 700;">' + (item.status || 'BNCC Oficial') + '</span>',
                '    </td>',
                '</tr>'
            ].join('');
        });

        tbody.innerHTML = rowsHtml.join('');
    }

    // -------------------------------------------------------------------------
    // 5. HELPER INICIALIZADOR DE DESCRITORES
    // -------------------------------------------------------------------------
    function initInepDescriptors() {
        var list = [];
        FULL_INEP_MATRICES.portuguese.forEach(function(d) {
            list.push({ codigo: d.codigo, etapa: "5º e 9º Ano", desc: d.desc, componente: "Língua Portuguesa" });
        });
        FULL_INEP_MATRICES.math.forEach(function(d) {
            list.push({ codigo: d.codigo, etapa: "5º e 9º Ano", desc: d.desc, componente: "Matemática" });
        });
        FULL_INEP_MATRICES.science.forEach(function(d) {
            list.push({ codigo: d.codigo, etapa: "5º e 9º Ano", desc: d.desc, componente: "Ciências da Natureza" });
        });
        return list;
    }

    // -------------------------------------------------------------------------
    // EXPOSIÇÃO GLOBAL COM COMPATIBILIDADE TOTAL
    // -------------------------------------------------------------------------
    window.switchMatrizMainTab = switchMatrizMainTab;
    window.switchMatrizEtapa = switchMatrizEtapa;
    window.filterMatrizDescritores = filterMatrizDescritores;
    window.renderReferenceMatrix = renderReferenceMatrix;
    window.renderBnccSkillsTable = renderBnccSkillsTable;
    window.initInepDescriptors = initInepDescriptors;

    // Inicialização automática ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            if (typeof renderReferenceMatrix === 'function') renderReferenceMatrix();
        });
    } else {
        setTimeout(function() {
            if (typeof renderReferenceMatrix === 'function') renderReferenceMatrix();
        }, 100);
    }

})(typeof window !== 'undefined' ? window : this, typeof document !== 'undefined' ? document : {});
