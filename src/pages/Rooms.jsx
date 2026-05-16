import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Rooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'Occupied': return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'Maintenance': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) return <div>Loading rooms...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Room Status</h1>
        <div className="flex space-x-2">
          <span className="flex items-center text-sm text-gray-600"><div className="w-3 h-3 rounded-full bg-emerald-400 mr-2"></div> Available</span>
          <span className="flex items-center text-sm text-gray-600 ml-4"><div className="w-3 h-3 rounded-full bg-rose-400 mr-2"></div> Occupied</span>
          <span className="flex items-center text-sm text-gray-600 ml-4"><div className="w-3 h-3 rounded-full bg-amber-400 mr-2"></div> Maintenance</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {rooms.map(room => (
          <div 
            key={room.id} 
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${getStatusColor(room.status)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xl font-bold">{room.room_number}</span>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/50">{room.room_type}</span>
            </div>
            <div className="text-sm font-medium opacity-80 mb-2">Floor {room.floor}</div>
            <div className="text-xs font-bold uppercase tracking-wider">{room.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
