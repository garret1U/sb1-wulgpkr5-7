/*
  # Add proposal monthly costs tracking

  1. Tables
    - proposal_monthly_costs: Stores monthly cost data for each circuit in a proposal
  
  2. Functions
    - refresh_proposal_monthly_costs: Recalculates costs for a proposal
    - handle_circuit_changes: Trigger function for circuit updates
  
  3. Triggers
    - For proposal circuit changes
    - For circuit cost changes
*/

-- Create proposal_monthly_costs table if not exists
CREATE TABLE IF NOT EXISTS proposal_monthly_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE NOT NULL,
  circuit_id uuid REFERENCES circuits(id) ON DELETE CASCADE NOT NULL,
  month_year date NOT NULL,
  monthly_cost numeric(10,2) NOT NULL DEFAULT 0 CHECK (monthly_cost >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT proposal_monthly_costs_unique UNIQUE (proposal_id, circuit_id, month_year)
);

-- Enable RLS
ALTER TABLE proposal_monthly_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "allow_select_monthly_costs"
  ON proposal_monthly_costs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_insert_monthly_costs"
  ON proposal_monthly_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_update_monthly_costs"
  ON proposal_monthly_costs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "allow_delete_monthly_costs"
  ON proposal_monthly_costs
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to refresh monthly costs
CREATE OR REPLACE FUNCTION refresh_proposal_monthly_costs(proposal_uuid uuid)
RETURNS void AS $$
DECLARE
  start_dt date;
  end_dt date;
  curr_dt date;
  circ RECORD;
BEGIN
  -- Delete existing costs for this proposal
  DELETE FROM proposal_monthly_costs WHERE proposal_id = proposal_uuid;

  -- Get date range from all circuits in proposal
  SELECT 
    MIN(c.contract_start_date) as min_date,
    MAX(c.contract_end_date) as max_date
  INTO start_dt, end_dt
  FROM proposal_circuits pc
  JOIN circuits c ON c.id = pc.circuit_id
  WHERE pc.proposal_id = proposal_uuid
  AND c.contract_start_date IS NOT NULL;

  -- If no dates found, exit
  IF start_dt IS NULL THEN
    RETURN;
  END IF;

  -- Use current date if no end date
  end_dt := COALESCE(end_dt, start_dt + interval '36 months');

  -- For each month in the range
  curr_dt := start_dt;
  WHILE curr_dt <= end_dt LOOP
    -- For each circuit in the proposal
    FOR circ IN 
      SELECT 
        pc.circuit_id,
        c.monthlycost,
        c.contract_start_date,
        c.contract_end_date
      FROM proposal_circuits pc
      JOIN circuits c ON c.id = pc.circuit_id
      WHERE pc.proposal_id = proposal_uuid
    LOOP
      -- If circuit is active in this month
      IF (circ.contract_start_date IS NULL OR circ.contract_start_date <= curr_dt)
      AND (circ.contract_end_date IS NULL OR circ.contract_end_date >= curr_dt) THEN
        -- Insert or update monthly cost
        INSERT INTO proposal_monthly_costs (
          proposal_id,
          circuit_id,
          month_year,
          monthly_cost
        ) VALUES (
          proposal_uuid,
          circ.circuit_id,
          curr_dt,
          circ.monthlycost
        )
        ON CONFLICT (proposal_id, circuit_id, month_year)
        DO UPDATE SET monthly_cost = EXCLUDED.monthly_cost;
      END IF;
    END LOOP;

    curr_dt := curr_dt + interval '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for circuit changes
CREATE OR REPLACE FUNCTION handle_circuit_changes()
RETURNS TRIGGER AS $$
DECLARE
  proposal_uuid uuid;
BEGIN
  -- Only proceed if relevant fields changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.monthlycost != NEW.monthlycost OR
    OLD.contract_start_date != NEW.contract_start_date OR
    OLD.contract_end_date != NEW.contract_end_date
  )) OR TG_OP IN ('INSERT', 'DELETE') THEN
    -- Recalculate costs for all affected proposals
    FOR proposal_uuid IN 
      SELECT DISTINCT proposal_id 
      FROM proposal_circuits 
      WHERE circuit_id = COALESCE(NEW.id, OLD.id)
    LOOP
      PERFORM refresh_proposal_monthly_costs(proposal_uuid);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function for proposal circuit changes
CREATE OR REPLACE FUNCTION handle_proposal_circuit_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate costs for affected proposal
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_proposal_monthly_costs(OLD.proposal_id);
  ELSE
    PERFORM refresh_proposal_monthly_costs(NEW.proposal_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER circuit_changes
  AFTER INSERT OR UPDATE OR DELETE ON circuits
  FOR EACH ROW
  EXECUTE FUNCTION handle_circuit_changes();

CREATE TRIGGER proposal_circuit_changes
  AFTER INSERT OR UPDATE OR DELETE ON proposal_circuits
  FOR EACH ROW
  EXECUTE FUNCTION handle_proposal_circuit_changes();

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_proposal
ON proposal_monthly_costs(proposal_id);

CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_circuit
ON proposal_monthly_costs(circuit_id);

CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_date
ON proposal_monthly_costs(month_year);

CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_composite
ON proposal_monthly_costs(proposal_id, month_year);

CREATE INDEX IF NOT EXISTS idx_circuits_contract_dates
ON circuits(contract_start_date, contract_end_date)
WHERE contract_start_date IS NOT NULL;