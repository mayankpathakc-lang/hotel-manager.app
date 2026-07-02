import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, Bed, UserPlus, Users, UtensilsCrossed, 
  Menu as MenuIcon, Receipt, BarChart3, LogOut, CalendarDays, 
  DoorOpen, MountainSnow, Grid3x3
} from 'lucide-react'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Rooms', path: '/rooms', icon: Bed },
    { name: 'Calendar', path: '/calendar', icon: CalendarDays },
    { name: 'Occupancy Chart', path: '/occupancy-chart', icon: Grid3x3 },
    { name: 'Register Guest', path: '/guest-registration', icon: UserPlus },
    { name: 'Guest Records', path: '/guest-records', icon: Users },
    { name: 'Checkout', path: '/checkout', icon: DoorOpen },
    { name: 'Restaurant', path: '/restaurant', icon: UtensilsCrossed },
    { name: 'Menu', path: '/menu', icon: MenuIcon },
    { name: 'Billing', path: '/billing', icon: Receipt },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ]

  return (
    <div className="flex h-screen bg-surface-50">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-sidebar text-white flex flex-col hide-print relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-brand-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 -right-10 w-36 h-36 bg-brand-300/15 rounded-full blur-3xl pointer-events-none" />
        
        {/* Logo */}
        <div className="p-6 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <MountainSnow size={20} className="text-brand-200" />
            </div>
            <div>
              <h1 className="text-lg font-display font-extrabold tracking-wide leading-tight">JOSHI</h1>
              <p className="text-brand-200 text-[10px] font-semibold uppercase tracking-[0.15em]">Guest House</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto relative z-10 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className="relative block group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white/15 backdrop-blur-sm rounded-2xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <div className={`relative flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`font-medium text-sm ${isActive ? 'font-semibold' : ''}`}>{item.name}</span>
                  {isActive && (
                    <motion.div 
                      layoutId="activeDot"
                      className="absolute right-3 w-2 h-2 bg-brand-200 rounded-full shadow-sm shadow-brand-300/50"
                    />
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 relative z-10">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-2xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            <LogOut size={19} />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-[1400px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
