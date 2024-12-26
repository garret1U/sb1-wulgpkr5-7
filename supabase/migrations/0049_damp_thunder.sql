-- Add circuit_status column to proposal_monthly_costs
ALTER TABLE proposal_monthly_costs 
ADD COLUMN circuit_status text NOT NULL DEFAULT 'active' 
CHECK (circuit_status IN ('active', 'proposed'));

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_proposal_monthly_costs_status
ON proposal_monthly_costs(circuit_status);

-- Update refresh function to include circuit status
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
    -- First handle active circuits
    FOR circ IN 
      SELECT 
        c.id as circuit_id,
        c.monthlycost,
        c.contract_start_date,
        c.contract_end_date,
        c.status
      FROM circuits c
      JOIN locations l ON l.id = c.location_id
      JOIN proposal_locations pl ON pl.location_id = l.id
      WHERE pl.proposal_id = proposal_uuid
      AND c.status = 'Active'
    LOOP
      -- If circuit is active in this month
      IF (circ.contract_start_date IS NULL OR circ.contract_start_date <= curr_dt)
      AND (circ.contract_end_date IS NULL OR circ.contract_end_date >= curr_dt) THEN
        -- Insert active circuit cost
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
        -- Insert proposed circuit cost
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