export function bannerColor(pct) {
  if (pct < 25) return '#E0483C';
  if (pct < 50) return '#F2994A';
  if (pct < 75) return '#F2C94C';
  return '#17B26A';
}

export function renderProficiencyDistribution(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const levelMeta = data.levelMeta || {
    avancado: { name: 'Avançado', color: '#17B26A' },
    adequado: { name: 'Adequado', color: '#F2C94C' },
    basico:   { name: 'Básico',   color: '#F2994A' },
    abaixo:   { name: 'Abaixo do Básico', color: '#E0483C' }
  };

  const cycles = data.cycles || [];
  const legendItems = data.legend || [
    { key: 'avancado', desc: 'Aprendizado além da expectativa. Recomenda-se aos alunos neste nível atividades desafiadoras.' },
    { key: 'adequado', desc: 'Os alunos neste nível encontram-se preparados para continuar os estudos. Recomenda-se atividades de aprofundamento.' },
    { key: 'basico', desc: 'Os alunos neste nível precisam melhorar. Sugere-se atividades de reforço.' },
    { key: 'abaixo', desc: 'Os alunos neste nível apresentaram pouquíssimo aprendizado. É necessária a recuperação de conteúdos.' }
  ];

  const cyclesHtml = cycles.map(c => {
    const levelsKeys = ['avancado', 'adequado', 'basico', 'abaixo'];
    const levelsHtml = levelsKeys.map(key => {
      const l = c.levels[key] || { pct: 0, alunos: 0 };
      const meta = levelMeta[key];
      return `
        <div class="prof-level">
          <div class="top">
            <span class="pctv" style="color:${meta.color}">${l.pct}%</span>
            <span class="alunos">(${l.alunos.toLocaleString('pt-BR')} alunos)</span>
          </div>
          <div class="prof-bar-track">
            <div class="prof-bar-fill" style="width:${l.pct}%;background:${meta.color}"></div>
          </div>
          <div class="name">${meta.name}</div>
        </div>
      `;
    }).join('');

    const deltaChip = c.nextDelta === null || c.nextDelta === undefined ? '' :
      `<span class="prof-delta">${c.nextDelta > 0 ? '+' : ''}${c.nextDelta}pts</span>`;

    return `
      <div class="prof-cycle">
        <div class="prof-banner" style="background:${bannerColor(c.adequadoPct)}">
          ${deltaChip}
          <div class="pct">${c.adequadoPct}%</div>
          <div class="lab">Aprendizado adequado</div>
        </div>
        <div class="prof-year">${c.year}</div>
        <div class="prof-levels">${levelsHtml}</div>
      </div>
    `;
  }).join('');

  const legendHtml = legendItems.map(it => {
    const meta = levelMeta[it.key];
    return `
      <div class="legend-item">
        <span class="legend-dot" style="background:${meta.color}"></span>
        <div>
          <div class="t" style="color:${meta.color}">${meta.name}</div>
          <div class="d">${it.desc}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="prof-grid">
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">Distribuição dos alunos por proficiência</div>
            <div class="card-sub">Podemos posicionar o aprendizado dos alunos em 4 níveis qualitativos de proficiência. O aprendizado adequado engloba os níveis Adequado e Avançado.</div>
          </div>
        </div>
        <div class="prof-filters">
          <span class="filter-pill">${data.filters?.rede || 'Pública'}</span>
          <span class="filter-pill">${data.filters?.disciplina || 'Matemática'}</span>
          <span class="filter-pill">${data.filters?.serie || '5º ano'}</span>
        </div>
        <div class="prof-cycles">${cyclesHtml}</div>
        <div class="prof-note">Dados oficiais Saeb/INEP (rede pública, Matemática, 5º ano). Assim que o módulo de simulados estiver ativo, os demais filtros (disciplina, série, rede) passam a refletir os resultados medidos internamente pela SEMED.</div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="card-title">Legenda Aprendizado</div>
        </div>
        <div>${legendHtml}</div>
      </div>
    </div>
  `;
}
