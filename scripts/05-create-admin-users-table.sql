-- Create admin_users table for authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated users can read admin_users
CREATE POLICY "Allow authenticated users to read admin_users"
  ON admin_users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create index on email for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);

-- Create index on is_active for filtering
CREATE INDEX idx_admin_users_is_active ON admin_users(is_active);
