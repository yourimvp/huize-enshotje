import { useMemo, useState } from 'react'
import { useHouse } from '../lib/house'
import { insert } from '../lib/db'
import { GameShell, Kast, PlayerSelect } from '../components/game'

const EGG = 'M100 12 C150 12 186 100 186 158 C186 218 148 250 100 250 C52 250 14 218 14 158 C14 100 50 12 100 12 Z'
const CRACKS = 16

/** Willekeurige barstjes, elk vanaf de rand van het ei naar binnen. */
function makeCracks(): string[] {
  const out: string[] = []
  for (let i = 0; i < CRACKS; i++) {
    const a = Math.random() * Math.PI * 2
    let x = 100 + Math.cos(a) * 78
    let y = 150 + Math.sin(a) * 95
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`
    const steps = 4 + Math.floor(Math.random() * 4)
    for (let s = 0; s < steps; s++) {
      const dir = Math.atan2(150 - y, 100 - x) + (Math.random() - 0.5) * 1.9
      const len = 10 + Math.random() * 14
      x += Math.cos(dir) * len
      y += Math.sin(dir) * len
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`
    }
    out.push(d)
  }
  return out
}

function newEgg() {
  return { breakAt: 6 + Math.floor(Math.random() * 25), cracks: makeCracks(), noise: 0.75 + Math.random() * 0.35 }
}

export default function Ei() {
  const { byId } = useHouse()
  const [egg, setEgg] = useState(newEgg)
  const [taps, setTaps] = useState(0)
  const [wobble, setWobble] = useState(0)
  const [players, setPlayers] = useState<string[]>([])
  const broken = taps >= egg.breakAt

  // Hoe ver het ei open is, met wat ruis zodat je niet kunt uitrekenen wanneer hij breekt
  const visible = useMemo(() => {
    if (broken) return CRACKS
    const p = Math.pow(taps / egg.breakAt, 1.3) * egg.noise
    return Math.min(CRACKS - 2, Math.round(p * CRACKS))
  }, [taps, egg, broken])

  const turn = players.length ? players[taps % players.length] : null
  const loser = broken && players.length ? players[(taps - 1) % players.length] : null

  function tap() {
    if (broken) return
    const next = taps + 1
    setTaps(next)
    setWobble((w) => w + 1)
    navigator.vibrate?.(next >= egg.breakAt ? [80, 40, 160] : 15)
    if (next >= egg.breakAt && players.length) {
      insert('game_events', { kind: 'egg_break', housemate_id: players[(next - 1) % players.length], value: next })
    }
  }

  function reset() {
    setEgg(newEgg())
    setTaps(0)
  }

  return (
    <GameShell icon="ei" title="Crack the egg" intro="Tik om de beurt op het ei. Niemand weet na hoeveel tikken hij breekt. Wie hem breekt, drinkt.">
      <section className="card">
        <h2 className="card-title">Spelers (optioneel, in volgorde)</h2>
        <PlayerSelect value={players} onChange={(p) => (taps === 0 || broken) && setPlayers(p)} />
      </section>

      <Kast className="egg-stage">
        {!broken ? (
          <p className="egg-turn">{turn ? <>Aan de beurt: <b>{byId.get(turn)?.name}</b></> : 'Tik op het ei'}</p>
        ) : (
          <p className="egg-turn boom">KRAK! {loser ? <><b>{byId.get(loser)?.name}</b> drinkt!</> : 'Drinken!'} 🍺</p>
        )}
        <button className={`egg-btn ${broken ? 'broken' : ''}`} onClick={tap} aria-label="Tik op het ei" key={broken ? 'b' : 'e'}>
          <svg viewBox="0 0 200 270" width="220" height="297" className="egg-svg" style={{ ['--w' as string]: wobble % 2 ? 1 : -1 }}>
            <defs>
              <radialGradient id="egg-shade" cx="38%" cy="32%" r="75%">
                <stop offset="0%" stopColor="#fffdf7" />
                <stop offset="70%" stopColor="#f3e7cf" />
                <stop offset="100%" stopColor="#dccaa5" />
              </radialGradient>
              <clipPath id="egg-clip">
                <path d={EGG} />
              </clipPath>
            </defs>
            {!broken ? (
              <g key={wobble} className="egg-body">
                <path d={EGG} fill="url(#egg-shade)" />
                <path d={EGG} fill="url(#satin)" opacity=".5" />
                <path d={EGG} fill="none" stroke="#b9a37a" strokeWidth="2" strokeDasharray="5 3" />
                <g clipPath="url(#egg-clip)">
                  {egg.cracks.slice(0, visible).map((d, i) => (
                    <path key={i} d={d} fill="none" stroke="#5c4a2e" strokeWidth={2.4 - i * 0.06} strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                </g>
              </g>
            ) : (
              <g>
                <ellipse cx="100" cy="232" rx="78" ry="22" fill="#fbfaf5" stroke="#e6dfcd" />
                <g className="half bottom" clipPath="url(#egg-clip)">
                  <path d="M14 175 L40 160 L60 178 L82 158 L104 180 L126 160 L148 178 L170 160 L186 172 L186 270 L14 270 Z" fill="url(#egg-shade)" />
                </g>
                <g className="half top">
                  <g clipPath="url(#egg-clip)">
                    <path d="M14 175 L40 160 L60 178 L82 158 L104 180 L126 160 L148 178 L170 160 L186 172 L186 0 L14 0 Z" fill="url(#egg-shade)" />
                  </g>
                </g>
                <g className="yolk">
                <circle cx="100" cy="226" r="30" fill="#f6b51e" />
                <circle cx="91" cy="218" r="8" fill="#ffd56b" />
                </g>
              </g>
            )}
          </svg>
        </button>
        <p className="meta">{broken ? `Gebroken na ${taps} tikken` : `${taps} ${taps === 1 ? 'tik' : 'tikken'}`}</p>
        {broken && (
          <button className="btn primary" onClick={reset}>
            Nieuw ei
          </button>
        )}
      </Kast>
    </GameShell>
  )
}
