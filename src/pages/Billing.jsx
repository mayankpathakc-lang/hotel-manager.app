import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Printer, CheckCircle2, Receipt, IndianRupee } from 'lucide-react'

export default function Billing() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [orderDetails, setOrderDetails] = useState([])
  const [taxPercent, setTaxPercent] = useState(5)
  const [discount, setDiscount] = useState(0)
  const [paymentMode, setPaymentMode] = useState('Cash')

  useEffect(() => {
    fetchPendingOrders()
  }, [])

  const fetchPendingOrders = async () => {
    const { data } = await supabase.from('orders').select('*').eq('status', 'Pending').order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order)
    const { data } = await supabase
      .from('order_items')
      .select('*, menu_items(name)')
      .eq('order_id', order.id)
    
    if (data) setOrderDetails(data)
  }

  const subtotal = orderDetails.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
  const taxAmount = (subtotal * taxPercent) / 100
  const grandTotal = subtotal + taxAmount - discount

  const handleGenerateBill = async () => {
    try {
      const { data: bill, error } = await supabase
        .from('bills')
        .insert([{
          order_id: selectedOrder.id,
          subtotal,
          tax_percent: taxPercent,
          discount,
          total: grandTotal,
          payment_mode: paymentMode,
          paid_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error

      await supabase.from('orders').update({ status: 'Paid' }).eq('id', selectedOrder.id)
      
      alert('Bill generated and marked as paid!')
      setSelectedOrder(null)
      fetchPendingOrders()
    } catch (err) {
      alert('Error: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-header flex items-center">
          <Receipt size={28} className="mr-3 text-brand-500" />
          Billing
        </h1>
        <p className="page-subheader">Generate bills for pending orders</p>
      </motion.div>

      <div className="flex h-[calc(100vh-12rem)] gap-6">
        {/* Pending Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[340px] glass-card-solid flex flex-col shrink-0 hide-print"
        >
          <div className="p-5 border-b border-surface-100">
            <h2 className="font-display font-bold text-gray-800 flex items-center">
              Pending Orders
              <span className="ml-auto badge bg-pastel-yellow text-amber-700 text-[10px]">{orders.length}</span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {orders.map(order => (
              <motion.div 
                key={order.id} 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleSelectOrder(order)}
                className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2 ${
                  selectedOrder?.id === order.id 
                    ? 'border-brand-400 bg-brand-50/50 shadow-pastel' 
                    : 'border-transparent bg-white hover:bg-surface-50 hover:border-surface-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-gray-800">Order #{order.id.slice(0,8)}</span>
                  <span className="badge bg-pastel-yellow text-amber-700 text-[10px]">{order.status}</span>
                </div>
                <div className="text-xs text-gray-400 mt-1.5 font-medium">
                  {order.is_takeaway ? '🛍️ Takeaway' : `🍽️ Table ${order.table_number}`} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </motion.div>
            ))}
            {orders.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-gray-400">
                <Receipt size={36} className="mb-3 text-gray-300" />
                <p className="font-medium">No pending orders</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bill Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 glass-card-solid flex flex-col overflow-hidden print-area"
        >
          {selectedOrder ? (
            <>
              {/* Bill Header */}
              <div className="text-center p-8 border-b border-surface-100">
                <h1 className="text-3xl font-display font-extrabold tracking-wider text-gradient">JOSHI GUEST HOUSE</h1>
                <p className="text-gray-400 text-xs mt-1 uppercase tracking-[0.2em] font-semibold">Restaurant Receipt</p>
                
                <div className="flex justify-between text-left text-sm mt-6 text-gray-500">
                  <div>
                    <p><span className="text-gray-400">Date:</span> {new Date().toLocaleDateString()}</p>
                    <p><span className="text-gray-400">Time:</span> {new Date().toLocaleTimeString()}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="text-gray-400">Order:</span> #{selectedOrder.id.slice(0,8)}</p>
                    <p><span className="text-gray-400">Type:</span> {selectedOrder.is_takeaway ? 'Takeaway' : `Table ${selectedOrder.table_number}`}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="flex-1 p-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-surface-200">
                      <th className="py-3 text-left text-xs font-bold text-gray-400 uppercase">Item</th>
                      <th className="py-3 text-center text-xs font-bold text-gray-400 uppercase">Qty</th>
                      <th className="py-3 text-right text-xs font-bold text-gray-400 uppercase">Price</th>
                      <th className="py-3 text-right text-xs font-bold text-gray-400 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {orderDetails.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 text-gray-800 font-medium">{item.menu_items?.name}</td>
                        <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                        <td className="py-3 text-right text-gray-500">₹{item.price_at_time}</td>
                        <td className="py-3 text-right font-semibold text-gray-800">₹{item.price_at_time * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="px-6 pb-6 border-t-2 border-surface-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center hide-print">
                  <span className="text-gray-500">Tax (%)</span>
                  <input type="number" value={taxPercent} onChange={e=>setTaxPercent(Number(e.target.value))} className="w-20 input-field text-right text-sm py-1.5" />
                </div>
                <div className="flex justify-between text-sm hidden print:flex">
                  <span className="text-gray-500">Tax ({taxPercent}%)</span>
                  <span>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm items-center hide-print">
                  <span className="text-gray-500">Discount (₹)</span>
                  <input type="number" value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="w-20 input-field text-right text-sm py-1.5" />
                </div>
                <div className="flex justify-between text-sm hidden print:flex">
                  <span className="text-gray-500">Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-xl font-display font-extrabold pt-4 border-t border-surface-200">
                  <span className="text-gray-800">Grand Total</span>
                  <span className="text-gradient">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-surface-100 bg-surface-50 hide-print">
                <div className="flex items-center space-x-3 mb-5">
                  <span className="text-sm font-semibold text-gray-600">Payment:</span>
                  {['Cash', 'UPI', 'Card'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setPaymentMode(mode)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        paymentMode === mode 
                          ? 'bg-brand-500 text-white shadow-pastel' 
                          : 'bg-white border border-surface-200 text-gray-600 hover:border-brand-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                
                <div className="flex space-x-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.print()} 
                    className="btn-brand-outline flex-1 flex items-center justify-center space-x-2"
                  >
                    <Printer size={16} />
                    <span>Print Bill</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateBill} 
                    className="btn-brand flex-1 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 size={16} />
                    <span>Mark as Paid</span>
                  </motion.button>
                </div>
              </div>
              
              <div className="hidden print:block p-8 text-center text-sm text-gray-500 border-t">
                <p>Thank you for dining with us!</p>
                <p className="mt-1">Please visit again ✨</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <IndianRupee size={56} className="mb-4" />
              <p className="font-display font-bold text-xl text-gray-400">Select an order</p>
              <p className="text-sm text-gray-300 mt-1">to view and generate bill</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
