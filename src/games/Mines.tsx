import { useMemo, useState } from 'react'
import { insert } from '../lib/db'
import { useHouse } from '../lib/house'
import { GameShell, Kast, PlayerSelect, Uitslag } from '../components/game'
import { fireConfetti } from '../components/Achievements'

type Penalty = 'bak' | 'dubbel'
interface Board {
  size: number
  bombs: Set<number>
  open: number[] // volgorde waarin vakjes zijn opengemaakt
  boom: number | null
}

const SIZES = [4, 5, 6]

/** Slokken voor het k-de veilige vakje (1-based): elke 2 vakjes eentje meer. */
const stake = (k: number) => 1 + Math.floor((k - 1) / 2)

function newBoard(size: number, bombs: number): Board {
  const cells = size * size
  const set = new Set<number>()
  while (set.size < Math.min(bombs, cells - 1)) set.add(Math.floor(Math.random() * cells))
  return { size, bombs: set, open: [], boom: null }
}

function BombIcon() {
  return (
    <svg viewBox="0 0 40 40" width="70%" height="70%" aria-hidden>
      <circle cx="18" cy="23" r="12" fill="#1a1612" />
      <rect x="24" y="8" width="7" height="6" rx="1.5" fill="#1a1612" transform="rotate(35 27 11)" />
      <path d="M29 7 C32 3 35 6 36 3" fill="none" stroke="#8a6334" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="37" cy="3" r="2.4" fill="#f2b51f" className="spark" />
      <circle cx="13" cy="18" r="3" fill="#fff" opacity=".35" />
    </svg>
  )
}

export default function Mines() {
  const { byId } = useHouse()
  const [size, setSize] = useState(5)
  const [bombs, setBombs] = useState(5)
  const [penalty, setPenalty] = useState<Penalty>('dubbel')
  const [players, setPlayers] = useState<string[]>([])
  const [board, setBoard] = useState<Board | null>(null)

  const cells = size * size
  const maxBombs = cells - 1
  const pickSize = (s: number) => {
    setSize(s)
    setBombs((b) => Math.min(b, s * s - 1, Math.max(1, Math.round(s * s * 0.2))))
  }

  if (!board)
    return (
      <GameShell icon="mines" title="Mines" intro="Om de beurt een vakje kiezen. Veilig? Dan deel je slokken uit, en dat wordt steeds meer. Bom? Dan drink jij.">
        <section className="card form">
          <h2 className="card-title">Veld</h2>
          <div className="segmented">
            {SIZES.map((s) => (
              <button key={s} className={size === s ? 'on' : ''} onClick={() => pickSize(s)}>
                {s} × {s}
              </button>
            ))}
          </div>
          <div className="field-inline">
            <span>Aantal bommen</span>
            <span className="stepper">
              <button onClick={() => setBombs((b) => Math.max(1, b - 1))} aria-label="Minder bommen">
                −
              </button>
              <b>{bombs}</b>
              <button onClick={() => setBombs((b) => Math.min(maxBombs, b + 1))} aria-label="Meer bommen">
                +
              </button>
            </span>
          </div>
          <p className="hint">
            {cells - bombs} veilige vakjes · kans op een bom bij het eerste vakje {Math.round((bombs / cells) * 100)}%
          </p>
          <h2 className="card-title">Bij een bom</h2>
          <div className="segmented">
            <button className={penalty === 'dubbel' ? 'on' : ''} onClick={() => setPenalty('dubbel')}>
              2× de inzet drinken
            </button>
            <button className={penalty === 'bak' ? 'on' : ''} onClick={() => setPenalty('bak')}>
              Bak trekken
            </button>
          </div>
          <h2 className="card-title">Spelers (optioneel, in volgorde)</h2>
          <PlayerSelect value={players} onChange={setPlayers} />
          <button className="btn primary big-btn" onClick={() => setBoard(newBoard(size, bombs))}>
            Start
          </button>
        </section>
      </GameShell>
    )

  return <Play board={board} setBoard={setBoard} penalty={penalty} players={players} byName={(id) => byId.get(id)?.name ?? '?'} onSetup={() => setBoard(null)} />
}

