-- Quotes uit de groepsapp "Verpauperde quotes" (aug – okt 2026)
-- Eenmalig draaien in Supabase → SQL Editor.

alter table quotes add column if not exists said_by_name text;
alter table quotes add column if not exists context text;

insert into quotes (text, said_by_name, context, created_at) values
  ('Maar jij bent ook best populair bij lacoucou', 'Amke', null, '2026-08-10 13:16+02'),
  ('Wat is een zonsverduistering? De zon wordt toch ook verduisterd door de wolken?', 'Mirthe', null, '2026-08-12 14:14+02'),
  ('Als je nooit iets vies proeft, proef je ook nooit iets lekkers', 'Merel', null, '2026-08-17 19:27+02'),
  ('Er is nergens nooit niet tegenop te drinken', 'Just', null, '2026-08-21 21:32+02'),
  ('Daar is niet tegenop te neuken', 'Just', null, '2026-08-21 22:32+02'),
  ('De kanker van Freek van Suzan en Freek is gw een marketing stunt', 'Niels', null, '2026-09-07 18:10+02'),
  ('Je moet hier actief slim bezig zijn, om niet passief dommer te worden', 'Just', 'over onze gesprekken', '2026-09-11 13:02+02'),
  ('Plus 100 aura, dat is toch hip om te zeggen', 'Amke', null, '2026-09-11 13:05+02'),
  ('Hoe schrijf ik aura?', 'Rim', null, '2026-09-11 13:06+02'),
  ('Ik prik, ik prik, ik rim', 'Rim', null, '2026-09-11 13:41+02'),
  ('Wat ben je toch zwaar', 'Just', 'tegen Merel', '2026-09-18 02:35+02'),
  ('Godver pielekes', 'Just', null, '2026-09-18 03:02+02'),
  ('Gevangenis is ook maar een locatie', 'Just', null, '2026-09-23 23:00+02'),
  ('Leeftijd is maar een getal', 'Amke', null, '2026-09-24 04:09+02'),
  ('Wie zijn de drerries in die lange staat', 'Amke', null, '2026-10-02 21:43+02'),
  ('Was gezellig, morgen dezelfde dag hier', 'Mirthe', 'tegen een vriend van Leon', '2026-10-03 01:41+02'),
  ('Later als ik groot ben word ik echt een VO baas', 'Just', null, '2026-10-07 23:48+02'),
  ('De cul is mijn ragtent', 'Amke', null, '2026-10-08 10:17+02'),
  ('Die is zooo leuk', 'Just', 'over z''n eigen quote', '2026-10-08 10:18+02'),
  ('Deze vind ik wel leuk van mezelf', 'Amke', null, '2026-10-08 10:24+02'),
  ('Het post-rag huppeltje', 'Youri', null, '2026-10-08 10:35+02'),
  ('Je bent mijn opwarm neukje', 'Youri', null, '2026-10-19 21:03+02');
