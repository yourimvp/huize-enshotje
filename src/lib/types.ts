export interface Base {
  id: string
  created_at: string
}

export interface Housemate extends Base {
  name: string
  color: string
  active: boolean
  user_id?: string | null
  pin_version?: number
  avatar_url?: string | null
  achievements_since?: string | null
  is_admin?: boolean
}

export interface ShoppingItem extends Base {
  name: string
  note: string | null
  checked: boolean
  checked_at: string | null
  checked_by: string | null
  cleared: boolean
  added_by?: string | null
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
  epoch?: string | null
  housemate_id: string
  key: string
}

export interface GameEvent extends Base {
  kind: string // 'egg_break' | 'duel_misfire' | 'duel_reaction' | 'wheel_spin' …
  housemate_id: string
  value: number | null
}

export interface WheelSegment {
  label: string
  color?: string
  action?: 'any_for_spinner' | 'any_on_spinner'
}

export interface Wheel extends Base {
  name: string
  segments: WheelSegment[]
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
  game_events: GameEvent
  wheels: Wheel
}

export type TableName = keyof Tables
