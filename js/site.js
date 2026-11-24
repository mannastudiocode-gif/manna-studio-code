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
  $('#angka').innerHTML += `
    <div><dt>Aplikasi dipakai</dt><dd>${aplikasi}</dd></div>
    <div><dt>Instansi</dt><dd>${instansi.length}</dd></div>`;

  // Studi kasus: proyek yang punya catatan masalah dan solusi
  $('#sorotan').innerHTML = list.filter(p => p.masalah).map(p => `
    <article class="kasus${p.gambar && p.gambar.length ? '' : ' kasus-teks-saja'}">
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
  // Deretan 'Dipakai oleh': urutan dari profil.json, bila ada
  if (Array.isArray(p.klien) && p.klien.length) $('#klien-list').innerHTML = p.klien.map(k => `<li>${esc(k)}</li>`).join('');
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
  .then(([porto, katalog, profil]) => {
    tampilPekerjaan(porto); tampilKatalog(katalog); tampilProfil(profil);
    if (!Array.isArray(profil.klien)) $('#klien-list').innerHTML = [...new Set(porto.map(p => p.instansi))].map(k => `<li>${esc(k)}</li>`).join('');
  })
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
function kirimPenawaran(form) {
  const f = new FormData(form);
  const pesan = [
    'Halo Manna Studio Code, saya ingin meminta penawaran.',
    '',
    'Nama: ' + f.get('nama').trim(),
    'Instansi/usaha: ' + f.get('instansi').trim(),
    'Kebutuhan: ' + f.get('kebutuhan'),
    f.get('keterangan').trim() ? 'Keterangan: ' + f.get('keterangan').trim() : ''
  ].filter((x, i) => x !== '' || i === 1).join('\n');
  window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(pesan), '_blank', 'noopener');
}
$('#minta-penawaran').addEventListener('submit', e => { e.preventDefault(); kirimPenawaran(e.target); });

/* ---------- Tombol WhatsApp mengambang: formulir yang sama dalam panel ---------- */
(function () {
  const IKON_WA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 3C9.05 3 3.4 8.63 3.4 15.6c0 2.23.59 4.4 1.7 6.32L3.3 28.6l6.86-1.78a12.6 12.6 0 0 0 5.88 1.48h.01c6.98 0 12.65-5.64 12.65-12.6C28.7 8.63 23.03 3 16.04 3zm0 23.14h-.01a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-4.07 1.06 1.09-3.96-.25-.4a10.42 10.42 0 0 1-1.6-5.55c0-5.79 4.73-10.5 10.57-10.5 5.83 0 10.56 4.71 10.56 10.5 0 5.8-4.73 10.54-10.56 10.54zm5.79-7.88c-.32-.16-1.88-.92-2.17-1.03-.29-.1-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.570-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.55.08-.84.4-.29.32-1.1 1.07-1.1 2.62 0 1.55 1.13 3.04 1.29 3.25.16.21 2.22 3.38 5.37 4.74.75.32 1.34.52 1.8.66.75.24 1.44.2 1.98.12.6-.09 1.88-.77 2.140-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z"/></svg>';
  const asli = $('#minta-penawaran');
  const akar = document.createElement('div');
  akar.className = 'wa-apung';
  akar.innerHTML = `
    <section class="wa-panel" id="wa-panel" role="dialog" aria-modal="false" aria-labelledby="wa-judul" hidden>
      <header class="wa-atas">
        <span class="wa-ikon">${IKON_WA}</span>
        <div><h2 id="wa-judul">Minta penawaran</h2><p>Lewat WhatsApp 0812-7127-8201</p></div>
        <button type="button" class="wa-tutup" aria-label="Tutup formulir">×</button>
      </header>
      <form class="wa-form"></form>
    </section>
    <button type="button" class="wa-buka" aria-expanded="false" aria-controls="wa-panel" aria-label="Minta penawaran lewat WhatsApp">
      ${IKON_WA}<span>Chat WhatsApp</span>
    </button>`;
  // Salin isian dari formulir statis (judul dan keterangannya tidak ikut)
  const form = akar.querySelector('.wa-form');
  [...asli.children].forEach(el => { if (!el.matches('h3, .minta-ket')) form.appendChild(el.cloneNode(true)); });
  const ket = document.createElement('p');
  ket.className = 'wa-ket';
  ket.textContent = 'Membuka WhatsApp dengan pesan yang sudah tersusun. Tidak ada data yang disimpan di website ini.';
  form.appendChild(ket);
  document.body.appendChild(akar);

  const panel = akar.querySelector('.wa-panel'), buka = akar.querySelector('.wa-buka');
  let asal = null;
  const tampil = () => {
    asal = document.activeElement;
    panel.hidden = false; akar.classList.add('terbuka'); buka.setAttribute('aria-expanded', 'true');
    setTimeout(() => form.querySelector('input').focus(), 0);
  };
  const tutup = () => {
    panel.hidden = true; akar.classList.remove('terbuka'); buka.setAttribute('aria-expanded', 'false');
    (asal && document.contains(asal) ? asal : buka).focus();
  };
  buka.addEventListener('click', () => (panel.hidden ? tampil() : tutup()));
  akar.querySelector('.wa-tutup').addEventListener('click', tutup);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) tutup(); });
  form.addEventListener('submit', e => { e.preventDefault(); kirimPenawaran(form); });
})();
