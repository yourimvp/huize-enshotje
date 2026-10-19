import { dayKey, longestStreak } from './days'
import type { DrinkTally, GameResult, Housemate, ShoppingItem } from './types'

export type Tier = 'brons' | 'zilver' | 'goud' | 'speciaal'

export interface Achievement {
  key: string
  title: string
  desc: string
  icon: string
  tier: Tier
  group: string
  /** Hoeveel heeft iemand al, en hoeveel is er nodig */
  target: number
  value: (s: PersonStats) => number
}

export interface PersonStats {
  wins: number
  bestWinStreak: number
  checkedItems: number
  bestDrinkStreak: number
  maxPerNight: number
  totalDrinks: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // Spelletjes winnen
  { key: 'win-1', group: 'Spelletjes', title: 'Eerste overwinning', desc: 'Win een spelletje', icon: '🎲', tier: 'brons', target: 1, value: (s) => s.wins },
  { key: 'win-5', group: 'Spelletjes', title: 'Spelletjesbeest', desc: 'Win 5 spelletjes', icon: '🃏', tier: 'zilver', target: 5, value: (s) => s.wins },
  { key: 'win-25', group: 'Spelletjes', title: 'Kampioen van Enshotje', desc: 'Win 25 spelletjes', icon: '🏆', tier: 'goud', target: 25, value: (s) => s.wins },
  // Winstreak
  { key: 'winstreak-2', group: 'Winstreak', title: 'Dubbelslag', desc: 'Win 2 spelletjes achter elkaar', icon: '⚡', tier: 'brons', target: 2, value: (s) => s.bestWinStreak },
  { key: 'winstreak-3', group: 'Winstreak', title: 'Hattrick', desc: 'Win 3 spelletjes achter elkaar', icon: '🎩', tier: 'zilver', target: 3, value: (s) => s.bestWinStreak },
  { key: 'winstreak-5', group: 'Winstreak', title: 'Onverslaanbaar', desc: 'Win 5 spelletjes achter elkaar', icon: '👑', tier: 'goud', target: 5, value: (s) => s.bestWinStreak },
  // Boodschappen
  { key: 'shop-1', group: 'Boodschappen', title: 'Boodschapper', desc: 'Streep iets af van de boodschappenlijst', icon: '🛒', tier: 'brons', target: 1, value: (s) => s.checkedItems },
  { key: 'shop-10', group: 'Boodschappen', title: 'Vaste klant', desc: 'Streep 10 boodschappen af', icon: '🧺', tier: 'zilver', target: 10, value: (s) => s.checkedItems },
  { key: 'shop-50', group: 'Boodschappen', title: 'Bonuskaart-baas', desc: 'Streep 50 boodschappen af', icon: '🥇', tier: 'goud', target: 50, value: (s) => s.checkedItems },
  // Drinkstreak
  { key: 'streak-1', group: 'Streaks', title: 'Proost', desc: 'Drink je eerste biertje op de turflijst', icon: '🍺', tier: 'brons', target: 1, value: (s) => s.bestDrinkStreak },
  { key: 'streak-3', group: 'Streaks', title: 'Lang weekend', desc: '3 dagen achter elkaar een drankje', icon: '🔥', tier: 'zilver', target: 3, value: (s) => s.bestDrinkStreak },
  { key: 'streak-7', group: 'Streaks', title: 'Doordrinker', desc: '7 dagen achter elkaar elke dag een drankje', icon: '🌋', tier: 'goud', target: 7, value: (s) => s.bestDrinkStreak },
  // Los
  { key: '7-dronk', group: 'Los', title: '7 Dronk', desc: '7 streepjes op één avond', icon: '🥴', tier: 'speciaal', target: 7, value: (s) => s.maxPerNight },
]

export const BY_KEY = new Map(ACHIEVEMENTS.map((a) => [a.key, a]))

export function computeStats(
  housemates: Housemate[],
  tallies: DrinkTally[],
  games: GameResult[],
  shopping: ShoppingItem[],
): Map<string, PersonStats> {
  const stats = new Map<string, PersonStats>()
  for (const h of housemates)
    stats.set(h.id, { wins: 0, bestWinStreak: 0, checkedItems: 0, bestDrinkStreak: 0, maxPerNight: 0, totalDrinks: 0 })

  // Drank: dagen en max per avond
  const days = new Map<string, Set<string>>()
  const perNight = new Map<string, number>()
  for (const t of tallies) {
    const s = stats.get(t.housemate_id)
    if (!s) continue
    const k = dayKey(t.created_at)
    s.totalDrinks += t.count
    const set = days.get(t.housemate_id) ?? new Set()
    set.add(k)
    days.set(t.housemate_id, set)
    const nk = `${t.housemate_id}|${k}`
    perNight.set(nk, (perNight.get(nk) ?? 0) + t.count)
  }
  for (const [id, set] of days) stats.get(id)!.bestDrinkStreak = longestStreak(set)
  for (const [nk, n] of perNight) {
    const s = stats.get(nk.split('|')[0])!
    s.maxPerNight = Math.max(s.maxPerNight, n)
  }

  // Spelletjes: totaal en langste reeks achter elkaar gewonnen
  const sorted = [...games].sort((a, b) => a.created_at.localeCompare(b.created_at))
  let streakId: string | null = null
  let streakN = 0
  for (const g of sorted) {
    const s = stats.get(g.winner_id)
    if (!s) continue
    s.wins++
    streakN = g.winner_id === streakId ? streakN + 1 : 1
    streakId = g.winner_id
    s.bestWinStreak = Math.max(s.bestWinStreak, streakN)
  }

  // Boodschappen afgestreept
  for (const item of shopping) {
    if (!item.checked || !item.checked_by) continue
    const s = stats.get(item.checked_by)
    if (s) s.checkedItems++
  }
  return stats
}

export const TIER_COLOR: Record<Tier, string> = {
  brons: 'var(--bronze)',
  zilver: 'var(--silver)',
  goud: 'var(--gold)',
  speciaal: 'var(--g-magenta)',
}
