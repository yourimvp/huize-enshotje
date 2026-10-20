import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { useMe } from '../lib/me'
import { useStats } from '../lib/useStats'
import { ACHIEVEMENTS } from '../lib/achievements'
import { currentStreak, dayKey } from '../lib/days'
import { formatMs, inMonth, monthStart } from '../lib/format'
import { Avatar, GlassStrip } from '../components/decor'
import { Medal } from '../components/Achievements'
import { ProfilePhoto } from '../components/ProfilePhoto'
import { Empty } from '../components/ui'

export default function Profiel() {
  const { id } = useParams()
  const { byId } = useHouse()
  const { meId } = useMe()
  const h = id ? byId.get(id) : undefined
  const { stats, tallies, types, quotes, games } = useStats()
  const unlocks = useTable('achievement_unlocks').rows
  const times = useTable('times').rows
  const disciplines = useTable('disciplines').rows

  const mine = useMemo(() => tallies.filter((t) => t.housemate_id === id), [tallies, id])
  const s = id ? stats.get(id) : undefined

  const extra = useMemo(() => {
    const month = monthStart(new Date())
    const thisMonth = mine.filter((t) => inMonth(t.created_at, month)).reduce((n, t) => n + t.count, 0)
    const streak = currentStreak(new Set(mine.map((t) => dayKey(t.created_at))))
    const byType = new Map<string, number>()
    for (const t of mine) if (t.drink_type_id) byType.set(t.drink_type_id, (byType.get(t.drink_type_id) ?? 0) + t.count)
    const fav = [...byType].sort((a, b) => b[1] - a[1])[0]
    const favName = fav ? types.find((x) => x.id === fav[0])?.name : null
    const bests = disciplines
      .map((d) => {
        const own = times.filter((t) => t.discipline_id === d.id && t.housemate_id === id)
        return own.length ? { d, ms: Math.min(...own.map((t) => t.ms)) } : null
      })
      .filter((x): x is { d: (typeof disciplines)[number]; ms: number } => !!x)
    const nameLc = h?.name.trim().toLowerCase()
    const myQuotes = quotes
      .filter((q) => q.said_by === id || (q.said_by_name ?? '').trim().toLowerCase() === nameLc)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    const lastWin = [...games].filter((g) => g.winner_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    return { thisMonth, streak, favName, bests, myQuotes, lastWin }
  }, [mine, types, disciplines, times, quotes, games, id, h])

  if (!h || !s) return <Empty>Dit profiel bestaat niet (meer).</Empty>

  const earned = ACHIEVEMENTS.filter((a) => unlocks.some((u) => u.housemate_id === h.id && u.key === a.key))

  return (
    <div className="page">
      <section className="card profile-head" style={{ ['--c' as string]: h.color }}>
        <Avatar name={h.name} color={h.color} size={72} />
        <div>
          <h1 className="profile-name">{h.name}</h1>
          <p className="muted">
            {h.id === meId ? (
              <>
                Dit ben jij · <Link to="/huis">instellingen</Link>
              </>
            ) : (
              'Huisgenoot'
            )}
            {extra.streak >= 2 && <span className="flame"> 🔥 {extra.streak} dagen op rij</span>}
          </p>
          {h.id === meId && <ProfilePhoto id={h.id} hasPhoto={!!h.avatar_url} />}
        </div>
        <GlassStrip cells={60} size={9} />
      </section>

      <div className="stat-grid">
        <Stat n={s.totalDrinks} label="streepjes totaal" />
        <Stat n={extra.thisMonth} label="deze maand" />
        <Stat n={s.maxPerNight} label="record op één avond" />
        <Stat n={s.bestDrinkStreak} label="langste streak (dagen)" />
        <Stat n={s.wins} label="spelletjes gewonnen" />
        <Stat n={s.quoted} label="keer gequote" />
        <Stat n={s.anysHolding} label="anys te claimen" />
        <Stat n={s.anysOwing} label="anys te doen" />
      </div>

      {(extra.favName || extra.bests.length > 0) && (
        <section className="card">
          <h2 className="card-title">Weetjes</h2>
          <ul className="list">
            {extra.favName && (
              <li className="row">
                <div className="row-main">
                  <strong>Favoriete drankje</strong>
                </div>
                <span>{extra.favName}</span>
              </li>
            )}
            {extra.bests.map(({ d, ms }) => (
              <li key={d.id} className="row">
                <div className="row-main">
                  <strong>Beste {d.name}</strong>
                </div>
                <span className="time">{formatMs(ms)} s</span>
              </li>
            ))}
            {extra.lastWin && (
              <li className="row">
                <div className="row-main">
                  <strong>Laatst gewonnen</strong>
                </div>
                <span>{extra.lastWin.game}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Achievements · {earned.length} van {ACHIEVEMENTS.length}</h2>
          <Link to="/achievements" className="link small">
            Alles →
          </Link>
        </div>
        {earned.length === 0 ? (
          <Empty>Nog geen achievements. Tijd om daar wat aan te doen.</Empty>
        ) : (
          <div className="medal-row">
            {earned.map((a) => (
              <div key={a.key} className="medal-cell" title={a.desc}>
                <Medal a={a} size={56} />
                <span>{a.title}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {extra.myQuotes.length > 0 && (
        <section className="card">
          <h2 className="card-title">Quotes van {h.name}</h2>
          <ul className="list">
            {extra.myQuotes.slice(0, 10).map((q) => (
              <li key={q.id} className="row">
                <div className="row-main">
                  <strong className="q-old">“{q.text}”</strong>
                  {q.context && <span className="meta">{q.context}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="mini-stat">
      <span className="num-big">{n}</span>
      <span>{label}</span>
    </div>
  )
}
