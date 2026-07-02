import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, Info, AlertTriangle, BedDouble, Wrench, User, Phone, Clock, IndianRupee, Calendar } from 'lucide-react'

const ROOM_RATES = { 'Suite': 5000, 'Deluxe': 3000, 'Double': 2000, 'Single': 1500, 'Standard': 1200 }

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [bookingsMap, setBookingsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRoomsAndBookings()
    const channel = supabase
      .channel('rooms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => fetchRoomsAndBookings())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchRoomsAndBookings = async () => {
    const { data: roomData, error: roomError } = await supabase.from('rooms').select('*').order('room_number', { ascending: true })
    if (roomError) console.error("Room fetch error", roomError)
    if (roomData) setRooms(roomData)

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*, guests(name, phone, address, id_proof_type, id_proof_number)')
      .eq('status', 'Active')
    
    if (bookingError) console.error("Booking fetch error", bookingError)
    console.log("Bookings fetched:", bookingData)

    if (bookingData) {
      const map = {}
      bookingData.forEach(b => { map[b.room_id] = b })
      setBookingsMap(map)
    }
    setLoading(false)
  }

  const handleCheckout = async (booking, room) => {
    if (!window.confirm(`Checkout ${booking.guests?.name} from Room ${room.room_number}?`)) return
    setProcessing(true)
    try {
      await supabase.from('bookings').update({ status: 'Completed', check_out: new Date().toISOString() }).eq('id', booking.id)
      await supabase.from('rooms').update({ status: 'Available' }).eq('id', room.id)
      alert('Checkout successful!')
      setSelectedRoom(null)
      fetchRoomsAndBookings()
    } catch (err) { alert('Error: ' + err.message) }
    finally { setProcessing(false) }
  }

  const getDaysStayed = (checkIn) => Math.max(1, Math.ceil((new Date() - new Date(checkIn)) / 86400000))

  const getStatusStyles = (status) => {
    switch(status) {
      case 'Available': return { card: 'border-emerald-200/80 bg-gradient-to-br from-white to-pastel-mint/40', dot: 'bg-emerald-400', icon: 'text-emerald-500' }
      case 'Occupied': return { card: 'border-brand-200/80 bg-gradient-to-br from-white to-pastel-saffron/60', dot: 'bg-brand-500', icon: 'text-brand-500' }
      case 'Maintenance': return { card: 'border-amber-200/80 bg-gradient-to-br from-white to-pastel-yellow/40', dot: 'bg-amber-400', icon: 'text-amber-500' }
      default: return { card: 'border-gray-200 bg-white', dot: 'bg-gray-400', icon: 'text-gray-500' }
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" /></div>

  const counts = { available: rooms.filter(r => r.status === 'Available').length, occupied: rooms.filter(r => r.status === 'Occupied').length, maintenance: rooms.filter(r => r.status === 'Maintenance').length }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card-solid p-6 flex justify-between items-center">
        <div>
          <h1 className="page-header flex items-center"><BedDouble size={28} className="mr-3 text-brand-500" />Room Status</h1>
          <p className="page-subheader">{rooms.length} rooms — Click any room for full details</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex items-center space-x-2 bg-pastel-mint/50 px-4 py-2 rounded-2xl"><div className="w-3 h-3 rounded-full bg-emerald-400" /><span className="text-sm font-semibold text-emerald-700">{counts.available} Free</span></div>
          <div className="flex items-center space-x-2 bg-pastel-saffron/50 px-4 py-2 rounded-2xl"><div className="w-3 h-3 rounded-full bg-brand-500" /><span className="text-sm font-semibold text-brand-700">{counts.occupied} Occupied</span></div>
          <div className="flex items-center space-x-2 bg-pastel-yellow/50 px-4 py-2 rounded-2xl"><div className="w-3 h-3 rounded-full bg-amber-400" /><span className="text-sm font-semibold text-amber-700">{counts.maintenance} Maint.</span></div>
        </div>
      </motion.div>

      {/* Room Grid — detailed cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {rooms.map((room, idx) => {
          const styles = getStatusStyles(room.status)
          const booking = bookingsMap[room.id]
          const rate = ROOM_RATES[room.room_type] || 1500

          return (
            <motion.div
              key={room.id}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedRoom(room)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className={`relative rounded-3xl border-2 cursor-pointer hover:shadow-glass transition-all duration-200 overflow-hidden ${styles.card}`}
            >
              <div className="absolute -right-6 -top-6 w-20 h-20 bg-white/30 rounded-full blur-xl pointer-events-none" />

              {/* Room Header */}
              <div className="p-5 pb-3 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl font-display font-extrabold text-gray-800">{room.room_number}</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-bold text-gray-500 bg-white/70 px-2 py-0.5 rounded-lg">{room.room_type}</span>
                      <span className="text-[10px] text-gray-400">Floor {room.floor}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${styles.dot} animate-pulse-soft`} />
                    <span className="text-[10px] font-bold uppercase text-gray-500">{room.status}</span>
                  </div>
                </div>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <IndianRupee size={11} className="mr-0.5" />
                  <span className="font-semibold text-gray-600">{rate.toLocaleString()}</span>
                  <span className="ml-0.5">/night</span>
                </div>
              </div>

              {/* Guest Info (for occupied rooms) */}
              {room.status === 'Occupied' && booking && (
                <div className="mx-4 mb-4 p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-brand-100/50">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-7 h-7 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                      <User size={13} className="text-brand-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{booking.guests?.name}</p>
                      <p className="text-[10px] text-gray-400 flex items-center"><Phone size={9} className="mr-1" />{booking.guests?.phone}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 pt-1.5 border-t border-brand-50">
                    <span className="flex items-center"><Clock size={9} className="mr-1" />{getDaysStayed(booking.check_in)} night(s)</span>
                    <span>Since {new Date(booking.check_in).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              )}

              {room.status === 'Available' && (
                <div className="mx-4 mb-4 p-2 text-center text-[11px] font-semibold text-emerald-600 bg-emerald-50/50 rounded-xl">✨ Ready for guests</div>
              )}
              {room.status === 'Maintenance' && (
                <div className="mx-4 mb-4 p-2 text-center text-[11px] font-semibold text-amber-600 bg-amber-50/50 rounded-xl flex items-center justify-center"><Wrench size={11} className="mr-1" />Under maintenance</div>
              )}
            </motion.div>
          )
        })}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="modal-overlay" onClick={() => setSelectedRoom(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="modal-content max-w-lg"
            >
              {/* Header */}
              <div className={`p-6 flex justify-between items-center ${
                selectedRoom.status === 'Occupied' ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white'
                : selectedRoom.status === 'Maintenance' ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-white'
                : 'bg-surface-50'
              }`}>
                <div>
                  <h2 className={`text-2xl font-display font-extrabold ${selectedRoom.status === 'Available' ? 'text-gray-800' : 'text-white'}`}>Room {selectedRoom.room_number}</h2>
                  <p className={`text-sm mt-0.5 ${selectedRoom.status === 'Available' ? 'text-gray-400' : 'text-white/70'}`}>{selectedRoom.room_type} • Floor {selectedRoom.floor}</p>
                </div>
                <button onClick={() => setSelectedRoom(null)} className={`p-2 rounded-xl transition-colors ${selectedRoom.status === 'Available' ? 'hover:bg-surface-200 text-gray-500' : 'hover:bg-white/20 text-white'}`}><X size={20} /></button>
              </div>

              <div className="p-6 space-y-5">
                {/* Room Details */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Type</p>
                    <p className="font-bold text-sm text-gray-800">{selectedRoom.room_type}</p>
                  </div>
                  <div className="bg-surface-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Floor</p>
                    <p className="font-bold text-sm text-gray-800">{selectedRoom.floor}</p>
                  </div>
                  <div className="bg-surface-50 rounded-2xl p-4 text-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Rate</p>
                    <p className="font-bold text-sm text-brand-600">₹{(ROOM_RATES[selectedRoom.room_type] || 1500).toLocaleString()}</p>
                  </div>
                </div>

                {/* Guest Details for Occupied */}
                {selectedRoom.status === 'Occupied' && bookingsMap[selectedRoom.id] && (() => {
                  const b = bookingsMap[selectedRoom.id]
                  const g = b.guests
                  return (
                    <div className="bg-brand-50/50 border border-brand-100 rounded-3xl p-5 space-y-4">
                      <h3 className="font-bold text-brand-900 text-sm flex items-center"><Info size={16} className="mr-2" /> Guest Information</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['Name', g?.name],
                          ['Phone', g?.phone],
                          ['ID Proof', `${g?.id_proof_type} — ${g?.id_proof_number}`],
                          ['Address', g?.address],
                          ['Check-in', new Date(b.check_in).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })],
                          ['Expected Out', new Date(b.check_out).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })],
                          ['Duration', `${getDaysStayed(b.check_in)} night(s)`],
                          ['Guests', b.num_guests],
                          ['Purpose', b.purpose],
                          ['Booking ID', b.booking_id],
                        ].map(([label, value]) => (
                          <div key={label} className={`${label === 'Address' ? 'col-span-2' : ''}`}>
                            <p className="text-[10px] text-brand-600/60 font-bold uppercase">{label}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || '—'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {selectedRoom.status === 'Maintenance' && (
                  <div className="bg-pastel-yellow/50 text-amber-800 p-5 rounded-3xl flex items-center border border-amber-200">
                    <Wrench className="mr-3 text-amber-500" size={22} />
                    <p className="font-semibold text-sm">This room is currently under maintenance.</p>
                  </div>
                )}
                {selectedRoom.status === 'Available' && (
                  <div className="bg-pastel-mint/50 text-emerald-700 p-5 rounded-3xl text-center font-semibold text-sm border border-emerald-200">✨ Ready for new guests!</div>
                )}
              </div>

              {selectedRoom.status === 'Occupied' && bookingsMap[selectedRoom.id] && (
                <div className="p-5 border-t border-surface-100">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleCheckout(bookingsMap[selectedRoom.id], selectedRoom)}
                    disabled={processing}
                    className="btn-danger w-full flex items-center justify-center space-x-2 py-4"
                  >
                    <LogOut size={18} />
                    <span>{processing ? 'Processing...' : 'Quick Checkout'}</span>
                  </motion.button>
                  <p className="text-xs text-center text-gray-400 mt-3">This will free the room instantly</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
