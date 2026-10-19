import { useMemo, useState, type FormEvent } from 'react'
import { insert, remove } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { ago, euro, inMonth, monthLabel, monthStart, parseEuro } from '../lib/format'
import { settleMonth } from '../lib/turf'
import { Avatar, PageTitle, TallyMarks } from '../components/decor'
import { ConfirmButton, Empty, PersonSelect, PlusIcon, Tabs, useToast } from '../components/ui'
import type { DrinkPurchase, DrinkTally, DrinkType } from '../lib/types'

type Tab = 'strepen' | 'inkoop' | 'afrekening'

export default function Turf() {
  const [tab, setTab] = useState<Tab>('strepen')
  const types = useTable('drink_types').rows.filter((t) => t.active)
  const purchases = useTable('drink_purchases').rows
  const tallies = useTable('drink_tallies').rows

  return (
    <div className="page">
      <PageTitle color="var(--g-orange)" sub={<span className="cap">{monthLabel(new Date())}</span>}>
        Turflijst
      </PageTitle>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'strepen', label: 'Strepen' },
          { id: 'inkoop', label: 'Inkoop' },
          { id: 'afrekening', label: 'Afrekening' },
        ]}
      />
      {tab === 'strepen' ? (
        <Strepen types={types} tallies={tallies} />
      ) : tab === 'inkoop' ? (
        <Inkoop purchases={purchases} />
      ) : (
        <Afrekening purchases={purchases} tallies={tallies} />
      )}
    </div>
  )
}

