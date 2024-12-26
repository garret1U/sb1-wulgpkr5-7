-- Drop existing policies
DROP POLICY IF EXISTS "allow_select_own" ON user_profiles;
DROP POLICY IF EXISTS "allow_select_admin" ON user_profiles;
DROP POLICY IF EXISTS "allow_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "allow_update_own" ON user_profiles;
DROP POLICY IF EXISTS "allow_update_admin" ON user_profiles;

-- Create a function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_profiles.user_id = $1 
    AND role = 'admin'
  );
$$;

-- Create new simplified policies
CREATE POLICY "select_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "select_all_profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "insert_own_profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admin_update_profiles"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create index for faster role checks
CREATE INDEX IF NOT EXISTS idx_user_profiles_admin_check
ON user_profiles(user_id, role)
WHERE role = 'admin';