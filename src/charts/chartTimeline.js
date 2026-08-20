import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

const purple = '#5B4FE9';
const green = '#17B26A';
const gridColor = '#EEF0F7';

export function renderTimelineChart(canvasId, timelineData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: timelineData.labels,
      datasets: [
        {
          label: 'IDEB Oficial / Simulados',
          data: timelineData.idebOficial,
          borderColor: purple,
          backgroundColor: purple,
          pointBackgroundColor: purple,
          pointRadius: 4,
          tension: 0.35,
          borderWidth: 2.5,
          datalabels: { display: false }
        },
        {
          label: 'Meta Projetada INEP',
          data: timelineData.metaProjetada,
          borderColor: green,
          borderDash: [5, 4],
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
          datalabels: { display: false }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11.5 } }
        }
      },
      scales: {
        y: { min: 3, max: 6, grid: { color: gridColor }, ticks: { stepSize: 1, font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}
