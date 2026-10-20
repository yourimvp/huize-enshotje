import { useRef, useState, type ChangeEvent } from 'react'
import { DEMO, supabase, update } from '../lib/db'
import { prepareProfilePhoto } from '../lib/profilePhoto'

export function ProfilePhoto({ id, hasPhoto }: { id: string; hasPhoto: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function save(photo: string | null) {
    if (DEMO) await update('housemates', id, { avatar_url: photo })
    else {
      const { error } = await supabase!.rpc('set_profile_photo', { photo })
      if (error) throw error
    }
  }
  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setError('')
    try { await save(await prepareProfilePhoto(file)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Foto opslaan is niet gelukt. Probeer opnieuw.') }
    finally { setBusy(false); if (input.current) input.current.value = '' }
  }
  async function clear() {
    setBusy(true); setError('')
    try { await save(null) }
    catch { setError('Foto verwijderen is niet gelukt. Probeer opnieuw.') }
    finally { setBusy(false) }
  }
  return <div className="profile-photo-controls">
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden onChange={choose} aria-label="Kies profielfoto" />
    <button className="btn small" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Even verwerken…' : hasPhoto ? 'Foto wijzigen' : 'Profielfoto toevoegen'}</button>
    {hasPhoto && <button className="btn small ghost" disabled={busy} onClick={clear}>Foto verwijderen</button>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>
}
