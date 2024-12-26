-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS sync_profile_data_trigger ON user_profiles;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS sync_profile_data();
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop existing policies
DROP POLICY IF EXISTS "view_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_view_all" ON user_profiles;
DROP POLICY IF EXISTS "create_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_all" ON user_profiles;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'viewer')),
  first_name text,
  last_name text,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create function to sync profile with auth data
CREATE OR REPLACE FUNCTION sync_profile_data()
RETURNS TRIGGER AS $$
DECLARE
  auth_user auth.users%ROWTYPE;
BEGIN
  SELECT * INTO auth_user
  FROM auth.users
  WHERE id = NEW.user_id;

  NEW.email = COALESCE(NEW.email, auth_user.email);
  NEW.phone = COALESCE(NEW.phone, auth_user.phone);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync profile
CREATE TRIGGER sync_profile_data_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_data();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  
  INSERT INTO public.user_profiles (
    user_id,
    role,
    email,
    phone
  )
  VALUES (
    NEW.id,
    CASE WHEN user_count = 0 THEN 'admin' ELSE 'viewer' END,
    NEW.email,
    NEW.phone
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create RLS policies
CREATE POLICY "view_own_profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "admin_view_all"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "create_own_profile"
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

CREATE POLICY "admin_update_all"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  ));