-- Drop existing policies first
DROP POLICY IF EXISTS "companies_select" ON companies;
DROP POLICY IF EXISTS "companies_insert" ON companies;
DROP POLICY IF EXISTS "companies_update" ON companies;
DROP POLICY IF EXISTS "companies_delete" ON companies;

DROP POLICY IF EXISTS "locations_select" ON locations;
DROP POLICY IF EXISTS "locations_insert" ON locations;
DROP POLICY IF EXISTS "locations_update" ON locations;
DROP POLICY IF EXISTS "locations_delete" ON locations;

DROP POLICY IF EXISTS "circuits_select" ON circuits;
DROP POLICY IF EXISTS "circuits_insert" ON circuits;
DROP POLICY IF EXISTS "circuits_update" ON circuits;
DROP POLICY IF EXISTS "circuits_delete" ON circuits;

-- Companies Table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  street_address text NOT NULL,
  address_city text NOT NULL,
  address_state text NOT NULL,
  address_zip text NOT NULL,
  address_country text NOT NULL DEFAULT 'United States',
  phone character varying(20) NOT NULL,
  email character varying(255) NOT NULL,
  website character varying(255),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  last_updated_by uuid
);

-- Locations Table
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name character varying(255) NOT NULL,
  address text NOT NULL,
  city character varying(100) NOT NULL,
  state character varying(50) NOT NULL,
  zip_code character varying(20) NOT NULL,
  country character varying(100) NOT NULL,
  criticality character varying(10) NOT NULL,
  site_description text,
  critical_processes text,
  active_users integer DEFAULT 0,
  num_servers integer DEFAULT 0,
  num_devices integer DEFAULT 0,
  hosted_applications text,
  longitude text,
  latitude text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  created_by uuid,
  last_updated_by uuid
);

-- Circuits Table
CREATE TABLE IF NOT EXISTS circuits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier text NOT NULL,
  type text NOT NULL,
  purpose text NOT NULL,
  status text NOT NULL,
  bandwidth text NOT NULL,
  monthlycost numeric NOT NULL CHECK (monthlycost >= 0),
  static_ips integer NOT NULL DEFAULT 0,
  upload_bandwidth character varying(255),
  contract_start_date date,
  contract_term integer CHECK (contract_term > 0),
  contract_end_date date,
  billing character varying(10) NOT NULL,
  usage_charges boolean DEFAULT false,
  installation_cost numeric(10,2) DEFAULT 0 CHECK (installation_cost >= 0),
  notes text,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  last_updated_by uuid
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuits ENABLE ROW LEVEL SECURITY;

-- Create indexes for frequently searched columns
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(address_city);
CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(address_state);

CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_criticality ON locations(criticality);
CREATE INDEX IF NOT EXISTS idx_locations_company ON locations(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(longitude, latitude) 
  WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_circuits_carrier ON circuits(carrier);
CREATE INDEX IF NOT EXISTS idx_circuits_type ON circuits(type);
CREATE INDEX IF NOT EXISTS idx_circuits_status ON circuits(status);
CREATE INDEX IF NOT EXISTS idx_circuits_location ON circuits(location_id);
CREATE INDEX IF NOT EXISTS idx_circuits_contract_dates ON circuits(contract_start_date, contract_end_date)
  WHERE contract_start_date IS NOT NULL;

-- Create RLS Policies
CREATE POLICY "companies_select" ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "companies_insert" ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "companies_update" ON companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "companies_delete" ON companies FOR DELETE TO authenticated USING (true);

CREATE POLICY "locations_select" ON locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "locations_insert" ON locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "locations_update" ON locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "locations_delete" ON locations FOR DELETE TO authenticated USING (true);

CREATE POLICY "circuits_select" ON circuits FOR SELECT TO authenticated USING (true);
CREATE POLICY "circuits_insert" ON circuits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "circuits_update" ON circuits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "circuits_delete" ON circuits FOR DELETE TO authenticated USING (true);