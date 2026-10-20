import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { DEMO } from '../lib/db'
import { Lights, Avatar } from './decor'
import { AchievementWatcher } from './Achievements'
import { Lapje, StitchDefs } from './game'
import type { IconName } from './icons'
import { useMe } from '../lib/me'

interface Page {
  to: string
  label: string
  icon: IconName
  color: string
}

/** Volgorde van de pagina's: ook de swipe-volgorde. */
function usePages(): Page[] {
  const { me } = useMe()
  return [
    { to: '/', label: 'Thuis', icon: 'huis', color: '#d9a520' },
    { to: '/boodschappen', label: 'Boodschappen', icon: 'boodschappen', color: '#2fa463' },
    { to: '/turf', label: 'Turf', icon: 'turf', color: '#ee7432' },
    { to: '/ranking', label: 'Ranking', icon: 'ranking', color: '#3a7be0' },
    { to: '/spellen', label: 'Spellen', icon: 'spellen', color: '#7a4bd1' },
    { to: '/agenda', label: 'Agenda', icon: 'agenda', color: '#db3b47' },
    { to: '/achievements', label: 'Achievements', icon: 'achievements', color: '#c99a2e' },
    { to: '/anys', label: 'Anys', icon: 'anys', color: '#e0468f' },
    { to: me ? `/profiel/${me.id}` : '/profiel', label: 'Profiel', icon: 'profiel', color: me?.color ?? '#7a7062' },
    { to: '/huis', label: 'Instellingen', icon: 'instellingen', color: '#7a7062' },
  ]
}

/** Welke pagina hoort bij dit pad (ook voor subpagina's zoals /spellen/mines). */
function indexOf(pages: Page[], path: string) {
  let best = -1
  let len = -1
  pages.forEach((p, i) => {
    const hit = p.to === '/' ? path === '/' : path === p.to || path.startsWith(p.to + '/')
    if (hit && p.to.length > len) {
      best = i
      len = p.to.length
    }
  })
  // Andermans profiel valt ook onder "Profiel"
  if (best === -1 && path.startsWith('/profiel/')) best = pages.findIndex((p) => p.label === 'Profiel')
  return best
}

/** Elementen waarin horizontaal vegen iets anders doet (spellen, scrollbare rijen, invoer). */
const NO_SWIPE = 'input, textarea, select, .tabs, .segmented, .picker, .table-wrap, .kast, .stepper, .tp-pop, .modal, [data-noswipe]'

export default function Layout() {
  const pages = usePages()
  const { me } = useMe()
  const loc = useLocation()
  const navigate = useNavigate()
  const idx = indexOf(pages, loc.pathname)
  const isTopLevel = idx >= 0 && (pages[idx].to === loc.pathname || (pages[idx].label === 'Profiel' && loc.pathname.startsWith('/profiel/')))
  const [dir, setDir] = useState<'left' | 'right' | null>(null)
  const prevIdx = useRef(idx)
  const touch = useRef<{ x: number; y: number; t: number; ok: boolean } | null>(null)

  // Richting onthouden voor de inschuif-animatie
  useEffect(() => {
    if (idx >= 0 && prevIdx.current >= 0 && idx !== prevIdx.current) setDir(idx > prevIdx.current ? 'left' : 'right')
    else setDir(null)
    prevIdx.current = idx
    window.scrollTo({ top: 0 })
  }, [loc.pathname, idx])

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    const target = e.target as HTMLElement
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now(), ok: isTopLevel && e.touches.length === 1 && !target.closest(NO_SWIPE) }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const s = touch.current
    touch.current = null
    if (!s?.ok) return
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - s.t > 700) return
    const next = dx < 0 ? idx + 1 : idx - 1
    if (next < 0 || next >= pages.length) return
    navigator.vibrate?.(8)
    navigate(pages[next].to)
  }

  // Onderbalk: 5 vakjes, huidige pagina in het midden (behalve aan de randen)
  const cur = Math.max(0, idx)
  const start = Math.min(Math.max(0, cur - 2), pages.length - 5)
  const windowPages = pages.slice(start, start + 5)

  return (
    <div className="shell">
      <StitchDefs />
      <Lights />
      <header className="topbar">
        <Link to="/" className="logo">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} width={44} height={44} alt="" className="logo-door" />
          <span>
            Huize <em>Enshotje</em>
          </span>
        </Link>
        <nav className="nav-desktop" aria-label="Hoofdmenu">
          {pages.slice(0, 8).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'}>
              <Lapje icon={n.icon} color={n.color} size={22} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        {me && (
          <Link to={`/profiel/${me.id}`} className="me-link" title={`Profiel van ${me.name}`}>
            <span className="me-name">{me.name}</span>
            <Avatar name={me.name} color={me.color} size={36} />
          </Link>
        )}
      </header>
      {DEMO && <div className="demo-banner">Demo · nepdata, alleen in deze browser</div>}
      <main className="content" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div key={loc.pathname} className={`page-anim ${dir ? `from-${dir}` : ''}`}>
          <Outlet />
        </div>
      </main>

      <nav className="nav-mobile" aria-label="Hoofdmenu">
        {start > 0 && <span className="nav-more left" aria-hidden />}
        {windowPages.map((n) => {
          const i = pages.indexOf(n)
          const active = i === idx
          return (
            <NavLink key={n.label} to={n.to} end={n.to === '/'} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              <span className="nav-icon">
                <Lapje icon={n.icon} color={n.color} size={30} />
              </span>
              <span className="lbl">{n.label}</span>
            </NavLink>
          )
        })}
        {start + 5 < pages.length && <span className="nav-more right" aria-hidden />}
      </nav>

      <AchievementWatcher />
    </div>
  )
}
