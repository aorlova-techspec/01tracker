-- Схема базы для Daily Task Tracker (Supabase)
-- Выполнить в дашборде Supabase: SQL Editor → New query → вставить → Run.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null,
  description text not null default '',
  project text not null default '',
  deadline date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  primary key (user_id, name)
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);

alter table public.tasks enable row level security;
alter table public.projects enable row level security;

create policy "tasks: read own" on public.tasks
  for select using (auth.uid() = user_id);
create policy "tasks: insert own" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks: update own" on public.tasks
  for update using (auth.uid() = user_id);
create policy "tasks: delete own" on public.tasks
  for delete using (auth.uid() = user_id);

create policy "projects: read own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects: insert own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects: delete own" on public.projects
  for delete using (auth.uid() = user_id);
