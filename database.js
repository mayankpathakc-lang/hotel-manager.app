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
  { id: 'r1', room_number: '1', room_type: 'Premium', status: 'Available', price_per_night: 1800 },
  { id: 'r2', room_number: '2', room_type: 'Premium', status: 'Available', price_per_night: 1800 },
  { id: 'r3', room_number: '3', room_type: 'Premium', status: 'Available', price_per_night: 1800 },
  { id: 'r4', room_number: '4', room_type: 'Standard', status: 'Available', price_per_night: 1500 },
  { id: 'r5', room_number: '5', room_type: 'Standard', status: 'Available', price_per_night: 1500 },
  { id: 'r6', room_number: '6', room_type: 'Standard', status: 'Available', price_per_night: 1500 },
  { id: 'r7', room_number: '7', room_type: 'Budget', status: 'Available', price_per_night: 1200 },
  { id: 'r8', room_number: '8', room_type: 'Budget', status: 'Available', price_per_night: 1200 },
  { id: 'r9', room_number: '9', room_type: 'Budget', status: 'Available', price_per_night: 1200 },
  { id: 'r10', room_number: '10', room_type: 'Budget', status: 'Available', price_per_night: 1200 },
  { id: 'r11', room_number: '11', room_type: 'Budget', status: 'Available', price_per_night: 1200 },
  { id: 'r12', room_number: '12', room_type: 'Cottages', status: 'Available', price_per_night: 2000 },
  { id: 'r14', room_number: '14', room_type: 'Cottages', status: 'Available', price_per_night: 2000 },
  { id: 'r15', room_number: '15', room_type: 'Cottages', status: 'Available', price_per_night: 2000 }
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
    
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    
    // Automatically migrate/restructure room inventory if old layout exists
    let migrated = false
    const hasOldLayout = db.rooms && (
      db.rooms.length !== 14 ||
      db.rooms.some(r => r.room_number === '101') ||
      !db.rooms.some(r => r.room_number === '15')
    )
    
    if (db.rooms && hasOldLayout) {
      db.rooms = defaultRooms
      migrated = true
    }
    
    if (migrated) {
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    }
    
    return db
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
