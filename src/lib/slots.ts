export const SLOT_SYMBOLS = ['door', 'cow', 'beer', 'shot', 'dice', 'horse'] as const
export type SlotSymbol = typeof SLOT_SYMBOLS[number]
export type SlotGrid = SlotSymbol[][] // rij, kolom
export type LineCount = 1 | 3 | 5

export const SLOT_NAMES: Record<SlotSymbol, string> = {
  door: 'Deur', cow: 'Koeienvlek', beer: 'Bier', shot: 'Shotje', dice: 'Dobbelsteen', horse: 'Paard',
}
export const TRIPLE_PAYOUT: Record<SlotSymbol, number> = {
  beer: 8, shot: 12, cow: 16, dice: 20, horse: 24, door: 30,
}
// De middelste rij is altijd actief; daarna boven, onder en beide diagonalen.
export const SLOT_LINES = [
  { name: 'Midden', rows: [1, 1, 1], color: '#e0468f' },
  { name: 'Boven', rows: [0, 0, 0], color: '#3a7be0' },
  { name: 'Onder', rows: [2, 2, 2], color: '#2fa463' },
  { name: 'Schuin omlaag', rows: [0, 1, 2], color: '#ee7432' },
  { name: 'Schuin omhoog', rows: [2, 1, 0], color: '#7a4bd1' },
] as const

export interface SlotWin {
  line: number
  symbol: SlotSymbol
  matches: 2 | 3
  payout: number
}

/** Twee dezelfde op een lijn = 1; drie dezelfde = de bijbehorende prijs. */
export function slotLinePayout(symbols: readonly SlotSymbol[]) {
  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    return { symbol: symbols[0], matches: 3 as const, payout: TRIPLE_PAYOUT[symbols[0]] }
  }
  const pair = symbols.find((symbol, i) => symbols.indexOf(symbol) !== i)
  return pair ? { symbol: pair, matches: 2 as const, payout: 1 } : null
}

export function evaluateSlots(grid: SlotGrid, lineCount: LineCount) {
  const wins: SlotWin[] = []
  SLOT_LINES.slice(0, lineCount).forEach((line, index) => {
    const match = slotLinePayout(line.rows.map((row, col) => grid[row][col]))
    if (match) wins.push({ ...match, line: index })
  })
  return { stake: lineCount, wins, payout: wins.reduce((total, win) => total + win.payout, 0) }
}

export function randomSlotSymbol(random = Math.random): SlotSymbol {
  return SLOT_SYMBOLS[Math.min(5, Math.floor(random() * SLOT_SYMBOLS.length))]
}
export function spinSlots(random = Math.random): SlotGrid {
  return Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => randomSlotSymbol(random)))
}
