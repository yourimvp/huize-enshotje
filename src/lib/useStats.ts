import { useMemo } from 'react'
import { useTable } from './hooks'
import { useHouse } from './house'
import { computeStats } from './achievements'

/** Laadt alles wat nodig is voor achievements en profielen. */
export function useStats() {
  const { housemates } = useHouse()
  const tallies = useTable('drink_tallies').rows
  const types = useTable('drink_types').rows
  const games = useTable('game_results').rows
  const events = useTable('game_events').rows
  const shopping = useTable('shopping_items').rows
  const anys = useTable('anytimers').rows
  const quotes = useTable('quotes').rows
  const stats = useMemo(
    () => computeStats({ housemates, tallies, types, games, events, shopping, anys, quotes }),
    [housemates, tallies, types, games, events, shopping, anys, quotes],
  )
  return { stats, tallies, types, games, events, quotes, anys }
}
