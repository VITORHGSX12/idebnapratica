export function renderGoalTracker(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const gapFormatted = data.currentGap > 0 ? `+${data.currentGap.toFixed(1)}` : `${data.currentGap.toFixed(1)}`;

  container.innerHTML = `
    <div class="goal-card">
      <span class="goal-tag">⚡ MONITORAMENTO DE TRAJETÓRIA DO CICLO</span>
      <div class="goal-header">
        <div>
          <div class="goal-title">Meta Pactuada vs. Desempenho Observado (${data.municipio})</div>
          <div class="goal-desc">Acompanhamento do índice obtido em relação à meta projetada pelo INEP e plano de recomposição de aprendizagem.</div>
        </div>
        <div>
          <div class="goal-gap-label">GAP ATUAL DA REDE</div>
          <div class="goal-gap-val">${gapFormatted} pontos</div>
        </div>
      </div>
      <div class="progress-row">
        <span>Progresso para a Meta (${data.targetIdeb.toFixed(1)})</span>
        <span>${data.progressPct.toFixed(1)}% da meta alcançada (${data.currentIdeb.toFixed(1)} / ${data.targetIdeb.toFixed(1)})</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${data.progressPct}%"></div></div>
    </div>
  `;
}
