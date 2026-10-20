import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { useMe } from '../lib/me'
import { ACHIEVEMENTS, GROUPS } from '../lib/achievements'
import { useStats } from '../lib/useStats'
import { Avatar, PageTitle } from '../components/decor'
import { Medal } from '../components/Achievements'

export default function AchievementsPage() {
  const { active, byId } = useHouse()
  const { meId } = useMe()
  const unlocks = useTable('achievement_unlocks').rows
  const { achievementStats: stats } = useStats()
  const [who, setWho] = useState<string | null>(meId)

  const holders = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const u of unlocks) m.set(u.key, [...(m.get(u.key) ?? []), u.housemate_id])
    return m
  }, [unlocks])
  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const u of unlocks) if (ACHIEVEMENTS.some((a) => a.key === u.key)) m.set(u.housemate_id, (m.get(u.housemate_id) ?? 0) + 1)
    return active.map((h) => ({ h, n: m.get(h.id) ?? 0 })).sort((a, b) => b.n - a.n)
  }, [unlocks, active])

  const person = who ? byId.get(who) : null
  const mine = new Set(unlocks.filter((u) => u.housemate_id === who).map((u) => u.key))
  const totalKnown = ACHIEVEMENTS.length

  return (
    <div className="page">
      <PageTitle color="var(--gold)" sub={person ? `${person.name}: ${mine.size} van ${totalKnown}` : `${unlocks.length} behaald in huis`}>
        Achievements
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
      {person && (
        <Link to={`/profiel/${person.id}`} className="link small">
          Naar het profiel van {person.name} →
        </Link>
      )}

      {GROUPS.map((g) => (
        <section key={g} className="card">
          <h2 className="card-title">{g}</h2>
          <div className="ach-grid">
            {ACHIEVEMENTS.filter((a) => a.group === g).map((a) => {
              const hs = holders.get(a.key) ?? []
              const has = person ? mine.has(a.key) : hs.length > 0
              // Geheim zolang niemand in huis hem heeft
              const hidden = !!a.secret && hs.length === 0
              const s = person ? stats.get(person.id) : null
              const progress = s ? Math.min(a.value(s), a.target) : 0
              return (
                <div key={a.key} className={`ach ${has ? 'has' : ''} ${hidden ? 'secret' : ''}`}>
                  <Medal a={a} size={58} locked={!has} hidden={hidden} />
                  <div className="ach-body">
                    <strong>{hidden ? '???' : a.title}</strong>
                    <span className="meta">{hidden ? 'Geheime achievement. Wie vindt hem als eerste?' : a.desc}</span>
                    {!hidden &&
                      (person ? (
                        !has &&
                        a.target > 1 && (
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
                      ))}
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
