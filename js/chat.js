/* Widget "Tanya kami": pengunjung bertanya, asisten AI (Claude) menjawab lewat fungsi Supabase "tanya".
   Riwayat percakapan hanya disimpan di tab browser ini (sessionStorage). */
(function () {
  const ALAMAT = 'https://zkqowxhnytlkmqnkqwff.supabase.co/functions/v1/tanya';
  const KUNCI_PUBLIK = 'sb_publishable_o5as9O0A-m9Q1tSt6fYEOg_MzDALex2';
  const WA = '6281271278201';
  const SIMPAN = 'msc_tanya';
  const MAKS = 800;
  const SARAN = [
    'Layanan apa saja yang tersedia?',
    'Bagaimana cara membeli lewat e-Katalog?',
    'Aplikasi apa saja yang sudah dibuat?'
  ];

  let riwayat = [];
  try { riwayat = JSON.parse(sessionStorage.getItem(SIMPAN) || '[]'); } catch { riwayat = []; }
  let sibuk = false, asalFokus = null;

  // ---------- Kerangka ----------
  const akar = document.createElement('div');
  akar.className = 'tanya';
  akar.innerHTML = `
    <button type="button" class="tanya-buka" aria-expanded="false" aria-controls="tanya-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16H6.5A2.5 2.5 0 0 1 4 13.5z" fill="currentColor"/></svg>
      <span>Tanya kami</span>
    </button>
    <section class="tanya-panel" id="tanya-panel" role="dialog" aria-modal="false" aria-labelledby="tanya-judul" hidden>
      <header class="tanya-atas">
        <div>
          <h2 id="tanya-judul">Tanya Manna Studio Code</h2>
          <p>Dijawab asisten AI. Untuk kepastian, hubungi <a href="https://wa.me/${WA}" target="_blank" rel="noopener">WhatsApp kami</a>.</p>
        </div>
        <button type="button" class="tanya-tutup" aria-label="Tutup percakapan">×</button>
      </header>
      <div class="tanya-isi" aria-live="polite"></div>
      <form class="tanya-form">
        <label class="sr" for="tanya-teks">Tulis pertanyaan</label>
        <textarea id="tanya-teks" rows="1" maxlength="${MAKS}" placeholder="Tulis pertanyaan Anda…" autocomplete="off"></textarea>
        <button type="submit" class="tanya-kirim" aria-label="Kirim pertanyaan">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" fill="currentColor"/></svg>
        </button>
      </form>
    </section>`;
  document.body.appendChild(akar);

  const tombol = akar.querySelector('.tanya-buka');
  const panel = akar.querySelector('.tanya-panel');
  const isi = akar.querySelector('.tanya-isi');
  const form = akar.querySelector('.tanya-form');
  const teks = akar.querySelector('#tanya-teks');
  const kirimBtn = akar.querySelector('.tanya-kirim');

  // ---------- Tampilan ----------
  function gelembung(peran, t) {
    const el = document.createElement('div');
    el.className = 'tanya-gel ' + (peran === 'user' ? 'tanya-saya' : 'tanya-asisten');
    el.textContent = t;   // teks biasa, tidak pernah dijalankan sebagai HTML
    isi.appendChild(el);
    isi.scrollTop = isi.scrollHeight;
    return el;
  }

  function gambarUlang() {
    isi.innerHTML = '';
    gelembung('assistant', 'Halo, ada yang bisa kami bantu? Tanyakan soal layanan, pekerjaan kami, e-Katalog, atau cara bekerja sama.');
    riwayat.forEach(m => gelembung(m.role, m.content));
    if (!riwayat.length) {
      const s = document.createElement('div');
      s.className = 'tanya-saran';
      SARAN.forEach(q => {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = q;
        b.addEventListener('click', () => { teks.value = q; kirim(); });
        s.appendChild(b);
      });
      isi.appendChild(s);
    }
  }

  function simpan() { try { sessionStorage.setItem(SIMPAN, JSON.stringify(riwayat.slice(-20))); } catch {} }

  function buka() {
    asalFokus = document.activeElement;
    panel.hidden = false;
    tombol.setAttribute('aria-expanded', 'true');
    akar.classList.add('terbuka');
    gambarUlang();
    setTimeout(() => teks.focus(), 0);
  }
  function tutup() {
    panel.hidden = true;
    tombol.setAttribute('aria-expanded', 'false');
    akar.classList.remove('terbuka');
    (asalFokus && document.contains(asalFokus) ? asalFokus : tombol).focus();
  }

  tombol.addEventListener('click', () => (panel.hidden ? buka() : tutup()));
  akar.querySelector('.tanya-tutup').addEventListener('click', tutup);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) tutup(); });

  // Textarea tumbuh mengikuti isi; Enter kirim, Shift+Enter baris baru
  teks.addEventListener('input', () => { teks.style.height = 'auto'; teks.style.height = Math.min(teks.scrollHeight, 120) + 'px'; });
  teks.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); kirim(); } });
  form.addEventListener('submit', e => { e.preventDefault(); kirim(); });

  // ---------- Kirim & terima jawaban mengalir ----------
  async function kirim() {
    const t = teks.value.trim();
    if (!t || sibuk) return;
    sibuk = true; kirimBtn.disabled = true; teks.value = ''; teks.style.height = 'auto';
    const saran = isi.querySelector('.tanya-saran'); if (saran) saran.remove();

    riwayat.push({ role: 'user', content: t });
    gelembung('user', t);
    const g = gelembung('assistant', '');
    g.classList.add('tanya-mengetik');
    g.setAttribute('aria-busy', 'true');

    let jawaban = '';
    try {
      const r = await fetch(ALAMAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: KUNCI_PUBLIK },
        body: JSON.stringify({ messages: riwayat.slice(-12) })
      });
      if (!r.ok || !r.body) {
        jawaban = (await r.text().catch(() => '')) || 'Asisten sedang tidak tersedia. Silakan hubungi WhatsApp kami.';
        g.textContent = jawaban;
      } else {
        const baca = r.body.getReader(), dek = new TextDecoder();
        for (;;) {
          const { value, done } = await baca.read();
          if (done) break;
          jawaban += dek.decode(value, { stream: true });
          g.textContent = jawaban;
          isi.scrollTop = isi.scrollHeight;
        }
      }
    } catch {
      jawaban = 'Tidak tersambung ke internet. Periksa koneksi, lalu coba lagi.';
      g.textContent = jawaban;
      riwayat.pop(); // pertanyaan gagal terkirim, jangan disimpan
    }
    g.classList.remove('tanya-mengetik');
    g.removeAttribute('aria-busy');
    if (riwayat.length && riwayat[riwayat.length - 1].role === 'user' && jawaban) {
      riwayat.push({ role: 'assistant', content: jawaban.trim() });
    }
    simpan();
    sibuk = false; kirimBtn.disabled = false; teks.focus();
  }
})();
