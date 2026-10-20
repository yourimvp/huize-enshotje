import type { ReactNode } from 'react'

/**
 * Eigen icoontjes in de borduurstijl: vlak, crème garen met een rijgsteek-randje.
 * Bedoeld op een gekleurd lapje (zie <Lapje>), maar werken ook los.
 */
export type IconName =
  | 'titanic'
  | 'paard'
  | 'rad'
  | 'duel'
  | 'dobbel'
  | 'ei'
  | 'chwazi'
  | 'mines'
  | 'ranking'
  | 'anys'
  | 'agenda'
  | 'achievements'
  | 'huis'
  | 'profiel'
  | 'boodschappen'
  | 'turf'
  | 'instellingen'
  | 'spellen'

const INK = '#fffaf0'
const SHADE = 'rgba(26,22,18,.55)'
const stitch = { fill: 'none', stroke: SHADE, strokeWidth: 1, strokeDasharray: '2 1.6', strokeLinecap: 'round' as const }

const ICONS: Record<IconName, ReactNode> = {
  titanic: (<><path d="M8 10 L12 39 Q24 44 36 39 L40 10" fill={INK} /><path d="M11 20 Q24 16 37 20 M12 38 Q24 42 36 38" {...stitch} /><path d="M19 14 L21 28 Q24 30 27 28 L29 14Z" fill={SHADE} /><path d="M20 23 H28" {...stitch} /></>),
  paard: (
    <>
      <path d="M14 40 C14 30 17 22 22 17 L20 9 L26 14 C30 11 36 12 39 17 L41 23 C42 26 39 28 37 26 L33 23 C31 27 32 33 34 40 Z" fill={INK} />
      <path d="M22 17 C25 14 28 13 30 13" {...stitch} />
      <path d="M14 40 C14 30 17 22 22 17 L20 9 L26 14 C30 11 36 12 39 17 L41 23 C42 26 39 28 37 26 L33 23 C31 27 32 33 34 40 Z" {...stitch} />
      <circle cx="33" cy="18" r="1.6" fill={SHADE} />
      <path d="M21 19 C17 24 16 30 17 36" fill="none" stroke={SHADE} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  rad: (
    <>
      <circle cx="24" cy="24" r="16" fill={INK} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i * Math.PI) / 3
        return <line key={i} x1="24" y1="24" x2={24 + 16 * Math.sin(a)} y2={24 - 16 * Math.cos(a)} stroke={SHADE} strokeWidth="1.2" strokeDasharray="2 1.6" />
      })}
      <circle cx="24" cy="24" r="16" {...stitch} />
      <circle cx="24" cy="24" r="4" fill={SHADE} />
      <path d="M20 4 L28 4 L24 10 Z" fill={INK} stroke={SHADE} strokeWidth="1" />
    </>
  ),
  duel: (
    <>
      <path d="M6 30 C10 26 38 26 42 30 C38 34 10 34 6 30 Z" fill={INK} />
      <path d="M15 28 C15 16 18 12 21 15 C23 17 25 17 27 15 C30 12 33 16 33 28 Z" fill={INK} />
      <path d="M15 25 L33 25" stroke={SHADE} strokeWidth="2.4" />
      <path d="M6 30 C10 26 38 26 42 30 C38 34 10 34 6 30 Z" {...stitch} />
      <path d="M15 28 C15 16 18 12 21 15 C23 17 25 17 27 15 C30 12 33 16 33 28" {...stitch} />
    </>
  ),
  dobbel: (
    <>
      <rect x="9" y="9" width="30" height="30" rx="7" fill={INK} transform="rotate(-8 24 24)" />
      <rect x="11.5" y="11.5" width="25" height="25" rx="5" transform="rotate(-8 24 24)" {...stitch} />
      {[
        [17, 17],
        [24, 24],
        [31, 31],
        [31, 17],
        [17, 31],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.6" fill={SHADE} transform="rotate(-8 24 24)" />
      ))}
    </>
  ),
  ei: (
    <>
      <path d="M24 6 C33 6 39 20 39 29 C39 38 32 43 24 43 C16 43 9 38 9 29 C9 20 15 6 24 6 Z" fill={INK} />
      <path d="M24 6 C33 6 39 20 39 29 C39 38 32 43 24 43 C16 43 9 38 9 29 C9 20 15 6 24 6 Z" {...stitch} />
      <path d="M13 26 L18 22 L21 27 L25 21 L28 27 L32 22 L36 26" fill="none" stroke={SHADE} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
    </>
  ),
  chwazi: (
    <>
      <path d="M20 40 L18 26 C17 23 13 22 12 25 L14 32 C11 30 8 32 10 35 L17 43 Z" fill={INK} />
      <path d="M18 26 L18 9 C18 6 23 6 23 9 L23 22 L27 21 C29 20 31 22 31 24 L33 23 C35 22 37 24 37 26 L37 33 C37 39 33 43 27 43 L20 43 Z" fill={INK} />
      <path d="M18 26 L18 9 C18 6 23 6 23 9 L23 22 L27 21 C29 20 31 22 31 24 L33 23 C35 22 37 24 37 26 L37 33 C37 39 33 43 27 43 L20 43" {...stitch} />
      <circle cx="20.5" cy="6" r="4" fill="none" stroke={INK} strokeWidth="1.6" strokeDasharray="2 2" />
    </>
  ),
  mines: (
    <>
      <circle cx="22" cy="27" r="13" fill={INK} />
      <circle cx="22" cy="27" r="13" {...stitch} />
      <rect x="27" y="11" width="8" height="6" rx="1.5" fill={INK} transform="rotate(35 31 14)" />
      <path d="M33 10 C36 6 40 8 41 5" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M41 5 l2 -2 M41 5 l3 1 M41 5 l0 -3" stroke="#f2b51f" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="22" r="3" fill="#fff" opacity=".9" />
    </>
  ),
  ranking: (
    <>
      <circle cx="24" cy="27" r="14" fill={INK} />
      <circle cx="24" cy="27" r="14" {...stitch} />
      <rect x="21" y="7" width="6" height="5" rx="1" fill={INK} />
      <path d="M24 27 L24 18" stroke={SHADE} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M24 27 L30 30" stroke={SHADE} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  anys: (
    <>
      <path d="M12 12 L32 12 L30 41 C30 42 29 43 28 43 L16 43 C15 43 14 42 14 41 Z" fill={INK} />
      <path d="M32 18 C40 18 40 32 31 32" fill="none" stroke={INK} strokeWidth="3.4" />
      <path d="M11 13 C11 7 17 6 19 8 C21 5 27 5 28 8 C31 6 35 8 33 13 Z" fill="#fff" />
      <path d="M12 12 L32 12 L30 41 C30 42 29 43 28 43 L16 43 C15 43 14 42 14 41 Z" {...stitch} />
      <path d="M19 18 L19 37 M25 18 L25 37" stroke={SHADE} strokeWidth="1" strokeDasharray="2 1.6" />
    </>
  ),
  agenda: (
    <>
      <rect x="8" y="11" width="32" height="30" rx="5" fill={INK} />
      <rect x="8" y="11" width="32" height="9" rx="4" fill={SHADE} opacity=".55" />
      <rect x="10.5" y="13.5" width="27" height="25" rx="3.5" {...stitch} />
      <path d="M16 7 L16 14 M32 7 L32 14" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      {[
        [16, 27],
        [24, 27],
        [32, 27],
        [16, 34],
        [24, 34],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 2.4} y={y - 2.4} width="4.8" height="4.8" rx="1" fill={SHADE} />
      ))}
    </>
  ),
  achievements: (
    <>
      <path d="M17 6 L24 18 L31 6" fill="none" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="24" cy="29" r="13" fill={INK} />
      <circle cx="24" cy="29" r="9.5" {...stitch} />
      <path d="M24 22 L26 27 L31 27 L27 30 L28.5 35 L24 32 L19.5 35 L21 30 L17 27 L22 27 Z" fill={SHADE} />
    </>
  ),
  huis: (
    <>
      <path d="M8 23 L24 9 L40 23 L36 23 L36 40 L12 40 L12 23 Z" fill={INK} />
      <path d="M8 23 L24 9 L40 23 M12 23 L12 40 L36 40 L36 23" {...stitch} />
      <path d="M20 40 L20 30 C20 26 28 26 28 30 L28 40 Z" fill={SHADE} />
    </>
  ),
  boodschappen: (
    <>
      <path d="M8 18 L40 18 L36 40 C36 41 35 42 34 42 L14 42 C13 42 12 41 12 40 Z" fill={INK} />
      <path d="M16 18 C16 8 32 8 32 18" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M8 18 L40 18 L36 40 C36 41 35 42 34 42 L14 42 C13 42 12 41 12 40 Z" {...stitch} />
      <path d="M19 24 L20 36 M24 24 L24 36 M29 24 L28 36" stroke={SHADE} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  turf: (
    <>
      {[12, 19, 26, 33].map((x) => (
        <line key={x} x1={x} y1="10" x2={x} y2="38" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
      ))}
      <line x1="7" y1="32" x2="40" y2="15" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
      <line x1="7" y1="32" x2="40" y2="15" {...stitch} />
    </>
  ),
  instellingen: (
    <>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x="21" y="6" width="6" height="9" rx="1.5" fill={INK} transform={`rotate(${i * 45} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="12" fill={INK} />
      <circle cx="24" cy="24" r="12" {...stitch} />
      <circle cx="24" cy="24" r="4.5" fill={SHADE} />
    </>
  ),
  spellen: (
    <>
      <rect x="7" y="12" width="20" height="27" rx="3" fill={INK} transform="rotate(-12 17 25)" />
      <rect x="21" y="9" width="20" height="27" rx="3" fill={INK} transform="rotate(10 31 22)" />
      <rect x="23" y="11" width="16" height="23" rx="2" transform="rotate(10 31 22)" {...stitch} />
      <path d="M31 16 C35 20 35 23 31 27 C27 23 27 20 31 16 Z" fill="#db3b47" transform="rotate(10 31 22)" />
    </>
  ),
  profiel: (
    <>
      <circle cx="24" cy="17" r="8" fill={INK} />
      <path d="M9 41 C9 31 16 27 24 27 C32 27 39 31 39 41 Z" fill={INK} />
      <circle cx="24" cy="17" r="8" {...stitch} />
      <path d="M9 41 C9 31 16 27 24 27 C32 27 39 31 39 41" {...stitch} />
    </>
  ),
}

export function Icon({ name, size = 28 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className="icon">
      {ICONS[name]}
    </svg>
  )
}
