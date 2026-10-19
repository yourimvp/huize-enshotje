import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { DEMO, supabase } from './db'
import { useHouse } from './house'
import type { Housemate } from './types'

/**
 * Accounts zonder gedoe: je kiest je naam en een pincode van 4 cijfers.
 * Onder water is dat een Supabase-account met een nep-e-mailadres; de sessie
 * blijft in de browser bewaard, dus je blijft ingelogd.
 */
interface MeCtx {
  ready: boolean
  session: Session | null
  me: Housemate | null
  meId: string | null
  isAdmin: boolean
  /** Voor oude aanroepen: geeft gewoon je id terug. */
  requireMe: () => Promise<string | null>
  login: (h: Housemate, pin: string) => Promise<void>
  claim: (h: Housemate, pin: string) => Promise<void>
  logout: () => Promise<void>
  resetPin: (h: Housemate) => Promise<void>
}

const Ctx = createContext<MeCtx | null>(null)

const emailFor = (h: Housemate) => `h${h.id.replace(/-/g, '')}v${h.pin_version ?? 1}@huizeenshotje.nl`
const passwordFor = (pin: string) => `enshotje-pin-${pin}`

export function MeProvider({ children }: { children: ReactNode }) {
  const { housemates } = useHouse()
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(DEMO)

  useEffect(() => {
    if (DEMO) return
    supabase!.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const me = useMemo(() => {
    if (DEMO) return housemates.find((h) => h.active) ?? null
    const uid = session?.user.id
    return (uid && housemates.find((h) => h.user_id === uid)) || null
  }, [housemates, session])

  const login = useCallback(async (h: Housemate, pin: string) => {
    const { error } = await supabase!.auth.signInWithPassword({ email: emailFor(h), password: passwordFor(pin) })
    if (error) throw new Error(error.message.includes('Invalid') ? 'Verkeerde pincode' : error.message)
  }, [])

  const claim = useCallback(async (h: Housemate, pin: string) => {
    const email = emailFor(h)
    const password = passwordFor(pin)
    let { data, error } = await supabase!.auth.signUp({ email, password })
    // Bestaat het account al (half afgemaakte eerdere poging)? Dan gewoon inloggen.
    if (error && /registered|exists/i.test(error.message)) {
      ;({ data, error } = await supabase!.auth.signInWithPassword({ email, password }))
      if (error) throw new Error('Dit profiel heeft al een pincode. Vraag de beheerder om een reset.')
    } else if (error) throw new Error(error.message)
    if (!data.session) throw new Error('Inloggen lukte niet: staat "Confirm email" nog aan in Supabase?')
    const { error: e2 } = await supabase!.rpc('claim_profile', { target: h.id })
    if (e2) {
      await supabase!.auth.signOut()
      throw new Error(e2.message)
    }
  }, [])

  const logout = useCallback(async () => {
    if (!DEMO) await supabase!.auth.signOut()
  }, [])

  const resetPin = useCallback(async (h: Housemate) => {
    if (DEMO) return
    const { error } = await supabase!.rpc('reset_pin', { target: h.id })
    if (error) throw new Error(error.message)
  }, [])

  const value: MeCtx = {
    ready,
    session,
    me,
    meId: me?.id ?? null,
    isAdmin: DEMO || !!me?.is_admin,
    requireMe: () => Promise.resolve(me?.id ?? null),
    login,
    claim,
    logout,
    resetPin,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useMe() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useMe buiten MeProvider')
  return ctx
}
