import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { insert, remove } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { ago } from '../lib/format'
import { Avatar, PageTitle } from '../components/decor'
import { Lapje } from '../components/game'
import { ConfirmButton, Empty, PersonPicker, PlusIcon } from '../components/ui'

const GAMES = [
  { to: '/spellen/paardenrace', icon: '🏇', title: 'Paardenrace', desc: 'Kies een aas, zet slokken in en kijk welk paard wint.', color: '#2fa463' },
  { to: '/spellen/rad', icon: '🎡', title: 'Radjes', desc: 'Je eigen radjes: strafrad, wat eten we, wie haalt bier.', color: '#e0468f' },
  { to: '/spellen/duel', icon: '🤠', title: 'Cowboy-duel', desc: 'Wie trekt het snelst? Te vroeg is misfire.', color: '#ee7432' },
  { to: '/spellen/dobbelstenen', icon: '🎲', title: 'Dobbelstenen', desc: 'Gooien, vastzetten, opnieuw. Met Mexen-stand.', color: '#3a7be0' },
  { to: '/spellen/ei', icon: '🥚', title: 'Crack the egg', desc: 'Tik om de beurt. Wie het ei breekt, drinkt.', color: '#f2b51f' },
  { to: '/spellen/chwazi', icon: '☝️', title: 'Chwazi', desc: 'Iedereen een vinger op het scherm. Eén iemand wordt gekozen.', color: '#7a4bd1' },
]

const KNOWN = ['Paardenrace', 'Duel', 'Kingsen', 'Bussen', 'Beerpong', 'Klaverjassen', 'Mario Kart', 'FIFA', 'Mexen', 'Pesten', 'Darten']

export default function Spellen() {
  const { rows } = useTable('game_results')
  const { byId } = useHouse()
  const [game, setGame] = useState('')
  const [winner, setWinner] = useState<string | null>(null)

  const recent = useMemo(() => [...rows].reverse().slice(0, 12), [rows])
  const board = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) m.set(r.winner_id, (m.get(r.winner_id) ?? 0) + 1)
    return [...m].map(([id, n]) => ({ h: byId.get(id), n })).filter((x) => x.h).sort((a, b) => b.n - a.n).slice(0, 5)
  }, [rows, byId])
  const streak = useMemo(() => {
    const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at))
    if (!sorted.length) return null
    let n = 0
    while (n < sorted.length && sorted[n].winner_id === sorted[0].winner_id) n++
    return n >= 2 ? { h: byId.get(sorted[0].winner_id), n } : null
  }, [rows, byId])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!game.trim() || !winner) return
    await insert('game_results', { game: game.trim(), winner_id: winner })
    setWinner(null)
  }

  return (
    <div className="page">
      <PageTitle color="var(--g-green)" sub="Drankspelletjes en wie er wint">
        Spellen
      </PageTitle>

      <div className="game-grid">
        {GAMES.map((g) => (
          <Link key={g.to} to={g.to} className="card game-card" style={{ ['--c' as string]: g.color }}>
            <Lapje icon={g.icon} color={g.color} size={56} />
            <strong>{g.title}</strong>
            <span className="meta">{g.desc}</span>
          </Link>
        ))}
      </div>

      <form className="card form" onSubmit={add}>
        <h2 className="card-title">Spelletje gewonnen</h2>
        <input placeholder="Welk spel? Bijv. Kingsen" value={game} onChange={(e) => setGame(e.target.value)} list="known-games" aria-label="Spel" />
        <datalist id="known-games">
          {KNOWN.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <div className="field">
          <span>Wie won?</span>
          <PersonPicker value={winner} onChange={setWinner} label="Winnaar" />
        </div>
        <button className="btn primary" disabled={!game.trim() || !winner}>
          <PlusIcon /> Overwinning opslaan
        </button>
      </form>

      {board.length > 0 && (
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">Meeste gewonnen</h2>
            {streak?.h && (
              <span className="pill">
                🔥 {streak.h.name} wint {streak.n}× op rij
              </span>
            )}
          </div>
          <ol className="list">
            {board.map(({ h, n }, i) => (
              <li key={h!.id} className="row">
                <span className="rank">{i + 1}</span>
                <Avatar name={h!.name} color={h!.color} size={24} />
                <div className="row-main">
                  <strong>{h!.name}</strong>
                </div>
                <span className="time">{n}×</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="card">
        <h2 className="card-title">Laatste winnaars</h2>
        {recent.length === 0 ? (
          <Empty>Nog niemand gewonnen. Tijd voor een potje.</Empty>
        ) : (
          <ul className="list">
            {recent.map((r) => {
              const h = byId.get(r.winner_id)
              return (
                <li key={r.id} className="row">
                  {h && <Avatar name={h.name} color={h.color} size={24} />}
                  <div className="row-main">
                    <strong>
                      {h?.name} won {r.game}
                    </strong>
                    <span className="meta">{ago(r.created_at)}</span>
                  </div>
                  <ConfirmButton onConfirm={() => remove('game_results', r.id)}>×</ConfirmButton>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
