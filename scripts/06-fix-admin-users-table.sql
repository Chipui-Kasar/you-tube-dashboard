-- Drop the old admin_users table and recreate it properly
DROP TABLE IF EXISTS admin_users CASCADE;

-- Create admin_users table linked to Supabase Auth
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow users to read their own admin record
CREATE POLICY "Users can read their own admin record"
  ON admin_users
  FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Allow service role to manage admin users
CREATE POLICY "Service role can manage admin users"
  ON admin_users
  USING (auth.role() = 'service_role');

-- Create index on email for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Create index on is_active for filtering
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
