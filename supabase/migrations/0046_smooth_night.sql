/*
  # Add proposal monthly costs tracking

  1. New Tables
    - `proposal_monthly_costs`
      - `id` (uuid, primary key)
      - `proposal_id` (uuid, foreign key)
      - `circuit_id` (uuid, foreign key)  
      - `month_year` (date)
      - `monthly_cost` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Constraints
    - Unique constraint on (proposal_id, circuit_id, month_year)
    - Foreign key constraints with cascading deletes
    - Default 0 for monthly_cost
    - Check constraint for non-negative costs

  3. Indexes
    - Primary key
    - Foreign keys
    - Month/year for efficient querying
*/

-- Create proposal_monthly_costs table
CREATE TABLE IF NOT EXISTS proposal_monthly_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  circuit_id uuid REFERENCES circuits(id) ON DELETE CASCADE NOT NULL,
  month_year date NOT NULL,
  monthly_cost numeric(10,2) NOT NULL DEFAULT 0 CHECK (monthly_cost >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint
ALTER TABLE proposal_monthly_costs
ADD CONSTRAINT proposal_monthly_costs_unique
UNIQUE (proposal_id, circuit_id, month_year);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_proposal
ON proposal_monthly_costs(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_circuit
ON proposal_monthly_costs(circuit_id);

CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_month_year
ON proposal_monthly_costs(month_year);

-- Enable RLS
ALTER TABLE proposal_monthly_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "proposal_monthly_costs_select"
  ON proposal_monthly_costs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "proposal_monthly_costs_insert"
  ON proposal_monthly_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "proposal_monthly_costs_update"
  ON proposal_monthly_costs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "proposal_monthly_costs_delete"
  ON proposal_monthly_costs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger for updating updated_at
CREATE OR REPLACE FUNCTION update_proposal_monthly_costs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proposal_monthly_costs_updated_at
  BEFORE UPDATE ON proposal_monthly_costs
  FOR EACH ROW
  EXECUTE FUNCTION update_proposal_monthly_costs_updated_at();