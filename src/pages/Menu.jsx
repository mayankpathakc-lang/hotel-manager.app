import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

export default function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Breakfast',
    price: '',
    is_available: true
  })

  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Snacks']

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').order('category')
    if (data) setItems(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await supabase.from('menu_items').update(formData).eq('id', editId)
    } else {
      await supabase.from('menu_items').insert([formData])
    }
    setShowModal(false)
    setFormData({ name: '', category: 'Breakfast', price: '', is_available: true })
    setEditId(null)
    fetchMenu()
  }

  const handleEdit = (item) => {
    setFormData({ name: item.name, category: item.category, price: item.price, is_available: item.is_available })
    setEditId(item.id)
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await supabase.from('menu_items').delete().eq('id', id)
      fetchMenu()
    }
  }

  const toggleAvailability = async (id, currentVal) => {
    await supabase.from('menu_items').update({ is_available: !currentVal }).eq('id', id)
    fetchMenu()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
        <button 
          onClick={() => { setEditId(null); setFormData({ name: '', category: 'Breakfast', price: '', is_available: true }); setShowModal(true) }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700"
        >
          <Plus size={20} className="mr-2" /> Add Item
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-sm text-gray-600">Item Name</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Category</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Price</th>
              <th className="p-4 font-semibold text-sm text-gray-600">Status</th>
              <th className="p-4 font-semibold text-sm text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="p-4 font-medium text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{item.category}</span></td>
                <td className="p-4 font-medium text-gray-800">₹{item.price}</td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleAvailability(item.id, item.is_available)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${item.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}
                  >
                    {item.is_available ? 'Available' : 'Out of Stock'}
                  </button>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editId ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded-full"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="available" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} className="rounded text-indigo-600 w-4 h-4" />
                <label htmlFor="available" className="text-sm font-medium text-gray-700">Mark as available</label>
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
