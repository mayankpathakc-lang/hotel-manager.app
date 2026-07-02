import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { motion } from 'framer-motion'
import { Plus, Minus, ShoppingCart, Trash2, UtensilsCrossed, Send } from 'lucide-react'

export default function Restaurant() {
  const [menu, setMenu] = useState([])
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [order, setOrder] = useState([])
  const [tableNumber, setTableNumber] = useState('')
  const [isTakeaway, setIsTakeaway] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    const { data } = await supabase.from('menu_items').select('*').eq('is_available', true)
    if (data) {
      setMenu(data)
      const cats = ['All', ...new Set(data.map(item => item.category))]
      setCategories(cats)
    }
    setLoading(false)
  }

  const addToOrder = (item) => {
    const existing = order.find(i => i.id === item.id)
    if (existing) {
      setOrder(order.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      setOrder([...order, { ...item, quantity: 1 }])
    }
  }

  const updateQuantity = (id, delta) => {
    setOrder(order.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta
        return newQ > 0 ? { ...i, quantity: newQ } : null
      }
      return i
    }).filter(Boolean))
  }

  const calculateTotal = () => order.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const placeOrder = async () => {
    if (order.length === 0) return alert('Order is empty')
    if (!isTakeaway && !tableNumber) return alert('Please enter a table number')

    try {
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert([{ table_number: tableNumber, is_takeaway: isTakeaway, status: 'Pending' }])
        .select()
        .single()
      
      if (orderError) throw orderError

      const orderItems = order.map(item => ({
        order_id: newOrder.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        price_at_time: item.price
      }))

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
      if (itemsError) throw itemsError

      alert('Order placed successfully! Order ID: ' + newOrder.id)
      setOrder([])
      setTableNumber('')
    } catch (err) {
      alert('Error placing order: ' + err.message)
    }
  }

  const filteredMenu = activeCategory === 'All' ? menu : menu.filter(m => m.category === activeCategory)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="page-header flex items-center">
          <UtensilsCrossed size={28} className="mr-3 text-amber-500" />
          Restaurant POS
        </h1>
        <p className="page-subheader">Select items and place orders</p>
      </motion.div>

      <div className="flex h-[calc(100vh-12rem)] gap-6">
        {/* Menu Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass-card-solid flex flex-col overflow-hidden"
        >
          {/* Categories */}
          <div className="p-4 border-b border-surface-100 flex space-x-2 overflow-x-auto">
            {categories.map(cat => (
              <motion.button
                key={cat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  activeCategory === cat 
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-pastel' 
                    : 'bg-surface-100 text-gray-600 hover:bg-surface-200'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenu.map(item => (
              <motion.div 
                key={item.id} 
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => addToOrder(item)}
                className="border-2 border-surface-200 rounded-3xl p-5 cursor-pointer hover:border-brand-300 hover:shadow-pastel transition-all duration-200 group bg-white"
              >
                <h3 className="font-bold text-sm text-gray-800 group-hover:text-brand-600 transition-colors">{item.name}</h3>
                <span className="text-[10px] font-bold text-gray-400 bg-surface-100 px-2 py-0.5 rounded-lg inline-block mt-1">{item.category}</span>
                <p className="mt-3 font-display font-extrabold text-lg text-brand-600">₹{item.price}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Order Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="w-96 glass-card-solid flex flex-col shrink-0"
        >
          <div className="p-5 border-b border-surface-100 bg-pastel-lavender/30">
            <h2 className="text-lg font-display font-bold text-gray-800 flex items-center">
              <ShoppingCart className="mr-2 text-brand-500" size={20} /> Current Order
              {order.length > 0 && (
                <span className="ml-auto badge bg-brand-100 text-brand-600 text-[10px]">{order.length}</span>
              )}
            </h2>
          </div>
          
          <div className="p-4 border-b border-surface-100 space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                isTakeaway ? 'bg-brand-500 border-brand-500' : 'border-surface-300'
              }`} onClick={() => setIsTakeaway(!isTakeaway)}>
                {isTakeaway && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-sm font-semibold text-gray-700">Takeaway</span>
            </label>
            {!isTakeaway && (
              <input 
                type="text" 
                placeholder="Table Number" 
                value={tableNumber} 
                onChange={e => setTableNumber(e.target.value)}
                className="input-field text-sm py-2.5"
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {order.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <ShoppingCart size={36} className="mb-3" />
                <p className="font-medium text-gray-400 text-sm">No items yet</p>
                <p className="text-xs text-gray-300">Click menu items to add</p>
              </div>
            ) : (
              order.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-surface-50 rounded-2xl p-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-gray-800 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-400">₹{item.price}</p>
                  </div>
                  <div className="flex items-center space-x-2 bg-white rounded-xl p-1 border border-surface-200 mx-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 hover:bg-surface-100 rounded-lg text-gray-500 transition-colors">
                      <Minus size={12}/>
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 hover:bg-surface-100 rounded-lg text-gray-500 transition-colors">
                      <Plus size={12}/>
                    </button>
                  </div>
                  <div className="w-16 text-right font-bold text-sm text-brand-600">
                    ₹{item.price * item.quantity}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 border-t border-surface-100 bg-surface-50">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-600 text-sm">Total:</span>
              <span className="text-2xl font-display font-extrabold text-gradient">₹{calculateTotal()}</span>
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={placeOrder}
              disabled={order.length === 0}
              className="btn-brand w-full flex items-center justify-center space-x-2"
            >
              <Send size={16} />
              <span>Place Order</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
