import type { DrinkPurchase, DrinkTally, DrinkType, Housemate } from './types'
import { inMonth } from './format'

export function purchasePresets(name: string) {
  if (name.toLowerCase() === 'bier') return [
    { label: 'Enkel biertje', quantity: 1 },
    { label: 'Sixpack', quantity: 6 },
    { label: 'Kratje', quantity: 24 },
  ]
  if (/bozu|boze/i.test(name)) return [
    { label: 'Enkele Bozu', quantity: 1 },
    { label: 'Tray (12)', quantity: 12 },
  ]
  return [{ label: 'Fles 700 ml · 35 shots', quantity: 35 }]
}

export function purchaseComplete(p: DrinkPurchase) {
  return !!p.drink_type_id && p.quantity != null && Number.isFinite(p.quantity) && p.quantity > 0
}

/** Gewogen categorieprijs over alle inkopen tot en met de gekozen maand.
 * Reken met ongeronde centen; rond pas het totale verbruik per persoon af.
 * Ontbrekende inkoopgegevens krijgen nooit stilzwijgend een prijs van nul.
 */
export function settleMonth(month: Date, housemates: Housemate[], tallies: DrinkTally[], purchases: DrinkPurchase[], types: DrinkType[]) {
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const history = purchases.filter((p) => new Date(p.created_at) < end)
  const incompletePurchases = history.filter((p) => !purchaseComplete(p))
  const categories = types.map((type) => {
    const bought = history.filter((p) => p.drink_type_id === type.id && purchaseComplete(p))
    const cost = bought.reduce((sum, p) => sum + p.cost_cents, 0)
    const quantity = bought.reduce((sum, p) => sum + p.quantity!, 0)
    return { type, cost, quantity, price: quantity ? cost / quantity : null }
  })
  const rates = new Map(categories.map((c) => [c.type.id, c.price]))
  const monthTallies = tallies.filter((t) => inMonth(t.created_at, month))
  const monthPurchases = history.filter((p) => inMonth(p.created_at, month))
  const rows = housemates.flatMap((h) => {
    const drunk = monthTallies.filter((t) => t.housemate_id === h.id)
    const paid = monthPurchases.filter((p) => p.paid_by === h.id).reduce((sum, p) => sum + p.cost_cents, 0)
    if (!drunk.length && !paid) return []
    const missingPrice = drunk.some((t) => !t.drink_type_id || rates.get(t.drink_type_id) == null)
    const share = missingPrice ? null : Math.round(drunk.reduce((sum, t) => sum + t.count * rates.get(t.drink_type_id!)!, 0))
    return [{ h, drinks: drunk.reduce((sum, t) => sum + t.count, 0), share, paid }]
  }).sort((a, b) => b.drinks - a.drinks)
  const missingPrices = monthTallies.filter((t) => !t.drink_type_id || rates.get(t.drink_type_id) == null)
  return {
    rows, categories, incompletePurchases,
    incomplete: incompletePurchases.length > 0 || missingPrices.length > 0,
    totalDrinks: monthTallies.reduce((sum, t) => sum + t.count, 0),
    totalCost: monthPurchases.reduce((sum, p) => sum + p.cost_cents, 0),
    consumedCost: rows.reduce((sum, r) => sum + (r.share ?? 0), 0),
  }
}
