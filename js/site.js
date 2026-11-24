document.getElementById('th').textContent = new Date().getFullYear();

document.querySelectorAll('.links a').forEach(a =>
  a.addEventListener('click', () => document.body.classList.remove('menu-open')));

// Portofolio dibaca dari data/portofolio.json, ubah file itu untuk menambah proyek.
fetch('data/portofolio.json', { cache: 'no-cache' })
  .then(r => r.json())
  .then(list => {
    const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    document.getElementById('porto-list').innerHTML = list.map(p => `
      <article class="card porto">
        <div class="tags">${(p.tag || []).map(t => `<span>${esc(t)}</span>`).join('')}</div>
        <h3>${esc(p.judul)}</h3>
        <p class="klien">${esc(p.klien)} · ${esc(p.tahun)}</p>
        <p>${esc(p.ringkas)}</p>
      </article>`).join('');
  })
  .catch(() => {
    document.getElementById('porto-list').innerHTML = '<p class="muted">Portofolio belum dapat dimuat.</p>';
  });
