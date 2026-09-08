import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

const chartPrimary = '#2F6FED';
const chartPrimarySoft = 'rgba(47, 111, 237, 0.12)';
const chartPrimaryMuted = '#7FB3E0';
const chartPrimaryMutedSoft = 'rgba(127, 179, 224, 0.14)';
const chartWarning = '#D97706';
const gridColor = '#EEF0F7';

function badgeLabel(color) {
  return {
    display: true,
    align: 'top',
    offset: 6,
    color: '#fff',
    font: { weight: '700', size: 11 },
    backgroundColor: color,
    borderRadius: 20,
    padding: { top: 4, bottom: 4, left: 8, right: 8 },
    formatter: (v) => v === null || v === undefined ? '' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  };
}

export function renderComboChart(canvasId, anos, dataset, barColor) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    data: {
      labels: anos,
      datasets: [
        {
          type: 'bar',
          label: 'Maranhão',
          data: dataset.maranhao,
          backgroundColor: barColor || chartPrimary,
          borderRadius: 4,
          barPercentage: 0.62,
          datalabels: { display: false }
        },
        {
          type: 'line',
          label: 'Projetado',
          data: dataset.projetado,
          borderColor: chartWarning,
          backgroundColor: chartWarning,
          pointBackgroundColor: chartWarning,
          pointRadius: 4,
          pointStyle: 'rectRot',
          borderDash: [5, 4],
          borderWidth: 2,
          tension: 0.3,
          datalabels: badgeLabel(chartWarning)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 22 } },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11.5 } } }
      },
      scales: {
        y: { min: 0, max: 10, grid: { color: gridColor }, ticks: { stepSize: 1, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

export function renderComparativoChart(canvasId, anos, iniciaisData, finaisData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: anos,
      datasets: [
        {
          label: 'Anos Iniciais',
          data: iniciaisData.maranhao,
          borderColor: chartPrimary,
          backgroundColor: chartPrimarySoft,
          pointBackgroundColor: chartPrimary,
          pointRadius: 4,
          pointStyle: 'circle',
          borderWidth: 2.5,
          fill: false,
          tension: 0.3,
          datalabels: badgeLabel(chartPrimary)
        },
        {
          label: 'Anos Finais',
          data: finaisData.maranhao,
          borderColor: chartPrimaryMuted,
          backgroundColor: chartPrimaryMutedSoft,
          pointBackgroundColor: chartPrimaryMuted,
          pointRadius: 4,
          pointStyle: 'rect',
          borderWidth: 2.5,
          fill: false,
          tension: 0.3,
          datalabels: badgeLabel(chartPrimaryMuted)
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 26 } },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11.5 } } }
      },
      scales: {
        y: { min: 2, max: 6, grid: { color: gridColor }, ticks: { stepSize: 1, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}
