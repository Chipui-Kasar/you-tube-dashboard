-- Create channel_stats_logs table for storing historical statistics
CREATE TABLE IF NOT EXISTS channel_stats_logs (
  id BIGSERIAL PRIMARY KEY,
  channel_id BIGINT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  youtube_channel_id VARCHAR(255) NOT NULL,
  subscribers BIGINT NOT NULL,
  views BIGINT NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_stats_logs_channel_id ON channel_stats_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_stats_logs_youtube_id ON channel_stats_logs(youtube_channel_id);
CREATE INDEX IF NOT EXISTS idx_stats_logs_recorded_at ON channel_stats_logs(recorded_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE channel_stats_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access to stats logs" ON channel_stats_logs
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert stats logs" ON channel_stats_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
