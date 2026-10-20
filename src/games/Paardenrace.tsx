import { useEffect, useRef, useState } from 'react'
import { insert } from '../lib/db'
import { useHouse } from '../lib/house'
import { Avatar } from '../components/decor'
import { fireConfetti } from '../components/Achievements'
import { GameShell, Kast, Uitslag } from '../components/game'
import Horse, { type Coat } from './Horse'

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
const COATS: Record<Suit, Coat> = {
  S: { body: '#3a2b22', dark: '#1d1510', mane: '#120d09' },
  H: { body: '#a4552d', dark: '#6b3417', mane: '#4a2410' },
  D: { body: '#c8a06a', dark: '#8a6a3c', mane: '#f1e7d2' },
  C: { body: '#d9d5cd', dark: '#9b958a', mane: '#8b857a' },
}
const CLOTH: Record<Suit, string> = { S: '#3a7be0', H: '#db3b47', D: '#ee7432', C: '#2fa463' }
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
  moved: Suit | null
  setback: Suit | null
  tick: number
}

function newRace(): Race {
  const deck = shuffled()
  const hurdles = deck.splice(0, HURDLES)
  return { deck, discard: [], hurdles, flipped: 0, pos: { S: 0, H: 0, D: 0, C: 0 }, current: null, message: 'Trek de eerste kaart', winner: null, moved: null, setback: null, tick: 0 }
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
    return { ...r, deck, discard, pos, current: card, winner: card.suit, message: `${NAME[card.suit]} wint!`, moved: card.suit, setback: null, tick: r.tick + 1 }
  }
  let flipped = r.flipped
  let setback: Suit | null = null
  // Zodra alle paarden een hindernis voorbij zijn, gaat die kaart open
  while (flipped < HURDLES && Math.min(...SUITS.map((s) => pos[s])) >= flipped + 1) {
    const h = r.hurdles[flipped]
    pos[h.suit] = Math.max(0, pos[h.suit] - 1)
    setback = h.suit
    message = `Hindernis ${flipped + 1}: ${NAME[h.suit]} moet een stap terug!`
    flipped++
  }
  return { ...r, deck, discard, pos, flipped, current: card, message, moved: card.suit, setback, tick: r.tick + 1 }
}

/** Finishboog: twee paaltjes met een geblokt doek en lampjes. */
function FinishBanner() {
  const squares = []
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 0) squares.push(<rect key={`${r}${c}`} x={6 + c * 5} y={6 + r * 5} width="5" height="5" fill="#1a1612" />)
  return (
    <svg viewBox="0 0 52 44" className="finish-banner" aria-label="Finish">
      <rect x="3" y="4" width="3" height="40" rx="1.5" fill="#fff" stroke="#8a6334" strokeWidth=".8" />
      <rect x="46" y="4" width="3" height="40" rx="1.5" fill="#fff" stroke="#8a6334" strokeWidth=".8" />
      <rect x="6" y="6" width="40" height="15" fill="#fff" />
      {squares}
      <rect x="6" y="6" width="40" height="15" fill="none" stroke="#db3b47" strokeWidth="1.2" strokeDasharray="2 1.4" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} className="finish-bulb" cx={8 + i * 7.2} cy="3" r="1.8" fill={['#f2b51f', '#e0468f', '#3a7be0', '#2fa463', '#ee7432', '#db3b47'][i]} style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
    </svg>
  )
}

