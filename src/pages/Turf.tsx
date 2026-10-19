import { useMemo, useState, type FormEvent } from 'react'
import { insert, remove, update } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { ago, euro, inMonth, monthLabel, monthStart, parseEuro } from '../lib/format'
import { purchaseComplete, purchasePresets, settleMonth } from '../lib/turf'
import { currentStreak, dayKey } from '../lib/days'
import { Avatar, PageTitle, TallyMarks } from '../components/decor'
import { ConfirmButton, Empty, PersonSelect, PlusIcon, Tabs, useToast } from '../components/ui'
import type { DrinkPurchase, DrinkTally, DrinkType } from '../lib/types'

type Tab = 'strepen' | 'inkoop' | 'afrekening'

export default function Turf() {
  const [tab, setTab] = useState<Tab>('strepen')
  const types = useTable('drink_types').rows
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
        <Strepen types={types.filter((t) => t.active)} tallies={tallies} />
      ) : tab === 'inkoop' ? (
        <Inkoop purchases={purchases} types={types} />
      ) : (
        <Afrekening purchases={purchases} tallies={tallies} types={types} />
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
      if (!inMonth(t.created_at, month) || t.drink_type_id !== type?.id) continue
      m.set(t.housemate_id, (m.get(t.housemate_id) ?? 0) + t.count)
    }
    return m
  }, [tallies, month, type?.id])

  const streaks = useMemo(() => {
    const days = new Map<string, Set<string>>()
    for (const t of tallies) {
      const s = days.get(t.housemate_id) ?? new Set<string>()
      s.add(dayKey(t.created_at))
      days.set(t.housemate_id, s)
    }
    return new Map([...days].map(([id, s]) => [id, currentStreak(s)]))
  }, [tallies])

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
                <span className="tt-name">
                  {h.name}
                  {(streaks.get(h.id) ?? 0) >= 2 && (
                    <span className="flame" title={`${streaks.get(h.id)} dagen achter elkaar`}>
                      🔥{streaks.get(h.id)}
                    </span>
                  )}
                </span>
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

