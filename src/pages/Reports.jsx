import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { IndianRupee, TrendingUp, Calendar as CalendarIcon, Download } from 'lucide-react'

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

  if (loading) return <div>Loading reports...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Sales Dashboard</h1>
        <button onClick={exportCSV} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
          <Download size={18} className="mr-2" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-indigo-100 font-medium">Today's Revenue</h3>
            <div className="p-2 bg-white/20 rounded-lg"><IndianRupee size={20} /></div>
          </div>
          <p className="text-4xl font-bold tracking-tight">₹{sales.total.toLocaleString()}</p>
          <p className="text-indigo-200 text-sm mt-2 flex items-center"><TrendingUp size={14} className="mr-1" /> +12% from yesterday</p>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">Total Bills Generated</h3>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CalendarIcon size={20} /></div>
          </div>
          <p className="text-4xl font-bold text-gray-800">{sales.bills.length}</p>
          <p className="text-emerald-500 text-sm mt-2">Active business day</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Time</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Order Details</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 font-semibold text-xs text-gray-500 uppercase tracking-wider">Payment Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.bills.map((bill, idx) => (
                <tr key={bill.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-600">{new Date(bill.created_at).toLocaleTimeString()}</td>
                  <td className="p-4">
                    <span className="font-medium text-gray-800 block">Bill #{bill.id.slice(0,8)}</span>
                    <span className="text-xs text-gray-500">{bill.orders?.is_takeaway ? 'Takeaway' : `Table ${bill.orders?.table_number}`}</span>
                  </td>
                  <td className="p-4 font-semibold text-gray-900">₹{bill.total}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bill.payment_mode === 'Cash' ? 'bg-emerald-100 text-emerald-800' :
                      bill.payment_mode === 'UPI' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {bill.payment_mode}
                    </span>
                  </td>
                </tr>
              ))}
              {sales.bills.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No transactions yet today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
