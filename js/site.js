document.getElementById('th').textContent = new Date().getFullYear();

// Menu di layar kecil
const menuBtn = document.querySelector('.menu-btn');
const tutupMenu = () => {
  document.body.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', false);
  menuBtn.textContent = 'Menu';
};
menuBtn.addEventListener('click', () => {
  const buka = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', buka);
  menuBtn.textContent = buka ? 'Tutup' : 'Menu';
});
document.querySelectorAll('.links a').forEach(a => a.addEventListener('click', tutupMenu));

// Klien dan portofolio dibaca dari data/portofolio.json. Ubah file itu untuk menambah proyek.
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

fetch('data/portofolio.json', { cache: 'no-cache' })
  .then(r => r.json())
  .then(list => {
    const klien = [...new Set(list.map(p => p.klien))];
    document.getElementById('klien-list').innerHTML = klien.map(k => `<li>${esc(k)}</li>`).join('');

    document.getElementById('porto-list').innerHTML = list.map(p => `
      <article class="proyek">
        <div class="proyek-judul">
          <h3>${esc(p.judul)}</h3>
          <p>${esc(p.klien)}</p>
        </div>
        <div class="proyek-isi">
          <p>${esc(p.ringkas)}</p>
          <ul class="tags">${(p.tag || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
        <span class="proyek-tahun">${esc(p.tahun)}</span>
      </article>`).join('');
  })
  .catch(() => {
    document.getElementById('klien-list').innerHTML = '<li>Daftar belum dapat dimuat.</li>';
    document.getElementById('porto-list').innerHTML = '<p class="muted">Daftar pekerjaan belum dapat dimuat. Muat ulang halaman ini.</p>';
  });
