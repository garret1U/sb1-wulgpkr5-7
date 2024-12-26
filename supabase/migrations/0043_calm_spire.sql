/*
  # Fix Circuit Location Relation
  
  1. Changes
    - Add proper join support for circuits and locations
    - Add indexes for performance
    - Update RLS policies
  
  2. Details
    - Creates materialized view for location details
    - Creates indexes for efficient joins
    - Updates policies to handle relations
*/

-- Create materialized view for location details
CREATE MATERIALIZED VIEW IF NOT EXISTS circuit_location_details AS
SELECT 
  c.id as circuit_id,
  l.name as location_name,
  l.company_id as location_company_id
FROM circuits c
JOIN locations l ON l.id = c.location_id;

-- Create indexes for efficient joins
CREATE UNIQUE INDEX IF NOT EXISTS idx_circuit_location_details_circuit_id 
ON circuit_location_details(circuit_id);

CREATE INDEX IF NOT EXISTS idx_circuit_location_details_location_name 
ON circuit_location_details(location_name);

CREATE INDEX IF NOT EXISTS idx_circuit_location_details_company 
ON circuit_location_details(location_company_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_circuit_location_details()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY circuit_location_details;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh view
DROP TRIGGER IF EXISTS refresh_circuit_location_details_circuits ON circuits;
CREATE TRIGGER refresh_circuit_location_details_circuits
  AFTER INSERT OR UPDATE OR DELETE ON circuits
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_circuit_location_details();

DROP TRIGGER IF EXISTS refresh_circuit_location_details_locations ON locations;
CREATE TRIGGER refresh_circuit_location_details_locations
  AFTER UPDATE OF name, company_id ON locations
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_circuit_location_details();

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON circuits;
CREATE POLICY "Enable read access for authenticated users" ON circuits
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = location_id
    )
  );