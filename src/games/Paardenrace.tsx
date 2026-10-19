import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { insert } from '../lib/db'
import { useHouse } from '../lib/house'
import { Avatar } from '../components/decor'
import { fireConfetti } from '../components/Achievements'

type Suit = 'S' | 'H' | 'D' | 'C'
interface Card {
  rank: number // 2 t/m 13 (azen zijn de paarden)
  suit: Suit
}
interface Bet {
  suit: Suit
  slokken: number
}

const SUITS: Suit[] = ['S', 'H', 'D', 'C']
const SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
const NAME: Record<Suit, string> = { S: 'Schoppen', H: 'Harten', D: 'Ruiten', C: 'Klaveren' }
const RED = (s: Suit) => s === 'H' || s === 'D'
const RANK = (r: number) => ({ 11: 'B', 12: 'V', 13: 'H' })[r] ?? String(r)
const HURDLES = 6
const FINISH = HURDLES + 1

function shuffled(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) for (let r = 2; r <= 13; r++) deck.push({ rank: r, suit })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

interface Race {
  deck: Card[]
  discard: Card[]
  hurdles: Card[]
  flipped: number
  pos: Record<Suit, number>
  current: Card | null
  message: string
  winner: Suit | null
}

function newRace(): Race {
  const deck = shuffled()
  const hurdles = deck.splice(0, HURDLES)
  return { deck, discard: [], hurdles, flipped: 0, pos: { S: 0, H: 0, D: 0, C: 0 }, current: null, message: 'Trek de eerste kaart', winner: null }
}

function step(r: Race): Race {
  if (r.winner) return r
  let deck = [...r.deck]
  let discard = [...r.discard]
  if (deck.length === 0) {
    deck = discard.sort(() => Math.random() - 0.5)
    discard = []
  }
  const card = deck.pop()!
  discard.push(card)
  const pos = { ...r.pos, [card.suit]: r.pos[card.suit] + 1 }
  let message = `${NAME[card.suit]} gaat vooruit`
  if (pos[card.suit] >= FINISH) {
    return { ...r, deck, discard, pos, current: card, winner: card.suit, message: `${NAME[card.suit]} wint!` }
  }
  let flipped = r.flipped
  // Zodra alle paarden een hindernis voorbij zijn, gaat die kaart open
  while (flipped < HURDLES && Math.min(...SUITS.map((s) => pos[s])) >= flipped + 1) {
    const h = r.hurdles[flipped]
    pos[h.suit] = Math.max(0, pos[h.suit] - 1)
    message = `Hindernis ${flipped + 1}: ${NAME[h.suit]} moet een stap terug!`
    flipped++
  }
  return { ...r, deck, discard, pos, flipped, current: card, message }
}