export default function Paardenrace() {
  const { active, byId } = useHouse()
  const [bets, setBets] = useState<Record<string, Bet>>({})
  const [race, setRace] = useState<Race | null>(null)
  const [auto, setAuto] = useState(false)
  const [anim, setAnim] = useState<{ moved: Suit | null; setback: Suit | null; tick: number }>({ moved: null, setback: null, tick: 0 })
  const logged = useRef(false)

  const players = Object.entries(bets)

  useEffect(() => {
    if (!auto || !race || race.winner) return
    const t = setTimeout(() => setRace((r) => (r ? step(r) : r)), 1100)
    return () => clearTimeout(t)
  }, [auto, race])

  // Galop-animatie voor het paard dat net bewoog
  useEffect(() => {
    if (!race?.tick) return
    setAnim({ moved: race.moved, setback: race.setback, tick: race.tick })
    const t = setTimeout(() => setAnim((a) => (a.tick === race.tick ? { moved: null, setback: null, tick: a.tick } : a)), 750)
    if (race.setback) navigator.vibrate?.(60)
    return () => clearTimeout(t)
  }, [race?.tick])

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
      <GameShell icon="paard" title="Paardenrace" intro="Kies per speler een paard en zet slokken in. Winnaars delen hun slokken uit, verliezers drinken ze.">
        <Kast className="stal">
          {SUITS.map((s) => (
            <div key={s} className="stal-horse">
              <Horse coat={COATS[s]} cloth={CLOTH[s]} symbol={SYMBOL[s]} width={78} />
              <span>{NAME[s]}</span>
            </div>
          ))}
        </Kast>
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
                        className={`suit-btn ${b?.suit === s ? 'on' : ''}`}
                        style={{ ['--c' as string]: CLOTH[s] }}
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
      </GameShell>
    )

  const lines = race.winner
    ? [
        ...players
          .filter(([, b]) => b.suit === race.winner)
          .map(([id, b]) => ({ id, name: byId.get(id)?.name ?? '?', text: `deelt ${b.slokken} ${b.slokken === 1 ? 'slok' : 'slokken'} uit`, kind: 'win' as const })),
        ...players
          .filter(([, b]) => b.suit !== race.winner)
          .map(([id, b]) => ({ id, name: byId.get(id)?.name ?? '?', text: `drinkt ${b.slokken} ${b.slokken === 1 ? 'slok' : 'slokken'}`, kind: 'drink' as const })),
      ]
    : []

  return (
    <GameShell icon="paard" title="Paardenrace">
      <div className="game-topbar">
        <button className="link small" onClick={() => (setRace(null), setAuto(false))}>
          ← Inzetten
        </button>
        <span className="meta">{race.deck.length} kaarten over</span>
      </div>

      <Kast className="race">
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
                  {col === FINISH && <FinishBanner />}
                </span>
              )
            })}
          </div>
          {SUITS.map((s) => (
            <div key={s} className={`lane ${race.winner === s ? 'won' : ''}`}>
              <span className="lane-label" style={{ background: CLOTH[s] }}>
                {SYMBOL[s]}
              </span>
              {Array.from({ length: FINISH + 1 }, (_, col) => (
                <span key={col} className={`cell ${col === FINISH ? 'finish' : ''} ${col >= 1 && col <= HURDLES ? 'fence' : ''}`} />
              ))}
              <span className="horse" style={{ ['--pos' as string]: race.pos[s] }}>
                <Horse
                  coat={COATS[s]}
                  cloth={CLOTH[s]}
                  symbol={SYMBOL[s]}
                  running={anim.moved === s || (race.winner === s)}
                  stumble={anim.setback === s}
                  width={62}
                />
              </span>
            </div>
          ))}
        </div>
        <p className="race-msg" aria-live="polite">
          {race.message}
        </p>
      </Kast>

      {!race.winner ? (
        <div className="race-controls">
          {race.current ? (
            <span key={race.tick} className={`pcard big flip ${RED(race.current.suit) ? 'red' : ''}`}>
              {RANK(race.current.rank)}
              <b>{SYMBOL[race.current.suit]}</b>
            </span>
          ) : (
            <span className="pcard big back" />
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
        <Uitslag
          title={
            <>
              <span style={{ color: CLOTH[race.winner] }}>{SYMBOL[race.winner]}</span> {NAME[race.winner]} wint!
            </>
          }
          lines={lines}
        >
          <button className="btn primary" onClick={start}>
            Nog een ronde
          </button>
          <button className="btn ghost" onClick={() => setRace(null)}>
            Inzetten wijzigen
          </button>
        </Uitslag>
      )}
    </GameShell>
  )
}
