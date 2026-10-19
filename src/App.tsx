import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { HouseProvider } from './lib/house'
import { MeProvider } from './lib/me'
import Layout from './components/Layout'
import Home from './pages/Home'
import Boodschappen from './pages/Boodschappen'
import Turf from './pages/Turf'
import Anys from './pages/Anys'
import Ranking from './pages/Ranking'
import Huis from './pages/Huis'
import Agenda from './pages/Agenda'
import Prijzenkast from './pages/Prijzenkast'
import Spellen from './pages/Spellen'
import Paardenrace from './games/Paardenrace'
import Chwazi from './games/Chwazi'
import Ei from './games/Ei'

export default function App() {
  return (
    <HouseProvider>
      <MeProvider>
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
              <Route path="ranking" element={<Ranking />} />
              <Route path="anys" element={<Anys />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="prijzenkast" element={<Prijzenkast />} />
              <Route path="huis" element={<Huis />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MeProvider>
    </HouseProvider>
  )
}