export default function Paardenrace() {
  const { active, byId } = useHouse()
  const [bets, setBets] = useState<Record<string, Bet>>({})
  const [race, setRace] = useState<Race | null>(null)
  const [auto, setAuto] = useState(false)
  const logged = useRef(false)

  const players = Object.entries(bets)

  useEffect(() => {
    if (!auto || !race || race.winner) return
    const t = setTimeout(() => setRace((r) => (r ? step(r) : r)), 950)
    return () => clearTimeout(t)
  }, [auto, race])

  useEffect(() => {
    if (!race?.winner || logged.current) return
    logged.current = true
    setAuto(false)
    fireConfetti()
    navigator.vibrate?.([40, 60, 40])
    for (const [id, b] of players) if (b.suit === race.winner) insert('game_results', { game: 'Paardenrace', winner_id: id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [race?.winner])

  function start() {
    logged.current = false
    setRace(newRace())
  }

  const toggleSuit = (id: string, suit: Suit) =>
    setBets((b) => {
      const cur = b[id]
      if (cur?.suit === suit) {
        const rest = { ...b }
        delete rest[id]
        return rest
      }
      return { ...b, [id]: { suit, slokken: cur?.slokken ?? 2 } }
    })
  const setSlokken = (id: string, d: number) =>
    setBets((b) => ({ ...b, [id]: { ...b[id], slokken: Math.min(20, Math.max(1, b[id].slokken + d)) } }))

  if (!race)
    return (
      <div className="page">
        <Link to="/spellen" className="link small">
          ← Spellen
        </Link>
        <header className="game-head">
          <h1>🏇 Paardenrace</h1>
          <p className="muted">Kies per speler een paard en hoeveel slokken je inzet. Winnaars delen hun slokken uit, verliezers drinken ze.</p>
        </header>
        <section className="card">
          <h2 className="card-title">Inzetten</h2>
          <ul className="list">
            {active.map((h) => {
              const b = bets[h.id]
              return (
                <li key={h.id} className="row bet-row">
                  <Avatar name={h.name} color={h.color} size={26} />
                  <span className="bet-name">{h.name}</span>
                  <span className="suit-picks">
                    {SUITS.map((s) => (
                      <button
                        key={s}
                        className={`suit-btn ${RED(s) ? 'red' : ''} ${b?.suit === s ? 'on' : ''}`}
                        onClick={() => toggleSuit(h.id, s)}
                        aria-label={`${h.name} op ${NAME[s]}`}
                      >
                        {SYMBOL[s]}
                      </button>
                    ))}
                  </span>
                  {b && (
                    <span className="stepper">
                      <button onClick={() => setSlokken(h.id, -1)} aria-label="Minder slokken">
                        −
                      </button>
                      <b>{b.slokken}</b>
                      <button onClick={() => setSlokken(h.id, 1)} aria-label="Meer slokken">
                        +
                      </button>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
          <button className="btn primary" disabled={players.length === 0} onClick={start}>
            Start de race ({players.length} {players.length === 1 ? 'speler' : 'spelers'})
          </button>
        </section>
      </div>
    )

  const winners = race.winner ? players.filter(([, b]) => b.suit === race.winner) : []
  const losers = race.winner ? players.filter(([, b]) => b.suit !== race.winner) : []

  return (
    <div className="page">
      <div className="game-topbar">
        <button className="link small" onClick={() => (setRace(null), setAuto(false))}>
          ← Inzetten
        </button>
        <span className="meta">{race.deck.length} kaarten over</span>
      </div>

      <section className="card race">
        <div className="track">
          <div className="lane hurdles">
            <span className="lane-label" />
            {Array.from({ length: FINISH + 1 }, (_, col) => {
              const h = col >= 1 && col <= HURDLES ? race.hurdles[col - 1] : null
              const open = h && col - 1 < race.flipped
              return (
                <span key={col} className="cell">
                  {h &&
                    (open ? (
                      <span className={`pcard small ${RED(h.suit) ? 'red' : ''}`}>
                        {RANK(h.rank)}
                        {SYMBOL[h.suit]}
                      </span>
                    ) : (
                      <span className="pcard small back" />
                    ))}
                  {col === FINISH && <span className="finish-flag">🏁</span>}
                </span>
              )
            })}
          </div>
          {SUITS.map((s) => (
            <div key={s} className={`lane ${race.winner === s ? 'won' : ''}`}>
              <span className={`lane-label ${RED(s) ? 'red' : ''}`}>{SYMBOL[s]}</span>
              {Array.from({ length: FINISH + 1 }, (_, col) => (
                <span key={col} className={`cell ${col === FINISH ? 'finish' : ''}`} />
              ))}
              <span className="horse" style={{ ['--pos' as string]: race.pos[s] }}>
                <span className={`pcard ${RED(s) ? 'red' : ''}`}>A{SYMBOL[s]}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="race-msg" aria-live="polite">
          {race.message}
        </p>
      </section>

      {!race.winner ? (
        <div className="race-controls">
          {race.current && (
            <span key={race.discard.length} className={`pcard big flip ${RED(race.current.suit) ? 'red' : ''}`}>
              {RANK(race.current.rank)}
              <b>{SYMBOL[race.current.suit]}</b>
            </span>
          )}
          <div className="race-buttons">
            <button className="btn primary big-btn" onClick={() => setRace((r) => (r ? step(r) : r))} disabled={auto}>
              Trek kaart
            </button>
            <button className={`btn small ${auto ? 'armed' : 'ghost'}`} onClick={() => setAuto((a) => !a)}>
              {auto ? '⏸ Pauze' : '▶ Automatisch'}
            </button>
          </div>
        </div>
      ) : (
        <section className="card race-result">
          <h2 className="result-title">
            <span className={RED(race.winner) ? 'red' : ''}>{SYMBOL[race.winner]}</span> {NAME[race.winner]} wint!
          </h2>
          {winners.length > 0 && (
            <div>
              <p className="card-title">Mogen uitdelen</p>
              {winners.map(([id, b]) => (
                <p key={id} className="result-line">
                  <b>{byId.get(id)?.name}</b> deelt {b.slokken} {b.slokken === 1 ? 'slok' : 'slokken'} uit
                </p>
              ))}
            </div>
          )}
          {losers.length > 0 && (
            <div>
              <p className="card-title">Drinken</p>
              {losers.map(([id, b]) => (
                <p key={id} className="result-line">
                  <b>{byId.get(id)?.name}</b> drinkt {b.slokken} {b.slokken === 1 ? 'slok' : 'slokken'}
                </p>
              ))}
            </div>
          )}
          {winners.length > 0 && <p className="hint">Winnaars staan bijgeschreven bij Spellen en tellen mee voor de prijzenkast.</p>}
          <div className="race-buttons">
            <button className="btn primary" onClick={start}>
              Nog een ronde
            </button>
            <button className="btn ghost" onClick={() => setRace(null)}>
              Inzetten wijzigen
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
