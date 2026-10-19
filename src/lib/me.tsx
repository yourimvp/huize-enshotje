import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { useHouse } from './house'
import { Avatar } from '../components/decor'

/**
 * Geen account: deze telefoon onthoudt alleen wie je bent, zodat afgestreepte
 * boodschappen bij de juiste persoon tellen.
 */
interface MeCtx {
  meId: string | null
  setMe: (id: string | null) => void
  /** Geeft je id; vraagt het eerst als het nog niet bekend is. */
  requireMe: () => Promise<string | null>
}

const Ctx = createContext<MeCtx | null>(null)
const KEY = 'enshotje:me'

function read(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function MeProvider({ children }: { children: ReactNode }) {
  const { active, byId } = useHouse()
  const [meId, setMeId] = useState<string | null>(read)
  const [asking, setAsking] = useState(false)
  const resolver = useRef<((id: string | null) => void) | null>(null)

  const setMe = useCallback((id: string | null) => {
    try {
      if (id) localStorage.setItem(KEY, id)
      else localStorage.removeItem(KEY)
    } catch {
      /* ignore */
    }
    setMeId(id)
  }, [])

  const validMe = meId && byId.get(meId)?.active ? meId : null

  const requireMe = useCallback(() => {
    if (validMe) return Promise.resolve(validMe)
    setAsking(true)
    return new Promise<string | null>((res) => {
      resolver.current = res
    })
  }, [validMe])

  const answer = (id: string | null) => {
    if (id) setMe(id)
    setAsking(false)
    resolver.current?.(id)
    resolver.current = null
  }

  return (
    <Ctx.Provider value={{ meId: validMe, setMe, requireMe }}>
      {children}
      {asking && (
        <div className="modal-backdrop" onClick={() => answer(null)}>
          <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Wie ben jij?">
            <h2 className="modal-title">Wie ben jij?</h2>
            <p className="hint">Deze telefoon onthoudt het, dan tellen je acties mee voor de prijzenkast.</p>
            <div className="who-grid">
              {active.map((h) => (
                <button key={h.id} className="who" onClick={() => answer(h.id)}>
                  <Avatar name={h.name} color={h.color} size={36} />
                  <span>{h.name}</span>
                </button>
              ))}
            </div>
            <button className="btn ghost small" onClick={() => answer(null)}>
              Annuleer
            </button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useMe() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMe buiten MeProvider')
  return ctx
}
