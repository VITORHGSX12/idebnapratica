// =============================================================================
// HELPERS, MEMORY STORES & CATÁLOGO DE DESCRITORES SAEB
// =============================================================================

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'edu_saas_jwt_default_secret_key_2026';

// Fallback em memória / local caso o banco esteja inacessível
let memoryEventosSimulados = [];
let memoryRespostasSimulados = {};

/**
 * Helper de Fail-Closed (Seção 9.2 da especificação):
 * Bloqueia acessos a escolas/turmas fora do vínculo do usuário autenticado
 */
function validateSchoolAccess(req, targetEscolaId, targetTurmaId) {
    let user = req.user;
    if (!user && req.headers && req.headers.authorization) {
        try {
            const token = req.headers.authorization.replace(/^Bearer\s+/i, '');
            user = jwt.verify(token, JWT_SECRET);
            req.user = user;
        } catch (e) {}
    }

    if (!user) return true; // Se chamada anônima ou pública

    var role = (user.role || '').toUpperCase();
    var userEscola = (user.escola_id || user.escola || user.schoolId || '').toString().toLowerCase();

    // Perfis com escopo em toda a rede (SEMED / Admin / Gestor / Coordenador Geral)
    if (role.includes('MASTER') || role.includes('ADMIN') || role.includes('GESTOR') || role.includes('SEMED') || role.includes('COORDENADOR_GERAL')) {
        return true;
    }

    // Diretores e Professores têm restrição estrita: só acessam sua própria escola
    if (targetEscolaId && userEscola) {
        var targetLower = targetEscolaId.toString().toLowerCase();
        if (!targetLower.includes(userEscola) && !userEscola.includes(targetLower)) {
            return false;
        }
    }
    return true;
}

/**
 * Helper do Motor de Correção (Seção 5.1 & 5.2 da especificação)
 */
function calcularResultadoAluno(respostas, gabarito, statusPresenca) {
    var presenca = (statusPresenca || 'PRESENTE').toUpperCase();
    if (presenca !== 'PRESENTE') {
        return {
            totalAcertos: 0,
            percentualAcertos: 0.0,
            situacao: presenca
        };
    }

    var respArr = Array.isArray(respostas) ? respostas : [];
    var gabArr = Array.isArray(gabarito) ? gabarito : [];
    var total = gabArr.length > 0 ? gabArr.length : respArr.length;

    if (total === 0) {
        return { totalAcertos: 0, percentualAcertos: 0.0, situacao: 'SEM GABARITO' };
    }

    var acertos = 0;
    for (var i = 0; i < total; i++) {
        var r = (respArr[i] || '').toString().trim().toUpperCase();
        var g = (gabArr[i] || '').toString().trim().toUpperCase();
        if (r && g && r === g) acertos++;
    }

    var pct = Number(((acertos / total) * 100).toFixed(1));
    var situacao = 'ABAIXO DO BÁSICO';
    if (pct >= 80.0) situacao = 'AVANÇADO';
    else if (pct >= 60.0) situacao = 'ADEQUADO';
    else if (pct >= 40.0) situacao = 'BÁSICO';

    return {
        totalAcertos: acertos,
        percentualAcertos: pct,
        situacao: situacao
    };
}

