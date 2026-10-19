import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { TableName, Tables } from './types'
import { demoSeed } from './demo'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Demo-modus: geen Supabase, alles in localStorage. Handig om lokaal te kijken. */
export const DEMO = import.meta.env.VITE_DEMO === 'true' || !url || !key

export const supabase: SupabaseClient | null = DEMO ? null : createClient(url!, key!)

export interface ListOptions {
  /** Alleen rijen met created_at >= deze ISO-datum */
  since?: string
}

type Row<T extends TableName> = Tables[T]

// ── Demo-opslag ─────────────────────────────────────────────────────────────
const listeners = new Map<TableName, Set<() => void>>()
const storeKey = (t: TableName) => `enshotje-demo3:${t}`

function demoRead<T extends TableName>(table: T): Row<T>[] {
  try {
    const raw = localStorage.getItem(storeKey(table))
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  const seeded = (demoSeed[table] ?? []) as Row<T>[]
  demoWrite(table, seeded)
  return seeded
}

function demoWrite<T extends TableName>(table: T, rows: Row<T>[]) {
  try {
    localStorage.setItem(storeKey(table), JSON.stringify(rows))
  } catch {
    /* ignore */
  }
  listeners.get(table)?.forEach((fn) => fn())
}

// ── Publieke API ────────────────────────────────────────────────────────────
export async function list<T extends TableName>(table: T, opts: ListOptions = {}): Promise<Row<T>[]> {
  if (DEMO) {
    const rows = demoRead(table)
    const filtered = opts.since ? rows.filter((r) => r.created_at >= opts.since!) : rows
    return [...filtered].sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  // Supabase geeft max 1000 rijen per keer terug, dus we pagineren.
  const out: Row<T>[] = []
  const page = 1000
  for (let from = 0; ; from += page) {
    let q = supabase!.from(table).select('*').order('created_at', { ascending: true }).range(from, from + page - 1)
    if (opts.since) q = q.gte('created_at', opts.since)
    const { data, error } = await q
    if (error) throw error
    out.push(...(data as Row<T>[]))
    if (!data || data.length < page) break
  }
  return out
}

export async function insert<T extends TableName>(
  table: T,
  row: Omit<Partial<Row<T>>, 'id' | 'created_at'>,
): Promise<Row<T>> {
  if (DEMO) {
    const full = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row } as Row<T>
    demoWrite(table, [...demoRead(table), full])
    return full
  }
  const { data, error } = await supabase!.from(table).insert(row as never).select().single()
  if (error) throw error
  return data as Row<T>
}

export async function update<T extends TableName>(table: T, id: string, patch: Partial<Row<T>>) {
  if (DEMO) {
    demoWrite(
      table,
      demoRead(table).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    )
    return
  }
  const { error } = await supabase!.from(table).update(patch as never).eq('id', id)
  if (error) throw error
}

export async function remove(table: TableName, ids: string | string[]) {
  const arr = Array.isArray(ids) ? ids : [ids]
  if (arr.length === 0) return
  if (DEMO) {
    demoWrite(
      table,
      demoRead(table).filter((r) => !arr.includes(r.id)),
    )
    return
  }
  const { error } = await supabase!.from(table).delete().in('id', arr)
  if (error) throw error
}

/** Roept `cb` aan zodra iemand (ook op een andere telefoon) iets aanpast. */
export function subscribe(table: TableName, cb: () => void): () => void {
  if (DEMO) {
    const set = listeners.get(table) ?? new Set()
    set.add(cb)
    listeners.set(table, set)
    return () => set.delete(cb)
  }
  const channel = supabase!
    .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, cb)
    .subscribe()
  return () => {
    supabase!.removeChannel(channel)
  }
}
