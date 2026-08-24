const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

console.log('=== PROCESSANDO BASE OFICIAL DO IDEB MARANHÃO (MUNICÍPIOS E ESCOLAS) ===\n');

const munPath = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'idebmaranhao', 'IDEB_Maranhao_Municipios_2015-2025.xlsx');
const escPath = path.join('C:', 'Users', 'Alleg', 'OneDrive', 'Área de Trabalho', 'DOCUMENTOS', 'escolasmaranahoideb', 'IDEB_Maranhao_Escolas_2015-2025.xlsx');

if (!fs.existsSync(munPath) || !fs.existsSync(escPath)) {
    console.error('Arquivos não encontrados:', { munPath, escPath });
    process.exit(1);
}

// 1. Mapeamento das 19 UREs do Maranhão com seus respectivos municípios
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

// Obter URE por nome da cidade
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

// 2. Extrair Municípios
const wbMun = xlsx.readFile(munPath);
const sheetAI = wbMun.Sheets['Anos Iniciais'];
const sheetAF = wbMun.Sheets['Anos Finais'];

const rowsAI = xlsx.utils.sheet_to_json(sheetAI, { header: 1 });
const rowsAF = xlsx.utils.sheet_to_json(sheetAF, { header: 1 });

function parseValue(v) {
    if (v === undefined || v === null || v === '' || v === '-' || v === 'ND' || v === 'Sem dado') return null;
    const num = parseFloat(String(v).replace(',', '.'));
    return isNaN(num) ? null : Number(num.toFixed(2));
}

const municipiosMap = {};

// Parse Anos Iniciais (linha 5 em diante, index 4)
for (let i = 4; i < rowsAI.length; i++) {
    const r = rowsAI[i];
    if (!r || !r[1]) continue;
    const code = String(r[0] || '').trim();
    const name = String(r[1]).trim();
    
    if (!municipiosMap[name]) {
        municipiosMap[name] = {
            codigo: code,
            municipio: name,
            ure: getUreForCityName(name),
            anosIniciais: {},
            anosFinais: {}
        };
    }
    municipiosMap[name].anosIniciais = {
        y2015: parseValue(r[2]),
        y2017: parseValue(r[3]),
        y2019: parseValue(r[4]),
        y2021: parseValue(r[5]),
        y2023: parseValue(r[6]),
        y2025: parseValue(r[7])
    };
}

// Parse Anos Finais (linha 5 em diante, index 4)
for (let i = 4; i < rowsAF.length; i++) {
    const r = rowsAF[i];
    if (!r || !r[1]) continue;
    const name = String(r[1]).trim();
    if (!municipiosMap[name]) {
        municipiosMap[name] = {
            codigo: String(r[0] || '').trim(),
            municipio: name,
            ure: getUreForCityName(name),
            anosIniciais: {},
            anosFinais: {}
        };
    }
    municipiosMap[name].anosFinais = {
        y2015: parseValue(r[2]),
        y2017: parseValue(r[3]),
        y2019: parseValue(r[4]),
        y2021: parseValue(r[5]),
        y2023: parseValue(r[6]),
        y2025: parseValue(r[7])
    };
}

const municipiosList = Object.values(municipiosMap);
console.log(`✅ ${municipiosList.length} Municípios do Maranhão processados.`);

// 3. Extrair Escolas
const wbEsc = xlsx.readFile(escPath);
const sheetEsc = wbEsc.Sheets['Escolas MA - IDEB'];
const rowsEsc = xlsx.utils.sheet_to_json(sheetEsc, { header: 1 });

const escolasList = [];

// Header na linha 5 (index 4), dados a partir da linha 6 (index 5)
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
        anosIniciais: {
            y2015: parseValue(r[5]),
            y2017: parseValue(r[6]),
            y2019: parseValue(r[7]),
            y2021: parseValue(r[8]),
            y2023: parseValue(r[9]),
            y2025: parseValue(r[10])
        },
        anosFinais: {
            y2015: parseValue(r[11]),
            y2017: parseValue(r[12]),
            y2019: parseValue(r[13]),
            y2021: parseValue(r[14]),
            y2023: parseValue(r[15]),
            y2025: parseValue(r[16])
        }
    });
}

console.log(`✅ ${escolasList.length} Escolas do Maranhão processadas.`);

// 4. Salvar base completa estruturada em js/data/ideb_maranhao_official_dataset.js
const datasetJs = `// Base Oficial INEP do IDEB Maranhão (217 Municípios e 4.798 Escolas - Ciclos 2015 a 2025)
window.IDEB_MARANHAO_DATASET = {
    exportedAt: "${new Date().toISOString()}",
    totalMunicipios: ${municipiosList.length},
    totalEscolas: ${escolasList.length},
    uresMapping: ${JSON.stringify(URE_MAPPING, null, 2)},
    municipios: ${JSON.stringify(municipiosList, null, 2)},
    escolas: ${JSON.stringify(escolasList, null, 2)}
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.IDEB_MARANHAO_DATASET;
}
`;

fs.writeFileSync(path.join(__dirname, '..', 'js', 'data', 'ideb_maranhao_official_dataset.js'), datasetJs, 'utf8');
console.log('✅ Arquivo js/data/ideb_maranhao_official_dataset.js gerado com sucesso!');
