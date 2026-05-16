// Mock Supabase Client using LocalStorage

class QueryBuilder {
  constructor(table, data) {
    this.table = table;
    this._data = [...data];
    this._queryData = [...data];
    this._error = null;
    this._single = false;
  }

  select(columns = '*') {
    // Basic mock: just return the data
    return this;
  }

  eq(column, value) {
    this._queryData = this._queryData.filter(row => row[column] === value);
    return this;
  }

  gte(column, value) {
    this._queryData = this._queryData.filter(row => row[column] >= value);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this._queryData.sort((a, b) => {
      if (a[column] < b[column]) return ascending ? -1 : 1;
      if (a[column] > b[column]) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  async then(resolve, reject) {
    try {
      // Mock network delay
      await new Promise(r => setTimeout(r, 100));
      
      let result = this._queryData;
      
      if (this._single) {
        result = result.length > 0 ? result[0] : null;
      }

      resolve({ data: result, error: this._error, count: this._queryData.length });
    } catch (err) {
      resolve({ data: null, error: err, count: null });
    }
  }

  async insert(rows) {
    const isArray = Array.isArray(rows);
    const newRows = (isArray ? rows : [rows]).map(row => ({
      ...row,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    }));
    
    const allData = JSON.parse(localStorage.getItem('db_' + this.table) || '[]');
    localStorage.setItem('db_' + this.table, JSON.stringify([...allData, ...newRows]));
    
    // Trigger realtime
    window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table));

    return { data: isArray ? newRows : newRows[0], error: null };
  }

  async update(updates) {
    const allData = JSON.parse(localStorage.getItem('db_' + this.table) || '[]');
    const idsToUpdate = new Set(this._queryData.map(r => r.id));
    
    const newData = allData.map(row => {
      if (idsToUpdate.has(row.id)) {
        return { ...row, ...updates };
      }
      return row;
    });
    
    localStorage.setItem('db_' + this.table, JSON.stringify(newData));
    window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table));
    return { data: newData.filter(r => idsToUpdate.has(r.id)), error: null };
  }

  async delete() {
    const allData = JSON.parse(localStorage.getItem('db_' + this.table) || '[]');
    const idsToDelete = new Set(this._queryData.map(r => r.id));
    
    const newData = allData.filter(row => !idsToDelete.has(row.id));
    localStorage.setItem('db_' + this.table, JSON.stringify(newData));
    window.dispatchEvent(new CustomEvent('supabase_realtime_' + this.table));
    return { data: null, error: null };
  }
}

// Initialize mock data if empty
const initDB = () => {
  if (!localStorage.getItem('db_rooms')) {
    const rooms = [
      { id: '1', room_number: '101', room_type: 'Single', floor: 1, status: 'Available', price_per_night: 1500 },
      { id: '2', room_number: '102', room_type: 'Double', floor: 1, status: 'Available', price_per_night: 2500 },
      { id: '3', room_number: '201', room_type: 'Suite', floor: 2, status: 'Available', price_per_night: 5000 },
      { id: '4', room_number: '202', room_type: 'Double', floor: 2, status: 'Occupied', price_per_night: 2500 },
    ];
    localStorage.setItem('db_rooms', JSON.stringify(rooms));
  }
  
  if (!localStorage.getItem('db_menu_items')) {
    const items = [
      { id: '1', name: 'Masala Dosa', category: 'Breakfast', price: 120, is_available: true },
      { id: '2', name: 'Paneer Butter Masala', category: 'Lunch', price: 250, is_available: true },
      { id: '3', name: 'Cold Coffee', category: 'Drinks', price: 100, is_available: true },
    ];
    localStorage.setItem('db_menu_items', JSON.stringify(items));
  }
};

initDB();

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      if (password === 'admin123') { // Simple mock auth
        const session = { user: { email } };
        localStorage.setItem('session', JSON.stringify(session));
        return { data: { session }, error: null };
      }
      return { data: null, error: { message: 'Invalid password. Try admin123' } };
    },
    getSession: async () => {
      const session = JSON.parse(localStorage.getItem('session'));
      return { data: { session } };
    },
    signOut: async () => {
      localStorage.removeItem('session');
      return { error: null };
    },
    onAuthStateChange: (callback) => {
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
  },
  from: (table) => {
    const data = JSON.parse(localStorage.getItem('db_' + table) || '[]');
    
    // Special case for joined queries (bills with orders, order_items with menu_items)
    if (table === 'bills') {
      const orders = JSON.parse(localStorage.getItem('db_orders') || '[]');
      data.forEach(bill => {
        bill.orders = orders.find(o => o.id === bill.order_id);
      });
    }
    if (table === 'order_items') {
      const menu = JSON.parse(localStorage.getItem('db_menu_items') || '[]');
      data.forEach(item => {
        item.menu_items = menu.find(m => m.id === item.menu_item_id);
      });
    }
    
    return new QueryBuilder(table, data);
  },
  channel: (name) => {
    let callbacks = [];
    return {
      on: (event, options, callback) => {
        const handler = () => callback({});
        callbacks.push({ event: 'supabase_realtime_' + options.table, handler });
        return {
          subscribe: () => {
            callbacks.forEach(c => window.addEventListener(c.event, c.handler));
          }
        };
      }
    };
  },
  removeChannel: () => {}
};
