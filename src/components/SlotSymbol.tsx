import { CowBlob } from './decor'
import type { SlotSymbol as SymbolName } from '../lib/slots'

/** Symbolen uit het huis, getekend als opgestikte lapjes. */
export function SlotSymbol({ symbol }: { symbol: SymbolName }) {
  if (symbol === 'door') return <img className="slot-door" src={`${import.meta.env.BASE_URL}icon.svg`} alt="" draggable={false} />
  if (symbol === 'cow') return <CowBlob size={58} />
  return <svg viewBox="0 0 80 80" aria-hidden className="slot-symbol-art">
    {symbol === 'beer' && <>
      <path d="M53 28 H62 C73 28 73 57 60 57 H54" fill="none" stroke="#b48428" strokeWidth="7" />
      <path d="M17 21 H56 L53 68 Q36 74 20 68Z" fill="#efb63b" stroke="#896524" strokeWidth="2" />
      <path d="M22 35 V62 M34 35 V65 M46 35 V62" stroke="#fff3c0" strokeWidth="4" strokeLinecap="round" />
      <path d="M17 26 C7 17 15 8 24 12 C28 3 42 5 44 12 C57 6 65 20 56 27Z" fill="#fffaf0" stroke="#c4b8a2" strokeWidth="1.5" />
      <path d="M17 30 H56 L53 68 Q36 74 20 68Z" fill="url(#satin)" />
    </>}
    {symbol === 'shot' && <>
      <path d="M18 17 L25 68 Q40 73 55 68 L62 17Z" fill="#c7e0e4" stroke="#6d9299" strokeWidth="2" />
      <path d="M22 35 H58 L54 65 Q40 69 26 65Z" fill="#e9b236" />
      <path d="M18 17 Q40 8 62 17 Q40 26 18 17Z" fill="#eff8f8" stroke="#6d9299" strokeWidth="2" />
      <path d="M27 29 L31 58" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <path d="M25 68 Q40 73 55 68" fill="none" stroke="#6d9299" strokeWidth="2" />
    </>}
    {symbol === 'dice' && <g transform="rotate(-9 40 40)">
      <rect x="13" y="13" width="54" height="54" rx="12" fill="#fdf8ed" stroke="#a69580" strokeWidth="2" />
      <rect x="17" y="17" width="46" height="46" rx="9" fill="url(#satin)" stroke="#cabda8" strokeDasharray="2.5 2" />
      {[[27,27],[53,27],[40,40],[27,53],[53,53]].map(([x,y])=><circle key={`${x}-${y}`} cx={x} cy={y} r="4.4" fill="#3b3027" />)}
    </g>}
    {symbol === 'horse' && <>
      <path d="M19 68 C19 50 24 38 32 28 L30 12 L41 22 C50 16 61 20 66 29 L70 39 C72 45 66 49 61 44 L54 40 C49 47 51 58 55 68Z" fill="#a97042" stroke="#624328" strokeWidth="2" strokeLinejoin="round" />
      <path d="M33 30 C25 41 25 54 26 63" stroke="#503c2e" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M19 68 C19 50 24 38 32 28 L30 12 L41 22 C50 16 61 20 66 29 L70 39 C72 45 66 49 61 44 L54 40 C49 47 51 58 55 68Z" fill="url(#satin)" />
      <circle cx="56" cy="30" r="2.8" fill="#231c16" />
      <path d="M50 38 L64 43" stroke="#e6c991" strokeWidth="3" />
    </>}
  </svg>
}
