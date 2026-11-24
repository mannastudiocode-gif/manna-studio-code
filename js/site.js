/* Website CV. Manna Studio Code
   Isi diambil dari data/*.json supaya bisa diperbarui tanpa menyentuh HTML:
   portofolio.json (pekerjaan), katalog.json (produk e-Katalog), profil.json (tentang kami & klien). */

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ambil = f => fetch('data/' + f, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(f); return r.json(); });
const WA = '6281271278201';

$('#th').textContent = new Date().getFullYear();

/* ---------- Menu di layar kecil ---------- */
const menuBtn = $('.menu-btn');
const tutupMenu = () => { document.body.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', false); menuBtn.textContent = 'Menu'; };
menuBtn.addEventListener('click', () => {
  const buka = document.body.classList.toggle('menu-open');
  menuBtn.setAttribute('aria-expanded', buka);
  menuBtn.textContent = buka ? 'Tutup' : 'Menu';
});
document.querySelectorAll('.links a').forEach(a => a.addEventListener('click', tutupMenu));

/* ---------- Ilustrasi kartu pekerjaan (bukan tangkapan layar asli) ---------- */
function ilustrasi(jenis) {
  const ulang = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
  switch (jenis) {
    case 'grafik': return `<div class="v-grafik">${ulang(6, i => `<i class="${i === 5 ? 'on' : ''}" style="height:${[40, 58, 50, 70, 64, 88][i]}%"></i>`)}</div>`;
    case 'ceklis': return `<div class="v-ceklis">${ulang(3, i => `<p><i class="${i < 2 ? 'ya' : ''}"></i><b style="width:${[70, 55, 62][i]}%"></b></p>`)}</div>`;
    case 'chat': return `<div class="v-chat"><i class="kiri"></i><i class="kanan"></i><i class="kiri pendek"></i></div>`;
    case 'progres': return `<div class="v-progres">${ulang(4, i => `<p><b style="width:${[86, 64, 92, 48][i]}%"></b></p>`)}</div>`;
    case 'tabel': return `<div class="v-tabel"><p class="kepala"><b></b><b></b><b></b></p>${ulang(3, () => '<p><b></b><b></b><b></b></p>')}</div>`;
    case 'cincin': return `<div class="v-cincin"><span>86%</span></div>`;
    case 'kalender': return `<div class="v-kalender">${ulang(21, i => `<i class="${[4, 9, 10, 16].includes(i) ? 'on' : ''}"></i>`)}</div>`;
    case 'perisai': return `<div class="v-perisai"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.6-3.4 8.3-8 9-4.6-.7-8-4.4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg></div>`;
    default: return `<div class="v-web"><b></b><span class="besar"></span><span></span><span></span><span></span></div>`;
  }
}

/* ---------- Pekerjaan ---------- */
function tampilPekerjaan(list) {
  // Angka ringkas: dihitung dari data, bukan diketik manual
  const aplikasi = list.filter(p => p.domain).length;
  const instansi = [...new Set(list.map(p => p.instansi))];
  $('#angka').innerHTML += `
    <div><dt>Aplikasi dipakai</dt><dd>${aplikasi}</dd></div>
    <div><dt>Instansi</dt><dd>${instansi.length}</dd></div>`;

  $('#porto-list').innerHTML = list.map(p => {
    const ubah = p.sebelum
      ? `<details class="proyek-ubah"><summary>Sebelum &amp; sesudah</summary><dl><dt>Sebelumnya</dt><dd>${esc(p.sebelum)}</dd><dt>Sekarang</dt><dd>${esc(p.sesudah)}</dd></dl></details>`
      : p.masalah
        ? `<details class="proyek-ubah"><summary>Sebelum &amp; sesudah</summary><dl><dt>Sebelumnya</dt><dd>${esc(p.masalah)}</dd><dt>Sekarang</dt><dd>${esc((p.solusi || []).join('. '))}.</dd></dl></details>`
        : '';
    const tautan = p.url
      ? `<a class="proyek-domain" href="${esc(p.url)}" target="_blank" rel="noopener" title="${esc(p.domain)}" aria-label="Buka situs ${esc(p.judul)} (${esc(p.domain)})">Buka situs</a>`
      : '';
    return `
    <article class="proyek">
      <div class="thumb t-${esc(p.visual || 'web')}" aria-hidden="true">${ilustrasi(p.visual)}${p.singkat ? `<span class="monogram">${esc(p.singkat)}</span>` : ''}</div>
      <h3>${esc(p.judul)}</h3>
      <p class="proyek-klien">${esc(p.instansi)}${p.tahun ? ', ' + esc(p.tahun) : ''}</p>
      <p class="proyek-satu">${esc(p.satu_baris || p.ringkas)}</p>
      ${ubah}
      ${tautan}
    </article>`;
  }).join('');
  aturGeser();
}

/* Tombol geser kiri/kanan untuk daftar pekerjaan */
function aturGeser() {
  const daftar = $('#porto-list'), kiri = $('.geser-kiri'), kanan = $('.geser-kanan');
  const langkah = () => (daftar.querySelector('.proyek')?.getBoundingClientRect().width || 300) + 20;
  const perbarui = () => {
    kiri.disabled = daftar.scrollLeft <= 4;
    kanan.disabled = daftar.scrollLeft + daftar.clientWidth >= daftar.scrollWidth - 4;
  };
  kiri.addEventListener('click', () => daftar.scrollBy({ left: -langkah(), behavior: 'smooth' }));
  kanan.addEventListener('click', () => daftar.scrollBy({ left: langkah(), behavior: 'smooth' }));
  daftar.addEventListener('scroll', perbarui, { passive: true });
  window.addEventListener('resize', perbarui);
  perbarui();
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

/* ---------- Tentang kami & klien ---------- */
function tampilProfil(p) {
  if (Array.isArray(p.klien) && p.klien.length) $('#klien-list').innerHTML = p.klien.map(k => `<li>${esc(k)}</li>`).join('');
  $('#tentang-isi').innerHTML = p.tentang.map(t => `<p>${esc(t)}</p>`).join('');
  $('#data-perusahaan').innerHTML = `
    <dl class="legal">
      <div><dt>Nama usaha</dt><dd>${esc(p.nama)}</dd></div>
      <div><dt>Direktur</dt><dd>${esc(p.direktur)}</dd></div>
      ${p.legalitas.map(l => `<div><dt>${esc(l.label)}</dt><dd>${esc(l.isi)}</dd></div>`).join('')}
    </dl>
    ${p.kbli ? `<details class="legal-detail"><summary>Bidang usaha (KBLI)</summary><ul class="kbli">${p.kbli.map(k => `<li><b>${esc(k.kode)}</b>${esc(k.nama)}</li>`).join('')}</ul></details>` : ''}`;
}

Promise.all([ambil('portofolio.json'), ambil('katalog.json'), ambil('profil.json')])
  .then(([porto, katalog, profil]) => {
    tampilPekerjaan(porto); tampilKatalog(katalog); tampilProfil(profil);
    if (!Array.isArray(profil.klien)) $('#klien-list').innerHTML = [...new Set(porto.map(p => p.instansi))].map(k => `<li>${esc(k)}</li>`).join('');
  })
  .catch(() => {
    const gagal = '<p class="muted">Bagian ini belum dapat dimuat. Muat ulang halaman ini.</p>';
    ['#porto-list', '#katalog-list', '#tentang-isi', '#data-perusahaan'].forEach(s => { if ($(s).textContent.includes('Memuat')) $(s).innerHTML = gagal; });
    $('#klien-list').innerHTML = '';
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

/* ---------- Tombol WhatsApp mengambang: popup formulir penawaran ---------- */
(function () {
  const IKON_WA = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 3C9.05 3 3.4 8.63 3.4 15.6c0 2.23.59 4.4 1.7 6.32L3.3 28.6l6.86-1.78a12.6 12.6 0 0 0 5.88 1.48h.01c6.98 0 12.65-5.64 12.65-12.6C28.7 8.63 23.03 3 16.04 3zm0 23.14h-.01a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-4.07 1.06 1.09-3.96-.25-.4a10.42 10.42 0 0 1-1.6-5.55c0-5.79 4.73-10.5 10.57-10.5 5.83 0 10.56 4.71 10.56 10.5 0 5.8-4.73 10.54-10.56 10.54zm5.79-7.88c-.32-.16-1.88-.92-2.17-1.03-.29-.1-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.19.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.87-1.76-2.19-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.55.08-.84.4-.29.32-1.1 1.07-1.1 2.62 0 1.55 1.13 3.04 1.29 3.25.16.21 2.22 3.38 5.37 4.74.75.32 1.34.52 1.8.66.75.24 1.44.2 1.98.12.6-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z"/></svg>';
  const isian = $('#isian-penawaran');
  const akar = document.createElement('div');
  akar.className = 'wa-apung';
  akar.innerHTML = `
    <div class="wa-latar" hidden></div>
    <section class="wa-panel" id="wa-panel" role="dialog" aria-modal="true" aria-labelledby="wa-judul" hidden>
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
  const form = akar.querySelector('.wa-form');
  form.appendChild(isian.content.cloneNode(true));
  const kirim = document.createElement('button');
  kirim.className = 'btn'; kirim.type = 'submit'; kirim.textContent = 'Kirim lewat WhatsApp';
  form.appendChild(kirim);
  const ket = document.createElement('p');
  ket.className = 'wa-ket';
  ket.textContent = 'Membuka WhatsApp dengan pesan yang sudah tersusun. Tidak ada data yang disimpan di website ini.';
  form.appendChild(ket);
  document.body.appendChild(akar);

  const panel = akar.querySelector('.wa-panel'), buka = akar.querySelector('.wa-buka'), latar = akar.querySelector('.wa-latar');
  let asal = null;
  const tampil = () => {
    asal = document.activeElement;
    panel.hidden = latar.hidden = false; akar.classList.add('terbuka'); buka.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('kunci-gulir');
    setTimeout(() => form.querySelector('input').focus(), 0);
  };
  const tutup = () => {
    panel.hidden = latar.hidden = true; akar.classList.remove('terbuka'); buka.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('kunci-gulir');
    (asal && document.contains(asal) ? asal : buka).focus();
  };
  buka.addEventListener('click', () => (panel.hidden ? tampil() : tutup()));
  akar.querySelector('.wa-tutup').addEventListener('click', tutup);
  latar.addEventListener('click', tutup);
  document.addEventListener('keydown', e => {
    if (panel.hidden) return;
    if (e.key === 'Escape') tutup();
    if (e.key === 'Tab') { // fokus tetap di dalam popup
      const f = [...panel.querySelectorAll('button, input, select, textarea')];
      const awal = f[0], akhir = f[f.length - 1];
      if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
      else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
    }
  });
  form.addEventListener('submit', e => { e.preventDefault(); kirimPenawaran(form); });
  // Semua tombol "Konsultasi" membuka panel ini
  document.querySelectorAll('.ajak-wa').forEach(a => a.addEventListener('click', e => { e.preventDefault(); tutupMenu(); tampil(); }));
})();