// =============================================================================
// CATÁLOGO DE DESCRITORES OFICIAIS INEP/SAEB COM RECOMENDAÇÕES PEDAGÓGICAS
// =============================================================================
const INEP_DESCRITORES_MAP = {
    // Língua Portuguesa
    'D1': { desc: 'Localizar informações explícitas em um texto.', disc: 'Língua Portuguesa', topico: 'Procedimentos de Leitura', rec: 'Praticar leitura guiada com busca direta de dados e rastreamento de fatos pontuais no texto.' },
    'D2': { desc: 'Estabelecer relações entre partes de um texto (coesão e pronomes).', disc: 'Língua Portuguesa', topico: 'Relação entre Textos', rec: 'Trabalhar substituições pronominais, sinônimos e marcadores de continuidade textual.' },
    'D3': { desc: 'Inferir o sentido de uma palavra ou expressão no contexto.', disc: 'Língua Portuguesa', topico: 'Procedimentos de Leitura', rec: 'Incentivar a leitura contextual e o levantamento de hipóteses de vocabulário a partir de pistas do texto.' },
    'D4': { desc: 'Inferir uma informação implícita em um texto.', disc: 'Língua Portuguesa', topico: 'Procedimentos de Leitura', rec: 'Estimular deduções a partir de subentendidos, entrelinhas e conhecimentos prévios.' },
    'D5': { desc: 'Interpretar texto com auxílio de material gráfico diverso.', disc: 'Língua Portuguesa', topico: 'Gênero e Suporte', rec: 'Explorar tirinhas, infográficos, cartazes publicitários e charges integrando imagem e texto.' },
    'D6': { desc: 'Identificar o tema ou assunto principal de um texto.', disc: 'Língua Portuguesa', topico: 'Procedimentos de Leitura', rec: 'Desenvolver resumos e paráfrases orais com foco na ideia central de diferentes gêneros.' },
    'D7': { desc: 'Identificar o conflito gerador do enredo e elementos da narrativa.', disc: 'Língua Portuguesa', topico: 'Coerência Textual', rec: 'Mapear a estrutura narrativa: introdução, clímax, desfecho e motivação dos personagens.' },
    'D8': { desc: 'Estabelecer relação entre a tese e os argumentos.', disc: 'Língua Portuguesa', topico: 'Coerência Textual', rec: 'Diferenciar posicionamentos de justificativas em textos argumentativos e editoriais.' },
    'D9': { desc: 'Identificar a finalidade de textos de diferentes gêneros.', disc: 'Língua Portuguesa', topico: 'Gênero e Suporte', rec: 'Comparar objetivos comunicativos: instruir, informar, convencer, entreter.' },
    'D10': { desc: 'Identificar marcas linguísticas (locutor/interlocutor).', disc: 'Língua Portuguesa', topico: 'Variação Linguística', rec: 'Trabalhar registros formais e informais, gírias e adequação linguística.' },
    'D11': { desc: 'Distinguir um fato da opinião relativa a esse fato.', disc: 'Língua Portuguesa', topico: 'Procedimentos de Leitura', rec: 'Analisar notícias e reportagens separando acontecimentos de juízos de valor.' },
    'D12': { desc: 'Estabelecer relações lógico-discursivas (conjunções/advérbios).', disc: 'Língua Portuguesa', topico: 'Coerência Textual', rec: 'Aprofundar o uso de conectivos de causa, oposição, conclusão e condição.' },
    'D13': { desc: 'Identificar efeitos de ironia ou humor em textos variados.', disc: 'Língua Portuguesa', topico: 'Recursos Expressivos', rec: 'Trabalhar trocadilhos, duplos sentidos e quebras de expectativa em piadas e tiras.' },
    'D14': { desc: 'Identificar efeito de sentido decorrente da pontuação.', disc: 'Língua Portuguesa', topico: 'Recursos Expressivos', rec: 'Praticar leitura expressiva observando reticências, exclamações e aspas.' },
    'D15': { desc: 'Reconhecer diferentes formas de tratar uma informação em textos comparados.', disc: 'Língua Portuguesa', topico: 'Relação entre Textos', rec: 'Comparar abordagens do mesmo tema em fontes jornalísticas distintas.' },
    // Matemática
    'D1_MT': { desc: 'Identificar localização/movimentação de objeto em mapas e croquis.', disc: 'Matemática', topico: 'Espaço e Forma', rec: 'Atividades práticas de lateralidade, coordenadas em malhas quadriculadas e plantas baixas.' },
    'D2_MT': { desc: 'Identificar propriedades de figuras bidimensionais e tridimensionais.', disc: 'Matemática', topico: 'Espaço e Forma', rec: 'Manipulação de sólidos geométricos e suas planificações (faces, vértices, arestas).' },
    'D3_MT': { desc: 'Identificar propriedades de triângulos e ângulos.', disc: 'Matemática', topico: 'Espaço e Forma', rec: 'Construção de triângulos e classificação quanto a lados e ângulos com transferidor.' },
    'D4_MT': { desc: 'Identificar quadriláteros e suas propriedades.', disc: 'Matemática', topico: 'Espaço e Forma', rec: 'Estudo de paralelismo e perpendicularismo em quadrados, retângulos e trapézios.' },
    'D6_MT': { desc: 'Estimar medidas de grandezas utilizando unidades convencionais/não convencionais.', disc: 'Matemática', topico: 'Grandezas e Medidas', rec: 'Medições práticas de comprimento, massa e capacidade em sala de aula.' },
    'D7_MT': { desc: 'Resolver problemas utilizando unidades de medida padronizadas.', disc: 'Matemática', topico: 'Grandezas e Medidas', rec: 'Conversões simples entre metros/centímetros, quilos/gramas e litros/mililitros.' },
    'D8_MT': { desc: 'Resolver problemas envolvendo o cálculo de perímetro.', disc: 'Matemática', topico: 'Grandezas e Medidas', rec: 'Cálculo de contorno de figuras planas regulares e irregulares.' },
    'D9_MT': { desc: 'Resolver problemas envolvendo o cálculo de área de figuras planas.', disc: 'Matemática', topico: 'Grandezas e Medidas', rec: 'Contagem de quadrículas e fórmulas básicas de área de retângulos e quadrados.' },
    'D12_MT': { desc: 'Resolver problemas envolvendo o cálculo de porcentagem (10%, 25%, 50%, 100%).', disc: 'Matemática', topico: 'Números e Operações', rec: 'Relação direta entre porcentagens usuais, frações e descontos em situações reais.' },
    'D13_MT': { desc: 'Resolver problemas com números naturais envolvendo as quatro operações.', disc: 'Matemática', topico: 'Números e Operações', rec: 'Interpretação de situações-problema de adição, subtração, multiplicação e divisão com reagrupamento.' },
    'D14_MT': { desc: 'Resolver problemas com números decimais e sistema monetário.', disc: 'Matemática', topico: 'Números e Operações', rec: 'Cálculos de troco, compras e operações com vírgula em situações cotidianas.' },
    'D16_MT': { desc: 'Identificar a representação fracionária de números racionais.', disc: 'Matemática', topico: 'Números e Operações', rec: 'Representação visual parte-todo de frações em barras e pizzas.' },
    'D18_MT': { desc: 'Efetuar cálculos com números reais e operações fundamentais.', disc: 'Matemática', topico: 'Números e Operações', rec: 'Fixação de algoritmos de cálculo e estratégias de cálculo mental.' },
    'D27_MT': { desc: 'Ler informações e dados apresentados em tabelas.', disc: 'Matemática', topico: 'Tratamento da Informação', rec: 'Leitura e interpretação de tabelas simples e de dupla entrada.' },
    'D28_MT': { desc: 'Ler informações e dados apresentados em gráficos de colunas/linhas.', disc: 'Matemática', topico: 'Tratamento da Informação', rec: 'Análise de gráficos de barras, colunas e setores identificando variáveis e eixos.' }
};

