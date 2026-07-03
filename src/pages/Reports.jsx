import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  IndianRupee, TrendingUp, Calendar as CalendarIcon, Download, 
  BarChart3, Receipt, Eye, Coffee, Bed, ArrowRight, X, Search 
} from 'lucide-react'
import { format } from 'date-fns'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('revenue') // 'revenue', 'orders', 'allotments'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  
  // Data States
  const [bills, setBills] = useState([])
  const [orders, setOrders] = useState([])
  const [allotments, setAllotments] = useState([])
  
  // Drill-down states
  const [selectedOrder, setSelectedOrder] = useState(null) // Detailed order modal
  const [orderItems, setOrderItems] = useState([])

  useEffect(() => {
    fetchData()
  }, [activeTab, selectedDate])

  const fetchData = async () => {
    setLoading(true)
    const startDate = `${selectedDate}T00:00:00Z`
    const endDate = `${selectedDate}T23:59:59Z`

    try {
      if (activeTab === 'revenue') {
        const { data: billsData } = await supabase
          .from('bills')
          .select('*, orders(*), bookings(*)')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })
        
        setBills(billsData || [])
      } 
      else if (activeTab === 'orders') {
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .order('created_at', { ascending: false })
        
        setOrders(ordersData || [])
      } 
      else if (activeTab === 'allotments') {
        const { data: allotmentsData } = await supabase
          .from('bookings')
          .select('*, guests(*), rooms(*)')
          .gte('check_in', startDate)
          .lte('check_in', endDate)
          .order('check_in', { ascending: false })
        
        setAllotments(allotmentsData || [])
      }
    } catch (err) {
      console.error('Error fetching historical report data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch detailed contents of an order (for restaurant popup)
  const handleViewOrderDetails = async (order) => {
    setSelectedOrder(order)
    setOrderItems([])
    try {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
      
      setOrderItems(data || [])
    } catch (err) {
      console.error('Error loading order items:', err)
    }
  }

  // Calculate total revenue on the selected date
  const totalRevenue = bills.reduce((sum, b) => sum + (b.total || 0), 0)
  const totalBillsCount = bills.length
  const avgBillValue = totalBillsCount > 0 ? Math.round(totalRevenue / totalBillsCount) : 0

  const exportCSV = () => {
    let headers = []
    let rows = []
    let filename = `report_${selectedDate}.csv`

    if (activeTab === 'revenue') {
      headers = ['Bill ID', 'Time', 'Type', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Mode']
      rows = bills.map(b => [
        b.id.slice(0, 8),
        format(new Date(b.created_at), 'hh:mm a'),
        b.orders ? 'Restaurant' : 'Hotel Room',
        b.subtotal,
        b.tax_percent,
        b.discount,
        b.total,
        b.payment_mode
      ])
      filename = `revenue_report_${selectedDate}.csv`
    } 
    else if (activeTab === 'orders') {
      headers = ['Order ID', 'Time', 'Type', 'Table / Takeaway', 'Status', 'Total Price']
      rows = orders.map(o => [
        o.id.slice(0, 8),
        format(new Date(o.created_at), 'hh:mm a'),
        o.is_takeaway ? 'Takeaway' : 'Dine-In',
        o.is_takeaway ? 'N/A' : `Table ${o.table_number}`,
        o.status,
        o.total_price
      ])
      filename = `orders_history_${selectedDate}.csv`
    } 
    else if (activeTab === 'allotments') {
      headers = ['Booking ID', 'Guest Name', 'Phone', 'Room Number', 'Room Type', 'Check-In', 'Expected Check-Out', 'Status']
      rows = allotments.map(a => [
        a.booking_id,
        a.guests?.name || 'N/A',
        a.guests?.phone || 'N/A',
        a.rooms?.room_number || 'N/A',
        a.rooms?.room_type || 'N/A',
        format(new Date(a.check_in), 'hh:mm a'),
        format(new Date(a.check_out), 'dd MMM yyyy'),
        a.status
      ])
      filename = `room_allotments_${selectedDate}.csv`
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n")
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="page-header flex items-center">
            <BarChart3 size={28} className="mr-3 text-brand-500" />
            Historical Reports & Data logs
          </h1>
          <p className="page-subheader">Retrieve old data, look up guest room allotments, and view past orders</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center space-x-3 bg-white border border-surface-200 rounded-2xl px-4 py-2.5 shadow-sm">
          <CalendarIcon size={18} className="text-brand-500" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Date:</span>
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="text-sm font-bold text-gray-700 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        <button 
          onClick={() => setActiveTab('revenue')}
          className={`px-6 py-3 font-display font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'revenue' 
              ? 'border-brand-500 text-brand-600' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <IndianRupee size={16} />
          <span>Revenue Reports</span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 font-display font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'orders' 
              ? 'border-brand-500 text-brand-600' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Coffee size={16} />
          <span>Restaurant Orders</span>
        </button>
        <button 
          onClick={() => setActiveTab('allotments')}
          className={`px-6 py-3 font-display font-bold text-sm border-b-2 transition-all flex items-center space-x-2 ${
            activeTab === 'allotments' 
              ? 'border-brand-500 text-brand-600' 
              : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          <Bed size={16} />
          <span>Room Allotments</span>
        </button>
      </div>

      {/* Stats Summary for Revenue Tab */}
      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-glass-lg"
               style={{ background: 'linear-gradient(135deg, #CC7219 0%, #E88526 40%, #FF9933 100%)' }}>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h3 className="text-brand-100 font-semibold text-sm">Date Revenue ({format(new Date(selectedDate), 'dd MMM')})</h3>
              <p className="text-4xl font-display font-extrabold tracking-tight mt-2">₹{totalRevenue.toLocaleString()}</p>
              <p className="text-brand-200 text-xs mt-2 flex items-center font-medium">
                <TrendingUp size={12} className="mr-1" /> Total local revenue collected
              </p>
            </div>
          </div>
          <div className="glass-card-solid p-6">
            <h3 className="text-gray-400 font-semibold text-sm">Bills Issued</h3>
            <p className="text-4xl font-display font-extrabold text-gray-800 mt-2">{totalBillsCount}</p>
            <p className="text-emerald-500 text-xs mt-2 font-medium">Payment receipts generated</p>
          </div>
          <div className="glass-card-solid p-6">
            <h3 className="text-gray-400 font-semibold text-sm">Avg. Transaction</h3>
            <p className="text-4xl font-display font-extrabold text-gray-800 mt-2">₹{avgBillValue.toLocaleString()}</p>
            <p className="text-sky-500 text-xs mt-2 font-medium">Average purchase amount</p>
          </div>
        </div>
      )}

      {/* Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-card"
      >
        <div className="section-card-header flex justify-between items-center">
          <h2 className="text-lg font-display font-bold text-gray-800 uppercase tracking-wide">
            {activeTab === 'revenue' && 'Revenue Ledger'}
            {activeTab === 'orders' && 'Restaurant Transaction Log'}
            {activeTab === 'allotments' && 'Room Allotment History log'}
          </h2>
          <button 
            onClick={exportCSV} 
            disabled={loading || (activeTab === 'revenue' ? bills : activeTab === 'orders' ? orders : allotments).length === 0}
            className="btn-brand-outline px-4 py-2 text-xs flex items-center space-x-2"
          >
            <Download size={14} />
            <span>Export CSV Log</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* TAB 1: REVENUE */}
            {activeTab === 'revenue' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Bill ID</th>
                    <th>Allotted To</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Total Received</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(b => (
                    <tr key={b.id}>
                      <td className="text-gray-500 text-xs font-semibold">{format(new Date(b.created_at), 'hh:mm a')}</td>
                      <td>
                        <span className="font-bold text-gray-800">#{b.id.slice(0, 8)}</span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-gray-600 block">
                          {b.orders ? '🍽️ Restaurant Bill' : '🏨 Hotel Room Checkout'}
                        </span>
                      </td>
                      <td className="text-gray-600">₹{b.subtotal}</td>
                      <td className="text-rose-500">-₹{b.discount || 0}</td>
                      <td className="font-bold text-brand-600">₹{b.total}</td>
                      <td>
                        <span className={`badge text-[10px] ${
                          b.payment_mode === 'Cash' ? 'bg-pastel-mint text-emerald-700' :
                          b.payment_mode === 'UPI' ? 'bg-pastel-sky text-sky-700' : 'bg-pastel-lavender text-brand-700'
                        }`}>
                          {b.payment_mode}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {bills.length === 0 && <EmptyState text="No revenue transactions recorded on this date." />}
                </tbody>
              </table>
            )}

            {/* TAB 2: ORDERS */}
            {activeTab === 'orders' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Order ID</th>
                    <th>Service Type</th>
                    <th>Table / Tag</th>
                    <th>Order Amount</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td className="text-gray-500 text-xs font-semibold">{format(new Date(o.created_at), 'hh:mm a')}</td>
                      <td>
                        <span className="font-bold text-gray-800">#{o.id.slice(0,8)}</span>
                      </td>
                      <td>
                        <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {o.is_takeaway ? '🛍️ Takeaway' : '🍽️ Dine-In'}
                        </span>
                      </td>
                      <td className="font-semibold text-gray-700">{o.is_takeaway ? '—' : `Table ${o.table_number}`}</td>
                      <td className="font-bold text-brand-600">₹{o.total_price}</td>
                      <td>
                        <span className={`badge text-[10px] ${
                          o.status === 'Completed' ? 'bg-pastel-mint text-emerald-700' : 'bg-pastel-rose text-rose-700'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          onClick={() => handleViewOrderDetails(o)}
                          className="btn-ghost px-2.5 py-1 text-xs text-brand-500 font-semibold inline-flex items-center space-x-1"
                        >
                          <Eye size={12} />
                          <span>View Items</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <EmptyState text="No restaurant orders placed on this date." />}
                </tbody>
              </table>
            )}

            {/* TAB 3: ROOM ALLOTMENTS */}
            {activeTab === 'allotments' && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Allotment Time</th>
                    <th>Booking ID</th>
                    <th>Guest Details</th>
                    <th>Room Info</th>
                    <th>Stay Span</th>
                    <th>Purpose</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allotments.map(a => (
                    <tr key={a.id}>
                      <td className="text-gray-500 text-xs font-semibold">{format(new Date(a.check_in), 'hh:mm a')}</td>
                      <td>
                        <span className="font-bold text-gray-800">{a.booking_id}</span>
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-bold text-gray-800 block">{a.guests?.name}</span>
                          <span className="text-gray-400">📞 {a.guests?.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-bold text-brand-600 block">Room {a.rooms?.room_number}</span>
                          <span className="text-gray-400">{a.rooms?.room_type}</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-gray-600 flex items-center space-x-1.5">
                          <span>{format(new Date(a.check_in), 'dd MMM')}</span>
                          <ArrowRight size={10} className="text-gray-400" />
                          <span>{format(new Date(a.check_out), 'dd MMM yyyy')}</span>
                        </div>
                      </td>
                      <td className="text-xs font-semibold text-gray-500">{a.purpose}</td>
                      <td>
                        <span className={`badge text-[10px] ${
                          a.status === 'Active' ? 'badge-occupied' :
                          a.status === 'Reserved' ? 'badge-reserved' : 'badge-available'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {allotments.length === 0 && <EmptyState text="No hotel rooms allotted on this date." />}
                </tbody>
              </table>
            )}
          </div>
        )}
      </motion.div>

      {/* Restaurant Order Contents Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              className="modal-content max-w-md"
            >
              <div className="p-6 bg-gradient-to-r from-brand-500 to-brand-600 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-display font-bold">Order Contents</h3>
                  <p className="text-xs text-brand-100 mt-0.5">Order #{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)} 
                  className="p-2 rounded-xl hover:bg-white/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-surface-50 rounded-2xl p-4 border border-surface-200">
                  <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 pb-2 border-b border-surface-200">
                    <span>Menu Item</span>
                    <span className="w-16 text-center">Qty</span>
                    <span className="w-20 text-right">Price</span>
                  </div>
                  <div className="space-y-3">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm font-semibold text-gray-700">
                        <span className="truncate">{item.menu_items?.name || 'Menu Item'}</span>
                        <span className="w-16 text-center text-gray-500">x{item.quantity}</span>
                        <span className="w-20 text-right text-gray-800">₹{item.price_at_time * item.quantity}</span>
                      </div>
                    ))}
                    {orderItems.length === 0 && (
                      <p className="text-xs text-center text-gray-400 py-3">Loading order details...</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 font-display">
                  <span className="font-extrabold text-gray-500">Total Bill:</span>
                  <span className="text-2xl font-black text-brand-600">₹{selectedOrder.total_price}</span>
                </div>
              </div>

              <div className="p-4 bg-surface-50 border-t border-surface-200 flex justify-end">
                <button onClick={() => setSelectedOrder(null)} className="btn-brand px-6 py-2 text-xs">
                  Close Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyState({ text }) {
  return (
    <tr>
      <td colSpan="7" className="p-16 text-center text-gray-400">
        <Receipt size={36} className="mx-auto mb-3 text-brand-300 opacity-60" />
        <p className="font-bold text-sm text-gray-500">{text}</p>
        <p className="text-xs text-gray-400 mt-1">Select a different date from the top-right filter to lookup old records.</p>
      </td>
    </tr>
  )
}
