import { useMemo, useState } from 'react'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { ACHIEVEMENTS, computeStats } from '../lib/achievements'
import { Avatar, PageTitle } from '../components/decor'
import { Medal } from '../components/Achievements'

const GROUPS = ['Los', 'Streaks', 'Spelletjes', 'Winstreak', 'Boodschappen']

export default function Prijzenkast() {
  const { active, housemates, byId } = useHouse()
  const unlocks = useTable('achievement_unlocks').rows
  const tallies = useTable('drink_tallies').rows
  const games = useTable('game_results').rows
  const shopping = useTable('shopping_items').rows
  const [who, setWho] = useState<string | null>(null)

  const stats = useMemo(() => computeStats(housemates, tallies, games, shopping), [housemates, tallies, games, shopping])
  const holders = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const u of unlocks) m.set(u.key, [...(m.get(u.key) ?? []), u.housemate_id])
    return m
  }, [unlocks])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const u of unlocks) m.set(u.housemate_id, (m.get(u.housemate_id) ?? 0) + 1)
    return active.map((h) => ({ h, n: m.get(h.id) ?? 0 })).sort((a, b) => b.n - a.n)
  }, [unlocks, active])

  const person = who ? byId.get(who) : null
  const mine = new Set(unlocks.filter((u) => u.housemate_id === who).map((u) => u.key))

  return (
    <div className="page">
      <PageTitle color="var(--gold)" sub={`${unlocks.length} prestaties behaald in huis`}>
        Prijzenkast
      </PageTitle>

      <div className="picker">
        <button className={`chip plain ${who === null ? 'on' : ''}`} onClick={() => setWho(null)}>
          Iedereen
        </button>
        {counts.map(({ h, n }) => (
          <button key={h.id} className={`chip ${who === h.id ? 'on' : ''}`} onClick={() => setWho(h.id)}>
            <Avatar name={h.name} color={h.color} size={20} />
            {h.name} <span className="chip-count">{n}</span>
          </button>
        ))}
      </div>

      {GROUPS.map((g) => (
        <section key={g} className="card">
          <h2 className="card-title">{g}</h2>
          <div className="ach-grid">
            {ACHIEVEMENTS.filter((a) => a.group === g).map((a) => {
              const hs = holders.get(a.key) ?? []
              const has = person ? mine.has(a.key) : hs.length > 0
              const s = person ? stats.get(person.id) : null
              const progress = s ? Math.min(a.value(s), a.target) : 0
              return (
                <div key={a.key} className={`ach ${has ? 'has' : ''}`}>
                  <Medal a={a} size={58} locked={!has} />
                  <div className="ach-body">
                    <strong>{a.title}</strong>
                    <span className="meta">{a.desc}</span>
                    {person ? (
                      !has && (
                        <span className="progress" aria-label={`${progress} van ${a.target}`}>
                          <span style={{ width: `${(progress / a.target) * 100}%` }} />
                          <em>
                            {progress}/{a.target}
                          </em>
                        </span>
                      )
                    ) : hs.length > 0 ? (
                      <span className="ach-holders">
                        {hs.slice(0, 8).map((id) => {
                          const h = byId.get(id)
                          return h ? <Avatar key={id} name={h.name} color={h.color} size={20} /> : null
                        })}
                      </span>
                    ) : (
                      <span className="meta">Nog niemand</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
