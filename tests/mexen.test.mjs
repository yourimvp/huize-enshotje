import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'

const bundle = await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry:'src/lib/mexen.ts',formats:['es']}}})
const {newMexTurn,mexScore,finishMexRoll,canHoldMexDie,toggleMexHold} = await import(`data:text/javascript;base64,${Buffer.from(bundle[0].output[0].code).toString('base64')}`)

test('31 is free even after two counted throws; repeated 31s never finish the turn', () => {
  let turn = newMexTurn()
  for (const dice of [[6,5],[5,4],[3,1],[1,3],[3,1]]) turn = finishMexRoll(turn,dice)
  assert.equal(turn.rolls,2)
  assert.equal(turn.ended,false)
  assert.equal(turn.score.kind,'give')
  assert.equal(canHoldMexDie(turn,1),false)
  turn = finishMexRoll(turn,[4,1])
  assert.equal(turn.rolls,3)
  assert.equal(turn.ended,true)
  assert.equal(turn.score.rank,41)
})

test('32 ends the turn immediately in either order and prevents additional throws', () => {
  for (const dice of [[3,2],[2,3]]) {
    const turn = finishMexRoll(newMexTurn(),dice)
    assert.equal(turn.ended,true)
    assert.equal(turn.rolls,1)
    assert.equal(turn.score.kind,'out')
    assert.equal(finishMexRoll(turn,[6,6]),turn)
    assert.equal(canHoldMexDie(turn,1),false)
  }
})

test('the selected limit of one or two throws persists through free 31s', () => {
  for (const limit of [1,2]) {
    let turn = newMexTurn()
    for (let i=0;i<limit;i++) {
      turn = finishMexRoll(turn,[3,1],limit)
      assert.equal(turn.ended,false)
      turn = finishMexRoll(turn,[6,4],limit)
      assert.equal(turn.ended,i===limit-1)
    }
    assert.equal(turn.rolls,limit)
    assert.equal(finishMexRoll(turn,[6,6],limit),turn)
  }
})

test('the third counted throw ends the turn and the last score replaces a better earlier one', () => {
  let turn = finishMexRoll(newMexTurn(),[6,6])
  assert.equal(turn.ended,false)
  turn = finishMexRoll(turn,[5,5])
  assert.equal(turn.ended,false)
  turn = finishMexRoll(turn,[4,1])
  assert.equal(turn.ended,true)
  assert.equal(turn.score.rank,41)
  assert.deepEqual(newMexTurn(),{rolls:0,dice:null,score:null,held:null,heldLastRoll:null,ended:false})
})

test('only one 1 or 2 can be held, for one subsequent throw, and it can be released', () => {
  assert.equal(canHoldMexDie(newMexTurn(),0),false)
  let turn = finishMexRoll(newMexTurn(),[4,1])
  assert.equal(canHoldMexDie(turn,0),false)
  assert.equal(canHoldMexDie(turn,1),true)
  turn = toggleMexHold(turn,1)
  assert.equal(turn.held,1)
  assert.equal(toggleMexHold(turn,1).held,null)
  turn = finishMexRoll(turn,[2,1])
  assert.equal(turn.held,null)
  assert.equal(turn.ended,true)
  assert.equal(canHoldMexDie(turn,1),false)

  turn = toggleMexHold(finishMexRoll(newMexTurn(),[2,2]),0)
  turn = toggleMexHold(turn,1)
  assert.equal(turn.held,1)
  turn = finishMexRoll(turn,[4,2])
  assert.equal(canHoldMexDie(turn,1),false)
  assert.equal(turn.held,null)
})

test('all 36 combinations score symmetrically, with Mex above doubles above normal throws', () => {
  for (let a=1;a<=6;a++) for (let b=1;b<=6;b++) assert.deepEqual(mexScore(a,b),mexScore(b,a))
  assert.ok(mexScore(2,1).rank > mexScore(6,6).rank)
  assert.ok(mexScore(1,1).rank > mexScore(6,5).rank)
  assert.equal(mexScore(3,1).kind,'give')
  assert.equal(mexScore(3,2).rank,32)
})