function Play({
  board,
  setBoard,
  penalty,
  players,
  byName,
  onSetup,
}: {
  board: Board
  setBoard: (b: Board) => void
  penalty: Penalty
  players: string[]
  byName: (id: string) => string
  onSetup: () => void
}) {
  const [last, setLast] = useState<{ cell: number; text: string } | null>(null)
  const cells = board.size * board.size
  const safeTotal = cells - board.bombs.size
  const revealed = board.open.length
  const done = board.boom !== null || revealed === safeTotal
  const turn = players.length ? players[revealed % players.length] : null
  const next = stake(revealed + 1)
  const openOrder = useMemo(() => new Map(board.open.map((c, i) => [c, i + 1])), [board.open])

  function pick(cell: number) {
    if (done || openOrder.has(cell)) return
    if (board.bombs.has(cell)) {
      navigator.vibrate?.([120, 60, 200])
      setBoard({ ...board, boom: cell })
      const who = turn ? byName(turn) : 'Jij'
      setLast({ cell, text: penalty === 'bak' ? `${who} trekt een bak!` : `${who} drinkt ${next * 2} slokken` })
      if (turn) insert('game_events', { kind: 'mine_hit', housemate_id: turn, value: next })
      return
    }
    navigator.vibrate?.(20)
    const open = [...board.open, cell]
    setBoard({ ...board, open })
    const who = turn ? byName(turn) : 'Jij'
    setLast({ cell, text: `${who} deelt ${next} ${next === 1 ? 'slok' : 'slokken'} uit` })
    if (open.length === safeTotal) {
      fireConfetti()
      if (turn) insert('game_results', { game: 'Mines', winner_id: turn })
    }
  }

  const again = () => {
    setLast(null)
    setBoard(newBoard(board.size, board.bombs.size))
  }

  return (
    <GameShell icon="mines" title="Mines">
      <div className="game-topbar">
        <button className="link small" onClick={onSetup}>
          ← Instellingen
        </button>
        <span className="meta">
          {board.bombs.size} bommen · {safeTotal - revealed} veilig over
        </span>
      </div>

      {!done && (
        <div className="mines-status">
          {turn && (
            <span>
              Aan de beurt: <b>{byName(turn)}</b>
            </span>
          )}
          <span className="mines-stake">
            Volgend vakje: <b>{next}</b> {next === 1 ? 'slok' : 'slokken'}
          </span>
        </div>
      )}

      <Kast className="mines-kast">
        <div className="mines-grid" style={{ gridTemplateColumns: `repeat(${board.size}, 1fr)` }}>
          {Array.from({ length: cells }, (_, i) => {
            const order = openOrder.get(i)
            const isBomb = board.bombs.has(i)
            const show = order !== undefined || (board.boom !== null && isBomb)
            return (
              <button
                key={i}
                className={`mine ${show ? 'open' : ''} ${show && isBomb ? 'bomb' : ''} ${board.boom === i ? 'boom' : ''} ${last?.cell === i ? 'last' : ''}`}
                onClick={() => pick(i)}
                disabled={done && !show}
                aria-label={show ? (isBomb ? 'Bom' : `${stake(order!)} slokken`) : `Vakje ${i + 1}`}
              >
                {show && (isBomb ? <BombIcon /> : <span className="mine-n">{stake(order!)}</span>)}
              </button>
            )
          })}
        </div>
      </Kast>

      {last && !done && (
        <p key={last.cell} className="mines-last">
          {last.text}
        </p>
      )}

      {done && (
        <Uitslag
          title={board.boom !== null ? 'BOEM!' : 'Veld leeg!'}
          lines={
            board.boom !== null
              ? [{ id: turn ?? undefined, name: '', text: last?.text ?? '', kind: 'drink' }]
              : [{ id: turn ?? undefined, name: '', text: `${turn ? byName(turn) : 'Jij'} pakte het laatste veilige vakje. Iedereen behalve jij drinkt!`, kind: 'win' }]
          }
        >
          <button className="btn primary" onClick={again}>
            Nieuw veld
          </button>
          <button className="btn ghost" onClick={onSetup}>
            Instellingen
          </button>
        </Uitslag>
      )}
    </GameShell>
  )
}
