const fs = require('fs')
const path = require('path')
const { app } = require('electron')

// Set up database folder in the user's Documents directory
const dataDir = path.join(app.getPath('documents'), 'Joshi Guest House')
const dbPath = path.join(dataDir, 'database.json')

// Ensure directory and db file exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

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

const readDb = () => {
  try {
    if (!fs.existsSync(dbPath)) {
      const initDb = {
        rooms: defaultRooms,
        menu_items: defaultMenuItems,
        guests: [],
        bookings: [],
        orders: [],
        order_items: [],
        bills: [],
        session: null
      }
      fs.writeFileSync(dbPath, JSON.stringify(initDb, null, 2))
      return initDb
    }
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
  } catch (error) {
    console.error('Failed to read local JSON database:', error)
    return {}
  }
}

const writeDb = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Failed to write local JSON database:', error)
  }
}

// IPC database handler
const handleDatabaseQuery = (event, { table, action, payload }) => {
  const db = readDb()
  const data = db[table] || []

  switch (action) {
    case 'select':
      return { data, error: null }

    case 'insert': {
      const rows = Array.isArray(payload) ? payload : [payload]
      const newRows = rows.map(row => ({
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        ...row
      }))
      
      db[table] = [...data, ...newRows]
      writeDb(db)

      event.sender.send('db-update', { table })
      return { data: Array.isArray(payload) ? newRows : newRows[0], error: null }
    }

    case 'update': {
      const { updates, ids } = payload
      const idSet = new Set(ids)
      
      const updatedRows = []
      db[table] = data.map(row => {
        if (idSet.has(row.id)) {
          const updated = { ...row, ...updates }
          updatedRows.push(updated)
          return updated
        }
        return row
      })
      
      writeDb(db)
      event.sender.send('db-update', { table })
      return { data: updatedRows, error: null }
    }

    case 'delete': {
      const { ids } = payload
      const idSet = new Set(ids)
      
      db[table] = data.filter(row => !idSet.has(row.id))
      writeDb(db)
      event.sender.send('db-update', { table })
      return { data: null, error: null }
    }

    case 'get_session':
      return { data: db.session, error: null }

    case 'set_session':
      db.session = payload
      writeDb(db)
      return { error: null }

    default:
      return { data: null, error: `Unknown database action: ${action}` }
  }
}

module.exports = {
  handleDatabaseQuery,
  dbPath
}
