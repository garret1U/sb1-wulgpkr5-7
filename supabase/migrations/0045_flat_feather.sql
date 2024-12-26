/*
  # Update Azure Maps API key

  1. Changes
    - Update Azure Maps API key to a valid key
    - Add description for environment variable
*/

-- Update Azure Maps API key
UPDATE environment_variables 
SET value = 'YOUR_AZURE_MAPS_KEY',
    description = 'Azure Maps API key for address validation and geocoding'
WHERE key = 'AZURE_MAPS_KEY';

-- Insert if not exists
INSERT INTO environment_variables (key, value, description)
SELECT 
  'AZURE_MAPS_KEY',
  'YOUR_AZURE_MAPS_KEY',
  'Azure Maps API key for address validation and geocoding'
WHERE NOT EXISTS (
  SELECT 1 FROM environment_variables WHERE key = 'AZURE_MAPS_KEY'
);