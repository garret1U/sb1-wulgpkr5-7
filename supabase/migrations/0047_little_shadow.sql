/*
  # Add proposal monthly costs trigger

  1. Functions
    - `calculate_proposal_monthly_costs`: Calculates costs for each month
    - `handle_proposal_circuit_changes`: Trigger function for circuit changes
    - `handle_circuit_cost_changes`: Trigger function for circuit cost updates

  2. Triggers
    - On proposal_circuits changes
    - On circuits cost changes

  3. Indexes
    - For efficient cost calculations
    - For date range queries
*/

-- Function to calculate monthly costs for a proposal
CREATE OR REPLACE FUNCTION calculate_proposal_monthly_costs(proposal_id uuid)
RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  calc_date date;
  circuit_record RECORD;
  proposal_circuit RECORD;
BEGIN
  -- Delete existing costs for this proposal
  DELETE FROM proposal_monthly_costs WHERE proposal_id = $1;

  -- Get date range from all circuits in proposal
  SELECT 
    MIN(c.contract_start_date) as min_date,
    MAX(c.contract_end_date) as max_date
  INTO start_date, end_date
  FROM proposal_circuits pc
  JOIN circuits c ON c.id = pc.circuit_id
  WHERE pc.proposal_id = $1
  AND c.contract_start_date IS NOT NULL;

  -- If no dates found, exit
  IF start_date IS NULL THEN
    RETURN;
  END IF;

  -- Use current date if no end date
  end_date := COALESCE(end_date, start_date + interval '36 months');

  -- For each month in the range
  calc_date := start_date;
  WHILE calc_date <= end_date LOOP
    -- For each circuit in the proposal
    FOR proposal_circuit IN 
      SELECT 
        pc.circuit_id,
        c.monthlycost,
        c.contract_start_date,
        c.contract_end_date
      FROM proposal_circuits pc
      JOIN circuits c ON c.id = pc.circuit_id
      WHERE pc.proposal_id = $1
    LOOP
      -- If circuit is active in this month
      IF (proposal_circuit.contract_start_date IS NULL OR proposal_circuit.contract_start_date <= calc_date)
      AND (proposal_circuit.contract_end_date IS NULL OR proposal_circuit.contract_end_date >= calc_date) THEN
        -- Insert or update monthly cost
        INSERT INTO proposal_monthly_costs (
          proposal_id,
          circuit_id,
          month_year,
          monthly_cost
        ) VALUES (
          $1,
          proposal_circuit.circuit_id,
          calc_date,
          proposal_circuit.monthlycost
        )
        ON CONFLICT (proposal_id, circuit_id, month_year)
        DO UPDATE SET monthly_cost = EXCLUDED.monthly_cost;
      END IF;
    END LOOP;

    calc_date := calc_date + interval '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for proposal circuit changes
CREATE OR REPLACE FUNCTION handle_proposal_circuit_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate costs for affected proposal
  IF TG_OP = 'DELETE' THEN
    PERFORM calculate_proposal_monthly_costs(OLD.proposal_id);
  ELSE
    PERFORM calculate_proposal_monthly_costs(NEW.proposal_id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for circuit cost changes
CREATE OR REPLACE FUNCTION handle_circuit_cost_changes()
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
    -- Recalculate costs for all proposals using this circuit
    FOR affected_proposal_id IN 
      SELECT DISTINCT proposal_id 
      FROM proposal_circuits 
      WHERE circuit_id = COALESCE(NEW.id, OLD.id)
    LOOP
      PERFORM calculate_proposal_monthly_costs(affected_proposal_id);
    END LOOP;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER proposal_circuits_changes
  AFTER INSERT OR UPDATE OR DELETE ON proposal_circuits
  FOR EACH ROW
  EXECUTE FUNCTION handle_proposal_circuit_changes();

CREATE TRIGGER circuit_cost_changes
  AFTER INSERT OR UPDATE OR DELETE ON circuits
  FOR EACH ROW
  EXECUTE FUNCTION handle_circuit_cost_changes();

-- Create indexes for efficient cost calculations
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_date_range
ON proposal_monthly_costs(proposal_id, month_year);

CREATE INDEX IF NOT EXISTS idx_circuits_contract_dates
ON circuits(contract_start_date, contract_end_date)
WHERE contract_start_date IS NOT NULL;