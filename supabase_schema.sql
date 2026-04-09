-- ============================================
-- SMELL CAFE POS - SUPABASE SCHEMA
-- ============================================

-- Create Categories Table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Products Table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Customers Table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  points INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sales Table (Receipts)
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_number TEXT NOT NULL UNIQUE,
  total DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  status TEXT DEFAULT 'Completed' NOT NULL,
  cashier_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Sale Items Table (Transactions Line Items)
CREATE TABLE sale_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price_at_time DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies for fully authenticated users (Cashiers, Managers, Admins)
-- Note: In a production app, you might restrict cashiers from DELETING, but for this POS, we grant full CRUD to authenticated users.

-- Categories Policies
CREATE POLICY "Allow authenticated read access for categories" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access for categories" ON categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access for categories" ON categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access for categories" ON categories FOR DELETE TO authenticated USING (true);

-- Products Policies
CREATE POLICY "Allow authenticated read access for products" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access for products" ON products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access for products" ON products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access for products" ON products FOR DELETE TO authenticated USING (true);

-- Customers Policies
CREATE POLICY "Allow authenticated read access for customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access for customers" ON customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access for customers" ON customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access for customers" ON customers FOR DELETE TO authenticated USING (true);

-- Sales Policies
CREATE POLICY "Allow authenticated read access for sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access for sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access for sales" ON sales FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access for sales" ON sales FOR DELETE TO authenticated USING (true);

-- Sale Items Policies
CREATE POLICY "Allow authenticated read access for sale_items" ON sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert access for sale_items" ON sale_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update access for sale_items" ON sale_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated delete access for sale_items" ON sale_items FOR DELETE TO authenticated USING (true);


-- ============================================
-- INITIAL SEED DATA
-- ============================================

-- Insert Categories
INSERT INTO categories (id, name, icon) VALUES 
('11111111-1111-1111-1111-111111111111', 'Coffee', 'EmojiFoodBeverage'),
('22222222-2222-2222-2222-222222222222', 'Tea', 'EmojiFoodBeverage'),
('33333333-3333-3333-3333-333333333333', 'Pastries', 'Cake'),
('44444444-4444-4444-4444-444444444444', 'Equipment', 'Handyman')
ON CONFLICT (name) DO NOTHING;

-- Insert Products
INSERT INTO products (sku, name, price, category_id, image_url, stock) VALUES 
('COF-001', 'Terracotta Espresso', 18.00, '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1510972527921-ce03766a1cf1?q=80&w=300&auto=format&fit=crop', 100),
('COF-002', 'Caramel Macchiato', 16.50, '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=300&auto=format&fit=crop', 50),
('COF-003', 'Cold Brew Oat', 14.00, '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?q=80&w=300&auto=format&fit=crop', 50),
('TEA-001', 'Artisanal Green Tea', 12.00, '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1563911191333-66223404fb85?q=80&w=300&auto=format&fit=crop', 30),
('PAS-001', 'Classic Croissant', 4.50, '33333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?q=80&w=300&auto=format&fit=crop', 20),
('EQU-001', 'Smell Brew Kit', 35.00, '44444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1544787210-2211d247317e?q=80&w=300&auto=format&fit=crop', 5)
ON CONFLICT (sku) DO NOTHING;

-- Insert Customers
INSERT INTO customers (name, email, points) VALUES 
('John Doe', 'john@example.com', 450),
('Jane Smith', 'jane@world.com', 120),
('Coffee Club LLC', 'biz@coffee.com', 2300)
ON CONFLICT (email) DO NOTHING;
