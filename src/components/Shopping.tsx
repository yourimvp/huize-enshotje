import { useRef, useState, type FormEvent } from 'react'
import { insert, remove, update } from '../lib/db'
import { ago } from '../lib/format'
import type { ShoppingItem } from '../lib/types'
import { useMe } from '../lib/me'
import { useHouse } from '../lib/house'
import { ConfirmButton, Empty, PlusIcon } from './ui'
import { Avatar } from './decor'

export function AddItem({ autoFocus = false }: { autoFocus?: boolean }) {
  const [name, setName] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  const { meId } = useMe()

  async function add(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setName('')
    ref.current?.focus()
    await insert('shopping_items', { name: n, note: null, checked: false, added_by: meId })
  }

  return (
    <form className="add-bar" onSubmit={add}>
      <input
        ref={ref}
        placeholder="Wat moet er gehaald worden?"
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Nieuw product"
        autoFocus={autoFocus}
        enterKeyHint="done"
      />
      <button className="plus-btn" aria-label="Toevoegen" disabled={!name.trim()}>
        <PlusIcon />
      </button>
    </form>
  )
}

export async function toggleItem(item: ShoppingItem, by: string | null) {
  return update('shopping_items', item.id, {
    checked: !item.checked,
    checked_at: item.checked ? null : new Date().toISOString(),
    checked_by: item.checked ? null : by,
  })
}

export function ItemRow({ item, showDelete = true }: { item: ShoppingItem; showDelete?: boolean }) {
  const { requireMe } = useMe()
  const { byId } = useHouse()
  const onToggle = async () => {
    if (item.checked) return toggleItem(item, null)
    const me = await requireMe()
    return toggleItem(item, me)
  }
  const by = item.checked_by ? byId.get(item.checked_by)?.name : null
  const who = byId.get((item.checked ? item.checked_by : item.added_by) ?? '')
  return (
    <li className={`row item ${item.checked ? 'is-done' : ''}`}>
      <button
        className={`check ${item.checked ? 'on' : ''}`}
        aria-label={item.checked ? `${item.name} terugzetten` : `${item.name} afvinken`}
        onClick={onToggle}
      />
      <div className="row-main">
        <strong>{item.name}</strong>
        {showDelete && (
          <span className="meta">
            {item.checked && item.checked_at
              ? `gehaald${by ? ` door ${by}` : ''} ${ago(item.checked_at)}`
              : `erop gezet${item.added_by && byId.get(item.added_by) ? ` door ${byId.get(item.added_by)!.name}` : ''} ${ago(item.created_at)}`}
          </span>
        )}
      </div>
      {who && <Avatar name={who.name} color={who.color} size={20} />}
      {showDelete && !item.checked && (
        <ConfirmButton onConfirm={() => remove('shopping_items', item.id)} confirmLabel="Weg?">
          ×
        </ConfirmButton>
      )}
    </li>
  )
}

export function OpenItems({ items, limit, compact }: { items: ShoppingItem[]; limit?: number; compact?: boolean }) {
  const shown = limit ? items.slice(0, limit) : items
  if (items.length === 0) return <Empty>Niks nodig. Lang leve de volle koelkast.</Empty>
  return (
    <ul className="list">
      {shown.map((i) => (
        <ItemRow key={i.id} item={i} showDelete={!compact} />
      ))}
      {limit && items.length > limit && <li className="row more">+ {items.length - limit} meer</li>}
    </ul>
  )
}
