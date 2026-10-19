/**
 * Een "huisdag" loopt van 06:00 tot 06:00: een biertje om 02:00 telt nog
 * bij de avond ervoor. Geeft een sleutel als "2026-10-19".
 */
export function dayKey(d: Date | string): string {
  const t = new Date(typeof d === 'string' ? d : d.getTime())
  t.setHours(t.getHours() - 6)
  return localDate(t)
}

export function localDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number)
  return localDate(new Date(y, m - 1, d + n))
}

/** Langste reeks opeenvolgende dagen in een set dag-sleutels. */
export function longestStreak(days: Set<string>): number {
  let best = 0
  for (const k of days) {
    if (days.has(addDays(k, -1))) continue // niet het begin van een reeks
    let n = 1
    while (days.has(addDays(k, n))) n++
    best = Math.max(best, n)
  }
  return best
}

/** Huidige reeks: telt door tot vandaag of gisteren (dan kan hij vandaag nog door). */
export function currentStreak(days: Set<string>, now = new Date()): number {
  const today = dayKey(now)
  let start = days.has(today) ? today : addDays(today, -1)
  let n = 0
  while (days.has(start)) {
    n++
    start = addDays(start, -1)
  }
  return n
}
