import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BedDouble, Users, Utensils, IndianRupee } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    occupiedRooms: 0,
    totalRooms: 0,
    activeGuests: 0,
    todayRevenue: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    // Rooms
    const { data: rooms } = await supabase.from('rooms').select('status')
    if (rooms) {
      setStats(prev => ({
        ...prev,
        totalRooms: rooms.length,
        occupiedRooms: rooms.filter(r => r.status === 'Occupied').length
      }))
    }

    // Active Guests (from occupied rooms or current bookings)
    const { count: activeGuests } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')
      
    if (activeGuests !== null) {
      setStats(prev => ({ ...prev, activeGuests }))
    }

    // Today's revenue
    const today = new Date().toISOString().split('T')[0]
    const { data: bills } = await supabase
      .from('bills')
      .select('total')
      .gte('created_at', `${today}T00:00:00Z`)

    if (bills) {
      const revenue = bills.reduce((sum, bill) => sum + (bill.total || 0), 0)
      setStats(prev => ({ ...prev, todayRevenue: revenue }))
    }
  }

  const statCards = [
    { title: 'Occupied Rooms', value: `${stats.occupiedRooms} / ${stats.totalRooms}`, icon: BedDouble, color: 'bg-blue-500' },
    { title: 'Active Guests', value: stats.activeGuests, icon: Users, color: 'bg-emerald-500' },
    { title: 'Today\'s Revenue', value: `₹${stats.todayRevenue.toLocaleString()}`, icon: IndianRupee, color: 'bg-violet-500' },
    { title: 'Pending Orders', value: '3', icon: Utensils, color: 'bg-amber-500' }, // Placeholder for now
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Overview</h1>
        <div className="text-sm text-gray-500 font-medium">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className={`${stat.color} p-4 rounded-xl text-white`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Quick Actions & Recent Activity can be added here */}
    </div>
  )
}
