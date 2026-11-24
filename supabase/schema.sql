-- =====================================================================
-- Database dashboard CV. Manna Studio Code
-- Jalankan sekali di Supabase: menu SQL Editor -> New query -> tempel -> Run
-- =====================================================================

-- 1. Daftar email yang boleh membuka dashboard -------------------------
create table if not exists public.admin_email (
  email text primary key
);
-- GANTI dengan email yang dipakai untuk login (boleh lebih dari satu baris)
insert into public.admin_email (email) values ('mannastudiocode@gmail.com')
  on conflict do nothing;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_email where email = auth.jwt() ->> 'email');
$$;

-- 2. Pelanggan --------------------------------------------------------
create table if not exists public.pelanggan (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,          -- nama instansi / perusahaan
  unit        text,                   -- bidang / bagian
  kontak      text,                   -- nama orang yang dihubungi
  jabatan     text,
  telepon     text,
  email       text,
  alamat      text,
  npwp        text,
  catatan     text,
  dibuat      timestamptz not null default now()
);

-- 3. Invoice ----------------------------------------------------------
create table if not exists public.invoice (
  id            uuid primary key default gen_random_uuid(),
  nomor         text not null unique,       -- msc-0xx
  tanggal       date not null default current_date,
  jatuh_tempo   date,
  pelanggan_id  uuid references public.pelanggan(id) on delete restrict,
  perihal       text,
  item          jsonb not null default '[]',  -- [{uraian, qty, satuan, harga}]
  ppn_persen    numeric not null default 0,   -- CV belum PKP: tanpa PPN
  status        text not null default 'belum' check (status in ('belum','lunas','batal')),
  tanggal_bayar date,
  catatan       text,
  dibuat        timestamptz not null default now()
);

-- 4. Dokumen perusahaan -----------------------------------------------
create table if not exists public.dokumen (
  id            uuid primary key default gen_random_uuid(),
  judul         text not null,
  kategori      text not null,              -- Legalitas, Kontrak, Penawaran, BAST, Pajak, Lainnya
  tanggal       date,
  pelanggan_id  uuid references public.pelanggan(id) on delete set null,
  path          text not null,              -- lokasi file di bucket 'dokumen'
  nama_file     text,
  tipe          text,
  ukuran        bigint,
  keterangan    text,
  dibuat        timestamptz not null default now()
);

-- 5. Kunci akses: hanya email di admin_email ---------------------------
alter table public.admin_email enable row level security;
alter table public.pelanggan   enable row level security;
alter table public.invoice     enable row level security;
alter table public.dokumen     enable row level security;

drop policy if exists admin_all on public.pelanggan;
drop policy if exists admin_all on public.invoice;
drop policy if exists admin_all on public.dokumen;
create policy admin_all on public.pelanggan for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.invoice   for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_all on public.dokumen   for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- admin_email sengaja tanpa policy: tidak bisa dibaca/diubah dari website.

-- Hak dasar: hanya pengguna yang login (lalu disaring policy di atas).
-- Project Supabase baru tidak lagi memberikan hak ini otomatis.
revoke all on public.admin_email, public.pelanggan, public.invoice, public.dokumen from anon;
revoke all on public.admin_email from authenticated;
grant select, insert, update, delete on public.pelanggan, public.invoice, public.dokumen to authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 6. Tempat file (privat) ---------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('dokumen', 'dokumen', false, 52428800)   -- maks 50 MB per file
on conflict (id) do nothing;

drop policy if exists dokumen_admin_select on storage.objects;
drop policy if exists dokumen_admin_insert on storage.objects;
drop policy if exists dokumen_admin_update on storage.objects;
drop policy if exists dokumen_admin_delete on storage.objects;
create policy dokumen_admin_select on storage.objects for select to authenticated using (bucket_id = 'dokumen' and public.is_admin());
create policy dokumen_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'dokumen' and public.is_admin());
create policy dokumen_admin_update on storage.objects for update to authenticated using (bucket_id = 'dokumen' and public.is_admin());
create policy dokumen_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'dokumen' and public.is_admin());
