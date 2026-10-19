import { useRef, useState, type FormEvent } from 'react'
import { insert, remove, update } from '../lib/db'
import { ago } from '../lib/format'
import type { ShoppingItem } from '../lib/types'
import { ConfirmButton, Empty, PlusIcon } from './ui'

export function AddItem({ autoFocus = false }: { autoFocus?: boolean }) {
  const [name, setName] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  async function add(e: FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    setName('')
    ref.current?.focus()
    await insert('shopping_items', { name: n, note: null, checked: false })
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

export function toggleItem(item: ShoppingItem) {
  return update('shopping_items', item.id, {
    checked: !item.checked,
    checked_at: item.checked ? null : new Date().toISOString(),
  })
}

export function ItemRow({ item, showDelete = true }: { item: ShoppingItem; showDelete?: boolean }) {
  return (
    <li className={`row item ${item.checked ? 'is-done' : ''}`}>
      <button
        className={`check ${item.checked ? 'on' : ''}`}
        aria-label={item.checked ? `${item.name} terugzetten` : `${item.name} afvinken`}
        onClick={() => toggleItem(item)}
      />
      <div className="row-main">
        <strong>{item.name}</strong>
        {showDelete && (
          <span className="meta">
            {item.checked && item.checked_at ? `gehaald ${ago(item.checked_at)}` : `erop gezet ${ago(item.created_at)}`}
          </span>
        )}
      </div>
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
