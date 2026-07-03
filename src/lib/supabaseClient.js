// Database Client wrapper supporting Electron Local JSON Database and browser LocalStorage fallback

const isElectron = typeof window !== 'undefined' && !!window.electronAPI

class QueryBuilder {
  constructor(table) {
    this.table = table
    this._action = 'select' // default action
    this._payload = null
    this._filters = []
    this._orders = []
    this._limit = null
    this._single = false
  }

  select(columns = '*') {
    return this
  }

  insert(rows) {
    this._action = 'insert'
    this._payload = rows
    return this
  }

  update(updates) {
    this._action = 'update'
    this._payload = updates
    return this
  }

  delete() {
    this._action = 'delete'
    return this
  }

  eq(column, value) {
    this._filters.push({ type: 'eq', column, value })
    return this
  }

  gte(column, value) {
    this._filters.push({ type: 'gte', column, value })
    return this
  }

  lte(column, value) {
    this._filters.push({ type: 'lte', column, value })
    return this
  }

  or(filtersString) {
    this._filters.push({ type: 'or', value: filtersString })
    return this
  }

  order(column, { ascending = true } = {}) {
    this._orders.push({ column, ascending })
    return this
  }

  limit(count) {
    this._limit = count
    return this
  }

  single() {
    this._single = true
    return this
  }

  async then(resolve, reject) {
    try {
      let result = []

      if (this._action === 'select') {
        if (isElectron) {
          const response = await window.electronAPI.query({ table: this.table, action: 'select' })
          result = response.data || []
        } else {
          result = JSON.parse(localStorage.getItem('db_' + this.table) || '[]')
        }

        // Apply Filters
        this._filters.forEach(filter => {
          if (filter.type === 'eq') {
            result = result.filter(row => row[filter.column] === filter.value)
          } else if (filter.type === 'gte') {
            result = result.filter(row => row[filter.column] && new Date(row[filter.column]) >= new Date(filter.value))
          } else if (filter.type === 'lte') {
            result = result.filter(row => row[filter.column] && new Date(row[filter.column]) <= new Date(filter.value))
          } else if (filter.type === 'or') {
            const parts = filter.value.split(',').map(f => {
              const inner = f.split('.')
              return { col: inner[0], op: inner[1], val: inner[2] }
            })
            result = result.filter(row => {
              return parts.some(p => p.op === 'eq' && row[p.col] === p.val)
            })
          }
        })

        // Apply Joins
        if (this.table === 'bookings') {
          let guests = []
          let rooms = []
          if (isElectron) {
            guests = (await window.electronAPI.query({ table: 'guests', action: 'select' })).data || []
            rooms = (await window.electronAPI.query({ table: 'rooms', action: 'select' })).data || []
          } else {
            guests = JSON.parse(localStorage.getItem('db_guests') || '[]')
            rooms = JSON.parse(localStorage.getItem('db_rooms') || '[]')
          }
          result = result.map(b => ({
            ...b,
            guests: guests.find(g => g.id === b.guest_id) || null,
            rooms: rooms.find(r => r.id === b.room_id) || null
          }))
        } else if (this.table === 'bills') {
          let orders = []
          if (isElectron) {
            orders = (await window.electronAPI.query({ table: 'orders', action: 'select' })).data || []
          } else {
            orders = JSON.parse(localStorage.getItem('db_orders') || '[]')
          }
          result = result.map(bill => ({
            ...bill,
            orders: orders.find(o => o.id === bill.order_id) || null
          }))
        } else if (this.table === 'order_items') {
          let menu = []
          if (isElectron) {
            menu = (await window.electronAPI.query({ table: 'menu_items', action: 'select' })).data || []
          } else {
            menu = JSON.parse(localStorage.getItem('db_menu_items') || '[]')
          }
          result = result.map(item => ({
            ...item,
            menu_items: menu.find(m => m.id === item.menu_item_id) || null
          }))
        }

        // Apply Ordering
        this._orders.forEach(order => {
          result.sort((a, b) => {
            if (a[order.column] < b[order.column]) return order.ascending ? -1 : 1
            if (a[order.column] > b[order.column]) return order.ascending ? 1 : -1
            return 0
          })
        })

        // Apply Limit
        if (this._limit !== null) {
          result = result.slice(0, this._limit)
        }

        if (this._single) {
          result = result.length > 0 ? result[0] : null
        }
      } 
      else if (this._action === 'insert') {
        const rows = this._payload
        if (isElectron) {
          const response = await window.electronAPI.query({ table: this.table, action: 'insert', payload: rows })
          result = response.data
        } else {
          const isArray = Array.isArray(rows)
          const newRows = (isArray ? rows : [rows]).map(row => ({
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString(),
            ...row
          }))

          const allData = JSON.parse(localStorage.getItem('db_' + this.table) || '[]')
          localStorage.setItem('db_' + this.table, JSON.stringify([...allData, ...newRows]))
          window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table))
          result = isArray ? newRows : newRows[0]
        }

        if (this._single && Array.isArray(result)) {
          result = result.length > 0 ? result[0] : null
        }
      } 
      else if (this._action === 'update') {
        let allCurrent = []
        if (isElectron) {
          allCurrent = (await window.electronAPI.query({ table: this.table, action: 'select' })).data || []
        } else {
          allCurrent = JSON.parse(localStorage.getItem('db_' + this.table) || '[]')
        }

        // Evaluate target IDs to update by applying filters first
        let filtered = [...allCurrent]
        this._filters.forEach(filter => {
          if (filter.type === 'eq') {
            filtered = filtered.filter(row => row[filter.column] === filter.value)
          }
        })
        const idsToUpdate = filtered.map(r => r.id)

        if (isElectron) {
          const response = await window.electronAPI.query({
            table: this.table,
            action: 'update',
            payload: { updates: this._payload, ids: idsToUpdate }
          })
          result = response.data
        } else {
          const idSet = new Set(idsToUpdate)
          const newData = allCurrent.map(row => {
            if (idSet.has(row.id)) {
              return { ...row, ...this._payload }
            }
            return row
          })

          localStorage.setItem('db_' + this.table, JSON.stringify(newData))
          window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table))
          result = newData.filter(r => idSet.has(r.id))
        }

        if (this._single && Array.isArray(result)) {
          result = result.length > 0 ? result[0] : null
        }
      } 
      else if (this._action === 'delete') {
        let allCurrent = []
        if (isElectron) {
          allCurrent = (await window.electronAPI.query({ table: this.table, action: 'select' })).data || []
        } else {
          allCurrent = JSON.parse(localStorage.getItem('db_' + this.table) || '[]')
        }

        // Apply filters to evaluate target IDs to delete
        let filtered = [...allCurrent]
        this._filters.forEach(filter => {
          if (filter.type === 'eq') {
            filtered = filtered.filter(row => row[filter.column] === filter.value)
          }
        })
        const idsToDelete = filtered.map(r => r.id)

        if (isElectron) {
          await window.electronAPI.query({
            table: this.table,
            action: 'delete',
            payload: { ids: idsToDelete }
          })
          result = null
        } else {
          const idSet = new Set(idsToDelete)
          const newData = allCurrent.filter(row => !idSet.has(row.id))

          localStorage.setItem('db_' + this.table, JSON.stringify(newData))
          window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table))
          result = null
        }
      }

      resolve({ data: result, error: null, count: Array.isArray(result) ? result.length : (result ? 1 : 0) })
    } catch (err) {
      resolve({ data: null, error: err, count: null })
    }
  }
}

