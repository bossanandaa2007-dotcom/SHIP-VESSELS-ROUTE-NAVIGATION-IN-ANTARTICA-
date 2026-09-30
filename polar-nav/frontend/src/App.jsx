import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FleetTracking from './pages/FleetTracking'
import RoutePlanner from './pages/RoutePlanner'
import WeatherIce from './pages/WeatherIce'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/fleet-tracking" element={<FleetTracking />} />
        <Route path="/route-planner" element={<RoutePlanner />} />
        <Route path="/weather-ice" element={<WeatherIce />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
