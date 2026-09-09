-- Writeups backend schema for Supabase.
-- Run this migration in the Supabase SQL editor or with Supabase CLI.

create extension if not exists pgcrypto;

create table if not exists public.writeups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  platform text not null,
  difficulty text not null,
  os text not null default 'Linux',
  tags text[] not null default '{}',
  date_published date not null default current_date,
  retirement_date timestamptz,
  is_retired boolean not null default false,
  points integer,
  ip_address text,
  featured boolean not null default false,
  summary text not null default '',
  initial_access_vector text not null default '',
  priv_esc_vector text not null default '',
  preview_content text not null default '',
  full_content text not null default '',
  password_hash text,
  pdf_path text,
  image_paths text[] not null default '{}',
  notion_page_id text unique,
  notion_last_edited_time timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint writeups_retirement_consistency check (
    is_retired = true or retirement_date is null or retirement_date > now()
  )
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  full_name text not null,
  issuer text not null,
  date text not null,
  status text not null default 'earned' check (status in ('earned', 'in-progress')),
  credential_id text,
  badge_color text not null default '#00ff66',
  description text not null default '',
  skills_covered text[] not null default '{}',
  verification_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists writeups_date_published_idx on public.writeups (date_published desc);
create index if not exists writeups_notion_edited_idx on public.writeups (notion_last_edited_time);
create index if not exists certificates_display_order_idx on public.certificates (display_order);

-- Public metadata view. The full content is exposed only after retirement.
-- Password hashes are never exposed through this view.
create or replace view public.writeups_public
with (security_invoker = true) as
select
  id, slug, title, platform, difficulty, os, tags, date_published,
  retirement_date,
  (is_retired or (retirement_date is not null and retirement_date <= now())) as is_retired,
  points, ip_address, featured, summary, initial_access_vector,
  priv_esc_vector, preview_content,
  case when (is_retired or (retirement_date is not null and retirement_date <= now()))
    then full_content else null end as full_content,
  pdf_path, image_paths, created_at, updated_at
from public.writeups;

alter table public.writeups enable row level security;
alter table public.certificates enable row level security;

-- Reads go through the safe public view. Writes require the service role.
revoke all on public.writeups from anon, authenticated;
revoke all on public.writeups_public from anon, authenticated;
grant select on public.writeups_public to anon, authenticated;
grant all on public.writeups to service_role;

grant select on public.certificates to anon, authenticated;
grant insert, update, delete on public.certificates to service_role;

-- Storage buckets. Files are public because their paths contain no secrets and
-- active writeup PDFs are never returned by the application until unlocked.
insert into storage.buckets (id, name, public)
values ('writeup-images', 'writeup-images', true), ('writeup-pdfs', 'writeup-pdfs', true)
on conflict (id) do update set public = excluded.public;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists writeups_set_updated_at on public.writeups;
create trigger writeups_set_updated_at before update on public.writeups
for each row execute function public.set_updated_at();

drop trigger if exists certificates_set_updated_at on public.certificates;
create trigger certificates_set_updated_at before update on public.certificates
for each row execute function public.set_updated_at();
