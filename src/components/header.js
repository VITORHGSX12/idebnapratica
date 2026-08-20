export function renderHeader(containerId, meta) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('pt-BR', options);
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  container.innerHTML = `
    <div class="header">
      <div class="header-left">
        <div class="avatar">SE</div>
        <div>
          <div class="greeting">Boa tarde, <span>Secretaria de Educação!</span> 🌤️</div>
          <div class="meta-row">
            <span class="pill">Gestão Executiva SEMED</span>
            <span class="dot">•</span>
            <span class="meta-text">${formattedDate}</span>
            <span class="dot">•</span>
            <span class="meta-text">SEMED ${meta.municipio || 'Gonçalves Dias'} – ${meta.uf || 'MA'}</span>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button class="btn">👤 Meu Perfil</button>
        <button class="btn btn-primary">+ Nova Avaliação</button>
      </div>
    </div>
  `;
}
