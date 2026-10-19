import type { CSSProperties, ReactNode } from 'react'
import { GLASS } from '../lib/house'

const C = GLASS.map((g) => g.hex)

/** Slinger kerstlampjes, zoals in huis. */
export function Lights({ count = 40 }: { count?: number }) {
  const step = 54
  const w = count * step
  const wire = Array.from({ length: count }, (_, i) => {
    const x = i * step
    return `${i === 0 ? 'M0 6' : ''} Q${x + step / 2} 24 ${x + step} 6`
  }).join(' ')
  return (
    <div className="lights" aria-hidden>
      <svg width={w} height="40" viewBox={`0 0 ${w} 40`}>
        <path d={wire} fill="none" stroke="var(--wire)" strokeWidth="1.6" strokeLinecap="round" />
        {Array.from({ length: count }, (_, i) => {
          const x = i * step + step / 2
          const rot = i % 2 ? 12 : -12
          const color = C[i % 6]
          return (
            <g key={i} transform={`translate(${x} 15) rotate(${rot})`}>
              <rect x="-2.5" y="-1" width="5" height="5" rx="1" fill="var(--wire)" />
              <path
                className="bulb"
                style={{ animationDelay: `${(i * 0.53) % 3.2}s`, color } as CSSProperties}
                d="M-4.2 3.5 C-5.6 9 -2 15 0 18 C2 15 5.6 9 4.2 3.5 Z"
                fill={color}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** Band van glas-in-lood ruitjes. */
export function GlassStrip({ cells = 18, size = 12, offset = 0 }: { cells?: number; size?: number; offset?: number }) {
  return (
    <div className="glass-strip" aria-hidden>
      {Array.from({ length: cells }, (_, i) => (
        <span key={i} style={{ background: C[(i * 5 + offset) % 6], width: size, height: size }} />
      ))}
    </div>
  )
}

/** De voordeur met bovenlicht en zijlichten. */
export function Door({ size = 160 }: { size?: number }) {
  const panesTop: ReactNode[] = []
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 9; c++) {
      panesTop.push(
        <rect key={`t${r}${c}`} x={34 + c * 14.7} y={34 + r * 15} width={13} height={13} fill={C[(c * 2 + r * 3) % 6]} />,
      )
    }
  }
  const side = (x: number, off: number) =>
    Array.from({ length: 11 }, (_, i) => <rect key={`${x}-${i}`} x={x} y={90 + i * 17} width={14} height={15} fill={C[(i + off) % 6]} />)
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 200 280" aria-hidden className="door">
      <defs>
        <clipPath id="arch">
          <path d="M24 270 V74 Q24 22 100 18 Q176 22 176 74 V270 Z" />
        </clipPath>
      </defs>
      <path d="M14 276 V72 Q14 10 100 8 Q186 10 186 72 V276 Z" fill="var(--cream)" />
      <g clipPath="url(#arch)">
        <rect x="20" y="10" width="160" height="70" fill="#0d0b08" />
        {panesTop}
      </g>
      <rect x="24" y="80" width="152" height="6" fill="#0d0b08" />
      <rect x="24" y="86" width="152" height="190" fill="#0d0b08" />
      {side(28, 0)}
      {side(158, 3)}
      <rect x="50" y="88" width="100" height="186" fill="#1c1813" />
      <rect x="74" y="178" width="52" height="9" rx="2" fill="var(--brass)" />
      <circle cx="136" cy="186" r="4.5" fill="var(--brass)" />
    </svg>
  )
}

/** Logo: het glas-in-lood bovenlicht van de voordeur. */
export function Bovenlicht({ size = 30 }: { size?: number }) {
  const panes: ReactNode[] = []
  const cols = 5
  const rows = 4
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      panes.push(<rect key={`${r}${c}`} x={4.5 + c * 4.8} y={3 + r * 4.8} width={4} height={4} fill={C[(c * 2 + r * 3) % 6]} />)
  return (
    <svg width={size} height={size * (26 / 32)} viewBox="0 0 32 26" aria-hidden className="bovenlicht">
      <defs>
        <clipPath id="bl-clip">
          <path d="M4.5 23.5 V14 A11.5 10.5 0 0 1 27.5 14 V23.5 Z" />
        </clipPath>
      </defs>
      <path d="M2 26 V14 A14 13 0 0 1 30 14 V26 Z" fill="#1a1612" />
      <g clipPath="url(#bl-clip)">{panes}</g>
    </svg>
  )
}

/** Bedrukt bierviltje. */
export function Viltje({ ring = 'var(--g-red)', size = 96, children }: { ring?: string; size?: number; children: ReactNode }) {
  return (
    <div className="viltje" style={{ width: size, height: size, ['--ring' as string]: ring }}>
      <div className="viltje-inner">{children}</div>
    </div>
  )
}

/** Koeienvlek, zoals op de wc. */
export function CowBlob({ size = 48, style }: { size?: number; style?: CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden className="cow" style={style}>
      <path d="M50 5 C70 3 93 18 95 42 C98 68 82 94 54 95 C27 97 5 80 6 53 C6 27 25 7 50 5Z" fill="var(--cow)" />
      <path d="M18 30 C24 18 40 20 38 32 C37 42 22 44 18 30Z" fill="#14110d" />
      <path d="M58 16 C70 10 82 20 74 28 C68 34 54 26 58 16Z" fill="#14110d" />
      <path d="M62 52 C74 44 90 54 84 68 C78 80 58 74 62 52Z" fill="#14110d" />
      <path d="M22 66 C30 58 44 66 40 76 C36 86 18 80 22 66Z" fill="#14110d" />
    </svg>
  )
}

export function Avatar({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  return (
    <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.46 }} aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}

/** Turfstreepjes per vijf. */
export function TallyMarks({ n, max = 40 }: { n: number; max?: number }) {
  const shown = Math.min(n, max)
  const groups = Math.floor(shown / 5)
  const rest = shown % 5
  const g: ReactNode[] = []
  for (let i = 0; i < groups; i++) {
    g.push(
      <svg key={i} width="26" height="18" viewBox="0 0 26 18">
        {[0, 1, 2, 3].map((k) => (
          <line key={k} x1={3 + k * 5.5} y1="1.5" x2={3 + k * 5.5} y2="16.5" />
        ))}
        <line x1="0" y1="14" x2="24" y2="4" />
      </svg>,
    )
  }
  if (rest)
    g.push(
      <svg key="r" width={rest * 5.5 + 3} height="18" viewBox={`0 0 ${rest * 5.5 + 3} 18`}>
        {Array.from({ length: rest }, (_, k) => (
          <line key={k} x1={3 + k * 5.5} y1="1.5" x2={3 + k * 5.5} y2="16.5" />
        ))}
      </svg>,
    )
  return (
    <span className="tally" aria-label={`${n} streepjes`}>
      {g}
      {n > max && <span className="tally-more">+{n - max}</span>}
    </span>
  )
}

export function PageTitle({ children, color, sub }: { children: ReactNode; color: string; sub?: ReactNode }) {
  return (
    <header className="page-title">
      <span className="pane" style={{ background: color, color }} aria-hidden />
      <div>
        <h1>{children}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
    </header>
  )
}
