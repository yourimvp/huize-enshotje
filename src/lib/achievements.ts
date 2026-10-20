import { dayKey, longestStreak } from './days'
import type { Anytimer, DrinkTally, DrinkType, GameEvent, GameResult, Housemate, Quote, ShoppingItem } from './types'

export type Tier = 'brons' | 'zilver' | 'goud' | 'speciaal'

export interface Achievement {
  key: string
  title: string
  desc: string
  icon: string
  tier: Tier
  group: string
  /** Verborgen als "???" tot iemand hem haalt */
  secret?: boolean
  target: number
  value: (s: PersonStats) => number
}

export interface PersonStats {
  totalDrinks: number
  maxPerNight: number
  bestDrinkStreak: number
  earlyDrinks: number
  lateDrinks: number
  monthWins: number
  beer: number
  beerMonthWins: number
  bestBeerMonthStreak: number
  bozu: number
  shots: number
  wins: number
  bestWinStreak: number
  horseWins: number
  eggBreaks: number
  mineHits: number
  duelWins: number
  duelBestStreak: number
  duelBestMs: number | null
  duelMisfires: number
  checkedItems: number
  anysHolding: number
  anysPaid: number
  anysOwing: number
  quoted: number
}

export const GROUPS = ['Avond', 'Streaks', 'Turf', 'Spelletjes', 'Winstreak', 'Duel', 'Anys', 'Quotes', 'Boodschappen']

const A = (
  group: string,
  key: string,
  icon: string,
  title: string,
  desc: string,
  tier: Tier,
  target: number,
  value: (s: PersonStats) => number,
  secret = false,
): Achievement => ({ group, key, icon, title, desc, tier, target, value, secret })

