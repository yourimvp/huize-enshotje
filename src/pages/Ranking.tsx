import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react'
import { insert, remove } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { ago, formatMs, parseTime } from '../lib/format'
import { isPersonalRecord } from '../lib/activity'
import Confetti from '../components/Confetti'
import { Avatar, PageTitle } from '../components/decor'
import { ConfirmButton, Empty, PersonPicker, Tabs } from '../components/ui'
import type { Housemate, TimeEntry } from '../lib/types'

export default function Ranking() {
  const disciplines = useTable('disciplines').rows
  const times = useTable('times').rows
  const [dId, setDId] = useState<string | null>(null)
  const discipline = disciplines.find((d) => d.id === dId) ?? disciplines[0]

  if (!discipline)
    return (
      <div className="page">
        <PageTitle color="var(--g-blue)">Ranking</PageTitle>
        <section className="card">
          <Empty>Nog geen onderdelen. Voeg Rietbak of SG toe bij Huis.</Empty>
        </section>
      </div>
    )

  const own = times.filter((t) => t.discipline_id === discipline.id)

  return (
    <div className="page">
      <PageTitle color="var(--g-blue)" sub="Snelste tijd telt">
        Ranking
      </PageTitle>
      <Tabs value={discipline.id} onChange={setDId} tabs={disciplines.map((d) => ({ id: d.id, label: d.name }))} />
      <Board times={own} />
      <Recorder key={discipline.id} disciplineId={discipline.id} name={discipline.name} times={own} />
      <Recent times={own} />
    </div>
  )
}

function useBest(times: TimeEntry[]) {
  const { byId } = useHouse()
  return useMemo(() => {
    const best = new Map<string, TimeEntry>()
    for (const t of times) {
      const cur = best.get(t.housemate_id)
      if (!cur || t.ms < cur.ms) best.set(t.housemate_id, t)
    }
    return [...best.values()]
      .sort((a, b) => a.ms - b.ms)
      .map((t) => ({ t, h: byId.get(t.housemate_id) }))
      .filter((x): x is { t: TimeEntry; h: Housemate } => !!x.h)
  }, [times, byId])
}

const MEDAL = ['Goud', 'Zilver', 'Brons']

