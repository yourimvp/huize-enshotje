const euroFmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

export const euro = (cents: number) => euroFmt.format(cents / 100)

/** "12,50" / "12.5" / "€ 12" → 1250. Geeft null bij onzin. */
export function parseEuro(input: string): number | null {
  const clean = input.replace(/[€\s]/g, '').replace(',', '.')
  if (!clean) return null
  const n = Number(clean)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

/** 3420 → "3,42", 64200 → "1:04,20" */
export function formatMs(ms: number): string {
  const totalCs = Math.round(ms / 10)
  const cs = totalCs % 100
  const s = Math.floor(totalCs / 100) % 60
  const m = Math.floor(totalCs / 6000)
  const sc = `${s},${String(cs).padStart(2, '0')}`
  return m > 0 ? `${m}:${String(s).padStart(2, '0')},${String(cs).padStart(2, '0')}` : sc
}

/** "3,42" / "3.42" / "1:04.2" → ms */
export function parseTime(input: string): number | null {
  const clean = input.trim().replace(',', '.')
  if (!clean) return null
  const parts = clean.split(':')
  let secs: number
  if (parts.length === 2) secs = Number(parts[0]) * 60 + Number(parts[1])
  else if (parts.length === 1) secs = Number(parts[0])
  else return null
  if (!Number.isFinite(secs) || secs <= 0) return null
  return Math.round(secs * 1000)
}

const rtf = new Intl.RelativeTimeFormat('nl', { numeric: 'auto' })

export function ago(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'net'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 7) return rtf.format(Math.round(diff / 86400), 'day')
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

export function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/** Maandag 00:00 van de week waarin d valt */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
}

export function inMonth(iso: string, month: Date): boolean {
  const d = new Date(iso)
  return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()
}
