import { useMemo, useState, type FormEvent } from 'react'
import { insert, update } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { ago } from '../lib/format'
import { PageTitle } from '../components/decor'
import { ConfirmButton, Empty, PersonSelect, PlusIcon } from '../components/ui'
import type { Anytimer, Housemate } from '../lib/types'

interface Pair {
  key: string
  holder: Housemate
  debtor: Housemate
  items: Anytimer[]
}

export default function Anys() {
  const { rows } = useTable('anytimers')
  const { active, housemates, byId } = useHouse()
  const [holder, setHolder] = useState('')
  const [debtor, setDebtor] = useState('')
  const [reason, setReason] = useState('')
  const [showOld, setShowOld] = useState(false)
  const [filterHolder, setFilterHolder] = useState('')

  const open = useMemo(() => rows.filter((a) => !a.redeemed_at), [rows])
  const visibleOpen = useMemo(() => open.filter((a) => !filterHolder || a.owed_to === filterHolder), [open, filterHolder])
  const old = useMemo(
    () => rows.filter((a) => a.redeemed_at && (!filterHolder || a.owed_to === filterHolder)).sort((a, b) => b.redeemed_at!.localeCompare(a.redeemed_at!)).slice(0, 25),
    [rows, filterHolder],
  )

  // Bonnetjes: per (houder → schuldenaar), oudste eerst
  const pairs = useMemo(() => {
    const m = new Map<string, Pair>()
    for (const a of visibleOpen) {
      const h = byId.get(a.owed_to)
      const d = byId.get(a.owed_by)
      if (!h || !d) continue
      const key = `${a.owed_to}>${a.owed_by}`
      const p = m.get(key) ?? { key, holder: h, debtor: d, items: [] }
      p.items.push(a)
      m.set(key, p)
    }
    return [...m.values()].sort((a, b) => b.items.length - a.items.length || a.holder.name.localeCompare(b.holder.name))
  }, [visibleOpen, byId])

  // Stand per persoon
  const stand = useMemo(() => {
    const rowsS = active.map((h) => ({
      h,
      mag: open.filter((a) => a.owed_to === h.id).length,
      moet: open.filter((a) => a.owed_by === h.id).length,
    }))
    const max = Math.max(1, ...rowsS.map((r) => Math.max(r.mag, r.moet)))
    return { rows: rowsS.sort((a, b) => b.mag - b.moet - (a.mag - a.moet)), max }
  }, [active, open])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!holder || !debtor || holder === debtor) return
    await insert('anytimers', { owed_to: holder, owed_by: debtor, reason: reason.trim() || null })
    setReason('')
  }

  return (
    <div className="page">
      <PageTitle color="var(--g-magenta)" sub={filterHolder ? `${visibleOpen.length} open voor ${byId.get(filterHolder)?.name ?? 'deze persoon'}` : `${open.length} open in huis`}>
        Anytimers
      </PageTitle>

      <form className="card any-form" onSubmit={add}>
        <div className="any-sentence">
          <PersonSelect value={holder} onChange={(id) => (setHolder(id), id === debtor && setDebtor(''))} placeholder="Wie…" label="Wie heeft de any" />
          <span>heeft een any op</span>
          <PersonSelect value={debtor} onChange={setDebtor} placeholder="wie…" exclude={holder} label="Op wie" />
        </div>
        <div className="add-bar">
          <input placeholder="Waarvoor? (weddenschap, spelletje…)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reden" />
          <button className="plus-btn" aria-label="Any vastleggen" disabled={!holder || !debtor}>
            <PlusIcon />
          </button>
        </div>
      </form>

      <label className="field">
        <span>Filter op wie mag opeisen</span>
        <select className="select" value={filterHolder} onChange={(e) => setFilterHolder(e.target.value)} aria-label="Filter op wie mag opeisen">
          <option value="">Iedereen</option>
          {housemates
            .filter((h) => h.active || rows.some((a) => a.owed_to === h.id))
            .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
            .map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
      </label>

      {pairs.length === 0 ? (
        <section className="card">
          <Empty>{filterHolder ? `${byId.get(filterHolder)?.name ?? 'Deze persoon'} heeft geen anytimers open.` : 'Niemand heeft een any open. Verdacht braaf huis.'}</Empty>
        </section>
      ) : (
        <section className="tickets">
          {pairs.map((p) => (
            <article key={p.key} className="ticket" style={{ ['--c' as string]: p.holder.color, ['--d' as string]: p.debtor.color }}>
              <div className="ticket-stub">
                <span className="t-label">mag opeisen</span>
                <span className="t-name">{p.holder.name}</span>
              </div>
              <div className="ticket-body">
                <div className="t-top">
                  <div>
                    <span className="t-label">moet adten</span>
                    <span className="t-name">{p.debtor.name}</span>
                  </div>
                  <span className="t-count" aria-label={`${p.items.length} anys`}>
                    {p.items.length}×
                  </span>
                </div>
                <ul className="t-reasons">
                  {p.items.map((a) => (
                    <li key={a.id}>
                      {a.reason ?? 'Geen reden'} <span className="meta">· {ago(a.created_at)}</span>
                    </li>
                  ))}
                </ul>
                <ConfirmButton
                  className="btn small"
                  confirmLabel={`${p.debtor.name} heeft geadt ✓`}
                  onConfirm={() => update('anytimers', p.items[0].id, { redeemed_at: new Date().toISOString() })}
                >
                  Opgeëist
                </ConfirmButton>
              </div>
            </article>
          ))}
        </section>
      )}

      {open.length > 0 && (
        <section className="card">
          <h2 className="card-title">Stand in huis</h2>
          <div className="stand-legend">
            <span>
              <i className="sw moet" /> moet adten
            </span>
            <span>
              mag opeisen <i className="sw mag" />
            </span>
          </div>
          <ul className="stand">
            {stand.rows.map(({ h, mag, moet }) => (
              <li key={h.id}>
                <span className="bar-l">
                  {moet > 0 && <span className="bar moet" style={{ width: `${(moet / stand.max) * 100}%` }}>{moet}</span>}
                </span>
                <span className="stand-name">{h.name}</span>
                <span className="bar-r">
                  {mag > 0 && <span className="bar mag" style={{ width: `${(mag / stand.max) * 100}%` }}>{mag}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {old.length > 0 && (
        <section className="fold">
          <button className="link" onClick={() => setShowOld((s) => !s)}>
            {showOld ? '▾' : '▸'} Al opgeëist ({old.length})
          </button>
          {showOld && (
            <ul className="list card">
              {old.map((a) => (
                <li key={a.id} className="row">
                  <div className="row-main">
                    <strong>
                      {byId.get(a.owed_to)?.name} → {byId.get(a.owed_by)?.name}
                    </strong>
                    <span className="meta">
                      {a.reason ? `${a.reason} · ` : ''}opgeëist {ago(a.redeemed_at!)}
                    </span>
                  </div>
                  <button className="btn ghost small" onClick={() => update('anytimers', a.id, { redeemed_at: null })}>
                    Terugzetten
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
