-- Migratie: accounts (naam + pincode), profielen, rad, duel-/spelgebeurtenissen
-- Eenmalig draaien in Supabase → SQL Editor.

-- Huisgenoot ↔ account
alter table housemates add column if not exists user_id uuid unique references auth.users(id) on delete set null;
alter table housemates add column if not exists pin_version integer not null default 1;
alter table housemates add column if not exists is_admin boolean not null default false;

-- Boodschappen: wie zette het erop
alter table shopping_items add column if not exists added_by uuid references housemates(id) on delete set null;

-- Gebeurtenissen uit spellen die geen "winst" zijn (ei gebroken, misfire, reactietijd)
create table if not exists game_events (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null,
  housemate_id  uuid not null references housemates(id) on delete cascade,
  value         integer,
  created_at    timestamptz not null default now()
);

-- Zelfgemaakte radjes
create table if not exists wheels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  segments    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- Is de ingelogde gebruiker een huisgenoot?
create or replace function is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from housemates where user_id = auth.uid());
$$;

-- Profiel claimen bij de eerste keer inloggen
create or replace function claim_profile(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  if exists (select 1 from housemates where user_id = auth.uid()) then raise exception 'Dit account hoort al bij iemand'; end if;
  update housemates set user_id = auth.uid() where id = target and user_id is null;
  if not found then raise exception 'Dit profiel is al in gebruik'; end if;
end $$;

-- Beheerder kan een pincode resetten (de persoon kiest daarna een nieuwe)
create or replace function reset_pin(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from housemates where user_id = auth.uid() and is_admin) then
    raise exception 'Alleen de beheerder kan pincodes resetten';
  end if;
  update housemates set user_id = null, pin_version = pin_version + 1 where id = target;
end $$;

grant execute on function is_member() to anon, authenticated;
grant execute on function claim_profile(uuid) to authenticated;
grant execute on function reset_pin(uuid) to authenticated;

-- Alleen huisgenoten mogen alles; namen zijn zichtbaar op het inlogscherm
do $$
declare t text;
begin
  foreach t in array array['housemates','shopping_items','drink_types','drink_purchases',
                           'drink_tallies','anytimers','disciplines','times','quotes',
                           'events','game_results','achievement_unlocks','game_events','wheels']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists huis on %I', t);
    execute format('create policy huis on %I for all to authenticated using (is_member()) with check (is_member())', t);
  end loop;
end $$;

drop policy if exists namen on housemates;
create policy namen on housemates for select to anon, authenticated using (true);

-- Accountvelden alleen via de functies hierboven
revoke update on housemates from anon, authenticated;
grant update (name, color, active) on housemates to authenticated;

-- Youri is beheerder
update housemates set is_admin = true where name ilike 'youri';

alter publication supabase_realtime add table game_events, wheels;
