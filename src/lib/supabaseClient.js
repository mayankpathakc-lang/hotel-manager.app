// Mock Supabase Client using browser LocalStorage for offline-only usage

class QueryBuilder {
  constructor(table, data) {
    this.table = table
    this._data = [...data]
    this._queryData = [...data]
    this._error = null
    this._single = false
  }

  select(columns = '*') {
    return this
  }

  eq(column, value) {
    this._queryData = this._queryData.filter(row => row[column] === value)
    return this
  }

  gte(column, value) {
    this._queryData = this._queryData.filter(row => {
      if (!row[column]) return false
      return new Date(row[column]) >= new Date(value)
    })
    return this
  }

  lte(column, value) {
    this._queryData = this._queryData.filter(row => {
      if (!row[column]) return false
      return new Date(row[column]) <= new Date(value)
    })
    return this
  }

  or(filtersString) {
    const filters = filtersString.split(',').map(f => {
      const parts = f.split('.')
      return { col: parts[0], op: parts[1], val: parts[2] }
    })

    this._queryData = this._queryData.filter(row => {
      return filters.some(filter => {
        if (filter.op === 'eq') {
          return row[filter.col] === filter.val
        }
        return false
      })
    })
    return this
  }

  order(column, { ascending = true } = {}) {
    this._queryData.sort((a, b) => {
      if (a[column] < b[column]) return ascending ? -1 : 1
      if (a[column] > b[column]) return ascending ? 1 : -1
      return 0
    })
    return this
  }

  limit(count) {
    this._queryData = this._queryData.slice(0, count)
    return this
  }

  single() {
    this._single = true
    return this
  }

  async then(resolve, reject) {
    try {
      await new Promise(r => setTimeout(r, 50))
      let result = this._queryData

      // Mock relations/joins
      if (this.table === 'bookings') {
        const guests = JSON.parse(localStorage.getItem('db_guests') || '[]')
        const rooms = JSON.parse(localStorage.getItem('db_rooms') || '[]')
        result = result.map(b => ({
          ...b,
          guests: guests.find(g => g.id === b.guest_id) || null,
          rooms: rooms.find(r => r.id === b.room_id) || null
        }))
      } else if (this.table === 'bills') {
        const orders = JSON.parse(localStorage.getItem('db_orders') || '[]')
        result = result.map(bill => ({
          ...bill,
          orders: orders.find(o => o.id === bill.order_id) || null
        }))
      } else if (this.table === 'order_items') {
        const menu = JSON.parse(localStorage.getItem('db_menu_items') || '[]')
        result = result.map(item => ({
          ...item,
          menu_items: menu.find(m => m.id === item.menu_item_id) || null
        }))
      }

      if (this._single) {
        result = result.length > 0 ? result[0] : null
      }

      resolve({ data: result, error: this._error, count: Array.isArray(result) ? result.length : (result ? 1 : 0) })
    } catch (err) {
      resolve({ data: null, error: err, count: null })
    }
  }

  async insert(rows) {
    const isArray = Array.isArray(rows)
    const newRows = (isArray ? rows : [rows]).map(row => ({
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      ...row
    }))

    const allData = JSON.parse(localStorage.getItem('db_' + this.table) || '[]')
    localStorage.setItem('db_' + this.table, JSON.stringify([...allData, ...newRows]))
    window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table))

    return { data: isArray ? newRows : newRows[0], error: null }
  }

  async update(updates) {
    const allData = JSON.parse(localStorage.getItem('db_' + this.table) || '[]')
    const idsToUpdate = new Set(this._queryData.map(r => r.id))

    const newData = allData.map(row => {
      if (idsToUpdate.has(row.id)) {
        return { ...row, ...updates }
      }
      return row
    })

    localStorage.setItem('db_' + this.table, JSON.stringify(newData))
    window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table))
    return { data: newData.filter(r => idsToUpdate.has(r.id)), error: null }
  }

  async delete() {
    const allData = JSON.parse(localStorage.getItem('db_' + this.table) || '[]')
    const idsToDelete = new Set(this._queryData.map(r => r.id))

    const newData = allData.filter(row => !idsToDelete.has(row.id))
    localStorage.setItem('db_' + this.table, JSON.stringify(newData))
    window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table))
    return { data: null, error: null }
  }
}

