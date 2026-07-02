-- Disable RLS temporarily so the app works seamlessly
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Clear existing rooms if any, and insert the 14 rooms
TRUNCATE TABLE rooms CASCADE;

INSERT INTO rooms (room_number, room_type, floor, status) VALUES
  ('101', 'Suite', 1, 'Available'),
  ('102', 'Suite', 1, 'Available'),
  ('103', 'Deluxe', 1, 'Available'),
  ('104', 'Deluxe', 1, 'Available'),
  ('105', 'Deluxe', 1, 'Available'),
  ('106', 'Deluxe', 1, 'Available'),
  ('107', 'Double', 1, 'Available'),
  ('108', 'Double', 1, 'Available'),
  ('109', 'Double', 1, 'Available'),
  ('110', 'Double', 1, 'Available'),
  ('111', 'Standard', 1, 'Available'),
  ('112', 'Standard', 1, 'Available'),
  ('113', 'Standard', 1, 'Available'),
  ('114', 'Standard', 1, 'Available');
