export function renderSchoolsTable(containerId, schools) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const sampleMunicipality = schools.length > 0 ? `${schools[0].municipio} – ${schools[0].uf}` : 'Gonçalves Dias – MA';

  const rowsHtml = schools.map(s => {
    const isRural = s.localizacao.toLowerCase().includes('rural');
    const locIcon = isRural ? '🌿' : '🏙️';
    return `
      <tr>
        <td class="school-name">${s.nome}</td>
        <td>${s.codigoInep}</td>
        <td class="score">${s.scoreIdeb.toFixed(1)} ★</td>
        <td><span class="badge-loc">${locIcon} ${s.localizacao}</span></td>
        <td><span class="status-dot">${s.status}</span></td>
        <td><button class="ver-btn">Ver Escola →</button></td>
      </tr>
    `;
  }).join('');

  container.innerHTML = `
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Desempenho por Escola da Rede (${sampleMunicipality})</div>
          <div class="card-sub">Resultados obtidos no SAEB/IDEB oficial e evolução da rede municipal.</div>
        </div>
        <button class="ver-btn">Ver Todas as Escolas →</button>
      </div>
      <div class="table-responsive">
        <table>
          <thead>
            <tr>
              <th>UNIDADE ESCOLAR</th>
              <th>CÓDIGO INEP</th>
              <th>SAEB/IDEB</th>
              <th>LOCALIZAÇÃO</th>
              <th>STATUS</th>
              <th>AÇÃO</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
