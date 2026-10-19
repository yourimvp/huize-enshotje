import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { useNavigate } from 'react-router-dom'

const COLORS = ['#f2b51f', '#e0468f', '#3a7be0', '#2fa463', '#ee7432', '#db3b47', '#7a4bd1', '#2bb3b1', '#ffffff', '#c99a2e']
const WAIT_MS = 2200

interface Finger {
  x: number
  y: number
  color: string
}

/** Iedereen een vinger op het scherm; na een paar tellen wordt er één gekozen. */
export default function Chwazi() {
  const navigate = useNavigate()
  const [fingers, setFingers] = useState<Map<number, Finger>>(new Map())
  const [picked, setPicked] = useState<number | null>(null)
  const [counting, setCounting] = useState(false)
  const timer = useRef(0)
  const colorIdx = useRef(0)

  // Elke verandering in het aantal vingers start de telling opnieuw
  const count = fingers.size
  useEffect(() => {
    window.clearTimeout(timer.current)
    if (picked !== null) {
      if (count === 0) setTimeout(() => setPicked(null), 400)
      return
    }
    if (count >= 2) {
      setCounting(true)
      timer.current = window.setTimeout(() => {
        const ids = [...fingers.keys()]
        setPicked(ids[Math.floor(Math.random() * ids.length)])
        setCounting(false)
        navigator.vibrate?.(120)
      }, WAIT_MS)
    } else setCounting(false)
    return () => window.clearTimeout(timer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, picked])

  const down = (e: PointerEvent) => {
    e.preventDefault()
    if (picked !== null) return
    const c = COLORS[colorIdx.current++ % COLORS.length]
    setFingers((m) => new Map(m).set(e.pointerId, { x: e.clientX, y: e.clientY, color: c }))
  }
  const move = (e: PointerEvent) => {
    setFingers((m) => {
      const f = m.get(e.pointerId)
      if (!f) return m
      return new Map(m).set(e.pointerId, { ...f, x: e.clientX, y: e.clientY })
    })
  }
  const up = (e: PointerEvent) => {
    setFingers((m) => {
      if (!m.has(e.pointerId)) return m
      const n = new Map(m)
      n.delete(e.pointerId)
      return n
    })
  }

  const winner = picked !== null ? fingers.get(picked) : null

  return (
    <div
      className={`chwazi ${picked !== null ? 'has-pick' : ''}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onContextMenu={(e) => e.preventDefault()}
      style={winner ? { ['--win' as string]: winner.color } : undefined}
    >
      <button className="chwazi-close" onPointerDown={(e) => e.stopPropagation()} onClick={() => navigate('/spellen')}>
        ✕
      </button>
      {count === 0 && picked === null && (
        <div className="chwazi-help">
          <p className="chwazi-title">Chwazi</p>
          <p>Iedereen een vinger op het scherm en stilhouden.</p>
          <p className="hint">Werkt op een telefoon of tablet met meerdere vingers.</p>
        </div>
      )}
      {count === 1 && picked === null && <p className="chwazi-status">Wachten op meer vingers…</p>}
      {counting && <p className="chwazi-status">Niet bewegen…</p>}
      {picked !== null && <p className="chwazi-status">Jij bent het! 🍻</p>}
      {[...fingers].map(([id, f]) => (
        <span
          key={id}
          className={`finger ${counting ? 'pulse' : ''} ${picked === id ? 'chosen' : ''} ${picked !== null && picked !== id ? 'gone' : ''}`}
          style={{ left: f.x, top: f.y, ['--c' as string]: f.color }}
        />
      ))}
    </div>
  )
}
