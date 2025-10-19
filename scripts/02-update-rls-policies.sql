-- Update RLS policies to allow anon users to read and allow service role to manage
ALTER TABLE channels DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow public read access" ON channels;
DROP POLICY IF EXISTS "Allow authenticated users to manage channels" ON channels;

-- Create new policy to allow public read access
CREATE POLICY "Allow public read access" ON channels
  FOR SELECT USING (true);

-- Note: Service role key bypasses RLS, so no policy needed for admin operations
-- Admin operations will use the service role key via API routes
