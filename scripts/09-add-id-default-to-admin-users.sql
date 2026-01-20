-- Add default UUID generator to admin_users id column
ALTER TABLE admin_users ALTER COLUMN id SET DEFAULT gen_random_uuid();
