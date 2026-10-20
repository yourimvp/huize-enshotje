import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { GameShell, Kast } from '../components/game'
import { pourTitanic, titanicCapacity } from '../lib/titanic'

export default function Titanic() {
  const [fill, setFill] = useState(0)
  const [pouring, setPouring] = useState(false)
  const [sunk, setSunk] = useState(false)
  const capacity = useRef(titanicCapacity())
  const amount = useRef(0)
  const held = useRef(false)
  const pointer = useRef<number | null>(null)
  const last = useRef(0)
  const frame = useRef(0)
  const stop = () => { held.current = false; setPouring(false); cancelAnimationFrame(frame.current) }
  const advance = (now: number) => {
    const next = pourTitanic(amount.current, now - last.current, capacity.current)
    last.current = now
    amount.current = next.fill
    setFill(next.fill)
    if (next.sunk) {
      stop(); setSunk(true)
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.([80, 60, 140])
    }
    return next.sunk
  }
  const tick = (now: number) => {
    if (!held.current) return
    if (!advance(now)) frame.current = requestAnimationFrame(tick)
  }
  const start = () => {
    if (held.current || sunk) return
    held.current = true; last.current = performance.now(); setPouring(true)
    frame.current = requestAnimationFrame(tick)
  }
  const release = () => {
    if (held.current) advance(performance.now())
    stop()
  }
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (!e.isPrimary || e.button !== 0 || pointer.current !== null) return
    pointer.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    start()
  }
  const up = (e: PointerEvent<HTMLButtonElement>) => {
    if (pointer.current !== e.pointerId) return
    pointer.current = null; release()
  }
  useEffect(() => {
    const pause = () => { held.current = false; pointer.current = null; cancelAnimationFrame(frame.current); setPouring(false) }
    const hide = () => { if (document.hidden) pause() }
    window.addEventListener('blur', pause)
    document.addEventListener('visibilitychange', hide)
    return () => { cancelAnimationFrame(frame.current); window.removeEventListener('blur', pause); document.removeEventListener('visibilitychange', hide) }
  }, [])
  function reset() {
    stop(); pointer.current = null; amount.current = 0; capacity.current = titanicCapacity()
    setFill(0); setSunk(false)
  }
  const depth = fill * 64
  return <GameShell icon="titanic" title="Titaniccen" intro="Nog een druppeltje. Durf je?">
    <Kast className={`titanic ${pouring ? 'is-pouring' : ''} ${sunk ? 'is-sunk' : ''}`}>
      <div className="titanic-status" aria-live="polite"><h2>{sunk ? 'Kopje onder.' : pouring ? 'Voorzichtig…' : fill > 0 ? 'Hij drijft nog.' : 'Wie durft als eerste?'}</h2><p>{sunk ? 'Jij liet hem zinken.' : 'Houd vast om te schenken. Laat los en geef door.'}</p></div>
      <svg className="titanic-scene" viewBox="0 0 360 390" role="img" aria-label={sunk ? 'Het shotglaasje is gezonken' : 'Een shotglaasje drijft in een glas water'}>
        <defs>
          <clipPath id="titanic-water"><path d="M77 98 L94 328 Q180 358 266 328 L283 98Z" /></clipPath>
          <clipPath id="titanic-shot"><path d="M-35 -33 L-25 34 Q0 43 25 34 L35 -33Z" /></clipPath>
        </defs>
        <ellipse cx="180" cy="349" rx="126" ry="24" fill="#e7dfce" />
        <ellipse cx="180" cy="349" rx="117" ry="18" fill="none" stroke="#b5a38a" strokeDasharray="3 4" />
        <path d="M76 78 L94 328 Q180 360 266 328 L284 78" fill="#fcfaf5" fillOpacity=".65" stroke="#9ba9a5" strokeWidth="3" />
        <g clipPath="url(#titanic-water)">
          <path d="M75 150 Q125 142 180 150 T285 150 V356 H75Z" fill="#acd4da" fillOpacity=".7" />
          <path d="M75 150 Q125 142 180 150 T285 150" fill="none" stroke="#4e9eab" strokeWidth="2" className="water-ripple" />
        </g>
        <ellipse cx="180" cy="78" rx="104" ry="19" fill="none" stroke="#9ba9a5" strokeWidth="3" />
        <ellipse className="titanic-ripple" cx="180" cy="150" rx="65" ry="9" fill="none" stroke="#fff" strokeWidth="2" />
        <g transform={`translate(180 ${124 + depth})`}>
          <g className="titanic-shot" style={{ '--tilt': `${fill > .6 ? (fill - .6) * 18 : 0}deg` } as CSSProperties}>
            <path d="M-38 -35 L-27 36 Q0 47 27 36 L38 -35" fill="#fffdf7" fillOpacity=".65" stroke="#6e8585" strokeWidth="2.5" />
            <g clipPath="url(#titanic-shot)"><rect x="-40" y={36 - fill * 76} width="80" height="80" fill="#eeb83f" fillOpacity=".85" /><path d={`M-40 ${36 - fill * 76} H40`} stroke="#bc8625" strokeWidth="2" /></g>
            <path d="M-38 -35 Q0 -46 38 -35 Q0 -23 -38 -35Z" fill="none" stroke="#6e8585" strokeWidth="2.5" />
            <path d="M-27 -18 L-21 24" stroke="white" strokeWidth="4" strokeLinecap="round" opacity=".85" />
          </g>
        </g>
        <g className="titanic-stream"><path d={`M180 27 V${90 + depth}`} stroke="#efbd4c" strokeWidth="5" strokeLinecap="round" /><path d="M175 28 L185 28" stroke="#fff1bb" strokeWidth="2" /></g>
        <path d="M88 108 L102 304" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity=".6" />
        <g className="titanic-bubbles" fill="none" stroke="#fff" strokeWidth="2"><circle cx="156" cy="219" r="5"/><circle cx="198" cy="257" r="4"/><circle cx="176" cy="192" r="3"/></g>
        <path d="M100 330 Q180 351 260 330" fill="none" stroke="#6e8585" strokeWidth="2" />
      </svg>
      {sunk ? <button className="btn primary titanic-pour" onClick={reset}>Nog een ronde</button> :
        <button className="btn primary titanic-pour" onPointerDown={down} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); start() } }}
          onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release() } }} onBlur={release}>
          {pouring ? 'Schenken…' : 'Houd vast om te schenken'}
        </button>}
    </Kast>
  </GameShell>
}
