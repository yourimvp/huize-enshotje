import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'
async function load(entry) {
  const b = await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry,formats:['es']}}})
  return import(`data:text/javascript;base64,${Buffer.from(b[0].output[0].code).toString('base64')}`)
}
const {pourTitanic,titanicCapacity}=await load('src/lib/titanic.ts')
const {computeAchievementStats,computeStats}=await load('src/lib/achievements.ts')
test('Titanic fills only for held time and sinks exactly at hidden capacity',()=>{
  assert.deepEqual(pourTitanic(0,1000,.9),{fill:.06,sunk:false})
  assert.deepEqual(pourTitanic(.88,1000,.9),{fill:.9,sunk:true})
  assert.deepEqual(pourTitanic(.4,0,.9),{fill:.4,sunk:false})
  assert.deepEqual(pourTitanic(.4,-1000,.9),{fill:.4,sunk:false})
  assert.equal(titanicCapacity(0),.82)
  assert.equal(titanicCapacity(1),.98)
})
test('Titanic duration is independent of frame rate, including a long final frame',()=>{
  let fill=0
  for(let i=0;i<120;i++) fill=pourTitanic(fill,1000/60,.9).fill
  assert.ok(Math.abs(fill-pourTitanic(0,2000,.9).fill)<1e-12)
  assert.equal(pourTitanic(0,100000,.9).sunk,true)
})
const before='2026-10-19T20:00:00Z', after='2026-10-20T02:00:00Z', cutoff='2026-10-20T01:00:00Z'
const input={housemates:[{id:'a',name:'Amke',achievements_since:cutoff},{id:'b',name:'Youri',achievements_since:cutoff}],types:[],tallies:[{housemate_id:'a',created_at:before,count:5},{housemate_id:'a',created_at:after,count:1}],games:[{winner_id:'a',game:'Mines',created_at:before},{winner_id:'b',game:'Mines',created_at:after}],events:[{housemate_id:'a',kind:'egg_break',created_at:before}],quotes:[{said_by:'a',created_at:before}],shopping:[{checked:true,checked_by:'a',created_at:before,checked_at:after}],anys:[{owed_to:'a',owed_by:'b',created_at:before,redeemed_at:null},{owed_to:'b',owed_by:'a',created_at:before,redeemed_at:after}]}
test('reset excludes old progress, preserving complete historical profile stats',()=>{
  const stats=computeAchievementStats(input)
  assert.equal(stats.get('a').totalDrinks,1)
  assert.equal(stats.get('a').wins,0)
  assert.equal(stats.get('a').quoted,0)
  assert.equal(stats.get('a').eggBreaks,0)
  assert.equal(stats.get('a').anysHolding,0)
  assert.equal(stats.get('b').wins,1)
  assert.equal(computeStats(input).get('a').totalDrinks,6)
  assert.equal(computeStats(input).get('a').wins,1)
})
test('actions on older shopping and anytimer rows count when completed after reset',()=>{
  const a=computeAchievementStats(input).get('a')
  assert.equal(a.checkedItems,1)
  assert.equal(a.anysPaid,1)
})
test('no reset timestamp leaves existing achievement behaviour unchanged',()=>{
  const data={...input,housemates:input.housemates.map(h=>({...h,achievements_since:null}))}
  assert.deepEqual(computeAchievementStats(data),computeStats(data))
})
