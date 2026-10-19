import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { HouseProvider } from './lib/house'
import Layout from './components/Layout'
import Home from './pages/Home'
import Boodschappen from './pages/Boodschappen'
import Turf from './pages/Turf'
import Anys from './pages/Anys'
import Ranking from './pages/Ranking'
import Huis from './pages/Huis'

export default function App() {
  return (
    <HouseProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="boodschappen" element={<Boodschappen />} />
            <Route path="turf" element={<Turf />} />
            <Route path="anys" element={<Anys />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="huis" element={<Huis />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </HouseProvider>
  )
}
