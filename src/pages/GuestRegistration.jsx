import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function GuestRegistration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [availableRooms, setAvailableRooms] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    id_proof_type: 'Aadhar',
    id_proof_number: '',
    address: '',
    nationality: 'Indian',
    room_id: '',
    check_in: new Date().toISOString().slice(0, 16),
    check_out: '',
    num_guests: 1,
    purpose: 'Leisure'
  })

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase.from('rooms').select('*').eq('status', 'Available')
      if (data) setAvailableRooms(data)
    }
    fetchRooms()
  }, [])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Create Guest
      const { data: guestData, error: guestError } = await supabase
        .from('guests')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          id_proof_type: formData.id_proof_type,
          id_proof_number: formData.id_proof_number,
          address: formData.address,
          nationality: formData.nationality
        }])
        .select()
        .single()

      if (guestError) throw guestError

      // 2. Create Booking
      const bookingId = 'BKG-' + Date.now().toString().slice(-6)
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          guest_id: guestData.id,
          room_id: formData.room_id,
          check_in: formData.check_in,
          check_out: formData.check_out,
          num_guests: formData.num_guests,
          purpose: formData.purpose,
          booking_id: bookingId,
          status: 'Active'
        }])

      if (bookingError) throw bookingError

      // 3. Update Room Status
      await supabase
        .from('rooms')
        .update({ status: 'Occupied' })
        .eq('id', formData.room_id)

      alert('Check-in successful! Booking ID: ' + bookingId)
      navigate('/rooms')
    } catch (error) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center hide-print">
        <h1 className="text-3xl font-bold text-gray-800">Guest Check-In</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 print-area">
        <div className="hidden print:block text-center mb-8 pb-4 border-b">
          <h1 className="text-3xl font-bold">LUMIERE HOTEL</h1>
          <p className="text-gray-500">Guest Registration Card</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Guest Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input required type="text" name="name" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" name="phone" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
                <select name="id_proof_type" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option>Aadhar</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input required type="text" name="id_proof_number" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                <textarea required name="address" rows="2" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input required type="text" name="nationality" defaultValue="Indian" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Stay Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Room</label>
                <select required name="room_id" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select a room...</option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>Room {room.room_number} - {room.room_type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Guests</label>
                <input required type="number" min="1" name="num_guests" defaultValue={1} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date & Time</label>
                <input required type="datetime-local" name="check_in" value={formData.check_in} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Check-out</label>
                <input required type="datetime-local" name="check_out" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 hide-print">
            <button type="button" onClick={() => window.print()} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Print Slip
            </button>
            <button type="submit" disabled={loading || !formData.room_id} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {loading ? 'Processing...' : 'Complete Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
