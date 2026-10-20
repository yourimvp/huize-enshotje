import { useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { unlockAchievement } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { ACHIEVEMENTS, BY_KEY, TIER_COLOR, type Achievement } from '../lib/achievements'
import { useStats } from '../lib/useStats'
import type { AchievementUnlock } from '../lib/types'

export function Medal({ a, size = 64, locked = false, hidden = false }: { a: Achievement; size?: number; locked?: boolean; hidden?: boolean }) {
  return (
    <span
      className={`medal ${locked ? 'locked' : ''} tier-${a.tier}`}
      style={{ width: size, height: size, fontSize: size * 0.42, ['--tier' as string]: TIER_COLOR[a.tier] }}
      aria-hidden
    >
      <span className="medal-icon">{hidden ? '?' : a.icon}</span>
    </span>
  )
}

const SEEN_KEY = 'enshotje:seen-unlocks'
const FRESH_MS = 15 * 60_000
const GLASS = ['#f2b51f', '#e0468f', '#3a7be0', '#2fa463', '#ee7432', '#db3b47']

function readSeen(): Set<string> | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? new Set(JSON.parse(raw)) : null
  } catch {
    return null
  }
}
function writeSeen(s: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-500)))
  } catch {
    /* ignore */
  }
}

export function fireConfetti() {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const opts = { colors: GLASS, ticks: 220, gravity: 0.9, scalar: 1.05 }
  confetti({ ...opts, particleCount: 90, spread: 75, origin: { x: 0.5, y: 0.55 } })
  setTimeout(() => confetti({ ...opts, particleCount: 50, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } }), 180)
  setTimeout(() => confetti({ ...opts, particleCount: 50, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } }), 180)
}

/**
 * Draait altijd op de achtergrond: kijkt of iemand een achievement heeft
 * gehaald, legt hem vast en laat bij iedereen die online is confetti zien.
 */
export function AchievementWatcher() {
  const { housemates, byId } = useHouse()
  const { achievementStats: stats, pending } = useStats()
  const unlocks = useTable('achievement_unlocks')
  const attempted = useRef(new Set<string>())
  const [queue, setQueue] = useState<AchievementUnlock[]>([])

  // 1. Nieuwe prestaties vastleggen
  useEffect(() => {
    if (pending || unlocks.loading || housemates.length === 0) return
    const have = new Set(unlocks.rows.map((u) => `${u.housemate_id}|${u.key}`))
    for (const [id, s] of stats) {
      for (const a of ACHIEVEMENTS) {
        const epoch = byId.get(id)?.achievements_since ?? null
        const k = `${id}|${a.key}|${epoch ?? ''}`
        if (a.value(s) >= a.target && !have.has(`${id}|${a.key}`) && !attempted.current.has(k)) {
          attempted.current.add(k)
          unlockAchievement(id, a.key, epoch).catch(() => attempted.current.delete(k))
        }
      }
    }
  }, [stats, pending, unlocks.rows, unlocks.loading, housemates.length, byId])

  // 2. Nieuwe unlocks tonen (ook als iemand anders ze haalde)
  useEffect(() => {
    if (unlocks.loading) return
    let seen = readSeen()
    if (!seen) {
      // Eerste keer op deze telefoon: alles wat er al was niet opnieuw vieren
      seen = new Set(unlocks.rows.map((u) => u.id))
      writeSeen(seen)
      return
    }
    const now = Date.now()
    const fresh = unlocks.rows.filter((u) => !seen!.has(u.id))
    if (fresh.length === 0) return
    fresh.forEach((u) => seen!.add(u.id))
    writeSeen(seen)
    const show = fresh.filter((u) => now - new Date(u.created_at).getTime() < FRESH_MS && BY_KEY.has(u.key))
    if (show.length) setQueue((q) => [...q, ...show])
  }, [unlocks.rows, unlocks.loading])

  const current = queue.slice(0, 4)
  useEffect(() => {
    if (current.length === 0) return
    fireConfetti()
    navigator.vibrate?.([30, 40, 30])
    const t = setTimeout(() => setQueue((q) => q.slice(4)), 7000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.map((c) => c.id).join()])

  if (current.length === 0) return null
  const extra = queue.length - current.length
  return (
    <div className="modal-backdrop unlock-backdrop" onClick={() => setQueue((q) => q.slice(4))}>
      <div className="modal card unlock" role="alertdialog" aria-label="Nieuwe prestatie" onClick={(e) => e.stopPropagation()}>
        <p className="unlock-kicker">{current.length > 1 ? `${current.length} nieuwe prestaties!` : 'Nieuwe prestatie!'}</p>
        {current.map((u) => {
          const a = BY_KEY.get(u.key)!
          const h = byId.get(u.housemate_id)
          return (
            <div key={u.id} className={`unlock-row ${current.length === 1 ? 'big' : ''}`}>
              <Medal a={a} size={current.length === 1 ? 104 : 56} />
              <div>
                <p className="unlock-who">{h?.name ?? 'Iemand'}</p>
                <p className="unlock-title">{a.title}</p>
                <p className="hint">{a.desc}</p>
              </div>
            </div>
          )
        })}
        {extra > 0 && <p className="hint">en nog {extra}…</p>}
        <button className="btn primary" onClick={() => setQueue((q) => q.slice(4))}>
          Proost!
        </button>
      </div>
    </div>
  )
}
