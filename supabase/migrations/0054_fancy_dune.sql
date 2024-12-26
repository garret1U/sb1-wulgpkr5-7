-- Drop existing policies
DROP POLICY IF EXISTS "view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_view_all" ON user_profiles;
DROP POLICY IF EXISTS "create_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_all" ON user_profiles;

-- Create new simplified policies
CREATE POLICY "allow_select_own"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "allow_select_admin"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

CREATE POLICY "allow_insert_own"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_own"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_update_admin"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin'
    )
  );

-- Create index for faster role checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_user_id 
ON user_profiles(user_id) 
WHERE role = 'admin';