import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DoorOpen, Search, User, BedDouble, Clock, IndianRupee, 
  CheckCircle2, X, AlertTriangle, Printer, Phone, MapPin,
  ChevronDown, ChevronRight, UtensilsCrossed
} from 'lucide-react'

export default function Checkout() {
  const [activeBookings, setActiveBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [roomCharges, setRoomCharges] = useState(0)
  const [restaurantCharges, setRestaurantCharges] = useState(0)
  const [extraCharges, setExtraCharges] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [checkoutComplete, setCheckoutComplete] = useState(false)

  // New: restaurant orders linked to the booking
  const [linkedOrders, setLinkedOrders] = useState([])
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  useEffect(() => {
    fetchActiveBookings()
  }, [])

  const fetchActiveBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, guests(name, phone, address, id_proof_type, id_proof_number), rooms(room_number, room_type, floor)')
      .eq('status', 'Active')
      .order('check_in', { ascending: true })
    
    if (data) setActiveBookings(data)
    setLoading(false)
  }

  const filteredBookings = activeBookings.filter(b => 
    b.guests?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.rooms?.room_number?.toString().includes(search) ||
    b.booking_id?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = async (booking) => {
    setSelectedBooking(booking)
    setCheckoutComplete(false)
    setExpandedOrderId(null)
    
    // Calculate room charges based on days stayed
    const checkIn = new Date(booking.check_in)
    const now = new Date()
    const daysStayed = Math.max(1, Math.ceil((now - checkIn) / (1000 * 60 * 60 * 24)))
    const ratePerDay = booking.rooms?.price_per_night || 1500
    setRoomCharges(daysStayed * ratePerDay)
    setExtraCharges(0)
    setDiscount(0)

    // Fetch linked restaurant orders
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('booking_id', booking.id)
      .eq('status', 'Pending')
      .order('created_at', { ascending: true })

    if (orders && orders.length > 0) {
      // For each order, fetch its items
      const ordersWithItems = await Promise.all(
        orders.map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*, menu_items(name)')
            .eq('order_id', order.id)
          return {
            ...order,
            items: items || [],
            total: (items || []).reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0)
          }
        })
      )
      setLinkedOrders(ordersWithItems)
      const totalRestaurant = ordersWithItems.reduce((sum, o) => sum + o.total, 0)
      setRestaurantCharges(totalRestaurant)
    } else {
      setLinkedOrders([])
      setRestaurantCharges(0)
    }
  }

  const subtotal = roomCharges + restaurantCharges + extraCharges
  const taxAmount = 0 // Remove tax from room checkout
  const grandTotal = subtotal - discount

  const handleCheckout = async () => {
    if (!selectedBooking) return
    if (!window.confirm(`Confirm checkout for ${selectedBooking.guests?.name}?\nTotal: ₹${grandTotal.toLocaleString()}`)) return

    setProcessing(true)
    try {
      // Generate bill
      const { error: billErr } = await supabase
        .from('bills')
        .insert([{
          subtotal,
          tax_percent: 0,
          discount,
          total: grandTotal,
          payment_mode: paymentMode,
          paid_at: new Date().toISOString()
        }])

      if (billErr) throw billErr

      // Update booking status
      await supabase
        .from('bookings')
        .update({ status: 'Completed', check_out: new Date().toISOString() })
        .eq('id', selectedBooking.id)

      // Free the room
      await supabase
        .from('rooms')
        .update({ status: 'Available' })
        .eq('id', selectedBooking.room_id)

      // Mark all linked restaurant orders as Paid
      if (linkedOrders.length > 0) {
        const orderIds = linkedOrders.map(o => o.id)
        await supabase
          .from('orders')
          .update({ status: 'Paid' })
          .in('id', orderIds)
      }

      setCheckoutComplete(true)
      fetchActiveBookings()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const getDaysStayed = (checkIn) => {
    const days = Math.max(1, Math.ceil((new Date() - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    return days
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
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-header flex items-center">
          <DoorOpen size={28} className="mr-3 text-rose-400" />
          Guest Checkout
        </h1>
        <p className="page-subheader">Process guest checkouts and generate final bills</p>
      </motion.div>

      <div className="flex h-[calc(100vh-12rem)] gap-6">
        {/* Left: Active Bookings List */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-[380px] glass-card-solid flex flex-col shrink-0"
        >
          <div className="p-5 border-b border-surface-100 space-y-3">
            <h2 className="font-display font-bold text-gray-800 flex items-center">
              <BedDouble size={18} className="mr-2 text-brand-400" />
              Active Guests
              <span className="ml-auto badge bg-pastel-rose text-rose-600 text-[10px]">{activeBookings.length}</span>
            </h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search guest, room, booking ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10 text-sm py-2.5"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                <DoorOpen size={40} className="mb-3 text-gray-300" />
                <p className="font-medium">No active bookings</p>
                <p className="text-xs mt-1">All guests have checked out</p>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <motion.div
                  key={booking.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(booking)}
                  className={`
                    p-4 rounded-2xl cursor-pointer transition-all duration-200 border-2
                    ${selectedBooking?.id === booking.id 
                      ? 'border-brand-400 bg-brand-50/50 shadow-pastel' 
                      : 'border-transparent bg-white hover:bg-surface-50 hover:border-surface-200'}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-pastel-lavender flex items-center justify-center">
                        <span className="font-bold text-sm text-brand-600">
                          {booking.guests?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-800">{booking.guests?.name}</p>
                        <p className="text-xs text-gray-400">Room {booking.rooms?.room_number}</p>
                      </div>
                    </div>
                    <span className="badge-occupied text-[10px]">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {getDaysStayed(booking.check_in)} day(s)
                    </span>
                    <span>{booking.booking_id}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        {/* Right: Checkout Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 glass-card-solid flex flex-col overflow-hidden"
        >
          {!selectedBooking ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <DoorOpen size={56} className="mb-4" />
              <p className="font-display font-bold text-xl text-gray-400">Select a guest to checkout</p>
              <p className="text-sm text-gray-300 mt-1">Choose from the active bookings list</p>
            </div>
          ) : checkoutComplete ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-pastel-mint flex items-center justify-center mb-6"
              >
                <CheckCircle2 size={48} className="text-emerald-500" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">Checkout Complete!</h2>
              <p className="text-gray-500 mb-1">
                {selectedBooking.guests?.name} has been checked out from Room {selectedBooking.rooms?.room_number}
              </p>
              <p className="text-2xl font-bold text-brand-600 mt-4">₹{grandTotal.toLocaleString()}</p>
              <p className="text-sm text-gray-400 mt-1">Paid via {paymentMode}</p>
              <div className="flex space-x-3 mt-8">
                <button onClick={() => window.print()} className="btn-brand-outline flex items-center space-x-2">
                  <Printer size={16} />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => { setSelectedBooking(null); setCheckoutComplete(false); }} className="btn-brand">
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Guest Info Header */}
              <div className="p-6 bg-gradient-to-r from-brand-500 to-brand-600 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-display font-bold">{selectedBooking.guests?.name}</h2>
                    <div className="flex items-center space-x-4 mt-2 text-brand-100 text-sm">
                      <span className="flex items-center"><Phone size={14} className="mr-1" /> {selectedBooking.guests?.phone}</span>
                      <span className="flex items-center"><BedDouble size={14} className="mr-1" /> Room {selectedBooking.rooms?.room_number}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">{selectedBooking.booking_id}</span>
                    <p className="text-xs text-brand-200 mt-2">{selectedBooking.rooms?.room_type}</p>
                  </div>
                </div>
              </div>

              {/* Stay Summary */}
              <div className="p-6 border-b border-surface-100">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-pastel-mint/40 rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Check-in</p>
                    <p className="font-bold text-sm text-gray-800">{new Date(selectedBooking.check_in).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400">{new Date(selectedBooking.check_in).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                  </div>
                  <div className="bg-pastel-rose/40 rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Check-out</p>
                    <p className="font-bold text-sm text-gray-800">Today</p>
                    <p className="text-xs text-gray-400">{new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                  </div>
                  <div className="bg-pastel-sky/40 rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Duration</p>
                    <p className="font-bold text-sm text-gray-800">{getDaysStayed(selectedBooking.check_in)} night(s)</p>
                    <p className="text-xs text-gray-400">{selectedBooking.num_guests} guest(s)</p>
                  </div>
                </div>
              </div>

              {/* Bill Breakdown */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <h3 className="font-display font-bold text-gray-800 flex items-center">
                  <IndianRupee size={18} className="mr-2 text-brand-400" />
                  Bill Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-surface-50 rounded-2xl p-4">
                    <span className="text-sm font-medium text-gray-600">Room Charges</span>
                    <div className="flex items-center space-x-2">
                      <input type="number" value={roomCharges} onChange={e => setRoomCharges(Number(e.target.value))} className="w-28 input-field text-right text-sm py-2" />
                    </div>
                  </div>

                  {/* Restaurant Charges - with expandable order details */}
                  <div className="bg-surface-50 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <span className="text-sm font-medium text-gray-600 flex items-center">
                        <UtensilsCrossed size={14} className="mr-2 text-amber-500" />
                        Restaurant Charges
                        {linkedOrders.length > 0 && (
                          <span className="ml-2 text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg">
                            {linkedOrders.length} order{linkedOrders.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </span>
                      <span className="font-display font-bold text-brand-600 text-sm">₹{restaurantCharges.toLocaleString()}</span>
                    </div>

                    {/* Expandable orders list */}
                    {linkedOrders.length > 0 && (
                      <div className="border-t border-surface-200 mx-4 mb-3">
                        {linkedOrders.map((order) => (
                          <div key={order.id} className="border-b border-surface-100 last:border-b-0">
                            {/* Order row - click to expand */}
                            <button
                              onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                              className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-surface-100/50 transition-colors rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                {expandedOrderId === order.id 
                                  ? <ChevronDown size={14} className="text-brand-500" />
                                  : <ChevronRight size={14} className="text-gray-400" />
                                }
                                <span className="text-xs font-semibold text-gray-600">
                                  Order #{order.id.slice(0, 8)}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}, {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-brand-600">₹{order.total.toLocaleString()}</span>
                            </button>

                            {/* Expanded items */}
                            <AnimatePresence>
                              {expandedOrderId === order.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-6 mr-1 mb-3 bg-white rounded-xl border border-surface-200 divide-y divide-surface-100">
                                    {order.items.map((item, idx) => (
                                      <div key={idx} className="flex justify-between items-center px-3 py-2 text-xs">
                                        <span className="text-gray-700 font-medium">{item.menu_items?.name || 'Item'}</span>
                                        <div className="flex items-center space-x-3">
                                          <span className="text-gray-400">×{item.quantity}</span>
                                          <span className="font-semibold text-gray-700 w-16 text-right">₹{(item.price_at_time * item.quantity).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    )}

                    {linkedOrders.length === 0 && (
                      <p className="text-[11px] text-gray-400 px-4 pb-3">No restaurant orders linked to this stay</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-surface-50 rounded-2xl p-4">
                    <span className="text-sm font-medium text-gray-600">Extra Services</span>
                    <input type="number" value={extraCharges} onChange={e => setExtraCharges(Number(e.target.value))} className="w-28 input-field text-right text-sm py-2" />
                  </div>
                </div>

                <div className="border-t border-surface-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Discount (Optional)</span>
                    <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-28 input-field text-right text-sm py-2" />
                  </div>
                  <div className="flex justify-between text-xl font-display font-extrabold pt-3 border-t border-surface-200">
                    <span className="text-gray-800">Grand Total</span>
                    <span className="text-gradient">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment & Actions */}
              <div className="p-6 border-t border-surface-100 bg-surface-50">
                <div className="flex items-center space-x-3 mb-4">
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
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCheckout}
                  disabled={processing}
                  className="btn-danger w-full flex items-center justify-center space-x-2 py-4"
                >
                  <DoorOpen size={20} />
                  <span className="font-bold">{processing ? 'Processing Checkout...' : 'Complete Checkout & Generate Bill'}</span>
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Print-only Invoice Receipt Container */}
      {selectedBooking && (
        <div className="print-area-only print-area text-black p-4 space-y-4" style={{ width: '100%', maxWidth: '80mm' }}>
          <div className="text-center pb-3 border-b border-dashed border-gray-400">
            <h2 className="text-xl font-display font-extrabold tracking-wide">JOSHI GUEST HOUSE</h2>
            <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mt-1">Invoice Receipt</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 py-1">
            <div><strong>Booking ID:</strong> {selectedBooking.booking_id}</div>
            <div className="text-right"><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Room:</strong> {selectedBooking.rooms?.room_number} ({selectedBooking.rooms?.room_type})</div>
            <div className="text-right"><strong>Payment Mode:</strong> {paymentMode}</div>
            <div className="col-span-2"><strong>Guest:</strong> {selectedBooking.guests?.name} ({selectedBooking.guests?.phone})</div>
          </div>

          <table className="w-full text-xs border-t border-b border-gray-200 my-2">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              <tr className="text-gray-800">
                <td className="py-2">Room Charges ({getDaysStayed(selectedBooking.check_in)} nights)</td>
                <td className="py-2 text-right">₹{roomCharges}</td>
              </tr>
              {restaurantCharges > 0 && (
                <tr className="text-gray-800">
                  <td className="py-2">Restaurant Charges</td>
                  <td className="py-2 text-right">₹{restaurantCharges}</td>
                </tr>
              )}
              {extraCharges > 0 && (
                <tr className="text-gray-800">
                  <td className="py-2">Extra Services</td>
                  <td className="py-2 text-right">₹{extraCharges}</td>
                </tr>
              )}
              {discount > 0 && (
                <tr className="text-rose-600 font-bold">
                  <td className="py-2">Discount</td>
                  <td className="py-2 text-right">-₹{discount}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-dashed border-gray-300">
            <span>Grand Total:</span>
            <span className="text-base">₹{grandTotal}</span>
          </div>

          <div className="text-center pt-4 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            Thank you for staying with us!
          </div>
        </div>
      )}
    </div>
  )
}
