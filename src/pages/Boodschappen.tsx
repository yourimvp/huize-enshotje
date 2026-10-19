import { useMemo, useState } from 'react'
import { update } from '../lib/db'
import { useTable } from '../lib/hooks'
import { PageTitle } from '../components/decor'
import { ConfirmButton } from '../components/ui'
import { AddItem, ItemRow, OpenItems } from '../components/Shopping'

export default function Boodschappen() {
  const { rows } = useTable('shopping_items')
  const [showDone, setShowDone] = useState(false)

  const open = useMemo(() => rows.filter((r) => !r.checked && !r.cleared), [rows])
  const done = useMemo(
    () => rows.filter((r) => r.checked && !r.cleared).sort((a, b) => (b.checked_at ?? '').localeCompare(a.checked_at ?? '')),
    [rows],
  )

  return (
    <div className="page">
      <PageTitle color="var(--g-green)" sub={open.length ? `${open.length} ${open.length === 1 ? 'ding' : 'dingen'} nodig` : 'Alles in huis'}>
        Boodschappen
      </PageTitle>

      <section className="card">
        <AddItem />
        <OpenItems items={open} />
      </section>

      {done.length > 0 && (
        <section className="fold">
          <div className="fold-head">
            <button className="link" onClick={() => setShowDone((s) => !s)}>
              {showDone ? '▾' : '▸'} Gehaald ({done.length})
            </button>
            <ConfirmButton onConfirm={() => Promise.all(done.map((d) => update('shopping_items', d.id, { cleared: true })))} confirmLabel="Ja, opruimen">
              Opruimen
            </ConfirmButton>
          </div>
          {showDone && (
            <ul className="list card">
              {done.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
