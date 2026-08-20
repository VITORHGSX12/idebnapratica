import './styles/main.css';
import './styles/components.css';
import './styles/charts.css';

import schoolsData from './data/schools.json';
import timelineData from './data/ideb_timeline.json';
import etapasData from './data/ideb_etapas.json';
import saebProficienciaData from './data/saeb_proficiencia.json';
import proficiencyData from './data/proficiency.json';

import { renderHeader } from './components/header.js';
import { renderKpiCards } from './components/kpiCards.js';
import { renderGoalTracker } from './components/goalTracker.js';
import { renderSchoolsTable } from './components/schoolsTable.js';
import { setupEscalaAprendizado } from './components/escalaAprendizado.js';
import { renderProficiencyDistribution } from './components/proficiencyDistribution.js';

import { renderTimelineChart } from './charts/chartTimeline.js';
import { renderComboChart, renderComparativoChart } from './charts/chartEtapas.js';
import { renderSaebEvoChart } from './charts/chartSaebEvo.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Render Header
  renderHeader('app-header', timelineData);

  // 2. Render KPI Cards
  renderKpiCards('app-kpis', timelineData);

  // 3. Render Goal Tracker Card
  renderGoalTracker('app-goal', timelineData);

  // 4. Render Schools Table
  renderSchoolsTable('app-schools', schoolsData);

  // 5. Initialize Charts
  renderTimelineChart('chartTimeline', timelineData);
  renderComboChart('chartIniciais', etapasData.anos, etapasData.iniciais, '#3B9BF6');
  renderComboChart('chartFinais', etapasData.anos, etapasData.finais, '#7CC0F9');
  renderComparativoChart('chartComparativo', etapasData.anos, etapasData.iniciais, etapasData.finais);

  // 6. Setup Indicador de Aprendizado & Saeb Evo Chart
  let currentSaebEvoChart = renderSaebEvoChart('chartSaebEvo', saebProficienciaData.saebYears, saebProficienciaData.etapas.finais);

  function setEtapa(etapa) {
    const d = saebProficienciaData.etapas[etapa];
    const indEl = document.getElementById('indicadorNum');
    const portEl = document.getElementById('portNum');
    const matEl = document.getElementById('matNum');

    if (indEl) indEl.textContent = d.indicador;
    if (portEl) portEl.textContent = d.port;
    if (matEl) matEl.textContent = d.mat;

    if (currentSaebEvoChart) {
      currentSaebEvoChart.data.datasets[0].data = d.port_s;
      currentSaebEvoChart.data.datasets[1].data = d.mat_s;
      currentSaebEvoChart.update();
    }

    document.querySelectorAll('#etapaTabs .tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.etapa === etapa);
    });
  }

  document.querySelectorAll('#etapaTabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => setEtapa(btn.dataset.etapa));
  });

  // 7. Setup Escala do Aprendizado
  setupEscalaAprendizado(saebProficienciaData.escalaData);

  // 8. Render Distribuição dos alunos por proficiência
  renderProficiencyDistribution('app-proficiency', proficiencyData);
});
