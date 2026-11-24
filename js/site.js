/* Website CV. Manna Studio Code
   Isi diambil dari data/*.json supaya bisa diperbarui tanpa menyentuh HTML:
   portofolio.json (pekerjaan), katalog.json (produk e-Katalog), profil.json (tentang kami). */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ambil = f => fetch('data/' + f, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(f); return r.json(); });
const WA = '6281271278201';

$('#th').textContent = new Date().getFullYear();

/* ---------- Menu di layar kecil ---------- */
const menuBtn = $('.menu-btn');
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

/* ---------- Pekerjaan ---------- */
const gambarHtml = (g, besar) => `
  <button type="button" class="shot${besar ? ' shot-besar' : ''}" data-src="${esc(g.src)}" data-ket="${esc(g.ket)}" aria-label="Perbesar: ${esc(g.ket)}">
    <img src="${esc(g.src)}" alt="${esc(g.ket)}" loading="lazy" width="1400" height="${besar ? 618 : 941}">
  </button>`;

const tagHtml = p => `<ul class="tags">${(p.tag || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
const metaHtml = p => [p.klien, p.tahun].filter(Boolean).map(esc).join(', ');

function tampilPekerjaan(list) {
  // Angka ringkas: dihitung dari data, bukan diketik manual
  const aplikasi = list.filter(p => p.domain).length;
  const instansi = [...new Set(list.map(p => p.instansi))];
  $('#klien-list').innerHTML = instansi.map(k => `<li>${esc(k)}</li>`).join('');
  $('#angka').innerHTML += `
    <div><dt>Aplikasi dipakai</dt><dd>${aplikasi}</dd></div>
    <div><dt>Instansi</dt><dd>${instansi.length}</dd></div>`;

  // Studi kasus: proyek yang punya catatan masalah dan solusi
  $('#sorotan').innerHTML = list.filter(p => p.masalah).map(p => `
    <article class="kasus">
      <div class="kasus-teks">
        <p class="kasus-klien">${metaHtml(p)}</p>
        <h3>${esc(p.judul)}${p.nama_panjang ? `<span>${esc(p.nama_panjang)}</span>` : ''}</h3>
        <dl>
          <dt>Masalah</dt><dd>${esc(p.masalah)}</dd>
          <dt>Yang kami buat</dt><dd><ul>${(p.solusi || []).map(s => `<li>${esc(s)}</li>`).join('')}</ul></dd>
          ${p.hasil ? `<dt>Hasilnya</dt><dd class="kasus-hasil">${esc(p.hasil)}</dd>` : ''}
        </dl>
        ${p.url ? `<a class="btn btn-kunyit kasus-buka" href="${esc(p.url)}" target="_blank" rel="noopener">Buka ${esc(p.judul)}</a>` : ''}
      </div>
      <div class="kasus-gambar">${(p.gambar || []).map(g => gambarHtml(g, true)).join('')}</div>
    </article>`).join('');

  $('#porto-list').innerHTML = list.filter(p => !p.masalah).map(p => `
    <article class="proyek${p.gambar ? ' proyek-galeri' : ''}">
      <div class="proyek-judul">
        <h3>${esc(p.judul)}</h3>
        ${p.nama_panjang ? `<p class="proyek-panjang">${esc(p.nama_panjang)}</p>` : ''}
        <p>${metaHtml(p)}</p>
      </div>
      <div class="proyek-isi">
        <p>${esc(p.ringkas)}</p>
        ${p.sebelum ? `<dl class="ubah"><div><dt>Sebelumnya</dt><dd>${esc(p.sebelum)}</dd></div><div><dt>Sekarang</dt><dd>${esc(p.sesudah)}</dd></div></dl>` : ''}
        ${tagHtml(p)}
      </div>
      ${p.url ? `<a class="proyek-domain" href="${esc(p.url)}" target="_blank" rel="noopener" translate="no">${esc(p.domain)}</a>`
        : p.domain ? `<span class="proyek-domain" translate="no">${esc(p.domain)}</span>` : '<span></span>'}
      ${p.gambar ? `<div class="galeri">${p.gambar.map(g => gambarHtml(g)).join('')}</div>` : ''}
    </article>`).join('');
}

/* ---------- e-Katalog ---------- */
function tampilKatalog(list) {
  $('#angka').innerHTML += `<div><dt>Produk di e-Katalog</dt><dd>${list.length}</dd></div>`;
  $('#katalog-list').innerHTML = list.map(k => `
    <article class="produk">
      <p class="produk-jenis">${esc(k.jenis)}</p>
      <h3>${esc(k.nama)}</h3>
      <ul>${k.fitur.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      ${k.url ? `<a class="produk-link" href="${esc(k.url)}" target="_blank" rel="noopener">Lihat di e-Katalog</a>` : ''}
    </article>`).join('');
}

/* ---------- Tentang kami ---------- */
function tampilProfil(p) {
  $('#tentang-isi').innerHTML = `
    ${p.tentang.map(t => `<p>${esc(t)}</p>`).join('')}
    <dl class="legal">
      <div><dt>Nama usaha</dt><dd>${esc(p.nama)}</dd></div>
      <div><dt>Direktur</dt><dd>${esc(p.direktur)}</dd></div>
      ${p.legalitas.map(l => `<div><dt>${esc(l.label)}</dt><dd>${esc(l.isi)}</dd></div>`).join('')}
      <div><dt>Alamat</dt><dd>${esc(p.alamat)}</dd></div>
    </dl>
    ${p.kbli ? `<h3 class="kbli-judul">Bidang usaha (KBLI)</h3>
    <ul class="kbli">${p.kbli.map(k => `<li><b>${esc(k.kode)}</b>${esc(k.nama)}</li>`).join('')}</ul>` : ''}`;
}

Promise.all([ambil('portofolio.json'), ambil('katalog.json'), ambil('profil.json')])
  .then(([porto, katalog, profil]) => { tampilPekerjaan(porto); tampilKatalog(katalog); tampilProfil(profil); })
  .catch(() => {
    const gagal = '<p class="muted">Bagian ini belum dapat dimuat. Muat ulang halaman ini.</p>';
    ['#porto-list', '#katalog-list', '#tentang-isi'].forEach(s => { if ($(s).textContent.includes('Memuat')) $(s).innerHTML = gagal; });
    $('#klien-list').innerHTML = '';
  });

/* ---------- Perbesar tangkapan layar ---------- */
const lihat = $('#lihat');
let asal = null;
function tutupLihat() { lihat.hidden = true; document.body.style.overflow = ''; if (asal) asal.focus(); }
document.addEventListener('click', e => {
  const b = e.target.closest('.shot');
  if (!b) return;
  asal = b;
  lihat.querySelector('img').src = b.dataset.src;
  lihat.querySelector('img').alt = b.dataset.ket;
  lihat.querySelector('figcaption').textContent = b.dataset.ket;
  lihat.hidden = false;
  document.body.style.overflow = 'hidden';
  lihat.querySelector('.lihat-x').focus();
});
lihat.addEventListener('click', e => { if (e.target === lihat || e.target.closest('.lihat-x')) tutupLihat(); });
document.addEventListener('keydown', e => {
  if (lihat.hidden) return;
  if (e.key === 'Escape') tutupLihat();
  if (e.key === 'Tab') { e.preventDefault(); lihat.querySelector('.lihat-x').focus(); }
});

/* ---------- Minta penawaran: membuka WhatsApp, tidak menyimpan apa pun ---------- */
$('#minta-penawaran').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const pesan = [
    'Halo Manna Studio Code, saya ingin meminta penawaran.',
    '',
    'Nama: ' + f.get('nama').trim(),
    'Instansi/usaha: ' + f.get('instansi').trim(),
    'Kebutuhan: ' + f.get('kebutuhan'),
    f.get('keterangan').trim() ? 'Keterangan: ' + f.get('keterangan').trim() : ''
  ].filter((x, i) => x !== '' || i === 1).join('\n');
  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(pesan), '_blank', 'noopener');
});
