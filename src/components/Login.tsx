import { useEffect, useState } from 'react'
import { useHouse } from '../lib/house'
import { useMe } from '../lib/me'
import type { Housemate } from '../lib/types'
import { Avatar, GlassStrip, Lights } from './decor'

type Step = { kind: 'pick' } | { kind: 'login'; h: Housemate } | { kind: 'new'; h: Housemate; first?: string }

export default function Login() {
  const { active, loading } = useHouse()
  const { login, claim } = useMe()
  const [step, setStep] = useState<Step>({ kind: 'pick' })
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(full: string) {
    if (step.kind === 'pick') return
    setError(null)
    if (step.kind === 'new' && !step.first) {
      setStep({ ...step, first: full })
      setPin('')
      return
    }
    if (step.kind === 'new' && step.first !== full) {
      setError('Pincodes zijn niet hetzelfde. Probeer opnieuw.')
      setStep({ kind: 'new', h: step.h })
      setPin('')
      return
    }
    setBusy(true)
    try {
      if (step.kind === 'login') await login(step.h, full)
      else await claim(step.h, full)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Er ging iets mis')
      setPin('')
      navigator.vibrate?.([60, 40, 60])
    } finally {
      setBusy(false)
    }
  }

  const press = (d: string) => {
    if (busy || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    if (next.length === 4) setTimeout(() => submit(next), 120)
  }

  // Toetsenbord van de computer werkt ook
  useEffect(() => {
    if (step.kind === 'pick') return
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key)
      if (e.key === 'Backspace') setPin((p) => p.slice(0, -1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const back = () => {
    setStep({ kind: 'pick' })
    setPin('')
    setError(null)
  }

  return (
    <div className="entry">
      <Lights />
      <div className="entry-card card">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} width={64} height={64} alt="" className="logo-door" />
        <h1 className="entry-title">
          Huize <em>Enshotje</em>
        </h1>

        {step.kind === 'pick' ? (
          <>
            <p className="muted">Wie ben jij?</p>
            {loading ? (
              <p className="hint">Even laden…</p>
            ) : (
              <div className="who-grid">
                {active.map((h) => (
                  <button key={h.id} className="who" onClick={() => setStep(h.user_id ? { kind: 'login', h } : { kind: 'new', h })}>
                    <Avatar name={h.name} color={h.color} size={40} />
                    <span>{h.name}</span>
                    {!h.user_id && <small className="new-tag">nieuw</small>}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="pin-who">
              <Avatar name={step.h.name} color={step.h.color} size={34} />
              <strong>{step.h.name}</strong>
            </div>
            <p className="muted">
              {step.kind === 'login'
                ? 'Voer je pincode in'
                : step.first
                  ? 'Nog een keer ter bevestiging'
                  : 'Kies een pincode van 4 cijfers. Die gebruik je voortaan om in te loggen.'}
            </p>
            <div className={`pin-dots ${error ? 'shake' : ''}`} aria-label={`${pin.length} van 4 cijfers`}>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={i < pin.length ? 'on' : ''} />
              ))}
            </div>
            {error && <p className="error">{error}</p>}
            <div className="pin-pad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button key={d} onClick={() => press(d)} disabled={busy}>
                  {d}
                </button>
              ))}
              <button className="pin-aux" onClick={back}>
                ← terug
              </button>
              <button onClick={() => press('0')} disabled={busy}>
                0
              </button>
              <button className="pin-aux" onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Wis">
                ⌫
              </button>
            </div>
          </>
        )}
        <GlassStrip cells={22} size={10} />
      </div>
      <p className="hint entry-foot">Je blijft ingelogd op dit apparaat.</p>
    </div>
  )
}