export const ACHIEVEMENTS: Achievement[] = [
  // Op één avond (06:00 tot 06:00)
  A('Avond', 'night-1', '🍺', 'Eerste rondje', 'Drink 1 drankje op een avond', 'brons', 1, (s) => s.maxPerNight),
  A('Avond', 'night-5', '🍻', 'Lekker bezig', 'Drink 5 drankjes op één avond', 'zilver', 5, (s) => s.maxPerNight),
  A('Avond', 'night-10', '🥴', 'Tiendronk', 'Drink 10 drankjes op één avond', 'goud', 10, (s) => s.maxPerNight),
  // Dagen achter elkaar
  A('Streaks', 'streak-2', '🔥', 'Aanwakkeren', '2 dagen achter elkaar een drankje', 'brons', 2, (s) => s.bestDrinkStreak),
  A('Streaks', 'streak-4', '☄️', 'Lang weekend', '4 dagen achter elkaar een drankje', 'zilver', 4, (s) => s.bestDrinkStreak),
  A('Streaks', 'streak-7', '🌋', 'Doordrinker', '7 dagen achter elkaar elke dag een drankje', 'goud', 7, (s) => s.bestDrinkStreak),
  // Turf
  A('Turf', 'beer-25', '🍺', 'Drink 25 bier', 'Drink in totaal 25 bier', 'brons', 25, (s) => s.beer),
  A('Turf', 'beer-50', '🍻', 'Drink 50 bier', 'Drink in totaal 50 bier', 'zilver', 50, (s) => s.beer),
  A('Turf', 'beer-100', '🏆', 'Drink 100 bier', 'Drink in totaal 100 bier', 'goud', 100, (s) => s.beer),
  A('Turf', 'beer-prince', '🤴', 'Prins pils', 'Drink het meeste bier in een afgeronde maand', 'brons', 1, (s) => s.beerMonthWins),
  A('Turf', 'beer-king', '👑', 'Koning pils', 'Drink 2 afgeronde maanden op rij het meeste bier', 'zilver', 2, (s) => s.bestBeerMonthStreak),
  A('Turf', 'beer-emperor', '⚜️', 'Keizer des pils', 'Sta 4 afgeronde maanden op rij op de biertroon', 'goud', 4, (s) => s.bestBeerMonthStreak),
  A('Turf', 'bozu-25', '🍶', 'Bozu-baas', 'Streep 25 Bozu', 'zilver', 25, (s) => s.bozu),
  A('Turf', 'shots-25', '🥃', 'Shotjeskoning', 'Streep 25 shotjes', 'zilver', 25, (s) => s.shots),
  A('Turf', 'month-champ', '🏅', 'Maandkampioen', 'Een hele maand de meeste streepjes van het huis', 'goud', 1, (s) => s.monthWins),
  A('Turf', 'early', '🐓', 'Vroege vogel', 'Een streepje vóór 12 uur ’s middags', 'speciaal', 1, (s) => s.earlyDrinks, true),
  A('Turf', 'late', '🦉', 'Nachtbraker', 'Een streepje tussen 3 en 6 uur ’s nachts', 'speciaal', 1, (s) => s.lateDrinks, true),
  // Spelletjes
  A('Spelletjes', 'win-1', '🎲', 'Eerste overwinning', 'Win een spelletje', 'brons', 1, (s) => s.wins),
  A('Spelletjes', 'win-5', '🃏', 'Spelletjesbeest', 'Win 5 spelletjes', 'zilver', 5, (s) => s.wins),
  A('Spelletjes', 'win-25', '🏆', 'Kampioen van Enshotje', 'Win 25 spelletjes', 'goud', 25, (s) => s.wins),
  A('Spelletjes', 'horse-3', '🏇', 'Paardenfluisteraar', 'Win 3 keer Paardenrace', 'zilver', 3, (s) => s.horseWins),
  A('Spelletjes', 'mine-3', '💣', 'Mijnenveger', 'Stap 3 keer op een bom bij Mines', 'speciaal', 3, (s) => s.mineHits, true),
  A('Spelletjes', 'egg-5', '🥚', 'Pechvogel', 'Breek 5 keer het ei', 'speciaal', 5, (s) => s.eggBreaks, true),
  // Winstreak
  A('Winstreak', 'winstreak-2', '⚡', 'Dubbelslag', 'Win 2 spelletjes achter elkaar', 'brons', 2, (s) => s.bestWinStreak),
  A('Winstreak', 'winstreak-3', '🎩', 'Hattrick', 'Win 3 spelletjes achter elkaar', 'zilver', 3, (s) => s.bestWinStreak),
  A('Winstreak', 'winstreak-5', '👑', 'Onverslaanbaar', 'Win 5 spelletjes achter elkaar', 'goud', 5, (s) => s.bestWinStreak),
  // Cowboy-duel
  A('Duel', 'duel-1', '🤠', 'Snelle hand', 'Win een duel', 'brons', 1, (s) => s.duelWins),
  A('Duel', 'duel-sharp', '🎯', 'Scherpschutter', 'Win een duel in minder dan 250 ms', 'goud', 1, (s) => (s.duelBestMs !== null && s.duelBestMs < 250 ? 1 : 0)),
  A('Duel', 'duel-streak-5', '🌵', 'Lucky Luke', 'Win 5 duels achter elkaar', 'speciaal', 5, (s) => s.duelBestStreak, true),
  A('Duel', 'duel-misfire-3', '💥', 'Zenuwachtig', '3 keer te vroeg geschoten', 'speciaal', 3, (s) => s.duelMisfires, true),
  // Anys
  A('Anys', 'any-hold-5', '📜', 'Schuldeiser', 'Heb 5 anys tegelijk open op anderen', 'zilver', 5, (s) => s.anysHolding),
  A('Anys', 'any-paid-10', '🤝', 'Erewoord', 'Los 10 anys in', 'goud', 10, (s) => s.anysPaid),
  A('Anys', 'any-owe-5', '🙈', 'Wanbetaler', 'Heb 5 anys tegelijk open staan', 'speciaal', 5, (s) => s.anysOwing, true),
  // Quotes
  A('Quotes', 'quote-1', '💬', 'Gequote', 'Kom in de quotes terecht', 'brons', 1, (s) => s.quoted),
  A('Quotes', 'quote-5', '🧠', 'Wijsgeer', 'Word 5 keer gequote', 'zilver', 5, (s) => s.quoted),
  A('Quotes', 'quote-10', '📖', 'Filosoof van Enshotje', 'Word 10 keer gequote', 'goud', 10, (s) => s.quoted),
  // Boodschappen
  A('Boodschappen', 'shop-1', '🛒', 'Boodschapper', 'Streep iets af van de boodschappenlijst', 'brons', 1, (s) => s.checkedItems),
  A('Boodschappen', 'shop-10', '🧺', 'Vaste klant', 'Streep 10 boodschappen af', 'zilver', 10, (s) => s.checkedItems),
  A('Boodschappen', 'shop-50', '🥇', 'Bonuskaart-baas', 'Streep 50 boodschappen af', 'goud', 50, (s) => s.checkedItems),
]

export const BY_KEY = new Map(ACHIEVEMENTS.map((a) => [a.key, a]))

export interface StatsInput {
  housemates: Housemate[]
  tallies: DrinkTally[]
  types: DrinkType[]
  games: GameResult[]
  events: GameEvent[]
  shopping: ShoppingItem[]
  anys: Anytimer[]
  quotes: Quote[]
}

