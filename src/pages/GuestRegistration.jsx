import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus, User, MapPin, FileText, BedDouble, Printer, Check } from 'lucide-react'

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
      if (data) {
        const sorted = [...data].sort((a, b) => parseInt(a.room_number, 10) - parseInt(b.room_number, 10))
        setAvailableRooms(sorted)
      }
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
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="page-header flex items-center">
          <UserPlus size={28} className="mr-3 text-brand-500" />
          Guest Check-In
        </h1>
        <p className="page-subheader">Register a new guest and assign a room</p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card-solid overflow-hidden print-area"
      >
        {/* Print header */}
        <div className="hidden print:block text-center p-8 border-b">
          <h1 className="text-3xl font-display font-bold">JOSHI GUEST HOUSE</h1>
          <p className="text-gray-500">Guest Registration Card</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Guest Details Section */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center border-b border-surface-100 pb-3">
              <User size={16} className="mr-2 text-brand-400" /> Guest Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                <input required type="text" name="name" onChange={handleChange} className="input-field" placeholder="Enter full name" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Phone Number</label>
                <input required type="tel" name="phone" onChange={handleChange} className="input-field" placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ID Proof Type</label>
                <select name="id_proof_type" onChange={handleChange} className="select-field">
                  <option>Aadhar</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ID Number</label>
                <input required type="text" name="id_proof_number" onChange={handleChange} className="input-field" placeholder="XXXX-XXXX-XXXX" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Address</label>
                <textarea required name="address" rows="2" onChange={handleChange} className="input-field resize-none" placeholder="Street, City, State, PIN"></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nationality</label>
                <input required type="text" name="nationality" defaultValue="Indian" onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>

          {/* Stay Details Section */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center border-b border-surface-100 pb-3">
              <BedDouble size={16} className="mr-2 text-brand-400" /> Stay Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assign Room</label>
                <select required name="room_id" onChange={handleChange} className="select-field">
                  <option value="">Select a room...</option>
                  {availableRooms.map(room => (
                    <option key={room.id} value={room.id}>Room {room.room_number} - {room.room_type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Number of Guests</label>
                <input required type="number" min="1" name="num_guests" defaultValue={1} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Check-in Date & Time</label>
                <input required type="datetime-local" name="check_in" value={formData.check_in} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Expected Check-out</label>
                <input required type="datetime-local" name="check_out" onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-surface-100 hide-print">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button" 
              onClick={() => window.print()} 
              className="btn-brand-outline flex items-center space-x-2"
            >
              <Printer size={16} />
              <span>Print Slip</span>
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading || !formData.room_id} 
              className="btn-brand flex items-center space-x-2"
            >
              <Check size={16} />
              <span>{loading ? 'Processing...' : 'Complete Check-In'}</span>
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
