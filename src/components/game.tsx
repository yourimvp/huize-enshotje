import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useHouse } from '../lib/house'
import { Avatar } from './decor'
import { Icon, type IconName } from './icons'

/**
 * Borduurstijl, net als de huisfoto en de hoodie:
 * vlakken met satijnsteek, randen met rijgsteek, op gemêleerde stof.
 * Deze <defs> staan één keer op de pagina; SVG's verwijzen ernaar.
 */
export function StitchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        {/* Satijnsteek: dunne glanzende draadjes schuin over het vlak */}
        <pattern id="satin" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(32)">
          <rect width="3.2" height="3.2" fill="transparent" />
          <line x1="0" y1="0.6" x2="3.2" y2="0.6" stroke="#fff" strokeOpacity=".32" strokeWidth=".9" />
          <line x1="0" y1="2.3" x2="3.2" y2="2.3" stroke="#000" strokeOpacity=".12" strokeWidth=".7" />
        </pattern>
        <pattern id="satin-v" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-58)">
          <line x1="0" y1="0.6" x2="3" y2="0.6" stroke="#fff" strokeOpacity=".28" strokeWidth=".8" />
          <line x1="0" y1="2.2" x2="3" y2="2.2" stroke="#000" strokeOpacity=".12" strokeWidth=".6" />
        </pattern>
        {/* Licht opgestikt: kleine schaduw onder het borduursel */}
        <filter id="emb" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="1.4" stdDeviation="1" floodColor="#2b241c" floodOpacity=".35" />
        </filter>
      </defs>
    </svg>
  )
}

/** Gemêleerde stof als speelveld. */
export function Kast({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`kast ${className}`}>{children}</div>
}

export function GameShell({ icon, title, intro, children, back = '/spellen' }: { icon: IconName; title: string; intro?: ReactNode; children: ReactNode; back?: string }) {
  return (
    <div className="page game-page">
      <Link to={back} className="link small">
        ← Spellen
      </Link>
      <header className="game-head">
        <Lapje icon={icon} color={GAME_COLOR[icon] ?? 'var(--text)'} size={58} />
        <div>
          <h1>{title}</h1>
          {intro && <p className="muted">{intro}</p>}
        </div>
      </header>
      {children}
    </div>
  )
}

/** Spelers kiezen; de volgorde van aantikken is de speelvolgorde. */
export function PlayerSelect({ value, onChange, max }: { value: string[]; onChange: (ids: string[]) => void; max?: number }) {
  const { active } = useHouse()
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else if (!max || value.length < max) onChange([...value, id])
    else if (max === value.length) onChange([...value.slice(1), id])
  }
  return (
    <div className="picker">
      {active.map((h) => {
        const i = value.indexOf(h.id)
        return (
          <button key={h.id} className={`chip ${i >= 0 ? 'on' : ''}`} onClick={() => toggle(h.id)}>
            {i >= 0 ? <b className="order">{i + 1}</b> : <Avatar name={h.name} color={h.color} size={20} />}
            {h.name}
          </button>
        )
      })}
    </div>
  )
}

export interface UitslagRegel {
  id?: string
  name: string
  text: string
  kind: 'win' | 'drink' | 'neutral'
}

/** Eén uitslagkaart voor alle spellen. */
export function Uitslag({ title, lines, children }: { title: ReactNode; lines: UitslagRegel[]; children?: ReactNode }) {
  const { byId } = useHouse()
  return (
    <section className="card uitslag">
      <h2 className="uitslag-title">{title}</h2>
      {lines.length > 0 && (
        <ul className="uitslag-lines">
          {lines.map((l, i) => {
            const h = l.id ? byId.get(l.id) : undefined
            return (
              <li key={i} className={`uitslag-line ${l.kind}`}>
                {h && <Avatar name={h.name} color={h.color} size={26} />}
                <span>
                  <b>{l.name}</b> {l.text}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {children && <div className="uitslag-actions">{children}</div>}
    </section>
  )
}

export const GAME_COLOR: Partial<Record<IconName, string>> = {
  paard: '#2fa463',
  rad: '#e0468f',
  duel: '#ee7432',
  dobbel: '#3a7be0',
  ei: '#d9a520',
  chwazi: '#7a4bd1',
  mines: '#db3b47',
}

/** Geborduurd lapje met een eigen icoon erop. */
export function Lapje({ icon, color, size = 64 }: { icon: IconName; color: string; size?: number }) {
  return (
    <span className="lapje" style={{ width: size, height: size, ['--c' as string]: color }} aria-hidden>
      <Icon name={icon} size={size * 0.62} />
    </span>
  )
}
