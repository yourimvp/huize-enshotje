import { useState, type FormEvent } from 'react'
import { DEMO, insert, remove, update } from '../lib/db'
import { useTable } from '../lib/hooks'
import { GLASS, useHouse } from '../lib/house'
import { Avatar, PageTitle } from '../components/decor'
import { ConfirmButton, PlusIcon } from '../components/ui'
import { useMe } from '../lib/me'

export default function Huis() {
  const { housemates } = useHouse()
  const { me, isAdmin, logout, resetPin } = useMe()
  const drinkTypes = useTable('drink_types').rows
  const disciplines = useTable('disciplines').rows

  const [hName, setHName] = useState('')
  const [dName, setDName] = useState('')
  const [rName, setRName] = useState('')

  async function addHousemate(e: FormEvent) {
    e.preventDefault()
    if (!hName.trim()) return
    await insert('housemates', { name: hName.trim(), color: GLASS[housemates.length % GLASS.length].hex, active: true })
    setHName('')
  }

  async function addDrink(e: FormEvent) {
    e.preventDefault()
    if (!dName.trim()) return
    await insert('drink_types', { name: dName.trim(), active: true })
    setDName('')
  }

  async function addDiscipline(e: FormEvent) {
    e.preventDefault()
    if (!rName.trim()) return
    await insert('disciplines', { name: rName.trim() })
    setRName('')
  }

  return (
    <div className="page">
      <PageTitle color="var(--g-yellow)" sub="Instellingen voor het hele huis">
        Huis
      </PageTitle>

      <section className="card">
        <h2 className="card-title">Jouw account</h2>
        <div className="account-row">
          {me && <Avatar name={me.name} color={me.color} size={34} />}
          <div className="row-main">
            <strong>Ingelogd als {me?.name ?? '…'}</strong>
            <span className="meta">Je blijft ingelogd op dit apparaat.</span>
          </div>
          {!DEMO && (
            <ConfirmButton onConfirm={logout} confirmLabel="Zeker?">
              Uitloggen
            </ConfirmButton>
          )}
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Huisgenoten</h2>
        <ul className="list">
          {housemates.map((h) => (
            <li key={h.id} className={`row ${h.active ? '' : 'inactive'}`}>
              <Avatar name={h.name} color={h.color} size={26} />
              <div className="row-main">
                <strong>
                  {h.name}
                  <span className={`acct ${h.user_id ? 'ok' : ''}`}>{h.user_id ? 'heeft pincode' : 'nog geen pincode'}</span>
                </strong>
                <span className="swatches">
                  {GLASS.map((g) => (
                    <button
                      key={g.hex}
                      title={g.name}
                      aria-label={`Kleur ${g.name}`}
                      className={h.color === g.hex ? 'on' : ''}
                      style={{ background: g.hex }}
                      onClick={() => update('housemates', h.id, { color: g.hex })}
                    />
                  ))}
                </span>
              </div>
              {isAdmin && h.user_id && h.id !== me?.id && (
                <ConfirmButton onConfirm={() => resetPin(h).catch((e) => alert(e.message))} confirmLabel="Reset?">
                  Pincode
                </ConfirmButton>
              )}
              <button className="btn ghost small" onClick={() => update('housemates', h.id, { active: !h.active })}>
                {h.active ? 'Verhuisd' : 'Terug'}
              </button>
            </li>
          ))}
        </ul>
        <form className="add-bar" onSubmit={addHousemate}>
          <input placeholder="Naam nieuwe huisgenoot" value={hName} onChange={(e) => setHName(e.target.value)} />
          <button className="plus-btn" aria-label="Huisgenoot toevoegen" disabled={!hName.trim()}>
            <PlusIcon />
          </button>
        </form>
        <p className="hint">"Verhuisd" verbergt iemand, maar houdt oude streepjes en tijden.</p>
      </section>

      <section className="card">
        <h2 className="card-title">Drankjes op de turflijst</h2>
        <ul className="list">
          {drinkTypes.map((d) => (
            <li key={d.id} className={`row ${d.active ? '' : 'inactive'}`}>
              <div className="row-main">
                <strong>{d.name}</strong>
              </div>
              <button className="btn ghost small" onClick={() => update('drink_types', d.id, { active: !d.active })}>
                {d.active ? 'Verbergen' : 'Tonen'}
              </button>
            </li>
          ))}
        </ul>
        <form className="add-bar" onSubmit={addDrink}>
          <input placeholder="Bijv. Wijn" value={dName} onChange={(e) => setDName(e.target.value)} />
          <button className="plus-btn" aria-label="Drankje toevoegen" disabled={!dName.trim()}>
            <PlusIcon />
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="card-title">Ranking-onderdelen</h2>
        <ul className="list">
          {disciplines.map((d) => (
            <li key={d.id} className="row">
              <div className="row-main">
                <strong>{d.name}</strong>
              </div>
              <ConfirmButton onConfirm={() => remove('disciplines', d.id)} confirmLabel="Ook alle tijden weg?">
                Verwijderen
              </ConfirmButton>
            </li>
          ))}
        </ul>
        <form className="add-bar" onSubmit={addDiscipline}>
          <input placeholder="Bijv. Bierestafette" value={rName} onChange={(e) => setRName(e.target.value)} />
          <button className="plus-btn" aria-label="Onderdeel toevoegen" disabled={!rName.trim()}>
            <PlusIcon />
          </button>
        </form>
      </section>

      {DEMO && (
        <ConfirmButton
          className="btn ghost small"
          onConfirm={() => {
            Object.keys(localStorage)
              .filter((k) => k.startsWith('enshotje'))
              .forEach((k) => localStorage.removeItem(k))
            location.reload()
          }}
        >
          Demo-data resetten
        </ConfirmButton>
      )}
    </div>
  )
}
