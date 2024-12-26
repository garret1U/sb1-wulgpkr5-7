-- Drop existing policies
DROP POLICY IF EXISTS "proposals_select" ON proposals;
DROP POLICY IF EXISTS "proposals_insert" ON proposals;
DROP POLICY IF EXISTS "proposals_update" ON proposals;
DROP POLICY IF EXISTS "proposals_delete" ON proposals;

DROP POLICY IF EXISTS "proposal_locations_select" ON proposal_locations;
DROP POLICY IF EXISTS "proposal_locations_insert" ON proposal_locations;
DROP POLICY IF EXISTS "proposal_locations_update" ON proposal_locations;
DROP POLICY IF EXISTS "proposal_locations_delete" ON proposal_locations;

DROP POLICY IF EXISTS "proposal_circuits_select" ON proposal_circuits;
DROP POLICY IF EXISTS "proposal_circuits_insert" ON proposal_circuits;
DROP POLICY IF EXISTS "proposal_circuits_update" ON proposal_circuits;
DROP POLICY IF EXISTS "proposal_circuits_delete" ON proposal_circuits;

DROP POLICY IF EXISTS "monthly_costs_select" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "monthly_costs_insert" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "monthly_costs_update" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "monthly_costs_delete" ON proposal_monthly_costs;

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected')),
  valid_until date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_profiles(user_id) NOT NULL,
  last_updated_by uuid REFERENCES user_profiles(user_id)
);

-- Create proposal_locations table
CREATE TABLE IF NOT EXISTS proposal_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, location_id)
);

-- Create proposal_circuits table
CREATE TABLE IF NOT EXISTS proposal_circuits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  circuit_id uuid REFERENCES circuits(id) NOT NULL,
  location_id uuid REFERENCES locations(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT proposal_circuits_unique_circuit UNIQUE (proposal_id, circuit_id)
);

-- Create proposal_monthly_costs table
CREATE TABLE IF NOT EXISTS proposal_monthly_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  circuit_id uuid REFERENCES circuits(id) ON DELETE CASCADE NOT NULL,
  month_year date NOT NULL,
  monthly_cost numeric(10,2) NOT NULL DEFAULT 0 CHECK (monthly_cost >= 0),
  circuit_status text NOT NULL CHECK (circuit_status IN ('active', 'proposed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT proposal_monthly_costs_unique UNIQUE (proposal_id, circuit_id, month_year)
);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_circuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_monthly_costs ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_company ON proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposal_locations_proposal ON proposal_locations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_locations_location ON proposal_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_proposal_circuits_proposal ON proposal_circuits(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_circuits_circuit ON proposal_circuits(circuit_id);
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_proposal ON proposal_monthly_costs(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_circuit ON proposal_monthly_costs(circuit_id);
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_date ON proposal_monthly_costs(month_year);
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_status ON proposal_monthly_costs(circuit_status);

-- Create RLS policies
CREATE POLICY "proposals_select" ON proposals FOR SELECT TO authenticated USING (true);
CREATE POLICY "proposals_insert" ON proposals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "proposals_update" ON proposals FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "proposals_delete" ON proposals FOR DELETE TO authenticated USING (true);

CREATE POLICY "proposal_locations_select" ON proposal_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "proposal_locations_insert" ON proposal_locations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "proposal_locations_update" ON proposal_locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "proposal_locations_delete" ON proposal_locations FOR DELETE TO authenticated USING (true);

CREATE POLICY "proposal_circuits_select" ON proposal_circuits FOR SELECT TO authenticated USING (true);
CREATE POLICY "proposal_circuits_insert" ON proposal_circuits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "proposal_circuits_update" ON proposal_circuits FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "proposal_circuits_delete" ON proposal_circuits FOR DELETE TO authenticated USING (true);

CREATE POLICY "monthly_costs_select" ON proposal_monthly_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "monthly_costs_insert" ON proposal_monthly_costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "monthly_costs_update" ON proposal_monthly_costs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "monthly_costs_delete" ON proposal_monthly_costs FOR DELETE TO authenticated USING (true);