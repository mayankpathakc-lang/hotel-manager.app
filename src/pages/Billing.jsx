import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Printer, CheckCircle2 } from 'lucide-react'

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

  if (loading) return <div>Loading...</div>

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col hide-print">
        <div className="p-4 border-b bg-gray-50 rounded-t-2xl">
          <h2 className="font-bold text-gray-800">Pending Orders</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {orders.map(order => (
            <div 
              key={order.id} 
              onClick={() => handleSelectOrder(order)}
              className={`p-4 border-b cursor-pointer transition-colors ${selectedOrder?.id === order.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-indigo-900">Order #{order.id.slice(0,8)}</span>
                <span className="text-xs font-medium px-2 py-1 bg-amber-100 text-amber-800 rounded-full">{order.status}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {order.is_takeaway ? 'Takeaway' : `Table ${order.table_number}`} • {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          ))}
          {orders.length === 0 && <div className="p-8 text-center text-gray-500">No pending orders.</div>}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col print-area relative">
        {selectedOrder ? (
          <>
            <div className="text-center mb-8 border-b pb-6">
              <h1 className="text-3xl font-bold tracking-widest text-gray-900">LUMIERE</h1>
              <p className="text-gray-500 text-sm mt-1 uppercase">Restaurant Receipt</p>
              
              <div className="flex justify-between text-left text-sm mt-6">
                <div>
                  <p><span className="text-gray-500">Date:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="text-gray-500">Time:</span> {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <p><span className="text-gray-500">Order ID:</span> #{selectedOrder.id.slice(0,8)}</p>
                  <p><span className="text-gray-500">Type:</span> {selectedOrder.is_takeaway ? 'Takeaway' : `Table ${selectedOrder.table_number}`}</p>
                </div>
              </div>
            </div>

            <div className="flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-2 text-left font-semibold text-gray-600">Item</th>
                    <th className="py-2 text-center font-semibold text-gray-600">Qty</th>
                    <th className="py-2 text-right font-semibold text-gray-600">Price</th>
                    <th className="py-2 text-right font-semibold text-gray-600">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderDetails.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3 text-gray-800">{item.menu_items?.name}</td>
                      <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">₹{item.price_at_time}</td>
                      <td className="py-3 text-right font-medium text-gray-800">₹{item.price_at_time * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 border-t-2 border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center hide-print">
                <span className="text-gray-600">Tax (%)</span>
                <input type="number" value={taxPercent} onChange={e=>setTaxPercent(Number(e.target.value))} className="w-16 border rounded px-2 py-1 text-right" />
              </div>
              <div className="flex justify-between text-sm hidden print:flex">
                <span className="text-gray-600">Tax ({taxPercent}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center hide-print">
                <span className="text-gray-600">Discount (₹)</span>
                <input type="number" value={discount} onChange={e=>setDiscount(Number(e.target.value))} className="w-20 border rounded px-2 py-1 text-right" />
              </div>
              <div className="flex justify-between text-sm hidden print:flex">
                <span className="text-gray-600">Discount</span>
                <span>-₹{discount.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-xl font-bold pt-4 border-t">
                <span>Grand Total</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed hide-print">
              <div className="flex items-center space-x-4 mb-6">
                <span className="font-medium text-sm text-gray-700">Payment Mode:</span>
                {['Cash', 'UPI', 'Card'].map(mode => (
                  <label key={mode} className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="paymentMode" checked={paymentMode === mode} onChange={() => setPaymentMode(mode)} className="text-indigo-600 focus:ring-indigo-500" />
                    <span className="text-sm">{mode}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex space-x-4">
                <button onClick={() => window.print()} className="flex-1 py-3 border border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex justify-center items-center">
                  <Printer size={20} className="mr-2" /> Print Bill
                </button>
                <button onClick={handleGenerateBill} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex justify-center items-center shadow-md">
                  <CheckCircle2 size={20} className="mr-2" /> Mark as Paid
                </button>
              </div>
            </div>
            
            <div className="hidden print:block mt-12 text-center text-sm text-gray-500">
              <p>Thank you for dining with us!</p>
              <p className="mt-1">Please visit again</p>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            Select an order to view and generate bill
          </div>
        )}
      </div>
    </div>
  )
}
