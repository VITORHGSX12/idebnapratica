export function renderKpiCards(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">IDEB / SAEB 2025 Oficial</span>
          <span class="icon-badge" style="background:var(--green-bg)">✏️</span>
        </div>
        <div class="kpi-value">${data.currentIdeb.toFixed(1)} <span style="color:var(--amber);font-size:16px">★</span></div>
        <span class="kpi-sub up">+0.4 vs 2023 · Meta 2026: ${data.targetIdeb.toFixed(1)}</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Proficiência SAEB 2025</span>
          <span class="icon-badge" style="background:var(--blue-bg)">📘</span>
        </div>
        <div class="kpi-value">${data.proficienciaSaeb.mediaGeral.toFixed(1)} <span style="font-size:13px;font-weight:600;color:var(--text3)">pts</span></div>
        <span class="kpi-sub">LP: ${data.proficienciaSaeb.linguaPortuguesa.toFixed(1)} · MAT: ${data.proficienciaSaeb.matematica.toFixed(1)}</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Taxa de Aprovação (Fluxo)</span>
          <span class="icon-badge" style="background:var(--green-bg)">🎖️</span>
        </div>
        <div class="kpi-value">${data.taxaAprovacaoFluxo.toFixed(1)}<span style="font-size:16px">%</span></div>
        <span class="kpi-sub">Censo Escolar / ${data.municipio}</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Evolução dos Simulados</span>
          <span class="icon-badge" style="background:var(--purple-bg)">📊</span>
        </div>
        <div class="kpi-value">${data.evolucaoSimulados.toFixed(1)} <span style="font-size:13px;font-weight:600;color:var(--text3)">pts</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span class="kpi-sub">Simulado SAEB 1º Semestre</span>
          <button class="ver-btn" style="white-space:nowrap;">Ver Resultados →</button>
        </div>
      </div>
    </div>
  `;
}