function Medal({ name, ms, size }: { name: string; ms: number; size: number }) {
  const time = formatMs(ms)
  const leaves = [
    [39, 89, -35], [33, 83, -45], [28, 76, -55], [25, 68, -70],
    [24, 59, -85], [25, 50, -100], [28, 42, -115], [33, 35, -130],
  ]
  return (
    <div className="podium-medal" style={{ width: size, height: size }}>
      <svg className="medal-face" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="medal-disc" cx="60" cy="60" r="59" />
        <circle className="medal-rim" cx="60" cy="60" r="50" />
        {[-1, 1].map((side) => (
          <g key={side} className="medal-laurel" transform={side === -1 ? 'translate(120 0) scale(-1 1)' : undefined}>
            <path d="M43 94 C19 77 17 48 37 29" fill="none" stroke="currentColor" strokeWidth="1.3" />
            {leaves.map(([x, y, angle], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${angle}) scale(0.72)`}>
                <path d="M0 0 C-5 -1 -7 -5 -6 -9 C-2 -8 1 -4 0 0Z" />
                <path d="M0 0 C5 -1 7 -5 6 -9 C2 -8 -1 -4 0 0Z" />
              </g>
            ))}
          </g>
        ))}
      </svg>
      <div className="medal-engraving">
        <span className="medal-name" title={name}>{name}</span>
        <span className="medal-time" style={{ fontSize: size * (time.length > 5 ? 0.17 : 0.24) }}>{time}</span>
        <span className="medal-unit">sec</span>
      </div>
    </div>
  )
}

function Board({ times }: { times: TimeEntry[] }) {
  const ranked = useBest(times)
  if (ranked.length === 0)
    return (
      <section className="card">
        <Empty>Nog geen tijden. Wie durft?</Empty>
      </section>
    )

  const podium = [ranked[1], ranked[0], ranked[2]]
  const place = [2, 1, 3]
  return (
    <>
      <section className="podium" aria-label="Podium">
        {podium.map((x, i) => (
          <div key={x?.t.id ?? `e${i}`} className={`step step-${place[i]} ${x ? '' : 'empty-step'}`} role="group" aria-label={`${place[i]}e plaats · ${MEDAL[place[i] - 1]}`}>
            {x && (
              <div className="step-top">
                <Medal name={x.h.name} ms={x.t.ms} size={place[i] === 1 ? 108 : 88} />
              </div>
            )}
            <div className="block">
              <span>{place[i]}</span>
            </div>
          </div>
        ))}
      </section>
      {ranked.length > 3 && (
        <section className="card">
          <ol className="list rest">
            {ranked.slice(3).map(({ t, h }, i) => (
              <li key={t.id} className="row">
                <span className="rank">{i + 4}</span>
                <Avatar name={h.name} color={h.color} size={24} />
                <div className="row-main">
                  <strong>{h.name}</strong>
                </div>
                <span className="time">{formatMs(t.ms)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}

const HOLD_MS = 650

/** Tik = start, tik = stop, ingedrukt houden = reset. */
function useStopwatch() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [holding, setHolding] = useState(false)
  const start = useRef(0)
  const raf = useRef(0)
  const holdTimer = useRef(0)
  const didReset = useRef(false)

  useEffect(() => () => { cancelAnimationFrame(raf.current); window.clearTimeout(holdTimer.current) }, [])

  const reset = () => {
    cancelAnimationFrame(raf.current)
    setRunning(false)
    setElapsed(0)
  }

  const toggle = () => {
    if (running) {
      cancelAnimationFrame(raf.current)
      setElapsed(performance.now() - start.current)
      setRunning(false)
    } else {
      start.current = performance.now()
      setElapsed(0)
      setRunning(true)
      const tick = () => {
        setElapsed(performance.now() - start.current)
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    }
  }

  // Bij het stoppen telt het moment van indrukken, niet van loslaten
  const handlers = {
    onPointerDown: () => {
      didReset.current = false
      if (running) {
        toggle()
        didReset.current = true // geen extra actie bij loslaten
        return
      }
      setHolding(true)
      holdTimer.current = window.setTimeout(() => {
        reset()
        setHolding(false)
        didReset.current = true
        navigator.vibrate?.(40)
      }, HOLD_MS)
    },
    onPointerUp: () => {
      window.clearTimeout(holdTimer.current)
      setHolding(false)
      if (!didReset.current) toggle()
      didReset.current = true
    },
    onPointerLeave: () => {
      window.clearTimeout(holdTimer.current)
      setHolding(false)
      didReset.current = true
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        toggle()
      }
    },
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
  }

  return { running, elapsed, holding, reset, handlers }
}

function Recorder({ disciplineId, name, times }: { disciplineId: string; name: string; times: TimeEntry[] }) {
  const sw = useStopwatch()
  const [who, setWho] = useState<string | null>(null)
  const [manual, setManual] = useState('')
  const [saved, setSaved] = useState<{ time: string; record: boolean } | null>(null)
  const [celebration, setCelebration] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!celebration) return
    const timer = window.setTimeout(() => setCelebration(0), 2800)
    return () => window.clearTimeout(timer)
  }, [celebration])

  const manualMs = parseTime(manual)
  const ms = manual ? manualMs : !sw.running && sw.elapsed > 0 ? Math.round(sw.elapsed) : null

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!ms || !who || sw.running || saving) return
    const record = isPersonalRecord(times, who, disciplineId, ms)
    setSaving(true)
    setError('')
    setSaved(null)
    setCelebration(0)
    try {
      await insert('times', { discipline_id: disciplineId, housemate_id: who, ms })
      setSaved({ time: formatMs(ms), record })
      if (record) setCelebration(Date.now())
      sw.reset()
      setManual('')
    } catch {
      setError('Opslaan is niet gelukt. Probeer het opnieuw.')
    } finally { setSaving(false) }
  }

  const label = sw.running ? 'Tik om te stoppen' : sw.elapsed ? 'Tik voor opnieuw · houd vast om te resetten' : 'Tik om te starten'

  return (
    <form className="card form" onSubmit={save}>
      {celebration > 0 && <Confetti key={celebration} />}
      <h2 className="card-title">Tijd opnemen · {name}</h2>
      <button
        type="button"
        className={`stopwatch ${sw.running ? 'running' : ''} ${sw.holding ? 'holding' : ''}`}
        {...sw.handlers}
        disabled={saving}
        aria-label={label}
      >
        <span className="sw-time">{formatMs(sw.elapsed)}</span>
        <span className="sw-lbl">{label}</span>
        <span className="sw-hold" aria-hidden />
      </button>
      <div className="sw-actions">
        <button type="button" className="btn ghost small" onClick={sw.reset} disabled={sw.elapsed === 0 && !sw.running}>
          Reset
        </button>
        <input
          inputMode="decimal"
          placeholder="of typ: 3,42"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          disabled={sw.running || saving}
          aria-label="Tijd handmatig in seconden"
          className="manual"
        />
      </div>
      <div className="field">
        <span>Van wie?</span>
        <PersonPicker value={who} onChange={setWho} label="Van wie" />
      </div>
      {saved && <p className="hint ok" role="status">{saved.record ? 'Nieuw persoonlijk record! ' : 'Opgeslagen: '}{saved.time}</p>}
      {error && <p className="hint" role="alert">{error}</p>}
      <button className="btn primary" disabled={!ms || !who || sw.running || saving}>
        {saving ? 'Opslaan…' : ms ? `Opslaan · ${formatMs(ms)}` : 'Opslaan'}
      </button>
    </form>
  )
}

function Recent({ times }: { times: TimeEntry[] }) {
  const { byId } = useHouse()
  const [open, setOpen] = useState(false)
  const recent = [...times].reverse().slice(0, 12)
  if (recent.length === 0) return null
  return (
    <section className="fold">
      <button className="link" onClick={() => setOpen((s) => !s)}>
        {open ? '▾' : '▸'} Laatste pogingen
      </button>
      {open && (
        <ul className="list card">
          {recent.map((t) => {
            const h = byId.get(t.housemate_id)
            return (
              <li key={t.id} className="row">
                {h && <Avatar name={h.name} color={h.color} size={24} />}
                <div className="row-main">
                  <strong>{h?.name}</strong>
                  <span className="meta">{ago(t.created_at)}</span>
                </div>
                <span className="time">{formatMs(t.ms)}</span>
                <ConfirmButton onConfirm={() => remove('times', t.id)}>×</ConfirmButton>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