const empty = (): PersonStats => ({
  totalDrinks: 0,
  maxPerNight: 0,
  bestDrinkStreak: 0,
  earlyDrinks: 0,
  lateDrinks: 0,
  monthWins: 0,
  beer: 0,
  beerMonthWins: 0,
  bestBeerMonthStreak: 0,
  bozu: 0,
  shots: 0,
  wins: 0,
  bestWinStreak: 0,
  horseWins: 0,
  eggBreaks: 0,
  mineHits: 0,
  duelWins: 0,
  duelBestStreak: 0,
  duelBestMs: null,
  duelMisfires: 0,
  checkedItems: 0,
  anysHolding: 0,
  anysPaid: 0,
  anysOwing: 0,
  quoted: 0,
})

/** Langste reeks dat dezelfde persoon achter elkaar wint. */
function winStreaks(games: GameResult[], into: Map<string, PersonStats>, field: 'bestWinStreak' | 'duelBestStreak') {
  const sorted = [...games].sort((a, b) => a.created_at.localeCompare(b.created_at))
  let id: string | null = null
  let n = 0
  for (const g of sorted) {
    n = g.winner_id === id ? n + 1 : 1
    id = g.winner_id
    const s = into.get(g.winner_id)
    if (s) s[field] = Math.max(s[field], n)
  }
}

const beerCalendar = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Amsterdam', year: 'numeric', month: 'numeric', day: 'numeric',
  hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
})

function beerMonth(date: Date) {
  const parts = Object.fromEntries(beerCalendar.formatToParts(date).map((p) => [p.type, Number(p.value)]))
  return { index: parts.year * 12 + parts.month - 1, parts }
}

/** Gedeelde winnaars tellen mee; lege maanden en een onderbreking breken de reeks. */
function beerChampionships(input: StatsInput, now: Date, since = '') {
  const result = new Map(input.housemates.map((h) => [h.id, { beerMonthWins: 0, bestBeerMonthStreak: 0 }]))
  const beerTypes = new Set(input.types.filter((t) => t.name.trim().toLowerCase() === 'bier').map((t) => t.id))
  const months = new Map<number, Map<string, number>>()
  const currentMonth = beerMonth(now).index
  let firstMonth = -Infinity
  if (since) {
    const date = new Date(since)
    const { index, parts } = beerMonth(date)
    const isMonthStart = parts.day === 1 && parts.hour === 0 && parts.minute === 0 && parts.second === 0 && date.getMilliseconds() === 0
    firstMonth = index + (isMonthStart ? 0 : 1)
  }
  for (const t of input.tallies) {
    if (!t.drink_type_id || !beerTypes.has(t.drink_type_id) || !result.has(t.housemate_id)) continue
    const date = new Date(t.created_at)
    if (!Number.isFinite(date.getTime())) continue
    const month = beerMonth(date).index
    if (month >= currentMonth || month < firstMonth) continue
    const totals = months.get(month) ?? new Map<string, number>()
    totals.set(t.housemate_id, (totals.get(t.housemate_id) ?? 0) + t.count)
    months.set(month, totals)
  }
  const lastWin = new Map<string, { month: number; streak: number }>()
  for (const [month, totals] of [...months].sort(([a], [b]) => a - b)) {
    const best = Math.max(...totals.values())
    if (best <= 0) continue
    for (const [id, count] of totals) {
      if (count !== best) continue
      const previous = lastWin.get(id)
      const streak = previous?.month === month - 1 ? previous.streak + 1 : 1
      lastWin.set(id, { month, streak })
      const stats = result.get(id)!
      stats.beerMonthWins++
      stats.bestBeerMonthStreak = Math.max(stats.bestBeerMonthStreak, streak)
    }
  }
  return result
}

