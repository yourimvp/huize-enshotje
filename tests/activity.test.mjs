import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'

const bundle = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: 'src/lib/activity.ts', formats: ['es'] } } })
const { weeklyDrinkStats, isPersonalRecord } = await import(`data:text/javascript;base64,${Buffer.from(bundle[0].output[0].code).toString('base64')}`)
const week = new Date(2026, 9, 19)
const types = [{ id: 'beer', name: 'Bier' }, { id: 'bozu', name: 'Bozu' }]
const tally = (person, count, day = 19, type = 'beer') => ({ housemate_id: person, count, created_at: new Date(2026, 9, day, 12).toISOString(), drink_type_id: type })

test('four beers and one beer give one stacked day with 80% and 20%', () => {
  const s = weeklyDrinkStats([tally('Youri', 4), tally('Amke', 1)], types, week)
  assert.equal(s.days[0], 5)
  assert.equal(s.total, 5)
  assert.equal(s.peopleByDay[0].get('Youri') / s.days[0], 0.8)
  assert.equal(s.peopleByDay[0].get('Amke') / s.days[0], 0.2)
  assert.deepEqual(s.top, ['Youri', 4])
})
test('person counts accumulate per day, with drink categories still counted separately', () => {
  const s = weeklyDrinkStats([tally('a', 2), tally('a', 3, 19, 'bozu'), tally('b', 4, 20)], types, week)
  assert.equal(s.peopleByDay[0].get('a'), 5)
  assert.equal(s.peopleByDay[1].get('b'), 4)
  assert.equal(s.total, 9)
  assert.deepEqual(s.byType, [['Bier', 6], ['Bozu', 3]])
  assert.equal(s.peopleByDay[2].size, 0)
})
test('previous week, older dates and next week never leak into current day bars', () => {
  const s = weeklyDrinkStats([tally('a', 1, 18), tally('a', 10, 11), tally('a', 2, 19), tally('a', 3, 25), tally('a', 20, 26)], types, week)
  assert.equal(s.prev, 1)
  assert.equal(s.total, 5)
  assert.deepEqual(s.days, [2, 0, 0, 0, 0, 0, 3])
})
test('empty week and unknown drink type remain readable', () => {
  const empty = weeklyDrinkStats([], types, week)
  assert.equal(empty.total, 0)
  assert.equal(empty.top, undefined)
  assert.equal(empty.days.length, 7)
  assert.deepEqual(weeklyDrinkStats([tally('a', 1, 19, null)], types, week).byType, [['Overig', 1]])
})
const times = [
  { housemate_id: 'a', discipline_id: 'rietbak', ms: 4000 },
  { housemate_id: 'a', discipline_id: 'rietbak', ms: 3500 },
  { housemate_id: 'a', discipline_id: 'sg', ms: 2000 },
  { housemate_id: 'b', discipline_id: 'rietbak', ms: 1500 },
]
test('strict improvement of existing personal category best celebrates', () => {
  assert.equal(isPersonalRecord(times, 'a', 'rietbak', 3400), true)
})
test('equal, slower or invalid times do not celebrate', () => {
  for (const ms of [3500, 3700, 4500, 0, -1, NaN, Infinity]) assert.equal(isPersonalRecord(times, 'a', 'rietbak', ms), false)
})
test('first result and another person or category never trigger a false personal record', () => {
  assert.equal(isPersonalRecord(times, 'new', 'rietbak', 1000), false)
  assert.equal(isPersonalRecord(times, 'b', 'sg', 1000), false)
  assert.equal(isPersonalRecord(times, 'a', 'sg', 3400), false)
  assert.equal(isPersonalRecord(times, 'a', 'rietbak', 3400), true)
})
