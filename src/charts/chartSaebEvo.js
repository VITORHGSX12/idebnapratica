import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);

const lpColor = '#4E9BE8';
const matColor = '#3A4356';
const gridColor = '#EEF0F7';

function fmt(v) {
  return v ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
}

export function renderSaebEvoChart(canvasId, saebYears, initialData) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: saebYears,
      datasets: [
        {
          label: 'Língua Portuguesa',
          data: initialData.port_s,
          borderColor: lpColor,
          pointBackgroundColor: lpColor,
          borderWidth: 2.5,
          pointRadius: 4,
          tension: 0.3,
          datalabels: {
            display: true,
            align: 'bottom',
            offset: 6,
            color: '#fff',
            font: { weight: '700', size: 10 },
            backgroundColor: lpColor,
            borderRadius: 20,
            padding: { top: 3, bottom: 3, left: 7, right: 7 },
            formatter: (v) => fmt(v)
          }
        },
        {
          label: 'Matemática',
          data: initialData.mat_s,
          borderColor: matColor,
          pointBackgroundColor: matColor,
          borderWidth: 2.5,
          pointRadius: 4,
          tension: 0.3,
          datalabels: {
            display: true,
            align: 'top',
            offset: 6,
            color: '#fff',
            font: { weight: '700', size: 10 },
            backgroundColor: matColor,
            borderRadius: 20,
            padding: { top: 3, bottom: 3, left: 7, right: 7 },
            formatter: (v) => fmt(v)
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 24, bottom: 6 } },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { size: 11.5 } } }
      },
      scales: {
        y: { min: 80, max: 280, grid: { color: gridColor }, ticks: { stepSize: 40, font: { size: 11 } }, title: { display: true, text: 'Nota padronizada', font: { size: 11, weight: '600' } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
}
