import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Search, Users, Globe, Phone, FileText } from 'lucide-react'

export default function GuestRecords() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchGuests()
  }, [])

  const fetchGuests = async () => {
    const { data } = await supabase
      .from('guests')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setGuests(data)
    setLoading(false)
  }

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) || 
    g.phone.includes(search)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="page-header flex items-center">
            <Users size={28} className="mr-3 text-brand-500" />
            Guest Records
          </h1>
          <p className="page-subheader">{guests.length} guests registered</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-11 text-sm"
          />
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card"
      >
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Phone</th>
                <th>ID Proof</th>
                <th>Nationality</th>
                <th>Registered On</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest) => (
                <tr key={guest.id}>
                  <td>
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-2xl bg-pastel-lavender flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-brand-600">{guest.name.charAt(0)}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{guest.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-600">
                    <span className="flex items-center"><Phone size={13} className="mr-1.5 text-gray-400" />{guest.phone}</span>
                  </td>
                  <td className="text-gray-600">
                    <span className="flex items-center">
                      <FileText size={13} className="mr-1.5 text-gray-400" />
                      {guest.id_proof_type}
                      <span className="ml-1 text-gray-400">({guest.id_proof_number})</span>
                    </span>
                  </td>
                  <td className="text-gray-600">
                    <span className="flex items-center"><Globe size={13} className="mr-1.5 text-gray-400" />{guest.nationality}</span>
                  </td>
                  <td className="text-gray-500 text-xs font-medium">{new Date(guest.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No guests found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
