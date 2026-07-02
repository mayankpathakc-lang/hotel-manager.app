-- Disable RLS temporarily so the app works seamlessly
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE guests DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Clear existing rooms if any, and insert the rooms
TRUNCATE TABLE rooms CASCADE;

INSERT INTO rooms (room_number, room_type, floor, status, price_per_night) VALUES
  ('1', 'Premium', 1, 'Available', 1800),
  ('2', 'Premium', 1, 'Available', 1800),
  ('3', 'Premium', 1, 'Available', 1800),
  ('4', 'Standard', 1, 'Available', 1500),
  ('5', 'Standard', 1, 'Available', 1500),
  ('6', 'Standard', 1, 'Available', 1500),
  ('7', 'Budget', 1, 'Available', 1200),
  ('8', 'Budget', 1, 'Available', 1200),
  ('9', 'Budget', 1, 'Available', 1200),
  ('10', 'Budget', 1, 'Available', 1200),
  ('11', 'Budget', 1, 'Available', 1200),
  ('12', 'Cottage', 1, 'Available', 2000),
  ('14', 'Cottage', 1, 'Available', 2000),
  ('15', 'Cottage', 1, 'Available', 2000);
