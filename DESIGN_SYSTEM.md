# DESIGN SYSTEM OFICIAL — EDUCAÇÃO 2025

Este documento define os padrões visuais canônicos de todo o sistema SaaS de Gestão Educacional.
**Nenhum componente, tela ou gráfico deve utilizar cores hardcoded, emojis soltos em UI ou bibliotecas de ícones fora deste padrão.**

---

## 1. Paleta de Cores Única & Hierarquia Semântica

Todas as cores da aplicação são obtidas diretamente do arquivo [`design-tokens.css`](./design-tokens.css) e do tema de dados [`js/core/chart-theme.js`](./js/core/chart-theme.js).

### A. Cores Institucionais e Estrutura
| Token CSS | Hex / Valor | Uso Exclusivo |
| :--- | :--- | :--- |
| `--color-brand-primary` | `#2F6FED` | Ações primárias, botões principais, links ativos, destaques |
| `--color-brand-primary-hover` | `#255BD1` | Estado hover/focus de botões e links primários |
| `--color-brand-secondary` | `#0B2545` | Sidebar institucional, cabeçalhos escuros, textos de alto contraste |
| `--color-surface-canvas` | `#F4F6F9` | Fundo geral da aplicação (canvas) |
| `--color-surface-card` | `#FFFFFF` | Superfície principal de cards, tabelas e modais |
| `--color-surface-subtle` | `#EEF2F6` | Fundo suave de cards secundários, zebra de tabelas, tags neutras |
| `--color-border-subtle` | `#E5E9F0` | Linhas divisórias, contornos de cards e inputs |
| `--color-border-strong` | `#CBD5E1` | Bordas com maior contraste estrutural |

### B. Tipografia e Textos
| Token CSS | Hex / Valor | Uso Exclusivo |
| :--- | :--- | :--- |
| `--color-text-primary` | `#0F1A2B` | Títulos, KPIs principais, rótulos de alta prioridade (WCAG AAA) |
| `--color-text-secondary` | `#6B7A90` | Subtítulos, textos de apoio, cabeçalhos de tabela |
| `--color-text-muted` | `#8A99AD` | Metadados, datas, contadores secundários |
| `--color-text-inverse` | `#FFFFFF` | Textos sobre botões de ação ou superfícies escuras |

### C. Sistema Semântico de Status (IDEB / SAEB / Sistema)
| Status | Token Cor | Fundo (`-bg`) | Borda (`-border`) | Texto (`-text`) |
| :--- | :--- | :--- | :--- | :--- |
| **Sucesso / Avançado** | `--color-status-success` (`#22C55E`) | `#F0FDF4` | `#86EFAC` | `#166534` |
| **Atenção / Projeção** | `--color-status-warning` (`#D97706`) | `#FFFBEB` | `#FCD34D` | `#92400E` |
| **Crítico / Alerta** | `--color-status-critical` (`#DC2626`) | `#FEF2F2` | `#FCA5A5` | `#991B1B` |
| **Destaque Primário** | `--color-status-advanced` (`#2F6FED`) | `rgba(47,111,237,0.12)` | `rgba(47,111,237,0.30)` | `#0B2545` |

---

## 2. Biblioteca Oficial de Ícones: Lucide Icons

Todo ícone do sistema deve ser renderizado via biblioteca oficial **Lucide Icons** (`<i data-lucide="nome-do-icone"></i>`).
**Nenhum emoji Unicode é permitido como ícone funcional, decoração de título, indicador de status ou botão.**

### Mapeamento de Substituição de Emojis:
| Categoria / Uso Original | Emoji Antigo | Ícone Oficial Lucide | Tag HTML Padronizada |
| :--- | :--- | :--- | :--- |
| **Sucesso / Concluído / Aprovado** | ✅, ✔️, 🟢 | `check-circle-2` ou `check` | `<i data-lucide="check-circle-2"></i>` |
| **Atenção / Pendente** | ⚠️, 🟡, ⏳ | `alert-triangle` ou `clock` | `<i data-lucide="alert-triangle"></i>` |
| **Crítico / Reprovado / Erro** | ❌, 🔴, 🚨 | `x-circle` ou `alert-octagon` | `<i data-lucide="x-circle"></i>` |
| **Avançado / Meta / Foguete** | 🚀, 🎯, 🔥 | `trending-up` ou `target` | `<i data-lucide="trending-up"></i>` |
| **Livro / Biblioteca / Caderno** | 📚, 📖, 📝 | `book-open` ou `file-text` | `<i data-lucide="book-open"></i>` |
| **Download / Exportação** | 📥, 💾, ⬇️ | `download` | `<i data-lucide="download"></i>` |
| **Impressão / Relatório** | 🖨️, 📄, 📊 | `printer` ou `bar-chart-3` | `<i data-lucide="printer"></i>` |
| **Busca / Filtro** | 🔍, 🔎, 🧭 | `search` ou `filter` | `<i data-lucide="search"></i>` |
| **Alunos / Turmas / Usuários** | 👥, 👤, 🎓 | `users` ou `graduation-cap` | `<i data-lucide="users"></i>` |
| **Configuração / Ajustes** | ⚙️, 🔧 | `settings` | `<i data-lucide="settings"></i>` |
| **Calendário / Cronograma** | 📅, 🗓️ | `calendar` | `<i data-lucide="calendar"></i>` |
| **Email / Mensagem** | 📧, ✉️ | `mail` | `<i data-lucide="mail"></i>` |

---

## 3. Tipografia, Geometria e Elevação

### Escala de Fontes:
- **Família Display:** `'Lexend'`, `'Plus Jakarta Sans'`, sans-serif
- **Família Corpo:** `'Plus Jakarta Sans'`, -apple-system, sans-serif
- **Escala de Tamanhos:**
  - `Hero Stat:` 2.25rem (`--text-hero-stat`)
  - `Title Lg:` 1.5rem (`--text-title-lg`)
  - `Title Md:` 1.25rem (`--text-title-md`)
  - `Title Sm:` 1.05rem (`--text-title-sm`)
  - `Body Text:` 0.875rem (`--text-body`)
  - `Small / Metadados:` 0.78rem (`--text-sm`)
  - `Badges / Tags:` 0.6875rem (`--text-xs`)

### Raio de Borda (Border Radius):
- **Cards e Painéis:** `16px` (`--radius-card`)
- **Botões e Caixas de Diálogo:** `10px` (`--radius-btn`)
- **Badges e Pílulas de Status:** `9999px` (`--radius-pill`)
- **Inputs e Caixas de Seleção:** `6px` a `10px` (`--radius-sm` a `--radius-md`)

### Elevação e Sombras (Sem Glassmorphism Pesado):
- `--shadow-subtle`: `0 1px 2px rgba(15, 26, 43, 0.04)`
- `--shadow-card`: `0 4px 16px rgba(15, 26, 43, 0.04), 0 1px 3px rgba(15, 26, 43, 0.03)`
- `--shadow-dropdown`: `0 10px 25px -5px rgba(15, 26, 43, 0.15), 0 4px 6px -2px rgba(15, 26, 43, 0.05)`
- `--shadow-modal`: `0 20px 40px -10px rgba(11, 37, 69, 0.35)`
