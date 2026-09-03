/*
# Marque — Luxury Automotive Marketplace & Dealership Admin

## Overview
Creates the full schema for the Marque platform: a public vehicle marketplace
plus an internal dealership admin (customers, loans, payments, contracts,
receipts). Public marketplace pages read available vehicles without login;
all admin data (customers, loans, payments) requires authentication.

## New Tables

1. **vehicles** — the shared inventory
   - id (uuid PK)
   - make, model (text, not null)
   - year (int)
   - vin, reg_no, chassis_no, engine_no (text — vehicle identifiers)
   - price (numeric — listing/sale price in KES)
   - status (text: available | reserved | sold | rented — default available)
   - category (text: import | private-sale | rental | motorbike)
   - colour, fuel_type, engine_capacity (text — spec details)
   - mileage (int — odometer reading, nullable for new vehicles)
   - description (text)
   - images (text[] — array of Supabase Storage paths/URLs)
   - created_at (timestamptz)

2. **customers** — dealership customers (admin-only)
   - id (uuid PK)
   - name (text, not null)
   - phone, email (text)
   - id_number (text — national ID)
   - address (text)
   - created_at (timestamptz)

3. **loans** — financing contracts linking a customer to a vehicle
   - id (uuid PK)
   - customer_id (uuid FK → customers, cascade delete)
   - vehicle_id (uuid FK → vehicles, set null on delete)
   - vehicle_price, deposit, balance (numeric)
   - duration_months (int)
   - interest_rate (numeric — annual %)
   - monthly_payment (numeric)
   - remaining_balance (numeric)
   - status (text: active | completed | defaulted — default active)
   - start_date, contract_date, deposit_date (date)
   - witness_name, witness_id_number, witness_phone (text)
   - created_at (timestamptz)

4. **balance_items** — itemized balance breakdown shown on the contract
   - id (uuid PK)
   - loan_id (uuid FK → loans, cascade delete)
   - description (text, not null)
   - amount (numeric, not null)
   - due_date (date, nullable)
   - sort_order (int, default 0)

5. **payments** — payments recorded against a loan
   - id (uuid PK)
   - loan_id (uuid FK → loans, cascade delete)
   - amount (numeric, not null)
   - payment_date (date, not null)
   - note (text)
   - remaining_after (numeric — balance after this payment)
   - created_at (timestamptz)

## Security (RLS)

- **vehicles**: public SELECT for anon+authenticated (marketplace browsing).
  All writes (INSERT/UPDATE/DELETE) are authenticated-only — admin manages inventory.
- **customers, loans, balance_items, payments**: authenticated-only CRUD.
  These contain sensitive customer/financial data, never exposed publicly.

## Storage
- Creates a public storage bucket "vehicle-images" for vehicle photo uploads.
*/

-- ============ VEHICLES ============
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  make text NOT NULL,
  model text NOT NULL,
  year int,
  vin text,
  reg_no text,
  chassis_no text,
  engine_no text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available','reserved','sold','rented')),
  category text NOT NULL DEFAULT 'import' CHECK (category IN ('import','private-sale','rental','motorbike')),
  colour text,
  fuel_type text,
  engine_capacity text,
  mileage int,
  description text,
  images text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_vehicles" ON vehicles;
CREATE POLICY "public_read_vehicles"
  ON vehicles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_vehicles" ON vehicles;
CREATE POLICY "auth_insert_vehicles"
  ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_vehicles" ON vehicles;
CREATE POLICY "auth_update_vehicles"
  ON vehicles FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_vehicles" ON vehicles;
CREATE POLICY "auth_delete_vehicles"
  ON vehicles FOR DELETE
  TO authenticated
  USING (true);

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  id_number text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_customers" ON customers;
CREATE POLICY "auth_select_customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_customers" ON customers;
CREATE POLICY "auth_insert_customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_customers" ON customers;
CREATE POLICY "auth_update_customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_customers" ON customers;
CREATE POLICY "auth_delete_customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- ============ LOANS ============
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_price numeric(12,2) NOT NULL DEFAULT 0,
  deposit numeric(12,2) NOT NULL DEFAULT 0,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  duration_months int NOT NULL DEFAULT 0,
  interest_rate numeric(5,2) NOT NULL DEFAULT 0,
  monthly_payment numeric(12,2) NOT NULL DEFAULT 0,
  remaining_balance numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','defaulted')),
  start_date date,
  contract_date date,
  deposit_date date,
  witness_name text,
  witness_id_number text,
  witness_phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_loans" ON loans;
CREATE POLICY "auth_select_loans"
  ON loans FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_loans" ON loans;
CREATE POLICY "auth_insert_loans"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_loans" ON loans;
CREATE POLICY "auth_update_loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_loans" ON loans;
CREATE POLICY "auth_delete_loans"
  ON loans FOR DELETE
  TO authenticated
  USING (true);

-- ============ BALANCE ITEMS ============
CREATE TABLE IF NOT EXISTS balance_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  due_date date,
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE balance_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_balance_items" ON balance_items;
CREATE POLICY "auth_select_balance_items"
  ON balance_items FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_balance_items" ON balance_items;
CREATE POLICY "auth_insert_balance_items"
  ON balance_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_balance_items" ON balance_items;
CREATE POLICY "auth_update_balance_items"
  ON balance_items FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_balance_items" ON balance_items;
CREATE POLICY "auth_delete_balance_items"
  ON balance_items FOR DELETE
  TO authenticated
  USING (true);

-- ============ PAYMENTS ============
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_date date NOT NULL,
  note text,
  remaining_after numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_payments" ON payments;
CREATE POLICY "auth_select_payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "auth_insert_payments" ON payments;
CREATE POLICY "auth_insert_payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_payments" ON payments;
CREATE POLICY "auth_update_payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_payments" ON payments;
CREATE POLICY "auth_delete_payments"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_vehicle ON loans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_balance_items_loan ON balance_items(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_loan ON payments(loan_id);

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public_read_vehicle_images" ON storage.objects;
CREATE POLICY "public_read_vehicle_images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "auth_insert_vehicle_images" ON storage.objects;
CREATE POLICY "auth_insert_vehicle_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "auth_update_vehicle_images" ON storage.objects;
CREATE POLICY "auth_update_vehicle_images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vehicle-images') WITH CHECK (bucket_id = 'vehicle-images');

DROP POLICY IF EXISTS "auth_delete_vehicle_images" ON storage.objects;
CREATE POLICY "auth_delete_vehicle_images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-images');