// Seed Mock Data
const initDB = () => {
  if (!localStorage.getItem('db_rooms')) {
    const defaultRooms = [
      { id: 'r1', room_number: '101', room_type: 'Single', floor: 1, status: 'Available', price_per_night: 1200 },
      { id: 'r2', room_number: '102', room_type: 'Double', floor: 1, status: 'Available', price_per_night: 1800 },
      { id: 'r3', room_number: '103', room_type: 'Double', floor: 1, status: 'Available', price_per_night: 1800 },
      { id: 'r4', room_number: '104', room_type: 'Suite', floor: 1, status: 'Available', price_per_night: 3500 },
      { id: 'r5', room_number: '105', room_type: 'Single', floor: 1, status: 'Available', price_per_night: 1200 },
      { id: 'r6', room_number: '106', room_type: 'Double', floor: 1, status: 'Available', price_per_night: 1800 },
      { id: 'r7', room_number: '107', room_type: 'Suite', floor: 1, status: 'Available', price_per_night: 3500 },
      { id: 'r8', room_number: '201', room_type: 'Single', floor: 2, status: 'Available', price_per_night: 1400 },
      { id: 'r9', room_number: '202', room_type: 'Double', floor: 2, status: 'Available', price_per_night: 2200 },
      { id: 'r10', room_number: '203', room_type: 'Double', floor: 2, status: 'Available', price_per_night: 2200 },
      { id: 'r11', room_number: '204', room_type: 'Suite', floor: 2, status: 'Available', price_per_night: 4000 },
      { id: 'r12', room_number: '205', room_type: 'Single', floor: 2, status: 'Available', price_per_night: 1400 },
      { id: 'r13', room_number: '206', room_type: 'Double', floor: 2, status: 'Available', price_per_night: 2200 },
      { id: 'r14', room_number: '207', room_type: 'Suite', floor: 2, status: 'Available', price_per_night: 4000 }
    ]
    localStorage.setItem('db_rooms', JSON.stringify(defaultRooms))
  }

  if (!localStorage.getItem('db_menu_items')) {
    const defaultMenuItems = [
      { id: 'm1', name: 'Masala Dosa', category: 'Breakfast', price: 90, is_available: true },
      { id: 'm2', name: 'Veg Sandwich', category: 'Breakfast', price: 70, is_available: true },
      { id: 'm3', name: 'Paneer Butter Masala', category: 'Lunch', price: 220, is_available: true },
      { id: 'm4', name: 'Dal Makhani', category: 'Lunch', price: 180, is_available: true },
      { id: 'm5', name: 'Butter Naan', category: 'Lunch', price: 40, is_available: true },
      { id: 'm6', name: 'Jeera Rice', category: 'Lunch', price: 120, is_available: true },
      { id: 'm7', name: 'Veg Biryani', category: 'Dinner', price: 200, is_available: true },
      { id: 'm8', name: 'Chilli Paneer', category: 'Dinner', price: 210, is_available: true },
      { id: 'm9', name: 'Cold Coffee', category: 'Drinks', price: 80, is_available: true },
      { id: 'm10', name: 'Masala Chai', category: 'Drinks', price: 20, is_available: true },
      { id: 'm11', name: 'French Fries', category: 'Snacks', price: 90, is_available: true },
      { id: 'm12', name: 'Samosa (2 pcs)', category: 'Snacks', price: 40, is_available: true }
    ]
    localStorage.setItem('db_menu_items', JSON.stringify(defaultMenuItems))
  }
}

initDB()

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      // Allow any login locally so user isn't locked out offline
      const session = { user: { email } }
      localStorage.setItem('session', JSON.stringify(session))
      return { data: { session }, error: null }
    },
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('session'))
      return { data: { session } }
    },
    signOut: async () => {
      localStorage.removeItem('session')
      return { error: null }
    },
    onAuthStateChange: (callback) => {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  },
  from: (table) => {
    const data = JSON.parse(localStorage.getItem('db_' + table) || '[]')
    return new QueryBuilder(table, data)
  },
  channel: (name) => {
    let callbacks = []
    return {
      on: (event, options, callback) => {
        const handler = () => callback({})
        callbacks.push({ event: 'supabase_realtime_' + options.table, handler })
        return {
          subscribe: () => {
            callbacks.forEach(c => window.addEventListener(c.event, c.handler))
          }
        }
      }
    }
  },
  removeChannel: () => {}
}
