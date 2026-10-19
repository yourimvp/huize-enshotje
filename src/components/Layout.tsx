import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { DEMO } from '../lib/db'
import { Bovenlicht, Lights } from './decor'
import { AchievementWatcher } from './Achievements'
import { StitchDefs } from './game'
import { useMe } from '../lib/me'

const MAIN = [
  { to: '/', label: 'Thuis', color: 'var(--g-yellow)', end: true },
  { to: '/boodschappen', label: 'Boodschappen', color: 'var(--g-green)' },
  { to: '/turf', label: 'Turf', color: 'var(--g-orange)' },
  { to: '/spellen', label: 'Spellen', color: 'var(--g-blue)' },
]
const MORE = [
  { to: '/ranking', label: 'Ranking', icon: '⏱️', color: 'var(--g-blue)' },
  { to: '/anys', label: 'Anys', icon: '🍺', color: 'var(--g-magenta)' },
  { to: '/agenda', label: 'Agenda', icon: '📅', color: 'var(--g-red)' },
  { to: '/achievements', label: 'Achievements', icon: '🏆', color: 'var(--gold)' },
  { to: '/huis', label: 'Huis', icon: '⚙️', color: 'var(--muted)' },
]
export const NAV = [...MAIN, ...MORE.filter((m) => m.to !== '/huis')]

export default function Layout() {
  const [moreOpen, setMoreOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setMoreOpen(false), [loc.pathname])
  const { me } = useMe()
  const more = me ? [{ to: `/profiel/${me.id}`, label: 'Mijn profiel', icon: '🙂', color: me.color }, ...MORE] : MORE
  const moreActive = more.some((m) => loc.pathname.startsWith(m.to))

  return (
    <div className="shell">
      <StitchDefs />
      <Lights />
      <header className="topbar">
        <Link to="/" className="logo">
          <Bovenlicht size={30} />
          <span>
            Huize <em>Enshotje</em>
          </span>
        </Link>
        <nav className="nav-desktop" aria-label="Hoofdmenu">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={'end' in n ? n.end : false}>
              <span className="pane" style={{ background: n.color, color: n.color }} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/huis" className="settings-link" title="Huis-instellingen">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="7" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="10" cy="17" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span>Huis</span>
        </NavLink>
      </header>
      {DEMO && <div className="demo-banner">Demo · nepdata, alleen in deze browser</div>}
      <main className="content">
        <Outlet />
      </main>

      {moreOpen && (
        <div className="sheet-backdrop" onClick={() => setMoreOpen(false)}>
          <nav className="sheet" aria-label="Meer" onClick={(e) => e.stopPropagation()}>
            {more.map((m) => (
              <NavLink key={m.to} to={m.to} className="sheet-item">
                <span className="sheet-icon" aria-hidden>
                  {m.icon}
                </span>
                {m.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      <nav className="nav-mobile" aria-label="Hoofdmenu">
        {MAIN.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span className="pane" style={{ background: n.color, color: n.color }} />
            <span className="lbl">{n.label}</span>
          </NavLink>
        ))}
        <button className={`more-btn ${moreActive || moreOpen ? 'active' : ''}`} onClick={() => setMoreOpen((o) => !o)} aria-expanded={moreOpen}>
          <span className="dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <span className="lbl">Meer</span>
        </button>
      </nav>

      <AchievementWatcher />
    </div>
  )
}
