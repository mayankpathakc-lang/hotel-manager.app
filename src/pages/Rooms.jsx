import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { X, LogOut, Info, AlertTriangle } from 'lucide-react'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeBooking, setActiveBooking] = useState(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchRooms()

    const channel = supabase
      .channel('rooms_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, payload => {
        fetchRooms() // Refresh on change
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRooms = async () => {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number', { ascending: true })
    
    if (data) setRooms(data)
    setLoading(false)
  }

  const handleRoomClick = async (room) => {
    setSelectedRoom(room)
    setActiveBooking(null)
    
    if (room.status === 'Occupied') {
      const { data } = await supabase
        .from('bookings')
        .select('*, guests(name, phone)')
        .eq('room_id', room.id)
        .eq('status', 'Active')
        .single()
      
      if (data) setActiveBooking(data)
    }
  }

  const handleCheckout = async () => {
    if (!activeBooking || !selectedRoom) return
    if (!window.confirm('Are you sure you want to manually checkout this guest?')) return

    setProcessing(true)
    try {
      // Mark booking as Completed
      await supabase
        .from('bookings')
        .update({ status: 'Completed', check_out: new Date().toISOString() })
        .eq('id', activeBooking.id)

      // Mark room as Available
      await supabase
        .from('rooms')
        .update({ status: 'Available' })
        .eq('id', selectedRoom.id)

      alert('Manual checkout successful!')
      setSelectedRoom(null)
      fetchRooms()
    } catch (err) {
      alert('Error during checkout: ' + err.message)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'Occupied': return 'bg-rose-100 text-rose-800 border-rose-300'
      case 'Maintenance': return 'bg-amber-100 text-amber-800 border-amber-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) return <div className="flex justify-center mt-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Room Status</h1>
        <div className="flex space-x-6 bg-gray-50 px-4 py-2 rounded-lg">
          <span className="flex items-center text-sm font-medium text-gray-700"><div className="w-3 h-3 rounded-full bg-emerald-400 mr-2 shadow-sm"></div> Available</span>
          <span className="flex items-center text-sm font-medium text-gray-700"><div className="w-3 h-3 rounded-full bg-rose-400 mr-2 shadow-sm"></div> Occupied</span>
          <span className="flex items-center text-sm font-medium text-gray-700"><div className="w-3 h-3 rounded-full bg-amber-400 mr-2 shadow-sm"></div> Maintenance</span>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5"
      >
        {rooms.map((room, idx) => (
          <motion.div 
            key={room.id}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleRoomClick(room)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-5 rounded-2xl border-2 transition-shadow cursor-pointer hover:shadow-lg relative overflow-hidden ${getStatusColor(room.status)}`}
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex justify-between items-start mb-3 relative z-10">
              <span className="text-2xl font-black">{room.room_number}</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/60 shadow-sm backdrop-blur-sm">{room.room_type}</span>
            </div>
            <div className="text-sm font-medium opacity-80 mb-2 relative z-10">Floor {room.floor}</div>
            <div className="text-xs font-bold uppercase tracking-wider bg-black/5 px-2 py-1 rounded inline-block relative z-10">
              {room.status}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className={`p-6 border-b flex justify-between items-center ${
                selectedRoom.status === 'Occupied' ? 'bg-indigo-600 text-white' : 'bg-gray-50'
              }`}>
                <h2 className={`text-2xl font-bold flex items-center ${selectedRoom.status === 'Occupied' ? 'text-white' : 'text-gray-800'}`}>
                  Room {selectedRoom.room_number}
                </h2>
                <button onClick={() => setSelectedRoom(null)} className={`p-2 rounded-full transition-colors ${selectedRoom.status === 'Occupied' ? 'hover:bg-white/20 text-white' : 'hover:bg-gray-200 text-gray-500'}`}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Type</p>
                    <p className="font-bold text-gray-800">{selectedRoom.room_type}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Floor</p>
                    <p className="font-bold text-gray-800">{selectedRoom.floor}</p>
                  </div>
                </div>

                {selectedRoom.status === 'Occupied' && (
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 shadow-inner">
                    <h3 className="font-bold text-indigo-900 mb-4 flex items-center"><Info size={18} className="mr-2"/> Guest Information</h3>
                    {activeBooking ? (
                      <div className="space-y-3">
                        <p className="flex justify-between items-center border-b border-indigo-100/50 pb-2"><span className="text-indigo-700/70 text-sm">Name</span> <span className="font-semibold text-indigo-950">{activeBooking.guests?.name}</span></p>
                        <p className="flex justify-between items-center border-b border-indigo-100/50 pb-2"><span className="text-indigo-700/70 text-sm">Phone</span> <span className="font-semibold text-indigo-950">{activeBooking.guests?.phone}</span></p>
                        <p className="flex justify-between items-center border-b border-indigo-100/50 pb-2"><span className="text-indigo-700/70 text-sm">Check-in</span> <span className="font-semibold text-indigo-950">{new Date(activeBooking.check_in).toLocaleDateString()}</span></p>
                        <p className="flex justify-between items-center"><span className="text-indigo-700/70 text-sm">Expected Out</span> <span className="font-semibold text-indigo-950">{new Date(activeBooking.check_out).toLocaleDateString()}</span></p>
                      </div>
                    ) : (
                      <div className="flex items-center text-amber-600 bg-amber-50 p-3 rounded-lg"><AlertTriangle size={16} className="mr-2"/> Loading guest details...</div>
                    )}
                  </div>
                )}

                {selectedRoom.status === 'Maintenance' && (
                  <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-200 flex items-center">
                    <AlertTriangle className="mr-3" />
                    <p className="font-medium">This room is currently under maintenance.</p>
                  </div>
                )}
                
                {selectedRoom.status === 'Available' && (
                  <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 text-center font-medium">
                    Ready for new guests!
                  </div>
                )}
              </div>

              {selectedRoom.status === 'Occupied' && (
                <div className="p-5 border-t bg-white">
                  <button 
                    onClick={handleCheckout}
                    disabled={processing || !activeBooking}
                    className="w-full flex items-center justify-center py-3.5 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-md shadow-rose-200 disabled:opacity-50"
                  >
                    <LogOut size={18} className="mr-2" />
                    {processing ? 'Processing...' : 'Manual Early Checkout'}
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-3">This will instantly mark the room as Available.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
