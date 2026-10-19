import { useCallback, useEffect, useState } from 'react'
import { list, subscribe, type ListOptions } from './db'
import type { TableName, Tables } from './types'

/** Laadt een tabel en houdt hem live bij. */
export function useTable<T extends TableName>(table: T, opts: ListOptions = {}) {
  const [rows, setRows] = useState<Tables[T][]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const since = opts.since

  const reload = useCallback(async () => {
    try {
      setRows(await list(table, { since }))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [table, since])

  useEffect(() => {
    reload()
    const off = subscribe(table, reload)
    // Bij terugkomen naar de app (telefoon uit slaapstand) opnieuw ophalen
    const onFocus = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      off()
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [table, reload])

  return { rows, loading, error, reload }
}
