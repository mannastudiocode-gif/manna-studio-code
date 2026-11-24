# Website & Dashboard CV. Manna Studio Code

| Bagian | Alamat | Isi |
|---|---|---|
| Website profil | `/` | Beranda, layanan, portofolio, alur kerja, kontak |
| Dashboard admin | `/admin/` | Pelanggan, invoice (cetak/PDF), dokumen perusahaan, ringkasan tagihan |

Website di-hosting di **GitHub Pages**. Data dashboard disimpan di **Supabase** (privat, wajib login).
Data pelanggan dan dokumen **tidak pernah** masuk ke GitHub.

```
index.html, css/, js/site.js   website profil
data/portofolio.json           daftar portofolio (edit file ini untuk menambah proyek)
assets/                        logo
admin/                         dashboard
js/config.js                   kunci Supabase + identitas perusahaan di invoice
supabase/schema.sql            struktur database & aturan akses
```

---

## Langkah 1 — Coba di komputer sendiri (mode demo)

Selama `js/config.js` masih kosong, dashboard berjalan dalam **mode demo**: tanpa login, dan data hanya tersimpan di browser.

```
cd E:\Kerja\manna-studio-code
python -m http.server 8080
```
Buka http://localhost:8080 dan http://localhost:8080/admin/

## Langkah 2 — Siapkan Supabase (sekali saja)

1. Daftar di https://supabase.com, lalu buat **New project** (region: Singapore). Simpan kata sandi database.
2. Buka menu **SQL Editor → New query**, tempel seluruh isi `supabase/schema.sql`.
   Pada baris `insert into public.admin_email`, ganti dengan email yang akan dipakai login. Lalu klik **Run**.
3. Buka **Authentication → Users → Add user → Create new user**. Isi email (yang sama dengan langkah 2) dan kata sandi, lalu centang *Auto Confirm User*.
4. Buka **Authentication → Sign In / Providers**, lalu **matikan "Allow new users to sign up"** supaya orang lain tidak bisa mendaftar.
5. Buka **Project Settings → API**, salin **Project URL** dan **anon public key** ke `js/config.js`.
   (*Jangan* salin `service_role` key.)

Setelah itu, dashboard akan meminta login, dan data tersimpan online sehingga bisa dibuka dari komputer atau HP mana saja.

> Data yang diisi saat mode demo **tidak** ikut pindah ke Supabase.

## Langkah 3 — Terbitkan ke GitHub Pages

1. Buat repositori baru di GitHub, misalnya `manna-studio-code`.
2. Unggah seluruh isi folder ini (tombol *Add file → Upload files*, atau `git push`).
3. Buka **Settings → Pages → Source: Deploy from a branch → main / (root)**, lalu klik **Save**.
4. Website muncul di `https://<akun>.github.io/manna-studio-code/` dalam 1–2 menit.

### Memakai domain www.mannastudiocode.com
1. Di **Settings → Pages → Custom domain**, isi `www.mannastudiocode.com` lalu klik Save. GitHub akan membuat file `CNAME`.
2. Di pengelola domain, buat record **CNAME** `www` → `<akun>.github.io`.
   Untuk domain tanpa www, buat record **A** ke `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. Setelah aktif, centang **Enforce HTTPS**.
4. Di Supabase, buka **Authentication → URL Configuration** dan isi Site URL dengan `https://www.mannastudiocode.com`.

## Pemakaian sehari-hari

- **Invoice**: nomor otomatis `msc-0xx` dan bisa diubah. Harga dasar dan PPN 11% ditulis terpisah, dilengkapi terbilang dan rekening.
  Klik **Lihat / Cetak → Cetak / Simpan PDF**, lalu pilih printer atau *Save as PDF* (ukuran A4, margin *None*/*Default*).
- **Invoice batal**: ubah statusnya menjadi *Batal*, jangan dihapus, supaya urutan nomor tetap tercatat.
- **Dokumen**: PDF, gambar, dan video dibuka langsung di dalam halaman. File Word/Excel diunduh. Batas ukuran 50 MB per file.
- **Portofolio di website**: ubah `data/portofolio.json` di GitHub, lalu website ikut berubah.
- **Identitas di invoice** (alamat, telepon, rekening, nama direktur): ubah bagian `MSC_PERUSAHAAN` di `js/config.js`.

## Kapasitas gratis Supabase
500 MB database dan 1 GB file. Project yang tidak dibuka selama 7 hari akan dijeda. Cukup buka dashboard Supabase lalu klik *Restore*. Untuk cadangan, unduh data lewat **Table Editor → Export to CSV** secara berkala.
