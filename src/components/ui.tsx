import { useRef, useState, type ReactNode } from 'react'
import { useHouse } from '../lib/house'
import { Avatar, CowBlob } from './decor'

/** Rij met huisgenoten om er één te kiezen. */
export function PersonPicker({
  value,
  onChange,
  exclude,
  label,
}: {
  value: string | null
  onChange: (id: string) => void
  exclude?: string | null
  label?: string
}) {
  const { active } = useHouse()
  return (
    <div className="picker" role="radiogroup" aria-label={label}>
      {active
        .filter((h) => h.id !== exclude)
        .map((h) => (
          <button
            type="button"
            key={h.id}
            role="radio"
            aria-checked={value === h.id}
            className={`chip ${value === h.id ? 'on' : ''}`}
            onClick={() => onChange(h.id)}
          >
            <Avatar name={h.name} color={h.color} size={20} />
            {h.name}
          </button>
        ))}
    </div>
  )
}

/** Compacte keuzelijst met huisgenoten. */
export function PersonSelect({
  value,
  onChange,
  placeholder = 'Kies…',
  exclude,
  label,
}: {
  value: string
  onChange: (id: string) => void
  placeholder?: string
  exclude?: string
  label: string
}) {
  const { active } = useHouse()
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{placeholder}</option>
      {active
        .filter((h) => h.id !== exclude)
        .map((h) => (
          <option key={h.id} value={h.id}>
            {h.name}
          </option>
        ))}
    </select>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="empty">
      <CowBlob size={30} />
      <p>{children}</p>
    </div>
  )
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} className={value === t.id ? 'on' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Knop die eerst om bevestiging vraagt (tweede tik). */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Zeker?',
  className = 'btn ghost small',
}: {
  onConfirm: () => void
  children: ReactNode
  confirmLabel?: string
  className?: string
}) {
  const [armed, setArmed] = useState(false)
  return (
    <button
      type="button"
      className={`${className} ${armed ? 'armed' : ''}`}
      onBlur={() => setArmed(false)}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}

/** Melding onderin, optioneel met een actieknop (bijv. ongedaan maken). */
export function useToast() {
  const [state, setState] = useState<{ msg: string; action?: { label: string; run: () => void } } | null>(null)
  const timer = useRef(0)
  const show = (msg: string, action?: { label: string; run: () => void }) => {
    setState({ msg, action })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setState(null), 3500)
  }
  const node = state ? (
    <div className="toast" role="status">
      <span>{state.msg}</span>
      {state.action && (
        <button
          onClick={() => {
            state.action!.run()
            setState(null)
          }}
        >
          {state.action.label}
        </button>
      )}
    </div>
  ) : null
  return { show, node }
}

export function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}
