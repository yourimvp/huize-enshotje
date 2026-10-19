import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { insert, remove } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { weekStart } from '../lib/format'
import { GlassStrip } from '../components/decor'
import { ConfirmButton, Empty, PlusIcon } from '../components/ui'
import { AddItem, OpenItems } from '../components/Shopping'
import type { DrinkTally, DrinkType, Quote } from '../lib/types'

export default function Home() {
  const { active } = useHouse()
  const shopping = useTable('shopping_items').rows
  const openItems = shopping.filter((s) => !s.checked)

  return (
    <div className="page home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Huize <em>Enshotje</em>
          </h1>
          <p className="muted">{active.length > 0 ? `${active.length} huisgenoten · één koelkast` : 'Voeg eerst de huisgenoten toe bij Huis, rechtsboven.'}</p>
        </div>
        <img src={`${import.meta.env.BASE_URL}huis.webp`} alt="De huisgenoten van Huize Enshotje" className="hero-img" />
        <GlassStrip cells={90} size={11} />
      </section>

      <div className="home-grid">
        <section className="card">
          <div className="card-head">
            <h2 className="card-title">
              <span className="dot" style={{ background: 'var(--g-green)', color: 'var(--g-green)' }} /> Boodschappen
            </h2>
            <Link to="/boodschappen" className="link small">
              Alles →
            </Link>
          </div>
          <AddItem />
          <OpenItems items={openItems} limit={6} compact />
        </section>
        <QuoteCard />
      </div>

      <ZuipOverzicht />
    </div>
  )
}

function verdict(total: number, people: number) {
  const avg = people ? total / people : total
  if (total === 0) return 'Nog droog deze week. Wie trapt af?'
  if (avg < 2) return `Beetje doordrinken, er is deze week nog maar ${total} ${total === 1 ? 'drankje' : 'drankjes'} gedronken.`
  if (avg < 5) return `Rustig weekje: ${total} drankjes tot nu toe.`
  if (avg < 9) return `Het is een goede week: al ${total} drankjes gedronken.`
  return `Legendarische week. ${total} drankjes, de krat huilt.`
}

const DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function ZuipOverzicht() {
  const { active, byId } = useHouse()
  const thisWeek = weekStart(new Date())
  const lastWeek = new Date(thisWeek.getTime() - 7 * 86400_000)
  const tallies = useTable('drink_tallies', { since: lastWeek.toISOString() }).rows
  const types = useTable('drink_types').rows

  const s = useMemo(() => stats(tallies, types, thisWeek), [tallies, types, thisWeek])
  const king = s.top ? byId.get(s.top[0]) : undefined
  const today = (new Date().getDay() + 6) % 7
  const maxDay = Math.max(1, ...s.days)
  const diff = s.total - s.prev

  return (
    <Link to="/turf" className="card zuip">
      <div className="zuip-main">
        <h2 className="card-title">
          <span className="dot" style={{ background: 'var(--g-orange)', color: 'var(--g-orange)' }} /> Zuipoverzicht · deze week
        </h2>
        <p className="zuip-num">{s.total}</p>
        <p className="zuip-verdict">{verdict(s.total, active.length)}</p>
        <p className="meta">
          Vorige week {s.prev}
          {s.prev > 0 && ` · ${diff >= 0 ? '+' : ''}${diff}`}
          {king && ` · koning van de week: ${king.name} (${s.top![1]})`}
        </p>
        {s.byType.length > 0 && (
          <div className="type-pills">
            {s.byType.map(([name, n]) => (
              <span key={name} className="pill">
                {name} <b>{n}</b>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="week-bars" aria-label="Drankjes per dag">
        {s.days.map((n, i) => (
          <div key={i} className={`wb ${i === today ? 'today' : ''} ${i > today ? 'future' : ''}`}>
            <span className="wb-n">{n || ''}</span>
            <span className="wb-bar" style={{ height: `${(n / maxDay) * 100}%` }} />
            <span className="wb-d">{DAYS[i]}</span>
          </div>
        ))}
      </div>
    </Link>
  )
}

function stats(tallies: DrinkTally[], types: DrinkType[], week: Date) {
  const wk = week.toISOString()
  const days = [0, 0, 0, 0, 0, 0, 0]
  const per = new Map<string, number>()
  const typeCount = new Map<string, number>()
  let total = 0
  let prev = 0
  for (const t of tallies) {
    if (t.created_at < wk) {
      prev += t.count
      continue
    }
    total += t.count
    days[(new Date(t.created_at).getDay() + 6) % 7] += t.count
    per.set(t.housemate_id, (per.get(t.housemate_id) ?? 0) + t.count)
    const name = types.find((x) => x.id === t.drink_type_id)?.name ?? 'Overig'
    typeCount.set(name, (typeCount.get(name) ?? 0) + t.count)
  }
  const top = [...per.entries()].sort((a, b) => b[1] - a[1])[0]
  const byType = [...typeCount.entries()].sort((a, b) => b[1] - a[1])
  return { total, prev, days, top, byType }
}

/** Weeknummer sinds een vast punt, zodat iedereen dezelfde quote ziet. */
function weekIndex(d = new Date()) {
  return Math.floor((weekStart(d).getTime() - new Date(2024, 0, 1).getTime()) / (7 * 86400_000))
}

function QuoteCard() {
  const { rows } = useTable('quotes')
  const { active, byId } = useHouse()
  const [adding, setAdding] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [offset, setOffset] = useState(0)
  const [text, setText] = useState('')
  const [who, setWho] = useState('')
  const [context, setContext] = useState('')

  // Vaste volgorde (oudste eerst); elke week schuift hij er één op
  const pool = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const idx = pool.length ? (((weekIndex() + offset) % pool.length) + pool.length) % pool.length : 0
  const current = pool[idx]
  const nameOf = (q: Quote) => q.said_by_name || (q.said_by ? byId.get(q.said_by)?.name : null) || 'onbekend'

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    await insert('quotes', {
      text: text.trim().replace(/^["“”'‘’]+|["“”'‘’]+$/g, ''),
      said_by: null,
      said_by_name: who.trim() || null,
      context: context.trim() || null,
    })
    setText('')
    setWho('')
    setContext('')
    setAdding(false)
  }

  return (
    <section className="card quote-card">
      <div className="card-head">
        <h2 className="card-title">
          <span className="dot" style={{ background: 'var(--g-magenta)', color: 'var(--g-magenta)' }} /> Quote van de week
        </h2>
        <button className="link small" onClick={() => setAdding((a) => !a)}>
          {adding ? 'Annuleer' : '+ Quote'}
        </button>
      </div>

      {adding && (
        <form className="form quote-form" onSubmit={add}>
          <input placeholder="Wat werd er gezegd?" value={text} onChange={(e) => setText(e.target.value)} autoFocus aria-label="Quote" />
          <div className="field-row">
            <input placeholder="Wie zei het?" value={who} onChange={(e) => setWho(e.target.value)} list="quote-names" aria-label="Wie zei het" />
            <input placeholder="Context (optioneel)" value={context} onChange={(e) => setContext(e.target.value)} aria-label="Context" />
          </div>
          <datalist id="quote-names">
            {active.map((h) => (
              <option key={h.id} value={h.name} />
            ))}
          </datalist>
          <button className="btn primary" disabled={!text.trim()}>
            <PlusIcon /> Quote toevoegen
          </button>
        </form>
      )}

      {current ? (
        <figure className="quote">
          <blockquote>{current.text}</blockquote>
          <figcaption>
            — {nameOf(current)}
            {current.context && <span className="q-context">, {current.context}</span>}
          </figcaption>
        </figure>
      ) : (
        !adding && <Empty>Nog geen quote. Iemand zegt vast snel iets doms.</Empty>
      )}

      {pool.length > 1 && (
        <div className="quote-foot">
          <button className="link small" onClick={() => setShowAll((s) => !s)}>
            {showAll ? '▾' : '▸'} Alle quotes ({pool.length})
          </button>
          <button className="btn ghost small" onClick={() => setOffset((o) => o + 1)} aria-label="Andere quote">
            ↻ Andere
          </button>
        </div>
      )}
      {showAll && (
        <ul className="list">
          {[...pool].reverse().map((q) => (
            <li key={q.id} className="row">
              <div className="row-main">
                <strong className="q-old">“{q.text}”</strong>
                <span className="meta">
                  {nameOf(q)}
                  {q.context ? `, ${q.context}` : ''} · {new Date(q.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <ConfirmButton onConfirm={() => remove('quotes', q.id)}>×</ConfirmButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