function Strepen({ types, tallies }: { types: DrinkType[]; tallies: DrinkTally[] }) {
  const { active, byId } = useHouse()
  const [typeId, setTypeId] = useState<string | null>(null)
  const type = types.find((t) => t.id === typeId) ?? types[0]
  const toast = useToast()
  const [showLog, setShowLog] = useState(false)
  const month = monthStart(new Date())

  const perPerson = useMemo(() => {
    const m = new Map<string, number>()
    for (const t of tallies) {
      if (!inMonth(t.created_at, month)) continue
      m.set(t.housemate_id, (m.get(t.housemate_id) ?? 0) + t.count)
    }
    return m
  }, [tallies, month])

  const recent = useMemo(() => [...tallies].reverse().slice(0, 15), [tallies])
  const typeName = (id: string | null) => types.find((x) => x.id === id)?.name ?? 'drankje'

  async function streep(housemateId: string) {
    const row = await insert('drink_tallies', { drink_type_id: type?.id ?? null, housemate_id: housemateId, count: 1 })
    navigator.vibrate?.(25)
    toast.show(`+1 ${type?.name.toLowerCase() ?? 'drankje'} voor ${byId.get(housemateId)?.name}`, {
      label: 'Ongedaan',
      run: () => remove('drink_tallies', row.id),
    })
  }

  if (active.length === 0) return <Empty>Voeg eerst huisgenoten toe bij Huis.</Empty>

  return (
    <>
      {types.length > 0 && (
        <div className="segmented" role="radiogroup" aria-label="Drankje">
          {types.map((t) => (
            <button key={t.id} role="radio" aria-checked={t.id === type?.id} className={t.id === type?.id ? 'on' : ''} onClick={() => setTypeId(t.id)}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      <div className="tally-grid">
        {active.map((h) => {
          const n = perPerson.get(h.id) ?? 0
          return (
            <button key={h.id} className="tally-tile" onClick={() => streep(h.id)} style={{ ['--c' as string]: h.color }}>
              <span className="tt-head">
                <span className="tt-name">{h.name}</span>
                <span className="tt-count">{n}</span>
              </span>
              <TallyMarks n={n} max={30} />
              <span className="tt-plus" aria-hidden>
                <PlusIcon />
              </span>
            </button>
          )
        })}
      </div>
      <p className="hint center">Tik op een naam voor een streepje. Telling is van deze maand.</p>

      <section className="fold">
        <button className="link" onClick={() => setShowLog((s) => !s)}>
          {showLog ? '▾' : '▸'} Laatst gestreept
        </button>
        {showLog && (
          <ul className="list card">
            {recent.length === 0 && <Empty>Nog niks gestreept.</Empty>}
            {recent.map((t) => {
              const h = byId.get(t.housemate_id)
              return (
                <li key={t.id} className="row">
                  {h && <Avatar name={h.name} color={h.color} size={24} />}
                  <div className="row-main">
                    <strong>
                      {h?.name} · {typeName(t.drink_type_id)}
                    </strong>
                    <span className="meta">{ago(t.created_at)}</span>
                  </div>
                  <ConfirmButton onConfirm={() => remove('drink_tallies', t.id)} confirmLabel="Weghalen">
                    Oeps
                  </ConfirmButton>
                </li>
              )
            })}
          </ul>
        )}
      </section>
      {toast.node}
    </>
  )
}

function Inkoop({ purchases }: { purchases: DrinkPurchase[] }) {
  const { byId } = useHouse()
  const [desc, setDesc] = useState('')
  const [cost, setCost] = useState('')
  const [paidBy, setPaidBy] = useState('')

  const costCents = parseEuro(cost)
  const valid = desc.trim() && costCents !== null && costCents > 0 && paidBy

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    await insert('drink_purchases', { description: desc.trim(), cost_cents: costCents!, paid_by: paidBy })
    setDesc('')
    setCost('')
  }

  const month = monthStart(new Date())
  const thisMonth = [...purchases].filter((p) => inMonth(p.created_at, month)).reverse()
  const total = thisMonth.reduce((s, p) => s + p.cost_cents, 0)

  return (
    <>
      <form className="card form" onSubmit={submit}>
        <h2 className="card-title">Inkoop toevoegen</h2>
        <input placeholder="Wat? Bijv. krat Hertog Jan" value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Omschrijving" />
        <div className="field-row">
          <input inputMode="decimal" placeholder="€ 14,99" value={cost} onChange={(e) => setCost(e.target.value)} aria-label="Bedrag" />
          <PersonSelect value={paidBy} onChange={setPaidBy} placeholder="Betaald door…" label="Betaald door" />
        </div>
        <button className="btn primary" disabled={!valid}>
          <PlusIcon /> Toevoegen
        </button>
      </form>

      <section className="card">
        <div className="card-head">
          <h2 className="card-title">Deze maand</h2>
          <span className="pill">{euro(total)}</span>
        </div>
        {thisMonth.length === 0 ? (
          <Empty>Nog niks ingekocht deze maand.</Empty>
        ) : (
          <ul className="list">
            {thisMonth.map((p) => (
              <li key={p.id} className="row">
                <div className="row-main">
                  <strong>{p.description}</strong>
                  <span className="meta">
                    {p.paid_by ? byId.get(p.paid_by)?.name : 'onbekend'} · {ago(p.created_at)}
                  </span>
                </div>
                <span className="amount">{euro(p.cost_cents)}</span>
                <ConfirmButton onConfirm={() => remove('drink_purchases', p.id)}>×</ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function Afrekening({ purchases, tallies }: { purchases: DrinkPurchase[]; tallies: DrinkTally[] }) {
  const { housemates } = useHouse()
  const [month, setMonth] = useState(() => monthStart(new Date()))
  const [copied, setCopied] = useState(false)

  const { rows, totalDrinks, totalCost, perStreepje } = useMemo(
    () => settleMonth(month, housemates, tallies, purchases),
    [month, housemates, tallies, purchases],
  )
  const isCurrent = month.getTime() === monthStart(new Date()).getTime()

  const text = useMemo(() => {
    const lines = [
      `Huisdrank ${monthLabel(month)}`,
      `${euro(totalCost)} ingekocht · ${totalDrinks} streepjes · ${euro(Math.round(perStreepje))} per streepje`,
      '',
    ]
    for (const r of rows) {
      const s = r.saldo > 0 ? `krijgt ${euro(r.saldo)}` : r.saldo < 0 ? `betaalt ${euro(-r.saldo)}` : 'quitte'
      lines.push(`- ${r.h.name}: ${r.drinks} streepjes → ${s}`)
    }
    return lines.join('\n')
  }, [rows, month, totalCost, totalDrinks, perStreepje])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="month-nav">
        <button className="btn ghost small" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Vorige maand">
          ←
        </button>
        <strong className="cap">{monthLabel(month)}</strong>
        <button
          className="btn ghost small"
          disabled={isCurrent}
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          aria-label="Volgende maand"
        >
          →
        </button>
      </div>

      <div className="stat-row">
        <div className="mini-stat">
          <span className="num-big">{euro(totalCost)}</span>
          <span>ingekocht</span>
        </div>
        <div className="mini-stat">
          <span className="num-big">{totalDrinks}</span>
          <span>streepjes</span>
        </div>
        <div className="mini-stat">
          <span className="num-big">{euro(Math.round(perStreepje))}</span>
          <span>per streepje</span>
        </div>
      </div>

      <section className="card">
        {rows.length === 0 ? (
          <Empty>Deze maand is er niks gestreept of gekocht.</Empty>
        ) : (
          <table className="settle">
            <thead>
              <tr>
                <th>Wie</th>
                <th className="num">#</th>
                <th className="num">Deel</th>
                <th className="num">Betaald</th>
                <th className="num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.h.id}>
                  <td className="who-cell">{r.h.name}</td>
                  <td className="num">{r.drinks}</td>
                  <td className="num">{euro(r.share)}</td>
                  <td className="num">{r.paid ? euro(r.paid) : '–'}</td>
                  <td className={`num strong ${r.saldo < 0 ? 'neg' : r.saldo > 0 ? 'pos' : ''}`}>{euro(r.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {rows.length > 0 && (
        <section className="card">
          <h2 className="card-title">Voor WieBetaaltWat</h2>
          <p className="hint">
            Alle inkoop van de maand wordt verdeeld over alle streepjes. Negatief saldo is bijbetalen, positief krijg je terug.
          </p>
          <pre className="export">{text}</pre>
          <button className="btn primary" onClick={copy}>
            {copied ? 'Gekopieerd ✓' : 'Kopieer overzicht'}
          </button>
        </section>
      )}
    </>
  )
}
