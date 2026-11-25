-- Add Vault locking, password protection, and Notion tracking to til_notes
-- Run this migration in your Supabase SQL Editor or via Supabase CLI.

create extension if not exists pgcrypto;

-- Ensure base til_notes table exists
create table if not exists public.til_notes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null default 'Tooling',
  date text not null default to_char(current_date, 'YYYY-MM-DD'),
  tags text[] not null default '{}',
  read_time text not null default '3 min read',
  summary text not null default '',
  content text not null default '',
  image_urls text[] not null default '{}',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add Vault & Notion Sync columns safely
alter table public.til_notes
  add column if not exists is_locked boolean not null default false,
  add column if not exists password_hash text,
  add column if not exists unlock_password text,
  add column if not exists notion_page_id text,
  add column if not exists notion_last_edited_time timestamptz;

create unique index if not exists til_notes_notion_page_id_uidx
  on public.til_notes (notion_page_id)
  where notion_page_id is not null;

create index if not exists til_notes_display_order_idx
  on public.til_notes (display_order asc);

create index if not exists til_notes_is_locked_idx
  on public.til_notes (is_locked);

-- Safe public view: never exposes password_hash, unlock_password,
-- and masks content when is_locked = true.
create or replace view public.til_notes_public as
select
  id,
  slug,
  title,
  category,
  date,
  tags,
  read_time,
  summary,
  coalesce(is_locked, false) as is_locked,
  case when not coalesce(is_locked, false) then content else null end as content,
  image_urls,
  display_order,
  notion_page_id,
  notion_last_edited_time,
  created_at,
  updated_at
from public.til_notes;

-- Allow admin panel and client to manage til_notes matching project setup (like tools table)
alter table public.til_notes disable row level security;
grant all on public.til_notes to anon, authenticated, service_role;
grant select on public.til_notes_public to anon, authenticated, service_role;

-- Ensure updated_at trigger stays active
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists til_notes_set_updated_at on public.til_notes;
create trigger til_notes_set_updated_at
  before update on public.til_notes
  for each row execute function public.set_updated_at();
