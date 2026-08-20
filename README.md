# Dashboard Executivo SEMED Gonçalves Dias - MA (IDEB / SAEB / INEP)

Painel de Gestão Executiva para acompanhamento de indicadores pedagógicos, metas pactuadas do ciclo do IDEB, proficiência do SAEB e acompanhamento do desempenho por unidades escolares da rede municipal.

---

## 🏗️ Arquitetura do Projeto

O projeto foi reestruturado de um arquivo HTML único para uma arquitetura **modular, leve e sustentável baseada em Vite + ES Modules (Vanilla JS/CSS)**:

```
gestao-educacional-saas/
├── dashboard-semed.html      # Página HTML principal do dashboard executivo
├── src/
│   ├── data/                 # Dados normalizados consumidos pelo Dashboard
│   │   ├── schools.json      # Dados de escolas da rede (multi-município/multi-rede)
│   │   ├── ideb_timeline.json# Histórico geral (2015-2025 + Simulados)
│   │   ├── ideb_etapas.json  # Anos Iniciais x Anos Finais (2007-2025)
│   │   └── saeb_proficiencia.json # Indicador de Aprendizado e Escalas SAEB
│   ├── styles/
│   │   ├── main.css          # Reset, variáveis e cabeçalho executivo
│   │   ├── components.css    # KPI Cards, Goal Tracker, Tabela de Escolas e Escalas
│   │   └── charts.css        # Containers responsivos do Chart.js
│   ├── components/           # Componentes modulares da interface JS
│   │   ├── header.js
│   │   ├── kpiCards.js
│   │   ├── goalTracker.js
│   │   ├── schoolsTable.js
│   │   └── escalaAprendizado.js
│   ├── charts/               # Instâncias e configurações do Chart.js
│   │   ├── chartTimeline.js
│   │   ├── chartEtapas.js
│   │   └── chartSaebEvo.js
│   └── main.js               # Ponto de entrada que conecta dados e componentes
├── scripts/
│   └── import_inep_csv.js    # Script ETL Node.js para converter CSVs do INEP em JSON
└── README.md
```

---

## 📊 Fontes Oficiais de Dados do INEP

O INEP não disponibiliza uma API REST pública em tempo real para dados do IDEB/SAEB. Os dados são publicados no formato de planilhas e microdados a cada 2 anos (ou anualmente para o Censo Escolar).

### Onde Baixar Cada Planilha

1. **Consulta IDEB (Resultados por Escola e Município)**:
   - **URL Oficial**: [https://divulgacao.inep.gov.br/](https://divulgacao.inep.gov.br/) ou [https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados](https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/ideb/resultados)
   - **Arquivo**: Baixar a planilha no formato `.xlsx` ou `.csv` da etapa desejada (ex: *Divulgação Anos Iniciais Escolas 2023.xlsx* ou *Divulgação Anos Finais Escolas 2023.xlsx*).
   - **Exportação**: Salvar como CSV separado por vírgula ou ponto e vírgula.

2. **Microdados do SAEB (Proficiência e Alunos)**:
   - **URL Oficial**: [https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/saeb](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/saeb)
   - **Arquivo**: Baixar os microdados da edição desejada (ex: *Microdados SAEB 2023.zip*).

3. **Censo Escolar (Matrículas, Fluxo e Situação das Escolas)**:
   - **URL Oficial**: [https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar](https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/censo-escolar)
   - **Arquivo**: Baixar os microdados ou resumos estatísticos por município.

---

## 🔄 Como Atualizar os Dados do Dashboard sem Mexer no Código

Sempre que o INEP publicar um novo ciclo do IDEB (a cada 2 anos), siga o passo a passo abaixo para atualizar o dashboard sem alterar nenhuma linha de código HTML/JS:

### Passo 1: Baixar a planilha CSV do INEP
Baixe a planilha do Consulta IDEB conforme instruído acima e salve o arquivo CSV em uma pasta local (ex: `./data/divulgacao_escolas_2025.csv`).

### Passo 2: Executar o Script de Importação ETL
No terminal da raiz do projeto, execute o script em Node.js:

```bash
node scripts/import_inep_csv.js ./data/divulgacao_escolas_2025.csv --municipio "Gonçalves Dias"
```

O script irá:
1. Detectar automaticamente a codificação do arquivo (`UTF-8` ou `ISO-8859-1`) e o delimitador (`;` ou `,`).
2. Mapear as colunas de escola, código INEP, localização e score do IDEB.
3. Filtrar e extrair apenas os dados do município informado.
4. Sobrescrever com segurança o arquivo `src/data/schools.json`.

---

## 🛠️ Comandos de Desenvolvimento

### Instalar Dependências
```bash
npm install
```

### Rodar em Modo de Desenvolvimento
```bash
npm run dev
```

### Gerar Bundle de Produção
```bash
npm run build
```

---

## 🌐 Suporte a Múltiplas Redes e Municípios

O arquivo `src/data/schools.json` foi estruturado nativamente com suporte multi-rede:

```json
{
  "id": "21128723",
  "nome": "UI JOSE CORREA LIMA",
  "codigoInep": "21128723",
  "scoreIdeb": 5.4,
  "localizacao": "Zona Rural",
  "status": "ATIVA",
  "municipio": "Gonçalves Dias",
  "uf": "MA",
  "rede": "Municipal"
}
```

Para adicionar novas redes municipais ou estaduais no futuro, basta importar os dados usando o script `--municipio "NOME DO MUNICIPIO"` ou incluir os registros no arquivo JSON sem duplicar o código da interface.
