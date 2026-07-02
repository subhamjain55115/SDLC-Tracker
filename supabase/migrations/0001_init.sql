-- SDLC Tracker — initial schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run)

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  roadmap jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_updated_at on public.projects (updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

alter table public.projects enable row level security;

-- Single-user app: any authenticated user has full access.
-- The registration gate (first user only) is enforced at the application layer,
-- and public sign-ups should be disabled in Supabase Auth settings.
drop policy if exists "authenticated full access" on public.projects;
create policy "authenticated full access"
  on public.projects
  for all
  to authenticated
  using (true)
  with check (true);
