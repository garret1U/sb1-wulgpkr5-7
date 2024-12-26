-- Drop existing policies
DROP POLICY IF EXISTS "view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_view_all" ON user_profiles;
DROP POLICY IF EXISTS "create_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_all" ON user_profiles;

-- Create materialized view for admin users
CREATE MATERIALIZED VIEW IF NOT EXISTS admin_users AS
SELECT user_id
FROM user_profiles
WHERE role = 'admin';

-- Create index for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Create function to refresh admin users
CREATE OR REPLACE FUNCTION refresh_admin_users()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_users;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh admin users
CREATE TRIGGER refresh_admin_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_profiles
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_admin_users();

-- Create new simplified policies
CREATE POLICY "allow_users_view_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "allow_admins_view_all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "allow_users_create_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_users_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_admins_update_all"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = auth.uid()
  ));

-- Initial refresh of admin users view
REFRESH MATERIALIZED VIEW admin_users;