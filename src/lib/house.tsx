import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useTable } from './hooks'
import type { Housemate } from './types'

interface HouseCtx {
  housemates: Housemate[]
  active: Housemate[]
  byId: Map<string, Housemate>
  loading: boolean
}

const Ctx = createContext<HouseCtx | null>(null)

export function HouseProvider({ children }: { children: ReactNode }) {
  const { rows, loading } = useTable('housemates')

  const value = useMemo<HouseCtx>(() => {
    const byId = new Map(rows.map((h) => [h.id, h]))
    const active = rows.filter((h) => h.active).sort((a, b) => a.name.localeCompare(b.name, 'nl'))
    return { housemates: rows, active, byId, loading }
  }, [rows, loading])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHouse() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useHouse buiten HouseProvider')
  return ctx
}

export const GLASS = [
  { name: 'Geel', hex: '#f4b81c' },
  { name: 'Magenta', hex: '#e23d8f' },
  { name: 'Blauw', hex: '#2a6fd6' },
  { name: 'Groen', hex: '#239a57' },
  { name: 'Oranje', hex: '#f0702a' },
  { name: 'Rood', hex: '#d8323f' },
  { name: 'Paars', hex: '#7a4bd1' },
  { name: 'Turquoise', hex: '#2bb3b1' },
]
