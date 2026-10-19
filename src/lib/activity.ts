import type { DrinkTally, DrinkType, TimeEntry } from './types'

/** Weekgrenzen in lokale kalenderdagen, ook tijdens de overgang naar wintertijd. */
export function weeklyDrinkStats(tallies: DrinkTally[], types: DrinkType[], week: Date) {
  const start = new Date(week.getFullYear(), week.getMonth(), week.getDate())
  const previous = new Date(start.getFullYear(), start.getMonth(), start.getDate() - 7)
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)
  const days = Array<number>(7).fill(0)
  const peopleByDay = Array.from({ length: 7 }, () => new Map<string, number>())
  const people = new Map<string, number>()
  const typeCount = new Map<string, number>()
  let total = 0
  let prev = 0
  for (const t of tallies) {
    const date = new Date(t.created_at)
    if (date >= previous && date < start) {
      prev += t.count
      continue
    }
    if (date < start || date >= end || !Number.isFinite(date.getTime())) continue
    const day = (date.getDay() + 6) % 7
    total += t.count
    days[day] += t.count
    const bucket = peopleByDay[day]
    bucket.set(t.housemate_id, (bucket.get(t.housemate_id) ?? 0) + t.count)
    people.set(t.housemate_id, (people.get(t.housemate_id) ?? 0) + t.count)
    const name = types.find((x) => x.id === t.drink_type_id)?.name ?? 'Overig'
    typeCount.set(name, (typeCount.get(name) ?? 0) + t.count)
  }
  const top = [...people.entries()].sort((a, b) => b[1] - a[1])[0]
  const byType = [...typeCount.entries()].sort((a, b) => b[1] - a[1])
  return { total, prev, days, peopleByDay, top, byType }
}

/** Eerste tijd, gelijkspel of een langzamere tijd is geen verbeterd persoonlijk record. */
export function isPersonalRecord(times: TimeEntry[], person: string, discipline: string, ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return false
  const previous = times.filter((t) => t.housemate_id === person && t.discipline_id === discipline)
  return previous.length > 0 && ms < Math.min(...previous.map((t) => t.ms))
}
