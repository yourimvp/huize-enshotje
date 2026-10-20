import { useMemo } from 'react'
import { useTable } from './hooks'
import { useHouse } from './house'
import { computeStats, computeAchievementStats } from './achievements'

/** Laadt alles wat nodig is voor achievements en profielen. */
export function useStats() {
  const { housemates, loading: houseLoading } = useHouse()
  const talliesTable = useTable('drink_tallies')
  const tallies = talliesTable.rows
  const typesTable = useTable('drink_types')
  const types = typesTable.rows
  const gamesTable = useTable('game_results')
  const games = gamesTable.rows
  const eventsTable = useTable('game_events')
  const events = eventsTable.rows
  const shoppingTable = useTable('shopping_items')
  const shopping = shoppingTable.rows
  const anysTable = useTable('anytimers')
  const anys = anysTable.rows
  const quotesTable = useTable('quotes')
  const quotes = quotesTable.rows
  const stats = useMemo(
    () => computeStats({ housemates, tallies, types, games, events, shopping, anys, quotes }),
    [housemates, tallies, types, games, events, shopping, anys, quotes],
  )
  const achievementStats = useMemo(
    () => computeAchievementStats({ housemates, tallies, types, games, events, shopping, anys, quotes }),
    [housemates, tallies, types, games, events, shopping, anys, quotes],
  )
  const pending = houseLoading || [talliesTable, typesTable, gamesTable, eventsTable, shoppingTable, anysTable, quotesTable].some((t) => t.loading || t.error)
  return { achievementStats, pending, stats, tallies, types, games, events, quotes, anys }
}
