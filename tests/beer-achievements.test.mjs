import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'

const bundle = await build({configFile:false,logLevel:'silent',build:{write:false,minify:false,lib:{entry:'src/lib/achievements.ts',formats:['es']}}})
const {ACHIEVEMENTS,computeStats,computeAchievementStats} = await import(`data:text/javascript;base64,${Buffer.from(bundle[0].output[0].code).toString('base64')}`)
const now = new Date('2026-10-20T12:00:00Z')
const person = (id, achievements_since = null) => ({id,name:id,achievements_since})
const tally = (housemate_id,month,count,drink_type_id='beer') => ({housemate_id,drink_type_id,count,created_at:`${month}-15T12:00:00Z`})
const input = (tallies,housemates=[person('a'),person('b')]) => ({housemates,tallies,types:[{id:'beer',name:'Bier'},{id:'bozu',name:'Bozu'},{id:'shot',name:'Shots'}],games:[],events:[],shopping:[],anys:[],quotes:[]})

test('25, 50 and 100 beer milestones count beer quantities only, at their exact thresholds', () => {
  for (const count of [24,25,49,50,99,100]) {
    const stats = computeStats(input([tally('a','2026-09',count),tally('a','2026-09',500,'bozu'),tally('a','2026-09',500,'shot')]),now).get('a')
    assert.equal(stats.beer,count)
    for (const target of [25,50,100]) {
      const achievement = ACHIEVEMENTS.find(a=>a.key===`beer-${target}`)
      assert.ok(achievement)
      assert.equal(achievement.value(stats)>=achievement.target,count>=target)
    }
  }
})

test('four consecutive completed beer championships award all three pils titles', () => {
  const tallies = ['2026-06','2026-07','2026-08','2026-09'].flatMap(month=>[tally('a',month,10),tally('b',month,9),tally('b',month,100,'bozu')])
  const stats = computeStats(input(tallies.reverse()),now).get('a')
  assert.equal(stats.beerMonthWins,4)
  assert.equal(stats.bestBeerMonthStreak,4)
  for (const title of ['Prins pils','Koning pils','Keizer des pils']) {
    const achievement = ACHIEVEMENTS.find(a=>a.title===title)
    assert.ok(achievement)
    assert.ok(achievement.value(stats)>=achievement.target)
  }
})

test('gaps and losses break a reign, and a new year still has consecutive months', () => {
  const tallies = [tally('a','2025-12',10),tally('a','2026-01',10),tally('a','2026-03',10),tally('b','2026-04',10),tally('a','2026-05',10)]
  const stats = computeStats(input(tallies),now).get('a')
  assert.equal(stats.beerMonthWins,4)
  assert.equal(stats.bestBeerMonthStreak,2)
})

test('current and future months do not award titles, and future beer does not unlock milestones', () => {
  const stats = computeStats(input([tally('a','2026-09',1),tally('a','2026-10',10),tally('a','2026-11',500)]),now).get('a')
  assert.equal(stats.beer,11)
  assert.equal(stats.beerMonthWins,1)
  assert.equal(stats.bestBeerMonthStreak,1)
})

test('positive tied leaders both win; a month without beer gives no title', () => {
  const stats = computeStats(input([tally('a','2026-08',10),tally('b','2026-08',10),tally('a','2026-09',0),tally('b','2026-09',100,'bozu')]),now)
  assert.equal(stats.get('a').beerMonthWins,1)
  assert.equal(stats.get('b').beerMonthWins,1)
})

test('Amsterdam month boundaries exclude an unfinished local month', () => {
  const tallies = [{housemate_id:'a',drink_type_id:'beer',count:5,created_at:'2026-09-30T22:30:00Z'}]
  const stats = computeStats(input(tallies),new Date('2026-10-01T00:30:00Z')).get('a')
  assert.equal(stats.beer,5)
  assert.equal(stats.beerMonthWins,0)
})

test('resets restart beer quantities and require complete months without erasing rivals earlier tallies', () => {
  const tallies = [tally('a','2026-01',100),tally('a','2026-02',100),tally('a','2026-03',10),tally('a','2026-04',10),{housemate_id:'b',drink_type_id:'beer',count:20,created_at:'2026-03-01T12:00:00Z'}]
  const data = input(tallies,[person('a','2026-03-10T00:00:00Z'),person('b')])
  const stats = computeAchievementStats(data,now).get('a')
  assert.equal(stats.beer,20)
  assert.equal(stats.beerMonthWins,1)
  assert.equal(stats.bestBeerMonthStreak,1)
  assert.equal(computeStats(data,now).get('a').beer,220)
  const monthStart = input([tally('a','2026-04',10)],[person('a','2026-03-31T22:00:00Z')])
  assert.equal(computeAchievementStats(monthStart,now).get('a').beerMonthWins,1)
})
