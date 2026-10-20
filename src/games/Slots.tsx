import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { GameShell } from '../components/game'
import { GlassStrip } from '../components/decor'
import { SlotSymbol } from '../components/SlotSymbol'
import { fireConfetti } from '../components/Achievements'
import { evaluateSlots, randomSlotSymbol, SLOT_LINES, SLOT_NAMES, SLOT_SYMBOLS, spinSlots, TRIPLE_PAYOUT, type LineCount, type SlotGrid } from '../lib/slots'

const INITIAL: SlotGrid = [['door','cow','beer'],['shot','dice','horse'],['cow','beer','shot']]
const STEPS = 18
const slokken = (n: number) => n === 1 ? '1 slok' : `${n} slokken`
const linePath = (rows: readonly number[]) => rows.map((row,col)=>`${col ? 'L' : 'M'}${50 + col * 100},${50 + row * 100}`).join(' ')
interface Round {
  id: number
  grid: SlotGrid
  strips: ReturnType<typeof randomSlotSymbol>[][]
  result: ReturnType<typeof evaluateSlots>
  reduced: boolean
}

export default function Slots() {
  const [lines, setLines] = useState<LineCount>(1)
  const [round, setRound] = useState<Round | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const busy = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const counter = useRef(0)
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  function spin() {
    if (busy.current) return
    busy.current = true
    const grid = spinSlots()
    const result = evaluateSlots(grid, lines)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const strips = [0,1,2].map(col => [
      ...Array.from({length:STEPS},()=>randomSlotSymbol()),
      ...grid.map(row=>row[col]),
    ])
    setShowResult(false)
    setSpinning(true)
    setRound({ id: ++counter.current, grid, strips, result, reduced })
    timers.current.forEach(clearTimeout)
    timers.current = [setTimeout(() => {
      busy.current = false
      setSpinning(false)
      setShowResult(true)
      if (result.wins.some(w=>w.symbol === 'door' && w.matches === 3)) fireConfetti()
    }, reduced ? 50 : 2100)]
  }

  const grid = round?.grid ?? INITIAL
  const wins = showResult && round ? round.result.wins : []
  const payout = showResult && round ? round.result.payout : 0
  const activeLines = spinning && round ? round.result.stake : lines
  const symbolText = spinning ? 'De rollen draaien.' : grid.map(row=>row.map(s=>SLOT_NAMES[s]).join(', ')).join('. ')

  return <GameShell icon="slots" title="Slots" intro="Een beetje huisgeluk.">
    <section className={`slots-machine ${spinning ? 'slots-spinning' : ''}`} data-noswipe>
      <header className="slots-marquee"><span className="slots-light" /><strong>Enshotje</strong><span className="slots-light" /></header>
      <div className="slots-settings">
        <span className="slots-setting-label">Lijnen & inzet</span>
        <div className="slots-line-picker" role="radiogroup" aria-label="Lijnen en inzet">
          {([1,3,5] as const).map(n=><button key={n} type="button" role="radio" aria-checked={lines === n} disabled={spinning} className={lines === n ? 'on' : ''}
            onClick={()=>{ setLines(n); setShowResult(false) }} aria-label={`${n} ${n === 1 ? 'lijn' : 'lijnen'}, ${slokken(n)} inzet`}>
            <b>{n}</b><span>{n === 1 ? 'lijn' : 'lijnen'}</span>
          </button>)}
        </div>
        <p>Eerst <strong>{slokken(lines)} zelf</strong>. Wat je wint, deel je uit.</p>
      </div>

      <div className="slots-body">
        <div className="slots-window" role="img" aria-label={symbolText} aria-busy={spinning}>
          <div className="slots-reels">
            {[0,1,2].map(col=><div className="slots-reel" key={col}>
              <div key={`${round?.id ?? 0}-${col}`} className={`slots-track ${round ? 'slots-rolled' : ''}`}
                style={{'--roll-time': `${round?.reduced ? 1 : 1300 + col * 350}ms`} as CSSProperties}>
                {(round ? round.strips[col] : grid.map(row=>row[col])).map((symbol,index)=><div className="slots-cell" key={index}><SlotSymbol symbol={symbol} /></div>)}
              </div>
            </div>)}
          </div>
          <svg className="slots-line-overlay" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden>
            {SLOT_LINES.slice(0,activeLines).map((line,index)=><path key={index} d={linePath(line.rows)} stroke={line.color} className={wins.some(w=>w.line===index) ? 'slots-winning-line' : 'slots-active-line'} />)}
          </svg>
          {!spinning && wins.map(win=>SLOT_LINES[win.line].rows.map((row,col)=>{
            const symbol = grid[row][col]
            return symbol === win.symbol ? <span key={`${win.line}-${col}`} className="slots-winning-cell" style={{'--row':row,'--col':col,'--line-color':SLOT_LINES[win.line].color} as CSSProperties} /> : null
          }))}
        </div>
        <button className="slots-lever" type="button" aria-label="Trek aan de hendel" onClick={spin} disabled={spinning}><span className="slots-lever-knob" /><span className="slots-lever-arm" /><span className="slots-lever-base" /></button>
      </div>
      <div className="slots-line-key" aria-label="Actieve speellijnen">{SLOT_LINES.slice(0,activeLines).map((line,i)=><span key={line.name} style={{'--line-color':line.color} as CSSProperties}><i />{i+1}</span>)}<span>{activeLines} {activeLines === 1 ? 'lijn actief' : 'lijnen actief'}</span></div>
      <button className="btn slots-spin-button" type="button" onClick={spin} disabled={spinning}>{spinning ? 'Rollen maar…' : `Neem ${slokken(lines)} & draai`}</button>
      <div className={`slots-result ${showResult && payout ? 'has-win' : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {spinning ? <><strong>Even afwachten…</strong><span>De laatste rol beslist.</span></> : showResult && round ? <>
          <strong>{payout ? `Deel ${slokken(payout)} uit!` : 'Niks gewonnen.'}</strong>
          <span>{payout ? `${round.result.stake} ${round.result.stake === 1 ? 'lijn' : 'lijnen'} gespeeld · inzet ${slokken(round.result.stake)}` : 'Deze keer blijft het bij je inzet. Geef maar door.'}</span>
        </> : <><strong>Wie trekt er aan de hendel?</strong><span>Twee dezelfde of drie op een actieve lijn.</span></>}
      </div>
      {showResult && wins.length > 0 && <ul className="slots-win-list">{wins.map(win=><li key={win.line}><span className="slots-line-number" style={{background:SLOT_LINES[win.line].color}}>{win.line+1}</span><span>{win.matches}× {SLOT_NAMES[win.symbol]}</span><strong>{slokken(win.payout)} uitdelen</strong></li>)}</ul>}
      <GlassStrip cells={24} size={10} />
    </section>
    <details className="card slots-rules"><summary>Combinaties & speellijnen</summary>
      <p>Je inzet is één slok per actieve lijn. Twee dezelfde symbolen op een lijn = <strong>1 slok uitdelen</strong>, ook als ze niet naast elkaar staan. Drie dezelfde leveren de prijs hieronder op. Elke lijn telt één keer; prijzen op verschillende lijnen tellen op.</p>
      <div className="slots-payouts">{SLOT_SYMBOLS.map(symbol=><div key={symbol}><SlotSymbol symbol={symbol} /><span>3× {SLOT_NAMES[symbol]}</span><strong>{TRIPLE_PAYOUT[symbol]} uitdelen</strong></div>)}</div>
      <div className="slots-line-guide">{SLOT_LINES.map((line,index)=><div key={line.name}><svg viewBox="0 0 300 300" aria-hidden><path d={linePath(line.rows)} stroke={line.color} /></svg><span>{index+1}. {line.name}</span></div>)}</div>
    </details>
  </GameShell>
}