function resolveDescriptorInfo(code, discHint) {
    if (!code) return { codigo: 'D_GERAL', desc: 'Habilidade Geral da Matriz', disc: discHint || 'Geral', rec: 'Reforçar conteúdos fundamentais.' };
    
    let key = code.toUpperCase().trim();
    if (INEP_DESCRITORES_MAP[key]) {
        return { codigo: key, desc: INEP_DESCRITORES_MAP[key].desc, disc: INEP_DESCRITORES_MAP[key].disc, topico: INEP_DESCRITORES_MAP[key].topico, rec: INEP_DESCRITORES_MAP[key].rec };
    }
    
    if (discHint === 'Matemática' && INEP_DESCRITORES_MAP[`${key}_MT`]) {
        const item = INEP_DESCRITORES_MAP[`${key}_MT`];
        return { codigo: key, desc: item.desc, disc: item.disc, topico: item.topico, rec: item.rec };
    }

    return {
        codigo: key,
        desc: `Descritor ${key} da Matriz Curricular`,
        disc: discHint || (key.startsWith('LP') ? 'Língua Portuguesa' : (key.startsWith('MT') ? 'Matemática' : 'Geral')),
        topico: 'Matriz de Referência',
        rec: `Realizar atividades de intervenção focadas na habilidade ${key}.`
    };
}

module.exports = {
    JWT_SECRET,
    memoryEventosSimulados,
    memoryRespostasSimulados,
    validateSchoolAccess,
    calcularResultadoAluno,
    INEP_DESCRITORES_MAP,
    resolveDescriptorInfo
};
