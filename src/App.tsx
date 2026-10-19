import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { HouseProvider } from './lib/house'
import { MeProvider, useMe } from './lib/me'
import { DEMO } from './lib/db'
import Layout from './components/Layout'
import Login from './components/Login'
import Home from './pages/Home'
import Boodschappen from './pages/Boodschappen'
import Turf from './pages/Turf'
import Anys from './pages/Anys'
import Ranking from './pages/Ranking'
import Huis from './pages/Huis'
import Agenda from './pages/Agenda'
import AchievementsPage from './pages/AchievementsPage'
import Profiel from './pages/Profiel'
import Spellen from './pages/Spellen'
import Paardenrace from './games/Paardenrace'
import Chwazi from './games/Chwazi'
import Ei from './games/Ei'
import Rad from './games/Rad'
import Duel from './games/Duel'
import Dobbelstenen from './games/Dobbelstenen'

export default function App() {
  return (
    <HouseProvider>
      <MeProvider>
        <Gate />
      </MeProvider>
    </HouseProvider>
  )
}

function Gate() {
  const { ready, me } = useMe()
  if (!ready) return null
  if (!DEMO && !me) return <Login />
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="boodschappen" element={<Boodschappen />} />
          <Route path="turf" element={<Turf />} />
          <Route path="spellen" element={<Spellen />} />
          <Route path="spellen/paardenrace" element={<Paardenrace />} />
          <Route path="spellen/chwazi" element={<Chwazi />} />
          <Route path="spellen/ei" element={<Ei />} />
          <Route path="spellen/rad" element={<Rad />} />
          <Route path="spellen/duel" element={<Duel />} />
          <Route path="spellen/dobbelstenen" element={<Dobbelstenen />} />
          <Route path="ranking" element={<Ranking />} />
          <Route path="anys" element={<Anys />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="prijzenkast" element={<Navigate to="/achievements" replace />} />
          <Route path="profiel/:id" element={<Profiel />} />
          <Route path="huis" element={<Huis />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
