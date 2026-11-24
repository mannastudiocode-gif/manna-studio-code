// Lapisan data: Supabase bila config.js terisi, selain itu mode demo (browser).
(function () {
  const C = window.MSC_CONFIG || {};
  const DEMO = !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY;
  const BUCKET = 'dokumen';
  const CAP = 'pengaturan/cap-perusahaan';
  const sb = DEMO ? null : window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY);

  // ---------- Mode demo: tabel di localStorage, file di IndexedDB ----------
  const LS = t => 'msc_demo_' + t;
  const lsGet = t => JSON.parse(localStorage.getItem(LS(t)) || '[]');
  const lsSet = (t, rows) => localStorage.setItem(LS(t), JSON.stringify(rows));
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(16).slice(2));

  let idbP;
  function idb() {
    idbP = idbP || new Promise((ok, no) => {
      const r = indexedDB.open('msc_demo_files', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('f');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
    });
    return idbP;
  }
  async function idbDo(mode, fn) {
    const db = await idb();
    return new Promise((ok, no) => {
      const tx = db.transaction('f', mode);
      const req = fn(tx.objectStore('f'));
      tx.oncomplete = () => ok(req && req.result);
      tx.onerror = () => no(tx.error);
    });
  }

  function seedDemo() {
    if (localStorage.getItem(LS('seeded'))) return;
    const p = { id: uuid(), nama: 'Contoh: Sekretariat DPRD Kab. Bengkulu Selatan', unit: 'Bagian Umum', kontak: 'Kepala Bagian Umum', jabatan: '', telepon: '', email: '', alamat: 'Manna, Bengkulu Selatan', npwp: '', catatan: 'Data contoh mode demo, boleh dihapus.', dibuat: new Date().toISOString() };
    lsSet('pelanggan', [p]);
    lsSet('invoice', [{
      id: uuid(), nomor: 'msc-001', tanggal: new Date().toISOString().slice(0, 10), jatuh_tempo: null,
      pelanggan_id: p.id, perihal: 'Pembuatan Aplikasi E-Aspirasi DPRD',
      item: [{ uraian: 'Aplikasi E-Aspirasi DPRD (1 paket)', qty: 1, satuan: 'Paket', harga: 24000000 }],
      ppn_persen: 0, status: 'belum', tanggal_bayar: null, catatan: 'Contoh invoice mode demo.', dibuat: new Date().toISOString()
    }]);
    lsSet('dokumen', []);
    localStorage.setItem(LS('seeded'), '1');
  }

  function chk({ data, error }) {
    if (error) throw new Error(error.message);
    return data;
  }

  const api = {
    demo: DEMO,

    // ---------- Login ----------
    async user() {
      if (DEMO) return { email: 'mode demo' };
      const { data } = await sb.auth.getSession();
      return data.session ? data.session.user : null;
    },
    async login(email, password) {
      chk(await sb.auth.signInWithPassword({ email, password }));
    },
    async logout() {
      if (!DEMO) await sb.auth.signOut();
    },

    // ---------- Tabel ----------
    async list(table) {
      if (DEMO) { seedDemo(); return lsGet(table).sort((a, b) => (b.dibuat || '').localeCompare(a.dibuat || '')); }
      return chk(await sb.from(table).select('*').order('dibuat', { ascending: false }));
    },
    async save(table, row) {
      row = { ...row };
      if (DEMO) {
        const rows = lsGet(table);
        if (row.id) {
          const i = rows.findIndex(r => r.id === row.id);
          rows[i] = { ...rows[i], ...row };
        } else {
          row.id = uuid(); row.dibuat = new Date().toISOString(); rows.push(row);
        }
        if (table === 'invoice' && rows.filter(r => r.nomor === row.nomor).length > 1) throw new Error('Nomor invoice ' + row.nomor + ' sudah dipakai.');
        lsSet(table, rows);
        return row;
      }
      const id = row.id; delete row.id; delete row.dibuat;
      const q = id ? sb.from(table).update(row).eq('id', id) : sb.from(table).insert(row);
      const data = chk(await q.select().single());
      return data;
    },
    async remove(table, id) {
      if (DEMO) { lsSet(table, lsGet(table).filter(r => r.id !== id)); return; }
      chk(await sb.from(table).delete().eq('id', id));
    },

    // ---------- File ----------
    async upload(file) {
      const aman = file.name.replace(/[^\w.\-]+/g, '_');
      const path = new Date().getFullYear() + '/' + uuid() + '-' + aman;
      if (DEMO) { await idbDo('readwrite', s => s.put(file, path)); return path; }
      chk(await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined }));
      return path;
    },
    // Mengembalikan alamat sementara untuk menampilkan / mengunduh file.
    async fileUrl(path) {
      if (DEMO) {
        const blob = await idbDo('readonly', s => s.get(path));
        if (!blob) throw new Error('File tidak ditemukan di browser ini.');
        return URL.createObjectURL(blob);
      }
      const data = chk(await sb.storage.from(BUCKET).createSignedUrl(path, 600));
      return data.signedUrl;
    },
    // ---------- Cap perusahaan (disimpan privat, tidak di repo publik) ----------
    async capUrl() {
      try {
        if (DEMO) { const blob = await idbDo('readonly', s => s.get(CAP)); return blob ? URL.createObjectURL(blob) : null; }
        const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(CAP, 900);
        return error ? null : data.signedUrl;
      } catch { return null; }
    },
    async simpanCap(file) {
      if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) throw new Error('Cap harus berupa gambar PNG, JPG, SVG, atau WebP.');
      if (DEMO) { await idbDo('readwrite', s => s.put(file, CAP)); return; }
      chk(await sb.storage.from(BUCKET).upload(CAP, file, { upsert: true, contentType: file.type, cacheControl: '60' }));
    },
    async removeFile(path) {
      if (DEMO) { await idbDo('readwrite', s => s.delete(path)); return; }
      chk(await sb.storage.from(BUCKET).remove([path]));
    }
  };

  window.DB = api;
})();
