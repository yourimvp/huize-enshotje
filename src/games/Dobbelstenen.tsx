import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, Kast } from '../components/game'
import { canHoldMexDie, finishMexRoll, mexScore, newMexTurn, toggleMexHold } from '../lib/mexen'

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

function Face({ n, cls }: { n: number; cls: string }) {
  return (
    <span className={`face ${cls}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <i key={i} className={PIPS[n].includes(i) ? 'pip' : ''} />
      ))}
    </span>
  )
}

function Cube({ d, rolling, onToggle, disabled }: { d: Die; rolling: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button className={`die ${d.held ? 'held' : ''} ${rolling && !d.held ? 'rolling' : ''}`} onClick={onToggle} disabled={disabled} aria-pressed={d.held} aria-label={`Dobbelsteen ${d.value}${d.held ? ', vastgezet' : ''}`}>
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
  const [mexTurn, setMexTurn] = useState(newMexTurn)
  const [turnNumber, setTurnNumber] = useState(1)
  const [rollLimit, setRollLimit] = useState(3)
  const [history, setHistory] = useState<string[]>([])
  const [shakeOn, setShakeOn] = useState(false)
  const lastShake = useRef(0)
  const rollLock = useRef(false)
  const rollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (rollTimer.current !== null) clearTimeout(rollTimer.current)
  }, [])

  const roll = useCallback(() => {
    if (rollLock.current || (mexen && (mexTurn.ended || mexTurn.rolls >= rollLimit)) || (!mexen && dice.every((d) => d.held))) return
    rollLock.current = true
    setRolling(true)
    navigator.vibrate?.(25)
    const next = dice.map((d, index) => {
      if (mexen ? mexTurn.held === index : d.held) return d
      const value = 1 + Math.floor(Math.random() * 6)
      const [fx, fy] = FACE[value]
      // Altijd een paar keer extra rondtollen, telkens verder
      const baseX = Math.ceil(d.rx / 360) * 360 + (2 + Math.floor(Math.random() * 3)) * 360
      const baseY = Math.ceil(d.ry / 360) * 360 + (2 + Math.floor(Math.random() * 3)) * 360
      return { ...d, value, rx: baseX + fx, ry: baseY + fy }
    })
    setDice(next)
    rollTimer.current = setTimeout(() => {
      rollLock.current = false
      setRolling(false)
      const vals = next.map((d) => d.value)
      if (mexen) setMexTurn(finishMexRoll(mexTurn, [vals[0], vals[1]], rollLimit))
      const score = mexen ? mexScore(vals[0], vals[1]) : null
      const text = score ? `Beurt ${turnNumber} · ${score.label}${score.kind === 'give' ? ' · Uitdelen (gratis)' : score.kind === 'out' ? ' · Direct af' : ''}` : `${vals.join(' · ')} = ${vals.reduce((x, y) => x + y, 0)}`
      setHistory((h) => [text, ...h].slice(0, 6))
      navigator.vibrate?.(15)
    }, 950)
  }, [dice, mexen, mexTurn, turnNumber, rollLimit])

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
    if (rollLock.current) return
    if (!mexen) setDice((ds) => ds.slice(0, 2).concat(ds.length < 2 ? [newDie()] : []).map((d) => ({ ...d, held: false })))
    setMexTurn(newMexTurn())
    setTurnNumber(1)
    setRollLimit(3)
    setMexen(!mexen)
  }

  const nextPlayer = () => {
    if (rollLock.current || !(mexTurn.ended || mexTurn.rolls >= rollLimit)) return
    setMexTurn(newMexTurn())
    setTurnNumber((n) => n + 1)
    setDice((ds) => ds.map((d) => ({ ...d, held: false })))
  }

  const toggleDie = (d: Die) => {
    if (rollLock.current || (mexen && mexTurn.rolls >= rollLimit)) return
    if (mexen) setMexTurn((turn) => toggleMexHold(turn, dice.findIndex((x) => x.id === d.id)))
    else setDice((ds) => ds.map((x) => x.id === d.id ? { ...x, held: !x.held } : x))
  }

  const turnEnded = mexTurn.ended || mexTurn.rolls >= rollLimit
  const dieDisabled = (d: Die) => rolling || (mexen && (turnEnded || !canHoldMexDie(mexTurn, dice.findIndex((x) => x.id === d.id))))

  const vals = dice.map((d) => d.value)
  const total = vals.reduce((a, b) => a + b, 0)
  const shownDice = dice.map((d, index) => ({ ...d, held: mexen ? mexTurn.held === index : d.held }))
  const held = shownDice.filter((d) => d.held)
  const free = shownDice.filter((d) => !d.held)
  const mexMessage = mexTurn.score?.kind === 'give' ? 'Deel een slok uit. Gratis worp: gooi opnieuw.'
    : mexTurn.score?.kind === 'out' ? '32: direct af. Je beurt is voorbij.'
    : mexTurn.score?.kind === 'mex' ? 'Mex! Hoogste worp. Je beurt is voorbij.'
    : turnEnded ? `Je beurt is voorbij. Eindscore: ${mexTurn.score?.label}.`
    : mexTurn.dice ? 'Gooi door. De laatste worp telt.' : 'Gooi beide dobbelstenen om je beurt te beginnen.'

  return (
    <GameShell icon="dobbel" title="Dobbelstenen" intro={mexen ? `${rollLimit} tellende ${rollLimit === 1 ? 'worp' : 'worpen'} per beurt. 31 is gratis, 32 is direct af.` : 'Tik een dobbelsteen om hem vast te zetten. Gooi met de knop, of zet schudden aan.'}>
      <div className="dice-toolbar">
        <div className="segmented">
          <button className={!mexen ? 'on' : ''} disabled={rolling} onClick={() => mexen && toggleMexen()}>
            Vrij gooien
          </button>
          <button className={mexen ? 'on' : ''} disabled={rolling} onClick={() => !mexen && toggleMexen()}>
            Mexen
          </button>
        </div>
        {mexen && (
          <select className="select mex-roll-limit" aria-label="Worpen per beurt" title="Worpen per beurt" value={rollLimit} disabled={rolling} onChange={(e) => setRollLimit(Number(e.target.value))}>
            <option value={3}>3</option>
            <option value={2} disabled={mexTurn.rolls > 2}>2</option>
            <option value={1} disabled={mexTurn.rolls > 1}>1</option>
          </select>
        )}
      </div>

      <Kast className="dice-kast">
        {held.length > 0 && (
          <div className="held-tray">
            <span className="tray-label">Vast</span>
            {held.map((d) => (
              <Cube key={d.id} d={d} rolling={false} disabled={dieDisabled(d)} onToggle={() => toggleDie(d)} />
            ))}
          </div>
        )}
        <div className="dice-table">
          {free.map((d) => (
            <Cube key={d.id} d={d} rolling={rolling} disabled={dieDisabled(d)} onToggle={() => toggleDie(d)} />
          ))}
          {free.length === 0 && <p className="hint">Alles staat vast. Tik er een aan om hem weer mee te gooien.</p>}
        </div>
        <p className={`dice-total ${rolling ? 'hide' : ''}`}>{mexen ? mexTurn.score?.label ?? 'Klaar?' : dice.length > 1 ? `Totaal ${total}` : `${total}`}</p>
      </Kast>

      {mexen && (
        <div className="center" role="status" aria-live="polite">
          <b>Beurt {turnNumber} · {mexTurn.rolls}/{rollLimit} worpen gebruikt</b>
          <p>{mexMessage}</p>
          {!turnEnded && <p className="hint">Tik op een 1 of 2 om die één worp te laten liggen. Bij 31 gooi je beide stenen opnieuw.</p>}
        </div>
      )}

      <div className="dice-controls">
        <button className="btn primary big-btn" onClick={mexen && turnEnded ? nextPlayer : roll} disabled={rolling || free.length === 0}>
          {mexen && turnEnded ? 'Volgende speler' : 'Gooien'}
        </button>
        {!mexen && (
          <span className="stepper">
            <button disabled={rolling} onClick={() => setDice((ds) => (ds.length > 1 ? ds.slice(0, -1) : ds))} aria-label="Dobbelsteen weghalen">
              −
            </button>
            <b>{dice.length} 🎲</b>
            <button disabled={rolling} onClick={() => setDice((ds) => (ds.length < 6 ? [...ds, newDie()] : ds))} aria-label="Dobbelsteen toevoegen">
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

      {mexen && <p className="hint center">21 is Mex (hoogst), dan dubbels (600 … 100), dan 65 t/m 32. Na {rollLimit} tellende {rollLimit === 1 ? 'worp' : 'worpen'}, 32 of Mex is de volgende speler aan de beurt. De laagste eindscore verliest de ronde.</p>}

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
