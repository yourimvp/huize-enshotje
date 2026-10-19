import { useEffect, useRef, useState } from 'react'
import { insert, remove, update } from '../lib/db'
import { useTable } from '../lib/hooks'
import { useHouse } from '../lib/house'
import { useMe } from '../lib/me'
import type { Wheel, WheelSegment } from '../lib/types'
import { GameShell, Kast, Uitslag } from '../components/game'
import { ConfirmButton, Empty, PersonPicker, PlusIcon } from '../components/ui'
import { fireConfetti } from '../components/Achievements'

const PALETTE = ['#f2b51f', '#e0468f', '#3a7be0', '#2fa463', '#ee7432', '#db3b47', '#7a4bd1', '#2bb3b1']

const TEMPLATES: { name: string; segments: WheelSegment[] }[] = [
  {
    name: 'Strafrad',
    segments: [
      { label: 'Iedereen drinkt' },
      { label: 'Links drinkt' },
      { label: 'Rechts drinkt' },
      { label: 'Draaier 2 slokken' },
      { label: 'Deel 3 slokken uit' },
      { label: 'Nieuwe huisregel' },
      { label: 'Anytimer voor de draaier', action: 'any_for_spinner' },
      { label: 'Waterval' },
    ],
  },
  { name: 'Wat eten we?', segments: [{ label: 'Pasta' }, { label: 'Pizza' }, { label: 'Wraps' }, { label: 'Patat' }, { label: 'Stamppot' }, { label: 'Uit eten' }] },
]

const ACTION_LABEL: Record<NonNullable<WheelSegment['action']>, string> = {
  any_for_spinner: 'Anytimer voor de draaier',
  any_on_spinner: 'Anytimer op de draaier',
}

export default function Rad() {
  const { rows: wheels } = useTable('wheels')
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Wheel | 'new' | null>(null)
  const wheel = wheels.find((w) => w.id === openId)

  if (editing) return <WheelEditor wheel={editing === 'new' ? null : editing} onDone={(id) => (setEditing(null), id && setOpenId(id))} />
  if (wheel) return <Spinner wheel={wheel} onBack={() => setOpenId(null)} onEdit={() => setEditing(wheel)} />

  return (
    <GameShell icon="🎡" title="Radjes" intro="Maak je eigen radjes en draai ze zo vaak je wilt.">
      <div className="wheel-list">
        {wheels.map((w) => (
          <button key={w.id} className="card wheel-card" onClick={() => setOpenId(w.id)}>
            <MiniWheel segments={w.segments} />
            <span>
              <strong>{w.name}</strong>
              <span className="meta">{w.segments.length} vakjes</span>
            </span>
          </button>
        ))}
        <button className="card wheel-card new" onClick={() => setEditing('new')}>
          <span className="plus-btn" aria-hidden>
            <PlusIcon />
          </span>
          <span>
            <strong>Nieuw rad</strong>
            <span className="meta">Zelf vakjes bedenken</span>
          </span>
        </button>
      </div>
      {wheels.length === 0 && (
        <section className="card">
          <h2 className="card-title">Of begin met een voorbeeld</h2>
          <div className="picker">
            {TEMPLATES.map((t) => (
              <button key={t.name} className="chip plain" onClick={() => insert('wheels', { name: t.name, segments: t.segments }).then((w) => setOpenId(w.id))}>
                {t.name}
              </button>
            ))}
          </div>
        </section>
      )}
    </GameShell>
  )
}

function MiniWheel({ segments }: { segments: WheelSegment[] }) {
  return <WheelSvg segments={segments} size={54} mini />
}

