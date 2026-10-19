import type { Tables, TableName } from './types'

// Nepdata voor `npm run demo`. Wordt alleen gebruikt zonder Supabase.
const now = Date.now()
const ago = (h: number) => new Date(now - h * 3600_000).toISOString()

const H = ['Youri', 'Sanne', 'Daan', 'Lotte', 'Bram', 'Fleur', 'Joep', 'Noor']
const COLORS = ['#f4b81c', '#e23d8f', '#2a6fd6', '#239a57', '#f0702a', '#d8323f', '#7a4bd1', '#2bb3b1']
const hid = (i: number) => `h${i}`

const housemates: Tables['housemates'][] = H.map((name, i) => ({
  id: hid(i),
  name,
  color: COLORS[i],
  active: true,
  created_at: ago(2000 - i),
}))

const drink_types: Tables['drink_types'][] = [
  { id: 'd0', name: 'Bier', active: true, created_at: ago(1900) },
  { id: 'd1', name: 'Bozu', active: true, created_at: ago(1899) },
  { id: 'd2', name: 'Shotjes', active: true, created_at: ago(1898) },
]

const drink_purchases: Tables['drink_purchases'][] = [
  { id: 'p0', description: 'Krat Hertog Jan', cost_cents: 1499, paid_by: hid(0), created_at: ago(200) },
  { id: 'p1', description: 'Krat Hertog Jan', cost_cents: 1529, paid_by: hid(2), created_at: ago(90) },
  { id: 'p2', description: 'Fles Bozu', cost_cents: 1199, paid_by: hid(3), created_at: ago(60) },
  { id: 'p3', description: 'Fles Flügel', cost_cents: 899, paid_by: hid(4), created_at: ago(30) },
]

// Streepjes verspreid over ~3 weken, met een drukke huisavond 2 dagen geleden
const drink_tallies: Tables['drink_tallies'][] = []
let n = 0
const counts = [14, 9, 18, 6, 12, 7, 11, 4]
counts.forEach((c, i) => {
  for (let k = 0; k < c; k++) {
    const r = (i * 31 + k * 17) % 100
    const type = r < 62 ? 'd0' : r < 84 ? 'd1' : 'd2'
    const hours = k % 3 === 0 ? 48 + ((k * 7) % 5) : 2 + ((i * 13 + k * 29) % 480)
    drink_tallies.push({ id: `t${n++}`, drink_type_id: type, housemate_id: hid(i), count: 1, created_at: ago(hours) })
  }
})

const shopping_items: Tables['shopping_items'][] = [
  { id: 's0', name: 'Wc-papier', note: 'de grote pak', checked: false, checked_at: null, created_at: ago(30) },
  { id: 's1', name: 'Afwasmiddel', note: null, checked: false, checked_at: null, created_at: ago(20) },
  { id: 's2', name: 'Pindakaas', note: 'met stukjes', checked: false, checked_at: null, created_at: ago(8) },
  { id: 's3', name: 'Vuilniszakken', note: null, checked: false, checked_at: null, created_at: ago(3) },
  { id: 's4', name: 'Melk', note: null, checked: true, checked_at: ago(2), created_at: ago(40) },
]

const any = (id: string, to: number, by: number, reason: string, h: number, redeemed = false) => ({
  id,
  owed_to: hid(to),
  owed_by: hid(by),
  reason,
  redeemed_at: redeemed ? ago(h / 2) : null,
  created_at: ago(h),
})
const anytimers: Tables['anytimers'][] = [
  any('a0', 0, 2, 'Weddenschap Ajax–PSV', 300),
  any('a1', 0, 2, 'Afwas laten staan', 120),
  any('a2', 1, 0, 'Verloren met tafelvoetbal', 80),
  any('a3', 3, 4, 'Te laat bij huisavond', 50),
  any('a4', 5, 6, 'Rietbak-duel', 26),
  any('a5', 2, 7, 'Oplader gejat', 10),
  any('a7', 0, 6, 'Kingsen', 6),
  any('a6', 6, 1, 'Weddenschap', 400, true),
]

const disciplines: Tables['disciplines'][] = [
  { id: 'r0', name: 'Rietbak', created_at: ago(1800) },
  { id: 'r1', name: 'SG', created_at: ago(1799) },
]

const t = (id: string, d: string, h: number, ms: number, hours: number) => ({
  id,
  discipline_id: d,
  housemate_id: hid(h),
  ms,
  created_at: ago(hours),
})
const times: Tables['times'][] = [
  t('x0', 'r0', 2, 3420, 300),
  t('x1', 'r0', 0, 3890, 280),
  t('x2', 'r0', 4, 4120, 200),
  t('x3', 'r0', 6, 4710, 150),
  t('x4', 'r0', 1, 5230, 140),
  t('x5', 'r0', 0, 3610, 30),
  t('x6', 'r1', 3, 2870, 100),
  t('x7', 'r1', 5, 3150, 90),
  t('x8', 'r1', 2, 3330, 70),
]

const quotes: Tables['quotes'][] = [
  { id: 'q0', text: 'Ik drink vanavond echt maar twee biertjes', said_by: null, said_by_name: 'Daan', context: null, created_at: ago(400) },
  { id: 'q1', text: 'Gevangenis is ook maar een locatie', said_by: null, said_by_name: 'Bram', context: null, created_at: ago(300) },
  { id: 'q2', text: 'Wat ben je toch zwaar', said_by: null, said_by_name: 'Joep', context: 'tegen Lotte', created_at: ago(200) },
]

export const demoSeed: { [K in TableName]?: Tables[K][] } = {
  housemates,
  drink_types,
  drink_purchases,
  drink_tallies,
  shopping_items,
  anytimers,
  disciplines,
  times,
  quotes,
}
