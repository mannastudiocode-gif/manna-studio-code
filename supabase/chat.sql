-- =====================================================================
-- Catatan pemakaian asisten chat website (fungsi "tanya")
-- Jalankan sekali di Supabase: SQL Editor -> New query -> tempel -> Run
-- Isi percakapan TIDAK disimpan; hanya sidik pengunjung (hash), token, dan status.
-- =====================================================================

create table if not exists public.chat_log (
  id            bigint generated always as identity primary key,
  dibuat        timestamptz not null default now(),
  sidik         text not null,          -- SHA-256 dari IP + garam, bukan IP mentah
  token_masuk   integer not null default 0,
  token_keluar  integer not null default 0,
  token_cache   integer not null default 0,
  akhir         text                    -- end_turn / max_tokens / refusal / error
);

create index if not exists chat_log_sidik_dibuat on public.chat_log (sidik, dibuat);
create index if not exists chat_log_dibuat on public.chat_log (dibuat);

-- Terkunci total dari website; hanya fungsi "tanya" (service role) yang menulis.
alter table public.chat_log enable row level security;
revoke all on public.chat_log from anon, authenticated;

-- Admin dashboard boleh membaca ringkasan pemakaian
grant select on public.chat_log to authenticated;
drop policy if exists admin_baca on public.chat_log;
create policy admin_baca on public.chat_log for select to authenticated using (public.is_admin());
