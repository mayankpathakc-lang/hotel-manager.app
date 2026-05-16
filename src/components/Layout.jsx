import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { LayoutDashboard, Bed, UserPlus, Users, UtensilsCrossed, Menu as MenuIcon, Receipt, BarChart3, LogOut } from 'lucide-react'

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
    { name: 'Register Guest', path: '/guest-registration', icon: UserPlus },
    { name: 'Guest Records', path: '/guest-records', icon: Users },
    { name: 'Restaurant', path: '/restaurant', icon: UtensilsCrossed },
    { name: 'Menu', path: '/menu', icon: MenuIcon },
    { name: 'Billing', path: '/billing', icon: Receipt },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col hide-print">
        <div className="p-4 border-b border-indigo-800">
          <h1 className="text-2xl font-bold tracking-wider">LUMIERE</h1>
          <p className="text-indigo-300 text-xs mt-1 uppercase tracking-widest">Hotel & Dining</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-indigo-800 text-white' 
                    : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-indigo-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2.5 w-full rounded-lg text-indigo-200 hover:bg-indigo-800 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout
