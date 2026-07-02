import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { IndianRupee, TrendingUp, Calendar as CalendarIcon, Download, BarChart3, Receipt } from 'lucide-react'

export default function Reports() {
  const [sales, setSales] = useState({ total: 0, bills: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodaySales()
  }, [])

  const fetchTodaySales = async () => {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('bills')
      .select('*, orders(is_takeaway, table_number)')
      .gte('created_at', `${today}T00:00:00Z`)
      .order('created_at', { ascending: false })

    if (data) {
      const total = data.reduce((sum, b) => sum + b.total, 0)
      setSales({ total, bills: data })
    }
    setLoading(false)
  }

  const exportCSV = () => {
    const headers = ['Bill ID', 'Date', 'Type', 'Subtotal', 'Tax', 'Discount', 'Total', 'Payment Mode']
    const rows = sales.bills.map(b => [
      b.id.slice(0,8),
      new Date(b.created_at).toLocaleString(),
      b.orders?.is_takeaway ? 'Takeaway' : `Table ${b.orders?.table_number}`,
      b.subtotal,
      b.tax_percent,
      b.discount,
      b.total,
      b.payment_mode
    ])
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n")
      
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `daily_sales_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="page-header flex items-center">
            <BarChart3 size={28} className="mr-3 text-brand-500" />
            Sales Dashboard
          </h1>
          <p className="page-subheader">Today's performance overview</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportCSV} 
          className="btn-brand-outline flex items-center space-x-2"
        >
          <Download size={16} />
          <span>Export CSV</span>
        </motion.button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-glass-lg"
          style={{ background: 'linear-gradient(135deg, #CC7219 0%, #E88526 40%, #FF9933 100%)' }}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-brand-100 font-semibold text-sm">Today's Revenue</h3>
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-sm"><IndianRupee size={18} /></div>
            </div>
            <p className="text-4xl font-display font-extrabold tracking-tight">₹{sales.total.toLocaleString()}</p>
            <p className="text-brand-200 text-sm mt-2 flex items-center font-medium">
              <TrendingUp size={14} className="mr-1" /> Active business day
            </p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-solid p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-semibold text-sm">Bills Generated</h3>
            <div className="p-2.5 bg-pastel-mint rounded-2xl"><Receipt size={18} className="text-emerald-500" /></div>
          </div>
          <p className="text-4xl font-display font-extrabold text-gray-800">{sales.bills.length}</p>
          <p className="text-emerald-500 text-sm mt-2 font-medium">Total transactions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-solid p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-semibold text-sm">Avg. Bill Value</h3>
            <div className="p-2.5 bg-pastel-sky rounded-2xl"><CalendarIcon size={18} className="text-sky-500" /></div>
          </div>
          <p className="text-4xl font-display font-extrabold text-gray-800">
            ₹{sales.bills.length > 0 ? Math.round(sales.total / sales.bills.length).toLocaleString() : 0}
          </p>
          <p className="text-sky-500 text-sm mt-2 font-medium">Per transaction</p>
        </motion.div>
      </div>

      {/* Transaction Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="section-card"
      >
        <div className="section-card-header flex justify-between items-center">
          <h2 className="text-lg font-display font-bold text-gray-800">Recent Transactions</h2>
          <span className="text-xs text-gray-400 font-medium">{new Date().toLocaleDateString()}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Order Details</th>
                <th>Amount</th>
                <th>Payment Mode</th>
              </tr>
            </thead>
            <tbody>
              {sales.bills.map((bill) => (
                <tr key={bill.id}>
                  <td className="text-gray-500 text-xs font-medium">{new Date(bill.created_at).toLocaleTimeString()}</td>
                  <td>
                    <span className="font-semibold text-gray-800 block text-sm">Bill #{bill.id.slice(0,8)}</span>
                    <span className="text-xs text-gray-400">{bill.orders?.is_takeaway ? '🛍️ Takeaway' : `🍽️ Table ${bill.orders?.table_number}`}</span>
                  </td>
                  <td className="font-display font-bold text-brand-600">₹{bill.total}</td>
                  <td>
                    <span className={`badge text-[10px] ${
                      bill.payment_mode === 'Cash' ? 'bg-pastel-mint text-emerald-700' :
                      bill.payment_mode === 'UPI' ? 'bg-pastel-sky text-sky-700' : 'bg-pastel-lavender text-brand-700'
                    }`}>
                      {bill.payment_mode}
                    </span>
                  </td>
                </tr>
              ))}
              {sales.bills.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-gray-400">
                    <BarChart3 size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No transactions yet today</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
