import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'vite'

const bundle = await build({ configFile: false, logLevel: 'silent', build: { write: false, minify: false, lib: { entry: 'src/lib/turf.ts', formats: ['es'] } } })
const { settleMonth, purchasePresets } = await import(`data:text/javascript;base64,${Buffer.from(bundle[0].output[0].code).toString('base64')}`)
const month = new Date(2026, 9, 1)
const types = ['Bier', 'Bozu', 'Shotjes'].map((name, i) => ({ id: `d${i}`, name, active: true }))
const people = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
const purchase = (cost, quantity, type = 'd0', date = '2026-10-05T12:00:00Z') => ({ id: crypto.randomUUID(), cost_cents: cost, quantity, drink_type_id: type, created_at: date, paid_by: 'a' })
const tally = (count, type = 'd0', person = 'b', date = '2026-10-10T12:00:00Z') => ({ drink_type_id: type, housemate_id: person, count, created_at: date })
const settle = (purchases, tallies = []) => settleMonth(month, people, tallies, purchases, types)

test('two crates at €10 and €8 cost €0.375 per beer, regardless of amount drunk', () => {
  const p = [purchase(1000, 24), purchase(800, 24)]
  const result = settle(p, [tally(4)])
  assert.equal(result.categories[0].price, 37.5)
  assert.equal(result.rows.find(r => r.h.id === 'b').share, 150)
  assert.equal(settle(p, [tally(20)]).categories[0].price, 37.5)
  assert.equal(result.totalCost, 1800)
  assert.equal(result.consumedCost, 150)
})
test('mixed pack sizes are weighted by individual drinks', () => {
  assert.equal(settle([purchase(1200, 24), purchase(600, 6)]).categories[0].price, 60)
})
test('beer, Bozu and shots are priced independently and summed per person', () => {
  const result = settle([purchase(1200, 24), purchase(2400, 12, 'd1'), purchase(700, 35, 'd2')], [tally(2), tally(1, 'd1'), tally(3, 'd2')])
  assert.equal(result.rows.find(r => r.h.id === 'b').share, 360)
})
test('older purchases count, future purchases and other months consumption do not', () => {
  const result = settle([purchase(1000, 24, 'd0', '2026-09-10T12:00:00Z'), purchase(800, 24), purchase(9600, 24, 'd0', '2026-11-01T12:00:00Z')], [tally(4), tally(20, 'd0', 'b', '2026-09-10T12:00:00Z')])
  assert.equal(result.categories[0].price, 37.5)
  assert.equal(result.totalCost, 800)
  assert.equal(result.totalDrinks, 4)
  assert.equal(result.rows.find(r => r.h.id === 'b').share, 150)
})
test('round once per person after summing all categories', () => {
  const result = settle([purchase(100, 3), purchase(100, 3, 'd1')], [tally(1), tally(1, 'd1')])
  assert.equal(result.rows.find(r => r.h.id === 'b').share, 67)
})
test('missing legacy category or quantity is flagged and never guessed', () => {
  const result = settle([purchase(799, null, null)], [tally(1)])
  assert.equal(result.incomplete, true)
  assert.equal(result.incompletePurchases.length, 1)
  assert.equal(result.rows.find(r => r.h.id === 'b').share, null)
})
test('no purchase price means unknown, but explicitly free stock costs zero', () => {
  assert.equal(settle([], [tally(1)]).incomplete, true)
  assert.equal(settle([purchase(0, 24)], [tally(1)]).rows[0].share, 0)
  assert.equal(settle([], []).incomplete, false)
})
test('presets represent individual drinks and shot volumes', () => {
  assert.deepEqual(purchasePresets('Bier').map(p => p.quantity), [1, 6, 24])
  assert.deepEqual(purchasePresets('Bozu').map(p => p.quantity), [1, 12])
  assert.equal(purchasePresets('Shotjes')[0].quantity, 35)
})
