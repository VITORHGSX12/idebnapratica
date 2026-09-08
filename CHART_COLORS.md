# Diretrizes e Tokens de Cores dos Gráficos (Chart Design System)

Este documento estabelece as diretrizes oficiais de paleta de cores, estilos visuais e padrões de acessibilidade para todos os gráficos do sistema **IDEB na Prática**.

---

## 1. Fonte Única de Verdade

Todas as cores e estilos de gráficos são centralizados no módulo:
📁 [`js/core/chart-theme.js`](./js/core/chart-theme.js)

Para obter o tema ativo calibrado para o modo atual (Claro ou Escuro):
```javascript
const t = global.ChartTheme.getTheme();
```

---

## 2. Paleta Semântica Oficial

A paleta de gráficos foi reduzida para **4 cores semânticas principais**, mantendo harmonia de 100% com o design institucional:

| Token | Modo Claro (Light) | Modo Escuro (Dark) | Regra de Uso Exclusivo |
|---|:---:|:---:|---|
| `t.primary` | `#2F6FED` *(Azul Institucional)* | `#7FB3E0` *(Azul Celeste)* | **Dado Real / Atual / Observado** (ex: IDEB observado, Anos Iniciais, Língua Portuguesa). |
| `t.primaryMuted` | `#7FB3E0` *(Azul Suave)* | `#93C5FD` *(Azul Claro Distinto)* | **Dado Histórico / Comparativo** (ex: Anos Finais, Matemática, escolas abaixo da média). |
| `t.success` | `#22C55E` *(Verde Institucional)* | `#5FD3C4` *(Verde Menta)* | **Metas Atingidas / Indicadores Positivos** (ex: simulados acima da média da rede). |
| `t.warning` | `#D97706` *(Âmbar Quente)* | `#FFC857` *(Ouro / Dourado)* | **USO EXCLUSIVO**: Metas Projetadas INEP, alertas e gaps em relação à meta. *(Nunca usar como cor meramente decorativa)*. |
| `t.neutral` / `t.grid` | `rgba(15, 26, 43, 0.08)` | `rgba(179, 207, 229, 0.15)` | **Grades, eixos cartesianos e linhas de apoio**. |

---

## 3. Padrões de Estilo Sem Cor (Acessibilidade & Diferenciação)

Para evitar dependência exclusiva de cores (garantindo acessibilidade para daltônicos e legibilidade em impressões P&B), aplicam-se os seguintes padrões obrigatórios:

### A. Estilos de Linha (`borderDash` / `dashArray`)
- **Linha Sólida (`[]`)**: Dado Real / Observado Atual.
- **Linha Tracejada (`[5, 4]`)**: Meta Projetada INEP ou série comparativa secundária.
- **Linha Pontilhada (`[3, 3]`)**: Linha de Referência ou Média Geral.

### B. Formatos de Marcadores (`pointStyle`)
- **`circle` (Círculo preenchido)**: Série Observada Principal (ex: Anos Iniciais, LP 5º ano).
- **`rect` (Quadrado preenchido)**: Série Comparativa (ex: Anos Finais, MT 5º ano).
- **`rectRot` (Losango)**: Meta Projetada INEP / Série Secundária (ex: LP 9º ano).
- **`triangle` (Triângulo)**: Série de Apoio Complementar (ex: MT 9º ano).

---

## 4. Guia Rápido de Aplicação em Novos Gráficos Chart.js

Ao criar ou atualizar um componente de gráfico:

```javascript
// 1. Obter o tema ativo
const t = (global.ChartTheme && global.ChartTheme.getTheme) 
  ? global.ChartTheme.getTheme() 
  : { primary: '#2F6FED', primaryMuted: '#7FB3E0', warning: '#D97706', success: '#22C55E' };

// 2. Definir datasets usando tokens e estilos estruturais
new Chart(canvas, {
    type: 'line',
    data: {
        labels: ['2021', '2023', '2025'],
        datasets: [
            {
                label: 'Observado',
                data: [4.5, 4.8, 5.2],
                borderColor: t.primary,
                backgroundColor: t.primaryBg,
                pointStyle: t.markers.real,       // 'circle'
                pointRadius: t.pointRadius.default, // 4.5
                borderWidth: t.lineWidth.primary   // 2.5
            },
            {
                label: 'Meta INEP',
                data: [4.8, 5.1, 5.5],
                borderColor: t.warning,
                pointStyle: t.markers.target,     // 'rectRot'
                borderDash: t.dashArray.target,   // [5, 4]
                borderWidth: t.lineWidth.target   // 2.0
            }
        ]
    },
    options: {
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    color: t.textPrimary
                }
            }
        },
        scales: {
            y: { grid: { color: t.grid }, ticks: { color: t.textSecondary } },
            x: { grid: { display: false }, ticks: { color: t.textPrimary } }
        }
    }
});
```

---

## 5. Reatividade a Troca de Tema (Light / Dark Mode)

O sistema escuta automaticamente o evento de janela `'themeChanged'` e dispara `global.ChartTheme.refreshAll()`, que reconstrói e re-renderiza todos os gráficos ativos com as cores do novo modo sem necessidade de recarregar a página.
