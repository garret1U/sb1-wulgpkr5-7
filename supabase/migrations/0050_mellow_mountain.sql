-- Drop existing triggers first
DROP TRIGGER IF EXISTS proposal_circuit_changes ON proposal_circuits;
DROP TRIGGER IF EXISTS circuit_changes ON circuits;

-- Then drop existing functions
DROP FUNCTION IF EXISTS handle_proposal_circuit_changes() CASCADE;
DROP FUNCTION IF EXISTS handle_circuit_changes() CASCADE;
DROP FUNCTION IF EXISTS refresh_proposal_monthly_costs(uuid) CASCADE;

-- Add circuit_status column if it doesn't exist
ALTER TABLE proposal_monthly_costs 
ADD COLUMN IF NOT EXISTS circuit_status text NOT NULL DEFAULT 'active' 
CHECK (circuit_status IN ('active', 'proposed'));

-- Drop existing policies
DROP POLICY IF EXISTS "proposal_monthly_costs_select" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "proposal_monthly_costs_insert" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "proposal_monthly_costs_update" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "proposal_monthly_costs_delete" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "allow_select_monthly_costs" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "allow_insert_monthly_costs" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "allow_update_monthly_costs" ON proposal_monthly_costs;
DROP POLICY IF EXISTS "allow_delete_monthly_costs" ON proposal_monthly_costs;

-- Create new policies with unique names
CREATE POLICY "monthly_costs_select_policy"
  ON proposal_monthly_costs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "monthly_costs_insert_policy"
  ON proposal_monthly_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "monthly_costs_update_policy"
  ON proposal_monthly_costs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "monthly_costs_delete_policy"
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
    LEAST(
      COALESCE(MIN(c.contract_start_date), CURRENT_DATE),
      CURRENT_DATE
    ) as min_date,
    GREATEST(
      COALESCE(MAX(c.contract_end_date), CURRENT_DATE + interval '36 months'),
      CURRENT_DATE + interval '36 months'
    ) as max_date
  INTO start_dt, end_dt
  FROM proposal_circuits pc
  JOIN circuits c ON c.id = pc.circuit_id
  WHERE pc.proposal_id = proposal_uuid;

  -- If no dates found, use current date range
  IF start_dt IS NULL THEN
    start_dt := CURRENT_DATE;
    end_dt := CURRENT_DATE + interval '36 months';
  END IF;

  -- For each month in the range
  curr_dt := date_trunc('month', start_dt);
  WHILE curr_dt <= end_dt LOOP
    -- First handle active circuits
    FOR circ IN 
      SELECT 
        c.id as circuit_id,
        c.monthlycost,
        c.contract_start_date,
        c.contract_end_date
      FROM circuits c
      JOIN locations l ON l.id = c.location_id
      JOIN proposal_locations pl ON pl.location_id = l.id
      WHERE pl.proposal_id = proposal_uuid
      AND c.status = 'Active'
    LOOP
      -- If circuit is active in this month
      IF (circ.contract_start_date IS NULL OR circ.contract_start_date <= curr_dt)
      AND (circ.contract_end_date IS NULL OR circ.contract_end_date >= curr_dt) THEN
        INSERT INTO proposal_monthly_costs (
          proposal_id,
          circuit_id,
          month_year,
          monthly_cost,
          circuit_status
        ) VALUES (
          proposal_uuid,
          circ.circuit_id,
          curr_dt,
          circ.monthlycost,
          'active'
        )
        ON CONFLICT (proposal_id, circuit_id, month_year)
        DO UPDATE SET 
          monthly_cost = EXCLUDED.monthly_cost,
          circuit_status = EXCLUDED.circuit_status;
      END IF;
    END LOOP;

    -- Then handle proposed circuits
    FOR circ IN 
      SELECT 
        c.id as circuit_id,
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
        INSERT INTO proposal_monthly_costs (
          proposal_id,
          circuit_id,
          month_year,
          monthly_cost,
          circuit_status
        ) VALUES (
          proposal_uuid,
          circ.circuit_id,
          curr_dt,
          circ.monthlycost,
          'proposed'
        )
        ON CONFLICT (proposal_id, circuit_id, month_year)
        DO UPDATE SET 
          monthly_cost = EXCLUDED.monthly_cost,
          circuit_status = EXCLUDED.circuit_status;
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
  affected_proposal_id uuid;
BEGIN
  -- Only proceed if relevant fields changed
  IF (TG_OP = 'UPDATE' AND (
    OLD.monthlycost != NEW.monthlycost OR
    OLD.contract_start_date != NEW.contract_start_date OR
    OLD.contract_end_date != NEW.contract_end_date
  )) OR TG_OP IN ('INSERT', 'DELETE') THEN
    -- Recalculate costs for all affected proposals
    FOR affected_proposal_id IN 
      SELECT DISTINCT proposal_id 
      FROM proposal_circuits 
      WHERE circuit_id = COALESCE(NEW.id, OLD.id)
    LOOP
      PERFORM refresh_proposal_monthly_costs(affected_proposal_id);
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