export function computeStats(input: StatsInput, now = new Date()): Map<string, PersonStats> {
  const { housemates, tallies, types, games, events, shopping, anys, quotes } = input
  const stats = new Map<string, PersonStats>()
  for (const h of housemates) stats.set(h.id, empty())
  const typeName = new Map(types.map((t) => [t.id, t.name.toLowerCase()]))

  // Drinken
  const days = new Map<string, Set<string>>()
  const perNight = new Map<string, number>()
  const perMonth = new Map<string, Map<string, number>>()
  const thisMonth = now.toISOString().slice(0, 7)
  for (const t of tallies) {
    const s = stats.get(t.housemate_id)
    if (!s) continue
    const d = new Date(t.created_at)
    const k = dayKey(d)
    s.totalDrinks += t.count
    const set = days.get(t.housemate_id) ?? new Set()
    set.add(k)
    days.set(t.housemate_id, set)
    const nk = `${t.housemate_id}|${k}`
    perNight.set(nk, (perNight.get(nk) ?? 0) + t.count)
    const hour = d.getHours()
    if (hour >= 6 && hour < 12) s.earlyDrinks += t.count
    if (hour >= 3 && hour < 6) s.lateDrinks += t.count
    const name = (t.drink_type_id && typeName.get(t.drink_type_id)) || ''
    if (name.trim() === 'bier' && d <= now) s.beer += t.count
    if (/bozu|boze/.test(name)) s.bozu += t.count
    if (/shot/.test(name)) s.shots += t.count
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const mm = perMonth.get(m) ?? new Map<string, number>()
    mm.set(t.housemate_id, (mm.get(t.housemate_id) ?? 0) + t.count)
    perMonth.set(m, mm)
  }
  for (const [id, set] of days) stats.get(id)!.bestDrinkStreak = longestStreak(set)
  for (const [nk, n] of perNight) {
    const s = stats.get(nk.split('|')[0])!
    s.maxPerNight = Math.max(s.maxPerNight, n)
  }
  for (const [m, mm] of perMonth) {
    if (m >= thisMonth) continue // alleen afgeronde maanden
    const best = Math.max(...mm.values())
    for (const [id, n] of mm) if (n === best && best > 0) stats.get(id)!.monthWins++
  }
  for (const [id, beerStats] of beerChampionships(input, now)) Object.assign(stats.get(id)!, beerStats)

  // Spelletjes
  for (const g of games) {
    const s = stats.get(g.winner_id)
    if (!s) continue
    s.wins++
    if (g.game === 'Paardenrace') s.horseWins++
    if (g.game === 'Duel') s.duelWins++
  }
  winStreaks(games, stats, 'bestWinStreak')
  winStreaks(
    games.filter((g) => g.game === 'Duel'),
    stats,
    'duelBestStreak',
  )
  for (const e of events) {
    const s = stats.get(e.housemate_id)
    if (!s) continue
    if (e.kind === 'egg_break') s.eggBreaks++
    if (e.kind === 'mine_hit') s.mineHits++
    if (e.kind === 'duel_misfire') s.duelMisfires++
    if (e.kind === 'duel_win_ms' && e.value !== null) s.duelBestMs = s.duelBestMs === null ? e.value : Math.min(s.duelBestMs, e.value)
  }

  // Boodschappen
  for (const item of shopping) {
    if (!item.checked || !item.checked_by) continue
    const s = stats.get(item.checked_by)
    if (s) s.checkedItems++
  }

  // Anys
  for (const a of anys) {
    if (a.redeemed_at) {
      const s = stats.get(a.owed_by)
      if (s) s.anysPaid++
    } else {
      const h = stats.get(a.owed_to)
      if (h) h.anysHolding++
      const d = stats.get(a.owed_by)
      if (d) d.anysOwing++
    }
  }

  // Quotes (op naam)
  const byName = new Map(housemates.map((h) => [h.name.trim().toLowerCase(), h.id]))
  for (const q of quotes) {
    const id = q.said_by ?? (q.said_by_name ? byName.get(q.said_by_name.trim().toLowerCase()) : undefined)
    const s = id ? stats.get(id) : undefined
    if (s) s.quoted++
  }
  return stats
}

export const TIER_COLOR: Record<Tier, string> = {
  brons: 'var(--bronze)',
  zilver: 'var(--silver)',
  goud: 'var(--gold)',
  speciaal: 'var(--g-magenta)',
}

/** Alle tabellen die nodig zijn om achievements uit te rekenen. */
export const STAT_TABLES = ['drink_tallies', 'drink_types', 'game_results', 'game_events', 'shopping_items', 'anytimers', 'quotes'] as const

/** Een reset begint een nieuwe telperiode; de profielstatistieken blijven historisch. */
export function computeAchievementStats(input: StatsInput, now = new Date()): Map<string, PersonStats> {
  const result = new Map<string, PersonStats>()
  const periods = new Map<string, Map<string, PersonStats>>()
  for (const person of input.housemates) {
    const since = person.achievements_since ?? ''
    let stats = periods.get(since)
    if (!stats) {
      const recent = <T extends { created_at: string }>(rows: T[]) => rows.filter((r) => r.created_at >= since)
      stats = computeStats({
        ...input,
        tallies: recent(input.tallies), games: recent(input.games), events: recent(input.events), quotes: recent(input.quotes),
        shopping: input.shopping.filter((r) => (r.checked_at ?? r.created_at) >= since),
        anys: input.anys.filter((r) => (r.redeemed_at ?? r.created_at) >= since),
      }, now)
      // Vergelijk complete maanden met alle huisgenoten, ook als zij eerder in de maand turften.
      if (since) for (const [id, beerStats] of beerChampionships(input, now, since)) Object.assign(stats.get(id)!, beerStats)
      periods.set(since, stats)
    }
    result.set(person.id, stats.get(person.id)!)
  }
  return result
}
