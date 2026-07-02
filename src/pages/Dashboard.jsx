import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { BedDouble, Users, Utensils, IndianRupee, CalendarDays, TrendingUp, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [stats, setStats] = useState({
    occupiedRooms: 0,
    totalRooms: 14,
    activeGuests: 0,
    todayRevenue: 0,
    upcomingBookings: 0
  })
  const [recentBookings, setRecentBookings] = useState([])

  useEffect(() => {
    fetchStats()
    fetchRecentBookings()
  }, [])

  const fetchStats = async () => {
    // Rooms
    const { data: rooms } = await supabase.from('rooms').select('status')
    if (rooms) {
      setStats(prev => ({
        ...prev,
        totalRooms: rooms.length || 14,
        occupiedRooms: rooms.filter(r => r.status === 'Occupied').length
      }))
    }

    // Active Guests
    const { count: activeGuests } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Active')
      
    if (activeGuests !== null) {
      setStats(prev => ({ ...prev, activeGuests }))
    }

    // Upcoming bookings (future check-in)
    const today = new Date().toISOString()
    const { count: upcoming } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Reserved')
    
    if (upcoming !== null) {
      setStats(prev => ({ ...prev, upcomingBookings: upcoming }))
    }

    // Today's revenue
    const todayDate = new Date().toISOString().split('T')[0]
    const { data: bills } = await supabase
      .from('bills')
      .select('total')
      .gte('created_at', `${todayDate}T00:00:00Z`)

    if (bills) {
      const revenue = bills.reduce((sum, bill) => sum + (bill.total || 0), 0)
      setStats(prev => ({ ...prev, todayRevenue: revenue }))
    }
  }

  const fetchRecentBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, guests(name), rooms(room_number)')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (data) setRecentBookings(data)
  }

  const statCards = [
    { 
      title: 'Occupied Rooms', 
      value: `${stats.occupiedRooms}`, 
      subtitle: `of ${stats.totalRooms} rooms`,
      icon: BedDouble, 
      gradient: 'from-brand-400 to-brand-500',
      bgColor: 'bg-pastel-lavender',
      iconBg: 'bg-brand-100'
    },
    { 
      title: 'Active Guests', 
      value: stats.activeGuests, 
      subtitle: 'currently staying',
      icon: Users, 
      gradient: 'from-emerald-400 to-teal-500',
      bgColor: 'bg-pastel-mint',
      iconBg: 'bg-emerald-100'
    },
    { 
      title: "Today's Revenue", 
      value: `₹${stats.todayRevenue.toLocaleString()}`, 
      subtitle: 'total earnings',
      icon: IndianRupee, 
      gradient: 'from-amber-400 to-orange-500',
      bgColor: 'bg-pastel-yellow',
      iconBg: 'bg-amber-100'
    },
    { 
      title: 'Upcoming Bookings', 
      value: stats.upcomingBookings, 
      subtitle: 'reservations',
      icon: CalendarDays, 
      gradient: 'from-sky-400 to-blue-500',
      bgColor: 'bg-pastel-sky',
      iconBg: 'bg-sky-100'
    },
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-end"
      >
        <div>
          <h1 className="page-header">Good {getGreeting()} ✨</h1>
          <p className="page-subheader">Here's what's happening at Joshi Guest House today</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-600">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-US', { year: 'numeric' })}
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="stat-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.iconBg} p-3 rounded-2xl`}>
                  <Icon size={22} className={`bg-gradient-to-r ${stat.gradient} bg-clip-text`} style={{ color: 'inherit' }} />
                </div>
                <TrendingUp size={16} className="text-emerald-400" />
              </div>
              <p className="text-3xl font-display font-extrabold text-gray-900">{stat.value}</p>
              <p className="text-sm font-medium text-gray-400 mt-1">{stat.title}</p>
              <p className="text-xs text-gray-300 mt-0.5">{stat.subtitle}</p>
              {/* Pastel accent bar */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-40 rounded-b-3xl`} />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card-solid p-6"
        >
          <h2 className="text-lg font-display font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/guest-registration" className="flex items-center justify-between p-4 rounded-2xl bg-pastel-mint/50 hover:bg-pastel-mint transition-colors group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Users size={18} className="text-emerald-500" />
                </div>
                <span className="font-semibold text-sm text-gray-700">New Check-In</span>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
            </Link>
            <Link to="/calendar" className="flex items-center justify-between p-4 rounded-2xl bg-pastel-lavender/50 hover:bg-pastel-lavender transition-colors group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <CalendarDays size={18} className="text-brand-500" />
                </div>
                <span className="font-semibold text-sm text-gray-700">Book Room</span>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
            </Link>
            <Link to="/checkout" className="flex items-center justify-between p-4 rounded-2xl bg-pastel-rose/50 hover:bg-pastel-rose transition-colors group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <BedDouble size={18} className="text-rose-500" />
                </div>
                <span className="font-semibold text-sm text-gray-700">Guest Checkout</span>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
            </Link>
            <Link to="/restaurant" className="flex items-center justify-between p-4 rounded-2xl bg-pastel-yellow/50 hover:bg-pastel-yellow transition-colors group">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Utensils size={18} className="text-amber-500" />
                </div>
                <span className="font-semibold text-sm text-gray-700">Restaurant POS</span>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-amber-500 transition-colors" />
            </Link>
          </div>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-card-solid overflow-hidden"
        >
          <div className="p-6 border-b border-surface-100 flex justify-between items-center">
            <h2 className="text-lg font-display font-bold text-gray-800">Recent Bookings</h2>
            <Link to="/guest-records" className="text-sm text-brand-500 font-semibold hover:text-brand-600 transition-colors">View All →</Link>
          </div>
          <div className="divide-y divide-surface-100">
            {recentBookings.length > 0 ? recentBookings.map((booking) => (
              <div key={booking.id} className="px-6 py-4 flex items-center justify-between hover:bg-brand-50/20 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-pastel-lavender flex items-center justify-center">
                    <span className="text-sm font-bold text-brand-600">
                      {booking.guests?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{booking.guests?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">Room {booking.rooms?.room_number || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`badge text-[10px] ${
                    booking.status === 'Active' ? 'badge-occupied' : 
                    booking.status === 'Reserved' ? 'badge-reserved' :
                    booking.status === 'Completed' ? 'badge-available' : 'badge-maintenance'
                  }`}>
                    {booking.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(booking.check_in).toLocaleDateString()}</p>
                </div>
              </div>
            )) : (
              <div className="p-12 text-center text-gray-400">
                <CalendarDays size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No bookings yet</p>
                <p className="text-xs mt-1">Start by registering a guest</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Room Occupancy Visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass-card-solid p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-display font-bold text-gray-800">Room Occupancy</h2>
          <span className="text-sm font-semibold text-brand-500">
            {stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0}% occupied
          </span>
        </div>
        <div className="w-full h-4 bg-surface-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.totalRooms > 0 ? (stats.occupiedRooms / stats.totalRooms) * 100 : 0}%` }}
            transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{stats.occupiedRooms} occupied</span>
          <span>{stats.totalRooms - stats.occupiedRooms} available</span>
        </div>
      </motion.div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}
