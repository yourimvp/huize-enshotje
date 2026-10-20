export const POUR_PER_SECOND = 0.06
/** De capaciteit varieert per ronde; tijd tussen twee beurten telt nooit mee. */
export function titanicCapacity(random = Math.random()): number {
  return 0.82 + Math.max(0, Math.min(1, random)) * 0.16
}
export function pourTitanic(fill: number, elapsedMs: number, capacity: number) {
  const next = Math.min(capacity, fill + Math.max(0, elapsedMs) / 1000 * POUR_PER_SECOND)
  return { fill: next, sunk: next >= capacity }
}
