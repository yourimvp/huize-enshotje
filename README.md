# Huize Enshotje

De huiswebsite: boodschappenlijst, turflijst met maandafrekening, anytimers en een rietbak/SG-ranking met podium.
React + Vite, data in Supabase (live voor iedereen), hosting als statische site op Strato.

## Lokaal kijken zonder database

```bash
npm install
npm run demo
```

Dit draait de site met nepdata in je browser, zonder Supabase.

## 1. Supabase opzetten (±5 min)

1. Maak een gratis project op [supabase.com](https://supabase.com) (regio Frankfurt).
2. **SQL Editor → New query**: plak `supabase/schema.sql` en klik **Run**. (Bestaand project? Draai dan alleen de bestanden in `supabase/migrations/` die nog niet gedraaid zijn.) Dit maakt alle tabellen, live updates en de startdata (Bier, Bozu, Shotjes, Rietbak, SG).
3. **Project Settings → API**: kopieer de *Project URL* en de *anon public key*.

De URL en publieke sleutel van het huisproject staan al in `.env.production` en `.env.development`.

`npm run dev` draait de echte versie lokaal. Voeg de huisgenoten toe via **Huis** rechtsboven.

> Er zijn bewust geen accounts: iedereen met de link kan alles zien en aanpassen. Deel de link dus alleen in de huisapp. Wil je later toch inloggen, dan is dat een kleine aanpassing (zie de opmerking onder *Toegang* in `schema.sql`).

## 2. Op Strato zetten

**Handmatig:** `npm run build` en upload de inhoud van `dist/` (inclusief de verborgen `.htaccess`) via SFTP naar de map waar je domein naar wijst.

**Automatisch via GitHub:** push naar `main` en `.github/workflows/deploy.yml` bouwt en uploadt alles. Zet eerst de secrets die bovenin dat bestand staan. Je SFTP-gegevens vind je in het Strato-klantenmenu onder *Hosting → SFTP/SSH*.

Op Strato:
- Koppel het domein aan de map (*Domeinen → Domeinbeheer → Doel*).
- Zet SSL aan (*Domeinen → SSL-beheer*). De `.htaccess` stuurt alles naar https.
- `.htaccess` zorgt ook dat `/turf` etc. werken als je ververst.

## Op je telefoon

Open de site in Safari/Chrome → *Deel* → **Zet op beginscherm**. Dan opent hij als app.

## Hoe het werkt

| Onderdeel | Tabel(len) |
| --- | --- |
| Huisgenoten | `housemates`. "Verhuisd" verbergt iemand maar houdt de historie |
| Boodschappen | `shopping_items` |
| Turf | `drink_types`, `drink_purchases`, `drink_tallies` |
| Quote van de week | `quotes` (draait wekelijks door) |
| Huisagenda | `events` |
| Spellen | `game_results` (Paardenrace schrijft winnaars zelf bij) |
| Prijzenkast | `achievement_unlocks`; definities in `src/lib/achievements.ts` |
| Anys | `anytimers` (één rij per any, `redeemed_at` = ingelost) |
| Ranking | `disciplines`, `times` (beste tijd per persoon telt) |

**Turf: een streepje is een streepje.** Alle inkoop van een maand wordt gedeeld door alle streepjes van die maand. Iedereen betaalt `eigen streepjes × prijs per streepje`; wie inkoop voorschoot krijgt dat terug. Het saldo telt per maand op tot nul. "Kopieer overzicht" geeft een tekstje voor WieBetaaltWat.

**Anys:** één rij per any. Opeisen zet `redeemed_at`; terugzetten kan via "Al opgeëist".

**Prijzenkast:** de site rekent zelf uit wie welke prestatie heeft (streepjes, gewonnen spelletjes, afgestreepte boodschappen) en legt nieuwe vast. Iedereen die de site open heeft krijgt dan confetti. Een nieuwe achievement toevoegen = één regel in `src/lib/achievements.ts`.

**Huisdag:** voor streaks en 7 Dronk loopt een dag van 06:00 tot 06:00.

**Timer:** tik = start, tik = stop, ingedrukt houden of de resetknop = reset.