/** Het rad zelf, geborduurd: satijnsteek-vakken met rijgsteek ertussen. */
function WheelSvg({ segments, size, rotation = 0, mini = false }: { segments: WheelSegment[]; size: number; rotation?: number; mini?: boolean }) {
  const n = Math.max(1, segments.length)
  const r = 96
  const arc = (2 * Math.PI) / n
  const pt = (a: number, rad = r) => [100 + rad * Math.sin(a), 100 - rad * Math.cos(a)]
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} className="wheel-svg" aria-hidden>
      <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px' }} filter={mini ? undefined : 'url(#emb)'}>
        {segments.map((s, i) => {
          const [x1, y1] = pt(i * arc)
          const [x2, y2] = pt((i + 1) * arc)
          const d = n === 1 ? `M100 4 A96 96 0 1 1 99.9 4 Z` : `M100 100 L${x1} ${y1} A${r} ${r} 0 ${arc > Math.PI ? 1 : 0} 1 ${x2} ${y2} Z`
          const color = s.color ?? PALETTE[i % PALETTE.length]
          const mid = (i + 0.5) * arc
          const [tx, ty] = pt(mid, 60)
          return (
            <g key={i}>
              <path d={d} fill={color} />
              <path d={d} fill="url(#satin)" />
              {!mini && (
                <text
                  x={tx}
                  y={ty}
                  transform={`rotate(${(mid * 180) / Math.PI - 90} ${tx} ${ty})`}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={n > 10 ? 7.5 : 9.5}
                  fontWeight="700"
                  fill="#fff"
                  fontFamily="Figtree, system-ui, sans-serif"
                >
                  {s.label.length > 18 ? s.label.slice(0, 17) + '…' : s.label}
                </text>
              )}
            </g>
          )
        })}
        {segments.map((_, i) => {
          const [x, y] = pt(i * arc)
          return <line key={i} x1="100" y1="100" x2={x} y2={y} stroke="#fff" strokeOpacity=".9" strokeWidth="1.2" strokeDasharray="3 2" />
        })}
        <circle cx="100" cy="100" r="97" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 2.5" />
      </g>
    </svg>
  )
}

function Spinner({ wheel, onBack, onEdit }: { wheel: Wheel; onBack: () => void; onEdit: () => void }) {
  const { meId, me } = useMe()
  const { byId } = useHouse()
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [target, setTarget] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [tickKey, setTickKey] = useState(0)
  const raf = useRef(0)
  const n = wheel.segments.length

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  function spin() {
    if (spinning || n === 0) return
    setResult(null)
    setTarget(null)
    setSaved(false)
    setSpinning(true)
    const start = rotation
    const total = 360 * (5 + Math.random() * 2) + Math.random() * 360
    const duration = 4200 + Math.random() * 1200
    const t0 = performance.now()
    let lastSeg = -1
    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      const rot = start + total * eased
      setRotation(rot)
      // Tik langs de pinnetjes
      const seg = Math.floor((((360 - (rot % 360)) % 360) / 360) * n)
      if (seg !== lastSeg) {
        lastSeg = seg
        setTickKey((k) => k + 1)
        if (p < 0.92) navigator.vibrate?.(4)
      }
      if (p < 1) raf.current = requestAnimationFrame(frame)
      else {
        setSpinning(false)
        const final = Math.floor((((360 - (rot % 360)) % 360) / 360) * n) % n
        setResult(final)
        navigator.vibrate?.([30, 50, 30])
        fireConfetti()
      }
    }
    raf.current = requestAnimationFrame(frame)
  }

  const seg = result !== null ? wheel.segments[result] : null

  async function saveAny() {
    if (!seg?.action || !meId || !target) return
    if (seg.action === 'any_for_spinner') await insert('anytimers', { owed_to: meId, owed_by: target, reason: `Rad: ${wheel.name}` })
    else await insert('anytimers', { owed_to: target, owed_by: meId, reason: `Rad: ${wheel.name}` })
    setSaved(true)
  }

  return (
    <GameShell icon="🎡" title={wheel.name}>
      <div className="game-topbar">
        <button className="link small" onClick={onBack}>
          ← Alle radjes
        </button>
        <button className="link small" onClick={onEdit}>
          Bewerken
        </button>
      </div>
      <Kast className="wheel-kast">
        <div className="wheel-wrap">
          <span key={tickKey} className={`wheel-pointer ${spinning ? 'tick' : ''}`} aria-hidden />
          <WheelSvg segments={wheel.segments} size={300} rotation={rotation} />
          <button className="wheel-hub" onClick={spin} disabled={spinning}>
            {spinning ? '…' : 'Draai'}
          </button>
        </div>
      </Kast>
      {seg && !spinning && (
        <Uitslag title={seg.label} lines={[]}>
          {seg.action && (
            <div className="any-from-wheel">
              <p className="hint">
                {seg.action === 'any_for_spinner' ? `${me?.name ?? 'Jij'} mag een any uitdelen. Op wie?` : `Wie krijgt een any op ${me?.name ?? 'jou'}?`}
              </p>
              <PersonPicker value={target} onChange={setTarget} exclude={meId} label="Kies iemand" />
              <button className="btn primary" disabled={!target || saved} onClick={saveAny}>
                {saved ? `Opgeslagen bij Anys ✓` : target ? `Any vastleggen (${byId.get(target)?.name})` : 'Kies iemand'}
              </button>
            </div>
          )}
          <button className="btn ghost" onClick={spin}>
            Nog een keer draaien
          </button>
        </Uitslag>
      )}
    </GameShell>
  )
}

