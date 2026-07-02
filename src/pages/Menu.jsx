import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, UtensilsCrossed, Check } from 'lucide-react'

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
    let res
    if (editId) {
      res = await supabase.from('menu_items').update(formData).eq('id', editId)
    } else {
      res = await supabase.from('menu_items').insert([formData])
    }
    
    if (res.error) {
      alert(`Error saving item: ${res.error.message}`)
      console.error(res.error)
      return
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
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (error) {
        alert(`Error deleting item: ${error.message}`)
        console.error(error)
      } else {
        fetchMenu()
      }
    }
  }

  const toggleAvailability = async (id, currentVal) => {
    const { error } = await supabase.from('menu_items').update({ is_available: !currentVal }).eq('id', id)
    if (error) {
      alert(`Error updating availability: ${error.message}`)
      console.error(error)
    } else {
      fetchMenu()
    }
  }

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
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="page-header flex items-center">
            <UtensilsCrossed size={28} className="mr-3 text-amber-500" />
            Menu Management
          </h1>
          <p className="page-subheader">{items.length} items configured</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setEditId(null); setFormData({ name: '', category: 'Breakfast', price: '', is_available: true }); setShowModal(true) }}
          className="btn-brand flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Add Item</span>
        </motion.button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card"
      >
        <table className="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td className="font-semibold text-gray-800">{item.name}</td>
                <td>
                  <span className="text-[10px] font-bold text-gray-500 bg-surface-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">{item.category}</span>
                </td>
                <td className="font-display font-bold text-brand-600">₹{item.price}</td>
                <td>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleAvailability(item.id, item.is_available)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      item.is_available 
                        ? 'bg-pastel-mint text-emerald-700 hover:bg-emerald-200' 
                        : 'bg-pastel-rose text-rose-700 hover:bg-rose-200'
                    }`}
                  >
                    {item.is_available ? '✓ Available' : '✕ Out of Stock'}
                  </motion.button>
                </td>
                <td className="text-right space-x-1">
                  <button onClick={() => handleEdit(item)} className="p-2.5 text-brand-500 hover:bg-brand-50 rounded-xl transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2.5 text-rose-500 hover:bg-pastel-rose rounded-xl transition-colors">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="modal-content max-w-md"
            >
              <div className="flex justify-between items-center p-6 border-b border-surface-100">
                <h2 className="text-xl font-display font-bold text-gray-800">{editId ? 'Edit Item' : 'Add New Item'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:bg-surface-100 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Item Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="Dish name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="select-field">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Price (₹)</label>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="input-field" placeholder="0.00" />
                </div>
                <label className="flex items-center space-x-3 cursor-pointer pt-1">
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                    formData.is_available ? 'bg-brand-500 border-brand-500' : 'border-surface-300'
                  }`} onClick={() => setFormData({...formData, is_available: !formData.is_available})}>
                    {formData.is_available && <Check size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Mark as available</span>
                </label>
                <div className="pt-3 flex justify-end space-x-3 border-t border-surface-100">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-brand">
                    Save Item
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
