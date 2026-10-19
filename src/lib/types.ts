export interface Base {
  id: string
  created_at: string
}

export interface Housemate extends Base {
  name: string
  color: string
  active: boolean
}

export interface ShoppingItem extends Base {
  name: string
  note: string | null
  checked: boolean
  checked_at: string | null
  checked_by: string | null
  cleared: boolean
}

export interface DrinkType extends Base {
  name: string
  active: boolean
}

export interface DrinkPurchase extends Base {
  description: string
  cost_cents: number
  paid_by: string | null
  drink_type_id: string | null
  quantity: number | null // aantal losse drankjes / shots
}

export interface DrinkTally extends Base {
  drink_type_id: string | null
  housemate_id: string
  count: number
}

export interface Anytimer extends Base {
  owed_to: string
  owed_by: string
  reason: string | null
  redeemed_at: string | null
}

export interface Discipline extends Base {
  name: string
}

export interface TimeEntry extends Base {
  discipline_id: string
  housemate_id: string
  ms: number
}

export interface Quote extends Base {
  text: string
  said_by: string | null
  said_by_name: string | null
  context: string | null
}

export interface AgendaEvent extends Base {
  title: string
  date: string // YYYY-MM-DD
  time: string | null
  note: string | null
}

export interface GameResult extends Base {
  game: string
  winner_id: string
}

export interface AchievementUnlock extends Base {
  housemate_id: string
  key: string
}

export interface Tables {
  housemates: Housemate
  shopping_items: ShoppingItem
  drink_types: DrinkType
  drink_purchases: DrinkPurchase
  drink_tallies: DrinkTally
  anytimers: Anytimer
  disciplines: Discipline
  times: TimeEntry
  quotes: Quote
  events: AgendaEvent
  game_results: GameResult
  achievement_unlocks: AchievementUnlock
}

export type TableName = keyof Tables
