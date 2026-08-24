const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('=== COMPILANDO BASE COMPLETA DO IDEB MARANHÃO (217 MUNICÍPIOS E 4.799 ESCOLAS) ===\n');

const munPath = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'idebmaranhao', 'IDEB_Maranhao_Municipios_2015-2025.xlsx');
const escPath = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'escolasmaranahoideb', 'IDEB_Maranhao_Escolas_2015-2025.xlsx');

const URE_MAPPING = {
    "URE Açailândia": ["Açailândia", "Bom Jesus das Selvas", "Buriticupu", "Cidelândia", "Itinga do Maranhão", "São Francisco do Brejão", "São Pedro da Água Branca", "Vila Nova dos Martírios"],
    "URE Bacabal": ["Bacabal", "Altamira do Maranhão", "Alto Alegre do Maranhão", "Bom Lugar", "Brejo de Areia", "Conceição do Lago-Açu", "Lago Verde", "Marajá do Sena", "Olho d'Água das Cunhãs", "Paulo Ramos", "São Luís Gonzaga do Maranhão", "São Mateus do Maranhão", "Vitorino Freire"],
    "URE Balsas": ["Balsas", "Alto Parnaíba", "Carolina", "Feira Nova do Maranhão", "Fortaleza dos Nogueiras", "Loreto", "Nova Colinas", "Riachão", "Sambaíba", "São Félix de Balsas", "São Pedro dos Crentes", "São Raimundo das Mangabeiras", "Tasso Fragoso"],
    "URE Barra do Corda": ["Barra do Corda", "Fernando Falcão", "Grajaú", "Itaipava do Grajaú", "Jenipapo dos Vieiras", "Mirador"],
    "URE Caxias": ["Caxias", "Aldeias Altas", "Afonso Cunha", "Coelho Neto", "Duque Bacelar", "São João do Sóter"],
    "URE Chapadinha": ["Chapadinha", "Anapurus", "Belágua", "Brejo", "Buriti", "Itapera", "Mata Roma", "Milagres do Maranhão", "Santa Quitéria do Maranhão", "Santana do Maranhão", "São Benedito do Rio Preto", "Urbano Santos"],
    "URE Codó": ["Codó", "Coroatá", "Peritoró", "Timbiras"],
    "URE Imperatriz": ["Imperatriz", "Amarante do Maranhão", "Buritirana", "Davinópolis", "Governador Edison Lobão", "João Lisboa", "Lajeado Novo", "Montes Altos", "Ribamar Fiquene", "Senador La Rocque", "Sítio Novo"],
    "URE Itapecuru-Mirim": ["Itapecuru-Mirim", "Anajatuba", "Cantanhede", "Matões do Norte", "Miranda do Norte", "Nina Rodrigues", "Pirapemas", "Presidente Juscelino", "Santa Rita", "Vargem Grande"],
    "URE Pedreiras": ["Pedreiras", "Bernardo do Mearim", "Capinzal do Norte", "Esperantinópolis", "Igarapé Grande", "Joselândia", "Lago do Junco", "Lago dos Rodrigues", "Lima Campos", "Poção de Pedras", "Santo Antônio dos Lopes", "São Raimundo do Doca Bezerra", "São Roberto", "Trizidela do Vale"],
    "URE Pinheiro": ["Pinheiro", "Bacuri", "Bequimão", "Central do Maranhão", "Guimarães", "Mirinzal", "Palmeirândia", "Pedro do Rosário", "Peri Mirim", "Porto Rico do Maranhão", "Presidente Sarney", "Santa Helena", "São Bento", "Turiaçu", "Turilândia"],
    "URE Presidente Dutra": ["Presidente Dutra", "Dom Pedro", "Gonçalves Dias", "Governador Archer", "Governador Eugênio Barros", "Governador Luiz Rocha", "Graça Aranha", "São Domingos do Maranhão", "São José dos Basílios", "Senador Alexandre Costa", "Tuntum"],
    "URE Rosário": ["Rosário", "Axixá", "Bacabeira", "Cachoeira Grande", "Humberto de Campos", "Icatu", "Morros", "Presidente Juscelino", "Primeira Cruz", "Santo Amaro do Maranhão"],
    "URE Santa Inês": ["Santa Inês", "Bela Vista do Maranhão", "Bom Jardim", "Igarapé do Meio", "Monção", "Nova Olinda do Maranhão", "Pindaré-Mirim", "Pio XII", "Santa Luzia", "Santa Luzia do Paruá", "São Inácio do Maranhão", "São João do Carú", "Tufilândia", "Zé Doca"],
    "URE São João dos Patos": ["São João dos Patos", "Barão de Grajaú", "Benedito Leite", "Jatobá", "Lagoa do Mato", "Nova Iorque", "Paraibano", "Passagem Franca", "Pastos Bons", "Pocinhos do Maranhão", "São Francisco do Maranhão", "Sucupira do Norte", "Sucupira do Riachão"],
    "URE São Luís": ["São Luís", "Alcântara", "Paço do Lumiar", "Raposa", "São José de Ribamar"],
    "URE Timon": ["Timon", "Matões", "Parnarama"],
    "URE Viana": ["Viana", "Cajari", "Matinha", "Monção", "Olinda Nova do Maranhão", "Penalva", "São João Batista", "São Vicente Ferrer"],
    "URE Zé Doca": ["Zé Doca", "Amandaba", "Araguanã", "Centro do Guilherme", "Centro Novo do Maranhão", "Godofredo Viana", "Governador Nunes Freire", "Junco do Maranhão", "Luís Domingues", "Maracaçumé", "Maranhãozinho", "Presidente Médici", "Santa Luzia do Paruá"]
};

