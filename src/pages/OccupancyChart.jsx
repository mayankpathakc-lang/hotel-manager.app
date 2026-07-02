import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Grid3x3, BedDouble, Info
} from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, addMonths, subMonths,
  eachDayOfInterval, parseISO, isToday, isWeekend, isSameDay
} from 'date-fns'

export default function OccupancyChart() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [rooms, setRooms] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState(null) // { roomId, dateStr }
  const [tooltip, setTooltip] = useState(null)

  useEffect(() => {
    fetchData()
  }, [currentMonth])

  const fetchData = async () => {
    setLoading(true)

    const { data: roomData } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number')

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*, guests(name, phone)')
      .or('status.eq.Active,status.eq.Reserved')
      .gte('check_out', monthStart.toISOString())
      .lte('check_in', monthEnd.toISOString())

    if (roomData) setRooms(roomData)
    if (bookingData) setBookings(bookingData)
    setLoading(false)
  }

  // Generate array of all dates in the month
  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth)
    })
  }, [currentMonth])

  // Build a lookup: roomId -> [ { booking, startDay, endDay } ]
  const bookingMap = useMemo(() => {
    const map = {}
    rooms.forEach(r => { map[r.id] = [] })

    bookings.forEach(b => {
      if (!map[b.room_id]) return
      const cin = parseISO(b.check_in)
      const cout = parseISO(b.check_out)
      map[b.room_id].push({ booking: b, checkIn: cin, checkOut: cout })
    })

    return map
  }, [rooms, bookings])

  // Check if a room is booked on a given day
  const getBookingForCell = (roomId, day) => {
    const entries = bookingMap[roomId] || []
    for (const entry of entries) {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
      const cinDay = new Date(entry.checkIn.getFullYear(), entry.checkIn.getMonth(), entry.checkIn.getDate())
      const coutDay = new Date(entry.checkOut.getFullYear(), entry.checkOut.getMonth(), entry.checkOut.getDate())
      if (dayStart >= cinDay && dayStart <= coutDay) {
        return entry
      }
    }
    return null
  }

  // Is this cell the first day of a booking span (for rendering the label bar)
  const isBookingStart = (roomId, day) => {
    const entry = getBookingForCell(roomId, day)
    if (!entry) return false
    const cinDay = new Date(entry.checkIn.getFullYear(), entry.checkIn.getMonth(), entry.checkIn.getDate())
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    const monthStartDay = startOfMonth(currentMonth)
    // It's a "start" if cinDay == dayStart, OR if cinDay is before the month and day is the 1st
    return isSameDay(cinDay, dayStart) || (cinDay < monthStartDay && isSameDay(dayStart, monthStartDay))
  }

  // Get booking span length (in visible days within the month)
  const getBookingSpan = (roomId, day) => {
    const entry = getBookingForCell(roomId, day)
    if (!entry) return 1
    const coutDay = new Date(entry.checkOut.getFullYear(), entry.checkOut.getMonth(), entry.checkOut.getDate())
    const monthEnd = endOfMonth(currentMonth)
    const endDate = coutDay > monthEnd ? monthEnd : coutDay
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
    const diff = Math.floor((endDate - dayStart) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(diff, 1)
  }

  // Count stats
  const totalRooms = rooms.length
  const occupancyStats = useMemo(() => {
    let totalCells = totalRooms * daysInMonth.length
    let occupiedCells = 0
    daysInMonth.forEach(day => {
      rooms.forEach(room => {
        if (getBookingForCell(room.id, day)) occupiedCells++
      })
    })
    return {
      rate: totalCells > 0 ? Math.round((occupiedCells / totalCells) * 100) : 0,
      occupiedCells,
      totalCells
    }
  }, [rooms, daysInMonth, bookingMap])

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
          <Grid3x3 size={28} className="mr-3 text-brand-500" />
          Room Occupancy Chart
        </h1>
        <p className="page-subheader">Monthly view — dates across the top, rooms on the left</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center space-x-3 bg-white rounded-2xl shadow-glass border border-surface-200 px-2 py-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <h2 className="text-lg font-display font-bold text-gray-800 min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 rounded-xl hover:bg-surface-100 transition-colors"
          >
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-2xl shadow-sm border border-surface-200 px-4 py-2">
            <div className="w-3 h-3 rounded-full bg-brand-400"></div>
            <span className="text-sm font-semibold text-gray-600">{occupancyStats.rate}% Occupancy</span>
          </div>
          <div className="flex items-center space-x-4 text-xs font-semibold text-gray-500">
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 mr-1.5"></span> Available</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-brand-400 mr-1.5"></span> Occupied</span>
            <span className="flex items-center"><span className="w-3 h-3 rounded bg-amber-200 border border-amber-400 mr-1.5"></span> Weekend</span>
          </div>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card-solid overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: `${120 + daysInMonth.length * 38}px` }}>
            <thead>
              {/* Date numbers row */}
              <tr className="bg-surface-50">
                <th className="sticky left-0 z-20 bg-surface-50 border-b border-r border-surface-200 px-4 py-3 text-left min-w-[120px]">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                    <BedDouble size={14} className="mr-1.5 text-brand-400" /> Room
                  </span>
                </th>
                {daysInMonth.map((day, idx) => {
                  const today = isToday(day)
                  const weekend = isWeekend(day)
                  return (
                    <th
                      key={idx}
                      className={`
                        border-b border-r border-surface-200 text-center px-0 py-0 min-w-[36px] max-w-[36px]
                        ${weekend ? 'bg-amber-50/50' : ''}
                        ${today ? 'bg-brand-100' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center py-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">
                          {format(day, 'EEE')}
                        </span>
                        <span className={`
                          text-sm font-bold mt-0.5
                          ${today ? 'bg-brand-500 text-white w-7 h-7 rounded-full flex items-center justify-center' : 'text-gray-700'}
                        `}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room, roomIdx) => (
                <tr key={room.id} className="group">
                  {/* Room label */}
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-brand-50/30 border-b border-r border-surface-200 px-4 py-2 transition-colors">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-800">{room.room_number}</span>
                      <span className="text-[10px] font-semibold text-gray-400 bg-surface-100 px-1.5 py-0.5 rounded">
                        {room.room_type}
                      </span>
                    </div>
                  </td>

                  {/* Day cells */}
                  {daysInMonth.map((day, dayIdx) => {
                    const entry = getBookingForCell(room.id, day)
                    const isStart = isBookingStart(room.id, day)
                    const span = isStart ? getBookingSpan(room.id, day) : 0
                    const today = isToday(day)
                    const weekend = isWeekend(day)
                    const cellKey = `${room.id}-${format(day, 'yyyy-MM-dd')}`
                    const isHovered = hoveredCell === cellKey

                    // If this cell is in the middle of a booking span (not the start), render empty
                    if (entry && !isStart) {
                      return (
                        <td
                          key={dayIdx}
                          className={`border-b border-surface-100 p-0 relative ${weekend && !entry ? 'bg-amber-50/30' : ''}`}
                        />
                      )
                    }

                    return (
                      <td
                        key={dayIdx}
                        colSpan={isStart ? Math.min(span, daysInMonth.length - dayIdx) : 1}
                        className={`
                          border-b border-r border-surface-100 p-0 relative
                          ${!entry && weekend ? 'bg-amber-50/30' : ''}
                          ${!entry && today ? 'bg-brand-50/30' : ''}
                          ${!entry ? 'hover:bg-emerald-50' : ''}
                        `}
                        onMouseEnter={() => {
                          if (entry) {
                            setHoveredCell(cellKey)
                            setTooltip({
                              guest: entry.booking.guests?.name || 'Guest',
                              phone: entry.booking.guests?.phone || '',
                              checkIn: format(entry.checkIn, 'MMM d'),
                              checkOut: format(entry.checkOut, 'MMM d'),
                              status: entry.booking.status,
                              room: room.room_number
                            })
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredCell(null)
                          setTooltip(null)
                        }}
                      >
                        {isStart && entry ? (
                          <div className="relative">
                            <div
                              className={`
                                mx-0.5 my-1 rounded-lg px-1.5 py-1 text-[10px] font-bold truncate cursor-pointer
                                transition-all duration-150
                                ${entry.booking.status === 'Active'
                                  ? 'bg-gradient-to-r from-brand-400 to-brand-500 text-white shadow-sm'
                                  : 'bg-gradient-to-r from-sky-300 to-sky-400 text-white shadow-sm'
                                }
                                ${isHovered ? 'ring-2 ring-brand-300 ring-offset-1 scale-[1.02]' : ''}
                              `}
                              style={{ minHeight: '26px', lineHeight: '18px' }}
                            >
                              {entry.booking.guests?.name?.split(' ')[0] || 'Guest'}
                            </div>
                            
                            {/* Tooltip */}
                            {isHovered && tooltip && (
                              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 pointer-events-none">
                                <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl text-xs whitespace-nowrap space-y-1.5">
                                  <div className="font-bold text-sm flex items-center">
                                    <BedDouble size={12} className="mr-1.5 text-brand-300" />
                                    Room {tooltip.room} — {tooltip.guest}
                                  </div>
                                  <div className="text-gray-300">📞 {tooltip.phone || 'N/A'}</div>
                                  <div className="text-gray-300">📅 {tooltip.checkIn} → {tooltip.checkOut}</div>
                                  <div className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    tooltip.status === 'Active' ? 'bg-brand-500/30 text-brand-200' : 'bg-sky-500/30 text-sky-200'
                                  }`}>
                                    {tooltip.status}
                                  </div>
                                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Empty available cell
                          <div className="w-full h-[34px] flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${
                              today ? 'bg-brand-200' : 'bg-emerald-200/60'
                            }`} />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Info size={14} />
            <span>Hover over a booking to see guest details. Scroll horizontally to see all dates.</span>
          </div>
          <div className="text-xs font-semibold text-gray-500">
            {rooms.length} rooms • {daysInMonth.length} days
          </div>
        </div>
      </motion.div>
    </div>
  )
}
