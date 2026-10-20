import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'
const bundle=await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry:'src/lib/slots.ts',formats:['es']}}})
const {SLOT_SYMBOLS,SLOT_LINES,TRIPLE_PAYOUT,slotLinePayout,evaluateSlots,spinSlots}=await import(`data:text/javascript;base64,${Buffer.from(bundle[0].output[0].code).toString('base64')}`)
test('all six house symbols have a triple payout, with the door as the largest prize',()=>{
  assert.equal(SLOT_SYMBOLS.length,6)
  for(const s of SLOT_SYMBOLS) assert.deepEqual(slotLinePayout([s,s,s]),{symbol:s,matches:3,payout:TRIPLE_PAYOUT[s]})
  assert.equal(Math.max(...Object.values(TRIPLE_PAYOUT)),TRIPLE_PAYOUT.door)
})
test('two equal symbols pay once, including non-adjacent matches; triples never add the pair price',()=>{
  for(const symbols of [['cow','beer','cow'],['beer','cow','cow'],['cow','cow','beer']]) assert.equal(slotLinePayout(symbols).payout,1)
  assert.equal(slotLinePayout(['door','door','door']).payout,30)
  assert.equal(slotLinePayout(['door','beer','cow']),null)
})
test('only selected lines pay; each line costs one sip regardless of outcome',()=>{
  const board=[['door','door','door'],['beer','cow','shot'],['dice','horse','cow']]
  assert.equal(evaluateSlots(board,1).payout,0)
  assert.equal(evaluateSlots(board,3).payout,30)
  for(const n of [1,3,5]) assert.equal(evaluateSlots(board,n).stake,n)
})
test('five lines include both diagonals and add all wins without paying twice for a line',()=>{
  const board=[['door','beer','door'],['shot','door','horse'],['door','dice','door']]
  const result=evaluateSlots(board,5)
  assert.deepEqual(result.wins.map(w=>w.line),[1,2,3,4])
  assert.equal(result.payout,62)
  assert.equal(new Set(result.wins.map(w=>w.line)).size,result.wins.length)
})
test('a spin can lose on all five lines',()=>{
  const board=[['door','cow','beer'],['shot','dice','horse'],['cow','beer','shot']]
  assert.equal(evaluateSlots(board,5).wins.length,0)
  assert.equal(evaluateSlots(board,5).payout,0)
})
test('enumerating all 216 equally likely lines proves 25/27 average payout per sip, below the stake',()=>{
  let payout=0,blanks=0
  for(const a of SLOT_SYMBOLS) for(const b of SLOT_SYMBOLS) for(const c of SLOT_SYMBOLS){
    const result=slotLinePayout([a,b,c]);payout+=result?.payout??0;if(!result) blanks++
  }
  assert.equal(payout,200)
  assert.equal(blanks,120)
  assert.equal(payout/216,25/27)
  assert.ok(payout/216<1)
  // Iedere lijn bevat drie verschillende cellen: dezelfde verwachting geldt voor 1, 3 en 5 lijnen.
  for(const line of SLOT_LINES) assert.equal(new Set(line.rows.map((r,c)=>`${r},${c}`)).size,3)
})
test('grid generation uses nine independent draws, including edge values',()=>{
  let calls=0;const grid=spinSlots(()=>{calls++;return calls%2?0:0.999999})
  assert.equal(calls,9)
  assert.equal(grid.length,3)
  assert.equal(grid[0][0],'door')
  assert.equal(grid[0][1],'horse')
})
