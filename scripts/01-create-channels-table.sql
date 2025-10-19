-- Create channels table for storing YouTube channel metadata
CREATE TABLE IF NOT EXISTS channels (
  id BIGSERIAL PRIMARY KEY,
  youtube_channel_id VARCHAR(255) UNIQUE NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  tribe VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  thumbnail_url TEXT,
  subscribers BIGINT DEFAULT 0,
  views BIGINT DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_channels_tribe ON channels(tribe);
CREATE INDEX IF NOT EXISTS idx_channels_region ON channels(region);
CREATE INDEX IF NOT EXISTS idx_channels_youtube_id ON channels(youtube_channel_id);

-- Enable RLS (Row Level Security)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON channels
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users to manage channels" ON channels
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
