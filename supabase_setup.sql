-- מה הקשר - one-time database setup.
-- Paste this whole file into the Supabase SQL Editor and click "Run".
-- See BACKEND_SETUP.md for the full step-by-step guide this belongs to.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- One row per game created on create.html
create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  title text,
  note text,
  created_by text,
  creator_key text,       -- random token stored in the creator's own browser, so they can find their own games later
  tries int default 5,
  boards jsonb not null,
  created_at timestamptz default now()
);

-- One row per finished board attempt (win or run out of tries) - powers the analytics
create table if not exists plays (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  board_index int not null,
  mistakes int not null,
  used_clue boolean not null default false,
  solved boolean not null,
  created_at timestamptz default now()
);

-- One row per page view - simple visit counter
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  page text not null,          -- 'home' | 'create' | 'play'
  game_id uuid references games(id) on delete set null,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security: the public (anon) key can only ever write, never
-- freely read - reading individual games or a creator's own games goes
-- through the two narrow functions below instead. Only a signed-in admin
-- account can read everything directly.
-- ---------------------------------------------------------------------

alter table games enable row level security;
alter table plays enable row level security;
alter table visits enable row level security;

create policy "anyone can insert games" on games for insert to anon with check (true);
create policy "admin can select all games" on games for select to authenticated using (true);

create policy "anyone can insert plays" on plays for insert to anon with check (true);
create policy "admin can select all plays" on plays for select to authenticated using (true);

create policy "anyone can insert visits" on visits for insert to anon with check (true);
create policy "admin can select all visits" on visits for select to authenticated using (true);

-- ---------------------------------------------------------------------
-- Functions: narrow, safe reads for the public site (bypassing the "no
-- direct select" restriction above, but only ever returning one game or
-- one creator's own games - never the whole table).
-- ---------------------------------------------------------------------

create or replace function get_game_by_code(p_code text)
returns table (id uuid, title text, note text, created_by text, tries int, boards jsonb)
language sql
security definer
set search_path = public
as $$
  select id, title, note, created_by, tries, boards
  from games
  where short_code = p_code
  limit 1;
$$;

create or replace function get_my_games(p_creator_key text)
returns table (id uuid, short_code text, title text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select id, short_code, title, created_at
  from games
  where creator_key = p_creator_key
  order by created_at desc;
$$;

grant execute on function get_game_by_code(text) to anon;
grant execute on function get_my_games(text) to anon;
