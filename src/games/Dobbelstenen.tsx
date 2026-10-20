import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, Kast } from '../components/game'

interface Die {
  id: number
  value: number
  held: boolean
  rx: number
  ry: number
}

// Hoe de kubus moet staan zodat een bepaalde waarde naar voren wijst
const FACE: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] }
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}
let nextId = 1
const newDie = (): Die => ({ id: nextId++, value: 1 + Math.floor(Math.random() * 6), held: false, rx: 0, ry: 0 })

function mexScore(a: number, b: number): { label: string; rank: number } {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  if (hi === 2 && lo === 1) return { label: 'Mexico! (21)', rank: 1000 }
  if (hi === lo) return { label: `${hi * 100}`, rank: hi * 100 }
  return { label: `${hi}${lo}`, rank: hi * 10 + lo }
}

function Face({ n, cls }: { n: number; cls: string }) {
  return (
    <span className={`face ${cls}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={PIPS[n].includes(i) ? 'pip' : ''} />
      ))}
    </span>
  )
}

function Cube({ d, rolling, onToggle }: { d: Die; rolling: boolean; onToggle: () => void }) {
  return (
    <button className={`die ${d.held ? 'held' : ''} ${rolling && !d.held ? 'rolling' : ''}`} onClick={onToggle} aria-label={`Dobbelsteen ${d.value}${d.held ? ', vastgezet' : ''}`}>
      <span className="cube" style={{ transform: `rotateX(${d.rx}deg) rotateY(${d.ry}deg)` }}>
        <Face n={1} cls="f1" />
        <Face n={6} cls="f6" />
        <Face n={2} cls="f2" />
        <Face n={5} cls="f5" />
        <Face n={3} cls="f3" />
        <Face n={4} cls="f4" />
      </span>
    </button>
  )
}

export default function Dobbelstenen() {
  const [dice, setDice] = useState<Die[]>(() => [newDie(), newDie()])
  const [rolling, setRolling] = useState(false)
  const [mexen, setMexen] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [shakeOn, setShakeOn] = useState(false)
  const lastShake = useRef(0)

  const roll = useCallback(() => {
    if (rolling) return
    setRolling(true)
    navigator.vibrate?.(25)
    const next = dice.map((d) => {
      if (d.held) return d
      const value = 1 + Math.floor(Math.random() * 6)
      const [fx, fy] = FACE[value]
      // Altijd een paar keer extra rondtollen, telkens verder
      const baseX = Math.ceil(d.rx / 360) * 360 + (2 + Math.floor(Math.random() * 3)) * 360
      const baseY = Math.ceil(d.ry / 360) * 360 + (2 + Math.floor(Math.random() * 3)) * 360
      return { ...d, value, rx: baseX + fx, ry: baseY + fy }
    })
    setDice(next)
    setTimeout(() => {
      setRolling(false)
      const vals = next.map((d) => d.value)
      const text = mexen && vals.length === 2 ? mexScore(vals[0], vals[1]).label : `${vals.join(' · ')} = ${vals.reduce((x, y) => x + y, 0)}`
      setHistory((h) => [text, ...h].slice(0, 6))
      navigator.vibrate?.(15)
    }, 950)
  }, [rolling, dice, mexen])

  // Schudden om te gooien
  useEffect(() => {
    if (!shakeOn) return
    const onMotion = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (!a) return
      const g = Math.sqrt((a.x ?? 0) ** 2 + (a.y ?? 0) ** 2 + (a.z ?? 0) ** 2)
      if (g > 22 && Date.now() - lastShake.current > 1300) {
        lastShake.current = Date.now()
        roll()
      }
    }
    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [shakeOn, roll])

  async function enableShake() {
    const DME = DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
    try {
      if (typeof DME.requestPermission === 'function') {
        const r = await DME.requestPermission()
        if (r !== 'granted') return
      }
      setShakeOn(true)
    } catch {
      /* geen bewegingssensor */
    }
  }

  const toggleMexen = () => {
    setMexen((m) => {
      if (!m) setDice((ds) => ds.slice(0, 2).concat(ds.length < 2 ? [newDie()] : []).map((d) => ({ ...d, held: false })))
      return !m
    })
  }

  const vals = dice.map((d) => d.value)
  const total = vals.reduce((a, b) => a + b, 0)
  const mex = mexen && vals.length === 2 ? mexScore(vals[0], vals[1]) : null
  const held = dice.filter((d) => d.held)
  const free = dice.filter((d) => !d.held)

  return (
    <GameShell icon="dobbel" title="Dobbelstenen" intro="Tik een dobbelsteen om hem vast te zetten. Gooi met de knop, of zet schudden aan.">
      <div className="segmented">
        <button className={!mexen ? 'on' : ''} onClick={() => mexen && toggleMexen()}>
          Vrij gooien
        </button>
        <button className={mexen ? 'on' : ''} onClick={() => !mexen && toggleMexen()}>
          Mexen
        </button>
      </div>

      <Kast className="dice-kast">
        {held.length > 0 && (
          <div className="held-tray">
            <span className="tray-label">Vast</span>
            {held.map((d) => (
              <Cube key={d.id} d={d} rolling={false} onToggle={() => setDice((ds) => ds.map((x) => (x.id === d.id ? { ...x, held: false } : x)))} />
            ))}
          </div>
        )}
        <div className="dice-table">
          {free.map((d) => (
            <Cube key={d.id} d={d} rolling={rolling} onToggle={() => !mexen && setDice((ds) => ds.map((x) => (x.id === d.id ? { ...x, held: true } : x)))} />
          ))}
          {free.length === 0 && <p className="hint">Alles staat vast. Tik er een aan om hem weer mee te gooien.</p>}
        </div>
        <p className={`dice-total ${rolling ? 'hide' : ''}`}>{mex ? mex.label : dice.length > 1 ? `Totaal ${total}` : `${total}`}</p>
      </Kast>

      <div className="dice-controls">
        <button className="btn primary big-btn" onClick={roll} disabled={rolling || free.length === 0}>
          Gooien
        </button>
        {!mexen && (
          <span className="stepper">
            <button onClick={() => setDice((ds) => (ds.length > 1 ? ds.slice(0, -1) : ds))} aria-label="Dobbelsteen weghalen">
              −
            </button>
            <b>{dice.length} 🎲</b>
            <button onClick={() => setDice((ds) => (ds.length < 6 ? [...ds, newDie()] : ds))} aria-label="Dobbelsteen toevoegen">
              +
            </button>
          </span>
        )}
        {!shakeOn ? (
          <button className="btn ghost small" onClick={enableShake}>
            📳 Schudden aan
          </button>
        ) : (
          <span className="pill">📳 Schud je telefoon</span>
        )}
      </div>

      {mexen && <p className="hint center">Mexen: 21 is Mexico (hoogst), dan dubbels (600 … 100), dan hoogste getal eerst. Laagste worp drinkt.</p>}

      {history.length > 0 && (
        <section className="card">
          <h2 className="card-title">Laatste worpen</h2>
          <ol className="dice-history">
            {history.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>
        </section>
      )}
    </GameShell>
  )
}