function Inkoop({ purchases, types }: { purchases: DrinkPurchase[]; types: DrinkType[] }) {
  const { byId } = useHouse()
  const [desc, setDesc] = useState('')
  const [cost, setCost] = useState('')
  const [paidBy, setPaidBy] = useState('')
  const [typeId, setTypeId] = useState('')
  const [size, setSize] = useState(1)
  const [amount, setAmount] = useState('1')
  const [editing, setEditing] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const type = types.find((t) => t.id === typeId)
  const presets = type ? purchasePresets(type.name) : []
  const costCents = parseEuro(cost)
  const quantity = Number(amount) * size
  const valid = !!type && costCents !== null && costCents >= 0 && !!paidBy && Number.isSafeInteger(quantity) && quantity > 0 && Number.isInteger(Number(amount))

  function reset() {
    setDesc(''); setCost(''); setAmount('1'); setEditing(null); setError('')
  }

  function edit(p: DrinkPurchase) {
    setEditing(p.id); setDesc(p.description); setCost(String(p.cost_cents / 100))
    setPaidBy(p.paid_by ?? ''); setTypeId(p.drink_type_id ?? '')
    setSize(1); setAmount(String(p.quantity ?? 1)); setError('')
    document.getElementById('purchase-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true); setError('')
    try {
      const row = { description: desc.trim() || type!.name, cost_cents: costCents!, paid_by: paidBy, drink_type_id: typeId, quantity }
      if (editing) await update('drink_purchases', editing, row)
      else await insert('drink_purchases', row)
      reset()
    } catch {
      setError('Opslaan is niet gelukt. Je invoer staat er nog; probeer het opnieuw.')
    } finally { setBusy(false) }
  }

  const month = monthStart(new Date())
  const thisMonth = [...purchases].filter((p) => inMonth(p.created_at, month)).reverse()
  const olderIncomplete = purchases.filter((p) => !inMonth(p.created_at, month) && !purchaseComplete(p))
  const total = thisMonth.reduce((s, p) => s + p.cost_cents, 0)

  function purchaseRow(p: DrinkPurchase) {
    const category = types.find((t) => t.id === p.drink_type_id)
    return (
      <li key={p.id} className="row">
        <div className="row-main">
          <strong>{p.description}</strong>
          <span className="meta">{category?.name ?? 'Categorie ontbreekt'} · {p.quantity ? `${p.quantity} drankjes` : 'Aantal ontbreekt'}</span>
          <span className="meta">{p.paid_by ? byId.get(p.paid_by)?.name : 'onbekend'} · {ago(p.created_at)}</span>
        </div>
        <span className="amount">{euro(p.cost_cents)}</span>
        <button className="btn ghost small" onClick={() => edit(p)} aria-label={`Bewerk ${p.description}`}>{purchaseComplete(p) ? 'Bewerk' : 'Aanvullen'}</button>
        <ConfirmButton onConfirm={() => remove('drink_purchases', p.id)}>×</ConfirmButton>
      </li>
    )
  }

  return (
    <>
      <form id="purchase-form" className="card form" onSubmit={submit}>
        <h2 className="card-title">{editing ? 'Inkoop bewerken' : 'Inkoop toevoegen'}</h2>
        <label className="field"><span>Categorie</span>
          <select className="select" value={typeId} onChange={(e) => { setTypeId(e.target.value); setSize(1); setAmount('1') }} required>
            <option value="">Kies een categorie…</option>
            {types.filter((t) => t.active || t.id === typeId).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        {type && <>
          <div className="purchase-presets" role="group" aria-label="Verpakking">
            {presets.map((p) => <button type="button" key={p.quantity} className={`btn ghost small ${size === p.quantity ? 'selected' : ''}`} aria-pressed={size === p.quantity} onClick={() => { setSize(p.quantity); setAmount('1') }}>{p.label}</button>)}
          </div>
          <label className="field"><span>{size === 1 ? 'Aantal losse drankjes' : 'Aantal verpakkingen'}</span>
            <input type="number" min="1" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <p className="hint">{Number.isSafeInteger(quantity) && quantity > 0 ? `${quantity} drankjes in ${type.name}` : 'Vul een geldig aantal in.'}{/shot/i.test(type.name) ? ' · 1 shotje = 20 ml.' : ''}</p>
        </>}
        <input placeholder="Omschrijving (optioneel), bijv. Hertog Jan" value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Omschrijving" />
        <div className="field-row">
          <label className="field"><span>Totaalbedrag</span><input inputMode="decimal" placeholder="€ 14,99" value={cost} onChange={(e) => setCost(e.target.value)} aria-label="Totaalbedrag" required /></label>
          <label className="field"><span>Voorgeschoten door</span><PersonSelect value={paidBy} onChange={setPaidBy} placeholder="Betaald door…" label="Betaald door" /></label>
        </div>
        {error && <p role="alert" className="hint">{error}</p>}
        <button className="btn primary" disabled={!valid || busy}><PlusIcon /> {busy ? 'Opslaan…' : editing ? 'Wijziging opslaan' : 'Toevoegen'}</button>
        {editing && <button type="button" className="link" onClick={reset}>Annuleren</button>}
      </form>
      <section className="card">
        <div className="card-head"><h2 className="card-title">Deze maand</h2><span className="pill">{euro(total)}</span></div>
        {thisMonth.length === 0 ? <Empty>Nog niks ingekocht deze maand.</Empty> : <ul className="list">{thisMonth.map(purchaseRow)}</ul>}
      </section>
      {olderIncomplete.length > 0 && <section className="card">
        <h2 className="card-title">Eerdere inkopen aanvullen</h2>
        <p className="hint">Deze inkopen missen nog een categorie of aantal. Vul die aan voor een volledige afrekening.</p>
        <ul className="list">{olderIncomplete.map(purchaseRow)}</ul>
      </section>}
    </>
  )
}

const unitPrice = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(cents / 100)

function Afrekening({ purchases, tallies, types }: { purchases: DrinkPurchase[]; tallies: DrinkTally[]; types: DrinkType[] }) {
  const { housemates } = useHouse()
  const [month, setMonth] = useState(() => monthStart(new Date()))
  const [copied, setCopied] = useState(false)
  const { rows, categories, incomplete, incompletePurchases, totalDrinks, totalCost, consumedCost } = useMemo(
    () => settleMonth(month, housemates, tallies, purchases, types),
    [month, housemates, tallies, purchases, types],
  )
  const isCurrent = month.getTime() === monthStart(new Date()).getTime()
  const text = [
    `Huisdrank ${monthLabel(month)}`,
    'Categorieprijzen: alle inkopen tot en met deze maand.',
    ...categories.map((c) => `${c.type.name}: ${c.price === null ? 'nog geen inkoopprijs' : `${unitPrice(c.price)} per turf`}`),
    '',
    ...rows.map((r) => `- ${r.h.name}: ${r.drinks} turven · verbruik ${r.share === null ? 'nog onbekend' : euro(r.share)} · voorgeschoten ${euro(r.paid)}`),
    '',
    'Verbruik = per categorie het aantal turven × de gemiddelde inkoopprijs per drankje. Voorschotten staan apart.',
  ].join('\n')

  async function copy() {
    if (incomplete) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="month-nav">
        <button className="btn ghost small" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Vorige maand">←</button>
        <strong className="cap">{monthLabel(month)}</strong>
        <button className="btn ghost small" disabled={isCurrent} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Volgende maand">→</button>
      </div>
      <div className="stat-row">
        <div className="mini-stat"><span className="num-big">{euro(totalCost)}</span><span>ingekocht deze maand</span></div>
        <div className="mini-stat"><span className="num-big">{totalDrinks}</span><span>turven deze maand</span></div>
        <div className="mini-stat"><span className="num-big">{incomplete ? 'Nog aanvullen' : euro(consumedCost)}</span><span>verbruikt deze maand</span></div>
      </div>
      <section className="card">
        <h2 className="card-title">Prijs per turf</h2>
        <p className="hint">Totale inkoopprijs per categorie ÷ aantal ingekochte drankjes, over alle inkopen tot en met {monthLabel(month)}.</p>
        <ul className="list">{categories.map((c) => <li className="row" key={c.type.id}>
          <div className="row-main"><strong>{c.type.name}</strong><span className="meta">{c.quantity ? `${euro(c.cost)} ÷ ${c.quantity} drankjes` : 'Nog geen volledige inkoop'}</span></div>
          <span className="amount">{c.price === null ? '–' : unitPrice(c.price)}</span>
        </li>)}</ul>
      </section>
      {incomplete && <section className="card" role="status">
        <strong>Afrekening nog niet compleet</strong>
        <p className="hint">{incompletePurchases.length > 0 ? `${incompletePurchases.length} inkoopregel(s) missen een categorie of aantal. Vul ze aan onder Inkoop. ` : ''}Voor elke geturfde categorie is een inkoopprijs nodig. Bedragen hieronder zijn voorlopig; kopiëren kan zodra alle gegevens compleet zijn.</p>
      </section>}
      <section className="card settlement-card">
        {rows.length === 0 ? <Empty>Deze maand is er niks gestreept of gekocht.</Empty> : <table className="settle">
          <thead><tr><th>Wie</th><th className="num">Turven</th><th className="num">Verbruik</th><th className="num">Voorgeschoten</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.h.id}><td className="who-cell">{r.h.name}</td><td className="num">{r.drinks}</td><td className="num strong">{r.share === null ? 'Onbekend' : euro(r.share)}</td><td className="num">{r.paid ? euro(r.paid) : '–'}</td></tr>)}</tbody>
        </table>}
      </section>
      {rows.length > 0 && <section className="card">
        <h2 className="card-title">Overzicht kopiëren</h2>
        <p className="hint">Je betaalt je eigen verbruik. Voorgeschoten inkoop staat apart; ongebruikte voorraad wordt niet over de turven verdeeld. We ronden pas het totaal per persoon af op centen.</p>
        <pre className="export">{text}</pre>
        <button className="btn primary" disabled={incomplete} onClick={copy}>{copied ? 'Gekopieerd ✓' : 'Kopieer overzicht'}</button>
      </section>}
    </>
  )
}
