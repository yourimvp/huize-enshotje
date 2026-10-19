-- Alleen extra velden; bestaande inkopen en turven blijven behouden.
begin;
alter table public.drink_purchases
  add column if not exists drink_type_id uuid references public.drink_types(id) on delete set null,
  add column if not exists quantity integer check (quantity > 0);
notify pgrst, 'reload schema';
commit;
