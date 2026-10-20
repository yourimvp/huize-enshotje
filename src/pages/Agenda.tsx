import { useMemo, useState, type FormEvent } from 'react'
import { insert, remove } from '../lib/db'
import { useTable } from '../lib/hooks'
import { localDate, addDays } from '../lib/days'
import { PageTitle } from '../components/decor'
import { ConfirmButton, Empty, PlusIcon } from '../components/ui'
import TimePicker from '../components/TimePicker'
import type { AgendaEvent } from '../lib/types'

export function dateLabel(date: string): string {
  const today = localDate(new Date())
  if (date === today) return 'Vandaag'
  if (date === addDays(today, 1)) return 'Morgen'
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function sortEvents(list: AgendaEvent[]) {
  return [...list].sort((a, b) => a.date.localeCompare(b.date) || (a.time ?? '99').localeCompare(b.time ?? '99'))
}

export default function Agenda() {
  const { rows } = useTable('events')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => localDate(new Date()))
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [showPast, setShowPast] = useState(false)

  const today = localDate(new Date())
  const upcoming = useMemo(() => sortEvents(rows.filter((e) => e.date >= today)), [rows, today])
  const past = useMemo(() => sortEvents(rows.filter((e) => e.date < today)).reverse().slice(0, 20), [rows, today])

  // Groeperen per dag
  const groups = useMemo(() => {
    const m = new Map<string, AgendaEvent[]>()
    for (const e of upcoming) m.set(e.date, [...(m.get(e.date) ?? []), e])
    return [...m]
  }, [upcoming])

  async function add(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date) return
    await insert('events', { title: title.trim(), date, time: time || null, note: note.trim() || null })
    setTitle('')
    setTime('')
    setNote('')
  }

  return (
    <div className="page">
      <PageTitle color="var(--g-red)" sub={upcoming.length ? `${upcoming.length} op de planning` : 'Niks gepland'}>
        Huisagenda
      </PageTitle>

      <form className="card form" onSubmit={add}>
        <h2 className="card-title">Iets plannen</h2>
        <input placeholder="Wat? Bijv. huisavond, borrel, schoonmaakdag" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Wat" />
        <div className="field-row">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Datum" />
          <TimePicker value={time} onChange={setTime} />
        </div>
        <input placeholder="Notitie (optioneel)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Notitie" />
        <button className="btn primary" disabled={!title.trim() || !date}>
          <PlusIcon /> In de agenda
        </button>
      </form>

      {groups.length === 0 ? (
        <section className="card">
          <Empty>De agenda is leeg. Tijd voor een huisavond?</Empty>
        </section>
      ) : (
        groups.map(([d, list]) => (
          <section key={d} className={`card agenda-day ${d === today ? 'is-today' : ''}`}>
            <h2 className="card-title cap">{dateLabel(d)}</h2>
            <ul className="list">
              {list.map((ev) => (
                <EventRow key={ev.id} ev={ev} />
              ))}
            </ul>
          </section>
        ))
      )}

      {past.length > 0 && (
        <section className="fold">
          <button className="link" onClick={() => setShowPast((s) => !s)}>
            {showPast ? '▾' : '▸'} Geweest ({past.length})
          </button>
          {showPast && (
            <ul className="list card">
              {past.map((ev) => (
                <EventRow key={ev.id} ev={ev} showDate />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export function EventRow({ ev, showDate = false, compact = false }: { ev: AgendaEvent; showDate?: boolean; compact?: boolean }) {
  return (
    <li className="row event-row">
      <span className="ev-time">{ev.time ?? 'hele dag'}</span>
      <div className="row-main">
        <strong>{ev.title}</strong>
        {(ev.note || showDate) && (
          <span className="meta">
            {showDate && <span className="cap">{dateLabel(ev.date)}</span>}
            {showDate && ev.note && ' · '}
            {ev.note}
          </span>
        )}
      </div>
      {!compact && <ConfirmButton onConfirm={() => remove('events', ev.id)}>×</ConfirmButton>}
    </li>
  )
}
