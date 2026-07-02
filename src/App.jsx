import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Calendar from './pages/Calendar'
import OccupancyChart from './pages/OccupancyChart'
import GuestRegistration from './pages/GuestRegistration'
import GuestRecords from './pages/GuestRecords'
import Checkout from './pages/Checkout'
import Restaurant from './pages/Restaurant'
import Menu from './pages/Menu'
import Billing from './pages/Billing'
import Reports from './pages/Reports'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #FFF3DB 0%, #FFE4B5 25%, #FFD08A 50%, #FFBC5E 75%, #FFF0DB 100%)' }}>
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-sm">Loading Joshi Guest House...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        <Route path="/" element={<ProtectedRoute session={session}><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="rooms" element={<Rooms />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="occupancy-chart" element={<OccupancyChart />} />
          <Route path="guest-registration" element={<GuestRegistration />} />
          <Route path="guest-records" element={<GuestRecords />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="restaurant" element={<Restaurant />} />
          <Route path="menu" element={<Menu />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
