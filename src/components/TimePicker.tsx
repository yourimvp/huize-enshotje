import { useEffect, useRef, useState } from 'react'

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

/** Tijd kiezen in de stijl van de site, in plaats van de kale browser-kiezer. */
export default function TimePicker({ value, onChange, placeholder = 'Tijd (optioneel)' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [h, m] = value ? value.split(':') : ['', '']

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const set = (hh: string, mm: string) => onChange(`${hh}:${mm}`)

  return (
    <div className="timepicker" ref={ref}>
      <button type="button" className={`tp-field ${value ? '' : 'empty'}`} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span>{value || placeholder}</span>
        {value && (
          <span
            className="tp-clear"
            role="button"
            aria-label="Tijd wissen"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
              setOpen(false)
            }}
          >
            ×
          </span>
        )}
      </button>
      {open && (
        <div className="tp-pop card" role="dialog" aria-label="Kies een tijd">
          <p className="card-title">Uur</p>
          <div className="tp-grid hours">
            {HOURS.map((x) => (
              <button type="button" key={x} className={x === h ? 'on' : ''} onClick={() => set(x, m || '00')}>
                {x}
              </button>
            ))}
          </div>
          <p className="card-title">Minuten</p>
          <div className="tp-grid">
            {MINUTES.map((x) => (
              <button type="button" key={x} className={x === m ? 'on' : ''} onClick={() => (set(h || '20', x), setOpen(false))}>
                :{x}
              </button>
            ))}
          </div>
          <div className="tp-quick">
            {['17:30', '19:00', '20:00', '21:00', '22:00'].map((q) => (
              <button type="button" key={q} className="chip plain" onClick={() => (onChange(q), setOpen(false))}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
