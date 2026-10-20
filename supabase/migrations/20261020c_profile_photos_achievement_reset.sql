-- Profielafbeelding: alleen je eigen foto wijzigen via deze begrensde functie.
begin;
alter table public.housemates add column if not exists avatar_url text;
alter table public.housemates add column if not exists achievements_since timestamptz;
alter table public.achievement_unlocks add column if not exists epoch timestamptz;

create or replace function public.set_profile_photo(photo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  if photo is not null and (length(photo) > 160000 or photo !~ '^data:image/jpeg;base64,[A-Za-z0-9+/=]+$') then
    raise exception 'Kies een geldige, kleine profielfoto';
  end if;
  update public.housemates set avatar_url = photo where user_id = auth.uid();
  if not found then raise exception 'Geen eigen profiel gevonden'; end if;
end $$;
revoke all on function public.set_profile_photo(text) from public, anon;
grant execute on function public.set_profile_photo(text) to authenticated;

-- Oude awards bewaren in een afgesloten archief. Geen turven, tijden of uitslagen wissen.
create table if not exists public.achievement_unlocks_archive (
  id uuid primary key,
  housemate_id uuid not null,
  key text not null,
  created_at timestamptz not null,
  epoch timestamptz,
  archived_at timestamptz not null default now()
);
alter table public.achievement_unlocks_archive enable row level security;
revoke all on public.achievement_unlocks_archive from anon, authenticated;

-- Alleen één keer resetten bij deze migratie; opnieuw uitvoeren bewaart nieuwe progressie.
do $$
begin
  if not exists (select 1 from public.housemates where achievements_since is not null) then
    insert into public.achievement_unlocks_archive (id, housemate_id, key, created_at, epoch)
      select id, housemate_id, key, created_at, epoch from public.achievement_unlocks on conflict do nothing;
    delete from public.achievement_unlocks;
    update public.housemates set achievements_since = now();
  end if;
end $$;

-- Een nog geopende oude app mag oude achievements niet opnieuw uitreiken.
create or replace function public.check_achievement_epoch() returns trigger
language plpgsql security definer set search_path = public as $$
declare expected timestamptz;
begin
  select achievements_since into expected from public.housemates where id = new.housemate_id;
  if new.epoch is distinct from expected then raise exception 'Achievements zijn gereset. Vernieuw de app.'; end if;
  return new;
end $$;
drop trigger if exists achievement_epoch_guard on public.achievement_unlocks;
create trigger achievement_epoch_guard before insert or update on public.achievement_unlocks
for each row execute function public.check_achievement_epoch();
commit;

select (select count(*) from public.achievement_unlocks) as actieve_awards,
       (select count(*) from public.achievement_unlocks_archive) as bewaarde_awards,
       (select min(achievements_since) from public.housemates) as opnieuw_vanaf;
