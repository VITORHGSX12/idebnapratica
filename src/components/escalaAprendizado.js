export function setupEscalaAprendizado(escalaData) {
  let curSerie = '5';
  let curDisc = 'lp';

  function renderEscala() {
    const key = `${curSerie}-${curDisc}`;
    const groups = escalaData[key] || [];
    let html = '';

    groups.forEach(g => {
      html += `<div class="escala-cat"><div class="escala-cat-title ${g.cls}">${g.cat}</div>`;
      g.rows.forEach(([nivel, faixa]) => {
        html += `<div class="escala-row"><span class="nivel">${nivel}</span><span>${faixa}</span></div>`;
      });
      html += `</div>`;
    });

    const escalaBody = document.getElementById('escalaBody');
    if (escalaBody) escalaBody.innerHTML = html;
  }

  document.querySelectorAll('#serieSeg button').forEach(b => {
    b.addEventListener('click', () => {
      curSerie = b.dataset.serie;
      document.querySelectorAll('#serieSeg button').forEach(x => x.classList.toggle('active', x === b));
      renderEscala();
    });
  });

  document.querySelectorAll('#discSeg button').forEach(b => {
    b.addEventListener('click', () => {
      curDisc = b.dataset.disc;
      document.querySelectorAll('#discSeg button').forEach(x => x.classList.toggle('active', x === b));
      renderEscala();
    });
  });

  renderEscala();
}
