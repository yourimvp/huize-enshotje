import { useEffect, useRef, useState } from 'react'
import { insert } from '../lib/db'
import { useHouse } from '../lib/house'
import { useMe } from '../lib/me'
import { GameShell, Kast, PlayerSelect } from '../components/game'
import { fireConfetti } from '../components/Achievements'

type Phase = 'ready' | 'wait' | 'fire' | 'done'
interface Outcome {
  winner: number // 0 = onder, 1 = boven
  ms: number | null
  misfire: number | null
}

/** Cowboy: hoed + jas, geborduurd silhouet. */
function Cowboy({ color, flip = false, shot = false }: { color: string; flip?: boolean; shot?: boolean }) {
  return (
    <svg viewBox="0 0 80 110" width="70" height="96" className={`cowboy ${shot ? 'shot' : ''}`} style={{ transform: flip ? 'scaleX(-1)' : undefined }} aria-hidden>
      <g filter="url(#emb)">
        <path d="M10 30 C14 22 66 22 70 30 C62 32 18 32 10 30 Z" fill="#5a3b22" />
        <path d="M24 28 C24 12 56 12 56 28 Z" fill="#6e4a2b" />
        <path d="M24 28 C24 12 56 12 56 28 Z" fill="url(#satin)" />
        <circle cx="40" cy="40" r="11" fill="#e8c8a0" />
        <path d="M22 106 L26 62 C28 54 52 54 54 62 L58 106 Z" fill={color} />
        <path d="M22 106 L26 62 C28 54 52 54 54 62 L58 106 Z" fill="url(#satin-v)" />
        <path d="M54 66 L72 72 L72 77 L54 74 Z" fill={color} />
        <rect x="66" y="66" width="13" height="5" rx="1.5" fill="#3b3b3b" />
        <path d="M22 106 L26 62 C28 54 52 54 54 62 L58 106 Z" fill="none" stroke="#2a211a" strokeOpacity=".4" strokeWidth="1" strokeDasharray="2 1.5" />
      </g>
    </svg>
  )
}

export default function Duel() {
  const { byId } = useHouse()
  const { meId } = useMe()
  const [players, setPlayers] = useState<string[]>(meId ? [meId] : [])
  const [playing, setPlaying] = useState(false)
  const [score, setScore] = useState<[number, number]>([0, 0])

  if (!playing)
    return (
      <GameShell icon="duel" title="Cowboy-duel" intro="Leg de telefoon plat tussen jullie in. Wacht op VUUR! en tik dan zo snel mogelijk op jouw kant. Te vroeg? Misfire, verloren.">
        <section className="card">
          <h2 className="card-title">Kies twee cowboys</h2>
          <PlayerSelect value={players} onChange={setPlayers} max={2} />
        </section>
        <button className="btn primary big-btn" disabled={players.length !== 2} onClick={() => (setScore([0, 0]), setPlaying(true))}>
          Naar de saloon
        </button>
      </GameShell>
    )

  return <Arena a={byId.get(players[0])!.id} b={byId.get(players[1])!.id} score={score} setScore={setScore} onExit={() => setPlaying(false)} />
}

function Arena({
  a,
  b,
  score,
  setScore,
  onExit,
}: {
  a: string
  b: string
  score: [number, number]
  setScore: (s: [number, number]) => void
  onExit: () => void
}) {
  const { byId } = useHouse()
  const pa = byId.get(a)!
  const pb = byId.get(b)!
  const [phase, setPhase] = useState<Phase>('ready')
  const [ready, setReady] = useState<[boolean, boolean]>([false, false])
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const fireAt = useRef(0)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Zodra beide cowboys klaar zijn: spanning opbouwen
  useEffect(() => {
    if (phase !== 'ready' || !ready[0] || !ready[1]) return
    setPhase('wait')
    timer.current = window.setTimeout(() => {
      fireAt.current = performance.now()
      setPhase('fire')
      navigator.vibrate?.(80)
    }, 1800 + Math.random() * 3800)
  }, [ready, phase])

  function finish(o: Outcome) {
    window.clearTimeout(timer.current)
    setOutcome(o)
    setPhase('done')
    const winnerId = o.winner === 0 ? a : b
    const next: [number, number] = [...score] as [number, number]
    next[o.winner]++
    setScore(next)
    fireConfetti()
    insert('game_results', { game: 'Duel', winner_id: winnerId })
    if (o.ms !== null) insert('game_events', { kind: 'duel_win_ms', housemate_id: winnerId, value: Math.round(o.ms) })
    if (o.misfire !== null) insert('game_events', { kind: 'duel_misfire', housemate_id: o.misfire === 0 ? a : b, value: null })
  }

  function tap(side: 0 | 1) {
    if (phase === 'ready') {
      setReady((r) => (side === 0 ? [true, r[1]] : [r[0], true]))
      return
    }
    if (phase === 'wait') {
      navigator.vibrate?.([100, 50, 100])
      finish({ winner: side === 0 ? 1 : 0, ms: null, misfire: side })
      return
    }
    if (phase === 'fire') finish({ winner: side, ms: performance.now() - fireAt.current, misfire: null })
  }

  function again() {
    setOutcome(null)
    setReady([false, false])
    setPhase('ready')
  }

  const half = (side: 0 | 1) => {
    const p = side === 0 ? pa : pb
    const isReady = ready[side]
    const won = outcome?.winner === side
    const lost = outcome && outcome.winner !== side
    let label = isReady ? 'Klaar. Wacht…' : 'Tik als je klaar bent'
    if (phase === 'wait') label = 'Niet bewegen…'
    if (phase === 'fire') label = 'VUUR!'
    if (phase === 'done') label = won ? (outcome?.ms ? `Raak! ${Math.round(outcome.ms)} ms` : 'Gewonnen, de ander schoot te vroeg') : outcome?.misfire === side ? 'Misfire! Te vroeg.' : 'Te laat, cowboy.'
    return (
      <button
        className={`duel-half side-${side} ${phase} ${won ? 'won' : ''} ${lost ? 'lost' : ''}`}
        style={{ ['--c' as string]: p.color }}
        onPointerDown={(e) => {
          e.preventDefault()
          tap(side)
        }}
      >
        <span className="duel-inner">
          <Cowboy color={p.color} shot={!!lost} />
          <span className="duel-name">
            {p.name} <b>{score[side]}</b>
          </span>
          <span className="duel-label">{label}</span>
        </span>
      </button>
    )
  }

  return (
    <div className={`duel ${phase}`}>
      {half(1)}
      <div className="duel-sign">
        {phase === 'fire' ? (
          <span className="duel-fire">VUUR!</span>
        ) : phase === 'wait' ? (
          <span className="tumble" aria-hidden>
            <svg viewBox="0 0 40 40" width="36" height="36">
              <circle cx="20" cy="20" r="15" fill="none" stroke="#a37c4b" strokeWidth="2" strokeDasharray="5 3" />
              <path d="M8 18 C16 8 30 12 32 22 C30 30 14 32 10 24 C12 16 24 14 26 22" fill="none" stroke="#8a6334" strokeWidth="2" />
            </svg>
          </span>
        ) : phase === 'done' ? (
          <span className="duel-actions">
            <button className="btn primary small" onClick={again}>
              Nog een duel
            </button>
            <button className="btn ghost small" onClick={onExit}>
              Stoppen
            </button>
          </span>
        ) : (
          <span className="duel-title">High Noon</span>
        )}
      </div>
      {half(0)}
    </div>
  )
}

export function DuelPreview() {
  return (
    <Kast>
      <Cowboy color="#3a7be0" />
    </Kast>
  )
}
