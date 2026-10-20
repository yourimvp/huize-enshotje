export interface MexScore {
  label: string
  rank: number
  kind: 'normal' | 'give' | 'out' | 'mex'
}

export interface MexTurn {
  rolls: number
  dice: readonly [number, number] | null
  score: MexScore | null
  held: number | null
  heldLastRoll: number | null
  ended: boolean
}

export function newMexTurn(): MexTurn {
  return { rolls: 0, dice: null, score: null, held: null, heldLastRoll: null, ended: false }
}

export function mexScore(a: number, b: number): MexScore {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  if (hi === 2 && lo === 1) return { label: 'Mex! (21)', rank: 1000, kind: 'mex' }
  if (hi === 3 && lo === 1) return { label: '31', rank: 0, kind: 'give' }
  if (hi === 3 && lo === 2) return { label: '32', rank: 32, kind: 'out' }
  if (hi === lo) return { label: `${hi * 100}`, rank: hi * 100, kind: 'normal' }
  return { label: `${hi}${lo}`, rank: hi * 10 + lo, kind: 'normal' }
}

export function finishMexRoll(turn: MexTurn, dice: readonly [number, number], maxRolls = 3): MexTurn {
  if (turn.ended) return turn
  const score = mexScore(...dice)
  const rolls = turn.rolls + (score.kind === 'give' ? 0 : 1)
  return {
    rolls,
    dice,
    score,
    held: null,
    heldLastRoll: turn.held,
    ended: rolls >= maxRolls || score.kind === 'out' || score.kind === 'mex',
  }
}

export function canHoldMexDie(turn: MexTurn, index: number): boolean {
  if (!turn.dice || turn.ended || turn.score?.kind === 'give' || index === turn.heldLastRoll) return false
  return turn.dice[index] === 1 || turn.dice[index] === 2
}

export function toggleMexHold(turn: MexTurn, index: number): MexTurn {
  if (!canHoldMexDie(turn, index)) return turn
  return { ...turn, held: turn.held === index ? null : index }
}
