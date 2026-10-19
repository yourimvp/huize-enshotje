-- Huize Enshotje — databaseschema
-- Plak dit in Supabase → SQL Editor → New query → Run.

create extension if not exists pgcrypto;

-- Huisgenoten ---------------------------------------------------------------
create table if not exists housemates (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#f4b81c',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Boodschappen --------------------------------------------------------------
create table if not exists shopping_items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  note        text,
  checked     boolean not null default false,
  checked_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Turf ----------------------------------------------------------------------
-- Verbruik per categorie × gewogen inkoopprijs per drankje.
create table if not exists drink_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists drink_purchases (
  id           uuid primary key default gen_random_uuid(),
  description  text not null,
  drink_type_id uuid references drink_types(id) on delete set null,
  quantity     integer check (quantity > 0),
  cost_cents   integer not null check (cost_cents >= 0),
  paid_by      uuid references housemates(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists drink_tallies (
  id             uuid primary key default gen_random_uuid(),
  drink_type_id  uuid references drink_types(id) on delete set null,
  housemate_id   uuid not null references housemates(id) on delete cascade,
  count          integer not null default 1,
  created_at     timestamptz not null default now()
);
create index if not exists drink_tallies_created_at on drink_tallies(created_at);

-- Anytimers: één rij per any. owed_to mag opeisen, owed_by moet adten.
create table if not exists anytimers (
  id           uuid primary key default gen_random_uuid(),
  owed_to      uuid not null references housemates(id) on delete cascade,
  owed_by      uuid not null references housemates(id) on delete cascade,
  reason       text,
  redeemed_at  timestamptz,
  created_at   timestamptz not null default now(),
  check (owed_to <> owed_by)
);

-- Ranking -------------------------------------------------------------------
create table if not exists disciplines (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table if not exists times (
  id             uuid primary key default gen_random_uuid(),
  discipline_id  uuid not null references disciplines(id) on delete cascade,
  housemate_id   uuid not null references housemates(id) on delete cascade,
  ms             integer not null check (ms > 0),
  created_at     timestamptz not null default now()
);

-- Quotes --------------------------------------------------------------------
create table if not exists quotes (
  id          uuid primary key default gen_random_uuid(),
  text        text not null,
  said_by     uuid references housemates(id) on delete set null,
  said_by_name text,          -- vrije naam, ook voor niet-huisgenoten
  context     text,           -- bijv. "tegen Merel"
  created_at  timestamptz not null default now()
);

-- Toegang -------------------------------------------------------------------
-- Geen accounts: iedereen met de link mag lezen en schrijven.
-- Wil je later toch afschermen, vervang 'anon, authenticated' door 'authenticated'.
do $$
declare t text;
begin
  foreach t in array array['housemates','shopping_items','drink_types','drink_purchases',
                           'drink_tallies','anytimers','disciplines','times','quotes']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists huis on %I', t);
    execute format('create policy huis on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Live updates voor iedereen tegelijk
alter publication supabase_realtime add table
  housemates, shopping_items, drink_types, drink_purchases,
  drink_tallies, anytimers, disciplines, times, quotes;

-- Startdata -----------------------------------------------------------------
insert into drink_types (name) values ('Bier'), ('Bozu'), ('Shotjes');
insert into disciplines (name) values ('Rietbak'), ('SG');
