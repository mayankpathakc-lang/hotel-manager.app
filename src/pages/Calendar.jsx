import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, ChevronRight, X, CalendarDays, BedDouble, 
  User, Phone, Clock, Check, AlertTriangle, Sparkles
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, isBefore, parseISO
} from 'date-fns'

const TOTAL_ROOMS = 14

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_phone: '',
    guest_id_type: 'Aadhar',
    guest_id_number: '',
    guest_address: '',
    check_in: '',
    check_out: '',
    num_guests: 1,
    purpose: 'Leisure'
  })

  useEffect(() => {
    fetchRooms()
    fetchBookings()
  }, [currentMonth])

  const fetchRooms = async () => {
    const { data } = await supabase.from('rooms').select('*').order('room_number')
    if (data) setRooms(data)
    setLoading(false)
  }

  const fetchBookings = async () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    
    const { data } = await supabase
      .from('bookings')
      .select('*, guests(name, phone), rooms(room_number, room_type)')
      .or(`status.eq.Active,status.eq.Reserved`)
      .gte('check_out', monthStart.toISOString())
      .lte('check_in', addDays(monthEnd, 7).toISOString())
    
    if (data) setBookings(data)
  }

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    
    const days = []
    let day = calStart
    while (day <= calEnd) {
      days.push(day)
      day = addDays(day, 1)
    }
    return days
  }, [currentMonth])

  // Count bookings per day
  const getBookingsForDate = (date) => {
    return bookings.filter(b => {
      const cin = parseISO(b.check_in)
      const cout = parseISO(b.check_out)
      return date >= new Date(cin.toDateString()) && date <= new Date(cout.toDateString())
    })
  }

  // Get available rooms for a date
  const getAvailableRooms = (date) => {
    if (!date) return rooms
    const dayBookings = getBookingsForDate(date)
    const bookedRoomIds = dayBookings.map(b => b.room_id)
    return rooms.filter(r => !bookedRoomIds.includes(r.id) && r.status !== 'Maintenance')
  }

  const handleDateClick = (date) => {
    if (isBefore(date, new Date(new Date().toDateString()))) return
    setSelectedDate(date)
    setSelectedRoom(null)
  }

  const handleRoomSelect = (room) => {
    setSelectedRoom(room)
    setFormData(prev => ({
      ...prev,
      check_in: selectedDate ? format(selectedDate, "yyyy-MM-dd'T'10:00") : '',
      check_out: selectedDate ? format(addDays(selectedDate, 1), "yyyy-MM-dd'T'11:00") : ''
    }))
    setShowBookingModal(true)
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Create guest
      const { data: guest, error: guestErr } = await supabase
        .from('guests')
        .insert([{
          name: formData.guest_name,
          phone: formData.guest_phone,
          id_proof_type: formData.guest_id_type,
          id_proof_number: formData.guest_id_number,
          address: formData.guest_address,
          nationality: 'Indian'
        }])
        .select()
        .single()

      if (guestErr) throw guestErr

      // Determine status: if check_in is in the future, mark as Reserved
      const checkInDate = new Date(formData.check_in)
      const now = new Date()
      const isAdvance = checkInDate > now
      const status = isAdvance ? 'Reserved' : 'Active'

      // Create booking
      const bookingId = 'BKG-' + Date.now().toString().slice(-6)
      const { error: bookErr } = await supabase
        .from('bookings')
        .insert([{
          guest_id: guest.id,
          room_id: selectedRoom.id,
          check_in: formData.check_in,
          check_out: formData.check_out,
          num_guests: formData.num_guests,
          purpose: formData.purpose,
          booking_id: bookingId,
          status
        }])

      if (bookErr) throw bookErr

      // If immediate check-in, mark room as Occupied
      if (!isAdvance) {
        await supabase.from('rooms').update({ status: 'Occupied' }).eq('id', selectedRoom.id)
      }

      alert(`Booking confirmed! ID: ${bookingId}\nStatus: ${status}`)
      setShowBookingModal(false)
      setSelectedRoom(null)
      setFormData({
        guest_name: '', guest_phone: '', guest_id_type: 'Aadhar',
        guest_id_number: '', guest_address: '', check_in: '', check_out: '',
        num_guests: 1, purpose: 'Leisure'
      })
      fetchBookings()
      fetchRooms()
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const availableRooms = selectedDate ? getAvailableRooms(selectedDate) : []

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
          <CalendarDays size={28} className="mr-3 text-brand-500" />
          Booking Calendar
        </h1>
        <p className="page-subheader">Select a date to view availability and schedule advance bookings</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-card-solid overflow-hidden"
        >
          {/* Month Navigation */}
          <div className="p-6 border-b border-surface-100 flex items-center justify-between">
            <button 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <h2 className="text-xl font-display font-bold text-gray-800">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
            >
              <ChevronRight size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 bg-surface-50">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayBookings = getBookingsForDate(day)
              const bookedCount = dayBookings.length
              const availCount = TOTAL_ROOMS - bookedCount
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const isPast = isBefore(day, new Date(new Date().toDateString()))
              const today = isToday(day)

              return (
                <motion.div
                  key={idx}
                  whileHover={!isPast ? { scale: 1.05 } : {}}
                  whileTap={!isPast ? { scale: 0.95 } : {}}
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative p-3 min-h-[90px] border-b border-r border-surface-100
                    transition-all duration-150 cursor-pointer
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isPast ? 'opacity-40 cursor-not-allowed' : 'hover:bg-brand-50/30'}
                    ${isSelected ? 'bg-brand-50 ring-2 ring-brand-300 ring-inset z-10' : ''}
                    ${today ? 'bg-pastel-yellow/30' : ''}
                  `}
                >
                  <div className="flex items-start justify-between">
                    <span className={`
                      text-sm font-bold
                      ${today ? 'bg-brand-500 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}
                      ${isSelected && !today ? 'text-brand-600' : 'text-gray-700'}
                    `}>
                      {format(day, 'd')}
                    </span>
                  </div>

                  {isCurrentMonth && !isPast && (
                    <div className="mt-2 space-y-1">
                      {bookedCount > 0 && (
                        <div className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-pastel-rose/60 text-rose-600 inline-block">
                          {bookedCount} booked
                        </div>
                      )}
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block ${
                        availCount > 5 ? 'bg-pastel-mint/60 text-emerald-600' : 
                        availCount > 0 ? 'bg-pastel-yellow/60 text-amber-600' :
                        'bg-pastel-rose/60 text-rose-600'
                      }`}>
                        {availCount} free
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="p-4 bg-surface-50 border-t border-surface-100 flex items-center space-x-6 text-xs">
            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-pastel-mint mr-2" /> Available ({'>'}5)</span>
            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-pastel-yellow mr-2" /> Limited (1-5)</span>
            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-pastel-rose mr-2" /> Full / Booked</span>
            <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-brand-500 mr-2" /> Today</span>
          </div>
        </motion.div>

        {/* Side Panel — Room Availability */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-solid flex flex-col"
        >
          <div className="p-6 border-b border-surface-100">
            <h3 className="font-display font-bold text-gray-800">
              {selectedDate ? (
                <>
                  <span className="text-brand-500">{format(selectedDate, 'MMM d')}</span>
                  <span className="text-gray-400 ml-1">{format(selectedDate, 'yyyy')}</span>
                </>
              ) : 'Select a Date'}
            </h3>
            {selectedDate && (
              <p className="text-xs text-gray-400 mt-1">
                {availableRooms.length} of {rooms.length} rooms available
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 py-12">
                <CalendarDays size={48} className="mb-4" />
                <p className="font-medium text-gray-400">Click a date on the calendar</p>
                <p className="text-xs text-gray-300 mt-1">to see room availability</p>
              </div>
            ) : availableRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <AlertTriangle size={36} className="mb-3 text-amber-400" />
                <p className="font-semibold">Fully Booked</p>
                <p className="text-xs mt-1">No rooms available for this date</p>
              </div>
            ) : (
              availableRooms.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoomSelect(room)}
                  className={`
                    p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                    ${selectedRoom?.id === room.id 
                      ? 'border-brand-400 bg-brand-50 shadow-pastel' 
                      : 'border-surface-200 bg-white hover:border-brand-200 hover:shadow-sm'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <BedDouble size={16} className="text-brand-400" />
                        <span className="font-bold text-gray-800">Room {room.room_number}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{room.room_type} • Floor {room.floor}</p>
                    </div>
                    <div className="badge-available text-[10px]">Available</div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {selectedDate && availableRooms.length > 0 && (
            <div className="p-4 border-t border-surface-100 bg-surface-50">
              <p className="text-xs text-gray-400 text-center">Click a room to book it</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && selectedRoom && (
          <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="modal-content max-w-xl"
            >
              {/* Modal Header */}
              <div className="p-6 bg-gradient-to-r from-brand-500 to-brand-600 text-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-display font-bold flex items-center">
                    <Sparkles size={20} className="mr-2" />
                    Book Room {selectedRoom.room_number}
                  </h2>
                  <p className="text-brand-100 text-sm mt-0.5">{selectedRoom.room_type} • Floor {selectedRoom.floor}</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="p-2 rounded-xl hover:bg-white/20 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
                {/* Guest Details */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <User size={14} className="mr-2" /> Guest Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                      <input required type="text" value={formData.guest_name} onChange={e => setFormData({...formData, guest_name: e.target.value})} className="input-field text-sm" placeholder="Guest name" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                      <input required type="tel" value={formData.guest_phone} onChange={e => setFormData({...formData, guest_phone: e.target.value})} className="input-field text-sm" placeholder="Phone number" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">ID Type</label>
                      <select value={formData.guest_id_type} onChange={e => setFormData({...formData, guest_id_type: e.target.value})} className="select-field text-sm">
                        <option>Aadhar</option>
                        <option>Passport</option>
                        <option>Driving License</option>
                        <option>Voter ID</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">ID Number</label>
                      <input required type="text" value={formData.guest_id_number} onChange={e => setFormData({...formData, guest_id_number: e.target.value})} className="input-field text-sm" placeholder="ID number" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Address</label>
                      <input required type="text" value={formData.guest_address} onChange={e => setFormData({...formData, guest_address: e.target.value})} className="input-field text-sm" placeholder="Full address" />
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div>
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                    <Clock size={14} className="mr-2" /> Stay Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Check-in</label>
                      <input required type="datetime-local" value={formData.check_in} onChange={e => setFormData({...formData, check_in: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Check-out</label>
                      <input required type="datetime-local" value={formData.check_out} onChange={e => setFormData({...formData, check_out: e.target.value})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Guests</label>
                      <input required type="number" min="1" value={formData.num_guests} onChange={e => setFormData({...formData, num_guests: parseInt(e.target.value)})} className="input-field text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Purpose</label>
                      <select value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})} className="select-field text-sm">
                        <option>Leisure</option>
                        <option>Business</option>
                        <option>Medical</option>
                        <option>Event</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Info note */}
                <div className="bg-pastel-sky/40 border border-sky-200 rounded-2xl p-4 flex items-start space-x-3">
                  <AlertTriangle size={18} className="text-sky-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-sky-700">
                    If the check-in date is in the future, this booking will be marked as <strong>Reserved</strong>. 
                    For same-day bookings, the guest will be checked in immediately.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setShowBookingModal(false)} className="btn-ghost flex-1">
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }} 
                    type="submit" 
                    disabled={submitting}
                    className="btn-brand flex-1 flex items-center justify-center space-x-2"
                  >
                    <Check size={18} />
                    <span>{submitting ? 'Booking...' : 'Confirm Booking'}</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
