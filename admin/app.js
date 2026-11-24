/* Dashboard CV. Manna Studio Code */
(function () {
  const $ = s => document.querySelector(s);
  const P = window.MSC_PERUSAHAAN;
  const KATEGORI = ['Legalitas', 'Kontrak / SPK', 'Penawaran', 'BAST', 'Invoice / Kuitansi', 'Pajak', 'Laporan', 'Lainnya'];
  const STATUS = { belum: 'Belum dibayar', lunas: 'Lunas', batal: 'Batal' };
  const STATUS_IC = { belum: '⏳', lunas: '✓', batal: '✕' };

  let cache = { pelanggan: [], invoice: [], dokumen: [] };

  // ---------------- Pembantu ----------------
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rp = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0));
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const tgl = d => { if (!d) return '–'; const [y, m, dd] = String(d).slice(0, 10).split('-'); return +dd + ' ' + BULAN[+m - 1] + ' ' + y; };
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const pelangganOf = id => cache.pelanggan.find(p => p.id === id);
  const ukuran = b => !b ? '' : b < 1024 * 1024 ? (b / 1024).toFixed(0) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB';

  function hitung(inv) {
    const dasar = (inv.item || []).reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.harga) || 0), 0);
    const ppn = Math.round(dasar * (Number(inv.ppn_persen) || 0) / 100);
    return { dasar, ppn, total: dasar + ppn };
  }

  function terbilang(n) {
    n = Math.floor(Math.abs(n));
    const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
    const f = x => {
      if (x < 12) return s[x];
      if (x < 20) return f(x - 10) + ' belas';
      if (x < 100) return f(Math.floor(x / 10)) + ' puluh ' + f(x % 10);
      if (x < 200) return 'seratus ' + f(x - 100);
      if (x < 1000) return f(Math.floor(x / 100)) + ' ratus ' + f(x % 100);
      if (x < 2000) return 'seribu ' + f(x - 1000);
      if (x < 1e6) return f(Math.floor(x / 1000)) + ' ribu ' + f(x % 1000);
      if (x < 1e9) return f(Math.floor(x / 1e6)) + ' juta ' + f(x % 1e6);
      if (x < 1e12) return f(Math.floor(x / 1e9)) + ' miliar ' + f(x % 1e9);
      return f(Math.floor(x / 1e12)) + ' triliun ' + f(x % 1e12);
    };
    const t = n === 0 ? 'nol' : f(n).replace(/\s+/g, ' ').trim();
    return t.charAt(0).toUpperCase() + t.slice(1) + ' rupiah';
  }

  function nomorBerikut() {
    const max = cache.invoice.reduce((m, i) => { const x = /(\d+)\s*$/.exec(i.nomor || ''); return x ? Math.max(m, +x[1]) : m; }, 0);
    return 'msc-' + String(max + 1).padStart(3, '0');
  }

  function toast(msg, err) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'toast' + (err ? ' toast-err' : ''); t.hidden = false;
    clearTimeout(t._h); t._h = setTimeout(() => (t.hidden = true), 3500);
  }

  function pesanError(e) {
    const m = String((e && e.message) || '');
    if (/failed to fetch|networkerror|load failed/i.test(m)) return 'Tidak tersambung ke internet. Periksa koneksi, lalu coba lagi.';
    if (/jwt|expired|not authenticated|invalid claim/i.test(m)) return 'Sesi login sudah habis. Muat ulang halaman, lalu masuk lagi.';
    if (/duplicate key|unique/i.test(m)) return 'Nomor itu sudah dipakai. Gunakan nomor lain.';
    if (/foreign key|violates/i.test(m)) return 'Data ini masih dipakai di tempat lain, jadi belum bisa diubah atau dihapus.';
    if (/payload too large|exceeded the maximum/i.test(m)) return 'File terlalu besar. Batasnya 50 MB per file.';
    if (/permission denied|row-level security/i.test(m)) return 'Akun ini tidak punya akses untuk tindakan itu.';
    return m || 'Tindakan tadi gagal. Coba lagi.';
  }

  async function aman(fn, ok) {
    try { const r = await fn(); if (ok) toast(ok); return r; }
    catch (e) { console.error(e); toast(pesanError(e), true); throw e; }
  }

  // ---------------- Modal ----------------
  let onClose = null, asalFokus = null;
  const FOKUS = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, iframe, video[controls]';
  function modal(title, html, { wide = false, full = false } = {}) {
    if ($('#modal').hidden) asalFokus = document.activeElement;
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    const box = $('#modal .modal-box');
    box.className = 'modal-box' + (wide ? ' wide' : '') + (full ? ' full' : '');
    $('#modal').hidden = false;
    setTimeout(() => {
      const f = $('#modal-body').querySelector('input:not([type=hidden]), select, textarea, button') || $('#modal-x');
      f.focus();
    }, 0);
    return $('#modal-body');
  }
  function tutup() {
    $('#modal').hidden = true; $('#modal-body').innerHTML = '';
    if (onClose) { const f = onClose; onClose = null; f(); }
    const asal = asalFokus; asalFokus = null;
    // Halaman bisa digambar ulang setelah menyimpan; cari tombol pengganti dengan id yang sama.
    setTimeout(() => {
      const t = asal && (document.contains(asal) ? asal : (asal.id && document.getElementById(asal.id)));
      (t || $('#view')).focus();
    }, 0);
  }
  $('#modal-x').onclick = tutup;
  $('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') tutup(); });
  document.addEventListener('keydown', e => {
    if ($('#modal').hidden) return;
    if (e.key === 'Escape') return tutup();
    if (e.key !== 'Tab') return;
    const el = [...$('#modal .modal-box').querySelectorAll(FOKUS)].filter(x => x.offsetParent !== null);
    if (!el.length) return;
    const awal = el[0], akhir = el[el.length - 1];
    if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
    else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
  });

  function tanya(judul, pesan, label) {
    return new Promise(ok => {
      const b = modal(judul, `<p>${esc(pesan)}</p>
        <div class="form-act"><button class="btn btn-ghost" data-n>Batal</button><button class="btn btn-danger" data-y>${esc(label)}</button></div>`);
      let jawab = false;
      onClose = () => ok(jawab);
      b.querySelector('[data-n]').onclick = tutup;
      b.querySelector('[data-y]').onclick = () => { jawab = true; tutup(); };
    });
  }

  const opsiPelanggan = sel => '<option value="">— pilih pelanggan —</option>' +
    cache.pelanggan.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.nama)}${p.unit ? ' · ' + esc(p.unit) : ''}</option>`).join('');

  const badge = st => `<span class="badge st-${st}">${STATUS_IC[st] || ''} ${STATUS[st] || st}</span>`;

  // ---------------- Halaman: Ringkasan ----------------
  function vRingkasan() {
    const th = String(new Date().getFullYear());
    const invTh = cache.invoice.filter(i => i.status !== 'batal' && String(i.tanggal).startsWith(th));
    const sum = arr => arr.reduce((s, i) => s + hitung(i).total, 0);
    const lunas = invTh.filter(i => i.status === 'lunas');
    const belumSemua = cache.invoice.filter(i => i.status === 'belum')
      .sort((a, b) => String(a.jatuh_tempo || a.tanggal).localeCompare(String(b.jatuh_tempo || b.tanggal)));
    const hariIni = today();

    $('#view').innerHTML = `
      <div class="head"><h1>Ringkasan</h1></div>
      <div class="tiles">
        <div class="tile"><span>Total tagihan ${th}</span><b>${rp(sum(invTh))}</b><small>${invTh.length} invoice</small></div>
        <div class="tile"><span>Sudah dibayar ${th}</span><b>${rp(sum(lunas))}</b><small>${lunas.length} invoice lunas</small></div>
        <div class="tile"><span>Belum dibayar (semua)</span><b>${rp(sum(belumSemua))}</b><small>${belumSemua.length} invoice menunggu</small></div>
        <div class="tile"><span>Pelanggan</span><b>${cache.pelanggan.length}</b><small>${cache.dokumen.length} dokumen tersimpan</small></div>
      </div>
      <section class="panel">
        <div class="panel-head"><h2>Tagihan yang belum dibayar</h2><a href="#invoice" class="link">Lihat semua invoice</a></div>
        ${belumSemua.length ? `<table class="tbl"><thead><tr><th>Nomor</th><th>Pelanggan</th><th>Tanggal</th><th>Jatuh tempo</th><th class="r">Total</th></tr></thead><tbody>
          ${belumSemua.map(i => {
            const lewat = i.jatuh_tempo && i.jatuh_tempo < hariIni;
            return `<tr><td><a href="#" data-lihat="${i.id}">${esc(i.nomor)}</a></td><td>${esc(pelangganOf(i.pelanggan_id)?.nama || '–')}</td>
              <td>${tgl(i.tanggal)}</td><td>${tgl(i.jatuh_tempo)}${lewat ? ' <span class="badge st-telat">⚠ Lewat jatuh tempo</span>' : ''}</td><td class="r">${rp(hitung(i).total)}</td></tr>`;
          }).join('')}</tbody></table>` : '<p class="kosong">Semua tagihan sudah dibayar.</p>'}
      </section>`;
    $('#view').querySelectorAll('[data-lihat]').forEach(a => a.onclick = e => { e.preventDefault(); lihatInvoice(a.dataset.lihat); });
  }

  // ---------------- Halaman: Pelanggan ----------------
  function vPelanggan() {
    $('#view').innerHTML = `
      <div class="head"><h1>Pelanggan</h1><button class="btn" id="tambah">+ Tambah pelanggan</button></div>
      <div class="filter"><input type="search" id="cari" aria-label="Cari pelanggan" placeholder="Cari nama, unit, kontak…"></div>
      <section class="panel"><div id="tabel"></div></section>`;
    const render = () => {
      const q = $('#cari').value.toLowerCase();
      const rows = cache.pelanggan.filter(p => [p.nama, p.unit, p.kontak, p.telepon, p.email].join(' ').toLowerCase().includes(q))
        .sort((a, b) => a.nama.localeCompare(b.nama));
      $('#tabel').innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Nama instansi / perusahaan</th><th>Kontak</th><th>Telepon</th><th class="r">Invoice</th><th class="r">Nilai</th><th></th></tr></thead><tbody>
        ${rows.map(p => {
          const inv = cache.invoice.filter(i => i.pelanggan_id === p.id && i.status !== 'batal');
          return `<tr><td><b>${esc(p.nama)}</b>${p.unit ? `<br><small>${esc(p.unit)}</small>` : ''}</td>
            <td>${esc(p.kontak || '–')}${p.jabatan ? `<br><small>${esc(p.jabatan)}</small>` : ''}</td>
            <td>${p.telepon ? `<a href="https://wa.me/${esc(p.telepon.replace(/\D/g, '').replace(/^0/, '62'))}" target="_blank" rel="noopener">${esc(p.telepon)}</a>` : '–'}</td>
            <td class="r">${inv.length}</td><td class="r">${rp(inv.reduce((s, i) => s + hitung(i).total, 0))}</td>
            <td class="act"><button class="btn-sm btn-ghost btn" data-ubah="${p.id}">Ubah</button><button class="btn-sm btn-x btn" data-hapus="${p.id}">Hapus</button></td></tr>`;
        }).join('')}</tbody></table>` : '<p class="kosong">Belum ada pelanggan. Tambahkan pelanggan pertama, lalu buat invoice untuknya.</p>';
      $('#tabel').querySelectorAll('[data-ubah]').forEach(b => b.onclick = () => formPelanggan(pelangganOf(b.dataset.ubah)));
      $('#tabel').querySelectorAll('[data-hapus]').forEach(b => b.onclick = () => hapusPelanggan(b.dataset.hapus));
    };
    $('#cari').oninput = render;
    $('#tambah').onclick = () => formPelanggan();
    render();
  }

  function formPelanggan(p = {}) {
    const f = (n, l, t = 'text', full) => `<label class="${full ? 'full' : ''}">${l}<input type="${t}" name="${n}" value="${esc(p[n] || '')}"></label>`;
    const b = modal(p.id ? 'Ubah pelanggan' : 'Tambah pelanggan', `
      <form class="form" id="f">
        <label class="full">Nama instansi / perusahaan *<input name="nama" required value="${esc(p.nama || '')}"></label>
        ${f('unit', 'Bidang / bagian')}${f('npwp', 'NPWP')}
        ${f('kontak', 'Nama yang dihubungi')}${f('jabatan', 'Jabatan')}
        ${f('telepon', 'Telepon / WA', 'tel')}${f('email', 'Email', 'email')}
        <label class="full">Alamat<textarea name="alamat" rows="2">${esc(p.alamat || '')}</textarea></label>
        <label class="full">Catatan<textarea name="catatan" rows="2">${esc(p.catatan || '')}</textarea></label>
        <div class="form-act full"><button type="button" class="btn btn-ghost" data-batal>Batal</button><button class="btn">Simpan</button></div>
      </form>`, { wide: true });
    b.querySelector('[data-batal]').onclick = tutup;
    b.querySelector('#f').onsubmit = async e => {
      e.preventDefault();
      const row = Object.fromEntries(new FormData(e.target));
      if (p.id) row.id = p.id;
      await aman(() => DB.save('pelanggan', row), 'Pelanggan tersimpan');
      tutup(); await muat(); tampil();
    };
  }

  async function hapusPelanggan(id) {
    if (cache.invoice.some(i => i.pelanggan_id === id)) return toast('Pelanggan ini masih punya invoice, jadi belum bisa dihapus.', true);
    if (!await tanya('Hapus pelanggan ' + pelangganOf(id).nama + '?', 'Data pelanggan ini akan hilang dan tidak bisa dikembalikan.', 'Hapus pelanggan')) return;
    await aman(() => DB.remove('pelanggan', id), 'Pelanggan dihapus');
    await muat(); tampil();
  }

  // ---------------- Halaman: Invoice ----------------
  function vInvoice() {
    $('#view').innerHTML = `
      <div class="head"><h1>Invoice</h1><button class="btn" id="tambah">+ Buat invoice</button></div>
      <div class="filter">
        <input type="search" id="cari" aria-label="Cari invoice" placeholder="Cari nomor, pelanggan, perihal…">
        <select id="fst" aria-label="Saring status"><option value="">Semua status</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
        <select id="fth" aria-label="Saring tahun"><option value="">Semua tahun</option>${[...new Set(cache.invoice.map(i => String(i.tanggal).slice(0, 4)))].sort().reverse().map(y => `<option>${y}</option>`).join('')}</select>
      </div>
      <section class="panel"><div id="tabel"></div></section>`;
    const render = () => {
      const q = $('#cari').value.toLowerCase(), st = $('#fst').value, th = $('#fth').value;
      const rows = cache.invoice.filter(i =>
        (!st || i.status === st) && (!th || String(i.tanggal).startsWith(th)) &&
        [i.nomor, i.perihal, pelangganOf(i.pelanggan_id)?.nama].join(' ').toLowerCase().includes(q))
        .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)) || String(b.nomor).localeCompare(String(a.nomor)));
      $('#tabel').innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Nomor</th><th>Tanggal</th><th>Pelanggan / perihal</th><th class="r">Total</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map(i => `<tr>
          <td><b>${esc(i.nomor)}</b></td><td>${tgl(i.tanggal)}</td>
          <td>${esc(pelangganOf(i.pelanggan_id)?.nama || '–')}<br><small>${esc(i.perihal || '')}</small></td>
          <td class="r">${rp(hitung(i).total)}</td><td>${badge(i.status)}</td>
          <td class="act">
            <button class="btn btn-sm" data-lihat="${i.id}">Lihat / Cetak</button>
            <button class="btn btn-sm btn-ghost" data-ubah="${i.id}">Ubah</button>
            ${i.status === 'belum' ? `<button class="btn btn-sm btn-ok" data-lunas="${i.id}">Tandai lunas</button>` : ''}
            <button class="btn btn-sm btn-x" data-hapus="${i.id}">Hapus</button>
          </td></tr>`).join('')}</tbody></table>` : '<p class="kosong">Belum ada invoice yang cocok. Klik Buat invoice untuk membuat tagihan baru.</p>';
      const on = (a, fn) => $('#tabel').querySelectorAll(`[data-${a}]`).forEach(b => b.onclick = () => fn(b.dataset[a]));
      on('lihat', lihatInvoice);
      on('ubah', id => formInvoice(cache.invoice.find(i => i.id === id)));
      on('lunas', tandaiLunas);
      on('hapus', async id => {
        const inv = cache.invoice.find(i => i.id === id);
        if (!await tanya('Hapus invoice ' + inv.nomor + '?', 'Invoice yang dihapus tidak bisa dikembalikan, dan nomornya akan hilang dari urutan. Kalau tagihan ini dibatalkan, lebih baik ubah statusnya menjadi Batal.', 'Hapus invoice')) return;
        await aman(() => DB.remove('invoice', id), 'Invoice dihapus'); await muat(); tampil();
      });
    };
    ['cari', 'fst', 'fth'].forEach(id => $('#' + id).oninput = render);
    $('#tambah').onclick = () => cache.pelanggan.length ? formInvoice() : toast('Invoice butuh data pelanggan. Tambahkan pelanggan dulu di menu Pelanggan.', true);
    render();
  }

  function tandaiLunas(id) {
    const inv = cache.invoice.find(i => i.id === id);
    const b = modal('Tandai lunas: ' + inv.nomor, `<form class="form" id="f">
      <label class="full">Tanggal pembayaran diterima<input type="date" name="tanggal_bayar" value="${today()}" required></label>
      <div class="form-act full"><button type="button" class="btn btn-ghost" data-batal>Batal</button><button class="btn btn-ok">Tandai lunas</button></div></form>`);
    b.querySelector('[data-batal]').onclick = tutup;
    b.querySelector('#f').onsubmit = async e => {
      e.preventDefault();
      await aman(() => DB.save('invoice', { id, status: 'lunas', tanggal_bayar: e.target.tanggal_bayar.value }), 'Invoice ditandai lunas');
      tutup(); await muat(); tampil();
    };
  }

  function formInvoice(inv) {
    const baru = !inv;
    inv = inv ? JSON.parse(JSON.stringify(inv)) : { nomor: nomorBerikut(), tanggal: today(), ppn_persen: 0, status: 'belum', item: [{ uraian: '', qty: 1, satuan: 'Paket', harga: 0 }] };
    const b = modal(baru ? 'Buat invoice' : 'Ubah invoice ' + inv.nomor, `
      <form class="form" id="f">
        <label>Nomor invoice *<input name="nomor" required value="${esc(inv.nomor)}"></label>
        <label>Pelanggan *<select name="pelanggan_id" required>${opsiPelanggan(inv.pelanggan_id)}</select></label>
        <label>Tanggal *<input type="date" name="tanggal" required value="${esc(inv.tanggal || '')}"></label>
        <label>Jatuh tempo<input type="date" name="jatuh_tempo" value="${esc(inv.jatuh_tempo || '')}"></label>
        <label class="full">Perihal<input name="perihal" value="${esc(inv.perihal || '')}" placeholder="mis. Pembuatan Aplikasi E-Aspirasi DPRD"></label>
        <div class="full">
          <table class="tbl items"><thead><tr><th>Uraian</th><th style="width:70px">Jml</th><th style="width:100px">Satuan</th><th style="width:150px">Harga satuan (Rp)</th><th class="r" style="width:140px">Jumlah</th><th style="width:36px"></th></tr></thead><tbody id="items"></tbody></table>
          <button type="button" class="btn btn-ghost btn-sm" id="add-item">+ Tambah baris</button>
        </div>
        <label>PPN (%)<input type="number" name="ppn_persen" min="0" step="0.01" value="${esc(inv.ppn_persen)}"><small>Isi 0 selama CV belum PKP</small></label>
        <label>Status<select name="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${k === inv.status ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label>Tanggal dibayar<input type="date" name="tanggal_bayar" value="${esc(inv.tanggal_bayar || '')}"></label>
        <div class="sum" id="sum"></div>
        <label class="full">Catatan di invoice<textarea name="catatan" rows="2">${esc(inv.catatan || '')}</textarea></label>
        <div class="form-act full"><button type="button" class="btn btn-ghost" data-batal>Batal</button><button class="btn">Simpan invoice</button></div>
      </form>`, { wide: true });

    const tbody = b.querySelector('#items');
    const baris = it => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input data-k="uraian" aria-label="Uraian" value="${esc(it.uraian)}" required></td>
        <td><input data-k="qty" aria-label="Jumlah" type="number" min="0" step="any" value="${esc(it.qty)}"></td>
        <td><input data-k="satuan" aria-label="Satuan" value="${esc(it.satuan || '')}"></td>
        <td><input data-k="harga" aria-label="Harga satuan" type="number" min="0" step="any" value="${esc(it.harga)}"></td>
        <td class="r" data-j></td><td><button type="button" class="x" title="Hapus baris" aria-label="Hapus baris">×</button></td>`;
      tr.querySelector('.x').onclick = () => { if (tbody.children.length > 1) { tr.remove(); ulang(); } };
      tbody.appendChild(tr);
    };
    const ambilItem = () => [...tbody.children].map(tr => {
      const g = k => tr.querySelector(`[data-k=${k}]`).value;
      return { uraian: g('uraian'), qty: Number(g('qty')) || 0, satuan: g('satuan'), harga: Number(g('harga')) || 0 };
    });
    const ulang = () => {
      const items = ambilItem();
      [...tbody.children].forEach((tr, i) => tr.querySelector('[data-j]').textContent = rp(items[i].qty * items[i].harga));
      const h = hitung({ item: items, ppn_persen: b.querySelector('[name=ppn_persen]').value });
      b.querySelector('#sum').innerHTML = (h.ppn ? `<div><span>Harga dasar</span><b>${rp(h.dasar)}</b></div><div><span>PPN</span><b>${rp(h.ppn)}</b></div>` : '') + `<div class="tot"><span>Total</span><b>${rp(h.total)}</b></div>`;
    };
    inv.item.forEach(baris);
    b.querySelector('#add-item').onclick = () => { baris({ uraian: '', qty: 1, satuan: '', harga: 0 }); ulang(); };
    b.querySelector('#f').addEventListener('input', ulang);
    b.querySelector('[data-batal]').onclick = tutup;
    ulang();

    b.querySelector('#f').onsubmit = async e => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.target));
      const row = {
        nomor: fd.nomor.trim(), pelanggan_id: fd.pelanggan_id, tanggal: fd.tanggal, jatuh_tempo: fd.jatuh_tempo || null,
        perihal: fd.perihal, item: ambilItem(), ppn_persen: Number(fd.ppn_persen) || 0, status: fd.status,
        tanggal_bayar: fd.tanggal_bayar || null, catatan: fd.catatan
      };
      if (row.status === 'lunas' && !row.tanggal_bayar) row.tanggal_bayar = today();
      if (!baru) row.id = inv.id;
      if (cache.invoice.some(i => i.nomor === row.nomor && i.id !== inv.id)) return toast('Nomor ' + row.nomor + ' sudah dipakai invoice lain.', true);
      const s = await aman(() => DB.save('invoice', row), 'Invoice tersimpan');
      tutup(); await muat(); tampil();
      lihatInvoice(s.id);
    };
  }

  function dokInvoice(inv) {
    const p = pelangganOf(inv.pelanggan_id) || {};
    const h = hitung(inv);
    const logo = new URL('../assets/msc-logo.png', location.href).href;
    return `<div class="inv">
      <div class="inv-kop">
        <img src="${logo}" alt="">
        <div><b>${esc(P.nama)}</b><span>${esc(P.tagline)}</span><span>${esc(P.alamat)}</span><span>Telp ${esc(P.telepon)} · WA ${esc(P.wa || P.telepon)}</span><span>${esc(P.email)} · ${esc(P.web)}</span></div>
      </div>
      <div class="inv-top">
        <div class="inv-to"><small>Kepada Yth.</small>
          ${p.kontak ? `<b>${esc(p.kontak)}${p.jabatan ? ', ' + esc(p.jabatan) : ''}</b>` : ''}
          <b>${esc(p.nama || '')}</b>${p.unit ? `<span>${esc(p.unit)}</span>` : ''}${p.alamat ? `<span>${esc(p.alamat)}</span>` : ''}${p.npwp ? `<span>NPWP ${esc(p.npwp)}</span>` : ''}
        </div>
        <div class="inv-meta"><h1>INVOICE</h1>
          <table><tr><td>Nomor</td><td>: <b>${esc(inv.nomor)}</b></td></tr><tr><td>Tanggal</td><td>: ${tgl(inv.tanggal)}</td></tr>
          ${inv.jatuh_tempo ? `<tr><td>Jatuh tempo</td><td>: ${tgl(inv.jatuh_tempo)}</td></tr>` : ''}</table>
        </div>
      </div>
      ${inv.perihal ? `<p class="inv-hal">Perihal: <b>${esc(inv.perihal)}</b></p>` : ''}
      <table class="inv-tbl"><thead><tr><th>No</th><th>Uraian</th><th>Jumlah</th><th>Harga Satuan</th><th>Total</th></tr></thead><tbody>
        ${(inv.item || []).map((it, n) => `<tr><td class="c">${n + 1}</td><td>${esc(it.uraian)}</td><td class="c">${esc(it.qty)} ${esc(it.satuan || '')}</td><td class="r">${rp(it.harga)}</td><td class="r">${rp(it.qty * it.harga)}</td></tr>`).join('')}
      </tbody><tfoot>
        ${h.ppn ? `<tr><td colspan="4" class="r">Harga (sebelum PPN)</td><td class="r">${rp(h.dasar)}</td></tr>
        <tr><td colspan="4" class="r">PPN ${esc(inv.ppn_persen)}%</td><td class="r">${rp(h.ppn)}</td></tr>` : ''}
        <tr class="grand"><td colspan="4" class="r">TOTAL</td><td class="r">${rp(h.total)}</td></tr>
      </tfoot></table>
      <p class="inv-terbilang"><i>Terbilang: ${terbilang(h.total)}</i></p>
      <div class="inv-bawah">
        <div class="inv-bayar"><b>Pembayaran ditransfer ke:</b>
          <span>${esc(P.bank)}</span><span>No. Rekening <b>${esc(P.rekening)}</b></span><span>a.n. ${esc(P.atasNama)}</span>
          ${inv.catatan ? `<p class="inv-cat">${esc(inv.catatan)}</p>` : ''}
          ${inv.status === 'lunas' ? `<div class="inv-lunas">LUNAS${inv.tanggal_bayar ? ' · ' + tgl(inv.tanggal_bayar) : ''}</div>` : ''}
        </div>
        <div class="inv-ttd"><span>${esc(P.kota)}, ${tgl(inv.tanggal)}</span><span>${esc(P.nama)}</span><span>Direktur</span><div class="ruang"></div><b>${esc(P.direktur)}</b></div>
      </div>
    </div>`;
  }

  function lihatInvoice(id) {
    const inv = cache.invoice.find(i => i.id === id);
    const b = modal('Invoice ' + inv.nomor, `
      <div class="pv-bar"><button class="btn" id="cetak">🖨 Cetak / Simpan PDF</button><button class="btn btn-ghost" id="ubah">Ubah</button></div>
      <div class="pv-kertas">${dokInvoice(inv)}</div>`, { wide: true });
    b.querySelector('#ubah').onclick = () => { tutup(); formInvoice(inv); };
    b.querySelector('#cetak').onclick = () => {
      $('#print-area').innerHTML = dokInvoice(inv);
      const judul = document.title;
      document.title = inv.nomor + ' - ' + (pelangganOf(inv.pelanggan_id)?.nama || 'invoice'); // nama file PDF
      const img = $('#print-area img');
      const go = () => { window.print(); document.title = judul; };
      img.complete ? go() : (img.onload = img.onerror = go);
    };
  }

  // ---------------- Halaman: Dokumen ----------------
  function vDokumen() {
    $('#view').innerHTML = `
      <div class="head"><h1>Dokumen perusahaan</h1><button class="btn" id="tambah">+ Unggah dokumen</button></div>
      <div class="filter">
        <input type="search" id="cari" aria-label="Cari dokumen" placeholder="Cari judul, nama file, keterangan…">
        <select id="fkat" aria-label="Saring kategori"><option value="">Semua kategori</option>${KATEGORI.map(k => `<option>${k}</option>`).join('')}</select>
        <select id="fpel" aria-label="Saring pelanggan"><option value="">Semua pelanggan</option>${cache.pelanggan.map(p => `<option value="${p.id}">${esc(p.nama)}</option>`).join('')}</select>
      </div>
      <section class="panel"><div id="tabel"></div></section>`;
    const ikon = t => `<span class="jenis">${/pdf/.test(t) ? 'PDF' : /image/.test(t) ? 'Gambar' : /video/.test(t) ? 'Video' : /sheet|excel|csv/.test(t) ? 'Excel' : /word|document/.test(t) ? 'Word' : 'File'}</span>`;
    const render = () => {
      const q = $('#cari').value.toLowerCase(), k = $('#fkat').value, pl = $('#fpel').value;
      const rows = cache.dokumen.filter(d => (!k || d.kategori === k) && (!pl || d.pelanggan_id === pl) &&
        [d.judul, d.nama_file, d.keterangan].join(' ').toLowerCase().includes(q));
      $('#tabel').innerHTML = rows.length ? `<table class="tbl"><thead><tr><th>Dokumen</th><th>Kategori</th><th>Tanggal</th><th>Pelanggan</th><th></th></tr></thead><tbody>
        ${rows.map(d => `<tr>
          <td><a href="#" data-buka="${d.id}" class="dok">${ikon(d.tipe || '')} <b>${esc(d.judul)}</b></a><br><small>${esc(d.nama_file || '')} · ${ukuran(d.ukuran)}</small></td>
          <td><span class="chip">${esc(d.kategori)}</span></td><td>${tgl(d.tanggal)}</td>
          <td>${esc(pelangganOf(d.pelanggan_id)?.nama || '–')}</td>
          <td class="act"><button class="btn btn-sm" data-buka="${d.id}">Buka</button><button class="btn btn-sm btn-ghost" data-ubah="${d.id}">Ubah</button><button class="btn btn-sm btn-x" data-hapus="${d.id}">Hapus</button></td></tr>`).join('')}
        </tbody></table>` : '<p class="kosong">Belum ada dokumen yang cocok. Unggah akta, kontrak, atau surat penawaran supaya bisa dibuka dari mana saja.</p>';
      const on = (a, fn) => $('#tabel').querySelectorAll(`[data-${a}]`).forEach(b => b.onclick = e => { e.preventDefault(); fn(b.dataset[a]); });
      on('buka', bukaDokumen);
      on('ubah', id => formDokumen(cache.dokumen.find(d => d.id === id)));
      on('hapus', async id => {
        const d = cache.dokumen.find(x => x.id === id);
        if (!await tanya('Hapus dokumen ' + d.judul + '?', 'Filenya ikut terhapus dan tidak bisa dikembalikan.', 'Hapus dokumen')) return;
        await aman(async () => { await DB.removeFile(d.path).catch(() => {}); await DB.remove('dokumen', id); }, 'Dokumen dihapus');
        await muat(); tampil();
      });
    };
    ['cari', 'fkat', 'fpel'].forEach(id => $('#' + id).oninput = render);
    $('#tambah').onclick = () => formDokumen();
    render();
  }

  function formDokumen(d) {
    const baru = !d; d = d || { kategori: 'Lainnya', tanggal: today() };
    const b = modal(baru ? 'Unggah dokumen' : 'Ubah keterangan dokumen', `
      <form class="form" id="f">
        ${baru ? `<label class="full drop">Pilih file (PDF, gambar, Word, Excel, maks. 50 MB) *<input type="file" name="file" required></label>` : ''}
        <label class="full">Judul *<input name="judul" required value="${esc(d.judul || '')}"></label>
        <label>Kategori<select name="kategori">${KATEGORI.map(k => `<option ${k === d.kategori ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
        <label>Tanggal dokumen<input type="date" name="tanggal" value="${esc(d.tanggal || '')}"></label>
        <label class="full">Terkait pelanggan<select name="pelanggan_id">${opsiPelanggan(d.pelanggan_id)}</select></label>
        <label class="full">Keterangan<textarea name="keterangan" rows="2">${esc(d.keterangan || '')}</textarea></label>
        <div class="form-act full"><button type="button" class="btn btn-ghost" data-batal>Batal</button><button class="btn" id="simpan">${baru ? 'Unggah' : 'Simpan'}</button></div>
      </form>`, { wide: true });
    b.querySelector('[data-batal]').onclick = tutup;
    const fi = b.querySelector('[name=file]');
    if (fi) fi.onchange = () => { const j = b.querySelector('[name=judul]'); if (!j.value && fi.files[0]) j.value = fi.files[0].name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '); };
    b.querySelector('#f').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const row = { judul: fd.get('judul'), kategori: fd.get('kategori'), tanggal: fd.get('tanggal') || null, pelanggan_id: fd.get('pelanggan_id') || null, keterangan: fd.get('keterangan') };
      const btn = b.querySelector('#simpan'); btn.disabled = true; btn.textContent = 'Menyimpan…';
      try {
        await aman(async () => {
          if (baru) {
            const file = fd.get('file');
            if (file.size > 50 * 1024 * 1024) throw new Error('Ukuran file melebihi 50 MB.');
            row.path = await DB.upload(file);
            Object.assign(row, { nama_file: file.name, tipe: file.type, ukuran: file.size });
          } else row.id = d.id;
          await DB.save('dokumen', row);
        }, baru ? 'Dokumen terunggah' : 'Dokumen tersimpan');
        tutup(); await muat(); tampil();
      } catch { btn.disabled = false; btn.textContent = baru ? 'Unggah' : 'Simpan'; }
    };
  }

  async function bukaDokumen(id) {
    const d = cache.dokumen.find(x => x.id === id);
    const b = modal(d.judul, '<p class="kosong">Memuat dokumen…</p>', { full: true });
    let url;
    try {
      const u = await DB.fileUrl(d.path);
      // Ambil sebagai blob supaya PDF/gambar tampil di dalam halaman, bukan terunduh.
      url = u.startsWith('blob:') ? u : URL.createObjectURL(await (await fetch(u)).blob());
    } catch (e) { b.innerHTML = `<p class="kosong">Dokumen tidak bisa dibuka. ${esc(pesanError(e))}</p>`; return; }
    onClose = () => URL.revokeObjectURL(url);
    const t = d.tipe || '';
    const isi = /pdf/.test(t) ? `<iframe src="${url}" class="pv-frame" title="${esc(d.judul)}"></iframe>`
      : /image/.test(t) ? `<div class="pv-img"><img src="${url}" alt="${esc(d.judul)}"></div>`
      : /video/.test(t) ? `<video src="${url}" controls class="pv-frame"></video>`
      : /^text\/(plain|csv)/.test(t) ? `<iframe src="${url}" class="pv-frame" sandbox title="${esc(d.judul)}"></iframe>`
      : `<div class="kosong">File jenis ini (${esc(d.nama_file || t)}) tidak dapat ditampilkan langsung di browser.<br>Silakan unduh lalu buka dengan aplikasi yang sesuai.</div>`;
    b.innerHTML = `<div class="pv-bar"><span class="muted">${esc(d.kategori)} · ${tgl(d.tanggal)} · ${esc(d.nama_file || '')} · ${ukuran(d.ukuran)}</span>
      <a class="btn btn-ghost btn-sm" href="${url}" download="${esc(d.nama_file || d.judul)}">⬇ Unduh</a></div>${isi}`;
  }

  // ---------------- Navigasi ----------------
  const VIEWS = { ringkasan: vRingkasan, pelanggan: vPelanggan, invoice: vInvoice, dokumen: vDokumen };
  function tampil() {
    const h = location.hash.slice(1);
    const v = VIEWS[h] ? h : 'ringkasan';
    document.querySelectorAll('#menu a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + v));
    VIEWS[v]();
  }
  window.addEventListener('hashchange', () => { if (!$('#modal').hidden) tutup(); tampil(); });

  async function muat() {
    const [pelanggan, invoice, dokumen] = await aman(() => Promise.all(['pelanggan', 'invoice', 'dokumen'].map(t => DB.list(t))));
    cache = { pelanggan, invoice, dokumen };
  }

  async function mulai() {
    const u = await DB.user();
    if (!u) { $('#login').hidden = false; $('#app').hidden = true; return; }
    $('#login').hidden = true; $('#app').hidden = false;
    $('#who').textContent = u.email;
    $('#demo-bar').hidden = !DB.demo;
    $('#logout').hidden = DB.demo;
    try { await muat(); } catch { $('#view').innerHTML = '<p class="kosong">Data tidak bisa dimuat. Akun ini mungkin belum diberi akses ke dashboard, atau koneksi terputus. Muat ulang halaman; kalau masih gagal, hubungi pengelola website.</p>'; return; }
    tampil();
  }

  $('#login-form').onsubmit = async e => {
    e.preventDefault();
    const f = e.target; $('#login-err').textContent = '';
    try { await DB.login(f.email.value, f.password.value); mulai(); }
    catch (err) { $('#login-err').textContent = /invalid/i.test(err.message) ? 'Email atau kata sandi salah. Periksa lagi, lalu coba masuk.' : pesanError(err); }
  };
  $('#logout').onclick = async () => { await DB.logout(); location.hash = ''; mulai(); };

  mulai();
})();
