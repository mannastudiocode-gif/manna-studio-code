document.getElementById('th').textContent = new Date().getFullYear();

// Menu di layar kecil
const menuBtn = document.querySelector('.menu-btn');
menuBtn.addEventListener('click', () => {
  const buka = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', buka);
  menuBtn.textContent = buka ? 'Tutup' : 'Menu';
});
document.querySelectorAll('.links a').forEach(a => a.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', false);
  menuBtn.textContent = 'Menu';
}));

// Portofolio dibaca dari data/portofolio.json. Ubah file itu untuk menambah proyek.
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

fetch('data/portofolio.json', { cache: 'no-cache' })
  .then(r => r.json())
  .then(list => {
    document.getElementById('dipakai-list').innerHTML = list.map(p =>
      `<li><b>${esc(p.judul)}</b><span>${esc(p.klien)}</span></li>`).join('');

    document.getElementById('porto-list').innerHTML = list.map(p => `
      <article class="proyek">
        <div class="proyek-judul">
          <h3>${esc(p.judul)}</h3>
          <p>${esc(p.klien)}, ${esc(p.tahun)}</p>
        </div>
        <div class="proyek-isi">
          <p>${esc(p.ringkas)}</p>
          <ul class="tags">${(p.tag || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      </article>`).join('');
  })
  .catch(() => {
    document.getElementById('dipakai-list').innerHTML = '<li>Daftar belum dapat dimuat.</li>';
    document.getElementById('porto-list').innerHTML = '<p class="muted">Daftar pekerjaan belum dapat dimuat. Muat ulang halaman ini.</p>';
  });
