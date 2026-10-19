-- Migratie 2: huisagenda, spelletjes, achievements, wie streepte boodschappen af
-- Eenmalig draaien in Supabase → SQL Editor (staat ook in schema.sql voor nieuwe projecten).

-- Boodschappen: wie streepte af, en "opruimen" verbergt in plaats van wissen
alter table shopping_items add column if not exists checked_by uuid references housemates(id) on delete set null;
alter table shopping_items add column if not exists cleared boolean not null default false;

-- Huisagenda
create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  date        date not null,
  time        text,
  note        text,
  created_at  timestamptz not null default now()
);

-- Gewonnen spelletjes (uit de app of handmatig)
create table if not exists game_results (
  id          uuid primary key default gen_random_uuid(),
  game        text not null,
  winner_id   uuid not null references housemates(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Behaalde achievements (één keer per persoon per achievement)
create table if not exists achievement_unlocks (
  id            uuid primary key default gen_random_uuid(),
  housemate_id  uuid not null references housemates(id) on delete cascade,
  key           text not null,
  created_at    timestamptz not null default now(),
  unique (housemate_id, key)
);

do $$
declare t text;
begin
  foreach t in array array['events','game_results','achievement_unlocks']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists huis on %I', t);
    execute format('create policy huis on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

alter publication supabase_realtime add table events, game_results, achievement_unlocks;
