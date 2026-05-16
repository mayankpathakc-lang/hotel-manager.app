import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Search } from 'lucide-react'

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

  if (loading) return <div>Loading records...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Guest Records</h1>
        
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-sm text-gray-600">Guest Name</th>
                <th className="p-4 font-semibold text-sm text-gray-600">Phone</th>
                <th className="p-4 font-semibold text-sm text-gray-600">ID Proof</th>
                <th className="p-4 font-semibold text-sm text-gray-600">Nationality</th>
                <th className="p-4 font-semibold text-sm text-gray-600">Registered On</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.map((guest, idx) => (
                <tr key={guest.id} className={`border-b border-gray-50 hover:bg-indigo-50/30 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="p-4 font-medium text-gray-800">{guest.name}</td>
                  <td className="p-4 text-gray-600">{guest.phone}</td>
                  <td className="p-4 text-gray-600">{guest.id_proof_type} ({guest.id_proof_number})</td>
                  <td className="p-4 text-gray-600">{guest.nationality}</td>
                  <td className="p-4 text-gray-600">{new Date(guest.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {filteredGuests.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">No guests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
