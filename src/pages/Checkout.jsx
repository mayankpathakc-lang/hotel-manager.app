import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DoorOpen, Search, User, BedDouble, Clock, IndianRupee, 
  CheckCircle2, X, AlertTriangle, Printer, Phone, MapPin
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

  const handleSelect = (booking) => {
    setSelectedBooking(booking)
    setCheckoutComplete(false)
    
    // Calculate room charges based on days stayed
    const checkIn = new Date(booking.check_in)
    const now = new Date()
    const daysStayed = Math.max(1, Math.ceil((now - checkIn) / (1000 * 60 * 60 * 24)))
    const ratePerDay = booking.rooms?.room_type === 'Suite' ? 5000 : 
                       booking.rooms?.room_type === 'Deluxe' ? 3000 : 
                       booking.rooms?.room_type === 'Double' ? 2000 : 1500
    setRoomCharges(daysStayed * ratePerDay)
    setRestaurantCharges(0)
    setExtraCharges(0)
    setDiscount(0)
  }

  const subtotal = roomCharges + restaurantCharges + extraCharges
  const taxAmount = Math.round(subtotal * 0.12)
  const grandTotal = subtotal + taxAmount - discount

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
          tax_percent: 12,
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
                  <div className="flex items-center justify-between bg-surface-50 rounded-2xl p-4">
                    <span className="text-sm font-medium text-gray-600">Restaurant Charges</span>
                    <input type="number" value={restaurantCharges} onChange={e => setRestaurantCharges(Number(e.target.value))} className="w-28 input-field text-right text-sm py-2" />
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax (12%)</span>
                    <span className="font-semibold">₹{taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
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
    </div>
  )
}
