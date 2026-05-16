# Lumiere - Hotel & Restaurant Management System

A full-stack Hotel and Restaurant Management web application built with React, Tailwind CSS, and Supabase.

## Features

- **Hotel Management**: Room assignment, Guest Registration, Dashboard, and Guest Records.
- **Restaurant POS**: Menu management, order placement (dine-in/takeaway), and billing system.
- **Reports**: Daily revenue dashboard, printable bills/registration slips, and CSV exports.

---

## 🚀 Setup Instructions

### 1. Supabase Database Setup

1. Create a free account and new project at [Supabase](https://supabase.com/).
2. Once your project is ready, go to the **SQL Editor** in your Supabase dashboard.
3. Copy and paste the following SQL schema to create your tables:

```sql
-- Rooms
CREATE TABLE rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  floor INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'Available',
  price_per_night NUMERIC NOT NULL
);

-- Guests
CREATE TABLE guests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  id_proof_type VARCHAR(50) NOT NULL,
  id_proof_number VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  nationality VARCHAR(50) DEFAULT 'Indian',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  guest_id UUID REFERENCES guests(id),
  room_id UUID REFERENCES rooms(id),
  check_in TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out TIMESTAMP WITH TIME ZONE,
  num_guests INTEGER DEFAULT 1,
  purpose VARCHAR(100),
  booking_id VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'Active'
);

-- Menu Items
CREATE TABLE menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price NUMERIC NOT NULL,
  is_available BOOLEAN DEFAULT true
);

-- Orders
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_number VARCHAR(20),
  is_takeaway BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  price_at_time NUMERIC NOT NULL
);

-- Bills
CREATE TABLE bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  booking_id UUID REFERENCES bookings(id),
  subtotal NUMERIC NOT NULL,
  tax_percent NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  payment_mode VARCHAR(20) NOT NULL,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

4. Go to **Authentication -> Providers** and ensure Email provider is enabled.
5. Create a new user in **Authentication -> Users** to act as your staff/admin login.

### 2. Configure Environment Variables

1. Rename the `.env` file or create one in the root of your project:
   ```bash
   cp .env.example .env
   ```
2. Get your Supabase Project URL and Anon Key from **Settings -> API**.
3. Update the `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### 4. Deploy to Vercel (Free)

1. Create a [GitHub](https://github.com/) repository and push your `hotel-app` code.
2. Sign up/log in to [Vercel](https://vercel.com/) with your GitHub account.
3. Click **Add New Project** and select your GitHub repository.
4. During setup, under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will automatically build and publish your application. You can now access it from any browser or device!
