-- Drop the materialized view and related objects
DROP MATERIALIZED VIEW IF EXISTS circuit_location_details CASCADE;
DROP FUNCTION IF EXISTS refresh_circuit_location_details CASCADE;

-- Update circuit policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON circuits;

-- Create simplified policies for circuits
CREATE POLICY "circuits_select"
  ON circuits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "circuits_insert"
  ON circuits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "circuits_update"
  ON circuits
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "circuits_delete"
  ON circuits
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster joins
CREATE INDEX IF NOT EXISTS idx_circuits_location
ON circuits(location_id);

-- Create index for carrier searches
CREATE INDEX IF NOT EXISTS idx_circuits_carrier
ON circuits(carrier);

-- Create index for type searches
CREATE INDEX IF NOT EXISTS idx_circuits_type
ON circuits(type);

-- Create index for status searches
CREATE INDEX IF NOT EXISTS idx_circuits_status
ON circuits(status);