function getUreForCityName(cityName) {
    const norm = (cityName || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    for (const [ure, cities] of Object.entries(URE_MAPPING)) {
        for (const c of cities) {
            const normC = c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
            if (norm === normC || norm.includes(normC) || normC.includes(norm)) {
                return ure;
            }
        }
    }
    return "URE Presidente Dutra";
}

function parseVal(v) {
    if (v === undefined || v === null || v === '' || v === '-' || v === 'ND' || v === 'Sem dado') return null;
    const num = parseFloat(String(v).replace(',', '.'));
    return isNaN(num) ? null : Number(num.toFixed(2));
}

// 1. Processar Municípios
const wbMun = xlsx.readFile(munPath);
const rowsAI = xlsx.utils.sheet_to_json(wbMun.Sheets['Anos Iniciais'], { header: 1 });
const rowsAF = xlsx.utils.sheet_to_json(wbMun.Sheets['Anos Finais'], { header: 1 });

const munIniciais = [];
const munFinais = [];

for (let i = 4; i < rowsAI.length; i++) {
    const r = rowsAI[i];
    if (!r || !r[1]) continue;
    munIniciais.push({
        codigoInep: String(r[0] || '').trim(),
        municipio: String(r[1]).trim(),
        ure: getUreForCityName(String(r[1]).trim()),
        y2015: parseVal(r[2]),
        y2017: parseVal(r[3]),
        y2019: parseVal(r[4]),
        y2021: parseVal(r[5]),
        y2023: parseVal(r[6]),
        y2025: parseVal(r[7])
    });
}

for (let i = 4; i < rowsAF.length; i++) {
    const r = rowsAF[i];
    if (!r || !r[1]) continue;
    munFinais.push({
        codigoInep: String(r[0] || '').trim(),
        municipio: String(r[1]).trim(),
        ure: getUreForCityName(String(r[1]).trim()),
        y2015: parseVal(r[2]),
        y2017: parseVal(r[3]),
        y2019: parseVal(r[4]),
        y2021: parseVal(r[5]),
        y2023: parseVal(r[6]),
        y2025: parseVal(r[7])
    });
}

// 2. Processar Escolas
const wbEsc = xlsx.readFile(escPath);
const rowsEsc = xlsx.utils.sheet_to_json(wbEsc.Sheets['Escolas MA - IDEB'], { header: 1 });
const escolasList = [];

for (let i = 5; i < rowsEsc.length; i++) {
    const r = rowsEsc[i];
    if (!r || !r[0] || !r[1]) continue;

    const inep = String(r[0]).trim();
    const nome = String(r[1]).trim();
    const mun = String(r[2]).trim();
    const codMun = String(r[3] || '').trim();
    const rede = String(r[4] || 'Municipal').trim();

    escolasList.push({
        inep: inep,
        nome: nome,
        municipio: mun,
        codigo_municipio: codMun,
        rede: rede,
        ure: getUreForCityName(mun),
        ai_2015: parseVal(r[5]),
        ai_2017: parseVal(r[6]),
        ai_2019: parseVal(r[7]),
        ai_2021: parseVal(r[8]),
        ai_2023: parseVal(r[9]),
        ai_2025: parseVal(r[10]),
        af_2015: parseVal(r[11]),
        af_2017: parseVal(r[12]),
        af_2019: parseVal(r[13]),
        af_2021: parseVal(r[14]),
        af_2023: parseVal(r[15]),
        af_2025: parseVal(r[16])
    });
}

console.log(`Dados extraídos: ${munIniciais.length} municípios (iniciais), ${munFinais.length} municípios (finais), ${escolasList.length} escolas.`);

// 3. Gravar ideb_maranhao_oficial_2015_2025.js
const idebMunJs = `// Base Oficial INEP do IDEB Maranhão (${munIniciais.length} Municípios)
var root = (typeof window !== 'undefined') ? window : ((typeof global !== 'undefined') ? global : this);
root.IDEB_MARANHAO_MUNICIPIOS = {
    iniciais: ${JSON.stringify(munIniciais, null, 2)},
    finais: ${JSON.stringify(munFinais, null, 2)}
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.IDEB_MARANHAO_MUNICIPIOS;
}
`;
fs.writeFileSync(path.join(__dirname, '..', 'ideb_maranhao_oficial_2015_2025.js'), idebMunJs, 'utf8');

// 4. Gravar escolas_maranhao_oficial_2015_2025.js
const escolJs = `// Base Oficial INEP do IDEB por Escola — Maranhão (${escolasList.length} Escolas)
var root = (typeof window !== 'undefined') ? window : ((typeof global !== 'undefined') ? global : this);
root.ESCOLAS_MARANHAO_OFICIAL = ${JSON.stringify(escolasList, null, 2)};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.ESCOLAS_MARANHAO_OFICIAL;
}
`;
fs.writeFileSync(path.join(__dirname, '..', 'escolas_maranhao_oficial_2015_2025.js'), escolJs, 'utf8');

console.log('✅ ideb_maranhao_oficial_2015_2025.js e escolas_maranhao_oficial_2015_2025.js foram atualizados com sucesso!');
