// Isi dua nilai ini dari Supabase: Project Settings -> API.
// Selama masih kosong, dashboard berjalan dalam MODE DEMO
// (data hanya tersimpan di browser komputer ini).
//
// "publishable key" (sb_publishable_...) / "anon key" memang aman ditaruh di sini:
// data tetap terkunci oleh aturan akses di supabase/schema.sql, hanya email admin
// yang bisa membuka. JANGAN PERNAH menaruh "secret key" (sb_secret_...) atau
// "service_role key" di file ini.
window.MSC_CONFIG = {
  SUPABASE_URL: 'https://zkqowxhnytlkmqnkqwff.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_o5as9O0A-m9Q1tSt6fYEOg_MzDALex2'
};

// Identitas yang dicetak di invoice
window.MSC_PERUSAHAAN = {
  nama: 'CV. MANNA STUDIO CODE',
  tagline: 'Jasa Pembuatan Aplikasi, Sistem Informasi & Website',
  alamat: 'Jl. SMKN 1 Bengkulu Selatan, RT.10, Ibul, Kota Manna, Bengkulu Selatan',
  telepon: '0812-7127-8201 / 0852-6655-6231',
  wa: '0812-7127-8201',
  email: 'mannastudiocode@gmail.com',
  web: 'www.mannastudiocode.com',
  kota: 'Manna',
  direktur: 'EVAN MARHEKY',
  bank: 'Bank Bengkulu KCP Manna',
  rekening: '0030107002564',
  atasNama: 'MANNA STUDIO CODE'
};