function WheelEditor({ wheel, onDone }: { wheel: Wheel | null; onDone: (id?: string) => void }) {
  const { active } = useHouse()
  const [name, setName] = useState(wheel?.name ?? '')
  const [segments, setSegments] = useState<WheelSegment[]>(wheel?.segments ?? [{ label: '' }, { label: '' }])

  const setSeg = (i: number, patch: Partial<WheelSegment>) => setSegments((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const valid = name.trim() && segments.filter((s) => s.label.trim()).length >= 2

  async function save() {
    const clean = segments.filter((s) => s.label.trim()).map((s) => ({ ...s, label: s.label.trim() }))
    if (wheel) {
      await update('wheels', wheel.id, { name: name.trim(), segments: clean })
      onDone(wheel.id)
    } else {
      const w = await insert('wheels', { name: name.trim(), segments: clean })
      onDone(w.id)
    }
  }

  return (
    <GameShell icon="🎡" title={wheel ? 'Rad bewerken' : 'Nieuw rad'}>
      <section className="card form">
        <input placeholder="Naam, bijv. Strafrad" value={name} onChange={(e) => setName(e.target.value)} aria-label="Naam van het rad" />
        <div className="seg-list">
          {segments.map((s, i) => (
            <div key={i} className="seg-row">
              <span className="seg-dot" style={{ background: s.color ?? PALETTE[i % PALETTE.length] }} />
              <input placeholder={`Vakje ${i + 1}`} value={s.label} onChange={(e) => setSeg(i, { label: e.target.value })} aria-label={`Vakje ${i + 1}`} />
              <select
                className="select seg-action"
                value={s.action ?? ''}
                onChange={(e) => setSeg(i, { action: (e.target.value || undefined) as WheelSegment['action'] })}
                aria-label="Actie"
              >
                <option value="">Geen actie</option>
                {Object.entries(ACTION_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <button className="btn ghost small" onClick={() => setSegments((x) => x.filter((_, j) => j !== i))} aria-label="Vakje weghalen" disabled={segments.length <= 2}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="picker">
          <button className="chip plain" onClick={() => setSegments((s) => [...s, { label: '' }])}>
            + Vakje
          </button>
          <button className="chip plain" onClick={() => setSegments(active.map((h) => ({ label: h.name, color: h.color })))}>
            Vul met huisgenoten
          </button>
        </div>
        <div className="uitslag-actions">
          <button className="btn primary" disabled={!valid} onClick={save}>
            Opslaan
          </button>
          <button className="btn ghost" onClick={() => onDone()}>
            Annuleer
          </button>
          {wheel && (
            <ConfirmButton onConfirm={() => remove('wheels', wheel.id).then(() => onDone())} confirmLabel="Echt weg?">
              Verwijderen
            </ConfirmButton>
          )}
        </div>
        {!valid && <p className="hint">Geef het rad een naam en minstens 2 vakjes.</p>}
      </section>
      {segments.some((s) => s.label.trim()) && (
        <Kast className="wheel-kast">
          <WheelSvg segments={segments.filter((s) => s.label.trim())} size={220} />
        </Kast>
      )}
      {segments.length === 0 && <Empty>Voeg vakjes toe.</Empty>}
    </GameShell>
  )
}
