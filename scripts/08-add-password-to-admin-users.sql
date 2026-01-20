-- Add password_hash column to admin_users table
ALTER TABLE admin_users ADD COLUMN password_hash VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX idx_admin_users_email ON admin_users(email);
