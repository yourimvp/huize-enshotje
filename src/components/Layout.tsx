import { NavLink, Outlet, Link } from 'react-router-dom'
import { DEMO } from '../lib/db'
import { Bovenlicht, Lights } from './decor'

export const NAV = [
  { to: '/', label: 'Thuis', color: 'var(--g-yellow)', end: true },
  { to: '/boodschappen', label: 'Boodschappen', color: 'var(--g-green)' },
  { to: '/turf', label: 'Turf', color: 'var(--g-orange)' },
  { to: '/ranking', label: 'Ranking', color: 'var(--g-blue)' },
  { to: '/anys', label: 'Anys', color: 'var(--g-magenta)' },
]

export default function Layout() {
  return (
    <div className="shell">
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
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="pane" style={{ background: n.color, color: n.color }} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/huis" className="settings-link" title="Huis-instellingen">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M4 7h10M18 7h2M4 17h4M12 17h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
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
      <nav className="nav-mobile" aria-label="Hoofdmenu">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span className="pane" style={{ background: n.color, color: n.color }} />
            <span className="lbl">{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
