/** Geborduurd paardje (zijaanzicht) met een zadeldekje waar de kaartkleur op staat. */
export interface Coat {
  body: string
  dark: string
  mane: string
}

const BODY = 'M30 38 C30 26 46 22 62 23 C76 24 84 28 86 36 C88 46 80 54 64 55 C48 56 30 52 30 38 Z'
const NECK = 'M73 31 C79 21 85 13 93 8 L101 16 C97 22 91 31 87 40 Z'
const HEAD = 'M91 7 C97 2 106 3 112 11 C116 16 116 22 110 23 C104 24 99 21 96 19 Z'
const EAR = 'M94 7 L96 0 L100 6 Z'
const TAIL = 'M33 33 C22 30 15 39 13 53 C19 46 25 43 32 42 Z'

function Leg({ x1, y1, x2, y2, color, cls }: { x1: number; y1: number; x2: number; y2: number; color: string; cls: string }) {
  return (
    <g className={`leg ${cls}`} style={{ transformOrigin: `${x1}px ${y1}px` }}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="5.5" strokeLinecap="round" />
      <line x1={x2} y1={y2 - 2} x2={x2 + 1.5} y2={y2 + 1} stroke="#2a211a" strokeWidth="6" strokeLinecap="round" />
    </g>
  )
}

export default function Horse({
  coat,
  cloth,
  symbol,
  running = false,
  stumble = false,
  width = 72,
}: {
  coat: Coat
  cloth: string
  symbol: string
  running?: boolean
  stumble?: boolean
  width?: number
}) {
  const outline = { fill: 'none', stroke: coat.dark, strokeWidth: 1.1, strokeDasharray: '2.2 1.5' }
  return (
    <svg
      viewBox="0 0 120 84"
      width={width}
      height={(width * 84) / 120}
      className={`horse-svg ${running ? 'running' : ''} ${stumble ? 'stumble' : ''}`}
      aria-hidden
    >
      <g filter="url(#emb)">
        {/* Achterbenen (verder weg, iets donkerder) */}
        <Leg x1={42} y1={48} x2={37} y2={76} color={coat.dark} cls="b1" />
        <Leg x1={74} y1={48} x2={71} y2={76} color={coat.dark} cls="f1" />
        <path d={TAIL} fill={coat.mane} />
        <path d={TAIL} fill="url(#satin-v)" />
        <path d={BODY} fill={coat.body} />
        <path d={BODY} fill="url(#satin)" />
        <path d={NECK} fill={coat.body} />
        <path d={NECK} fill="url(#satin-v)" />
        <path d={HEAD} fill={coat.body} />
        <path d={HEAD} fill="url(#satin)" />
        <path d={EAR} fill={coat.dark} />
        <path d="M77 27 C82 19 87 12 94 7" fill="none" stroke={coat.mane} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M77 27 C82 19 87 12 94 7" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1" strokeDasharray="1.5 1.5" />
        <path d={BODY} {...outline} />
        <path d={HEAD} {...outline} />
        <circle cx="103.5" cy="10.5" r="1.4" fill="#1d1712" />
        {/* Voorbenen */}
        <Leg x1={38} y1={49} x2={33} y2={77} color={coat.body} cls="b2" />
        <Leg x1={79} y1={49} x2={82} y2={77} color={coat.body} cls="f2" />
        {/* Zadeldekje met kaartkleur */}
        <rect x="49" y="21" width="23" height="21" rx="3.5" fill={cloth} />
        <rect x="49" y="21" width="23" height="21" rx="3.5" fill="url(#satin)" />
        <rect x="51" y="23" width="19" height="17" rx="2.5" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth=".9" strokeDasharray="1.8 1.3" />
        <text x="60.5" y="36.5" textAnchor="middle" fontSize="14" fill="#fff" fontFamily="Georgia, serif">
          {symbol}
        </text>
      </g>
    </svg>
  )
}
