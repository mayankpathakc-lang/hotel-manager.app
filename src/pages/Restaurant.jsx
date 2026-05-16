import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react'

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

  if (loading) return <div>Loading POS...</div>

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Categories */}
        <div className="p-4 border-b flex space-x-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenu.map(item => (
            <div 
              key={item.id} 
              onClick={() => addToOrder(item)}
              className="border rounded-xl p-4 cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.category}</p>
              <p className="mt-2 font-bold text-indigo-600">₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Order Section */}
      <div className="w-96 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        <div className="p-4 border-b bg-indigo-50 rounded-t-2xl">
          <h2 className="text-lg font-bold text-indigo-900 flex items-center"><ShoppingCart className="mr-2" size={20} /> Current Order</h2>
        </div>
        
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isTakeaway} onChange={e => setIsTakeaway(e.target.checked)} className="rounded text-indigo-600" />
              <span>Takeaway</span>
            </label>
          </div>
          {!isTakeaway && (
            <div>
              <input 
                type="text" 
                placeholder="Table Number" 
                value={tableNumber} 
                onChange={e => setTableNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {order.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">Select items to add to order</div>
          ) : (
            order.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.name}</h4>
                  <p className="text-xs text-gray-500">₹{item.price}</p>
                </div>
                <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded text-gray-600"><Minus size={14}/></button>
                  <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded text-gray-600"><Plus size={14}/></button>
                </div>
                <div className="w-16 text-right font-semibold text-sm ml-2">
                  ₹{item.price * item.quantity}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bold text-gray-700">Total Amount:</span>
            <span className="text-2xl font-bold text-indigo-600">₹{calculateTotal()}</span>
          </div>
          <button 
            onClick={placeOrder}
            disabled={order.length === 0}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Place Order
          </button>
        </div>
      </div>
    </div>
  )
}
