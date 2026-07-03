import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, ShoppingCart, Trash2, UtensilsCrossed, Send, BedDouble, User, X, Printer } from 'lucide-react'

export default function Restaurant() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [order, setOrder] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [isTakeaway, setIsTakeaway] = useState(false)
  const [loading, setLoading] = useState(true)
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null)

  // New: order type and room linking
  const [orderType, setOrderType] = useState('walkin') // 'walkin' or 'room'
  const [activeBookings, setActiveBookings] = useState([])
  const [selectedBookingId, setSelectedBookingId] = useState('')

  useEffect(() => {
    fetchMenu()
    fetchActiveBookings()
  }, [])

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').eq('is_available', true)
    if (data) {
      setMenu(data)
      const cats = ['All', ...new Set(data.map(item => item.category))]
      setCategories(cats)
    }
    setLoading(false)
  }

  const fetchActiveBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, guests(name), rooms(room_number)')
      .eq('status', 'Active')
      .order('check_in', { ascending: true })
    if (data) setActiveBookings(data)
  }

  const addToOrder = (item) => {
    const existing = order.find(i => i.id === item.id)
    if (existing) {
      setOrder(order.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setOrder([...order, { ...item, quantity: 1 }])
    }
  }

  const updateQuantity = (id, delta) => {
    setOrder(order.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta
        return newQ > 0 ? { ...i, quantity: newQ } : null
      }
      return i
    }).filter(Boolean))
  }

  const calculateTotal = () => order.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const placeOrder = async () => {
    if (order.length === 0) return alert('Order is empty')
    
    if (orderType === 'walkin') {
      if (!isTakeaway && !tableNumber) return alert('Please enter a table number')
    } else {
      if (!selectedBookingId) return alert('Please select a guest room')
    }

    try {
      const orderPayload = {
        table_number: orderType === 'walkin' ? tableNumber : null,
        is_takeaway: orderType === 'walkin' ? isTakeaway : false,
        status: 'Pending',
        booking_id: orderType === 'room' ? selectedBookingId : null
      }

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single()
      
      if (orderError) throw orderError

      const orderItems = order.map(item => ({
        order_id: newOrder.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      const booking = orderType === 'room' ? activeBookings.find(b => b.id === selectedBookingId) : null
      const guestName = booking?.guests?.name || null
      const roomNum = booking?.rooms?.room_number || null

      setPlacedOrderDetails({
        order_id: newOrder.id,
        created_at: newOrder.created_at,
        table_number: orderType === 'walkin' ? tableNumber : null,
        is_takeaway: orderType === 'walkin' ? isTakeaway : false,
        room_number: roomNum,
        guest_name: guestName,
        items: order.map(item => ({ name: item.name, quantity: item.quantity }))
      })
      
      setOrder([])
      setTableNumber('')
      setSelectedBookingId('')
    } catch (err) {
      alert('Error placing order: ' + err.message)
    }
  }

  const filteredMenu = activeCategory === 'All' ? menu : menu.filter(m => m.category === activeCategory)

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
          <UtensilsCrossed size={28} className="mr-3 text-amber-500" />
          Restaurant POS
        </h1>
        <p className="page-subheader">Select items and place orders</p>
      </motion.div>

      <div className="flex h-[calc(100vh-12rem)] gap-6">
        {/* Menu Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-card-solid flex flex-col overflow-hidden"
        >
          {/* Categories */}
          <div className="p-4 border-b border-surface-100 flex space-x-2 overflow-x-auto">
            {categories.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat 
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-pastel' 
                    : 'bg-surface-100 text-gray-600 hover:bg-surface-200'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenu.map(item => (
              <motion.div 
                key={item.id} 
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => addToOrder(item)}
                className="border-2 border-surface-200 rounded-3xl p-5 cursor-pointer hover:border-brand-300 hover:shadow-pastel transition-all duration-200 group bg-white"
              >
                <h3 className="font-bold text-sm text-gray-800 group-hover:text-brand-600 transition-colors">{item.name}</h3>
                <span className="text-[10px] font-bold text-gray-400 bg-surface-100 px-2 py-0.5 rounded-lg inline-block mt-1">{item.category}</span>
                <p className="mt-3 font-display font-extrabold text-lg text-brand-600">₹{item.price}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Order Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-96 glass-card-solid flex flex-col shrink-0"
        >
          <div className="p-5 border-b border-surface-100 bg-pastel-lavender/30">
            <h2 className="text-lg font-display font-bold text-gray-800 flex items-center">
              <ShoppingCart className="mr-2 text-brand-500" size={20} /> Current Order
              {order.length > 0 && (
                <span className="ml-auto badge bg-brand-100 text-brand-600 text-[10px]">{order.length}</span>
              )}
            </h2>
          </div>
          
          {/* Order Type Selection */}
          <div className="p-4 border-b border-surface-100 space-y-3">
            <div className="flex space-x-2">
              <button
                onClick={() => { setOrderType('walkin'); setSelectedBookingId('') }}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                  orderType === 'walkin'
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-pastel'
                    : 'bg-surface-100 text-gray-600 hover:bg-surface-200'
                }`}
              >
                <User size={14} />
                <span>Walk-in / Table</span>
              </button>
              <button
                onClick={() => { setOrderType('room'); setIsTakeaway(false); setTableNumber('') }}
                className={`flex-1 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 ${
                  orderType === 'room'
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-pastel'
                    : 'bg-surface-100 text-gray-600 hover:bg-surface-200'
                }`}
              >
                <BedDouble size={14} />
                <span>Charge to Room</span>
              </button>
            </div>

            {orderType === 'walkin' ? (
              <>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    isTakeaway ? 'bg-brand-500 border-brand-500' : 'border-surface-300'
                  }`} onClick={() => setIsTakeaway(!isTakeaway)}>
                    {isTakeaway && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Takeaway</span>
                </label>
                {!isTakeaway && (
                  <input 
                    type="text" 
                    placeholder="Table Number" 
                    value={tableNumber} 
                    onChange={e => setTableNumber(e.target.value)}
                    className="input-field text-sm py-2.5"
                  />
                )}
              </>
            ) : (
              <select
                value={selectedBookingId}
                onChange={e => setSelectedBookingId(e.target.value)}
                className="select-field text-sm"
              >
                <option value="">Select a guest room...</option>
                {activeBookings.map(b => (
                  <option key={b.id} value={b.id}>
                    Room {b.rooms?.room_number} — {b.guests?.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {order.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <ShoppingCart size={36} className="mb-3" />
                <p className="font-medium text-gray-400 text-sm">No items yet</p>
                <p className="text-xs text-gray-300">Click menu items to add</p>
              </div>
            ) : (
              order.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-surface-50 rounded-2xl p-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400">₹{item.price}</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-white rounded-xl p-1 border border-surface-200 mx-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-surface-100 rounded-lg text-gray-500 transition-colors">
                      <Minus size={12}/>
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-surface-100 rounded-lg text-gray-500 transition-colors">
                      <Plus size={12}/>
                    </button>
                  </div>
                  <div className="w-16 text-right font-bold text-sm text-brand-600">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-surface-100 bg-surface-50">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-600 text-sm">Total:</span>
              <span className="text-2xl font-display font-extrabold text-gradient">₹{calculateTotal()}</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={placeOrder}
              disabled={order.length === 0}
              className="btn-brand w-full flex items-center justify-center space-x-2"
            >
              <Send size={16} />
              <span>{orderType === 'room' ? 'Charge to Room' : 'Place Order'}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* KOT Modal (On-Screen Preview) */}
      <AnimatePresence>
        {placedOrderDetails && (
          <div className="modal-overlay hide-print" onClick={() => setPlacedOrderDetails(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="modal-content max-w-sm p-6 relative bg-white"
            >
              <div className="text-center pb-4 border-b border-dashed border-surface-200">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-3 text-brand-500">
                  <UtensilsCrossed size={22} />
                </div>
                <h2 className="text-xl font-display font-extrabold tracking-wide text-brand-600">JOSHI GUEST HOUSE</h2>
                <p className="text-xs uppercase tracking-widest font-semibold text-gray-400 mt-1">Kitchen Order Ticket (KOT)</p>
              </div>

              <div className="my-4 space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span><strong>Date:</strong> {new Date(placedOrderDetails.created_at).toLocaleDateString()}</span>
                  <span><strong>Time:</strong> {new Date(placedOrderDetails.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                  <span><strong>Order ID:</strong> #{placedOrderDetails.order_id.slice(0, 8)}</span>
                  <span>
                    <strong>Type:</strong>{' '}
                    <span className="font-extrabold text-brand-600">
                      {placedOrderDetails.is_takeaway
                        ? 'Takeaway'
                        : placedOrderDetails.room_number
                        ? `Room ${placedOrderDetails.room_number}`
                        : `Table ${placedOrderDetails.table_number}`}
                    </span>
                  </span>
                </div>
                {placedOrderDetails.guest_name && (
                  <div className="pt-1 border-t border-surface-100">
                    <strong>Guest Name:</strong> {placedOrderDetails.guest_name}
                  </div>
                )}
              </div>

              <table className="w-full text-sm border-t border-b border-surface-100 my-4">
                <thead>
                  <tr className="text-left text-xs text-gray-400 uppercase">
                    <th className="py-2">Item Name</th>
                    <th className="py-2 text-right">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-50 font-medium">
                  {placedOrderDetails.items.map((item, i) => (
                    <tr key={i} className="text-gray-800">
                      <td className="py-2.5">{item.name}</td>
                      <td className="py-2.5 text-right font-extrabold text-brand-600 text-base">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex space-x-3 hide-print mt-6">
                <button
                  onClick={() => window.print()}
                  className="btn-brand flex-1 flex items-center justify-center space-x-2 py-3"
                >
                  <Printer size={16} />
                  <span>Print KOT</span>
                </button>
                <button
                  onClick={() => setPlacedOrderDetails(null)}
                  className="btn-brand-outline px-4 py-3 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print-only KOT Container */}
      {placedOrderDetails && (
        <div className="print-area-only print-area text-black p-4 space-y-4" style={{ width: '100%', maxWidth: '80mm' }}>
          <div className="text-center pb-3 border-b border-dashed border-gray-400">
            <h2 className="text-xl font-display font-extrabold tracking-wide">JOSHI GUEST HOUSE</h2>
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mt-1">Kitchen Order Ticket (KOT)</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 py-1">
            <div><strong>Date:</strong> {new Date(placedOrderDetails.created_at).toLocaleDateString()}</div>
            <div className="text-right"><strong>Time:</strong> {new Date(placedOrderDetails.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div><strong>Order ID:</strong> #{placedOrderDetails.order_id.slice(0, 8)}</div>
            <div className="text-right">
              <strong>Type:</strong>{' '}
              {placedOrderDetails.is_takeaway
                ? 'Takeaway'
                : placedOrderDetails.room_number
                ? `Room ${placedOrderDetails.room_number}`
                : `Table ${placedOrderDetails.table_number}`}
            </div>
            {placedOrderDetails.guest_name && (
              <div className="col-span-2"><strong>Guest:</strong> {placedOrderDetails.guest_name}</div>
            )}
          </div>

          <table className="w-full text-sm border-t border-b border-gray-200 my-2">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-2">Item Name</th>
                <th className="py-2 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {placedOrderDetails.items.map((item, i) => (
                <tr key={i} className="text-gray-800">
                  <td className="py-2">{item.name}</td>
                  <td className="py-2 text-right font-extrabold text-lg">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-center pt-2 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            Kitchen Copy • Joshi Guest House
          </div>
        </div>
      )}
    </div>
  )
}
