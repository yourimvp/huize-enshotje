import type { DrinkPurchase, DrinkTally, Housemate } from './types'
import { inMonth } from './format'

export interface SettleRow {
  h: Housemate
  drinks: number
  share: number // wat iemand moet betalen (centen)
  paid: number // wat iemand heeft voorgeschoten (centen)
  saldo: number // paid - share; positief = krijgt geld terug
}

/**
 * Een streepje is een streepje: alle inkoop van de maand wordt verdeeld
 * over alle streepjes van die maand, ongeacht welk drankje.
 */
export function settleMonth(month: Date, housemates: Housemate[], tallies: DrinkTally[], purchases: DrinkPurchase[]) {
  const drinks = new Map<string, number>()
  const paid = new Map<string, number>()
  let totalDrinks = 0
  let totalCost = 0

  for (const t of tallies) {
    if (!inMonth(t.created_at, month)) continue
    drinks.set(t.housemate_id, (drinks.get(t.housemate_id) ?? 0) + t.count)
    totalDrinks += t.count
  }
  for (const p of purchases) {
    if (!inMonth(p.created_at, month)) continue
    totalCost += p.cost_cents
    if (p.paid_by) paid.set(p.paid_by, (paid.get(p.paid_by) ?? 0) + p.cost_cents)
  }

  const perStreepje = totalDrinks ? totalCost / totalDrinks : 0
  const rows: SettleRow[] = housemates
    .filter((h) => drinks.has(h.id) || paid.has(h.id))
    .map((h) => {
      const d = drinks.get(h.id) ?? 0
      const share = Math.round(d * perStreepje)
      const p = paid.get(h.id) ?? 0
      return { h, drinks: d, share, paid: p, saldo: p - share }
    })
    .sort((a, b) => b.drinks - a.drinks)

  return { rows, totalDrinks, totalCost, perStreepje }
}