// Set up event routing for Electron updates to sync with React event subscriptions
if (isElectron) {
  window.electronAPI.onDbUpdate(({ table }) => {
    window.dispatchEvent(new CustomEvent('supabase_realtime_' + table))
  })
}

let authCallbacks = []

const triggerAuthChange = (event, session) => {
  authCallbacks.forEach(cb => {
    try {
      cb(event, session)
    } catch (e) {
      console.error('Error firing auth callback:', e)
    }
  })
}

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      if (email === 'joshiguesthouse@gmail.com' && password === 'amit_joshi_2026') {
        const session = { user: { email } }
        if (isElectron) {
          await window.electronAPI.query({ table: 'session', action: 'set_session', payload: session })
        } else {
          localStorage.setItem('session', JSON.stringify(session))
        }
        triggerAuthChange('SIGNED_IN', session)
        return { data: { session }, error: null }
      }
      return { data: null, error: { message: 'Invalid email or password' } }
    },
    getSession: async () => {
      if (isElectron) {
        const response = await window.electronAPI.query({ table: 'session', action: 'get_session' })
        return { data: { session: response.data } }
      } else {
        const session = JSON.parse(localStorage.getItem('session'))
        return { data: { session } }
      }
    },
    signOut: async () => {
      if (isElectron) {
        await window.electronAPI.query({ table: 'session', action: 'set_session', payload: null })
      } else {
        localStorage.removeItem('session')
      }
      triggerAuthChange('SIGNED_OUT', null)
      return { error: null }
    },
    onAuthStateChange: (callback) => {
      authCallbacks.push(callback)
      
      // Fire initial state immediately
      supabase.auth.getSession().then(({ data: { session } }) => {
        callback('INITIAL_SESSION', session)
      })

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authCallbacks = authCallbacks.filter(cb => cb !== callback)
            }
          }
        }
      }
    }
  },
  from: (table) => {
    return new QueryBuilder(table)
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
